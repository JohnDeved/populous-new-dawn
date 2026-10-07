#!/usr/bin/env python3
"""Explicit one-run host. Requires a separately granted resource window."""
from pathlib import Path
import datetime, gzip, hashlib, json, os, signal, socket, stat, subprocess, sys, time

assert len(sys.argv) == 2 and len(sys.argv[1]) == 40, 'Pass the exact reviewed committed HEAD'
packet = Path(__file__).resolve().with_name('gate-packet.json')
plan = json.loads(packet.read_text())
root = Path(plan['cwd'])
expected_head = sys.argv[1]
assert expected_head == plan['sourceAnchor']
sha = lambda p: hashlib.sha256(Path(p).read_bytes()).hexdigest()
now = lambda: datetime.datetime.now(datetime.timezone.utc).isoformat()
git = lambda *args: subprocess.check_output(['git', '-C', str(root), *args], text=True).strip()
assert root == Path(plan['cwd']) and git('rev-parse', 'HEAD') == expected_head
assert git('status', '--porcelain') == ''
assert git('diff', plan['sourceAnchor'], 'HEAD', '--', 'app', 'public', 'scripts', 'qa', 'tests', 'package.json', 'package-lock.json', 'worker', 'components', '.openai') == ''
for name, expected in plan['sources'].items(): assert sha(root / name) == expected, name
for name, expected in plan['tools'].items(): assert sha(name) == expected, name
assert sorted(os.sched_getaffinity(0)) == plan['cpu'], 'Launch via the exact CPU5-7 taskset argv'
local = root / 'node_modules'
assert local.is_dir() and not local.is_symlink()
copy_receipt = json.loads(Path(plan['copyReceipt']).read_text())
assert copy_receipt['status'] == 'passed' and copy_receipt['packetUnchanged']
assert copy_receipt['planSha256'] == sha(plan['copyPlan'])
assert [local.stat().st_dev, local.stat().st_ino] == copy_receipt['copyIdentity']
assert copy_receipt['dependencyCopySha256'] == plan['selectedInventorySha256']
assert sha(root / 'package-lock.json') == plan['packageLockSha256']
for name, expected in plan['dependencyFiles'].items(): assert sha(local / name) == expected, name
for name in plan['excludedPaths']: assert not (local / name).exists() and not (local / name).is_symlink()
for name in ('output', 'temporary', 'hostOutput'):
    assert not Path(plan[name]).exists() and not Path(plan[name]).is_symlink(), name
output = Path(plan['hostOutput']); output.mkdir(parents=True)
receipt = {'status': 'preflight', 'startedAt': now(), 'head': expected_head, 'packetSha256': sha(packet),
           'hostSha256': sha(__file__), 'plan': plan, 'copyReceiptSha256': sha(plan['copyReceipt']), 'copyIdentity': copy_receipt['copyIdentity'],
           'pidNamespace': os.readlink('/proc/self/ns/pid'), 'networkNamespace': os.readlink('/proc/self/ns/net'),
           'bootId': Path('/proc/sys/kernel/random/boot_id').read_text().strip(), 'oldLoanMoved': False, 'retry': False}
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
receipt['fallowMarkerInitiallyAbsent'] = not (local / '@fallow-cli/linux-x64-gnu/.fallow-verified').exists() and not (local / '@fallow-cli/linux-x64-gnu/.fallow-verified').is_symlink()
assert receipt['fallowMarkerInitiallyAbsent']
receipt['sourceBefore'] = source()
before = inventory(local)
assert hashlib.sha256((json.dumps(before, sort_keys=True) + '\n').encode()).hexdigest() == plan['selectedInventorySha256']
receipt['dependencyInventoryBeforeSha256'] = retain_inventory('dependencies-before.json.gz', before)
receipt['status'] = 'ready'; save()
owned = {}; child = None; known_session = None; ownership_verified = False; process_read_errors = set()
generated = []

marker_name = '@fallow-cli/linux-x64-gnu/.fallow-verified'
def marker_facts(path):
    assert path.is_file() and not path.is_symlink(), 'Unexpected Fallow marker object'
    return {'sha256': sha(path), 'size': path.stat().st_size, 'mode': path.stat().st_mode,
            'parsed': json.loads(path.read_text())}

def processes():
    result = {}
    for directory in Path('/proc').iterdir():
        if not directory.name.isdigit(): continue
        try:
            raw = (directory / 'stat').read_text(); fields = raw[raw.rfind(')') + 2:].split()
            result[int(directory.name)] = {'state': fields[0], 'parent': int(fields[1]),
                                           'group': int(fields[2]), 'session': int(fields[3]), 'start': int(fields[19])}
        except (FileNotFoundError, ProcessLookupError): pass
        except PermissionError: process_read_errors.add(int(directory.name))
    return result

def observe_owned():
    current = processes()
    live = {pid: row for pid, row in current.items() if owned.get(pid) == row['start']}
    # Session membership survives the root's exit and descendant reparenting.
    # Detached server/browser descendants additionally retain PID/start identity.
    for pid, row in current.items():
        if known_session is not None and row['session'] == known_session:
            if pid in owned and owned[pid] != row['start']:
                process_read_errors.add(pid)
                continue
            live[pid] = row; owned[pid] = row['start']
    while True:
        added = {pid: row for pid, row in current.items() if pid not in live and row['parent'] in live}
        if not added: break
        live.update(added)
        for pid, row in added.items(): owned[pid] = row['start']
    return {pid: row for pid, row in live.items() if row['state'] != 'Z'}

try:
    temporary = Path(plan['temporary'])
    for subdir in ('tmp', 'cache', 'config'): (temporary / subdir).mkdir(parents=True, mode=0o700)
    assert not Path(plan['output']).exists()
    assert source() == receipt['sourceBefore']
    receipt['status'] = 'running'; receipt['launchedAt'] = now(); save()
    with (output / 'stdout.txt').open('wb') as stdout, (output / 'stderr.txt').open('wb') as stderr:
        child = subprocess.Popen(plan['command'], cwd=root, env=plan['environment'], stdout=stdout, stderr=stderr, start_new_session=True)
        known_session = child.pid  # Popen(start_new_session=True) calls setsid.
        receipt['rootPid'] = child.pid; receipt['rootSession'] = known_session; save()
        first = processes(); identity = first.get(child.pid)
        ownership_verified = bool(identity and identity['session'] == known_session and identity['group'] == child.pid)
        receipt['initialProcessIdentity'] = identity
        if ownership_verified: owned[child.pid] = identity['start']
        else: receipt['cleanupUnknownReason'] = 'Root identity/session was not observable immediately after launch'
        save(); started = time.monotonic()
        while child.poll() is None:
            observe_owned()
            if time.monotonic() - started > 2153:
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
    receipt['ownershipVerified'] = ownership_verified
    receipt['processReadErrors'] = sorted(process_read_errors)
    receipt['resourcesReleased'] = ownership_verified and not process_read_errors and not receipt['remainingOwnedProcesses']
    receipt['cleanupStatus'] = 'released' if receipt['resourcesReleased'] else 'unknown-or-remaining'
    if receipt['resourcesReleased']:
        for name in plan['isolateCaches']:
            cache = local / name
            if cache.exists():
                assert cache.is_dir() and not cache.is_symlink(), name
                retained = output / ('generated-cache-' + name.removeprefix('.'))
                cache.rename(retained); generated.append(str(retained))
        receipt['generatedCachesRetainedPrivately'] = generated
        marker = local / marker_name
        receipt['fallowMarkerGeneratedMatchesBinaries'] = False
        try:
            if marker.exists() or marker.is_symlink():
                retained = output / 'generated-fallow-verification-marker.json'
                marker.rename(retained)
                receipt['fallowMarkerGeneratedRetainedPath'] = str(retained)
                receipt['fallowMarkerGenerated'] = marker_facts(retained)
                facts = receipt['fallowMarkerGenerated']['parsed']
                manifest = json.loads((local / '@fallow-cli/linux-x64-gnu/package.json').read_text())
                expected_binaries = ('fallow', 'fallow-similar-code')
                receipt['fallowMarkerGeneratedMatchesBinaries'] = (
                    facts.get('schemaVersion') == 3 and facts.get('packageVersion') == manifest['version']
                    and facts.get('packageName') == manifest['name']
                    and facts.get('platformPkgDir') == str(marker.parent)
                    and all(facts.get('binaries', {}).get(name, {}).get('sha256') == sha(marker.parent / name)
                            == manifest['fallowDigests'][name].removeprefix('sha256:')
                            and abs(facts['binaries'][name].get('mtimeMs', -1) - (marker.parent / name).stat().st_mtime * 1000) <= 1
                            for name in expected_binaries))
        except Exception as error:
            receipt['fallowMarkerValidationFailure'] = repr(error)
            receipt['fallowMarkerGeneratedMatchesBinaries'] = False
        finally:
            assert not marker.exists() and not marker.is_symlink(), 'Generated marker was not retained'
            receipt['fallowMarkerAbsenceRestored'] = True
            save()
        after = inventory(local)
        receipt['dependencyInventoryAfterSha256'] = retain_inventory('dependencies-after.json.gz', after)
        receipt['dependencyTreeUnchanged'] = before == after
        receipt['snapshotPreserved'] = [local.stat().st_dev, local.stat().st_ino] == receipt['copyIdentity']
        receipt['copyReceiptUnchanged'] = sha(plan['copyReceipt']) == receipt['copyReceiptSha256']
    receipt['sourceAfter'] = source(); receipt['sourceUnchanged'] = receipt['sourceBefore'] == receipt['sourceAfter']
    receipt['toolsAfter'] = {name: sha(name) for name in plan['tools']}
    receipt['toolsUnchanged'] = receipt['toolsAfter'] == plan['tools']
    receipt['packetSha256After'] = sha(packet)
    receipt['packetUnchanged'] = receipt['packetSha256After'] == receipt['packetSha256']
    receipt['status'] = 'terminal'; receipt['endedAt'] = now(); save()
print(json.dumps({key: receipt.get(key) for key in ('status', 'exitCode', 'failure', 'bodyEndedAt', 'endedAt', 'resourcesReleased', 'snapshotPreserved', 'dependencyTreeUnchanged', 'sourceUnchanged', 'toolsUnchanged')}))

sys.exit(0 if receipt.get('exitCode') == 0 and receipt.get('snapshotPreserved') and receipt.get('copyReceiptUnchanged') and receipt.get('dependencyTreeUnchanged') and receipt.get('sourceUnchanged') and receipt.get('toolsUnchanged') and receipt.get('resourcesReleased') and receipt.get('packetUnchanged') and receipt.get('fallowMarkerGeneratedMatchesBinaries', False) and receipt.get('fallowMarkerAbsenceRestored', False) else 1)
