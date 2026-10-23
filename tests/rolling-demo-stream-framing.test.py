"""Research-parser safety tests; no game inputs or executable code are run."""
import importlib.util
from pathlib import Path
import struct
import unittest

path = Path(__file__).resolve().parents[1] / 'scripts/check-static-rolling-demo-control.py'
spec = importlib.util.spec_from_file_location('rolling_control', path)
module = importlib.util.module_from_spec(spec)
spec.loader.exec_module(module)
frame_stream = module.frame_stream


def header(turn, size=0, kind=0, auxiliary=0):
    return struct.pack('<ihBB', turn, size, kind, auxiliary)


class FramingContract(unittest.TestCase):
    def test_signed_sentinel_ignores_other_header_bytes(self):
        # Actual CP files include both zero-filled and ff-tailed sentinel headers.
        for tail in (b'\0' * 4, b'\0\0\0\xff'):
            self.assertEqual(frame_stream(header(10) + b'\xff' * 4 + tail, 0),
                             ([{'turn': 10, 'size': 0, 'type': 0, 'auxiliary': 0}], b''))

    def test_payload_is_opaque_even_when_it_contains_sentinel_bytes(self):
        data = header(10, 8, 10, 4) + b'\xff' * 8 + header(10) + header(-1)
        records, trailer = frame_stream(data, 0)
        self.assertEqual([r['turn'] for r in records], [10, 10])
        self.assertEqual(trailer, b'')

    def test_gp_trailer_is_outside_scheduled_records(self):
        trailer = struct.pack('<ii', 864, 1562)
        records, returned = frame_stream(header(1562) + header(-1) + trailer, 8)
        self.assertEqual(len(records), 1)
        self.assertEqual(returned, trailer)

    def test_rejects_negative_length_or_other_negative_turn(self):
        for data in (header(10, -1) + header(-1), header(-2) + header(-1)):
            with self.assertRaises(ValueError):
                frame_stream(data, 0)

    def test_rejects_truncated_payload_header_and_missing_sentinel(self):
        for data in (header(10, 18) + b'123', header(-1)[:7], header(10)):
            with self.assertRaises(ValueError):
                frame_stream(data, 0)

    def test_rejects_decreasing_turns(self):
        with self.assertRaises(ValueError):
            frame_stream(header(10) + header(9) + header(-1), 0)

    def test_rejects_missing_or_extra_trailer(self):
        for data, size in ((header(-1), 8), (header(-1) + b'x', 0)):
            with self.assertRaises(ValueError):
                frame_stream(data, size)


if __name__ == '__main__':
    unittest.main()
