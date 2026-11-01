"""Synthetic-only qualification. Never names or reads real evidence archives.

Future runner must set TMPDIR to its bounded owned output. Each test owns its
TemporaryDirectory, including injected failures; unittest cleanup removes only
that synthetic root. No browser, subprocess, network or installed dependency.
"""
import copy
import importlib.util
import io
import itertools
import json
import os
from pathlib import Path
import stat
import struct
import tempfile
import unittest
from unittest.mock import patch
import warnings
import zipfile

SOURCE = Path(__file__).resolve().parents[1] / 'scripts/orchestration/evidence_archive.py'
spec = importlib.util.spec_from_file_location('evidence_archive', SOURCE)
ea = importlib.util.module_from_spec(spec); spec.loader.exec_module(ea)
REG = stat.S_IFREG | 0o644


class EvidenceArchiveTests(unittest.TestCase):
    def setUp(self):
        self.tmp = tempfile.TemporaryDirectory(prefix='archive-fixture-')
        self.addCleanup(self.tmp.cleanup)
        self.root = Path(self.tmp.name).resolve()
        self.data = self.root/'archives'; self.data.mkdir()
        self.caches = self.root/'caches'; self.caches.mkdir()
        self.journals = self.root/'journals'; self.journals.mkdir()
        self.archive = self.data/'canonical.zip'
        self.cache = self.caches/'selected'
        self.journal = self.journals/'release.jsonl'
        self.payloads = {'scene/a.png': b'PNG fixture A', 'scene/b.png': b'PNG fixture B', 'raw/log.json': b'{"ok":true}\n'}
        self.write_zip()

    def write_zip(self, rows=None, compression=zipfile.ZIP_DEFLATED):
        if rows is None: rows = [(name, data, REG) for name, data in self.payloads.items()]
        with warnings.catch_warnings():
            warnings.simplefilter('ignore', UserWarning)
            with zipfile.ZipFile(self.archive, 'w') as archive:
                for name, data, mode in rows:
                    info = zipfile.ZipInfo(name); info.create_system = 3; info.external_attr = mode << 16
                    info.compress_type = compression; archive.writestr(info, data)

    def index(self): return ea.index_archive(self.archive, ea.sha(self.archive.read_bytes()))
    def make(self, names=None, manifest=None):
        return ea.materialize(self.archive, manifest or self.index(), names or ['scene/a.png'], self.cache)
    def release(self, result, journal=None):
        return ea.release_cache(self.cache, result['receiptSha256'], result['token'], journal or self.journal)
    def events(self): return [json.loads(line) for line in self.journal.read_text().splitlines()]
    def mutate(self, transform):
        data = bytearray(self.archive.read_bytes()); transform(data); self.archive.write_bytes(data)
    def central(self, data): return data.index(b'PK\x01\x02')

    def test_read_only_index_and_direct_read(self):
        before = ea.record(self.archive.stat()); manifest = self.index()
        self.assertEqual(len(manifest['members']), 3)
        self.assertEqual(ea.read_member(self.archive, manifest, 'raw/log.json'), self.payloads['raw/log.json'])
        self.assertEqual(ea.record(self.archive.stat()), before)
        self.assertEqual(list(self.caches.iterdir()), [])

    def test_successful_materialize_and_release_return_with_external_proof(self):
        before = ea.record(self.archive.stat()); result = self.make(['scene/a.png', 'raw/log.json'])
        self.assertEqual((self.cache/'scene/a.png').read_bytes(), self.payloads['scene/a.png'])
        self.assertEqual((self.cache/'scene/a.png').stat().st_mode, REG)
        self.assertFalse((self.cache/'scene/b.png').exists())
        self.assertEqual(ea.sha(ea.encoded(result['ownershipReceipt'])), result['receiptSha256'])
        released = self.release(result)
        self.assertEqual(released['status'], 'released-owned-cache')
        self.assertFalse(self.cache.exists())
        self.assertEqual(self.events()[0]['ownershipReceipt'], result['ownershipReceipt'])
        self.assertEqual(self.events()[-1]['event'], 'released-owned-cache')
        self.assertEqual(ea.record(self.archive.stat()), before)

    def test_three_cycles_do_not_accumulate_payload_copies(self):
        before = ea.record(self.archive.stat())
        for i in range(3):
            result = self.make(['scene/a.png', 'scene/b.png'])
            self.assertEqual(result['bytes'], 26)
            self.release(result, self.journals/f'release-{i}.jsonl')
            self.assertEqual(list(self.caches.iterdir()), [])
        self.assertEqual(list(self.data.iterdir()), [self.archive])
        self.assertEqual(ea.record(self.archive.stat()), before)

    def test_empty_and_duplicate_selections_are_rejected(self):
        manifest = self.index()
        for names in ([], ['scene/a.png', 'scene/a.png']):
            with self.subTest(names=names), self.assertRaises(ValueError):
                ea.materialize(self.archive, manifest, names, self.cache)
        self.assertFalse(self.cache.exists())

    def test_count_and_byte_caps_are_independent(self):
        manifest = {'version': 1, 'archiveSha256': 'a'*64, 'archiveBytes': 123, 'members': [
            {'name': f'{i}.png', 'bytes': 8*1024**2, 'mode': REG, 'sha256': 'b'*64} for i in range(7)]}
        with self.assertRaisesRegex(ValueError, '1–6'): ea.selection(manifest, [f'{i}.png' for i in range(7)])
        with self.assertRaisesRegex(ValueError, 'cache byte'): ea.selection(manifest, [f'{i}.png' for i in range(5)])
        self.assertEqual(len(ea.selection(manifest, [f'{i}.png' for i in range(4)])), 4)

    def test_no_implicit_unknown_member(self):
        with self.assertRaisesRegex(ValueError, 'outside bound'): self.make(['missing.png'])
        self.assertFalse(self.cache.exists())

    def test_manifest_full_membership_and_unchosen_metadata_required(self):
        original = self.index()
        for change in ('remove', 'size', 'mode'):
            manifest = copy.deepcopy(original)
            if change == 'remove': manifest['members'] = [r for r in manifest['members'] if r['name'] != 'scene/b.png']
            else:
                row = next(r for r in manifest['members'] if r['name'] == 'scene/b.png')
                row['bytes' if change == 'size' else 'mode'] = 0 if change == 'size' else stat.S_IFREG | 0o600
            with self.subTest(change=change), self.assertRaisesRegex(ValueError, 'Complete archive'): self.make(manifest=manifest)
            self.assertFalse(self.cache.exists())

    def test_archive_hash_mismatch_and_missing_archive(self):
        with self.assertRaisesRegex(ValueError, 'hash differs'): ea.index_archive(self.archive, '0'*64)
        self.archive.unlink()
        with self.assertRaises(FileNotFoundError): ea.index_archive(self.archive, '0'*64)

    def test_archive_byte_size_bound_before_parser(self):
        with patch.dict(ea.LIMITS, {'archive_bytes': 4}), patch.object(ea.zipfile, 'ZipFile') as parser:
            with self.assertRaises(ValueError): self.index()
            parser.assert_not_called()

    def test_central_count_and_size_bounds_before_parser(self):
        original = self.archive.read_bytes()
        for offset, fmt, value in ((10, '<H', 201), (12, '<I', 262145)):
            self.archive.write_bytes(original)
            self.mutate(lambda data: struct.pack_into(fmt, data, data.rfind(b'PK\x05\x06')+offset, value))
            with self.subTest(offset=offset), patch.object(ea.zipfile, 'ZipFile') as parser:
                with self.assertRaises(ValueError): self.index()
                parser.assert_not_called()

    def test_unsupported_multidisk_zip64_encryption_compression(self):
        original = self.archive.read_bytes()
        changes = [lambda d: struct.pack_into('<H', d, d.rfind(b'PK\x05\x06')+4, 1),
                   lambda d: struct.pack_into('<I', d, d.rfind(b'PK\x05\x06')+12, 0xffffffff),
                   lambda d: struct.pack_into('<H', d, self.central(d)+8, 1),
                   lambda d: struct.pack_into('<H', d, self.central(d)+10, 99)]
        for i, change in enumerate(changes):
            self.archive.write_bytes(original); self.mutate(change)
            with self.subTest(i=i), self.assertRaises(ValueError): self.index()

    def test_raw_nul_rejected_before_zipfile_normalization(self):
        self.mutate(lambda d: d.__setitem__(self.central(d)+46+3, 0))
        with patch.object(ea.zipfile, 'ZipFile') as parser:
            with self.assertRaisesRegex(ValueError, 'NUL'): self.index()
            parser.assert_not_called()

    def test_unsafe_names_modes_and_prefix_collision(self):
        for name in ('../evil.png', '/absolute.png', 'a\\b.png', './alias.png', 'a//b.png', '.hidden.png', 'C:drive.png', 'a\n.png', 'a.exe', 'a/'*8+'deep.png'):
            self.write_zip([(name, b'x', REG)])
            with self.subTest(name=name), self.assertRaises(ValueError): self.index()
        for mode in (stat.S_IFLNK | 0o777, stat.S_IFREG | 0o755, stat.S_IFDIR | 0o755):
            self.write_zip([('bad.png', b'x', mode)])
            with self.subTest(mode=mode), self.assertRaises(ValueError): self.index()
        self.write_zip([('a.json', b'x', REG), ('a.json/b.png', b'y', REG)])
        with self.assertRaisesRegex(ValueError, 'prefix'): self.index()

    def test_duplicate_member_rejected(self):
        self.write_zip([('same.png', b'a', REG), ('same.png', b'b', REG)])
        with self.assertRaisesRegex(ValueError, 'Duplicate'): self.index()

    def test_declared_and_actual_decoded_limits(self):
        with patch.dict(ea.LIMITS, {'member_bytes': 2}):
            with self.assertRaises(ValueError): self.index()
        with patch.dict(ea.LIMITS, {'decoded_bytes': 20}):
            with self.assertRaisesRegex(ValueError, 'Decoded archive'): self.index()
        with ea.Archive(self.archive, ea.sha(self.archive.read_bytes())) as archive:
            with patch.object(archive.zip, 'open', return_value=io.BytesIO(b'x'*100)):
                with self.assertRaisesRegex(ValueError, 'Decoded byte'): archive.copy('scene/a.png', None, lambda b: None)

    def test_crc_corruption_is_not_accepted(self):
        self.write_zip(compression=zipfile.ZIP_STORED)
        def corrupt(data):
            name_length, extra_length = struct.unpack_from('<HH', data, 26)
            data[30+name_length+extra_length] ^= 1
        self.mutate(corrupt)
        with self.assertRaises(zipfile.BadZipFile): self.index()

    def test_selected_content_hash_mismatch_retains_failed_cache(self):
        manifest = self.index(); next(r for r in manifest['members'] if r['name'] == 'scene/a.png')['sha256'] = '0'*64
        with self.assertRaisesRegex(ValueError, 'hash differs'): self.make(manifest=manifest)
        self.assertEqual(json.loads((self.cache/ea.CONTROL).read_text())['status'], 'prepared')
        self.assertFalse((self.cache/'scene/a.png').exists())
        self.assertTrue(list((self.cache/'scene').glob('.*.tmp')))

    def test_archive_descriptor_stays_pinned_after_path_replacement(self):
        expected = ea.sha(self.archive.read_bytes())
        with self.assertRaisesRegex(ValueError, 'identity changed'):
            with ea.Archive(self.archive, expected) as archive:
                old = self.data/'old.zip'; self.archive.rename(old); self.archive.write_bytes(old.read_bytes())
                archive.copy('scene/a.png', None, lambda data: None)
        self.assertTrue((self.data/'old.zip').exists())

    def test_symlink_archive_and_cache_parents_rejected(self):
        alias = self.data/'alias.zip'; alias.symlink_to(self.archive)
        with self.assertRaises(OSError): ea.index_archive(alias, ea.sha(self.archive.read_bytes()))
        outside = self.root/'outside'; outside.mkdir(); link = self.caches/'alias'; link.symlink_to(outside, target_is_directory=True)
        with self.assertRaises(OSError): ea.materialize(self.archive, self.index(), ['scene/a.png'], link/'new')
        self.assertEqual(list(outside.iterdir()), [])

    def test_cache_must_be_outside_archive_root_and_fresh(self):
        for cache in (self.archive, self.data, self.data/'new'):
            with self.subTest(cache=cache), self.assertRaises(ValueError): ea.materialize(self.archive, self.index(), ['scene/a.png'], cache)
        self.cache.mkdir(); marker = self.cache/'keep.txt'; marker.write_text('unchanged')
        with self.assertRaises(FileExistsError): self.make()
        self.assertEqual(marker.read_text(), 'unchanged')

    def test_cache_parent_swap_does_not_write_through_new_symlink(self):
        original = ea.Archive.copy; moved = self.root/'moved'; outside = self.root/'outside'; outside.mkdir()
        def swapped(archive, *args):
            result = original(archive, *args)
            self.caches.rename(moved); self.caches.symlink_to(outside, target_is_directory=True)
            return result
        manifest = self.index()
        with patch.object(ea.Archive, 'copy', swapped), self.assertRaises((ValueError, OSError)): self.make(manifest=manifest)
        self.assertEqual(list(outside.iterdir()), [])
        self.assertTrue((moved/'selected'/ea.CONTROL).exists())

    def test_unexpected_entry_prevents_materialize_success(self):
        original = ea.Archive.copy; manifest = self.index()
        def injected(archive, *args):
            result = original(archive, *args); (self.cache/'foreign.txt').write_text('keep'); return result
        with patch.object(ea.Archive, 'copy', injected), self.assertRaisesRegex(ValueError, 'Unexpected'): self.make(manifest=manifest)
        self.assertEqual(json.loads((self.cache/ea.CONTROL).read_text())['status'], 'prepared')
        self.assertEqual((self.cache/'foreign.txt').read_text(), 'keep')

    def test_archive_deadline_enforced(self):
        with patch.object(ea.time, 'monotonic', side_effect=itertools.chain([0], itertools.repeat(16))):
            with self.assertRaisesRegex(ValueError, 'deadline'): self.index()

    def test_bound_manifest_reader_limits_hash_and_duplicate_keys(self):
        path = self.root/'manifest.json'; body = ea.encoded(self.index()); path.write_bytes(body)
        self.assertEqual(ea.read_bound_json(path, ea.sha(body)), self.index())
        with self.assertRaisesRegex(ValueError, 'changed'): ea.read_bound_json(path, '0'*64)
        path.write_bytes(b'x'*(ea.LIMITS['directory_bytes']+1))
        with self.assertRaisesRegex(ValueError, 'Oversized'): ea.read_bound_json(path, ea.sha(path.read_bytes()))
        with self.assertRaisesRegex(ValueError, 'Duplicate JSON'): ea.decode_json(b'{"a":1,"a":2}')

    def test_release_wrong_owner_or_hash_keeps_everything(self):
        result = self.make()
        for digest, token in (('0'*64, result['token']), (result['receiptSha256'], 'f'*32)):
            with self.subTest(token=token), self.assertRaises(ValueError): ea.release_cache(self.cache, digest, token, self.journal)
            self.assertTrue((self.cache/'scene/a.png').exists()); self.assertFalse(self.journal.exists())

    def test_release_unknown_file_directory_or_symlink_keeps_everything(self):
        result = self.make()
        for kind in ('file', 'directory', 'symlink'):
            extra = self.cache/'unknown'
            if kind == 'file': extra.write_text('keep')
            elif kind == 'directory': extra.mkdir()
            else: extra.symlink_to(self.data, target_is_directory=True)
            with self.subTest(kind=kind), self.assertRaisesRegex(ValueError, 'Unowned'): self.release(result)
            self.assertTrue((self.cache/'scene/a.png').exists()); self.assertFalse(self.journal.exists())
            extra.rmdir() if kind == 'directory' else extra.unlink()

    def test_release_changed_file_and_extra_hardlink_are_refused(self):
        result = self.make(); file = self.cache/'scene/a.png'; extra = self.root/'external-link'
        os.link(file, extra)
        with self.assertRaisesRegex(ValueError, 'identity'): self.release(result)
        self.assertEqual(extra.read_bytes(), self.payloads['scene/a.png'])
        extra.unlink(); file.write_bytes(b'changed')
        with self.assertRaisesRegex(ValueError, 'identity'): self.release(result)
        self.assertTrue(file.exists()); self.assertFalse(self.journal.exists())

    def test_release_partial_failure_is_retained_in_external_journal(self):
        result = self.make(['scene/a.png', 'scene/b.png']); original = ea.os.unlink
        def fail_second(name, *args, **kwargs):
            if str(name) == 'b.png': raise OSError('injected unlink failure')
            return original(name, *args, **kwargs)
        with patch.object(ea.os, 'unlink', fail_second), self.assertRaisesRegex(OSError, 'injected'): self.release(result)
        self.assertFalse((self.cache/'scene/a.png').exists()); self.assertTrue((self.cache/'scene/b.png').exists())
        self.assertTrue((self.cache/ea.CONTROL).exists())
        self.assertEqual(self.events()[-1]['event'], 'release-failed')
        self.assertEqual(self.events()[0]['ownershipReceipt'], result['ownershipReceipt'])

    def test_release_journal_existing_or_inside_cache_is_refused(self):
        result = self.make()
        with self.assertRaisesRegex(ValueError, 'outside'): self.release(result, self.cache/'bad.jsonl')
        self.journal.write_text('historical')
        with self.assertRaises(FileExistsError): self.release(result)
        self.assertEqual(self.journal.read_text(), 'historical'); self.assertTrue((self.cache/'scene/a.png').exists())

    def test_release_deadline_failure_before_any_unlink(self):
        result = self.make()
        with patch.object(ea.time, 'monotonic', side_effect=itertools.chain([0], itertools.repeat(16))):
            with self.assertRaisesRegex(ValueError, 'deadline'): self.release(result)
        self.assertTrue((self.cache/'scene/a.png').exists()); self.assertFalse(self.journal.exists())

    def test_receipt_rejects_paths_outside_cache_even_if_rehashed(self):
        result = self.make(); receipt = copy.deepcopy(result['ownershipReceipt'])
        receipt['files'][0]['name'] = '../outside.png'; receipt['selection'] = ['../outside.png']
        body = ea.encoded(receipt); (self.cache/ea.CONTROL).write_bytes(body)
        with self.assertRaises(ValueError): ea.release_cache(self.cache, ea.sha(body), result['token'], self.journal)
        self.assertTrue((self.cache/'scene/a.png').exists()); self.assertFalse(self.journal.exists())

    def test_local_only_zip64_flags_method_and_raw_name_mismatch(self):
        original = self.archive.read_bytes()
        changes = [lambda d: struct.pack_into('<H', d, 4, 45),
                   lambda d: struct.pack_into('<H', d, 6, 1),
                   lambda d: struct.pack_into('<H', d, 8, 0),
                   lambda d: d.__setitem__(30, ord('X'))]
        for i, change in enumerate(changes):
            self.archive.write_bytes(original); self.mutate(change)
            with self.subTest(i=i), patch.object(ea.zipfile, 'ZipFile') as parser:
                with self.assertRaises(ValueError): self.index()
                parser.assert_not_called()

    def test_supported_data_descriptors_and_corrupt_descriptor(self):
        class NonSeekable(io.BytesIO):
            def seekable(self): return False
            def seek(self, *args): raise io.UnsupportedOperation('synthetic nonseekable')
        stream = NonSeekable()
        with zipfile.ZipFile(stream, 'w') as archive:
            info = zipfile.ZipInfo('data/a.png'); info.create_system = 3; info.external_attr = REG << 16
            info.compress_type = zipfile.ZIP_DEFLATED; archive.writestr(info, b'payload')
        self.archive.write_bytes(stream.getvalue())
        manifest = self.index()
        self.assertEqual(ea.read_member(self.archive, manifest, 'data/a.png'), b'payload')
        self.mutate(lambda d: d.__setitem__(d.index(b'PK\x07\x08')+4, d[d.index(b'PK\x07\x08')+4] ^ 1))
        with self.assertRaisesRegex(ValueError, 'descriptor'): self.index()

    def test_hidden_local_extent_is_rejected(self):
        original = bytearray(self.archive.read_bytes()); central = original.index(b'PK\x01\x02')
        # Shift the complete central directory and its EOCD offset, leaving an undeclared gap.
        original[central:central] = b'GAP!'
        end = original.rfind(b'PK\x05\x06'); struct.pack_into('<I', original, end+16, central+4)
        self.archive.write_bytes(original)
        with self.assertRaisesRegex(ValueError, 'Hidden/overlapping'): self.index()

    def test_replaced_member_temporary_cannot_be_published_as_written_inode(self):
        manifest = self.index(); original = ea.os.link
        def replace_temporary(src, dst, *args, **kwargs):
            directory = kwargs['src_dir_fd']; os.unlink(src, dir_fd=directory)
            fd = os.open(src, os.O_WRONLY | os.O_CREAT | os.O_EXCL, 0o644, dir_fd=directory)
            with os.fdopen(fd, 'wb') as stream: stream.write(b'wrong inode!!')
            return original(src, dst, *args, **kwargs)
        with patch.object(ea.os, 'link', replace_temporary), self.assertRaisesRegex(ValueError, 'inode differs'):
            self.make(manifest=manifest)
        self.assertEqual(json.loads((self.cache/ea.CONTROL).read_text())['status'], 'prepared')

    def test_replaced_completed_control_temporary_is_rejected(self):
        manifest = self.index(); original = ea.os.replace
        def replace_temporary(src, dst, *args, **kwargs):
            directory = kwargs['src_dir_fd']; os.unlink(src, dir_fd=directory)
            fd = os.open(src, os.O_WRONLY | os.O_CREAT | os.O_EXCL, 0o600, dir_fd=directory)
            with os.fdopen(fd, 'wb') as stream: stream.write(b'{"foreign":true}\n')
            return original(src, dst, *args, **kwargs)
        with patch.object(ea.os, 'replace', replace_temporary), self.assertRaisesRegex(ValueError, 'receipt publication'):
            self.make(manifest=manifest)
        self.assertTrue((self.cache/'scene/a.png').exists())

    def test_missing_or_corrupt_canonical_archive_prevents_cache_release(self):
        result = self.make(); original = self.archive.read_bytes(); self.archive.unlink()
        with self.assertRaises(FileNotFoundError): self.release(result)
        self.assertTrue((self.cache/'scene/a.png').exists()); self.assertFalse(self.journal.exists())
        self.archive.write_bytes(original+b'corrupt')
        with self.assertRaisesRegex(ValueError, 'hash differs'): self.release(result)
        self.assertTrue((self.cache/'scene/a.png').exists()); self.assertFalse(self.journal.exists())

    def test_intervening_journal_append_stops_before_next_unlink(self):
        result = self.make(['scene/a.png', 'scene/b.png']); original = ea.os.unlink
        def tamper(name, *args, **kwargs):
            value = original(name, *args, **kwargs)
            if str(name) == 'a.png':
                with self.journal.open('ab') as stream: stream.write(b'{"event":"injected-append"}\n')
            return value
        with patch.object(ea.os, 'unlink', tamper), self.assertRaisesRegex(RuntimeError, 'failure-journal'):
            self.release(result)
        self.assertFalse((self.cache/'scene/a.png').exists()); self.assertTrue((self.cache/'scene/b.png').exists())
        self.assertEqual(self.events()[-1]['event'], 'injected-append')
        self.assertEqual(self.events()[0]['ownershipReceipt'], result['ownershipReceipt'])

    def test_failed_journal_fsync_prevents_first_unlink(self):
        result = self.make(); original = ea.os.fsync; calls = 0
        def fail_second(fd):
            nonlocal calls
            calls += 1
            if calls == 2: raise OSError('injected journal fsync failure')
            return original(fd)
        with patch.object(ea.os, 'fsync', fail_second), self.assertRaisesRegex(RuntimeError, 'failure-journal'):
            self.release(result)
        self.assertTrue((self.cache/'scene/a.png').exists()); self.assertTrue((self.cache/ea.CONTROL).exists())
        self.assertEqual(self.events()[0]['ownershipReceipt'], result['ownershipReceipt'])


if __name__ == '__main__': unittest.main()
