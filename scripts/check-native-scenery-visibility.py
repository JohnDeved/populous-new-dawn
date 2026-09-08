"""Run the original cell renderer with adjacent tree/building records.

The polygon consumers are observed, not rasterized; this checks submission and
visibility flags, not complete frame equivalence. The Windows app is not launched.
Usage: python scripts/check-native-scenery-visibility.py /path/to/d3dpoptb.exe
"""
import itertools, struct, sys
from pathlib import Path
from unicorn import UC_HOOK_CODE
from unicorn.x86_const import UC_X86_REG_ESP, UC_X86_REG_EIP, UC_X86_REG_EAX
from decomp import native_cpu

cpu, _ = native_cpu(Path(sys.argv[1]))
cpu.mem_map(0x2000000, 0x10000)
cell, tree, building, stack, stop = 0x2000000, 0x2000100, 0x2000200, 0x200f000, 0x200ff00
calls = []

def write(address, fmt, *values):
    cpu.mem_write(address, struct.pack('<' + fmt, *values))

def read(address, fmt):
    return struct.unpack('<' + fmt, cpu.mem_read(address, struct.calcsize('<' + fmt)))[0]

def observe(cpu, address, size, data):
    sp = cpu.reg_read(UC_X86_REG_ESP)
    calls.append((address, read(sp + 4, 'I')))
    cpu.reg_write(UC_X86_REG_EAX, probe & 0xffffffff)
    cpu.reg_write(UC_X86_REG_EIP, read(sp, 'I'))
    cpu.reg_write(UC_X86_REG_ESP, sp + 4)

# Original queue probe, ordinary/construction consumers, morph, overlay.
for address in (0x48b2c0, 0x4708d0, 0x471c40, 0x40c9f0, 0x46f850):
    cpu.hook_add(UC_HOOK_CODE, observe, begin=address, end=address)
write(0x74a348, 'II', 0x4708d0, 0x471c40)
write(0x890390, 'III', 0, tree, building)
count = 0
for model, flags, first, offset, probe, full in itertools.product(
    range(1, 7), (0, 1, 0x10, 8, 0x8000), (1, 2), (0, 256, 512, 1024), (-1, 0, 4), (False, True)
):
    calls.clear()
    cpu.mem_write(cell, bytes(16)); cpu.mem_write(tree, bytes(256)); cpu.mem_write(building, bytes(256))
    write(cell + 6, 'H', first)
    for pointer, next_id, kind, object_model, x in (
        (tree, 2 if first == 1 else 0, 5, model, 256),
        (building, 1 if first == 2 else 0, 2, 1, 256 + offset),
    ):
        write(pointer + 0x20, 'H', next_id)
        write(pointer + 0x2a, 'BB', kind, object_model)
        write(pointer + 0x3a, 'B', 2)  # Native descriptor's ordinary 3D object type.
        write(pointer + 0x3d, 'HH', x, 256)
    assert read(0x5a6af8 + 2 * 11, 'B') == 3
    assert read(0x5a79b0 + model * 24, 'H') == 2
    write(tree + 0x35, 'H', 0x280 | flags)
    write(0x75d504, 'II', 100, 100 if full else 0)
    write(0x87cbbc, 'H', 0)
    write(stack, 'II', stop, cell); cpu.reg_write(UC_X86_REG_ESP, stack)
    cpu.emu_start(0x46ec80, stop, count=10000)
    assert cpu.reg_read(UC_X86_REG_EIP) == stop
    visible = not full and not flags & 0x11
    assert calls.count((0x4708d0, tree)) == int(visible), (model, flags, calls)
    assert calls.count((0x4708d0, building)) == int(not full)
    assert calls.count((0x48b2c0, tree)) == int(visible)
    assert calls.count((0x40c9f0, tree)) == int(visible and bool(flags & 8))
    assert calls.count((0x46f850, tree)) == int(visible and bool(flags & 0x8000))
    assert read(0x87cbbc, 'H') == int(visible and probe == 4)
    count += 1
print(f'PASS: {count:,} native cell renderer calls; tree/building order and distance, hide/drawn flags, pool limits, morph and overlay submissions')
