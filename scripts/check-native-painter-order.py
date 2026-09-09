"""Capture original mixed ground/model queues and final Direct3D triangle depths.
Usage: python SCRIPT EXE [--record]
Runs complete 0046e930/004718c0, 004673b0, 0047d8a0, 0047c7e0 and
004f9380. Supplies texture-cache records, redirects the batch receiver, and
skips three cache-maintenance calls. No GPU or complete scene is emulated.
"""
import json
import random
import struct
import sys
from pathlib import Path
from unicorn import UC_HOOK_CODE
from unicorn.x86_const import UC_X86_REG_ECX, UC_X86_REG_EIP, UC_X86_REG_ESP
from decomp import native_cpu, ROOT

cpu, identity = native_cpu(Path(sys.argv[1]))
cpu.mem_map(0x2000000, 0x1000000)
face, points, pointers, pool = 0x2000000, 0x2000100, 0x2000200, 0x2010000
ui, cache, records, context = 0x2020000, 0x2040000, 0x2050000, 0x2100000
vertices, indices, stack, stop = 0x2500000, 0x2600000, 0x2ffd000, 0x2ffe000


def write(address, fmt, *values):
    cpu.mem_write(address, struct.pack('<' + fmt, *values))


def read(address, fmt):
    return struct.unpack('<' + fmt, cpu.mem_read(address, struct.calcsize('<' + fmt)))[0]


def call(address, *args, receiver=context):
    write(stack, 'I' * (len(args) + 1), stop, *[v & 0xffffffff for v in args])
    cpu.reg_write(UC_X86_REG_ESP, stack)
    cpu.reg_write(UC_X86_REG_ECX, receiver)
    cpu.emu_start(address, stop, count=2000000)
    assert cpu.reg_read(UC_X86_REG_EIP) == stop


def adapter(c, address, size, user):
    if address == 0x47d8a0:
        c.reg_write(UC_X86_REG_ECX, context)
    else:
        sp = c.reg_read(UC_X86_REG_ESP)
        c.reg_write(UC_X86_REG_EIP, read(sp, 'I'))
        c.reg_write(UC_X86_REG_ESP, sp + 4)


for address in [0x47d8a0, 0x460970]:
    cpu.hook_add(UC_HOOK_CODE, adapter, begin=address, end=address)
write(0x75d504, 'I', pool + 0x10000)
write(pointers, 'III', points, points + 32, points + 64)
write(face + 7, 'B', 1)  # Original untextured model mode; same queue ordering.
write(0xafc2f4, 'I', ui)
write(0x9bcfc8, 'I', cache)
write(0x9bcfd8, 'I', records)
write(0xa30720, 'I', records + 0x100)
write(records + 2, 'B', 4)
write(0x8a03e4 + 12, 'B', 0)
write(0x76108c, 'BB', 0, 0)
write(0x895da8, 'I', 0)
write(0x895da4, 'I', 0x80000000)


def triangle(depths, kind='model', bias=0, flags=0):
    return dict(depths=depths, kind=kind, bias=bias if kind == 'model' else 0,
                flags=flags if kind == 'ground' else 0)


# Same screen coverage exposes crossing depths, bucket ties and explicit biases.
groups = [
    [triangle([0, 1000, 0]), triangle([250] * 3, 'ground')],
    [triangle([0] * 3), triangle([0] * 3)],
    [triangle([0] * 3, 'ground'), triangle([0] * 3)],
    [triangle([0] * 3, 'ground', flags=0x40), triangle([100] * 3)],
    [triangle([500] * 3, bias=-64), triangle([0] * 3, 'ground')],
    [triangle([0, 2000, 2000], 'ground'), triangle([1000] * 3)],
]
rng = random.Random(0x47c7e0)
for _ in range(64):
    groups.append([
        triangle([rng.randrange(-32000, 32000) for _ in range(3)],
                 rng.choice(['model', 'ground']), rng.choice([-4096, -64, 0, 64, 4096]),
                 rng.choice([0, 0x40])) for _ in range(16)
    ])
cases = []
for group in groups:
    cpu.mem_write(0x75d50c, bytes(0xe01 * 4))
    write(0x75d508, 'I', pool)
    write(context + 0x20002a, 'I', context + 0x2a)
    write(context + 0x18, 'IH', 0, 0)
    addresses = []
    for tag, item in enumerate(group):
        for i, depth in enumerate(item['depths']):
            write(points + i * 32 + 8, 'iffII', depth, tag * 10 + i, 100, 32, item['flags'])
        addresses.append(read(0x75d508, 'I'))
        if item['kind'] == 'ground':
            call(0x46e930, points, points + 32, points + 64, 0)
            write(addresses[-1] + 0x42, 'H', 0)
            write(addresses[-1] + 0x45, 'B', 0)
        else:
            call(0x4718c0, face, pointers, item['bias'], 32, 0, 1, 2, 1)
    ordered = []
    buckets = [None] * len(group)
    for bucket in range(0xe00, -1, -1):
        p = read(0x75d50c + bucket * 4, 'I')
        while p:
            tag = addresses.index(p)
            ordered.append(tag)
            buckets[tag] = bucket
            p = read(p + 2, 'I')
    assert len(ordered) == len(group)
    call(0x4673b0)
    assert read(context + 0x1c, 'H') == len(group)
    call(0x47c7e0)
    write(0xa68f54, 'H', 0)
    write(0xa68f58, 'I', vertices)
    write(0xa68f5c, 'I', indices)
    write(0xa68f6c, 'I', indices)
    depths = [None] * len(group)
    for i, tag in enumerate(ordered):
        record = context + 0x2a + i * 128
        assert read(record + 32, 'f') == tag * 10
        call(0x4f9380, receiver=record)
        actual = [read(vertices + i * 96 + j * 32 + 8, 'f') for j in range(3)]
        assert actual == [read(record + 20, 'f')] * 3
        assert all(read(vertices + i * 96 + j * 32 + 12, 'f') == 1 for j in range(3))
        depths[tag] = actual[0]
    assert list(struct.unpack('<' + 'H' * (len(group) * 3),
                              cpu.mem_read(indices, len(group) * 6))) == list(range(len(group) * 3))
    assert all(depths[a] > depths[b] for a, b in zip(ordered, ordered[1:]))
    cases.append(dict(triangles=group, buckets=buckets, order=ordered, rasterDepths=depths))
result = dict(executableSha256=identity['sha256'], cases=cases)
fixture = ROOT / 'tests/fixtures/painter-order.json'
if '--record' in sys.argv:
    fixture.write_text(json.dumps(result, separators=(',', ':')) + '\n')
else:
    assert json.loads(fixture.read_text()) == result
print(f'PASS: {len(cases)} native mixed queues, {sum(len(c["triangles"]) for c in cases)} triangles; '
      'far-to-near buckets, reverse insertion ties, constant final triangle depth and rhw=1')
