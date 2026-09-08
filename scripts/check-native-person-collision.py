"""Native collision, coastal surface and walk-mask comparisons.
Usage: python scripts/check-native-person-collision.py /path/to/d3dpoptb.exe
Only boat lookup is supplied for collision; native building/surface callees run.
Walk-mask generation executes its complete native terrain classifier.
"""
import hashlib,json,random,struct,subprocess,sys
from pathlib import Path
from unicorn import UC_HOOK_CODE
from unicorn.x86_const import UC_X86_REG_ESP,UC_X86_REG_EIP,UC_X86_REG_EAX
from decomp import native_cpu,configure_native_constants
root=Path(__file__).resolve().parents[1];cpu,_=native_cpu(Path(sys.argv[1]));configure_native_constants(cpu,Path(sys.argv[1]))
cpu.mem_map(0x2000000,0x20000);p,to,stack,stop=0x2000000,0x2001000,0x201e000,0x201f000;rng=random.Random(0x5178d0)
def write(a,f,*v):cpu.mem_write(a,struct.pack('<'+f,*v))
def read(a,f):return struct.unpack('<'+f,cpu.mem_read(a,struct.calcsize('<'+f)))[0]
def call(a,*args):
 write(stack,'I'*(len(args)+1),stop,*[v&0xffffffff for v in args]);cpu.reg_write(UC_X86_REG_ESP,stack)
 cpu.emu_start(a,stop,timeout=10000000,count=20000000);assert cpu.reg_read(UC_X86_REG_EIP)==stop,hex(cpu.reg_read(UC_X86_REG_EIP))
 return cpu.reg_read(UC_X86_REG_EAX)
def index(q):return (q['y']>>9)*128+(q['x']>>9)
def compare(js,data,expected,label):
 r=subprocess.run(['node','--input-type=module','-e',"let s='';for await(const c of process.stdin)s+=c;const input=JSON.parse(s);"+js],input=json.dumps(data),capture_output=True,text=True,cwd=root)
 assert r.returncode==0,r.stderr;actual=json.loads(r.stdout);assert len(actual)==len(expected)
 for i,(a,b) in enumerate(zip(expected,actual)):assert a==b,(label,i,a,b,data[i] if isinstance(data,list) else data.get('cases',[None]*len(expected))[i])
 print(f'PASS: {len(expected):,} native {label} comparisons',flush=True)
cases=[];expected=[]
for i in range(4096):
 q=dict(x=((i%8)*64+rng.choice([0,1,63])+rng.choice([0,32768,65024]))&65535,y=(((i//8)%8)*64+rng.choice([0,1,63])+rng.choice([0,32768,65024]))&65535);category=(i//64)%16
 write(0x8a03e4+index(q)*16+12,'B',category);write(to,'HH',q['x'],q['y']);expected.append(call(0x44f980,to));cases.append(dict(category=category,p=q))
compare("import {terrainSupportsPerson} from './app/person-collision.ts';console.log(JSON.stringify(input.map(c=>terrainSupportsPerson(c.category,c.p))));",cases,expected,'coastal surface')
def boat(cpu,a,size,u):
 global boats
 boats+=1;sp=cpu.reg_read(UC_X86_REG_ESP);cpu.reg_write(UC_X86_REG_EAX,int(case['boat']));cpu.reg_write(UC_X86_REG_EIP,read(sp,'I'));cpu.reg_write(UC_X86_REG_ESP,sp+4)
cpu.hook_add(UC_HOOK_CODE,boat,begin=0x4665c0,end=0x4665c0)
write(0x96aa74,'I',0x96aaba)
fields={'x':(0x3d,'H'),'y':(0x3f,'H'),'model':(0x2b,'B'),'flags2':(0xc,'I'),'flags4':(0x10,'I'),'tribe':(0x2f,'B'),'workTarget':(0x89,'H'),'target':(0x72,'H')}
objfields={'x':(0x3d,'H'),'y':(0x3f,'H'),'class':(0x2a,'B'),'state':(0x2c,'B'),'flags2':(0xc,'I'),'tribe':(0x2f,'B'),'related':(0x92,'h')}
def path_consumer(cpu,a,size,u):
 if mode!='path':return
 sp=cpu.reg_read(UC_X86_REG_ESP)
 if a==0x44f600:events.append(['height',read(sp+4,'I')&65535]);return
 events.append(['adjacent',read(sp+8,'I')&255]);cpu.reg_write(UC_X86_REG_EAX,p+case['adjacent']*256 if case['adjacent'] else 0)
 cpu.reg_write(UC_X86_REG_EIP,read(sp,'I'));cpu.reg_write(UC_X86_REG_ESP,sp+4)
cpu.hook_add(UC_HOOK_CODE,path_consumer,begin=0x44f600,end=0x44f600)
cpu.hook_add(UC_HOOK_CODE,path_consumer,begin=0x40a3f0,end=0x40a3f0)
for mode in ['building','collision','path']:
 cases=[];expected=[]
 for i in range(8192):
  person=dict(x=1000,y=1000,model=rng.choice([1,2,3,7]),flags2=rng.choice([0,0x20000000]),flags4=rng.choice([0,1,2,4,7,0x10000,0x10003])|rng.choice([0,0x800000,0x1000000,0x1800000]),tribe=i%4,workTarget=rng.choice([0,2,3]),target=rng.choice([0,4]))
  point=dict(x=rng.randrange(12000,16000),y=rng.randrange(12000,16000));cell=dict(flags=rng.choice([0,1,4,0x200,0x204,0x1000000,0x1000204]),category=i%16,building=2|rng.choice([0,0x400,0xfc00]))
  objects=[[j,dict(x=20000,y=20000,**{'class':rng.choice([0,1,2])},state=rng.choice([0,1,2,3]),flags2=rng.choice([0,1]),tribe=rng.randrange(4),related=rng.choice([-1,0,2,3]))] for j in [2,3,4]]
  case=dict(p=person,to=point,cell=cell,objects=objects,otherBuilding=rng.choice([0,2,3,0x402]),passable=bool(i%3),boat=bool(i%2));cases.append(case)
  cpu.mem_write(p,bytes(256))
  for k,(off,f) in fields.items():write(p+off,f,person[k])
  for j,obj in objects:
   address=p+j*256;write(0x890390+j*4,'I',address);cpu.mem_write(address,bytes(256))
   write(address+0x24,'H',j)
   for k,(off,f) in objfields.items():write(address+off,f,obj[k])
  celladdr=0x8a03e4+index(point)*16;write(celladdr,'I',cell['flags']);write(celladdr+12,'B',cell['category']);write(celladdr+8,'H',cell['building'])
  write(0x8a03e4+index(objects[2][1])*16+8,'H',case['otherBuilding'])
  bit=(point['y']>>8)*256+(point['x']>>8);write(0x96aaba+(bit>>3),'B',255 if case['passable'] else 0)
  write(to,'HH',point['x'],point['y']);boats=0
  events=[]
  if mode=='path':
   packed=((point['x']>>8)&254)|(point['y']&0xfe00);x=(packed&254)>>1;y=packed>>9
   case.update(packed=packed,limit=rng.choice([-32768,-1,0,1,128,384,32767]),adjacent=rng.choice([0,2,3]),heights=[rng.choice([-32768,-1,0,1,128,384,1024,32767]) for _ in range(4)])
   for j,h in zip([y*128+x,((y+1)&127)*128+x,((y+1)&127)*128+((x+1)&127),y*128+((x+1)&127)],case['heights']):write(0x8a03e4+j*16+4,'h',h)
   write(0x9557c8,'I',p);write(0x9557b2,'h',case['limit']);result=call(0x518070,packed)
  else:result=(call(0x517f10,p,celladdr) if mode=='building' else call(0x5178d0,p,to))&255
  expected.append(dict(result=result,boats=boats,events=events))
 compare("""import {buildingBlocksPerson,personStepCollision,pathCellBlocked} from './app/person-collision.ts';import {terrainCellHeightRange} from './app/native-terrain.ts';console.log(JSON.stringify(input.cases.map(c=>{let boats=0;const events=[];
 const w={cell:p=>p.x===20000&&p.y===20000?{...c.cell,building:c.otherBuilding}:c.cell,walkMask:new Uint8Array(8192).fill(c.passable?255:0),objects:new Map(c.objects),boatAt:()=>{boats++;return c.boat;}};
 let result;if(input.mode==='path'){
  const x=(c.packed&254)>>1,y=c.packed>>9,land={heights:new Int16Array(16384)};
  [y*128+x,((y+1)&127)*128+x,((y+1)&127)*128+((x+1)&127),y*128+((x+1)&127)].forEach((j,k)=>land.heights[j]=c.heights[k]);
  result=pathCellBlocked(w,c.p,c.packed,()=>{events.push(['height',c.packed]);return terrainCellHeightRange(land,c.packed);},c.limit,()=>{events.push(['adjacent',0]);return c.adjacent;});
 }else result=input.mode==='building'?buildingBlocksPerson(w,c.p,c.cell):personStepCollision(w,c.p,c.to);
 return {result,boats,events};})));""",dict(mode=mode,cases=cases),expected,mode)
# Full bit-map updates, including unchanged bits outside wrapped update regions.
heights=[rng.randrange(80,260) for _ in range(16384)];flags=[rng.choice([0,1,0,1,4,0x80000]) for _ in range(16384)]
for i in range(16384):write(0x8a03e4+i*16,'Ih',flags[i],heights[i])
masks=[bytes(rng.randrange(256) for _ in range(8192)) for _ in range(2)]
for i,b in enumerate(masks):cpu.mem_write(0x96aaba+i*8192,b)
ops=[];expected=[]
for i in range(24):
 op=dict(center=rng.choice([0,65535,rng.randrange(65536)]),radius=[0,1,2,8,64,3][i%6]);ops.append(op)
 call(0x422a60,op['center'],op['radius']);assert read(0x96aa74,'I')==0x96aaba
 expected.append([hashlib.sha256(cpu.mem_read(0x96aaba+j*8192,8192)).hexdigest() for j in range(2)])
compare("""import {updateWalkMasks} from './app/native-terrain.ts';import {createHash} from 'node:crypto';
 const l={heights:input.heights,flags:input.flags,walkMasks:input.masks.map(b=>Uint8Array.from(b))};console.log(JSON.stringify(input.ops.map(o=>{updateWalkMasks(l,o.center,o.radius);return l.walkMasks.map(b=>createHash('sha256').update(b).digest('hex'));})));""",dict(heights=heights,flags=flags,masks=[list(b) for b in masks],ops=ops),expected,'complete walk-mask updates')
# Direct quarter selection covers signed height extrema and native min/max seeds.
cases=[];expected=[]
for i in range(8192):
 cell=rng.randrange(65536);x=(cell&255)>>1;y=(cell>>8)>>1;corners=[y*128+x,((y+1)&127)*128+x,((y+1)&127)*128+((x+1)&127),y*128+((x+1)&127)]
 h=[rng.choice([-32768,-1,0,1,1023,1024,32767,rng.randrange(1025)]) for _ in range(4)];flag=i&1;limit=rng.choice([-1,0,1,64,128,1024,32767])
 for j,value in zip(corners,h):write(0x8a03e4+j*16+4,'h',value)
 write(0x8a03e4+corners[0]*16,'I',flag)
 cases.append(dict(cell=cell,h=h,flag=flag,limit=limit));expected.append(bool(call(0x422bd0,cell,limit)&255))
compare("""import {terrainQuarterPassable} from './app/native-terrain.ts';const l={heights:new Int16Array(16384),flags:new Uint32Array(16384)};
 console.log(JSON.stringify(input.map(c=>{const x=(c.cell&255)>>1,y=(c.cell>>8)>>1,idx=[y*128+x,((y+1)&127)*128+x,((y+1)&127)*128+((x+1)&127),y*128+((x+1)&127)];idx.forEach((j,k)=>l.heights[j]=c.h[k]);l.flags[idx[0]]=c.flag;return terrainQuarterPassable(l,c.cell,c.limit);})));""",cases,expected,'quarter-cell height bounds')
