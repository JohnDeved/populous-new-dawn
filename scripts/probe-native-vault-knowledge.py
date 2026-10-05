"""Bounded Mission 3 authored knowledge producer and presentation dispatch.

Original x86 executes in Unicorn, never as an OS/game. No application or asset writes.
Run: python -B scripts/probe-native-vault-knowledge.py EXE --output DIRECTORY
"""
import argparse
import hashlib
import json
import struct
import time
from pathlib import Path
from unicorn import UC_HOOK_CODE
from unicorn.x86_const import UC_X86_REG_EAX, UC_X86_REG_EBP, UC_X86_REG_EDX, UC_X86_REG_EIP, UC_X86_REG_ESP
from decomp import ROOT, configure_native_constants, load_native_shapes, native_cpu

p = argparse.ArgumentParser(description=__doc__)
p.add_argument('executable', type=Path)
p.add_argument('--output', type=Path, required=True)
args = p.parse_args()
started = time.monotonic()
expected = {
    'd3dpoptb.exe': '3a5065c7420b3fcde208bf220bc86dfbac95e025ab2492caf9c7ea5308dfbe4f',
    'levels/levl2003.dat': 'eb239eabebbcde37c1e1633b149d48977cedf432348a12fc5ee6b4be74c049bf',
    'levels/constant.dat': 'e905e513c798171d5540082565b8addc9f54e5851006b56e8d1976687ba42f24',
    'objects/objs0-2.dat': 'e1af6bdf050608d7c1832700826bece72ca592abdff3ee9c2138c50ed8a8607d',
    'objects/shapes.dat': 'ae1188129d84c266d91a1e9e75d960e99e80cdfd573f85d524742e970a0b2849',
    'data/smoke.txt': '48d460819cdbc7d32ae7253150752c3d2ea641b07d797d0914525545f5e19cb1',
    'data/hfx0-0.dat': '681eb1734fd73f86a6a52a8540415ec69a241a378161b60e9c9da1263d4ee0bf',
}
raw = {name: (args.executable.parent / name).read_bytes() for name in expected}
assert {name: hashlib.sha256(value).hexdigest() for name, value in raw.items()} == expected
cpu, identity = native_cpu(args.executable)
configure_native_constants(cpu, args.executable)
cpu.mem_map(0x2000000, 0x500000)
record, position, trigger, vault = 0x2000000, 0x2000100, 0x2000200, 0x2000300
pool, objects, shapes, stack, stop = 0x2010000, 0x2030000, 0x2040000, 0x24fd000, 0x24fe000
controller, companion = 0x986ba0, 0x988a88
events, calls, stage = [], [], 'setup'

def write(address, fmt, *values):
    cpu.mem_write(address, struct.pack('<' + fmt, *values))

def read(address, fmt='I'):
    return struct.unpack('<' + fmt, cpu.mem_read(address, struct.calcsize('<' + fmt)))[0]

def ret(value=0):
    sp = cpu.reg_read(UC_X86_REG_ESP)
    cpu.reg_write(UC_X86_REG_EAX, value & 0xffffffff)
    cpu.reg_write(UC_X86_REG_EIP, read(sp))
    cpu.reg_write(UC_X86_REG_ESP, sp + 4)

load_native_shapes(cpu, args.executable, objects, shapes)
entries = 0x2050000
hfx = raw['data/hfx0-0.dat']
for i in range(struct.unpack_from('<I', hfx, 4)[0]):
    width, height, pointer = struct.unpack_from('<HHI', hfx, 8 + i * 8)
    write(entries + i * 8, 'IHH', pointer, width, height)
write(0x59df14, 'I', entries)
for line in raw['data/smoke.txt'].decode('ascii').splitlines():
    parts = line.split('#', 1)[0].split()
    if parts:
        model, angle, x, h, y = map(int, parts[1:])
        write(0x5f0558 + (model * 4 + angle) * 6, 'hhh', x, h, y)
# Guard PE read-only regions, geometry tables, and all configured constant targets.
guarded = [(objects, bytes(cpu.mem_read(objects, len(raw['objects/objs0-2.dat'])))),
           (shapes, bytes(cpu.mem_read(shapes, len(raw['objects/shapes.dat'])))),
           (entries, bytes(cpu.mem_read(entries, struct.unpack_from('<I', hfx, 4)[0] * 8)))]
pe = raw['d3dpoptb.exe']; off = struct.unpack_from('<I', pe, 60)[0]
for i in range(struct.unpack_from('<H', pe, off + 6)[0]):
    entry = off + 24 + struct.unpack_from('<H', pe, off + 20)[0] + i * 40
    _, vs, va, size = struct.unpack_from('<8sIII', pe, entry)
    flags = struct.unpack_from('<I', pe, entry + 36)[0]
    if flags & 0x40000000 and not flags & 0x80000000:
        guarded.append((0x400000 + va, bytes(cpu.mem_read(0x400000 + va, max(vs, size)))))
constants = json.loads((ROOT / 'app/original-constants.json').read_text())
for i in range(512):
    d = bytes(cpu.mem_read(0x5aa5f0 + i * 31, 31))
    name = d[:25].split(b'\0')[0].decode('ascii')
    if not name: break
    if name in constants:
        address = struct.unpack('<I', d[27:])[0]
        guarded.append((address, bytes(cpu.mem_read(address, d[25]))))

def guard():
    for address, value in guarded:
        assert bytes(cpu.mem_read(address, len(value))) == value, hex(address)

def call(address, *values):
    guard()
    write(stack, 'I' * (len(values) + 1), stop, *values)
    cpu.reg_write(UC_X86_REG_ESP, stack)
    calls.append([stage, hex(address), list(values)])
    try:
        cpu.emu_start(address, stop, timeout=150000, count=300000)
    except Exception as error:
        raise AssertionError((stage, hex(address), hex(cpu.reg_read(UC_X86_REG_EIP)), events[-8:])) from error
    assert cpu.reg_read(UC_X86_REG_EIP) == stop, (stage, hex(cpu.reg_read(UC_X86_REG_EIP)))
    guard()
    return cpu.reg_read(UC_X86_REG_EAX)

observed = [0x4ed8a0, 0x4ed580, 0x4ede10, 0x4ed700, 0x4faaf0, 0x4fc570,
            0x4facf0, 0x481550, 0x4819c0, 0x481490, 0x4839f0, 0x404540]
leaves = {
    0x4ee470: 'cell insertion', 0x4ee580: 'cell relocation, copies XYZ',
    0x44e940: 'terrain height 200', 0x4010b0: 'sunlight',
    0x4fbd20: 'head state presentation', 0x44fad0: 'cell terrain refresh',
    0x4ef180: 'object removal, sets removed bit', 0x4edcf0: 'glow removal, sets removed bit',
    0x48a050: 'sound device, returns zero', 0x48a810: 'sound device',
    0x44bb50: 'open building panel', 0x44bc10: 'building HUD rectangle (1,2,31,42)',
    0x44b770: 'landscape viewport (100,0,640,480)', 0x479f00: 'display request',
    0x46e700: 'renderer viewport', 0x472da0: 'whole building geometry renderer',
    0x473210: 'per-face building geometry renderer', 0x482290: 'companion processor',
    0x49cf90: 'limiter set', 0x49cfa0: 'limiter clear',
    0x516270: 'palette raster', 0x5162e0: 'pulse raster',
    0x4811a0: 'arrival feedback', 0x481090: 'center feedback', 0x48a770: 'sound stop',
    0x41b580: 'campaign knowledge notification, records arguments',
}

def hook(c, address, size, user):
    sp = c.reg_read(UC_X86_REG_ESP)
    a = read(sp + 4)
    if address in observed:
        events.append([stage, 'entered', hex(address), a])
        return
    if address == 0x4ee580:
        c.mem_write(a + 0x3d, bytes(c.mem_read(read(sp + 8), 6)))
    elif address == 0x44e940:
        ret(200); return
    elif address in (0x4ef180, 0x4edcf0):
        write(a + 0xc, 'I', read(a + 0xc) | 1)
        events.append([stage, 'removed', read(a + 0x24, 'H')])
    elif address == 0x44bc10:
        events.append([stage, 'building-hud-slot', read(sp + 8)])
        write(a, '4i', 1, 2, 31, 42); ret(a); return
    elif address == 0x44b770:
        for i, value in enumerate((100, 0, 640, 480)):
            write(read(sp + 4 + i * 4), 'i', value)
    elif address in (0x472da0, 0x473210):
        model = read(a + 14, 'H')
        events.append([stage, 'geometry-dispatch', hex(address), model,
                       read(objects + model * 54 + 2, 'h'), read(objects + model * 54 + 4, 'h')])
    elif address == 0x48a050:
        events.append([stage, 'sound', read(sp + 8)])
    elif address == 0x41b580:
        events.append([stage, 'knowledge-notification', *struct.unpack('<3I', c.mem_read(sp + 4, 12))])
    ret()

for address in observed + list(leaves):
    cpu.hook_add(UC_HOOK_CODE, hook, begin=address, end=address)

# Supply bounded free lists; the actual allocator/initializer/copy/dispatch execute.
for group, first_id, global_address in ((0, 900, 0x89031c), (1, 100, 0x890320)):
    for i in range(16):
        pointer = pool + (group * 16 + i) * 0x100
        write(pointer, 'II', 0 if i == 0 else pointer - 0x100, 0 if i == 15 else pointer + 0x100)
        write(pointer + 0x24, 'H', first_id + i)
        write(0x890390 + (first_id + i) * 4, 'I', pointer)
    write(global_address, 'I', pool + group * 16 * 0x100)

level = raw['levels/levl2003.dat']
records = {i: level[0x14043 + i * 55:0x14043 + (i + 1) * 55] for i in (91, 92, 104)}
assert list(records[91][7:15]) == [4, 1, 0, 1, 1, 0, 93, 0]
assert list(records[92][7:11]) == [2, 5, 1, 1]
# Native constructor's occupied-cell input, from authored model18/angle0.
write(vault + 0x24, 'H', 50); write(vault + 0x2a, 'BB', 2, 18)
write(vault + 0x33, 'H', 154); write(vault + 0x26, 'H', 0)
write(vault + 0x7a, 'HH', 57856, 31744)
write(0x890390 + 50 * 4, 'I', vault)
cell = 0x8a03e4 + (((0xe3 & 0xfe) * 2) | ((0x7d & 0xfe) << 8)) * 4
write(cell + 8, 'H', 50); write(cell + 1, 'B', 2)
write(position, 'HHh', 58112, 32000, 0)
write(0x89c6f0, 'B', 0)

def state(pointer):
    return {key: read(pointer + offset, fmt) for key, offset, fmt in (
        ('id', 0x24, 'H'), ('class', 0x2a, 'B'), ('model', 0x2b, 'B'),
        ('state', 0x2c, 'B'), ('phase', 0x2d, 'B'), ('frame', 0x33, 'H'),
        ('height', 0x41, 'h'), ('rewardModel', 0x74, 'I'), ('glow', 0x78, 'H'),
        ('remaining', 0x7a, 'h'), ('rewardClass', 0x7c, 'B'),
        ('automatic', 0x7d, 'B'), ('recipient', 0x7e, 'B'), ('visualPhase', 0x7f, 'B'))}

result = {'inputs': expected, 'authored': {str(i): list(b) for i, b in records.items()},
          'interceptedLeaves': {hex(a): name for a, name in leaves.items()}}
try:
    stage = 'source allocation before authored settings'
    source = call(0x4ed8a0, 6, 2, 255, position)
    result['sourceBeforeSettings'] = state(source)
    stage = 'authored post processing allocates knowledge marker'
    cpu.mem_write(record, records[92][:39]); call(0x485b00, source, record)
    result['sourceAfterSettings'] = state(source)
    marker = read(0x890324)
    assert (read(marker + 0x2a, 'B'), read(marker + 0x2b, 'B')) == (6, 10)
    result['markerBeforeFirstVisit'] = state(marker)
    stage = 'marker native class dispatch'
    call(0x4ed700, marker)
    result['markerAfterFirstVisit'] = state(marker)
    marker_glow = read(0x890390 + read(marker + 0x78, 'H') * 4)
    result['markerGlow'] = state(marker_glow)
    assert read(marker + 0x33, 'H') == 1079
    assert read(marker + 0x78, 'H') != 0
    assert read(marker_glow + 0x33, 'H') == 1417
    assert read(marker_glow + 0x41, 'h') == read(marker + 0x41, 'h') - 80
    # Execute the actual HFX selector inside 004673b0, with its already-dispatched
    # primitive type and stack object pointer supplied. This is a bounded consumer
    # instruction slice, not execution of projection, polygon sorting or final pixels.
    stage = 'world sprite HFX resource selector slice'
    result['worldResourceReads'] = []
    for pointer in (marker, marker_glow):
        guard()
        write(stack + 0x20, 'I', pointer)
        cpu.reg_write(UC_X86_REG_ESP, stack)
        cpu.reg_write(UC_X86_REG_EAX, 1)
        cpu.reg_write(UC_X86_REG_EBP, 0x5a6af8 + read(pointer + 0x3a, 'B') * 11)
        cpu.emu_start(0x4689a4, 0x468a09, timeout=100000, count=100)
        assert cpu.reg_read(UC_X86_REG_EIP) == 0x468a09
        entry = cpu.reg_read(UC_X86_REG_EDX)
        selected = (entry - entries) // 8
        row = {'entry': hex(entry), 'hfx': selected, 'width': read(stack + 0x28), 'height': read(stack + 0x24)}
        assert selected == read(pointer + 0x33, 'H')
        result['worldResourceReads'].append(row)
        guard()
    assert [(r['hfx'], r['width'], r['height']) for r in result['worldResourceReads']] == [(1079, 21, 23), (1417, 81, 68)]
    # Supplied trigger allocation; original record conversion and completion body.
    stage = 'trigger authored settings'
    write(trigger + 0x2a, 'BB', 6, 6); write(trigger + 0x24, 'H', 92)
    write(trigger + 0x3d, 'HHh', 58112, 32000, 0)
    cpu.mem_write(record, records[91][:39]); call(0x485b00, trigger, record)
    write(trigger + 0x72, 'H', read(source + 0x24, 'H'))
    # Startup's 004edf50 conversion of linked source to inert state, executed.
    write(0x890378, 'I', trigger); write(0x890384, 'I', trigger + 0xb3)
    stage = 'startup linked source conversion'
    call(0x4edf50)
    result['sourceAfterStartupConversion'] = state(source)
    stage = 'forced trigger completion with actual clone allocation'
    write(trigger + 0x2e, 'B', 1); write(trigger + 0x6d, 'B', read(trigger + 0x6d, 'B') | 2)
    call(0x4fb270, trigger)
    allocations = [e[3] for e in events if e[0] == stage and e[1:3] == ['entered', '0x4facf0']]
    assert len(allocations) == 1, allocations
    gift = allocations[0]
    result['giftAfterCompletion'] = state(gift)
    assert read(gift + 0x7a, 'h') == 82
    assert read(gift + 0x7f, 'B') == 6
    assert read(gift + 0x33, 'H') == 1079
    stage = 'six gift visits and building handoff'
    write(0x88f026, '4h', 100, 0, 540, 480); write(0x89c6cf, 'HH', 640, 480)
    trace = []
    for i in range(6):
        write(gift + 0x35, 'H', read(gift + 0x35, 'H') | 1)
        write(gift + 0x68, '2h', 420, 180)
        call(0x4ed700, gift); trace.append(state(gift))
    result['giftVisits'] = trace
    result['controller'] = {'active': read(controller + 14, 'B'),
        'geometry': read(controller + 0x43, 'H'), 'faceCount': read(controller + 0xe59, 'h'),
        'buildingHandle': read(controller + 0xe63, 'H'),
        'companionHandle': read(companion + 0x5b, 'H'),
        'target': list(struct.unpack('<2h', cpu.mem_read(controller + 0xe5b, 4)))}
    assert result['controller']['geometry'] == 95 and result['controller']['active'] == 1
    # 004819c0 saves the gift in its own block, but 00481490 subsequently clears
    # the companion handle that 00483f56 reads. Do not repair that native ordering.
    assert result['controller']['buildingHandle'] == read(gift + 0x24, 'H')
    assert result['controller']['companionHandle'] == 0
    stage = 'actual scheduler to geometry consumer boundary'
    ui_rows = []
    for i in range(220):
        call(0x480ea0, 0)
        ui_rows.append([i + 1, read(controller + 14, 'B'), read(controller + 15, 'h'),
                        read(controller + 4), read(gift + 0x7a, 'h'), read(companion + 0x5b, 'H')])
        if not read(controller + 14, 'B'): break
    assert any(e[1] == 'geometry-dispatch' and e[3] == 95 for e in events)
    result['uiVisitsWithGeometryAndCompanionLeaves'] = ui_rows
    assert not read(controller + 14, 'B'), 'bounded controller did not retire'
    assert read(gift + 0x7a, 'h') == 76
    stage = 'remaining object countdown and native knowledge grant'
    result['knowledgeMaskBeforePayout'] = read(0x96070e)
    remaining = []
    for i in range(76):
        call(0x4ed700, gift)
        remaining.append([i + 7, read(gift + 0x7a, 'h'), read(0x96070e), bool(read(gift + 0xc) & 1)])
    result['payoutVisits'] = remaining
    assert not remaining[-2][3] and remaining[-1][3]
    assert read(0x96070e) & (1 << 5)
    browser_units = json.loads((ROOT / 'app/original-units.json').read_text())
    result['browserDirectFrameIndices'] = {str(i): browser_units['frames'][i] for i in (1077, 1079, 1417)}
    result['sourceSha256'] = {path: hashlib.sha256((ROOT / path).read_bytes()).hexdigest() for path in (
        'scripts/decomp.py', 'app/original-units.json', 'app/vault-appearance.ts',
        'app/world-effects.ts', 'app/world-turn.ts', 'app/scene-effects.ts', 'app/scene-entities.ts',
        'app/world-initialization.ts')}
    result['status'] = 'passed'
except Exception as error:
    result['status'] = 'failed'; result['error'] = repr(error)
    raise
finally:
    result['events'], result['calls'] = events, calls
    result['probeSha256'] = hashlib.sha256(Path(__file__).read_bytes()).hexdigest()
    result['seconds'] = time.monotonic() - started
    args.output.mkdir(parents=True, exist_ok=True)
    (args.output / 'probe-result.json').write_text(json.dumps(result, indent=2) + '\n')
print('PASS: authored startup marker, native clone/body, class-2 handoff and Temple geometry dispatch')
