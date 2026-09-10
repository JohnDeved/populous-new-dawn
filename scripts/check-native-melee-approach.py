"""Compare 00519183..0051935f/0051947e approach/ready control in 00518fb0.
The surrounding group list/slot index is supplied; speed RNG, slot geometry,
height, cell movement, route release and animation setters execute natively.
Stops before attack choice/damage. Physics is checked by the driver oracle.
Usage: python scripts/check-native-melee-approach.py /path/to/d3dpoptb.exe
"""
import hashlib, json, random, struct, subprocess, sys
from pathlib import Path
from unicorn import UC_HOOK_CODE
from unicorn.x86_const import UC_X86_REG_ESP, UC_X86_REG_EIP, UC_X86_REG_EDI, UC_X86_REG_EBP
from decomp import native_cpu, configure_native_constants, ROOT
exe=Path(sys.argv[1]);cpu,_=native_cpu(exe);configure_native_constants(cpu,exe)
cpu.mem_map(0x2000000,0x20000)
p,group,out,counts,stack,stop=0x2000000,0x2000100,0x2000200,0x2008000,0x201d000,0x201e000
rng=random.Random(0x519183)
def write(a,f,*v):cpu.mem_write(a,struct.pack('<'+f,*v))
def read(a,f):return struct.unpack('<'+f,cpu.mem_read(a,struct.calcsize('<'+f)))[0]
def call(a,*args):
 write(stack,'I'*(len(args)+1),stop,*args);cpu.reg_write(UC_X86_REG_ESP,stack);cpu.emu_start(a,stop,count=100000);assert cpu.reg_read(UC_X86_REG_EIP)==stop
starts=list(struct.iter_unpack('<HH',(exe.parent/'data/vstart-0.ani').read_bytes()))
frames=list(struct.iter_unpack('<HBBBBH',(exe.parent/'data/vfra-0.ani').read_bytes()))
write(0x59df44,'I',counts)
for i,(start,_) in enumerate(starts):
 frame,seen=start,set()
 while frame and frame not in seen:seen.add(frame);frame=frames[frame][-1]
 assert frame in [0,start];write(counts+i*6+1,'B',len(seen)&255)
write(0x890390,'2I',0,p);write(0x89c6f0,'B',0);write(0x89d17c,'I',0)
heights=[rng.randrange(50,800) for _ in range(16384)]
land=b''.join(struct.pack('<IhHHBBBBBB',i&1,h,0,0,0,0,0,0,0,0) for i,h in enumerate(heights))
fields={'id':(0x24,'H'),'class':(0x2a,'B'),'model':(0x2b,'B'),'state':(0x2c,'B'),'substate':(0x2d,'B'),'tribe':(0x2f,'b'),'physics':(0x30,'B'),'x':(0x3d,'H'),'y':(0x3f,'H'),'h':(0x41,'h'),'flags2':(0xc,'I'),'flags3':(0x14,'I'),'flags4':(0x10,'I'),'speed':(0x5f,'h'),'cargo':(0x78,'h'),'angle':(0x26,'H'),'heading':(0x5d,'H'),'turnAngle':(0x57,'H'),'turnY':(0x59,'H'),'goalX':(0x4f,'H'),'goalY':(0x51,'H'),'destinationX':(0x53,'H'),'destinationY':(0x55,'H'),'motionGroup':(0x63,'h'),'motionIndex':(0x67,'B'),'assignment':(0x76,'H'),'object':(0x33,'H'),'renderFlags':(0x35,'H'),'f1':(0x37,'h'),'f2':(0x39,'B'),'draw':(0x3a,'B'),'morph':(0x3b,'B'),'palette':(0x3c,'B')}
def snapshot():return {k:read(p+off,f) for k,(off,f) in fields.items()}
def finish(c,a,size,u):c.emu_stop()
for a in [0x51935f,0x51947e]:cpu.hook_add(UC_HOOK_CODE,finish,begin=a,end=a)
cases,expected=[],[]
for n in range(4096):
 center=dict(x=rng.choice([0,32767,32768,65535,rng.randrange(65536)]),y=rng.randrange(65536))
 size=rng.choice([2,3,4]);slot_index=n%size;angle=rng.randrange(2048)
 cpu.mem_write(group,bytes(256));write(group+0x26,'H',angle);write(group+0x3d,'2H',center['x'],center['y']);write(group+0x68,'B',size)
 call(0x51e3d0,out,group,slot_index);slot=dict(x=read(out,'H'),y=read(out+2,'H'))
 pp={k:0 for k in fields};pp.update(id=1,**{'class':1},model=[2,3,7][n%3],state=25,substate=n%2,tribe=0,physics=[1,2,6][n%3],x=(slot['x']+rng.choice([-40,-12,-11,0,11,12,40]))&65535,y=(slot['y']+rng.choice([-12,-11,0,11,12]))&65535,h=123,flags2=0x20200|rng.choice([0,0x40000000,0x40008080,0x8000]),flags3=0x80000 if n%5==0 else 0,flags4=0,speed=40,cargo=100 if n%3 else 0,angle=1700,heading=1500,turnAngle=1300,turnY=900,motionGroup=1 if n%3 else 0,motionIndex=7,object=0,f1=n%8,f2=n%9)
 records=bytearray(401*109);struct.pack_into('<hB',records,109,n%3,n%8)
 c=dict(p=pp,center=center,size=size,index=slot_index,angle=angle,slot=slot,randomState=rng.getrandbits(32),record=list(records[109:218]),active=3)
 cpu.mem_write(p,bytes(256));cpu.mem_write(0x8a03e4,land);cpu.mem_write(0x955c29,bytes(records));write(0x9557b0,'h',3);write(0x89d178,'I',c['randomState'])
 for k,(off,f) in fields.items():write(p+off,f,pp[k])
 write(0x8a03e4+((pp['y']>>9)*128+(pp['x']>>9))*16+6,'H',1)
 cpu.mem_write(stack,bytes(256));write(stack+0x18,'I',slot_index)
 cpu.reg_write(UC_X86_REG_ESP,stack);cpu.reg_write(UC_X86_REG_EDI,p);cpu.reg_write(UC_X86_REG_EBP,group)
 cpu.emu_start(0x519183,stop,count=100000)
 end=cpu.reg_read(UC_X86_REG_EIP);assert end in [0x51935f,0x51947e]
 expected.append(dict(p=snapshot(),ready=end==0x51935f,randomState=read(0x89d178,'I'),record=list(cpu.mem_read(0x955c29+109,109)),active=read(0x9557b0,'h')));cases.append(c)
js="""
import {approachMeleeSlot} from './app/melee.ts';import {createMotionRoutes} from './app/person-routes.ts';import {terrainPointHeight} from './app/native-terrain.ts';import {setPersonAnimation} from './app/animation.ts';import sprites from './app/original-units.json' with {type:'json'};
let s='';for await(const c of process.stdin)s+=c;const input=JSON.parse(s),land={heights:input.heights,flags:Uint32Array.from({length:16384},(_,i)=>i&1)};
console.log(JSON.stringify(input.cases.map(c=>{const p=c.p,routes=createMotionRoutes();routes.records.set(c.record,109);routes.active=c.active;const w={routes,randomState:c.randomState};
const ready=approachMeleeSlot(w,p,c.slot,c.center,c.index!==0,{animation:(_,o)=>setPersonAnimation(p,o,{playerTribe:0,gameFlags:0,sessionSubstate:null,tribes:Array.from({length:4},()=>({flags:0,playerType:0})),objects:new Map()},sprites),move:to=>{Object.assign(p,to,{h:terrainPointHeight(land,to)})}});
return {p,ready,randomState:w.randomState,record:[...routes.records.slice(109,218)],active:routes.active};})));
"""
r=subprocess.run(['node','--input-type=module','-e',js],input=json.dumps(dict(cases=cases,heights=heights)),capture_output=True,text=True,cwd=ROOT);assert r.returncode==0,r.stderr
actual=json.loads(r.stdout);assert len(actual)==len(expected)
for i,(a,e) in enumerate(zip(actual,expected)):
 if a!=e:
  path=Path('/private/tmp/populous-melee-approach-failure.json');path.write_text(json.dumps(dict(case=cases[i],native=e,browser=a),indent=2));raise AssertionError((i,str(path)))
print('PASS: 4,096 original melee approach/ready blocks: RNG/speed, signed arrival edges, center/outer facing, animation fields, route bytes and delayed ready-to-approach transitions. Group allocation and post-block combat/physics remain separate.')

# Compose the same native control block with preparation and complete physics,
# then compare the actual browser adapter, including retained person ownership.
from unicorn.x86_const import UC_X86_REG_EAX
fields.update({'counter':(0x2e,'B'),'slowTurn':(0x7e,'B'),'motionTimer':(0x61,'h'),'motionMode':(0x66,'B'),'recoveryCounter':(0x65,'B'),'supportHeight':(0x1c,'h'),'life':(0x6e,'h'),'target':(0x72,'H'),'previousState':(0x7d,'B'),'statusFlags':(0xb2,'B'),'workTarget':(0x89,'H'),'vehicle':(0x9f,'H')})
# Reveal and path-list consumers are outside this composed movement contract.
def leaf(c,a,size,u):
 sp=c.reg_read(UC_X86_REG_ESP);c.reg_write(UC_X86_REG_EIP,read(sp,'I'));c.reg_write(UC_X86_REG_ESP,sp+4)
for a in [0x450610,0x4eadc0]:cpu.hook_add(UC_HOOK_CODE,leaf,begin=a,end=a)
landcat=next(i for i,f in enumerate(json.loads((ROOT/'app/original-rules.json').read_text())['terrainCategoryFlags']) if f&1)
heights=[300+(i%128)*2 for i in range(16384)]
flags=[i&1 for i in range(16384)]
# A narrow restricted strip exercises the obstacle recovery path.
for y in range(128):flags[y*128+8]|=4
land=b''.join(struct.pack('<IhHHBBBBBB',flags[i],h,0,0,0,0,landcat,0,0,0) for i,h in enumerate(heights))
write(0x96aa74,'I',0x96aaba);cpu.mem_write(0x96aaba,bytes([255])*8192);write(0x895da8,'I',0)
setup="""
import {createWorld,addUnit} from './app/model.ts';import {createLivePerson} from './app/live-people.ts';
const w=createWorld();w.units=[];w.buildings=[];
console.log(JSON.stringify(Array.from({length:96},(_,i)=>{const kind=['brave','warrior','shaman'][i%3],u=addUnit(w,'blue',kind,{x:0,z:0}),p=createLivePerson(w,u);w.units=[];
p.id=1;p.state=25;p.flags2=0x40200200;p.flags4=0;p.x=3000+(i%6)*240;p.y=62000+(i%4)*130;p.h=0;p.counter=i%256;p.cargo=i%2?100:0;p.statusFlags=i%7;
return {p,kind,randomState:i*101+1,center:{x:3900+(i%4)*80,y:62100+(i%3)*100},angle:i*37%2048,index:i%2,turns:16};})));
"""
cases=json.loads(subprocess.check_output(['node','--input-type=module','-e',setup],cwd=ROOT));expected=[]
for c in cases:
 cpu.mem_write(0x8a03e4,land);cpu.mem_write(p,bytes(256));cpu.mem_write(group,bytes(256));write(0x89d178,'I',c['randomState'])
 write(group+0x26,'H',c['angle']);write(group+0x3d,'2H',c['center']['x'],c['center']['y']);write(group+0x68,'B',2)
 call(0x51e3d0,out,group,c['index']);c['slot']=dict(x=read(out,'H'),y=read(out+2,'H'))
 call(0x44e940,c['p']['x'],c['p']['y']);c['p']['h']=cpu.reg_read(UC_X86_REG_EAX)&65535
 for k,(off,f) in fields.items():write(p+off,f,c['p'][k])
 write(out,'HHh',c['p']['x'],c['p']['y'],c['p']['h']);call(0x4ee470,p,out)
 trace=[]
 for turn in range(c['turns']):
  cpu.mem_write(stack,bytes(256));write(stack+0x18,'I',c['index']);cpu.reg_write(UC_X86_REG_ESP,stack);cpu.reg_write(UC_X86_REG_EDI,p);cpu.reg_write(UC_X86_REG_EBP,group)
  cpu.emu_start(0x519183,stop,count=100000);ready=cpu.reg_read(UC_X86_REG_EIP)==0x51935f
  write(p+0x2e,'B',(read(p+0x2e,'B')+1)&255)
  call(0x4d42a0,p);call(0x51fed0,p);call(0x4e9050,p);call(0x4e6d00,p)
  write(p+0xc,'I',read(p+0xc,'I')&~0x2004)
  trace.append(dict(p=snapshot(),velocity=list(struct.unpack('<3h',cpu.mem_read(p+0x49,6))),ready=ready,randomState=read(0x89d178,'I')))
 expected.append(trace)
js="""
import {createWorld,addUnit,browserPosition} from './app/model.ts';import {approachLiveMelee,stepLiveMeleeMotion} from './app/live-people.ts';
let s='';for await(const c of process.stdin)s+=c;const input=JSON.parse(s);
console.log(JSON.stringify(input.cases.map(c=>{const w=createWorld();w.units=[];w.buildings=[];w.land.heights.set(input.heights);w.land.flags.set(input.flags);w.land.categories.fill(input.landcat);w.land.buildingIds.fill(0);w.land.walkMasks[0].fill(255);w.manaWorld.gameFlags=0;w.manaWorld.levelFlags=0;w.randomState=c.randomState;
const u=addUnit(w,'blue',c.kind,browserPosition(c.p));u.id=1;u.fight={group:2,opponent:0,action:'approach',started:0,motion:c.p};
const trace=[];for(let i=0;i<c.turns;i++){const ready=approachLiveMelee(w,u,c.slot,c.center,c.index!==0);stepLiveMeleeMotion(w,u);const p=u.fight.motion;
trace.push({p:Object.fromEntries(input.fields.map(k=>[k,p[k]])),velocity:[p.velocity.x,p.velocity.y,p.velocity.z],ready,randomState:w.randomState});}
return trace;})));
"""
r=subprocess.run(['node','--input-type=module','-e',js],input=json.dumps(dict(cases=cases,heights=heights,flags=flags,landcat=landcat,fields=list(fields))),capture_output=True,text=True,cwd=ROOT);assert r.returncode==0,r.stderr
actual=json.loads(r.stdout);assert len(actual)==len(expected)
for i,(a,e) in enumerate(zip(actual,expected)):
 if a!=e:
  path=Path('/private/tmp/populous-melee-motion-failure.json');path.write_text(json.dumps(dict(case=cases[i],native=e,browser=a),indent=2));raise AssertionError((i,str(path)))
print('PASS: 96 x 16-turn composed native approach/preparation/physics trajectories match live browser adapter fields, velocity, RNG and arrival; varied classes, cargo, sloped heights and restricted cells. Reveal/path-list consumers supplied.')
