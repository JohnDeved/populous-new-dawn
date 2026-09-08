"""Compare endpoint/boat classification, path-search control and result packing.
Usage: python scripts/check-native-path-search.py /path/to/d3dpoptb.exe
Wrap preparation, per-candidate solver, smoothing and measurement are supplied.
Result packing also executes natively inside the composed search mode.
"""
import copy,hashlib,json,random,struct,subprocess,sys
from pathlib import Path
from unicorn import UC_HOOK_CODE
from unicorn.x86_const import UC_X86_REG_ESP,UC_X86_REG_EIP,UC_X86_REG_EAX
from decomp import native_cpu,configure_native_constants
root=Path(__file__).resolve().parents[1];exe=Path(sys.argv[1]);cpu,_=native_cpu(exe);configure_native_constants(cpu,exe);rng=random.Random(0x420840)
cpu.mem_map(0x2000000,0x20000);p,out,stack,stop=0x2000000,0x2001000,0x201e000,0x201f000
fields={'searches':(0x64f480,'I'),'landLimit':(0x9557b2,'H'),'checkingPerson':(0x9557c8,'I'),'limit':(0x9557be,'H'),'vehicles':(0x9557c5,'B'),'mode':(0x9557c6,'B'),'currentBoat':(0x64f4a4,'I'),'candidateCount':(0x6513d5,'b'),'candidateIndex':(0x6513d6,'b'),'truncated':(0x6513db,'B'),'walkMask':(0x96aa74,'I')}
def write(a,f,*v):cpu.mem_write(a,struct.pack('<'+f,*v))
def read(a,f):return struct.unpack('<'+f,cpu.mem_read(a,struct.calcsize('<'+f)))[0]
def hashat(a,n):return hashlib.sha256(cpu.mem_read(a,n)).hexdigest()
def ident(ptr):return (ptr-p)//256+1 if ptr else 0
def state():
 s={k:read(a,f) for k,(a,f) in fields.items()};s['checkingPerson']=ident(s['checkingPerson']);s['currentBoat']=ident(s['currentBoat']);s['walkMask']=int(s['walkMask']==0x96caba);return s
def call(a,*args):
 write(stack,'I'*(len(args)+1),stop,*[v&0xffffffff for v in args]);cpu.reg_write(UC_X86_REG_ESP,stack);cpu.emu_start(a,stop,count=3000000);assert cpu.reg_read(UC_X86_REG_EIP)==stop;return cpu.reg_read(UC_X86_REG_EAX)
def leaf(cpu,a,size,u):
 global solve_index
 if a==0x421960 and mode in ['collect','composed']:return
 sp=cpu.reg_read(UC_X86_REG_ESP);result=0
 if a==0x420dd0:events.append(['prepare']);write(0x6513d5,'b',c['candidates'])
 elif a==0x420f80:events.append(['choose',read(sp+8,'I')&255])
 elif a==0x421130:
  s=state();events.append(['solve',s['candidateIndex'],s['mode'],s['walkMask'],s['vehicles']]);result=c['outcomes'][solve_index];boat=c['boats'][solve_index];solve_index+=1;write(0x64f4a4,'I',p+256 if boat else 0)
 elif a==0x421b70:events.append(['smooth',read(0x651344,'I'),hashat(0x650930,2580)])
 elif a==0x422df0:events.append(['measure'])
 elif a==0x421960:events.append(['collect']);write(0x6513db,'B',c['truncated'])
 cpu.reg_write(UC_X86_REG_EAX,result);cpu.reg_write(UC_X86_REG_EIP,read(sp,'I'));cpu.reg_write(UC_X86_REG_ESP,sp+4)
for a in [0x420dd0,0x420f80,0x421130,0x421b70,0x422df0,0x421960]:cpu.hook_add(UC_HOOK_CODE,leaf,begin=a,end=a)
js="""import {createHash} from 'node:crypto';import {pathBoatInCell,collectSearchPath,searchPersonPath} from './app/path-search.ts';let s='';for await(const c of process.stdin)s+=c;const input=JSON.parse(s),hash=b=>createHash('sha256').update(b).digest('hex');
console.log(JSON.stringify(input.cases.map(c=>{const events=[],state=c.state,path={data:Uint8Array.from(c.path),count:c.count},result=Uint8Array.from(c.result),from=Uint8Array.from(c.from),to=Uint8Array.from(c.to),categories=new Uint8Array(16384),p=c.p;
for(const t of c.tiles)categories[t.i]=t.category;
const w={state,path,result,categories,boatsEnabled:c.enabled,landLimit:c.landLimit,humanLimit:c.humanLimit,computerLimit:c.computerLimit,tribes:[{playerType:c.playerType}],cellObjects:cell=>cell===c.cell?c.objects:[]};let si=0;
const e={prepare:()=>{events.push(['prepare']);state.candidateCount=c.candidates;},choose:i=>events.push(['choose',i&255]),solve:()=>{events.push(['solve',state.candidateIndex,state.mode,state.walkMask,state.vehicles]);state.currentBoat=c.boats[si]?2:0;return c.outcomes[si++];},smooth:()=>events.push(['smooth',path.count,hash(path.data)]),measure:()=>events.push(['measure']),collect:()=>{if(input.mode==='composed')state.truncated=Number(collectSearchPath(path,result,c.command));else{events.push(['collect']);state.truncated=c.truncated;}}};
let value;if(input.mode==='boat')value=pathBoatInCell(w,c.cell);else if(input.mode==='collect'){state.truncated=Number(collectSearchPath(path,result,c.command));value=null;}else value=searchPersonPath(w,p,from,to,c.option,c.vehicles,e);
return {state,p,from:[...from],to:[...to],path:hash(path.data),count:path.count,result:hash(result),events,value};})));"""
rules=json.loads((root/'app/original-rules.json').read_text());trim=next(i for i,r in enumerate(rules['personCommands']) if r['flags']&0x4000)
for mode in ['boat','collect','search','composed']:
 cases=[];expected=[]
 for n in range(2048):
  frm=[rng.randrange(256) for _ in range(4)];to=[rng.randrange(256) for _ in range(4)]
  if n%9==0:to[:2]=frm[:2]
  cell=(frm[0]&254)|((frm[1]&254)<<8);tiles={}
  for q in [frm,to]:
   i=((q[1]&254)>>1)*128+((q[0]&254)>>1);tiles[i]=dict(i=i,category=rng.randrange(16))
  data=bytearray(rng.randbytes(2580));count=rng.randrange(13)
  for i in range(count+2):struct.pack_into('<iiH',data,i*10,5120+rng.randrange(256),5120+rng.randrange(256),rng.randrange(65536)&0xff01)
  if n%4==0:
   count=3;struct.pack_into('<iiH',data,0,5200,5200,0);struct.pack_into('<iiH',data,10,5202,5202,0)
   for i in range(3):struct.pack_into('<iiH',data,20+i*10,5200+i,5200+i,1 if i==0 else 0)
  elif n%4==1 and count>2:
   # Equal XY with different flags: compaction must retain the last flags.
   data[30:38]=data[20:28];data[40:48]=data[20:28]
  if n%16==15:
   # Fill the valid output buffer through its byte-count wrap at 256 points.
   count=rng.choice([127,128,255,256]);struct.pack_into('<iiH',data,0,5120,5140,0);struct.pack_into('<iiH',data,10,5120+count-1,5140,0)
   for i in range(count):struct.pack_into('<iiH',data,20+i*10,5120+i,5140,i%2)
  s=dict(searches=rng.choice([0,0xffffffff,rng.getrandbits(32)]),landLimit=rng.randrange(65536),checkingPerson=1,limit=rng.randrange(65536),vehicles=rng.randrange(2),mode=rng.randrange(256),currentBoat=rng.choice([0,2]),candidateCount=rng.randrange(5),candidateIndex=rng.randrange(5),truncated=rng.randrange(2),walkMask=rng.randrange(2))
  ps=dict(id=1,tribe=0,vehicle=rng.choice([0,0,2]),flags4=rng.choice([0,0x4000000,0x2000000,0xffffffff]));objects=[dict(id=i,**{'class':rng.choice([1,4,4,7])},model=rng.randrange(5)) for i in range(2,7)]
  c=dict(state=s,p=ps,from_=frm,to=to,cell=cell,tiles=list(tiles.values()),objects=objects,path=list(data),count=count,result=list(rng.randbytes(1033)),command=trim if n%4==0 else n%35,enabled=n%3!=0,landLimit=rng.getrandbits(32),humanLimit=rng.randrange(256),computerLimit=rng.randrange(256),playerType=n%3,candidates=rng.choice([0,2,4]),outcomes=[rng.choice([0,1,1,2]) for _ in range(17)],boats=[rng.randrange(2) for _ in range(17)],truncated=n%2,option=rng.choice([0,0,1,255,256,65535]),vehicles=bool(n%2));c['from']=c.pop('from_');c['enabled']=int(c['enabled'])
  for k,(a,f) in fields.items():
   value=s[k]
   if k in ['checkingPerson','currentBoat']:value=p+(value-1)*256 if value else 0
   elif k=='walkMask':value=0x96caba if value else 0x96aaba
   write(a,f,value)
  cpu.mem_write(p,bytes(256));write(p+0x24,'H',1);write(p+0x2f,'b',0);write(p+0x9f,'H',ps['vehicle']);write(p+0x10,'I',ps['flags4']);write(0x938830,'B',c['command']);write(0x89d1c8+0xc1f,'B',c['playerType']);write(0x89bc7e,'I',c['enabled']);write(0x5aa450,'I',c['landLimit']);write(0x89ce5c,'B',c['humanLimit']);write(0x89ce5e,'B',c['computerLimit'])
  write(0x890390,'I',0);write(0x890394,'I',p)
  for o in objects:
   q=p+(o['id']-1)*256;cpu.mem_write(q,bytes(256));write(q+0x24,'H',o['id']);write(q+0x2a,'BB',o['class'],o['model']);write(q+0x20,'H',o['id']+1 if o['id']<6 else 0);write(0x890390+o['id']*4,'I',q)
  tile=0x8a03e4+(((cell>>9)&127)*128+((cell&254)>>1))*16;write(tile+6,'H',2)
  for t in c['tiles']:write(0x8a03e4+t['i']*16+12,'B',t['category'])
  cpu.mem_write(0x650930,bytes(data));write(0x651344,'I',count);cpu.mem_write(0x9557d0,bytes(c['result']));cpu.mem_write(out,bytes(frm));cpu.mem_write(out+4,bytes(to));events=[];solve_index=0
  if mode=='boat':value=ident(call(0x4665c0,tile))
  elif mode=='collect':call(0x421960,0x9557d0);value=None
  else:value=call(0x420840,n%2,p,out,out+4,c['option'],int(c['vehicles']))
  expected.append(dict(state=state(),p={**ps,'flags4':read(p+0x10,'I')},from_=list(cpu.mem_read(out,4)),to=list(cpu.mem_read(out+4,4)),path=hashat(0x650930,2580),count=read(0x651344,'I'),result=hashat(0x9557d0,1033),events=copy.deepcopy(events),value=value));expected[-1]['from']=expected[-1].pop('from_');cases.append(c)
  write(tile+6,'H',0)
  for t in c['tiles']:write(0x8a03e4+t['i']*16+12,'B',0)
 r=subprocess.run(['node','--input-type=module','-e',js],input=json.dumps(dict(mode=mode,cases=cases)),capture_output=True,text=True,cwd=root);assert r.returncode==0,r.stderr;actual=json.loads(r.stdout);assert len(actual)==len(expected)
 for i,(a,b) in enumerate(zip(expected,actual)):
  if a!=b:
   path=Path('/private/tmp/populous-path-search-failure.json');path.write_text(json.dumps(dict(mode=mode,index=i,case=cases[i],native=a,browser=b),indent=2));raise AssertionError((mode,i,str(path)))
 print(f'PASS: 2,048 native path {mode} comparisons, owned fields, full buffers and consumers',flush=True)
