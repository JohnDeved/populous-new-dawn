"""Bounded, non-recording native Spy transition probe.

Usage: .tools/decomp/oracle/bin/python scripts/check-native-mission12-spy-sabotage.py /path/to/d3dpoptb.exe
"""
import json
import struct
import sys
from pathlib import Path

from unicorn import UC_HOOK_CODE
from unicorn.x86_const import UC_X86_REG_EAX, UC_X86_REG_EIP, UC_X86_REG_ESP

sys.path.insert(0, str(Path(__file__).resolve().parent))
from decomp import configure_native_constants, native_cpu  # noqa: E402


exe = Path(sys.argv[1])
cpu, identity = native_cpu(exe)
configure_native_constants(cpu, exe)
cpu.mem_map(0x2000000, 0x40000)
person, building, order = 0x2001000, 0x2002000, 0x2003000
stack, stop = 0x203D000, 0x203E000
tribe = 0x89D1C8
actions = []


def write(address, fmt, *values):
    cpu.mem_write(address, struct.pack("<" + fmt, *values))


def read(address, fmt):
    return struct.unpack("<" + fmt, cpu.mem_read(address, struct.calcsize("<" + fmt)))[0]


def call(address, *args):
    write(stack, "I" * (len(args) + 1), stop, *[value & 0xFFFFFFFF for value in args])
    cpu.reg_write(UC_X86_REG_ESP, stack)
    cpu.emu_start(address, stop, timeout=1_000_000, count=2_000_000)
    assert cpu.reg_read(UC_X86_REG_EIP) == stop, hex(cpu.reg_read(UC_X86_REG_EIP))
    return cpu.reg_read(UC_X86_REG_EAX)


def return_leaf(cpu, address, size, user):
    sp = cpu.reg_read(UC_X86_REG_ESP)
    cpu.reg_write(UC_X86_REG_EAX, 123 if address == 0x4F6020 else 0)
    cpu.reg_write(UC_X86_REG_EIP, read(sp, "I"))
    cpu.reg_write(UC_X86_REG_ESP, sp + 4)


for address in [
    0x4D5920,  # init_person; the Spy-specific initializer remains native
    0x4F6020,  # terrain height
    0x4D42A0,
    0x51FED0,
    0x4E9050,
    0x4E6D00,
    0x4E0270,  # unrelated per-person update prefixes
    0x4D4F40,
    0x4D4EE0,
    0x4EA460,
    0x40A980,  # movement/animation leaves around command 15
    0x4ED6F0,
    0x4ED640,  # building teardown/reinit leaves; 00408cb0 mutation remains native
    0x4DA170,  # invisibility reveal, separate from disguise reveal
]:
    cpu.hook_add(UC_HOOK_CODE, return_leaf, begin=address, end=address)


# Normal class-1/model-5 allocation initialization.
initial = []
for owner in range(4):
    cpu.mem_write(person, bytes(256))
    write(person + 0x2A, "BBB", 1, 5, 10)
    write(person + 0x2F, "b", owner)
    call(0x4D23D0, person)
    initial.append(
        {
            "owner": owner,
            "disguise": read(person + 0xB2, "B"),
            "apparent": call(0x4DE720, person),
            "targetBits": call(0x4DE740, person),
        }
    )


# Command 16 applies the selected apparent tribe plus the bounded delay. The
# ordinary person updater's exact prefix decrements that low-six-bit delay once.
cpu.mem_write(person, bytes(256))
write(person + 0x2A, "BBB", 1, 5, 10)
write(person + 0x2F, "b", 0)
call(0x4DE760, person, 2)
transition = []
for tick in range(64):
    transition.append(
        {
            "tick": tick,
            "disguise": read(person + 0xB2, "B"),
            "transitioning": bool(call(0x4DE700, person) & 255),
            "apparent": call(0x4DE720, person),
            "targetBits": call(0x4DE740, person),
        }
    )
    if tick == 63:
        break
    write(stack, "II", stop, person)
    cpu.reg_write(UC_X86_REG_ESP, stack)
    cpu.emu_start(0x4D32B0, 0x4D336E, timeout=1_000_000, count=200_000)
    assert cpu.reg_read(UC_X86_REG_EIP) == 0x4D336E


# Command 34 is a special UI action that distributes command 8 to a selected
# person toward a building model; it is not the Spy sabotage controller.
selected, hut = person, building
cpu.mem_write(selected, bytes(256))
cpu.mem_write(hut, bytes(256))
write(selected + 0x24, "H", 1)
write(selected + 0x2A, "BB", 1, 2)
write(selected + 0x7A, "B", 0x80)
write(hut + 0x24, "H", 100)
write(hut + 0x2A, "BB", 2, 6)
write(hut + 0x3D, "HH", 0x1200, 0x3400)
write(tribe + 0x881, "I", selected)
write(tribe + 0x885, "I", hut)
write(0x96AA78, "H", 1)
cpu.mem_write(0x938830, bytes(8000))


def command34_leaf(cpu, address, size, user):
    sp = cpu.reg_read(UC_X86_REG_ESP)
    args = struct.unpack("<4I", cpu.mem_read(sp + 4, 16))
    if address == 0x438730:
        command_id, model, data, flags = args
        target = read(data, "H")
        actions.append(["prepare", command_id & 0xFFFF, model & 255, target, flags & 255])
        write(0x938830 + (command_id & 0xFFFF) * 10, "BBHHHH", model & 255, 0, 0, 0, target, 0)
    elif address == 0x436D00:
        actions.append(["attach", read(args[0] + 0x24, "H"), args[1] & 0xFFFF])
    else:
        actions.append(["acknowledge"])
    cpu.reg_write(UC_X86_REG_EAX, 0)
    cpu.reg_write(UC_X86_REG_EIP, read(sp, "I"))
    cpu.reg_write(UC_X86_REG_ESP, sp + 4)


for address in [0x438730, 0x436D00, 0x436330]:
    cpu.hook_add(UC_HOOK_CODE, command34_leaf, begin=address, end=address)
command34_result = bool(call(0x435EF0, tribe, 6) & 255)


# Command 15's phase-3 timer destroys the addressed completed building through
# 00408cb0. Phase 4 then performs the target tribe's detection roll; force a
# 100% threshold to observe the native disguise reveal deterministically.
cpu.mem_write(person, bytes(256))
cpu.mem_write(building, bytes(256))
cpu.mem_write(order, bytes(10))
write(person + 0x24, "H", 1)
write(person + 0x2A, "BBB", 1, 5, 10)
write(person + 0x2D, "B", 3)
write(person + 0x2F, "b", 0)
write(person + 0x0C, "I", 0x40000000)
write(person + 0xB2, "B", 0x40)
write(building + 0x24, "H", 100)
write(building + 0x2A, "BBB", 2, 1, 2)
write(building + 0x2F, "b", 1)
write(0x890390 + 100 * 4, "I", building)
write(order + 6, "HH", 0x0A00, 0x1400)
cell = (0x0A & 0xFE) * 2 | (0x14 & 0xFE) << 8
write(0x8A03EC + cell * 4, "H", 100)
for _ in range(8):
    call(0x439D30, person, order)
destroyed = {
    "personPhase": read(person + 0x2D, "B"),
    "buildingState": read(building + 0x2C, "B"),
    "damageAttacker": read(building + 0xAF, "B"),
    "disguise": read(person + 0xB2, "B"),
}
write(tribe + 0xC1F, "B", 2)
write(tribe + 0xC65 + 0xC22, "B", 1)
write(0x960812 + 48, "B", 100)
write(0x89C661, "B", 0)
write(0x89D178, "I", 1)
call(0x439D30, person, order)
revealed = {
    "personPhase": read(person + 0x2D, "B"),
    "timer": read(person + 0x70, "h"),
    "disguise": read(person + 0xB2, "B"),
    "apparent": call(0x4DE720, person),
}

print(
    json.dumps(
        {
            "executableSha256": identity["sha256"],
            "spyInitialization": initial,
            "disguiseTransition": [transition[0], transition[1], transition[62], transition[63]],
            "command34": {"result": command34_result, "actions": actions},
            "command15": {"destroyed": destroyed, "revealed": revealed},
        },
        indent=2,
    )
)

assert [row["disguise"] for row in initial] == [0, 64, 128, 192]
assert [(row["tick"], row["disguise"], row["apparent"]) for row in [transition[0], transition[1], transition[62], transition[63]]] == [
    (0, 191, 0), (1, 190, 0), (62, 129, 0), (63, 128, 2)
]
assert command34_result and actions == [["prepare", 1, 8, 100, 0], ["attach", 1, 1], ["acknowledge"]]
assert destroyed == {"personPhase": 4, "buildingState": 4, "damageAttacker": 0, "disguise": 64}
assert revealed == {"personPhase": 4, "timer": 23, "disguise": 0, "apparent": 0}
print("PASS: native Spy initialization, 63-update disguise, command-34 correction, command-15 ignition and reveal")

