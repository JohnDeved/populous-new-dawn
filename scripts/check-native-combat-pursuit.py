"""Compare complete 00439850, 00520300 and 00438af0 against the supplied EXE.
Real recovery/stop animation selection, RNG and facing execute. Destination,
vehicle/ranged consumers and area-range lookup are supplied and observed.
Usage: python scripts/check-native-combat-pursuit.py EXE [--record]
"""
import copy,json,random,struct,subprocess,sys
from pathlib import Path
from unicorn import UC_HOOK_CODE
from unicorn.x86_const import UC_X86_REG_ESP,UC_X86_REG_EIP,UC_X86_REG_EAX
from capstone import Cs,CS_ARCH_X86,CS_MODE_32
from decomp import native_cpu,configure_native_constants,ROOT
cpu,identity=native_cpu(Path(sys.argv[1]));configure_native_constants(cpu,Path(sys.argv[1]))
cpu.mem_map(0x2000000,0x10000)
p,target,order,stack,stop=0x2000000,0x2001000,0x2002000,0x200e000,0x200f000
rng=random.Random(0x439850)
rules=json.loads((ROOT/'app/original-rules.json').read_text())
fields={'model':(0x2b,'B'),'x':(0x3d,'H'),'y':(0x3f,'H'),'flags2':(0xc,'I'),'flags3':(0x14,'I'),
 'flags4':(0x10,'I'),'assignment':(0x76,'H'),'physics':(0x30,'B'),'cargo':(0x78,'H'),
 'speed':(0x5f,'h'),'timer':(0x70,'h'),'target':(0x72,'h'),'goalX':(0x4f,'H'),'goalY':(0x51,'H'),
 'heading':(0x5d,'H'),'angle':(0x26,'H'),'turnAngle':(0x57,'H'),'vehicle':(0x9f,'H')}
def write(a,f,*v):cpu.mem_write(a,struct.pack('<'+f,*v))
def read(a,f):return struct.unpack('<'+f,cpu.mem_read(a,struct.calcsize('<'+f)))[0]
def point(a):return dict(x=read(a,'H'),y=read(a+2,'H'))
def person():return {k:read(p+o,f) for k,(o,f) in fields.items()}
def log(name,*args):events.append([name,*args,person(),read(0x89d178,'I')])
# Resolve the ranged circle-length helper from the actual native call site.
calls=[int(i.op_str,16) for i in Cs(CS_ARCH_X86,CS_MODE_32).disasm(bytes(cpu.mem_read(0x438af0,0x160)),0x438af0) if i.mnemonic=='call']
range_address=next(a for a in calls if a not in [0x465650,0x51ff60])
def consumer(c,address,size,user):
 sp=c.reg_read(UC_X86_REG_ESP);a,b,d=struct.unpack('<III',c.mem_read(sp+4,12));result=0
 if address==0x4d4040:log('animation',(b+32768)%65536-32768)
 elif address==0x4e9d80:
  to=point(b);log('destination',to);write(p+0x4f,'HH',to['x'],to['y'])
 elif address==0x51f990:log('canFire');result=int(case['canFire'])
 elif address==0x4389c0:
  log('commandPosition');write(b,'HH',case['point']['x'],case['point']['y'])
 elif address==0x435550:log('vehicleDestination',point(b),d)
 elif address==0x465650:log('vehicleReady');result=int(case['vehicleReady'])
 elif address in [0x51ff60,range_address]:log('range');result=case['range']
 else:raise AssertionError(hex(address))
 c.reg_write(UC_X86_REG_EAX,result);c.reg_write(UC_X86_REG_EIP,read(sp,'I'));c.reg_write(UC_X86_REG_ESP,sp+4)
for a in [0x4d4040,0x4e9d80,0x51f990,0x4389c0,0x435550,0x465650,0x51ff60,range_address]:
 cpu.hook_add(UC_HOOK_CODE,consumer,begin=a,end=a)
fixtures=[]
for mode,address in [('step',0x439850),('begin',0x520300),('area',0x438af0)]:
 cases=[];expected=[]
 for n in range(4096):
  model=n%9
  pp={k:rng.randrange(256) if f=='B' else rng.randrange(65536) if f=='H' else rng.randrange(-32768,32768) if f=='h' else rng.getrandbits(32) for k,(_,f) in fields.items()}
  pp.update(model=model,physics=rules['personModels'][model]['physics'],cargo=rng.choice([0,100]),
   assignment=rng.choice([0,8,16,24,65535]),flags2=rng.choice([0,128,0x8000,0x80000,0x80080,0xffffffff]),
   flags3=rng.choice([0,0x80000]),flags4=rng.choice([0,0x400,0x80000,0x2000000,0x10000000,0xffffffff]),
   timer=rng.choice([-32768,-1,0,1,2,64,32767]),target=2,vehicle=rng.choice([0,2]))
  radius=rng.choice([0,56,224,511,-1])
  to=dict(**{'class':rng.choice([0,1,10])},flags2=rng.choice([0,1,16]),vehicle=rng.choice([0,2]),x=rng.randrange(65536),y=rng.randrange(65536))
  pp['x']=rng.choice([0,32767,32768,65535,rng.randrange(65536)]);pp['y']=rng.randrange(65536)
  delta=rng.choice([0,55,56,167,168,279,280,567,568,32768,-1])
  if n%3:to.update(x=(pp['x']+delta)&65535,y=(pp['y']+(1 if n&1 else 0))&65535)
  if n%2:pp.update(goalX=to['x'],goalY=to['y'])
  elif n%3:pp.update(goalX=pp['x'],goalY=pp['y'])
  absent=n%17==0 and not(pp['assignment']&16) and mode!='begin'
  if absent:pp['target']=0
  oo=dict(model=rng.choice([19,21,28]),flags=rng.choice([0,4,32,255]),references=1,object=0,a=rng.randrange(65536),b=rng.choice([0,1,256,257,0x606,0xff01,65535]))
  case=dict(p=pp,target=None if absent else to,order=oo,randomState=rng.getrandbits(32),radius=radius,
   canFire=bool(n&1),vehicleReady=bool(n&2),range=rng.choice([0,1,5,11,255]),point=dict(x=rng.randrange(65536),y=rng.randrange(65536)))
  cpu.mem_write(p,bytes(256));cpu.mem_write(target,bytes(256));write(0x890398,'I',target)
  for k,(off,f) in fields.items():write(p+off,f,pp[k])
  write(target+0x2a,'B',to['class']);write(target+0xc,'I',to['flags2']);write(target+0x9f,'H',to['vehicle']);write(target+0x3d,'HH',to['x'],to['y'])
  write(order,'BBHHHH',*oo.values());write(0x89d178,'I',case['randomState'])
  # Area object lookup uses the order payload, separate from pursuit's target field.
  if mode=='area' and not(rules['personCommands'][oo['model']]['flags']&0x800):
   oo['a']=0 if absent else 2;write(order+6,'H',oo['a'])
  args=[p,radius&0xffffffff] if mode=='step' else [p,order,2] if mode=='begin' else [p,order]
  write(stack,'I'*(len(args)+1),stop,*args);cpu.reg_write(UC_X86_REG_ESP,stack);events=[]
  cpu.emu_start(address,stop,count=100000);assert cpu.reg_read(UC_X86_REG_EIP)==stop
  cases.append(copy.deepcopy(case));expected.append(dict(p=person(),randomState=read(0x89d178,'I'),events=copy.deepcopy(events),result=cpu.reg_read(UC_X86_REG_EAX)&255))
 js="""
import {stepCombatPursuit,beginCombatPursuit,withinCombatArea} from './app/combat-pursuit.ts';
let text='';for await(const c of process.stdin)text+=c;const {mode,cases}=JSON.parse(text);
console.log(JSON.stringify(cases.map(c=>{
 const p=c.p,w={randomState:c.randomState},events=[];
 const log=(name,...args)=>events.push([name,...args,structuredClone(p),w.randomState]);
 const e={animation:(_,object)=>log('animation',object),destination:to=>{const point={x:to.x,y:to.y};log('destination',point);p.goalX=to.x;p.goalY=to.y;},
 canFire:()=>{log('canFire');return c.canFire;},commandPosition:()=>{log('commandPosition');return c.point;},
 vehicleDestination:(to,mode)=>log('vehicleDestination',to,mode),vehicleReady:()=>{log('vehicleReady');return c.vehicleReady;},range:()=>{log('range');return c.range;}};
 const result=mode==='step'?stepCombatPursuit(w,p,c.target??undefined,c.radius,e):mode==='begin'?Number(beginCombatPursuit(w,p,c.order,c.target,e)):Number(withinCombatArea(p,c.order,c.target??undefined,e));
 return {p,randomState:w.randomState,events,result};})));
"""
 r=subprocess.run(['node','--input-type=module','-e',js],input=json.dumps(dict(mode=mode,cases=cases)),capture_output=True,text=True,cwd=ROOT)
 assert r.returncode==0,r.stderr
 actual=json.loads(r.stdout);assert len(actual)==len(expected)
 for i,(a,b) in enumerate(zip(actual,expected)):
  if a!=b:
   path=Path('/private/tmp/populous-combat-pursuit-failure.json');path.write_text(json.dumps(dict(mode=mode,index=i,case=cases[i],native=b,browser=a),indent=2));raise AssertionError((mode,i,str(path)))
 print(f'PASS: 4096 complete native combat pursuit {mode} calls, fields, results, RNG and ordered consumers',flush=True)
 fixtures.extend(dict(mode=mode,input=cases[i],expected=expected[i]) for i in range(0,len(cases),37))
if '--record' in sys.argv:(ROOT/'tests/fixtures/combat-pursuit.json').write_text(json.dumps(dict(identity=identity,cases=fixtures),separators=(',',':'))+'\n')
