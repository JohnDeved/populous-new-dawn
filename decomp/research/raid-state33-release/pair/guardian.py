"""Exact-source, one-shot native/port pair supervisor; default mode is read-only."""
from pathlib import Path
import datetime
import hashlib
import json
import os
import resource
import signal
import subprocess
import sys
import time

root = Path.cwd()
assert sys.flags.ignore_environment and sys.flags.no_user_site and not sys.flags.optimize
assert len(sys.argv) == 5, 'mode manifestSha reviewedSourceHead grantedCpu'
mode, manifest_sha, head, cpu_text = sys.argv[1:]
assert mode in ('--source-preflight', '--launch-pair')
cpu = int(cpu_text)
assert cpu in os.sched_getaffinity(0)
folder = root / 'decomp/research/raid-state33-release/pair'
raw = (folder / 'launch-manifest.json').read_bytes()
assert hashlib.sha256(raw).hexdigest() == manifest_sha
manifest = json.loads(raw)
limits = manifest['limits']
assert limits == dict(termSeconds=12, killGraceSeconds=3, sampleSeconds=0.02,
                     aggregateRssBytes=1073741824, outputBytes=8388608, cpuCount=1,
                     retry=False, nativeInvocations=1, portInvocations=1,
                     nativeInstructions=100000, nativeMicroseconds=1000000, portSeconds=5)
def git(*args):
    return subprocess.check_output(['git', *args], cwd=root, text=True).strip()
assert git('rev-parse', 'HEAD') == head
assert not git('status', '--porcelain')
assert git('rev-parse', 'HEAD:app') == manifest['runtimeAppTree']
assert not git('diff', manifest['runtimeHead'], '--', 'app', 'tests/mission2-raid.test.mjs')
for item in manifest['files']:
    assert hashlib.sha256((root / item['path']).read_bytes()).hexdigest() == item['sha256'], item['path']
for item in manifest['tools'] + manifest['externalInputs']:
    assert hashlib.sha256(Path(item['path']).read_bytes()).hexdigest() == item['sha256'], item['path']
assert Path(sys.executable).resolve() == Path(manifest['tools'][1]['path']).resolve()
output = root / manifest['output']
assert not output.exists(), 'No retries or reuse of a pair output directory'
command = [manifest['python'], '-I', str(folder / 'probe.py'), '--execute-pair', manifest_sha, head]
import importlib.util
spec = importlib.util.spec_from_file_location('state33_probe', folder / 'probe.py')
probe = importlib.util.module_from_spec(spec)
spec.loader.exec_module(probe)  # Standard-library imports and definitions only.
probe.preflight(manifest_sha, head)
if mode == '--source-preflight':
    print(json.dumps(dict(status='source-preflight-passed', sourceHead=head,
                         manifestSha256=manifest_sha, cpu=cpu, command=command,
                         nativeCalls=0, appExecution=False)))
    sys.exit(0)

# Reaching this gate requires the parent's reviewed resource grant for this exact command.
output.mkdir()
child = None
started = time.monotonic()
term_deadline = started + limits['termSeconds']
kill_deadline = term_deadline + limits['killGraceSeconds']
cleanup_deadline = None
receipt = dict(sourceHead=head, manifestSha256=manifest_sha, command=command, cpu=[cpu],
               limits=limits, startedAt=datetime.datetime.now(datetime.timezone.utc).isoformat(),
               termDeadlineMonotonic=term_deadline, killDeadlineMonotonic=kill_deadline,
               peakAggregateRssBytes=0, outputBytes=0, cleanupSignals=[], status='running')
def process_info(pid):
    try:
        stat = Path(f'/proc/{pid}/stat').read_text()
        fields = stat[stat.rfind(')') + 2:].split()
        return dict(pid=pid, group=int(fields[2]), state=fields[0],
                    startTimeTicks=int(fields[19]), rssBytes=int(fields[21]) * os.sysconf('SC_PAGE_SIZE'))
    except (OSError, ValueError, IndexError):
        return None

def group_members():
    if child is None:
        return []
    found = []
    for path in Path('/proc').iterdir():
        if path.name.isdigit():
            info = process_info(int(path.name))
            if info and info['group'] == child.pid and info['state'] != 'Z':
                found.append(info)
    return found

def signal_owned(sig):
    if group_members():
        try:
            os.killpg(child.pid, sig)
            receipt['cleanupSignals'].append(signal.Signals(sig).name)
        except ProcessLookupError:
            pass

def cleanup():
    global cleanup_deadline
    if cleanup_deadline is None:
        cleanup_deadline = min(kill_deadline, time.monotonic() + limits['killGraceSeconds'])
        receipt['cleanupDeadlineMonotonic'] = cleanup_deadline
    signal_owned(signal.SIGTERM)
    while group_members() and time.monotonic() < cleanup_deadline:
        time.sleep(limits['sampleSeconds'])
    signal_owned(signal.SIGKILL)
    if child:
        child.wait(timeout=1)

def interrupted(signum, _frame):
    receipt['status'] = 'interrupted'
    raise SystemExit(128 + signum)
for sig in (signal.SIGTERM, signal.SIGINT):
    signal.signal(sig, interrupted)

def child_limits():
    os.sched_setaffinity(0, {cpu})
    resource.setrlimit(resource.RLIMIT_FSIZE, (limits['outputBytes'], limits['outputBytes']))

def postflight():
    checks = []
    for name, args, expected in [
        ('head', ['rev-parse', 'HEAD'], head),
        ('cleanStatus', ['status', '--porcelain'], ''),
        ('appTree', ['rev-parse', 'HEAD:app'], manifest['runtimeAppTree']),
        ('runtimeDiff', ['diff', manifest['runtimeHead'], '--', 'app', 'tests/mission2-raid.test.mjs'], ''),
    ]:
        try:
            actual = git(*args)
            value = actual if len(actual) <= 2048 else dict(
                bytes=len(actual.encode()), sha256=hashlib.sha256(actual.encode()).hexdigest())
            checks.append(dict(name=name, expected=expected, actual=value, passed=actual == expected))
        except Exception as error:
            checks.append(dict(name=name, passed=False, error=str(error)))
    inputs = [('file', root / item['path'], item['sha256']) for item in manifest['files']]
    inputs += [('external', Path(item['path']), item['sha256'])
               for item in manifest['tools'] + manifest['externalInputs']]
    inputs.append(('manifest', folder / 'launch-manifest.json', manifest_sha))
    for kind, path, expected in inputs:
        try:
            actual = hashlib.sha256(path.read_bytes()).hexdigest()
            checks.append(dict(kind=kind, path=str(path), expected=expected,
                               actual=actual, passed=actual == expected))
        except Exception as error:
            checks.append(dict(kind=kind, path=str(path), passed=False, error=str(error)))
    encoded = json.dumps(checks, sort_keys=True, separators=(',', ':')).encode()
    changed = [check for check in checks if not check['passed']]
    return dict(passed=not changed, checkedCount=len(checks),
                orderedChecksSha256=hashlib.sha256(encoded).hexdigest(), changedInputs=changed,
                unchangedInputs='Every other member matched the frozen launch-manifest hash exactly')

environment = {key: value for key, value in os.environ.items() if key not in
               ['NODE_OPTIONS', 'NODE_PATH', 'NODE_COMPILE_CACHE', 'PYTHONPATH', 'PYTHONOPTIMIZE',
                'PYTHONHOME', 'LIBUNICORN_PATH', 'UNICORN_LIB_PATH', 'LD_PRELOAD', 'LD_LIBRARY_PATH']}
environment.update(PND_STATE33_PAIR='approved-one-pair', PND_STATE33_PAIR_CPU=str(cpu))
try:
    with (output / 'stdout.log').open('xb') as stdout, (output / 'stderr.log').open('xb') as stderr:
        child = subprocess.Popen(command, cwd=root, env=environment, start_new_session=True,
                                 preexec_fn=child_limits, stdout=stdout, stderr=stderr)
        receipt['processIdentity'] = process_info(child.pid)
        (output / 'started.json').write_text(json.dumps(receipt, indent=2) + '\n')
        while child.poll() is None:
            members = group_members()
            own = process_info(os.getpid())
            rss = sum(info['rssBytes'] for info in members) + (own['rssBytes'] if own else 0)
            size = sum(path.stat().st_size for path in output.iterdir() if path.is_file())
            receipt['peakAggregateRssBytes'] = max(receipt['peakAggregateRssBytes'], rss)
            receipt['outputBytes'] = size
            failure = ('rss-cap' if rss > limits['aggregateRssBytes'] else
                       'output-cap' if size > limits['outputBytes'] - 262144 else
                       'time-cap' if time.monotonic() >= term_deadline else None)
            if failure:
                receipt['status'] = failure
                cleanup()
                break
            time.sleep(limits['sampleSeconds'])
        receipt['exitCode'] = child.wait(timeout=1)
        if receipt['status'] == 'running':
            receipt['status'] = 'child-finished' if receipt['exitCode'] == 0 else 'child-failed'
            if receipt['exitCode'] == 0:
                worker = json.loads((output / 'result.json').read_text())
                if worker['status'] != 'expected-state33-release-gap-confirmed':
                    receipt['status'] = 'unexpected-worker-status'
                receipt['workerResult'] = worker
finally:
    cleanup()
    remaining = group_members()
    receipt.update(remainingProcessGroupMembers=remaining, resourcesReleased=not remaining,
                   elapsedSeconds=time.monotonic() - started,
                   finishedAt=datetime.datetime.now(datetime.timezone.utc).isoformat())
    receipt['postflight'] = postflight()
    if not receipt['postflight']['passed']:
        receipt['status'] = 'source-changed'
    receipt['outputBytes'] = sum(path.stat().st_size for path in output.iterdir() if path.is_file())
    receipt['outputs'] = [dict(path=path.name, bytes=path.stat().st_size,
                               sha256=hashlib.sha256(path.read_bytes()).hexdigest())
                          for path in sorted(output.iterdir()) if path.is_file()]
    if receipt['outputBytes'] > limits['outputBytes'] - 262144:
        receipt['status'] = 'output-cap'
    terminal = json.dumps(receipt, indent=2) + '\n'
    assert receipt['outputBytes'] + len(terminal.encode()) <= limits['outputBytes'], 'Terminal receipt output cap'
    (output / 'cleanup.json').write_text(terminal)
print(json.dumps(receipt))
sys.exit(0 if receipt['status'] == 'child-finished' and receipt['resourcesReleased'] else 1)
