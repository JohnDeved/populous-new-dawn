"""One authorized baseline, existing receipt helper, exclusive dependency return."""
import datetime
import gzip
import hashlib
import json
import os
from pathlib import Path
import signal
import subprocess
import time

ROOT = Path.cwd()
DONOR = ROOT.parent / 'preacher-automatic-response-qa-20261006'
SOURCE_DEPS, DEPS = DONOR / 'node_modules', ROOT / 'node_modules'
NODE = '/opt/codex/runtimes/codex-primary-runtime/dependencies/node/bin/node'
SCRIPT = 'decomp/research/hut-smoke-state-exit/capture-live-ignition-draft.mjs'
NATIVE = 'references/verification/hut-smoke-state-exit-2026-10-06/attempt-02/stdout.json'
BASE = 'work/orchestration/hut-smoke-state-exit/live-baseline-host-01'
OUTPUT = ROOT / BASE
COMMAND_RECEIPT = 'work/orchestration/hut-smoke-state-exit/live-baseline-01.json'
LOCK = '65e45d0a87d1ecd4fbf56508b9821eb3bfb3867c8477db4aaa1452eb2bed13d8'
ROOT_LOCK = 'c1599d8d7e3f028e290a13561c653cf926e739e98eb9ec1b476dbe1c2a4558ba'
sha = lambda path: hashlib.sha256(Path(path).read_bytes()).hexdigest()
now = lambda: datetime.datetime.now(datetime.timezone.utc).isoformat()
git = lambda *args: subprocess.check_output(['git', *args], cwd=ROOT).decode().strip()
assert git('rev-parse', 'HEAD') == '1d62a8181432b65106fe77f77b9f48cb07d95194'
assert not git('status', '--porcelain')
assert not git('diff', '--name-only', '1c7e6b05687aca14d9350e17c7ae14dc6c68bb97',
               'HEAD', '--', 'app', 'tests/support', 'tests/level-start-fixture.mjs',
               'package.json', 'package-lock.json')
assert sha(ROOT / SCRIPT) == 'b2e40bb1a451d87d194db4508188aa3829b256dbdd73bd101474457ad400ff51'
assert sha(ROOT / NATIVE) == 'a20ab0ea632b582f74bd24d5c14d968b4cb11d8d3d5f3f5a7e75fe20b311d3c7'
assert sha(ROOT / 'package-lock.json') == sha(DONOR / 'package-lock.json') == ROOT_LOCK
assert sha(SOURCE_DEPS / '.package-lock.json') == LOCK
assert not DEPS.exists() and not DEPS.is_symlink()
identity = (SOURCE_DEPS.stat().st_dev, SOURCE_DEPS.stat().st_ino)
assert identity == (27, 1978923) and ROOT.stat().st_dev == 27
assert not SOURCE_DEPS.is_symlink()
assert {0, 1, 2, 3} <= os.sched_getaffinity(0)
OUTPUT.mkdir(parents=True, exist_ok=False)
receipt = {'status': 'prepared', 'startedAt': now(), 'head': git('rev-parse', 'HEAD'),
           'appCorrespondence': '1c7e6b05687aca14d9350e17c7ae14dc6c68bb97',
           'donor': str(SOURCE_DEPS), 'borrower': str(DEPS), 'dependencyIdentity': identity,
           'installedLockSha256': LOCK, 'rootLockSha256': ROOT_LOCK, 'cpuAffinity': [0, 1, 2, 3],
           'hostRunnerSha256': sha(__file__), 'nativeInputSha256': sha(ROOT / NATIVE),
           'toolSha256': {path: sha(path) for path in [NODE, '/usr/bin/timeout']},
           'nativeOrBaselineRetry': False, 'dependenciesReturned': False}


def save():
    temp = OUTPUT / 'receipt.tmp'
    temp.write_text(json.dumps(receipt, indent=2) + '\n')
    temp.replace(OUTPUT / 'receipt.json')


def inventory_tree(path):
    rows = {}
    for item in sorted(path.rglob('*')):
        name = str(item.relative_to(path))
        if item.is_symlink():
            assert item.resolve().is_relative_to(path.resolve()), name
            rows[name] = {'symlink': os.readlink(item)}
        elif item.is_file():
            rows[name] = {'sha256': sha(item), 'bytes': item.stat().st_size}
    return rows


def owned_session(session):
    rows = []
    for path in Path('/proc').glob('[0-9]*/stat'):
        try:
            text = path.read_text()
            parts = text[text.rfind(')') + 2:].split()
            if int(parts[3]) == session:
                rows.append({'pid': int(path.parent.name), 'state': parts[0],
                             'group': int(parts[2]), 'session': int(parts[3]),
                             'startTicks': int(parts[19])})
        except (FileNotFoundError, ProcessLookupError, PermissionError):
            continue
    return rows


source_paths = git('ls-files', 'app', 'tests/support', 'tests/level-start-fixture.mjs',
                   'scripts/orchestration/command-receipt.mjs', 'package.json', 'package-lock.json').splitlines()
source_paths += [SCRIPT, NATIVE]
source_before = {path: sha(ROOT / path) for path in source_paths}
dependencies_before = inventory_tree(SOURCE_DEPS)
for name, value in [('source-before.json.gz', source_before), ('dependencies-before.json.gz', dependencies_before)]:
    (OUTPUT / name).write_bytes(gzip.compress(json.dumps(value, sort_keys=True).encode(), mtime=0))
inputs = [SCRIPT, NATIVE, 'package.json', 'package-lock.json', 'node_modules/.package-lock.json',
          'scripts/orchestration/command-receipt.mjs', __file__,
          f'{BASE}/source-before.json.gz', f'{BASE}/dependencies-before.json.gz']
command = [NODE, '--max-old-space-size=1024', str(ROOT / 'scripts/orchestration/command-receipt.mjs'),
           '--output', COMMAND_RECEIPT]
for path in inputs:
    command += ['--input', str(path)]
command += ['--', '/usr/bin/timeout', '--signal=TERM', '--kill-after=5s', '60s',
            NODE, '--max-old-space-size=1024', SCRIPT, NATIVE]
environment = {'PATH': str(Path(NODE).parent) + ':/usr/bin:/bin', 'LANG': 'C.UTF-8', 'LC_ALL': 'C.UTF-8'}
receipt.update(command=command, environment=environment,
               sourceFileCount=len(source_before), dependencyEntryCount=len(dependencies_before),
               sourceInventorySha256=sha(OUTPUT / 'source-before.json.gz'),
               dependencyInventorySha256=sha(OUTPUT / 'dependencies-before.json.gz'))
save()
lock_bytes = (SOURCE_DEPS / '.package-lock.json').read_bytes()
moved, child = False, None
try:
    os.rename(SOURCE_DEPS, DEPS)
    moved = True
    SOURCE_DEPS.mkdir()
    (SOURCE_DEPS / '.package-lock.json').write_bytes(lock_bytes)
    stub_identity = (SOURCE_DEPS.stat().st_dev, SOURCE_DEPS.stat().st_ino)
    assert (DEPS.stat().st_dev, DEPS.stat().st_ino) == identity
    receipt.update(borrowedAt=now(), donorStubIdentity=stub_identity,
                   donorStubLockSha256=sha(SOURCE_DEPS / '.package-lock.json'),
                   borrowerIdentity=[DEPS.stat().st_dev, DEPS.stat().st_ino])
    save()
    with (OUTPUT / 'wrapper-stdout.txt').open('xb') as out, (OUTPUT / 'wrapper-stderr.txt').open('xb') as err:
        child = subprocess.Popen(command, cwd=ROOT, env=environment, stdin=subprocess.DEVNULL,
                                 stdout=out, stderr=err, start_new_session=True,
                                 preexec_fn=lambda: os.sched_setaffinity(0, {0, 1, 2, 3}))
        receipt.update(processSession=child.pid, childStartedAt=now())
        save()
        try:
            code = child.wait(timeout=70)
        except subprocess.TimeoutExpired:
            for group in {row['group'] for row in owned_session(child.pid)}:
                os.killpg(group, signal.SIGKILL)
            code = child.wait(timeout=5)
            receipt['outerTimeout'] = True
    remaining = owned_session(child.pid)
    if remaining:
        for group in {row['group'] for row in remaining}:
            os.killpg(group, signal.SIGKILL)
        receipt['terminalResidualSessionKill'] = remaining
        remaining = owned_session(child.pid)
    receipt.update(childEndedAt=now(), wrapperExitCode=code,
                   remainingOwnedProcesses=remaining, resourcesReleased=not remaining)
    receipt['sourceUnchanged'] = {path: sha(ROOT / path) for path in source_paths} == source_before
    receipt['dependencyTreeUnchanged'] = inventory_tree(DEPS) == dependencies_before
    receipt['installedLockUnchanged'] = sha(DEPS / '.package-lock.json') == LOCK
    receipt['status'] = 'terminal'
    save()
finally:
    if moved:
        assert child is None or child.poll() is not None, 'Do not return live dependencies'
        assert (DEPS.stat().st_dev, DEPS.stat().st_ino) == identity
        assert (SOURCE_DEPS.stat().st_dev, SOURCE_DEPS.stat().st_ino) == stub_identity
        assert [path.name for path in SOURCE_DEPS.iterdir()] == ['.package-lock.json']
        assert (SOURCE_DEPS / '.package-lock.json').read_bytes() == lock_bytes
        assert sha(DEPS / '.package-lock.json') == LOCK
        (SOURCE_DEPS / '.package-lock.json').unlink()
        SOURCE_DEPS.rmdir()
        os.rename(DEPS, SOURCE_DEPS)
        assert (SOURCE_DEPS.stat().st_dev, SOURCE_DEPS.stat().st_ino) == identity
        assert sha(SOURCE_DEPS / '.package-lock.json') == LOCK and not DEPS.exists()
        receipt.update(dependenciesReturned=True, returnedAt=now(),
                       returnedIdentity=[SOURCE_DEPS.stat().st_dev, SOURCE_DEPS.stat().st_ino],
                       returnedInstalledLockSha256=sha(SOURCE_DEPS / '.package-lock.json'))
        save()
print(json.dumps({key: receipt.get(key) for key in ['status', 'wrapperExitCode', 'resourcesReleased',
      'sourceUnchanged', 'dependencyTreeUnchanged', 'dependenciesReturned', 'returnedIdentity']}, indent=2))
print(str(OUTPUT))
