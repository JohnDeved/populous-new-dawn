"""Probe Mission 14 linked rewards and the generic model-13 spell path.

Usage:
  .tools/decomp/oracle/bin/python scripts/check-native-mission14-rewards.py \
    /path/to/d3dpoptb.exe

The level links are decoded from the supplied Mission 14 level. Native trigger
completion, delayed stock grants, target validation, spell allocation, projectile
launch, impact-effect allocation, and Angel payload allocation execute in Unicorn.
Allocation/free, presentation, UI, and object-copy leaves are intercepted.
"""
import argparse
import hashlib
import json
import struct
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "scripts"))
from decomp import configure_native_constants, native_cpu  # noqa: E402
from unicorn import UC_HOOK_CODE  # noqa: E402
from unicorn.x86_const import UC_X86_REG_EAX, UC_X86_REG_EIP, UC_X86_REG_ESP  # noqa: E402

parser = argparse.ArgumentParser()
parser.add_argument("exe", type=Path)
parser.add_argument("--output", type=Path)
args = parser.parse_args()
EXE = args.exe.resolve()
LEVEL = EXE.parent / "levels" / "levl2014.dat"
CONSTANTS = EXE.parent / "levels" / "constant.dat"
EXPECTED = {
    "d3dpoptb.exe": "3a5065c7420b3fcde208bf220bc86dfbac95e025ab2492caf9c7ea5308dfbe4f",
    "levl2014.dat": "bf8c5dc2f80dcb30dfc4de7764c6883ba007aa410ee674a95f452c3927e4bdcc",
    "constant.dat": "e905e513c798171d5540082565b8addc9f54e5851006b56e8d1976687ba42f24",
}
PATHS = {"d3dpoptb.exe": EXE, "levl2014.dat": LEVEL, "constant.dat": CONSTANTS}
hashes = {name: hashlib.sha256(path.read_bytes()).hexdigest() for name, path in PATHS.items()}
assert hashes == EXPECTED, hashes


def level_records():
    data = LEVEL.read_bytes()
    for index in range(2000):
        raw = data[0x14043 + index * 55 : 0x14043 + (index + 1) * 55]
        if len(raw) != 55 or raw[1] == 0:
            continue
        x, y = struct.unpack_from("<hh", raw, 3)
        yield {
            "index": index,
            "model": raw[0],
            "class": raw[1],
            "owner": raw[2],
            "position": [x, y, 0],
            "world": [x / 256 - 8, -y / 256 - 8],
            "record": raw[:39],
            "settings": list(raw[7:39]) if raw[1] == 6 else None,
        }


objects = {record["index"]: record for record in level_records()}


def linked(trigger):
    settings = trigger["settings"]
    one_based = [settings[6 + offset * 2] | settings[7 + offset * 2] << 8 for offset in range(10)]
    return [(slot, value - 1, objects[value - 1]) for slot, value in enumerate(one_based) if value]


decoded = {}
reference_counts = {}
for index in (48, 55):
    trigger = objects[index]
    decoded[str(index)] = {
        "position": trigger["world"],
        "remaining": trigger["settings"][3],
        "ownershipMode": trigger["settings"][29],
        "links": [
            {
                "slot": slot,
                "oneBased": linked_index + 1,
                "index": linked_index,
                "class": record["class"],
                "model": record["model"],
                "owner": record["owner"],
                "position": record["world"],
                "reward": record["settings"][:4] if record["settings"] else None,
            }
            for slot, linked_index, record in linked(trigger)
        ],
    }
    for _, linked_index, _ in linked(trigger):
        reference_counts[str(linked_index)] = sum(
            1
            for candidate in objects.values()
            if candidate["class"] == 6 and candidate["model"] == 6
            for _, candidate_index, _ in linked(candidate)
            if candidate_index == linked_index
        )

assert [(x["slot"], x["index"]) for x in decoded["48"]["links"]] == [(1, 47), (2, 2)]
assert [(x["slot"], x["index"]) for x in decoded["55"]["links"]] == [
    (0, 54), (2, 53), (3, 50), (5, 52), (6, 51)
]
assert decoded["48"]["links"][0]["reward"][:2] == [11, 13]
assert [x["reward"][:2] for x in decoded["55"]["links"] if x["reward"]] == [[11, 14], [11, 12]]
assert set(reference_counts.values()) == {1}

cpu, identity = native_cpu(EXE)
configure_native_constants(cpu, EXE)
cpu.mem_map(0x2000000, 0x100000)
UNIT, RECORD, TEMPLATES, CLONES = 0x2000000, 0x2001000, 0x2002000, 0x2040000
SHAMAN, SPELL, STACK, STOP = 0x2080000, 0x2081000, 0x20FD000, 0x20FE000


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


allocations = []
deletions = []
sounds = []
clone_sources = []
next_clone = 0
fail_alloc = False


def allocation(_cpu, _address, _size, _user):
    global next_clone
    sp = cpu.reg_read(UC_X86_REG_ESP)
    class_id, model, owner, position = struct.unpack("<IIII", cpu.mem_read(sp + 4, 16))
    if fail_alloc:
        allocations.append({
            "class": class_id & 255,
            "model": model & 255,
            "owner": owner & 255,
            "position": list(struct.unpack("<hhh", cpu.mem_read(position, 6))),
            "failed": True,
        })
        return_from_hook(0)
        return
    pointer = CLONES + next_clone * 0x100
    unit_index = 1000 + next_clone
    next_clone += 1
    cpu.mem_write(pointer, bytes(0x100))
    write(pointer + 0x24, "H", unit_index)
    write(pointer + 0x2A, "BBB", class_id & 255, model & 255, 0)
    write(pointer + 0x2F, "B", owner & 255)
    cpu.mem_write(pointer + 0x3D, bytes(cpu.mem_read(position, 6)))
    write(0x890390 + unit_index * 4, "I", pointer)
    allocations.append({
        "class": class_id & 255,
        "model": model & 255,
        "owner": owner & 255,
        "position": list(struct.unpack("<hhh", cpu.mem_read(position, 6))),
        "pointer": pointer,
        "unitIndex": unit_index,
    })
    return_from_hook(pointer)


def deletion(_cpu, _address, _size, _user):
    pointer = read(cpu.reg_read(UC_X86_REG_ESP) + 4)
    deletions.append(read(pointer + 0x24, "H"))
    write(pointer + 0xC, "I", read(pointer + 0xC) | 1)
    return_from_hook()


def sound(_cpu, _address, _size, _user):
    sp = cpu.reg_read(UC_X86_REG_ESP)
    sounds.append({"source": read(sp + 4), "cue": read(sp + 8) & 0xFFFF, "mode": read(sp + 12)})
    return_from_hook()


def copy_template(_cpu, _address, _size, _user):
    clone = read(cpu.reg_read(UC_X86_REG_ESP) + 4)
    source = read(cpu.reg_read(UC_X86_REG_ESP) + 8)
    unit_index = read(clone + 0x24, "H")
    cpu.mem_write(clone, bytes(cpu.mem_read(source, 0xB3)))
    write(clone + 0x24, "H", unit_index)
    clone_sources.append(read(source + 0x24, "H") - 1)
    return_from_hook()


def ignore(_cpu, _address, _size, _user):
    return_from_hook()


def unreferenced(_cpu, _address, _size, _user):
    return_from_hook(0)


for address, callback in [
    (0x4ED8A0, allocation),
    (0x4EF180, deletion),
    (0x4EDCF0, deletion),
    (0x48A050, sound),
    (0x4EDE10, copy_template),
    (0x4ED700, ignore),
    (0x4FBD20, ignore),
    (0x4FC290, unreferenced),
]:
    cpu.hook_add(UC_HOOK_CODE, callback, begin=address, end=address)


def install_record(record, pointer):
    cpu.mem_write(pointer, bytes(0x100))
    write(pointer + 0x24, "H", record["index"] + 1)
    write(pointer + 0x2A, "BB", record["class"], record["model"])
    write(pointer + 0x2F, "B", record["owner"])
    write(pointer + 0x3D, "hhh", *record["position"])
    cpu.mem_write(RECORD, record["record"])
    invoke(0x485B00, pointer, RECORD)
    write(0x890390 + (record["index"] + 1) * 4, "I", pointer)


def complete_trigger(index):
    global next_clone
    cpu.mem_write(0x890390, bytes(4096))
    cpu.mem_write(0x8A03E4, bytes(0x40000))
    next_clone = 0
    allocations.clear()
    deletions.clear()
    clone_sources.clear()
    trigger = objects[index]
    install_record(trigger, UNIT)
    for offset, (_, linked_index, record) in enumerate(linked(trigger)):
        install_record(record, TEMPLATES + offset * 0x100)
    write(UNIT + 0x2E, "B", 1)  # Skip the quarter-turn worship scan; preserve Blue winner.
    write(UNIT + 0xA0, "B", 0)
    write(UNIT + 0x6D, "B", read(UNIT + 0x6D, "B") | 2)  # Native forced-completion flag.
    write(UNIT + 0x96, "i", 12345)
    before = bytes(cpu.mem_read(UNIT + 0x68, 0x3D))
    invoke(0x4FB270, UNIT)
    after = bytes(cpu.mem_read(UNIT + 0x68, 0x3D))
    result = {
        "cloneOrder": clone_sources.copy(),
        "allocations": [{k: v for k, v in item.items() if k not in ("pointer", "unitIndex")} for item in allocations],
        "cloneState": [
            {
                "sourceIndex": source,
                "class": read(pointer + 0x2A, "B"),
                "model": read(pointer + 0x2B, "B"),
                "owner": read(pointer + 0x2F, "B"),
                "rewardClass": read(pointer + 0x7C, "B"),
                "rewardModel": read(pointer + 0x74),
                "recipient": read(pointer + 0x7E, "B"),
                "timer": read(pointer + 0x7A, "h"),
                "phase": read(pointer + 0x7F, "B"),
                "grantMode": read(pointer + 0x80, "B"),
            }
            for source, pointer in zip(clone_sources, [item["pointer"] for item in allocations])
        ],
        "deletedOneBasedIndices": deletions.copy(),
        "remaining": read(UNIT + 0x6B, "b"),
        "work": read(UNIT + 0x96, "i"),
        "enabled": bool(read(UNIT + 0x6D, "B") & 1),
        "triggerDeleted": index + 1 in deletions,
        "changedOffsets": [hex(0x68 + i) for i, (a, b) in enumerate(zip(before, after)) if a != b],
    }
    return result, [item["pointer"] for item in allocations]


completion = {}
gift_clones = []
for trigger_index in (48, 55):
    result, pointers = complete_trigger(trigger_index)
    completion[str(trigger_index)] = result
    gift_clones.extend(pointer for pointer in pointers if read(pointer + 0x2A, "B") == 6 and read(pointer + 0x2B, "B") == 2)

assert completion["48"]["cloneOrder"] == [47, 2]
assert completion["55"]["cloneOrder"] == [54, 53, 50, 52, 51]
assert completion["48"]["remaining"] == completion["55"]["remaining"] == 0
assert completion["48"]["work"] == completion["55"]["work"] == 0
assert completion["48"]["triggerDeleted"] and completion["55"]["triggerDeleted"]


def stock_case(model, stock):
    gift = 0x2090000
    cpu.mem_write(gift, bytes(0x100))
    write(gift + 0x2A, "BBBB", 6, 2, 0, 1)
    write(gift + 0x7A, "hBBBB", 1, 11, 0, 0, 1)
    write(gift + 0x74, "I", model)
    write(gift + 0x7E, "B", 0)
    write(gift + 0x80, "B", 3)
    write(0x89C6F0, "b", -1)
    write(0x96071E + model, "B", stock)
    before = read(0x96071E + model, "B")
    invoke(0x4FACF0, gift)
    after = read(0x96071E + model, "B")
    return {"before": before, "after": after, "shots": after & 15, "gifts": after >> 4}


limits = {model: read(0x5A80FD + model * 62, "B") for model in (12, 13, 14)}
stocks = {
    str(model): [stock_case(model, stock) for stock in (0, limits[model] - 1, limits[model], 0xFF)]
    for model in (12, 13, 14)
}
assert limits == {12: 4, 13: 1, 14: 2}
for model, cases in stocks.items():
    cap = limits[int(model)]
    assert [(case["shots"], case["gifts"]) for case in cases] == [
        (1, 1), (cap, 1), (cap, 1), (15, 15)
    ]


def delayed_stock_case(model):
    gift = 0x2090000
    cpu.mem_write(gift, bytes(0x100))
    write(gift + 0x2A, "BBBB", 6, 2, 0, 1)
    write(gift + 0x7A, "hBBBB", 82, 11, 0, 0, 6)
    write(gift + 0x74, "I", model)
    write(gift + 0x7E, "B", 0)
    write(gift + 0x80, "B", 3)
    write(0x89C6F0, "b", -1)
    write(0x96071E + model, "B", 0)
    for _ in range(81):
        invoke(0x4FACF0, gift)
    before_final = read(0x96071E + model, "B")
    invoke(0x4FACF0, gift)
    return {"beforeFinalVisit": before_final, "afterFinalVisit": read(0x96071E + model, "B")}


delayed_stocks = {str(model): delayed_stock_case(model) for model in (12, 13, 14)}
assert delayed_stocks == {
    "12": {"beforeFinalVisit": 0, "afterFinalVisit": 0x11},
    "13": {"beforeFinalVisit": 0, "afterFinalVisit": 0x11},
    "14": {"beforeFinalVisit": 0, "afterFinalVisit": 0x11},
}

# Generic model-13 target legality: ordinary ground and water are both accepted;
# only model 12 has the later terrain-category rejection branch in 004c24f0.
tribe = 0x89D1C8
cpu.mem_write(tribe, bytes(0xC65))
cpu.mem_write(SHAMAN, bytes(0x100))
write(0x89C6F0, "b", 0)
write(tribe + 0x89D, "I", SHAMAN)
write(tribe + 0xC1F, "B", 1)
write(SHAMAN + 0x2A, "BBB", 1, 7, 0)
write(SHAMAN + 0x2F, "B", 0)
write(SHAMAN + 0x3D, "HHh", 0x4000, 0x4000, 320)
target = 0x2091000
write(target, "HH", 0x4400, 0x4000)
write(0x89D17C, "I", 0)
target_results = {}
for category in (0, 1):
    cell = (((0x4000 >> 9) * 128 + (0x4400 >> 9)) * 16)
    write(0x8A03E4 + cell + 12, "B", category)
    target_results["water" if category else "ground"] = invoke(0x4C24F0, 0, 0, 13, target, 0)
write(target, "HH", 0x7000, 0x4000)
target_results["outOfRange"] = invoke(0x4C24F0, 0, 0, 13, target, 0)
write(tribe + 0x89D, "I", 0)
write(target, "HH", 0x4400, 0x4000)
target_results["missingShaman"] = invoke(0x4C24F0, 0, 0, 13, target, 0)
write(tribe + 0x89D, "I", SHAMAN)
assert target_results == {
    "ground": 1, "water": 1, "outOfRange": 0xFFFFFFFE, "missingShaman": 0xFFFFFFFF
}

# Gifted-shot allocation consumes the low nibble before allocating class 11/model 13.
allocations.clear()
sounds.clear()
next_clone = 0
write(tribe + 0xC22, "B", 0)
write(0x96071E + 13, "B", 0x11)
write(0x892443, "I", 0x2092000)
invoke(0x4F4DE0, tribe, 13, 0x2020)
spell_alloc = allocations[-1]
assert (spell_alloc["class"], spell_alloc["model"], spell_alloc["owner"]) == (11, 13, 0)
assert read(0x96071E + 13, "B") == 0x10

# Replay the allocated spell through its native initializer. Presentation/state
# leaves on the shaman are suppressed; the initializer's target/team/audio fields
# execute natively.
spell = spell_alloc["pointer"]
write(spell + 0xC, "I", 0x400)
write(spell + 0x2B, "B", 13)
write(spell + 0x2F, "B", 0)
for address in (0x4ED6F0, 0x4ED640):
    cpu.hook_add(UC_HOOK_CODE, ignore, begin=address, end=address)
invoke(0x4C14C0, spell)
cast_init = {
    "phase": read(spell + 0x2D, "B"),
    "target": list(struct.unpack("<hhh", cpu.mem_read(spell + 0x6C, 6))),
    "owner": read(spell + 0x2F, "B"),
    "sounds": sounds.copy(),
    "stockAfterAllocation": read(0x96071E + 13, "B"),
}

# Phase 3 launches class-8/model-1 from the shaman at +96 height toward target.
allocations.clear()
write(spell + 0x2D, "B", 3)
launch_visits = 0
while not allocations and launch_visits < 6:
    invoke(0x4C1D10, spell)
    launch_visits += 1
shot = allocations[-1]
shot_pointer = shot["pointer"]
shot_state = {
    "allocation": {k: v for k, v in shot.items() if k not in ("pointer", "unitIndex")},
    "start": list(struct.unpack("<hhh", cpu.mem_read(shot_pointer + 0x70, 6))),
    "destination": list(struct.unpack("<hhh", cpu.mem_read(shot_pointer + 0x76, 6))),
    "targetIndex": read(shot_pointer + 0x98, "H"),
    "launchVisits": launch_visits,
}
assert (shot["class"], shot["model"], shot["owner"]) == (8, 1, 0)
assert shot_state["start"][2] == 416
assert launch_visits == 6

# Phase 2 after projectile loss allocates the descriptor's sole class-7/model-19
# effect at the cast target. Model 19 then emits model 72/cue d9 followed by the
# class-1/model-8 Angel payload at exactly that position and team.
allocations.clear()
deletions.clear()
write(spell + 0x2D, "B", 2)
write(spell + 0x68, "H", 0)
invoke(0x4C1D10, spell)
effect = allocations[-1]
assert (effect["class"], effect["model"], effect["owner"]) == (7, 19, 0), effect
effect_pointer = effect["pointer"]
write(effect_pointer + 0x6C, "h", 0)
allocations.clear()
sounds.clear()
invoke(0x512240, effect_pointer)
presentation = allocations[-1]
assert (presentation["class"], presentation["model"], presentation["owner"]) == (7, 72, 0)
write(presentation["pointer"] + 0xC, "I", 1)
invoke(0x512240, effect_pointer)
payload = allocations[-1]
assert (payload["class"], payload["model"], payload["owner"]) == (1, 8, 0)
assert payload["position"] == effect["position"]
effect_chain = {
    "effect": {k: v for k, v in effect.items() if k not in ("pointer", "unitIndex")},
    "presentation": {k: v for k, v in presentation.items() if k not in ("pointer", "unitIndex")},
    "payload": {k: v for k, v in payload.items() if k not in ("pointer", "unitIndex")},
    "sounds": sounds.copy(),
    "effectDeleted": effect["unitIndex"] in deletions,
}

# Native payment occurs before allocation; a supplied allocator failure therefore
# does not refund the gifted shot.
fail_alloc = True
allocations.clear()
write(0x96071E + 13, "B", 0x11)
write(0x892443, "I", 0x2093000)
invoke(0x4F4DE0, tribe, 13, 0x2020)
allocation_failure = {"stockAfter": read(0x96071E + 13, "B"), "allocation": allocations[-1]}
fail_alloc = False
assert allocation_failure["stockAfter"] == 0x10 and allocation_failure["allocation"]["failed"]

model = 13
row = 0x5A80D0 + model * 62
physics = read(0x5A7060 + 8 * 50 + 6, "B")
runtime = {
    "model": model,
    "mode": read(row, "H"),
    "cost": read(row + 4),
    "flags": read(row + 26, "H"),
    "normalRange": read(row + 30),
    "alternateRange": read(row + 34),
    "shotTypes": list(cpu.mem_read(row + 38, 2)),
    "effects": list(cpu.mem_read(row + 40, 5)),
    "normalLimit": read(row + 45, "B"),
    "alternateLimit": read(row + 46, "B"),
    "chargeRate": read(row + 58, "H"),
    "duration": read(0x5AA5A4),
    "life": read(0x5A7200),
    "personState": read(0x5A7060 + 8 * 50 + 4, "B"),
    "physics": physics,
    "baseSpeed": read(0x5A7B90 + physics * 26 + 4, "H"),
    "runningSpeed": read(0x5A7B90 + physics * 26 + 6, "H"),
    "verticalLimit": read(0x5A7B90 + physics * 26 + 10, "H"),
}
assert runtime == {
    "model": 13, "mode": 1, "cost": 510000, "flags": 1151,
    "normalRange": 3072, "alternateRange": 7168, "shotTypes": [2, 1],
    "effects": [19, 0, 0, 0, 0], "normalLimit": 1, "alternateLimit": 0,
    "chargeRate": 300, "duration": 2500, "life": 10000,
    "personState": 28, "physics": 19, "baseSpeed": 140,
    "runningSpeed": 140, "verticalLimit": 256,
}

result = {
    "hashes": hashes,
    "tool": {"python": sys.version.split()[0], "unicorn": __import__("unicorn").__version__},
    "decoded": decoded,
    "linkedReferenceCounts": reference_counts,
    "completion": completion,
    "stockLimits": limits,
    "stockCases": stocks,
    "delayedStockCases": delayed_stocks,
    "targetResults": target_results,
    "castInitialization": cast_init,
    "shot": shot_state,
    "effectChain": effect_chain,
    "allocationFailure": allocation_failure,
    "runtimeModel13": runtime,
    "intercepted": [
        "004ed8a0 allocation", "004ef180/004edcf0 deletion", "004ede10 template copy",
        "004ed700 cloned-object first processing", "004fbd20 worship presentation",
        "004fc290 shared-reference check", "0048a050 audio playback",
        "004ed6f0 unit cleanup", "004ed640 shaman state initialization",
    ],
}
if args.output:
    args.output.write_text(json.dumps(result, indent=2) + "\n")
print("PASS: Mission 14 linked rewards, stock caps, generic model-13 cast and Angel allocation")
