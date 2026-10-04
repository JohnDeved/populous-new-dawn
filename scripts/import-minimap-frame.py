"""Import only the two native minimap-frame descriptors and their exact HFX pixels.
Usage: python scripts/import-minimap-frame.py /path/to/extracted/game
Does not rewrite the shared HUD atlas or the legacy composite frame.
"""
import hashlib
import importlib.util
import json
import struct
import sys
from pathlib import Path
from decomp import ROOT, native_cpu

source = Path(sys.argv[1])
cpu, identity = native_cpu(source / 'd3dpoptb.exe')
spec = importlib.util.spec_from_file_location('assets', ROOT / 'scripts/import-original.py')
assets = importlib.util.module_from_spec(spec)
spec.loader.exec_module(assets)
raw = (source / 'data/hfx0-0.dat').read_bytes()
palette = (source / 'data/pal0-c.dat').read_bytes()
accepted = json.loads((ROOT / 'app/original-hud.json').read_text())
inputs = {'data/hfx0-0.dat': raw, 'data/pal0-c.dat': palette}
hashes = {name: hashlib.sha256(data).hexdigest() for name, data in inputs.items()}
assert all(accepted['sha256'][name] == digest for name, digest in hashes.items())
descriptors = {name: list(struct.unpack('<9H', cpu.mem_read(address, 18)))
               for name, address in [('large', 0x5cab30), ('small', 0x5cab48)]}
assert descriptors == {'large': [690, 694, 691, 696, 0, 697, 692, 695, 693],
                       'small': [86, 694, 87, 696, 0, 697, 88, 695, 89]}
bank = assets.sprites(raw, palette)
width, height, x, rects = 512, 50, 0, {}
pixels = bytearray(width * height * 4)
for sprite in sorted(set(sum(descriptors.values(), [])) - {0}):
    w, h, data = bank[sprite]
    rects[str(sprite)] = dict(x=x, y=0, w=w, h=h)
    for y in range(h):
        pixels[(y * width + x) * 4:(y * width + x + w) * 4] = data[y * w * 4:(y + 1) * w * 4]
    x += w + 1
assert x <= width
assets.png(ROOT / 'public/original/minimap-frame.png', width, height, pixels)
meta = dict(executableSha256=identity['sha256'], sha256=hashes, width=width, height=height,
            descriptors=descriptors, rects=rects)
(ROOT / 'app/original-minimap-frame.json').write_text(json.dumps(meta, separators=(',', ':')) + '\n')
print(f'Imported {len(rects)} exact minimap frame sprites from both native descriptors')
