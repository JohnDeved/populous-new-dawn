"""Supplied controls only. Does not observe /proc, call gh or import discovery code."""
import copy
import importlib.util
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
    run = {'id': run_id, 'run_attempt': 1, 'event': 'pull_request', 'head_sha': head,
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
    docs['active-in_progress'] = {'total_count': 1, 'workflow_runs': [{'id': run_id}]}
    return context, docs


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
            (root / 'context.json').write_text(json.dumps(context))
            for name, value in docs.items(): (root / (name + '.json')).write_text(json.dumps(value))
            with patch.object(observer.sys, 'argv', ['observe.py', directory]), \
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
            (root / 'context.json').write_text(json.dumps(context))
            for name, value in docs.items(): (root / (name + '.json')).write_text(json.dumps(value))
            with patch.object(observer.sys, 'argv', ['observe.py', directory]), \
                 patch.object(observer, 'source_identities', side_effect=[{'a': 1}, {'a': 2}]), \
                 patch.object(observer, 'observe_host', return_value={'expectedLayoutObserved': True}):
                self.assertEqual(observer.main(), 4)
            self.assertEqual(json.loads((root / 'observation.json').read_text())['status'], 'invalidated')


if __name__ == '__main__':
    unittest.main(verbosity=2)
