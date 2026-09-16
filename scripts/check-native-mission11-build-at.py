"""Probe Mission 11's first Matak BUILD_AT branch and failed site search.

Usage: .tools/decomp/oracle/bin/python scripts/check-native-mission11-build-at.py \
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
    raise SystemExit("Usage: check-native-mission11-build-at.py /path/to/d3dpoptb.exe")
EXE = Path(sys.argv[1]).resolve()
SCRIPT = EXE.parent / "levels/cpscr022.dat"
EXPECTED = {
    "d3dpoptb.exe": "3a5065c7420b3fcde208bf220bc86dfbac95e025ab2492caf9c7ea5308dfbe4f",
    "cpscr022.dat": "ba0b39d07de48ac2493d75b8ae01225707a7443dd828f276b4a4dbdef2d43bc5",
}
inputs = {path.name: hashlib.sha256(path.read_bytes()).hexdigest() for path in (EXE, SCRIPT)}
assert inputs == EXPECTED, inputs
raw_script = SCRIPT.read_bytes()


def words(start, end):
    return list(struct.unpack_from("<" + "H" * (end - start), raw_script, start * 2))


def field(index):
    return struct.unpack_from("<Ii", raw_script, 8192 + index * 8)


assert words(478, 481) == [1005, 70, 1003] and field(70) == (0, 255)
first_branch = words(599, 625)
assert first_branch == [
    1000, 1020, 1012, 68, 1, 1013, 63, 41, 1003,
    1000, 1020, 1014, 63, 1, 1012, 116, 21, 1003,
    1006, 1082, 3, 117, 1007, 63, 21, 1004,
]
assert {
    68: field(68),
    1: field(1),
    63: field(63),
    41: field(41),
    116: field(116),
    21: field(21),
    3: field(3),
    117: field(117),
} == {
    68: (2, 1068),
    1: (0, 0),
    63: (1, 6),
    41: (0, 6),
    116: (2, 1236),
    21: (0, 1),
    3: (0, 120),
    117: (0, 166),
}

cpu, identity = native_cpu(EXE)
cpu.mem_map(0x2000000, 0x60000)
AI, PROGRAM, BUILDING, STACK, STOP = 0x2000000, 0x2010000, 0x2020000, 0x205D000, 0x205E000


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
    write(STACK, "I" * (len(args) + 1), STOP, *args)
    cpu.reg_write(UC_X86_REG_ESP, STACK)
    cpu.emu_start(address, STOP, count=3_000_000)
    assert cpu.reg_read(UC_X86_REG_EIP) == STOP
    return cpu.reg_read(UC_X86_REG_EAX) & 0xFFFFFFFF


completed_model3 = 0


def internal_leaf(_cpu, _address, _size, _user):
    field_address = read(cpu.reg_read(UC_X86_REG_ESP) + 12)
    kind, value = struct.unpack("<Ii", cpu.mem_read(field_address, 8))
    if kind == 2 and value == 1068:
        ret(completed_model3)


cpu.hook_add(UC_HOOK_CODE, internal_leaf, begin=0x48F350, end=0x48F350)

# Preserve the native EVERY mask and first branch, closing before later BUILD_AT towers.
fragment = [
    12, 1003, 1005, 70, 1003,
    *first_branch,
    1002, 1004, 1002, 1004, 1004, 1019,
]


def run_branch(turn, model3, active_tasks=0, latch=0):
    global completed_model3
    completed_model3 = model3
    cpu.mem_write(AI, bytes(0xC65))
    write(AI + 0xC22, "B", 3)
    for index in range(active_tasks):
        write(AI + 0x74 + index * 0x52, "I", 1)
    blob = bytearray(raw_script)
    blob[:8192] = bytes(8192)
    struct.pack_into("<" + "H" * len(fragment), blob, 0, *fragment)
    struct.pack_into("<i", blob, 12288 + 6 * 4, latch)
    cpu.mem_write(PROGRAM, bytes(blob))
    write(0x89D188, "I", turn)
    write(0x89D178, "I", 0x12345678)
    call(0x48C6B0, AI, PROGRAM)
    task = AI + min(active_tasks, 9) * 0x52
    return {
        "turn": turn,
        "completedModel3": model3,
        "activeTasksBefore": active_tasks,
        "latchBefore": latch,
        "latchAfter": read(PROGRAM + 0x3000 + 6 * 4, "i"),
        "task": {
            "flags": read(task + 0x74),
            "type": read(task + 0x85, "B"),
            "requestedModel": read(task + 0x68),
            "origin": hex(read(task + 0x6C)),
            "extraField": read(task + 0x70),
            "phase": read(task + 0x78, "H"),
        },
        "rngAfter": hex(read(0x89D178)),
    }


branch_cases = [
    run_branch(252, 1),
    run_branch(253, 0),
    run_branch(253, 1, latch=1),
    run_branch(253, 1, active_tasks=9),
    run_branch(253, 1, active_tasks=8),
    run_branch(253, 1),
    run_branch(509, 1),
]
assert [case["latchAfter"] for case in branch_cases] == [0, 0, 1, 0, 1, 1, 1]
expected_task = {
    "flags": 1,
    "type": 0,
    "requestedModel": 4,
    "origin": "0xa678",
    "extraField": 1,
    "phase": 0,
}
assert branch_cases[4]["task"] == expected_task
assert branch_cases[5]["task"] == expected_task
assert all(case["rngAfter"] == "0x12345678" for case in branch_cases)

candidates = []


def dispatch_leaf(_cpu, address, _size, _user):
    if address == 0x4F6020:
        ret(0xA678)
    elif address == 0x4F3DC0:
        ret(0)
    elif address == 0x4F7B89:
        candidates.append(cpu.reg_read(UC_X86_REG_EAX) & 0xFFFF)


for address in (0x4F6020, 0x4F3DC0, 0x4F7B89):
    cpu.hook_add(UC_HOOK_CODE, dispatch_leaf, begin=address, end=address)

cpu.mem_write(AI, bytes(0xC65))
cpu.mem_write(BUILDING, bytes(0x100))
write(AI + 0xC22, "B", 3)
write(AI + 0x881, "I", BUILDING)
write(0x9607EA + 3 * 48 + 30, "B", 0)
write(0x89D178, "I", 0x12345678)
call(0x4E5530, AI, 120, 166)
assert read(0x89D178) == 0x12345678
for _ in range(52):
    call(0x4C6DA0, AI, 0)
assert read(AI + 0x78, "H") == 9 and read(AI + 0x74) == 1
assert len(candidates) == 2040 and candidates[0] == 0xA87A and 0xA678 not in candidates
rng_after_failure = read(0x89D178)
assert rng_after_failure == 0x32BE789B
call(0x4C6DA0, AI, 0)
assert read(AI + 0x74) == 0

print(json.dumps({
    "inputs": inputs,
    "nativeCpu": identity,
    "sourceRange": [478, 706],
    "firstBranchRange": [599, 625],
    "commandRange": [617, 621],
    "recurringTurns": [253, 509],
    "branchCases": branch_cases,
    "failureDispatch": {
        "taskOrigin": "0xa678",
        "firstCandidate": hex(candidates[0]),
        "firstCandidateXY": [candidates[0] & 255, candidates[0] >> 8],
        "originWasVisited": 0xA678 in candidates,
        "candidateCount": len(candidates),
        "dispatchCallsToPhase9": 52,
        "flagsAfterCleanupVisit": read(AI + 0x74),
        "rngBefore": "0x12345678",
        "rngAfter": hex(rng_after_failure),
    },
}, indent=2, sort_keys=True))
