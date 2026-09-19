"""Bounded read-only local metadata, handoff and Local Dev lifecycle reader.

The cache identifies conversations; its update timestamp is NOT activity evidence.
Only explicit current-roster final headers, typed failed turns, and fsynced Local Dev
lifecycle transitions are evidence. Running records, silence and elapsed time never
establish idle or current activity.
"""
from __future__ import annotations

from contextlib import contextmanager
from datetime import datetime
import hashlib
import json
import math
from pathlib import Path
import re
import sqlite3
import time

import lifecycle

COORDINATOR = '01a09e5b-1361-7c12-acbe-a9377e0af8a0'
WORKERS = {
    1: '6aaebd2a-9698-83ed-a9ca-732b8651f074',
    2: '6aaebd46-b95c-83ed-80ac-207d2c6c5c43',
    3: '6aaebd51-30ac-83eb-a58a-1cfdb96b9100',
    4: '6aaebd5d-d418-83eb-a0b7-6000fe1dbf24',
}
TITLES = {
    1: 'Worker 1c - xhigh',
    2: 'Worker 2c - xhigh',
    3: 'Worker 3c - xhigh',
    4: 'Worker 4c - xhigh',
}
FINAL_STATES = {'DONE', 'BLOCKED', 'NEEDS_REVIEW', 'ERROR', 'SYSTEMERROR', 'STOPPED'}
HEADER = re.compile(r'^Worker\s*([1234])c\s*\|', re.I)
MAX_ROWS = 512
MAX_PAYLOAD = 65536


class EvidenceUnavailable(RuntimeError):
    """Absence or an incomplete read is unknown evidence, not a worker error."""


def digest(value):
    return hashlib.sha256(value.encode()).hexdigest()


def configuration(path):
    config = json.loads(Path(path).read_text())
    items = config.get('workers', [])
    if (config.get('version') != 3 or config.get('mode') != 'local-lifecycle'
            or config.get('coordinator') != COORDINATOR or len(items) != 4
            or {w.get('number'): w.get('id') for w in items} != WORKERS
            or any(w.get('title') != TITLES[w['number']] for w in items)):
        raise ValueError('The explicit current four-worker local-lifecycle configuration is required')
    bounds = {'pollSeconds': (20, 60), 'eventMaxAgeSeconds': (60, 3600),
              'metadataMaxAgeSeconds': (300, 86400), 'notifySeconds': (60, 3600),
              'failureBackoffSeconds': (60, 3600), 'maxFailureBackoffSeconds': (300, 86400)}
    for name, (minimum, maximum) in bounds.items():
        if type(config.get(name)) is not int or not minimum <= config[name] <= maximum:
            raise ValueError('Invalid bounded setting: ' + name)
    if config['maxFailureBackoffSeconds'] < config['failureBackoffSeconds']:
        raise ValueError('Invalid backoff bounds')
    return config


def timestamp(value):
    if isinstance(value, str):
        try:
            parsed = datetime.fromisoformat(value.replace('Z', '+00:00'))
            if parsed.tzinfo is None:
                return None
            value = parsed.timestamp()
        except ValueError:
            return None
    return float(value) if type(value) in (int, float) and math.isfinite(value) and value > 0 else None


def metadata(root, config, now):
    path = root / '.codex-global-state.json'
    with path.open('r') as file:
        raw = file.read(4 * 1024 * 1024 + 1)
    if len(raw.encode()) > 4 * 1024 * 1024:
        raise EvidenceUnavailable('Local task cache exceeds the bounded reader')
    data = json.loads(raw).get('electron-persisted-atom-state', {}).get('chatgpt-sidebar-state-v1')
    if not isinstance(data, dict) or len(data) > 16:
        raise EvidenceUnavailable('Unsupported local task-cache schema')
    found = {w['id']: [] for w in config['workers']}
    for scope in data.values():
        if not isinstance(scope, dict):
            raise EvidenceUnavailable('Invalid task-cache scope')
        rows = scope.get('pinnedConversations', [])
        if not isinstance(rows, list) or len(rows) > MAX_ROWS:
            raise EvidenceUnavailable('Invalid bounded pinned-conversation cache')
        for wrapper in rows:
            row = wrapper.get('conversation') if isinstance(wrapper, dict) else None
            if isinstance(row, dict) and row.get('id') in found:
                found[row['id']].append(row)
    result = {}
    for worker in config['workers']:
        rows = found[worker['id']]
        row = rows[0] if len(rows) == 1 else {}
        created, updated = timestamp(row.get('createdAt')), timestamp(row.get('updatedAt'))
        bound = bool(len(rows) == 1 and row.get('title') == worker['title'] and created and updated
                     and created <= updated <= now and created <= now)
        result[worker['id']] = {
            'number': worker['number'], 'matches': len(rows), 'bound': bound,
            'createdAt': created, 'metadataUpdatedAt': updated,
            'metadataFresh': bool(bound and now - updated <= config['metadataMaxAgeSeconds']),
            'liveStatus': 'unknown',
        }
    return result


@contextmanager
def readonly(root, name):
    connection = sqlite3.connect((root / name).resolve().as_uri() + '?mode=ro', uri=True, timeout=1)
    connection.row_factory = sqlite3.Row
    try:
        connection.execute('PRAGMA query_only=ON')
        deadline = time.monotonic() + 1.5
        connection.set_progress_handler(lambda: int(time.monotonic() > deadline), 1000)
        yield connection
    finally:
        connection.close()


def text_payload(payload):
    item = json.loads(payload)
    if not isinstance(item, dict):
        return None
    item = item.get('UserInput', item)
    if not isinstance(item, dict):
        return None
    content = item.get('content')
    if not isinstance(content, list):
        return None
    parts = [part.get('text') for part in content if isinstance(part, dict) and part.get('type') == 'text']
    return '\n'.join(parts) if parts and all(isinstance(part, str) for part in parts) else None


def final_event(payload, item_id, at, bindings, now, max_age, source):
    if not isinstance(payload, str) or len(payload.encode()) > MAX_PAYLOAD:
        return None
    at = timestamp(at)
    if at is None or not 0 <= now - at <= max_age or not isinstance(item_id, str) or not item_id:
        return None
    try:
        text = text_payload(payload)
    except (ValueError, TypeError):
        return None
    if not text:
        return None
    header = text.split('\n', 1)[0].rstrip('\r')
    match = HEADER.match(header)
    if not match:
        return None
    ident = WORKERS[int(match[1])]
    binding = bindings[ident]
    if not binding['bound'] or at < binding['createdAt']:
        return None
    parts = [part.strip() for part in header.split('|')]
    attribution = 'current-roster-self-report'
    if len(parts) == 4:
        explicit = re.fullmatch(r'chat_id\s*=\s*([0-9a-f-]{36})', parts[1], re.I)
        if not explicit or explicit[1].lower() != ident:
            return None
        parts.pop(1)
        attribution = 'explicit-id-self-report'
    if len(parts) != 3 or not parts[1] or len(parts[1]) > 160 or parts[2].upper() not in FINAL_STATES:
        return None
    state = parts[2].upper()
    semantic = digest(ident + '\n' + ' '.join(text.split()))
    return {'key': 'final:' + semantic, 'recordKey': 'coordinator:' + item_id,
            'worker': ident, 'number': binding['number'], 'kind': 'final_report',
            'reportedState': state, 'at': at, 'source': source, 'attribution': attribution,
            'alreadyAddressedToCoordinator': True}


def lifecycle_records(activity_root, bindings, config, now):
    try:
        value = lifecycle.snapshot(activity_root, now, config['eventMaxAgeSeconds'])
    except lifecycle.LifecycleUnavailable as error:
        raise EvidenceUnavailable(str(error)) from error
    events = []
    for item in value['events']:
        event = dict(item)
        number = event.get('number')
        if number in WORKERS:
            ident = WORKERS[number]
            if bindings[ident]['bound']:
                event['worker'] = ident
            else:
                event.pop('number', None)
        events.append(event)
    return {**value, 'events': events}


def snapshot(root, config, now, activity_root=None):
    root = Path(root).resolve()
    activity_root = (Path.home() / '.local-dev/activity') if activity_root is None else Path(activity_root)
    bindings = metadata(root, config, now)
    events, counts, local_turns = [], {}, {}
    minimum = now - config['eventMaxAgeSeconds']
    with readonly(root, 'state_5.sqlite') as conn:
        row = conn.execute('SELECT id FROM threads WHERE id=?', (COORDINATOR,)).fetchone()
        if row is None:
            raise EvidenceUnavailable('Configured coordinator is absent from local metadata')
        placeholders = ','.join('?' for _ in WORKERS)
        local_ids = {r['id'] for r in conn.execute(
            f'SELECT id FROM threads WHERE id IN ({placeholders})', list(WORKERS.values()))}
    sources = [
        ('queue_1.sqlite', 'queued_items', 'id', 'payload_json', ''),
        ('thread_history_1.sqlite', 'thread_items', 'item_id', 'item_json', " AND item_type='userMessage'"),
        ('thread_history_1.sqlite', 'thread_realtime_items', 'item_id', 'item_json', " AND item_type='userMessage'"),
    ]
    for database, table, id_column, payload_column, extra in sources:
        with readonly(root, database) as conn:
            query = (f'SELECT {id_column} AS id,created_at_ms,'
                     f'CASE WHEN length({payload_column})<=? THEN {payload_column} ELSE NULL END AS payload '
                     f'FROM {table} WHERE thread_id=? AND created_at_ms>=? AND created_at_ms<=?{extra} '
                     'ORDER BY created_at_ms DESC LIMIT ?')
            rows = conn.execute(query, (MAX_PAYLOAD, COORDINATOR, minimum * 1000,
                                       now * 1000, MAX_ROWS + 1)).fetchall()
            if len(rows) > MAX_ROWS:
                raise EvidenceUnavailable('Coordinator event window is saturated; no partial success')
            counts[table] = len(rows)
            for row in rows:
                event = final_event(row['payload'], row['id'], row['created_at_ms'] / 1000,
                                    bindings, now, config['eventMaxAgeSeconds'], table)
                if event:
                    events.append(event)
    with readonly(root, 'thread_history_1.sqlite') as conn:
        for ident in WORKERS.values():
            rows = conn.execute('SELECT turn_id,status,started_at,completed_at, '
                                'CASE WHEN error_json IS NOT NULL AND length(error_json)>0 THEN 1 ELSE 0 END AS has_error '
                                'FROM thread_turns WHERE thread_id=? ORDER BY rollout_ordinal DESC LIMIT 17',
                                (ident,)).fetchall()
            local_turns[ident] = {'threadMetadataPresent': ident in local_ids,
                                 'recentTurnCount': len(rows),
                                 'activeStatusSupported': False, 'silentStopSupported': False}
            if len(rows) == 17 and any(timestamp(r['completed_at']) and r['completed_at'] >= minimum for r in rows):
                raise EvidenceUnavailable('Managed local turn window saturated')
            binding = bindings[ident]
            for row in rows:
                at, started = timestamp(row['completed_at']), timestamp(row['started_at'])
                if (ident in local_ids and binding['bound'] and row['status'] == 'failed'
                        and row['has_error'] and at and started
                        and binding['createdAt'] <= started <= at <= now
                        and now - at <= config['eventMaxAgeSeconds']):
                    events.append({'key': 'error:' + digest(ident + ':' + row['turn_id']),
                                   'recordKey': 'turn:' + ident + ':' + row['turn_id'],
                                   'worker': ident, 'number': binding['number'], 'kind': 'local_error',
                                   'at': at, 'source': 'thread_turns',
                                   'alreadyAddressedToCoordinator': False})
    unique = {}
    for event in sorted(events, key=lambda e: (e['at'], e['key'])):
        existing = unique.get(event['key'])
        if existing is None or event['at'] < existing['at']:
            unique[event['key']] = event
    localdev = lifecycle_records(activity_root, bindings, config, now)
    return {
        'version': 3, 'at': now, 'dataRoot': str(root),
        'activityRoot': localdev['root'], 'workers': bindings,
        'complete': all(w['bound'] for w in bindings.values()),
        'eventCounts': counts, 'events': list(unique.values()),
        'localTurnCoverage': local_turns,
        'lifecycleEvents': localdev['events'],
        'lifecycleCoverage': {
            'journals': localdev['journals'],
            'truncatedJournals': localdev['truncatedJournals'],
            **localdev['claims'],
        },
        'claims': {
            'identity': 'exact configured current cached IDs/titles',
            'positiveStop': 'explicit current-roster final headers only',
            'localErrors': 'fresh typed failed-turn records if present; not live status',
            'interruptedRuns': 'explicit Local Dev run.interrupted after a self-labelled managed run',
            'completedRuns': 'explicit Local Dev run.ended after a self-labelled managed run',
            'silentStops': False, 'activeStatus': False, 'idleStatus': False,
            'duplicateFinalNotifications': False,
        },
    }
