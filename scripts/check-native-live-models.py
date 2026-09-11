"""Compare live browser model triangles with complete original object rendering.
Usage: python SCRIPT EXE /private/tmp/populous-live-models.json
Run capture-browser-models.mjs first. No native callee is intercepted. This checks
individual model submissions, not global object traversal or GPU rasterization.
"""
import hashlib
import json
import struct
import sys
from pathlib import Path
from unicorn.x86_const import UC_X86_REG_ESP, UC_X86_REG_EIP, UC_X86_REG_FPCW
from decomp import native_cpu, ROOT

exe = Path(sys.argv[1])
cpu, identity = native_cpu(exe)
cpu.mem_map(0x2000000, 0x1000000)
unit, objects, faces, vertices = 0x2000000, 0x2010000, 0x2020000, 0x2200000
camera, ui, pool, stack, stop = 0x2300000, 0x2310000, 0x2400000, 0x2ffd000, 0x2ffe000
cpu.reg_write(UC_X86_REG_FPCW, 0x27f)


def write(a, fmt, *values):
    cpu.mem_write(a, struct.pack('<' + fmt, *values))


def read(a, fmt):
    return struct.unpack('<' + fmt, cpu.mem_read(a, struct.calcsize('<' + fmt)))[0]


def call(a, *args):
    write(stack, 'I' * (len(args) + 1), stop, *args)
    cpu.reg_write(UC_X86_REG_ESP, stack)
    cpu.emu_start(a, stop, count=2000000)
    assert cpu.reg_read(UC_X86_REG_EIP) == stop


provenance = json.loads((ROOT / 'public/original/provenance.json').read_text())['sha256']
for name, address in [('objs', objects), ('facs', faces), ('pnts', vertices)]:
    data = (exe.parent / 'objects' / (name + '0-2.dat')).read_bytes()
    assert hashlib.sha256(data).hexdigest() == provenance['objects/' + name + '0-2.dat']
    cpu.mem_write(address, data)
    if name == 'objs':
        for i in range(len(data) // 54):
            for offset, stride, base in [(16, 60, faces), (20, 60, faces), (24, 6, vertices), (28, 6, vertices)]:
                n = read(objects + i * 54 + offset, 'I')
                write(objects + i * 54 + offset, 'I', base + (n - 1) * stride if n else 0)
write(0x895ec1, 'I', objects)
write(0x895ec5, 'I', faces)
write(0x74a350, 'I', camera)
write(0xafc2f4, 'I', ui)
write(0x75d504, 'I', pool + 0x100000)
call(0x401040)
count = 0
frames = json.loads(Path(sys.argv[2]).read_text())
assert frames and all(frame['models'] for frame in frames), 'Empty live-model capture'
for frame in frames:
    v = frame['projection']
    write(camera + 0x24, 'HH', frame['center']['x'], frame['center']['y'])
    write(camera + 0x2a, 'i', v['scale'])
    write(0x74a354, '9i', *v['matrix'])
    for address, key in [(0x87ca5c, 'curvature'), (0x87ca64, 'depth'), (0x87ca68, 'perspective')]:
        write(address, 'i', v[key])
    write(0x87ca90, 'hh', v['width'], v['height'])
    write(0x87caa4, 'hh', v['centerX'], v['centerY'])
    write(ui + 0xcf8, 'ii', v['fractionX'], v['fractionY'])
    write(ui + 0xd00, 'ff', v['pixelScaleX'], v['pixelScaleY'])
    for model in frame['models']:
        cpu.mem_write(unit, bytes(256))
        write(unit + 0x24, 'HH', 1, model['heading'])
        write(unit + 0x2a, 'B', 2)
        write(unit + 0x33, 'HH', model['id'], 0x280 if 'picking' in model else 0x200)
        write(unit + 0x3d, 'HHh', *model['position'])
        write(unit + 0x68, 'ihh', model['size'], model['tilt'], model['roll'])
        write(0x75d508, 'I', pool)
        cpu.mem_write(0x75d50c, bytes(3585 * 4))
        call(0x4708d0, unit)
        buckets = {}
        for bucket in range(3585):
            p = read(0x75d50c + bucket * 4, 'I')
            while p:
                buckets[p] = bucket
                p = read(p + 2, 'I')
        actual, picking = [], []
        p = pool
        while p < read(0x75d508, 'I'):
            kind = read(p, 'B')
            if kind == 21:
                x,y,right,bottom = struct.unpack('<hhhh',cpu.mem_read(p+10,8))
                picking.append(dict(kind='bounds',bounds=dict(x=x,y=y,width=right-x,height=bottom-y),bucket=buckets[p]))
                p += 18
                continue
            screen = [n for offset in [6, 26, 46] for n in struct.unpack('<ff', cpu.mem_read(p + offset, 8))]
            if kind == 6:
                picking.append(dict(kind='model',points=[dict(x=screen[i],y=screen[i+1]) for i in (0,2,4)],bucket=buckets[p]))
            if read(p + 0x45, 'B'):  # Mode zero is picked but never rasterized.
                assert read(p + 22, 'I') == read(p + 42, 'I') == read(p + 62, 'I')
                actual.append(dict(screen=screen, shade=read(p + 22, 'I'), bucket=buckets[p]))
            p += 70
        if 'picking' in model:
            assert picking == model['picking'], ('picking',frame['preset'],frame['bearing'],model['id'],picking[:2],model['picking'][:2],picking[-1],model['picking'][-1],len(picking),len(model['picking']))
        assert actual == model['triangles'], (frame['preset'], frame['bearing'], model['id'], actual[:2], model['triangles'][:2], len(actual), len(model['triangles']))
        count += len(actual)
print(f'PASS: {len(frames)} live views, {sum(len(f["models"]) for f in frames)} complete native model calls, {count} triangles: screen positions, sunlight/depth shades, culling, buckets and available picking-only triangles/bounds; EXE {identity["sha256"]}')
