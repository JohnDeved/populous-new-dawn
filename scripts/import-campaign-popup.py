#!/usr/bin/env python3
"""Import only the thirteen original campaign-popup panel tiles and labels.

Usage: python3 scripts/import-campaign-popup.py GAME_ROOT LANGUAGE_ROOT [--output ROOT]
The original executable is hash-checked as data, never loaded or executed.
Existing result-font, HUD font4 and button images are reused without regeneration.
"""
import argparse
import importlib.util
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
spec = importlib.util.spec_from_file_location('result_import', ROOT/'scripts/import-result-ui.py')
result = importlib.util.module_from_spec(spec)
spec.loader.exec_module(result)


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('game_root', type=Path)
    parser.add_argument('language_root', type=Path)
    parser.add_argument('--output', type=Path, default=ROOT)
    args = parser.parse_args()
    inputs = {}
    for name in ['d3dpoptb.exe', 'data/pal0-c.dat', 'data/hfx0-0.dat', 'language/lang00.dat']:
        root = args.language_root if name.startswith('language/') else args.game_root
        data = (root/name).read_bytes()
        if result.sha(data) != result.EXPECTED[name]:
            raise ValueError(f'Unexpected original input: {name}')
        inputs[name] = data
    sprites, png, decoder_hashes = result.load_decoder(ROOT/'scripts/import-original.py')
    frames = sprites(inputs['data/hfx0-0.dat'], inputs['data/pal0-c.dat'], alpha=False)
    tiles = bytearray(16*13*16*4)
    rects = {}
    for index, frame in enumerate(frames[1450:1463]):
        if frame[:2] != (16, 16):
            raise ValueError('Unexpected native popup panel tile size')
        result.copy_frame(tiles, 208, frame, index*16, 0)
        rects[str(1450+index)] = {'x': index*16, 'y': 0, 'w': 16, 'h': 16,
                                  'rgbaSha256': result.sha(frame[2])}
    language = inputs['language/lang00.dat'].decode('utf-16le').split('\0')
    labels = {str(index): language[index] for index in [227, 278, 279, 323]}
    if list(labels.values()) != ['OK', 'Save', 'Exit', 'Delete']:
        raise ValueError('Unexpected original popup labels')
    target = args.output/'public/original/campaign-popup-tiles.png'
    target.parent.mkdir(parents=True, exist_ok=True)
    png(target, 208, 16, tiles)
    metadata = {
        'panelUrl': '/original/campaign-popup-tiles.png', 'rects': rects, 'labels': labels,
        'buttonUrls': {'normal': '/original/hud-button.png',
                       'hover': '/original/hud-button-selected.png',
                       'pressed': '/original/hud-button-hover.png'},
        'provenance': {'inputs': {name: result.sha(data) for name, data in inputs.items()},
                       'decoderFunctionsSha256': decoder_hashes,
                       'panelPngSha256': result.sha(target.read_bytes()),
                       'panelRgbaSha256': result.sha(tiles),
                       'panelRenderer': '00523d40', 'popupRenderer': '00525650',
                       'buttonRenderer': '004a2560', 'layout': '004afb00',
                       'wrapping': '004afee0 -> 0045ec10', 'configuration': '004af440',
                       'pixelPolicy': 'Unmodulated source palette RGB; literal pixels opaque and RLE skips transparent. No invented tint or shadow.',
                       'limits': ['Static source reconstruction, not a native GPU capture.',
                                  'Inherited GPU blend and vertex state remain unverified.',
                                  'Campaign OK and Delete follow message flags; mode1 Save/Exit is not emitted by the current campaign producers.']}}
    (args.output/'app/original-campaign-popup.json').write_text(json.dumps(metadata, indent=2)+'\n')
    print('Imported 13 campaign panel tiles; reused original bitmap fonts and button images.')


if __name__ == '__main__':
    main()
