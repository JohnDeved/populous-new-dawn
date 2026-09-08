"""Compare full 0x4e6d00 turns and 0x4e9be0 bounce against the supplied EXE.
Usage: python scripts/check-native-physics-driver.py /path/to/d3dpoptb.exe
Terrain, steering, collision/access, recovery, drift and settling execute natively.
Cell insertion, allocation, damage/audio, state/fight, building routes, reveal and
path consumers are supplied. Ordered snapshots include all owned motion fields.
"""
import copy,json,random,struct,subprocess,sys
from pathlib import Path
from unicorn import UC_HOOK_CODE
from unicorn.x86_const import UC_X86_REG_ESP,UC_X86_REG_EIP,UC_X86_REG_EAX
from decomp import native_cpu,configure_native_constants
root=Path(__file__).resolve().parents[1];cpu,_=native_cpu(Path(sys.argv[1]));configure_native_constants(cpu,Path(sys.argv[1]))
cpu.mem_map(0x2000000,0x20000);p,to,stack,stop=0x2000000,0x2001000,0x201e000,0x201f000;rng=random.Random(0x4e6d00)
def write(a,f,*v):cpu.mem_write(a,struct.pack('<'+f,*v))
def read(a,f):return struct.unpack('<'+f,cpu.mem_read(a,struct.calcsize('<'+f)))[0]
def short(n):return ((n+32768)&65535)-32768
def point(addr):return dict(zip(['x','y','h'],struct.unpack('<HHh',cpu.mem_read(addr,6))))
def index(q):return (q['y']>>9)*128+(q['x']>>9)
def call(a,*args):
 write(stack,'I'*(len(args)+1),stop,*[v&0xffffffff for v in args]);cpu.reg_write(UC_X86_REG_ESP,stack)
 cpu.emu_start(a,stop,timeout=10000000,count=2000000);assert cpu.reg_read(UC_X86_REG_EIP)==stop,hex(cpu.reg_read(UC_X86_REG_EIP))
 return cpu.reg_read(UC_X86_REG_EAX)
def compare(js,data,expected,label):
 r=subprocess.run(['node','--input-type=module','-e',"let s='';for await(const c of process.stdin)s+=c;const input=JSON.parse(s);"+js],input=json.dumps(data),capture_output=True,text=True,cwd=root)
 assert r.returncode==0,r.stderr;actual=json.loads(r.stdout);assert len(actual)==len(expected)
 for i,(a,b) in enumerate(zip(expected,actual)):
  if a!=b:
   Path('/private/tmp/populous-driver-mismatch.json').write_text(json.dumps(dict(label=label,index=i,case=data['cases'][i],native=a,browser=b),indent=2))
   raise AssertionError((label,i,'/private/tmp/populous-driver-mismatch.json'))
 print(f'PASS: {len(expected):,} native {label} comparisons',flush=True)
fields={'x':(0x3d,'H'),'y':(0x3f,'H'),'h':(0x41,'h'),'class':(0x2a,'B'),'model':(0x2b,'B'),'physics':(0x30,'B'),'state':(0x2c,'B'),'previousState':(0x7d,'B'),'flags2':(0xc,'I'),'flags3':(0x14,'I'),'flags4':(0x10,'I'),'motionTimer':(0x61,'h'),'motionMode':(0x66,'B'),'target':(0x72,'H'),'tribe':(0x2f,'B'),'workTarget':(0x89,'H'),'life':(0x6e,'h'),'counter':(0x2e,'B'),'turnAngle':(0x57,'H'),'turnY':(0x59,'H'),'heading':(0x5d,'H'),'angle':(0x26,'H'),'slowTurn':(0x7e,'B'),'speed':(0x5f,'h'),'recoveryCounter':(0x65,'B'),'supportHeight':(0x1c,'h')}
def put(person):
 cpu.mem_write(p,bytes(256))
 for k,(offset,f) in fields.items():write(p+offset,f,person[k])
 write(p+0x49,'hhh',*person['velocity'].values())
def get():return {**{k:read(p+offset,f) for k,(offset,f) in fields.items()},'velocity':dict(zip(['x','y','z'],struct.unpack('<hhh',cpu.mem_read(p+0x49,6))))}
land=dict(heights=[rng.randrange(100,180) if i<8192 else rng.randrange(-200,800) for i in range(16384)],flags=[rng.choice([0,1,8,9,0x200,0x80000,4]) if i%7==0 else rng.randrange(2)|8 for i in range(16384)],categories=[0 if i<8192 else rng.randrange(16) for i in range(16384)])
for i in range(16384):write(0x8a03e4+i*16,'Ih',land['flags'][i],land['heights'][i]);write(0x8a03e4+i*16+12,'B',land['categories'][i]);write(0x8a03e4+i*16+8,'H',1)
write(0x96aa74,'I',0x96aaba)
objects=[[1,dict(x=500,y=500,**{'class':2},model=4,state=2,flags2=0,tribe=0,related=0)],[2,dict(x=500,y=500,**{'class':1},model=2,state=10,flags2=0,tribe=0,related=1)],[3,dict(x=500,y=500,**{'class':1},model=2,state=36,flags2=0,tribe=1,related=0)]]
for id,o in objects:
 addr=p+id*256;write(0x890390+id*4,'I',addr)
 for key in ['x','y','class','model','state','flags2','tribe']:off,f=fields[key];write(addr+off,f,o[key])
 write(addr+0x92,'h',o['related'])
consumers={0x4ee580:'insert',0x4ed8a0:'allocate',0x4da080:'damage',0x48a050:'sound',0x4ed6f0:'release',0x4ed640:'initialize',0x4d3ea0:'animation',0x4465a0:'class3',0x51f990:'fight',0x51fcd0:'ready',0x450610:'reveal',0x4eadc0:'path',0x40a460:'approach',0x4044b0:'outside',0x4665c0:'boat'}
def leaf(cpu,a,size,u):
 sp=cpu.reg_read(UC_X86_REG_ESP);name=consumers[a];args=[];result=0
 if name=='insert':
  q=point(read(sp+8,'I'));args=[q];result=int(index(q)!=index(get()));events.append([name,args,get()]);write(p+0x3d,'HHh',q['x'],q['y'],q['h'])
 elif name=='allocate':args=[read(sp+4,'B'),read(sp+8,'B'),read(sp+12,'B'),point(read(sp+16,'I'))]
 elif name=='damage':args=[read(sp+8,'i'),read(sp+12,'I'),read(sp+16,'I')]
 elif name=='sound':assert read(sp+12,'I')==0;args=[read(sp+8,'I')]
 elif name=='reveal':args=[read(sp+4,'I'),read(sp+8,'I')&65535]
 elif name in ['approach','outside']:
  q=case[name];write(read(sp+(8 if name=='outside' else 12),'I'),'HH',q['x'],q['y'])
 elif name=='fight':assert read(sp+12,'I')==1;args=[read(read(sp+8,'I')+0x24,'H')];result=int(case['fight'])
 elif name=='ready':result=int(case['ready'])
 elif name=='boat':result=int(case['boat'])
 if name!='insert':events.append([name,args,get()])
 if name=='damage':write(p+0x6e,'h',short(read(p+0x6e,'h')-args[1]))
 cpu.reg_write(UC_X86_REG_EAX,result);cpu.reg_write(UC_X86_REG_EIP,read(sp,'I'));cpu.reg_write(UC_X86_REG_ESP,sp+4)
for a in consumers:cpu.hook_add(UC_HOOK_CODE,leaf,begin=a,end=a)
branches={0x4e6d58:'impulse',0x4e72cf:'grounded fall',0x4e7092:'ground velocity',0x4e73fe:'airborne landing',0x4e760d:'launch sound',0x4e7684:'airborne fall',0x4e76d0:'settling',0x4e7183:'failed recovery',0x4e71bb:'turn hold',0x4e7865:'reveal',0x4e702f:'arrival distance'}
coverage={name:0 for name in branches.values()}
def hit(cpu,a,size,u):coverage[branches[a]]+=1
for a in branches:cpu.hook_add(UC_HOOK_CODE,hit,begin=a,end=a)
for id,_ in objects:write(p+id*256+0x24,'H',id)
def person(i):
 x=rng.choice([0,1,511,512,65535,rng.randrange(65536)]);y=rng.choice([0,1,511,512,65535,rng.randrange(65536)])
 h=short(call(0x44e940,x,y)+rng.choice([0,0,-10,1,200,2000]))
 return dict(x=x,y=y,h=h,**{'class':rng.choice([1,1,3])},model=rng.randrange(1,9),physics=i%20,state=rng.choice([10,36,39,41]),previousState=14,
  flags2=rng.choice([0,0x1000,0x1800,0x4000,0x80000,0x80000,0x82000,0x2000,0x20000800])|rng.choice([0,2,32,0x200,0x8000,0x40000]),flags3=rng.choice([0,0x10000,0x8000000,0x8010000]),flags4=rng.choice([0,0x400,0x2000,0x2400])|rng.choice([0,1,2,4,0x10000,0x1800000]),
  motionTimer=rng.choice([0,1,2,9]),motionMode=rng.choice([0,1,48,127,255]),recoveryCounter=rng.choice([0,64,65,99,255]),supportHeight=rng.choice([0,100]),target=rng.choice([0,3]),tribe=rng.randrange(4),workTarget=rng.choice([0,1,2]),life=rng.choice([0,1,100,1000]),counter=i%256,turnAngle=(x+rng.choice([-1,0,1,20,1000]))&65535,turnY=(y+rng.choice([-1,0,1,20,1000]))&65535,heading=rng.randrange(2048),angle=rng.randrange(2048),slowTurn=rng.choice([0,0,1,3,255]),speed=rng.choice([0,1,20,80,32767,-1,-32768]),velocity={k:rng.choice([0,1,-1,91,-99,-100,-199,-200,300,-32768,32767]) for k in ['x','y','z']})
js="""import {stepPersonPhysics,bouncePerson} from './app/person-physics.ts';
const land={...input.land,walkMasks:[new Uint8Array(8192)]},objects=new Map(input.objects),index=q=>((q.y&65535)>>9)*128+((q.x&65535)>>9),short=n=>(n<<16)>>16;
console.log(JSON.stringify(input.cases.map(c=>{const p=c.p,events=[],log=(n,...a)=>events.push([n,a,structuredClone(p)]);
objects.get(1).model=c.buildingModel;land.walkMasks[0].fill(c.passable?255:0);
const collision={objects,walkMask:land.walkMasks[0],cell:q=>{const i=index(q);return {flags:land.flags[i],category:land.categories[i],building:1};},boatAt:()=>{log('boat');return c.boat;}};
if(input.mode==='bounce'){bouncePerson(collision,p,c.to,c.reflect);return {p,to:c.to,events};}
const effects={insert:to=>{const moved=index(p)!==index(to);log('insert',{...to});Object.assign(p,to);return moved;},allocate:(...args)=>log('allocate',...args),damage:(...args)=>{log('damage',...args);p.life=short(p.life-args[1]);},sound:cue=>log('sound',cue),animation:()=>log('animation'),release:()=>log('release'),initialize:()=>log('initialize'),class3:()=>log('class3'),canFight:id=>{log('fight',id);return c.fight;},readyToFight:()=>{log('ready');return c.ready;},reveal:(...a)=>log('reveal',...a),path:()=>log('path')};
const world={land,collision,gameFlags:c.gameFlags,levelFlags:c.levelFlags,playerTribe:0,buildingModel:id=>objects.get(id).model,route:outside=>{log(outside?'outside':'approach');return c[outside?'outside':'approach'];}};
const turns=[];for(let i=0;i<c.turns;i++){events.length=0;stepPersonPhysics(world,p,effects);turns.push({p:structuredClone(p),events:structuredClone(events)});p.counter=(p.counter+1)&255;}
return turns;})));"""
for mode,count,turns in [('bounce',4096,1),('driver',8192,1),('trajectory',128,64)]:
 cases=[];expected=[]
 for i in range(count):
  pp=person(i);case=dict(p=pp,passable=bool(i%3),gameFlags=rng.choice([0,2]),levelFlags=rng.choice([0,4]),fight=bool(i%3),ready=bool(i%4),boat=bool(i%2),approach=dict(x=(pp['x']+100)&65535,y=pp['y']),outside=dict(x=(pp['x']+900)&65535,y=pp['y']),turns=turns)
  case['buildingModel']=[4,13,15][i%3];objects[0][1]['model']=case['buildingModel'];write(p+256+0x2b,'B',case['buildingModel']);put(pp);cpu.mem_write(0x96aaba,bytes([255 if case['passable'] else 0])*8192);write(0x89d17c,'I',case['gameFlags']);write(0x895da8,'I',case['levelFlags']);write(0x89c6f0,'B',0)
  events=[]
  if mode=='bounce':
   q=dict(x=pp['x'],y=pp['y'],h=pp['h']);case.update(to=q,reflect=bool(i%2));write(to,'HHh',q['x'],q['y'],q['h']);call(0x4e9be0,p,to,int(case['reflect']));expected.append(dict(p=get(),to=point(to),events=copy.deepcopy(events)))
  else:
   output=[]
   for turn in range(turns):
    events=[];call(0x4e6d00,p);output.append(dict(p=get(),events=copy.deepcopy(events)));write(p+0x2e,'B',(read(p+0x2e,'B')+1)&255)
   expected.append(output)
  cases.append(case)
 compare(js,dict(mode=mode,land=land,objects=objects,cases=cases),expected,mode)

assert all(coverage.values()),coverage
print('PASS: exercised native driver branches '+json.dumps(coverage),flush=True)
print('PASS: 16,384 full physics turns (8,192 single turns + 128 × 64-turn trajectories)',flush=True)
