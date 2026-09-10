"""Execute original HUD commands and focus cycling against the browser rules.
Usage: python scripts/check-native-hud-selection.py EXE [--record]
Only UI refresh, audio playback, camera movement and panel display are intercepted.
"""
import json, random, struct, subprocess, sys
from pathlib import Path
from unicorn import UC_HOOK_CODE
from unicorn.x86_const import UC_X86_REG_EAX, UC_X86_REG_EIP, UC_X86_REG_ESP
from decomp import native_cpu, configure_native_constants, ROOT
exe = Path(sys.argv[1])
cpu, identity = native_cpu(exe)
configure_native_constants(cpu, exe)
cpu.mem_map(0x2000000, 0x100000)
people, command, stack, stop = 0x2000000, 0x2003000, 0x20fd000, 0x20fe000
tribe = 0x89d1c8
write = lambda a, f, *v: cpu.mem_write(a, struct.pack('<' + f, *v))
read = lambda a, f: struct.unpack('<' + f, cpu.mem_read(a, struct.calcsize('<' + f)))[0]
voices, focuses, panels, emitted = [], [], [], []
def consume(c, address, size, user):
    sp = c.reg_read(UC_X86_REG_ESP)
    if address == 0x48a050: voices.append(read(sp + 8, 'I'))
    if address == 0x417ca0: focuses.append(read(sp + 4, 'I') - 0x3d)
    if address == 0x504590: panels.append([read(sp + 4, 'I'), read(sp + 8, 'I')])
    if address == 0x479cf0: emitted.append(list(struct.unpack('<4I', c.mem_read(sp + 4, 16))))
    c.reg_write(UC_X86_REG_EIP, read(sp, 'I'))
    c.reg_write(UC_X86_REG_ESP, sp + 4)
for address in (0x47a550, 0x48a050, 0x417ca0, 0x504590, 0x479cf0):
    cpu.hook_add(UC_HOOK_CODE, consume, begin=address, end=address)
def call(address, *args):
    write(stack, 'I' * (len(args) + 1), stop, *args)
    cpu.reg_write(UC_X86_REG_ESP, stack)
    try: cpu.emu_start(address, stop, count=1000000)
    except Exception:
        print('Native failure', hex(address), hex(cpu.reg_read(UC_X86_REG_EIP))); raise
    assert cpu.reg_read(UC_X86_REG_EIP) == stop
    return cpu.reg_read(UC_X86_REG_EAX)
def install(roster, point, nearby):
    cpu.mem_write(tribe, bytes(0xc65))
    write(tribe + 0x881, 'I', people)
    write(tribe + 0x24, 'HH', point['x'], point['y'])
    write(tribe + 0x93d, 'I', 128 if nearby else 0)
    write(0x89c6f0, 'B', 0)
    for i, p in enumerate(roster):
        a = people + i * 256
        cpu.mem_write(a, bytes(256))
        write(a + 8, 'I', a + 256 if i < len(roster) - 1 else 0)
        write(a + 0x10, 'II', p['flags4'], p['flags3'])
        write(a + 0x24, 'H', p['id'])
        write(a + 0x2a, 'BBB', 1, p['model'], 19)
        write(a + 0x3d, 'HH', p['x'], p['y'])
        write(a + 0x76, 'H', p['assignment'])
        write(a + 0x7a, 'B', p['selectionFlags'])
        write(0x890390 + p['id'] * 4, 'I', a)
        if p['model'] == 7: write(tribe + 0x89d, 'I', a)
    return [bytes(cpu.mem_read(people + i * 256, 256)) for i in range(len(roster))]
rng = random.Random(0x451720)
cases = []
for trial in range(1024):
    point = dict(x=rng.randrange(65536), y=rng.randrange(65536))
    center = {k:(v & 0xfe00) + 256 for k, v in point.items()}
    nearby = bool(trial & 1)
    roster = []
    for i in range(12):
        dx, dy = rng.choice([(0,0),(6143,0),(6144,0),(6143,100),(-6144,0),
                              (rng.randrange(-30000,30000),rng.randrange(-30000,30000))])
        roster.append(dict(id=i+1, model=7 if i==11 else 2+(i+trial)%5,
            x=(center['x']+dx)&65535, y=(center['y']+dy)&65535,
            flags4=rng.choice([0,0,0,128,0x800,0x880]), flags3=rng.getrandbits(32),
            assignment=rng.randrange(8)<<12, selectionFlags=rng.choice([0,1,128,129])))
    model = [0,2,3,4,5,6,7][trial//2%7]
    mode = ['single','all','five'][trial//14%3]
    if model == 7 and mode == 'five': mode = 'single'
    before = install(roster, point, nearby)
    tag = (0x48 if model == 0 else 0x53) if mode == 'all' else (0x72 if mode == 'five' else 0x7d)
    cell = ((point['x']>>8) | (point['y']&0xff00)) & 0xfefe
    write(command+4, 'IIB', model<<16, cell, tag)
    voices.clear()
    call(0x43e8e0, tribe, command)
    expected = []
    for i,p in enumerate(roster):
        raw = bytes(cpu.mem_read(people+i*256,256))
        expected.append(dict(p, flags3=struct.unpack_from('<I',raw,0x14)[0],selectionFlags=raw[0x7a]))
        untouched = bytearray(raw)
        untouched[0x14:0x18] = before[i][0x14:0x18]; untouched[0x7a] = before[i][0x7a]
        assert untouched == before[i], (trial,i,'selection changed simulation state')
    cases.append(dict(people=roster, model=model, point=point, mode=mode, nearby=nearby,
                      expected=dict(people=expected,cues=list(voices))))
js = """import {selectHudPeople,focusHudPerson} from './app/hud-selection.ts';
let s='';for await(const c of process.stdin)s+=c;
console.log(JSON.stringify(JSON.parse(s).map(c=>c.mode?{
 cues:selectHudPeople(c.people,c.model,c.point,c.mode,c.nearby).cues,people:c.people
}:focusHudPerson(c.people,c.model,c.point,c.previous,c.includeReserved,c.nearby))));"""
def compare(cases):
    actual=json.loads(subprocess.check_output(['node','--input-type=module','-e',js],input=json.dumps(cases).encode(),cwd=ROOT))
    for i,(result,case) in enumerate(zip(actual,cases)):
        assert result==case['expected'], (i,result,case)
compare(cases)
print(f'PASS: {len(cases)} complete native HUD commands / 12288 people; priorities, toroidal ranges, flags and voices')
focus_cases=[]
for trial,case in enumerate(cases):
    roster,point,model,nearby=case['people'],case['point'],case['model'],case['nearby']
    before=install(roster,point,nearby)
    previous=trial%13;include_reserved=bool(trial&2)
    write(0x899ed3+model*12,'H',previous)
    focuses.clear();panels.clear()
    call(0x4de810,model,0,int(include_reserved))
    expected=read(0x899ed3+model*12,'H')
    assert focuses==([people+(expected-1)*256] if expected else [])
    assert panels==([[people+(expected-1)*256,0]] if expected else [])
    assert before==[bytes(cpu.mem_read(people+i*256,256)) for i in range(len(roster))]
    focus_cases.append(dict(people=roster,model=model,point=point,nearby=nearby,previous=previous,
                            includeReserved=include_reserved,expected=expected))
compare(focus_cases)
print(f'PASS: {len(focus_cases)} native right-click focus cycles, camera/panel targets; selection and simulation unchanged')
if '--record' in sys.argv:
    path=ROOT/'tests/fixtures/hud-selection.json'
    path.write_text(json.dumps(dict(executableSha256=identity['sha256'],selection=cases[:84],focus=focus_cases[:84]),separators=(',',':'))+'\n')

# Run actual button callbacks through their command producer, including each gate.
button = 0x2004000
callback_cases = 0
for model in (0, 2, 7):
    install(cases[0]['people'], dict(x=65535,y=511), False)
    write(button+99, 'I', model)
    for shift in (False, True):
      for ctrl in (False, True):
       for right_keys in (False, True):
        for gate in ('none','overview','level','input','drag','press'):
          cpu.mem_write(0x984591, bytes(512))
          write(0x9845c7 if right_keys else 0x9845bb, 'B', int(shift))
          write(0x98462e if right_keys else 0x9845ae, 'B', int(ctrl))
          write(0x89c6c1,'H',2 if gate=='overview' else 0)
          write(0x89d17c,'I',32 if gate=='level' else 0)
          write(0x89ce36,'B',1 if gate=='input' else 0)
          write(0x89c6e7,'B',9 if gate=='drag' else 15 if gate=='press' else 0)
          emitted.clear()
          call(0x4a1090 if model==0 else 0x4a0f00, button)
          tag = (0x48 if model==0 else 0x53) if shift else 0x72 if ctrl and model!=7 else 0x7d
          expected = [[0,tag,model<<16,0xfe]] if gate=='none' else []
          assert emitted==expected, (model,shift,ctrl,right_keys,gate,emitted,expected)
          callback_cases+=1
print(f'PASS: {callback_cases} actual HUD left callbacks and command producer; both modifier keys, precedence, packed camera cell and input gates')
right_calls=[]
def focus_callback(c,address,size,user):
    sp=c.reg_read(UC_X86_REG_ESP)
    right_calls.append(list(struct.unpack('<3I',c.mem_read(sp+4,12))))
    consume(c,address,size,user)
hook=cpu.hook_add(UC_HOOK_CODE,focus_callback,begin=0x4de810,end=0x4de810)
for model in (0,2,7):
 for shift in (False,True):
  for right_keys in (False,True):
   cpu.mem_write(0x984591,bytes(512));write(button+99,'I',model)
   write(0x9845c7 if right_keys else 0x9845bb,'B',int(shift))
   right_calls.clear();call(0x4a1120 if model==0 else 0x4a1010,button)
   assert right_calls==[[model,0,int(shift)]],right_calls
cpu.hook_del(hook)
print('PASS: 12 actual HUD right callbacks; both Shift keys and total/class/shaman focus dispatch')
