"""Compare grounded facing and the complete slope-velocity helper.
Usage: python scripts/check-native-person-motion.py /path/to/d3dpoptb.exe
Facing stops at 0x44e940, before terrain/physics work in 0x4e6d00. Ground
velocity executes full 0x4e93f0 with two supplied height queries. Also checks
full 0x4e9720 obstacle probes, 0x4e9950 recovery and 0x4e7a10 proximity.
"""
import json,random,struct,subprocess,sys
from pathlib import Path
from unicorn import UC_HOOK_CODE
from unicorn.x86_const import UC_X86_REG_ESP,UC_X86_REG_EIP,UC_X86_REG_EAX
from decomp import native_cpu,configure_native_constants
root=Path(__file__).resolve().parents[1];cpu,_=native_cpu(Path(sys.argv[1]));configure_native_constants(cpu,Path(sys.argv[1]))
cpu.mem_map(0x2000000,0x10000);p,stack,stop=0x2000000,0x200e000,0x200f000;rng=random.Random(0x4e93f0)
def write(a,f,*v):cpu.mem_write(a,struct.pack('<'+f,*v))
def read(a,f):return struct.unpack('<'+f,cpu.mem_read(a,struct.calcsize('<'+f)))[0]
def call(a,*args):
 write(stack,'I'*(len(args)+1),stop,*[v&0xffffffff for v in args]);cpu.reg_write(UC_X86_REG_ESP,stack)
 cpu.emu_start(a,stop,timeout=1000000,count=100000)
 assert cpu.reg_read(UC_X86_REG_EIP) in [stop,0x44e940]
fields={'x':(0x3d,'H'),'y':(0x3f,'H'),'physics':(0x30,'B'),'counter':(0x2e,'B'),
 'flags2':(0xc,'I'),'turnAngle':(0x57,'H'),'turnY':(0x59,'H'),'heading':(0x5d,'H'),'angle':(0x26,'H'),'slowTurn':(0x7e,'B')}
def leaf(cpu,a,s,u):
 if mode=='turn':cpu.emu_stop();return
 sp=cpu.reg_read(UC_X86_REG_ESP);queries.append([read(sp+4,'H'),read(sp+8,'H')])
 cpu.reg_write(UC_X86_REG_EAX,(terrain(*queries[-1]) if mode=='obstacle' else heights[len(queries)-1])&65535)
 cpu.reg_write(UC_X86_REG_EIP,read(sp,'I'));cpu.reg_write(UC_X86_REG_ESP,sp+4)
cpu.hook_add(UC_HOOK_CODE,leaf,begin=0x44e940,end=0x44e940)
def compare(mode,cases,expected):
 js="""import {turnPerson,groundVelocity,positionsOverlap,stepMotionRecovery,recoverGroundObstacle} from './app/person-motion.ts';let s='';for await(const c of process.stdin)s+=c;
 const {mode,cases}=JSON.parse(s);console.log(JSON.stringify(cases.map(c=>{
 if(mode==='turn'){const turning=turnPerson(c);return {p:c,turning};}
 if(mode==='overlap')return positionsOverlap(c.a,c.ar,c.b,c.br);
 if(mode==='recovery'){
 const events=[];stepMotionRecovery(c.p,c.onBuilding,()=>{events.push(['access']);return c.blocks;},outside=>{events.push([outside?'outside':'approach']);return outside?c.outside:c.approach;});return {p:c.p,events};}
 if(mode==='obstacle'){
 const queries=[],probes=[],height=(x,y)=>{x&=65535;y&=65535;queries.push([x,y]);return ((x>>5)-(y>>6)+c.bias)%257;};
 const ok=recoverGroundObstacle(c.p,c.to,c.onBuilding,height,q=>{probes.push({...q});return probes.length-1===c.open?0:1;});return {p:c.p,to:c.to,ok,queries,probes};}

 const queries=[];groundVelocity(c.v,c.p,c.speed,c.angle,(x,y)=>{queries.push([x&65535,y&65535]);return c.heights[queries.length-1];});return {v:c.v,queries};})));"""
 r=subprocess.run(['node','--input-type=module','-e',js],input=json.dumps(dict(mode=mode,cases=cases)),capture_output=True,text=True,cwd=root)
 assert r.returncode==0,r.stderr;actual=json.loads(r.stdout);assert len(actual)==len(expected)
 for i,(a,b) in enumerate(zip(expected,actual)):assert a==b,(mode,i,cases[i],a,b)
 print(f'PASS: {len(cases):,} native {mode} comparisons',flush=True)
mode='turn';cases=[];expected=[]
for i in range(4096):
 c=dict(x=rng.randrange(65536),y=rng.randrange(65536),physics=i%20,counter=i%256,
  flags2=rng.choice([0,0x1000,0x1080,0x2080,0x200200,0x200280,0x4000,0x1800])&~0x2000,
  turnAngle=rng.randrange(2048),turnY=rng.randrange(65536),heading=rng.randrange(2048),angle=rng.randrange(65536),slowTurn=rng.choice([0,0,1,2,3,255]))
 c['flags2']|=rng.choice([0,32,0x8000,0x8020])
 if i%9==0:c['turnAngle']=c['x'];c['turnY']=c['y'];c['flags2']&=~128
 cpu.mem_write(p,bytes(256))
 for k,(off,f) in fields.items():write(p+off,f,c[k])
 call(0x4e6d00,p);cases.append(c);expected.append(dict(p={k:read(p+off,f) for k,(off,f) in fields.items()},turning=bool(read(stack-12,'B'))))
compare(mode,cases,expected)
mode='velocity';cases=[];expected=[]
for i in range(4096):
 heights=[rng.randrange(-32768,32768),rng.randrange(-32768,32768)]
 if i%2==0:heights[1]=max(-32768,min(32767,heights[0]+rng.randrange(-20,21)))
 c=dict(v={k:rng.randrange(-32768,32768) for k in ['x','y','z']},p=dict(x=rng.randrange(65536),y=rng.randrange(65536)),speed=rng.choice([0,1,3,20,80,32767,-1,-32768]),angle=rng.randrange(65536),heights=heights)
 write(p,'hhh',*c['v'].values());write(p+16,'HHh',c['p']['x'],c['p']['y'],0);queries=[]
 call(0x4e93f0,p,p+16,c['speed'],c['angle']);cases.append(c);expected.append(dict(v=dict(zip(['x','y','z'],struct.unpack('<hhh',cpu.mem_read(p,6)))),queries=queries))
compare(mode,cases,expected)

# Complete recovery helpers; the native height, collision, building-access and
# entrance consumers are supplied. Probe ordering and all math execute natively.
recovery_fields={**fields,'h':(0x41,'h'),'speed':(0x5f,'h'),'flags4':(0x10,'I'),
 'motionTimer':(0x61,'h'),'motionMode':(0x66,'B'),'recoveryCounter':(0x65,'B'),'supportHeight':(0x1c,'h')}
def put_person(person):
 cpu.mem_write(p,bytes(256))
 for k,(off,f) in recovery_fields.items():write(p+off,f,person[k])
def get_person():return {k:read(p+off,f) for k,(off,f) in recovery_fields.items()}
def person(i):return dict(x=rng.randrange(65536),y=rng.randrange(65536),h=rng.randrange(-200,500),speed=rng.choice([0,1,3,20,80,32767,-1,-32768]),physics=i%20,counter=i%256,
 flags2=rng.choice([0,0x800,0x880,0x20000800,0x20000880]),flags4=rng.choice([0,1,2,4,0x10000]),
 turnAngle=0,turnY=0,heading=rng.randrange(2048),angle=0,slowTurn=0,motionTimer=rng.choice([-32768,-1,0,1,2,7,32767]),motionMode=rng.choice([0,1,47,48,127,128,255]),recoveryCounter=rng.choice([0,1,64,65,99,100,127,128,255]),supportHeight=rng.randrange(-32768,32768))
def terrain(x,y):
 n=(x>>5)-(y>>6)+case['bias'];return n%257 if n>=0 else -((-n)%257)
def world_leaf(cpu,a,size,u):
 sp=cpu.reg_read(UC_X86_REG_ESP);result=0
 if a==0x5178d0:
  addr=read(sp+8,'I');x,y,h=struct.unpack('<HHh',cpu.mem_read(addr,6));probes.append(dict(x=x,y=y,h=h));result=0 if len(probes)-1==case['open'] else 1
 elif a==0x517f10:events.append(['access']);result=int(case['blocks'])
 else:
  outside=a==0x4044b0;events.append(['outside' if outside else 'approach']);point=case['outside' if outside else 'approach']
  write(read(sp+(8 if outside else 12),'I'),'HH',point['x'],point['y'])
 cpu.reg_write(UC_X86_REG_EAX,result);cpu.reg_write(UC_X86_REG_EIP,read(sp,'I'));cpu.reg_write(UC_X86_REG_ESP,sp+4)
for a in [0x5178d0,0x517f10,0x40a460,0x4044b0]:cpu.hook_add(UC_HOOK_CODE,world_leaf,begin=a,end=a)
for mode in ['obstacle','recovery']:
 cases=[];expected=[]
 for i in range(4096):
  pp=person(i)
  if mode=='recovery' and pp['flags2']&0x20000000:pp['motionTimer']=rng.choice([0,1,2,32767])
  case=dict(p=pp,onBuilding=bool(i%3==0),blocks=bool(i%2),approach=dict(x=(pp['x']+rng.choice([0,111,112,-112,500]))&65535,y=pp['y']),outside=dict(x=(pp['x']+700)&65535,y=(pp['y']-333)&65535),
   bias=rng.randrange(-500,500),open=i%24-1,to=dict(x=rng.randrange(65536),y=rng.randrange(65536),h=rng.randrange(-32768,32768)))
  put_person(pp);cell=0x8a03e4+(((pp['y']>>9)*128)+(pp['x']>>9))*16
  write(cell,'I',0x200 if case['onBuilding'] else 0);write(cell+8,'H',1);write(0x890394,'I',p+512)
  queries=[];probes=[];events=[]
  if mode=='obstacle':
   write(p+256,'HHh',case['to']['x'],case['to']['y'],case['to']['h']);call(0x4e9720,p,p+256)
   x,y,h=struct.unpack('<HHh',cpu.mem_read(p+256,6));expected.append(dict(p=get_person(),to=dict(x=x,y=y,h=h),ok=bool(cpu.reg_read(UC_X86_REG_EAX)&255),queries=queries,probes=probes))
  else:
   call(0x4e9950,p);expected.append(dict(p=get_person(),events=events))
  cases.append(case)
 compare(mode,cases,expected)
mode='overlap';cases=[];expected=[]
for i in range(4096):
 case=dict(a=dict(x=rng.randrange(65536),y=rng.randrange(65536)),b=dict(x=rng.randrange(65536),y=rng.randrange(65536)),ar=rng.choice([0,56,256,32767]),br=rng.choice([0,1,1024,32767]))
 if i%2==0:case['b']={k:(v+rng.choice([0,1,-1,1080,-1080,1081]))&65535 for k,v in case['a'].items()}
 write(p,'HH',*case['a'].values());write(p+16,'HH',*case['b'].values());call(0x4e7a10,p,case['ar'],p+16,case['br'])
 cases.append(case);expected.append(bool(cpu.reg_read(UC_X86_REG_EAX)&255))
compare(mode,cases,expected)
