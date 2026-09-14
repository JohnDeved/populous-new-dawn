"""Prove Mission 1's initial Red hut producer is blocked by existing housing."""
import hashlib
import json
import struct
import sys
from pathlib import Path

from unicorn import UC_HOOK_CODE
from unicorn.x86_const import UC_X86_REG_EAX, UC_X86_REG_EIP, UC_X86_REG_ESP

from decomp import native_cpu

EXPECTED = "3a5065c7420b3fcde208bf220bc86dfbac95e025ab2492caf9c7ea5308dfbe4f"
exe = Path(sys.argv[1])
assert hashlib.sha256(exe.read_bytes()).hexdigest() == EXPECTED
cpu, _ = native_cpu(exe)
cpu.mem_map(0x2000000, 0x50000)
ai, building, stack, stop = 0x2000000, 0x2002000, 0x204D000, 0x204E000


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


cpu.mem_write(ai, bytes(0xC65))
cpu.mem_write(building, bytes(0x100))
write(ai + 0x885, "I", building)
write(building + 0x2B, "BB", 3, 2)
housing = call(0x4F6520, ai)
assert housing == 5

cpu.mem_write(ai, bytes(0xC65))
write(ai + 0x885, "I", building)
write(ai + 0x596, "II", 0x502, 1)
write(ai + 0x5A2, "H", 0x1C08)
write(ai + 0xC22, "B", 1)
attributes = 0x9607EA + 48
write(attributes + 9, "B", 1)
write(attributes + 10, "B", 3)
write(attributes + 30, "B", 0)
seed = 0x12345678
write(0x89D178, "I", seed)
models = []


def model_enabled(cpu, address, size, user):
    sp = cpu.reg_read(UC_X86_REG_ESP)
    model = read(sp + 4)
    models.append(model)
    ret(int(model == 1))


cpu.hook_add(UC_HOOK_CODE, model_enabled, begin=0x408DD0, end=0x408DD0)
result = call(0x4E5580, ai, 0)
task_flags = read(ai + 0x36 + 0x3E)
random_after = read(0x89D178)
assert result == 0 and task_flags == 0 and random_after == seed
assert models == [7, 6, 5, 8, 13, 14, 15, 16]

print(json.dumps({
    "executableSha256": EXPECTED,
    "initialModel3Housing": housing,
    "targetHousing": 3,
    "producerResult": result,
    "taskFlags": task_flags,
    "randomBefore": seed,
    "randomAfter": random_after,
}))

