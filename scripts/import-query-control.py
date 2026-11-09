#!/usr/bin/env python3
"""Hash-locked640-reference Query artwork only; no original execution.

Usage: python3 scripts/import-query-control.py GAME_ROOT [--reuse-assets DIR]
       [--output PROJECT_ROOT] [--check]
The optional reused PNGs must match freshly decoded source bytes exactly before
hardlinking. Existing outputs are checked, never overwritten. --check is read-only.
"""
import sys
sys.dont_write_bytecode = True

import argparse
import importlib.util
import json
import os
from pathlib import Path
import struct
import stat

ROOT = Path(__file__).resolve().parents[1]
spec = importlib.util.spec_from_file_location('result_ui', ROOT / 'scripts/import-result-ui.py')
original = importlib.util.module_from_spec(spec)
spec.loader.exec_module(original)
EXPECTED = {name: original.EXPECTED[name] for name in (
    'd3dpoptb.exe', 'data/pal0-c.dat', 'data/hfx0-0.dat')}
FRAMES = {
    'normal': (0x5caba8, [1005, 1009, 1006, 1011, 1013, 1012, 1007, 1010, 1008]),
    'hover': (0x5cabd8, [996, 1000, 997, 1002, 1004, 1003, 998, 1001, 999]),
    'held': (0x5cabc0, [1014, 1018, 1015, 1020, 1022, 1021, 1016, 1019, 1017]),
}


def build(inputs):
    sprites, png, decoder_hashes = original.load_decoder(ROOT / 'scripts/import-original.py')
    hfx = sprites(inputs['data/hfx0-0.dat'], inputs['data/pal0-c.dat'])
    pe = original.StaticPE(inputs['d3dpoptb.exe'])
    outputs = {}

    class Output:
        def __init__(self, path):
            self.path = path

        def write_bytes(self, data):
            outputs[self.path] = data

    def addressed(address, count):
        raw = pe.read(address, count)
        return {'address': f'{address:08x}', 'sha256': original.sha(raw), 'hex': raw.hex()}

    icons = {}
    for index in [105, *range(996, 1023)]:
        width, height, pixels = hfx[index]
        if (width, height) != ((4, 6) if index == 105 else (4, 4)):
            raise ValueError('Unexpected Query sprite dimensions')
        path = f'public/original/query-control/hfx-{index}.png'
        png(Output(path), width, height, pixels)
        icons[str(index)] = {'url': f'/original/query-control/hfx-{index}.png',
                             'width': width, 'height': height, 'sha256': original.sha(outputs[path])}
    frames = {}
    for name, (address, expected) in FRAMES.items():
        actual = list(struct.unpack('<9H', pe.read(address, 18)))
        if actual != expected:
            raise ValueError('Unexpected Query frame table')
        frames[name] = {**addressed(address, 18), 'ids': actual}
    raw = pe.read(0x5cb386, 66)
    if struct.unpack_from('<h', raw, 63)[0] != 1051:
        raise ValueError('Unexpected Query help topic')
    metadata = {'inputs': EXPECTED, 'decoders': decoder_hashes, 'originalExecuted': False,
                'referenceRect': [64, 114, 13, 12], 'icons': icons, 'frames': frames,
                'sourceDescriptor': {**addressed(0x5cb386, 66), 'helpTopic': 1051},
                'sourceRenderer': addressed(0x49d1d0, 0x49d293 - 0x49d1d0),
                'boundary': 'Source-palette640-reference Query art. Menu callback retained; no Query behavior or original GPU-capture claim.'}
    outputs['decomp/research/native-help/query-control.json'] = (json.dumps(metadata, indent=2) + '\n').encode()
    return outputs



def regular_file(path):
    try:
        mode = path.lstat().st_mode
    except FileNotFoundError:
        return False
    if not stat.S_ISREG(mode):
        raise ValueError(f'Not a regular, non-symlink file: {path}')
    return True


def output_target(root, name):
    root = root.absolute()
    if root.is_symlink() or not root.is_dir():
        raise ValueError('Output root must be an existing non-symlink directory')
    path = root / name
    if not path.parent.resolve().is_relative_to(root.resolve()):
        raise ValueError(f'Output escapes selected root: {path}')
    parent = path.parent
    while parent != root:
        if parent.is_symlink() or (parent.exists() and not parent.is_dir()):
            raise ValueError(f'Unsafe output parent: {parent}')
        parent = parent.parent
    regular_file(path)
    return path


def write_new(path, data, reused=None):
    path.parent.mkdir(parents=True, exist_ok=True)
    if reused is not None:
        os.link(reused, path, follow_symlinks=False)
    else:
        with path.open('xb') as stream:
            stream.write(data)


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('game_root', type=Path)
    parser.add_argument('--reuse-assets', type=Path)
    parser.add_argument('--output', type=Path, default=ROOT)
    parser.add_argument('--check', action='store_true')
    args = parser.parse_args()
    inputs = {}
    for name, expected in EXPECTED.items():
        data = (args.game_root / name).read_bytes()
        if original.sha(data) != expected:
            raise ValueError(f'Input hash mismatch: {name}')
        inputs[name] = data
    outputs = build(inputs)
    reused = {}
    for name, data in outputs.items():
        path = output_target(args.output, name)
        if regular_file(path) and path.read_bytes() != data:
            raise ValueError(f'Differing owned output; use a fresh --output: {path}')
        if args.check and not regular_file(path):
            raise FileNotFoundError(path)
        if args.reuse_assets and name.endswith('.png'):
            candidate = args.reuse_assets / Path(name).name
            if not regular_file(candidate) or candidate.read_bytes() != data:
                raise ValueError(f'Reused artwork differs from original decoded bytes: {candidate}')
            reused[name] = candidate
    if not args.check:
        for name, data in outputs.items():
            path = output_target(args.output, name)
            if not regular_file(path):
                write_new(path, data, reused.get(name))
    print(json.dumps({'check': args.check, 'outputs': len(outputs), 'verifiedReusablePngs': len(reused), 'originalExecuted': False}))


if __name__ == '__main__':
    main()
