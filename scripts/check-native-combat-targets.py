"""Execute complete 0051eab0 threat detection and 0051c4c0 target selection.
All callees execute, including disguise, distance, fight admission and reservation.
Usage: python scripts/check-native-combat-targets.py /path/to/d3dpoptb.exe
"""
import json, random, struct, subprocess, sys
from pathlib import Path
from decomp import native_cpu, configure_native_constants, ROOT
from unicorn.x86_const import UC_X86_REG_ESP, UC_X86_REG_EIP, UC_X86_REG_EAX

exe=Path(sys.argv[1]);cpu,_=native_cpu(exe);configure_native_constants(cpu,exe)
cpu.mem_map(0x2000000,0x50000)
base,order_address,out,stack,stop=0x2000000,0x2040000,0x2040100,0x204d000,0x204f000
rng=random.Random(0x51c4c0)
def write(a,f,*v):cpu.mem_write(a,struct.pack('<'+f,*v))
def read(a,f):return struct.unpack('<'+f,cpu.mem_read(a,struct.calcsize('<'+f)))[0]
def address(id_):return base+id_*256
def call(a,*args):
 write(stack,'I'*(len(args)+1),stop,*args);cpu.reg_write(UC_X86_REG_ESP,stack);cpu.emu_start(a,stop,count=1000000)
 assert cpu.reg_read(UC_X86_REG_EIP)==stop,hex(cpu.reg_read(UC_X86_REG_EIP))
 return cpu.reg_read(UC_X86_REG_EAX)
def index(o):return (o['y']>>9)*128+(o['x']>>9)
fields={'id':(0x24,'H'),'class':(0x2a,'B'),'model':(0x2b,'B'),'tribe':(0x2f,'b'),'x':(0x3d,'H'),'y':(0x3f,'H'),'flags2':(0xc,'I'),'flags4':(0x10,'I'),'reactionTimer':(0x31,'B'),'reactionDuration':(0x32,'B')}
people={'state':(0x2c,'B'),'life':(0x6e,'h'),'vehicle':(0x9f,'H'),'group':(0x9d,'H'),'disguise':(0xb2,'B')}
def person(id_,x,y,tribe):return dict(id=id_,**{'class':1},model=rng.choice([2,3,4,5,6,7,8]),tribe=tribe,x=x,y=y,flags2=rng.choice([0,0,0,0x10000,0x800000]),flags4=rng.choice([0,0,0,0x1000,0x400,0x100000,0x200000,0x300000]),reactionTimer=rng.choice([0,1,2,3,4,255]),reactionDuration=rng.randrange(50),state=rng.choice([10,17,23,25,29]),life=rng.choice([0,1,60,360,1000]),vehicle=1 if rng.randrange(13)==0 else 0,group=0,disguise=rng.randrange(256))
cases=[];expected=[];types={i:0 for i in range(5)}
for n in range(2048):
 x=rng.choice([0,511,512,32767,32768,65535,rng.randrange(65536)]);y=rng.choice([0,511,512,65535,rng.randrange(65536)])
 source=person(1,x,y,n%4);source.update(state=17,flags2=0,flags4=0,vehicle=0,life=1000)
 rx,ry=rng.choice([(0,0),(2,2),(4,4),(6,2),(3,5),(8,8)])
 order=dict(model=19 if n%5==0 else 21,flags=rng.choice([0,2,16,18,32,48]),a=((x>>8)&254)|(y&0xfe00),b=rx|(ry<<8))
 objects=[source];cells={};land={};alliance=[rng.choice([0,0,0,15,rng.randrange(16)]) for _ in range(4)];players=[rng.choice([1,2]) for _ in range(4)]
 def add(o):objects.append(o);cells.setdefault(index(o),[]).append(o['id'])
 dense=n%32==0
 for i in range(2,82 if dense else rng.randrange(4,38)):
  ox=((x&0xfe00)+rng.randrange(512)+(0 if dense else rng.randrange(-rx//2-1,rx//2+2)*512))&65535
  oy=((y&0xfe00)+rng.randrange(512)+(0 if dense else rng.randrange(-ry//2-1,ry//2+2)*512))&65535
  o=person(i,ox,oy,rng.choice([0,1,2,3,-1]))
  if dense:o.update(model=2,tribe=(source['tribe']+1)%4,state=17,life=1000,flags2=0,flags4=0,vehicle=0)
  add(o)
 if dense:alliance=[0]*4;rx=ry=0;order.update(a=((x>>8)&254)|(y&0xfe00),b=0)
 else:
  for _ in range(rng.randrange(5)):
   id_=len(objects)+1
   pool=[o for o in objects[1:] if o['class']==1]
   members=rng.sample(pool,min(len(pool),rng.randrange(2,7)))
   for member in members:member['tribe']=source['tribe'] if rng.randrange(2) else (source['tribe']+1)%4;member['group']=id_
   slots=[member['id'] for member in members]+[0]*(6-len(members));rng.shuffle(slots)
   o=dict(id=id_,**{'class':10},model=rng.choice([8,8,8,9]),tribe=-1,x=(x+rng.randrange(-1500,1501))&65535,y=(y+rng.randrange(-1500,1501))&65535,flags2=0,flags4=rng.choice([0,0x100000,0x200000,0x300000]),reactionTimer=rng.choice([0,1,3,4,5,9,10,255]),reactionDuration=rng.randrange(50),members=slots,tribes=[source['tribe'],(source['tribe']+1)%4] if n%7 else [2,3],center=rng.choice(slots))
   add(o)
  for _ in range(rng.randrange(7)):
   id_=len(objects)+1;cls=rng.choice([2,9]);model=rng.randrange(1,20)
   o=dict(id=id_,**{'class':cls},model=model,tribe=rng.randrange(4),x=(x+rng.randrange(-1800,1801))&65535,y=(y+rng.randrange(-1800,1801))&65535,flags2=0,flags4=rng.choice([0,0x100000,0x200000,0x300000]),reactionTimer=rng.choice([0,1,2,3,255]),reactionDuration=rng.randrange(50),planKind=rng.randrange(6),activity=rng.choice([0,16,128,144]))
   objects.append(o)
   for cell in [index(o),(index(o)+1)%16384]:land[cell]=dict(flags=512 if cls==2 else 1024,owner=o['tribe']+1,building=id_|0xfc00)
 for chain in cells.values():rng.shuffle(chain)
 categories=[[cell,rng.randrange(16)] for cell in cells]
 case=dict(categories=categories,checkBuildings=bool(n&1),force=bool(n&2),objects=objects,cells=list(cells.items()),land=list(land.items()),alliances=alliance,playerTypes=players,gameFlags=2 if n%5 else 0,order=order)
 cases.append(case)
 cpu.mem_write(0x8a03e4,bytes(16384*16));cpu.mem_write(0x890390,bytes(1024*4));cpu.mem_write(base,bytes(100*256));write(0x89d178,'I',1234567);write(0x89d17c,'I',case['gameFlags']);cpu.mem_write(0x9608b6,bytes(alliance))
 for i,player in enumerate(players):write(0x89d1c8+i*0xc65+0xc1f,'B',player)
 for o in objects:
  a=address(o['id']);write(0x890390+o['id']*4,'I',a)
  for name,(off,f) in fields.items():write(a+off,f,o[name])
  if o['class']==1:
   for name,(off,f) in people.items():write(a+off,f,o[name])
  elif o['class']==10:
   write(a+0x69,'2b',*o['tribes']);write(a+0x6c,'H',o['center']);write(a+0x70,'6H',*o['members'])
  else:write(a+0x9e,'B',o['planKind']);write(a+0x9c,'B',o['activity'])
 for cell,chain in cells.items():
  write(0x8a03e4+cell*16+6,'H',chain[0])
  for i,id_ in enumerate(chain):write(address(id_)+0x20,'H',chain[i+1] if i+1<len(chain) else 0)
 for cell,v in land.items():write(0x8a03e4+cell*16,'I',v['flags']);write(0x8a03e4+cell*16+8,'H',v['building']);write(0x8a03e4+cell*16+11,'B',v['owner'])
 for cell,category in categories:write(0x8a03e4+cell*16+12,'B',category)
 threat=call(0x51eab0,address(1),order['a'],rx,ry,case['checkBuildings'],case['force'])&255
 write(order_address,'BBHHHH',order['model'],order['flags'],1,0,order['a'],order['b']);write(out,'B',255)
 selected=call(0x51c4c0,address(1),order_address,out)&65535;kind=read(out,'B');types[kind]+=1
 assert read(0x89d178,'I')==1234567
 expected.append(dict(threat=threat,id=selected,type=kind,reservations=[[o['id'],read(address(o['id'])+0x10,'I'),read(address(o['id'])+0x31,'B'),read(address(o['id'])+0x32,'B')] for o in objects]))
js="""
import {selectCombatTarget,detectCombatThreat} from './app/combat-targets.ts';
let s='';for await(const c of process.stdin)s+=c;const input=JSON.parse(s);
console.log(JSON.stringify(input.map(c=>{const objects=new Map(c.objects.map(o=>[o.id,o])),cells=new Map(c.cells),land={flags:new Uint32Array(16384),owners:new Uint8Array(16384),buildingIds:new Uint16Array(16384),categories:new Uint8Array(16384)};
for(const [i,v] of c.land){land.flags[i]=v.flags;land.owners[i]=v.owner;land.buildingIds[i]=v.building}
for(const [i,v] of c.categories)land.categories[i]=v;
const world={...c,land,objects,buildingAt:i=>objects.get(land.buildingIds[i]&1023),cellObjects:i=>(cells.get(i)??[]).map(id=>objects.get(id))};
const threat=detectCombatThreat(world,objects.get(1),c.order,c.checkBuildings,c.force);
const result=selectCombatTarget(world,objects.get(1),c.order);
return {threat,id:result?.target.id??0,type:result?.type??0,reservations:c.objects.map(o=>[o.id,o.flags4,o.reactionTimer,o.reactionDuration])};})));
"""
r=subprocess.run(['node','--input-type=module','-e',js],input=json.dumps(cases),capture_output=True,text=True,cwd=ROOT);assert r.returncode==0,r.stderr
actual=json.loads(r.stdout);assert len(actual)==len(expected)
for i,(a,e) in enumerate(zip(actual,expected)):
 if a!=e:
  path=Path('/private/tmp/populous-combat-target-failure.json');path.write_text(json.dumps(dict(case=cases[i],actual=a,expected=e),indent=2));raise AssertionError((i,str(path)))
assert all(types.values()),types
print('PASS:',len(cases),'complete native threat detectors and area target selectors; result types',types,'; full reservation fields, wrapped collection, ties, 64-candidate cap and native callees. No supplied behavioral callbacks.')

if '--write-fixtures' in sys.argv:
 chosen=sorted(set(range(0,2048,37))|set(next(i for i,e in enumerate(expected) if e['type']==t) for t in range(5)))
 (ROOT/'tests/fixtures/combat-targets.json').write_text(json.dumps(dict(executableSha256='3a5065c7420b3fcde208bf220bc86dfbac95e025ab2492caf9c7ea5308dfbe4f',entries=['0051eab0','0051c4c0'],cases=[dict(input=cases[i],expected=expected[i]) for i in chosen]),separators=(',',':'))+'\n')
