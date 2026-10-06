#!/usr/bin/env python3
"""Two Mission 2 native authored bridge visits and matching port component visits.

Reuses the reviewed native authored probe setup verbatim. Its supplied completion,
allocation storage, callbacks, sound, deletion and notification boundaries remain.
In particular model-3 trail initialization is intercepted, so its cosmetic RNG
consumption is outside this composed probe. No original OS game or browser runs.
"""
import hashlib
import importlib.metadata
import json
import struct
import subprocess
import sys
from pathlib import Path

PROOF = Path(__file__).resolve().parent
REPO = PROOF.parents[2]
EXPECTED_HEAD = 'b28b031f6917f6d814536ba10a7d46e7be71de05'
assert subprocess.check_output(['git', 'rev-parse', 'HEAD'], cwd=REPO, text=True).strip() == EXPECTED_HEAD
assert not subprocess.check_output(['git', 'diff', 'HEAD', '--binary'], cwd=REPO)
sys.path.insert(0, str(REPO / 'scripts'))
original = (REPO / 'scripts/check-native-authored-bridges.py').read_text()
bootstrap = original.split('cases, inventory = [], {}\n')[0]
marker = '    sp = cpu.reg_read(UC_X86_REG_ESP)\n    if address == 0x4ED8A0:'
assert bootstrap.count(marker) == 1
bootstrap = bootstrap.replace(marker, '    sp = cpu.reg_read(UC_X86_REG_ESP)\n    record_event(address, sp)\n    if address == 0x4ED8A0:')
events = []


def record_event(address, sp):
    event = {'address': hex(address), 'args': list(struct.unpack('<5I', cpu.mem_read(sp + 4, 20)))}
    if address == 0x4ED8A0:
        event['point'] = list(struct.unpack('<HHh', cpu.mem_read(event['args'][3], 6)))
    events.append(event)


exec(compile(bootstrap, str(REPO / 'scripts/check-native-authored-bridges.py'), 'exec'), globals())
from unicorn import UC_HOOK_MEM_WRITE

executed, rng_writes, visits = [], [], []


def capture_instruction(_cpu, address, size, _user):
    if 0x400000 <= address < 0x590000 and address not in intercepted:
        executed.append({'address': f'{address:08x}', 'bytes': bytes(cpu.mem_read(address, size)).hex()})
    if address == 0x50EE00:
        visits.append({'instructionIndex': len(executed), 'turnBefore': read(CLONE + 0x6C, 'h')})


def capture_rng(_cpu, _access, address, size, value, _user):
    rng_writes.append({'address': hex(address), 'size': size, 'value': value})


cpu.hook_add(UC_HOOK_CODE, capture_instruction)
for address in (0x89D178, 0x89BC72):
    cpu.hook_add(UC_HOOK_MEM_WRITE, capture_rng, begin=address, end=address + 3)


def digest(value):
    return hashlib.sha256(json.dumps(value, separators=(',', ':')).encode()).hexdigest()


def heights():
    raw = cpu.mem_read(0x8A03E4, 0x40000)
    return [struct.unpack_from('<h', raw, index * 16 + 4)[0] for index in range(16384)]


def state(pointer):
    return {'turn': read(pointer + 0x6C, 'h'),
            'alongY': bool(read(pointer + 0x86, 'i')),
            'startCell': read(pointer + 0x8A, 'H'), 'endCell': read(pointer + 0x8C, 'H'),
            'direction': read(pointer + 0x7A, 'i'), 'crossStep': read(pointer + 0x82, 'i'),
            'heightStep': read(pointer + 0x7E, 'i'), 'raiseWater': bool(read(pointer + 0x8E, 'B'))}


def snapshot(label, events_start, prior):
    current = heights()
    captured = events[events_start:]
    return {'label': label, 'state': state(CLONE),
            'start': point(CLONE, 0x3D), 'target': point(CLONE, 0x57),
            'gameplayRng': read(0x89D178), 'cosmeticRng': read(0x89BC72),
            'heightsSha256': digest(current),
            'heightDeltas': [[i, before, after] for i, (before, after) in enumerate(zip(prior, current)) if before != after],
            'trails': [event['point'] for event in captured if event['address'] == '0x4ed8a0' and event['args'][1] & 255 == 3],
            'changed': [event['args'][0] & 65535 for event in captured if event['address'] == '0x44ddf0'],
            'notifications': [event['args'][:4] for event in captured if event['address'] == '0x44f2f0'],
            'events': captured,
            'cloneBytes': bytes(cpu.mem_read(CLONE, 256)).hex()}


mission = 2
level_path = args.exe.parent / 'levels/levl2002.dat'
level = level_path.read_bytes()
cpu.mem_write(0x890390, bytes(0x4000))
terrain = bytearray(0x40000)
initial = list(struct.unpack('<16384h', level[:32768]))
for index, height in enumerate(initial):
    struct.pack_into('<Ih', terrain, index * 16, 0, height)
cpu.mem_write(0x8A03E4, bytes(terrain))
install(level, 59, HEAD)
install(level, 60, SOURCE)
assert list(struct.unpack('<10H', cpu.mem_read(HEAD + 0x72, 20))) == [61] + [0] * 9
source_state = state(SOURCE)
write(HEAD + 0x2E, 'B', 1)
write(HEAD + 0x6D, 'B', read(HEAD + 0x6D, 'B') | 2)
write(0x89D178, 'I', 0x12345678)
write(0x89BC72, 'I', 0x87654321)
events.clear()
executed.clear()
rng_writes.clear()
trace.clear()
invoke(0x4FB270, HEAD)
first = snapshot('native authored activation return', 0, initial)
assert len(allocations) == 1
assert first['state']['turn'] == 1 and read(CLONE + 0x2C, 'B') == 25
assert first['heightDeltas'] == first['trails'] == first['changed'] == first['notifications'] == []
first_heights = heights()
boundary = len(events)
instruction_boundary = len(executed)
invoke(0x4ED700, CLONE)
second = snapshot('next explicit native dispatcher visit', boundary, first_heights)
assert second['state']['turn'] == 2
assert len(visits) == 2 and visits[0]['turnBefore'] == 0 and visits[1]['turnBefore'] == 1
assert rng_writes == [], rng_writes

js = """
import { createHash } from 'node:crypto';
import { createLandBridge, stepLandBridge } from './app/land-bridge.ts';
let data = ''; for await (const chunk of process.stdin) data += chunk;
const d = JSON.parse(data), land = { heights: Int16Array.from(d.heights), flags: new Uint32Array(16384) };
const bridge = createLandBridge(d.start, d.target);
const hash = value => createHash('sha256').update(JSON.stringify(value)).digest('hex');
const state = () => { const { start, target, ...result } = bridge; return structuredClone(result); };
const created = { state: state(), heightsSha256: hash(Array.from(land.heights)) }, timeline = [];
for (let visit = 1; visit <= 2; visit++) {
  const before = Array.from(land.heights), trails = [], changed = [];
  const alive = stepLandBridge(land, bridge, p => trails.push([p.x, p.y, p.h]), cell => changed.push(cell));
  const current = Array.from(land.heights);
  timeline.push({ state: state(), alive, heightsSha256: hash(current), trails, changed,
    heightDeltas: current.flatMap((h, i) => h === before[i] ? [] : [[i, before[i], h]]) });
}
console.log(JSON.stringify({ created, timeline }));
"""
port = json.loads(subprocess.check_output(['node', '--input-type=module', '-e', js],
    input=json.dumps({'heights': initial, 'start': first['start'], 'target': first['target']}).encode(), cwd=REPO))
for native, result in zip((first, second), port['timeline']):
    for key in ('state', 'heightsSha256', 'trails', 'changed', 'heightDeltas'):
        assert native[key] == result[key], (key, native[key], result[key])
assert port['created']['state']['turn'] == 0
assert first['heightsSha256'] == port['created']['heightsSha256']

inputs = [Path(__file__), REPO / 'scripts/check-native-authored-bridges.py', REPO / 'scripts/check-native-land-bridge.py',
          REPO / 'scripts/decomp.py', REPO / 'decomp/tools.json', REPO / 'app/land-bridge.ts',
          REPO / 'app/native-terrain.ts', REPO / 'app/original-constants.json',
          REPO / 'app/native-math.ts', REPO / 'app/original-rules.json',
          REPO / 'app/world-turn.ts', REPO / 'app/world-effects.ts', REPO / 'app/spell-trails.ts',
          REPO / 'tests/authored-bridges.test.mjs', args.exe, level_path, args.exe.parent / 'levels/constant.dat']
report = {'sourceHead': EXPECTED_HEAD, 'identity': identity, 'unicorn': importlib.metadata.version('unicorn'),
          'node': subprocess.check_output(['node', '--version'], text=True).strip(),
          'inputSha256': {str(p): hashlib.sha256(p.read_bytes()).hexdigest() for p in inputs},
          'sourceStateBeforeClone': source_state, 'seeds': {'gameplay': 0x12345678, 'cosmetic': 0x87654321},
          'initialHeightsSha256': digest(initial), 'native': [first, second], 'port': port,
          'rngWrites': rng_writes, 'controllerVisits': visits, 'nextVisitInstructionIndex': instruction_boundary,
          'nativeTrace': trace, 'intercepted': [hex(a) for a in intercepted],
          'supplied': ['authored raw heights, zero flags', 'forced completion bit and head visit byte 1',
                       'object storage/identity and world registration', 'deterministic gameplay/cosmetic seeds'],
          'excluded': ['native model-3 trail initialization and its cosmetic RNG',
                       'terrain queue processing and notification consumers',
                       'mixed-class scheduling, absolute world clock, original OS game, browser, rendering, audio'],
          'limits': __doc__}
(PROOF / 'observations.json').write_text(json.dumps(report, indent=2) + '\n')
(PROOF / 'executed-instructions.json').write_text(json.dumps(executed, indent=2) + '\n')
assert subprocess.check_output(['git', 'rev-parse', 'HEAD'], cwd=REPO, text=True).strip() == EXPECTED_HEAD
assert not subprocess.check_output(['git', 'diff', 'HEAD', '--binary'], cwd=REPO)
print(json.dumps({'status': 'passed', 'firstState': first['state'], 'nextState': second['state'],
                  'firstTerrainDeltas': len(first['heightDeltas']), 'nextTerrainDeltas': len(second['heightDeltas']),
                  'nextTrails': len(second['trails']), 'nextChanged': len(second['changed']),
                  'rngWrites': len(rng_writes), 'executedInstructions': len(executed)}))
