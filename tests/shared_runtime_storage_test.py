import importlib.util
import json
import os
from pathlib import Path
import subprocess
import sys
import tempfile
import unittest

HELPER = Path(__file__).resolve().parents[1] / 'scripts/orchestration/shared_runtime.py'
spec = importlib.util.spec_from_file_location('shared_runtime', HELPER)
storage = importlib.util.module_from_spec(spec)
spec.loader.exec_module(storage)

class SharedRuntimeTests(unittest.TestCase):
    def setUp(self):
        self.tmp = tempfile.TemporaryDirectory(prefix='pnd-shared-runtime-test-')
        self.root = Path(self.tmp.name)
        self.source = self.root / 'source'
        self.source.mkdir()
        (self.source / 'public/original/sub').mkdir(parents=True)
        (self.source / 'public/original/sub/game.bin').write_bytes(b'verified original game asset\x00\xff')
        (self.source / 'app').mkdir()
        (self.source / 'app/main.js').write_text('export const game = 1;\n')
        (self.source / 'package.json').write_text('{"name":"fixture","private":true}\n')
        (self.source / '.gitignore').write_text('work/\nnode_modules/\n')
        self.git('init', '--quiet')
        self.git('add', '.')
        self.commit()
        self.revision = self.git('rev-parse', 'HEAD').strip()
        self.pool = self.root / 'pool'
        self.runtime = self.root / 'runtime'

    def tearDown(self):
        self.tmp.cleanup()

    def git(self, *args):
        return subprocess.check_output(['git', '-C', str(self.source), *args], stderr=subprocess.PIPE).decode()

    def commit(self):
        self.git('-c', 'user.name=Storage fixture', '-c', 'user.email=fixture@localhost', 'commit', '--quiet', '-m', 'Fixture')

    def prepare(self, runtime=None):
        return storage.prepare(self.source, self.revision, self.pool, runtime or self.runtime, 1024 * 1024)

    def verify(self):
        return storage.verify(self.source, self.revision, self.pool, self.runtime)

    def asset_blob(self):
        return (self.runtime / 'public/original/sub/game.bin').resolve()

    def test_two_views_share_assets_but_not_mutable_caches_or_git_state(self):
        before = self.git('status', '--porcelain')
        a = self.prepare()
        other = self.root / 'runtime-2'
        b = self.prepare(other)
        self.assertEqual(a['sharedAssetBytes'], 30)
        self.assertEqual(a['assetTree'], b['assetTree'])
        self.assertEqual(self.asset_blob(), (other / 'public/original/sub/game.bin').resolve())
        self.assertEqual(len(list((self.pool / 'blobs').iterdir())), 1)
        for runtime in [self.runtime, other]:
            (runtime / 'work/build-cache/node_modules/.vite').mkdir(parents=True)
            (runtime / 'node_modules/.vite-temp').mkdir(parents=True)
        (self.runtime / 'node_modules/.vite-temp/one').write_text('private')
        self.assertFalse((other / 'node_modules/.vite-temp/one').exists())
        self.assertEqual(self.verify()['status'], 'verified')
        self.assertFalse((self.runtime / '.git').exists())
        self.assertEqual(self.git('status', '--porcelain'), before)

    def test_wrong_revision_refused_before_materialization(self):
        with self.assertRaises(ValueError):
            storage.prepare(self.source, '0' * 40, self.pool, self.runtime, 1024)
        self.assertFalse(self.runtime.exists())

    def test_source_modification_refused(self):
        self.prepare()
        (self.source / 'app/main.js').write_text('changed')
        with self.assertRaisesRegex(ValueError, 'clean'):
            self.verify()

    def test_source_new_commit_refused(self):
        self.prepare()
        (self.source / 'app/main.js').write_text('changed')
        self.git('add', '.'); self.commit()
        with self.assertRaisesRegex(ValueError, 'HEAD'):
            self.verify()

    def test_pool_mutation_refused(self):
        self.prepare()
        self.asset_blob().write_bytes(b'evil' * 8)
        with self.assertRaises(ValueError):
            self.verify()

    def test_manifest_cannot_authenticate_changed_asset(self):
        self.prepare()
        blob = self.asset_blob()
        blob.write_bytes(b'evil' * 8)
        manifest = self.runtime / storage.MANIFEST
        value = json.loads(manifest.read_text())
        entry = next(e for e in value['entries'] if e['path'].startswith('public/original/'))
        entry['oid'] = storage.blob_oid(blob.read_bytes())
        entry['sha256'] = storage.digest(blob.read_bytes())
        entry['bytes'] = blob.stat().st_size
        manifest.write_text(json.dumps(value))
        with self.assertRaisesRegex(ValueError, 'Git objects'):
            self.verify()

    def test_runtime_source_mutation_refused(self):
        self.prepare()
        (self.runtime / 'app/main.js').write_text('changed')
        with self.assertRaises(ValueError):
            self.verify()

    def test_runtime_link_swap_refused_even_for_same_bytes(self):
        self.prepare()
        link = self.runtime / storage.ASSETS
        link.unlink()
        link.symlink_to(self.source / storage.ASSETS, target_is_directory=True)
        with self.assertRaisesRegex(ValueError, 'asset link'):
            self.verify()

    def test_asset_link_escape_refused(self):
        result = self.prepare()
        link = self.pool / 'trees' / result['assetTree'] / 'sub/game.bin'
        link.unlink()
        link.symlink_to(self.source / 'public/original/sub/game.bin')
        with self.assertRaisesRegex(ValueError, 'target changed'):
            self.verify()

    def test_asset_undeclared_file_refused(self):
        result = self.prepare()
        (self.pool / 'trees' / result['assetTree'] / 'extra').write_text('not declared')
        with self.assertRaisesRegex(ValueError, 'undeclared'):
            self.verify()

    def test_runtime_extra_input_refused(self):
        self.prepare()
        (self.runtime / '.pnpmfile.cjs').write_text('evil hooks')
        with self.assertRaisesRegex(ValueError, 'Undeclared'):
            self.verify()

    def test_store_root_symlink_refused(self):
        real_pool = self.root / 'real-pool'; real_pool.mkdir()
        self.pool.symlink_to(real_pool, target_is_directory=True)
        with self.assertRaisesRegex(ValueError, 'Symlink'):
            self.prepare()

    def test_tracked_symlink_refused(self):
        (self.source / 'app/link').symlink_to('main.js')
        self.git('add', '.'); self.commit()
        self.revision = self.git('rev-parse', 'HEAD').strip()
        with self.assertRaisesRegex(ValueError, 'symlink'):
            self.prepare()

    def test_missing_asset_refused(self):
        self.prepare()
        self.asset_blob().unlink()
        with self.assertRaises((ValueError, OSError)):
            self.verify()

    def test_runtime_cache_link_refused(self):
        self.prepare()
        (self.runtime / 'node_modules').symlink_to(self.source, target_is_directory=True)
        with self.assertRaisesRegex(ValueError, 'Symlink'):
            self.verify()

    def test_nested_cache_link_refused(self):
        self.prepare()
        (self.runtime / 'work').mkdir()
        (self.runtime / 'work/cache').symlink_to(self.source, target_is_directory=True)
        with self.assertRaisesRegex(ValueError, 'Mutable cache'):
            self.verify()

    def test_hardlinked_mutable_outputs_are_refused(self):
        self.prepare()
        other = self.root / 'other-runtime-cache'; other.write_text('shared writable bytes')
        for name in ('work', 'dist', '.wrangler', '.next', '.vinext', '.fallow'):
            with self.subTest(root=name):
                folder = self.runtime / name; folder.mkdir(exist_ok=True)
                path = folder / 'shared'
                os.link(other, path)
                with self.assertRaisesRegex(ValueError, 'private/physical'):
                    self.verify()
                path.unlink()

    def test_budget_refused_without_creation(self):
        with self.assertRaisesRegex(ValueError, 'capacity'):
            storage.prepare(self.source, self.revision, self.pool, self.runtime, 10**20)
        self.assertFalse(self.pool.exists())

    def test_writer_lock_is_never_stolen(self):
        self.pool.mkdir(); (self.pool / '.writer-lock').mkdir()
        with self.assertRaises(FileExistsError):
            self.prepare()
        self.assertTrue((self.pool / '.writer-lock').is_dir())

    def test_run_lock_is_never_stolen(self):
        self.prepare()
        (self.runtime / 'work/.shared-runtime-run-lock').mkdir(parents=True)
        with self.assertRaises(FileExistsError):
            storage.execute(self.source, self.revision, self.pool, self.runtime, self.root / 'receipt.json', [sys.executable, '-c', 'pass'])
        self.assertTrue((self.runtime / 'work/.shared-runtime-run-lock').is_dir())

    def test_execution_invalidates_mid_run_asset_mutation(self):
        self.prepare()
        code = "from pathlib import Path; Path('public/original/sub/game.bin').write_bytes(b'changed')"
        result = storage.execute(self.source, self.revision, self.pool, self.runtime, self.root / 'receipt.json', [sys.executable, '-c', code])
        self.assertEqual(result['exitCode'], 0)
        self.assertEqual(result['status'], 'invalidated')

    def test_execution_receipt_binds_exact_source_and_assets(self):
        self.prepare()
        result = storage.execute(self.source, self.revision, self.pool, self.runtime, self.root / 'receipt.json', [sys.executable, '-c', "print('executed')"])
        self.assertEqual(result['status'], 'passed')
        self.assertEqual(result['sourceBefore']['revision'], self.revision)
        self.assertEqual((self.root / 'receipt.json.stdout').read_text(), 'executed\n')
        self.assertEqual(result['logs']['stdout']['sha256'], storage.digest(b'executed\n'))
        self.assertEqual(result['logs']['stderr']['sha256'], storage.digest(b''))
        self.assertEqual(json.loads((self.root / 'receipt.json').read_text()), result)

    def test_command_failure_keeps_trustworthy_receipt_and_logs(self):
        self.prepare()
        receipt = self.root / 'failed.json'
        code = "import sys; print('out'); print('err', file=sys.stderr); sys.exit(7)"
        result = storage.execute(self.source, self.revision, self.pool, self.runtime, receipt,
                                 [sys.executable, '-c', code])
        self.assertEqual(result['status'], 'failed')
        self.assertEqual(result['exitCode'], 7)
        self.assertEqual(json.loads(receipt.read_text()), result)
        for name, data in [('stdout', b'out\n'), ('stderr', b'err\n')]:
            self.assertEqual(Path(str(receipt) + '.' + name).read_bytes(), data)
            self.assertEqual(result['logs'][name]['sha256'], storage.digest(data))

    def test_receipt_and_log_replacements_never_overwrite_source_or_finalize(self):
        self.prepare()
        source = self.source / 'app/main.js'
        original_source = source.read_bytes()
        code = """
import os, sys
from pathlib import Path
target, saved, source = map(Path, sys.argv[1:4])
print('owned stdout', flush=True)
print('owned stderr', file=sys.stderr, flush=True)
target.rename(saved)
if sys.argv[4] == 'regular':
    target.write_bytes(b'replacement bytes')
elif sys.argv[4] == 'symlink':
    target.symlink_to(source)
else:
    os.link(source, target)
"""
        for suffix in ('', '.stdout', '.stderr'):
            for kind in ('regular', 'symlink', 'hardlink'):
                with self.subTest(output=suffix or 'receipt', kind=kind):
                    receipt = self.root / f'replaced-{suffix}-{kind}.json'
                    target = Path(str(receipt) + suffix)
                    saved = Path(str(target) + '.original')
                    with self.assertRaisesRegex(ValueError, 'Evidence .* identity/link'):
                        storage.execute(self.source, self.revision, self.pool, self.runtime, receipt,
                                        [sys.executable, '-c', code, str(target), str(saved), str(source), kind])
                    self.assertEqual(source.read_bytes(), original_source)
                    self.assertEqual((self.runtime / 'app/main.js').read_bytes(), original_source)
                    expected = b'replacement bytes' if kind == 'regular' else original_source
                    self.assertEqual(target.read_bytes(), expected)
                    owned_receipt = saved if not suffix else receipt
                    self.assertEqual(json.loads(owned_receipt.read_text())['status'], 'unknown')
                    for name in ('stdout', 'stderr'):
                        path = saved if suffix == '.' + name else Path(str(receipt) + '.' + name)
                        self.assertEqual(path.read_bytes(), ('owned ' + name + '\n').encode())
        self.assertEqual(self.git('status', '--porcelain'), '')

    def test_extra_hardlinks_to_owned_receipt_or_logs_refuse_finalization(self):
        self.prepare()
        for suffix in ('', '.stdout', '.stderr'):
            with self.subTest(output=suffix or 'receipt'):
                receipt = self.root / f'linked-{suffix}.json'
                target = Path(str(receipt) + suffix)
                alias = Path(str(target) + '.alias')
                code = "import os,sys; print('out'); print('err',file=sys.stderr); os.link(sys.argv[1],sys.argv[2])"
                with self.assertRaisesRegex(ValueError, 'Evidence .* identity/link'):
                    storage.execute(self.source, self.revision, self.pool, self.runtime, receipt,
                                    [sys.executable, '-c', code, str(target), str(alias)])
                self.assertEqual(alias.read_bytes(), target.read_bytes())
                self.assertEqual(json.loads(receipt.read_text())['status'], 'unknown')
                self.assertEqual(Path(str(receipt) + '.stdout').read_bytes(), b'out\n')
                self.assertEqual(Path(str(receipt) + '.stderr').read_bytes(), b'err\n')

    def test_parent_and_ancestor_substitution_never_finalizes_or_writes_replacement(self):
        self.prepare()
        source = self.source / 'app/main.js'
        original_source = source.read_bytes()
        code = """
import os, sys
from pathlib import Path
parent, saved, replacement, source = map(Path, sys.argv[1:5])
print('owned stdout', flush=True)
print('owned stderr', file=sys.stderr, flush=True)
parent.rename(saved)
if sys.argv[5] == 'symlink':
    replacement.mkdir()
    parent.symlink_to(replacement, target_is_directory=True)
else:
    parent.mkdir()
leaf_parent = parent / sys.argv[6]
leaf_parent.mkdir(exist_ok=True)
for suffix in ('', '.stdout', '.stderr'):
    os.link(source, leaf_parent / ('receipt.json' + suffix))
"""
        for level in ('parent', 'ancestor'):
            for kind in ('directory', 'symlink'):
                with self.subTest(level=level, kind=kind):
                    parent = self.root / f'evidence-{level}-{kind}'
                    nested = 'nested' if level == 'ancestor' else '.'
                    (parent / nested).mkdir(parents=True)
                    receipt = parent / nested / 'receipt.json'
                    saved = self.root / f'original-{level}-{kind}'
                    replacement = self.root / f'replacement-{level}-{kind}'
                    with self.assertRaisesRegex(ValueError, 'Evidence parent'):
                        storage.execute(self.source, self.revision, self.pool, self.runtime, receipt,
                                        [sys.executable, '-c', code, str(parent), str(saved), str(replacement),
                                         str(source), kind, nested])
                    self.assertEqual(source.read_bytes(), original_source)
                    self.assertEqual((self.runtime / 'app/main.js').read_bytes(), original_source)
                    for suffix in ('', '.stdout', '.stderr'):
                        self.assertEqual(Path(str(receipt) + suffix).read_bytes(), original_source)
                    self.assertEqual(json.loads((saved / nested / 'receipt.json').read_text())['status'], 'unknown')
                    self.assertEqual((saved / nested / 'receipt.json.stdout').read_bytes(), b'owned stdout\n')
                    self.assertEqual((saved / nested / 'receipt.json.stderr').read_bytes(), b'owned stderr\n')

    def test_preexisting_receipt_and_log_paths_never_overwritten(self):
        self.prepare()
        for suffix in ('', '.stdout', '.stderr'):
            for kind in ('regular', 'symlink', 'hardlink'):
                with self.subTest(output=suffix or 'receipt', kind=kind):
                    receipt = self.root / f'preexisting-{suffix}-{kind}.json'
                    target = Path(str(receipt) + suffix)
                    source = self.source / 'app/main.js'
                    original_source = source.read_bytes()
                    if kind == 'regular':
                        target.write_bytes(b'existing evidence')
                    elif kind == 'symlink':
                        target.symlink_to(source)
                    else:
                        os.link(source, target)
                    with self.assertRaises(FileExistsError):
                        storage.execute(self.source, self.revision, self.pool, self.runtime, receipt,
                                        [sys.executable, '-c', "raise AssertionError('must not launch')"])
                    self.assertEqual(source.read_bytes(), original_source)
                    self.assertEqual(target.read_bytes(), b'existing evidence' if kind == 'regular' else original_source)

    def test_pnpm_directory_links_inside_private_virtual_store_supported(self):
        self.prepare()
        modules = self.runtime / 'node_modules'
        package = modules / '.pnpm/example@1/node_modules/example'
        package.mkdir(parents=True)
        (package / 'index.js').write_text('original package bytes')
        (modules / 'example').symlink_to('.pnpm/example@1/node_modules/example', target_is_directory=True)
        a = storage.dependency_identity(self.runtime)
        self.assertEqual(a['kind'], 'pnpm')
        self.assertEqual(a['entries'], 6)
        (package / 'index.js').write_text('modified package bytes')
        self.assertNotEqual(a['inventorySha256'], storage.dependency_identity(self.runtime)['inventorySha256'])

    def test_dependency_symlink_escape_refused(self):
        self.prepare()
        modules = self.runtime / 'node_modules'; modules.mkdir()
        (modules / 'outside').symlink_to(self.source, target_is_directory=True)
        with self.assertRaisesRegex(ValueError, 'escapes'):
            storage.dependency_identity(self.runtime)

    def test_assume_unchanged_source_cannot_hide_edits(self):
        self.prepare()
        self.git('update-index', '--assume-unchanged', 'app/main.js')
        (self.source / 'app/main.js').write_text('hidden edit')
        self.assertEqual(self.git('status', '--porcelain'), '')
        with self.assertRaisesRegex(ValueError, 'index flags'):
            self.verify()

    def test_sparse_absence_is_supported_but_hidden_materialized_edits_are_not(self):
        self.git('sparse-checkout', 'set', '--no-cone', '/*', '!/public/original/')
        self.assertFalse((self.source / 'public/original/sub/game.bin').exists())
        self.assertGreater(self.prepare()['sourceSparseOmittedFiles'], 0)
        (self.source / 'public/original/sub').mkdir(parents=True)
        (self.source / 'public/original/sub/game.bin').write_bytes(b'hidden changed bytes')
        with self.assertRaises(ValueError):
            self.verify()

    def test_all_dependency_cache_root_and_nested_links_are_refused(self):
        self.prepare()
        modules = self.runtime / 'node_modules'; modules.mkdir()
        for name in ('.vite', '.vite-temp', '.cache'):
            with self.subTest(cache=name, level='root'):
                root = modules / name
                root.symlink_to(self.source, target_is_directory=True)
                with self.assertRaises(ValueError):
                    self.verify()
                with self.assertRaises(ValueError):
                    storage.dependency_identity(self.runtime)
                root.unlink()
            with self.subTest(cache=name, level='nested'):
                root.mkdir()
                nested = root / 'escape'
                nested.symlink_to(self.source, target_is_directory=True)
                with self.assertRaises(ValueError):
                    self.verify()
                with self.assertRaises(ValueError):
                    storage.dependency_identity(self.runtime)
                nested.unlink(); root.rmdir()

    def test_dependency_cache_hardlinks_are_refused_by_standalone_verification(self):
        self.prepare()
        for name in ('.vite', '.vite-temp', '.cache'):
            with self.subTest(cache=name):
                root = self.runtime / 'node_modules' / name
                root.mkdir(parents=True)
                os.link(self.source / 'app/main.js', root / 'shared')
                with self.assertRaisesRegex(ValueError, 'Dependency cache'):
                    self.verify()
                with self.assertRaisesRegex(ValueError, 'Dependency cache'):
                    storage.dependency_identity(self.runtime)
                (root / 'shared').unlink()

    def test_local_output_and_lock_symlinks_refused_without_dependencies(self):
        self.prepare()
        for name in ('tsconfig.tsbuildinfo', 'pnpm-lock.yaml', 'pnpm-workspace.yaml'):
            path = self.runtime / name
            with self.subTest(name=name):
                path.symlink_to(self.source / 'package.json')
                with self.assertRaisesRegex(ValueError, 'private regular'):
                    self.verify()
                path.unlink()

    def test_changed_dependency_executable_mode_invalidates_inventory(self):
        self.prepare()
        modules = self.runtime / 'node_modules'; modules.mkdir()
        binary = modules / 'tool'; binary.write_bytes(b'fake binary')
        before = storage.dependency_identity(self.runtime)
        binary.chmod(0o755)
        self.assertNotEqual(before, storage.dependency_identity(self.runtime))

    def test_path_traversal_refused(self):
        for name in ('../escape', '/absolute', 'x/../../escape', 'x\\evil', '.git/config'):
            with self.assertRaises(ValueError):
                storage.safe_relative(name)

if __name__ == '__main__':
    unittest.main()
