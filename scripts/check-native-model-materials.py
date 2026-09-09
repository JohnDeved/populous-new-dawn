"""Capture original model-mode diffuse/specular output at triangle submission.
Usage: python SCRIPT EXE [--record]
Runs 004673b0 up to the triangle consumer. Texture-cache placement is supplied;
captures vertex colors and UVs, not cache population or blend-state ownership.
"""
import json
import struct
import sys
from pathlib import Path
from unicorn import UC_HOOK_CODE
from unicorn.x86_const import UC_X86_REG_ESP, UC_X86_REG_EIP, UC_X86_REG_EAX
from decomp import native_cpu, ROOT

cpu, identity = native_cpu(Path(sys.argv[1]))
cpu.mem_map(0x2000000, 0x100000)
polygon, ui, stack, stop = 0x2000000, 0x2020000, 0x20fd000, 0x20fe000
placement = [0, 0, 1, 1, 1 / 32, 0]


def write(a, fmt, *values):
    cpu.mem_write(a, struct.pack('<' + fmt, *values))


def read(a, fmt):
    return struct.unpack('<' + fmt, cpu.mem_read(a, struct.calcsize('<' + fmt)))[0]


def capture(c, address, size, data):
    sp = c.reg_read(UC_X86_REG_ESP)
    if address == 0x487e30:
        target = read(sp + 8, 'I')
        write(target, 'I6f', 0, *placement)
        c.reg_write(UC_X86_REG_EAX, 0)
        c.reg_write(UC_X86_REG_EIP, read(sp, 'I'))
        c.reg_write(UC_X86_REG_ESP, sp + 20)
    else:
        for i in range(3):
            point = read(sp + 4 + i * 4, 'I')
            colors.append(dict(diffuse=read(point + 16, 'I'), specular=read(point + 20, 'I')))
            uvs.append(list(struct.unpack('<2f', c.mem_read(point + 24, 8))))
        c.reg_write(UC_X86_REG_EIP, stop)


for address in (0x487e30, 0x47d8a0):
    cpu.hook_add(UC_HOOK_CODE, capture, begin=address, end=address)
write(0xafc2f4, 'I', ui)
assert read(0x5d54c8, 'I') == 1, 'The supplied executable defaults to bilinear UV mapping'
cases = []
for mode in (3, 4, 6, 7, 32):
    for shade in [*range(128), 0xffc8c8c8, 0xffffffff, 0xff102030]:
        cpu.mem_write(0x75d50c, bytes(3585 * 4))
        write(0x75d50c + 3584 * 4, 'I', polygon)
        cpu.mem_write(polygon, bytes(70))
        write(polygon, 'B', 6)
        write(polygon + 0x44, 'BB', 1, mode)
        for offset, x, y in [(6, 100, 100), (26, 200, 100), (46, 100, 200)]:
            write(polygon + offset, 'ffIII', x, y, 0, 0, shade)
        colors, uvs = [], []
        write(stack, 'I', stop)
        cpu.reg_write(UC_X86_REG_ESP, stack)
        cpu.emu_start(0x4673b0, stop, count=200000)
        assert cpu.reg_read(UC_X86_REG_EIP) == stop and len(colors) == 3
        assert colors[0] == colors[1] == colors[2]
        cases.append(dict(mode=mode, shade=shade, **colors[0]))
fixture = dict(executableSha256=identity['sha256'], cases=cases)
path = ROOT / 'tests/fixtures/model-materials.json'
if '--record' in sys.argv:
    path.write_text(json.dumps(fixture, separators=(',', ':')) + '\n')
else:
    assert json.loads(path.read_text()) == fixture
print(f'PASS: {len(cases)} native model material submissions: modes 3/4/6/7/32, numeric shades and packed hover colors')

# Both square cache placements must normalize to the same object-tile sampling.
# Include fractional and out-of-tile coordinates: this is affine mapping, not a clamp.
cases = []
for placement in ([0, 0, 1, 1, 1 / 32, 0], [.25, .5, .25, .25, 1 / 128, 0]):
    for smooth in (False, True):
        write(0x5d54c8, 'I', int(smooth))
        for mode in (3, 4, 6, 7, 32):
            for raw in ([0, 0, 2097150, 0, 0, 2097150],
                        [2097152, 2097152, 1048576, 524288, 1, 2097151],
                        [-65536, 2228224, 1966080, 65536, 524288, 1835008]):
                write(polygon + 0x45, 'B', mode)
                for i in range(3):
                    write(polygon + 14 + i * 20, 'ii', *raw[i * 2:i * 2 + 2])
                colors, uvs = [], []
                write(stack, 'I', stop)
                cpu.reg_write(UC_X86_REG_ESP, stack)
                cpu.emu_start(0x4673b0, stop, count=200000)
                assert cpu.reg_read(UC_X86_REG_EIP) == stop and len(uvs) == 3
                cases.append(dict(placement=placement[:5], smooth=smooth, mode=mode, raw=raw, uv=uvs))
fixture = dict(executableSha256=identity['sha256'], cases=cases)
path = ROOT / 'tests/fixtures/model-uv.json'
if '--record' in sys.argv:
    path.write_text(json.dumps(fixture, separators=(',', ':')) + '\n')
else:
    assert json.loads(path.read_text()) == fixture
print(f'PASS: {len(cases)} native model UV submissions: filtering, cache placement, cap endpoints and fractional/outside coordinates')
