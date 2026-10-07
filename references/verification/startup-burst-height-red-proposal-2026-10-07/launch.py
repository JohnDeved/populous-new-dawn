"""One-shot fixed-step red-test host; reuse the accepted arrival supervisor.

No native/app import. Separate exact-source acceptance and resource grant required.
"""
import datetime
import hashlib
import json
import os
import resource
import signal
import subprocess
import sys
import time
from pathlib import Path

ROOT = Path(__file__).resolve().parents[3]
MANIFEST = Path(__file__).with_name('launch.json')


def digest(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()


def launch(approved_head):
    assert sys.flags.ignore_environment and sys.flags.no_user_site and not sys.flags.optimize
    if len(approved_head) != 40 or any(c not in '0123456789abcdef' for c in approved_head):
        raise ValueError('Pass the exact independently reviewed commit from the parent execution grant')
    config = json.loads(MANIFEST.read_text())
    limits = config['hostLimits']
    assert limits == dict(termSeconds=50, killGraceSeconds=5, sampleSeconds=0.05,
                         aggregateRssBytes=1073741824, outputBytes=33554432,
                         cpuCount=1, retry=False, nativeCalls=0)
    assert 4 in os.sched_getaffinity(0)
    if ROOT.resolve() != Path(config['freshCwd']).resolve() or Path.cwd().resolve() != ROOT.resolve():
        raise RuntimeError('Use only the named fresh execution worktree')

    def git(*args):
        return subprocess.check_output(['/usr/bin/git', *args], cwd=ROOT, text=True).strip()

    def source():
        return {'head': git('rev-parse', 'HEAD'), 'status': git('status', '--porcelain'),
                'inputs': {name: digest(Path(name) if Path(name).is_absolute() else ROOT / name)
                           for name in config['inputsSha256']}, 'manifestSha256': digest(MANIFEST)}

    before = source()
    assert before['head'] == approved_head and before['status'] == ''
    assert before['inputs'] == config['inputsSha256'], 'Input fingerprint differs'
    output = ROOT / config['receiptOutput']
    if output.parent.exists():
        raise RuntimeError('The one-shot output directory already exists; no retry')
    output.parent.mkdir(parents=True, exist_ok=False)
    with (output.parent / 'launch-once.json').open('x') as stream:
        json.dump({'approvedHead': approved_head, 'launcherManifestSha256': before['manifestSha256'],
                   'mode': 'one separately authorized production-caller red test'}, stream)
        stream.write('\n')
    now = lambda: datetime.datetime.now(datetime.timezone.utc).isoformat()
    started = time.monotonic()
    term_deadline = started + limits['termSeconds']
    kill_deadline = term_deadline + limits['killGraceSeconds']
    receipt = {'status': 'running', 'sourceBefore': before, 'startedAt': now(),
               'command': config['supervisorArgv'], 'limits': limits, 'cpu': [4],
               'termDeadlineMonotonic': term_deadline, 'killDeadlineMonotonic': kill_deadline,
               'peakAggregateRssBytes': 0, 'outputBytes': 0, 'cleanupSignals': [], 'oneInvocation': True}
    receipt_path = output.parent / 'host-receipt.json'
    child, known_session, ownership_verified = None, None, False
    owned, observed, read_errors = {}, {}, set()

    def save():
        receipt_path.write_text(json.dumps(receipt, indent=2) + '\n')

    def process_info(pid):
        try:
            raw = Path(f'/proc/{pid}/stat').read_text()
            fields = raw[raw.rfind(')') + 2:].split()
            return {'pid': pid, 'state': fields[0], 'parent': int(fields[1]),
                    'group': int(fields[2]), 'session': int(fields[3]),
                    'startTimeTicks': int(fields[19]),
                    'rssBytes': int(fields[21]) * os.sysconf('SC_PAGE_SIZE')}
        except (FileNotFoundError, ProcessLookupError):
            return None
        except (OSError, ValueError, IndexError):
            read_errors.add(pid)
            return None

    def observe_owned():
        current = {}
        for path in Path('/proc').iterdir():
            if path.name.isdigit():
                info = process_info(int(path.name))
                if info:
                    current[info['pid']] = info
        live = {pid: row for pid, row in current.items() if owned.get(pid) == row['startTimeTicks']}
        # GNU timeout may create a second group in the same owned session.
        # Session and PID/start ownership also survive leader exit/reparenting.
        for pid, row in current.items():
            if known_session is not None and row['session'] == known_session:
                if pid in owned and owned[pid] != row['startTimeTicks']:
                    read_errors.add(pid)
                    continue
                live[pid] = row
                owned[pid] = row['startTimeTicks']
        while True:
            added = {pid: row for pid, row in current.items() if pid not in live and row['parent'] in live}
            if not added:
                break
            live.update(added)
            for pid, row in added.items():
                owned[pid] = row['startTimeTicks']
        for pid, row in live.items():
            observed[(pid, row['startTimeTicks'])] = row.copy()
        return {pid: row for pid, row in live.items() if row['state'] != 'Z'}

    def signal_owned(sig):
        for pid, row in observe_owned().items():
            latest = process_info(pid)
            if not latest or latest['startTimeTicks'] != row['startTimeTicks']:
                continue
            try:
                os.kill(pid, sig)
                receipt['cleanupSignals'].append({'pid': pid, 'group': row['group'],
                    'session': row['session'], 'startTimeTicks': row['startTimeTicks'],
                    'signal': signal.Signals(sig).name})
            except ProcessLookupError:
                pass

    def artifacts():
        return [p for p in output.parent.rglob('*') if p.is_file() and p != receipt_path]

    def output_size():
        return sum(path.stat().st_size for path in artifacts())

    def interrupted(signum, _frame):
        receipt['status'] = 'interrupted'
        raise SystemExit(128 + signum)

    def child_limits():
        os.sched_setaffinity(0, {4})
        resource.setrlimit(resource.RLIMIT_FSIZE, (limits['outputBytes'], limits['outputBytes']))

    for sig in (signal.SIGTERM, signal.SIGINT):
        signal.signal(sig, interrupted)
    save()
    try:
        with (output.parent / 'supervisor.stdout.log').open('xb') as stdout, \
             (output.parent / 'supervisor.stderr.log').open('xb') as stderr:
            # Exactly one owned supervisor; its immutable argv still starts the
            # existing command-receipt and the bounded fixed-step test child.
            child = subprocess.Popen(config['supervisorArgv'], cwd=ROOT, start_new_session=True,
                                     preexec_fn=child_limits, stdout=stdout, stderr=stderr)
            known_session = child.pid
            identity = process_info(child.pid)
            ownership_verified = bool(identity and identity['session'] == known_session and identity['group'] == child.pid)
            receipt['rootProcessIdentity'] = identity
            receipt['rootSession'] = known_session
            if ownership_verified:
                owned[child.pid] = identity['startTimeTicks']
            else:
                receipt['cleanupUnknownReason'] = 'Initial PID/start/session identity was not observable'
            save()
            while child.poll() is None:
                members = observe_owned()
                own = process_info(os.getpid())
                rss = sum(row['rssBytes'] for row in members.values()) + (own['rssBytes'] if own else 0)
                receipt['peakAggregateRssBytes'] = max(receipt['peakAggregateRssBytes'], rss)
                receipt['outputBytes'] = output_size()
                failure = ('rss-cap' if rss > limits['aggregateRssBytes'] else
                           'output-cap' if receipt['outputBytes'] > limits['outputBytes'] - 262144 else
                           'time-cap' if time.monotonic() >= term_deadline else None)
                if failure:
                    receipt['status'] = failure
                    break
                time.sleep(limits['sampleSeconds'])
            if child.poll() is not None:
                receipt['exitCode'] = child.wait(timeout=1)
                if receipt['status'] == 'running':
                    receipt['status'] = 'child-finished' if receipt['exitCode'] == 0 else 'child-failed'
    except BaseException as error:
        receipt['failure'] = repr(error)
        if receipt['status'] == 'running':
            receipt['status'] = 'host-failed'
    finally:
        # One immutable absolute grace boundary, never extended by another wait.
        if child:
            signal_owned(signal.SIGTERM)
            while observe_owned() and time.monotonic() < kill_deadline:
                time.sleep(limits['sampleSeconds'])
            signal_owned(signal.SIGKILL)
            try:
                receipt['exitCode'] = child.wait(timeout=1)
            except subprocess.TimeoutExpired:
                receipt['childWaitExpired'] = True
        remaining = observe_owned() if child else {}
        receipt['ownedProcessIdentities'] = list(observed.values())
        receipt['checkedGroups'] = sorted({row['group'] for row in observed.values()})
        receipt['remainingOwnedProcesses'] = list(remaining.values())
        receipt['remainingGroups'] = sorted({row['group'] for row in remaining.values()})
        receipt['ownershipVerified'] = ownership_verified
        receipt['processReadErrors'] = sorted(read_errors)
        receipt['resourcesReleased'] = ownership_verified and not read_errors and not remaining
        try:
            receipt['sourceAfter'] = source()
            receipt['sourceUnchanged'] = receipt['sourceAfter'] == before
        except Exception as error:
            receipt['sourceUnchanged'] = False
            receipt['postflightError'] = repr(error)
        try:
            terminal = json.loads(output.read_text())
            receipt['commandReceiptStatus'] = terminal['status']
        except Exception as error:
            receipt['commandReceiptStatus'] = 'missing-or-unreadable'
            receipt['commandReceiptError'] = repr(error)
        receipt['outputBytes'] = output_size()
        receipt['outputs'] = [{'path': str(path.relative_to(output.parent)), 'bytes': path.stat().st_size,
                               'sha256': digest(path)} for path in sorted(artifacts())]
        receipt['finishedAt'] = now()
        receipt['elapsedSeconds'] = time.monotonic() - started
        receipt['passed'] = (receipt['status'] == 'child-finished' and receipt.get('exitCode') == 0
            and receipt['resourcesReleased'] and receipt['sourceUnchanged']
            and receipt['commandReceiptStatus'] == 'passed'
            and receipt['outputBytes'] <= limits['outputBytes'] - 262144)
        save()
    print(json.dumps({key: receipt.get(key) for key in
                     ('status', 'passed', 'exitCode', 'resourcesReleased', 'sourceUnchanged', 'remainingGroups')}))
    return 0 if receipt['passed'] else 1


if __name__ == '__main__':
    if len(sys.argv) != 3 or sys.argv[1] != '--execute-reviewed':
        raise SystemExit('Usage only after separate resource grant: launch.py --execute-reviewed APPROVED_FULL_HEAD')
    sys.exit(launch(sys.argv[2]))
