"""Compare complete native person command 10, including real shapes, RNG,
eligibility, movement/work animation and plan timber/stage mutation. World route,
allocation and removal consumers are supplied. Usage: python SCRIPT EXE
"""
import json, random, struct, subprocess, sys
from pathlib import Path
from unicorn import UC_HOOK_CODE
from unicorn.x86_const import UC_X86_REG_ESP, UC_X86_REG_EIP, UC_X86_REG_EAX
from decomp import ROOT, native_cpu, configure_native_constants, load_native_shapes

exe=Path(sys.argv[1]);cpu,identity=native_cpu(exe);configure_native_constants(cpu,exe)
cpu.mem_map(0x2000000,0x100000)
p,b,plan,order,objects,shapes,stack,stop=0x2000000,0x2001000,0x2002000,0x2003000,0x2010000,0x2040000,0x20fd000,0x20fe000
load_native_shapes(cpu,exe,objects,shapes)
rules=json.loads((ROOT/'app/original-rules.json').read_text())
fields={'model':(0x2b,'B'),'substate':(0x2d,'B'),'counter':(0x2e,'B'),'tribe':(0x2f,'b'),
 'physics':(0x30,'B'),'flags2':(0xc,'I'),'flags4':(0x10,'I'),'flags3':(0x14,'I'),
 'x':(0x3d,'H'),'y':(0x3f,'H'),'goalX':(0x4f,'H'),'goalY':(0x51,'H'),
 'anchorX':(0x68,'H'),'anchorY':(0x6a,'H'),'anchorFlags':(0x82,'B'),
 'timer':(0x70,'h'),'cargo':(0x78,'h'),'workTarget':(0x89,'H'),
 'speed':(0x5f,'h'),'angle':(0x26,'H'),'turnAngle':(0x57,'H'),'heading':(0x5d,'H')}
def read(a,f):return struct.unpack('<'+f,cpu.mem_read(a,struct.calcsize('<'+f)))[0]
def write(a,f,*v):cpu.mem_write(a,struct.pack('<'+f,*v))
def call(a,*args):
 write(stack,'I'*(len(args)+1),stop,*args);cpu.reg_write(UC_X86_REG_ESP,stack)
 cpu.emu_start(a,stop,count=100000)
 assert cpu.reg_read(UC_X86_REG_EIP)==stop,hex(cpu.reg_read(UC_X86_REG_EIP))
def leaf(cpu,address,size,user):
 sp=cpu.reg_read(UC_X86_REG_ESP)
 if address in (0x4e9d80,0x4e9dd0):
  point=read(sp+8,'I');x,y=read(point,'H'),read(point+2,'H')
  write(p+0x4f,'HH',x,y);events.append(['destination',x,y,address==0x4e9dd0])
 elif address==0x4d4040:events.append(['animation',read(sp+8,'H')])
 elif address==0x4d58c0:events.append(['drop']);write(p+0x78,'h',0)
 elif address==0x407490:events.append(['occupant']);write(b+0xa6,'B',read(b+0xa6,'B')-1)
 elif address==0x498140:
  events.append(['ensure'])
  if not read(b+0x82,'H') and current['allocate']:
   write(b+0x82,'H',3);write(plan+0x2a,'B',9);write(plan+0x96,'h',rules['buildingLife'][current['building']['model']])
 elif address==0x4ef180:
  target=read(sp+4,'I');events.append(['remove',read(target+0x24,'H')]);write(target+0x2a,'B',0)
 elif address==0x403a00:events.append(['stage'])
 cpu.reg_write(UC_X86_REG_EAX,0);cpu.reg_write(UC_X86_REG_EIP,read(sp,'I'));cpu.reg_write(UC_X86_REG_ESP,sp+4)
for a in (0x4e9d80,0x4e9dd0,0x4d4040,0x4d58c0,0x407490,0x498140,0x4ef180,0x403a00):cpu.hook_add(UC_HOOK_CODE,leaf,begin=a,end=a)
rng=random.Random(0x497a30);cases=[];expected=[]
for i in range(2048):
 model=(1,4,7,5)[i%4];capacity=rules['buildingLife'][model]
 person=dict(model=rng.choice([2,2,2,3,7]),substate=i%8,counter=i&255,tribe=0,physics=2,
  flags2=rng.choice([0,128,0x8000,0x80000,0x40000000,0x40000080]),flags4=rng.choice([0,0x800,0x10007,0x1400]),flags3=rng.choice([0,0x80000]),
  x=8192,y=12288,goalX=8192+rng.choice([0,111,112,567,568]),goalY=12288,
  anchorX=1,anchorY=2,anchorFlags=15,timer=rng.choice([-32768,-1,0,1,2,63]),cargo=rng.choice([0,0,50,100]),workTarget=2,
  speed=32,angle=100,turnAngle=200,heading=300)
 building=dict(id=2,**{'class':2},model=model,tribe=0,flags2=0,inside=rng.choice([0,1,5]),object=rules['buildingObjects'][model],angle=(i//4%4)*512,anchorX=8192,anchorY=12288)
 if i%31==0:building['tribe']=1
 if i%47==0:building['flags2']=1
 if i%61==0:building['class']=0
 state=None if i%3==0 else dict(remaining=rng.choice([0,50,100,capacity]),repairDelay=rng.choice([0,0,1,2,-1]),attacker=255)
 current=dict(person=person,building=building,plan=state,allocate=i%5!=0,adjacent=i%3==0,randomState=rng.getrandbits(32))
 cases.append(current)
 for a in (p,b,plan,order):cpu.mem_write(a,bytes(256))
 for key,(offset,fmt) in fields.items():write(p+offset,fmt,person[key])
 write(p+0x24,'H',1);write(p+0x2a,'B',1)
 write(b+0x24,'HH',2,building['angle']);write(b+0x2a,'BBB',building['class'],model,1)
 write(b+0x2f,'B',building['tribe']);write(b+0xc,'I',building['flags2']);write(b+0x33,'H',building['object'])
 write(b+0x7a,'HH',building['anchorX'],building['anchorY']);write(b+0xa6,'B',building['inside']);write(b+0x78,'B',4)
 write(b+0x82,'H',3 if state else 0);write(plan+0x24,'H',3);write(plan+0x2a,'B',9 if state else 0);write(plan+0x92,'H',2)
 write(plan+0x94,'hh',state['repairDelay'] if state else 0,state['remaining'] if state else 0)
 for id,address in ((1,p),(2,b),(3,plan)):write(0x890390+id*4,'I',address)
 cell=(person['y']//512)*128+person['x']//512
 write(0x8a03e4+cell*16,'I',512 if current['adjacent'] else 0);write(0x8a03e4+cell*16+8,'H',2)
 write(order,'BB4H',10,0,1,0,2,0);write(0x89d178,'I',current['randomState'])
 events=[];call(0x497a30,p,order)
 expected.append(dict(person={key:read(p+offset,fmt) for key,(offset,fmt) in fields.items()},
  done=cpu.reg_read(UC_X86_REG_EAX)&255,randomState=read(0x89d178,'I'),inside=read(b+0xa6,'B'),
  buildingClass=read(b+0x2a,'B'),planClass=read(plan+0x2a,'B'),wood=read(plan+0x96,'h'),stage=read(b+0x78,'B'),events=events))
js="""import{stepDismantling}from'./app/building-dismantle.ts';import{timberTransfer}from'./app/timber.ts';
import{changeBuildingWork}from'./app/building-damage.ts';import rules from'./app/original-rules.json'with{type:'json'};
let input='';for await(const c of process.stdin)input+=c;console.log(JSON.stringify(JSON.parse(input).map(c=>{
 const p=c.person,b=c.building,rng={randomState:c.randomState},events=[],damage={model:b.model,stage:4,state:1,flags2:0};let plan=c.plan,planClass=plan?9:0;
 const done=stepDismantling(rng,p,{model:10,a:2},{building:id=>id===2?b:undefined,plan:()=>planClass?plan:undefined,
  adjacentBuilding:()=>c.adjacent?2:0,animation:(_,o)=>events.push(['animation',o]),
  destination:(point,direct)=>{p.goalX=point.x&65535;p.goalY=point.y&65535;events.push(['destination',p.goalX,p.goalY,direct])},
  dropCargo:()=>{events.push(['drop']);p.cargo=0},removeOccupant:()=>{events.push(['occupant']);b.inside--},
  ensurePlan:()=>{events.push(['ensure']);if(!plan&&c.allocate){plan={remaining:rules.buildingLife[b.model],repairDelay:0};planClass=9}},
  takeTimber:(plan,requested)=>{const n=timberTransfer(plan.remaining,p.cargo,rules.personWood[p.model],requested);changeBuildingWork(plan,-n,damage,null,{move:()=>events.push(['stage'])});p.cargo+=n},
  removePlan:()=>{events.push(['remove',3]);planClass=0},removeBuilding:()=>{events.push(['remove',2]);b.class=0}});
 return{person:p,done,randomState:rng.randomState,inside:b.inside,buildingClass:b.class,planClass,wood:plan?.remaining??0,stage:damage.stage,events};
})));"""
actual=json.loads(subprocess.check_output(['node','--input-type=module','-e',js],input=json.dumps(cases).encode(),cwd=ROOT))
for i,(a,e) in enumerate(zip(actual,expected)):
 if a!=e:
  path=Path('/private/tmp/populous-dismantling-failure.json');path.write_text(json.dumps(dict(case=cases[i],actual=a,expected=e),indent=2));raise AssertionError((i,str(path)))
print(f'PASS: {len(cases)} complete native dismantling calls, original rotations, approach thresholds, work delays, eligibility, RNG, animation, repair holdoff, timber transfer and building stages')

# The activation controller rewrites shared records before person startup. Keep
# no residents here: their assignment/allocation consumers are checked separately
# by live scenarios and the existing order/occupancy/state native oracles.
cpu,_=native_cpu(exe);configure_native_constants(cpu,exe);cpu.mem_map(0x2000000,0x100000)
load_native_shapes(cpu,exe,objects,shapes)
cases=[];expected=[]
for i in range(128):
 building=dict(id=2,**{'class':2},model=7,tribe=0,flags2=0,inside=0,occupants=[0]*6,
  activity=0x8008 if i&1 else 8,object=103,angle=(i//2%4)*512,anchorX=8192,anchorY=12288)
 people=[];records=[]
 cpu.mem_write(b,bytes(256));cpu.mem_write(0x938830,bytes(8000));write(0x96aa7a,'H',6)
 write(b+0x24,'HH',2,building['angle']);write(b+0x2a,'BB',2,7);write(b+0x33,'H',103)
 write(b+0x7a,'HH',8192,12288);write(b+0x9c,'H',building['activity'])
 write(0x89d1c8+0x881,'I',p)
 for j in range(6):
  address=p+j*256;cpu.mem_write(address,bytes(256))
  person=dict(id=100+j,tribe=0,state=10 if j%2==0 else 14,flags2=0,commands=[j+1]+[0]*7,commandCursor=0,immediateCommand=0)
  people.append(person);write(address+0x24,'H',100+j);write(address+0x2c,'B',person['state']);write(address+0x8b,'H',j+1)
  write(address+8,'I',address+256 if j<5 else 0)
  model=(8,6,10,8,6,3)[j]
  record=dict(model=model,flags=i%4,references=1,object=0,a=2 if i&8 else 4,b=0x1020)
  records.append(record);write(0x938830+(j+1)*10,'BB4H',*[record[k] for k in ('model','flags','references','object','a','b')])
 write(0x8a03e4+((0x10>>1)*128+(0x20>>1))*16+8,'H',2 if i&16 else 4)
 c=dict(building=building,people=people,records=records,enabled=bool(i&32),buildingAt=2 if i&16 else 4)
 cases.append(c);call(0x40a0c0,b,int(c['enabled']))
 expected.append(dict(activity=read(b+0x9c,'H'),flags=[read(p+j*256+0xc,'I') for j in range(6)],
  records=[dict(zip(('model','flags','references','object','a','b'),struct.unpack('<BB4H',cpu.mem_read(0x938830+(j+1)*10,10)))) for j in range(6)]))
js="""import{toggleDismantling}from'./app/building-dismantle.ts';import{emptyPersonOrder}from'./app/person-orders.ts';
let s='';for await(const c of process.stdin)s+=c;console.log(JSON.stringify(JSON.parse(s).map(c=>{
 const records=Array.from({length:800},emptyPersonOrder);c.records.forEach((o,i)=>records[i+1]=o);
 toggleDismantling({records,cursor:10,active:6},new Map(c.people.map(p=>[p.id,p])),c.building,c.enabled,{buildingAt:()=>c.buildingAt,assign:()=>{throw Error('No occupants')}});
 return{activity:c.building.activity,flags:c.people.map(p=>p.flags2),records:records.slice(1,7)};
})));"""
actual=json.loads(subprocess.check_output(['node','--input-type=module','-e',js],input=json.dumps(cases).encode(),cwd=ROOT))
for i,(a,e) in enumerate(zip(actual,expected)):
 if a!=e:
  path=Path('/private/tmp/populous-dismantling-toggle-failure.json');path.write_text(json.dumps(dict(case=cases[i],actual=a,expected=e),indent=2));raise AssertionError((i,str(path)))
print(f'PASS: {len(cases)} original dismantling activation/cancellation calls, shared record rewrites, rotated payload cells and state-10 restart flags')
