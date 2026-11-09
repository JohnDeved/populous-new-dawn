"""Fresh hosted checkout admission. Never installs, adopts or repairs inputs.

A generated profile is a review input, not acceptance. Its exact bytes must be
pinned in the independently reviewed execution spec. Old-host inode receipts are
not imported. The unchanged execution backend still needs actual-host qualification.
"""
import hashlib
import json
import os
from pathlib import Path, PurePosixPath
import selectors
import stat
import subprocess
import time
import controller as policy

HERE = Path(__file__).resolve().parent
MANIFEST_SHA = 'ec9e4bb3de7cd2f3578560040f542f0e49fcdf3b3cf4efe68c67cc94bd7d2432'
PRIVATE_OUTPUTS = ('work', 'dist', '.wrangler', '.next', '.vinext', '.fallow')
CACHES = ('.vite', '.vite-temp', '.cache')
PNPM_VERSION = '11.25.0'
MAX_GIT_BYTES = 2 * 1024 * 1024


def encoded(value):
    return json.dumps(value, sort_keys=True, separators=(',', ':'), ensure_ascii=True).encode()


def key(path):
    info = path.lstat()
    return [info.st_dev, info.st_ino, info.st_size, info.st_mtime_ns,
            info.st_ctime_ns, info.st_mode, info.st_nlink]


def relative(name):
    path = PurePosixPath(name)
    policy.require(type(name) is str and name and not path.is_absolute() and
                   str(path) == name and '..' not in path.parts and
                   '.git' not in path.parts and '\0' not in name, 'Unsafe tracked path')
    return name


def manifest():
    value = json.loads((HERE / 'portable-served-manifest.json').read_bytes())
    policy.require(hashlib.sha256(encoded(value)).hexdigest() == MANIFEST_SHA,
                   'Frozen served manifest differs')
    policy.require(value['commit'] == policy.REVISION and value['tree'] == policy.TREE,
                   'Frozen source identity differs')
    return value


def git_read(git, root, args, seconds=15):
    """Bounded no-network, no-hooks read. Outer owner supervisor remains required."""
    policy.require(args[0] in ('rev-parse', 'ls-tree', 'status', 'diff'), 'Unsupported Git operation')
    git, root = policy.physical(git), policy.physical(root)
    env = {'PATH': '/usr/bin:/bin', 'HOME': '/nonexistent', 'LANG': 'C', 'LC_ALL': 'C',
           'GIT_CONFIG_NOSYSTEM': '1', 'GIT_CONFIG_GLOBAL': '/dev/null',
           'GIT_OPTIONAL_LOCKS': '0', 'GIT_NO_REPLACE_OBJECTS': '1',
           'GIT_NO_LAZY_FETCH': '1', 'GIT_ALLOW_PROTOCOL': '', 'GIT_TERMINAL_PROMPT': '0'}
    command = [str(git), '-c', 'core.fsmonitor=false', '-c', 'core.hooksPath=/dev/null',
               '-c', 'core.untrackedCache=false', '-c', 'diff.external=', '-C', str(root), *args]
    process = subprocess.Popen(command, stdin=subprocess.DEVNULL, stdout=subprocess.PIPE,
                               stderr=subprocess.PIPE, env=env, close_fds=True)
    end = time.monotonic() + seconds
    streams = {'stdout': bytearray(), 'stderr': bytearray()}
    try:
        with selectors.DefaultSelector() as selector:
            for name in streams:
                pipe = getattr(process, name)
                os.set_blocking(pipe.fileno(), False)
                selector.register(pipe, selectors.EVENT_READ, name)
            while selector.get_map() or process.poll() is None:
                policy.require(time.monotonic() < end, 'Git read deadline')
                for item, _ in selector.select(.05):
                    data = os.read(item.fd, 65536)
                    if not data:
                        selector.unregister(item.fileobj)
                    else:
                        streams[item.data].extend(data)
                        policy.require(sum(map(len, streams.values())) <= MAX_GIT_BYTES, 'Git raw cap')
        policy.require(process.wait(timeout=1) == 0 and not streams['stderr'], 'Git read failed')
        return bytes(streams['stdout'])
    finally:
        if process.poll() is None:
            process.kill()
        process.wait(timeout=2)
        process.stdout.close()
        process.stderr.close()


def tree_rows(raw):
    policy.require(raw.endswith(b'\0') and len(raw) <= MAX_GIT_BYTES, 'Incomplete tree listing')
    rows = []
    for record in raw[:-1].split(b'\0'):
        header, name = record.split(b'\t', 1)
        mode, kind, oid = header.decode('ascii').split(' ')
        name = relative(name.decode('utf-8'))
        policy.require(kind == 'blob' and mode in ('100644', '100755', '120000'), 'Unsupported Git tree entry')
        policy.require(len(oid) == 40 and all(c in '0123456789abcdef' for c in oid), 'Malformed Git blob')
        rows.append({'path': name, 'mode': mode, 'oid': oid})
    policy.require(len(rows) == len({row['path'] for row in rows}), 'Duplicate Git paths')
    return rows


def verify_tracked(root, rows, served):
    """Hash every tracked payload, not Git's possibly cached stat verdict."""
    wanted = {row['path']: row for row in served}
    seen = set()
    records = {}
    for row in rows:
        name = relative(row['path'])
        path = policy.physical(root / name) if row['mode'] != '120000' else policy.physical((root/name).parent)/Path(name).name
        before = key(path)
        if row['mode'] == '120000':
            policy.require(stat.S_ISLNK(before[5]) and name not in wanted, 'Served source cannot be a symlink')
            link = os.readlink(path)
            policy.require(not os.path.isabs(link) and (path.parent/link).resolve().is_relative_to(root),
                           'Tracked symlink escapes checkout')
            data = os.fsencode(link)
            oid = hashlib.sha1(f'blob {len(data)}\0'.encode()+data).hexdigest()
            digest = hashlib.sha256(data).hexdigest()
        else:
            policy.require(stat.S_ISREG(before[5]) and bool(before[5] & 0o111) == (row['mode'] == '100755'),
                           'Tracked type/mode differs')
            sha = hashlib.sha256()
            git = hashlib.sha1(f'blob {before[2]}\0'.encode())
            count = 0
            with path.open('rb') as stream:
                while chunk := stream.read(65536):
                    count += len(chunk)
                    policy.require(count <= before[2], 'Tracked file grew')
                    sha.update(chunk)
                    git.update(chunk)
            policy.require(count == before[2], 'Tracked file truncated')
            oid, digest = git.hexdigest(), sha.hexdigest()
        policy.require(key(path) == before and oid == row['oid'], 'Tracked bytes or identity differ')
        if name in wanted:
            expected = wanted[name]
            policy.require(row == {k: expected[k] for k in ('path', 'mode', 'oid')} and
                           before[2] == expected['bytes'] and digest == expected['sha256'], 'Served bytes differ')
            seen.add(name)
        records[name] = {'key': before, 'oid': oid, 'sha256': digest}
    policy.require(seen == set(wanted), 'Missing served source')
    return hashlib.sha256(encoded(records)).hexdigest()


def validate_dependencies(root):
    modules = policy.physical(root / 'node_modules')
    policy.require(modules.is_dir(), 'Installed dependencies required')
    for base, directories, files in os.walk(modules, followlinks=False):
        if Path(base) == modules:
            directories[:] = [name for name in directories if name not in CACHES]
        for name in directories + files:
            path = Path(base) / name
            if path.is_symlink():
                link = os.readlink(path)
                policy.require(not os.path.isabs(link) and path.resolve().is_relative_to(modules),
                               'Dependency symlink escapes read-only module tree')
                policy.require(path.exists(), 'Dangling dependency symlink')
    for name in CACHES:
        path = policy.physical(modules / name)
        policy.require(path.is_dir(), 'Private cache mountpoint must be prepared explicitly: ' + name)
    for name in ('.modules.yaml', '.pnpm/lock.yaml', '.pnpm-workspace-state-v1.json'):
        policy.require(policy.physical(modules / name).is_file(), 'Missing installed metadata: ' + name)


def inspect(shared, root, git):
    root = policy.physical(root)
    policy.require(root.is_dir() and policy.physical(root/'.git').is_dir(), 'Physical standalone checkout required')
    policy.require(not (root/'.git/objects/info/alternates').exists(), 'External Git object provider not admitted')
    policy.require(git_read(git, root, ['rev-parse', '--show-toplevel']).strip().decode() == str(root) and
                   git_read(git, root, ['rev-parse', '--absolute-git-dir']).strip().decode() == str(root/'.git'),
                   'Git metadata redirects outside checkout')
    source = manifest()
    policy.require(git_read(git, root, ['rev-parse', 'HEAD']).strip().decode() == policy.REVISION and
                   git_read(git, root, ['rev-parse', 'HEAD^{tree}']).strip().decode() == policy.TREE,
                   'Exact candidate checkout required')
    policy.require(not git_read(git, root, ['status', '--porcelain=v1', '--untracked-files=all', '-z']) and
                   not git_read(git, root, ['diff', '--raw', '--no-ext-diff', '--no-textconv', 'HEAD', '--']),
                   'Candidate checkout is dirty')
    rows = tree_rows(git_read(git, root, ['ls-tree', '-r', '-z', policy.TREE]))
    policy.require(len(rows) == source['completeIndexedEntries'], 'Full tracked tree required, not sparse omissions')
    tracked = verify_tracked(root, rows, source['entries'])
    validate_dependencies(root)
    children = sorted(path.name for path in root.iterdir())
    expected = {row['path'].split('/')[0] for row in rows} | {'.git', 'node_modules'}
    policy.require(set(children) - set(PRIVATE_OUTPUTS) == expected, 'Unexpected checkout-root member')
    policy.require(not (set(PRIVATE_OUTPUTS) & {row['path'].split('/')[0] for row in rows}),
                   'Private output would hide tracked source')
    protected = [name for name in children if name not in PRIVATE_OUTPUTS]
    policy.require(not any((root/name).is_symlink() for name in protected), 'Root source symlinks unsupported')
    inventories = {str(root/name): shared.inventory_hash(root/name, ignore_caches=name == 'node_modules')
                   for name in protected}
    return {'source': {'commit': policy.REVISION, 'tree': policy.TREE, 'status': '', 'untracked': []},
            'trackedPayloadSha256': tracked, 'inventory': inventories,
            'rootChildren': protected, 'servedEntries': source['servedEntries'],
            'assetEntries': source['assetEntries'], 'completeTrackedEntries': len(rows)}


def installation(reference, shared, root):
    receipt = shared.pinned_json(reference)
    # The exact receipt/reference is reviewed externally. This validates its
    # declared binding; it does not remotely attest execution or authorize install.
    policy.require(receipt['kind'] == 'material-hosted-installation' and receipt['exitCode'] == 0 and
                   receipt['sourceCommit'] == policy.REVISION and receipt['sourceTree'] == policy.TREE and
                   receipt['checkout'] == str(root) and receipt['pnpmVersion'] == PNPM_VERSION and
                   receipt['frozenLockfile'] is True and receipt['ignoreScripts'] is True and
                   receipt['lockSha256'] == policy.sha256_file(root/'pnpm-lock.yaml'),
                   'Pinned installation provenance differs')
    return receipt


def build_profile(shared, root, git, evidence_parent, installation_reference):
    """Read-only preparation under separately admitted outer resource limits."""
    root, parent, git = map(policy.physical, (root, evidence_parent, git))
    policy.require(parent.is_dir() and parent.stat().st_uid == os.getuid() and
                   not parent.is_relative_to(root) and not root.is_relative_to(parent), 'Separate owned evidence parent required')
    installation(installation_reference, shared, root)
    before = inspect(shared, root, git)
    after = inspect(shared, root, git)
    policy.require(before == after, 'Checkout changed during preparation')
    return {'version': 2, 'kind': 'fresh-host-material-projection', 'namespaceRuntime': str(root),
            'evidenceParent': str(parent), 'git': str(git), 'installation': installation_reference,
            'sourceAdmission': {'path': str(HERE/'target_admission.py'),
                                'sha256': policy.sha256_file(HERE/'target_admission.py')},
            'baseline': before, 'applicationMounts': [[str(root/name), str(root/name)] for name in before['rootChildren']],
            'browserExecuted': False, 'executionAccepted': False}


def inputs(shared, spec, profile):
    policy.require(set(profile) == {'version','kind','namespaceRuntime','evidenceParent','git','installation',
                                  'sourceAdmission','baseline','applicationMounts','browserExecuted','executionAccepted'},
                   'Unexpected fresh projection fields')
    policy.require(profile['version'] == 2 and profile['kind'] == 'fresh-host-material-projection' and
                   profile['browserExecuted'] is False and profile['executionAccepted'] is False,
                   'Fresh projection is preparation only')
    root = policy.physical(profile['namespaceRuntime'])
    policy.require(profile['sourceAdmission'] == {'path': str(HERE/'target_admission.py'),
                    'sha256': policy.sha256_file(HERE/'target_admission.py')}, 'Wrong fresh admission helper')
    installation(profile['installation'], shared, root)
    actual = inspect(shared, root, profile['git'])
    policy.require(actual == profile['baseline'], 'Fresh checkout/dependencies changed')
    expected = [[str(root/name), str(root/name)] for name in actual['rootChildren']]
    policy.require(profile['applicationMounts'] == expected, 'Fresh read-only mounts differ')
    return profile, actual['inventory']
