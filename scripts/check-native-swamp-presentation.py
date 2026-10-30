"""Compare original Swamp queue output with the browser presentation helper.
Original terrain sampling executes; projection is supplied at the screen boundary.
No original installer/game process is launched. No fixtures are written.
"""
import json
import random
import struct
import subprocess
import sys
from pathlib import Path
from unicorn import UC_HOOK_CODE
from unicorn.x86_const import UC_X86_REG_ESP, UC_X86_REG_EIP, UC_X86_REG_ECX
from decomp import ROOT, native_cpu

cpu, identity = native_cpu(Path(sys.argv[1]))
cpu.mem_map(0x2000000, 0x100000)
unit, camera, pool, flags, stack, stop = 0x2010000, 0x2020000, 0x2030000, 0x2040000, 0x20ee000, 0x20ef000
def write(a, fmt, *values):
    cpu.mem_write(a, struct.pack('<' + fmt, *values))
def read(a, fmt):
    return struct.unpack('<' + fmt, cpu.mem_read(a, struct.calcsize('<' + fmt)))[0]

rng = random.Random(0x46f290)
land = dict(heights=[rng.randrange(-100, 1400) for _ in range(16384)],
            flags=[rng.randrange(2) for _ in range(16384)],
            cliffs=[rng.choice([0, 0, 0, 127, 128, 255]) for _ in range(16384)],
            categories=[rng.randrange(16) for _ in range(16384)])
for i in range(16384):
    p = 0x8a03e4 + i * 16
    write(p, 'Ih', land['flags'][i], land['heights'][i])
    write(p + 10, 'B', land['cliffs'][i])
    write(p + 12, 'B', land['categories'][i])
rules = json.loads((ROOT / 'app/original-rules.json').read_text())
cpu.mem_write(flags, bytes(rules['terrainCategoryFlags']))
write(0x59df0c, 'I', flags)
write(0x74a350, 'I', camera)
write(0x75d504, 'I', pool + 4096)
write(camera + 0x24, 'HH', 0, 0)
points = []

def project(c, address, size, user):
    sp = c.reg_read(UC_X86_REG_ESP)
    point = read(sp + 4, 'I')
    points.append([read(point, 'i'), read(point + 4, 'i'), read(point + 8, 'i')])
    write(point + 8, 'iff', 0, 500.0, 500.0)
    write(point + 24, 'I', 0)
    c.reg_write(UC_X86_REG_EIP, read(sp, 'I'))
    c.reg_write(UC_X86_REG_ESP, sp + 4)

cpu.hook_add(UC_HOOK_CODE, project, begin=0x46dbe0, end=0x46dbe0)
cases, expected = [], []
for i in range(256):
    case = dict(center=dict(x=rng.choice([0, 65535, 511, 512, rng.randrange(65536)]),
                            y=rng.choice([0, 65535, 511, 512, rng.randrange(65536)]), h=123),
                variant=i % 4, counter=i, id=rng.randrange(65536),
                frame=rng.choice([0, 9, 10, 255, 256, rng.randrange(100000)]))
    cpu.mem_write(unit, bytes(256))
    write(unit + 0x24, 'H', case['id'])
    write(unit + 0x2e, 'B', case['counter'])
    write(unit + 0x3d, 'HHh', *case['center'].values())
    write(unit + 0x72, 'B', case['variant'])
    write(0x897981, 'I', case['frame'])
    write(0x75d508, 'I', pool)
    cpu.mem_write(pool, bytes(4096))
    cpu.mem_write(0x75d50c, bytes(3585 * 4))
    write(stack, 'III', stop, 0, unit)
    cpu.reg_write(UC_X86_REG_ESP, stack)
    points.clear()
    cpu.emu_start(0x46f290, stop, count=100000)
    assert cpu.reg_read(UC_X86_REG_EIP) == stop
    count = (read(0x75d508, 'I') - pool) // 12
    assert count == len(points)
    rows = []
    for index, point in enumerate(points):
        primitive = read(pool + index * 12, 'B')
        rows.append(dict(point=point, frame=read(pool + index * 12 + 6, 'B') +
                         (0 if primitive == 30 else 10)))
    cases.append(case)
    expected.append(rows)
js = """
import {swampPresentation} from './app/swamp-presentation.ts';
import {relativeCoordinate} from './app/projection.ts';
let s='';for await(const c of process.stdin)s+=c;
const input=JSON.parse(s);
console.log(JSON.stringify(input.cases.map(c =>
  swampPresentation(input.land, c, c.id, c.frame).filter(s=>s.visible).map(s =>
    ({point:[relativeCoordinate(s.x,0),s.h,relativeCoordinate(s.y,0)],frame:s.frame})))));
"""
result = subprocess.run(['node', '--input-type=module', '-e', js],
                        input=json.dumps(dict(land=land, cases=cases)), text=True,
                        capture_output=True, cwd=ROOT)
assert result.returncode == 0, result.stderr
actual = json.loads(result.stdout)
for index, (native, browser) in enumerate(zip(expected, actual)):
    assert native == browser, (index, cases[index], native, browser)
assert len(actual) == len(expected)
print(f'PASS: 256 original Swamp draw queues, all four variants, terrain filtering/heights, '
      f'wrapped anchors, bubble clock and plant frame selection ({identity["sha256"]}); projection supplied')

# Execute the actual painter, palette setter and quad initializer. Supply only
# texture-bank handles/cache-upload leaves; do not intercept tint or alpha.
cpu.mem_map(0x2100000, 0x300000)
bank, records, hfx, texture = 0x2041000, 0x2050000, 0x2060000, 0x2100000
queue = texture + 0x100
game = Path(sys.argv[1]).parent
source = (game / 'data/hfx0-0.dat').read_bytes()
palette = (game / 'data/pal0-c.dat').read_bytes()
alpha = (game / 'data/al0-c.dat').read_bytes()
for index in range(struct.unpack_from('<I', source, 4)[0]):
    width, height, _ = struct.unpack_from('<HHI', source, 8 + index * 8)
    write(hfx + index * 8, 'IHH', 0, width, height)
    write(records + index * 36, 'HH', width, height)
    write(records + index * 36 + 20, 'IIII', 1, 1, 1, 1)
write(bank + 4, 'II', records, bank + 32)
write(bank + 44, 'I', hfx)
write(0x59df14, 'I', hfx)
write(0x5ce0bc, 'I', texture)
write(texture + 0x24804a, 'iiii', -10000, -10000, 10000, 10000)
cpu.mem_write(0xd05528, palette)
write(0x87eff8, 'I', 0xd05528)
cpu.mem_write(0x87f000, alpha)
write(0x5da078, 'I', 0)
write(0x5d5704, 'I', 0)
write(0x89c669, 'I', 0)

def texture_leaf(c, address, size, user):
    sp = c.reg_read(UC_X86_REG_ESP)
    if address == 0x516170:
        entry = read(sp + 4, 'I')
        write(read(sp + 8, 'I'), 'I', bank)
        write(read(sp + 12, 'I'), 'I', (entry - hfx) // 8)
    c.reg_write(UC_X86_REG_EIP, read(sp, 'I'))
    c.reg_write(UC_X86_REG_ESP, sp + (12 if address == 0x4608a0 else 4))

for address in (0x516170, 0x4608a0):
    cpu.hook_add(UC_HOOK_CODE, texture_leaf, begin=address, end=address)
art = json.loads((ROOT / 'app/original-swamp.json').read_text())
for index, frame in enumerate(art['frames']):
    bubble = index < 10
    primitive = 30 if bubble else 31
    cpu.mem_write(unit, bytes(256))
    write(unit, 'B', primitive)
    write(unit + 6, 'B', index if bubble else index - 10)
    write(unit + 8, 'hh', 500, 500)
    write(stack + 0x14, 'I', unit)
    write(stack + 0x30, 'I', (0x6ed4 >> 4) + 1)
    write(texture + 0x20002a, 'I', queue)
    write(0x5da074, 'I', 0)
    write(0x5d5708, 'I', 0x974560)
    cpu.reg_write(UC_X86_REG_ESP, stack)
    cpu.reg_write(UC_X86_REG_ECX, primitive)
    try:
        cpu.emu_start(0x46c088, 0x46c18c, count=100000)
    except Exception as error:
        raise AssertionError((frame['source'], hex(cpu.reg_read(UC_X86_REG_EIP)))) from error
    assert cpu.reg_read(UC_X86_REG_EIP) == 0x46c18c
    assert read(texture + 0x20002a, 'I') == queue + 0x5a
    assert read(queue + 0x30, 'H') == frame['source']
    assert read(queue + 0x24, 'f') == 500 - frame['w'] // 2
    assert read(queue + 0x28, 'f') == 500 - frame['h']
    assert read(queue + 0x46, 'f') == frame['w']
    assert read(queue + 0x4a, 'f') == frame['h']
    tint = int.from_bytes(bytes(art['bubbleColor']), 'big') if bubble else 0xffffff
    assert read(queue + 0x4e, 'I') == 0xff000000 | tint
    assert read(queue + 12, 'I') == (0x12 if bubble else 0x11)
    assert read(queue + 32, 'I') & 2 == (2 if bubble else 0)
    assert read(0x5d5708, 'I') == 0x974560, 'Painter must restore ghost palette'
print('PASS: all 22 original HFX painter frames, bottom-center rectangles, real AL0 tint, '
      'opaque vertex alpha and alpha-texture/ordinary texture modes; texture upload supplied')
