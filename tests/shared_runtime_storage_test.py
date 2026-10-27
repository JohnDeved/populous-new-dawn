import importlib.util
import json
import os
import signal
from pathlib import Path
import shutil
import subprocess
import sys
import tempfile
import time
from types import SimpleNamespace
import unittest
from unittest import mock

HELPER = Path(__file__).resolve().parents[1] / 'scripts/orchestration/shared_runtime.py'
sys.path.insert(0, str(HELPER.parent))
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
        return self.pool / 'blobs' / storage.digest(b'verified original game asset\x00\xff')

    def allocation_plan(self):
        state = storage.source_state(self.source, self.revision)
        records = []
        reader = storage.Blobs(self.source)
        try:
            for entry in state['entries']:
                records.append({**entry, 'sha256': storage.digest(reader.read(entry))})
        finally:
            reader.close()
        assets = [e for e in records if e['path'].startswith(storage.ASSETS + '/')]
        return storage.allocation_budget(state, self.pool, self.runtime, 'build', records,
                                         storage.asset_reuse(self.pool, assets), 1024 * 1024)

    def legacy_view(self):
        """Construct the retired v1 layout only inside an isolated test fixture."""
        self.prepare()
        manifest_path = self.runtime / storage.MANIFEST
        manifest = json.loads(manifest_path.read_bytes())
        tree = self.pool / 'trees' / manifest['assetTree']
        tree.mkdir(parents=True)
        for entry in manifest['entries']:
            if entry['path'].startswith(storage.ASSETS + '/'):
                target = tree / entry['path'][len(storage.ASSETS) + 1:]
                target.parent.mkdir(parents=True, exist_ok=True)
                target.symlink_to(os.path.relpath(self.pool / 'blobs' / entry['sha256'], target.parent))
        link = self.runtime / storage.ASSETS
        link.unlink()
        link.symlink_to(os.path.relpath(tree, link.parent), target_is_directory=True)
        manifest['version'] = 1
        del manifest['assetLayout']
        manifest_path.write_bytes(storage.encoded(manifest))
        # Remove only this TemporaryDirectory fixture's staging v2 links. The
        # migration test must construct v2 beside a genuinely v1-only pool.
        shutil.rmtree(self.pool / storage.ASSET_TREES)
        return tree

    def test_two_views_share_assets_but_not_mutable_caches_or_git_state(self):
        before = self.git('status', '--porcelain')
        a = self.prepare()
        other = self.root / 'runtime-2'
        b = self.prepare(other)
        self.assertEqual(a['sharedAssetBytes'], 30)
        self.assertEqual(a['assetTree'], b['assetTree'])
        asset = self.runtime / 'public/original/sub/game.bin'
        self.assertEqual(asset.resolve(), (other / 'public/original/sub/game.bin').resolve())
        self.assertEqual(asset.resolve().name, 'game.bin')
        self.assertFalse(asset.is_symlink())
        self.assertTrue(asset.samefile(self.asset_blob()))
        self.assertTrue((self.runtime / storage.ASSETS).is_symlink())
        self.assertEqual(a['assetLayout'], storage.ASSET_LAYOUT)
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
        link = self.pool / storage.ASSET_TREES / result['assetTree'] / 'sub/game.bin'
        link.unlink()
        link.symlink_to(self.source / 'public/original/sub/game.bin')
        with self.assertRaisesRegex(ValueError, 'regular hardlink'):
            self.verify()

    def test_asset_copied_bytes_are_not_shared_cas_identity(self):
        self.prepare()
        target = self.runtime / 'public/original/sub/game.bin'
        target.unlink()
        target.write_bytes(self.asset_blob().read_bytes())
        with self.assertRaisesRegex(ValueError, 'declared CAS hardlink'):
            self.verify()

    def test_asset_symlink_to_correct_cas_is_not_loader_safe(self):
        self.prepare()
        target = (self.runtime / 'public/original/sub/game.bin').resolve()
        target.unlink()
        target.symlink_to(os.path.relpath(self.asset_blob(), target.parent))
        with self.assertRaisesRegex(ValueError, 'regular hardlink'):
            self.verify()

    def test_asset_cas_execute_mode_change_refused_without_repair(self):
        self.prepare()
        self.asset_blob().chmod(0o755)
        with self.assertRaisesRegex(ValueError, 'mode changed'):
            self.verify()
        self.assertEqual(self.asset_blob().stat().st_mode & 0o777, 0o755)

    def test_executable_asset_refused_before_materialization(self):
        (self.source / 'public/original/sub/game.bin').chmod(0o755)
        self.git('add', '.'); self.commit()
        self.revision = self.git('rev-parse', 'HEAD').strip()
        with self.assertRaisesRegex(ValueError, 'non-executable data'):
            self.prepare()
        self.assertFalse(self.runtime.exists())
        self.assertFalse(self.pool.exists())

    def test_v1_is_verification_only_and_is_not_rewritten_by_v2(self):
        tree = self.legacy_view()
        manifest = (self.runtime / storage.MANIFEST).read_bytes()
        target = tree / 'sub/game.bin'
        legacy_target = os.readlink(target)
        legacy_inode = target.lstat().st_ino
        cas = self.asset_blob()
        info = cas.stat()
        cas_identity = (info.st_dev, info.st_ino, info.st_mode, cas.read_bytes())
        self.assertFalse((self.pool / storage.ASSET_TREES).exists())
        self.assertEqual(self.verify()['status'], 'verified')
        other = self.root / 'v2-runtime'
        result = self.prepare(other)
        self.assertEqual(result['assetLayout'], storage.ASSET_LAYOUT)
        self.assertEqual((self.runtime / storage.MANIFEST).read_bytes(), manifest)
        self.assertEqual(target.lstat().st_ino, legacy_inode)
        self.assertEqual(os.readlink(target), legacy_target)
        info = cas.stat()
        self.assertEqual((info.st_dev, info.st_ino, info.st_mode, cas.read_bytes()), cas_identity)
        self.assertEqual(self.verify()['status'], 'verified')
        target.unlink(); target.symlink_to(self.source / 'public/original/sub/game.bin')
        with self.assertRaisesRegex(ValueError, 'target changed'):
            self.verify()

    def test_unknown_asset_layout_refused(self):
        self.prepare()
        path = self.runtime / storage.MANIFEST
        manifest = json.loads(path.read_bytes())
        manifest['assetLayout'] = 'extensionless-aliases'
        path.write_bytes(storage.encoded(manifest))
        with self.assertRaisesRegex(ValueError, 'Unknown asset layout'):
            self.verify()

    def test_real_vite_resolves_json_modules_css_and_declared_binary_types(self):
        assets = self.source / 'public/original/sub'
        (assets / 'nested').mkdir()
        selector = self.source / 'public/original/world-selector/text'
        selector.mkdir(parents=True)
        (selector / 'runtime.json').write_bytes(b'{"version":1,"name":"runtime"}\n')
        (selector / 'provenance.json').write_bytes(b'{"version":2,"name":"provenance"}\n')
        files = {
            'same-bytes.txt': b'{"version":1,"name":"runtime"}\n',
            'nested/label.json': b'{"label":"relative-json"}\n',
            'module.mjs': b'import value from "./nested/label.json"; export default value.label;\n',
            'style.css': b'@import "./nested/theme.css"; .image { background: url("./pixel.png"); }\n',
            'nested/theme.css': b'.nested { color: rgb(11, 22, 33); }\n',
            # The bundler must emit these bytes with their declared types, not decode them.
            'pixel.png': b'\x89PNG\r\n\x1a\nfixture-png',
            'sound.wav': b'RIFFfixture-wav',
            'sound.m4a': b'fixture-m4a',
            'movie.webm': b'\x1a\x45\xdf\xa3fixture-webm',
        }
        for name, data in files.items():
            (assets / name).write_bytes(data)
        (self.source / 'app/main.js').write_text('''
import runtime from '../public/original/world-selector/text/runtime.json';
import provenance from '../public/original/world-selector/text/provenance.json';
import label from '../public/original/sub/module.mjs';
import raw from '../public/original/sub/same-bytes.txt?raw';
import '../public/original/sub/style.css';
import png from '../public/original/sub/pixel.png';
import wav from '../public/original/sub/sound.wav';
import m4a from '../public/original/sub/sound.m4a';
import webm from '../public/original/sub/movie.webm';
import bin from '../public/original/sub/game.bin?url';
globalThis.sharedAssetResult = { runtime, provenance, label, raw, png, wav, m4a, webm, bin };
''')
        (self.source / 'app/legacy.js').write_text('''
import runtime from '../public/original/world-selector/text/runtime.json';
import provenance from '../public/original/world-selector/text/provenance.json';
globalThis.sharedAssetResult = { runtime, provenance };
''')
        self.git('add', '.'); self.commit()
        self.revision = self.git('rev-parse', 'HEAD').strip()
        self.legacy_view()
        candidate = self.root / 'v2-runtime'
        self.prepare(candidate)
        root = candidate / 'public/original/sub'
        json_asset = candidate / 'public/original/world-selector/text/runtime.json'
        self.assertTrue(json_asset.samefile(root / 'same-bytes.txt'))
        self.assertNotEqual(json_asset.resolve(), (root / 'same-bytes.txt').resolve())
        before = storage.verify(self.source, self.revision, self.pool, candidate)
        fixture = Path(__file__).with_name('shared-runtime-bundler-fixture.mjs')
        vite = os.environ.get('PND_SHARED_RUNTIME_VITE_ENTRY',
                              str(HELPER.parents[2] / 'node_modules/vite/dist/node/index.js'))
        result = subprocess.run(['node', str(fixture), str(candidate), str(self.runtime), vite],
                                capture_output=True, text=True, timeout=60)
        self.assertEqual(result.returncode, 0, result.stdout + result.stderr)
        self.assertEqual(json.loads(result.stdout)['status'], 'passed')
        print(result.stdout.strip(), flush=True)
        self.assertEqual(before, storage.verify(self.source, self.revision, self.pool, candidate))
        self.assertEqual(self.verify()['status'], 'verified')

    def test_asset_undeclared_file_refused(self):
        result = self.prepare()
        (self.pool / storage.ASSET_TREES / result['assetTree'] / 'extra').write_text('not declared')
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

    def test_verified_warm_cas_only_discounts_content_not_metadata_or_reserve(self):
        cold = self.allocation_plan()
        result = self.prepare()
        warm = self.allocation_plan()
        self.assertEqual(cold['method'], 'verified-cas-new-allocation-v1')
        self.assertEqual(cold['missingBlobCount'], 1)
        self.assertEqual(cold['verifiedReusedBlobCount'], 0)
        self.assertEqual(warm['missingBlobCount'], 0)
        self.assertEqual(warm['verifiedReusedBlobCount'], 1)
        self.assertEqual(warm['verifiedReusedContentBytes'], 30)
        self.assertEqual(warm['allocations']['missingCasBytes'], 0)
        self.assertEqual(cold['newAllocationEstimateBytes'] - warm['newAllocationEstimateBytes'],
                         cold['allocations']['missingCasBytes'])
        for name, value in cold['allocations'].items():
            if name != 'missingCasBytes':
                self.assertGreater(value, 0)
                self.assertEqual(value, warm['allocations'][name])
        self.assertEqual(cold['fullCopyEstimateBytes'], warm['fullCopyEstimateBytes'])
        self.assertEqual(cold['reserveBytes'], warm['reserveBytes'])
        self.assertEqual(result['budget']['newAllocationEstimateBytes'], cold['newAllocationEstimateBytes'])

    def test_duplicate_asset_names_charge_one_missing_blob_and_each_hardlink(self):
        original = self.source / 'public/original/sub/game.bin'
        (original.parent / 'same-bytes.txt').write_bytes(original.read_bytes())
        self.git('add', '.'); self.commit()
        self.revision = self.git('rev-parse', 'HEAD').strip()
        plan = self.allocation_plan()
        block = plan['allocationBlockBytes']
        self.assertEqual(plan['missingBlobCount'], 1)
        self.assertEqual(plan['allocations']['missingCasBytes'], 2 * block)
        self.assertEqual(plan['allocations']['assetHardlinkMetadataBytes'], 2 * block)
        self.prepare()
        root = self.runtime / 'public/original/sub'
        self.assertTrue((root / 'game.bin').samefile(root / 'same-bytes.txt'))
        self.assertEqual(len(list((self.pool / 'blobs').iterdir())), 1)

    def test_missing_cas_cannot_receive_a_reuse_discount(self):
        plan = self.allocation_plan()
        available = plan['newAllocationEstimateBytes'] + plan['reserveBytes'] - plan['allocations']['missingCasBytes']
        fs = SimpleNamespace(f_frsize=4096, f_bavail=available // 4096)
        with mock.patch.object(storage.os, 'statvfs', return_value=fs):
            with self.assertRaisesRegex(ValueError, 'capacity'):
                self.prepare()
        self.assertFalse(self.pool.exists())
        self.assertFalse(self.runtime.exists())

    def test_capacity_boundary_and_locked_recheck_preserve_reserve(self):
        plan = self.allocation_plan()
        required = plan['newAllocationEstimateBytes'] + plan['reserveBytes']
        enough = SimpleNamespace(f_frsize=4096, f_bavail=required // 4096)
        short = SimpleNamespace(f_frsize=4096, f_bavail=required // 4096 - 1)
        with mock.patch.object(storage.os, 'statvfs', return_value=short):
            with self.assertRaisesRegex(ValueError, 'capacity'):
                self.prepare()
        self.assertFalse(self.pool.exists())
        with mock.patch.object(storage.os, 'statvfs', side_effect=[enough, short]):
            with self.assertRaisesRegex(ValueError, 'after publication lock'):
                self.prepare()
        self.assertFalse(self.runtime.exists())
        self.assertFalse((self.pool / '.writer-lock').exists())
        self.assertFalse((self.pool / 'blobs').exists())
        with mock.patch.object(storage.os, 'statvfs', return_value=enough):
            result = self.prepare()
        self.assertEqual(result['budget']['availableBytes'], required)
        self.assertEqual(result['budget']['reserveBytes'], 1024 * 1024)

    def test_post_prepare_reserve_shortfall_is_not_a_pass(self):
        plan = self.allocation_plan()
        required = plan['newAllocationEstimateBytes'] + plan['reserveBytes']
        enough = SimpleNamespace(f_frsize=4096, f_bavail=required // 4096)
        short = SimpleNamespace(f_frsize=4096, f_bavail=plan['reserveBytes'] // 4096 - 1)
        with mock.patch.object(storage.os, 'statvfs', side_effect=[enough, enough, short]):
            with self.assertRaisesRegex(ValueError, 'reserve was consumed'):
                self.prepare()
        self.assertTrue(self.runtime.exists())  # Preserve partial output, never erase it.
        self.assertFalse((self.pool / '.writer-lock').exists())

    def test_invalid_cas_is_rejected_before_creation_not_discounted_or_repaired(self):
        original = self.source / 'public/original/sub/game.bin'
        expected = original.read_bytes()
        for kind in ('symlink', 'size', 'hash', 'executable'):
            with self.subTest(kind=kind):
                pool = self.root / ('bad-pool-' + kind)
                blobs = pool / 'blobs'; blobs.mkdir(parents=True)
                target = blobs / storage.digest(expected)
                if kind == 'symlink':
                    target.symlink_to(original)
                else:
                    target.write_bytes(b'x' if kind == 'size' else b'x' * len(expected) if kind == 'hash' else expected)
                    if kind == 'executable':
                        target.chmod(0o755)
                before = (target.lstat(), target.read_bytes())
                runtime = self.root / ('bad-runtime-' + kind)
                with self.assertRaises(ValueError):
                    storage.prepare(self.source, self.revision, pool, runtime, 1024 * 1024)
                self.assertFalse(runtime.exists())
                self.assertFalse((pool / storage.ASSET_TREES).exists())
                after = target.lstat()
                self.assertEqual((after.st_dev, after.st_ino, after.st_mode, target.read_bytes()),
                                 (before[0].st_dev, before[0].st_ino, before[0].st_mode, before[1]))

    def test_source_and_cas_races_after_planning_fail_before_materialization(self):
        self.prepare()
        original_mkdir = Path.mkdir
        for kind in ('source', 'cas'):
            with self.subTest(kind=kind):
                target = self.source / 'app/main.js' if kind == 'source' else self.asset_blob()
                prior = target.read_bytes()
                def mkdir(path, *args, **kwargs):
                    result = original_mkdir(path, *args, **kwargs)
                    if path == self.pool / '.writer-lock':
                        target.write_bytes(b'changed after preflight')
                    return result
                runtime = self.root / ('raced-runtime-' + kind)
                with mock.patch.object(Path, 'mkdir', mkdir):
                    with self.assertRaises(ValueError):
                        self.prepare(runtime)
                self.assertFalse(runtime.exists())
                self.assertEqual(target.read_bytes(), b'changed after preflight')
                self.assertFalse((self.pool / '.writer-lock').exists())
                target.write_bytes(prior)

    def test_same_bytes_cas_inode_swap_after_planning_is_refused(self):
        self.prepare()
        blob = self.asset_blob()
        original_mkdir = Path.mkdir
        def mkdir(path, *args, **kwargs):
            result = original_mkdir(path, *args, **kwargs)
            if path == self.pool / '.writer-lock':
                data = blob.read_bytes()
                blob.rename(self.pool / 'retained-original')
                blob.write_bytes(data)
            return result
        runtime = self.root / 'swapped-runtime'
        with mock.patch.object(Path, 'mkdir', mkdir):
            with self.assertRaisesRegex(ValueError, 'CAS inventory changed'):
                self.prepare(runtime)
        self.assertFalse(runtime.exists())
        self.assertTrue((self.pool / 'retained-original').is_file())

    def test_existing_pool_on_another_filesystem_is_refused_before_budgeting(self):
        self.pool.mkdir()
        original_stat = Path.stat
        def stat(path, *args, **kwargs):
            value = original_stat(path, *args, **kwargs)
            if path == self.pool:
                fields = list(value)
                fields[2] += 1  # st_dev, retaining real directory type and other fields.
                return os.stat_result(fields)
            return value
        with mock.patch.object(Path, 'stat', stat):
            with self.assertRaisesRegex(ValueError, 'one filesystem'):
                self.prepare()
        self.assertFalse(self.runtime.exists())
        self.assertFalse((self.pool / '.writer-lock').exists())

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
        self.assertEqual(result['dependenciesBefore']['kind'], 'none')
        self.assertEqual(result['dependenciesBefore']['entries'], 0)
        self.assertEqual(result['sourceBefore']['revision'], self.revision)
        self.assertEqual((self.root / 'receipt.json.stdout').read_text(), 'executed\n')
        self.assertEqual(result['logs']['stdout']['sha256'], storage.digest(b'executed\n'))
        self.assertEqual(result['logs']['stderr']['sha256'], storage.digest(b''))
        self.assertEqual(json.loads((self.root / 'receipt.json').read_text()), result)

    def test_runtime_raw_log_budget_rejects_output_beyond_allowance(self):
        self.prepare()
        receipt = self.root / 'budget.json'
        with mock.patch.dict(os.environ, {'PND_RUNTIME_MAX_RAW_BYTES': '4'}):
            result = storage.execute(self.source, self.revision, self.pool, self.runtime, receipt,
                                     [sys.executable, '-c', "import os; os.write(1, b'12345')"])
        self.assertNotEqual(result['status'], 'passed')
        self.assertEqual(Path(str(receipt) + '.stdout').read_bytes(), b'1234')
        self.assertEqual(Path(str(receipt) + '.stderr').read_bytes(), b'')
        self.assertIn('raw output budget', result['capture']['error'])
        self.assertFalse(result['capture']['complete'])
        self.assertEqual(result['capture']['storedBytes'], 4)
        self.assertEqual(result['capture']['streams']['stdout']['observedBytes'], 5)
        self.assertEqual(json.loads(receipt.read_text()), result)

    def test_runtime_raw_log_budget_invalid_value_fails_before_launch_or_evidence(self):
        self.prepare()
        receipt = self.root / 'invalid-budget.json'
        with mock.patch.dict(os.environ, {'PND_RUNTIME_MAX_RAW_BYTES': '-1'}):
            with self.assertRaisesRegex(ValueError, 'PND_RUNTIME_MAX_RAW_BYTES'):
                storage.execute(self.source, self.revision, self.pool, self.runtime, receipt,
                                 [sys.executable, '-c', 'pass'])
        self.assertFalse(receipt.exists())
        self.assertFalse(Path(str(receipt) + '.stdout').exists())

    def capture_fixture(self, code, budget, name='capture.json'):
        receipt = self.root / name
        with storage.OwnedEvidence(receipt) as evidence:
            evidence.write_receipt({'status': 'unknown'})
            capture = storage.capture_command([sys.executable, '-c', code], self.root,
                                              dict(os.environ), evidence, budget)
            logs = evidence.logs()
        for stream in ('stdout', 'stderr'):
            data = Path(str(receipt) + '.' + stream).read_bytes()
            self.assertEqual(logs[stream]['bytes'], capture['streams'][stream]['storedBytes'])
            self.assertEqual(logs[stream]['sha256'], storage.digest(data))
        self.assertLessEqual(capture['storedBytes'], budget)
        self.assertEqual(capture['storedBytes'], sum(x['storedBytes'] for x in capture['streams'].values()))
        self.assertEqual(capture['observedBytes'], sum(x['observedBytes'] for x in capture['streams'].values()))
        return capture, receipt

    def test_runtime_raw_log_budget_configuration(self):
        with mock.patch.dict(os.environ, {}, clear=True):
            self.assertEqual(storage.raw_output_limit(), 64 * 1024 * 1024)
        with mock.patch.dict(os.environ, {'PND_RUNTIME_MAX_RAW_BYTES': '7'}):
            self.assertEqual(storage.raw_output_limit(), 7)
            self.assertEqual(storage.raw_output_limit(3), 3)
        for invalid in ('', ' ', '-1', '+1', '1.5', '1e3', '１２', '9007199254740992',
                        '1' * 100, -1, 0.5, True, False):
            with self.subTest(invalid=invalid), self.assertRaises(ValueError):
                storage.raw_output_limit(invalid)

    def test_runtime_raw_log_budget_exact_combined_binary_bytes_and_plus_one(self):
        code = "import os; os.write(1, b'\\xff\\x00a'); os.write(2, b'\\xfe\\x00b')"
        exact, receipt = self.capture_fixture(code, 6, 'exact.json')
        self.assertTrue(exact['complete'])
        self.assertEqual(exact['exitCode'], 0)
        self.assertEqual(exact['storedBytes'], 6)
        self.assertEqual(Path(str(receipt) + '.stdout').read_bytes(), b'\xff\x00a')
        self.assertEqual(Path(str(receipt) + '.stderr').read_bytes(), b'\xfe\x00b')
        overflow, _ = self.capture_fixture(code, 5, 'overflow.json')
        self.assertFalse(overflow['complete'])
        self.assertEqual(overflow['storedBytes'], 5)
        self.assertEqual(overflow['observedBytes'], 6)
        self.assertEqual(sum(x['droppedBytes'] for x in overflow['streams'].values()), 1)
        self.assertIn('raw output budget', overflow['error'])
        self.assertEqual(Path(str(receipt) + '.stdout').read_bytes(), b'\xff\x00a')

    def test_runtime_raw_log_budget_zero_allows_only_empty_output(self):
        empty, _ = self.capture_fixture('pass', 0, 'empty.json')
        self.assertTrue(empty['complete'])
        nonempty, _ = self.capture_fixture("import os; os.write(2,b'x')", 0, 'nonempty.json')
        self.assertFalse(nonempty['complete'])
        self.assertEqual(nonempty['storedBytes'], 0)
        self.assertEqual(nonempty['streams']['stderr']['droppedBytes'], 1)

    def test_runtime_raw_log_capture_drains_both_flooding_streams_in_fixed_chunks(self):
        original = os.read
        reads = []
        def read(fd, count):
            reads.append(count)
            return original(fd, count)
        code = "import os\nfor i in range(32):\n os.write(1,b'o'*4096)\n os.write(2,b'e'*4096)"
        with mock.patch.object(storage.os, 'read', side_effect=read):
            result, receipt = self.capture_fixture(code, 256 * 1024)
        self.assertTrue(result['complete'])
        self.assertEqual(result['exitCode'], 0)
        self.assertLessEqual(max(reads), 64 * 1024)
        self.assertEqual(Path(str(receipt) + '.stdout').read_bytes(), b'o' * (128 * 1024))
        self.assertEqual(Path(str(receipt) + '.stderr').read_bytes(), b'e' * (128 * 1024))

    def test_runtime_raw_log_short_writes_count_actual_retained_bytes(self):
        original = os.write
        with mock.patch.object(storage.os, 'write', side_effect=lambda fd, data: original(fd, data[:3])):
            result, receipt = self.capture_fixture("import os; os.write(1,b'abcdefghijkl')", 10)
        self.assertEqual(result['storedBytes'], 10)
        self.assertEqual(result['streams']['stdout']['droppedBytes'], 2)
        self.assertEqual(Path(str(receipt) + '.stdout').read_bytes(), b'abcdefghij')
        self.assertFalse(result['complete'])

    def test_runtime_raw_log_sink_failure_preserves_prefix_and_reaps_owned_child(self):
        original = os.write
        writes = 0
        def write(fd, data):
            nonlocal writes
            writes += 1
            if writes > 1:
                raise OSError('fixture disk write failure')
            return original(fd, data[:3])
        code = "import os,time; os.write(1,b'abcdefgh'); time.sleep(20)"
        with mock.patch.object(storage.os, 'write', side_effect=write):
            result, receipt = self.capture_fixture(code, 100)
        self.assertFalse(result['complete'])
        self.assertIn('persist raw stdout', result['error'])
        self.assertTrue(result['cleanup']['exitObserved'])
        self.assertEqual(result['exitCode'], -signal.SIGTERM)
        self.assertEqual(result['storedBytes'], 3)
        self.assertEqual(Path(str(receipt) + '.stdout').read_bytes(), b'abc')

    def test_runtime_raw_log_read_failure_is_nonpassing_and_reaps_owned_child(self):
        original = os.read
        def read(fd, count):
            if count == storage.RAW_READ_BYTES:
                raise OSError('fixture pipe read failure')
            return original(fd, count)
        with mock.patch.object(storage.os, 'read', side_effect=read):
            result, _ = self.capture_fixture("import os,time; os.write(1,b'x'); time.sleep(20)", 100)
        self.assertFalse(result['complete'])
        self.assertIn('read raw stdout', result['error'])
        self.assertTrue(result['cleanup']['exitObserved'])

    def test_runtime_raw_log_selector_failure_is_nonpassing_and_reaps_owned_child(self):
        original = storage.selectors.DefaultSelector
        def selector():
            result = original()
            result.select = mock.Mock(side_effect=OSError('fixture selector failure'))
            return result
        with mock.patch.object(storage.selectors, 'DefaultSelector', side_effect=selector):
            result, _ = self.capture_fixture('import time; time.sleep(20)', 100)
        self.assertFalse(result['complete'])
        self.assertIn('drain raw output', result['error'])
        self.assertTrue(result['cleanup']['exitObserved'])

    def test_runtime_raw_log_denied_signals_leave_unknown_without_claiming_exit(self):
        original = subprocess.Popen
        owned = []
        def launch(*args, **kwargs):
            proc = original(*args, **kwargs)
            owned.append((proc, proc.kill))
            proc.terminate = mock.Mock(side_effect=PermissionError('fixture TERM denied'))
            proc.kill = mock.Mock(side_effect=PermissionError('fixture KILL denied'))
            return proc
        started = time.monotonic()
        try:
            with mock.patch.object(storage.subprocess, 'Popen', side_effect=launch), \
                    mock.patch.object(storage, 'RAW_CLEANUP_SECONDS', 0.05):
                with self.assertRaisesRegex(storage.UnreapedRuntimeCommand, 'exit was not observed'):
                    self.capture_fixture("import os,time; os.write(1,b'12345'); time.sleep(20)", 4)
            self.assertLess(time.monotonic() - started, 3)
            proc = owned[0][0]
            self.assertIsNone(proc.poll())
            proc.terminate.assert_called_once()
            proc.kill.assert_called_once()
            self.assertEqual(json.loads((self.root / 'capture.json').read_text())['status'], 'unknown')
            self.assertEqual((self.root / 'capture.json.stdout').read_bytes(), b'1234')
        finally:
            # Only the test-created direct child is cleaned up, via its saved real handle.
            for proc, kill in owned:
                if proc.poll() is None:
                    kill()
                proc.wait(timeout=3)

    def test_runtime_raw_log_unobserved_child_retains_runtime_run_lock(self):
        self.prepare()
        receipt = self.root / 'unreaped.json'
        with mock.patch.object(storage, 'capture_command', side_effect=storage.UnreapedRuntimeCommand('fixture unreaped')):
            with self.assertRaises(storage.UnreapedRuntimeCommand):
                storage.execute(self.source, self.revision, self.pool, self.runtime, receipt,
                                 [sys.executable, '-c', 'pass'])
        self.assertTrue((self.runtime / 'work/.shared-runtime-run-lock').is_dir())
        self.assertEqual(json.loads(receipt.read_text())['status'], 'unknown')

    def test_runtime_raw_log_cleanup_wait_error_closes_pipes_and_retains_run_lock(self):
        self.prepare()
        receipt = self.root / 'wait-error.json'
        original = subprocess.Popen
        owned = []
        def launch(command, *args, **kwargs):
            proc = original(command, *args, **kwargs)
            if command[0] == sys.executable:
                owned.append((proc, proc.kill, proc.wait))
                proc.terminate = mock.Mock(side_effect=PermissionError('fixture TERM denied'))
                proc.kill = mock.Mock(side_effect=PermissionError('fixture KILL denied'))
                proc.wait = mock.Mock(side_effect=OSError('fixture wait failed'))
            return proc
        try:
            with mock.patch.object(storage.subprocess, 'Popen', side_effect=launch), \
                    mock.patch.object(storage, 'toolchain_identity', return_value={}), \
                    mock.patch.object(storage, 'RAW_CLEANUP_SECONDS', 0.05):
                with self.assertRaisesRegex(storage.UnreapedRuntimeCommand, 'exit was not observed'):
                    storage.execute(self.source, self.revision, self.pool, self.runtime, receipt,
                                    [sys.executable, '-c', "import os,time; os.write(1,b'12345'); time.sleep(20)"], 4)
            proc = owned[0][0]
            self.assertTrue(proc.stdout.closed)
            self.assertTrue(proc.stderr.closed)
            self.assertTrue((self.runtime / 'work/.shared-runtime-run-lock').is_dir())
            self.assertEqual(json.loads(receipt.read_text())['status'], 'unknown')
        finally:
            for proc, kill, wait in owned:
                if proc.poll() is None:
                    kill()
                wait(timeout=3)

    def test_runtime_raw_log_overflow_escalates_ignored_term_only_for_owned_child(self):
        code = "import os,signal,time; signal.signal(signal.SIGTERM,signal.SIG_IGN); os.write(1,b'12345'); time.sleep(20)"
        with mock.patch.object(storage, 'RAW_CLEANUP_SECONDS', 0.1):
            result, _ = self.capture_fixture(code, 4)
        self.assertFalse(result['complete'])
        self.assertEqual(result['exitCode'], -signal.SIGKILL)
        self.assertTrue(result['cleanup']['terminateAttempted'])
        self.assertTrue(result['cleanup']['killAttempted'])

    def test_runtime_raw_log_held_descendant_pipe_is_incomplete_without_signaling_descendant(self):
        # The descendant finishes itself promptly. It is never signaled by capture.
        marker = self.root / 'descendant-finished'
        child = f"import time; from pathlib import Path; time.sleep(0.5); Path({str(marker)!r}).write_text('finished')"
        code = f"import subprocess,sys; subprocess.Popen([sys.executable,'-c',{child!r}])"
        with mock.patch.object(storage, 'RAW_CLEANUP_SECONDS', 0.1):
            result, _ = self.capture_fixture(code, 10)
        self.assertFalse(result['complete'])
        self.assertEqual(result['exitCode'], 0)
        self.assertIn('pipes remained open', result['error'])
        self.assertFalse(result['cleanup']['terminateAttempted'])
        self.assertFalse(result['cleanup']['killAttempted'])
        deadline = time.monotonic() + 3
        while not marker.exists() and time.monotonic() < deadline:
            time.sleep(0.02)
        self.assertEqual(marker.read_text(), 'finished')

    def test_runtime_raw_log_no_output_failure_and_signal_keep_observed_returncode(self):
        failed, _ = self.capture_fixture('raise SystemExit(7)', 0, 'failed-empty.json')
        self.assertTrue(failed['complete'])
        self.assertEqual(failed['exitCode'], 7)
        killed, _ = self.capture_fixture('import os,signal; os.kill(os.getpid(),signal.SIGTERM)', 0, 'signal.json')
        self.assertTrue(killed['complete'])
        self.assertEqual(killed['exitCode'], -signal.SIGTERM)

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

    def ready_fixture(self, *, package=True):
        self.prepare()
        store = self.root / 'pnpm-store/v11'
        (store / 'files').mkdir(parents=True)
        modules = self.runtime / 'node_modules'
        virtual = modules / '.pnpm'
        virtual.mkdir(parents=True)
        lock = b"lockfileVersion: '9.0'\nimporters:\n  .: {}\n"
        (self.runtime / 'pnpm-lock.yaml').write_bytes(lock)
        (virtual / 'lock.yaml').write_bytes(lock)
        (modules / '.modules.yaml').write_text(json.dumps({
            'packageManager': 'pnpm@11.25.0', 'nodeLinker': 'isolated',
            'storeDir': str(store), 'virtualStoreDir': '.pnpm',
        }))
        if package:
            target = virtual / 'example@1/node_modules/example'
            target.mkdir(parents=True)
            (target / 'index.js').write_text('export const fixture = true;\n')
            (modules / 'example').symlink_to('.pnpm/example@1/node_modules/example')
        return store

    def ready(self, store):
        return storage.verify_ready(self.source, self.revision, self.pool, self.runtime, store)

    def test_readiness_rejects_absent_dependencies_without_creating_them(self):
        self.prepare()
        store = self.root / 'store'
        (store / 'files').mkdir(parents=True)
        with self.assertRaisesRegex(ValueError, 'Missing physical path'):
            self.ready(store)
        self.assertFalse((self.runtime / 'node_modules').exists())

    def test_readiness_rejects_missing_virtual_store_even_with_modules(self):
        self.prepare()
        (self.runtime / 'node_modules').mkdir()
        store = self.root / 'store'
        (store / 'files').mkdir(parents=True)
        with self.assertRaisesRegex(ValueError, 'Missing physical path.*[.]pnpm'):
            self.ready(store)
        self.assertFalse((self.runtime / 'node_modules/.pnpm').exists())

    def test_readiness_rejects_broken_package_link(self):
        store = self.ready_fixture()
        link = self.runtime / 'node_modules/missing'
        link.symlink_to('.pnpm/absent/node_modules/absent')
        with self.assertRaises(FileNotFoundError):
            self.ready(store)
        self.assertTrue(link.is_symlink())

    def test_readiness_rejects_metadata_only_empty_dependencies(self):
        store = self.ready_fixture(package=False)
        with self.assertRaisesRegex(ValueError, 'No installed package files'):
            self.ready(store)

    def test_readiness_requires_explicit_store(self):
        self.prepare()
        with self.assertRaisesRegex(ValueError, 'explicit --dependency-store'):
            self.ready(None)

    def test_readiness_qualified_valid_layout_is_not_build_or_sharing_proof(self):
        store = self.ready_fixture()
        result = self.ready(store)
        self.assertEqual(result['kind'], 'shared-runtime-readiness')
        self.assertEqual(result['status'], 'verified')
        self.assertEqual(result['source']['revision'], self.revision)
        self.assertEqual(result['installation']['dependencyIdentity']['kind'], 'pnpm')
        self.assertEqual(result['installation']['packageFiles'], 1)
        self.assertEqual(result['installation']['sharedFiles'], 0)
        self.assertIn('not dependency compatibility', result['scope'])
        self.assertIn('RAM acceptance', result['scope'])
        self.assertFalse((self.runtime / 'work').exists())

    def test_readiness_rechecks_source_assets_after_installation_audit(self):
        store = self.ready_fixture()
        original = storage.verify
        calls = 0
        def verify(*args):
            nonlocal calls
            calls += 1
            if calls == 2:
                (self.runtime / 'app/main.js').write_text('changed during audit')
            return original(*args)
        with mock.patch.object(storage, 'verify', side_effect=verify):
            with self.assertRaises(ValueError):
                self.ready(store)
        self.assertEqual(calls, 2)

    def test_readiness_cli_requires_store_before_emitting_success(self):
        self.prepare()
        args = [str(HELPER), 'ready', '--source', str(self.source),
                '--revision', self.revision, '--pool', str(self.pool), '--runtime', str(self.runtime)]
        with mock.patch.object(sys, 'argv', args):
            with self.assertRaisesRegex(ValueError, 'explicit --dependency-store'):
                storage.main()

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
