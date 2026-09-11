"""Complete native 0051e5e0 allocation/attachment/sharing, including coast correction.
All callees execute. Existing immediate commands use the ordinary cleanup domain
(no owned spell/fight/work objects). Full command execution/restoration is separate.
"""
import hashlib,json,random,struct,subprocess,sys
from pathlib import Path
from decomp import native_cpu,configure_native_constants,ROOT
from unicorn.x86_const import UC_X86_REG_EAX,UC_X86_REG_EIP,UC_X86_REG_ESP
cpu,_=native_cpu(Path(sys.argv[1]));configure_native_constants(cpu,Path(sys.argv[1]));cpu.mem_map(0x2000000,0x20000)
base,stack,stop=0x2000000,0x201d000,0x201f000
rng=random.Random(0x51e5e0)
def write(a,f,*v):cpu.mem_write(a,struct.pack('<'+f,*v))
def read(a,f):return struct.unpack('<'+f,cpu.mem_read(a,struct.calcsize('<'+f)))[0]
def call(a,*args):
 write(stack,'I'*(len(args)+1),stop,*args);cpu.reg_write(UC_X86_REG_ESP,stack);cpu.emu_start(a,stop,count=1000000)
 assert cpu.reg_read(UC_X86_REG_EIP)==stop,hex(cpu.reg_read(UC_X86_REG_EIP))
 return cpu.reg_read(UC_X86_REG_EAX)&255
def at(id_):return base+id_*256
def cell(p):return(p['y']>>9)*128+(p['x']>>9)
fields={'id':(0x24,'H'),'class':(0x2a,'B'),'model':(0x2b,'B'),'state':(0x2c,'B'),'substate':(0x2d,'B'),'tribe':(0x2f,'b'),'flags2':(0xc,'I'),'flags3':(0x14,'I'),'flags4':(0x10,'I'),'x':(0x3d,'H'),'y':(0x3f,'H'),'h':(0x41,'h'),'life':(0x6e,'h'),'assignment':(0x76,'H'),'selectionFlags':(0x7a,'B'),'orderLocation':(0x83,'H'),'workTarget':(0x89,'H'),'immediateCommand':(0x9b,'H'),'group':(0x9d,'H'),'vehicle':(0x9f,'H'),'commandCursor':(0xa6,'B'),'commandStatus':(0xa7,'B'),'disguise':(0xb2,'B')}
def person(id_,x,y,tribe,model,state):return dict(id=id_,**{'class':1},model=model,state=state,substate=0,tribe=tribe,flags2=0,flags3=rng.choice([0,0x2000000]),flags4=0,x=x,y=y,h=128,life=1000,assignment=0,selectionFlags=0,commands=[0]*8,commandCursor=0,commandStatus=0,immediateCommand=0,orderLocation=rng.randrange(65536),workTarget=0,group=0,vehicle=0,disguise=0,reactionTimer=0,reactionDuration=0)
def order(model=0,references=0):return dict(model=model,flags=0,references=references,object=0,a=rng.randrange(65536),b=rng.randrange(65536))
cases=[];expected=[]
for n in range(1024):
 x=rng.choice([0,511,512,65535,rng.randrange(65536)]);y=rng.randrange(65536)
 source=person(1,x,y,n%4,rng.choice([2,3,7]),rng.choice([10,17,33]))
 source['flags4']=0x800 if n&1 else 0
 people=[source]
 for id_ in range(2,10):
  p=person(id_,(x&0xfe00)+rng.randrange(512),(y&0xfe00)+rng.randrange(512),source['tribe'],source['model'],source['state'])
  if id_==2:p['class']=2
  if id_==3:p['model']=8
  if id_==4:p['tribe']=(source['tribe']+1)%4
  if id_==5:p['state']=25
  if id_==6:p['commandStatus']=28
  if id_==7:p['immediateCommand']=2
  p['flags4']=0x800 if rng.randrange(2) else 0
  if n%3==0 and id_==9:p['x']=(p['x']+512)&65535
  people.append(p)
 target=person(10,(x+rng.choice([0,512,1536,4096]))&65535,y,(source['tribe']+2)%4,2,17)
 target['class']=[1,10,2,9][n%4]
 if target['class']==10:target.update(model=8,flags4=rng.choice([0,0x100000,0x200000,0x300000]))
 land=[] if target['class'] not in [2,9] else [[cell(target),dict(flags=512 if target['class']==2 else 1024,owner=target['tribe']+1,building=target['id'])]]
 alliances=[0]*4;alliances[source['tribe']]=1<<((source['tribe']+1)%4)
 objects=people+[target]
 full=n%11==0;records=[order() for _ in range(800)]
 if full:
  for o in records[1:]:o['references']=1
 for id_ in [1,2,3]:records[id_]=order(3,2)
 source['commands'][0]=3
 records[3]['flags']=rng.choice([0,1,32]);records[3]['model']=rng.choice([3,5,21])
 if n%5==0:source['immediateCommand']=1
 records[1]['model']=3
 cursor=rng.choice([1,2,3,4,799,rng.randrange(1,800)])
 cells={}
 for p in objects:cells.setdefault(cell(p),[]).append(p['id'])
 for chain in cells.values():rng.shuffle(chain)
 categories=[[cell(source),rng.randrange(16)]]
 c=dict(land=land,objects=objects,cells=list(cells.items()),categories=categories,records=records,cursor=cursor,active=sum(bool(o['references']) for o in records),gameFlags=0,alliances=alliances,playerTypes=[1]*4)
 cases.append(c)
 cpu.mem_write(0x8a03e4,bytes(16384*16));cpu.mem_write(0x890390,bytes(4096));cpu.mem_write(base,bytes(4096));cpu.mem_write(0x9608b6,bytes(alliances));write(0x89d17c,'I',0);write(0x89d178,'I',12345)
 for i,v in categories:write(0x8a03e4+i*16+12,'B',v)
 for i,v in land:write(0x8a03e4+i*16,'I',v['flags']);write(0x8a03e4+i*16+8,'H',v['building']);write(0x8a03e4+i*16+11,'B',v['owner'])
 for p in objects:
  write(0x890390+p['id']*4,'I',at(p['id']))
  for name,(off,f) in fields.items():write(at(p['id'])+off,f,p[name])
  write(at(p['id'])+0x8b,'8H',*p['commands'])
 for i,chain in cells.items():
  write(0x8a03e4+i*16+6,'H',chain[0])
  for a,b in zip(chain,chain[1:]+[0]):write(at(a)+0x20,'H',b)
 cpu.mem_write(0x938830,b''.join(struct.pack('<BB4H',*o.values()) for o in records));write(0x96aa78,'HH',cursor,c['active'])
 result=call(0x51e5e0,at(1));assert read(0x89d178,'I')==12345
 snapshot=[]
 for p in objects:
  snapshot.append({name:read(at(p['id'])+off,f) for name,(off,f) in fields.items()}|{'commands':list(struct.unpack('<8H',cpu.mem_read(at(p['id'])+0x8b,16)))})
 expected.append(dict(result=result,people=snapshot,cursor=read(0x96aa78,'H'),active=read(0x96aa7a,'H'),pool=hashlib.sha256(cpu.mem_read(0x938830,8000)).hexdigest()))
js="""
import {createHash} from 'node:crypto';import {startCombatResponse} from './app/combat-orders.ts';
let text='';for await(const c of process.stdin)text+=c;const cases=JSON.parse(text);
const fail=()=>{throw Error('Unexpected native world consumer')};
console.log(JSON.stringify(cases.map(c=>{
const objects=new Map(c.objects.map(p=>[p.id,p])),cells=new Map(c.cells),land={flags:new Uint32Array(16384),owners:new Uint8Array(16384),categories:new Uint8Array(16384)};
for(const [i,v] of c.categories)land.categories[i]=v;
const buildings=new Map(c.land.map(([i,v])=>{land.flags[i]=v.flags;land.owners[i]=v.owner;return [i,{...objects.get(v.building),planKind:0,activity:0}]}));
const pool={records:c.records,cursor:c.cursor,active:c.active};
const world={...c,objects,land,buildingAt:i=>buildings.get(i),cellObjects:i=>(cells.get(i)??[]).map(id=>objects.get(id))},p=objects.get(1);
const result=startCombatResponse(world,pool,p,()=>world.cellObjects((p.y>>9)*128+(p.x>>9)),{prepare:fail,stopWork:fail,releaseSpell:fail,deleteObject:fail,releaseFight:fail});
const b=Buffer.alloc(8000);pool.records.forEach((o,i)=>{const offset=i*10;b.writeUInt8(o.model,offset);b.writeUInt8(o.flags,offset+1);['references','object','a','b'].forEach((k,j)=>b.writeUInt16LE(o[k],offset+2+j*2))});
const people=c.objects.map(({reactionTimer,reactionDuration,...p})=>p);
return {result,people,cursor:pool.cursor,active:pool.active,pool:createHash('sha256').update(b).digest('hex')};})));
"""
r=subprocess.run(['node','--input-type=module','-e',js],input=json.dumps(cases),capture_output=True,text=True,cwd=ROOT);assert r.returncode==0,r.stderr
actual=json.loads(r.stdout)
for i,(a,e) in enumerate(zip(actual,expected)):
 if a!=e:
  p=Path('/private/tmp/populous-combat-orders-failure.json');p.write_text(json.dumps(dict(case=cases[i],actual=a,expected=e),indent=2));raise AssertionError((i,str(p)))
assert {e['result'] for e in expected}=={0,1,2,3},set(e['result'] for e in expected)
print('PASS:',len(cases),'complete original automatic response initializers, all native callees, pool bytes/references, person fields, coast preparation and RNG unchanged.')
if '--write-fixtures' in sys.argv:
 chosen=range(0,1024,31)
 data=[dict(input={**cases[i],'records':[list(o.values()) for o in cases[i]['records']]},expected=expected[i]) for i in chosen]
 (ROOT/'tests/fixtures/combat-orders.json').write_text(json.dumps(data,separators=(',',':'))+'\n')

# Direct command preparation also covers the unchanged-record early return.
prepared=[]
for n in range(1024):
 a=rng.randrange(65536);b=rng.randrange(65536);category=rng.randrange(16);flags=rng.choice([0,32,48,50,255])
 model=19 if n&1 else 21
 before=order(rng.choice([0,3,19,21]),rng.randrange(65536));before['flags']=rng.randrange(256);before['object']=rng.randrange(65536)
 if n%3==0:before.update(model=model,a=a,b=b)
 cpu.mem_write(0x8a03e4,bytes(16384*16));write(0x8a03e4+(((a>>9)&127)*128+((a&254)>>1))*16+12,'B',category)
 cpu.mem_write(0x938830+100,struct.pack('<BB4H',*before.values()));write(base+0x4000,'HH',a,b)
 call(0x438730,10,model,base+0x4000,flags)
 result=dict(zip(before.keys(),struct.unpack('<BB4H',cpu.mem_read(0x938830+100,10))))
 prepared.append(dict(model=model,before=before,area=dict(a=a,b=b),category=category,flags=flags,expected=result))
js2="""
import {prepareCombatOrder} from './app/person-orders.ts';let text='';for await(const c of process.stdin)text+=c;
console.log(JSON.stringify(JSON.parse(text).map(c=>{const categories=new Uint8Array(16384),a=c.area.a;categories[((a>>>9)&127)*128+((a&254)>>1)]=c.category;prepareCombatOrder(c.before,c.area,c.flags,categories,c.model);return c.before})))
"""
r=subprocess.run(['node','--input-type=module','-e',js2],input=json.dumps(prepared),capture_output=True,text=True,cwd=ROOT);assert r.returncode==0,r.stderr
for i,(a,c) in enumerate(zip(json.loads(r.stdout),prepared)):assert a==c['expected'],(i,a,c)
print('PASS: 1024 complete command-19/21 preparation calls, all coastal categories, wrapped centers and unchanged-record flag retention.')
if '--write-fixtures' in sys.argv:(ROOT/'tests/fixtures/combat-order-preparation.json').write_text(json.dumps(prepared[::17],separators=(',',':'))+'\n')
