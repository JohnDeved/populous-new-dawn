"""Replay the exact frozen offline checker, with two hash-checked source JSON inputs."""
import hashlib
import json
from pathlib import Path
import shutil
import subprocess
import sys
import tempfile

PACKET = Path(__file__).resolve().parents[1]
SOURCE = 'a53fa05587c4c1d363e3596162b41fcb9f26e3e8'
if len(sys.argv) != 2:
    raise SystemExit('Usage: python3 analysis/reproduce.py /path/to/game-git-checkout')
repository = Path(sys.argv[1]).resolve()
reference = PACKET / 'baseline-a53-raw-owners/baseline-cadence-attribution.json'
expected = json.loads(reference.read_text())
def sha(data):
    return hashlib.sha256(data).hexdigest()

checker = PACKET / 'analysis/analyze-baseline.py'
raw = PACKET / 'baseline-a53-raw-owners/sprite-observations.json'
assert sha(checker.read_bytes()) == expected['checkerSha256']
assert sha(raw.read_bytes()) == expected['inputSha256']
with tempfile.TemporaryDirectory(prefix='pnd214-offline-') as directory:
    root = Path(directory)
    (root / 'app').mkdir()
    for name, key in [('original-units.json', 'spritesSha256'), ('original-rules.json', 'rulesSha256')]:
        content = subprocess.check_output(['git', 'show', f'{SOURCE}:app/{name}'], cwd=repository)
        assert sha(content) == expected[key], name
        (root / 'app' / name).write_bytes(content)
    target = root / 'work/orchestration/sprite-visit-ordinary-214'
    (target / 'baseline-a53-raw-owners').mkdir(parents=True)
    shutil.copyfile(checker, target / 'analyze-baseline.py')
    shutil.copyfile(raw, target / 'baseline-a53-raw-owners/sprite-observations.json')
    subprocess.run([sys.executable, str(target / 'analyze-baseline.py')], check=True)
    actual = (target / 'baseline-a53-raw-owners/baseline-cadence-attribution.json').read_bytes()
    assert actual == reference.read_bytes(), 'Replay differs from the recorded analysis'
    print(json.dumps({'status': 'passed', 'analysisSha256': sha(actual), 'sourceCommit': SOURCE,
                      'method': 'Exact frozen checker; local Git source reads; byte-identical offline result'}))
