"""Tiny, offline fixtures for the read-only shared setup admission helper.

No real package manager is installed or invoked. Package content and its pnpm v11
addresses are synthetic; these tests establish guard behavior, not dependency
compatibility, actual disk savings or production memory acceptance.
"""
import hashlib
import importlib.util
import json
import os
from pathlib import Path
import shutil
import stat
import subprocess
import sys
import tempfile
from types import SimpleNamespace
import unittest
from unittest import mock


HELPER = Path(__file__).resolve().parents[1] / 'scripts/orchestration/shared_setup.py'
sys.path.insert(0, str(HELPER.parent))
spec = importlib.util.spec_from_file_location('shared_setup', HELPER)
setup = importlib.util.module_from_spec(spec)
spec.loader.exec_module(setup)

MANAGER = 'pnpm@11.25.0'
WORKSPACE = '''packages:
  - '.'
nodeLinker: isolated
virtualStoreDir: node_modules/.pnpm
enableGlobalVirtualStore: false
packageImportMethod: hardlink
verifyStoreIntegrity: true
ignoreScripts: true
sideEffectsCache: false
publicHoistPattern:
  - playwright-core
  - js-yaml
  - sharp
  - oxfmt
  - oxlint
verifyDepsBeforeRun: error
'''
LOCK = b"lockfileVersion: '9.0'\nimporters:\n  .: {}\n"
CONTENT = b'export const fixture = "tiny immutable package";\n'
RESERVE = 1024 * 1024
ALLOCATION = 2 * 1024 * 1024


def snapshot(root):
    """Bytes, modes, link targets and identities, never following symlinks."""
    result = {}
    paths = [root]
    for parent, directories, files in os.walk(root, followlinks=False):
        paths.extend(Path(parent) / name for name in directories + files)
    for path in paths:
        info = path.lstat()
        payload = os.readlink(path) if stat.S_ISLNK(info.st_mode) else (
            path.read_bytes() if stat.S_ISREG(info.st_mode) else None)
        result[str(path.relative_to(root))] = (
            info.st_dev, info.st_ino, info.st_mode, info.st_nlink, payload)
    return result


class SharedSetupTests(unittest.TestCase):
    def setUp(self):
        self.tmp = tempfile.TemporaryDirectory(prefix='pnd-shared-setup-test-')
        self.root = Path(self.tmp.name).resolve()
        self.source = self.root / 'source'
        self.source.mkdir()
        (self.source / 'package.json').write_text(json.dumps({
            'name': 'tiny-shared-setup-fixture', 'private': True,
            'packageManager': MANAGER,
        }) + '\n')
        (self.source / 'package-lock.json').write_text(
            '{"name":"tiny-shared-setup-fixture","lockfileVersion":3,"packages":{}}\n')
        (self.source / 'pnpm-lock.yaml').write_bytes(LOCK)
        (self.source / 'pnpm-workspace.yaml').write_text(WORKSPACE)
        (self.source / '.gitignore').write_text('node_modules/\nwork/\nsaves/\n')
        (self.source / 'app').mkdir()
        (self.source / 'app/main.js').write_text('export const source = 1;\n')
        self.git('init', '--quiet')
        self.git('add', '.')
        self.commit()
        self.revision = self.git('rev-parse', 'HEAD').strip()
        self.shared = self.root / 'shared'
        self.store = self.shared / 'pnpm-store/v11'
        self.modules = self.source / 'node_modules'
        self.package = self.modules / '.pnpm/fixture@1.0.0/node_modules/fixture/index.js'
        # Admission logic is portable even if the test runner's TMPDIR is tmpfs.
        # This fixture label is never evidence about the real execution mount.
        mount = mock.patch.object(setup, 'filesystem_type', return_value='fixture-disk')
        mount.start()
        self.addCleanup(mount.stop)

    def tearDown(self):
        self.tmp.cleanup()

    def git(self, *args):
        return subprocess.check_output(
            ['git', '-C', str(self.source), *args], stderr=subprocess.PIPE).decode()

    def commit(self):
        self.git('-c', 'user.name=Setup fixture', '-c', 'user.email=fixture@localhost',
                 'commit', '--quiet', '-m', 'Synthetic setup metadata')

    def identity(self):
        return setup.source_identity(self.source, self.revision)

    def plan(self, shared=None, reserve=RESERVE, allocation=ALLOCATION):
        return setup.storage_plan(self.source, shared or self.shared, reserve, allocation)

    def check(self):
        return setup.verify_install(self.source, self.store)

    def assert_unchanged(self, operation, error=None):
        before = snapshot(self.root)
        if error:
            with self.assertRaises(error):
                operation()
            result = None
        else:
            result = operation()
        self.assertEqual(snapshot(self.root), before)
        return result

    def content_path(self, data=CONTENT, executable=False):
        sha = hashlib.sha512(data).hexdigest()
        return self.store / 'files' / sha[:2] / (sha[2:] + ('-exec' if executable else ''))

    def install_fixture(self, executable=False):
        """Write only a tiny expected pnpm topology, never run pnpm install."""
        blob = self.content_path(executable=executable)
        blob.parent.mkdir(parents=True)
        blob.write_bytes(CONTENT)
        if executable:
            blob.chmod(0o755)
        self.package.parent.mkdir(parents=True)
        os.link(blob, self.package)
        (self.modules / '.pnpm/lock.yaml').write_bytes(LOCK)
        (self.modules / '.modules.yaml').write_text(json.dumps({
            'storeDir': str(self.store),
            'packageManager': MANAGER,
            'nodeLinker': 'isolated',
            'virtualStoreDir': '.pnpm',
        }) + '\n')
        (self.modules / 'fixture').symlink_to('.pnpm/fixture@1.0.0/node_modules/fixture')
        return blob

    def update_modules(self, **changes):
        path = self.modules / '.modules.yaml'
        value = json.loads(path.read_bytes())
        value.update(changes)
        path.write_text(json.dumps(value) + '\n')

    def test_source_only_after_reset_has_no_assets_dependencies_or_store(self):
        # No public/original is needed just to edit or inspect metadata.
        result = self.assert_unchanged(self.identity)
        self.assertEqual(result['scope'], 'dependency-metadata-only')
        self.assertFalse(result['dependenciesAllocated'])
        self.assertFalse(result['assetsAllocated'])
        self.assertFalse(self.shared.exists())
        self.assertFalse(self.modules.exists())
        self.assertFalse((self.source / 'public').exists())

    def test_source_only_preserves_unrelated_dirty_work_saves_and_evidence(self):
        (self.source / 'app/main.js').write_text('export const source = "unfinished edit";\n')
        for name in ('saves/current.json', 'decomp/research/input.bin', 'work/receipt.json',
                     'untracked-notes.txt'):
            target = self.source / name
            target.parent.mkdir(parents=True, exist_ok=True)
            target.write_text('preserve ' + name + '\n')
        self.assert_unchanged(self.identity)

    def test_same_content_stat_drift_does_not_refresh_source_git_index(self):
        path = self.source / 'app/main.js'
        info = path.stat()
        os.utime(path, ns=(info.st_atime_ns, info.st_mtime_ns + 2_000_000_000))
        self.assert_unchanged(self.identity)

    def test_default_source_cli_never_calls_pnpm_or_allocates(self):
        binary = self.root / 'bin'
        binary.mkdir()
        log = self.root / 'unexpected-pnpm-invocation'
        fake = binary / 'pnpm'
        fake.write_text('#!/bin/sh\nprintf called > "$PND_FIXTURE_PNPM_LOG"\nexit 99\n')
        fake.chmod(0o755)
        before = snapshot(self.root)
        result = subprocess.run([sys.executable, str(HELPER), '--source', str(self.source),
                                 '--revision', self.revision], text=True, capture_output=True,
                                env={**os.environ, 'PATH': str(binary) + os.pathsep + os.environ['PATH'],
                                     'PYTHONDONTWRITEBYTECODE': '1', 'PND_FIXTURE_PNPM_LOG': str(log),
                                     'PND_SHARED_ROOT': str(self.shared)}, timeout=15)
        self.assertEqual(result.returncode, 0, result.stdout + result.stderr)
        self.assertIsInstance(json.loads(result.stdout), dict)
        self.assertFalse(log.exists())
        self.assertEqual(snapshot(self.root), before)

    def test_stale_revision_is_rejected_without_changes(self):
        self.assert_unchanged(lambda: setup.source_identity(self.source, '0' * 40), ValueError)

    def test_changed_committed_dependency_inputs_are_rejected(self):
        for name in ('package.json', 'package-lock.json', 'pnpm-lock.yaml', 'pnpm-workspace.yaml'):
            with self.subTest(input=name):
                path = self.source / name
                original = path.read_bytes()
                path.write_bytes(original + b'\n')
                self.assert_unchanged(self.identity, ValueError)
                path.write_bytes(original)

    def test_unpinned_committed_manager_is_rejected_without_changes(self):
        path = self.source / 'package.json'
        value = json.loads(path.read_bytes())
        value['packageManager'] = 'pnpm@11.24.0'
        path.write_text(json.dumps(value) + '\n')
        self.git('add', 'package.json')
        self.commit()
        self.revision = self.git('rev-parse', 'HEAD').strip()
        self.assert_unchanged(self.identity, ValueError)

    def test_metadata_symlink_and_hardlink_are_rejected_without_repair(self):
        path = self.source / 'pnpm-lock.yaml'
        kept = self.root / 'retained-lock'
        path.rename(kept)
        for kind in ('symlink', 'hardlink'):
            with self.subTest(kind=kind):
                if kind == 'symlink':
                    path.symlink_to(kept)
                else:
                    os.link(kept, path)
                self.assert_unchanged(self.identity, ValueError)
                path.unlink()

    def test_fresh_plan_and_warm_plan_allocate_nothing(self):
        result = self.assert_unchanged(self.plan)
        self.assertEqual(result['allocationBudgetBytes'], ALLOCATION)
        self.assertEqual(result['reserveBytes'], RESERVE)
        self.assertEqual(result['store'], str(self.store))
        self.assertFalse(result['allocates'])
        self.install_fixture()
        self.assertIsInstance(self.assert_unchanged(self.plan), dict)

    def test_ram_backed_shared_root_is_rejected_without_creation(self):
        for kind in ('tmpfs', 'ramfs'):
            with self.subTest(filesystem=kind), mock.patch.object(setup, 'filesystem_type', return_value=kind):
                self.assert_unchanged(self.plan, ValueError)

    def test_unknown_filesystem_stays_unknown_not_disk_backed_evidence(self):
        with mock.patch.object(setup, 'filesystem_type', return_value='unknown'):
            result = self.assert_unchanged(self.plan)
        self.assertEqual(result['filesystemType'], 'unknown')
        self.assertIn('not a reservation', result['limits'])

    def test_nonpositive_or_insufficient_admission_preserves_all_paths(self):
        for reserve, allocation in ((0, ALLOCATION), (RESERVE, 0), (-1, ALLOCATION),
                                     (RESERVE, -1)):
            with self.subTest(reserve=reserve, allocation=allocation):
                self.assert_unchanged(lambda: self.plan(reserve=reserve, allocation=allocation), ValueError)
        self.assert_unchanged(lambda: self.plan(reserve=10**20), ValueError)

    def test_exact_capacity_boundary_includes_reserve_and_allocation(self):
        enough = SimpleNamespace(f_frsize=4096, f_bavail=(RESERVE + ALLOCATION) // 4096,
                                 f_favail=10000, f_files=10000)
        short = SimpleNamespace(**{**vars(enough), 'f_bavail': enough.f_bavail - 1})
        with mock.patch.object(setup.os, 'statvfs', return_value=short):
            self.assert_unchanged(self.plan, ValueError)
        with mock.patch.object(setup.os, 'statvfs', return_value=enough):
            self.assert_unchanged(self.plan)

    def test_post_install_admission_charges_remaining_reserve_not_spent_allocation(self):
        self.install_fixture()
        enough = SimpleNamespace(f_frsize=4096, f_bavail=RESERVE // 4096,
                                 f_favail=10000, f_files=10000)
        short = SimpleNamespace(**{**vars(enough), 'f_bavail': enough.f_bavail - 1})
        postcheck = lambda: setup.storage_plan(self.source, self.shared, RESERVE, 0, post_install=True)
        with mock.patch.object(setup.os, 'statvfs', return_value=enough):
            result = self.assert_unchanged(postcheck)
        self.assertEqual(result['allocationBudgetBytes'], 0)
        self.assertEqual(result['reserveBytes'], RESERVE)
        with mock.patch.object(setup.os, 'statvfs', return_value=short):
            self.assert_unchanged(postcheck, ValueError)
        self.assert_unchanged(lambda: setup.storage_plan(
            self.source, self.shared, RESERVE, ALLOCATION, post_install=True), ValueError)

    def test_nested_and_relative_roots_are_rejected_without_creation(self):
        for shared in (self.source, self.source / 'private-store', self.root, Path('relative-store')):
            with self.subTest(shared=str(shared)):
                self.assert_unchanged(lambda: self.plan(shared=shared), ValueError)

    def linked_worktrees(self):
        roots = (self.root / 'linked source one', self.root / 'linked\nsource two')
        for root in roots:
            self.git('worktree', 'add', '--quiet', '--detach', str(root), self.revision)
        return roots

    def test_linked_worktrees_share_store_but_keep_private_layouts(self):
        first, second = self.linked_worktrees()
        blob = self.install_fixture()
        for source in (first, second):
            modules = source / 'node_modules'
            package = modules / '.pnpm/fixture@1.0.0/node_modules/fixture/index.js'
            package.parent.mkdir(parents=True)
            os.link(blob, package)
            (modules / '.modules.yaml').write_bytes((self.modules / '.modules.yaml').read_bytes())
            (modules / '.pnpm/lock.yaml').write_bytes(LOCK)
            (modules / 'fixture').symlink_to('.pnpm/fixture@1.0.0/node_modules/fixture')
            (modules / '.cache').mkdir()
            (modules / '.cache/private').write_text(source.name)
        for source in (self.source, first, second):
            plan = self.assert_unchanged(lambda: setup.storage_plan(
                source, self.shared, RESERVE, ALLOCATION))
            self.assertEqual(plan['store'], str(self.store))
            result = self.assert_unchanged(lambda: setup.verify_install(source, self.store))
            self.assertEqual(result['sharedFiles'], 1)
            self.assertEqual(result['nonSharedFiles'], 0)
            self.assertEqual(result['uniqueSharedBytes'], len(CONTENT))
        for relative in ('node_modules/.modules.yaml', 'node_modules/.pnpm/lock.yaml',
                         'node_modules/.cache/private'):
            a, b = (source / relative for source in (first, second))
            self.assertNotEqual((a.stat().st_dev, a.stat().st_ino),
                                (b.stat().st_dev, b.stat().st_ino))
            self.assertEqual(a.stat().st_nlink, 1)
            self.assertEqual(b.stat().st_nlink, 1)

    def test_every_registered_worktree_is_excluded_from_shared_storage(self):
        first, second = self.linked_worktrees()
        for source in (self.source, first, second):
            for protected in (self.source, first, second):
                for shared in (protected, protected / 'packages'):
                    with self.subTest(source=source, shared=shared):
                        self.assert_unchanged(lambda: setup.storage_plan(
                            source, shared, RESERVE, ALLOCATION), ValueError)
        # An ancestor of a sibling also conflicts even when source is outside it.
        parent = self.root / 'worktree-group'
        nested = parent / 'nested'
        parent.mkdir()
        self.git('worktree', 'add', '--quiet', '--detach', str(nested), self.revision)
        self.assert_unchanged(lambda: self.plan(shared=parent), ValueError)

    def test_missing_or_symlinked_registered_worktree_fails_without_repair(self):
        first, _ = self.linked_worktrees()
        held = self.root / 'held-linked-source'
        first.rename(held)
        self.assert_unchanged(self.plan, (ValueError, OSError))
        first.symlink_to(held, target_is_directory=True)
        self.assert_unchanged(self.plan, ValueError)

    def test_registered_worktree_inventory_drift_refuses_admission(self):
        self.linked_worktrees()
        original = setup.run_git
        calls = 0

        def changed_inventory(source, *args):
            nonlocal calls
            result = original(source, *args)
            if args == ('worktree', 'list', '--porcelain', '-z'):
                calls += 1
                if calls == 2:
                    return result + b'worktree ' + os.fsencode(self.root) + b'\0\0'
            return result

        with mock.patch.object(setup, 'run_git', side_effect=changed_inventory):
            self.assert_unchanged(self.plan, ValueError)

    def test_symlinked_or_dangling_shared_ancestor_is_rejected(self):
        real = self.root / 'physical'
        real.mkdir()
        for target in (real, self.root / 'absent'):
            self.shared.symlink_to(target, target_is_directory=True)
            self.assert_unchanged(lambda: self.plan(shared=self.shared / 'nested'), ValueError)
            self.shared.unlink()

    def test_existing_shared_root_on_other_device_is_rejected(self):
        self.shared.mkdir()
        original_stat = Path.stat

        def altered_device(path, *args, **kwargs):
            value = original_stat(path, *args, **kwargs)
            if path == self.shared:
                fields = list(value)
                fields[2] += 1
                return os.stat_result(fields)
            return value

        with mock.patch.object(Path, 'stat', altered_device):
            self.assert_unchanged(self.plan, ValueError)

    def test_existing_dependency_layout_remains_untouched_by_plan(self):
        self.install_fixture()
        (self.shared / '.writer-lock').mkdir()
        (self.shared / '.writer-lock/owner').write_text('unknown retained owner\n')
        self.assert_unchanged(self.plan)
        self.assert_unchanged(self.identity)

    def test_missing_installation_fails_without_provisioning(self):
        self.assert_unchanged(self.check, (ValueError, OSError))

    def test_valid_installation_verification_is_read_only(self):
        self.install_fixture()
        result = self.assert_unchanged(self.check)
        self.assertEqual(result['status'], 'verified')
        self.assertEqual(result['packageFiles'], 1)
        self.assertEqual(result['sharedFiles'], 1)
        self.assertEqual(result['sharedBytes'], len(CONTENT))
        self.assertEqual(result['uniqueSharedBytes'], len(CONTENT))
        self.assertEqual(result['nonSharedFiles'], 0)
        self.assertEqual(result['foreignHardlinkFiles'], 0)
        self.assertEqual(result['coverageBytes'], 1)

    def test_warm_shared_inode_is_reused_without_double_counting_unique_bytes(self):
        blob = self.install_fixture()
        second = self.package.parent / 'same-content.js'
        os.link(blob, second)
        result = self.assert_unchanged(self.check)
        self.assertEqual(result['packageFiles'], 2)
        self.assertEqual(result['sharedFiles'], 2)
        self.assertEqual(result['packageBytes'], 2 * len(CONTENT))
        self.assertEqual(result['sharedBytes'], 2 * len(CONTENT))
        self.assertEqual(result['uniqueSharedBytes'], len(CONTENT))

    def test_equal_byte_private_copy_receives_no_sharing_credit(self):
        blob = self.install_fixture()
        self.package.unlink()
        shutil.copyfile(blob, self.package)
        result = self.assert_unchanged(self.check)
        self.assertEqual(result['packageFiles'], 1)
        self.assertEqual(result['sharedFiles'], 0)
        self.assertEqual(result['sharedBytes'], 0)
        self.assertEqual(result['uniqueSharedBytes'], 0)
        self.assertEqual(result['nonSharedFiles'], 1)
        self.assertEqual(result['nonSharedBytes'], len(CONTENT))
        self.assertEqual(result['foreignHardlinkFiles'], 0)
        self.assertEqual(result['coverageBytes'], 0)

    def test_foreign_hardlink_receives_no_declared_store_sharing_credit(self):
        self.install_fixture()
        foreign = self.root / 'foreign-identical-content'
        foreign.write_bytes(CONTENT)
        self.package.unlink()
        os.link(foreign, self.package)
        result = self.assert_unchanged(self.check)
        self.assertEqual(result['sharedFiles'], 0)
        self.assertEqual(result['nonSharedFiles'], 1)
        self.assertEqual(result['foreignHardlinkFiles'], 1)
        self.assertEqual(result['uniqueSharedBytes'], 0)

    def test_requires_build_style_private_file_is_measured_not_rejected(self):
        self.install_fixture()
        # Pinned pnpm may copy/clone packages that require mutable build steps.
        # The guard measures this private file; it does not claim why it is private.
        private = self.modules / '.pnpm/build-fixture@1.0.0/node_modules/build-fixture/index.js'
        private.parent.mkdir(parents=True)
        private.write_bytes(b'private per-layout package\n')
        result = self.assert_unchanged(self.check)
        self.assertEqual(result['packageFiles'], 2)
        self.assertEqual(result['sharedFiles'], 1)
        self.assertEqual(result['nonSharedFiles'], 1)
        self.assertEqual(result['nonSharedBytes'], private.stat().st_size)
        self.assertEqual(result['foreignHardlinkFiles'], 0)
        self.assertEqual(result['coverageBytes'], len(CONTENT) / (len(CONTENT) + private.stat().st_size))

    def test_executable_content_uses_exec_address(self):
        self.install_fixture(executable=True)
        result = self.assert_unchanged(self.check)
        self.assertEqual(result['sharedFiles'], 1)
        self.assertEqual(result['sharedBytes'], len(CONTENT))

    def test_wrong_content_filename_or_exec_suffix_is_not_reuse(self):
        blob = self.install_fixture(executable=True)
        for name in ('incorrect-sha512-name', blob.name.removesuffix('-exec')):
            with self.subTest(filename=name):
                renamed = blob.with_name(name)
                blob.rename(renamed)
                result = self.assert_unchanged(self.check)
                self.assertEqual(result['sharedFiles'], 0)
                self.assertEqual(result['foreignHardlinkFiles'], 1)
                renamed.rename(blob)

    def test_correct_content_address_as_symlink_is_rejected(self):
        blob = self.install_fixture()
        retained = self.root / 'retained-package-content'
        blob.rename(retained)
        blob.symlink_to(retained)
        self.assert_unchanged(self.check, ValueError)

    def test_correct_content_address_with_symlink_ancestor_is_rejected(self):
        blob = self.install_fixture()
        retained = self.root / 'retained-content-bucket'
        blob.parent.rename(retained)
        blob.parent.symlink_to(retained, target_is_directory=True)
        self.assert_unchanged(self.check, ValueError)

    def test_wrong_store_or_stale_manager_metadata_fails_closed(self):
        self.install_fixture()
        for changes in ({'storeDir': str(self.root / 'foreign/v11')},
                        {'packageManager': 'pnpm@11.24.0'}, {'nodeLinker': 'hoisted'},
                        {'virtualStoreDir': str(self.root / 'foreign-virtual')}):
            with self.subTest(changes=changes):
                path = self.modules / '.modules.yaml'
                original = path.read_bytes()
                self.update_modules(**changes)
                self.assert_unchanged(self.check, ValueError)
                path.write_bytes(original)

    def test_stale_installed_lock_is_rejected_and_preserved(self):
        self.install_fixture()
        (self.modules / '.pnpm/lock.yaml').write_bytes(LOCK + b'# stale\n')
        self.assert_unchanged(self.check, ValueError)

    def test_dependency_symlink_escape_is_rejected_without_repair(self):
        self.install_fixture()
        target = self.root / 'outside-package.js'
        target.write_bytes(CONTENT)
        self.package.unlink()
        self.package.symlink_to(target)
        self.assert_unchanged(self.check, ValueError)

    def test_mutable_cache_aliases_are_rejected_without_touching_targets(self):
        self.install_fixture()
        outside = self.root / 'other-cache'
        outside.mkdir()
        data = outside / 'retained'
        data.write_text('private mutable output\n')
        for name in ('.vite', '.vite-temp', '.cache'):
            with self.subTest(cache=name):
                cache = self.modules / name
                cache.symlink_to(outside, target_is_directory=True)
                self.assert_unchanged(self.check, ValueError)
                cache.unlink()
                cache.mkdir()
                os.link(data, cache / 'retained')
                self.assert_unchanged(self.check, ValueError)
                (cache / 'retained').unlink()
                cache.rmdir()

    def test_store_path_symlinks_fail_without_replacing_shared_content(self):
        self.install_fixture()
        held = self.root / 'retained-v11'
        self.store.rename(held)
        self.store.symlink_to(held, target_is_directory=True)
        self.assert_unchanged(self.check, ValueError)

    def test_same_byte_package_inode_replacement_during_audit_invalidates_result(self):
        blob = self.install_fixture()
        original_hash = setup.stable_hash
        replaced = False

        def swap_after_hash(path):
            nonlocal replaced
            result = original_hash(path)
            if path == self.package and not replaced:
                replaced = True
                self.package.unlink()
                self.package.write_bytes(CONTENT)
            return result

        with mock.patch.object(setup, 'stable_hash', swap_after_hash):
            with self.assertRaises(ValueError):
                self.check()
        self.assertTrue(replaced)
        self.assertFalse(self.package.samefile(blob))
        self.assertEqual(blob.read_bytes(), CONTENT)
        self.assertEqual(self.package.read_bytes(), CONTENT)

    def test_metadata_change_before_dependency_snapshot_invalidates_result(self):
        self.install_fixture()
        original_identity = setup.dependency_identity
        changed = False

        def change_before_snapshot(source):
            nonlocal changed
            if not changed:
                changed = True
                self.update_modules(storeDir=str(self.root / 'foreign/v11'))
            return original_identity(source)

        with mock.patch.object(setup, 'dependency_identity', change_before_snapshot):
            with self.assertRaises(ValueError):
                self.check()
        self.assertTrue(changed)
        self.assertEqual(json.loads((self.modules / '.modules.yaml').read_bytes())['storeDir'],
                         str(self.root / 'foreign/v11'))

    def test_source_metadata_drift_during_cli_check_refuses_terminal_success(self):
        self.install_fixture()
        original_check = setup.verify_install

        def change_after_check(source, store):
            result = original_check(source, store)
            (self.source / 'pnpm-lock.yaml').write_bytes(LOCK + b'# changed during check\n')
            return result

        with mock.patch.object(setup, 'verify_install', change_after_check):
            with self.assertRaises(ValueError):
                setup.main(['check', '--source', str(self.source), '--revision', self.revision,
                            '--shared-root', str(self.shared), '--reserve-bytes', str(RESERVE)])
        self.assertEqual((self.source / 'pnpm-lock.yaml').read_bytes(),
                         LOCK + b'# changed during check\n')


if __name__ == '__main__':
    unittest.main()
