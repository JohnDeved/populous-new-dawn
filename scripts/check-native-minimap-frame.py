"""Compare both original minimap frame descriptors, draw calls and imported pixels.
Runs 0049d070, its coordinate converters and 004a1f50. Only the terrain refresh
(00523560) and final sprite/quad submission leaves are intercepted. No recording.
Usage: python scripts/check-native-minimap-frame.py /path/to/d3dpoptb.exe
"""
import hashlib
import importlib.util
import json
import struct
import subprocess
import sys
from pathlib import Path
from PIL import Image
from unicorn import UC_HOOK_CODE
from unicorn.x86_const import UC_X86_REG_ESP, UC_X86_REG_EIP, UC_X86_REG_EAX
from decomp import ROOT, native_cpu

exe = Path(sys.argv[1])
cpu, identity = native_cpu(exe)
cpu.mem_map(0x2000000, 0x100000)
control, entries, texture, stack, stop = 0x2000000, 0x2010000, 0x2020000, 0x20fd000, 0x20fe000

def write(address, fmt, *values):
    cpu.mem_write(address, struct.pack('<' + fmt, *values))

def read(address, fmt):
    return struct.unpack('<' + fmt, cpu.mem_read(address, struct.calcsize('<' + fmt)))[0]

def call(address, *args):
    write(stack, 'I' * (len(args) + 1), stop, *args)
    cpu.reg_write(UC_X86_REG_ESP, stack)
    cpu.emu_start(address, stop, count=100000)
    assert cpu.reg_read(UC_X86_REG_EIP) == stop

meta = json.loads((ROOT / 'app/original-minimap-frame.json').read_text())
assert meta['executableSha256'] == identity['sha256']
raw = (exe.parent / 'data/hfx0-0.dat').read_bytes()
pal = (exe.parent / 'data/pal0-c.dat').read_bytes()
for name, data in [('hfx0-0.dat', raw), ('pal0-c.dat', pal)]:
    assert hashlib.sha256(data).hexdigest() == meta['sha256']['data/' + name]
spec = importlib.util.spec_from_file_location('assets', ROOT / 'scripts/import-original.py')
assets = importlib.util.module_from_spec(spec)
spec.loader.exec_module(assets)
bank = assets.sprites(raw, pal)
atlas = Image.open(ROOT / 'public/original/minimap-frame.png').convert('RGBA')
for key, rect in meta['rects'].items():
    w, h, pixels = bank[int(key)]
    assert (w, h) == (rect['w'], rect['h'])
    assert atlas.crop((rect['x'], rect['y'], rect['x'] + w, rect['y'] + h)).tobytes() == pixels
for sprite in (694, 695, 696, 697):
    w, h, data = bank[sprite]
    for y in range(h):
        for x in range(w):
            ref = y * w if w == 8 else x
            assert data[(y * w + x) * 4:(y * w + x + 1) * 4] == data[ref * 4:(ref + 1) * 4]
# Quad UV repeat amounts divide by edge thickness (3), not tile length (8).
# These exact edge pixels are constant along that axis, so either repetition has
# identical pixels; this does not claim general D3D texture sampling equivalence.
for name, address in [('large', 0x5cab30), ('small', 0x5cab48)]:
    assert list(struct.unpack('<9H', cpu.mem_read(address, 18))) == meta['descriptors'][name]
assert struct.unpack('<6h', cpu.mem_read(0x5cb4e9, 12)) == (0, 0, 0, 0, 100, 96)
assert read(0x5cb4f9, 'I') == 0x49d070
for i, (w, h, _) in enumerate(bank):
    write(entries + i * 8, 'IHH', 0, w, h)
write(0x59df14, 'I', entries)
write(0x5ce0bc, 'I', texture)
write(0x89c6f0, 'B', 0)
draws, rectangles = [], []

def intercept(c, address, size, user):
    sp = c.reg_read(UC_X86_REG_ESP)
    if address == 0x4a1f50:
        rect = read(sp + 4, 'I')
        rectangles.append(list(struct.unpack('<4i', c.mem_read(rect, 16))))
        return  # Observe the real renderer without replacing it.
    if address == 0x47dfd0:
        x, y, w, h, u, v = struct.unpack('<6f', c.mem_read(sp + 4, 24))
        sprite = read(sp + 32, 'I') & 65535
        if sprite in (694, 695):
            assert abs(u - w / 3) < 1e-5 and v == 1
        else:
            assert sprite in (696, 697) and u == 1 and abs(v - h / 3) < 1e-5
        draws.append(dict(sprite=str(sprite), x=int(x), y=int(y), width=int(w), height=int(h)))
    elif address == 0x5162e0:
        entry = read(sp + 12, 'I')
        draws.append(dict(sprite=str((entry - entries) // 8), x=read(sp + 4, 'i'), y=read(sp + 8, 'i'),
                          width=read(entry + 4, 'H'), height=read(entry + 6, 'H')))
    c.reg_write(UC_X86_REG_EAX, 0)
    c.reg_write(UC_X86_REG_EIP, read(sp, 'I'))
    c.reg_write(UC_X86_REG_ESP, sp + (44 if address == 0x47dfd0 else 4))

for address in (0x523560, 0x4a1f50, 0x47dfd0, 0x5162e0):
    cpu.hook_add(UC_HOOK_CODE, intercept, begin=address, end=address)
cases, expected = [], []
for width, height in [(512, 480), (513, 480), (640, 480), (1280, 720), (1440, 1000), (3840, 2160)]:
    write(0x89c6cf, 'HH', width, height)
    for offset, value in [(0x37, 0), (0x3b, 0), (0x47, 10240), (0x4b, 13107)]:
        write(control + offset, 'i', value)
    draws, rectangles = [], []
    call(0x49d070, control)
    left, top, right, bottom = rectangles[0]
    assert (left, top) == (0, 0)
    cases.append([right, bottom, width])
    expected.append(draws)
    print(f'Native {width}x{height}: frame {right}x{bottom}, {len(draws)} submissions, first sprite {draws[0]["sprite"]}')
# Exact modern uniform HUD rectangles and partial edge tiles, separately from
# original independent-axis layout, run through the same original frame routine.
for width, height, screen in [(100, 96, 640), (200, 192, 1440), (250, 240, 3840), (203, 197, 1440), (80, 77, 512), (49, 96, 513), (100, 48, 513)]:
    write(control + 256, '4i', 0, 0, width, height)
    draws = []
    call(0x4a1f50, control + 256, 0x5cab48 if screen < 513 else 0x5cab30)
    cases.append([width, height, screen])
    expected.append(draws)
js = """import { minimapFrameDraws } from './app/minimap-frame.ts';
let input='';for await(const part of process.stdin)input+=part;
console.log(JSON.stringify(JSON.parse(input).map(args=>minimapFrameDraws(...args))));"""
actual = subprocess.check_output(['node', '--input-type=module', '-e', js], input=json.dumps(cases).encode(), cwd=ROOT)
assert json.loads(actual) == expected
print(f'PASS: {len(cases)} original frame call lists; exact two descriptors and all 12 imported sprites; no center fill; native 512/513 boundary; independent native and uniform modern rectangles')

if '--browser' in sys.argv:
    path = Path(sys.argv[sys.argv.index('--browser') + 1])
    browser_cases = json.loads(path.read_text())
    for case in browser_cases:
        width, height, screen = case['width'], case['height'], case['viewportWidth']
        write(control + 256, '4i', 0, 0, width, height)
        draws = []
        call(0x4a1f50, control + 256, 0x5cab48 if screen < 513 else 0x5cab30)
        pixels = bytearray(width * height * 4)
        for draw in draws:
            sw, sh, data = bank[int(draw['sprite'])]
            for y in range(draw['height']):
                for x in range(draw['width']):
                    dx, dy = draw['x'] + x, draw['y'] + y
                    if not (0 <= dx < width and 0 <= dy < height):
                        continue
                    src = ((y % sh) * sw + x % sw) * 4
                    if data[src + 3]:
                        at = (dy * width + dx) * 4
                        pixels[at:at + 4] = data[src:src + 4]
        assert hashlib.sha256(pixels).hexdigest() == case['rgbaHash'], case['name']
        # Actual page screenshots include terrain through the transparent hole and
        # category tabs over the lower frame. Compare only exposed opaque pixels.
        if case['dpr'] in (1, 2) and case['displayedWidth'] == width and case['displayedHeight'] == height and (case['name'].startswith('viewport-') or case['name'] == 'dpr-2'):
            screenshot = Image.open(path.parent / f"{case['name']}-frame.png").convert('RGBA')
            dpr = case['dpr']
            assert screenshot.size == (width * dpr, height * dpr)
            actual = screenshot.tobytes()
            terrain = Image.open(path.parent / case['terrainFile']).convert('RGBA')
            assert terrain.size == (width, height)
            terrain_pixels = terrain.tobytes()
            cutoff = min(height, int(width * 0.85))  # Existing dock-tabs top=85 logical pixels.
            for y in range(cutoff):
                for x in range(width):
                    at = (y * width + x) * 4
                    terrain_pixel = terrain_pixels[at:at + 4]
                    alpha = terrain_pixel[3] / 255
                    # Rotated terrain has transparent/antialiased outer pixels.
                    # Browser composition places those over the unchanged #142d38
                    # wrap background. Native frame art remains exactly opaque.
                    expected = pixels[at:at + 4] if pixels[at + 3] else bytes([
                        round(terrain_pixel[c] * alpha + background * (1 - alpha))
                        for c, background in enumerate((20, 45, 56))] + [255])
                    tolerance = 1 if not pixels[at + 3] and 0 < alpha < 1 else 0
                    for oy in range(dpr):
                        for ox in range(dpr):
                            dest = ((y * dpr + oy) * width * dpr + x * dpr + ox) * 4
                            assert all(abs(a - b) <= tolerance for a, b in zip(actual[dest:dest + 4], expected)), (case['name'], x, y, 'frame' if pixels[at + 3] else 'unclipped terrain')
    print(f'PASS: {len(browser_cases)} shipped-browser frame RGBA hashes match native submissions; exposed composed frame and terrain-hole screenshot pixels match at integer CSS sizes')
