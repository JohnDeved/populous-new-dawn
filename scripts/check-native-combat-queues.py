"""Verify queue preservation through native fight admission and encounter setup.

Runs 0051ddc0/0051e150 with real class/person/combat initialization. Only sprite
installation, encounter allocation/immediate visit and UI notification are leaves.
The existing state/encounter/group oracles cover their separate bodies.
Usage: python scripts/check-native-combat-queues.py EXE
"""
import random
import struct
import sys
from pathlib import Path
from unicorn import UC_HOOK_CODE
from unicorn.x86_const import UC_X86_REG_EAX, UC_X86_REG_EIP, UC_X86_REG_ESP
from decomp import native_cpu, configure_native_constants

exe = Path(sys.argv[1])
cpu, _ = native_cpu(exe)
configure_native_constants(cpu, exe)
cpu.mem_map(0x2000000, 0x20000)
people = [0x2000000 + i * 256 for i in range(3)]
group, stack, stop = 0x2001000, 0x201d000, 0x201e000
rng = random.Random(0x51e150)


def write(a, fmt, *v):
    cpu.mem_write(a, struct.pack('<' + fmt, *v))


def read(a, fmt):
    return struct.unpack('<' + fmt, cpu.mem_read(a, struct.calcsize('<' + fmt)))[0]


def leaf(c, address, size, user):
    sp = c.reg_read(UC_X86_REG_ESP)
    c.reg_write(UC_X86_REG_EAX, group if address == 0x4ed8a0 else 0)
    c.reg_write(UC_X86_REG_EIP, read(sp, 'I'))
    c.reg_write(UC_X86_REG_ESP, sp + 4)


for address in [0x4d4040, 0x4ed8a0, 0x518630, 0x431ea0]:
    cpu.hook_add(UC_HOOK_CODE, leaf, begin=address, end=address)


def queues(p):
    return (bytes(cpu.mem_read(p + 0x8b, 18)), read(p + 0xa6, 'B'))


for mode in ['join', 'encounter']:
    for n in range(512):
        cpu.mem_write(0x938830, bytes(8000))
        cpu.mem_write(0x89d1c8, bytes(4 * 0xc65))
        write(0x89d178, 'I', rng.getrandbits(32))
        write(0x89d17c, 'I', 32)
        for i, p in enumerate(people):
            cpu.mem_write(p, bytes(256))
            write(0x890390 + (i + 1) * 4, 'I', p)
            write(p + 0x24, 'H', i + 1)
            write(p + 0x2a, '4B', 1, [2, 3, 7][n % 3], 10, 0)
            write(p + 0x2f, 'B', 1 if i == 1 else 0)
            write(p + 0x30, 'B', 2)
            write(p + 0x3d, 'HH', 2048 + i * 32, 2048)
            write(p + 0x6e, 'h', 1000)
            write(p + 0x7a, 'B', 128)
            ids = [j + 1 if rng.randrange(3) else 0 for j in range(8)]
            write(p + 0x8b, '8H', *ids)
            write(p + 0x9b, 'H', 9 if n & 1 else 0)
            write(p + 0xa6, 'B', n % 8)
            for j in range(1, 10):
                write(0x938830 + j * 10, 'BB4H', [3, 8, 19, 27][j % 4], 128, 3, 0, 1000 + j, 2000 + j)
        cpu.mem_write(group, bytes(256))
        write(group + 0x24, 'H', 100)
        write(group + 0x2a, 'BB', 10, 8 if mode == 'join' else 9)
        write(0x890390 + 400, 'I', group)
        if mode == 'join':
            write(group + 0x68, '3B', 2, 0, 1)
            write(group + 0x70, '6H', 1, 2, 0, 0, 0, 0)
        before = [queues(p) for p in people]
        orders = bytes(cpu.mem_read(0x938830, 8000))
        args = [people[2], group] if mode == 'join' else [people[0], people[1], 0]
        write(stack, 'I' * (len(args) + 1), stop, *args)
        cpu.reg_write(UC_X86_REG_ESP, stack)
        cpu.emu_start(0x51ddc0 if mode == 'join' else 0x51e150, stop, count=200000)
        assert cpu.reg_read(UC_X86_REG_EIP) == stop
        assert [queues(p) for p in people] == before, (mode, n, 'queue changed')
        assert bytes(cpu.mem_read(0x938830, 8000)) == orders, (mode, n, 'pool changed')
        admitted = [people[2]] if mode == 'join' else people[:2]
        assert all(read(p + 0x2c, 'B') == (25 if mode == 'join' else 29) for p in admitted)
        assert all(read(p + 0x9d, 'H') == 100 for p in admitted)

print('PASS: 1024 native fight/encounter handoffs with real person initialization; eight slots, immediate orders, cursors and entire shared pool remain unchanged.')
