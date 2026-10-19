"""Prepare one original POINT frame from verified data; never execute the game.
Usage: python3 scripts/import-neutral-cursor.py GAME_ROOT OUTPUT_DIRECTORY
Outputs only cursor-point14.png and cursor-point14.json in OUTPUT_DIRECTORY.
This deliberately imports only reviewed decoder functions, never importer entrypoints.
"""
import ast
import hashlib
import json
from pathlib import Path
import struct
import sys
import zlib

EXPECTED = {
    'data/point0-0.dat': '591d79efacb2d2cbb220d9edef5ffd028518704e97f31bf86a78b4e258dd466b',
    'data/pal0-c.dat': '6c61cd586fc96ef5f777c71966a9ac1875491a4a521342ba06d108df5e92bf53',
}

def main():
    source, output = map(Path, sys.argv[1:])
    repo = Path(__file__).resolve().parents[1]
    data = {}
    for name, expected in EXPECTED.items():
        data[name] = (source / name).read_bytes()
        if hashlib.sha256(data[name]).hexdigest() != expected:
            raise ValueError(f'Input SHA-256 mismatch: {name}')
    if len(data['data/pal0-c.dat']) != 1024:
        raise ValueError('Unexpected palette size')
    decoder = repo / 'scripts/import-original.py'
    syntax = ast.parse(decoder.read_text())
    functions = [node for node in syntax.body
                 if isinstance(node, ast.FunctionDef) and node.name in ('sprites', 'png')]
    if {node.name for node in functions} != {'sprites', 'png'}:
        raise ValueError('Reviewed decoder functions absent')
    namespace = {'struct': struct, 'zlib': zlib}
    exec(compile(ast.Module(body=functions, type_ignores=[]), str(decoder), 'exec'), namespace)
    bank = namespace['sprites'](data['data/point0-0.dat'], data['data/pal0-c.dat'], alpha=False)
    width, height, pixels = bank[14]
    if not (0 < width <= 128 and 0 < height <= 128):
        raise ValueError('Unexpected browser cursor dimensions')
    output.mkdir(parents=True, exist_ok=True)
    target = output / 'cursor-point14.png'
    manifest = output / 'cursor-point14.json'
    if target.exists() or manifest.exists():
        raise FileExistsError('Refusing to overwrite existing outputs')
    namespace['png'](target, width, height, pixels)
    manifest.write_text(json.dumps({
        'sourceHashes': EXPECTED, 'frame': 14, 'width': width, 'height': height,
        'hotspot': [0, 0], 'pngSha256': hashlib.sha256(target.read_bytes()).hexdigest(),
        'decoderSha256': hashlib.sha256(decoder.read_bytes()).hexdigest(),
        'importerSha256': hashlib.sha256(Path(__file__).read_bytes()).hexdigest(),
        'scope': 'POINT14 source-palette reconstruction; no unconditional gameplay or HUD mapping claim',
    }, indent=2) + '\n')

if __name__ == '__main__':
    main()
