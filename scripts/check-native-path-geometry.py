"""Compare wrapped candidates, line probes, smoothing and route measurement.
Usage: python scripts/check-native-path-geometry.py /path/to/d3dpoptb.exe
Line setup/probing execute inside smoothing; only building/boat consumers are supplied.
"""
import copy,hashlib,json,random,struct,subprocess,sys
from pathlib import Path
from unicorn import UC_HOOK_CODE
from unicorn.x86_const import UC_X86_REG_ESP,UC_X86_REG_EIP,UC_X86_REG_EAX
from decomp import native_cpu,configure_native_constants
root=Path(__file__).resolve().parents[1];exe=Path(sys.argv[1]);cpu,_=native_cpu(exe);configure_native_constants(cpu,exe);rng=random.Random(0x422020)
cpu.mem_map(0x2000000,0x20000);person,points,stack,stop=0x2000000,0x2001000,0x201e000,0x201f000
fields={'cacheCell':(0x64f4a0,'I'),'cacheResult':(0x64f4a8,'B'),'leftState':(0x64fee8,'i'),'rightState':(0x65092b,'i'),'diverged':(0x6513d9,'B'),'secondary':(0x6513da,'B'),'allowTransition':(0x6513d7,'B'),'kind':(0x6513d8,'B'),'transition':(0x6513dc,'B')}
line_fields={'xDirection':(0x6513c0,'i'),'yDirection':(0x6513c4,'i'),'dx':(0x6513c8,'i'),'dy':(0x6513cc,'i'),'error':(0x6513d0,'i'),'horizontalMajor':(0x6513d4,'B')}
def write(a,f,*v):cpu.mem_write(a,struct.pack('<'+f,*v))
def read(a,f):return struct.unpack('<'+f,cpu.mem_read(a,struct.calcsize('<'+f)))[0]
def ptr(i):return person+(i-1)*256 if i else 0
def ident(p):return (p-person)//256+1 if p else 0
def cell(p):
 i=(p-0x8a03e4)//16;return (i%128)*2|((i//128)*2<<8)
def call(a,*args):
 write(stack,'I'*(len(args)+1),stop,*[v&0xffffffff for v in args]);cpu.reg_write(UC_X86_REG_ESP,stack);cpu.emu_start(a,stop,count=3000000);assert cpu.reg_read(UC_X86_REG_EIP)==stop;return cpu.reg_read(UC_X86_REG_EAX)
def digest(data):return hashlib.sha256(data).hexdigest()
def candidate_bytes(data,mode):
 data=bytearray(data)
 if mode=='choose':
  # 0x420f80 writes an uninitialized stack word into these padding fields.
  for i in range(4,12):data[i*10+8:i*10+10]=bytes(2)
 return list(data)
def geometry():
 g={k:read(a,f) for k,(a,f) in fields.items()};g['cacheCell']=(g['cacheCell']-0x8a03e4)//16 if g['cacheCell'] else -1
 g['line']={k:read(a,f) for k,(a,f) in line_fields.items()};g['candidates']=candidate_bytes(cpu.mem_read(0x651348,120),mode);return g
def leaf(cpu,a,size,u):
 sp=cpu.reg_read(UC_X86_REG_ESP);arg=lambda i:read(sp+4+i*4,'I')
 if a==0x517f10:events.append(['building',cell(arg(1))]);result=c['building']
 elif a==0x4663c0:events.append(['boarding',cell(arg(1))]);result=ptr(c['boarding'])
 elif a==0x464f90:events.append(['disembark',ident(arg(0)),read(arg(1),'H'),read(arg(1)+2,'H')]);result=c['disembark']
 else:events.append(['boatCell',arg(0)&65535,ident(arg(1))]);result=c['boatCell']
 cpu.reg_write(UC_X86_REG_EAX,result);cpu.reg_write(UC_X86_REG_EIP,read(sp,'I'));cpu.reg_write(UC_X86_REG_ESP,sp+4)
for a in [0x517f10,0x4663c0,0x464f90,0x465510]:cpu.hook_add(UC_HOOK_CODE,leaf,begin=a,end=a)
rules=json.loads((root/'app/original-rules.json').read_text());land=next(i for i,f in enumerate(rules['terrainCategoryFlags']) if f&1)
terrains=[];native_terrains=[]
for t in range(4):
 categories=[land if t<2 else rng.randrange(16) for _ in range(16384)];flags=[0 if t%2==0 else rng.choice([0,0,512]) for _ in range(16384)];regions=list(rng.randbytes(16384));raw=bytearray(16384*16)
 for i in range(16384):struct.pack_into('<I',raw,i*16,flags[i]);raw[i*16+12]=categories[i];raw[i*16+15]=regions[i]
 terrains.append(dict(categories=categories,flags=flags,regions=regions));native_terrains.append(bytes(raw))
js="""import {createHash} from 'node:crypto';import {preparePathCandidates,choosePathCandidate,initializePathLine,probePathStep,clearPathSegment,smoothSearchPath,measureSearchPath} from './app/path-geometry.ts';
let s='';for await(const b of process.stdin)s+=b;const {cases,mode,terrains}=JSON.parse(s),hash=b=>createHash('sha256').update(b).digest('hex');
console.log(JSON.stringify(cases.map(c=>{const g=c.g;g.candidates=Uint8Array.from(g.candidates);const path={data:Uint8Array.from(c.path),count:c.count},state=c.state,result=Uint8Array.from(c.result),terrain=terrains[c.terrain],categories=Uint8Array.from(terrain.categories),flags=Uint32Array.from(terrain.flags),walkMasks=[new Uint8Array(8192).fill(255),new Uint8Array(8192).fill(255)],events=[];
for(const t of c.tiles){categories[t.i]=t.category;flags[t.i]=t.flags;}for(const [m,b] of c.blocked)walkMasks[m][b>>3]&=~(1<<(b&7));
const w={state,path,result,categories,flags,walkMasks},e={buildingAccess:cell=>{events.push(['building',cell]);return c.building;},boardingBoat:cell=>{events.push(['boarding',cell]);return c.boarding;},disembark:(boat,p)=>{events.push(['disembark',boat,p.x,p.y]);return !!c.disembark;},boatCell:(cell,boat)=>{events.push(['boatCell',cell,boat]);return !!c.boatCell;}},clear=(a,b,k)=>clearPathSegment(w,g,c.p,a,b,k,e);let value=null;
if(mode==='prepare')preparePathCandidates(w,g);else if(mode==='choose'){preparePathCandidates(w,g);for(const i of c.indices)choosePathCandidate(w,g,i);}
else if(mode==='line')initializePathLine(g.line,c.from,c.to);else if(mode==='probe'){value=[];for(let i=0;i<c.repeats;i++)value.push(probePathStep(w,g,c.p,c.from,c.direction,e));}
else if(mode==='clear')value=Number(clear(c.from,c.to,c.from.flags));else if(mode==='smooth')value=Number(smoothSearchPath(path,c.start,clear));else measureSearchPath(path,g.line,c.measure,terrain.regions,c.tribes);
if(mode==='choose')for(let i=4;i<12;i++){g.candidates[i*10+8]=0;g.candidates[i*10+9]=0;}g.candidates=[...g.candidates];return {g,state,path:hash(path.data),count:path.count,result:hash(result),measure:c.measure,events,value};})));"""
for mode in ['prepare','choose','line','probe','clear','smooth','measure']:
 cases=[];expected=[]
 for n in range(1024):
  data=bytearray(rng.randbytes(2580));count=rng.randrange(17);kind=rng.choice([0,0,1,2]);x,y=5120+rng.randrange(256),5120+rng.randrange(256)
  for i in range(count+2):
   x+=rng.randrange(-3,4);y+=rng.randrange(-3,4);struct.pack_into('<iiH',data,i*10,x,y,(rng.randrange(256)<<8)|(kind if n%3 else rng.randrange(3)))
  frm=dict(zip(['x','y','flags'],struct.unpack_from('<iiH',data)));to=dict(x=frm['x']+rng.randrange(-16,17),y=frm['y']+rng.randrange(-16,17),flags=rng.randrange(65536))
  if n%7==0:to['x']=frm['x']
  if n%11==0:to['y']=frm['y']
  if mode=='line' and n%8==0:frm['x']=rng.choice([-2147483648,2147483647,0]);to['x']=rng.choice([-2147483648,2147483647,0])
  result=list(rng.randbytes(1033))
  if n%5==0:result[4]=result[0]
  if n%7==0:result[5]=result[1]
  if n%11==0:result[4]=(result[0]+128)&255
  candidates=bytearray(rng.randbytes(120))
  for i in range(12):struct.pack_into('<ii',candidates,i*10,rng.randrange(-256,257),rng.randrange(-256,257))
  direction=n%4;step=rules['pathSteps'][direction];nx=(frm['x']+step['x'])&255;ny=(frm['y']+step['y'])&255;tile=(ny>>1)*128+(nx>>1);bit=ny*256+nx
  g={k:rng.randrange(256) for k in fields};g.update(cacheCell=tile if n%5==0 else -1,line={k:rng.randrange(-256,257) if f=='i' else rng.randrange(256) for k,(a,f) in line_fields.items()},candidates=list(candidates))
  g['allowTransition']=n%2;state=dict(currentBoat=rng.randrange(3),candidateCount=rng.randrange(5),walkMask=n%2)
  c=dict(g=g,state=state,path=list(data),count=count,result=result,terrain=n%4,tiles=[],blocked=[],p=dict(flags4=rng.choice([0,0,1,2,4,0x10000,0x10007,0xffffffff])),from_=frm,to=to,direction=direction,repeats=2 if n%3==0 else 1,start=rng.randrange(count+1),indices=[0,n%5],building=rng.randrange(256),boarding=rng.randrange(3),disembark=n%3!=0,boatCell=n%5!=0,measure=dict(dirty=n%3,distance=rng.randrange(-1000,1000),tribes=rng.randrange(256)),tribes=[dict(active=bool(rng.randrange(2)),defeatTimer=rng.choice([-1,0,96,97,98])) for _ in range(n%5)]);c['from']=c.pop('from_')
  if mode=='probe':c['tiles']=[dict(i=tile,category=rng.randrange(16),flags=rng.choice([0,512]))]
  if n%4==0:c['blocked']=[[state['walkMask'],bit]]
  elif n%4==1:c['blocked']=[[1-state['walkMask'],bit]]
  cpu.mem_write(0x8a03e4,native_terrains[c['terrain']]);cpu.mem_write(0x96aaba,bytes([255])*8192);cpu.mem_write(0x96caba,bytes([255])*8192)
  for t in c['tiles']:write(0x8a03e4+t['i']*16,'I',t['flags']);write(0x8a03e4+t['i']*16+12,'B',t['category'])
  for m,b in c['blocked']:
   a=(0x96caba if m else 0x96aaba)+(b>>3);write(a,'B',read(a,'B')&~(1<<(b&7)))
  for k,(a,f) in fields.items():write(a,f,(0x8a03e4+g[k]*16 if g[k]>=0 else 0) if k=='cacheCell' else g[k])
  for k,(a,f) in line_fields.items():write(a,f,g['line'][k])
  write(0x64f4a4,'I',ptr(state['currentBoat']));write(0x6513d5,'b',state['candidateCount']);write(0x96aa74,'I',0x96caba if state['walkMask'] else 0x96aaba);write(0x9557c8,'I',person);write(person+0x10,'I',c['p']['flags4'])
  cpu.mem_write(0x651348,bytes(candidates));cpu.mem_write(0x650930,bytes(data));write(0x651344,'I',count);cpu.mem_write(0x9557d0,bytes(result))
  for i,q in enumerate([frm,to]):write(points+i*16,'iiH',q['x'],q['y'],q['flags'])
  write(0x9557a4,'iHBB',c['measure']['distance'],0xa5b6,c['measure']['dirty'],c['measure']['tribes']);write(0x96eabf,'B',len(c['tribes']))
  for i,t in enumerate(c['tribes']):write(0x89d1c8+i*0xc65+0xc20,'B',t['active']);write(0x89d1c8+i*0xc65+0x949,'i',t['defeatTimer'])
  events=[];value=None
  if mode=='prepare':call(0x420dd0,0x9557d0)
  elif mode=='choose':
   call(0x420dd0,0x9557d0)
   for i in c['indices']:call(0x420f80,0x9557d0,i)
  elif mode=='line':call(0x421f30,points,points+16)
  elif mode=='probe':value=[call(0x422020,points,direction,0x64f4a0)&255 for _ in range(c['repeats'])]
  elif mode=='clear':value=call(0x421cb0,points,points+16,frm['flags'])&255
  elif mode=='smooth':value=call(0x421b70,0x650930,c['start'])&255
  else:call(0x422df0,0x9557a4)
  assert read(0x9557a8,'H')==0xa5b6
  expected.append(dict(g=geometry(),state=dict(currentBoat=ident(read(0x64f4a4,'I')),candidateCount=read(0x6513d5,'b'),walkMask=int(read(0x96aa74,'I')==0x96caba)),path=digest(cpu.mem_read(0x650930,2580)),count=read(0x651344,'I'),result=digest(cpu.mem_read(0x9557d0,1033)),measure=dict(distance=read(0x9557a4,'i'),dirty=read(0x9557aa,'B'),tribes=read(0x9557ab,'B')),events=copy.deepcopy(events),value=value));cases.append(c)
 r=subprocess.run(['node','--input-type=module','-e',js],input=json.dumps(dict(mode=mode,cases=cases,terrains=terrains)),capture_output=True,text=True,cwd=root);assert r.returncode==0,r.stderr;actual=json.loads(r.stdout);assert len(actual)==len(expected)
 for i,(a,b) in enumerate(zip(expected,actual)):
  if a!=b:
   failure=Path('/private/tmp/populous-path-geometry-failure.json');failure.write_text(json.dumps(dict(mode=mode,index=i,case=cases[i],native=a,browser=b),indent=2));raise AssertionError((mode,i,str(failure)))
 print(f'PASS: 1,024 native path {mode} comparisons, defined buffers, shared state and consumers',flush=True)
