"""Import the follower-group digits drawn above grouped people (issue #1005).
Usage: python3 scripts/import-group-digits.py /path/to/extracted/game

Static reads only: the executable is hash-verified and read as data, never run.
Person rendering (00469610) selects font slot pointer 0087cbf0, the resource record
005a4670 `data\\f00t8-0.dat`, and draws each digit in the local tribe's colour byte
from 005a89c8 + tribe*5 (Western languages: 00493210 is zero, text path 00527960).
F00T8 digits are single-colour coverage; the atlas bakes that coverage in the tribe-0
(local player) colour from pal0-c, inferring the supplied colour is a fill as in
loading-art.md's 00546190 text path.
"""
from pathlib import Path
import hashlib
import importlib.util
import json
import struct
import sys
from decomp import ROOT, inspect

source = Path(sys.argv[1])
identity = inspect(source / 'd3dpoptb.exe')
exe = (source / 'd3dpoptb.exe').read_bytes()
pe = struct.unpack_from('<I', exe, 60)[0]
count = struct.unpack_from('<H', exe, pe + 6)[0]
optional = struct.unpack_from('<H', exe, pe + 20)[0]


def image(address, size):
    for i in range(count):
        _, virtual_size, rva, raw_size, raw = struct.unpack_from('<8sIIII', exe, pe + 24 + optional + i * 40)
        offset = address - 0x400000 - rva
        if 0 <= offset and offset + size <= min(virtual_size, raw_size):
            return exe[raw + offset:raw + offset + size]
    raise ValueError(f'unmapped {address:#x}')


# 0x469610: mov eax,[0x87cbf0] → 0x516d30(0x591698, eax). The 0x120-byte resource
# records end with (bank header, data pointer); F00T8's record owns slot 0x87cbf0.
assert image(0x469610, 5) == bytes.fromhex('a1f0cb8700')
assert image(0x5a4670, 17) == b'data\\f00t8-0.dat\0'
assert struct.unpack('<II', image(0x5a477e, 8)) == (0x9848c0, 0x87cbf0)
# 0x469684: colour = byte [0x5a89c8 + owner*5]; owner is the local player here.
assert image(0x469684, 7) == bytes.fromhex('8d8c80c8895a00')
colours = [image(0x5a89c8 + tribe * 5, 1)[0] for tribe in range(4)]
assert colours == [0xdb, 0xf4, 0xed, 0xe3]

spec = importlib.util.spec_from_file_location('original', ROOT / 'scripts/import-original.py')
original = importlib.util.module_from_spec(spec)
spec.loader.exec_module(original)
inputs = {}


def read(name):
    data = (source / name).read_bytes()
    inputs[name] = hashlib.sha256(data).hexdigest()
    return data


palette = read('data/pal0-c.dat')
bank = original.sprites(read('data/f00t8-0.dat'), palette)
assert len(bank) == 224
glyph = lambda code: bank[code - 32]
# 0x46c2f0/0x46c310('A'): the renderer centres on and steps by the 'A' metrics.
reference = glyph(ord('A'))[:2]
assert reference == (9, 15)
fill = palette[colours[0] * 4:colours[0] * 4 + 3] + b'\xff'
width = height = 0
rects = {}
for digit in range(1, 7):
    w, h, _ = glyph(ord('0') + digit)
    rects[str(digit)] = dict(x=width, y=0, w=w, h=h)
    width += w + 1
    height = max(height, h)
atlas = bytearray(width * height * 4)
for digit in range(1, 7):
    w, h, pixels = glyph(ord('0') + digit)
    r = rects[str(digit)]
    for y in range(h):
        for x in range(w):
            if pixels[(y * w + x) * 4 + 3]:
                at = (y * width + r['x'] + x) * 4
                atlas[at:at + 4] = fill
original.png(ROOT / 'public/original/group-digits.png', width, height, atlas)
(ROOT / 'app/original-group-digits.json').write_text(json.dumps(dict(
    source='Populous: The Beginning supplied F00T8 in-game font, digits 1-6',
    executableSha256=identity['sha256'], inputs=inputs, colourIndex=colours[0],
    reference=dict(w=reference[0], h=reference[1]), width=width, height=height,
    rects=rects), indent=2) + '\n')
print(f'Imported {len(rects)} F00T8 group digits ({width}x{height}) in palette colour {colours[0]:#x}')
