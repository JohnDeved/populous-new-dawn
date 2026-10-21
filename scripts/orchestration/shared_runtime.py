#!/usr/bin/env python3
"""Explicit, verified non-Git runtime views with content-addressed game assets.

Never changes the source checkout, Git's index, existing dependencies or permissions.
The runtime view is not a source checkout or a replacement for canonical CI receipts.
"""
import argparse
from contextlib import ExitStack
import hashlib
import json
import os
from pathlib import Path, PurePosixPath
import stat
import shutil
import subprocess
import sys
import time

ASSETS = 'public/original'
MANIFEST = '.pnd-runtime.json'
ASSET_LAYOUT = 'filename-hardlinks-v2'
ASSET_TREES = 'trees-v2'
BUILD_EXCLUDES = {'.agents', '.codex', '.github', '.serena', 'decomp', 'docs',
                  'engineering', 'evidence', 'qa', 'references', 'tests', 'tools', 'work'}
MUTABLE_ROOTS = {'node_modules', 'work', 'dist', '.next', '.vinext', '.wrangler', '.fallow'}
LOCAL_FILES = {MANIFEST, 'pnpm-lock.yaml', 'pnpm-workspace.yaml', 'tsconfig.tsbuildinfo'}


def require(condition, message):
    if not condition:
        raise ValueError(message)


def digest(data):
    return hashlib.sha256(data).hexdigest()


def encoded(value):
    return (json.dumps(value, sort_keys=True, separators=(',', ':')) + '\n').encode()


def run_git(source, *args):
    return subprocess.check_output(['git', '-C', str(source), *args], stderr=subprocess.PIPE)


def physical(path, absent=False):
    """Reject symlink ancestors as well as a symlink at the requested root."""
    path = Path(os.path.abspath(path))
    for parent in [*reversed(path.parents), path]:
        if not parent.exists() and not parent.is_symlink():
            require(absent, f'Missing physical path: {parent}')
            continue
        require(not parent.is_symlink(), f'Symlink path component: {parent}')
        require(parent.is_dir(), f'Not a physical directory: {parent}')
    return path


def within(parent, child):
    return child == parent or parent in child.parents


def safe_relative(name):
    p = PurePosixPath(name)
    require(name and not p.is_absolute() and str(p) == name and
            all(x not in ('', '.', '..', '.git') for x in p.parts) and '\\' not in name,
            f'Unsafe tracked path: {name!r}')
    return p


def source_state(source, revision):
    source = physical(source)
    require(revision and len(revision) == 40 and all(c in '0123456789abcdef' for c in revision),
            'An exact 40-character revision is required')
    actual = run_git(source, 'rev-parse', 'HEAD').decode().strip()
    require(actual == revision, 'Source HEAD differs from requested revision')
    require(not run_git(source, 'status', '--porcelain', '--untracked-files=all').strip(),
            'Source checkout must be clean')
    require(run_git(source, 'rev-parse', '--show-object-format').decode().strip() == 'sha1',
            'Only explicitly supported SHA-1 Git repositories are accepted')
    entries = []
    for record in run_git(source, 'ls-tree', '-r', '-z', '-l', revision).split(b'\0'):
        if not record:
            continue
        metadata, raw_name = record.split(b'\t', 1)
        mode, kind, oid, size = metadata.decode().split()
        name = raw_name.decode('utf-8')
        safe_relative(name)
        require(kind == 'blob' and mode in ('100644', '100755'),
                f'Unsupported tracked symlink or non-file: {name}')
        require(name != MANIFEST, 'Runtime manifest name is reserved')
        entries.append({'path': name, 'mode': mode, 'oid': oid, 'bytes': int(size)})
    require(any(e['path'].startswith(ASSETS + '/') for e in entries), 'No committed game assets')
    flags = {record[2:].decode('utf-8'): chr(record[0])
             for record in run_git(source, 'ls-files', '-v', '-z').split(b'\0') if record}
    require(all(flag in ('H', 'S') for flag in flags.values()),
            'Assume-unchanged or unsupported index flags cannot authenticate source')
    sparse_omitted = 0
    for entry in entries:
        path = source / entry['path']
        if path.exists() or path.is_symlink():
            physical(path.parent)
            regular_bytes(path, entry)
            require(bool(path.stat().st_mode & 0o111) == (entry['mode'] == '100755'),
                    f'Source executable mode changed: {entry["path"]}')
        else:
            require(flags.get(entry['path']) == 'S', f'Missing non-sparse source: {entry["path"]}')
            sparse_omitted += 1
    return {'source': str(source), 'revision': revision,
            'tree': run_git(source, 'rev-parse', revision + '^{tree}').decode().strip(),
            'assetTree': run_git(source, 'rev-parse', revision + ':' + ASSETS).decode().strip(),
            'entries': entries, 'sparseOmittedFiles': sparse_omitted}


def selected(entry, scope):
    return scope == 'full' or entry['path'].split('/')[0] not in BUILD_EXCLUDES


def blob_oid(data):
    return hashlib.sha1(b'blob ' + str(len(data)).encode() + b'\0' + data).hexdigest()


class Blobs:
    def __init__(self, source):
        self.proc = subprocess.Popen(['git', '-C', str(source), 'cat-file', '--batch'],
                                     stdin=subprocess.PIPE, stdout=subprocess.PIPE, stderr=subprocess.PIPE)

    def read(self, entry):
        self.proc.stdin.write((entry['oid'] + '\n').encode())
        self.proc.stdin.flush()
        oid, kind, size = self.proc.stdout.readline().decode().strip().split()
        require(oid == entry['oid'] and kind == 'blob' and int(size) == entry['bytes'],
                'Git object identity changed')
        data = self.proc.stdout.read(int(size))
        require(len(data) == int(size) and self.proc.stdout.read(1) == b'\n', 'Truncated Git object')
        require(blob_oid(data) == entry['oid'], 'Git object content mismatch')
        return data

    def close(self):
        self.proc.stdin.close()
        code = self.proc.wait()
        self.proc.stdout.close()
        self.proc.stderr.close()
        require(code == 0, 'Git object reader failed')


def regular_bytes(path, entry):
    info = path.lstat()
    require(stat.S_ISREG(info.st_mode), f'Expected regular file: {path}')
    require(info.st_size == entry['bytes'], f'File size changed: {path}')
    data = path.read_bytes()
    require(blob_oid(data) == entry['oid'], f'File content changed: {path}')
    return data


def file_inventory(root):
    """Do not follow links. Include directory paths to reject undeclared empty dirs."""
    result = {}
    for parent, dirs, files in os.walk(root, followlinks=False):
        for name in dirs + files:
            path = Path(parent) / name
            result[path.relative_to(root).as_posix()] = path
    return result


def parent_names(paths):
    return {str(p) for name in paths for p in PurePosixPath(name).parents if str(p) != '.'}


def check_tree(pool, asset_tree, assets, version=2):
    # v1 is verification-only compatibility for retained views/receipts. New views
    # must keep filenames after realpath: extensionless CAS symlinks break loaders.
    require(version in (1, 2), 'Unknown asset tree version')
    physical(pool / 'blobs')
    tree = physical(pool / ('trees' if version == 1 else ASSET_TREES) / asset_tree)
    expected = {entry['path'][len(ASSETS) + 1:]: entry for entry in assets}
    actual = file_inventory(tree)
    require(set(actual) == set(expected) | parent_names(expected), 'Asset tree has undeclared or missing paths')
    for rel in parent_names(expected):
        physical(tree / rel)
    for rel, entry in expected.items():
        target = tree / rel
        blob = pool / 'blobs' / entry['sha256']
        data = regular_bytes(blob, entry)
        require(digest(data) == entry['sha256'], f'Asset digest changed: {rel}')
        if version == 1:
            require(target.is_symlink(), f'Asset tree entry must be a declared symlink: {rel}')
            require(os.readlink(target) == os.path.relpath(blob, target.parent), f'Asset symlink target changed: {rel}')
            require(target.resolve(strict=True) == blob, f'Asset symlink escaped declared store: {rel}')
        else:
            info, content = target.lstat(), blob.lstat()
            require(stat.S_ISREG(info.st_mode), f'Asset tree entry must be a regular hardlink: {rel}')
            require((info.st_dev, info.st_ino) == (content.st_dev, content.st_ino),
                    f'Asset tree entry is not the declared CAS hardlink: {rel}')
            require(entry['mode'] == '100644' and not content.st_mode & 0o111 and
                    stat.S_IMODE(info.st_mode) == stat.S_IMODE(content.st_mode),
                    f'Asset tree/CAS mode changed: {rel}')
            require(target.resolve(strict=True) == target, f'Asset hardlink path changed: {rel}')
    return tree


def asset_reuse(pool, assets):
    """Authenticate reuse, not just existence; retain identities for locked recheck."""
    physical(pool / 'blobs', absent=True)
    reused = {}
    for entry in assets:
        sha = entry['sha256']
        if sha in reused:
            continue
        path = pool / 'blobs' / sha
        if not path.exists() and not path.is_symlink():
            continue
        before = path.lstat()
        data = regular_bytes(path, entry)
        require(digest(data) == sha, 'Existing CAS blob changed')
        after = path.lstat()
        identity = lambda info: (info.st_dev, info.st_ino, info.st_mode, info.st_size,
                                 info.st_mtime_ns, info.st_ctime_ns, info.st_nlink)
        require(identity(before) == identity(after), 'CAS identity changed while planning reuse')
        require(not after.st_mode & 0o111, 'Existing CAS executable mode changed')
        reused[sha] = identity(after)
    return reused


def runtime_manifest(state, pool, runtime, scope, records, budget):
    manifest = {k: state[k] for k in ('source', 'revision', 'tree', 'assetTree')}
    manifest.update({'version': 2, 'assetLayout': ASSET_LAYOUT,
                     'kind': 'non-git-runtime-view', 'scope': scope,
                     'pool': str(pool), 'runtime': str(runtime), 'entries': records,
                     'budget': budget})
    return manifest


def allocation_budget(state, pool, runtime, scope, records, reused, reserve_bytes):
    """Conservative new allocations; reserves are separate and never discounted."""
    fs = os.statvfs(runtime.parent)
    block = max(4096, fs.f_frsize)
    rounded = lambda size: ((size + block - 1) // block) * block
    ordinary = [e for e in records if not e['path'].startswith(ASSETS + '/')]
    assets = [e for e in records if e['path'].startswith(ASSETS + '/')]
    unique = {e['sha256']: e for e in assets}
    missing = [e for sha, e in unique.items() if sha not in reused]
    ordinary_paths = {e['path'] for e in ordinary} | {ASSETS}
    asset_paths = {e['path'][len(ASSETS) + 1:] for e in assets}
    # Allow a full allocation block per inode/directory/link, even on warm reuse.
    # Six roots cover runtime, pool, blobs, versioned trees, asset tree and lock.
    directories = len(parent_names(ordinary_paths)) + len(parent_names(asset_paths)) + 6
    # Bound the final manifest, including its budget, without a recursive size model.
    manifest_bound = len(encoded(runtime_manifest(state, pool, runtime, scope, records, {}))) + 65536
    allocations = {
        'privateSourceBytes': sum(rounded(e['bytes']) + block for e in ordinary),
        'missingCasBytes': sum(rounded(e['bytes']) + block for e in missing),
        'assetHardlinkMetadataBytes': len(assets) * block,
        'directoryMetadataBytes': directories * block,
        'runtimeSymlinkBytes': block,
        'manifestBytes': rounded(manifest_bound) + block,
    }
    return {'version': 2, 'method': 'verified-cas-new-allocation-v1',
            'availableBytes': fs.f_bavail * fs.f_frsize,
            'fullCopyEstimateBytes': sum(((e['bytes'] + 4095) // 4096 + 1) * 4096 for e in records),
            'newAllocationEstimateBytes': sum(allocations.values()), 'allocations': allocations,
            'verifiedReusedBlobCount': len(reused),
            'verifiedReusedContentBytes': sum(unique[sha]['bytes'] for sha in reused),
            'missingBlobCount': len(missing), 'allocationBlockBytes': block,
            'reserveBytes': reserve_bytes, 'measuredAt': time.time()}


def prepare(source, revision, pool, runtime, reserve_bytes, scope='build'):
    state = source_state(source, revision)
    source = Path(state['source'])
    pool = physical(pool, absent=True)
    runtime = physical(runtime, absent=True)
    require(not runtime.exists(), 'Runtime destination must not exist')
    require(all(not within(a, b) for a, b in [(source, pool), (source, runtime),
            (pool, source), (pool, runtime), (runtime, source), (runtime, pool)]),
            'Source, pool and runtime must be separate non-nested roots')
    require(scope in ('build', 'full'), 'Unknown runtime scope')
    require(reserve_bytes > 0, 'A positive explicit scratch/output reserve is required')
    entries = [e for e in state['entries'] if selected(e, scope)]
    require(all(e['mode'] == '100644' for e in entries if e['path'].startswith(ASSETS + '/')),
            'Shared asset layout requires non-executable data files')
    target_parent = runtime.parent
    physical(target_parent)
    physical(pool.parent)
    require(os.stat(target_parent).st_dev == os.stat(pool.parent).st_dev, 'Pool and runtime need the same filesystem')
    roots = {}
    for path in (target_parent, pool.parent, pool, pool / 'blobs', pool / ASSET_TREES,
                 pool / ASSET_TREES / state['assetTree']):
        physical(path, absent=True)
        if path.exists():
            info = path.stat()
            require(info.st_dev == target_parent.stat().st_dev, 'Allocation roots must share one filesystem')
            roots[path] = (info.st_dev, info.st_ino)
    records = []
    reader = Blobs(source)
    try:
        for entry in entries:
            records.append({**entry, 'sha256': digest(reader.read(entry))})
    finally:
        reader.close()
    assets = [e for e in records if e['path'].startswith(ASSETS + '/')]
    reused = asset_reuse(pool, assets)
    budget = allocation_budget(state, pool, runtime, scope, records, reused, reserve_bytes)
    require(budget['availableBytes'] >= budget['newAllocationEstimateBytes'] + reserve_bytes,
            'Insufficient destination capacity for new allocations and unchanged reserve')
    pool.mkdir(exist_ok=True)
    physical(pool)
    require(pool.stat().st_dev == target_parent.stat().st_dev, 'Allocation pool filesystem changed')
    roots.setdefault(pool, (pool.stat().st_dev, pool.stat().st_ino))
    lock = pool / '.writer-lock'
    lock.mkdir()  # Fail closed on an active or abandoned publisher; never remove another lock.
    blobs = None
    try:
        # The initial plan is not a reservation. Revalidate after acquiring the
        # publisher lock, before creating the runtime or any CAS/content files.
        require(source_state(source, revision) == state, 'Source changed during allocation planning')
        for path, identity in roots.items():
            physical(path)
            require((path.stat().st_dev, path.stat().st_ino) == identity, 'Allocation filesystem root changed')
        require(asset_reuse(pool, assets) == reused, 'CAS inventory changed during allocation planning')
        locked_budget = allocation_budget(state, pool, runtime, scope, records, reused, reserve_bytes)
        require(locked_budget['allocations'] == budget['allocations'] and
                locked_budget['allocationBlockBytes'] == budget['allocationBlockBytes'],
                'Allocation geometry changed during planning')
        budget = locked_budget
        require(budget['availableBytes'] >= budget['newAllocationEstimateBytes'] + reserve_bytes,
                'Insufficient destination capacity after publication lock')
        (pool / 'blobs').mkdir(exist_ok=True)
        (pool / ASSET_TREES).mkdir(exist_ok=True)
        physical(pool / 'blobs'); physical(pool / ASSET_TREES)
        runtime.mkdir()
        blobs = Blobs(source)
        materialized = []
        prepared_assets = []
        for entry in entries:
            data = blobs.read(entry)
            record = {**entry, 'sha256': digest(data)}
            materialized.append(record)
            if entry['path'].startswith(ASSETS + '/'):
                prepared_assets.append(record)
                blob = pool / 'blobs' / record['sha256']
                if blob.exists() or blob.is_symlink():
                    require(digest(regular_bytes(blob, record)) == record['sha256'], 'Existing CAS blob changed')
                else:
                    with blob.open('xb') as out:
                        out.write(data)
            else:
                target = runtime / entry['path']
                target.parent.mkdir(parents=True, exist_ok=True)
                with target.open('xb') as out:
                    out.write(data)
                # Preserve executable source mode, never alter an existing file or security setting.
                if entry['mode'] == '100755':
                    target.chmod(0o755)
        blobs.close(); blobs = None
        tree = pool / ASSET_TREES / state['assetTree']
        if not tree.exists() and not tree.is_symlink():
            tree.mkdir()
            for entry in prepared_assets:
                target = tree / entry['path'][len(ASSETS) + 1:]
                target.parent.mkdir(parents=True, exist_ok=True)
                # Never chmod/copy shared content or change an existing v1 tree.
                os.link(pool / 'blobs' / entry['sha256'], target, follow_symlinks=False)
        check_tree(pool, state['assetTree'], prepared_assets)
        link = runtime / ASSETS
        link.parent.mkdir(parents=True, exist_ok=True)
        link.symlink_to(os.path.relpath(tree, link.parent), target_is_directory=True)
        require(materialized == records, 'Materialized inputs differ from allocation plan')
        manifest = encoded(runtime_manifest(state, pool, runtime, scope, materialized, budget))
        require(len(manifest) <= budget['allocations']['manifestBytes'], 'Runtime manifest exceeds allocation bound')
        (runtime / MANIFEST).write_bytes(manifest)
        fs = os.statvfs(runtime)
        require(fs.f_bavail * fs.f_frsize >= reserve_bytes, 'Post-prepare reserve was consumed')
        return verify(source, revision, pool, runtime)
    finally:
        if blobs:
            blobs.close()
        # This invocation created exactly this empty lock; all partial data is retained.
        lock.rmdir()


def verify(source, revision, pool, runtime):
    state = source_state(source, revision)
    pool = physical(pool)
    runtime = physical(runtime)
    require(not (runtime / '.git').exists() and not (runtime / '.git').is_symlink(), 'Runtime must not be a Git checkout')
    manifest_path = runtime / MANIFEST
    require(manifest_path.is_file() and not manifest_path.is_symlink(), 'Missing physical runtime manifest')
    manifest_bytes = manifest_path.read_bytes()
    manifest = json.loads(manifest_bytes)
    version = manifest.get('version')
    require(type(version) is int and version in (1, 2) and
            manifest.get('kind') == 'non-git-runtime-view', 'Unknown runtime manifest')
    if version == 2:
        require(manifest.get('assetLayout') == ASSET_LAYOUT, 'Unknown asset layout')
    require(manifest.get('source') == state['source'] and manifest.get('revision') == revision and
            manifest.get('tree') == state['tree'] and manifest.get('assetTree') == state['assetTree'],
            'Runtime/source identity mismatch')
    require(manifest.get('runtime') == str(runtime) and manifest.get('pool') == str(pool), 'Runtime/store binding changed')
    require(manifest.get('scope') in ('build', 'full'), 'Invalid runtime scope')
    expected = [e for e in state['entries'] if selected(e, manifest['scope'])]
    records = manifest.get('entries')
    require(isinstance(records, list) and len(records) == len(expected), 'Runtime inventory mismatch')
    for record, entry in zip(records, expected):
        require({k: record.get(k) for k in entry} == entry, 'Runtime manifest differs from Git objects')
        require(isinstance(record.get('sha256'), str) and len(record['sha256']) == 64 and
                all(x in '0123456789abcdef' for x in record['sha256']), 'Invalid asset/content digest')
    assets = [e for e in records if e['path'].startswith(ASSETS + '/')]
    tree = check_tree(pool, state['assetTree'], assets, version)
    asset_link = runtime / ASSETS
    require(asset_link.is_symlink() and os.readlink(asset_link) == os.path.relpath(tree, asset_link.parent) and
            asset_link.resolve(strict=True) == tree, 'Runtime asset link changed')
    ordinary = [e for e in records if not e['path'].startswith(ASSETS + '/')]
    for entry in ordinary:
        path = runtime / entry['path']
        physical(path.parent)
        data = regular_bytes(path, entry)
        require(digest(data) == entry['sha256'], 'Runtime digest changed')
        require(bool(path.stat().st_mode & 0o111) == (entry['mode'] == '100755'), 'Runtime executable mode changed')
    expected_paths = {e['path'] for e in ordinary} | {ASSETS}
    parents = parent_names(expected_paths)
    # Mutable output roots must be real/private. Dependencies are separately bound by run().
    for name in MUTABLE_ROOTS:
        if (runtime / name).exists() or (runtime / name).is_symlink():
            physical(runtime / name)
    check_dependency_caches(runtime / 'node_modules')
    for name in MUTABLE_ROOTS - {'node_modules'}:
        root = runtime / name
        if root.exists():
            for path in file_inventory(root).values():
                info = path.lstat()
                require(stat.S_ISDIR(info.st_mode) or (stat.S_ISREG(info.st_mode) and info.st_nlink == 1),
                        f'Mutable cache must be private/physical: {name}')
    for name in LOCAL_FILES:
        path = runtime / name
        if path.exists() or path.is_symlink():
            info = path.lstat()
            require(stat.S_ISREG(info.st_mode) and info.st_nlink == 1,
                    f'Local output/lock must be a private regular file: {name}')
    for name, path in file_inventory(runtime).items():
        top = name.split('/')[0]
        if top in MUTABLE_ROOTS or name in LOCAL_FILES:
            continue
        require(name in expected_paths or name in parents, f'Undeclared runtime input: {name}')
    return {'status': 'verified', 'source': state['source'], 'revision': revision, 'tree': state['tree'],
            'assetTree': state['assetTree'], 'scope': manifest['scope'], 'runtime': str(runtime), 'pool': str(pool),
            **({'assetLayout': ASSET_LAYOUT} if version == 2 else {}),
            'manifestSha256': digest(manifest_bytes), 'trackedFiles': len(records), 'assetFiles': len(assets),
            'sharedAssetBytes': sum(e['bytes'] for e in assets),
            'sourceSparseOmittedFiles': state['sparseOmittedFiles'], 'budget': manifest['budget']}


def check_dependency_caches(modules):
    """Mutable package caches must also be safe for standalone verify/revision."""
    if modules.exists() or modules.is_symlink():
        physical(modules)
        for cache in ('.vite', '.vite-temp', '.cache'):
            root = modules / cache
            if root.exists() or root.is_symlink():
                physical(root)
                for path in file_inventory(root).values():
                    info = path.lstat()
                    require(not stat.S_ISLNK(info.st_mode) and
                            (stat.S_ISDIR(info.st_mode) or (stat.S_ISREG(info.st_mode) and info.st_nlink == 1)),
                            f'Dependency cache must be private/physical: {path}')


def dependency_identity(runtime):
    """Bind npm or pnpm files and links without reusing npm-only receipt semantics."""
    runtime = Path(runtime)
    modules = runtime / 'node_modules'
    entries = []
    check_dependency_caches(modules)
    cache_prefixes = ('.vite/', '.vite-temp/', '.cache/')
    for rel, path in sorted(file_inventory(modules).items()):
        if rel in ('.vite', '.vite-temp', '.cache') or rel.startswith(cache_prefixes):
            continue
        info = path.lstat()
        if stat.S_ISLNK(info.st_mode):
            require(within(modules, path.resolve(strict=True)), f'Dependency link escapes private virtual store: {rel}')
            entries.append([rel, 'link', os.readlink(path)])
        elif stat.S_ISREG(info.st_mode):
            h = hashlib.sha256()
            with path.open('rb') as stream:
                for chunk in iter(lambda: stream.read(1024 * 1024), b''):
                    h.update(chunk)
            entries.append([rel, 'file', info.st_size, info.st_mode & 0o111, h.hexdigest()])
        else:
            require(stat.S_ISDIR(info.st_mode), f'Unsupported dependency entry: {rel}')
            entries.append([rel, 'dir', stat.S_IMODE(info.st_mode)])
    locks = {}
    for name in ('package.json', 'package-lock.json', 'pnpm-lock.yaml', 'pnpm-workspace.yaml', 'node_modules/.package-lock.json',
                 'node_modules/.modules.yaml', 'node_modules/.pnpm/lock.yaml'):
        path = runtime / name
        if path.exists():
            require(path.is_file() and not path.is_symlink(), f'Nonregular dependency identity: {name}')
            locks[name] = digest(path.read_bytes())
    return {'kind': 'pnpm' if (modules / '.pnpm').is_dir() else 'npm' if modules.exists() else 'none',
            'inventorySha256': digest(encoded(entries)), 'entries': len(entries), 'locks': locks}



def hash_file(path):
    h = hashlib.sha256()
    with Path(path).open('rb') as stream:
        for chunk in iter(lambda: stream.read(1024 * 1024), b''):
            h.update(chunk)
    return h.hexdigest()


def toolchain_identity(command):
    result = {'pythonVersion': sys.version, 'pythonExecutable': str(Path(sys.executable).resolve())}
    for label, executable in [('command', command[0]), ('node', shutil.which('node')),
                              ('pnpm', shutil.which('pnpm'))]:
        candidate = shutil.which(executable) if executable else None
        if not candidate:
            continue
        path = Path(candidate).resolve(strict=True)
        result[label] = {'path': str(path), 'sha256': hash_file(path)}
        if label in ('node', 'pnpm'):
            result[label]['version'] = subprocess.check_output([str(path), '--version'], text=True).strip()
    return result


class OwnedEvidence:
    """Keep new outputs open; never reopen a child-controlled path for writing/hash."""
    def __init__(self, receipt):
        self.receipt = Path(os.path.abspath(receipt))
        self.stack = ExitStack()
        self.parents = []
        self.files = {}

    @staticmethod
    def identity(info):
        return info.st_dev, info.st_ino

    def __enter__(self):
        try:
            # Open every ancestor relative to its pinned parent, without following links.
            flags = os.O_RDONLY | os.O_DIRECTORY | os.O_NOFOLLOW
            parent = os.open(self.receipt.anchor, flags)
            self.stack.callback(os.close, parent)
            for name in self.receipt.parent.parts[1:]:
                child = os.open(name, flags, dir_fd=parent)
                self.stack.callback(os.close, child)
                self.parents.append((parent, name, child, self.identity(os.fstat(child))))
                parent = child
            self.directory = parent
            for name, suffix in (('receipt', ''), ('stdout', '.stdout'), ('stderr', '.stderr')):
                leaf = self.receipt.name + suffix
                fd = os.open(leaf, os.O_RDWR | os.O_CREAT | os.O_EXCL | os.O_NOFOLLOW,
                             0o666, dir_fd=self.directory)
                stream = self.stack.enter_context(os.fdopen(fd, 'w+b'))
                self.files[name] = (leaf, stream, self.identity(os.fstat(fd)))
            self.validate()
            return self
        except BaseException:
            self.stack.close()
            raise

    def __exit__(self, *args):
        return self.stack.__exit__(*args)

    def validate(self):
        for parent, name, child, identity in self.parents:
            current = os.stat(name, dir_fd=parent, follow_symlinks=False)
            require(stat.S_ISDIR(current.st_mode) and self.identity(current) == identity and
                    self.identity(os.fstat(child)) == identity, 'Evidence parent changed during execution')
        for name, (leaf, stream, identity) in self.files.items():
            held = os.fstat(stream.fileno())
            current = os.stat(leaf, dir_fd=self.directory, follow_symlinks=False)
            require(stat.S_ISREG(held.st_mode) and stat.S_ISREG(current.st_mode) and
                    held.st_nlink == current.st_nlink == 1 and
                    self.identity(held) == self.identity(current) == identity,
                    f'Evidence {name} identity/link changed during execution')

    def stream(self, name):
        return self.files[name][1]

    def write_receipt(self, payload):
        self.validate()
        stream = self.stream('receipt')
        stream.seek(0)
        stream.write(encoded(payload))
        stream.truncate()
        stream.flush()
        self.validate()

    def logs(self):
        self.validate()
        result = {}
        for name in ('stdout', 'stderr'):
            leaf, stream, _ = self.files[name]
            stream.seek(0)
            h = hashlib.sha256()
            for chunk in iter(lambda: stream.read(1024 * 1024), b''):
                h.update(chunk)
            result[name] = {'path': str(self.receipt.parent / leaf), 'sha256': h.hexdigest()}
        self.validate()
        return result


def execute_locked(source, revision, pool, runtime, receipt, command):
    require(command, 'A command is required')
    before = verify(source, revision, pool, runtime)
    dependencies = dependency_identity(runtime)
    payload = {'version': 1, 'kind': 'shared-runtime-command', 'status': 'unknown',
               'sourceBefore': before, 'dependenciesBefore': dependencies, 'command': command,
               'startedAt': time.time(), 'toolchain': toolchain_identity(command),
               'resourceEnvironment': {k: os.environ.get(k) for k in ('NODE_OPTIONS', 'PND_TEST_CONCURRENCY',
                 'ROLLDOWN_WORKER_THREADS', 'RAYON_NUM_THREADS', 'ROLLDOWN_MAX_BLOCKING_THREADS')}}
    env = dict(os.environ)
    # Only the verifier-owned wrapper grants this configuration path. revision command
    # independently rechecks Git, every runtime source and all external asset bytes.
    env.update({'PND_RUNTIME_SOURCE': before['source'], 'PND_RUNTIME_REVISION': revision,
                'PND_RUNTIME_POOL': before['pool'], 'PND_RUNTIME_ROOT': before['runtime']})
    with OwnedEvidence(receipt) as evidence:
        evidence.write_receipt(payload)
        result = subprocess.run(command, cwd=before['runtime'], env=env,
                                stdout=evidence.stream('stdout'), stderr=evidence.stream('stderr'))
        # Tampered output paths cannot receive a terminal receipt, even on exit zero.
        evidence.validate()
        payload.update({'exitCode': result.returncode, 'finishedAt': time.time()})
        try:
            payload['sourceAfter'] = verify(source, revision, pool, runtime)
            payload['dependenciesAfter'] = dependency_identity(runtime)
            require(payload['sourceAfter'] == before and payload['dependenciesAfter'] == dependencies,
                    'Source/assets/dependencies changed during command')
            payload['status'] = 'passed' if result.returncode == 0 else 'failed'
        except (ValueError, OSError, subprocess.CalledProcessError) as error:
            payload.update({'status': 'invalidated', 'error': str(error)})
        payload['logs'] = evidence.logs()
        evidence.write_receipt(payload)
    return payload



def execute(source, revision, pool, runtime, receipt, command):
    root = physical(runtime)
    work = root / 'work'
    if work.exists() or work.is_symlink():
        physical(work)
    else:
        work.mkdir()
    lock = work / '.shared-runtime-run-lock'
    lock.mkdir()  # One writer/run per runtime. Unknown abandoned locks are preserved.
    try:
        return execute_locked(source, revision, pool, runtime, receipt, command)
    finally:
        lock.rmdir()


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('action', choices=['prepare', 'verify', 'run', 'revision'])
    parser.add_argument('--source', required=True)
    parser.add_argument('--revision', required=True)
    parser.add_argument('--pool', required=True)
    parser.add_argument('--runtime', required=True)
    parser.add_argument('--reserve-bytes', type=int, default=0)
    parser.add_argument('--scope', choices=['build', 'full'], default='build')
    parser.add_argument('--receipt')
    args, command = parser.parse_known_args()
    if command and command[0] == '--':
        command = command[1:]
    if args.action == 'prepare':
        require(not command, 'Unexpected prepare arguments')
        result = prepare(args.source, args.revision, args.pool, args.runtime, args.reserve_bytes, args.scope)
    elif args.action == 'run':
        require(args.receipt, 'A new receipt path is required')
        result = execute(args.source, args.revision, args.pool, args.runtime, args.receipt, command)
    else:
        require(not command, 'Unexpected verification arguments')
        result = verify(args.source, args.revision, args.pool, args.runtime)
        if args.action == 'revision':
            print(result['revision'])
            return
    print(json.dumps(result, indent=2))
    if result['status'] not in ('verified', 'passed'):
        sys.exit(1)


if __name__ == '__main__':
    try:
        main()
    except (ValueError, OSError, subprocess.CalledProcessError) as error:
        print(f'Shared runtime refused: {error}', file=sys.stderr)
        sys.exit(2)
