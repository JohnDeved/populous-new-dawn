#!/usr/bin/env python3
"""Bounded, hash-pinned Query/Encyclopaedia data import; never runs original code.

Usage: python3 scripts/import-help-ui.py GAME_ROOT [--input-root SUPPLEMENT]...
       [--output PROJECT_ROOT] [--check]
Only missing owned outputs are created. Differing files require a fresh --output
for review. Existing F00T3/F00T4 and campaign-popup frame artwork are reused, never
regenerated. --check compares all bytes without writing anything.
"""
import sys
sys.dont_write_bytecode = True

import argparse
import importlib.util
import json
from pathlib import Path
import struct
import stat

ROOT = Path(__file__).resolve().parents[1]
spec = importlib.util.spec_from_file_location('result_ui', ROOT / 'scripts/import-result-ui.py')
original = importlib.util.module_from_spec(spec)
spec.loader.exec_module(original)
EXPECTED = {
    'd3dpoptb.exe': '3a5065c7420b3fcde208bf220bc86dfbac95e025ab2492caf9c7ea5308dfbe4f',
    'data/pal0-c.dat': '6c61cd586fc96ef5f777c71966a9ac1875491a4a521342ba06d108df5e92bf53',
    'data/hfx0-0.dat': '681eb1734fd73f86a6a52a8540415ec69a241a378161b60e9c9da1263d4ee0bf',
    'data/point0-0.dat': '591d79efacb2d2cbb220d9edef5ffd028518704e97f31bf86a78b4e258dd466b',
    'data/f00t3-0.dat': '148658bb22b8a42f892719d0f0b814ccb9cfcb260f8e6f1ea60475bec90b9af0',
    'data/f00t4-0.dat': '2cbebbf772ffa2fceca7ec5e37a08c1c6fe190653bbc3d85ebe126443d4494d0',
    'data/f00t10-0.dat': '856e71a54ea9cfe369c492a3530a9180e957d9f3392119f5e6a35e2e5293312d',
    'data/f00t11-0.dat': 'ff7824cfc8357f3b144dd1a7e28e64afaa32fdce468f52d33008f8e8700afaa3',
    'language/lang00.dat': 'e826c478746d666a3ea9ea36cb7804d1d226d5f83084230987b1de293066cf7d',
}


def build(inputs):
    sprites, png, fingerprints = original.load_decoder(ROOT / 'scripts/import-original.py')
    pe = original.StaticPE(inputs['d3dpoptb.exe'])
    palette = inputs['data/pal0-c.dat']
    language = inputs['language/lang00.dat'].decode('utf-16le').split('\0')
    outputs = {}

    class Output:
        def __init__(self, path):
            self.path = path

        def write_bytes(self, data):
            outputs[self.path] = data

    def image(name, width, height, pixels):
        path = f'public/original/help/{name}.png'
        png(Output(path), width, height, pixels)
        return {'url': f'/original/help/{name}.png', 'width': width, 'height': height,
                'sha256': original.sha(outputs[path])}

    hfx = sprites(inputs['data/hfx0-0.dat'], palette)
    ids = [105, 106, 439, 440, 441, 442, *range(447, 456), *range(996, 1023)]
    icons = {str(i): image(f'hfx-{i}', *hfx[i]) for i in ids}
    point = sprites(inputs['data/point0-0.dat'], palette)[13]
    if point[:2] != (31, 19):
        raise ValueError('Unexpected POINT13 metrics')
    cursor = {**image('point-13', *point), 'hotspot': [0, 0]}
    fonts = {}
    for bank in (10, 11):
        glyphs = sprites(inputs[f'data/f00t{bank}-0.dat'], palette)
        if len(glyphs) != 224:
            raise ValueError(f'Unexpected F00T{bank} glyph count')
        cell_width = max(g[0] for g in glyphs)
        cell_height = max(g[1] for g in glyphs)
        width, height = 16 * cell_width, 14 * cell_height
        pixels = bytearray(width * height * 4)
        rects = []
        for index, (w, h, rgba) in enumerate(glyphs):
            x, y = index % 16 * cell_width, index // 16 * cell_height
            original.copy_frame(pixels, width, (w, h, rgba), x, y)
            rects.append({'x': x, 'y': y, 'w': w, 'h': h, 'advance': w})
        fonts[str(bank)] = {**image(f'font-{bank}', width, height, pixels), 'rects': rects}
    topics = {}
    for topic in range(983, 1071):
        kind = pe.read(0x59a195 + topic * 13, 1)[0]
        args = list(struct.unpack('<3I', pe.read(0x59a196 + topic * 13, 12)))
        predicate, argument = struct.unpack('<II', pe.read(0x59be28 + (topic - 983) * 8, 8))
        topics[str(topic)] = {'text': language[topic], 'illustration': {'kind': kind, 'args': args},
                              'discovery': {'predicate': f'{predicate:08x}', 'argument': argument}}
    if topics['1051']['illustration'] != {'kind': 255, 'args': [0, 0, 0]}:
        raise ValueError('Query topic must have no illustration')
    descriptor = pe.read(0x5cb386, 66)
    if struct.unpack_from('<h', descriptor, 63)[0] != 1051:
        raise ValueError('Unexpected Query control topic')
    if {t['discovery']['predicate'] for t in topics.values()} != {'00000000', '004250f0', '00425110'}:
        raise ValueError('Unexpected discovery predicates')
    manifest = {'version': 1, 'cursor': cursor, 'icons': icons, 'fonts': fonts, 'topics': topics,
                'queryTooltip': language[965],
                'provenance': {'inputs': EXPECTED, 'decoders': fingerprints,
                               'originalExecuted': False,
                               'queryDescriptorAddress': '005cb386', 'queryDescriptorHex': descriptor.hex(),
                               'reused': ['/original/hud.png', '/original/result-font.png',
                                          '/original/campaign-popup-tiles.png'],
                               'boundary': 'Source-palette Western sprite reconstruction; not an original GPU capture.'}}
    spans = [
        ('query-control', 0x49d150, 0x49d293),
        ('query-cursor', 0x47a8b0, 0x47a924),
        ('help-panel-lifecycle', 0x45db50, 0x45dca9),
        ('topic-selection', 0x45ed10, 0x45ef70),
        ('panel-render', 0x45d8c0, 0x45db41),
        ('article-layout-scroll', 0x45dcb0, 0x45ddf0),
        ('illustration-dispatch', 0x45ddf0, 0x45e1e0),
        ('navigation-art', 0x45e1e0, 0x45e400),
        ('scroll-art', 0x45e400, 0x45e730),
        ('panel-layout', 0x45e730, 0x45e9f4),
        ('panel-interaction', 0x45ea00, 0x45ec08),
        ('query-cancel-command', 0x4aba98, 0x4abb5b),
        ('query-key-predicate', 0x4ff0e0, 0x4ff0ee),
        ('menu-key-predicate', 0x4fee70, 0x4fee82),
        ('hud-control-copy', 0x44caa0, 0x44cc08),
        ('hud-query-dispatch', 0x44b130, 0x44b75a),
        ('history', 0x425140, 0x425200),
        ('markup-layout', 0x425400, 0x425d38),
        ('text-render', 0x426340, 0x426ae0),
        ('link-activation', 0x426ae0, 0x426c20),
        ('discovery-predicates', 0x4250f0, 0x425130),
        ('title-font-resolution', 0x42bde0, 0x42be6b),
        ('frame-render', 0x523d40, 0x523f95),
        ('query-frame-render', 0x4a1dd0, 0x4a1e95),
    ]
    def addressed(address, size):
        raw = pe.read(address, size)
        return {'address': f'{address:08x}', 'length': size, 'sha256': original.sha(raw), 'hex': raw.hex()}
    evidence = {'exeSha256': EXPECTED['d3dpoptb.exe'], 'originalExecuted': False,
                'code': [{'name': name, **addressed(start, end - start)} for name, start, end in spans],
                'tables': {
                    'queryDescriptor': addressed(0x5cb386, 66),
                    'queryNormalFrame': addressed(0x5caba8, 18),
                    'queryHeldFrame': addressed(0x5cabc0, 18),
                    'queryHoverFrame': addressed(0x5cabd8, 18),
                    'personTopics': addressed(0x59d7f4, 36),
                    'buildingTopics': addressed(0x59d814, 76),
                    'linkPredicates': addressed(0x59be28, 88 * 8),
                    'illustrations': addressed(0x59d380, 88 * 13),
                    'inlineImages': addressed(0x59bdc0, 21 * 4),
                    'menuBinding': addressed(0x5d60c4, 12),
                    'queryEscapeBinding': addressed(0x5d5ecc, 12),
                },
                'hudArrays': [addressed(address, count * 66) for address, count in [
                    (0x5caea0, 25), (0x5cb558, 10), (0x5cb830, 17), (0x5cbcd8, 18),
                    (0x5cc1c0, 9), (0x5cc458, 9), (0x5cc6f0, 36)]],
                'boundary': 'Exact raw addressed bytes; disassemblers must not interpret inline jump-table bytes as instructions.'}
    outputs['decomp/research/native-help/source.json'] = (json.dumps(evidence, indent=2) + '\n').encode()
    outputs['app/original-help.json'] = (json.dumps(manifest, ensure_ascii=False, indent=2) + '\n').encode()
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


def write_new(path, data):
    path.parent.mkdir(parents=True, exist_ok=True)
    with path.open('xb') as stream:
        stream.write(data)


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('game_root', type=Path)
    parser.add_argument('--input-root', type=Path, action='append', default=[])
    parser.add_argument('--output', type=Path, default=ROOT)
    parser.add_argument('--check', action='store_true')
    args = parser.parse_args()
    roots = [args.game_root, *args.input_root]
    inputs = {}
    for name, expected in EXPECTED.items():
        path = next((root / name for root in roots if (root / name).is_file()), None)
        if path is None:
            raise FileNotFoundError(f'Missing verified input: {name}')
        data = path.read_bytes()
        if original.sha(data) != expected:
            raise ValueError(f'Input hash mismatch: {path}')
        inputs[name] = data
    outputs = build(inputs)
    # Validate every existing output before writing any missing output.
    for name, expected in outputs.items():
        path = output_target(args.output, name)
        if regular_file(path) and path.read_bytes() != expected:
            raise ValueError(f'Differing owned output; use a fresh --output for review: {path}')
        if args.check and not regular_file(path):
            raise FileNotFoundError(f'Missing owned output: {path}')
    if not args.check:
        for name, data in outputs.items():
            path = output_target(args.output, name)
            if not regular_file(path):
                write_new(path, data)
    print(json.dumps({'check': args.check, 'outputs': len(outputs), 'originalExecuted': False}))


if __name__ == '__main__':
    main()
