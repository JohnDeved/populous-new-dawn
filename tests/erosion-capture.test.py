"""Failure-first admission tests. All documents are synthetic schema fixtures.
No original binary, emulator, browser, profile or gameplay evidence is involved.
"""
import copy
import importlib.util
import json
from pathlib import Path
import unittest

spec = importlib.util.spec_from_file_location('erosion_capture', Path(__file__).resolve().parents[1] / 'scripts/check-native-erosion-capture.py')
probe = importlib.util.module_from_spec(spec)
spec.loader.exec_module(probe)


def fixture():
    source = {'commit': 'a' * 40, 'tree': 'b' * 40, 'fingerprint': 'c' * 64, 'status': '', 'untracked': [], 'trackedDiffSha256': probe.digest(b'')}
    hashes = {name: probe.digest(name.encode()) for name in ('capture', 'lifecycle', 'modules', 'inputs')}
    modules = {path: {'sourceSha256': probe.digest(b'test source'), 'servedBody': 'test served module', 'servedSha256': probe.digest(b'test served module')} for path in probe.MODULES}
    center = {'x': 63744, 'y': 35072, 'h': 100}
    capture = {'version': 1, 'kind': 'ordinary-m3-erosion-controller-inputs', 'level': 3, 'shrineId': 101, 'effectId': 400,
               'onsetTurn': 100, 'failure': None, 'detached': True, 'runId': 'synthetic-run', 'profileId': 'synthetic-profile',
               'source': {'commit': source['commit'], 'fingerprint': source['fingerprint']}, 'steps': []}
    for i in range(1, 65):
        state = lambda n: {'center': center.copy(), 'remaining': n, 'randomState': i, 'heights': [100] * 16384}
        capture['steps'].append({'turn': 100 + i, 'visit': {'ordinal': i, 'before': state(65 - i), 'after': state(64 - i),
            'alive': i < 64, 'completed': True, 'notifications': [{'kind': 'sound', 'completed': True}] if i < 64 else [], 'copyMilliseconds': 0.1}})
    effect = {'onsetTurn': 100, 'onset': {'id': 400, 'kind': 'erosion', 'remaining': 64, 'age': 0, 'center': center},
              'retired': {'turnBefore': 163, 'turnAfter': 164, 'remaining': 0, 'absentFromWorld': True},
              'samples': [[100 + i, 64 - i] for i in range(64)]}
    lifecycle = {'runId': capture['runId'], 'sourceFingerprint': source['fingerprint'], 'errors': [], 'speedViolations': [],
                 'erosion': {'shrineId': 101, 'initialUses': 0, 'armedAtTurn': 99, 'use': {'turn': 100, 'uses': 1}, 'effects': [effect]}}
    receipt = {'status': 'passed', 'errors': [], 'source': source, 'sourceAfter': copy.deepcopy(source),
               'runtime': {'browserSha256': 'd' * 64}, 'runtimeAfter': {'browserSha256': 'd' * 64},
               'scenario': {'sha256': 'e' * 64}, 'scenarioAfter': {'sha256': 'e' * 64},
               'profile': {'runId': capture['runId'], 'id': capture['profileId'], 'cleanupVerified': True, 'continuationVerified': True},
               'result': {'erosionReplay': {'files': hashes.copy(), 'sourceFingerprint': source['fingerprint'], 'runId': capture['runId']}}}
    return {'capture': capture, 'receipt': receipt, 'lifecycle': lifecycle, 'modules': modules, 'hashes': hashes,
            'source_bytes': lambda commit, path: b'test source'}


class AdmissionTests(unittest.TestCase):
    def test_duplicate_and_nonfinite_json_reject(self):
        for text in ('{"version": 1, "version": 1}', '{"height": NaN}', '{"height": Infinity}'):
            with self.subTest(text=text), self.assertRaises(ValueError):
                json.loads(text, object_pairs_hook=probe.strict_object, parse_constant=probe.reject_constant)

    def test_failure_first_missing_provenance_never_reaches_native(self):
        for field in ('source', 'runtime', 'scenario', 'profile', 'result'):
            f = fixture()
            f['receipt'].pop(field)
            with self.subTest(field=field), self.assertRaises(ValueError):
                probe.validate(**f)

    def test_wrong_source_runtime_artifacts_and_lifecycle_reject(self):
        mutations = [
            lambda f: f['receipt']['sourceAfter'].update(status='dirty'),
            lambda f: f['receipt']['runtimeAfter'].update(browserSha256='f' * 64),
            lambda f: f['receipt']['scenarioAfter'].update(sha256='f' * 64),
            lambda f: f['receipt']['profile'].update(cleanupVerified=False),
            lambda f: f['receipt']['result']['erosionReplay']['files'].update(capture='f' * 64),
            lambda f: f['capture'].update(runId='another'),
            lambda f: f['capture']['source'].update(commit='f' * 40),
            lambda f: f['modules']['app/erosion.ts'].update(servedBody='modified'),
            lambda f: f['modules']['app/erosion.ts'].update(sourceSha256='f' * 64),
            lambda f: f['lifecycle']['erosion'].update(armedAtTurn=100),
            lambda f: f['lifecycle']['erosion']['effects'][0]['onset'].update(id=401),
            lambda f: f['lifecycle']['erosion']['effects'][0]['retired'].update(absentFromWorld=False),
            lambda f: f['lifecycle']['errors'].append('diagnostic error'),
        ]
        for index, mutation in enumerate(mutations):
            f = fixture(); mutation(f)
            with self.subTest(mutation=index), self.assertRaises(ValueError):
                probe.validate(**f)

    def test_gaps_ranges_errors_callbacks_and_partial_captures_reject(self):
        mutations = [
            lambda f: f['capture'].update(failure='copy failure'),
            lambda f: f['capture'].update(detached=False),
            lambda f: f['capture']['steps'].pop(),
            lambda f: f['capture']['steps'][0].update(turn=102),
            lambda f: f['capture']['steps'][0]['visit'].update(ordinal=2),
            lambda f: f['capture']['steps'][0]['visit'].update(completed=False),
            lambda f: f['capture']['steps'][0]['visit']['before']['heights'].pop(),
            lambda f: f['capture']['steps'][0]['visit']['before']['heights'].__setitem__(0, 32768),
            lambda f: f['capture']['steps'][0]['visit']['before'].update(randomState=-1),
            lambda f: f['capture']['steps'][0]['visit']['before'].update(randomState=True),
            lambda f: f['capture']['steps'][0]['visit']['after']['center'].update(x=1),
            lambda f: f['capture']['steps'][0]['visit']['notifications'][0].update(completed=False),
            lambda f: f['capture']['steps'][0]['visit'].update(copyMilliseconds=float('nan')),
            lambda f: f['capture']['steps'][-1]['visit']['notifications'].append({'kind': 'sound', 'completed': True}),
        ]
        for index, mutation in enumerate(mutations):
            f = fixture(); mutation(f)
            with self.subTest(mutation=index), self.assertRaises(ValueError):
                probe.validate(**f)

    def test_complete_schema_validates_without_claiming_native_or_browser_proof(self):
        f = fixture()
        rows = probe.validate(**f)
        self.assertIs(rows, f['capture']['steps'])
        self.assertEqual(len(rows), 64)


if __name__ == '__main__':
    unittest.main()
