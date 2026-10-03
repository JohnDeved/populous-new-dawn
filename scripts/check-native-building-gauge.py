"""Bounded original Guard Tower render-queue and automatic-panel evidence.

Usage: python scripts/check-native-building-gauge.py EXE
Executes the actual cell dispatcher and staged mesh producer with original assets.
Projection and normal calculation are supplied as in check-native-building-faces;
no raster, complete frame, or global absence-of-overlays claim is made.
"""
import hashlib
import json
import struct
import sys
from collections import Counter
from pathlib import Path
from unicorn import UC_HOOK_CODE
from unicorn.x86_const import UC_X86_REG_EAX, UC_X86_REG_EIP, UC_X86_REG_ESP
from decomp import ROOT, native_cpu

exe = Path(sys.argv[1])
cpu, identity = native_cpu(exe)
cpu.mem_map(0x2000000, 0x1000000)
unit, objects, faces, points = 0x2000000, 0x2010000, 0x2020000, 0x2200000
polygons, stack, stop = 0x2400000, 0x2ffd000, 0x2ffe000
provenance = json.loads((ROOT / 'public/original/provenance.json').read_text())['sha256']


def write(address, fmt, *values):
    cpu.mem_write(address, struct.pack('<' + fmt, *values))


def read(address, fmt):
    return struct.unpack('<' + fmt, cpu.mem_read(address, struct.calcsize('<' + fmt)))[0]


def call(address, *args):
    write(stack, 'I' * (len(args) + 1), stop, *args)
    cpu.reg_write(UC_X86_REG_ESP, stack)
    cpu.emu_start(address, stop, timeout=1000000, count=1000000)
    assert cpu.reg_read(UC_X86_REG_EIP) == stop, hex(cpu.reg_read(UC_X86_REG_EIP))
    return cpu.reg_read(UC_X86_REG_EAX)


asset_hashes = {}
for address, name in ((objects, 'objs'), (faces, 'facs'), (points, 'pnts')):
    relative = f'objects/{name}0-2.dat'
    raw = (exe.parent / relative).read_bytes()
    asset_hashes[relative] = hashlib.sha256(raw).hexdigest()
    assert asset_hashes[relative] == provenance[relative]
    cpu.mem_write(address, raw)
    if name == 'objs':
        object_count = len(raw) // 54
for index in range(object_count):
    for offset, stride, base in ((16, 60, faces), (20, 60, faces), (24, 6, points), (28, 6, points)):
        relative = read(objects + index * 54 + offset, 'I')
        write(objects + index * 54 + offset, 'I', base + (relative - 1) * stride if relative else 0)
write(0x895ec1, 'II', objects, faces)
write(0x74a348, 'III', 0x4708d0, 0x471c40, unit + 256)
write(0x75d504, 'I', polygons + 0x10000)
write(0x87ca90, 'HH', 1024, 768)
write(0x895dd1, 'BB', 32, 32)
write(0x890394, 'I', unit)
write(0x8a03e4 + 6, 'H', 1)
call(0x40cde0, 0x87cb03)


def supplied_consumer(c, address, size, user):
    sp = c.reg_read(UC_X86_REG_ESP)
    if address == 0x46de00:
        point = read(sp + 4, 'I')
        # Deterministic in-bounds projection preserving source-vertex identity.
        write(point + 12, 'ff', 100 + (point - 0x74daf8) // 32, 200)
    c.reg_write(UC_X86_REG_EAX, 0)
    c.reg_write(UC_X86_REG_EIP, read(sp, 'I'))
    c.reg_write(UC_X86_REG_ESP, sp + 4)


for address in (0x46de00, 0x40cd00):
    cpu.hook_add(UC_HOOK_CODE, supplied_consumer, begin=address, end=address)

cases = []
for tribe in range(4):
    for stage in range(4):
        for hover in (False, True):
            cpu.mem_write(unit, bytes(256))
            cpu.mem_write(0x75d50c, bytes(0xe01 * 4))
            write(0x75d508, 'I', polygons)
            write(unit + 0x24, 'H', 1)
            write(unit + 0x2a, 'BBB', 2, 4, 1)
            write(unit + 0x2f, 'B', tribe)
            write(unit + 0x33, 'HH', 79 + tribe, 0xa2)
            write(unit + 0x3a, 'B', 10)  # Native partial-building descriptor/type4.
            write(unit + 0x78, 'B', stage)
            write(0x89c6f0, 'B', 0)
            write(0x74a2f0, 'B', int(hover))
            write(0x74a33c, 'B', int(hover))  # Permit inspection of enemy geometry.
            write(0x87cace, 'H', 1)
            call(0x46ec80, 0x8a03e4)
            records = []
            for bucket in range(0xe01):
                pointer = read(0x75d50c + bucket * 4, 'I')
                seen = set()
                while pointer:
                    assert polygons <= pointer < polygons + 0x10000 and pointer not in seen
                    seen.add(pointer)
                    kind = read(pointer, 'B')
                    records.append(kind)
                    assert kind in (6, 0x15, 0x16), (tribe, stage, hover, kind)
                    pointer = read(pointer + 2, 'I')
            counts = Counter(records)
            assert counts[6] > 0 and counts[0x15] == 1
            assert counts[0x16] == int(hover), counts
            # Automatic activity eligibility uses local owner and the activity bit,
            # not construction progress. This is separate from the mesh producer.
            activity = []
            for flags in (0, 0x80):
                write(unit + 0x9c, 'H', flags)
                result = call(0x5092e0, unit) & 255
                assert result == (flags if tribe == 0 else 0)
                activity.append(result)
            cases.append(dict(tribe=tribe, stage=stage, hover=hover,
                              queueTypes=dict(sorted(counts.items())), activity=activity))
print(json.dumps(dict(executableSha256=identity['sha256'], assets=asset_hashes,
                     supplied=['0046de00 projection', '0040cd00 normal'], cases=cases), indent=2))
print('PASS: 32 original Tower cell dispatches: stage mesh triangles and picking/hover records only; 64 automatic-panel eligibility decisions')
