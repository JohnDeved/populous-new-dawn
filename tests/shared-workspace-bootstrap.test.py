"""Tiny offline fixtures only. No package manager, vendor recovery or real workspace."""
import argparse
import hashlib
import json
import os
from pathlib import Path
import subprocess
import sys
import tempfile
import unittest
from unittest.mock import patch

sys.dont_write_bytecode = True
SOURCE = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(SOURCE / 'scripts/orchestration'))
import shared_workspace as w


class SharedWorkspaceTests(unittest.TestCase):
    def setUp(self):
        parent = os.environ.get('PND_BOOTSTRAP_FIXTURE_ROOT')
        if not parent:
            self.fail('Set PND_BOOTSTRAP_FIXTURE_ROOT to an approved private fixture directory')
        self.tmp = tempfile.TemporaryDirectory(prefix='fixture-', dir=parent)
        self.addCleanup(self.tmp.cleanup)
        self.root = Path(self.tmp.name)
        self.source = self.root / 'donor'
        self.source.mkdir()
        self.commands = []
        real_run = subprocess.run
        def git_only(argv, **kwargs):
            self.assertEqual(argv[0], 'git', 'No installs, tools, shells or network commands in warm path')
            self.assertEqual(os.environ.get('GIT_ALLOW_PROTOCOL'), 'file')
            self.assertEqual(os.environ.get('GIT_NO_LAZY_FETCH'), '1')
            self.assertFalse(any(arg in ('fetch', 'pull', 'push') for arg in argv))
            self.commands.append([str(arg) for arg in argv])
            return real_run(argv, **kwargs)
        self.addCleanup(patch.stopall)
        patch('subprocess.run', side_effect=git_only).start()
        with w.local_git_only():
            w.git(self.source, 'init', '--quiet', '--template=', '-b', 'main')
            files = {'package.json': json.dumps({'packageManager': w.setup.MANAGER}),
                     'package-lock.json': '{}\n', 'pnpm-lock.yaml': 'lockfileVersion: 9.0\n',
                     'pnpm-workspace.yaml': 'nodeLinker: isolated\npackageImportMethod: hardlink\n',
                     '.gitignore': 'node_modules/\nwork/\n', 'main.js': 'export default 1;\n',
                     'public/original/sample.json': '{"asset":true}\n'}
            for name, data in files.items():
                path = self.source / name
                path.parent.mkdir(parents=True, exist_ok=True)
                path.write_text(data)
            w.git(self.source, 'add', '.')
            w.git(self.source, '-c', 'user.name=Fixture', '-c', 'user.email=fixture@example.invalid',
                  'commit', '--quiet', '-m', 'fixture')
            revision = w.git(self.source, 'rev-parse', 'HEAD').decode().strip()
        self.shared, self.workspaces = self.root / 'shared', self.root / 'workspaces'
        self.roots = {'shared': self.shared, 'workspaces': self.workspaces,
                      'store': self.shared / 'pnpm-store/v11', 'assets': self.shared / 'assets'}
        for path in self.roots.values():
            path.mkdir(parents=True, exist_ok=True)
        self.binding_path = self.root / 'binding.json'
        self.binding = {'schema': 1, 'storageId': 'fixture-store', 'repository': w.REPOSITORY,
                        'roots': {name: {'path': str(path), 'device': path.stat().st_dev,
                                         'inode': path.stat().st_ino} for name, path in self.roots.items()}}
        self.args = argparse.Namespace(binding=self.binding_path, binding_sha256=None, source=self.source,
                                       ref=revision, worktree='worker-one', reserve_bytes=1024 * 1024,
                                       allocation_bytes=16 * 1024 * 1024, mode='source', apply=False)
        self.bind()

    def bind(self):
        self.binding_path.write_text(json.dumps(self.binding))
        self.args.binding_sha256 = hashlib.sha256(self.binding_path.read_bytes()).hexdigest()
        owner = {'schema': 1, 'storageId': self.binding['storageId'], 'bindingSha256': self.args.binding_sha256}
        for name in ('shared', 'workspaces'):
            (Path(self.binding['roots'][name]['path']) / w.OWNER).write_text(json.dumps(owner))

    def run_workspace(self):
        return w.execute(self.args)

    def prepared_target(self):
        self.args.apply = True
        self.run_workspace()
        job = self.workspaces / self.args.worktree
        receipts = {path: path.read_bytes() for path in job.glob('attempt-*')}
        return job / 'source', receipts

    def rejected_without_receipt_changes(self, receipts, message):
        with self.assertRaisesRegex(ValueError, message):
            self.run_workspace()
        for path, original in receipts.items():
            self.assertEqual(path.read_bytes(), original)

    def seed_tiny_runtime_inputs(self):
        # Three tiny fixture paths, not any installed package or full game checkout.
        (self.roots['store'] / 'files/00').mkdir(parents=True)
        (self.roots['store'] / 'files/00/fixture').write_text('not a qualified package closure')
        payload = (self.source / 'public/original/sample.json').read_bytes()
        sha = hashlib.sha256(payload).hexdigest()
        with w.local_git_only():
            tree = w.git(self.source, 'rev-parse', self.args.ref + ':public/original').decode().strip()
        blob = self.roots['assets'] / 'blobs' / sha
        blob.parent.mkdir()
        blob.write_bytes(payload)
        target = self.roots['assets'] / 'trees-v2' / tree / 'sample.json'
        target.parent.mkdir(parents=True)
        os.link(blob, target)

    def test_source_plan_is_read_only_and_never_scans_assets(self):
        before = sorted(str(p.relative_to(self.root)) for p in self.root.rglob('*'))
        with patch.object(w.runtime, 'source_state', side_effect=AssertionError('No asset scan')):
            plan = self.run_workspace()
        self.assertFalse(plan['allocates'])
        self.assertFalse(plan['dependenciesInstalled'])
        self.assertEqual(before, sorted(str(p.relative_to(self.root)) for p in self.root.rglob('*')))

    def test_source_apply_shares_only_git_objects_and_omits_assets_and_dependencies(self):
        self.args.apply = True
        self.assertEqual(self.run_workspace()['status'], 'prepared-source-only')
        target = self.workspaces / self.args.worktree / 'source'
        self.assertEqual((target / 'main.js').read_bytes(), (self.source / 'main.js').read_bytes())
        self.assertFalse((target / 'public/original').exists())
        self.assertFalse((target / 'node_modules').exists())
        self.assertIn(str(self.source / '.git/objects'), (target / '.git/objects/info/alternates').read_text())
        clone = next(command for command in self.commands if 'clone' in command)
        self.assertIn('--no-checkout', clone)
        self.assertIn('--shared', clone)
        self.assertEqual(self.run_workspace()['status'], 'reused')
        self.assertEqual(sum('clone' in command for command in self.commands), 1)

    def test_two_workers_reuse_one_binding_without_package_or_asset_payload(self):
        self.args.apply = True
        self.run_workspace()
        self.args.worktree = 'worker-two'
        self.run_workspace()
        self.assertEqual(list(self.roots['store'].iterdir()), [])
        self.assertEqual(list(self.roots['assets'].iterdir()), [])
        for name in ('worker-one', 'worker-two'):
            self.assertFalse((self.workspaces / name / 'source/public/original').exists())

    def test_missing_binding_is_not_reconstructed(self):
        self.args.binding = self.root / 'missing.json'
        with self.assertRaises(FileNotFoundError):
            self.run_workspace()
        self.assertFalse(self.args.binding.exists())

    def test_conflicting_owner_is_not_rewritten(self):
        marker = self.shared / w.OWNER
        marker.write_text('{}')
        with self.assertRaisesRegex(ValueError, 'ownership'):
            self.run_workspace()
        self.assertEqual(marker.read_text(), '{}')

    def test_binding_hash_mismatch_blocks(self):
        self.args.binding_sha256 = '0' * 64
        with self.assertRaisesRegex(ValueError, 'hash differs'):
            self.run_workspace()

    def test_missing_store_does_not_create_second_store(self):
        self.roots['store'].rename(self.shared / 'held-store')
        with self.assertRaisesRegex(ValueError, 'Missing physical'):
            self.run_workspace()
        self.assertFalse(self.roots['store'].exists())

    def test_relocated_root_identity_is_not_adopted(self):
        self.workspaces.rename(self.root / 'held-workspaces')
        self.workspaces.mkdir()
        with self.assertRaisesRegex(ValueError, 'replaced or relocated'):
            self.run_workspace()

    def test_nested_roots_are_rejected(self):
        nested = self.shared / 'nested'
        nested.mkdir()
        self.binding['roots']['workspaces'] = {'path': str(nested), 'device': nested.stat().st_dev,
                                                'inode': nested.stat().st_ino}
        self.bind()
        with self.assertRaisesRegex(ValueError, 'nonnested'):
            self.run_workspace()

    def test_symlinked_root_is_rejected(self):
        self.workspaces.rename(self.root / 'real-workspaces')
        self.workspaces.symlink_to(self.root / 'real-workspaces')
        with self.assertRaisesRegex(ValueError, 'Symlink'):
            self.run_workspace()

    def test_different_filesystem_is_rejected(self):
        store = self.roots['store']
        self.binding['roots']['store']['device'] += 1
        self.bind()
        original_stat = Path.stat
        def other_device(path, *args, **kwargs):
            value = original_stat(path, *args, **kwargs)
            if path == store:
                fields = list(value)
                fields[2] += 1
                return os.stat_result(fields)
            return value
        with patch.object(Path, 'stat', other_device):
            with self.assertRaisesRegex(ValueError, 'share a filesystem'):
                self.run_workspace()

    def test_missing_registered_worktree_is_not_pruned(self):
        sibling = self.root / 'sibling'
        with w.local_git_only():
            w.git(self.source, 'worktree', 'add', '--detach', '--no-checkout', sibling, self.args.ref)
        sibling.rename(self.root / 'held-sibling')
        with self.assertRaisesRegex(ValueError, 'Missing physical'):
            self.run_workspace()
        with w.local_git_only():
            self.assertIn(str(sibling), w.git(self.source, 'worktree', 'list', '--porcelain').decode())

    def test_alternate_named_store_is_not_adopted(self):
        other = self.shared / 'second-store'
        other.mkdir()
        self.binding['roots']['store'] = {'path': str(other), 'device': other.stat().st_dev,
                                          'inode': other.stat().st_ino}
        self.bind()
        with self.assertRaisesRegex(ValueError, 'Conflicting named store'):
            self.run_workspace()

    def test_dirty_donor_is_preserved(self):
        file = self.source / 'main.js'
        file.write_text('user edits')
        with self.assertRaisesRegex(ValueError, 'has changes'):
            self.run_workspace()
        self.assertEqual(file.read_text(), 'user edits')

    def test_dirty_created_workspace_and_receipt_are_preserved(self):
        self.args.apply = True
        self.run_workspace()
        job = self.workspaces / self.args.worktree
        receipt = next(job.glob('attempt-*.json'))
        original = receipt.read_bytes()
        (job / 'source/main.js').write_text('work in progress')
        with self.assertRaisesRegex(ValueError, 'has changes'):
            self.run_workspace()
        self.assertEqual(receipt.read_bytes(), original)
        self.assertEqual((job / 'source/main.js').read_text(), 'work in progress')

    def test_unowned_existing_workspace_is_preserved(self):
        job = self.workspaces / self.args.worktree
        job.mkdir()
        (job / 'evidence').write_text('held')
        with self.assertRaises(FileNotFoundError):
            self.run_workspace()
        self.assertEqual((job / 'evidence').read_text(), 'held')

    def test_present_skip_worktree_donor_edits_are_authenticated(self):
        with w.local_git_only():
            w.git(self.source, 'update-index', '--skip-worktree', 'main.js')
            (self.source / 'main.js').write_text('export default 2;\n')
            self.assertEqual(w.git(self.source, 'status', '--porcelain'), b'')
        with self.assertRaisesRegex(ValueError, 'File content changed'):
            self.run_workspace()
        self.assertEqual((self.source / 'main.js').read_text(), 'export default 2;\n')
        self.assertFalse((self.workspaces / self.args.worktree).exists())

    def test_present_skip_worktree_target_edits_preserve_bytes_and_receipts(self):
        target, receipts = self.prepared_target()
        with w.local_git_only():
            # Active sparse-checkout can unmask present files in newer Git. Model
            # an explicitly altered target config so this really is hidden dirt;
            # keep the clean-status and content-authentication assertions intact.
            w.git(target, 'config', '--worktree', 'core.sparseCheckout', 'false')
            w.git(target, 'update-index', '--skip-worktree', 'main.js')
            (target / 'main.js').write_text('export default 2;\n')
            self.assertEqual(w.git(target, 'status', '--porcelain'), b'')
        self.rejected_without_receipt_changes(receipts, 'File content changed')
        self.assertEqual((target / 'main.js').read_text(), 'export default 2;\n')

    def test_target_projection_cannot_omit_skip_worktree_source(self):
        target, receipts = self.prepared_target()
        with w.local_git_only():
            w.git(target, 'update-index', '--skip-worktree', 'main.js')
        (target / 'main.js').unlink()
        self.rejected_without_receipt_changes(receipts, 'Missing required source projection')
        self.assertFalse((target / 'main.js').exists())

    def test_target_executable_mode_authenticated_when_git_ignores_filemode(self):
        target, receipts = self.prepared_target()
        with w.local_git_only():
            w.git(target, 'config', 'core.filemode', 'false')
        (target / 'main.js').chmod(0o755)
        self.rejected_without_receipt_changes(receipts, 'Source executable mode changed')
        self.assertTrue((target / 'main.js').stat().st_mode & 0o111)

    def test_authenticated_donor_sparse_omission_materializes_complete_target(self):
        with w.local_git_only():
            w.git(self.source, 'update-index', '--skip-worktree', 'main.js')
        (self.source / 'main.js').unlink()
        plan = self.run_workspace()
        self.assertEqual(plan['sourceIdentity']['workingFiles']['authenticatedDonorSparseOmissions'], ['main.js'])
        target, _ = self.prepared_target()
        self.assertEqual((target / 'main.js').read_text(), 'export default 1;\n')
        self.assertFalse((self.source / 'main.js').exists())

    def test_symlinked_target_git_directory_is_not_adopted(self):
        target, receipts = self.prepared_target()
        held = target.parent / 'held-git'
        (target / '.git').rename(held)
        (target / '.git').symlink_to(held)
        self.rejected_without_receipt_changes(receipts, 'standalone physical .git')
        self.assertTrue((target / '.git').is_symlink())
        self.assertTrue(held.is_dir())

    def test_external_target_gitfile_is_not_adopted(self):
        target, receipts = self.prepared_target()
        held = target.parent / 'held-git'
        (target / '.git').rename(held)
        text = f'gitdir: {held}\n'
        (target / '.git').write_text(text)
        self.rejected_without_receipt_changes(receipts, 'standalone physical .git')
        self.assertEqual((target / '.git').read_text(), text)

    def test_target_object_directory_symlink_is_not_adopted(self):
        target, receipts = self.prepared_target()
        held = target.parent / 'held-objects'
        (target / '.git/objects').rename(held)
        (target / '.git/objects').symlink_to(held)
        self.rejected_without_receipt_changes(receipts, 'Symlink')
        self.assertTrue((target / '.git/objects').is_symlink())

    def test_target_alternate_redirect_is_not_adopted(self):
        target, receipts = self.prepared_target()
        alternate = target / '.git/objects/info/alternates'
        other = self.root / 'other-objects'
        other.mkdir()
        text = str(other) + '\n'
        alternate.write_text(text)
        self.rejected_without_receipt_changes(receipts, 'alternates differ')
        self.assertEqual(alternate.read_text(), text)

    def test_equal_byte_alternate_replacement_changes_private_identity(self):
        target, receipts = self.prepared_target()
        alternate = target / '.git/objects/info/alternates'
        original = alternate.read_bytes()
        alternate.rename(target.parent / 'held-alternates')
        alternate.write_bytes(original)
        self.rejected_without_receipt_changes(receipts, 'private Git metadata changed')
        self.assertEqual(alternate.read_bytes(), original)

    def test_unexpected_target_worktree_registration_is_preserved(self):
        target, receipts = self.prepared_target()
        sibling = self.root / 'unrelated-target-worktree'
        with w.local_git_only():
            w.git(target, 'worktree', 'add', '--detach', '--no-checkout', sibling, self.args.ref)
        self.rejected_without_receipt_changes(receipts, 'Unexpected target worktree registration')
        self.assertTrue(sibling.is_dir())

    def test_linked_worktree_donor_is_explicitly_unsupported(self):
        sibling = self.root / 'linked-donor'
        with w.local_git_only():
            w.git(self.source, 'worktree', 'add', '--detach', sibling, self.args.ref)
        self.args.source = sibling
        with self.assertRaisesRegex(ValueError, 'standalone physical .git'):
            self.run_workspace()
        self.assertTrue((sibling / '.git').is_file())
        self.assertFalse((self.workspaces / self.args.worktree).exists())

    def test_alternate_backed_donor_is_explicitly_unsupported(self):
        other = self.root / 'other-objects'
        other.mkdir()
        alternate = self.source / '.git/objects/info/alternates'
        alternate.write_text(str(other) + '\n')
        with self.assertRaisesRegex(ValueError, 'Alternate-backed donors are unsupported'):
            self.run_workspace()
        self.assertEqual(alternate.read_text(), str(other) + '\n')

    def test_donor_common_directory_redirection_is_preserved(self):
        redirect = self.source / '.git/commondir'
        redirect.write_text('../external\n')
        with self.assertRaisesRegex(ValueError, 'Redirected Git common directory'):
            self.run_workspace()
        self.assertEqual(redirect.read_text(), '../external\n')

    def test_unknown_filesystem_evidence_fails_closed(self):
        with patch.object(w.setup, 'filesystem_type', return_value='unknown'):
            with self.assertRaisesRegex(ValueError, 'known non-RAM-backed'):
                self.run_workspace()
        self.assertFalse((self.workspaces / self.args.worktree).exists())

    def test_interrupted_source_creation_is_not_adopted_or_retried(self):
        self.args.apply = True
        original_git = w.git
        def interrupted(source, *args, **kwargs):
            if 'clone' in args:
                raise RuntimeError('fixture interruption')
            return original_git(source, *args, **kwargs)
        with patch.object(w, 'git', side_effect=interrupted):
            with self.assertRaisesRegex(RuntimeError, 'interruption'):
                self.run_workspace()
        job = self.workspaces / self.args.worktree
        receipt = next(job.glob('attempt-*.json'))
        original = receipt.read_bytes()
        self.assertEqual(json.loads(original)['status'], 'blocked')
        with self.assertRaises(FileNotFoundError):
            self.run_workspace()
        self.assertEqual(receipt.read_bytes(), original)

    def test_runtime_plan_reuses_named_store_and_private_cache_but_cannot_execute(self):
        self.seed_tiny_runtime_inputs()
        self.args.mode = 'runtime'
        plan = self.run_workspace()['runtime']
        self.assertEqual(plan['status'], 'plan-only')
        self.assertIn('--offline', plan['installArgv'])
        self.assertIn(str(self.roots['store']), plan['installArgv'])
        self.assertIn(str(self.workspaces / self.args.worktree / 'pnpm-cache'), plan['installArgv'])
        self.assertFalse((self.workspaces / self.args.worktree).exists())
        self.args.apply = True
        with self.assertRaisesRegex(ValueError, 'plan-only'):
            self.run_workspace()

    def test_runtime_offline_miss_never_falls_back_online(self):
        self.args.mode = 'runtime'
        with self.assertRaisesRegex(ValueError, 'Missing physical'):
            self.run_workspace()
        self.assertFalse(any('install' in command or 'fetch' in command for command in self.commands))

    def test_changed_lock_and_wrong_revision_fail_without_recovery(self):
        (self.source / 'pnpm-lock.yaml').write_text('changed')
        with self.assertRaisesRegex(ValueError, 'metadata differs'):
            self.run_workspace()
        self.args.ref = '0' * 40
        with self.assertRaisesRegex(ValueError, 'HEAD differs'):
            self.run_workspace()

    def test_cli_default_plan_never_enters_native_recovery(self):
        import importlib.util
        spec = importlib.util.spec_from_file_location('bootstrap', SOURCE / 'scripts/cloud-bootstrap.py')
        bootstrap = importlib.util.module_from_spec(spec)
        spec.loader.exec_module(bootstrap)
        argv = ['cloud-bootstrap.py', '--source', str(self.source), '--binding', str(self.binding_path),
                '--binding-sha256', self.args.binding_sha256, '--ref', self.args.ref,
                '--worktree', 'cli-worker', '--reserve-bytes', str(self.args.reserve_bytes),
                '--allocation-bytes', str(self.args.allocation_bytes)]
        with patch.object(sys, 'argv', argv), patch.object(bootstrap.Bootstrap, 'execute',
                side_effect=AssertionError('Native/tool recovery must not run')), patch('builtins.print'):
            bootstrap.main()
        self.assertFalse((self.workspaces / 'cli-worker').exists())


if __name__ == '__main__':
    unittest.main()
