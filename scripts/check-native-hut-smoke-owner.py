"""Compare one real secondary traversal with the runtime smoke owner.

Usage: python -B scripts/check-native-hut-smoke-owner.py EXE [RUNTIME_ROOT]
A legacy checkout lacking the shared owner is a deliberate failure-first target.
The native loop/processor/allocator/smoke initializer execute original bytes;
class bookkeeping, animation, position registration and final removal are supplied.
"""
import json
import struct
import subprocess
import sys
from pathlib import Path

from decomp import ROOT as REPO, native_cpu
from unicorn import UC_HOOK_CODE
from unicorn.x86_const import UC_X86_REG_EAX, UC_X86_REG_EIP, UC_X86_REG_ESP

exe = Path(sys.argv[1])
runtime_root = Path(sys.argv[2]).resolve() if len(sys.argv) > 2 else REPO
cpu, identity = native_cpu(exe)
cpu.mem_map(0x2000000, 0x10000)
ROOT, CHILD, STACK = 0x2000000, 0x2000100, 0x200d000
PHASE, RANDOM, COUNT = 0x96eac8, 0x89bc72, 0x89c655


def write(address, fmt, *values):
    cpu.mem_write(address, struct.pack('<' + fmt, *values))


def read(address, fmt):
    return struct.unpack('<' + fmt, cpu.mem_read(address, struct.calcsize('<' + fmt)))[0]


def intercept(_, address, size, user):
    sp = cpu.reg_read(UC_X86_REG_ESP)
    if address in (0x4ed580, 0x4ed700):
        cpu.reg_write(UC_X86_REG_EIP, 0x50c150 if address == 0x4ed580 else 0x50c260)
        return
    if address == 0x4ee580:
        cpu.mem_write(read(sp + 4, 'I') + 0x3d, bytes(cpu.mem_read(read(sp + 8, 'I'), 6)))
    cpu.reg_write(UC_X86_REG_EIP, read(sp, 'I'))
    cpu.reg_write(UC_X86_REG_ESP, sp + 4)


for address in (0x4ed580, 0x4ed700, 0x4ed6f0, 0x4ed640, 0x4ee700, 0x4ee580, 0x4ef180):
    cpu.hook_add(UC_HOOK_CODE, intercept, begin=address, end=address)


def seed_for(output):
    rotated = ((output << 13) | (output >> 19)) & 0xffffffff
    return ((rotated - 0x24df) * pow(0x24a1, -1, 1 << 32)) & 0xffffffff


cases = [{'phase': 7, 'seed': seed_for(0x12345600), 'reserved': 0, 'empty': False}]
cases += [{'phase': phase, 'seed': seed_for(0x12345600 | low), 'reserved': 0, 'empty': False}
          for phase in range(256) for low in range(32)]
cases += [{'phase': 7, 'seed': seed_for(0x12345600), 'reserved': reserved, 'empty': empty}
          for reserved in (138, 139, 140, 150, 159) for empty in (False, True)]
expected = []
for case in cases:
    cpu.mem_write(ROOT, bytes(512))
    write(PHASE, 'B', 37)
    write(RANDOM, 'I', case['seed'])
    write(COUNT, 'I', 1 + case['reserved'])
    write(0x89d178, 'I', 0xaabbccdd)
    write(0x89243a, 'B', 0)
    write(0x89ce37, 'B', 0)
    write(0x89032c, 'I', 0 if case['empty'] else CHILD)
    write(0x890330, 'I', ROOT)
    write(ROOT + 0x24, 'H', 1840)
    write(ROOT + 0x2a, 'BBBBBB', 7, 74, 61, 0, case['phase'], 0)
    write(ROOT + 0x3d, 'HHh', 8192, 12288, 400)
    write(ROOT + 0x6c, 'h', -1)
    write(CHILD + 0x24, 'H', 1841)
    cpu.reg_write(UC_X86_REG_ESP, STACK)
    cpu.emu_start(0x4ec924, 0x4ec942, count=10000)
    assert cpu.reg_read(UC_X86_REG_EIP) == 0x4ec942
    child = None
    if read(0x890330, 'I') == CHILD:
        child = {'counter': read(CHILD + 0x2e, 'B'), 'lifetime': read(CHILD + 0x6c, 'h'),
                 'position': dict(zip(('x', 'y', 'h'), struct.unpack('<HHh', cpu.mem_read(CHILD + 0x3d, 6))))}
    expected.append({'child': child, 'cosmetic': read(RANDOM, 'I'), 'phase': read(PHASE, 'B'),
                     'gameplay': read(0x89d178, 'I')})

js = r'''
import fs from 'node:fs';
import {pathToFileURL} from 'node:url';
const root = process.argv[1], cases = JSON.parse(fs.readFileSync(0, 'utf8'));
const module = name => import(pathToFileURL(`${root}/app/${name}.ts`));
const {createHutOccupancySmoke, stepHutOccupancySmoke} = await module('hut-occupancy-smoke');
const {random} = await module('native-math');
const shared = fs.existsSync(`${root}/app/hut-smoke-runtime.ts`);
const runtime = shared ? await module('hut-smoke-runtime') : null;
const pool = shared ? await module('secondary-effects') : null;
const results = cases.map(c => {
  const cosmetic = {randomState: c.seed};
  if (!shared) {
    const state = createHutOccupancySmoke(31, 3, 3, 0);
    stepHutOccupancySmoke(state, 32, 3, 3, 0, () => random(cosmetic));
    return {child: null, cosmetic: cosmetic.randomState, phase: 37, gameplay: 0xaabbccdd};
  }
  const owner = pool.createSecondaryEffects(), building = {
    id: 4, kind: 'hut', team: 'blue', progress: 1, hp: 100, counter: 1, level: 1,
  };
  owner.reservations = Array.from({length:c.reserved}, (_,i)=>`panel:${i}`);
  const slot = pool.allocateSecondaryEffect(owner, {
    kind:'hutRoot', building:4, counter:c.phase, position:{x:8192,y:12288,h:400},
  });
  owner.roots[4] = {slot, state:createHutOccupancySmoke(1,3,3,0)};
  if (c.empty) owner.free = [];
  const w = {turn:1, secondaryEffects:owner, effectCounter:37, cosmeticRandom:cosmetic,
    randomState:0xaabbccdd, buildings:[building], units:[], effects:[]};
  runtime.stepSecondaryEffects(w);
  const child = owner.slots.find(e=>e?.kind==='hutPuff');
  return {child:child ? {counter:child.counter,lifetime:child.lifetime,position:child.position}:null,
    cosmetic:cosmetic.randomState,phase:w.effectCounter,gameplay:w.randomState};
});
console.log(JSON.stringify(results));
'''
actual = json.loads(subprocess.check_output(['node', '--input-type=module', '-e', js, str(runtime_root)],
                                           input=json.dumps(cases).encode(), cwd=REPO))
assert len(actual) == len(expected)
for index, (live, native) in enumerate(zip(actual, expected)):
    if live != native:
        print(json.dumps({'status': 'failed', 'case': cases[index], 'native': native, 'runtime': live,
                          'runtimeRoot': str(runtime_root), 'executableSha256': identity['sha256']}, indent=2))
        raise AssertionError(f'Native/runtime secondary traversal mismatch at case {index}')
print(json.dumps({'status': 'passed', 'cases': len(cases), 'executableSha256': identity['sha256'],
                  'limits': 'Supplied root counter, primary seed, RNG and reservation count; intercepted class/list/animation/position/removal leaves. No complete allocation-stream, UI, browser or full-game equivalence.'}, indent=2))
