"""Run the original cell renderer with adjacent tree/building records.

The polygon consumers are observed, not rasterized; this checks submission and
visibility flags, not complete frame equivalence. The Windows app is not launched.
Usage: python scripts/check-native-scenery-visibility.py /path/to/d3dpoptb.exe
"""
import itertools, json, random, struct, subprocess, sys
from pathlib import Path
from unicorn import UC_HOOK_CODE
from unicorn.x86_const import UC_X86_REG_ESP, UC_X86_REG_EIP, UC_X86_REG_EAX
from decomp import native_cpu, ROOT

cpu, identity = native_cpu(Path(sys.argv[1]))
cpu.mem_map(0x2000000, 0x10000)
cell, tree, building, stack, stop = 0x2000000, 0x2000100, 0x2000200, 0x200f000, 0x200ff00
calls = []

def write(address, fmt, *values):
    cpu.mem_write(address, struct.pack('<' + fmt, *values))

def read(address, fmt):
    return struct.unpack('<' + fmt, cpu.mem_read(address, struct.calcsize('<' + fmt)))[0]

def observe(cpu, address, size, data):
    sp = cpu.reg_read(UC_X86_REG_ESP)
    calls.append((address, read(sp + 4, 'I')))
    cpu.reg_write(UC_X86_REG_EAX, probe & 0xffffffff)
    cpu.reg_write(UC_X86_REG_EIP, read(sp, 'I'))
    cpu.reg_write(UC_X86_REG_ESP, sp + 4)

handles = {}
# Original queue probe, ordinary/construction consumers, morph, overlay.
for address in (0x48b2c0, 0x4708d0, 0x471c40, 0x40c9f0, 0x46f850):
    handles[address] = cpu.hook_add(UC_HOOK_CODE, observe, begin=address, end=address)
write(0x74a348, 'II', 0x4708d0, 0x471c40)
write(0x890390, 'III', 0, tree, building)
count = 0
for model, flags, first, offset, probe, full in itertools.product(
    range(1, 7), (0, 1, 0x10, 8, 0x8000), (1, 2), (0, 256, 512, 1024), (-1, 0, 4), (False, True)
):
    calls.clear()
    cpu.mem_write(cell, bytes(16)); cpu.mem_write(tree, bytes(256)); cpu.mem_write(building, bytes(256))
    write(cell + 6, 'H', first)
    for pointer, next_id, kind, object_model, x in (
        (tree, 2 if first == 1 else 0, 5, model, 256),
        (building, 1 if first == 2 else 0, 2, 1, 256 + offset),
    ):
        write(pointer + 0x20, 'H', next_id)
        write(pointer + 0x2a, 'BB', kind, object_model)
        write(pointer + 0x3a, 'B', 2)  # Native descriptor's ordinary 3D object type.
        write(pointer + 0x3d, 'HH', x, 256)
    assert read(0x5a6af8 + 2 * 11, 'B') == 3
    assert read(0x5a79b0 + model * 24, 'H') == 2
    write(tree + 0x35, 'H', 0x280 | flags)
    write(0x75d504, 'II', 100, 100 if full else 0)
    write(0x87cbbc, 'H', 0)
    write(stack, 'II', stop, cell); cpu.reg_write(UC_X86_REG_ESP, stack)
    cpu.emu_start(0x46ec80, stop, count=10000)
    assert cpu.reg_read(UC_X86_REG_EIP) == stop
    visible = not full and not flags & 0x11
    assert calls.count((0x4708d0, tree)) == int(visible), (model, flags, calls)
    assert calls.count((0x4708d0, building)) == int(not full)
    assert calls.count((0x48b2c0, tree)) == int(visible)
    assert calls.count((0x40c9f0, tree)) == int(visible and bool(flags & 8))
    assert calls.count((0x46f850, tree)) == int(visible and bool(flags & 0x8000))
    assert read(0x87cbbc, 'H') == int(visible and probe == 4)
    count += 1
print(f'PASS: {count:,} native cell renderer calls; tree/building order and distance, hide/drawn flags, pool limits, morph and overlay submissions')


# Replace the supplied distance probe with the complete native implementation.
cpu.hook_del(handles[0x48b2c0])
rng = random.Random(0x48b2c0)
cases = []
for n in range(4096):
    center = dict(x=rng.randrange(65536), y=rng.randrange(65536))
    angle = rng.randrange(2048)
    model = n % 12
    flags = [0, 0, 0, 1, 0x10, 8, 0x8000][n % 7]
    full = n % 31 == 0
    tribe = n % 4
    write(0x89c6f0, 'B', tribe)
    write(0x89d1ec + tribe * 0xc65, 'HHh', center['x'], center['y'], 0)
    write(0x89d1fa + tribe * 0xc65, 'H', angle)
    scratch = cell + 32
    write(scratch, 'HH', center['x'], center['y'])
    write(stack, 'IIII', stop, scratch, angle, 0xfffff000)
    cpu.reg_write(UC_X86_REG_ESP, stack)
    cpu.emu_start(0x4e6a70, stop, count=10000)
    assert cpu.reg_read(UC_X86_REG_EIP) == stop
    listener = dict(x=read(scratch, 'H'), y=read(scratch + 2, 'H'))
    dx, dy = rng.choice([(0,0),(1,0),(1,1),(2,0),(12288,0),(12289,0),(0,-12288),(0,-12289),(32768,32768),(rng.randrange(-32768,32768),rng.randrange(-32768,32768))])
    position = dict(x=(listener['x']+dx)&65535, y=(listener['y']+dy)&65535)
    cpu.mem_write(cell, bytes(16)); cpu.mem_write(tree, bytes(256))
    write(cell+6, 'H', 1)
    write(tree+0x2a, 'BB', 5, model)
    write(tree+0x3a, 'B', 2)
    write(tree+0x35, 'H', 0x280|flags)
    write(tree+0x3d, 'HH', position['x'], position['y'])
    write(0x75d504, 'II', 100, 100 if full else 0)
    write(0x87cbbc, 'H', 0)
    write(stack, 'II', stop, cell); cpu.reg_write(UC_X86_REG_ESP, stack)
    cpu.emu_start(0x46ec80, stop, count=10000)
    assert cpu.reg_read(UC_X86_REG_EIP) == stop
    cases.append(dict(input=dict(center=center,angle=angle,model=model,flags=flags,full=full,position=position),expected=dict(listener=listener,trees=bool(read(0x87cbbc,'H')))))
js = """import {soundListener,treeAmbienceAudible} from './app/ambient-sound.ts';let s='';for await(const c of process.stdin)s+=c;console.log(JSON.stringify(JSON.parse(s).map(c=>{const listener=soundListener(c.center,c.angle);return {listener,trees:!c.full&&!(c.flags&17)&&c.model>0&&c.model<7&&treeAmbienceAudible(c.position,listener)}})));"""
r = subprocess.run(['node','--input-type=module','-e',js],input=json.dumps([c['input'] for c in cases]),text=True,capture_output=True,cwd=ROOT)
assert r.returncode==0,r.stderr
for i,(c,a) in enumerate(zip(cases,json.loads(r.stdout))): assert c['expected']==a,(i,c,a)
if '--record' in sys.argv:
    (ROOT/'tests/fixtures/tree-ambience.json').write_text(json.dumps(dict(identity=identity,cases=cases[::17]),separators=(',',':'))+'\n')
print('PASS: 4096 native cell renderer visits with real camera-offset/toroidal distance probe, radius boundaries and near-listener exclusions')

if '--browser' in sys.argv:
    report = json.loads(Path(sys.argv[sys.argv.index('--browser') + 1]).read_text())
    for case in report['cases']:
        view = case['view']
        write(0x89c6f0, 'B', 0)
        write(0x89d1ec, 'HHh', round((view['x']+8)*256)&65535, round((-view['z']-8)*256)&65535, 0)
        write(0x89d1fa, 'H', view['heading'])
        write(0x87cbbc, 'H', 0)
        for candidate in case['treeCandidates']:
            cpu.mem_write(cell, bytes(16)); cpu.mem_write(tree, bytes(256))
            write(cell+6, 'H', 1)
            write(tree+0x2a, 'BB', 5, candidate['model'])
            write(tree+0x3a, 'B', 2)
            write(tree+0x35, 'H', 0x280)
            write(tree+0x3d, 'HH', candidate['x'], candidate['y'])
            write(0x75d504, 'II', 100, 0)
            write(stack, 'II', stop, cell); cpu.reg_write(UC_X86_REG_ESP, stack)
            cpu.emu_start(0x46ec80, stop, count=10000)
            assert cpu.reg_read(UC_X86_REG_EIP) == stop
        assert bool(read(0x87cbbc, 'H')) == case['expectedTrees'], case['view']
    print(f"PASS: {len(report['cases'])} browser tree candidate lists replayed through complete native cell renderer/distance probe; candidate membership supplied")
