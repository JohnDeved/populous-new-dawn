"""Inspect Mission 2's native ATTACK ownership and target retention.

Usage: python scripts/check-native-mission2-matak-raid.py /path/to/d3dpoptb.exe
The executable must have the adjacent levels/cpscr074.dat file.
"""
import hashlib
import json
import struct
import sys
from pathlib import Path

from unicorn import UC_HOOK_CODE
from unicorn.x86_const import UC_X86_REG_EAX, UC_X86_REG_EIP, UC_X86_REG_ESP

from decomp import native_cpu

root = Path(__file__).resolve().parents[1]
exe = Path(sys.argv[1])
source = exe.parent / "levels/cpscr074.dat"
original = json.loads((root / "app/original-script-two.json").read_text())
assert hashlib.sha256(exe.read_bytes()).hexdigest() == "3a5065c7420b3fcde208bf220bc86dfbac95e025ab2492caf9c7ea5308dfbe4f"
assert hashlib.sha256(source.read_bytes()).hexdigest() == original["sha256"]

cpu, _ = native_cpu(exe)
cpu.mem_map(0x2000000, 0x20000)
program, field, stack, stop = 0x2000000, 0x2004000, 0x201D000, 0x201E000
tribes = 0x89D1C8
matak = tribes + 3 * 0xC65


def write(address, fmt, *values):
    cpu.mem_write(address, struct.pack("<" + fmt, *values))


def call(address, *args):
    write(stack, "I" * (len(args) + 1), stop, *[arg & 0xFFFFFFFF for arg in args])
    cpu.reg_write(UC_X86_REG_ESP, stack)
    cpu.emu_start(address, stop, timeout=1000000, count=2000000)
    assert cpu.reg_read(UC_X86_REG_EIP) == stop
    return cpu.reg_read(UC_X86_REG_EAX) & 0xFFFFFFFF


def return_from_leaf(value=0):
    sp = cpu.reg_read(UC_X86_REG_ESP)
    cpu.reg_write(UC_X86_REG_EAX, value & 0xFFFFFFFF)
    cpu.reg_write(UC_X86_REG_EIP, struct.unpack("<I", cpu.mem_read(sp, 4))[0])
    cpu.reg_write(UC_X86_REG_ESP, sp + 4)


cpu.mem_write(tribes, bytes(4 * 0xC65))
for tribe in range(4):
    write(tribes + tribe * 0xC65 + 0xC22, "B", tribe)

write(field, "Ii", 2, 1213)
assert call(0x48F350, matak, program, field) == 7
write(field, "Ii", 2, 1180)
for tribe in range(4):
    write(0x89DBE7 + tribe * 2, "H", 0x1100 + tribe)
assert call(0x48F350, matak, program, field) == 0x1103

codes = [12, 1003, *original["codes"][679:694], 1004, 1019]
assert codes[2:] == [
    1006, 1059, 1118, 24, 1071, 127, 114, 28, 28, 68, 1078, 1, 32, 32, 32,
    1004, 1019,
]
blob = bytearray(12552)
struct.pack_into("<" + "H" * len(codes), blob, 0, *codes)
for index, record in enumerate(original["fields"]):
    struct.pack_into("<Ii", blob, 8192 + index * 8, *record)
struct.pack_into("<64i", blob, 12288, *original["variables"])
cpu.mem_write(program, bytes(blob))
allocator_args = []


def capture_allocator(cpu, address, size, user):
    sp = cpu.reg_read(UC_X86_REG_ESP)
    allocator_args.extend(struct.unpack("<14I", cpu.mem_read(sp + 4, 56)))
    return_from_leaf(1)


hook = cpu.hook_add(UC_HOOK_CODE, capture_allocator, begin=0x4E5FD0, end=0x4E5FD0)
call(0x48C6B0, matak, program)
cpu.hook_del(hook)
assert allocator_args[:6] == [matak, tribes, 2, 1, 7, 10]

target, replacement = 0x2008000, 0x2008100
for address, object_id in ((target, 77), (replacement, 78)):
    cpu.mem_write(address, bytes(256))
    write(address + 0x24, "H", object_id)
    write(address + 0x2A, "BBB", 2, 7, 2)
    write(0x890390 + object_id * 4, "I", address)
cpu.mem_write(matak, bytes(0xC65))
write(matak + 0xC22, "B", 3)
write(matak + 0x59A, "I", 1 << 20)
write(0x960833, "B", 1)
cpu.mem_write(program, bytes(blob))
selection_calls = []


def selection_leaf(cpu, address, size, user):
    sp = cpu.reg_read(UC_X86_REG_ESP)
    if address == 0x4F5240:
        owner, model = struct.unpack("<II", cpu.mem_read(sp + 4, 8))
        selection_calls.append((owner, model))
        return_from_leaf(target)
    elif address == 0x404420:
        object_, out = struct.unpack("<II", cpu.mem_read(sp + 4, 8))
        assert object_ in (target, replacement)
        write(out, "HH", 0x2600 if object_ == target else 0x3200, 0x4400)
        return_from_leaf()
    elif address == 0x48C650:
        return_from_leaf()
    elif address == 0x4627F0:
        return_from_leaf(1)


hooks = [
    cpu.hook_add(UC_HOOK_CODE, selection_leaf, begin=address, end=address)
    for address in (0x4F5240, 0x404420, 0x48C650, 0x4627F0)
]
call(0x48C6B0, matak, program)
for hook in hooks:
    cpu.hook_del(hook)
assert selection_calls == [(tribes, 7)]

task = matak + 0x36
assert cpu.mem_read(task + 0x4F, 1)[0] == 20
assert cpu.mem_read(task + 0x1E, 1)[0] == 0
assert cpu.mem_read(task + 0x23, 1)[0] == 7
assert struct.unpack("<I", cpu.mem_read(task + 0x32, 4))[0] == 77
assert struct.unpack("<i", cpu.mem_read(task + 0x36, 4))[0] == 2
assert struct.unpack("<i", cpu.mem_read(task + 0x3A, 4))[0] == 10

person = 0x2009000
cpu.mem_write(person, bytes(256))
write(person + 8, "I", 0)
write(person + 0x24, "H", 91)
write(person + 0x2A, "BBBB", 1, 3, 17, 3)
write(person + 0xAF, "B", 1)
write(matak + 0x881, "I", person)
write(target + 0x9F, "H", 1)
write(task + 0x42, "H", 17)
reacquire_calls = []


def reacquire_leaf(cpu, address, size, user):
    sp = cpu.reg_read(UC_X86_REG_ESP)
    if address in (0x4F6100, 0x4F6180):
        owner = struct.unpack("<I", cpu.mem_read(sp + 4, 4))[0]
        reacquire_calls.append((address, owner))
        return_from_leaf(replacement if address == 0x4F6100 else 0)
    elif address == 0x404420:
        object_, out = struct.unpack("<II", cpu.mem_read(sp + 4, 8))
        assert object_ == replacement
        write(out, "HH", 0x3200, 0x4400)
        return_from_leaf()
    elif address == 0x43B540:
        return_from_leaf()


hooks = [
    cpu.hook_add(UC_HOOK_CODE, reacquire_leaf, begin=address, end=address)
    for address in (0x4F6100, 0x4F6180, 0x404420, 0x43B540)
]
call(0x4CB400, matak, 0)
for hook in hooks:
    cpu.hook_del(hook)
assert reacquire_calls == [(0x4F6100, tribes)]
assert struct.unpack("<H", cpu.mem_read(task + 0x42, 2))[0] == 16
assert cpu.mem_read(task + 0x1E, 1)[0] == 0
assert struct.unpack("<I", cpu.mem_read(task + 0x32, 4))[0] == 78

print("PASS: Mission 2 ATTACK targets Blue model 7 with count 2 and damage 10")
print("PASS: INT1180 reads Blue-on-Matak kills and phase 17 retains target tribe 0")
