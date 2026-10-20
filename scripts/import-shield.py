"""Extract only the original Shield HFX atlas, phase table and diffuse colors.

python3 scripts/import-shield.py /path/to/game [--check]
Pure data decoding: no original executable instructions are run. --check writes
nothing to the checkout. Shared effects and Bloodlust assets are not modified.
"""
import argparse
import hashlib
import importlib.util
import json
import struct
import tempfile
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
SOURCES = {
    'd3dpoptb.exe': '3a5065c7420b3fcde208bf220bc86dfbac95e025ab2492caf9c7ea5308dfbe4f',
    'data/hfx0-0.dat': '681eb1734fd73f86a6a52a8540415ec69a241a378161b60e9c9da1263d4ee0bf',
    'data/pal0-c.dat': '6c61cd586fc96ef5f777c71966a9ac1875491a4a521342ba06d108df5e92bf53',
    'data/al0-c.dat': 'afc46e78b56f901f1331ceb0b02052eeaba2b6446b8747a03d0f12639ae17310',
}


def decode(game):
    raw = {name: (game / name).read_bytes() for name in SOURCES}
    for name, expected in SOURCES.items():
        if hashlib.sha256(raw[name]).hexdigest() != expected:
            raise ValueError(f'Original input hash mismatch: {name}')
    exe = raw['d3dpoptb.exe']
    pe = struct.unpack_from('<I', exe, 0x3c)[0]
    count, optional = struct.unpack_from('<H', exe, pe + 6)[0], struct.unpack_from('<H', exe, pe + 20)[0]
    sections = [struct.unpack_from('<8sIIIIIIHHI', exe, pe + 24 + optional + i * 40)
                for i in range(count)]

    def at(address, length):
        rva = address - 0x400000
        for section in sections:
            if section[2] <= rva and rva + length <= section[2] + section[3]:
                start = section[4] + rva - section[2]
                return exe[start:start + length]
        raise ValueError(f'Unmapped source address {address:x}')

    phases = [dict(zip(('source', 'lift'), struct.unpack('<hh', at(0x59d9d8 + i * 4, 4))))
              for i in range(16)]
    palette, alpha = raw['data/pal0-c.dat'], raw['data/al0-c.dat']
    tints = []
    for owner in range(4):
        selector = at(0x5a89cb + owner * 5, 1)[0]
        index = alpha[selector * 4096 + 0xf82]
        tints.append(dict(owner=owner, selector=selector, paletteIndex=index,
                          rgb=list(palette[index * 4:index * 4 + 3])))
    spec = importlib.util.spec_from_file_location('original_shield_decoder', ROOT / 'scripts/import-original.py')
    decoder = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(decoder)
    # 00476570: RGB comes from PAL[AL[(value | 15) * 256]], alpha from the low nibble.
    colors = b''.join(palette[alpha[(v | 15) * 256] * 4:alpha[(v | 15) * 256] * 4 + 3]
                      + bytes([(v & 15) * 17]) for v in range(256))
    frames = decoder.sprites(raw['data/hfx0-0.dat'], colors, alpha=True)[1538:1553]
    assert len(frames) == 15 and all((w, h) == (32, 16) for w, h, _ in frames)
    width, height = 512, 16
    pixels, entries = bytearray(width * height * 4), []
    for i, (w, h, data) in enumerate(frames):
        for y in range(h):
            start = (y * width + i * 32) * 4
            pixels[start:start + w * 4] = data[y * w * 4:(y + 1) * w * 4]
        entries.append(dict(source=1538 + i, x=i * 32, y=0, w=w, h=h,
                            rgbaSHA256=hashlib.sha256(data).hexdigest()))
    with tempfile.TemporaryDirectory(prefix='pnd-shield-') as tmp:
        path = Path(tmp) / 'shield.png'
        decoder.png(path, width, height, pixels)
        image = path.read_bytes()
    metadata = dict(atlas='shield', width=width, height=height, frames=entries,
                    phases=phases, tints=tints, inputSHA256=SOURCES,
                    pngSHA256=hashlib.sha256(image).hexdigest(),
                    renderer='004673b0 Shield branch 00469019..004691ec; table 0059d9d8; selectors 005a89cb')
    return image, (json.dumps(metadata, indent=2) + '\n').encode()


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('game', type=Path)
    parser.add_argument('--check', action='store_true')
    args = parser.parse_args()
    image, metadata = decode(args.game)
    outputs = {ROOT / 'public/original/shield.png': image, ROOT / 'app/original-shield.json': metadata}
    for path, data in outputs.items():
        if args.check:
            assert path.read_bytes() == data, f'Generated Shield bytes differ: {path}'
        else:
            path.write_bytes(data)
    print(json.dumps(dict(status='PASS', checkOnly=args.check, frames=15,
                          files=[str(p.relative_to(ROOT)) for p in outputs])))


if __name__ == '__main__':
    main()
