"""Bounded command-7 restart witness; does not change scatter admission.

Executes original 00432260 -> 00432df0 -> 004d58c0 with supplied route,
allocation and audio consumers. This is not a full person/scatter/gameplay run.
Requires verified EXE and adjacent levels/constant.dat. Writes JSON to stdout only.
"""
import json
import struct
import sys
from pathlib import Path
from unicorn import UC_HOOK_CODE
from unicorn.x86_const import UC_X86_REG_EAX, UC_X86_REG_EIP, UC_X86_REG_ESP
from decomp import native_cpu, configure_native_constants

exe = Path(sys.argv[1])
cpu, identity = native_cpu(exe)
configure_native_constants(cpu, exe)
cpu.mem_map(0x2000000, 0x10000)
p, stack, stop = 0x2000000, 0x200e000, 0x200f000
order = 0x93883a

def write(a, fmt, *values):
    cpu.mem_write(a, struct.pack('<' + fmt, *values))

def read(a, fmt):
    return struct.unpack('<' + fmt, cpu.mem_read(a, struct.calcsize('<' + fmt)))[0]

def call(address):
    write(stack, 'II', stop, p)
    cpu.reg_write(UC_X86_REG_ESP, stack)
    cpu.emu_start(address, stop, count=100000)
    assert cpu.reg_read(UC_X86_REG_EIP) == stop

# Keep actual cargo loop and branch; only its external consumers are supplied.
leaves = [0x4e9b40, 0x4e9d80, 0x4ed8a0, 0x48a050]
def leaf(c, address, size, user):
    sp = c.reg_read(UC_X86_REG_ESP)
    result = 0
    if address == 0x4ed8a0:
        args = list(struct.unpack('<IIII', c.mem_read(sp + 4, 16)))
        assert args == [5, 11, 255, p + 0x3d]
        result = 0x2001000 if sum(row[0] == 'allocated' for row in events) < capacity else 0
        events.append(['allocated' if result else 'allocation-failed'])
    elif address == 0x48a050:
        assert list(struct.unpack('<III', c.mem_read(sp + 4, 12))) == [p, 11, 0]
        events.append(['sound', 11])
    else:
        events.append(['route-release' if address == 0x4e9b40 else 'destination'])
    c.reg_write(UC_X86_REG_EAX, result)
    c.reg_write(UC_X86_REG_EIP, read(sp, 'I'))
    c.reg_write(UC_X86_REG_ESP, sp + 4)

for address in leaves:
    cpu.hook_add(UC_HOOK_CODE, leaf, begin=address, end=address)
rows = []
for protected in [False, True]:
    for cargo in [0, 50, 100, 250]:
        for capacity in [0, 1, 3]:
            cpu.mem_write(p, bytes(256))
            write(p + 0x2a, 'BBB', 1, 2, 10)
            write(p + 0x2d, 'B', 3)
            write(p + 0x30, 'B', 2)
            write(p + 0x70, 'h', 17)
            write(p + 0x72, 'H', 444)
            write(p + 0x89, 'H', 555)
            write(p + 0x76, 'H', 0x8000 if protected else 0)
            write(p + 0x78, 'h', cargo)
            write(p + 0x8b, 'H', 1)
            write(order, 'BBHHHH', 7, 0, 1, 0, 0x1200, 0x3400)
            write(0x89d178, 'I', 12345)
            events = []
            before = bytes(cpu.mem_read(order, 10))
            call(0x432260)
            remaining = cargo if protected else max(0, cargo - capacity * 100)
            assert read(p + 0x78, 'h') == remaining
            # This probe enters startup directly, not the enclosing state initializer.
            assert read(p + 0x70, 'h') == 17
            assert read(p + 0x72, 'H') == 444
            value = (12345 * 0x24a1 + 0x24df) & 0xffffffff
            assert read(0x89d178, 'I') == ((value >> 13) | (value << 19)) & 0xffffffff
            assert read(p + 0x2d, 'B') == 0
            assert read(p + 0x89, 'H') == 0
            assert read(p + 0x76, 'H') & 0x8000 == 0
            assert read(p + 0xa7, 'B') == 7
            assert read(p + 0x8b, 'H') == 1
            assert bytes(cpu.mem_read(order, 10)) == before
            assert sum(row[0] == 'sound' for row in events) == (0 if protected else min(capacity, (cargo + 99) // 100))
            rows.append(dict(protected=protected, cargo=cargo, capacity=capacity,
                             remaining=remaining, timer=read(p + 0x70, 'h'),
                             target=read(p + 0x72, 'H'), rng=read(0x89d178, 'I'), events=events))
print(json.dumps(dict(executable=identity, cases=rows, scope='Native command-7 restart with supplied external consumers; no scatter admission or full gameplay claim')))
