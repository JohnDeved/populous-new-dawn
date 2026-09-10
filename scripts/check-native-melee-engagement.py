"""Compare original engagement eligibility/range and whole-cell area bounds.
Usage: python scripts/check-native-melee-engagement.py /path/to/d3dpoptb.exe
Ritual availability and tower lookup are supplied consumers. Area cases execute
the complete 0051eab0 with one eligible enemy, no buildings or fight objects;
this does not establish automatic area-order allocation or target priority.
"""
import json, random, struct, subprocess, sys
from pathlib import Path
from unicorn import UC_HOOK_CODE
from unicorn.x86_const import UC_X86_REG_ESP, UC_X86_REG_EIP, UC_X86_REG_EAX
from decomp import native_cpu, configure_native_constants, ROOT

exe=Path(sys.argv[1]);cpu,_=native_cpu(exe);configure_native_constants(cpu,exe)
cpu.mem_map(0x2000000,0x10000)
p,target,stack,stop=0x2000000,0x2000100,0x200e000,0x200f000
rng=random.Random(0x51ff60)
def write(a,f,*v):cpu.mem_write(a,struct.pack('<'+f,*v))
def read(a,f):return struct.unpack('<'+f,cpu.mem_read(a,struct.calcsize('<'+f)))[0]
def call(a,*args):
 write(stack,'I'*(len(args)+1),stop,*args);cpu.reg_write(UC_X86_REG_ESP,stack);cpu.emu_start(a,stop,count=100000)
 assert cpu.reg_read(UC_X86_REG_EIP)==stop
 return cpu.reg_read(UC_X86_REG_EAX)
case={};ritual_calls=0
def consumer(c,a,size,u):
 global ritual_calls
 if a==0x508f70:ritual_calls+=1
 value=case['ritual'] if a==0x508f70 else case['tower']
 sp=c.reg_read(UC_X86_REG_ESP);c.reg_write(UC_X86_REG_EAX,int(value));c.reg_write(UC_X86_REG_EIP,read(sp,'I'));c.reg_write(UC_X86_REG_ESP,sp+4)
for a in [0x508f70,0x40a3f0]:cpu.hook_add(UC_HOOK_CODE,consumer,begin=a,end=a)
fields={'model':(0x2b,'B'),'state':(0x2c,'B'),'substate':(0x2d,'B'),'flags2':(0xc,'I'),'flags4':(0x10,'I'),'assignment':(0x76,'H'),'vehicle':(0x9f,'H'),'life':(0x6e,'h'),'commandPhase':(0xa8,'B'),'commandStatus':(0xa7,'B'),'h':(0x41,'h')}
cases=[];expected=[]
for n in range(8192):
 pp=dict(model=n%8+1,state=rng.choice([10,10,10,33,14,25,rng.randrange(46)]),substate=rng.randrange(5),flags2=rng.choice([0,0,0,0x80000]),flags4=rng.choice([0,0,0,0x1000,0x400]),assignment=rng.choice([0,0,4]),vehicle=1 if n%11==0 else 0,life=rng.choice([-1,0,1,255,256,511,512,32767]),commandPhase=rng.choice([0,46,53]),commandStatus=rng.randrange(35),h=rng.choice([-32768,-129,-128,-1,0,127,128,895,896,1024,32767]))
 order=None if n%7==0 else dict(model=n%35,flags=rng.choice([0,1,32,64,65,96]))
 case=dict(p=pp,order=order,ritual=bool(n&1),tower=bool(n&2));cases.append(case)
 cpu.mem_write(p,bytes(256));cpu.mem_write(0x938830,bytes(30));write(0x890390,'3I',0,p,target)
 for name,(off,f) in fields.items():write(p+off,f,pp[name])
 if order:
  write(0x93883a,'BBHHHH',order['model'],order['flags'],1,0,2,0)
  write(p+(0x9b if n&1 else 0x8b),'H',1)
 ritual_calls=0
 eligible=bool(call(0x4d44e0,p)&255)
 expected.append(dict(eligible=eligible,ritualCalls=ritual_calls,range=call(0x51ff60,p)))

# Whole original scanner, isolating its area traversal with one eligible enemy.
rules=json.loads((ROOT/'app/original-rules.json').read_text())
category=next(i for i,f in enumerate(rules['terrainCategoryFlags']) if not f&2)
land=b''.join(struct.pack('<IhHHBBBBBB',0,100,0,0,0,0,category,0,0,0) for _ in range(16384))
cpu.mem_write(0x8a03e4,land);cpu.mem_write(0x9608b6,bytes(4));write(0x89d17c,'I',0)
cpu.mem_write(p,bytes(256));cpu.mem_write(target,bytes(256))
write(p+0x2a,'6B',1,3,10,0,0,0);write(target+0x2a,'6B',1,2,10,0,0,1);write(target+0x6e,'h',1000)
areas=[];found=[];previous=None
for n in range(4096):
 source=dict(x=rng.choice([0,511,512,65535,rng.randrange(65536)]),y=rng.choice([0,511,512,65535,rng.randrange(65536)]))
 range_=[1,3,5,7,11][n%5];radius=range_//2*2
 dest=dict(x=(source['x']+rng.randrange(-3500,3501))&65535,y=(source['y']+rng.randrange(-3500,3501))&65535)
 cell=(dest['y']>>9)*128+(dest['x']>>9)
 if previous is not None:write(0x8a03e4+previous*16+6,'H',0)
 write(0x8a03e4+cell*16+6,'H',2);previous=cell
 write(p+0x3d,'HH',source['x'],source['y']);write(target+0x3d,'HH',dest['x'],dest['y'])
 result=call(0x51eab0,p,((source['x']>>8)&254)|(source['y']&0xfe00),radius,radius,0,0)&255
 assert result in [0,2],result
 areas.append(dict(source=source,target=dest,range=range_));found.append(result==2)
js="""
import {canAutoEngage,engagementRange,inEngagementArea} from './app/melee-engagement.ts';
let s='';for await(const c of process.stdin)s+=c;const input=JSON.parse(s);
console.log(JSON.stringify({cases:input.cases.map(c=>{let ritualCalls=0;return {eligible:canAutoEngage(c.p,c.order,()=>{ritualCalls++;return c.ritual}),ritualCalls,range:engagementRange(c.p,c.order,c.tower)}}),areas:input.areas.map(c=>inEngagementArea(c.source,c.target,c.range))}));
"""
r=subprocess.run(['node','--input-type=module','-e',js],input=json.dumps(dict(cases=cases,areas=areas)),capture_output=True,text=True,cwd=ROOT);assert r.returncode==0,r.stderr
actual=json.loads(r.stdout)
for kind,inputs,wanted in [('cases',cases,expected),('areas',areas,found)]:
 assert len(actual[kind])==len(wanted)
 for i,(a,e) in enumerate(zip(actual[kind],wanted)):
  assert a==e,(kind,i,inputs[i],a,e)
assert any(found) and not all(found)
print('PASS: 8,192 original eligibility/range cases and 4,096 complete person-only area scans, including wrapped cell edges. Ritual/tower consumers supplied; area orders, mixed objects and target priority not covered.')
