"""Compare native world-view cell projection and complete building footprint draws.
The controller, building visibility predicate and quad emitters run unchanged.
Only the final D3D quad queue submission is captured.
Usage: python scripts/check-native-globe-footprints.py /path/to/d3dpoptb.exe
"""
import json, random, struct, subprocess, sys
from pathlib import Path
from unicorn import UC_HOOK_CODE
from unicorn.x86_const import UC_X86_REG_ESP, UC_X86_REG_EIP, UC_X86_REG_ECX, UC_X86_REG_FPCW
from decomp import native_cpu
root=Path(__file__).resolve().parents[1];exe=Path(sys.argv[1]);cpu,_=native_cpu(exe)
cpu.mem_map(0x2000000,0x40000)
ctx,stack,stop,pal,alpha,cell,unit,out=0x5fe2f0,0x203d000,0x203e000,0x2000000,0x2001000,0x2020000,0x2021000,0x2022000
rng=random.Random(0x41edb0)
def write(a,f,*v):cpu.mem_write(a,struct.pack('<'+f,*v))
def read(a,f):return struct.unpack('<'+f,cpu.mem_read(a,struct.calcsize('<'+f)))[0]
def call(a,*args):
    write(stack,'I'*(len(args)+1),stop,*[v&0xffffffff for v in args]);cpu.reg_write(UC_X86_REG_ESP,stack)
    cpu.reg_write(UC_X86_REG_ECX,ctx);cpu.reg_write(UC_X86_REG_FPCW,0x27f)
    cpu.emu_start(a,stop,count=1000000);assert cpu.reg_read(UC_X86_REG_EIP)==stop

def setup(v):
    cpu.mem_write(ctx,bytes(0x110));write(ctx+8,'4i',v['width'],v['height'],v['width']//2,v['height']//2)
    write(ctx+0x18,'2i',v['x'],v['y']);call(0x42d180,v['width']//2,v['height']//2,v['height']*4//10,20480)
def compare(code,cases,expected):
    js="import * as g from './app/globe.ts';import hud from './app/original-hud.json' with {type:'json'};import {readFileSync} from 'node:fs';const palette=readFileSync('public/original/landscape.bin');let s='';for await(const c of process.stdin)s+=c;console.log(JSON.stringify(JSON.parse(s).map("+code+")));"
    r=subprocess.run(['node','--input-type=module','-e',js],input=json.dumps(cases),capture_output=True,text=True,cwd=root)
    assert r.returncode==0,r.stderr;actual=json.loads(r.stdout);assert len(actual)==len(expected)
    for i,(a,b) in enumerate(zip(expected,actual)):
        if a!=b:
            p=Path('/private/tmp/populous-globe-footprint-failure.json');p.write_text(json.dumps(dict(case=cases[i],native=a,browser=b)));raise AssertionError((i,a,b,str(p)))

palette=(exe.parent/'data/pal0-c.dat').read_bytes();al=(exe.parent/'data/al0-c.dat').read_bytes()
cpu.mem_write(pal,palette);cpu.mem_write(alpha,al);cpu.mem_write(0xd05528,palette);cpu.mem_write(0x87f000,al)
hud=json.loads((root/'app/original-hud.json').read_text());assert hud['alphaColors']==[al[((i<<4)|15)*256] for i in range(16)]
quads=[]
def capture(cpu,a,size,user):
    sp=cpu.reg_read(UC_X86_REG_ESP);points=[]
    for i in range(4):
        p=read(sp+4+i*4,'I');color=read(p+16,'I')
        points.append(dict(x=int(read(p,'f')),y=int(read(p+4,'f')),rgba=[color>>16&255,color>>8&255,color&255,color>>24]))
    quads.append(dict(points=points,flags=read(sp+24,'I')))
    assert read(sp+20,'I')==0
    cpu.reg_write(UC_X86_REG_EIP,read(sp,'I'));cpu.reg_write(UC_X86_REG_ESP,sp+28)
cpu.hook_add(UC_HOOK_CODE,capture,begin=0x47d980,end=0x47d980)
views=[dict(width=w,height=h,x=x,y=y) for w,h in [(640,480),(1240,1000),(1152,901)] for x,y in [(0,0),(65535,65535),(2560,55808),(32001,519)]]
cases=[];expected=[]
for v in views:
    setup(v)
    for _ in range(256):
        x,y=rng.randrange(65536),rng.randrange(65536);call(0x42dd50,x,y,out,out+4)
        cases.append([v,x,y]);expected.append(dict(x=read(out,'i'),y=read(out+4,'i')))
compare('c=>g.globeCellPoint(...c)',cases,expected)
print('PASS: 3072 native inside/rim cell projections across wrapped centers and odd/even resolutions',flush=True)

cases=[];expected=[]
for i in range(4096):
    v=views[i%len(views)];setup(v)
    x,y=((v['x']>>9)+rng.randrange(-42,43))&127,((v['y']>>9)+rng.randrange(-42,43))&127
    index=y*128+x;flags=rng.choice([0,8,0x80,0x180,0x200,0x400,0x600,0x780])|rng.choice([0,8])
    b=None if i%7==0 else dict(id=9,tribe=rng.randrange(4))
    inputs=dict(player=rng.randrange(4),turn=i&3,fog=bool(i&4),concealed=rng.randrange(16))
    write(cell,'I',flags);write(cell+8,'H',9);write(cell+15,'B',inputs['concealed'])
    cpu.mem_write(unit,bytes(256));write(0x890390+9*4,'I',unit if b else 0)
    if b:write(unit+0x2a,'B',2);write(unit+0x2f,'B',b['tribe'])
    write(0x89c6f0,'B',inputs['player']);write(0x895da8,'I',4 if inputs['fog'] else 0)
    write(0x89d184,'I',inputs['turn']);write(0x89c6fd,'B',23)
    quads=[];call(0x41edb0,cell,x*2|(y<<9))
    cases.append([v,index,flags,b,inputs]);expected.append(dict(icon=bool(read(unit+0x35,'B')&1),quads=quads))
code="""c=>{const f=g.globeFootprint(...c);let quads=[];
if(f?.quad){const index=f.translucent?hud.alphaColors[f.color>>4]:f.color,rgba=[...palette.subarray(index*4,index*4+3),f.translucent?(f.color&15)*16:255];quads=[{points:f.quad.map(p=>({...p,rgba})),flags:f.translucent?64:0}]}
return {icon:f?.buildingId!==null&&f?.buildingId!==undefined,quads}}"""
compare(code,cases,expected)
print('PASS: 4096 complete native footprint/visibility/quad calls; ownership, fog, concealment, plans/blink, null references, rim winding, palette alpha and icon flags',flush=True)

# Execute the complete marker controller with empty tribe/map lists and one
# allocated building. Only the final HFX sprite submissions are intercepted.
hfx,person=0x2024000,0x2023000
source=(exe.parent/'data/hfx0-0.dat').read_bytes();count=struct.unpack_from('<I',source,4)[0]
for i in range(count):
    w,h,_=struct.unpack_from('<HHI',source,8+i*8);write(hfx+i*8,'IHH',0,w,h)
write(0x59df14,'I',hfx);write(0x59cd7c,'I',0) # browser viewport excludes sidebar
write(0x890324,'I',unit);write(0x890390+10*4,'I',person)
cpu.mem_write(0x89d1c8,bytes(4*0xc65));cpu.mem_write(0x8a03e4,bytes(16384*16))
write(0x895da8,'I',0)
sprites=[]
def sprite(cpu,a,size,user):
    sp=cpu.reg_read(UC_X86_REG_ESP);p=read(sp+12,'I');w,h=read(p+4,'H'),read(p+6,'H')
    if a==0x516430:w,h=read(sp+16,'i'),read(sp+20,'i')
    sprites.append(dict(id=(p-hfx)//8,x=read(sp+4,'i'),y=read(sp+8,'i'),width=w,height=h))
    cpu.reg_write(UC_X86_REG_EIP,read(sp,'I'));cpu.reg_write(UC_X86_REG_ESP,sp+4)
for a in [0x5162e0,0x516430]:cpu.hook_add(UC_HOOK_CODE,sprite,begin=a,end=a)
cases=[];expected=[]
for i in range(384):
    v={**views[i%len(views)],'height':[480,600,768][i%3]};setup(v);write(0x89c6cf,'hh',v['width'],v['height'])
    model=i%24;owned=bool(i&32);people=i%6;occupant=(i//24)%8
    x,y=(v['x']+rng.randrange(-24000,24001))&65535,(v['y']+rng.randrange(-24000,24001))&65535
    cpu.mem_write(unit,bytes(256));cpu.mem_write(person,bytes(256))
    write(unit+0x2a,'BBBBBB',2,model,2,0,0,0 if owned else 1);write(unit+0x35,'B',1)
    write(unit+0x3d,'HH',x,y);write(unit+0xa6,'B',people);write(unit+0x86,'H',10)
    write(person+0x2a,'BB',1,occupant);write(0x89c6f0,'B',0)
    sprites=[];call(0x41d730)
    assert len(sprites)==1,(i,sprites)
    cases.append(dict(view=v,model=model,count=people,owned=owned,occupants=[occupant],x=x,y=y));expected.append(sprites[0])
compare("c=>{const id=g.globeBuildingIcon(c.model,c.count,c.owned,c.occupants),r=hud.rects[id];return {id,...g.globeIconRect(c.view,g.globePoint(c.view,c.x,c.y),r.w,r.h)}}",cases,expected)
print('PASS: 384 complete native building-icon controllers; model, owner-only hut counts, tower occupants, wrapped projection and rim sizing',flush=True)

# Keep the known desktop extension explicit instead of claiming native equality
# where the original signed numerator overflows (20x19 becomes 2x2 at 1000px).
v=dict(width=1240,height=1000,x=0,y=0);setup(v);write(0x89c6cf,'hh',1240,1000)
cpu.mem_write(unit,bytes(256));write(unit+0x2a,'BBB',2,4,2);write(unit+0x35,'B',1)
write(unit+0x3d,'HH',9517,62869);sprites=[];call(0x41d730)
assert sprites==[dict(id=120,x=921,y=583,width=2,height=2)],sprites
compare("v=>g.globeIconRect(v,g.globePoint(v,9517,62869),22,21)",[v],[dict(x=912,y=575,width=20,height=19)])
print('PASS: recorded native tall-viewport overflow and deliberate wide-numerator desktop extension',flush=True)
