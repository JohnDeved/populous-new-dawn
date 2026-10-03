"""Compare 0050c150 -> 00404540 residential smoke attachment with live helpers.

Usage: python scripts/check-native-hut-smoke-placement.py /path/to/d3dpoptb.exe
Executes original initializer, building lookup, descriptor selection and socket
arithmetic. Animation setup, list relocation and final position assignment are
intercepted; terrain height is deterministic. No game executable is launched,
fixtures recorded, or tracked files written. This does not certify raster parity.
"""
import hashlib
import json
import struct
import subprocess
import sys
from pathlib import Path

from decomp import ROOT, load_native_shapes, native_cpu
from unicorn import UC_HOOK_CODE
from unicorn.x86_const import UC_X86_REG_EAX, UC_X86_REG_EIP, UC_X86_REG_ESP

exe = Path(sys.argv[1])
cpu, identity = native_cpu(exe)
cpu.mem_map(0x2000000, 0x100000)
objects, shapes = 0x2000000, 0x2030000
building, smoke, stack, stop = 0x2040000, 0x2041000, 0x20fd000, 0x20fe000
load_native_shapes(cpu, exe, objects, shapes)


def write(address, fmt, *values):
    cpu.mem_write(address, struct.pack('<' + fmt, *values))


def read(address, fmt):
    return struct.unpack('<' + fmt, cpu.mem_read(address, struct.calcsize('<' + fmt)))[0]


def terrain(x, y):
    return ((x >> 4) + (y >> 3)) % 2048 - 512


raw = (exe.parent / 'data/smoke.txt').read_bytes()
assert hashlib.sha256(raw).hexdigest() == '48d460819cdbc7d32ae7253150752c3d2ea641b07d797d0914525545f5e19cb1'
for line in raw.decode('ascii').splitlines():
    fields = line.split('#', 1)[0].split()
    if fields:
        assert len(fields) == 6 and fields[0] == 'SMOKE'
        model, angle, x, h, y = map(int, fields[1:])
        write(0x5f0558 + (model * 4 + angle) * 6, 'hhh', x, h, y)

slots, positions = [], []


def intercept(cpu, address, size, user):
    sp = cpu.reg_read(UC_X86_REG_ESP)
    if address == 0x404540:
        # Observe the selected slot; execute this entire original routine.
        slots.append(read(sp + 8, 'B'))
        return
    if address == 0x44e940:
        cpu.reg_write(UC_X86_REG_EAX, terrain(read(sp + 4, 'H'), read(sp + 8, 'H')) & 65535)
    elif address == 0x4ee580:
        pointer = read(sp + 8, 'I')
        positions.append(list(struct.unpack('<HHh', cpu.mem_read(pointer, 6))))
    # The other intercepted consumers change cell lists or animation only.
    cpu.reg_write(UC_X86_REG_EIP, read(sp, 'I'))
    cpu.reg_write(UC_X86_REG_ESP, sp + 4)


for address in (0x404540, 0x44e940, 0x4ee580, 0x4ed6f0, 0x4ed640, 0x4ee700):
    cpu.hook_add(UC_HOOK_CODE, intercept, begin=address, end=address)

# Pin the selector/capacity distinction independently of the browser mapping.
assert [read(0x5a7228 + model * 76 + 0x33, 'B') for model in (1, 2, 3)] == [0, 1, 2]
assert [read(0x5a7228 + model * 76 + 0x20, 'B') for model in (1, 2, 3)] == [3, 4, 5]
cases, expected = [], []
for model in (1, 2, 3):
    for family in range(3):
        obj = 107 + family * 12 + model - 1
        for heading in range(4):
            for effect in (74, 75):
                for anchor_x, anchor_y in ((8192, 12288), (0, 0), (65024, 65024), (32768, 512)):
                    cpu.mem_write(building, bytes(256))
                    cpu.mem_write(smoke, bytes(256))
                    write(building + 0x2a, 'BB', 2, model)
                    write(building + 0x33, 'H', obj)
                    write(building + 0x26, 'H', heading * 512)
                    write(building + 0x7a, 'HH', anchor_x, anchor_y)
                    write(smoke + 0x2a, 'BB', 7, effect)
                    write(smoke + 0x3d, 'HHh', anchor_x, anchor_y, 0)
                    cell = ((anchor_x >> 8) & 254) * 2 | (((anchor_y >> 8) & 254) << 8)
                    write(0x8a03ec + cell * 4, 'H', 1)
                    write(0x890390 + 4, 'I', building)
                    slots.clear()
                    positions.clear()
                    write(stack, 'II', stop, smoke)
                    cpu.reg_write(UC_X86_REG_ESP, stack)
                    cpu.emu_start(0x50c150, stop, count=100000)
                    assert cpu.reg_read(UC_X86_REG_EIP) == stop
                    assert len(slots) == len(positions) == 1
                    cases.append(dict(model=model, effect=effect, pose=dict(
                        object=obj, angle=heading * 512, anchorX=anchor_x, anchorY=anchor_y)))
                    expected.append(dict(slot=slots[0], position=positions[0]))
                    write(0x8a03ec + cell * 4, 'H', 0)

js = """
import { hutOccupancySmokeSocket } from './app/hut-occupancy-smoke.ts';
import { buildingSocketPoint } from './app/building-shapes.ts';
let input = ''; for await (const chunk of process.stdin) input += chunk;
console.log(JSON.stringify(JSON.parse(input).map(c => {
  const slot = hutOccupancySmokeSocket(c.model);
  const p = buildingSocketPoint(c.pose, slot);
  const ground = ((p.x >> 4) + (p.y >> 3)) % 2048 - 512;
  const height = ((ground + p.heightOffset) << 16) >> 16;
  return { slot, position: [p.x, p.y, height] };
})));
"""
actual = json.loads(subprocess.check_output(
    ['node', '--input-type=module', '-e', js], input=json.dumps(cases).encode(), cwd=ROOT))
assert len(actual) == len(expected)
for case, got, want in zip(cases, actual, expected):
    assert got == want, (case, got, want)
print(f'PASS: {len(cases)} native hut-smoke initializer placements; models 74/75, '
      'all three residential levels/families, four headings, wrapped anchors, '
      f'original smoke.txt offsets. EXE {identity["sha256"]}')
