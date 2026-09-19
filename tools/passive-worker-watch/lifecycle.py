"""Bounded read-only Local Dev lifecycle journal reader.

Only explicit lifecycle transitions are evidence. Silence, mtimes, elapsed time and
open/running records never establish idle or a stalled worker.
"""
from __future__ import annotations

from datetime import datetime
import json
import math
from pathlib import Path
import re

MAX_JOURNALS = 24
MAX_TAIL_BYTES = 8 * 1024 * 1024
MAX_EVENT_BYTES = 256 * 1024
MAX_EVENTS = 2048
RUN_ID = re.compile(r'^[0-9a-zA-Z-]{1,80}$')
ROLE = re.compile(r'^\s*(?:Worker|Reviewer)\s*([1-4])c\b', re.I)
TYPES = {'run.started', 'run.goal', 'run.ended', 'run.interrupted'}
INTERRUPTED_SUMMARY = 'Runtime disconnected; no assistant completion was reported.'


class LifecycleUnavailable(RuntimeError):
    """Incomplete/bounded lifecycle evidence is unknown, never an idle claim."""


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


def role_number(*values):
    found = []
    for value in values:
        if not isinstance(value, str):
            continue
        match = ROLE.match(value)
        if match:
            found.append(int(match[1]))
    return found[0] if found and len(set(found)) == 1 else None


def _tail(path):
    info = path.lstat()
    if path.is_symlink() or not path.is_file():
        raise LifecycleUnavailable('Unsafe Local Dev activity journal')
    start = max(0, info.st_size - MAX_TAIL_BYTES)
    with path.open('rb') as stream:
        stream.seek(start)
        data = stream.read(MAX_TAIL_BYTES + 1)
    if len(data) > MAX_TAIL_BYTES:
        raise LifecycleUnavailable('Local Dev activity tail changed beyond bounded read')
    if start:
        newline = data.find(b'\n')
        data = b'' if newline < 0 else data[newline + 1:]
    return data, bool(start)


def _event(raw, now, max_age):
    if not isinstance(raw, dict) or raw.get('version') != 1 or raw.get('type') not in TYPES:
        return None
    runtime = raw.get('runtimeId')
    sequence = raw.get('sequence')
    run_id = raw.get('runId')
    at = timestamp(raw.get('timestamp'))
    if (not isinstance(runtime, str) or not runtime or len(runtime) > 80
            or type(sequence) is not int or sequence < 1
            or not isinstance(run_id, str) or not RUN_ID.fullmatch(run_id)
            or at is None or not 0 <= now - at <= max_age):
        return None
    detail = raw.get('detail')
    if not isinstance(detail, dict):
        return None
    event = {
        'runtimeId': runtime, 'sequence': sequence, 'runId': run_id,
        'type': raw['type'], 'at': at,
    }
    if raw['type'] == 'run.started':
        run = detail.get('run')
        if not isinstance(run, dict) or run.get('id') != run_id:
            return None
        if run.get('state') != 'running' or run.get('origin') not in {'assistant', 'observed'}:
            return None
        if run.get('contextScope') not in {'session', 'runtime'}:
            return None
        started = timestamp(run.get('startedAt'))
        if started is None or started > at + 2:
            return None
        event.update(origin=run['origin'], contextScope=run['contextScope'],
                     number=role_number(run.get('title'), run.get('goal')))
    elif raw['type'] == 'run.goal':
        if detail.get('origin') != 'assistant':
            return None
        event['number'] = role_number(detail.get('title'), detail.get('goal'))
    elif raw['type'] == 'run.ended':
        if detail.get('source') != 'assistant_report' or detail.get('state') not in {'completed', 'failed', 'cancelled'}:
            return None
        ended = timestamp(detail.get('endedAt'))
        if ended is None or abs(ended - at) > 2:
            return None
        event['state'] = detail['state']
    else:
        ended = timestamp(detail.get('endedAt'))
        if ended is None or abs(ended - at) > 2 or detail.get('summary') != INTERRUPTED_SUMMARY:
            return None
        event['state'] = 'interrupted'
    return event


def snapshot(root, now, max_age):
    root = Path(root).resolve()
    try:
        info = root.lstat()
    except OSError as error:
        raise LifecycleUnavailable('Local Dev activity root unavailable') from error
    if root.is_symlink() or not root.is_dir():
        raise LifecycleUnavailable('Unsafe Local Dev activity root')
    candidates = []
    try:
        for path in root.glob('*.jsonl'):
            stat = path.stat()
            if stat.st_mtime >= now - max_age:
                candidates.append((stat.st_mtime, path))
    except OSError as error:
        raise LifecycleUnavailable('Could not enumerate Local Dev activity journals') from error
    if len(candidates) > MAX_JOURNALS:
        raise LifecycleUnavailable('Local Dev activity journal window is saturated')
    events = []
    truncated = 0
    for _, path in sorted(candidates):
        try:
            data, clipped = _tail(path)
        except OSError as error:
            raise LifecycleUnavailable('Could not read Local Dev activity journal') from error
        truncated += int(clipped)
        for line in data.splitlines():
            if not line or len(line) > MAX_EVENT_BYTES:
                continue
            try:
                value = json.loads(line)
            except (UnicodeDecodeError, ValueError):
                continue
            event = _event(value, now, max_age)
            if event is not None:
                events.append(event)
                if len(events) > MAX_EVENTS:
                    raise LifecycleUnavailable('Local Dev lifecycle event window is saturated')
    events.sort(key=lambda item: (item['at'], item['runtimeId'], item['sequence']))
    return {
        'root': str(root), 'journals': len(candidates), 'truncatedJournals': truncated,
        'events': events,
        'claims': {
            'interruptedRun': 'explicit run.interrupted only',
            'idle': False,
            'runningMeansActive': False,
        },
    }
