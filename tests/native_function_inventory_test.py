from base64 import b64encode
from hashlib import sha256
from pathlib import Path
import json
import struct
import sys
import tempfile
from types import SimpleNamespace
import unittest
from unittest.mock import patch

sys.path.insert(0, str(Path(__file__).resolve().parents[1] / 'scripts'))
import decomp
from native_function_inventory import parse_receipt

BASE = '00400000'
SHA = 'a' * 64
TEXT = b64encode(b'.text').decode()
CSEG = b64encode(b'CSEG').decode()
OPTIONS = b64encode(b'Function Start Search').decode()
TRUE = b64encode(b'true').decode()
CONFIG = b'00401000\t256\t' + SHA.encode() + b'\t.text\n00402000\t128\t' + SHA.encode() + b'\tCSEG\n'
VERSION = '12.1.3'
HEAD = f'pnd-ghidra-function-inventory\t1\nghidra\t{VERSION}\nlanguage\teDg2OjMy\ncompiler\td2luZG93cw==\nimageBase\t{BASE}\nexternal\t3\nnonInventoryInternal\t1\n'
RAW = HEAD + f'option\t{OPTIONS}\t{TRUE}\nentry\t00401004\t00001004\troutine\t{TEXT}\nentry\t00402000\t00002000\tthunk\t{CSEG}\n'


def parse(data, *, complete=None, sections=CONFIG):
    data = data.encode('ascii')
    if complete is None:
        complete = sha256(data).hexdigest().encode() + b'\n'
    return parse_receipt(data, complete, sections, SHA, VERSION)


class NativeFunctionInventoryTest(unittest.TestCase):
    def test_provenance_and_separate_counts(self):
        r = parse(RAW)
        self.assertEqual(r['counts'], dict(discoveredLocalExecutable=2, routines=1,
            thunks=1, external=3, nonInventoryInternal=1))
        self.assertFalse(r['analysis']['metadataImport'])
        self.assertEqual(r['analysis']['options'], {'Function Start Search': 'true'})
        self.assertEqual(r['functions'][1], dict(entry='00402000', rva='00002000', kind='thunk', rawSection='CSEG'))

    def test_completed_and_digest_bound(self):
        for receipt in [b'', b'0' * 64 + b'\n']:
            with self.subTest(receipt=receipt), self.assertRaisesRegex(ValueError, 'completion'):
                parse(RAW, complete=receipt)

    def test_wrong_analyzer_version(self):
        with self.assertRaisesRegex(ValueError, 'Ghidra'):
            parse(RAW.replace('12.1.3', '12.0.0'))

    def test_rejects_misnumbered_or_duplicate_addresses(self):
        for bad in [RAW.replace('00002000', '00002001'), RAW + RAW.splitlines()[-1] + '\n']:
            with self.subTest(bad=bad), self.assertRaisesRegex(ValueError, 'RVA'):
                parse(bad)

    def test_rejects_metadata_order_and_count(self):
        for bad in [RAW.replace('external\t3', 'external\t03'), RAW.replace('imageBase', 'base')]:
            with self.subTest(bad=bad), self.assertRaises(ValueError):
                parse(bad)

    def test_rejects_unknown_class_or_raw_membership(self):
        for bad in [RAW.replace('\tthunk\t', '\timport\t'), RAW.replace(CSEG, TEXT),
                    RAW.replace('00402000', '00402080').replace('00002000', '00002080')]:
            with self.subTest(bad=bad), self.assertRaises(ValueError):
                parse(bad)

    def test_requires_distinct_analyzer_option_and_nonempty_inventory(self):
        for bad in [HEAD + RAW.splitlines()[7] + '\n' + '\n'.join(RAW.splitlines()[7:]) + '\n',
                    RAW.replace(RAW.splitlines()[7] + '\n', ''), RAW[:RAW.index('entry')]]:
            with self.subTest(bad=bad), self.assertRaises(ValueError):
                parse(bad)

    def test_rejects_overlapping_byte_ranges(self):
        with self.assertRaisesRegex(ValueError, 'overlapping'):
            parse(RAW, sections=CONFIG + CONFIG.splitlines()[0] + b'\n')


class InventoryCommandTest(unittest.TestCase):
    def run_inventory_fixture(self, behavior):
        with tempfile.TemporaryDirectory() as temporary:
            root = Path(temporary)
            (root / 'decomp').mkdir()
            (root / 'decomp' / 'sections.tsv').write_bytes(CONFIG)
            exe = root / 'selected.exe'
            fixture = bytearray(256)
            struct.pack_into('<I', fixture, 60, 64)
            fixture[64:68] = b'PE\0\0'
            struct.pack_into('<H', fixture, 88, 0x10b)
            exe.write_bytes(fixture)
            digest = sha256(fixture).hexdigest()
            output = root / 'result.json'
            def headless(project, *args):
                self.assertNotEqual(project.project_dir, root)
                self.assertNotEqual(args[1], exe)
                self.assertEqual(args[1].read_bytes(), fixture)
                timeout_index = args.index('-analysisTimeoutPerFile')
                self.assertEqual(args[timeout_index+1], 180)
                self.assertEqual(args[args.index('-max-cpu')+1], '1')
                self.assertEqual(args[args.index('-postScript')+1], 'ExportFunctionInventory.java')
                self.assertEqual(args[-1], VERSION)
                if behavior != 'timeout':
                    report = args[-2]
                    data = RAW.encode('ascii')
                    (report / 'inventory.tsv').write_bytes(data)
                    (report / 'complete.txt').write_bytes(sha256(data).hexdigest().encode() + b'\n')
            with patch.object(decomp, 'ROOT', root), patch.dict(decomp.LOCK, executableSha256=digest), \
                patch.object(decomp, 'headless', side_effect=headless) as runner:
                args = SimpleNamespace(executable=exe, output=output)
                if behavior == 'copy-drift':
                    def replace_copy(claimed_source, private_copy):
                        private_copy.write_bytes(b'not the locked bytes')
                    with patch.object(decomp.shutil, 'copyfile', side_effect=replace_copy):
                        with self.assertRaisesRegex(ValueError, 'SHA256 mismatch'):
                            decomp.inventory(args)
                    runner.assert_not_called()
                elif behavior == 'timeout':
                    with self.assertRaisesRegex(RuntimeError, 'no fresh completion receipt'):
                        decomp.inventory(args)
                    runner.assert_called_once()
                else:
                    decomp.inventory(args)
                    runner.assert_called_once()
                    report = json.loads(output.read_text())
                    self.assertEqual(report['executableSha256'], digest)
                    self.assertEqual(report['analysis']['analysisTimeoutPerFileSeconds'], 180)
                    self.assertEqual(report['counts']['discoveredLocalExecutable'], 2)
                if behavior != 'good':
                    self.assertFalse(output.exists())
                self.assertEqual(sorted(p.name for p in root.iterdir() if p.name.startswith('.pnd-inventory-')), [])

    def test_complete_mocked_analysis(self):
        self.run_inventory_fixture('good')

    def test_bounded_timeout_without_marker_never_publishes(self):
        self.run_inventory_fixture('timeout')

    def test_private_copy_must_match_original_lock(self):
        self.run_inventory_fixture('copy-drift')

    def test_publish_refuses_to_replace_other_output(self):
        with tempfile.TemporaryDirectory() as temporary:
            root = Path(temporary)
            output = root / 'keep.json'
            output.write_text('keep')
            with self.assertRaises(FileExistsError):
                decomp.publish_inventory(output, {'data': 1})
            self.assertEqual(output.read_text(), 'keep')
            self.assertEqual(list(root.iterdir()), [output])


if __name__ == '__main__':
    unittest.main()
