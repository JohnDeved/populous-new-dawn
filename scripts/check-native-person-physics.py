"""Compare terrain drift, velocity caps, airborne eligibility and landing state.
Usage: python scripts/check-native-person-physics.py /path/to/d3dpoptb.exe
Native terrain/math callees execute. Landing animation, state release/init,
fight checks and the class-3 consumer are supplied and compared in order.
"""
import json,random,struct,subprocess,sys
from pathlib import Path
from unicorn import UC_HOOK_CODE
from unicorn.x86_const import UC_X86_REG_ESP,UC_X86_REG_EIP,UC_X86_REG_EAX
from decomp import native_cpu,configure_native_constants
root=Path(__file__).resolve().parents[1];cpu,_=native_cpu(Path(sys.argv[1]));configure_native_constants(cpu,Path(sys.argv[1]))
cpu.mem_map(0x2000000,0x20000);p,to,out,stack,stop=0x2000000,0x2001000,0x2001100,0x201e000,0x201f000;rng=random.Random(0x4e9160)
def write(a,f,*v):cpu.mem_write(a,struct.pack('<'+f,*v))
def read(a,f):return struct.unpack('<'+f,cpu.mem_read(a,struct.calcsize('<'+f)))[0]
def call(a,*args):
 write(stack,'I'*(len(args)+1),stop,*[v&0xffffffff for v in args]);cpu.reg_write(UC_X86_REG_ESP,stack)
 cpu.emu_start(a,stop,timeout=1000000,count=1000000);assert cpu.reg_read(UC_X86_REG_EIP)==stop,hex(cpu.reg_read(UC_X86_REG_EIP))
 return cpu.reg_read(UC_X86_REG_EAX)
def compare(js,data,expected,label):
 r=subprocess.run(['node','--input-type=module','-e',"let s='';for await(const c of process.stdin)s+=c;const input=JSON.parse(s);"+js],input=json.dumps(data),capture_output=True,text=True,cwd=root)
 assert r.returncode==0,r.stderr;actual=json.loads(r.stdout);assert len(actual)==len(expected)
 for i,(a,b) in enumerate(zip(expected,actual)):assert a==b,(label,i,a,b,data['cases'][i])
 print(f'PASS: {len(expected):,} native {label} comparisons',flush=True)
land=dict(heights=[rng.choice([rng.randrange(1025),-32768,32767]) if i%4==0 else rng.randrange(1025) for i in range(16384)],flags=[rng.randrange(2) for _ in range(16384)],categories=[0 if i<8192 else rng.randrange(16) for i in range(16384)])
for i in range(16384):write(0x8a03e4+i*16,'Ih',land['flags'][i],land['heights'][i]);write(0x8a03e4+i*16+12,'B',land['categories'][i])
def position():return dict(x=rng.choice([rng.randrange(65536),0,511,32767,65535]),y=rng.choice([rng.randrange(65536),0,511,32768,65535]))
for mode,address in [('height',0x44e940),('range',0x44f750),('slope',0x4ebd10),('drift',0x4ebc20)]:
 cases=[];expected=[]
 for i in range(4096):
  q=position();write(to,'HHh',q['x'],q['y'],rng.randrange(-32768,32768));cpu.mem_write(out,bytes([0x5a])*6)
  value=call(address,q['x'],q['y']) if mode=='height' else call(address,to) if mode=='range' else call(address,to,out)
  expected.append(((value+32768)&65535)-32768 if mode=='height' else (value if value<0x80000000 else value-0x100000000) if mode=='range' else dict(zip(['x','y','z'],struct.unpack('<hhh',cpu.mem_read(out,6)))));cases.append(q)
 compare("import {terrainPointHeight,terrainSlopeRange,terrainSlopeVelocity,terrainDrift} from './app/native-terrain.ts';const f={height:terrainPointHeight,range:terrainSlopeRange,slope:terrainSlopeVelocity,drift:terrainDrift}[input.mode];console.log(JSON.stringify(input.cases.map(p=>f(input.land,p))));",dict(mode=mode,land=land,cases=cases),expected,mode)
for mode,address in [('ordinary',0x4e78f0),('impulse',0x4e7980)]:
 cases=[];expected=[]
 for i in range(4096):
  v={k:rng.randrange(-32768,32768) for k in ['x','y','z']};physics=i%20;write(p+0x30,'B',physics);write(out,'hhh',*v.values());call(address,p,out)
  cases.append(dict(v=v,physics=physics));expected.append(dict(zip(['x','y','z'],struct.unpack('<hhh',cpu.mem_read(out,6)))))
 compare("import {limitPersonVelocity} from './app/person-physics.ts';console.log(JSON.stringify(input.cases.map(c=>{limitPersonVelocity(c.physics,c.v,input.mode==='impulse');return c.v;})));",dict(mode=mode,cases=cases),expected,mode+' velocity caps')
fields={'x':(0x3d,'H'),'y':(0x3f,'H'),'class':(0x2a,'B'),'model':(0x2b,'B'),'physics':(0x30,'B'),'state':(0x2c,'B'),'previousState':(0x7d,'B'),'flags2':(0xc,'I'),'flags3':(0x14,'I'),'flags4':(0x10,'I'),'motionTimer':(0x61,'h'),'motionMode':(0x66,'B'),'target':(0x72,'H')}
write(0x96aa74,'I',0x96aaba);cpu.mem_write(0x96aaba,bytes(8192));write(0x890394,'I',p+512)
def put(person):
 cpu.mem_write(p,bytes(256))
 for k,(offset,f) in fields.items():write(p+offset,f,person[k])
 write(p+0x49,'hhh',*person['velocity'].values())
def get():return {**{k:read(p+offset,f) for k,(offset,f) in fields.items()},'velocity':dict(zip(['x','y','z'],struct.unpack('<hhh',cpu.mem_read(p+0x49,6))))}
def snapshot(name):return [name,read(p+0x2c,'B'),read(p+0xc,'I'),read(p+0x14,'I'),read(p+0x10,'I')]
consumers={0x4ed6f0:'release',0x4ed640:'initialize',0x4d3ea0:'animation',0x4465a0:'class3',0x51f990:'fight',0x51fcd0:'ready'}
def leaf(cpu,a,size,u):
 name=consumers[a];events.append(snapshot(name));sp=cpu.reg_read(UC_X86_REG_ESP)
 if name=='fight':assert read(sp+12,'I')==1 and read(sp+8,'I')==p+512
 result=case['fight'] if name=='fight' else case['ready'] if name=='ready' else 0
 cpu.reg_write(UC_X86_REG_EAX,int(result));cpu.reg_write(UC_X86_REG_EIP,read(sp,'I'));cpu.reg_write(UC_X86_REG_ESP,sp+4)
for a in consumers:cpu.hook_add(UC_HOOK_CODE,leaf,begin=a,end=a)
for mode,address in [('eligibility',0x4e7880),('mark',0x4e9050),('settle',0x4e9160)]:
 cases=[];expected=[]
 for i in range(8192):
  person=dict(**position(),**{'class':rng.choice([1,1,2,3])},model=rng.randrange(1,9),physics=i%20,state=rng.randrange(49),previousState=rng.randrange(49),flags2=rng.choice([0,0x80000])|rng.choice([0,4,0x2000,0x2004,0x100000,0x20000800]),flags3=rng.choice([0,0x10000,0x8000000,0x8010000]),flags4=rng.choice([0,0x400,0x2000,0x2400]),motionTimer=rng.randrange(-32768,32768),motionMode=rng.randrange(256),target=rng.choice([0,1]),velocity={k:rng.choice([0,1,-1,20,80,200,-32768,32767]) for k in ['x','y','z']})
  case=dict(p=person,to=position(),passable=bool((i//20)%2),gameFlags=rng.choice([0,2]),target={'class':rng.choice([0,1]),'flags2':rng.choice([0,1])},fight=bool(i%3),ready=bool(i%4));cases.append(case);put(person)
  q=person if mode=='mark' else case['to'];bit=(q['y']>>8)*256+(q['x']>>8);write(0x96aaba+(bit>>3),'B',255 if case['passable'] else 0)
  write(to,'HHh',case['to']['x'],case['to']['y'],0);write(0x89d17c,'I',case['gameFlags']);write(p+512+0x2a,'B',case['target']['class']);write(p+512+0xc,'I',case['target']['flags2']);events=[]
  value=call(address,to,p) if mode=='eligibility' else call(address,p) if mode=='mark' else call(address,p,to)
  expected.append(dict(p=get(),events=events,**({'result':bool(value&255)} if mode!='settle' else {})))
 compare("""import {unsupportedGround,markPersonAirborne,settlePerson} from './app/person-physics.ts';
 console.log(JSON.stringify(input.cases.map(c=>{const l={...input.land,walkMasks:[new Uint8Array(8192).fill(c.passable?255:0)]},p=c.p,events=[],log=n=>events.push([n,p.state,p.flags2,p.flags3,p.flags4]);
 if(input.mode==='eligibility')return {p,events,result:unsupportedGround(l,c.to,p.physics)};
 if(input.mode==='mark')return {p,events,result:markPersonAirborne(l,p)};
 settlePerson(l,p,c.to,c.gameFlags,new Map([[1,c.target]]),{animation:()=>log('animation'),release:()=>log('release'),initialize:()=>log('initialize'),class3:()=>log('class3'),canFight:()=>{log('fight');return c.fight;},readyToFight:()=>{log('ready');return c.ready;}});return {p,events};})));""",dict(mode=mode,land=land,cases=cases),expected,mode)
