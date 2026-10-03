"""Execute original early-mission sky filename selection and verify exact assets.

Usage: python scripts/check-native-early-mission-skies.py /path/to/d3dpoptb.exe
No original Windows process, image decoder or renderer is run. Palette reset,
message cleanup, path resolution, open and close leaves are intercepted; the
filename routine itself executes. Open outcomes are supplied success/failure,
not observed Windows file access. Host input identity is checked separately.
This script is read-only and does not generate fixtures or import assets.
"""
import hashlib
from io import BytesIO
import json
import struct
import subprocess
import sys
from pathlib import Path

from PIL import Image
from unicorn import UC_HOOK_CODE
from unicorn.x86_const import UC_X86_REG_EAX, UC_X86_REG_EIP, UC_X86_REG_ESP

from decomp import native_cpu

if len(sys.argv) != 2:
    raise SystemExit(__doc__)
ROOT = Path(__file__).resolve().parents[1]
EXE = Path(sys.argv[1]).resolve()
GAME = EXE.parent
cpu, identity = native_cpu(EXE)
cpu.mem_map(0x2000000, 0x20000)
stack, stop = 0x201D000, 0x201E000
open_result = 0
open_events, close_events = [], []


def read(address):
    return struct.unpack('<I', cpu.mem_read(address, 4))[0]


def cstring(address):
    return bytes(cpu.mem_read(address, 200)).split(b'\0')[0].decode('ascii')


def hook(cpu, address, size, data):
    if address not in (0x4A3200, 0x4A3D20, 0x5001B0, 0x526280, 0x526370):
        return
    sp = cpu.reg_read(UC_X86_REG_ESP)
    if address == 0x5001B0:  # Supplied identity path resolver; no install-root claim.
        cpu.mem_write(read(sp + 4), cstring(read(sp + 8)).encode() + b'\0')
    if address == 0x526280:
        open_events.append(cstring(read(sp + 8)))
        assert read(sp + 12) == 0x80000001
        cpu.mem_write(read(sp + 4), struct.pack('<I', 0x1234))
        cpu.reg_write(UC_X86_REG_EAX, open_result & 0xFFFFFFFF)
    if address == 0x526370:
        close_events.append(read(sp + 4))
    cpu.reg_write(UC_X86_REG_ESP, sp + 4)
    cpu.reg_write(UC_X86_REG_EIP, read(sp))


cpu.hook_add(UC_HOOK_CODE, hook)
# Success then failure in the same CPU also verifies that default reset is not
# stale reuse of the previously selected bank. Keep d/g as existing regressions.
for bank in (12, 28, 25, 13, 16):
    for open_result in (0, -1):
        before = len(close_events)
        cpu.mem_write(stack, struct.pack('<II', stop, bank))
        cpu.reg_write(UC_X86_REG_ESP, stack)
        cpu.emu_start(0x42A140, stop, count=10000)
        assert cpu.reg_read(UC_X86_REG_EIP) == stop
        suffix = chr(bank + 0x57) if open_result == 0 else '0'
        names = [cstring(a) for a in (0x5A5E10, 0x991508, 0x9915A0, 0x9915E0, 0x892713)]
        assert names == [
            f'data/sky0-{suffix}.dat', f'data/d3d/DSky0-{suffix}1.png',
            f'data/d3d/Dsky0-{suffix}2.png', f'data/d3d/Dsky0-{suffix}b.png',
            f'data/pal0-{suffix}.dat',
        ], (bank, open_result, names)
        assert open_events[-1] == f'data/pal0-{chr(bank + 0x57)}.dat'
        assert len(close_events) - before == int(open_result == 0)
        assert not close_events or close_events[-1] == 0x1234
        assert cpu.mem_read(0x895DCD, 1)[0] == bank

inputs = {
    'levels/levl2001.hdr': '4b89ef6d64e4010bb3ec3b5985d0edc8e710504e8b1bc75a6ae688bd6eb070a6',
    'levels/levl2002.hdr': '44be9f709f03f4b4d936d86056256e7bb98683088332b4bb47354ad709ea8a49',
    'levels/levl2003.hdr': '219dd7611a4e3f6c2d4e78620a4d5bb9cf61bf0e9c66c21b2b43b89c8ba4d3f0',
    'data/pal0-c.dat': '6c61cd586fc96ef5f777c71966a9ac1875491a4a521342ba06d108df5e92bf53',
    'data/pal0-s.dat': '545843d0e8dc788549ca3546389eaded787369ddfb530995055c8b4b7d3658db',
    'data/pal0-p.dat': 'f246c0c22c835208167ae4ad8a4c1f1303691c610a1ff8560edeaf1f7d095f74',
}
for name, expected in inputs.items():
    assert hashlib.sha256((GAME / name).read_bytes()).hexdigest() == expected, name
for level, bank in ((1, 12), (2, 28), (3, 25)):
    assert (GAME / f'levels/levl{2000 + level}.hdr').read_bytes()[96] == bank
assets = {
    's': ('77d128e30013429d46e16af4027a96d9badff16c814a731467afdce6d5b3556c',
          '7e89bb2c0e44d2dff3b482fb315bf8ff0602df31a0e1e3daee436b74a9c59134',
          '03a8afaba9e2e9570f902959e59dcc7c9cb0c9014d27f8973281228cf288e90c'),
    'p': ('552578d0cc9de5a026f99425377aa1ee47d8eb2655b39e3bac29dfd058d06987',
          '8c8e716aaa4f83050f239ee0ccf13ed81535c85be0209c31b2131c629b8c9a64',
          '4451cc7feb91c902cd1de930e4b263a83a16dda02ae81f73b0020104be3d450a'),
}
for bank, hashes in assets.items():
    for (layer, name), expected in zip((('b', 'sky'), ('1', 'clouds'), ('2', 'clouds-high')), hashes):
        original = (GAME / f'data/d3d/dsky0-{bank}{layer}.png').read_bytes()
        assert hashlib.sha256(original).hexdigest() == expected
        assert original == (ROOT / f'public/original/{name}-{bank}.png').read_bytes()
        decoded = Image.open(BytesIO(original)).convert('RGBA')
        default = Image.open(ROOT / f'public/original/{name}.png').convert('RGBA')
        assert decoded.size == default.size == ((128, 128) if layer == 'b' else (512, 512))
        assert decoded.tobytes() != default.tobytes(), (bank, layer, 'identical decoded pixels')
# Bind the proved bank names to the same selector consumed by makeSky/updateSky.
js = """import {skyEnvironment} from './app/sky-environment.ts';
import {missionData} from './app/mission-data.ts';
console.log(JSON.stringify([1,2,3].map(n=>skyEnvironment(missionData(n).level.landscapeBank))));"""
result = subprocess.run(['node', '--input-type=module', '-e', js], cwd=ROOT, capture_output=True, text=True)
assert result.returncode == 0, result.stderr
assert json.loads(result.stdout) == [
    dict(backdrop=f'sky{suffix}', clouds=[f'clouds{suffix}', f'clouds-high{suffix}'], typeOne=False)
    for suffix in ('', '-s', '-p')
]
print('PASS: 10 original filename calls; palette success/failure, default reset, c/s/p/d/g; '
      '3 mission headers, 3 palettes, 6 exact original PNGs and live selector binding')
print('LIMIT: path/open/reset leaves supplied; no native decoder, graphics device or whole-frame comparison')
