"""Compare building smoke sockets, initialization and lifetime against the EXE.

Usage: python scripts/check-native-building-smoke.py /path/to/d3dpoptb.exe
Executes 0x40b320, 0x5119d0 and 0x50be00, with original shape and terrain data.
Only allocation, class lifecycle callbacks and final removal are intercepted.
"""
import json
import random
import struct
import subprocess
import sys
from pathlib import Path

from unicorn import UC_HOOK_CODE
from unicorn.x86_const import UC_X86_REG_EAX, UC_X86_REG_EIP, UC_X86_REG_ESP
from decomp import ROOT, native_cpu, load_native_shapes

exe = Path(sys.argv[1])
cpu, _ = native_cpu(exe)
cpu.mem_map(0x2000000, 0x40000)
load_native_shapes(cpu, exe, 0x2000000, 0x2004000)
building, smoke, stack, stop = 0x2010000, 0x2011000, 0x203d000, 0x203e000
removed = False


def write(address, fmt, *values):
    cpu.mem_write(address, struct.pack('<' + fmt, *values))


def read(address, fmt):
    return struct.unpack('<' + fmt, cpu.mem_read(address, struct.calcsize('<' + fmt)))


def callback(cpu, address, size, user):
    global removed
    sp = cpu.reg_read(UC_X86_REG_ESP)
    result = 0
    if address == 0x4ed8a0:
        unit_class, model, tribe, position = read(sp + 4, '4I')
        assert (unit_class, model) == (7, 76)
        cpu.mem_write(smoke, bytes(256))
        cpu.mem_write(smoke + 0x3d, bytes(cpu.mem_read(position, 6)))
        result = smoke
    elif address == 0x4ef180:
        removed = True
    cpu.reg_write(UC_X86_REG_EAX, result)
    cpu.reg_write(UC_X86_REG_EIP, read(sp, 'I')[0])
    cpu.reg_write(UC_X86_REG_ESP, sp + 4)


for address in (0x4ed8a0, 0x4ed6f0, 0x4ed640, 0x4ef180):
    cpu.hook_add(UC_HOOK_CODE, callback, begin=address, end=address)


def call(address, *args):
    write(stack, 'I' * (len(args) + 1), stop, *args)
    cpu.reg_write(UC_X86_REG_ESP, stack)
    cpu.emu_start(address, stop, count=10000)
    assert cpu.reg_read(UC_X86_REG_EIP) == stop
    return cpu.reg_read(UC_X86_REG_EAX)


def snapshot():
    x, y, h = read(smoke + 0x3d, 'hhh')
    scale_x, scale_y, lifetime = read(smoke + 0x68, 'hhh')
    return dict(x=x, y=y, h=h, scaleX=scale_x, scaleY=scale_y, lifetime=lifetime,
                flags2=read(smoke + 12, 'I')[0], flags4=read(smoke + 16, 'I')[0],
                object=read(smoke + 0x33, 'H')[0], renderFlags=read(smoke + 0x35, 'H')[0],
                f1=read(smoke + 0x37, 'h')[0], draw=read(smoke + 0x3a, 'B')[0],
                palette=read(smoke + 0x3c, 'B')[0])


heights = [(i * 47) % 1024 for i in range(16384)]
flags = [i % 2 for i in range(16384)]
for i, (height, flag) in enumerate(zip(heights, flags)):
    write(0x8a03e4 + i * 16, 'Ih', flag, height)

rng = random.Random(0x40b320)
objects = json.loads((ROOT / 'app/original-shapes.json').read_text())['objects']
cases, expected = [], []
for obj in range(len(objects)):
    for quadrant in range(4):
        pose = dict(object=obj, angle=quadrant * 512,
                    anchorX=rng.randrange(128) * 512, anchorY=rng.randrange(128) * 512)
        seed = rng.randrange(2**32)
        write(0x89d178, 'I', seed)
        cpu.mem_write(building, bytes(256))
        write(building + 0x33, 'H', obj)
        write(building + 0x26, 'h', pose['angle'])
        write(building + 0x7a, 'HH', pose['anchorX'], pose['anchorY'])
        result = call(0x40b320, building)
        state = None
        if result:
            call(0x5119d0, smoke)
            state = snapshot()
        cases.append(dict(pose=pose, seed=seed))
        expected.append(dict(smoke=state, randomState=read(0x89d178, 'I')[0]))

step_cases, step_expected = [], []
for i in range(512):
    cpu.mem_write(smoke, bytes(256))
    write(smoke + 0x3d, 'HHh', rng.randrange(65536), rng.randrange(65536), rng.randrange(1024))
    write(smoke + 0x68, 'hhh', rng.choice([-32768, -16, 0, 16, 240, 255, 256, 32767]),
          rng.randrange(257), rng.choice([-32768, -1, 0, 1, 4, 15, 16, 17, 6000, 32767]))
    write(smoke + 0x35, 'H', 0x200 if i % 2 else 0)
    write(smoke + 12, 'I', 4 if i % 3 else 0)
    write(smoke + 16, 'I', 0x400400)
    step_cases.append(snapshot())
    removed = False
    call(0x50be00, smoke)
    step_expected.append(dict(smoke=snapshot(), alive=not removed))

# Execute native bucket selection and the scaled-HFX rectangle branch, including
# the real resolution/depth scaling helper. Rasterization is checked in-browser.
size_cases, size_expected = [], []
polygon, tribe, hfx = 0x2012000, 0x2013000, 0x2020000
write(0x74a350, 'I', tribe)
write(0x59df14, 'I', hfx)
views = json.loads((ROOT / 'app/original-camera.json').read_text())['views']
for i in range(512):
    view = rng.choice(views)
    depth = rng.choice([-32768, -28544, -28481, -28480, 0, 32767, rng.randrange(-32000, 32000)])
    frame = dict(w=rng.randrange(1, 257), h=rng.randrange(1, 257))
    scale = dict(scaleX=rng.randrange(-256, 513), scaleY=rng.randrange(-256, 513))
    render_flags = rng.choice([0, 0x80, 0x100, 0x200, 0x380])
    write(stack + 0x10, 'i', depth)
    cpu.reg_write(UC_X86_REG_ESP, stack)
    cpu.emu_start(0x46fa90, 0x46fab7, count=50)
    assert cpu.reg_read(UC_X86_REG_EIP) == 0x46fab7
    bucket = cpu.reg_read(UC_X86_REG_EAX) + 1
    write(stack + 0x14, 'I', polygon)
    write(stack + 0x30, 'I', bucket)
    write(polygon + 6, 'Ihh', smoke, scale['scaleX'], scale['scaleY'])
    write(smoke + 0x33, 'H', 1345)
    write(smoke + 0x37, 'h', 0)
    write(smoke + 0x3a, 'B', 48)
    write(hfx + 1345 * 8 + 4, 'HH', frame['w'], frame['h'])
    write(tribe + 0x2a, 'i', view['scale'])
    write(0x87ca6c, 'ii', view['spriteScale'], view['shamanScale'])
    write(0x89c669, 'I', render_flags)
    cpu.emu_start(0x46ae97, 0x46af2f, count=500)
    assert cpu.reg_read(UC_X86_REG_EIP) == 0x46af2f
    size_cases.append([frame, scale, depth, render_flags, view])
    size_expected.append(dict(width=read(stack + 0x28, 'i')[0], height=read(stack + 0x24, 'i')[0]))

script = """
import { buildingSmokePoint } from './app/building-shapes.ts';
import { createBuildingSmoke, stepBuildingSmoke } from './app/building-smoke.ts';
import { scaledEffectSize } from './app/projection.ts';
let input = ''; for await (const chunk of process.stdin) input += chunk;
const { heights, flags, cases, steps, sizes } = JSON.parse(input);
const land = { heights, flags };
const fields = Object.keys(steps[0]);
const snapshot = s => Object.fromEntries(fields.map(key => [key, s[key]]));
const starts = cases.map(({pose, seed}) => {
  const rng = { randomState: seed }, point = buildingSmokePoint(pose, rng);
  const smoke = point ? snapshot(createBuildingSmoke(land, point, rng)) : null;
  return { smoke, randomState: rng.randomState };
});
const updates = steps.map(smoke => { const alive = stepBuildingSmoke(land, smoke); return { smoke, alive }; });
console.log(JSON.stringify({ starts, updates, sizes: sizes.map(args => scaledEffectSize(...args)) }));
"""
payload = json.dumps(dict(heights=heights, flags=flags, cases=cases, steps=step_cases, sizes=size_cases)).encode()
actual = json.loads(subprocess.check_output(['node', '--input-type=module', '-e', script], input=payload, cwd=ROOT))
for label, result, native in [('allocation', actual['starts'], expected), ('update', actual['updates'], step_expected), ('sprite size', actual['sizes'], size_expected)]:
    assert len(result) == len(native)
    for i, (a, b) in enumerate(zip(result, native)):
        assert a == b, (label, i, a, b)
    print(f'PASS: {len(result)} native building-smoke {label} comparisons')
