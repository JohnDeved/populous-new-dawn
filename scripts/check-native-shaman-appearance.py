"""Compare all four shipped Shaman selections with the original portrait draw.

Usage: python scripts/check-native-shaman-appearance.py EXE --output NEW_JSON
Runs the existing unchanged portrait oracle first, then supplies its same palette,
coordinate and final raster consumers for all four tribes. No fixture recording.
The world draw's equivalent tribe*8 branch is retained static evidence, not a
claim to execute the entire original graphics loop.
"""
import argparse
import hashlib
import json
from pathlib import Path
import runpy
import subprocess

ROOT = Path(__file__).resolve().parents[1]
parser = argparse.ArgumentParser(description=__doc__)
parser.add_argument('exe', type=Path)
parser.add_argument('--output', type=Path, required=True)
args = parser.parse_args()
if args.output.exists():
    raise ValueError('Preserve previous evidence; choose a new output')
# Existing oracle reads sys.argv[1] as the EXE and receives no --record flag.
loaded = runpy.run_path(str(ROOT / 'scripts/check-native-hud-portrait.py'))
native = loaded['call'].__globals__
write, call, unit, camera = native['write'], native['call'], native['unit'], native['camera']
units = native['units']
write(unit + 0x2b, 'B', 7)
cases = []
actions = {action: directions[0]['source'] for action, directions in units['animations']['blue-shaman'].items()}
actions['bodyDeath'] = 680
for tribe, team in enumerate(['blue', 'red', 'yellow', 'green']):
    for action, base in actions.items():
        directions = units['shamanSources'][str(base + tribe * 8)]
        for direction, cycle in enumerate(directions):
            for step in sorted({0, len(cycle['frames']) - 1}):
                write(unit + 0x2f, 'B', tribe)
                write(unit + 0x33, 'H', base)
                write(unit + 0x39, 'B', step)
                write(unit + 0x26, 'h', 0)
                write(camera + 0x32, 'h', (direction * 256 + 0x380) & 2047)
                native['layers'] = []
                call(0x450e60, unit, 47, 144)
                cases.append({'team': team, 'action': action, 'base': base, 'direction': direction,
                              'step': step, 'draws': native['layers']})
script = """
import assert from 'node:assert/strict';
import {shamanNativeDirections} from './app/shaman-appearance.ts';
import {spriteLayers} from './app/sprite-layers.ts';
import units from './app/original-units.json' with {type:'json'};
import camera from './app/original-camera.json' with {type:'json'};
let input='';for await(const chunk of process.stdin)input+=chunk;
for(const c of JSON.parse(input)){
 const cycle=shamanNativeDirections(c.team,c.base)[c.direction];
 const draws=spriteLayers(units.frames[cycle.frames[c.step]].layers,units.pieces,
  {flags:2|Number(cycle.flip)},camera.views[0]);
 assert.deepEqual(draws,c.draws,JSON.stringify({team:c.team,action:c.action,direction:c.direction,step:c.step}));
}
"""
result = subprocess.run(['node', '--input-type=module', '-e', script], input=json.dumps(cases),
                        cwd=ROOT, capture_output=True, text=True, timeout=30)
assert result.returncode == 0, result.stderr
report = {
    'status': 'PASS_FOUR_TRIBE_ORIGINAL_SHAMAN_SUBMISSIONS', 'cases': len(cases),
    'tribes': 4, 'directions': 8, 'actions': list(actions),
    'exeSha256': hashlib.sha256(args.exe.read_bytes()).hexdigest(),
    'scriptSha256': hashlib.sha256(Path(__file__).read_bytes()).hexdigest(),
    'helperSha256': hashlib.sha256((ROOT / 'app/shaman-appearance.ts').read_bytes()).hexdigest(),
    'atlasSha256': hashlib.sha256((ROOT / 'public/original/unit-layers.png').read_bytes()).hexdigest(),
    'nativeCases': cases,
    'limits': 'Original00450e60 direction/tribe/layer path; same supplied palette/coordinates/final raster consumers as reviewed HUD oracle. World integration and performance require separate live checks.',
}
with args.output.open('x') as output:
    json.dump(report, output, indent=2)
    output.write('\n')
print(f'PASS: {len(cases)} original four-tribe Shaman layer submissions; no fixture writes')
