"""Compare original marching formation geometry and complete controller.
Native RNGs, recovery, row selection, distance/angle, movement and steering run.
Upper animation setter and object removal are supplied. Run with EXE [--record].
"""
import copy,json,random,struct,subprocess,sys
from pathlib import Path
from unicorn import UC_HOOK_CODE
from unicorn.x86_const import UC_X86_REG_ESP,UC_X86_REG_EIP,UC_X86_REG_EAX
from decomp import native_cpu,configure_native_constants
root=Path(__file__).resolve().parents[1];exe=Path(sys.argv[1]);cpu,identity=native_cpu(exe);configure_native_constants(cpu,exe)
cpu.mem_map(0x2000000,0x20000)
base,group,stack,stop=0x2000000,0x2002000,0x201e000,0x201f000
rng=random.Random(0x501000)
fields={'id':(0x24,'H'),'class':(0x2a,'B'),'model':(0x2b,'B'),'state':(0x2c,'B'),'tribe':(0x2f,'b'),'physics':(0x30,'B'),'counter':(0x2e,'B'),'x':(0x3d,'H'),'y':(0x3f,'H'),'heading':(0x5d,'H'),'destinationX':(0x53,'H'),'destinationY':(0x55,'H'),'flags2':(0xc,'I'),'flags3':(0x14,'I'),'flags4':(0x10,'I'),'speed':(0x5f,'h'),'assignment':(0x76,'H'),'formationDelay':(0xab,'B'),'recoveryCounter':(0x65,'B'),'cargo':(0x78,'h'),'f1':(0x37,'h'),'f2':(0x39,'B'),'draw':(0x3a,'B'),'turnAngle':(0x57,'H'),'turnY':(0x59,'H'),'object':(0x33,'H'),'commandCursor':(0xa6,'B')}
gfields={'id':(0x24,'H'),'class':(0x2a,'B'),'model':(0x2d,'B'),'x':(0x3d,'H'),'y':(0x3f,'H'),'heading':(0x5d,'H'),'destinationX':(0x57,'H'),'destinationY':(0x59,'H'),'shape':(0x3b,'B'),'speed':(0x5f,'h'),'timer':(0x61,'h'),'shapeTimer':(0x66,'B'),'count':(0x68,'B'),'freeSlot':(0x69,'B')}
def write(a,f,*v):cpu.mem_write(a,struct.pack('<'+f,*v))
def read(a,f):return struct.unpack('<'+f,cpu.mem_read(a,struct.calcsize('<'+f)))[0]
def ptr(i):return base+i*256
def call(a,*args):
 write(stack,'I'*(len(args)+1),stop,*args);cpu.reg_write(UC_X86_REG_ESP,stack);cpu.emu_start(a,stop,count=300000);assert cpu.reg_read(UC_X86_REG_EIP)==stop,hex(cpu.reg_read(UC_X86_REG_EIP));return cpu.reg_read(UC_X86_REG_EAX)
def person(a):return {**{k:read(a+off,f) for k,(off,f) in fields.items()},'commands':list(struct.unpack('<8H',cpu.mem_read(a+0x8b,16)))}
def formation():return {**{k:read(group+off,f) for k,(off,f) in gfields.items()},'members':list(struct.unpack('<12H',cpu.mem_read(group+0x6a,24))),'offsets':[dict(x=read(group+0x82+i*2,'b'),y=read(group+0x83+i*2,'b')) for i in range(12)]}
def snapshot():return dict(g=formation(),people=[person(ptr(i)) for i in range(1,13)],randomState=read(0x89d178,'I'),poseRandom=read(0x89bc72,'I'),events=copy.deepcopy(events))
def leaf(c,a,size,u):
 sp=c.reg_read(UC_X86_REG_ESP);p=read(sp+4,'I')
 if a==0x4ed8a0:
  source=read(sp+16,'I')
  assert [read(sp+4,'B'),read(sp+8,'B')]==[10,1]
  events.append(['allocate',{'x':read(source,'H'),'y':read(source+2,'H')},read(sp+12,'b')])
  result=0
  if not case['allocationFail']:
   cpu.mem_write(group,bytes(256));write(group+0x24,'H',100);write(group+0x2a,'BB',10,1);write(group+0x3d,'HH',read(source,'H'),read(source+2,'H'));result=group
  c.reg_write(UC_X86_REG_EAX,result);c.reg_write(UC_X86_REG_EIP,read(sp,'I'));c.reg_write(UC_X86_REG_ESP,sp+4);return
 if a==0x4e9e50:
  to=read(sp+8,'I');events.append(['destination',read(p+0x24,'H'),{'x':read(to,'H'),'y':read(to+2,'H')}]);return
 if a==0x4d4040:
  obj=read(sp+8,'H');events.append(['animation',read(p+0x24,'H'),obj]);write(p+0x33,'H',obj);write(p+0x3a,'B',12);write(p+0x37,'h',2);write(p+0x39,'B',3)
 else:events.append(['remove'])
 c.reg_write(UC_X86_REG_EIP,read(sp,'I'));c.reg_write(UC_X86_REG_ESP,sp+4)
for a in [0x4d4040,0x4edcf0,0x4e9e50,0x4ed8a0]:cpu.hook_add(UC_HOOK_CODE,leaf,begin=a,end=a)
def setup(c):
 cpu.mem_write(group,bytes(256));write(group+0x2b,'B',1)
 for k,(off,f) in gfields.items():write(group+off,f,c['g'][k])
 write(group+0x6a,'12H',*c['g']['members'])
 for i,to in enumerate(c['g']['offsets']):write(group+0x82+i*2,'bb',to['x'],to['y'])
 for p in c['people']:
  a=ptr(p['id']);cpu.mem_write(a,bytes(256));write(0x890390+p['id']*4,'I',a)
  for k,(off,f) in fields.items():write(a+off,f,p[k])
  write(a+0x8b,'8H',*p['commands'])
 write(0x89d178,'I',c['randomState']);write(0x89bc72,'I',c['poseRandom'])
js="""import {updateMarchingOffsets,stepMarchingFormation} from './app/marching-formations.ts';let s='';for await(const c of process.stdin)s+=c;const input=JSON.parse(s);console.log(JSON.stringify(input.cases.map(c=>{const w={randomState:c.randomState,poseRandom:{randomState:c.poseRandom},people:new Map(c.people.map(p=>[p.id,p]))},events=[];if(input.mode==='geometry')updateMarchingOffsets(c.g);else for(let i=0;i<c.turns;i++)stepMarchingFormation(w,c.g,{remove:()=>events.push(['remove']),destination:(p,to)=>{events.push(['destination',p.id,to]);p.turnAngle=to.x;p.turnY=to.y;p.flags2=((p.flags2&~128)|4096)>>>0;},setAnimation:(p,obj)=>{events.push(['animation',p.id,obj]);p.object=obj;p.draw=12;p.f1=2;p.f2=3;}});return {g:c.g,people:c.people,randomState:w.randomState,poseRandom:w.poseRandom.randomState,events};})));"""
portable=[]
for mode in ['geometry','controller','sequence']:
 cases=[];expected=[]
 for i in range(2048 if mode!='sequence' else 128):
  g=dict(id=100,**{'class':10},model=rng.choice([2,3,7]),x=rng.randrange(65536),y=rng.randrange(65536),heading=rng.randrange(2048),destinationX=rng.randrange(65536),destinationY=rng.randrange(65536),shape=i%2,speed=rng.choice([0,70,74,105,32767,-32768]),timer=rng.choice([-32768,-1,0,1,2,39,40,32767]),shapeTimer=rng.choice([0,0,0,1,2,64,255]),count=0,freeSlot=0,members=[0]*12,offsets=[dict(x=0,y=0) for _ in range(12)])
  for n in range(12):
   if rng.randrange(4):g['members'][n]=n+1
  g['count']=sum(bool(n) for n in g['members']);g['freeSlot']=next((i for i,n in enumerate(g['members']) if not n),12)
  ps=[]
  for n in range(1,13):
   p={k:0 for k in fields};p.update(id=n,**{'class':1},model=g['model'],state=10,tribe=0,physics=rng.randrange(20),counter=rng.choice([0,1,127,128,255]),x=g['x'],y=g['y'],destinationX=(g['x']+5000)&65535,destinationY=g['y'],flags2=0,flags3=rng.choice([0,0x80000]),flags4=rng.choice([0,0x400]),assignment=rng.choice([32,32,32,160,0]),formationDelay=rng.randrange(256),speed=70,cargo=rng.choice([0,100]),f1=rng.choice([0,1,2]),f2=rng.choice([0,1,2]),draw=12,commands=[1]+[0]*7)
   ps.append(p)
  c=dict(g=g,people=ps,randomState=rng.getrandbits(32),poseRandom=rng.getrandbits(32),turns=16 if mode=='sequence' else 1)
  setup(c);call(0x501700,group);g['offsets']=formation()['offsets']
  if mode!='geometry':
   # Use native-generated slot positions and forward headings; selectively cross
   # exact unwrapped arrival, catch-up, angle and squared-separation boundaries.
   for n,p in enumerate(ps):
    p['x']=(g['x']+g['offsets'][n]['x']*16+rng.choice([0,0,71,72,2048,2049,-72]))&65535
    p['y']=(g['y']+g['offsets'][n]['y']*16)&65535
    dist=rng.choice([0,567,568,2000,8000]);angle=(g['heading']+rng.choice([0,0,0,113,114,1024]))&2047
    # Native integer move gives the destination independently of browser code.
    write(ptr(13),'HH',p['x'],p['y']);call(0x4e6a70,ptr(13),angle,dist)
    p['destinationX']=read(ptr(13),'H');p['destinationY']=read(ptr(13)+2,'H')
    if i%7==0:p['flags2']=rng.choice([0,1,0x800,0x80000])
    if i%11==0:p['class']=rng.choice([0,1])
  setup(c);events=[]
  if mode=='geometry':call(0x501700,group)
  else:
   for turn in range(c['turns']):call(0x501000,group)
  cases.append(copy.deepcopy(c));expected.append(snapshot())
 result=subprocess.run(['node','--input-type=module','-e',js],input=json.dumps(dict(mode=mode,cases=cases)),text=True,capture_output=True,cwd=root);assert result.returncode==0,result.stderr
 actual=json.loads(result.stdout)
 for i,(a,b) in enumerate(zip(expected,actual)):
  if a!=b:
   path=Path('/private/tmp/populous-marching-failure.json');path.write_text(json.dumps(dict(mode=mode,index=i,input=cases[i],expected=a,actual=b),indent=2));raise AssertionError((mode,i,str(path)))
 portable.extend(dict(mode=mode,input=c,expected=e) for c,e in zip(cases[:32],expected[:32]))
 print(f'PASS: {len(cases):,} native marching {mode} cases',flush=True)
# Recruitment runs the actual native indexed searches and retained cell chains.
cpu.mem_write(0x8929cd,(exe.parent/'data/mwsearch.dat').read_bytes())
cpu.mem_write(0x8a03e4,bytes(16384*16))
join_js="""import {joinMarchingFormation} from './app/marching-formations.ts';let s='';for await(const c of process.stdin)s+=c;console.log(JSON.stringify(JSON.parse(s).map(c=>{const cells=new Map(),search=Uint8Array.from(c.search),events=[];for(const p of c.people){const cell=((p.x>>8)&254)|(p.y&0xfe00),row=cells.get(cell)??[];row.unshift(p);cells.set(cell,row)}
const w={search,cellPeople:cell=>cells.get(cell)??[]};joinMarchingFormation(w,c.people[0],c.existing?[c.g]:[],leader=>{events.push(['allocate',{x:leader.x,y:leader.y},leader.tribe]);if(c.allocationFail)return;Object.assign(c.g,{id:100,class:10,model:0,x:leader.x,y:leader.y,heading:0,destinationX:0,destinationY:0,shape:0,speed:0,timer:0,shapeTimer:0,count:0,freeSlot:0,members:Array(12).fill(0),offsets:Array.from({length:12},()=>({x:0,y:0}))});return c.g});return {g:c.g,people:c.people,randomState:c.randomState,poseRandom:c.poseRandom,events,search:[...search]}})));"""
cases=[];expected=[];oldcells=set()
for i in range(4096):
 g=dict(id=100,**{'class':10},model=2,x=12000,y=22000,heading=512,destinationX=20000,destinationY=22000,shape=0,speed=74,timer=0,shapeTimer=0,count=0,freeSlot=0,members=[0]*12,offsets=[dict(x=0,y=0) for _ in range(12)])
 ps=[]
 for n in range(1,13):
  p={k:0 for k in fields};p.update(id=n,**{'class':1},model=2,state=10,tribe=0,physics=2,counter=0,x=(12000+rng.choice([0,0,128,-512,2048,4000]))&65535,y=(22000+rng.choice([0,0,128,512,-512]))&65535,heading=rng.choice([512,512,399,625,626]),destinationX=20000,destinationY=22000,flags2=0,flags3=rng.getrandbits(32)&~16,flags4=0,assignment=8,formationDelay=0,recoveryCounter=rng.choice([23,24,99,127,128,255]),speed=70,draw=12,commands=[1]+[0]*7)
  if n>1 and i%3==0:p.update(state=rng.choice([10,10,17]),assignment=rng.choice([0,8,32,40]),model=rng.choice([2,2,3]),tribe=rng.choice([0,0,1]))
  ps.append(p)
 if i%7==0:ps[0]['formationDelay']=rng.randrange(256)
 if i%11==0:ps[0]['flags2']=0x800
 if i%13==0:ps[0]['speed']=0
 if i%17==0:ps[0]['assignment']|=32
 pool=[0]*192
 if i%19==0:
  for n in range(16):pool[n*12]=1
 if i%5==0:
  # Exercise near limits, signed seam comparisons and final free-slot gates.
  g.update(x=(ps[0]['x']+rng.choice([2103,2104,32768]))&65535,y=ps[0]['y'],heading=rng.choice([399,400,512,624,625]),freeSlot=rng.choice([0,10,11,12]))
  for n in range(g['freeSlot']):g['members'][n]=n+1
  g['count']=g['freeSlot']
 case=dict(g=g,people=ps,randomState=rng.getrandbits(32),poseRandom=rng.getrandbits(32),existing=bool(i%2),allocationFail=bool(i%7==0),search=pool)
 setup(case);call(0x501700,group);g['offsets']=formation()['offsets'];setup(case)
 for cell in oldcells:write(0x8a03e4+cell*16+6,'H',0)
 oldcells=set()
 for p in ps:
  cell=(p['y']>>9)*128+(p['x']>>9);a=0x8a03e4+cell*16+6
  write(ptr(p['id'])+0x20,'H',read(a,'H'));write(a,'H',p['id']);oldcells.add(cell)
 write(0x89da55,'I',group if case['existing'] else 0);write(group,'I',0);cpu.mem_write(0x89290d,bytes(pool));events=[]
 call(0x5018c0,ptr(1));expected.append(dict(**snapshot(),search=list(cpu.mem_read(0x89290d,192))));cases.append(copy.deepcopy(case))
r=subprocess.run(['node','--input-type=module','-e',join_js],input=json.dumps(cases),text=True,capture_output=True,cwd=root);assert r.returncode==0,r.stderr
for i,(a,b) in enumerate(zip(expected,json.loads(r.stdout))):
 if a!=b:
  path=Path('/private/tmp/populous-marching-failure.json');path.write_text(json.dumps(dict(mode='join',index=i,input=cases[i],expected=a,actual=b),indent=2));raise AssertionError(('join',i,str(path)))
portable.extend(dict(mode='join',input=c,expected=e) for c,e in zip(cases[:64],expected[:64]))
print('PASS: 4,096 native formation recruitment calls, actual searches/cell order, allocation/full-group failures and complete search pool bytes',flush=True)
if '--record' in sys.argv:(root/'tests/fixtures/marching-formations.json').write_text(json.dumps(dict(executableSha256=identity['sha256'],cases=portable),separators=(',',':'))+'\n')
