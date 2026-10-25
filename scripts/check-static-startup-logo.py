"""Reproduce the bounded boot-logo geometry proof from original bytes.

Usage: python3 scripts/check-static-startup-logo.py GAME_ROOT NEW_OUTPUT_DIRECTORY
Reads the verified PE/TGQ as data; invokes objdump, never the subject executable.
"""
import hashlib
import json
from pathlib import Path
import struct
import subprocess
import sys

game, output = map(Path, sys.argv[1:])
exe, movie = game / 'd3dpoptb.exe', game / 'fmv/blogo.tgq'
data, media = exe.read_bytes(), movie.read_bytes()
assert hashlib.sha256(data).hexdigest() == '3a5065c7420b3fcde208bf220bc86dfbac95e025ab2492caf9c7ea5308dfbe4f'
assert hashlib.sha256(media).hexdigest() == '65602921453014c11b079b95f664a29c89727fb0b2d0dce4c40fee94665a80fa'
pe = struct.unpack_from('<I', data, 0x3c)[0]
sections = pe + 24 + struct.unpack_from('<H', data, pe + 20)[0]
base = struct.unpack_from('<I', data, pe + 52)[0]

def read(va, size):
    for i in range(struct.unpack_from('<H', data, pe + 6)[0]):
        at = sections + i * 40
        rva, length, offset = struct.unpack_from('<III', data, at + 12)
        if base + rva <= va and va + size <= base + rva + length:
            return data[offset + va - base - rva:offset + va - base - rva + size]
    raise ValueError(hex(va))

def instruction(va, expected):
    expected = bytes.fromhex(expected)
    assert read(va, len(expected)) == expected, hex(va)

# Logo calls wrapper(filename, 1, 0, 0, languageAudio). Width double set;
# neither vertical-double bit is set. Wrapper selects a 640x480 surface.
instruction(0x52319d, '6a006a006a0168e8dc5d00e8d39af7ff')
instruction(0x49cd3f, 'c70554d398004c26a40b')
instruction(0x49cd49, '83bc2444020000007407830d54d3980010')
instruction(0x49cdf0, '68e00100006880020000')
assert read(0x5ddce8, 14).split(b'\0')[0] == b'FMV\\blogo.tgq'
# pIQT dispatches type 4; the dimension dispatch's fourth slot is 57cfa8,
# whose jump selects 57d000 (signed width/height at payload +0/+2).
instruction(0x579f49, '3d70495154771e747b')
instruction(0x579fd3, '6a048bcee894010000')
assert struct.unpack('<I', read(0x57cfb8 + 3 * 4, 4))[0] == 0x57cfa8
instruction(0x57cfa8, 'e953000000')
instruction(0x57d000, '0fbf02568b318946648b310fbf4202894660')
# Width/height multiplication and centering; no inferred physical GPU behavior.
instruction(0x57c76a, 'f6c2407403d1610c')
instruction(0x57c772, 'f64004307403d16110')
instruction(0x57c77b, 'f6400404740d8b51048b710c2bd6d1fa895114')
instruction(0x57c78e, 'f6400408740d8b51088b71102bd6d1fa895118')
frames, offset = [], 0
while offset < len(media):
    tag, size = struct.unpack_from('<4sI', media, offset)
    assert size >= 8 and offset + size <= len(media)
    if tag == b'pIQT':
        frames.append(struct.unpack_from('<HH', media, offset + 8))
    offset += size
assert len(frames) == 188 and set(frames) == {(320, 352)}

output.mkdir(parents=True, exist_ok=False)
ranges = {
    'geometry': (0x57c750, 0x57c7df),
    'geometry-caller': (0x57c1e0, 0x57c221),
    'packet-dimensions': (0x57d000, 0x57d02e),
    'packet-type': (0x579f49, 0x579f5d),
    'packet-type-call': (0x579fcd, 0x579fe2),
    'dimension-dispatch': (0x57cf90, 0x57cfb8),
    'surface-dimensions': (0x57bb30, 0x57bb74),
}
for name, (start, end) in ranges.items():
    assembly = subprocess.check_output([
        'objdump', '-d', '-Mintel', f'--start-address={start:#x}',
        f'--stop-address={end:#x}', str(exe),
    ], text=True).replace(str(exe), 'INPUT/d3dpoptb.exe')
    (output / f'{name}.asm').write_text(assembly)
facts = {
    'exeSha256': hashlib.sha256(data).hexdigest(),
    'movieSha256': hashlib.sha256(media).hexdigest(),
    'codedSize': [320, 352], 'frameCount': 188,
    'wrapperFlags': '0x0ba4264c', 'surfaceSize': [640, 480],
    'movieRect': [0, 64, 640, 352],
    'ranges': {name: [hex(start), hex(end)] for name, (start, end) in ranges.items()},
    'limits': 'Static geometry for this wrapper configuration, not observed native display/driver output.',
}
(output / 'facts.json').write_text(json.dumps(facts, indent=2) + '\n')
print(json.dumps(facts, indent=2))
