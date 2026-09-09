"""Capture complete 0046ec80 pass ordering through mixed native cell chains.
Usage: python SCRIPT EXE [--record]
Polygon consumers are observed, not rasterized. List insertion/movement and the
cell dispatcher execute unchanged. Covers ordinary people/models/construction/HFX.
"""
import itertools
import json
import struct
import sys
from pathlib import Path
from unicorn import UC_HOOK_CODE
from unicorn.x86_const import UC_X86_REG_ESP, UC_X86_REG_EIP, UC_X86_REG_EAX
from decomp import native_cpu, ROOT

cpu, identity = native_cpu(Path(sys.argv[1]))
cpu.mem_map(0x2000000, 0x10000)
base, target, stack, stop = 0x2000000, 0x2001000, 0x200f000, 0x200ff00
descriptors = [14, 15, 2, 10, 48]
classes = [1, 1, 2, 2, 7]
phases = [0, 0, 1, 1, 0]
calls = []


def write(a, fmt, *values):
    cpu.mem_write(a, struct.pack('<' + fmt, *values))


def read(a, fmt):
    return struct.unpack('<' + fmt, cpu.mem_read(a, struct.calcsize('<' + fmt)))[0]


def call(address, *args):
    write(stack, 'I' * (len(args) + 1), stop, *args)
    cpu.reg_write(UC_X86_REG_ESP, stack)
    cpu.emu_start(address, stop, count=10000)
    assert cpu.reg_read(UC_X86_REG_EIP) == stop


def observe(c, address, size, data):
    sp = c.reg_read(UC_X86_REG_ESP)
    pointer = read(sp + (8 if address in (0x46f080, 0x46f9e0) else 4), 'I')
    calls.append(read(pointer + 0x24, 'H'))
    c.reg_write(UC_X86_REG_EAX, 0)
    c.reg_write(UC_X86_REG_EIP, read(sp, 'I'))
    c.reg_write(UC_X86_REG_ESP, sp + 4)


for address in (0x46f080, 0x46f9e0, 0x4708d0, 0x471c40):
    cpu.hook_add(UC_HOOK_CODE, observe, begin=address, end=address)
write(0x74a348, 'II', 0x4708d0, 0x471c40)
write(0x75d504, 'II', 100, 0)
for i in range(5):
    write(0x890390 + (i + 1) * 4, 'I', base + i * 256)
cases = []
for insertion in itertools.permutations(range(1, 6)):
    cpu.mem_write(0x8a03e4, bytes(16384 * 16))
    for i, (descriptor, kind) in enumerate(zip(descriptors, classes)):
        p = base + i * 256
        cpu.mem_write(p, bytes(256))
        write(p + 0x24, 'H', i + 1)
        write(p + 0x2a, 'BB', kind, 2)
        write(p + 0x3a, 'B', descriptor)
        write(p + 0x3d, 'HHh', 256, 256, 0)
    for id in insertion:
        p = base + (id - 1) * 256
        call(0x4ee470, p, p + 0x3d)
    for movement in ['initial', 'same-cell', 'leave', 'return']:
        first = base + (insertion[0] - 1) * 256
        if movement != 'initial':
            write(target, 'HHh', 768 if movement == 'leave' else 257, 256, 0)
            call(0x4ee580, first, target)
        for i in range(5):
            write(base + i * 256 + 0x35, 'H', 0)
        calls.clear()
        call(0x46ec80, 0x8a03e4)
        chain = list(reversed(insertion))
        if movement == 'leave':
            chain.remove(insertion[0])
        if movement == 'return':
            chain.remove(insertion[0])
            chain.insert(0, insertion[0])
        expected = sorted(chain, key=lambda id: phases[id - 1])
        assert calls == expected, (insertion, movement, calls, expected)
        cases.append(dict(insertion=list(insertion), movement=movement, chain=chain, submitted=list(calls)))
fixture = dict(executableSha256=identity['sha256'], phases=phases, cases=cases)
path = ROOT / 'tests/fixtures/cell-render-order.json'
if '--record' in sys.argv:
    path.write_text(json.dumps(fixture, separators=(',', ':')) + '\n')
else:
    assert json.loads(path.read_text()) == fixture
print(f'PASS: {len(cases)} native mixed-cell dispatches: sprite/model passes, insertion permutations, same-cell moves and departure/return ordering')
