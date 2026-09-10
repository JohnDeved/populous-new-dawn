"""Execute native order target resolution and the person-panel input consumer.
Only terminal camera, sound, marker and panel consumers are supplied.
Usage: python scripts/check-native-order-focus.py /path/to/d3dpoptb.exe [--record]
"""
import json, struct, subprocess, sys
from pathlib import Path
from unicorn import UC_HOOK_CODE
from unicorn.x86_const import UC_X86_REG_ESP, UC_X86_REG_EIP, UC_X86_REG_EAX
from decomp import native_cpu, ROOT

cpu, identity = native_cpu(Path(sys.argv[1]))
cpu.mem_map(0x2000000, 0x100000)
person, obj, order, point, stack, stop = 0x2000000, 0x2001000, 0x2002000, 0x2003000, 0x20fd000, 0x20fe000

def write(a, fmt, *v): cpu.mem_write(a, struct.pack('<' + fmt, *v))
def read(a, fmt): return struct.unpack('<' + fmt, cpu.mem_read(a, struct.calcsize('<' + fmt)))[0]
def call(a, *args):
    write(stack, 'I' * (len(args) + 1), stop, *args)
    cpu.reg_write(UC_X86_REG_ESP, stack)
    cpu.emu_start(a, stop, count=100000)
    assert cpu.reg_read(UC_X86_REG_EIP) == stop
    return cpu.reg_read(UC_X86_REG_EAX)

write(0x89039c, 'I', obj)
write(obj + 0x24, 'H', 3)
cases = []
for model in range(35):
    for variant in range(5):
        target = dict(id=3, **{'class': 0 if variant == 2 else 1, 'flags2': int(variant == 1)}, x=65000, y=511)
        payload = dict(model=model, flags=0, references=1, object=0, a=3 if variant < 3 else 0 if variant == 3 else 65535, b=0xfeff)
        write(order, 'BBHHHH', model, 0, 1, 0, payload['a'], payload['b'])
        write(obj + 0x2a, 'B', target['class']); write(obj + 0xc, 'I', target['flags2'])
        write(obj + 0x3d, 'HH', target['x'], target['y'])
        # Original slots exist even when empty; keep those safe to read.
        write(0x890390 + payload['a'] * 4, 'I', obj)
        resolved = call(0x438950, order)
        if resolved:
            expected = dict(x=read(resolved + 0x3d, 'H'), y=read(resolved + 0x3f, 'H'), target=3)
        else:
            call(0x4389c0, order, point)
            expected = dict(x=read(point, 'H'), y=read(point + 2, 'H'), target=0)
        cases.append(dict(order=payload, object=target, expected=expected))

js = """import {personOrderFocus} from './app/person-panel.ts'; let s='';for await(const c of process.stdin)s+=c; console.log(JSON.stringify(JSON.parse(s).map(c=>personOrderFocus(c.order,c.object))));"""
actual = json.loads(subprocess.check_output(['node', '--input-type=module', '-e', js], input=json.dumps(cases).encode(), cwd=ROOT))
for c, a in zip(cases, actual): assert a == c['expected'], (c, a)

events = []
def consume(cpu, a, size, user):
    sp = cpu.reg_read(UC_X86_REG_ESP)
    if a == 0x417ca0: events.append(['focus', read(read(sp+4,'I'),'H'), read(read(sp+4,'I')+2,'H')])
    elif a == 0x48a050: events.append(['sound', read(sp+8,'I')])
    elif a == 0x4afff0: events.append(['marker', read(read(sp+4,'I'),'H'), read(read(sp+4,'I')+2,'H')])
    else: events.append(['panel', read(read(sp+4,'I')+0x24,'H')])
    cpu.reg_write(UC_X86_REG_EIP, read(sp,'I')); cpu.reg_write(UC_X86_REG_ESP, sp+4)
for a in [0x417ca0, 0x48a050, 0x4afff0, 0x504590]: cpu.hook_add(UC_HOOK_CODE, consume, begin=a, end=a)
write(0x890398,'I',person); write(person+0x24,'H',2); write(person+0x2a,'B',1)
write(person+0x8b,'8H',1,2,3,4,5,6,7,8)
# Distinct command models identify the native display traversal independently.
for i in range(1,9): write(0x938830+i*10,'BBHHHH',i,0,1,0,i*1000,i*1000+300)
write(person+0xa6,'B',3)
assert call(0x4369f0,person,point,point+256) & 255 == 8
assert list(cpu.mem_read(point,8)) == [4,5,6,7,8,1,2,3]
for i in range(1,9): write(0x938830+i*10,'BBHHHH',3,0,1,0,i*1000,i*1000+300)
write(0x895fb0,'B',1); write(0x895fb3,'H',2)
inputs = 0
for cursor in range(8):
    write(person+0xa6,'B',cursor)
    for slot in range(8):
        write(0x895fb5,'h',slot)
        for button in (0xf0, 0xf1):
            for suppressed in (0, 1):
                events.clear(); call(0x47b460,button,0,suppressed)
                destination = (slot+1)*1000
                expected = [['sound',106],['focus',destination,destination+300],['marker',destination,destination+300]] if button == 0xf1 and not suppressed else []
                assert events == expected, (cursor, slot, button, suppressed, events)
                inputs += 1
# Native display advances with cursor, but the input above never does. Browser
# buttons deliberately bind the displayed record ID instead of reproducing this bug.
fixture = dict(executableSha256=identity['sha256'], cases=cases[::5] + [cases[model*5+variant] for model in (6,11,14) for variant in range(1,5)], physicalSlotMismatch=dict(cursor=3, displayedOrder=4, nativeFocusedOrder=1))
if '--record' in sys.argv:
    (ROOT/'tests/fixtures/order-focus.json').write_text(json.dumps(fixture,indent=2)+'\n')
print(f'PASS: {len(cases)} native target resolutions, {inputs} original panel inputs; physical-slot mismatch confirmed')
