"""Compare complete task-3/4 decision controllers and shared waits/approaches.
Native footprint scans, eligibility, RNG, facing and indexed searches execute.
Routing, final animation/audio, resource and command ownership are supplied leaves.
Usage: python SCRIPT EXE [--people] [--record]
"""
import hashlib,json,random,struct,subprocess,sys
from pathlib import Path
from unicorn import UC_HOOK_CODE
from unicorn.x86_const import UC_X86_REG_ESP,UC_X86_REG_EIP,UC_X86_REG_EAX
from decomp import ROOT,native_cpu,configure_native_constants,load_native_shapes
exe=Path(sys.argv[1]);cpu,identity=native_cpu(exe);configure_native_constants(cpu,exe)
cpu.mem_map(0x2000000,0x60000);load_native_shapes(cpu,exe,0x2000000,0x2004000)
p,plan,objects,stack,stop=0x2010000,0x2011000,0x2020000,0x205d000,0x205e000
rules=json.loads((ROOT/'app/original-rules.json').read_text());shapes=json.loads((ROOT/'app/original-shapes.json').read_text())
people='--people' in sys.argv;entry=0x496220 if people else 0x495d70;rng=random.Random(entry)
search=(exe.parent/'data/mwsearch.dat').read_bytes();assert hashlib.sha256(search).hexdigest()=='0c39b12d160658863c2df89aa34484dff459e48ea0b5634658b7473ca940fae0';cpu.mem_write(0x8929cd,search)
def write(a,f,*v):cpu.mem_write(a,struct.pack('<'+f,*v))
def read(a,f):return struct.unpack('<'+f,cpu.mem_read(a,struct.calcsize('<'+f)))[0]
def hook(c,a,size,user):
 sp=c.reg_read(UC_X86_REG_ESP);result=0
 if a==0x4e9d80:
  to=read(sp+8,'I');x=read(to,'H');y=read(to+2,'H');events.append(['destination',dict(x=x,y=y)]);write(p+0x4f,'HH',x,y)
 elif a==0x4ea460:events.append(['releaseMotion']);return
 elif a==0x4d4040:events.append(['animation',read(sp+8,'H')])
 elif a==0x48a050:events.append(['sound',read(sp+8,'H'),read(sp+12,'H')])
 elif a==0x4a7860:
  events.append(['transfer',read(read(sp+4,'I')+0x24,'H'),read(sp+12,'i')]);write(p+0x78,'H',(read(p+0x78,'H')+7)&65535)
 elif a==0x4a7b60:events.append(['remove',read(read(sp+4,'I')+0x24,'H')]);assert read(sp+8,'I')==0 and read(sp+12,'I')==0
 elif a==0x4d58c0:events.append(['drop']);write(p+0x78,'H',0)
 elif a==0x436c20:result=0 if case['allocationFails'] else 77;events.append(['allocate',result])
 elif a==0x438730:
  to=read(sp+12,'I');assert read(sp+4,'H')==77 and read(sp+8,'B')==3 and read(sp+16,'B')==32
  events.append(['order',dict(x=read(to,'H'),y=read(to+2,'H'))])
 elif a in [0x436ca0,0x436d00,0x4e9b40,0x4ed6f0,0x4ed640]:
  who=read(sp+4,'I');pid=read(who+0x24,'H')
  if a==0x436ca0:events.append(['clear',pid])
  elif a==0x436d00:events.append(['attach',pid,read(sp+8,'H')]);assert read(sp+12,'B')==0
  elif a==0x4e9b40:events.append(['reset',pid]);return
  elif a==0x4ed6f0:events.append(['empty',pid])
  else:events.append(['init',pid,read(who+0x2c,'B')])
 c.reg_write(UC_X86_REG_EAX,result);c.reg_write(UC_X86_REG_EIP,read(sp,'I'));c.reg_write(UC_X86_REG_ESP,sp+4)
for a in [0x4e9d80,0x4ea460,0x4d4040,0x48a050,0x4a7860,0x4a7b60,0x4d58c0,0x436c20,0x438730,0x436ca0,0x436d00,0x4e9b40,0x4ed6f0,0x4ed640]:cpu.hook_add(UC_HOOK_CODE,hook,begin=a,end=a)
fields={'model':(0x2b,'B'),'state':(0x2c,'B'),'physics':(0x30,'B'),'counter':(0x2e,'B'),'tribe':(0x2f,'b'),
 'x':(0x3d,'H'),'y':(0x3f,'H'),'flags2':(0xc,'I'),'flags3':(0x14,'I'),'flags4':(0x10,'I'),
 'assignment':(0x76,'H'),'speed':(0x5f,'h'),'timer':(0x70,'h'),'target':(0x72,'H'),'cargo':(0x78,'H'),
 'angle':(0x26,'H'),'heading':(0x5d,'H'),'turnAngle':(0x57,'H'),'turnY':(0x59,'H'),
 'goalX':(0x4f,'H'),'goalY':(0x51,'H'),'destinationX':(0x53,'H'),'destinationY':(0x55,'H')}
phases=[0,4,5,14,15,16,255] if people else [0,1,4,10,11,13,20,21,29,51,255]
cases=[];expected=[]
for model in [1,4,5,7]:
 for phase in phases:
  for trial in range(96):
   direction=trial%4;obj=rules['buildingObjects'][model];shapeIndex=shapes['objects'][obj][direction];shape=shapes['shapes'][shapeIndex]
   pose=dict(object=obj,angle=direction*512,anchorX=rng.choice([0,512,32768,65024]),anchorY=rng.choice([0,512,32768,65024]))
   cx=(pose['anchorX']//256-shape['x'])&255;cy=(pose['anchorY']//256-shape['y'])&255
   cells=[]
   for y in range(shape['height']):
    for x in range(shape['width']):
     if shapes['cells'][shape['offset']+y*shape['width']+x]&1:cells.append((((cy+y*2)&255)//2)*128+(((cx+x*2)&255)//2))
   outside=dict(x=(cx*256+shape['outside'][0]*64)&65535,y=(cy*256+shape['outside'][1]*64)&65535)
   gx=(cells[0]&127)*512+256;gy=(cells[0]>>7)*512+256
   person=dict(model=rng.choice([2,3,7]),state=10,physics=rng.randrange(20),counter=rng.choice([0,1,2,7,8,31,32,255]),tribe=0,
    x=(gx+rng.choice([0,1,111,112,567,568,32767,65535]))&65535,y=gy,
    flags2=rng.choice([0,128,0x8000,0x80000,0x88080]),flags3=rng.choice([0,0x80000]),flags4=rng.choice([0,1,0x10407]),
    assignment=rng.choice([0,16,272]),speed=32,timer=rng.choice([-32768,-1,0,1,2,6,12,16]),target=2,cargo=rng.choice([0,50,100,65535]),
    angle=rng.randrange(2048),heading=rng.randrange(2048),turnAngle=0,turnY=0,goalX=gx,goalY=gy,destinationX=0,destinationY=0)
   person['commands']=[0,0,1024 if trial%11==0 else 0,0,0]
   task=dict(task=4 if people else 3,busy=rng.choice([0,1,255]),phase=phase,restart=bool(rng.randrange(4)==0))
   cpu.mem_write(p,bytes(256));cpu.mem_write(plan,bytes(256));cpu.mem_write(0x8a03e4,bytes(16384*16));cpu.mem_write(0x938830,bytes(256))
   for name,(offset,fmt) in fields.items():write(p+offset,fmt,person[name])
   write(p+0x8b,'HHHHH',*person['commands']);write(p+0xc,'I',person['flags2']|(0x40000000 if task['restart'] else 0));write(p+0xa8,'B',phase);write(p+0xaa,'B',task['busy']);write(p+0x89,'H',1)
   write(0x890394,'I',plan);write(plan+0x68,'H',cx|(cy<<8));write(plan+0x9b,'B',shapeIndex);write(plan+0x9e,'B',model)
   records=[];byCell={}
   for j in range(5):
    ident=j+2;addr=objects+j*256;cpu.mem_write(addr,bytes(256));write(0x890390+ident*4,'I',addr)
    cell=cells[j%len(cells)];x=(cell&127)*512+256;y=(cell>>7)*512+256
    if people:
     record=dict(id=ident,x=x,y=y,**{'class':1 if j%3 else 5},model=rng.choice([2,4,7]),tribe=rng.choice([0,0,1]),state=rng.choice([1,10,10,33]),speed=rng.choice([0,32]),flags2=rng.choice([0,0x1000000,0x100000]),flags3=0,flags4=0,assignment=0,
      commands=[1,0,0,0,0],commandCursor=0,immediateCommand=2 if j%2 else 0,previousState=0,motionTimer=9,motionMode=3)
     write(addr+0x2f,'b',record['tribe']);write(addr+0x2c,'B',record['state']);write(addr+0x5f,'h',record['speed']);write(addr+0x8b,'HHHHH',*record['commands']);write(addr+0x9b,'H',record['immediateCommand']);write(addr+0x61,'h',9);write(addr+0x66,'B',3)
    else:record=dict(id=ident,x=x,y=y,**{'class':rng.choice([0,1,5,5,5])},model=rng.choice([1,7,9,11,12]),flags2=rng.choice([0,0,1]))
    write(addr+0x24,'H',ident);write(addr+0x2a,'BB',record['class'],record['model']);write(addr+0xc,'I',record['flags2']);write(addr+0x3d,'HH',x,y)
    # Keep the lookup record even if removed; native approach reads its coordinates before validating.
    records.append(record)
    if record['class']:byCell.setdefault(cell,[]).append(ident)
   for cell,ids in byCell.items():
    write(0x8a03e4+cell*16+6,'H',ids[0])
    for j,ident in enumerate(ids):write(objects+(ident-2)*256+0x20,'H',ids[j+1] if j+1<len(ids) else 0)
   pool=bytearray(192)
   if trial%13==0:
    for i in range(1,16):pool[i*12]=1
   cpu.mem_write(0x89290d,bytes(pool));land=[]
   if people:
    center=(person['y']>>9)*128+(person['x']>>9)
    for dy in range(-2,3):
     for dx in range(-2,3):
      i=(((center>>7)+dy)&127)*128+(((center&127)+dx)&127)
      flags=rng.choice([0,0,2,4,512,1024,0x4000]);category=rng.choice([2,3,4,5])
      if i in cells:flags|=1024
      land.append(dict(index=i,flags=flags,category=category));write(0x8a03e4+i*16,'I',flags);write(0x8a03e4+i*16+12,'B',category)
   orders=[dict(model=0,flags=0),dict(model=rng.choice([3,11,24,25]),flags=rng.randrange(2)),dict(model=rng.choice([11,24,25]),flags=rng.randrange(2))]
   for i,o in enumerate(orders):write(0x938830+i*10,'BB',o['model'],o['flags'])
   seed=rng.getrandbits(32);write(0x89d178,'I',seed);write(0x89d17c,'I',32)
   case=dict(person=person,task=task,pose=pose,outside=outside,cells=cells,records=records,land=land,pool=list(pool),orders=orders,allocationFails=trial%7==0,seed=seed)
   events=[];write(stack,'II',stop,p);cpu.reg_write(UC_X86_REG_ESP,stack);cpu.emu_start(entry,stop,count=2000000);assert cpu.reg_read(UC_X86_REG_EIP)==stop
   result={name:read(p+offset,fmt) for name,(offset,fmt) in fields.items()};restart=bool(result['flags2']&0x40000000);result['flags2']&=~0x40000000;result['commands']=person['commands']
   after=[]
   if people:
    for j,o in enumerate(records):
     addr=objects+j*256;after.append({**o,'state':read(addr+0x2c,'B'),'previousState':read(addr+0x7d,'B'),'flags2':read(addr+0xc,'I'),'motionTimer':read(addr+0x61,'h'),'motionMode':read(addr+0x66,'B')})
   originalFlags={v['index']:v['flags'] for v in land}
   changes=[[i,f[0]] for i,f in enumerate(struct.iter_unpack('<I12x',cpu.mem_read(0x8a03e4,16384*16))) if f[0]!=originalFlags.get(i,0)] if people else []
   cases.append(case);expected.append(dict(person=result,task={**task,'phase':read(p+0xa8,'B'),'busy':read(p+0xaa,'B'),'restart':restart},randomState=read(0x89d178,'I'),events=events,result=cpu.reg_read(UC_X86_REG_EAX)&255,pool=list(cpu.mem_read(0x89290d,192)),records=after,changes=changes))
js="""import {stepBuildingScenery,stepBuildingPeople} from './app/building-clearing.ts';import {restingCellAvailable} from './app/resting-slots.ts';import {resetPersonMotion,defaultPersonState} from './app/person-state.ts';
let s='';for await(const c of process.stdin)s+=c;console.log(JSON.stringify(JSON.parse(s).map(c=>{
 const p={...c.person,motionGroup:0,motionIndex:0},task={...c.task},rng={randomState:c.seed},events=[],records=structuredClone(c.records),pool=Uint8Array.from(c.pool),flags=new Uint32Array(16384),categories=new Uint8Array(16384),orders={records:c.orders,cursor:0,active:0};
 c.land.forEach(v=>{flags[v.index]=v.flags;categories[v.index]=v.category});const before=flags.slice();
 const cellPeople=i=>records.filter(o=>o.class&&((o.y>>9)*128+(o.x>>9))===i),occupants=()=>c.cells.flatMap(cellPeople);
 const effects={animation:(_,id)=>events.push(['animation',id]),destination:to=>{to={x:to.x,y:to.y};events.push(['destination',to]);p.goalX=to.x;p.goalY=to.y},releaseMotion:()=>events.push(['releaseMotion']),sound:(cue,flags)=>events.push(['sound',cue,flags]),transfer:(id,n)=>{events.push(['transfer',id,n]);p.cargo=(p.cargo+7)&65535},remove:id=>events.push(['remove',id]),dropTimber:()=>{events.push(['drop']);p.cargo=0},
 allocateOrder:to=>{const id=c.allocationFails?0:77;events.push(['allocate',id]);if(id)events.push(['order',to]);return id},displace:(o,id)=>{events.push(['clear',o.id],['attach',o.id,id],['reset',o.id]);resetPersonMotion(o);if(!(o.flags2&0x100000)){o.previousState=o.state;events.push(['empty',o.id]);o.state=defaultPersonState(o,32);events.push(['init',o.id,o.state])}}};
 const result=task.task===3?stepBuildingScenery(rng,p,task,{outside:c.outside,scenery:occupants,target:id=>records.find(o=>o.id===id)},effects):stepBuildingPeople(rng,p,task,{tribe:0,orders,search:pool,flags,occupants,cellPeople,available:i=>restingCellAvailable({land:{flags,categories},orders,cellObjects:cell=>cellPeople((cell>>9)*128+((cell&254)>>1))},((i&127)<<1)|((i>>7)<<9))},effects);
 delete p.motionGroup;delete p.motionIndex;const changes=[];flags.forEach((f,i)=>{if(f!==before[i])changes.push([i,f])});return {person:p,task,randomState:rng.randomState,events,result,pool:[...pool],records:task.task===4?records:[],changes};
})));"""
r=subprocess.run(['node','--input-type=module','-e',js],input=json.dumps(cases),capture_output=True,text=True,cwd=ROOT);assert r.returncode==0,r.stderr
actual=json.loads(r.stdout);assert len(actual)==len(expected)
for i,(a,e) in enumerate(zip(actual,expected)):
 if a!=e:
  Path('/private/tmp/populous-clearing-mismatch.json').write_text(json.dumps(dict(case=cases[i],actual=a,expected=e),indent=2));raise AssertionError((i,'/private/tmp/populous-clearing-mismatch.json'))
if '--record' in sys.argv:
 indices=range(0,len(cases),7)
 (ROOT/('tests/fixtures/building-people.json' if people else 'tests/fixtures/building-scenery.json')).write_text(json.dumps(dict(executableSha256=identity['sha256'],cases=[cases[i] for i in indices],expected=[expected[i] for i in indices]),separators=(',',':'))+'\n')
print('PASS:',len(cases),'complete native task',4 if people else 3,'calls: phases, targets, waits, facing/RNG, actions and ownership requests')
