"""Execute native vehicle damage, destruction states, and passenger ejection."""

import hashlib
import struct
import sys
from pathlib import Path

from unicorn import UC_HOOK_CODE, UcError
from unicorn.x86_const import UC_X86_REG_EAX, UC_X86_REG_EIP, UC_X86_REG_ESP

from decomp import configure_native_constants, native_cpu


EXPECTED = "3a5065c7420b3fcde208bf220bc86dfbac95e025ab2492caf9c7ea5308dfbe4f"
OBJECT = 0x02000000
STACK = 0x0203D000
STOP = 0x0203E000
VEHICLE_LIFE = 5000


def main() -> None:
    executable = Path(sys.argv[1])
    assert hashlib.sha256(executable.read_bytes()).hexdigest() == EXPECTED
    cpu, _ = native_cpu(executable)
    configure_native_constants(cpu, executable)
    cpu.mem_map(OBJECT, 0x40000)
    transitions: list[int] = []

    def write(address: int, fmt: str, *values: int) -> None:
        cpu.mem_write(address, struct.pack("<" + fmt, *values))

    def read(address: int, fmt: str) -> int:
        return struct.unpack("<" + fmt, cpu.mem_read(address, struct.calcsize("<" + fmt)))[0]

    # 004659d0 reads the selected animation's frame count after the supplied
    # asset-backed setter. A zeroed table is sufficient for linkage/life proof.
    write(0x59DF44, "I", OBJECT + 0x20000)

    def supplied(c, address, _size, _data) -> None:
        stack = c.reg_read(UC_X86_REG_ESP)
        if address == 0x4ED640:
            transitions.append(read(OBJECT + 0x2C, "B"))
        c.reg_write(UC_X86_REG_EIP, read(stack, "I"))
        c.reg_write(UC_X86_REG_ESP, stack + 4)

    # Destruction-state setup executes; world-list removal/initialization and the
    # asset-backed passenger animation setter are supplied by this isolated probe.
    for address in (0x4D4040, 0x4ED6F0, 0x4ED640):
        cpu.hook_add(UC_HOOK_CODE, supplied, begin=address, end=address)

    def supplied_exit(c, _address, _size, _data) -> None:
        stack = c.reg_read(UC_X86_REG_ESP)
        vehicle_address = read(stack + 4, "I")
        output = read(stack + 8, "I")
        write(
            output,
            "HH",
            (read(vehicle_address + 0x3D, "H") + 512) & 0xFFFF,
            read(vehicle_address + 0x3F, "H"),
        )
        c.reg_write(UC_X86_REG_EAX, 1)
        c.reg_write(UC_X86_REG_EIP, read(stack, "I"))
        c.reg_write(UC_X86_REG_ESP, stack + 4)

    cpu.hook_add(UC_HOOK_CODE, supplied_exit, begin=0x466190, end=0x466190)

    def call(entry: int, *args: int) -> None:
        write(STACK, "I" * (len(args) + 1), STOP, *[value & 0xFFFFFFFF for value in args])
        cpu.reg_write(UC_X86_REG_ESP, STACK)
        try:
            cpu.emu_start(entry, STOP, count=10000)
        except UcError as error:
            raise AssertionError((hex(cpu.reg_read(UC_X86_REG_EIP)), error)) from error
        assert cpu.reg_read(UC_X86_REG_EIP) == STOP, hex(cpu.reg_read(UC_X86_REG_EIP))

    def vehicle(model: int, life: int, owner: int = 0, passengers: int = 0) -> None:
        cpu.mem_write(OBJECT, bytes(256))
        write(OBJECT + 0x2B, "B", model)
        write(OBJECT + 0x2C, "B", 1)
        write(OBJECT + 0x2F, "b", owner)
        write(OBJECT + 0x92, "I", 0x20000)
        write(OBJECT + 0x98, "h", life)
        write(OBJECT + 0x9E, "B", passengers)

    for life, amount, expected in [(51, 50, 1), (50, 50, 0), (1, 50, -49), (0, 1, -1), (-1, 1, -2)]:
        vehicle(1, life)
        write(0x895DA4, "I", 0)
        call(0x466F00, OBJECT, 1, amount)
        assert read(OBJECT + 0x98, "h") == expected

    vehicle(1, VEHICLE_LIFE)
    call(0x466F00, OBJECT, 0, 50)
    assert read(OBJECT + 0x98, "h") == VEHICLE_LIFE
    write(0x895DA4, "I", 0x04000000)
    call(0x466F00, OBJECT, 1, 50)
    assert read(OBJECT + 0x98, "h") == VEHICLE_LIFE
    write(0x895DA4, "I", 0)

    for model, state in ((1, 5), (3, 6)):
        assert read(0x5A7938 + model * 23, "h") == VEHICLE_LIFE
        vehicle(model, 1)
        transitions.clear()
        call(0x463CB0, OBJECT)
        assert read(OBJECT + 0x98, "h") == 0
        assert read(OBJECT + 0x2C, "B") == state
        assert transitions == [state]

        vehicle(model, VEHICLE_LIFE - 50, passengers=1)
        call(0x463CB0, OBJECT)
        actual_life = read(OBJECT + 0x98, "h")
        assert actual_life == VEHICLE_LIFE, (model, actual_life)
        assert read(OBJECT + 0x2C, "B") == 1

        vehicle(model, 0)
        call(0x463CB0, OBJECT)
        assert read(OBJECT + 0x98, "h") == 0
        assert read(OBJECT + 0x2C, "B") == 1

        capacity = read(0x5A7938 + model * 23 + 8, "B")
        vehicle(model, 1, passengers=capacity)
        write(OBJECT + 0x24, "H", 1)
        write(OBJECT + 0x2A, "B", 4)
        write(OBJECT + 0x2C, "B", state)
        write(OBJECT + 0x3D, "HHh", 0x4100, 0x4100, 128)
        write(0x890390 + 4, "I", OBJECT)
        people = []
        for index in range(capacity):
            person = OBJECT + 0x1000 + index * 256
            person_id = index + 2
            people.append(person)
            cpu.mem_write(person, bytes(256))
            write(0x890390 + person_id * 4, "I", person)
            write(person + 0x24, "H", person_id)
            write(person + 0x2A, "B", 1)
            write(person + 0x2B, "B", 2)
            write(person + 0x2C, "B", 1)
            write(person + 0x2F, "b", 0)
            write(person + 0x3D, "HHh", 0x4100, 0x4100, 128)
            write(person + 0x6E, "h", 1000)
            write(person + 0x9F, "H", 1)
            write(OBJECT + 0x7A + index * 2, "H", person_id)
        call(0x463370, OBJECT)
        assert read(OBJECT + 0x9E, "B") == 0
        assert all(read(OBJECT + 0x7A + index * 2, "H") == 0 for index in range(capacity))
        for person in people:
            assert read(person + 0x9F, "H") == 0
            assert read(person + 0x2C, "B") == 1
            assert read(person + 0x6E, "h") == 1000
            assert read(person + 0x5F, "h") > 0
            assert read(person + 0x49, "h") == 160
            assert read(person + 0x4B, "h") == 60
            assert read(person + 0x4D, "h") == 0
            assert read(person + 0x10, "I") == 0x01000400
            assert read(person + 0x0C, "I") & 0x10
            assert read(person + 0x68, "H") == 0x4100
            assert read(person + 0x6A, "H") == 0x4100

    print(
        "PASS: native vehicle damage gates, signed boundaries, occupied reset, "
        "states 5/6, and full-capacity passenger ejection"
    )


if __name__ == "__main__":
    main()
