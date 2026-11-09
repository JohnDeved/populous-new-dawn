"""Scoped in-game pause font import. Static supplied PSFB data; no EXE execution.
Usage: python3 scripts/import-pause-font.py /path/to/game/app
"""
from pathlib import Path
import hashlib
import importlib.util
import json
import sys

root = Path(__file__).resolve().parents[1]
source = Path(sys.argv[1])
spec = importlib.util.spec_from_file_location('original', root / 'scripts/import-original.py')
original = importlib.util.module_from_spec(spec)
spec.loader.exec_module(original)
inputs = {}
def read(name):
    data = (source / name).read_bytes()
    inputs[name] = hashlib.sha256(data).hexdigest()
    return data

# 004fdd64 maps style2 bank IDs6–9 to 0087cbf4 = data/f00t9-0.dat.
# Use the same initial mission palette as existing HUD imports. Dynamic palette
# changes and native sine entrance fade remain outside this bounded import.
bank = original.sprites(read('data/f00t9-0.dat'), read('data/pal0-c.dat'))
assert len(bank) == 224
width = 512
x = y = row_height = 0
rects = []
for w, h, pixels in bank:
    if x + w > width:
        x, y, row_height = 0, y + row_height, 0
    rects.append(dict(x=x, y=y, w=w, h=h))
    x += w
    row_height = max(row_height, h)
height = y + row_height
atlas = bytearray(width * height * 4)
for (w, h, pixels), rect in zip(bank, rects):
    for row in range(h):
        at = ((rect['y'] + row) * width + rect['x']) * 4
        atlas[at:at+w*4] = pixels[row*w*4:(row+1)*w*4]
original.png(root / 'public/original/pause-font.png', width, height, atlas)
(root / 'app/original-pause-font.json').write_text(json.dumps(dict(
    source='Populous: The Beginning supplied F00T9 in-game font', inputs=inputs,
    width=width, height=height, rects=rects), indent=2) + '\n')
