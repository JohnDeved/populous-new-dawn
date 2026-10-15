"""Scoped original frontend assets. Static data only; never run the original executable.
Usage: python3 scripts/import-frontend.py /path/to/game/app
"""
from pathlib import Path
import hashlib
import importlib.util
import json
import sys

root = Path(__file__).resolve().parents[1]
spec = importlib.util.spec_from_file_location('original', root / 'scripts/import-original.py')
original = importlib.util.module_from_spec(spec)
spec.loader.exec_module(original)
source = Path(sys.argv[1]) / 'data/fenew'
outputs = root / 'public/original/frontend'
outputs.mkdir(exist_ok=True)
inputs = {}

def read(name):
    data = (source / name).read_bytes()
    inputs[name] = hashlib.sha256(data).hexdigest()
    return data

palette = read('fepal1.dat')
assert len(palette) == 1024
background = read('Febackg1.dat')
assert len(background) == 640 * 480
original.png(outputs / 'background.png', 640, 480,
             b''.join(palette[value*4:value*4+3] + b'\xff' for value in background))
# FE font styles use sprite index character-0x20 and the decoded sprite width.
# Keep each source bank separate so no guessed palette/color conversion occurs.
rects = {}
for name in ['Fehi20we.spr', 'Felo20we.spr', 'FEsd20WE.spr', 'felgspen.spr', 'FELGsdEN.spr', 'Fepointe.spr']:
    bank = original.sprites(read(name), palette)
    width = max(512, max(w for w, h, pixels in bank))
    x = y = row_height = 0
    entries = []
    for w, h, pixels in bank:
        if x + w > width:
            x, y, row_height = 0, y + row_height, 0
        entries.append(dict(x=x, y=y, w=w, h=h))
        x += w
        row_height = max(row_height, h)
    height = y + row_height
    atlas = bytearray(width * height * 4)
    for (w, h, pixels), rect in zip(bank, entries):
        for row in range(h):
            at = ((rect['y'] + row) * width + rect['x']) * 4
            atlas[at:at+w*4] = pixels[row*w*4:(row+1)*w*4]
    stem = name.lower().removesuffix('.spr')
    original.png(outputs / f'{stem}.png', width, height, atlas)
    rects[stem] = dict(width=width, height=height, rects=entries)
metadata = dict(source='Populous: The Beginning supplied assets', inputs=inputs,
                background=dict(width=640, height=480), banks=rects)
(root / 'app/original-frontend.json').write_text(json.dumps(metadata, indent=2) + '\n')
