#!/usr/bin/env python3
"""Bounded Mission 15 Prison native probe (non-recording).

Usage:
  .tools/decomp/oracle/bin/python \
    scripts/check-native-mission15-prison.py \
    work/orchestration/ceo-release/native-run/d3dpoptb.exe

The probe runs isolated PE32 routines in Unicorn. It never launches the game and
does not write fixtures, tracked evidence, or source files.
"""

import hashlib
import json
import struct
import sys
from pathlib import Path

from unicorn import UC_HOOK_CODE
from unicorn.x86_const import UC_X86_REG_EAX, UC_X86_REG_EIP, UC_X86_REG_ESP

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "scripts"))
from decomp import load_native_shapes, native_cpu  # noqa: E402

EXPECTED = {
    "exe": "3a5065c7420b3fcde208bf220bc86dfbac95e025ab2492caf9c7ea5308dfbe4f",
    "level": "abbb134fe40b142b0946b49f72fea829b30ca2a535daad4b23f962158547fdcf",
    "header": "049c95ca300efa49f47f58f4fe517d51a1732fbf6e1abec1f54d68a71cc8aafe",
    "script": "c9c1f0c79da1bbb6153f1ca76103a9eb4723e5d740a3db8cc1f302ebb6fb217a",
}


def sha(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()


exe = Path(sys.argv[1]).resolve()
levels = exe.parent / "levels"
level_path, header_path, script_path = (
    levels / "levl2015.dat",
    levels / "levl2015.hdr",
    levels / "cpscr075.dat",
)
actual_hashes = {
    "exe": sha(exe),
    "level": sha(level_path),
    "header": sha(header_path),
    "script": sha(script_path),
}
assert actual_hashes == EXPECTED, actual_hashes

# Authored inputs: object records and marker 8.
level = level_path.read_bytes()
objects = []
for index in (168, 169):
    raw = level[0x14043 + index * 55 : 0x14043 + (index + 1) * 55]
    x, y = struct.unpack_from("<hh", raw, 3)
    objects.append(
        {
            "index": index,
            "class": raw[1],
            "model": raw[0],
            "owner": raw[2],
            "nativePosition": [x, y],
            "browserPosition": [x / 256 - 8, -y / 256 - 8],
            "angle": struct.unpack_from("<i", raw, 7)[0],
            "raw55": raw.hex(),
        }
    )
assert [(o["class"], o["model"], o["owner"]) for o in objects] == [(2, 19, 2), (1, 7, 0)]
header = header_path.read_bytes()
marker8 = struct.unpack_from("<H", header, 100 + 8 * 2)[0]
assert marker8 == 0x1274
assert list(header[88:92]) == [3, 75, 75, 5]

# Authored script words/fields. These exact slices prevent opcode-name guessing.
script = script_path.read_bytes()
codes = list(struct.unpack_from("<4096H", script))
fields = list(struct.iter_unpack("<Ii", script[8192:12288]))
assert codes[52:55] == [1006, 1200, 6] and fields[6] == (0, 450)
assert codes[315:319] == [1007, 65, 13, 1004] and fields[65] == (1, 10) and fields[13] == (0, 1)
assert codes[552:583] == [
    1005, 23, 107, 1003, 1000, 1020, 1014, 65, 13, 1014, 108, 13, 1003,
    1006, 1202, 59, 1000, 1014, 59, 13, 1003, 1006, 1112, 1007, 45, 84,
    1006, 1064, 27, 25, 1,
]
assert fields[23] == (0, 15) and fields[107] == (0, 34)
assert fields[108] == (2, 1157) and fields[27] == (2, 1186) and fields[25] == (0, 8)
assert codes[770:795] == [
    1005, 23, 1, 1003, 1000, 1014, 65, 13, 1003, 1006, 1223, 65,
    1000, 1014, 65, 1, 1003, 1006, 1201, 1006, 1093, 29, 53, 52, 14,
]

cpu, identity = native_cpu(exe)
assert identity["sha256"] == EXPECTED["exe"]
cpu.mem_map(0x2000000, 0x100000)
load_native_shapes(cpu, exe, 0x2080000, 0x2090000)
stack, stop = 0x20FD000, 0x20FE000
prison, shaman, attacker, footprint_cell = 0x2000000, 0x2001000, 0x2002000, 0x2003000
events = []


def write(address, fmt, *values):
    cpu.mem_write(address, struct.pack("<" + fmt, *values))


def read(address, fmt):
    return struct.unpack("<" + fmt, cpu.mem_read(address, struct.calcsize("<" + fmt)))


def call(address, *args, count=1_000_000):
    write(stack, "I" * (len(args) + 1), stop, *args)
    cpu.reg_write(UC_X86_REG_ESP, stack)
    cpu.emu_start(address, stop, count=count)
    assert cpu.reg_read(UC_X86_REG_EIP) == stop, hex(cpu.reg_read(UC_X86_REG_EIP))
    return cpu.reg_read(UC_X86_REG_EAX) & 0xFFFFFFFF


def return_from_hook(c, value=0):
    sp = c.reg_read(UC_X86_REG_ESP)
    c.reg_write(UC_X86_REG_EAX, value & 0xFFFFFFFF)
    c.reg_write(UC_X86_REG_EIP, read(sp, "I")[0])
    c.reg_write(UC_X86_REG_ESP, sp + 4)


def simple_hook(c, address, size, user):
    events.append({"leaf": hex(address), "args": list(read(c.reg_read(UC_X86_REG_ESP) + 4, "III"))})
    return_from_hook(c)


# Presentation/land-registration leaves are outside this state probe.
for address in (0x493770, 0x40AFD0, 0x403A00):
    cpu.hook_add(UC_HOOK_CODE, simple_hook, begin=address, end=address)

# Common authored-loader fields are supplied; 0x4030c0/0x4049d0 is the real
# completed-building initializer. Sentinels demonstrate its neighboring-state scope.
cpu.mem_write(prison, bytes(0x100))
write(prison + 0x24, "H", 168)
write(prison + 0x26, "h", 0)
write(prison + 0x2A, "BBB", 2, 19, 2)
write(prison + 0x2F, "B", 2)
write(prison + 0x3D, "HHh", 29696, 4608, 0)
write(prison + 0x7A, "HH", 29696, 4608)
write(prison + 0x0C, "I", 0x08120040)
write(prison + 0x10, "I", 0x20000000)
write(prison + 0x14, "I", 4)
write(prison + 0xA8, "I", 0x5A5A5A5A)
before_neighbor = cpu.mem_read(prison + 0xA8, 4).hex()
call(0x4030C0, prison)
prison_init = {
    "id": read(prison + 0x24, "H")[0],
    "classModelStateSubstate": list(read(prison + 0x2A, "BBBB")),
    "owner": read(prison + 0x2F, "B")[0],
    "flags2": hex(read(prison + 0x0C, "I")[0]),
    "flags4": hex(read(prison + 0x10, "I")[0]),
    "flags3": hex(read(prison + 0x14, "I")[0]),
    "object": read(prison + 0x33, "H")[0],
    "stage": read(prison + 0x78, "B")[0],
    "anchor": list(read(prison + 0x7A, "HH")),
    "buildingFlags": hex(read(prison + 0x9C, "H")[0]),
    "damage": read(prison + 0x9E, "H")[0],
    "occupants": read(prison + 0xA6, "B")[0],
    "neighborSentinelUnchanged": before_neighbor == cpu.mem_read(prison + 0xA8, 4).hex(),
}
assert prison_init["classModelStateSubstate"] == [2, 19, 2, 0] and prison_init["owner"] == 2
assert prison_init["stage"] == 4 and prison_init["buildingFlags"] == "0x8"

# Ordinary Brave damage is the shipped descriptor's building-damage byte >> 2.
cpu.mem_write(attacker, bytes(0x100))
write(attacker + 0x2A, "BB", 1, 2)
write(attacker + 0x2F, "b", 0)
write(prison + 0x9E, "H", 0)
write(prison + 0xAF, "b", -1)
write(0x895DA4, "I", 0)
write(0x89C6F0, "B", 0)
call(0x409140, prison, attacker)
strike = {"damage": read(prison + 0x9E, "H")[0], "attackerTribe": read(prison + 0xAF, "b")[0]}
assert strike == {"damage": 7, "attackerTribe": 0}

# Captive state-42 initializer with the native adjacent-Prison result supplied.
def captive_hook(c, address, size, user):
    sp = c.reg_read(UC_X86_REG_ESP)
    if address == 0x40A3F0:
        events.append({"leaf": hex(address), "purpose": "adjacent Prison", "result": hex(prison)})
        return_from_hook(c, prison)
    else:
        events.append({"leaf": hex(address), "args": list(read(sp + 4, "III"))})
        return_from_hook(c)


for address in (0x445750, 0x40A3F0, 0x407150):
    cpu.hook_add(UC_HOOK_CODE, captive_hook, begin=address, end=address)
cpu.mem_write(shaman, bytes(0x100))
write(shaman + 0x24, "H", 169)
write(shaman + 0x2A, "BBBB", 1, 7, 42, 0)
write(shaman + 0x2F, "B", 0)
write(shaman + 0x3D, "HHh", 29952, 4864, 77)
write(shaman + 0x0C, "I", 0x00004001)
write(shaman + 0x10, "I", 0xABCDEF7F)
# The native cell index packs the even high bytes of (x,y):
# ((0x13 << 8 & 0xfe00) | ((0x75 & 0xfe) << 1)) == 0x12e8.
write(0x8A03EC + 0x12E8 * 4, "H", 168)
call(0x4E2770, shaman)
captive = {
    "classModelStateSubstate": list(read(shaman + 0x2A, "BBBB")),
    "owner": read(shaman + 0x2F, "B")[0],
    "position": list(read(shaman + 0x3D, "HHh")),
    "flags2": hex(read(shaman + 0x0C, "I")[0]),
    "flags4": hex(read(shaman + 0x10, "I")[0]),
    "substate": read(shaman + 0x2D, "B")[0],
    "cellBuildingId": read(shaman + 0x89, "H")[0],
    "prisonCell": hex(read(shaman + 0x72, "H")[0]),
}
assert captive["position"] == [29952, 4864, 77]
assert captive["cellBuildingId"] == 168 and captive["prisonCell"] == "0x1274", captive

# Prison-specific removal releases matching state-10 attackers to state 41.
def removal_hook(c, address, size, user):
    sp = c.reg_read(UC_X86_REG_ESP)
    if address == 0x4B9EF0:
        out, count_out = read(sp + 12, "II")
        write(footprint_cell + 6, "H", 31)
        write(out, "I", footprint_cell)
        write(count_out, "I", 1)
        events.append({"leaf": hex(address), "purpose": "one supplied Prison footprint cell"})
    else:
        events.append({"leaf": hex(address), "unit": hex(read(sp + 4, "I")[0])})
    return_from_hook(c)


for address in (0x4B9EF0, 0x436CA0, 0x4ED6F0, 0x4ED640):
    cpu.hook_add(UC_HOOK_CODE, removal_hook, begin=address, end=address)
write(0x890390 + 31 * 4, "I", attacker)
write(attacker + 0x24, "H", 31)
write(attacker + 0x2A, "BBB", 1, 2, 10)
write(attacker + 0xA7, "B", 19)
write(attacker + 0x89, "H", 168)
write(attacker + 0x10, "I", 0x12340080)
write(attacker + 0x3D, "HHh", 0x6543, 0x3210, -17)
call(0x40C3A0, prison)
release = {
    "state": read(attacker + 0x2C, "B")[0],
    "previousState": read(attacker + 0x7D, "B")[0],
    "flags4": hex(read(attacker + 0x10, "I")[0]),
    "classModelOwnerUnchanged": list(read(attacker + 0x2A, "BBxB")),
    "positionUnchanged": list(read(attacker + 0x3D, "HHh")),
}
assert release["state"] == 41 and release["previousState"] == 10 and release["flags4"] == "0x12340000", (release, events)
assert release["positionUnchanged"] == [0x6543, 0x3210, -17]

# Global Prison predicate and exact timer storage/tick/query/cancellation behavior.
write(0x8922E8, "I", 0)
predicate = [call(0x499960)]
write(0x8922E8, "I", prison)
predicate.append(call(0x499960))
assert predicate == [0, 1]
call(0x4A5D20, 12 * 450, 1)
timer = {"start": list(read(0x96A85C, "III")), "queryAtStart": call(0x4A5EC0)}
for _ in range(5399):
    call(0x4A5D40)
timer["after5399"] = read(0x96A85C, "I")[0]
call(0x4A5D40)
timer["after5400"] = read(0x96A85C, "I")[0]
timer["queryExpired"] = call(0x4A5EC0)
call(0x4A5D20, 12 * 450, 1)
call(0x4A5D20, 0, 0)
call(0x4A5EB0)
call(0x4A5EE0)
timer["cancelled"] = {"storage": list(read(0x96A85C, "III")), "query": call(0x4A5EC0)}
assert timer == {
    "start": [5400, 3, 1], "queryAtStart": 0, "after5399": 1,
    "after5400": 0, "queryExpired": 1,
    "cancelled": {"storage": [0, 0, 0], "query": 0},
}

exports = sorted((Path(__file__).parent).glob("00*.c"))
result = {
    "status": "PASS",
    "sourceHashes": actual_hashes,
    "authored": {"objects": objects, "marker8": hex(marker8), "headerScriptBytes": list(header[88:92])},
    "script": {
        "timerSeconds": fields[6][1], "timerTurnsAt12Hz": 5400,
        "activeVariable": fields[65][1], "expiryMaskOffset": [fields[23][1], fields[107][1]],
        "expiryGate": {"blueShamanCountInternal": fields[108][1], "required": fields[13][1]},
        "expiryActions": [1112, {"opcode": 1064, "resolvedArgs": [3, 8, 0]}],
        "rescueMaskOffset": [15, 0], "rescueActions": [1223, 1201, {"opcode": 1093, "args": [2, 3, 4, 7]}],
        "tribeTurnPhases": {"expiry": {"1": 13, "2": 12}, "rescue": {"1": 15, "2": 14}},
    },
    "native": {
        "prisonInitializer": prison_init, "braveStrike": strike, "captiveInitializer": captive,
        "attackerRelease": release, "prisonPredicate": predicate, "timer": timer,
    },
    "interceptedLeaves": events,
    "exportHashes": {p.name: sha(p) for p in exports},
}
print(json.dumps(result, indent=2, sort_keys=True))
