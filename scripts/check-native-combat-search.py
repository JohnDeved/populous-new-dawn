"""Compare command-19/21 entry, search, retry and periodic retarget control.
Stops at original target dispatch (0051a8db) or early return (0051be34),
before attack phases. Search/world consumers are supplied; motion/RNG/idle execute.
Usage: python scripts/check-native-combat-search.py EXE [--record]
"""
import copy,json,random,struct,subprocess,sys
from pathlib import Path
from unicorn import UC_HOOK_CODE
from unicorn.x86_const import UC_X86_REG_ESP,UC_X86_REG_EIP,UC_X86_REG_EAX
from decomp import native_cpu,configure_native_constants,ROOT
exe=Path(sys.argv[1]);cpu,identity=native_cpu(exe);configure_native_constants(cpu,exe)
cpu.mem_map(0x2000000,0x20000)
p,order,counts,stack,stop=0x2000000,0x2000400,0x2008000,0x201d000,0x201e000
rng=random.Random(0x51a2a0)
rules=json.loads((ROOT/'app/original-rules.json').read_text())
def write(a,f,*v):cpu.mem_write(a,struct.pack('<'+f,*v))
def read(a,f):return struct.unpack('<'+f,cpu.mem_read(a,struct.calcsize('<'+f)))[0]
def point(a):return dict(x=read(a,'H'),y=read(a+2,'H'))
starts=list(struct.iter_unpack('<HH',(exe.parent/'data/vstart-0.ani').read_bytes()))
frames=list(struct.iter_unpack('<HBBBBH',(exe.parent/'data/vfra-0.ani').read_bytes()))
write(0x59df44,'I',counts)
for i,(start,_) in enumerate(starts):
 frame,seen=start,set()
 while frame and frame not in seen:seen.add(frame);frame=frames[frame][-1]
 assert frame in [0,start];write(counts+i*6+1,'B',len(seen)&255)
fields={'id':(0x24,'H'),'class':(0x2a,'B'),'model':(0x2b,'B'),'state':(0x2c,'B'),'substate':(0x2d,'B'),
 'counter':(0x2e,'B'),'tribe':(0x2f,'b'),'physics':(0x30,'B'),'x':(0x3d,'H'),'y':(0x3f,'H'),'h':(0x41,'h'),
 'flags2':(0xc,'I'),'flags3':(0x14,'I'),'flags4':(0x10,'I'),'speed':(0x5f,'h'),'cargo':(0x78,'h'),
 'angle':(0x26,'H'),'heading':(0x5d,'H'),'turnAngle':(0x57,'H'),'turnY':(0x59,'H'),
 'goalX':(0x4f,'H'),'goalY':(0x51,'H'),'destinationX':(0x53,'H'),'destinationY':(0x55,'H'),
 'assignment':(0x76,'H'),'timer':(0x70,'h'),'target':(0x72,'h'),'slowTurn':(0x7e,'b'),
 'vehicle':(0x9f,'H'),'marchCooldown':(0x1e,'B'),'workTarget':(0x89,'H'),'animationMode':(0xa8,'B'),'commandPhase':(0xaa,'B'),
 'object':(0x33,'H'),'renderFlags':(0x35,'H'),'f1':(0x37,'h'),'f2':(0x39,'B'),'draw':(0x3a,'B'),'morph':(0x3b,'B'),'palette':(0x3c,'B')}
def record(a,fs):return {k:read(a+off,f) for k,(off,f) in fs.items()}
def log(name,*args):events.append([name,*args,record(p,fields),read(0x89d178,'I')])
def order_at(a):return dict(zip(['model','flags','references','object','a','b'],struct.unpack('<BBHHHH',cpu.mem_read(a,10))))
def consumer(c,address,size,user):
 global area_index,selection_index
 sp=c.reg_read(UC_X86_REG_ESP);a,b,d=struct.unpack('<III',c.mem_read(sp+4,12));result=0
 if address==0x4d4040:log('animation',(b+32768)%65536-32768);return
 if address==0x51c110:
  log('approach',order_at(b));write(d,'HH',case['point']['x'],case['point']['y']);result=case['point']['kind']
 elif address==0x4e9d80:
  to=point(b);log('destination',to);write(p+0x4f,'HH',to['x'],to['y'])
 elif address==0x438af0:
  log('area',order_at(b));result=case['areas'][area_index];area_index+=1
 elif address==0x51c3c0:
  mode=read(sp+16,'B');log('select',order_at(b),bool(mode));selection=case['selections'][selection_index];selection_index+=1
  if selection:write(d,'B',selection['type']);result=selection['id']
 elif address==0x520300:log('prepare',order_at(b),d);result=case['restart']
 elif address==0x51ff60:log('range');result=case['radius']
 elif address==0x4ea460:log('releaseMotion')
 else:raise AssertionError(hex(address))
 c.reg_write(UC_X86_REG_EAX,result);c.reg_write(UC_X86_REG_EIP,read(sp,'I'));c.reg_write(UC_X86_REG_ESP,sp+4)
def boundary(c,address,size,user):c.emu_stop()
for a in [0x4d4040,0x51c110,0x4e9d80,0x438af0,0x51c3c0,0x520300,0x51ff60,0x4ea460]:cpu.hook_add(UC_HOOK_CODE,consumer,begin=a,end=a)
for a in [0x51a8db,0x51be34]:cpu.hook_add(UC_HOOK_CODE,boundary,begin=a,end=a)
cases=[];expected=[]
for n in range(8192):
 model=2+n%6;obj,draw=rules['animationObjects'][rules['personAnimationObjects'][model]]
 pp={k:0 for k in fields}
 pp.update(id=1,**{'class':1},model=model,state=10,substate=rng.choice([0,0,0,1,2,3,4,5,6,7,8,10,11]),counter=n&255,tribe=n&1,
  physics=rules['personModels'][model]['physics'],x=rng.randrange(65536),y=rng.randrange(65536),h=100,
  flags2=rng.choice([0,128,0x8000,0x40000000,0x40008080,0x80000]),flags3=rng.choice([0,0x80000]),
  flags4=rng.getrandbits(32),assignment=rng.choice([0,16,512,528]),speed=rng.randrange(100),cargo=rng.choice([0,100]),
  angle=rng.randrange(2048),heading=rng.randrange(2048),timer=rng.choice([-32768,-1,0,1,2,16,64,32767]),target=2,workTarget=2,
  vehicle=rng.choice([0,0,3]),marchCooldown=rng.choice([0,0,16,255]),turnAngle=rng.randrange(65536),turnY=rng.randrange(65536),
  animationMode=rng.choice([0,34,38,39,40]),object=obj,draw=draw,f1=1,renderFlags=rng.choice([0,2,16,18]))
 if n%8==0:pp['turnAngle']=(pp['x']+rng.choice([2560,2561,65535]))&65535;pp['turnY']=pp['y']
 command=dict(model=rng.choice([19,21]),flags=rng.randrange(256),references=1,object=0,a=rng.randrange(65536),b=rng.randrange(65536))
 marches=[dict(count=rng.choice([0,1,254,255]),person=rng.randrange(1,100),a=rng.randrange(65536),b=rng.randrange(65536),distance=rng.randrange(50000)) for _ in range(n%9)]
 if marches and n&1:marches[n%len(marches)].update(a=command['a'],b=command['b'])
 case=dict(p=pp,order=command,randomState=rng.getrandbits(32),alert=n%3,playerTribe=0,marches=marches,
  point=dict(x=rng.randrange(65536),y=rng.randrange(65536),kind=n%3),areas=[bool(n&1),bool(n&2)],
  selections=[None if rng.randrange(3)==0 else dict(id=rng.randrange(1,32768),type=rng.randrange(1,5)) for _ in range(3)],restart=bool(n&16),radius=rng.randrange(256))
 cpu.mem_write(p,bytes(256))
 for k,(off,f) in fields.items():write(p+off,f,pp[k])
 write(order,'BBHHHH',*[command[k] for k in ['model','flags','references','object','a','b']])
 write(0xafc288,'i',len(marches));cpu.mem_write(0xafc290,bytes(88))
 for i,m in enumerate(marches):write(0xafc290+i*11,'BHHHI',*[m[k] for k in ['count','person','a','b','distance']])
 write(0x89039c,'I',0x2000600);cpu.mem_write(0x2000600,bytes(256))
 write(0x89d178,'I',case['randomState']);write(0x89d167,'B',case['alert']);write(0x89c6f0,'B',0);write(0x89d17c,'I',0)
 write(stack,'III',stop,p,order);cpu.reg_write(UC_X86_REG_ESP,stack);events=[];area_index=0;selection_index=0
 try:cpu.emu_start(0x51a2a0,stop,count=100000)
 except Exception:
  print('failed case',n,'eip',hex(cpu.reg_read(UC_X86_REG_EIP)));raise
 assert cpu.reg_read(UC_X86_REG_EIP) in [0x51a8db,0x51be34],hex(cpu.reg_read(UC_X86_REG_EIP))
 sp=cpu.reg_read(UC_X86_REG_ESP)
 actual_marches=[dict(zip(['count','person','a','b','distance'],struct.unpack('<BHHHI',cpu.mem_read(0xafc290+i*11,11)))) for i in range(read(0xafc288,'i'))]
 cases.append(copy.deepcopy(case));expected.append(dict(p=record(p,fields),randomState=read(0x89d178,'I'),events=copy.deepcopy(events),alert=read(0x89d167,'B'),marches=actual_marches,result=dict(complete=bool(read(sp+0x14,'B')),restart=bool(read(sp+0x12,'B')))))
js="""
import {prepareCombatOrderVisit} from './app/combat-order-search.ts';import {setPersonAnimation} from './app/animation.ts';import sprites from './app/original-units.json' with {type:'json'};
let text='';for await(const c of process.stdin)text+=c;
console.log(JSON.stringify(JSON.parse(text).map(c=>{
 const p=c.p,w={randomState:c.randomState,alert:c.alert,playerTribe:c.playerTribe,marches:c.marches},events=[];let area=0,selection=0;
 const log=(name,...args)=>events.push([name,...args,structuredClone(p),w.randomState]);
 const e={animation:(p,object)=>{log('animation',object);setPersonAnimation(p,object,{playerTribe:0,gameFlags:0,sessionSubstate:null,tribes:Array.from({length:4},()=>({flags:0,playerType:0})),objects:new Map([[3,{passenger:0}]])},sprites)},
 releaseMotion:()=>log('releaseMotion'),approachPoint:o=>{log('approach',o);return c.point;},destination:to=>{const q={x:to.x,y:to.y};log('destination',q);p.goalX=to.x;p.goalY=to.y;},
 withinArea:o=>{log('area',o);return c.areas[area++];},select:(o,vehicle)=>{log('select',o,vehicle);return c.selections[selection++]??undefined;},prepareTarget:(o,id)=>{log('prepare',o,id);return c.restart;},range:()=>{log('range');return c.radius;}};
 const result=prepareCombatOrderVisit(w,p,c.order,e);
 return {p,randomState:w.randomState,events,alert:w.alert,marches:w.marches,result};})));
"""
r=subprocess.run(['node','--input-type=module','-e',js],input=json.dumps(cases),capture_output=True,text=True,cwd=ROOT);assert r.returncode==0,r.stderr
actual=json.loads(r.stdout);assert len(actual)==len(expected)
for i,(a,b) in enumerate(zip(actual,expected)):
 if a!=b:
  path=Path('/private/tmp/populous-combat-search-failure.json');path.write_text(json.dumps(dict(case=cases[i],native=b,browser=a),indent=2));raise AssertionError((i,str(path)))
print('PASS: 8192 native command-19/21 front halves: entry/search/retry/periodic retarget, march records and real recovery/animation/RNG')
if '--record' in sys.argv:(ROOT/'tests/fixtures/combat-search.json').write_text(json.dumps(dict(identity=identity,cases=[dict(input=cases[i],expected=expected[i]) for i in range(0,len(cases),29)]),separators=(',',':'))+'\n')
