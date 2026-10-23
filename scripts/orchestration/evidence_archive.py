#!/usr/bin/env python3
"""Verified archive reads and explicitly owned small caches, never evidence retirement.

The canonical archive and historical extracted originals are read-only. This is
not a sandbox against a hostile same-user writer. Callers own serialization and
must preserve their original acceptance/retention records.
"""
import argparse
import hashlib
import json
import os
from pathlib import Path, PurePosixPath
import re
import stat
import struct
import time
import uuid
import zipfile
from contextlib import ExitStack, contextmanager

LIMITS = {'archive_bytes': 96 * 1024**2, 'members': 200, 'decoded_bytes': 128 * 1024**2,
          'member_bytes': 8 * 1024**2, 'selection_count': 6, 'cache_bytes': 32 * 1024**2,
          'chunk_bytes': 128 * 1024, 'seconds': 15, 'directory_bytes': 256 * 1024, 'path_depth': 8, 'path_bytes': 64 * 1024}
CONTROL = '.evidence-cache.json'
NOFOLLOW = os.O_NOFOLLOW
DIRECTORY = os.O_RDONLY | os.O_DIRECTORY | NOFOLLOW


def require(condition, message):
    if not condition:
        raise ValueError(message)


def encoded(value):
    return (json.dumps(value, sort_keys=True, separators=(',', ':')) + '\n').encode()


def decode_json(data):
    def unique(pairs):
        result = {}
        for key, value in pairs:
            require(key not in result, 'Duplicate JSON key')
            result[key] = value
        return result
    return json.loads(data, object_pairs_hook=unique)


def sha(data):
    return hashlib.sha256(data).hexdigest()


def digest(value):
    require(isinstance(value, str) and re.fullmatch('[0-9a-f]{64}', value), 'Exact SHA-256 required')
    return value


def safe_name(value):
    require(isinstance(value, str) and 0 < len(value.encode()) <= 1024, 'Invalid member name length')
    p = PurePosixPath(value)
    require(not p.is_absolute() and str(p) == value and '\\' not in value and '\0' not in value,
            'Noncanonical member name')
    require(len(p.parts) <= LIMITS['path_depth'] and all(part and not part.startswith('.') and ':' not in part
            and not any(ord(c) < 32 or ord(c) == 127 for c in part) for part in p.parts), 'Hidden/traversal member name')
    require(p.suffix.lower() in ('.png', '.json', '.jsonl', '.log', '.txt'), 'Unsupported evidence member type')
    return p


def record(st):
    return {'device': st.st_dev, 'inode': st.st_ino, 'mode': st.st_mode, 'bytes': st.st_size,
            'nlink': st.st_nlink, 'mtimeNs': st.st_mtime_ns, 'ctimeNs': st.st_ctime_ns}


def dir_record(st):
    require(stat.S_ISDIR(st.st_mode), 'Physical directory required')
    return {key: record(st)[key] for key in ('device', 'inode', 'mode')}


@contextmanager
def parent_chain(path):
    """Pin every physical parent; fd-relative writes never follow swapped links."""
    path = Path(path)
    require(path.is_absolute() and str(path) == os.path.normpath(path), 'Canonical absolute path required')
    with ExitStack() as stack:
        fd = os.open('/', DIRECTORY); stack.callback(os.close, fd)
        pins = [(Path('/'), fd, dir_record(os.fstat(fd)))]
        for component in path.parts[1:]:
            fd = os.open(component, DIRECTORY, dir_fd=fd); stack.callback(os.close, fd)
            pins.append((pins[-1][0]/component, fd, dir_record(os.fstat(fd))))
        def verify():
            for name, pinned, identity in pins:
                require(dir_record(os.fstat(pinned)) == identity == dir_record(name.lstat()), 'Parent directory changed')
        verify()
        yield fd, verify
        verify()


class Archive:
    """One pinned descriptor remains open through hash checks and ZIP decoding."""
    def __init__(self, path, expected_sha):
        self.path = Path(path)
        self.expected = digest(expected_sha)
        self.stack = ExitStack()
        self.start = time.monotonic()
        self.decoded = 0

    def budget(self):
        require(time.monotonic() - self.start < LIMITS['seconds'], 'Archive operation deadline exceeded')

    def verify(self):
        self.verify_parent()
        require(record(os.fstat(self.fd)) == self.before == record(self.path.lstat()), 'Archive identity changed')

    def hash_archive(self):
        self.file.seek(0); h = hashlib.sha256(); count = 0
        while chunk := self.file.read(LIMITS['chunk_bytes']):
            self.budget(); count += len(chunk); require(count <= LIMITS['archive_bytes'], 'Archive byte limit exceeded'); h.update(chunk)
        require(h.hexdigest() == self.expected, 'Canonical archive hash differs')
        self.verify()

    def __enter__(self):
        try:
            parent, self.verify_parent = self.stack.enter_context(parent_chain(self.path.parent))
            self.fd = os.open(self.path.name, os.O_RDONLY | NOFOLLOW, dir_fd=parent)
            self.stack.callback(os.close, self.fd)
            self.before = record(os.fstat(self.fd))
            require(stat.S_ISREG(self.before['mode']) and self.before['bytes'] <= LIMITS['archive_bytes'], 'Invalid archive file')
            self.file = self.stack.enter_context(os.fdopen(os.dup(self.fd), 'rb'))
            self.hash_archive()
            # Bound central-directory allocation BEFORE zipfile constructs ZipInfo objects.
            size = self.before['bytes']; self.file.seek(max(0, size-65557)); tail = self.file.read(65557)
            at = tail.rfind(b'PK\x05\x06'); require(at >= 0 and len(tail)-at >= 22, 'Missing ZIP end record')
            signature, disk, start_disk, on_disk, count, central_size, central_offset, comment = struct.unpack('<4s4H2LH', tail[at:at+22])
            require(disk == start_disk == 0 and on_disk == count and 0 < count <= LIMITS['members'], 'Unsupported ZIP volume/count')
            require(count != 0xffff and central_size != 0xffffffff and central_offset != 0xffffffff, 'ZIP64 unsupported')
            require(central_size <= LIMITS['directory_bytes'] and at+22+comment == len(tail)
                    and central_offset+central_size == size-len(tail)+at, 'Unbounded/noncanonical central directory')
            raw_names = self.preflight_directory(central_offset, central_size, count)
            self.zip = self.stack.enter_context(zipfile.ZipFile(self.file))
            infos = self.zip.infolist(); require(len(infos) == count, 'ZIP member count differs')
            self.infos = {}; total = 0
            for info, original_name in zip(infos, raw_names):
                require(info.orig_filename == info.filename == original_name, 'Normalized ZIP member name')
                safe_name(info.filename); mode = info.external_attr >> 16
                require(info.filename not in self.infos and not info.is_dir() and not info.flag_bits & 1, 'Duplicate/directory/encrypted member')
                require(mode in (stat.S_IFREG | 0o600, stat.S_IFREG | 0o644), 'Unsupported member mode')
                require(info.compress_type in (zipfile.ZIP_STORED, zipfile.ZIP_DEFLATED), 'Unsupported compression')
                require(0 <= info.file_size <= LIMITS['member_bytes'], 'Member byte limit exceeded')
                total += info.file_size; require(total <= LIMITS['decoded_bytes'], 'Decoded archive limit exceeded')
                self.infos[info.filename] = info
            check_tree_names(self.infos)
            self.verify()
            return self
        except BaseException:
            self.stack.close(); raise

    def preflight_directory(self, offset, size, count):
        self.file.seek(offset); data = self.file.read(size)
        require(len(data) == size, 'Truncated central directory')
        position = 0; names = []; offsets = set(); extents = []; local_metadata = 0
        for _ in range(count):
            self.budget()
            require(position + 46 <= size, 'Truncated central record')
            fields = struct.unpack('<4s6H3I5H2I', data[position:position+46])
            signature, made, needed, flags, compression, _, _, crc, compressed, decoded, name_size, extra_size, comment_size, disk, internal, external, local = fields
            require(signature == b'PK\x01\x02' and disk == 0 and needed < 45, 'Unsupported central record')
            require(flags & ~0x080e == 0 and compression in (0, 8), 'Unsupported ZIP flags/compression')
            require(compressed <= LIMITS['archive_bytes'] and decoded <= LIMITS['member_bytes']
                    and local + 30 < offset and local not in offsets, 'Invalid ZIP member extent')
            end = position + 46 + name_size + extra_size + comment_size
            require(0 < name_size <= 1024 and end <= size, 'Invalid central name/record size')
            raw = data[position+46:position+46+name_size]
            require(b'\0' not in raw, 'NUL in raw member name')
            name = raw.decode('utf-8' if flags & 0x800 else 'cp437', errors='strict'); safe_name(name)
            extra = data[position+46+name_size:position+46+name_size+extra_size]
            self.validate_extra(extra)
            # Local headers must agree too, before ZipFile can normalize or skip them.
            self.file.seek(local); header = self.file.read(30)
            require(len(header) == 30, 'Truncated local header')
            local_signature, local_needed, local_flags, local_compression, _, _, local_crc, local_compressed, local_decoded, local_name_size, local_extra_size = struct.unpack('<4s5H3I2H', header)
            require(local_signature == b'PK\x03\x04' and local_needed < 45 and local_needed == needed
                    and local_flags == flags and local_compression == compression, 'Local ZIP version/flags/compression differs')
            local_metadata += 30 + local_name_size + local_extra_size
            require(local_name_size == name_size and local_metadata <= LIMITS['directory_bytes'], 'Local metadata budget differs/exceeded')
            local_end = local + 30 + local_name_size + local_extra_size + compressed
            require(local_end <= offset, 'Local member overlaps central directory')
            local_name = self.file.read(local_name_size); local_extra = self.file.read(local_extra_size)
            require(local_name == raw and len(local_extra) == local_extra_size, 'Raw local member name/extra differs')
            self.validate_extra(local_extra)
            if flags & 8:
                require(local_crc in (0, crc) and local_compressed in (0, compressed) and local_decoded in (0, decoded), 'Local descriptor placeholders differ')
            else:
                require((local_crc, local_compressed, local_decoded) == (crc, compressed, decoded), 'Local member sizes/CRC differ')
            if flags & 8:
                self.file.seek(local_end); descriptor = self.file.read(16)
                has_signature = descriptor[:4] == b'PK\x07\x08'; descriptor_size = 16 if has_signature else 12
                require(local_end + descriptor_size <= offset and len(descriptor) >= descriptor_size, 'Truncated/overlapping data descriptor')
                values = struct.unpack('<3I', descriptor[4:16] if has_signature else descriptor[:12])
                require(values == (crc, compressed, decoded), 'Unsupported/mismatched data descriptor')
                local_end += descriptor_size
            extents.append((local, local_end))
            require(name not in names, 'Duplicate raw member name')
            names.append(name); offsets.add(local); position = end
        require(position == size, 'Unparsed central-directory data')
        ordered = sorted(extents)
        require(ordered[0][0] == 0 and ordered[-1][1] == offset
                and all(end == ordered[i+1][0] for i, (_, end) in enumerate(ordered[:-1])), 'Hidden/overlapping local extents')
        check_tree_names(names)
        return names

    def validate_extra(self, extra):
        at = 0
        while at < len(extra):
            require(at + 4 <= len(extra), 'Truncated ZIP extra')
            kind, length = struct.unpack('<HH', extra[at:at+4]); at += 4
            require(kind not in (1, 0x7075) and at + length <= len(extra), 'Unsupported ZIP64/name extra')
            at += length

    def bind_manifest(self, manifest):
        require(self.before['bytes'] == manifest['archiveBytes'], 'Archive length differs')
        require(set(self.infos) == {row['name'] for row in manifest['members']}, 'Complete archive membership differs')
        for row in manifest['members']:
            info = self.infos[row['name']]
            require(row['bytes'] == info.file_size and row['mode'] == info.external_attr >> 16, 'Complete archive metadata differs')

    def copy(self, name, expected, write):
        safe_name(name); require(name in self.infos, 'Unknown member')
        info = self.infos[name]; mode = info.external_attr >> 16
        if expected is not None:
            require(set(expected) == {'name', 'bytes', 'mode', 'sha256'} and expected['name'] == name
                    and expected['bytes'] == info.file_size and expected['mode'] == mode, 'Member manifest metadata differs')
            digest(expected['sha256'])
        h = hashlib.sha256(); count = 0
        with self.zip.open(info) as stream:
            while chunk := stream.read(LIMITS['chunk_bytes']):
                self.budget(); count += len(chunk); self.decoded += len(chunk)
                require(count <= info.file_size and self.decoded <= LIMITS['decoded_bytes'], 'Decoded byte budget exceeded')
                h.update(chunk); write(chunk)
        require(count == info.file_size, 'Decoded member length differs')
        actual = {'name': name, 'bytes': count, 'mode': mode, 'sha256': h.hexdigest()}
        if expected is not None: require(actual == expected, 'Decoded member hash differs')
        self.verify()
        return actual

    def __exit__(self, kind, value, traceback):
        try:
            if kind is None: self.hash_archive()
        finally:
            self.stack.close()


def index_archive(path, expected_sha):
    with Archive(path, expected_sha) as archive:
        rows = [archive.copy(name, None, lambda data: None) for name in sorted(archive.infos)]
        return {'version': 1, 'archiveSha256': archive.expected, 'archiveBytes': archive.before['bytes'], 'members': rows}


def check_tree_names(names):
    names = set(names)
    require(sum(len(name.encode()) for name in names) <= LIMITS['path_bytes'], 'Total member path budget exceeded')
    for name in names:
        require(not any(str(parent) in names for parent in PurePosixPath(name).parents if str(parent) != '.'), 'File/directory prefix collision')


def selection(manifest, names):
    require(isinstance(manifest, dict) and set(manifest) == {'version', 'archiveSha256', 'archiveBytes', 'members'} and type(manifest['version']) is int and manifest['version'] == 1, 'Unsupported manifest')
    digest(manifest['archiveSha256'])
    require(type(manifest['archiveBytes']) is int and 0 < manifest['archiveBytes'] <= LIMITS['archive_bytes'], 'Invalid manifest archive size')
    require(isinstance(manifest['members'], list) and 0 < len(manifest['members']) <= LIMITS['members'], 'Invalid manifest membership')
    rows = {}
    for row in manifest['members']:
        require(isinstance(row, dict) and set(row) == {'name', 'bytes', 'mode', 'sha256'}, 'Invalid member record')
        safe_name(row['name']); digest(row['sha256'])
        require(row['name'] not in rows and type(row['bytes']) is int and 0 <= row['bytes'] <= LIMITS['member_bytes']
                and row['mode'] in (stat.S_IFREG | 0o600, stat.S_IFREG | 0o644), 'Invalid member metadata')
        rows[row['name']] = row
    check_tree_names(rows)
    require(sum(row['bytes'] for row in rows.values()) <= LIMITS['decoded_bytes'], 'Manifest decoded budget exceeded')
    require(isinstance(names, list) and all(isinstance(name, str) for name in names) and 0 < len(names) <= LIMITS['selection_count'] and len(set(names)) == len(names), 'Explicit unique selection of 1–6 members required')
    require(all(name in rows for name in names), 'Selection outside bound manifest membership')
    chosen = [rows[name] for name in names]
    require(sum(row['bytes'] for row in chosen) <= LIMITS['cache_bytes'], 'Selected cache byte budget exceeded')
    return chosen


def read_member(path, manifest, name):
    expected = selection(manifest, [name])[0]; chunks = []
    with Archive(path, manifest['archiveSha256']) as archive:
        archive.bind_manifest(manifest)
        archive.copy(name, expected, chunks.append)
    return b''.join(chunks)


def materialize(path, manifest, names, cache):
    """Fresh bounded cache only. Partial failures remain for explicit diagnosis."""
    chosen = selection(manifest, names); cache = Path(cache); path = Path(path)
    require(cache.is_absolute() and path.is_absolute() and cache != path and cache not in path.parents and cache != path.parent and path.parent not in cache.parents, 'Unsafe cache/archive relationship')
    with Archive(path, manifest['archiveSha256']) as archive, parent_chain(cache.parent) as (parent, verify_parent):
        archive.bind_manifest(manifest)
        os.mkdir(cache.name, 0o700, dir_fd=parent)  # Never reuse/overwrite an existing path.
        with ExitStack() as stack:
            root = os.open(cache.name, DIRECTORY, dir_fd=parent); stack.callback(os.close, root)
            root_identity = dir_record(os.fstat(root)); dirs = {'.': (root, root_identity)}; files = []
            def verify_dirs():
                verify_parent()
                for rel, (fd, identity) in dirs.items():
                    actual = cache if rel == '.' else cache/rel
                    require(dir_record(os.fstat(fd)) == identity == dir_record(actual.lstat()), 'Cache parent changed')
            token = uuid.uuid4().hex
            # Leave an exclusive prepared record if streaming fails; never auto-delete it.
            prepared = {'version': 1, 'status': 'prepared', 'token': token, 'archiveSha256': manifest['archiveSha256'],
                        'manifestSha256': sha(encoded(manifest)), 'archive': str(path), 'selection': names}
            control = os.open(CONTROL, os.O_WRONLY | os.O_CREAT | os.O_EXCL | NOFOLLOW, 0o600, dir_fd=root)
            with os.fdopen(control, 'wb') as stream:
                stream.write(encoded(prepared)); stream.flush(); os.fsync(stream.fileno())
                prepared_identity = record(os.fstat(stream.fileno()))
            for row in chosen:
                parts = PurePosixPath(row['name']).parts; directory = root; prefix = []
                for component in parts[:-1]:
                    prefix.append(component); rel = '/'.join(prefix)
                    if rel not in dirs:
                        os.mkdir(component, 0o700, dir_fd=directory)
                        fd = os.open(component, DIRECTORY, dir_fd=directory); stack.callback(os.close, fd)
                        dirs[rel] = (fd, dir_record(os.fstat(fd)))
                    directory = dirs[rel][0]
                verify_dirs(); temporary = '.'+uuid.uuid4().hex+'.tmp'
                fd = os.open(temporary, os.O_WRONLY | os.O_CREAT | os.O_EXCL | NOFOLLOW, 0o600, dir_fd=directory)
                with os.fdopen(fd, 'wb') as stream:
                    archive.copy(row['name'], row, stream.write); stream.flush(); os.fsync(stream.fileno())
                    os.fchmod(stream.fileno(), stat.S_IMODE(row['mode'])); identity = record(os.fstat(stream.fileno()))
                    content_fd = os.dup(stream.fileno()); stack.callback(os.close, content_fd)
                verify_dirs()
                require(record(os.fstat(content_fd)) == identity == record(os.stat(temporary, dir_fd=directory, follow_symlinks=False)), 'Written temporary identity changed')
                # Linking a new name is exclusive; an unexpected target cannot be overwritten.
                os.link(temporary, parts[-1], src_dir_fd=directory, dst_dir_fd=directory, follow_symlinks=False)
                linked = record(os.fstat(content_fd))
                require(linked['nlink'] == 2 and linked == record(os.stat(temporary, dir_fd=directory, follow_symlinks=False))
                        == record(os.stat(parts[-1], dir_fd=directory, follow_symlinks=False)), 'Published temporary inode differs')
                require(all(linked[key] == identity[key] for key in identity if key not in ('nlink', 'ctimeNs')), 'Published content identity differs')
                os.unlink(temporary, dir_fd=directory)
                final_identity = record(os.fstat(content_fd))
                require(final_identity['nlink'] == 1 and final_identity == record(os.stat(parts[-1], dir_fd=directory, follow_symlinks=False))
                        and all(final_identity[key] == identity[key] for key in identity if key not in ('nlink', 'ctimeNs')), 'Cache file identity differs')
                identity = final_identity
                files.append({**row, 'identity': identity})
            verify_dirs(); archive.hash_archive()
            def verify_complete():
                verify_dirs()
                for rel, (fd, _) in dirs.items():
                    archive.budget()
                    expected = {PurePosixPath(row['name']).name for row in files if str(PurePosixPath(row['name']).parent) == rel}
                    expected.update(PurePosixPath(name).name for name in dirs if name != '.' and str(PurePosixPath(name).parent) == rel)
                    if rel == '.': expected.add(CONTROL)
                    seen = set()
                    with os.scandir(fd) as entries:
                        for item in entries:
                            archive.budget(); require(item.name in expected and item.name not in seen, 'Unexpected materialized cache entry'); seen.add(item.name)
                    require(seen == expected, 'Incomplete materialized cache paths')
                for row in files:
                    entry = PurePosixPath(row['name'])
                    require(record(os.stat(entry.name, dir_fd=dirs[str(entry.parent)][0], follow_symlinks=False)) == row['identity'], 'Materialized cache file changed')
            verify_complete()
            receipt = {**prepared, 'status': 'materialized', 'cache': str(cache), 'rootIdentity': root_identity,
                       'directories': {rel: identity for rel, (_, identity) in dirs.items()}, 'files': files,
                       'bytes': sum(row['bytes'] for row in files)}
            temp = '.'+uuid.uuid4().hex+'.tmp'
            fd = os.open(temp, os.O_RDWR | os.O_CREAT | os.O_EXCL | NOFOLLOW, 0o600, dir_fd=root)
            with os.fdopen(fd, 'wb') as stream:
                stream.write(encoded(receipt)); stream.flush(); os.fsync(stream.fileno())
                complete_fd = os.dup(stream.fileno()); stack.callback(os.close, complete_fd)
                complete_identity = record(os.fstat(complete_fd))
            verify_dirs()
            require(record(os.fstat(complete_fd)) == complete_identity == record(os.stat(temp, dir_fd=root, follow_symlinks=False)), 'Completed receipt temporary changed')
            require(record(os.stat(CONTROL, dir_fd=root, follow_symlinks=False)) == prepared_identity, 'Prepared ownership record changed')
            os.replace(temp, CONTROL, src_dir_fd=root, dst_dir_fd=root)
            published = record(os.fstat(complete_fd))
            require(published == record(os.stat(CONTROL, dir_fd=root, follow_symlinks=False))
                    and all(published[key] == complete_identity[key] for key in complete_identity if key != 'ctimeNs'), 'Completed receipt publication changed')
            require(sha(os.pread(complete_fd, LIMITS['directory_bytes']+1, 0)) == sha(encoded(receipt))
                    and record(os.fstat(complete_fd)) == published == record(os.stat(CONTROL, dir_fd=root, follow_symlinks=False)), 'Completed receipt content differs')
            verify_complete()
            receipt_sha = sha(encoded(receipt))
    return {'cache': str(cache), 'receiptSha256': receipt_sha, 'token': token, 'bytes': receipt['bytes'], 'ownershipReceipt': receipt}


def read_bound_json(path, expected_sha):
    path = Path(path); digest(expected_sha)
    with parent_chain(path.parent) as (parent, verify):
        fd = os.open(path.name, os.O_RDONLY | NOFOLLOW, dir_fd=parent)
        with os.fdopen(fd, 'rb') as stream:
            before = record(os.fstat(stream.fileno()))
            require(stat.S_ISREG(before['mode']) and before['bytes'] <= LIMITS['directory_bytes'], 'Oversized/nonregular manifest')
            data = stream.read(LIMITS['directory_bytes']+1)
            require(len(data) <= LIMITS['directory_bytes'] and sha(data) == expected_sha, 'Bound manifest changed')
            require(record(os.fstat(stream.fileno())) == before == record(path.lstat()), 'Manifest identity changed')
        verify()
    return decode_json(data)


def receipt_rows(receipt, cache, token):
    require(isinstance(receipt, dict) and set(receipt) == {'version', 'status', 'token', 'archiveSha256',
            'manifestSha256', 'archive', 'selection', 'cache', 'rootIdentity', 'directories', 'files', 'bytes'}, 'Invalid cache receipt')
    require(type(receipt['version']) is int and receipt['version'] == 1 and receipt['status'] == 'materialized'
            and receipt['cache'] == str(cache) and receipt['token'] == token
            and isinstance(token, str) and re.fullmatch('[0-9a-f]{32}', token), 'Cache ownership differs')
    digest(receipt['archiveSha256']); digest(receipt['manifestSha256'])
    archive = Path(receipt['archive'])
    require(archive.is_absolute() and str(archive) == os.path.normpath(archive), 'Invalid archive receipt path')
    require(isinstance(receipt['files'], list) and 0 < len(receipt['files']) <= LIMITS['selection_count'], 'Invalid cache file count')
    rows = {}; dirs = {'.'}
    for row in receipt['files']:
        require(isinstance(row, dict) and set(row) == {'name', 'bytes', 'mode', 'sha256', 'identity'}, 'Invalid cache file row')
        name = safe_name(row['name']); digest(row['sha256'])
        require(row['name'] not in rows and type(row['bytes']) is int and 0 <= row['bytes'] <= LIMITS['member_bytes']
                and row['mode'] in (stat.S_IFREG | 0o600, stat.S_IFREG | 0o644), 'Invalid cache member metadata')
        identity = row['identity']
        require(isinstance(identity, dict) and set(identity) == {'device','inode','mode','bytes','nlink','mtimeNs','ctimeNs'}
                and all(type(v) is int and v >= 0 for v in identity.values()) and identity['nlink'] == 1
                and identity['mode'] == row['mode'] and identity['bytes'] == row['bytes'], 'Invalid cache identity')
        rows[row['name']] = row
        dirs.update(str(parent) for parent in name.parents)
    check_tree_names(rows)
    require(receipt['selection'] == list(rows) and type(receipt['bytes']) is int
            and receipt['bytes'] == sum(row['bytes'] for row in rows.values()) <= LIMITS['cache_bytes'], 'Cache selection budget differs')
    require(isinstance(receipt['directories'], dict) and set(receipt['directories']) == dirs, 'Cache directory set differs')
    for identity in receipt['directories'].values():
        require(isinstance(identity, dict) and set(identity) == {'device','inode','mode'}
                and all(type(v) is int and v >= 0 for v in identity.values())
                and identity['mode'] == stat.S_IFDIR | 0o700, 'Invalid cache directory identity')
    require(receipt['rootIdentity'] == receipt['directories']['.'], 'Cache root identity differs')
    return rows


@contextmanager
def release_journal(path, receipt, receipt_sha, control_identity):
    """Append-only, bounded external proof survives complete or partial cleanup."""
    with parent_chain(path.parent) as (parent, verify_parent):
        fd = os.open(path.name, os.O_WRONLY | os.O_CREAT | os.O_EXCL | NOFOLLOW, 0o600, dir_fd=parent)
        with os.fdopen(fd, 'wb') as stream:
            last = record(os.fstat(stream.fileno())); written = 0
            def emit(event):
                nonlocal written, last
                data = encoded(event); next_size = written + len(data)
                require(next_size <= LIMITS['directory_bytes'], 'Release journal byte limit exceeded')
                verify_parent(); current = record(os.fstat(stream.fileno()))
                require(current == last == record(path.lstat()) and current['bytes'] == written
                        and current['nlink'] == 1 and stream.tell() == written, 'Release journal changed between appends')
                require(stream.write(data) == len(data), 'Short release journal write')
                stream.flush(); os.fsync(stream.fileno())
                current = record(os.fstat(stream.fileno()))
                require(current == record(path.lstat()) and current['bytes'] == next_size and stream.tell() == next_size
                        and all(current[key] == last[key] for key in ('device', 'inode', 'mode', 'nlink')), 'Release journal write identity/size differs')
                last = current; written = next_size
            emit({'event': 'release-prepared', 'receiptSha256': receipt_sha, 'ownershipReceipt': receipt, 'controlIdentity': control_identity})
            try: yield emit
            except BaseException as error:
                try: emit({'event': 'release-failed', 'errorType': type(error).__name__, 'message': str(error)[:1024]})
                except BaseException as journal_error:
                    raise RuntimeError('Release failed and external failure-journal append also failed: '+str(journal_error)[:1024]) from error
                raise


def release_cache(cache, expected_receipt_sha, token, journal):
    """Only this exact completed cache; no original extraction/ZIP retirement API.

    Validate the entire bounded pathset before the first unlink. A concurrent
    mutation or later I/O failure may leave a partially released cache; callers
    must preserve that failure and never claim transactional rollback.
    """
    cache = Path(cache); digest(expected_receipt_sha); start = time.monotonic()
    def budget(): require(time.monotonic()-start < LIMITS['seconds'], 'Cache release deadline exceeded')
    with parent_chain(cache.parent) as (parent, verify_parent), ExitStack() as journal_stack:
        journal_event = None
        with parent_chain(cache) as (root, verify_root), ExitStack() as stack:
            pinned_root = os.dup(root); journal_stack.callback(os.close, pinned_root)
            control = os.open(CONTROL, os.O_RDONLY | NOFOLLOW, dir_fd=root); stack.callback(os.close, control)
            control_before = record(os.fstat(control))
            require(stat.S_ISREG(control_before['mode']) and control_before['nlink'] == 1
                    and control_before['bytes'] <= LIMITS['directory_bytes'], 'Invalid cache receipt file')
            body = os.read(control, LIMITS['directory_bytes']+1)
            require(sha(body) == expected_receipt_sha, 'Cache ownership receipt differs')
            receipt = decode_json(body); rows = receipt_rows(receipt, cache, token)
            require(dir_record(os.fstat(root)) == receipt['rootIdentity'], 'Cache root changed')
            canonical_stack = ExitStack(); journal_stack.callback(canonical_stack.close)
            canonical = canonical_stack.enter_context(Archive(receipt['archive'], receipt['archiveSha256']))
            for name, row in rows.items():
                require(name in canonical.infos and canonical.infos[name].file_size == row['bytes']
                        and canonical.infos[name].external_attr >> 16 == row['mode'], 'Canonical recovery member differs')
            pinned = {'.': root}
            for rel in sorted((name for name in receipt['directories'] if name != '.'), key=lambda p: len(PurePosixPath(p).parts)):
                budget(); name = PurePosixPath(rel)
                fd = os.open(name.name, DIRECTORY, dir_fd=pinned[str(name.parent)]); stack.callback(os.close, fd)
                require(dir_record(os.fstat(fd)) == receipt['directories'][rel], 'Cache directory changed')
                pinned[rel] = fd
            def verify_dirs():
                verify_root()
                for rel, fd in pinned.items():
                    identity = receipt['directories'][rel]
                    actual = cache if rel == '.' else cache/rel
                    require(dir_record(os.fstat(fd)) == identity == dir_record(actual.lstat()), 'Cache directory alias/change')
            def verify_control():
                require(record(os.fstat(control)) == control_before == record(os.stat(CONTROL, dir_fd=root, follow_symlinks=False)), 'Cache receipt identity changed')
            for rel, fd in pinned.items():
                budget(); expected = {PurePosixPath(name).name for name in rows if str(PurePosixPath(name).parent) == rel}
                expected.update(PurePosixPath(name).name for name in pinned if name != '.' and str(PurePosixPath(name).parent) == rel)
                if rel == '.': expected.add(CONTROL)
                # scandir is bounded by the expected set, rather than an unbounded listdir/walk.
                seen = set()
                with os.scandir(fd) as entries:
                    for item in entries:
                        budget(); require(item.name in expected and item.name not in seen, 'Unowned cache entry'); seen.add(item.name)
                require(seen == expected, 'Incomplete cache paths')
            for name, row in rows.items():
                budget(); entry = PurePosixPath(name); directory = pinned[str(entry.parent)]
                fd = os.open(entry.name, os.O_RDONLY | NOFOLLOW, dir_fd=directory)
                with os.fdopen(fd, 'rb') as stream:
                    require(record(os.fstat(stream.fileno())) == row['identity'], 'Cache file identity changed')
                    h = hashlib.sha256(); total = 0
                    while chunk := stream.read(LIMITS['chunk_bytes']):
                        budget(); total += len(chunk); require(total <= row['bytes'], 'Cache size changed'); h.update(chunk)
                    require(total == row['bytes'] and h.hexdigest() == row['sha256']
                            and record(os.fstat(stream.fileno())) == row['identity']
                            == record(os.stat(entry.name, dir_fd=directory, follow_symlinks=False)), 'Cache content/identity changed')
            verify_dirs(); verify_control()
            journal = Path(journal)
            require(journal.is_absolute() and journal != cache and cache not in journal.parents
                    and journal != Path(receipt['archive']).parent and Path(receipt['archive']).parent not in journal.parents,
                    'Release journal must be outside disposable cache and archive root')
            journal_event = journal_stack.enter_context(release_journal(journal, receipt, expected_receipt_sha, control_before))
            for name, row in rows.items():
                budget(); entry = PurePosixPath(name); directory = pinned[str(entry.parent)]
                verify_dirs(); verify_control()
                require(record(os.stat(entry.name, dir_fd=directory, follow_symlinks=False)) == row['identity'], 'Cache file changed before release')
                canonical.verify(); journal_event({'event': 'unlink-started', 'path': name, 'identity': row['identity']})
                os.unlink(entry.name, dir_fd=directory)
                journal_event({'event': 'unlinked', 'path': name})
            for rel in sorted((p for p in pinned if p != '.'), key=lambda p: len(PurePosixPath(p).parts), reverse=True):
                budget(); entry = PurePosixPath(rel); verify_root(); verify_control()
                require(dir_record(os.stat(entry.name, dir_fd=pinned[str(entry.parent)], follow_symlinks=False))
                        == receipt['directories'][rel], 'Cache directory changed before release')
                canonical.verify(); journal_event({'event': 'rmdir-started', 'path': rel, 'identity': receipt['directories'][rel]})
                os.rmdir(entry.name, dir_fd=pinned[str(entry.parent)])
                journal_event({'event': 'rmdir-completed', 'path': rel})
            verify_root(); verify_control(); canonical.verify(); journal_event({'event': 'control-unlink-started', 'identity': control_before})
            os.unlink(CONTROL, dir_fd=root); journal_event({'event': 'control-unlinked'})
        # Exit the root identity context before removing that exact root.
        budget(); verify_parent()
        require(dir_record(os.stat(cache.name, dir_fd=parent, follow_symlinks=False)) == receipt['rootIdentity'], 'Cache root changed before release')
        require(dir_record(os.fstat(pinned_root)) == receipt['rootIdentity'], 'Pinned root changed')
        canonical.verify(); journal_event({'event': 'root-rmdir-started', 'identity': receipt['rootIdentity']})
        os.rmdir(cache.name, dir_fd=parent)
        try: os.stat(cache.name, dir_fd=parent, follow_symlinks=False)
        except FileNotFoundError: pass
        else: raise ValueError('Cache root reappeared')
        require(dir_record(os.fstat(pinned_root)) == receipt['rootIdentity'], 'Removed pinned root changed')
        canonical_stack.close()  # Final canonical hash/identity proof while the failure journal is still open.
        journal_event({'event': 'released-owned-cache'})
    return {'status': 'released-owned-cache', 'receiptSha256': expected_receipt_sha, 'token': token}


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    sub = parser.add_subparsers(dest='command', required=True)
    index = sub.add_parser('index'); index.add_argument('--archive', required=True); index.add_argument('--sha256', required=True)
    restore = sub.add_parser('materialize'); restore.add_argument('--archive', required=True); restore.add_argument('--manifest', required=True); restore.add_argument('--manifest-sha256', required=True); restore.add_argument('--cache', required=True); restore.add_argument('--member', action='append', required=True)
    release = sub.add_parser('release-cache'); release.add_argument('--cache', required=True); release.add_argument('--receipt-sha256', required=True); release.add_argument('--token', required=True); release.add_argument('--journal', required=True)
    args = parser.parse_args()
    if args.command == 'index': result = index_archive(args.archive, args.sha256)
    elif args.command == 'materialize':
        manifest = read_bound_json(args.manifest, args.manifest_sha256)
        result = materialize(args.archive, manifest, args.member, args.cache)
    else: result = release_cache(args.cache, args.receipt_sha256, args.token, args.journal)
    print(json.dumps(result, sort_keys=True))


if __name__ == '__main__': main()
