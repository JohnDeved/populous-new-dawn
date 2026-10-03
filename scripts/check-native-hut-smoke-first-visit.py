"""Compare ordinary scene admission with native root allocation + first visits.

Run: python -B scripts/check-native-hut-smoke-first-visit.py /path/to/d3dpoptb.exe
Uses actual authored Mission2, advanceGame, admission and building scene callers
in a Node-only fixture. No occupancy, building counter or world state injection.
Native comparison executes 0040c4e0, the real secondary allocator, 0050c150,
00404540 and secondary traversal/dispatch to 0050c260. The surrounding world
loop does not execute. Declared terrain/list/animation consumers are supplied.
"""
import hashlib
import json
import struct
import subprocess
import sys
from pathlib import Path

from decomp import ROOT, load_native_shapes, native_cpu
from unicorn import UC_HOOK_CODE
from unicorn.x86_const import UC_X86_REG_EAX, UC_X86_REG_EIP, UC_X86_REG_ESP

exe = Path(sys.argv[1])
cpu, identity = native_cpu(exe)
cpu.mem_map(0x2000000, 0x100000)
objects, shapes = 0x2000000, 0x2030000
building, smoke, stack, stop = 0x2040000, 0x2041000, 0x20fd000, 0x20fe000
load_native_shapes(cpu, exe, objects, shapes)


def write(address, fmt, *values):
    cpu.mem_write(address, struct.pack('<' + fmt, *values))


def read(address, fmt):
    return struct.unpack('<' + fmt, cpu.mem_read(address, struct.calcsize('<' + fmt)))[0]


raw = (exe.parent / 'data/smoke.txt').read_bytes()
assert hashlib.sha256(raw).hexdigest() == '48d460819cdbc7d32ae7253150752c3d2ea641b07d797d0914525545f5e19cb1'
for line in raw.decode('ascii').splitlines():
    fields = line.split('#', 1)[0].split()
    if fields:
        assert len(fields) == 6 and fields[0] == 'SMOKE'
        model, angle, x, height, y = map(int, fields[1:])
        write(0x5f0558 + (model * 4 + angle) * 6, 'hhh', x, height, y)


def intercept(_, address, size, user):
    sp = cpu.reg_read(UC_X86_REG_ESP)
    if address == 0x4edbd0:
        # Observe actual allocation arguments and supply only the owning cell.
        assert (read(sp + 4, 'B'), read(sp + 8, 'B')) == (7, 75)
        point = read(sp + 16, 'I')
        x, y = read(point, 'H'), read(point + 2, 'H')
        cell = ((x >> 8) & 254) * 2 | (((y >> 8) & 254) << 8)
        write(0x8a03ec + cell * 4, 'H', 1)
        return
    if address == 0x4ed580:
        # Route this supplied smoke object to its actual native initializer.
        cpu.reg_write(UC_X86_REG_EIP, 0x50c150)
        return
    if address == 0x44e940:
        cpu.reg_write(UC_X86_REG_EAX, 384)
    if address == 0x4ee580:
        unit, point = read(sp + 4, 'I'), read(sp + 8, 'I')
        cpu.mem_write(unit + 0x3d, bytes(cpu.mem_read(point, 6)))
    cpu.reg_write(UC_X86_REG_EIP, read(sp, 'I'))
    cpu.reg_write(UC_X86_REG_ESP, sp + 4)


for address in (0x4edbd0, 0x4ed580, 0x4ed6f0, 0x4ed640, 0x44e940, 0x4ee700, 0x4ee580):
    cpu.hook_add(UC_HOOK_CODE, intercept, begin=address, end=address)

js = """
import { captureHutFirstVisits } from './tests/support/hut-smoke-scene.mjs';
console.log(JSON.stringify(await captureHutFirstVisits()));
"""
actual = json.loads(subprocess.check_output(['node', '--input-type=module', '-e', js], cwd=ROOT))
event = actual['event']
pose = event['pose']
assert len(event['residents']) == 1
write(building + 0x24, 'H', 1)
write(building + 0x2a, 'BB', 2, event['level'])
write(building + 0x2f, 'B', 0)
write(building + 0x33, 'H', pose['object'])
write(building + 0x26, 'H', pose['angle'])
write(building + 0x7a, 'HH', pose['anchorX'], pose['anchorY'])
write(building + 0xa6, 'B', len(event['residents']))
write(smoke + 0x24, 'H', 1601)
write(0x890394, 'I', building)
write(0x890390 + 1601 * 4, 'I', smoke)
write(0x89032c, 'I', smoke)
write(0x890330, 'I', 0)
write(0x89c655, 'I', 0)
write(0x89c6f0, 'B', 0)
write(0x96eac8, 'B', 37)
write(0x89bc72, 'I', 123)
write(0x89d178, 'I', 456)
write(stack, 'II', stop, building)
cpu.reg_write(UC_X86_REG_ESP, stack)
cpu.emu_start(0x40c4e0, stop, count=100000)
assert cpu.reg_read(UC_X86_REG_EIP) == stop
assert read(building + 0x92, 'H') == 1601
assert read(smoke + 0x6c, 'h') == 16
assert read(smoke + 0x2c, 'B') == 61
assert read(0x890330, 'I') == smoke
native = []
for visit in range(16):
    # Only original loop slice executes; actual class dispatchers remain intact.
    cpu.reg_write(UC_X86_REG_ESP, stack)
    cpu.emu_start(0x4ec924, 0x4ec942, count=100000)
    assert cpu.reg_read(UC_X86_REG_EIP) == 0x4ec942
    assert read(0x89bc72, 'I') == 123
    assert read(0x89d178, 'I') == 456
    native.append(dict(lifetime=read(smoke + 0x6c, 'h'),
                       visible=not bool(read(smoke + 0x35, 'B') & 0x10), mode='partial'))
print(json.dumps(dict(executableSha256=identity['sha256'], event=event,
                     nativeRoots=native, browserCallerRoots=actual['roots']), indent=2), flush=True)
assert actual['roots'] == native, 'Ordinary scene root lifetime differs from exact native visits'
print('PASS: normal Mission2 admission matches 16 native root visits, including allocation turn')
