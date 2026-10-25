"""Small isolated recovery regressions; no production downloads or original EXE execution."""
import argparse
from contextlib import ExitStack
import types
import fcntl
import hashlib
import importlib.util
import io
import json
import os
from pathlib import Path
import subprocess
import sys
import tarfile
import tempfile
import unittest
from unittest import mock
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
        for index, name in enumerate(['../outside', '/outside', 'a\\outside', '.', 'link', 'duplicate']):
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

    def test_tar_link_chain_cannot_write_outside_staging(self):
        outside = self.path / 'outside'
        outside.mkdir()
        marker = outside / 'keep'
        marker.write_text('unchanged')
        archive, target = self.path / 'links.tar', self.path / 'staging'
        target.mkdir()
        with tarfile.open(archive, 'w') as tar:
            for name, value in [('a', '.'), ('b', 'a/../outside'), ('b/created', '.')]:
                link = tarfile.TarInfo(name)
                link.type, link.linkname = tarfile.SYMTYPE, value
                tar.addfile(link)
        with self.assertRaisesRegex(ValueError, 'Escaping archive link|symlinked parent'):
            b.unpack(archive, target, 'tar')
        self.assertEqual(sorted(p.name for p in outside.iterdir()), ['keep'])
        self.assertEqual(marker.read_text(), 'unchanged')

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
            self.assertEqual(argv[argv.index('--continue-at') + 1], '4')
            self.assertEqual(argv[argv.index('--retry') + 1], '0')
            self.assertEqual(argv[argv.index('--output') + 1], '-')
            self.assertIn('=https', argv)
            fd = unused['stdout_fd']
            self.assertEqual(os.fstat(fd).st_ino, partial.stat().st_ino)
            os.write(fd, b'ive')
        runner.run = download
        self.assertEqual(runner.archive(item), target)
        self.assertEqual(target.read_bytes(), b'archive')
        self.assertFalse(partial.exists())
        self.assertEqual(runner.archive(item), target)
        self.assertEqual(len(calls), 1)

    def test_wrong_download_retains_partial_without_publishing(self):
        runner, item = self.runner(), self.item()
        def download(argv, **unused):
            os.write(unused['stdout_fd'], b'wrong')
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

    def unsafe_partial(self, kind):
        runner, item = self.runner(), self.item()
        target = runner.cache / (item['sha256'] + '-' + item['archive'])
        partial = target.with_name(target.name + '.part')
        outside = self.path / 'outside'
        outside.write_bytes(b'archive')
        receipt = runner.receipt / 'keep.json'
        receipt.write_bytes(b'held evidence')
        if kind == 'symlink':
            partial.symlink_to(outside)
        elif kind == 'dangling':
            partial.symlink_to(self.path / 'absent')
        elif kind == 'hardlink':
            os.link(outside, partial)
        elif kind == 'fifo':
            os.mkfifo(partial)
        else:
            partial.write_bytes(b'arch')
        before = partial.lstat()
        calls = []
        runner.run = lambda *a, **k: calls.append((a, k))
        real_stat = os.stat
        def reported_stat(path, *a, **k):
            result = real_stat(path, *a, **k)
            if kind == 'unowned' and (path == partial.name or path == partial):
                values = list(result)
                values[4] = os.geteuid() + 1  # Fixture-only foreign ownership, no chown.
                return os.stat_result(values)
            return result
        try:
            with mock.patch.object(b.os, 'stat', side_effect=reported_stat), \
                    mock.patch.object(b, 'digest', side_effect=AssertionError('unsafe pathname read attempted')), \
                    mock.patch.object(b.os, 'pread', side_effect=AssertionError('unsafe descriptor read attempted')):
                with self.assertRaisesRegex(ValueError, 'Unsafe managed archive file'):
                    runner.archive(item)
        finally:
            self.assertEqual(outside.read_bytes(), b'archive')
            self.assertFalse((self.path / 'absent').exists())
            self.assertEqual(receipt.read_bytes(), b'held evidence')
            self.assertFalse(os.path.lexists(target))
            after = partial.lstat()
            self.assertEqual((before.st_dev, before.st_ino, before.st_mode, before.st_nlink),
                             (after.st_dev, after.st_ino, after.st_mode, after.st_nlink))
            print(json.dumps({'unsafePartialPreservationAssertionsPassed': kind}), flush=True)
            self.assertEqual(calls, [], 'unsafe input must not invoke a downloader')

    def test_archive_rejects_symlink_partial_before_read_or_download(self):
        self.unsafe_partial('symlink')

    def test_archive_rejects_dangling_partial_before_read_or_download(self):
        self.unsafe_partial('dangling')

    def test_archive_rejects_hardlink_partial_before_read_or_download(self):
        self.unsafe_partial('hardlink')

    def test_archive_rejects_special_partial_before_read_or_download(self):
        self.unsafe_partial('fifo')

    def test_archive_rejects_unowned_partial_before_read_or_download(self):
        self.unsafe_partial('unowned')

    def test_archive_new_partial_is_exclusive_private_and_descriptor_written(self):
        runner, item = self.runner(), self.item()
        target = runner.cache / (item['sha256'] + '-' + item['archive'])
        partial = target.with_name(target.name + '.part')
        def download(argv, **kwargs):
            fd = kwargs['stdout_fd']
            self.assertEqual(argv[argv.index('--continue-at') + 1], '0')
            self.assertEqual(argv[argv.index('--output') + 1], '-')
            self.assertEqual(partial.stat().st_mode & 0o777, 0o600)
            self.assertEqual(partial.stat().st_nlink, 1)
            self.assertEqual(os.fstat(fd).st_ino, partial.stat().st_ino)
            os.write(fd, b'archive')
        runner.run = download
        self.assertEqual(runner.archive(item), target)
        self.assertEqual(target.read_bytes(), b'archive')
        self.assertEqual(target.stat().st_nlink, 1)
        self.assertFalse(partial.exists())

    def test_archive_creation_race_preserves_appearing_symlink(self):
        runner, item = self.runner(), self.item()
        target = runner.cache / (item['sha256'] + '-' + item['archive'])
        partial = target.with_name(target.name + '.part')
        outside = self.path / 'outside'
        outside.write_bytes(b'keep')
        original = os.open
        def appeared(path, flags, *a, **k):
            if path == partial.name and flags & os.O_CREAT:
                partial.symlink_to(outside)
            return original(path, flags, *a, **k)
        runner.run = lambda *a, **k: self.fail('download unexpectedly requested')
        with mock.patch.object(b.os, 'open', side_effect=appeared):
            with self.assertRaises(FileExistsError):
                runner.archive(item)
        self.assertTrue(partial.is_symlink())
        self.assertEqual(outside.read_bytes(), b'keep')
        self.assertFalse(target.exists())

    def test_archive_replaced_partial_cannot_redirect_held_writer(self):
        runner, item = self.runner(), self.item()
        target = runner.cache / (item['sha256'] + '-' + item['archive'])
        partial = target.with_name(target.name + '.part')
        partial.write_bytes(b'arch')
        outside = self.path / 'outside'
        outside.write_bytes(b'keep')
        held_copy = runner.cache / 'interrupted-original.part'
        def download(argv, **kwargs):
            fd = kwargs['stdout_fd']
            self.assertEqual(os.fstat(fd).st_ino, partial.stat().st_ino)
            partial.rename(held_copy)
            partial.symlink_to(outside)
            os.write(fd, b'ive')
        runner.run = download
        with self.assertRaisesRegex(ValueError, 'Unsafe managed archive file|identity changed'):
            runner.archive(item)
        self.assertEqual(outside.read_bytes(), b'keep')
        self.assertEqual(held_copy.read_bytes(), b'archive')
        self.assertTrue(partial.is_symlink())
        self.assertFalse(target.exists())

    def test_archive_publication_never_clobbers_appearing_target(self):
        runner, item = self.runner(), self.item()
        target = runner.cache / (item['sha256'] + '-' + item['archive'])
        partial = target.with_name(target.name + '.part')
        def download(argv, **kwargs):
            os.write(kwargs['stdout_fd'], b'archive')
            target.write_bytes(b'keep')
        runner.run = download
        with self.assertRaises(FileExistsError):
            runner.archive(item)
        self.assertEqual(target.read_bytes(), b'keep')
        self.assertEqual(partial.read_bytes(), b'archive')
        self.assertEqual(partial.stat().st_nlink, 1)

    def test_archive_interrupted_transfer_requires_explicit_resume_with_fresh_offset(self):
        runner, item = self.runner(), self.item()
        target = runner.cache / (item['sha256'] + '-' + item['archive'])
        partial = target.with_name(target.name + '.part')
        partial.write_bytes(b'ar')
        original_inode = partial.stat().st_ino
        receipt = runner.receipt / 'keep.json'
        receipt.write_bytes(b'held evidence')
        offsets = []
        def download(argv, **kwargs):
            self.assertEqual(argv[argv.index('--retry') + 1], '0')
            self.assertEqual(argv[argv.index('--output') + 1], '-')
            offsets.append(int(argv[argv.index('--continue-at') + 1]))
            if len(offsets) == 1:
                os.write(kwargs['stdout_fd'], b'ch')
                raise RuntimeError('mock download interrupted')
            os.write(kwargs['stdout_fd'], b'ive')
        runner.run = download
        with self.assertRaisesRegex(RuntimeError, 'mock download interrupted'):
            runner.archive(item)
        self.assertEqual(offsets, [2])  # No implicit retry or replacement loop.
        self.assertEqual(partial.read_bytes(), b'arch')
        self.assertEqual(partial.stat().st_ino, original_inode)
        self.assertEqual(partial.stat().st_nlink, 1)
        self.assertEqual(receipt.read_bytes(), b'held evidence')
        self.assertFalse(target.exists())
        self.assertEqual(runner.archive(item), target)  # Separate explicit invocation.
        self.assertEqual(offsets, [2, 4])
        self.assertEqual(target.read_bytes(), b'archive')
        self.assertEqual(target.stat().st_ino, original_inode)
        self.assertEqual(target.stat().st_nlink, 1)
        self.assertFalse(partial.exists())
        self.assertEqual(receipt.read_bytes(), b'held evidence')

    def test_archive_sink_is_passed_as_stdout_not_reopened_by_subprocess(self):
        runner = self.runner()
        partial = self.path / 'partial'
        with partial.open('xb') as stream:
            def child(argv, **kwargs):
                self.assertEqual(kwargs['stdout'], stream.fileno())
                os.write(kwargs['stdout'], b'archive')
                return subprocess.CompletedProcess(argv, 0)
            with mock.patch.object(b.subprocess, 'run', side_effect=child):
                self.assertEqual(runner.run(['curl', '--output', '-'], stdout_fd=stream.fileno()), '')
        self.assertEqual(partial.read_bytes(), b'archive')
        self.assertFalse(runner.commands[0]['stdoutCaptured'])
        self.assertEqual(runner.commands[0]['stdoutSink']['kind'], 'held-archive-partial')
        self.assertEqual(runner.commands[0]['stdoutSha256'], hashlib.sha256(b'').hexdigest())

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

    def test_reused_venv_path_is_normalized_without_losing_venv_identity(self):
        source = self.path / 'temporary-checkout'
        source.mkdir()
        environment = self.path / 'existing/venv/bin'
        environment.mkdir(parents=True)
        (environment / 'python').symlink_to(sys.executable)
        self.args.reuse_prerequisites = source / '..' / 'existing'
        runner = self.runner()
        runner.verify_python = lambda unused: None
        python = runner.python()
        self.assertEqual(python, environment / 'python')
        source.rmdir()
        self.assertTrue(python.is_file())

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

    def test_per_worker_npm_bootstrap_is_retired(self):
        runner = self.runner()
        with self.assertRaisesRegex(ValueError, 'Per-worker npm bootstrap retired'):
            runner.repository()
        self.assertEqual(runner.commands, [])

    def test_relative_sibling_root_does_not_inherit_source_package(self):
        self.args.root = SOURCE / '..' / 'fixture-sibling'
        runner = b.Bootstrap(self.args, self.manifest)
        self.assertEqual(runner.root, SOURCE.parent / 'fixture-sibling')
        self.assertNotIn(SOURCE, runner.root.parents)

    def test_dependency_hash_tracks_contents_and_modes_but_not_disposable_cache(self):
        modules = self.path / 'node_modules'
        modules.mkdir()
        code = modules / 'runtime.js'
        code.write_text('runtime')
        original = b.dependency_digest(modules)
        cache = modules / '.vite'
        cache.mkdir()
        (cache / 'generated').write_text('cache')
        self.assertEqual(b.dependency_digest(modules), original)
        code.chmod(0o755)
        self.assertNotEqual(b.dependency_digest(modules), original)
        code.unlink()
        self.assertNotEqual(b.dependency_digest(modules), original)

    def test_root_inside_esm_package_is_rejected(self):
        (self.path / 'package.json').write_text('{"type":"module"}')
        with self.assertRaisesRegex(ValueError, 'Node package scope'):
            b.Bootstrap(self.args, self.manifest).execute()
        self.assertFalse(self.args.root.exists())

    def test_child_inherits_root_lock_and_private_tmpdir(self):
        runner = b.Bootstrap(self.args, self.manifest)
        def recover():
            code = ('import os,sys; assert os.fstat(int(sys.argv[1])).st_ino == os.stat(sys.argv[2]).st_ino; '
                    'print(os.environ["TMPDIR"])')
            value = runner.run([sys.executable, '-c', code, str(runner.lock_fd), runner.root / 'bootstrap.lock'])
            self.assertEqual(Path(value), runner.root / 'runtime' / runner.run_id / 'tmp')
            runner.result['status'] = 'passed'
        runner.recover = recover
        runner.execute()

    def test_build_tools_include_refinery_metadata_dependencies(self):
        build = (SOURCE / 'engineering/cloud-python-build.lock').read_text()
        runtime = (SOURCE / 'engineering/cloud-python.lock').read_text()
        for name in ['setuptools', 'wheel', 'packaging', 'Cython', 'toml', 'pure-magic-rs', 'msgpack', 'numpy']:
            self.assertIn(name + '==', build)
            self.assertIn(name + '==', runtime)

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



class NativeCliGateTests(unittest.TestCase):
    def test_native_selectors_fail_closed_before_side_effects(self):
        for selector in (['--mode', 'prerequisites'], ['--prerequisites-only'],
                         ['--mode', 'source', '--prerequisites-only']):
            for options in ([], ['--plan'], ['--apply'],
                            ['--apply', '--root', '/unused-native-root'],
                            ['--apply', '--root', '/unused-native-root', '--offline'],
                            ['--apply', '--root', '/unused-native-root', '--cache', '/unused-cache',
                             '--reuse-prerequisites', '/unused-tools', '--source', '/unused-source']):
                with self.subTest(selector=selector, options=options), ExitStack() as stack:
                    stack.enter_context(mock.patch.object(sys, 'argv', ['bootstrap'] + selector + options))
                    stderr = stack.enter_context(mock.patch.object(sys, 'stderr', new_callable=io.StringIO))
                    guards = [stack.enter_context(mock.patch(target, side_effect=AssertionError(target)))
                              for target in ('builtins.open', 'io.open', 'os.open', 'os.mkdir',
                                             'subprocess.Popen', 'socket.socket.connect',
                                             'tempfile.mkdtemp')]
                    constructor = stack.enter_context(mock.patch.object(
                        b, 'Bootstrap', side_effect=AssertionError('Native constructor reached')))
                    with self.assertRaises(SystemExit) as raised:
                        b.main()
                    self.assertEqual(raised.exception.code, 1)
                    self.assertIn('Native prerequisite recovery is disabled: bounded native execution '
                                  'and extraction are not qualified', stderr.getvalue())
                    constructor.assert_not_called()
                    for guard in guards:
                        guard.assert_not_called()

    def test_warm_cli_dispatch_is_unchanged(self):
        for mode in ([], ['--mode', 'source'], ['--mode', 'runtime']):
            for action in ([], ['--plan'], ['--apply']):
                with self.subTest(mode=mode, action=action):
                    execute = mock.Mock(return_value={'status': 'fixture-dispatch-only'})
                    module = types.ModuleType('shared_workspace')
                    module.execute = execute
                    argv = ['bootstrap', '--source', '/fixture-source', '--binding', '/fixture-binding']
                    with mock.patch.object(sys, 'argv', argv + mode + action), \
                         mock.patch.dict(sys.modules, {'shared_workspace': module}), \
                         mock.patch.object(sys, 'path', list(sys.path)), \
                         mock.patch.object(sys, 'dont_write_bytecode', True), \
                         mock.patch.object(b, 'Bootstrap', side_effect=AssertionError('Native constructor reached')), \
                         mock.patch('builtins.print'):
                        b.main()
                    execute.assert_called_once()
                    args = execute.call_args.args[0]
                    self.assertEqual(args.mode, mode[-1] if mode else 'source')
                    self.assertEqual(args.apply, action == ['--apply'])
                    self.assertEqual(args.source, Path('/fixture-source'))
                    self.assertEqual(args.binding, Path('/fixture-binding'))

if __name__ == '__main__':
    unittest.main()

