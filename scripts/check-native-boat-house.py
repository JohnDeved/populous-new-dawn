"""Non-recording isolated probe for native 0x406600 Boat House production.

The original routine and descriptor tables execute. Shape enumeration, allocation,
height, shore heading, routing, boarding, motion, and removal consumers are supplied
so the probe can inspect only the producer's gates and writes without launching the
Windows game or recording fixtures.
"""
import json
import struct
import sys
from pathlib import Path

from unicorn import UC_HOOK_CODE, UC_HOOK_MEM_INVALID, UcError
from unicorn.x86_const import UC_X86_REG_EAX, UC_X86_REG_EIP, UC_X86_REG_ESP

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "scripts"))
from decomp import load_native_shapes, native_cpu  # noqa: E402

EXE = Path(sys.argv[1])
cpu, identity = native_cpu(EXE)
cpu.mem_map(0x2000000, 0x50000)
load_native_shapes(cpu, EXE, 0x2020000, 0x2024000)

building = 0x2010000
worker = 0x2011000
workers = [worker + i * 0x100 for i in range(4)]
boat = 0x2012000
stack = 0x204d000
stop = 0x204e000


def write(address, fmt, *values):
    cpu.mem_write(address, struct.pack("<" + fmt, *values))


def read(address, fmt):
    return struct.unpack("<" + fmt, cpu.mem_read(address, struct.calcsize("<" + fmt)))[0]


def point(address):
    x, y, z = struct.unpack("<HHh", cpu.mem_read(address, 6))
    return {"x": x, "y": y, "z": z}


case = None
events = None


def hook(c, address, _size, _user):
    sp = c.reg_read(UC_X86_REG_ESP)
    args = lambda n: struct.unpack("<" + "I" * n, c.mem_read(sp + 4, 4 * n))
    value = 0
    if address == 0x4B9EF0:  # supplied shape enumeration: one dock-tagged cell
        _shape, _origin, output, count = args(4)
        packed = case["dock_cell_x"] | (case["dock_cell_y"] << 8)
        write(output + 4, "H", packed)
        write(output + 6, "H", 0x10)
        write(count, "i", 1)
        events.append(["shape", packed, 0x10])
    elif address == 0x4ED8A0:  # supplied allocator
        cls, model, tribe, location = args(4)
        events.append(["allocate", cls, model, tribe & 0xFF, point(location)])
        if cls == 4:
            cpu.mem_write(boat, bytes(256))
            write(boat + 0x24, "H", 2)
            write(boat + 0x2A, "BBB", cls, model, 1)
            write(boat + 0x2F, "B", tribe & 0xFF)
            write(boat + 0x26, "H", case["initial_heading"])
            write(boat + 0x3D, "HHh", point(location)["x"], point(location)["y"], 0)
            value = boat
    elif address == 0x40B6D0:  # supplied dock-mask consumer
        events.append(["dock-mask", args(2)[1]])
    elif address == 0x4EE470:  # supplied spatial insertion
        events.append(["insert", args(2)[0], point(args(2)[1])])
    elif address == 0x44E940:  # supplied height reader
        value = case["height"] & 0xFFFF
        events.append(["height", args(2)[0] & 0xFFFF, args(2)[1] & 0xFFFF, case["height"]])
    elif address == 0x465580:  # supplied native shore-direction result
        events.append(["shore-heading", args(2)[1] & 0xFFFF, case["shore_heading"]])
        value = case["shore_heading"]
    elif address == 0x407490:  # supplied 0x407490 slot/count semantics used by the producer
        hut, occupant = args(2)
        assert hut == building
        slots = [read(building + 0x86 + i * 2, "H") for i in range(6)]
        if occupant:
            wanted = read(occupant + 0x24, "H")
            slot = next((i for i, person_id in enumerate(slots) if person_id == wanted), -1)
        else:
            slot = next((i for i, person_id in enumerate(slots) if person_id), -1)
        if slot >= 0:
            removed_id = slots[slot]
            value = read(0x890390 + removed_id * 4, "I")
            write(building + 0xA6, "B", max(0, read(building + 0xA6, "B") - 1))
            write(building + 0x86 + slot * 2, "H", 0)
            write(building + 0x9C, "H", read(building + 0x9C, "H") & 0xFFFB)
            events.append(["remove", removed_id, slot, "specific" if occupant else "first"])
        else:
            events.append(["remove-miss", occupant])
    elif address == 0x436CA0:  # supplied order cleanup for native type-1 remaining-occupant ejection
        events.append(["clear-orders", args(1)[0]])
    elif address == 0x4657D0:  # supplied boarding consumer
        events.append(["board", *args(2)])
    elif address == 0x465EA0:  # supplied initial motion consumer
        events.append(["motion", args(1)[0]])
    elif address == 0x464AE0:  # supplied route/landing target
        _vehicle, _from, output, occupant = args(4)
        write(output, "HH", 0x2222, 0x3333)
        events.append(["route", occupant])
        value = 1
    elif address == 0x436C20:  # supplied command-record allocation exhaustion
        events.append(["command-record", 0])
    elif address == 0x4EF180:  # supplied deletion; not expected in first launch
        events.append(["delete", args(1)[0]])
    else:
        raise AssertionError(hex(address))
    c.reg_write(UC_X86_REG_EAX, value)
    c.reg_write(UC_X86_REG_EIP, read(sp, "I"))
    c.reg_write(UC_X86_REG_ESP, sp + 4)


for target in (
    0x4B9EF0,
    0x4ED8A0,
    0x40B6D0,
    0x4EE470,
    0x44E940,
    0x465580,
    0x407490,
    0x436CA0,
    0x4657D0,
    0x465EA0,
    0x464AE0,
    0x436C20,
    0x4EF180,
):
    cpu.hook_add(UC_HOOK_CODE, hook, begin=target, end=target)


invalid = None


def invalid_memory(c, access, address, size, value, _user):
    global invalid
    invalid = (access, address, size, value, c.reg_read(UC_X86_REG_EIP))
    return False


cpu.hook_add(UC_HOOK_MEM_INVALID, invalid_memory)


def call(address, *args):
    global invalid
    invalid = None
    write(stack, "I" * (len(args) + 1), stop, *args)
    cpu.reg_write(UC_X86_REG_ESP, stack)
    try:
        cpu.emu_start(address, stop, count=200000)
    except UcError as error:
        raise AssertionError(f"{error}; invalid={invalid}") from error
    assert cpu.reg_read(UC_X86_REG_EIP) == stop


def run(name, timer, occupant=True, working=True, model=13, player_type=1, occupant_count=None):
    global case, events
    case = {
        "name": name,
        "dock_cell_x": 0x2A,
        "dock_cell_y": 0x54,
        "initial_heading": 0x155,
        "shore_heading": 0x300,
        "height": 77,
    }
    events = []
    for address in (building, *workers, boat):
        cpu.mem_write(address, bytes(256))
    # Shape enumeration is supplied below, so object identity is inert here.
    write(building + 0x24, "H", 1)
    write(building + 0x26, "H", 0x200)
    write(building + 0x2A, "BBB", 2, model, 2)
    write(building + 0x2F, "B", 2)
    write(building + 0x33, "H", 5)
    write(building + 0x7A, "HH", 0x4000, 0x6000)
    write(building + 0x9C, "H", 0x20)
    write(building + 0xA4, "h", timer)
    write(0x892443, "I", 0x2013000)
    count = (1 if occupant else 0) if occupant_count is None else occupant_count
    assert 0 <= count <= 4
    slot_ids = list(range(1, count + 1)) + [0] * (6 - count)
    write(building + 0x86, "HHHHHH", *slot_ids)
    write(building + 0xA6, "B", count)
    for index, address in enumerate(workers[:count], start=1):
        write(0x890390 + index * 4, "I", address)
        write(address + 0x24, "H", index)
        write(address + 0x2A, "BBB", 1, 2, 1)
        write(address + 0x2F, "B", 2)
        write(address + 0x70, "h", 80)
        write(address + 0xA9, "B", 0 if working or index > 1 else 1)
    write(0x89D1C8 + 2 * 0xC65 + 0xC1F, "B", player_type)
    call(0x406600, building)
    allocations = [e for e in events if e[0] == "allocate" and e[1] == 4]
    return {
        "name": name,
        "timerBefore": timer,
        "playerType": player_type,
        "occupantsBefore": count,
        "launched": bool(allocations),
        "allocation": allocations[0] if allocations else None,
        "boat": {
            "class": read(boat + 0x2A, "B"),
            "model": read(boat + 0x2B, "B"),
            "tribe": read(boat + 0x2F, "B"),
            "position": point(boat + 0x3D),
            "heading": read(boat + 0x26, "H"),
            "turnHeading": read(boat + 0x5D, "H"),
            "navigationFlags": read(boat + 0x92, "I"),
        }
        if allocations
        else None,
        "building": {
            "class": read(building + 0x2A, "B"),
            "model": read(building + 0x2B, "B"),
            "state": read(building + 0x2C, "B"),
            "timer": read(building + 0xA4, "h"),
            "occupants": read(building + 0xA6, "B"),
            "occupantSlots": [read(building + 0x86 + i * 2, "H") for i in range(6)],
            "workFlags": read(building + 0x9C, "H"),
        },
        "worker": {
            "id": read(worker + 0x24, "H"),
            "workState": read(worker + 0xA8, "B"),
            "workFlags": read(worker + 0x76, "B"),
        },
        "events": events,
    }


results = [
    run("no-occupant", 600, occupant=False),
    run("non-working-occupant", 600, working=False),
    run("below-threshold", 599),
    run("at-threshold", 600),
    run("above-threshold", 601),
]
assert [r["launched"] for r in results] == [False, False, False, True, True]
for result in results[-2:]:
    assert result["allocation"][1:4] == [4, 1, 2]
    assert result["allocation"][4] == {"x": 0x2B00, "y": 0x5500, "z": 77}
    assert result["boat"]["position"] == {"x": 0x2B00, "y": 0x5500, "z": 77}
    assert result["boat"]["heading"] == 0x700
    assert result["building"] == {
        "class": 2,
        "model": 13,
        "state": 2,
        "timer": 0,
        "occupants": 0,
        "occupantSlots": [0, 0, 0, 0, 0, 0],
        "workFlags": 0x20,
    }

multi = [
    run("type1-four-occupants", 600, player_type=1, occupant_count=4),
    run("type2-four-occupants", 600, player_type=2, occupant_count=4),
]
type1, type2 = multi
assert type1["launched"] and type2["launched"]
assert type1["building"]["occupants"] == 0, type1
assert type1["building"]["occupantSlots"] == [0, 0, 0, 0, 0, 0], type1
assert [event[1] for event in type1["events"] if event[0] == "remove"] == [1, 2, 3, 4], type1
assert type2["building"]["occupants"] == 3, type2
assert type2["building"]["occupantSlots"] == [0, 2, 3, 4, 0, 0], type2
assert [event[1] for event in type2["events"] if event[0] == "remove"] == [1], type2

report = {
    "executableSha256": identity["sha256"],
    "routine": "0x00406600",
    "descriptor": {
        "buildingModel": 13,
        "vehicleModel": read(0x5A7259 + 13 * 76, "B"),
        "productionFlags": hex(read(0x5A7270 + 13 * 76, "I")),
        "vehicleWorkThreshold": read(0x5A7938 + 1 * 23 + 0x13, "h"),
    },
    "suppliedLeaves": [
        "0x004b9ef0 shape enumeration",
        "0x004ed8a0 allocation storage",
        "0x0040b6d0 dock-mask consumer",
        "0x004ee470 spatial insertion",
        "0x0044e940 height reader",
        "0x00465580 shore-heading result",
        "0x00407490 occupant removal (faithful slot/count subset)",
        "0x00436ca0 remaining-occupant order cleanup",
        "0x004657d0 boarding",
        "0x00465ea0 initial motion",
        "0x00464ae0 routing target",
        "0x00436c20 command-record allocation",
        "0x004ef180 deletion",
    ],
    "playerTypeEvidence": {
        "fieldOffset": "0xc1f",
        "type1": "computer",
        "type2": "human",
        "sources": ["scripts/check-native-mana.py", "app/world-state.ts"],
    },
    "cases": results,
    "multiOccupantCases": multi,
}
print(json.dumps(report, indent=2))
