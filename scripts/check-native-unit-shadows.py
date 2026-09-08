"""Compare native shadow queue, painter rectangles, body buckets and airborne gate.
Projection is supplied to isolate queue behavior; original ground sampling and
sprite scaling execute. Final sprite submission is intercepted.
Usage: python scripts/check-native-unit-shadows.py /path/to/d3dpoptb.exe
"""
import json, random, struct, subprocess, sys
from pathlib import Path
from unicorn import UC_HOOK_CODE
from unicorn.x86_const import UC_X86_REG_ESP, UC_X86_REG_EIP, UC_X86_REG_EAX, UC_X86_REG_ESI
from decomp import native_cpu, ROOT

cpu, _ = native_cpu(Path(sys.argv[1]))
cpu.mem_map(0x2000000, 0x100000)
p, camera, pool, bank, stack, stop = 0x2010000, 0x2020000, 0x2030000, 0x2040000, 0x20ee000, 0x20ef000
rng = random.Random(0x46f850)
def write(a, fmt, *values): cpu.mem_write(a, struct.pack('<'+fmt, *values))
def read(a, fmt): return struct.unpack('<'+fmt, cpu.mem_read(a, struct.calcsize('<'+fmt)))[0]
def compare(js, data, expected, label):
    result = subprocess.run(['node','--input-type=module','-e', "let s='';for await(const c of process.stdin)s+=c;const input=JSON.parse(s);"+js], input=json.dumps(data), text=True, capture_output=True, cwd=ROOT)
    assert result.returncode == 0, result.stderr
    actual = json.loads(result.stdout)
    assert len(actual) == len(expected)
    for i, (a,b) in enumerate(zip(actual,expected)): assert a == b, (label,i,a,b)
    print(f'PASS: {len(expected):,} native {label} comparisons', flush=True)

land = dict(heights=[rng.randrange(-128,1025) for _ in range(16384)], flags=[rng.randrange(2) for _ in range(16384)])
for i,(h,f) in enumerate(zip(land['heights'],land['flags'])): write(0x8a03e4+i*16,'Ih',f,h)
write(0x74a350,'I',camera)
def project(cpu,a,size,user):
    sp=cpu.reg_read(UC_X86_REG_ESP); point=read(sp+4,'I')
    projected.append([read(point,'i'),read(point+4,'i'),read(point+8,'i')])
    write(point+8,'iff',case['depth'],12.75,case['screenY']); write(point+24,'I',case['clip'])
    cpu.reg_write(UC_X86_REG_EIP,read(sp,'I'));cpu.reg_write(UC_X86_REG_ESP,sp+4)
hook=cpu.hook_add(UC_HOOK_CODE,project,begin=0x46dbe0,end=0x46dbe0)
cases, expected = [], []
for n in range(512):
    case=dict(x=rng.randrange(65536),y=rng.randrange(65536),cx=rng.randrange(65536),cy=rng.randrange(65536),depth=rng.choice([-40000,-28481,-28480,-28479,0,16,28671,40000]),clip=rng.choice([0,2,0x80000000,0x80000001]),screenY=rng.choice([-25.25,0,25.25]),body=bool(n&1),bias=rng.choice([-300,-2048,0,2032]))
    cpu.mem_write(p,bytes(256));write(p+0x3d,'HHh',case['x'],case['y'],120)
    write(camera+0x24,'HH',case['cx'],case['cy']);write(0x75d508,'I',pool);cpu.mem_write(pool,bytes(64));cpu.mem_write(0x75d50c,bytes(3585*4))
    if case['body'] and case['bias'] != -300:
        write(p+0x14,'I',0x400);write(p+0x3b,'b',case['bias']//16)
    write(stack,'III',stop,0 if case['body'] else p,p if case['body'] else 0)
    cpu.reg_write(UC_X86_REG_ESP,stack);projected=[]
    cpu.emu_start(0x46f080 if case['body'] else 0x46f850,stop,count=10000)
    assert cpu.reg_read(UC_X86_REG_EIP)==stop and len(projected)==1
    buckets=[i+1 for i in range(3585) if read(0x75d50c+i*4,'I')==pool]
    expected.append(dict(point=projected[0],bucket=buckets[0] if buckets else None))
    cases.append(case)
compare("""import {relativeCoordinate,spriteBucket} from './app/projection.ts';import {terrainPointHeight} from './app/native-terrain.ts';console.log(JSON.stringify(input.cases.map(c=>({point:[relativeCoordinate(c.x,c.cx),c.body?120:terrainPointHeight(input.land,c),relativeCoordinate(c.y,c.cy)],bucket:c.screenY<0?null:spriteBucket(c.depth,c.body?c.bias:-192)}))));""",dict(land=land,cases=cases),expected,'body/shadow queue, ground and wrapped projection-input')
cpu.hook_del(hook)

write(0x59df14,'I',bank)
frames={15:(22,21,4),16:(71,39,6),25:(70,9,2)}
for source,w,h in frames.values():write(bank+source*8,'IHH',0,w,h)
def submit(cpu,a,size,user):
    sp=cpu.reg_read(UC_X86_REG_ESP); source=(read(sp+12,'I')-bank)//8
    w,h=(read(bank+source*8+4,'H'),read(bank+source*8+6,'H')) if a==0x5162e0 else (read(sp+16,'i'),read(sp+20,'i'))
    draws.append(dict(x=read(sp+4,'i'),y=read(sp+8,'i'),width=w,height=h))
    cpu.reg_write(UC_X86_REG_EIP,read(sp,'I'));cpu.reg_write(UC_X86_REG_ESP,sp+4)
for a in [0x5162e0,0x516430]:cpu.hook_add(UC_HOOK_CODE,submit,begin=a,end=a)
views=json.loads((ROOT/'app/original-camera.json').read_text())['views']
cases,expected=[],[]
for n in range(1024):
    kind=rng.choice(list(frames));source,w,h=frames[kind];view=rng.choice(views)
    depth=rng.randrange(-50000,50000);flags=rng.choice([0,0x80,0x100,0x200,0x380]);distance=depth+0x6f40
    bucket=(0 if distance<64 else min(3584,distance>>4))+1
    write(p+6,'hh',0,0);write(stack+0x14,'I',p);write(stack+0x30,'I',bucket)
    write(camera+0x2a,'i',view['scale']);write(0x87ca6c,'ii',view['spriteScale'],view['shamanScale']);write(0x89c669,'I',flags)
    cpu.reg_write(UC_X86_REG_ESP,stack);cpu.reg_write(UC_X86_REG_EAX,kind);draws=[]
    cpu.emu_start(0x46acf6,0x46c185,count=4000)
    assert cpu.reg_read(UC_X86_REG_EIP)==0x46c185 and len(draws)==1
    cases.append([dict(w=w,h=h),depth,flags,view]);expected.append(draws[0])
compare("import {spriteShadow} from './app/projection.ts';console.log(JSON.stringify(input.map(c=>spriteShadow(...c))));",cases,expected,'original shadow painter rectangles and sprite scaling')

cases,expected=[],[]
for n in range(512):
    flags=rng.getrandbits(32);write(p+0x10,'I',flags);write(p+0x35,'H',rng.randrange(65536));write(stack,'6I',0,0,0,0,0,stop)
    cpu.reg_write(UC_X86_REG_ESP,stack);cpu.reg_write(UC_X86_REG_ESI,p)
    cpu.emu_start(0x4d3ce7,stop,count=100)
    assert cpu.reg_read(UC_X86_REG_EIP)==stop
    cases.append(flags);expected.append(bool(read(p+0x35,'H')&0x8000))
compare("console.log(JSON.stringify(input.map(flags=>!!(flags&0x400))));",cases,expected,'person airborne shadow gating')
