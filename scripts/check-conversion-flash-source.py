"""Read-only original-byte oracle. Never executes or emulates original code.
Usage: python scripts/check-conversion-flash-source.py GAME_ROOT
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

# Reviewed x86 operand bytes: effect58 setter, eight visits, linked follow,
# decrement before follow/removal. These expectations do not import live helpers.
assert code(0x50a132, 8) == bytes.fromhex('68 d8 04 00 00 6a 2d 51')
assert code(0x50a144, 6) == bytes.fromhex('66 c7 46 6c 08 00')
assert code(0x5138be, 6) == bytes.fromhex('66 48 66 89 46 6c')
assert code(0x5138d4, 4) == bytes.fromhex('66 8b 46 72')
address = 0x5a6af8 + 45 * 11
assert list(exe[address - 0x598000 + 0x195e00:address - 0x598000 + 0x195e00 + 11]) == [1, 8, 0, 4, 1, 0, 0, 0, 1, 4, 0]
provenance = json.loads((root / 'public/original/provenance.json').read_text())['sha256']
inputs = {}
for name in ['hfx0-0.dat', 'al0-c.dat', 'pal0-c.dat']:
    data = (game / 'data' / name).read_bytes()
    assert hashlib.sha256(data).hexdigest() == provenance['data/' + name]
    inputs[name] = data
bank, alpha, palette = (inputs[name] for name in ['hfx0-0.dat', 'al0-c.dat', 'pal0-c.dat'])
# Independently decode only the eight source sprites, no importer invocation.
expected = []
for index in range(1240, 1248):
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
frames = metadata['animations']['startConversion']
assert len(frames) == 8
for n, frame in enumerate(frames):
    assert [frame['source'], frame['w'], frame['h']] == [1240 + n, 100, 100]
    x, y = frame['index'] % 8 * 256, frame['index'] // 8 * 256
    actual = b''.join(raw[(y + row) * stride + 1 + x * 4:(y + row) * stride + 1 + (x + 100) * 4] for row in range(100))
    assert actual == expected[n], f'HFX{1240 + n} differs from original pixels'
print('PASS: original effect58 init/follow/lifetime bytes, descriptor45 and 80,000 decoded source pixels; no original code executed')
