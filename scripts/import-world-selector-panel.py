"""Decode the original selector strip and opening-status/launch overlays only.
Usage: python3 scripts/import-world-selector-panel.py /path/to/game/app
Never executes native code or regenerates existing selector textures.
"""
from pathlib import Path
import hashlib
import importlib.util
import json
import argparse

root = Path(__file__).resolve().parents[1]
parser = argparse.ArgumentParser(description=__doc__)
parser.add_argument('game_root', type=Path)
parser.add_argument('--output', type=Path, default=root / 'public/original/world-selector/panel')
args = parser.parse_args()
source = args.game_root
spec = importlib.util.spec_from_file_location('original', root / 'scripts/import-original.py')
original = importlib.util.module_from_spec(spec)
spec.loader.exec_module(original)
output = args.output
output.mkdir(parents=True, exist_ok=True)
inputs = {}

def read(name):
    data = (source / name).read_bytes()
    inputs[name] = hashlib.sha256(data).hexdigest()
    return data

sprite = read('data/plspanel.spr')
assert inputs['data/plspanel.spr'] == '9b3e17fd501c65c7357cb64c0c8f27ec43304da8726afa6044b642e65e50a778'
banks = {}
for mission in (1, 2, 3):
    header = read(f'levels/levl2{mission:03d}.hdr')
    bank = header[96]
    suffix = chr(ord('0') + bank) if bank < 10 else chr(ord('a') + bank - 10)
    frames = original.sprites(sprite, read(f'data/plspl0-{suffix}.dat'))
    records = {}
    for index in (0, 5, 6, 10):
        w, h, pixels = frames[index]
        assert (w, h) == {0: (638, 61), 5: (10, 12), 6: (10, 12), 10: (37, 37)}[index]
        filename = f'{mission}-{index}.png'
        original.png(output / filename, w, h, pixels)
        records[str(index)] = dict(file=filename, width=w, height=h,
                                  rgbaSha256=hashlib.sha256(pixels).hexdigest(),
                                  outputSha256=hashlib.sha256((output / filename).read_bytes()).hexdigest())
    banks[str(mission)] = dict(palette=suffix, frames=records)
(output / 'provenance.json').write_text(json.dumps(dict(
    consumer='0047e3e0 / 0047e660 / 0047f190; selected palette 00412780',
    inputs=inputs, banks=banks,
    limits='Source-art reconstruction; not an original GPU screenshot. Title font and orbit renderer remain adapted.'
), indent=2) + '\n')
