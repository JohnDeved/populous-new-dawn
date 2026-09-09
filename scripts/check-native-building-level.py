"""Compare complete task-8 leveling, including native animation/motion setters.
Only final terrain queue/notifications and sound are supplied consumers.
Usage: python SCRIPT EXE [--record]
"""
import json,random,struct,subprocess,sys
from pathlib import Path
from unicorn import UC_HOOK_CODE
from unicorn.x86_const import UC_X86_REG_ESP,UC_X86_REG_EIP,UC_X86_REG_EAX
from decomp import ROOT,native_cpu,configure_native_constants,load_native_shapes
exe=Path(sys.argv[1]);cpu,identity=native_cpu(exe);configure_native_constants(cpu,exe)
cpu.mem_map(0x2000000,0x50000);load_native_shapes(cpu,exe,0x2000000,0x2004000)
p,plan,counts,stack,stop=0x2010000,0x2011000,0x2020000,0x204d000,0x204e000
rules=json.loads((ROOT/'app/original-rules.json').read_text());shapes=json.loads((ROOT/'app/original-shapes.json').read_text());rng=random.Random(0x497030)
def write(a,f,*v):cpu.mem_write(a,struct.pack('<'+f,*v))
def read(a,f):return struct.unpack('<'+f,cpu.mem_read(a,struct.calcsize('<'+f)))[0]
frames=list(struct.iter_unpack('<HBBBBH',(exe.parent/'data/vfra-0.ani').read_bytes()));frameCounts=[]
for start,_ in struct.iter_unpack('<HH',(exe.parent/'data/vstart-0.ani').read_bytes()):
 frame=start;seen=set()
 while frame and frame not in seen:seen.add(frame);frame=frames[frame][-1]
 assert frame in [0,start];frameCounts.append(len(seen)&255)
write(0x59df44,'I',counts)
for i,n in enumerate(frameCounts):write(counts+i*6+1,'B',n)
write(0x890394,'I',plan);write(0x89c6f0,'B',0);write(0x89d17c,'I',0);write(0x89d178+0xcd8f8,'I',0)
for i in range(4):write(0x89d1c8+i*0xc65+0x93d,'I',0);write(0x89d1c8+i*0xc65+0xc1f,'B',0)
def leaf(c,a,size,u):
 sp=c.reg_read(UC_X86_REG_ESP)
 if a==0x4d4040:events.append(['animation',read(sp+8,'H')]);return
 if a==0x4ea460:events.append(['releaseMotion']);return
 if a==0x4e9dd0:
  to=read(sp+8,'I');events.append(['destination',dict(x=read(to,'H'),y=read(to+2,'H'))]);return
 if a==0x44ddf0:
  cell=read(sp+4,'H');assert read(sp+8,'H')==2 and read(sp+12,'B')==1
  events.append(['terrain',(cell>>9)*128+((cell&254)>>1)])
 elif a==0x44f2f0:assert read(sp+4,'B')==1 and read(sp+12,'H')==1 and read(sp+16,'B')==255
 elif a==0x48a050:events.append(['sound',read(sp+8,'H'),read(sp+12,'H')])
 c.reg_write(UC_X86_REG_EAX,0);c.reg_write(UC_X86_REG_EIP,read(sp,'I'));c.reg_write(UC_X86_REG_ESP,sp+4)
for a in [0x4d4040,0x4ea460,0x4e9dd0,0x44ddf0,0x44df40,0x44f2f0,0x48a050]:cpu.hook_add(UC_HOOK_CODE,leaf,begin=a,end=a)
fields={'model':(0x2b,'B'),'state':(0x2c,'B'),'physics':(0x30,'B'),'counter':(0x2e,'B'),'tribe':(0x2f,'B'),
 'x':(0x3d,'H'),'y':(0x3f,'H'),'h':(0x41,'h'),'flags2':(0xc,'I'),'flags3':(0x14,'I'),'flags4':(0x10,'I'),
 'assignment':(0x76,'H'),'speed':(0x5f,'h'),'timer':(0x70,'h'),'cargo':(0x78,'H'),
 'angle':(0x26,'H'),'heading':(0x5d,'H'),'turnAngle':(0x57,'H'),'turnY':(0x59,'H'),
 'goalX':(0x4f,'H'),'goalY':(0x51,'H'),'destinationX':(0x53,'H'),'destinationY':(0x55,'H'),
 'object':(0x33,'H'),'renderFlags':(0x35,'H'),'f1':(0x37,'h'),'f2':(0x39,'B'),'draw':(0x3a,'B'),'morph':(0x3b,'B'),'palette':(0x3c,'B'),'vehicle':(0x9f,'H')}
cases=[];expected=[]
for model in [1,4,5,7,13,14]:
 for phase in [0,4,7,8,9,21,28,255]:
  for trial in range(64):
   quadrant=trial%4;obj=rules['buildingObjects'][model];shape=shapes['shapes'][shapes['objects'][obj][quadrant]]
   pose=dict(object=obj,angle=quadrant*512,anchorX=rng.choice([0,512,32768,65024]),anchorY=rng.choice([0,512,32768,65024]))
   cx=(pose['anchorX']//256-shape['x'])&255;cy=(pose['anchorY']//256-shape['y'])&255
   vertices=[]
   for y in range(shape['height']):
    for x in range(shape['width']):
     mask=shapes['cells'][shape['offset']+y*shape['width']+x]
     if mask&2:vertices.append(dict(index=(((cy+y*2)&255)//2)*128+(((cx+x*2)&255)//2),mask=mask))
   chosen=trial%len(vertices);vertex=vertices[chosen];gx=(vertex['index']&127)*512;gy=(vertex['index']>>7)*512
   x=(gx+rng.choice([0,1,31,32,33,32767,65535]))&65535;y=gy
   person=dict(model=rng.choice([2,3,7]),state=10,physics=rng.randrange(20),counter=rng.choice([0,1,2,31,32,255]),tribe=0,
    x=x,y=y,h=rng.choice([-32768,64,32767]),flags2=rng.choice([0,128,0x8000,0x200200,0x80000]),flags3=0,flags4=rng.choice([0,0x400,0x1800]),
    assignment=rng.choice([0,16,128,144]),speed=32,timer=rng.choice([-32768,-1,0,1,2,3,6,8]),cargo=rng.choice([0,100]),
    angle=rng.randrange(2048),heading=rng.randrange(2048),turnAngle=0,turnY=0,goalX=gx,goalY=gy,destinationX=0,destinationY=0,
    object=0,renderFlags=256,f1=rng.choice([-1,0,3]),f2=rng.choice([0,1,7]),draw=14,morph=0,palette=0,vehicle=0)
   task=dict(task=8,busy=chosen,phase=phase,restart=bool(rng.randrange(4)==0))
   state=dict(model=model,height=64,alternateHeight=128,revalidate=bool(rng.randrange(2)))
   values=[rng.choice([0,63,64,65,66,88,104,128,32767,-32768]) for _ in vertices]
   cpu.mem_write(0x8a03e4,bytes(16384*16));cpu.mem_write(p,bytes(256));cpu.mem_write(plan,bytes(256))
   for name,(offset,fmt) in fields.items():write(p+offset,fmt,person[name])
   for v,h in zip(vertices,values):write(0x8a03e4+v['index']*16+4,'h',h)
   write(p+0xc,'I',person['flags2']|(0x40000000 if task['restart'] else 0));write(p+0xa8,'B',phase);write(p+0xaa,'B',chosen);write(p+0x89,'H',1)
   write(plan+0x68,'H',cx|(cy<<8));write(plan+0x9b,'B',shapes['objects'][obj][quadrant]);write(plan+0x9e,'B',model)
   write(plan+0x41,'h',64);write(plan+0x98,'h',128);write(plan+0xc,'I',4 if state['revalidate'] else 0)
   seed=rng.getrandbits(32);write(0x89d178,'I',seed);events=[]
   write(stack,'II',stop,p);cpu.reg_write(UC_X86_REG_ESP,stack);cpu.emu_start(0x497030,stop,count=100000)
   assert cpu.reg_read(UC_X86_REG_EIP)==stop,hex(cpu.reg_read(UC_X86_REG_EIP))
   result={name:read(p+offset,fmt) for name,(offset,fmt) in fields.items()};restart=bool(result['flags2']&0x40000000);result['flags2']&=~0x40000000
   cases.append(dict(person=person,task=task,plan=state,pose=pose,vertices=vertices,heights=values,seed=seed))
   expected.append(dict(person=result,task=dict(task=8,busy=read(p+0xaa,'B'),phase=read(p+0xa8,'B'),restart=restart),plan={**state,'revalidate':bool(read(plan+0xc,'I')&4)},heights=[read(0x8a03e4+v['index']*16+4,'h') for v in vertices],randomState=read(0x89d178,'I'),events=events,result=cpu.reg_read(UC_X86_REG_EAX)&255))
js="""import {stepBuildingLevel} from './app/building-preparation.ts';import {setPersonAnimation} from './app/animation.ts';import sprites from './app/original-units.json' with {type:'json'};import {createMotionRoutes,setDirectPersonDestination} from './app/person-routes.ts';
let s='';for await(const c of process.stdin)s+=c;console.log(JSON.stringify(JSON.parse(s).map(c=>{
 const p={...c.person,motionGroup:0,motionIndex:0},task={...c.task},plan={...c.plan},rng={randomState:c.seed},events=[];
 const land={heights:new Int16Array(16384),flags:new Uint32Array(16384)};c.vertices.forEach((v,i)=>{land.heights[v.index]=c.heights[i]});
 const result=stepBuildingLevel(rng,p,task,plan,land,()=>c.vertices,{
 animation:(_,id)=>{events.push(['animation',id]);setPersonAnimation(p,id,{playerTribe:0,gameFlags:0,sessionSubstate:null,tribes:Array.from({length:4},()=>({flags:0,playerType:0})),objects:new Map()},sprites)},
 destination:to=>{events.push(['destination',to]);setDirectPersonDestination(createMotionRoutes(),p,to)},releaseMotion:()=>events.push(['releaseMotion']),terrainChanged:i=>events.push(['terrain',i]),sound:(cue,flags)=>events.push(['sound',cue,flags])})??0;
 delete p.motionGroup;delete p.motionIndex;return {person:p,task,plan,heights:c.vertices.map(v=>land.heights[v.index]),randomState:rng.randomState,events,result};
})));"""
r=subprocess.run(['node','--input-type=module','-e',js],input=json.dumps(cases),capture_output=True,text=True,cwd=ROOT);assert r.returncode==0,r.stderr
actual=json.loads(r.stdout);assert len(actual)==len(expected)
for i,(a,e) in enumerate(zip(actual,expected)):
 if a!=e:
  Path('/private/tmp/populous-level-mismatch.json').write_text(json.dumps(dict(case=cases[i],actual=a,expected=e),indent=2));raise AssertionError((i,'/private/tmp/populous-level-mismatch.json'))
if '--record' in sys.argv:
 indexes=range(0,len(cases),5)
 (ROOT/'tests/fixtures/building-level.json').write_text(json.dumps(dict(executableSha256=identity['sha256'],cases=[cases[i] for i in indexes],expected=[expected[i] for i in indexes]),separators=(',',':'))+'\n')
print('PASS:',len(cases),'complete native leveling controllers: grade selection, motion, animation, timers, height changes and terrain notifications')
