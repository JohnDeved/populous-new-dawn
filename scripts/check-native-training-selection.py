"""Run original panel input and single/group selection commands in the verified PE.
UI/audio/camera consumers are captured; selection eligibility runs natively.
Usage: python scripts/check-native-training-selection.py /path/to/d3dpoptb.exe
"""
import itertools, json, struct, subprocess, sys
from pathlib import Path
from unicorn import UC_HOOK_CODE
from unicorn.x86_const import UC_X86_REG_ESP, UC_X86_REG_EIP, UC_X86_REG_EAX
from decomp import native_cpu, configure_native_constants, ROOT

exe = Path(sys.argv[1]); cpu, identity = native_cpu(exe); configure_native_constants(cpu, exe)
cpu.mem_map(0x2000000, 0x100000)
building, people, tribe, command, stack, stop = 0x2000000, 0x2001000, 0x2009000, 0x200a000, 0x20fd000, 0x20fe000
def write(a, f, *values): cpu.mem_write(a, struct.pack('<'+f, *values))
def read(a, f): return struct.unpack('<'+f, cpu.mem_read(a, struct.calcsize('<'+f)))[0]
def call(a, *args):
    write(stack, 'I'*(len(args)+1), stop, *args); cpu.reg_write(UC_X86_REG_ESP, stack)
    cpu.emu_start(a, stop, count=100000)
    assert cpu.reg_read(UC_X86_REG_EIP) == stop, hex(cpu.reg_read(UC_X86_REG_EIP))
    return cpu.reg_read(UC_X86_REG_EAX) & 255
events = []
def consume(cpu, address, size, user):
    sp = cpu.reg_read(UC_X86_REG_ESP)
    if address == 0x48a050: events.append(['sound', read(sp+8, 'I')])
    elif address == 0x417ca0:
        point = read(sp+4, 'I'); events.append(['focus', read(point,'H'),read(point+2,'H')])
    elif address == 0x504590: events.append(['person-panel', (read(sp+4,'I')-people)//256])
    cpu.reg_write(UC_X86_REG_EAX, 0)
    cpu.reg_write(UC_X86_REG_EIP, read(sp,'I')); cpu.reg_write(UC_X86_REG_ESP, sp+4)
for address in (0x40b9c0, 0x48a050, 0x417ca0, 0x504590, 0x47a550, 0x489c40):
    cpu.hook_add(UC_HOOK_CODE, consume, begin=address, end=address)
write(0x890390+2*4, 'I', building); write(building+0x24,'H',2)
write(building+0x2a,'BB',2,7); write(tribe+0xc22,'B',0)
# Non-contiguous physical slots: the visible second icon resolves slot 3.
write(building+0x86,'6H',10,0,0,11,0,12)
for i in range(3):
    p=people+i*256
    write(0x890390+(10+i)*4,'I',p); write(p+0x24,'H',10+i)
    write(p+0x2a,'BB',1,2); write(p+0x3d,'HH',1000+i*300,2000+i*400)

input_count=0
for event, modifier, suppress, active, selected, blocked, occupied in itertools.product(
        (0xf0,0xf1,0xf2), (0,1,2,4), (0,1), (0,1), (0,128), (0,0x800), (False,True)):
    write(0x895fb0,'B',active);write(0x895fb3,'H',2);write(0x895fb5,'h',3)
    write(0x89c6f0,'B',0);write(0x89c661,'I',blocked)
    cpu.mem_write(0x897997,bytes(15));write(0x897997+12,'B',99 if occupied else 0)
    write(people+256+0x7a,'B',selected)
    events=[]; result=call(0x47b460,event,modifier,suppress)
    accepted=bool(active and not suppress and event in (0xf0,0xf1))
    assert result==active
    assert read(0x895faf,'B')==accepted
    expected=[]
    if accepted:
        expected=[['sound',0x6a]]
        if event==0xf1:expected += [['focus',1300,2400],['person-panel',1]]
    assert events==expected,(event,modifier,events)
    emitted=read(0x897997+12,'B')
    if accepted and event==0xf0 and not blocked and not occupied:
        assert emitted==(0x61 if modifier&1 else 0x2a)
        assert read(0x897997+4,'I')==(int(not selected) if modifier&1 else 6)
        assert read(0x897997+8,'I')==(2 if modifier&1 else 11)
    else:assert emitted==(99 if occupied else 0)
    input_count+=1

dismantle_count=0
for event,suppress,active,dismantling,blocked,occupied in itertools.product(
        (0xf0,0xf1),(0,1),(0,1),(0,0x8000),(0,0x800),(False,True)):
    write(0x895fb0,'B',active);write(0x895fb3,'H',2);write(0x895fb5,'h',-1)
    write(building+0x9c,'H',dismantling);write(0x89c661,'I',blocked)
    cpu.mem_write(0x897997,bytes(15));write(0x897997+12,'B',99 if occupied else 0)
    events=[];result=call(0x47b460,event,0,suppress)
    accepted=bool(active and not suppress and event==0xf0)
    assert result==active
    assert events==([['sound',0x6a]] if accepted else []),(event,suppress,active,events)
    if accepted and not blocked and not occupied:
        assert read(0x897997+12,'B')==0x40
        assert read(0x897997+4,'I')==int(not dismantling)
        assert read(0x897997+8,'I')==2
    else:assert read(0x897997+12,'B')==(99 if occupied else 0)
    dismantle_count+=1
print(f'PASS: {dismantle_count} original dismantling panel input cases, activation/cancel payloads, suppression and busy/blocked command buffers')

cases=[]
for group, selected_mask, blocked_mask, flags3, flags2 in itertools.product((False,True),range(8),range(8),(0,128,0x10000000,0x90000180),(0,128,0x800,0x880)):
    before=[]
    for i in range(3):
        p=people+i*256
        flags4=(128 if blocked_mask&(1<<i) else 0) | (0x800 if i==2 else 0)
        selection=0x25 | (128 if selected_mask&(1<<i) else 0)
        write(p+0xc,'III',flags2,flags4,flags3);write(p+0x7a,'B',selection)
        before.append(dict(id=10+i,flags2=flags2,flags4=flags4,flags3=flags3,selectionFlags=selection))
    write(command,'IIIBBB',0,int(not(selected_mask&2)) if group else 6,2 if group else 11,0x61 if group else 0x2a,0,0)
    call(0x43e8e0,tribe,command)
    after=[dict(id=10+i,flags2=read(people+i*256+0xc,'I'),flags4=read(people+i*256+0x10,'I'),flags3=read(people+i*256+0x14,'I'),selectionFlags=read(people+i*256+0x7a,'B')) for i in range(3)]
    cases.append(dict(occupants=before,clicked=11,group=group,expected=after))
js="""import{selectTrainingOccupants}from'./app/training.ts';let s='';for await(const c of process.stdin)s+=c;
console.log(JSON.stringify(JSON.parse(s).map(c=>{selectTrainingOccupants(c.occupants,c.clicked,c.group);return c.occupants})));"""
actual=json.loads(subprocess.check_output(['node','--input-type=module','-e',js],input=json.dumps(cases).encode(),cwd=ROOT))
assert actual==[c['expected'] for c in cases]
print(f'PASS: {input_count} original panel input cases and {len(cases)} complete selection-command flag comparisons; physical holes, modifiers, suppression, busy buffers, camera focus and selection eligibility')

# Construction-plan icons resolve the plan's worker slots, while its negative
# control slot resolves the linked building before emitting command 0x40.
plan=0x200b000
write(0x890390+4*4,'I',plan);write(plan+0x24,'H',4);write(plan+0x2a,'B',9)
write(plan+0x92,'H',2);write(plan+0x6a,'6H',10,0,0,11,0,12)
plan_inputs=0
for event,group,selected,blocked,busy,linked in itertools.product((0xf0,0xf1),(0,1),(0,128),(0,0x800),(0,99),(False,True)):
 for slot in (-1,3):
  write(0x895fb0,'B',1);write(0x895fb3,'H',4);write(0x895fb5,'h',slot)
  write(plan+0x92,'H',2 if linked else 0);write(building+0x9c,'H',0x8000 if selected else 0)
  write(people+256+0x7a,'B',selected);write(0x89c661,'I',blocked)
  cpu.mem_write(0x897997,bytes(15));write(0x897997+12,'B',busy)
  events=[];call(0x47b460,event,group,0)
  emitted=read(0x897997+12,'B')
  if event==0xf0 and not blocked and not busy and (slot>=0 or linked):
   expected=(0x40 if slot<0 else 0x61 if group else 0x2a)
   assert emitted==expected,(slot,group,emitted)
   assert read(0x897997+8,'I')==(2 if slot<0 else 4 if group else 11)
   assert read(0x897997+4,'I')==(int(not selected) if slot<0 or group else 6)
  else:assert emitted==busy
  if event==0xf1 and slot>=0:assert events==[['sound',0x6a],['focus',1300,2400],['person-panel',1]]
  plan_inputs+=1
# Original group selection dispatch uses the same eligibility leaf for plan workers.
write(0x89c661,'I',0);write(plan+0x9e,'B',1);write(plan+0x9a,'B',3)
for selected in (0,1):
 for i in range(3):
  write(people+i*256+0xc,'III',0,0,0);write(people+i*256+0x7a,'B',128 if not selected else 0)
 write(command,'IIIBBB',0,selected,4,0x61,0,0);call(0x43e8e0,tribe,command)
 assert all(bool(read(people+i*256+0x7a,'B')&128)==bool(selected) for i in range(3))
print(f'PASS: {plan_inputs} original plan worker/control input cases and both plan group-selection states')

# Ordinary guard towers reuse building selection commands with one occupied slot.
write(building+0x2b,'B',4);write(building+0xa6,'B',1)
tower_cases=0
for model,slot,group,selected in itertools.product((2,3,7),range(6),(0,1),(0,128)):
 cpu.mem_write(building+0x86,bytes(12));write(building+0x86+slot*2,'H',10)
 write(people+0x2b,'B',model);write(people+0xc,'III',0,0,0);write(people+0x7a,'B',selected)
 write(0x895fb0,'B',1);write(0x895fb3,'H',2);write(0x895fb5,'h',slot);write(0x89c661,'I',0)
 cpu.mem_write(0x897997,bytes(15));events=[];call(0x47b460,0xf0,group,0)
 assert read(0x897997+12,'B')==(0x61 if group else 0x2a)
 assert read(0x897997+4,'I')==(int(not selected) if group else 6)
 assert read(0x897997+8,'I')==(2 if group else 10)
 assert events==[['sound',0x6a]]
 cpu.mem_write(command,bytes(cpu.mem_read(0x897997,15)));call(0x43e8e0,tribe,command)
 assert bool(read(people+0x7a,'B')&128)==(not selected)
 tower_cases+=1
print(f'PASS: {tower_cases} original tower input-to-selection commands across three live classes and all six physical slots')
