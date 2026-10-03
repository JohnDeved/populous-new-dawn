"""Prove Mission 2's explicit replacement-Warrior script and allocation path.

Uses isolated original instructions with controlled native world records. No leaf
intercepts: interpreter, internal reads, availability, school lookup and task
writer all run. Final training movement/conversion remains a live-game boundary.
"""
import hashlib
import json
import struct
import sys
from pathlib import Path

from unicorn.x86_const import UC_X86_REG_ESP, UC_X86_REG_EIP
from decomp import native_cpu

ROOT = Path(__file__).resolve().parents[1]
EXE = Path(sys.argv[1]).resolve()
SCRIPT = json.loads((ROOT / 'app/original-script-two.json').read_text())
EXE_SHA = '3a5065c7420b3fcde208bf220bc86dfbac95e025ab2492caf9c7ea5308dfbe4f'
assert hashlib.sha256(EXE.read_bytes()).hexdigest() == EXE_SHA
assert hashlib.sha256((EXE.parent / 'levels' / SCRIPT['source']).read_bytes()).hexdigest() == SCRIPT['sha256']
CODES = [12, 1003, *SCRIPT['codes'][551:577], 1004, 1019]
BLOB = bytearray(12552)
struct.pack_into('<' + 'H' * len(CODES), BLOB, 0, *CODES)
for index, field in enumerate(SCRIPT['fields']):
    struct.pack_into('<Ii', BLOB, 8192 + index * 8, *field)
struct.pack_into('<64i', BLOB, 12288, *SCRIPT['variables'])

results = []
for turn, population, warriors, available, school_state, occupied, requested in [
    (6, 11, 1, 1, 2, 0, 0),
    (7, 10, 1, 1, 2, 0, 0),
    (7, 11, 2, 1, 2, 0, 0),
    (7, 11, 1, 1, 2, 0, 1),
    (7, 11, 0, 2, 2, 0, 2),
    (71, 11, 1, 1, 2, 2, 1),
    (7, 11, 1, 0, 2, 0, 0),
    (7, 11, 1, 1, 1, 0, 0),
    (7, 11, 1, 1, 2, 10, 0),
]:
    cpu, _ = native_cpu(EXE)
    cpu.mem_map(0x2000000, 0x60000)
    program, people, school, stack, stop = 0x2000000, 0x2020000, 0x2030000, 0x205D000, 0x205E000
    ai, attributes = 0x89D1C8 + 3 * 0xC65, 0x9607EA + 3 * 48
    def write(address, fmt, *values):
        cpu.mem_write(address, struct.pack('<' + fmt, *values))
    def read(address, fmt='I'):
        return struct.unpack('<' + fmt, cpu.mem_read(address, struct.calcsize('<' + fmt)))[0]
    cpu.mem_write(ai, bytes(0xC65))
    cpu.mem_write(attributes, bytes(48))
    write(ai + 0xC22, 'B', 3)
    write(ai + 0x91D, 'I', population)
    write(ai + 0xA27 + 3 * 2, 'h', warriors)
    write(ai + 0x881, 'I', people if available else 0)
    for index in range(available):
        person = people + index * 256
        write(person + 8, 'I', person + 256 if index + 1 < available else 0)
        write(person + 0x24, 'H', 50 + index)
        write(person + 0x2A, 'BBB', 1, 2, 17)
        write(person + 0x2F, 'B', 3)
    write(ai + 0x885, 'I', school)
    write(school + 0x24, 'H', 42)
    write(school + 0x2A, 'BBB', 2, 7, school_state)
    write(school + 0x2F, 'B', 3)
    for slot in range(occupied):
        write(ai + slot * 82 + 0x74, 'I', 1)
    write(0x89D188, 'I', turn)
    write(0x89D178, 'I', 0x12345678)
    cpu.mem_write(program, bytes(BLOB))
    write(stack, 'III', stop, ai, program)
    cpu.reg_write(UC_X86_REG_ESP, stack)
    cpu.emu_start(0x48C6B0, stop, timeout=1000000, count=2000000)
    assert cpu.reg_read(UC_X86_REG_EIP) == stop
    tasks = []
    for slot in range(10):
        base = ai + slot * 82
        if read(base + 0x74) & 1 and read(base + 0x85, 'B') == 6:
            tasks.append({'slot': slot, 'target': read(base + 0x68),
                          'requested': read(base + 0x6C), 'phase': read(base + 0x78, 'H')})
    expected = [{'slot': occupied, 'target': 42, 'requested': requested, 'phase': 0}] if requested else []
    assert tasks == expected, (turn, population, warriors, available, school_state, tasks, expected)
    assert bytes(cpu.mem_read(attributes, 48)) == bytes(48)
    assert read(0x89D178) == 0x12345678
    results.append({'turn': turn, 'population': population, 'warriors': warriors,
                    'available': available, 'schoolState': school_state, 'occupiedSlots': occupied,
                    'tasks': tasks, 'producerPreferences': [0, 0, 0, 0]})
print(json.dumps({'executableSha256': EXE_SHA, 'scriptSha256': SCRIPT['sha256'],
                  'block': [551, 577], 'interceptedLeaves': [], 'cases': results}, indent=2))
print('PASS: native Mission 2 explicit replacement-Warrior gates, allocation, zero preferences and unchanged RNG')
