"""Pure/generated-files tests. No application, Git, pnpm, bwrap or child process.

Run with -I -B; the subprocess guard is installed before importing the candidate.
Live kernel qualification is a distinct explicitly released CLI stage.
"""
from contextlib import contextmanager
from dataclasses import asdict, replace
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
        return (json.dumps({'lastValidatedTimestamp': timestamp, 'settings': {'isolated': True}, **(extra or {})},
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
        self.file('runtime/node_modules/' + execution.STATE, execution.encoded(state))
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
            def __init__(self, *args): pass
            def cleanup(self): pass
            def survivors(self): return []
            def finish(self): raise ValueError('late qualifier observer failure')
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


if __name__ == '__main__':
    try:
        unittest.main(verbosity=2)
    finally:
        for guard in reversed(GUARDS):
            guard.stop()
