"""Compare full 0x4b8470 decisions with original shapes, grade and cell objects.
Validity, allocation/initialization and plan removal are supplied external leaves.
Slot pruning, classification, priorities, readiness and timeout execute natively.
Usage: python SCRIPT EXE [--record]
"""
import json,random,struct,subprocess,sys
from pathlib import Path
from unicorn import UC_HOOK_CODE
from unicorn.x86_const import UC_X86_REG_ESP,UC_X86_REG_EIP,UC_X86_REG_EAX
from decomp import ROOT,native_cpu,configure_native_constants,load_native_shapes
exe=Path(sys.argv[1]);cpu,identity=native_cpu(exe);configure_native_constants(cpu,exe)
cpu.mem_map(0x2000000,0x50000);load_native_shapes(cpu,exe,0x2000000,0x2004000)
plan,people,scratch,allocation,stack,stop=0x2008000,0x2010000,0x2025000,0x2028000,0x204d000,0x204e000
rules=json.loads((ROOT/'app/original-rules.json').read_text());shapes=json.loads((ROOT/'app/original-shapes.json').read_text());rng=random.Random(0x4b8470)
def write(a,f,*v):cpu.mem_write(a,struct.pack('<'+f,*v))
def read(a,f):return struct.unpack('<'+f,cpu.mem_read(a,struct.calcsize('<'+f)))[0]
def call(a,*args):
 write(stack,'I'*(len(args)+1),stop,*[v&0xffffffff for v in args]);cpu.reg_write(UC_X86_REG_ESP,stack)
 cpu.emu_start(a,stop,count=100000);assert cpu.reg_read(UC_X86_REG_EIP)==stop,hex(cpu.reg_read(UC_X86_REG_EIP))
def leaf(c,a,size,u):
 global action
 sp=c.reg_read(UC_X86_REG_ESP);result=0
 if a==0x44ee50:result=int(valid)
 elif a==0x4b9190:
  assert read(sp+20,'B')==3;action='remove'
 elif a==0x4ed8a0:
  action='allocate';assert read(sp+4,'B')==2 and read(sp+8,'B')==model
  result=allocation if allocated else 0
 c.reg_write(UC_X86_REG_EAX,result);c.reg_write(UC_X86_REG_EIP,read(sp,'I'));c.reg_write(UC_X86_REG_ESP,sp+4)
for a in [0x44ee50,0x4b9190,0x4ed8a0,0x4ed6f0,0x4ed640]:cpu.hook_add(UC_HOOK_CODE,leaf,begin=a,end=a)
cases=[];expected=[]
for model in [1,2,3,4,5,7,10,13,14,18,19]:
 for trial in range(256):
  quadrant=trial%4;obj=rules['buildingObjects'][model];shapeIndex=shapes['objects'][obj][quadrant];shape=shapes['shapes'][shapeIndex]
  origin=rng.choice([0,0xfefe,0x8080,0x2020]);capacity=rules['buildingMaxWorkers'][model]
  count=rng.randrange(capacity+1);counter=rng.choice([0,1,15,16,127,128,255]);work=rng.choice([0,99,100,101])
  state=dict(model=model,counter=counter,dirty=bool(rng.randrange(2)),revalidate=bool(rng.randrange(3)==0),timeout=rng.choice([0,1,49,50,51,254,255]))
  valid=bool(rng.randrange(8));allocated=bool(trial%2)
  workers=[dict(task=rng.choice([1,2,2,2,3,4,5,6,7,8,9]),busy=rng.randrange(2),phase=rng.choice([0,4,5,6]),restart=bool(rng.randrange(2))) for _ in range(count)]
  # Deliberate allocation/departure gates alongside randomized mixtures.
  if trial%8 in [0,1,2]:
   workers=[dict(task=9 if trial%8!=2 else 2,busy=0,phase=6,restart=False) for _ in range(count)]
   state['dirty']=True;state['counter']=0;work=100
  cpu.mem_write(0x8a03e4,bytes(16384*16));cpu.mem_write(plan,bytes(256));cpu.mem_write(allocation,bytes(256))
  write(0x890390,'I',0);write(0x890390+42*4,'I',plan);write(0x892443,'I',scratch+0x1000)
  write(allocation+0x24,'H',1000)
  write(plan+0x24,'H',42);write(plan+0x2a,'BBBBBB',9,1,1,0,state['counter'],0)
  write(plan+0xc,'I',4 if state['revalidate'] else 0);write(plan+0x41,'h',64);write(plan+0x68,'H',origin)
  write(plan+0x96,'h',work);write(plan+0x9a,'BBBBBB',count,shapeIndex,int(state['dirty']),state['timeout'],model,quadrant)
  call(0x4b9d50,shapeIndex,origin,scratch,scratch+0x800)
  occupied=[read(scratch+i*8,'I') for i in range(read(scratch+0x800,'I'))]
  call(0x4b9e20,shapeIndex,origin,scratch,scratch+0x800)
  grade=[(read(scratch+i*8,'I'),read(scratch+i*8+6,'B')) for i in range(read(scratch+0x800,'I'))]
  for addr,mask in grade:write(addr+4,'h',0 if model in [13,14] and mask&128 else 64)
  uneven=bool(trial%8>2 and grade and rng.randrange(2))
  if uneven:write(grade[0][0]+4,'h',123)
  ids=[];onSite=rng.randrange(count+1) if trial%8>0 else 0
  if not occupied:onSite=0
  for i,w in enumerate(workers):
   p=people+i*256;cpu.mem_write(p,bytes(256));write(0x890390+(i+1)*4,'I',p);write(plan+0x6a+i*2,'H',i+1)
   write(p+0xc,'I',0x40000000 if w['restart'] else 0);write(p+0x24,'H',i+1);write(p+0x2a,'BBBB',1,2,10,w['task'])
   write(p+0x6e,'h',400);write(p+0x89,'H',42);write(p+0xa8,'B',w['phase']);write(p+0xaa,'B',w['busy'])
   if i<onSite:ids.append(i+1)
  counts=[rng.randrange(4) if trial%8>2 and occupied else 0 for _ in range(4)]
  scenery,friendly,enemies,vehicles=counts;wooden=False
  for klass,tribe,amount in [(5,0,scenery),(1,0,friendly),(1,1,enemies),(3,0,vehicles)]:
   for j in range(amount):
    index=100+len(ids);p=people+index*256;cpu.mem_write(p,bytes(256));write(0x890390+index*4,'I',p)
    wood=bool(rng.randrange(2));sceneryModel=1 if wood else 11
    write(p+0x2a,'BB',klass,sceneryModel if klass==5 else 2);write(p+0x2f,'B',tribe)
    if klass==5:wooden|=bool(rules['sceneryResourceFlags'][sceneryModel]&16)
    ids.append(index)
  if ids:
   write(occupied[0]+6,'H',ids[0])
   for i,index in enumerate(ids):write(read(0x890390+index*4,'I')+0x20,'H',ids[i+1] if i+1<len(ids) else 0)
  obstacles=dict(timber=work<rules['buildingPreparationWork'][model],grade=uneven,scenery=scenery,friendly=friendly,enemies=enemies,vehicles=vehicles,crew=onSite,wooden=wooden)
  # Validation traverses only occupied cells; no cells means no rejection.
  case=dict(plan=state,workers=workers,valid=valid or not occupied,obstacles=obstacles)
  action=None;call(0x4b8470,plan)
  after=[]
  for i,w in enumerate(workers):
   p=people+i*256;after.append(dict(task=read(p+0x2d,'B'),busy=read(p+0xaa,'B'),phase=read(p+0xa8,'B'),restart=bool(read(p+0xc,'I')&0x40000000)))
  result=dict(plan=dict(model=model,counter=state['counter'],dirty=bool(read(plan+0x9c,'B')&1),revalidate=bool(read(plan+0xc,'I')&4),timeout=read(plan+0x9d,'B')),workers=after,action=action)
  cases.append(case);expected.append(result)
js="""import {stepUnbuiltPlan} from './app/building-workers.ts';let s='';for await(const c of process.stdin)s+=c;console.log(JSON.stringify(JSON.parse(s).map(c=>{const plan={...c.plan},workers=structuredClone(c.workers);const action=stepUnbuiltPlan(plan,workers,()=>c.valid,()=>c.obstacles);return {plan,workers,action}})));"""
r=subprocess.run(['node','--input-type=module','-e',js],input=json.dumps(cases),capture_output=True,text=True,cwd=ROOT);assert r.returncode==0,r.stderr
actual=json.loads(r.stdout);assert len(actual)==len(expected)
for i,(a,e) in enumerate(zip(actual,expected)):
 if a!=e:
  Path('/private/tmp/populous-unbuilt-mismatch.json').write_text(json.dumps(dict(case=cases[i],actual=a,expected=e),indent=2));raise AssertionError((i,cases[i],a,e))
if '--record' in sys.argv:
 indexes=range(0,len(cases),5)
 (ROOT/'tests/fixtures/unbuilt-plan.json').write_text(json.dumps(dict(executableSha256=identity['sha256'],cases=[cases[i] for i in indexes],expected=[expected[i] for i in indexes]),separators=(',',':'))+'\n')
print('PASS:',len(cases),'native unbuilt-plan decisions, priorities, allocation gates, validation and abandonment')
