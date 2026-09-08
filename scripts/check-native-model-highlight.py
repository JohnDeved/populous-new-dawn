"""Compare complete normal/construction renderer hover colors and ownership.
Original model, transforms, sunlight and triangle queues execute. Projection is
supplied to keep one face visible; this does not validate picking ownership.
Usage: python scripts/check-native-model-highlight.py /path/to/d3dpoptb.exe
"""
import hashlib,json,random,struct,subprocess,sys
from pathlib import Path
from unicorn import UC_HOOK_CODE
from unicorn.x86_const import UC_X86_REG_ESP,UC_X86_REG_EIP
from decomp import native_cpu,ROOT
cpu,_=native_cpu(Path(sys.argv[1]));cpu.mem_map(0x2000000,0x1000000)
unit,objects,faces,points,camera,pool,stack,stop=0x2000000,0x2010000,0x2020000,0x2200000,0x2001000,0x2400000,0x2ffd000,0x2ffe000
rng=random.Random(4711)
def write(a,f,*v):cpu.mem_write(a,struct.pack('<'+f,*v))
def read(a,f):return struct.unpack('<'+f,cpu.mem_read(a,struct.calcsize('<'+f)))[0]
def call(a,*args):
    write(stack,'I'*(len(args)+1),stop,*args);cpu.reg_write(UC_X86_REG_ESP,stack)
    cpu.emu_start(a,stop,count=1000000);assert cpu.reg_read(UC_X86_REG_EIP)==stop
source=Path(sys.argv[1]).parent/'objects';raw={n:(source/f'{n}0-2.dat').read_bytes() for n in ['objs','facs','pnts']}
provenance=json.loads((ROOT/'public/original/provenance.json').read_text())['sha256']
for n,b in raw.items():assert hashlib.sha256(b).hexdigest()==provenance[f'objects/{n}0-2.dat']
for a,n in [(objects,'objs'),(faces,'facs'),(points,'pnts')]:cpu.mem_write(a,raw[n])
for i in range(len(raw['objs'])//54):
    for off,stride,base in [(16,60,faces),(20,60,faces),(24,6,points),(28,6,points)]:
        n=read(objects+i*54+off,'I');write(objects+i*54+off,'I',base+(n-1)*stride if n else 0)
write(0x895ec1,'I',objects);write(0x895ec5,'I',faces);write(0x74a350,'I',camera)
write(0x75d504,'I',pool+0x10000);write(0x87ca90,'HH',1024,768);write(0x895dd1,'BB',32,32)
call(0x401040);call(0x40cde0,0x87cb03)
obj=objects+131*54;face=read(obj+16,'I');write(obj+2,'h',1);write(face+6,'B',3);write(face+59,'B',15)
indices=list(struct.unpack('<3h',cpu.mem_read(face+40,6)))
def project(cpu,a,size,user):
    sp=cpu.reg_read(UC_X86_REG_ESP);p=read(sp+4,'I');index=(p-0x74daf8)//32
    corner=indices.index(index) if index in indices else 0
    write(p+8,'iff',-4000,[100,200,100][corner],[100,100,200][corner])
    cpu.reg_write(UC_X86_REG_EIP,read(sp,'I'));cpu.reg_write(UC_X86_REG_ESP,sp+4)
cpu.hook_add(UC_HOOK_CODE,project,begin=0x46de00,end=0x46de00)
cases,expected=[],[]
for construction in [False,True]:
 for kind in [2,4,5,6]:
  for model in [1,8]:
   for owner in [-1,0,1,2]:
    for all_tribes in [False,True]:
     for access in [0,16]:
      for turn in [0,2]:
       case=dict(object=dict(type=kind,model=model,owner=owner,buildingFlags=access),turn=turn,player=0,allTribes=all_tribes,construction=construction)
       cpu.mem_write(unit,bytes(256));write(unit+0x24,'H',1);write(unit+0x2a,'BB',kind,model);write(unit+0x2f,'b',owner)
       write(unit+0x33,'HH',131,32);write(unit+0x9c,'H',access);write(0x75d508,'I',pool)
       write(0x74a2f0,'B',1);write(0x74a33c,'B',int(all_tribes));write(0x87cace,'H',1);write(0x89c6f0,'B',0);write(0x897987,'B',(turn//2)&1)
       call(0x471c40 if construction else 0x4708d0,unit)
       count=(read(0x75d508,'I')-pool)//70
       assert count==1,(case,count)
       colors=[read(pool+off,'I') for off in [22,42,62]];assert len(set(colors))==1
       cases.append(case);expected.append(colors[0]&255 if colors[0]&0xff000000 else 0)
js="""import {modelHighlight} from './app/model-lighting.ts';let s='';for await(const c of process.stdin)s+=c;console.log(JSON.stringify(JSON.parse(s).map(c=>modelHighlight(c.object,c.turn,c))));"""
r=subprocess.run(['node','--input-type=module','-e',js],input=json.dumps(cases),text=True,capture_output=True,cwd=ROOT);assert r.returncode==0,r.stderr
actual=json.loads(r.stdout)
for i,(a,b) in enumerate(zip(actual,expected)):assert a==b,(cases[i],a,b)
print(f'PASS: {len(cases):,} complete native normal/construction renderer hover gates and emitted gray/white colors')

# Execute the original presentation phase loop, without the rest of its UI loop.
for turn in [0,1,2,3,4,5,0x7fffffff,0xffffffff]+[rng.getrandbits(32) for _ in range(248)]:
    write(0x89d184,'I',turn)
    cpu.reg_write(UC_X86_REG_ESP,stack)
    cpu.emu_start(0x4a470b,0x4a472d,count=100)
    assert cpu.reg_read(UC_X86_REG_EIP)==0x4a472d
    assert read(0x897987,'B')==(turn>>1)&1
print('PASS: 256 native hover phase updates, including unsigned turn boundaries')
