"""Small isolated recovery regressions; no production downloads or original EXE execution."""
import argparse
import fcntl
import hashlib
import importlib.util
import io
import json
import os
from pathlib import Path
import subprocess
import tarfile
import tempfile
import unittest
import zipfile

SOURCE = Path(__file__).resolve().parents[1]
spec = importlib.util.spec_from_file_location('bootstrap', SOURCE / 'scripts/cloud-bootstrap.py')
b = importlib.util.module_from_spec(spec)
spec.loader.exec_module(b)


class BootstrapTests(unittest.TestCase):
    def setUp(self):
        self.tmp = tempfile.TemporaryDirectory()
        self.addCleanup(self.tmp.cleanup)
        self.path = Path(self.tmp.name)
        self.args = argparse.Namespace(root=self.path / 'workspace', cache=[], reuse_prerequisites=None,
                                       offline=False, prerequisites_only=False, ref='main', worktree=None)
        self.manifest = json.loads(b.MANIFEST.read_text())

    def runner(self):
        runner = b.Bootstrap(self.args, self.manifest)
        for p in [runner.root / 'staging', runner.receipt, runner.tools, runner.cache]:
            p.mkdir(parents=True, exist_ok=True)
        return runner

    def item(self, content=b'archive'):
        return {'archive': 'test.zip', 'sha256': hashlib.sha256(content).hexdigest(),
                'url': 'https://example.invalid/test.zip'}

    def test_digest_rejects_wrong_and_missing(self):
        path = self.path / 'file'
        path.write_bytes(b'correct')
        b.verify(path, hashlib.sha256(b'correct').hexdigest())
        with self.assertRaises(ValueError):
            b.verify(path, hashlib.sha256(b'wrong').hexdigest())
        with self.assertRaises(ValueError):
            b.verify(self.path / 'absent', '0' * 64)

    def test_tree_identity_tracks_names_bytes_and_links(self):
        root = self.path / 'tree'
        root.mkdir()
        (root / 'a').write_bytes(b'one')
        original = b.tree_digest(root)
        (root / 'a').chmod(0o700)
        self.assertEqual(b.tree_digest(root), original)
        (root / 'a').rename(root / 'b')
        self.assertNotEqual(b.tree_digest(root), original)
        (root / 'link').symlink_to('/etc/passwd')
        with self.assertRaises(ValueError):
            b.tree_digest(root)

    def test_zip_safe_extract_and_executable_mode(self):
        archive, target = self.path / 'a.zip', self.path / 'out'
        entry = zipfile.ZipInfo('tool/bin/tool')
        entry.external_attr = 0o100755 << 16
        with zipfile.ZipFile(archive, 'w') as z:
            z.writestr(entry, b'not executed')
        b.unpack(archive, target, 'zip')
        self.assertEqual((target / entry.filename).read_bytes(), b'not executed')
        self.assertTrue((target / entry.filename).stat().st_mode & 0o100)

    def test_zip_rejects_traversal_symlinks_and_duplicates(self):
        for index, name in enumerate(['../outside', '/outside', 'a\\outside', 'link', 'duplicate']):
            archive, target = self.path / f'{index}.zip', self.path / f'out{index}'
            with zipfile.ZipFile(archive, 'w') as z:
                info = zipfile.ZipInfo(name)
                if name == 'link':
                    info.external_attr = 0o120777 << 16
                z.writestr(info, b'bad')
                if name == 'duplicate':
                    with self.assertWarns(UserWarning):
                        z.writestr(info, b'other')
            with self.assertRaises(ValueError):
                b.unpack(archive, target, 'zip')
        self.assertFalse((self.path / 'outside').exists())

    def test_tar_internal_links_and_escape_rejection(self):
        archive, target = self.path / 'a.tar.gz', self.path / 'out'
        with tarfile.open(archive, 'w:gz') as tar:
            entry = tarfile.TarInfo('tool/a')
            entry.size = 2
            tar.addfile(entry, io.BytesIO(b'ok'))
            link = tarfile.TarInfo('tool/sub/link')
            link.type, link.linkname = tarfile.SYMTYPE, '../a'
            tar.addfile(link)
        b.unpack(archive, target, 'tar')
        self.assertEqual((target / 'tool/sub/link').read_bytes(), b'ok')
        for name, value in [('escape', '../../outside'), ('abs', '/outside')]:
            with tarfile.open(archive, 'w:gz') as tar:
                link = tarfile.TarInfo(name)
                link.type, link.linkname = tarfile.SYMTYPE, value
                tar.addfile(link)
            with self.assertRaises(ValueError):
                b.unpack(archive, self.path / name, 'tar')

    def test_tar_rejects_file_beneath_link_and_special_member(self):
        archive = self.path / 'bad.tar'
        with tarfile.open(archive, 'w') as tar:
            link = tarfile.TarInfo('link')
            link.type, link.linkname = tarfile.SYMTYPE, 'elsewhere'
            tar.addfile(link)
            entry = tarfile.TarInfo('link/file')
            entry.size = 2
            tar.addfile(entry, io.BytesIO(b'ok'))
        with self.assertRaises(FileExistsError):
            b.unpack(archive, self.path / 'out', 'tar')
        with tarfile.open(archive, 'w') as tar:
            device = tarfile.TarInfo('device')
            device.type = tarfile.CHRTYPE
            tar.addfile(device)
        with self.assertRaises(ValueError):
            b.unpack(archive, self.path / 'special', 'tar')

    def test_cache_is_verified_read_only_and_offline_miss_blocks(self):
        cache = self.path / 'cache'
        cache.mkdir()
        self.args.cache = [cache]
        self.args.offline = True
        runner, item = self.runner(), self.item()
        with self.assertRaisesRegex(ValueError, 'Offline cache miss'):
            runner.archive(item)
        path = cache / item['archive']
        path.write_bytes(b'archive')
        self.assertEqual(runner.archive(item), path)
        self.assertFalse(any(runner.cache.iterdir()))
        path.write_bytes(b'corrupt')
        with self.assertRaisesRegex(ValueError, 'SHA-256 mismatch'):
            runner.archive(item)
        self.assertEqual(path.read_bytes(), b'corrupt')

    def test_download_resumes_and_only_publishes_verified_bytes(self):
        runner, item = self.runner(), self.item()
        target = runner.cache / (item['sha256'] + '-' + item['archive'])
        partial = target.with_name(target.name + '.part')
        partial.write_bytes(b'arch')
        calls = []
        def download(argv, **unused):
            calls.append(argv)
            self.assertEqual(partial.read_bytes(), b'arch')
            self.assertIn('--continue-at', argv)
            self.assertIn('=https', argv)
            partial.write_bytes(b'archive')
        runner.run = download
        self.assertEqual(runner.archive(item), target)
        self.assertEqual(target.read_bytes(), b'archive')
        self.assertFalse(partial.exists())
        self.assertEqual(runner.archive(item), target)
        self.assertEqual(len(calls), 1)

    def test_wrong_download_retains_partial_without_publishing(self):
        runner, item = self.runner(), self.item()
        def download(argv, **unused):
            Path(argv[argv.index('--output') + 1]).write_bytes(b'wrong')
        runner.run = download
        with self.assertRaisesRegex(ValueError, 'SHA-256 mismatch'):
            runner.archive(item)
        self.assertEqual([p.suffix for p in runner.cache.iterdir()], ['.part'])

    def test_complete_partial_is_promoted_without_network(self):
        self.args.offline = True
        runner, item = self.runner(), self.item()
        target = runner.cache / (item['sha256'] + '-' + item['archive'])
        target.with_name(target.name + '.part').write_bytes(b'archive')
        runner.run = lambda *a, **k: self.fail('network unexpectedly requested')
        self.assertEqual(runner.archive(item), target)

    def test_tool_is_staged_verified_and_reused_without_copy(self):
        source = self.path / 'source'
        source.mkdir()
        (source / 'tool').write_bytes(b'data')
        archive = self.path / 'tiny.zip'
        with zipfile.ZipFile(archive, 'w') as z:
            z.write(source / 'tool', 'tiny/tool')
        item = dict(self.item(archive.read_bytes()), home='tiny', format='zip', treeSha256=b.tree_digest(source))
        self.manifest['artifacts'] = {'tiny': item}
        runner = self.runner()
        runner.archive = lambda unused: archive
        target = runner.tool('tiny')
        self.assertEqual((target / 'tool').read_bytes(), b'data')
        self.assertFalse(any((runner.root / 'staging').iterdir()))
        runner.archive = lambda unused: self.fail('existing tool should be reused')
        self.assertEqual(runner.tool('tiny'), target)
        (target / 'tool').write_bytes(b'modified')
        with self.assertRaisesRegex(ValueError, 'tree hash mismatch'):
            runner.tool('tiny')
        self.assertEqual((target / 'tool').read_bytes(), b'modified')

    def test_bad_extracted_tree_is_never_published(self):
        archive = self.path / 'tiny.zip'
        with zipfile.ZipFile(archive, 'w') as z:
            z.writestr('tiny/tool', b'data')
        self.manifest['artifacts'] = {'tiny': dict(self.item(), home='tiny', format='zip', treeSha256='0' * 64)}
        runner = self.runner()
        runner.archive = lambda unused: archive
        with self.assertRaisesRegex(ValueError, 'Extracted tree hash mismatch'):
            runner.tool('tiny')
        self.assertFalse((runner.tools / 'tiny').exists())
        self.assertTrue(any((runner.root / 'staging').iterdir()))

    def test_unowned_root_and_locked_root_are_preserved(self):
        self.args.root.mkdir()
        marker = self.args.root / 'important'
        marker.write_text('keep')
        with self.assertRaisesRegex(ValueError, 'not empty'):
            b.Bootstrap(self.args, self.manifest).execute()
        self.assertEqual(marker.read_text(), 'keep')
        with (self.args.root / 'bootstrap.lock').open('a') as lock:
            fcntl.flock(lock, fcntl.LOCK_EX | fcntl.LOCK_NB)
            with self.assertRaisesRegex(ValueError, 'Another bootstrap'):
                b.Bootstrap(self.args, self.manifest).execute()

    def test_failure_has_terminal_receipt_and_preserves_old_receipts(self):
        runner = b.Bootstrap(self.args, self.manifest)
        runner.recover = lambda: (_ for _ in ()).throw(ValueError('test failure'))
        with self.assertRaisesRegex(ValueError, 'test failure'):
            runner.execute()
        receipt = runner.receipt / 'result.json'
        self.assertEqual(json.loads(receipt.read_text())['status'], 'blocked')
        original = receipt.read_bytes()
        other = b.Bootstrap(self.args, self.manifest)
        other.recover = lambda: other.result.update(status='passed')
        other.execute()
        self.assertNotEqual(other.receipt, runner.receipt)
        self.assertEqual(receipt.read_bytes(), original)

    def test_environment_quotes_paths_and_keeps_venv_interpreter(self):
        runner = self.runner()
        paths = {name: self.path / "with ' quote" / name for name in self.manifest['artifacts']}
        python = self.path / "venv ' odd" / 'bin/python'
        env = runner.environment(paths, python, None)
        script = runner.receipt / 'env.sh'
        output = subprocess.check_output(['bash', '-c', 'source "$1"; printf "%s" "$POPULOUS_PYTHON"', 'bash', str(script)], text=True)
        self.assertEqual(output, str(python))
        self.assertTrue(env['PATH'].startswith(str(python.parent)))
        self.assertFalse(Path(env['TMPDIR']).is_relative_to(SOURCE))
        self.assertTrue(Path(env['TMPDIR']).is_dir())

    def test_real_tiny_repository_cold_reuse_and_dirty_protection(self):
        # Actual git clone/worktree + npm ci on an empty dependency lock; no network.
        origin = self.path / 'origin'
        origin.mkdir()
        def git(*args):
            return subprocess.check_output(['git', '-C', str(origin), *args], stderr=subprocess.DEVNULL, text=True).strip()
        git('init', '-b', 'main')
        (origin / 'package.json').write_text('{"name":"bootstrap-fixture","version":"1.0.0"}')
        (origin / 'package-lock.json').write_text('{"name":"bootstrap-fixture","version":"1.0.0","lockfileVersion":3,"packages":{"":{"name":"bootstrap-fixture","version":"1.0.0"}}}')
        git('add', '.')
        git('-c', 'user.name=Fixture', '-c', 'user.email=fixture@example.invalid', 'commit', '-m', 'fixture')
        self.manifest['repository'] = str(origin)
        runner = self.runner()
        worktree, commit = runner.repository()
        self.assertEqual(commit, git('rev-parse', 'HEAD'))
        # npm's no-dependency fixture may omit node_modules. Real project always has dependencies.
        (worktree / 'node_modules').mkdir(exist_ok=True)
        (worktree / '.gitignore').write_text('/node_modules\n')
        # Keep fixture tracked tree unchanged for idempotent comparison.
        (worktree / '.gitignore').unlink()
        self.args.offline = True
        npm_count = sum(c['argv'][0] == 'npm' for c in runner.commands)
        self.assertEqual(runner.repository(), (worktree, commit))
        self.assertEqual(sum(c['argv'][0] == 'npm' for c in runner.commands), npm_count)
        (worktree / 'package.json').write_text('user changes')
        with self.assertRaisesRegex(ValueError, 'has changes'):
            runner.repository()
        self.assertEqual((worktree / 'package.json').read_text(), 'user changes')
        (runner.root / 'worktree-state' / (commit[:12] + '.json')).unlink()
        with self.assertRaisesRegex(ValueError, 'Unowned worktree'):
            runner.repository()

    def test_relative_sibling_root_does_not_inherit_source_package(self):
        self.args.root = SOURCE / '..' / 'fixture-sibling'
        runner = b.Bootstrap(self.args, self.manifest)
        self.assertEqual(runner.root, SOURCE.parent / 'fixture-sibling')
        self.assertNotIn(SOURCE, runner.root.parents)

    def test_root_inside_esm_package_is_rejected(self):
        (self.path / 'package.json').write_text('{"type":"module"}')
        with self.assertRaisesRegex(ValueError, 'Node package scope'):
            b.Bootstrap(self.args, self.manifest).execute()
        self.assertFalse(self.args.root.exists())

    def test_manifest_matches_native_executable_and_tools(self):
        native = json.loads((SOURCE / 'decomp/tools.json').read_text())
        self.assertEqual(self.manifest['executableSha256'], native['executableSha256'])
        for field in ['url', 'sha256', 'version']:
            self.assertEqual(self.manifest['artifacts']['ghidra'][field], native['ghidra'][field])
        for item in self.manifest['artifacts'].values():
            self.assertRegex(item['sha256'], r'^[a-f0-9]{64}$')
            self.assertRegex(item['treeSha256'], r'^[a-f0-9]{64}$')
            self.assertTrue(item['url'].startswith('https://'))
            self.assertGreater(item['files'], 0)


if __name__ == '__main__':
    unittest.main()
