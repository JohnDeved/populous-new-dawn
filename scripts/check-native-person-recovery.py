"""Compare fight recovery and special-battle placement/initialization/boundary.
Usage: python scripts/check-native-person-recovery.py /path/to/d3dpoptb.exe
Native math, RNG, cell motion, height and effect animation setter execute.
Person animation, vehicle exit, allocation/class init and fight are supplied.
"""
import copy,json,random,struct,subprocess,sys
from pathlib import Path
from unicorn import UC_HOOK_CODE
from unicorn.x86_const import UC_X86_REG_ESP,UC_X86_REG_EIP,UC_X86_REG_EAX
from decomp import native_cpu,configure_native_constants
root=Path(__file__).resolve().parents[1];cpu,_=native_cpu(Path(sys.argv[1]));configure_native_constants(cpu,Path(sys.argv[1]));rng=random.Random(0x4dfac0)
cpu.mem_map(0x2000000,0x40000);p,target,fx,center,out,vstart,stack,stop=0x2000000,0x2000100,0x2000200,0x2000300,0x2010000,0x2014000,0x2030000,0x203f000
fields={'id':(0x24,'H'),'class':(0x2a,'B'),'model':(0x2b,'B'),'state':(0x2c,'B'),'substate':(0x2d,'B'),'x':(0x3d,'H'),'y':(0x3f,'H'),'h':(0x41,'h'),'flags2':(0xc,'I'),'flags3':(0x14,'I'),'flags4':(0x10,'I'),'assignment':(0x76,'H'),'tribe':(0x2f,'b'),'speed':(0x5f,'h'),'timer':(0x70,'h'),'target':(0x72,'H'),'link':(0x74,'h'),'cargo':(0x78,'h'),'vehicle':(0x9f,'H'),'heading':(0x5d,'H'),'angle':(0x26,'H'),'turnAngle':(0x57,'H'),'renderFlags':(0x35,'H'),'f1':(0x37,'h'),'f2':(0x39,'B'),'draw':(0x3a,'B'),'object':(0x33,'H'),'cellNext':(0x20,'H'),'cellPrevious':(0x22,'H')}
fields.update(previousState=(0x7d,'B'),physics=(0x30,'B'),statusFlags=(0xb2,'B'),stateObject=(0x87,'H'),workFlags=(0x9d,'H'),workTarget=(0x89,'H'),commandStatus=(0xa7,'B'),reservationNext=(0x85,'H'),formationCell=(0x80,'H'),selectionFlags=(0x7a,'B'),commandCursor=(0xa6,'B'),immediateCommand=(0x9b,'H'),orderLocation=(0x83,'H'),animationMode=(0xa8,'B'),motionTimer=(0x61,'h'),motionMode=(0x66,'B'))
effect_fields={'flags2':(0xc,'I'),'state':(0x2c,'B'),'duration':(0x6c,'h'),'object':(0x33,'H'),'draw':(0x3a,'B'),'morph':(0x3b,'B'),'palette':(0x3c,'B'),'renderFlags':(0x35,'H'),'f1':(0x37,'h'),'f2':(0x39,'B')}
def write(a,f,*v):cpu.mem_write(a,struct.pack('<'+f,*v))
def read(a,f):return struct.unpack('<'+f,cpu.mem_read(a,struct.calcsize('<'+f)))[0]
def call(a,*args):
 write(stack,'I'*(len(args)+1),stop,*[v&0xffffffff for v in args]);cpu.reg_write(UC_X86_REG_ESP,stack);cpu.emu_start(a,stop,count=2000000)
 assert cpu.reg_read(UC_X86_REG_EIP)==stop,hex(cpu.reg_read(UC_X86_REG_EIP));return cpu.reg_read(UC_X86_REG_EAX)
def put(a,obj,layout):
 cpu.mem_write(a,bytes(256))
 for k,(off,f) in layout.items():write(a+off,f,obj[k])
def get(a,layout):return {k:read(a+off,f) for k,(off,f) in layout.items()}
def point(a):return dict(zip(['x','y','h'],struct.unpack('<HHh',cpu.mem_read(a,6))))
def person():return {**get(p,fields),'commands':list(struct.unpack('<8H',cpu.mem_read(p+0x8b,16))),'displacement':dict(zip(['x','y','h'],struct.unpack('<hhh',cpu.mem_read(p+0x43,6))))}
def snapshot():return dict(p=person(),events=copy.deepcopy(events),randomState=read(0x89d178,'I'),effect=get(fx,effect_fields))
write(0x59df44,'I',vstart);write(0x96aa70,'I',center);write(0x890394,'I',p);write(0x890398,'I',target)
for i in range(16384):write(0x8a03e4+i*16+4,'h',100)
touched=set()
def leaf(cpu,a,size,u):
 sp=cpu.reg_read(UC_X86_REG_ESP);result=0;args=[]
 if a==0x4d4040:
  name='animation';args=[read(sp+8,'H')]
  events.append([name,args,person()]);write(p+0x33,'H',case['object']);write(p+0x3a,'B',case['draw'])
 elif a==0x51fbf0:
  name='fight';assert read(sp+12,'I')==0;args=[read(read(sp+8,'I')+0x24,'H')];events.append([name,args,person()])
 elif a==0x466c80:
  assert read(sp+8,'B')==1;events.append(['vehicle',[],person()])
 elif a==0x4ed8a0:
  args=[read(sp+4,'B'),read(sp+8,'B'),read(sp+12,'b'),point(read(sp+16,'I'))];events.append(['allocate',args,person()]);result=fx if case['allocated'] else 0
 elif a==0x4ed640:events.append(['effectInit',[],get(fx,effect_fields)])
 else:raise AssertionError(hex(a))
 cpu.reg_write(UC_X86_REG_EAX,result);cpu.reg_write(UC_X86_REG_EIP,read(sp,'I'));cpu.reg_write(UC_X86_REG_ESP,sp+4)
for a in [0x4d4040,0x51fbf0,0x466c80,0x4ed8a0,0x4ed640]:cpu.hook_add(UC_HOOK_CODE,leaf,begin=a,end=a)
def observe(cpu,a,size,u):
 if a==0x4ea460:events.append(['motion',[],person()]);return
 q=point(read(cpu.reg_read(UC_X86_REG_ESP)+8,'I'));touched.update([(read(p+0x3f,'H')>>9)*128+(read(p+0x3d,'H')>>9),(q['y']>>9)*128+(q['x']>>9)]);events.append(['insert',[q],person()])
for a in [0x4ea460,0x4ee580]:cpu.hook_add(UC_HOOK_CODE,observe,begin=a,end=a)
js="""import {stepFightRecovery,initializePersonState} from './app/person-state.ts';import {specialBattlePosition,initializeSpecialBattle,enforceSpecialBattleBoundary} from './app/special-battle.ts';import {moveObjectInCells} from './app/object-cells.ts';import {terrainPointHeight} from './app/native-terrain.ts';import rules from './app/original-rules.json' with {type:'json'};
let s='';for await(const c of process.stdin)s+=c;const input=JSON.parse(s),land={heights:new Int16Array(16384).fill(100),flags:new Uint32Array(16384)};
console.log(JSON.stringify(input.cases.map(c=>{const p=c.p,w=c.world,effect=c.effect,events=[],log=(n,...a)=>events.push([n,a,structuredClone(p)]),setAnimation=(_,o)=>{log('animation',o&65535);p.object=c.object;p.draw=c.draw;};
if(input.mode==='position')return {point:specialBattlePosition(w,c.rank,c.tribe),randomState:w.randomState};
if(input.mode==='boundary'){enforceSpecialBattleBoundary(c.center,p);return p.life;}
let result;if(input.mode==='fight')result=stepFightRecovery(p,c.gameFlags,new Map([[2,c.target]]),{setAnimation,duration:()=>(rules.animationDescriptors[p.draw].step+1)*c.frames,fight:id=>log('fight',id)});
else{const cells={heads:new Uint16Array(16384),objects:new Map([[p.id,p]])};cells.heads[(p.y>>9)*128+(p.x>>9)]=p.id;
const effects={leaveVehicle:()=>log('vehicle'),insert:q=>{log('insert',q);moveObjectInCells(cells,p,q);},height:q=>terrainPointHeight(land,q),allocate:(...a)=>{log('allocate',...a);return c.allocated?effect:null;},initializeEffect:()=>events.push(['effectInit',[],structuredClone(effect)]),releaseMotion:()=>log('motion'),setAnimation};
if(input.mode==='state'){const stateWorld=Object.assign(w,{instantFacing:false,levelFlags:c.gameFlags,orders:{records:[],cursor:0,active:0},tribes:Array.from({length:4},()=>({x:0,y:0,angle:0,selectedCount:0,flags:0}))});const unexpected=()=>{throw Error('Unexpected state consumer');};initializePersonState(stateWorld,p,{specialBattle:()=>initializeSpecialBattle(w,p,effects),deselectPassengers:unexpected,rebuildTrainingQueue:unexpected,rebuildFormation:unexpected,releaseMotion:effects.releaseMotion,startOrders:unexpected,setAnimation});}
else initializeSpecialBattle(w,p,effects);}
return {p,events,randomState:w.randomState,effect,...(input.mode==='fight'?{result}:{})};})));"""
for mode,address in [('position',0x4783a0),('boundary',0x478820),('fight',0x4df220),('initialize',0x4dfac0),('state',0x4d2740)]:
 cases=[];expected=[]
 for i in range(4096):
  pp={k:0 for k in fields};pp.update(id=1,**{'class':1},model=i%8+1,state=36 if mode=='fight' else 39,substate=i%4,x=rng.randrange(65536),y=rng.randrange(65536),h=rng.randrange(-32768,32768),flags2=rng.getrandbits(32)|0x20000,flags3=rng.getrandbits(32),flags4=rng.getrandbits(32),assignment=rng.randrange(65536),tribe=i%4,speed=rng.randrange(-32768,32768),timer=rng.choice([-32768,-1,0,1,2,32767]),target=rng.choice([0,2]),link=rng.choice([-32768,-1,0,1,2,100,32767]),cargo=rng.choice([0,0,100,-1]),vehicle=rng.choice([0,2]),heading=rng.randrange(2048),angle=rng.randrange(2048),turnAngle=rng.randrange(2048),renderFlags=rng.randrange(65536),f1=rng.randrange(-32768,32768),f2=rng.randrange(256),draw=0,object=0,displacement={k:rng.randrange(-32768,32768) for k in ['x','y','h']},commands=[0]*8)
  c=dict(p=pp,world=dict(randomState=rng.getrandbits(32),center=dict(x=rng.randrange(65536),y=rng.randrange(65536),h=100),directions=[rng.randrange(4) for _ in range(4)],populations=[rng.choice([-1,0,8,47,48,56,100,500,2048,2147483647]) for _ in range(4)]),rank=pp['link'],tribe=pp['tribe'],gameFlags=rng.choice([0,2]),target=dict(x=rng.randrange(65536),y=rng.randrange(65536),**{'class':rng.choice([0,1])},flags2=rng.choice([0,1])),frames=rng.randrange(256),draw=rng.randrange(45),object=rng.randrange(512),allocated=bool(i%3),effect={k:rng.randrange(256) for k in effect_fields})
  if mode=='state':pp.update(state=36 if i%2 else 39,previousState=10,physics=i%20,assignment=0,flags3=pp['flags3']&~160)
  c['effect']['flags2']=rng.choice([0,0x100000]);c['effect']['f1']=rng.randrange(-32768,32768)
  c['center']={**c['world']['center'],'substate':i%4,'delay':rng.choice([0,0,1,-1])};pp['life']=rng.randrange(-32768,32768) if mode=='boundary' else 0
  # Life is only owned by the boundary query, not the other routines' snapshots.
  if mode!='boundary':del pp['life']
  case=c;put(p,pp,fields);write(p+0x43,'hhh',*pp['displacement'].values());put(fx,c['effect'],effect_fields);write(0x89d178,'I',c['world']['randomState']);write(0x89d17c,'I',c['gameFlags'])
  write(center+0x3d,'HHh',*c['world']['center'].values());write(center+0x80,'4B',*c['world']['directions']);write(center+0x2d,'B',c['center']['substate']);write(center+0x7a,'h',c['center']['delay'])
  for t,n in enumerate(c['world']['populations']):write(0x89d1c8+t*0xc65+0x91d,'i',n);write(0x89d1c8+t*0xc65+0x941,'I',0)
  write(target+0x24,'H',2);write(target+0x3d,'HH',c['target']['x'],c['target']['y']);write(target+0x2a,'B',c['target']['class']);write(target+0xc,'I',c['target']['flags2']);write(vstart+c['object']*6+1,'B',c['frames'])
  for cell in touched:write(0x8a03e4+cell*16+6,'H',0)
  cell=(pp['y']>>9)*128+(pp['x']>>9);touched={cell};write(0x8a03e4+cell*16+6,'H',1);events=[]
  if mode=='position':call(address,center,c['rank'],c['tribe'],out);expected.append(dict(point=dict(x=read(out,'H'),y=read(out+2,'H')),randomState=read(0x89d178,'I')))
  elif mode=='boundary':write(p+0x6e,'h',pp['life']);call(address,center,p);expected.append(read(p+0x6e,'h'))
  else:
   result=call(address,p)&255;expected.append({**snapshot(),**({'result':result} if mode=='fight' else {})})
  cases.append(c)
 r=subprocess.run(['node','--input-type=module','-e',js],input=json.dumps(dict(mode=mode,cases=cases)),capture_output=True,text=True,cwd=root);assert r.returncode==0,r.stderr;actual=json.loads(r.stdout);assert len(actual)==len(expected)
 for i,(a,b) in enumerate(zip(expected,actual)):
  if a!=b:
   path=Path('/private/tmp/populous-recovery-failure.json');path.write_text(json.dumps(dict(mode=mode,index=i,case=cases[i],native=a,browser=b),indent=2));raise AssertionError((mode,i,str(path)))
 print(f'PASS: 4,096 native {mode} comparisons',flush=True)
