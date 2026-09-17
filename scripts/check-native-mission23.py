#!/usr/bin/env python3
"""Non-recording Mission 23 trigger 303/305 native comparison."""

import hashlib
import struct
import sys
from pathlib import Path

from unicorn import UC_HOOK_CODE
from unicorn.x86_const import UC_X86_REG_EAX, UC_X86_REG_EIP, UC_X86_REG_ESP

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "scripts"))
from decomp import configure_native_constants, native_cpu  # noqa: E402

if len(sys.argv) != 2:
    raise SystemExit("Usage: check-native-mission23.py /path/to/d3dpoptb.exe")
EXE = Path(sys.argv[1]).resolve()
LEVELS = EXE.parent / "levels"
PATHS = {
    "d3dpoptb.exe": EXE,
    "levl2023.dat": LEVELS / "levl2023.dat",
    "levl2023.hdr": LEVELS / "levl2023.hdr",
    "cpscr023.dat": LEVELS / "cpscr023.dat",
    "cpscr024.dat": LEVELS / "cpscr024.dat",
    "cpscr018.dat": LEVELS / "cpscr018.dat",
    "language/lang00.dat": EXE.parent / "language/lang00.dat",
}
EXPECTED = {
    "d3dpoptb.exe": "3a5065c7420b3fcde208bf220bc86dfbac95e025ab2492caf9c7ea5308dfbe4f",
    "levl2023.dat": "12f4a91df64f18cdc154d9d0e39780d52d2e4e1e4efd708fd7a35dd9c3b344dc",
    "levl2023.hdr": "d141635a840bb16a4b5e41beec064fd154aead055bbe663710dbcfe417574976",
    "cpscr023.dat": "948357f83023f426cbd64e209d0e25753a240a219d53cd9493186dd23a71a943",
    "cpscr024.dat": "55acfcbf2ea4d3d2a73693c49ffc29774c63575f2639dd1b8920b569fd0c22c1",
    "cpscr018.dat": "e45e2508c10e5e30af1e8a4847a5c25bfbd60b4780c7b7c75f9bf1b7a0491a7e",
    "language/lang00.dat": "e826c478746d666a3ea9ea36cb7804d1d226d5f83084230987b1de293066cf7d",
}
HASHES = {name: hashlib.sha256(path.read_bytes()).hexdigest() for name, path in PATHS.items()}
assert HASHES == EXPECTED, HASHES
LEVEL = PATHS["levl2023.dat"].read_bytes()


def record(index):
    raw = LEVEL[0x14043 + index * 55 : 0x14043 + (index + 1) * 55]
    x, y, z = struct.unpack_from("<hhh", raw, 3)
    return {
        "index": index,
        "model": raw[0],
        "class": raw[1],
        "owner": raw[2],
        "position": [x, y, z],
        "raw": raw,
        "settings": list(raw[7:39]),
    }


OBJECTS = {index: record(index) for index in range(2000) if record(index)["class"]}


def links(item):
    settings = item["settings"]
    values = [settings[6 + slot * 2] | settings[7 + slot * 2] << 8 for slot in range(10)]
    return [(slot, value - 1) for slot, value in enumerate(values) if value]


assert links(OBJECTS[303]) == [(0, 304)]
assert links(OBJECTS[305]) == [(0, 306), (1, 303)]
assert (OBJECTS[304]["class"], OBJECTS[304]["model"], OBJECTS[304]["owner"]) == (6, 2, 255)
assert OBJECTS[304]["settings"][:8] == [6, 53, 3, 1, 0, 0, 0, 0]
assert (OBJECTS[306]["class"], OBJECTS[306]["model"], OBJECTS[306]["owner"]) == (5, 9, 255)
assert (OBJECTS[303]["class"], OBJECTS[303]["model"], OBJECTS[303]["owner"]) == (6, 6, 0)

incoming = {
    target: [(item["index"], slot) for item in OBJECTS.values() for slot, linked in links(item) if linked == target]
    for target in (303, 304, 306)
}
assert incoming == {303: [(305, 1)], 304: [(303, 0)], 306: [(305, 0)]}

cpu, identity = native_cpu(EXE)
configure_native_constants(cpu, EXE)
cpu.mem_map(0x2000000, 0x100000)
UNIT, SOURCES, CLONES = 0x2000000, 0x2002000, 0x2040000
PERSON, STACK, STOP = 0x2080000, 0x20FD000, 0x20FE000


def write(address, fmt, *values):
    cpu.mem_write(address, struct.pack("<" + fmt, *values))


def read(address, fmt="I"):
    return struct.unpack("<" + fmt, cpu.mem_read(address, struct.calcsize("<" + fmt)))[0]


def invoke(address, *values):
    write(STACK, "I" * (len(values) + 1), STOP, *values)
    cpu.reg_write(UC_X86_REG_ESP, STACK)
    cpu.emu_start(address, STOP, count=1_000_000)
    assert cpu.reg_read(UC_X86_REG_EIP) == STOP, hex(cpu.reg_read(UC_X86_REG_EIP))
    return cpu.reg_read(UC_X86_REG_EAX) & 0xFFFFFFFF


def return_from_hook(value=0):
    sp = cpu.reg_read(UC_X86_REG_ESP)
    cpu.reg_write(UC_X86_REG_EIP, read(sp))
    cpu.reg_write(UC_X86_REG_ESP, sp + 4)
    cpu.reg_write(UC_X86_REG_EAX, value)


events, deletions = [], []
next_clone = 0


def allocation(_cpu, _address, _size, _user):
    global next_clone
    sp = cpu.reg_read(UC_X86_REG_ESP)
    class_id, model, owner = struct.unpack("<III", cpu.mem_read(sp + 4, 12))
    pointer = CLONES + next_clone * 0x200
    next_clone += 1
    cpu.mem_write(pointer, bytes(0x200))
    write(pointer + 0x24, "H", 1001 + next_clone)
    write(pointer + 0x2A, "BBB", class_id & 255, model & 255, owner & 255)
    events.append(["allocate", class_id & 255, model & 255, owner & 255, hex(pointer)])
    return_from_hook(pointer)


def copy_template(_cpu, _address, _size, _user):
    clone = read(cpu.reg_read(UC_X86_REG_ESP) + 4)
    source = read(cpu.reg_read(UC_X86_REG_ESP) + 8)
    unit_index = read(clone + 0x24, "H")
    cpu.mem_write(clone, bytes(cpu.mem_read(source, 0xB3)))
    write(clone + 0x24, "H", unit_index)
    events.append(["copy", read(source + 0x24, "H") - 1, hex(clone)])
    return_from_hook()


def process(_cpu, _address, _size, _user):
    pointer = read(cpu.reg_read(UC_X86_REG_ESP) + 4)
    events.append(["first-process", read(pointer + 0x2A, "B"), read(pointer + 0x2B, "B"), hex(pointer)])
    return_from_hook()


def deletion(_cpu, _address, _size, _user):
    pointer = read(cpu.reg_read(UC_X86_REG_ESP) + 4)
    unit_index = read(pointer + 0x24, "H")
    deletions.append(unit_index)
    events.append(["delete", unit_index])
    return_from_hook()


def ignore(_cpu, _address, _size, _user):
    return_from_hook()


def unreferenced(_cpu, _address, _size, _user):
    return_from_hook(0)


def eligible(_cpu, _address, _size, _user):
    return_from_hook(1)


for address, callback in (
    (0x4ED8A0, allocation),
    (0x4EDE10, copy_template),
    (0x4ED700, process),
    (0x4EF180, deletion),
    (0x4FC290, unreferenced),
    (0x4FBD20, ignore),
    (0x48A050, ignore),
    (0x481550, ignore),
    (0x4F62C0, eligible),
):
    cpu.hook_add(UC_HOOK_CODE, callback, begin=address, end=address)


def install(index, pointer):
    item = OBJECTS[index]
    cpu.mem_write(pointer, bytes(0x200))
    write(pointer + 0x24, "H", index + 1)
    write(pointer + 0x2A, "BB", item["class"], item["model"])
    write(pointer + 0x2F, "B", item["owner"])
    write(pointer + 0x3D, "hhh", *item["position"])
    cpu.mem_write(SOURCES + 0x1800, item["raw"])
    invoke(0x485B00, pointer, SOURCES + 0x1800)
    write(0x890390 + (index + 1) * 4, "I", pointer)


def head_state(pointer):
    return {
        "mode": read(pointer + 0x68, "B"),
        "remaining": read(pointer + 0x6B, "b"),
        "flags": read(pointer + 0x6D, "B"),
        "cooldown": read(pointer + 0x90, "h"),
        "repeatDelay": read(pointer + 0xA2, "h"),
        "requiredWork": read(pointer + 0x9A, "i"),
        "work": read(pointer + 0x96, "i"),
        "completionDelay": read(pointer + 0x9E, "h"),
        "links": [read(pointer + 0x72 + slot * 2, "H") for slot in range(10)],
    }


def complete(head_index, source_indices):
    global next_clone
    cpu.mem_write(0x890390, bytes(4096))
    cpu.mem_write(UNIT, bytes(0x200))
    next_clone = 0
    events.clear()
    deletions.clear()
    install(head_index, UNIT)
    for ordinal, source_index in enumerate(source_indices):
        install(source_index, SOURCES + ordinal * 0x200)
    before = head_state(UNIT)
    write(UNIT + 0x2E, "B", 1)
    write(UNIT + 0xA0, "B", 0)
    write(UNIT + 0x6D, "B", read(UNIT + 0x6D, "B") | 2)
    write(UNIT + 0x96, "i", 12345)
    write(0x89D178, "I", 0x12345678)
    invoke(0x4FB270, UNIT)
    return {
        "before": before,
        "after": head_state(UNIT),
        "events": list(events),
        "deletions": list(deletions),
        "rngAfter": hex(read(0x89D178)),
        "clones": [
            {
                "pointer": hex(CLONES + ordinal * 0x200),
                "class": read(CLONES + ordinal * 0x200 + 0x2A, "B"),
                "model": read(CLONES + ordinal * 0x200 + 0x2B, "B"),
                "owner": read(CLONES + ordinal * 0x200 + 0x2F, "B"),
                "state": read(CLONES + ordinal * 0x200 + 0x2C, "B"),
                "rewardClass": read(CLONES + ordinal * 0x200 + 0x7C, "B"),
                "rewardTag": read(CLONES + ordinal * 0x200 + 0x74),
                "grantMode": read(CLONES + ordinal * 0x200 + 0x80, "B"),
                "amount": read(CLONES + ordinal * 0x200 + 0x70),
                "head": head_state(CLONES + ordinal * 0x200),
            }
            for ordinal in range(next_clone)
        ],
    }


trigger303 = complete(303, [304])
gift_image = bytes(cpu.mem_read(CLONES, 0x200))
assert trigger303["before"]["mode"] == 0 and trigger303["before"]["remaining"] == 0
assert trigger303["after"]["completionDelay"] == 0
assert trigger303["deletions"] == []
assert [(event[0], event[1:3]) for event in trigger303["events"]] == [
    ("allocate", [6, 2]), ("copy", [304, hex(CLONES)]), ("first-process", [6, 2])
]

trigger305 = complete(305, [306, 303])
assert trigger305["before"]["mode"] == 0 and trigger305["before"]["remaining"] == 1
assert trigger305["after"]["completionDelay"] == 0
assert trigger305["deletions"] == [307, 304, 306]
assert [(clone["class"], clone["model"], clone["owner"]) for clone in trigger305["clones"]] == [
    (5, 9, 255), (6, 6, 0)
]


def gift_case(team):
    gift = CLONES + 0x8000
    cpu.mem_write(gift, gift_image)
    write(gift + 0x24, "H", 1400 + team)
    write(gift + 0x2D, "B", 1)
    write(gift + 0x78, "H", 0)
    write(gift + 0x7A, "h", 0)
    write(gift + 0x7E, "B", 255)
    write(gift + 0x7F, "B", 0)
    cpu.mem_write(PERSON, bytes(0x200))
    write(PERSON + 0x24, "H", 1)
    write(PERSON + 0x2A, "BB", 1, 7)
    write(PERSON + 0x2F, "B", team)
    write(0x890390 + 4, "I", PERSON)
    x, y = struct.unpack("<HH", cpu.mem_read(gift + 0x3D, 4))
    packed = ((x >> 8) & 0xFE) | (((y >> 8) & 0xFE) << 8)
    word_index = ((packed & 0xFE) * 2 | packed & 0xFE00) * 2
    write(0x8A03EA + word_index * 2, "H", 1)
    tribe = 0x89D1C8 + team * 0xC65
    write(tribe + 0x951, "i", 123)
    write(tribe + 0x990, "H", 0x7777)
    deletions.clear()
    write(0x89D178, "I", 0x12345678)
    invoke(0x4FACF0, gift)
    selected = {
        "team": team,
        "recipient": read(gift + 0x7E, "B"),
        "timer": read(gift + 0x7A, "h"),
        "phase": read(gift + 0x7F, "B"),
        "amount": read(gift + 0x70),
    }
    for _ in range(81):
        invoke(0x4FACF0, gift)
    before_final = {"timer": read(gift + 0x7A, "h"), "pendingMana": read(tribe + 0x951, "i")}
    invoke(0x4FACF0, gift)
    after_final = {
        "timer": read(gift + 0x7A, "h"),
        "pendingMana": read(tribe + 0x951, "i"),
        "unrelated": read(tribe + 0x990, "H"),
        "deleted": deletions[-1],
        "rng": hex(read(0x89D178)),
    }
    assert selected == {"team": team, "recipient": team, "timer": 82, "phase": 1, "amount": 0}
    assert before_final == {"timer": 1, "pendingMana": 123}
    assert after_final == {
        "timer": 0, "pendingMana": 123, "unrelated": 0x7777,
        "deleted": 1400 + team, "rng": "0x12345678",
    }
    return {"selected": selected, "beforeFinal": before_final, "afterFinal": after_final}


result = {
    "provenance": {"hashes": HASHES, "nativeCpu": identity, "python": sys.version.split()[0]},
    "topology": {
        "303": {"record": {k: OBJECTS[303][k] for k in ("index", "class", "model", "owner", "position")}, "links": links(OBJECTS[303])},
        "304": {"record": {k: OBJECTS[304][k] for k in ("index", "class", "model", "owner", "position")}, "settings": OBJECTS[304]["settings"][:8]},
        "305": {"record": {k: OBJECTS[305][k] for k in ("index", "class", "model", "owner", "position")}, "links": links(OBJECTS[305])},
        "306": {"record": {k: OBJECTS[306][k] for k in ("index", "class", "model", "owner", "position")}, "settings": OBJECTS[306]["settings"][:8]},
        "incoming": incoming,
    },
    "trigger303": trigger303,
    "trigger305": trigger305,
    "giftCases": {str(team): gift_case(team) for team in (0, 2)},
    "suppliedLeaves": ["004ed8a0 allocation storage", "004ede10 template copy", "004ed700 first-process call recorded", "004ef180 deletion bookkeeping", "004fc290 unique-reference result", "004fbd20 presentation", "0048a050/00481550 audio/UI", "004f62c0 person eligibility"],
}

print("PASS: Mission 23 triggers 303/305 verified")
