"""Compare complete 0x503550 / 0x503e60 sinking trajectories.
Only cell-list relocation and object removal are supplied. Includes native shape,
water-category probes, angle math, drift, tilt and 80-turn expiry.
Usage: python SCRIPT EXE [--record]
"""
import json,random,struct,subprocess,sys
from pathlib import Path
from unicorn import UC_HOOK_CODE
from unicorn.x86_const import UC_X86_REG_ESP,UC_X86_REG_EIP
from decomp import ROOT,native_cpu,configure_native_constants,load_native_shapes
exe=Path(sys.argv[1]);cpu,identity=native_cpu(exe);configure_native_constants(cpu,exe)
cpu.mem_map(0x2000000,0x40000);load_native_shapes(cpu,exe,0x2000000,0x2004000)
unit,stack,stop=0x2008000,0x203d000,0x203e000
rng=random.Random(0x503550);alive=True
fields={'x':(0x3d,'H'),'y':(0x3f,'H'),'h':(0x41,'h'),'angle':(0x26,'H'),'anchorX':(0x7a,'H'),'anchorY':(0x7c,'H'),'remaining':(0xa7,'b'),'phase':(0x2d,'B'),'tilt':(0x6c,'H'),'roll':(0x6e,'H'),'direction':(0x86,'h'),'target':(0x88,'h'),'speed':(0x8a,'h'),'fallSpeed':(0x8c,'h'),'spin':(0x8e,'h'),'spinDirection':(0x90,'h'),'sector':(0x92,'h'),'shoreScore':(0x94,'h')}
def write(a,f,*v):cpu.mem_write(a,struct.pack('<'+f,*v))
def read(a,f):return struct.unpack('<'+f,cpu.mem_read(a,struct.calcsize('<'+f)))[0]
def hook(c,a,size,u):
 global alive
 sp=c.reg_read(UC_X86_REG_ESP)
 if a==0x4edcf0:alive=False
 else:c.mem_write(unit+0x3d,bytes(c.mem_read(read(sp+8,'I'),6)))
 c.reg_write(UC_X86_REG_EIP,read(sp,'I'));c.reg_write(UC_X86_REG_ESP,sp+4)
for a in [0x4ee580,0x4edcf0]:cpu.hook_add(UC_HOOK_CODE,hook,begin=a,end=a)
def call():
 write(stack,'II',stop,unit);cpu.reg_write(UC_X86_REG_ESP,stack)
 cpu.emu_start(0x503550,stop,count=200000);assert cpu.reg_read(UC_X86_REG_EIP)==stop,hex(cpu.reg_read(UC_X86_REG_EIP))
cases=[];expected=[]
categoryFlags=json.loads((ROOT/'app/original-rules.json').read_text())['terrainCategoryFlags']
water=next(i for i,f in enumerate(categoryFlags) if f&2);dry=next(i for i,f in enumerate(categoryFlags) if not f&2)
for n in range(160):
 obj=[79,95,103,107,119,131,143,155][n%8]
 x,y=rng.choice([0,512,32768,65024]),rng.choice([0,512,32768,65024]);seed=rng.randrange(10000)
 categories=[water if n%5==0 or (n%5!=1 and ((i*17+seed)^(i>>7))%5<3) else dry for i in range(16384)]
 land=bytearray(16384*16)
 for i,c in enumerate(categories):struct.pack_into('<B',land,i*16+12,c)
 cpu.mem_write(0x8a03e4,bytes(land));cpu.mem_write(unit,bytes(256))
 b=dict(object=obj,x=x,y=y,h=128,angle=((n//8)%4)*512,anchorX=x,anchorY=y,remaining=80,phase=0,tilt=0,roll=0,direction=0,target=0,speed=0,fallSpeed=0,spin=0,spinDirection=0,sector=0,shoreScore=0,counter=n&255)
 if n>=120:b.update(phase=1,tilt=rng.randrange(2048),roll=rng.randrange(2048),direction=rng.randrange(2048),target=rng.randrange(2048),speed=26,fallSpeed=19,spin=54,spinDirection=rng.choice([-1,1]))
 for k,(o,f) in fields.items():write(unit+o,f,b[k])
 write(unit+0x33,'h',obj);alive=True;timeline=[]
 for turn in range(80):
  write(unit+0x2e,'B',(b['counter']+turn)&255)
  if alive:call()
  timeline.append(dict(b={k:read(unit+o,f) for k,(o,f) in fields.items()},alive=alive))
 cases.append(dict(b=b,seed=seed,mode=n%5));expected.append(timeline)
js="""
import {stepSinkingBuilding} from './app/building-sinking.ts';
let s='';for await(const c of process.stdin)s+=c;const {cases,water,dry,keys}=JSON.parse(s);
console.log(JSON.stringify(cases.map(c=>{
 const b={...c.b},land={categories:Uint8Array.from({length:16384},(_,i)=>c.mode===0||(c.mode!==1&&((i*17+c.seed)^(i>>7))%5<3)?water:dry)};let alive=true;
 return Array.from({length:80},(_,i)=>{b.counter=(c.b.counter+i)&255;if(alive)alive=stepSinkingBuilding(land,b);return {b:Object.fromEntries(keys.map(k=>[k,b[k]])),alive}});
})));
"""
r=subprocess.run(['node','--input-type=module','-e',js],input=json.dumps(dict(cases=cases,water=water,dry=dry,keys=list(fields))),capture_output=True,text=True,cwd=ROOT);assert r.returncode==0,r.stderr
actual=json.loads(r.stdout)
for i,(a,b) in enumerate(zip(actual,expected)):
 for t,(p,q) in enumerate(zip(a,b)):
  if p!=q:
   Path('/private/tmp/populous-building-sinking-mismatch.json').write_text(json.dumps(dict(case=cases[i],turn=t,browser=p,native=q),indent=2));raise AssertionError((i,t,p,q))
if '--record' in sys.argv:
 keep=list(range(0,len(cases),5))+list(range(5,15))
 (ROOT/'tests/fixtures/building-sinking.json').write_text(json.dumps(dict(executableSha256=identity['sha256'],water=water,dry=dry,keys=list(fields),cases=[cases[i] for i in keep],expected=[expected[i] for i in keep]),separators=(',',':'))+'\n')
print(f'PASS: {len(cases)*80:,} native sinking snapshots')
