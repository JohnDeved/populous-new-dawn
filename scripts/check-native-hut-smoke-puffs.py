"""Bounded original-byte proof of hut full-root child puffs and allocation phase.

Usage: python -B scripts/check-native-hut-smoke-puffs.py /path/to/d3dpoptb.exe
Executes 0050c260, both original allocators, allocation pressure gates, the smoke
initializer, and only 004ec924..004ec942's secondary-list traversal. The rest of
main_loop_inner never executes. Class initialization is routed to 0050c150 only
for smoke cases; list/class transition, animation and final removal leaves are
intercepted. No browser helper equivalence, full-game or raster claim is made.
No fixture, asset or tracked-output recording is supported.
"""
import json
import struct
import sys
from pathlib import Path

from decomp import native_cpu
from unicorn import UC_HOOK_CODE
from unicorn.x86_const import UC_X86_REG_EAX, UC_X86_REG_EIP, UC_X86_REG_ESP

cpu, identity = native_cpu(Path(sys.argv[1]))
cpu.mem_map(0x2000000, 0x10000)
ROOT, CHILD, PRIMARY, POINT = 0x2000000, 0x2000100, 0x2000200, 0x2000300
STACK, STOP = 0x200d000, 0x200e000
PHASE, COSMETIC, GAMEPLAY = 0x96eac8, 0x89bc72, 0x89d178
FREE_SECONDARY, SECONDARY_HEAD, SECONDARY_COUNT = 0x89032c, 0x890330, 0x89c655
initialize_smoke = True
removed, visits, animations = [], [], []


def write(address, fmt, *values):
    cpu.mem_write(address, struct.pack('<' + fmt, *values))


def read(address, fmt):
    return struct.unpack('<' + fmt, cpu.mem_read(address, struct.calcsize('<' + fmt)))[0]


def return_leaf():
    sp = cpu.reg_read(UC_X86_REG_ESP)
    cpu.reg_write(UC_X86_REG_EIP, read(sp, 'I'))
    cpu.reg_write(UC_X86_REG_ESP, sp + 4)


def intercept(_, address, size, user):
    sp = cpu.reg_read(UC_X86_REG_ESP)
    pointer = read(sp + 4, 'I')
    if address == 0x4ed580 and initialize_smoke:
        assert read(pointer + 0x2b, 'B') in (74, 75)
        cpu.reg_write(UC_X86_REG_EIP, 0x50c150)
        return
    if address == 0x4ed700:
        visits.append((pointer, read(pointer + 0x2e, 'B')))
        # Use the actual smoke processor; the outer dispatcher has no phase owner.
        cpu.reg_write(UC_X86_REG_EIP, 0x50c260)
        return
    if address == 0x4ee700:
        animations.append((read(sp + 8, 'I'), read(sp + 12, 'I')))
    if address == 0x4ee580:
        cpu.mem_write(pointer + 0x3d, bytes(cpu.mem_read(read(sp + 8, 'I'), 6)))
    if address == 0x4ef180:
        removed.append(pointer)
    return_leaf()


for address in (0x4ed580, 0x4ed6f0, 0x4ed640, 0x4ee700, 0x4ee580, 0x4ef180, 0x4ed700):
    cpu.hook_add(UC_HOOK_CODE, intercept, begin=address, end=address)


def call(address, *args):
    write(STACK, 'I' * (len(args) + 1), STOP, *args)
    cpu.reg_write(UC_X86_REG_ESP, STACK)
    cpu.emu_start(address, STOP, count=10000)
    assert cpu.reg_read(UC_X86_REG_EIP) == STOP, hex(address)
    return cpu.reg_read(UC_X86_REG_EAX)


def reset(phase=37, cosmetic=123, allocated=1):
    cpu.mem_write(ROOT, bytes(0x400))
    for address in (0x89031c, 0x890320, 0x890324, FREE_SECONDARY, SECONDARY_HEAD,
                    0x89c651, 0x89c659, SECONDARY_COUNT):
        write(address, 'I', 0)
    write(0x89243a, 'B', 0)
    write(0x89ce37, 'B', 0)
    write(PHASE, 'B', phase)
    write(COSMETIC, 'I', cosmetic)
    write(GAMEPLAY, 'I', 0xaabbccdd)
    write(ROOT + 0x24, 'H', 1600)
    write(ROOT + 0x2a, 'BBBBBB', 7, 74, 61, 0, 0, 2)
    write(ROOT + 0x3d, 'HHh', 8192, 12288, 400)
    write(ROOT + 0x6c, 'h', -1)
    write(CHILD + 0x24, 'H', 1601)
    write(PRIMARY + 0x24, 'H', 640)
    write(POINT, 'HHh', 8192, 12288, 400)
    write(FREE_SECONDARY, 'I', CHILD)
    write(SECONDARY_HEAD, 'I', ROOT)
    write(SECONDARY_COUNT, 'I', allocated)
    removed.clear()
    visits.clear()
    animations.clear()


def seed_for_output(output):
    before_rotate = ((output << 13) | (output >> 19)) & 0xffffffff
    return ((before_rotate - 0x24df) * pow(0x24a1, -1, 1 << 32)) & 0xffffffff


# Native allocator precheck: model 74 reserves ten entries, model 75 twenty.
for model, limit in ((74, 150), (75, 140)):
    for count in range(166):
        write(SECONDARY_COUNT, 'I', count)
        assert bool(call(0x4edae0, 7, model) & 255) == (count <= limit)

# Main allocator increments class-7's seed; secondary allocator only copies it.
assert read(0x5a6830 + 7 * 3 + 1, 'B') == 0x28
initialize_smoke = False
for phase in range(256):
    reset(phase)
    write(0x89031c, 'I', PRIMARY)
    assert call(0x4ed8a0, 7, 3, 2, POINT) == PRIMARY
    assert read(PRIMARY + 0x2e, 'B') == phase
    assert read(PHASE, 'B') == (phase + 1) & 255
    assert call(0x4edbd0, 7, 74, 2, POINT) == CHILD
    assert read(CHILD + 0x2e, 'B') == (phase + 1) & 255
    assert read(PHASE, 'B') == (phase + 1) & 255
initialize_smoke = True

# Exhaust every byte phase and low-five-bit cosmetic RNG outcome.
for counter in range(256):
    for low in range(32):
        output = 0x12345600 | low
        seed = seed_for_output(output)
        reset(cosmetic=seed)
        write(ROOT + 0x2e, 'B', counter)
        call(0x50c260, ROOT)
        eligible = not (counter & 7)
        spawned = eligible and low < 2
        assert read(COSMETIC, 'I') == (output if eligible else seed)
        assert read(GAMEPLAY, 'I') == 0xaabbccdd
        assert read(PHASE, 'B') == 37
        assert (read(SECONDARY_HEAD, 'I') == CHILD) == spawned
        assert read(ROOT + 0x6c, 'h') == -1
        if spawned:
            assert read(CHILD + 0x2a, 'B') == 7
            assert read(CHILD + 0x2b, 'B') == 75
            assert read(CHILD + 0x2d, 'B') == 1
            assert read(CHILD + 0x2e, 'B') == 37
            assert read(CHILD + 0x2f, 'B') == 2
            assert bytes(cpu.mem_read(CHILD + 0x3d, 6)) == bytes(cpu.mem_read(ROOT + 0x3d, 6))
            assert read(CHILD + 0x6c, 'h') == 16
            assert animations == [(40, 1385)]
        else:
            assert not animations

# RNG has already advanced when capacity rejects or the secondary pool is empty.
for count, free in ((140, True), (141, True), (1, False)):
    output = 0x12345600
    reset(cosmetic=seed_for_output(output), allocated=count)
    if not free:
        write(FREE_SECONDARY, 'I', 0)
    call(0x50c260, ROOT)
    assert read(COSMETIC, 'I') == output
    assert (read(SECONDARY_HEAD, 'I') == CHILD) == (count <= 140 and free)

# Real secondary-list loop increments before processing and caches next first.
reset(phase=19, cosmetic=seed_for_output(0x12345600))
write(ROOT + 0x2e, 'B', 7)
cpu.reg_write(UC_X86_REG_ESP, STACK)
cpu.emu_start(0x4ec924, 0x4ec942, count=10000)
assert cpu.reg_read(UC_X86_REG_EIP) == 0x4ec942
assert visits == [(ROOT, 8)]
assert read(SECONDARY_HEAD, 'I') == CHILD
assert read(CHILD + 4, 'I') == ROOT
assert read(CHILD + 0x2e, 'B') == 19 and read(CHILD + 0x6c, 'h') == 16
visits.clear()
cpu.emu_start(0x4ec924, 0x4ec942, count=10000)
assert cpu.reg_read(UC_X86_REG_EIP) == 0x4ec942
assert visits == [(CHILD, 20), (ROOT, 9)]
assert read(CHILD + 0x6c, 'h') == 15

# Children die on their 16th processor visit and never use partial-root restart RNG.
for hidden in (False, True):
    reset()
    write(CHILD + 0x2a, 'BBBBBB', 7, 75, 61, 1, 254, 2)
    write(CHILD + 0x35, 'H', 0x10 if hidden else 0)
    write(CHILD + 0x6c, 'h', 16)
    for visit in range(1, 17):
        call(0x50c260, CHILD)
        assert read(CHILD + 0x6c, 'h') == 16 - visit
        assert removed == ([CHILD] if visit == 16 else [])
        assert read(COSMETIC, 'I') == 123

# A root copied from seed s has its first eligible visit at 8 - (s & 7).
first_visits = []
for phase in range(8):
    reset(phase=phase, cosmetic=seed_for_output(0x12345600))
    write(ROOT + 0x2e, 'B', phase)
    first = None
    for visit in range(1, 9):
        write(ROOT + 0x2e, 'B', (phase + visit) & 255)
        call(0x50c260, ROOT)
        if read(SECONDARY_HEAD, 'I') == CHILD:
            first = visit
            break
    assert first == 8 - phase
    first_visits.append(first)

print(json.dumps({
    'status': 'passed', 'executableSha256': identity['sha256'],
    'producerCases': 256 * 32, 'allocatorSeeds': 256,
    'capacityCases': 2 * 166, 'firstEligibleVisits': first_visits,
    'childLifetimeVisits': 16,
    'claims': [
        'full-root RNG only on counter&7==0; only low5 outcomes 0/1 allocate',
        'cosmetic RNG advances before capacity/pool failure; gameplay RNG unchanged',
        'primary class7 allocation advances seed; secondary roots/children preserve it',
        'secondary traversal increments before processing and defers newly prepended children',
        'child initialization uses draw40/HFX1385; expiry frees rather than restarts',
    ],
    'limits': 'Supplied unit pools/position; intercepted class/list/animation/removal leaves. '
              'No whole-game scheduling, actual terrain, browser or raster equivalence.',
}, indent=2))
