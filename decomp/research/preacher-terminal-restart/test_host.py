"""Host-only guard tests. Never import Unicorn, application modules, or launch Node."""
import contextlib
import copy
import importlib.util
import io
import json
from pathlib import Path
import sys
import tempfile
import unittest
from unittest.mock import patch

HERE = Path(__file__).resolve().parent
spec = importlib.util.spec_from_file_location('restart_proof', HERE/'compare.py')
proof = importlib.util.module_from_spec(spec)
spec.loader.exec_module(proof)


class HostGuards(unittest.TestCase):
    def setUp(self):
        self.case = proof.fixed_case((HERE/'case-input.json').read_bytes())

    def state(self):
        c = self.case
        return {'fields':copy.deepcopy(c['person']),
            'raw':proof.pack_person(c['person'],c['commands']).hex(),
            'commands':list(c['commands']),'order':dict(c['order']),
            'orderRaw':proof.ORDER_HEX,
            'owner':{'personAddress':proof.P,'personId':3164,'orderId':26,'orderAddress':proof.ORDER},
            'cosmeticRandom':c['cosmeticRandom'],'simulationRandom':c['simulationRandom'],
            'controllerReturn':None,'objectIdCandidates':[97],'worldAnimationCounter':4245}

    def test_exact_projection_and_order(self):
        self.assertEqual(len(proof.FIELDS),45)
        raw = proof.pack_person(self.case['person'],self.case['commands'])
        self.assertEqual(len(raw),256)
        self.assertEqual(proof.sha(raw),proof.RAW_SHA)
        self.assertEqual(proof.ORDER,0x938934)
        self.assertEqual(raw[0x8b:0x8d],b'\x1a\x00')
        proof.check_state(self.state(),self.case)

    def test_case_budget_and_input_drift_fail(self):
        data = (HERE/'case-input.json').read_bytes()
        with self.assertRaises(proof.Blocked):
            proof.fixed_case(data.replace(b'"pairs": 3',b'"pairs": 4'))
        person = dict(self.case['person'])
        del person['maxLife']
        with self.assertRaises(proof.Blocked):
            proof.pack_person(person,self.case['commands'])

    def test_unmapped_bytes_and_both_rngs_are_checked(self):
        state = self.state()
        state['raw'] = '01'+state['raw'][2:]
        with self.assertRaisesRegex(proof.Blocked,'unmapped'):
            proof.check_state(state,self.case)
        for key in ['cosmeticRandom','simulationRandom']:
            state = self.state()
            state[key] ^= 1
            with self.assertRaisesRegex(proof.Blocked,'RNG'):
                proof.check_state(state,self.case)

    def test_command_and_owner_drift_fail(self):
        for mutate in [lambda s:s['commands'].__setitem__(1,1),
                       lambda s:s['order'].__setitem__('a',11000),
                       lambda s:s['owner'].__setitem__('orderId',1)]:
            state = self.state()
            mutate(state)
            with self.assertRaises(proof.Blocked):
                proof.check_state(state,self.case)

    def test_memory_guard_rejects_queue_rng_tables_and_unmapped_writes(self):
        for address,size in [(proof.ORDER,1),(proof.COSMETIC,4),(proof.SIMULATION,4),
                             (proof.P+0x8b,2),(proof.P+0x6c,2),(proof.P+0xc,5),
                             (proof.COUNTS,1),(proof.STACK+0xfff,2)]:
            self.assertFalse(proof.permitted_write(address,size,'controller'))
        self.assertTrue(proof.permitted_write(proof.P+0xc,4,'controller'))
        self.assertTrue(proof.permitted_write(proof.P+0x37,2,'updater'))
        self.assertFalse(proof.permitted_write(proof.P+0xc,4,'updater'))
        self.assertTrue(proof.permitted_write(proof.STACK-4,4,'controller'))

    def test_cdecl_argument_widths_preserve_raw_slot_evidence(self):
        slots = [proof.P+0x33,0x12340013,0x567800a0]
        self.assertEqual(proof.setter_arguments(0x4ee700,slots),[proof.P+0x33,19,160])
        self.assertEqual(slots,[proof.P+0x33,0x12340013,0x567800a0])
        self.assertEqual(proof.setter_arguments(0x4d4040,[proof.P,0xabcd005f]),[proof.P,95])
        with self.assertRaises(proof.Blocked):
            proof.setter_arguments(0x4ee700,[proof.P+0x33,19,168])

    def test_comparison_retains_raw_events_and_rng_differences(self):
        row = {'case':self.case['id'],'visit':1,'result':0,'events':[]}
        for phase in proof.PHASES:
            row[phase] = self.state()
        native = {'cases':[{'case':self.case['id'],'rows':[copy.deepcopy(row)]}]}
        port = copy.deepcopy(native)
        p = port['cases'][0]['rows'][0]
        p['afterController']['simulationRandom'] += 1
        p['afterUpdater']['raw'] = '01'+p['afterUpdater']['raw'][2:]
        p['events'] = [{'boundary':'lower-setter-intent','state':self.state()}]
        delta = proof.differences(native,port)[0]
        self.assertIn('simulationRandom',delta['phases']['afterController'])
        self.assertEqual(delta['phases']['afterUpdater']['rawByteOffsets'],[0])
        self.assertEqual(delta['events']['port'],p['events'])

    def test_timeout_streams_preserve_partial_bytes(self):
        with tempfile.TemporaryDirectory() as folder:
            output = Path(folder)
            proof.retain_port(output,b'{"partial":',b'error',{'status':'timed-out'})
            self.assertEqual((output/'port.stdout.json').read_bytes(),b'{"partial":')
            self.assertEqual(json.loads((output/'port-status.json').read_text())['status'],'timed-out')

    def test_postflight_failure_is_retained(self):
        with tempfile.TemporaryDirectory() as folder:
            root = Path(folder)
            (root/'preflight.json').write_bytes(b'{}')
            (root/'source').write_bytes(b'changed')
            manifest = {'sourceSha256':{'source':proof.sha(b'expected')},'inputSha256':{},'toolSha256':{}}
            with patch.object(proof,'ROOT',root),patch.object(proof,'HERE',root):
                result = proof.postflight(manifest,b'{}')
            self.assertEqual(result['status'],'blocked')
            self.assertEqual(result['checks'][1]['status'],'drift')

    def test_validation_cannot_execute_native_or_port(self):
        # Real fixed preflight, original EXE read/disassembled as data only.
        with patch.object(proof,'run_native',side_effect=AssertionError('native forbidden')), \
             patch.object(proof.subprocess,'run',side_effect=AssertionError('child forbidden')), \
             patch.dict(sys.modules,{'unicorn':None}), \
             patch.object(sys,'argv',['compare.py','--validate']),contextlib.redirect_stdout(io.StringIO()) as out:
            proof.main()
        self.assertEqual(json.loads(out.getvalue())['nativeExecution'],'not-run')


if __name__ == '__main__':
    unittest.main()
