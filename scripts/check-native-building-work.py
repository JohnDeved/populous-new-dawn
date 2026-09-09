"""Execute task-2 building activity and native geometry, arrival, waits and poses.
Routing, final animation/sound submission and resting-facing are supplied leaves.
Usage: python SCRIPT EXE [--record]
"""
import json,random,struct,subprocess,sys
from pathlib import Path
from unicorn import UC_HOOK_CODE
from unicorn.x86_const import UC_X86_REG_ESP,UC_X86_REG_EIP,UC_X86_REG_EAX
from decomp import ROOT,native_cpu,configure_native_constants,load_native_shapes
exe=Path(sys.argv[1]);cpu,identity=native_cpu(exe);configure_native_constants(cpu,exe)
cpu.mem_map(0x2000000,0x40000);load_native_shapes(cpu,exe,0x2000000,0x2004000)
p,plan,stack,stop=0x2010000,0x2011000,0x203d000,0x203e000
data=json.loads((ROOT/'app/original-shapes.json').read_text());rules=json.loads((ROOT/'app/original-rules.json').read_text())
rng=random.Random(0x4958f0)
def write(a,f,*v):cpu.mem_write(a,struct.pack('<'+f,*v))
def read(a,f):return struct.unpack('<'+f,cpu.mem_read(a,struct.calcsize('<'+f)))[0]
def hook(c,a,size,user):
 sp=c.reg_read(UC_X86_REG_ESP)
 if a in [0x4e9d80,0x4e9dd0]:
  to=read(sp+8,'I');x=read(to,'H');y=read(to+2,'H')
  events.append(['destination',dict(x=x,y=y),a==0x4e9dd0])
  if a==0x4e9dd0:return # Execute the original direct destination helper.
  write(p+0x4f,'HH',x,y)
 elif a==0x4d4040:events.append(['animation',read(sp+8,'H')])
 elif a==0x48a050:events.append(['sound',read(sp+8,'H'),read(sp+12,'H')])
 elif a==0x4eec80:events.append(['rest'])
 c.reg_write(UC_X86_REG_EAX,0);c.reg_write(UC_X86_REG_EIP,read(sp,'I'));c.reg_write(UC_X86_REG_ESP,sp+4)
for a in [0x4e9d80,0x4e9dd0,0x4d4040,0x48a050,0x4eec80]:cpu.hook_add(UC_HOOK_CODE,hook,begin=a,end=a)
fields={'model':(0x2b,'B'),'state':(0x2c,'B'),'physics':(0x30,'B'),'counter':(0x2e,'B'),
 'x':(0x3d,'H'),'y':(0x3f,'H'),'flags2':(0xc,'I'),'flags3':(0x14,'I'),'flags4':(0x10,'I'),
 'assignment':(0x76,'H'),'speed':(0x5f,'h'),'timer':(0x70,'h'),'cargo':(0x78,'H'),
 'angle':(0x26,'H'),'heading':(0x5d,'H'),'turnAngle':(0x57,'H'),'turnY':(0x59,'H'),
 'goalX':(0x4f,'H'),'goalY':(0x51,'H'),'destinationX':(0x53,'H'),'destinationY':(0x55,'H')}
cases=[];expected=[]
for model in [1,2,3,4,5,7]:
 for phase in [0,1,3,4,23,54,255]:
  for trial in range(64):
   obj=rules['buildingObjects'][model];direction=trial%4;index=data['objects'][obj][direction];s=data['shapes'][index]
   pose=dict(object=obj,angle=direction*512,anchorX=rng.choice([0,512,32768,65024]),anchorY=rng.choice([0,512,32768,65024]))
   cx=(pose['anchorX']>>8)-s['x'];cy=(pose['anchorY']>>8)-s['y']
   center=dict(x=(cx*256+s['inside'][0]*64)&65535,y=(cy*256+s['inside'][1]*64)&65535)
   outside=dict(x=(cx*256+s['outside'][0]*64)&65535,y=(cy*256+s['outside'][1]*64)&65535)
   point=rng.choice([center,outside]);x=(point['x']+rng.choice([0,56,111,112,311,312,1079,1080]))&65535;y=point['y']
   person=dict(model=rng.choice([2,3,7]),state=10,physics=rng.randrange(20),counter=rng.choice([0,1,2,255]),x=x,y=y,
    flags2=rng.choice([0,128,0x8000,0x80000,0x88080]),flags3=rng.choice([0,0x80000]),flags4=rng.choice([0,1,0x10407]),
    assignment=rng.choice([0,8,16,24,272]),speed=32,timer=rng.choice([-32768,-1,0,1,2,8,31]),cargo=rng.choice([0,100]),
    angle=rng.randrange(2048),heading=rng.randrange(2048),turnAngle=0,turnY=0,goalX=x,goalY=y,destinationX=0,destinationY=0)
   task=dict(task=2,busy=rng.choice([0,1,2,255]),phase=phase,restart=bool(rng.randrange(4)==0))
   site=dict(model=model,building=rng.choice([0,256,513]),occupied=rng.choice([0,1,256]),center=center,outside=outside)
   seed=rng.getrandbits(32);cpu.mem_write(p,bytes(256));cpu.mem_write(plan,bytes(256));cpu.mem_write(0x8a03e4,bytes(16384*16))
   for name,(offset,fmt) in fields.items():write(p+offset,fmt,person[name])
   write(p+0xc,'I',person['flags2']|(0x40000000 if task['restart'] else 0));write(p+0xa8,'B',phase);write(p+0xaa,'B',task['busy'])
   write(p+0x89,'H',1);write(0x890394,'I',plan);write(plan+0x68,'H',(cx&255)|((cy&255)<<8));write(plan+0x9b,'B',index)
   write(plan+0x9e,'B',model);write(plan+0x92,'H',site['building']);write(0x89d178,'I',seed)
   cell=((y>>9)*128+(x>>9));write(0x8a03e4+cell*16+8,'H',site['occupied'])
   events=[];write(stack,'II',stop,p);cpu.reg_write(UC_X86_REG_ESP,stack)
   cpu.emu_start(0x4958f0,stop,count=100000);assert cpu.reg_read(UC_X86_REG_EIP)==stop
   result={name:read(p+offset,fmt) for name,(offset,fmt) in fields.items()}
   restart=bool(result['flags2']&0x40000000);result['flags2']&=~0x40000000
   cases.append(dict(person=person,task=task,site=site,seed=seed))
   expected.append(dict(person=result,task=dict(task=2,busy=read(p+0xaa,'B'),phase=read(p+0xa8,'B'),restart=restart),randomState=read(0x89d178,'I'),events=events))
js="""import {stepBuildingWork} from './app/building-work.ts';import {setDirectPersonDestination,createMotionRoutes} from './app/person-routes.ts';
let input='';for await(const c of process.stdin)input+=c;console.log(JSON.stringify(JSON.parse(input).map(c=>{
const p={...c.person,motionGroup:0,motionIndex:0},task={...c.task},rng={randomState:c.seed},events=[];
stepBuildingWork(rng,p,task,c.site,{destination:(to,direct)=>{events.push(['destination',to,direct]);if(direct)setDirectPersonDestination(createMotionRoutes(),p,to);else{p.goalX=to.x;p.goalY=to.y}},animation:(_,id)=>events.push(['animation',id]),rest:()=>events.push(['rest']),sound:(cue,flags)=>events.push(['sound',cue,flags])});
delete p.motionGroup;delete p.motionIndex;return {person:p,task,randomState:rng.randomState,events};})));"""
r=subprocess.run(['node','--input-type=module','-e',js],input=json.dumps(cases),capture_output=True,text=True,cwd=ROOT);assert r.returncode==0,r.stderr
actual=json.loads(r.stdout);assert len(actual)==len(expected)
for i,(c,a,e) in enumerate(zip(cases,actual,expected)):
 if a!=e:
  Path('/private/tmp/populous-work-mismatch.json').write_text(json.dumps(dict(index=i,case=c,actual=a,expected=e),indent=2));raise AssertionError('See /private/tmp/populous-work-mismatch.json')
if '--record' in sys.argv:
 indexes=range(0,len(cases),5)
 (ROOT/'tests/fixtures/building-work.json').write_text(json.dumps(dict(executableSha256=identity['sha256'],cases=[cases[i] for i in indexes],expected=[expected[i] for i in indexes]),separators=(',',':'))+'\n')
print(f'PASS: {len(cases)} complete native building-work controllers: all phases, geometry, movement speed/RNG, readiness, facing, poses, sound and signed wait boundaries')
