"""Compare the destination-refresh decision inside original 00439850.

Run the grounded, already-entered pursuit branch. Hook only the destination
consumer to observe its request; this does not verify entry, timeout, arrival,
vehicle eligibility, route planning or complete combat-command ownership.
"""
import json, random, struct, subprocess, sys
from pathlib import Path
from decomp import native_cpu, ROOT
from unicorn import UC_HOOK_CODE
from unicorn.x86_const import UC_X86_REG_EIP, UC_X86_REG_ESP

cpu, _ = native_cpu(Path(sys.argv[1]))
cpu.mem_map(0x2000000, 0x10000)
person, target, stack, stop = 0x2000000, 0x2001000, 0x200e000, 0x200f000

def write(address, fmt, *values):
    cpu.mem_write(address, struct.pack('<' + fmt, *values))

def destination(cpu, address, size, context):
    global refreshed
    refreshed = True
    sp = cpu.reg_read(UC_X86_REG_ESP)
    ret, p, to = struct.unpack('<III', cpu.mem_read(sp, 12))
    assert p == person and to == target + 0x3d
    cpu.mem_write(person + 0x4f, bytes(cpu.mem_read(to, 4)))
    cpu.reg_write(UC_X86_REG_ESP, sp + 4)
    cpu.reg_write(UC_X86_REG_EIP, ret)

cpu.hook_add(UC_HOOK_CODE, destination, begin=0x4e9d80, end=0x4e9d80)
rng = random.Random(0x439850)
cases = []
for i in range(4096):
    radius = [0, 56, 224, 511][i % 4]
    tolerance = radius // 2 + 56
    x, y = rng.choice([0, 32767, 32768, 65535, rng.randrange(65536)]), rng.randrange(65536)
    delta = rng.choice([-tolerance - 1, -tolerance, 1 - tolerance, 0, tolerance - 1, tolerance, tolerance + 1])
    to = {'x': (x + (delta if i & 4 else 0)) & 65535,
          'y': (y + (0 if i & 4 else delta)) & 65535}
    cpu.mem_write(person, bytes(256)); cpu.mem_write(target, bytes(256))
    write(0x890390 + 8, 'I', target)
    write(person + 0x2b, 'B', 3)
    write(person + 0x4f, 'HH', x, y)
    write(person + 0x70, 'hH', 64, 2)
    write(target + 0x2a, 'B', 1)
    write(target + 0x3d, 'HH', to['x'], to['y'])
    write(stack, 'III', stop, person, radius)
    cpu.reg_write(UC_X86_REG_ESP, stack)
    refreshed = False
    cpu.emu_start(0x439850, stop, count=10000)
    assert cpu.reg_read(UC_X86_REG_EIP) == stop
    cases.append({'goal': {'goalX': x, 'goalY': y}, 'target': to, 'radius': radius, 'expected': refreshed})

js = """
import {pursuitDestinationChanged} from './app/person-routes.ts';
let text=''; for await (const c of process.stdin) text+=c;
console.log(JSON.stringify(JSON.parse(text).map(c=>pursuitDestinationChanged(c.goal,c.target,c.radius))));
"""
result = subprocess.run(['node', '--input-type=module', '-e', js], input=json.dumps(cases),
                        capture_output=True, text=True, cwd=ROOT)
assert result.returncode == 0, result.stderr
actuals = json.loads(result.stdout)
assert len(actuals) == len(cases)
for actual, case in zip(actuals, cases):
    assert actual == case['expected'], (actual, case)
assert {c['expected'] for c in cases} == {False, True}
print('PASS: 4096 original pursuit refresh decisions, axis thresholds and signed-coordinate boundaries.')
