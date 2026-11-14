"""Synthetic-byte regressions for the read-only native input-binding atlas.

No original executable is read or executed; the identity gate is exercised with
non-original bytes and must reject them.
"""
import importlib.util
import struct
import tempfile
import unittest
from pathlib import Path

SOURCE = Path(__file__).resolve().parents[1]
spec = importlib.util.spec_from_file_location('bindings', SOURCE / 'scripts/native-input-bindings.py')
bindings = importlib.util.module_from_spec(spec)
spec.loader.exec_module(bindings)


def record(code, action, flags, mods=0, gate=0, predicate=0):
    return struct.pack('<BIBBBI', code, action, flags, mods, gate, predicate)


class Memory:
    def __init__(self):
        self.blocks = {}

    def put(self, address, data):
        self.blocks[address] = bytes(data)

    def read(self, address, size):
        for start, data in self.blocks.items():
            if start <= address and address + size <= start + len(data):
                return data[address - start:address - start + size]
        raise ValueError(f'{address:08x} unmapped')


class RecordTests(unittest.TestCase):
    def test_scancode_press_with_required_and_ignored_modifiers(self):
        r = bindings.decode_record(0x5d655c, record(0xf0, 0x7f, 0x0c, 0x2a, 0, 0x4ff480))
        self.assertEqual(r['key'], {'code': 0xf0, 'kind': 'scancode', 'label': 'Mouse left'})
        self.assertEqual(r['event'], 'release')
        self.assertEqual(r['modifiers']['required'], ['Ctrl'])
        self.assertEqual(r['modifiers']['ignored'], ['Shift', 'Alt'])
        self.assertEqual(r['predicate'], '004ff480')
        self.assertEqual(bindings.chord(r), 'Ctrl+Mouse left (ignores Shift/Alt)')

    def test_char_keys_continuous_and_any_modifier_records(self):
        h = bindings.decode_record(0, record(0x68, 0x96, 0x11, 0, 1))
        self.assertEqual((h['key']['kind'], h['key']['label'], h['event']), ('char', 'H', 'press'))
        self.assertIsNone(h['predicate'])
        held = bindings.decode_record(0, record(0xc8, 1, 0x0a, 0x40, 1, 0x4ae200))
        self.assertEqual((held['event'], held['modifiers']['ignored']), ('continuous', 'any'))
        self.assertEqual(bindings.key_label(0x34, 'scancode'), 'Period')
        self.assertEqual(bindings.key_label(0x20, 'char'), 'Space')

    def test_unknown_layout_bits_fail_closed(self):
        for raw in (
            record(1, 1, 0x01),        # no key source
            record(1, 1, 0x29),        # unknown flag bit
            record(1, 1, 0x08),        # no event and not continuous
            record(1, 0x100, 0x09),    # action wider than one byte
            record(1, 1, 0x09, 0x80),  # unknown modifier bit
            record(1, 1, 0x09, 0, 4),  # unknown gate bit
        ):
            with self.assertRaises(ValueError):
                bindings.decode_record(0, raw)

    def test_records_stop_at_terminator_and_reject_missing_one(self):
        memory = Memory()
        memory.put(0x1000, record(0x34, 0x5d, 0x09) + record(0x68, 0x96, 0x11) + b'\0' * 12)
        self.assertEqual([r['action'] for r in bindings.decode_records(memory.read, 0x1000)], [0x5d, 0x96])
        memory.put(0x9000, record(0x34, 0x5d, 0x09) * (bindings.MAX_RECORDS + 1))
        with self.assertRaises(ValueError):
            bindings.decode_records(memory.read, 0x9000)


class DispatchTests(unittest.TestCase):
    def memory(self, first, second):
        memory = Memory()
        for stage, table in zip(bindings.STAGES, (first, second)):
            for address, pattern in stage['patterns']:
                memory.put(address, bytes.fromhex(pattern))
            fallthrough = stage['fallthrough']
            cases = [fallthrough] + sorted(set(table.values()))
            index = bytes(cases.index(table.get(stage['bias'] + i, fallthrough)) for i in range(stage['span'] + 1))
            memory.put(stage['index'], index)
            memory.put(stage['jump'], struct.pack(f'<{len(cases)}I', *cases))
        return memory

    def test_stage_one_fallthrough_resolves_through_stage_two(self):
        memory = self.memory({0x5d: 0x4ab44b, 0x96: 0x4ad0e0}, {0x84: 0x4ad035, 0x85: 0x4ad035, 0x5d: 0x1234})
        resolved = bindings.decode_dispatch(memory.read)
        self.assertEqual(resolved[0x5d], (1, 0x4ab44b))  # stage 1 wins
        self.assertEqual(resolved[0x84], (2, 0x4ad035))
        self.assertEqual(resolved[0x85], (2, 0x4ad035))
        self.assertNotIn(0x01, resolved)  # below both biases
        self.assertNotIn(0x20, resolved)  # both stages fall through

    def test_changed_dispatch_bytes_fail_closed(self):
        memory = self.memory({}, {})
        address, pattern = bindings.STAGES[1]['patterns'][0]
        memory.put(address, b'\x90' + bytes.fromhex(pattern)[1:])
        with self.assertRaises(ValueError):
            bindings.decode_dispatch(memory.read)


class PseudocodeTests(unittest.TestCase):
    def test_shared_labels_and_decimal_cases(self):
        with tempfile.TemporaryDirectory() as tmp:
            path = Path(tmp) / 'process_cmd.c'
            path.write_text('\n'.join([
                '  switch(param_1) {', '  case 0x84:', '  case 0x85:', '    FUN_0047c350(1);', '    return;',
                '  case 99:', '    a = 1;', '    b = 2;', '    c = 3;', '    d = 4;', '    break;',
                '  default:', '    break;', '  }',
            ]))
            excerpts = bindings.pseudocode_cases(path)
        self.assertEqual(excerpts[0x84], 'FUN_0047c350(1);')
        self.assertEqual(excerpts[0x85], 'FUN_0047c350(1);')
        self.assertEqual(excerpts[99], 'a = 1; b = 2; c = 3;')
        self.assertEqual(bindings.pseudocode_cases(None), {})


class IdentityTests(unittest.TestCase):
    def test_non_original_bytes_are_rejected_before_decoding(self):
        with tempfile.TemporaryDirectory() as tmp:
            path = Path(tmp) / 'd3dpoptb.exe'
            path.write_bytes(b'MZ' + b'\0' * 256)
            with self.assertRaisesRegex(ValueError, 'identity mismatch'):
                bindings.build(path)


if __name__ == '__main__':
    unittest.main()
