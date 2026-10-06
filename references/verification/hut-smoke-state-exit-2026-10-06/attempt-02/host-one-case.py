"""Host-only receipt owner for the one parent-authorized native invocation."""
import datetime
import hashlib
import json
import os
from pathlib import Path
import signal
import subprocess
import time

ROOT = Path.cwd()
PACKET = ROOT / 'decomp/research/hut-smoke-state-exit'
MANIFEST = PACKET / 'one-case-abi-correction-manifest.json'
LAUNCH = PACKET / 'one-case-abi-correction-launch.json'
sha = lambda path: hashlib.sha256(Path(path).read_bytes()).hexdigest()
assert sha(MANIFEST) == '997f5d408f998d4fac368788e3ca8d4ed8c055c1aad557494abcadf7d6f37c4f'
manifest = json.loads(MANIFEST.read_text())
launch = json.loads(LAUNCH.read_text())
expected = {str(ROOT / path): value for path, value in manifest['sourceSha256'].items()}
expected.update(manifest['externalInputSha256'])
expected.update(manifest['hostGuardSha256'])
before = {path: sha(path) for path in expected}
assert before == expected, 'Frozen source/input/tool hash mismatch before launch'
assert 4 in os.sched_getaffinity(0), 'CPU4 is outside this executor affinity'
head = subprocess.check_output(['git', 'rev-parse', 'HEAD'], text=True).strip()
assert head == '2136f8df17d1e46d9a3d75f984af98898e8d5eef'
assert not subprocess.check_output(['git', 'status', '--porcelain'], text=True).strip()
output = Path(launch['freshOutputDirectory'])
output.parent.mkdir(parents=True, exist_ok=True)
output.mkdir()  # Refuse reuse, including a prior prepared or unknown attempt.
receipt_path = output / 'receipt.json'
environment = {'PATH': '/usr/bin:/bin', 'LANG': 'C.UTF-8', 'LC_ALL': 'C.UTF-8',
               **launch['environment']}
receipt = {'status': 'unknown', 'phase': 'prepared', 'head': head,
           'argv': launch['argv'], 'cwd': str(ROOT), 'environment': environment,
           'cpuAffinity': [4], 'before': before, 'hostRunnerSha256': sha(__file__),
           'startedAt': datetime.datetime.now(datetime.timezone.utc).isoformat(),
           'retry': False, 'resourcesReleased': False}


def save():
    temporary = receipt_path.with_suffix('.tmp')
    temporary.write_text(json.dumps(receipt, indent=2) + '\n')
    temporary.replace(receipt_path)


def group_members(group):
    members = []
    for path in Path('/proc').glob('[0-9]*/stat'):
        try:
            raw = path.read_text()
            tail = raw[raw.rfind(')') + 2:].split()
            if int(tail[2]) == group:
                members.append({'pid': int(path.parent.name), 'state': tail[0],
                                'group': int(tail[2]), 'session': int(tail[3]),
                                'startTicks': int(tail[19])})
        except (FileNotFoundError, ProcessLookupError, PermissionError):
            continue
    return members


save()
started = time.monotonic()
with (output / 'stdout.json').open('xb') as stdout, (output / 'stderr.txt').open('xb') as stderr:
    child = subprocess.Popen(launch['argv'], cwd=ROOT, env=environment,
                             stdin=subprocess.DEVNULL, stdout=stdout, stderr=stderr,
                             start_new_session=True,
                             preexec_fn=lambda: os.sched_setaffinity(0, {4}))
    receipt.update(phase='running', processGroup=child.pid,
                   initialOwnedProcesses=group_members(child.pid))
    save()
    try:
        exit_code = child.wait(timeout=38)
    except subprocess.TimeoutExpired:
        # Fallback belongs only to this fresh session/group. Never discover or
        # kill a pre-existing application, queue job or process-name match.
        owned = group_members(child.pid)
        assert owned and all(row['session'] == child.pid for row in owned)
        os.killpg(child.pid, signal.SIGKILL)
        exit_code = child.wait(timeout=5)
        receipt['outerTimeout'] = True

remaining = group_members(child.pid)
if remaining:
    assert all(row['session'] == child.pid for row in remaining)
    os.killpg(child.pid, signal.SIGKILL)
    receipt['terminalResidualGroupKill'] = remaining
    # The native script starts no descendants. Any residual group blocks the
    # cleanup claim; no second launch or result retry occurs.
    remaining = group_members(child.pid)
after = {path: sha(path) for path in expected}
same = after == before and sha(__file__) == receipt['hostRunnerSha256']
receipt.update(status='passed' if exit_code == 0 and same and not remaining else 'failed',
               phase='terminal', exitCode=exit_code, elapsedSeconds=time.monotonic() - started,
               after=after, unchangedInputs=same, remainingOwnedProcesses=remaining,
               resourcesReleased=not remaining,
               endedAt=datetime.datetime.now(datetime.timezone.utc).isoformat(),
               stdoutSha256=sha(output / 'stdout.json'), stderrSha256=sha(output / 'stderr.txt'))
save()
print(json.dumps({key: receipt[key] for key in ('status', 'exitCode', 'elapsedSeconds',
                                              'unchangedInputs', 'resourcesReleased')}, indent=2))
print(str(output))
