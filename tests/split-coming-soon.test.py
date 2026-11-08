import hashlib
import importlib.util
import pathlib
import tempfile
import unittest

path = pathlib.Path(__file__).resolve().parents[1] / 'scripts/split-coming-soon.py'
spec = importlib.util.spec_from_file_location('splitter', path)
splitter = importlib.util.module_from_spec(spec)
spec.loader.exec_module(splitter)


class SplitTrailer(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.root = pathlib.Path(self.temp.name)
        self.source = self.root / 'trailer.webm'
        self.data = bytes(range(128)) * 3 + b'last'
        self.source.write_bytes(self.data)
        self.original = (splitter.SOURCE_SHA256, splitter.SOURCE_BYTES, splitter.PART_BYTES, splitter.BUFFER_BYTES)
        splitter.SOURCE_SHA256 = hashlib.sha256(self.data).hexdigest()
        splitter.SOURCE_BYTES = len(self.data)
        splitter.PART_BYTES = 100
        splitter.BUFFER_BYTES = 7

    def tearDown(self):
        splitter.SOURCE_SHA256, splitter.SOURCE_BYTES, splitter.PART_BYTES, splitter.BUFFER_BYTES = self.original
        self.temp.cleanup()

    def test_exact_bytes_lengths_hashes_and_retained_input(self):
        output = self.root / 'parts'
        manifest = splitter.split(self.source, output)
        parts = [output / pathlib.Path(part['path']).name for part in manifest['parts']]
        self.assertEqual([p.stat().st_size for p in parts], [100, 100, 100, 88])
        self.assertEqual(b''.join(p.read_bytes() for p in parts), self.data)
        self.assertEqual(self.source.read_bytes(), self.data)
        self.assertEqual(manifest['sha256'], hashlib.sha256(self.data).hexdigest())

    def test_wrong_size_fails_before_output_creation(self):
        self.source.write_bytes(b'wrong')
        output = self.root / 'parts'
        with self.assertRaisesRegex(ValueError, 'size mismatch'):
            splitter.split(self.source, output)
        self.assertFalse(output.exists())

    def test_wrong_hash_fails_before_output_creation(self):
        self.source.write_bytes(b'x' * len(self.data))
        output = self.root / 'parts'
        with self.assertRaisesRegex(ValueError, 'hash mismatch'):
            splitter.split(self.source, output)
        self.assertFalse(output.exists())

    def test_existing_output_is_never_overwritten(self):
        output = self.root / 'parts'
        output.mkdir()
        (output / 'keep').write_text('existing user data')
        with self.assertRaises(FileExistsError):
            splitter.split(self.source, output)
        self.assertEqual((output / 'keep').read_text(), 'existing user data')
        self.assertEqual(list(output.iterdir()), [output / 'keep'])


if __name__ == '__main__':
    unittest.main()
