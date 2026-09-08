"""Compare native resting state 19, pose pauses, slot geometry and cell eligibility.
Usage: python scripts/check-native-idle.py /path/to/d3dpoptb.exe
Native RNGs, row/animation selection, slot geometry, height, overlap and motion
release execute. Slot ownership, allocation, insertion and upper setter supplied.
"""
import copy,json,random,struct,subprocess,sys
from pathlib import Path
from unicorn import UC_HOOK_CODE
from unicorn.x86_const import UC_X86_REG_ESP,UC_X86_REG_EIP,UC_X86_REG_EAX
from decomp import native_cpu,configure_native_constants
root=Path(__file__).resolve().parents[1];cpu,_=native_cpu(Path(sys.argv[1]));configure_native_constants(cpu,Path(sys.argv[1]));rng=random.Random(0x4d73e0)
cpu.mem_map(0x2000000,0x40000);p,shaman,out,vstart,stack,stop=0x2000000,0x2000100,0x2000200,0x2010000,0x2030000,0x203f000
fields={'model':(0x2b,'B'),'state':(0x2c,'B'),'substate':(0x2d,'B'),'counter':(0x2e,'B'),'tribe':(0x2f,'b'),'physics':(0x30,'B'),'x':(0x3d,'H'),'y':(0x3f,'H'),'h':(0x41,'h'),'flags2':(0xc,'I'),'flags3':(0x14,'I'),'flags4':(0x10,'I'),'assignment':(0x76,'H'),'speed':(0x5f,'h'),'timer':(0x70,'h'),'cargo':(0x78,'h'),'heading':(0x5d,'H'),'angle':(0x26,'H'),'turnAngle':(0x57,'H'),'goalX':(0x4f,'H'),'goalY':(0x51,'H'),'formationCell':(0x80,'H'),'anchorFlags':(0x82,'B'),'stateObject':(0x87,'H'),'previousState':(0x7d,'B'),'renderFlags':(0x35,'H'),'f1':(0x37,'h'),'f2':(0x39,'B'),'draw':(0x3a,'B'),'object':(0x33,'H'),'animationMode':(0xa8,'B'),'commandPhase':(0xaa,'B')}
fields.update(anchorX=(0x68,'H'),anchorY=(0x6a,'H'),slowTurn=(0x7e,'B'),vehicle=(0x9f,'H'),motionTimer=(0x61,'h'),motionMode=(0x66,'B'))
def write(a,f,*v):cpu.mem_write(a,struct.pack('<'+f,*v))
def read(a,f):return struct.unpack('<'+f,cpu.mem_read(a,struct.calcsize('<'+f)))[0]
def point(a):return dict(zip(['x','y','h'],struct.unpack('<HHh',cpu.mem_read(a,6))))
def person():return {k:read(p+off,f) for k,(off,f) in fields.items()}
def snapshot():return dict(p=person(),randomState=read(0x89d178,'I'),poseRandom=read(0x89bc72,'I'),events=copy.deepcopy(events))
def call(a,*args):
 write(stack,'I'*(len(args)+1),stop,*args);cpu.reg_write(UC_X86_REG_ESP,stack);cpu.emu_start(a,stop,count=2000000);assert cpu.reg_read(UC_X86_REG_EIP)==stop;return cpu.reg_read(UC_X86_REG_EAX)&255
def leaf(cpu,a,size,u):
 global search_index,collision_index
 if a==0x518200 and mode!='approach':return
 sp=cpu.reg_read(UC_X86_REG_ESP);args=[];result=0
 names={0x4f2480:'occupied',0x4d5420:'valid',0x4d5120:'find',0x4d4040:'animation',0x4e9dd0:'destination',0x4ee580:'insert',0x4ed8a0:'allocate',0x48a050:'sound',0x4d56f0:'refresh'}
 names.update({0x518200:'collision',0x49a2f0:'searchStart',0x49a3f0:'searchNext',0x49a5d0:'searchEnd',0x4e9d80:'plannedDestination',0x436c20:'allocateOrder',0x40a3f0:'adjacent',0x404420:'buildingPoint',0x438730:'prepareOrder',0x436ca0:'clearOrders',0x436d00:'attachOrder',0x4ed640:'initialize'})
 name=names[a]
 if name=='animation':args=[read(sp+8,'H')]
 elif name in ['destination','insert']:
  q=point(read(sp+8,'I'));args=[q if name=='insert' else {k:q[k] for k in ['x','y']}]
 elif name=='allocate':
  assert [read(sp+4,'B'),read(sp+8,'B'),read(sp+12,'B')]==[5,11,255]
 elif name=='sound':args=[read(sp+8,'H')]
 elif name=='refresh':args=[read(sp+4,'H')]
 elif name in ['collision','plannedDestination']:
  q=point(read(sp+(4 if name=='collision' else 8),'I'));args=[{k:q[k] for k in ['x','y']}]
 elif name=='searchStart':assert [read(sp+4,'B'),read(sp+8,'H'),read(sp+12,'B'),read(sp+16,'B')]==[2,0,0,32]
 elif name in ['searchNext','searchEnd']:args=[read(sp+4,'B')]
 elif name=='prepareOrder':args=[read(sp+4,'H'),read(sp+8,'B'),{k:v for k,v in point(read(sp+12,'I')).items() if k!='h'}]
 elif name=='attachOrder':assert read(sp+12,'B')==0;args=[read(sp+8,'H')]
 elif name=='adjacent':assert read(sp+8,'B')==4
 elif name=='buildingPoint':assert read(sp+4,'I')==out;args=[out]
 events.append([name,args,person()])
 if name=='occupied':result=case['occupied']
 elif name=='valid':result=case['valid']
 elif name=='find':
  result=case['found'];write(p+0x80,'HB',case['newCell'],case['newFlags'])
 elif name=='animation':write(p+0x33,'H',case['object']);write(p+0x3a,'B',case['draw'])
 elif name=='insert':write(p+0x3d,'HHh',*args[0].values())
 elif name=='allocate':result=out if sum(e[0]=='allocate' for e in events)<=case['logs'] else 0
 elif name=='collision':result=case['collisions'][collision_index%len(case['collisions'])];collision_index+=1
 elif name=='searchStart':result=case['searchId']
 elif name=='searchNext':
  if search_index<len(case['deltas']):
   q=case['deltas'][search_index];write(read(sp+8,'I'),'i',q['x']);write(read(sp+12,'I'),'i',q['y']);result=1;search_index+=1
 elif name=='plannedDestination' and case['follow']:write(p+0x4f,'HH',args[0]['x'],args[0]['y'])
 elif name=='allocateOrder':
  result=case['orderId']
  if case['allocationInside']:write(p+0xc,'I',read(p+0xc,'I')|0x800000)
 elif name=='adjacent':result=out if case['adjacent'] else 0
 elif name=='buildingPoint':write(read(sp+8,'I'),'HH',case['buildingPoint']['x'],case['buildingPoint']['y'])
 elif name=='initialize':write(p+0xc,'I',case['initializedFlags'])
 cpu.reg_write(UC_X86_REG_EAX,result);cpu.reg_write(UC_X86_REG_EIP,read(sp,'I'));cpu.reg_write(UC_X86_REG_ESP,sp+4)
for a in [0x4f2480,0x4d5420,0x4d5120,0x4d4040,0x4e9dd0,0x4ee580,0x4ed8a0,0x48a050,0x4d56f0,0x518200,0x49a2f0,0x49a3f0,0x49a5d0,0x4e9d80,0x436c20,0x40a3f0,0x404420,0x438730,0x436ca0,0x436d00,0x4ed640]:cpu.hook_add(UC_HOOK_CODE,leaf,begin=a,end=a)
def observe(cpu,a,size,u):
 if a==0x4ea460:events.append(['motion',[],person()])
 elif mode=='approach':
  sp=cpu.reg_read(UC_X86_REG_ESP);events.append(['height',[dict(x=read(sp+4,'H'),y=read(sp+8,'H'))],person()])
cpu.hook_add(UC_HOOK_CODE,observe,begin=0x4ea460,end=0x4ea460)
cpu.hook_add(UC_HOOK_CODE,observe,begin=0x44e940,end=0x44e940)
offsets=[[dict(x=rng.randrange(-512,513),y=rng.randrange(-512,513)) for _ in range(16)] for _ in range(16)];offsets[6]=offsets[0]
for shape in range(1,16):
 addr=0x2020000+shape*64;write(0x895ed9+shape*4,'I',addr)
 for i,q in enumerate(offsets[shape]):write(addr+i*4,'hh',q['x'],q['y'])
frames=[rng.randrange(256) for _ in range(2048)];write(0x59df44,'I',vstart)
for i,n in enumerate(frames):write(vstart+i*6+1,'B',n)
walk=[rng.randrange(256) for _ in range(8192)];write(0x96aa74,'I',0x2028000);cpu.mem_write(0x2028000,bytes(walk))
for i in range(16384):write(0x8a03e4+i*16+4,'h',100)
js="""import {initializeIdleApproach,initializeRestingPerson,stepRestingPerson,idleSlotPosition} from './app/person-idle.ts';import {stepPersonPose} from './app/animation.ts';import {restingCellCollision} from './app/person-collision.ts';let s='';for await(const c of process.stdin)s+=c;const input=JSON.parse(s);
console.log(JSON.stringify(input.cases.map(c=>{const p=c.p,w={randomState:c.randomState,poseRandom:{randomState:c.poseRandom},turn:c.turn,slotOffsets:input.offsets,shamans:new Map(c.shaman?[[p.tribe,c.shaman]]:[])},events=[],log=(n,...a)=>events.push([n,a,structuredClone(p)]);
const effects={occupied:()=>{log('occupied');return c.occupied;},validSlot:()=>{log('valid');return c.valid;},findSlot:()=>{log('find');p.formationCell=c.newCell;p.anchorFlags=c.newFlags;return c.found;},setAnimation:(_,o)=>{log('animation',o&65535);p.object=c.object;p.draw=c.draw;},releaseMotion:()=>log('motion'),directDestination:q=>log('destination',q),height:()=>100,insert:q=>{log('insert',q);Object.assign(p,q);},allocateLog:()=>{log('allocate');return events.filter(e=>e[0]==='allocate').length<=c.logs;},sound:cue=>log('sound',cue),refreshCell:cell=>log('refresh',cell),frameCount:o=>input.frames[o]};
if(input.mode==='slot')return idleSlotPosition(input.offsets,p.formationCell,p.anchorFlags);
if(input.mode==='cell')return restingCellCollision(c.cell,input.walk,p,c.coastal);
let si=0,ci=0;
Object.assign(effects,{collision:q=>{log('collision',{x:q.x,y:q.y});return c.collisions[ci++%c.collisions.length];},searchStart:()=>{log('searchStart');return c.searchId;},searchNext:id=>{log('searchNext',id);return c.deltas[si++]??null;},searchEnd:id=>log('searchEnd',id),destination:q=>{log('plannedDestination',q);if(c.follow){p.goalX=q.x;p.goalY=q.y;}},allocateOrder:()=>{log('allocateOrder');if(c.allocationInside)p.flags2=(p.flags2|0x800000)>>>0;return c.orderId;},adjacentBuilding:()=>{log('adjacent');return c.adjacent?0x2000200:0;},buildingPoint:id=>{log('buildingPoint',id);return {...c.buildingPoint};},prepareOrder:(...a)=>log('prepareOrder',...a),clearOrders:()=>log('clearOrders'),attachOrder:id=>log('attachOrder',id),initialize:()=>{log('initialize');p.flags2=c.initializedFlags;}});
if(input.mode==='approach')effects.height=q=>{log('height',q);return 100;};
let result;if(input.mode==='pose')stepPersonPose(p,w.poseRandom);else if(input.mode==='initialize')initializeRestingPerson(w,p,effects);else if(input.mode==='approach')initializeIdleApproach(c.gameFlags,p,effects);else result=stepRestingPerson(w,p,effects);
return {p,randomState:w.randomState,poseRandom:w.poseRandom.randomState,events,...(input.mode==='rest'?{result}:{})};})));"""
for mode,address in [('pose',0x4d6b10),('slot',0x4d5650),('cell',0x518200),('initialize',0x4d7330),('rest',0x4d73e0),('approach',0x4d6f90)]:
 cases=[];expected=[]
 for i in range(4096):
  pp={k:rng.randrange(-32768,32768) if f=='h' else rng.randrange(65536) if f=='H' else rng.randrange(256) if f=='B' else 0 if f=='b' else rng.getrandbits(32) for k,(_,f) in fields.items()}
  pp.update(model=i%9,state=19,substate=i%12,counter=i%256,tribe=i%4,physics=i%20,draw=rng.randrange(45),object=rng.randrange(512),cargo=rng.choice([-32768,-1,0,0,1,100,250,32767]),timer=rng.choice([-32768,-1,0,1,2,32767]),animationMode=i%4,heading=rng.randrange(2048),angle=rng.randrange(2048),f1=rng.choice([0,0,-1,1]),f2=rng.choice([0,0,1,255]))
  if i%3:pp['flags2']=rng.choice([0,0x40000000,0x40080000,0x40088000,0x2004]);pp['flags4']=rng.choice([0,0x400,0x800]);pp['assignment']=rng.choice([0,1,2,16])
  if i%4:pp['goalX']=pp['x'];pp['goalY']=pp['y']
  case=dict(p=pp,randomState=rng.getrandbits(32),poseRandom=rng.getrandbits(32),turn=rng.choice([0,1,2,65536,0xffffffff]),occupied=bool(i&1),valid=bool(i&2),found=bool(i&4),newCell=rng.randrange(65536),newFlags=rng.randrange(256),object=rng.randrange(512),draw=rng.randrange(45),logs=i%4,shaman=None if i%3==0 else dict(x=pp['x'] if i%3==1 else rng.randrange(65536),y=pp['y'] if i%3==1 else rng.randrange(65536)),cell=dict(flags=rng.choice([0,4,512,516]),category=rng.randrange(16)),coastal=bool(i&1))
  case.update(gameFlags=i%2*2,collisions=[rng.randrange(5) for _ in range(5)],searchId=rng.choice([0,1,1,1]),deltas=[dict(x=rng.randrange(-32,33),y=rng.randrange(-32,33)) for _ in range(i%5)],follow=bool(i&1),orderId=rng.choice([0,1,1]),allocationInside=bool(i&2),adjacent=bool(i&4),buildingPoint=dict(x=rng.randrange(65536),y=rng.randrange(65536)),initializedFlags=rng.getrandbits(32))
  pp['vehicle']=rng.choice([0,0,0,1]);pp['slowTurn']=rng.choice([0,0,1]);pp['anchorX']=pp['x'] if i%2 else rng.randrange(65536);pp['anchorY']=pp['y'] if i%2 else rng.randrange(65536)
  if mode=='approach':pp['state']=17
  if i%5==0:
   q=offsets[pp['anchorFlags']>>4][pp['anchorFlags']&15];pp['x']=(((pp['formationCell']&254)+1)*256+q['x'])&65535;pp['y']=((((pp['formationCell']>>8)&254)+1)*256+q['y'])&65535
  cpu.mem_write(p,bytes(256))
  for k,(off,f) in fields.items():write(p+off,f,pp[k])
  write(0x89d178,'I',case['randomState']);write(0x89bc72,'I',case['poseRandom']);write(0x89d188,'I',case['turn']);write(0x89d17c,'I',case['gameFlags'])
  for tribe in range(4):write(0x89d1c8+tribe*0xc65+0x89d,'I',shaman if case['shaman'] and tribe==pp['tribe'] else 0)
  if case['shaman']:write(shaman+0x3d,'HH',case['shaman']['x'],case['shaman']['y'])
  cell=0x8a03e4+((pp['y']>>9)*128+(pp['x']>>9))*16;write(cell,'I',case['cell']['flags']);write(cell+12,'B',case['cell']['category']);events=[];search_index=0;collision_index=0
  if mode=='slot':call(address,p+0x80,out);expected.append(dict(x=read(out,'H'),y=read(out+2,'H')))
  elif mode=='cell':expected.append(call(address,p+0x3d,int(case['coastal'])))
  else:
   result=call(address,p);expected.append({**snapshot(),**({'result':result} if mode=='rest' else {})})
  cases.append(case)
 r=subprocess.run(['node','--input-type=module','-e',js],input=json.dumps(dict(mode=mode,cases=cases,offsets=offsets,frames=frames,walk=walk)),capture_output=True,text=True,cwd=root);assert r.returncode==0,r.stderr;actual=json.loads(r.stdout);assert len(actual)==len(expected)
 for i,(a,b) in enumerate(zip(expected,actual)):
  if a!=b:
   path=Path('/private/tmp/populous-idle-failure.json');path.write_text(json.dumps(dict(mode=mode,index=i,case=cases[i],native=a,browser=b),indent=2));raise AssertionError((mode,i,str(path)))
 print(f'PASS: 4,096 native {mode} comparisons',flush=True)
