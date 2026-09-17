#!/usr/bin/env python3
"""Verify Mission 23's autonomous settlement and housing requests."""

import hashlib
import struct
import sys
from pathlib import Path

from unicorn import UC_HOOK_CODE
from unicorn.x86_const import UC_X86_REG_EAX, UC_X86_REG_EIP, UC_X86_REG_ESP

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "scripts"))
from decomp import native_cpu  # noqa: E402

if len(sys.argv) != 2:
    raise SystemExit("Usage: check-native-mission23-settlement.py /path/to/d3dpoptb.exe")
EXE = Path(sys.argv[1]).resolve()
LEVELS = EXE.parent / "levels"
EXPECTED = {
    "d3dpoptb.exe": "3a5065c7420b3fcde208bf220bc86dfbac95e025ab2492caf9c7ea5308dfbe4f",
    "levl2023.dat": "12f4a91df64f18cdc154d9d0e39780d52d2e4e1e4efd708fd7a35dd9c3b344dc",
    "levl2023.hdr": "d141635a840bb16a4b5e41beec064fd154aead055bbe663710dbcfe417574976",
    "cpscr023.dat": "948357f83023f426cbd64e209d0e25753a240a219d53cd9493186dd23a71a943",
    "cpscr024.dat": "55acfcbf2ea4d3d2a73693c49ffc29774c63575f2639dd1b8920b569fd0c22c1",
    "cpscr018.dat": "e45e2508c10e5e30af1e8a4847a5c25bfbd60b4780c7b7c75f9bf1b7a0491a7e",
}
paths = {
    "d3dpoptb.exe": EXE,
    **{name: LEVELS / name for name in EXPECTED if name != "d3dpoptb.exe"},
}
assert {name: hashlib.sha256(path.read_bytes()).hexdigest() for name, path in paths.items()} == EXPECTED

header = paths["levl2023.hdr"].read_bytes()
level = paths["levl2023.dat"].read_bytes()
assert len(header) == 616 and header[88] == 4
scripts = {tribe: header[88 + tribe] for tribe in range(1, 4)}
assert scripts == {1: 23, 2: 24, 3: 18}


def tribe_input(tribe):
    objects = []
    for index in range(2000):
        record = level[0x14043 + index * 55 : 0x14043 + (index + 1) * 55]
        model, object_class, owner = record[:3]
        x, y = struct.unpack_from("<HH", record, 3)
        objects.append((model, object_class, owner, x, y))
    braves = [obj for obj in objects if obj[:3] == (2, 1, tribe)]
    shamans = [obj for obj in objects if obj[:3] == (7, 1, tribe)]
    buildings = [obj for obj in objects if obj[1:3] == (2, tribe)]
    assert len(braves) == 6 and len(shamans) == 1 and not buildings
    _, _, _, x, y = shamans[0]
    return ((x >> 8) & 0xFE) | (y & 0xFE00)


def write(cpu, address, fmt, *values):
    cpu.mem_write(address, struct.pack("<" + fmt, *values))


def read(cpu, address, fmt="I"):
    return struct.unpack("<" + fmt, cpu.mem_read(address, struct.calcsize("<" + fmt)))[0]


def invoke(cpu, stack, stop, address, *values):
    write(cpu, stack, "I" * (len(values) + 1), stop, *values)
    cpu.reg_write(UC_X86_REG_ESP, stack)
    cpu.emu_start(address, stop, count=2_000_000)
    assert cpu.reg_read(UC_X86_REG_EIP) == stop
    return cpu.reg_read(UC_X86_REG_EAX) & 0xFFFFFFFF


def ret(cpu, value=0):
    stack = cpu.reg_read(UC_X86_REG_ESP)
    cpu.reg_write(UC_X86_REG_EAX, value & 0xFFFFFFFF)
    cpu.reg_write(UC_X86_REG_EIP, read(cpu, stack))
    cpu.reg_write(UC_X86_REG_ESP, stack + 4)


profiles = {
    1: (0x1B8FEF, 0x120, 0xFC40, 4, 18, 0x0A08, 1),
    2: (0x1B8BEF, 0x20, 0x44BC, 4, 18, 0x66CE, 13),
    3: (0x1B8FEF, 0x120, 0xA89A, 4, 18, 0xA684, 1),
}


def supply_buildings(cpu, ai, models):
    base, stride = 0x2050000, 0x40
    cpu.mem_write(base, bytes(stride * max(len(models), 1)))
    for index, model in enumerate(models):
        node = base + index * stride
        write(cpu, node + 8, "I", base + (index + 1) * stride if index + 1 < len(models) else 0)
        write(cpu, node + 0x2B, "B", model)
        write(cpu, node + 0x2C, "B", 0)
    write(cpu, ai + 0x885, "I", base if models else 0)


for tribe, script_id in scripts.items():
    states, flags, latch, task_limit, housing, expected_origin, next_model = profiles[tribe]
    cpu, _ = native_cpu(EXE)
    cpu.mem_map(0x2000000, 0x80000)
    ai, program, stack, stop = 0x2000000, 0x2010000, 0x207D000, 0x207E000
    cpu.mem_write(ai, bytes(0xC65))
    write(cpu, ai + 0xC22, "B", tribe)
    invoke(cpu, stack, stop, 0x461D70, ai)
    cpu.mem_write(program, paths[f"cpscr{script_id:03}.dat"].read_bytes())
    write(cpu, 0x89D188, "I", 0)
    write(cpu, 0x89D178, "I", 0x87654321)
    invoke(cpu, stack, stop, 0x48C6B0, ai, program)
    attributes = list(cpu.mem_read(0x9607EA + tribe * 48, 48))
    assert (
        read(cpu, ai + 0x59A),
        read(cpu, ai + 0x596),
        read(cpu, ai + 0x5A4, "H"),
        attributes[9],
        attributes[10],
        attributes[1:5],
        read(cpu, 0x89D178),
    ) == (states, flags, latch, task_limit, housing, [0, 0, 0, 0], 0x87654321)
    assert attributes[35] == (1 if tribe == 2 else 0)
    assert all(read(cpu, ai + 0x74 + index * 0x52) == 0 for index in range(10))
    origin = tribe_input(tribe)
    assert origin == expected_origin

    def producer_leaf(_cpu, address, _size, _user):
        ret(cpu, origin if address == 0x4F6020 else 6)

    base_hook = cpu.hook_add(UC_HOOK_CODE, producer_leaf, begin=0x4F6020, end=0x4F6020)
    people_hook = cpu.hook_add(UC_HOOK_CODE, producer_leaf, begin=0x4F67B0, end=0x4F67B0)
    write(cpu, 0x89D178, "I", 0x12345678)
    assert invoke(cpu, stack, stop, 0x4E5580, ai, 0) == 1
    assert (
        read(cpu, ai + 0x74),
        read(cpu, ai + 0x85, "B"),
        read(cpu, ai + 0x68),
        read(cpu, ai + 0x6C),
        read(cpu, ai + 0x70),
        read(cpu, ai + 0x78, "H"),
        read(cpu, 0x89D178),
    ) == (1, 0, 4, origin, 0, 0, 0x12345678)

    cpu.mem_write(ai + 0x36, bytes(10 * 0x52))
    cpu.hook_del(base_hook)
    current_base = 0x2200 + tribe * 0x202
    write(cpu, ai + 0x36A, "H", current_base)
    write(cpu, ai + 0xB85, "H", 1)
    write(cpu, ai + 0x5B4, "B", 1)

    def available_leaf(_cpu, _address, _size, _user):
        ret(cpu, 1)

    available_hook = cpu.hook_add(
        UC_HOOK_CODE, available_leaf, begin=0x408DD0, end=0x408DD0
    )
    assert invoke(cpu, stack, stop, 0x4E5580, ai, 0) == 1
    assert (
        read(cpu, ai + 0x74),
        read(cpu, ai + 0x85, "B"),
        read(cpu, ai + 0x68),
        read(cpu, ai + 0x6C),
        read(cpu, ai + 0x70),
        read(cpu, ai + 0x78, "H"),
        read(cpu, 0x89D178),
    ) == (1, 0, next_model, current_base, 0, 0, 0x12345678)

    cpu.mem_write(ai + 0x36, bytes(10 * 0x52))
    supply_buildings(cpu, ai, [4, next_model])
    assert invoke(cpu, stack, stop, 0x4F6480, ai, next_model) == 1
    assert invoke(cpu, stack, stop, 0x4F6520, ai) == (4 if next_model == 1 else 1)
    third_turn = 191 - tribe
    assert (third_turn + tribe + 1) & 63 == 0
    write(cpu, 0x89D178, "I", 0x23456789)
    assert invoke(cpu, stack, stop, 0x4E5580, ai, 0) == 1
    assert (
        read(cpu, ai + 0x74),
        read(cpu, ai + 0x85, "B"),
        read(cpu, ai + 0x68),
        read(cpu, ai + 0x6C),
        read(cpu, ai + 0x70),
        read(cpu, ai + 0x78, "H"),
        read(cpu, 0x89D178),
    ) == (1, 0, 1, current_base, 0, 0, 0x23456789)

    cpu.mem_write(ai + 0x36, bytes(10 * 0x52))
    supply_buildings(cpu, ai, [4, 2, 2, 1, 1, 1] + ([13] if tribe == 2 else []))
    assert invoke(cpu, stack, stop, 0x4F6520, ai) == 18
    write(cpu, 0x89D178, "I", 0x3456789A)
    assert invoke(cpu, stack, stop, 0x4E5580, ai, 0) == 0
    assert all(read(cpu, ai + 0x74 + index * 0x52) == 0 for index in range(10))
    assert read(cpu, 0x89D178) == 0x3456789A
    cpu.hook_del(people_hook)
    cpu.hook_del(available_hook)

print("PASS: Mission 23 recurrent housing and capacity stop verified")
