"""Bounded original-byte research for ordinary spell reward UI handoff.

Usage: python scripts/probe-native-worship-grant-handoff.py EXE --output DIRECTORY
No fixture, imported asset, browser, original OS, or gameplay source is changed.
Output preserves every native state row; this is not a browser parity checker.
"""
import argparse
import hashlib
import json
import struct
import time
from pathlib import Path

from unicorn import UC_HOOK_CODE
from unicorn.x86_const import UC_X86_REG_EAX, UC_X86_REG_EIP, UC_X86_REG_ESP
from decomp import ROOT, configure_native_constants, native_cpu

parser = argparse.ArgumentParser(description=__doc__)
parser.add_argument('executable', type=Path)
parser.add_argument('--output', type=Path, required=True)
args = parser.parse_args()
started = time.monotonic()
cpu, identity = native_cpu(args.executable)
configure_native_constants(cpu, args.executable)
cpu.mem_map(0x2000000, 0x100000)
unit, glow, rect, entries = 0x2000000, 0x2000100, 0x2000200, 0x2010000
stack, stop, controller = 0x20fd000, 0x20fe000, 0x98c5a8
events, cases, calls = [], [], []
glow_failure = False
current_case = 'panel construction'


def write(address, fmt, *values):
    cpu.mem_write(address, struct.pack('<' + fmt, *values))


def read(address, fmt):
    return struct.unpack('<' + fmt, cpu.mem_read(address, struct.calcsize('<' + fmt)))[0]


def ret(value=0, popped=0):
    sp = cpu.reg_read(UC_X86_REG_ESP)
    cpu.reg_write(UC_X86_REG_EAX, value)
    cpu.reg_write(UC_X86_REG_EIP, read(sp, 'I'))
    cpu.reg_write(UC_X86_REG_ESP, sp + 4 + popped)


constant_bytes = []
constants = json.loads((ROOT / 'app/original-constants.json').read_text())
for index in range(512):
    descriptor = bytes(cpu.mem_read(0x5aa5f0 + index * 31, 31))
    name = descriptor[:25].split(b'\0')[0].decode('ascii')
    if not name:
        break
    if name in constants:
        address = struct.unpack('<I', descriptor[27:])[0]
        constant_bytes.append((address, bytes(cpu.mem_read(address, descriptor[25]))))

search = (args.executable.parent / 'data/mwsearch.dat').read_bytes()
assert hashlib.sha256(search).hexdigest() == '0c39b12d160658863c2df89aa34484dff459e48ea0b5634658b7473ca940fae0'
cpu.mem_write(0x8929cd, search)
pe_bytes = args.executable.read_bytes()
pe_offset = struct.unpack_from('<I', pe_bytes, 60)[0]
section_count = struct.unpack_from('<H', pe_bytes, pe_offset + 6)[0]
optional_size = struct.unpack_from('<H', pe_bytes, pe_offset + 20)[0]
readonly_bytes = []
for index in range(section_count):
    entry = pe_offset + 24 + optional_size + index * 40
    name, virtual_size, virtual_address, raw_size = struct.unpack_from('<8sIII', pe_bytes, entry)
    flags = struct.unpack_from('<I', pe_bytes, entry + 36)[0]
    if flags & 0x40000000 and not flags & 0x80000000:
        address, length = 0x400000 + virtual_address, max(virtual_size, raw_size)
        readonly_bytes.append((address, bytes(cpu.mem_read(address, length))))


def guard():
    assert bytes(cpu.mem_read(0x8929cd, len(search))) == search, 'mapped search changed'
    for address, expected in readonly_bytes:
        assert bytes(cpu.mem_read(address, len(expected))) == expected, ('read-only PE section', hex(address))
    for address, expected in constant_bytes:
        assert bytes(cpu.mem_read(address, len(expected))) == expected, hex(address)


def call(address, *values):
    guard()
    write(stack, 'I' * (len(values) + 1), stop, *values)
    cpu.reg_write(UC_X86_REG_ESP, stack)
    try:
        cpu.emu_start(address, stop, timeout=100000, count=200000)
    except Exception as error:
        raise AssertionError((current_case, hex(address), hex(cpu.reg_read(UC_X86_REG_EIP)), events[-12:])) from error
    assert cpu.reg_read(UC_X86_REG_EIP) == stop, (current_case, hex(address), hex(cpu.reg_read(UC_X86_REG_EIP)))
    guard()
    return cpu.reg_read(UC_X86_REG_EAX)


def hook(c, address, size, user):
    sp = c.reg_read(UC_X86_REG_ESP)
    arg = read(sp + 4, 'I')
    if address in (0x481550, 0x4841b0, 0x481490, 0x481900, 0x484320):
        events.append(['entered', f'{address:08x}'])
        return
    if address == 0x4ed8a0:
        values = list(struct.unpack('<4I', c.mem_read(sp + 4, 16)))
        assert values[:3] == [6, 8, 255], values
        events.append(['allocate-glow', not glow_failure])
        if glow_failure:
            ret(0)
            return
        c.mem_write(glow, bytes(256))
        write(glow + 0x24, 'H', 901)
        write(glow + 0x2a, 'BBB', 6, 8, 255)
        c.mem_write(glow + 0x3d, bytes(c.mem_read(values[3], 6)))
        write(0x890390 + 901 * 4, 'I', glow)
        ret(glow)
        return
    if address in (0x4edcf0, 0x4ef180):
        events.append(['remove', 'gift' if arg == unit else 'glow'])
        write(arg + 0x2a, 'B', 0)
    elif address == 0x48a050:
        events.append(['sound', read(sp + 8, 'I')])
    elif address == 0x44b770:
        # Supplied landscape bounds, same as the viewport fixture. Exact fallback
        # choice/midpoint arithmetic still execute in 00481900.
        for index, value in enumerate((100, 0, 640, 480)):
            write(read(sp + 4 + index * 4, 'I'), 'i', value)
    elif address == 0x44b130:
        events.append(['panel-refresh', read(0x5cae8c, 'I')])
    elif address == 0x479f00:
        events.append(['display-request', *struct.unpack('<3I', c.mem_read(sp + 4, 12))])
    elif address == 0x484870:
        events.append(['spell-raster', read(arg + 0x80, 'B'), read(arg + 0x61, 'h'),
                       read(arg + 0x63, 'h'), read(arg + 0x6f, 'h'), read(arg + 0x73, 'h')])
    elif address == 0x482290:
        events.append(['companion-ui', arg])
    elif address == 0x5162e0:
        events.append(['pulse-raster', (read(sp + 12, 'I') - entries) // 8])
    elif address == 0x4811a0:
        events.append(['arrival-ui', read(sp + 4, 'i'), read(sp + 8, 'i')])
    ret()


leaves = [0x4ed8a0, 0x4edcf0, 0x4ef180, 0x4010b0, 0x48a050, 0x48a810,
          0x44b770, 0x44b130, 0x479f00, 0x484870, 0x482290, 0x5162e0,
          0x516270, 0x49cf90, 0x49cfa0, 0x4811a0]
observed_entries = [0x481550, 0x4841b0, 0x481490, 0x481900, 0x484320]
for address in leaves + observed_entries:
    cpu.hook_add(UC_HOOK_CODE, hook, begin=address, end=address)

raw_hfx = (args.executable.parent / 'data/hfx0-0.dat').read_bytes()
assert hashlib.sha256(raw_hfx).hexdigest() == json.loads((ROOT / 'app/original-hud.json').read_text())['sha256']['data/hfx0-0.dat']
for index in range(struct.unpack_from('<I', raw_hfx, 4)[0]):
    width, height, pointer = struct.unpack_from('<HHI', raw_hfx, 8 + index * 8)
    write(entries + index * 8, 'IHH', pointer, width, height)
write(0x59df14, 'I', entries)

# Construct a real spell panel from the original executable descriptors. Its
# root occupies the native spell slot, after the already occupied main panel.
cpu.mem_write(0x684210, bytes(0x9000))
write(0x684210, 'I', 1)
write(0x68425e + 0x3e + 0x2e, 'I', 1)
write(0x89c6cf, 'HH', 640, 480)
write(0x68450c, 'ii', 300, 300)
write(0x89c6f0, 'B', 0)
write(0x89d1c8 + 0xc22, 'B', 0)
write(0x96070a, 'I', (1 << 3) | (1 << 4) | (1 << 12))
write(0x5d4678, 'I', 1)
root_slot = call(0x44c650, 2) & 65535
assert root_slot == 2, root_slot
panel_rects = {}
for model in (3, 4, 12):
    result = call(0x44be00, rect, model)
    assert result == rect
    values = list(struct.unpack('<4i', cpu.mem_read(rect, 16)))
    assert values[2] > values[0] and values[3] > values[1], (model, values)
    panel_rects[model] = values


def snapshot():
    return dict(remaining=read(unit + 0x7a, 'h'), phase=read(unit + 0x7f, 'B'),
                bodyHidden=bool(read(unit + 0x35, 'B') & 16),
                active=read(controller + 0xe, 'B'), step=read(controller + 0xf, 'h'),
                stepVisits=read(controller + 4, 'I'), nextStep=read(controller + 0x13, 'B'),
                origin=list(struct.unpack('<2h', cpu.mem_read(controller, 4))),
                position=list(struct.unpack('<2h', cpu.mem_read(controller + 0x61, 4))),
                target=list(struct.unpack('<2h', cpu.mem_read(controller + 0x6b, 4))),
                speed=read(controller + 0x65, 'h'), angle=read(controller + 0x67, 'h'),
                rotation=read(controller + 0x6f, 'h'), rotationSpeed=read(controller + 0x71, 'h'),
                scale=read(controller + 0x73, 'h'), stock=read(0x96071e + read(unit + 0x74, 'I'), 'B'))


def setup(model=12, origin=(420, 180), visible=True, recipient=0, bit8=False, fail=False):
    global events, glow_failure
    events, glow_failure = [], fail
    cpu.mem_write(unit, bytes(512))
    cpu.mem_write(0x985b48, bytes(0x6ae1))
    cpu.mem_write(0x8a03e4, bytes(0x40000))
    write(0x890390 + 900 * 4, 'I', unit)
    write(0x890390 + 901 * 4, 'I', 0)
    write(0x89c661, 'I', 8 if bit8 else 0)
    write(0x89c6f0, 'B', 0)
    write(0x88f026, '4h', 100, 0, 540, 480)
    write(unit + 0x24, 'H', 900)
    write(unit + 0x2a, '3B', 6, 2, 255)
    write(unit + 0x3d, 'HHh', 768, 57088, 0)
    write(unit + 0x68, '2h', *origin)
    write(unit + 0x74, 'I', model)
    write(unit + 0x7a, 'h', 82)
    write(unit + 0x7c, 'B', 11)
    write(unit + 0x7e, '3B', recipient, 6, 3)
    write(0x96071e + model, 'B', 0)
    guard()
    # First visual processing would overwrite renderer-owned visible bit 1;
    # subsequent render supplies that bit before the phase-zero visit.
    rows = []
    for visit in range(1, 7):
        if visit == 6:
            flags = read(unit + 0x35, 'H')
            write(unit + 0x35, 'H', (flags | 1) if visible else (flags & ~1))
        call(0x4facf0, unit)
        rows.append(snapshot())
    return rows


def run_case(name, **options):
    global current_case
    current_case = name
    rows = setup(**options)
    handoff = snapshot()
    local = options.get('recipient', 0) == 0
    assert [row['phase'] for row in rows] == [5, 4, 3, 2, 1, 0]
    assert [row['remaining'] for row in rows] == [81, 80, 79, 78, 77, 76]
    assert all(row['stock'] == 0 for row in rows)
    assert handoff['active'] == int(local)
    if local:
        rectangle = panel_rects[options.get('model', 12)]
        assert handoff['target'] == [(rectangle[0]+rectangle[2])//2, (rectangle[1]+rectangle[3])//2]
        origin = list(options.get('origin', (420, 180)))
        if not options.get('visible', True) or not (100 < origin[0] < 640 and 0 < origin[1] < 480):
            origin = [370, 240]
        assert handoff['origin'] == origin
    before = len([e for e in events if e == ['entered', '00484320']])
    call(0x480ea0, 1)
    assert len([e for e in events if e == ['entered', '00484320']]) == before
    ui_rows = []
    for visit in range(1, 241):
        call(0x480ea0, 0)
        ui_rows.append(snapshot())
        if not read(controller + 0xe, 'B'):
            break
    assert not read(controller + 0xe, 'B'), (name, 'UI did not finish', ui_rows[-1])
    expect_clamp = local and not options.get('bit8', False)
    assert any(row['remaining'] == 1 for row in ui_rows) == expect_clamp
    assert all(row['stock'] == 0 for row in ui_rows), 'UI itself must not award stock'
    payout = None
    if expect_clamp:
        call(0x4facf0, unit)
        payout = snapshot()
        assert payout['remaining'] == 0 and payout['stock'] == 0x11 and read(unit + 0x2a, 'B') == 0
        assert events.count(['allocate-glow', not glow_failure]) == 1
    cases.append(dict(name=name, options=options, objectRows=rows, handoff=handoff,
                      uiRows=ui_rows, payout=payout, events=list(events)))
    return cases[-1]


status = 'failed'
try:
    for model in (3, 4, 12):
        run_case(f'model-{model}-visible', model=model)
    for name, origin, visible in [('offscreen-bit', (420, 180), False),
                                   ('outside-viewport', (50, 180), True),
                                   ('viewport-left-edge', (100, 180), True),
                                   ('viewport-right-edge', (640, 180), True)]:
        run_case(name, origin=origin, visible=visible)
    run_case('arrival-bit8', bit8=True)
    run_case('glow-allocation-failed', fail=True)
    for recipient in (1, 255):
        run_case(f'nonlocal-recipient-{recipient}', recipient=recipient)
    current_case = 'pause'
    setup()
    write(0x89c661, 'I', 2)
    before_pause = snapshot()
    call(0x480ea0, 0)
    paused = snapshot()
    assert paused == {**before_pause, 'step': 1, 'nextStep': 0}
    for _ in range(5):
        call(0x480ea0, 0)
        assert snapshot() == paused
    cases.append(dict(name='pause', before=before_pause, state=paused, events=list(events)))
    for kind in ('missing', 'removed', 'wrong-class', 'wrong-model', 'already-one'):
        current_case = f'handle-{kind}'
        setup()
        if kind == 'missing':
            write(controller + 0x69, 'H', 0)
        elif kind == 'removed':
            write(unit + 0xc, 'I', 1)
        elif kind == 'wrong-class':
            write(unit + 0x2a, 'B', 5)
        elif kind == 'wrong-model':
            write(unit + 0x2b, 'B', 8)
        else:
            write(unit + 0x7a, 'h', 1)
        original_timer = read(unit + 0x7a, 'h')
        rows = []
        for visit in range(1, 241):
            call(0x480ea0, 0)
            rows.append(snapshot())
            if not read(controller + 0xe, 'B'):
                break
        assert all(row['remaining'] == original_timer for row in rows), kind
        cases.append(dict(name=current_case, uiRows=rows, events=list(events)))
    status = 'passed'
    print('PASS: bounded handoff/controller matrix', len(cases), 'cases')
finally:
    args.output.mkdir(parents=True, exist_ok=True)
    receipt = dict(status=status, executable=identity, probeSha256=hashlib.sha256(Path(__file__).read_bytes()).hexdigest(),
                   elapsedSeconds=time.monotonic()-started, panelRects=panel_rects, cases=cases,
                   currentCase=current_case, constantsGuarded=len(constant_bytes),
                   readonlyRegions=[dict(address=f'{a:08x}', length=len(b), sha256=hashlib.sha256(b).hexdigest()) for a,b in readonly_bytes],
                   searchSha256=hashlib.sha256(search).hexdigest(),
                   intercepted=[f'{a:08x}' for a in leaves], observed=[f'{a:08x}' for a in observed_entries],
                   limits=['Original GUI objects are constructed, but main-panel slot occupancy is supplied.',
                           'Landscape bounds and rendered source coordinates are supplied inputs.',
                           'UI visits and reward-object visits are separate clocks; no natural elapsed cadence inferred.',
                           'Spell raster and companion effect processor are intercepted; no pixels or complete sequence claim.',
                           'No original OS execution, current browser execution, implementation, or parity credit.'])
    (args.output / 'probe-result.json').write_text(json.dumps(receipt, indent=2)+'\n')
    for case in cases:
        if 'handoff' in case:
            rows=case['uiRows']
            print(case['name'], 'origin', case['handoff']['origin'], 'target', case['handoff']['target'],
                  'UI visits', len(rows), 'first clamp', next((i+1 for i,r in enumerate(rows) if r['remaining']==1), None))
