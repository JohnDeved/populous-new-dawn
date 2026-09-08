"""Capture original Direct3D texture filter states without a Windows/GPU runtime.
Usage: python scripts/check-native-texture-filter.py /path/to/d3dpoptb.exe
Complete batch initialization/state transitions execute; only COM methods are
supplied. This proves selected filter modes, not legacy hardware raster output.
"""
import struct
import sys
from pathlib import Path
from unicorn import UC_HOOK_CODE
from unicorn.x86_const import UC_X86_REG_EAX, UC_X86_REG_ECX, UC_X86_REG_EIP, UC_X86_REG_ESP
from decomp import native_cpu

cpu, _ = native_cpu(Path(sys.argv[1]))
cpu.mem_map(0x2000000, 0x1000000)
ui, device, vtable, material, material_vtable = 0x2000000, 0x2003000, 0x2003100, 0x2003200, 0x2003300
context, state, stack, stop = 0x2100000, 0x2004000, 0x2ffd000, 0x2ffe000
render_call, handle_call = 0x2ffb000, 0x2ffb100


def write(address, fmt, *values):
    cpu.mem_write(address, struct.pack('<' + fmt, *values))


def read(address, fmt):
    return struct.unpack('<' + fmt, cpu.mem_read(address, struct.calcsize('<' + fmt)))[0]


def call(address, *args):
    write(stack, 'I' * (len(args) + 1), stop, *args)
    cpu.reg_write(UC_X86_REG_ESP, stack)
    cpu.reg_write(UC_X86_REG_ECX, context)
    cpu.emu_start(address, stop, count=1000000)
    assert cpu.reg_read(UC_X86_REG_EIP) == stop


def com(cpu, address, size, user):
    sp = cpu.reg_read(UC_X86_REG_ESP)
    if address == render_call:
        assert read(sp + 4, 'I') == device
        events.append((read(sp + 8, 'I'), read(sp + 12, 'I')))
    else:
        assert read(sp + 4, 'I') == material
        assert read(sp + 8, 'I') == device
        write(read(sp + 12, 'I'), 'I', 1)
    cpu.reg_write(UC_X86_REG_EAX, 0)
    cpu.reg_write(UC_X86_REG_EIP, read(sp, 'I'))
    cpu.reg_write(UC_X86_REG_ESP, sp + 16)


for address in [render_call, handle_call]:
    cpu.hook_add(UC_HOOK_CODE, com, begin=address, end=address)
write(0xafc2f4, 'I', ui)
write(device, 'I', vtable)
write(vtable + 0x5c, 'I', render_call)
write(0x59df74, 'I', material)
write(material, 'I', material_vtable)
write(material_vtable + 0x14, 'I', handle_call)
write(context + 0x26, 'I', device)
write(0xa6910c, 'I', 0)

# Initialization chooses either nearest (1) or bilinear (2), never mip filters.
for mode in [0, 1, 2]:
    for smooth in [0, 1]:
        write(ui + 0x640, 'I', mode)
        write(0x5d54c8, 'I', smooth)
        events = []
        call(0x47cc60)
        filters = [event for event in events if event[0] in [17, 18]]
        expected = 1 if mode == 1 and not smooth else 2
        assert filters == [(17, expected), (18, expected)], (mode, smooth, events)

# Changing flag 0x20 selects nearest for individual batches in normal mode.
# The alternate global-filter mode leaves the initial sampler unchanged.
for mode in [0, 1]:
    write(ui + 0x640, 'I', mode)
    for flags in range(1024):
        for previous in [flags, flags ^ 32]:
            write(state, 'I', previous)
            events = []
            call(0x47d6f0, device, state, flags)
            assert read(state, 'I') == flags
            filters = [event for event in events if event[0] in [17, 18]]
            expected = [] if mode == 1 or previous == flags else [(17, 1 if flags & 32 else 2), (18, 1 if flags & 32 else 2)]
            assert filters == expected, (mode, flags, previous, events)
print('PASS: 6 complete native texture-batch initializations and 4,096 state transitions; '
      'nearest/bilinear selection, repeated state and global-filter mode')
