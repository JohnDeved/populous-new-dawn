"""Compare complete Flatten terrain controllers with the original executable."""
import hashlib, json, random, struct, subprocess, sys
from pathlib import Path
from unicorn import UC_HOOK_CODE
from unicorn.x86_const import UC_X86_REG_EAX, UC_X86_REG_EIP, UC_X86_REG_ESP
from decomp import ROOT, native_cpu

cpu, identity = native_cpu(Path(sys.argv[1]))
search = (Path(sys.argv[1]).parent / 'data/mwsearch.dat').read_bytes()
assert hashlib.sha256(search).hexdigest() == '0c39b12d160658863c2df89aa34484dff459e48ea0b5634658b7473ca940fae0'
cpu.mem_write(0x8929cd, search)
cpu.mem_map(0x2000000, 0x10000)
p, stack, stop = 0x2000000, 0x200e000, 0x200ff00
write = lambda a, f, *v: cpu.mem_write(a, struct.pack('<' + f, *v))
read = lambda a, f: struct.unpack('<' + f, cpu.mem_read(a, struct.calcsize('<' + f)))[0]
digest = lambda v: hashlib.sha256(json.dumps(v, separators=(',', ':')).encode()).hexdigest()
alive, changed, allocations = True, [], []

def hook(c, address, size, user):
    global alive
    sp = c.reg_read(UC_X86_REG_ESP)
    if address == 0x4ed8a0:
        cls, model, position = read(sp + 4, 'I'), read(sp + 8, 'I'), read(sp + 16, 'I')
        assert [cls, model] in ([7, 0x3c], [7, 0x3d])
        allocations.append([model, read(position, 'H'), read(position + 2, 'H'), read(position + 4, 'h')])
        c.reg_write(UC_X86_REG_EAX, 0)  # Allocation failure must not affect terrain or lifetime.
    elif address == 0x44ddf0:
        assert [read(sp + 8, 'I'), read(sp + 12, 'I')] == [6, 1]
        changed.append(read(sp + 4, 'H'))
    elif address == 0x44f2f0:
        assert [read(sp + 4, 'I'), read(sp + 12, 'I'), read(sp + 16, 'I')] == [1, 6, 0xffffffff]
        assert read(sp + 8, 'H') == changed[-1]
    elif address == 0x4edcf0 and read(sp + 4, 'I') == p:
        alive = False
    c.reg_write(UC_X86_REG_EIP, read(sp, 'I'))
    c.reg_write(UC_X86_REG_ESP, sp + 4)

for address in [0x4ed8a0, 0x44ddf0, 0x44f2f0, 0x4edcf0]:
    cpu.hook_add(UC_HOOK_CODE, hook, begin=address, end=address)

rng = random.Random(0x512700)
heights = [rng.randrange(1025) for _ in range(16384)]
flags = [rng.randrange(2) for _ in range(16384)]
terrain = bytearray(0x40000)
for i, (height, flag) in enumerate(zip(heights, flags)):
    struct.pack_into('<Ih', terrain, i * 16, flag, height)

cases, expected = [], []
for _ in range(64):
    center = {'x': rng.randrange(65536), 'y': rng.randrange(65536), 'h': rng.randrange(1025)}
    target = rng.randrange(1025)
    cpu.mem_write(0x8a03e4, bytes(terrain))
    cpu.mem_write(p, bytes(256))
    write(p + 0x3d, 'HHh', center['x'], center['y'], center['h'])
    write(p + 0x6c, 'h', 15)
    write(p + 0x72, 'hhii', 0, 0, target, 5120)
    timeline = []
    alive = True
    while alive:
        changed, allocations = [], []
        write(stack, 'II', stop, p)
        cpu.reg_write(UC_X86_REG_ESP, stack)
        cpu.emu_start(0x512700, stop, count=1000000)
        assert cpu.reg_read(UC_X86_REG_EIP) == stop, hex(cpu.reg_read(UC_X86_REG_EIP))
        raw = cpu.mem_read(0x8a03e4, 0x40000)
        values = [struct.unpack_from('<h', raw, i * 16 + 4)[0] for i in range(16384)]
        timeline.append({
            'remaining': read(p + 0x6c, 'h'),
            'terrainRadius': read(p + 0x72, 'h'),
            'visualRadius': read(p + 0x74, 'h'),
            'expansionBudget': read(p + 0x7a, 'i'),
            'alive': alive,
            'heights': digest(values),
            'allocations': allocations,
            'changed': changed,
        })
        assert len(timeline) <= 15
    cases.append({'center': center, 'target': target})
    expected.append(timeline)

js = """import {createHash} from 'node:crypto';import {stepFlatten} from './app/flatten.ts';let s='';for await(const c of process.stdin)s+=c;const d=JSON.parse(s),hash=v=>createHash('sha256').update(JSON.stringify(v)).digest('hex');console.log(JSON.stringify(d.cases.map(c=>{const land={heights:Int16Array.from(d.heights),flags:Uint32Array.from(d.flags)},f={center:c.center,targetHeight:c.target,remaining:15,terrainRadius:0,visualRadius:0,expansionBudget:5120,orbits:[]},out=[];let alive=true;while(alive){const changed=[],allocations=[];alive=stepFlatten(land,f,{orbit:p=>{allocations.push([60,p.x,p.y,p.h]);return null},sparkle:()=>{},move:()=>{},remove:()=>{},terrain:cell=>changed.push(cell)});out.push({remaining:f.remaining,terrainRadius:f.terrainRadius,visualRadius:f.visualRadius,expansionBudget:f.expansionBudget,alive,heights:hash(Array.from(land.heights)),allocations,changed});}return out;})));"""
actual = json.loads(subprocess.check_output(
    ['node', '--input-type=module', '-e', js],
    input=json.dumps({'heights': heights, 'flags': flags, 'cases': cases}).encode(),
    cwd=ROOT,
))
if actual != expected:
    case = next(i for i, (a, e) in enumerate(zip(actual, expected)) if a != e)
    turn = next(i for i, (a, e) in enumerate(zip(actual[case], expected[case])) if a != e)
    raise AssertionError((case, turn, actual[case][turn], expected[case][turn]))
print(f'PASS: {len(cases)} complete native Flatten lifetimes, all terrain heights, controller state and notifications ({identity["sha256"]})')
