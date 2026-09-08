"""Compare original 0x471c40 face selection/cap UVs with browser stage meshes.
Usage: python scripts/check-native-building-faces.py /path/to/d3dpoptb.exe
Projection and normal consumers are supplied; triangles are compared without
winding/order. This does not verify lighting, clipping or the full render loop.
"""
import hashlib,json,struct,subprocess,sys
from pathlib import Path
from decomp import native_cpu
from unicorn import UC_HOOK_CODE
from unicorn.x86_const import UC_X86_REG_ESP,UC_X86_REG_EIP,UC_X86_REG_EAX
root=Path(__file__).resolve().parents[1];exe=Path(sys.argv[1]);cpu,_=native_cpu(exe);cpu.mem_map(0x2000000,0x1000000)
unit,objects,faces,points,temp,polygons,stack,stop=0x2000000,0x2010000,0x2020000,0x2200000,0x74daf8,0x2400000,0x2ffd000,0x2ffe000
source=exe.parent/'objects';raw={n:(source/f'{n}0-2.dat').read_bytes() for n in ['objs','facs','pnts']}
provenance=json.loads((root/'public/original/provenance.json').read_text())['sha256']
for n,b in raw.items():assert hashlib.sha256(b).hexdigest()==provenance[f'objects/{n}0-2.dat']
def write(a,f,*v):cpu.mem_write(a,struct.pack('<'+f,*v))
def read(a,f):return struct.unpack('<'+f,cpu.mem_read(a,struct.calcsize('<'+f)))[0]
for a,n in [(objects,'objs'),(faces,'facs'),(points,'pnts')]:cpu.mem_write(a,raw[n])
for i in range(len(raw['objs'])//54):
    for off,stride,base in [(16,60,faces),(20,60,faces),(24,6,points),(28,6,points)]:
        n=read(objects+i*54+off,'I');write(objects+i*54+off,'I',base+(n-1)*stride if n else 0)
write(0x895ec1,'I',objects);write(0x895ec5,'I',faces);write(0x74a350,'I',unit+256)
write(0x75d504,'I',polygons+0x10000);write(0x87ca90,'HH',1024,768);write(0x895dd1,'BB',32,32)
def call(a,*args):
    write(stack,'I'*(1+len(args)),stop,*args);cpu.reg_write(UC_X86_REG_ESP,stack)
    cpu.emu_start(a,stop,timeout=1000000,count=1000000)
    assert cpu.reg_read(UC_X86_REG_EIP)==stop,hex(cpu.reg_read(UC_X86_REG_EIP))
def consumer(cpu,a,s,u):
    sp=cpu.reg_read(UC_X86_REG_ESP);p=read(sp+4,'I')
    if a==0x46de00:
        # An in-bounds projection encodes source vertex identity in screen X.
        # Collinear points retain every triangle and use the native reverse winding.
        write(p+12,'ff',100+(p-temp)//32,200)
    cpu.reg_write(UC_X86_REG_EAX,0);cpu.reg_write(UC_X86_REG_EIP,read(sp,'I'));cpu.reg_write(UC_X86_REG_ESP,sp+4)
for a in [0x46de00,0x40cd00]:cpu.hook_add(UC_HOOK_CODE,consumer,begin=a,end=a)
call(0x40cde0,0x87cb03)
assert struct.unpack('<8i',cpu.mem_read(0x87cb03,32))==(0,0,2097150,0,2097150,2097150,0,2097150)
cases=[];expected=[];triangles=0

def capture(id,stage,tribe,patch=None):
    global triangles
    cpu.mem_write(unit,bytes(256));write(unit+0x24,'H',1);write(unit+0x2a,'BBB',2,1,1);write(unit+0x2f,'b',tribe)
    write(unit+0x33,'HH',id,32);write(unit+0x78,'B',stage);write(0x75d508,'I',polygons)
    obj=objects+id*54;face=read(obj+16,'I');saved=bytes(cpu.mem_read(face,60));nf=read(obj+2,'h')
    if patch:
        write(obj+2,'h',1);write(face+6,'B',patch['n']);write(face+59,'B',patch['flags'])
    call(0x471c40,unit)
    count=(read(0x75d508,'I')-polygons)//70;triangles+=count;result=[];scale=read(obj+12,'i')*3
    start=read(obj+24,'I')
    for a in range(polygons,polygons+count*70,70):
        if read(a+69,'B') == 0:continue # 0x4673b0 skips picking-only submissions.
        assert read(a,'B')==6;tile=(read(a+68,'B')-1)&255;vertices=[]
        for off in [6,26,46]:
            idx=int(read(a+off,'f')-100);x,y,z=struct.unpack('<3h',cpu.mem_read(start+idx*6,6))
            u,v=struct.unpack('<2i',cpu.mem_read(a+off+8,8))
            vertices.append([round(x/scale,6),round(y/scale,6),round(-z/scale,6),round((tile%8+u/0x200000)/8,7),round(1-(tile//8+v/0x200000)/32,7)])
        result.append(sorted(vertices))
    cases.append(dict(id=id,stage=stage,patch=patch));expected.append(sorted(result))
    write(obj+2,'h',nf);cpu.mem_write(face,saved)

for id in [79,80,95,96,103,104,*range(107,143)]:
    for stage in range(4):capture(id,stage,(id-107)%12//3 if id>=107 else int(id in [80,96,104]))
for flags in range(256):
    for n in [3,4]:
        for stage in range(4):capture(131,stage,0,dict(n=n,flags=flags))
js="""import models from './app/original-models.json' with {type:'json'};
import {modelStage} from './app/model-faces.ts';let input='';for await(const c of process.stdin)input+=c;
const cmp=(a,b)=>{a=a.flat();b=b.flat();for(let i=0;i<a.length;i++)if(a[i]!==b[i])return a[i]-b[i];return 0;};
console.log(JSON.stringify(JSON.parse(input).map(c=>{
 let d=models[c.id];if(c.patch){const count=c.patch.n===3?3:6;d={...d,p:d.p.slice(0,count*3),uv:d.uv.slice(0,count*2),faces:[c.patch.n,c.patch.flags]};}
 const {p,uv}=modelStage(d,c.stage),tris=[];
 for(let i=0;i<p.length/3;i+=3){const vertices=[];for(let k=i;k<i+3;k++)vertices.push([...p.slice(k*3,k*3+3),...uv.slice(k*2,k*2+2).map(n=>Math.round(n*1e7)/1e7)]);tris.push(vertices.sort(cmp));}
 return tris.sort(cmp);
})));"""
r=subprocess.run(['node','--input-type=module','-e',js],input=json.dumps(cases),capture_output=True,text=True,cwd=root);assert r.returncode==0,r.stderr
actual=json.loads(r.stdout);assert len(actual)==len(expected)
for i,(a,b) in enumerate(zip(expected,actual)):
    if a!=b:
        p=Path('/private/tmp/populous-building-faces-failure.json');p.write_text(json.dumps(dict(case=cases[i],native=a,browser=b),indent=2));raise AssertionError((i,str(p)))
print(f'PASS: {len(cases):,} complete native stage-renderer calls, {triangles:,} triangles: original models, all 256 face flags, triangle/quad cap UVs')
