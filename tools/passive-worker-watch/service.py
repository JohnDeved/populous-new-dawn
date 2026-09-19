#!/usr/bin/env python3
"""Own one passive-watcher LaunchAgent. Never manage worker tasks or other processes."""
from __future__ import annotations

import argparse
import json
import os
from pathlib import Path
import plistlib
import re
import shutil
import subprocess
import sys
import time

import watcher

LABEL = 'com.populous.worker-watcher'
DEFAULT_HOME = Path.home() / 'Library/Application Support/PopulousPassiveWatcher'
RETIRED_SUFFIX = '/work/orchestration/worker-watch-cli/run-watcher.sh'


def launchctl(*args):
    return subprocess.run(['/bin/launchctl', *args], capture_output=True, text=True, timeout=25)


def agent_spec(runtime, state_dir, interpreter, records_root, activity_root):
    return {
        'Label': LABEL,
        'ProgramArguments': [str(interpreter), str(runtime / 'watcher.py'), 'run',
                             '--state-dir', str(state_dir), '--records-root', str(records_root),
                             '--activity-root', str(activity_root)],
        'WorkingDirectory': str(runtime), 'RunAtLoad': True,
        # A normal fail-closed exit does not restart into an output/API loop.
        'KeepAlive': {'Crashed': True}, 'ThrottleInterval': 300, 'ExitTimeOut': 20,
        'StandardOutPath': '/dev/null', 'StandardErrorPath': '/dev/null',
        'ProcessType': 'Background',
    }


def read_plist(path):
    with path.open('rb') as file:
        value = plistlib.load(file)
    if value.get('Label') != LABEL:
        raise RuntimeError('Unowned launch-agent label; refuse modification')
    return value


def owned_spec(value, runtime):
    args = value.get('ProgramArguments', [])
    return len(args) >= 3 and args[1:3] == [str(runtime / 'watcher.py'), 'run']


def matching_process(record, runtime, current):
    return (isinstance(record, dict) and record == current
            and str(runtime / 'watcher.py') + ' run ' in record.get('description', ''))


def status(home, plist_path):
    runtime = home / 'runtime'
    value = read_plist(plist_path) if plist_path.exists() else None
    result = launchctl('print', f'gui/{os.getuid()}/{LABEL}')
    match = re.search(r'^\s*pid = (\d+)\s*$', result.stdout, re.M)
    pid = int(match[1]) if match else None
    state_path = home / 'state.json'
    try:
        state = json.loads(state_path.read_text())
        process = state.get('process', {})
        record = {k: process[k] for k in ('pid', 'description') if k in process}
        observations = state.get('observations')
        last_observation = state.get('lastObservationAt')
        health = state.get('health')
    except (OSError, ValueError, AttributeError):
        record, observations, last_observation, health = {}, None, None, None
    current = watcher.process_identity(pid) if pid else None
    process_verified = bool(pid and value and owned_spec(value, runtime)
                            and matching_process(record, runtime, current))
    try:
        installation = json.loads((runtime / 'installation.json').read_text())
        runtime_hashes = watcher.fingerprints(runtime)
        hashes_verified = bool(installation.get('fingerprints') == runtime_hashes)
        roots_verified = bool(
            installation.get('recordsRoot') in value.get('ProgramArguments', []) if value else False
        ) and bool(
            installation.get('activityRoot') in value.get('ProgramArguments', []) if value else False
        )
    except (OSError, ValueError, AttributeError, KeyError):
        installation, runtime_hashes = {}, {}
        hashes_verified = roots_verified = False
    return {
        'registered': result.returncode == 0, 'pid': pid, 'processVerified': process_verified,
        'plistOwned': bool(value and owned_spec(value, runtime)),
        'hashesVerified': hashes_verified, 'rootsVerified': roots_verified,
        'runtimeFingerprints': runtime_hashes,
        'installationFingerprints': installation.get('fingerprints'),
        'recordsRoot': installation.get('recordsRoot'), 'activityRoot': installation.get('activityRoot'),
        'observations': observations, 'lastObservationAt': last_observation, 'health': health,
        'stateRecord': record, 'currentIdentity': current,
        'statePath': str(state_path), 'label': LABEL,
    }


TEST_SOURCES = ('verify.py', 'test_watcher.py', 'fixtures/local-events.json')


def test_fingerprints(source):
    return {name: watcher.sha(source / name) for name in TEST_SOURCES}


def validate_test_receipt(tests, source, now):
    if not isinstance(tests, dict):
        raise RuntimeError('Malformed test receipt')
    counts = ('testsDiscovered', 'testsRun', 'testsPassed', 'failures', 'errors', 'skipped', 'exceptional')
    times = [tests.get('startedAt'), tests.get('finishedAt')]
    if (type(tests.get('version')) is not int or tests['version'] != 1
            or tests.get('kind') != 'passive-watcher-tests' or tests.get('status') != 'passed'
            or tests.get('sourceUnchanged') is not True
            or type(tests.get('exitCode')) is not int or tests['exitCode'] != 0
            or not all(type(tests.get(k)) is int and tests[k] >= 0 for k in counts)
            or not all(type(t) in (int, float) and watcher.records.math.isfinite(t) and t > 0 for t in times)):
        raise RuntimeError('Complete successful test counts, exit code and timestamps required')
    if (not times[0] <= times[1] <= now or now - times[0] > 900
            or not 0 < tests['testsDiscovered'] == tests['testsRun'] == tests['testsPassed']
            or any(tests[k] != 0 for k in ('failures', 'errors', 'skipped', 'exceptional'))
            or tests.get('fingerprints') != watcher.fingerprints(source)
            or tests.get('testFingerprints') != test_fingerprints(source)):
        raise RuntimeError('Fresh, nonempty, internally consistent exact-source test receipt required')


def validate_gate(source, root, activity_root, dry_path, tests_path, now):
    expected = watcher.fingerprints(source)
    dry = json.loads(dry_path.read_text())
    tests = json.loads(tests_path.read_text())
    snapshot = dry.get('snapshot', {})
    if (dry.get('mode') != watcher.MODE or dry.get('status') != 'passed'
            or dry.get('notificationCalls') != 0 or dry.get('coldStartPending') != 0
            or dry.get('fingerprints') != expected or not dry.get('sourceUnchanged')
            or not 0 <= now - dry.get('finishedAt', 0) <= 900
            or not snapshot.get('complete') or snapshot.get('dataRoot') != str(root.resolve())
            or snapshot.get('activityRoot') != str(activity_root.resolve())
            or set(snapshot.get('workers', {})) != set(watcher.records.WORKERS.values())
            or not all(w.get('bound') and w.get('liveStatus') == 'unknown' for w in snapshot['workers'].values())
            or snapshot.get('claims', {}).get('silentStops') is not False
            or snapshot.get('claims', {}).get('activeStatus') is not False
            or snapshot.get('claims', {}).get('idleStatus') is not False
            or snapshot.get('lifecycleCoverage', {}).get('idle') is not False
            or snapshot.get('lifecycleCoverage', {}).get('runningMeansActive') is not False):
        raise RuntimeError('Fresh exact-source local-event dry receipt with honest reduced claims required')
    validate_test_receipt(tests, source, now)
    return expected


def retired_watcher_processes():
    result = subprocess.run(['/bin/ps', '-axo', 'pid=,command='], capture_output=True, text=True, timeout=5)
    if result.returncode:
        raise RuntimeError('Cannot exclude an existing retired watcher process')
    marker = '/work/orchestration/worker-watch-cli/watch.py'
    return [line.strip() for line in result.stdout.splitlines() if any(arg.endswith(marker) for arg in line.split())]


def install(source, root, activity_root, home, plist_path, dry_path, tests_path):
    fingerprints = validate_gate(source, root, activity_root, dry_path, tests_path, time.time())
    if retired_watcher_processes():
        raise RuntimeError('Retired watcher is still running; do not create a duplicate or signal it blindly')
    home.mkdir(parents=True, exist_ok=True, mode=0o700)
    with watcher.singleton(home):
        before = status(home, plist_path)
        if before['registered']:
            raise RuntimeError('Agent already registered; use identity-checked disable first')
        old = read_plist(plist_path) if plist_path.exists() else None
        if old and not owned_spec(old, home / 'runtime'):
            args = old.get('ProgramArguments', [])
            if len(args) != 1 or not args[0].endswith(RETIRED_SUFFIX):
                raise RuntimeError('Unrecognized historical agent; preserve without replacement')
        receipts = home / 'receipts'
        receipts.mkdir(exist_ok=True)
        stamp = str(time.time_ns())
        state_path = home / 'state.json'
        if state_path.exists():
            # A roster/runtime upgrade must never replay an older watcher's output intent.
            # Preserve the complete prior state, then cold-start the newly verified source.
            state_path.rename(receipts / (stamp + '-previous-state.json'))
        if plist_path.exists():
            shutil.copy2(plist_path, receipts / (stamp + '-previous-agent.plist'))
        runtime = home / 'runtime'
        if runtime.exists():
            runtime.rename(home / ('runtime-before-' + stamp))
        runtime.mkdir()
        for name in watcher.SOURCE_NAMES:
            shutil.copy2(source / name, runtime / name)
        watcher.atomic(runtime / 'installation.json', {'fingerprints': fingerprints,
                                                       'installedAt': time.time(), 'recordsRoot': str(root.resolve()),
                                                       'activityRoot': str(activity_root.resolve())})
        if watcher.fingerprints(runtime) != fingerprints:
            raise RuntimeError('Copied installation fingerprint mismatch; not bootstrapped')
        plist_path.parent.mkdir(parents=True, exist_ok=True)
        temporary = plist_path.with_suffix('.tmp')
        temporary.write_bytes(plistlib.dumps(agent_spec(runtime, home, Path(sys.executable).resolve(), root.resolve(), activity_root.resolve())))
        temporary.chmod(0o600)
        os.replace(temporary, plist_path)
        watcher.atomic(receipts / (stamp + '-install.json'), {'state': 'prepared', 'fingerprints': fingerprints})
    # Release singleton before launchd starts its sole daemon.
    enabled = launchctl('enable', f'gui/{os.getuid()}/{LABEL}')
    if enabled.returncode:
        raise RuntimeError('Could not explicitly enable the verified agent; not bootstrapped')
    result = launchctl('bootstrap', f'gui/{os.getuid()}', str(plist_path))
    if result.returncode:
        watcher.atomic(receipts / (stamp + '-install.json'), {'state': 'bootstrap-unconfirmed',
                       'exitCode': result.returncode, 'detail': result.stderr[:500]})
        raise RuntimeError('Bootstrap unconfirmed; inspect service status, never retry blindly')
    deadline = time.monotonic() + 8
    while time.monotonic() < deadline:
        current = status(home, plist_path)
        if current['processVerified'] and current['hashesVerified'] and current['rootsVerified']:
            watcher.atomic(receipts / (stamp + '-install.json'), {'state': 'running', 'status': current,
                                                                   'fingerprints': fingerprints})
            return current
        time.sleep(0.25)
    raise RuntimeError('Agent registered but PID identity not verified; stop, inspect status')


def disable(home, plist_path):
    current = status(home, plist_path)
    if current['registered'] and (not current['plistOwned'] or (current['pid'] and not current['processVerified'])):
        raise RuntimeError('Refuse to unload an unverified or PID-reused process')
    if not current['registered'] and not current['plistOwned']:
        return {**current, 'disabled': True, 'action': 'no-owned-agent'}
    result = launchctl('disable', f'gui/{os.getuid()}/{LABEL}')
    if result.returncode:
        raise RuntimeError('Persistent disable unconfirmed; do not retry blindly')
    if not current['registered']:
        return {**current, 'disabled': True, 'action': 'persistently-disabled'}
    result = launchctl('bootout', f'gui/{os.getuid()}/{LABEL}')
    if result.returncode:
        raise RuntimeError('Bootout unconfirmed; no direct PID signal or retry')
    deadline = time.monotonic() + 22
    while time.monotonic() < deadline:
        after = status(home, plist_path)
        if not after['registered'] and (not current['pid'] or
                watcher.process_identity(current['pid']) != current['currentIdentity']):
            return {**after, 'disabled': True}
        time.sleep(0.25)
    raise RuntimeError('Cleanup unverified; do not delete files or relaunch')


def uninstall(home, plist_path):
    result = disable(home, plist_path)
    if plist_path.exists():
        if not owned_spec(read_plist(plist_path), home / 'runtime'):
            raise RuntimeError('Refuse to remove a foreign/historical plist')
        saved = home / 'receipts' / (str(time.time_ns()) + '-uninstalled-agent.plist')
        saved.parent.mkdir(parents=True, exist_ok=True)
        plist_path.rename(saved)  # Preserve, never destroy runtime/state/old receipts.
    return {**result, 'uninstalled': True, 'preserved': str(home)}


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('action', choices=['status', 'install', 'disable', 'uninstall'])
    parser.add_argument('--records-root', type=Path, default=Path.home() / '.codex')
    parser.add_argument('--activity-root', type=Path, default=Path.home() / '.local-dev/activity')
    parser.add_argument('--dry-receipt', type=Path)
    parser.add_argument('--tests-receipt', type=Path)
    args = parser.parse_args()
    source = Path(__file__).resolve().parent
    home = DEFAULT_HOME
    plist_path = Path.home() / 'Library/LaunchAgents' / (LABEL + '.plist')
    if args.action == 'install':
        if not all((args.dry_receipt, args.tests_receipt)):
            parser.error('Installation requires local dry receipt and tests receipt')
        result = install(source, args.records_root.resolve(), args.activity_root.resolve(), home, plist_path,
                         args.dry_receipt, args.tests_receipt)
    else:
        result = {'status': status, 'disable': disable, 'uninstall': uninstall}[args.action](home, plist_path)
    print(json.dumps(result, sort_keys=True))


if __name__ == '__main__':
    main()
