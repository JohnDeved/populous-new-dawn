#!/usr/bin/env python3
"""Non-recording Mission 22 class-6 reward probe.

Executes trigger completion, recipient selection, delayed grant, and the byte-small
mana consumer from the verified executable. Allocation, template copy/deletion,
presentation, reference counting, and person eligibility are explicit intercepts.
"""

import argparse
import hashlib
import json
import struct
import sys
from pathlib import Path

from capstone import CS_ARCH_X86, CS_MODE_32, Cs
from unicorn import UC_HOOK_CODE, UC_HOOK_MEM_WRITE
from unicorn.x86_const import UC_X86_REG_EAX, UC_X86_REG_EDI, UC_X86_REG_EIP, UC_X86_REG_ESI, UC_X86_REG_ESP

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "scripts"))
from decomp import configure_native_constants, native_cpu  # noqa: E402

EXPECTED = {
    "d3dpoptb.exe": "3a5065c7420b3fcde208bf220bc86dfbac95e025ab2492caf9c7ea5308dfbe4f",
    "levl2022.dat": "97fcbf41e1f13d53491fdbfbe8b5950fd94f3301c51c6f61b4725eb0aab30321",
    "levl2022.hdr": "f3d38acb58ab080e7e18b707d6a9aa1a387d4783de1b3236a4bbbba52d5d4245",
    "cpscr064.dat": "741f7a2aa5bdb82f993b0e4cd9692b6b8bf6b4f5b188cb206a1fa9e15565e26c",
    "cpscr065.dat": "dc498e6c0077ee0d15980d60d264a363082d16692a880f8a5f835216cfd01d11",
    "cpscr066.dat": "5373a2d3cb4b965be69a665fa4695da0f351e9db6b6702c38bcf09edb24e0d5a",
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
    "levl2022.dat": levels / "levl2022.dat",
    "levl2022.hdr": levels / "levl2022.hdr",
    "cpscr064.dat": levels / "cpscr064.dat",
    "cpscr065.dat": levels / "cpscr065.dat",
    "cpscr066.dat": levels / "cpscr066.dat",
    "language/lang00.dat": exe.parent / "language" / "lang00.dat",
}
hashes = {name: sha(path) for name, path in paths.items()}
assert hashes == EXPECTED, hashes

level = paths["levl2022.dat"].read_bytes()


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
        "record": raw[:39],
        "settings": list(raw[7:39]) if raw[1] == 6 else None,
    }


objects = {index: record(index) for index in range(2000) if record(index)["class"]}


def links(trigger):
    settings = trigger["settings"]
    values = [settings[6 + slot * 2] | settings[7 + slot * 2] << 8 for slot in range(10)]
    return [(slot, value - 1, objects[value - 1]) for slot, value in enumerate(values) if value]


topology = {}
for trigger_index, source_index, reward_model, amount in (
    (159, 0, 3, 1_000_000),
    (139, 2, 5, 600_000),
):
    trigger = objects[trigger_index]
    source = objects[source_index]
    assert (trigger["class"], trigger["model"], trigger["owner"]) == (6, 6, 0)
    assert [(slot, index) for slot, index, _ in links(trigger)] == [(0, source_index)]
    assert (source["class"], source["model"], source["owner"]) == (6, 2, 255)
    assert source["settings"][:4] == [6, reward_model, 3, 1]
    assert int.from_bytes(source["record"][11:15], "little") == amount
    assert sum(
        linked_index == source_index
        for candidate in objects.values()
        if candidate["class"] == 6 and candidate["model"] == 6
        for _, linked_index, _ in links(candidate)
    ) == 1
    topology[str(trigger_index)] = {
        "trigger": {k: trigger[k] for k in ("index", "class", "model", "owner", "position", "world")},
        "source": {k: source[k] for k in ("index", "class", "model", "owner", "position", "world")},
        "rewardClass": source["settings"][0],
        "rewardModelTag": source["settings"][1],
        "grantMode": source["settings"][2],
        "amount": amount,
    }

stone_trigger = objects[141]
stone_source = objects[162]
stone_scenery = objects[142]
assert (stone_trigger["class"], stone_trigger["model"], stone_trigger["owner"]) == (6, 6, 0)
assert [(slot, index) for slot, index, _ in links(stone_trigger)] == [(0, 162)]
assert (stone_source["class"], stone_source["model"], stone_source["owner"]) == (7, 92, 0)
assert (stone_scenery["class"], stone_scenery["model"], stone_scenery["owner"]) == (5, 9, 255)
assert stone_scenery["position"] == stone_trigger["position"]
assert sum(
    linked_index == 162
    for candidate in objects.values()
    if candidate["class"] == 6 and candidate["model"] == 6
    for _, linked_index, _ in links(candidate)
) == 1
topology["141"] = {
    "trigger": {k: stone_trigger[k] for k in ("index", "class", "model", "owner", "position", "world")},
    "source": {k: stone_source[k] for k in ("index", "class", "model", "owner", "position", "world")},
    "presentationScenery": {
        k: stone_scenery[k] for k in ("index", "class", "model", "owner", "position", "world")
    },
}

vehicles = [
    {k: item[k] for k in ("index", "class", "model", "owner", "position", "world")}
    for item in objects.values()
    if item["class"] == 4
]
assert [(item["index"], item["model"], item["owner"]) for item in vehicles] == [(1, 3, 2), (132, 1, 1)]

cpu, identity = native_cpu(exe)
configure_native_constants(cpu, exe)
cpu.mem_map(0x2000000, 0x100000)
UNIT, RECORD, TEMPLATES, CLONES = 0x2000000, 0x2001000, 0x2002000, 0x2040000
PERSON, STACK, STOP = 0x2080000, 0x20FD000, 0x20FE000
OBJS0 = 0x20E0000


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


events = []
deletions = []
clone_sources = []
next_clone = 0


def allocation(_cpu, _address, _size, _user):
    global next_clone
    sp = cpu.reg_read(UC_X86_REG_ESP)
    class_id, model, owner, position = struct.unpack("<IIII", cpu.mem_read(sp + 4, 16))
    pointer = CLONES + next_clone * 0x100
    next_clone += 1
    cpu.mem_write(pointer, bytes(0x100))
    write(pointer + 0x24, "H", 1000 + next_clone)
    write(pointer + 0x2A, "BBB", class_id & 255, model & 255, owner & 255)
    write(pointer + 0x2F, "B", owner & 255)
    cpu.mem_write(pointer + 0x3D, bytes(cpu.mem_read(position, 6)))
    events.append(["allocate", class_id & 255, model & 255, owner & 255])
    return_from_hook(pointer)


def copy_template(_cpu, _address, _size, _user):
    clone = read(cpu.reg_read(UC_X86_REG_ESP) + 4)
    source = read(cpu.reg_read(UC_X86_REG_ESP) + 8)
    unit_index = read(clone + 0x24, "H")
    cpu.mem_write(clone, bytes(cpu.mem_read(source, 0xB3)))
    write(clone + 0x24, "H", unit_index)
    source_index = read(source + 0x24, "H") - 1
    clone_sources.append(source_index)
    events.append(["copy", source_index])
    return_from_hook()


def process(_cpu, _address, _size, _user):
    events.append(["process", read(cpu.reg_read(UC_X86_REG_ESP) + 4)])
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


def skip_boarding_presentation(_cpu, _address, _size, _user):
    person = cpu.reg_read(UC_X86_REG_EDI)
    vehicle = cpu.reg_read(UC_X86_REG_ESI)
    write(person + 0x9F, "H", read(vehicle + 0x24, "H"))
    cpu.reg_write(UC_X86_REG_EIP, 0x4658E0)


for address, callback in (
    (0x4ED8A0, allocation),
    (0x4EDE10, copy_template),
    (0x4ED700, process),
    (0x4EF180, deletion),
    (0x4FC290, unreferenced),
    (0x48A050, ignore),
    (0x481550, ignore),
    (0x4F62C0, eligible),
    (0x4D4040, ignore),
    (0x4D8250, ignore),
):
    cpu.hook_add(UC_HOOK_CODE, callback, begin=address, end=address)
cpu.hook_add(UC_HOOK_CODE, skip_boarding_presentation, begin=0x46588B, end=0x46588B)


def install_record(item, pointer):
    cpu.mem_write(pointer, bytes(0x100))
    write(pointer + 0x24, "H", item["index"] + 1)
    write(pointer + 0x2A, "BB", item["class"], item["model"])
    write(pointer + 0x2F, "B", item["owner"])
    write(pointer + 0x3D, "hhh", *item["position"])
    cpu.mem_write(RECORD, item["record"])
    invoke(0x485B00, pointer, RECORD)
    write(0x890390 + (item["index"] + 1) * 4, "I", pointer)


def player_state():
    tribe = 0x89D1C8
    return {
        "mana": [read(tribe + offset, "i") for offset in (0x94D, 0x951, 0x955)],
        "spellProgress": bytes(cpu.mem_read(tribe + 0x969, 22 * 4)).hex(),
        "stocks": list(cpu.mem_read(0x96071E, 22)),
        "gameFlags": [read(address) for address in (0x89D17C, 0x89C661)],
        "gameFlagsByte2": read(0x89C662, "B"),
    }


MANA_FIELDS = {
    "retained": (0x94D, "i"),
    "pending": (0x951, "i"),
    "available": (0x955, "i"),
    "totalProgress": (0x959, "i"),
    "previousRate": (0x95D, "i"),
    "estimatedRate": (0x961, "i"),
    "releaseDelay": (0xA05, "H"),
    "releaseRate": (0xA07, "H"),
}
WORLD_FIELDS = {
    "levelFlags2": (0x895DA4, "I"),
    "levelFlags": (0x895DA8, "I"),
    "landFlags": (0x89C661, "I"),
    "loadFlags": (0x89C665, "I"),
    "manaFlags": (0x89C66D, "I"),
    "gameFlags": (0x89D17C, "I"),
    "campaignProgressFlags": (0x9608B2, "B"),
    "campaignTribes": (0x96EAC0, "B"),
}


def seed_all_gameplay_sentinels():
    for tribe_index in range(4):
        tribe = 0x89D1C8 + tribe_index * 0xC65
        for field_index, (offset, fmt) in enumerate(MANA_FIELDS.values()):
            value = 100_000 + tribe_index * 1_000 + field_index
            if fmt == "H":
                value &= 0xFFFF
            write(tribe + offset, fmt, value)
        cpu.mem_write(
            tribe + 0x969,
            b"".join(struct.pack("<i", 200_000 + tribe_index * 1_000 + model) for model in range(22)),
        )
        spell = 0x96070A + tribe_index * 56
        write(spell, "I", 0x00111111 ^ tribe_index)
        write(spell + 16, "I", 0x00222222 ^ tribe_index)
        cpu.mem_write(spell + 20, bytes(((tribe_index * 37 + model) & 255) for model in range(22)))
    for field_index, (address, fmt) in enumerate(WORLD_FIELDS.values()):
        mask = (1 << (struct.calcsize("<" + fmt) * 8)) - 1
        write(address, fmt, (0x5A5A0000 + field_index * 0x101) & mask)


def all_gameplay_state():
    tribes = []
    spells = []
    for tribe_index in range(4):
        tribe = 0x89D1C8 + tribe_index * 0xC65
        tribes.append(
            {
                **{name: read(tribe + offset, fmt) for name, (offset, fmt) in MANA_FIELDS.items()},
                "spellProgress": list(struct.unpack("<22i", cpu.mem_read(tribe + 0x969, 88))),
            }
        )
        spell = 0x96070A + tribe_index * 56
        spells.append(
            {
                "availableMask": read(spell),
                "disabledMask": read(spell + 16),
                "stocks": list(cpu.mem_read(spell + 20, 22)),
            }
        )
    return {
        "tribes": tribes,
        "spells": spells,
        "globalCampaignFlags": {
            name: read(address, fmt) for name, (address, fmt) in WORLD_FIELDS.items()
        },
    }


def complete_trigger(trigger_index):
    global next_clone
    cpu.mem_write(0x890390, bytes(4096))
    next_clone = 0
    events.clear()
    deletions.clear()
    clone_sources.clear()
    trigger = objects[trigger_index]
    source = links(trigger)[0][2]
    install_record(trigger, UNIT)
    install_record(source, TEMPLATES)
    write(UNIT + 0x2E, "B", 1)
    write(UNIT + 0xA0, "B", 0)
    write(UNIT + 0x6D, "B", read(UNIT + 0x6D, "B") | 2)
    write(UNIT + 0x96, "i", 12345)
    write(0x89D17C, "I", 0)
    side_effects_before = None
    if trigger_index == 141:
        tribe = 0x89D1C8
        for offset, value in zip((0x94D, 0x951, 0x955), (111, 222, 333)):
            write(tribe + offset, "i", value)
        cpu.mem_write(tribe + 0x969, b"".join(struct.pack("<I", 1000 + index) for index in range(22)))
        cpu.mem_write(0x96071E, bytes(range(22)))
        write(0x89C661, "I", 0)
        side_effects_before = player_state()
    pre = {hex(offset): read(UNIT + offset, "B") for offset in (0x68, 0x6B, 0x6D, 0x6E, 0x70, 0x71)}
    invoke(0x4FB270, UNIT)
    delay_after_first = read(UNIT + 0x9E, "h")
    for _ in range(50):
        invoke(0x4FB270, UNIT)
    clone = CLONES
    result = {
        "eventOrder": events.copy(),
        "cloneSource": clone_sources.copy(),
        "clone": {
            "class": read(clone + 0x2A, "B"),
            "model": read(clone + 0x2B, "B"),
            "owner": read(clone + 0x2F, "B"),
            "amount": read(clone + 0x70),
            "rewardModelTag": read(clone + 0x74),
            "rewardClass": read(clone + 0x7C, "B"),
            "grantMode": read(clone + 0x80, "B"),
        },
        "deletedOneBasedIndices": deletions.copy(),
        "remaining": read(UNIT + 0x6B, "b"),
        "work": read(UNIT + 0x96, "i"),
        "completionVisits": 51,
        "delayAfterFirst": delay_after_first,
    }
    if trigger_index == 141:
        result["playerStateBefore"] = side_effects_before
        result["playerStateAfter"] = player_state()
    if result["cloneSource"] != [source["index"]]:
        raise AssertionError({"trigger": trigger_index, "source": source["index"], "pre": pre, "result": result})
    if trigger_index == 141:
        assert {key: result["clone"][key] for key in ("class", "model", "owner")} == {
            "class": 7,
            "model": 92,
            "owner": 0,
        }
        assert result["playerStateAfter"] == result["playerStateBefore"]
    else:
        assert result["clone"] == {
            "class": 6,
            "model": 2,
            "owner": 255,
            "amount": topology[str(trigger_index)]["amount"],
            "rewardModelTag": topology[str(trigger_index)]["rewardModelTag"],
            "rewardClass": 6,
            "grantMode": 3,
        }
    assert result["deletedOneBasedIndices"] == [source["index"] + 1, trigger_index + 1]
    assert (result["remaining"], result["work"]) == (0, 0)
    assert result["delayAfterFirst"] == 50
    return result, bytes(cpu.mem_read(clone, 0x100))


completion = {}
clone_images = {}
for trigger_index in (159, 139, 141):
    completion[str(trigger_index)], clone_images[trigger_index] = complete_trigger(trigger_index)


def byte_diffs(before, after, base):
    return [
        {"address": f"{base + offset:08x}", "offset": f"0x{offset:02x}", "before": old, "after": new}
        for offset, (old, new) in enumerate(zip(before, after))
        if old != new
    ]


def stone_presentation_case(completing):
    support = CLONES + 0xC000
    install_record(stone_trigger, UNIT)
    install_record(stone_scenery, support)
    # Model-9 scenery looks up only the selected object's morph byte through the
    # runtime OBJS0 pointer. Supply that asset-table leaf; object selection itself
    # and all state writes remain native.
    cpu.mem_write(OBJS0, bytes(0x1000))
    write(OBJS0 + 8 * 54 + 7, "B", 0x2A)
    write(0x895EC1, "I", OBJS0)
    assert read(UNIT + 0x68, "B") == 3
    seed_all_gameplay_sentinels()
    gameplay_before = all_gameplay_state()
    head_before = bytes(cpu.mem_read(UNIT, 0x100))
    support_before = bytes(cpu.mem_read(support, 0x100))
    memory_writes = []

    def capture_write(_cpu, _access, address, size, value, _user):
        if not (STACK - 0x1000 <= address < STACK + 0x1000):
            memory_writes.append(
                {"address": f"{address:08x}", "size": size, "value": value & ((1 << (size * 8)) - 1)}
            )

    handle = cpu.hook_add(UC_HOOK_MEM_WRITE, capture_write)
    try:
        try:
            invoke(0x4FBD20, UNIT, support, 1 if completing else 0, 0 if completing else 1)
        except Exception as error:
            raise RuntimeError(
                {"phase": "completion" if completing else "post-load", "eip": hex(cpu.reg_read(UC_X86_REG_EIP))}
            ) from error
    finally:
        cpu.hook_del(handle)
    gameplay_after = all_gameplay_state()
    assert gameplay_after == gameplay_before
    head_after = bytes(cpu.mem_read(UNIT, 0x100))
    support_after = bytes(cpu.mem_read(support, 0x100))
    assert head_after == head_before
    return {
        "call": ["trigger141", "object142", 1 if completing else 0, 0 if completing else 1],
        "gameplayStateUnchanged": True,
        "gameplaySentinels": gameplay_before,
        "headDiff": byte_diffs(head_before, head_after, UNIT),
        "sceneryDiff": byte_diffs(support_before, support_after, support),
        "nonStackWriteAddresses": sorted(set(item["address"] for item in memory_writes)),
        "memoryWrites": memory_writes,
    }


head_presentation = {
    "initialPostLoad": stone_presentation_case(False),
    "completion": stone_presentation_case(True),
}
assert head_presentation["initialPostLoad"]["headDiff"] == []
assert head_presentation["completion"]["headDiff"] == []
unexpected_head_writes = [
    address
    for phase in head_presentation.values()
    for address in phase["nonStackWriteAddresses"]
    if int(address, 16) not in range(CLONES + 0xC000, CLONES + 0xC100)
]
assert unexpected_head_writes == [], unexpected_head_writes

model92_clone = CLONES
model92_before = bytes(cpu.mem_read(model92_clone, 0x100))
model92_player_before = player_state()
assert bytes(cpu.mem_read(0x479CD0, 1)) == bytes([0xC3])
invoke(0x479CD0, model92_clone)
assert read(model92_clone + 0x2C, "B") == 0
invoke(0x50A750, model92_clone)
assert bytes(cpu.mem_read(model92_clone, 0x100)) == model92_before
assert player_state() == model92_player_before
model92_noop = {
    "initializerLeaf": {"address": "00479cd0", "bytes": "c3"},
    "processor": {"address": "0050a750", "state": 0, "dispatch": "no matching case"},
    "cloneAndPlayerStateUnchanged": True,
}


def recipient_case(trigger_index, team):
    clone = CLONES + 0x8000
    cpu.mem_write(clone, clone_images[trigger_index])
    write(clone + 0x24, "H", 1200 + team)
    write(clone + 0x2D, "B", 1)
    write(clone + 0x78, "H", 0)
    write(clone + 0x7A, "h", 0)
    write(clone + 0x7E, "B", 255)
    write(clone + 0x7F, "B", 0)
    cpu.mem_write(PERSON, bytes(0x100))
    write(PERSON + 0x24, "H", 1)
    write(PERSON + 0x2A, "BB", 1, 7)
    write(PERSON + 0x2F, "B", team)
    write(0x890390 + 4, "I", PERSON)
    x, y = struct.unpack("<HH", cpu.mem_read(clone + 0x3D, 4))
    packed = ((x >> 8) & 0xFE) | (((y >> 8) & 0xFE) << 8)
    word_index = (((packed & 0xFE) * 2 | packed & 0xFE00) * 2)
    write(0x8A03EA + word_index * 2, "H", 1)
    invoke(0x4FACF0, clone)
    result = {
        "personTeam": team,
        "cloneOwner": read(clone + 0x2F, "B"),
        "recipient": read(clone + 0x7E, "B"),
        "timer": read(clone + 0x7A, "h"),
        "phase": read(clone + 0x7F, "B"),
    }
    expected = {"personTeam": team, "cloneOwner": 255, "recipient": team, "timer": 82, "phase": 1}
    if result != expected:
        raise AssertionError({"trigger": trigger_index, "result": result, "expected": expected, "packed": hex(packed), "wordIndex": hex(word_index)})
    return result, clone


recipients = {str(team): recipient_case(139, team)[0] for team in (0, 2)}


def delayed_grant_case(trigger_index):
    recipient, gift = recipient_case(trigger_index, 0)
    tribe = 0x89D1C8
    write(tribe + 0x951, "i", 123)
    write(tribe + 0x990, "H", 0x7777)
    write(tribe + 0xA05, "H", 0)
    write(0x89C661, "B", 0)
    deletions.clear()
    for _ in range(81):
        invoke(0x4FACF0, gift)
    before_final = {
        "timer": read(gift + 0x7A, "h"),
        "pendingMana": read(tribe + 0x951, "i"),
        "unrelatedSentinel": read(tribe + 0x990, "H"),
    }
    invoke(0x4FACF0, gift)
    after_final = {
        "timer": read(gift + 0x7A, "h"),
        "pendingMana": read(tribe + 0x951, "i"),
        "manaPresentationTimerAfterCallerClear": read(tribe + 0xA05, "H"),
        "unrelatedSentinel": read(tribe + 0x990, "H"),
        "deletedUnit": deletions[-1],
    }
    assert before_final == {"timer": 1, "pendingMana": 123, "unrelatedSentinel": 0x7777}
    expected_after_final = {
        "timer": 0,
        "pendingMana": topology[str(trigger_index)]["amount"] + 123,
        "manaPresentationTimerAfterCallerClear": 0,
        "unrelatedSentinel": 0x7777,
        "deletedUnit": 1200,
    }
    if after_final != expected_after_final:
        raise AssertionError({"trigger": trigger_index, "afterFinal": after_final, "expected": expected_after_final})
    return {"recipient": recipient, "beforeFinal": before_final, "afterFinal": after_final}


countdown = {str(trigger_index): delayed_grant_case(trigger_index) for trigger_index in (159, 139)}

mana_bytes = bytes(cpu.mem_read(0x41A500, 0x38))
assert mana_bytes.hex() == (
    "0fbe4424048bc88d14808d04518d14c08d04d18b54240801948119db8900"
    "8d8c81c8d18900f60561c6890008750a66c781050a0000e803c3"
)
disassembler = Cs(CS_ARCH_X86, CS_MODE_32)
mana_disassembly = [
    f"{instruction.address:08x}: {instruction.mnemonic} {instruction.op_str}".rstrip()
    for instruction in disassembler.disasm(mana_bytes, 0x41A500)
]

head_presentation_bytes = bytes(cpu.mem_read(0x4FBD20, 0x220))
head_presentation_disassembly = [
    f"{instruction.address:08x}: {instruction.mnemonic} {instruction.op_str}".rstrip()
    for instruction in disassembler.disasm(head_presentation_bytes, 0x4FBD20)
]
head_presentation_calls = sorted(
    {
        instruction.split()[-1]
        for instruction in head_presentation_disassembly
        if ": call " in instruction
    }
)
assert head_presentation_calls == ["0x40cb90", "0x40cbb0", "0x40cbf0", "0x4a66c0"]

# Boarding is separate from the gifts: the first passenger claims any empty vehicle.
board_person = CLONES + 0xA000
board_vehicle = CLONES + 0xA100
cpu.mem_write(board_person, bytes(0x100))
cpu.mem_write(board_vehicle, bytes(0x100))
write(board_person + 0x24, "H", 1700)
write(board_person + 0x2A, "BB", 1, 7)
write(board_person + 0x2F, "B", 0)
write(board_vehicle + 0x24, "H", 1701)
write(board_vehicle + 0x2A, "BB", 4, 1)
write(board_vehicle + 0x2F, "B", 1)
try:
    board_return = invoke(0x4657D0, board_person, board_vehicle) & 0xFF
except Exception as error:
    raise RuntimeError({"boardingEip": hex(cpu.reg_read(UC_X86_REG_EIP))}) from error
boarding = {
    "return": board_return,
    "oldOwner": 1,
    "newOwner": read(board_vehicle + 0x2F, "B"),
    "passengerCount": read(board_vehicle + 0x9E, "B"),
    "passenger0": read(board_vehicle + 0x7A, "H"),
    "personVehicle": read(board_person + 0x9F, "H"),
}
assert boarding == {
    "return": 1,
    "oldOwner": 1,
    "newOwner": 0,
    "passengerCount": 1,
    "passenger0": 1700,
    "personVehicle": 1701,
}

# Authored vehicles receive their signed life word from the shipped descriptor
# in 00463ba0. Supply only terrain/list leaves that are irrelevant to that copy,
# then execute the complete 00463cb0 countdown for the exact Mission 22 records.
vehicle_init_leaves = []


def vehicle_init_leaf(_cpu, address, _size, _user):
    vehicle_init_leaves.append(f"{address:08x}")
    return_from_hook(0)


for address in (0x464AE0, 0x4EE470, 0x44E940):
    cpu.hook_add(UC_HOOK_CODE, vehicle_init_leaf, begin=address, end=address)

vehicle_state_transitions = []


def vehicle_state_init(_cpu, _address, _size, _user):
    vehicle_state_transitions.append(read(CLONES + 0xE000 + 0x2C, "B"))
    return_from_hook()


cpu.hook_add(UC_HOOK_CODE, ignore, begin=0x4ED6F0, end=0x4ED6F0)
cpu.hook_add(UC_HOOK_CODE, vehicle_state_init, begin=0x4ED640, end=0x4ED640)


def authored_vehicle_lifetime_case(object_index):
    vehicle = CLONES + 0xE000
    item = objects[object_index]
    assert item["class"] == 4 and item["model"] in (1, 3)
    install_record(item, vehicle)
    write(vehicle + 0x2C, "B", 1)
    vehicle_init_leaves.clear()
    invoke(0x463BA0, vehicle)
    initialized_life = read(vehicle + 0x98, "h")
    descriptor_life = read(0x5A7938 + item["model"] * 23, "h")
    assert initialized_life == descriptor_life == 5000

    # The control flag suppresses unrelated shore/navigation state selection;
    # it is downstream of, and does not gate, the unconditional life decrement.
    write(vehicle + 0x92, "I", read(vehicle + 0x92) | 0x20000)
    write(vehicle + 0x5F, "h", 0)
    write(vehicle + 0x9E, "B", 0)
    vehicle_state_transitions.clear()
    invoke(0x463CB0, vehicle)
    after_first_empty_pass = read(vehicle + 0x98, "h")
    for _ in range(4999):
        invoke(0x463CB0, vehicle)
    expected_state = 5 if item["model"] == 1 else 6
    empty_boundary = {
        "life": read(vehicle + 0x98, "h"),
        "state": read(vehicle + 0x2C, "B"),
        "stateInitializers": vehicle_state_transitions.copy(),
    }
    assert after_first_empty_pass == 4999
    assert empty_boundary == {"life": 0, "state": expected_state, "stateInitializers": [expected_state]}

    # Any passenger or nonzero speed refreshes a still-positive life word to
    # the descriptor value after that visit's decrement.
    write(vehicle + 0x2C, "B", 1)
    write(vehicle + 0x98, "h", 4999)
    write(vehicle + 0x9E, "B", 1)
    invoke(0x463CB0, vehicle)
    occupied_refresh = read(vehicle + 0x98, "h")
    write(vehicle + 0x9E, "B", 0)
    write(vehicle + 0x98, "h", 4999)
    write(vehicle + 0x5F, "h", 1)
    invoke(0x463CB0, vehicle)
    moving_refresh = read(vehicle + 0x98, "h")
    assert occupied_refresh == moving_refresh == 5000
    return {
        "object": {k: item[k] for k in ("index", "class", "model", "owner", "position", "world")},
        "lifeField": "+0x98 signed word",
        "descriptorAddress": f"{0x5A7938 + item['model'] * 23:08x}",
        "descriptorLife": descriptor_life,
        "initializedLife": initialized_life,
        "initializer": "00463ba0",
        "initializerSuppliedLeaves": sorted(set(vehicle_init_leaves)),
        "idleConsumer": "00463cb0",
        "afterFirstEmptyPass": after_first_empty_pass,
        "emptyPassesToDestructionState": 5000,
        "emptyBoundary": empty_boundary,
        "occupiedPositiveLifeRefresh": occupied_refresh,
        "movingPositiveLifeRefresh": moving_refresh,
    }


authored_vehicle_lifetime = {
    "balloonObject1": authored_vehicle_lifetime_case(1),
    "boatObject132": authored_vehicle_lifetime_case(132),
}

result = {
    "provenance": {
        "identity": identity,
        "hashes": hashes,
        "python": sys.version.split()[0],
    },
    "topology": topology,
    "authoredVehicles": vehicles,
    "completion": completion,
    "recipientSelection": recipients,
    "countdown": countdown,
    "manaConsumer": {
        "address": "0041a500",
        "bytesSha256": hashlib.sha256(mana_bytes).hexdigest(),
        "disassembly": mana_disassembly,
    },
    "model92Noop": model92_noop,
    "headPresentation004fbd20": {
        "address": "004fbd20",
        "length": len(head_presentation_bytes),
        "bytesSha256": hashlib.sha256(head_presentation_bytes).hexdigest(),
        "directCallTargets": head_presentation_calls,
        "cases": head_presentation,
    },
    "separateBoardingOwnership": boarding,
    "authoredVehicleLifetime": authored_vehicle_lifetime,
    "intercepts": {
        "004ed8a0": "allocation storage supplied; requested class/model/owner/position recorded",
        "004ede10": "template copy supplied byte-for-byte while preserving allocated unit index",
        "004ed700": "immediate first processing recorded, then 004facf0 replayed directly",
        "004ef180": "deletions recorded without mutating global lists",
        "004fbd20": "executed with the authored model-9 scenery for both post-load and completion variants",
        "004fc290": "unique-reference result supplied after complete raw-level reference scan",
        "0048a050/00481550": "audio/player presentation suppressed",
        "004f62c0": "person eligibility supplied true; cell list and person team supplied",
        "004d4040/004d8250": "boarding animation/state presentation suppressed",
        "00464ae0/004ee470/0044e940": "vehicle terrain/list initialization supplied; 00463ba0 life copy executed",
        "004ed6f0/004ed640": "vehicle destruction cleanup/state initializer supplied and transition recorded",
    },
}

if args.output:
    args.output.write_text(json.dumps(result, indent=2) + "\n")
print(
    "PASS: Mission 22 rewards, trigger-141 presentation, and authored vehicle 5000-pass lifetimes verified"
)
