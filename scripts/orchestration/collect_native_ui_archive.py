"""Index one API-verified native UI ZIP without extracting any member by default.

Offline boundary: the caller supplies retained API responses and independently
reviewed source manifests, each hash-bound by a request whose SHA is passed on the
CLI. The member map generated from the ZIP is integrity data, not an independent
correctness oracle. This collector does not grant runtime or visual acceptance.
"""
import argparse
from contextlib import ExitStack
import hashlib
import importlib.util
import json
import os
from pathlib import Path
import re
import stat

_reader_source = Path(__file__).resolve().with_name('evidence_archive.py')
_reader_spec = importlib.util.spec_from_file_location('native_ui_evidence_archive', _reader_source)
archive_reader = importlib.util.module_from_spec(_reader_spec)
_reader_spec.loader.exec_module(archive_reader)

REPOSITORY = 'JohnDeved/populous-new-dawn'
WORKFLOW = '.github/workflows/native-ui-evidence.yml'
INPUT_LIMIT = 8 * 1024**2
INPUT_COUNT = 4
CAPTURED_MEMBERS = frozenset(('receipt.json', 'episodes.json', 'candidate-source.json', 'infrastructure-source.json'))
EPISODES = ('startup-logo', 'selector-recovery', 'options-storage', 'checkpoint-notice',
            'options-audio-native', 'options-audio-fallback', 'loading-recovery',
            'pause-checkpoint-native', 'pause-checkpoint-fallback')
require = archive_reader.require


def git_sha(value):
    require(isinstance(value, str) and re.fullmatch('[0-9a-f]{40}', value), 'Exact Git SHA required')
    return value


def integer(value):
    require(type(value) is int and value > 0, 'Positive integer identity required')
    return value


def bound_json(binding, stack):
    require(isinstance(binding, dict) and set(binding) == {'path', 'sha256'}, 'Exact input path/hash binding required')
    archive_reader.digest(binding['sha256'])
    path = Path(binding['path'])
    parent, verify_parent = stack.enter_context(archive_reader.parent_chain(path.parent))
    fd = os.open(path.name, os.O_RDONLY | os.O_NOFOLLOW, dir_fd=parent)
    stream = stack.enter_context(os.fdopen(fd, 'rb'))
    before = archive_reader.record(os.fstat(fd))
    require(stat.S_ISREG(before['mode']) and before['bytes'] <= INPUT_LIMIT, 'Input must be a bounded regular JSON file')
    body = stream.read(INPUT_LIMIT+1)
    require(len(body) == before['bytes'] and hashlib.sha256(body).hexdigest() == binding['sha256'], 'Input bytes/hash differ')
    def verify():
        verify_parent()
        require(archive_reader.record(os.fstat(fd)) == before == archive_reader.record(path.lstat()), 'Bound input identity changed')
    verify()
    return archive_reader.decode_json(body), verify


def validate_expected(value, commit, tree=None):
    require(isinstance(value, dict) and set(value) == {'commit', 'tree', 'files'}, 'Complete expected source manifest required')
    require(value['commit'] == commit and (tree is None or value['tree'] == tree), 'Independent expected commit/tree differs')
    git_sha(value['tree'])
    files = value['files']; require(isinstance(files, dict) and 0 < len(files) <= 10000, 'Expected source file count invalid')
    for name, row in files.items():
        require(isinstance(name, str) and name and len(name.encode()) <= 1024 and not name.startswith('/')
                and '\\' not in name and '\x00' not in name and all(part not in ('', '.', '..') for part in name.split('/')), 'Unsafe source path')
        require(isinstance(row, dict) and {'blob', 'mode', 'bytes', 'sha256'} <= set(row), 'Incomplete expected source row')
        git_sha(row['blob']); archive_reader.digest(row['sha256'])
        require(row['mode'] in ('100644', '100755', '120000') and type(row['bytes']) is int and row['bytes'] >= 0, 'Invalid source mode/size')
    return value


def compare_source(actual, expected, label):
    if not isinstance(actual, dict) or actual.get('commit') != expected['commit'] or actual.get('tree') != expected['tree']:
        return label+' commit/tree missing or mismatched'
    files = actual.get('files')
    if not isinstance(files, dict) or set(files) != set(expected['files']): return label+' complete pathset mismatched'
    for name, row in files.items():
        if not isinstance(row, dict) or type(row.get('bytes')) is not int or any(row.get(key) != expected['files'][name][key] for key in ('blob', 'mode', 'bytes', 'sha256')):
            return label+' source row mismatched: '+name
    return None


def publish(output, member_map, result):
    """New metadata-only directory; no overwrite, source mutation or auto-cleanup."""
    output = Path(output)
    with archive_reader.parent_chain(output.parent) as (parent, verify_parent):
        os.mkdir(output.name, 0o700, dir_fd=parent)
        with archive_reader.parent_chain(output) as (root, verify_root):
            for name, data in [('archive-manifest.json', archive_reader.encoded(member_map)),
                               ('collection.json', archive_reader.encoded(result))]:
                require(len(data) <= archive_reader.LIMITS['directory_bytes'], 'Metadata output too large')
                verify_parent(); verify_root()
                fd = os.open(name, os.O_WRONLY | os.O_CREAT | os.O_EXCL | os.O_NOFOLLOW, 0o600, dir_fd=root)
                with os.fdopen(fd, 'wb') as stream:
                    stream.write(data); stream.flush(); os.fsync(stream.fileno())
                    identity = archive_reader.record(os.fstat(stream.fileno()))
                    require(identity['bytes'] == len(data) and identity['nlink'] == 1
                            and identity == archive_reader.record(os.stat(name, dir_fd=root, follow_symlinks=False)), 'Metadata publication identity differs')
            require(set(os.listdir(root)) == {'archive-manifest.json', 'collection.json'}, 'Unexpected collector output')
            verify_root(); verify_parent()


def collect(request):
    require(isinstance(request, dict) and set(request) == {'version', 'runId', 'runAttempt', 'candidateSha', 'candidateTree',
            'workflowSha', 'archive', 'run', 'artifacts', 'expectedCandidate', 'expectedInfrastructure', 'output'}, 'Exact collection request required')
    require(type(request['version']) is int and request['version'] == 1, 'Unsupported collection version')
    run_id = integer(request['runId']); attempt = integer(request['runAttempt'])
    candidate = git_sha(request['candidateSha']); tree = git_sha(request['candidateTree']); workflow = git_sha(request['workflowSha'])
    archive = Path(request['archive']); output = Path(request['output'])
    require(archive.is_absolute() and output.is_absolute() and output != archive.parent and archive.parent not in output.parents
            and output not in archive.parents, 'Metadata output must be outside canonical evidence root')
    with ExitStack() as stack:
        inputs = {}; verifiers = []
        for name in ('run', 'artifacts', 'expectedCandidate', 'expectedInfrastructure'):
            inputs[name], verify = bound_json(request[name], stack); verifiers.append(verify)
        run = inputs['run']; artifacts = inputs['artifacts']
        require(run.get('id') == run_id and run.get('run_attempt') == attempt and run.get('status') == 'completed'
                and run.get('head_sha') == workflow and run.get('head_branch') == 'main'
                and run.get('event') == 'workflow_dispatch' and run.get('path') == WORKFLOW
                and run.get('repository', {}).get('full_name') == REPOSITORY, 'Trusted API run identity differs')
        require(artifacts.get('total_count') == 1 and isinstance(artifacts.get('artifacts'), list)
                and len(artifacts['artifacts']) == 1, 'Exactly one native UI artifact API record required')
        artifact = artifacts['artifacts'][0]; integer(artifact['id'])
        require(artifact.get('name') == f'native-ui-evidence-{candidate}-{run_id}-{attempt}' and artifact.get('expired') is False
                and artifact.get('workflow_run', {}).get('id') == run_id and artifact['workflow_run'].get('head_sha') == workflow,
                'Trusted API artifact identity differs')
        raw_digest = artifact.get('digest', '')
        require(isinstance(raw_digest, str) and raw_digest.startswith('sha256:'), 'Trusted API raw digest required')
        raw_sha = raw_digest[7:]; archive_reader.digest(raw_sha)
        raw_bytes = integer(artifact['size_in_bytes'])
        require(raw_bytes <= archive_reader.LIMITS['archive_bytes'], 'Archive exceeds qualified pilot profile; no fallback extraction')
        expected_candidate = validate_expected(inputs['expectedCandidate'], candidate, tree)
        expected_infra = validate_expected(inputs['expectedInfrastructure'], workflow)
        captured = {}; rows = []
        with archive_reader.Archive(archive, raw_sha) as source:
            require(source.before['bytes'] == raw_bytes, 'Trusted API raw archive size differs')
            require(sum(name.endswith('.png') for name in source.infos) <= 100, 'Screenshot count exceeds pilot cap')
            for name in sorted(source.infos):
                body = bytearray() if name in CAPTURED_MEMBERS else None
                row = source.copy(name, None, body.extend if body is not None else lambda chunk: None)
                rows.append(row)
                if body is not None:
                    try: captured[name] = archive_reader.decode_json(body)
                    except (ValueError, UnicodeError): captured[name] = None
            for verify in verifiers: verify()
        member_map = {'version': 1, 'archiveSha256': raw_sha, 'archiveBytes': raw_bytes, 'members': rows}
        problems = []
        receipt = captured.get('receipt.json'); ledger = captured.get('episodes.json')
        identity = {'candidateSha': candidate, 'workflowSha': workflow, 'eventSha': workflow,
                    'workflowRef': REPOSITORY+'/'+WORKFLOW+'@refs/heads/main', 'event': 'workflow_dispatch',
                    'runId': str(run_id), 'runAttempt': str(attempt)}
        if not isinstance(receipt, dict) or receipt.get('identity') != identity: problems.append('Runtime receipt identity missing or mismatched')
        for name, expected in [('candidate-source.json', expected_candidate), ('infrastructure-source.json', expected_infra)]:
            error = compare_source(captured.get(name), expected, name)
            if error: problems.append(error)
        episode_rows = ledger.get('episodes') if isinstance(ledger, dict) else None
        if not isinstance(episode_rows, list) or len(episode_rows) != 9 or any(not isinstance(row, dict) for row in episode_rows) or tuple(row.get('id') for row in episode_rows) != EPISODES:
            problems.append('Complete ordered episode ledger missing or mismatched'); episode_rows = []
        result = {'version': 1, 'status': 'collected' if not problems else 'collected-with-identity-errors',
                  'runId': run_id, 'runAttempt': attempt, 'candidateSha': candidate, 'candidateTree': tree, 'workflowSha': workflow,
                  'artifactId': artifact['id'], 'archive': str(archive), 'archiveSha256': raw_sha, 'archiveBytes': raw_bytes,
                  'archiveManifestSha256': archive_reader.sha(archive_reader.encoded(member_map)), 'memberCount': len(rows),
                  'screenshotCount': sum(row['name'].endswith('.png') for row in rows),
                  'inputBindings': {key: request[key] for key in ('run', 'artifacts', 'expectedCandidate', 'expectedInfrastructure')},
                  'githubConclusion': run.get('conclusion'), 'runtimeStatus': receipt.get('status') if isinstance(receipt, dict) else None,
                  'identityErrors': problems, 'sourceFilesMatched': {'candidate': len(expected_candidate['files']), 'infrastructure': len(expected_infra['files'])} if not problems else None,
                  'episodes': [{key: row.get(key) for key in ('id', 'status', 'timedOut', 'cleanupVerified', 'failure')} for row in episode_rows],
                  'runtimeAcceptance': 'not-performed', 'visualInspection': 'not-performed', 'extractedMembers': [], 'originalRetirementRun': False,
                  'claim': 'Byte-integrity collection only; raw failed/interrupted statuses stay in the canonical archive. Generated member hashes are not independent expected correctness.'}
        for verify in verifiers: verify()
        publish(output, member_map, result)
        for verify in verifiers: verify()
        return result


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--request', required=True); parser.add_argument('--request-sha256', required=True)
    args = parser.parse_args()
    request = archive_reader.read_bound_json(args.request, args.request_sha256)
    result = collect(request)
    print(json.dumps(result, sort_keys=True))
    return 0 if result['status'] == 'collected' else 1


if __name__ == '__main__': raise SystemExit(main())
