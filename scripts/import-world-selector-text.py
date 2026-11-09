#!/usr/bin/env python3
"""Import bounded Western selector fonts, titles, tooltips and cursor as static data.

Usage: python3 scripts/import-world-selector-text.py GAME_ROOT [--output DIR]
Uses only existing import-original.py sprites/png functions; never executes game code.
All source inputs are hash-pinned. Outputs are source-palette RGBA reconstructions,
not native GPU captures. Mission palette switching is a browser adaptation.
"""
import argparse
import ast
import hashlib
import json
from pathlib import Path
import struct
import zlib

ROOT = Path(__file__).resolve().parents[1]
EXPECTED = {
  "d3dpoptb.exe": "3a5065c7420b3fcde208bf220bc86dfbac95e025ab2492caf9c7ea5308dfbe4f",
  "data/fenew/felo20we.spr": "9179950e0b53e1d27a6864ef5848af5fff95883c531b328ae3ba2889111f11ee",
  "data/fenew/fettwe.spr": "8d76fc1ef0abf454449e77ddaf6aab8b386072d6f037b1f1463a391f110656ad",
  "data/plspanel.spr": "9b3e17fd501c65c7357cb64c0c8f27ec43304da8726afa6044b642e65e50a778",
  "language/lang00.dat": "e826c478746d666a3ea9ea36cb7804d1d226d5f83084230987b1de293066cf7d",
  "levels/levl2001.hdr": "4b89ef6d64e4010bb3ec3b5985d0edc8e710504e8b1bc75a6ae688bd6eb070a6",
  "levels/levl2002.hdr": "44be9f709f03f4b4d936d86056256e7bb98683088332b4bb47354ad709ea8a49",
  "levels/levl2003.hdr": "219dd7611a4e3f6c2d4e78620a4d5bb9cf61bf0e9c66c21b2b43b89c8ba4d3f0",
  "data/plspl0-c.dat": "9e6dc9767ea11135c001c69acc090cfdaa7b55131725bc0bce204015050c39c2",
  "data/plspl0-s.dat": "a74fd9c5e6b630e9de3ffa7f93ce1cca2785dfd0de5499923ae18d51ebc8b2e4",
  "data/plspl0-p.dat": "916b8eef2b9c9a9af6607ad29501364d5a280681ba52229bfff32c8a2fe2c736"
}


def sha(data):
    return hashlib.sha256(data).hexdigest()


def load_decoder(path):
    source = path.read_text()
    tree = ast.parse(source)
    definitions = [node for node in tree.body
                   if isinstance(node, ast.FunctionDef) and node.name in ('sprites', 'png')]
    if {node.name for node in definitions} != {'sprites', 'png'}:
        raise ValueError('Existing sprite/PNG decoder definitions not found')
    # Execute only these existing definitions, never the broad asset importer main.
    namespace = {'struct': struct, 'zlib': zlib}
    exec(compile(ast.Module(body=definitions, type_ignores=[]), str(path), 'exec'), namespace)
    fingerprints = {node.name: sha(ast.get_source_segment(source, node).encode())
                    for node in definitions}
    return namespace['sprites'], namespace['png'], fingerprints


def compose(frames, text):
    if any(not 32 <= ord(character) <= 255 for character in text):
        raise ValueError('Only source-bound Western glyph indices are supported')
    glyphs = [frames[ord(character) - 32] for character in text]
    width = sum(glyph[0] for glyph in glyphs)
    height = max(glyph[1] for glyph in glyphs)
    rgba = bytearray(width * height * 4)
    x = 0
    for w, h, pixels in glyphs:
        for y in range(h):
            rgba[(y * width + x) * 4:(y * width + x + w) * 4] = pixels[y*w*4:(y+1)*w*4]
        x += w
    return width, height, rgba


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('game_root', type=Path)
    parser.add_argument('--output', type=Path, default=ROOT / 'public/original/world-selector/text')
    parser.add_argument('--decoder', type=Path, default=ROOT / 'scripts/import-original.py')
    args = parser.parse_args()
    files = {}
    for path in sorted(args.game_root.rglob('*')):
        if path.is_file():
            name = str(path.relative_to(args.game_root)).lower()
            if name in files:
                raise ValueError(f'Ambiguous case-insensitive source: {name}')
            files[name] = path
    inputs = {}
    # Validate every pinned input before creating any output.
    for name, expected in EXPECTED.items():
        data = files[name].read_bytes()
        if sha(data) != expected:
            raise ValueError(f'Source hash mismatch: {name}')
        inputs[name] = data
    sprites, png, decoder_hashes = load_decoder(args.decoder)
    language = inputs['language/lang00.dat'].decode('utf-16le').split('\0')
    args.output.mkdir(parents=True, exist_ok=True)
    provenance = {
        'version': 1,
        'inputs': EXPECTED,
        'decoderFunctionsSha256': decoder_hashes,
        'consumers': {
            'title': '0047e8ad/004c3c40/0047e993: slot3, %02d : %s, centered at y400',
            'tooltip': '0047ea90: slot11, IDs978/979/980; braces are mouse-icon glyphs',
            'fontPalette': '004296f0 -> 00476a30 -> [0087cbcc]; 00428e70 -> 00476570',
            'cursor': '0047e56f -> 004fca00 frame12; 004fd370/004fd590 hotspot(0,0)',
        },
        'pixelPolicy': 'Source palette RGB; literal RLE pixels alpha255; skipped pixels transparent; no added shadow, kerning or tracking',
        'limits': [
            'Static source-data reconstruction, not an original-game or browser screenshot.',
            'Native device quantization/filter/alpha behavior is not captured.',
            'Mission palettes c/s/p are source header bindings; runtime switching with browser selection is an explicit adaptation.',
            'Cursor palette backend is not yet positively bound; cursor RGB is a source-palette reconstruction, not live RGB parity.',
            'Western bitmap font only; alternate language engines and progression are outside scope.',
            'Accessible browser labels must remain separate from native glyph artwork and raw tooltip strings.'
        ],
        'fonts': {}, 'banks': {}
    }

    def emit(filename, frame):
        w, h, pixels = frame
        png(args.output / filename, w, h, pixels)
        return {'file': filename, 'width': w, 'height': h,
                'rgbaSha256': sha(pixels), 'outputSha256': sha((args.output / filename).read_bytes())}

    for mission, title_id, suffix in [(1, 610, 'c'), (2, 640, 's'), (3, 647, 'p')]:
        header = inputs[f'levels/levl2{mission:03d}.hdr']
        if len(header) != 616 or header[96] != int(suffix, 36):
            raise ValueError(f'Unexpected mission palette: {mission}')
        palette = inputs[f'data/plspl0-{suffix}.dat']
        if len(palette) != 1024:
            raise ValueError('Expected 256 four-byte palette entries')
        font_frames = {}
        atlases = {}
        for kind, path, slot in [('title', 'data/fenew/felo20we.spr', 3),
                                 ('tooltip', 'data/fenew/fettwe.spr', 11)]:
            frames = sprites(inputs[path], palette, alpha=False)
            if len(frames) != 224:
                raise ValueError(f'Unexpected glyph count: {path}')
            font_frames[kind] = frames
            cell_w = max(frame[0] for frame in frames)
            cell_h = max(frame[1] for frame in frames)
            width, height = cell_w * 16, cell_h * 14
            rgba = bytearray(width * height * 4)
            metrics = []
            for index, (w, h, pixels) in enumerate(frames):
                x, y = (index % 16) * cell_w, (index // 16) * cell_h
                for row in range(h):
                    start = ((y + row) * width + x) * 4
                    rgba[start:start+w*4] = pixels[row*w*4:(row+1)*w*4]
                metrics.append({'code': index + 32, 'frame': index, 'x': x, 'y': y,
                                'width': w, 'height': h, 'advance': w})
            definition = {'slot': slot, 'source': path, 'frameCount': len(frames),
                          'columns': 16, 'cellWidth': cell_w, 'cellHeight': cell_h,
                          'glyphs': metrics}
            if kind in provenance['fonts'] and provenance['fonts'][kind] != definition:
                raise ValueError('Palette changed glyph metrics')
            provenance['fonts'][kind] = definition
            atlases[kind] = emit(f'{kind}-font-{suffix}.png', (width, height, rgba))
        title = f'{mission:02d} : {language[title_id]}'
        title_frame = compose(font_frames['title'], title)
        if title_frame[:2] != ((200, 19), (139, 19), (170, 19))[mission-1]:
            raise ValueError('Title metrics differ from source-bound expectation')
        title_record = emit(f'title-{mission}.png', title_frame)
        title_record.update(text=title, languageId=title_id, nativeY=400)
        tooltips = {}
        for text_id, width in [(978, 109), (979, 167), (980, 218)]:
            text = language[text_id]
            frame = compose(font_frames['tooltip'], text)
            if frame[:2] != (width, 10):
                raise ValueError('Tooltip metrics differ from source-bound expectation')
            tooltips[str(text_id)] = dict(emit(f'tooltip-{mission}-{text_id}.png', frame), text=text)
        cursor = sprites(inputs['data/plspanel.spr'], palette, alpha=False)[12]
        if cursor[:2] != (26, 27):
            raise ValueError('Unexpected cursor dimensions')
        cursor_record = dict(emit(f'cursor-{mission}.png', cursor), frame=12, hotspot=[0, 0])
        provenance['banks'][str(mission)] = dict(palette=suffix, atlases=atlases,
                                               title=title_record, tooltips=tooltips, cursor=cursor_record)
    # Compact runtime descriptors: keep archival glyph metrics/hashes in provenance.
    def runtime_record(record):
        return {key: value for key, value in record.items()
                if key in ('file', 'width', 'height', 'text', 'hotspot', 'nativeY')}

    runtime = {'version': 1, 'baseUrl': '/original/world-selector/text/', 'banks': {}}
    for mission, bank in provenance['banks'].items():
        runtime['banks'][mission] = {
            'palette': bank['palette'], 'title': runtime_record(bank['title']),
            'tooltips': {key: runtime_record(value) for key, value in bank['tooltips'].items()},
            'cursor': runtime_record(bank['cursor'])}
    (args.output / 'runtime.json').write_text(json.dumps(runtime, indent=2) + '\n')
    (args.output / 'provenance.json').write_text(json.dumps(provenance, indent=2) + '\n')
    print('Imported 2 complete fonts and title/tooltip/cursor source-art for missions 1–3.')


if __name__ == '__main__':
    main()
