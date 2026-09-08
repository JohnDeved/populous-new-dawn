"""Compare route release/reuse, point lookup, vehicle state and destination planning.
Usage: python scripts/check-native-person-routes.py /path/to/d3dpoptb.exe
Only path construction/advancement, outside points, coastal directions and
vehicle/building consumers are supplied. Entire route records are hashed.
"""
import copy,hashlib,json,random,struct,subprocess,sys
from pathlib import Path
from unicorn import UC_HOOK_CODE
from unicorn.x86_const import UC_X86_REG_ESP,UC_X86_REG_EIP,UC_X86_REG_EAX
from decomp import native_cpu,configure_native_constants
root=Path(__file__).resolve().parents[1];exe=Path(sys.argv[1]);cpu,_=native_cpu(exe);configure_native_constants(cpu,exe);rng=random.Random(0x4e9e80)
cpu.mem_map(0x2000000,0x20000);p,out,stack,stop=0x2000000,0x2001000,0x201e000,0x201f000
fields={'id':(0x24,'H'),'tribe':(0x2f,'b'),'vehicle':(0x9f,'H'),'flags2':(0xc,'I'),'flags4':(0x10,'I'),'motionGroup':(0x63,'h'),'motionIndex':(0x67,'B'),'recoveryCounter':(0x65,'B'),'x':(0x3d,'H'),'y':(0x3f,'H'),'goalX':(0x4f,'H'),'goalY':(0x51,'H'),'destinationX':(0x53,'H'),'destinationY':(0x55,'H'),'turnAngle':(0x57,'H'),'turnY':(0x59,'H')}
def write(a,f,*v):cpu.mem_write(a,struct.pack('<'+f,*v))
def read(a,f):return struct.unpack('<'+f,cpu.mem_read(a,struct.calcsize('<'+f)))[0]
def point(a):return dict(x=read(a,'H'),y=read(a+2,'H'))
def person():return {k:read(p+off,f) for k,(off,f) in fields.items()}
def call(a,*args):
 write(stack,'I'*(len(args)+1),stop,*[v&0xffffffff for v in args]);cpu.reg_write(UC_X86_REG_ESP,stack);cpu.emu_start(a,stop,count=3000000);assert cpu.reg_read(UC_X86_REG_EIP)==stop;return cpu.reg_read(UC_X86_REG_EAX)
def leaf(cpu,a,size,u):
 sp=cpu.reg_read(UC_X86_REG_ESP);arg=lambda n:read(sp+4+n*4,'I');value=0
 if a==0x4044b0:
  ident=read(arg(0)+0x24,'H');events.append(['outside',ident]);write(arg(1),'HH',(1000+ident*100)&65535,2000)
 elif a==0x518070:events.append(['blocks',arg(0)&65535]);value=c['blocks']
 elif a==0x4655f0:events.append(['coast',point(arg(0))]);value=c['direction']
 elif a==0x4ea970:
  events.append(['build',dict(x=read(arg(1),'B'),y=read(arg(1)+1,'B')),dict(x=read(arg(2),'B'),y=read(arg(2)+1,'B'))]);value=c['build']
 elif a==0x465650:events.append(['ready',read(arg(0)+0x24,'H')]);value=c['ready']
 elif a==0x4eadc0:
  events.append(['advance',person()]);write(p+0x53,'H',(read(p+0x53,'H')+17)&65535)
 elif a==0x4ec3f0:
  events.append(['adjust',point(arg(1))]);write(arg(1),'HH',(read(arg(1),'H')+c['adjust'])&65535,read(arg(1)+2,'H'))
 cpu.reg_write(UC_X86_REG_EAX,value&0xffffffff);cpu.reg_write(UC_X86_REG_EIP,read(sp,'I'));cpu.reg_write(UC_X86_REG_ESP,sp+4)
for a in [0x4044b0,0x518070,0x4655f0,0x4ea970,0x465650,0x4eadc0,0x4ec3f0]:cpu.hook_add(UC_HOOK_CODE,leaf,begin=a,end=a)
js="""import {createHash} from 'node:crypto';import {createMotionRoutes,attachPersonRoute,releasePersonRoute,setDirectPersonDestination,personRoutePosition,reusablePersonRoute,updatePersonRouteVehicle,planPersonDestination,setPlannedPersonDestination} from './app/person-routes.ts';
let s='';for await(const c of process.stdin)s+=c;const input=JSON.parse(s),land={flags:new Uint32Array(16384),categories:new Uint8Array(16384),buildingIds:new Uint16Array(16384)};
console.log(JSON.stringify(input.cases.map(c=>{const routes=createMotionRoutes(),events=[],p=c.p;for(const [id,bytes] of c.records)routes.records.set(bytes,id*109);routes.active=c.active;routes.last=c.last;
for(const t of c.tiles){land.flags[t.i]=t.flags;land.categories[t.i]=t.category;land.buildingIds[t.i]=t.building;}
const w={routes,skip:c.skip,checkingPerson:0,levelFlags2:c.levelFlags2,humanLimit:c.humanLimit,computerLimit:c.computerLimit,tribes:c.tribes,land,vehicles:new Map([[2,{x:65530,y:10}]])};
const e={outside:id=>{events.push(['outside',id]);return {x:(1000+id*100)&65535,y:2000};},buildingBlocks:cell=>{events.push(['blocks',cell]);return !!c.blocks;},coastDirection:to=>{events.push(['coast',{...to}]);return c.direction;},
build:(p,a,b)=>{events.push(['build',a,b]);return c.build;},vehicleReady:id=>{events.push(['ready',id]);return !!c.ready;},advance:p=>{events.push(['advance',{...p}]);p.destinationX=(p.destinationX+17)&65535;}};
let result=null;if(input.mode==='attach'||input.mode==='reserve')attachPersonRoute(routes,p,c.id,input.mode==='reserve');else if(input.mode==='release')releasePersonRoute(routes,p);else if(input.mode==='direct')setDirectPersonDestination(routes,p,c.to);else if(input.mode==='position')result=personRoutePosition(routes,c.id,c.index);
else if(input.mode==='reuse')result=reusablePersonRoute(routes,p,c.from,c.to);else if(input.mode==='vehicle')updatePersonRouteVehicle(routes,p,e.vehicleReady);else if(input.mode==='plan')result=planPersonDestination(w,p,c.to,e);
else setPlannedPersonDestination(w,p,c.to,e,to=>{events.push(['adjust',{...to}]);to.x=(to.x+c.adjust)&65535;});
for(const t of c.tiles){land.flags[t.i]=land.categories[t.i]=land.buildingIds[t.i]=0;}
return {p,active:routes.active,last:routes.last,skip:w.skip,checkingPerson:w.checkingPerson,records:createHash('sha256').update(routes.records).digest('hex'),events,result};})));"""
for mode,address in [('attach',0x4ea3b0),('reserve',0x4ea400),('release',0x4ea460),('direct',0x4e9dd0),('position',0x4ea4c0),('reuse',0x4ea550),('vehicle',0x4ea300),('plan',0x4e9e80),('wrapper',0x4e9d80)]:
 cases=[];expected=[]
 for n in range(2048):
  ps={k:rng.randrange(65536) if f=='H' else rng.randrange(256) if f=='B' else rng.getrandbits(32) if f=='I' else 0 for k,(o,f) in fields.items()}
  ps.update(id=1,tribe=n%4,vehicle=rng.choice([0,0,2]),motionGroup=rng.randrange(9),flags2=rng.choice([0,0x2000000,0x82000080,0x2080000]),flags4=rng.choice([0,512,0x2000200,0x18000200]))
  records=[]
  for ident in [*range(9),398,399,400]:
   raw=bytearray(rng.randbytes(109));struct.pack_into('<h',raw,0,rng.choice([-32768,-1,0,1,2,32767]));raw[2]=rng.randrange(8);raw[108]=rng.randrange(25);records.append([ident,list(raw)])
  to=dict(x=rng.randrange(65536),y=rng.randrange(65536));frm=dict(x=rng.randrange(256),y=rng.randrange(256))
  if mode=='reuse':
   to={k:v&255 for k,v in to.items()}
   # Exact, nearby and seam-adjacent reuse are exercised, not only misses.
   if n%3:
    r=records[1][1];r[0]=1;r[1]=0;r[2]=0;r[4]=frm['x'];r[5]=frm['y'];r[8]=to['x'];r[9]=to['y'];frm['x']=(frm['x']+n%3)&255
  elif mode in ['plan','wrapper'] and n%4==0:
   r=records[1][1];r[0]=1;r[1]=0;r[2]=0;r[4]=ps['x']>>8;r[5]=ps['y']>>8;r[8]=to['x']>>8;r[9]=to['y']>>8
  tiles={}
  for q in [ps,to]:
   i=(q['y']>>9)*128+(q['x']>>9);tiles[i]=dict(i=i,flags=rng.choice([0,0,512]),category=rng.randrange(16),building=rng.choice([0,2,3]))
   if tiles[i]['flags']&512 and not tiles[i]['building']:tiles[i]['building']=2
  c=dict(p=ps,records=records,active=rng.randrange(1,10),last=rng.randrange(1,9),skip=n%11==0,levelFlags2=0x400000 if n%7==0 else 0,humanLimit=n%4,computerLimit=n%5,
   tribes=[dict(playerType=i,requests=rng.choice([-1,0,1,3,10])) for i in range(4)],tiles=list(tiles.values()),to=to,from_=frm,id=rng.randrange(9),index=rng.randrange(32),blocks=n%2,ready=n%2,direction=rng.randrange(-8,16),build=rng.choice([0,0,3]),adjust=rng.choice([0,0,37,65500]))
  c['from']=c.pop('from_');c['skip']=int(c['skip']);cpu.mem_write(0x955c29,bytes(401*109))
  for ident,raw in records:cpu.mem_write(0x955c29+ident*109,bytes(raw))
  cpu.mem_write(p,bytes(256))
  for k,(offset,f) in fields.items():write(p+offset,f,ps[k])
  for ident in [1,2,3]:write(0x890390+ident*4,'I',p+(ident-1)*256);write(p+(ident-1)*256+0x24,'H',ident)
  write(p+256+0x3d,'HH',65530,10)
  write(0x9557b0,'h',c['active']);write(0x9557ae,'h',c['last']);write(0x9557c0,'B',c['skip']);write(0x9557c8,'I',0);write(0x895da4,'I',c['levelFlags2']);write(0x89ce5d,'B',c['humanLimit']);write(0x89ce5f,'B',c['computerLimit'])
  for i,t in enumerate(c['tribes']):write(0x89d1c8+i*0xc65+0xc1f,'B',t['playerType']);write(0x9557b6+i*2,'h',t['requests'])
  for t in c['tiles']:write(0x8a03e4+t['i']*16,'I',t['flags']);write(0x8a03e4+t['i']*16+8,'H',t['building']);write(0x8a03e4+t['i']*16+12,'B',t['category'])
  write(out,'HH',to['x'],to['y']);events=[];result=None
  if mode in ['attach','reserve']:call(address,p,c['id'])
  elif mode in ['release','vehicle']:call(address,p)
  elif mode=='position':
   result=dict(intermediate=bool(call(address,c['id'],c['index'],out)&255),**point(out))
  elif mode=='reuse':write(out,'BBBB',frm['x'],frm['y'],to['x'],to['y']);result=call(address,p,out,out+2)&65535
  else:
   r=call(address,p,out)
   if mode=='plan':result=struct.unpack('<h',struct.pack('<H',r&65535))[0]
  expected.append(dict(p=person(),active=read(0x9557b0,'h'),last=read(0x9557ae,'h'),skip=read(0x9557c0,'B'),checkingPerson=1 if read(0x9557c8,'I')==p else 0,records=hashlib.sha256(cpu.mem_read(0x955c29,401*109)).hexdigest(),events=copy.deepcopy(events),result=result));cases.append(c)
  for t in c['tiles']:write(0x8a03e4+t['i']*16,'I',0);write(0x8a03e4+t['i']*16+8,'H',0);write(0x8a03e4+t['i']*16+12,'B',0)
 r=subprocess.run(['node','--input-type=module','-e',js],input=json.dumps(dict(mode=mode,cases=cases)),capture_output=True,text=True,cwd=root);assert r.returncode==0,r.stderr;actual=json.loads(r.stdout)
 for i,(a,b) in enumerate(zip(expected,actual)):
  if a!=b:
   path=Path('/private/tmp/populous-person-routes-failure.json');path.write_text(json.dumps(dict(mode=mode,index=i,case=cases[i],native=a,browser=b),indent=2));raise AssertionError((mode,i,str(path)))
 assert len(actual)==len(expected);print(f'PASS: 2,048 native route {mode} comparisons, owned fields, pool bytes and ordered consumers',flush=True)
