"""Compare vehicle routing and composed path probes with original boat consumers.
Usage: python scripts/check-native-vehicle-routing.py /path/to/d3dpoptb.exe
Only building access in the probe is supplied. Indexed search executes natively.
"""
import hashlib,json,random,struct,subprocess,sys
from pathlib import Path
from unicorn import UC_HOOK_CODE
from unicorn.x86_const import UC_X86_REG_ESP,UC_X86_REG_EIP,UC_X86_REG_EAX
from decomp import native_cpu,configure_native_constants
root=Path(__file__).resolve().parents[1];exe=Path(sys.argv[1]);cpu,_=native_cpu(exe);configure_native_constants(cpu,exe);rng=random.Random(0x4663c0)
data=(exe.parent/'data/mwsearch.dat').read_bytes();assert hashlib.sha256(data).hexdigest()=='0c39b12d160658863c2df89aa34484dff459e48ea0b5634658b7473ca940fae0';cpu.mem_write(0x8929cd,data)
cpu.mem_map(0x2000000,0x20000);base,out,stack,stop=0x2000000,0x2001000,0x201e000,0x201f000
rules=json.loads((root/'app/original-rules.json').read_text())
fields={'id':(0x24,'H'),'class':(0x2a,'B'),'model':(0x2b,'B'),'tribe':(0x2f,'b'),'physics':(0x30,'B'),'x':(0x3d,'H'),'y':(0x3f,'H'),'speed':(0x5f,'h'),'navigationFlags':(0x92,'I'),'passengerCount':(0x9e,'B'),'reservation':(0xa2,'B')}
def write(a,f,*v):cpu.mem_write(a,struct.pack('<'+f,*v))
def read(a,f):return struct.unpack('<'+f,cpu.mem_read(a,struct.calcsize('<'+f)))[0]
def ptr(i):return base+(i-1)*256 if i else 0
def ident(p):return (p-base)//256+1 if p else 0
def cell(p):return (p['x']>>8&254)|(p['y']&0xfe00)
def index(c):return ((c>>9)&127)*128+((c&254)>>1)
def call(a,*args):
 write(stack,'I'*(len(args)+1),stop,*[v&0xffffffff for v in args]);cpu.reg_write(UC_X86_REG_ESP,stack);cpu.emu_start(a,stop,count=3000000);assert cpu.reg_read(UC_X86_REG_EIP)==stop;return cpu.reg_read(UC_X86_REG_EAX)
def leaf(cpu,a,size,u):
 sp=cpu.reg_read(UC_X86_REG_ESP);cpu.reg_write(UC_X86_REG_EAX,c['building']);cpu.reg_write(UC_X86_REG_EIP,read(sp,'I'));cpu.reg_write(UC_X86_REG_ESP,sp+4)
cpu.hook_add(UC_HOOK_CODE,leaf,begin=0x517f10,end=0x517f10)
js="""import {vehicleCellFree,vehicleCanDisembark,vehicleCanApproach,vehicleReady,boardingVehicle,adjustVehicleDestination,findVehicleLanding} from './app/vehicle-routing.ts';import {probePathStep,createPathGeometry} from './app/path-geometry.ts';
let s='';for await(const b of process.stdin)s+=b;const {cases,mode}=JSON.parse(s);console.log(JSON.stringify(cases.map(c=>{
const flags=new Uint32Array(16384).fill(c.flags),categories=new Uint8Array(16384).fill(c.category),objects=new Map(c.objects.map(o=>[o.id,o])),v=objects.get(2),p={tribe:c.tribe,flags4:c.personFlags};
const cellObjects=cell=>c.order.map(id=>objects.get(id)).filter(o=>(((o.x>>8)&254)|(o.y&0xfe00))===(cell&0xfefe));
const w={flags,categories,cellObjects,boatsEnabled:c.enabled,vehicles:objects,people:objects,tribes:c.tribes},slots={records:Uint8Array.from(c.records),count:c.count,search:Uint8Array.from(c.search)},to={...c.to},g=createPathGeometry();Object.assign(g,c.g);
const state={currentBoat:2,walkMask:0},mask=new Uint8Array(8192).fill(c.mask),effects={buildingAccess:()=>c.building,boardingBoat:cell=>boardingVehicle(w,p,cell),disembark:(id,to)=>vehicleCanDisembark(w,objects.get(id),to),boatCell:(cell,id)=>vehicleCellFree(w,cell,id)};let value=null;
if(mode==='cell')value=Number(vehicleCellFree(w,c.cell,2));else if(mode==='disembark')value=Number(vehicleCanDisembark(w,v,to));else if(mode==='approach')value=Number(vehicleCanApproach(w,v,to));else if(mode==='ready')value=Number(vehicleReady(w,v));else if(mode==='boarding')value=boardingVehicle(w,p,c.cell);else if(mode==='landing'){const result=findVehicleLanding(w,slots.search,v,to);value=Number(result.found);Object.assign(to,result.point);}else if(mode==='adjust')adjustVehicleDestination(w,slots,c.aboard?v:null,to);else value=probePathStep({...w,state,walkMasks:[mask]},g,p,c.point,c.direction,effects);
return {value,to,records:[...slots.records],count:slots.count,search:[...slots.search],cacheCell:g.cacheCell,cacheResult:g.cacheResult,transition:g.transition,boat:state.currentBoat};})));"""
for mode,address in [('cell',0x465510),('disembark',0x464f90),('approach',0x4650d0),('ready',0x465650),('boarding',0x4663c0),('adjust',0x4ec3f0),('landing',0x464ce0),('probe',0x422020)]:
 cases=[];expected=[]
 for n in range(1024):
  to=dict(x=rng.randrange(65536),y=rng.randrange(65536));packed=cell(to);objects=[]
  for i in range(1,6):
   physics=rng.randrange(len(rules['personSpeeds']));speed=rules['personSpeeds'][physics]+rng.choice([-1,0,1]);speed=(speed+32768)%65536-32768
   objects.append(dict(id=i,**{'class':1 if i in [1,4] else 4},model=rng.randrange(5),tribe=rng.randrange(2),physics=physics,x=to['x'] if n%3 else (to['x']+i*512)&65535,y=to['y'],speed=speed,navigationFlags=rng.choice([0,0,1,0x101,0x10000]),passengerCount=rng.choice([0,1,8,255]),passengers=[4]+[0]*11,reservation=rng.choice([0,0,1,255])))
  order=list(range(1,6));rng.shuffle(order);records=bytearray(rng.randbytes(48));count=0
  for i in range(16):
   records[i*3+2]=int(i<n%17);count+=records[i*3+2];struct.pack_into('<H',records,i*3,((packed&255)+i*2)&254|(packed&0xfe00))
  search=bytearray(rng.randbytes(192))
  for i in range(16):search[i*12]=int(n%9==0 or 0<i<n%4)
  point=dict(x=(to['x']>>8)+5120,y=(to['y']>>8)+5120,flags=rng.randrange(65536)&0xff01);direction=n%4;step=rules['pathSteps'][direction];nextcell=((point['x']+step['x'])&254)|(((point['y']+step['y'])&254)<<8)
  g=dict(cacheCell=index(nextcell) if n%5==0 else -1,cacheResult=rng.randrange(256),transition=rng.randrange(256),allowTransition=n%2)
  c=dict(to=to,cell=packed,objects=objects,order=order,tribe=n%2,tribes=[dict(playerType=rng.randrange(3)) for _ in range(2)],flags=rng.choice([0,0,2,4,512,0x100000,0x1000000,0x1000002]),category=rng.randrange(16),enabled=n%3!=0,records=list(records),count=count,search=list(search),aboard=n%7!=0,point=point,direction=direction,g=g,mask=255 if n%4 else 0,personFlags=rng.choice([0,1,0x10007]),building=rng.randrange(7))
  terrain=bytearray(16384*16)
  for i in range(16384):struct.pack_into('<I',terrain,i*16,c['flags']);terrain[i*16+12]=c['category']
  cpu.mem_write(0x8a03e4,bytes(terrain));heads={}
  for o in reversed([objects[i-1] for i in order]):
   a=ptr(o['id']);cpu.mem_write(a,bytes(256))
   for k,(off,f) in fields.items():write(a+off,f,o[k])
   for i,id in enumerate(o['passengers']):write(a+0x7a+i*2,'H',id)
   key=cell(o);write(a+0x20,'H',heads.get(key,0));heads[key]=o['id'];write(0x890390+o['id']*4,'I',a)
  for key,id in heads.items():write(0x8a03e4+index(key)*16+6,'H',id)
  write(ptr(1)+0x2f,'b',c['tribe']);write(ptr(1)+0x10,'I',c['personFlags']);write(ptr(1)+0x9f,'H',2 if c['aboard'] else 0);write(0x89bc7e,'I',c['enabled'])
  for i,t in enumerate(c['tribes']):write(0x89d1c8+i*0xc65+0xc1f,'B',t['playerType'])
  cpu.mem_write(0x969d92,bytes(records));write(0x969d8e,'h',count);cpu.mem_write(0x89290d,bytes(search));write(out,'HH',to['x'],to['y']);write(out+8,'iiH',point['x'],point['y'],point['flags'])
  write(0x64f4a0,'IIB',0x8a03e4+g['cacheCell']*16 if g['cacheCell']>=0 else 0,ptr(2),g['cacheResult']);write(0x6513dc,'B',g['transition']);write(0x6513d7,'B',g['allowTransition']);write(0x9557c8,'I',ptr(1));write(0x96aa74,'I',0x96aaba);cpu.mem_write(0x96aaba,bytes([c['mask']])*8192)
  if mode=='cell':value=call(address,packed,ptr(2))&255
  elif mode in ['disembark','approach']:value=call(address,ptr(2),out)&255
  elif mode=='ready':value=call(address,ptr(2))&255
  elif mode=='boarding':value=ident(call(address,ptr(1),0x8a03e4+index(packed)*16))
  elif mode=='adjust':call(address,ptr(1),out);value=None
  elif mode=='landing':value=call(address,ptr(2),out,out)&255
  else:value=call(address,out+8,direction,0x64f4a0)&255
  cache=read(0x64f4a0,'I');expected.append(dict(value=value,to=dict(x=read(out,'H'),y=read(out+2,'H')),records=list(cpu.mem_read(0x969d92,48)),count=read(0x969d8e,'h'),search=list(cpu.mem_read(0x89290d,192)),cacheCell=(cache-0x8a03e4)//16 if cache else -1,cacheResult=read(0x64f4a8,'B'),transition=read(0x6513dc,'B'),boat=ident(read(0x64f4a4,'I'))));cases.append(c)
 r=subprocess.run(['node','--input-type=module','-e',js],input=json.dumps(dict(mode=mode,cases=cases)),capture_output=True,text=True,cwd=root);assert r.returncode==0,r.stderr;actual=json.loads(r.stdout);assert len(actual)==len(expected)
 for i,(a,b) in enumerate(zip(expected,actual)):
  if a!=b:
   failure=Path('/private/tmp/populous-vehicle-routing-failure.json');failure.write_text(json.dumps(dict(mode=mode,index=i,case=cases[i],native=a,browser=b),indent=2));raise AssertionError((mode,i,str(failure)))
 print(f'PASS: 1,024 native vehicle {mode} comparisons, state, cell ordering and shared search/reservations',flush=True)
