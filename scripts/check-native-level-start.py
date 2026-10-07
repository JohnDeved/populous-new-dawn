"""Execute isolated original site height and terrain-wave controllers.

No full game/OS execution. Allocation, position registration, lighting, terrain
notifications and removal are supplied. Native ring traversal, terrain writes,
radii, orbit motion and expiry execute unmodified. Does not certify live browser.
"""
import hashlib, json, random, struct, subprocess, sys
from pathlib import Path
from unicorn import UC_HOOK_CODE
from unicorn.x86_const import UC_X86_REG_EAX, UC_X86_REG_EIP, UC_X86_REG_ESP
from decomp import ROOT, native_cpu

exe=Path(sys.argv[1]); cpu,identity=native_cpu(exe)
search=(exe.parent/'data/mwsearch.dat').read_bytes()
assert hashlib.sha256(search).hexdigest()=='0c39b12d160658863c2df89aa34484dff459e48ea0b5634658b7473ca940fae0'
cpu.mem_write(0x8929cd,search);cpu.mem_map(0x2000000,0x40000)
p,stack,stop=0x2000000,0x203d000,0x203ff00
write=lambda a,f,*v:cpu.mem_write(a,struct.pack('<'+f,*v))
read=lambda a,f:struct.unpack('<'+f,cpu.mem_read(a,struct.calcsize('<'+f)))[0]
def call(address,*args):
 write(stack,'I'*(len(args)+1),stop,*args);cpu.reg_write(UC_X86_REG_ESP,stack)
 cpu.emu_start(address,stop,count=2000000)
 assert cpu.reg_read(UC_X86_REG_EIP)==stop,hex(cpu.reg_read(UC_X86_REG_EIP))
def digest(values):return hashlib.sha256(json.dumps(values,separators=(',',':')).encode()).hexdigest()
allocations=[];changed=[];orbits=[];alive=True

def hook(c,address,size,user):
 global alive
 sp=c.reg_read(UC_X86_REG_ESP);result=0
 if address==0x4ed8a0:
  cls,model,owner,point=struct.unpack('<4I',c.mem_read(sp+4,16))
  pos=list(struct.unpack('<HHh',c.mem_read(point,6)))
  allocations.append([model,*pos])
  if model==60:
   i=len(orbits)+1;ptr=0x2010000+i*256;orbits.append(ptr)
   c.mem_write(ptr,bytes(256));write(ptr+0x24,'H',i);write(0x890390+i*4,'I',ptr)
   c.mem_write(ptr+0x3d,bytes(c.mem_read(point,6)));result=ptr
 elif address==0x44ddf0: changed.append(read(sp+4,'H'))
 elif address==0x4ee580:
  ptr=read(sp+4,'I');point=read(sp+8,'I');c.mem_write(ptr+0x3d,bytes(c.mem_read(point,6)))
 elif address==0x4edcf0:
  if read(sp+4,'I')==p:alive=False
 c.reg_write(UC_X86_REG_EAX,result);c.reg_write(UC_X86_REG_EIP,read(sp,'I'));c.reg_write(UC_X86_REG_ESP,sp+4)
for a in [0x4ed8a0,0x44ddf0,0x44df40,0x44f2f0,0x4edcf0,0x4ed6f0,0x4010b0,0x4ee580]:cpu.hook_add(UC_HOOK_CODE,hook,begin=a,end=a)
rng=random.Random(0x50c840);heights=[rng.randrange(1025) for _ in range(16384)];terrain=bytearray(0x40000)
for i,h in enumerate(heights):struct.pack_into('<Ih',terrain,i*16,0,h)
cases=[];expected=[]
for i in range(32):
 center={'x':rng.randrange(65536),'y':rng.randrange(65536),'h':rng.randrange(1025)}
 cpu.mem_write(0x8a03e4,bytes(terrain));cpu.mem_write(p,bytes(256));cpu.mem_write(0x890390,bytes(256))
 write(p+0x3d,'HHh',center['x'],center['y'],center['h']);orbits=[];alive=True;timeline=[]
 while alive:
  changed=[];allocations=[];call(0x50c840,p)
  raw=cpu.mem_read(0x8a03e4,0x40000);values=[struct.unpack_from('<h',raw,j*16+4)[0] for j in range(16384)]
  timeline.append({'visits':read(p+0x2d,'B'),'terrainRadius':read(p+0x72,'h'),'visualRadius':read(p+0x74,'h'),'heights':digest(values),'changed':changed,'allocations':allocations,'orbits':[[read(o+0x57,'H'),*struct.unpack('<HHh',cpu.mem_read(o+0x3d,6)),*struct.unpack('<hhh',cpu.mem_read(o+0x43,6))] for o in orbits],'alive':alive})
  assert len(timeline)<23
 cases.append(center);expected.append(timeline)
js=r'''
import fs from 'node:fs';import crypto from 'node:crypto';import {stepLevelStartWave} from './app/level-start.ts';
const {heights,cases}=JSON.parse(fs.readFileSync(0,'utf8'));const digest=x=>crypto.createHash('sha256').update(JSON.stringify(x)).digest('hex');
console.log(JSON.stringify(cases.map(center=>{const land={heights:Int16Array.from(heights)},wave={center,visits:0,terrainRadius:0,visualRadius:0,orbits:[]};let alive=true,id=0,all=[],timeline=[];while(alive){let changed=[],allocations=[],moved=[];alive=stepLevelStartWave(land,wave,{orbit:(p,light)=>{allocations.push([60,center.x,center.y,center.h]);return ++id},cell:()=>false,terrain:c=>changed.push(c),sparkle:(p,a)=>allocations.push([61,p.x,p.y,p.h]),move:(id,p,d)=>moved.push([((id-1)*64+(wave.visits+1)*91)&2047,p.x,p.y,p.h,d.x,d.y,d.h]),remove:()=>{}});if(wave.orbits.length)all=structuredClone(wave.orbits);timeline.push({visits:wave.visits,terrainRadius:wave.terrainRadius,visualRadius:wave.visualRadius,heights:digest(Array.from(land.heights)),changed,allocations,orbits:moved,alive});}return timeline})))
'''
actual=json.loads(subprocess.check_output(['node','--input-type=module','-e',js],input=json.dumps({'heights':heights,'cases':cases}).encode(),cwd=ROOT))
if actual!=expected:
 for i,(a,e) in enumerate(zip(actual,expected)):
  for j,(aa,ee) in enumerate(zip(a,e)):
   if aa!=ee:
    for k in aa:
     if aa[k]!=ee[k]:print('MISMATCH',i,j,k,aa[k],ee[k])
    raise AssertionError((i,j))
print(f'PASS: {len(cases)} complete original site-wave lifetimes, terrain hashes, orbit geometry, notifications, allocation order and expiry; EXE {identity["sha256"]}')

# Rectangle mean and native quantization, including toroidal seam cases.
height_cases=[];height_expected=[]
for x,y in [(4352,55040),(40192,23808),(11008,42752),(0,0),(65535,65535)]+[(rng.randrange(65536),rng.randrange(65536)) for _ in range(64)]:
 cpu.mem_write(0x8a03e4,bytes(terrain));cx=(x>>8)&254;cy=(y>>8)&254
 lo=((cx-5)&255)|(((cy-5)&255)<<8);hi=((cx+5)&255)|(((cy+5)&255)<<8)
 call(0x44fcb0,p,lo,hi);call(0x44eb40,p);mean=cpu.reg_read(UC_X86_REG_EAX)
 call(0x4ba600,mean+10);height_cases.append({'x':x,'y':y,'h':0});height_expected.append(cpu.reg_read(UC_X86_REG_EAX))
js="""import fs from 'node:fs';import {levelStartTargetHeight} from './app/level-start.ts';const {heights,cases}=JSON.parse(fs.readFileSync(0,'utf8'));console.log(JSON.stringify(cases.map(c=>levelStartTargetHeight({heights},c))));"""
height_actual=json.loads(subprocess.check_output(['node','--input-type=module','-e',js],input=json.dumps({'heights':heights,'cases':height_cases}).encode(),cwd=ROOT))
assert height_actual==height_expected,(height_actual,height_expected)
print(f'PASS: {len(height_cases)} original site rectangle means/rounded target heights, including seam wrapping')

# Exact class-8 model-1 carrier visits, native angle/3D movement and RNG.
carrier_finished=False;trails=[]
def carrier_hook(c,address,size,user):
 global carrier_finished
 sp=c.reg_read(UC_X86_REG_ESP)
 if address==0x4ed8a0:
  model=read(sp+8,'I');assert model==4;pos=read(sp+16,'I');trails.append(list(struct.unpack('<hhh',c.mem_read(pos,6))))
 elif address==0x4bb290:carrier_finished=True
 c.reg_write(UC_X86_REG_EAX,0);c.reg_write(UC_X86_REG_EIP,read(sp,'I'));c.reg_write(UC_X86_REG_ESP,sp+4)
# Use an independent PE mapping so earlier wave hooks cannot intercept these calls.
cpu,identity=native_cpu(exe);cpu.mem_map(0x2000000,0x40000)
for a in [0x4ed8a0,0x4bb290,0x4edcf0]:cpu.hook_add(UC_HOOK_CODE,carrier_hook,begin=a,end=a)
carrier_cases=[];carrier_expected=[]
for i in range(40):
 origin={'x':rng.randrange(-32768,32768),'y':rng.randrange(-32768,32768),'h':rng.randrange(1025)}
 destination={'x':((origin['x']+rng.randrange(-1600,1601)+32768)%65536)-32768,'y':((origin['y']+rng.randrange(-1600,1601)+32768)%65536)-32768,'h':rng.randrange(1025)}
 seed=rng.randrange(2**32);cpu.mem_write(p,bytes(256));write(p+0x70,'hhh',origin['x'],origin['y'],origin['h']);write(p+0x76,'hhh',destination['x'],destination['y'],destination['h']);write(p+0x5f,'h',1400);write(p+0x6a,'h',20);write(0x89d178,'I',seed)
 carrier_finished=False;timeline=[]
 while not carrier_finished:
  trails=[];call(0x4baf00,p)
  timeline.append({'position':dict(zip(['x','y','h'],struct.unpack('<hhh',cpu.mem_read(p+0x3d,6)))),'randomState':read(0x89d178,'I'),'trails':trails,'alive':not carrier_finished})
  assert len(timeline)<20
 carrier_cases.append({'origin':origin,'destination':destination,'seed':seed});carrier_expected.append(timeline)
js="""import fs from 'node:fs';import {stepLevelStartCarrier} from './app/level-start.ts';const cases=JSON.parse(fs.readFileSync(0,'utf8'));console.log(JSON.stringify(cases.map(c=>{let carrier={index:0,position:c.origin,destination:c.destination,visits:0},rng={randomState:c.seed},alive=true,rows=[];while(alive){let trails=[];alive=stepLevelStartCarrier(carrier,rng,p=>trails.push([p.x,p.y,p.h]));rows.push({position:{...carrier.position},randomState:rng.randomState,trails,alive});}return rows})));"""
carrier_actual=json.loads(subprocess.check_output(['node','--input-type=module','-e',js],input=json.dumps(carrier_cases).encode(),cwd=ROOT))
assert carrier_actual==carrier_expected,next(((i,j,a,e) for i,(aa,ee) in enumerate(zip(carrier_actual,carrier_expected)) for j,(a,e) in enumerate(zip(aa,ee)) if a!=e),None)
print(f'PASS: {len(carrier_cases)} original stone-carrier lifetimes, per-substep trails, geometry, arrival and gameplay RNG')

# Command18 state transitions against a real createWorld/tick opening. The
# effect allocation/lifetime and ordinary animation setter are supplied leaves;
# command control flow, pose selection, counters, terrain mean, stone order and
# facing are original instructions.
cpu,identity=native_cpu(exe);cpu.mem_map(0x2000000,0x40000)
order,params,wave=0x2002000,0x2003000,0x2004000
phase_alloc=[];pose_events=[];wave_live=False;wave_created=-1;active_turn=0

def phase_hook(c,address,size,user):
 global wave_live,wave_created
 sp=c.reg_read(UC_X86_REG_ESP);result=0
 if address==0x4ed8a0:
  cls,model,owner,point=struct.unpack('<4I',c.mem_read(sp+4,16))
  phase_alloc.append([cls,model,*struct.unpack('<HHh',c.mem_read(point,6))])
  if (cls,model)==(7,8):
   c.mem_write(wave,bytes(256));write(wave+0x24,'H',500);write(wave+0x2a,'B',7);write(0x890390+500*4,'I',wave)
   wave_live=True;wave_created=active_turn;result=wave
 elif address==0x4d4040:
  pose_events.append(read(sp+8,'H'))
 c.reg_write(UC_X86_REG_EAX,result);c.reg_write(UC_X86_REG_EIP,read(sp,'I'));c.reg_write(UC_X86_REG_ESP,sp+4)
for a in [0x4ed8a0,0x4d4040,0x4d4f40,0x4e9d80,0x4d47a0,0x44ff80,0x4ef180]:cpu.hook_add(UC_HOOK_CODE,phase_hook,begin=a,end=a)
# Locate unit_clear_vec_2 from the reviewed function's call instruction.
# It is safe to execute its pure field clears; no external OS calls are involved.
js="""import {createWorld,tick} from './app/model.ts';const out=[];for(let level=1;level<=3;level++){const w=createWorld(level);const initial=Array.from(w.land.heights);const sites=w.levelStart.map(s=>({tribe:s.tribe,center:s.center,counter:s.counter,enabled:!s.tribe||w.campaignAIs[s.tribe]?.reincarnation!==false}));let timeline=[];for(let t=1;t<=56;t++){tick(w,1/12);timeline.push(w.levelStart.map(s=>({phase:s.phase,timer:s.timer,entering:s.entering,center:s.center,personCounter:w.units.find(u=>u.id===s.shaman)?.native?.counter})));}out.push({level,initial,sites,timeline})}console.log(JSON.stringify(out));"""
worlds=json.loads(subprocess.check_output(['node','--input-type=module','-e',js],cwd=ROOT))
for world in worlds:
 for index,site in enumerate(world['sites']):
  center=site['center'];owner=site['tribe'];tribe=0x89d1c8+owner*0xc65
  land=bytearray(0x40000)
  for i,h in enumerate(world['initial']):struct.pack_into('<Ih',land,i*16,0,h)
  cpu.mem_write(0x8a03e4,bytes(land));cpu.mem_write(p,bytes(256));cpu.mem_write(order,bytes(32));cpu.mem_write(params,bytes(256));cpu.mem_write(tribe,bytes(0xc65))
  write(tribe+0x969,'I',params);write(tribe+0xc22,'B',owner);write(tribe+0x93d,'I',0 if site['enabled'] else 0x10000)
  write(p+0x2b,'B',7);write(p+0x2c,'B',10);write(p+0x2f,'B',owner);write(p+0xc,'I',0x40000000);write(p+0x3d,'HHh',center['x'],center['y'],center['h'])
  write(order,'BB',18,32);write(order+6,'HH',center['x'],center['y']);wave_live=False;wave_created=-1;complete=False
  for turn in range(1,57):
   active_turn=turn
   if wave_live and turn-wave_created==21:write(wave+0x2a,'B',0);wave_live=False
   phase_alloc=[];pose_events=[]
   if not complete:
    write(p+0x2e,'B',(site['counter']+turn)&255);call(0x433a10,p,order);complete=bool(cpu.reg_read(UC_X86_REG_EAX)&255)
   expected_phase=4 if complete else read(p+0x2d,'B')
   actual=world['timeline'][turn-1][index]
   assert actual['personCounter']==(site['counter']+turn)&255,('one native person visit',world['level'],owner,turn,actual['personCounter'])
   assert actual['phase']==expected_phase,(world['level'],owner,turn,actual,expected_phase,read(p+0x70,'h'))
   if not complete:assert actual['timer']==read(p+0x70,'h'),(world['level'],owner,turn,actual,read(p+0x70,'h'))
print('PASS: original command18 phase/timer transitions at every opening turn for all six authored Mission1–3 shamans, including two disabled enemy sites')

# Stone rise consumer, including immediate creation visit, original dust request,
# alternating sound gate and stable post-rise height.
cpu,identity=native_cpu(exe);cpu.mem_map(0x2000000,0x40000)
stone_events=[];ground=321

def stone_hook(c,address,size,user):
 sp=c.reg_read(UC_X86_REG_ESP);result=0
 if address==0x44e940:result=ground
 elif address==0x48a050:stone_events.append(['sound',read(sp+8,'I')])
 elif address==0x4ed8a0:
  cls,model=read(sp+4,'I'),read(sp+8,'I');assert (cls,model)==(7,51);stone_events.append(['effect',51])
 c.reg_write(UC_X86_REG_EAX,result);c.reg_write(UC_X86_REG_EIP,read(sp,'I'));c.reg_write(UC_X86_REG_ESP,sp+4)
for a in [0x44e940,0x48a050,0x4ed8a0]:cpu.hook_add(UC_HOOK_CODE,stone_hook,begin=a,end=a)
write(0x98e7e4,'I',0)
for n in range(8):
 cpu.mem_write(p,bytes(256));write(p+0x2d,'B',1);write(p+0xc,'I',0x40000000)
 for visit in range(20):
  stone_events=[];call(0x4a7eb0,p)
  assert read(p+0x41,'h')==ground+min(visit+1,16)*16-256,(n,visit)
  if visit==0:assert stone_events==([['sound',159]] if n%2==0 else [])+[['effect',51]]
  else:assert not stone_events
print('PASS: all8 native stone rise/lifetime visits, dust producer and alternating original sound gate')

# Conversion is real replacement allocation, with neutral linked effect58 and
# sound5 before removing the original Wildman. The wave adds its owner flash.
cpu,identity=native_cpu(exe);cpu.mem_map(0x2000000,0x40000)
new_person,flash=0x2006000,0x2007000;conversion_events=[]
def conversion_hook(c,address,size,user):
 sp=c.reg_read(UC_X86_REG_ESP);result=0
 if address==0x4ed8a0:
  cls,model,owner,point=struct.unpack('<4I',c.mem_read(sp+4,16));conversion_events.append(['allocate',cls,model,owner&255,*struct.unpack('<HHh',c.mem_read(point,6))]);result=new_person if cls==1 else flash
 elif address==0x48a050:conversion_events.append(['sound',read(sp+8,'I')])
 elif address==0x4d4b50:conversion_events.append(['remove',read(sp+4,'I')])
 c.reg_write(UC_X86_REG_EAX,result);c.reg_write(UC_X86_REG_EIP,read(sp,'I'));c.reg_write(UC_X86_REG_ESP,sp+4)
for a in [0x4ed8a0,0x48a050,0x4d4b50]:cpu.hook_add(UC_HOOK_CODE,conversion_hook,begin=a,end=a)
for owner in range(4):
 cpu.mem_write(p,bytes(256));cpu.mem_write(new_person,bytes(256));cpu.mem_write(flash,bytes(256));write(0x892443,'I',0x2008000);write(0x895da8,'I',0)
 write(p+0x3d,'HHh',40192,23808,128);write(new_person+0x24,'H',123);write(p+0x26,'H',789);conversion_events=[]
 call(0x4d7fd0,p,owner,p+0x3d)
 assert conversion_events==[['allocate',1,2,owner,40192,23808,128],['allocate',7,58,255,40192,23808,128],['sound',5],['remove',p]],conversion_events
 assert read(new_person+0x10,'I')&0x40000
 assert read(flash+0x72,'H')==123
print('PASS: all4 native tribes allocate replacement braves, linked conversion flashes and original sound/removal sequence')

# Selection exclusion is NOT cast exclusion. Both direct readiness and the
# original player target entry accept command18 with flags4/128 (cursor clear).
cpu,identity=native_cpu(exe);cpu.mem_map(0x2000000,0x40000)
for stage_flags in [0,0x4000]:
 cpu.mem_write(p,bytes(256));cpu.mem_write(0x89d1c8,bytes(0xc65))
 write(p+0x2b,'BBB',7,10,0);write(p+0x2f,'B',0);write(p+0x10,'I',128);write(p+0xc,'I',stage_flags)
 write(p+0x3d,'HHh',4352,55040,128);write(0x89d1c8+0x89d,'I',p);write(0x89d1c8+0xc1f,'B',2)
 write(0x89d17c,'I',0);write(0x684214,'I',0);write(p+0x1000,'HHh',4452,55040,128)
 call(0x4c2d80,p);assert cpu.reg_read(UC_X86_REG_EAX)==1
 call(0x4c24f0,0,1,2,p+0x1000,0);assert cpu.reg_read(UC_X86_REG_EAX)==1
print('PASS: native command18 selection flag does not block direct/player-entry spell readiness')

# Default effect9 executes its complete 32-particle RNG body. Allocation supplies
# zeroed model3 records; +0x59 is pitch and +0x57 is yaw, as consumed by
# original 004e7a80 and independently checked in check-native-spell-trails.py.
cpu,identity=native_cpu(exe);cpu.mem_map(0x2000000,0x40000)
burst_ptrs=[]
def burst_hook(c,address,size,user):
 sp=c.reg_read(UC_X86_REG_ESP);result=0
 if address==0x4ed8a0:
  assert (read(sp+4,'I'),read(sp+8,'I'))==(7,3)
  ptr=0x2010000+len(burst_ptrs)*256;burst_ptrs.append(ptr)
  c.mem_write(ptr,bytes(256));result=ptr
 c.reg_write(UC_X86_REG_EAX,result);c.reg_write(UC_X86_REG_EIP,read(sp,'I'));c.reg_write(UC_X86_REG_ESP,sp+4)
for a in [0x4ed8a0,0x4ed6f0]:cpu.hook_add(UC_HOOK_CODE,burst_hook,begin=a,end=a)
burst_cases=[]
for seed in [0,1,0x12345678,0xffffffff,0x50ccd0]:
 burst_ptrs=[];cpu.mem_write(p,bytes(256));write(0x89d178,'I',seed);call(0x50ccd0,p)
 burst_cases.append({'seed':seed,'randomState':read(0x89d178,'I'),'particles':[{'remaining':read(ptr+0x6c,'h'),'speed':read(ptr+0x5f,'h'),'pitch':read(ptr+0x59,'H'),'yaw':read(ptr+0x57,'H')} for ptr in burst_ptrs]})
js="""import fs from 'node:fs';import {levelStartBurstParticle} from './app/level-start.ts';const cases=JSON.parse(fs.readFileSync(0,'utf8'));for(const c of cases){const rng={randomState:c.seed};const particles=Array.from({length:32},()=>levelStartBurstParticle(rng));if(JSON.stringify(particles)!==JSON.stringify(c.particles)||rng.randomState!==c.randomState)throw new Error('effect9 burst mismatch '+c.seed)}"""
subprocess.run(['node','--input-type=module','-e',js],input=json.dumps(burst_cases).encode(),cwd=ROOT,check=True)
print('PASS: five complete original effect9 bursts:160 particles, lifetime/speed/yaw/pitch and gameplay RNG')

# Real load camera initializer. The original camera consumers use these exact
# tribe+24/+26/+32 fields; ordinary and first flyby warmup must retain the seed.
cpu,identity=native_cpu(exe);cpu.mem_map(0x2000000,0x40000)
camera_cases=[]
for flags in [0,32,64,96]:
 for point in [{'x':4352,'y':55040,'h':128},{'x':65535,'y':0,'h':0},{'x':0,'y':65535,'h':1024},{'x':32769,'y':32768,'h':-1}]:
  cpu.mem_write(p,bytes(0xc65));cpu.mem_write(p+0x2000,bytes(256))
  write(p+0x89d,'I',p+0x2000);write(p+0x2000+0x3d,'HHh',point['x'],point['y'],point['h'])
  write(p+0x32,'H',777);write(0x89d17c,'I',flags);call(0x419790,p)
  camera_cases.append({'position':point,'flags':flags,'expected':{'x':read(p+0x24,'H'),'y':read(p+0x26,'H'),'angle':read(p+0x32,'H')}})
js="""import fs from 'node:fs';import {levelStartCamera} from './app/level-start.ts';for(const c of JSON.parse(fs.readFileSync(0,'utf8'))){const actual=levelStartCamera(c.position,c.flags,777);if(JSON.stringify(actual)!==JSON.stringify(c.expected))throw new Error('fresh camera mismatch '+JSON.stringify({c,actual}))}"""
subprocess.run(['node','--input-type=module','-e',js],input=json.dumps(camera_cases).encode(),cwd=ROOT,check=True)
print('PASS:16 original fresh-load camera seeds: wrapped cell edge/center and angle-preservation flag')

# Opcode1205/1206 helpers and all six actual warmup visits preserve the newly
# loaded camera. Input-mask/UI leaves are supplied as in check-native-flyby.py.
cpu,identity=native_cpu(exe);cpu.mem_map(0x2000000,0x40000)
def camera_ui_hook(c,address,size,user):
 sp=c.reg_read(UC_X86_REG_ESP);c.reg_write(UC_X86_REG_EIP,read(sp,'I'));c.reg_write(UC_X86_REG_ESP,sp+4)
for a in [0x4af0a0,0x41cdc0,0x41d4b0]:cpu.hook_add(UC_HOOK_CODE,camera_ui_hook,begin=a,end=a)
for owner in [0,1,2,3]:
 tribe=0x89d1c8+owner*0xc65;cpu.mem_write(tribe,bytes(0xc65));cpu.mem_write(p,bytes(256))
 write(tribe+0x89d,'I',p);write(p+0x3d,'HHh',4352+owner*512,55040-owner*512,128)
 write(0x89d17c,'I',0);write(0x89c6f0,'B',owner);write(0x89c661,'I',0);write(0x98f746,'B',0);write(0x5ca850,'i',24)
 call(0x419790,tribe)
 seed=[read(tribe+0x24,'H'),read(tribe+0x26,'H'),read(tribe+0x32,'H')]
 call(0x448ec0);call(0x448ee0)
 for visit in range(6):
  assert [read(tribe+0x24,'H'),read(tribe+0x26,'H'),read(tribe+0x32,'H')]==seed
  call(0x449320)
 assert read(0x969bd4,'B')==0
 assert [read(tribe+0x24,'H'),read(tribe+0x26,'H'),read(tribe+0x32,'H')]==seed
print('PASS: all four native camera stores retain their fresh-load seed through flyby creation/start and six warmup frames')

# Independently execute the original outer traversal and byte increments; its
# processors are supplied; list traversal, dispatch count and byte counters execute.
subprocess.run([sys.executable,'-B','scripts/check-native-formation-phase.py',str(exe)],cwd=ROOT,check=True)
print('PASS: all six startup people retain the original one-visit counter cadence through command completion')

# Complete model58/state45 child dispatcher (005138b0). Only final removal is
# supplied; movement/terrain sampling execute. Native freed table slots remain
# records, so an inactive slot models a browser object that no longer exists.
cpu,identity=native_cpu(exe);cpu.mem_map(0x2000000,0x40000)
linked_removed=False
q=p+0x1000
def linked_remove(c,address,size,user):
 global linked_removed
 linked_removed=True;sp=c.reg_read(UC_X86_REG_ESP)
 c.reg_write(UC_X86_REG_EIP,read(sp,'I'));c.reg_write(UC_X86_REG_ESP,sp+4)
cpu.hook_add(UC_HOOK_CODE,linked_remove,begin=0x4ef180,end=0x4ef180)
linked_cases=[]
for mode in ['moving','inactive','removed','reused-active-handle','owner-unlinked']:
 for ground in [64,321,1024]:
  cpu.mem_write(p,bytes(256));cpu.mem_write(q,bytes(256));land=bytearray(0x40000)
  for i in range(16384):struct.pack_into('<h',land,i*16+4,ground)
  cpu.mem_write(0x8a03e4,bytes(land));write(p+0x24,'H',1);write(q+0x24,'H',2)
  write(p+0x2a,'BBB',7,58,45);write(p+0x3d,'HHh',1000,2000,ground);write(p+0x6c,'h',8);write(p+0x72,'H',0 if mode=='owner-unlinked' else 2)
  write(q+0x2a,'BBB',1,2,19);write(q+0x10,'I',0x40000);write(0x890390+4,'I',p);write(0x890390+8,'I',q)
  linked_removed=False;targets=[];visits=[]
  for visit in range(1,9):
   target={'x':1200+visit*73,'y':2200+visit*65,'h':450+visit,'class':0 if mode=='inactive' and visit>=3 else 2 if mode=='reused-active-handle' and visit>=3 else 1,'flags2':1 if mode=='removed' and visit>=3 else 0}
   write(q+0x3d,'HHh',target['x'],target['y'],target['h']);write(q+0x2a,'B',target['class']);write(q+0xc,'I',target['flags2']);targets.append(None if mode=='owner-unlinked' else target)
   call(0x4ed700,p)
   visits.append({'position':dict(zip(['x','y','h'],struct.unpack('<HHh',cpu.mem_read(p+0x3d,6)))),'remaining':read(p+0x6c,'h'),'removed':linked_removed})
   assert read(q+0x10,'I')==0x40000,'linked consumer does not clear the Brave conversion flag'
  linked_cases.append({'mode':mode,'ground':ground,'targets':targets,'expected':visits})
js="""import fs from 'node:fs';import {levelStartConversionPoint} from './app/level-start.ts';for(const c of JSON.parse(fs.readFileSync(0,'utf8'))){let point={x:1000,y:2000,h:c.ground},remaining=8;const actual=c.targets.map(target=>{remaining--;if(remaining)point=levelStartConversionPoint(point,target??undefined,()=>c.ground);return{position:{...point},remaining,removed:remaining===0}});if(JSON.stringify(actual)!==JSON.stringify(c.expected))throw new Error('linked flash mismatch '+c.mode+'/'+c.ground)}"""
subprocess.run(['node','--input-type=module','-e',js],input=json.dumps(linked_cases).encode(),cwd=ROOT,check=True)
print('PASS:15 complete model58 lifetimes:120 moving/grounded, inactive/removed, reused-handle and stationary-owner visits')
