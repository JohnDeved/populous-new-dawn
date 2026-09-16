"""Probe Mission 13's native turn-zero setup, message, and first flyby.

Usage:
  .tools/decomp/oracle/bin/python \
    scripts/check-native-mission13-opening.py \
    work/orchestration/ceo-release/native-run/d3dpoptb.exe \
    --output work/orchestration/mission13-opening/native/probe-result.json

The initializer, interpreter, turn-zero handlers, message allocation, and RNG run
natively. Flyby game-command dispatch is intercepted after native cadence/gates.
"""
import argparse
import hashlib
import json
import struct
import sys
from collections import Counter
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "scripts"))
from decomp import native_cpu  # noqa: E402
from unicorn import UC_HOOK_CODE  # noqa: E402
from unicorn.x86_const import UC_X86_REG_EAX, UC_X86_REG_EIP, UC_X86_REG_ESP  # noqa: E402

parser = argparse.ArgumentParser()
parser.add_argument("exe", type=Path)
parser.add_argument("--output", type=Path)
args = parser.parse_args()
EXE = args.exe.resolve()
GAME = EXE.parent
LEVELS = GAME / "levels"
PATHS = {
    "d3dpoptb.exe": EXE,
    "levl2013.dat": LEVELS / "levl2013.dat",
    "levl2013.hdr": LEVELS / "levl2013.hdr",
    "cpscr029.dat": LEVELS / "cpscr029.dat",
    "cpscr030.dat": LEVELS / "cpscr030.dat",
    "language/lang00.dat": GAME / "language/lang00.dat",
}
EXPECTED = {
    "d3dpoptb.exe": "3a5065c7420b3fcde208bf220bc86dfbac95e025ab2492caf9c7ea5308dfbe4f",
    "levl2013.dat": "5ad694a1f60e0df174ef300fb763d5fc1c48f4b520d1a743bdb1a4b930fc9c3f",
    "levl2013.hdr": "aebcd04cce2e61b5d1c275c725b6ca448c66d67b1a71f168231414609b2f75f9",
    "cpscr029.dat": "d5f2bfe673291a5a299efcb0b5f65e8e619465fad41efa0cc9a328a5658f407b",
    "cpscr030.dat": "74226e5cc971c4d34898d6d464980726001694d2ed19734920a65971ed5ff10c",
    "language/lang00.dat": "e826c478746d666a3ea9ea36cb7804d1d226d5f83084230987b1de293066cf7d",
}
hashes = {name: hashlib.sha256(path.read_bytes()).hexdigest() for name, path in PATHS.items()}
assert hashes == EXPECTED, hashes

header = PATHS["levl2013.hdr"].read_bytes()
assert len(header) == 616 and header[88] == 4
tribe_scripts = {tribe: header[88 + tribe] for tribe in range(1, header[88])}
assert tribe_scripts == {1: 30, 2: 30, 3: 29}


def level_records():
    level = PATHS["levl2013.dat"].read_bytes()
    for index in range(2000):
        raw = level[0x14043 + index * 55 : 0x14043 + (index + 1) * 55]
        if len(raw) != 55 or raw[1] == 0:
            continue
        x, y = struct.unpack_from("<hh", raw, 3)
        yield {
            "index": index,
            "model": raw[0],
            "class": raw[1],
            "owner": raw[2],
            "x": x / 256 - 8,
            "z": -y / 256 - 8,
            "settings": list(raw[7:39]) if raw[1] == 6 else None,
        }


objects = list(level_records())
people = Counter((o["owner"], o["model"]) for o in objects if o["class"] == 1)
populations = {
    "blue": {"tribe": 0, "braves": people[(0, 2)], "shamans": people[(0, 7)]},
    "red": {"tribe": 1, "braves": people[(1, 2)], "shamans": people[(1, 7)]},
    "yellow": {"tribe": 2, "braves": people[(2, 2)], "shamans": people[(2, 7)]},
    "green": {"tribe": 3, "braves": people[(3, 2)], "shamans": people[(3, 7)]},
    "wild": {"tribe": 255, "wildmen": people[(255, 1)]},
}
assert populations == {
    "blue": {"tribe": 0, "braves": 6, "shamans": 1},
    "red": {"tribe": 1, "braves": 0, "shamans": 0},
    "yellow": {"tribe": 2, "braves": 6, "shamans": 1},
    "green": {"tribe": 3, "braves": 6, "shamans": 1},
    "wild": {"tribe": 255, "wildmen": 146},
}


def linked_objects(record):
    settings = record["settings"]
    links = [settings[6 + i * 2] | settings[7 + i * 2] << 8 for i in range(10)]
    return [next(o for o in objects if o["index"] + 1 == link) for link in links if link]


knowledge = []
for trigger in (o for o in objects if o["class"] == 6 and o["model"] == 6):
    links = linked_objects(trigger)
    if not links:
        continue
    knowledge.append({
        "trigger": trigger["index"],
        "position": [trigger["x"], trigger["z"]],
        "triggerMode": trigger["settings"][0],
        "links": [
            {
                "index": linked["index"],
                "class": linked["class"],
                "model": linked["model"],
                "position": [linked["x"], linked["z"]],
                "rewardClassModel": linked["settings"][:2] if linked["class"] == 6 else None,
            }
            for linked in links
        ],
    })
assert [(site["trigger"], [link["index"] for link in site["links"]]) for site in knowledge] == [
    (5, [4]), (8, [7]), (26, [24]), (30, [27, 28]), (264, [265])
]
assert knowledge[0]["links"][0]["rewardClassModel"] == [2, 15]


def pe_read(address, size):
    blob = EXE.read_bytes()
    pe = struct.unpack_from("<I", blob, 60)[0]
    optional = struct.unpack_from("<H", blob, pe + 20)[0]
    count = struct.unpack_from("<H", blob, pe + 6)[0]
    for index in range(count):
        _, virtual_size, virtual_address, raw_size, raw = struct.unpack_from(
            "<8sIIII", blob, pe + 24 + optional + index * 40
        )
        rva = address - 0x400000
        if virtual_address <= rva and rva + size <= virtual_address + min(virtual_size, raw_size):
            return blob[raw + rva - virtual_address : raw + rva - virtual_address + size]
    raise ValueError(hex(address))


message_number = 1
message_string_id = struct.unpack("<H", pe_read(0x5AE310 + message_number * 2, 2))[0]
language = PATHS["language/lang00.dat"].read_bytes().decode("utf-16le").split("\0")[:-1]
message_text = language[message_string_id]
assert (message_string_id, message_text) == (
    688,
    "I sense a new threat\x85 an attack from the skies. I must make ready for the battle to come.",
)


def decode_script(script_id):
    raw = PATHS[f"cpscr{script_id:03}.dat"].read_bytes()
    codes = list(struct.unpack_from("<4096H", raw))
    codes = codes[: codes.index(1019) + 1]
    fields = list(struct.iter_unpack("<Ii", raw[8192:12288]))
    boundaries = {*range(1000, 1010), 1019, 1025, 1026}
    commands = {}
    for index, code in enumerate(codes):
        if code != 1006:
            continue
        end = index + 2
        while end < len(codes) and codes[end] not in boundaries:
            end += 1
        arity = end - index - 2
        opcode = codes[index + 1]
        assert opcode not in commands or commands[opcode] == arity
        commands[opcode] = arity
    return raw, codes, fields, commands


def machine():
    cpu, _ = native_cpu(EXE)
    cpu.mem_map(0x2000000, 0x60000)
    return cpu, 0x2000000, 0x2010000, 0x205D000, 0x205E000


def write(cpu, address, fmt, *values):
    cpu.mem_write(address, struct.pack("<" + fmt, *values))


def read(cpu, address, fmt="I"):
    return struct.unpack("<" + fmt, cpu.mem_read(address, struct.calcsize("<" + fmt)))[0]


def invoke(cpu, stack, stop, address, *values):
    write(cpu, stack, "I" * (len(values) + 1), stop, *values)
    cpu.reg_write(UC_X86_REG_ESP, stack)
    cpu.emu_start(address, stop, count=1_000_000)
    assert cpu.reg_read(UC_X86_REG_EIP) == stop, hex(cpu.reg_read(UC_X86_REG_EIP))
    return cpu.reg_read(UC_X86_REG_EAX) & 0xFFFFFFFF


def operand(cpu, ai, program, fields, tribe, token):
    if token >= 512:
        return token
    kind, value = fields[token]
    if kind == 0:
        return value
    if kind == 1:
        return read(cpu, program + 0x3000 + value * 4, "i")
    if 1000 <= value < 1048:
        return read(cpu, 0x9607EA + tribe * 48 + value - 1000, "B")
    return {"internal": value}


def startup(script_id, tribe, suppress_presentation=False):
    raw, codes, fields, commands = decode_script(script_id)
    cpu, ai, program, stack, stop = machine()
    cpu.mem_write(ai, bytes(0xC65))
    cpu.mem_write(ai + 0xC22, bytes([tribe]))
    invoke(cpu, stack, stop, 0x461D70, ai)
    cpu.mem_write(program, raw)
    cpu.mem_write(0x683B70, bytes(0x680))
    write(cpu, 0x6841E7, "b", -1)
    write(cpu, 0x6841E8, "H", 0)
    write(cpu, 0x89C6D1, "I", 480)
    write(cpu, 0x89C669, "I", 0x1000000 if suppress_presentation else 0)
    write(cpu, 0x89D188, "I", 0)
    write(cpu, 0x89D178, "I", 0x87654321)
    write(cpu, 0x89BC72, "I", 0x12345678)
    sounds, trace = [], []

    def sound(_cpu, _address, _size, _user):
        sp = cpu.reg_read(UC_X86_REG_ESP)
        sounds.append(read(cpu, sp + 8))
        cpu.reg_write(UC_X86_REG_EIP, read(cpu, sp))
        cpu.reg_write(UC_X86_REG_ESP, sp + 4)

    def command(_cpu, _address, _size, _user):
        pointer = read(cpu, program + 0x3104)
        word = (pointer - program) // 2
        opcode = read(cpu, pointer + 2, "H")
        arity = commands[opcode]
        raw_args = list(struct.unpack("<" + "H" * arity, cpu.mem_read(pointer + 4, arity * 2))) if arity else []
        trace.append({
            "word": word,
            "opcode": opcode,
            "arguments": [operand(cpu, ai, program, fields, tribe, token) for token in raw_args],
        })

    sound_hook = cpu.hook_add(UC_HOOK_CODE, sound, begin=0x48A050, end=0x48A050)
    command_hook = cpu.hook_add(UC_HOOK_CODE, command, begin=0x48CC60, end=0x48CC60)
    invoke(cpu, stack, stop, 0x48C6B0, ai, program)
    cpu.hook_del(command_hook)
    cpu.hook_del(sound_hook)
    last = read(cpu, 0x6841E7, "b")
    message = None
    if last >= 0:
        slot = 0x683B92 + last * 45
        message = {
            "slot": last,
            "type": read(cpu, slot + 32, "B"),
            "stringId": read(cpu, slot + 18, "H"),
            "flags": hex(read(cpu, slot + 33)),
            "lifetime": read(cpu, slot + 16, "h"),
            "speed": read(cpu, slot + 12, "i"),
        }
    snapshot = {
        "tribe": tribe,
        "script": f"cpscr{script_id:03}.dat",
        "commands": trace,
        "attributes": list(cpu.mem_read(0x9607EA + tribe * 48, 48)),
        "states": hex(read(cpu, ai + 0x59A)),
        "flags": hex(read(cpu, ai + 0x596)),
        "coordinateLatch": hex(read(cpu, ai + 0x5A4, "H")),
        "markerValue": read(cpu, ai + 0x5A8, "h"),
        "defencePosition": hex(read(cpu, ai + 0x46E, "H")),
        "defenceRadius": read(cpu, ai + 0x5BE, "B"),
        "variables": list(struct.unpack("<64i", cpu.mem_read(program + 0x3000, 256))),
        "message": message,
        "simulationRng": hex(read(cpu, 0x89D178)),
        "audioRng": hex(read(cpu, 0x89BC72)),
        "sounds": sounds,
    }
    return cpu, ai, program, stack, stop, fields, commands, snapshot


_, _, _, _, _, _, _, yellow = startup(30, 2)
_, _, _, _, _, _, _, green = startup(29, 3)
_, _, _, _, _, _, _, suppressed = startup(30, 2, suppress_presentation=True)
EXPECTED_ATTRIBUTES = {
    2: [20, 0, 0, 0, 0, 7, 15, 15, 20, 4, 18, 0, 40, 25, 10, 3, 0, 35, 150, 0, 0, 8, 0, 0, 128, 3, 0, 128, 20, 1, 0, 1, 128, 5, 0, 0, 0, 0, 7, 0, 10, 1, 0, 12, 0, 0, 0, 0],
    3: [30, 0, 0, 0, 0, 5, 20, 20, 20, 4, 18, 0, 40, 25, 2, 2, 0, 35, 125, 0, 8, 0, 0, 0, 128, 3, 0, 128, 20, 1, 0, 1, 64, 4, 0, 0, 0, 7, 0, 0, 15, 1, 0, 12, 0, 0, 0, 0],
}
assert yellow["attributes"] == EXPECTED_ATTRIBUTES[2]
assert green["attributes"] == EXPECTED_ATTRIBUTES[3]
assert (yellow["states"], yellow["flags"], yellow["coordinateLatch"], yellow["defenceRadius"]) == (
    "0x1b8bef", "0x30", "0xac8a", 11
)
assert (green["states"], green["flags"], green["coordinateLatch"], green["defenceRadius"]) == (
    "0x1b8bef", "0x30", "0xbab0", 11
)
assert yellow["variables"] == [0] * 64
assert green["variables"] == [0, 10] + [0] * 62
assert yellow["message"] == {
    "slot": 0, "type": 1, "stringId": 688, "flags": "0x20050", "lifetime": 0, "speed": 1205
}
assert yellow["audioRng"] == "0x32be789b" and yellow["sounds"] == [0xE3]
assert suppressed["message"] is None and suppressed["audioRng"] == "0x12345678" and suppressed["sounds"] == []
assert green["message"] is None and yellow["simulationRng"] == green["simulationRng"] == "0x87654321"


def flyby_probe():
    raw, codes, fields, commands = decode_script(30)
    fragment = [12, 1003, *codes[1655:1808], 1004, 1019]
    blob = bytearray(raw)
    blob[:8192] = bytes(8192)
    struct.pack_into("<" + "H" * len(fragment), blob, 0, *fragment)
    cpu, ai, program, stack, stop = machine()
    cpu.mem_write(ai, bytes(0xC65))
    cpu.mem_write(ai + 0xC22, b"\2")
    invoke(cpu, stack, stop, 0x461D70, ai)
    cpu.mem_write(program, bytes(blob))
    # Script 30's flyby reads attribute 18, set to 150 by its turn-zero branch.
    cpu.mem_write(0x9607EA + 2 * 48 + 18, b"\x96")
    trace = []

    def ret():
        sp = cpu.reg_read(UC_X86_REG_ESP)
        cpu.reg_write(UC_X86_REG_EAX, 1)
        cpu.reg_write(UC_X86_REG_EIP, read(cpu, sp))
        cpu.reg_write(UC_X86_REG_ESP, sp + 4)

    def intercept(_cpu, _address, _size, _user):
        pointer = read(cpu, program + 0x3104)
        word = (pointer - program) // 2
        opcode = read(cpu, pointer + 2, "H")
        arity = commands[opcode]
        raw_args = list(struct.unpack("<" + "H" * arity, cpu.mem_read(pointer + 4, arity * 2))) if arity else []
        trace.append({
            "word": 1655 + word - 2,
            "opcode": opcode,
            "arguments": [operand(cpu, ai, program, fields, 2, token) for token in raw_args],
        })
        write(cpu, program + 0x3104, "I", pointer + 4 + arity * 2)
        ret()

    hook = cpu.hook_add(UC_HOOK_CODE, intercept, begin=0x48CC60, end=0x48CC60)
    visits = []
    for turn in range(17):
        trace.clear()
        write(cpu, 0x89D188, "I", turn)
        invoke(cpu, stack, stop, 0x48C6B0, ai, program)
        if trace:
            visits.append({"turn": turn, "commands": list(trace)})
    cpu.hook_del(hook)
    assert [visit["turn"] for visit in visits] == [6], [visit["turn"] for visit in visits]
    assert [command["opcode"] for command in visits[0]["commands"]] == (
        [1208, 1214] + [1209] * 8 + [1210] * 8 + [1211] * 8 + [1206]
    )
    assert read(cpu, program + 0x3000 + 11 * 4, "i") == 1
    return {
        "sourceWords": "1655..<1808",
        "mask": 7,
        "tribe": 2,
        "firstTurn": 6,
        "repeatMaskTurn": 14,
        "latchVariable": 11,
        "latchAfter": 1,
        "visitsThroughTurn16": visits,
        "simulationRng": "unchanged (no RNG call)",
    }


flyby = flyby_probe()
result = {
    "inputs": hashes,
    "headerTribeScripts": tribe_scripts,
    "populations": populations,
    "knowledgeLinks": knowledge,
    "message1": {"number": 1, "stringId": message_string_id, "text": message_text},
    "turnZero": {"2": yellow, "3": green},
    "openingFlyby": flyby,
    "presentationSuppressed": {
        "levelFlags": "0x1000000", "message": None, "audioRngBeforeAfter": "0x12345678", "sounds": []
    },
    "intercepts": {
        "turnZero": ["0048a050 audio playback only"],
        "flyby": ["0048cc60 game-command dispatcher"],
    },
}
text = json.dumps(result, indent=2, sort_keys=True) + "\n"
if args.output:
    destination = args.output.resolve()
    allowed = (ROOT / "work/orchestration/mission13-opening/native").resolve()
    if destination.parent != allowed:
        raise SystemExit(f"output must be directly under {allowed}")
    destination.write_text(text)
print(text, end="")
print("PASS: Mission 13 inputs, linked knowledge, turn-zero message, and turn-6 flyby", file=sys.stderr)
