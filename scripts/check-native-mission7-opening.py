"""Compare Mission 7's bounded opening message and flyby with the original x86 VM."""
import hashlib
import json
import struct
import subprocess
import sys
from pathlib import Path

from decomp import native_cpu
from unicorn import UC_HOOK_CODE
from unicorn.x86_const import UC_X86_REG_EAX, UC_X86_REG_EIP, UC_X86_REG_ESP

ROOT = Path(__file__).resolve().parents[1]
EXE = Path(sys.argv[1])
SCRIPT_PATH = EXE.parent / "levels/cpscr021.dat"
SCRIPT = json.loads((ROOT / "app/original-script-seven.json").read_text())
assert hashlib.sha256(EXE.read_bytes()).hexdigest() == "3a5065c7420b3fcde208bf220bc86dfbac95e025ab2492caf9c7ea5308dfbe4f"
assert hashlib.sha256(SCRIPT_PATH.read_bytes()).hexdigest() == SCRIPT["sha256"]

cpu, _ = native_cpu(EXE)
cpu.mem_map(0x2000000, 0x20000)
program, tribe, stack, stop = 0x2000000, 0x2008000, 0x201D000, 0x201E000
trace = []


def read_u32(address):
    return struct.unpack("<I", cpu.mem_read(address, 4))[0]


def return_from_hook(value=1):
    pointer = cpu.reg_read(UC_X86_REG_ESP)
    cpu.reg_write(UC_X86_REG_EAX, value)
    cpu.reg_write(UC_X86_REG_EIP, read_u32(pointer))
    cpu.reg_write(UC_X86_REG_ESP, pointer + 4)


def intercept_command(_cpu, _address, _size, _user):
    pointer = read_u32(program + 0x3104)
    word = (pointer - program) // 2
    opcode = struct.unpack("<H", cpu.mem_read(pointer + 2, 2))[0]
    arity = SCRIPT["commands"][str(opcode)]
    args = list(struct.unpack("<" + "H" * arity, cpu.mem_read(pointer + 4, arity * 2))) if arity else []
    trace.append({"word": word, "opcode": opcode, "args": args})
    cpu.mem_write(program + 0x3104, struct.pack("<I", pointer + 4 + arity * 2))
    return_from_hook()


cpu.hook_add(UC_HOOK_CODE, intercept_command, begin=0x48CC60, end=0x48CC60)


def call(turn):
    cpu.mem_write(0x89D188, struct.pack("<I", turn))
    cpu.mem_write(stack, struct.pack("<III", stop, tribe, program))
    cpu.reg_write(UC_X86_REG_ESP, stack)
    cpu.emu_start(0x48C6B0, stop, timeout=100000, count=100000)
    assert cpu.reg_read(UC_X86_REG_EIP) == stop


cpu.mem_write(program, SCRIPT_PATH.read_bytes())
cpu.mem_write(tribe, bytes(0xC65))
cpu.mem_write(tribe + 0xC22, bytes([2]))
cpu.mem_write(0x9607EA + 2 * 48, bytes(48))
call(0)
assert [entry for entry in trace if entry["opcode"] in (1174, 1187)] == [
    {"word": 254, "opcode": 1174, "args": [29]},
    {"word": 257, "opcode": 1187, "args": []},
]

codes = [12, 1003, *SCRIPT["codes"][1892:1978], 1004, 1019]
blob = bytearray(12552)
struct.pack_into("<" + "H" * len(codes), blob, 0, *codes)
for index, field in enumerate(SCRIPT["fields"]):
    struct.pack_into("<Ii", blob, 8192 + index * 8, *field)
cpu.mem_write(program, bytes(blob))
visits = []
for turn in range(31):
    trace.clear()
    call(turn)
    if trace:
        visits.append((turn, [entry["opcode"] for entry in trace]))
assert visits == [(6, [1205, 1208, 1214, *([1209] * 4), *([1210] * 3), *([1211] * 4), 1206])]
assert struct.unpack("<i", cpu.mem_read(program + 0x3000 + 31 * 4, 4))[0] == 1

source = r"""
import { createWorld, tick } from './app/model.ts'
const world = createWorld(7)
for (let turn = 0; turn < 7; turn++) tick(world, 1 / 12)
const message = world.messages.slots.find(message => message?.stringId === 668)
console.log(JSON.stringify({
  message: message && { stringId: message.stringId, open: !!(message.flags & 0x20000) },
  cue: world.sounds.some(sound => sound.cue === 0xe3),
  flyby: {
    events: world.flyby.events.length,
    flags: world.flyby.flags,
    warmup: world.flyby.warmup,
    end: world.flyby.end,
    latch: world.ai.variables[31],
    inputMask: world.inputMask,
  },
}))
"""
live = json.loads(subprocess.check_output([
    "node", "--experimental-strip-types", "--input-type=module", "-e", source
], cwd=ROOT, text=True))
assert live == {
    "message": {"stringId": 668, "open": True},
    "cue": True,
    "flyby": {
        "events": 11,
        "flags": 0x15,
        "warmup": 6,
        "end": {"x": 198, "y": 228, "angle": 1200, "zoom": 0},
        "latch": 1,
        "inputMask": 0x40,
    },
}
print("PASS: native Mission 7 startup and turn-6 flyby match the live campaign path")
