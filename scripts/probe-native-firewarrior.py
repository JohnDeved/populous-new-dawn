"""Probe native firewarrior launch/impact with supplied allocation and world state.
Usage: python scripts/probe-native-firewarrior.py /path/to/d3dpoptb.exe
Requires adjacent levels/constant.dat. Reports damage observations, not browser parity.
See decomp/research/firewarrior.md for intercepted leaves and untested boundaries.
"""
import struct
import sys
from pathlib import Path

from unicorn import UC_HOOK_CODE
from unicorn.x86_const import UC_X86_REG_EAX, UC_X86_REG_EIP, UC_X86_REG_ESP

sys.path.insert(0, str(Path(__file__).resolve().parent))
from decomp import configure_native_constants, native_cpu


exe = Path(sys.argv[1])
cpu, identity = native_cpu(exe)
configure_native_constants(cpu, exe)
cpu.mem_map(0x2000000, 0x50000)

base, stack, stop, thunk = 0x2000000, 0x204D000, 0x204E000, 0x2040000
source, target, shots = base, base + 0x100, [base + 0x200, base + 0x300]
write = lambda address, fmt, *values: cpu.mem_write(address, struct.pack("<" + fmt, *values))
read = lambda address, fmt: struct.unpack("<" + fmt, cpu.mem_read(address, struct.calcsize("<" + fmt)))[0]
events = []
capacity = 2


def ret(value=0):
    sp = cpu.reg_read(UC_X86_REG_ESP)
    cpu.reg_write(UC_X86_REG_EAX, value)
    cpu.reg_write(UC_X86_REG_EIP, read(sp, "I"))
    cpu.reg_write(UC_X86_REG_ESP, sp + 4)


def alloc(index, cls, model, tribe, point):
    p = shots[index]
    cpu.mem_write(p, bytes(256))
    object_id = 3 + index
    write(0x890390 + object_id * 4, "I", p)
    write(p + 0x24, "H", object_id)
    write(p + 0x2A, "BBB", cls, model, 1)
    write(p + 0x2F, "B", tribe)
    cpu.mem_write(p + 0x3D, bytes(cpu.mem_read(point, 6)))
    write(p + 0x0C, "I", 0x400)
    old = read(0x890324, "I")
    write(p, "II", 0, old)
    if old:
        write(old, "I", p)
    write(0x890324, "I", p)
    return p


def hook(c, address, size, user):
    global capacity, thunk
    sp = c.reg_read(UC_X86_REG_ESP)
    if address == 0x4ED8A0:
        cls, model, tribe = [read(sp + offset, "I") & 0xFF for offset in (4, 8, 12)]
        point = read(sp + 16, "I")
        events.append(("allocate", cls, model, tribe))
        if (cls, model) != (8, 6) or capacity == 0:
            ret()
            return
        index = 2 - capacity
        capacity -= 1
        p = alloc(index, cls, model, tribe, point)
        code = (
            b"\x68" + struct.pack("<I", p)
            + b"\xb8" + struct.pack("<I", 0x4ED580)
            + b"\xff\xd0\x83\xc4\x04\xb8" + struct.pack("<I", p) + b"\xc3"
        )
        c.mem_write(thunk, code)
        c.reg_write(UC_X86_REG_EIP, thunk)
        thunk += 32
        return
    if address == 0x48A050:
        events.append(("sound", read(sp + 8, "I")))
        ret()
        return
    if address == 0x4EE700:
        events.append(("animation", read(sp + 8, "I"), read(sp + 12, "I")))
        ret()
        return
    if address == 0x4010B0:
        events.append(("sunlight",))
        ret()
        return
    if address == 0x4EDCF0:
        events.append(("delete", read(read(sp + 4, "I") + 0x24, "H")))
    if address in (0x520610, 0x4DE570):
        ret()


for address in (0x4ED8A0, 0x48A050, 0x4EE700, 0x4010B0, 0x4EDCF0, 0x520610, 0x4DE570):
    cpu.hook_add(UC_HOOK_CODE, hook, begin=address, end=address)


def call(address, *args):
    write(stack, "I" * (len(args) + 1), stop, *args)
    cpu.reg_write(UC_X86_REG_ESP, stack)
    cpu.emu_start(address, stop, count=1_000_000)
    assert cpu.reg_read(UC_X86_REG_EIP) == stop, hex(cpu.reg_read(UC_X86_REG_EIP))
    return cpu.reg_read(UC_X86_REG_EAX)


# Flat land, two people, deterministic allocation context and identity tables.
land = bytearray(16384 * 16)
for i in range(16384):
    struct.pack_into("<Ih", land, i * 16, 8, 128)
cpu.mem_write(0x8A03E4, bytes(land))
cpu.mem_write(0x890390, bytes(4096))
cpu.mem_write(0x2031000, bytes(1024))
write(0x892443, "I", 0x2031000)
write(0x89243A, "B", 0)
write(0x890324, "I", source)
write(0x890390 + 4, "I", source)
write(0x890390 + 8, "I", target)

for p, object_id, model, tribe, x in ((source, 1, 6, 0, 0x2200), (target, 2, 2, 1, 0x2600)):
    cpu.mem_write(p, bytes(256))
    write(p + 0x24, "H", object_id)
    write(p + 0x2A, "BBB", 1, model, 1)
    write(p + 0x2F, "B", tribe)
    write(p + 0x3D, "HHh", x, 0x2400, 128)
    write(p + 0x1C, "h", 64)
    write(p + 0x5D, "h", 0)
    write(p + 0x6E, "h", 1000)
write(source, "II", 0, target)
write(target, "II", source, 0)

cell = (0x2400 >> 9) * 128 + (0x2600 >> 9)
write(0x8A03E4 + cell * 16 + 6, "H", 2)
write(target + 0x20, "H", 0)
write(source + 0xB2, "b", 0)

projectile_id = call(0x51FBF0, source, target, 0) & 0xFFFF
assert projectile_id == 4, projectile_id
assert read(source + 0xB2, "b") == 25
for p in shots:
    assert read(p + 0x2A, "BB") == 8
    assert read(p + 0x2B, "B") == 6
    assert read(p + 0x88, "H") == 1
    assert read(p + 0x8A, "H") == 2
    assert read(p + 0x5F, "h") == 0x200
assert events.count(("animation", 0x1D, 0x460)) == 2

before = read(target + 0x6E, "h")
for _ in range(64):
    if read(shots[1] + 0x2A, "B") == 0:
        break
    call(0x4BBF30, shots[1])
after = read(target + 0x6E, "h")
assert after < before, (before, after, events)
assert any(event[0] == "delete" and event[1] == 4 for event in events), events

damage = {}
for model in (2, 3, 4, 5, 6, 7, 8):
    write(target + 0x2A, "BBB", 1, model, 1)
    write(target + 0x6E, "h", 30000)
    write(target + 0x0C, "I", 0)
    write(target + 0x10, "I", 0)
    write(target + 0x14, "I", 0)
    write(shots[1] + 0x0C, "I", 0)
    write(shots[1] + 0x10, "I", 0)
    write(shots[1] + 0x14, "I", 0)
    write(shots[1] + 0x2A, "BBB", 8, 6, 1)
    write(shots[1] + 0x2F, "B", 0)
    write(shots[1] + 0x3D, "HHh", 0x2600, 0x2400, 128)
    write(shots[1] + 0x88, "HH", 1, 2)
    write(0x8A03E4 + cell * 16 + 6, "H", 2)
    call(0x514410, shots[1])
    damage[model] = 30000 - read(target + 0x6E, "h")
print(f"PASS: scoped native paired firewarrior launch, cooldown 25, object 0x460, speed 0x200, nonlethal impact and deletion ({identity['sha256']})")
print(f"OBSERVED damage by target model with supplied balance data: {damage}")
