"""Read-only original-byte oracle. Never executes or emulates original code.
Usage: python scripts/check-hypnotise-source.py GAME_ROOT
"""
import hashlib
import json
from pathlib import Path
import struct
import sys
import zlib

root = Path(__file__).resolve().parents[1]
game = Path(sys.argv[1])
exe = (game / 'd3dpoptb.exe').read_bytes()
assert hashlib.sha256(exe).hexdigest() == '3a5065c7420b3fcde208bf220bc86dfbac95e025ab2492caf9c7ea5308dfbe4f'

def code(address, size):
    return exe[address - 0x401000 + 0x400:address - 0x401000 + 0x400 + size]

# Independent reviewed opcode operands, including the SAME effect position passed to targeting.
assert code(0x509d64, 5) == bytes.fromhex('e8 77 4c 00 00')
assert code(0x50e9e9, 10) == bytes.fromhex('66 81 e1 00 fe 66 81 c1 00 01')
assert code(0x50e9f7, 8) == bytes.fromhex('66 25 00 fe 66 05 00 01')
assert code(0x50ea09, 5) == bytes.fromhex('e8 32 ff f3 ff')
assert code(0x50ea18, 7) == bytes.fromhex('68 f0 04 00 00 6a 2c')
assert code(0x50ea50, 2) == bytes.fromhex('6a 2a')
assert code(0x50ea69, 10) == bytes.fromhex('66 40 66 89 46 6c 66 3d 05 00')
assert code(0x50ea84, 3) == bytes.fromhex('8d 4e 3d')
assert code(0x50ea97, 5) == bytes.fromhex('66 83 7e 6c 10')
address = 0x5a6af8 + 44 * 11
assert list(exe[address - 0x598000 + 0x195e00:address - 0x598000 + 0x195e00 + 11]) == [1, 16, 0, 4, 1, 0, 0, 0, 1, 4, 0]
provenance = json.loads((root / 'public/original/provenance.json').read_text())['sha256']
inputs = {}
for name in ['hfx0-0.dat', 'al0-c.dat', 'pal0-c.dat']:
    data = (game / 'data' / name).read_bytes()
    assert hashlib.sha256(data).hexdigest() == provenance['data/' + name]
    inputs[name] = data
bank, alpha, palette = (inputs[name] for name in ['hfx0-0.dat', 'al0-c.dat', 'pal0-c.dat'])
# Independently decode only the sixteen source sprites, no importer invocation.
expected = []
for index in range(1264, 1280):
    width, height, offset = struct.unpack_from('<HHI', bank, 8 + index * 8)
    assert (width, height) == (100, 100)
    pixels = bytearray(width * height * 4)
    for y in range(height):
        x = 0
        while True:
            run, = struct.unpack_from('<b', bank, offset)
            offset += 1
            if not run:
                break
            if run < 0:
                x -= run
                continue
            for value in bank[offset:offset + run]:
                color = alpha[(value | 15) * 256] * 4
                start = (y * width + x) * 4
                pixels[start:start + 4] = palette[color:color + 3] + bytes([(value & 15) * 17])
                x += 1
            offset += run
            assert x <= width
    expected.append(pixels)
# Independent PNG chunk reader; the owned atlas uses unfiltered RGBA rows.
png = (root / 'public/original/effects.png').read_bytes()
assert png[:8] == b'\x89PNG\r\n\x1a\n'
offset, compressed = 8, bytearray()
while offset < len(png):
    size, = struct.unpack_from('>I', png, offset)
    kind, data = png[offset + 4:offset + 8], png[offset + 8:offset + 8 + size]
    assert zlib.crc32(kind + data) & 0xffffffff == struct.unpack_from('>I', png, offset + 8 + size)[0]
    if kind == b'IHDR':
        width, height, depth, color, compression, filtering, interlace = struct.unpack('>IIBBBBB', data)
        assert (depth, color, compression, filtering, interlace) == (8, 6, 0, 0, 0)
    if kind == b'IDAT':
        compressed.extend(data)
    offset += size + 12
raw = zlib.decompress(compressed)
stride = width * 4 + 1
assert len(raw) == stride * height
assert all(raw[y * stride] == 0 for y in range(height))
metadata = json.loads((root / 'app/original-effects.json').read_text())
assert (metadata['width'], metadata['height']) == (width, height)
assert (width, height) == (2048, 7168)
old = b''.join(raw[y * stride + 1:(y + 1) * stride] for y in range(6656))
assert hashlib.sha256(old).hexdigest() == '123d0f355757e31cd51fd3ed081d1b05d6165702b38224e26863218c2e18282b'
baseline = json.loads(json.dumps(metadata))
baseline['height'] = 6656
baseline['animations'].pop('hypnotise')
assert hashlib.sha256(json.dumps(baseline, separators=(',', ':')).encode()).hexdigest() == '8e43389fe9610e70fcedbbd8fe63b11d4addf9a001378225ee5ce273c5b83fdb'

frames = metadata['animations']['hypnotise']
assert len(frames) == 16
for n, frame in enumerate(frames):
    assert [frame['source'], frame['w'], frame['h']] == [1264 + n, 100, 100]
    x, y = frame['index'] % 8 * 256, frame['index'] // 8 * 256
    actual = b''.join(raw[(y + row) * stride + 1 + x * 4:(y + row) * stride + 1 + (x + 100) * 4] for row in range(100))
    assert actual == expected[n], f'HFX{1264 + n} differs from original pixels'
print('PASS: original effect16 init/snap/callback/lifetime bytes, descriptor44 and 160,000 decoded source pixels; no original code executed')
