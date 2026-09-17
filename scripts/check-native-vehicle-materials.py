"""Compare captured vehicle geometry and original loader-enabled tribe texture dispatch.

Usage: python -B scripts/check-native-vehicle-materials.py EXE LIVE_MODEL_INPUT
The unchanged live-model oracle checks projection/shading first. Then execute the
original post-load flag setter and original full model consumer for both vehicle
meshes and all four owners (plus native neutral). No native callee interception or
fixture recording. Output does not claim final native GPU rasterization.
"""
import hashlib
import json
from pathlib import Path
import runpy
import subprocess
import sys

ROOT = Path(__file__).resolve().parents[1]
ns = runpy.run_path(str(ROOT / 'scripts/check-native-live-models.py'))
cpu, call, read, write = [ns[name] for name in ['cpu', 'call', 'read', 'write']]
unit, objects, pool = [ns[name] for name in ['unit', 'objects', 'pool']]
call(0x418de0)
assert all(read(objects + model * 54, 'H') & 1 for model in [143, 144])
rows = []
for model in [143, 144]:
    baseline = None
    for owner, team in [(0, 'blue'), (1, 'red'), (2, 'yellow'), (3, 'green'), (-1, 'wild')]:
        # Reuse the last captured actual view/origin/angle, varying only these
        # original class4 fields; each call regenerates the complete polygon list.
        write(unit + 0x2a, 'BB', 4, 1 if model == 143 else 3)
        write(unit + 0x2f, 'b', owner)
        write(unit + 0x33, 'HH', model, 0x200)
        write(0x75d508, 'I', pool)
        cpu.mem_write(0x75d50c, bytes(3585 * 4))
        call(0x4708d0, unit)
        emitted = []
        for address in range(pool, read(0x75d508, 'I'), 70):
            assert read(address, 'H') == 6
            emitted.append({
                'mode': read(address + 0x45, 'B'), 'textureHandle': read(address + 0x44, 'B'),
                'screen': [read(address + offset, 'f') for offset in [6, 10, 26, 30, 46, 50]],
            })
        assert emitted
        if owner == 0:
            baseline = emitted
        assert len(emitted) == len(baseline)
        remapped = 0
        for before, after in zip(baseline, emitted):
            assert before['mode'] == after['mode'] and before['screen'] == after['screen']
            tile = before['textureHandle'] - 1
            flagged = read(0x5aa218 + tile, 'B') & 1
            assert after['textureHandle'] == before['textureHandle'] + (owner if flagged else 0)
            remapped += bool(flagged)
            rows.append({'model': model, 'team': team, 'sourceTile': tile,
                         'actualTile': after['textureHandle'] - 1, 'mode': after['mode']})
        assert remapped > 0, 'Original vehicle must actually exercise the colored texture branch'
script = """
import assert from 'node:assert/strict';
import {originalVehicleTextureTile} from './app/vehicle-appearance.ts';
let text='';for await(const chunk of process.stdin)text+=chunk;
for(const row of JSON.parse(text))assert.equal(originalVehicleTextureTile(row.sourceTile,row.team),row.actualTile,JSON.stringify(row));
"""
result = subprocess.run(['node', '--input-type=module', '-e', script], cwd=ROOT,
                        input=json.dumps(rows), capture_output=True, text=True, timeout=15)
assert result.returncode == 0, result.stderr
output = Path(sys.argv[2]).with_name('native-vehicle-materials.json')
with output.open('x') as f:
    json.dump({'status': 'PASS_ORIGINAL_LOADER_AND_VEHICLE_TEAM_TEXTURES',
               'exeSHA256': hashlib.sha256(Path(sys.argv[1]).read_bytes()).hexdigest(),
               'sourceSHA256': hashlib.sha256(Path(__file__).read_bytes()).hexdigest(),
               'helperSHA256': hashlib.sha256((ROOT / 'app/vehicle-appearance.ts').read_bytes()).hexdigest(),
               'originalFunctions': ['00418de0', '004708d0', '00471a80'],
               'fullVehicleCalls': 10, 'textureAssertions': len(rows), 'results': rows,
               'limits': 'Complete original model dispatch and texture-handle choice at an actual captured view. Final native rasterization/driver pixels are not executed.'}, f, indent=2)
    f.write('\n')
print(f'PASS: original loader flags and 10 full vehicle draws; {len(rows)} original texture selections match all four tribes plus neutral')
