"""Compare the complete 0x404c80 hut birth controller with the supplied EXE.
Allocation storage, population admission/cost and audio are supplied. Native
clock/flags, sockets, movement, neighbor lookup and cell snapping execute.
Wild-person notification and class-9 plans are outside the current integration.
Usage: python scripts/check-native-hut-birth.py EXE
"""
import json,random,struct,subprocess,sys
from pathlib import Path
from unicorn import UC_HOOK_CODE
from unicorn.x86_const import UC_X86_REG_ESP,UC_X86_REG_EIP,UC_X86_REG_EAX
from decomp import native_cpu,load_native_shapes,ROOT
cpu,identity=native_cpu(Path(sys.argv[1]));cpu.mem_map(0x2000000,0x40000)
load_native_shapes(cpu,Path(sys.argv[1]),0x2000000,0x2004000)
building,person,flash,neighbor,record=0x2010000,0x2011000,0x2012000,0x2013000,0x2014000
stack,stop=0x203d000,0x203e000
rng=random.Random(0x404c80)
def write(a,f,*v):cpu.mem_write(a,struct.pack('<'+f,*v))
def read(a,f):return struct.unpack('<'+f,cpu.mem_read(a,struct.calcsize('<'+f)))[0]
def point(a):return dict(zip(['x','y'],struct.unpack('<HH',cpu.mem_read(a,4))))
def call(a,*args):
 write(stack,'I'*(len(args)+1),stop,*args);cpu.reg_write(UC_X86_REG_ESP,stack)
 cpu.emu_start(a,stop,count=100000);assert cpu.reg_read(UC_X86_REG_EIP)==stop,hex(cpu.reg_read(UC_X86_REG_EIP))
def pose(a,p):
 write(a+0x33,'h',p['object']);write(a+0x26,'H',p['angle']);write(a+0x7a,'HH',p['anchorX'],p['anchorY'])
def hook(c,a,size,user):
 sp=c.reg_read(UC_X86_REG_ESP);value=0
 if a==0x41b240:value=int(case['allowed'])
 elif a==0x41b3f0:value=case['cost']
 elif a==0x48a050:cues.append(read(sp+8,'I'))
 elif a==0x4ed8a0:
  kind,model,tribe,location=struct.unpack('<4I',c.mem_read(sp+4,16));assert tribe&255==case['tribe']
  assert (kind,model) in [(1,2),(7,60)]
  allocations.append(point(location));value=person if kind==1 else flash
 elif a==0x405050:
  # Set the neighbor's cell at the native-computed next position; lookup runs.
  p=point(read(sp+4,'I'));cell=(p['y']>>9)*128+(p['x']>>9)
  if case['neighbor']:
   write(0x8a03e4+cell*16,'I',512);write(0x8a03e4+cell*16+8,'H',1)
   occupied.append(cell)
  return
 c.reg_write(UC_X86_REG_EAX,value);c.reg_write(UC_X86_REG_EIP,read(sp,'I'));c.reg_write(UC_X86_REG_ESP,sp+4)
for a in [0x41b240,0x41b3f0,0x48a050,0x4ed8a0,0x405050,0x493770,0x40afd0,0x403a00]:cpu.hook_add(UC_HOOK_CODE,hook,begin=a,end=a)
write(0x890334,'I',0);write(0x890390+4,'I',neighbor);write(0x89c6f0,'B',0)
cases=[];expected=[];occupied=[]
for index in range(2304):
 for cell in occupied:write(0x8a03e4+cell*16,'I',0)
 occupied=[]
 obj=107+index%36;cost=rng.randrange(1,2001)
 case=dict(pose=dict(object=obj,angle=(index//36%4)*512,anchorX=rng.choice([0,65024,rng.randrange(128)*512]),anchorY=rng.randrange(128)*512),
  counter=rng.randrange(256),timer=rng.choice([0,cost-2,cost-8,32767,-32768,rng.randrange(-32768,32768)]),
  occupants=rng.choice([0,1,2,3,6,127,128,255]),allowed=bool(rng.randrange(2)),cost=cost,
  birthPending=bool(rng.randrange(2)),tribe=index%4,
  neighbor=dict(object=119,angle=rng.randrange(4)*512,anchorX=rng.randrange(128)*512,anchorY=rng.randrange(128)*512) if index%2 else None)
 for p in [building,person,flash,neighbor]:cpu.mem_write(p,bytes(256))
 pose(building,case['pose']);write(building+0x2a,'BB',2,(obj-107)%3+1);write(building+0x2e,'BB',case['counter'],case['tribe'])
 write(building+0x9c,'H',0x4000 if case['birthPending'] else 0);write(building+0xa4,'hB',case['timer'],case['occupants'])
 write(0x892443,'I',record)
 if case['neighbor']:pose(neighbor,case['neighbor'])
 allocations=[];cues=[];call(0x404c80,building)
 born=bool(allocations)
 assert not born or len(allocations)==2
 expected.append(dict(timer=read(building+0xa4,'h'),birthPending=bool(read(building+0x9c,'H')&0x4000),born=born,
  points=dict(inside=allocations[0],flash=allocations[1],destination=point(person+0x68)) if born else None,cues=cues))
 if born:assert read(flash+0x6c,'h')==16 and read(flash+0x33,'H')==1441 and read(flash+0x3a,'B')==41
 cases.append(case)
 call(0x4049d0,building)
 assert read(building+0xa4,'h') == ((cost-54+32768)%65536)-32768
js="""import {stepHutBirth,hutBirthPoints} from './app/hut-birth.ts';let s='';for await(const c of process.stdin)s+=c;
console.log(JSON.stringify(JSON.parse(s).map(c=>{const b={counter:c.counter,timer:c.timer,birthPending:c.birthPending};const born=stepHutBirth(b,c.occupants,c.allowed,c.cost);return {timer:b.timer,birthPending:b.birthPending,born,points:born?hutBirthPoints(c.pose,()=>c.neighbor):null,cues:born&&c.tribe===0?[40]:[]}})));"""
r=subprocess.run(['node','--input-type=module','-e',js],input=json.dumps(cases),capture_output=True,text=True,cwd=ROOT);assert r.returncode==0,r.stderr
actual=json.loads(r.stdout);assert len(actual)==len(expected)
for i,(a,e) in enumerate(zip(actual,expected)):assert a==e,(i,cases[i],a,e)
print(f'PASS: {len(cases)} complete native hut birth calls; {sum(e["born"] for e in expected)} allocations with sockets, flash, owner cue and redirected/snapped exit; signed clocks/occupants, phase/admission and pending gates; 2304 completion-clock initializations')
if '--record' in sys.argv:
 path=ROOT/'tests/fixtures/hut-birth.json';path.write_text(json.dumps(dict(executableSha256=identity['sha256'],cases=cases[:288],expected=expected[:288]),separators=(',',':'))+'\n');print(path)

# Effect 60's initializer, the birth override, all animation frames and deletion.
# Final class-list registration/removal is supplied; terrain/state/animation run.
freed=False
def visual_hook(c,a,size,user):
 global freed
 sp=c.reg_read(UC_X86_REG_ESP)
 if a==0x4ef180:freed=True
 c.reg_write(UC_X86_REG_EIP,read(sp,'I'));c.reg_write(UC_X86_REG_ESP,sp+4)
for a in [0x50bcd0,0x4ed6f0,0x4ed640,0x4ef180]:cpu.hook_add(UC_HOOK_CODE,visual_hook,begin=a,end=a)
land=dict(heights=[rng.randrange(1025) for _ in range(16384)],flags=[rng.randrange(2) for _ in range(16384)])
for i,(h,flags) in enumerate(zip(land['heights'],land['flags'])):write(0x8a03e4+i*16,'Ih',flags,h)
fields={'object':(0x33,'H'),'renderFlags':(0x35,'H'),'f1':(0x37,'h'),'f2':(0x39,'B'),'draw':(0x3a,'B'),'morph':(0x3b,'B'),'palette':(0x3c,'B')}
visual_cases=[];visual_expected=[]
for _ in range(128):
 p=dict(x=rng.randrange(65536),y=rng.randrange(65536))
 cpu.mem_write(flash,bytes(256));write(flash+0x2a,'BB',7,60);write(flash+0x3d,'HHh',p['x'],p['y'],0)
 call(0x509c10,flash);assert read(flash+0x2c,'B')==47
 write(flash+0x6c,'h',16);call(0x4ee700,flash+0x33,41,1441)
 frames=[{k:read(flash+o,f) for k,(o,f) in fields.items()}]
 for _ in range(20):
  call(0x4ee7b0,flash);frames.append({k:read(flash+o,f) for k,(o,f) in fields.items()})
 freed=False;lifetime=0
 while not freed:
  call(0x50a750,flash);lifetime+=1;assert lifetime<=16
 visual_cases.append(p);visual_expected.append(dict(height=read(flash+0x41,'h'),turns=lifetime,frames=frames))
js="""import {createWorld,effect,browserPosition} from './app/model.ts';import {animateLiveObjects} from './app/live-people.ts';
let s='';for await(const c of process.stdin)s+=c;const {land,cases}=JSON.parse(s),w=createWorld();w.units=[];Object.assign(w.land,land);w.land.landFlags=0;
console.log(JSON.stringify(cases.map(p=>{w.effects=[];const f=effect(w,'birth',browserPosition(p));const snapshot=()=>Object.fromEntries(['object','renderFlags','f1','f2','draw','morph','palette'].map(k=>[k,f.animation[k]]));const frames=[snapshot()];for(let i=0;i<20;i++){animateLiveObjects(w);frames.push(snapshot())}return {height:Math.round(f.height*45),turns:f.turnsRemaining,frames}})));"""
r=subprocess.run(['node','--input-type=module','-e',js],input=json.dumps(dict(land=land,cases=visual_cases)),capture_output=True,text=True,cwd=ROOT);assert r.returncode==0,r.stderr
actual=json.loads(r.stdout);assert actual==visual_expected,next((i,a,e) for i,(a,e) in enumerate(zip(actual,visual_expected)) if a!=e)
print('PASS: 128 native birth-flash initializations/heights, 2688 animation records and 16-turn deletion')
