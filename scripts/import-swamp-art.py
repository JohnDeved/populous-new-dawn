"""Import only the original Swamp presentation; never rewrite shared atlases.
Usage: python scripts/import-swamp-art.py GAME_ROOT [--check]
"""
import argparse
import hashlib
import importlib.util
import json
from pathlib import Path
import struct
import tempfile

ROOT = Path(__file__).resolve().parents[1]
HASHES = {
    'd3dpoptb.exe': '3a5065c7420b3fcde208bf220bc86dfbac95e025ab2492caf9c7ea5308dfbe4f',
    'data/hfx0-0.dat': '681eb1734fd73f86a6a52a8540415ec69a241a378161b60e9c9da1263d4ee0bf',
    'data/pal0-c.dat': '6c61cd586fc96ef5f777c71966a9ac1875491a4a521342ba06d108df5e92bf53',
    'data/al0-c.dat': 'afc46e78b56f901f1331ceb0b02052eeaba2b6446b8747a03d0f12639ae17310',
}


def generate(source, output):
    inputs = {name: (source / name).read_bytes() for name in HASHES}
    for name, data in inputs.items():
        if hashlib.sha256(data).hexdigest() != HASHES[name]:
            raise ValueError('Original input identity differs: ' + name)
    spec = importlib.util.spec_from_file_location('original', ROOT / 'scripts/import-original.py')
    original = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(original)
    exe = inputs['d3dpoptb.exe']
    pe = struct.unpack_from('<I', exe, 60)[0]
    sections = pe + 24 + struct.unpack_from('<H', exe, pe + 20)[0]

    def read(address, size):
        rva = address - 0x400000
        for index in range(struct.unpack_from('<H', exe, pe + 6)[0]):
            _, _, start, length, offset = struct.unpack_from('<8sIIII', exe, sections + index * 40)
            if start <= rva and rva + size <= start + length:
                return exe[offset + rva - start:offset + rva - start + size]
        raise ValueError('Address is not backed by file bytes')

    # 00511340 writes object descriptor 52; 0046ec80 dispatches its type 19.
    descriptor = read(0x5a6af8 + 52 * 11, 11)
    assert descriptor[0] == 19
    offsets = [list(struct.unpack('<10h', read(0x59d980 + variant * 20, 20)))
               for variant in range(4)]
    offsets = [[row[i:i + 2] for i in range(0, 10, 2)] for row in offsets]
    palette, alpha = inputs['data/pal0-c.dat'], inputs['data/al0-c.dat']
    fx_palette = b''.join(palette[alpha[(v | 15) * 256] * 4:alpha[(v | 15) * 256] * 4 + 3]
                          + bytes([(v & 15) * 17]) for v in range(256))
    banks = [original.sprites(inputs['data/hfx0-0.dat'], fx_palette, alpha=True),
             original.sprites(inputs['data/hfx0-0.dat'], palette)]
    frames, decoded = [], []
    for bank, ids in zip(banks, [range(1574, 1584), range(537, 549)]):
        for source_id in ids:
            w, h, rgba = bank[source_id]
            frames.append(dict(source=source_id, x=0, y=sum(f['h'] for f in frames), w=w, h=h))
            decoded.append(rgba)
    width, height = max(f['w'] for f in frames), sum(f['h'] for f in frames)
    pixels = bytearray(width * height * 4)
    for frame, rgba in zip(frames, decoded):
        for y in range(frame['h']):
            start = ((frame['y'] + y) * width) * 4
            pixels[start:start + frame['w'] * 4] = rgba[y * frame['w'] * 4:(y + 1) * frame['w'] * 4]
    (output / 'public/original').mkdir(parents=True, exist_ok=True)
    (output / 'app').mkdir(parents=True, exist_ok=True)
    original.png(output / 'public/original/swamp.png', width, height, pixels)
    tint = list(palette[alpha[0x2f82] * 4:alpha[0x2f82] * 4 + 3])
    metadata = dict(inputs=HASHES, width=width, height=height, bubbleColor=tint,
                    offsets=offsets, frames=frames)
    (output / 'app/original-swamp.json').write_text(json.dumps(metadata, indent=2) + '\n')


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('source', type=Path)
    parser.add_argument('--check', action='store_true')
    args = parser.parse_args()
    if args.check:
        with tempfile.TemporaryDirectory() as directory:
            target = Path(directory)
            generate(args.source, target)
            for name in ['app/original-swamp.json', 'public/original/swamp.png']:
                assert (ROOT / name).read_bytes() == (target / name).read_bytes(), name
        print('PASS: Swamp artwork, palette and four position tables reproduce from pinned inputs')
    else:
        generate(args.source, ROOT)
