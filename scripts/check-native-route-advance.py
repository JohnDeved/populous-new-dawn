"""Compare route advancement with passenger ownership and explicit world consumers.
Usage: python scripts/check-native-route-advance.py /path/to/d3dpoptb.exe
Route release and vehicle-leg availability execute natively inside advancement.
"""
import copy,hashlib,json,random,struct,subprocess,sys
from pathlib import Path
from unicorn import UC_HOOK_CODE
from unicorn.x86_const import UC_X86_REG_ESP,UC_X86_REG_EIP,UC_X86_REG_EAX
from decomp import native_cpu,configure_native_constants
root=Path(__file__).resolve().parents[1];exe=Path(sys.argv[1]);cpu,_=native_cpu(exe);configure_native_constants(cpu,exe);rng=random.Random(0x4eadc0)
cpu.mem_map(0x2000000,0x20000);base,stack,stop=0x2000000,0x201e000,0x201f000
fields={'id':(0x24,'H'),'class':(0x2a,'B'),'tribe':(0x2f,'b'),'vehicle':(0x9f,'H'),'flags2':(0xc,'I'),'flags4':(0x10,'I'),'motionGroup':(0x63,'h'),'motionIndex':(0x67,'B'),'recoveryCounter':(0x65,'B'),'counter':(0x2e,'B'),'x':(0x3d,'H'),'y':(0x3f,'H'),'goalX':(0x4f,'H'),'goalY':(0x51,'H'),'destinationX':(0x53,'H'),'destinationY':(0x55,'H'),'turnAngle':(0x57,'H'),'turnY':(0x59,'H')}
vehicle_fields={'id':(0x24,'H'),'class':(0x2a,'B'),'model':(0x2b,'B'),'x':(0x3d,'H'),'y':(0x3f,'H'),'physics':(0x30,'B'),'speed':(0x5f,'h'),'navigationFlags':(0x92,'I'),'passengerCount':(0x9e,'B'),'reservation':(0xa2,'B'),'turnAngle':(0x57,'H'),'turnY':(0x59,'H')}
def write(a,f,*v):cpu.mem_write(a,struct.pack('<'+f,*v))
def read(a,f):return struct.unpack('<'+f,cpu.mem_read(a,struct.calcsize('<'+f)))[0]
def ptr(i):return base+(i-1)*256 if i else 0
def ident(p):return (p-base)//256+1 if p else 0
def point(p):return dict(x=read(p,'H'),y=read(p+2,'H'))
def person(id):return {k:read(ptr(id)+o,f) for k,(o,f) in fields.items()}
def call(a,*args):
 write(stack,'I'*(len(args)+1),stop,*[v&0xffffffff for v in args]);cpu.reg_write(UC_X86_REG_ESP,stack);cpu.emu_start(a,stop,count=3000000);assert cpu.reg_read(UC_X86_REG_EIP)==stop;return cpu.reg_read(UC_X86_REG_EAX)
def leaf(cpu,a,size,u):
 sp=cpu.reg_read(UC_X86_REG_ESP);arg=lambda n:read(sp+4+n*4,'I');result=0
 if a in [0x4663c0,0x4664c0]:
  i=(arg(1)-0x8a03e4)//16;events.append(['lookup',person(ident(arg(0))),(i%128)*2|((i//128)*2<<8),a==0x4664c0]);result=ptr(2) if c['lookup'] else 0
 elif a==0x4657d0:
  events.append(['board',person(ident(arg(0))),ident(arg(1))]);result=c['board']
  write(arg(0)+0xc,'I',read(arg(0)+0xc,'I')^c['boardFlags']);write(arg(0)+0x9f,'H',2)
  if c['switchRoute']:write(arg(0)+0x63,'h',2)
 elif a==0x4650d0:events.append(['approach',ident(arg(0)),point(arg(1))]);result=c['approach']
 elif a==0x464ce0:
  events.append(['alternative',ident(arg(0)),point(arg(1))]);write(arg(2),'HH',c['alternative']['x'],c['alternative']['y']);result=c['hasAlternative']
 elif a==0x518200:events.append(['blocked',point(arg(0))]);result=c['blocked']
 elif a==0x466190:
  events.append(['prepare',ident(arg(0)),point(arg(1))]);write(arg(1),'HH',(read(arg(1),'H')+256)&65535,(read(arg(1)+2,'H')-128)&65535)
 elif a==0x4659d0:
  id=ident(arg(1));events.append(['leave',ident(arg(0)),person(id),point(arg(2))]);write(arg(1)+0x9f,'H',0)
  for i in range(12):
   if read(arg(0)+0x7a+i*2,'H')==id:write(arg(0)+0x7a+i*2,'H',0)
 elif a==0x436ca0:events.append(['clear',person(ident(arg(0)))]);write(arg(0)+0x10,'I',read(arg(0)+0x10,'I')^512)
 cpu.reg_write(UC_X86_REG_EAX,result);cpu.reg_write(UC_X86_REG_EIP,read(sp,'I'));cpu.reg_write(UC_X86_REG_ESP,sp+4)
for a in [0x4663c0,0x4664c0,0x4657d0,0x4650d0,0x464ce0,0x518200,0x466190,0x4659d0,0x436ca0]:cpu.hook_add(UC_HOOK_CODE,leaf,begin=a,end=a)
js="""import {createHash} from 'node:crypto';import {advancePersonRoute} from './app/route-advance.ts';import {createMotionRoutes,routeVehicleAvailable} from './app/person-routes.ts';
let s='';for await(const b of process.stdin)s+=b;const {cases,mode}=JSON.parse(s),hash=b=>createHash('sha256').update(b).digest('hex');console.log(JSON.stringify(cases.map(c=>{
const routes=createMotionRoutes();routes.records.set(c.records);routes.active=c.active;routes.last=c.last;routes.cursor=c.cursor;
const people=new Map(c.people.map(p=>[p.id,p])),p=people.get(1),vehicle=c.vehicle,w={routes,people,vehicles:new Map([[2,vehicle]])},events=[];
const e={boarding:(p,cell,airborne)=>{events.push(['lookup',{...p},cell,airborne]);return c.lookup?2:0;},board:(p,v)=>{events.push(['board',{...p},v.id]);p.flags2=(p.flags2^c.boardFlags)>>>0;p.vehicle=2;if(c.switchRoute)p.motionGroup=2;return !!c.board;},routeAvailable:p=>routeVehicleAvailable(routes,p,cell=>e.boarding(p,cell,false)),approach:(v,to)=>{events.push(['approach',v.id,{...to}]);return !!c.approach;},alternativeLanding:(v,to)=>{events.push(['alternative',v.id,{...to}]);return c.hasAlternative?{...c.alternative}:null;},landingBlocked:to=>{events.push(['blocked',{...to}]);return !!c.blocked;},prepareLanding:(v,to)=>{events.push(['prepare',v.id,{...to}]);to.x=(to.x+256)&65535;to.y=(to.y-128)&65535;},leaveVehicle:(v,p,to)=>{events.push(['leave',v.id,{...p},{...to}]);p.vehicle=0;for(let i=0;i<12;i++)if(v.passengers[i]===p.id)v.passengers[i]=0;},clearOrders:p=>{events.push(['clear',{...p}]);p.flags4=(p.flags4^512)>>>0;}};
let value=null;if(mode==='available')value=Number(e.routeAvailable(p));else advancePersonRoute(w,p,e);
return {value,people:[...people.values()].map(p=>({...p,motionIndex:p.motionIndex&255})),vehicle,records:hash(routes.records),active:routes.active,last:routes.last,cursor:routes.cursor,events};})));"""
for mode in ['available','advance']:
 cases=[];expected=[]
 for n in range(2048):
  records=bytearray(401*109)
  x=rng.choice([0,2,126,254,rng.randrange(256)]);y=rng.randrange(256);count=rng.choice([0,1,2,3,8,23]);ix=rng.randrange(max(1,count))
  for id in [1,2]:
   a=id*109;records[a:a+109]=rng.randbytes(109);struct.pack_into('<h',records,a,rng.choice([1,2,4,5]));records[a+2]=rng.randrange(8);records[a+108]=count;records[a+4:a+8]=bytes([x,y,rng.randrange(2),0])
   for i in range(24):records[a+12+i*4:a+16+i*4]=bytes([(x+i*2)&255,y,rng.randrange(2),rng.randrange(256)])
  people=[]
  for id in [1,3,4,5]:
   p={k:rng.randrange(65536) if f=='H' else rng.randrange(256) if f=='B' else rng.getrandbits(32) if f=='I' else 0 for k,(o,f) in fields.items()}
   p.update(id=id,**{'class':1},tribe=0,vehicle=rng.choice([0,2,2]),flags2=rng.choice([0,0,128,0x1000,0x8000000,0x80000000,0x80000]),flags4=rng.choice([0,0,0x2000000]),counter=rng.choice([0,4,16,rng.randrange(256)]),motionGroup=rng.choice([0,1,1,2]),motionIndex=ix,x=((((x+ix*2)&254)+1)*256+rng.choice([-641,-577,-225,-224,0,224,576,640,641]))&65535,y=((y&254)+1)*256,goalX=((((x+max(0,count-1)*2)&254)+1)*256)&65535,goalY=((y&254)+1)*256)
   people.append(p)
  vehicle={k:rng.randrange(65536) if f=='H' else rng.randrange(256) if f=='B' else rng.getrandbits(32) if f=='I' else 0 for k,(o,f) in vehicle_fields.items()}
  vehicle.update(id=2,**{'class':4},model=rng.randrange(5),physics=0,speed=0,x=people[0]['x'],y=people[0]['y'],passengers=[1,3,4,5]+[0]*8)
  c=dict(people=people,vehicle=vehicle,records=list(records),active=rng.choice([1,2,4]),last=2,cursor=3,lookup=n%3!=0,board=n%4!=0,boardFlags=0x80000000 if n%9==0 else 0,switchRoute=n%5==0,approach=n%3!=0,hasAlternative=n%4!=0,alternative=dict(x=rng.randrange(65536),y=rng.randrange(65536)),blocked=n%2)
  for p in people:
   cpu.mem_write(ptr(p['id']),bytes(256))
   for k,(o,f) in fields.items():write(ptr(p['id'])+o,f,p[k])
   write(0x890390+p['id']*4,'I',ptr(p['id']))
  cpu.mem_write(ptr(2),bytes(256))
  for k,(o,f) in vehicle_fields.items():write(ptr(2)+o,f,vehicle[k])
  for i,id in enumerate(vehicle['passengers']):write(ptr(2)+0x7a+i*2,'H',id)
  write(0x890398,'I',ptr(2));cpu.mem_write(0x955c29,bytes(records));write(0x9557b0,'h',c['active']);write(0x9557ae,'h',c['last']);write(0x9557ac,'h',c['cursor']);events=[]
  value=call(0x4ebab0 if mode=='available' else 0x4eadc0,ptr(1))&255
  native_vehicle={k:read(ptr(2)+o,f) for k,(o,f) in vehicle_fields.items()};native_vehicle['passengers']=[read(ptr(2)+0x7a+i*2,'H') for i in range(12)]
  expected.append(dict(value=value if mode=='available' else None,people=[person(i) for i in [1,3,4,5]],vehicle=native_vehicle,records=hashlib.sha256(cpu.mem_read(0x955c29,len(records))).hexdigest(),active=read(0x9557b0,'h'),last=read(0x9557ae,'h'),cursor=read(0x9557ac,'h'),events=copy.deepcopy(events)));cases.append(c)
 r=subprocess.run(['node','--input-type=module','-e',js],input=json.dumps(dict(mode=mode,cases=cases)),capture_output=True,text=True,cwd=root);assert r.returncode==0,r.stderr;actual=json.loads(r.stdout);assert len(actual)==len(expected)
 for i,(a,b) in enumerate(zip(expected,actual)):
  if a!=b:
   failure=Path('/private/tmp/populous-route-advance-failure.json');failure.write_text(json.dumps(dict(mode=mode,index=i,case=cases[i],native=a,browser=b),indent=2));raise AssertionError((mode,i,str(failure)))
 print(f'PASS: 2,048 native route {mode} comparisons, full pool, passengers, vehicles and ordered consumers',flush=True)
