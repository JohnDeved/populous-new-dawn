"""Compare native overview range strips and spell-trail queue/painter behavior.
Only final D3D quad/HFX sprite submissions and viewport backend leaves are captured.
Usage: python scripts/check-native-globe-effects.py /path/to/d3dpoptb.exe
"""
import json,random,struct,subprocess,sys
from pathlib import Path
from unicorn import UC_HOOK_CODE
from unicorn.x86_const import UC_X86_REG_ESP,UC_X86_REG_EIP,UC_X86_REG_ECX,UC_X86_REG_FPCW
from decomp import native_cpu,ROOT
exe=Path(sys.argv[1]);cpu,_=native_cpu(exe);cpu.mem_map(0x2000000,0x40000)
ctx,stack,stop,unit,cell,pool,hfx,pal=0x5fe2f0,0x203d000,0x203e000,0x2000000,0x2001000,0x2002000,0x2010000,0x2020000
rng=random.Random(0x41f370)
def write(a,f,*v):cpu.mem_write(a,struct.pack('<'+f,*v))
def read(a,f):return struct.unpack('<'+f,cpu.mem_read(a,struct.calcsize('<'+f)))[0]
def call(a,*args):
    write(stack,'I'*(len(args)+1),stop,*[v&0xffffffff for v in args]);cpu.reg_write(UC_X86_REG_ESP,stack)
    cpu.reg_write(UC_X86_REG_ECX,ctx);cpu.reg_write(UC_X86_REG_FPCW,0x27f)
    cpu.emu_start(a,stop,count=1000000);assert cpu.reg_read(UC_X86_REG_EIP)==stop,hex(cpu.reg_read(UC_X86_REG_EIP))
def setup(v):
    cpu.mem_write(ctx,bytes(0x110));write(ctx+8,'4i',v['width'],v['height'],v['width']//2,v['height']//2)
    write(ctx+0x18,'2i',v['x'],v['y']);call(0x42d180,v['width']//2,v['height']//2,v['height']*4//10,20480)
def compare(code,cases,expected):
    js="import * as g from './app/globe.ts';import {lineQuad} from './app/lightning.ts';import hud from './app/original-hud.json' with {type:'json'};import {readFileSync} from 'node:fs';const pal=readFileSync('public/original/landscape.bin'),hfx=readFileSync("+json.dumps(str(exe.parent/'data/hfx0-0.dat'))+");let s='';for await(const c of process.stdin)s+=c;console.log(JSON.stringify(JSON.parse(s).map("+code+")));"
    r=subprocess.run(['node','--input-type=module','-e',js],input=json.dumps(cases),capture_output=True,text=True,cwd=ROOT)
    assert r.returncode==0,r.stderr;actual=json.loads(r.stdout)
    assert len(actual)==len(expected)
    for i,(a,b) in enumerate(zip(expected,actual)):
        if a!=b:
            p=Path('/private/tmp/populous-globe-effects-failure.json');p.write_text(json.dumps(dict(case=cases[i],native=a,browser=b)));raise AssertionError((i,str(p),a,b))
palette=(exe.parent/'data/pal0-c.dat').read_bytes();al=(exe.parent/'data/al0-c.dat').read_bytes()
cpu.mem_write(pal,palette);cpu.mem_write(0xd05528,palette);cpu.mem_write(0x87f000,al);write(0x87eff8,'I',pal)
hud=json.loads((ROOT/'app/original-hud.json').read_text());assert hud['spriteColors']==[al[i*4096+0x2f82] for i in range(13)]
quads=[];sprites=[]
def capture(cpu,a,size,user):
    sp=cpu.reg_read(UC_X86_REG_ESP)
    if a==0x47d980:
        quad=[]
        for i in range(4):
            p=read(sp+4+i*4,'I');quad += [read(p,'f'),read(p+4,'f')]
        quads.append(dict(quad=quad,color=read(read(sp+4,'I')+16,'I'),flags=read(sp+24,'I')))
        assert read(sp+20,'I')==0
    elif a==0x5162e0:
        p=read(sp+12,'I');sprites.append(dict(id=(p-hfx)//8,x=read(sp+4,'i'),y=read(sp+8,'i'),width=read(p+4,'H'),height=read(p+6,'H'),color=read(0x5da0e0,'I') if read(0x5da074,'I')&8 else 0xffffff))
    cpu.reg_write(UC_X86_REG_EIP,read(sp,'I'));cpu.reg_write(UC_X86_REG_ESP,sp+(28 if a==0x47d980 else 4))
for a in [0x47d980,0x5162e0,0x5231e0,0x517220]:cpu.hook_add(UC_HOOK_CODE,capture,begin=a,end=a)
views=[dict(width=w,height=h,x=x,y=y) for w,h in [(640,480),(1240,1000),(1152,901)] for x,y in [(0,0),(65535,65535),(32001,519)]]
cases=[];expected=[]
for i in range(256):
    v=views[i%len(views)];setup(v);origin=dict(x=rng.randrange(65536),y=rng.randrange(65536))
    radius=rng.choice([0,512,4096,10000,20000,32767,32768,65536]);phase=None if i&1 else rng.randrange(0x100000000);color=rng.randrange(256)
    write(unit,'HH',origin['x'],origin['y']);write(0x59bc30,'I',phase or 0);quads=[]
    call(0x41f370,radius,32,unit,color,int(phase is not None))
    cases.append(dict(view=v,origin=origin,radius=radius,phase=phase,color=color));expected.append(quads)
compare("c=>g.globeCircle(c.view,c.origin,c.radius,c.phase).map(l=>({quad:lineQuad(l),color:((l.alpha<<24)|(pal[c.color*4]<<16)|(pal[c.color*4+1]<<8)|pal[c.color*4+2])>>>0,flags:64}))",cases,expected)
print('PASS: 256 complete native circle controllers and final D3D strips, polar rounding, wrapped/rim visibility, pulse alpha and palette colors',flush=True)
for i in range(256):
    phase=rng.randrange(0x100000000);ticks=rng.randrange(0x100000000);write(0x59bc30,'I',phase);write(0x5ca85c,'I',ticks)
    call(0x41ebf0);assert read(0x59bc30,'I')==(phase+(ticks>>4))&0xffffffff
print('PASS: 256 native overview phase updates from the sky tick counter; viewport backend leaves supplied',flush=True)

source=(exe.parent/'data/hfx0-0.dat').read_bytes();count=struct.unpack_from('<I',source,4)[0]
for i in range(count):
    w,h,_=struct.unpack_from('<HHI',source,8+i*8);write(hfx+i*8,'IHH',0,w,h)
write(0x59df14,'I',hfx);write(0x890390+7*4,'I',unit);write(0x75d504,'I',pool+4096)
write(0x89c6cf,'H',1240)
cases=[];expected=[]
for i in range(512):
    v=views[i%len(views)];setup(v);cpu.mem_write(unit,bytes(256));cpu.mem_write(0x75d50c,bytes(10*4));write(0x75d508,'I',pool)
    model=rng.choice([3,4,10,38,42]);owner=i%4;player=(i//4)%4;fog=bool(i&32);seen=bool(i&64)
    x,y=rng.randrange(65536),rng.randrange(65536);draw=rng.choice([1,29,30,41,44,48])
    animation=dict(object=rng.choice([314,318,322,326,1124,1616]),draw=draw,f1=rng.randrange(4)*4,palette=rng.choice([240,0,7,15,16]),renderFlags=rng.choice([0,16,0x4000]))
    if animation['object']==1616:animation['f1']=0
    flags4=rng.choice([0,0,0x20000]);write(unit+0x10,'I',flags4);write(unit+0x2a,'BB',7,model);write(unit+0x2f,'B',owner)
    write(unit+0x33,'HHH',animation['object'],animation['renderFlags'],animation['f1']);write(unit+0x3a,'BBB',draw,0,animation['palette'])
    write(unit+0x3d,'HH',x,y);write(cell,'I',8 if seen else 0);write(cell+6,'H',7);write(cell+15,'B',0)
    write(0x89c6f0,'B',player);write(0x895da8,'I',4 if fog else 0);write(0x5da074,'I',0);write(0x5da0e0,'I',0xffffff)
    sprites=[];call(0x41deb0,cell);call(0x41e5b0)
    cases.append(dict(view=v,x=x,y=y,model=model,owner=owner,player=player,fog=fog,seen=seen,flags4=flags4,animation=animation));expected.append(sprites)
# This isolated controller receives an already-visited map cell. The browser's
# outer cell visibility is checked separately; no second center gate belongs here.
compare("""c=>{if(![3,4,10].includes(c.model)||(c.animation.renderFlags&16)||(c.flags4&0x20000)||(c.owner!==c.player&&c.fog&&!c.seen))return [];
const f=g.globeEffectFrame(c.animation);if(!f)return [];const q=g.globePoint(c.view,c.x,c.y),r={w:hfx.readUInt16LE(8+f.id*8),h:hfx.readUInt16LE(10+f.id*8)};
const colors=f.palette===null?[255,255,255]:[...pal.subarray(hud.spriteColors[f.palette]*4,hud.spriteColors[f.palette]*4+3)];
return [{id:f.id,x:q.x-(r.w>>1),y:q.y-r.h,width:r.w,height:r.h,color:(colors[0]<<16)|(colors[1]<<8)|colors[2]}]}""",cases,expected)
print('PASS: 512 complete native effect-cell queues and HFX painters; class/model/flags/ownership/fog gates, frame selection, original sizing/anchor and palette tint',flush=True)
