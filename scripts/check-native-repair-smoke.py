"""Run 0x40afd0 smoke cleanup through native shape traversal and cell lists.
Only the final terrain-queue consumer is captured. Usage: python SCRIPT EXE [--record]
"""
import json,random,struct,subprocess,sys
from pathlib import Path
from unicorn import UC_HOOK_CODE
from unicorn.x86_const import UC_X86_REG_ESP,UC_X86_REG_EIP
from decomp import ROOT,native_cpu,load_native_shapes
exe=Path(sys.argv[1]);cpu,identity=native_cpu(exe);cpu.mem_map(0x2000000,0x80000)
load_native_shapes(cpu,exe,0x2000000,0x2004000)
p,smokes,stack,stop=0x2010000,0x2020000,0x207d000,0x207e000
data=json.loads((ROOT/'app/original-shapes.json').read_text());rng=random.Random(0x40afd0)
def write(a,f,*v):cpu.mem_write(a,struct.pack('<'+f,*v))
def read(a,f):return struct.unpack('<'+f,cpu.mem_read(a,struct.calcsize('<'+f)))[0]
def queue(c,a,size,user):
 sp=c.reg_read(UC_X86_REG_ESP);refresh.append(dict(center=read(sp+4,'H'),radius=read(sp+8,'h'),texture=read(sp+12,'B')))
 c.reg_write(UC_X86_REG_EIP,read(sp,'I'));c.reg_write(UC_X86_REG_ESP,sp+4)
cpu.hook_add(UC_HOOK_CODE,queue,begin=0x44ddf0,end=0x44ddf0)
cases=[];expected=[]
for obj,indices in enumerate(data['objects']):
 for direction,index in enumerate(indices):
  s=data['shapes'][index];pose=dict(object=obj,angle=direction*512,anchorX=rng.randrange(128)*512,anchorY=rng.randrange(128)*512)
  cx=(pose['anchorX']>>8)-s['x'];cy=(pose['anchorY']>>8)-s['y']
  for cls in [2,9]:
   cpu.mem_write(0x8a03e4,bytes(16384*16));cpu.mem_write(p,bytes(256))
   write(p+0x2a,'B',cls);write(p+0x33,'h',obj);write(p+0x26,'h',pose['angle']);write(p+0x7a,'HH',pose['anchorX'],pose['anchorY'])
   write(p+0x68,'H',(cx&255)|((cy&255)<<8));write(p+0x9b,'B',index)
   records=[]
   for y in range(-1,s['height']+1):
    for x in range(-1,s['width']+1):
     cell=(((cy+y*2)&254)>>1)*128+(((cx+x*2)&254)>>1)
     id=len(records)+1;a=smokes+id*256;cpu.mem_write(a,bytes(256));write(0x890390+id*4,'I',a)
     model=77 if id%5==0 else 76;life=[64,1,0,-1,32767][id%5]
     write(a+0x2a,'BB',7,model);write(a+0x6c,'h',life);write(0x8a03e4+cell*16+6,'H',id)
     records.append(dict(cell=cell,model=model,lifetime=life))
   refresh=[];write(stack,'II',stop,p);cpu.reg_write(UC_X86_REG_ESP,stack)
   cpu.emu_start(0x40afd0,stop,count=100000);assert cpu.reg_read(UC_X86_REG_EIP)==stop
   cases.append(dict(pose=pose,cls=cls,records=records))
   expected.append(dict(lifetimes=[read(smokes+(i+1)*256+0x6c,'h') for i in range(len(records))],refresh=refresh))
js="""import {buildingRepairArea} from './app/building-shapes.ts';let input='';for await(const c of process.stdin)input+=c;
console.log(JSON.stringify(JSON.parse(input).map(c=>{const a=buildingRepairArea(c.pose),cells=new Set(a.cells);
return {lifetimes:c.records.map(s=>s.model===76&&s.lifetime>0&&cells.has(s.cell)?16:s.lifetime),refresh:[{center:a.center,radius:a.radius,texture:1}]}})));"""
r=subprocess.run(['node','--input-type=module','-e',js],input=json.dumps(cases),capture_output=True,text=True,cwd=ROOT);assert r.returncode==0,r.stderr
actual=json.loads(r.stdout);assert len(actual)==len(expected)
for c,a,e in zip(cases,actual,expected):assert a==e,(c,a,e)
if '--record' in sys.argv:
 indexes=range(0,len(cases),7)
 (ROOT/'tests/fixtures/repair-smoke.json').write_text(json.dumps(dict(executableSha256=identity['sha256'],cases=[cases[i] for i in indexes],expected=[expected[i] for i in indexes]),separators=(',',':'))+'\n')
print(f'PASS: {len(cases)} complete native repair smoke controllers across all object headings, building/plan inputs and wrapped cell boundaries')
