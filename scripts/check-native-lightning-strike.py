"""Execute the original strike, electrocution dispatcher and wave allocation.
Usage: python SCRIPT EXE [--record]
Allocation/state initialization and common physics/status consumers are supplied;
selection, attribution, state-44 timing, animation lookup and wave writes execute.
Full shared state initialization is checked by check-native-person-state.py.
"""
import json,random,struct,subprocess,sys
from pathlib import Path
from unicorn import UC_HOOK_CODE
from unicorn.x86_const import UC_X86_REG_ESP,UC_X86_REG_EIP,UC_X86_REG_EAX
from decomp import ROOT,native_cpu,configure_native_constants
exe=Path(sys.argv[1]);cpu,identity=native_cpu(exe);configure_native_constants(cpu,exe)
cpu.mem_map(0x2000000,0x40000)
p,pool,objects,stack,stop=0x2000000,0x2001000,0x2002000,0x203d000,0x203e000
fields={'class':(0x2a,'B'),'model':(0x2b,'B'),'tribe':(0x2f,'b'),'flags2':(12,'I'),'flags3':(20,'I'),'state':(0x2c,'B'),'previousState':(0x7d,'B'),'life':(0x6e,'h'),'damageAttacker':(0xb0,'b')}
write=lambda a,f,*v:cpu.mem_write(a,struct.pack('<'+f,*v))
read=lambda a,f:struct.unpack('<'+f,cpu.mem_read(a,struct.calcsize('<'+f)))[0]
mode='strike';allocation=3;events=[]
def hook(c,a,size,u):
 sp=c.reg_read(UC_X86_REG_ESP);arg=read(sp+4,'I');result=0
 if a==0x4ed8a0:
  model=read(sp+8,'I')&255
  if mode=='strike' and model in (32,30) and allocation & (1 if model==32 else 2):result=pool+(256 if model==30 else 0)
  if mode=='wave' and arg==7 and model==1:result=pool
  if result:
   c.mem_write(result,bytes(256));write(result+0x2a,'BB',arg,model);write(result+0x2f,'B',read(sp+12,'I')&255)
   c.mem_write(result+0x3d,bytes(c.mem_read(read(sp+16,'I'),6)))
 elif a==0x4ed640 and read(arg+0x2a,'B')==1:events.append(['initialize',read(arg+0x24,'H'),read(arg+0x2c,'B')])
 elif a==0x4d4040:events.append(['animation',read(sp+8,'I')&65535])
 c.reg_write(UC_X86_REG_EAX,result);c.reg_write(UC_X86_REG_EIP,read(sp,'I'));c.reg_write(UC_X86_REG_ESP,sp+4)
# Common person consumers are independently checked by the existing native oracles.
for a in [0x4ed8a0,0x4ed640,0x4ed6f0,0x4edcf0,0x4ee700,0x4d4040,
          0x4d42a0,0x51fed0,0x4e9050,0x4e6d00,0x4e0270,0x4d43a0,
          0x4d4690,0x4d9bd0,0x4def50,0x4da2a0]:cpu.hook_add(UC_HOOK_CODE,hook,begin=a,end=a)
def call(a):
 write(stack,'II',stop,p);cpu.reg_write(UC_X86_REG_ESP,stack);cpu.emu_start(a,stop,count=1000000)
 assert cpu.reg_read(UC_X86_REG_EIP)==stop,hex(cpu.reg_read(UC_X86_REG_EIP))
def snapshot(q):return {k:read(q+o,f) for k,(o,f) in fields.items()}
rng=random.Random(0x511f70);cases=[];expected=[]
for trial in range(256):
 allocation=trial%4;tribe=[-1,0,1,2,3][trial%5];records=[]
 cpu.mem_write(p,bytes(256));cpu.mem_write(objects,bytes(256*33));cpu.mem_write(0x890390,bytes(4*33));cpu.mem_write(0x8a03e4,bytes(16*16384));write(0x8922e8,'I',0)
 write(p+0x2f,'b',tribe);write(p+0x57,'HHh',256,256,128);write(0x8a03ea,'H',1)
 for i in range(1,33):
  record=dict(model=rng.randrange(9),tribe=rng.choice([-1,0,1,2,3]),flags2=rng.choice([0,0x100000]),flags3=rng.choice([0,0,0x8000,0x20000,0x28000]),state=rng.choice([10,14,26,44]),previousState=1,life=rng.choice([0,1000]),damageAttacker=-1)
  record['class']=rng.choice([1,1,1,2,5])
  # Force crowded unprotected cells as well as mixed-class/protected lists.
  if trial%8==7:record.update(model=2,flags3=0);record['class']=1
  records.append(record);q=objects+i*256;write(0x890390+i*4,'I',q);write(q+0x24,'H',i);write(q+0x20,'H',i+1 if i<32 else 0)
  for k,(o,f) in fields.items():write(q+o,f,record[k])
 events=[];call(0x511f70)
 cases.append(dict(tribe=tribe,allocation=allocation,people=records));expected.append(dict(people=[snapshot(objects+i*256) for i in range(1,33)],events=events))
mode='phase';phases=[];phase_expected=[]
for model in range(9):
 for substate in range(256):
  cpu.mem_write(p,bytes(256));write(p+0x2a,'BBBB',1,model,44,substate);write(p+0x24,'H',1);write(p+0x2f,'b',-1);write(p+12,'I',0x40100000)
  events=[];call(0x4d32b0)
  phases.append(dict(model=model,state=44,previousState=0,substate=substate,flags2=0x40100000))
  phase_expected.append(dict(person={k:read(p+o,f) for k,(o,f) in {'model':(0x2b,'B'),'state':(0x2c,'B'),'previousState':(0x7d,'B'),'substate':(0x2d,'B'),'flags2':(12,'I')}.items()},events=events))
mode='wave';cpu.mem_write(p,bytes(256));cpu.mem_write(0x8a03e4,bytes(16*16384));cpu.mem_write(0x890390,bytes(4*33));write(p+0x2f,'b',1);write(p+0x57,'HHh',256,256,128);write(p+0x76,'B',9);call(0x511ae0)
wave_fields={'x':(0x3d,'H'),'y':(0x3f,'H'),'h':(0x41,'h'),'tribe':(0x2f,'b'),'remaining':(0x68,'i'),'radius':(0x70,'h'),'maxRadius':(0x72,'h'),'range':(0x6c,'i'),'spread':(0x76,'h'),'horizontal':(0x74,'h'),'vertical':(0x78,'h'),'friendlyFire':(0x7b,'B'),'applied':(0x7c,'B'),'panic':(0x7a,'B'),'scatter':(0x7d,'B')}
wave={k:bool(read(pool+o,f)) if k in ['friendlyFire','applied','panic','scatter'] else read(pool+o,f) for k,(o,f) in wave_fields.items()}
js="""import {strikeLightning} from './app/lightning.ts';import {stepElectrocution} from './app/person-state.ts';import {createBlastWave} from './app/blast-wave.ts';let s='';for await(const c of process.stdin)s+=c;const {cases,phases}=JSON.parse(s);
const strikes=cases.map(c=>{const events=[];if(c.allocation&2)strikeLightning(c.people,c.tribe,p=>events.push(['initialize',c.people.indexOf(p)+1,p.state]));return {people:c.people,events};});
const steps=phases.map(p=>{const events=[];if(stepElectrocution(p,(_,o)=>events.push(['animation',o])))events.push(['initialize',1,p.state]);return {person:p,events};});
console.log(JSON.stringify({strikes,steps,wave:{...createBlastWave({x:256,y:256,h:128},1),scatter:true}}));"""
r=subprocess.run(['node','--input-type=module','-e',js],input=json.dumps(dict(cases=cases,phases=phases)),text=True,capture_output=True,cwd=ROOT);assert r.returncode==0,r.stderr
actual=json.loads(r.stdout)
for label,want in [('strikes',expected),('steps',phase_expected)]:
 assert len(actual[label])==len(want)
 for i,(a,b) in enumerate(zip(actual[label],want)):
  assert a==b,(label,i,cases[i] if label=='strikes' else phases[i],a,b)
assert actual['wave']==wave,(actual['wave'],wave)
fixture=dict(executableSha256=identity['sha256'],strikes=[dict(input=cases[i],expected=expected[i]) for i in range(8)],phases=[dict(input=p,expected=e) for p,e in zip(phases,phase_expected) if p['substate'] in [0,1,16,17,18,255]],wave=wave)
path=ROOT/'tests/fixtures/lightning-strike.json'
if '--record' in sys.argv:path.write_text(json.dumps(fixture,separators=(',',':'))+'\n')
else:assert json.loads(path.read_text())==fixture,'Reviewed fixture drift'
print('PASS: 256 original strike lists, 2304 electrocution dispatches, and original first-bolt shockwave configuration; common world consumers supplied')
