"""Inspect the bounded native Firewarrior-in-Guard-Tower path.

Usage: .tools/decomp/oracle/bin/python probe-firewarrior-tower.py /path/to/d3dpoptb.exe

This is a non-recording research probe. It executes the original scan/range,
projectile initialization/update, and impact routines while supplying allocation,
automatic-order ownership, audio/animation/sunlight, and two model-specific impact
consumers. See findings.md for the proof boundary.
"""
import json
import struct
import sys
from pathlib import Path

from unicorn import UC_HOOK_CODE, UC_HOOK_MEM_WRITE_UNMAPPED
from unicorn.x86_const import UC_X86_REG_EAX, UC_X86_REG_EIP, UC_X86_REG_ESP


ROOT = Path(__file__).resolve().parents[4]
sys.path.insert(0, str(ROOT / "scripts"))
from decomp import configure_native_constants, native_cpu  # noqa: E402


exe = Path(sys.argv[1])
cpu, identity = native_cpu(exe)
configure_native_constants(cpu, exe)
cpu.mem_map(0x2000000, 0x50000)

base, stack, stop, thunk = 0x2000000, 0x204D000, 0x204E000, 0x2040000
source, target, tower = base, base + 0x100, base + 0x200
shots = [base + 0x300, base + 0x400]
write = lambda address, fmt, *values: cpu.mem_write(address, struct.pack("<" + fmt, *values))
read = lambda address, fmt: struct.unpack(
    "<" + fmt, cpu.mem_read(address, struct.calcsize("<" + fmt))
)[0]
events = []
capacity = 2


def ret(value=0):
    sp = cpu.reg_read(UC_X86_REG_ESP)
    cpu.reg_write(UC_X86_REG_EAX, value)
    cpu.reg_write(UC_X86_REG_EIP, read(sp, "I"))
    cpu.reg_write(UC_X86_REG_ESP, sp + 4)


def allocate_shot(index, cls, model, tribe, point):
    p = shots[index]
    cpu.mem_write(p, bytes(256))
    object_id = 4 + index
    write(0x890390 + object_id * 4, "I", p)
    write(p + 0x24, "H", object_id)
    write(p + 0x2A, "BBB", cls, model, 1)
    write(p + 0x2F, "B", tribe)
    cpu.mem_write(p + 0x3D, bytes(cpu.mem_read(point, 6)))
    write(p + 0x0C, "I", 0x400)
    old = read(0x890324, "I")
    write(p, "II", 0, old)
    if old:
        write(old, "I", p)
    write(0x890324, "I", p)
    return p


def hook(c, address, size, user):
    global capacity, thunk
    sp = c.reg_read(UC_X86_REG_ESP)
    if address == 0x40A3F0:  # get_adjacent_unit; supply the admitted model-4 tower.
        person, model = read(sp + 4, "I"), read(sp + 8, "I")
        events.append(("adjacent", person, model))
        ret(tower if person == source and model == 4 else 0)
        return
    if address == 0x51F470:  # Observe but execute the complete target scanner.
        events.append(
            (
                "target_scan",
                read(sp + 8, "I") & 0xFFFF,
                read(sp + 12, "I"),
                read(sp + 16, "I"),
                read(sp + 20, "I") & 0xFF,
                read(sp + 24, "I") & 0xFF,
            )
        )
        return
    if address == 0x436C20:  # Supply one free automatic-order record.
        events.append(("allocate_order",))
        ret(1)
        return
    if address == 0x438730:  # Capture command 21 configuration.
        events.append(
            (
                "configure_order",
                read(sp + 4, "I") & 0xFFFF,
                read(sp + 8, "I") & 0xFF,
                read(sp + 16, "I") & 0xFF,
            )
        )
        ret()
        return
    if address == 0x436D00:
        events.append(("attach_order", read(sp + 4, "I"), read(sp + 8, "I") & 0xFFFF))
        ret()
        return
    if address == 0x520480:
        events.append(("share_order", read(sp + 8, "I") & 0xFFFF))
        ret()
        return
    if address == 0x4ED8A0:
        cls, model, tribe = [read(sp + offset, "I") & 0xFF for offset in (4, 8, 12)]
        point = read(sp + 16, "I")
        events.append(("allocate_shot", cls, model, tribe))
        if (cls, model) != (8, 6) or capacity == 0:
            ret()
            return
        index = 2 - capacity
        capacity -= 1
        p = allocate_shot(index, cls, model, tribe, point)
        code = (
            b"\x68"
            + struct.pack("<I", p)
            + b"\xb8"
            + struct.pack("<I", 0x4ED580)
            + b"\xff\xd0\x83\xc4\x04\xb8"
            + struct.pack("<I", p)
            + b"\xc3"
        )
        c.mem_write(thunk, code)
        c.reg_write(UC_X86_REG_EIP, thunk)
        thunk += 32
        return
    if address == 0x48A050:
        events.append(("sound", read(sp + 8, "I")))
        ret()
        return
    if address == 0x4EE700:
        events.append(("animation", read(sp + 8, "I"), read(sp + 12, "I")))
        ret()
        return
    if address == 0x4010B0:
        events.append(("sunlight",))
        ret()
        return
    if address == 0x4EDCF0:
        events.append(("delete", read(read(sp + 4, "I") + 0x24, "H")))
    if address in (0x520610, 0x4DE570):
        events.append(("impact_consumer", address))
        ret()
        return
    if address == 0x4F3190:
        events.append(("kill_credit", read(sp + 4, "I"), read(sp + 8, "I")))
        ret()


for address in (
    0x40A3F0,
    0x51F470,
    0x436C20,
    0x438730,
    0x436D00,
    0x520480,
    0x4ED8A0,
    0x48A050,
    0x4EE700,
    0x4010B0,
    0x4EDCF0,
    0x520610,
    0x4DE570,
    0x4F3190,
):
    cpu.hook_add(UC_HOOK_CODE, hook, begin=address, end=address)


def unmapped(c, access, address, size, value, user):
    print(
        f"unmapped write address={address:#x} size={size} value={value:#x} "
        f"eip={c.reg_read(UC_X86_REG_EIP):#x}",
        file=sys.stderr,
        flush=True,
    )
    return False


cpu.hook_add(UC_HOOK_MEM_WRITE_UNMAPPED, unmapped)


def call(address, *args):
    write(stack, "I" * (len(args) + 1), stop, *args)
    cpu.reg_write(UC_X86_REG_ESP, stack)
    cpu.emu_start(address, stop, count=1_000_000)
    assert cpu.reg_read(UC_X86_REG_EIP) == stop, hex(cpu.reg_read(UC_X86_REG_EIP))
    return cpu.reg_read(UC_X86_REG_EAX)


# Flat land with a state-21 Firewarrior linked to an admitted model-4 tower and
# one hostile Brave in the same cell. The tower's socket raises display support
# (+0x1c) without changing the ground height used by range (+0x41).
land = bytearray(16384 * 16)
for i in range(16384):
    struct.pack_into("<Ih", land, i * 16, 8, 128)
cpu.mem_write(0x8A03E4, bytes(land))
cpu.mem_write(0x890390, bytes(4096))
cpu.mem_write(0x938830, bytes(8000))
cpu.mem_write(0x2031000, bytes(1024))
write(0x892443, "I", 0x2031000)
write(0x89243A, "B", 0)
write(0x895DA4, "I", 0)  # level_flags_2
write(0x89D17C, "I", 0)  # level_flags
write(0x890390 + 4, "I", source)
write(0x890390 + 8, "I", target)
write(0x890390 + 12, "I", tower)
write(0x890324, "I", source)

cpu.mem_write(source, bytes(256))
write(source + 0x24, "H", 1)
write(source + 0x20, "H", 2)
write(source + 0x2A, "BBBBBB", 1, 6, 21, 0, 0, 0)
write(source + 0x2F, "B", 0)
write(source + 0x3D, "HHh", 0x2200, 0x2400, 128)
write(source + 0x1C, "h", 480)
write(source + 0x5D, "h", 0)
write(source + 0x6E, "h", 1000)
write(source + 0x9F, "H", 3)
write(source + 0xB2, "b", 0)
write(source + 0x14, "I", 0x800)

cpu.mem_write(target, bytes(256))
write(target + 0x24, "H", 2)
write(target + 0x20, "H", 0)
write(target + 0x2A, "BBBBBB", 1, 2, 10, 0, 0, 1)
write(target + 0x2F, "B", 1)
write(target + 0x3D, "HHh", 0x2300, 0x2400, 128)
write(target + 0x1C, "h", 64)
write(target + 0x6E, "h", 1000)

cpu.mem_write(tower, bytes(256))
write(tower + 0x24, "H", 3)
write(tower + 0x2A, "BBBBBB", 2, 4, 2, 0, 0, 0)
write(tower + 0x2F, "B", 0)
write(tower + 0x3D, "HHh", 0x2200, 0x2400, 128)

cell = (0x2400 >> 9) * 128 + (0x2200 >> 9)
write(0x8A03E4 + cell * 16 + 6, "H", 1)
write(0x9608B6, "I", 0)  # no alliance bits

tower_range = call(0x51FF60, source)
assert tower_range == 13, tower_range

# Direct target-scanner eligibility boundaries for the state-21 automatic scan.
packed_cell = ((0x2200 >> 8) & 0xFE) | (0x2400 & 0xFE00)


def scan_person(extra_filter=0):
    return call(0x51F470, source, packed_cell, 12, 12, 1, extra_filter) & 0xFF


eligibility = {"hostileBrave": scan_person()}
write(target + 0x6E, "h", 0)
eligibility["dead"] = scan_person()
write(target + 0x6E, "h", 1000)
write(target + 0x0C, "I", 0x10000)
eligibility["excludedFlags2_10000"] = scan_person()
write(target + 0x0C, "I", 0x800000)
eligibility["excludedFlags2_800000"] = scan_person()
write(target + 0x0C, "I", 0)
write(target + 0x10, "I", 0x1000)
eligibility["hiddenFlags4_1000"] = scan_person()
write(target + 0x10, "I", 0)
write(target + 0x2C, "B", 23)
eligibility["state23"] = scan_person()
write(target + 0x2C, "B", 10)
write(target + 0x2F, "B", 0)
eligibility["sameTribe"] = scan_person()
write(target + 0x2F, "B", 1)
eligibility["explicitTowerFilterBrave"] = scan_person(1)
write(target + 0x2B, "B", 7)
eligibility["explicitTowerFilterShaman"] = scan_person(1)
write(target + 0x2B, "B", 2)
assert eligibility == {
    "hostileBrave": 2,
    "dead": 0,
    "excludedFlags2_10000": 0,
    "excludedFlags2_800000": 0,
    "hiddenFlags4_1000": 0,
    "state23": 0,
    "sameTribe": 0,
    "explicitTowerFilterBrave": 0,
    "explicitTowerFilterShaman": 2,
}, eligibility

# 0051f990's tower-aware readiness box is strict at the derived threshold:
# range 13 => 13 * 256 + 56 == 3384 native coordinate units per axis.
write(target + 0x3D, "H", (0x2200 + 3383) & 0xFFFF)
readiness_inside = call(0x51F990, source, target, 0) & 0xFF
write(target + 0x3D, "H", (0x2200 + 3384) & 0xFFFF)
readiness_boundary = call(0x51F990, source, target, 0) & 0xFF
write(target + 0x3D, "H", 0x2300)
assert (readiness_inside, readiness_boundary) == (1, 0)

projectile_id = call(0x51FBF0, source, target, 0) & 0xFFFF
assert projectile_id == 5, projectile_id
assert read(source + 0xB2, "b") == 36
cooldown = read(source + 0xB2, "b")
origins = []
for p in shots:
    assert read(p + 0x2A, "B") == 8
    assert read(p + 0x2B, "B") == 6
    assert read(p + 0x88, "H") == 1
    assert read(p + 0x8A, "H") == 2
    assert read(p + 0x5F, "h") == 0x200
    x, y, h = read(p + 0x3D, "H"), read(p + 0x3F, "H"), read(p + 0x41, "h")
    origins.append((x, y, h))
    assert h == 624, origins
assert origins == [(0x21A0, 0x2400, 624), (0x2260, 0x2400, 624)], origins
assert events.count(("animation", 0x1D, 0x460)) == 2

before = read(target + 0x6E, "h")
for _ in range(64):
    if read(shots[1] + 0x2A, "B") == 0:
        break
    call(0x4BBF30, shots[1])
after = read(target + 0x6E, "h")
assert after < before, (before, after, events)
assert any(event[0] == "delete" and event[1] == 5 for event in events), events

# The other member of the allocated pair remains available for a lethal direct
# impact. Execute 00514410 and observe its attribution handoff without supplying
# the damage calculation itself.
write(target + 0x6E, "h", 400)
write(target + 0x0C, "I", 0)
write(target + 0x10, "I", 0)
write(target + 0x14, "I", 0)
write(shots[0] + 0x3D, "HHh", 0x2300, 0x2400, 128)
call(0x514410, shots[0])
lethal_life = read(target + 0x6E, "h")
assert lethal_life < 1, lethal_life
assert ("kill_credit", source, target) in events, events

# Reset readiness after observing the launch, then execute the state-21 automatic
# scheduler leaf with the real 0051f470 scanner over the same hostile person.
write(source + 0xB2, "b", 0)
write(source + 0x14, "I", read(source + 0x14, "I") | 0x800)
write(target + 0x2A, "BBBBBB", 1, 2, 10, 0, 0, 1)
write(target + 0x2F, "B", 1)
write(target + 0x0C, "I", 0)
write(target + 0x10, "I", 0)
write(target + 0x6E, "h", 1000)
call(0x4D4690, source)
scan = [event for event in events if event[0] == "target_scan"][-1]
assert scan[2:] == (12, 12, 1, 0), scan
assert ("configure_order", 1, 21, 0x20) in events, events
assert any(event[0] == "attach_order" and event[2] == 1 for event in events), events

summary = {
    "executableSha256": identity["sha256"],
    "state": 21,
    "groundHeight": 128,
    "supportHeight": 480,
    "towerRange": tower_range,
    "readinessStrictThreshold": 3384,
    "eligibility": eligibility,
    "scannerRadius": scan[2],
    "automaticOrderModel": 21,
    "cooldown": cooldown,
    "projectileOrigins": origins,
    "projectileDestinationHeight": read(shots[0] + 0x7A, "h"),
    "damage": before - after,
    "lethalLife": lethal_life,
    "killCreditRequested": True,
    "intercepted": sorted({event[0] for event in events if event[0] in {
        "allocate_order", "configure_order", "attach_order", "share_order",
        "allocate_shot", "sound", "animation", "sunlight", "impact_consumer", "kill_credit"
    }}),
}
print(json.dumps(summary, indent=2, sort_keys=True))
print("PASS: bounded native state-21 Firewarrior tower scan, launch, raised origin, cooldown, impact")
