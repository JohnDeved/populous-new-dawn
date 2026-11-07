"""Supplied controls only. Does not observe /proc, call gh or import discovery code."""
import copy
import importlib.util
import hashlib
import json
from pathlib import Path
import tempfile
import unittest
from unittest.mock import patch

SPEC = importlib.util.spec_from_file_location('help_hosted_observer', Path(__file__).with_name('observe.py'))
observer = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(observer)


def fixture():
    head, base, merge, run_id = '1' * 40, observer.PARENT, '2' * 40, 123
    def pr(number, sha):
        return {'number': number, 'state': 'open', 'draft': True,
                'head': {'sha': sha, 'ref': 'reviewed-infrastructure', 'repo': {'full_name': observer.REPO}},
                'base': {'sha': base, 'ref': 'main', 'repo': {'full_name': observer.REPO}}}
    infra = pr(945, head)
    context = {'repository': observer.REPO, 'eventName': 'pull_request', 'sha': merge,
               'runId': str(run_id), 'attempt': '1',
               'event': {'pull_request': infra, 'action': 'labeled', 'sender': {'id': observer.OWNER},
                         'label': {'name': observer.LABEL_PREFIX + head}},
               'runner': {'environment': 'github-hosted', 'os': 'Linux', 'arch': 'X64'}, 'job': {}}
    run = {'id': run_id, 'run_attempt': 1, 'event': 'pull_request', 'status': 'in_progress', 'head_sha': head,
           'path': '.github/workflows/help-discovery-evidence.yml',
           'actor': {'id': observer.OWNER}, 'triggering_actor': {'id': observer.OWNER}}
    docs = {'infrastructure': copy.deepcopy(infra), 'main': {'sha': base},
            'infrastructureMerge': {'sha': merge, 'parents': [{'sha': base}, {'sha': head}]},
            'target': pr(943, observer.TARGET),
            'targetCommit': {'sha': observer.TARGET, 'tree': {'sha': observer.TREE},
                             'parents': [{'sha': observer.PARENT}]},
            'run': run, 'ledger': {'total_count': 1, 'workflow_runs': [copy.deepcopy(run)]},
            'jobs': {'total_count': 1, 'jobs': [{'run_id': run_id, 'run_attempt': 1,
                     'name': 'Observe hosted scope (no tests)', 'labels': ['ubuntu-24.04'],
                     'runner_name': 'supplied-fixture-runner'}]}}
    for status in observer.STATUSES:
        docs['active-' + status] = {'total_count': 0, 'workflow_runs': []}
    docs['active-in_progress'] = {'total_count': 1, 'workflow_runs': [copy.deepcopy(run)]}
    return context, docs


def write_complete_fixture(root, context, docs):
    (root / 'context.json').write_text(json.dumps(context))
    raw = {name: json.dumps(docs[name]).encode() for name in observer.REMOTE_NAMES}
    for name, data in raw.items():
        (root / f'round-0-{name}.json').write_bytes(data)
    identities = {name: {'bytes': len(data), 'sha256': hashlib.sha256(data).hexdigest()}
                  for name, data in raw.items()}
    (root / 'round-0-decision.json').write_text(json.dumps({'status': 'complete', 'round': 0,
        'calls': len(observer.REMOTE_NAMES), 'contextSha256': hashlib.sha256((root / 'context.json').read_bytes()).hexdigest(),
        'files': identities}))
    return observer.publish_collection(root, context,
        {'round': 0, 'raw': raw, 'calls': len(observer.REMOTE_NAMES)}, 100.0)


class SuppliedClock:
    def __init__(self):
        self.now = 0.0
        self.delays = []

    def __call__(self):
        return self.now

    def pause(self, seconds):
        self.delays.append(seconds)
        self.now += seconds


class ResamplingControls(unittest.TestCase):
    def collect(self, context, snapshots, mutate_fetch=None):
        self.calls, self.records, self.clock = [], [], SuppliedClock()
        def fetch(round_number, name, seconds):
            self.calls.append((round_number, name, seconds))
            self.clock.now += 0.01
            if mutate_fetch is not None:
                value = mutate_fetch(round_number, name, self.clock)
                if value is not None:
                    return value
            return json.dumps(snapshots[round_number][name]).encode()
        def record(number, decision, raw):
            self.records.append({'round': number, 'decision': copy.deepcopy(decision), 'raw': copy.deepcopy(raw)})
        return observer.collect_guard_sets(context, fetch, record, self.clock, self.clock.pause)

    def test_inconsistent_then_complete_uses_only_new_full_round(self):
        context, first = fixture()
        first['active-in_progress']['total_count'] = 2
        second = copy.deepcopy(first)
        second['active-in_progress']['total_count'] = 1
        second['jobs']['jobs'][0]['runner_name'] = 'new-full-round'
        before = copy.deepcopy(first)
        result = self.collect(context, [first, second])
        self.assertEqual(result['round'], 1)
        self.assertEqual(result['calls'], 26)
        self.assertEqual([name for round_number, name, _ in self.calls if round_number == 1], list(observer.REMOTE_NAMES))
        self.assertEqual(result['documents'], second)
        self.assertEqual(first, before)
        self.assertEqual(self.records[0]['raw']['active-in_progress'], json.dumps(first['active-in_progress']).encode())
        self.assertEqual(self.records[0]['decision']['status'], 'resample-inconsistent-counts')
        self.assertEqual(self.records[1]['decision']['status'], 'complete')
        self.assertEqual(self.clock.delays, [0.5])

    def test_three_inconsistent_rounds_exhaust(self):
        context, docs = fixture()
        docs['active-in_progress']['total_count'] = 2
        with self.assertRaisesRegex(ValueError, 'exhausted'):
            self.collect(context, [copy.deepcopy(docs) for _ in range(3)])
        self.assertEqual(len(self.calls), 39)
        self.assertEqual(len(self.records), 3)
        self.assertTrue(all(r['decision']['status'] == 'resample-inconsistent-counts' for r in self.records))
        self.assertEqual(self.clock.delays, [0.5, 0.5])

    def test_hard_failures_dominate_any_count_mismatch(self):
        def foreign(d):
            row = copy.deepcopy(d['run']); row.update(id=124, head_sha='4' * 40, status='queued')
            d['active-queued'] = {'total_count': 1, 'workflow_runs': [row]}
        def replay(d):
            row = copy.deepcopy(d['run']); row['id'] = 122
            d['ledger'] = {'total_count': 3, 'workflow_runs': [d['run'], row]}
        edits = [foreign, replay,
                 lambda d: d['main'].update(sha='3' * 40),
                 lambda d: d['ledger'].update(total_count=3, workflow_runs=[d['run'], copy.deepcopy(d['run'])]),
                 lambda d: d['active-queued'].update(total_count=True),
                 lambda d: d['active-queued'].update(total_count=101),
                 lambda d: d['ledger'].update(total_count=1, workflow_runs=[]),
                 lambda d: d['active-in_progress']['workflow_runs'][0].update(status='queued'),
                 lambda d: d['active-in_progress']['workflow_runs'][0].update(head_sha=None),
                 lambda d: d['jobs'].update(total_count=2),
                 lambda d: d['ledger']['workflow_runs'][0].update(status='completed')]
        for index, edit in enumerate(edits):
            with self.subTest(index=index):
                context, docs = fixture()
                docs['active-in_progress']['total_count'] = 2
                edit(docs)
                with self.assertRaises((ValueError, KeyError, TypeError)):
                    self.collect(context, [docs, fixture()[1]])
                self.assertEqual(len(self.calls), 13)
                self.assertEqual({row[0] for row in self.calls}, {0})
                self.assertEqual(self.records[0]['decision']['status'], 'blocked')
                self.assertEqual(self.clock.delays, [])

    def test_required_provenance_schema_is_terminal_even_with_mismatch(self):
        edits = []
        for value in (True, 1.0):
            edits += [lambda c, d, v=value: d['jobs'].update(total_count=v),
                      lambda c, d, v=value: d['run'].update(run_attempt=v),
                      lambda c, d, v=value: d['jobs']['jobs'][0].update(run_attempt=v),
                      lambda c, d, v=value: d['ledger']['workflow_runs'][0].update(run_attempt=v),
                      lambda c, d, v=value: d['active-in_progress']['workflow_runs'][0].update(run_attempt=v)]
        edits += [lambda c, d: d['jobs'].update(jobs={'unexpected': 'mapping'}),
                  lambda c, d: d['jobs'].update(jobs=[[]]),
                  lambda c, d: d['jobs']['jobs'][0].update(labels='ubuntu-24.04'),
                  lambda c, d: d['jobs']['jobs'][0].update(labels=['ubuntu-24.04', 1]),
                  lambda c, d: d['jobs']['jobs'][0].update(labels=['ubuntu-24.04', '']),
                  lambda c, d: d['jobs']['jobs'][0].update(runner_name=1),
                  lambda c, d: d['jobs']['jobs'][0].update(runner_name=True),
                  lambda c, d: d['jobs']['jobs'][0].update(runner_name=['runner']),
                  lambda c, d: d['jobs']['jobs'][0].update(runner_name=' '),
                  lambda c, d: d['jobs']['jobs'][0].update(run_id=123.0),
                  lambda c, d: d['run'].update(id=123.0),
                  lambda c, d: d['run']['actor'].update(id=float(observer.OWNER)),
                  lambda c, d: d['run']['triggering_actor'].update(id=float(observer.OWNER)),
                  lambda c, d: c['event']['sender'].update(id=float(observer.OWNER)),
                  lambda c, d: c.update(runId=123),
                  lambda c, d: d['infrastructure'].update(number=945.0),
                  lambda c, d: c['event']['pull_request'].update(number=945.0),
                  lambda c, d: d['target'].update(number=943.0),
                  lambda c, d: c.update(job=[])]
        for index, edit in enumerate(edits):
            with self.subTest(index=index):
                context, docs = fixture(); edit(context, docs)
                with self.assertRaises((ValueError, KeyError, TypeError)):
                    observer.validate_remote(context, docs)
                docs['active-in_progress']['total_count'] = 2
                with self.assertRaises((ValueError, KeyError, TypeError)):
                    self.collect(context, [docs, fixture()[1]])
                self.assertEqual(len(self.calls), 13)
                self.assertEqual(self.records[0]['decision']['status'], 'blocked')
                self.assertEqual(self.clock.delays, [])

    def test_foreign_active_run_cannot_be_erased_by_later_idle(self):
        context, first = fixture()
        first['ledger']['total_count'] = 2
        row = copy.deepcopy(first['run']); row.update(id=999, head_sha='5' * 40)
        first['active-in_progress']['workflow_runs'].append(row)
        first['active-in_progress']['total_count'] = 2
        with self.assertRaisesRegex(ValueError, 'Another repository run'):
            self.collect(context, [first, fixture()[1]])
        self.assertEqual(len(self.calls), 13)
        self.assertEqual(self.clock.delays, [])

    def test_http_auth_and_transport_failures_never_resample(self):
        for reason in ('HTTP 403', 'HTTP 401', 'transport timeout', 'file cap'):
            with self.subTest(reason=reason):
                context, docs = fixture()
                def fail(_, name, __):
                    if name == 'run':
                        raise OSError(reason)
                with self.assertRaises(OSError):
                    self.collect(context, [docs, docs], fail)
                self.assertEqual(len(self.calls), 6)
                self.assertEqual(len(self.records), 1)
                self.assertEqual(self.clock.delays, [])

    def test_parse_and_projected_byte_caps_never_resample(self):
        for payload in (b'{', b'x' * (observer.MAX_PROJECTED + 1)):
            with self.subTest(bytes=len(payload)):
                context, docs = fixture()
                with self.assertRaises(ValueError):
                    self.collect(context, [docs, docs], lambda _, name, __: payload if name == 'target' else None)
                self.assertEqual(len(self.calls), 4)
                self.assertEqual(self.clock.delays, [])

    def test_deadline_failure_stops_without_another_request(self):
        context, docs = fixture()
        def overdue(_, __, clock):
            clock.now = observer.COLLECTION_SECONDS + 1
        with self.assertRaisesRegex(ValueError, 'deadline'):
            self.collect(context, [docs, docs], overdue)
        self.assertEqual(len(self.calls), 1)
        self.assertEqual(self.clock.delays, [])

    def test_strict_validation_does_not_accept_resampling_candidate(self):
        context, docs = fixture()
        docs['active-in_progress']['total_count'] = 2
        before = copy.deepcopy(docs)
        self.assertEqual(observer.classify_remote_snapshot(context, docs)['status'], 'resample-inconsistent-counts')
        with self.assertRaisesRegex(ValueError, 'Incomplete run list'):
            observer.validate_remote(context, docs)
        self.assertEqual(docs, before)

    def test_valid_complete_collection_marker_and_exact_round(self):
        context, docs = fixture()
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            write_complete_fixture(root, context, docs)
            with patch.dict(observer.os.environ, {'PND_COLLECTOR_OUTCOME': 'success'}):
                self.assertEqual(observer.verified_collection(root, context, 100.0), docs)

    def test_missing_partial_stale_tampered_or_wrong_marker_never_observes_host(self):
        edits = [lambda root: (root / 'collection.json').unlink(),
                 lambda root: (root / 'collection.json').write_text('{'),
                 lambda root: (root / 'main.json').write_text('{}'),
                 lambda root: (root / 'round-0-main.json').write_text('{}'),
                 lambda root: self.edit_marker(root, round=1),
                 lambda root: self.edit_marker(root, finishedAt=0),
                 lambda root: self.edit_marker(root, head='8' * 40),
                 lambda root: self.edit_marker(root, calls=1)]
        for index, edit in enumerate(edits):
            with self.subTest(index=index), tempfile.TemporaryDirectory() as directory:
                context, docs = fixture(); root = Path(directory)
                write_complete_fixture(root, context, docs); edit(root)
                with patch.object(observer.sys, 'argv', ['observe.py', directory]), \
                     patch.dict(observer.os.environ, {'PND_COLLECTOR_OUTCOME': 'success'}), \
                     patch.object(observer.time, 'time', return_value=100.0), \
                     patch.object(observer, 'source_identities', return_value={'supplied': 'stable'}), \
                     patch.object(observer, 'observe_host') as host:
                    self.assertEqual(observer.main(), 3)
                    host.assert_not_called()
                self.assertEqual(json.loads((root / 'observation.json').read_text())['status'], 'blocked')

    def edit_marker(self, root, **updates):
        path = root / 'collection.json'; value = json.loads(path.read_text()); value.update(updates)
        path.write_text(json.dumps(value))

    def test_collector_non_success_never_uses_a_complete_looking_marker(self):
        for outcome in ('failure', 'cancelled', 'skipped', ''):
            with self.subTest(outcome=outcome), tempfile.TemporaryDirectory() as directory:
                context, docs = fixture(); root = Path(directory)
                write_complete_fixture(root, context, docs)
                with patch.object(observer.sys, 'argv', ['observe.py', directory]), \
                     patch.dict(observer.os.environ, {'PND_COLLECTOR_OUTCOME': outcome}), \
                     patch.object(observer.time, 'time', return_value=100.0), \
                     patch.object(observer, 'source_identities', return_value={'supplied': 'stable'}), \
                     patch.object(observer, 'observe_host') as host:
                    self.assertEqual(observer.main(), 3)
                    host.assert_not_called()


MOUNT = '29 22 0:27 / /sys/fs/cgroup rw,nosuid,nodev,noexec,relatime - cgroup2 cgroup rw\n'
MEMBERSHIP = '0::/system.slice/hosted-compute-agent.service\n'


class IdentityControls(unittest.TestCase):
    def reject(self, edit):
        context, docs = fixture()
        edit(context, docs)
        with self.assertRaises((ValueError, KeyError, TypeError)):
            observer.validate_remote(context, docs)

    def test_exact_metadata_event(self):
        context, docs = fixture()
        result = observer.validate_remote(context, docs)
        self.assertEqual(result['helpHead'], observer.TARGET)
        self.assertEqual(result['head'], '1' * 40)
        self.assertNotEqual(result['merge'], result['helpHead'])

    def test_target_reported_base_is_separate_from_live_main(self):
        for reported_base in (observer.PARENT, '3' * 40):
            with self.subTest(reported_base=reported_base):
                context, docs = fixture()
                live_main = '3' * 40
                context['event']['pull_request']['base']['sha'] = live_main
                docs['infrastructure']['base']['sha'] = live_main
                docs['main']['sha'] = live_main
                docs['infrastructureMerge']['parents'][0]['sha'] = live_main
                docs['target']['base']['sha'] = reported_base
                result = observer.validate_remote(context, docs)
                self.assertEqual(result['base'], live_main)
                self.assertEqual(result['helpReportedBase'], reported_base)
                self.assertEqual(result['helpParent'], observer.PARENT)

    def test_target_reported_base_still_requires_sha_main_and_repository(self):
        edits = [lambda d: d['target']['base'].update(sha='not-a-sha'),
                 lambda d: d['target']['base'].update(sha=None),
                 lambda d: d['target']['base'].update(ref='other'),
                 lambda d: d['target']['base']['repo'].update(full_name='other/repository')]
        for edit in edits:
            with self.subTest(edit=edits.index(edit)):
                self.reject(lambda _, docs: edit(docs))

    def test_wrong_actor(self):
        self.reject(lambda c, _: c['event']['sender'].update(id=1))

    def test_wrong_label(self):
        self.reject(lambda c, _: c['event']['label'].update(name='h943-v1:' + '1' * 40))

    def test_second_attempt(self):
        self.reject(lambda c, _: c.update(attempt='2'))

    def test_main_movement(self):
        self.reject(lambda _, d: d['main'].update(sha='3' * 40))

    def test_infrastructure_merge_confusion(self):
        self.reject(lambda _, d: d['infrastructureMerge'].update(sha=observer.TARGET))

    def test_changed_help_tree(self):
        self.reject(lambda _, d: d['targetCommit']['tree'].update(sha='3' * 40))

    def test_changed_help_parent(self):
        self.reject(lambda _, d: d['targetCommit'].update(parents=[{'sha': '3' * 40}]))

    def test_fork_target(self):
        self.reject(lambda _, d: d['target']['head']['repo'].update(full_name='other/repository'))

    def test_ready_is_rejected(self):
        self.reject(lambda _, d: d['target'].update(draft=False))

    def test_workflow_token_actor_is_rejected(self):
        self.reject(lambda _, d: d['run']['triggering_actor'].update(id=41898282))

    def test_prior_distinct_run_blocks_replay(self):
        def edit(_, docs):
            prior = copy.deepcopy(docs['run']); prior['id'] = 122
            docs['ledger'] = {'total_count': 2, 'workflow_runs': [docs['run'], prior]}
        self.reject(edit)

    def test_incomplete_ledger(self):
        self.reject(lambda _, d: d['ledger'].update(total_count=2))

    def test_duplicate_ledger(self):
        self.reject(lambda _, d: d['ledger'].update(total_count=2,
                    workflow_runs=[d['run'], copy.deepcopy(d['run'])]))

    def test_each_active_lane_is_complete_and_exclusive(self):
        for status in observer.STATUSES:
            with self.subTest(status=status):
                self.reject(lambda _, d: d['active-' + status].update(
                    total_count=1, workflow_runs=[{'id': 124}]))
                self.reject(lambda _, d: d['active-' + status].update(total_count=101))

    def test_container_job_rejected(self):
        self.reject(lambda c, _: c['job'].update(container={'id': 'container'}))

    def test_self_hosted_rejected(self):
        self.reject(lambda c, _: c['runner'].update(environment='self-hosted'))

    def test_incomplete_job_inventory(self):
        self.reject(lambda _, d: d['jobs'].update(total_count=2))


class ObservationControls(unittest.TestCase):
    def test_complete_own_ancestor_paths(self):
        result = observer.mapped_ancestors(MEMBERSHIP, MOUNT)
        self.assertEqual(result['paths'], ['/sys/fs/cgroup', '/sys/fs/cgroup/system.slice',
                         '/sys/fs/cgroup/system.slice/hosted-compute-agent.service'])

    def test_mixed_or_hidden_root_is_rejected(self):
        cases = [(MEMBERSHIP + '1:memory:/hidden\n', MOUNT),
                 ('0::/' + 'a' * 256 + '\n1:memory:/hidden\n', MOUNT),
                 (MEMBERSHIP, MOUNT.replace('0:27 / /sys', '0:27 /hidden /sys')),
                 (MEMBERSHIP, MOUNT + MOUNT.replace('29 22', '30 22')),
                 ('0::/system.slice/../hidden\n', MOUNT),
                 ('0::/system.slice/.\n', MOUNT)]
        for membership, mount in cases:
            with self.subTest(membership=membership, mount=mount):
                with self.assertRaises(ValueError):
                    observer.mapped_ancestors(membership, mount)

    def test_cgroup_submount_rejected(self):
        with self.assertRaises(ValueError):
            observer.mapped_ancestors(MEMBERSHIP, MOUNT + MOUNT.replace('/sys/fs/cgroup ',
                '/sys/fs/cgroup/system.slice '))

    def test_read_above_old_loop_limit_reaches_eof(self):
        with tempfile.TemporaryDirectory() as directory:
            path = Path(directory) / 'supplied.bin'
            data = b'x' * (600 * 1024); path.write_bytes(data)
            self.assertEqual(observer.read_regular(path, 1024 * 1024), data)

    def test_read_cap_rejects_extra_bytes(self):
        with tempfile.TemporaryDirectory() as directory:
            path = Path(directory) / 'supplied.bin'; path.write_bytes(b'xxxx')
            with self.assertRaises(ValueError): observer.read_regular(path, 3)

    def test_symlink_is_not_followed(self):
        with tempfile.TemporaryDirectory() as directory:
            target = Path(directory) / 'supplied.bin'; target.write_bytes(b'x')
            link = Path(directory) / 'link'; link.symlink_to(target)
            with self.assertRaises(OSError): observer.read_regular(link, 10)

    def test_source_failure_retains_terminal_receipt(self):
        with tempfile.TemporaryDirectory() as directory:
            with patch.object(observer.sys, 'argv', ['observe.py', directory]), \
                 patch.object(observer, 'source_identities', side_effect=ValueError('supplied drift')):
                self.assertEqual(observer.main(), 3)
            receipt = json.loads((Path(directory) / 'observation.json').read_text())
            self.assertEqual(receipt['status'], 'blocked')
            self.assertEqual(receipt['tests'], 'not-run')
            self.assertEqual(receipt['memoryQualification'], 'unqualified')

    def test_valid_guards_still_cannot_admit_tests(self):
        context, docs = fixture()
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            write_complete_fixture(root, context, docs)
            with patch.object(observer.sys, 'argv', ['observe.py', directory]), \
                 patch.dict(observer.os.environ, {'PND_COLLECTOR_OUTCOME': 'success'}), \
                 patch.object(observer.time, 'time', return_value=100.0), \
                 patch.object(observer, 'source_identities', return_value={'supplied': 'stable'}), \
                 patch.object(observer, 'observe_host', return_value={'expectedLayoutObserved': True,
                     'effectiveAvailableBytes': None, 'memoryQualification': 'unqualified'}):
                self.assertEqual(observer.main(), 0)
            receipt = json.loads((root / 'observation.json').read_text())
            self.assertEqual(receipt['status'], 'observed-not-qualified')
            self.assertEqual(receipt['tests'], 'not-run')
            self.assertEqual(receipt['memoryQualification'], 'unqualified')

    def test_source_drift_invalidates_metadata(self):
        context, docs = fixture()
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            write_complete_fixture(root, context, docs)
            with patch.object(observer.sys, 'argv', ['observe.py', directory]), \
                 patch.dict(observer.os.environ, {'PND_COLLECTOR_OUTCOME': 'success'}), \
                 patch.object(observer.time, 'time', return_value=100.0), \
                 patch.object(observer, 'source_identities', side_effect=[{'a': 1}, {'a': 2}]), \
                 patch.object(observer, 'observe_host', return_value={'expectedLayoutObserved': True}):
                self.assertEqual(observer.main(), 4)
            self.assertEqual(json.loads((root / 'observation.json').read_text())['status'], 'invalidated')


if __name__ == '__main__':
    unittest.main(verbosity=2)
