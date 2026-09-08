"""Compare native tree regrowth, delayed replanting and complete site search.
Original indexed rings, terrain tests and wood/scale consumers execute. Allocation
and removal are intercepted; native allocator scheduling/limits remain outside.
Usage: python scripts/check-native-tree-growth.py EXE [--record]
"""
import hashlib,json,random,struct,subprocess,sys
from pathlib import Path
from unicorn import UC_HOOK_CODE
from unicorn.x86_const import UC_X86_REG_ESP,UC_X86_REG_EIP,UC_X86_REG_EAX
from decomp import ROOT,native_cpu,configure_native_constants
exe=Path(sys.argv[1]);cpu,identity=native_cpu(exe);configure_native_constants(cpu,exe);cpu.mem_map(0x2000000,0x50000)
p,plant,objects,record,walk,stack,stop=0x2000000,0x2001000,0x2010000,0x2020000,0x2028000,0x204d000,0x204e000
rules=json.loads((ROOT/'app/original-rules.json').read_text());models=json.loads((ROOT/'app/original-models.json').read_text())
cpu.mem_write(objects,(exe.parent/'objects/objs0-2.dat').read_bytes())
data=(exe.parent/'data/mwsearch.dat').read_bytes();assert hashlib.sha256(data).hexdigest()=='0c39b12d160658863c2df89aa34484dff459e48ea0b5634658b7473ca940fae0';cpu.mem_write(0x8929cd,data)
def write(a,f,*v):cpu.mem_write(a,struct.pack('<'+f,*v))
def read(a,f):return struct.unpack('<'+f,cpu.mem_read(a,struct.calcsize('<'+f)))[0]
write(0x895ec1,'I',objects);write(0x96aa74,'I',walk)
def call(a,*args):
 write(stack,'I'*(len(args)+1),stop,*[x&0xffffffff for x in args]);cpu.reg_write(UC_X86_REG_ESP,stack)
 cpu.emu_start(a,stop,count=10000000);assert cpu.reg_read(UC_X86_REG_EIP)==stop,hex(cpu.reg_read(UC_X86_REG_EIP))
def hook(c,a,size,user):
 global removed,allocated,delay
 sp=c.reg_read(UC_X86_REG_ESP);result=0
 if a==0x4edcf0:removed=True
 elif a==0x4ed8a0:
  if mode=='delay':delay=read(record+8,'I')
  else:
   allocated=dict(x=read(read(sp+16,'I'),'H'),y=read(read(sp+16,'I')+2,'H'))
   if not case['allocationFails']:
    result=plant;cpu.mem_write(plant,bytes(256));write(plant+0x2a,'BB',5,case['model']);write(plant+0x33,'H',rules['sceneryObjects'][case['model']])
 c.reg_write(UC_X86_REG_EAX,result);c.reg_write(UC_X86_REG_EIP,read(sp,'I'));c.reg_write(UC_X86_REG_ESP,sp+4)
for a in [0x4a80b0,0x4edcf0,0x4ed8a0,0x4ef180]:cpu.hook_add(UC_HOOK_CODE,hook,begin=a,end=a)
def compare(js,cases,expected):
 r=subprocess.run(['node','--input-type=module','-e',"let s='';for await(const c of process.stdin)s+=c;const input=JSON.parse(s);"+js],input=json.dumps(cases),capture_output=True,text=True,cwd=ROOT);assert r.returncode==0,r.stderr
 actual=json.loads(r.stdout);assert len(actual)==len(expected)
 for i,(a,e) in enumerate(zip(actual,expected)):assert a==e,(i,cases[i],a,e)
mode='growth';growth=[];growthExpected=[]
for model in range(1,7):
 for counter in [0,1,15,16,31,32,127,255]:
  for wood in [100,198,398,400]:
   for rate in [0,2,20]:
    cpu.mem_write(p,bytes(256));write(p+0x2a,'BB',5,model);write(p+0x2e,'B',counter);write(p+0x41,'h',100);write(p+0x33,'H',rules['sceneryObjects'][model]);write(p+0x84,'hh',wood,rate)
    call(0x4a6f40,p);growth.append(dict(model=model,counter=counter,wood=wood,growth=rate));growthExpected.append(dict(wood=read(p+0x84,'h'),growth=read(p+0x86,'h')))
compare("import {stepTreeGrowth} from './app/tree-growth.ts';console.log(JSON.stringify(input.map(t=>{stepTreeGrowth(t);return {wood:t.wood,growth:t.growth}})));",growth,growthExpected)
print(f'PASS: {len(growth)} native per-object growth phases, model rates, capacity clamps and growth reset',flush=True)
mode='delay';delays=[];delayExpected=[]
for model in range(1,7):
 for tribe in [-1,0,1]:
  cpu.mem_write(p,bytes(256));write(p+0x2a,'BB',5,model);write(p+0x84,'h',100);write(p+0x2f,'b',-1);write(0x892443,'I',record)
  write(0x89d1c8+0xc1f,'B',2);write(0x89d1c8+0xc65+0xc1f,'B',1);delay=None;call(0x4a79f0,p,-4,tribe)
  delays.append(dict(model=model,computer=tribe==1));delayExpected.append(delay)
compare("import {replantDelay} from './app/tree-growth.ts';console.log(JSON.stringify(input.map(c=>replantDelay(c.model,c.computer))));",delays,delayExpected)
print('PASS: 18 original depletion allocations and human/computer/unowned replant delays',flush=True)
mode='replant';cases=[];expected=[];rng=random.Random(0x4a8370)
dry=next(i for i,f in enumerate(rules['terrainCategoryFlags']) if f&1)
for n in range(128):
 cpu.mem_write(0x8a03e4,bytes(16384*16));cpu.mem_write(walk,bytes([0 if n%11==0 else 255])*8192)
 pool=bytearray(192)
 if n%13==0:
  for i in range(1,16):pool[i*12]=1
 cpu.mem_write(0x89290d,bytes(pool))
 origin=dict(x=rng.choice([0,32768,65535]),y=rng.choice([0,32768,65535]));cells=[]
 for j in range(9):
  x=((origin['x']>>9)+(j%3)-1)&127;y=((origin['y']>>9)+(j//3)-1)&127;cell=y*128+x
  flags=rng.choice([0,0,2,4,0x200,0x400,0x10000,0x100000]);category=dry if j!=n%9 else 0
  cls,model=rng.choice([(0,0),(1,2),(5,1),(5,17),(10,16),(5,11)])
  entry=dict(cell=cell,flags=flags,category=category,objects=[] if not cls else [{'class':cls,'model':model}]);cells.append(entry)
  write(0x8a03e4+cell*16,'I',flags);write(0x8a03e4+cell*16+4,'h',100);write(0x8a03e4+cell*16+12,'B',category)
  if cls:
   obj=0x2030000+j*256;cpu.mem_write(obj,bytes(256));write(obj+0x2a,'BB',cls,model);write(0x890390+(j+1)*4,'I',obj);write(0x8a03e4+cell*16+6,'h',j+1)
 case=dict(**origin,model=n%6+1,remaining=[2,1,0,-1,-2147483648][n%5],landFlags=8 if n%2 else 0,cells=cells,walk=0 if n%11==0 else 255,pool=list(pool),allocationFails=n%7==0)
 cpu.mem_write(p,bytes(256));cpu.mem_write(plant,bytes(256));write(p+0x3d,'HH',origin['x'],origin['y']);write(p+0x68,'HHi',5,case['model'],case['remaining']);write(p+0x2f,'b',-1);write(0x89c661,'I',case['landFlags'])
 removed=False;allocated=None;call(0x4a8370,p)
 cases.append(case);expected.append(dict(remaining=read(p+0x6c,'i'),removed=removed,allocated=allocated,wood=read(plant+0x84,'h'),growth=read(plant+0x86,'h'),pool=list(cpu.mem_read(0x89290d,192))))
js="""import {stepReplant,findReplantSite} from './app/tree-growth.ts';import rules from './app/original-rules.json' with {type:'json'};
console.log(JSON.stringify(input.map(c=>{const land={flags:new Uint32Array(16384),categories:new Uint8Array(16384),walkMasks:[new Uint8Array(8192).fill(c.walk)],landFlags:c.landFlags},objects=new Map();for(const v of c.cells){land.flags[v.cell]=v.flags;land.categories[v.cell]=v.category;objects.set(v.cell,v.objects)}const pool=Uint8Array.from(c.pool),request={...c};let allocated=null,wood=0,growth=0;const removed=stepReplant(request,()=>{allocated=findReplantSite(land,pool,c,i=>objects.get(i)??[]);if(!allocated||c.allocationFails)return false;wood=100;growth=rules.sceneryGrowth[c.model];return true});return {remaining:request.remaining,removed,allocated,wood,growth,pool:[...pool]}})));
"""
compare(js,cases,expected)
print('PASS: 128 complete native delayed replant updates, indexed searches/slot bytes, wrapped sites, terrain/scenery/order/walk exclusions, allocation retry and sapling initialization',flush=True)
if '--record' in sys.argv:
 (ROOT/'tests/fixtures/tree-growth.json').write_text(json.dumps(dict(executableSha256=identity['sha256'],growth=growth,growthExpected=growthExpected,delays=delays,delayExpected=delayExpected,cases=cases,expected=expected),separators=(',',':'))+'\n')
