import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'
import test from 'node:test'

const importer = fileURLToPath(new URL('../scripts/import-startup-logo.py', import.meta.url))
const checks = String.raw`
import ast
import hashlib
import importlib.util
from pathlib import Path
import subprocess
import sys
import tempfile
import unittest
from unittest.mock import patch

spec = importlib.util.spec_from_file_location('logo_importer', sys.argv[1])
module = importlib.util.module_from_spec(spec)
spec.loader.exec_module(module)


def producer(size, value=37, code=0, stay=False):
    return [sys.executable, '-B', '-c',
            'import os,sys,time\n'
            'remaining=int(sys.argv[1]); block=bytes([int(sys.argv[2])])*65536\n'
            'while remaining:\n'
            ' chunk=block[:min(remaining,len(block))]\n'
            ' os.write(1,chunk); remaining-=len(chunk)\n'
            'if sys.argv[4]=="1": time.sleep(1)\n'
            'sys.exit(int(sys.argv[3]))', str(size), str(value), str(code), str(int(stay))]


class DecodedComparison(unittest.TestCase):
    def setUp(self):
        self.directory = tempfile.TemporaryDirectory()
        self.children = []
        original = subprocess.Popen
        def track(*args, **kwargs):
            self.assertTrue(all(child.poll() is not None for child in self.children),
                            'A second decoder started before the first was reaped')
            child = original(*args, **kwargs)
            self.children.append(child)
            return child
        self.launch = patch.object(module.subprocess, 'Popen', track)
        self.launch.start()

    def tearDown(self):
        self.launch.stop()
        try:
            self.assertTrue(all(child.poll() is not None for child in self.children),
                            'A decoder survived comparison completion')
            self.assertEqual(list(Path(self.directory.name).iterdir()), [],
                             'Temporary reference survived')
        finally:
            for child in self.children:
                if child.poll() is None:
                    child.kill()
                    child.wait(timeout=5)
            self.directory.cleanup()

    def compare(self, original, converted, expected):
        return module.compare_decoded_video(original, converted, expected, self.directory.name)

    def test_equal_video_across_chunk_boundary_and_partial_tail(self):
        size = module.DECODE_CHUNK_BYTES + 117
        digest = self.compare(producer(size), producer(size), size)
        self.assertEqual(digest, hashlib.sha256(bytes([37]) * size).hexdigest())
        self.assertEqual(len(self.children), 2)

    def test_short_reads_and_different_partitioning_compare_ordered_bytes(self):
        source = [b'ab', b'cdefg', b'h', b'ijkl']
        target = [b'a', b'bc', b'de', b'fghijk', b'l']
        def chunks(command):
            yield from source if command == 'source' else target
        with patch.object(module, 'decoded_chunks', chunks):
            self.assertEqual(self.compare('source', 'target', 12),
                             hashlib.sha256(b'abcdefghijkl').hexdigest())

    def test_short_original_does_not_launch_converted(self):
        with self.assertRaisesRegex(ValueError, 'Original.*incomplete'):
            self.compare(producer(127), producer(128), 128)
        self.assertEqual(len(self.children), 1)

    def test_excess_original_reaps_producer_and_does_not_launch_converted(self):
        with self.assertRaisesRegex(ValueError, 'Original.*exceeds'):
            self.compare(producer(module.DECODE_CHUNK_BYTES, stay=True), producer(128), 128)
        self.assertEqual(len(self.children), 1)

    def test_short_converted_is_not_a_prefix_success(self):
        with self.assertRaisesRegex(ValueError, 'Converted.*incomplete'):
            self.compare(producer(128), producer(127), 128)

    def test_excess_converted_reaps_producer(self):
        with self.assertRaisesRegex(ValueError, 'Converted.*exceeds'):
            self.compare(producer(128), producer(module.DECODE_CHUNK_BYTES, stay=True), 128)

    def test_first_mismatch_reaps_converted_producer(self):
        size = module.DECODE_CHUNK_BYTES
        with self.assertRaisesRegex(ValueError, 'differs'):
            self.compare(producer(size), producer(size, value=38, stay=True), size)

    def test_late_mismatch_is_not_a_digest_only_comparison(self):
        def chunks(command):
            yield b'prefix'
            yield b'1' if command == 'source' else b'2'
        with patch.object(module, 'decoded_chunks', chunks):
            with self.assertRaisesRegex(ValueError, 'differs'):
                self.compare('source', 'target', 7)

    def test_original_nonzero_exit_after_exact_bytes_fails(self):
        with self.assertRaises(subprocess.CalledProcessError) as failure:
            self.compare(producer(128, code=7), producer(128), 128)
        self.assertEqual(failure.exception.returncode, 7)
        self.assertEqual(len(self.children), 1)

    def test_converted_nonzero_exit_after_equal_bytes_fails(self):
        with self.assertRaises(subprocess.CalledProcessError) as failure:
            self.compare(producer(128), producer(128, code=9), 128)
        self.assertEqual(failure.exception.returncode, 9)

    def test_decoder_launch_failure_cleans_reference(self):
        with self.assertRaises(FileNotFoundError):
            self.compare(producer(128), [str(Path(self.directory.name) / 'missing-decoder')], 128)
        self.assertEqual(len(self.children), 1)

    def test_reference_write_failure_reaps_active_decoder(self):
        real_temporary_file = tempfile.TemporaryFile
        class BrokenReference:
            def __enter__(self):
                self.file = real_temporary_file(dir=self_outer.directory.name)
                return self
            def __exit__(self, *args):
                self.file.close()
            def write(self, data):
                raise OSError('supplied disk write failure')
        self_outer = self
        with patch.object(module.tempfile, 'TemporaryFile', lambda **kwargs: BrokenReference()):
            with self.assertRaisesRegex(OSError, 'disk write failure'):
                self.compare(producer(module.DECODE_CHUNK_BYTES, stay=True), producer(128),
                             module.DECODE_CHUNK_BYTES)
        self.assertEqual(len(self.children), 1)

    def test_invalid_expected_size_does_not_start_decoders(self):
        for value in (0, -1, 1.5, True):
            with self.assertRaises(ValueError):
                self.compare(producer(1), producer(1), value)
        self.assertEqual(self.children, [])

    def test_empty_source_and_converted_are_not_success(self):
        with self.assertRaisesRegex(ValueError, 'Original.*incomplete'):
            self.compare(producer(0), producer(128), 128)
        with self.assertRaisesRegex(ValueError, 'Converted.*incomplete'):
            self.compare(producer(128), producer(0), 128)

    def test_single_extra_byte_is_rejected_on_each_side(self):
        with self.assertRaisesRegex(ValueError, 'Original.*exceeds'):
            self.compare(producer(129), producer(128), 128)
        with self.assertRaisesRegex(ValueError, 'Converted.*exceeds'):
            self.compare(producer(128), producer(129), 128)

    def test_middle_mismatch_is_rejected(self):
        def chunks(command):
            yield b'prefix'
            yield b'1' if command == 'source' else b'2'
            yield b'suffix'
        with patch.object(module, 'decoded_chunks', chunks):
            with self.assertRaisesRegex(ValueError, 'differs'):
                self.compare('source', 'target', 13)

    def test_reference_read_failure_reaps_converted_decoder(self):
        real_temporary_file = tempfile.TemporaryFile
        class BrokenReference:
            def __enter__(self):
                self.file = real_temporary_file(dir=self_outer.directory.name)
                return self
            def __exit__(self, *args):
                self.file.close()
            def write(self, data):
                return self.file.write(data)
            def seek(self, offset):
                return self.file.seek(offset)
            def read(self, size):
                raise OSError('supplied disk read failure')
        self_outer = self
        size = module.DECODE_CHUNK_BYTES
        with patch.object(module.tempfile, 'TemporaryFile', lambda **kwargs: BrokenReference()):
            with self.assertRaisesRegex(OSError, 'disk read failure'):
                self.compare(producer(size), producer(size, stay=True), size)
        self.assertEqual(len(self.children), 2)

    def test_terminate_timeout_escalates_to_kill_and_reap(self):
        import io
        events = []
        class Child:
            stdout = io.BytesIO(b'first chunk')
            killed = False
            def poll(self):
                return None
            def terminate(self):
                events.append('terminate')
            def kill(self):
                self.killed = True
                events.append('kill')
            def wait(self, timeout):
                events.append(('wait', timeout))
                if not self.killed:
                    raise subprocess.TimeoutExpired('supplied decoder', timeout)
                return -9
        child = Child()
        with patch.object(module.subprocess, 'Popen', lambda *args, **kwargs: child):
            stream = module.decoded_chunks(['supplied decoder'])
            self.assertEqual(next(stream), b'first chunk')
            stream.close()
        self.assertTrue(child.stdout.closed)
        self.assertEqual(events, ['terminate', ('wait', 5), 'kill', ('wait', 5)])

    def test_lazy_streams_keep_read_requests_bounded(self):
        total = module.DECODE_CHUNK_BYTES * 3 + 19
        requests, children = [], []
        class Stream:
            remaining = total
            closed = False
            def read(self, size):
                requests.append(size)
                count = min(size, self.remaining)
                self.remaining -= count
                return b'x' * count
            def close(self):
                self.closed = True
        class Child:
            def __init__(self):
                self.stdout = Stream()
                self.finished = False
            def wait(self):
                self.finished = True
                return 0
            def poll(self):
                return 0 if self.finished else None
        def spawn(*args, **kwargs):
            self.assertTrue(all(child.finished for child in children))
            child = Child()
            children.append(child)
            return child
        with patch.object(module.subprocess, 'Popen', spawn):
            digest = self.compare(['source'], ['target'], total)
        expected = hashlib.sha256()
        for count in [module.DECODE_CHUNK_BYTES] * 3 + [19]:
            expected.update(b'x' * count)
        self.assertEqual(digest, expected.hexdigest())
        self.assertEqual(set(requests), {module.DECODE_CHUNK_BYTES})
        self.assertTrue(all(child.stdout.closed and child.finished for child in children))

    def test_source_filter_and_raw_yuv_dispatch_are_unchanged(self):
        self.assertEqual(module.frames_command(Path('source.tgq'),
                         ['-vf', 'scale=640:352:flags=neighbor,setsar=1']), [
            'ffmpeg', '-v', 'error', '-nostdin', '-i', 'source.tgq', '-map', '0:v:0',
            '-vf', 'scale=640:352:flags=neighbor,setsar=1',
            '-pix_fmt', 'yuv420p', '-f', 'rawvideo', '-',
        ])
        parsed = ast.parse(Path(sys.argv[1]).read_text())
        calls = [node for node in ast.walk(parsed) if isinstance(node, ast.Call)
                 and isinstance(node.func, ast.Name) and node.func.id == 'compare_decoded_video']
        self.assertEqual(len(calls), 1)
        self.assertEqual(ast.dump(calls[0].args[2]),
                         ast.dump(ast.parse('188 * 640 * 352 * 3 // 2', mode='eval').body))


unittest.main(argv=['synthetic decoded-video checks'], verbosity=2)
`

test('BLOGO verifier preserves exact bytes, lengths, decoder errors and cleanup', () => {
  const result = spawnSync('python3', ['-B', '-c', checks, importer], {
    encoding: 'utf8',
    timeout: 20_000,
    maxBuffer: 1024 * 1024,
    env: { ...process.env, PYTHONDONTWRITEBYTECODE: '1' },
  })
  assert.ifError(result.error)
  assert.equal(result.status, 0, `${result.stdout}\n${result.stderr}`)
  assert.match(result.stderr, /Ran 20 tests/)
  assert.match(result.stderr, /\nOK\n/)
  console.log(result.stderr.trimEnd())
})
