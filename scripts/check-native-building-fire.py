"""Compare native building ignition/socket placement and burn-phase dispatch.
Usage: python scripts/check-native-building-fire.py EXE
Executes 0x408cb0 -> 0x408840 and 0x408ab0. Allocation, people, sound,
plan ownership and lifecycle callbacks are intercepted. Fire lifecycle and
structural work arithmetic have separate native comparison checks.
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
cpu.mem_map(0x2000000, 0x40000)
load_native_shapes(cpu, exe, 0x2000000, 0x2004000)
building, fire, context, people, stack, stop = 0x2010000, 0x2011000, 0x2012000, 0x2013000, 0x203d000, 0x203e000

def write(a, fmt, *values):
    cpu.mem_write(a, struct.pack('<' + fmt, *values))

def read(a, fmt):
    return struct.unpack('<' + fmt, cpu.mem_read(a, struct.calcsize('<' + fmt)))[0]

def call(a, *args):
    write(stack, 'I' * (len(args) + 1), stop, *[v & 0xffffffff for v in args])
    cpu.reg_write(UC_X86_REG_ESP, stack)
    cpu.emu_start(a, stop, count=100000)
    assert cpu.reg_read(UC_X86_REG_EIP) == stop

rng = random.Random(0x408840)
land = dict(heights=[], flags=[])
for i in range(16384):
    h, flags = rng.randrange(1024), rng.randrange(2)
    land['heights'].append(h)
    land['flags'].append(flags)
    write(0x8a03e4 + i * 16, 'Ih', flags, h)

events, allocations, mode, fail = [], [], 'ignite', False

def hook(c, address, size, user):
    sp = c.reg_read(UC_X86_REG_ESP)
    p = read(sp + 4, 'I')
    if address == 0x4ed640 and mode == 'ignite':
        c.reg_write(UC_X86_REG_EIP, 0x408840)
        return
    result = 0
    if address == 0x4ed8a0:
        kind, model, tribe, position = struct.unpack('<4I', c.mem_read(sp + 4, 16))
        assert (kind, model) == (5, 10)
        record = read(0x892443, 'I') - 20
        light, snap, scale, smoke, unused = struct.unpack('<5i', c.mem_read(record, 20))
        assert (snap, smoke, unused) == (0, 1, 0)
        x, y, h = struct.unpack('<hhh', c.mem_read(position, 6))
        allocations.append(dict(x=x, y=y, h=h, size=scale, light=bool(light)))
        if not fail:
            result = fire + (len(allocations) - 1) * 256
            c.mem_write(result, bytes(256))
    elif address == 0x407490:
        if 'eject' not in events: events.append('eject')
    elif address == 0x48a050:
        assert read(sp + 8, 'I') == 0x53
        events.append('sound')
    elif address == 0x48a770:
        assert p == 0x53
    elif address == 0x498140:
        events.append('damage')
    elif address == 0x4ed640 and read(p + 0x2a, 'B') == 2:
        events.append('finish')
    c.reg_write(UC_X86_REG_EAX, result)
    c.reg_write(UC_X86_REG_EIP, read(sp, 'I'))
    c.reg_write(UC_X86_REG_ESP, sp + 4)

for address in [0x4ed640, 0x4ed6f0, 0x4ed8a0, 0x407490, 0x48a050, 0x48a770, 0x498140]:
    cpu.hook_add(UC_HOOK_CODE, hook, begin=address, end=address)

def state():
    return dict(state=read(building + 0x2c, 'B'), attacker=read(building + 0xaf, 'B'),
                buildingFlags=read(building + 0x9c, 'H'), remaining=read(building + 0xa7, 'b'),
                soundPlaying=bool(read(building + 0x10, 'I') & 16))

cases, expected = [], []
objects = json.loads((ROOT / 'app/original-shapes.json').read_text())['objects']
for obj in range(len(objects)):
    for quadrant in range(4):
        cpu.mem_write(building, bytes(256))
        pose = dict(object=obj, angle=quadrant * 512, anchorX=rng.randrange(128)*512, anchorY=rng.randrange(128)*512)
        b = dict(model=rng.randrange(1, 20), state=rng.choice([1, 2, 2, 4]), flags2=rng.choice([0, 0, 0x100000]),
                 attacker=rng.randrange(256), buildingFlags=rng.randrange(65536))
        attacker = rng.choice([0, 1, 255])
        write(building + 0x2a, 'BBB', 2, b['model'], b['state'])
        write(building + 0xc, 'I', b['flags2'])
        write(building + 0x33, 'H', obj)
        write(building + 0x26, 'h', pose['angle'])
        write(building + 0x7a, 'HH', pose['anchorX'], pose['anchorY'])
        write(building + 0xaf, 'B', b['attacker'])
        write(building + 0x9c, 'H', b['buildingFlags'])
        write(0x892443, 'I', context)
        fail = bool(obj % 5 == 0)
        events, allocations = [], []
        call(0x408cb0, building, attacker)
        for i in range(len(allocations)):
            if not fail:
                assert read(fire+i*256+0x90, 'B') == 5
                assert read(fire+i*256+0x7c, 'h') == 135
        cases.append(dict(b=b, pose=pose, attacker=attacker, fail=fail))
        expected.append(dict(**state(), allocations=allocations))

mode = 'step'
steps, step_expected = [], []
for i in range(512):
    cpu.mem_write(building, bytes(256))
    remaining = rng.choice([-128, -1, 0, 1, 2, 79, 80, 81, 119, 120, 121, 127])
    b = dict(state=4, flags2=rng.choice([0, 0x100000]), occupants=rng.randrange(7))
    burn = dict(remaining=remaining, soundPlaying=bool(i & 1))
    write(building + 0x2a, 'BBB', 2, 1, 4)
    write(building + 0xc, 'I', b['flags2'])
    write(building + 0x10, 'I', 16 if burn['soundPlaying'] else 0)
    write(building + 0xa6, 'Bb', b['occupants'], remaining)
    for j in range(b['occupants']):
        p = people + j*256
        cpu.mem_write(p, bytes(256))
        write(p + 0x2a, 'BBB', 1, 2, 0)
        write(0x890390 + (j+1)*4, 'I', p)
        write(building + 0x86 + j*2, 'H', j+1)
    events = []
    call(0x408ab0, building)
    steps.append(dict(b=b, burn=burn))
    step_expected.append(dict(state=read(building+0x2c,'B'), remaining=read(building+0xa7,'b'), events=events))

js = """
import {igniteBuilding,stepBuildingBurn} from './app/building-damage.ts';
import {buildingFirePoints} from './app/building-shapes.ts';
import {terrainPointHeight} from './app/native-terrain.ts';
let input='';for await(const chunk of process.stdin)input+=chunk;
const {cases,steps,land}=JSON.parse(input);
const ignite=cases.map(c=>{let remaining=0,soundPlaying=false;const allocations=[];
 igniteBuilding(c.b,c.attacker,()=>{remaining=127;for(const p of buildingFirePoints(c.pose)){
  allocations.push({...p,h:terrainPointHeight(land,p)});if(!c.fail)soundPlaying=true;
 }});return {state:c.b.state,attacker:c.b.attacker,buildingFlags:c.b.buildingFlags,remaining,soundPlaying,allocations};});
const step=steps.map(c=>{const events=[];stepBuildingBurn(c.b,c.burn,Object.fromEntries(
 ['eject','sound','damage','finish'].map(event=>[event,()=>events.push(event)])));
 return {state:c.b.state,remaining:c.burn.remaining,events};});
console.log(JSON.stringify({ignite,step}));
"""
result = json.loads(subprocess.check_output(['node', '--input-type=module', '-e', js],
    input=json.dumps(dict(cases=cases, steps=steps, land=land)).encode(), cwd=ROOT))
for kind, inputs, wanted in [('ignite', cases, expected), ('step', steps, step_expected)]:
    for i, (actual, native) in enumerate(zip(result[kind], wanted)):
        if actual != native:
            path = Path('/private/tmp/populous-building-fire-failure.json')
            path.write_text(json.dumps(dict(kind=kind, case=inputs[i], native=native, browser=actual), indent=2))
            raise AssertionError(str(path))
print(f'PASS: {len(cases)} native building ignition/socket cases and 512 burn-phase dispatch cases')
