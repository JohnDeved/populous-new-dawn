"""Execute Mission 10's bounded Totem and deadline-failure native script branches.

Usage: .tools/decomp/oracle/bin/python scripts/check-native-mission10-opening.py /path/to/d3dpoptb.exe
The PopScript game-command host is intercepted; the timer leaf executes natively.
"""
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

if len(sys.argv) != 2:
    raise SystemExit("Usage: check-native-mission10-opening.py /path/to/d3dpoptb.exe")
EXE = Path(sys.argv[1]).resolve()
GAME = EXE.parent
LEVEL = GAME / "levels/levl2010.dat"
HEADER = GAME / "levels/levl2010.hdr"
SCRIPT = GAME / "levels/cpscr059.dat"
EXPECTED = {
    EXE: "3a5065c7420b3fcde208bf220bc86dfbac95e025ab2492caf9c7ea5308dfbe4f",
    LEVEL: "0b0e073e0214597db814d3b69ba565127ea3df58cf5f46e6796466b7059c9f5d",
    HEADER: "2576ff6cddb23ff12afe86c9fc5b8680a035947f1f1e583568c95ea8be4f7bbb",
    SCRIPT: "d37b2af43edc9adb7b7d5b53cdba13b85967ac2c57c0f9fe87e9b0df31cb5a2f",
}
for path, digest in EXPECTED.items():
    assert hashlib.sha256(path.read_bytes()).hexdigest() == digest, path

header = HEADER.read_bytes()
assert len(header) == 616 and header[88:90] == bytes([4, 59])
script_bytes = SCRIPT.read_bytes()
all_codes = list(struct.unpack_from("<4096H", script_bytes))
codes = all_codes[: all_codes.index(1019) + 1]
fields = list(struct.iter_unpack("<Ii", script_bytes[8192:12288]))
boundaries = {*range(1000, 1010), 1019, 1025, 1026}
commands = {}
for index, code in enumerate(codes):
    if code != 1006:
        continue
    opcode = codes[index + 1]
    end = index + 2
    while end < len(codes) and codes[end] not in boundaries:
        end += 1
    commands[opcode] = end - index - 2

level = LEVEL.read_bytes()
def record(index):
    raw = level[0x14043 + index * 55:0x14043 + (index + 1) * 55]
    x, y = struct.unpack_from("<HH", raw, 3)
    return {"index": index, "class": raw[1], "model": raw[0], "owner": raw[2], "x": x, "y": y}

def worship_record(index):
    result = record(index)
    raw = level[0x14043 + index * 55:0x14043 + (index + 1) * 55]
    settings = raw[7:39]
    result.update({
        "remaining": settings[3],
        "required": struct.unpack_from("<h", settings, 4)[0],
        "linksOneBased": [
            struct.unpack_from("<H", settings, 6 + i * 2)[0]
            for i in range(10)
            if struct.unpack_from("<H", settings, 6 + i * 2)[0]
        ],
        "target": struct.unpack_from("<h", settings, 26)[0],
    })
    return result

trigger_raw = level[0x14043 + 119 * 55:0x14043 + 120 * 55]
settings = trigger_raw[7:39]
links = [settings[6 + i * 2] | settings[7 + i * 2] << 8 for i in range(10)]
links = [link for link in links if link]
assert links == [145, 147, 146, 59, 60]
linked = [record(link - 1) for link in links]
assert [(entry["class"], entry["model"]) for entry in linked] == [(7, 90), (7, 26), (7, 26), (6, 6), (5, 9)]
assert settings[3] == 1 and struct.unpack_from("<h", settings, 4)[0] == 2
assert struct.unpack_from("<h", settings, 26)[0] == 64
boat = record(109)
assert (boat["class"], boat["model"], boat["owner"]) == (4, 1, 0)

cpu, _ = native_cpu(EXE)
messages = json.loads((ROOT / "app/original-messages.json").read_text())
for message_number, string_id in ((57, 679), (58, 680), (59, 681), (131, 682)):
    assert struct.unpack("<H", cpu.mem_read(0x5AE310 + message_number * 2, 2))[0] == string_id
    assert messages["messages"][str(message_number)]["stringId"] == string_id
cpu.mem_map(0x2000000, 0x20000)
program, tribe, stack, stop = 0x2000000, 0x2008000, 0x201D000, 0x201E000
trace = []
scenario = {"head": 1, "timer": 0}

def read_u32(address):
    return struct.unpack("<I", cpu.mem_read(address, 4))[0]

def return_from_hook(value=1):
    pointer = cpu.reg_read(UC_X86_REG_ESP)
    cpu.reg_write(UC_X86_REG_EAX, value)
    cpu.reg_write(UC_X86_REG_EIP, read_u32(pointer))
    cpu.reg_write(UC_X86_REG_ESP, pointer + 4)

def resolve(token):
    if token >= len(fields):
        return token
    kind, value = fields[token]
    if kind == 0:
        return value
    if kind == 1:
        return struct.unpack("<i", cpu.mem_read(program + 0x3000 + value * 4, 4))[0]
    return value

def intercept_command(_cpu, _address, _size, _user):
    pointer = read_u32(program + 0x3104)
    word = (pointer - program) // 2
    opcode = struct.unpack("<H", cpu.mem_read(pointer + 2, 2))[0]
    arity = commands[opcode]
    args = list(struct.unpack("<" + "H" * arity, cpu.mem_read(pointer + 4, arity * 2))) if arity else []
    trace.append({"word": word, "opcode": opcode, "args": args, "values": [resolve(arg) for arg in args]})
    if opcode == 1131:
        _, variable = fields[args[-1]]
        cpu.mem_write(program + 0x3000 + variable * 4, struct.pack("<i", scenario["head"]))
    elif opcode == 1202:
        _, variable = fields[args[-1]]
        cpu.mem_write(program + 0x3000 + variable * 4, struct.pack("<i", scenario["timer"]))
    cpu.mem_write(program + 0x3104, struct.pack("<I", pointer + 4 + arity * 2))
    return_from_hook()

hook = cpu.hook_add(UC_HOOK_CODE, intercept_command, begin=0x48CC60, end=0x48CC60)

fragment = [12, 1003, *codes[391:528], 1004, 1019]
blob = bytearray(script_bytes)
blob[:8192] = bytes(8192)
struct.pack_into("<" + "H" * len(fragment), blob, 0, *fragment)

def run_branch(turn, remaining, latch=0):
    scenario["head"] = remaining
    trace.clear()
    cpu.mem_write(program, bytes(blob))
    cpu.mem_write(program + 0x3000 + 9 * 4, struct.pack("<i", latch))
    cpu.mem_write(tribe, bytes(0xC65))
    cpu.mem_write(tribe + 0xC22, bytes([3]))
    cpu.mem_write(0x89D188, struct.pack("<I", turn))
    cpu.mem_write(stack, struct.pack("<III", stop, tribe, program))
    cpu.reg_write(UC_X86_REG_ESP, stack)
    cpu.emu_start(0x48C6B0, stop, timeout=100000, count=100000)
    assert cpu.reg_read(UC_X86_REG_EIP) == stop
    variables = struct.unpack("<64i", cpu.mem_read(program + 0x3000, 256))
    return {"turn": turn, "remaining": remaining, "initialLatch": latch,
            "commands": list(trace), "v7": variables[7], "v9": variables[9]}

ineligible = run_branch(4, 0)
waiting = run_branch(5, 1)
fired = run_branch(5, 0)
assert ineligible["commands"] == []
assert [entry["opcode"] for entry in waiting["commands"]] == [1131]
assert [entry["opcode"] for entry in fired["commands"]] == [
    1131, 1038, 1066, 1093, 1092, 1097, 1097, 1205, 1208,
    1209, 1209, 1209, 1209, 1210, 1210, 1210, 1211, 1211, 1211,
    1214, 1206, 1200,
]
assert (fired["v7"], fired["v9"]) == (1, 1)

# The exact second-Totem success block ends before the independent Shaman-loss
# watchdog. Keep the VM state between countdown evaluations just as the live
# recurring script does.
second = worship_record(58)
assert second == {
    "index": 58,
    "class": 6,
    "model": 6,
    "owner": 0,
    "x": 0x0300,
    "y": 0xE300,
    "remaining": 1,
    "required": 2,
    "linksOneBased": [52, 58, 57, 51, 56, 55, 54, 53, 30, 29],
    "target": 64,
}
forced = worship_record(39)
marker20 = struct.unpack_from("<256H", header, 100)[20]
assert (forced["class"], forced["model"], forced["x"], forced["y"]) == (6, 6, 0x8100, 0x4700)
assert marker20 == 0x4680

second_fragment = [12, 1003, *codes[528:633], 1004, 1019]
second_blob = bytearray(script_bytes)
second_blob[:8192] = bytes(8192)
struct.pack_into("<" + "H" * len(second_fragment), second_blob, 0, *second_fragment)

def initialize_second(v6=0, v9=1, v18=0):
    cpu.mem_write(program, bytes(second_blob))
    variables = [0] * 64
    variables[6], variables[9], variables[18] = v6, v9, v18
    cpu.mem_write(program + 0x3000, struct.pack("<64i", *variables))

def run_second(turn, remaining, clear=True):
    scenario["head"] = remaining
    if clear:
        trace.clear()
    cpu.mem_write(tribe, bytes(0xC65))
    cpu.mem_write(tribe + 0xC22, bytes([3]))
    cpu.mem_write(0x89D188, struct.pack("<I", turn))
    cpu.mem_write(stack, struct.pack("<III", stop, tribe, program))
    cpu.reg_write(UC_X86_REG_ESP, stack)
    cpu.emu_start(0x48C6B0, stop, timeout=100000, count=100000)
    assert cpu.reg_read(UC_X86_REG_EIP) == stop
    variables = struct.unpack("<64i", cpu.mem_read(program + 0x3000, 256))
    return {
        "turn": turn,
        "remaining": remaining,
        "commands": list(trace),
        "v6": variables[6],
        "v9": variables[9],
        "v18": variables[18],
    }

initialize_second()
second_ineligible = run_second(14, 0)
initialize_second()
second_waiting = run_second(15, 1)
initialize_second()
second_fired = run_second(15, 0)
assert second_ineligible["commands"] == []
assert [entry["opcode"] for entry in second_waiting["commands"]] == [1131]
assert [entry["opcode"] for entry in second_fired["commands"]] == [
    1131, 1201, 1205, 1208, 1209, 1209, 1209, 1210, 1210, 1210, 1214, 1206,
]
assert (second_fired["v6"], second_fired["v9"], second_fired["v18"]) == (1, 1, 63)

for turn in range(16, 79):
    second_countdown = run_second(turn, 0)
assert second_countdown["v18"] == 0
assert [entry["opcode"] for entry in second_countdown["commands"]] == [1151]
assert second_countdown["commands"][0]["values"] == [20]

# Deadline expiry is a separate recurring block. It polls the native timer at
# turn 1 mod 16, presents the authored loss, sinks three heads, and requests
# player defeat only after its flyby is queued.
deadline_fragment = [12, 1003, *codes[647:722], 1004, 1019]
deadline_blob = bytearray(script_bytes)
deadline_blob[:8192] = bytes(8192)
struct.pack_into("<" + "H" * len(deadline_fragment), deadline_blob, 0, *deadline_fragment)

def run_deadline(turn, complete, latch=1):
    scenario["timer"] = complete
    trace.clear()
    cpu.mem_write(program, bytes(deadline_blob))
    variables = [0] * 64
    variables[9] = latch
    cpu.mem_write(program + 0x3000, struct.pack("<64i", *variables))
    cpu.mem_write(tribe, bytes(0xC65))
    cpu.mem_write(tribe + 0xC22, bytes([3]))
    cpu.mem_write(0x89D188, struct.pack("<I", turn))
    cpu.mem_write(stack, struct.pack("<III", stop, tribe, program))
    cpu.reg_write(UC_X86_REG_ESP, stack)
    cpu.emu_start(0x48C6B0, stop, timeout=100000, count=100000)
    assert cpu.reg_read(UC_X86_REG_EIP) == stop
    variables = struct.unpack("<64i", cpu.mem_read(program + 0x3000, 256))
    return {"turn": turn, "timerComplete": complete, "initialLatch": latch,
            "commands": list(trace), "v8": variables[8], "v9": variables[9]}

deadline_ineligible = run_deadline(0, 1)
deadline_waiting = run_deadline(1, 0)
deadline_fired = run_deadline(1, 1)
assert deadline_ineligible["commands"] == []
assert [entry["opcode"] for entry in deadline_waiting["commands"]] == [1202]
assert (deadline_waiting["v8"], deadline_waiting["v9"]) == (0, 1)
assert [entry["opcode"] for entry in deadline_fired["commands"]] == [
    1202, 1176, 1187, 1180, 1222, 1151, 1151, 1151, 1205, 1208,
    1209, 1210, 1210, 1214, 1206, 1169,
]
assert [entry["values"] for entry in deadline_fired["commands"]] == [
    [0], [131], [], [], [1023], [24], [25], [26], [], [1023],
    [2, 66, 2, 23], [1632, 1, 15], [296, 17, 6], [36, 54, 1646, 0], [], [],
]
assert (deadline_fired["v8"], deadline_fired["v9"]) == (1, 2)

cpu.hook_del(hook)
def call(address, *args):
    cpu.mem_write(stack, struct.pack("<" + "I" * (len(args) + 1), stop, *args))
    cpu.reg_write(UC_X86_REG_ESP, stack)
    cpu.emu_start(address, stop, timeout=100000, count=100000)
    assert cpu.reg_read(UC_X86_REG_EIP) == stop
    return cpu.reg_read(UC_X86_REG_EAX)

# Execute the two result-owner leaves rather than inferring them from names.
cpu.mem_write(program, struct.pack("<3H", 1006, 1222, 1023))
cpu.mem_write(program + 0x3104, struct.pack("<I", program))
cpu.mem_write(0x89C669, struct.pack("<I", 0))
call(0x48CC60, tribe, program)
assert read_u32(0x89C669) & 0x1000000

cpu.mem_write(program, struct.pack("<2H", 1006, 1169))
cpu.mem_write(program + 0x3104, struct.pack("<I", program))
cpu.mem_write(0x89C6F0, b"\0")
cpu.mem_write(0x89DB05, struct.pack("<I", 0))
call(0x48CC60, tribe, program)
assert read_u32(0x89DB05) & 0x20000

cpu.mem_write(0x89C661, b"\0")
call(0x4A5D20, 12 * 480, 1)
assert call(0x4A5EC0) == 0
for _ in range(12 * 480 - 1):
    call(0x4A5D40)
assert call(0x4A5EC0) == 0
call(0x4A5D40)
assert call(0x4A5EC0) == 1
call(0x4A5EB0)
call(0x4A5EE0)
assert call(0x4A5EC0) == 0

print(json.dumps({
    "hashes": {str(path.relative_to(ROOT)): digest for path, digest in EXPECTED.items()},
    "script": {
        "words": len(codes),
        "firstTotem": {"slice": "391..<528", "eligibleTurnModulo16": 5,
                       "ineligible": ineligible, "waiting": waiting, "fired": fired},
        "secondTotem": {"slice": "528..<633", "eligibleTurnModulo16": 15,
                        "ineligible": second_ineligible, "waiting": second_waiting,
                        "fired": second_fired, "countdownEvaluationsIncludingFire": 64,
                        "countdownResult": second_countdown},
        "deadlineFailure": {"slice": "647..<722", "eligibleTurnModulo16": 1,
                            "ineligible": deadline_ineligible,
                            "waiting": deadline_waiting, "fired": deadline_fired,
                            "timerCompletionToBranchTurns": 12,
                            "levelFlag": "0x01000000",
                            "playerDefeatRequest": "0x00020000"},
    },
    "trigger119": {"record": record(119), "remaining": settings[3], "required": 2,
                   "target": 64, "linksOneBased": links, "linkedRecords": linked},
    "boat109": boat,
    "secondTotem58": second,
    "postTotemHead": {"marker": 20, "packed": marker20, "record": forced},
    "messages": {"57": 679, "58": 680, "59": 681, "131": 682},
    "timer": {"seconds": 480, "turnsPerSecond": 12, "nativeTicks": 5760,
              "completionAfterTicks": 5760, "clearRestoresIncomplete": True},
}, indent=2))
print("PASS: Mission 10 Totem branches, deadline failure, and native 480-second timer leaf")
