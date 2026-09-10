"""Original 00518630 outdoor encounter controller, animation and slope impulse.
Only terminal deletion/fight creation and sound submission are observed consumers.
Building phases and initial allocation/state entry are separate checks.
"""
import json,random,struct,subprocess,sys
from pathlib import Path
from unicorn import UC_HOOK_CODE
from unicorn.x86_const import UC_X86_REG_ESP,UC_X86_REG_EIP
from decomp import native_cpu,configure_native_constants,ROOT

exe=Path(sys.argv[1]);cpu,_=native_cpu(exe);configure_native_constants(cpu,exe)
cpu.mem_map(0x2000000,0x20000)
attacker,defender,group,counts,stack,stop=0x2000000,0x2000200,0x2000400,0x2008000,0x201d000,0x201e000
rng=random.Random(0x518630)
def write(a,f,*v):cpu.mem_write(a,struct.pack('<'+f,*v))
def read(a,f):return struct.unpack('<'+f,cpu.mem_read(a,struct.calcsize('<'+f)))[0]
starts=list(struct.iter_unpack('<HH',(exe.parent/'data/vstart-0.ani').read_bytes()))
frames=list(struct.iter_unpack('<HBBBBH',(exe.parent/'data/vfra-0.ani').read_bytes()))
write(0x59df44,'I',counts)
for i,(start,_) in enumerate(starts):
 frame,seen=start,set()
 while frame and frame not in seen:seen.add(frame);frame=frames[frame][-1]
 assert frame in [0,start];write(counts+i*6+1,'B',len(seen)&255)
write(0x890394,'2I',attacker,defender);write(0x89c6f0,'B',0)
heights=[100+(i%128)*3 for i in range(16384)]
for i,h in enumerate(heights):write(0x8a03e4+i*16,'Ih',i&1,h)
fields={'id':(0x24,'H'),'class':(0x2a,'B'),'model':(0x2b,'B'),'state':(0x2c,'B'),'substate':(0x2d,'B'),'tribe':(0x2f,'b'),'physics':(0x30,'B'),'x':(0x3d,'H'),'y':(0x3f,'H'),'h':(0x41,'h'),'flags2':(0xc,'I'),'flags3':(0x14,'I'),'flags4':(0x10,'I'),'speed':(0x5f,'h'),'cargo':(0x78,'h'),'angle':(0x26,'H'),'heading':(0x5d,'H'),'turnAngle':(0x57,'H'),'turnY':(0x59,'H'),'goalX':(0x4f,'H'),'goalY':(0x51,'H'),'destinationX':(0x53,'H'),'destinationY':(0x55,'H'),'motionGroup':(0x63,'h'),'motionIndex':(0x67,'B'),'assignment':(0x76,'H'),'timer':(0x70,'h'),'slowTurn':(0x7e,'b'),'workFlags':(0x9d,'H'),'object':(0x33,'H'),'renderFlags':(0x35,'H'),'f1':(0x37,'h'),'f2':(0x39,'B'),'draw':(0x3a,'B'),'morph':(0x3b,'B'),'palette':(0x3c,'B')}
def snapshot(a):return {**{k:read(a+off,f) for k,(off,f) in fields.items()},'velocity':dict(zip(['x','y','z'],struct.unpack('<3h',cpu.mem_read(a+0x49,6))))}
def consumer(c,a,size,user):
 global outcome
 sp=c.reg_read(UC_X86_REG_ESP)
 if a==0x4edcf0:outcome='cancelled'
 elif a==0x51de60:outcome='fight'
 else:sounds.append([read(read(sp+4,'I')+0x24,'H'),read(sp+8,'I')])
 c.reg_write(UC_X86_REG_EIP,read(sp,'I'));c.reg_write(UC_X86_REG_ESP,sp+4)
for a in [0x4edcf0,0x51de60,0x48a050]:cpu.hook_add(UC_HOOK_CODE,consumer,begin=a,end=a)
rules=json.loads((ROOT/'app/original-rules.json').read_text());cases=[];expected=[]
for n in range(4096):
 people=[];x=rng.choice([0,32760,65530,rng.randrange(65536)]);y=rng.randrange(65536)
 for id_,address in [(1,attacker),(2,defender)]:
  p={k:0 for k in fields};model=rng.choice([2,3,7]);obj,draw=rules['animationObjects'][rules['personAnimationObjects'][rng.choice([0,1,10,11,21])*9+model]]
  p.update(id=id_,**{'class':1},model=model,tribe=id_-1,state=29,substate=rng.choice([0,4,5,6,7,8]),physics=rules['personModels'][model]['physics'],x=(x+(0 if id_==1 else rng.choice([-315,-314,0,314,315,1000])))&65535,y=y,h=100,flags2=rng.choice([0,0x40000000,0x40008080,0x80000,0x40080000]),flags3=rng.choice([0,0x80000]),flags4=rng.choice([0,0x400]),speed=rng.randrange(100),timer=rng.choice([-32768,-1,0,1,2,3,39,40,32767]),cargo=rng.choice([0,100]),object=obj,draw=draw,f1=1,angle=rng.randrange(2048),heading=rng.randrange(2048),workFlags=3)
  if n%13==0 and id_==2:p['state']=17
  if n%23==0:p['tribe']=id_
  if n%17==0:p['tribe']=0
  p['velocity']={k:rng.randrange(-100,100) for k in ['x','y','z']}
  cpu.mem_write(address,bytes(256))
  for k,(off,f) in fields.items():write(address+off,f,p[k])
  write(address+0x49,'3h',*p['velocity'].values());people.append(p)
 seed=rng.getrandbits(32);flags=64 if n%5==0 else 0;activity=n%3
 write(0x89d167,'B',activity)
 cpu.mem_write(group,bytes(256));write(group+0x6a,'2H',1,2);write(0x89d178,'I',seed);write(0x89d17c,'I',flags)
 write(stack,'2I',stop,group);cpu.reg_write(UC_X86_REG_ESP,stack);sounds=[];outcome='waiting'
 cpu.emu_start(0x518630,stop,count=100000);assert cpu.reg_read(UC_X86_REG_EIP)==stop
 cases.append(dict(people=people,randomState=seed,gameFlags=flags,playerTribe=0,musicActivity=activity))
 expected.append(dict(people=[snapshot(attacker),snapshot(defender)],randomState=read(0x89d178,'I'),musicActivity=read(0x89d167,'B'),sounds=sounds,outcome=outcome))
js="""
import {stepMeleeEncounter} from './app/melee-encounter.ts';import {createMotionRoutes} from './app/person-routes.ts';import {setPersonAnimation} from './app/animation.ts';import {terrainPointHeight} from './app/native-terrain.ts';import sprites from './app/original-units.json' with {type:'json'};
let text='';for await(const c of process.stdin)text+=c;const input=JSON.parse(text),land={heights:input.heights,flags:Uint32Array.from({length:16384},(_,i)=>i&1)};
console.log(JSON.stringify(input.cases.map(c=>{const w={...c,routes:createMotionRoutes()},sounds=[];
const outcome=stepMeleeEncounter(w,...c.people,{animation:(p,object)=>setPersonAnimation(p,object,{playerTribe:0,gameFlags:c.gameFlags,sessionSubstate:null,tribes:Array.from({length:4},()=>({flags:0,playerType:0})),objects:new Map()},sprites),height:(x,y)=>terrainPointHeight(land,{x,y}),sound:(p,cue)=>sounds.push([p.id,cue])});
if(outcome!=='waiting')for(const p of c.people)p.workFlags=0;
return {people:c.people,randomState:w.randomState,musicActivity:w.musicActivity,sounds,outcome};})));
"""
r=subprocess.run(['node','--input-type=module','-e',js],input=json.dumps(dict(cases=cases,heights=heights)),capture_output=True,text=True,cwd=ROOT);assert r.returncode==0,r.stderr
actual=json.loads(r.stdout);assert len(actual)==len(expected)
for i,(a,e) in enumerate(zip(actual,expected)):
 if a!=e:
  path=Path('/private/tmp/populous-encounter-failure.json');path.write_text(json.dumps(dict(case=cases[i],native=e,browser=a),indent=2));raise AssertionError((i,str(path)))
print('PASS: 4096 original outdoor encounter controller calls, poses/timers/facing, speed and impulse RNG, slope velocity, ordered sound, music activity and completion/cancellation.')
if '--record' in sys.argv:
 (ROOT/'tests/fixtures/melee-encounter.json').write_text(json.dumps(dict(heights=heights,cases=[dict(input=cases[i],expected=expected[i]) for i in range(0,4096,29)]),separators=(',',':'))+'\n')
