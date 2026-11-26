import hashlib
import importlib.util
from pathlib import Path
import tempfile
import unittest

spec = importlib.util.spec_from_file_location("diag", Path(__file__).with_name("diagnose-capture1174.py"))
diag = importlib.util.module_from_spec(spec)
spec.loader.exec_module(diag)
STOCK = b"\x1b[36mvite v8.0.13 building client...\n"
SUFFIX = diag.PRESSURE_BLOCK * diag.PRESSURE_BLOCKS

class PressureTests(unittest.TestCase):
    def check(self, data):
        with tempfile.TemporaryDirectory() as tmp:
            p = Path(tmp) / "arm.log"
            p.write_bytes(data)
            return diag.verify_pressure(p)

    def test_exact_suffix(self):
        self.assertEqual(self.check(STOCK + SUFFIX), {
            "stockLogBytes": len(STOCK),
            "suffixBytes": 6 * 1024 * 1024,
            "suffixSha256": hashlib.sha256(SUFFIX).hexdigest(),
        })

    def test_fails_closed(self):
        for bad in (STOCK, STOCK + SUFFIX[:-1], STOCK + SUFFIX + b"late",
                    STOCK + SUFFIX[:65536] + b"X" + SUFFIX[65537:],
                    b"not a stock Vite build\n" + SUFFIX,
                    b"vite v8.0.13\n" + b" " * 65536 + SUFFIX):
            with self.subTest(len=len(bad)), self.assertRaises(ValueError):
                self.check(bad)

if __name__ == "__main__":
    unittest.main()
