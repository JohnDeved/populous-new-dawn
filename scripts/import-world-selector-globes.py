#!/usr/bin/env python3
"""Import ordinary orbital textures (00428b90), not selected-preview images."""
import argparse
import hashlib
import importlib.util
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]


def decode_globe(texture, palette):
    if len(texture) != 262144 or len(palette) != 1024:
        raise ValueError('Expected four 256-square index tiles and a 256-entry RGBA palette')
    rgb = bytearray(128 * 128 * 3)
    for y in range(128):
        for x in range(128):
            tile = (y // 64) * 2 + x // 64
            start = tile * 65536 + (y % 64) * 4 * 256 + (x % 64) * 4
            indices = [texture[start + dy * 256 + dx] * 4
                       for dy in range(4) for dx in range(4)]
            for channel in range(3):
                rgb[(y * 128 + x) * 3 + channel] = sum(
                    palette[index + channel] for index in indices) >> 4
    return bytes(rgb)


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('game_root', type=Path)
    parser.add_argument('--output', type=Path, default=ROOT / 'public/original/world-selector/globes')
    args = parser.parse_args()
    spec = importlib.util.spec_from_file_location('decoder', ROOT / 'scripts/import-original.py')
    decoder = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(decoder)
    args.output.mkdir(parents=True, exist_ok=True)
    records = []
    for mission in range(1, 25):
        header_path = f'levels/levl2{mission:03d}.hdr'
        header = (args.game_root / header_path).read_bytes()
        if len(header) != 616:
            raise ValueError(f'Unexpected mission header: {header_path}')
        bank = header[96]
        if bank > 35:
            raise ValueError('Unsupported palette bank')
        suffix = str(bank) if bank < 10 else chr(ord('a') + bank - 10)
        paths = [header_path, f'data/plstx{mission:03d}.dat', f'data/plspl0-{suffix}.dat']
        inputs = [(args.game_root / path).read_bytes() for path in paths]
        rgb = decode_globe(inputs[1], inputs[2])
        rgba = b''.join(rgb[i:i+3] + b'\xff' for i in range(0, len(rgb), 3))
        output = args.output / f'mission-{mission}.png'
        decoder.png(output, 128, 128, rgba)
        records.append({'mission': mission, 'bank': bank, 'width': 128, 'height': 128,
                        'sources': {path: hashlib.sha256(data).hexdigest()
                                    for path, data in zip(paths, inputs)},
                        'rgbSha256': hashlib.sha256(rgb).hexdigest(), 'output': output.name,
                        'outputSha256': hashlib.sha256(output.read_bytes()).hexdigest()})
    for name, expected in [('Sun.png', '67d20335b39471fa5c0be3799b8ae36e41ba857d77b5b804201c79c9d905a657'),
                           ('ring.png', '6814e461c75a21d904132087a37eea8045d5d9d69a09f230e0b0ae6b1340245c')]:
        data = (args.game_root / 'data/d3d' / name).read_bytes()
        if hashlib.sha256(data).hexdigest() != expected:
            raise ValueError(f'Source hash mismatch: {name}')
        (args.output / name.lower()).write_bytes(data)
        records.append({'source': f'data/d3d/{name}', 'output': name.lower(),
                        'sourceSha256': expected, 'outputSha256': expected})
    (args.output / 'provenance.json').write_text(json.dumps({
        'consumer': '004289c8 -> 00428b90 -> 004306d0',
        'layout': 'Four sequential 256x256 tiles: TL, TR, BL, BR',
        'reduction': 'Per-channel palette RGB integer sum of 4x4 pixels, shifted right 4',
        'adaptation': 'RGB8 before device-dependent texture quantization',
        'assets': records}, indent=2) + '\n')
    print('Imported 24 ordinary globe textures and source sun/orbit images.')


if __name__ == '__main__':
    main()
