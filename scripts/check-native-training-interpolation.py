"""Compare real training admission followed by original person queue interpolation.

Usage: python SCRIPT EXE [--output PATH]
Reuses the reviewed occupancy oracle without executing its broad suite. Original
0x407150, 0x4d80e0 and 0x46f080 execute. Transport/indicator and final projection
are supplied. This is an admission/interpolation boundary proof, not full native
motion, original camera pixels, pathfinding, or a group-throughput comparison.
"""
import argparse
import json
import runpy
import struct
from pathlib import Path
from unicorn import UC_HOOK_CODE
from unicorn.x86_const import UC_X86_REG_EIP, UC_X86_REG_ESP

parser = argparse.ArgumentParser(description=__doc__)
parser.add_argument('exe', type=Path)
parser.add_argument('--output', type=Path)
args = parser.parse_args()
oracle = runpy.run_path(str(Path(__file__).with_name('check-native-occupants.py')))
cpu, call, read, write = (oracle[key] for key in ['cpu', 'call', 'read', 'write'])
p = oracle['addr'](1)
camera, pool = 0x2060000, 0x2070000
cpu.mem_map(camera, 0x20000)
write(0x74a350, 'I', camera)
projected = []


def project(cpu, address, size, user):
    sp = cpu.reg_read(UC_X86_REG_ESP)
    point = read(sp + 4, 'I')
    projected.append(list(struct.unpack('<iii', cpu.mem_read(point, 12))))
    write(point + 8, 'iff', 0, 12.75, 25.25)
    cpu.reg_write(UC_X86_REG_EIP, read(sp, 'I'))
    cpu.reg_write(UC_X86_REG_ESP, sp + 4)


cpu.hook_add(UC_HOOK_CODE, project, begin=0x46dbe0, end=0x46dbe0)


def draw():
    projected.clear()
    write(0x75d508, 'I', pool)
    cpu.mem_write(pool, bytes(64))
    cpu.mem_write(0x75d50c, bytes(3585 * 4))
    call(0x46f080, 0, p)
    assert len(projected) == 1
    return projected[0].copy()


cases = []
for model in [5, 6, 7, 8]:
    for dx, dy in [(0, 80), (0, -80), (80, 0), (-64, 48)]:
        for frames in [0, 1, 2, 3, 4]:
            c = oracle['case']()
            c['building']['model'] = model
            person = c['people'][0]
            person.update(x=16640, y=16448, height=1000, flags3=0x100,
                          velocityX=dx, velocityY=dy, velocityZ=0, renderFlags=0)
            oracle['fixture'](c)
            write(p + 0x18, 'I', 400)
            write(0x897981, 'I', 400 + frames)
            write(0x5ca84c, 'ii', 12, 48)
            write(0x89c661, 'I', 0)
            write(camera + 0x24, 'HH', person['x'], person['y'])
            before = draw()
            result = call(0x407150, p, oracle['addr'](100)) & 255
            after = draw()
            assert result == 1
            assert read(oracle['addr'](100) + 0xa6, 'B') == 1
            assert read(p + 0xc, 'I') & 0x800000
            assert not read(p + 0x35, 'H') & 16
            assert read(p + 0x14, 'I') == 0x100
            assert read(p + 0x18, 'I') == 400
            assert list(struct.unpack('<hhh', cpu.mem_read(p + 0x43, 6))) == [dx, dy, 0]
            assert after == before, (model, dx, dy, frames, before, after)
            expected = [(int(dx * frames / 4) - dx) // 2, 1000,
                        (int(dy * frames / 4) - dy) // 2]
            assert after == expected, (after, expected)
            cases.append(dict(model=model, displacement=[dx, dy, 0], fraction=frames / 4,
                              before=before, admitted=after))
result = dict(executableSha256=oracle['identity']['sha256'], cases=cases,
              scope='Original admission/occupancy and sprite-queue projection input composition; world leaves and final projection supplied; no native rendered pixels or throughput claim.')
if args.output:
    args.output.parent.mkdir(parents=True, exist_ok=True)
    args.output.write_text(json.dumps(result, indent=2) + '\n')
print(f'PASS: {len(cases)} original training admission/interpolation compositions preserve visible motion, flags and presentation stamp across all four training models')
