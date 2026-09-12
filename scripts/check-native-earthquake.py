"""Check Earthquake's destructive phases directly against the reference executable."""
import hashlib
import struct
import sys
from pathlib import Path

from unicorn import UC_HOOK_CODE
from unicorn.x86_const import UC_X86_REG_EAX, UC_X86_REG_EIP, UC_X86_REG_ESP

from decomp import native_cpu

EXPECTED = "3a5065c7420b3fcde208bf220bc86dfbac95e025ab2492caf9c7ea5308dfbe4f"
CTRL, BUILDING = 0x02000000, 0x02001000
STACK, STOP = 0x0203E000, 0x0203FF00


def machine(executable):
    cpu, identity = native_cpu(Path(executable))
    assert identity["sha256"] == EXPECTED
    cpu.mem_map(0x02000000, 0x40000)

    def write(address, fmt, *values):
        cpu.mem_write(address, struct.pack("<" + fmt, *values))

    def read(address, fmt):
        return struct.unpack("<" + fmt, cpu.mem_read(address, struct.calcsize("<" + fmt)))[0]

    def ret(value=0):
        sp = cpu.reg_read(UC_X86_REG_ESP)
        cpu.reg_write(UC_X86_REG_EAX, value)
        cpu.reg_write(UC_X86_REG_EIP, read(sp, "I"))
        cpu.reg_write(UC_X86_REG_ESP, sp + 4)

    def call(address, *args):
        write(STACK, "I" * (len(args) + 1), STOP, *args)
        cpu.reg_write(UC_X86_REG_ESP, STACK)
        cpu.emu_start(address, STOP, count=1_000_000)
        assert cpu.reg_read(UC_X86_REG_EIP) == STOP

    return cpu, write, read, ret, call


def controller(write, remaining):
    write(CTRL + 0x10, "I", 0x10)
    write(CTRL + 0x2A, "BBB", 7, 26, 15)
    write(CTRL + 0x2F, "B", 2)
    write(CTRL + 0x3D, "HHh", 0x4000, 0x4000, 512)
    write(CTRL + 0x6C, "h", remaining)
    write(CTRL + 0x72, "H", 0x4040)
    write(CTRL + 0x74, "B", 0)


def central_phase(executable):
    cpu, write, read, ret, call = machine(executable)
    events = []

    def hook(c, address, size, user):
        sp = c.reg_read(UC_X86_REG_ESP)
        if address == 0x4ED8A0:
            position = read(sp + 16, "I")
            events.append(("allocate", read(sp + 4, "I"), read(sp + 8, "I"), read(sp + 12, "I"),
                           read(position, "H"), read(position + 2, "H"), read(position + 4, "h")))
        elif address == 0x48A050:
            events.append(("sound", read(sp + 8, "I"), read(sp + 12, "I")))
        elif address == 0x4509D0:
            events.append(("process", read(sp + 4, "I"), read(sp + 8, "H"),
                           read(sp + 12, "I"), read(sp + 16, "I")))
        elif address == 0x44DDF0:
            events.append(("queue", read(sp + 4, "H"), read(sp + 8, "I"), read(sp + 12, "I")))
        elif address == 0x44F2F0:
            events.append(("notify", read(sp + 4, "I"), read(sp + 8, "H"),
                           read(sp + 12, "I"), read(sp + 16, "I")))
        ret()

    for address in (0x56E070, 0x4ED8A0, 0x48A050, 0x4509D0, 0x44DDF0, 0x44F2F0):
        cpu.hook_add(UC_HOOK_CODE, hook, begin=address, end=address)

    terrain = bytearray(0x40000)
    for index in range(16384):
        struct.pack_into("<h", terrain, index * 16 + 4, 512)
    cpu.mem_write(0x8A03E4, bytes(terrain))
    cpu.mem_write(0x890390, bytes(0x4000))
    cpu.mem_write(CTRL, bytes(256))
    controller(write, 61)
    write(0x89CE82, "B", 0)
    write(0x89C665, "I", 0)
    write(0x89D178, "I", 0x12345678)
    call(0x50D9A0, CTRL)

    raw = bytes(cpu.mem_read(0x8A03E4, 0x40000))
    allocations = [event for event in events if event[0] == "allocate"]
    assert read(CTRL + 0x6C, "h") == 60
    assert read(0x89D178, "I") == 0x5DE0E729
    assert read(0x89CE82, "B") == 181
    assert read(0x89C665, "I") & 0x40
    assert sum(event[2] == 3 for event in allocations) == 89
    assert sum(event[2] == 40 for event in allocations) == 20
    assert sum(event[2] == 34 for event in allocations) == 1
    assert hashlib.sha256(raw).hexdigest() == "24051e612de1b928c7ed7b9f72bea4d70b17fabc7ddf9d5e6dae24b12ca02a2a"
    assert ("sound", 21, 0) in events
    assert any(event[0] == "process" and event[1] == 2 and event[3:] == (10, 2)
               for event in events)
    assert ("queue", 0x4040, 10, 1) in events
    assert ("notify", 1, 0x4040, 10, 0xFFFFFFFF) in events


def building_phase(executable):
    cpu, write, read, ret, call = machine(executable)
    events = []

    def hook(c, address, size, user):
        sp = c.reg_read(UC_X86_REG_ESP)
        if address == 0x56E070:
            events.append(("audio",))
        elif address == 0x407490:
            building = read(sp + 4, "I")
            count = read(building + 0xA6, "B")
            events.append(("eject", building, count))
            write(building + 0xA6, "B", count - 1)
        elif address == 0x4ED8A0:
            position = read(sp + 16, "I")
            events.append(("allocate", read(sp + 4, "I"), read(sp + 8, "I"),
                           read(sp + 12, "I"), position, read(position, "H"),
                           read(position + 2, "H")))
        ret()

    for address in (0x56E070, 0x407490, 0x4ED8A0):
        cpu.hook_add(UC_HOOK_CODE, hook, begin=address, end=address)

    cpu.mem_write(0x8A03E4, bytes(0x40000))
    cpu.mem_write(0x890390, bytes(0x4000))
    cpu.mem_write(CTRL, bytes(256))
    cpu.mem_write(BUILDING, bytes(256))
    controller(write, 97)
    write(BUILDING + 0x20, "H", 0)
    write(BUILDING + 0x24, "H", 1)
    write(BUILDING + 0x2A, "BB", 2, 1)
    write(BUILDING + 0x3D, "HHh", 0x3000, 0x3000, 512)
    write(BUILDING + 0xA6, "B", 2)
    write(0x890390 + 4, "I", BUILDING)
    cell = 0x3030
    terrain_offset = ((cell & 0xFE) * 2) | (cell & 0xFE00)
    write(0x8A03EA + terrain_offset * 4, "h", 1)
    write(0x89CE82, "B", 0)
    write(0x89C665, "I", 0)
    write(0x89D178, "I", 0)
    call(0x50D9A0, CTRL)

    assert read(CTRL + 0x6C, "h") == 96
    assert read(0x89D178, "I") == 0x26F80001
    assert read(0x89CE82, "B") == 78
    assert read(BUILDING + 0xA6, "B") == 0
    assert events == [("audio",), ("eject", BUILDING, 2), ("eject", BUILDING, 1),
                      ("allocate", 7, 14, 2, BUILDING + 0x3D, 0x3000, 0x3000)]


central_phase(sys.argv[1])
building_phase(sys.argv[1])
print("PASS: native Earthquake terrain, RNG, shake, building ejection and damage allocation")
