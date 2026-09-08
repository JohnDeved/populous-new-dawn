"""Compare stone positions from normal site creation and headings from stone init.

Usage: python scripts/check-native-reincarnation.py /path/to/d3dpoptb.exe
Runs native 0x433a10 state 3 and 0x4a7d80. Allocation, object registration,
shadow submission and the separate rise effect are intercepted; coordinate,
ground-height and angle code execute unmodified.
"""
import json
import random
import struct
import subprocess
import sys
from pathlib import Path

from unicorn import UC_HOOK_CODE
from unicorn.x86_const import UC_X86_REG_EAX, UC_X86_REG_EIP, UC_X86_REG_ESP
from decomp import ROOT, native_cpu

cpu, _ = native_cpu(Path(sys.argv[1]))
cpu.mem_map(0x2000000, 0x10000)
stack, stop, person, order, stone = 0x200d000, 0x200e000, 0x2001000, 0x2002000, 0x2003000
allocations = []


def write(address, fmt, *values):
    cpu.mem_write(address, struct.pack('<' + fmt, *values))


def read(address, fmt):
    return struct.unpack('<' + fmt, cpu.mem_read(address, struct.calcsize('<' + fmt)))


def intercept(cpu, address, size, user):
    sp = cpu.reg_read(UC_X86_REG_ESP)
    if address == 0x4ed8a0:
        unit_class, model, owner, position = read(sp + 4, '4I')
        assert (unit_class, model) == (8, 1)
        allocations.append(read(position, 'HHh'))
    cpu.reg_write(UC_X86_REG_EAX, 0)
    cpu.reg_write(UC_X86_REG_EIP, read(sp, 'I')[0])
    cpu.reg_write(UC_X86_REG_ESP, sp + 4)


for address in (0x4ed8a0, 0x4ed6f0, 0x4ed640, 0x4ee470, 0x4a66c0, 0x403c10, 0x4a7eb0):
    cpu.hook_add(UC_HOOK_CODE, intercept, begin=address, end=address)


def call(address, *args):
    write(stack, 'I' * (len(args) + 1), stop, *args)
    cpu.reg_write(UC_X86_REG_ESP, stack)
    cpu.emu_start(address, stop, count=10000)
    assert cpu.reg_read(UC_X86_REG_EIP) == stop


heights = [(i * 37 + (i >> 7) * 19) % 1024 for i in range(16384)]
flags = [(i ^ (i >> 7)) & 1 for i in range(16384)]
for i, (height, flag) in enumerate(zip(heights, flags)):
    write(0x8a03e4 + i * 16, 'Ih', flag, height)

rng = random.Random(0x433a10)
centers = [(x, y) for x in (0, 255, 256, 511, 32767, 32768, 65535)
           for y in (0, 256, 511, 32768, 65535)]
centers += [(4352, 55040)]  # First-mission blue shaman/site.
centers += [(rng.randrange(65536), rng.randrange(65536)) for _ in range(220)]
expected = []
for case, (x, y) in enumerate(centers):
    owner = case % 4
    tribe = 0x89d1c8 + owner * 0xc65
    write(tribe + 0x911, 'HHh', x, y, 0)
    results = []
    for index in range(8):
        cpu.mem_write(person, bytes(256))
        write(person + 0x2d, 'BBB', 3, 0, owner)
        write(person + 0x3d, 'HHh', x, y, 0)
        write(person + 0x70, 'h', index + 1)
        allocations.clear()
        call(0x433a10, person, order)
        assert len(allocations) == 1
        px, py, height = allocations[0]
        assert read(person + 0x70, 'h')[0] == index
        cpu.mem_write(stone, bytes(256))
        write(stone + 0x2b, 'B', 12)
        write(stone + 0x2f, 'B', owner)
        write(stone + 0x3d, 'HHh', px, py, height)
        call(0x4a7d80, stone)
        assert read(stone + 0x3d, 'HHh') == (px, py, height)
        results.append(dict(x=px, y=py, h=height, heading=read(stone + 0x26, 'H')[0]))
    expected.append(results)

script = """
import { reincarnationStones } from './app/reincarnation.ts';
let input = '';
for await (const chunk of process.stdin) input += chunk;
const { heights, flags, centers } = JSON.parse(input);
const land = { heights: Int16Array.from(heights), flags: Uint32Array.from(flags) };
console.log(JSON.stringify(centers.map(([x, y]) => reincarnationStones(land, { x, y }))));
"""
payload = json.dumps(dict(heights=heights, flags=flags, centers=centers)).encode()
actual = json.loads(subprocess.check_output(
    ['node', '--input-type=module', '-e', script], input=payload, cwd=ROOT
))
for i, (result, native) in enumerate(zip(actual, expected)):
    assert result == native, (centers[i], result, native)
assert len(actual) == len(expected)
print(f'PASS: {len(centers) * 8} stones from native site creation and initialization; '
      'all eight positions, four tribes, wrapped coordinates, cell snapping, '
      'both terrain diagonals, exact heights and headings')
