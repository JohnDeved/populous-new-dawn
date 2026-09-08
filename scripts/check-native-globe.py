"""Compare globe projection, picking, adaptive terrain, shading and stars with the EXE.
Only final software/D3D submissions are captured; mesh generation, math and RNG run natively.
Usage: python scripts/check-native-globe.py /path/to/d3dpoptb.exe
"""
import hashlib, json, random, struct, subprocess, sys
from pathlib import Path
from unicorn import UC_HOOK_CODE
from unicorn.x86_const import UC_X86_REG_ESP, UC_X86_REG_EIP, UC_X86_REG_ECX, UC_X86_REG_EAX, UC_X86_REG_FPCW
from decomp import native_cpu
root = Path(__file__).resolve().parents[1]
cpu, _ = native_cpu(Path(sys.argv[1])); cpu.mem_map(0x2000000, 0x20000)
stack, stop, ctx, out, scratch = 0x201d000, 0x201e000, 0x2000000, 0x2001000, 0x2002000
rng = random.Random(0x42dae0)
def write(a, f, *v): cpu.mem_write(a, struct.pack('<'+f, *v))
def read(a, f): return struct.unpack('<'+f, cpu.mem_read(a, struct.calcsize('<'+f)))[0]
def call(a, *args):
    write(stack, 'I'*(len(args)+1), stop, *[v & 0xffffffff for v in args]); cpu.reg_write(UC_X86_REG_ESP, stack)
    cpu.reg_write(UC_X86_REG_ECX, ctx); cpu.reg_write(UC_X86_REG_FPCW, 0x27f)
    cpu.emu_start(a, stop, count=10000000)
    assert cpu.reg_read(UC_X86_REG_EIP) == stop, hex(cpu.reg_read(UC_X86_REG_EIP))
def setup(v):
    cpu.mem_write(ctx, bytes(0x110))
    write(ctx+8, '4i', v['width'], v['height'], v['width']//2, v['height']//2)
    write(ctx+0x18, '2i', v['x'], v['y'])
    call(0x42d180, v['width']//2, v['height']//2, v['height']*4//10, 20480)
def compare(code, cases, expected):
    js="import * as g from './app/globe.ts'; let s='';for await(const b of process.stdin)s+=b;console.log(JSON.stringify(JSON.parse(s).map("+code+")));"
    r=subprocess.run(['node','--input-type=module','-e',js],input=json.dumps(cases),capture_output=True,text=True,cwd=root)
    assert r.returncode==0,r.stderr
    actual=json.loads(r.stdout); assert len(actual)==len(expected)
    for i,(a,b) in enumerate(zip(expected,actual)):
        if a!=b:
            path=Path('/private/tmp/populous-globe-failure.json');path.write_text(json.dumps(dict(case=cases[i],native=a,browser=b)))
            raise AssertionError((i,str(path),str(a)[:200],str(b)[:200]))
views=[dict(width=w,height=h,x=x,y=y) for w,h in [(320,200),(640,480),(1312,1000),(1152,901)] for x,y in [(0,0),(65535,65535),(17408,50176),(32001,519)]]
cases=[]; expected=[]
for v in views:
    setup(v)
    for _ in range(256):
        x,y=rng.randrange(65536),rng.randrange(65536)
        call(0x42dae0,x,y,out,out+4); point=dict(x=read(out,'i'),y=read(out+4,'i'))
        call(0x42daa0,x,y);visible=bool(cpu.reg_read(UC_X86_REG_EAX))
        cases.append([v,x,y]);expected.append(dict(point=point,visible=visible))
compare('c=>({point:g.globePoint(...c),visible:g.globeVisible(...c)})',cases,expected)
print('PASS: 4096 native globe projections and wrapped visibility tests',flush=True)
cases=[];expected=[]
for v in views:
    setup(v)
    for _ in range(128):
        x,y=rng.randrange(v['width']),rng.randrange(v['height'])
        call(0x42de90,x,y,out,out+4)
        cases.append([v,x,y]);expected.append(dict(x=read(out,'i'),y=read(out+4,'i')) if cpu.reg_read(UC_X86_REG_EAX) else None)
compare('c=>g.globePick(...c)',cases,expected)
print('PASS: 2048 native inverse map picks inside/outside the globe',flush=True)

# Final software triangles contain projected XY, native fixed UV and shade.
triangles=[]
def capture(cpu,a,size,user):
    sp=cpu.reg_read(UC_X86_REG_ESP)
    triangle=[]
    for j in range(3):
        p=read(sp+4+j*4,'I'); x,y,u,v,shade=struct.unpack('<5i',cpu.mem_read(p,20)); s=shade>>13
        triangle.append(dict(x=x,y=y,diffuse=min(255,s),specular=min(255,(s-352)**2//200) if s>352 else 0))
    triangles.append(triangle)
    cpu.reg_write(UC_X86_REG_EIP,read(sp,'I'));cpu.reg_write(UC_X86_REG_ESP,sp+4)
cpu.hook_add(UC_HOOK_CODE,capture,begin=0xd0e000,end=0xd0e000)
call(0x462e60)
cases=[];expected=[]
for v in views:
    setup(v);triangles=[];call(0x42ea10,scratch,4)
    cases.append(v);expected.append(triangles)
compare('v=>g.globeMesh(v).map(t=>t.points.map(p=>{const q=g.globePoint(v,p.x<<9,p.y<<9);return {...q,...g.globeShade(v,q)}}))',cases,expected)
print('PASS:',sum(map(len,expected)),'complete native adaptive mesh triangles, projected vertices and globe diffuse/specular shades',flush=True)
mesh_fixtures=[dict(view=v,triangles=len(t),sha256=hashlib.sha256(json.dumps(t,separators=(',',':')).encode()).hexdigest()) for v,t in zip(cases,expected)]

cases=[];expected=[]
for v in views:
    setup(v)
    for x,y in [(0,0),(0,1),(1,0),(-16384,16383),(16384,-16384)]+[(rng.randrange(65536),rng.randrange(65536)) for _ in range(256)]:
        call(0x42dbf0,x,y,out,out+4);cases.append([v,x,y]);expected.append(dict(x=read(out,'i'),y=read(out+4,'i')))
compare('c=>g.globeStar(...c)',cases,expected)
print('PASS:',len(cases),'native star coordinates including quadrant boundaries',flush=True)

ui,device,vtable,render,draw=0x2013000,0x2014000,0x2015000,0x2016000,0x2016100
write(0xafc2f4,'I',ui);write(ui+0x648,'I',device);write(device,'I',vtable)
write(vtable+0x5c,'I',render);write(vtable+0x74,'I',draw)
stars=[]
def submit(cpu,a,size,user):
    sp=cpu.reg_read(UC_X86_REG_ESP)
    if a==draw:
        vertices,count=read(sp+16,'I'),read(sp+20,'I')
        for i in range(count):
            p=vertices+i*32;stars.append(dict(x=read(p,'f'),y=read(p+4,'f'),color=read(p+16,'I')))
    cpu.reg_write(UC_X86_REG_EAX,0);cpu.reg_write(UC_X86_REG_EIP,read(sp,'I'))
    cpu.reg_write(UC_X86_REG_ESP,sp+(28 if a==draw else 16))
for a in [render,draw]:cpu.hook_add(UC_HOOK_CODE,submit,begin=a,end=a)
cases=[];expected=[]
for v in views:
    setup(v); offsets=[rng.randrange(-65536,65536) for _ in range(32)]
    write(ctx+0x5c,'32i',*offsets);stars=[];call(0x42edb0,1000,0,123456789)
    cases.append([v,offsets]);expected.append(stars)
compare('c=>g.globeStars(c[0],Int32Array.from(c[1]))',cases,expected)
print('PASS: 16 native star draw streams, submitted count/order, fixed seed and palette colors',flush=True)

# Palette resolver and active pointer displacement, with the original lookup
# and mouse handler executing in full. Inertia/outer-frame ownership is separate.
cpu.mem_write(out, (root/'public/original/landscape.bin').read_bytes()[:1024])
call(0x42adc0,out,out+1024)
indices=list(cpu.mem_read(out+1024,11))
compare('()=>g.globePalette',[None],[dict(outline=indices[1],tree=indices[3],wild=indices[10],tribes=[read(0x59bc19+i*4,'B') for i in range(4)])])
cases=[];expected=[]
for v in views:
    for _ in range(32):
        setup(v);dx,dy=rng.randrange(-1024,1025),rng.randrange(-1024,1025)
        write(ctx+0x3c,'5i',100,100,v['x'],v['y'],1);write(ctx+0x58,'i',2048)
        call(0x42d240,100+dx,100+dy)
        cases.append([dict(x=v['x'],y=v['y']),dx,dy,v['height']]);expected.append(dict(x=read(ctx+0x18,'i'),y=read(ctx+0x1c,'i')))
compare('c=>g.globeDrag(...c)',cases,expected)
print('PASS: native opening marker palette and 512 complete active-drag pointer updates',flush=True)

cases=[];expected=[]
for _ in range(512):
    v=views[rng.randrange(len(views))];setup(v)
    offsets=[rng.randrange(-2147483648,2147483648) for _ in range(32)]
    dx,dy=rng.randrange(-32768,32768),rng.randrange(-32768,32768)
    write(ctx+0x5c,'32i',*offsets);call(0x42d060,v['x']+dx,v['y']+dy,0,0,2048)
    cases.append([offsets,dx,dy]);expected.append(list(struct.unpack('<32i',cpu.mem_read(ctx+0x5c,128))))
compare('c=>{const o=Int32Array.from(c[0]);g.moveGlobeStars(o,c[1],c[2]);return [...o]}',cases,expected)
print('PASS: 512 native parallax updates across all sixteen star layers',flush=True)

if '--record' in sys.argv[2:]:
    fixture=dict(executableSha256=hashlib.sha256(Path(sys.argv[1]).read_bytes()).hexdigest(),meshes=mesh_fixtures)
    (root/'tests/fixtures/globe.json').write_text(json.dumps(fixture,indent=2)+'\n')
    print('Recorded portable mesh fixtures from the native submissions after all comparisons passed.')
