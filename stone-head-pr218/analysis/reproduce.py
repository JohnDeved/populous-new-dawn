"""Replay both frozen ordinary Stone Head predicates from exact compressed rows."""
import gzip
import hashlib
import json
from pathlib import Path
import subprocess
import sys
import tempfile

PACKET = Path(__file__).resolve().parents[1]
DRIVER = 'febd084f136389ad254ce04b9a96ec133cdc1bfdfc9b18346d99b4f159a8af01'
CHECKER = '8d2db8452e04e3ad1ae88b83f4878fd1323cb54a7233e09e31f0deda28f84d98'
if len(sys.argv) != 2:
    raise SystemExit('Usage: python3 stone-head-pr218/analysis/reproduce.py /path/to/game-git-checkout')
repository = Path(sys.argv[1]).resolve()
checker = PACKET / 'analysis/analyze-stone-head-visits.py'
sha = lambda value: hashlib.sha256(value).hexdigest()
assert sha(checker.read_bytes()) == CHECKER
assert sha((PACKET / 'observe-stone-head-visits.mjs').read_bytes()) == DRIVER
rows = [('baseline-3cc', '3cc9e830d2e7d2aa9844e8104fa51017d65dd171', 'stone-head-repair-negative-control.json', 1),
        ('candidate-d97', 'd97c370da3e996e00130610df97d10b827ab5c4b', 'stone-head-attribution.json', 0)]
results = []
with tempfile.TemporaryDirectory(prefix='stone214-offline-') as directory:
    for label, commit, name, expected_exit in rows:
        raw = gzip.decompress((PACKET / label / 'sprite-observations.json.gz').read_bytes())
        expected = (PACKET / label / name).read_bytes()
        assert sha(raw) == json.loads(expected)['rawSha256']
        source = Path(directory) / (label + '.json'); source.write_bytes(raw)
        output = Path(directory) / (label + '-result.json')
        run = subprocess.run([sys.executable, str(checker), '--observations', str(source),
                              '--source-root', str(repository), '--expected-source', commit,
                              '--expected-driver', DRIVER, '--output', str(output)])
        assert run.returncode == expected_exit, label
        assert output.read_bytes() == expected, label
        results.append({'label': label, 'expectedExit': expected_exit,
                        'resultSha256': sha(expected), 'byteIdentical': True})
print(json.dumps({'reproductionStatus': 'passed', 'results': results}, indent=2))
