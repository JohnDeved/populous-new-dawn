"""Import only original Options slider art; static PSFB decoding, never native execution.
Usage: python3 scripts/import-options.py /path/to/game/app
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
output = root / 'public/original/options'
output.mkdir(exist_ok=True)
inputs = {}

def read(name):
    data = (source / name).read_bytes()
    inputs[name] = hashlib.sha256(data).hexdigest()
    return data

banks = {}
for skin, sprite, palette in [
    ('frontend', 'data/fenew/feslider.spr', 'data/fenew/fepal1.dat'),
    ('ingame', 'data/fenew/igmslidr.spr', 'data/pal0-c.dat'),
]:
    raw = read(sprite)
    colors = read(palette)
    bank = original.sprites(raw, colors)
    assert [(w, h) for w, h, pixels in bank] == [(308, 19), (23, 22), (23, 22)]
    if skin == 'ingame':
        # Native 004b6820/004b6cb4 build this bank from the current landscape palette.
        # Verify every occupied index is UI-stable across supplied landscape palettes.
        indices = original.sprites(raw, b''.join(bytes([i, 0, 0, 255]) for i in range(256)))
        occupied = {pixels[i] for w, h, pixels in indices for i in range(0, len(pixels), 4) if pixels[i+3]}
        assert not occupied.intersection({254, 255})
        for name in ['0', 's', 'p', 'd', 'g']:
            other = read(f'data/pal0-{name}.dat')
            assert all(colors[i*4:i*4+3] == other[i*4:i*4+3] for i in occupied)
    rects = []
    for frame, (w, h, pixels) in enumerate(bank):
        filename = f'{skin}-{frame}.png'
        original.png(output / filename, w, h, pixels)
        rects.append(dict(file=filename, w=w, h=h))
    banks[skin] = rects
(root / 'app/original-options-art.json').write_text(json.dumps(dict(
    source='Populous: The Beginning supplied Options slider banks', inputs=inputs, banks=banks
), indent=2) + '\n')
