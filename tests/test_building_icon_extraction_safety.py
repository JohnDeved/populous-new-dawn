"""Narrow refusal-path tests. Never load assets, decode sprites or write project output."""
from pathlib import Path
import subprocess
import sys
import tempfile
import unittest

SCRIPT = Path(__file__).resolve().parents[1] / 'scripts/extract-building-icons.py'


class ExtractionSafety(unittest.TestCase):
    def attempt(self, game, decoder, output):
        return subprocess.run(
            [sys.executable, '-I', '-S', '-B', str(SCRIPT), str(game), str(decoder), str(output)],
            capture_output=True, text=True, timeout=5, check=False)

    def test_existing_directory_is_not_overwritten(self):
        with tempfile.TemporaryDirectory() as root:
            root = Path(root)
            output = root / 'held'
            output.mkdir()
            marker = output / 'held.txt'
            marker.write_text('preserve')
            result = self.attempt(root / 'absent-game', root / 'absent-decoder', output)
            self.assertNotEqual(result.returncode, 0)
            self.assertIn('Output must be absent; no overwrite', result.stderr)
            self.assertEqual(marker.read_text(), 'preserve')
            self.assertEqual(list(output.iterdir()), [marker])

    def test_dangling_output_symlink_is_rejected(self):
        with tempfile.TemporaryDirectory() as root:
            root = Path(root)
            target = root / 'absent-target'
            output = root / 'link'
            output.symlink_to(target, target_is_directory=True)
            result = self.attempt(root / 'absent-game', root / 'absent-decoder', output)
            self.assertNotEqual(result.returncode, 0)
            self.assertIn('Output must be absent; no overwrite', result.stderr)
            self.assertTrue(output.is_symlink())
            self.assertFalse(target.exists())

    def test_wrong_source_identity_cannot_load_decoder_or_create_output(self):
        with tempfile.TemporaryDirectory() as root:
            root = Path(root)
            game = root / 'game'
            (game / 'data').mkdir(parents=True)
            for name in ['d3dpoptb.exe', 'data/hfx0-0.dat', 'data/pal0-c.dat']:
                (game / name).write_bytes(b'not-original')
            marker = root / 'decoder-loaded'
            decoder = root / 'decoder.py'
            decoder.write_text(f'from pathlib import Path\nPath({str(marker)!r}).touch()\n')
            output = root / 'output'
            result = self.attempt(game, decoder, output)
            self.assertNotEqual(result.returncode, 0)
            self.assertIn('Input type/size mismatch:', result.stderr)
            self.assertFalse(marker.exists())
            self.assertFalse(output.exists())


if __name__ == '__main__':
    unittest.main()
