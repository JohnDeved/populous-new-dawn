"""Run complete original light allocation, refresh and cleanup, without callee stubs.
Usage: python scripts/check-native-terrain-light.py /path/to/d3dpoptb.exe [--record]
The optional sun-rotation graphics setting is disabled; local lighting is varied.
"""
import hashlib,json,random,struct,subprocess,sys
from pathlib import Path
from unicorn.x86_const import UC_X86_REG_ESP,UC_X86_REG_EIP,UC_X86_REG_EAX
from decomp import native_cpu,ROOT
exe=Path(sys.argv[1]);cpu,identity=native_cpu(exe);cpu.mem_map(0x2000000,0x20000)
stack,stop=0x201d000,0x201e000
base,slots,count,people=0x8a03e4,0x937c46,0x96aa7c,0x8e0428
rng=random.Random(0x401350);calls=0
def write(a,f,*v):cpu.mem_write(a,struct.pack('<'+f,*v))
def read(a,f):return struct.unpack('<'+f,cpu.mem_read(a,struct.calcsize('<'+f)))[0]
def call(a,*args):
 global calls
 calls+=1
 write(stack,'I'*(len(args)+1),stop,*[v&0xffffffff for v in args]);cpu.reg_write(UC_X86_REG_ESP,stack)
 cpu.emu_start(a,stop,count=4000000)
 assert cpu.reg_read(UC_X86_REG_EIP)==stop,hex(cpu.reg_read(UC_X86_REG_EIP))
 return cpu.reg_read(UC_X86_REG_EAX)
def person(i):return people+i*0xb3
def point(i,p):write(person(i)+0x3d,'HHH',p['x']&65535,p['y']&65535,p['h']&65535)
def snapshot():
 lights=[]
 for n in range(50):
  a=slots+n*61
  if not read(a,'B'):lights.append(None);continue
  enabled,flags,strength,flicker,x,y,h,owner=struct.unpack('<4B4H',cpu.mem_read(a,12))
  lights.append(dict(owner=owner,strength=strength,flicker=flicker,flags=flags,position=dict(x=x,y=y,h=h),contributions=list(struct.unpack('<49b',cpu.mem_read(a+12,49)))))
 cells=[read(base+i*16+8,'H') for i in range(16384)]
 return dict(lights=lights,cellsSha256=hashlib.sha256(struct.pack('<16384H',*cells)).hexdigest(),count=read(count,'h'))
land=dict(heights=[rng.randrange(1025) for _ in range(16384)],flags=[rng.randrange(2) for _ in range(16384)],buildingIds=[rng.randrange(1024) for _ in range(16384)])
for i in range(16384):
 write(base+i*16,'Ih',land['flags'][i],land['heights'][i]);write(base+i*16+8,'H',land['buildingIds'][i])
write(0x89c6f0,'B',0);write(count,'H',0);cpu.mem_write(slots,bytes(50*61))
for i in range(1,81):cpu.mem_write(person(i),bytes(179));write(person(i)+0x24,'H',i)
actions=[];owners={}
view=dict(x=65000,y=400);seed=0x12345678;enabled=True;paused=False
write(0x89d1ec,'HH',view['x'],view['y']);write(0x89d178,'I',seed);write(0x895da4,'I',0x1000);write(0x89c661,'I',0)
def run(action):
 global seed,view,enabled,paused
 if action['kind']=='add':
  source=action['source'];owner=source['owner'];owners[owner]=source['position'];point(owner,owners[owner])
  action['accepted']=bool(call(0x4010b0,person(owner),source['strength'],source['flicker'],source['flags']))
 elif action['kind']=='remove':
  owner=action['owner'];call(0x4ee190,person(owner));owners.pop(owner,None);call(0x401350)
 else:
  view=action['view'];seed=action['seed'];enabled=action['enabled'];paused=action['paused']
  for owner,p in action['positions']:
   owners[owner]=p;point(owner,p)
  write(0x89d1ec,'HH',view['x'],view['y']);write(0x89d178,'I',seed)
  write(0x895da4,'I',0x1000 if enabled else 0);write(0x89c661,'I',2 if paused else 0)
  call(0x401350)
 assert read(0x89d178,'I')==seed,'Local light flicker consumed gameplay RNG'
 action['expected']=snapshot();actions.append(action)
# Saturation, fifty slots, full-pool refusal, holes reused in their native order.
for i in range(1,52):
 run(dict(kind='add',source=dict(owner=i,strength=3 if i%2 else 4,flicker=4,flags=0,
  position=dict(x=(65000+i*17)&65535,y=(400+i*7)&65535,h=200+i*5))))
for i in [2,17,44]:run(dict(kind='remove',owner=i))
for i in [52,53,54]:run(dict(kind='add',source=dict(owner=i,strength=7,flicker=7,flags=1,position=dict(x=120,y=250,h=100))))
# Movement and removal across seams, view culling, height changes, disabled/paused gates.
for n in range(128):
 move=[]
 for owner in sorted(owners):
  if owner==51:continue # Refused allocation remains an ordinary owner.
  if n%8==0:p=dict(x=rng.randrange(65536),y=rng.randrange(65536),h=rng.randrange(65536))
  else:p=dict(x=(65000+rng.randrange(-1600,1600))&65535,y=(400+rng.randrange(-1600,1600))&65535,h=rng.randrange(1400))
  move.append([owner,p])
 run(dict(kind='update',positions=move,view=dict(x=65000 if n%5 else 30000,y=400),seed=rng.getrandbits(32),enabled=n%9!=0,paused=n%11==0))
for owner in list(owners):
 if owner!=51:run(dict(kind='remove',owner=owner))
assert read(count,'h')==0
assert [read(base+i*16+8,'H') for i in range(16384)]==land['buildingIds'],'Cleanup changed occupancy or left residual light'
fixture=dict(executableSha256=identity['sha256'],land=land,view=dict(x=65000,y=400),seed=0x12345678,actions=actions)
js="""import {createHash} from 'node:crypto';import {createNativeTerrain} from './app/native-terrain.ts';import {addTerrainLight,updateTerrainLights} from './app/terrain-light.ts';let s='';for await(const c of process.stdin)s+=c;const f=JSON.parse(s),land=createNativeTerrain(f.land.heights);land.flags.set(f.land.flags);land.buildingIds.set(f.land.buildingIds);const lights=Array(50).fill(null),owners=new Map();let view=f.view,seed=f.seed,enabled=true;for(const [index,a] of f.actions.entries()){let refresh=true;if(a.kind==='add'){owners.set(a.source.owner,a.source.position);const accepted=addTerrainLight(lights,a.source);if(accepted!==a.accepted)throw Error('Allocation '+index);refresh=accepted;}else if(a.kind==='remove')owners.delete(a.owner);else{view=a.view;seed=a.seed;enabled=a.enabled;land.landFlags=a.paused?2:0;for(const [id,p] of a.positions)owners.set(id,p);}if(refresh)updateTerrainLights(land,lights,id=>owners.get(id),view,seed,enabled);const got={lights:lights.map(l=>l&&({...l,contributions:[...l.contributions]})),cellsSha256:createHash('sha256').update(new Uint8Array(land.buildingIds.buffer)).digest('hex'),count:lights.filter(Boolean).length};if(JSON.stringify(got)!==JSON.stringify(a.expected)){if(JSON.stringify(got.lights)!==JSON.stringify(a.expected.lights))for(let i=0;i<50;i++)if(JSON.stringify(got.lights[i])!==JSON.stringify(a.expected.lights[i]))throw Error(JSON.stringify({index,slot:i,got:got.lights[i],expected:a.expected.lights[i]}));throw Error(JSON.stringify({index,got:got.cellsSha256,expected:a.expected.cellsSha256}));}}"""
r=subprocess.run(['node','--input-type=module','-e',js],input=json.dumps(fixture),text=True,capture_output=True,cwd=ROOT)
assert r.returncode==0,r.stderr
path=ROOT/'tests/fixtures/terrain-light.json'
# Retain native slot records and terrain hashes; checks never regenerate them implicitly.
if '--record' in sys.argv:path.write_text(json.dumps(fixture,separators=(',',':'))+'\n')
else:assert json.loads(path.read_text())==fixture,'Native fixture drift; review before --record'
print(f'PASS: {len(actions)} native light lifecycle snapshots ({calls} complete allocation/update/removal calls), 50-slot saturation/reuse, toroidal motion, height falloff, view/pause/enable gates, unchanged gameplay RNG and exact occupancy restoration')
