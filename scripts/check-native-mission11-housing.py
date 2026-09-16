"""Probe Mission 11 Matak's first post-tower ordinary housing allocation.

Usage: .tools/decomp/oracle/bin/python scripts/check-native-mission11-housing.py \
       /path/to/d3dpoptb.exe
"""
import hashlib
import json
import struct
import sys
from pathlib import Path

from decomp import native_cpu
from unicorn import UC_HOOK_CODE
from unicorn.x86_const import UC_X86_REG_EAX, UC_X86_REG_EIP, UC_X86_REG_ESP

if len(sys.argv) != 2:
    raise SystemExit("Usage: check-native-mission11-housing.py /path/to/d3dpoptb.exe")
EXE = Path(sys.argv[1]).resolve()
SCRIPT = EXE.parent / "levels/cpscr022.dat"
EXPECTED = {
    EXE: "3a5065c7420b3fcde208bf220bc86dfbac95e025ab2492caf9c7ea5308dfbe4f",
    SCRIPT: "ba0b39d07de48ac2493d75b8ae01225707a7443dd828f276b4a4dbdef2d43bc5",
}
hashes = {path.name: hashlib.sha256(path.read_bytes()).hexdigest() for path in EXPECTED}
assert all(hashes[path.name] == digest for path, digest in EXPECTED.items()), hashes

cpu, _ = native_cpu(EXE)
cpu.mem_map(0x2000000, 0x60000)
ai, program, building, stack, stop = 0x2000000, 0x2010000, 0x2020000, 0x205D000, 0x205E000


def write(address, fmt, *values):
    cpu.mem_write(address, struct.pack("<" + fmt, *values))


def read(address, fmt="I"):
    return struct.unpack("<" + fmt, cpu.mem_read(address, struct.calcsize("<" + fmt)))[0]


def ret(value=0):
    sp = cpu.reg_read(UC_X86_REG_ESP)
    cpu.reg_write(UC_X86_REG_EAX, value & 0xFFFFFFFF)
    cpu.reg_write(UC_X86_REG_EIP, read(sp))
    cpu.reg_write(UC_X86_REG_ESP, sp + 4)


def call(address, *args):
    write(stack, "I" * (len(args) + 1), stop, *args)
    cpu.reg_write(UC_X86_REG_ESP, stack)
    cpu.emu_start(address, stop, count=500000)
    assert cpu.reg_read(UC_X86_REG_EIP) == stop
    return cpu.reg_read(UC_X86_REG_EAX) & 0xFFFFFFFF


available = 0


def leaf(_cpu, address, _size, _user):
    # Model availability is supplied from Mission 11's header; Brave availability is the variable under test.
    ret(1 if address == 0x408DD0 else available)


for address in (0x408DD0, 0x4F67B0):
    cpu.hook_add(UC_HOOK_CODE, leaf, begin=address, end=address)

cases = []
for available in (0, 1, 2, 3, 6):
    cpu.mem_write(ai, bytes(0xC65))
    cpu.mem_write(program, SCRIPT.read_bytes())
    write(ai + 0xC22, "B", 3)
    write(0x89D188, "I", 0)
    call(0x48C6B0, ai, program)

    # Accepted model-4 owner at the first Matak base cell; allocate into the next task slot.
    write(ai + 0x74, "I", 1)
    write(ai + 0x85, "B", 0)
    write(ai + 0x68, "I", 4)
    write(ai + 0x78, "H", 8)
    cpu.mem_write(building, bytes(0x100))
    write(building + 0x2B, "BB", 4, 3)
    write(ai + 0x885, "I", building)
    write(ai + 0x36A, "H", 0xDA7A)
    write(ai + 0x5B4, "B", 1)
    write(0x89D178, "I", 0x12345678)

    allocated = call(0x4E5580, ai, 1)
    task = ai + 0x52
    cases.append({
        "availableBraves": available,
        "allocated": bool(allocated),
        "task": None if not allocated else {
            "flags": read(task + 0x74),
            "type": read(task + 0x85, "B"),
            "requestedModel": read(task + 0x68),
            "origin": hex(read(task + 0x6C)),
            "exact": read(task + 0x70),
            "phase": read(task + 0x78, "H"),
        },
        "rngAfter": hex(read(0x89D178)),
    })

assert ((124 + 3 + 1) & 63) == 0
assert [case["allocated"] for case in cases] == [False, False, True, True, True]
assert all(case["rngAfter"] == "0x12345678" for case in cases)
assert cases[2]["task"] == {
    "flags": 1,
    "type": 0,
    "requestedModel": 1,
    "origin": "0xda7a",
    "exact": 0,
    "phase": 0,
}
print(json.dumps({"inputs": hashes, "producerTurns": [60, 124, 188, 252], "cases": cases}, indent=2))
