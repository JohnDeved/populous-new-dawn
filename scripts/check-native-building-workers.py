"""Run complete original builder admission and stale-slot pruning, without hooks.
Usage: python scripts/check-native-building-workers.py EXE [--record]
"""
import json, random, struct, subprocess, sys
from pathlib import Path
from unicorn.x86_const import UC_X86_REG_ESP, UC_X86_REG_EIP, UC_X86_REG_EAX
from decomp import ROOT, native_cpu, configure_native_constants
exe=Path(sys.argv[1]);cpu,identity=native_cpu(exe);configure_native_constants(cpu,exe)
cpu.mem_map(0x2000000,0x40000)
plan,p,people,stack,stop=0x2000000,0x2001000,0x2010000,0x203d000,0x203e000
rng=random.Random(0x4b9cc0)
rules=json.loads((ROOT/'app/original-rules.json').read_text())
def write(a,f,*v):cpu.mem_write(a,struct.pack('<'+f,*v))
def read(a,f):return struct.unpack('<'+f,cpu.mem_read(a,struct.calcsize('<'+f)))[0]
def call(a,*args):
 write(stack,'I'*(len(args)+1),stop,*args);cpu.reg_write(UC_X86_REG_ESP,stack)
 cpu.emu_start(a,stop,count=100000);assert cpu.reg_read(UC_X86_REG_EIP)==stop
 return cpu.reg_read(UC_X86_REG_EAX)&255
cases=[];expected=[];pruning=[];pruned=[]
for model in range(20):
 limit=read(0x5a7228+model*76+20,'H');assert limit==rules['buildingMaxWorkers'][model] and limit<=20
 for trial in range(64):
  slots=[i+1 if rng.randrange(3) else 0 for i in range(limit)];id=rng.randrange(1,25)
  cpu.mem_write(plan,bytes(256));write(plan+0x9e,'B',model);write(plan+0x9a,'B',sum(bool(n) for n in slots))
  for i,n in enumerate(slots):write(plan+0x6a+i*2,'H',n)
  write(p+0x24,'H',id);result=call(0x4b9cc0,p,plan)
  cases.append(dict(model=model,slots=slots,id=id));expected.append(dict(accepted=bool(result),slots=[read(plan+0x6a+i*2,'H') for i in range(limit)],count=read(plan+0x9a,'B')))
for trial in range(512):
 model=trial%20;limit=rules['buildingMaxWorkers'][model];slots=[i+1 if rng.randrange(3) else 0 for i in range(limit)]
 owner=trial%4;records=[]
 cpu.mem_write(plan,bytes(256));write(plan+0x24,'H',42);write(plan+0x2f,'B',owner);write(plan+0x9a,'B',sum(bool(n) for n in slots))
 for i,id in enumerate(slots):
  write(plan+0x6a+i*2,'H',id)
  if not id:continue
  r=dict(id=id,flags=rng.choice([0,0,1]),cls=rng.choice([0,1,1]),hp=rng.choice([-1,0,1,400]),state=rng.choice([10,10,14]),owner=rng.choice([owner,owner,(owner+1)%4]),plan=rng.choice([42,42,99]))
  records.append(r);a=people+id*256;cpu.mem_write(a,bytes(256));write(0x890390+id*4,'I',a)
  write(a+0xc,'I',r['flags']);write(a+0x2a,'B',r['cls']);write(a+0x2c,'B',r['state']);write(a+0x2f,'B',r['owner']);write(a+0x6e,'h',r['hp']);write(a+0x89,'H',r['plan'])
 call(0x4ba1b0,plan)
 pruning.append(dict(slots=slots,owner=owner,records=records));pruned.append(dict(slots=[read(plan+0x6a+i*2,'H') for i in range(limit)],count=read(plan+0x9a,'B')))
js="""import {assignBuilder,pruneBuilders} from './app/building-workers.ts';let text='';for await(const c of process.stdin)text+=c;const data=JSON.parse(text);
console.log(JSON.stringify({assigned:data.cases.map(c=>{const slots=[...c.slots],accepted=assignBuilder(slots,c.id);return {slots,accepted,count:slots.filter(Boolean).length}}),pruned:data.pruning.map(c=>{const slots=[...c.slots];pruneBuilders(slots,id=>{const p=c.records.find(p=>p.id===id);return !!p&&!(p.flags&1)&&p.cls!==0&&p.hp>0&&p.state===10&&p.owner===c.owner&&p.plan===42});return {slots,count:slots.filter(Boolean).length}})}));"""
r=subprocess.run(['node','--input-type=module','-e',js],input=json.dumps(dict(cases=cases,pruning=pruning)),capture_output=True,text=True,cwd=ROOT);assert r.returncode==0,r.stderr
actual=json.loads(r.stdout)
for cs,values,other in [(cases,expected,actual['assigned']),(pruning,pruned,actual['pruned'])]:
 assert len(values)==len(other)
 for c,e,a in zip(cs,values,other):assert a==e,(c,a,e)
if '--record' in sys.argv:
 (ROOT/'tests/fixtures/building-workers.json').write_text(json.dumps(dict(executableSha256=identity['sha256'],cases=cases,expected=expected,pruning=pruning,pruned=pruned),separators=(',',':'))+'\n')
print(f'PASS: {len(cases)} complete native builder admissions across all 20 descriptor capacities and {len(pruning)} stale-slot pruning calls, with no intercepted callees')
