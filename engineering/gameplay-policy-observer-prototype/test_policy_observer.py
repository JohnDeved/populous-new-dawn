import hashlib
import os
import tempfile
import unittest
from unittest.mock import patch
import policy_observer as observer


class ObserverTests(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.addCleanup(self.temp.cleanup)
        self.fd = os.open(self.temp.name, os.O_RDONLY | os.O_DIRECTORY | os.O_NOFOLLOW)
        self.addCleanup(os.close, self.fd)
        s = os.fstat(self.fd)
        self.pin = (s.st_dev, s.st_ino)

    def write(self, name='package.json', data=b'{}'):
        fd = os.open(name, os.O_WRONLY | os.O_CREAT | os.O_EXCL, 0o600, dir_fd=self.fd)
        try:
            os.write(fd, data)
        finally:
            os.close(fd)

    def observe(self, names=None):
        return observer.observe_fixture(self.fd, self.pin, names or ['package.json', '.npmrc'])

    def test_regular_and_absent(self):
        self.write()
        result = self.observe()
        self.assertFalse(result['executionAuthorized'])
        self.assertEqual(result['entries'][0]['sha256'], hashlib.sha256(b'{}').hexdigest())
        self.assertEqual(result['entries'][1]['state'], 'absent')
        self.assertNotIn('rootAlias', result['entries'][0])
        os.fstat(self.fd)  # caller descriptor not closed

    def test_reject_symlink_and_dangling_symlink(self):
        self.write()
        self.assertTrue(os.path.isfile(os.path.join(self.temp.name, 'package.json')))
        for target in ['package.json', 'missing']:
            os.symlink(target, '.npmrc', dir_fd=self.fd)
            try:
                with self.assertRaises(ValueError): self.observe(['.npmrc'])
            finally:
                os.unlink('.npmrc', dir_fd=self.fd)

    def test_reject_hardlink(self):
        self.write()
        os.link('package.json', 'alias', src_dir_fd=self.fd, dst_dir_fd=self.fd)
        with self.assertRaises(ValueError): self.observe()

    def test_reject_directory_fifo(self):
        os.mkdir('dir', dir_fd=self.fd)
        os.mkfifo('fifo', dir_fd=self.fd)
        for name in ['dir', 'fifo']:
            with self.assertRaises(ValueError): self.observe([name])

    def test_reject_bad_names_and_identity(self):
        for names in [['../x'], ['.'], ['a', 'a'], ['a'] * 33, ['a/b']]:
            with self.assertRaises(ValueError): self.observe(names)
        with self.assertRaises(ValueError): observer.observe_fixture(self.fd, (0, 0), ['a'])

    def test_permission_error_not_absence(self):
        with patch.object(observer.os, 'stat', side_effect=PermissionError('supplied denied')):
            with self.assertRaises(PermissionError): self.observe()
        os.fstat(self.fd)

    def test_file_cap(self):
        self.write(data=b'x')
        with patch.object(observer, 'MAX_FILE', 0):
            with self.assertRaises(ValueError): self.observe()

    def test_aggregate_cap(self):
        self.write('one', b'aa'); self.write('two', b'bb')
        with patch.object(observer, 'MAX_TOTAL', 3):
            with self.assertRaises(ValueError): self.observe(['one', 'two'])

    def test_change_during_read_rejected(self):
        self.write()
        read = os.read
        changed = False
        def mutate(fd, size):
            nonlocal changed
            data = read(fd, size)
            if not changed:
                changed = True
                os.unlink('package.json', dir_fd=self.fd)
                self.write(data=b'[]')
            return data
        with patch.object(observer.os, 'read', side_effect=mutate):
            with self.assertRaises(ValueError): self.observe()
        os.fstat(self.fd)

    def test_absence_appears_at_final_recheck(self):
        self.write()
        original_stat = os.stat
        seen = 0
        def appearing(path, *args, **kwargs):
            nonlocal seen
            if path == '.npmrc':
                seen += 1
                if seen == 2:
                    self.write('.npmrc', b'registry=changed')
            return original_stat(path, *args, **kwargs)
        with patch.object(observer.os, 'stat', side_effect=appearing):
            with self.assertRaisesRegex(ValueError, 'absent entry appeared'):
                self.observe()
        self.assertEqual(seen, 2)
        os.fstat(self.fd)

    def test_owned_descriptors_closed_after_failure(self):
        self.write()
        close, closed = os.close, []
        def tracked(fd):
            closed.append(fd); close(fd)
        with patch.object(observer.os, 'close', side_effect=tracked), patch.object(observer.os, 'read', side_effect=OSError('supplied failure')):
            with self.assertRaises(OSError): self.observe()
        self.assertEqual(len(closed), 2)
        self.assertNotIn(self.fd, closed)
        for fd in closed:
            with self.assertRaises(OSError): os.fstat(fd)


if __name__ == '__main__':
    unittest.main()
