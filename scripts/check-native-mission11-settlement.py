"""Probe Mission 11's first autonomous enemy construction request.

Usage: .tools/decomp/oracle/bin/python scripts/check-native-mission11-settlement.py \
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
    raise SystemExit("Usage: check-native-mission11-settlement.py /path/to/d3dpoptb.exe")
EXE = Path(sys.argv[1]).resolve()
LEVELS = EXE.parent / "levels"
EXPECTED = {
    "d3dpoptb.exe": "3a5065c7420b3fcde208bf220bc86dfbac95e025ab2492caf9c7ea5308dfbe4f",
    "levl2011.hdr": "c4d8198e104db05ae55f7f141da41e7fe44ee1cf356b7ce084dfb32a4ba0807b",
    "levl2011.dat": "a65fdd6f8b2ad61e96b2294959476f7711c55f54e909fdf48c35a535e9aad83b",
    "cpscr017.dat": "9b381fd47dc1275f1aac66248bc9c9c2c11e6c76f677c5cefb1eed817077e834",
    "cpscr022.dat": "ba0b39d07de48ac2493d75b8ae01225707a7443dd828f276b4a4dbdef2d43bc5",
}


def digest(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()


paths = {
    "d3dpoptb.exe": EXE,
    **{name: LEVELS / name for name in EXPECTED if name != "d3dpoptb.exe"},
}
hashes = {name: digest(path) for name, path in paths.items()}
assert hashes == EXPECTED, hashes

header = paths["levl2011.hdr"].read_bytes()
assert len(header) == 616 and header[88] == 4
tribe_scripts = {tribe: header[88 + tribe] for tribe in range(1, header[88])}
assert tribe_scripts == {1: 17, 2: 17, 3: 22}

# Read initial native object records directly. Person model 7 is the Shaman.
level = paths["levl2011.dat"].read_bytes()
matak_shamans = []
matak_braves = []
for index in range(2000):
    record = level[0x14043 + index * 55 : 0x14043 + (index + 1) * 55]
    if record[0] == 7 and record[1] == 1 and record[2] == 3:
        x, y = struct.unpack_from("<hh", record, 3)
        matak_shamans.append((index, x, y))
    if record[0] == 2 and record[1] == 1 and record[2] == 3:
        matak_braves.append(index)
assert matak_shamans == [(14, 0x7700, -0x3100)]
assert matak_braves == [8, 9, 10, 11, 12, 13]
shaman_cell = ((matak_shamans[0][1] >> 8) & 0xFE) | (matak_shamans[0][2] & 0xFE00)
assert shaman_cell == 0xCE76

script = bytearray(paths["cpscr022.dat"].read_bytes())
assert len(script) == 12552 and struct.unpack_from("<H", script)[0] == 12
codes = list(struct.unpack_from("<4096H", script))
fields = list(struct.iter_unpack("<Ii", script[8192:12288]))
codes = codes[: codes.index(1019) + 1]

# Turn-zero setup supplies Matak's coordinate latch and construction-task limit.
assert codes[10:14] == [1006, 1069, 3, 4]
assert fields[3] == (0, 120) and fields[4] == (0, 216)
assert codes[44:47] == [1007, 12, 13]
assert fields[12] == (2, 1009) and fields[13] == (0, 4)

# Later boundary only: Matak's first explicit BUILD_AT remains deferred.
assert codes[478:481] == [1005, 70, 1003] and fields[70] == (0, 255)
assert codes[617:621] == [1006, 1082, 3, 117]
assert fields[117] == (0, 166)

cpu, _ = native_cpu(EXE)
cpu.mem_map(0x2000000, 0x60000)
ai, program, stack, stop = 0x2000000, 0x2010000, 0x205D000, 0x205E000


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


cpu.mem_write(ai, bytes(0xC65))
cpu.mem_write(program, bytes(script))
write(ai + 0xC22, "B", 3)
write(0x89D188, "I", 0)
call(0x48C6B0, ai, program)

attributes = list(cpu.mem_read(0x9607EA + 3 * 48, 48))
turn_zero = {
    "tribe": 3,
    "script": "cpscr022.dat",
    "coordinateLatchCommand": [1069, [120, 216]],
    "flags": hex(read(ai + 0x596)),
    "taskTypeFlags": hex(read(ai + 0x59A)),
    "coordinateLatch": hex(read(ai + 0x5A4, "H")),
    "taskLimitAttribute9": attributes[9],
    "housingTargetAttribute10": attributes[10],
}
expected_turn_zero = {
    "tribe": 3,
    "script": "cpscr022.dat",
    "coordinateLatchCommand": [1069, [120, 216]],
    "flags": "0x20",
    "taskTypeFlags": "0x1b8bef",
    "coordinateLatch": "0xd878",
    "taskLimitAttribute9": 4,
    "housingTargetAttribute10": 20,
}
assert turn_zero == expected_turn_zero, {"actual": turn_zero, "expected": expected_turn_zero}

# The first Matak ordinary producer phase is turn 60. Building availability is
# an external rules-table leaf; Mission 11 enables model 4.
available_queries = []


def available_leaf(_cpu, _address, _size, _user):
    available_queries.append("availableBraves")
    ret(len(matak_braves))


cpu.hook_add(UC_HOOK_CODE, available_leaf, begin=0x4F67B0, end=0x4F67B0)
write(ai + 0x36A, "H", shaman_cell)
write(ai + 0x5B4, "B", 1)  # No-base origin selects the Shaman cell (004f6020).
write(ai + 0x885, "I", 0)
write(0x89D178, "I", 0x12345678)
assert ((60 + 3 + 1) & 63) == 0
assert call(0x4E5580, ai, 0) == 1
task = {
    "flags": read(ai + 0x74),
    "type": read(ai + 0x85, "B"),
    "requestedModel": read(ai + 0x68),
    "origin": hex(read(ai + 0x6C)),
    "exact": read(ai + 0x70),
    "phase": read(ai + 0x78, "H"),
}
expected_task = {
    "flags": 1,
    "type": 0,
    "requestedModel": 4,
    "origin": "0xce76",
    "exact": 0,
    "phase": 0,
}
assert task == expected_task, {"actual": task, "expected": expected_task}
assert read(0x89D178) == 0x12345678

result = {
    "inputs": hashes,
    "headerTribeScripts": tribe_scripts,
    "matakShaman": {
        "objectIndex": 14,
        "nativePosition": [0x7700, -0x3100],
        "coarseCell": hex(shaman_cell),
    },
    "turnZero": turn_zero,
    "firstProducer": {
        "tribe": 3,
        "turn": 60,
        "nextChumaraProducerTurn": 61,
        "availableQueries": available_queries,
        "task": task,
        "dispatchCenter": "0xd878",
        "rngBefore": "0x12345678",
        "rngAfter": hex(read(0x89D178)),
    },
    "laterDeferredBuildAt": {
        "turn": 253,
        "scriptRange": [478, 706],
        "commandRange": [617, 621],
        "opcode": 1082,
        "arguments": [120, 166],
    },
}
print(json.dumps(result, indent=2, sort_keys=True))
