"""Probe Mission 6 construction and Chumara/Matak specialist-training gates."""
import hashlib
import json
import struct
import sys
from pathlib import Path

from decomp import native_cpu
from unicorn import UC_HOOK_CODE
from unicorn.x86_const import UC_X86_REG_EAX, UC_X86_REG_EIP, UC_X86_REG_ESP

EXE = Path(sys.argv[1])
SHA = "3a5065c7420b3fcde208bf220bc86dfbac95e025ab2492caf9c7ea5308dfbe4f"
assert hashlib.sha256(EXE.read_bytes()).hexdigest() == SHA
cpu, _ = native_cpu(EXE)
cpu.mem_map(0x2000000, 0x60000)
ai, building, stack, stop = 0x2000000, 0x2002000, 0x205D000, 0x205E000


def write(address, fmt, *values):
    cpu.mem_write(address, struct.pack("<" + fmt, *values))


def read(address, fmt="I"):
    return struct.unpack("<" + fmt, cpu.mem_read(address, struct.calcsize("<" + fmt)))[0]


def call(address, *args):
    write(stack, "I" * (len(args) + 1), stop, *args)
    cpu.reg_write(UC_X86_REG_ESP, stack)
    cpu.emu_start(address, stop, count=500000)
    assert cpu.reg_read(UC_X86_REG_EIP) == stop
    return cpu.reg_read(UC_X86_REG_EAX) & 0xFFFFFFFF


def ret(value=0):
    sp = cpu.reg_read(UC_X86_REG_ESP)
    cpu.reg_write(UC_X86_REG_EAX, value & 0xFFFFFFFF)
    cpu.reg_write(UC_X86_REG_EIP, read(sp))
    cpu.reg_write(UC_X86_REG_ESP, sp + 4)


mode = "construction"
queries = []
available = 6
training_building = 7


def leaf(_cpu, address, _size, _user):
    sp = cpu.reg_read(UC_X86_REG_ESP)
    if address == 0x408DD0:
        model = read(sp + 4)
        queries.append(["enabled", model])
        ret(1 if mode == "construction" or model == training_building else 0)
    elif address == 0x4F67B0:
        queries.append(["available"])
        ret(available)
    elif address == 0x4F6730:
        queries.append(["housingOrders"])
        ret(0)
    else:
        model = read(sp + 8)
        queries.append(["building", model])
        ret(42 if model == training_building else 0)


for address in (0x408DD0, 0x4F67B0, 0x4F6730, 0x4F36D0):
    cpu.hook_add(UC_HOOK_CODE, leaf, begin=address, end=address)

profiles = [
    ("initial", 2, 125, 4, 7, 0x40, 0xB69A, [38, 0, 0, 1, 0, 0, 15, 40, 0, 4, 9, 0, 80, 30, 2, 2, 0, 0, 75, 0, 0, 0, 0, 0, 255, 1, 0, 0, 25, 1, 1, 1, 128, 5, 0]),
    ("initial", 3, 124, 2, 1, 0x20, 0x80D0, [28, 0, 0, 0, 0, 0, 5, 10, 0, 2, 10, 0, 88, 12, 5, 2, 0, 0, 90, 1, 0, 0, 0, 0, 255, 1, 0, 0, 25, 1, 1, 1, 128, 7, 0]),
    ("post-profile", 3, 124, 2, 7, 0x20, 0x4A4A, [28, 0, 8, 64, 72, 32, 40, 70, 64, 2, 168, 80, 66, 152, 140, 100, 128]),
    ("temple", 2, 125, 4, 5, 0x40, 0xD094, [38, 0, 1, 0, 0, 0, 15, 40, 0, 4, 9, 0, 80, 30, 2, 2, 0, 0, 75, 0, 0, 0, 0, 0, 255, 1, 0, 0, 25, 1, 1, 1, 128, 5, 0]),
]
observations = []
for stage, tribe, turn, limit, wanted, flags, latch, attributes in profiles:
    base = 0x4444 + tribe * 0x202
    cpu.mem_write(ai, bytes(0xC65))
    cpu.mem_write(building, bytes(0x100))
    write(ai + 0x885, "I", building)
    write(building + 0x2B, "B", 4)
    write(ai + 0x596, "II", flags, 0x1E0FEF)
    write(ai + 0x36A, "H", base)
    write(ai + 0x5A4, "H", latch)
    write(ai + 0x5B4, "B", 1)
    write(ai + 0xC22, "B", tribe)
    cpu.mem_write(0x9607EA + tribe * 48, bytes(attributes))
    write(ai + 0x74, "I", 1)
    write(ai + 0x85, "B", 0)
    write(ai + 0x68, "I", 4)
    write(ai + 0x78, "H", 8)
    write(0x89D178, "I", 0x12345678)
    queries.clear()
    assert call(0x462D40, ai, 0) == 1 < limit
    assert call(0x4F6480, ai, 4) == 1
    assert call(0x4E5580, ai, 1) == 1
    task = ai + 0x52
    result = {
        "flags": read(task + 0x74),
        "type": read(task + 0x85, "B"),
        "requested": read(task + 0x68),
        "origin": read(task + 0x6C),
        "exact": read(task + 0x70),
        "phase": read(task + 0x78, "H"),
    }
    assert result == {"flags": 1, "type": 0, "requested": wanted, "origin": base, "exact": 0, "phase": 0}
    assert read(0x89D178) == 0x12345678
    observations.append({"stage": stage, "tribe": tribe, "turn": turn, "taskLimit": limit, "task": result, "coordinateLatch": latch, "enabledQueries": list(queries), "producerRng": "0x12345678"})

mode = "training"
training = []
for tribe, population, trained, preference, available_count, training_building, person_model, attribute in [
    (2, 8, 1, 40, 6, 7, 3, 7),
    (3, 7, 0, 70, 5, 7, 3, 7),
    (2, 8, 0, 15, 5, 5, 4, 6),
]:
    cpu.mem_write(ai, bytes(0xC65))
    write(ai + 0x59A, "I", 1 << 6)
    write(ai + 0xC22, "B", tribe)
    write(ai + 0x91D, "I", population)
    write(ai + 0xA27 + person_model * 2, "H", trained)
    write(ai + 0xB7D + training_building * 2, "H", 1)
    write(0x9607EA + tribe * 48 + attribute, "B", preference)
    write(0x89D178, "I", 0x12345678)
    available = available_count
    queries.clear()
    assert call(0x4E59A0, ai, 0) == 1
    result = {"tribe": tribe, "person": person_model, "building": training_building, "available": available, "flags": read(ai + 0x74), "type": read(ai + 0x85, "B"), "target": read(ai + 0x68), "requested": read(ai + 0x6C), "phase": read(ai + 0x78, "H"), "rng": hex(read(0x89D178)), "queries": list(queries)}
    expected_queries = []
    for candidate in (5, 6, 7, 8):
        expected_queries.append(["enabled", candidate])
        if candidate == training_building:
            expected_queries.append(["building", candidate])
    expected_queries.extend([["available"], ["housingOrders"], ["building", training_building]])
    assert result == {"tribe": tribe, "person": person_model, "building": training_building, "available": available_count, "flags": 1, "type": 6, "target": 42, "requested": 0, "phase": 0, "rng": "0x32be789b", "queries": expected_queries}
    training.append(result)

training_building = 7
cpu.mem_write(ai, bytes(0xC65))
write(ai + 0x59A, "I", 1 << 6)
write(ai + 0xC22, "B", 3)
write(ai + 0x91D, "I", 7)
write(ai + 0xB7D + 7 * 2, "H", 1)
write(0x9607EA + 3 * 48 + 7, "B", 70)
write(0x89D178, "I", 0x12345678)
available = 4
assert call(0x4E59A0, ai, 0) == 0
assert read(0x89D178) == 0x32BE789B

# 0x4c6da0 phase 8 retries an incomplete plan after its builders are lost.
plan, cell = 0x2003000, 0x1E0A
task8 = ai + 0x36
cpu.mem_write(ai, bytes(0xC65))
cpu.mem_write(building, bytes(0x100))
cpu.mem_write(plan, bytes(0x100))
write(ai + 0xC22, "B", 3)
write(task8, "H", cell)
write(task8 + 9, "B", 7)
write(task8 + 0x42, "H", 8)
write(building + 0x24, "H", 100)
write(building + 0x2A, "B", 2)
write(building + 0x2C, "B", 1)
write(building + 0x2F, "B", 3)
write(building + 0x82, "h", 101)
write(plan + 0x24, "H", 101)
write(plan + 0x2A, "B", 9)
write(plan + 0x9A, "B", 1)
write(0x890390 + 100 * 4, "I", building)
write(0x890390 + 101 * 4, "I", plan)
cell_index = ((cell & 0xFE00) >> 9) * 128 + ((cell & 0xFE) >> 1)
write(0x8A03EC + cell_index * 16, "H", 100)


def phase8_leaf(_cpu, _address, _size, _user):
    ret(0)


cpu.hook_add(UC_HOOK_CODE, phase8_leaf, begin=0x4F6320, end=0x4F6320)
for _ in range(16):
    call(0x4C6DA0, ai, 0)
assert read(task8 + 0x42, "H") == 8
assert read(task8 + 0x0D, "B") == 16
call(0x4C6DA0, ai, 0)
recovery = {
    "phase": read(task8 + 0x42, "H"),
    "retainedBuilders": read(task8 + 0x0C, "B"),
    "retries": read(task8 + 0x0D, "B"),
}
assert recovery == {"phase": 4, "retainedBuilders": 1, "retries": 16}
write(task8 + 0x42, "H", 8)
write(task8 + 0x0D, "B", 9)
write(plan + 0x9A, "B", 2)
call(0x4C6DA0, ai, 0)
assert read(task8 + 0x42, "H") == 8
assert read(task8 + 0x0D, "B") == 9

print(json.dumps({"executableSha256": SHA, "construction": observations, "training": training, "belowCapacity": {"available": available, "allocated": False, "rng": hex(read(0x89D178))}, "lostBuilderRecovery": recovery}, indent=2))
