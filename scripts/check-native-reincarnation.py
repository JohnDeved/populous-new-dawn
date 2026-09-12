"""Compare stone positions from normal site creation and headings from stone init.

Usage: python scripts/check-native-reincarnation.py /path/to/d3dpoptb.exe
Runs native 0x433a10 state 3 and 0x4a7d80. Allocation, object registration,
shadow submission and the separate rise effect are intercepted; coordinate,
ground-height and angle code execute unmodified. The model-12 lifecycle executes
at 0x5029d0 with allocation, sound and deletion consumers supplied.
"""
import json
import random
import struct
import subprocess
import sys
from pathlib import Path

from unicorn import UC_HOOK_CODE
from unicorn.x86_const import UC_X86_REG_EAX, UC_X86_REG_EIP, UC_X86_REG_ESP
from decomp import ROOT, native_cpu

cpu, _ = native_cpu(Path(sys.argv[1]))
cpu.mem_map(0x2000000, 0x10000)
stack, stop, person, order, stone = 0x200d000, 0x200e000, 0x2001000, 0x2002000, 0x2003000
allocations = []
lifecycle = None
events = []
fake = 0x2005000


def write(address, fmt, *values):
    cpu.mem_write(address, struct.pack('<' + fmt, *values))


def read(address, fmt):
    return struct.unpack('<' + fmt, cpu.mem_read(address, struct.calcsize('<' + fmt)))


def intercept(cpu, address, size, user):
    global events
    sp = cpu.reg_read(UC_X86_REG_ESP)
    result = 0
    if address == 0x4ed8a0:
        unit_class, model, owner, position = read(sp + 4, '4I')
        if lifecycle is None:
            assert (unit_class, model) == (8, 1)
            allocations.append(read(position, 'HHh'))
        elif model == 65:
            events.append('splash')
        elif model == 8 and lifecycle['canSpawn']:
            cpu.mem_write(fake, bytes(256))
            result = fake
    elif address == 0x4ee700:
        draw, object_ = read(sp + 8, '2I')
        events.append(('frame', draw & 0xffff, object_ & 0xffff))
    elif address == 0x44e940:
        result = lifecycle['ground'] & 0xffff
    elif address == 0x44f980:
        result = 0 if lifecycle['effect65'] else 1
    elif address == 0x4eeff0:
        result = 1 if lifecycle['unsupported'] else 0
    elif address == 0x50c830:
        events.append('rise')
    elif address == 0x4da0f0:
        if lifecycle['canSpawn']:
            cpu.mem_write(fake, bytes(256))
            write(fake + 0x2b, 'BB', 7, 0)
            events.append('spawn')
            result = fake
    elif address == 0x4edcf0:
        events.append('delete')
    cpu.reg_write(UC_X86_REG_EAX, result)
    cpu.reg_write(UC_X86_REG_EIP, read(sp, 'I')[0])
    cpu.reg_write(UC_X86_REG_ESP, sp + 4)


for address in (0x4ed8a0, 0x4ed6f0, 0x4ed640, 0x4ee470, 0x4a66c0, 0x403c10,
                0x4a7eb0):
    cpu.hook_add(UC_HOOK_CODE, intercept, begin=address, end=address)


def call(address, *args):
    write(stack, 'I' * (len(args) + 1), stop, *args)
    cpu.reg_write(UC_X86_REG_ESP, stack)
    cpu.emu_start(address, stop, count=10000)
    assert cpu.reg_read(UC_X86_REG_EIP) == stop


heights = [(i * 37 + (i >> 7) * 19) % 1024 for i in range(16384)]
flags = [(i ^ (i >> 7)) & 1 for i in range(16384)]
for i, (height, flag) in enumerate(zip(heights, flags)):
    write(0x8a03e4 + i * 16, 'Ih', flag, height)

rng = random.Random(0x433a10)
centers = [(x, y) for x in (0, 255, 256, 511, 32767, 32768, 65535)
           for y in (0, 256, 511, 32768, 65535)]
centers += [(4352, 55040)]  # First-mission blue shaman/site.
centers += [(rng.randrange(65536), rng.randrange(65536)) for _ in range(220)]
expected = []
for case, (x, y) in enumerate(centers):
    owner = case % 4
    tribe = 0x89d1c8 + owner * 0xc65
    write(tribe + 0x911, 'HHh', x, y, 0)
    results = []
    for index in range(8):
        cpu.mem_write(person, bytes(256))
        write(person + 0x2d, 'BBB', 3, 0, owner)
        write(person + 0x3d, 'HHh', x, y, 0)
        write(person + 0x70, 'h', index + 1)
        allocations.clear()
        call(0x433a10, person, order)
        assert len(allocations) == 1
        px, py, height = allocations[0]
        assert read(person + 0x70, 'h')[0] == index
        cpu.mem_write(stone, bytes(256))
        write(stone + 0x2b, 'B', 12)
        write(stone + 0x2f, 'B', owner)
        write(stone + 0x3d, 'HHh', px, py, height)
        call(0x4a7d80, stone)
        assert read(stone + 0x3d, 'HHh') == (px, py, height)
        results.append(dict(x=px, y=py, h=height, heading=read(stone + 0x26, 'H')[0]))
    expected.append(results)

script = """
import { reincarnationStones } from './app/reincarnation.ts';
let input = '';
for await (const chunk of process.stdin) input += chunk;
const { heights, flags, centers } = JSON.parse(input);
const land = { heights: Int16Array.from(heights), flags: Uint32Array.from(flags) };
console.log(JSON.stringify(centers.map(([x, y]) => reincarnationStones(land, { x, y }))));
"""
payload = json.dumps(dict(heights=heights, flags=flags, centers=centers)).encode()
actual = json.loads(subprocess.check_output(
    ['node', '--input-type=module', '-e', script], input=payload, cwd=ROOT
))
for i, (result, native) in enumerate(zip(actual, expected)):
    assert result == native, (centers[i], result, native)
assert len(actual) == len(expected)
print(f'PASS: {len(centers) * 8} stones from native site creation and initialization; '
      'all eight positions, four tribes, wrapped coordinates, cell snapping, '
      'both terrain diagonals, exact heights and headings')
for address in (0x4ee700, 0x44e940, 0x44f980, 0x4eeff0, 0x50c830, 0x4da0f0,
                0x4edcf0, 0x48a050):
    cpu.hook_add(UC_HOOK_CODE, intercept, begin=address, end=address)


source, link = 0x2006000, 0x2007000
for unsupported in (False, True):
    lifecycle = dict(canSpawn=True, effect65=unsupported, unsupported=unsupported, ground=240)
    events = []
    cpu.mem_write(person, bytes(256))
    cpu.mem_write(source, bytes(256))
    cpu.mem_write(link, bytes(20))
    write(person + 0xc, 'I', 0x400)
    write(person + 0x2f, 'B', 1)
    write(person + 0x3d, 'HHh', 4352, 55040, 240)
    write(source + 0x26, 'H', 731)
    write(source + 0x2b, 'B', 7)
    write(source + 0x2f, 'B', 1)
    write(source + 0x78, 'B', 3)
    write(link, 'I', source)
    write(0x892443, 'I', link + 20)
    call(0x502910, person)
    assert read(0x892443, 'I')[0] == link
    assert read(person + 0x2c, 'BBBB') == (12, 3 if unsupported else 0, 0, 1), (
        unsupported, read(person + 0x2c, 'BBBB'))
    assert read(person + 0x26, 'H')[0] == 731
    assert read(person + 0x68, 'I')[0] == 1
    assert read(person + 0x74, 'BBBB') == (7, 7, 0, 3)
    assert read(person + 0xc, 'I')[0] == 0x40000000
    assert read(person + 0x3d, 'HHh') == (4352, 55040, 240)
    assert 'delete' not in events
print('PASS: 2 native reincarnation initializations; linked shaman model/tribe/heading, '
      'position, particle count, entry flag and land/drowning phase')

for model in (2, 3, 4):
    lifecycle = dict(canSpawn=True, effect65=False, unsupported=False, ground=240)
    events = []
    cpu.mem_write(person, bytes(256))
    cpu.mem_write(source, bytes(256))
    cpu.mem_write(link, bytes(20))
    write(person + 0xc, 'I', 0x400)
    write(person + 0x2f, 'B', 1)
    write(person + 0x3d, 'HHh', 4352, 55040, 240)
    write(source + 0x26, 'H', 731)
    write(source + 0x2b, 'B', model)
    write(source + 0x2f, 'B', 1)
    write(source + 0x78, 'B', 3)
    write(link, 'I', source)
    write(0x892443, 'I', link + 20)
    call(0x502910, person)
    assert read(person + 0x2c, 'BBBB') == (12, 0, 0, 1), (model, read(person + 0x2c, 'BBBB'))
    assert read(person + 0x26, 'H')[0] == 731
    assert read(person + 0x68, 'I')[0] == 0
    assert read(person + 0x74, 'BBBB') == (model, 1, 0, 3)
    assert read(person + 0xc, 'I')[0] == 0x40000000
    assert read(person + 0x3d, 'HHh') == (4352, 55040, 240)
print('PASS: 3 native ordinary-corpse initializations; brave/warrior/preacher identity, '
      'heading, position, entry flag and land phase')


def prepare_lifecycle(remaining, can_spawn=True, effect65=True, model=7):
    global lifecycle, events
    lifecycle = dict(canSpawn=can_spawn, effect65=effect65, unsupported=False, ground=240)
    events = []
    cpu.mem_write(person, bytes(256))
    phase = (0 if remaining > 464 else 1 if remaining > 336 else 2 if remaining > 333
             else 3 if remaining > 301 else 4 if remaining > 1 else 5 if remaining else 6)
    entry = remaining in (468, 464, 336, 333, 301, 1)
    timer = (remaining - 464 if phase == 0 else remaining - 336 if phase == 1
             else remaining - 333 if phase == 2 else remaining - 301 if phase == 3
             else remaining - 1 if phase == 4 else 0)
    risen = min(1280, (333 - remaining) * 40) if remaining <= 333 else 0
    write(person + 0x2d, 'B', phase)
    write(person + 0x2f, 'B', 0)
    write(person + 0x3d, 'HHh', 4352, 55040, lifecycle['ground'] + risen)
    write(person + 0x68, 'I', 0)
    write(person + 0x6e, 'h', timer)
    write(person + 0x74, 'BB', model, 7 if model == 7 else 1)
    write(person + 0xc, 'I', 0x40000000 if entry else 0)
    tribe = 0x89d1c8
    cpu.mem_write(tribe, bytes(0xc65))
    write(tribe + 0x89d, 'I', 0)
    write(tribe + 0x91d, 'I', 1)
    write(tribe + 0x911, 'HHh', 4352, 55040, 240)
    return phase


def remaining_after_call():
    if 'delete' in events:
        return 0
    phase = read(person + 0x2d, 'B')[0]
    timer = read(person + 0x6e, 'h')[0]
    entry = bool(read(person + 0xc, 'I')[0] & 0x40000000)
    if phase == 1 and entry:
        return 464
    if phase == 2 and entry:
        return 336
    if phase == 3 and entry:
        return 333
    if phase == 4 and entry:
        return 301
    return {0: timer + 464, 1: timer + 336, 2: timer + 333,
            3: timer + 301, 4: timer + 1, 5: 1}.get(phase, 0)


write(0x59df44, 'I', 0x2008000)
cpu.mem_write(0x2008000, bytes(0x4000))
cases, expected = [], []
for remaining in range(468, 0, -1):
    phase = prepare_lifecycle(remaining)
    call(0x5029d0, person)
    event = next((name for name in ('splash', 'rise', 'spawn') if name in events), None)
    cases.append(dict(remaining=remaining, canSpawn=True, effect65=True))
    expected.append(dict(remaining=remaining_after_call(), phase=phase,
                         height=read(person + 0x41, 'h')[0] - lifecycle['ground'], event=event))
for remaining in (6, 1):
    phase = prepare_lifecycle(remaining, False, False)
    call(0x5029d0, person)
    cases.append(dict(remaining=remaining, canSpawn=False, effect65=False))
    expected.append(dict(remaining=remaining_after_call(), phase=phase,
                         height=read(person + 0x41, 'h')[0] - lifecycle['ground'], event=None))
for remaining in range(468, 0, -1):
    phase = prepare_lifecycle(remaining, True, False, 2)
    call(0x5029d0, person)
    cases.append(dict(remaining=remaining, canSpawn=True, effect65=False, ordinary=True))
    expected.append(dict(remaining=remaining_after_call(), phase=phase,
                         height=read(person + 0x41, 'h')[0] - lifecycle['ground']))

script = """
import { stepReincarnation } from './app/reincarnation.ts';
let input = '';
for await (const chunk of process.stdin) input += chunk;
console.log(JSON.stringify(JSON.parse(input).map(c => {
  const result = stepReincarnation(c.remaining, c.canSpawn, c.effect65);
  if (c.ordinary) delete result.event;
  return result;
})));
"""
actual = json.loads(subprocess.check_output(
    ['node', '--input-type=module', '-e', script], input=json.dumps(cases).encode(), cwd=ROOT
))
for i, (result, native) in enumerate(zip(actual, expected)):
    assert result == native, (cases[i], result, native)
for remaining, frame in ((468, 680), (464, 352), (336, 360), (333, 360)):
    prepare_lifecycle(remaining)
    call(0x5029d0, person)
    assert ('frame', 14, frame) in events, (remaining, events)
for model in (2, 3, 4):
    for remaining, frame in ((468, 304), (464, 312), (336, 320), (333, 320)):
        prepare_lifecycle(remaining, True, False, model)
        call(0x5029d0, person)
        assert ('frame', model + 12, frame) in events, (model, remaining, events)
print(f'PASS: {len(cases)} native model-12 lifecycle visits; exact phase timers, rise, '
      'shaman events/retry, ordinary deletion, and original shaman/follower frames')
