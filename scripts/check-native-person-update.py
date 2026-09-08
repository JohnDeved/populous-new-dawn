"""Compare complete person preparation, reactions, drowning and health checks.
Usage: python scripts/check-native-person-update.py /path/to/d3dpoptb.exe
Terrain, animation selection and motion reset execute natively. Only state
initialization, the person animation setter and destination planner are supplied.
"""
import copy,json,random,struct,subprocess,sys
from pathlib import Path
from unicorn import UC_HOOK_CODE
from unicorn.x86_const import UC_X86_REG_ESP,UC_X86_REG_EIP,UC_X86_REG_EAX
from decomp import native_cpu,configure_native_constants
root=Path(__file__).resolve().parents[1];cpu,_=native_cpu(Path(sys.argv[1]));configure_native_constants(cpu,Path(sys.argv[1]));rng=random.Random(0x4d42a0)
cpu.mem_map(0x2000000,0x10000);p,stack,stop=0x2000000,0x200e000,0x200f000
fields={'class':(0x2a,'B'),'model':(0x2b,'B'),'state':(0x2c,'B'),'previousState':(0x7d,'B'),'physics':(0x30,'B'),'x':(0x3d,'H'),'y':(0x3f,'H'),'h':(0x41,'h'),'flags2':(0xc,'I'),'flags3':(0x14,'I'),'flags4':(0x10,'I'),'counter':(0x2e,'B'),'statusFlags':(0xb2,'B'),'slowTurn':(0x7e,'B'),'goalX':(0x4f,'H'),'goalY':(0x51,'H'),'motionTimer':(0x61,'h'),'motionMode':(0x66,'B'),'reactionTimer':(0x31,'B'),'reactionDuration':(0x32,'B'),'life':(0x6e,'h'),'maxLife':(0x6c,'h'),'healthMarker':(0xb0,'B'),'speed':(0x5f,'h'),'cargo':(0x78,'h'),'vehicle':(0x9f,'H')}
def write(a,f,*v):cpu.mem_write(a,struct.pack('<'+f,*v))
def read(a,f):return struct.unpack('<'+f,cpu.mem_read(a,struct.calcsize('<'+f)))[0]
def call(a,*args):
 write(stack,'I'*(len(args)+1),stop,*args);cpu.reg_write(UC_X86_REG_ESP,stack);cpu.emu_start(a,stop,count=1000000)
 assert cpu.reg_read(UC_X86_REG_EIP)==stop;return cpu.reg_read(UC_X86_REG_EAX)
def get():return {k:read(p+off,f) for k,(off,f) in fields.items()}
def leaf(cpu,a,size,u):
 sp=cpu.reg_read(UC_X86_REG_ESP)
 if a==0x4ed640:
  events.append(['initialize',[],get()])
  for k,v in case['initialize'].items():off,f=fields[k];write(p+off,f,v)
 elif a==0x4d4040:events.append(['animation',[read(sp+8,'H')],get()])
 elif a==0x4e9d80:
  to=read(sp+8,'I');events.append(['destination',[dict(x=read(to,'H'),y=read(to+2,'H'))],get()])
 cpu.reg_write(UC_X86_REG_EAX,0);cpu.reg_write(UC_X86_REG_EIP,read(sp,'I'));cpu.reg_write(UC_X86_REG_ESP,sp+4)
for a in [0x4ed640,0x4d4040,0x4e9d80]:cpu.hook_add(UC_HOOK_CODE,leaf,begin=a,end=a)
land=dict(heights=[rng.randrange(-500,1000) for _ in range(16384)],flags=[rng.randrange(2) for _ in range(16384)],categories=[rng.randrange(16) for _ in range(16384)])
for i in range(16384):write(0x8a03e4+i*16,'Ih',land['flags'][i],land['heights'][i]);write(0x8a03e4+i*16+12,'B',land['categories'][i])
js="""import {resetInterruptedPersonMotion,preparePersonTurn,stepPersonReaction,personIsDrowning,updatePersonHealth} from './app/person-update.ts';import {personAnimationObject} from './app/person-state.ts';let s='';for await(const c of process.stdin)s+=c;const input=JSON.parse(s);
console.log(JSON.stringify(input.cases.map(c=>{const p=c.p,events=[],log=(name,...args)=>events.push([name,args,structuredClone(p)]),initialize=()=>{log('initialize');Object.assign(p,c.initialize);};
let result;if(input.mode==='reset')resetInterruptedPersonMotion(p);else if(input.mode==='prepare')preparePersonTurn(p,c.gameFlags,{initialize,animation:()=>{const obj=personAnimationObject(p);if(obj!==-1)log('animation',obj&65535);},destination:q=>log('destination',q)});else if(input.mode==='reaction')stepPersonReaction(p);else if(input.mode==='drown')result=personIsDrowning(input.land,p);else updatePersonHealth(input.land,p,c.gameFlags,c.turn,initialize);
return {p,events,...(input.mode==='drown'?{result}:{})};})));"""
for mode,address in [('reset',0x4eefd0),('prepare',0x4d42a0),('reaction',0x51fed0),('drown',0x4eeff0),('health',0x4d43a0)]:
 cases=[];expected=[]
 for i in range(4096):
  pp={k:rng.randrange(-32768,32768) if f=='h' else rng.randrange(65536) if f=='H' else rng.randrange(256) if f=='B' else rng.getrandbits(32) for k,(_,f) in fields.items()}
  pp.update(**{'class':rng.choice([1,3,10])},model=i%9,physics=i%20,state=rng.randrange(46),previousState=rng.randrange(46),life=rng.choice([-32768,-1,0,1,100,32767]),maxLife=rng.choice([-32768,-1,0,1,100,32767]),slowTurn=rng.choice([0,1,2,128,255]),statusFlags=rng.choice([0,1,2,128,255]),reactionTimer=rng.choice([0,1,2,128,255]),reactionDuration=rng.choice([0,1,2,128,255]),vehicle=rng.choice([0,1]))
  # Dedicated bit patterns ensure each native guard and transition is exercised.
  if i%2==0:pp['flags2']=rng.choice([0,2,4,8,16,0x2000,0x80000,0x100000,0x100018,0x80000000,0x80000080]);pp['flags4']=rng.choice([0,0x100000,0x300000,0x800000,0x1000000,0x1800000])
  case=dict(p=pp,gameFlags=rng.choice([0,2,128,130]),turn=i%256,initialize=dict(flags2=rng.choice([0,8,16,0x80000,0x100000,0x80000000]),life=rng.choice([0,1,80]),state=rng.choice([2,3,10,31,36,39]),slowTurn=rng.choice([0,1,2])))
  cpu.mem_write(p,bytes(256))
  for k,(off,f) in fields.items():write(p+off,f,pp[k])
  write(0x89d17c,'I',case['gameFlags']);write(0x89d188,'I',case['turn']);events=[];result=call(address,p)
  # 0x4eeff0 returns a byte in AL; the upper EAX bits are caller scratch.
  expected.append(dict(p=get(),events=copy.deepcopy(events),**({'result':bool(result&255)} if mode=='drown' else {})));cases.append(case)
 r=subprocess.run(['node','--input-type=module','-e',js],input=json.dumps(dict(mode=mode,land=land,cases=cases)),capture_output=True,text=True,cwd=root);assert r.returncode==0,r.stderr;actual=json.loads(r.stdout);assert len(actual)==len(expected)
 for i,(a,b) in enumerate(zip(expected,actual)):
  if a!=b:
   path=Path('/private/tmp/populous-person-update-failure.json');path.write_text(json.dumps(dict(mode=mode,index=i,case=cases[i],native=a,browser=b),indent=2));raise AssertionError((mode,i,str(path)))
 print(f'PASS: 4,096 native {mode} comparisons',flush=True)
