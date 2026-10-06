"""Host-only input/guard/failure tests. Never import Unicorn/app or launch Node."""
import ast
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

HERE=Path(__file__).resolve().parent
spec=importlib.util.spec_from_file_location('turning_proof',HERE/'compare.py')
proof=importlib.util.module_from_spec(spec);spec.loader.exec_module(proof)


class HostGuards(unittest.TestCase):
    def setUp(self): self.case=proof.fixed_case((HERE/'proposal/case-input-proposal.json').read_bytes())

    def state(self):
        c=self.case
        records=[{'id':r['id'],'address':int(r['address'],16),'raw':r['raw256Hex'],
            'fields':dict(r['fields']),'commands':list(r['commands']),
            'cellNext':r['cellNext'],'cellPrevious':r['cellPrevious']} for r in c['records']]
        return {'fields':records[0]['fields'],'raw':records[0]['raw'],
            'commands':records[0]['commands'],'records':records,'topology':proof.supplied_topology(c),
            'order':dict(c['order']),'orderRaw':proof.ORDER_HEX,
            'owner':{'personAddress':proof.P,'personId':3164,'orderId':26,'orderAddress':proof.ORDER},
            'cosmeticRandom':c['cosmeticRandom'],'simulationRandom':c['simulationRandom'],
            'controllerReturn':None,'objectIdCandidates':[97],'sourceCandidates':[97],
            'worldAnimationCounter':4243}

    def test_exact_six_records_and_brave_type(self):
        self.assertEqual(len(proof.FIELDS),45)
        for r in self.case['records']:
            raw=proof.pack_record(r['fields'],r['commands'],r['cellNext'],r['cellPrevious'])
            self.assertEqual(len(raw),256);self.assertEqual(proof.sha(raw),r['raw256Sha256'])
        for r in self.case['records'][1:]:
            self.assertEqual([r['fields'][k] for k in ['model','physics','state','timer','object','draw']],
                [2,2,23,100,48,14])
        proof.check_state(self.state(),self.case,'native')

    def test_input_case_listener_and_schedule_mutations_fail(self):
        raw=(HERE/'proposal/case-input-proposal.json').read_bytes()
        for before,after in [(b'"caseCount": 1',b'"caseCount": 2'),
                             (b'"controllerUpdaterPairs": 3',b'"controllerUpdaterPairs": 4'),
                             (b'"model": 2',b'"model": 1'),(b'"value": 0',b'"value": 1')]:
            changed=raw.replace(before,after,1);self.assertNotEqual(raw,changed)
            with self.assertRaisesRegex(proof.Blocked,'Fixed input drift'): proof.fixed_case(changed)

    def test_raw_unknown_and_listener_writes_rejected(self):
        state=self.state();state['records'][1]['raw']='01'+state['records'][1]['raw'][2:]
        with self.assertRaisesRegex(proof.Blocked,'raw256'): proof.check_state(state,self.case,'native')
        state=self.state();r=state['records'][1];r['fields']['timer']=99
        r['raw']=proof.pack_record(r['fields'],r['commands'],r['cellNext'],r['cellPrevious']).hex()
        with self.assertRaisesRegex(proof.Blocked,'listener'): proof.check_state(state,self.case,'native')

    def test_topology_queue_and_both_rng_guards(self):
        mutations=[lambda s:s['topology']['nullObjectPointer'].__setitem__('value',proof.P),
            lambda s:s['order'].__setitem__('a',0),lambda s:s['commands'].__setitem__(1,27),
            lambda s:s.__setitem__('simulationRandom',4),lambda s:s.__setitem__('cosmeticRandom',4)]
        for mutate in mutations:
            state=self.state();mutate(state)
            with self.assertRaises(proof.Blocked):proof.check_state(state,self.case,'native')

    def test_unowned_field_mutation_rejected_even_when_raw_matches(self):
        state=self.state();state['fields']['animationMode']=2
        state['raw']=proof.pack_record(state['fields'],state['commands'],state['records'][0]['cellNext'],0).hex()
        state['records'][0]['raw']=state['raw']
        with self.assertRaisesRegex(proof.Blocked,'Unowned'):proof.check_state(state,self.case,'native')

    def test_write_allowlist_keeps_listeners_rng_queues_tables_readonly(self):
        for address,size in [(proof.P+256+0xb2,1),(proof.SIMULATION,4),(proof.COSMETIC,4),
                (proof.ORDER,1),(proof.P+0x8b,2),(proof.P+0x20,2),(proof.COUNTS,1),
                (proof.P+0xc,5),(proof.P+0x6c,2),(proof.P+0xa8,1),(0x890390,4)]:
            self.assertFalse(proof.permitted_write(address,size,'controller'))
        self.assertTrue(proof.permitted_write(proof.P+0xb2,1,'controller'))
        self.assertTrue(proof.permitted_write(proof.P+0x37,2,'updater'))
        self.assertFalse(proof.permitted_write(proof.P+0xc,4,'updater'))
        self.assertFalse(proof.permitted_write(proof.STACK+0xfff,2,'controller'))

    def test_reads_bind_null_slot_heads_tables_and_exclude_rng_unknown_maxlife(self):
        manifest=json.loads((HERE/'preflight.json').read_text())
        ranges=proof.allowed_reads(self.case,manifest)
        for address,size in [(0x890390,4),(0x5a70f4,1),(0x5a6fec,1),(0x5861b4,2)]:
            self.assertTrue(proof.covered(address,size,ranges))
        for address,size in [(proof.P+0x6c,2),(proof.P,1),(proof.COSMETIC,4),
            (proof.SIMULATION,4),(0x9608b6,1),(0x5861b6,2)]:
            self.assertFalse(proof.covered(address,size,ranges))

    def test_exact_cdecl_boundaries_reject_scope_changes(self):
        args=[proof.P,3,proof.STACK-44]
        self.assertEqual(proof.boundary_arguments(0x43abf0,args,self.case),args)
        self.assertEqual(proof.boundary_arguments(0x586074,[16,0],self.case),[16,0])
        for entry,slots in [(0x43abf0,[proof.P,5,proof.STACK-44]),
            (0x43abf0,[proof.P,3,proof.P]),(0x586074,[16,1]),(0x4da170,[proof.P+256]),
            (0x4d4ee0,[proof.P])]:
            with self.assertRaises(proof.Blocked):proof.boundary_arguments(entry,slots,self.case)

    def test_expected_terminal_mode_rng_and_assignment_are_distinct(self):
        native=proof.predicted_state(self.case,3,'afterUpdater','native')
        port=proof.predicted_state(self.case,3,'afterUpdater','port')
        self.assertEqual(native['fields']['assignment'],336)
        self.assertEqual(port['fields']['assignment'],336)
        self.assertEqual([native['fields']['animationMode'],port['fields']['animationMode']],[0,2])
        self.assertEqual([native['simulationRandom'],port['simulationRandom']],[3603658299,1607832750])
        self.assertEqual([proof.predicted_state(self.case,v,'afterUpdater','native')['fields']['f2'] for v in [1,2,3]],[4,5,0])

    def test_diff_retains_events_rng_and_each_record_byte(self):
        row={'case':self.case['id'],'visit':1,'result':0,'events':[]}
        for phase in proof.PHASES:row[phase]=self.state()
        native={'cases':[{'case':self.case['id'],'rows':[copy.deepcopy(row)]}]};port=copy.deepcopy(native)
        p=port['cases'][0]['rows'][0]
        p['afterController']['simulationRandom']+=1
        p['afterUpdater']['records'][1]['raw']='01'+p['afterUpdater']['records'][1]['raw'][2:]
        p['events']=[{'kind':'supplied','state':self.state()}]
        p['updaterReturn']={'type':'undefined','value':None}
        delta=proof.differences(native,port)[0]
        self.assertIn('simulationRandom',delta['phases']['afterController'])
        self.assertEqual(delta['phases']['afterUpdater']['recordRawByteOffsets'],[{'id':3165,'offsets':[0]}])
        self.assertEqual(delta['events']['port'],p['events'])
        self.assertEqual(delta['updaterReturn']['port'],p['updaterReturn'])

    def test_timeout_and_postflight_failures_are_retained(self):
        with tempfile.TemporaryDirectory() as folder:
            root=Path(folder)
            proof.retain_port(root,b'{"partial":',b'error',{'status':'timed-out'})
            self.assertEqual((root/'port.stdout.json').read_bytes(),b'{"partial":')
            (root/'preflight.json').write_bytes(b'{}');(root/'source').write_bytes(b'changed')
            manifest={'sourceSha256':{'source':proof.sha(b'expected')},'inputSha256':{},'toolSha256':{}}
            with patch.object(proof,'ROOT',root),patch.object(proof,'HERE',root):
                result=proof.postflight(manifest,b'{}')
            self.assertEqual(result['status'],'blocked');self.assertEqual(result['checks'][1]['status'],'drift')

    def test_validation_cannot_execute_native_or_port(self):
        with patch.object(proof,'run_native',side_effect=AssertionError('native forbidden')), \
             patch.object(proof.subprocess,'run',side_effect=AssertionError('child forbidden')), \
             patch.dict(sys.modules,{'unicorn':None}), \
             patch.object(sys,'argv',['compare.py','--validate']),contextlib.redirect_stdout(io.StringIO()) as out:
            proof.main()
        self.assertEqual(json.loads(out.getvalue())['nativeExecution'],'not-run')

    def test_no_top_level_unicorn_or_subprocess_execution(self):
        tree=ast.parse((HERE/'compare.py').read_text())
        for statement in tree.body:
            if isinstance(statement,(ast.Import,ast.ImportFrom)):
                self.assertNotIn('unicorn',ast.unparse(statement))
        self.assertEqual(proof.CALL_EDGES,{0x43ab52:0x43abf0,0x43ab62:0x4da170,0x43ae39:0x586074})


if __name__=='__main__':unittest.main()
