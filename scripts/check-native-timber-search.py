"""Execute original resource cell ordering, stock protection and cached queries.
Native cell/fog/descriptor/reservation scans and linked-list pruning run. Structure
outside/work values are supplied geometry/economy consumers. Usage: SCRIPT EXE [--record]
"""
import copy,hashlib,json,random,struct,subprocess,sys
from pathlib import Path
from unicorn import UC_HOOK_CODE
from unicorn.x86_const import UC_X86_REG_ESP,UC_X86_REG_EIP,UC_X86_REG_EAX
from decomp import ROOT,native_cpu,configure_native_constants
exe=Path(sys.argv[1]);cpu,identity=native_cpu(exe);configure_native_constants(cpu,exe);cpu.mem_map(0x2000000,0x80000)
objects,nodes,person,out,stack,stop=0x2000000,0x2040000,0x2050000,0x2051000,0x207d000,0x207e000
record=0x93a7a0;rng=random.Random(0x493910)
def write(a,f,*v):cpu.mem_write(a,struct.pack('<'+f,*v))
def read(a,f):return struct.unpack('<'+f,cpu.mem_read(a,struct.calcsize('<'+f)))[0]
def call(a,*args):
 write(stack,'I'*(len(args)+1),stop,*[v&0xffffffff for v in args]);cpu.reg_write(UC_X86_REG_ESP,stack);cpu.emu_start(a,stop,count=3000000)
 assert cpu.reg_read(UC_X86_REG_EIP)==stop,hex(cpu.reg_read(UC_X86_REG_EIP));return cpu.reg_read(UC_X86_REG_EAX)
def hook(c,a,size,user):
 sp=c.reg_read(UC_X86_REG_ESP);ptr=read(sp+4,'I');id_=read(ptr+0x24,'H');b=next(b for b in case['buildings'] if b['id']==id_)
 if a in [0x4b9fc0,0x4044b0]:
  point=b['outside'];write(read(sp+8,'I'),'HH',((point&254)+1)*256,(((point>>8)&254)+1)*256)
 elif a==0x40b4f0:
  write(read(sp+8,'I'),'i',b['needed']+100);write(read(sp+12,'I'),'i',100)
 c.reg_write(UC_X86_REG_EAX,0);c.reg_write(UC_X86_REG_EIP,read(sp,'I'));c.reg_write(UC_X86_REG_ESP,sp+4)
for a in [0x4b9fc0,0x4044b0,0x40b4f0]:cpu.hook_add(UC_HOOK_CODE,hook,begin=a,end=a)
def offset(cell,x,y):return (((cell&255)+x)&255)|((((cell>>8)+y)&255)<<8)
def block_cells(cell):return [cell,offset(cell,0,2),offset(cell,2,2),offset(cell,2,0)]
def index(cell):return ((cell>>9)&127)*128+((cell>>1)&127)
cases=[];expected=[]
for mode in ['ordered','loose','block','protect','pick','availability','query']:
 for trial in range(768):
  center=rng.choice([0,2,126,128,252,254])|(rng.choice([0,2,126,128,252,254])<<8)
  block=rng.choice([center,center&0xfcfc,offset(center,4,0)&0xfcfc,offset(center,-4,-4)&0xfcfc])
  candidates=[dict(cell=b,cost=i*4,flags=rng.choice([1,1,3,5,7])) for i,b in enumerate(dict.fromkeys([block,center&0xfcfc,offset(center,8,8)&0xfcfc]))]
  search=dict(stage=2,stages=5,tribe=rng.choice([-1,0,1]),flags=rng.randrange(256),center=center,angle=trial%4*512,unchecked=sum(not(n['flags']&2) for n in candidates),age=rng.choice([-32768,-1,0,13,320]),idle=rng.choice([0,1,320]),person=77,candidates=candidates)
  cells={};scene=[];buildings=[]
  points=list(dict.fromkeys([p for n in candidates for p in block_cells(n['cell'])]+block_cells(block)))
  for cell in points:
   ids=[]
   for j in range(rng.randrange(4)):
    id_=100+len(scene);ids.append(id_);scene.append(dict(id=id_,**{'class':rng.choice([0,1,5,5])},model=rng.choice([1,6,7,11,12]),flags4=rng.choice([0,0,0x100000]),wood=rng.choice([-1,0,99,100,200,700])))
   cells[cell]=dict(cell=cell,flags=rng.choice([0,8,65535]),building=0,objects=ids)
  for b in range(4):
   id_=10+b;outside=rng.choice(points);buildings.append(dict(id=id_,**{'class':rng.choice([0,2,9])},flags2=rng.choice([0,0,1]),outside=outside,needed=rng.choice([-1,0,100,300,700])))
   for x,y in [(2,0),(-2,0),(0,2),(0,-2)]:
    cell=offset(outside,x,y);cells.setdefault(cell,dict(cell=cell,flags=8,building=0,objects=[]))
    if rng.randrange(3)==0:cells[cell]['building']=id_|rng.choice([0,1024])
  case=dict(mode=mode,center=center,block=block,search=search,cells=list(cells.values()),objects=scene,buildings=buildings,landFlags=rng.choice([0,8]),levelFlags=rng.choice([0,4]),playerTribe=0,exclude=bool(trial&1),protect=bool(trial&2),wait=bool(trial&4),missing=trial%17==0)
  cpu.mem_write(0x8a03e4,bytes(16384*16));cpu.mem_write(0x890390,bytes(4096));cpu.mem_write(record,bytes(24));cpu.mem_write(out,bytes(32))
  write(0x89c661,'I',case['landFlags']);write(0x895da8,'I',case['levelFlags']);write(0x89c6f0,'b',0)
  for o in scene:
   ptr=objects+o['id']*256;cpu.mem_write(ptr,bytes(256));write(0x890390+o['id']*4,'I',ptr);write(ptr+0x24,'H',o['id']);write(ptr+0x2a,'BB',o['class'],o['model']);write(ptr+0x10,'I',o['flags4']);write(ptr+0x84,'h',o['wood'])
  for b in buildings:
   ptr=objects+b['id']*256;cpu.mem_write(ptr,bytes(256));write(0x890390+b['id']*4,'I',ptr);write(ptr+0x24,'H',b['id']);write(ptr+0x2a,'B',b['class']);write(ptr+0xc,'I',b['flags2'])
  for cell in cells.values():
   ptr=0x8a03e4+index(cell['cell'])*16;write(ptr,'I',cell['flags']);write(ptr+8,'H',cell['building']);write(ptr+6,'H',cell['objects'][0] if cell['objects'] else 0)
   for j,id_ in enumerate(cell['objects']):write(objects+id_*256+0x20,'H',cell['objects'][j+1] if j+1<len(cell['objects']) else 0)
  write(person+0x24,'H',1)
  write(record,'BBbBHHHhhhH',search['stage'],search['stages'],search['tribe'],search['flags'],center,search['angle'],len(candidates),search['unchecked'],search['age'],search['idle'],search['person'])
  write(record+20,'I',nodes if candidates else 0);write(0x93a778,'i',search['unchecked'])
  for i,n in enumerate(candidates):write(nodes+i*14,'HhBBII',n['cell'],n['cost'],n['flags'],0,nodes+(i-1)*14 if i else 0,nodes+(i+1)*14 if i+1<len(candidates) else 0)
  result=None
  if mode=='ordered':
   call(0x494720,out,center,block);result=[dict(cost=read(out+i*4,'h'),cell=read(out+i*4+2,'H')) for i in range(4)]
  elif mode=='loose':
   ptr=call(0x493f10,0x8a03e4+index(block)*16,search['tribe']);result=read(ptr+0x24,'H') if ptr else 0
  elif mode=='block':result=bool(call(0x493d50,block,search['tribe'])&255)
  elif mode=='protect':result=bool(call(0x494490,block,search['tribe'])&255)
  elif mode=='pick':
   ptr=call(0x494360,record,nodes,int(case['exclude']),int(case['protect']));result=read(ptr+0x24,'H') if ptr else 0
  elif mode=='availability':call(0x495390,record)
  else:
   status=call(0x493910,-1 if case['missing'] else 0,out,person,int(case['wait']),int(case['exclude']))&255;ptr=read(out,'I');result=dict(status=status,target=read(ptr+0x24,'H') if ptr else 0)
  node_results=[dict(cell=read(nodes+i*14,'H'),cost=read(nodes+i*14+2,'h'),flags=read(nodes+i*14+4,'B')) for i in range(len(candidates))]
  linked=[];ptr=read(record+20,'I');prev=0
  while ptr:
   assert read(ptr+6,'I')==prev;linked.append(node_results[(ptr-nodes)//14]);prev=ptr;ptr=read(ptr+10,'I')
  assert len(linked)==read(record+8,'H')
  out_search={**search,'flags':read(record+3,'B'),'unchecked':read(record+10,'h'),'age':read(record+12,'h'),'idle':read(record+14,'h'),'person':read(record+16,'H'),'candidates':linked}
  cases.append(case);expected.append(dict(result=result,search=out_search,nodes=node_results,unchecked=read(0x93a778,'i')))
js="""import {timberSearchCase} from './scripts/compare-timber-search.mjs';let s='';for await(const c of process.stdin)s+=c;console.log(JSON.stringify(JSON.parse(s).map(timberSearchCase)));"""
r=subprocess.run(['node','--input-type=module','-e',js],input=json.dumps(cases),capture_output=True,text=True,cwd=ROOT);assert r.returncode==0,r.stderr
actual=json.loads(r.stdout);assert len(actual)==len(expected)
for i,(a,e) in enumerate(zip(actual,expected)):
 if a!=e:
  Path('/private/tmp/populous-timber-search-mismatch.json').write_text(json.dumps(dict(index=i,case=cases[i],actual=a,expected=e),indent=2));raise AssertionError('See /private/tmp/populous-timber-search-mismatch.json')
print(f'PASS: {len(cases)} native timber query/leaf calls',flush=True)

# The cache lifecycle runs real indexed searches, allocation, linked lists,
# availability, scheduler and expiry. Only candidate route-cost results are supplied.
data=(exe.parent/'data/mwsearch.dat').read_bytes()
assert hashlib.sha256(data).hexdigest()=='0c39b12d160658863c2df89aa34484dff459e48ea0b5634658b7473ca940fae0'
cpu.mem_write(0x8929cd,data)
keys=['active','expanding','unchecked','expansionInterval','routeInterval','expansionBudget','routeBudget','expansionTimer','routeTimer','expansionCursor','routeCursor']
node_pool=0x93b2e0;owner_address=out+64
empty=dict(stage=0,stages=5,tribe=0,flags=0,center=0,angle=0,unchecked=0,age=0,idle=0,person=0,candidates=[])
def route_hook(c,a,size,user):
 sp=c.reg_read(UC_X86_REG_ESP);ptr=read(sp+12,'I');costptr=read(sp+16,'I');cost=read(costptr,'h')
 step=case['routes'][len(events)%len(case['routes'])]
 events.append([read(sp+4,'H'),read(sp+8,'H'),read(ptr+0x24,'H'),read(sp+20,'b'),cost])
 if step['cost'] is not None:write(costptr,'h',step['cost'])
 c.reg_write(UC_X86_REG_EAX,step['result']);c.reg_write(UC_X86_REG_EIP,read(sp,'I'));c.reg_write(UC_X86_REG_ESP,sp+4)
cpu.hook_add(UC_HOOK_CODE,route_hook,begin=0x494d10,end=0x494d10)
def snapshot(result):
 records=[];all_nodes=set()
 for i in range(120):
  ptr=record+i*24
  values=struct.unpack('<BBbBHHHhhhH',cpu.mem_read(ptr,18));s=dict(zip(['stage','stages','tribe','flags','center','angle','count','unchecked','age','idle','person'],values))
  linked=[];node=read(ptr+20,'I');prev=0
  while node:
   assert node_pool<=node<node_pool+7680*14 and node not in all_nodes
   assert read(node+6,'I')==prev
   all_nodes.add(node);linked.append(dict(cell=read(node,'H'),cost=read(node+2,'h'),flags=read(node+4,'B')))
   prev=node;node=read(node+10,'I')
  assert len(linked)==s.pop('count');s['candidates']=linked
  if s!=empty:records.append(dict(index=i,**s))
 globals_=dict(zip(keys,struct.unpack('<11i',cpu.mem_read(0x93a770,44))));globals_['candidates']=len(all_nodes)
 return dict(result=result,**{'globals':globals_},records=records,owners=[read(owner_address+i,'b') for i in range(len(case['owners']))],indexed=list(cpu.mem_read(0x89290d,192)),events=copy.deepcopy(events))
pool_cases=[];pool_expected=[]
for trial in range(256):
 case=copy.deepcopy(cases[(trial*17)%len(cases)])
 case['owners']=[-1,0,119];case['routes']=[dict(result=rng.choice([0,0,1,2]),cost=rng.choice([None,0,4,50,99,32767,-32768])) for _ in range(8)]
 case['dead']=rng.sample([1,2,3],rng.randrange(4));case['records']=[];case['ops']=[]
 # Dense samples across all five expansion segments, including wrapped entrances.
 center=case['center'];scene=case['objects'];cells={c['cell']:c for c in case['cells']}
 for j in range(96):
  cell=offset(center,rng.randrange(-16,17)*2,rng.randrange(-16,17)*2)
  if cell in cells:continue
  id_=100+len(scene);scene.append(dict(id=id_,**{'class':5},model=6,flags4=0,wood=100))
  cells[cell]=dict(cell=cell,flags=rng.choice([0,8]),building=0,objects=[id_])
 case['cells']=list(cells.values())
 for j in [0,1,119]:
  s=copy.deepcopy(empty);s.update(center=offset(center,j%3*8,j%3*8)&0xfefe,stage=rng.randrange(5),angle=rng.randrange(65536),flags=rng.choice([1,3,3]),tribe=rng.choice([-1,0,1]),person=rng.choice([0,1,2,3]),age=rng.choice([0,32767,-32768]),idle=rng.choice([0,319,320,32767]))
  s['candidates']=[dict(cell=offset(s['center'],k*4,0)&0xfcfc,cost=rng.choice([0,4,8,16]),flags=rng.choice([1,1,3,7])) for k in range(4)]
  s['candidates'].sort(key=lambda n:n['cost']);s['unchecked']=sum(not(n['flags']&2) for n in s['candidates'])
  case['records'].append(dict(index=j,**s))
 case['globals']=dict(active=3,expanding=sum(bool(s['flags']&2) for s in case['records']),unchecked=sum(s['unchecked'] for s in case['records']),candidates=12,expansionInterval=1,routeInterval=3,expansionBudget=2,routeBudget=1,expansionTimer=rng.choice([0,1,2]),routeTimer=rng.choice([0,1,2,3]),expansionCursor=rng.choice([0,1,119,120]),routeCursor=rng.choice([0,1,119,120]))
 if trial in [240,241,242,243,244,245,246]:
  # All cache slots occupied; threshold cases include candidate-pool exhaustion.
  total={240:0,241:7680,242:299,243:300,244:499,245:500,246:1000}[trial]
  case['records']=[]
  for j in range(120):
   s=copy.deepcopy(empty);s.update(center=(j*4)|0x4000,flags=3,person=1,tribe=0)
   count=total//120+int(j<total%120)
   s['candidates']=[dict(cell=k*4,cost=k,flags=1) for k in range(count)];s['unchecked']=count
   case['records'].append(dict(index=j,**s))
  case['globals'].update(active=120,expanding=120,unchecked=total,candidates=total)
 cpu.mem_write(0x8a03e4,bytes(16384*16));cpu.mem_write(0x890390,bytes(4096));cpu.mem_write(0x89290d,bytes(192));call(0x493a40)
 write(0x89c661,'I',case['landFlags']);write(0x895da8,'I',case['levelFlags']);write(0x89c6f0,'b',0)
 for o in scene:
  ptr=objects+o['id']*256;cpu.mem_write(ptr,bytes(256));write(0x890390+o['id']*4,'I',ptr);write(ptr+0x24,'H',o['id']);write(ptr+0x2a,'BB',o['class'],o['model']);write(ptr+0x10,'I',o['flags4']);write(ptr+0x84,'h',o['wood'])
 for b in case['buildings']:
  ptr=objects+b['id']*256;cpu.mem_write(ptr,bytes(256));write(0x890390+b['id']*4,'I',ptr);write(ptr+0x24,'H',b['id']);write(ptr+0x2a,'B',b['class']);write(ptr+0xc,'I',b['flags2'])
 for cell in case['cells']:
  ptr=0x8a03e4+index(cell['cell'])*16;write(ptr,'I',cell['flags']);write(ptr+8,'H',cell['building']);write(ptr+6,'H',cell['objects'][0] if cell['objects'] else 0)
  for j,id_ in enumerate(cell['objects']):write(objects+id_*256+0x20,'H',cell['objects'][j+1] if j+1<len(cell['objects']) else 0)
 for id_ in [1,2,3]:
  ptr=objects+id_*256;cpu.mem_write(ptr,bytes(256));write(0x890390+id_*4,'I',ptr);write(ptr+0x24,'H',id_);write(ptr+0x2a,'B',1);write(ptr+0x2f,'b',id_-1);write(ptr+0xc,'I',int(id_ in case['dead']))
 next_node=node_pool
 for s in case['records']:
  ptr=record+s['index']*24;ns=s['candidates']
  write(ptr,'BBbBHHHhhhH',s['stage'],s['stages'],s['tribe'],s['flags'],s['center'],s['angle'],len(ns),s['unchecked'],s['age'],s['idle'],s['person']);write(ptr+20,'I',next_node if ns else 0)
  for j,n in enumerate(ns):write(next_node+j*14,'HhBBII',n['cell'],n['cost'],n['flags'],0,next_node+(j-1)*14 if j else 0,next_node+(j+1)*14 if j+1<len(ns) else 0)
  next_node+=len(ns)*14
 for j,key in enumerate(keys):write(0x93a770+j*4,'i',case['globals'][key])
 for j,idx in enumerate(case['owners']):write(owner_address+j,'b',idx)
 events=[];results=[]
 # Explicit expansion + route checks, then interleaved scheduler/keepalive/query/
 # invalidate/refresh: snapshots prove ownership and ordering across operations.
 for tick in range(1 if 240 <= trial <= 246 else 20):
  action=['expand','routes','step','keep','query','invalidate','refresh'][tick%7]
  if action=='expand':
   eligible=[i for i in range(120) if read(record+i*24+3,'B')&2]
   if not eligible:action='refresh'
  if trial==240:action='refresh'
  if 242 <= trial <= 246:action='invalidate'
  result=None
  if action=='expand':
   op=dict(action=action,index=rng.choice(eligible));call(0x493fa0,record+op['index']*24)
  elif action=='routes':
   op=dict(action=action,start=rng.choice([0,1,119,120]),budget=rng.choice([0,1,2,3,8]));result=call(0x494a20,op['start'],op['budget'])
  elif action=='step':
   op=dict(action=action);call(0x493af0)
  elif action=='keep':
   op=dict(action=action,index=rng.choice([-1,0,1,119]));call(0x4935a0,op['index'])
  elif action=='query':
   op=dict(action=action,index=rng.choice([-1,0,1,119]),person=rng.choice([1,2,3]),wait=bool(tick&1),exclude=bool(trial&1));write(out,'I',0)
   status=call(0x493910,op['index'],out,objects+op['person']*256,op['wait'],op['exclude'])&255;ptr=read(out,'I');result=dict(status=status,target=read(ptr+0x24,'H') if ptr else 0)
  elif action=='invalidate':
   op=dict(action=action,owner=rng.randrange(3),center=0x4000 if 242<=trial<=246 else rng.choice([center,offset(center,8,8),offset(center,70,70)]));call(0x493770,owner_address+op['owner'],op['center'])
  else:
   id_=rng.choice([0,1,2,3]);op=dict(action=action,owner=rng.randrange(3),center=rng.choice([center,offset(center,8,8),offset(center,70,70)])|0x101,angle=rng.randrange(65536),person=dict(id=id_,tribe=id_-1) if id_ else None)
   result=call(0x4935c0,owner_address+op['owner'],op['center'],op['angle'],objects+id_*256 if id_ else 0);result=(result^0x80000000)-0x80000000
  case['ops'].append(op);results.append(snapshot(result))
 pool_cases.append(case);pool_expected.append(results)
js="""import {timberPoolCase} from './scripts/compare-timber-search.mjs';let s='';for await(const c of process.stdin)s+=c;console.log(JSON.stringify(JSON.parse(s).map(timberPoolCase)));"""
r=subprocess.run(['node','--input-type=module','-e',js],input=json.dumps(pool_cases),capture_output=True,text=True,cwd=ROOT);assert r.returncode==0,r.stderr
actual=json.loads(r.stdout);assert len(actual)==len(pool_expected)
for i,(a,e) in enumerate(zip(actual,pool_expected)):
 for tick,(av,ev) in enumerate(zip(a,e)):
  if av!=ev:
   Path('/private/tmp/populous-timber-pool-mismatch.json').write_text(json.dumps(dict(index=i,tick=tick,case=pool_cases[i],actual=av,expected=ev),indent=2));raise AssertionError('See /private/tmp/populous-timber-pool-mismatch.json')
print(f'PASS: {sum(len(c["ops"]) for c in pool_cases)} native cache lifecycle operations; real expansion/indexed searches, node allocation/reordering, scheduler, pruning and expiry; route costs supplied',flush=True)
if '--record' in sys.argv:
 indexes=range(0,len(cases),17);pool_indexes=sorted(set(range(0,len(pool_cases),17))|set(range(240,247)))
 (ROOT/'tests/fixtures/timber-search.json').write_text(json.dumps(dict(executableSha256=identity['sha256'],cases=[cases[i] for i in indexes],expected=[expected[i] for i in indexes],poolCases=[pool_cases[i] for i in pool_indexes],poolExpected=[pool_expected[i] for i in pool_indexes]),separators=(',',':'))+'\n')
