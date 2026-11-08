#!/usr/bin/env python3
"""Read-only admission and measured reuse for an explicitly located pnpm store.

No installation, asset preparation, cleanup, source edits or pnpm execution.
Run the documented frozen install separately in the serialized resource lane.
"""
import argparse
import hashlib
import json
import os
from pathlib import Path
import re
import stat
import subprocess
import sys

# Importing this helper must not allocate a __pycache__ in a source-only view.
sys.dont_write_bytecode = True
from shared_runtime import dependency_identity, digest, physical, require, within

MANAGER = 'pnpm@11.25.0'
METADATA = ('package.json', 'package-lock.json', 'pnpm-lock.yaml', 'pnpm-workspace.yaml')


def run_git(source, *args):
    env = {**os.environ, 'GIT_NO_LAZY_FETCH': '1', 'GIT_OPTIONAL_LOCKS': '0',
           'GIT_NO_REPLACE_OBJECTS': '1'}
    return subprocess.check_output(['git', '-C', str(source), *args],
                                   stderr=subprocess.PIPE, env=env)


def regular(path, private=False):
    physical(path.parent)
    info = path.lstat()
    require(stat.S_ISREG(info.st_mode), f'Expected regular file: {path}')
    require(not private or info.st_nlink == 1, f'Expected private metadata: {path}')
    return info


def file_key(info):
    return (info.st_dev, info.st_ino, info.st_size, info.st_mtime_ns, info.st_ctime_ns,
            info.st_mode, info.st_nlink)


def read_metadata(path):
    before = regular(path, private=True)
    data = path.read_bytes()
    require(file_key(before) == file_key(regular(path, private=True)),
            f'Metadata changed while reading: {path}')
    return data, file_key(before)


def source_identity(source, revision):
    source = physical(source)
    require(re.fullmatch('[0-9a-f]{40}', revision or ''), 'An exact revision is required')
    require(run_git(source, 'rev-parse', 'HEAD').decode().strip() == revision,
            'Source HEAD differs from requested revision')
    require(Path(run_git(source, 'rev-parse', '--show-toplevel').decode().strip()) == source,
            'Source must name the Git worktree root')
    identities, keys = {}, {}
    for name in METADATA:
        path = source / name
        data, keys[path] = read_metadata(path)
        require(data == run_git(source, 'show', f'{revision}:{name}'),
                f'Dependency metadata differs from committed revision: {name}')
        identities[name] = digest(data)
    require(json.loads(read_metadata(source / 'package.json')[0])['packageManager'] == MANAGER,
            f'Only {MANAGER} is supported')
    for path, key in keys.items():
        require(key == file_key(regular(path, private=True)), f'Source metadata changed: {path}')
    require(run_git(source, 'rev-parse', 'HEAD').decode().strip() == revision,
            'Source HEAD changed during metadata check')
    return {'scope': 'dependency-metadata-only', 'source': str(source), 'revision': revision,
            'metadataSha256': identities,
            'worktreeStatus': run_git(source, '--no-optional-locks', 'status', '--porcelain', '--untracked-files=all').decode(),
            'dependenciesAllocated': False, 'assetsAllocated': False}


def existing_parent(path):
    physical(path, absent=True)
    while not path.exists():
        path = path.parent
    return path


def filesystem_type(path):
    """Linux mount evidence only; unknown elsewhere is not a disk-backed claim."""
    mounts = Path('/proc/self/mountinfo')
    if not mounts.is_file():
        return 'unknown'
    choices = []
    for line in mounts.read_text().splitlines():
        fields = line.split()
        mount = Path(re.sub(r'\\([0-7]{3})', lambda m: chr(int(m[1], 8)), fields[4]))
        if within(mount, path):
            choices.append((len(mount.parts), fields[fields.index('-') + 1]))
    return max(choices)[1] if choices else 'unknown'


def registered_worktrees(source):
    """Read every registered root, including locked/prunable entries; never prune."""
    output = run_git(source, 'worktree', 'list', '--porcelain', '-z')
    roots = []
    for field in output.split(b'\0'):
        if field.startswith(b'worktree '):
            path = Path(os.fsdecode(field[len(b'worktree '):]))
            require(path.is_absolute(), 'Registered worktree root must be absolute')
            roots.append(physical(path))
    require(source in roots, 'Source is absent from registered worktree inventory')
    return tuple(roots)


def storage_plan(source, shared_root, reserve_bytes, allocation_bytes, *, post_install=False):
    source = physical(source)
    require(shared_root and Path(shared_root).is_absolute(),
            'Choose an absolute PND_SHARED_ROOT (or --shared-root) explicitly')
    require(str(shared_root) == os.path.normpath(shared_root) and
            '..' not in Path(shared_root).parts,
            'Shared root must be normalized without dot or parent components')
    shared = Path(os.path.abspath(shared_root))
    require(not within(source, shared) and not within(shared, source),
            'Source and shared root must be separate, nonnested directories')
    worktrees = registered_worktrees(source)
    require(all(not within(root, shared) and not within(shared, root) for root in worktrees),
            'Shared root must be separate from every registered Git worktree')
    require(reserve_bytes > 0 and (allocation_bytes == 0 if post_install else allocation_bytes > 0),
            'A positive reserve and positive plan allocation (zero for postcheck) are required')
    store = shared / 'pnpm-store' / 'v11'
    cache = shared / 'pnpm-cache'
    parents = [existing_parent(path) for path in (source, shared, store, cache)]
    device = source.stat().st_dev
    require(all(p.stat().st_dev == device for p in parents),
            'Source, actual store and cache need the same filesystem')
    kinds = {filesystem_type(p) for p in parents}
    require(not kinds.intersection(('tmpfs', 'ramfs')), 'Shared storage must not be RAM-backed')
    kind = filesystem_type(parents[1])
    spaces = [os.statvfs(p) for p in parents]
    available = min(s.f_bavail * s.f_frsize for s in spaces)
    require(available >= allocation_bytes + reserve_bytes,
            'Insufficient capacity for allocation budget plus unchanged reserve')
    require(worktrees == registered_worktrees(source),
            'Registered worktree inventory changed during storage admission')
    return {'source': str(source), 'sharedRoot': str(shared), 'store': str(store),
            'cache': str(cache), 'device': device, 'filesystemType': kind,
            'availableBytes': available, 'allocationBudgetBytes': allocation_bytes,
            'reserveBytes': reserve_bytes, 'allocates': False,
            'limits': 'Capacity snapshot, not a reservation, quota, persistence or memory guarantee'}


def stable_hash(path):
    """Stream once, rejecting leaf replacement or mutation during the read."""
    before = regular(path)
    fd = os.open(path, os.O_RDONLY | getattr(os, 'O_NOFOLLOW', 0) | getattr(os, 'O_NONBLOCK', 0))
    try:
        require(file_key(before) == file_key(os.fstat(fd)), f'File changed before hashing: {path}')
        h = hashlib.sha512()
        with os.fdopen(fd, 'rb', closefd=False) as stream:
            for block in iter(lambda: stream.read(1024 * 1024), b''):
                h.update(block)
        require(file_key(before) == file_key(os.fstat(fd)) == file_key(path.lstat()),
                f'File changed while hashing: {path}')
    finally:
        os.close(fd)
    return before, h.hexdigest()


def package_file(relative):
    parts = relative.parts
    # .pnpm/node_modules is the graph; .bin and lock/metadata files are private.
    return (len(parts) >= 5 and parts[0] == '.pnpm' and parts[1] != 'node_modules'
            and parts[2] == 'node_modules' and not parts[3].startswith('.'))


def verify_install(source, store):
    source, store = physical(source), physical(store)
    modules = physical(source / 'node_modules')
    virtual = physical(modules / '.pnpm')
    physical(store / 'files')
    require(source.stat().st_dev == store.stat().st_dev == modules.stat().st_dev,
            'Installed dependencies and active store need the same filesystem')
    require(not (modules / '.package-lock.json').exists(), 'Mixed npm/pnpm installation')
    manifest = modules / '.modules.yaml'
    manifest_bytes, manifest_key = read_metadata(manifest)
    # Pinned pnpm 11.25 writes JSON here despite the historical .yaml suffix.
    # Older YAML profiles are intentionally unsupported, never silently adopted.
    metadata = json.loads(manifest_bytes)
    require(metadata.get('packageManager') == MANAGER and metadata.get('nodeLinker') == 'isolated',
            'Unsupported pnpm installation metadata')
    require(metadata.get('storeDir') == str(store), 'Installation names a different active store')
    require(metadata.get('virtualStoreDir') in ('.pnpm', str(virtual)),
            'Installation does not use its private virtual store')
    desired, installed = source / 'pnpm-lock.yaml', virtual / 'lock.yaml'
    desired_bytes, desired_key = read_metadata(desired)
    installed_bytes, installed_key = read_metadata(installed)
    require(desired_bytes == installed_bytes, 'Desired and installed locks differ')
    leaves = {manifest: manifest_key, desired: desired_key, installed: installed_key}
    directories = {}
    def pin_parents(path):
        for parent in (path.parent, *path.parents):
            if parent in directories:
                continue
            physical(parent)
            info = parent.stat()
            directories[parent] = (info.st_dev, info.st_ino, info.st_mode)
    for root in (source, modules, virtual, store, store / 'files'):
        pin_parents(root / 'unused')
    before = dependency_identity(source)
    require(before['locks'].get('node_modules/.modules.yaml') == digest(manifest_bytes) and
            before['locks'].get('node_modules/.pnpm/lock.yaml') == digest(installed_bytes) and
            before['locks'].get('pnpm-lock.yaml') == digest(desired_bytes),
            'Validated metadata changed before dependency inventory')
    counts = dict(packageFiles=0, packageBytes=0, sharedFiles=0, sharedBytes=0,
                  nonSharedFiles=0, nonSharedBytes=0, foreignHardlinkFiles=0)
    unique = {}
    for root, dirs, files in os.walk(modules, followlinks=False):
        if Path(root) == modules:
            dirs[:] = [d for d in dirs if d not in ('.vite', '.vite-temp', '.cache')]
        for name in files:
            path = Path(root) / name
            if path.is_symlink():
                continue  # dependency_identity checked its contained target.
            info = regular(path)
            if not package_file(path.relative_to(modules)):
                require(info.st_nlink == 1, f'Mutable metadata or wrapper must be private: {path}')
                continue
            info, sha512 = stable_hash(path)
            leaves[path] = file_key(info)
            pin_parents(path)
            content = store / 'files' / sha512[:2] / (sha512[2:] + ('-exec' if info.st_mode & 0o111 else ''))
            shared = False
            physical(content.parent, absent=True)
            if content.exists() or content.is_symlink():
                content_info = regular(content)
                leaves[content] = file_key(content_info)
                pin_parents(content)
                shared = (info.st_dev, info.st_ino) == (content_info.st_dev, content_info.st_ino)
                if shared:
                    require(info.st_size == content_info.st_size and info.st_mode == content_info.st_mode,
                            'Shared content changed during verification')
                    unique[(info.st_dev, info.st_ino)] = info.st_size
            counts['packageFiles'] += 1
            counts['packageBytes'] += info.st_size
            category = 'shared' if shared else 'nonShared'
            counts[category + 'Files'] += 1
            counts[category + 'Bytes'] += info.st_size
            if not shared and info.st_nlink > 1:
                counts['foreignHardlinkFiles'] += 1
    require(counts['packageFiles'] > 0, 'No installed package files found')
    require(before == dependency_identity(source), 'Dependency bytes changed during reuse audit')
    for path, key in directories.items():
        physical(path)
        info = path.stat()
        require(key == (info.st_dev, info.st_ino, info.st_mode), f'Directory changed during reuse audit: {path}')
    for path, key in leaves.items():
        require(key == file_key(regular(path)), f'File identity changed during reuse audit: {path}')
    return {'status': 'verified', **counts, 'uniqueSharedBytes': sum(unique.values()),
            'coverageBytes': counts['sharedBytes'] / counts['packageBytes'] if counts['packageBytes'] else 0,
            'dependencyIdentity': before, 'installedLockSha256': digest(installed_bytes),
            'modulesMetadataSha256': digest(manifest_bytes),
            'scope': 'Present inode sharing, not dependency compatibility, allocated savings or RAM proof'}


def main(argv=None):
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('command', nargs='?', choices=('source', 'plan', 'check'), default='source')
    parser.add_argument('--source', default='.')
    parser.add_argument('--revision', required=True)
    parser.add_argument('--shared-root', default=os.environ.get('PND_SHARED_ROOT'))
    parser.add_argument('--reserve-bytes', type=int, default=0)
    parser.add_argument('--allocation-bytes', type=int, default=0)
    args = parser.parse_args(argv)
    result = {'sourceIdentity': source_identity(args.source, args.revision)}
    if args.command != 'source':
        plan = storage_plan(args.source, args.shared_root, args.reserve_bytes, args.allocation_bytes,
                            post_install=args.command == 'check')
        result['storage'] = plan
        if args.command == 'check':
            result['installation'] = verify_install(Path(plan['source']), Path(plan['store']))
        require(result['sourceIdentity'] == source_identity(args.source, args.revision),
                'Source metadata or worktree status changed during the check')
    print(json.dumps(result, indent=2, sort_keys=True))
    return result


if __name__ == '__main__':
    try:
        main()
    except (ValueError, OSError, KeyError, subprocess.CalledProcessError) as error:
        print(f'shared setup: {error}', file=sys.stderr)
        sys.exit(1)
