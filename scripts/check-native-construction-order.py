"""Compare command-6 registration, fallback queue ownership and task dispatch.
Native eligibility, crew registration, circular slots, allocation, attachment,
normalization, anchors and task-1 geometry/movement/arrival/RNG run unhooked.
Tasks 2-9 and route/animation/audio/allocation submission are supplied consumers.
Usage: python SCRIPT EXE [--record]
"""
import hashlib, json, random, struct, subprocess, sys
from pathlib import Path
from unicorn import UC_HOOK_CODE
from unicorn.x86_const import UC_X86_REG_ESP, UC_X86_REG_EIP, UC_X86_REG_EAX
from decomp import ROOT, native_cpu, configure_native_constants, load_native_shapes
exe=Path(sys.argv[1]); cpu,identity=native_cpu(exe); configure_native_constants(cpu,exe)
cpu.mem_map(0x2000000,0x40000);load_native_shapes(cpu,exe,0x2000000,0x2004000)
p,plan,building,stack,stop=0x2010000,0x2011000,0x2012000,0x203d000,0x203e000
pool=0x938830; rng=random.Random(0x495520)
rules=json.loads((ROOT/'app/original-rules.json').read_text());shapes=json.loads((ROOT/'app/original-shapes.json').read_text())
def write(a,f,*v):cpu.mem_write(a,struct.pack('<'+f,*v))
def read(a,f):return struct.unpack('<'+f,cpu.mem_read(a,struct.calcsize('<'+f)))[0]
fields={'id':(0x24,'H'),'model':(0x2b,'B'),'state':(0x2c,'B'),'substate':(0x2d,'B'),'tribe':(0x2f,'B'),'physics':(0x30,'B'),'counter':(0x2e,'B'),
'x':(0x3d,'H'),'y':(0x3f,'H'),'flags2':(0xc,'I'),'flags3':(0x14,'I'),'flags4':(0x10,'I'),'assignment':(0x76,'H'),
'speed':(0x5f,'h'),'timer':(0x70,'h'),'cargo':(0x78,'H'),'angle':(0x26,'H'),'heading':(0x5d,'H'),'turnAngle':(0x57,'H'),'turnY':(0x59,'H'),
'goalX':(0x4f,'H'),'goalY':(0x51,'H'),'destinationX':(0x53,'H'),'destinationY':(0x55,'H'),'anchorX':(0x68,'H'),'anchorY':(0x6a,'H'),
'anchorFlags':(0x82,'B'),'motionTimer':(0x61,'h'),'motionMode':(0x66,'B'),'commandCursor':(0xa6,'B'),'commandStatus':(0xa7,'B'),
'immediateCommand':(0x9b,'H'),'workTarget':(0x89,'H'),'commandPhase':(0xaa,'B'),'animationMode':(0xa8,'B'),'orderLocation':(0x83,'H')}
tasks={0x4958f0:2,0x495d70:3,0x496220:4,0x496750:7,0x497030:8,0x497690:9}
def hook(c,a,size,user):
 sp=c.reg_read(UC_X86_REG_ESP);result=0
 if a==0x4b9cc0:
  events.append(['register',read(read(sp+8,'I')+0x24,'H')]);return
 if a in [0x4b9fc0,0x4044b0]:
  # Geometry inside task 1 is compared through the routed point/anchor, not as a callback.
  if not in_task[0]:events.append(['outside',read(read(sp+4,'I')+0x24,'H')])
  return
 if a==0x4956b8:
  in_task[0]=True;events.append(['task',1,read(p+0x89,'H')]);return
 if a in tasks:
  events.append(['task',tasks[a],read(p+0x89,'H')]);write(p+0xc,'I',read(p+0xc,'I')&~0x40000000)
  write(p+0xa8,'B',case['nextPhase']);write(p+0xaa,'B',case['nextBusy']);result=case['nextTask']
 elif a==0x438730:
  id_=read(sp+4,'H');model=read(sp+8,'B');point=read(sp+12,'I');flags=read(sp+16,'B');x=read(point,'H');y=read(point+2,'H')
  events.append(['prepare',id_,model,x,y,flags]);write(pool+id_*10,'BB',model,flags);write(pool+id_*10+6,'HH',x,y)
 elif a==0x4e9d80:
  to=read(sp+8,'I');x=read(to,'H');y=read(to+2,'H');write(p+0x4f,'HH',x,y);events.append(['destination',dict(x=x,y=y)])
 elif a==0x4d4040:events.append(['animation',read(sp+8,'H')])
 elif a==0x48a050:events.append(['sound',read(sp+8,'H'),read(sp+12,'H')])
 elif a==0x4ed8a0:events.append(['allocateLog'])
 else:raise AssertionError(hex(a))
 c.reg_write(UC_X86_REG_EAX,result);c.reg_write(UC_X86_REG_EIP,read(sp,'I'));c.reg_write(UC_X86_REG_ESP,sp+4)
for a in [0x4b9cc0,0x4b9fc0,0x4044b0,0x4956b8,0x438730,0x4e9d80,0x4d4040,0x48a050,0x4ed8a0,*tasks]:cpu.hook_add(UC_HOOK_CODE,hook,begin=a,end=a)
cases=[];expected=[]
for trial in range(4096):
 model=[1,2,3,4,5,7,13,14][trial%8];obj=rules['buildingObjects'][model];angle=(trial//8%4)*512
 shapeIndex=shapes['objects'][obj][angle//512];shape=shapes['shapes'][shapeIndex]
 cx=rng.choice([0,2,128,250]);cy=rng.choice([0,2,128,250]);anchorX=((cx+shape['x'])*256)&65535;anchorY=((cy+shape['y'])*256)&65535
 center=dict(x=(cx*256+shape['inside'][0]*64)&65535,y=(cy*256+shape['inside'][1]*64)&65535)
 outside=dict(x=(cx*256+shape['outside'][0]*64)&65535,y=(cy*256+shape['outside'][1]*64)&65535)
 capacity=rules['buildingMaxWorkers'][model];slots=[rng.choice([0,0,1,10+i]) for i in range(capacity)]
 # Valid registration lists have unique nonzero IDs.
 slots=[n if n!=1 or 1 not in slots[:i] else 0 for i,n in enumerate(slots)]
 if trial%7==0:slots=[10+i for i in range(capacity)]
 planTribe=rng.choice([0,0,0,1]);linked=rng.choice([0,513]);target=rng.choice([512,513]);flags=rng.choice([0,0,0,1]);cls=rng.choice([9,9,9,0])
 site=dict(model=model,building=linked,occupied=0,center=center,outside=outside,angle=angle)
 targets=[dict(id=512,**{'class':cls},tribe=planTribe,flags2=flags,plan=0,signal=rng.randrange(256),slots=slots,outside=outside,site=site),
  dict(id=513,**{'class':2},tribe=0,flags2=0,plan=rng.choice([0,512,512]),signal=0,slots=[],outside=outside,site=site)]
 person={key:0 for key in fields};person.update(id=1,model=rng.choice([2,2,2,3,7]),state=10,substate=0 if trial<2048 else trial%10,physics=rng.randrange(20),counter=rng.choice([0,1,2,255]),
 x=(outside['x']+rng.choice([0,111,112,1647,1648,32767,32768]))&65535,y=outside['y'],flags2=rng.choice([0,128,0x8000,0x80000,0x40000000]),flags3=rng.choice([0,0x2000000,0x80000]),
 flags4=rng.choice([0,0,1,0x10407,0x800]),assignment=rng.choice([0,8,16,24,272]),speed=32,timer=rng.choice([-32768,-1,0,1,2,8]),cargo=rng.choice([0,0,100,250]),
 angle=rng.randrange(2048),heading=rng.randrange(2048),anchorX=1234,anchorY=2345,anchorFlags=255,motionTimer=13,motionMode=7,
 commandCursor=rng.randrange(8),commandStatus=6,workTarget=rng.choice([0,512,512]),commandPhase=rng.randrange(256),animationMode=rng.choice([0,15,255]),orderLocation=123)
 if not person['substate'] and target==512:targets[0]['class']=9
 person['goalX']=person['x'];person['goalY']=person['y']
 commands=[rng.choice([0,0,2,3,4]) for _ in range(8)];commands[person['commandCursor']]=1
 if trial%11==0:commands=[1,2,3,4,2,3,4,2]
 person['commands']=commands
 full=trial%13==0;orders=[]
 for id_ in range(1,5):orders.append([id_,dict(model=6 if id_==1 else rng.choice([3,11,25]),flags=0,references=10,object=0,a=target if id_==1 else 0x8282,b=0x8080)])
 case=dict(person=person,targets=targets,orders=orders,cursor=rng.choice([5,798,799]),full=full,seed=rng.getrandbits(32),nextTask=rng.choice([0,0,2,7,9]),nextPhase=rng.randrange(256),nextBusy=rng.randrange(256))
 cpu.mem_write(p,bytes(256));cpu.mem_write(plan,bytes(256));cpu.mem_write(building,bytes(256));cpu.mem_write(pool,bytes(8000));cpu.mem_write(0x8a03e4,bytes(16384*16))
 for key,(offset,fmt) in fields.items():write(p+offset,fmt,person[key])
 write(p+0x8b,'8H',*commands);write(0x890390+512*4,'I',plan);write(0x890390+513*4,'I',building)
 for t,ptr in [(targets[0],plan),(targets[1],building)]:
  write(ptr+0x24,'H',t['id']);write(ptr+0x2a,'BB',t['class'],model);write(ptr+0x2f,'B',t['tribe']);write(ptr+0xc,'I',t['flags2']);write(ptr+0x9c,'B',t['signal'])
 write(plan+0x68,'H',cx|(cy<<8));write(plan+0x9b,'B',shapeIndex);write(plan+0x9e,'B',model);write(plan+0x26,'H',angle);write(plan+0x92,'H',linked)
 write(plan+0x6a,'H'*capacity,*slots);write(plan+0x9a,'B',sum(bool(n) for n in slots))
 write(building+0x82,'H',targets[1]['plan']);write(building+0x33,'H',obj);write(building+0x26,'H',angle);write(building+0x7a,'HH',anchorX,anchorY)
 if full:
  for id_ in range(1,800):write(pool+id_*10+2,'H',1)
 for id_,o in orders:write(pool+id_*10,'BB4H',*[o[k] for k in ['model','flags','references','object','a','b']])
 write(0x96aa78,'HH',case['cursor'],799 if full else 4);write(0x89d178,'I',case['seed'])
 events=[];in_task=[False];write(stack,'III',stop,p,pool+10);cpu.reg_write(UC_X86_REG_ESP,stack)
 cpu.emu_start(0x495520,stop,count=200000);assert cpu.reg_read(UC_X86_REG_EIP)==stop,hex(cpu.reg_read(UC_X86_REG_EIP))
 result={key:read(p+offset,fmt) for key,(offset,fmt) in fields.items()};result['commands']=[read(p+0x8b+i*2,'H') for i in range(8)]
 cases.append(case);expected.append(dict(result=bool(cpu.reg_read(UC_X86_REG_EAX)&255),person=result,
 targets=[dict(id=512,slots=[read(plan+0x6a+i*2,'H') for i in range(capacity)],count=read(plan+0x9a,'B'),signal=read(plan+0x9c,'B')),dict(id=513,slots=[],count=0,signal=0)],
 cursor=read(0x96aa78,'H'),active=read(0x96aa7a,'H'),poolHash=hashlib.sha256(cpu.mem_read(pool,8000)).hexdigest(),events=events,randomState=read(0x89d178,'I')))
js="""import {constructionCase} from './scripts/compare-construction-order.mjs';let s='';for await(const c of process.stdin)s+=c;console.log(JSON.stringify(JSON.parse(s).map(constructionCase)));"""
r=subprocess.run(['node','--input-type=module','-e',js],input=json.dumps(cases),capture_output=True,text=True,cwd=ROOT);assert r.returncode==0,r.stderr
actual=json.loads(r.stdout);assert len(actual)==len(expected)
for i,(a,e) in enumerate(zip(actual,expected)):
 if a!=e:
  Path('/private/tmp/populous-construction-order-mismatch.json').write_text(json.dumps(dict(index=i,case=cases[i],actual=a,expected=e),indent=2));raise AssertionError('See /private/tmp/populous-construction-order-mismatch.json')
if '--record' in sys.argv:
 indexes=range(0,len(cases),17)
 (ROOT/'tests/fixtures/construction-order.json').write_text(json.dumps(dict(executableSha256=identity['sha256'],cases=[cases[i] for i in indexes],expected=[expected[i] for i in indexes]),separators=(',',':'))+'\n')
print(f'PASS: {len(cases)} native command-6 initializations/visits: eligibility, separate plans, crew limits, full/wrapped queues/pools, actual task-1 geometry and task dispatch; tasks 2-9 and submission consumers supplied')
