"""Compare moving-person body/shadow projection inputs with the original queues.
Original queue math executes; projection and shadow-height consumers are supplied.
The modern browser retains fractional native coordinates instead of truncating them.
Usage: python SCRIPT EXE [--record]
"""
import json, random, struct, subprocess, sys
from pathlib import Path
from unicorn import UC_HOOK_CODE
from unicorn.x86_const import UC_X86_REG_ESP, UC_X86_REG_EIP, UC_X86_REG_EAX
from decomp import native_cpu, ROOT

cpu, identity = native_cpu(Path(sys.argv[1]))
cpu.mem_map(0x2000000, 0x100000)
p, camera, pool, stack, stop = 0x2010000, 0x2020000, 0x2030000, 0x20ee000, 0x20ef000
rng = random.Random(0x46f080)
def write(a, fmt, *values): cpu.mem_write(a, struct.pack('<'+fmt, *values))
def read(a, fmt): return struct.unpack('<'+fmt, cpu.mem_read(a, struct.calcsize('<'+fmt)))[0]
def finish():
    sp = cpu.reg_read(UC_X86_REG_ESP)
    cpu.reg_write(UC_X86_REG_EIP, read(sp, 'I'))
    cpu.reg_write(UC_X86_REG_ESP, sp+4)
def call(address, *args):
    write(stack, 'I'*(len(args)+1), stop, *args)
    cpu.reg_write(UC_X86_REG_ESP, stack)
    cpu.emu_start(address, stop, count=10000)
    assert cpu.reg_read(UC_X86_REG_EIP) == stop

def project(cpu, address, size, user):
    point = read(cpu.reg_read(UC_X86_REG_ESP)+4, 'I')
    projected.append(list(struct.unpack('<iii', cpu.mem_read(point, 12))))
    write(point+8, 'iff', 0, 12.75, 25.25)
    finish()
def ground(cpu, address, size, user):
    sp = cpu.reg_read(UC_X86_REG_ESP)
    ground_queries.append([read(sp+4, 'I') & 65535, read(sp+8, 'I') & 65535])
    cpu.reg_write(UC_X86_REG_EAX, 777)
    finish()
cpu.hook_add(UC_HOOK_CODE, project, begin=0x46dbe0, end=0x46dbe0)
cpu.hook_add(UC_HOOK_CODE, ground, begin=0x44e940, end=0x44e940)
write(0x74a350, 'I', camera)
cases = []
for i in range(1024):
    fps = [0,14,20,24,60,120,144,240][i%8]
    turns = [0,12,20][i%3]
    frames = rng.randrange(1+(fps//turns if turns else 4))
    delta = [rng.randrange(-1024,1025), rng.randrange(-1024,1025), rng.randrange(-200,201)]
    if i%4 == 0: delta = [fps*rng.randrange(-3,4) for _ in range(3)]
    c = dict(x=rng.randrange(65536), y=rng.randrange(65536), h=1000,
             dx=delta[0], dy=delta[1], dh=delta[2], support=rng.randrange(-64,65),
             fps=fps, turns=turns, frames=frames, enabled=i%7 != 0, paused=i%11 == 0)
    c['cx'] = (c['x']-c['dx']+rng.randrange(-8192,8193)) & 65535
    c['cy'] = (c['y']-c['dy']+rng.randrange(-8192,8193)) & 65535
    cpu.mem_write(p, bytes(256))
    write(p+0x3d, 'HHh', c['x'], c['y'], c['h'])
    write(p+0x43, 'hhh', c['dx'], c['dy'], c['dh'])
    write(p+0x1c, 'h', c['support'])
    write(p+0x14, 'I', 0x100 if c['enabled'] else 0)
    write(p+0x18, 'I', 400)
    write(0x897981, 'I', 400+frames)
    write(0x5ca84c, 'ii', turns, fps)
    write(0x89c661, 'I', 2 if c['paused'] else 0)
    write(camera+0x24, 'HH', c['cx'], c['cy'])
    projected, ground_queries = [], []
    for body in [True, False]:
        write(0x75d508, 'I', pool)
        cpu.mem_write(pool, bytes(64))
        cpu.mem_write(0x75d50c, bytes(3585*4))
        call(0x46f080 if body else 0x46f850, 0 if body else p, p if body else 0)
    assert len(projected) == 2 and len(ground_queries) == 1
    c['body'], c['shadow'], c['ground'] = *projected, ground_queries[0]
    cases.append(c)

# The person controller's stamp is written after dispatch, not by the drawing call.
stamps = []
def person(cpu, address, size, user):
    stamps.append(read(p+0x18, 'I'))
    finish()
cpu.hook_add(UC_HOOK_CODE, person, begin=0x4d32b0, end=0x4d32b0)
for counter in [0,1,0x7fffffff,0xffffffff]:
    write(p+0x2a, 'B', 1)
    write(p+0x18, 'I', 123)
    write(0x897981, 'I', counter)
    call(0x4ed700, p)
    assert read(p+0x18, 'I') == counter and stamps[-1] == 123

result = subprocess.run(['node', '--input-type=module', '-e', """
import { interpolateUnitPosition } from './app/unit-motion.ts';
import { browserPosition } from './app/model.ts';
import { relativeCoordinate } from './app/projection.ts';
let input='';for await(const c of process.stdin)input+=c;
console.log(JSON.stringify(JSON.parse(input).map(c=>{
 const fraction=c.enabled&&!c.paused&&c.fps?c.turns*c.frames/c.fps:0;
 const from={...browserPosition({x:c.x-c.dx,y:c.y-c.dy}),y:(c.h-c.dh+c.support)/128};
 const to={...browserPosition(c),y:(c.h+c.support)/128};
 const p=interpolateUnitPosition(from,to,fraction);
 const x=Math.round((p.x+8)*256)&65535,y=Math.round((-p.z-8)*256)&65535;
 return {point:[relativeCoordinate(x,c.cx),p.y*128,relativeCoordinate(y,c.cy)],ground:[x,y]};
})));
"""], input=json.dumps(cases), text=True, capture_output=True, cwd=ROOT)
assert result.returncode == 0, result.stderr
exact = 0
for c, actual in zip(cases, json.loads(result.stdout)):
    fraction = c['enabled'] and not c['paused'] and c['fps'] and c['turns']*c['frames']
    integer = not fraction or all(d*fraction%c['fps']==0 for d in [c['dx'],c['dy'],c['dh']])
    tolerance = 1e-8 if integer else 1+1e-8
    for a,b in zip(actual['point'], c['body']): assert abs(a-b) <= tolerance, (c,actual)
    for a,b in zip(actual['ground'], c['ground']):
        assert abs(((a-b+32768)&65535)-32768) <= tolerance, (c,actual)
    assert c['body'][0] == c['shadow'][0] and c['body'][2] == c['shadow'][2]
    assert c['shadow'][1] == 777
    exact += bool(integer)
fixture = dict(executableSha256=identity['sha256'], cases=cases[:64])
path = ROOT/'tests/fixtures/unit-interpolation.json'
if '--record' in sys.argv: path.write_text(json.dumps(fixture,indent=2)+'\n')
else: assert json.loads(path.read_text()) == fixture, 'Native fixture changed'
print(f'PASS: 1024 native body/shadow interpolation pairs ({exact} exact-coordinate cases; fractional cases within one native unit), 4 post-controller stamps')
