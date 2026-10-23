#!/usr/bin/env python3
"""Import only original campaign notification frame tiles and icon variants.

Usage: python3 scripts/import-message-tabs.py GAME_ROOT [--output ROOT] [--check]
Reads the hash-pinned executable as data; never executes it or regenerates other art.
"""
import argparse
import base64
import importlib.util
import json
from pathlib import Path
import struct

ROOT = Path(__file__).resolve().parents[1]
spec = importlib.util.spec_from_file_location('result_import', ROOT/'scripts/import-result-ui.py')
result = importlib.util.module_from_spec(spec)
spec.loader.exec_module(result)


class PngBuffer:
    def write_bytes(self, data):
        self.data = data


def build(game):
    inputs = {}
    for name in ['d3dpoptb.exe', 'data/pal0-c.dat', 'data/hfx0-0.dat']:
        data = (game/name).read_bytes()
        if result.sha(data) != result.EXPECTED[name]:
            raise ValueError(f'Unexpected original input: {name}')
        inputs[name] = data
    pe = result.StaticPE(inputs['d3dpoptb.exe'])
    # The decompiler omits the third/fourth call arguments. Bind all three tables.
    if pe.read(0x49faef, 20).hex() != '68d8ab5c0068c0ab5c0068a8ab5c006872416800':
        raise ValueError('Unexpected notification frame call arguments')
    descriptors = {}
    for state, address, start in [('normal', 0x5caba8, 1005),
                                  ('hover', 0x5cabd8, 996),
                                  ('active', 0x5cabc0, 1014)]:
        ids = list(struct.unpack('<9H', pe.read(address, 18)))
        if ids != [start+i for i in [0, 4, 1, 6, 8, 7, 2, 5, 3]]:
            raise ValueError('Unexpected original notification frame descriptor')
        descriptors[state] = ids
    icons = {}
    for kind, expected in [(1, 171), (3, 174)]:
        record = pe.read(0x59caf8+kind*28, 28)
        normal, active = struct.unpack_from('<HH', record, 17)
        if struct.unpack_from('<I', record, 13)[0] != 3 or (normal, active) != (expected, expected):
            raise ValueError('Unexpected original campaign icon variants')
        icons[str(kind)] = {'normal': normal, 'active': active}
    decode, png, decoder_hashes = result.load_decoder(ROOT/'scripts/import-original.py')
    bank = decode(inputs['data/hfx0-0.dat'], inputs['data/pal0-c.dat'], alpha=False)
    sprites = {}
    for sprite in [171, 174, *range(996, 1023)]:
        width, height, pixels = bank[sprite]
        if sprite >= 996 and (width, height) != (4, 4):
            raise ValueError('Unexpected notification frame tile dimensions')
        buffer = PngBuffer()
        png(buffer, width, height, pixels)
        sprites[str(sprite)] = {'width': width, 'height': height,
                                'rgbaSha256': result.sha(pixels),
                                'src': 'data:image/png;base64,'+base64.b64encode(buffer.data).decode()}
    return {'descriptors': descriptors, 'icons': icons, 'sprites': sprites,
            'provenance': {'inputs': {name: result.sha(data) for name, data in inputs.items()},
                           'decoderFunctionsSha256': decoder_hashes,
                           'renderer': '0049f9c0 -> 004a1dd0 -> 004a1f50',
                           'hoverOwner': '004314c0 flag4; 0049f9c0 control+0c',
                           'activeOwner': '0049f9c0 flag2 or held-pointer states2/3',
                           'pixelPolicy': 'Unmodulated source palette RGB; literal pixels opaque and RLE skips transparent.',
                           'limits': ['Static source reconstruction, not a native GPU capture.',
                                      'Keyboard focus uses the native hover frame as browser accessibility feedback.',
                                      'Only existing campaign types1/3; their normal/active icon pairs are identical.']}}


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('game_root', type=Path)
    parser.add_argument('--output', type=Path, default=ROOT)
    parser.add_argument('--check', action='store_true')
    args = parser.parse_args()
    data = json.dumps(build(args.game_root), indent=2)+'\n'
    target = args.output/'app/original-message-tabs.json'
    if args.check:
        if target.read_text() != data:
            raise ValueError('Imported notification art differs from original source')
        print('PASS: all 27 frame tiles, both icon pairs and descriptor provenance match original data.')
    else:
        target.parent.mkdir(parents=True, exist_ok=True)
        target.write_text(data)
        print('Imported only notification frame tiles and type1/type3 icon pairs.')


if __name__ == '__main__':
    main()
