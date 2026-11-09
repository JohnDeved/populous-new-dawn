#!/usr/bin/env python3
"""Import the bounded Western loading-label software-raster reconstruction.

Reads original EXE/font/language as data only. Does not execute original code,
run the broad importer, or infer an all-context native screen background.
"""
from __future__ import annotations
import argparse
import ast
import hashlib
import json
from pathlib import Path
import struct
import zlib

EXPECTED = {
    'd3dpoptb.exe': '3a5065c7420b3fcde208bf220bc86dfbac95e025ab2492caf9c7ea5308dfbe4f',
    'data/fenew/feft20we.spr': 'fc705fe271d131d7bec0023fc07ebf1f7fe91596e260b5d23e6004a380d4ea4b',
    'language/lang00.dat': 'e826c478746d666a3ea9ea36cb7804d1d226d5f83084230987b1de293066cf7d',
}

def sha(data):
    return hashlib.sha256(data).hexdigest()

def load_decoder(path):
    source = path.read_text()
    tree = ast.parse(source)
    definitions = [node for node in tree.body if isinstance(node, ast.FunctionDef)
                   and node.name in ('sprites', 'png')]
    if {node.name for node in definitions} != {'sprites', 'png'}:
        raise ValueError('Existing sprite/PNG definitions not found')
    namespace = {'struct': struct, 'zlib': zlib}
    exec(compile(ast.Module(body=definitions, type_ignores=[]), str(path), 'exec'), namespace)
    return namespace['sprites'], namespace['png'], {
        node.name: sha(ast.get_source_segment(source, node).encode()) for node in definitions}

def main():
    root = Path(__file__).resolve().parents[1]
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('game_root', type=Path)
    parser.add_argument('--output', type=Path, default=root / 'public/original')
    parser.add_argument('--decoder', type=Path, default=root / 'scripts/import-original.py')
    args = parser.parse_args()
    files = {}
    for path in args.game_root.rglob('*'):
        if path.is_file():
            name = path.relative_to(args.game_root).as_posix().lower()
            if name in files:
                raise ValueError(f'Ambiguous case-insensitive source: {name}')
            files[name] = path
    # Check all inputs before creating or changing any output.
    inputs = {}
    for name, expected in EXPECTED.items():
        data = files[name].read_bytes()
        if sha(data) != expected:
            raise ValueError(f'Source hash mismatch: {name}')
        inputs[name] = data
    sprites, png, decoder_hashes = load_decoder(args.decoder)
    text = inputs['language/lang00.dat'].decode('utf-16le').split('\0')[515]
    if text != 'Loading...':
        raise ValueError('Unexpected English loading label')
    # The native 16-bit solid-colour consumer uses literal runs only as a mask;
    # source palette values are deliberately ignored. Skips remain transparent.
    frames = sprites(inputs['data/fenew/feft20we.spr'], b'\xff' * 1024, alpha=False)
    if len(frames) != 224 or frames[65-32][:2] != (10, 19):
        raise ValueError('Unexpected Western font metrics')
    glyphs = [frames[ord(char)-32] for char in text]
    width = sum(glyph[0] for glyph in glyphs)
    height = max(glyph[1] for glyph in glyphs)
    if (width, height) != (81, 19):
        raise ValueError('Unexpected loading-label metrics')
    mask = bytearray(width * height)
    x = 0
    metrics = []
    for char, (w, h, pixels) in zip(text, glyphs):
        for y in range(h):
            for xx in range(w):
                mask[y * width + x + xx] = pixels[(y*w+xx)*4+3]
        metrics.append({'character': char, 'frame': ord(char)-32, 'width': w,
                        'height': h, 'advance': w})
        x += w
    out_width, out_height = width + 1, height + 1
    rgba = bytearray(out_width * out_height * 4)
    for offset, gray in [(0, 131), (1, 255)]:
        for y in range(height):
            for x in range(width):
                if mask[y*width+x]:
                    dest = ((y+offset)*out_width+x+offset)*4
                    rgba[dest:dest+4] = bytes((gray, gray, gray, 255))
    metadata = {
        'version': 1, 'text': text, 'languageId': 515,
        'font': {'slot': 1, 'source': 'data/fenew/feft20we.spr', 'glyphs': metrics,
                 'frameCount': 224, 'referenceGlyphA': {'width': 10, 'height': 19}},
        'file': 'loading-label.png', 'width': out_width, 'height': out_height,
        'measureWidth': width, 'measureHeight': height,
        'nativeLayout': {'maskWidth': 130, 'maskHeight': 161,
            'labelX': 'trunc((screenWidth-81)/2)',
            'maskX': 'trunc((screenWidth-130)/2)',
            'maskY': 'trunc((screenHeight-161)/2)',
            'labelYRelativeToMask': -26,
            'passes': [{'offsetX': 0, 'offsetY': 0, 'paletteIndex': 254, 'rgb': [131]*3},
                       {'offsetX': 1, 'offsetY': 1, 'paletteIndex': 255, 'rgb': [255]*3}]},
        'inputs': EXPECTED, 'decoderFunctionsSha256': decoder_hashes,
        'maskSha256': sha(mask), 'rgbaSha256': sha(rgba),
        'evidence': {'loading': '00522c00', 'fontSelection': '00522d20/005d5b38/004fd7c0',
            'fontMetrics': '00527a30/00516b80', 'palette': '004a32d0/004b1850/00415f70',
            'solidGlyphs': '00527a60/0052c300/005919f0+3c/00546190',
            'positiveRunMask': '00546359-005463ee'},
        'limits': [
            'Static original-byte/source-data reconstruction; no original execution or native screenshot.',
            'RGB values precede original 16-bit device packing; no exact hardware colour quantization is claimed.',
            'Scoped to the Western software-surface glyph path; alternate language engines and GPU text paths are not certified.',
            'Loading clears to current system-palette index 0; black is a browser adaptation unless the active palette is independently proved black.',
            'Normal placement only; original 512x384 compatibility offsets are not reproduced.',
            'Browser checkpoint boot/error/retry presentation and responsive layout are explicit compatibility adaptations.'
        ]}
    args.output.mkdir(parents=True, exist_ok=True)
    output = args.output / 'loading-label.png'
    png(output, out_width, out_height, rgba)
    metadata['outputSha256'] = sha(output.read_bytes())
    (args.output / 'loading-label.json').write_text(json.dumps(metadata, indent=2) + '\n')
    print(json.dumps({'output': str(output), 'width': out_width, 'height': out_height,
                      'sha256': metadata['outputSha256'], 'rgbaSha256': metadata['rgbaSha256']}))

if __name__ == '__main__':
    main()
