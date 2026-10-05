"""Replay the unchanged candidate offline checker against the pinned saved rows."""
import hashlib
import json
from pathlib import Path
import subprocess
import sys
import tempfile

PACKET = Path(__file__).resolve().parents[1]
SOURCE = 'd8897cf8eeac1886d2f653af2cad0674c6bfa91a'
if len(sys.argv) != 2:
    raise SystemExit('Usage: python3 candidate-d8897cf/analysis/reproduce.py /path/to/game-git-checkout')
repository = Path(sys.argv[1]).resolve()
checker = PACKET / 'analysis/analyze-candidate.py'
raw = PACKET / 'raw/sprite-observations.json'
reference = PACKET / 'raw/candidate-cadence-attribution.json'
expected = json.loads(reference.read_text())
sha = lambda value: hashlib.sha256(value).hexdigest()
assert sha(checker.read_bytes()) == expected['checkerSha256']
assert sha(raw.read_bytes()) == expected['observationsSha256']
with tempfile.TemporaryDirectory(prefix='pnd214-candidate-offline-') as directory:
    output = Path(directory) / 'replayed.json'
    subprocess.run([sys.executable, str(checker), '--observations', str(raw),
                    '--source-root', str(repository), '--expected-source', SOURCE,
                    '--output', str(output)], check=True)
    actual = output.read_bytes()
    assert actual == reference.read_bytes(), 'Replay differs from recorded candidate analysis'
    print(json.dumps({'status': 'passed', 'analysisSha256': sha(actual), 'sourceCommit': SOURCE,
                      'method': 'Exact frozen checker; local Git source reads; byte-identical offline result'}))
