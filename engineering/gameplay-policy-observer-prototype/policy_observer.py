"""Inactive fixture-only read-only observer. No CLI or arbitrary root path.
Caller owns a freshly created private fixture directory and its open FD, pins
its (device,inode), and prevents concurrent writers. This cannot prove that
contract, ancestor/path identity, absence after return, or install readiness.
Raw entries deliberately omit rootAlias/parentAlias: FD identity is not proof
of external pathname non-aliasing. A later reviewed integration must add that.
"""
import hashlib
import os
import re
import stat
from contextlib import ExitStack

MAX_FILES = 32
MAX_FILE = 4 * 1024 * 1024
MAX_TOTAL = 8 * 1024 * 1024
CHUNK = 64 * 1024


def require(ok, message):
    if not ok:
        raise ValueError(message)


def identity(s):
    require(stat.S_ISREG(s.st_mode) and s.st_nlink == 1, 'private regular file required')
    require(0 <= s.st_size <= MAX_FILE and s.st_mtime_ns >= 0 and s.st_ctime_ns >= 0, 'file metadata out of bounds')
    return dict(device=str(s.st_dev), inode=str(s.st_ino), size=s.st_size,
                links=s.st_nlink, mode='regular', mtimeNs=str(s.st_mtime_ns), ctimeNs=str(s.st_ctime_ns))


def observe_fixture(root_fd, expected_identity, names):
    require(type(root_fd) is int and root_fd >= 0, 'directory FD required')
    require(type(expected_identity) is tuple and len(expected_identity) == 2 and
            all(type(v) is int and v >= 0 for v in expected_identity), 'expected directory identity required')
    require(type(names) is list and 0 < len(names) <= MAX_FILES, 'bounded explicit filenames required')
    for name in names:
        require(type(name) is str and 0 < len(name) <= 128 and
                re.fullmatch(r'[A-Za-z0-9_.-]+', name) and set(name) != {'.'}, 'root filename required')
    require(len(set(names)) == len(names), 'duplicate filename')
    with ExitStack() as owned:
        root = os.dup(root_fd)
        owned.callback(os.close, root)
        initial = os.fstat(root)
        require(stat.S_ISDIR(initial.st_mode) and (initial.st_dev, initial.st_ino) == expected_identity,
                'directory identity mismatch')
        directory_stamp = (initial.st_dev, initial.st_ino, initial.st_mtime_ns, initial.st_ctime_ns)
        entries, handles, total = [], [], 0
        for name in names:
            try:
                before_stat = os.stat(name, dir_fd=root, follow_symlinks=False)
            except FileNotFoundError:
                entries.append(dict(path=name, state='absent', sha256=None, bytes=None,
                                    before=None, opened=None, after=None))
                continue
            before = identity(before_stat)
            # NONBLOCK prevents a raced FIFO from blocking before fstat rejects it.
            fd = os.open(name, os.O_RDONLY | os.O_NOFOLLOW | os.O_NONBLOCK | os.O_CLOEXEC, dir_fd=root)
            owned.callback(os.close, fd)
            opened = identity(os.fstat(fd))
            require(before == opened, 'entry changed before open')
            total += opened['size']
            require(total <= MAX_TOTAL, 'aggregate byte cap')
            digest, count = hashlib.sha256(), 0
            while True:
                data = os.read(fd, min(CHUNK, opened['size'] - count + 1))
                if not data:
                    break
                count += len(data)
                require(count <= opened['size'], 'file grew during read')
                digest.update(data)
            require(count == opened['size'], 'file shortened during read')
            after = identity(os.fstat(fd))
            require(before == after == identity(os.stat(name, dir_fd=root, follow_symlinks=False)), 'file changed during read')
            entries.append(dict(path=name, state='regular', sha256=digest.hexdigest(), bytes=count,
                                before=before, opened=opened, after=after))
            handles.append((name, fd, before))
        # Hold every regular file FD through the whole observation window.
        for name, fd, before in handles:
            require(before == identity(os.fstat(fd)) == identity(os.stat(name, dir_fd=root, follow_symlinks=False)), 'file changed before completion')
        for entry in entries:
            if entry['state'] == 'absent':
                try:
                    os.stat(entry['path'], dir_fd=root, follow_symlinks=False)
                except FileNotFoundError:
                    continue
                raise ValueError('absent entry appeared')
        final = os.fstat(root)
        require(directory_stamp == (final.st_dev, final.st_ino, final.st_mtime_ns, final.st_ctime_ns), 'directory changed')
        return dict(entries=entries, executionAuthorized=False,
                    scope='Owned-fixture FD observations only; pathname/ancestor ownership and runtime admission unproven.')
