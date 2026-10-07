"""Prepare source only; never import/execute the app or launch the capture."""
from pathlib import Path
import hashlib
import json

root = Path.cwd()
source = root / 'tests/mission2-raid.test.mjs'
text = source.read_text()
name = 'Mission 2 naturally earns Matak kills and launches the organized raid'
start = text.index("test('" + name + "'")
end = text.index('\ntest(', start + 1)
prefix, case = text[:start], text[start:end]
assert hashlib.sha256(source.read_bytes()).hexdigest() == '7574ce1db5080bc4efed98a7c0bc5b4c2dd7c29e9e4a8e3e4d1bda0bf5104a42'
folder = root / 'work/orchestration/state33-release-capture-source'
folder.mkdir(parents=True, exist_ok=True)
observer = '../../../decomp/research/raid-state33-release/capture/observer.mjs'
for old, new in [("import test from 'node:test'", "import { test, observeTick } from '" + observer + "'"), ('  tick,', '  tick as underlyingTick,')]:
    assert prefix.count(old) == 1, old
    prefix = prefix.replace(old, new)
prefix = prefix.replace("'../app/", "'../../../app/")
prefix += '\nfunction tick(w, dt) { return observeTick(underlyingTick, w, dt) }\n'
(folder / 'scenario.mjs').write_text(prefix + case)
(folder / 'main.mjs').write_text("import './scenario.mjs'\nimport { run } from '" + observer + "'\nawait run()\n")
(folder / 'scenario-source.txt').write_text(case)
(folder / 'transform.json').write_text(json.dumps({
    'kind': 'Source preparation only; no imported app module executed',
    'source': str(source.relative_to(root)),
    'sourceSha256': hashlib.sha256(source.read_bytes()).hexdigest(),
    'case': name, 'caseSha256': hashlib.sha256(case.encode()).hexdigest(),
    'transforms': ['Select unchanged first scenario and full original import/helper prefix',
                   'Relocate relative app imports', 'Replace node:test registration',
                   'Alias tick solely to the passive observer'],
    'maintainedTestStatus': 'Not executed; future capture stops after3227, later assertions not-run',
}, indent=2) + '\n')
print('Prepared one unchanged maintained-case prefix; no simulation or native execution')
