"""Finite one-shot launcher. Defining it does not grant native execution."""
import hashlib
import json
import os
import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[3]
MANIFEST = Path(__file__).with_name('launch.json')


def digest(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()


def launch(approved_head):
    if len(approved_head) != 40 or any(c not in '0123456789abcdef' for c in approved_head):
        raise ValueError('Pass the exact independently reviewed commit from the parent execution grant')
    config = json.loads(MANIFEST.read_text())
    if ROOT.resolve() != Path(config['freshCwd']).resolve() or Path.cwd().resolve() != ROOT.resolve():
        raise RuntimeError('Use only the named fresh execution worktree')
    actual_head = subprocess.check_output(['/usr/bin/git', 'rev-parse', 'HEAD'], cwd=ROOT, text=True).strip()
    if actual_head != approved_head:
        raise RuntimeError('Source head differs from the explicit execution grant')
    if subprocess.check_output(['/usr/bin/git', 'status', '--porcelain'], cwd=ROOT, text=True).strip():
        raise RuntimeError('Execution worktree is not clean')
    for name, expected in config['inputsSha256'].items():
        path = Path(name)
        if not path.is_absolute():
            path = ROOT / path
        if digest(path) != expected:
            raise RuntimeError('Input fingerprint differs: ' + name)
    output = ROOT / config['receiptOutput']
    if output.parent.exists():
        raise RuntimeError('The one-shot output directory already exists; no retry')
    output.parent.mkdir(parents=True, exist_ok=False)
    marker = output.parent / 'launch-once.json'
    with marker.open('x') as stream:
        json.dump({'approvedHead': approved_head, 'launcherManifestSha256': digest(MANIFEST),
                   'mode': 'one separately authorized original arrival'}, stream)
        stream.write('\n')
    # One exec, no shell, retry, background task, or secondary original entry.
    os.execv(config['supervisorArgv'][0], config['supervisorArgv'])


if __name__ == '__main__':
    if len(sys.argv) != 3 or sys.argv[1] != '--execute-reviewed':
        raise SystemExit('Usage only after separate resource grant: launch.py --execute-reviewed APPROVED_FULL_HEAD')
    launch(sys.argv[2])
