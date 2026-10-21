#!/usr/bin/env python3
"""Recover the inactive 25-world selector data contract, without producing art.

Read the original executable as data only. Validate every source before writing
one JSON file; --check is read-only. No runtime selector or profile changes.
"""
import argparse
import hashlib
import importlib.util
import json
from pathlib import Path
import struct

ROOT = Path(__file__).resolve().parents[1]
SOURCES = ROOT / 'decomp/research/world-selector-manifest/sources.json'
OUTPUT = ROOT / 'app/original-world-selector.json'


def load_module(name, filename):
    spec = importlib.util.spec_from_file_location(name, ROOT / 'scripts' / filename)
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


def sha(data):
    return hashlib.sha256(data).hexdigest()


def read_inputs(game_root, executable, language_root):
    """Fail closed on missing/different bytes, before output creation."""
    inputs = {}
    for name, expected in json.loads(SOURCES.read_text())['inputs'].items():
        path = (executable if name == 'd3dpoptb.exe' else
                (language_root if name.startswith('language/') else game_root) / name)
        data = path.read_bytes()
        if sha(data) != expected:
            raise ValueError(f'Source hash mismatch: {name}')
        inputs[name] = data
    return inputs


def title_ids(pe):
    """Follow 004c3c40's first 25 switch cases, not a guessed title sequence."""
    result = []
    for mission in range(1, 26):
        dispatch = pe.read(0x4c3fb4 + mission - 1, 1)[0]
        address = pe.u32(0x4c3f00 + dispatch * 4)
        case = pe.read(address, 15)
        if (case[0] != 0xbe or case[5] != 0xba or case[10] != 0xe9 or
                struct.unpack_from('<I', case, 1)[0] != mission or
                address + 15 + struct.unpack_from('<i', case, 11)[0] != 0x4c3e75):
            raise ValueError(f'Unexpected native title dispatch: {mission}')
        result.append(struct.unpack_from('<I', case, 6)[0])
    if pe.read(0x5d4784, 20) != ('%02d : %s\0').encode('utf-16le'):
        raise ValueError('Unexpected native title format')
    return result


def frame_metrics(frame):
    width, height, pixels = frame
    return {'width': width, 'height': height, 'rgbaSha256': sha(pixels)}


def build_manifest(game_root, executable, language_root):
    inputs = read_inputs(game_root, executable, language_root)
    pe = load_module('selector_pe', 'check-static-mission18-sky.py').PE32(executable)
    text = load_module('selector_text', 'import-world-selector-text.py')
    sprites, _, decoder_hashes = text.load_decoder(ROOT / 'scripts/import-original.py')
    layout = load_module('selector_layout', 'check-static-world-selector.py').decode_layout(
        inputs['data/plsdata.dat'])
    if (len(layout) != 25 or sorted(world['mission'] for world in layout) != list(range(1, 26)) or
            [world['index'] for world in layout] != list(range(25))):
        raise ValueError('Expected all 25 authored selector bodies')
    by_mission = {world['mission']: world for world in layout}
    rows = [struct.unpack('<7i', pe.read(0x59dff8 + index * 28, 28)) for index in range(25)]
    if pe.u32(0x59dff8 + 25 * 28) != 0x80000000:
        raise ValueError('Missing native panel-table sentinel')
    language = inputs['language/lang00.dat'].decode('utf-16le').split('\0')
    names = title_ids(pe)
    banks, records = {}, []
    tooltip_frames = None
    panel_frames = None
    for mission in range(1, 26):
        header_path = f'levels/levl2{mission:03d}.hdr'
        header = inputs[header_path]
        if len(header) != 616 or header[96] > 35:
            raise ValueError(f'Unexpected mission header: {mission}')
        suffix = '0123456789abcdefghijklmnopqrstuvwxyz'[header[96]]
        palette_path = f'data/plspl0-{suffix}.dat'
        palette = inputs[palette_path]
        if len(palette) != 1024:
            raise ValueError(f'Unexpected palette: {suffix}')
        banks[suffix] = {'index': header[96], 'source': palette_path}
        title_frames = sprites(inputs['data/fenew/felo20we.spr'], palette, alpha=False)
        if len(title_frames) != 224:
            raise ValueError('Expected 224 Western title glyphs')
        # Dimensions are palette-independent. Pixels retain their source palette.
        if panel_frames is None:
            panel_frames = sprites(inputs['data/plspanel.spr'], palette, alpha=False)
            tooltip_frames = sprites(inputs['data/fenew/fettwe.spr'], palette, alpha=False)
            if len(panel_frames) != 29 or len(tooltip_frames) != 224:
                raise ValueError('Unexpected panel or tooltip sprite count')
        kind, x, y, *state = rows[mission - 1]
        if kind not in (0, 1, 2) or any(state):
            raise ValueError(f'Unexpected initial panel row: {mission}')
        available_frame = {0: 5, 1: 3, 2: 1}[kind]
        width, height, _ = panel_frames[available_frame]
        if panel_frames[available_frame + 1][:2] != (width, height):
            raise ValueError('Completed glyph changed hit dimensions')
        # 0047e4a3: add panelOrigin - 1, then subtract one more for kind 2.
        local_x, local_y = x - 1 - (kind == 2), y - 1 - (kind == 2)
        title = f'{mission:02d} : {language[names[mission - 1]]}'
        records.append({
            'mission': mission, 'body': by_mission[mission],
            'header': header_path, 'palette': suffix,
            'panel': {'kind': kind, 'sourceXY': [x, y], 'localXY': [local_x, local_y],
                      'nativeXY': [local_x + 1, local_y + 419],
                      'availableFrame': available_frame, 'completedFrame': available_frame + 1,
                      'width': width, 'height': height},
            'title': {'languageId': names[mission - 1], 'text': title,
                      **frame_metrics(text.compose(title_frames, title))},
        })
    return {
        'version': 1,
        'sourceManifestSha256': sha(SOURCES.read_bytes()),
        'decoderFunctionsSha256': decoder_hashes,
        'nativeViewport': [640, 480],
        'panel': {'source': 'data/plspanel.spr', 'frame': 0, 'width': panel_frames[0][0],
                  'height': panel_frames[0][1], 'nativeOrigin': [1, 419],
                  'profileSelectableMask': 5, 'drawCompletedRegardlessOfAvailability': True,
                  'hitEdges': 'exclusive-left-top-inclusive-right-bottom',
                  'pressedOffset': [1, 1], 'pressedDuration': 'one draw',
                  'launch': {'nativeXY': [577, 430], 'highlightFrame': 10,
                             'hitDimensionsFrame': 11, 'width': 37, 'height': 37}},
        'title': {'fontSource': 'data/fenew/felo20we.spr', 'fontSlot': 3,
                  'format': '%02d : %s', 'nativeY': 400, 'alignment': 'screen-center'},
        'tooltip': {'fontSource': 'data/fenew/fettwe.spr', 'fontSlot': 11,
                    'delayMs': 500, 'delayComparison': 'strictly-greater',
                    'languageIds': {'launch': 978, 'available': 979, 'completed': 980},
                    'strings': {str(key): {'text': language[key],
                                'width': text.compose(tooltip_frames, language[key])[0],
                                'height': text.compose(tooltip_frames, language[key])[1]}
                                for key in (978, 979, 980)}},
        'cursor': {'source': 'data/plspanel.spr', 'frame': 12, 'hotspot': [0, 0],
                   'width': panel_frames[12][0], 'height': panel_frames[12][1],
                   'paletteBinding': 'unresolved; source-palette reconstruction only'},
        'paletteBanks': dict(sorted(banks.items())),
        'worlds': records,
        'limits': [
            'Inactive source-data prerequisite; does not unlock, select or launch missions.',
            'No profile migration, campaign activation, new PNGs or existing art replacement.',
            'Header palettes and source RGBA are not original device-rendered RGB parity.',
            'Western title/tooltip glyphs only; braces in tooltip strings denote mouse glyphs.',
            'Native hit geometry is evidence, not an approved browser accessibility layout.',
            'Mission 25 is the sun body; no ordinary mission-25 globe texture is implied.',
        ],
    }


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('game_root', type=Path)
    parser.add_argument('--executable', type=Path)
    parser.add_argument('--language-root', type=Path)
    parser.add_argument('--output', type=Path, default=OUTPUT)
    parser.add_argument('--check', action='store_true')
    args = parser.parse_args()
    result = build_manifest(args.game_root, args.executable or args.game_root / 'd3dpoptb.exe',
                            args.language_root or args.game_root)
    serialized = json.dumps(result, indent=2) + '\n'
    if args.check:
        if args.output.read_text() != serialized:
            raise ValueError('Checked-in selector manifest differs from verified original data')
        print('Verified all 25 selector records; no files written.')
    else:
        # Never replace a different existing result accidentally.
        if args.output.exists() and args.output.read_text() != serialized:
            raise ValueError('Output differs; choose a new --output path for review')
        args.output.parent.mkdir(parents=True, exist_ok=True)
        args.output.write_text(serialized)
        print('Imported all 25 selector records; no runtime activation or artwork writes.')


if __name__ == '__main__':
    main()
