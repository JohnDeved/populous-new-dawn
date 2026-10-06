#!/usr/bin/env python3
"""Compare authored head -> linked bridge origins with native clone dispatch.

Worship completion is supplied. Original record decoding, model-24 state setup,
head dispatch, clone copy, class dispatch, and complete bridge terrain arithmetic
execute. Allocation storage, world registration/class callbacks, shared-link scan,
presentation/audio, trail allocation, deletion and terrain notifications are
intercepted. This is not a complete native-game or renderer execution.
Mixed-link later heads are explicitly reduced to their authored bridge slots.
Activation and next-visit snapshots retain both RNG streams under these supplied
boundaries; real trail initialization and its cosmetic draws remain intercepted.
"""
import argparse
import hashlib
import json
import struct
import subprocess
from pathlib import Path

from unicorn import UC_HOOK_CODE
from unicorn.x86_const import UC_X86_REG_ESP, UC_X86_REG_EIP, UC_X86_REG_EAX
from decomp import native_cpu, configure_native_constants, ROOT

parser = argparse.ArgumentParser(description=__doc__)
parser.add_argument("exe", type=Path)
parser.add_argument("--output", type=Path)
parser.add_argument("--browser", type=Path, help="Ordinary Mission 2 initial/final rendered terrain capture")
args = parser.parse_args()
browser = json.loads(args.browser.read_text()) if args.browser else None
cpu, identity = native_cpu(args.exe)
configure_native_constants(cpu, args.exe)
cpu.mem_map(0x2000000, 0x100000)
HEAD, SOURCE, CLONE, TRAIL = 0x2000000, 0x2000100, 0x2000200, 0x2000300
RECORD, THUNK, STACK, STOP = 0x2001000, 0x2002000, 0x20FD000, 0x20FE000


def write(address, fmt, *values):
    cpu.mem_write(address, struct.pack("<" + fmt, *values))


def read(address, fmt="I"):
    return struct.unpack("<" + fmt, cpu.mem_read(address, struct.calcsize("<" + fmt)))[0]


def invoke(address, *values):
    write(STACK, "I" * (len(values) + 1), STOP, *values)
    cpu.reg_write(UC_X86_REG_ESP, STACK)
    cpu.emu_start(address, STOP, count=3_000_000)
    assert cpu.reg_read(UC_X86_REG_EIP) == STOP, hex(cpu.reg_read(UC_X86_REG_EIP))


def return_from_hook(value=0):
    sp = cpu.reg_read(UC_X86_REG_ESP)
    cpu.reg_write(UC_X86_REG_EIP, read(sp))
    cpu.reg_write(UC_X86_REG_ESP, sp + 4)
    cpu.reg_write(UC_X86_REG_EAX, value)


allocations, deleted, changed, trace = [], [], [], []
trails, notifications = [], []


def hook(_cpu, address, _size, _user):
    sp = cpu.reg_read(UC_X86_REG_ESP)
    if address == 0x4ED8A0:
        class_id, model, owner, point = struct.unpack("<IIII", cpu.mem_read(sp + 4, 16))
        class_id, model, owner = class_id & 255, model & 255, owner & 255
        assert class_id == 7 and model in (24, 3), (class_id, model)
        if model == 24:
            allocations.append(list(struct.unpack("<HHh", cpu.mem_read(point, 6))))
            cpu.mem_write(CLONE, bytes(256))
            write(CLONE + 0x24, "H", 1000)
            write(CLONE + 0x2A, "BB", class_id, model)
            write(CLONE + 0x2F, "B", owner & 255)
            cpu.mem_write(CLONE + 0x3D, bytes(cpu.mem_read(point, 6)))
            # Execute the real model initializer before returning allocated storage.
            cpu.reg_write(UC_X86_REG_EIP, THUNK)
            return
        if read(CLONE + 0x6C, "h") <= 2:
            trails.append(list(struct.unpack("<HHh", cpu.mem_read(point, 6))))
        cpu.mem_write(TRAIL, bytes(256))
        return_from_hook(TRAIL)
        return
    if address in (0x4EF180, 0x4EDCF0):
        deleted.append(read(sp + 4))
    if address == 0x44DDF0:
        changed.append(read(sp + 4, "H"))
        if browser and mission == 2:
            return  # Execute the real terrain queue for the rendered capture.
    if address == 0x44F2F0 and read(CLONE + 0x6C, "h") <= 2:
        assert [read(sp + offset) for offset in (4, 12, 16)] == [1, 2, 0xFFFFFFFF]
        notifications.append(read(sp + 8, "H"))
    return_from_hook()


intercepted = (
    0x4ED8A0, 0x4EF180, 0x4EDCF0, 0x4FC290, 0x4FBD20, 0x50BCD0,
    0x4ED6F0, 0x4ED640, 0x48A050, 0x44DDF0, 0x44F2F0, 0x4BE230, 0x4BDFF0,
)
for address in intercepted:
    cpu.hook_add(UC_HOOK_CODE, hook, begin=address, end=address)
for address in (0x485B00, 0x4FB270, 0x509C10, 0x4EDE10, 0x4ED700, 0x50A750, 0x50EE00):
    cpu.hook_add(UC_HOOK_CODE, lambda _cpu, a, _s, _u: trace.append(hex(a)), begin=address, end=address)
cpu.mem_write(
    THUNK,
    b"\x68" + struct.pack("<I", CLONE) + b"\xb8" + struct.pack("<I", 0x509C10)
    + b"\xff\xd0\x83\xc4\x04\xb8" + struct.pack("<I", CLONE) + b"\xc3",
)


def raw_record(level, index):
    return level[0x14043 + index * 55:0x14043 + (index + 1) * 55]


def install(level, index, pointer):
    raw = raw_record(level, index)
    cpu.mem_write(pointer, bytes(256))
    write(pointer + 0x24, "H", index + 1)
    write(pointer + 0x2A, "BB", raw[1], raw[0])
    write(pointer + 0x2F, "B", raw[2])
    cpu.mem_write(pointer + 0x3D, raw[3:7] + b"\0\0")
    cpu.mem_write(RECORD, raw[:39])
    invoke(0x485B00, pointer, RECORD)
    write(0x890390 + (index + 1) * 4, "I", pointer)
    if raw[1] == 7:
        invoke(0x509C10, pointer)


def point(pointer, offset):
    x, y = struct.unpack("<HH", cpu.mem_read(pointer + offset, 4))
    return {"x": x, "y": y}


def snapshot():
    return {
        "state": {
            "turn": read(CLONE + 0x6C, "h"), "alongY": bool(read(CLONE + 0x86, "i")),
            "startCell": read(CLONE + 0x8A, "H"), "endCell": read(CLONE + 0x8C, "H"),
            "direction": read(CLONE + 0x7A, "i"), "crossStep": read(CLONE + 0x82, "i"),
            "heightStep": read(CLONE + 0x7E, "i"), "raiseWater": bool(read(CLONE + 0x8E, "B")),
        },
        "gameplayRng": read(0x89D178), "cosmeticRng": read(0x89BC72),
        "terrainSha256": hashlib.sha256(cpu.mem_read(0x8A03E4, 0x40000)).hexdigest(),
        "trails": list(trails), "changed": list(changed), "notifications": list(notifications),
    }


cases, inventory = [], {}
for mission in (1, 2, 3, 5, 6, 9):
    level_path = args.exe.parent / "levels" / f"levl{2000 + mission}.dat"
    level = level_path.read_bytes()
    inventory[mission] = []
    for head_index in range(2000):
        head_record = raw_record(level, head_index)
        if head_record[0:2] != bytes((6, 6)):
            continue
        links = struct.unpack_from("<10H", head_record, 13)
        for token in links:
            if not token or raw_record(level, token - 1)[0:2] != bytes((24, 7)):
                continue
            inventory[mission].append([head_index, token - 1])
            allocations.clear()
            deleted.clear()
            changed.clear()
            trace.clear()
            trails.clear()
            notifications.clear()
            cpu.mem_write(0x890390, bytes(0x4000))
            terrain = bytearray(0x40000)
            for index, height in enumerate(struct.unpack("<16384h", level[:32768])):
                struct.pack_into("<Ih", terrain, index * 16, 0, height)
                if browser and mission == 2:
                    struct.pack_into("<Ih", terrain, index * 16, browser["flags"][index], browser["heights"][index])
                    for field, offset in (("cliffs", 10), ("categories", 12), ("shadows", 14)):
                        terrain[index * 16 + offset] = browser[field][index]
            if browser and mission == 2:
                write(0x89C661, "I", browser["landFlags"])
            cpu.mem_write(0x8A03E4, bytes(terrain))
            install(level, head_index, HEAD)
            install(level, token - 1, SOURCE)
            # Later missions may mix bridges with other linked rewards. Isolate the
            # bridge link while retaining its authored slot; only Mission 2's whole
            # linked graph is executed. This never supplies either endpoint.
            for slot, link in enumerate(links):
                if link != token:
                    write(HEAD + 0x72 + slot * 2, "H", 0)
            # Supply the completion bit; ordinary live input is a separate browser gate.
            write(HEAD + 0x2E, "B", 1)
            write(HEAD + 0x6D, "B", read(HEAD + 0x6D, "B") | 2)
            before = snapshot()
            invoke(0x4FB270, HEAD)
            assert len(allocations) == 1
            assert point(CLONE, 0x3D) == point(SOURCE, 0x3D)
            assert point(CLONE, 0x57) == point(SOURCE, 0x57)
            assert read(CLONE + 0x2C, "B") == 25
            assert read(CLONE + 0x6C, "h") == 1
            activation = snapshot()
            for field in ("terrainSha256", "gameplayRng", "cosmeticRng"):
                assert activation[field] == before[field], (mission, field)
            assert not activation["trails"] and not activation["changed"] and not activation["notifications"]
            turns = 1
            while CLONE not in deleted:
                invoke(0x4ED700, CLONE)
                if turns == 1:
                    next_visit = snapshot()
                    assert next_visit["state"]["turn"] == 2
                    assert next_visit["notifications"] == next_visit["changed"]
                if browser and mission == 2:
                    invoke(0x44DF40)
                turns += 1
                assert turns < 64
            if browser and mission == 2:
                assert point(CLONE, 0x3D) == browser["start"], "Rendered bridge origin differs from native authored producer"
                assert point(CLONE, 0x57) == browser["target"]
                heights = [read(0x8A03E4 + cell * 16 + 4, "h") for cell in range(16384)]
                assert heights == browser["finalHeights"], "Rendered final terrain differs from native authored bridge"
            x, y = struct.unpack_from("<hh", head_record, 3)
            cases.append({
                "mission": mission, "headIndex": head_index, "sourceIndex": token - 1,
                "authoredLinks": list(links), "bridgeOnlyLinkSlice": sum(bool(link) for link in links) > 1,
                "levelSha256": hashlib.sha256(level).hexdigest(),
                "head": {"x": x / 256 - 8, "z": -y / 256 - 8},
                "start": point(CLONE, 0x3D), "target": point(CLONE, 0x57),
                "turns": turns, "changedCells": len(set(changed)),
                "activation": activation, "nextVisit": next_visit,
                "nativeTrace": list(dict.fromkeys(trace)),
                "terrainSha256": hashlib.sha256(cpu.mem_read(0x8A03E4, 0x40000)).hexdigest(),
            })
assert inventory == {1: [], 2: [[59, 60]], 3: [], 5: [[96, 126], [113, 115]], 6: [[355, 356]], 9: [[215, 228]]}
js = """
import assert from 'node:assert/strict';
import { createWorld, nativePosition } from './app/model.ts';
import { missionData } from './app/mission-data.ts';
let data = ''; for await (const chunk of process.stdin) data += chunk;
const unsigned = ({x, y}) => ({x: x & 65535, y: y & 65535});
for (const c of JSON.parse(data)) {
  assert.equal(missionData(c.mission).level.sourceSha256, c.levelSha256);
  const w = createWorld(c.mission);
  const head = w.shrines.find(h => h.kind === 'bridgeEffect' && h.x === c.head.x && h.z === c.head.z);
  assert.ok(head?.bridgeStart, `Missing authored origin for Mission ${c.mission} head ${c.headIndex}`);
  assert.deepEqual(unsigned(nativePosition(w, head.bridgeStart)), c.start);
  assert.deepEqual(unsigned(nativePosition(w, head.bridgeTarget)), c.target);
}
"""
subprocess.run(["node", "--input-type=module", "-e", js], input=json.dumps(cases).encode(), cwd=ROOT, check=True)
report = {"identity": identity, "cases": cases, "inventory": inventory, "intercepted": [hex(a) for a in intercepted], "limits": __doc__}
if args.output:
    args.output.parent.mkdir(parents=True, exist_ok=True)
    args.output.write_text(json.dumps(report, indent=2) + "\n")
print(f"PASS: {len(cases)} authored bridge producers, real clone/dispatch, {sum(c['turns'] for c in cases)} native terrain turns; Missions 1 and 3 have none")
if browser:
    print("PASS: ordinary Mission 2 rendered bridge endpoints and all 16,384 final terrain heights match native producer/controller replay")
