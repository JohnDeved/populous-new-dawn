"""Isolated, tiny data fixtures only. Never runs original binaries or downloads."""
import hashlib
import importlib.util
import json
import os
from pathlib import Path
import subprocess
import tempfile
import unittest

ROOT = Path(__file__).resolve().parents[1]
SPEC = importlib.util.spec_from_file_location(
    'shared_native_inputs', ROOT / 'scripts/orchestration/shared_native_inputs.py')
sharing = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(sharing)


class SharingTests(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory(prefix='native-input-sharing-')
        self.addCleanup(self.temp.cleanup)
        self.root = Path(self.temp.name)
        self.repo, self.source = self.root / 'repo', self.root / 'source'
        self.repo.mkdir()
        self.source.mkdir()
        self.names = ['d3dpoptb.exe', 'data/pal0-c.dat']
        self.digests = {}
        for name in self.names:
            path = self.source / name
            path.parent.mkdir(exist_ok=True)
            path.write_bytes(f'Tiny data fixture: {name}'.encode())
            self.digests[name] = hashlib.sha256(path.read_bytes()).hexdigest()
        self.write('.gitignore', '/work/\n')
        self.write('decomp/tools.json', {'executableSha256': self.digests[self.names[0]]})
        self.write('public/original/provenance.json', {
            'sha256': {self.names[1]: self.digests[self.names[1]]},
            'stoneHeads': {'sha256': {}}})
        self.write('scripts/authored-environment-inputs.json', {
            'archiveSha256': 'a' * 64, 'inputHashes': {}})
        self.write('decomp/research/original-startup-movies/provenance.json', {
            'archive': {'sha256': 'a' * 64, 'url': 'https://example.invalid/fixture'},
            'installer': {'sha256': 'b' * 64}})
        self.git('init', '--quiet')
        self.git('add', '.')
        self.commit()
        self.revision = self.git('rev-parse', 'HEAD').decode().strip()
        self.target = self.repo / sharing.DESTINATION

    def git(self, *args):
        return subprocess.check_output(['git', '-C', str(self.repo), *args], stderr=subprocess.PIPE)

    def commit(self):
        self.git('-c', 'user.name=Fixture', '-c', 'user.email=fixture@example.invalid',
                 '-c', 'core.hooksPath=/dev/null', 'commit', '--quiet', '-m', 'Fixture pins')

    def write(self, name, value):
        path = self.repo / name
        path.parent.mkdir(parents=True, exist_ok=True)
        path.write_text(value if isinstance(value, str) else json.dumps(value))

    def run_share(self, action='prepare', **kwargs):
        return sharing.share(action, kwargs.get('repo', self.repo),
                             kwargs.get('source', self.source),
                             kwargs.get('revision', self.revision),
                             kwargs.get('names', self.names))

    def test_prepare_verify_and_idempotence_copy_no_bytes(self):
        first = self.run_share()
        self.assertEqual(first['copiedInputBytes'], 0)
        self.assertEqual(first['sharedInputBytes'], sum((self.source / n).stat().st_size for n in self.names))
        for name in self.names:
            self.assertEqual(os.readlink(self.target / name), str(self.source / name))
        before = [(str(p), p.lstat().st_mtime_ns) for p in self.target.rglob('*')]
        self.run_share('verify')
        self.run_share()
        self.assertEqual(before, [(str(p), p.lstat().st_mtime_ns) for p in self.target.rglob('*')])

    def test_wrong_byte_identical_target_rejected_and_preserved(self):
        self.run_share()
        link = self.target / self.names[0]
        alternative = self.root / 'identical'
        alternative.write_bytes(link.read_bytes())
        link.unlink()
        link.symlink_to(alternative)
        for action in ['prepare', 'verify']:
            with self.assertRaisesRegex(ValueError, 'Wrong existing input target'):
                self.run_share(action)
        self.assertEqual(os.readlink(link), str(alternative))

    def test_changed_source_bytes_rejected(self):
        self.run_share()
        (self.source / self.names[0]).write_bytes(b'changed bytes')
        with self.assertRaisesRegex(ValueError, 'bytes differ'):
            self.run_share('verify')

    def test_source_file_symlink_escape_rejected(self):
        source = self.source / self.names[0]
        outside = self.root / 'outside'
        source.rename(outside)
        source.symlink_to(outside)
        with self.assertRaisesRegex(ValueError, 'Symlink in physical path'):
            self.run_share()
        self.assertFalse(self.target.exists())

    def test_source_root_symlink_rejected(self):
        alias = self.root / 'alias'
        alias.symlink_to(self.source, target_is_directory=True)
        with self.assertRaisesRegex(ValueError, 'Symlink in physical path'):
            self.run_share(source=alias)

    def test_destination_ancestor_escape_rejected(self):
        escape = self.root / 'escape'
        escape.mkdir()
        (self.repo / 'work').symlink_to(escape, target_is_directory=True)
        with self.assertRaisesRegex(ValueError, 'Symlink in physical path'):
            self.run_share()
        self.assertEqual(list(escape.iterdir()), [])

    def test_destination_directory_symlink_rejected(self):
        self.run_share()
        (self.target / self.names[1]).unlink()
        (self.target / 'data').rmdir()
        (self.target / 'data').symlink_to(self.source / 'data', target_is_directory=True)
        with self.assertRaisesRegex(ValueError, 'Destination directory replaced'):
            self.run_share('verify')

    def test_existing_regular_file_preserved(self):
        self.target.mkdir(parents=True)
        leaf = self.target / self.names[0]
        leaf.write_bytes(b'keep this file')
        with self.assertRaisesRegex(ValueError, 'Wrong existing input target'):
            self.run_share()
        self.assertEqual(leaf.read_bytes(), b'keep this file')

    def test_extra_destination_file_rejected(self):
        self.run_share()
        (self.target / 'unapproved.dat').write_bytes(b'keep')
        with self.assertRaisesRegex(ValueError, 'Unexpected destination entry'):
            self.run_share('verify')

    def test_missing_source_preflight_creates_nothing(self):
        (self.source / self.names[1]).unlink()
        with self.assertRaises(FileNotFoundError):
            self.run_share()
        self.assertFalse((self.repo / 'work').exists())

    def test_missing_destination_verify_creates_nothing(self):
        with self.assertRaises(FileNotFoundError):
            self.run_share('verify')
        self.assertFalse((self.repo / 'work').exists())

    def test_paths_are_canonical_relative_and_pinned(self):
        for name in ['../escape', '/absolute', 'data/../escape', 'data//x', 'data\\x', 'data/./x']:
            with self.subTest(name=name), self.assertRaisesRegex(ValueError, 'Unsafe input path'):
                self.run_share(names=[name])
        with self.assertRaisesRegex(ValueError, 'No reviewed input pin'):
            self.run_share(names=['unknown.dat'])

    def test_duplicate_and_empty_selections_rejected(self):
        for names in [[], [self.names[0], self.names[0]]]:
            with self.assertRaisesRegex(ValueError, 'unique input file'):
                self.run_share(names=names)

    def test_wrong_revision_rejected(self):
        with self.assertRaisesRegex(ValueError, 'does not match'):
            self.run_share(revision='0' * 40)
        with self.assertRaisesRegex(ValueError, 'exact 40-character'):
            self.run_share(revision='HEAD')

    def test_tracked_target_rejected_even_when_ignored(self):
        self.write('work/native-inputs/held.txt', 'held')
        self.git('add', '-f', 'work/native-inputs/held.txt')
        with self.assertRaisesRegex(ValueError, 'tracked paths'):
            self.run_share()
        self.assertEqual((self.repo / 'work/native-inputs/held.txt').read_text(), 'held')

    def test_nonignored_target_rejected(self):
        self.write('.gitignore', '')
        with self.assertRaisesRegex(ValueError, 'not ignored'):
            self.run_share()
        self.assertFalse((self.repo / 'work').exists())

    def test_working_provenance_cannot_override_committed_pins(self):
        self.write('decomp/tools.json', {'executableSha256': '0' * 64})
        self.run_share()
        self.assertEqual(self.run_share('verify')['files'][self.names[0]]['sha256'], self.digests[self.names[0]])

    def test_conflicting_committed_pins_rejected(self):
        self.write('scripts/authored-environment-inputs.json', {
            'archiveSha256': 'a' * 64,
            'inputHashes': {self.names[1]: {'sha256': '0' * 64}}})
        self.git('add', '.')
        self.commit()
        revision = self.git('rev-parse', 'HEAD').decode().strip()
        with self.assertRaisesRegex(ValueError, 'Conflicting provenance'):
            self.run_share(revision=revision)


if __name__ == '__main__':
    unittest.main()
