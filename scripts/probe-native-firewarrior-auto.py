"""Execute the complete native model-6 and ordinary combat selectors."""
import struct
import sys
from pathlib import Path

from unicorn.x86_const import UC_X86_REG_EAX, UC_X86_REG_EIP, UC_X86_REG_ESP

sys.path.insert(0, str(Path(__file__).resolve().parent))
from decomp import configure_native_constants, native_cpu  # noqa: E402

exe = Path(sys.argv[1])
cpu, identity = native_cpu(exe)
configure_native_constants(cpu, exe)
cpu.mem_map(0x2000000, 0x50000)
base, order, out, stack, stop = 0x2000000, 0x2040000, 0x2040100, 0x204D000, 0x204F000
write = lambda address, fmt, *values: cpu.mem_write(address, struct.pack("<" + fmt, *values))
read = lambda address, fmt: struct.unpack(
    "<" + fmt, cpu.mem_read(address, struct.calcsize("<" + fmt))
)[0]
address = lambda object_id: base + object_id * 256


def call(entry, *args):
    write(stack, "I" * (len(args) + 1), stop, *args)
    cpu.reg_write(UC_X86_REG_ESP, stack)
    cpu.emu_start(entry, stop, count=2_000_000)
    assert cpu.reg_read(UC_X86_REG_EIP) == stop, hex(cpu.reg_read(UC_X86_REG_EIP))
    return cpu.reg_read(UC_X86_REG_EAX) & 0xFFFF


land = bytearray(16384 * 16)
for cell in range(16384):
    struct.pack_into("<h", land, cell * 16 + 4, 128)
cpu.mem_write(0x8A03E4, bytes(land))
cpu.mem_write(0x890390, bytes(4096))
cpu.mem_write(base, bytes(8 * 256))
cpu.mem_write(0x9608B6, bytes(4))
write(0x89D17C, "I", 0)


def person(object_id, model, tribe, x, y):
    p = address(object_id)
    write(0x890390 + object_id * 4, "I", p)
    write(p + 0x24, "H", object_id)
    write(p + 0x2A, "BBB", 1, model, 17)
    write(p + 0x2F, "b", tribe)
    write(p + 0x3D, "HHh", x, y, 128)
    write(p + 0x6E, "h", 1000)
    return p


source = person(1, 6, 0, 8704, 9216)
farther_firewarrior = person(2, 6, 1, 9345, 10245)
nearer_preacher = person(3, 4, 1, 7858, 8388)
for object_id, p in ((1, source), (2, farther_firewarrior), (3, nearer_preacher)):
    cell = (read(p + 0x3F, "H") >> 9) * 128 + (read(p + 0x3D, "H") >> 9)
    write(0x8A03E4 + cell * 16 + 6, "H", object_id)

packed = ((8704 >> 8) & 254) | (9216 & 0xFE00)
write(order, "BBHHHH", 21, 32, 1, 0, packed, 0x0404)


def reset_reservations():
    for p in (farther_firewarrior, nearer_preacher):
        write(p + 0x10, "I", 0)
        write(p + 0x31, "BB", 0, 0)


def select(entry):
    write(out, "B", 255)
    selected = call(entry, source, order, out, 0) if entry == 0x51D0B0 else call(entry, source, order, out)
    return selected, read(out, "B")


reset_reservations()
specialized = select(0x51D0B0)
specialized_reserved = read(farther_firewarrior + 0x10, "I") & 0x300000
specialized_repeat = select(0x51D0B0)
specialized_repeat_reserved = read(nearer_preacher + 0x10, "I") & 0x300000
specialized_saturated = select(0x51D0B0)
reset_reservations()
ordinary = select(0x51C4C0)
assert specialized == (2, 2), specialized
assert specialized_reserved == 0x200000, hex(specialized_reserved)
assert specialized_repeat == (3, 2), specialized_repeat
assert specialized_repeat_reserved == 0x200000, hex(specialized_repeat_reserved)
assert specialized_saturated == (2, 2), specialized_saturated
assert ordinary == (3, 2), ordinary
print(
    "PASS: complete 0051d0b0 selects the farther hostile model 6 while complete "
    "0051c4c0 selects the nearer hostile model 4; repeated specialist selection "
    "reserves 0x200000, advances, then falls back when saturated; no intercepted "
    f"leaves ({identity['sha256']})"
)
