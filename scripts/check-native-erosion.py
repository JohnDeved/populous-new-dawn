"""Compare complete Erosion terrain controllers with the original executable."""
import hashlib, json, random, struct, subprocess, sys
from pathlib import Path
from unicorn import UC_HOOK_CODE
from unicorn.x86_const import UC_X86_REG_EIP, UC_X86_REG_ESP
from decomp import ROOT, native_cpu

cpu, identity = native_cpu(Path(sys.argv[1]))
cpu.mem_map(0x2000000, 0x10000)
p, scratch, stack, stop = 0x2000000, 0x2001000, 0x200e000, 0x200ff00
cpu.mem_write(0x59df0c, struct.pack('<I', scratch))
write = lambda a, f, *v: cpu.mem_write(a, struct.pack('<' + f, *v))
read = lambda a, f: struct.unpack('<' + f, cpu.mem_read(a, struct.calcsize('<' + f)))[0]
digest = lambda v: hashlib.sha256(json.dumps(v, separators=(',', ':')).encode()).hexdigest()

def hook(c, address, size, user):
    global alive
    sp = c.reg_read(UC_X86_REG_ESP)
    if address == 0x48a050:
        assert read(sp + 4, 'I') == p
        sounds.append([read(sp + 8, 'I'), read(sp + 12, 'I')])
    elif address == 0x44ddf0:
        assert [read(sp + 8, 'I'), read(sp + 12, 'I')] == [6, 1]
        changed.append(read(sp + 4, 'H'))
    elif address == 0x44f2f0:
        assert [read(sp + 4, 'I'), read(sp + 12, 'I'), read(sp + 16, 'I')] == [1, 6, 0xffffffff]
        assert read(sp + 8, 'H') == changed[-1]
    elif address == 0x4edcf0:
        assert read(sp + 4, 'I') == p
        alive = False
    c.reg_write(UC_X86_REG_EIP, read(sp, 'I'))
    c.reg_write(UC_X86_REG_ESP, sp + 4)

for address in [0x48a050, 0x44ddf0, 0x44f2f0, 0x4edcf0]:
    cpu.hook_add(UC_HOOK_CODE, hook, begin=address, end=address)

rng = random.Random(0x50ff30)
heights = [rng.randrange(1025) if i % 17 else 0 for i in range(16384)]
terrain = bytearray(0x40000)
for i, height in enumerate(heights): struct.pack_into('<h', terrain, i * 16 + 4, height)
cases, expected = [], []
for n in range(16):
    center = {'x': rng.randrange(65536), 'y': rng.randrange(65536), 'h': rng.randrange(1025)}
    seed = rng.randrange(0x100000000)
    cpu.mem_write(0x8a03e4, bytes(terrain)); cpu.mem_write(p, bytes(256))
    write(p + 0x3d, 'HHh', center['x'], center['y'], center['h'])
    write(p + 0x6c, 'h', 64); write(0x89d178, 'I', seed)
    timeline, alive = [], True
    while alive:
        sounds, changed = [], []
        write(stack, 'II', stop, p); cpu.reg_write(UC_X86_REG_ESP, stack)
        cpu.emu_start(0x50ff30, stop, count=3000000)
        assert cpu.reg_read(UC_X86_REG_EIP) == stop, hex(cpu.reg_read(UC_X86_REG_EIP))
        raw = cpu.mem_read(0x8a03e4, 0x40000)
        values = [struct.unpack_from('<h', raw, i * 16 + 4)[0] for i in range(16384)]
        timeline.append({
            'remaining': read(p + 0x6c, 'h'), 'alive': alive,
            'randomState': read(0x89d178, 'I'), 'heights': digest(values),
            'sounds': sounds, 'changed': changed,
        })
    cases.append({'center': center, 'seed': seed}); expected.append(timeline)

js = """import{createHash}from'node:crypto';import{stepErosion}from'./app/erosion.ts';let s='';for await(const c of process.stdin)s+=c;const d=JSON.parse(s),hash=v=>createHash('sha256').update(JSON.stringify(v)).digest('hex');console.log(JSON.stringify(d.cases.map(c=>{const land={heights:Int16Array.from(d.heights)},e={center:c.center,remaining:64},game={randomState:c.seed},out=[];let alive=true;while(alive){const sounds=[],changed=[];alive=stepErosion(land,e,game,{sound:()=>sounds.push([169,2]),terrain:c=>changed.push(c)});out.push({remaining:e.remaining,alive,randomState:game.randomState,heights:hash(Array.from(land.heights)),sounds,changed});}return out})));"""
actual = json.loads(subprocess.check_output(
    ['node', '--experimental-strip-types', '--input-type=module', '-e', js],
    input=json.dumps({'heights': heights, 'cases': cases}).encode(), cwd=ROOT,
))
if actual != expected:
    case = next(i for i, (a, e) in enumerate(zip(actual, expected)) if a != e)
    turn = next(i for i, (a, e) in enumerate(zip(actual[case], expected[case])) if a != e)
    raise AssertionError((case, turn, actual[case][turn], expected[case][turn]))
print(f'PASS: {len(cases)} complete native Erosion lifetimes, all terrain heights, RNG, sound, controller state and notifications ({identity["sha256"]})')
