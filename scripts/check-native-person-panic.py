"""Compare the state-26 controller block and complete 0x4d9200 trail emitter.
State initialization has its separate full 0x4d2740 oracle. Sound, footprint exit
and particle allocation are supplied; default-state and anchor leaves execute.
Usage: python scripts/check-native-person-panic.py d3dpoptb.exe
"""
import json, random, struct, subprocess, sys
from pathlib import Path
from unicorn import UC_HOOK_CODE
from unicorn.x86_const import UC_X86_REG_ESP, UC_X86_REG_EIP, UC_X86_REG_EAX, UC_X86_REG_EBX, UC_X86_REG_ESI
from decomp import native_cpu, ROOT
cpu, identity = native_cpu(Path(sys.argv[1]))
cpu.mem_map(0x2000000, 0x10000)
p, stack, stop, particles = 0x2000000, 0x200e000, 0x200f000, 0x2001000
rng = random.Random(0x4d9200)
def write(a, fmt, *values): cpu.mem_write(a, struct.pack('<'+fmt, *values))
def read(a, fmt): return struct.unpack('<'+fmt, cpu.mem_read(a, struct.calcsize('<'+fmt)))[0]
def point(a): return dict(zip(['x','y','h'], struct.unpack('<HHh',cpu.mem_read(a,6))))
def hook(c,a,size,user):
 sp=c.reg_read(UC_X86_REG_ESP)
 if a==0x48a050: events.append('sound')
 elif a==0x432520:
  address=read(sp+8,'I');write(address,'HH',case['outside']['x'],case['outside']['y'])
 elif a==0x4ed8a0:
  cls,model,tribe,address=struct.unpack('<IIII',cpu.mem_read(sp+4,16))
  i=len(events);events.append(dict(model=model,position=point(address)))
  assert cls==7 and tribe==255
  output=particles+i*256
  if case['fail']&(1<<i):output=0
  else:
   cpu.mem_write(output,bytes(256));write(output+12,'I',case['flags2']);write(output+20,'I',case['flags3'])
  c.reg_write(UC_X86_REG_EAX,output)
 c.reg_write(UC_X86_REG_EIP,read(sp,'I'));c.reg_write(UC_X86_REG_ESP,sp+4)
for address in [0x48a050,0x432520,0x4ed8a0]:cpu.hook_add(UC_HOOK_CODE,hook,begin=address,end=address)
controller, emitters = [], []
for i in range(512):
 case=dict(person=dict(model=i%9,x=rng.randrange(65536),y=rng.randrange(65536),h=rng.randrange(-32768,32768),flags4=rng.getrandbits(32),timer=rng.choice([-32768,-1,0,1,64,32767]),anchorX=1,anchorY=2,anchorFlags=255),gameFlags=i%4,outside=dict(x=rng.randrange(65536),y=rng.randrange(65536)))
 u=case['person'];cpu.mem_write(p,bytes(256));write(p+0x2b,'B',u['model']);write(p+0x3d,'HHh',u['x'],u['y'],u['h']);write(p+16,'I',u['flags4']);write(p+0x70,'h',u['timer']);write(p+0x68,'HH',1,2);write(p+0x82,'B',255);write(0x89d17c,'I',case['gameFlags'])
 events=[];cpu.reg_write(UC_X86_REG_ESI,p);cpu.reg_write(UC_X86_REG_ESP,stack);cpu.emu_start(0x4d3832,0x4d3ae1,count=10000)
 expected=dict(timer=read(p+0x70,'h'),anchorX=read(p+0x68,'H'),anchorY=read(p+0x6a,'H'),anchorFlags=read(p+0x82,'B'),result=cpu.reg_read(UC_X86_REG_EBX)&255,events=events)
 controller.append(dict(case=case,expected=expected))
for i in range(512):
 case=dict(person=dict(x=rng.randrange(65536),y=rng.randrange(65536),h=rng.randrange(-32768,32768),burnTrail=i%256),displacement=dict(x=rng.randrange(-32768,32768),y=rng.randrange(-32768,32768),h=rng.randrange(-32768,32768)),flags2=rng.getrandbits(32),flags3=rng.getrandbits(32),fail=i%4)
 u=case['person'];cpu.mem_write(p,bytes(256));write(p+0x3d,'HHh',u['x'],u['y'],u['h']);write(p+0x43,'hhh',*case['displacement'].values());write(p+0xa4,'B',u['burnTrail'])
 events=[];write(stack,'II',stop,p);cpu.reg_write(UC_X86_REG_ESP,stack);cpu.emu_start(0x4d9200,stop,count=10000)
 for n,e in enumerate(events):
  a=particles+n*256
  e['particle']=None if case['fail']&(1<<n) else dict(flags2=read(a+12,'I'),flags3=read(a+20,'I'),displacement=dict(zip(['x','y','h'],struct.unpack('<hhh',cpu.mem_read(a+0x43,6)))))
 emitters.append(dict(case=case,expected=dict(burnTrail=read(p+0xa4,'B'),events=events)))
js="""import {stepPersonPanic,stepPersonFireTrail} from './app/person-panic.ts';let s='';for await(const c of process.stdin)s+=c;const input=JSON.parse(s);
console.log(JSON.stringify({controller:input.controller.map(({case:c})=>{let p=c.person,events=[];const result=stepPersonPanic(p,c.gameFlags,{sound:()=>events.push('sound'),outside:()=>c.outside});return {timer:p.timer,anchorX:p.anchorX,anchorY:p.anchorY,anchorFlags:p.anchorFlags,result,events}}),emitters:input.emitters.map(({case:c})=>{const p=c.person,events=[];stepPersonFireTrail(p,c.displacement,(model,position)=>{const particle=c.fail&(1<<events.length)?undefined:{flags2:c.flags2,flags3:c.flags3};events.push({model,position,particle:particle??null});return particle});return {burnTrail:p.burnTrail,events}})}));"""
actual=json.loads(subprocess.check_output(['node','--input-type=module','-e',js],input=json.dumps(dict(controller=controller,emitters=emitters)).encode(),cwd=ROOT))
for key,entries in [('controller',controller),('emitters',emitters)]:
 for i,(a,e) in enumerate(zip(actual[key],entries)):
  assert a==e['expected'],(key,i,e,a)
fixture=dict(executableSha256=identity['sha256'],controller=controller,emitters=emitters)
# Retain the native comparisons as portable regressions, not new expected values from TS.
(ROOT/'tests/fixtures/person-panic.json').write_text(json.dumps(fixture,separators=(',',':'))+'\n')
print('PASS: 512 native panic controller blocks and 512 complete fire-trail emissions, timer wrapping, sound gate, anchors, allocation failures and copied motion deltas')
