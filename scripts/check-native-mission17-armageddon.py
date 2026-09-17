"""Non-recording Mission 17 Armageddon acquisition and cast check."""
import argparse
import hashlib
import struct
import sys
from pathlib import Path

from unicorn import UC_HOOK_CODE
from unicorn.x86_const import UC_X86_REG_EAX, UC_X86_REG_EIP, UC_X86_REG_ESP

HERE = Path(__file__).resolve().parent
ROOT = next(path for path in [HERE, *HERE.parents] if (path / "scripts/decomp.py").is_file())
sys.path.insert(0, str(ROOT / "scripts"))
from decomp import configure_native_constants, native_cpu  # noqa: E402

parser = argparse.ArgumentParser()
parser.add_argument("exe", type=Path)
parser.add_argument("--level-dir", type=Path)
args = parser.parse_args()
exe = args.exe.resolve()
levels = (args.level_dir or exe.parent / "levels").resolve()
paths = {
    "d3dpoptb.exe": exe,
    "constant.dat": levels / "constant.dat",
    "levl2017.dat": levels / "levl2017.dat",
}
expected = {
    "d3dpoptb.exe": "3a5065c7420b3fcde208bf220bc86dfbac95e025ab2492caf9c7ea5308dfbe4f",
    "constant.dat": "e905e513c798171d5540082565b8addc9f54e5851006b56e8d1976687ba42f24",
    "levl2017.dat": "536a1dd0118f702df6acc193c3f23a81b33ce0df8a80158337f366f861932b41",
}
assert {name: hashlib.sha256(path.read_bytes()).hexdigest() for name, path in paths.items()} == expected


def record(index):
    data = paths["levl2017.dat"].read_bytes()
    raw = data[0x14043 + index * 55 : 0x14043 + (index + 1) * 55]
    x, y = struct.unpack_from("<hh", raw, 3)
    return raw[1], raw[0], raw[2], [x / 256 - 8, -y / 256 - 8], list(raw[7:39])


trigger, gift = record(440), record(442)
link = trigger[4][6] | trigger[4][7] << 8
assert (trigger[:3], trigger[3], link) == ((6, 6, 0), [3.0, 117.0], 443)
assert (gift[:3], gift[3], gift[4][:4]) == ((6, 2, 255), [3.0, 117.0], [11, 18, 3, 1])

cpu, _ = native_cpu(exe)
configure_native_constants(cpu, exe)
cpu.mem_map(0x2000000, 0x100000)
BASE, SHAMAN, TARGET, STACK, STOP = 0x2000000, 0x2080000, 0x2091000, 0x20FD000, 0x20FE000


def write(address, fmt, *values):
    cpu.mem_write(address, struct.pack("<" + fmt, *values))


def read(address, fmt="I"):
    return struct.unpack("<" + fmt, cpu.mem_read(address, struct.calcsize("<" + fmt)))[0]


def invoke(address, *values):
    write(STACK, "I" * (len(values) + 1), STOP, *values)
    cpu.reg_write(UC_X86_REG_ESP, STACK)
    cpu.emu_start(address, STOP, count=1_000_000)
    assert cpu.reg_read(UC_X86_REG_EIP) == STOP
    return cpu.reg_read(UC_X86_REG_EAX) & 0xFFFFFFFF


def return_from_hook(value=0):
    sp = cpu.reg_read(UC_X86_REG_ESP)
    cpu.reg_write(UC_X86_REG_EIP, read(sp))
    cpu.reg_write(UC_X86_REG_ESP, sp + 4)
    cpu.reg_write(UC_X86_REG_EAX, value)


allocations = []
next_unit = 0
fail_alloc = False


def allocation(_cpu, _address, _size, _user):
    global next_unit
    sp = cpu.reg_read(UC_X86_REG_ESP)
    unit_class, model, owner, position = struct.unpack("<IIII", cpu.mem_read(sp + 4, 16))
    item = [unit_class & 255, model & 255, owner & 255, *struct.unpack("<hhh", cpu.mem_read(position, 6))]
    allocations.append(item)
    if fail_alloc:
        return_from_hook()
        return
    pointer = BASE + next_unit * 0x100
    next_unit += 1
    cpu.mem_write(pointer, bytes(0x100))
    write(pointer + 0x2A, "BB", unit_class & 255, model & 255)
    write(pointer + 0x2F, "B", owner & 255)
    cpu.mem_write(pointer + 0x3D, bytes(cpu.mem_read(position, 6)))
    item.append(pointer)
    return_from_hook(pointer)


def ignore(_cpu, _address, _size, _user):
    return_from_hook()


for address, callback in ((0x4ED8A0, allocation), (0x4ED6F0, ignore), (0x4ED640, ignore), (0x48A050, ignore)):
    cpu.hook_add(UC_HOOK_CODE, callback, begin=address, end=address)


def stock_case(stock, timer=1, visits=1):
    unit = BASE + 0x8000
    cpu.mem_write(unit, bytes(0x100))
    write(unit + 0x2A, "BBBB", 6, 2, 0, 1)
    write(unit + 0x74, "I", 18)
    write(unit + 0x7A, "hBBBBBBB", timer, 11, 0, 0, 6, 0, 3, 0)
    write(unit + 0x7E, "B", 0)
    write(unit + 0x80, "B", 3)
    write(0x89C6F0, "b", -1)
    write(0x96071E + 18, "B", stock)
    for _ in range(visits):
        invoke(0x4FACF0, unit)
    return read(0x96071E + 18, "B")


assert [stock_case(0), stock_case(1), stock_case(0xFF), stock_case(0, 82, 82)] == [0x11, 0x11, 0xFF, 0x11]

tribe = 0x89D1C8
cpu.mem_write(tribe, bytes(0xC65))
cpu.mem_write(SHAMAN, bytes(0x100))
write(0x89C6F0, "b", 0)
write(tribe + 0x89D, "I", SHAMAN)
write(tribe + 0xC1F, "B", 1)
write(SHAMAN + 0x2A, "BBB", 1, 7, 0)
write(SHAMAN + 0x2F, "B", 0)
write(SHAMAN + 0x3D, "HHh", 0x4000, 0x4000, 320)
write(TARGET, "HH", 0x4400, 0x4000)
results = []
for category in (0, 1):
    cell = ((0x4000 >> 9) * 128 + (0x4400 >> 9)) * 16
    write(0x8A03E4 + cell + 12, "B", category)
    results.append(invoke(0x4C24F0, 0, 0, 18, TARGET, 0))
write(TARGET, "HH", 0x7000, 0x4000)
results.append(invoke(0x4C24F0, 0, 0, 18, TARGET, 0))
write(tribe + 0x89D, "I", 0)
write(TARGET, "HH", 0x4400, 0x4000)
results.append(invoke(0x4C24F0, 0, 0, 18, TARGET, 0))
assert results == [1, 1, 0xFFFFFFFE, 0xFFFFFFFF]

write(tribe + 0x89D, "I", SHAMAN)
write(tribe + 0xC22, "B", 0)
write(0x96071E + 18, "B", 0x11)
write(0x892443, "I", BASE + 0xF000)
invoke(0x4F4DE0, tribe, 18, 0x2020)
assert allocations[-1][:6] == [11, 18, 0, 8448, 8448, 0]
assert read(0x96071E + 18, "B") == 0x10
pointer = allocations[-1][-1]
write(pointer + 0xC, "I", 0x400)
write(pointer + 0x2B, "B", 18)
write(pointer + 0x2F, "B", 0)
invoke(0x4C14C0, pointer)
assert (read(pointer + 0x2D, "B"), list(struct.unpack("<hhh", cpu.mem_read(pointer + 0x6C, 6)))) == (3, [8448, 8448, 0])

fail_alloc = True
write(0x96071E + 18, "B", 0x11)
invoke(0x4F4DE0, tribe, 18, 0x2020)
assert read(0x96071E + 18, "B") == 0x10

row = 0x5A80D0 + 18 * 62
assert (read(row, "H"), read(row + 4), read(row + 26, "H"), read(row + 30), read(row + 34)) == (2, 999999, 31, 8192, 7168)
assert list(cpu.mem_read(row + 38, 9)) == [2, 1, 86, 0, 0, 0, 0, 1, 0]
assert read(row + 58, "H") == 60
print("PASS: Mission 17 Armageddon topology, stock, target, and cast allocation")
