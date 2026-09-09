"""Compare 0050b740's complete indexed blast pass, force and target gates.
Native search, alliances, toroidal distance and ground impulses execute.
Animation, state initialization, damage/removal and vehicle consumers are logged.
Usage: python SCRIPT EXE [--record]
"""
import hashlib,json,random,struct,subprocess,sys
from pathlib import Path
from unicorn import UC_HOOK_CODE
from unicorn.x86_const import UC_X86_REG_ESP,UC_X86_REG_EIP,UC_X86_REG_EAX
from decomp import ROOT,native_cpu,configure_native_constants
exe=Path(sys.argv[1]);cpu,identity=native_cpu(exe);configure_native_constants(cpu,exe)
cpu.mem_map(0x2000000,0x40000);wave,objects,stack,stop=0x2000000,0x2001000,0x203d000,0x203e000
search=(exe.parent/'data/mwsearch.dat').read_bytes();assert hashlib.sha256(search).hexdigest()=='0c39b12d160658863c2df89aa34484dff459e48ea0b5634658b7473ca940fae0';cpu.mem_write(0x8929cd,search)
rng=random.Random(0x50b740);events=[];alive=True;native_damage=False
fields={'id':(0x24,'H'),'class':(0x2a,'B'),'model':(0x2b,'B'),'tribe':(0x2f,'b'),'state':(0x2c,'B'),'previousState':(0x7d,'B'),'flags2':(12,'I'),'flags3':(20,'I'),'flags4':(16,'I'),'x':(0x3d,'H'),'y':(0x3f,'H'),'h':(0x41,'h'),'vehicle':(0x9f,'H'),'burnTrail':(0xa4,'B'),'life':(0x6e,'h'),'shake':(0x65,'B'),'shakeOrigin':(0x61,'H')}
wave_fields={'x':(0x3d,'H'),'y':(0x3f,'H'),'h':(0x41,'h'),'tribe':(0x2f,'b'),'remaining':(0x68,'i'),'radius':(0x70,'h'),'maxRadius':(0x72,'h'),'range':(0x6c,'i'),'spread':(0x76,'h'),'horizontal':(0x74,'h'),'vertical':(0x78,'h'),'friendlyFire':(0x7b,'B'),'applied':(0x7c,'B'),'panic':(0x7a,'B'),'scatter':(0x7d,'B')}
def write(a,f,*v):cpu.mem_write(a,struct.pack('<'+f,*v))
def read(a,f):return struct.unpack('<'+f,cpu.mem_read(a,struct.calcsize('<'+f)))[0]
def at(i):return objects+i*256
def hook(c,a,size,u):
 global alive
 if native_damage and a==0x4da080:return
 sp=c.reg_read(UC_X86_REG_ESP);p=read(sp+4,'I');pid=read(p+0x24,'H')
 if a==0x4edcf0:alive=False
 elif a==0x4ed640:events.append(['panic',pid])
 elif a==0x4d3ea0:events.append(['animation',pid])
 elif a in [0x4da080,0x409200,0x466f00]:
  label={0x4da080:'damage',0x409200:'buildingDamage',0x466f00:'vehicleDamage'}[a]
  amount=read(sp+(8 if a==0x409200 else 12),'i');events.append([label,pid,amount])
 elif a==0x4ef180:events.append(['remove',pid])
 c.reg_write(UC_X86_REG_EAX,0);c.reg_write(UC_X86_REG_EIP,read(sp,'I'));c.reg_write(UC_X86_REG_ESP,sp+4)
for a in [0x4edcf0,0x4ed6f0,0x4ed640,0x4d3ea0,0x4da080,0x409200,0x466f00,0x4ef180]:cpu.hook_add(UC_HOOK_CODE,hook,begin=a,end=a)
def call():
 write(stack,'II',stop,wave);cpu.reg_write(UC_X86_REG_ESP,stack);cpu.emu_start(0x50b740,stop,count=1000000)
 assert cpu.reg_read(UC_X86_REG_EIP)==stop,hex(cpu.reg_read(UC_X86_REG_EIP))
land=dict(heights=[128+(i*7%13) for i in range(16384)],flags=[i&1 for i in range(16384)])
cases=[];expected=[]
for n in range(256):
 center=dict(x=rng.choice([0,65024,32768]),y=rng.choice([0,65024,32768]),h=128)
 b=dict(**center,tribe=n%4,remaining=n%3+1,radius=[0,1,2,4,5][n%5],maxRadius=5,range=1280,spread=2,horizontal=140,vertical=98,friendlyFire=bool(n&1),applied=bool(n&2),panic=bool(n&4),scatter=bool(n&8))
 alliances=[rng.randrange(16) for _ in range(4)];seed=rng.randrange(2**32);special=bool(n&16)
 records=[];cells={}
 for i in range(1,25):
  cls=[1,1,1,1,2,5,4][i%7];dx,dy=(i%5)-2,(i//5)-2
  x=(center['x']+dx*512+(i%3)*128)&65535;y=(center['y']+dy*512+(i%2)*128)&65535
  model=rng.choice([1,2,3,7,8]) if cls==1 else rng.choice([1,4,7,11]) if cls==5 else 1
  p=dict(id=i,**{'class':cls},model=model,tribe=rng.choice([-1,0,1,2,3]),state=rng.choice([1,10,26]),previousState=3,flags2=rng.choice([0,0x100000]),flags3=rng.choice([0,0,0x8000,0x20000]),flags4=rng.choice([0,256,256,256|2048]),x=x,y=y,h=128,vehicle=int(n%9==0 and cls==1),burnTrail=0,life=200,shake=0,shakeOrigin=0,velocity=dict(x=rng.randrange(-30,31),y=rng.randrange(-30,31),z=rng.randrange(-30,31)))
  records.append(p);index=(y>>9)*128+(x>>9)
  c=cells.setdefault(index,dict(index=index,people=[],building=0))
  if cls==2 and n&32:c['building']=i
  else:c['people'].append(i)
 cpu.mem_write(wave,bytes(256));cpu.mem_write(objects,bytes(256*26));cpu.mem_write(0x890390,bytes(4*26));cpu.mem_write(0x89290d,bytes(192))
 for k,(o,f) in wave_fields.items():write(wave+o,f,b[k])
 write(0x89d178,'I',seed);cpu.mem_write(0x89d178+0xc36a2+0x9c,bytes(alliances));write(0x89c665,'I',0x04000000 if special else 0)
 terrain=bytearray(16*16384)
 for i,h in enumerate(land['heights']):struct.pack_into('<Ih',terrain,i*16,land['flags'][i],h)
 for c in cells.values():
  struct.pack_into('<HH',terrain,c['index']*16+6,c['people'][0] if c['people'] else 0,c['building'])
  if c['building']:struct.pack_into('<I',terrain,c['index']*16,land['flags'][c['index']]|512)
  for a,d in zip(c['people'],c['people'][1:]):write(at(a)+0x20,'H',d)
 cpu.mem_write(0x8a03e4,bytes(terrain))
 for p in records:
  for k,(o,f) in fields.items():write(at(p['id'])+o,f,p[k])
  write(at(p['id'])+0x49,'3h',*p['velocity'].values());write(0x890390+p['id']*4,'I',at(p['id']))
 events=[];alive=True;call()
 result=[]
 for p in records:
  v={k:read(at(p['id'])+o,f) for k,(o,f) in fields.items()};v['velocity']=dict(zip(['x','y','z'],struct.unpack('<3h',cpu.mem_read(at(p['id'])+0x49,6))));result.append(v)
 cases.append(dict(wave=b,alliances=alliances,seed=seed,special=special,records=records,cells=list(cells.values())))
 expected.append(dict(records=result,events=events.copy(),alive=alive,radius=read(wave+0x70,'h'),remaining=read(wave+0x68,'i'),applied=bool(read(wave+0x7c,'B')),randomState=read(0x89d178,'I'),search=list(cpu.mem_read(0x89290d,192))))
js="""
import {stepBlastWave} from './app/blast-wave.ts';
let s='';for await(const c of process.stdin)s+=c;const {cases,land}=JSON.parse(s);
console.log(JSON.stringify(cases.map(c=>{const search=new Uint8Array(192),w={randomState:c.seed,search,alliances:c.alliances,special:c.special,land:{heights:Int16Array.from(land.heights),flags:Uint32Array.from(land.flags),buildingIds:new Uint16Array(16384)}},events=[],records=c.records,map=new Map(records.map(p=>[p.id,p])),cells=new Map(c.cells.map(c=>[c.index,c]));
 c.cells.forEach(c=>{w.land.buildingIds[c.index]=c.building;if(c.building)w.land.flags[c.index]|=512});
 const effects=Object.fromEntries(['panic','animation','damage','buildingDamage','vehicleDamage','remove'].map(k=>[k,(p,n)=>events.push(n===undefined?[k,p.id]:[k,p.id,n])]));
 const alive=stepBlastWave(w,c.wave,{cell:i=>(cells.get(i)?.people??[]).map(id=>map.get(id)),building:id=>map.get(id)},effects);
 return {records,events,alive,radius:c.wave.radius,remaining:c.wave.remaining,applied:c.wave.applied,randomState:w.randomState,search:[...search]};
})));
"""
r=subprocess.run(['node','--input-type=module','-e',js],input=json.dumps(dict(cases=cases,land=land)),capture_output=True,text=True,cwd=ROOT);assert r.returncode==0,r.stderr
actual=json.loads(r.stdout)
for i,(a,b) in enumerate(zip(actual,expected)):
 if a!=b:
  Path('/private/tmp/populous-blast-wave-mismatch.json').write_text(json.dumps(dict(case=cases[i],browser=a,native=b),indent=2));raise AssertionError(i)
# Execute the shared damage consumer itself, including signed storage and shields.
native_damage=True;damage_cases=[];damage_expected=[]
for i in range(512):
 p=dict(life=rng.choice([-32768,-1,0,1,1000,32767]),flags3=rng.choice([0,0x8000,0x80000,0x88000]),tribe=rng.choice([-1,0,1,2,3]),damageAttacker=255)
 case=dict(p=p,levelFlags2=0x04000000 if i&1 else 0,attacker=rng.choice([-1,0,1,2,3]),amount=rng.choice([-32768,-1,0,1,50,32767,65535]),mode=i%3)
 cpu.mem_write(objects,bytes(256));write(objects+0x6e,'h',p['life']);write(objects+0x14,'I',p['flags3']);write(objects+0x2f,'b',p['tribe']);write(objects+0xb0,'B',255);write(0x895da4,'I',case['levelFlags2'])
 write(stack,'5I',stop,objects,case['attacker']&0xffffffff,case['amount']&0xffffffff,case['mode']);cpu.reg_write(UC_X86_REG_ESP,stack);cpu.emu_start(0x4da080,stop,count=1000);assert cpu.reg_read(UC_X86_REG_EIP)==stop
 damage_cases.append(case);damage_expected.append(dict(p,life=read(objects+0x6e,'h'),damageAttacker=read(objects+0xb0,'B')))
r=subprocess.run(['node','--input-type=module','-e',"import {damagePerson} from './app/person-update.ts';let s='';for await(const c of process.stdin)s+=c;console.log(JSON.stringify(JSON.parse(s).map(c=>{damagePerson(c.p,c.levelFlags2,c.attacker,c.amount,c.mode);return c.p})));"],input=json.dumps(damage_cases),capture_output=True,text=True,cwd=ROOT);assert r.returncode==0,r.stderr;assert json.loads(r.stdout)==damage_expected
if '--record' in sys.argv:
 (ROOT/'tests/fixtures/blast-wave.json').write_text(json.dumps(dict(executableSha256=identity['sha256'],land=land,cases=cases[:64],expected=expected[:64],damageCases=damage_cases[:64],damageExpected=damage_expected[:64]),separators=(',',':'))+'\n')
print(f'PASS: {len(cases)} complete native blast passes and {len(damage_cases)} native person damage calls')
