#!/usr/bin/env python3
"""Non-recording Mission 20 linked-head and opcode-1127 probe."""

import argparse
import hashlib
import json
import struct
import sys
from pathlib import Path

from unicorn import UC_HOOK_CODE
from unicorn.x86_const import UC_X86_REG_EAX, UC_X86_REG_EIP, UC_X86_REG_ESP

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "scripts"))
from decomp import native_cpu  # noqa: E402

EXPECTED = {
    "d3dpoptb.exe": "3a5065c7420b3fcde208bf220bc86dfbac95e025ab2492caf9c7ea5308dfbe4f",
    "levl2020.dat": "3867a5c04d706dabad555e912db007ef9a74e99ffb0982227b5bcebfbef7f781",
    "levl2020.hdr": "a364fabd0f483570149756f1d7c83f28982faaea410d78f11122e6bfa77b3820",
    "cpscr043.dat": "96b9043ea914b88dd09e45381bd848f5a9d7a12ef6ff796326dece586c3bd141",
}


def sha(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()


parser = argparse.ArgumentParser()
parser.add_argument("exe", type=Path)
parser.add_argument("--output", type=Path)
args = parser.parse_args()
exe = args.exe.resolve()
levels = exe.parent / "levels"
paths = {
    "d3dpoptb.exe": exe,
    "levl2020.dat": levels / "levl2020.dat",
    "levl2020.hdr": levels / "levl2020.hdr",
    "cpscr043.dat": levels / "cpscr043.dat",
}
hashes = {name: sha(path) for name, path in paths.items()}
assert hashes == EXPECTED, hashes

level = paths["levl2020.dat"].read_bytes()


def record(index):
    raw = level[0x14043 + index * 55 : 0x14043 + (index + 1) * 55]
    x, y = struct.unpack_from("<hh", raw, 3)
    return {
        "index": index,
        "model": raw[0],
        "class": raw[1],
        "owner": raw[2],
        "position": [x, y, 0],
        "world": [x / 256 - 8, -y / 256 - 8],
        "raw": raw[:39],
        "settings": list(raw[7:39]) if raw[1] == 6 else None,
    }


# Effect templates retain their native loaded unit ids (0x06ac..0x06b1);
# their low-byte one-based ordinals identify adjacent DAT records 171..176.
effect_records = {token: (token & 0xFF) - 1 for token in range(0x06AC, 0x06B2)}


def source_index(token):
    return effect_records.get(token, token - 1)


def links(head):
    settings = head["settings"]
    values = [settings[6 + slot * 2] | settings[7 + slot * 2] << 8 for slot in range(10)]
    return [(slot, token, record(source_index(token))) for slot, token in enumerate(values) if token]


heads = {index: record(index) for index in (322, 124, 325, 330)}
all_heads = {
    index: candidate
    for index in range(2000)
    if (candidate := record(index))["class"] == 6 and candidate["model"] == 6
}
incoming = {}
for candidate in all_heads.values():
    for _slot, token, _source in links(candidate):
        incoming[token] = incoming.get(token, 0) + 1
decoded = {
    str(index): {
        "position": head["world"],
        "uses": head["settings"][3],
        "worshippers": head["settings"][4],
        "links": [
            {
                "slot": slot,
                "nativeUnitId": token,
                "sourceIndex": source["index"],
                "class": source["class"],
                "model": source["model"],
                "owner": source["owner"],
                "position": source["world"],
                "reward": source["settings"][:4] if source["settings"] else None,
            }
            for slot, token, source in links(head)
        ],
    }
    for index, head in heads.items()
}
assert [x["sourceIndex"] for x in decoded["322"]["links"]] == [323, 123, 171, 172, 173, 176, 175, 174, 125, 124]
assert [x["sourceIndex"] for x in decoded["124"]["links"]] == [122, 120, 119, 121, 118, 324, 325]
assert [x["sourceIndex"] for x in decoded["325"]["links"]] == [326, 327, 328, 329, 330]
assert [x["sourceIndex"] for x in decoded["330"]["links"]] == [331]
assert [decoded[str(i)]["uses"] for i in (322, 124, 325, 330)] == [1, 1, 1, 1]
assert [decoded[str(i)]["worshippers"] for i in (322, 124, 325, 330)] == [5, 6, 7, 8]
assert all(incoming[token] == 1 for head in heads.values() for _, token, _ in links(head))

# Verify the startup word and its parameter-free placement.
script = paths["cpscr043.dat"].read_bytes()
codes = list(struct.unpack_from("<4096H", script))
fields = list(struct.iter_unpack("<Ii", script[8192:12288]))
assert codes[207:218] == [1006, 1123, 1006, 1125, 1006, 1127, 1006, 1174, 18, 1006, 1187]
assert fields[18] == (0, 7)

cpu, identity = native_cpu(exe)
assert identity["sha256"] == EXPECTED["d3dpoptb.exe"]
cpu.mem_map(0x2000000, 0x100000)
HEAD, SOURCES, CLONES = 0x2000000, 0x2010000, 0x2040000
PROGRAM, COMMAND, STACK, STOP = 0x2080000, 0x20C0000, 0x20FD000, 0x20FE000


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


allocations, deletions, clone_sources = [], [], []
next_clone = 0


def allocation(_cpu, _address, _size, _user):
    global next_clone
    sp = cpu.reg_read(UC_X86_REG_ESP)
    class_id, model, owner, position = struct.unpack("<IIII", cpu.mem_read(sp + 4, 16))
    pointer = CLONES + next_clone * 0x100
    next_clone += 1
    cpu.mem_write(pointer, bytes(0x100))
    write(pointer + 0x24, "H", 2000 + next_clone)
    write(pointer + 0x2A, "BBB", class_id & 255, model & 255, 0)
    write(pointer + 0x2F, "B", owner & 255)
    cpu.mem_write(pointer + 0x3D, bytes(cpu.mem_read(position, 6)))
    allocations.append([class_id & 255, model & 255, owner & 255])
    return_from_hook(pointer)


def deletion(_cpu, _address, _size, _user):
    pointer = read(cpu.reg_read(UC_X86_REG_ESP) + 4)
    deletions.append(read(pointer + 0x24, "H"))
    write(pointer + 0xC, "I", read(pointer + 0xC) | 1)
    return_from_hook()


def copy_template(_cpu, _address, _size, _user):
    clone = read(cpu.reg_read(UC_X86_REG_ESP) + 4)
    source = read(cpu.reg_read(UC_X86_REG_ESP) + 8)
    clone_id = read(clone + 0x24, "H")
    cpu.mem_write(clone, bytes(cpu.mem_read(source, 0xB3)))
    write(clone + 0x24, "H", clone_id)
    clone_sources.append(read(source + 0x24, "H"))
    return_from_hook()


def ignore(_cpu, _address, _size, _user):
    return_from_hook()


for address, callback in (
    (0x4ED8A0, allocation),
    (0x4EF180, deletion),
    (0x4EDCF0, deletion),
    (0x4EDE10, copy_template),
    (0x4ED700, ignore),
    (0x4FBD20, ignore),
):
    cpu.hook_add(UC_HOOK_CODE, callback, begin=address, end=address)

# A full authored-graph scan above shows each linked source has one incoming edge.
cpu.hook_add(UC_HOOK_CODE, ignore, begin=0x4FC290, end=0x4FC290)


def install(source, pointer, unit_id):
    cpu.mem_write(pointer, bytes(0x100))
    write(pointer + 0x24, "H", unit_id)
    write(pointer + 0x2A, "BB", source["class"], source["model"])
    write(pointer + 0x2F, "B", source["owner"])
    write(pointer + 0x3D, "hhh", *source["position"])
    cpu.mem_write(COMMAND, source["raw"])
    invoke(0x485B00, pointer, COMMAND)
    write(0x890390 + unit_id * 4, "I", pointer)


def setup(index):
    global next_clone
    cpu.mem_write(0x890390, bytes(0x4000))
    cpu.mem_write(0x8A03E4, bytes(0x40000))
    allocations.clear()
    deletions.clear()
    clone_sources.clear()
    next_clone = 0
    install(heads[index], HEAD, index + 1)
    for offset, (_, token, source) in enumerate(links(heads[index])):
        install(source, SOURCES + offset * 0x100, token)


def complete(index):
    setup(index)
    write(HEAD + 0x2E, "B", 1)
    write(HEAD + 0x6D, "B", read(HEAD + 0x6D, "B") | 2)
    invoke(0x4FB270, HEAD)
    expected = [token for _, token, _ in links(heads[index])]
    assert clone_sources == expected
    assert deletions == [*expected, index + 1]
    assert read(HEAD + 0x6B, "b") == 0
    return {
        "cloneNativeUnitIds": clone_sources.copy(),
        "allocations": allocations.copy(),
        "deletedNativeUnitIds": deletions.copy(),
        "remainingUses": read(HEAD + 0x6B, "b"),
    }


completion = {str(index): complete(index) for index in (322, 124, 325, 330)}

# An interrupted in-progress visit clears transient work but consumes nothing.
setup(322)
write(HEAD + 0x6D, "B", read(HEAD + 0x6D, "B") | 1)
write(HEAD + 0x6E, "B", 1)
write(HEAD + 0x86, "hhhh", 2, 1, 0, 0)
write(HEAD + 0x96, "i", 1234)
invoke(0x4FB270, HEAD)
cancel = {
    "remainingUses": read(HEAD + 0x6B, "b"),
    "work": read(HEAD + 0x96, "i"),
    "worshipCounts": list(struct.unpack("<hhhh", cpu.mem_read(HEAD + 0x86, 8))),
    "deletions": deletions.copy(),
}
assert cancel == {"remainingUses": 1, "work": 0, "worshipCounts": [0, 0, 0, 0], "deletions": []}

# Run the real command dispatcher: DO 1127 is case 99 after subtracting 0x404.
cpu.mem_write(PROGRAM, bytes(0x4000))
cpu.mem_write(COMMAND, struct.pack("<HH", 1006, 1127))
write(PROGRAM + 0x3104, "I", COMMAND)
write(HEAD + 0x596, "I", 0x123)
assert invoke(0x48CC60, HEAD, PROGRAM) == 1
startup = {
    "flagsBefore": "0x123",
    "flagsAfter": hex(read(HEAD + 0x596)),
    "programAdvanceBytes": read(PROGRAM + 0x3104) - COMMAND,
}
assert startup == {"flagsBefore": "0x123", "flagsAfter": "0x8123", "programAdvanceBytes": 4}

result = {
    "provenance": {"hashes": hashes, "nativeIdentity": identity},
    "scriptWords207Through217": codes[207:218],
    "topology": decoded,
    "completion": completion,
    "cancel": cancel,
    "opcode1127": startup,
    "interceptedLeaves": [
        "004ed8a0 allocation",
        "004ef180/004edcf0 deletion",
        "004ede10 template copy",
        "004ed700 first processing",
        "004fbd20 worship presentation",
        "004fc290 shared-reference result after full graph scan",
    ],
    "executedNative": ["00485b00", "004fb270", "0048cc60", "004f2aa0"],
}
if args.output:
    args.output.write_text(json.dumps(result, indent=2) + "\n")
print("PASS: Mission 20 four-stage linked chain, interruption reset, and startup opcode 1127")
