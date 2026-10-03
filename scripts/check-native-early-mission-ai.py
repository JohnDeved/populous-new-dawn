"""Compare Mission 3's complete periodic raid block with isolated native execution.

No Windows process starts. World population reads and the attack allocator are
controlled leaves; interpreter, EVERY/IF control flow and ATTACK argument decoding
execute original instructions. No tracked fixtures are recorded.
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
SHA = '3a5065c7420b3fcde208bf220bc86dfbac95e025ab2492caf9c7ea5308dfbe4f'
assert hashlib.sha256(EXE.read_bytes()).hexdigest() == SHA
SCRIPT = json.loads((ROOT / 'app/original-script-three.json').read_text())
assert hashlib.sha256((EXE.parent / 'levels' / SCRIPT['source']).read_bytes()).hexdigest() == SCRIPT['sha256']
CODES = [12, 1003, *SCRIPT['codes'][796:833], 1004, 1019]
BLOB = bytearray(12552)
struct.pack_into('<' + 'H' * len(CODES), BLOB, 0, *CODES)
for index, record in enumerate(SCRIPT['fields']):
    struct.pack_into('<Ii', BLOB, 8192 + index * 8, *record)
struct.pack_into('<64i', BLOB, 12288, *SCRIPT['variables'])

observations = []
for turn, warriors, blue, chumara, accepted in [
    (2045, 3, 31, 26, False),
    (2046, 2, 31, 26, False),
    (2046, 3, 30, 26, False),
    (2046, 3, 31, 25, False),
    (2046, 3, 31, 26, True),
    (2047, 3, 31, 26, False),
    (4094, 3, 31, 26, True),
]:
    cpu, _ = native_cpu(EXE)
    cpu.mem_map(0x2000000, 0x20000)
    program, stack, stop = 0x2000000, 0x201D000, 0x201E000
    tribes, ai = 0x89D1C8, 0x89D1C8 + 2 * 0xC65
    def write(address, fmt, *values):
        cpu.mem_write(address, struct.pack('<' + fmt, *values))
    def read(address, fmt='I'):
        return struct.unpack('<' + fmt, cpu.mem_read(address, struct.calcsize('<' + fmt)))[0]
    def ret(value=0):
        sp = cpu.reg_read(UC_X86_REG_ESP)
        cpu.reg_write(UC_X86_REG_EAX, value & 0xFFFFFFFF)
        cpu.reg_write(UC_X86_REG_EIP, read(sp))
        cpu.reg_write(UC_X86_REG_ESP, sp + 4)
    def call(address, *values):
        write(stack, 'I' * (len(values) + 1), stop, *values)
        cpu.reg_write(UC_X86_REG_ESP, stack)
        cpu.emu_start(address, stop, timeout=1000000, count=2000000)
        assert cpu.reg_read(UC_X86_REG_EIP) == stop
    cpu.mem_write(tribes, bytes(4 * 0xC65))
    write(ai + 0xC22, 'B', 2)
    write(0x89D188, 'I', turn)
    write(0x89D178, 'I', 0x12345678)
    cpu.mem_write(program, bytes(BLOB))
    calls, reads = [], []
    def world_read(_cpu, _address, _size, _user):
        sp = cpu.reg_read(UC_X86_REG_ESP)
        field = read(sp + 12)
        kind, value = read(field), read(field + 4, 'i')
        if kind == 2 and value in (1153, 2, 1):
            reads.append(value)
            ret({1153: warriors, 2: blue, 1: chumara}[value])
    def allocator(_cpu, _address, _size, _user):
        sp = cpu.reg_read(UC_X86_REG_ESP)
        calls.append(list(struct.unpack('<14I', cpu.mem_read(sp + 4, 56))))
        ret(1)
    cpu.hook_add(UC_HOOK_CODE, world_read, begin=0x48F350, end=0x48F350)
    cpu.hook_add(UC_HOOK_CODE, allocator, begin=0x4E5FD0, end=0x4E5FD0)
    call(0x48C6B0, ai, program)
    assert bool(calls) == accepted, (turn, warriors, blue, chumara, calls)
    if accepted:
        assert len(calls) == 1
        assert calls[0] == [ai, tribes, 3, 1, 0, 8, 0, 0, 0, 0, 0, 0xFFFFFFFF, 511, 0xFFFFFFFF], calls
    assert read(0x89D178) == 0x12345678
    observations.append({'turn': turn, 'blueWarriors': warriors, 'bluePopulation': blue,
                         'chumaraPopulation': chumara, 'allocated': accepted, 'internalReads': reads})
print(json.dumps({'executableSha256': SHA, 'scriptSha256': SCRIPT['sha256'],
                  'block': [796, 833], 'cases': observations}, indent=2))
print('PASS: complete Mission 3 periodic raid gates and native ATTACK argument decoding')

# Prove the startup profile separately. Four presentation/input commands are
# intercepted at the dispatcher; their operands are skipped with the imported
# arity, while every SET and state command still executes original instructions.
for mission, tribe, name, attributes, states in [
    (2, 3, 'two', [4,0,0,0,0,0,0,0,0,1,3,0,100,0,2,1,0,0,45,0,0,0,0,0,255,1,0,0,50,1,0,0,0,1,0,0,0,0,0,0,30,0,0,12,0,0,0,0], 1181419),
    (3, 2, 'three', [40,0,1,0,0,0,0,10,0,1,0,100,0,0,2,1,0,0,20,0,0,0,0,0,0,1,0,64,20,1,0,0,128,1,0,0,0,0,0,0,0,1,0,12,0,0,1,0], 1052527),
]:
    cpu, _ = native_cpu(EXE)
    cpu.mem_map(0x2000000, 0x60000)
    ai, program, stack, stop = 0x2000000, 0x2010000, 0x205D000, 0x205E000
    source = json.loads((ROOT / f'app/original-script-{name}.json').read_text())
    raw = (EXE.parent / 'levels' / source['source']).read_bytes()
    assert hashlib.sha256(raw).hexdigest() == source['sha256']
    write(ai + 0xC22, 'B', tribe)
    call(0x461D70, ai)
    cpu.mem_write(program, raw)
    write(0x89D188, 'I', 0)
    intercepted = []
    def presentation(_cpu, _address, _size, _user):
        pointer = read(program + 0x3104)
        opcode = read(pointer + 2, 'H')
        if opcode in (1112, 1174, 1187, 1197):
            intercepted.append(opcode)
            write(program + 0x3104, 'I', pointer + 4 + 2 * source['commands'][str(opcode)])
            ret()
    cpu.hook_add(UC_HOOK_CODE, presentation, begin=0x48CC60, end=0x48CC60)
    call(0x48C6B0, ai, program)
    actual = list(cpu.mem_read(0x9607EA + tribe * 48, 48))
    assert actual == attributes
    assert read(ai + 0x59A) == states
    print(json.dumps({'mission': mission, 'startupAttributes': actual, 'states': states,
                      'interceptedPresentationCommands': intercepted, 'scriptSha256': source['sha256']}))
print('PASS: native Mission 2/3 startup producer attributes and state bits')
