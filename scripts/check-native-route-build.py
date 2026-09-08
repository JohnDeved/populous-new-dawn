"""Compare complete route construction/cache lifecycle, also inside planning.
Usage: python scripts/check-native-route-build.py /path/to/d3dpoptb.exe
The path-search primitive, airship choice and route advancement are supplied;
allocation, caching, endpoint copying, truncation, reuse and attachment execute.
"""
import copy,hashlib,json,random,struct,subprocess,sys
from pathlib import Path
from unicorn import UC_HOOK_CODE
from unicorn.x86_const import UC_X86_REG_ESP,UC_X86_REG_EIP,UC_X86_REG_EAX
from decomp import native_cpu,configure_native_constants
root=Path(__file__).resolve().parents[1];exe=Path(sys.argv[1]);cpu,_=native_cpu(exe);configure_native_constants(cpu,exe);rng=random.Random(0x4ea970)
cpu.mem_map(0x2000000,0x20000);p,vehicle,out,stack,stop=0x2000000,0x2000100,0x2001000,0x201e000,0x201f000
fields={'id':(0x24,'H'),'tribe':(0x2f,'b'),'vehicle':(0x9f,'H'),'flags2':(0xc,'I'),'flags3':(0x14,'I'),'flags4':(0x10,'I'),'motionGroup':(0x63,'h'),'motionIndex':(0x67,'B'),'recoveryCounter':(0x65,'B'),'x':(0x3d,'H'),'y':(0x3f,'H'),'goalX':(0x4f,'H'),'goalY':(0x51,'H'),'destinationX':(0x53,'H'),'destinationY':(0x55,'H'),'turnAngle':(0x57,'H'),'turnY':(0x59,'H')}
def write(a,f,*v):cpu.mem_write(a,struct.pack('<'+f,*v))
def read(a,f):return struct.unpack('<'+f,cpu.mem_read(a,struct.calcsize('<'+f)))[0]
def point(a,f='B'):return dict(x=read(a,f),y=read(a+struct.calcsize(f),f))
def person():return {k:read(p+o,f) for k,(o,f) in fields.items()}
def call(a,*args):
 write(stack,'I'*(len(args)+1),stop,*[v&0xffffffff for v in args]);cpu.reg_write(UC_X86_REG_ESP,stack);cpu.emu_start(a,stop,count=3000000);assert cpu.reg_read(UC_X86_REG_EIP)==stop;return cpu.reg_read(UC_X86_REG_EAX)
def leaf(cpu,a,size,u):
 global searches,vehicles
 sp=cpu.reg_read(UC_X86_REG_ESP);arg=lambda n:read(sp+4+n*4,'I');result=0
 if a==0x420840:
  events.append(['search',arg(0),point(arg(2)),point(arg(3)),arg(4),bool(arg(5)&255)]);r=c['searches'][searches];searches+=1
  cpu.mem_write(0x9557d0,bytes(r['bytes']));write(arg(2),'BB',(read(arg(2),'B')+r['dx'])&255,read(arg(2)+1,'B'));write(arg(3),'BB',read(arg(3),'B'),(read(arg(3)+1,'B')+r['dy'])&255)
  write(p+0x10,'I',read(p+0x10,'I')^r['flags']);write(0x89d1c8+0x93d,'I',read(0x89d1c8+0x93d,'I')^r['tribeFlags']);result=r['result']
 elif a==0x466920:
  events.append(['vehicle',point(arg(1),'H'),arg(2),arg(3)]);result=vehicle if c['vehicles'][vehicles] else 0;vehicles+=1
 elif a==0x465650:events.append(['ready']);result=c['ready']
 elif a==0x4eadc0:events.append(['advance',person()])
 cpu.reg_write(UC_X86_REG_EAX,result);cpu.reg_write(UC_X86_REG_EIP,read(sp,'I'));cpu.reg_write(UC_X86_REG_ESP,sp+4)
for a in [0x420840,0x466920,0x465650,0x4eadc0]:cpu.hook_add(UC_HOOK_CODE,leaf,begin=a,end=a)
js="""import {createHash} from 'node:crypto';import {createMotionRoutes,buildPersonRoute,planPersonDestination,ageFailedRoutes,clearFailedRoute} from './app/person-routes.ts';let s='';for await(const c of process.stdin)s+=c;const input=JSON.parse(s);
const hash=b=>createHash('sha256').update(b).digest('hex');console.log(JSON.stringify(input.cases.map(c=>{
const w=createMotionRoutes(),p=c.p,events=[],tribe={flags:c.tribeFlags};w.cursor=c.cursor;w.last=1;w.active=0;w.failedSearches.set(c.cache);w.pathResult.set(c.scratch);
for(let i=0;i<401;i++)w.records.set(c.row,i*109);const v=new DataView(w.records.buffer);for(const i of c.free)v.setInt16(i*109,0,true);
let searches=0,vehicles=0;
const e={findVehicle:(_,center,min,max)=>{events.push(['vehicle',center,min,max]);return c.vehicles[vehicles++]?c.vehicle:null;},search:(mode,p,a,b,option,vehicles)=>{
events.push(['search',mode,{...a},{...b},option,vehicles]);const r=c.searches[searches++];w.pathResult.set(r.bytes);a.x=(a.x+r.dx)&255;b.y=(b.y+r.dy)&255;p.flags4=(p.flags4^r.flags)>>>0;tribe.flags=(tribe.flags^r.tribeFlags)>>>0;return r.result;}};
let result=null;if(input.mode==='age')ageFailedRoutes(w);else if(input.mode==='clear')clearFailedRoute(w,c.id);else if(input.mode==='build')result=buildPersonRoute(w,p,c.from,c.to,c.option,tribe,e);
else{const unexpected=()=>{throw Error('Unexpected planning consumer');};result=planPersonDestination({routes:w,skip:0,checkingPerson:0,levelFlags2:0,humanLimit:0,computerLimit:0,tribes:Array.from({length:4},()=>({playerType:1,requests:0})),land:{flags:new Uint32Array(16384),categories:new Uint8Array(16384),buildingIds:new Uint16Array(16384)},vehicles:new Map([[2,c.vehicle]])},p,c.to,
{outside:unexpected,buildingBlocks:unexpected,coastDirection:unexpected,build:(p,a,b)=>buildPersonRoute(w,p,a,b,0,tribe,e),vehicleReady:()=>{events.push(['ready']);return !!c.ready;},advance:p=>events.push(['advance',{...p}])});}
return {p,from:c.from,to:c.to,cursor:w.cursor,active:w.active,last:w.last,tribeFlags:tribe.flags,records:hash(w.records),cache:[...w.failedSearches],scratch:hash(w.pathResult),events,result};})));"""
for mode,address in [('age',0x4ec390),('clear',0x4ec680),('build',0x4ea970),('plan',0x4e9e80)]:
 cases=[];expected=[]
 for n in range(2048):
  ps={k:rng.randrange(65536) if f=='H' else rng.randrange(256) if f=='B' else rng.getrandbits(32) if f=='I' else 0 for k,(o,f) in fields.items()}
  ps.update(id=1,tribe=0,vehicle=rng.choice([0,0,2]),motionGroup=rng.choice([0,0,2]),flags2=0x2000000,flags3=rng.choice([0,0,0x2000]),flags4=rng.choice([0,0,512,8,0x2000000]))
  frm=dict(x=rng.randrange(256),y=rng.randrange(256));to=dict(x=(frm['x']+(n%4 if n%3 else 20))&255,y=frm['y'])
  if mode=='plan':to={k:v*256+256 for k,v in to.items()};to={k:v&65535 for k,v in to.items()}
  row=list(rng.randbytes(109));row[0]=1;row[1]=0;row[2]&=7;row[108]%=24
  cache=bytearray(rng.randbytes(80))
  for i in range(8):struct.pack_into('<h',cache,i*10,rng.choice([-32768,-1,0,1,2,16,32767]))
  if n%8==0:
   a=30;cache[a+2]=(ps['x']>>8 if mode=='plan' else frm['x'])&254;cache[a+3]=(ps['y']>>8 if mode=='plan' else frm['y'])&254;cache[a+6]=(to['x']>>8 if mode=='plan' else to['x'])&254;cache[a+7]=(to['y']>>8 if mode=='plan' else to['y'])&254;struct.pack_into('<h',cache,a,-1)
  if mode=='clear' and n%3:
   for a in [10,30,50]:cache[a+2]=row[4]&254;cache[a+3]=row[5]&254;cache[a+6]=row[8]&254;cache[a+7]=row[9]&254
  results=[]
  for i in range(3):
   raw=list(rng.randbytes(1033));raw[1032]=rng.choice([0,1,22,23,24,255]);results.append(dict(bytes=raw,result=rng.choice([0,1,1,2]),dx=rng.choice([0,1]),dy=rng.choice([0,1]),flags=rng.choice([0,0,8]),tribeFlags=rng.choice([0,0,32])))
  c=dict(p=ps,from_=frm,to=to,row=row,free=rng.choice([[],[400],[399],[1],[2,398,399],[1,2,3,4]]),cursor=rng.choice([0,1,397,398,399,400]),cache=list(cache),scratch=list(rng.randbytes(1033)),tribeFlags=32 if n%2 else 0,searches=results,vehicles=[rng.randrange(2),rng.randrange(2)],vehicle=dict(x=rng.randrange(65536),y=rng.randrange(65536)),ready=n%2,option=rng.randrange(65536),id=rng.choice([0,1,2,399,400]));c['from']=c.pop('from_')
  cpu.mem_write(0x955c29,bytes(row)*401)
  for i in c['free']:write(0x955c29+i*109,'h',0)
  cpu.mem_write(0x955bd9,bytes(cache));cpu.mem_write(0x9557d0,bytes(c['scratch']));write(0x9557ac,'h',c['cursor']);write(0x9557ae,'h',1);write(0x9557b0,'h',0);write(0x9557c0,'B',0);write(0x895da4,'I',0);write(0x89ce5d,'B',0);write(0x89ce5f,'B',0)
  cpu.mem_write(p,bytes(256));cpu.mem_write(vehicle,bytes(256));write(0x890390+4,'II',p,vehicle);write(vehicle+0x24,'H',2);write(vehicle+0x3d,'HH',c['vehicle']['x'],c['vehicle']['y'])
  for k,(off,f) in fields.items():write(p+off,f,ps[k])
  write(0x89d1c8+0x93d,'I',c['tribeFlags']);write(0x89d1c8+0xc1f,'B',1);write(out,'BB',frm['x'],frm['y']);write(out+8,'HH' if mode=='plan' else 'BB',to['x'],to['y']);events=[];searches=vehicles=0;result=None
  if mode=='age':call(address)
  elif mode=='clear':call(address,c['id'])
  elif mode=='build':result=call(address,p,out,out+8,c['option'])&65535
  else:result=call(address,p,out+8)&65535
  expected.append(dict(p=person(),from_=point(out),to=point(out+8,'H' if mode=='plan' else 'B'),cursor=read(0x9557ac,'h'),active=read(0x9557b0,'h'),last=read(0x9557ae,'h'),tribeFlags=read(0x89d1c8+0x93d,'I'),records=hashlib.sha256(cpu.mem_read(0x955c29,401*109)).hexdigest(),cache=list(cpu.mem_read(0x955bd9,80)),scratch=hashlib.sha256(cpu.mem_read(0x9557d0,1033)).hexdigest(),events=copy.deepcopy(events),result=result));expected[-1]['from']=expected[-1].pop('from_');cases.append(c)
 r=subprocess.run(['node','--input-type=module','-e',js],input=json.dumps(dict(mode=mode,cases=cases)),capture_output=True,text=True,cwd=root);assert r.returncode==0,r.stderr;actual=json.loads(r.stdout);assert len(actual)==len(expected)
 for i,(a,b) in enumerate(zip(expected,actual)):
  if a!=b:
   path=Path('/private/tmp/populous-route-build-failure.json');path.write_text(json.dumps(dict(mode=mode,index=i,case=cases[i],native=a,browser=b),indent=2));raise AssertionError((mode,i,str(path)))
 print(f'PASS: 2,048 native route {mode} comparisons, complete pools, scratch, cache and consumers',flush=True)
