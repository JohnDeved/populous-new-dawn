#!/usr/bin/env python3
"""Explicit one-run host. Requires a separately granted resource window."""
from pathlib import Path
import datetime, gzip, hashlib, json, os, signal, socket, stat, subprocess, sys, time

root = Path(__file__).resolve().parents[3]
packet = root / 'decomp/research/hut-smoke-state-exit/ordinary-host-packet.json'
plan = json.loads(packet.read_text())
assert len(sys.argv) == 2 and len(sys.argv[1]) == 40, 'Pass the exact reviewed committed HEAD'
expected_head = sys.argv[1]
sha = lambda p: hashlib.sha256(Path(p).read_bytes()).hexdigest()
now = lambda: datetime.datetime.now(datetime.timezone.utc).isoformat()
git = lambda *args: subprocess.check_output(['git', '-C', str(root), *args], text=True).strip()
assert root == Path(plan['cwd']) and git('rev-parse', 'HEAD') == expected_head
assert git('status', '--porcelain') == ''
assert git('diff', plan['sourceAnchor'], 'HEAD', '--', 'app', 'public', 'scripts', 'qa', 'tests', 'package.json', 'package-lock.json', 'worker', 'components', '.openai') == ''
for name, expected in plan['sources'].items(): assert sha(root / name) == expected, name
for name, expected in plan['tools'].items(): assert sha(name) == expected, name
assert sorted(os.sched_getaffinity(0)) == plan['cpu'], 'Launch via the exact CPU0-3 taskset argv'
donor = Path(plan['donor']); local = root / 'node_modules'
assert not local.exists() and not local.is_symlink(), 'This frozen destination starts without dependencies'
assert donor.is_dir() and not donor.is_symlink()
assert [donor.stat().st_dev, donor.stat().st_ino] == plan['dependencyIdentity']
lock_bytes = (donor / '.package-lock.json').read_bytes()
assert hashlib.sha256(lock_bytes).hexdigest() == plan['installedLockSha256']
assert sha(root / 'package-lock.json') == plan['packageLockSha256']
for name, expected in plan['dependencyFiles'].items(): assert sha(donor / name) == expected, name
for name in ('output', 'profile', 'temporary', 'hostOutput'):
    assert not Path(plan[name]).exists() and not Path(plan[name]).is_symlink(), name
with socket.socket() as listener: listener.bind(('127.0.0.1', plan['port']))
output = Path(plan['hostOutput']); output.mkdir(parents=True)
receipt = {'status': 'preflight', 'startedAt': now(), 'head': expected_head, 'packetSha256': sha(packet),
           'hostSha256': sha(__file__), 'plan': plan, 'moves': [], 'cacheMoves': [], 'retry': False}
def save(): (output / 'receipt.json').write_text(json.dumps(receipt, indent=2) + '\n')
def source():
    names = sorted(set(plan['sources']) | set(git('ls-files', 'app', 'components', 'worker').splitlines()))
    return {'head': git('rev-parse', 'HEAD'), 'tree': git('rev-parse', 'HEAD^{tree}'),
            'status': git('status', '--porcelain'), 'files': {name: sha(root / name) for name in names}}
def inventory(directory):
    rows = {}
    for parent, dirs, files in os.walk(directory, followlinks=False):
        for name in dirs + files:
            path = Path(parent) / name; key = str(path.relative_to(directory)); info = path.lstat()
            if stat.S_ISLNK(info.st_mode): rows[key] = {'link': os.readlink(path), 'mode': info.st_mode}
            elif stat.S_ISREG(info.st_mode): rows[key] = {'sha256': sha(path), 'size': info.st_size, 'mode': info.st_mode}
            elif not stat.S_ISDIR(info.st_mode): raise RuntimeError('Unexpected dependency object: ' + key)
    return rows

def retain_inventory(name, value):
    path = output / name
    path.write_bytes(gzip.compress((json.dumps(value, sort_keys=True) + '\n').encode(), mtime=0))
    return sha(path)
receipt['sourceBefore'] = source()
before = inventory(donor)
receipt['dependencyInventoryBeforeSha256'] = retain_inventory('dependencies-before.json.gz', before)
receipt['status'] = 'ready'; save()
owned = {}; child = None; moved = False; isolated = []; generated = []

def processes():
    result = {}
    for directory in Path('/proc').iterdir():
        if not directory.name.isdigit(): continue
        try:
            raw = (directory / 'stat').read_text(); fields = raw[raw.rfind(')') + 2:].split()
            result[int(directory.name)] = {'state': fields[0], 'parent': int(fields[1]), 'start': int(fields[19])}
        except (FileNotFoundError, ProcessLookupError, PermissionError): pass
    return result

def observe_owned():
    current = processes()
    live = {pid: row for pid, row in current.items() if owned.get(pid) == row['start']}
    while True:
        added = {pid: row for pid, row in current.items() if pid not in live and row['parent'] in live}
        if not added: break
        live.update(added)
        for pid, row in added.items(): owned[pid] = row['start']
    return {pid: row for pid, row in live.items() if row['state'] != 'Z'}

try:
    donor.rename(local); moved = True
    donor.mkdir(); (donor / '.package-lock.json').write_bytes(lock_bytes)
    stub_identity = [donor.stat().st_dev, donor.stat().st_ino]
    receipt['moves'].append({'at': now(), 'from': str(donor), 'to': str(local), 'identity': plan['dependencyIdentity'], 'stubIdentity': stub_identity}); save()
    for name in plan['isolateCaches']:
        cache = local / name
        if cache.exists():
            assert cache.is_dir() and not cache.is_symlink(), name
            retained = output / ('donor-cache-' + name.removeprefix('.'))
            cache.rename(retained); isolated.append((cache, retained))
            receipt['cacheMoves'].append({'at': now(), 'from': str(cache), 'to': str(retained)})
    temporary = Path(plan['temporary'])
    for subdir in ('tmp', 'cache', 'config'): (temporary / subdir).mkdir(parents=True, mode=0o700)
    assert not Path(plan['output']).exists() and not Path(plan['profile']).exists()
    with socket.socket() as listener: listener.bind(('127.0.0.1', plan['port']))
    assert source() == receipt['sourceBefore']
    receipt['status'] = 'running'; receipt['launchedAt'] = now(); save()
    with (output / 'stdout.txt').open('wb') as stdout, (output / 'stderr.txt').open('wb') as stderr:
        child = subprocess.Popen(plan['command'], cwd=root, env=plan['environment'], stdout=stdout, stderr=stderr, start_new_session=True)
        first = processes(); owned[child.pid] = first[child.pid]['start']
        receipt['rootPid'] = child.pid; save(); started = time.monotonic()
        while child.poll() is None:
            observe_owned()
            if time.monotonic() - started > 523:
                receipt['hostDeadlineExceeded'] = True
                child.send_signal(signal.SIGTERM)
                break
            time.sleep(.2)
        try: receipt['exitCode'] = child.wait(timeout=2)
        except subprocess.TimeoutExpired:
            child.kill(); receipt['exitCode'] = child.wait(timeout=2)
        receipt['bodyEndedAt'] = now(); save()
except BaseException as error:
    receipt['failure'] = repr(error)
finally:
    remaining = observe_owned() if child else {}
    if remaining:
        receipt['cleanupSignals'] = []
        for sig in (signal.SIGTERM, signal.SIGKILL):
            for pid, row in observe_owned().items():
                try: os.kill(pid, sig); receipt['cleanupSignals'].append({'pid': pid, 'start': row['start'], 'signal': sig.name})
                except ProcessLookupError: pass
            if sig == signal.SIGTERM: time.sleep(.5)
    receipt['remainingOwnedProcesses'] = list(observe_owned()) if child else []
    receipt['resourcesReleased'] = not receipt['remainingOwnedProcesses']
    if moved and receipt['resourcesReleased']:
        for name in plan['isolateCaches']:
            cache = local / name
            if cache.exists():
                assert cache.is_dir() and not cache.is_symlink(), name
                retained = output / ('generated-cache-' + name.removeprefix('.'))
                cache.rename(retained); generated.append(str(retained))
        for cache, retained in isolated: retained.rename(cache)
        receipt['generatedCachesRetainedPrivately'] = generated
        after = inventory(local)
        receipt['dependencyInventoryAfterSha256'] = retain_inventory('dependencies-after.json.gz', after)
        receipt['dependencyTreeUnchanged'] = before == after
        receipt['installedLockUnchanged'] = (local / '.package-lock.json').read_bytes() == lock_bytes
        assert [donor.stat().st_dev, donor.stat().st_ino] == stub_identity
        assert sorted(p.name for p in donor.iterdir()) == ['.package-lock.json'] and (donor / '.package-lock.json').read_bytes() == lock_bytes
        assert [local.stat().st_dev, local.stat().st_ino] == plan['dependencyIdentity']
        retained_stub = output / 'lease-lock-only-stub'; donor.rename(retained_stub)
        local.rename(donor); retained_stub.rename(local)
        receipt['moves'].append({'at': now(), 'from': str(local), 'to': str(donor), 'identity': [donor.stat().st_dev, donor.stat().st_ino], 'stubIdentity': [local.stat().st_dev, local.stat().st_ino]})
        receipt['returned'] = True; receipt['returnedAt'] = now()
    receipt['sourceAfter'] = source(); receipt['sourceUnchanged'] = receipt['sourceBefore'] == receipt['sourceAfter']
    receipt['toolsAfter'] = {name: sha(name) for name in plan['tools']}
    receipt['toolsUnchanged'] = receipt['toolsAfter'] == plan['tools']
    receipt['status'] = 'terminal'; receipt['endedAt'] = now(); save()
print(json.dumps({key: receipt.get(key) for key in ('status', 'exitCode', 'failure', 'bodyEndedAt', 'endedAt', 'resourcesReleased', 'returned', 'dependencyTreeUnchanged', 'sourceUnchanged', 'toolsUnchanged')}))

sys.exit(0 if receipt.get('exitCode') == 0 and receipt.get('returned') and receipt.get('dependencyTreeUnchanged') and receipt.get('sourceUnchanged') and receipt.get('toolsUnchanged') and receipt.get('resourcesReleased') else 1)
