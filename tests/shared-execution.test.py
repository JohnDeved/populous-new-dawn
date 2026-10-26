"""Pure/generated-files tests. No application, Git, pnpm, bwrap or child process.

Run with -I -B; the subprocess guard is installed before importing the candidate.
Live kernel qualification is a distinct explicitly released CLI stage.
"""
from contextlib import contextmanager
from dataclasses import asdict, replace
import copy
import errno
import importlib.util
import io
import json
import os
from pathlib import Path
import stat
import subprocess
import sys
import tempfile
import threading
import time
from types import SimpleNamespace
import unittest
from unittest.mock import patch

sys.dont_write_bytecode = True
ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / 'scripts/orchestration'))
GUARDS = [patch.object(subprocess, name, side_effect=AssertionError('Pure fixture attempted a subprocess'))
          for name in ('Popen', 'run', 'check_output', 'check_call', 'call')]
for guard in GUARDS:
    guard.start()
import shared_execution as execution
import state_serialization as serialization


class PureCase(unittest.TestCase):
    def setUp(self):
        parent = os.environ.get('PND_EXECUTION_FIXTURE_ROOT')
        if parent:
            Path(parent).mkdir(exist_ok=True)
        self.temp = tempfile.TemporaryDirectory(prefix='shared-execution-', dir=parent)
        self.root = Path(self.temp.name)

    def tearDown(self):
        self.temp.cleanup()

    def file(self, name, data=b'value'):
        path = self.root / name
        path.parent.mkdir(parents=True, exist_ok=True)
        path.write_bytes(data)
        return path

    def reference(self, path):
        return {'path': str(path), 'sha256': execution.file_identity(path)['sha256']}

    def reject(self, callable, *args, **kwargs):
        with self.assertRaises((ValueError, OSError, KeyError, TypeError)):
            callable(*args, **kwargs)

    def test_qualified_default_profile(self):
        limits = execution.BUILD_LIMITS
        self.assertEqual(limits.owner_rss_bytes, 3 * 1024**3)
        self.assertEqual((limits.v8_mib, limits.producer_seconds, limits.envelope_seconds), (1536, 300, 600))
        self.assertEqual(limits.raw_bytes, 32 * 1024**2)
        self.assertEqual(limits.inner_raw_bytes + limits.outer_raw_bytes, limits.raw_bytes)

    def test_limits_reject_nonfinite_boolean_zero_and_bad_envelope(self):
        for values in ({'sample_seconds': float('nan')}, {'owner_rss_bytes': True}, {'raw_bytes': 0},
                       {'outer_raw_bytes': 32 * 1024**2}, {'producer_seconds': 600}, {'sample_seconds': 2}):
            self.reject(execution.Limits, **values)

    def test_paths_are_explicit_normalized_nonroot(self):
        self.assertEqual(execution.exact_path(str(self.root)), self.root)
        for value in ('/', '.', '/tmp/../etc', '/tmp//double', '//tmp/value', 'relative', None):
            self.reject(execution.exact_path, value)

    def test_no_broad_or_special_tool_root(self):
        for name in ('/', '/usr', '/usr/bin', '/home/me/tools', '/proc/self', '/sys/kernel', '/dev/shm', '/etc/ssl'):
            self.assertFalse(execution.safe_tool_root(Path(name)), name)
        for name in ('/usr/lib', '/usr/bin/git', '/opt/tools/python'):
            self.assertTrue(execution.safe_tool_root(Path(name)), name)

    def test_pinned_json_hash_and_private_leaf(self):
        path = self.file('pins.json', b'{"version": 1}\n')
        reference = self.reference(path)
        self.assertEqual(execution.pinned_json(reference), {'version': 1})
        path.write_bytes(b'{"version": 2}\n')
        self.reject(execution.pinned_json, reference)
        os.link(path, self.root / 'alias')
        self.reject(execution.pinned_json, self.reference(path))

    def test_file_identity_rejects_symlink_and_hardlinked_private(self):
        path = self.file('source')
        link = self.root / 'link'
        link.symlink_to(path)
        self.reject(execution.file_identity, link)
        os.link(path, self.root / 'alias')
        self.reject(execution.file_identity, path, private=True)
        self.assertEqual(execution.file_identity(path)['key'][6], 2)

    def test_tree_inventory_never_follows_directory_links(self):
        self.file('outside/data', b'secret')
        tree = self.root / 'tree'
        tree.mkdir()
        (tree / 'link').symlink_to('../outside')
        rows = execution.tree_inventory(tree)
        self.assertEqual([row['path'] for row in rows], ['.', 'link'])
        self.assertEqual(rows[1]['target'], '../outside')

    def test_full_keys_detect_equal_byte_inode_replacement(self):
        path = self.file('state', b'same')
        before = execution.file_identity(path)
        self.file('replacement', b'same').replace(path)
        after = execution.file_identity(path)
        self.assertEqual(before['sha256'], after['sha256'])
        self.assertNotEqual(before['key'], after['key'])

    def test_private_inventory_rejects_hardlink_sentinel(self):
        self.file('private/sentinel')
        os.link(self.root / 'private/sentinel', self.root / 'private/alias')
        self.reject(execution.private_inventory, self.root / 'private')
        self.assertEqual((self.root / 'private/sentinel').read_bytes(), b'value')

    def test_private_links_must_be_exact_and_private(self):
        root = self.root / 'private'
        root.mkdir()
        (root / 'link').symlink_to('.pnpm/pkg')
        self.reject(execution.private_inventory, root)
        self.assertEqual(len(execution.private_inventory(root, allowed_links={'link': '.pnpm/pkg'})), 2)
        self.reject(execution.private_inventory, root, allowed_links={'link': '.pnpm/other'})

    def test_union_allocation_counts_hardlinks_once(self):
        a = self.file('a/source', b'x' * 8192)
        (self.root / 'b').mkdir()
        os.link(a, self.root / 'b/alias')
        expected = a.stat().st_blocks * 512 + sum((self.root / n).stat().st_blocks * 512 for n in ('a', 'b'))
        self.assertEqual(execution.union_allocation([self.root / 'a', self.root / 'b']), expected)

    def test_only_sampled_walk_tolerates_disappearing_private_temp(self):
        path = self.file('mutable/temporary')
        actual = Path.lstat
        def renamed(target, *args, **kwargs):
            if target == path:
                raise FileNotFoundError(str(path))
            return actual(target, *args, **kwargs)
        with patch.object(Path, 'lstat', renamed):
            self.assertGreaterEqual(execution.union_allocation([path.parent], sampled=True), 0)
            self.reject(execution.union_allocation, [path.parent])

    def test_sampled_walk_never_hides_permission_errors(self):
        root = self.root / 'private'
        root.mkdir()
        def denied(*args, **kwargs):
            kwargs['onerror'](PermissionError('unobservable private subtree'))
            return iter(())
        with patch.object(execution.os, 'walk', side_effect=denied):
            self.reject(execution.union_allocation, [root], sampled=True)

    def test_evidence_allocation_excludes_only_private_output_root(self):
        evidence = self.root / 'evidence'
        output = self.file('evidence/launch-root/dist/bundle', b'x' * 8192)
        self.file('evidence/private-cache/cache', b'x' * 4096)
        measured = execution.allocation_usage(evidence)
        self.assertEqual(measured['allocatedBytes'], execution.union_allocation([evidence]))
        self.assertEqual(measured['evidenceBytes'], measured['allocatedBytes'] -
                         execution.union_allocation([evidence / 'launch-root']))
        self.assertGreater(measured['evidenceBytes'], 0)

    def alias_fixture(self):
        path = self.file('original')
        before = {str(path): execution.file_identity(path)}
        aliases = {str(self.root / 'alias1'): str(path), str(self.root / 'alias2'): str(path)}
        for alias in aliases:
            os.link(path, alias)
        after = {name: execution.file_identity(name) for name in [*before, *aliases]}
        return before, after, aliases

    def test_alias_ledger_aggregates_expected_nlink_delta(self):
        before, after, aliases = self.alias_fixture()
        self.assertEqual(execution.validate_alias_transition(before, after, aliases),
                         {'newAliases': 2, 'uniqueChangedInodes': 1})

    def test_alias_ledger_does_not_hide_mtime_or_mode_drift(self):
        before, after, aliases = self.alias_fixture()
        for index in (2, 4, 7, 8):
            changed = json.loads(json.dumps(after))
            for row in changed.values():
                row['key'][index] += 1
            self.reject(execution.validate_alias_transition, before, changed, aliases)

    def test_non_alias_git_ctime_change_is_rejected(self):
        path = self.file('git-object')
        before = {str(path): execution.file_identity(path)}
        after = json.loads(json.dumps(before))
        after[str(path)]['key'][5] += 1
        self.reject(execution.validate_alias_transition, before, after, {})

    def test_alias_ledger_rejects_unknown_paths_and_copies(self):
        before, after, aliases = self.alias_fixture()
        self.reject(execution.validate_alias_transition, before, after, {})
        broken = json.loads(json.dumps(after))
        broken[next(iter(aliases))]['key'][1] += 1
        self.reject(execution.validate_alias_transition, before, broken, aliases)

    def state_bytes(self, timestamp=100, extra=None):
        return (json.dumps({'lastValidatedTimestamp': timestamp, 'projects': {}, 'pnpmfiles': [],
                           'settings': {'isolated': True}, 'filteredInstall': False, **(extra or {})},
                           indent=2) + '\n').encode()

    def test_actual_timestamp_only_transition(self):
        old, new = self.state_bytes(), self.state_bytes(201)
        receipt = execution.validate_state_transition(old, new, 200, 210, 199)
        self.assertEqual(receipt['after'], 201)
        self.assertEqual(receipt['afterSha256'], execution.sha_bytes(new))

    def test_state_rejects_stale_forged_and_out_of_interval(self):
        for value in (100, 99, 199, 211, True, 200.5):
            self.reject(execution.validate_state_transition, self.state_bytes(), self.state_bytes(value), 200, 210, 200)

    def test_state_rejects_changed_fields_and_whitespace(self):
        old = self.state_bytes()
        self.reject(execution.validate_state_transition, old, self.state_bytes(201, {'extra': 1}), 200, 210, 199)
        new = self.state_bytes(201).replace(b'  "settings"', b'   "settings"')
        self.reject(execution.validate_state_transition, old, new, 200, 210, 199)

    def test_state_rejects_duplicate_timestamp_marker(self):
        old = b'{"lastValidatedTimestamp": 100, "nested": {"lastValidatedTimestamp": 100}}'
        new = old.replace(b'100', b'201', 1)
        self.reject(execution.validate_state_transition, old, new, 200, 210, 199)

    def dependency_fixture(self):
        root = self.root / 'runtime'
        self.file('runtime/node_modules/.pnpm/pkg/node_modules/pkg/index.js', b'package')
        self.file('runtime/node_modules/' + execution.STATE, self.state_bytes())
        self.file('runtime/package.json', b'{"name":"fixture"}')
        return root

    def test_projected_identity_explains_one_row_without_weakening_helper(self):
        root = self.dependency_fixture()
        canonical, rows = execution.dependency_rows(root)
        projected = execution.projected_identity(canonical, rows, self.state_bytes(201))
        self.assertNotEqual(projected['inventorySha256'], canonical['inventorySha256'])
        self.assertEqual(projected['locks'], canonical['locks'])
        self.assertEqual(execution.runtime.dependency_identity(root), canonical)

    def test_projected_identity_rejects_unbound_rows(self):
        root = self.dependency_fixture()
        canonical, rows = execution.dependency_rows(root)
        self.reject(execution.projected_identity, canonical, rows[:-1], self.state_bytes(201))
        self.reject(execution.projected_identity, {**canonical, 'entries': 99}, rows, self.state_bytes(201))

    def test_private_state_projection_copies_no_package_or_wrapper_bytes(self):
        root = self.dependency_fixture()
        self.file('runtime/node_modules/.modules.yaml', b'private metadata')
        (root / 'node_modules/pkg').symlink_to('.pnpm/pkg/node_modules/pkg')
        target = self.root / 'projection'
        shape = execution.create_state_projection(root / 'node_modules', target)
        self.assertEqual((target / execution.STATE).read_bytes(), self.state_bytes())
        self.assertEqual((target / '.modules.yaml').read_bytes(), b'')
        self.assertEqual(list((target / '.pnpm').iterdir()), [])
        self.assertEqual(os.readlink(target / 'pkg'), '.pnpm/pkg/node_modules/pkg')
        execution.validate_private_projection(target, shape)
        self.reject(execution.create_state_projection, root / 'node_modules', target)

    def test_private_projection_rejects_leftover_atomic_temp(self):
        root = self.dependency_fixture()
        target = self.root / 'projection'
        shape = execution.create_state_projection(root / 'node_modules', target)
        (target / '.unexplained-temp').write_bytes(b'new')
        self.reject(execution.validate_private_projection, target, shape)

    def test_module_shape_rejects_external_link(self):
        root = self.dependency_fixture()
        (root / 'node_modules/escape').symlink_to(self.root)
        self.reject(execution.module_shape, root / 'node_modules')

    def mount_fixture(self):
        target = self.root / 'canonical/runtime'
        spec = {'runtime': {'path': str(target)}, 'source': {'path': str(self.root / 'canonical/source')},
                'gitObjects': [], 'tools': {'readonly': ['/usr/lib', '/usr/bin/dash']}}
        roots = {'assets': self.root / 'shared/assets'}
        inputs = {'topLevels': ['app', 'node_modules', execution.runtime.MANIFEST],
                  'roots': {str(self.root / 'canonical'): 'pin', str(self.root / 'shared'): 'pin'}}
        evidence = self.root / 'evidence'
        state = {'path': str(self.root / 'previous/modules-root' / execution.STATE)}
        shape = [{'name': '.pnpm', 'kind': 'directory'}, {'name': execution.STATE, 'kind': 'file'},
                 {'name': 'pkg', 'kind': 'link'}]
        return spec, roots, inputs, evidence, state, shape

    def test_run_mount_exposes_only_frozen_state_file(self):
        spec, roots, inputs, evidence, state, _ = self.mount_fixture()
        plan = execution.mount_plan(spec, roots, inputs, evidence, stage='run', state=state)
        self.assertIn(['ro', state['path'], spec['runtime']['path'] + '/node_modules/' + execution.STATE], plan['mounts'])
        self.assertFalse(any(row[1] == str(Path(state['path']).parent) for row in plan['mounts']))
        self.assertFalse(plan['networkNamespace'])
        self.assertTrue(plan['rootReadOnly'])

    def test_prepare_mount_has_no_writable_package_or_source_alias(self):
        spec, roots, inputs, evidence, _, shape = self.mount_fixture()
        plan = execution.mount_plan(spec, roots, inputs, evidence, stage='prepare-state', shape=shape)
        canonical = Path(spec['runtime']['path'])
        writable = [row for row in plan['mounts'] if row[0] == 'rw' and Path(row[2]).is_relative_to(canonical)]
        self.assertEqual(writable, [['rw', str(evidence / 'modules-root'), str(canonical / 'node_modules')]])
        self.assertIn(['ro', str(canonical / 'node_modules/.pnpm'), str(canonical / 'node_modules/.pnpm')], plan['mounts'])
        self.assertFalse(any(row[2] == str(evidence / 'modules-root') for row in plan['mounts']))

    def test_mount_rejects_broad_root_and_overlapping_writable_alias(self):
        spec, _, inputs, evidence, _, _ = self.mount_fixture()
        target = Path(spec['runtime']['path'])
        for mounts in ([['ro', '/', '/']], [['rw', str(self.root / 'canonical'), str(target)]],
                       [['ro', str(self.root), str(self.root)]],
                       [['rw', str(evidence / 'launch-root'), str(target)]]):
            stage = 'prepare-state'
            self.reject(execution.validate_mounts, mounts, evidence, [Path(p) for p in inputs['roots']], target, stage=stage)

    def test_environment_is_allowlisted_and_no_inherited_preload(self):
        spec = {'tools': {'python': '/opt/python/bin/python', 'node': '/opt/node/bin/node'},
                'runtime': {'path': '/owned/runtime'}}
        with patch.dict(os.environ, {'SECRET_TOKEN': 'never-copy', 'NODE_PATH': '/bad', 'NODE_OPTIONS': '--require bad'}):
            env = execution.clean_environment(spec, self.root, execution.BUILD_LIMITS)
        self.assertNotIn('SECRET_TOKEN', env)
        self.assertNotIn('NODE_PATH', env)
        self.assertEqual(env['NODE_OPTIONS'], '--max-old-space-size=1536')
        self.assertEqual(env['NPM_CONFIG_USERCONFIG'], '/dev/null')
        self.assertEqual(env['GIT_ALLOW_PROTOCOL'], '')

    def test_bwrap_command_never_binds_host_root_or_changes_network(self):
        spec, roots, inputs, evidence, state, _ = self.mount_fixture()
        spec['tools'].update(bwrap='/usr/bin/bwrap', python='/opt/python/bin/python')
        plan = execution.mount_plan(spec, roots, inputs, evidence, stage='run', state=state)
        args = execution.bubblewrap_command(spec, plan, evidence / 'control', ['/opt/node/bin/node', 'build'])
        self.assertIn('--unshare-pid', args)
        self.assertIn('--cap-drop', args)
        self.assertIn('--remount-ro', args)
        self.assertNotIn('--unshare-net', args)
        for index, arg in enumerate(args):
            if arg in ('--bind', '--ro-bind'):
                self.assertNotEqual(args[index + 1], '/')

    def test_plan_is_blocked_without_qualification_and_never_allocates(self):
        inputs = {'source': 'fixed', 'dependencies': 'strict'}
        spec = {'backend': None, 'state': None}
        with patch.object(execution, 'verify_inputs', return_value=(inputs, {})):
            plan, _ = execution.plan_execution(spec, execution.BUILD_LIMITS)
        self.assertEqual(plan['status'], 'blocked')
        self.assertEqual(len(plan['blockers']), 2)
        self.assertFalse(plan['allocates'])
        self.assertFalse(plan['executesPnpm'])
        self.assertEqual(list(self.root.iterdir()), [])

    def test_prepare_plan_does_not_require_or_adopt_old_state(self):
        with patch.object(execution, 'verify_inputs', return_value=({}, {})):
            plan, _ = execution.plan_execution({'backend': None, 'state': {'old': 'failure'}}, execution.BUILD_LIMITS,
                                               stage='prepare-state')
        self.assertEqual(len(plan['blockers']), 1)
        self.assertIsNone(plan['state'])

    def test_unqualified_execute_fails_before_creating_evidence(self):
        with patch.object(execution, 'plan_execution', return_value=({'blockers': ['not accepted']}, {})):
            self.reject(execution.execute_stage, {}, execution.BUILD_LIMITS, self.root / 'evidence', stage='run')
        self.assertEqual(list(self.root.iterdir()), [])

    def test_bounded_raw_capture_does_not_allocate_or_write_the_overflow(self):
        output = io.BytesIO()
        stored, complete = execution.write_bounded_raw(output, b'123456789', 0, 5)
        self.assertEqual((stored, complete, output.getvalue()), (5, False, b'12345'))
        stored, complete = execution.write_bounded_raw(output, b'new', stored, 5)
        self.assertEqual((stored, complete, output.getvalue()), (5, False, b'12345'))

    def test_small_text_is_opt_in_bounded_not_raw_log_slurp(self):
        path = self.file('small.raw', b'  version 11.25.0\n')
        self.assertEqual(execution.read_small_text(path, 32), 'version 11.25.0')
        self.reject(execution.read_small_text, path, 4)
        self.reject(execution.read_small_text, path, 65537)
        self.reject(execution.read_small_text, path, True)
        path.write_bytes(b'\xff')
        with self.assertRaises(UnicodeDecodeError):
            execution.read_small_text(path)

    def process_row(self, **kwargs):
        return {'pid': 123, 'startTicks': 1000, 'nspid': [123, 7], 'pidNamespace': 'pid:[200]',
                'state': 'R', **kwargs}

    def test_producer_clock_uses_real_birth_and_stops_after_absence(self):
        row = self.process_row()
        clock = execution.ProducerClock(row, clock=10.2, ticks_per_second=100)
        self.assertAlmostEqual(clock.sample([row], now=10.8), 0.8)
        self.assertAlmostEqual(clock.sample([], now=11), 1)
        self.assertEqual(clock.sample([], now=1000), 1)
        self.assertEqual(clock.report()['clock'], 'CLOCK_BOOTTIME')

    def test_producer_clock_stops_on_zombie_and_does_not_adopt_reused_pid(self):
        row = self.process_row()
        clock = execution.ProducerClock(row, clock=10.2, ticks_per_second=100)
        self.assertEqual(clock.sample([self.process_row(state='Z')], now=11), 1)
        self.assertEqual(clock.sample([self.process_row(startTicks=2000)], now=20), 1)

    def test_pid_namespace_binding_rejects_parent_namespace(self):
        watch = object.__new__(execution.OwnerWatch)
        watch.parent = {'pidNamespace': 'pid:[200]', 'nspid': [1]}
        watch.observe = lambda: [self.process_row(rss=20)]
        ready = {'startTicks': 1000, 'pid': 7, 'pidNamespace': 'pid:[200]'}
        self.reject(watch.bind_gate, ready, type('Direct', (), {'pid': 9})())

    def test_pid_namespace_binding_rejects_ambiguous_identity(self):
        watch = object.__new__(execution.OwnerWatch)
        watch.parent = {'pidNamespace': 'pid:[100]', 'nspid': [1]}
        watch.observe = lambda: [self.process_row(rss=20), self.process_row(pid=124, rss=20)]
        ready = {'startTicks': 1000, 'pid': 7, 'pidNamespace': 'pid:[200]'}
        self.reject(watch.bind_gate, ready, type('Direct', (), {'pid': 9})())

    def test_inner_capture_requires_unique_positive_executable_parent_binding(self):
        history = {'namespaces': {'pid:[200]'}, 'positiveRss': True, 'nspids': {(123, 7)},
                   'parents': {10}, 'executables': {'/node'}}
        watch = type('Watch', (), {'history': {(123, 1000): history}})()
        result = {'gateBinding': {'pidNamespace': 'pid:[200]', 'hostPid': 10},
                  'producer': {'identity': {'hostPid': 123, 'startTicks': 1000, 'namespacePid': 7, 'pidNamespace': 'pid:[200]'}}}
        receipt = {'capture': {'pid': 7}}
        self.assertEqual(execution.bind_inner_producer(watch, receipt, result, '/node'), result['producer']['identity'])
        self.reject(execution.bind_inner_producer, watch, receipt, result, '/other')
        watch.history[124, 1000] = history
        self.reject(execution.bind_inner_producer, watch, receipt, result, '/node')

    def sealed_fixture(self, *, extra=None, links=None):
        evidence = self.root / 'evidence'
        evidence.mkdir()
        (evidence / 'raw').write_bytes(b'bounded raw\n')
        if extra:
            extra(evidence)
        limits = replace(execution.BUILD_LIMITS, allocation_bytes=8 * 1024**2, evidence_bytes=4 * 1024**2)
        snapshot = {'availableBytes': 100 * 1024**3, 'freeInodes': 1000000, 'MemAvailable': 16 * 1024**3}
        with patch.object(execution, 'host_snapshot', return_value=snapshot):
            execution.seal_receipt(evidence, {'kind': 'fixture', 'error': None}, limits, time.monotonic() + 60, allowed_links=links)
        reference = {'terminal': self.reference(evidence / 'terminal.json'),
                     'finalBudget': self.reference(evidence / 'final-budget.json')}
        return evidence, reference

    def test_terminal_inclusive_final_seal_is_authoritative(self):
        evidence, reference = self.sealed_fixture()
        terminal = execution.verify_sealed_receipt(reference)
        self.assertEqual(terminal['kind'], 'fixture')
        seal = json.loads((evidence / 'final-budget.json').read_bytes())
        self.assertEqual(seal['terminalSha256'], reference['terminal']['sha256'])
        self.assertGreater(seal['allocatedBytesIncludingTerminal'], 0)

    def test_final_seal_rejects_artifact_replacement_even_with_equal_bytes(self):
        evidence, reference = self.sealed_fixture()
        self.file('replacement', b'bounded raw\n').replace(evidence / 'raw')
        self.reject(execution.verify_sealed_receipt, reference)

    def test_final_seal_rejects_unexpected_output(self):
        evidence, reference = self.sealed_fixture()
        (evidence / 'new-unsealed-file').write_bytes(b'unexpected')
        self.reject(execution.verify_sealed_receipt, reference)

    def test_seal_failed_overrides_apparent_pass(self):
        evidence, reference = self.sealed_fixture()
        (evidence / 'seal-failed.json').write_bytes(b'{}')
        self.reject(execution.verify_sealed_receipt, reference)

    def test_seal_has_no_historical_sentinel_hardlink_exemption(self):
        evidence = self.root / 'evidence'
        evidence.mkdir()
        (evidence / 'sentinel').write_bytes(b'x')
        os.link(evidence / 'sentinel', evidence / 'alias')
        self.reject(execution.seal_receipt, evidence, {'kind': 'fixture', 'error': None},
                    execution.BUILD_LIMITS, time.monotonic() + 60)
        self.assertFalse((evidence / 'terminal.json').exists())

    def test_seal_rejects_expired_envelope_before_scanning(self):
        evidence = self.root / 'evidence'
        evidence.mkdir()
        with patch.object(execution, 'private_inventory', side_effect=AssertionError('Must not scan after deadline')):
            self.reject(execution.seal_receipt, evidence, {'kind': 'fixture', 'error': None},
                        execution.BUILD_LIMITS, time.monotonic() - 1)

    def test_failed_terminal_cannot_be_adopted(self):
        evidence, reference = self.sealed_fixture()
        terminal_path = evidence / 'terminal.json'
        terminal = json.loads(terminal_path.read_bytes())
        terminal['error'] = 'failed attempt retained'
        terminal_path.write_bytes(execution.encoded(terminal))
        reference['terminal'] = self.reference(terminal_path)
        self.reject(execution.verify_sealed_receipt, reference)

    def test_production_layout_contains_no_generated_sentinels(self):
        evidence = self.root / 'production'
        execution.make_layout(evidence, stage='run')
        names = {path.name for path in evidence.iterdir()}
        self.assertFalse(any('fixture' in name or 'sentinel' in name for name in names))
        self.assertEqual(names, {*execution.PRIVATE_LEAVES, 'launch-root'})

    def test_cleanup_retains_kernel_handles_when_observation_fails(self):
        watch = object.__new__(execution.OwnerWatch)
        watch.lock = threading.RLock()
        watch.pidfds = {(123, 1000): 50, (124, 1001): 51}
        watch.direct_fds = [52]
        watch.observe = lambda: (_ for _ in ()).throw(OSError('procfs unavailable'))
        with patch.object(execution.signal, 'pidfd_send_signal') as send:
            watch.cleanup()
        self.assertEqual([call.args[0] for call in send.call_args_list], [50, 51, 52])

    def test_postverification_children_are_cleaned_before_observer_close(self):
        events = []
        target = self.root / 'runtime'
        target.mkdir()
        state_path = self.file('accepted-state', b'actual private state')
        state = {'path': str(state_path), 'identity': execution.file_identity(state_path), 'projectedDependencies': {'exact': True}}
        before = {'source': {'exact': True}, 'dependencies': {'canonical': True}}
        spec = {'runtime': {'path': str(target)}, 'source': {'path': str(self.root / 'source'), 'revision': 'a' * 40},
                'tools': {'python': '/python', 'node': '/node', 'pnpm': '/pnpm'}}
        class Watch:
            def __init__(self, *args): pass
            def cleanup(self): events.append('cleanup')
            def survivors(self): return []
            def check(self): pass
            def finish(self): events.append('finish')
            def report(self): return {'mockOnly': True}
        def payload(spec, mounts, evidence, command, *args, **kwargs):
            execution.save_new(evidence / 'receipt/build.json', {'command': ['/node', '/pnpm', 'run', 'build'],
                'sourceBefore': before['source'], 'sourceAfter': before['source'],
                'dependenciesBefore': state['projectedDependencies'], 'dependenciesAfter': state['projectedDependencies']})
            return {'exitCode': 0, 'stopReason': None}
        def verify(spec):
            events.append('postverify')
            return before, {}
        @contextmanager
        def quiet_envelope(seconds):
            yield time.monotonic() + 60
        with patch.object(execution, 'plan_execution', return_value=({'blockers': [], 'inputs': before, 'state': state}, {'assets': self.root / 'assets'})), \
             patch.object(execution, 'assert_capacity'), patch.object(execution, 'host_snapshot', return_value={}), \
             patch.object(execution, 'OwnerWatch', Watch), patch.object(execution, 'mount_plan', return_value={}), \
             patch.object(execution, 'run_payload', side_effect=payload), patch.object(execution, 'verify_raw_receipt', return_value=0), \
             patch.object(execution, 'bind_inner_producer'), patch.object(execution, 'verify_outputs', return_value={}), \
             patch.object(execution, 'verify_inputs', side_effect=verify), patch.object(execution, 'seal_receipt'), \
             patch.object(execution, 'envelope', side_effect=quiet_envelope):
            result = execution.execute_stage(spec, execution.BUILD_LIMITS, self.root / 'evidence', stage='run')
        self.assertEqual(result['status'], 'passed', result)
        self.assertGreater(events.index('finish'), events.index('postverify'))
        self.assertEqual(events[events.index('postverify') + 1:events.index('finish')], ['cleanup'])
        self.assertFalse((self.root / '.runtime.shared-execution-lock').exists())

    def test_late_join_failure_fails_execute_terminal_and_retains_lock(self):
        events = []
        target = self.root / 'runtime'
        target.mkdir()
        state_path = self.file('accepted-state', b'actual private state')
        state = {'path': str(state_path), 'identity': execution.file_identity(state_path), 'projectedDependencies': {'exact': True}}
        before = {'source': {'exact': True}, 'dependencies': {'canonical': True}}
        spec = {'runtime': {'path': str(target)}, 'source': {'path': str(self.root / 'source'), 'revision': 'a' * 40},
                'tools': {'python': '/python', 'node': '/node', 'pnpm': '/pnpm'}}
        class Watch:
            def __init__(self, *args): pass
            def cleanup(self): events.append('cleanup')
            def survivors(self): return []
            def check(self): pass
            def finish(self):
                events.append('finish')
                raise ValueError('late joined observer failure')
            def report(self): return {'mockOnly': True}
        def payload(spec, mounts, evidence, command, *args, **kwargs):
            execution.save_new(evidence / 'receipt/build.json', {'command': ['/node', '/pnpm', 'run', 'build'],
                'sourceBefore': before['source'], 'sourceAfter': before['source'],
                'dependenciesBefore': state['projectedDependencies'], 'dependenciesAfter': state['projectedDependencies']})
            return {'exitCode': 0, 'stopReason': None}
        def verify(spec):
            events.append('postverify')
            return before, {}
        @contextmanager
        def quiet_envelope(seconds):
            yield time.monotonic() + 60
        with patch.object(execution, 'plan_execution', return_value=({'blockers': [], 'inputs': before, 'state': state}, {'assets': self.root / 'assets'})), \
             patch.object(execution, 'assert_capacity'), patch.object(execution, 'host_snapshot', return_value={}), \
             patch.object(execution, 'OwnerWatch', Watch), patch.object(execution, 'mount_plan', return_value={}), \
             patch.object(execution, 'run_payload', side_effect=payload), patch.object(execution, 'verify_raw_receipt', return_value=0), \
             patch.object(execution, 'bind_inner_producer'), patch.object(execution, 'verify_outputs', return_value={}), \
             patch.object(execution, 'verify_inputs', side_effect=verify), patch.object(execution, 'seal_receipt') as seal, \
             patch.object(execution, 'envelope', side_effect=quiet_envelope):
            result = execution.execute_stage(spec, execution.BUILD_LIMITS, self.root / 'evidence', stage='run')
        self.assertEqual(result['status'], 'failed-or-unknown', result)
        self.assertIn('late joined observer failure', seal.call_args.args[1]['error'])
        self.assertGreater(events.index('finish'), events.index('postverify'))
        self.assertEqual(events[events.index('postverify') + 1:events.index('finish')], ['cleanup'])
        self.assertTrue((self.root / '.runtime.shared-execution-lock').exists())

    def observer_fault_result(self, failure=None, cleanup=None):
        record = execution.failure_record(execution.QualificationObservationFault('exact generated injection'))
        return {'exitCode': -9, 'stopReason': 'retained failure', 'failure': record if failure is None else failure,
                'cleanupFailure': record if cleanup is None else cleanup, 'survivors': None}

    def test_observer_fault_is_structured_for_direct_and_thread_first_ordering(self):
        direct = execution.failure_record(execution.QualificationObservationFault('direct snapshot encountered fault'))
        execution.require_qualifier_observer_failure(self.observer_fault_result(failure=direct))
        watch = object.__new__(execution.OwnerWatch)
        watch.lock = threading.RLock()
        watch.failure = watch.failure_marker = watch.unexpected_failure = None
        watch.fail('Observer thread encountered fault', fault_marker=direct['injectedFault'])
        with self.assertRaises(execution.QualificationObservationFault) as raised:
            watch.check()
        threaded = execution.failure_record(raised.exception)
        execution.require_qualifier_observer_failure(self.observer_fault_result(failure=threaded))
        self.assertEqual(threaded['injectedFault'], direct['injectedFault'])

    def test_ordinary_observer_error_text_cannot_qualify_generated_fault(self):
        for error in (RuntimeError('Observer failure'), OSError('exact generated injection'),
                      ValueError(execution.QUALIFIER_OBSERVER_FAULT)):
            record = execution.failure_record(error)
            self.assertIsNone(record['injectedFault'])
            self.reject(execution.require_qualifier_observer_failure, self.observer_fault_result(failure=record))

    def test_observer_qualifier_rejects_wrong_marker_type_and_unrelated_cleanup(self):
        result = self.observer_fault_result()
        for field, value in (('injectedFault', 'different-fault'), ('type', 'RuntimeError')):
            changed = json.loads(json.dumps(result))
            changed['failure'][field] = value
            self.reject(execution.require_qualifier_observer_failure, changed)
        result['cleanupFailure'] = execution.failure_record(PermissionError('unrelated cleanup denial'))
        self.reject(execution.require_qualifier_observer_failure, result)

    def test_observer_qualification_preserves_failed_unknown_payload(self):
        result = self.observer_fault_result()
        before = json.loads(json.dumps(result))
        execution.require_qualifier_observer_failure(result)
        self.assertEqual(result, before)
        self.assertIsNotNone(result['stopReason'])
        result['survivors'] = []
        self.reject(execution.require_qualifier_observer_failure, result)

    def private_pid_rows(self):
        return [{'pid': pid, 'ppid': 0 if pid == 1 else 1, 'startTicks': 100 + pid, 'rss': 4096,
                 'state': 'S', 'nspid': [pid], 'pidNamespace': 'pid:[200]'} for pid in (1, 7)]

    def test_private_pid_visibility_requires_exact_init_and_bound_gate(self):
        result = execution.validate_private_pid_visibility(self.private_pid_rows(), self_pid=7, namespace='pid:[200]')
        self.assertEqual(set(result), {1, 7})
        self.assertEqual(result[7]['startTicks'], 107)

    def test_private_pid_visibility_rejects_unknown_extra_and_out_of_bound_processes(self):
        rows = self.private_pid_rows()
        for bad in (rows[:1], rows + [{**rows[1], 'pid': 8, 'nspid': [8]}], rows * 17,
                    [rows[0], {**rows[1], 'pid': True}], [rows[0], {**rows[1], 'pid': 4194305}]):
            self.reject(execution.validate_private_pid_visibility, bad, self_pid=7, namespace='pid:[200]')

    def test_private_pid_visibility_rejects_host_namespace_unreadable_exit_and_reparent(self):
        for changes in ({'pidNamespace': 'pid:[100]'}, {'nspid': [123, 7]}, {'rss': 0}, {'state': 'Z'},
                        {'ppid': 0}, {'startTicks': 0}):
            rows = self.private_pid_rows()
            rows[1].update(changes)
            self.reject(execution.validate_private_pid_visibility, rows, self_pid=7, namespace='pid:[200]')

    def test_proc_root_aliases_include_every_visible_pid_not_only_self(self):
        identities = execution.validate_private_pid_visibility(self.private_pid_rows(), self_pid=7, namespace='pid:[200]')
        protected = self.root / 'generated-sentinels'
        paths = execution.proc_root_sentinel_paths(protected, identities)
        self.assertEqual(paths, [Path('/proc') / str(pid) / 'root' / str(protected / 'sentinel').lstrip('/') for pid in (1, 7)])
        self.reject(execution.proc_root_sentinel_paths, protected, {7: identities[7]})

    def test_proc_visibility_reader_is_bounded_before_member_inspection(self):
        ready = {'pid': 7, 'startTicks': 107, 'pidNamespace': 'pid:[200]'}
        entries = [Path('/proc') / str(pid) for pid in range(1, execution.QUALIFIER_MAX_VISIBLE_PIDS + 2)]
        with patch.object(Path, 'iterdir', return_value=iter(entries)), patch.object(execution, 'process_member') as member:
            self.reject(execution.private_proc_view, ready)
            member.assert_not_called()

    def test_proc_visibility_never_skips_disappearing_pid(self):
        ready = {'pid': 7, 'startTicks': 107, 'pidNamespace': 'pid:[200]'}
        with patch.object(Path, 'iterdir', return_value=iter([Path('/proc/1'), Path('/proc/7')])), \
             patch.object(execution, 'process_member', side_effect=FileNotFoundError('exited or replaced')):
            self.reject(execution.private_proc_view, ready)

    def test_proc_visibility_reader_retains_exact_gate_identity(self):
        ready = {'pid': 7, 'startTicks': 107, 'pidNamespace': 'pid:[200]'}
        rows = {row['pid']: row for row in self.private_pid_rows()}
        with patch.object(Path, 'iterdir', return_value=iter([Path('/proc/1'), Path('/proc/7')])), \
             patch.object(execution, 'process_member', side_effect=lambda pid: rows[pid]), \
             patch.object(execution.os, 'getpid', return_value=7):
            self.assertEqual(set(execution.private_proc_view(ready)), {1, 7})
        with patch.object(Path, 'iterdir', return_value=iter([Path('/proc/1'), Path('/proc/7')])), \
             patch.object(execution, 'process_member', side_effect=lambda pid: rows[pid]), \
             patch.object(execution.os, 'getpid', return_value=7):
            self.reject(execution.private_proc_view, {**ready, 'startTicks': 999})

    def test_readonly_alias_probe_first_requires_exact_readable_generated_sentinel(self):
        path = self.file('generated/sentinel', b'generated sentinel')
        expected = execution.inode_key(path.stat())
        execution.require_readable_sentinel(path, b'generated sentinel', expected)
        copy = self.file('generated/copy', b'generated sentinel')
        self.reject(execution.require_readable_sentinel, copy, b'generated sentinel', expected)
        self.reject(execution.require_readable_sentinel, path, b'different', expected)
        with patch.object(Path, 'open', side_effect=PermissionError('unreadable alias')):
            self.reject(execution.require_readable_sentinel, path, b'generated sentinel', expected)

    def test_state_profile_requires_exact_supported_workspace(self):
        root = self.root / 'runtime'
        self.file('runtime/package.json', b'{"packageManager":"pnpm@11.25.0"}')
        self.file('runtime/pnpm-workspace.yaml', execution.SUPPORTED_WORKSPACE)
        self.file('runtime/pnpm-lock.yaml', b'lock')
        self.file('runtime/node_modules/.pnpm/lock.yaml', b'lock')
        state = {'lastValidatedTimestamp': 1, 'projects': {str(root): {}}, 'pnpmfiles': [], 'settings': {}, 'filteredInstall': False}
        self.file('runtime/node_modules/' + execution.STATE, (json.dumps(state, indent=2) + '\n').encode())
        floor = execution.state_profile(root)
        self.assertGreater(floor, 0)
        (root / 'pnpm-workspace.yaml').write_bytes(b'verifyDepsBeforeRun: false # verifyDepsBeforeRun: error\n')
        self.reject(execution.state_profile, root)

    def test_seal_rejects_added_empty_directory(self):
        evidence, ref = self.sealed_fixture()
        (evidence / 'empty').mkdir()
        self.reject(execution.verify_sealed_receipt, ref)

    def test_seal_rejects_removed_empty_directory(self):
        evidence, ref = self.sealed_fixture(extra=lambda root: (root / 'empty').mkdir())
        (evidence / 'empty').rmdir()
        self.reject(execution.verify_sealed_receipt, ref)

    def test_seal_rejects_replaced_directory_inode(self):
        evidence, ref = self.sealed_fixture(extra=lambda root: (root / 'empty').mkdir())
        (evidence / 'empty').rename(self.root / 'preserved-empty')
        (evidence / 'empty').mkdir()
        self.reject(execution.verify_sealed_receipt, ref)

    def test_seal_rejects_symlink_inode_replacement_same_target(self):
        evidence, ref = self.sealed_fixture(extra=lambda root: (root / 'link').symlink_to('raw'), links={'link': 'raw'})
        (evidence / 'link').rename(self.root / 'preserved-link')
        (evidence / 'link').symlink_to('raw')
        self.reject(execution.verify_sealed_receipt, ref)

    def test_seal_rejects_symlink_target_change(self):
        evidence, ref = self.sealed_fixture(extra=lambda root: (root / 'link').symlink_to('raw'), links={'link': 'raw'})
        (evidence / 'link').rename(self.root / 'preserved-link')
        (evidence / 'link').symlink_to('other')
        self.reject(execution.verify_sealed_receipt, ref)

    def test_seal_rejects_root_inode_replacement(self):
        evidence, ref = self.sealed_fixture()
        old = self.root / 'preserved-root'
        evidence.rename(old)
        evidence.mkdir()
        for path in list(old.iterdir()):
            path.rename(evidence / path.name)
        self.reject(execution.verify_sealed_receipt, ref)

    def test_seal_rejects_allocation_growth_without_payload_change(self):
        evidence, ref = self.sealed_fixture()
        with patch.object(execution, 'allocation_usage', return_value={
                'allocatedBytes': 10**12, 'evidenceBytes': 10**12}):
            self.reject(execution.verify_sealed_receipt, ref)

    def fake_finished_watch(self, late_failure=None, *, first_expected=False, alive=False):
        watch = object.__new__(execution.OwnerWatch)
        watch.lock = threading.RLock()
        watch.failure = watch.failure_marker = watch.unexpected_failure = None
        watch.closed = threading.Event()
        watch.stream = io.BytesIO()
        watch.limits = execution.BUILD_LIMITS
        watch.namespace_fds, watch.pidfds, watch.direct_fds = [], {}, []
        watch.procdirs = {}; watch.handles_closed = False
        if first_expected:
            watch.fail('expected injection', fault_marker=execution.QUALIFIER_OBSERVER_FAULT)
        class Thread:
            def join(self, timeout):
                if late_failure:
                    watch.fail(late_failure)
            def is_alive(self): return alive
        watch.thread = Thread()
        return watch

    def test_finish_checks_health_after_join_not_before(self):
        watch = self.fake_finished_watch('failure during join')
        watch.check()
        self.reject(execution.finish_observer, watch)
        self.assertTrue(watch.stream.closed)

    def test_qualifier_join_rejects_unrelated_late_failure_after_expected_fault(self):
        watch = self.fake_finished_watch('unrelated late failure', first_expected=True)
        self.reject(execution.finish_observer, watch, expected_fault=True, result=self.observer_fault_result())
        self.assertEqual(watch.failure_marker, execution.QUALIFIER_OBSERVER_FAULT)
        self.assertEqual(watch.unexpected_failure, 'unrelated late failure')

    def test_qualifier_join_accepts_only_exact_expected_fault(self):
        watch = self.fake_finished_watch(first_expected=True)
        execution.finish_observer(watch, expected_fault=True, result=self.observer_fault_result())
        watch = self.fake_finished_watch(first_expected=True)
        self.reject(execution.finish_observer, watch, expected_fault=False)

    def test_join_rejects_thread_not_stopped(self):
        watch = self.fake_finished_watch(alive=True)
        self.reject(execution.finish_observer, watch)

    def qualification_fixture(self):
        roots = {'/opt/backend': 'a' * 64, '/opt/app': 'b' * 64}
        tools = {'python': '/opt/backend/python', 'bwrap': '/opt/backend/bwrap',
                 'node': '/opt/app/node', 'pnpm': '/opt/app/pnpm', 'readonly': list(roots)}
        digest = execution.file_identity(execution.__file__)['sha256']
        acceptance = {'version': execution.VERSION, 'kind': 'shared-execution-backend-acceptance',
                      'status': 'accepted', 'adapterSha256': digest, 'platform': sys.platform,
                      'capabilities': list(execution.CAPABILITIES), 'qualification': {}}
        terminal = {'kind': 'shared-execution-qualification', 'error': None, 'adapterSha256': digest,
                    'capabilities': list(execution.CAPABILITIES), 'tools': roots,
                    'selectedBackend': {name: tools[name] for name in ('python', 'bwrap')}}
        return tools, acceptance, terminal

    def qualify_mock(self, tools, acceptance, terminal, inventories=None):
        inventories = terminal['tools'] if inventories is None else inventories
        with patch.object(execution, 'pinned_json', return_value=acceptance), \
             patch.object(execution, 'verify_sealed_receipt', return_value=terminal), \
             patch.object(execution, 'inventory_hash', side_effect=lambda path: inventories[str(path)]):
            return execution.backend_qualification({}, tools)

    def test_backend_requires_same_selected_python_and_bwrap(self):
        for name in ('python', 'bwrap'):
            tools, acceptance, terminal = self.qualification_fixture()
            tools[name] += '-different'
            self.reject(self.qualify_mock, tools, acceptance, terminal)

    def test_backend_rejects_added_removed_or_duplicate_tool_roots(self):
        for change in ('add', 'remove', 'duplicate'):
            tools, acceptance, terminal = self.qualification_fixture()
            if change == 'add': tools['readonly'].append('/opt/new')
            elif change == 'remove': tools['readonly'].pop()
            else: tools['readonly'].append(tools['readonly'][0])
            self.reject(self.qualify_mock, tools, acceptance, terminal)

    def test_backend_rejects_changed_bytes_in_same_tool_root(self):
        tools, acceptance, terminal = self.qualification_fixture()
        self.reject(self.qualify_mock, tools, acceptance, terminal, {'/opt/backend': 'c' * 64, '/opt/app': 'b' * 64})

    def test_backend_accepts_prequalified_app_roots_not_postqualification_additions(self):
        tools, acceptance, terminal = self.qualification_fixture()
        self.assertEqual(self.qualify_mock(tools, acceptance, terminal), acceptance)

    def test_late_join_failure_fails_qualifier_terminal(self):
        python = str(Path(sys.executable).resolve())
        roots = [str(execution.HERE), str(Path(python).parent)]
        tools = {'python': python, 'node': python, 'pnpm': python, 'bwrap': python,
                 'readonly': roots, 'pnpmVersion': 'not-executed-sentinel-only'}
        limits = replace(execution.BUILD_LIMITS, envelope_seconds=120, producer_seconds=10,
                         owner_rss_bytes=256 * 1024**2, allocation_bytes=16 * 1024**2,
                         raw_bytes=4 * 1024**2, evidence_bytes=8 * 1024**2)
        spec = {'version': execution.VERSION, 'kind': 'shared-execution-qualification-spec',
                'tools': tools, 'toolRoots': {path: 'a' * 64 for path in roots}, 'limits': asdict(limits)}
        class Watch:
            def __init__(self, *args): self.snapshot = lambda: {}
            def cleanup(self): pass
            def survivors(self): return []
            def finish(self, *, cleanup_deadline=None, receipt=None):
                raise ValueError('late qualifier observer failure')
            def report(self): return {'failure': 'late qualifier observer failure'}
        with patch.object(execution, 'pinned_json', return_value=spec), \
             patch.object(execution, 'inventory_hash', return_value='a' * 64), \
             patch.object(execution, 'safe_tool_root', return_value=True), \
             patch.object(execution, 'assert_capacity'), patch.object(execution, 'host_snapshot', return_value={}), \
             patch.object(execution, 'OwnerWatch', Watch), \
             patch.object(execution, 'run_payload', return_value={'exitCode': 0, 'stopReason': None, 'survivors': []}), \
             patch.object(execution, 'seal_receipt') as seal:
            result = execution.qualify_backend({}, self.root / 'qualifier', execution.file_identity(execution.__file__)['sha256'])
        self.assertEqual(result['status'], 'failed-or-unknown')
        self.assertIn('late qualifier observer failure', seal.call_args.args[1]['error'])
        self.assertEqual(seal.call_args.args[1]['capabilities'], [])


def generated_state(timestamp=100):
    """Synthetic pnpm profile, independent of any installed workspace or receipt."""
    return {
        'lastValidatedTimestamp': timestamp,
        'projects': {'/generated/workspace': {'name': 'generated-fixture', 'version': '1.0.0'}},
        'pnpmfiles': [],
        'settings': {
            'enableGlobalVirtualStore': False, 'autoInstallPeers': True, 'catalogs': {},
            'dedupeDirectDeps': False, 'dedupeInjectedDeps': True,
            'dedupePeerDependents': True, 'dedupePeers': True, 'dev': True,
            'excludeLinksFromLockfile': False, 'hoistPattern': ['*'],
            'hoistWorkspacePackages': True, 'injectWorkspacePackages': False,
            'linkWorkspacePackages': False, 'minimumReleaseAge': 1440,
            'minimumReleaseAgeIgnoreMissingTime': False, 'nodeLinker': 'isolated',
            'optional': True, 'peersSuffixMaxLength': 1000, 'preferWorkspacePackages': False,
            'production': True, 'publicHoistPattern': [], 'workspacePackagePatterns': ['.'],
        },
        'filteredInstall': False,
    }


class StateSerializationCase(unittest.TestCase):
    def setUp(self):
        self.before = generated_state()
        self.after = generated_state(201)
        self.compact = serialization.compact(self.before)
        self.pretty = serialization.pnpm_bytes(self.after)

    def transition(self, before=None, after=None, **bounds):
        return execution.validate_state_transition(
            self.compact if before is None else before,
            self.pretty if after is None else after,
            bounds.get('start', 200), bounds.get('end', 210), bounds.get('floor', 199))

    def reject(self, before=None, after=None, **bounds):
        with self.assertRaises((ValueError, TypeError, OverflowError)):
            self.transition(before, after, **bounds)

    def test_compact_to_pnpm_pretty_preserves_exact_values(self):
        receipt = self.transition()
        self.assertEqual(receipt['serializationProfile'], 'sorted-compact-to-pnpm-v11')
        self.assertEqual((receipt['before'], receipt['after']), (100, 201))
        self.assertEqual(receipt['beforeSha256'], execution.sha_bytes(self.compact))
        self.assertEqual(receipt['afterSha256'], execution.sha_bytes(self.pretty))
        self.assertEqual(serialization.decode(self.pretty), self.after)

    def test_legacy_pretty_timestamp_replacement_remains_supported(self):
        old = serialization.pnpm_bytes(self.before)
        self.assertEqual(self.transition(old)['serializationProfile'], 'exact-two-space-timestamp')

    def test_compact_profile_requires_exact_top_and_settings_order_on_output(self):
        state = serialization.decode(self.pretty)
        self.assertEqual(tuple(state), serialization.TOP)
        self.assertEqual(tuple(state['settings']), serialization.SETTINGS)
        wrong = (json.dumps(self.after, sort_keys=True, indent=2) + '\n').encode()
        self.assertNotEqual(wrong, self.pretty)
        self.reject(after=wrong)

    def test_compact_output_is_not_a_pnpm_transition(self):
        self.reject(after=serialization.compact(self.after))

    def test_expected_bytes_are_derived_from_old_not_new_values(self):
        for key, value in (('autoInstallPeers', 1), ('minimumReleaseAge', 1440.0)):
            with self.subTest(key=key):
                changed = copy.deepcopy(self.after)
                changed['settings'][key] = value
                self.assertEqual(changed, self.after)  # Python equality is insufficient.
                self.reject(after=serialization.pnpm_bytes(changed))

    def test_legacy_pretty_rejects_boolean_integer_alias(self):
        changed = copy.deepcopy(self.after)
        changed['settings']['autoInstallPeers'] = 1
        self.reject(serialization.pnpm_bytes(self.before), serialization.pnpm_bytes(changed))

    def test_rejects_changed_non_timestamp_value(self):
        changed = copy.deepcopy(self.after)
        changed['settings']['minimumReleaseAge'] += 1
        self.reject(after=serialization.pnpm_bytes(changed))

    def test_rejects_boolean_or_float_timestamp(self):
        for value in (True, 201.0):
            changed = copy.deepcopy(self.after)
            changed['lastValidatedTimestamp'] = value
            with self.subTest(value=value):
                self.reject(after=serialization.pnpm_bytes(changed))

    def test_timestamp_must_advance_within_actual_interval_and_floor(self):
        for value in (99, 100, 199, 211):
            with self.subTest(value=value):
                self.reject(after=serialization.pnpm_bytes(generated_state(value)))
        self.reject(floor=201)
        self.reject(start=202, end=201)

    def test_rejects_duplicate_top_level_input_key(self):
        duplicate = self.compact.replace(b'"filteredInstall":false',
                                        b'"filteredInstall":false,"filteredInstall":false')
        self.reject(before=duplicate)

    def test_rejects_duplicate_nested_input_key(self):
        duplicate = self.compact.replace(b'"autoInstallPeers":true',
                                        b'"autoInstallPeers":true,"autoInstallPeers":true')
        self.reject(before=duplicate)

    def test_rejects_duplicate_output_key(self):
        self.reject(after=self.pretty.replace(b'"autoInstallPeers": true',
                    b'"autoInstallPeers": true, "autoInstallPeers": true'))

    def test_rejects_nonfinite_tokens_and_numeric_overflow(self):
        for token in (b'NaN', b'Infinity', b'-Infinity', b'1e400'):
            with self.subTest(token=token):
                self.reject(after=self.pretty.replace(b'"minimumReleaseAge": 1440',
                                                      b'"minimumReleaseAge": ' + token))
                with self.assertRaises((ValueError, OverflowError)):
                    serialization.profile(self.compact.replace(b'"minimumReleaseAge":1440',
                                                               b'"minimumReleaseAge":' + token))

    def test_rejects_whitespace_and_newline_variants(self):
        for body in (self.pretty.replace(b'\n', b'\r\n'), self.pretty + b' ',
                     self.pretty.rstrip(), self.pretty.replace(b'  "projects"', b'   "projects"'),
                     (json.dumps(self.after, indent=4) + '\n').encode()):
            with self.subTest(body=body[:20]):
                self.reject(after=body)

    def test_rejects_equivalent_escaped_key_serialization(self):
        self.reject(after=self.pretty.replace(b'"projects"', b'"\\u0070rojects"'))

    def test_unicode_input_uses_exact_expected_pnpm_output(self):
        old = generated_state()
        old['projects']['/generated/workspace']['name'] = 'generated-\u00e9'
        new = copy.deepcopy(old)
        new['lastValidatedTimestamp'] = 201
        before, after = serialization.compact(old), serialization.pnpm_bytes(new)
        self.assertIn(b'\\u00e9', before)
        self.assertIn('\u00e9'.encode(), after)
        self.transition(before, after)
        self.reject(before, after.replace('\u00e9'.encode(), b'\\u00e9'))

    def test_unknown_or_missing_top_fields_are_rejected(self):
        for mutation in ('add', 'remove'):
            changed = copy.deepcopy(self.after)
            if mutation == 'add':
                changed['extra'] = 1
            else:
                del changed['filteredInstall']
            with self.subTest(mutation=mutation):
                self.reject(after=(json.dumps(changed, indent=2) + '\n').encode())

    def test_compact_profile_rejects_unknown_settings(self):
        changed = copy.deepcopy(self.before)
        changed['settings']['unknown'] = 1
        with self.assertRaises(ValueError):
            serialization.profile(serialization.compact(changed))

    def test_compact_profile_rejects_missing_settings(self):
        changed = copy.deepcopy(self.before)
        del changed['settings']['dev']
        with self.assertRaises(ValueError):
            serialization.profile(serialization.compact(changed))

    def test_compact_profile_rejects_unknown_project_fields(self):
        changed = copy.deepcopy(self.before)
        changed['projects']['/generated/workspace']['extra'] = 1
        with self.assertRaises(ValueError):
            serialization.profile(serialization.compact(changed))

    def test_compact_profile_rejects_multiple_projects_and_hooks(self):
        for field, value in (('projects', {}), ('pnpmfiles', ['hook.cjs']), ('filteredInstall', 0)):
            changed = copy.deepcopy(self.before)
            changed[field] = value
            with self.subTest(field=field), self.assertRaises(ValueError):
                serialization.profile(serialization.compact(changed))
        changed = copy.deepcopy(self.before)
        changed['projects']['/generated/other'] = {'name': 'other', 'version': '1.0.0'}
        with self.assertRaises(ValueError):
            serialization.profile(serialization.compact(changed))

    def test_profile_rejects_unrecognized_compact_spacing(self):
        for body in (self.compact + b' ', self.compact.replace(b':', b': ', 1)):
            with self.subTest(body=body[:20]), self.assertRaises(ValueError):
                serialization.profile(body)

    def test_decoder_requires_bounded_bytes(self):
        for body in (self.compact.decode(), bytearray(self.compact), b' ' * (1024 * 1024 + 1)):
            with self.subTest(type=type(body)), self.assertRaises(ValueError):
                serialization.decode(body)

    def test_planning_checks_serialization_before_any_execution(self):
        with tempfile.TemporaryDirectory(prefix='pnpm-profile-') as directory:
            root = Path(directory)
            (root / 'node_modules/.pnpm').mkdir(parents=True)
            (root / 'package.json').write_text('{"packageManager":"pnpm@11.25.0"}')
            (root / 'pnpm-workspace.yaml').write_bytes(execution.SUPPORTED_WORKSPACE)
            for name in ('pnpm-lock.yaml', 'node_modules/.pnpm/lock.yaml'):
                (root / name).write_bytes(b'generated lock')
            state = generated_state()
            state['projects'] = {str(root): {'name': 'generated-fixture', 'version': '1.0.0'}}
            path = root / 'node_modules' / execution.STATE
            path.write_bytes(serialization.compact(state))
            before = execution.file_identity(path)
            self.assertGreater(execution.state_profile(root), 0)
            self.assertEqual(execution.file_identity(path), before)
            for body in (serialization.compact(state) + b' ',
                         serialization.compact({**state, 'settings': {}})):
                path.write_bytes(body)
                before = execution.file_identity(path)
                with self.assertRaises(ValueError):
                    execution.state_profile(root)
                self.assertEqual(execution.file_identity(path), before)


class DescendantDiagnosticCase(unittest.TestCase):
    def payload(self, code=0, first=None, primary_fault=False, observation_fault=False):
        """Exercise the actual finally block using in-memory processes, never a child."""
        first = [] if first is None else first
        with tempfile.TemporaryDirectory(prefix='descendant-pure-') as directory:
            root = Path(directory)
            (root / 'control').mkdir()
            command = ['/generated/python', 'fixture']
            ready = {'command': command,
                     'security': {'NoNewPrivs': '1', 'Seccomp': '2',
                                  **{name: '0' for name in execution.CAP_FIELDS}},
                     'fds': {'0': '/dev/null', '1': 'pipe', '2': 'pipe'}}
            (root / 'control/ready.json').write_text(json.dumps(ready))
            row = {'pid': 44, 'startTicks': 50, 'executable': command[0], 'rss': 1,
                   'state': 'R', 'ppid': 43, 'nspid': [44, 2], 'pidNamespace': 'pid:[123]'}
            binding = {'hostPid': 44, 'startTicks': 50}

            class Pipe(io.BytesIO):
                def __init__(self, fd):
                    super().__init__()
                    self.number = fd

                def fileno(self):
                    return self.number

            class Selector:
                def __init__(self): self.items = {}
                def __enter__(self): return self
                def __exit__(self, *args): pass
                def register(self, pipe, events, name):
                    self.items[pipe] = SimpleNamespace(fd=pipe.fileno(), fileobj=pipe, data=name)
                def unregister(self, pipe): self.items.pop(pipe)
                def get_map(self): return self.items
                def select(self, timeout): return [(key, 1) for key in list(self.items.values())]

            class Process:
                pid = 42
                returncode = code
                stdin, stdout, stderr = Pipe(9), Pipe(10), Pipe(11)
                def poll(self): return self.returncode
                def wait(self, timeout): return self.returncode
                def kill(self): raise AssertionError('Exited direct process must not be killed')

            class Watch:
                calls = 0
                cleaned = 0
                def pin_direct(self, proc): pass
                def observe(self): return [row]
                def check(self):
                    if primary_fault:
                        raise ValueError('Expected generated primary fault')
                def bind_gate(self, ready, proc): return binding
                def survivors(self):
                    self.calls += 1
                    if observation_fault:
                        raise ValueError('Expected generated observation fault')
                    return first if self.calls == 1 else []
                def cleanup(self): self.cleaned += 1

            class Clock:
                finished = 1
                identity = {'hostPid': 44, 'startTicks': 50}
                def __init__(self, row): pass
                def sample(self, rows): return 0.2
                def report(self): return {'generatedMock': True}

            watch = Watch()
            with patch.object(execution, 'bubblewrap_command', return_value=[]), \
                 patch.object(execution, 'clean_environment', return_value={}), \
                 patch.object(execution.subprocess, 'Popen', return_value=Process()), \
                 patch.object(execution, 'process_member', return_value={'ppid': os.getpid(), 'rss': 1}), \
                 patch.object(execution.selectors, 'DefaultSelector', Selector), \
                 patch.object(execution.os, 'set_blocking'), \
                 patch.object(execution.os, 'read', return_value=b''), \
                 patch.object(execution, 'ProducerClock', Clock):
                result = execution.run_payload(
                    {'tools': {'python': '/generated/python', 'readonly': ['/generated/python']}},
                    {'mounts': [['ro', '/generated/python', '/generated/python']]},
                    root, command, execution.Limits(), watch)
            self.assertEqual(json.loads((root / 'payload-result.json').read_bytes()), result)
            self.assertEqual(json.loads((root / 'mount-plan.json').read_bytes())['mounts'][-1],
                             ['ro', '/generated/python', '/generated/python3'])
            if not observation_fault:
                self.assertEqual(result['survivors'], [])
                self.assertEqual(result['initialSurvivors'], first)
                self.assertEqual(result['initialCleanupObservation']['directReturnCode'], code)
                self.assertLessEqual(result['initialCleanupObservation']['startedMonotonic'],
                                     result['initialCleanupObservation']['finishedMonotonic'])
                self.assertIsNone(result['cleanupFailure'])
            return result, watch.cleaned

    def test_normal_exit_records_empty_initial_observation(self):
        result, cleaned = self.payload()
        self.assertEqual((result['exitCode'], result['stopReason'], result['failure'], cleaned),
                         (0, None, None, 0))

    def test_nonzero_exit_is_not_converted_to_cleanup_failure(self):
        result, cleaned = self.payload(2)
        self.assertEqual((result['exitCode'], result['stopReason'], result['failure'], cleaned),
                         (2, None, None, 0))

    def test_initial_survivor_still_fails_after_final_empty_observation(self):
        result, cleaned = self.payload(2, [{'pid': 43, 'state': 'R', 'startTicks': 1}])
        self.assertEqual(result['stopReason'], 'Owned descendants remained after direct exit')
        self.assertGreater(cleaned, 0)
        self.assertIsNone(result['failure'])

    def test_initial_survivor_does_not_replace_primary_failure(self):
        result, cleaned = self.payload(2, [{'pid': 43, 'state': 'R'}], primary_fault=True)
        self.assertEqual(result['stopReason'], 'ValueError: Expected generated primary fault')
        self.assertEqual(result['failure']['type'], 'ValueError')
        self.assertGreater(cleaned, 0)

    def test_failed_initial_observation_remains_unknown_and_failed(self):
        result, cleaned = self.payload(observation_fault=True)
        self.assertIsNone(result['initialSurvivors'])
        self.assertIsNone(result['initialCleanupObservation'])
        self.assertIsNone(result['survivors'])
        self.assertIn('cleanup observation unknown', result['stopReason'])
        self.assertEqual(result['cleanupFailure']['type'], 'ValueError')
        self.assertGreater(cleaned, 0)

    def test_survivor_filter_still_excludes_only_controller_and_zombies(self):
        rows = [{'pid': 1, 'state': 'R'}, {'pid': 2, 'state': 'Z'}, {'pid': 3, 'state': 'R'}]
        watch = SimpleNamespace(parent={'pid': 1}, observe=lambda: rows)
        self.assertEqual(execution.OwnerWatch.survivors(watch), [rows[2]])


class CleanupClock:
    def __init__(self):
        self.now = 0

    def monotonic(self):
        return self.now

    def sleep(self, seconds):
        self.now += seconds


class DelayedCleanupWatch:
    """Generated process timeline; never creates or signals a real process."""
    row = {'pid': 91, 'startTicks': 123, 'state': 'S', 'pidNamespace': 'pid:[generated]'}

    def __init__(self, clock, until=0.09, unknown=False):
        self.clock = clock
        self.until = until
        self.unknown = unknown
        self.cleanup_calls = 0

    def cleanup(self):
        self.cleanup_calls += 1

    def survivors(self):
        if self.clock.now < self.until:
            if self.unknown:
                raise OSError('Generated observation unavailable')
            return [dict(self.row)]
        return []


class OwnedCleanupWaitCase(unittest.TestCase):
    def run_case(self, until=0.09, unknown=False, context=None):
        clock = CleanupClock()
        watch = DelayedCleanupWatch(clock, until, unknown)
        records = {}
        context = {} if context is None else context
        error = None
        with patch.object(execution.time, 'monotonic', clock.monotonic), \
             patch.object(execution.time, 'sleep', clock.sleep), \
             patch.object(execution, 'save_new', lambda path, value: records.update({path.name: value})):
            try:
                execution.await_owned_cleanup(watch, execution.Limits(), Path('/generated'),
                                              context, phase='test')
            except Exception as failure:
                error = failure
        return clock, watch, records['cleanup-observations-test.json'], error, context

    def test_old_immediate_check_rejects_delayed_exit(self):
        watch = DelayedCleanupWatch(CleanupClock())
        watch.cleanup()
        with self.assertRaisesRegex(ValueError, 'Qualification survivor'):
            execution.require(not watch.survivors(), 'Qualification survivor')

    def test_delayed_exit_waits_and_records_identity(self):
        clock, watch, record, error, context = self.run_case()
        self.assertIsNone(error)
        self.assertGreaterEqual(clock.now, 0.09)
        self.assertLessEqual(clock.now, 5)
        self.assertEqual(record['observations'][0]['after'], [watch.row])
        self.assertEqual(record['observations'][-1]['after'], [])
        self.assertEqual(record['status'], 'observed-zero-live-survivors')

    def test_persistent_live_fails_at_unchanged_deadline(self):
        clock, watch, record, error, context = self.run_case(until=10)
        self.assertIsNotNone(error)
        self.assertEqual(clock.now, 5)
        self.assertEqual(record['status'], 'failed-or-unknown')
        self.assertEqual(record['observations'][-1]['after'], [watch.row])

    def test_persistent_unknown_fails_at_deadline(self):
        clock, watch, record, error, context = self.run_case(until=10, unknown=True)
        self.assertIsNotNone(error)
        self.assertEqual(clock.now, 5)
        self.assertIsNone(record['observations'][-1]['after'])
        self.assertIsNotNone(record['observations'][-1]['afterError'])

    def test_unknown_requires_fresh_zero(self):
        clock, watch, record, error, context = self.run_case(unknown=True)
        self.assertIsNone(error)
        self.assertIsNone(record['observations'][0]['after'])
        self.assertEqual(record['observations'][-1]['after'], [])

    def test_second_phase_does_not_renew_deadline(self):
        clock, watch, record, error, context = self.run_case(until=10, context={'deadline': 0.06})
        self.assertIsNotNone(error)
        self.assertEqual(clock.now, 0.06)
        self.assertEqual(context['deadline'], 0.06)

    def test_already_empty_completes_without_sleep(self):
        clock, watch, record, error, context = self.run_case(until=0)
        self.assertIsNone(error)
        self.assertEqual(clock.now, 0)
        self.assertEqual(watch.cleanup_calls, 1)

class PythonCommandAliasCase(unittest.TestCase):
    def plan(self):
        interpreter = '/qualified/bin/python3.12'
        return ({'tools': {'python': interpreter, 'readonly': [interpreter]}},
                {'mounts': [['ro', interpreter, interpreter]], 'unchanged': True})

    def test_old_plan_cannot_resolve_bare_python3(self):
        spec, plan = self.plan()
        self.assertNotIn('/qualified/bin/python3', [row[2] for row in plan['mounts']])

    def test_alias_is_exact_readonly_bind_without_mutating_plan(self):
        spec, plan = self.plan()
        original = copy.deepcopy(plan)
        result = execution.with_python_command_alias(spec, plan)
        self.assertEqual(result['mounts'][-1],
                         ['ro', '/qualified/bin/python3.12', '/qualified/bin/python3'])
        self.assertEqual(plan, original)
        self.assertTrue(result['unchanged'])
        self.assertEqual(result['pythonCommandAlias'], {
            'source': '/qualified/bin/python3.12', 'destination': '/qualified/bin/python3',
            'mode': 'readonly-bind', 'hostPathChanged': False})

    def test_destination_collision_is_rejected(self):
        spec, plan = self.plan()
        plan['mounts'].append(['ro', '/other/python3', '/qualified/bin/python3'])
        with self.assertRaisesRegex(ValueError, 'collision'):
            execution.with_python_command_alias(spec, plan)

    def test_unpinned_source_is_rejected(self):
        spec, plan = self.plan()
        spec['tools']['readonly'] = ['/qualified/bin']
        with self.assertRaisesRegex(ValueError, 'exact pinned'):
            execution.with_python_command_alias(spec, plan)

    def test_writable_source_mount_is_rejected(self):
        spec, plan = self.plan()
        plan['mounts'][0][0] = 'rw'
        with self.assertRaisesRegex(ValueError, 'readonly'):
            execution.with_python_command_alias(spec, plan)

    def test_missing_exact_source_mount_is_rejected(self):
        spec, plan = self.plan()
        plan['mounts'] = [['ro', '/qualified/bin', '/qualified/bin']]
        with self.assertRaisesRegex(ValueError, 'readonly'):
            execution.with_python_command_alias(spec, plan)

    def test_already_named_python3_has_no_duplicate_mount(self):
        interpreter = '/qualified/bin/python3'
        spec = {'tools': {'python': interpreter, 'readonly': [interpreter]}}
        plan = {'mounts': [['ro', interpreter, interpreter]]}
        self.assertIs(execution.with_python_command_alias(spec, plan), plan)

    def test_relative_interpreter_path_is_rejected(self):
        spec, plan = self.plan()
        spec['tools']['python'] = 'python3.12'
        with self.assertRaisesRegex(ValueError, 'absolute path'):
            execution.with_python_command_alias(spec, plan)


class ReadonlyExecutableAliasCase(unittest.TestCase):
    """Generated kernel responses; no real write-open, mount or process."""
    def invoke(self, *, readonly=True, denial=errno.EACCES, before=(1, 2),
               after=(1, 2), final_readonly=True):
        states = [SimpleNamespace(st_dev=dev, st_ino=ino) for dev, ino in (before, after)]
        flags = [SimpleNamespace(f_flag=os.ST_RDONLY if value else 0)
                 for value in (readonly, final_readonly)]
        with patch.object(execution.os, 'stat', side_effect=states), \
             patch.object(execution.os, 'statvfs', side_effect=flags), \
             patch.object(execution, 'inode_key', side_effect=lambda info: [info.st_dev, info.st_ino]), \
             patch.object(execution.os, 'open', return_value=999,
                          side_effect=OSError(denial, 'generated') if denial else None), \
             patch.object(execution.os, 'close'):
            return execution.verify_readonly_executable_alias('/generated/python3', [1, 2])

    def test_permissions_denial_does_not_prove_readonly_mount(self):
        with self.assertRaisesRegex(ValueError, 'mount is writable'):
            self.invoke(readonly=False)

    def test_readonly_permissions_denial_is_recorded(self):
        result = self.invoke()
        self.assertEqual(result['writeDeniedErrno'], errno.EACCES)
        self.assertEqual(result['inode'], [1, 2])
        self.assertTrue(result['readonly'])

    def test_readonly_erofs_is_accepted(self):
        self.assertEqual(self.invoke(denial=errno.EROFS)['writeDeniedErrno'], errno.EROFS)

    def test_readonly_etxtbsy_is_accepted(self):
        self.assertEqual(self.invoke(denial=errno.ETXTBSY)['writeDeniedErrno'], errno.ETXTBSY)

    def test_successful_write_open_always_fails(self):
        with self.assertRaisesRegex(ValueError, 'permits writable access'):
            self.invoke(denial=None)

    def test_unrelated_error_is_rejected(self):
        with self.assertRaisesRegex(ValueError, 'Unexpected'):
            self.invoke(denial=errno.ENOENT)

    def test_initial_inode_mismatch_is_rejected(self):
        with self.assertRaisesRegex(ValueError, 'inode changed'):
            self.invoke(before=(1, 3))

    def test_inode_drift_is_rejected(self):
        with self.assertRaisesRegex(ValueError, 'changed during check'):
            self.invoke(after=(1, 3))

    def test_mount_flag_drift_is_rejected(self):
        with self.assertRaisesRegex(ValueError, 'changed during check'):
            self.invoke(final_readonly=False)


class OwnerScopedProcfsTests(unittest.TestCase):
    def setUp(self):
        # Every process identity in this class is synthetic; no live procfs/pidfd.
        for guard in [patch.object(execution.os,'pidfd_open',return_value=99),
                      patch.object(execution.os,'close'),
                      patch.object(execution,'open_proc_directory',return_value=199),
                      patch.object(execution,'process_ancestry_at',side_effect=lambda pid, directory:execution.process_ancestry(pid)),
                      patch.object(execution,'process_member_at',side_effect=lambda pid, directory:execution.process_member(pid)),
                      patch.object(execution,'process_ancestry',side_effect=lambda pid:execution.process_member(pid))]:
            guard.start();self.addCleanup(guard.stop)

    def row(self, pid, ppid, namespace='pid:[10]', ticks=None):
        return dict(pid=pid, ppid=ppid, startTicks=ticks or pid*10, pgid=pid,
                    session=pid, state='S', rss=4096, nspid=[pid],
                    pidNamespace=namespace, executable='/owned')

    def rows(self):
        return {1:self.row(1,0),10:self.row(10,1),20:self.row(20,10),30:self.row(30,20)}

    def select(self, rows, known=None, roots=None, enrich=None):
        return execution.owned_process_rows(rows,rows[10],known or {},roots or {},enrich or rows.__getitem__)

    def test_unrelated_root_namespace_is_never_read(self):
        rows=self.rows(); calls=[]
        def enrich(pid):
            calls.append(pid)
            if pid==1:raise PermissionError('root namespace denied')
            return rows[pid]
        self.assertEqual([r['pid'] for r in self.select(rows,enrich=enrich)],[10,20,30])
        self.assertEqual(calls,[10,20,30])

    def test_owned_permission_error_is_not_skipped(self):
        rows=self.rows()
        for denied in (10,20,30):
            def enrich(pid):
                if pid==denied:raise PermissionError('owned procfs denied')
                return rows[pid]
            with self.assertRaises(PermissionError):self.select(rows,enrich=enrich)

    def test_public_census_permission_error_is_fatal(self):
        with patch.object(Path,'iterdir',return_value=iter([Path('/proc/1')])), \
             patch.object(execution,'process_ancestry',side_effect=PermissionError('unknown ancestry')):
            with self.assertRaises(PermissionError):execution.ancestry_snapshot()

    def test_public_census_only_tolerates_exit_race(self):
        with patch.object(Path,'iterdir',return_value=iter([Path('/proc/1')])), \
             patch.object(execution,'process_ancestry',side_effect=ProcessLookupError('exited')):
            self.assertEqual(execution.ancestry_snapshot(),{})

    def test_pid_reuse_or_reparent_during_enrichment_fails(self):
        rows=self.rows()
        for change in ({'startTicks':999},{'ppid':1}):
            with self.assertRaises(ValueError):
                self.select(rows,enrich=lambda pid:{**rows[pid],**change} if pid==30 else rows[pid])

    def test_unknown_setsid_orphan_reparented_to_subreaper_is_owned(self):
        rows=self.rows();rows[30]=self.row(30,10);rows[40]=self.row(40,30)
        self.assertEqual([r['pid'] for r in self.select(rows)],[10,20,30,40])

    def test_namespace_init_anchors_unknown_reparented_nested_members(self):
        rows=self.rows();rows[20]=self.row(20,1,'pid:[20]')
        rows[30]=self.row(30,20,'pid:[30]');rows[40]=self.row(40,30,'pid:[30]')
        roots={'pid:[20]':{'pid':20,'startTicks':200}}
        self.assertEqual([r['pid'] for r in self.select(rows,roots=roots)],[10,20,30,40])
        with self.assertRaises(ValueError):self.select(rows,roots={'pid:[20]':{'pid':20,'startTicks':999}})

    def test_unrelated_session_does_not_confer_ownership(self):
        rows=self.rows();rows[50]={**self.row(50,1),'session':10,'pgid':10}
        self.assertNotIn(50,[r['pid'] for r in self.select(rows)])

    def test_cleanup_signals_retained_pidfds_even_if_observation_denied(self):
        watch=object.__new__(execution.OwnerWatch);watch.lock=threading.RLock()
        watch.pidfds={(20,200):45};watch.direct_fds=[46]
        watch.observe=lambda:(_ for _ in ()).throw(PermissionError('owned denied'))
        with patch.object(execution.signal,'pidfd_send_signal') as send:
            watch.cleanup()
            self.assertEqual([call.args[0] for call in send.call_args_list],[45,46])

    def watch(self, snapshots, known=None, roots=None, pidfds=None):
        watch=object.__new__(execution.OwnerWatch);watch.lock=threading.RLock()
        watch.parent=self.row(10,1);watch.known=known or {};watch.namespace_roots=roots or {}
        watch.pidfds=pidfds or {};watch.history={}
        watch.procdirs={key:fd+1000 for key,fd in watch.pidfds.items()};watch.handles_closed=False
        watch.snapshot=unittest.mock.Mock(side_effect=snapshots)
        return watch

    def test_second_census_positive_reparent_and_setsid_remain_owned(self):
        before=self.rows();after={**before,30:{**self.row(30,10),'session':30}}
        watch=self.watch([before,after]);watch.pidfds={(20,200):45,(30,300):46};watch.procdirs={key:fd+1000 for key,fd in watch.pidfds.items()}
        def member(pid):return (before if watch.snapshot.call_count==1 else after)[pid]
        with patch.object(execution,'process_member',side_effect=member):
            self.assertEqual([r['pid'] for r in watch.observe()],[10,20,30])
            self.assertEqual(watch.known[(30,300)]['ppid'],10)

    def test_second_census_unanchored_reparent_is_not_clean(self):
        before=self.rows();after={**before,30:self.row(30,1)}
        watch=self.watch([before,after]);watch.pidfds={(20,200):45,(30,300):46};watch.procdirs={key:fd+1000 for key,fd in watch.pidfds.items()}
        def member(pid):return (before if watch.snapshot.call_count==1 else after)[pid]
        with patch.object(execution,'process_member',side_effect=member):
            with self.assertRaisesRegex(ValueError,'positive parent anchor'):watch.observe()

    def test_initial_gate_child_addition_between_censuses_is_pinned(self):
        before={1:self.row(1,0),10:self.row(10,1)}
        after={**before,20:self.row(20,10)};watch=self.watch([before,after])
        def member(pid):return (before if watch.snapshot.call_count==1 else after)[pid]
        with patch.object(execution,'process_member',side_effect=member), \
             patch.object(execution.os,'pidfd_open',return_value=45) as pin:
            rows=watch.observe()
        self.assertEqual([r['pid'] for r in rows],[10,20]);pin.assert_called_once_with(20)
        self.assertEqual(watch.pidfds,{(20,200):45})

    def test_new_descendant_closure_between_censuses_is_pinned(self):
        before={10:self.row(10,1)};after=self.rows();watch=self.watch([before,after])
        with patch.object(execution,'process_member',side_effect=lambda pid:after[pid]), \
             patch.object(execution.os,'pidfd_open',side_effect=[45,46]):
            self.assertEqual([r['pid'] for r in watch.observe()],[10,20,30])
        self.assertEqual(set(watch.pidfds),{(20,200),(30,300)})

    def test_first_census_pid_reuse_cannot_be_dropped_as_unrelated(self):
        before={10:self.row(10,1),20:self.row(20,10)}
        after={10:before[10],20:self.row(20,1,ticks=999)}
        watch=self.watch([before,after]);watch.pidfds={(20,200):45};watch.procdirs={key:fd+1000 for key,fd in watch.pidfds.items()}
        with patch.object(execution,'process_member',side_effect=lambda pid:before[pid]):
            with self.assertRaisesRegex(ValueError,'PID reused between'):watch.observe()

    def test_addition_with_unreadable_owned_enrichment_still_fails(self):
        before={10:self.row(10,1)};after={**before,20:self.row(20,10)};watch=self.watch([before,after])
        def member(pid):
            if pid==20:raise PermissionError('new owned inaccessible')
            return after[pid]
        with patch.object(execution,'process_member',side_effect=member):
            with self.assertRaises(PermissionError):watch.observe()

    def test_removed_first_census_child_requires_pidfd_exit(self):
        import select
        before={10:self.row(10,1),20:self.row(20,10)};after={10:before[10]}
        for exited in (False,True):
            watch=self.watch([before,after]);watch.pidfds={(20,200):45};watch.procdirs={key:fd+1000 for key,fd in watch.pidfds.items()}
            with patch.object(execution,'process_member',side_effect=lambda pid:before[pid]), \
                 patch.object(select,'select',return_value=([45] if exited else [],[],[])):
                if exited:self.assertEqual([r['pid'] for r in watch.observe()],[10])
                else:
                    with self.assertRaisesRegex(ValueError,'positive exit'):watch.observe()

    def test_absent_or_reused_retained_pid_requires_positive_exit(self):
        import select
        for replacement in (None,self.row(20,1,ticks=999)):
            rows={10:self.row(10,1)}
            if replacement:rows[20]=replacement
            watch=self.watch([rows,rows],known={(20,200):self.row(20,10)},pidfds={(20,200):45})
            with patch.object(execution,'process_member',side_effect=lambda pid:rows[pid]), \
                 patch.object(select,'select',return_value=([],[],[])):
                with self.assertRaisesRegex(ValueError,'without positive exit'):watch.observe()

    def test_vanished_init_does_not_make_live_member_clean(self):
        import select
        rows={10:self.row(10,1)}
        watch=self.watch([rows,rows],known={(20,200):self.row(20,10,'pid:[20]')},
                         roots={'pid:[20]':{'pid':20,'startTicks':200}},pidfds={(20,200):45})
        with patch.object(execution,'process_member',side_effect=lambda pid:rows[pid]), \
             patch.object(select,'select',return_value=([],[],[])):
            with self.assertRaises(ValueError):watch.observe()

    def test_vanished_init_and_positive_retained_exit_allow_parent_only(self):
        import select
        rows={10:self.row(10,1)}
        watch=self.watch([rows,rows],known={(20,200):self.row(20,10,'pid:[20]')},
                         roots={'pid:[20]':{'pid':20,'startTicks':200}},pidfds={(20,200):45})
        with patch.object(execution,'process_member',side_effect=lambda pid:rows[pid]), \
             patch.object(select,'select',return_value=([45],[],[])):
            self.assertEqual([r['pid'] for r in watch.observe()],[10])

    def test_qualifier_restores_exact_owner_census_on_recovery_and_finally(self):
        import ast
        import inspect
        source=ast.parse(inspect.getsource(execution.qualify_backend))
        captures=[n for n in ast.walk(source) if isinstance(n,ast.Assign) and
                  any(isinstance(t,ast.Name) and t.id=='actual_snapshot' for t in n.targets)]
        restores=[n for n in ast.walk(source) if isinstance(n,ast.Assign) and
                  any(isinstance(t,ast.Attribute) and isinstance(t.value,ast.Name) and
                      t.value.id=='watch' and t.attr=='snapshot' for t in n.targets) and
                  isinstance(n.value,ast.Name) and n.value.id=='actual_snapshot']
        injections=[n for n in ast.walk(source) if isinstance(n,ast.If) and
                    any(isinstance(child,ast.FunctionDef) and child.name=='failed_snapshot' for child in n.body)]
        self.assertEqual(len(captures),1);self.assertEqual(len(restores),2);self.assertEqual(len(injections),1)
        self.assertLess(captures[0].lineno,injections[0].lineno)
        rows={1:self.row(1,0),10:self.row(10,1)}
        def enrich(pid):
            if pid==1:raise PermissionError('unrelated root namespace denied')
            return rows[pid]
        for restore in restores:
            watch=self.watch([]);watch.binding=None;watch.snapshot=lambda:rows
            original=watch.snapshot
            scope={'watch':watch,'name':'observer','QualificationObservationFault':execution.QualificationObservationFault}
            def run(node):exec(compile(ast.fix_missing_locations(ast.Module(body=[node],type_ignores=[])),'qualifier-exact-node','exec'),scope)
            run(captures[0]);run(injections[0])
            self.assertIs(watch.snapshot(),rows)
            watch.binding={'positive':True}
            with self.assertRaises(execution.QualificationObservationFault):watch.snapshot()
            run(restore)
            self.assertIs(watch.snapshot,original)
            with patch.object(execution,'process_member',side_effect=enrich), \
                 patch.object(execution,'process_snapshot',side_effect=AssertionError('host-wide scan forbidden')):
                self.assertEqual([r['pid'] for r in watch.observe()],[10])
            # Ordinary-case finally must preserve the same census without injection.
            watch.snapshot=original;scope['name']='readonly';run(captures[0]);run(restore)
            self.assertIs(watch.snapshot,original)

    def test_subreaper_failure_is_pre_admission_failure(self):
        import ctypes
        with patch.object(ctypes,'CDLL') as library:
            library.return_value.prctl.return_value=-1
            with self.assertRaisesRegex(ValueError,'subreaper unavailable'):execution.require_child_subreaper()


class RetainedEarlyExitTests(unittest.TestCase):
    setUp=OwnerScopedProcfsTests.setUp
    row=OwnerScopedProcfsTests.row
    watch=OwnerScopedProcfsTests.watch
    def test_enrichment_exit_only_after_validated_fd_in_both_passes(self):
        import select
        for phase in ('first','second'):
            parent={10:self.row(10,1)};owned={**parent,20:self.row(20,10)}
            snapshots=[owned,parent] if phase=='first' else [parent,owned]
            watch=self.watch(snapshots)
            def member(pid):
                if pid==20:raise FileNotFoundError(2,'generated exit')
                return parent[pid]
            with patch.object(execution,'process_ancestry',side_effect=lambda pid:owned[pid]), \
                 patch.object(execution,'process_member',side_effect=member), \
                 patch.object(select,'select',return_value=([99],[],[])):
                self.assertEqual([r['pid'] for r in watch.observe()],[10])
            self.assertEqual(watch.pidfds,{(20,200):99})
            self.assertEqual(watch.exited_observations[0]['phase'],phase)
            self.assertTrue(watch.exited_observations[0]['retainedIdentityValidated'])

    def test_exit_before_pin_validation_cannot_be_inferred_from_fd_readability(self):
        import select
        rows={10:self.row(10,1),20:self.row(20,10)};watch=self.watch([rows,rows])
        with patch.object(execution,'process_ancestry',side_effect=FileNotFoundError(2,'before validation')), \
             patch.object(execution,'process_member',side_effect=lambda pid:rows[pid]), \
             patch.object(select,'select',return_value=([99],[],[])) as exited:
            with self.assertRaises(FileNotFoundError):watch.observe()
        self.assertEqual(watch.pidfds,{})
        exited.assert_not_called()
        self.assertEqual(watch.observation_failure['callsite'],'pin-identity-reread')
        self.assertEqual(watch.observation_failure['pid'],20)

    def test_pin_subcall_diagnostics_preserve_unvalidated_failure(self):
        rows={10:self.row(10,1),20:self.row(20,10)}
        for phase in ('first','second'):
            for callsite in ('pin-pidfd-open','pin-identity-reread','pin-identity-compare'):
                snapshots=[rows,rows] if phase=='first' else [{10:rows[10]},rows]
                watch=self.watch(snapshots)
                opening=ProcessLookupError(3,'generated') if callsite=='pin-pidfd-open' else None
                reread=ProcessLookupError(3,'generated') if callsite=='pin-identity-reread' else None
                value={**rows[20],'startTicks':999} if callsite=='pin-identity-compare' else rows[20]
                with patch.object(execution.os,'pidfd_open',return_value=99,side_effect=opening), \
                     patch.object(execution,'process_ancestry',return_value=value,side_effect=reread), \
                     patch.object(execution,'process_member',side_effect=lambda pid:rows[pid]):
                    with self.assertRaises((ProcessLookupError,ValueError)):watch.observe()
                self.assertEqual(watch.pidfds,{})
                self.assertEqual(watch.observation_failure['callsite'],callsite)
                self.assertEqual(watch.observation_failure['phase'],phase)
                self.assertEqual(watch.observation_failure['pid'],20)

    def test_missing_enrichment_with_live_validated_fd_still_fails(self):
        import select
        rows={10:self.row(10,1),20:self.row(20,10)};watch=self.watch([rows,rows],pidfds={(20,200):99})
        with patch.object(execution,'process_member',side_effect=lambda pid:rows[pid] if pid==10 else (_ for _ in ()).throw(FileNotFoundError(2,'missing'))), \
             patch.object(select,'select',return_value=([],[],[])):
            with self.assertRaises(FileNotFoundError):watch.observe()
        self.assertEqual(watch.observation_failure['callsite'],'owned-enrichment')
        self.assertEqual(watch.observation_failure['phase'],'first')

    def test_reused_reparented_malformed_and_denied_pin_are_fatal(self):
        rows={10:self.row(10,1),20:self.row(20,10)}
        for value in ({**rows[20],'startTicks':999},{**rows[20],'ppid':1},{},PermissionError(13,'denied')):
            watch=self.watch([rows,rows])
            with patch.object(execution,'process_ancestry',side_effect=value if isinstance(value,Exception) else lambda pid:value), \
                 patch.object(execution,'process_member',side_effect=lambda pid:rows[pid]):
                with self.assertRaises((ValueError,KeyError,PermissionError)):watch.observe()
            self.assertEqual(watch.pidfds,{})

    def test_unknown_pidfd_open_exit_remains_fatal(self):
        rows={10:self.row(10,1),20:self.row(20,10)};watch=self.watch([rows,rows])
        with patch.object(execution.os,'pidfd_open',side_effect=ProcessLookupError('unknown exit')), \
             patch.object(execution,'process_member',side_effect=lambda pid:rows[pid]):
            with self.assertRaises(ProcessLookupError):watch.observe()
        self.assertEqual(watch.pidfds,{})


class FinishFactsTests(unittest.TestCase):
    fake_finished_watch=PureCase.fake_finished_watch
    def test_joined_and_unhealthy_are_separate_facts(self):
        watch=self.fake_finished_watch('late health failure');receipt={}
        with self.assertRaisesRegex(ValueError,'late health failure'):
            execution.finish_observer(watch,cleanup_deadline=time.monotonic()+5,receipt=receipt)
        self.assertTrue(receipt['joined']);self.assertFalse(receipt['healthy']);self.assertTrue(receipt['withinDeadline'])

    def test_deadline_is_not_extended_for_join(self):
        watch=self.fake_finished_watch();receipt={}
        with patch.object(execution.time,'monotonic',return_value=6),self.assertRaisesRegex(ValueError,'shared cleanup deadline'):
            execution.finish_observer(watch,cleanup_deadline=5,receipt=receipt)
        self.assertTrue(receipt['joined']);self.assertTrue(receipt['healthy']);self.assertFalse(receipt['withinDeadline'])


class QualificationFailureRetentionTests(unittest.TestCase):
    def test_qualifier_registers_partial_case_and_finalizes_same_context(self):
        import ast
        import inspect
        source = ast.parse(inspect.getsource(execution.qualify_backend))
        loop = next(node for node in ast.walk(source) if isinstance(node, ast.For) and
                    isinstance(node.target, ast.Name) and node.target.id == 'name' and
                    isinstance(node.iter, ast.Tuple) and node.iter.elts[0].value == 'readonly')
        registration = next(node for node in loop.body if isinstance(node, ast.Assign) and
                            any(isinstance(target, ast.Name) and target.id == 'case' for target in node.targets))
        payload = next(node for node in ast.walk(loop) if isinstance(node, ast.Call) and
                       isinstance(node.func, ast.Name) and node.func.id == 'run_payload')
        retention = next(node for node in ast.walk(loop) if isinstance(node, ast.Assign) and
                         any(isinstance(target, ast.Subscript) and isinstance(target.value, ast.Name) and
                             target.value.id == 'case' and isinstance(target.slice, ast.Constant) and
                             target.slice.value == 'result' for target in node.targets))
        body = next(node for node in loop.body if isinstance(node, ast.Try) and node.finalbody)
        finalization = next(node for node in body.finalbody if isinstance(node, ast.Assign) and
                            isinstance(node.value, ast.Call) and isinstance(node.value.func, ast.Name) and
                            node.value.func.id == 'finish_qualification_case')
        self.assertLess(registration.lineno, payload.lineno)
        self.assertLess(payload.lineno, retention.lineno)
        self.assertIs(body.body[body.body.index(retention) - 1].value, payload)
        self.assertEqual([argument.id for argument in finalization.value.args],
                         ['watch', 'limits', 'attempt', 'cleanup_context', 'case', 'case_failure'])
        scope = {'results': {}, 'name': 'rename'}
        def execute(node):
            exec(compile(ast.fix_missing_locations(ast.Module(body=[node], type_ignores=[])),
                         'qualifier-case-wiring', 'exec'), scope)
        execute(registration)
        self.assertIs(scope['case'], scope['results']['rename'])
        self.assertEqual(scope['case'], {'result': None, 'resources': None})
        result = {'stopReason': 'original failed payload'}
        scope['result'] = result
        execute(retention)
        self.assertIs(scope['results']['rename']['result'], result)
        primary = ValueError('primary assertion')
        context = {'deadline': 15}
        observed = []
        def finalize(watch, limits, attempt, current_context, case, failure, *, expected_fault):
            observed.append((current_context, case, failure, expected_fault))
            return failure
        scope.update(watch=object(), limits=object(), attempt=Path('/generated'), cleanup_context=context,
                     case_failure=primary, finish_qualification_case=finalize)
        execute(finalization)
        self.assertIs(observed[0][0], context)
        self.assertIs(observed[0][1], scope['results']['rename'])
        self.assertIs(observed[0][2], primary)
        self.assertFalse(observed[0][3])
        self.assertIs(scope['case_failure'], primary)

    def invoke(self, *, primary=None, cleanup_error=None, finish_error=None, report_error=None,
               finished=14, joined=True, result=None, context=None):
        context = {'deadline': 15} if context is None else context
        case = {'result': result}
        def cleanup(watch, limits, attempt, current, *, phase):
            self.assertEqual(phase, 'final')
            current.setdefault('deadline', 15)
            if cleanup_error is not None:
                raise cleanup_error
        def finish(watch, *, expected_fault, result, cleanup_deadline, receipt):
            self.assertEqual(cleanup_deadline, context['deadline'])
            receipt.update(joined=joined, healthy=finish_error is None, finishedMonotonic=finished,
                           deadlineMonotonic=cleanup_deadline)
            if finish_error is not None:
                raise finish_error
        def report():
            if report_error is not None:
                raise report_error
            return {'finishObservation': case['finishObservation'], 'sampleCount': 1}
        watch = SimpleNamespace(report=report)
        with patch.object(execution, 'await_owned_cleanup', side_effect=cleanup), \
             patch.object(execution, 'finish_observer', side_effect=finish):
            failure = execution.finish_qualification_case(watch, execution.BUILD_LIMITS, Path('/generated'),
                                                          context, case, primary)
        return failure, case

    def test_failed_result_and_resources_are_retained(self):
        primary = ValueError('original case assertion')
        result = {'exitCode': 0, 'stopReason': 'retained ownership failure'}
        failure, case = self.invoke(primary=primary, result=result)
        self.assertIs(failure, primary)
        self.assertIs(case['result'], result)
        self.assertEqual(case['failure']['message'], 'original case assertion')
        self.assertTrue(case['finishObservation']['joined'])
        self.assertEqual(case['resources']['sampleCount'], 1)

    def test_exception_before_result_assignment_retains_explicit_null(self):
        failure, case = self.invoke(primary=ValueError('before result'))
        self.assertIsInstance(failure, ValueError)
        self.assertIn('result', case)
        self.assertIsNone(case['result'])
        self.assertIsNotNone(case['resources'])

    def test_primary_failure_survives_cleanup_finish_and_report_errors(self):
        for option, field in [('cleanup_error', 'cleanupFailure'), ('finish_error', 'finishFailure'),
                              ('report_error', 'resourceRecordingFailure')]:
            with self.subTest(option=option):
                primary = ValueError('first failure')
                failure, case = self.invoke(primary=primary, **{option: RuntimeError('secondary failure')})
                self.assertIs(failure, primary)
                self.assertEqual(case['failure']['message'], 'first failure')
                self.assertEqual(case[field]['message'], 'secondary failure')
                self.assertIn('finishObservation', case)

    def test_success_with_any_secondary_failure_is_rejected(self):
        for option in ('cleanup_error', 'finish_error', 'report_error'):
            with self.subTest(option=option):
                secondary = RuntimeError(option)
                failure, case = self.invoke(**{option: secondary})
                self.assertIs(failure, secondary)
                self.assertEqual(case['failure']['message'], option)

    def test_report_failure_cannot_erase_explicit_finish_receipt(self):
        failure, case = self.invoke(report_error=RuntimeError('report broke'))
        self.assertIsNotNone(failure)
        self.assertIsNone(case['resources'])
        self.assertEqual(case['finishObservation']['finishedMonotonic'], 14)
        self.assertTrue(case['finishObservation']['joined'])

    def test_original_deadline_is_passed_and_late_finish_rejected(self):
        failure, case = self.invoke(context={'deadline': 5}, finished=6)
        self.assertIsInstance(failure, ValueError)
        self.assertEqual(case['finishObservation']['deadlineMonotonic'], 5)
        self.assertIn('original cleanup deadline', case['finishFailure']['message'])

    def test_missing_original_deadline_is_not_replaced(self):
        case = {'result': None}
        watch = SimpleNamespace(report=lambda: {})
        with patch.object(execution, 'await_owned_cleanup'), patch.object(execution, 'finish_observer') as finish:
            failure = execution.finish_qualification_case(watch, execution.BUILD_LIMITS, Path('/generated'), {}, case)
        self.assertIsInstance(failure, ValueError)
        finish.assert_not_called()
        self.assertIn('Original cleanup deadline missing', case['finishFailure']['message'])

    def test_unjoined_or_nonfinite_finish_is_rejected(self):
        for kwargs in ({'joined': False}, {'finished': float('nan')}, {'finished': float('inf')}):
            with self.subTest(kwargs=kwargs):
                failure, _ = self.invoke(**kwargs)
                self.assertIsInstance(failure, ValueError)

    def expected_fault(self, finished):
        watch = PureCase.fake_finished_watch(self, first_expected=True)
        watch.report = lambda: {'finishObservation': watch.finish_observation,
                               'failureMarker': watch.failure_marker, 'unexpectedFailure': watch.unexpected_failure}
        result = PureCase.observer_fault_result(self)
        case = {'result': result}
        with patch.object(execution, 'await_owned_cleanup'), patch.object(execution.time, 'monotonic', return_value=finished):
            failure = execution.finish_qualification_case(watch, execution.BUILD_LIMITS, Path('/generated'),
                                                          {'deadline': 5}, case, expected_fault=True)
        return failure, case, result

    def test_expected_observer_negative_is_joined_but_stays_unhealthy(self):
        failure, case, result = self.expected_fault(4)
        self.assertIsNone(failure)
        self.assertTrue(case['finishObservation']['joined'])
        self.assertFalse(case['finishObservation']['healthy'])
        self.assertIs(case['result'], result)
        self.assertIsNone(result['survivors'])
        self.assertEqual(result['failure']['injectedFault'], execution.QUALIFIER_OBSERVER_FAULT)
        self.assertIsNone(case['resources']['unexpectedFailure'])

    def test_expected_observer_fault_cannot_hide_late_finish(self):
        failure, case, _ = self.expected_fault(6)
        self.assertIsInstance(failure, ValueError)
        self.assertFalse(case['finishObservation']['healthy'])
        self.assertEqual(case['finishObservation']['finishedMonotonic'], 6)


class OwnedComparisonDiagnosticTests(unittest.TestCase):
    def test_all_tuple_mismatches_remain_fatal_with_bounded_typed_details(self):
        parent = {'pid': 10, 'startTicks': 100, 'ppid': 1}
        child = {'pid': 20, 'startTicks': 200, 'ppid': 10}
        census = {10: parent, 20: child}
        for key in ('pid', 'startTicks', 'ppid'):
            enriched = {**child, key: 999, 'unrelated': 'not retained'}
            with self.assertRaises(execution.OwnedIdentityComparisonFault) as caught:
                execution.owned_process_rows(census, parent, {}, {},
                                             lambda pid: parent if pid == 10 else enriched)
            record = execution.failure_record(caught.exception)
            self.assertIsInstance(caught.exception, ValueError)
            self.assertEqual(record['comparison']['differentFields'], [key])
            self.assertEqual(record['comparison']['census'], child)
            self.assertEqual(set(record['comparison']['enriched']), {'pid', 'startTicks', 'ppid'})
            self.assertNotIn('unrelated', json.dumps(record))
            self.assertIsNone(record['injectedFault'])

    def test_comparison_value_types_and_magnitude_are_bounded(self):
        before = {'pid': 20, 'startTicks': 200, 'ppid': 10}
        after = {'pid': 'not-an-integer', 'startTicks': 2**128, 'ppid': -1}
        fault = execution.OwnedIdentityComparisonFault(before, after)
        self.assertEqual(fault.comparison['enriched'], {'pid': None, 'startTicks': None, 'ppid': None})
        self.assertLess(len(json.dumps(execution.failure_record(fault))), 1024)

    def test_observer_first_failure_retains_typed_comparison(self):
        fault = execution.OwnedIdentityComparisonFault({'pid': 20, 'startTicks': 200, 'ppid': 10},
                                                       {'pid': 20, 'startTicks': 200, 'ppid': 1})
        watch = object.__new__(execution.OwnerWatch)
        watch.lock = threading.RLock()
        watch.observation_context = {'phase': 'second', 'callsite': 'owned-enrichment'}
        watch._observe = lambda: (_ for _ in ()).throw(fault)
        with self.assertRaises(execution.OwnedIdentityComparisonFault):
            watch.observe()
        self.assertEqual(watch.observation_failure['comparison'], fault.comparison)
        self.assertEqual(watch.observation_failure['phase'], 'second')


if __name__ == '__main__':
    try:
        unittest.main(verbosity=2)
    finally:
        for guard in reversed(GUARDS):
            guard.stop()

