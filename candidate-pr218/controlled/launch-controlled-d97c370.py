import datetime
import hashlib
import json
import os
from pathlib import Path
import socket
import subprocess
import sys

ROOT = Path('/workspace/scratch/69fd8163d94e/cloud-dev-20261004/stone-head-logical-visit-fix')
BASE = ROOT.parent
PROOF = ROOT / 'work/orchestration/stone-head-logical-fix'
OUTPUT = PROOF / 'controlled-d97c370-render'
TMP = BASE / 'stone-controlled-d97c370-tmp-20261005'
DRIVER = PROOF / 'controlled-render-adapter.mjs'
CHECKER = ROOT / 'scripts/check-browser-stone-head-animation.mjs'
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
            code = sock.connect_ex((host, 4318))
            rows.append({'host': host, 'port': 4318, 'code': code, 'closed': code == 111})
    return rows

assert subprocess.check_output(['git', 'rev-parse', 'HEAD'], cwd=ROOT, text=True).strip() == 'd97c370da3e996e00130610df97d10b827ab5c4b'
assert not subprocess.check_output(['git', 'status', '--short'], cwd=ROOT, text=True).strip()
assert not OUTPUT.exists() and not TMP.exists()
PROOF.mkdir(parents=True, exist_ok=True)
assert sha(DRIVER) == '32c0d66d88ef24cfdebd386a24713729aa0a1b0d9b9dba033146a593b1329219'
assert CHECKER.read_bytes() == (PROOF / 'controlled-checker-original.mjs').read_bytes()
TMP.mkdir(mode=0o700)
OUTPUT.mkdir(mode=0o700)
os.sched_setaffinity(0, {0, 1, 2, 3})
env = {**os.environ, 'TMPDIR': str(TMP), 'TMP': str(TMP), 'TEMP': str(TMP)}
inputs = [
    str(DRIVER), str(CHECKER), str(Path(__file__).resolve()), str(BROWSER),
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
         'dependencyInode': (ROOT / 'node_modules').stat().st_ino, 'harnessTimeoutMs': 300000, 'outerTimeoutSeconds': 330,
         'preTcp': tcp(), 'status': 'prepared'}
assert all(row['closed'] for row in state['preTcp']), state['preTcp']
assert state['dependencyInode'] == 925605
assert '154.' in state['browserVersion'], state['browserVersion']
command = ['node', 'scripts/orchestration/command-receipt.mjs',
           '--output', 'work/orchestration/stone-head-logical-fix/controlled-d97c370-command.json']
for path in inputs:
    command += ['--input', path]
command += ['--', 'timeout', '--signal=TERM', '--kill-after=3s', '330s',
            'node', 'scripts/local-render/harness.mjs', '--game-root', str(ROOT),
            '--browser', str(BROWSER), '--port', '4318', '--mission', '1',
            '--output', str(OUTPUT), '--timeout', '300000', '--scenario', str(DRIVER)]
state['command'] = command
(PROOF / 'controlled-d97c370-launcher-receipt.json').write_text(json.dumps(state, indent=2) + '\n')
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
(PROOF / 'controlled-d97c370-launcher-receipt.json').write_text(json.dumps(state, indent=2) + '\n')
print(json.dumps({key: state[key] for key in ['status', 'commandExitCode', 'resourcesReleased', 'inputsStable', 'postTcp']}, indent=2))
sys.exit(result.returncode or (0 if state['resourcesReleased'] and state['inputsStable'] else 1))
