"""Compare original effect 3/4/10 initialization, physics and both trail phases.
Only class callbacks, cell insertion and final free are intercepted. Native
terrain queries, directed physics, caps, animation and phase dispatch execute.
Usage: python scripts/check-native-spell-trails.py EXE
"""
import json,random,struct,subprocess,sys
from pathlib import Path
from unicorn import UC_HOOK_CODE
from unicorn.x86_const import UC_X86_REG_ESP,UC_X86_REG_EIP
from decomp import native_cpu,ROOT
cpu,_=native_cpu(Path(sys.argv[1]));cpu.mem_map(0x2000000,0x20000)
p,stack,stop=0x2000000,0x201d000,0x201e000
write=lambda a,f,*v:cpu.mem_write(a,struct.pack('<'+f,*v))
read=lambda a,f:struct.unpack('<'+f,cpu.mem_read(a,struct.calcsize('<'+f)))[0]
rng=random.Random(0x50bd70)
land=dict(heights=[rng.randrange(1025) for _ in range(16384)],flags=[rng.randrange(2) for _ in range(16384)])
for i,(h,flags) in enumerate(zip(land['heights'],land['flags'])):write(0x8a03e4+i*16,'Ih',flags,h)
fields={'object':(0x33,'H'),'renderFlags':(0x35,'H'),'f1':(0x37,'h'),'f2':(0x39,'B'),
 'draw':(0x3a,'B'),'morph':(0x3b,'B'),'palette':(0x3c,'B'),'state':(0x2c,'B'),
 'remaining':(0x6c,'h'),'x':(0x3d,'H'),'y':(0x3f,'H'),'h':(0x41,'h'),
 'flags2':(0xc,'I'),'flags4':(0x10,'I'),'speed':(0x5f,'h'),'yaw':(0x57,'H'),'pitch':(0x59,'H')}
def hook(c,a,size,user):
 global alive
 sp=c.reg_read(UC_X86_REG_ESP)
 if a==0x4ef180:alive=False
 if a==0x4ee580:
  pos=read(sp+8,'I');c.mem_write(p+0x3d,bytes(c.mem_read(pos,6)))
 c.reg_write(UC_X86_REG_EIP,read(sp,'I'));c.reg_write(UC_X86_REG_ESP,sp+4)
for a in [0x4ed6f0,0x4ed640,0x4ee580,0x4ef180]:cpu.hook_add(UC_HOOK_CODE,hook,begin=a,end=a)
def call(a):
 write(stack,'II',stop,p);cpu.reg_write(UC_X86_REG_ESP,stack);cpu.emu_start(a,stop,count=100000)
 assert cpu.reg_read(UC_X86_REG_EIP)==stop,hex(cpu.reg_read(UC_X86_REG_EIP))
def snapshot():
 out={k:read(p+off,f) for k,(off,f) in fields.items()}
 out['velocity']={k:read(p+0x49+i*2,'h') for i,k in enumerate(['x','y','z'])}
 return dict(p=out,alive=alive,randomState=read(0x89bc72,'I'))

cases=[];expected=[]
for i in range(384):
 model=[3,4,10][i%3];position=dict(x=rng.randrange(65536),y=rng.randrange(65536),h=rng.randrange(-512,2049));counter=i&255
 seed=rng.randrange(2**32);write(0x89bc72,'I',seed)
 cpu.mem_write(p,bytes(256));write(p+0x2a,'BB',7,model);write(p+0x30,'B',10);write(p+0x2e,'B',counter)
 write(p+0x3d,'HHh',position['x'],position['y'],position['h']);alive=True
 call(0x50bf60 if model==3 else 0x50c380 if model==4 else 0x50c410);initial=snapshot()
 # Half the cases retain live defaults. The others exercise directed motion,
 # stopped motion, indefinite lifetime and the alternate phase palette path.
 override={}
 if i%4>=2:
  override=dict(speed=rng.choice([-1,0,20,70,1000,32767]),yaw=rng.randrange(65536),pitch=rng.randrange(65536),
   remaining=rng.choice([-1,0,1,4]),palette=rng.choice([0,15,239,240,255]),
   flags2=read(p+0xc,'I')|rng.choice([0,2,0x4000]),flags4=read(p+0x10,'I')|rng.choice([0,0x200]),
   renderFlags=read(p+0x35,'H')|rng.choice([0,0x10,0x40,0x8000]))
 elif model==3:override['remaining']=0 # Actual 0x4bb440 jitter override.
 for k,v in override.items():off,f=fields[k];write(p+off,f,v)
 timeline=[snapshot()]
 for turn in range(10):
  if alive:
   call(0x4ee7b0);call(0x4ee7b0);call(0x50a750)
  timeline.append(snapshot())
 cases.append(dict(model=model,position=position,counter=counter,seed=seed,override=override));expected.append(dict(initial=initial,timeline=timeline))

js="""import {createSpellTrail,stepSpellTrail} from './app/spell-trails.ts';
import {stepObjectAnimation} from './app/animation.ts';
let s='';for await(const b of process.stdin)s+=b;const {land,cases,keys}=JSON.parse(s);
console.log(JSON.stringify(cases.map(c=>{const random={randomState:c.seed},p=createSpellTrail(land,c.position,c.model,c.counter,random);let alive=true;
const snap=()=>({p:Object.fromEntries([...keys,'velocity'].map(k=>[k,structuredClone(p[k])])),alive,randomState:random.randomState});
const initial=snap();Object.assign(p,c.override);const timeline=[snap()];
for(let i=0;i<10;i++){if(alive){for(let j=0;j<2;j++)stepObjectAnimation(p,{counter:0,levelFlags:0,levelFlags2:0},{frameCounts:[],modelFrames:[],morphDurations:[]},()=>{});alive=stepSpellTrail(land,p);}timeline.push(snap());}
return {initial,timeline};})));"""
actual=json.loads(subprocess.check_output(['node','--input-type=module','-e',js],input=json.dumps(dict(land=land,cases=cases,keys=list(fields))).encode(),cwd=ROOT))
if actual!=expected:
 i=next(i for i,(a,e) in enumerate(zip(actual,expected)) if a!=e)
 Path('/private/tmp/populous-trail-failure.json').write_text(json.dumps(dict(case=cases[i],native=expected[i],browser=actual[i]),indent=2))
 raise AssertionError(f'Case {i}: /private/tmp/populous-trail-failure.json')
print('PASS: 384 native trail initializations and 4224 timeline snapshots; native directed physics, terrain, caps, animation, phase transition, deletion and cosmetic RNG execute')
