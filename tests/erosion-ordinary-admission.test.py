"""Synthetic linked-byte admission checks only; no browser/native evidence."""
import copy
import importlib.util
import json
from pathlib import Path
import unittest

spec = importlib.util.spec_from_file_location('probe', Path(__file__).resolve().parents[1] / 'scripts/check-native-erosion-capture.py')
p = importlib.util.module_from_spec(spec); spec.loader.exec_module(p)


def runtime_fixture():
    root = '/synthetic/root'
    policy = {'applicationTree': 'b' * 40, 'limits': {'wallMs': 900000}}
    source_bytes = lambda commit, path: json.dumps(policy).encode() if path.endswith('/policy.json') else b'synthetic source'
    source = {'commit': 'a' * 40, 'fingerprint': 'c' * 64, 'root': root}
    paths = ['package-lock.json', 'scripts/local-render/harness.mjs', 'scripts/local-render/owned-profile.mjs', 'scripts/local-render/checkpoint-observer.mjs', 'scripts/local-render/vite.config.mjs']
    files = {path: p.digest(source_bytes(None, path)) for path in paths}
    files['node_modules/.package-lock.json'] = 'd' * 64
    server = {'node': 'v22', 'platform': 'linux', 'arch': 'x64', 'files': files,
              'packages': {root + '/node_modules/vite': {'name': 'vite', 'version': '8', 'files': {'bin/vite.js': 'e' * 64}}},
              'launcher': {'path': root + '/node_modules/.bin/vite', 'target': root + '/node_modules/vite/bin/vite.js', 'sha256': 'e' * 64}}
    plan = {'kind': 'erosion-ordinary-capture-launch-plan', 'operationalGrantReceived': True, 'sourceHead': source['commit'],
            'sourceFingerprint': source['fingerprint'], 'root': root, 'applicationTree': policy['applicationTree'], 'limits': policy['limits'],
            'restoreTested': False, 'scenarioSha256': 'f' * 64, 'profilePath': root + '/work/local-render-profiles/new',
            'serverIdentitySha256': p.digest(json.dumps(server, separators=(',', ':')).encode()), 'origin': 'http://127.0.0.1:4188'}
    plan_bytes = json.dumps(plan).encode()
    observations = [{'path': path, 'url': plan['origin'] + '/' + path, 'scriptId': str(i + 1), 'executionContextId': 1,
                     'cdpHash': '1' * 64, 'sourceMapSha256': '2' * 64, 'correspondence': 'exact'} for i, path in enumerate(p.MODULES)]
    receipt = {'source': source, 'profile': {'mode': 'created', 'path': plan['profilePath'], 'previousRun': None, 'checkpointAtStart': None, 'runId': 'synthetic-run'},
               'scenario': {'sha256': plan['scenarioSha256'], 'path': root + '/qa/erosion-ordinary/scenario.mjs'},
               'runtime': {'node': 'v22', 'platform': 'linux', 'arch': 'x64', 'installedLockSha256': 'd' * 64},
               'result': {'erosionReplay': {'serverIdentity': server, 'scriptObservations': observations, 'launchPlanSha256': p.digest(plan_bytes), 'restoreTested': False}}}
    modules = {path: {'servedBody': 'synthetic source'} for path in p.MODULES}
    return dict(plan_bytes=plan_bytes, plan=plan, receipt=receipt, modules=modules, source_bytes=source_bytes)


def input_fixture():
    actor = {'id': 46, 'kind': 'shaman', 'team': 'blue', 'hp': 100, 'x': -5, 'z': 115,
             'order': {'model': 27, 'a': 101, 'flags': 0}, 'state': 33, 'speed': 0, 'substate': 1}
    head = {'id': 101, 'x': -7, 'z': 115, 'work': 0, 'uses': 0, 'followers': 1}
    state = {'actor': actor, 'shrine': head, 'lastOrderTurn': 9, 'pointerAck': {'target': 101, 'until': 3}}
    hit = {'id': 101, 'x': 800, 'y': 600}
    ownership = {key: True for key in ('currentSceneMatches', 'currentWorldMatches', 'armedWorldMatches', 'armedCanvasMatches')}
    ownership['target'] = {'id': 101, 'kind': 'erosionEffect'}
    events = [{'type': kind, 'x': 800, 'y': 600, 'button': 0, 'trusted': True, 'canvasOwned': True, 'canvasTarget': True,
               'args': {key: False for key in ('ctrlKey', 'shiftKey', 'altKey', 'metaKey')}, 'state': ownership.copy(), 'after': ownership.copy(),
               'picks': [{'receiverMatches': True, 'id': 101}]} for kind in ('pointerdown', 'pointerup')]
    before = {**state, 'lastOrderTurn': 8, 'pointerAck': {'until': 2}}
    accepted = {'kind': 'worship-accepted', 'actorId': 46, 'hit': hit.copy(), 'before': before, 'after': state,
                'delivered': {'restored': True, 'errors': [], 'events': events}}
    worked = copy.deepcopy(state); worked['shrine']['work'] = 1
    actions = [{'kind': 'worship-click', 'actorId': 46, 'hit': hit.copy(), 'phase': phase} for phase in ('before', 'completed')]
    actions += [accepted, {'kind': 'worship-arrival', 'state': copy.deepcopy(state)}, {'kind': 'worship-work', 'state': worked}]
    for i, action in enumerate(actions): action['ordinal'] = i + 1
    capture = {'runId': 'synthetic-run', 'source': {'fingerprint': 'c' * 64}}
    inputs = {'kind': 'ordinary-m3-shaman-erosion-inputs', 'version': 1, 'restoreTested': False, 'runId': capture['runId'],
              'sourceFingerprint': capture['source']['fingerprint'], 'originalActorId': 46, 'initial': {'actor': copy.deepcopy(actor)}, 'actions': actions, 'final': {'complete': True}}
    return inputs, capture


class OrdinaryAdmissionTests(unittest.TestCase):
    def test_caller_pins_exact_external_terminal_source_and_run(self):
        receipt = runtime_fixture()['receipt']; data = json.dumps(receipt).encode()
        expected = {'receipt': p.digest(data), 'source': receipt['source']['commit'], 'fingerprint': receipt['source']['fingerprint'], 'run': 'synthetic-run'}
        p.admit_caller(data, receipt, expected)
        for key in expected:
            with self.subTest(key=key), self.assertRaises(ValueError):
                p.admit_caller(data, receipt, {**expected, key: '0' * 64})

    def test_complete_existing_runtime_records_validate_as_correspondence_only(self):
        p.admit_runtime(**runtime_fixture())

    def test_missing_mismatched_runtime_launch_compiler_and_script_records_reject(self):
        changes = [
            lambda f: f.update(plan_bytes=f['plan_bytes'] + b' '),
            lambda f: f['plan'].update(sourceHead='0' * 40),
            lambda f: f['plan'].update(serverIdentitySha256='0' * 64),
            lambda f: f['receipt']['profile'].update(mode='reused'),
            lambda f: f['receipt']['runtime'].update(installedLockSha256='0' * 64),
            lambda f: f['receipt']['result']['erosionReplay']['scriptObservations'].pop(),
            lambda f: f['receipt']['result']['erosionReplay']['scriptObservations'][0].update(url='http://wrong/app/erosion.ts'),
            lambda f: f['receipt']['result']['erosionReplay']['scriptObservations'][0].update(executionContextId=2),
            lambda f: f['receipt']['result']['erosionReplay']['scriptObservations'][0].update(cdpHash=''),
            lambda f: f['modules']['app/erosion.ts'].update(servedBody='arbitrary self-consistent text'),
        ]
        for index, change in enumerate(changes):
            f = runtime_fixture(); change(f)
            with self.subTest(index=index), self.assertRaises(ValueError): p.admit_runtime(**f)

    def test_ordinary_witnesses_and_single_dispatch_validate(self):
        p.admit_inputs(*input_fixture())

    def test_missing_identity_target_work_pointer_order_or_duplicate_dispatch_reject(self):
        changes = [
            lambda f: f['actions'].pop(),
            lambda f: f['actions'][2]['delivered']['events'][0]['state'].update(currentWorldMatches=False),
            lambda f: f['actions'][2]['delivered']['events'][0].update(x=799),
            lambda f: f['actions'][2]['delivered']['events'][0]['picks'][0].update(receiverMatches=False),
            lambda f: f['actions'][2]['after']['actor']['order'].update(a=102),
            lambda f: f['actions'][2]['after'].update(lastOrderTurn=8),
            lambda f: f['actions'][3]['state']['actor'].update(x=100),
            lambda f: f['actions'][4]['state']['shrine'].update(work=0),
            lambda f: f['actions'].append({**f['actions'][0], 'ordinal': 6}),
            lambda f: f.update(restoreTested=True),
        ]
        for index, change in enumerate(changes):
            inputs, capture = input_fixture(); change(inputs)
            with self.subTest(index=index), self.assertRaises(ValueError): p.admit_inputs(inputs, capture)


if __name__ == '__main__': unittest.main()
