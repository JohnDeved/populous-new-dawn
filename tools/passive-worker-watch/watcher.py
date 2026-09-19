#!/usr/bin/env python3
"""Passive four-worker transitions. The only chat output is one bounded queue CLI call.

No task client, browser, network transport, app navigation or input code is used.
Local self-reports are read-only suppression evidence, never executable instructions.
"""
from __future__ import annotations

import argparse
from contextlib import contextmanager
import fcntl
import hashlib
import json
import logging
from logging.handlers import RotatingFileHandler
import math
import os
from pathlib import Path
import re
import signal
import sqlite3
import subprocess
import tempfile
import time
import uuid

COORDINATOR = '01a09e5b-1361-7c12-acbe-a9377e0af8a0'
EXPECTED = {
    1: '6aad9a2e-6084-83eb-ace6-6218f2da0ef4',
    2: '6aad9a3d-1d4c-83eb-b794-b4acb8226670',
    3: '6aad9a51-2b4c-83ed-a0ea-d7f1833bcaf1',
    5: '6aad9d06-fd44-83ed-a6a8-067b46998f90',
}
CLI = Path.home() / '.nvm/versions/node/v24.18.0/bin/codex'
SOURCE_NAMES = ('watcher.py', 'service.py', 'sidebar.swift', 'managed.json')
STOP = re.compile(r'\b(DONE|BLOCKED|ERROR|SYSTEMERROR|STOPPED|COMPLETED?|NEEDS_REVIEW)\b', re.I)


def sha(path):
    return hashlib.sha256(Path(path).read_bytes()).hexdigest()


def fingerprints(source, sampler):
    return {**{name: sha(source / name) for name in SOURCE_NAMES}, 'sampler': sha(sampler)}


def configuration(path):
    config = json.loads(Path(path).read_text())
    workers = config.get('workers', [])
    if (config.get('version') != 1 or config.get('coordinator') != COORDINATOR
            or config.get('appBundle') != 'com.openai.codex'
            or len(workers) != 4 or {w['number']: w['id'] for w in workers} != EXPECTED
            or len({w['title'] for w in workers}) != 4
            or any(w['title'] != f"Worker {w['number']}b - {'pro' if w['number'] == 1 else 'xhigh'}" for w in workers)):
        raise ValueError('Configuration must name exactly the four assigned workers')
    for name, low, high in [('pollSeconds', 20, 60), ('confirmSeconds', 20, 60),
                            ('maxGapSeconds', 60, 120), ('notifySeconds', 60, 3600)]:
        value = config.get(name)
        if type(value) is not int or not low <= value <= high:
            raise ValueError('Invalid bounded configuration: ' + name)
    if config['maxGapSeconds'] < 2 * config['pollSeconds']:
        raise ValueError('Confirmation window must include two normal observations')
    return config


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


def sample(sampler, config_path):
    result = child([str(sampler), str(config_path)], 5)
    if result.returncode:
        raise RuntimeError('Passive sampler exited ' + str(result.returncode))
    return json.loads(result.stdout)


def enqueue(message):
    # Output only. No other CLI subcommand or destination is reachable here.
    result = child([str(CLI), 'queue', '--thread', COORDINATOR, '--message', message], 12)
    confirmed = result.returncode == 0 and re.search(
        r'Queued message [^\n]+ for thread ' + re.escape(COORDINATOR), result.stdout)
    return {'confirmed': bool(confirmed), 'exitCode': result.returncode,
            'detail': (result.stdout if confirmed else result.stderr or result.stdout)[:500]}


def parse_report(payload, timestamp, config):
    try:
        item = json.loads(payload)
        item = item.get('UserInput', item)
        text = '\n'.join(c.get('text', '') for c in item.get('content', []) if c.get('type') == 'text')
        header = text.replace('\\n', '\n').split('\n', 1)[0]
    except (ValueError, TypeError, AttributeError):
        return None
    match = re.match(r'^Worker\s*([1235])b?\s*\|', header, re.I)
    if not match:
        return None
    worker = next(w for w in config['workers'] if w['number'] == int(match[1]))
    explicit = re.search(r'chat_id\s*=\s*([^| ]+)', header, re.I)
    if explicit and explicit[1] != worker['id']:
        return None
    parts = [p.strip() for p in header.split('|')]
    if len(parts) < 3 or not STOP.search(parts[-1]):
        return None
    return {'worker': worker['id'], 'at': timestamp, 'stop': True}


def read_reports(root, config, since, now):
    """Only coordinator queue/history headers; no profiles, arbitrary threads or writes."""
    reports = []
    sources = (
        ('queue_1.sqlite', 'queued_items', 'payload_json', ''),
        ('thread_history_1.sqlite', 'thread_items', 'item_json', " AND item_type='userMessage'"),
        ('thread_history_1.sqlite', 'thread_realtime_items', 'item_json', " AND item_type='userMessage'"),
    )
    for database, table, column, extra in sources:
        path = root / database
        connection = sqlite3.connect(path.resolve().as_uri() + '?mode=ro', uri=True, timeout=1)
        try:
            connection.execute('PRAGMA query_only=ON')
            deadline = time.monotonic() + 0.4
            connection.set_progress_handler(lambda: int(time.monotonic() > deadline), 1000)
            query = (f'SELECT created_at_ms, {column} FROM {table} '
                     f'WHERE thread_id=? AND created_at_ms>=? AND created_at_ms<=? '
                     f'AND length({column})<=65536{extra} ORDER BY created_at_ms DESC LIMIT 128')
            rows = connection.execute(query, (COORDINATOR, since * 1000, now * 1000)).fetchall()
            if len(rows) == 128:
                raise sqlite3.OperationalError('Local report window is saturated; duplicate suppression incomplete')
            for timestamp, payload in rows:
                report = parse_report(payload, timestamp / 1000, config)
                if report:
                    reports.append(report)
        finally:
            connection.close()
    return reports


def initial(config):
    return {'version': 1, 'workers': {w['id']: {'epoch': 0, 'phase': 'unknown'} for w in config['workers']},
            'lastSampleAt': 0, 'sampleId': '', 'appIdentity': '', 'pending': [],
            'lastAttemptAt': 0, 'outputBlocked': False, 'attempts': []}


def restart(state, config):
    """Preserve output intent but never infer idle from pre-restart activity."""
    expected = {w['id'] for w in config['workers']}
    if (state.get('version') != 1 or set(state.get('workers', {})) != expected
            or not isinstance(state.get('outputBlocked'), bool)
            or not isinstance(state.get('attempts'), list)):
        raise ValueError('State schema/configuration mismatch')
    for worker in state['workers'].values():
        epoch = worker.get('epoch')
        if type(epoch) is not int or epoch < 0:
            raise ValueError('Invalid state epoch')
        worker.clear()
        worker.update(epoch=epoch, phase='unknown')
    if any(a.get('state') == 'uncertain' for a in state['attempts']):
        state['outputBlocked'] = True
    state.update(lastSampleAt=0, sampleId='', appIdentity='', pending=[])
    return state


def load_state(path, config):
    if not path.exists():
        return initial(config)
    try:
        return restart(json.loads(path.read_text()), config)
    except (ValueError, TypeError, KeyError, AttributeError):
        # Preserve corrupt evidence. Do not erase unknown notification intent.
        path.rename(path.with_name('state.corrupt.' + uuid.uuid4().hex + '.json'))
        state = initial(config)
        state['outputBlocked'] = True
        state['recovery'] = 'corrupt-state-preserved; output requires explicit owner recovery'
        return state


def usable(observation, config, now):
    rows = observation.get('rows', {})
    at = observation.get('at', 0)
    return (observation.get('version') == 1 and observation.get('trusted') is True
            and observation.get('complete') is True and bool(observation.get('appIdentity'))
            and bool(observation.get('sampleId')) and isinstance(at, (int, float))
            and math.isfinite(at) and 0 <= now - at <= 10
            and all(rows.get(w['id'], {}).get('count') == 1
                    and rows[w['id']].get('visible') is True
                    and rows[w['id']].get('status') in {'working', 'clear', 'systemError'}
                    for w in config['workers']))


def disarm(state):
    for worker in state['workers'].values():
        worker.update(phase='unknown', clearAt=0)
    state['pending'] = []


def observe(state, observation, reports, config, now):
    if not usable(observation, config, now):
        disarm(state)
        return []
    at = observation['at']
    if observation['sampleId'] == state['sampleId']:
        return []
    gap = at - state['lastSampleAt']
    if (state['appIdentity'] != observation['appIdentity'] or gap <= 0
            or gap > config['maxGapSeconds']):
        disarm(state)
    state.update(lastSampleAt=at, sampleId=observation['sampleId'], appIdentity=observation['appIdentity'])
    events = []
    for configured in config['workers']:
        ident = configured['id']
        worker = state['workers'][ident]
        status = observation['rows'][ident]['status']
        if status == 'working':
            if worker['phase'] != 'working':
                # A transient clear candidate belongs to the same active episode.
                if worker['phase'] != 'candidate':
                    worker.update(epoch=worker['epoch'] + 1, activeSince=at)
            worker.update(phase='working', lastActiveAt=at, clearAt=0)
            state['pending'] = [p for p in state['pending'] if p['worker'] != ident]
        elif worker['phase'] in {'working', 'candidate'}:
            if worker['phase'] != 'candidate' or worker.get('clearKind') != status:
                worker.update(phase='candidate', clearAt=at, clearKind=status)
            elif at - worker['clearAt'] >= config['confirmSeconds']:
                worker['phase'] = 'stopped'
                event = {'worker': ident, 'number': configured['number'], 'epoch': worker['epoch'],
                         'at': at, 'activeSince': worker['activeSince'],
                         'status': 'idle' if status == 'clear' else 'systemError'}
                covered = any(r['worker'] == ident and worker['activeSince'] <= r['at'] <= at for r in reports or [])
                event['coveredBySelfReport'] = covered
                events.append(event)
                if not covered:
                    state['pending'].append(event)
    state['pending'] = [p for p in state['pending'] if now - p['at'] <= config['maxGapSeconds']]
    return events


def notify_pending(state, config, reports, now, persist, output=enqueue):
    if reports is None or state['outputBlocked'] or now - state['lastAttemptAt'] < config['notifySeconds']:
        return None
    pending = [p for p in state['pending'] if now - p['at'] <= config['maxGapSeconds']
               and not any(r['worker'] == p['worker'] and p['activeSince'] <= r['at'] <= now for r in reports)]
    state['pending'] = []
    if not pending:
        return None
    message = 'Passive worker watcher | CONFIRMED STOP | ' + '; '.join(
        f"Worker {p['number']}b | chat_id={p['worker']} | {p['status']} | epoch={p['epoch']}" for p in pending)
    message += '. Fresh Working followed by two complete local sidebar observations. No restart or assignment sent.'
    attempt = {'at': now, 'state': 'uncertain', 'messageSha256': hashlib.sha256(message.encode()).hexdigest(),
               'workers': [p['worker'] for p in pending]}
    state['attempts'] = (state['attempts'] + [attempt])[-64:]
    state['lastAttemptAt'] = now
    persist(state)  # Durable output intent before exactly one CLI attempt.
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
    else:
        state['outputBlocked'] = True
    persist(state)
    return result


def logger(directory):
    log = logging.getLogger('passive-worker-watch.' + str(directory))
    log.setLevel(logging.INFO)
    log.propagate = False
    if not log.handlers:
        handler = RotatingFileHandler(directory / 'watcher.log', maxBytes=262144, backupCount=2)
        handler.setFormatter(logging.Formatter('%(asctime)s %(message)s'))
        log.addHandler(handler)
    return log


def dry(source, sampler, records_root, destination):
    config = configuration(source / 'managed.json')
    state = initial(config)
    bound = fingerprints(source, sampler)
    receipt = {'mode': 'dry', 'startedAt': time.time(), 'fingerprints': bound,
               'samples': [], 'notificationCalls': 0, 'status': 'blocked'}
    try:
        for index in range(2):
            observation = sample(sampler, source / 'managed.json')
            receipt['samples'].append(observation)
            if not usable(observation, config, time.time()):
                receipt['blocker'] = observation.get('reason') or 'four rows not reliably identified'
                break
            reports = read_reports(records_root, config, receipt['startedAt'], time.time())
            observe(state, observation, reports, config, time.time())
            if index == 0:
                time.sleep(config['confirmSeconds'])
        else:
            receipt['status'] = 'passed'
    except Exception as error:
        receipt['blocker'] = type(error).__name__ + ': ' + str(error)[:300]
    receipt['finishedAt'] = time.time()
    receipt['sourceUnchanged'] = fingerprints(source, sampler) == bound
    if not receipt['sourceUnchanged']:
        receipt.update(status='blocked', blocker='source changed during observation')
    atomic(destination, receipt)
    return receipt


def daemon(source, sampler, directory, records_root):
    config = configuration(source / 'managed.json')
    manifest = json.loads((source / 'installation.json').read_text())
    if manifest['fingerprints'] != fingerprints(source, sampler):
        raise RuntimeError('Installed source/binary differs from verified manifest')
    with singleton(directory):
        path = directory / 'state.json'
        state = load_state(path, config)
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
                try:
                    observation = sample(sampler, source / 'managed.json')
                    now = time.time()
                    since = min([w.get('activeSince', now) for w in state['workers'].values()])
                    try:
                        reports = read_reports(records_root, config, since, now)
                    except (sqlite3.Error, OSError) as error:
                        reports = None
                        log.warning('Local report read unavailable: %s', type(error).__name__)
                    events = observe(state, observation, reports, config, now)
                    problem = observation.get('reason') if not usable(observation, config, now) else None
                    if problem != last_problem:
                        log.info('Observation health: %s', problem or 'available')
                        last_problem = problem
                    for event in events:
                        log.info('Confirmed transition: %s', json.dumps(event, sort_keys=True))
                    result = notify_pending(state, config, reports, now, lambda s: atomic(path, s))
                    if result is not None:
                        log.info('Notification receipt: %s', json.dumps(result, sort_keys=True))
                    atomic(path, state)
                except Exception as error:
                    disarm(state)
                    state['outputBlocked'] = True
                    atomic(path, state)
                    log.error('Stopped safely: %s', str(error)[:500])
                    return 2
                deadline = time.monotonic() + config['pollSeconds']
                while not stopping and time.monotonic() < deadline:
                    time.sleep(min(1, max(0, deadline - time.monotonic())))
        finally:
            state['process']['running'] = False
            atomic(path, state)
        return 0


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('mode', choices=['dry', 'run'])
    parser.add_argument('--sampler', type=Path, required=True)
    parser.add_argument('--state-dir', type=Path)
    parser.add_argument('--records-root', type=Path, default=Path.home() / '.codex')
    parser.add_argument('--receipt', type=Path)
    args = parser.parse_args()
    source = Path(__file__).resolve().parent
    if args.mode == 'dry':
        if args.receipt is None:
            parser.error('--receipt is required for dry mode')
        receipt = dry(source, args.sampler.resolve(), args.records_root, args.receipt)
        print(json.dumps(receipt, sort_keys=True))
        return 0 if receipt['status'] == 'passed' else 2
    if args.state_dir is None:
        parser.error('--state-dir is required for run mode')
    return daemon(source, args.sampler.resolve(), args.state_dir.resolve(), args.records_root)


if __name__ == '__main__':
    raise SystemExit(main())
