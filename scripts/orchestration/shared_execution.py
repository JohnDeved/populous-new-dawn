#!/usr/bin/env python3
"""Bound Linux execution around unchanged shared_setup/shared_runtime helpers.

Planning is read-only. Preparation runs bare, pinned pnpm once in a private
metadata projection. Running requires an independently accepted state receipt.
No installation, source provisioning, timestamp manufacture, repair or adoption.
A separate generated-sentinel qualification exercises this exact Linux backend;
its receipt is evidence, not permission to execute an application workload.
"""
from contextlib import contextmanager
from dataclasses import asdict, dataclass, replace
import argparse
import collections
import hashlib
import json
import math
import os
from pathlib import Path
import re
import selectors
import signal
import stat
import subprocess
import sys
import threading
import time

sys.dont_write_bytecode = True
sys.path.insert(0, str(Path(__file__).resolve().parent))
import shared_runtime as runtime
import shared_setup as setup
import shared_workspace as workspace

from state_serialization import (
    decode as decode_state,
    profile as state_serialization_profile,
    expected_after as expected_state_after,
)

VERSION = 1
STATE = '.pnpm-workspace-state-v1.json'
CACHES = ('.vite', '.vite-temp', '.cache')
PRIVATE_LEAVES = ('control', 'receipt', 'home', 'tmp', 'xdg-cache', 'xdg-config',
                  'xdg-state', 'xdg-data', 'pnpm-cache', 'shm', 'module-vite',
                  'module-vite-temp', 'module-cache')
OUTPUT_LEAVES = ('work', 'dist', '.wrangler', '.next', '.vinext', '.fallow')
CAPABILITIES = ('readonly-aliases', 'private-state-rename', 'frozen-state',
                'namespace-binding', 'escaped-descendant-cleanup', 'raw-cap',
                'producer-clock', 'observer-failure-cleanup', 'terminal-seal')
CAP_FIELDS = ('CapInh', 'CapPrm', 'CapEff', 'CapBnd', 'CapAmb')
QUALIFIER_OBSERVER_FAULT = 'shared-execution-qualifier-procfs-v1'
QUALIFIER_MAX_VISIBLE_PIDS = 32
HERE = Path(__file__).resolve().parent
require = runtime.require
encoded = runtime.encoded


class QualificationObservationFault(RuntimeError):
    """Exact internal fault type used only by the generated qualifier."""


class OwnedIdentityComparisonFault(ValueError):
    """Bounded comparison evidence; an ancestry mismatch remains fatal."""
    def __init__(self, census, enriched):
        super().__init__('Owned identity/ancestry changed during observation')
        fields = ('pid', 'startTicks', 'ppid')
        def bounded(value):
            return value if type(value) is int and 0 <= value < 2**64 else None
        self.comparison = {
            'kind': 'owned-identity-ancestry-comparison', 'version': 1,
            'census': {key: bounded(census[key]) for key in fields},
            'enriched': {key: bounded(enriched[key]) for key in fields},
            'differentFields': [key for key in fields if census[key] != enriched[key]],
        }


def failure_record(error):
    record = {'type': type(error).__name__, 'message': str(error),
              'injectedFault': QUALIFIER_OBSERVER_FAULT if type(error) is QualificationObservationFault else None}
    if type(error) is OwnedIdentityComparisonFault:
        record['comparison'] = error.comparison
    return record


def require_qualifier_observer_failure(result):
    """An arbitrary process, observer or cleanup error cannot qualify this case."""
    failure = result.get('failure')
    require(isinstance(failure, dict) and failure.get('type') == QualificationObservationFault.__name__ and
            failure.get('injectedFault') == QUALIFIER_OBSERVER_FAULT and result.get('stopReason') is not None,
            'Qualifier did not encounter the exact injected observation fault')
    cleanup = result.get('cleanupFailure')
    require(cleanup is None or (cleanup.get('type') == QualificationObservationFault.__name__ and
            cleanup.get('injectedFault') == QUALIFIER_OBSERVER_FAULT), 'Unrelated cleanup failure cannot qualify')
    require(result.get('survivors') is None, 'Persistent fault payload must retain unknown cleanup observation')
    # Do not alter the failed payload. A fresh independent observation is required by the caller.



@dataclass(frozen=True)
class Limits:
    owner_rss_bytes: int = 3 * 1024**3
    v8_mib: int = 1536
    producer_seconds: int = 300
    envelope_seconds: int = 600
    raw_bytes: int = 32 * 1024**2
    outer_raw_bytes: int = 1024**2
    evidence_bytes: int = 128 * 1024**2
    allocation_bytes: int = 1024**3
    reserve_bytes: int = 2 * 1024**3
    available_memory_bytes: int = 3840 * 1024**2
    free_inodes: int = 32768
    cleanup_seconds: int = 5
    sample_seconds: float = 0.1

    def __post_init__(self):
        for name, value in asdict(self).items():
            require(type(value) in (int, float) and math.isfinite(value) and value > 0,
                    'Invalid positive resource limit: ' + name)
            if name != 'sample_seconds':
                require(type(value) is int, 'Integer resource limit required: ' + name)
        require(self.raw_bytes > self.outer_raw_bytes, 'No inner raw capture allowance')
        require(self.producer_seconds < self.envelope_seconds, 'No postcheck envelope')
        require(self.sample_seconds <= 1, 'Observer interval exceeds one second')

    @property
    def inner_raw_bytes(self):
        return self.raw_bytes - self.outer_raw_bytes


BUILD_LIMITS = Limits()
SUPPORTED_WORKSPACE = b"packages:\n  - '.'\nnodeLinker: isolated\nvirtualStoreDir: node_modules/.pnpm\nenableGlobalVirtualStore: false\npackageImportMethod: hardlink\nverifyStoreIntegrity: true\nignoreScripts: true\nsideEffectsCache: false\npublicHoistPattern:\n  - playwright-core\n  - js-yaml\n  - sharp\n  - oxfmt\n  - oxlint\nverifyDepsBeforeRun: error\n"


def exact_path(value):
    require(isinstance(value, str) and Path(value).is_absolute() and
            str(Path(value)) == value and os.path.normpath(value) == value and not value.startswith('//') and
            '..' not in Path(value).parts and value != '/', 'Normalized non-root absolute path required')
    return Path(value)


def sha_bytes(data):
    return hashlib.sha256(data).hexdigest()


def inode_key(info):
    """No atime: reading inputs is allowed. mtime/ctime/nlink are not discarded."""
    return [info.st_dev, info.st_ino, info.st_mode, info.st_size, info.st_mtime_ns,
            info.st_ctime_ns, info.st_nlink, info.st_uid, info.st_gid]


def file_identity(path, *, private=False):
    path = Path(path)
    runtime.physical(path.parent)
    before = path.lstat()
    require(stat.S_ISREG(before.st_mode), 'Nonregular input: ' + str(path))
    require(not private or before.st_nlink == 1, 'Nonprivate file: ' + str(path))
    fd = os.open(path, os.O_RDONLY | os.O_NOFOLLOW | os.O_NONBLOCK)
    try:
        require(inode_key(os.fstat(fd)) == inode_key(before), 'File replaced before read')
        h = hashlib.sha256()
        with os.fdopen(fd, 'rb', closefd=False) as stream:
            for data in iter(lambda: stream.read(1024 * 1024), b''):
                h.update(data)
        require(inode_key(os.fstat(fd)) == inode_key(before) == inode_key(path.lstat()),
                'File changed during read: ' + str(path))
        return {'key': inode_key(before), 'sha256': h.hexdigest()}
    finally:
        os.close(fd)


def pinned_json(reference):
    require(set(reference) == {'path', 'sha256'}, 'Expected exact pinned JSON reference')
    path = exact_path(reference['path'])
    require(re.fullmatch('[a-f0-9]{64}', reference['sha256'] or ''), 'SHA-256 required')
    identity = file_identity(path, private=True)
    require(identity['key'][3] <= 32 * 1024**2, 'Pinned JSON exceeds metadata budget')
    data = path.read_bytes()
    require(sha_bytes(data) == reference['sha256'] == identity['sha256'] and
            file_identity(path, private=True) == identity, 'Pinned JSON changed')
    return json.loads(data)


def save_new(path, value):
    data = encoded(value)
    require(len(data) <= 16 * 1024**2, 'Receipt exceeds metadata budget')
    with Path(path).open('xb') as stream:
        stream.write(data)
    return sha_bytes(data)


def tree_inventory(root, *, ignore_caches=False):
    """Exact path/type/full-key/hash inventory, never following symlink directories."""
    root = exact_path(str(root))
    runtime.physical(root.parent)
    entries = []
    def visit(path, relative):
        info = path.lstat()
        row = {'path': relative, 'key': inode_key(info)}
        if stat.S_ISREG(info.st_mode):
            row.update(kind='file', **file_identity(path))
        elif stat.S_ISLNK(info.st_mode):
            row.update(kind='link', target=os.readlink(path))
            require(inode_key(path.lstat()) == row['key'], 'Symlink changed during inventory')
        else:
            require(stat.S_ISDIR(info.st_mode), 'Special input entry: ' + str(path))
            row['kind'] = 'directory'
        entries.append(row)
        if row['kind'] == 'directory':
            names = sorted(os.listdir(path))
            for name in names:
                if relative == '.' and ignore_caches and name in CACHES:
                    continue
                visit(path / name, name if relative == '.' else relative + '/' + name)
            require(sorted(os.listdir(path)) == names and inode_key(path.lstat()) == row['key'],
                    'Directory changed during inventory: ' + str(path))
    visit(root, '.')
    return entries


def inventory_hash(root, *, ignore_caches=False):
    return sha_bytes(encoded(tree_inventory(root, ignore_caches=ignore_caches)))


def private_inventory(root, *, allowed_links=None):
    """No production sentinel/hardlink exemption. Only exact private root symlinks."""
    rows = tree_inventory(root)
    allowed_links = allowed_links or {}
    found = {}
    for row in rows:
        require(row['key'][7] == os.getuid(), 'Private entry has a different owner')
        if row['kind'] == 'link':
            require(row['key'][6] == 1, 'Private symlink is hardlinked')
            found[row['path']] = row['target']
        elif row['kind'] == 'file':
            require(row['key'][6] == 1, 'Private mutable file is hardlinked: ' + row['path'])
    require(found == allowed_links, 'Unexpected private symlink or missing expected link')
    return rows


def union_allocation(roots, *, sampled=False):
    """Transient disappearance is expected only in live private-output sampling.

    Permission/I/O errors and root replacement always fail. Terminal walks remain
    strict after owned writers stop. Sampled allocation is not a filesystem quota.
    """
    seen = {}
    def walk_error(error):
        if not sampled or not isinstance(error, FileNotFoundError):
            raise error
    for root in roots:
        root = Path(root)
        initial = root.lstat()
        require(stat.S_ISDIR(initial.st_mode), 'Allocation root is not a physical directory')
        for base, dirs, files in os.walk(root, followlinks=False, onerror=walk_error):
            for path in [Path(base), *(Path(base) / name for name in dirs + files)]:
                try:
                    info = path.lstat()
                except FileNotFoundError:
                    if sampled:
                        continue
                    raise
                seen[info.st_dev, info.st_ino] = info.st_blocks * 512
        final = root.lstat()
        require((initial.st_dev, initial.st_ino, initial.st_mode) ==
                (final.st_dev, final.st_ino, final.st_mode), 'Allocation root changed')
    return sum(seen.values())


def allocation_usage(evidence, *, sampled=False):
    total = union_allocation([evidence], sampled=sampled)
    output = evidence / 'launch-root'
    output_bytes = union_allocation([output], sampled=sampled) if output.exists() else 0
    # Separate sampled walks can race with private writes; never claim negative evidence.
    return {'allocatedBytes': total, 'evidenceBytes': max(0, total - output_bytes)}


def host_snapshot(root):
    space = os.statvfs(root)
    memory = {}
    for line in Path('/proc/meminfo').read_text().splitlines():
        name, value = line.split(':', 1)
        if name in ('MemAvailable', 'SwapTotal', 'SwapFree', 'Shmem'):
            memory[name] = int(value.split()[0]) * 1024
    require('MemAvailable' in memory, 'Missing memory observation')
    return {'availableBytes': space.f_bavail * space.f_frsize,
            'freeInodes': space.f_favail, **memory}


def assert_capacity(snapshot, limits, *, admission=False):
    require(snapshot['availableBytes'] >= limits.reserve_bytes +
            (limits.allocation_bytes if admission else 0), 'Disk reserve not available')
    require(snapshot['freeInodes'] >= limits.free_inodes, 'Inode reserve not available')
    require(snapshot['MemAvailable'] >= limits.available_memory_bytes, 'Memory floor not available')


def validate_alias_transition(before, after, aliases):
    """Explain intentional new links, never erase unexpected Git mtime/ctime drift.

    before/after are path -> file_identity; aliases explicitly map each new path
    to an existing path. Every new alias and aggregate per-inode nlink delta must
    match. This predicate does not create links or authorize a transition.
    """
    require(set(after) == set(before) | set(aliases), 'Unexpected alias path set')
    require(not set(before).intersection(aliases), 'Alias overwrites an existing path')
    deltas = collections.Counter()
    for alias, original in aliases.items():
        require(original in before, 'Unknown alias original')
        deltas[tuple(before[original]['key'][:2])] += 1
        require(after[alias] == after[original], 'Alias is not the same exact inode')
    for name, old in before.items():
        new = after[name]
        delta = deltas[tuple(old['key'][:2])]
        require(old['sha256'] == new['sha256'], 'Alias transition changed bytes')
        expected = list(old['key'])
        expected[6] += delta
        if delta:
            require(new['key'][5] >= old['key'][5], 'Alias ctime moved backwards')
            expected[5] = new['key'][5]
        require(new['key'] == expected, 'Unapproved inode/mtime/mode/owner transition: ' + name)
    return {'newAliases': len(aliases), 'uniqueChangedInodes': len(deltas)}


def validate_state_transition(before, after, start_ms, end_ms, mtime_floor_ms):
    old, new = decode_state(before), decode_state(after)
    a, b = old.get('lastValidatedTimestamp'), new.get('lastValidatedTimestamp')
    require(type(a) is int and type(b) is int, 'Integer validation timestamps required')
    require(type(start_ms) is int and type(end_ms) is int and start_ms <= end_ms,
            'Invalid observed realtime interval')
    require(a < b and start_ms <= b <= end_ms and b > mtime_floor_ms,
            'State timestamp is stale, forged or outside the actual command interval')
    expected = dict(old)
    expected['lastValidatedTimestamp'] = b
    require(new == expected, 'Unexpected state JSON transition')
    expected_bytes, serialization = expected_state_after(before, expected)
    require(after == expected_bytes, 'Unexpected state byte/whitespace transition')
    return {'field': 'lastValidatedTimestamp', 'before': a, 'after': b, 'serializationProfile': serialization,
            'commandRealtimeMs': [start_ms, end_ms], 'inputMtimeFloorMs': mtime_floor_ms,
            'beforeSha256': sha_bytes(before), 'afterSha256': sha_bytes(after)}


def dependency_rows(root):
    """Expose rows solely to explain a transition, not to replace strict identity."""
    rows = []
    for relative, path in sorted(runtime.file_inventory(Path(root) / 'node_modules').items()):
        if relative in CACHES or relative.startswith(tuple(name + '/' for name in CACHES)):
            continue
        info = path.lstat()
        if stat.S_ISLNK(info.st_mode):
            rows.append([relative, 'link', os.readlink(path)])
        elif stat.S_ISREG(info.st_mode):
            rows.append([relative, 'file', info.st_size, info.st_mode & 0o111,
                         file_identity(path)['sha256']])
        else:
            require(stat.S_ISDIR(info.st_mode), 'Special dependency entry')
            rows.append([relative, 'dir', stat.S_IMODE(info.st_mode)])
    identity = runtime.dependency_identity(root)
    require(identity['inventorySha256'] == sha_bytes(encoded(rows)),
            'Strict helper dependency inventory differs from explanatory rows')
    return identity, rows


def projected_identity(canonical, rows, state_bytes):
    matches = [row for row in rows if row[0] == STATE]
    require(len(matches) == 1 and matches[0][1] == 'file' and matches[0][3] == 0,
            'Expected one non-executable canonical state row')
    require(canonical['inventorySha256'] == sha_bytes(encoded(rows)) and canonical['entries'] == len(rows),
            'Canonical rows are not the strict full inventory')
    changed = [[STATE, 'file', len(state_bytes), 0, sha_bytes(state_bytes)] if row[0] == STATE else row
               for row in rows]
    return {**canonical, 'inventorySha256': sha_bytes(encoded(changed))}


def module_shape(modules):
    runtime.physical(modules)
    rows = []
    for path in sorted(modules.iterdir()):
        info = path.lstat()
        kind = 'link' if stat.S_ISLNK(info.st_mode) else 'directory' if stat.S_ISDIR(info.st_mode) else 'file'
        require(kind != 'file' or stat.S_ISREG(info.st_mode), 'Special module-root entry')
        link = os.readlink(path) if kind == 'link' else None
        if link is not None:
            require(not Path(link).is_absolute() and path.resolve(strict=True).is_relative_to(modules),
                    'Module root symlink escapes private virtual store')
        rows.append({'name': path.name, 'kind': kind, 'mode': stat.S_IMODE(info.st_mode), 'link': link})
    require(any(row['name'] == STATE and row['kind'] == 'file' for row in rows), 'Missing private pnpm state')
    require(any(row['name'] == '.pnpm' and row['kind'] == 'directory' for row in rows),
            'Physical private .pnpm required')
    return rows


def create_state_projection(modules, target):
    """Only a state copy and empty mountpoints, no package files or linked sentinels."""
    require(not os.path.lexists(target), 'State projection already exists; no adoption')
    shape = module_shape(modules)
    target.mkdir(mode=stat.S_IMODE(modules.stat().st_mode))
    os.chmod(target, stat.S_IMODE(modules.stat().st_mode))
    for row in shape:
        path = target / row['name']
        if row['kind'] == 'directory':
            path.mkdir(mode=row['mode'])
        elif row['kind'] == 'link':
            path.symlink_to(row['link'])
            continue
        else:
            with path.open('xb') as stream:
                if row['name'] == STATE:
                    stream.write((modules / STATE).read_bytes())
        os.chmod(path, row['mode'])  # All paths are new private nodes, never shared originals.
    return shape


def validate_private_projection(target, shape):
    rows = private_inventory(target, allowed_links={row['name']: row['link'] for row in shape if row['kind'] == 'link'})
    require({row['path'] for row in rows} == {'.', *(row['name'] for row in shape)},
            'Unexpected file retained in private state projection')
    for row in shape:
        path = target / row['name']
        info = path.lstat()
        require(stat.S_IMODE(info.st_mode) == row['mode'], 'Module-root mode changed')
        if row['kind'] == 'file' and row['name'] != STATE:
            require(info.st_size == 0, 'Private protected mountpoint acquired bytes')
    return rows


def recursive_git_objects(source, allowed):
    todo, found = [source / '.git/objects'], set()
    while todo:
        root = runtime.physical(todo.pop())
        if root in found:
            continue
        require(root in allowed, 'Unexpected recursive Git object root')
        found.add(root)
        require(not os.path.lexists(root / 'info/http-alternates'), 'HTTP Git alternates are forbidden')
        alternate = root / 'info/alternates'
        if os.path.lexists(alternate):
            file_identity(alternate, private=True)
            todo.extend(exact_path(line) for line in alternate.read_text().splitlines())
    require(found == set(allowed), 'Declared Git object closure differs from actual recursive closure')
    return sorted(found)



def safe_tool_root(path):
    forbidden = tuple(map(Path, ('/proc', '/sys', '/dev', '/run', '/home', '/root', '/etc')))
    return len(path.parts) >= 3 and path != Path('/usr/bin') and not any(path.is_relative_to(root) for root in forbidden)


def write_bounded_raw(stream, data, stored, limit):
    require(0 <= stored <= limit and limit > 0, 'Invalid raw capture allowance')
    keep = min(len(data), limit - stored)
    if keep:
        stream.write(data[:keep])
        stream.flush()
    return stored + keep, keep == len(data)



def read_small_text(path, max_bytes=16384):
    """Explicit small-result opt-in; never decode a retained raw log without a cap."""
    require(type(max_bytes) is int and 0 < max_bytes <= 65536, 'Small-text allowance must be 1..65536 bytes')
    path = Path(path)
    runtime.physical(path.parent)
    before = path.lstat()
    require(stat.S_ISREG(before.st_mode) and before.st_nlink == 1 and before.st_size <= max_bytes,
            'Small-text result is nonprivate or exceeds its declared byte allowance')
    fd = os.open(path, os.O_RDONLY | os.O_NOFOLLOW | os.O_NONBLOCK)
    try:
        require(inode_key(os.fstat(fd)) == inode_key(before), 'Small-text result replaced before read')
        with os.fdopen(fd, 'rb', closefd=False) as stream:
            data = stream.read(max_bytes + 1)
        require(len(data) <= max_bytes and inode_key(os.fstat(fd)) == inode_key(before) == inode_key(path.lstat()),
                'Small-text result grew or changed while reading')
        return data.decode('utf-8').strip()
    finally:
        os.close(fd)


def load_spec(reference):
    spec = pinned_json(reference)
    require(set(spec) == {'version', 'kind', 'binding', 'source', 'runtime', 'provider',
                          'gitObjects', 'tools', 'inputs', 'backend', 'state', 'limits'},
            'Unsupported execution specification fields')
    require(spec['version'] == VERSION and spec['kind'] == 'shared-execution-spec', 'Unsupported execution spec')
    require(set(spec['source']) == {'path', 'revision', 'tree'}, 'Invalid source binding')
    for field in ('revision', 'tree'):
        require(re.fullmatch('[a-f0-9]{40}', spec['source'][field] or ''), 'Exact source commit/tree required')
    require(set(spec['runtime']) == {'path', 'manifestSha256'}, 'Invalid runtime binding')
    require(re.fullmatch('[a-f0-9]{64}', spec['runtime']['manifestSha256'] or ''), 'Exact runtime manifest hash required')
    require(set(spec['provider']) == {'path', 'dependencies'}, 'Invalid provider binding')
    tools = spec['tools']
    require(set(tools) == {'python', 'node', 'pnpm', 'bwrap', 'readonly', 'pnpmVersion'}, 'Invalid tool closure')
    require(tools['pnpmVersion'] == setup.MANAGER, 'Only the explicit pnpm 11.25 profile is supported')
    for name in ('python', 'node', 'pnpm', 'bwrap'):
        exact_path(tools[name])
    require(isinstance(tools['readonly'], list) and len(set(tools['readonly'])) == len(tools['readonly']),
            'Duplicate or invalid tool roots')
    for path in tools['readonly']:
        root = exact_path(path)
        require(safe_tool_root(root), 'Tool mount is too broad or exposes a special/private system tree')
    limits = Limits(**spec['limits'])
    # Initial maintained profile is bounded by the proven build ceiling, not arbitrary commands.
    for name in ('owner_rss_bytes', 'v8_mib', 'producer_seconds', 'envelope_seconds', 'raw_bytes',
                 'outer_raw_bytes', 'evidence_bytes', 'allocation_bytes'):
        require(getattr(limits, name) <= getattr(BUILD_LIMITS, name), 'Unqualified enlarged resource profile')
    for name in ('python', 'node', 'pnpm', 'bwrap'):
        executable = Path(tools[name])
        require(any(executable == Path(root) or executable.is_relative_to(Path(root)) for root in tools['readonly']),
                'Executable is not covered by the pinned read-only tool closure')
    require(Path(sys.executable).resolve() == Path(tools['python']), 'Controller interpreter differs from pinned Python')
    pnpm_package = Path(tools['pnpm']).parent.parent / 'package.json'
    package = json.loads(pnpm_package.read_bytes())
    require(package.get('name') == 'pnpm' and package.get('version') == '11.25.0', 'Pinned pnpm package version differs')
    for name in ('reserve_bytes', 'available_memory_bytes', 'free_inodes'):
        require(getattr(limits, name) >= getattr(BUILD_LIMITS, name), 'Unqualified reduced resource floor')
    return spec, limits


def input_roots(spec, roots):
    target = exact_path(spec['runtime']['path'])
    source = exact_path(spec['source']['path'])
    provider = exact_path(spec['provider']['path'])
    manifest = json.loads((target / runtime.MANIFEST).read_bytes())
    tops = sorted({entry['path'].split('/')[0] for entry in manifest['entries']} |
                  {runtime.MANIFEST, 'node_modules'})
    require(not set(tops).intersection(OUTPUT_LEAVES), 'Tracked input conflicts with writable output root')
    paths = {source, provider / 'node_modules', roots['store'], roots['assets'],
             *(target / name for name in tops), *(exact_path(path) for path in spec['gitObjects']),
             *(exact_path(path) for path in spec['tools']['readonly']), HERE}
    # Avoid redundant full walks; a descendant has no weaker exclusions than its parent.
    paths = {path for path in paths if not any(other != path and path.is_relative_to(other) for other in paths)}
    return sorted(paths), tops


def verify_inputs(spec):
    """Compose admission; do not refresh a reviewed baseline or exclude state bytes."""
    binding, roots = workspace.owned_binding(spec['binding']['path'], spec['binding']['sha256'])
    source, target, provider = (exact_path(spec[name]['path']) for name in ('source', 'runtime', 'provider'))
    for path in (source, target, provider):
        runtime.physical(path)
        require(path != roots['workspaces'] and path.is_relative_to(roots['workspaces']),
                'Source/runtime/provider must be inside authenticated owned workspaces')
    require(len({source, target, provider}) == 3 and not any(a != b and a.is_relative_to(b)
            for a in (source, target, provider) for b in (source, target, provider)), 'Nested/reused input roots')
    require(file_identity(target / runtime.MANIFEST, private=True)['sha256'] == spec['runtime']['manifestSha256'],
            'Runtime manifest changed')
    require(not os.path.lexists(source / '.git/commondir'), 'Redirected Git common directory is unsupported')
    objects = recursive_git_objects(source, [exact_path(path) for path in spec['gitObjects']])
    for path in objects:
        require(path.is_relative_to(roots['workspaces']), 'Git donor outside owned workspaces')
        require(all(row['kind'] != 'link' for row in tree_inventory(path)), 'Git object symlink is unsupported')
    with workspace.local_git_only():
        ready = runtime.verify_ready(source, spec['source']['revision'], roots['assets'], target, roots['store'])
    require(ready['source']['tree'] == spec['source']['tree'], 'Source tree changed')
    provider_identity = runtime.dependency_identity(provider)
    require(provider_identity == spec['provider']['dependencies'], 'Original dependency provider changed')
    inventory_roots, tops = input_roots(spec, roots)
    expected = pinned_json(spec['inputs'])
    require(set(expected) == {'version', 'kind', 'source', 'dependencies', 'roots', 'aliasLedger'},
            'Unsupported input inventory')
    require(expected['version'] == VERSION and expected['kind'] == 'shared-execution-inputs',
            'Wrong input inventory version/kind')
    require(expected['source'] == ready['source'] and expected['dependencies'] == ready['installation']['dependencyIdentity'],
            'Source or complete canonical dependency identity differs from accepted input pins')
    actual = {str(path): inventory_hash(path, ignore_caches=path.name == 'node_modules') for path in inventory_roots}
    require(actual == expected['roots'], 'Input inode/content/path inventory changed; no automatic repin')
    if expected['aliasLedger'] is not None:
        ledger = pinned_json(expected['aliasLedger'])
        require(ledger.get('status') == 'accepted' and ledger.get('inputRoots') == actual,
                'Explicit alias-transition acceptance does not bind this full input baseline')
        validate_alias_transition(ledger['before'], ledger['after'], ledger['aliases'])
        for name, identity in ledger['after'].items():
            path = exact_path(name)
            require(any(path.is_relative_to(root) for root in inventory_roots) and file_identity(path) == identity,
                    'Accepted alias ledger does not match current files')
    return {'bindingSha256': spec['binding']['sha256'], 'source': ready['source'],
            'dependencies': ready['installation']['dependencyIdentity'], 'provider': provider_identity,
            'roots': actual, 'topLevels': tops, 'installation': ready['installation']}, roots


def backend_qualification(reference, selected_tools):
    receipt = pinned_json(reference)
    require(receipt.get('version') == VERSION and receipt.get('kind') == 'shared-execution-backend-acceptance' and
            receipt.get('status') == 'accepted', 'Backend acceptance is missing or unsupported')
    require(receipt.get('adapterSha256') == file_identity(__file__)['sha256'], 'Backend accepted different adapter bytes')
    require(receipt.get('platform') == sys.platform == 'linux', 'Linux backend required')
    require(set(receipt.get('capabilities', [])) == set(CAPABILITIES), 'Backend capabilities incomplete')
    terminal = verify_sealed_receipt(receipt['qualification'])
    require(terminal.get('kind') == 'shared-execution-qualification' and terminal.get('error') is None and
            terminal.get('adapterSha256') == receipt['adapterSha256'] and
            set(terminal.get('capabilities', [])) == set(CAPABILITIES), 'Qualification evidence does not match acceptance')
    require(terminal.get('selectedBackend') == {name: selected_tools[name] for name in ('python', 'bwrap')},
            'Selected backend executables differ from qualification')
    require(len(selected_tools['readonly']) == len(set(selected_tools['readonly'])) and
            set(selected_tools['readonly']) == set(terminal['tools']),
            'Selected tool mount closure differs from qualification; additions require requalification')
    require({path: inventory_hash(Path(path)) for path in selected_tools['readonly']} == terminal['tools'],
            'Qualified backend tool/helper closure changed')
    require(hasattr(os, 'pidfd_open') and hasattr(signal, 'pidfd_send_signal') and hasattr(time, 'CLOCK_BOOTTIME'),
            'Required Linux process/clock APIs unavailable')
    return receipt


def state_acceptance(spec, inputs):
    acceptance = pinned_json(spec['state'])
    require(acceptance.get('version') == VERSION and acceptance.get('kind') == 'shared-execution-state-acceptance' and
            acceptance.get('status') == 'accepted', 'Independent state acceptance required')
    terminal = verify_sealed_receipt(acceptance['preparation'])
    require(terminal.get('kind') == 'shared-execution-state' and terminal.get('error') is None,
            'State preparation failed or is unknown')
    require(terminal['adapterSha256'] == file_identity(__file__)['sha256'] and
            terminal['inputsBefore'] == inputs == terminal['inputsAfter'], 'State input/adapter binding changed')
    state = terminal['state']
    path = exact_path(state['path'])
    require(file_identity(path, private=True) == state['identity'], 'Accepted state full inode/bytes changed')
    require(state['namespaceRuntime'] == spec['runtime']['path'], 'Accepted state namespace path changed')
    canonical, rows = dependency_rows(spec['runtime']['path'])
    require(canonical == inputs['dependencies'] and
            projected_identity(canonical, rows, path.read_bytes()) == state['projectedDependencies'],
            'Accepted state differs beyond its one explicit dependency row')
    return state


def clean_environment(spec, evidence, limits):
    """Fresh allowlist. No inherited credentials, user config, preload or loader path."""
    node, python = (Path(spec['tools'][name]) for name in ('node', 'python'))
    env = {'PATH': ':'.join((str(node.parent), str(python.parent), '/usr/bin', '/bin')),
           'HOME': str(evidence / 'home'), 'TMPDIR': str(evidence / 'tmp'),
           'TMP': str(evidence / 'tmp'), 'TEMP': str(evidence / 'tmp'),
           'LANG': 'C.UTF-8', 'LC_ALL': 'C.UTF-8', 'CI': '1', 'NO_COLOR': '1',
           'PYTHONDONTWRITEBYTECODE': '1', 'NODE_OPTIONS': '--max-old-space-size=' + str(limits.v8_mib),
           'GIT_NO_LAZY_FETCH': '1', 'GIT_NO_REPLACE_OBJECTS': '1', 'GIT_ALLOW_PROTOCOL': '',
           'GIT_CONFIG_NOSYSTEM': '1', 'GIT_CONFIG_GLOBAL': '/dev/null', 'GIT_TERMINAL_PROMPT': '0',
           'GIT_OPTIONAL_LOCKS': '0', 'GIT_CONFIG_COUNT': '2',
           'GIT_CONFIG_KEY_0': 'protocol.allow', 'GIT_CONFIG_VALUE_0': 'never',
           'GIT_CONFIG_KEY_1': 'core.fsmonitor', 'GIT_CONFIG_VALUE_1': 'false',
           'ROLLDOWN_WORKER_THREADS': '2', 'ROLLDOWN_MAX_BLOCKING_THREADS': '2', 'RAYON_NUM_THREADS': '1',
           'NEXT_TELEMETRY_DISABLED': '1', 'WRANGLER_SEND_METRICS': 'false', 'WRANGLER_WRITE_LOGS': 'false',
           'MINIFLARE_REGISTRY_PATH': str(Path(spec['runtime']['path']) / '.wrangler/registry'),
           'NPM_CONFIG_USERCONFIG': '/dev/null', 'NPM_CONFIG_GLOBALCONFIG': '/dev/null',
           'npm_config_offline': 'true', 'npm_config_cache': str(evidence / 'pnpm-cache'),
           'npm_config_update_notifier': 'false', 'COREPACK_ENABLE_NETWORK': '0',
           'PND_RUNTIME_MAX_RAW_BYTES': str(limits.inner_raw_bytes)}
    for name in ('cache', 'config', 'state', 'data'):
        env['XDG_' + name.upper() + '_HOME'] = str(evidence / ('xdg-' + name))
    return env


def mount_plan(spec, roots, inputs, evidence, *, stage, state=None, shape=None):
    require(stage in ('prepare-state', 'run'), 'Unknown execution stage')
    target, source = Path(spec['runtime']['path']), Path(spec['source']['path'])
    readonly = {source, roots['assets'], HERE, *(Path(path) for path in spec['gitObjects']),
                *(Path(path) for path in spec['tools']['readonly'])}
    mounts = []
    if stage == 'run':
        mounts.append(['rw', str(evidence / 'launch-root'), str(target)])
        mounts.extend(['ro', str(target / name), str(target / name)] for name in inputs['topLevels'])
        require(state is not None, 'Accepted state required')
        mounts.append(['ro', state['path'], str(target / 'node_modules' / STATE)])
    else:
        mounts.append(['ro', str(target), str(target)])
        require(shape is not None, 'Private module-root shape required')
        mounts.append(['rw', str(evidence / 'modules-root'), str(target / 'node_modules')])
        mounts.extend(['ro', str(target / 'node_modules' / row['name']), str(target / 'node_modules' / row['name'])]
                      for row in shape if row['kind'] != 'link' and row['name'] != STATE)
    mounts.extend(['ro', str(path), str(path)] for path in sorted(readonly))
    mounts.extend(['rw', str(evidence / name), str(evidence / name)] for name in PRIVATE_LEAVES
                  if name != 'shm' and not name.startswith('module-'))
    mounts.extend([['rw', str(evidence / 'tmp'), '/tmp'], ['rw', str(evidence / 'shm'), '/dev/shm']])
    if stage == 'run':
        mounts.extend(['rw', str(evidence / ('module-' + name.lstrip('.'))), str(target / 'node_modules' / name)]
                      for name in CACHES)
    protected = [Path(path) for path in inputs['roots']]
    validate_mounts(mounts, evidence, protected, target, stage=stage)
    return {'version': VERSION, 'mounts': mounts, 'rootReadOnly': True, 'procReadOnly': True,
            'privatePidNamespace': True, 'networkNamespace': False, 'namespaceRuntime': str(target),
            'persistedOutputRoot': str(evidence / 'launch-root') if stage == 'run' else None,
            'preparationRootMountedAtHostPath': False}


def validate_mounts(mounts, evidence, protected, target, *, stage):
    destinations = []
    for mode, host, namespace in mounts:
        host, namespace = exact_path(host), exact_path(namespace)
        require(mode in ('rw', 'ro'), 'Unknown mount mode')
        require(host != evidence and namespace != evidence, 'Evidence parent must never be mounted')
        if mode == 'rw':
            require(host.parent == evidence and host.name in {*PRIVATE_LEAVES, 'launch-root', 'modules-root'},
                    'Only explicit fresh private leaves may be writable')
            require(not any(host.is_relative_to(path) or path.is_relative_to(host) for path in protected),
                    'Writable source overlaps a protected canonical input')
            if stage == 'prepare-state':
                require(namespace != target and (not namespace.is_relative_to(target) or namespace == target / 'node_modules'),
                        'Preparation may write only the private module-root projection')
        else:
            require(not evidence.is_relative_to(host), 'Readonly ancestor exposes private preparation/output alias')
        destinations.append(namespace)
    # Duplicate destinations are allowed only for intentionally ordered overlays.
    require(len(destinations) == len(set(destinations)), 'Duplicate mount destinations')


def verify_readonly_executable_alias(alias, expected_identity):
    """Kernel mount status is independent of permission-denial ordering."""
    import errno
    before = os.stat(alias)
    require((before.st_dev, before.st_ino) == tuple(expected_identity), 'Python alias inode changed')
    flags = os.statvfs(alias).f_flag
    require(flags & os.ST_RDONLY, 'Python alias mount is writable')
    try:
        fd = os.open(alias, os.O_WRONLY)
    except OSError as error:
        require(error.errno in (errno.EROFS, errno.EACCES, errno.ETXTBSY),
                'Unexpected Python alias write denial: ' + repr(error))
        denied_errno = error.errno
    else:
        os.close(fd)
        raise ValueError('Python alias permits writable access')
    after = os.stat(alias)
    require(inode_key(before) == inode_key(after) and os.statvfs(alias).f_flag & os.ST_RDONLY,
            'Python alias inode or readonly mount changed during check')
    return {'readonlyMountFlags': flags, 'writeDeniedErrno': denied_errno,
            'inode': [after.st_dev, after.st_ino], 'readonly': True}


def with_python_command_alias(spec, plan):
    """Expose only the already-pinned interpreter as the expected bare python3 name."""
    interpreter = exact_path(spec['tools']['python'])
    alias = interpreter.with_name('python3')
    require(str(interpreter) in spec['tools']['readonly'], 'Python alias source must be an exact pinned tool root')
    require(['ro', str(interpreter), str(interpreter)] in plan['mounts'],
            'Python alias source is not an exact readonly interpreter mount')
    if alias == interpreter:
        return plan
    require(all(Path(row[2]) != alias for row in plan['mounts']), 'Python command alias destination collision')
    return {**plan, 'mounts': [*plan['mounts'], ['ro', str(interpreter), str(alias)]],
            'pythonCommandAlias': {'source': str(interpreter), 'destination': str(alias),
                                   'mode': 'readonly-bind', 'hostPathChanged': False}}


def bubblewrap_command(spec, plan, control, command):
    require(command and all(isinstance(arg, str) and '\0' not in arg for arg in command), 'Invalid command argv')
    args = [spec['tools']['bwrap'], '--die-with-parent', '--new-session', '--unshare-pid', '--cap-drop', 'ALL', '--dir', '/dev']
    for mode, source, target in plan['mounts']:
        args.extend(['--ro-bind' if mode == 'ro' else '--bind', source, target])
    args.extend(['--symlink', 'usr/lib', '/lib', '--symlink', 'usr/lib64', '/lib64',
                 '--symlink', 'usr/bin', '/bin', '--symlink', 'dash', '/usr/bin/sh'])
    for name in ('null', 'zero', 'random', 'urandom'):
        args.extend(['--dev-bind', '/dev/' + name, '/dev/' + name])
    args.extend(['--proc', '/proc', '--remount-ro', '/proc', '--symlink', '/proc/self/fd', '/dev/fd',
                 '--symlink', '/proc/self/fd/0', '/dev/stdin', '--symlink', '/proc/self/fd/1', '/dev/stdout',
                 '--symlink', '/proc/self/fd/2', '/dev/stderr', '--remount-ro', '/', '--chdir', plan['namespaceRuntime'],
                 '--', spec['tools']['python'], '-I', '-B', str(HERE / 'shared_execution.py'),
                 '_gate', str(control), *command])
    require('--ro-bind' in args and not any(flag in args for flag in ('--unshare-net', '--share-net', '--unshare-all')),
            'Unexpected network boundary change')
    return args


def plan_execution(spec, limits, *, stage='run', evidence=None):
    inputs, roots = verify_inputs(spec)
    blockers, backend, state = [], None, None
    try:
        backend = backend_qualification(spec['backend'], spec['tools']) if spec['backend'] is not None else None
        require(backend is not None, 'Exact maintained backend is not independently accepted')
    except (ValueError, OSError, KeyError, TypeError) as error:
        blockers.append(str(error))
    if stage == 'run':
        try:
            state = state_acceptance(spec, inputs) if spec['state'] is not None else None
            require(state is not None, 'Exact private pnpm state is not independently accepted')
        except (ValueError, OSError, KeyError, TypeError) as error:
            blockers.append(str(error))
    if evidence is not None:
        validate_destination(evidence, roots, inputs)
    return {'version': VERSION, 'kind': 'shared-execution-plan', 'status': 'blocked' if blockers else 'plan-only',
            'stage': stage, 'blockers': blockers, 'inputs': inputs, 'limits': asdict(limits),
            'state': state, 'backend': backend, 'allocates': False, 'executesPnpm': False,
            'stages': ['plan', 'prepare-state', 'independent-state-review', 'run'],
            'runtimeMaterialization': 'separate explicit stage; not implemented or implied'}, roots


def validate_destination(evidence, roots, inputs):
    evidence = exact_path(str(evidence))
    runtime.physical(evidence.parent)
    require(evidence.parent.is_relative_to(roots['workspaces']) and evidence != roots['workspaces'],
            'Fresh evidence must be inside authenticated workspaces')
    require(not os.path.lexists(evidence), 'Evidence already exists; no retry/adoption/overwrite')
    require(not any(evidence.is_relative_to(Path(root)) or Path(root).is_relative_to(evidence) for root in inputs['roots']),
            'Evidence overlaps a protected input root')


def make_layout(evidence, *, stage):
    evidence.mkdir(mode=0o700)
    for name in PRIVATE_LEAVES:
        (evidence / name).mkdir(mode=0o700)
    if stage == 'run':
        (evidence / 'launch-root').mkdir(mode=0o700)
        for name in OUTPUT_LEAVES:
            (evidence / 'launch-root' / name).mkdir(mode=0o700)
    private_inventory(evidence)


def process_ancestry(pid):
    # Public ancestry only: unrelated host namespaces/executables are not ours.
    fields = (Path('/proc') / str(pid) / 'stat').read_text().rsplit(')', 1)[1].split()
    return {'pid': int(pid), 'startTicks': int(fields[19]), 'ppid': int(fields[1]),
            'pgid': int(fields[2]), 'session': int(fields[3]), 'state': fields[0]}


def open_proc_directory(pid):
    require(type(pid) is int and pid > 0, 'Positive process PID required')
    return os.open('/proc/' + str(pid), os.O_RDONLY | os.O_DIRECTORY | os.O_CLOEXEC | os.O_NOFOLLOW)


def proc_text_at(directory, name):
    # Fixed public/owned leaves only. Never turn a retained handle back into a
    # numeric /proc pathname, including when the task exits during a read.
    require(name in ('stat', 'status', 'statm'), 'Unsupported process text leaf')
    fd = os.open(name, os.O_RDONLY | os.O_CLOEXEC | os.O_NOFOLLOW, dir_fd=directory)
    stream = error = None
    try:
        stream = os.fdopen(fd, 'r')
        fd = None  # The stream now owns this transient descriptor.
        return stream.read()
    except BaseException as failure:
        error = failure
        raise
    finally:
        try:
            if stream is not None:
                stream.close()
            elif fd is not None:
                os.close(fd)
        except BaseException as close_error:
            if error is None:
                raise
            error.add_note('Process text handle close failed: ' + str(close_error))


def process_ancestry_at(pid, directory):
    data = proc_text_at(directory, 'stat')
    observed_pid = int(data.split(' ', 1)[0])
    require(observed_pid == pid, 'Retained process stat PID differs')
    fields = data.rsplit(')', 1)[1].split()
    return {'pid': observed_pid, 'startTicks': int(fields[19]), 'ppid': int(fields[1]),
            'pgid': int(fields[2]), 'session': int(fields[3]), 'state': fields[0]}


def process_member_at(pid, directory):
    row = process_ancestry_at(pid, directory)
    status = dict(line.split(':', 1) for line in proc_text_at(directory, 'status').splitlines() if ':' in line)
    row.update(rss=int(proc_text_at(directory, 'statm').split()[1]) * os.sysconf('SC_PAGE_SIZE'),
               nspid=[int(value) for value in status['NSpid'].split()],
               pidNamespace=os.readlink('ns/pid', dir_fd=directory))
    try:
        row['executable'] = os.readlink('exe', dir_fd=directory)
    except FileNotFoundError:
        row['executable'] = None
    return row


def ancestry_snapshot():
    rows = {}
    for path in Path('/proc').iterdir():
        if path.name.isdigit():
            try:
                rows[int(path.name)] = process_ancestry(int(path.name))
            except (FileNotFoundError, ProcessLookupError):
                pass  # Only exit races, never inaccessible/unknown ancestry.
    return rows


def require_child_subreaper():
    # Process-local orphan ownership, not privileges or host procfs policy.
    # Established before any producer can pass its ownership gate. It remains
    # set for this controller's lifetime so no later orphan loses its anchor.
    import ctypes
    library = ctypes.CDLL(None, use_errno=True)
    require(library.prctl(36, 1, 0, 0, 0) == 0, 'Child subreaper unavailable')
    value = ctypes.c_int()
    require(library.prctl(37, ctypes.byref(value), 0, 0, 0) == 0 and value.value == 1,
            'Child subreaper not verified')


def owned_process_rows(census, parent, known, namespace_roots, enrich, *, prepare=None, exited=None):
    # Full enrichment is injected only after positive ancestry selection.
    identity = census.get(parent['pid'])
    require(identity and identity['startTicks'] == parent['startTicks'], 'Controller identity invisible')
    owned = {parent['pid']}
    for pid, row in census.items():
        if (pid, row['startTicks']) in known:
            owned.add(pid)
    for namespace, root in namespace_roots.items():
        row = census.get(root['pid'])
        if row is not None:
            require(row['startTicks'] == root['startTicks'], 'Namespace init PID reused')
            owned.add(root['pid'])
    while True:
        more = {pid for pid, row in census.items() if row['ppid'] in owned} - owned
        if not more:
            break
        owned.update(more)
    result = []
    for pid in sorted(owned):
        if prepare is not None:
            prepare(census[pid])
        try:
            row = enrich(pid)
        except (FileNotFoundError, ProcessLookupError):
            if exited is not None and exited(census[pid]):
                continue  # Exact identity-validated retained pidfd proved exit.
            raise  # Unknown/unpinned/readable-live identities remain fatal.
        if not all(row[key] == census[pid][key] for key in ('pid', 'startTicks', 'ppid')):
            raise OwnedIdentityComparisonFault(census[pid], row)
        result.append(row)
    return result


def process_member(pid):
    root = Path('/proc') / str(pid)
    fields = (root / 'stat').read_text().rsplit(')', 1)[1].split()
    status = dict(line.split(':', 1) for line in (root / 'status').read_text().splitlines() if ':' in line)
    row = {'pid': int(pid), 'startTicks': int(fields[19]), 'ppid': int(fields[1]),
           'pgid': int(fields[2]), 'session': int(fields[3]), 'state': fields[0],
           'rss': int((root / 'statm').read_text().split()[1]) * os.sysconf('SC_PAGE_SIZE'),
           'nspid': [int(value) for value in status['NSpid'].split()],
           'pidNamespace': os.readlink(root / 'ns/pid')}
    try:
        row['executable'] = os.readlink(root / 'exe')
    except FileNotFoundError:
        row['executable'] = None
    return row


def process_snapshot():
    rows = {}
    for path in Path('/proc').iterdir():
        if path.name.isdigit():
            try:
                rows[int(path.name)] = process_member(int(path.name))
            except (FileNotFoundError, ProcessLookupError):
                pass  # Successfully observed races with process exit, not arbitrary read failures.
    return rows


class OwnerWatch:
    """Positive ancestry before namespace adoption; retained pidfds survive observer failure."""
    def __init__(self, evidence, limits, started, *, snapshot=ancestry_snapshot):
        require_child_subreaper()
        self.evidence, self.limits, self.started = evidence, limits, started
        self.namespace_roots = {}
        self.snapshot = snapshot
        self.parent = process_member(os.getpid())
        self.known, self.history, self.pidfds, self.procdirs = {}, {}, {}, {}
        self.handles_closed = False
        self.namespace_fds, self.direct_fds, self.namespaces = [], [], set()
        self.lock = threading.RLock()
        self.closed = threading.Event()
        self.failure, self.binding = None, None
        self.failure_marker = None
        self.unexpected_failure = None
        self.samples = self.peak = 0
        self.observation_context = {}; self.observation_failure = None; self.exited_observations = []
        self.stream = (evidence / 'resources.ndjson').open('xb')
        self.resource_bytes = 0
        self.thread = threading.Thread(target=self.loop, daemon=True)
        self.thread.start()

    def fail(self, reason, *, fault_marker=None):
        require(fault_marker in (None, QUALIFIER_OBSERVER_FAULT), 'Unknown observer-fault marker')
        with self.lock:
            if fault_marker is None and self.unexpected_failure is None:
                self.unexpected_failure = reason
            if self.failure is None:
                self.failure = reason
                self.failure_marker = fault_marker

    def check(self):
        require(self.unexpected_failure is None, self.unexpected_failure or 'Unexpected observer failure')
        if self.failure is not None and self.failure_marker == QUALIFIER_OBSERVER_FAULT:
            raise QualificationObservationFault(self.failure)
        require(self.failure is None, self.failure or 'Unknown observer failure')

    def pin_identity(self, row, phase):
        """Directory, then pidfd, then fresh relative stat bind one kernel PID.

        This does not prove census-era birth or relax any initial identity or
        ancestry comparison. A fresh watcher never retrofits an unpaired fd.
        """
        require(not self.handles_closed, 'Owner process handles already closed')
        key = row['pid'], row['startTicks']
        self.observation_context = {'phase':phase,'callsite':'pin-preparation',
                                    'pid':row['pid'],'startTicks':row['startTicks'],'ppid':row['ppid']}
        if row['pid'] == self.parent['pid']:
            return
        if key in self.pidfds or key in self.procdirs:
            require(key in self.pidfds and key in self.procdirs, 'Owned identity lacks paired process handles')
            return
        fd = directory = None
        try:
            self.observation_context['callsite'] = 'pin-proc-directory-open'
            directory = open_proc_directory(row['pid'])
            self.observation_context['callsite'] = 'pin-pidfd-open'
            fd = os.pidfd_open(row['pid'])
            self.observation_context['callsite'] = 'pin-identity-reread'
            # Open/read stat only AFTER pidfd_open. A cached pre-open record
            # would not prove the directory and pidfd refer to the same task.
            current = process_ancestry_at(row['pid'], directory)
            self.observation_context['callsite'] = 'pin-identity-compare'
            require(all(current[name] == row[name] for name in ('pid','startTicks','ppid')),
                    'Owned identity/ancestry changed before pin validation')
            self.pidfds[key] = fd
            self.procdirs[key] = directory
        except BaseException as error:
            self.pidfds.pop(key, None)
            self.procdirs.pop(key, None)
            for acquired in (fd, directory):
                if acquired is not None:
                    try:
                        os.close(acquired)
                    except OSError as close_error:
                        error.add_note('Partial process handle close failed: ' + str(close_error))
            # Readability of an UNVALIDATED fd never proves the census identity.
            raise

    def exited_identity(self, row):
        import select
        key = row['pid'], row['startTicks']
        fd = self.pidfds.get(key)
        if fd is None or not select.select([fd], [], [], 0)[0]:
            return False
        observations = getattr(self,'exited_observations',None)
        if observations is None:
            observations = self.exited_observations = []
        require(len(observations) < 1024,'Retained exit observation evidence cap')
        observations.append({**self.observation_context,'retainedIdentityValidated':True,
                             'pidfdExitObserved':True})
        return True

    def observe_member(self, pid, census, phase):
        row = census[pid]
        self.observation_context = {'phase':phase,'callsite':'owned-enrichment',
                                    'pid':pid,'startTicks':row['startTicks'],'ppid':row['ppid']}
        require(not self.handles_closed, 'Owner process handles already closed')
        if pid == self.parent['pid']:
            # This executing controller cannot be reaped/reused while reading
            # itself. It is not an acquired descendant and has no signal pidfd.
            return process_member(pid)
        key = pid, row['startTicks']
        require(key in self.pidfds and key in self.procdirs, 'Owned identity lacks paired process handles')
        return process_member_at(pid, self.procdirs[key])

    def observe(self):
        try:
            return self._observe()
        except Exception as error:
            with self.lock:
                if getattr(self,'observation_failure',None) is None:
                    self.observation_failure = {**getattr(self,'observation_context',{}),
                        'errorType':type(error).__name__,'errno':getattr(error,'errno',None),
                        'message':str(error)[:512]}
                    if type(error) is OwnedIdentityComparisonFault:
                        self.observation_failure['comparison'] = error.comparison
            raise

    def _observe(self):
        with self.lock:
            require(not self.handles_closed, 'Owner process handles already closed')
            self.observation_context = {'phase':'first','callsite':'ancestry-census'}
            all_rows = self.snapshot()
            rows = owned_process_rows(all_rows, self.parent, set(self.known) | set(self.pidfds),
                self.namespace_roots, lambda pid:self.observe_member(pid,all_rows,'first'),
                prepare=lambda row:self.pin_identity(row,'first'),exited=self.exited_identity)
            # Pin the first positive closure before taking the second census.
            # Fork/setsid/reparent are ordinary owned transitions, not a reason
            # to demand a globally frozen host process set. Two bounded passes
            # retain additions while removals require kernel exit evidence.
            self.retain_rows(rows)
            self.observation_context = {'phase':'second','callsite':'ancestry-census'}
            after = self.snapshot()
            for previous in rows:
                replacement = after.get(previous['pid'])
                require(replacement is None or replacement['startTicks'] == previous['startTicks'],
                        'Owned PID reused between censuses')
            second = owned_process_rows(after, self.parent, set(self.known) | set(self.pidfds),
                self.namespace_roots, lambda pid:self.observe_member(pid,after,'second'),
                prepare=lambda row:self.pin_identity(row,'second'),exited=self.exited_identity)
            first_by_pid = {row['pid']: row for row in rows}
            second_pids = {row['pid'] for row in second}
            for row in second:
                previous = first_by_pid.get(row['pid'])
                if previous is not None:
                    require(previous['startTicks'] == row['startTicks'],
                            'Owned PID reused between censuses')
                    if row['pid'] != self.parent['pid'] and previous['ppid'] != row['ppid']:
                        require(row['ppid'] in second_pids,
                                'Owned reparent lacks positive parent anchor')
            self.retain_rows(second)
            rows = second
            import select
            for key, fd in self.pidfds.items():
                current = after.get(key[0])
                if current is None or current['startTicks'] != key[1]:
                    require(select.select([fd], [], [], 0)[0],
                            'Retained owned PID absent/reused without positive exit')
            for namespace, root in self.namespace_roots.items():
                if root['pid'] not in after:
                    # Linux tears down namespace members when init exits, but
                    # absence alone is not a cleanup receipt. Every retained
                    # member must also have a positively exited pidfd.
                    import select
                    for key, member in self.known.items():
                        if member['pidNamespace'] == namespace and key in self.pidfds:
                            require(select.select([self.pidfds[key]], [], [], 0)[0],
                                    'Namespace init absent with live retained member')
            for row in rows:
                key = row['pid'], row['startTicks']
                history = self.history.setdefault(key, {'parents': set(), 'namespaces': set(), 'nspids': set(),
                                                        'executables': set(), 'sessions': set(), 'positiveRss': False})
                history['parents'].add(row['ppid'])
                history['namespaces'].add(row['pidNamespace'])
                history['nspids'].add(tuple(row['nspid']))
                history['executables'].add(row['executable'])
                history['sessions'].add(row['session'])
                history['positiveRss'] |= row['rss'] > 0
            return rows

    def retain_rows(self, rows):
        for row in rows:
            key = row['pid'], row['startTicks']
            require(row['pid'] == self.parent['pid'] or key in self.pidfds,
                    'Enriched owned row lacks validated retained identity')
            self.known[key] = row

    def loop(self):
        while not self.closed.is_set():
            try:
                rows = self.observe()
                total = sum(row['rss'] for row in rows)
                require(total > 0 and total <= self.limits.owner_rss_bytes, 'Whole-owner sampled RSS stop')
                require(time.monotonic() - self.started < self.limits.envelope_seconds, 'Whole-envelope deadline')
                snapshot = host_snapshot(self.evidence)
                assert_capacity(snapshot, self.limits)
                allocation = allocation_usage(self.evidence, sampled=True)
                require(allocation['allocatedBytes'] <= self.limits.allocation_bytes, 'Allocation budget exceeded')
                require(allocation['evidenceBytes'] <= self.limits.evidence_bytes, 'Evidence allocation budget exceeded')
                self.peak = max(self.peak, total)
                self.samples += 1
                data = encoded({'elapsed': time.monotonic() - self.started, 'ownedRssBytes': total,
                                'members': rows, 'host': snapshot, 'allocation': allocation})
                require(self.resource_bytes + len(data) <= self.limits.evidence_bytes // 2,
                        'Resource-observation evidence cap')
                self.stream.write(data)
                self.stream.flush()
                self.resource_bytes += len(data)
            except Exception as error:
                self.fail('Observer failure: ' + type(error).__name__ + ': ' + str(error),
                          fault_marker=failure_record(error)['injectedFault'])
            if self.failure:
                self.cleanup()
                return
            self.closed.wait(self.limits.sample_seconds)

    def pin_direct(self, process):
        # Popen establishes direct ownership; its unreaped PID cannot be reused.
        with self.lock:
            require(not self.handles_closed, 'Owner process handles already closed')
            fd = os.pidfd_open(process.pid)
            self.direct_fds.append(fd)

    def bind_gate(self, ready, direct):
        rows = self.observe()
        matches = [row for row in rows if row['startTicks'] == ready['startTicks'] and
                   row['nspid'][-1] == ready['pid'] and row['pidNamespace'] == ready['pidNamespace']]
        require(len(matches) == 1, 'Gate has no unique positive host PID binding')
        gate = matches[0]
        require(gate['pidNamespace'] != self.parent['pidNamespace'], 'Never adopt the parent PID namespace')
        require(gate['pid'] != direct.pid and gate['rss'] > 0 and
                len(gate['nspid']) == len(self.parent['nspid']) + 1, 'Gate depth/RSS mismatch')
        init = [row for row in rows if row['pidNamespace'] == gate['pidNamespace'] and row['nspid'][-1] == 1]
        require(len(init) == 1, 'Namespace init lacks positive ancestry ownership')
        with self.lock:
            require(not self.handles_closed, 'Owner process handles already closed')
            key = gate['pid'], gate['startTicks']
            require(key in self.pidfds and key in self.procdirs, 'Gate lacks paired process handles')
            fd = os.open('ns/pid', os.O_RDONLY | os.O_CLOEXEC, dir_fd=self.procdirs[key])
            try:
                require(os.fstat(fd).st_ino == int(gate['pidNamespace'].split('[')[1].rstrip(']')), 'Namespace handle changed')
            except BaseException:
                os.close(fd)
                raise
            self.namespace_fds.append(fd)
            self.namespaces.add(gate['pidNamespace'])
            self.namespace_roots[gate['pidNamespace']] = {
                'pid': init[0]['pid'], 'startTicks': init[0]['startTicks']}
            require((init[0]['pid'], init[0]['startTicks']) in self.pidfds,
                    'Namespace init lacks retained pidfd')
            self.binding = {'hostPid': gate['pid'], 'startTicks': gate['startTicks'], 'namespacePid': ready['pid'],
                            'pidNamespace': gate['pidNamespace'], 'nspid': gate['nspid'],
                            'initHostPid': init[0]['pid'], 'initStartTicks': init[0]['startTicks']}
        return self.binding

    def cleanup(self):
        # Never rely on a process group, current observer success or a guessed PID.
        with self.lock:
            for fd in [*self.pidfds.values(), *self.direct_fds]:
                try:
                    signal.pidfd_send_signal(fd, signal.SIGKILL)
                except ProcessLookupError:
                    pass
            try:
                self.observe()
            except Exception:
                return
            for fd in self.pidfds.values():
                try:
                    signal.pidfd_send_signal(fd, signal.SIGKILL)
                except ProcessLookupError:
                    pass

    def survivors(self):
        return [row for row in self.observe() if row['pid'] != self.parent['pid'] and row['state'] != 'Z']

    def finish(self, *, cleanup_deadline=None, receipt=None):
        receipt = {} if receipt is None else receipt
        deadline = time.monotonic()+self.limits.cleanup_seconds if cleanup_deadline is None else cleanup_deadline
        receipt.update(joined=False,healthy=None,withinDeadline=None,deadlineMonotonic=deadline)
        self.finish_observation = receipt
        self.closed.set()
        error = None
        try:
            self.thread.join(timeout=max(0,deadline-time.monotonic()))
            receipt['joined'] = not self.thread.is_alive()
            require(receipt['joined'], 'Observer thread did not stop')
            stream_error = None
            try:
                self.stream.close()
            except BaseException as failure:
                stream_error = failure
            with self.lock:
                # Mark closed and detach maps before close: later calls must
                # never reuse an fd integer that the OS has since recycled.
                self.handles_closed = True
                descriptors = [*self.namespace_fds, *self.pidfds.values(),
                               *self.direct_fds, *self.procdirs.values()]
                self.namespace_fds.clear(); self.pidfds.clear()
                self.direct_fds.clear(); self.procdirs.clear()
                close_error = stream_error
                for fd in descriptors:
                    try:
                        os.close(fd)
                    except OSError as failure:
                        if close_error is None:
                            close_error = failure
                if close_error is not None:
                    raise close_error
            try:
                self.check()
                receipt['healthy'] = True
            except BaseException as failure:
                receipt['healthy'] = False
                receipt['healthError'] = type(failure).__name__+': '+str(failure)[:512]
                raise
        except BaseException as failure:
            error = failure
            raise
        finally:
            receipt['finishedMonotonic'] = time.monotonic()
            receipt['withinDeadline'] = receipt['finishedMonotonic'] <= deadline
            if error is None:
                require(receipt['withinDeadline'],'Observer join exceeded shared cleanup deadline')

    def report(self):
        with self.lock:
            history = [{'pid': pid, 'startTicks': ticks,
                        **{name: sorted(value, key=str) if isinstance(value, set) else value
                           for name, value in values.items()}} for (pid, ticks), values in self.history.items()]
            return {'sampledPeakOwnerRssBytes': self.peak, 'sampleCount': self.samples,
                    'failure': self.failure, 'failureMarker': self.failure_marker,
                    'unexpectedFailure': self.unexpected_failure,
                    'gateBinding': self.binding, 'history': history,
                    'observationFailure':getattr(self,'observation_failure',None),
                    'retainedExitObservations':getattr(self,'exited_observations',[]),
                    'finishObservation':getattr(self,'finish_observation',None)}


def await_owned_cleanup(watch, limits, evidence, context, *, phase):
    """Wait for asynchronous owned termination; never turn unknown/live into success."""
    if 'deadline' not in context:
        context['deadline'] = time.monotonic() + limits.cleanup_seconds
    deadline = context['deadline']
    observations = []
    error = None
    accepted = False
    try:
        while True:
            observed_at = time.monotonic()
            try:
                before = watch.survivors()
                before_error = None
            except Exception as failure:
                before = None
                before_error = failure_record(failure)
            try:
                watch.cleanup()
                survivors = watch.survivors()
                observation_error = None
            except Exception as failure:
                survivors = None
                observation_error = failure_record(failure)
            finished = time.monotonic()
            observations.append({'startedMonotonic': observed_at, 'finishedMonotonic': finished,
                                 'before': before, 'beforeError': before_error,
                                 'after': survivors, 'afterError': observation_error})
            context['lastObservation'] = observations[-1]
            context['accepted'] = False
            require(finished <= deadline, 'Owned cleanup deadline exhausted')
            if survivors == []:
                accepted = True
                context['accepted'] = True
                return
            require(finished < deadline, 'Owned cleanup has live or unknown survivors')
            time.sleep(min(0.03, deadline - finished))
    except BaseException as failure:
        error = failure_record(failure)
        raise
    finally:
        save_new(evidence / ('cleanup-observations-' + phase + '.json'),
                 {'kind': 'bounded-owned-cleanup-observations', 'phase': phase,
                  'deadlineMonotonic': deadline, 'cleanupSeconds': limits.cleanup_seconds,
                  'status': 'observed-zero-live-survivors' if accepted else 'failed-or-unknown',
                  'observations': observations, 'error': error})


def finish_observer(watch, *, expected_fault=False, result=None, cleanup_deadline=None, receipt=None):
    """Shared joined-health gate for application and generated qualifier paths."""
    try:
        if cleanup_deadline is None and receipt is None:
            watch.finish()
        else:
            watch.finish(cleanup_deadline=cleanup_deadline,receipt=receipt)
    except QualificationObservationFault:
        require(expected_fault, 'Unexpected injected observer fault outside its case')
        require_qualifier_observer_failure(result)


class ProducerClock:
    """Real process creation age, permanently stopped on positive exit/absence."""
    def __init__(self, row, clock=None, ticks_per_second=None):
        self.identity = {'hostPid': row['pid'], 'startTicks': row['startTicks'],
                         'namespacePid': row['nspid'][-1], 'pidNamespace': row['pidNamespace']}
        self.start = row['startTicks'] / (ticks_per_second or os.sysconf('SC_CLK_TCK'))
        self.first = time.clock_gettime(time.CLOCK_BOOTTIME) if clock is None else clock
        self.finished = None

    def sample(self, complete_rows, now=None):
        now = time.clock_gettime(time.CLOCK_BOOTTIME) if now is None else now
        current = next((row for row in complete_rows if (row['pid'], row['startTicks']) ==
                        (self.identity['hostPid'], self.identity['startTicks'])), None)
        if self.finished is None and (current is None or current['state'] == 'Z'):
            self.finished = now
        return (self.finished if self.finished is not None else now) - self.start

    def report(self):
        return {'clock': 'CLOCK_BOOTTIME', 'identity': self.identity, 'startBoottime': self.start,
                'firstObservedBoottime': self.first, 'finishedObservedBoottime': self.finished,
                'durationUpperBoundSeconds': None if self.finished is None else self.finished - self.start}


def run_payload(spec, plan, evidence, command, limits, watch, *, producer_mode='gate', expected_exe=None,
                producer_receipt=None):
    """One bounded projected command. All failure paths retain evidence and kill owned tasks."""
    plan = with_python_command_alias(spec, plan)
    args = bubblewrap_command(spec, plan, evidence / 'control', command)
    save_new(evidence / 'mount-plan.json', plan)
    save_new(evidence / 'command.json', command)
    environment = clean_environment(spec, evidence, limits)
    outer = [spec['tools']['python'], '-I', '-B', str(HERE / 'shared_execution.py'), '_outer',
             str(limits.producer_seconds), *args]
    process = subprocess.Popen(outer, cwd=HERE, env=environment, start_new_session=True, close_fds=True,
                               stdin=subprocess.PIPE, stdout=subprocess.PIPE, stderr=subprocess.PIPE, bufsize=0)
    clock = None
    ready = binding = None
    reason = None
    primary_failure = cleanup_failure = None
    observed = stored = 0
    started = time.monotonic()
    exit_observed = None
    streams = {}
    try:
        watch.pin_direct(process)
        initial = process_member(process.pid)
        require(initial['ppid'] == os.getpid() and initial['rss'] > 0, 'Outer gate not positively observed')
        watch.observe()
        watch.check()
        for name in ('stdout', 'stderr'):
            streams[name] = (evidence / ('transport.' + name)).open('xb')
        process.stdin.write(b'G')
        process.stdin.flush()
        process.stdin.close()
        with selectors.DefaultSelector() as selector:
            for name in streams:
                pipe = getattr(process, name)
                os.set_blocking(pipe.fileno(), False)
                selector.register(pipe, selectors.EVENT_READ, name)
            while selector.get_map() or process.poll() is None:
                watch.check()
                now = time.monotonic()
                code = process.poll()
                if code is not None and exit_observed is None:
                    exit_observed = now
                if binding is None and (evidence / 'control/ready.json').exists():
                    ready = json.loads((evidence / 'control/ready.json').read_bytes())
                    require(ready['command'] == command and ready['security']['NoNewPrivs'] == '1' and
                            ready['security']['Seccomp'] == '2' and all(int(ready['security'][key], 16) == 0
                            for key in CAP_FIELDS), 'Namespace gate command/security mismatch')
                    require(ready['fds'] == {'0': '/dev/null', '1': 'pipe', '2': 'pipe'}, 'Unexpected inherited descriptors')
                    binding = watch.bind_gate(ready, process)
                    save_new(evidence / 'control/release.json', binding)
                if binding is None:
                    require(now - started <= 20, 'Namespace gate launch timeout')
                else:
                    rows = watch.observe()
                    expected = expected_exe or command[0]
                    if producer_mode == 'gate':
                        candidates = [row for row in rows if row['pid'] == binding['hostPid'] and
                                      row['startTicks'] == binding['startTicks'] and row['executable'] == expected]
                    else:
                        require(producer_mode == 'inner' and producer_receipt is not None, 'Invalid producer mode')
                        candidates = [row for row in rows if row['ppid'] == binding['hostPid'] and
                                      row['pidNamespace'] == binding['pidNamespace'] and row['executable'] == expected]
                        if not producer_receipt.exists():
                            candidates = []  # Ignore unchanged helper's version probes before its initial receipt.
                    candidates = [row for row in candidates if row['rss'] > 0]
                    if candidates:
                        require(len(candidates) == 1, 'Ambiguous actual producer')
                        if clock is None:
                            clock = ProducerClock(candidates[0])
                        require((candidates[0]['pid'], candidates[0]['startTicks']) ==
                                (clock.identity['hostPid'], clock.identity['startTicks']), 'Producer identity changed')
                    if clock is not None:
                        require(clock.sample(rows) <= limits.producer_seconds, 'Actual producer clock timeout')
                if exit_observed is not None and selector.get_map():
                    require(now - exit_observed <= 1, 'Output pipes survived direct child exit')
                for key, _ in selector.select(0.03):
                    data = os.read(key.fd, 65536)
                    if not data:
                        selector.unregister(key.fileobj)
                        key.fileobj.close()
                        continue
                    observed += len(data)
                    stored, complete = write_bounded_raw(streams[key.data], data, stored, limits.outer_raw_bytes)
                    require(complete, 'Outer raw output hard byte cap exceeded')
        require(binding is not None and clock is not None, 'Payload/producer was never positively observed')
        clock.sample(watch.observe())
        require(clock.finished is not None, 'Actual producer termination not established')
        require(json.loads((evidence / 'control/ready.json').read_bytes()) == ready and
                json.loads((evidence / 'control/release.json').read_bytes()) == binding, 'Gate evidence changed')
    except BaseException as error:
        reason = type(error).__name__ + ': ' + str(error)
        primary_failure = failure_record(error)
    finally:
        survivors = None
        initial_survivors = None
        initial_cleanup_observation = None
        try:
            observation_started = time.monotonic()
            remaining = watch.survivors()
            initial_survivors = remaining
            direct_returncode = process.poll()
            initial_cleanup_observation = {
                'startedMonotonic': observation_started,
                'finishedMonotonic': time.monotonic(),
                'directReturnCode': direct_returncode,
            }
            if direct_returncode is None or remaining:
                reason = reason or 'Owned descendants remained after direct exit'
                watch.cleanup()
                if process.poll() is None:
                    process.kill()  # This is the positively owned, unreaped direct Popen child only.
            try:
                process.wait(timeout=limits.cleanup_seconds)
            except subprocess.TimeoutExpired:
                watch.cleanup()
                process.wait(timeout=limits.cleanup_seconds)
            end = time.monotonic() + limits.cleanup_seconds
            while watch.survivors() and time.monotonic() < end:
                watch.cleanup()
                time.sleep(0.03)
            survivors = watch.survivors()
            require(not survivors, 'Owned process survivors')
        except BaseException as error:
            watch.cleanup()
            if process.poll() is None:
                process.kill()
            try:
                process.wait(timeout=limits.cleanup_seconds)
            except BaseException:
                pass
            cleanup_failure = failure_record(error)
            reason = (reason or '') + '; cleanup observation unknown: ' + str(error)
        for pipe in (process.stdin, process.stdout, process.stderr):
            if pipe is not None and not pipe.closed:
                pipe.close()
        for stream in streams.values():
            stream.close()
    result = {'exitCode': process.returncode, 'stopReason': reason, 'failure': primary_failure,
              'cleanupFailure': cleanup_failure, 'initialSurvivors': initial_survivors,
              'initialCleanupObservation': initial_cleanup_observation, 'gateBinding': binding,
              'observedRawBytes': observed, 'storedRawBytes': stored, 'survivors': survivors,
              'producer': clock.report() if clock else None, 'wallSeconds': time.monotonic() - started,
              'rawPaths': {name: str(evidence / ('transport.' + name)) for name in streams}}
    save_new(evidence / 'payload-result.json', result)
    return result


def outer_gate(args):
    import ctypes
    import resource
    seconds, command = int(args[0]), args[1:]
    resource.setrlimit(resource.RLIMIT_CORE, (0, 0))
    resource.setrlimit(resource.RLIMIT_CPU, (seconds, seconds))
    library = ctypes.CDLL(None, use_errno=True)
    require(library.prctl(38, 1, 0, 0, 0) == 0, 'NoNewPrivs failed')
    require(library.prctl(1, signal.SIGKILL, 0, 0, 0) == 0, 'Parent-death signal failed')
    require(os.read(0, 1) == b'G', 'Outer ownership gate not released')
    os.close(0)
    require(os.open('/dev/null', os.O_RDONLY) == 0, 'Could not isolate stdin')
    os.set_inheritable(0, True)
    os.execvpe(command[0], command, os.environ)


def namespace_gate(args):
    control, command = Path(args[0]), args[1:]
    status = dict(line.split(':', 1) for line in Path('/proc/self/status').read_text().splitlines() if ':' in line)
    security = {key: status[key].strip() for key in (*CAP_FIELDS, 'NoNewPrivs', 'Seccomp')}
    require(security['NoNewPrivs'] == '1' and security['Seccomp'] == '2' and
            all(int(security[key], 16) == 0 for key in CAP_FIELDS), 'Inherited security boundary missing')
    fds = {}
    for path in Path('/proc/self/fd').iterdir():
        try:
            target = os.readlink(path)
            fds[path.name] = 'pipe' if target.startswith('pipe:') else target
        except FileNotFoundError:
            pass
    require(fds == {'0': '/dev/null', '1': 'pipe', '2': 'pipe'}, 'Extra inherited file descriptors')
    row = process_member(os.getpid())
    ready = {**{name: row[name] for name in ('pid', 'ppid', 'startTicks', 'pidNamespace', 'nspid')},
             'command': command, 'security': security, 'fds': fds}
    save_new(control / 'ready.json', ready)
    end = time.monotonic() + 20
    while not (control / 'release.json').exists():
        require(time.monotonic() < end, 'Host ownership gate did not release')
        time.sleep(0.02)
    release = json.loads((control / 'release.json').read_bytes())
    require(release['pidNamespace'] == ready['pidNamespace'] and release['namespacePid'] == ready['pid'] and
            release['startTicks'] == ready['startTicks'], 'Host release differs from private gate')
    os.execvpe(command[0], command, dict(os.environ))


def state_profile(target):
    package = json.loads((target / 'package.json').read_bytes())
    _, state = state_serialization_profile((target / 'node_modules' / STATE).read_bytes())
    require(package.get('packageManager') == setup.MANAGER and not package.get('configDependencies') and
            not package.get('pnpm'), 'Unsupported pnpm package configuration')
    require(set(state) == {'lastValidatedTimestamp', 'projects', 'pnpmfiles', 'settings', 'filteredInstall'},
            'Unknown pnpm state schema requires explicit profile review')
    require(state.get('pnpmfiles') == [] and set(state.get('projects', {})) == {str(target)},
            'Unexpected pnpm hooks or workspace namespace paths')
    workspace_bytes = (target / 'pnpm-workspace.yaml').read_bytes()
    require(workspace_bytes == SUPPORTED_WORKSPACE, 'Unsupported workspace verification/hook profile')
    for root in (target, *target.parents):
        require(not any(os.path.lexists(root / name) for name in ('.npmrc', '.pnpmfile.cjs', 'pnpmfile.cjs')),
                'Unexpected project/ancestor pnpm config hook')
    return max((target / name).stat().st_mtime_ns // 1000000 + 1000 for name in
               ('package.json', 'pnpm-lock.yaml', 'pnpm-workspace.yaml', 'node_modules/.pnpm/lock.yaml'))


def effective_audit(source, revision, pool, target):
    identity, rows = dependency_rows(target)
    return {'source': runtime.verify(source, revision, pool, target), 'dependencies': identity,
            'rows': rows, 'keys': tree_inventory(target / 'node_modules', ignore_caches=True),
            'state': file_identity(target / 'node_modules' / STATE, private=True)}


def compare_effective_transition(before, after, old_bytes, new_bytes, start_ms, end_ms, floor):
    transition = validate_state_transition(old_bytes, new_bytes, start_ms, end_ms, floor)
    require(before['source'] == after['source'], 'Effective source changed during state validation')
    require(projected_identity(before['dependencies'], before['rows'], new_bytes) == after['dependencies'],
            'More than the explicit state dependency row changed')
    old_rows = {row['path']: row for row in before['keys']}
    new_rows = {row['path']: row for row in after['keys']}
    require(old_rows.keys() == new_rows.keys(), 'Effective dependency path set changed')
    for name, row in old_rows.items():
        if name not in ('.', STATE):
            require(row == new_rows[name], 'Protected dependency inode/content changed: ' + name)
    a, b = before['state'], after['state']
    require(a['sha256'] == sha_bytes(old_bytes) and b['sha256'] == sha_bytes(new_bytes), 'State bytes differ from audit')
    require(a['key'][0] == b['key'][0] and a['key'][1] != b['key'][1] and a['key'][2] == b['key'][2] and
            b['key'][6] == 1 and a['key'][7:] == b['key'][7:], 'State was not a private same-owner/mode atomic replacement')
    for index in (0, 1, 2, 6, 7, 8):
        require(old_rows['.']['key'][index] == new_rows['.']['key'][index], 'Private module root changed')
    return {**transition, 'stateBefore': a, 'stateAfter': b,
            'canonicalDependencies': before['dependencies'], 'projectedDependencies': after['dependencies'],
            'otherInodeKeysAndBytesUnchanged': True}


def inner_prepare(args):
    source, revision, pool, target, receipt, node, pnpm, raw = args
    source, pool, target, receipt = map(Path, (source, pool, target, receipt))
    command = [node, pnpm, 'run']  # Genuine dependency verification, no script, install or fabricated timestamp.
    before = effective_audit(source, revision, pool, target)
    old_bytes = (target / 'node_modules' / STATE).read_bytes()
    floor = state_profile(target)
    payload = {'version': VERSION, 'kind': 'shared-execution-state-command', 'status': 'unknown',
               'command': command, 'sourceBefore': before['source'], 'dependenciesBefore': before['dependencies']}
    with runtime.OwnedEvidence(receipt) as evidence:
        evidence.write_receipt(payload)
        start_ms = time.time_ns() // 1000000
        capture = runtime.capture_command(command, str(target), dict(os.environ), evidence, int(raw))
        end_ms = time.time_ns() // 1000000
        evidence.validate()
        require(capture['exitCode'] == 0 and capture['complete'], 'Bare pnpm capture was not complete and successful')
        after = effective_audit(source, revision, pool, target)
        new_bytes = (target / 'node_modules' / STATE).read_bytes()
        transition = compare_effective_transition(before, after, old_bytes, new_bytes, start_ms, end_ms, floor)
        payload.update(status='passed', capture=capture, transition=transition, sourceAfter=after['source'],
                       dependenciesAfter=after['dependencies'], logs=evidence.logs())
        evidence.write_receipt(payload)
    print(json.dumps({'status': 'passed', 'receipt': str(receipt)}))


def inner_audit(args):
    source, revision, pool, target, output = args
    target = Path(target)
    value = effective_audit(Path(source), revision, Path(pool), target)
    state = target / 'node_modules' / STATE
    denied = False
    try:
        fd = os.open(state, os.O_WRONLY | os.O_NOFOLLOW)
    except OSError as error:
        import errno
        require(error.errno == errno.EROFS, 'State write check failed for a reason other than read-only filesystem')
        denied = True
    else:
        os.close(fd)  # Never modify bytes even if a defective backend grants write access.
    require(denied, 'Frozen state is writable')
    value.pop('rows')
    value.pop('keys')
    value['stateReadOnly'] = True
    save_new(Path(output), value)


def bind_inner_producer(watch, receipt, result, expected_exe):
    local_pid = receipt['capture']['pid']
    binding = result['gateBinding']
    matches = []
    for (pid, ticks), history in watch.history.items():
        if (binding['pidNamespace'] in history['namespaces'] and history['positiveRss'] and
                any(values[-1] == local_pid for values in history['nspids']) and
                binding['hostPid'] in history['parents'] and expected_exe in history['executables']):
            matches.append({'hostPid': pid, 'startTicks': ticks, 'namespacePid': local_pid,
                            'pidNamespace': binding['pidNamespace']})
    require(len(matches) == 1 and result['producer']['identity'] == matches[0],
            'Receipt producer does not match positive timed host PID/startTicks/NSpid binding')
    return matches[0]


def verify_raw_receipt(receipt, path, result, limits):
    require(receipt['status'] == 'passed' and receipt['capture']['complete'] and receipt['capture']['exitCode'] == 0,
            'Inner command receipt is not terminal passed')
    total = 0
    for name in ('stdout', 'stderr'):
        log = Path(str(path) + '.' + name)
        identity = file_identity(log, private=True)
        require(receipt['logs'][name] == {'path': str(log), 'bytes': identity['key'][3], 'sha256': identity['sha256']},
                'Inner raw log path/bytes/hash mismatch')
        total += identity['key'][3]
    require(total == receipt['capture']['storedBytes'] and total <= limits.inner_raw_bytes and
            total + result['storedRawBytes'] <= limits.raw_bytes, 'Combined actual raw output cap')
    return total + result['storedRawBytes']


def verify_outputs(evidence, target):
    output = evidence / 'launch-root/dist'
    runtime.physical(output)
    for name in ('client', 'server', '.openai'):
        runtime.physical(output / name)
    require(file_identity(output / '.openai/hosting.json', private=True)['sha256'] ==
            file_identity(target / '.openai/hosting.json')['sha256'], 'Hosting output differs from exact source')
    rows = private_inventory(output)
    for prefix in ('client/', 'server/'):
        require(any(row['kind'] == 'file' and row['path'].startswith(prefix) for row in rows),
                'Required output subtree contains no files')
    return {'persistedOutputRoot': str(output), 'files': sum(row['kind'] == 'file' for row in rows),
            'logicalBytes': sum(row['key'][3] for row in rows if row['kind'] == 'file'),
            'inventorySha256': sha_bytes(encoded(rows)), 'hostingMatchesSource': True}


@contextmanager
def envelope(seconds):
    require(threading.current_thread() is threading.main_thread(), 'Controller must own the main thread')
    old = {number: signal.getsignal(number) for number in (signal.SIGTERM, signal.SIGINT, signal.SIGALRM)}
    require(signal.getitimer(signal.ITIMER_REAL) == (0.0, 0.0), 'Controller cannot replace an existing alarm')
    def interrupted(number, frame):
        raise RuntimeError('Controller interrupted by signal ' + str(number))
    for number in old:
        signal.signal(number, interrupted)
    signal.setitimer(signal.ITIMER_REAL, seconds)
    try:
        yield time.monotonic() + seconds
    finally:
        signal.setitimer(signal.ITIMER_REAL, 0)
        for number, handler in old.items():
            signal.signal(number, handler)


def sealed_artifacts(rows):
    """All entry types; only the evidence root's receipt-creation fields vary."""
    artifacts = {}
    for original in rows:
        if original['path'] in ('terminal.json', 'final-budget.json'):
            continue
        row = dict(original)
        if row['path'] == '.':
            key = list(row['key'])
            # Creating the two receipt files can change only these root fields.
            # The final seal separately binds the full post-creation root key.
            for index in (3, 4, 5):
                key[index] = None
            row['key'] = key
        artifacts[row.pop('path')] = row
    return artifacts


def seal_receipt(evidence, terminal, limits, deadline, *, allowed_links=None):
    require(time.monotonic() < deadline - 1, 'Envelope exhausted before sealing')
    require(not os.path.lexists(evidence / 'seal-failed.json'), 'Seal failure already exists')
    rows = private_inventory(evidence, allowed_links=allowed_links)
    require(not any(row['path'] in ('terminal.json', 'final-budget.json') for row in rows),
            'Receipt destination already exists')
    artifacts = sealed_artifacts(rows)
    terminal = {**terminal, 'version': VERSION, 'status': 'pending-final-budget-seal' if terminal['error'] is None else 'failed-or-unknown',
                'artifacts': artifacts, 'allowedPrivateLinks': allowed_links or {}, 'limits': asdict(limits)}
    terminal_hash = save_new(evidence / 'terminal.json', terminal)
    require(time.monotonic() < deadline - 1, 'Deadline during terminal sealing')
    # Create the final leaf exclusively BEFORE capturing the final directory key.
    # Writing through this held fd does not change the parent directory identity.
    final_path = evidence / 'final-budget.json'
    fd = os.open(final_path, os.O_WRONLY | os.O_CREAT | os.O_EXCL | os.O_NOFOLLOW, 0o600)
    try:
        initial_final_key = inode_key(os.fstat(fd))
        final_root_key = inode_key(evidence.lstat())
        terminal_identity = file_identity(evidence / 'terminal.json', private=True)
        require(sealed_artifacts(private_inventory(evidence, allowed_links=allowed_links)) == artifacts,
                'Artifacts changed during receipt creation')
        allocation = allocation_usage(evidence)
        allocated, evidence_allocated = allocation['allocatedBytes'], allocation['evidenceBytes']
        snapshot = host_snapshot(evidence)
        assert_capacity(snapshot, limits)
        require(allocated + 65536 <= limits.allocation_bytes and evidence_allocated + 65536 <= limits.evidence_bytes,
                'Terminal-inclusive allocation/evidence budget exceeded')
        require(time.monotonic() < deadline - 1, 'Deadline during final budget walk')
        seal = {'version': VERSION, 'kind': 'shared-execution-final-budget',
                'status': 'passed' if terminal['error'] is None else 'failed-or-unknown', 'terminalSha256': terminal_hash,
                'terminalIdentity': terminal_identity, 'finalRootKey': final_root_key,
                'rootTransition': 'Only size/mtime/ctime may change while exclusively creating two receipt leaves',
                'allocatedBytesIncludingTerminal': allocated, 'evidenceBytesIncludingTerminal': evidence_allocated,
                'finalReceiptReservationBytes': 65536, 'snapshot': snapshot, 'withinLimits': True,
                'envelopeSeconds': limits.envelope_seconds - (deadline - time.monotonic())}
        data = encoded(seal)
        require(len(data) <= 65536, 'Final receipt exceeds reserved bytes')
        with os.fdopen(fd, 'wb', closefd=False) as stream:
            stream.write(data)
            stream.flush()
        final_info = os.fstat(fd)
        require(inode_key(final_path.lstat()) == inode_key(final_info) and
                all(inode_key(final_info)[i] == initial_final_key[i] for i in (0, 1, 2, 6, 7, 8)),
                'Final receipt leaf was replaced')
        require(final_info.st_blocks * 512 <= 65536 and inode_key(evidence.lstat()) == final_root_key,
                'Final receipt reservation or root identity changed')
        require(sealed_artifacts(private_inventory(evidence, allowed_links=allowed_links)) == artifacts and
                file_identity(evidence / 'terminal.json', private=True) == terminal_identity,
                'Sealed entries changed during final write')
        final_allocation = allocation_usage(evidence)
        require(final_allocation['allocatedBytes'] <= allocated + 65536 and
                final_allocation['evidenceBytes'] <= evidence_allocated + 65536 and time.monotonic() < deadline,
                'Final allocation or deadline exceeded')
        return seal
    finally:
        os.close(fd)


def verify_sealed_receipt(reference):
    require(set(reference) == {'terminal', 'finalBudget'}, 'Exact terminal and seal references required')
    terminal, seal = pinned_json(reference['terminal']), pinned_json(reference['finalBudget'])
    root = Path(reference['terminal']['path']).parent
    require(root == Path(reference['finalBudget']['path']).parent and
            Path(reference['terminal']['path']).name == 'terminal.json' and
            Path(reference['finalBudget']['path']).name == 'final-budget.json', 'Unexpected sealed receipt layout')
    require(not os.path.lexists(root / 'seal-failed.json'), 'Sealed receipt has a retained seal failure')
    require(terminal['version'] == seal['version'] == VERSION and terminal['status'] == 'pending-final-budget-seal' and
            terminal['error'] is None and seal['status'] == 'passed' and seal['withinLimits'] is True and
            seal['terminalSha256'] == reference['terminal']['sha256'], 'Terminal/final-budget seal is not authoritative passed')
    require(inode_key(root.lstat()) == seal['finalRootKey'] and
            file_identity(root / 'terminal.json', private=True) == seal['terminalIdentity'],
            'Sealed root or terminal identity changed')
    rows = private_inventory(root, allowed_links=terminal['allowedPrivateLinks'])
    require(sealed_artifacts(rows) == terminal['artifacts'], 'Sealed artifact path/key/hash inventory changed')
    allocation = allocation_usage(root)
    require(allocation['allocatedBytes'] <= seal['allocatedBytesIncludingTerminal'] + seal['finalReceiptReservationBytes'] and
            allocation['evidenceBytes'] <= seal['evidenceBytesIncludingTerminal'] + seal['finalReceiptReservationBytes'],
            'Sealed allocation exceeded final reservation')
    return terminal


def execute_stage(spec, limits, evidence, *, stage):
    started = time.monotonic()
    plan, roots = plan_execution(spec, limits, stage=stage, evidence=evidence)
    require(not plan['blockers'], '; '.join(plan['blockers']))
    before = plan['inputs']
    target, source = Path(spec['runtime']['path']), Path(spec['source']['path'])
    lock = target.parent / ('.' + target.name + '.shared-execution-lock')
    require(not os.path.lexists(lock), 'Runtime execution lock exists; previous owner/failure is preserved')
    assert_capacity(host_snapshot(evidence.parent), limits, admission=True)
    # Preparation admission is complete before allocating state or launching anything.
    if stage == 'prepare-state':
        state_profile(target)
    require(time.monotonic() - started < limits.envelope_seconds - 2, 'Admission exhausted the execution envelope')
    make_layout(evidence, stage=stage)
    lock.mkdir(mode=0o700)
    lock_key = inode_key(lock.stat())
    watch = None
    after = result = outputs = state = None
    error = None
    raw_bytes = 0
    links = {}
    with envelope(max(1, limits.envelope_seconds - (time.monotonic() - started))) as deadline:
        try:
            watch = OwnerWatch(evidence, limits, started)
            save_new(evidence / 'inputs-before.json', before)
            if stage == 'prepare-state':
                shape = create_state_projection(target / 'node_modules', evidence / 'modules-root')
                links = {'modules-root/' + row['name']: row['link'] for row in shape if row['kind'] == 'link'}
                receipt_path = evidence / 'receipt/state.json'
                command = [spec['tools']['python'], '-I', '-B', str(HERE / 'shared_execution.py'), '_prepare',
                           str(source), spec['source']['revision'], str(roots['assets']), str(target), str(receipt_path),
                           spec['tools']['node'], spec['tools']['pnpm'], str(limits.inner_raw_bytes)]
                mounts = mount_plan(spec, roots, before, evidence, stage=stage, shape=shape)
                result = run_payload(spec, mounts, evidence, command, limits, watch, producer_mode='inner',
                                     expected_exe=spec['tools']['node'], producer_receipt=receipt_path)
                require(result['exitCode'] == 0 and result['stopReason'] is None, 'Private state validation failed')
                receipt = json.loads(receipt_path.read_bytes())
                raw_bytes = verify_raw_receipt(receipt, receipt_path, result, limits)
                bind_inner_producer(watch, receipt, result, spec['tools']['node'])
                require(receipt['command'] == [spec['tools']['node'], spec['tools']['pnpm'], 'run'] and
                        receipt['sourceBefore'] == before['source'] == receipt['sourceAfter'] and
                        receipt['dependenciesBefore'] == before['dependencies'], 'Private state input/command mismatch')
                validate_private_projection(evidence / 'modules-root', shape)
                state_path = evidence / 'modules-root' / STATE
                state = {'path': str(state_path), 'identity': file_identity(state_path, private=True),
                         'namespaceRuntime': str(target), 'projectedDependencies': receipt['dependenciesAfter'],
                         'transition': receipt['transition']}
                require(state['identity'] == receipt['transition']['stateAfter'], 'Validated state was replaced after pnpm')
                # A second fresh namespace exposes ONLY the final state file read-only.
                frozen = evidence / 'frozen-audit'
                make_layout(frozen, stage='prepare-state')
                mounts = frozen_mount_plan(spec, roots, before, frozen, state)
                command = [spec['tools']['python'], '-I', '-B', str(HERE / 'shared_execution.py'), '_audit',
                           str(source), spec['source']['revision'], str(roots['assets']), str(target),
                           str(frozen / 'control/audit.json')]
                remaining_raw = min(limits.outer_raw_bytes, limits.raw_bytes - raw_bytes)
                require(remaining_raw > 0, 'No raw allowance remains for frozen-state audit')
                frozen_limits = replace(limits, outer_raw_bytes=remaining_raw)
                frozen_result = run_payload(spec, mounts, frozen, command, frozen_limits, watch,
                                            expected_exe=spec['tools']['python'])
                require(frozen_result['exitCode'] == 0 and frozen_result['stopReason'] is None, 'Frozen state audit failed')
                raw_bytes += frozen_result['storedRawBytes']
                audit = json.loads((frozen / 'control/audit.json').read_bytes())
                require(audit['source'] == before['source'] and audit['dependencies'] == state['projectedDependencies'] and
                        audit['state'] == state['identity'] and audit['stateReadOnly'] is True, 'Frozen effective identity differs')
            else:
                state = plan['state']
                receipt_path = evidence / 'receipt/build.json'
                command = [spec['tools']['python'], '-I', '-B', str(HERE / 'shared_runtime.py'), 'run',
                           '--source', str(source), '--revision', spec['source']['revision'], '--pool', str(roots['assets']),
                           '--runtime', str(target), '--receipt', str(receipt_path), '--',
                           spec['tools']['node'], spec['tools']['pnpm'], 'run', 'build']
                mounts = mount_plan(spec, roots, before, evidence, stage='run', state=state)
                result = run_payload(spec, mounts, evidence, command, limits, watch, producer_mode='inner',
                                     expected_exe=spec['tools']['node'], producer_receipt=receipt_path)
                require(result['exitCode'] == 0 and result['stopReason'] is None, 'Projected build command failed')
                receipt = json.loads(receipt_path.read_bytes())
                raw_bytes = verify_raw_receipt(receipt, receipt_path, result, limits)
                bind_inner_producer(watch, receipt, result, spec['tools']['node'])
                require(receipt['command'] == [spec['tools']['node'], spec['tools']['pnpm'], 'run', 'build'] and
                        receipt['sourceBefore'] == before['source'] == receipt['sourceAfter'] and
                        receipt['dependenciesBefore'] == state['projectedDependencies'] == receipt['dependenciesAfter'],
                        'Strict inner source/full projected dependency identity changed')
                outputs = verify_outputs(evidence, target)
            require(raw_bytes <= limits.raw_bytes, 'Combined multi-phase raw capture cap')
        except BaseException as failure:
            error = type(failure).__name__ + ': ' + str(failure)
        finally:
            if watch is not None:
                try:
                    watch.cleanup()
                    require(not watch.survivors(), 'Owned process survivors')
                except BaseException as failure:
                    error = (error or '') + '; cleanup observation unknown: ' + str(failure)
            try:
                require(time.monotonic() < deadline - 2, 'No remaining postcheck envelope')
                after, _ = verify_inputs(spec)
                save_new(evidence / 'inputs-after.json', after)
                require(after == before, 'Canonical input/tool/provider/Git inode drift')
                require(inode_key(lock.stat()) == lock_key and not any(lock.iterdir()), 'Owned lock changed')
                if state is not None:
                    require(file_identity(state['path'], private=True) == state['identity'], 'Private state changed after qualification/run')
                if watch is not None:
                    watch.check()
            except BaseException as failure:
                error = (error or '') + '; postcheck: ' + str(failure)
            try:
                if watch is not None:
                    watch.cleanup()
                    require(not watch.survivors(), 'Owned postverification process survivors')
                    finish_observer(watch)
            except BaseException as failure:
                error = (error or '') + '; observer close: ' + str(failure)
            terminal = {'kind': 'shared-execution-state' if stage == 'prepare-state' else 'shared-execution-build',
                        'error': error, 'adapterSha256': file_identity(__file__)['sha256'], 'inputsBefore': before,
                        'inputsAfter': after, 'state': state, 'payload': result, 'outputs': outputs, 'rawBytes': raw_bytes,
                        'resources': watch.report() if watch else None,
                        'applicationBuildExecuted': stage == 'run' and result is not None,
                        'browserExecuted': False, 'memoryClaim': 'Sampled whole-owner stop, not a hard cgroup or gameplay result'}
            try:
                seal_receipt(evidence, terminal, limits, deadline, allowed_links=links)
                if error is None:
                    require(inode_key(lock.stat()) == lock_key and not any(lock.iterdir()), 'Owned lock changed before release')
                    lock.rmdir()
            except BaseException as failure:
                error = (error or '') + '; seal: ' + str(failure)
                signal.setitimer(signal.ITIMER_REAL, 2)
                try:
                    save_new(evidence / 'seal-failed.json', {'status': 'failed-or-unknown', 'error': error[:4000],
                                                          'partialEvidenceAndOwnedLockRetained': True})
                except BaseException:
                    pass
    return {'status': 'passed' if error is None else 'failed-or-unknown', 'evidence': str(evidence), 'error': error,
            'requiresIndependentStateAcceptance': stage == 'prepare-state'}


def frozen_mount_plan(spec, roots, inputs, evidence, state):
    # Reuse the run plan, but there is no writable application root or package cache.
    target = Path(spec['runtime']['path'])
    plan = mount_plan(spec, roots, inputs, evidence, stage='run', state=state)
    plan['mounts'] = [row for row in plan['mounts'] if not Path(row[2]).is_relative_to(target)]
    plan['mounts'] = [['ro', str(target), str(target)], ['ro', state['path'], str(target / 'node_modules' / STATE)],
                      *plan['mounts']]
    plan['persistedOutputRoot'] = None
    validate_mounts(plan['mounts'], evidence, [Path(path) for path in inputs['roots']], target, stage='prepare-state')
    return plan



def validate_private_pid_visibility(rows, *, self_pid, namespace):
    """The generated read-only fixture has exactly its gate and namespace init."""
    require(type(self_pid) is int and 1 < self_pid <= 4194304 and
            isinstance(namespace, str) and re.fullmatch(r'pid:\[[0-9]+\]', namespace),
            'Invalid private-namespace fixture identity')
    require(isinstance(rows, list) and 1 < len(rows) <= QUALIFIER_MAX_VISIBLE_PIDS,
            'Private PID visibility exceeds the qualifier bound or lacks init')
    pids = [row.get('pid') for row in rows]
    require(all(type(pid) is int and 0 < pid <= 4194304 for pid in pids) and len(pids) == len(set(pids)) and
            set(pids) == {1, self_pid}, 'Unknown or duplicate process in fresh read-only fixture namespace')
    for row in rows:
        require(row.get('pidNamespace') == namespace and row.get('nspid') == [row['pid']] and
                type(row.get('startTicks')) is int and row['startTicks'] > 0 and row.get('rss', 0) > 0 and
                row.get('state') in ('R', 'S') and row.get('ppid') == (0 if row['pid'] == 1 else 1),
                'Unproven, outside, exited or unexpected private PID visibility')
    return {row['pid']: {name: row[name] for name in ('pid', 'ppid', 'startTicks', 'pidNamespace', 'nspid')}
            for row in rows}


def private_proc_view(ready):
    pids = []
    for path in Path('/proc').iterdir():
        if path.name.isdigit():
            pids.append(int(path.name))
            require(len(pids) <= QUALIFIER_MAX_VISIBLE_PIDS, 'Too many visible private PIDs')
    # Unlike general process sampling, disappearing PIDs here are unknown coverage,
    # not a reason to silently skip a proc-root alias in this controlled fixture.
    rows = [process_member(pid) for pid in sorted(pids)]
    require(os.getpid() == ready['pid'], 'Fixture no longer runs as the positively bound gate')
    identities = validate_private_pid_visibility(rows, self_pid=ready['pid'], namespace=ready['pidNamespace'])
    require(identities[ready['pid']]['startTicks'] == ready['startTicks'], 'Fixture gate PID was replaced')
    return identities


def proc_root_sentinel_paths(protected, identities):
    protected = exact_path(str(protected))
    require(1 < len(identities) <= QUALIFIER_MAX_VISIBLE_PIDS and 1 in identities,
            'Missing bounded namespace-init identity')
    return [Path('/proc') / str(pid) / 'root' / str(protected / 'sentinel').lstrip('/')
            for pid in sorted(identities)]


def require_readable_sentinel(path, expected_bytes, expected_key):
    before = path.stat()
    require(inode_key(before) == expected_key and stat.S_ISREG(before.st_mode),
            'Proc-root alias does not expose the exact generated sentinel inode')
    with path.open('rb') as stream:
        data = stream.read(len(expected_bytes) + 1)
    require(data == expected_bytes and inode_key(path.stat()) == expected_key,
            'Generated sentinel alias is unreadable, changed or oversized')


def qualification_fixture(args):
    """Generated sentinel payload only; never called by prepare-state or run."""
    mode, protected, private, output = args
    protected, private, output = map(Path, (protected, private, output))
    import errno
    time.sleep(0.4)  # Require a positive executable/RSS observation, not PID absence inference.
    if mode in ('readonly', 'frozen'):
        denied = []
        ready = json.loads((output.parent / 'ready.json').read_bytes())
        identities = private_proc_view(ready)
        sentinel_bytes = b'protected generated sentinel\n'
        sentinel_key = inode_key((protected / 'sentinel').stat())
        paths = [protected / 'sentinel', protected / 'alias', protected / 'link',
                 *proc_root_sentinel_paths(protected, identities)]
        for path in paths:
            require_readable_sentinel(path, sentinel_bytes, sentinel_key)
        if mode == 'frozen':
            state_path = Path('/pnd-fixture/node_modules') / STATE
            require(state_path.is_file(), 'Frozen private sentinel state is absent')
            paths.append(state_path)
        for path in paths:
            try:
                fd = os.open(path, os.O_WRONLY)
            except OSError as error:
                require(error.errno == errno.EROFS, 'Unexpected sentinel denial')
                denied.append(str(path))
            else:
                os.close(fd)
                raise ValueError('Protected sentinel alias is writable')
        for operation in (lambda: os.unlink(protected / 'sentinel'),
                          lambda: os.rename(protected / 'sentinel', protected / 'renamed'),
                          lambda: os.mkdir('/unowned-root-write')):
            try:
                operation()
            except OSError as error:
                require(error.errno == errno.EROFS, 'Unexpected immutable-directory denial')
            else:
                raise ValueError('Protected namespace root permits mutation')
        require(not os.path.lexists(private), 'Preparation host alias was exposed')
        require(private_proc_view(ready) == identities, 'Private PID visibility changed during alias coverage')
        alias = Path(sys.executable).with_name('python3')
        expected = os.stat(sys.executable)
        alias_info = os.stat(alias)
        require((alias_info.st_dev, alias_info.st_ino) == (expected.st_dev, expected.st_ino),
                'Bare Python alias is not the exact selected interpreter inode')
        completed = subprocess.run(['python3', '-I', '-B', '-c',
                                    'import os,sys,json; s=os.stat(sys.executable); print(json.dumps([s.st_dev,s.st_ino]))'],
                                   check=True, capture_output=True, timeout=2)
        require(len(completed.stdout) <= 256 and json.loads(completed.stdout) == [expected.st_dev, expected.st_ino],
                'Bare python3 did not execute the exact pinned interpreter')
        alias_readonly = verify_readonly_executable_alias(alias, [expected.st_dev, expected.st_ino])
        save_new(output, {'deniedPaths': denied, 'preparationHostAliasAbsent': True,
                          'visiblePrivateProcesses': identities, 'allVisibleProcRootAliasesChecked': True,
                          'pythonCommandAlias': {'path': str(alias), 'inode': [expected.st_dev, expected.st_ino],
                                                 'bareCommandExecuted': True, **alias_readonly}})
    elif mode == 'rename':
        path = Path('/pnd-fixture/node_modules') / STATE
        old = path.read_bytes()
        old_stat = path.stat()
        new = json.loads(old)
        new['lastValidatedTimestamp'] = time.time_ns() // 1000000
        temporary = path.parent / '.state-atomic-fixture'
        with temporary.open('xb') as stream:
            stream.write(json.dumps(new, indent=2).encode() + b'\n')
        os.chmod(temporary, stat.S_IMODE(old_stat.st_mode))
        os.replace(temporary, path)
        require(path.stat().st_ino != old_stat.st_ino and path.stat().st_nlink == 1, 'No private atomic replacement')
        save_new(output, {'state': file_identity(path, private=True), 'fixtureOnlyNotPnpm': True})
    elif mode == 'escape':
        pid = os.fork()
        if pid == 0:
            os.setsid()
            time.sleep(30)
            os._exit(0)
        time.sleep(0.4)
    elif mode == 'overflow':
        os.write(1, b'x' * (2 * 1024**2))
        time.sleep(30)
    elif mode == 'clock':
        save_new(output.with_name('producer-ready.json'), {'fixtureOnly': True, 'notApplicationReceipt': True})
        child = subprocess.Popen([sys.executable, '-I', '-B', '-c', 'import time; time.sleep(0.6)'], close_fds=True)
        save_new(output, {'fixtureOnly': True, 'capture': {'pid': child.pid}})
        require(child.wait() == 0, 'Clock sentinel child failed')
        time.sleep(1.4)  # A bounded stand-in for postverification, not producer time.
    elif mode == 'observer':
        time.sleep(30)
    else:
        raise ValueError('Unknown qualification fixture')


def finish_qualification_case(watch, limits, attempt, cleanup_context, case, failure=None, *, expected_fault=False):
    """Retain failed cases and secondary failures without erasing the primary one."""
    case['failure'] = failure_record(failure) if failure is not None else None
    case['cleanupFailure'] = case['finishFailure'] = case['resourceRecordingFailure'] = None
    case['resources'] = None
    finish_receipt = {}
    case['finishObservation'] = finish_receipt
    try:
        await_owned_cleanup(watch, limits, attempt, cleanup_context, phase='final')
    except BaseException as error:
        case['cleanupFailure'] = failure_record(error)
        if failure is None:
            failure = error
    try:
        deadline = cleanup_context.get('deadline')
        require(type(deadline) in (int, float) and math.isfinite(deadline), 'Original cleanup deadline missing')
        finish_observer(watch, expected_fault=expected_fault, result=case['result'],
                        cleanup_deadline=deadline, receipt=finish_receipt)
        finished = finish_receipt.get('finishedMonotonic')
        require(finish_receipt.get('joined') is True and type(finished) in (int, float) and
                math.isfinite(finished) and finished <= deadline,
                'Qualifier observer finish exceeded original cleanup deadline')
    except BaseException as error:
        case['finishFailure'] = failure_record(error)
        if failure is None:
            failure = error
    try:
        case['resources'] = watch.report()
    except BaseException as error:
        case['resourceRecordingFailure'] = failure_record(error)
        if failure is None:
            failure = error
    if failure is not None and case['failure'] is None:
        case['failure'] = failure_record(failure)
    return failure


def qualify_backend(reference, evidence, expected_adapter):
    """Explicit live generated-sentinel lane. Produces evidence, never self-acceptance.

    Requires a separately reviewed, exact tool closure. No user source, packages,
    pnpm, assets, existing state, binding changes or installations are involved.
    """
    require(file_identity(__file__)['sha256'] == expected_adapter, 'Qualification candidate bytes differ')
    spec = pinned_json(reference)
    require(set(spec) == {'version', 'kind', 'tools', 'toolRoots', 'limits'} and spec['version'] == VERSION and
            spec['kind'] == 'shared-execution-qualification-spec', 'Invalid qualifier specification')
    limits = Limits(**spec['limits'])
    require(limits.envelope_seconds <= 120 and limits.producer_seconds <= 10 and
            limits.owner_rss_bytes <= 512 * 1024**2 and limits.allocation_bytes <= 32 * 1024**2 and
            limits.raw_bytes <= 4 * 1024**2 and limits.evidence_bytes <= 16 * 1024**2,
            'Generated qualifier exceeds its reviewed ceiling')
    require(sys.platform == 'linux' and hasattr(os, 'pidfd_open') and hasattr(signal, 'pidfd_send_signal'),
            'Required Linux process APIs unavailable')
    tools = spec['tools']
    require(set(tools) == {'python', 'node', 'pnpm', 'bwrap', 'readonly', 'pnpmVersion'}, 'Unexpected qualifier tools')
    require(tools['node'] == tools['python'] and tools['pnpm'] == tools['python'] and
            tools['pnpmVersion'] == 'not-executed-sentinel-only', 'Qualifier must not execute real pnpm or Node')
    tool_roots = [exact_path(path) for path in tools['readonly']]
    require(all(safe_tool_root(path) for path in tool_roots) and HERE in tool_roots,
            'Qualifier needs a narrow tool closure including this exact helper directory')
    require(Path(sys.executable).resolve() == Path(tools['python']), 'Qualifier interpreter differs from pinned Python')
    require({str(path): inventory_hash(path) for path in tool_roots} == spec['toolRoots'], 'Qualification tool pins changed')
    for name in ('python', 'bwrap'):
        executable = exact_path(tools[name])
        require(any(executable == root or executable.is_relative_to(root) for root in tool_roots),
                'Unpinned qualifier executable')
    evidence = exact_path(str(evidence))
    runtime.physical(evidence.parent)
    require(not os.path.lexists(evidence) and not evidence.is_relative_to(HERE) and
            not any(evidence.is_relative_to(root) or root.is_relative_to(evidence) for root in tool_roots),
            'Qualifier needs a fresh isolated destination outside tool inputs')
    assert_capacity(host_snapshot(evidence.parent), limits, admission=True)
    evidence.mkdir(mode=0o700)
    protected = evidence / 'sentinels'
    protected.mkdir(mode=0o700)
    (protected / 'sentinel').write_bytes(b'protected generated sentinel\n')
    os.link(protected / 'sentinel', protected / 'alias')
    (protected / 'link').symlink_to('sentinel')
    (protected / STATE).write_bytes(b'{\n  "lastValidatedTimestamp": 1\n}\n')
    before = tree_inventory(protected)
    records = evidence / 'evidence'
    records.mkdir(mode=0o700)
    runtime_spec = {'tools': tools, 'runtime': {'path': '/pnd-fixture'}}
    results = {}
    state = None
    error = None
    started = time.monotonic()
    with envelope(limits.envelope_seconds) as deadline:
        try:
            for name in ('readonly', 'rename', 'frozen', 'clock', 'escape', 'overflow', 'observer'):
                attempt = records / name
                make_layout(attempt, stage='run')
                case = results[name] = {'result': None, 'resources': None}
                try:
                    watch = OwnerWatch(attempt, limits, started)
                except BaseException as failure:
                    case['failure'] = failure_record(failure)
                    raise
                actual_snapshot = watch.snapshot
                result = None
                cleanup_context = {}
                case_failure = None
                try:
                    mounts = [['rw', str(attempt / 'launch-root'), '/pnd-fixture'],
                              ['ro', str(protected), str(protected)], ['ro', str(HERE), str(HERE)]]
                    mounts.extend(['ro', str(path), str(path)] for path in tool_roots if path != HERE)
                    mounts.extend(['rw', str(attempt / leaf), str(attempt / leaf)] for leaf in PRIVATE_LEAVES
                                  if leaf != 'shm' and not leaf.startswith('module-'))
                    mounts.extend([['rw', str(attempt / 'tmp'), '/tmp'], ['rw', str(attempt / 'shm'), '/dev/shm']])
                    if name == 'rename':
                        private = attempt / 'modules-root'
                        private.mkdir(mode=0o700)
                        (private / STATE).write_bytes((protected / STATE).read_bytes())
                        mounts.append(['rw', str(private), '/pnd-fixture/node_modules'])
                    elif name == 'frozen':
                        require(state is not None, 'No generated state to freeze')
                        mounts.append(['ro', state['path'], '/pnd-fixture/node_modules/' + STATE])
                    plan = {'version': VERSION, 'mounts': mounts, 'namespaceRuntime': '/pnd-fixture',
                            'rootReadOnly': True, 'procReadOnly': True, 'privatePidNamespace': True, 'networkNamespace': False}
                    command = [tools['python'], '-I', '-B', str(HERE / 'shared_execution.py'), '_fixture', name,
                               str(protected), str(records / 'rename/modules-root'), str(attempt / 'control/result.json')]
                    if name == 'observer':
                        def failed_snapshot():
                            if watch.binding is not None:
                                raise QualificationObservationFault('Injected persistent qualification observation failure')
                            return actual_snapshot()
                        watch.snapshot = failed_snapshot
                    case_limits = replace(limits, producer_seconds=1) if name == 'clock' else limits
                    result = run_payload(runtime_spec, plan, attempt, command, case_limits, watch, expected_exe=tools['python'],
                                         producer_mode='inner' if name == 'clock' else 'gate',
                                         producer_receipt=attempt / 'control/producer-ready.json' if name == 'clock' else None)
                    case['result'] = result
                    if name == 'observer':
                        watch.snapshot = actual_snapshot
                        require_qualifier_observer_failure(result)
                        await_owned_cleanup(watch, limits, attempt, cleanup_context, phase='observer-recovery')
                        survivors = watch.survivors()
                        require(not survivors, 'Observer failure cleanup was not independently established')
                        save_new(attempt / 'independent-cleanup-proof.json',
                                 {'injectedFault': QUALIFIER_OBSERVER_FAULT, 'knownLiveSurvivors': survivors,
                                  'payloadOutcomeRetained': 'failed-or-unknown', 'payloadWasNotRelabeled': True})
                    elif name in ('escape', 'overflow'):
                        require(result['survivors'] == [], 'Escaped/overflow fixture did not clean up')
                        if name == 'overflow':
                            require(result['stopReason'] is not None, 'Expected overflow did not fail')
                            require(result['storedRawBytes'] == limits.outer_raw_bytes and
                                    result['observedRawBytes'] > limits.outer_raw_bytes, 'Raw cap not hard-bounded')
                        else:
                            binding = result['gateBinding']
                            require(binding is not None and any(row['pid'] != binding['hostPid'] and
                                    binding['hostPid'] in row['parents'] and row['pid'] in row['sessions'] and row['positiveRss']
                                    for row in watch.report()['history']), 'Escaped-session fixture was not positively observed')
                    else:
                        require(result['exitCode'] == 0 and result['stopReason'] is None and result['survivors'] == [],
                                'Generated qualification case failed: ' + name)
                    if name == 'clock':
                        receipt = json.loads((attempt / 'control/result.json').read_bytes())
                        bind_inner_producer(watch, receipt, result, tools['python'])
                        require(result['producer']['durationUpperBoundSeconds'] < 1 < result['wallSeconds'],
                                'Postverification incorrectly consumed producer time')
                    if name == 'rename':
                        path = attempt / 'modules-root' / STATE
                        state = {'path': str(path), 'identity': file_identity(path, private=True)}
                    if name == 'frozen':
                        require(file_identity(state['path'], private=True) == state['identity'], 'Frozen fixture state changed')
                    require(tree_inventory(protected) == before, 'Original sentinel or hardlink metadata changed')
                except BaseException as failure:
                    case_failure = failure
                finally:
                    watch.snapshot = actual_snapshot
                    case_failure = finish_qualification_case(watch, limits, attempt, cleanup_context, case,
                                                            case_failure, expected_fault=name == 'observer')
                if case_failure is not None:
                    raise case_failure
            require({str(path): inventory_hash(path) for path in tool_roots} == spec['toolRoots'], 'Qualifier tool input drift')
        except BaseException as failure:
            error = type(failure).__name__ + ': ' + str(failure)
        terminal = {'kind': 'shared-execution-qualification', 'adapterSha256': expected_adapter, 'error': error,
                    'platform': sys.platform, 'capabilities': list(CAPABILITIES) if error is None else [],
                    'cases': results, 'sentinelInputs': before, 'tools': spec['toolRoots'],
                    'selectedBackend': {name: tools[name] for name in ('python', 'bwrap')},
                    'pnpmExecuted': False, 'applicationExecuted': False,
                    'scope': 'Generated Linux containment only; separate independent acceptance required'}
        try:
            # Test-only protected hardlink sentinels are OUTSIDE this all-private evidence root.
            require(union_allocation([evidence]) <= limits.allocation_bytes, 'Full qualifier allocation exceeded')
            seal_receipt(records, terminal, limits, deadline)
        except BaseException as failure:
            error = (error or '') + '; qualification seal: ' + str(failure)
            signal.setitimer(signal.ITIMER_REAL, 2)
            try:
                save_new(records / 'seal-failed.json', {'status': 'failed-or-unknown', 'error': error[:4000]})
            except BaseException:
                pass
    return {'status': 'passed' if error is None else 'failed-or-unknown', 'error': error,
            'evidence': str(records), 'independentAcceptanceRequired': True}


def main(argv=None):
    argv = list(sys.argv[1:] if argv is None else argv)
    internal = {'_outer': outer_gate, '_gate': namespace_gate, '_prepare': inner_prepare,
                '_audit': inner_audit, '_fixture': qualification_fixture}
    if argv and argv[0] in internal:
        return internal[argv[0]](argv[1:])
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('action', choices=('plan', 'prepare-state', 'run', 'qualify'))
    parser.add_argument('--spec', required=True)
    parser.add_argument('--spec-sha256', required=True)
    parser.add_argument('--evidence')
    parser.add_argument('--expected-adapter-sha256')
    parser.add_argument('--stage', choices=('prepare-state', 'run'), default='run')
    args = parser.parse_args(argv)
    reference = {'path': args.spec, 'sha256': args.spec_sha256}
    if args.action == 'qualify':
        require(args.evidence and args.expected_adapter_sha256, 'Qualification needs fresh evidence and explicit candidate pin')
        result = qualify_backend(reference, exact_path(args.evidence), args.expected_adapter_sha256)
    else:
        spec, limits = load_spec(reference)
        if args.action == 'plan':
            result, _ = plan_execution(spec, limits, stage=args.stage,
                                       evidence=exact_path(args.evidence) if args.evidence else None)
        else:
            require(args.evidence and args.expected_adapter_sha256 == file_identity(__file__)['sha256'],
                    'Execution requires a fresh evidence path and exact adapter SHA-256')
            result = execute_stage(spec, limits, exact_path(args.evidence), stage=args.action)
    print(json.dumps(result, indent=2, sort_keys=True))
    return 0 if result['status'] in ('passed', 'plan-only') else 2


if __name__ == '__main__':
    try:
        raise SystemExit(main())
    except (ValueError, OSError, KeyError, subprocess.CalledProcessError) as error:
        print('shared execution: ' + str(error), file=sys.stderr)
        raise SystemExit(2)

