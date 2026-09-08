"""Compare the complete native victory controller and chain action helper.
Usage: python scripts/check-native-celebration.py /path/to/d3dpoptb.exe
Cell/object lists are real native data; animation, movement, allocation and
projectile consumers are supplied at call boundaries. No person physics claimed.
"""
import json,random,struct,subprocess,sys
from pathlib import Path
from unicorn import UC_HOOK_CODE
from unicorn.x86_const import UC_X86_REG_ESP,UC_X86_REG_EIP,UC_X86_REG_EAX
from decomp import native_cpu,configure_native_constants
root=Path(__file__).resolve().parents[1];exe=Path(sys.argv[1]);cpu,_=native_cpu(exe);configure_native_constants(cpu,exe)
cpu.mem_map(0x2000000,0x40000);stack,stop=0x203d000,0x203e000
fields={'id':(0x24,'H'),'class':(0x2a,'B'),'model':(0x2b,'B'),'state':(0x2c,'B'),'substate':(0x2d,'B'),'tribe':(0x2f,'b'),'counter':(0x2e,'B'),
 'x':(0x3d,'H'),'y':(0x3f,'H'),'h':(0x41,'h'),'flags2':(0xc,'I'),'flags3':(0x14,'I'),'flags4':(0x10,'I'),'physics':(0x30,'B'),'speed':(0x5f,'h'),
 'timer':(0x70,'h'),'target':(0x72,'H'),'link':(0x74,'H'),'assignment':(0x76,'H'),'cargo':(0x78,'h'),'vehicle':(0x9f,'H'),'stateObject':(0x87,'H'),
 'animationMode':(0xa8,'B'),'commandAux':(0xa9,'B'),'commandPhase':(0xaa,'b'),'angle':(0x26,'H'),'turnAngle':(0x57,'H'),'heading':(0x5d,'H'),
 'anchorX':(0x68,'H'),'anchorY':(0x6a,'H'),'renderFlags':(0x35,'H'),'f1':(0x37,'h'),'f2':(0x39,'B')}
def write(a,f,*v):cpu.mem_write(a,struct.pack('<'+f,*v))
def read(a,f):return struct.unpack('<'+f,cpu.mem_read(a,struct.calcsize('<'+f)))[0]
def ptr(id):return 0x2000000+id*512
def call(a,*args):
 write(stack,'I'*(len(args)+1),stop,*[v&0xffffffff for v in args]);cpu.reg_write(UC_X86_REG_ESP,stack)
 cpu.emu_start(a,stop,timeout=1000000,count=1000000);assert cpu.reg_read(UC_X86_REG_EIP)==stop,hex(cpu.reg_read(UC_X86_REG_EIP))
def actor(a):return {k:read(a+o,f) for k,(o,f) in fields.items()}
def cell(p):return ((p['x']>>8)&254)|(p['y']&0xfe00)
events=[];drops=0;fixture={}
# Stubbed animation consumers leave the supplied frame record unchanged.
# Signed hold=-3 and duration=(signed delay 2 + 1)*7 exercise caller writes.
write(0x59df44,'I',0x2030000);write(0x2030001,'B',7)
write(0x5a6ad7+3*11+1,'b',-3);write(0x5a6ad7+3*11+3,'b',2)
object_table={i:list(struct.unpack('<HH',cpu.mem_read(0x5a6858+i*4,4))) for i in range(-128,512)}
def leaf(cpu,a,size,user):
 global drops
 sp=cpu.reg_read(UC_X86_REG_ESP);args=[read(sp+4+i*4,'I') for i in range(4)];p=args[0];result=0
 if a==0x4d4040:events.append(['animation',read(p+0x24,'H'),(args[1]<<16&0xffffffff)>>16,True])
 elif a==0x4ee700:
  p-=0x33;pair=((args[2]<<16&0xffffffff)>>16,(args[1]<<16&0xffffffff)>>16)
  # Compare raw object-table values: duplicate table rows need no invented identity.
  events.append(['rawAnimation',read(p+0x24,'H'),*pair])
 elif a==0x4ea460:events.append(['motion',read(p+0x24,'H')])
 elif a==0x4e9dd0:events.append(['destination',read(p+0x24,'H'),read(args[1],'H'),read(args[1]+2,'H')])
 elif a==0x4ed8a0:
  assert args[:3]==[5,11,255];events.append(['drop',read(args[3],'H'),read(args[3]+2,'H')]);result=ptr(50) if drops<fixture['drops'] else 0;drops+=1
 elif a==0x48a050:events.append(['sound',read(p+0x24,'H'),args[1]]);assert args[2]==0
 elif a==0x407490:events.append(['leave',read(args[1]+0x24,'H')])
 elif a==0x51fbf0:events.append(['projectile',read(p+0x24,'H'),read(args[2],'H'),read(args[2]+2,'H'),read(args[2]+4,'h')]);assert args[1]==0
 cpu.reg_write(UC_X86_REG_EAX,result);cpu.reg_write(UC_X86_REG_EIP,read(sp,'I'));cpu.reg_write(UC_X86_REG_ESP,sp+4)
for a in [0x4d4040,0x4ee700,0x4ea460,0x4e9dd0,0x4ed8a0,0x48a050,0x407490,0x51fbf0]:cpu.hook_add(UC_HOOK_CODE,leaf,begin=a,end=a)
rng=random.Random(0x4e0af0);cases=[];expected=[]
for trial in range(2496):
 phase=trial%9;origin=rng.choice([0,256,65000,32700]);people=[]
 for i in range(1,11):
  p={k:0 for k in fields};p.update(id=i,**{'class':1},model=rng.randrange(9),state=41,substate=rng.randrange(9),tribe=rng.randrange(2),counter=rng.randrange(256),
   x=(origin+rng.randrange(700))&65535,y=(origin+rng.randrange(700))&65535,h=rng.randrange(-100,500),physics=rng.randrange(20),
   flags2=rng.choice([0,0x40000000,0x80000,0x40808000,0x40000000|0x800000]),flags3=rng.choice([0,16,0x80000]),flags4=rng.choice([0,0x400]),
   speed=rng.choice([0,1,50]),timer=rng.choice([-32768,-1,0,1,2,100,32767]),assignment=rng.choice([0,16,128,144]),cargo=rng.choice([0,0,100,250,-1]),vehicle=rng.choice([0,100]),
   stateObject=99,animationMode=rng.randrange(3),commandAux=rng.randrange(6),commandPhase=rng.choice([-128,-1,0,1,2,50,127]),angle=rng.randrange(2048),heading=rng.randrange(2048),
   turnAngle=rng.randrange(2048),anchorX=rng.randrange(65536),anchorY=rng.randrange(65536),renderFlags=0,f1=5,f2=3)
  if i==1:p.update(substate=phase,tribe=0,flags2=p['flags2']|(0x40000000 if trial%2 else 0))
  if p['substate']==5:p['animationMode']=rng.randrange(4)
  if i<10:p['link']=i+1 if trial%3==0 else 0
  if phase==6 and i==2:p.update(substate=5,link=0)
  if phase==6 and i==1:p['target']=2 if trial%4 else 0
  # Dense same-cell fixtures exercise circle leaders and recruits.
  if trial%4==0:p.update(x=origin+100,y=origin+100,tribe=0,substate=phase if i==1 else 4 if i<7 else 3)
  if trial>=2304:p.update(substate=0,model=7 if i==10 else 6 if i==9 else 2 if i%2 else 3,physics=3,tribe=0,flags2=0x40000000,flags3=0,flags4=0,link=0,target=0,cargo=0,vehicle=0,assignment=0,anchorX=p['x'],anchorY=p['y'])
  people.append(p)
 c=dict(people=people,randomState=rng.getrandbits(32),shamans=[10,9,0,0],drops=trial%4,helper=trial%4 if 2048<=trial<2304 else None,timeline=64 if 2304<=trial<2368 else 0,initialize=trial>=2368)
 fixture=c;events=[];drops=0
 cpu.mem_write(0x890390,bytes(4096));cpu.mem_write(0x8a03e4,bytes(16384*16));write(0x89d178,'I',c['randomState'])
 cells={}
 for p in people:
  a=ptr(p['id']);cpu.mem_write(a,bytes(512))
  for k,(o,f) in fields.items():write(a+o,f,p[k])
  write(0x890390+p['id']*4,'I',a);cells.setdefault(cell(p),[]).append(p['id'])
 for cc,ids in cells.items():
  a=0x8a03e4+((cc&254)//2+(cc>>9)*128)*16;write(a+6,'H',ids[0]);write(a+8,'H',100)
  for i,id in enumerate(ids):write(ptr(id)+0x20,'H',ids[i+1] if i+1<len(ids) else 0)
 write(0x890390+400,'I',ptr(50))
 for i,id in enumerate(c['shamans']):write(0x89d1c8+i*0xc65+0x89d,'I',ptr(id) if id else 0)
 def snapshot():return dict(people=[actor(ptr(p['id'])) for p in people],randomState=read(0x89d178,'I'),events=events.copy())
 if c['timeline']:
  traces=[]
  for frame in range(c['timeline']):
   events=[]
   for p in people:
    a=ptr(p['id']);write(a+0x2e,'B',(read(a+0x2e,'B')+1)&255);call(0x4e0af0,a)
   traces.append(snapshot())
  expected.append(traces)
 else:
  if c['initialize']:call(0x4d2740,ptr(1))
  elif c['helper'] is None:call(0x4e0af0,ptr(1))
  else:call(0x4e2610,ptr(1),c['helper'])
  expected.append(snapshot())
 cases.append(c)
js="""import {initializePersonState} from './app/person-state.ts';
import {stepCelebration,setChainAction} from './app/celebration.ts';import rules from './app/original-rules.json' with {type:'json'};
let input='';for await(const c of process.stdin)input+=c;const data=JSON.parse(input);
console.log(JSON.stringify(data.cases.map(c=>{
 const people=new Map(c.people.map(p=>[p.id,p])),events=[],cell=p=>((p.x>>>8)&254)|(p.y&0xfe00);let drops=0;
 const w={people,randomState:c.randomState,shamans:c.shamans,cellPeople:cc=>c.people.filter(p=>cell(p)===cc)};
 const effects={animation:(p,o,upper)=>events.push(upper?['animation',p.id,o&65535,true]:['rawAnimation',p.id,...data.objects[o]]),animationTiming:()=>({hold:-3,duration:21}),
  releaseMotion:p=>events.push(['motion',p.id]),destination:(p,to)=>events.push(['destination',p.id,to.x&65535,to.y&65535]),
  dropLog:p=>{events.push(['drop',p.x,p.y]);return drops++<c.drops;},sound:(p,cue)=>events.push(['sound',p.id,cue]),leaveBuilding:p=>events.push(['leave',p.id]),
  projectile:(p,to)=>events.push(['projectile',p.id,to.x,to.y,to.h])};
 const keys=Object.keys(c.people[0]);
 const snapshot=()=>structuredClone({people:c.people.map(p=>Object.fromEntries(keys.map(k=>[k,p[k]]))),randomState:w.randomState,events});
 if(c.timeline){const traces=[];for(let f=0;f<c.timeline;f++){events.length=0;for(const p of c.people){p.counter=(p.counter+1)&255;stepCelebration(w,p,effects);}traces.push(snapshot());}return traces;}
 if(c.initialize){
  const p=c.people[0];Object.assign(p,{previousState:0,selectionFlags:0,commands:Array(8).fill(0),commandCursor:0,immediateCommand:0,orderLocation:0,commandStatus:0,workTarget:0,statusFlags:0,workFlags:0,reservationNext:0,formationCell:0,motionTimer:0,motionMode:0});
  Object.assign(w,{instantFacing:false,levelFlags:0,orders:{records:[],cursor:0,active:0},tribes:Array.from({length:4},()=>({x:0,y:0,angle:0,selectedCount:0,flags:0}))});
  initializePersonState(w,p,{deselectPassengers:()=>{},rebuildTrainingQueue:()=>{throw Error('unexpected training');},rebuildFormation:()=>{throw Error('unexpected formation');},releaseMotion:effects.releaseMotion,startOrders:()=>{throw Error('unexpected orders');},setAnimation:(p,o)=>effects.animation(p,o,true),celebrate:()=>stepCelebration(w,p,effects)});
 }else if(c.helper===null)stepCelebration(w,c.people[0],effects);else setChainAction(c.people[0],c.helper,effects);
 return snapshot();
})));"""
r=subprocess.run(['node','--input-type=module','-e',js],input=json.dumps(dict(cases=cases,objects=object_table)),capture_output=True,text=True,cwd=root);assert r.returncode==0,r.stderr
actual=json.loads(r.stdout);assert len(actual)==len(expected)
for i,(a,b) in enumerate(zip(expected,actual)):
 if a!=b:
  path=Path('/private/tmp/populous-celebration-failure.json');path.write_text(json.dumps(dict(case=cases[i],native=a,browser=b),indent=2));raise AssertionError((i,str(path)))
print('PASS: 128 composed native state-41 initializations with the real celebration controller')
print('PASS: 40,960 sequential native calls across 64 ten-person timelines; movement and animation consumers supplied')
print('PASS: 2,048 complete native celebration calls across all nine substates and 256 chain-action calls; all people, RNG and ordered effects match')
