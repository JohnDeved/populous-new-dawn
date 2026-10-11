"""Synthetic integration of the agreed observer-event schema. No native run."""
import copy
import importlib.util
import json
from pathlib import Path
import unittest

spec = importlib.util.spec_from_file_location('native_event_replay', Path(__file__).resolve().parents[1] / 'scripts/native-event-replay.py')
replay = importlib.util.module_from_spec(spec)
spec.loader.exec_module(replay)


def fixture():
    receipt = {'status': 'passed', 'abortedInstructions': [], **{name: [] for name in replay.STREAMS}}
    ordinal = 0

    def event(stream, **fields):
        nonlocal ordinal
        receipt[stream].append({'eventOrdinal': ordinal, **fields})
        ordinal += 1

    # Two synthetic REP iterations: one unknown dword read then four committed
    # byte writes. The independent PC contract prevents promoting these bytes.
    for iteration in range(2):
        event('memoryReads', pc='0x10', address=hex(0x200 + 4 * iteration), size=4, knownMask='0x0')
        for offset in range(4):
            event('memoryWrites', pc='0x10', address=hex(0x300 + 4 * iteration + offset), size=1, knownMask='0x0', committed=True)
    event('memoryWrites', pc='0x20', address='0x100', size=1, knownMask='0xff', committed=True)
    event('memoryReads', pc='0x21', address='0x100', size=1, knownMask='0xff')
    event('invalidationEvents', pc='0x30', target='memory', address='0x100', size=1, knownMask='0x0', reason='omitted fragment')
    event('invalidationEvents', pc='0x30', target='register', register='eflags', size=4, knownMask='0x400', reason='arithmetic flags invalidated')
    event('memoryReads', pc='0x21', address='0x100', size=1, knownMask='0x0')
    event('invalidationEvents', pc='0x40', target='memory', address='0x400', size=4, knownMask='0x0', reason='palette pointer scope expired')
    event('memoryReads', pc='0x41', address='0x400', size=4, knownMask='0x0')
    receipt['eventStream'] = {'schemaVersion': 1, 'ordering': 'observer', 'eventCount': ordinal, 'firstOrdinal': 0,
                              'lastOrdinal': ordinal - 1, 'counts': {name: len(receipt[name]) for name in replay.STREAMS}}
    contract = {'case': 'synthetic palette/reset schema integration', 'eventStream': copy.deepcopy(receipt['eventStream']),
                'memoryRanges': [['0x100', '0x500']], 'forbiddenPcRanges': [['0x30', '0x40']],
                'pcRules': {'memoryReads': {'0x10': {'sizes': [4]}, '0x21': {'sizes': [1]}, '0x41': {'sizes': [4]}},
                            'memoryWrites': {'0x10': {'sizes': [1], 'knownMasks': ['0x0']}, '0x20': {'sizes': [1]}}},
                'initialMemory': [{'address': '0x400', 'size': 4, 'knownMask': '0xffffffff', 'source': 'independently verified pointer fixture'}],
                'invalidationEvents': copy.deepcopy(receipt['invalidationEvents'])}
    return receipt, contract


def encoded(receipt):
    return json.dumps(receipt, separators=(',', ':')).encode()


def run(receipt, contract, receipt_hash=None, contract_hash=None):
    raw = encoded(receipt)
    return replay.replay_receipt(raw, receipt_hash or replay.digest(raw), contract, contract_hash or replay.contract_digest(contract))


class EventReplayTests(unittest.TestCase):
    def test_synthetic_integration_preserves_unknown_and_last_writer(self):
        receipt, contract = fixture()
        before = copy.deepcopy((receipt, contract))
        state = run(receipt, contract)
        self.assertEqual(state.counts, receipt['eventStream']['counts'])
        self.assertEqual(state.known_mask(0x300, 8), 0)
        self.assertEqual(state.known_mask(0x400, 4), 0)
        self.assertEqual(state.reads[2]['byteSources'], [('write', 10, '0x20')])
        self.assertEqual(state.reads[3]['byteSources'][0][:2], ('invalidation', 12))
        self.assertEqual(state.byte_sources(0x300, 2), [('write', 1, '0x10'), ('write', 2, '0x10')])
        self.assertEqual(state.byte_sources(0x110, 1), [('unknown',)])
        self.assertEqual(state.byte_writers(0x100, 1), [('write', 10, '0x20')])
        self.assertEqual(state.byte_writers(0x400, 4), [None] * 4)
        self.assertEqual(state.reads[3]['byteWriters'], [('write', 10, '0x20')])
        self.assertEqual((receipt, contract), before)

    def reject(self, mutate, message=None):
        receipt, contract = fixture()
        mutate(receipt, contract)
        with self.assertRaisesRegex(ValueError, message or '.'):
            run(receipt, contract)

    def test_duplicate_missing_reordered_and_noninteger_ordinals(self):
        mutations = [
            lambda r, c: r['memoryReads'][0].update(eventOrdinal=1),
            lambda r, c: r['memoryReads'][0].pop('eventOrdinal'),
            lambda r, c: r['memoryReads'][0].update(eventOrdinal=-1),
            lambda r, c: r['memoryReads'][0].update(eventOrdinal=True),
            lambda r, c: r['memoryReads'][0].update(eventOrdinal=0.0),
            lambda r, c: r['memoryReads'].reverse(),
            lambda r, c: r['memoryWrites'][0].update(eventOrdinal=99),
            lambda r, c: r['memoryWrites'][1].update(eventOrdinal=1),
        ]
        for mutation in mutations:
            with self.subTest(mutation=mutation):
                self.reject(mutation)

    def test_read_before_its_writer_fails_provenance(self):
        def mutate(r, c):
            r['memoryWrites'][-1]['eventOrdinal'] = 11
            r['memoryReads'][2]['eventOrdinal'] = 10
        self.reject(mutate, 'read provenance mismatch')

    def test_projection_timing_and_scope_expiration_are_independent(self):
        for index in (0, 2):
            def mutate(r, c):
                row = r['invalidationEvents'][index]
                read = r['memoryReads'][3 if index == 0 else 4]
                row['eventOrdinal'], read['eventOrdinal'] = read['eventOrdinal'], row['eventOrdinal']
            self.reject(mutate)
        self.reject(lambda r, c: r['memoryReads'][-1].update(knownMask='0xffffffff'), 'read provenance mismatch')
        self.reject(lambda r, c: r['invalidationEvents'][-1].update(address='0x410'), 'boundary contract')

    def test_uncommitted_and_aborted_write_shapes_fail(self):
        for committed in (False, 1, None, 'true'):
            self.reject(lambda r, c: r['memoryWrites'][0].update(committed=committed), 'uncommitted')
        self.reject(lambda r, c: r['memoryWrites'][0].pop('committed'), 'uncommitted')
        self.reject(lambda r, c: r.update(abortedInstructions=[{'pc': '0x10', 'attemptedWrites': [{'address': '0x300'}]}]), 'aborted')
        self.reject(lambda r, c: r.pop('abortedInstructions'), 'aborted')

    def test_removed_or_duplicated_rep_read_and_write_fail(self):
        for stream in ('memoryReads', 'memoryWrites'):
            self.reject(lambda r, c: r[stream].pop(0), 'count mismatch')
            self.reject(lambda r, c: r[stream].insert(0, r[stream][0]), 'count mismatch')

    def test_unknown_pc_forbidden_window_address_and_width_fail(self):
        self.reject(lambda r, c: r['memoryReads'][0].update(pc='0x99'), 'unapproved')
        def forbidden(r, c):
            r['memoryReads'][0]['pc'] = '0x31'
            c['pcRules']['memoryReads']['0x31'] = {'sizes': [4]}
        self.reject(forbidden, 'forbidden window')
        for address in ('0xff', '0x4ff', '-1', 1 << 32, True):
            self.reject(lambda r, c: r['memoryReads'][0].update(address=address))
        for size in (0, -1, 2, 100, True, 4.0):
            self.reject(lambda r, c: r['memoryReads'][0].update(size=size))

    def test_negative_oversize_and_coercible_masks_fail(self):
        for known in (-1, '0x100000000', True, 0.0, '0Xff', '255', None):
            self.reject(lambda r, c: r['memoryReads'][0].update(knownMask=known))
        self.reject(lambda r, c: r['memoryWrites'][0].update(knownMask='0x100'), 'width')

    def test_unknown_palette_promotion_fails_case_pc_contract(self):
        self.reject(lambda r, c: r['memoryWrites'][0].update(knownMask='0xff'), 'PC contract')
        # Read replay alone cannot infer instruction semantics; the independent
        # copy-PC mask rule is what prevents this promotion, not a native claim.
        self.reject(lambda r, c: r['memoryReads'][0].update(knownMask='0xffffffff'), 'provenance')

    def test_invalidation_cannot_create_knowledge(self):
        def mutate(r, c):
            r['invalidationEvents'][0].update(address='0x110', knownMask='0xff')
            c['invalidationEvents'] = copy.deepcopy(r['invalidationEvents'])
        self.reject(mutate, 'promotes unknown')

    def test_register_invalidation_contract_and_shape_only(self):
        for changes in ({'size': 1}, {'register': 'x87'}, {'knownMask': '0x100000000'}, {'reason': ''}, {'target': 'other'}, {'address': '0x100'}):
            self.reject(lambda r, c: r['invalidationEvents'][1].update(changes))
        self.reject(lambda r, c: r['invalidationEvents'][1].update(knownMask='0xffffffff'), 'boundary contract')

    def test_metadata_shape_counts_and_extent_fail_closed(self):
        for changes in ({'schemaVersion': True}, {'ordering': 'retirement'}, {'eventCount': True}, {'eventCount': 99}, {'firstOrdinal': 1}, {'lastOrdinal': 99}, {'extra': 1}):
            def mutate(r, c):
                r['eventStream'].update(changes)
                c['eventStream'] = copy.deepcopy(r['eventStream'])
            self.reject(mutate)
        self.reject(lambda r, c: r['eventStream']['counts'].update(memoryWrites=1), 'independent contract')
        self.reject(lambda r, c: r.pop('eventStream'), 'independent contract')

    def test_changed_hash_and_passed_status_cannot_authorize(self):
        receipt, contract = fixture()
        original_hash, original_contract_hash = replay.digest(encoded(receipt)), replay.contract_digest(contract)
        receipt['memoryWrites'][0]['knownMask'] = '0xff'
        with self.assertRaisesRegex(ValueError, 'receipt: hash mismatch'):
            run(receipt, contract, receipt_hash=original_hash)
        receipt, contract = fixture()
        contract['case'] = 'another case'
        with self.assertRaisesRegex(ValueError, 'contract: hash mismatch'):
            run(receipt, contract, contract_hash=original_contract_hash)
        with self.assertRaisesRegex(ValueError, 'invalid expected hash'):
            run(receipt, contract, receipt_hash='passed')

    def test_duplicate_json_keys_and_nonfinite_json_rejected(self):
        _, contract = fixture()
        for raw in (b'{"a":1,"a":2}', b'{"a":NaN}', b'{"a":Infinity}'):
            with self.assertRaises(ValueError):
                replay.replay_receipt(raw, replay.digest(raw), contract, replay.contract_digest(contract))

    def test_missing_contract_bad_initial_spans_and_partial_masks(self):
        self.reject(lambda r, c: c.pop('case'))
        self.reject(lambda r, c: c.update(memoryRanges=[['0x100', '0x500'], ['0x400', '0x600']]))
        self.reject(lambda r, c: c['initialMemory'].append(copy.deepcopy(c['initialMemory'][0])))
        receipt, contract = fixture()
        contract['initialMemory'][0]['knownMask'] = '0x000100ff'
        state = run(receipt, contract)
        self.assertEqual(state.known_mask(0x400, 4), 0)

    def test_empty_stream_and_historical_missing_ordinals(self):
        receipt, contract = fixture()
        for stream in replay.STREAMS:
            receipt[stream] = []
        receipt['eventStream'].update(eventCount=0, firstOrdinal=None, lastOrdinal=None, counts={name: 0 for name in replay.STREAMS})
        contract['eventStream'] = copy.deepcopy(receipt['eventStream'])
        contract['invalidationEvents'] = []
        self.assertEqual(run(receipt, contract).reads, [])
        receipt, contract = fixture()
        for stream in replay.STREAMS:
            for event in receipt[stream]:
                event.pop('eventOrdinal')
        with self.assertRaisesRegex(ValueError, 'eventOrdinal'):
            run(receipt, contract)


if __name__ == '__main__':
    unittest.main()
