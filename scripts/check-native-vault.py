"""Compare post-approach vault task states with verified original x86.
Usage: python scripts/check-native-vault.py /path/to/d3dpoptb.exe
Movement, animation and sound leaves are stubbed; task branches run natively.
"""
import itertools, json, struct, subprocess, sys
from pathlib import Path
from unicorn import UC_HOOK_CODE
from unicorn.x86_const import UC_X86_REG_ESP, UC_X86_REG_EIP, UC_X86_REG_EAX
from decomp import native_cpu

root = Path(__file__).resolve().parents[1]
cpu, _ = native_cpu(Path(sys.argv[1]))
cpu.mem_map(0x2000000, 0x20000)
person, building, trigger, stack, stop = 0x2000000, 0x2001000, 0x2002000, 0x201d000, 0x201e000

def read(p, fmt): return struct.unpack(fmt, cpu.mem_read(p, struct.calcsize(fmt)))[0]
def write(p, fmt, v): cpu.mem_write(p, struct.pack(fmt, v))
# Leaves only: no interception inside 0x43c7a0 or the real 0x4fbf40 trigger lookup.
leaves = [0x4458d0, 0x40a980, 0x4d4040, 0x48a050, 0x4f14b0, 0x4ee700,
          0x404420, 0x4044b0, 0x4e9dd0, 0x4d4f40, 0x4d4ee0, 0x4ed6f0,
          0x4ed580, 0x4ed640, 0x4e6a70, 0x508f70]
actions, phase = [], 0

def leaf(cpu, address, size, user):
    sp = cpu.reg_read(UC_X86_REG_ESP)
    result = 0
    if address == 0x40a980: actions.append('face')
    if address == 0x4d4040: actions.append('pray')
    if address == 0x48a050: actions.append('open' if phase == 3 else 'close')
    if address in (0x404420, 0x4044b0):
        cpu.mem_write(read(sp+8, '<I'), bytes(4))
    if address == 0x4e9dd0:
        actions.append({4:'enter',7:'exit',9:'leave'}[phase])
    if address == 0x508f70: result = trigger if exists else 0
    cpu.reg_write(UC_X86_REG_EAX, result)
    cpu.reg_write(UC_X86_REG_EIP, read(sp,'<I'))
    cpu.reg_write(UC_X86_REG_ESP, sp+4)
for a in leaves: cpu.hook_add(UC_HOOK_CODE, leaf, begin=a, end=a)
write(0x890394, '<I', building); write(0x890398, '<I', trigger)
write(0x8a03ea, '<H', 2)
cases, expected = [], []
for phase, first, timer, arrived, ready, exists in itertools.product(range(2,10), (False,True), (0,1,2,24,40), (False,True), (False,True), (False,True)):
    cpu.mem_write(person, bytes(256)); cpu.mem_write(building, bytes(256)); cpu.mem_write(trigger, bytes(256))
    cpu.mem_write(building+0x2a,b'\2\22'); cpu.mem_write(trigger+0x2a,b'\6\6')
    write(person+0x89,'<H',1); write(building+0xa4,'<H',2 if exists else 0)
    write(person+0x2d,'<B',phase); write(person+0xc,'<I',0x40000000 if first else 0)
    write(person+0x70,'<h',timer); write(person+0x4f,'<h',0 if arrived else 12)
    write(trigger+0x96,'<i',32 if ready else 31);write(trigger+0x9a,'<i',32)
    actions=[]
    cpu.mem_write(stack,struct.pack('<II',stop,person));cpu.reg_write(UC_X86_REG_ESP,stack)
    cpu.emu_start(0x43c7a0,stop,timeout=100000,count=100000)
    assert cpu.reg_read(UC_X86_REG_EIP)==stop
    done=bool(cpu.reg_read(UC_X86_REG_EAX)&255)
    if read(trigger+0x6d,'<B')&2: actions.append('trigger')
    # Cleanup after task completion is outside the post-approach action interface.
    if done: actions=[]
    task=dict(head=1,phase=phase,entering=first,remaining=timer)
    cases.append(dict(task=task,arrived=arrived,ready=ready,exists=exists))
    expected.append(dict(phase=read(person+0x2d,'<B'),remaining=read(person+0x70,'<h'),
                         entering=bool(read(person+0xc,'<I')&0x40000000),done=done,actions=actions))
js="""import {stepVaultTask} from './app/vault.ts';
let s='';for await(const c of process.stdin)s+=c;
console.log(JSON.stringify(JSON.parse(s).map(c=>{
 const {done,actions}=stepVaultTask(c.task,c.arrived,c.ready,c.exists);
 return {phase:c.task.phase,remaining:c.task.remaining,entering:c.task.entering,done,actions:done?[]:actions};
})));"""
r=subprocess.run(['node','--input-type=module','-e',js],cwd=root,input=json.dumps(cases),text=True,capture_output=True)
assert r.returncode==0,r.stderr
for case,want,got in zip(cases,expected,json.loads(r.stdout)):
    assert want==got,(case,want,got)
print(f'PASS: {len(cases)} native vault task transitions; movement/animation/audio leaves intercepted')

# Type-4 trigger work runs separately; decorative/UI leaves are omitted, but
# native shaman-state checks, adjacent-building lookup and forcing logic execute.
cpu, _ = native_cpu(Path(sys.argv[1]));cpu.mem_map(0x2000000,0x20000)
write(0x89c6f0,'<b',0);write(0x89da65,'<I',person)
write(0x890394,'<I',building);write(0x890398,'<I',trigger)
write(0x890370,'<I',0)
def work_leaf(cpu,address,size,user):
    sp=cpu.reg_read(UC_X86_REG_ESP)
    if address==0x4044b0: cpu.mem_write(read(sp+8,'<I'),bytes(4))
    cpu.reg_write(UC_X86_REG_EAX,0);cpu.reg_write(UC_X86_REG_EIP,read(sp,'<I'));cpu.reg_write(UC_X86_REG_ESP,sp+4)
for a in (0x509290,0x4044b0,0x4ef180):cpu.hook_add(UC_HOOK_CODE,work_leaf,begin=a,end=a)
cases,expected=[],[]
for phase,work,target,eligible,forced,reset in itertools.product(range(4),(0,1,31,32,33),(0,32),(False,True),(False,True),(False,True)):
    cpu.mem_write(person,bytes(256));cpu.mem_write(building,bytes(256));cpu.mem_write(trigger,bytes(256))
    cpu.mem_write(building+0x2a,b'\2\22');write(person+0x2c,'<B',10 if eligible else 0);write(person+0xa7,'<B',33)
    write(trigger+0x92,'<H',1);write(trigger+0x2e,'<B',phase);write(trigger+0x68,'<B',4)
    write(trigger+0x6e,'<B',int(reset));write(trigger+0x6b,'<b',1);write(trigger+0x6d,'<B',3 if forced else 1)
    write(trigger+0x96,'<i',work);write(trigger+0x9a,'<i',target)
    cpu.mem_write(stack,struct.pack('<II',stop,trigger));cpu.reg_write(UC_X86_REG_ESP,stack)
    cpu.emu_start(0x4fb270,stop,timeout=100000,count=100000)
    assert cpu.reg_read(UC_X86_REG_EIP)==stop
    cases.append(dict(phase=phase,work=work,target=target,eligible=eligible,forced=forced,reset=reset))
    expected.append(dict(work=read(trigger+0x96,'<i'),remaining=read(trigger+0x6b,'<b')))
js="""import {stepVaultWork} from './app/vault.ts';import {createWorship} from './app/worship.ts';
let s='';for await(const c of process.stdin)s+=c;
console.log(JSON.stringify(JSON.parse(s).map(c=>{
 const w=createWorship(Array(32).fill(0));Object.assign(w,{work:c.work,target:c.target,remaining:1,reset:c.reset});
 stepVaultWork(w,c.phase,c.eligible,c.forced);return {work:w.work,remaining:w.remaining};
})));"""
r=subprocess.run(['node','--input-type=module','-e',js],cwd=root,input=json.dumps(cases),text=True,capture_output=True)
assert r.returncode==0,r.stderr
actual=json.loads(r.stdout);assert len(actual)==len(expected)
for case,want,got in zip(cases,expected,actual): assert want==got,(case,want,got)
print(f'PASS: {len(cases)} native type-4 vault work/forcing cases')
