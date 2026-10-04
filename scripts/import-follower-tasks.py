"""Import the bounded original Followers table artwork without repacking HUD assets.
Usage: python scripts/import-follower-tasks.py /path/to/extracted/game
"""
import hashlib
import importlib.util
import json
import sys
from pathlib import Path
from decomp import ROOT, inspect

source = Path(sys.argv[1])
identity = inspect(source / 'd3dpoptb.exe')
expected = json.loads((ROOT / 'decomp/research/follower-task-panel/native-panel-art.json').read_text())
assert identity['sha256'] == expected['executable']['sha256']
spec = importlib.util.spec_from_file_location('original_assets', ROOT / 'scripts/import-original.py')
assets = importlib.util.module_from_spec(spec)
spec.loader.exec_module(assets)
inputs = {name: (source / name).read_bytes() for name in ['data/hfx0-0.dat', 'data/pal0-c.dat']}
for name, data in inputs.items():
    assert hashlib.sha256(data).hexdigest() == expected['inputs'][name], name
bank = assets.sprites(inputs['data/hfx0-0.dat'], inputs['data/pal0-c.dat'])
width, height = 324, 24
pixels, rects = bytearray(width * height * 4), {}
x = 0
for icon in expected['icons']:
    w, h, data = bank[icon['id']]
    assert (w, h, hashlib.sha256(data).hexdigest()) == (icon['width'], icon['height'], icon['rgbaSha256'])
    assert x + w <= width and h <= height
    rects[str(icon['id'])] = dict(x=x, y=0, w=w, h=h)
    for row in range(h):
        start = (row * width + x) * 4
        pixels[start:start + w * 4] = data[row * w * 4:(row + 1) * w * 4]
    x += w + 1
assets.png(ROOT / 'public/original/follower-tasks.png', width, height, pixels)
# Same native frame families as the persistent strip, at descriptor height34.
for name, start in [('normal', 1005), ('pressed', 1014), ('hover', 996)]:
    pixels = bytearray(15 * 34 * 4)
    draws = [(8,4,4,7,26), (4,4,0,7,4), (5,4,30,7,4), (6,0,4,4,26), (7,11,4,4,26),
             (0,0,0,4,4), (1,11,0,4,4), (2,0,30,4,4), (3,11,30,4,4)]
    for offset, left, top, draw_width, draw_height in draws:
        w, h, data = bank[start + offset]
        for y in range(draw_height):
            for x in range(draw_width):
                src, dest = ((y % h) * w + x % w) * 4, ((top + y) * 15 + left + x) * 4
                if data[src + 3]: pixels[dest:dest + 4] = data[src:src + 4]
    assets.png(ROOT / f'public/original/follower-task-{name}.png', 15, 34, pixels)
# Root004a1720: tiled HFX712 plus frame family005caa40, logical100x277.
width_panel, height_panel = 100, 277
pixels = bytearray(width_panel * height_panel * 4)
for sprite, left, top, draw_width, draw_height in [
    (712,0,0,100,277), (709,8,0,84,4), (562,8,269,84,8),
    (710,0,8,4,261), (711,96,8,4,261),
    (707,0,0,8,8), (708,92,0,8,8), (559,0,269,8,8), (560,92,269,8,8),
]:
    w,h,data = bank[sprite]
    for y in range(draw_height):
        for x in range(draw_width):
            src, dest = ((y % h) * w + x % w) * 4, ((top+y) * width_panel + left+x) * 4
            if data[src+3]: pixels[dest:dest+4] = data[src:src+4]
assets.png(ROOT / 'public/original/follower-task-panel.png', width_panel, height_panel, pixels)
meta = dict(executableSha256=identity['sha256'], inputs={name: hashlib.sha256(data).hexdigest() for name,data in inputs.items()}, width=width, height=height, rects=rects)
(ROOT / 'app/original-follower-tasks.json').write_text(json.dumps(meta, indent=2) + '\n')
print('Imported18 verified native task/transport sprites and three15x34 task frames; existing HUD atlas unchanged')
