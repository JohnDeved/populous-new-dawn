"""Compare both obstacle walkers, route merging and the composed path solver.
Usage: python scripts/check-native-path-solver.py /path/to/d3dpoptb.exe
Line setup/probing execute inside smoothing; only building/boat consumers are supplied.
"""
import copy,hashlib,json,random,struct,subprocess,sys
from pathlib import Path
from unicorn import UC_HOOK_CODE
from unicorn.x86_const import UC_X86_REG_ESP,UC_X86_REG_EIP,UC_X86_REG_EAX
from decomp import native_cpu,configure_native_constants
root=Path(__file__).resolve().parents[1];exe=Path(sys.argv[1]);cpu,_=native_cpu(exe);configure_native_constants(cpu,exe);rng=random.Random(0x421130)
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
 if mode=='search':
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
state_fields={'searches':(0x64f480,'I'),'landLimit':(0x9557b2,'H'),'checkingPerson':(0x9557c8,'I'),'limit':(0x9557be,'H'),'vehicles':(0x9557c5,'B'),'mode':(0x9557c6,'B'),'currentBoat':(0x64f4a4,'I'),'candidateCount':(0x6513d5,'b'),'candidateIndex':(0x6513d6,'b'),'truncated':(0x6513db,'B'),'walkMask':(0x96aa74,'I')}
stats_fields={'attempts':0x64f484,'detours':0x64f488,'steps':0x64f48c,'limited':0x64f490,'stepLimit':0x59bd8c}
def pointat(a):return dict(zip(['x','y','flags'],struct.unpack('<iiH',cpu.mem_read(a,10))))
def putpoint(a,p):write(a,'iiH',p['x'],p['y'],p['flags'])
def obstacle(side):
 a=0x64f4aa+side*0xa43;cache=read(a,'I')
 return dict(path=dict(data=digest(cpu.mem_read(a+10,2580)),count=read(a+0xa1e,'I')),cacheCell=(cache-0x8a03e4)//16 if cache else -1,cacheResult=read(a+8,'B'),currentBoat=ident(read(a+4,'I')),origin=pointat(a+0xa22),point=pointat(a+0xa2c),rotation=read(a+0xa36,'i'),direction=read(a+0xa3a,'i'),eligible=read(a+0xa42,'B'))
def searchstate():
 s={k:read(a,f) for k,(a,f) in state_fields.items()}
 for k in ['checkingPerson','currentBoat']:s[k]=ident(s[k])
 s['walkMask']=int(s['walkMask']==0x96caba);return s
js="""import {createHash} from 'node:crypto';import {stepPathObstacle,appendObstaclePath,solvePersonPath} from './app/path-solver.ts';import {searchPersonPath,collectSearchPath} from './app/path-search.ts';import {preparePathCandidates,choosePathCandidate,clearPathSegment,smoothSearchPath,measureSearchPath} from './app/path-geometry.ts';
let input='';for await(const b of process.stdin)input+=b;const {cases,mode,terrains}=JSON.parse(input),hash=b=>createHash('sha256').update(b).digest('hex');
console.log(JSON.stringify(cases.map(c=>{const g=c.g,solver=c.s;g.candidates=Uint8Array.from(g.candidates);for(const o of solver.obstacles)o.path.data=Uint8Array.from(o.path.data);
const path={data:Uint8Array.from(c.path),count:c.count},state=c.state,result=Uint8Array.from(c.result),terrain=terrains[c.terrain],categories=Uint8Array.from(terrain.categories),flags=Uint32Array.from(terrain.flags),walkMasks=[new Uint8Array(8192).fill(255),new Uint8Array(8192).fill(255)],events=[],from=Uint8Array.from(c.from),to=Uint8Array.from(c.to);
for(const [m,b] of c.blocked)walkMasks[m][b>>3]&=~(1<<(b&7));
const w={state,path,result,categories,flags,walkMasks,boatsEnabled:c.enabled,landLimit:32,humanLimit:c.searchLimit,computerLimit:c.searchLimit,tribes:[{playerType:1}],cellObjects:cell=>c.startBoat&&cell===c.cell?[{id:2,class:4,model:1}]:[]},e={buildingAccess:cell=>{events.push(['building',cell]);return c.building;},boardingBoat:cell=>{events.push(['boarding',cell]);return c.boarding;},disembark:(boat,p)=>{events.push(['disembark',boat,p.x,p.y]);return !!c.disembark;},boatCell:(cell,boat)=>{events.push(['boatCell',cell,boat]);return !!c.boatCell;}};let value=null;
if(mode==='step')for(let i=0;i<c.repeats;i++)stepPathObstacle(w,g,solver,path,c.p,c.side,e);else if(mode==='merge')value=Number(appendObstaclePath(w,solver,c.side));else if(mode==='solve')value=solvePersonPath(w,g,solver,c.p,e);
else value=searchPersonPath(w,c.p,from,to,c.option,c.vehicles,{prepare:()=>preparePathCandidates(w,g),choose:i=>choosePathCandidate(w,g,i),solve:()=>solvePersonPath(w,g,solver,c.p,e),smooth:()=>smoothSearchPath(path,0,(a,b,k)=>clearPathSegment(w,g,c.p,a,b,k,e)),measure:()=>measureSearchPath(path,g.line,c.measure,terrain.regions,c.tribes),collect:()=>{state.truncated=Number(collectSearchPath(path,result,0));}});
if(mode==='search')for(let i=4;i<12;i++){g.candidates[i*10+8]=0;g.candidates[i*10+9]=0;}g.candidates=[...g.candidates];for(const o of solver.obstacles)o.path.data=hash(o.path.data);
return {g,s:solver,state,path:hash(path.data),count:path.count,result:hash(result),p:c.p,from:[...from],to:[...to],measure:c.measure,events,value};})));"""
def makepath(start,end,count):
 data=bytearray(rng.randbytes(2580));struct.pack_into('<iiH',data,0,*start.values());struct.pack_into('<iiH',data,10,*end.values())
 for i in range(count):struct.pack_into('<iiH',data,20+i*10,start['x']+rng.randrange(-4,5),start['y']+rng.randrange(-4,5),rng.randrange(65536)&0xff01)
 if count>1 and rng.randrange(2):data[30:38]=data[20:28]
 return list(data)
for mode in ['step','merge','solve','search']:
 cases=[];expected=[];outcomes={}
 for n in range(1024):
  start=dict(x=5120+rng.randrange(256),y=5120+rng.randrange(256),flags=rng.randrange(65536)&0xff01)
  end=dict(x=start['x']+rng.randrange(-24,25),y=start['y']+rng.randrange(-24,25),flags=rng.randrange(65536)&0xff01)
  if end['x']==start['x'] and end['y']==start['y']:end['x']+=1
  if n<2:start=dict(x=5370,y=5140,flags=0);end=dict(x=5382,y=5140,flags=0)
  count=rng.randrange(9);data=makepath(start,end,count);candidates=bytearray(rng.randbytes(120))
  for i in range(4):struct.pack_into('<ii',candidates,i*10,0,0)
  for i,(dx,dy) in enumerate([(-2,-2),(-2,0),(-2,2),(0,-2),(0,2),(2,-2),(2,0),(2,2)]):struct.pack_into('<ii',candidates,40+i*10,(end['x']&~1)+dx,(end['y']&~1)+dy)
  g={k:rng.randrange(256) for k in fields};g.update(cacheCell=-1,leftState=3 if n%5 else n%4,rightState=3 if n%7 else n%4,line={k:rng.randrange(-256,257) if f=='i' else rng.randrange(256) for k,(a,f) in line_fields.items()},candidates=list(candidates))
  s={k:rng.getrandbits(32) for k in stats_fields};s.update(stepLimit=1500 if n%4==0 else rng.choice([0,4,16,64,128]),tribeRequests=[rng.randrange(65536) for _ in range(4)],obstacles=[])
  for side in range(2):
   current={**start,'x':start['x']+side};s['obstacles'].append(dict(path=dict(data=makepath(start,end,count),count=count),cacheCell=-1,cacheResult=rng.randrange(256),currentBoat=rng.randrange(3),origin=copy.deepcopy(start),point=current,rotation=-1 if side else 1,direction=rng.randrange(4),eligible=n%2))
  state={k:0 for k in state_fields};state.update(searches=rng.getrandbits(32),checkingPerson=1,limit=rng.choice([1,2,4,16,32,64,255,65535] if mode in ['step','merge'] else [1,2,4,16,32,64]),vehicles=n%2,mode=rng.choice([0,0,1,2,255]),currentBoat=rng.randrange(3),walkMask=n%2)
  frm=[start['x']&255,start['y']&255,start['flags']&255,rng.randrange(256)];to=[end['x']&255,end['y']&255,end['flags']&255,rng.randrange(256)];packed=(frm[0]&254)|((frm[1]&254)<<8)
  c=dict(g=g,s=s,state=state,path=data,count=count,result=list(rng.randbytes(1033)),terrain=n%4,blocked=[],p=dict(id=1,tribe=0,vehicle=n%3==0 and 2 or 0,flags4=rng.choice([0,0,1,2,4,0x10000,0x10007,0xffffffff])),from_=frm,to=to,cell=packed,startBoat=n%3==0,enabled=n%5!=0,searchLimit=rng.choice([1,2,16,32,64]),option=rng.choice([0,0,1,2,255]),vehicles=n%2==0,side=n%2,repeats=8 if n%3==0 else 1,building=rng.choice([0,0,1,2,3,4]),boarding=rng.randrange(3),disembark=n%3!=0,boatCell=n%5!=0,measure=dict(dirty=n%3,distance=rng.randrange(-1000,1000),tribes=rng.randrange(256)),tribes=[dict(active=bool(rng.randrange(2)),defeatTimer=rng.choice([-1,0,96,97,98])) for _ in range(n%5)]);c['from']=c.pop('from_')
  if n%2==0:
   for x in range(-2,3):
    for y in range(-2,3):
     if rng.randrange(2):c['blocked'].append([n%2,((frm[1]+y)&255)*256+((frm[0]+x)&255)])
  if n<2:
   c.update(terrain=0,startBoat=False,enabled=False,vehicles=False,option=0,searchLimit=64,blocked=[[m,y*256+(x&255)] for m in range(2) for x in range(252,258) for y in range(18,23)]);c['p'].update(vehicle=0,flags4=0);state.update(limit=64,vehicles=0,mode=0,walkMask=0);s['stepLimit']=1500
   if n==1:c['blocked'] += [[m,20*256+6] for m in range(2)]
  cpu.mem_write(0x8a03e4,native_terrains[c['terrain']]);cpu.mem_write(0x96aaba,bytes([255])*8192);cpu.mem_write(0x96caba,bytes([255])*8192)
  for m,b in c['blocked']:
   a=(0x96caba if m else 0x96aaba)+(b>>3);write(a,'B',read(a,'B')&~(1<<(b&7)))
  for side,o in enumerate(s['obstacles']):
   a=0x64f4aa+side*0xa43;write(a,'IIB',0,ptr(o['currentBoat']),o['cacheResult']);cpu.mem_write(a+10,bytes(o['path']['data']));write(a+0xa1e,'I',o['path']['count']);putpoint(a+0xa22,o['origin']);putpoint(a+0xa2c,o['point']);write(a+0xa36,'ii',o['rotation'],o['direction']);write(a+0xa42,'B',o['eligible'])
  for k,(a,f) in fields.items():write(a,f,(0x8a03e4+g[k]*16 if g[k]>=0 else 0) if k=='cacheCell' else g[k])
  for k,(a,f) in line_fields.items():write(a,f,g['line'][k])
  for k,(a,f) in state_fields.items():
   value=state[k]
   if k in ['checkingPerson','currentBoat']:value=ptr(value)
   elif k=='walkMask':value=0x96caba if value else 0x96aaba
   write(a,f,value)
  for k,a in stats_fields.items():write(a,'I',s[k])
  for i,t in enumerate(s['tribeRequests']):write(0x9557b6+i*2,'H',t)
  cpu.mem_write(person,bytes(768));write(person+0x10,'I',c['p']['flags4']);write(person+0x2f,'b',0);write(person+0x9f,'H',c['p']['vehicle'])
  for i in [1,2,3]:write(0x890390+i*4,'I',ptr(i));write(ptr(i)+0x24,'H',i)
  write(ptr(2)+0x2a,'BB',4,1);write(0x89bc7e,'I',c['enabled'])
  if c['startBoat']:write(0x8a03e4+((frm[1]>>1)*128+(frm[0]>>1))*16+6,'H',2)
  write(0x89d1c8+0xc1f,'B',1);write(0x5aa450,'I',32);write(0x89ce5c,'B',c['searchLimit']);write(0x89ce5e,'B',c['searchLimit']);write(0x938830,'B',0)
  cpu.mem_write(0x651348,bytes(candidates));cpu.mem_write(0x650930,bytes(data));write(0x651344,'I',count);cpu.mem_write(0x9557d0,bytes(c['result']));cpu.mem_write(points,bytes(frm+to))
  write(0x9557a4,'iHBB',c['measure']['distance'],0xa5b6,c['measure']['dirty'],c['measure']['tribes']);write(0x96eabf,'B',len(c['tribes']))
  for i,t in enumerate(c['tribes']):write(0x89d1c8+i*0xc65+0xc20,'B',t['active']);write(0x89d1c8+i*0xc65+0x949,'i',t['defeatTimer'])
  events=[];value=None
  if mode=='step':
   for i in range(c['repeats']):call(0x4222d0,c['side'])
  elif mode=='merge':value=call(0x4229a0,c['side'])&255
  elif mode=='solve':value=call(0x421130)&255
  else:value=call(0x420840,0,person,points,points+4,c['option'],int(c['vehicles']))&255
  outcomes[str(value)]=outcomes.get(str(value),0)+1
  expected.append(dict(g=geometry(),s={**{k:read(a,'I') for k,a in stats_fields.items()},'tribeRequests':[read(0x9557b6+i*2,'H') for i in range(4)],'obstacles':[obstacle(i) for i in range(2)]},state=searchstate(),path=digest(cpu.mem_read(0x650930,2580)),count=read(0x651344,'I'),result=digest(cpu.mem_read(0x9557d0,1033)),p={**c['p'],'flags4':read(person+0x10,'I')},from_=list(cpu.mem_read(points,4)),to=list(cpu.mem_read(points+4,4)),measure=dict(distance=read(0x9557a4,'i'),dirty=read(0x9557aa,'B'),tribes=read(0x9557ab,'B')),events=copy.deepcopy(events),value=value));expected[-1]['from']=expected[-1].pop('from_');cases.append(c)
 r=subprocess.run(['node','--input-type=module','-e',js],input=json.dumps(dict(mode=mode,cases=cases,terrains=terrains)),capture_output=True,text=True,cwd=root);assert r.returncode==0,r.stderr;actual=json.loads(r.stdout);assert len(actual)==len(expected)
 for i,(a,b) in enumerate(zip(expected,actual)):
  if a!=b:
   failure=Path('/private/tmp/populous-path-solver-failure.json');failure.write_text(json.dumps(dict(mode=mode,index=i,case=cases[i],native=a,browser=b),indent=2));raise AssertionError((mode,i,str(failure)))
 print(f'PASS: 1,024 native path {mode} comparisons, full route buffers, globals and consumers; outcomes {outcomes}',flush=True)
