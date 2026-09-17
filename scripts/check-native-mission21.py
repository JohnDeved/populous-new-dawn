#!/usr/bin/env python3
"""Non-recording native probe for Mission 21's first fault pair."""

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
from decomp import configure_native_constants, native_cpu  # noqa: E402

EXPECTED = {
    "d3dpoptb.exe": "3a5065c7420b3fcde208bf220bc86dfbac95e025ab2492caf9c7ea5308dfbe4f",
    "levl2021.dat": "ddb107eaa9c27f8f3ee8012e5d9bd8179b5ffb76ebb357b7351effbab905a4a5",
    "levl2021.hdr": "923672226657a361567a1c8c356945c0226e28b0ab1291885c364cf97332a675",
    "cpscr040.dat": "8619511afaa2bc83a6d0af3ea17900e9a97f48c8e7bc4d03fc36829a5c71ef35",
    "language/lang00.dat": "e826c478746d666a3ea9ea36cb7804d1d226d5f83084230987b1de293066cf7d",
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
    "levl2021.dat": levels / "levl2021.dat",
    "levl2021.hdr": levels / "levl2021.hdr",
    "cpscr040.dat": levels / "cpscr040.dat",
    "language/lang00.dat": exe.parent / "language" / "lang00.dat",
}
hashes = {name: sha(path) for name, path in paths.items()}
assert hashes == EXPECTED, hashes

level = paths["levl2021.dat"].read_bytes()
header = paths["levl2021.hdr"].read_bytes()
script = paths["cpscr040.dat"].read_bytes()
assert len(header) == 616 and list(header[88:90]) == [2, 40]
markers = struct.unpack_from("<256H", header, 100)
codes = list(struct.unpack_from("<4096H", script))
codes = codes[: codes.index(1019) + 1]
fields = list(struct.iter_unpack("<Ii", script[8192:12288]))
spell_mask = struct.unpack_from("<I", header)[0]
assert spell_mask == 0xFFFEDFFD and spell_mask & (1 << 17) and spell_mask & (1 << 15)
assert header[16:52] == bytes(36)
mana_grants = []
stock_grants = []
for index, code in enumerate(codes):
    if code == 1138 and codes[index - 1] == 1006:
        selector, value = codes[index + 1 : index + 3]
        mana_grants.append([index - 1, selector, fields[value][1]])
    if code == 1115 and codes[index - 1] == 1006:
        model, selector = codes[index + 1 : index + 3]
        stock_grants.append([index - 1, fields[model][1], selector])
assert mana_grants == [[353, 1119, 300000], [429, 1119, 16500]]
assert len(stock_grants) == 2 and all(grant[2] == 1119 for grant in stock_grants)


def record(index):
    raw = level[0x14043 + index * 55 : 0x14043 + (index + 1) * 55]
    x, y = struct.unpack_from("<hh", raw, 3)
    return {
        "index": index,
        "model": raw[0],
        "class": raw[1],
        "owner": raw[2],
        "position": [x, y, 0],
        "cell": [(x >> 8) & 0xFE, (y >> 8) & 0xFE],
        "record": raw[:39],
        "settings": list(raw[7:39]) if raw[1] == 6 else None,
    }


objects = {index: record(index) for index in range(2000) if record(index)["class"]}


def links(index):
    settings = objects[index]["settings"]
    tokens = [settings[6 + slot * 2] | settings[7 + slot * 2] << 8 for slot in range(10)]
    return [(slot, token, objects[token - 1]) for slot, token in enumerate(tokens) if token]


def trigger_at(marker):
    packed = markers[marker]
    cell = [packed & 0xFE, (packed >> 8) & 0xFE]
    found = [o["index"] for o in objects.values() if o["class"] == 6 and o["model"] == 6 and o["cell"] == cell]
    assert len(found) == 1, (marker, cell, found)
    return found[0]


flatten_rewards = [
    item["index"]
    for item in objects.values()
    if item["class"] == 6
    and item["model"] == 2
    and item["settings"][:2] == [11, 15]
]
assert flatten_rewards == []
assert [(source["index"], source["class"], source["model"]) for _, _, source in links(46)] == [
    (47, 7, 31)
]
assert objects[46]["settings"][3:5] == [1, 3]
assert objects[46]["settings"][26:28] == [50, 0]
model15_sources = []
for item in objects.values():
    if item["class"] != 6 or item["model"] != 6:
        continue
    for _, _, linked in links(item["index"]):
        if linked["class"] == 7 and linked["model"] == 15:
            model15_sources.append([item["index"], linked["index"]])
assert model15_sources == [[43, 44], [66, 65], [68, 67], [352, 353], [370, 371]]

# Execute the native fresh-tribe initializer with the executable's constants.
fresh_cpu, fresh_identity = native_cpu(exe)
configure_native_constants(fresh_cpu, exe)
fresh_cpu.mem_map(0x2000000, 0x20000)
fresh_stack, fresh_stop = 0x201D000, 0x201E000
fresh_cpu.mem_write(0x89D1C8, bytes(4 * 0xC65))
fresh_cpu.mem_write(0x96070A, bytes(56 * 4))
fresh_cpu.mem_write(0x89C661, struct.pack("<I", 0))
fresh_cpu.mem_write(0x89C6F0, bytes(1))
fresh_cpu.mem_write(fresh_stack, struct.pack("<II", fresh_stop, 0))
fresh_cpu.reg_write(UC_X86_REG_ESP, fresh_stack)
fresh_cpu.emu_start(0x42B660, fresh_stop, timeout=1_000_000, count=1_000_000)
assert fresh_cpu.reg_read(UC_X86_REG_EIP) == fresh_stop
fresh_tribe = 0x89D1C8
fresh_state = {
    "retainedMana": struct.unpack("<i", fresh_cpu.mem_read(fresh_tribe + 0x94D, 4))[0],
    "pendingMana": struct.unpack("<i", fresh_cpu.mem_read(fresh_tribe + 0x951, 4))[0],
    "availableMana": struct.unpack("<i", fresh_cpu.mem_read(fresh_tribe + 0x955, 4))[0],
    "spellProgress": list(struct.unpack("<22i", fresh_cpu.mem_read(fresh_tribe + 0x969, 88))),
    "stocks": list(fresh_cpu.mem_read(0x96071E, 22)),
}
assert fresh_identity["sha256"] == EXPECTED["d3dpoptb.exe"]
assert fresh_state == {
    "retainedMana": 0,
    "pendingMana": 0,
    "availableMana": 30000,
    "spellProgress": [0] * 22,
    "stocks": [0] * 22,
}
flatten_cost = struct.unpack("<i", fresh_cpu.mem_read(0x5A80D4 + 15 * 0x3E, 4))[0]
flatten_cap = fresh_cpu.mem_read(0x5A80FD + 15 * 0x3E, 1)[0]
convert_cost = struct.unpack("<i", fresh_cpu.mem_read(0x5A80D4 + 17 * 0x3E, 4))[0]
assert (flatten_cost, flatten_cap, convert_cost) == (125000, 3, 10000)
assert len([o for o in objects.values() if o["class"] == 1 and o["model"] == 1 and o["owner"] == 255]) == 109
assert len([o for o in objects.values() if o["class"] == 1 and o["model"] == 7 and o["owner"] == 0]) == 1


assert [trigger_at(marker) for marker in (91, 92, 93, 17)] == [362, 363, 364, 68]
expected_links = {
    362: [(354, 79), (355, 79), (360, 79), (361, 79), (357, 79), (356, 79), (358, 79), (359, 79), (365, 79)],
    363: [(52, 75), (51, 75), (50, 75), (49, 75), (48, 75)],
    364: [(9, 85), (8, 85), (7, 85), (6, 85), (5, 85), (4, 85), (3, 85), (2, 85), (1, 85), (0, 85)],
    68: [(67, 15), (369, 39)],
}
for trigger, expected in expected_links.items():
    assert [(source["index"], source["model"]) for _, _, source in links(trigger)] == expected

# Exact recurring branch: 31-mask, initial visual order, deadline branch and cleanup calls.
assert codes[797:800] == [1005, 175, 1003]
assert fields[175] == (0, 31)
assert codes[882:891] == [1006, 1151, 180, 1006, 1151, 181, 1006, 1151, 182]
assert [fields[index] for index in (180, 181, 182)] == [(0, 91), (0, 92), (0, 93)]
assert codes[896:924] == [
    1000, 1012, 0, 183, 1003, 1006, 1151, 100, 1007, 90, 9, 1006, 1171, 63, 6,
    1006, 1177, 178, 56, 178, 184, 1006, 1180, 1006, 1179, 32, 1004, 1002,
]
assert [fields[index] for index in (183, 100, 90, 63, 6, 178, 56, 184, 32)] == [
    (0, 1950), (0, 17), (1, 22), (0, 40), (0, 130), (0, 126), (0, 34),
    (0, 16018), (0, 256),
]
assert codes[930:935] == [1006, 1199, 141, 178, 39]
assert [fields[index] for index in (141, 178, 39)] == [(0, 36), (0, 126), (0, 5)]
eligible = [turn for turn in range(2100) if ((turn + 1) & 31) == 0]
assert next(turn for turn in eligible if turn > 100) == 127
assert next(turn for turn in eligible if turn > 1950) == 1951
assert next(turn for turn in eligible if turn > 1951) == 1983

# Marker 17 is sampled as one signed height: exact equality remains unsealed.
marker17 = markers[17]
marker17_cell = ((marker17 & 0xFE00) >> 9) * 128 + ((marker17 & 0xFE) >> 1)
baseline = struct.unpack_from("<h", level, marker17_cell * 2)[0]
assert marker17 == 0x7C24 and baseline == 457


def machine(size=0x100000):
    cpu, identity = native_cpu(exe)
    assert identity["sha256"] == EXPECTED["d3dpoptb.exe"]
    cpu.mem_map(0x2000000, size)

    def write(address, fmt, *values):
        cpu.mem_write(address, struct.pack("<" + fmt, *values))

    def read(address, fmt="I"):
        return struct.unpack("<" + fmt, cpu.mem_read(address, struct.calcsize("<" + fmt)))[0]

    def invoke(stack, stop, address, *values):
        write(stack, "I" * (len(values) + 1), stop, *values)
        cpu.reg_write(UC_X86_REG_ESP, stack)
        cpu.emu_start(address, stop, count=2_000_000)
        assert cpu.reg_read(UC_X86_REG_EIP) == stop, hex(cpu.reg_read(UC_X86_REG_EIP))
        return cpu.reg_read(UC_X86_REG_EAX) & 0xFFFFFFFF

    def ret(value=0):
        sp = cpu.reg_read(UC_X86_REG_ESP)
        cpu.reg_write(UC_X86_REG_EAX, value)
        cpu.reg_write(UC_X86_REG_EIP, read(sp))
        cpu.reg_write(UC_X86_REG_ESP, sp + 4)

    return cpu, identity, write, read, invoke, ret


# Execute native GET_HEIGHT_AT_POS for equality and both one-unit boundaries.
height_results = []
for value in (baseline - 1, baseline, baseline + 1, -32768, 32767):
    cpu, _, write, read, invoke, _ = machine()
    tribe, program, stack, stop = 0x2000000, 0x2010000, 0x20FD000, 0x20FE000
    cpu.mem_write(tribe, bytes(0xC65))
    cpu.mem_write(0x89B7A5, header[100:612])
    write(0x8A03E8 + marker17_cell * 16, "h", value)
    blob = bytearray(12552)
    struct.pack_into("<8H", blob, 0, 12, 1003, 1006, 1085, 0, 1, 1004, 1019)
    struct.pack_into("<IiIi", blob, 8192, 0, 17, 1, 0)
    cpu.mem_write(program, bytes(blob))
    assert invoke(stack, stop, 0x48C6B0, tribe, program) == 1
    observed = read(program + 0x3000, "i")
    assert observed == value
    height_results.append({"height": observed, "sealed": observed != baseline})

# Execute opcode 1199 through the original dispatcher and its native square scan.
cpu, identity, write, read, invoke, ret = machine()
program, command, units, stack, stop = 0x2000000, 0x2010000, 0x2020000, 0x20FD000, 0x20FE000
cpu.mem_write(program, script)
write(program + 0x3100, "I", program + 8192)
write(program + 0x3104, "I", command)
write(command, "HHHHH", 1006, 1199, 141, 178, 39)
cpu.mem_write(0x890390, bytes(4096))
cpu.mem_write(0x8A03E4, bytes(0x40000))
cleanup_cases = [
    (1, 7, 85, 26, 116),   # inclusive lower corner
    (2, 7, 79, 46, 136),   # inclusive upper corner
    (3, 7, 75, 36, 126),
    (4, 7, 66, 38, 126),
    (5, 7, 31, 36, 128),   # wrong model survives
    (6, 7, 85, 48, 126),   # one coarse cell outside survives
    (7, 6, 85, 34, 126),   # wrong class survives
]
by_cell = {}
for ident, class_id, model, x, y in cleanup_cases:
    pointer = units + ident * 0x100
    cpu.mem_write(pointer, bytes(0x100))
    write(pointer + 0x24, "H", ident)
    write(pointer + 0x2A, "BB", class_id, model)
    write(pointer + 0x3D, "HH", x << 8, y << 8)
    by_cell.setdefault((x, y), []).append(ident)
    write(0x890390 + ident * 4, "I", pointer)
for (x, y), identifiers in by_cell.items():
    cell = (y >> 1) * 128 + (x >> 1)
    write(0x8A03E4 + cell * 16 + 6, "H", identifiers[0])
    for offset, ident in enumerate(identifiers):
        write(units + ident * 0x100 + 0x20, "H", identifiers[offset + 1] if offset + 1 < len(identifiers) else 0)
deleted = []


def delete_hook(_cpu, _address, _size, _user):
    pointer = read(cpu.reg_read(UC_X86_REG_ESP) + 4)
    deleted.append(read(pointer + 0x24, "H"))
    ret()


cpu.hook_add(UC_HOOK_CODE, delete_hook, begin=0x4EF180, end=0x4EF180)
assert invoke(stack, stop, 0x48CC60, 0, program) == 1
assert read(program + 0x3104) - command == 10
assert deleted == [1, 3, 4, 2], deleted

# Execute native linked completion for the initial visual trio and eruption pair.
cpu, _, write, read, invoke, ret = machine()
head, sources, clones = 0x2000000, 0x2010000, 0x2040000
record_buffer, stack, stop = 0x2080000, 0x20FD000, 0x20FE000
next_clone = 0
allocations, clone_sources, first_processed, deletions = [], [], [], []


def allocation(_cpu, _address, _size, _user):
    global next_clone
    sp = cpu.reg_read(UC_X86_REG_ESP)
    class_id, model, owner, position = struct.unpack("<IIII", cpu.mem_read(sp + 4, 16))
    pointer = clones + next_clone * 0x100
    next_clone += 1
    cpu.mem_write(pointer, bytes(0x100))
    write(pointer + 0x24, "H", 1000 + next_clone)
    write(pointer + 0x2A, "BB", class_id & 255, model & 255)
    write(pointer + 0x2F, "B", owner & 255)
    cpu.mem_write(pointer + 0x3D, bytes(cpu.mem_read(position, 6)))
    allocations.append([class_id & 255, model & 255, owner & 255])
    ret(pointer)


def copy_template(_cpu, _address, _size, _user):
    clone = read(cpu.reg_read(UC_X86_REG_ESP) + 4)
    source = read(cpu.reg_read(UC_X86_REG_ESP) + 8)
    clone_id = read(clone + 0x24, "H")
    cpu.mem_write(clone, bytes(cpu.mem_read(source, 0xB3)))
    write(clone + 0x24, "H", clone_id)
    clone_sources.append(read(source + 0x24, "H"))
    ret()


def first_process(_cpu, _address, _size, _user):
    pointer = read(cpu.reg_read(UC_X86_REG_ESP) + 4)
    first_processed.append([read(pointer + 0x2A, "B"), read(pointer + 0x2B, "B")])
    ret()


def delete_link(_cpu, _address, _size, _user):
    pointer = read(cpu.reg_read(UC_X86_REG_ESP) + 4)
    deletions.append(read(pointer + 0x24, "H"))
    ret()


def ignore(_cpu, _address, _size, _user):
    ret()


for address, callback in (
    (0x4ED8A0, allocation),
    (0x4EDE10, copy_template),
    (0x4ED700, first_process),
    (0x4EF180, delete_link),
    (0x4EDCF0, delete_link),
    (0x4FBD20, ignore),
    (0x4FC290, ignore),
):
    cpu.hook_add(UC_HOOK_CODE, callback, begin=address, end=address)


def install(source, pointer, unit_id):
    cpu.mem_write(pointer, bytes(0x100))
    write(pointer + 0x24, "H", unit_id)
    write(pointer + 0x2A, "BB", source["class"], source["model"])
    write(pointer + 0x2F, "B", source["owner"])
    write(pointer + 0x3D, "hhh", *source["position"])
    cpu.mem_write(record_buffer, source["record"])
    invoke(stack, stop, 0x485B00, pointer, record_buffer)
    write(0x890390 + unit_id * 4, "I", pointer)


activation = {}
for trigger in (362, 363, 364, 68):
    next_clone = 0
    allocations.clear()
    clone_sources.clear()
    first_processed.clear()
    deletions.clear()
    cpu.mem_write(0x890390, bytes(0x4000))
    cpu.mem_write(0x8A03E4, bytes(0x40000))
    install(objects[trigger], head, trigger + 1)
    for offset, (_, token, source) in enumerate(links(trigger)):
        install(source, sources + offset * 0x100, token)
    write(head + 0x2E, "B", 1)
    write(head + 0x6D, "B", read(head + 0x6D, "B") | 2)
    invoke(stack, stop, 0x4FB270, head)
    expected_tokens = [token for _, token, _ in links(trigger)]
    expected_models = [[7, source["model"]] for _, _, source in links(trigger)]
    assert clone_sources == expected_tokens
    assert first_processed == expected_models
    assert deletions == [*expected_tokens, trigger + 1]
    assert read(head + 0x6B, "b") == 0
    activation[str(trigger)] = {
        "sourceIndices": [token - 1 for token in clone_sources],
        "models": [model for _, model in first_processed],
        "deletedNativeUnitIds": deletions.copy(),
        "remainingUses": 0,
    }

messages = json.loads((ROOT / "app/original-messages.json").read_text())["messages"]
result = {
    "provenance": {
        "hashes": hashes,
        "nativeIdentity": identity,
        "executedNative": ["0042b660", "0048c6b0", "00492920", "0048cc60", "00490ba0", "004f1ed0", "00485b00", "004fb270"],
    },
    "mission": {"tribeCount": header[88], "scriptId": header[89], "scriptWords": len(codes)},
    "acquisition": {
        "spellMask": spell_mask,
        "freshState": fresh_state,
        "convertCost": convert_cost,
        "flattenCost": flatten_cost,
        "flattenCap": flatten_cap,
        "flattenRewards": flatten_rewards,
        "scriptManaGrants": mana_grants,
        "scriptStockGrants": stock_grants,
        "firstTotem": {"trigger": 46, "linkedRecord": 47, "required": 3, "target": 50},
        "model15Sources": model15_sources,
    },
    "firstFault": {
        "baselineMarker": 17,
        "markerCell": [marker17 & 0xFE, (marker17 >> 8) & 0xFE],
        "baselineHeight": baseline,
        "heightBoundaries": height_results,
        "scheduler": {"mask": 31, "firstSampleTurn": 127, "deadlinePredicate": "turn > 1950", "eruptionTurn": 1951, "cleanupTurn": 1983},
        "initialForceMarkers": [91, 92, 93],
        "initialTriggers": [362, 363, 364],
        "eruptionMarker": 17,
        "eruptionTrigger": 68,
        "sentinelTrigger": {"index": 46, "cell": [40, 130]},
        "activation": activation,
        "warning": {"message": 126, "text": messages["126"]["text"], "cell": [34, 126], "payload": 16018, "lifetime": 256, "headFlag": "0x200"},
        "sealedMessage": {"message": 10, "text": messages["10"]["text"]},
    },
    "opcode1199": {
        "operands": [36, 126, 5],
        "inclusiveCellBounds": {"x": [26, 46], "y": [116, 136], "step": 2},
        "deletedIds": deleted,
        "survivingIds": [5, 6, 7],
        "models": [66, 75, 79, 85],
        "programAdvanceBytes": 10,
    },
    "interceptedLeaves": [
        "004ed8a0 allocation",
        "004ede10 template copy",
        "004ed700 first processing",
        "004ef180/004edcf0 deletion",
        "004fbd20 worship presentation",
        "004fc290 shared-reference result after authored-graph scan",
    ],
}
if args.output:
    args.output.write_text(json.dumps(result, indent=2) + "\n")
print("PASS: Mission 21 acquisition, first-fault records, schedule, linked order and opcode 1199 cleanup")
