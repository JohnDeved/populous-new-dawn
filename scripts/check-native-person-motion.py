"""Compare grounded facing and the complete slope-velocity helper.
Usage: python scripts/check-native-person-motion.py /path/to/d3dpoptb.exe
Facing stops at 0x44e940, before terrain/physics work in 0x4e6d00. Ground
velocity executes full 0x4e93f0 with two supplied height queries.
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
 cpu.reg_write(UC_X86_REG_EAX,heights[len(queries)-1]&65535)
 cpu.reg_write(UC_X86_REG_EIP,read(sp,'I'));cpu.reg_write(UC_X86_REG_ESP,sp+4)
cpu.hook_add(UC_HOOK_CODE,leaf,begin=0x44e940,end=0x44e940)
def compare(mode,cases,expected):
 js="""import {turnPerson,groundVelocity} from './app/person-motion.ts';let s='';for await(const c of process.stdin)s+=c;
 const {mode,cases}=JSON.parse(s);console.log(JSON.stringify(cases.map(c=>{
 if(mode==='turn'){turnPerson(c);return c;}
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
 call(0x4e6d00,p);cases.append(c);expected.append({k:read(p+off,f) for k,(off,f) in fields.items()})
compare(mode,cases,expected)
mode='velocity';cases=[];expected=[]
for i in range(4096):
 heights=[rng.randrange(-32768,32768),rng.randrange(-32768,32768)]
 if i%2==0:heights[1]=max(-32768,min(32767,heights[0]+rng.randrange(-20,21)))
 c=dict(v={k:rng.randrange(-32768,32768) for k in ['x','y','z']},p=dict(x=rng.randrange(65536),y=rng.randrange(65536)),speed=rng.choice([0,1,3,20,80,32767,-1,-32768]),angle=rng.randrange(65536),heights=heights)
 write(p,'hhh',*c['v'].values());write(p+16,'HHh',c['p']['x'],c['p']['y'],0);queries=[]
 call(0x4e93f0,p,p+16,c['speed'],c['angle']);cases.append(c);expected.append(dict(v=dict(zip(['x','y','z'],struct.unpack('<hhh',cpu.mem_read(p,6)))),queries=queries))
compare(mode,cases,expected)
