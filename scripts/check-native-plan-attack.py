"""Compare plan entrances, whole approach helper and command-19 plan attack phases.
Original geometry/collision/walk masks, facing, recovery, animation and RNG execute.
Route destination and plan destruction consumers are supplied. Loader I/O setup
hooks are removed before comparisons. Usage: python SCRIPT EXE [--record]
"""
import copy,hashlib,json,random,struct,subprocess,sys
from pathlib import Path
from unicorn import UC_HOOK_CODE
from unicorn.x86_const import UC_X86_REG_ESP,UC_X86_REG_EIP,UC_X86_REG_EAX
from capstone import Cs,CS_ARCH_X86,CS_MODE_32
from decomp import native_cpu,configure_native_constants,ROOT
exe=Path(sys.argv[1]);cpu,identity=native_cpu(exe);configure_native_constants(cpu,exe)
cpu.mem_map(0x2000000,0x40000)
raw_objects,raw_shapes,base,order,out,stack,stop=0x2000000,0x2003000,0x2010000,0x2020000,0x2020100,0x203e000,0x203f000
rng=random.Random(0x51c110)
def write(a,f,*v):cpu.mem_write(a,struct.pack('<'+f,*v))
def read(a,f):return struct.unpack('<'+f,cpu.mem_read(a,struct.calcsize('<'+f)))[0]
def ptr(i):return base+i*256

def call(a,*args):
 write(stack,'I'*(len(args)+1),stop,*args);cpu.reg_write(UC_X86_REG_ESP,stack)
 cpu.emu_start(a,stop,count=10000000);assert cpu.reg_read(UC_X86_REG_EIP)==stop,hex(cpu.reg_read(UC_X86_REG_EIP))
 return cpu.reg_read(UC_X86_REG_EAX)&255
objects=(exe.parent/'objects/objs0-2.dat').read_bytes();shapes=(exe.parent/'objects/shapes.dat').read_bytes();search=(exe.parent/'data/mwsearch.dat').read_bytes()
assert hashlib.sha256(search).hexdigest()=='0c39b12d160658863c2df89aa34484dff459e48ea0b5634658b7473ca940fae0'
cpu.mem_write(raw_objects,objects);cpu.mem_write(raw_shapes,shapes);cpu.mem_write(0x8929cd,search)
write(0x895ec1,'I',raw_objects);write(0x59df3c,'I',raw_shapes)
leaves=[]
for ins in Cs(CS_ARCH_X86,CS_MODE_32).disasm(bytes(cpu.mem_read(0x40c880,144)),0x40c880):
 if ins.mnemonic=='ret':break
 if ins.mnemonic=='call':leaves.append(int(ins.op_str,16))
assert len(leaves)==2

def loader(c,a,size,user):
 sp=c.reg_read(UC_X86_REG_ESP);c.reg_write(UC_X86_REG_EAX,1);c.reg_write(UC_X86_REG_EIP,read(sp,'I'));c.reg_write(UC_X86_REG_ESP,sp+4)
hooks=[cpu.hook_add(UC_HOOK_CODE,loader,begin=a,end=a) for a in leaves];call(0x40c880)
for h in hooks:cpu.hook_del(h)
shape_data=json.loads((ROOT/'app/original-shapes.json').read_text());poses=[(i,j*512) for i,row in enumerate(shape_data['objects']) for j in range(len(row))]
starts=list(struct.iter_unpack('<HH',(exe.parent/'data/vstart-0.ani').read_bytes()))
frames=list(struct.iter_unpack('<HBBBBH',(exe.parent/'data/vfra-0.ani').read_bytes()))
counts=0x2021000
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
rules=json.loads((ROOT/'app/original-rules.json').read_text())
p=ptr(1);plan=ptr(2)
planfields={'id':(0x24,'H'),'class':(0x2a,'B'),'tribe':(0x2f,'b'),'flags2':(0xc,'I'),'related':(0x92,'h'),'cell':(0x68,'H'),'shape':(0x9b,'B'),'planKind':(0x9e,'B')}
def record(a,fs):return {k:read(a+off,f) for k,(off,f) in fs.items()}
def log(name,*args):events.append([name,*args,record(p,fields),read(0x89d178,'I')])
def effect(c,a,size,user):
 sp=c.reg_read(UC_X86_REG_ESP);first=read(sp+4,'I')
 if a in [0x4ba130,0x4b9fc0]:log('inside' if a==0x4ba130 else 'outside',read(first+0x24,'H'));return
 if a==0x4d4040:log('animation',read(sp+8,'H'));return
 if a in [0x4e9d80,0x4e9dd0]:
  to=read(sp+8,'I');point=dict(x=read(to,'H'),y=read(to+2,'H'));log('planned' if a==0x4e9d80 else 'direct',point);write(p+0x4f,'HH',point['x'],point['y'])
 elif a==0x4b9190:log('destroy',first&65535,*[read(sp+4+i*4,'I') for i in range(1,5)])
 else:raise AssertionError(hex(a))
 c.reg_write(UC_X86_REG_EIP,read(sp,'I'));c.reg_write(UC_X86_REG_ESP,sp+4)
for a in [0x4ba130,0x4b9fc0,0x4d4040,0x4e9d80,0x4e9dd0,0x4b9190]:cpu.hook_add(UC_HOOK_CODE,effect,begin=a,end=a)
write(0x96aa74,'I',0x96aaba)
cases=[];expected=[]
for n in range(8320):
 mode=['inside','outside','approach','attack'][n//2048] if n<8192 else 'sequence'
 model=2+n%6;obj,draw=rules['animationObjects'][rules['personAnimationObjects'][model]]
 pp={k:0 for k in fields};pp.update(id=1,**{'class':1},model=model,state=10,substate=4+(n&1),counter=n&255,tribe=0,
  physics=rules['personModels'][model]['physics'],flags2=rng.choice([0,128,0x8000,0x40000000,0x40008080,0x80000]),flags3=rng.choice([0,0x80000]),
  flags4=rng.choice([0,1,2,4,0x400,0x800,0x10007]),assignment=rng.choice([0,16,512,528]),speed=rng.randrange(100),cargo=rng.choice([0,100]),
  angle=rng.randrange(2048),heading=rng.randrange(2048),timer=rng.choice([-32768,-1,0,1,2,16,18,64,32767]),target=2,workTarget=2,
  animationMode=rng.randrange(54),object=obj,draw=draw,f1=rng.randrange(5),f2=rng.randrange(3),renderFlags=rng.choice([0,2,16,18]))
 pl=dict(id=2,**{'class':rng.choice([9,9,9,2])},tribe=rng.choice([1,1,1,0]),flags2=0,related=rng.choice([0,0,0,3,-1]),cell=rng.choice([0,1,32767,32768,65535,rng.randrange(65536)]),shape=rng.randrange(61),planKind=10 if n%3 else 0)
 if pl['planKind']!=10:pl['shape']=rng.randrange(64)
 x=(pl['cell']&254)<<8;y=pl['cell']&0xfe00
 shape=shape_data['shapes'][pl['shape']]
 inside=dict(x=(x+shape['inside'][0]*64)&65535,y=(y+shape['inside'][1]*64)&65535)
 outside=dict(x=(x+shape['outside'][0]*64)&65535,y=(y+shape['outside'][1]*64)&65535)
 origin=inside if n&4 else outside
 pp.update(x=(origin['x']+rng.choice([0,111,112,311,312,1000]))&65535,y=(origin['y']+rng.choice([0,111,112]))&65535,goalX=inside['x'],goalY=inside['y'])
 if mode=='sequence':
  pp.update(x=inside['x'],y=inside['y'],substate=4,counter=0,flags2=pp['flags2']|0x40000000);pl.update({'class':9,'related':0,'tribe':1})
 land=bytearray(16384*16);patches=[]
 def patch(q,flag,cat,building):
  index=(q['y']>>9)*128+(q['x']>>9);struct.pack_into('<IhHHBBBBBB',land,index*16,flag,100,0,building,0,0,cat,0,0,0);patches.append([index,flag,cat,building])
 for j in range(4 if pl['planKind']==10 else 1):
  s=shape_data['shapes'][pl['shape']+j];q=dict(x=(x+s['outside'][0]*64)&65535,y=(y+s['outside'][1]*64)&65535)
  patch(q,rng.choice([0,0,4,512]),rng.choice([0,0,1]),rng.choice([0,0,0xfc02]))
 patch(pp,0,0,rng.choice([0,2,2,2|0xfc00]))
 if mode=='sequence':patch(pp,0,0,2)
 mask=rng.choice([0,255,255]);case=dict(mode=mode,p=pp,plan=pl,patches=patches,mask=mask,randomState=rng.getrandbits(32),alert=n%3)
 cpu.mem_write(0x8a03e4,bytes(land));cpu.mem_write(0x96aaba,bytes([mask])*8192)
 for a,fs,values in [(p,fields,pp),(plan,planfields,pl)]:
  cpu.mem_write(a,bytes(256))
  for k,(off,f) in fs.items():write(a+off,f,values[k])
 write(0x890394,'II',p,plan);write(order,'BBHHHH',19,0,1,0,0,0)
 write(0x89d178,'I',case['randomState']);write(0x89d167,'B',case['alert']);write(0x89c6f0,'B',0);write(0x89d17c,'I',0);events=[]
 if mode in ['inside','outside']:
  call(0x4ba130 if mode=='inside' else 0x4b9fc0,plan,out);result=dict(x=read(out,'H'),y=read(out+2,'H'))
 elif mode=='approach':result=bool(call(0x438db0,p))
 elif mode=='attack':result=call(0x51a2a0,p,order)
 else:
  result=[]
  for turn in range(19):
   value=call(0x51a2a0,p,order);result.append(dict(p=record(p,fields),randomState=read(0x89d178,'I'),value=value))
   if turn<18:write(p+0x2e,'B',(read(p+0x2e,'B')+1)&255)
  assert read(p+0x2d,'B')==0
  assert sum(e[0]=='destroy' for e in events)==int(not pp['flags4']&0x800)
 cases.append(case);expected.append(dict(p=record(p,fields),plan=record(plan,planfields),events=copy.deepcopy(events),randomState=read(0x89d178,'I'),alert=read(0x89d167,'B'),result=result))
assert {c['plan']['shape'] for c in cases if c['mode'] in ['inside','outside'] and c['plan']['planKind']!=10}==set(range(64))
js="""
import {buildingPlanInsidePoint,buildingPlanOutsidePoint} from './app/building-shapes.ts';import {approachCombatPlan} from './app/combat-pursuit.ts';import {attackCombatPlan} from './app/combat-approach.ts';import {setPersonAnimation} from './app/animation.ts';import sprites from './app/original-units.json' with {type:'json'};
let text='';for await(const c of process.stdin)text+=c;
console.log(JSON.stringify(JSON.parse(text).map(c=>{
 const p=c.p,plan=c.plan,w={randomState:c.randomState},events=[];let alert=c.alert;
 const log=(name,...args)=>events.push([name,...args,structuredClone(p),w.randomState]);
 const cells=new Map(c.patches.map(([i,flags,category,building])=>[i,{flags,category,building}]));
 const world={cell:q=>cells.get((q.y>>9)*128+(q.x>>9))??{flags:0,category:0,building:0},walkMask:new Uint8Array(8192).fill(c.mask)};
 const e={animation:(p,object)=>{log('animation',object);setPersonAnimation(p,object,{playerTribe:0,gameFlags:0,sessionSubstate:null,tribes:Array.from({length:4},()=>({flags:0,playerType:0})),objects:new Map()},sprites)},
 inside:()=>{log('inside',plan.id);return buildingPlanInsidePoint(plan);},outside:()=>{log('outside',plan.id);return buildingPlanOutsidePoint(plan,world);},
 destination:to=>{log('planned',to);p.goalX=to.x;p.goalY=to.y;},directDestination:to=>{log('direct',to);p.goalX=to.x;p.goalY=to.y;}};
 let result;
 if(c.mode==='inside')result=e.inside();else if(c.mode==='outside')result=e.outside();else if(c.mode==='approach')result=approachCombatPlan(w,p,e);
 else {
  const visit=()=>{
  if(p.tribe===0&&!alert)alert=1;p.flags2=(p.flags2|0x2000000)>>>0;if(p.flags2&0x40000000){p.flags4=(p.flags4&~0x10007)>>>0;p.assignment&=~512;}
  const decision=attackCombatPlan(p,plan,{animation:e.animation,approach:()=>approachCombatPlan(w,p,e),buildingAt:q=>world.cell(q).building,destroy:cell=>log('destroy',cell,0,0,0,3)});
  if(decision==='restart'){p.substate=0;p.flags2=(p.flags2|0x40000000)>>>0;}
  return 0;
  };
  if(c.mode==='attack')result=visit();
  else {result=[];for(let turn=0;turn<19;turn++){const value=visit();result.push({p:structuredClone(p),randomState:w.randomState,value});if(turn<18)p.counter=(p.counter+1)&255;}}
 }
 return {p,plan,events,randomState:w.randomState,alert,result};})));
"""
r=subprocess.run(['node','--input-type=module','-e',js],input=json.dumps(cases),capture_output=True,text=True,cwd=ROOT);assert r.returncode==0,r.stderr
actual=json.loads(r.stdout);assert len(actual)==len(expected)
for i,(a,b) in enumerate(zip(actual,expected)):
 if a!=b:
  path=Path('/private/tmp/populous-plan-attack-failure.json');path.write_text(json.dumps(dict(case=cases[i],native=b,browser=a),indent=2));raise AssertionError((i,str(path)))
print('PASS: 8192 native plan inside/outside/approach/attack calls plus 128 complete 19-visit attack sequences (10624 calls); real geometry, collision, walk mask, animation and RNG; destination and destruction consumers supplied')
if '--record' in sys.argv:
 captures=sorted(set(range(0,len(cases),23))|{8192,next(i for i in range(8192,len(cases)) if cases[i]['p']['flags4']&0x800)})
 (ROOT/'tests/fixtures/plan-attack.json').write_text(json.dumps(dict(identity=identity,cases=[dict(input=cases[i],expected=expected[i]) for i in captures]),separators=(',',':'))+'\n')
