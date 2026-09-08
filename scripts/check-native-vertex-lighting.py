"""Compare 0x46c340's diffuse/specular conversion with the browser renderer.
Usage: python scripts/check-native-vertex-lighting.py EXE
The complete original function executes without intercepted consumers.
"""
import json
import random
import struct
import subprocess
import sys
from pathlib import Path
from unicorn.x86_const import UC_X86_REG_EIP, UC_X86_REG_ESP
from decomp import ROOT, native_cpu

cpu, _ = native_cpu(Path(sys.argv[1]))
cpu.mem_map(0x2000000, 0x4000)
source, target, stack, stop = 0x2000000, 0x2000100, 0x2002000, 0x2003000
rng = random.Random(0x46c340)
cases = [(value, tint) for value in range(128) for tint in [0, 0xfdb935, 0xffffff]]
cases += [(rng.getrandbits(32), rng.getrandbits(32)) for _ in range(512)]
cases += [(rng.randrange(0x1000000), rng.getrandbits(32)) for _ in range(512)]
expected = []
for value, tint in cases:
    cpu.mem_write(source, struct.pack('<8I', 123, 456, 789, 1, value, 2, 3, 4))
    cpu.mem_write(target, bytes([0x5a]) * 32)
    cpu.mem_write(stack, struct.pack('<4I', stop, source, target, tint))
    cpu.reg_write(UC_X86_REG_ESP, stack)
    cpu.emu_start(0x46c340, stop, count=1000)
    assert cpu.reg_read(UC_X86_REG_EIP) == stop
    row = struct.unpack('<8I', cpu.mem_read(target, 32))
    assert row[:2] == (123, 456)
    assert row[2:4] == row[6:8] == (0x5a5a5a5a, 0x5a5a5a5a)
    expected.append(dict(diffuse=row[4], specular=row[5]))

js = """
import {vertexLighting} from './app/projection.ts';
let input='';for await(const chunk of process.stdin)input+=chunk;
console.log(JSON.stringify(JSON.parse(input).map(([value,tint])=>vertexLighting(value,tint))));
"""
actual = json.loads(subprocess.check_output(['node', '--input-type=module', '-e', js],
    input=json.dumps(cases).encode(), cwd=ROOT))
assert len(actual) == len(expected)
for i, (browser, native) in enumerate(zip(actual, expected)):
    assert browser == native, (cases[i], browser, native)
print(f'PASS: {len(cases)} complete native vertex-light conversions, including shoreline shade, warm light, saturation and packed ARGB')
