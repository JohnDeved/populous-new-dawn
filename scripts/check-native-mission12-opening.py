"""Probe Mission 12 turn-zero setup, first producer tasks, message, and opening flyby.

Usage:
  .tools/decomp/oracle/bin/python \
    work/orchestration/mission12-opening/native/probe-mission12-opening.py \
    work/orchestration/ceo-release/native-run/d3dpoptb.exe \
    --output work/orchestration/mission12-opening/native/probe-result.json

The original interpreter, turn-zero command handlers, AI initializer, producer, and
task writer execute natively. The producer's current-base and available-Brave reads
are supplied from the hash-verified level records. Flyby commands are intercepted.
"""
import argparse
import hashlib
import json
import struct
import sys
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
    "levl2012.dat": LEVELS / "levl2012.dat",
    "levl2012.hdr": LEVELS / "levl2012.hdr",
    "cpscr060.dat": LEVELS / "cpscr060.dat",
    "cpscr061.dat": LEVELS / "cpscr061.dat",
    "cpscr062.dat": LEVELS / "cpscr062.dat",
    "language/lang00.dat": GAME / "language/lang00.dat",
}
EXPECTED = {
    "d3dpoptb.exe": "3a5065c7420b3fcde208bf220bc86dfbac95e025ab2492caf9c7ea5308dfbe4f",
    "levl2012.dat": "9e59947f8e4c9cbdbed386f432f4fca8f080f64c197bd99a5dc569beae05114b",
    "levl2012.hdr": "d9d72fb5ee6e8bfbf1a19a6396e8d44b3caea928346622c2b398073c138a2184",
    "cpscr060.dat": "e5644f4eaaa07469eab29f36efbb17d55943786a9c3095c0c367bedd543c8e5f",
    "cpscr061.dat": "1e8b113de058229dff57234a1d2e259fc32b48cfee8e9f58a24936ceb5f47326",
    "cpscr062.dat": "6fd69dd20a8a2087241bf66e4b9a6f97c6fbd4256d44d2846644ffff0643b306",
    "language/lang00.dat": "e826c478746d666a3ea9ea36cb7804d1d226d5f83084230987b1de293066cf7d",
}
hashes = {name: hashlib.sha256(path.read_bytes()).hexdigest() for name, path in PATHS.items()}
assert hashes == EXPECTED, hashes

header = PATHS["levl2012.hdr"].read_bytes()
assert len(header) == 616 and header[88] == 4
tribe_scripts = {tribe: header[88 + tribe] for tribe in range(1, header[88])}
assert tribe_scripts == {1: 60, 2: 61, 3: 62}


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


message_string_id = struct.unpack("<H", pe_read(0x5AE310, 2))[0]
language = PATHS["language/lang00.dat"].read_bytes().decode("utf-16le").split("\0")[:-1]
message = {"number": 0, "stringId": message_string_id, "text": language[message_string_id]}
assert message == {
    "number": 0,
    "stringId": 686,
    "text": "For the first time we must face all three Enemy tribes. I must prepare for a mighty struggle.",
}

level = PATHS["levl2012.dat"].read_bytes()
marker_words = struct.unpack_from("<256H", header, 100)
terrain_heights = struct.unpack_from("<16384h", level, 0)


def marker_height(marker):
    packed = marker_words[marker]
    x = (packed & 0x00FE) >> 1
    y = (packed & 0xFE00) >> 9
    return {"marker": marker, "packed": hex(packed), "cell": [x, y], "height": terrain_heights[y * 128 + x]}


marker_height_reads = [marker_height(77), marker_height(78)]
assert marker_height_reads == [
    {"marker": 77, "packed": "0x2f2", "cell": [121, 1], "height": 447},
    {"marker": 78, "packed": "0xf8fa", "cell": [125, 124], "height": 0},
]


def records():
    for index in range(2000):
        raw = level[0x14043 + index * 55 : 0x14043 + (index + 1) * 55]
        if len(raw) != 55:
            break
        model, object_class, owner = raw[:3]
        x, y = struct.unpack_from("<HH", raw, 3)
        yield {"index": index, "model": model, "class": object_class, "owner": owner, "x": x, "y": y}


objects = list(records())


def coarse(record):
    return ((record["x"] >> 8) & 0xFE) | (record["y"] & 0xFE00)


def tribe_input(tribe):
    braves = [r for r in objects if (r["model"], r["class"], r["owner"]) == (2, 1, tribe)]
    shamans = [r for r in objects if (r["model"], r["class"], r["owner"]) == (7, 1, tribe)]
    assert len(braves) == 6 and len(shamans) == 1
    return len(braves), coarse(shamans[0]), shamans[0]["index"]


# Opcode 1190(6,88,14), via 00491350 -> 004f1fe0 -> 00499aa0, scans a
# 29-by-29 wrapped cell square and ORs byte +0x7f with 2 on class-1/model-1 records.
wild_targets = []
for record in objects:
    if (record["class"], record["model"]) != (1, 1):
        continue
    x, y = (record["x"] >> 8) & 0xFE, (record["y"] >> 8) & 0xFE
    dx, dy = min((x - 6) % 256, (6 - x) % 256), min((y - 88) % 256, (88 - y) % 256)
    if dx <= 28 and dy <= 28:
        wild_targets.append(record["index"])
assert wild_targets == [0, 1, 2, 3, 4, 5, 81, 82, 83, 84, 85, 87, 88, 89, 90, 91, 92, 93, 94, 95]


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
    assert cpu.reg_read(UC_X86_REG_EIP) == stop
    return cpu.reg_read(UC_X86_REG_EAX) & 0xFFFFFFFF


def operand(cpu, program, fields, token):
    if token >= 512:
        return {"kind": "token", "value": token}
    kind, value = fields[token]
    if kind == 0:
        return {"field": token, "kind": "constant", "value": value}
    if kind == 1:
        return {"field": token, "kind": "variable", "index": value,
                "value": read(cpu, program + 0x3000 + value * 4, "i")}
    known = None
    if 1000 <= value < 1048:
        known = "attribute"
    elif 1184 <= value <= 1199:
        known = value - 1183
    elif 1201 <= value <= 1206:
        known = value - 1199
    return {"field": token, "kind": "internal", "id": value, "knownValue": known}


def entries(cpu, ai, marker_indices, spell_indices):
    markers = []
    for index in marker_indices:
        raw = cpu.mem_read(ai + 0x476 + index * 8, 6)
        marker, secondary, *quotas = struct.unpack("<BB4b", raw)
        markers.append({"index": index, "marker": marker, "secondary": secondary, "quotas": quotas})
    spells = []
    for index in spell_indices:
        base = ai + 0x4C6 + index * 12
        mana, radius, model, people, mode = struct.unpack("<IH2xBxBB", cpu.mem_read(base, 12))
        spells.append({"index": index, "model": model, "mana": mana, "range": radius,
                       "people": people, "mode": mode})
    return markers, spells


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
        trace.append({"word": word, "opcode": opcode, "arguments": [operand(cpu, program, fields, a) for a in raw_args]})

    sound_hook = cpu.hook_add(UC_HOOK_CODE, sound, begin=0x48A050, end=0x48A050)
    command_hook = cpu.hook_add(UC_HOOK_CODE, command, begin=0x48CC60, end=0x48CC60)
    invoke(cpu, stack, stop, 0x48C6B0, ai, program)
    cpu.hook_del(command_hook)
    cpu.hook_del(sound_hook)
    attributes = list(cpu.mem_read(0x9607EA + tribe * 48, 48))
    marker_indices = [entry["arguments"][0]["value"] for entry in trace if entry["opcode"] == 1091]
    spell_indices = [entry["arguments"][0]["value"] for entry in trace if entry["opcode"] == 1108]
    marker_entries, spell_entries = entries(cpu, ai, marker_indices, spell_indices)
    active_tasks = [read(cpu, ai + 0x74 + index * 0x52) for index in range(10)]
    snapshot = {
        "tribe": tribe,
        "script": f"cpscr{script_id:03}.dat",
        "activeWords": len(codes),
        "commands": trace,
        "attributes": attributes,
        "states": hex(read(cpu, ai + 0x59A)),
        "flags": hex(read(cpu, ai + 0x596)),
        "coordinateLatch": hex(read(cpu, ai + 0x5A4, "H")),
        "markerValue": read(cpu, ai + 0x5A8, "h"),
        "defencePosition": hex(read(cpu, ai + 0x46E, "H")),
        "defenceRadius": read(cpu, ai + 0x5BE, "B"),
        "markerEntries": marker_entries,
        "spellEntries": spell_entries,
        "taskFlags": active_tasks,
        "simulationRng": hex(read(cpu, 0x89D178)),
        "audioRng": hex(read(cpu, 0x89BC72)),
        "sounds": sounds,
    }
    last = read(cpu, 0x6841E7, "b")
    if last >= 0:
        slot = 0x683B92 + last * 45
        snapshot["message"] = {
            "slot": last,
            "type": read(cpu, slot + 32, "B"),
            "stringId": read(cpu, slot + 18, "H"),
            "flags": hex(read(cpu, slot + 33)),
            "lifetime": read(cpu, slot + 16, "h"),
            "speed": read(cpu, slot + 12, "i"),
        }
    else:
        snapshot["message"] = None
    return cpu, ai, program, stack, stop, snapshot


EXPECTED_ATTRIBUTES = {
    1: [20, 0, 1, 1, 1, 0, 20, 25, 30, 3, 50, 0, 40, 25, 0, 2, 0, 35, 125, 100, 8, 0, 0, 0, 255, 3, 0, 128, 5, 0, 0, 1, 64, 5, 0, 1, 0, 5, 0, 24, 5, 1, 0, 12, 0, 0, 0, 0],
    2: [20, 1, 0, 0, 0, 5, 20, 20, 20, 4, 18, 0, 30, 30, 2, 2, 10, 40, 125, 100, 8, 0, 0, 0, 128, 3, 0, 128, 20, 1, 0, 1, 64, 4, 0, 1, 0, 7, 0, 0, 20, 1, 0, 12, 0, 0, 0, 0],
    3: [20, 0, 1, 0, 0, 0, 20, 20, 20, 4, 18, 0, 34, 34, 2, 2, 0, 34, 125, 100, 8, 0, 0, 0, 255, 3, 0, 128, 20, 1, 0, 1, 64, 4, 0, 0, 0, 7, 0, 0, 5, 1, 0, 12, 0, 0, 0, 0],
}
startups, producers = {}, []
for tribe, script_id, first_turn in ((1, 60, 62), (2, 61, 61), (3, 62, 60)):
    cpu, ai, program, stack, stop, snapshot = startup(script_id, tribe)
    assert snapshot["attributes"] == EXPECTED_ATTRIBUTES[tribe]
    assert snapshot["states"] == "0x1b8fef" and snapshot["flags"] == "0x120"
    assert snapshot["taskFlags"] == [0] * 10 and snapshot["simulationRng"] == "0x87654321"
    startups[str(tribe)] = snapshot
    available, origin, shaman_index = tribe_input(tribe)
    supplied = []

    def return_from_hook(value):
        sp = cpu.reg_read(UC_X86_REG_ESP)
        cpu.reg_write(UC_X86_REG_EAX, value & 0xFFFFFFFF)
        cpu.reg_write(UC_X86_REG_EIP, read(cpu, sp))
        cpu.reg_write(UC_X86_REG_ESP, sp + 4)

    def base_leaf(_cpu, _address, _size, _user):
        supplied.append("currentBaseCell")
        return_from_hook(origin)

    def brave_leaf(_cpu, _address, _size, _user):
        supplied.append("availableBraves")
        return_from_hook(available)

    base_hook = cpu.hook_add(UC_HOOK_CODE, base_leaf, begin=0x4F6020, end=0x4F6020)
    brave_hook = cpu.hook_add(UC_HOOK_CODE, brave_leaf, begin=0x4F67B0, end=0x4F67B0)
    write(cpu, 0x89D178, "I", 0x12345678)
    result = invoke(cpu, stack, stop, 0x4E5580, ai, 0)
    task = {
        "flags": read(cpu, ai + 0x74),
        "type": read(cpu, ai + 0x85, "B"),
        "model": read(cpu, ai + 0x68),
        "origin": hex(read(cpu, ai + 0x6C)),
        "exact": read(cpu, ai + 0x70),
        "phase": read(cpu, ai + 0x78, "H"),
    }
    assert result == 1 and task == {"flags": 1, "type": 0, "model": 4, "origin": hex(origin), "exact": 0, "phase": 0}
    assert read(cpu, 0x89D178) == 0x12345678
    # Failure case: an otherwise identical call with no available Braves retires
    # without a task and without consuming simulation RNG.
    for index in range(10):
        write(cpu, ai + 0x74 + index * 0x52, "I", 0)
    cpu.hook_del(brave_hook)

    def zero_braves(_cpu, _address, _size, _user):
        supplied.append("availableBraves=0")
        return_from_hook(0)

    zero_hook = cpu.hook_add(UC_HOOK_CODE, zero_braves, begin=0x4F67B0, end=0x4F67B0)
    write(cpu, 0x89D178, "I", 0x89ABCDEF)
    rejected = invoke(cpu, stack, stop, 0x4E5580, ai, 0)
    assert rejected == 0 and all(read(cpu, ai + 0x74 + i * 0x52) == 0 for i in range(10))
    assert read(cpu, 0x89D178) == 0x89ABCDEF
    producers.append({
        "tribe": tribe,
        "firstTurn": first_turn,
        "cadence": "(turn + signedTribe + 1) & 63 == 0",
        "availableBraves": available,
        "shamanObject": shaman_index,
        "suppliedBaseCell": hex(origin),
        "interceptedLeaves": supplied,
        "result": result,
        "task": task,
        "rngBeforeAfter": "0x12345678",
        "zeroBraveFailure": {"result": rejected, "activeTasks": 0, "rngBeforeAfter": "0x89abcdef"},
    })
    cpu.hook_del(base_hook)
    cpu.hook_del(zero_hook)


def flyby_probe():
    raw, codes, fields, commands = decode_script(60)
    fragment = [12, 1003, *codes[1318:1449], 1004, 1019]
    blob = bytearray(raw)
    blob[:8192] = bytes(8192)
    struct.pack_into("<" + "H" * len(fragment), blob, 0, *fragment)
    cpu, ai, program, stack, stop = machine()
    cpu.mem_write(ai, bytes(0xC65))
    cpu.mem_write(ai + 0xC22, b"\1")
    cpu.mem_write(program, bytes(blob))
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
        trace.append({"word": 1318 + word - 2, "opcode": opcode,
                      "arguments": [operand(cpu, program, fields, token) for token in raw_args]})
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
    assert [v["turn"] for v in visits] == [7]
    expected_opcodes = [1208, 1214] + [1209] * 6 + [1210] * 8 + [1211] * 6 + [1206]
    assert [c["opcode"] for c in visits[0]["commands"]] == expected_opcodes
    assert read(cpu, program + 0x3000 + 25 * 4, "i") == 1
    return {"sourceWords": "1318..<1449", "mask": 7, "tribe": 1, "firstTurn": 7,
            "repeatMaskTurn": 15, "latchVariable": 25, "latchAfter": 1,
            "visitsThroughTurn16": visits, "simulationRng": "unchanged (no RNG call)"}


flyby = flyby_probe()
_, _, _, _, _, suppressed = startup(60, 1, suppress_presentation=True)
assert suppressed["message"] is None and suppressed["audioRng"] == "0x12345678" and suppressed["sounds"] == []
assert startups["1"]["message"] == {
    "slot": 0, "type": 1, "stringId": 686, "flags": "0x20050", "lifetime": 0, "speed": 1205
}
assert startups["1"]["audioRng"] == "0x32be789b" and startups["1"]["sounds"] == [0xE3]

result = {
    "inputs": hashes,
    "headerTribeScripts": tribe_scripts,
    "message0": message,
    "markerHeightReads": marker_height_reads,
    "turnZero": startups,
    "firstProducerTasks": producers,
    "wildFlagCommand1190": {
        "arguments": [6, 88, 14],
        "targetObjectIndices": wild_targets,
        "effect": "OR byte +0x7f with 2 on every class-1/model-1 object in the wrapped square",
    },
    "openingFlyby": flyby,
    "presentationSuppressed": {
        "levelFlags": "0x1000000", "message": None, "audioRngBeforeAfter": "0x12345678", "sounds": []
    },
    "intercepts": {
        "startup": ["audio playback only"],
        "producer": ["004f6020 current-base cell", "004f67b0 available-Brave count"],
        "flyby": ["0048cc60 game-command dispatcher"],
    },
}
text = json.dumps(result, indent=2, sort_keys=True) + "\n"
if args.output:
    destination = args.output.resolve()
    allowed = (ROOT / "work/orchestration/mission12-opening/native").resolve()
    if destination.parent != allowed:
        raise SystemExit(f"output must be directly under {allowed}")
    destination.write_text(text)
print(text, end="")
print("PASS: Mission 12 startup, message/failure guard, first producers, and turn-7 flyby", file=sys.stderr)
