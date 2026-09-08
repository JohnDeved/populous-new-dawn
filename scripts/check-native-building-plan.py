"""Compare plan footprint/entrance cells and the native rotation command.
Usage: python scripts/check-native-building-plan.py EXE
0x4b9190 runs its preview traversal with validity queries supplied as successful.
This checks geometry, not the unported building-placement validity rules.
"""
import json
import random
import struct
import subprocess
import sys
from pathlib import Path
from unicorn import UC_HOOK_CODE
from unicorn.x86_const import UC_X86_REG_EAX, UC_X86_REG_EIP, UC_X86_REG_ESP
from decomp import ROOT, native_cpu, load_native_shapes, configure_native_constants

exe = Path(sys.argv[1])
cpu, _ = native_cpu(exe)
configure_native_constants(cpu, exe)
cpu.mem_map(0x2000000, 0x30000)
load_native_shapes(cpu, exe, 0x2000000, 0x2004000)
stack, stop = 0x2020000, 0x2021000

def write(address, fmt, *values):
    cpu.mem_write(address, struct.pack('<' + fmt, *values))

def read(address, fmt):
    return struct.unpack('<' + fmt, cpu.mem_read(address, struct.calcsize('<' + fmt)))[0]

def call(address, *args):
    write(stack, 'I' * (len(args) + 1), stop, *args)
    cpu.reg_write(UC_X86_REG_ESP, stack)
    cpu.emu_start(address, stop, count=100000)
    assert cpu.reg_read(UC_X86_REG_EIP) == stop

sounds = []
answers = {0x44fa50: 0, 0x44eca0: 1, 0x44ee50: 1, 0x41b4c0: 1, 0x518200: 0, 0x48a050: 0}

def hook(c, address, size, user):
    sp = c.reg_read(UC_X86_REG_ESP)
    if address == 0x48a050:
        sounds.append(list(struct.unpack('<3I', c.mem_read(sp + 4, 12))))
    c.reg_write(UC_X86_REG_EAX, answers[address])
    c.reg_write(UC_X86_REG_EIP, read(sp, 'I'))
    c.reg_write(UC_X86_REG_ESP, sp + 4)

for address in answers:
    cpu.hook_add(UC_HOOK_CODE, hook, begin=address, end=address)

rng = random.Random(0x4b9190)
objects = json.loads((ROOT / 'app/original-shapes.json').read_text())['objects']
cases, expected = [], []
for obj in range(len(objects)):
    for direction in range(4):
        pose = dict(object=obj, angle=direction*512,
                    anchorX=rng.randrange(128)*512, anchorY=rng.randrange(128)*512)
        cpu.mem_write(0x8a03e4, bytes(16384*16))
        write(0x5a7228 + 76, 'H', obj)
        cell = (pose['anchorX'] >> 8) | (pose['anchorY'] & 0xff00)
        call(0x4b9190, cell, 1, direction, 0, 0)
        flags = struct.unpack('<65536I', cpu.mem_read(0x8a03e4, 16384*16))[::4]
        footprint = [i for i, f in enumerate(flags) if f & 0x80]
        entrance = [i for i, f in enumerate(flags) if f & 0x800]
        assert len(entrance) <= 1
        cases.append(pose)
        expected.append(dict(cells=footprint, entrance=entrance[0] if entrance else None))

directions = dict(hut=0, tower=0, temple=0, camp=0)
models = dict(hut=1, tower=4, temple=5, camp=7)
rotations, native_rotations = [], []
for _ in range(64):
    kind = rng.choice(list(models))
    index = models[kind] - 1
    write(0x895de0, 'B', index)
    sounds.clear()
    call(0x4aab80, 0x7b)
    assert sounds == [[0, 0x26, 1]]
    rotations.append(kind)
    native_rotations.append({k: read(0x5a885a+(m-1)*18, 'B') for k, m in models.items()})

js = """
import {buildingPlanCells} from './app/building-shapes.ts';
import {rotateBuildingPlan} from './app/model.ts';
let input='';for await(const c of process.stdin)input+=c;
const {cases,rotations}=JSON.parse(input);
const w={mode:null,buildingDirections:{hut:0,tower:0,temple:0,camp:0},inputMask:0,status:'playing'};
console.log(JSON.stringify({
 geometry:cases.map(p=>{const r=buildingPlanCells(p);r.cells.sort((a,b)=>a-b);return r;}),
 rotations:rotations.map(kind=>{w.mode=kind;rotateBuildingPlan(w);return {...w.buildingDirections};})
}));
"""
actual = json.loads(subprocess.check_output(['node', '--input-type=module', '-e', js],
    input=json.dumps(dict(cases=cases, rotations=rotations)).encode(), cwd=ROOT))
for i, (browser, native) in enumerate(zip(actual['geometry'], expected)):
    assert browser == native, (cases[i], browser, native)
assert actual['rotations'] == native_rotations, next((i, rotations[i], a, b) for i, (a, b) in enumerate(zip(actual['rotations'], native_rotations)) if a != b)
print(f'PASS: {len(cases)} native plan footprint/entrance cases and 64 complete rotation commands/cues')
