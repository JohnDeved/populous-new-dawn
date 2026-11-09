"""Warm, bound workspace planning for cloud-bootstrap.py; never seed shared stores.

Source creation uses private Git metadata and existing local Git objects. Runtime
preparation remains plan-only until a reviewed write-enforcement adapter exists.
"""
from contextlib import contextmanager
import hashlib
import json
import os
from pathlib import Path
import re
import subprocess
import sys
import uuid

sys.dont_write_bytecode = True
import shared_runtime as runtime
import shared_setup as setup

REPOSITORY = 'https://github.com/JohnDeved/populous-new-dawn.git'
EXCLUDED = ('public/original', '.codex')
OWNER = '.pnd-storage-owner.json'


@contextmanager
def local_git_only():
    """Process-local Git controls, not persistent configuration or auth changes."""
    previous = dict(os.environ)
    for key in list(os.environ):
        if key.startswith('GIT_'):
            del os.environ[key]
    os.environ.update(GIT_NO_LAZY_FETCH='1', GIT_NO_REPLACE_OBJECTS='1',
                      GIT_OPTIONAL_LOCKS='0', GIT_TERMINAL_PROMPT='0',
                      GIT_CONFIG_NOSYSTEM='1', GIT_CONFIG_GLOBAL='/dev/null',
                      GIT_ALLOW_PROTOCOL='file', GIT_CONFIG_COUNT='3',
                      GIT_CONFIG_KEY_0='protocol.allow', GIT_CONFIG_VALUE_0='never',
                      GIT_CONFIG_KEY_1='core.hooksPath', GIT_CONFIG_VALUE_1='/dev/null',
                      GIT_CONFIG_KEY_2='core.fsmonitor', GIT_CONFIG_VALUE_2='false')
    try:
        yield
    finally:
        os.environ.clear()
        os.environ.update(previous)


def git(source, *args, data=None):
    return subprocess.run(['git', '-C', str(source), *map(str, args)], input=data,
                          check=True, stdout=subprocess.PIPE, stderr=subprocess.PIPE,
                          timeout=120).stdout


def read_json(path):
    data, _ = setup.read_metadata(path)
    return json.loads(data), hashlib.sha256(data).hexdigest()


def owned_binding(path, expected):
    runtime.require(re.fullmatch('[a-f0-9]{64}', expected or ''),
                    'An explicit binding SHA-256 is required')
    binding, actual = read_json(Path(path))
    runtime.require(actual == expected, 'Storage binding hash differs')
    runtime.require(binding.get('schema') == 1 and binding.get('repository') == REPOSITORY,
                    'Unsupported storage binding')
    runtime.require(re.fullmatch('[A-Za-z0-9][A-Za-z0-9_-]{0,63}', binding.get('storageId', '')),
                    'Invalid storage identity')
    runtime.require(set(binding.get('roots', {})) == {'shared', 'workspaces', 'store', 'assets'},
                    'Binding must name all four existing owned roots')
    roots = {}
    for name, item in binding['roots'].items():
        path = item['path']
        runtime.require(isinstance(path, str) and Path(path).is_absolute() and
                        str(Path(path)) == path and '..' not in Path(path).parts,
                        'Binding paths must be normalized absolute paths')
        root = runtime.physical(path)
        info = root.stat()
        runtime.require(info.st_uid == os.getuid(), 'Bound roots must be owned by the current user')
        runtime.require([info.st_dev, info.st_ino] == [item['device'], item['inode']],
                        f'Bound {name} root is missing, replaced or relocated')
        runtime.require(setup.filesystem_type(root) not in ('unknown', 'tmpfs', 'ramfs'),
                        'Bound storage needs known non-RAM-backed filesystem evidence')
        roots[name] = root
    shared, workspaces = roots['shared'], roots['workspaces']
    runtime.require(not any((parent / 'package.json').exists() for parent in (workspaces, *workspaces.parents)),
                    'Private workspace root must be outside Node package scope')
    runtime.require(not runtime.within(shared, workspaces) and not runtime.within(workspaces, shared),
                    'Shared and workspace roots must be separate and nonnested')
    runtime.require(roots['store'] == shared / 'pnpm-store' / 'v11' and
                    roots['assets'] == shared / 'assets', 'Conflicting named store or asset pool')
    runtime.require(len({path.stat().st_dev for path in roots.values()}) == 1,
                    'All binding roots must share a filesystem')
    owner = {'schema': 1, 'storageId': binding['storageId'], 'bindingSha256': expected}
    for root in (shared, workspaces):
        runtime.require(read_json(root / OWNER)[0] == owner, 'Missing or conflicting root ownership')
    return binding, roots


def git_metadata(source, donor_objects=None):
    """Standalone physical metadata only; linked/alternate-backed donors are unsupported.

    Targets may share exactly the one approved standalone donor object database.
    Directory identities and private metadata hashes detect later layout drift.
    This is read-only validation, not containment against concurrent replacement.
    """
    source = runtime.physical(source)
    directory = source / '.git'
    runtime.require(directory.is_dir() and not directory.is_symlink(),
                    'Only standalone physical .git directories are supported')
    runtime.physical(directory)
    runtime.require(not os.path.lexists(directory / 'commondir'),
                    'Redirected Git common directory is unsupported')
    actual = Path(git(source, 'rev-parse', '--absolute-git-dir').decode().strip())
    common = Path(git(source, 'rev-parse', '--path-format=absolute', '--git-common-dir').decode().strip())
    runtime.require(actual == common == directory, 'Git metadata must remain local and private')
    directories = {}
    for name in ('', 'objects', 'objects/info', 'objects/pack', 'refs', 'info'):
        if name == 'info' and not os.path.lexists(directory / name):
            continue  # A valid template-free, non-sparse donor need not have .git/info.
        path = runtime.physical(directory / name)
        info = path.stat()
        runtime.require(info.st_uid == os.getuid(), 'Git metadata must be owned by the current user')
        runtime.require(info.st_dev == source.stat().st_dev, 'Git metadata must remain on the source filesystem')
        directories[name or '.'] = {'path': str(path), 'device': info.st_dev, 'inode': info.st_ino}
    runtime.require(not os.path.lexists(directory / 'objects/info/http-alternates'),
                    'HTTP object alternates are unsupported')
    alternate = directory / 'objects/info/alternates'
    if donor_objects is None:
        runtime.require(not os.path.lexists(alternate), 'Alternate-backed donors are unsupported')
        alternate_identity = None
    else:
        donor_objects = runtime.physical(donor_objects)
        contents, _ = setup.read_metadata(alternate)
        runtime.require(contents == (str(donor_objects) + '\n').encode(),
                        'Target alternates differ from the approved donor object database')
        info = donor_objects.stat()
        alternate_info = alternate.stat()
        alternate_identity = {'path': str(donor_objects), 'device': info.st_dev, 'inode': info.st_ino,
                              'fileDevice': alternate_info.st_dev, 'fileInode': alternate_info.st_ino,
                              'sha256': hashlib.sha256(contents).hexdigest()}
    metadata = {}
    for name in ('HEAD', 'config', 'index', 'config.worktree', 'info/sparse-checkout'):
        path = directory / name
        if name in ('HEAD', 'config', 'index') or os.path.lexists(path):
            contents, _ = setup.read_metadata(path)
            info = path.stat()
            metadata[name] = {'device': info.st_dev, 'inode': info.st_ino,
                              'sha256': hashlib.sha256(contents).hexdigest()}
    registered = setup.registered_worktrees(source)
    if donor_objects is not None:
        runtime.require(registered == (source,), 'Unexpected target worktree registration')
    return {'directories': directories, 'metadata': metadata, 'alternate': alternate_identity,
            'registeredWorktrees': [str(path) for path in registered]}


def source_identity(source, revision, *, donor_objects=None, complete=False):
    source = runtime.physical(source)
    git_identity = git_metadata(source, donor_objects)
    identity = setup.source_identity(source, revision)
    runtime.require(not identity['worktreeStatus'].strip(), 'Source has changes; preserved untouched')
    flags = {record[2:].decode('utf-8'): chr(record[0])
             for record in git(source, 'ls-files', '-v', '-z').split(b'\0') if record}
    runtime.require(all(flag in ('H', 'S') for flag in flags.values()),
                    'Masked source index is unsupported')
    entries = []
    for record in git(source, 'ls-tree', '-r', '-l', '-z', revision).split(b'\0'):
        if not record:
            continue
        metadata, name = record.split(b'\t', 1)
        mode, kind, oid, size = metadata.decode().split()
        name = name.decode('utf-8')
        runtime.safe_relative(name)
        runtime.require(kind == 'blob' and mode in ('100644', '100755'),
                        f'Unsupported tracked entry: {name}')
        entries.append({'path': name, 'mode': mode, 'oid': oid, 'bytes': int(size)})
    runtime.require(set(flags) == {entry['path'] for entry in entries}, 'Source index paths differ from commit')
    omitted, authenticated = [], 0
    for entry in entries:
        if excluded(entry['path']):
            continue  # Source-only mode deliberately does not authenticate asset/executor payload.
        path = source / entry['path']
        if os.path.lexists(path):
            runtime.physical(path.parent)
            runtime.regular_bytes(path, entry)
            runtime.require(bool(path.stat().st_mode & 0o111) == (entry['mode'] == '100755'),
                            f'Source executable mode changed: {entry["path"]}')
            authenticated += 1
        else:
            runtime.require(not complete and flags.get(entry['path']) == 'S',
                            f'Missing required source projection: {entry["path"]}')
            omitted.append(entry['path'])
    runtime.require(setup.source_identity(source, revision) == identity, 'Source metadata changed during verification')
    runtime.require(git_metadata(source, donor_objects) == git_identity, 'Git metadata changed during verification')
    identity['tree'] = git(source, 'rev-parse', revision + '^{tree}').decode().strip()
    identity['gitMetadata'] = git_identity
    identity['workingFiles'] = {'authenticatedNonexcludedFiles': authenticated,
                               'authenticatedDonorSparseOmissions': omitted,
                               'excludedPayloadNotAuthenticated': list(EXCLUDED),
                               'completeRequestedProjection': complete}
    return identity, entries


def excluded(name):
    return any(name == prefix or name.startswith(prefix + '/') for prefix in EXCLUDED)


def workspace_plan(args):
    binding, roots = owned_binding(args.binding, args.binding_sha256)
    source = runtime.physical(args.source)
    identity, entries = source_identity(source, args.ref)
    for root in (roots['shared'], roots['workspaces']):
        for worktree in setup.registered_worktrees(source):
            runtime.require(not runtime.within(root, worktree) and not runtime.within(worktree, root),
                            'Bound storage overlaps a registered worktree')
    runtime.require(re.fullmatch('[A-Za-z0-9][A-Za-z0-9_-]{0,63}', args.worktree or ''),
                    'An explicit safe worker name is required')
    job = roots['workspaces'] / args.worktree
    runtime.physical(job, absent=True)
    target = job / 'source'
    admission = setup.storage_plan(source, str(roots['shared']), args.reserve_bytes, args.allocation_bytes)
    runtime.require(source.stat().st_dev == roots['workspaces'].stat().st_dev,
                    'Source and private workspaces need the same filesystem')
    # This covers working files conservatively, not arbitrary Git metadata or output.
    block = max(4096, os.statvfs(roots['workspaces']).f_frsize)
    estimate = sum(((e['bytes'] + block - 1) // block + 2) * block
                   for e in entries if not excluded(e['path'])) + 1024 * 1024
    runtime.require(args.allocation_bytes >= estimate, 'Source estimate exceeds declared allocation')
    state = {'schema': 1, 'storageId': binding['storageId'], 'bindingSha256': args.binding_sha256,
             'revision': args.ref, 'tree': identity['tree'], 'source': str(target),
             'donor': str(source), 'donorGit': identity['gitMetadata'], 'mode': 'source', 'excludes': list(EXCLUDED)}
    exists = job.exists()
    if exists:
        saved = read_json(job / 'workspace.json')[0]
        runtime.require({key: value for key, value in saved.items() if key != 'sourceGit'} == state,
                        'Existing workspace ownership or revision differs; preserved untouched')
        current, _ = source_identity(target, args.ref, donor_objects=source / '.git/objects', complete=True)
        runtime.require(current['tree'] == identity['tree'], 'Existing workspace tree differs')
        runtime.require(saved.get('sourceGit') == current['gitMetadata'], 'Existing private Git metadata changed')
        runtime.require(not os.path.lexists(target / 'node_modules'), 'Source-only workspace has dependencies')
        for prefix in EXCLUDED:
            runtime.require(not os.path.lexists(target / prefix), 'Source-only excluded path materialized')
    result = {'schema': 1, 'status': 'planned', 'mode': args.mode, 'allocates': False,
              'network': 'offline-only; no fetch, install or online fallback',
              'bindingSha256': args.binding_sha256, 'storageId': binding['storageId'],
              'sourceIdentity': identity, 'storage': admission, 'workspaceState': state,
              'sourceAllocationEstimateBytes': estimate, 'reusesWorkspace': exists,
              'dependenciesInstalled': False, 'assetsMaterialized': False,
              'implementationSha256': {path.name: hashlib.sha256(path.read_bytes()).hexdigest()
                                       for path in (Path(__file__), Path(setup.__file__), Path(runtime.__file__),
                                                    Path(__file__).parent.parent / 'cloud-bootstrap.py')},
              'limits': ['Capacity snapshot only, not a quota, reservation or memory cap.',
                         'Local filesystem survival is not guaranteed; source uses donor Git objects.',
                         'Pathname-based creation is not containment against concurrent root replacement.',
                         'Missing inputs fail closed; cold recovery and authentication are separate.']}
    if args.mode == 'runtime':
        runtime.require(not os.path.lexists(job / 'runtime'), 'Runtime target exists; preserve and review it')
        # Compose maintained verification; never create a pool or seed a second store.
        runtime.physical(roots['store'] / 'files')
        runtime.require(any((roots['store'] / 'files').iterdir()), 'Named pnpm store is empty')
        source_state = runtime.source_state(source, args.ref)
        reader = runtime.Blobs(source)
        assets = []
        try:
            for entry in source_state['entries']:
                if entry['path'].startswith(runtime.ASSETS + '/'):
                    assets.append({**entry, 'sha256': runtime.digest(reader.read(entry))})
        finally:
            reader.close()
        runtime.check_tree(roots['assets'], source_state['assetTree'], assets)
        result['runtime'] = {
            'status': 'plan-only', 'runtime': str(job / 'runtime'), 'pool': str(roots['assets']),
            'dependencyStore': str(roots['store']), 'packageManager': setup.MANAGER,
            'privatePaths': [str(job / p) for p in ('pnpm-cache', 'home', 'tmp', 'xdg-cache', 'xdg-config', 'xdg-state')],
            'privateRuntimePaths': ['node_modules/.pnpm', 'node_modules/.bin', 'node_modules/.modules.yaml',
                                   'node_modules/.pnpm-workspace-state-v1.json',
                                   'node_modules/.vite', 'node_modules/.vite-temp', 'node_modules/.cache',
                                   'work', 'dist', '.wrangler'],
            'prepareHelper': 'scripts/orchestration/shared_runtime.py prepare',
            'prepareArgv': ['python3', 'scripts/orchestration/shared_runtime.py', 'prepare',
                            '--source', str(target), '--revision', args.ref, '--pool', str(roots['assets']),
                            '--runtime', str(job / 'runtime'), '--scope', 'build',
                            '--reserve-bytes', str(args.reserve_bytes)],
            'installCwd': str(job / 'runtime'),
            'installArgv': ['pnpm', 'install', '--frozen-lockfile', '--offline', '--ignore-scripts',
                            '--store-dir', str(roots['store']), '--cache-dir', str(job / 'pnpm-cache')],
            'readinessHelper': 'scripts/orchestration/shared_runtime.py ready',
            'readinessArgv': ['python3', 'scripts/orchestration/shared_runtime.py', 'ready',
                              '--source', str(target), '--revision', args.ref, '--pool', str(roots['assets']),
                              '--runtime', str(job / 'runtime'), '--dependency-store', str(roots['store'])],
            'blockers': ['Reviewed write-enforcing adapter and serialized resource-lane release required.',
                         'Pinned pnpm binary, complete offline closure and runtime budgets not qualified by plan.',
                         'No package projection, install, native smoke, build or runtime execution implemented.']}
    runtime.require(owned_binding(args.binding, args.binding_sha256) == (binding, roots),
                    'Binding changed during planning')
    runtime.require(source_identity(source, args.ref)[0] == identity, 'Source changed during planning')
    return result


def apply_source(args):
    runtime.require(args.mode == 'source', 'Runtime mode is plan-only pending reviewed runner integration')
    plan = workspace_plan(args)
    if plan['reusesWorkspace']:
        return {**plan, 'status': 'reused', 'allocates': False}
    state = plan['workspaceState']
    target, donor = Path(state['source']), Path(state['donor'])
    job = target.parent
    job.mkdir()  # Exclusive ownership, including unknown/interrupted prior attempts.
    receipt = job / ('attempt-' + uuid.uuid4().hex + '.json')
    outcome = {'status': 'unknown', 'receipt': str(receipt), 'plan': plan}
    # Reuse the existing descriptor-pinned evidence owner, never reopen a mutable
    # receipt path for writing or replace earlier evidence after an interrupted run.
    with runtime.OwnedEvidence(receipt) as evidence:
        evidence.write_receipt(outcome)
        try:
            # Local objects only, no full asset checkout and no writes to the donor's index/refs.
            git(job, '-c', 'protocol.file.allow=always', 'clone', '--local', '--shared',
                '--no-checkout', '--template=', donor, target)
            evidence.validate()
            patterns = '/*\n' + ''.join(f'!/{prefix}/\n' for prefix in EXCLUDED)
            git(target, 'sparse-checkout', 'set', '--no-cone', '--stdin', data=patterns.encode())
            evidence.validate()
            git(target, 'checkout', '--detach', args.ref)
            actual, _ = source_identity(target, args.ref, donor_objects=donor / '.git/objects', complete=True)
            runtime.require(actual['tree'] == state['tree'], 'New source tree differs')
            for prefix in (*EXCLUDED, 'node_modules'):
                runtime.require(not os.path.lexists(target / prefix), 'Unexpected source-only payload')
            runtime.require(source_identity(donor, args.ref)[0] == plan['sourceIdentity'], 'Donor changed')
            owned_binding(args.binding, args.binding_sha256)
            fs = os.statvfs(job)
            runtime.require(fs.f_bavail * fs.f_frsize >= args.reserve_bytes, 'Post-create reserve consumed')
            evidence.validate()
            with (job / 'workspace.json').open('x') as output:
                json.dump({**state, 'sourceGit': actual['gitMetadata']}, output, indent=2)
            outcome.update(status='prepared-source-only', source=str(target), dependenciesInstalled=False,
                           assetsMaterialized=False, runtimeExecuted=False)
        except Exception as error:
            outcome.update(status='blocked', error=str(error), partialOutput='Retained; never automatically removed or adopted')
            raise
        finally:
            evidence.write_receipt(outcome)
    return outcome


def execute(args):
    with local_git_only():
        return apply_source(args) if args.apply else workspace_plan(args)
