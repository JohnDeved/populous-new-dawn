"""Execute follower refresh/frame queues through native color/alpha initialization.

Usage: python scripts/check-native-follower-frame-alpha.py /path/to/d3dpoptb.exe
Outputs a source/input-bound JSON report; never records or changes fixtures/assets.
See decomp/research/follower-frame-alpha.md for upstream ghost-state evidence.
"""
import sys, struct, json, hashlib, importlib.util
from PIL import Image
from pathlib import Path
from itertools import product
from unicorn import UC_HOOK_CODE, UC_HOOK_MEM_WRITE
from unicorn.x86_const import UC_X86_REG_ESP, UC_X86_REG_EIP, UC_X86_REG_EAX, UC_X86_REG_ECX
from decomp import native_cpu, ROOT
exe = Path(sys.argv[1])
cpu, identity = native_cpu(exe)
cpu.mem_map(0x2000000, 0x1000000)
button, hfx, records, bank = 0x2000000, 0x2010000, 0x2020000, 0x2030000
texture, stack, stop = 0x2100000, 0x2ffd000, 0x2ffe000
queue = texture + 0x100

def write(address, fmt, *values):
    cpu.mem_write(address, struct.pack('<' + fmt, *values))

def read(address, fmt):
    return struct.unpack('<' + fmt, cpu.mem_read(address, struct.calcsize('<' + fmt)))[0]

def call(address, *args, frame=False, this=None):
    write(stack, 'I' * (len(args) + 1), stop, *args)
    cpu.reg_write(UC_X86_REG_ESP, stack)
    if this is not None:
        cpu.reg_write(UC_X86_REG_ECX, this)
    cpu.emu_start(address, stop, count=100000)
    expected = 0x4a059a if frame else stop
    assert cpu.reg_read(UC_X86_REG_EIP) == expected, hex(cpu.reg_read(UC_X86_REG_EIP))

source = (exe.parent / 'data/hfx0-0.dat').read_bytes()
count = struct.unpack_from('<I', source, 4)[0]
for index in range(count):
    width, height, _ = struct.unpack_from('<HHI', source, 8 + index * 8)
    write(hfx + index * 8, 'IHH', 0, width, height)
    # Supplied texture-bank metadata: native sprite dimensions and opaque cache handles.
    write(records + index * 36, 'HH', width, height)
    write(records + index * 36 + 20, 'IIII', 1, 1, 1, 1)
write(bank + 4, 'II', records, bank + 32)
write(bank + 32 + 12, 'I', hfx)
write(0x59df14, 'I', hfx)
write(0x5ce0bc, 'I', texture)
write(texture + 0x24804a, 'iiii', -10000, -10000, 10000, 10000)
write(0x89c6cf, 'HH', 640, 480)
write(0x5da078, 'I', 0)
write(0x5d5704, 'I', 0)
assert read(0x5d570c, 'I') == 85, 'Original initialized alpha, not supplied by probe'

def consume(cpu, address, size, user):
    sp = cpu.reg_read(UC_X86_REG_ESP)
    result, cleanup = 0, 4
    if address in (0x44a1f0, 0x44a210):
        result = read(sp + 4, 'I')
    elif address == 0x516170:
        entry = read(sp + 4, 'I')
        assert hfx <= entry < hfx + count * 8
        write(read(sp + 8, 'I'), 'I', bank)
        write(read(sp + 12, 'I'), 'I', (entry - hfx) // 8)
    elif address == 0x4608a0:
        cleanup = 12  # Texture-cache upload only, after native color/alpha decisions.
    elif address == 0x47dfd0:
        actual_bank = read(sp + 28, 'I')
        write(actual_bank + 4, 'II', records, bank + 32)
        return  # Execute real edge queue and real 004f95a0 initializer.
    elif address == 0x4a059a:
        cpu.emu_stop()  # Frame complete; positive-count icon/font rendering is separate.
        return
    else:
        raise AssertionError(hex(address))
    cpu.reg_write(UC_X86_REG_EAX, result)
    cpu.reg_write(UC_X86_REG_EIP, read(sp, 'I'))
    cpu.reg_write(UC_X86_REG_ESP, sp + cleanup)

for address in (0x44a1f0, 0x44a210, 0x516170, 0x4608a0, 0x47dfd0, 0x4a059a):
    cpu.hook_add(UC_HOOK_CODE, consume, begin=address, end=address)

# Validate the imported single background against native piece geometry and
# source pixels. Nonoverlapping pieces permit one CSS opacity for the frame.
spec = importlib.util.spec_from_file_location('assets', ROOT / 'scripts/import-original.py')
assets = importlib.util.module_from_spec(spec)
spec.loader.exec_module(assets)
palette = (exe.parent / 'data/pal0-c.dat').read_bytes()
art = assets.sprites(source, palette)

# Read the actual upstream setup operand and verify its call target. This is
# static setup evidence plus executable setter proof, not a full native launch.
assert bytes(cpu.mem_read(0x5004ad, 1)) == b'\x68'
assert bytes(cpu.mem_read(0x5004c2, 1)) == b'\xe8'
assert 0x5004c7 + read(0x5004c3, 'i') == 0x516270
upstream_table = read(0x5004ae, 'I')
assert upstream_table == 0x974560
call(0x516270, upstream_table)
assert read(0x5d5708, 'I') == 0x974560
assert read(0x5da0e0, 'I') == 0xffffff
# The only alpha writer's temporary pulse branch restores the original value.
alpha_writes = []
def record_alpha(cpu, access, address, size, value, user):
    alpha_writes.append(value)
hook = cpu.hook_add(UC_HOOK_MEM_WRITE, record_alpha, begin=0x5d570c, end=0x5d570f)
write(0x89c66c, 'B', 0x80)
write(0x59df0c, 'I', 0)
write(0xa69058, 'I', 0)
call(0x4fdbc0)
assert len(alpha_writes) == 2 and alpha_writes[-1] == 85, alpha_writes
write(0x89c66c, 'B', 0)
cpu.hook_del(hook)
results = []
states = [(False, False, False), (True, False, False), (False, True, False),
          (False, False, True), (True, False, True)]
sprites = {2: 666, 3: 668, 6: 670, 4: 672, 5: 674}
for tribe, model, live_count in product(range(4), (2, 3, 6, 4, 5), (0, 1, 3, 0, -1)):
    enabled = live_count > 0
    for hover, held, selected in states:
        cpu.mem_write(button, bytes(128))
        # Seed the wrong visibility/enable state: the real refresh must fix it.
        fields = [(8, int(not enabled)), (12, int(selected)), (16, 0),
                  (24, int(hover)), (28, int(held)), (0x37, 0), (0x3b, 153),
                  (0x47, 15), (0x4b, 36), (0x4f, sprites[model])]
        for offset, value in fields:
            write(button + offset, 'I', value)
        write(button + 99, 'I', model)
        write(0x89c6f0, 'B', tribe)
        write(0x89dbef + model * 2 + tribe * 0xc65, 'h', live_count)
        call(0x4a1170, button)
        assert read(button + 8, 'I') == int(enabled)
        assert read(button + 16, 'I') == 1
        write(texture + 0x20002a, 'I', queue)
        write(0x5da074, 'I', 0)
        call(0x4a0510, button, frame=True)
        end = read(texture + 0x20002a, 'I')
        draws = []
        for address in range(queue, end, 0x5a):
            draws.append(dict(
                sprite=read(address + 0x30, 'H'),
                x=read(address + 0x24, 'f'), y=read(address + 0x28, 'f'),
                width=read(address + 0x46, 'f'), height=read(address + 0x4a, 'f'),
                renderType=read(address + 12, 'I'),
                queueFlags=read(address + 32, 'I'),
                vertexFlags=read(address + 0x32, 'I'),
                argb=f'{read(address + 0x4e, "I"):08x}',
            ))
        assert len(draws) == 9, draws
        assert all(d['argb'] == ('ffffffff' if enabled else '55ffffff') for d in draws), draws
        assert all(d['renderType'] == (0x11 if enabled else 0x51) for d in draws)
        assert all(d['vertexFlags'] == (0 if enabled else 8) for d in draws)
        assert [d['queueFlags'] for d in draws] == [12, 4, 4, 8, 8, 0, 0, 0, 0]
        pixels = bytearray(15 * 36 * 4)
        coverage = [0] * (15 * 36)
        for draw in draws:
            sw, sh, data = art[draw['sprite']]
            for y in range(int(draw['height'])):
                for x in range(int(draw['width'])):
                    at = (int(draw['y']) - 153 + y) * 15 + int(draw['x']) + x
                    coverage[at] += 1
                    src = ((y % sh) * sw + x % sw) * 4
                    pixels[at * 4:at * 4 + 4] = data[src:src + 4]
        assert set(coverage) == {1}, 'Group opacity must not hide overlapping native pieces'
        frame = 'follower-hover' if hover or held else 'follower-selected' if selected else 'follower'
        assert pixels == Image.open(ROOT / f'public/original/hud-{frame}.png').convert('RGBA').tobytes()
        # Run final native vertex emission; no color/alpha submission is stubbed.
        for address in range(queue, end, 0x5a):
            vertices, indices = 0x2040000, 0x2041000
            write(0xa68f58, 'I', vertices)
            write(0xa68f6c, 'I', indices)
            write(0xa68f5c, 'I', indices)
            write(0xa68f54, 'I', 0)
            call(0x4f9bc0, this=address)
            assert [read(vertices + i * 32 + 16, 'I') for i in range(4)] == [read(address + 0x4e, 'I')] * 4
        results.append(dict(tribe=tribe, model=model, count=live_count, enabled=enabled,
                            hover=hover, held=held, selected=selected, draws=draws))
print(json.dumps(dict(
    executable=identity, hfxSha256=hashlib.sha256(source).hexdigest(),
    paletteSha256=hashlib.sha256(palette).hexdigest(),
    upstreamTable=f'{upstream_table:08x}', alphaWrites=alpha_writes, cases=results,
), indent=2))
