#!/usr/bin/env python3
"""One hosted metadata observation. Never admits or launches discovery tests."""
from __future__ import annotations

import hashlib
import json
import math
import os
from pathlib import Path, PurePosixPath
import re
import stat
import sys
import time

REPO = 'JohnDeved/populous-new-dawn'
OWNER = 24187269
TARGET = 'a1f506f82e8c95b55ca1b1c7dde1b5217f266466'
TREE = '8c76717fe2fc5de8387c619b2f54dd4b51491359'
PARENT = '8c0955c69f24ab2bc94f62a665eea9bd3b45fb8d'
MANIFEST_SHA256 = 'c099fe6530f5e4ba148493bbfb65d398d482b52dae761259a19c72acaef2dd59'
STATUSES = ('queued', 'in_progress', 'waiting', 'pending', 'requested')
MAX_RECEIPT = 2 * 1024 * 1024
MAX_SOURCE = 128 * 1024
MAX_PROJECTED = 64 * 1024
MAX_COLLECTION_ROUNDS = 3
COLLECTION_SECONDS = 150
COLLECTION_FRESH_SECONDS = 30
REMOTE_NAMES = ('main', 'infrastructure', 'infrastructureMerge', 'target',
                'targetCommit', 'run', 'jobs', 'ledger',
                *('active-' + status for status in STATUSES))
WORKFLOW_PATH = '.github/workflows/help-discovery-evidence.yml'
LABEL_PREFIX = 'h943-env:'
SHA = re.compile(r'[0-9a-f]{40}\Z')


def require(condition, reason):
    if not condition:
        raise ValueError(reason)


def digest(data):
    return hashlib.sha256(data).hexdigest()


def read_regular(path, cap):
    fd = os.open(path, os.O_RDONLY | os.O_NOFOLLOW | os.O_CLOEXEC | os.O_NONBLOCK)
    try:
        before = os.fstat(fd)
        require(stat.S_ISREG(before.st_mode), 'Nonregular input')
        data = bytearray()
        for _ in range(cap // 4096 + 2):
            chunk = os.read(fd, min(4096, cap + 1 - len(data)))
            if not chunk:
                require(os.fstat(fd).st_ino == before.st_ino, 'Input changed')
                return bytes(data)
            data.extend(chunk)
            require(len(data) <= cap, 'Read cap exceeded')
        raise ValueError('Read did not reach EOF')
    finally:
        os.close(fd)


def observed_file(path, cap=8192):
    try:
        data = read_regular(path, cap)
        return {'text': data.decode('utf-8', errors='strict'),
                'bytes': len(data), 'sha256': digest(data), 'complete': True}
    except (OSError, ValueError, UnicodeError) as error:
        return {'complete': False, 'error': type(error).__name__,
                'errno': getattr(error, 'errno', None), 'reason': str(error)[:160]}


def namespace_links(previous=None):
    result = {}
    for owner in ('self', '1'):
        result[owner] = {}
        for kind in ('cgroup', 'mnt', 'pid', 'user'):
            if previous is not None and not isinstance(previous[owner][kind], str):
                result[owner][kind] = {'notRetried': True, 'previous': previous[owner][kind]}
                continue
            try:
                value = os.readlink(f'/proc/{owner}/ns/{kind}')
                require(re.fullmatch(r'[a-z]+:\[[0-9]+\]', value) is not None,
                        'Unexpected namespace identity')
                result[owner][kind] = value
            except (OSError, ValueError) as error:
                result[owner][kind] = {'error': type(error).__name__,
                                       'errno': getattr(error, 'errno', None)}
    return result


def mapped_ancestors(membership, mountinfo):
    """Return only observed own ancestors, never infer hidden-parent visibility."""
    # Components must be slash-delimited; ambiguous repetition can stall on invalid input.
    match = re.fullmatch(r'0::(/(?:[A-Za-z0-9_.:-]+(?:/[A-Za-z0-9_.:-]+)*)?)\n', membership)
    require(match is not None, 'Mixed, malformed or unsupported cgroup membership')
    name = match.group(1)
    parts = PurePosixPath(name).parts[1:]
    require(str(PurePosixPath(name)) == name and len(parts) <= 16 and
            all(p not in ('.', '..') for p in parts),
            'Unsafe or excessive cgroup depth')
    matches = []
    for line in mountinfo.splitlines():
        columns = line.split()
        require('-' in columns, 'Malformed mount inventory')
        split = columns.index('-')
        require(split >= 6 and len(columns) >= split + 4, 'Short mount entry')
        if columns[split + 1] in ('cgroup', 'cgroup2'):
            matches.append(columns)
        if columns[4].startswith('/sys/fs/cgroup/'):
            raise ValueError('Cgroup submount is not supported')
    require(len(matches) == 1, 'Ambiguous or absent cgroup hierarchy')
    columns = matches[0]
    require(columns[columns.index('-') + 1] == 'cgroup2' and
            columns[3:5] == ['/', '/sys/fs/cgroup'], 'Unsupported cgroup mount mapping')
    paths = ['/sys/fs/cgroup']
    for part in parts:
        paths.append(paths[-1] + '/' + part)
    return {'membership': name, 'mountId': columns[0], 'mountRoot': columns[3],
            'mountPoint': columns[4], 'paths': paths}


def directory_identity(info):
    return {key: getattr(info, field) for key, field in
            (('device', 'st_dev'), ('inode', 'st_ino'), ('mode', 'st_mode'))}


def cgroup_observation(membership, mounts):
    result = {'scope': 'unqualified', 'ancestors': []}
    handles = []
    try:
        require(membership.get('complete') and mounts.get('complete'),
                'Incomplete mapping inputs')
        mapping = mapped_ancestors(membership['text'], mounts['text'])
        result['mapping'] = mapping
        previous = None
        for path in mapping['paths']:
            component = path if previous is None else PurePosixPath(path).name
            fd = os.open(component, os.O_RDONLY | os.O_DIRECTORY | os.O_NOFOLLOW |
                         os.O_CLOEXEC, dir_fd=previous)
            handles.append((path, component, fd, previous))
            row = {'path': path, 'identity': directory_identity(os.fstat(fd)), 'controls': {}}
            for name in ('cgroup.type', 'cgroup.controllers', 'cgroup.subtree_control',
                         'memory.max', 'memory.current', 'memory.high', 'memory.events',
                         'memory.events.local', 'memory.pressure', 'memory.stat'):
                # The open directory descriptor pins this observed ancestor.
                try:
                    control = os.open(name, os.O_RDONLY | os.O_NOFOLLOW |
                                      os.O_CLOEXEC | os.O_NONBLOCK, dir_fd=fd)
                    try:
                        require(stat.S_ISREG(os.fstat(control).st_mode), 'Nonregular control')
                        data = os.read(control, 8193)
                        require(len(data) <= 8192 and os.read(control, 1) == b'',
                                'Control cap or incomplete read')
                        row['controls'][name] = {'text': data.decode(), 'complete': True,
                                                 'bytes': len(data), 'sha256': digest(data)}
                    finally:
                        os.close(control)
                except (OSError, ValueError, UnicodeError) as error:
                    row['controls'][name] = {'complete': False, 'error': type(error).__name__,
                                             'errno': getattr(error, 'errno', None)}
            result['ancestors'].append(row)
            previous = fd
        for (path, component, fd, parent), row in zip(handles, result['ancestors']):
            require(directory_identity(os.fstat(fd)) == row['identity'] ==
                    directory_identity(os.stat(component, dir_fd=parent, follow_symlinks=False)),
                    'Cgroup path was replaced')
        result['stableDirectoryIdentities'] = True
    except (OSError, ValueError) as error:
        result['error'] = {'type': type(error).__name__, 'errno': getattr(error, 'errno', None),
                           'reason': str(error)[:160]}
    finally:
        for _, _, fd, _ in reversed(handles):
            os.close(fd)
    return result


def observe_host():
    started = time.monotonic()
    paths = {'meminfo': ('/proc/meminfo', 16384),
             'selfCgroup': ('/proc/self/cgroup', 4096),
             'initCgroup': ('/proc/1/cgroup', 4096),
             'mountinfo': ('/proc/self/mountinfo', 128 * 1024),
             'initComm': ('/proc/1/comm', 128),
             'initStatus': ('/proc/1/status', 16384),
             'selfStatus': ('/proc/self/status', 16384),
             'limits': ('/proc/self/limits', 16384),
             'swaps': ('/proc/swaps', 4096),
             'memoryPressure': ('/proc/pressure/memory', 4096)}
    before = {name: observed_file(path, cap) for name, (path, cap) in paths.items()}
    namespaces_before = namespace_links()
    cgroups = cgroup_observation(before['selfCgroup'], before['mountinfo'])
    after = {name: observed_file(*paths[name]) if before[name].get('complete') else
             {'complete': False, 'notRetried': True} for name in ('selfCgroup', 'mountinfo')}
    namespaces_after = namespace_links(namespaces_before)
    markers = {}
    for path in ('/.dockerenv', '/run/.containerenv', '/run/systemd/container'):
        try:
            markers[path] = {'present': True, 'mode': os.lstat(path).st_mode}
        except FileNotFoundError:
            markers[path] = {'present': False}
        except OSError as error:
            markers[path] = {'error': type(error).__name__, 'errno': error.errno}
    unchanged = all(before[k] == after[k] for k in after) and namespaces_before == namespaces_after
    expected_layout = (
        before['selfCgroup'].get('text') == '0::/system.slice/hosted-compute-agent.service\n' and
        before['initCgroup'].get('text') == '0::/init.scope\n' and
        before['initComm'].get('text') == 'systemd\n' and
        all(value.get('complete') is True for value in before.values()) and
        all(isinstance(value, str) for owner in namespaces_before.values() for value in owner.values()) and
        namespaces_before['self'] == namespaces_before['1'] and unchanged and
        cgroups.get('stableDirectoryIdentities') is True and
        all(row['controls'][name].get('complete') is True
            for row in cgroups['ancestors'][1:] for name in ('memory.max', 'memory.current')) and
        all(marker == {'present': False} for marker in markers.values()))
    return {'before': before, 'after': after, 'namespacesBefore': namespaces_before,
            'namespacesAfter': namespaces_after, 'cgroups': cgroups,
            'containerMarkers': markers,
            'mappingUnchanged': unchanged, 'expectedLayoutObserved': expected_layout,
            'elapsedSeconds': time.monotonic() - started,
            'memoryQualification': 'unqualified', 'effectiveAvailableBytes': None,
            'reason': 'Raw observations require independent run/job provenance and scope review. '
                      'This observer never admits tests or treats matching namespace IDs as proof.'}


def run_rows(value):
    require(isinstance(value, dict) and type(value.get('total_count')) is int and
            0 <= value['total_count'] <= 100 and
            isinstance(value.get('workflow_runs'), list) and
            len(value['workflow_runs']) <= 100, 'Malformed or oversized run list')
    rows = value['workflow_runs']
    require(all(isinstance(row, dict) and type(row.get('id')) is int and row['id'] > 0
                for row in rows), 'Malformed run identity')
    require(len({row['id'] for row in rows}) == len(rows), 'Duplicate run identity')
    return rows


def complete_runs(value):
    rows = run_rows(value)
    require(len(rows) == value['total_count'], 'Incomplete run list')
    return rows


def validate_remote_identity(context, documents):
    event = context['event']
    infra = event['pull_request']
    head, base = infra['head']['sha'], infra['base']['sha']
    merge = context['sha']
    require(isinstance(context['runId'], str) and context['runId'].isdecimal() and
            int(context['runId']) > 0, 'Malformed context run identity')
    run_id = int(context['runId'])
    require(all(SHA.fullmatch(s) for s in (head, base, merge)), 'Invalid source SHA')
    require(context['repository'] == REPO and context['eventName'] == 'pull_request' and
            event['action'] == 'labeled' and type(event['sender']['id']) is int and event['sender']['id'] == OWNER and
            event['label']['name'] == LABEL_PREFIX + head and
            context['attempt'] == '1', 'Unapproved event or replay attempt')
    for pr in (infra, documents['infrastructure']):
        require(isinstance(pr, dict) and type(pr.get('number')) is int and pr['number'] > 0,
                'Malformed infrastructure PR identity')
        require(pr['number'] == infra['number'] and pr['state'] == 'open' and pr['draft'] is True and
                pr['head']['sha'] == head and pr['base']['sha'] == base and
                pr['base']['ref'] == 'main' and pr['head']['repo']['full_name'] == REPO and
                pr['base']['repo']['full_name'] == REPO, 'Infrastructure identity drift')
    require(infra['number'] != 943 and documents['main']['sha'] == base,
            'Main moved or wrong infrastructure PR')
    commit = documents['infrastructureMerge']
    require(commit['sha'] == merge and [p['sha'] for p in commit['parents']] == [base, head],
            'Infrastructure merge parents differ')
    target = documents['target']
    require(type(target['number']) is int and target['number'] == 943 and target['state'] == 'open' and target['draft'] is True and
            target['head']['sha'] == TARGET and target['base']['ref'] == 'main' and
            SHA.fullmatch(target['base']['sha']) is not None and
            target['head']['repo']['full_name'] == REPO and
            target['base']['repo']['full_name'] == REPO, 'Help target drift')
    target_commit = documents['targetCommit']
    require(target_commit['sha'] == TARGET and target_commit['tree']['sha'] == TREE and
            [p['sha'] for p in target_commit['parents']] == [PARENT], 'Help commit identity drift')
    run = documents['run']
    require(isinstance(run, dict) and type(run.get('id')) is int and
            type(run.get('run_attempt')) is int and run['id'] == run_id and run['run_attempt'] == 1 and
            run['event'] == 'pull_request' and run['status'] == 'in_progress' and run['head_sha'] == head and
            run['path'] == '.github/workflows/help-discovery-evidence.yml' and
            type(run['actor']['id']) is int and run['actor']['id'] == OWNER and
            type(run['triggering_actor']['id']) is int and run['triggering_actor']['id'] == OWNER,
            'Wrong observed run identity')
    jobs = documents['jobs']
    require(isinstance(jobs, dict) and type(jobs.get('total_count')) is int and
            jobs['total_count'] == 1 and isinstance(jobs.get('jobs'), list) and len(jobs['jobs']) == 1,
            'Incomplete, malformed or unexpected job inventory')
    job = jobs['jobs'][0]
    require(isinstance(job, dict) and type(job.get('run_id')) is int and
            type(job.get('run_attempt')) is int and
            isinstance(job.get('labels'), list) and
            all(isinstance(label, str) and label for label in job['labels']) and
            isinstance(job.get('runner_name'), str) and job['runner_name'].strip() and
            isinstance(context.get('job'), dict), 'Malformed required job provenance')
    require(job['run_id'] == run_id and job['run_attempt'] == 1 and
            job['name'] == 'Observe hosted scope (no tests)' and
            'ubuntu-24.04' in job['labels'] and
            context['runner']['environment'] == 'github-hosted' and
            context['runner']['os'] == 'Linux' and context['runner']['arch'] == 'X64' and
            not context['job'].get('container') and not context['job'].get('services'),
            'Unexpected runner or container job provenance')
    return {'head': head, 'base': base, 'merge': merge, 'infrastructurePr': infra['number'],
            'helpHead': TARGET, 'helpTree': TREE, 'helpParent': PARENT,
            'helpReportedBase': target['base']['sha'], 'runId': run_id}


def inspect_remote_lists(identity, documents):
    # Inspect every returned security-relevant row before considering mismatches.
    # No synthetic count, merged page or inferred missing row is constructed.
    head, run_id = identity['head'], identity['runId']
    mismatches = []
    for name in ('ledger', *('active-' + status for status in STATUSES)):
        value = documents[name]
        rows = run_rows(value)
        for row in rows:
            require(type(row.get('run_attempt')) is int and row['run_attempt'] > 0 and
                    isinstance(row.get('head_sha'), str) and SHA.fullmatch(row['head_sha']) and
                    isinstance(row.get('path'), str) and
                    row.get('status') in (*STATUSES, 'completed'), 'Malformed returned run row')
            if name == 'ledger':
                require(row['path'] == WORKFLOW_PATH, 'Wrong workflow in replay ledger')
                require(row['id'] == run_id or row['head_sha'] != head,
                        'Another workflow attempt already exists for this infrastructure head')
            else:
                require(row['status'] == name.removeprefix('active-'), 'Wrong active-run status')
                require(row['id'] == run_id, 'Another repository run is active: ' + name)
                require(row['head_sha'] == head and row['path'] == WORKFLOW_PATH and
                        row['status'] == documents['run']['status'] and row['run_attempt'] == 1,
                        'Current active-run source differs')
        if name == 'ledger':
            require(sum(row['id'] == run_id for row in rows) == 1,
                    'Current run absent from ledger')
            own = next(row for row in rows if row['id'] == run_id)
            require(own['head_sha'] == head and own['status'] == documents['run']['status'] and
                    own['run_attempt'] == 1,
                    'Current ledger source or status differs')
        if len(rows) != value['total_count']:
            mismatches.append({'name': name, 'total_count': value['total_count'], 'returned': len(rows)})
    return mismatches


def classify_remote_snapshot(context, documents):
    identity = validate_remote_identity(context, documents)
    mismatches = inspect_remote_lists(identity, documents)
    if mismatches:
        return {'status': 'resample-inconsistent-counts', 'mismatches': mismatches}
    return {'status': 'complete', 'mismatches': [],
            'identity': identity | {'firstMatchingRun': True, 'otherActiveRuns': 0}}


def validate_remote(context, documents):
    result = classify_remote_snapshot(context, documents)
    require(result['status'] == 'complete', 'Incomplete run list')
    return result['identity']


def collect_guard_sets(context, fetch, record_round, clock, pause):
    """Pure bounded coordinator. Transport, retention and time are injected controls."""
    started = clock()
    deadline = started + COLLECTION_SECONDS
    calls = 0
    for round_number in range(MAX_COLLECTION_ROUNDS):
        raw, documents = {}, {}
        try:
            for name in REMOTE_NAMES:
                remaining = deadline - clock()
                require(remaining >= 3, 'Collector deadline reached')
                calls += 1
                data = fetch(round_number, name, min(12, remaining - 2))
                require(isinstance(data, bytes) and len(data) <= MAX_PROJECTED,
                        'Projected response cap exceeded')
                raw[name] = data
                documents[name] = json.loads(data)
                require(clock() <= deadline, 'Collector deadline reached')
            verdict = classify_remote_snapshot(context, documents)
        except Exception as error:
            record_round(round_number, {'status': 'blocked', 'error': type(error).__name__,
                         'reason': str(error)[:300], 'calls': calls}, raw)
            raise
        decision = verdict | {'calls': calls, 'elapsedSeconds': clock() - started}
        record_round(round_number, decision, raw)
        require(clock() <= deadline, 'Collector deadline reached')
        if verdict['status'] == 'complete':
            return {'round': round_number, 'raw': raw, 'documents': documents,
                    'calls': calls, 'elapsedSeconds': clock() - started}
        require(round_number + 1 < MAX_COLLECTION_ROUNDS, 'Collector resampling exhausted')
        require(deadline - clock() >= 3.5, 'Collector deadline reached')
        pause(0.5)
    raise ValueError('No complete guard collection')


def publish_collection(output, context, result, finished_at):
    require(type(result['round']) is int and 0 <= result['round'] < MAX_COLLECTION_ROUNDS,
            'Invalid collection round')
    require(set(result['raw']) == set(REMOTE_NAMES), 'Incomplete final collection')
    documents = {name: json.loads(data) for name, data in result['raw'].items()}
    identity = validate_remote(context, documents)
    identities = {}
    for name in REMOTE_NAMES:
        data = result['raw'][name]
        require(len(data) <= MAX_PROJECTED and
                read_regular(output / f"round-{result['round']}-{name}.json", MAX_PROJECTED) == data,
                'Final round source differs')
        with (output / (name + '.json')).open('xb') as stream:
            stream.write(data)
        identities[name] = {'bytes': len(data), 'sha256': digest(data)}
    marker = {'version': 1, 'status': 'complete', 'round': result['round'],
              'runId': identity['runId'], 'attempt': 1, 'head': identity['head'],
              'base': identity['base'], 'merge': identity['merge'],
              'finishedAt': finished_at, 'calls': result['calls'],
              'contextSha256': digest(read_regular(output / 'context.json', MAX_RECEIPT)),
              'files': identities}
    with (output / 'collection.json').open('x') as stream:
        json.dump(marker, stream, indent=2)
        stream.write('\n')
    return marker


def verified_collection(output, context, now):
    require(os.environ.get('PND_COLLECTOR_OUTCOME') == 'success',
            'Collector did not complete successfully')
    marker = json.loads(read_regular(output / 'collection.json', MAX_PROJECTED))
    require(type(marker['version']) is int and marker['version'] == 1 and marker['status'] == 'complete' and
            type(marker['round']) is int and 0 <= marker['round'] < MAX_COLLECTION_ROUNDS and
            marker['calls'] == (marker['round'] + 1) * len(REMOTE_NAMES), 'Invalid final collection marker')
    infra = context['event']['pull_request']
    require(type(marker['runId']) is int and marker['runId'] == int(context['runId']) and
            type(marker['attempt']) is int and marker['attempt'] == 1 and
            marker['head'] == infra['head']['sha'] and marker['base'] == infra['base']['sha'] and
            marker['merge'] == context['sha'] and set(marker['files']) == set(REMOTE_NAMES),
            'Collection marker source differs')
    require(type(marker['finishedAt']) in (int, float) and math.isfinite(marker['finishedAt']) and
            0 <= now - marker['finishedAt'] <= COLLECTION_FRESH_SECONDS, 'Stale collection marker')
    require(marker['contextSha256'] == digest(read_regular(output / 'context.json', MAX_RECEIPT)),
            'Collection context changed')
    decision = json.loads(read_regular(output / f"round-{marker['round']}-decision.json", MAX_PROJECTED))
    require(decision['status'] == 'complete' and decision['round'] == marker['round'] and
            decision['calls'] == marker['calls'] and decision['contextSha256'] == marker['contextSha256'] and
            decision['files'] == marker['files'],
            'Final round decision differs')
    documents = {}
    for name in REMOTE_NAMES:
        data = read_regular(output / (name + '.json'), MAX_PROJECTED)
        require(marker['files'][name] == {'bytes': len(data), 'sha256': digest(data)} and
                read_regular(output / f"round-{marker['round']}-{name}.json", MAX_PROJECTED) == data,
                'Final collection bytes changed')
        documents[name] = json.loads(data)
    validate_remote(context, documents)
    return documents


def source_identities(root):
    result = {}
    for name in ('observe.py', 'collect-remote.sh', 'discovery-manifest.json'):
        data = read_regular(root / name, MAX_SOURCE)
        result[name] = {'sha256': digest(data), 'bytes': len(data)}
    require(result['discovery-manifest.json']['sha256'] == MANIFEST_SHA256,
            'Unreviewed discovery manifest')
    data = read_regular(root.parents[1] / '.github/workflows/help-discovery-evidence.yml', MAX_SOURCE)
    result['workflow'] = {'sha256': digest(data), 'bytes': len(data)}
    return result


def main():
    require(len(sys.argv) == 2, 'Usage: observe.py OUTPUT_DIRECTORY')
    output = Path(sys.argv[1]).resolve()
    require(output.is_dir() and not (output / 'observation.json').exists(), 'Fresh output required')
    root = Path(__file__).resolve().parent
    receipt = {'version': 1, 'kind': 'help-discovery-hosted-metadata', 'status': 'blocked',
               'tests': 'not-run', 'memoryQualification': 'unqualified',
               'targetHead': TARGET, 'targetTree': TREE, 'targetParent': PARENT,
               'startedAt': time.time(), 'sourceBefore': None}
    exit_code = 3
    try:
        receipt['sourceBefore'] = source_identities(root)
        context = json.loads(read_regular(output / 'context.json', MAX_RECEIPT))
        documents = verified_collection(output, context, time.time())
        receipt['remoteGuard'] = validate_remote(context, documents)
        receipt['githubContext'] = {k: context[k] for k in ('runner', 'job')}
        receipt['githubProvenance'] = {'run': documents['run'], 'jobs': documents['jobs']}
        receipt['host'] = observe_host()
        if receipt['host']['expectedLayoutObserved']:
            receipt['status'] = 'observed-not-qualified'
            exit_code = 0
        else:
            receipt['reason'] = 'Unexpected or incomplete hosted layout; review raw observations.'
    except (OSError, ValueError, KeyError, TypeError) as error:
        receipt['error'] = {'type': type(error).__name__, 'reason': str(error)[:300]}
    finally:
        receipt['sourceAfter'] = None
        if receipt['sourceBefore'] is not None:
            try:
                receipt['sourceAfter'] = source_identities(root)
            except (OSError, ValueError) as error:
                receipt['sourceVerificationError'] = type(error).__name__ + ': ' + str(error)[:160]
        receipt['sourceUnchanged'] = (receipt['sourceBefore'] is not None and
                                      receipt['sourceBefore'] == receipt['sourceAfter'])
        if receipt['sourceBefore'] is not None and not receipt['sourceUnchanged']:
            receipt['status'] = 'invalidated'
            exit_code = 4
        receipt['finishedAt'] = time.time()
        data = (json.dumps(receipt, indent=2) + '\n').encode()
        require(len(data) <= MAX_RECEIPT, 'Receipt cap exceeded')
        with (output / 'observation.json').open('xb') as stream:
            stream.write(data)
        with (output / 'observation.sha256').open('x') as stream:
            stream.write(digest(data) + '  observation.json\n')
        print(json.dumps({'status': receipt['status'], 'tests': 'not-run',
                          'memoryQualification': 'unqualified', 'receiptSha256': digest(data)}))
    return exit_code


if __name__ == '__main__':
    sys.exit(main())
