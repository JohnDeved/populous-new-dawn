"""Compare browser 3D steps with the original x86 routine in CPU emulation.
Usage: python scripts/check-native-projectile-math.py /path/to/d3dpoptb.exe
Requires unicorn==2.1.4 and Node. No Windows startup or OS calls are emulated.
"""
import json
from pathlib import Path
import random
import struct
import subprocess
import sys

from unicorn import Uc, UC_ARCH_X86, UC_MODE_32
from unicorn.x86_const import UC_X86_REG_ESP, UC_X86_REG_EIP
from decomp import inspect

exe = Path(sys.argv[1])
identity = inspect(exe)
data = exe.read_bytes()
pe = struct.unpack_from('<I', data, 60)[0]
count = struct.unpack_from('<H', data, pe + 6)[0]
opt = struct.unpack_from('<H', data, pe + 20)[0]
base = struct.unpack_from('<I', data, pe + 24 + 28)[0]
size = struct.unpack_from('<I', data, pe + 24 + 56)[0]
cpu = Uc(UC_ARCH_X86, UC_MODE_32)
cpu.mem_map(base, (size + 4095) & ~4095)
for i in range(count):
    _, _, va, length, offset = struct.unpack_from('<8sIIII', data, pe + 24 + opt + i * 40)
    if length:
        cpu.mem_write(base + va, data[offset:offset + length])
stack, point, stop = 0x2001000, 0x2002000, 0x2003000
cpu.mem_map(0x2000000, 0x4000)
rng = random.Random(1998)
cases = [dict(p=dict(x=32760, y=-32760, h=32760), yaw=yaw, pitch=pitch, length=length)
         for yaw in (0, 512, 1024, 1536, 2047, 4095)
         for pitch in (0, 1, 511, 512, 1024, 1536, 2047)
         for length in (0, 1, 70, 1000, -80, -321)]
cases += [dict(p=dict(x=rng.randrange(-32768, 32768), y=rng.randrange(-32768, 32768),
                     h=rng.randrange(-32768, 32768)),
               yaw=rng.randrange(4096), pitch=rng.randrange(4096), length=rng.randrange(-32768, 32768))
          for _ in range(256)]
expected = []
for case in cases:
    cpu.mem_write(point, struct.pack('<hhh', *case['p'].values()))
    cpu.mem_write(stack, struct.pack('<IIIII', stop, point, case['yaw'], case['pitch'], case['length'] & 0xffffffff))
    cpu.reg_write(UC_X86_REG_ESP, stack)
    cpu.emu_start(0x4e6ac0, stop, timeout=100000, count=1000)
    assert cpu.reg_read(UC_X86_REG_EIP) == stop, 'Native routine failed to return'
    expected.append(dict(zip(('x', 'y', 'h'), struct.unpack('<hhh', cpu.mem_read(point, 6)))))
js = "import {nativeStep3D} from './app/model.ts';let s='';for await(const c of process.stdin)s+=c;console.log(JSON.stringify(JSON.parse(s).map(c=>nativeStep3D(c.p,c.yaw,c.pitch,c.length))));"
result = subprocess.run(['node', '--input-type=module', '-e', js], input=json.dumps(cases),
                        text=True, capture_output=True, check=True, cwd=Path(__file__).resolve().parents[1])
actual = json.loads(result.stdout)
assert len(actual) == len(expected)
for case, want, got in zip(cases, expected, actual):
    assert got == want, (case, want, got)
print(f'PASS: {len(cases)} native x86/browser projectile steps; SHA256 {identity["sha256"]}')
