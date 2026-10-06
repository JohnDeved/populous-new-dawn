"""Exactly two authorized focused invocations with one exclusive dependency tree."""
import datetime, gzip, hashlib, json, os, re, signal, subprocess
from pathlib import Path

CANDIDATE = Path.cwd()
RED = CANDIDATE.parent / 'hut-smoke-ignition-red-20261006'
DONOR = CANDIDATE.parent / 'preacher-command32-expiry-20261006'
DEPS = DONOR / 'node_modules'
NODE = '/opt/codex/runtimes/codex-primary-runtime/dependencies/node/bin/node'
TEST = 'tests/hut-smoke-ignition.test.mjs'
TEST_HASH = '6ac554e82c51fd92393f56fb0ae766dcc3927a2bd8a502744fa62f34d9c8654e'
LOCK_HASH = '65e45d0a87d1ecd4fbf56508b9821eb3bfb3867c8477db4aaa1452eb2bed13d8'
ROOT_LOCK = 'c1599d8d7e3f028e290a13561c653cf926e739e98eb9ec1b476dbe1c2a4558ba'
OUT = CANDIDATE / 'work/orchestration/hut-smoke-state-exit/focused-host-01'
sha = lambda p: hashlib.sha256(Path(p).read_bytes()).hexdigest()
now = lambda: datetime.datetime.now(datetime.timezone.utc).isoformat()
git = lambda root, *a: subprocess.check_output(['git', *a], cwd=root).decode().strip()
identity = lambda p: [p.stat().st_dev, p.stat().st_ino]
assert identity(DEPS) == [27, 1978923] and not DEPS.is_symlink()
assert sha(DEPS / '.package-lock.json') == LOCK_HASH
assert git(CANDIDATE, 'rev-parse', 'HEAD') == 'b26f66b24da4fe133441e83c5377467a5066ef64'
assert git(RED, 'rev-parse', 'HEAD') == '6fceacc80e13909dfd5866871c983d02e45b592e'
assert not git(CANDIDATE, 'status', '--porcelain')
assert git(RED, 'status', '--porcelain') == '?? tests/hut-smoke-ignition.test.mjs'
assert not git(RED, 'diff', '1c7e6b05687aca14d9350e17c7ae14dc6c68bb97', '--name-only', '--', 'app')
for root in [RED, CANDIDATE]:
    assert not (root / 'node_modules').exists()
    assert sha(root / TEST) == TEST_HASH
    assert sha(root / 'package-lock.json') == ROOT_LOCK
assert sha(DONOR / 'package-lock.json') == ROOT_LOCK
OUT.mkdir(parents=True, exist_ok=False)
record = {'status': 'prepared', 'startedAt': now(), 'donor': str(DEPS),
          'identity': [27, 1978923], 'installedLockSha256': LOCK_HASH,
          'testSha256': TEST_HASH, 'runs': [], 'moves': [], 'returned': False,
          'hostSourceSha256': sha(__file__), 'retry': False}


def save():
    path = OUT / 'receipt.tmp'
    path.write_text(json.dumps(record, indent=2) + '\n')
    path.replace(OUT / 'receipt.json')


def inventory(root):
    rows = {}
    for path in sorted(root.rglob('*')):
        if path.is_symlink():
            assert path.resolve().is_relative_to(root.resolve())
            rows[str(path.relative_to(root))] = {'symlink': os.readlink(path)}
        elif path.is_file():
            rows[str(path.relative_to(root))] = {'sha256': sha(path), 'bytes': path.stat().st_size}
    return rows


def session_rows(session):
    result = []
    for path in Path('/proc').glob('[0-9]*/stat'):
        try:
            text = path.read_text(); fields = text[text.rfind(')') + 2:].split()
            if int(fields[3]) == session:
                result.append({'pid': int(path.parent.name), 'group': int(fields[2]),
                               'session': int(fields[3]), 'state': fields[0]})
        except (FileNotFoundError, ProcessLookupError, PermissionError):
            continue
    return result


lock_bytes = (DEPS / '.package-lock.json').read_bytes()
stub_identities = {}


def move_tree(source, target):
    assert identity(source) == [27, 1978923]
    assert sha(source / '.package-lock.json') == LOCK_HASH
    if target.exists():
        assert identity(target) == stub_identities[str(target)]
        assert [p.name for p in target.iterdir()] == ['.package-lock.json']
        assert (target / '.package-lock.json').read_bytes() == lock_bytes
        (target / '.package-lock.json').unlink(); target.rmdir()
    os.rename(source, target)
    source.mkdir(); (source / '.package-lock.json').write_bytes(lock_bytes)
    stub_identities[str(source)] = identity(source)
    assert identity(target) == [27, 1978923]
    record['moves'].append({'at': now(), 'from': str(source), 'to': str(target),
                            'actualIdentity': identity(target), 'sourceStubIdentity': identity(source),
                            'sourceStubLockSha256': sha(source / '.package-lock.json')})
    save()


dependencies_before = inventory(DEPS)
(OUT / 'dependency-inventory.json.gz').write_bytes(gzip.compress(json.dumps(dependencies_before, sort_keys=True).encode(), mtime=0))
record['dependencyInventorySha256'] = sha(OUT / 'dependency-inventory.json.gz')
record['launcherTools'] = {p: sha(p) for p in [NODE, '/usr/bin/timeout']}
save()
location = DEPS
child = None
try:
    for label, root in [('red', RED), ('candidate', CANDIDATE)]:
        assert sha(root / TEST) == TEST_HASH
        source_paths = git(root, 'ls-files', 'app', 'tests/support', 'tests/level-start-fixture.mjs',
                           'package.json', 'package-lock.json', 'scripts/orchestration/command-receipt.mjs').splitlines() + [TEST]
        before = {path: sha(root / path) for path in source_paths}
        inventory_path = OUT / f'{label}-source-inventory.json.gz'
        inventory_path.write_bytes(gzip.compress(json.dumps(before, sort_keys=True).encode(), mtime=0))
        receipt_name = f'work/orchestration/hut-smoke-state-exit/focused-{label}-01.json'
        inputs = [TEST, 'package.json', 'package-lock.json', 'node_modules/.package-lock.json',
                  'scripts/orchestration/command-receipt.mjs', str(inventory_path),
                  str(OUT / 'dependency-inventory.json.gz'), str(Path(__file__).resolve())]
        argv = [NODE, '--max-old-space-size=1024', str(root / 'scripts/orchestration/command-receipt.mjs'),
                '--output', receipt_name]
        for path in inputs: argv += ['--input', path]
        argv += ['--', '/usr/bin/timeout', '--signal=TERM', '--kill-after=5s', '60s', NODE,
                 '--max-old-space-size=1024', '--test', '--test-concurrency=1', '--test-reporter=tap', TEST]
        run = {'label': label, 'head': git(root, 'rev-parse', 'HEAD'), 'root': str(root),
               'command': argv, 'receipt': str(root / receipt_name), 'sourceInventorySha256': sha(inventory_path)}
        record['runs'].append(run); save()
        move_tree(location, root / 'node_modules'); location = root / 'node_modules'
        env = {'PATH': str(Path(NODE).parent) + ':/usr/bin:/bin', 'LANG': 'C.UTF-8', 'LC_ALL': 'C.UTF-8'}
        with (OUT / f'{label}-wrapper-stdout.txt').open('xb') as stdout, (OUT / f'{label}-wrapper-stderr.txt').open('xb') as stderr:
            child = subprocess.Popen(argv, cwd=root, env=env, stdin=subprocess.DEVNULL,
                                     stdout=stdout, stderr=stderr, start_new_session=True,
                                     preexec_fn=lambda: os.sched_setaffinity(0, {0, 1, 2, 3}))
            run.update(startedAt=now(), session=child.pid); save()
            try: exit_code = child.wait(timeout=70)
            except subprocess.TimeoutExpired:
                for group in {row['group'] for row in session_rows(child.pid)}: os.killpg(group, signal.SIGKILL)
                exit_code = child.wait(timeout=5); run['outerTimeout'] = True
        remaining = session_rows(child.pid)
        if remaining:
            for group in {row['group'] for row in remaining}: os.killpg(group, signal.SIGKILL)
            remaining = session_rows(child.pid)
        run.update(endedAt=now(), exitCode=exit_code, remainingOwnedProcesses=remaining,
                   resourcesReleased=not remaining,
                   sourceUnchanged={path: sha(root / path) for path in source_paths} == before,
                   installedLockUnchanged=sha(location / '.package-lock.json') == LOCK_HASH)
        raw = json.loads((root / receipt_name).read_text())
        run['commandStatus'] = raw['status']
        run['counts'] = {name: int(re.search(r'^# ' + name + r' (\d+)$', raw['stdout'], re.M).group(1))
                         for name in ['tests', 'pass', 'fail'] if re.search(r'^# ' + name + r' (\d+)$', raw['stdout'], re.M)}
        save()
        assert run['resourcesReleased'] and run['sourceUnchanged'] and run['installedLockUnchanged']
        assert raw['source'] == raw['sourceAfter']
        if label == 'red':
            failed = re.findall(r'^not ok \d+ - (.+)$', raw['stdout'], re.M)
            expected = ['Lightning retires a 3-resident hut root after fire initialization',
                        'Lightning retires a 1-resident hut root after fire initialization',
                        'paused restore retires historically saved burning roots while preserving children and legacy completed huts',
                        'Spy command15 ignition retires the same occupied-hut root']
            blocks = re.findall(r'^not ok \d+ - .+?(?=^# Subtest:|^ok |^not ok |^1\.\.|\Z)', raw['stdout'], re.M | re.S)
            locations = [set(map(int, re.findall(r'hut-smoke-ignition\.test\.mjs:(\d+):\d+', block))) for block in blocks]
            run['failureLocations'] = [sorted(values) for values in locations]
            intended_assertions = len(locations) == 4 and all(line in values for line, values in zip([78, 78, 175, 230], locations))
            run['expectedFailureClassification'] = exit_code == 1 and failed == expected and intended_assertions and run['counts'] == {'tests': 7, 'pass': 3, 'fail': 4}
            save()
            assert run['expectedFailureClassification'], 'Unrelated red setup/case failure; candidate is not run'
        else:
            run['candidatePassed'] = exit_code == 0 and raw['status'] == 'passed' and run['counts'] == {'tests': 7, 'pass': 7, 'fail': 0}
            save()
    record['status'] = 'terminal'
finally:
    if location != DEPS:
        assert child is None or child.poll() is not None
        record['dependencyTreeUnchanged'] = inventory(location) == dependencies_before
        move_tree(location, DEPS)
        record.update(returned=True, returnedAt=now(), returnedIdentity=identity(DEPS),
                      returnedLockSha256=sha(DEPS / '.package-lock.json'))
        save()
print(json.dumps({'status': record['status'], 'runs': [{k: row.get(k) for k in ['label', 'exitCode', 'counts',
      'expectedFailureClassification', 'candidatePassed', 'resourcesReleased']} for row in record['runs']],
      'returned': record['returned'], 'returnedIdentity': record.get('returnedIdentity'),
      'dependencyTreeUnchanged': record.get('dependencyTreeUnchanged')}, indent=2))
