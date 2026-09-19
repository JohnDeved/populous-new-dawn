#!/usr/bin/env python3
"""Local final-handoff/error-record watcher; no UI or inferred activity/idle status."""
from __future__ import annotations

import argparse
from contextlib import contextmanager
import fcntl
import hashlib
import json
import logging
from logging.handlers import RotatingFileHandler
import os
from pathlib import Path
import re
import signal
import subprocess
import tempfile
import time
import uuid

import records

COORDINATOR = records.COORDINATOR
CLI = Path.home() / '.nvm/versions/node/v24.18.0/bin/codex'
SOURCE_NAMES = ('watcher.py', 'records.py', 'lifecycle.py', 'service.py', 'managed.json')
MODE = 'local-lifecycle-v3'


def sha(path):
    return hashlib.sha256(Path(path).read_bytes()).hexdigest()


def fingerprints(source):
    return {name: sha(source / name) for name in SOURCE_NAMES}


def configuration(path):
    return records.configuration(path)


def atomic(path, value):
    path = Path(path)
    path.parent.mkdir(parents=True, exist_ok=True, mode=0o700)
    fd, temporary = tempfile.mkstemp(prefix=path.name + '.', dir=path.parent)
    try:
        with os.fdopen(fd, 'w') as file:
            json.dump(value, file, sort_keys=True, allow_nan=False)
            file.write('\n')
            file.flush()
            os.fsync(file.fileno())
        os.replace(temporary, path)
        descriptor = os.open(path.parent, os.O_RDONLY)
        try:
            os.fsync(descriptor)
        finally:
            os.close(descriptor)
    finally:
        if os.path.exists(temporary):
            os.unlink(temporary)


@contextmanager
def singleton(directory):
    directory.mkdir(parents=True, exist_ok=True, mode=0o700)
    with (directory / 'watcher.lock').open('a') as lock:
        fcntl.flock(lock, fcntl.LOCK_EX | fcntl.LOCK_NB)
        yield


def process_identity(pid):
    """No environment inspection; creation time plus full command prevents PID reuse."""
    result = subprocess.run(['/bin/ps', '-p', str(pid), '-o', 'lstart=', '-o', 'command='],
                            capture_output=True, text=True, timeout=3)
    text = result.stdout.strip()
    return {'pid': pid, 'description': text} if result.returncode == 0 and text else None


class CleanupUnverified(RuntimeError):
    """Stop the daemon when a timed-out local child's ownership cannot be proved."""


def child(argv, timeout):
    """Bounded local child; only the owned, still-identical session may be killed."""
    process = subprocess.Popen(argv, stdout=subprocess.PIPE, stderr=subprocess.PIPE,
                               text=True, start_new_session=True,
                               env={**os.environ, 'PATH': str(CLI.parent) + ':' + os.environ.get('PATH', '')})
    try:
        identity = process_identity(process.pid)
    except subprocess.SubprocessError:
        identity = None
    try:
        stdout, stderr = process.communicate(timeout=timeout)
    except subprocess.TimeoutExpired:
        if process.poll() is not None or identity is None or process_identity(process.pid) != identity:
            raise CleanupUnverified('Child timeout; cleanup ownership unverified; stop without retry')
        os.killpg(process.pid, signal.SIGTERM)
        try:
            process.communicate(timeout=2)
        except subprocess.TimeoutExpired:
            if process.poll() is None and process_identity(process.pid) == identity:
                os.killpg(process.pid, signal.SIGKILL)
                process.communicate(timeout=2)
            else:
                raise CleanupUnverified('Child descendants unresolved; stop without retry')
        raise TimeoutError('Owned local child timed out; notification is not retried')
    if len(stdout) > 65536 or len(stderr) > 65536:
        raise ValueError('Unexpected local child output size')
    return subprocess.CompletedProcess(argv, process.returncode, stdout, stderr)


def enqueue(message):
    # Output only. No other CLI subcommand or destination is reachable here.
    result = child([str(CLI), 'queue', '--thread', COORDINATOR, '--message', message], 12)
    confirmed = result.returncode == 0 and re.search(
        r'Queued message [^\n]+ for thread ' + re.escape(COORDINATOR), result.stdout)
    return {'confirmed': bool(confirmed), 'exitCode': result.returncode,
            'detail': (result.stdout if confirmed else result.stderr or result.stdout)[:500]}


def logger(directory):
    log = logging.getLogger('passive-worker-watch.' + str(directory))
    log.setLevel(logging.INFO)
    log.propagate = False
    if not log.handlers:
        handler = RotatingFileHandler(directory / 'watcher.log', maxBytes=262144, backupCount=2)
        handler.setFormatter(logging.Formatter('%(asctime)s %(message)s'))
        log.addHandler(handler)
    return log


def new_state(config, root, now):
    return {'version': 3, 'mode': MODE, 'configuration': records.digest(json.dumps(config, sort_keys=True)),
            'dataRoot': str(root.resolve()), 'startedAt': now, 'seen': {}, 'latestFinal': {},
            'events': [], 'pending': {}, 'attempts': [], 'nextNotifyAt': 0,
            'notificationFailures': 0, 'outputBlocked': False,
            'readerFailures': 0, 'nextReadAt': 0, 'observations': 0, 'lastObservationAt': 0,
            'lifecycleSeen': {}, 'lifecycleRuns': {}, 'lifecycleTerminal': {}}


def validate_event(event, key, kind):
    """Validate every field used after loading; malformed intent must be quarantined."""
    prefixes = {'final_report': 'final:', 'local_error': 'error:',
                'lifecycle_interruption': 'interrupt:',
                'lifecycle_completion': 'completion:'}
    prefix = prefixes.get(kind)
    if (prefix is None or not isinstance(event, dict)
            or not isinstance(key, str) or not re.fullmatch(re.escape(prefix) + r'[0-9a-f]{64}', key)
            or event.get('key') != key or event.get('kind') != kind
            or event.get('worker') not in records.WORKERS.values()
            or type(event.get('number')) is not int
            or records.WORKERS.get(event['number']) != event['worker']
            or records.timestamp(event.get('at')) is None):
        raise ValueError('Invalid persisted event identity/kind/timestamp')
    record_key = event.get('recordKey')
    if not isinstance(record_key, str) or len(record_key) > 256:
        raise ValueError('Invalid persisted event record key')
    if kind == 'local_error':
        expected = 'turn:' + event['worker'] + ':'
        if (event.get('source') != 'thread_turns' or event.get('alreadyAddressedToCoordinator') is not False
                or not record_key.startswith(expected) or len(record_key) == len(expected)):
            raise ValueError('Invalid persisted pending-error fields')
    elif kind in {'lifecycle_interruption', 'lifecycle_completion'}:
        allowed = ({'INTERRUPTED'} if kind == 'lifecycle_interruption'
                   else {'COMPLETED', 'FAILED', 'CANCELLED'})
        if (event.get('source') != 'localdev_activity'
                or event.get('alreadyAddressedToCoordinator') is not False
                or event.get('reportedState') not in allowed
                or event.get('attribution') != 'localdev-role-self-report'
                or not isinstance(event.get('runId'), str) or not event['runId'] or len(event['runId']) > 80
                or not record_key.startswith('activity:') or len(record_key) <= len('activity:')):
            raise ValueError('Invalid persisted lifecycle terminal fields')
    elif (event.get('alreadyAddressedToCoordinator') is not True
          or event.get('source') not in {'queued_items', 'thread_items', 'thread_realtime_items'}
          or event.get('reportedState') not in records.FINAL_STATES
          or event.get('attribution') not in {'current-roster-self-report', 'explicit-id-self-report'}
          or not record_key.startswith('coordinator:') or len(record_key) == len('coordinator:')):
        raise ValueError('Invalid persisted final-report fields')


def validate_lifecycle_run(key, run):
    if (not isinstance(key, str) or len(key) > 180 or not isinstance(run, dict)
            or not isinstance(run.get('runtimeId'), str) or not run['runtimeId']
            or not isinstance(run.get('runId'), str) or not run['runId']
            or key != run['runtimeId'] + ':' + run['runId']
            or records.timestamp(run.get('startedAt')) is None
            or records.timestamp(run.get('lastAt')) is None
            or run['lastAt'] < run['startedAt']
            or run.get('state') not in {'running', 'completed', 'failed', 'cancelled', 'interrupted'}):
        raise ValueError('Invalid persisted lifecycle run')
    number = run.get('number')
    worker = run.get('worker')
    if number is None:
        if worker is not None:
            raise ValueError('Lifecycle run has worker without role number')
    elif (type(number) is not int or number not in records.WORKERS
          or worker != records.WORKERS[number]):
        raise ValueError('Invalid lifecycle role binding')

def load_state(path, config, root, now):
    if not path.exists():
        return new_state(config, root, now)
    try:
        state = json.loads(path.read_text())
        expected = new_state(config, root, now)
        if any(state.get(k) != expected[k] for k in ('version', 'mode', 'configuration', 'dataRoot')):
            raise ValueError('Incompatible or legacy watcher state')
        state.setdefault('lifecycleTerminal', {})
        for key in ('seen', 'latestFinal', 'pending', 'lifecycleSeen', 'lifecycleRuns',
                    'lifecycleTerminal'):
            if not isinstance(state.get(key), dict):
                raise ValueError('Invalid event map')
        for key in ('events', 'attempts'):
            if not isinstance(state.get(key), list):
                raise ValueError('Invalid receipt list')
        for key in ('startedAt', 'nextNotifyAt', 'lastObservationAt', 'nextReadAt'):
            if type(state.get(key)) not in (int, float) or not records.math.isfinite(state[key]):
                raise ValueError('Invalid persisted deadline')
        if type(state.get('outputBlocked')) is not bool:
            raise ValueError('Invalid output fuse')
        for key in ('notificationFailures', 'readerFailures', 'observations'):
            if type(state.get(key)) is not int or state[key] < 0:
                raise ValueError('Invalid counter')
        if any(type(at) not in (int, float) or not records.math.isfinite(at)
               for mapping in (state['seen'], state['lifecycleSeen']) for at in mapping.values()):
            raise ValueError('Invalid seen-event timestamp')
        if any(worker not in records.WORKERS.values()
               or records.timestamp(at) is None
               for worker, at in state['lifecycleTerminal'].items()):
            raise ValueError('Invalid lifecycle terminal watermark')
        if (len(state['seen']) > 2048 or len(state['lifecycleSeen']) > 4096
                or len(state['lifecycleRuns']) > 256
                or len(state['attempts']) > 64 or len(state['events']) > 128):
            raise ValueError('Persisted event bounds exceeded')
        for key, run in state['lifecycleRuns'].items():
            validate_lifecycle_run(key, run)
        for key, event in state['pending'].items():
            validate_event(event, key, event.get('kind') if isinstance(event, dict) else None)
        for worker, event in state['latestFinal'].items():
            validate_event(event, event.get('key') if isinstance(event, dict) else None, 'final_report')
            if worker != event['worker']:
                raise ValueError('Final-report map identity mismatch')
        for event in state['events']:
            if not isinstance(event, dict):
                raise ValueError('Invalid persisted event journal')
            validate_event(event, event.get('key'), event.get('kind'))
        # Upgrade retained v2 receipts without inventing an original timestamp.
        # Final semantic keys never age out; the map's capacity remains fail-closed.
        finals = [e for e in state['events'] if e['kind'] == 'final_report'] + list(state['latestFinal'].values())
        for event in finals:
            key = event['key']
            state['seen'][key] = min(state['seen'].get(key, event['at']), event['at'])
        if len(state['seen']) > 2048:
            raise ValueError('Final identity preservation exceeds dedupe capacity')
        for event in finals:
            canonical = {**event, 'at': state['seen'][event['key']]}
            prior = state['latestFinal'].get(event['worker'])
            if prior and prior['key'] == canonical['key']:
                prior['at'] = canonical['at']
            elif prior is None or prior['at'] < canonical['at']:
                state['latestFinal'][event['worker']] = canonical
        for attempt in state['attempts']:
            if not isinstance(attempt, dict) or records.timestamp(attempt.get('at')) is None:
                raise ValueError('Invalid output intent')
        # Intent already consumed those events. Unknown output is never resubmitted.
        for attempt in state['attempts']:
            if attempt.get('state') == 'uncertain':
                attempt['state'] = 'unknown-after-restart'
                state['notificationFailures'] += 1
                state['nextNotifyAt'] = max(state['nextNotifyAt'], attempt['at'] + config['failureBackoffSeconds'])
        return state
    except (ValueError, TypeError, KeyError, AttributeError):
        # Preserve unreadable/legacy output intent; no automatic replay on migration.
        path.rename(path.with_name('state.preserved.' + uuid.uuid4().hex + '.json'))
        state = new_state(config, root, now)
        state['outputBlocked'] = True
        state['recovery'] = 'prior-state-preserved; output requires owner review'
        return state


def covered(error, finals):
    report = finals.get(error['worker'])
    return bool(report and report['at'] >= error['at'])


def _lifecycle_event_identity(event, now, age):
    if (not isinstance(event, dict) or event.get('type') not in
            {'run.started', 'run.goal', 'run.ended', 'run.interrupted'}
            or not isinstance(event.get('runtimeId'), str) or not event['runtimeId']
            or len(event['runtimeId']) > 80
            or type(event.get('sequence')) is not int or event['sequence'] < 1
            or not isinstance(event.get('runId'), str) or not event['runId']
            or len(event['runId']) > 80
            or records.timestamp(event.get('at')) is None
            or not 0 <= now - event['at'] <= age):
        raise records.EvidenceUnavailable('Malformed Local Dev lifecycle event')
    number = event.get('number')
    worker = event.get('worker')
    if number is not None and (type(number) is not int or number not in records.WORKERS
                               or worker != records.WORKERS[number]):
        raise records.EvidenceUnavailable('Malformed Local Dev lifecycle role binding')
    return event['runtimeId'] + ':' + event['runId']


def _observe_lifecycle(state, snapshot, config, now):
    age = config['eventMaxAgeSeconds']
    events = snapshot.get('lifecycleEvents')
    coverage = snapshot.get('lifecycleCoverage')
    if not isinstance(events, list) or not isinstance(coverage, dict):
        raise records.EvidenceUnavailable('Local Dev lifecycle coverage missing')
    if coverage.get('idle') is not False or coverage.get('runningMeansActive') is not False:
        raise records.EvidenceUnavailable('Local Dev lifecycle claims are unsafe')
    state['lifecycleCoverage'] = coverage
    state['activityRoot'] = snapshot.get('activityRoot')
    state['lifecycleSeen'] = {
        key: at for key, at in state['lifecycleSeen'].items()
        if 0 <= now - at <= age * 2
    }
    state['lifecycleRuns'] = {
        key: run for key, run in state['lifecycleRuns'].items()
        if run['state'] == 'running' or 0 <= now - run['lastAt'] <= age * 2
    }
    terminal = []
    incoming = []
    for event in sorted(events, key=lambda item: (item.get('at', 0), item.get('runtimeId', ''),
                                                  item.get('sequence', 0))):
        run_key = _lifecycle_event_identity(event, now, age)
        event_key = 'life:' + records.digest(
            event['runtimeId'] + ':' + str(event['sequence']) + ':' + event['type'] + ':' + event['runId'])
        if event_key in state['lifecycleSeen']:
            continue
        if len(state['lifecycleSeen']) >= 4096:
            raise records.EvidenceUnavailable('Lifecycle deduplication capacity exceeded')
        state['lifecycleSeen'][event_key] = event['at']
        run = state['lifecycleRuns'].get(run_key)
        if event['type'] == 'run.started':
            if run is None:
                run = {
                    'runtimeId': event['runtimeId'], 'runId': event['runId'],
                    'startedAt': event['at'], 'lastAt': event['at'], 'state': 'running',
                    'number': event.get('number'), 'worker': event.get('worker'),
                }
                state['lifecycleRuns'][run_key] = run
            else:
                run['lastAt'] = max(run['lastAt'], event['at'])
            continue
        if event['type'] == 'run.goal':
            if run is None or run['state'] != 'running':
                continue
            run['lastAt'] = max(run['lastAt'], event['at'])
            number = event.get('number')
            if number is not None:
                if run.get('number') in (None, number):
                    run['number'], run['worker'] = number, records.WORKERS[number]
                else:
                    # Conflicting self-labels make the run unidentifiable, not a completion claim.
                    run['number'], run['worker'] = None, None
            continue
        if run is None or run['state'] != 'running':
            continue
        run['lastAt'] = max(run['lastAt'], event['at'])
        if event['type'] == 'run.ended':
            run['state'] = event.get('state')
            terminal.append((run_key, dict(run), event, 'lifecycle_completion'))
        else:
            run['state'] = 'interrupted'
            terminal.append((run_key, dict(run), event, 'lifecycle_interruption'))

    # Decide terminal wakes only after the complete lifecycle batch is known. This
    # prevents an older completion from claiming availability while another managed
    # run for the same worker is already active in the same observed window.
    for run_key, run, event, kind in terminal:
        number, worker = run.get('number'), run.get('worker')
        if number is None or worker is None:
            continue
        reported = 'INTERRUPTED' if kind == 'lifecycle_interruption' else str(event.get('state', '')).upper()
        prefix = 'interrupt:' if kind == 'lifecycle_interruption' else 'completion:'
        key = prefix + records.digest(run_key + ':' + reported + ':' + str(event['at']))
        if key in state['seen']:
            continue
        if len(state['seen']) >= 2048:
            raise records.EvidenceUnavailable('Event deduplication capacity exceeded')
        state['seen'][key] = now
        notice = {
            'key': key, 'recordKey': 'activity:' + run_key,
            'worker': worker, 'number': number, 'kind': kind,
            'reportedState': reported, 'at': event['at'], 'source': 'localdev_activity',
            'attribution': 'localdev-role-self-report',
            'alreadyAddressedToCoordinator': False, 'runId': event['runId'],
        }
        prior_terminal = state['lifecycleTerminal'].get(worker, 0)
        active_other = any(
            other_key != run_key and other.get('worker') == worker and other.get('state') == 'running'
            for other_key, other in state['lifecycleRuns'].items()
        )
        receipt = {**notice}
        if event['at'] <= state['startedAt']:
            receipt['disposition'] = 'baseline-terminal'
        elif event['at'] <= prior_terminal:
            receipt['disposition'] = 'stale-terminal-suppressed'
        elif active_other:
            receipt['disposition'] = 'superseded-by-active-run'
        elif covered(notice, state['latestFinal']):
            receipt['disposition'] = 'covered-by-final-report'
        else:
            state['pending'][key] = notice
            receipt['disposition'] = ('pending-interruption-notice'
                                      if kind == 'lifecycle_interruption'
                                      else 'pending-completion-notice')
        state['lifecycleTerminal'][worker] = max(prior_terminal, event['at'])
        state['events'] = (state['events'] + [receipt])[-128:]
        incoming.append(receipt)

    # A completion may have been retained during notification backoff. If a later
    # observation shows another same-worker managed run still running, consume the
    # stale pending wake instead of sending it after the worker is active again.
    for key, notice in list(state['pending'].items()):
        if notice.get('kind') != 'lifecycle_completion':
            continue
        if any(run.get('worker') == notice['worker'] and run.get('state') == 'running'
               for run in state['lifecycleRuns'].values()):
            del state['pending'][key]
            receipt = {**notice, 'disposition': 'pending-superseded-by-active-run'}
            state['events'] = (state['events'] + [receipt])[-128:]
            incoming.append(receipt)
    if len(state['lifecycleRuns']) > 256:
        raise records.EvidenceUnavailable('Lifecycle run capacity exceeded')
    return incoming


def observe(state, snapshot, config, now):
    if snapshot['dataRoot'] != state['dataRoot'] or snapshot['version'] != 3:
        raise records.EvidenceUnavailable('Snapshot identity mismatch')
    if now < state['lastObservationAt'] or not 0 <= now - snapshot['at'] <= 10:
        raise records.EvidenceUnavailable('Observation clock moved backwards or stale snapshot')
    if not snapshot['complete']:
        raise records.EvidenceUnavailable('Managed metadata binding is missing or ambiguous')
    state['observations'] += 1
    state['lastObservationAt'] = now
    state['workers'] = snapshot['workers']
    state['capabilities'] = snapshot['claims']
    state['localTurnCoverage'] = snapshot['localTurnCoverage']
    age = config['eventMaxAgeSeconds']
    state['seen'] = {k: at for k, at in state['seen'].items()
                     if k.startswith('final:') or now - at <= age * 2}
    incoming = []
    # Coordinator finals first: an explicit handoff can cover local error/lifecycle evidence
    # observed in the same read.
    events = sorted(snapshot['events'], key=lambda e: (e['kind'] != 'final_report', e['at']))
    for event in events:
        if not 0 <= now - event['at'] <= age or event['worker'] not in records.WORKERS.values():
            continue
        if event['key'] in state['seen']:
            if event['kind'] == 'final_report':
                original = min(state['seen'][event['key']], event['at'])
                state['seen'][event['key']] = original
                prior = state['latestFinal'].get(event['worker'])
                if prior and prior['key'] == event['key']:
                    prior['at'] = min(prior['at'], original)
            continue
        if event['kind'] == 'final_report':
            prior = state['latestFinal'].get(event['worker'])
            if prior is None or prior['at'] < event['at']:
                state['latestFinal'][event['worker']] = event
        if len(state['seen']) >= 2048:
            raise records.EvidenceUnavailable('Event deduplication capacity exceeded')
        state['seen'][event['key']] = event['at'] if event['kind'] == 'final_report' else now
        receipt = {**event, 'disposition': 'baseline' if event['at'] <= state['startedAt'] else 'observed'}
        if event['kind'] == 'final_report':
            receipt['disposition'] = 'covered-by-coordinator-handoff'
        elif event['kind'] == 'local_error' and event['at'] > state['startedAt']:
            if covered(event, state['latestFinal']):
                receipt['disposition'] = 'covered-by-final-report'
            else:
                state['pending'][event['key']] = event
                receipt['disposition'] = 'pending-error-notice'
        else:
            receipt['disposition'] = 'baseline-or-unsupported'
        state['events'] = (state['events'] + [receipt])[-128:]
        incoming.append(receipt)
    incoming.extend(_observe_lifecycle(state, snapshot, config, now))
    state['pending'] = {
        key: event for key, event in state['pending'].items()
        if 0 <= now - event['at'] <= age and not covered(event, state['latestFinal'])
    }
    return incoming


def notify_pending(state, config, now, persist, output=enqueue):
    for key, event in state['pending'].items():
        validate_event(event, key, event.get('kind') if isinstance(event, dict) else None)
    if state['outputBlocked'] or now < state['nextNotifyAt']:
        return None
    eligible = [
        event for event in state['pending'].values()
        if event['kind'] in {'local_error', 'lifecycle_interruption', 'lifecycle_completion'}
        and not event['alreadyAddressedToCoordinator']
        and 0 <= now - event['at'] <= config['eventMaxAgeSeconds']
        and not covered(event, state['latestFinal'])
    ]
    state['pending'] = {}
    if not eligible:
        return None
    parts = []
    for event in eligible[:16]:
        prefix = f"Worker {event['number']}c | chat_id={event['worker']}"
        if event['kind'] == 'local_error':
            parts.append(prefix + f" | recorded failed turn at {event['at']:.3f}")
        elif event['kind'] == 'lifecycle_interruption':
            parts.append(prefix + f" | Local Dev run {event['runId']} interrupted without assistant completion at {event['at']:.3f}")
        else:
            parts.append(prefix + f" | Local Dev run {event['runId']} ended {event['reportedState'].lower()} at {event['at']:.3f} | completion wake")
    message = 'Local worker watcher | LOCAL RECORD NOTICE | ' + '; '.join(parts)
    if len(eligible) > 16:
        message += f'; plus {len(eligible) - 16} additional explicit local records in the retained receipt'
    message += ('. Explicit local lifecycle/error evidence only. A completion wake proves only that '
                'the attributed Local Dev run ended; the watcher suppresses it when another managed '
                'run for that worker is active in the same observed lifecycle window. This does not '
                'infer silent UI idle or future availability. No task restarted.')
    attempt = {'at': now, 'state': 'uncertain', 'keys': [e['key'] for e in eligible],
               'messageSha256': records.digest(message)}
    state['attempts'] = (state['attempts'] + [attempt])[-64:]
    state['nextNotifyAt'] = now + config['failureBackoffSeconds']
    persist(state)
    try:
        result = output(message)
    except Exception as error:
        result = {'confirmed': False, 'detail': type(error).__name__ + ': ' + str(error)[:200]}
        if isinstance(error, CleanupUnverified):
            state['outputBlocked'] = True
            attempt['receipt'] = result
            persist(state)
            raise
    attempt['receipt'] = result
    if result.get('confirmed') is True:
        attempt['state'] = 'confirmed'
        state['notificationFailures'] = 0
        state['nextNotifyAt'] = now + config['notifySeconds']
    else:
        attempt['state'] = 'unknown-no-retry'
        state['notificationFailures'] += 1
        delay = min(config['maxFailureBackoffSeconds'],
                    config['failureBackoffSeconds'] * 2 ** min(state['notificationFailures'] - 1, 12))
        state['nextNotifyAt'] = now + delay
    persist(state)
    return result

def cycle_succeeded(state, config, now):
    # Only full read + processing/output completion clears an earlier failure.
    state['readerFailures'] = 0
    state['nextReadAt'] = now + config['pollSeconds']
    state['health'] = {'status': 'ok', 'at': now}


def cycle_failed(state, config, now, problem):
    state['readerFailures'] += 1
    state['nextReadAt'] = now + min(300, config['pollSeconds'] * 2 ** min(state['readerFailures'] - 1, 5))
    state['health'] = {'status': 'read-error', 'at': now, 'detail': problem}


def dry(source, root, destination, activity_root=None):
    config = configuration(source / 'managed.json')
    bound = fingerprints(source)
    receipt = {'mode': MODE, 'startedAt': time.time(), 'fingerprints': bound,
               'notificationCalls': 0, 'status': 'blocked'}
    try:
        snapshot = records.snapshot(root, config, time.time(), activity_root)
        state = new_state(config, root, snapshot['at'])
        observe(state, snapshot, config, time.time())
        receipt.update(status='passed', snapshot=snapshot,
                       coldStartPending=len(state['pending']), observedFinals=len(state['latestFinal']))
    except Exception as error:
        receipt['blocker'] = type(error).__name__ + ': ' + str(error)[:300]
    receipt['finishedAt'] = time.time()
    receipt['sourceUnchanged'] = fingerprints(source) == bound
    if not receipt['sourceUnchanged']:
        receipt.update(status='blocked', blocker='source changed during observation')
    atomic(destination, receipt)
    return receipt


def daemon(source, directory, root, activity_root):
    config = configuration(source / 'managed.json')
    manifest = json.loads((source / 'installation.json').read_text())
    if (manifest['fingerprints'] != fingerprints(source)
            or manifest['recordsRoot'] != str(root.resolve())
            or manifest['activityRoot'] != str(activity_root.resolve())):
        raise RuntimeError('Installed runtime/root differs from verified manifest')
    with singleton(directory):
        path = directory / 'state.json'
        state = load_state(path, config, root, time.time())
        identity = process_identity(os.getpid())
        if identity is None:
            raise RuntimeError('Cannot establish daemon PID identity')
        state['process'] = {**identity, 'running': True, 'runId': uuid.uuid4().hex}
        atomic(path, state)
        log = logger(directory)
        stopping = False

        def stop(*_):
            nonlocal stopping
            stopping = True

        signal.signal(signal.SIGTERM, stop)
        signal.signal(signal.SIGINT, stop)
        last_problem = None
        try:
            while not stopping:
                now = time.time()
                if now >= state['nextReadAt']:
                    try:
                        snapshot = records.snapshot(root, config, now, activity_root)
                        events = observe(state, snapshot, config, time.time())
                        for event in events:
                            log.info('Local event: %s', json.dumps(event, sort_keys=True))
                        atomic(path, state)
                        result = notify_pending(state, config, time.time(), lambda s: atomic(path, s))
                        if result is not None:
                            log.info('Output receipt: %s', json.dumps(result, sort_keys=True))
                        cycle_succeeded(state, config, time.time())
                        atomic(path, state)
                        if last_problem is not None:
                            log.info('Local records recovered')
                            last_problem = None
                    except CleanupUnverified as error:
                        state['outputBlocked'] = True
                        state['health'] = {'status': 'cleanup-unverified', 'at': now, 'detail': str(error)}
                        atomic(path, state)
                        return 2
                    except Exception as error:
                        problem = type(error).__name__ + ': ' + str(error)[:300]
                        cycle_failed(state, config, now, problem)
                        if problem != last_problem:
                            log.warning('Local evidence unavailable, not a worker error: %s', problem)
                            last_problem = problem
                        atomic(path, state)
                time.sleep(min(1, max(0.05, state['nextReadAt'] - time.time())))
        finally:
            state['process']['running'] = False
            atomic(path, state)
        return 0


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('mode', choices=['dry', 'run'])
    parser.add_argument('--state-dir', type=Path)
    parser.add_argument('--records-root', type=Path, default=Path.home() / '.codex')
    parser.add_argument('--activity-root', type=Path, default=Path.home() / '.local-dev/activity')
    parser.add_argument('--receipt', type=Path)
    args = parser.parse_args()
    source = Path(__file__).resolve().parent
    if args.mode == 'dry':
        if args.receipt is None:
            parser.error('--receipt is required for dry mode')
        receipt = dry(source, args.records_root.resolve(), args.receipt, args.activity_root.resolve())
        print(json.dumps(receipt, sort_keys=True))
        return 0 if receipt['status'] == 'passed' else 2
    if args.state_dir is None:
        parser.error('--state-dir is required for run mode')
    return daemon(source, args.state_dir.resolve(), args.records_root.resolve(), args.activity_root.resolve())


if __name__ == '__main__':
    raise SystemExit(main())
