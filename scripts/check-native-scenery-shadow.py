"""Compare 0x403c10 and its real 0x450d50 shade consumer on original bank-2 shapes.
Only texture regeneration is intercepted; compare every terrain byte and its request.
Usage: python scripts/check-native-scenery-shadow.py /path/to/d3dpoptb.exe
"""
import base64
import hashlib
import json
import random
import struct
import subprocess
import sys
from pathlib import Path
from unicorn import UC_HOOK_CODE
from unicorn.x86_const import UC_X86_REG_EIP, UC_X86_REG_ESP
from decomp import native_cpu, configure_native_constants, load_native_shapes

root = Path(__file__).resolve().parents[1]
exe = Path(sys.argv[1])
cpu, _ = native_cpu(exe)
configure_native_constants(cpu, exe)
cpu.mem_map(0x2000000, 0x30000)
load_native_shapes(cpu, exe, 0x2000000, 0x2003000)
p, stack, stop, land = 0x2006000, 0x202d000, 0x202e000, 0x8a03e4
rng = random.Random(0x403c10)
initial = bytearray(16384 * 16)
for i in range(16384):
    struct.pack_into('<I', initial, i * 16, rng.getrandbits(32) & ~0x200)
    initial[i * 16 + 14] = rng.randrange(256)

def write(address, fmt, *values):
    cpu.mem_write(address, struct.pack('<' + fmt, *values))

def read(address, fmt):
    return struct.unpack('<' + fmt, cpu.mem_read(address, struct.calcsize('<' + fmt)))[0]

def texture_request(cpu, address, size, user):
    sp = cpu.reg_read(UC_X86_REG_ESP)
    requests.append([read(sp + 4, 'H'), read(sp + 8, 'i')])
    cpu.reg_write(UC_X86_REG_EIP, read(sp, 'I'))
    cpu.reg_write(UC_X86_REG_ESP, sp + 4)

cpu.hook_add(UC_HOOK_CODE, texture_request, begin=0x4bdd40, end=0x4bdd40)
write(0x890390, 'II', 0, p)
shapes = json.loads((root / 'app/original-shapes.json').read_text())
cases, expected = [], []
for obj in range(len(shapes['objects'])):
    for variant in range(4):
        x = rng.choice([0, 511, 512, 32768, 65535, rng.randrange(65536)])
        y = rng.choice([0, 511, 512, 32768, 65535, rng.randrange(65536)])
        model = (obj + variant) % 20
        index = (y >> 9) * 128 + (x >> 9)
        cpu.mem_write(land, bytes(initial))
        write(land + index * 16 + 6, 'H', 1)
        cpu.mem_write(p, bytes(256))
        write(p + 0x2a, 'BB', 5, model)
        write(p + 0x33, 'h', obj)
        write(p + 0x26, 'H', variant * 512)  # Scenery deliberately ignores heading.
        write(p + 0x3d, 'HH', x, y)
        write(stack, 'II', stop, p)
        cpu.reg_write(UC_X86_REG_ESP, stack)
        requests = []
        cpu.emu_start(0x403c10, stop, timeout=1000000, count=1000000)
        assert cpu.reg_read(UC_X86_REG_EIP) == stop
        cases.append(dict(object=obj, anchorX=x, anchorY=y, model=model, index=index))
        expected.append(dict(hash=hashlib.sha256(bytes(cpu.mem_read(land, len(initial)))).hexdigest(), requests=requests))

js = """
import {refreshSceneryShadow, nativeCellShade} from './app/building-shapes.ts';
import {createHash} from 'node:crypto';
let text=''; for await (const chunk of process.stdin) text+=chunk;
const input=JSON.parse(text);
console.log(JSON.stringify(input.cases.map(p=>{
  const bytes=Buffer.from(input.initial,'base64'); bytes.writeUInt16LE(1,p.index*16+6);
  const land={flags:new Uint32Array(16384),shadows:new Uint8Array(16384)};
  for(let i=0;i<16384;i++){land.flags[i]=bytes.readUInt32LE(i*16);land.shadows[i]=bytes[i*16+14];}
  const requests=[];
  refreshSceneryShadow(land,p,i=>nativeCellShade(land.flags[i],undefined,i===p.index?[{class:5,model:p.model}]:[]),(cell,radius)=>requests.push([cell,radius]));
  for(let i=0;i<16384;i++){bytes.writeUInt32LE(land.flags[i],i*16);bytes[i*16+14]=land.shadows[i];}
  return {hash:createHash('sha256').update(bytes).digest('hex'),requests};
})));
"""
result = subprocess.run(['node', '--input-type=module', '-e', js], cwd=root,
    input=json.dumps(dict(initial=base64.b64encode(initial).decode(), cases=cases)), capture_output=True, text=True)
assert result.returncode == 0, result.stderr
actual = json.loads(result.stdout)
assert len(actual) == len(expected)
for i, (a, b) in enumerate(zip(actual, expected)):
    assert a == b, (cases[i], a, b)
print(f'PASS: {len(cases):,} complete native scenery shape/shade/texture-request comparisons')
