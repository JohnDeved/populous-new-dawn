#!/usr/bin/env python3
"""Decode only the three original opening-world texture maps and their palettes.
No sphere lighting, perspective, or native sprite compositing is claimed here.
"""
import argparse
import hashlib
import importlib.util
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]

def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('game_root', type=Path)
    parser.add_argument('--output', type=Path, default=ROOT / 'public/original/world-selector')
    args = parser.parse_args()
    spec = importlib.util.spec_from_file_location('decoder', ROOT / 'scripts/import-original.py')
    decoder = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(decoder)
    args.output.mkdir(parents=True, exist_ok=True)
    records = []
    for mission in (1,2,3):
        paths = [f'levels/levl2{mission:03d}.hdr', f'data/plstx{mission:03d}.dat']
        header = (args.game_root / paths[0]).read_bytes()
        bank = header[96]  # 004852f0 -> 00412780
        suffix = chr(ord('0') + bank) if bank < 10 else chr(ord('a') + bank - 10)
        paths.append(f'data/plspl0-{suffix}.dat')
        texture = (args.game_root / paths[1]).read_bytes()
        palette = (args.game_root / paths[2]).read_bytes()
        assert len(texture) == 512 * 512 and len(palette) == 1024
        rgba = b''.join(palette[index*4:index*4+3] + b'\xff' for index in texture)
        output = args.output / f'mission-{mission}.png'
        decoder.png(output,512,512,rgba)
        records.append({'mission':mission, 'bank':bank, 'width':512, 'height':512,
                        'sources':{path:hashlib.sha256((args.game_root/path).read_bytes()).hexdigest() for path in paths},
                        'output':output.name,'outputSha256':hashlib.sha256(output.read_bytes()).hexdigest()})
    (args.output/'provenance.json').write_text(json.dumps({'consumer':'00412780 / 004852f0','assets':records},indent=2)+'\n')
    print('Decoded and verified three original selector texture maps.')

if __name__ == '__main__':
    main()
