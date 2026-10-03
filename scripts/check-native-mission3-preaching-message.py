"""Probe Mission 3's authored conversion-victim warning using original instructions.

Runs isolated Unicorn only. Supplies tribe-linked people lists; intercepts message
presentation commands. The native interpreter, opcode 1168 tribe/destination
handling, state-23 count, EVERY/IF conditions and one-shot variable latch execute.
No tracked fixtures are written.
"""
import hashlib
import json
import struct
import sys
from pathlib import Path

from unicorn import UC_HOOK_CODE
from unicorn.x86_const import UC_X86_REG_EAX, UC_X86_REG_EIP, UC_X86_REG_ESP
from decomp import native_cpu

ROOT = Path(__file__).resolve().parents[1]
EXE = Path(sys.argv[1]).resolve()
SCRIPT = json.loads((ROOT / 'app/original-script-three.json').read_text())
EXE_SHA = '3a5065c7420b3fcde208bf220bc86dfbac95e025ab2492caf9c7ea5308dfbe4f'
assert hashlib.sha256(EXE.read_bytes()).hexdigest() == EXE_SHA
assert hashlib.sha256((EXE.parent / 'levels' / SCRIPT['source']).read_bytes()).hexdigest() == SCRIPT['sha256']
# Keep the exact original EVERY 31 header and its complete anti-preaching IF.
CODES = [12, 1003, *SCRIPT['codes'][457:460], *SCRIPT['codes'][504:530], 1004, 1004, 1019]
BLOB = bytearray(12552)
struct.pack_into('<' + 'H' * len(CODES), BLOB, 0, *CODES)
for index, field in enumerate(SCRIPT['fields']):
    struct.pack_into('<Ii', BLOB, 8192 + index * 8, *field)
struct.pack_into('<64i', BLOB, 12288, *SCRIPT['variables'])

observations = []
for states in ([], [17, 10, 33], [23], [23, 17, 23]):
    cpu, _ = native_cpu(EXE)
    cpu.mem_map(0x2000000, 0x60000)
    program, people, stack, stop = 0x2000000, 0x2020000, 0x205D000, 0x205E000
    imported = json.loads((ROOT / 'app/original-messages.json').read_text())
    language = (EXE.parent / 'language/lang00.dat').read_bytes()
    assert hashlib.sha256(language).hexdigest() == imported['sha256']['language/lang00.dat']
    string_id = struct.unpack('<H', cpu.mem_read(0x5AE310 + 107 * 2, 2))[0]
    assert imported['messages']['107'] == {
        'stringId': string_id, 'text': language.decode('utf-16le').split('\0')[string_id]
    }
    assert string_id == 650
    tribes, ai = 0x89D1C8, 0x89D1C8 + 2 * 0xC65
    def write(address, fmt, *values):
        cpu.mem_write(address, struct.pack('<' + fmt, *values))
    def read(address, fmt='I'):
        return struct.unpack('<' + fmt, cpu.mem_read(address, struct.calcsize('<' + fmt)))[0]
    def ret(value=0):
        sp = cpu.reg_read(UC_X86_REG_ESP)
        cpu.reg_write(UC_X86_REG_EAX, value)
        cpu.reg_write(UC_X86_REG_EIP, read(sp))
        cpu.reg_write(UC_X86_REG_ESP, sp + 4)
    def call(address, *values):
        write(stack, 'I' * (len(values) + 1), stop, *values)
        cpu.reg_write(UC_X86_REG_ESP, stack)
        cpu.emu_start(address, stop, timeout=1000000, count=2000000)
        assert cpu.reg_read(UC_X86_REG_EIP) == stop
    cpu.mem_write(tribes, bytes(4 * 0xC65))
    write(ai + 0xC22, 'B', 2)
    cpu.mem_write(program, bytes(BLOB))
    write(0x89D178, 'I', 0x12345678)
    write(tribes + 0x881, 'I', people if states else 0)
    for index, state in enumerate(states):
        person = people + index * 256
        write(person + 8, 'I', person + 256 if index + 1 < len(states) else 0)
        write(person + 0x2C, 'B', state)
    # A Chumara victim is always present: it must not inflate the Blue count.
    write(ai + 0x881, 'I', people + 0x1000)
    write(people + 0x102C, 'B', 23)
    seen = []
    def capture(_cpu, _address, _size, _user):
        pointer = read(program + 0x3104)
        opcode = read(pointer + 2, 'H')
        if opcode in (1176, 1180):
            if opcode == 1176:
                token = read(pointer + 4, 'H')
                assert SCRIPT['fields'][token] == [0, 107]
            seen.append([read(0x89D188), opcode])
            write(program + 0x3104, 'I', pointer + 4 + 2 * SCRIPT['commands'][str(opcode)])
            ret()
    cpu.hook_add(UC_HOOK_CODE, capture, begin=0x48CC60, end=0x48CC60)
    snapshots = []
    for turn in (29, 30, 62):
        write(0x89D188, 'I', turn)
        call(0x48C6B0, ai, program)
        snapshots.append({'turn': turn, 'count': read(program + 12288 + 21 * 4),
                          'latch': read(program + 12288 + 20 * 4)})
    assert snapshots[0] == {'turn': 29, 'count': 0, 'latch': 0}
    expected = states.count(23)
    assert all(item['count'] == expected and item['latch'] == int(expected > 0) for item in snapshots[1:])
    assert seen == ([[30, 1176], [30, 1180]] if expected else [])
    assert read(0x89D178) == 0x12345678
    observations.append({'blueStates': states, 'yellowStates': [23], 'snapshots': snapshots, 'messageCommands': seen})
print(json.dumps({'executableSha256': EXE_SHA, 'scriptSha256': SCRIPT['sha256'], 'cases': observations}, indent=2))
print('PASS: native opcode1168 Blue state23 count, 32-turn schedule and one-shot message107 latch')
