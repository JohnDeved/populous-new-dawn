"""Strict append-only Hypnotise HFX1264–1279 import. Original files are data only.

Usage: python3 scripts/import-hypnotise.py GAME_ROOT [--check]
The read-only check validates all old metadata/pixels and every new atlas byte.
"""
import argparse
import hashlib
import importlib.util
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
OLD_HEIGHT = 6656
OLD_METADATA = '8e43389fe9610e70fcedbbd8fe63b11d4addf9a001378225ee5ce273c5b83fdb'
OLD_PIXELS = '123d0f355757e31cd51fd3ed081d1b05d6165702b38224e26863218c2e18282b'


def sha(data):
    return hashlib.sha256(data).hexdigest()


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('game', type=Path)
    parser.add_argument('--check', action='store_true')
    args = parser.parse_args()
    spec = importlib.util.spec_from_file_location('original_decoder', ROOT / 'scripts/import-original.py')
    decoder = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(decoder)
    metadata_path = ROOT / 'app/original-effects.json'
    atlas_path = ROOT / 'public/original/effects.png'
    metadata = json.loads(metadata_path.read_text())
    width, height, pixels = decoder.read_owned_rgba_png(atlas_path)
    assert width == 2048 and (width, height) == (metadata['width'], metadata['height'])
    old = pixels[:width * OLD_HEIGHT * 4]
    assert sha(old) == OLD_PIXELS, 'Existing pixels changed'
    baseline = json.loads(json.dumps(metadata))
    baseline['height'] = OLD_HEIGHT
    baseline['animations'].pop('hypnotise', None)
    assert sha(json.dumps(baseline, separators=(',', ':')).encode()) == OLD_METADATA, 'Existing metadata changed'
    assert ('hypnotise' in metadata['animations']) == args.check, 'Use --check after importing'
    assert height == OLD_HEIGHT + (512 if args.check else 0)
    provenance = json.loads((ROOT / 'public/original/provenance.json').read_text())['sha256']
    inputs = {}
    for name in ['hfx0-0.dat', 'al0-c.dat', 'pal0-c.dat']:
        inputs[name] = (args.game / 'data' / name).read_bytes()
        assert sha(inputs[name]) == provenance['data/' + name], 'Canonical input mismatch: ' + name
    alpha, palette = inputs['al0-c.dat'], inputs['pal0-c.dat']
    colors = b''.join(palette[alpha[(v | 15) * 256] * 4:alpha[(v | 15) * 256] * 4 + 3]
                      + bytes([(v & 15) * 17]) for v in range(256))
    sprites = decoder.sprites(inputs['hfx0-0.dat'], colors, alpha=True)
    expected = bytearray(width * (OLD_HEIGHT + 512) * 4)
    expected[:len(old)] = old
    frames = []
    for n, source in enumerate(range(1264, 1280)):
        w, h, rgba = sprites[source]
        assert (w, h) == (100, 100)
        index = OLD_HEIGHT // 256 * 8 + n
        x, y = index % 8 * 256, index // 8 * 256
        for row in range(h):
            start = ((y + row) * width + x) * 4
            expected[start:start + w * 4] = rgba[row * w * 4:(row + 1) * w * 4]
        frames.append({'index': index, 'w': w, 'h': h, 'source': source})
    if args.check:
        assert metadata['animations']['hypnotise'] == frames
        assert pixels == expected, 'New atlas rectangles or padding differ'
    else:
        metadata['height'] = OLD_HEIGHT + 512
        metadata['animations']['hypnotise'] = frames
        decoder.png(atlas_path, width, metadata['height'], expected)
        metadata_path.write_text(json.dumps(metadata, separators=(',', ':')))
    print('PASS: 16 Hypnotise frames; all old metadata/pixels preserved, new padding transparent')


if __name__ == '__main__':
    main()
