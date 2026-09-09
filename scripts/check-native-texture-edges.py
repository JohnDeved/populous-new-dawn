"""Execute complete original object-texture initialization with supplied surfaces.
Usage: python SCRIPT EXE [--record]
COM/cache/allocation and initial pixels are supplied. Original tile traversal,
both edge passes and sprite-wrapper initialization run unchanged.
"""
import importlib.util
import hashlib
import json
import random
import struct
import sys
from pathlib import Path
from unicorn import UC_HOOK_CODE
from unicorn.x86_const import UC_X86_REG_EAX, UC_X86_REG_EIP, UC_X86_REG_ESP
from decomp import native_cpu, ROOT

cpu, identity = native_cpu(Path(sys.argv[1]))
cpu.mem_map(0, 4096)
cpu.mem_map(0x2000000, 0x1000000)
ui, surfaces, vtable, pixels, heap = 0x2000000, 0x2003000, 0x2004000, 0x2100000, 0x2300000
stack, stop, lock, unlock = 0x2ffd000, 0x2ffe000, 0x2ffb000, 0x2ffb100


def write(a, fmt, *values):
    cpu.mem_write(a, struct.pack('<' + fmt, *values))


def read(a, fmt):
    return struct.unpack('<' + fmt, cpu.mem_read(a, struct.calcsize('<' + fmt)))[0]


def adapter(c, address, size, data):
    global cursor, allocations
    sp = c.reg_read(UC_X86_REG_ESP)
    cleanup, result = 0, 0
    if address == 0x487380:
        cleanup = 28
    elif address == 0x42f4f0:
        write(read(sp + 28, 'I'), 'I', surfaces + cursor * 8)
    elif address == 0x55aca0:
        result = heap + allocations * 64
        allocations += 1
    elif address == lock:
        descriptor = read(sp + 12, 'I')
        write(descriptor + 16, 'I', pitch * 2)
        write(descriptor + 36, 'I', pixels + cursor * 4096)
        write(descriptor + 84, 'I', 16)
        write(descriptor + 100, 'I', alpha_mask)
        cleanup = 20
    elif address == unlock:
        cursor += 1
        cleanup = 8
    c.reg_write(UC_X86_REG_EAX, result)
    c.reg_write(UC_X86_REG_EIP, read(sp, 'I'))
    c.reg_write(UC_X86_REG_ESP, sp + 4 + cleanup)


for address in [0x4574d0, 0x487380, 0x42f4f0, 0x42f640, 0x55aca0, lock, unlock]:
    cpu.hook_add(UC_HOOK_CODE, adapter, begin=address, end=address)
write(0xafc2f4, 'I', ui)
write(vtable + 0x64, 'I', lock)
write(vtable + 0x80, 'I', unlock)
for tile in range(256):
    write(surfaces + tile * 8, 'I', vtable)
spec = importlib.util.spec_from_file_location('assets', ROOT / 'scripts/import-original.py')
assets = importlib.util.module_from_spec(spec)
spec.loader.exec_module(assets)
rng = random.Random(0x4b6e60)
for alpha_mask in [0xf000, 0x8000]:
    def rgba(word):
        if alpha_mask == 0xf000:
            return bytes(((word >> shift) & 15) * 17 for shift in [8, 4, 0, 12])
        return bytes([((word >> shift) & 31) * 255 // 31 for shift in [10, 5, 0]] + [255 if word & 0x8000 else 0])

    for pitch in [32, 37]:
        source = bytearray(256 * 1024 * 4)
        for tile in range(256):
            words = [rng.choice([0, 0, 0, alpha_mask, rng.randrange(65536)]) for _ in range(1024)]
            if tile == 0:
                words = [0] * 1024
                words[16 * 32 + 16] = 0xffff
            padded = [0x5a5a] * (pitch * 32)
            for y in range(32):
                padded[y * pitch:y * pitch + 32] = words[y * 32:y * 32 + 32]
                for x in range(32):
                    offset = (((tile // 8) * 32 + y) * 256 + (tile % 8) * 32 + x) * 4
                    source[offset:offset + 4] = rgba(words[y * 32 + x])
            write(pixels + tile * 4096, 'H' * len(padded), *padded)
        cursor, allocations = 0, 0
        write(stack, 'I', stop)
        cpu.reg_write(UC_X86_REG_ESP, stack)
        cpu.emu_start(0x4b6e60, stop, count=20000000)
        assert cpu.reg_read(UC_X86_REG_EIP) == stop and cpu.reg_read(UC_X86_REG_EAX) == 0
        assert cursor == allocations == 256
        expected = assets.object_texture_edges(source)
        for tile in range(256):
            wrapper = heap + tile * 64
            assert read(0x5d2110 + tile * 4, 'I') == read(0x5d2510 + tile * 4, 'I') == wrapper
            assert read(wrapper + 0x2c, 'I') == read(wrapper + 0x30, 'I') == 32
            assert read(wrapper + 0x34, 'I') == surfaces + tile * 8
            words = struct.unpack('<' + 'H' * (pitch * 32), cpu.mem_read(pixels + tile * 4096, pitch * 64))
            for y in range(32):
                assert all(word == 0x5a5a for word in words[y * pitch + 32:(y + 1) * pitch])
                for x in range(32):
                    offset = (((tile // 8) * 32 + y) * 256 + (tile % 8) * 32 + x) * 4
                    assert rgba(words[y * pitch + x]) == expected[offset:offset + 4], (alpha_mask, pitch, tile, x, y)
                    assert expected[offset + 3] == source[offset + 3]
        print(f'PASS: complete 256-tile native initialization, mask {alpha_mask:#x}, pitch {pitch}; all RGB/alpha pixels, padding and wrappers')

# Bind the imported RGBA atlas and browser probes to the supplied source files.
# Palette precision remains the browser's existing 8-bit format; hardware-format
# selection/quantization is outside this edge-color comparison.
from PIL import Image
source_dir = Path(sys.argv[1]).parent
names = ['data/bl320-c.dat', 'data/pal0-c.dat', 'data/al0-c.dat']
inputs = [(source_dir / name).read_bytes() for name in names]
provenance = json.loads((ROOT / 'public/original/provenance.json').read_text())['sha256']
for name, data in zip(names, inputs):
    assert hashlib.sha256(data).hexdigest() == provenance[name]
raw = assets.object_atlas(*inputs, json.loads((ROOT / 'app/original-rules.json').read_text())['objectTextureAlpha'])
prepared = assets.object_texture_edges(raw)
atlas = ROOT / 'public/original/atlas.png'
assert Image.open(atlas).convert('RGBA').tobytes() == prepared
changed = [i for i in range(0, len(raw), 4) if raw[i:i + 4] != prepared[i:i + 4]]
assert changed and all(raw[i + 3] == prepared[i + 3] == 0 for i in changed)
samples = []
for i in changed[::max(1, len(changed) // 32)][:32]:
    x, y = i // 4 % 256, i // 4 // 256
    for blend in [False, True]:
        j = (y * 256 + min(255, x + 1)) * 4
        samples.append(dict(x=x + (1 if blend else .5), y=y + .5,
            rgba=[(prepared[i + c] + prepared[j + c]) / 2 if blend else prepared[i + c] for c in range(4)]))
fixture = dict(executableSha256=identity['sha256'], atlasSha256=hashlib.sha256(atlas.read_bytes()).hexdigest(),
               changedTexels=len(changed), samples=samples)
path = ROOT / 'tests/fixtures/texture-edges.json'
if '--record' in sys.argv:
    path.write_text(json.dumps(fixture, separators=(',', ':')) + '\n')
else:
    assert json.loads(path.read_text()) == fixture
print(f'PASS: source-bound atlas RGB preparation, {len(changed)} changed transparent texels; every alpha byte unchanged')
