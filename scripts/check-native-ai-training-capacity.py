"""Original automatic-training capacity boundary; eligibility/availability leaves supplied.

The original state gate, candidate loop, RNG draw, signed sum comparison, completed
building lookup and task writer execute. This is not whole-training timing proof.
"""
import json
import struct
import subprocess
import sys
from pathlib import Path
from unicorn import UC_HOOK_CODE
from unicorn.x86_const import UC_X86_REG_EAX, UC_X86_REG_EIP, UC_X86_REG_ESP
from decomp import native_cpu

ROOT = Path(__file__).resolve().parents[1]
EXE = Path(sys.argv[1])
AI, BUILDING, STACK, STOP = 0x2000000, 0x2002000, 0x201D000, 0x201E000
cases = []
for idle, housed in [(-2147483648, 0), (-1, 0), (0, 0), (4, 0), (5, 0), (6, 0),
                     (2147483647, 0), (2147483647, 1), (4, 1), (6, -2),
                     (-2147483648, -1), (-1, 6)]:
    cpu, identity = native_cpu(EXE)
    cpu.mem_map(AI, 0x20000)
    def write(address, fmt, *values):
        cpu.mem_write(address, struct.pack('<' + fmt, *values))
    def read(address, fmt='I'):
        return struct.unpack('<' + fmt, cpu.mem_read(address, struct.calcsize('<' + fmt)))[0]
    def ret(value):
        sp = cpu.reg_read(UC_X86_REG_ESP)
        cpu.reg_write(UC_X86_REG_EAX, value & 0xFFFFFFFF)
        cpu.reg_write(UC_X86_REG_EIP, read(sp))
        cpu.reg_write(UC_X86_REG_ESP, sp + 4)
    write(AI + 0xC22, 'B', 2)
    write(AI + 0x59A, 'I', 64)
    write(AI + 0x91D, 'I', 20)
    write(0x9607EA + 96 + 7, 'B', 100)
    write(AI + 0xB7D + 7 * 2, 'h', 1)
    write(AI + 0x885, 'I', BUILDING)
    write(BUILDING + 0x24, 'H', 71)
    write(BUILDING + 0x2B, 'BB', 7, 2)
    write(0x89D178, 'I', 0x12345678)
    def leaf(_cpu, address, _size, _user):
        if address == 0x408DD0:
            model = read(cpu.reg_read(UC_X86_REG_ESP) + 4)
            ret(int(model == 7))
        else:
            ret(idle if address == 0x4F67B0 else housed)
    for address in [0x408DD0, 0x4F67B0, 0x4F6730]:
        cpu.hook_add(UC_HOOK_CODE, leaf, begin=address, end=address)
    write(STACK, 'III', STOP, AI, 0)
    cpu.reg_write(UC_X86_REG_ESP, STACK)
    cpu.emu_start(0x4E59A0, STOP, count=200000)
    assert cpu.reg_read(UC_X86_REG_EIP) == STOP
    allocated = bool(cpu.reg_read(UC_X86_REG_EAX))
    capacity = read(0x5A7248 + 7 * 0x4C, 'B')
    assert capacity == 5
    total = ((idle + housed + 2**31) % 2**32) - 2**31
    assert allocated == (total >= capacity), (idle, housed, allocated)
    assert bool(read(AI + 0x74) & 1) == allocated
    if allocated:
        assert [read(AI + 0x85, 'B'), read(AI + 0x68)] == [6, 71]
    value = (0x12345678 * 0x24A1 + 0x24DF) & 0xFFFFFFFF
    expected_random = ((value >> 13) | (value << 19)) & 0xFFFFFFFF
    assert read(0x89D178) == expected_random
    cases.append(dict(idle=idle, housed=housed, total=total, capacity=capacity,
                      allocated=allocated, randomAfter=expected_random))

if '--compare' in sys.argv:
    result = subprocess.run(['node', '--input-type=module', '-e',
        "import {hasComputerTrainingCapacity} from './app/computer.ts';"
        "let s='';for await(const c of process.stdin)s+=c;"
        "console.log(JSON.stringify(JSON.parse(s).map(c=>hasComputerTrainingCapacity(c.idle+c.housed,c.capacity))))"],
        input=json.dumps(cases), text=True, capture_output=True, cwd=ROOT)
    assert result.returncode == 0, result.stderr
    assert json.loads(result.stdout) == [c['allocated'] for c in cases]
print(json.dumps(dict(executable=identity, suppliedLeaves=['00408dd0 model availability',
    '004f67b0 idle availability', '004f6730 housed availability'], cases=cases), indent=2))
print('PASS: 12 original signed automatic-training capacity boundaries' +
      (' paired with the live predicate' if '--compare' in sys.argv else ' (native only)'))
