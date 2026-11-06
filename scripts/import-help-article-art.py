#!/usr/bin/env python3
"""Import only new Encyclopaedia navigation/inline PNGs from verified game data.

No game code is executed. Existing outputs must match exactly; new outputs use
exclusive creation. --check writes nothing. Optional --reuse-assets accepts only
regular, non-aliased files with bytes equal to the newly decoded PNG.
"""
import sys
sys.dont_write_bytecode = True

import argparse
import importlib.util
import json
from pathlib import Path
import os
import struct

ROOT = Path(__file__).resolve().parents[1]
spec = importlib.util.spec_from_file_location('help_ui', ROOT / 'scripts/import-help-ui.py')
base = importlib.util.module_from_spec(spec)
spec.loader.exec_module(base)
original = base.original
INPUTS = ('d3dpoptb.exe', 'data/pal0-c.dat', 'data/hfx0-0.dat')
INLINE = [1598, 1599, 1601, 1602, 1600, 1595, 1596, 1597, 1594, 1603, 1604,
          1605, 1606, 1607, 1608, 1609, 1609, 1611, 1612, 1613, 1614]
FRAMES = {
    'normal': (0x5cacc8, [821, 825, 822, 827, 829, 828, 823, 826, 824]),
    'held': (0x5cace0, [839, 843, 840, 845, 847, 846, 841, 844, 842]),
    'hover': (0x5cacf8, [830, 834, 831, 836, 838, 837, 832, 835, 833]),
}


def build(inputs):
    decode, png, fingerprints = original.load_decoder(ROOT / 'scripts/import-original.py')
    pe = original.StaticPE(inputs['d3dpoptb.exe'])
    inline_bytes = pe.read(0x59bdc0, 84)
    if list(struct.unpack('<21I', inline_bytes)) != INLINE:
        raise ValueError('Unexpected native inline image mapping')
    addressed = {'inline': {'address': '0059bdc0', 'hex': inline_bytes.hex()}}
    for name, (address, ids) in FRAMES.items():
        raw = pe.read(address, 18)
        if list(struct.unpack('<9H', raw)) != ids:
            raise ValueError(f'Unexpected native navigation table: {name}')
        addressed[name] = {'address': f'{address:08x}', 'hex': raw.hex()}
    sprites = decode(inputs['data/hfx0-0.dat'], inputs['data/pal0-c.dat'])
    outputs, icons = {}, {}

    class Output:
        def __init__(self, name): self.name = name
        def write_bytes(self, data): outputs[self.name] = data

    for sprite in sorted(set(INLINE) | {i for _, ids in FRAMES.values() for i in ids}):
        w, h, pixels = sprites[sprite]
        name = f'public/original/help-article/hfx-{sprite}.png'
        png(Output(name), w, h, pixels)
        icons[str(sprite)] = {'url': f'/original/help-article/hfx-{sprite}.png',
                              'width': w, 'height': h,
                              'rgbaSha256': original.sha(bytes(pixels)),
                              'pngSha256': original.sha(outputs[name])}
    manifest = {'inline': INLINE, 'frames': {name: ids for name, (_, ids) in FRAMES.items()},
                'icons': icons, 'provenance': {
                    'inputs': {name: base.EXPECTED[name] for name in INPUTS},
                    'decoders': fingerprints, 'addressedTables': addressed,
                    'originalExecuted': False,
                    'boundary': 'Original indexed pixels, not original-runtime captures; hover cadence requires native counter 00897981 bit 0x04.'}}
    outputs['app/original-help-article.json'] = (json.dumps(manifest, indent=2) + '\n').encode()
    return outputs


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('game_root', type=Path)
    parser.add_argument('--output', type=Path, default=ROOT)
    parser.add_argument('--reuse-assets', type=Path)
    parser.add_argument('--check', action='store_true')
    args = parser.parse_args()
    inputs, input_receipt = {}, {}
    for name in INPUTS:
        path = args.game_root / name
        if not base.regular_file(path):
            raise FileNotFoundError(path)
        data = path.read_bytes()
        if original.sha(data) != base.EXPECTED[name]:
            raise ValueError(f'Input hash mismatch: {path}')
        inputs[name] = data
        input_receipt[name] = {'path': str(path), 'sha256': original.sha(data)}
    outputs = build(inputs)
    reused = {}
    for name, expected in outputs.items():
        path = base.output_target(args.output, name)
        exists = base.regular_file(path)
        if exists and path.read_bytes() != expected:
            raise ValueError(f'Differing owned output; use a fresh --output for review: {path}')
        if args.check and not exists:
            raise FileNotFoundError(path)
        if args.reuse_assets and name.endswith('.png'):
            reuse = base.output_target(args.reuse_assets, Path(name).name)
            if base.regular_file(reuse):
                if reuse.read_bytes() != expected:
                    raise ValueError(f'Reuse bytes differ: {reuse}')
                reused[name] = reuse
    created = []
    if not args.check:
        for name, data in outputs.items():
            path = base.output_target(args.output, name)
            if not base.regular_file(path):
                if name in reused:
                    path.parent.mkdir(parents=True, exist_ok=True)
                    os.link(reused[name], path)  # Exclusive, never replaces an existing destination.
                else:
                    base.write_new(path, data)
                created.append(name)
    print(json.dumps({'check': args.check, 'inputs': input_receipt,
                      'outputs': {name: original.sha(data) for name, data in outputs.items()},
                      'created': created, 'reused': [name for name in created if name in reused],
                      'exclusiveCreation': True, 'originalExecuted': False}, indent=2))


if __name__ == '__main__':
    main()
