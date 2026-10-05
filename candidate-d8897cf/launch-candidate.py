import datetime
import hashlib
import json
import os
from pathlib import Path
import socket
import subprocess
import sys

ROOT = Path('/workspace/scratch/69fd8163d94e/cloud-dev-20261004/sprite-animation-gate-fix')
BASE = ROOT.parent
PROOF = ROOT / 'work/orchestration/sprite-visit-ordinary-214'
OUTPUT = PROOF / 'candidate-d8897cf-raw-owners'
TMP = BASE / 'sprite-visit-candidate-d8897cf-tmp-20261005'
DRIVER = BASE / 'integration-publish-recovered/work/orchestration/sprite-visit-ordinary-214/observe-sprite-visits.mjs'
BROWSER = BASE / 'prerequisites/chrome-headless-shell-linux64/chrome-headless-shell'

def now():
    return datetime.datetime.now(datetime.timezone.utc).isoformat()

def sha(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()

def tcp():
    rows = []
    for family, host in [(socket.AF_INET, '127.0.0.1'), (socket.AF_INET6, '::1')]:
        with socket.socket(family, socket.SOCK_STREAM) as sock:
            sock.settimeout(1)
            code = sock.connect_ex((host, 4374))
            rows.append({'host': host, 'port': 4374, 'code': code, 'closed': code == 111})
    return rows

assert subprocess.check_output(['git', 'rev-parse', 'HEAD'], cwd=ROOT, text=True).strip() == 'd8897cf8eeac1886d2f653af2cad0674c6bfa91a'
assert not subprocess.check_output(['git', 'status', '--short'], cwd=ROOT, text=True).strip()
assert not OUTPUT.exists() and not TMP.exists()
PROOF.mkdir(parents=True, exist_ok=True)
assert sha(DRIVER) == 'cb57bd7076cedb08b042b6f8ad843b088fc613ae6863f3fed3742944eb88a060'
TMP.mkdir(mode=0o700)
OUTPUT.mkdir(mode=0o700)
os.sched_setaffinity(0, {0, 1, 2, 3})
env = {**os.environ, 'TMPDIR': str(TMP), 'TMP': str(TMP), 'TEMP': str(TMP)}
inputs = [
    str(DRIVER), str(Path(__file__).resolve()), str(BROWSER),
    'package-lock.json', 'node_modules/.package-lock.json',
    'node_modules/playwright-core/lib/coreBundle.js',
    'node_modules/@playwright/test/package.json', 'node_modules/vite/package.json',
    'scripts/orchestration/command-receipt.mjs', 'scripts/local-render/harness.mjs',
]
state = {'startedAt': now(), 'pid': os.getpid(),
         'pidNamespace': os.readlink('/proc/self/ns/pid'),
         'networkNamespace': os.readlink('/proc/self/ns/net'),
         'cpus': sorted(os.sched_getaffinity(0)), 'tmp': str(TMP),
         'browserVersion': subprocess.check_output([str(BROWSER), '--version'], env=env, text=True).strip(),
         'nodeVersion': subprocess.check_output(['node', '--version'], text=True).strip(),
         'inputSha256': {p: sha(ROOT / p) for p in inputs},
         'dependencyInode': (ROOT / 'node_modules').stat().st_ino,
         'preTcp': tcp(), 'status': 'prepared'}
assert all(row['closed'] for row in state['preTcp']), state['preTcp']
assert state['dependencyInode'] == 925605
assert '154.' in state['browserVersion'], state['browserVersion']
command = ['node', 'scripts/orchestration/command-receipt.mjs',
           '--output', 'work/orchestration/sprite-visit-ordinary-214/candidate-d8897cf-command.json']
for path in inputs:
    command += ['--input', path]
command += ['--', 'timeout', '--signal=TERM', '--kill-after=3s', '150s',
            'node', 'scripts/local-render/harness.mjs', '--game-root', str(ROOT),
            '--browser', str(BROWSER), '--port', '4374', '--mission', '1',
            '--output', str(OUTPUT), '--timeout', '120000', '--scenario', str(DRIVER)]
state['command'] = command
(PROOF / 'candidate-d8897cf-launcher-receipt.json').write_text(json.dumps(state, indent=2) + '\n')
result = subprocess.run(command, cwd=ROOT, env=env, text=True)
state.update(finishedAt=now(), commandExitCode=result.returncode, postTcp=tcp())
state['inputSha256After'] = {p: sha(ROOT / p) for p in inputs}
state['inputsStable'] = state['inputSha256After'] == state['inputSha256']
state['terminalReceiptExists'] = (OUTPUT / 'receipt.json').exists()
state['status'] = 'terminal' if state['terminalReceiptExists'] else 'unknown'
inner = json.loads((OUTPUT / 'receipt.json').read_text()) if state['terminalReceiptExists'] else {}
state['innerStatus'] = inner.get('status')
state['listenerClosureVerified'] = all(row['closed'] for row in state['postTcp'])
# This unchanged harness can pass only after its browser close/disconnect check.
# Failed receipts need explicit failure analysis; a closed listener alone is insufficient.
state['browserCleanupVerified'] = inner.get('status') == 'passed' and not inner.get('failure') and not inner.get('previousFailure')
state['resourcesReleased'] = state['browserCleanupVerified'] and state['listenerClosureVerified']
(PROOF / 'candidate-d8897cf-launcher-receipt.json').write_text(json.dumps(state, indent=2) + '\n')
print(json.dumps({key: state[key] for key in ['status', 'commandExitCode', 'resourcesReleased', 'inputsStable', 'postTcp']}, indent=2))
sys.exit(result.returncode or (0 if state['resourcesReleased'] and state['inputsStable'] else 1))
