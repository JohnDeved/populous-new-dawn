"""Execute 0051a2a0's fight/person-target phases through its real pursuit/idle helpers.
Target selection (other phases), allocation, route destinations, waiting-position
world queries, housed-building approach, retarget selection and final join/encounter
are separate consumers. Pose/RNG/facing execute.
Usage: python scripts/check-native-fight-approach.py EXE [--record]
"""
import copy,json,random,struct,subprocess,sys
from pathlib import Path
from unicorn import UC_HOOK_CODE
from unicorn.x86_const import UC_X86_REG_ESP,UC_X86_REG_EIP,UC_X86_REG_EAX
from decomp import native_cpu,configure_native_constants,ROOT
exe=Path(sys.argv[1]);cpu,identity=native_cpu(exe);configure_native_constants(cpu,exe)
cpu.mem_map(0x2000000,0x20000)
p,group,order,counts,stack,stop=0x2000000,0x2000200,0x2000400,0x2008000,0x201d000,0x201e000
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
 'workTarget':(0x89,'H'),'animationMode':(0xa8,'B'),'commandPhase':(0xaa,'B'),
 'object':(0x33,'H'),'renderFlags':(0x35,'H'),'f1':(0x37,'h'),'f2':(0x39,'B'),'draw':(0x3a,'B'),'morph':(0x3b,'B'),'palette':(0x3c,'B')}
gfields={'id':(0x24,'H'),'class':(0x2a,'B'),'flags2':(0xc,'I'),'flags4':(0x10,'I'),
 'tribe':(0x2f,'b'),'life':(0x6e,'h'),'workFlags':(0x9d,'H'),'vehicle':(0x9f,'H'),'count':(0x68,'B'),'reactionTimer':(0x31,'B'),'x':(0x3d,'H'),'y':(0x3f,'H')}
def record(a,fs):return {k:read(a+off,f) for k,(off,f) in fs.items()}
def log(name,*args):events.append([name,*args,record(p,fields),read(0x89d178,'I')])
def consumer(c,address,size,user):
 sp=c.reg_read(UC_X86_REG_ESP);a,b,d=struct.unpack('<III',c.mem_read(sp+4,12));result=0
 if address==0x4d4040:
  log('animation',(b+32768)%65536-32768);return # Observe actual original animation execution.
 if address==0x4e9d80 or address==0x4e9dd0:
  to=point(b);log('planned' if address==0x4e9d80 else 'direct',to);write(p+0x4f,'HH',to['x'],to['y'])
 elif address==0x51dcc0:log('available');result=int(case['available'])
 elif address==0x51f750:log('waiting');write(d,'HH',case['waiting']['x'],case['waiting']['y'])
 elif address==0x44e940:log('height',dict(x=a&65535,y=b&65535));result=100
 elif address==move_address:
  to={**point(b),'h':read(b+4,'h')};log('move',to);write(p+0x3d,'HHh',to['x'],to['y'],to['h'])
 elif address==0x4ea460:log('releaseMotion')
 elif address==0x51ddc0:log('join');result=int(case['join'])
 elif address==0x438f20:log('approachBuilding',b);result=int(case['buildingReady'])
 elif address==0x51e150:log('encounter',d&255)
 elif address==0x51ff60:log('range');result=5
 elif address==0x51c3c0:log('retarget',list(struct.unpack('<BBHHHH',c.mem_read(b,10))));result=0
 else:raise AssertionError(hex(address))
 c.reg_write(UC_X86_REG_EAX,result);c.reg_write(UC_X86_REG_EIP,read(sp,'I'));c.reg_write(UC_X86_REG_ESP,sp+4)
move_address=0x4ee580
for a in [0x4d4040,0x4e9d80,0x4e9dd0,0x51dcc0,0x51f750,0x44e940,move_address,0x4ea460,0x51ddc0,0x438f20,0x51e150,0x51ff60,0x51c3c0]:cpu.hook_add(UC_HOOK_CODE,consumer,begin=a,end=a)
cases=[];expected=[]
for n in range(12288):
 mode="fight" if n<4096 else "person" if n<8192 else "retry"
 model=[2,3,7][n%3];obj,draw=rules['animationObjects'][rules['personAnimationObjects'][model]]
 pp={k:0 for k in fields}
 pp.update(id=1,**{'class':1},model=model,state=10,substate=1,counter=n&255,tribe=n&1,
  physics=rules['personModels'][model]['physics'],x=rng.choice([0,32767,32768,65535,rng.randrange(65536)]),y=rng.randrange(65536),h=100,
  flags2=rng.choice([0,128,0x8000,0x40000000,0x40008080,0x80000,0x10000000]),flags3=rng.choice([0,0x80000]),
  flags4=rng.choice([0,0x400,0x10007,0x10000000]),assignment=rng.choice([0,16,512,528]),speed=rng.randrange(100),cargo=rng.choice([0,100]),
  angle=rng.randrange(2048),heading=rng.randrange(2048),timer=rng.choice([-32768,-1,0,1,2,16,64,32767]),target=2,workTarget=2,
  animationMode=rng.choice([0,34,38,39,40,255]),commandPhase=rng.randrange(2,7),object=obj,draw=draw,f1=1)
 if n%5==0:pp['object']=0
 pp['renderFlags']=rng.choice([0,2,16,18])
 if mode=='retry':pp['substate']=7
 gp=dict(id=2,**{'class':10},tribe=1-pp['tribe'],life=100,workFlags=0,flags2=0,flags4=rng.getrandbits(32),vehicle=rng.choice([0,0,3]),count=rng.randrange(2,7),reactionTimer=rng.randrange(256),x=(pp['x']+rng.choice([0,111,112,223,279,280,503,504,1000]))&65535,y=(pp['y']+rng.choice([0,1,111,112]))&65535)
 if mode=='person':
  pp['substate']=rng.choice([2,6,8]);pp['target']=3 if pp['substate']==6 else 2
  gp.update({'class':1,'tribe':rng.randrange(2),'life':rng.choice([-1,0,1,100]),'workFlags':rng.choice([0,0,3])})
 pp.update(goalX=gp['x'],goalY=gp['y'])
 to=dict(x=(pp['x']+rng.choice([0,111,112,-111,-112,1000]))&65535,y=pp['y'])
 case=dict(mode=mode,buildingReady=bool(n&4),fightModel=rng.choice([8,9]),cells={},p=pp,fight=gp,randomState=rng.getrandbits(32),waiting=to,available=bool(n&1),join=bool(n&2),alert=n%3)
 for q in [pp,gp]:
  ci=(q['y']>>9)*128+(q['x']>>9)
  case['cells'][str(ci)]=dict(flags=rng.choice([0,512]),id=rng.choice([0,3]))
 for ci,c in case['cells'].items():write(0x8a03e4+int(ci)*16,'IhHH',c['flags'],100,0,c['id'])
 write(0x89039c,'I',0x2000600);cpu.mem_write(0x2000600,bytes(256));write(0x200062b,'B',case['fightModel'])
 cpu.mem_write(p,bytes(256));cpu.mem_write(group,bytes(256));write(0x890394,'2I',p,group)
 for a,fs,values in [(p,fields,pp),(group,gfields,gp)]:
  for k,(off,f) in fs.items():write(a+off,f,values[k])
 write(group+0x2b,'B',8);write(order,'BBHHHH',19,0,1,0,0,0)
 write(0x89d178,'I',case['randomState']);write(0x89d167,'B',case['alert']);write(0x89c6f0,'B',0);write(0x89d17c,'I',0)
 write(stack,'III',stop,p,order);cpu.reg_write(UC_X86_REG_ESP,stack);events=[]
 cpu.emu_start(0x51a2a0,stop,count=100000);assert cpu.reg_read(UC_X86_REG_EIP)==stop,hex(cpu.reg_read(UC_X86_REG_EIP))
 cases.append(copy.deepcopy(case));expected.append(dict(p=record(p,fields),fight=record(group,gfields),randomState=read(0x89d178,'I'),events=copy.deepcopy(events),alert=read(0x89d167,'B'),result=cpu.reg_read(UC_X86_REG_EAX)&255))
js="""
import {approachFight,approachCombatPerson,retryCombatTarget} from './app/combat-approach.ts';import {setPersonAnimation} from './app/animation.ts';import sprites from './app/original-units.json' with {type:'json'};
let text='';for await(const c of process.stdin)text+=c;
console.log(JSON.stringify(JSON.parse(text).map(c=>{
 const p=c.p,w={randomState:c.randomState},events=[];let alert=c.alert;
 const log=(name,...args)=>events.push([name,...args,structuredClone(p),w.randomState]);
 const e={animation:(p,object)=>{log('animation',object);setPersonAnimation(p,object,{playerTribe:0,gameFlags:0,sessionSubstate:null,tribes:Array.from({length:4},()=>({flags:0,playerType:0})),objects:new Map()},sprites)},
 frameCount:object=>sprites.frameCounts[object],
 plannedDestination:to=>{const q={x:to.x,y:to.y};log('planned',q);p.goalX=to.x;p.goalY=to.y;},
 directDestination:to=>{log('direct',to);p.goalX=to.x;p.goalY=to.y;},available:()=>{log('available');return c.available;},waitingPosition:()=>{log('waiting');return c.waiting;},
 move:to=>{log('height',to);const q={...to,h:100};log('move',q);Object.assign(p,q)},releaseMotion:()=>log('releaseMotion'),
 buildingAt:q=>c.cells[(q.y>>>9)*128+(q.x>>>9)],approachBuilding:radius=>{log('approachBuilding',radius);return c.buildingReady;},fightModel:()=>c.fightModel};
 // Outer controller entry and final dispatch are compared too, but remain outside this branch port.
 if(p.tribe===0&&!alert)alert=1;
 p.flags2=(p.flags2|0x2000000)>>>0;
 if(p.flags2&0x40000000){p.flags4=(p.flags4&~0x10007)>>>0;p.assignment&=~512;}
 let decision=c.mode==='fight'?approachFight(w,p,c.fight,e):c.mode==='person'?approachCombatPerson(w,p,c.fight,e):retryCombatTarget(w,p,e);
 if(decision==='encounter'||decision==='inside')log('encounter',decision==='inside'?2:0);
 if(decision==='retarget'){
  log('range');log('retarget',[21,0,0,0,((p.x>>>8)&254)|(p.y&0xfe00),0x404]);decision='restart';
 }
 if(decision==='restart'){p.substate=0;p.flags2=(p.flags2|0x40000000)>>>0;}
 if(decision==='join'){log('join');if(!c.join){p.substate=7;p.flags2=(p.flags2|0x40000000)>>>0;}}
 return {p,fight:c.fight,randomState:w.randomState,events,alert,result:0};})));
"""
r=subprocess.run(['node','--input-type=module','-e',js],input=json.dumps(cases),capture_output=True,text=True,cwd=ROOT);assert r.returncode==0,r.stderr
actual=json.loads(r.stdout);assert len(actual)==len(expected)
for i,(a,b) in enumerate(zip(actual,expected)):
 if a!=b:
  path=Path('/private/tmp/populous-fight-approach-failure.json');path.write_text(json.dumps(dict(case=cases[i],native=b,browser=a),indent=2));raise AssertionError((i,str(path)))
print('PASS: 12288 native fight/person/retry command visits, real pursuit/idle/animation/RNG, phase transitions, reservations and join/retry consumers')
if '--record' in sys.argv:(ROOT/'tests/fixtures/fight-approach.json').write_text(json.dumps(dict(identity=identity,cases=[dict(input=cases[i],expected=expected[i]) for i in range(0,len(cases),31)]),separators=(',',':'))+'\n')
