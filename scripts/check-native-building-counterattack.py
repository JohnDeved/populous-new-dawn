"""Exercise 0040bce0's occupied-building counterattack branch with deep leaves intercepted."""

import hashlib
import json
import struct
import sys
from pathlib import Path

from unicorn import UC_HOOK_CODE
from unicorn.x86_const import UC_X86_REG_EAX, UC_X86_REG_EIP, UC_X86_REG_ESP


ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "scripts"))
from decomp import native_cpu  # noqa: E402


EXE_HASH = "3a5065c7420b3fcde208bf220bc86dfbac95e025ab2492caf9c7ea5308dfbe4f"
ENTRY, STACK, STOP = 0x40BCE0, 0x201D000, 0x201E000
BUILDING, OCCUPANT, HOSTILE, DEFENDER = 0x2000000, 0x2001000, 0x2002000, 0x2003000
BUILDING_ID, OCCUPANT_ID, HOSTILE_ID, DEFENDER_ID = 90, 91, 92, 93
OBJECTS = 0x890390
TRIBE, TRIBE_STRIDE = 3, 0xC65
TRIBE_PEOPLE, TRIBE_BUILDINGS = 0x89DA49 + TRIBE * TRIBE_STRIDE, 0x89DA4D + TRIBE * TRIBE_STRIDE


def write(cpu, address, fmt, *values):
    cpu.mem_write(address, struct.pack("<" + fmt, *values))


def read(cpu, address, fmt):
    return struct.unpack("<" + fmt, cpu.mem_read(address, struct.calcsize("<" + fmt)))[0]


def return_from_leaf(cpu, eax=0):
    sp = cpu.reg_read(UC_X86_REG_ESP)
    cpu.reg_write(UC_X86_REG_EAX, eax)
    cpu.reg_write(UC_X86_REG_EIP, read(cpu, sp, "I"))
    cpu.reg_write(UC_X86_REG_ESP, sp + 4)


def main(executable):
    executable = Path(executable)
    assert hashlib.sha256(executable.read_bytes()).hexdigest() == EXE_HASH
    cpu, identity = native_cpu(executable)
    cpu.mem_map(0x2000000, 0x20000)

    # One occupied tribe-3 building, one hostile in its search tile, and one
    # tribe-3 defender in the same tile and the tribe people list.
    for address in (BUILDING, OCCUPANT, HOSTILE, DEFENDER):
        cpu.mem_write(address, bytes(0xC0))
    write(cpu, TRIBE_BUILDINGS, "I", BUILDING)
    write(cpu, TRIBE_PEOPLE, "I", DEFENDER)
    write(cpu, BUILDING + 8, "I", 0)
    write(cpu, BUILDING + 0x2B, "B", 4)
    write(cpu, BUILDING + 0x2F, "B", TRIBE)
    write(cpu, BUILDING + 0xA6, "B", 1)
    write(cpu, BUILDING + 0x86, "H", OCCUPANT_ID)
    for address, object_id, tribe in (
        (OCCUPANT, OCCUPANT_ID, TRIBE),
        (HOSTILE, HOSTILE_ID, 0),
        (DEFENDER, DEFENDER_ID, TRIBE),
    ):
        write(cpu, OBJECTS + object_id * 4, "I", address)
        write(cpu, address + 8, "I", 0)
        write(cpu, address + 0x0C, "I", 0)
        write(cpu, address + 0x11, "B", 0)
        write(cpu, address + 0x14, "I", 0)
        write(cpu, address + 0x20, "H", 0)
        write(cpu, address + 0x2A, "B", 1)
        write(cpu, address + 0x2B, "B", 3)
        write(cpu, address + 0x2C, "B", 2)
        write(cpu, address + 0x2F, "B", tribe)
        write(cpu, address + 0x6E, "h", 1)
        write(cpu, address + 0x9F, "h", 0)

    # Zero-radius iterator outputs address tile zero. The hook swaps that tile's
    # object head between the hostile-detection and defender-selection passes.
    write(cpu, 0x5A7378, "B", 0)
    write(cpu, 0x5A6F7A + 5 * 2, "B", 0x10)
    write(cpu, 0x8A03EA, "H", HOSTILE_ID)
    write(cpu, 0x895EC1, "I", 0x2008000)
    write(cpu, 0x59DF3C, "I", 0x2009000)

    iterator = {"session": 0, "calls": 0}
    cleared, prepared, attached = [], [], []

    def allocate_iterator(uc, _address, _size, _user):
        iterator["session"] += 1
        iterator["calls"] = 0
        return_from_leaf(uc, iterator["session"])

    def next_xy(uc, _address, _size, _user):
        sp = uc.reg_read(UC_X86_REG_ESP)
        iterator["calls"] += 1
        if iterator["calls"] == 1:
            write(uc, read(uc, sp + 8, "I"), "I", 0)
            write(uc, read(uc, sp + 12, "I"), "I", 0)
            write(uc, 0x8A03EA, "H", HOSTILE_ID if iterator["session"] == 1 else DEFENDER_ID)
            return_from_leaf(uc, 1)
        else:
            return_from_leaf(uc, 0)

    def clear_iterator(uc, _address, _size, _user):
        cleared.append(read(uc, uc.reg_read(UC_X86_REG_ESP) + 4, "I"))
        return_from_leaf(uc)

    def false_leaf(uc, _address, _size, _user):
        return_from_leaf(uc, 0)

    def allocate_order(uc, _address, _size, _user):
        return_from_leaf(uc, 7)

    def prepare_order(uc, _address, _size, _user):
        sp = uc.reg_read(UC_X86_REG_ESP)
        payload = read(uc, sp + 12, "I")
        prepared.append({
            "id": read(uc, sp + 4, "I"),
            "model": read(uc, sp + 8, "I"),
            "payload": cpu.mem_read(payload, 4).hex(),
            "flags": read(uc, sp + 16, "I"),
        })
        return_from_leaf(uc)

    def attach_order(uc, _address, _size, _user):
        sp = uc.reg_read(UC_X86_REG_ESP)
        attached.append({
            "person": hex(read(uc, sp + 4, "I")),
            "id": read(uc, sp + 8, "I"),
            "slot": read(uc, sp + 12, "I"),
        })
        return_from_leaf(uc)

    for address, callback in (
        (0x49A2F0, allocate_iterator),
        (0x49A3F0, next_xy),
        (0x49A5D0, clear_iterator),
        (0x416D70, false_leaf),
        (0x4DE7B0, false_leaf),
        (0x436C20, allocate_order),
        (0x438730, prepare_order),
        (0x436D00, attach_order),
    ):
        cpu.hook_add(UC_HOOK_CODE, callback, begin=address, end=address)

    write(cpu, STACK, "II", STOP, TRIBE)
    cpu.reg_write(UC_X86_REG_ESP, STACK)
    cpu.emu_start(ENTRY, STOP, timeout=1_000_000, count=100_000)

    assert cpu.reg_read(UC_X86_REG_EIP) == STOP
    assert cpu.reg_read(UC_X86_REG_EAX) == 0
    assert cleared == [1, 2]
    assert [item["model"] for item in prepared] == [19]
    assert attached == [{"person": hex(DEFENDER), "id": 7, "slot": 0xFFFFFFFF}]
    assert read(cpu, DEFENDER + 0x0C, "I") == 0x10
    assert read(cpu, DEFENDER + 0x14, "I") == 0x02000000

    print(json.dumps({
        "executable": identity,
        "entry": hex(ENTRY),
        "tribe": TRIBE,
        "scenario": "occupied tribe-3 building; one hostile and one tribe-3 defender in scan tile",
        "interceptedLeaves": {
            "iteratorAllocate": "0x49a2f0",
            "iteratorNext": "0x49a3f0",
            "iteratorClear": "0x49a5d0",
            "alliance": "0x416d70 returned 0",
            "disguise": "0x4de7b0 returned 0",
            "orderAllocate": "0x436c20 returned 7",
            "orderPrepare": "0x438730",
            "orderAttach": "0x436d00",
        },
        "iteratorSessionsCleared": cleared,
        "preparedOrders": prepared,
        "attachedOrders": attached,
        "defenderState": {
            "flagsAt0x0c": hex(read(cpu, DEFENDER + 0x0C, "I")),
            "flagsAt0x14": hex(read(cpu, DEFENDER + 0x14, "I")),
        },
        "returnEax": cpu.reg_read(UC_X86_REG_EAX),
    }, indent=2))


if __name__ == "__main__":
    main(sys.argv[1])
