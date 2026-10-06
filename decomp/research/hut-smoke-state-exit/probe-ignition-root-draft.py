"""Source-only DRAFT: one full-root ignition case; not executed or accepted.

Proposed command, only after packet review and execution authorization:
  python -B decomp/research/hut-smoke-state-exit/probe-ignition-root-draft.py EXE

Real ignition/class-2 initialization and secondary destruction/list operations.
Fire allocations deliberately fail at a supplied leaf; terrain and sunlight
leaves are supplied. No runtime/browser comparison or original fire-stream claim.
"""
import hashlib
import json
import struct
import sys
from pathlib import Path

REPO = Path(__file__).resolve().parents[3]
sys.path.insert(0, str(REPO / 'scripts'))
from decomp import load_native_shapes, native_cpu
from unicorn import UC_HOOK_CODE, UC_HOOK_MEM_WRITE
from unicorn.x86_const import UC_X86_REG_EAX, UC_X86_REG_EIP, UC_X86_REG_ESP

EXE = Path(sys.argv[1])
INPUTS = {
    'objects/objs0-2.dat': 'e1af6bdf050608d7c1832700826bece72ca592abdff3ee9c2138c50ed8a8607d',
    'objects/shapes.dat': 'ae1188129d84c266d91a1e9e75d960e99e80cdfd573f85d524742e970a0b2849',
}
for name, expected in INPUTS.items():
    assert hashlib.sha256((EXE.parent / name).read_bytes()).hexdigest() == expected, name
cpu, identity = native_cpu(EXE, tcg_buffer_size=64 * 1024 * 1024)
cpu.mem_map(0x2000000, 0x100000)
OBJECTS, SHAPES = 0x2000000, 0x2030000
BUILDING, POINT, CONTEXT = 0x2040000, 0x2041000, 0x2050000
RESIDENTS = [0x2042000 + index * 256 for index in range(3)]
RESIDENT_IDS = [100, 101, 102]
STACK, STOP = 0x20fd000, 0x20fe000
PHASE, COSMETIC, GAMEPLAY = 0x96eac8, 0x89bc72, 0x89d178
COUNT, HEAD, FREE = 0x89c655, 0x890330, 0x89032c
SETTING_UP = True
release_requests, unlink_entries, fire_requests, visits, entries = [], [], [], [], []
observations = []
observing = False


def write(address, fmt, *values):
    cpu.mem_write(address, struct.pack('<' + fmt, *values))


def read(address, fmt):
    return struct.unpack('<' + fmt, cpu.mem_read(address, struct.calcsize('<' + fmt)))[0]


def return_leaf(result=0):
    sp = cpu.reg_read(UC_X86_REG_ESP)
    cpu.reg_write(UC_X86_REG_EAX, result)
    cpu.reg_write(UC_X86_REG_EIP, read(sp, 'I'))
    cpu.reg_write(UC_X86_REG_ESP, sp + 4)


def observe_or_supply(_, address, size, user):
    sp = cpu.reg_read(UC_X86_REG_ESP)
    pointer = read(sp + 4, 'I')
    if address == 0x4ed580:
        assert SETTING_UP and read(pointer + 0x2a, 'B') == 7
        return_leaf()  # Root/child model fields below are explicit fixture inputs.
    elif address == 0x4ed8a0:
        cls, model, owner, point = struct.unpack('<4I', cpu.mem_read(sp + 4, 16))
        assert (cls, model, owner) == (5, 10, 0)
        fire_requests.append(list(struct.unpack('<HHh', cpu.mem_read(point, 6))))
        # Supplied allocation-failure contract: discard the staged 20-byte
        # allocation parameters exactly once. No primary slot/seed is allocated.
        assert read(0x89243a, 'B') == 1
        assert read(0x892443, 'I') == CONTEXT + 20
        write(0x892443, 'I', CONTEXT)
        write(0x89243a, 'B', 0)
        return_leaf(0)
    elif address == 0x44e940:
        return_leaf(384)  # Deterministic terrain; no original terrain claim.
    elif address == 0x4ee190:
        return_leaf()  # Sunlight bookkeeping after real secondary unlink.
    elif address == 0x4ef180:
        release_requests.append(pointer)  # Observe; do not replace destruction.
        observations.append({'event': 'release-request', 'pointer': pointer})
    elif address == 0x4ed530:
        unlink_entries.append(pointer)  # Observe; do not replace list mutation.
        observations.append({'event': 'actual-unlink-entry', 'pointer': pointer})
    elif address == 0x403254:
        observations.append({'event': 'release-return-before-handle-clear',
                             'rootClass': read(root + 0x2a, 'B'),
                             'count': read(COUNT, 'I'), 'freeHead': read(FREE, 'I')})
        assert read(root + 0x2a, 'B') == 0 and read(COUNT, 'I') == 1
        assert read(FREE, 'I') == root
    elif address == 0x4ed700:
        visits.append(pointer)  # Preserve real dispatcher and stamp writes.
    elif address in (0x408cb0, 0x4ed6f0, 0x4ed640, 0x4030c0, 0x408840):
        entries.append({'address': hex(address), 'pointer': pointer})
    elif address in (0x407490, 0x4ee4f0):
        raise AssertionError('Unexpected resident/cell-unlink consumer in this fixture')


for entry in (0x4ed580, 0x4ed8a0, 0x44e940, 0x4ee190, 0x4ef180, 0x4ed530,
              0x4ed700, 0x408cb0, 0x4ed6f0, 0x4ed640, 0x4030c0, 0x408840, 0x407490, 0x4ee4f0):
    cpu.hook_add(UC_HOOK_CODE, observe_or_supply, begin=entry, end=entry)
cpu.hook_add(UC_HOOK_CODE, observe_or_supply, begin=0x403254, end=0x403254)


def observe_write(_, access, address, size, value, user):
    if not observing:
        return
    spans = [(BUILDING, BUILDING + 179), (0x930ab8, 0x937a98),
             (COUNT, COUNT + 4), (HEAD, HEAD + 4), (FREE, FREE + 4),
             (PHASE, PHASE + 1), (COSMETIC, COSMETIC + 4), (GAMEPLAY, GAMEPLAY + 4)]
    if any(address < end and address + size > start for start, end in spans):
        assert len(observations) < 128, 'Bounded observation budget exceeded'
        observations.append({'event': 'native-write', 'address': hex(address),
                             'size': size, 'value': hex(value)})


cpu.hook_add(UC_HOOK_MEM_WRITE, observe_write)


def call(address, *args):
    write(STACK, 'I' * (len(args) + 1), STOP, *args)
    cpu.reg_write(UC_X86_REG_ESP, STACK)
    cpu.emu_start(address, STOP, count=100000)
    assert cpu.reg_read(UC_X86_REG_EIP) == STOP, hex(cpu.reg_read(UC_X86_REG_EIP))
    assert cpu.reg_read(UC_X86_REG_ESP) == STACK + 4, 'Unexpected calling convention'
    return cpu.reg_read(UC_X86_REG_EAX)


def list_nodes(pointer):
    result, previous = [], 0
    while pointer:
        assert 0x930ab8 <= pointer < 0x937a98
        assert (pointer - 0x930ab8) % 179 == 0
        assert pointer not in result and len(result) < 160
        assert read(pointer, 'I') == previous
        result.append(pointer)
        previous, pointer = pointer, read(pointer + 4, 'I')
    return result


def child_content(pointer):
    return {
        'index': read(pointer + 0x24, 'H'),
        'classModelStateChildCounterTribe': list(cpu.mem_read(pointer + 0x2a, 6)),
        'frameObjectFlagsF1F2Draw': bytes(cpu.mem_read(pointer + 0x33, 8)).hex(),
        'position': list(struct.unpack('<HHh', cpu.mem_read(pointer + 0x3d, 6))),
        'lifetime': read(pointer + 0x6c, 'h'),
    }


# Reuse accepted secondary-pool setup, with true native indices/bounds/179-byte
# records. This is a supplied two-record fixture, not a loader/world replay.
cpu.mem_write(0x8e0428, bytes(0x57670))
for address in (0x4ed820, 0x4ed880, 0x4ee300):
    call(address)
assert (read(0x890380, 'I'), read(0x89038c, 'I')) == (0x930ab8, 0x937a98)
assert len(list_nodes(read(FREE, 'I'))) == 160
write(0x89243a, 'B', 0)
write(0x89ce37, 'B', 0)
write(PHASE, 'B', 37)
write(COSMETIC, 'I', 123)
write(GAMEPLAY, 'I', 456)
write(POINT, 'HHh', 8192, 12288, 400)
root = call(0x4edbd0, 7, 74, 0, POINT)
child = call(0x4edbd0, 7, 75, 0, POINT)
assert list_nodes(read(HEAD, 'I')) == [child, root]
assert read(COUNT, 'I') == 2 and len(list_nodes(read(FREE, 'I'))) == 158
write(root + 0x2c, 'BB', 61, 0)
write(root + 0x6c, 'h', -1)
write(child + 0x2c, 'BB', 61, 1)
write(child + 0x6c, 'h', 9)  # Already-emitted child's supplied remaining visits.
write(child + 0x33, 'HHhBB', 1385, 256, 20, 0, 40)
assert read(root + 0xc, 'I') == read(child + 0xc, 'I') == 0, 'No cell membership'
SETTING_UP = False

# Original shapes feed the real burning initializer. Terrain heights and fire
# allocation are supplied. No live child points into the class-5 allocation leaf.
load_native_shapes(cpu, EXE, OBJECTS, SHAPES)
write(BUILDING + 0x24, 'H', 1)
write(BUILDING + 0x2a, 'BBBBBB', 2, 1, 2, 0, 32, 0)
write(BUILDING + 0x33, 'H', 107)
write(BUILDING + 0x26, 'H', 0)
write(BUILDING + 0x7a, 'HH', 8192, 12288)
write(BUILDING + 0x84, 'H', 0)  # No separate retained-building attachment cleanup.
write(BUILDING + 0x86, 'HHH', *RESIDENT_IDS)
write(BUILDING + 0x92, 'H', read(root + 0x24, 'H'))
write(BUILDING + 0xa6, 'B', 3)
for pointer, resident_id in zip(RESIDENTS, RESIDENT_IDS):
    write(pointer + 0x24, 'H', resident_id)
    write(pointer + 0x2a, 'BB', 1, 2)
    write(0x890390 + resident_id * 4, 'I', pointer)
resident_bytes = [bytes(cpu.mem_read(pointer, 179)).hex() for pointer in RESIDENTS]
write(0x890394, 'I', BUILDING)
assert read(0x890390 + read(BUILDING + 0x92, 'H') * 4, 'I') == root
write(0x89c6f0, 'B', 0)
write(0x892443, 'I', CONTEXT)
before_child = child_content(child)
before_building = bytes(cpu.mem_read(BUILDING, 179))
before_root_bytes = bytes(cpu.mem_read(root, 179))
before_child_bytes = bytes(cpu.mem_read(child, 179))
before_pool = {'allocated': list_nodes(read(HEAD, 'I')),
               'free': list_nodes(read(FREE, 'I')), 'count': read(COUNT, 'I')}
before_rng = [read(PHASE, 'B'), read(COSMETIC, 'I'), read(GAMEPLAY, 'I')]
observing = True
observations.append({'event': 'ignition-call'})
call(0x408cb0, BUILDING, 1)
observations.append({'event': 'ignition-return'})
after_root_bytes = bytes(cpu.mem_read(root, 179))
after_child_bytes = bytes(cpu.mem_read(child, 179))
after_ignition = {
    'state': read(BUILDING + 0x2c, 'B'), 'timer': read(BUILDING + 0xa7, 'b'),
    'occupants': read(BUILDING + 0xa6, 'B'), 'rootHandle': read(BUILDING + 0x92, 'H'),
    'rootClass': read(root + 0x2a, 'B'), 'count': read(COUNT, 'I'),
    'allocated': list_nodes(read(HEAD, 'I')), 'free': list_nodes(read(FREE, 'I')),
    'child': child_content(child),
}
assert [row['address'] for row in entries] == [
    '0x408cb0', '0x4ed6f0', '0x4ed640', '0x4030c0', '0x408840']
assert release_requests == [root] and unlink_entries == [root]
assert (after_ignition['state'], after_ignition['timer'], after_ignition['occupants']) == (4, 127, 3)
assert after_ignition['rootHandle'] == after_ignition['rootClass'] == 0
assert after_ignition['allocated'] == [child] and after_ignition['count'] == 1
assert after_ignition['free'][0] == root and len(after_ignition['free']) == 159
assert after_ignition['child'] == before_child  # List links intentionally excluded.
assert after_child_bytes[8:] == before_child_bytes[8:], 'Unexpected non-link child mutation'
assert set(i for i, (a, b) in enumerate(zip(before_root_bytes, after_root_bytes)) if a != b) <= {
    *range(8), 0x2a}
assert fire_requests and read(0x892443, 'I') == CONTEXT and read(0x89243a, 'B') == 0
after_building = bytes(cpu.mem_read(BUILDING, 179))
building_changed = [i for i, (a, b) in enumerate(zip(before_building, after_building)) if a != b]
assert set(building_changed) <= {0x2c, 0x35, 0x92, 0x93, 0xa7, 0xaf}
assert list(struct.unpack('<HHH', cpu.mem_read(BUILDING + 0x86, 6))) == RESIDENT_IDS
assert [bytes(cpu.mem_read(pointer, 179)).hex() for pointer in RESIDENTS] == resident_bytes

# Exactly one real secondary pass: retained child receives one visit, retired
# root receives none. No animation pass or elapsed-clock calibration is supplied.
cpu.reg_write(UC_X86_REG_ESP, STACK)
observations.append({'event': 'secondary-pass-entry'})
cpu.emu_start(0x4ec924, 0x4ec942, count=100000)
observations.append({'event': 'secondary-pass-return'})
assert cpu.reg_read(UC_X86_REG_EIP) == 0x4ec942
assert cpu.reg_read(UC_X86_REG_ESP) == STACK
after_visit = child_content(child)
assert visits == [child] and after_visit['lifetime'] == 8
assert after_visit['classModelStateChildCounterTribe'][4] == 38
assert after_visit['frameObjectFlagsF1F2Draw'] == before_child['frameObjectFlagsF1F2Draw']
assert after_visit['position'] == before_child['position']
assert read(COUNT, 'I') == 1 and list_nodes(read(HEAD, 'I')) == [child]
assert release_requests == [root] and unlink_entries == [root]
assert [read(PHASE, 'B'), read(COSMETIC, 'I'), read(GAMEPLAY, 'I')] == before_rng
print(json.dumps({
    'status': 'passed', 'case': 'full-root-existing-child-fire-allocation-failure',
    'executableSha256': identity['sha256'],
    'inputSha256': INPUTS,
    'buildingBytesBefore': before_building.hex(), 'buildingBytesAfter': after_building.hex(),
    'rootBytesBefore': before_root_bytes.hex(), 'rootBytesAfterIgnition': after_root_bytes.hex(),
    'childBytesBefore': before_child_bytes.hex(), 'childBytesAfterIgnition': after_child_bytes.hex(),
    'poolBefore': before_pool, 'orderedObservations': observations,
    'buildingChangedOffsets': [hex(offset) for offset in building_changed],
    'residentIds': RESIDENT_IDS, 'residentBytesUnchanged': resident_bytes,
    'releaseRequests': release_requests, 'actualSecondaryUnlinks': unlink_entries,
    'fireAllocationRequestsSuppliedFailure': fire_requests,
    'afterIgnition': after_ignition, 'afterOneSecondaryVisit': after_visit,
    'limits': 'Supplied root/child history, resident count, terrain and failed fire allocations; '
              'sunlight intercepted. Real root deletion/list return. No live/browser, '
              'fire-stream, whole-game, frame-cadence or ordinary acquisition claim.',
}, indent=2))
