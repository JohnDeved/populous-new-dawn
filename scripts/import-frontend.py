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
raw = bytearray(background + palette + read('fefade1.dat'))
assert len(raw) == 640 * 480 + 1024 + 16384
mask_banks = {}
for name in ['FEFT33WE.spr', 'Fehi33we.spr', 'Felo33we.spr', 'FEsd33WE.spr', 'felgspen.spr', 'FELGsdEN.spr', 'Fepointe.spr', 'fecursor.spr']:
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
    if stem in ['felgsden', 'fesd33we', 'fecursor']:
        index_palette = b''.join(bytes([i, 0, 0, 255]) for i in range(256))
        masks = []
        for w, h, pixels in original.sprites((source / name).read_bytes(), index_palette):
            masks.append(dict(w=w, h=h, offset=len(raw)))
            # Transparent is 255; original fade masks contain only rows 0..63.
            values = bytes(pixels[i] if pixels[i+3] else 255 for i in range(0, len(pixels), 4))
            assert all(v < 64 or v == 255 for v in values)
            raw.extend(values)
        mask_banks[stem] = masks
    if stem == 'fepointe':
        original.png(outputs / 'pointer.png', *bank[0])
    if stem not in mask_banks:
        original.png(outputs / f'{stem}.png', width, height, atlas)
    rects[stem] = dict(width=width, height=height, rects=entries)
metadata = dict(source='Populous: The Beginning supplied assets', inputs=inputs,
                background=dict(width=640, height=480), banks=rects, masks=mask_banks, binaryBytes=len(raw))
(outputs / 'composition.bin').write_bytes(raw)
(root / 'app/original-frontend.json').write_text(json.dumps(metadata, indent=2) + '\n')
