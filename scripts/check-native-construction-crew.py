"""Compare complete constructed-plan decisions at 0x4b8bb0.
Native slot pruning/classification execute; smoke/terrain, fire reaction leaves
and object removal are observed consumers. Usage: python SCRIPT EXE [--record]
"""
import json,random,struct,subprocess,sys
from pathlib import Path
from unicorn import UC_HOOK_CODE
from unicorn.x86_const import UC_X86_REG_ESP,UC_X86_REG_EIP,UC_X86_REG_EAX
from decomp import ROOT,native_cpu,configure_native_constants
exe=Path(sys.argv[1]);cpu,identity=native_cpu(exe);configure_native_constants(cpu,exe)
cpu.mem_map(0x2000000,0x40000)
plan,building,people,stack,stop=0x2000000,0x2001000,0x2010000,0x203d000,0x203e000
rules=json.loads((ROOT/'app/original-rules.json').read_text());rng=random.Random(0x4b8bb0)
def write(a,f,*v):cpu.mem_write(a,struct.pack('<'+f,*v))
def read(a,f):return struct.unpack('<'+f,cpu.mem_read(a,struct.calcsize('<'+f)))[0]
def hook(c,a,size,user):
 sp=c.reg_read(UC_X86_REG_ESP)
 if a==0x40afd0:events.append('resume')
 elif a==0x4ef180:events.append('remove')
 elif a==0x4ed640:events.append('evacuate:'+str(read(read(sp+4,'I')+0x24,'H')))
 c.reg_write(UC_X86_REG_EAX,0);c.reg_write(UC_X86_REG_EIP,read(sp,'I'));c.reg_write(UC_X86_REG_ESP,sp+4)
for a in [0x40afd0,0x4ef180,0x4e9b40,0x4ed6f0,0x4ed640]:cpu.hook_add(UC_HOOK_CODE,hook,begin=a,end=a)
write(0x890390+100*4,'I',building)
cases=[];expected=[]
for model in range(20):
 for trial in range(256):
  maximum=rules['buildingMaxWorkers'][model];count=rng.randrange(maximum+1)
  counter=rng.choice([0,1,15,16,31,32,255]);capacity=rules['buildingLife'][model]
  remaining=rng.choice([0,capacity//2,max(0,capacity-1),capacity,capacity+1])
  delay=rng.choice([0,1,2,3,16,1200,32767,-32768,-1]);burning=bool(rng.randrange(4)==0)
  workers=[dict(id=i+1,task=rng.randrange(10),busy=rng.randrange(3),phase=rng.choice([0,1,5,6]),restart=bool(rng.randrange(2))) for i in range(count)]
  cpu.mem_write(plan,bytes(256));cpu.mem_write(building,bytes(256))
  write(plan+0x24,'H',42);write(plan+0x2a,'B',9);write(plan+0x2e,'B',counter)
  write(plan+0x92,'H',100);write(plan+0x94,'h',delay);write(plan+0x96,'h',remaining)
  write(plan+0x9a,'B',count);write(plan+0x9e,'B',model)
  write(building+0x2a,'BBB',2,model,4 if burning else 1);write(building+0x82,'H',42)
  for w in workers:
   p=people+w['id']*256;cpu.mem_write(p,bytes(256));write(0x890390+w['id']*4,'I',p)
   write(plan+0x6a+(w['id']-1)*2,'H',w['id']);write(p+0x24,'H',w['id'])
   write(p+0xc,'I',0x40000000 if w['restart'] else 0);write(p+0x2a,'BBBB',1,2,10,w['task'])
   write(p+0x6e,'h',400);write(p+0x89,'H',42);write(p+0xa8,'B',w['phase']);write(p+0xaa,'B',w['busy'])
  events=[];write(stack,'II',stop,plan);cpu.reg_write(UC_X86_REG_ESP,stack)
  cpu.emu_start(0x4b8bb0,stop,count=100000);assert cpu.reg_read(UC_X86_REG_EIP)==stop
  cases.append(dict(model=model,counter=counter,work=remaining,repairDelay=delay,burning=burning,workers=workers))
  result=[]
  for w in workers:
   p=people+w['id']*256
   result.append(dict(id=w['id'],task=read(p+0x2d,'B'),busy=read(p+0xaa,'B'),phase=read(p+0xa8,'B'),restart=bool(read(p+0xc,'I')&0x40000000)))
  expected.append(dict(repairDelay=read(plan+0x94,'h'),workers=result,events=events,linked=read(building+0x82,'H')))
js="""import {stepConstructionCrew} from './app/building-workers.ts';let input='';for await(const c of process.stdin)input+=c;
console.log(JSON.stringify(JSON.parse(input).map(c=>{const plan={...c},workers=structuredClone(c.workers),events=[];
const removed=stepConstructionCrew(plan,workers,{resume:()=>events.push('resume'),evacuate:w=>events.push('evacuate:'+w.id)});
if(removed)events.push('remove');return {repairDelay:plan.repairDelay,workers,events,linked:removed?0:42}})));"""
r=subprocess.run(['node','--input-type=module','-e',js],input=json.dumps(cases),capture_output=True,text=True,cwd=ROOT);assert r.returncode==0,r.stderr
actual=json.loads(r.stdout);assert len(actual)==len(expected)
for c,a,e in zip(cases,actual,expected):assert a==e,(c,a,e)
if '--record' in sys.argv:
 indexes=range(0,len(cases),8)
 (ROOT/'tests/fixtures/construction-crew.json').write_text(json.dumps(dict(executableSha256=identity['sha256'],cases=[cases[i] for i in indexes],expected=[expected[i] for i in indexes]),separators=(',',':'))+'\n')
print(f'PASS: {len(cases)} complete native constructed-plan calls: crew readiness/dispatch, repair delays, fire evacuation and departure gates')
