"""Prove 0x4faaf0 uses occupied model-18 Vault socket 1 for the Mission 7 reward.
Usage: python SCRIPT EXE
"""
import hashlib
from pathlib import Path
import struct
import sys

from unicorn import UC_HOOK_CODE
from unicorn.x86_const import UC_X86_REG_EAX, UC_X86_REG_EIP, UC_X86_REG_ESP

from decomp import load_native_shapes, native_cpu

exe = Path(sys.argv[1])
cpu, _ = native_cpu(exe)
cpu.mem_map(0x2000000, 0x500000)
reward, vault, objects, shapes = 0x2000000, 0x2001000, 0x2030000, 0x2060000
stack, stop = 0x204d000, 0x204e000
load_native_shapes(cpu, exe, objects, shapes)

def read(address, fmt):
    return struct.unpack('<' + fmt, cpu.mem_read(address, struct.calcsize('<' + fmt)))[0]

def write(address, fmt, *values):
    cpu.mem_write(address, struct.pack('<' + fmt, *values))

def ret(value=0):
    sp = cpu.reg_read(UC_X86_REG_ESP)
    cpu.reg_write(UC_X86_REG_EIP, read(sp, 'I'))
    cpu.reg_write(UC_X86_REG_ESP, sp + 4)
    cpu.reg_write(UC_X86_REG_EAX, value & 0xffffffff)

def ignore(cpu, address, size, user):
    ret()

def insert(cpu, address, size, user):
    sp = cpu.reg_read(UC_X86_REG_ESP)
    assert read(sp + 4, 'I') == reward
    ret()

def add_to_cell(cpu, address, size, user):
    sp = cpu.reg_read(UC_X86_REG_ESP)
    assert read(sp + 4, 'I') == reward
    point = read(sp + 8, 'I')
    x, y = struct.unpack('<HH', cpu.mem_read(point, 4))
    write(reward + 0x3d, 'HH', x, y)
    ret()

def height(cpu, address, size, user):
    # Deterministic terrain consumer: both 0x404540 and 0x4faaf0 call this.
    ret(200)

def set_object(cpu, address, size, user):
    sp = cpu.reg_read(UC_X86_REG_ESP)
    destination, _, frame = struct.unpack('<III', cpu.mem_read(sp + 4, 12))
    write(destination, 'H', frame)
    ret()

socket_calls = []
def observe_socket(cpu, address, size, user):
    sp = cpu.reg_read(UC_X86_REG_ESP)
    socket_calls.append((read(sp + 4, 'I'), read(sp + 8, 'I')))

for address, hook in ((0x4ee470, insert), (0x4ee580, add_to_cell),
                      (0x44e940, height), (0x4ee700, set_object)):
    cpu.hook_add(UC_HOOK_CODE, hook, begin=address, end=address)
cpu.hook_add(UC_HOOK_CODE, observe_socket, begin=0x404540, end=0x404540)

# Supply the original smoke-offset table exactly as the existing socket oracle does.
raw = (exe.parent / 'data/smoke.txt').read_bytes()
assert hashlib.sha256(raw).hexdigest() == '48d460819cdbc7d32ae7253150752c3d2ea641b07d797d0914525545f5e19cb1'
for line in raw.decode('ascii').splitlines():
    parts = line.split('#', 1)[0].split()
    if parts:
        model, angle, x, h, y = map(int, parts[1:])
        write(0x5f0558 + (model * 4 + angle) * 6, 'hhh', x, h, y)

# Mission 7 authored model-18 Vault: browser (96,-62) -> native anchor 26624/13824,
# angle 1024, object frame 154. Its class-6/model-2 reward is at browser (97,-63).
cpu.mem_write(vault, bytes(256))
write(vault + 0x2b, 'B', 18)
write(vault + 0x33, 'H', 154)
write(vault + 0x26, 'H', 1024)
write(vault + 0x7a, 'HH', 26624, 13824)

cpu.mem_write(reward, bytes(256))
write(reward + 0x0e, 'B', 0x10)  # keep class initializer out of this placement fixture
write(reward + 0x14, 'B', 4)
write(reward + 0x3d, 'HH', 26880, 14080)
write(reward + 0x7c, 'B', 6)
write(reward + 0x74, 'I', 6)

# 0x4faaf0 derives this cell address from the high bytes of reward XY.
packed_cell = ((0x69 & 0xfe) * 2) | (0x37 & 0xfe) << 8
cell = 0x8a03e4 + packed_cell * 4
write(cell + 8, 'H', 1)
write(cell + 1, 'B', read(cell + 1, 'B') | 2)
write(0x890390 + 4, 'I', vault)

write(stack, 'II', stop, reward)
cpu.reg_write(UC_X86_REG_ESP, stack)
cpu.emu_start(0x4faaf0, stop, count=100000)
assert cpu.reg_read(UC_X86_REG_EIP) == stop
assert socket_calls == [(vault, 1)], socket_calls
x, y = struct.unpack('<HH', cpu.mem_read(reward + 0x3d, 4))
height_value = read(reward + 0x41, 'h')
assert (x, y) == (26880, 14080), (x, y)
assert height_value == 200 + 1072, height_value
assert read(reward + 0x33, 'H') == 1056
print('PASS: 0x4faaf0 occupied model-18 branch called Vault socket 1; Mission7 reward XY=26880/14080 and heightOffset=1072')
