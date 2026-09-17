"""Non-recording Mission 16/Bloodlust native check candidate.

Usage:
  .tools/decomp/oracle/bin/python \
    scripts/check-native-mission16-bloodlust.py \
    work/orchestration/ceo-release/mission2/d3dpoptb.exe

Mission inputs default to the adjacent ``levels`` directory in this scratch
handoff.  The probe writes nothing unless ``--output`` is supplied.
"""
import argparse
import hashlib
import json
import struct
import sys
from pathlib import Path

from unicorn import UC_HOOK_CODE
from unicorn.x86_const import UC_X86_REG_EAX, UC_X86_REG_EIP, UC_X86_REG_ESP


HERE = Path(__file__).resolve().parent
ROOT = next(path for path in [HERE, *HERE.parents] if (path / "scripts/decomp.py").is_file())
sys.path.insert(0, str(ROOT / "scripts"))
from decomp import configure_native_constants, native_cpu  # noqa: E402

parser = argparse.ArgumentParser()
parser.add_argument("exe", type=Path)
parser.add_argument("--level-dir", type=Path)
parser.add_argument("--output", type=Path)
args = parser.parse_args()
exe = args.exe.resolve()
levels = (args.level_dir or exe.parent / "levels").resolve()
paths = {
    "d3dpoptb.exe": exe,
    "constant.dat": exe.parent / "levels/constant.dat",
    "levl2016.dat": levels / "levl2016.dat",
    "levl2016.hdr": levels / "levl2016.hdr",
    "cpscr025.dat": levels / "cpscr025.dat",
    "cpscr026.dat": levels / "cpscr026.dat",
    "cpscr027.dat": levels / "cpscr027.dat",
}
expected_hashes = {
    "d3dpoptb.exe": "3a5065c7420b3fcde208bf220bc86dfbac95e025ab2492caf9c7ea5308dfbe4f",
    "constant.dat": "e905e513c798171d5540082565b8addc9f54e5851006b56e8d1976687ba42f24",
    "levl2016.dat": "d0e4aae3e9cb7794e0f1454b08cd129638eef6b3a0e3f4b800cb4a5a8006de2b",
    "levl2016.hdr": "748693a7571d36053bd45f5ba2a58f4c48e72cc9eaa35325b1257b0079873ef7",
    "cpscr025.dat": "9b240b926ace6dbef810038cfa5a1cc9620ffc819c6a53d0be45d9070a8b289e",
    "cpscr026.dat": "22ece8e21540d8ca760230842a2eed1dde60f229e1fbccf050a08701525d7bc7",
    "cpscr027.dat": "3543880f731b0ae19ad310aca57227a5e89cd2affc6e9efffdd6a6c20e4f372d",
}
hashes = {name: hashlib.sha256(path.read_bytes()).hexdigest() for name, path in paths.items()}
assert hashes == expected_hashes, hashes


def level_records():
    data = paths["levl2016.dat"].read_bytes()
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
            "position": [x, y],
            "world": [x / 256 - 8, -y / 256 - 8],
            "settings": list(raw[7:39]) if raw[1] == 6 else None,
        }


objects = {record["index"]: record for record in level_records()}


def linked(trigger):
    settings = trigger["settings"]
    links = [settings[6 + i * 2] | settings[7 + i * 2] << 8 for i in range(10)]
    return [(slot, value - 1) for slot, value in enumerate(links) if value]


assert [objects[i]["settings"][:4] for i in (4, 7)] == [[11, 20, 3, 1], [11, 20, 3, 1]]
assert linked(objects[6]) == [(0, 4)]
assert linked(objects[9]) == [(0, 7)]
assert objects[4]["world"] == [85.0, -75.0] and objects[6]["world"] == [85.0, -77.0]
assert objects[7]["world"] == [-31.0, -13.0] and objects[9]["world"] == [-33.0, -13.0]
assert all(
    sum(
        linked(candidate).count((slot, reward))
        for candidate in objects.values()
        if candidate["class"] == 6 and candidate["model"] == 6
        for slot in range(10)
    )
    == 1
    for reward in (4, 7)
)
header = paths["levl2016.hdr"].read_bytes()
assert list(header[88:92]) == [4, 25, 26, 27]


def script_data(name):
    data = paths[name].read_bytes()
    return list(struct.unpack_from("<4096H", data)), list(struct.iter_unpack("<Ii", data[8192:12288]))


codes, fields = script_data("cpscr025.dat")
assert codes[363:367] == [1006, 1174, 21, 1006] and fields[21] == (0, 3)
assert codes[366:368] == [1006, 1187]
assert codes[584:590] == [1006, 1176, 115, 1006, 1180, 1006]
assert fields[115] == (0, 66)
assert codes[589:592] == [1006, 1179, 141] and fields[141] == (0, 512)

cpu, identity = native_cpu(exe)
configure_native_constants(cpu, exe)
cpu.mem_map(0x2000000, 0x100000)
BASE, TARGET, STACK, STOP = 0x2000000, 0x20FC000, 0x20FD000, 0x20FE000


def write(address, fmt, *values):
    cpu.mem_write(address, struct.pack("<" + fmt, *values))


def read(address, fmt="I"):
    return struct.unpack("<" + fmt, cpu.mem_read(address, struct.calcsize("<" + fmt)))[0]


def invoke(address, *values):
    write(STACK, "I" * (len(values) + 1), STOP, *values)
    cpu.reg_write(UC_X86_REG_ESP, STACK)
    cpu.emu_start(address, STOP, count=1_000_000)
    assert cpu.reg_read(UC_X86_REG_EIP) == STOP
    return cpu.reg_read(UC_X86_REG_EAX) & 0xFFFFFFFF


descriptors = {}
for model in (19, 20, 21):
    raw = bytes(cpu.mem_read(0x5A80D4 + model * 62, 62))
    descriptors[str(model)] = {"cost": struct.unpack_from("<I", raw)[0], "effect": raw[36], "cap": raw[41]}
assert descriptors == {
    "19": {"cost": 60000, "effect": 82, "cap": 4},
    "20": {"cost": 999999, "effect": 87, "cap": 4},
    "21": {"cost": 999999, "effect": 88, "cap": 4},
}
constants = {
    "range": read(0x5A85C6),
    "people": read(0x5AA4E0),
    "timerX8": read(0x5AA508),
    "damageX": read(0x5AA5AC),
    "healthShift": read(0x5AA5B0),
    "firewarriorShift": read(0x5AA5B4),
}
assert constants == {"range": 4096, "people": 6, "timerX8": 180, "damageX": 3, "healthShift": 3, "firewarriorShift": 3}


def person(pointer, model=2, owner=0, flags3=0, flags4=0, x=0x4000, y=0x4000):
    cpu.mem_write(pointer, bytes(0x100))
    write(pointer + 0x2A, "BB", 1, model)
    write(pointer + 0x2F, "B", owner)
    write(pointer + 0x10, "I", flags4)
    write(pointer + 0x14, "I", flags3)
    write(pointer + 0x3D, "HHh", x, y, 0)


eligibility = []
for model in range(1, 9):
    person(BASE, model=model)
    eligibility.append(invoke(0x515650, 0, BASE) & 0xFF)
assert eligibility == [0, 1, 1, 1, 1, 1, 0, 0]
person(BASE, flags3=0x8000)
assert invoke(0x515650, 0, BASE) & 0xFF == 1
invoke(0x515690, 0, BASE)
assert read(BASE + 0x14) == 0x88000 and read(BASE + 0xB1, "B") == 180
assert invoke(0x5156B0, 0, BASE) & 0xFF == 0
person(BASE, flags3=0x80000)
assert invoke(0x5156B0, 0, BASE) & 0xFF == 1
invoke(0x5156F0, 0, BASE)
assert read(BASE + 0x14) == 0x88000 and read(BASE + 0xA5, "B") == 180
for flags4 in (0x800, 0x4000):
    person(BASE, flags4=flags4)
    assert invoke(0x515650, 0, BASE) & 0xFF == 0


def scan_case(xs):
    cpu.mem_write(0x8A03E4, bytes(0x40000))
    cpu.mem_write(0x890390, bytes(4096))
    write(TARGET, "HH", 0x4000, 0x4000)
    for unit_id, x in enumerate(xs, 1):
        pointer = BASE + unit_id * 0x100
        person(pointer, x=x)
        write(pointer + 0x20, "H", unit_id + 1 if unit_id < len(xs) else 0)
        write(pointer + 0x24, "H", unit_id)
        write(0x890390 + unit_id * 4, "I", pointer)
    cell = (0x4000 >> 9) * 128 + (0x4000 >> 9)
    write(0x8A03E4 + cell * 16 + 6, "H", 1)
    assert invoke(0x515E30, 0, TARGET, 6, 3, 0x515650, 0x515690) == 6
    return [unit_id for unit_id in range(1, len(xs) + 1) if read(BASE + unit_id * 0x100 + 0x14) & 0x80000]


nearest = scan_case([0x4000 + i * 0x20 for i in range(8)])
equal_distance = scan_case([0x4000] * 8)
assert nearest == [1, 2, 3, 4, 5, 6]
assert equal_distance == [3, 4, 5, 6, 7, 8]

damage = {}
for flags3 in (0, 0x80000, 0x8000, 0x88000):
    person(BASE, flags3=flags3)
    write(BASE + 0x6C, "hh", 1000, 1000)
    invoke(0x4DA080, BASE, 1, 96, 1)
    melee_life = read(BASE + 0x6E, "h")
    person(BASE, flags3=flags3)
    write(BASE + 0x6C, "hh", 1000, 1000)
    invoke(0x4DA080, BASE, 1, 96, 0)
    ordinary_life = read(BASE + 0x6E, "h")
    damage[hex(flags3)] = {"mode1Life": melee_life, "mode0Life": ordinary_life}
assert damage == {
    "0x0": {"mode1Life": 904, "mode0Life": 904},
    "0x80000": {"mode1Life": 988, "mode0Life": 988},
    "0x8000": {"mode1Life": 904, "mode0Life": 1000},
    "0x88000": {"mode1Life": 988, "mode0Life": 1000},
}
melee = {}
for flags3 in (0, 0x80000):
    target, attacker = BASE, BASE + 0x200
    person(target)
    person(attacker, flags3=flags3)
    write(target + 0x6C, "hh", 1000, 1000)
    write(attacker + 0x6C, "hh", 1000, 1000)
    invoke(0x4A39C0, target, attacker, 1)
    melee[hex(flags3)] = 1000 - read(target + 0x6E, "h")
assert melee == {"0x0": 60, "0x80000": 180}

# Exercise the timer epilogue in the complete person driver. Unrelated state,
# AI, movement, presentation, and cleanup callees are deliberately intercepted.
expiry_cpu, _ = native_cpu(exe)
configure_native_constants(expiry_cpu, exe)
expiry_cpu.mem_map(0x2000000, 0x100000)
intercepted = {}


def expiry_write(address, fmt, *values):
    expiry_cpu.mem_write(address, struct.pack("<" + fmt, *values))


def expiry_read(address, fmt="I"):
    return struct.unpack("<" + fmt, expiry_cpu.mem_read(address, struct.calcsize("<" + fmt)))[0]


def intercept(_cpu, address, _size, _user):
    if address == STOP or 0x4D32B0 <= address < 0x4D3EA0:
        return
    intercepted[hex(address)] = intercepted.get(hex(address), 0) + 1
    sp = expiry_cpu.reg_read(UC_X86_REG_ESP)
    expiry_cpu.reg_write(UC_X86_REG_EIP, expiry_read(sp))
    expiry_cpu.reg_write(UC_X86_REG_ESP, sp + 4)
    expiry_cpu.reg_write(UC_X86_REG_EAX, 0)


expiry_cpu.hook_add(UC_HOOK_CODE, intercept)
expiry_cpu.mem_write(BASE, bytes(0x100))
expiry_write(BASE + 0x2A, "BBB", 1, 2, 0)
expiry_write(BASE + 0x2F, "B", 0)
expiry_write(BASE + 0x14, "I", 0x80000)
expiry_write(BASE + 0xB1, "B", 180)
expiry_write(BASE + 0x6C, "hh", 1000, 1000)
visits = changes = 0
previous = 180
while expiry_read(BASE + 0x14) & 0x80000:
    expiry_write(BASE + 0x2E, "B", visits & 255)
    expiry_write(STACK, "II", STOP, BASE)
    expiry_cpu.reg_write(UC_X86_REG_ESP, STACK)
    expiry_cpu.emu_start(0x4D32B0, STOP, count=1_000_000)
    current = expiry_read(BASE + 0xB1, "B")
    changes += current != previous
    previous = current
    visits += 1
    assert visits < 2000
assert (visits, changes, expiry_read(BASE + 0xB1, "B")) == (1433, 180, 0)

result = {
    "hashes": hashes,
    "nativeIdentity": str(identity),
    "mission": {
        "scripts": list(header[88:92]),
        "rewards": [4, 7],
        "triggers": [6, 9],
        "playerMessages": [3, 66],
    },
    "descriptors": descriptors,
    "constants": constants,
    "eligibilityModels1Through8": eligibility,
    "selection": {"nearest": nearest, "equalDistanceReverseChain": equal_distance},
    "damage": damage,
    "meleeDamage": melee,
    "expiry": {"personVisits": visits, "qualifyingUpdates": changes, "interceptedLeaves": intercepted},
}
if args.output:
    args.output.write_text(json.dumps(result, indent=2, sort_keys=True) + "\n")
print(json.dumps(result, sort_keys=True))
print("PASS: Mission 16 topology, Bloodlust/Shield separation, six-nearest scan, damage and expiry")
