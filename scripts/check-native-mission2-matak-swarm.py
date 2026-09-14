"""Check native Mission 2 tribe-3 follower mana, distribution, and Swarm payment."""
import json
import struct
import sys
from pathlib import Path

from unicorn import UC_HOOK_CODE
from unicorn.x86_const import UC_X86_REG_EAX, UC_X86_REG_EIP, UC_X86_REG_ESP

from decomp import configure_native_constants, native_cpu

exe = Path(sys.argv[1])
cpu, _ = native_cpu(exe)
configure_native_constants(cpu, exe)
cpu.mem_map(0x2000000, 0x20000)
base, stack, stop = 0x2000000, 0x201D000, 0x201E000
tribes = 0x89D1C8


def write(address, fmt, *values):
    cpu.mem_write(address, struct.pack("<" + fmt, *values))


def read(address, fmt):
    return struct.unpack("<" + fmt, cpu.mem_read(address, struct.calcsize("<" + fmt)))[0]


def call(address, *args):
    write(stack, "I" * (len(args) + 1), stop, *args)
    cpu.reg_write(UC_X86_REG_ESP, stack)
    cpu.emu_start(address, stop, timeout=1_000_000, count=1_000_000)
    assert cpu.reg_read(UC_X86_REG_EIP) == stop


def tribe(index):
    return tribes + index * 0xC65


def reset():
    cpu.mem_write(base, bytes(0x20000))
    cpu.mem_write(tribes, bytes(4 * 0xC65))
    cpu.mem_write(0x890390, bytes(4096))
    cpu.mem_write(0x96070A, bytes(56 * 4))
    write(0x89D17C, "I", 0)
    write(0x89D188, "I", 0)
    write(0x89C6F0, "B", 0)


reset()
write(tribe(1) + 0x955, "i", 111)
write(tribe(3) + 0x955, "i", 333)
write(0x890324, "I", base)
write(base + 4, "I", 0)
write(base + 0xC, "I", 0)
write(base + 0x10, "I", 0x20000000)
write(base + 0x24, "H", 1)
write(base + 0x2A, "BBB", 1, 2, 0)
write(base + 0x2F, "b", 3)
write(base + 0xA7, "B", 0)
call(0x4ECAC0)
generation = {
    "tribe1_available": read(tribe(1) + 0x955, "i"),
    "tribe3_available": read(tribe(3) + 0x955, "i"),
}
assert generation == {"tribe1_available": 111, "tribe3_available": 335}

reset()
write(tribe(1) + 0x94D, "i", 101)
write(tribe(1) + 0x955, "i", 202)
write(tribe(3) + 0x94D, "i", 500)
write(tribe(3) + 0x955, "i", 40000)
write(tribe(3) + 0xC1F, "B", 1)
write(tribe(3) + 0xC20, "B", 1)
write(tribe(3) + 0xC22, "b", 3)
call(0x41A550)
distribution = {
    "tribe1_mana": read(tribe(1) + 0x94D, "i"),
    "tribe1_available": read(tribe(1) + 0x955, "i"),
    "tribe3_mana": read(tribe(3) + 0x94D, "i"),
    "tribe3_available": read(tribe(3) + 0x955, "i"),
}
assert distribution == {
    "tribe1_mana": 101,
    "tribe1_available": 202,
    "tribe3_mana": 40500,
    "tribe3_available": 0,
}

allocation = []


def leaf(uc, address, size, user):
    sp = uc.reg_read(UC_X86_REG_ESP)
    if address == 0x4ED8A0:
        allocation.append(
            {
                "class": read(sp + 4, "I"),
                "model": read(sp + 8, "I"),
                "owner": read(sp + 12, "I"),
            }
        )
    uc.reg_write(UC_X86_REG_EAX, 0xFFFFFFFF if address == 0x430BD0 else 0)
    uc.reg_write(UC_X86_REG_EIP, read(sp, "I"))
    uc.reg_write(UC_X86_REG_ESP, sp + 4)


for hooked in (0x4ED8A0, 0x4C1B80, 0x430BD0):
    cpu.hook_add(UC_HOOK_CODE, leaf, begin=hooked, end=hooked)

reset()
write(tribe(1) + 0x955, "i", 123456)
write(tribe(3) + 0x955, "i", 1000000)
write(tribe(3) + 0x89D, "I", base + 0x2000)
write(tribe(3) + 0xC1F, "B", 1)
write(tribe(3) + 0xC22, "b", 3)
write(0x892443, "I", base + 0x1000)
call(0x4F4DE0, tribe(3), 5, 0)
price = read(base + 0x1000, "i")
write(base + 0x2B, "B", 5)
write(base + 0x2F, "B", 3)
write(base + 0xC, "I", 0x400)
call(0x4C14C0, base)
payment = {
    "allocation": allocation,
    "price": price,
    "tribe1_available": read(tribe(1) + 0x955, "i"),
    "tribe3_available": read(tribe(3) + 0x955, "i"),
}
assert payment == {
    "allocation": [{"class": 11, "model": 5, "owner": 3}],
    "price": 40000,
    "tribe1_available": 123456,
    "tribe3_available": 960000,
}

print(json.dumps({"generation": generation, "distribution": distribution, "swarm_payment": payment}))
