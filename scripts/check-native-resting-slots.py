"""Compare indexed searches, startup slot tables and resting ownership.
Usage: python scripts/check-native-resting-slots.py /path/to/d3dpoptb.exe
Uses the original MWSEARCH.DAT. Search, geometry, terrain and command predicates
execute natively; only the building outside-point consumer is supplied.
"""
import copy,hashlib,json,random,struct,subprocess,sys
from pathlib import Path
from unicorn import UC_HOOK_CODE
from unicorn.x86_const import UC_X86_REG_ESP,UC_X86_REG_EIP,UC_X86_REG_EAX
from decomp import native_cpu,configure_native_constants
root=Path(__file__).resolve().parents[1];exe=Path(sys.argv[1]);cpu,_=native_cpu(exe);configure_native_constants(cpu,exe);rng=random.Random(0x4d5120)
data=(exe.parent/'data/mwsearch.dat').read_bytes();assert hashlib.sha256(data).hexdigest()=='0c39b12d160658863c2df89aa34484dff459e48ea0b5634658b7473ca940fae0';cpu.mem_write(0x8929cd,data)
cpu.mem_map(0x2000000,0x20000);base,out,stack,stop=0x2000000,0x2008000,0x201e000,0x201f000
def write(a,f,*v):cpu.mem_write(a,struct.pack('<'+f,*v))
def read(a,f):return struct.unpack('<'+f,cpu.mem_read(a,struct.calcsize('<'+f)))[0]
def call(a,*args):
 write(stack,'I'*(len(args)+1),stop,*[v&0xffffffff for v in args]);cpu.reg_write(UC_X86_REG_ESP,stack);cpu.emu_start(a,stop,count=3000000);assert cpu.reg_read(UC_X86_REG_EIP)==stop,hex(cpu.reg_read(UC_X86_REG_EIP));return cpu.reg_read(UC_X86_REG_EAX)
def browser(js,payload):
 r=subprocess.run(['node','--input-type=module','-e',js],input=json.dumps(payload),capture_output=True,text=True,cwd=root);assert r.returncode==0,r.stderr;return json.loads(r.stdout)
def compare(mode,cases,expected,actual):
 assert len(actual)==len(expected)
 for i,(a,b) in enumerate(zip(expected,actual)):
  if a!=b:
   path=Path('/private/tmp/populous-resting-slots-failure.json');path.write_text(json.dumps(dict(mode=mode,index=i,case=cases[i],native=a,browser=b),indent=2));raise AssertionError((mode,i,str(path)))

# Preserve all bytes across allocation, exhaustion, reuse and interleaved walks.
initial=[rng.randrange(256) for _ in range(192)]
for i in range(16):initial[i*12]=0
cpu.mem_write(0x89290d,bytes(initial));ops=[];expected=[];running=set();allocated=set()
for i in range(16384):
 action=rng.choice(['start','next','next','next','end']) if allocated else 'start'
 if action=='next' and not running:action='end'
 if action=='start':
  op=dict(action=action,type=rng.choice([1,2]),angle=rng.randrange(65536),first=rng.choice([0,0,1,2,31,255]),last=rng.choice([0,1,2,3,16,31,255]));result=call(0x49a2f0,op['type'],op['angle'],op['first'],op['last'])&255
  if result:allocated.add(result);running.add(result)
 elif action=='end':
  op=dict(action=action,id=rng.choice(sorted(allocated)));call(0x49a5d0,op['id']);allocated.remove(op['id']);running.discard(op['id']);result=None
 else:
  op=dict(action=action,id=rng.choice(sorted(running)));write(out,'ii',123456789,-123456789);valid=call(0x49a3f0,op['id'],out,out+4)&255
  result=dict(x=read(out,'i'),y=read(out+4,'i')) if valid else None
  if not valid:assert read(out,'i')==123456789 and read(out+4,'i')==-123456789;running.remove(op['id'])
 ops.append(op);expected.append(dict(result=result,pool=list(cpu.mem_read(0x89290d,192))))
actual=browser("""import {startIndexedSearch,nextIndexedSearch,endIndexedSearch} from './app/indexed-search.ts';let s='';for await(const c of process.stdin)s+=c;const c=JSON.parse(s),pool=Uint8Array.from(c.initial);console.log(JSON.stringify(c.ops.map(o=>{let result=null;if(o.action==='start')result=startIndexedSearch(pool,o.type,o.angle,o.first,o.last);else if(o.action==='next')result=nextIndexedSearch(pool,o.id);else endIndexedSearch(pool,o.id);return {result,pool:[...pool]};})));""",dict(initial=initial,ops=ops))
compare('search',ops,expected,actual);print('PASS: 16,384 sequential native indexed-search operations and all record bytes',flush=True)

cpu.mem_write(0x895ed9,bytes(256));call(0x42c210)
native_slots=[[]]
for n in range(1,9):
 ptr=read(0x895ed9+n*4,'I');native_slots.append([dict(x=read(ptr+i*4,'h'),y=read(ptr+i*4+2,'h')) for i in range(n+1)])
native_slots[0]=native_slots[6]
actual=browser("""import {createRestingSlots} from './app/resting-slots.ts';console.log(JSON.stringify(createRestingSlots()));""",{})
assert actual==native_slots,(actual,native_slots);print('PASS: native startup geometry, all 44 slot positions and default shape alias',flush=True)

fields={'id':(0x24,'H'),'class':(0x2a,'B'),'model':(0x2b,'B'),'state':(0x2c,'B'),'flags3':(0x14,'I'),'assignment':(0x76,'H'),'formationCell':(0x80,'H'),'anchorFlags':(0x82,'B'),'commandCursor':(0xa6,'B'),'immediateCommand':(0x9b,'H'),'physics':(0x30,'B'),'heading':(0x5d,'H'),'anchorX':(0x68,'H'),'anchorY':(0x6a,'H')}
def ptr(i):return base+i*256
def people():return [{**{k:read(ptr(i)+off,f) for k,(off,f) in fields.items()},'commands':[read(ptr(i)+0x8b+j*2,'H') for j in range(8)]} for i in range(1,9)]
def leaf(cpu,a,size,u):
 sp=cpu.reg_read(UC_X86_REG_ESP);events.append(['outside',read(read(sp+4,'I')+0x24,'H')]);write(read(sp+8,'I'),'HH',case['outside']['x'],case['outside']['y']);cpu.reg_write(UC_X86_REG_EIP,read(sp,'I'));cpu.reg_write(UC_X86_REG_ESP,sp+4)
cpu.hook_add(UC_HOOK_CODE,leaf,begin=0x4044b0,end=0x4044b0)
land=dict(heights=[rng.randrange(0,90) for _ in range(16384)],flags=[0]*16384,categories=[0]*16384,buildingIds=[0]*16384)
# Alternating water/land cells ensure both successful and exhausted searches.
rules=json.loads((root/'app/original-rules.json').read_text());landcat=next(i for i,f in enumerate(rules['terrainCategoryFlags']) if f&1)
land['categories']=[landcat if i%3 else 0 for i in range(16384)]
for i in range(16384):write(0x8a03e4+i*16,'IhHHBBBBBB',0,land['heights'][i],0,0,0,0,land['categories'][i],0,0,0)
js="""import {createRestingSlots,restingCellAvailable,restingSlotAvailable,findRestingSlot,rebuildRestingSlots} from './app/resting-slots.ts';let s='';for await(const c of process.stdin)s+=c;const input=JSON.parse(s),land=input.land;
console.log(JSON.stringify(input.cases.map(c=>{const people=c.people,events=[],search=Uint8Array.from(c.search),i=(c.cell>>9)*128+((c.cell&254)>>1),saved={flags:land.flags[i],category:land.categories[i],building:land.buildingIds[i]};land.flags[i]=c.flags;land.categories[i]=c.category;land.buildingIds[i]=2;
const w={land,search,slotOffsets:createRestingSlots(),orders:{records:c.orders,cursor:0,active:0},cellObjects:cell=>cell===c.cell?people:[],outside:id=>{events.push(['outside',id]);return c.outside;}};
let result=null;if(input.mode==='cell')result=Number(restingCellAvailable(w,c.cell));else if(input.mode==='valid')result=Number(restingSlotAvailable(w,people[0]));else if(input.mode==='find')result=Number(findRestingSlot(w,people[0]));else rebuildRestingSlots(w,c.cell);
land.flags[i]=saved.flags;land.categories[i]=saved.category;land.buildingIds[i]=saved.building;return {people,search:[...search],events,result};})));"""
for mode,address in [('cell',0x4d55a0),('valid',0x4d5420),('find',0x4d5120),('rebuild',0x4d56f0)]:
 cases=[];expected=[]
 for i in range(2048):
  cell=rng.randrange(65536)&0xfefe;ci=(cell>>9)*128+((cell&254)>>1);ps=[]
  for n in range(1,9):
   model=rng.randrange(9);cl=rng.choice([1,1,1,4,7]);model=model%5 if cl==4 else model
   ps.append(dict(id=n,**{'class':cl},model=model,state=rng.choice([10,19,33]),flags3=rng.choice([0,0,16]),assignment=rng.choice([0,1,1,3]),formationCell=cell if n==1 or rng.randrange(4) else (cell+512)&0xfefe,anchorFlags=rng.randrange(7)|(rng.randrange(7)<<4),commandCursor=rng.randrange(8),immediateCommand=rng.choice([0,0,1,2]),physics=rng.randrange(20),heading=rng.randrange(2048),anchorX=((cell&255)+1)*256,anchorY=((cell>>8)+1)*256,commands=[rng.choice([0,0,1,2]) for _ in range(8)]))
  ps[0].update(**{'class':1},model=i%9)
  # A settled shape owns slots 0..population; shape zero aliases six. Other
  # combinations read unrelated native storage and are not valid ownership.
  if mode=='valid':
   shape=ps[0]['anchorFlags']>>4;ps[0]['anchorFlags']=(shape<<4)|rng.randrange((shape or 6)+1)
  order=[dict(model=0,flags=0),dict(model=24,flags=i%2),dict(model=8,flags=0)]
  pool=[rng.randrange(256) for _ in range(192)]
  for n in range(16):pool[n*12]=1 if i%16==0 else 0
  case=dict(people=ps,cell=cell,flags=rng.choice([0,0,0,2,4,512,0x4000]),category=landcat if i%3 else 0,orders=order,search=pool,outside=dict(x=1000,y=2000))
  cpu.mem_write(0x89290d,bytes(pool));cpu.mem_write(0x890390,bytes(4096))
  for person in ps:
   n=person['id'];cpu.mem_write(ptr(n),bytes(256));write(0x890390+n*4,'I',ptr(n));write(ptr(n)+0x20,'H',n+1 if n<8 else 0)
   for k,(off,f) in fields.items():write(ptr(n)+off,f,person[k])
   write(ptr(n)+0x8b,'8H',*person['commands'])
  for n,o in enumerate(order):write(0x938830+n*10,'BB',o['model'],o['flags'])
  tile=0x8a03e4+ci*16;write(tile,'I',case['flags']);write(tile+6,'HH',1,2);write(tile+12,'B',case['category']);events=[]
  if mode=='cell':result=call(address,tile)&255
  elif mode=='valid':result=call(address,ptr(1),ptr(1)+0x80)&255
  elif mode=='find':result=call(address,ptr(1))&255
  else:call(address,cell);result=None
  expected.append(dict(people=people(),search=list(cpu.mem_read(0x89290d,192)),events=copy.deepcopy(events),result=result));cases.append(case)
  write(tile,'I',0);write(tile+6,'HH',0,0);write(tile+12,'B',land['categories'][ci])
 actual=browser(js,dict(mode=mode,land=land,cases=cases));compare(mode,cases,expected,actual);print(f'PASS: 2,048 native resting {mode} comparisons',flush=True)
