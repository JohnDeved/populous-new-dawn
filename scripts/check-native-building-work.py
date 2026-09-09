"""Execute task-2 building activity and native geometry, arrival, waits and poses.
Routing, final animation/sound submission and resting-facing are supplied leaves.
Usage: python SCRIPT EXE [--departure | --approach] [--record]
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
departure='--departure' in sys.argv;approaching='--approach' in sys.argv
entry=0x495520 if approaching else 0x497690 if departure else 0x4958f0
rng=random.Random(entry)
def write(a,f,*v):cpu.mem_write(a,struct.pack('<'+f,*v))
def read(a,f):return struct.unpack('<'+f,cpu.mem_read(a,struct.calcsize('<'+f)))[0]
def hook(c,a,size,user):
 sp=c.reg_read(UC_X86_REG_ESP)
 if a in [0x4e9d80,0x4e9dd0]:
  to=read(sp+8,'I');x=read(to,'H');y=read(to+2,'H')
  events.append(['destination',dict(x=x,y=y),a==0x4e9dd0])
  if a==0x4e9dd0:return # Execute the original direct destination helper.
  write(p+0x4f,'HH',x,y)
 elif a==0x4ed8a0:
  assert [read(sp+off,'I')&255 for off in [4,8,12]]==[5,11,255]
  allowed=sum(e[0]=='allocateLog' and e[1] for e in events)<allocationLimit
  events.append(['allocateLog',allowed]);c.reg_write(UC_X86_REG_EAX,0x2013000 if allowed else 0)
  c.reg_write(UC_X86_REG_EIP,read(sp,'I'));c.reg_write(UC_X86_REG_ESP,sp+4);return
 elif a==0x4ea460:
  events.append(['releaseMotion']);return # Execute native route release (empty route here).
 elif a==0x4d4040:events.append(['animation',read(sp+8,'H')])
 elif a==0x48a050:events.append(['sound',read(sp+8,'H'),read(sp+12,'H')])
 elif a==0x4eec80:events.append(['rest'])
 c.reg_write(UC_X86_REG_EAX,0);c.reg_write(UC_X86_REG_EIP,read(sp,'I'));c.reg_write(UC_X86_REG_ESP,sp+4)
for a in [0x4e9d80,0x4e9dd0,0x4d4040,0x48a050,0x4eec80,0x4ea460,0x4ed8a0]:cpu.hook_add(UC_HOOK_CODE,hook,begin=a,end=a)
fields={'model':(0x2b,'B'),'state':(0x2c,'B'),'physics':(0x30,'B'),'counter':(0x2e,'B'),
 'x':(0x3d,'H'),'y':(0x3f,'H'),'flags2':(0xc,'I'),'flags3':(0x14,'I'),'flags4':(0x10,'I'),
 'assignment':(0x76,'H'),'speed':(0x5f,'h'),'timer':(0x70,'h'),'cargo':(0x78,'H'),
 'angle':(0x26,'H'),'heading':(0x5d,'H'),'turnAngle':(0x57,'H'),'turnY':(0x59,'H'),
 'goalX':(0x4f,'H'),'goalY':(0x51,'H'),'destinationX':(0x53,'H'),'destinationY':(0x55,'H')}
if approaching:fields.update(anchorX=(0x68,'H'),anchorY=(0x6a,'H'),anchorFlags=(0x82,'B'),motionTimer=(0x61,'h'),motionMode=(0x66,'B'))
cases=[];expected=[]
for model in ([1,2,3,4,5,7,13,14] if departure or approaching else [1,2,3,4,5,7]):
 for phase in ([0,15,255] if approaching else [0,2,3,4,5,6,18,19,21,255] if departure else [0,1,3,4,23,54,255]):
  for trial in range(128 if approaching else 64):
   obj=rules['buildingObjects'][model];direction=trial%4;index=data['objects'][obj][direction];s=data['shapes'][index]
   pose=dict(object=obj,angle=direction*512,anchorX=rng.choice([0,512,32768,65024]),anchorY=rng.choice([0,512,32768,65024]))
   cx=(pose['anchorX']>>8)-s['x'];cy=(pose['anchorY']>>8)-s['y']
   center=dict(x=(cx*256+s['inside'][0]*64)&65535,y=(cy*256+s['inside'][1]*64)&65535)
   outside=dict(x=(cx*256+s['outside'][0]*64)&65535,y=(cy*256+s['outside'][1]*64)&65535)
   point=rng.choice([center,outside]);x=(point['x']+rng.choice([0,56,111,112,1647,1648,32767,32768] if approaching else [0,56,111,112,311,312,1079,1080]))&65535;y=point['y']
   person=dict(model=rng.choice([2,3,7]),state=10,physics=rng.randrange(20),counter=rng.choice([0,1,2,255]),x=x,y=y,
    flags2=rng.choice([0,128,0x8000,0x80000,0x88080]),flags3=rng.choice([0,0x80000]),flags4=rng.choice([0,1,0x10407]),
    assignment=rng.choice([0,8,16,24,272]),speed=32,timer=rng.choice([-32768,-1,0,1,2,8,31]),cargo=rng.choice([0,100]),
    angle=rng.randrange(2048),heading=rng.randrange(2048),turnAngle=0,turnY=0,goalX=x,goalY=y,destinationX=0,destinationY=0)
   task=dict(task=1 if approaching else 9 if departure else 2,busy=rng.choice([0,1,2,255]),phase=phase,restart=bool(rng.randrange(4)==0))
   site=dict(model=model,building=rng.choice([0,256,513]),occupied=rng.choice([0,1,256]),center=center,outside=outside)
   if departure:
    site['onBuilding']=bool(rng.randrange(2));site['occupied']=rng.choice([0,1,1023,1024,65535])
    person['counter']=rng.choice([0,1,2,3,4,31,32,255])
   if approaching:
    person.update(anchorX=1234,anchorY=2345,anchorFlags=255,motionTimer=13,motionMode=7,flags2=rng.choice([0,128,0x800,0x20000800,0x8000,0x80000,0x88080]),cargo=rng.choice([0,1,99,100,101,250,65535]))
    site.update(angle=rng.randrange(4)*512,anchorBlocked=bool(rng.randrange(2)))
    site['building']=rng.choice([0,513]);site['occupied']=rng.choice([0,513,1537]);allocationLimit=rng.randrange(4)
    site['signal']=rng.choice([0,2,128]);task['restart']=bool(rng.randrange(2))
   seed=rng.getrandbits(32);cpu.mem_write(p,bytes(256));cpu.mem_write(plan,bytes(256));cpu.mem_write(0x8a03e4,bytes(16384*16))
   for name,(offset,fmt) in fields.items():write(p+offset,fmt,person[name])
   write(p+0xc,'I',person['flags2']|(0x40000000 if task['restart'] else 0));write(p+0xa8,'B',phase);write(p+0xaa,'B',task['busy'])
   write(p+0x89,'H',1);write(0x890394,'I',plan);write(plan+0x68,'H',(cx&255)|((cy&255)<<8));write(plan+0x9b,'B',index)
   write(plan+0x9e,'B',model);write(plan+0x92,'H',site['building']);write(0x89d178,'I',seed)
   cell=((y>>9)*128+(x>>9));write(0x8a03e4+cell*16+8,'H',site['occupied'])
   if departure:write(0x8a03e4+cell*16,'H',512 if site['onBuilding'] else 0)
   if approaching:
    write(p+0x2d,'B',1);write(plan+0x2a,'B',9);write(plan+0x26,'H',site['angle']);write(plan+0x9c,'B',site['signal'])
    building=0x2012000;cpu.mem_write(building,bytes(256));write(0x890390+513*4,'I',building)
    write(building+0x24,'H',513);write(building+0x2a,'BB',2,model);write(building+0x33,'H',obj);write(building+0x26,'H',direction*512)
    write(building+0x7a,'HH',pose['anchorX'],pose['anchorY'])
    sine=rules['sine'];angle=(site['angle']+512)&2047
    ax=(outside['x']+(sine[angle]*512>>16))&65535;ay=(outside['y']+(sine[(angle+512)&2047]*512>>16))&65535
    anchorCell=(ay>>9)*128+(ax>>9)
    if site['anchorBlocked']:
     write(0x8a03e4+anchorCell*16,'H',512);write(0x8a03e4+anchorCell*16+8,'H',513)
     if cell==anchorCell:site['occupied']=513
   events=[];write(stack,'III',stop,p,0);cpu.reg_write(UC_X86_REG_ESP,stack)
   cpu.emu_start(entry,stop,count=100000);assert cpu.reg_read(UC_X86_REG_EIP)==stop
   result={name:read(p+offset,fmt) for name,(offset,fmt) in fields.items()}
   restart=bool(result['flags2']&0x40000000);result['flags2']&=~0x40000000
   cases.append(dict(person=person,task=task,site=site,seed=seed,**({'allocationLimit':allocationLimit} if approaching else {})))
   expected.append(dict(person=result,task=dict(task=read(p+0x2d,'B') if approaching else task['task'],busy=read(p+0xaa,'B'),phase=read(p+0xa8,'B'),restart=restart),randomState=read(0x89d178,'I'),events=events,**({'signal':read(plan+0x9c,'B')} if approaching else {})))
js="""import {stepBuildingWork,stepBuildingDeparture,stepBuildingApproach} from './app/building-work.ts';import {setDirectPersonDestination,createMotionRoutes} from './app/person-routes.ts';
let input='';for await(const c of process.stdin)input+=c;console.log(JSON.stringify(JSON.parse(input).map(c=>{
const p={...c.person,motionGroup:0,motionIndex:0},task={...c.task},rng={randomState:c.seed},events=[];
if(task.task===1&&task.restart)p.flags4=(p.flags4&0xfffefff8)>>>0;const initial=task.task;
(task.task===1?stepBuildingApproach:task.task===9?stepBuildingDeparture:stepBuildingWork)(rng,p,task,c.site,{destination:(to,direct)=>{events.push(['destination',to,direct]);if(direct)setDirectPersonDestination(createMotionRoutes(),p,to);else{p.goalX=to.x;p.goalY=to.y}},outsideBuilding:to=>c.site.anchorBlocked?c.site.outside:to,allocateLog:()=>{const ok=events.filter(e=>e[0]==='allocateLog'&&e[1]).length<c.allocationLimit;events.push(['allocateLog',ok]);return ok},releaseMotion:()=>events.push(['releaseMotion']),animation:(_,id)=>events.push(['animation',id]),rest:()=>events.push(['rest']),sound:(cue,flags)=>events.push(['sound',cue,flags])});
delete p.motionGroup;delete p.motionIndex;return {person:p,task,randomState:rng.randomState,events,...(initial===1?{signal:c.site.signal|(task.task===2?1:0)}:{})};})));"""
r=subprocess.run(['node','--input-type=module','-e',js],input=json.dumps(cases),capture_output=True,text=True,cwd=ROOT);assert r.returncode==0,r.stderr
actual=json.loads(r.stdout);assert len(actual)==len(expected)
for i,(c,a,e) in enumerate(zip(cases,actual,expected)):
 if a!=e:
  Path('/private/tmp/populous-work-mismatch.json').write_text(json.dumps(dict(index=i,case=c,actual=a,expected=e),indent=2));raise AssertionError('See /private/tmp/populous-work-mismatch.json')
if '--record' in sys.argv:
 indexes=range(0,len(cases),5)
 (ROOT/('tests/fixtures/building-approach.json' if approaching else 'tests/fixtures/building-departure.json' if departure else 'tests/fixtures/building-work.json')).write_text(json.dumps(dict(executableSha256=identity['sha256'],cases=[cases[i] for i in indexes],expected=[expected[i] for i in indexes]),separators=(',',':'))+'\n')
print(f'PASS: {len(cases)} complete native {"approach" if approaching else "departure" if departure else "building-work"} controllers: all phases, geometry, movement speed/RNG, readiness, facing, poses, sound and signed wait boundaries')
