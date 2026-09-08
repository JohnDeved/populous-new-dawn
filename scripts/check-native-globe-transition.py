"""Compare original overview morph projections, lighting and lifetime controllers.
Only final triangle submissions, sidebar width and draw-mode notification are supplied.
Usage: python scripts/check-native-globe-transition.py /path/to/d3dpoptb.exe [--record]
"""
import hashlib, json, random, struct, subprocess, sys
from pathlib import Path
from unicorn import UC_HOOK_CODE
from unicorn.x86_const import UC_X86_REG_ESP, UC_X86_REG_EIP, UC_X86_REG_ECX, UC_X86_REG_EAX, UC_X86_REG_FPCW
from decomp import native_cpu
root = Path(__file__).resolve().parents[1]
cpu, _ = native_cpu(Path(sys.argv[1])); cpu.mem_map(0x2000000, 0x20000)
stack, stop, ctx, out, scratch = 0x201d000, 0x201e000, 0x5fe2f0, 0x2001000, 0x2002000
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
    write(0x89c6cf,'H',v['width']);write(0x89c6d1,'H',v['height'])
    call(0x42d140,v['blend'],0x41d260 if v['flatScale']==18 else 0x41d1e0)
def compare(code, cases, expected):
    js="import * as g from './app/globe.ts'; let s='';for await(const b of process.stdin)s+=b;console.log(JSON.stringify(JSON.parse(s).map("+code+")));"
    r=subprocess.run(['node','--input-type=module','-e',js],input=json.dumps(cases),capture_output=True,text=True,cwd=root)
    assert r.returncode==0,r.stderr
    actual=json.loads(r.stdout); assert len(actual)==len(expected)
    for i,(a,b) in enumerate(zip(expected,actual)):
        if a!=b:
            path=Path('/private/tmp/populous-globe-transition-failure.json');path.write_text(json.dumps(dict(case=cases[i],native=a,browser=b)))
            raise AssertionError((i,str(path),str(a)[:200],str(b)[:200]))

# The renderer's viewport excludes the sidebar. Only its width lookup is supplied.
def sidebar(cpu,a,size,user):
    sp=cpu.reg_read(UC_X86_REG_ESP);cpu.reg_write(UC_X86_REG_EAX,0)
    cpu.reg_write(UC_X86_REG_EIP,read(sp,'I'));cpu.reg_write(UC_X86_REG_ESP,sp+4)
cpu.hook_add(UC_HOOK_CODE,sidebar,begin=0x44bb70,end=0x44bb70)
views=[dict(width=w,height=h,x=x,y=y,blend=b,flatScale=s) for w,h in [(640,480),(1240,1000),(1152,901)] for x,y in [(0,0),(65535,65535)] for s in [18,21] for b in [0,1,42,128,213,255,256]]
cases=[];expected=[]
for v in views:
    setup(v)
    for _ in range(16):
        x,y=rng.randrange(65536),rng.randrange(65536)
        call(0x42dae0,x,y,out,out+4);point=dict(x=read(out,'i'),y=read(out+4,'i'))
        call(0x42dd50,x,y,out,out+4);cell=dict(x=read(out,'i'),y=read(out+4,'i'))
        call(0x42de90,v['width']//2,v['height']//2,out,out+4)
        pick=dict(x=read(out,'i'),y=read(out+4,'i')) if cpu.reg_read(UC_X86_REG_EAX) else None
        cases.append([v,x,y]);expected.append(dict(point=point,cell=cell,pick=pick))
compare('c=>({point:g.globePoint(...c),cell:g.globeCellPoint(...c),pick:g.globePick(c[0],c[0].width>>1,c[0].height>>1)})',cases,expected)
print('PASS:',len(cases),'native blended map/cell projections, both flat projectors, wrapped/rim/odd-height cases',flush=True)
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


# Native morph state executes unchanged; the final draw-mode notification is a leaf.
mode_events=[]
def mode(cpu,a,size,user):
    sp=cpu.reg_read(UC_X86_REG_ESP);mode_events.append(read(sp+4,'I'))
    cpu.reg_write(UC_X86_REG_EIP,read(sp,'I'));cpu.reg_write(UC_X86_REG_ESP,sp+4)
cpu.hook_add(UC_HOOK_CODE,mode,begin=0x47a930,end=0x47a930)
fields={'value':0x5fe400,'source':0x5fe410,'target':0x5fe404,'increment':0x5fe414,'frame':0x5fe424,'duration':0x5fe428,'active':0x5fe420}
def snapshot(): return {k:bool(read(a,'i')) if k=='active' else read(a,'i') for k,a in fields.items()}
cases=[];expected=[]
for duration in [6,8,9,16,32]:
    for value in [0,1,128,255,256]:
        for entering in [False,True]:
            for active in [False,True]:
                initial=dict(value=value,source=256,target=0,increment=-256,frame=2,duration=duration,active=active)
                for k,a in fields.items():write(a,'i',int(initial[k]))
                write(0x5fe430,'i',0);write(0x89ce36,'B',0);mode_events=[]
                call(0x41d410) if entering else call(0x41d450,100000,14)
                sequence=[snapshot()]
                while read(0x5fe420,'i'):
                    call(0x41d680);sequence.append(snapshot())
                cases.append(dict(initial=initial,entering=entering));expected.append(sequence)
                assert mode_events==([] if entering or active else [0])
js="import {beginGlobeMorph,stepGlobeMorph} from './app/camera-view.ts';let s='';for await(const c of process.stdin)s+=c;console.log(JSON.stringify(JSON.parse(s).map(c=>{const m=c.initial;beginGlobeMorph(m,c.entering);const states=[structuredClone(m)];while(m.active){stepGlobeMorph(m);states.push(structuredClone(m))}return states})))"
r=subprocess.run(['node','--input-type=module','-e',js],input=json.dumps(cases),capture_output=True,text=True,cwd=root)
assert r.returncode==0,r.stderr
assert json.loads(r.stdout)==expected
print('PASS:',len(cases),'complete native morph starts/lifetimes, ignored return requests, signed increments and exact endpoint timing',flush=True)

if '--record' in sys.argv:
    path=root/'tests/fixtures/globe.json';fixture=json.loads(path.read_text())
    fixture['morphMeshes']=[c for c in mesh_fixtures if c['view']['blend'] in [128,256]]
    fixture['morphSequences']=[dict(**c,sha256=hashlib.sha256(json.dumps(e,separators=(',',':')).encode()).hexdigest()) for c,e in zip(cases,expected) if not c['initial']['active'] and c['initial']['value']==0]
    path.write_text(json.dumps(fixture,indent=2)+'\n')
    print('Recorded',len(fixture['morphMeshes']),'native morph meshes and',len(fixture['morphSequences']),'lifetimes')
