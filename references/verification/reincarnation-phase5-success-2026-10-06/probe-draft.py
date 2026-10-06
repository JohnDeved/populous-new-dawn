"""ONE phase5 success composition, source draft only; never executed yet.

No import/run of the earlier 16-case fixture. No outer loop or browser caller.
Execution remains gated until review of this source and authorization to run.
"""
import hashlib
import json
import struct
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[3]
EXECUTABLE_FREEZE = False
EXE_SHA = '3a5065c7420b3fcde208bf220bc86dfbac95e025ab2492caf9c7ea5308dfbe4f'
INPUTS = {
    'mwsearch.dat': '0c39b12d160658863c2df89aa34484dff459e48ea0b5634658b7473ca940fae0',
    'vstart-0.ani': '64a8975f234aa67eafc4d4d9edd7cc4aeba9f5743d028d8203e0c67ca199a1aa',
    'vfra-0.ani': 'c91720da3c636fb74cb749c5f8747ae884c1d76dbeed4b845f5a199ef1a55258',
}
SCRATCH, SCRATCH_BYTES = 0x2000000, 0x200000
BODY, POOL, COUNTS, ARGS, STACK, STOP = (
    0x2000100, 0x2010000, 0x2100000, 0x2180000, 0x21ed000, 0x21ef000)
TABLE, TRIBE, LAND = 0x890390, 0x89d1c8, 0x8a03e4
GAME_RNG, COSMETIC_RNG = 0x89d178, 0x89bc72

# Calls are allowed to execute only in this named initialization/retirement
# closure. An unexpected direct call aborts; it is not silently supplied.
REAL_CALLS = {
    0x5029d0, 0x4da0f0, 0x4ed8a0, 0x4ed580, 0x4d23d0, 0x4d5920,
    0x4ee470, 0x4ea460, 0x4e9b40, 0x4ed6f0, 0x4ed640, 0x4d2740,
    0x4a3940, 0x4d47d0, 0x432260, 0x4d3ea0, 0x4d4040, 0x4ee700,
    0x44e940, 0x509c10, 0x50bcd0, 0x50a740, 0x50ccd0, 0x50bf60,
    0x4edcf0,
}
SOUND = 0x48a050  # The sole supplied consumer: record args, return0.


def sha(data):
    return hashlib.sha256(data).hexdigest()


def prepare_one_success(exe):
    if not EXECUTABLE_FREEZE:
        raise RuntimeError('Source draft only: executable freeze and native run are not authorized')
    # These imports and the CPU constructor have NOT been invoked in preparation.
    sys.path.insert(0, str(ROOT / 'scripts'))
    from decomp import native_cpu, configure_native_constants
    from unicorn import UC_HOOK_CODE, UC_HOOK_MEM_READ, UC_HOOK_MEM_WRITE, UC_MEM_WRITE
    from unicorn.x86_const import UC_X86_REG_EAX, UC_X86_REG_EIP, UC_X86_REG_ESP

    raw = exe.read_bytes()
    assert sha(raw) == EXE_SHA
    cpu, identity = native_cpu(exe)
    configure_native_constants(cpu, exe)
    cpu.mem_map(SCRATCH, SCRATCH_BYTES)
    read = lambda address, fmt: struct.unpack(
        '<' + fmt, cpu.mem_read(address, struct.calcsize('<' + fmt)))[0]
    write = lambda address, fmt, *values: cpu.mem_write(address, struct.pack('<' + fmt, *values))
    loaded = {name: (exe.parent / 'data' / name).read_bytes() for name in INPUTS}
    for name, expected in INPUTS.items():
        assert sha(loaded[name]) == expected, name
    cpu.mem_write(0x8929cd, loaded['mwsearch.dat'])

    immutable = [(0x8929cd, loaded['mwsearch.dat'], 'mapped search')]
    pe = struct.unpack_from('<I', raw, 60)[0]
    sections = struct.unpack_from('<H', raw, pe + 6)[0]
    optional_size = struct.unpack_from('<H', raw, pe + 20)[0]
    image_base = struct.unpack_from('<I', raw, pe + 52)[0]
    for index in range(sections):
        record = pe + 24 + optional_size + index * 40
        name, virtual_size, address, file_size, _ = struct.unpack_from('<8sIIII', raw, record)
        characteristics = struct.unpack_from('<I', raw, record + 36)[0]
        if not characteristics & 0x80000000:  # IMAGE_SCN_MEM_WRITE
            address += image_base
            immutable.append((address, bytes(cpu.mem_read(address, max(virtual_size, file_size))),
                              name.rstrip(b'\0').decode('ascii')))
    constants = json.loads((ROOT / 'app/original-constants.json').read_text())
    constant_count = 0
    for index in range(512):
        descriptor = bytes(cpu.mem_read(0x5aa5f0 + index * 31, 31))
        name = descriptor[:25].split(b'\0')[0].decode('ascii')
        if not name:
            break
        if name in constants:
            size, address = descriptor[25], struct.unpack('<I', descriptor[27:])[0]
            immutable.append((address, bytes(cpu.mem_read(address, size)), name))
            constant_count += 1
    assert constant_count == 244

    def guard(label):
        for address, expected, name in immutable:
            assert bytes(cpu.mem_read(address, len(expected))) == expected, (label, name, hex(address))

    guard('before fixture')
    cpu.mem_write(TABLE, bytes(0x2000))  # Never extends into the search gap/table.
    cpu.mem_write(TRIBE, bytes(4 * 0xc65))
    cpu.mem_write(LAND, b''.join(struct.pack('<IhH8x', 0, 128, 0) for _ in range(16384)))
    for address in (0x89031c, 0x890320, 0x890324, 0x890328, 0x89c651,
                    0x89c659, 0x89c661, 0x895da4, 0x895da8, 0x897981, 0x96aa70):
        write(address, 'I', 0)
    write(0x892443, 'I', ARGS)
    write(0x89243a, 'B', 0)
    write(0x89ce37, 'B', 0)
    write(0x89c6f0, 'B', 0)
    write(0x89c6dd, 'H', 2)
    write(0x89d17c, 'I', 32)
    write(0x89d180, 'I', 1)  # Includes the supplied, already-allocated body.
    write(GAME_RNG, 'I', 0x12345678)
    write(COSMETIC_RNG, 'I', 0x11223344)
    cpu.mem_write(0x96eac1, bytes([250]) * 12)
    assert bytes(cpu.mem_read(0x5a6830 + 3, 3)) == bytes.fromhex('080800')
    assert bytes(cpu.mem_read(0x5a6830 + 21, 3)) == bytes.fromhex('5e2802')

    # One high-pool body640 and34 real free records641..674. Low pool empty.
    for offset in range(34):
        record, index = POOL + offset * 256, 641 + offset
        write(record, 'II', record - 256 if offset else 0,
              record + 256 if offset < 33 else 0)
        write(record + 0x24, 'H', index)
        write(TABLE + index * 4, 'I', record)
    write(0x89031c, 'I', POOL)
    write(0x890324, 'I', BODY)
    write(0x89c651, 'I', 1)
    write(TABLE + 640 * 4, 'I', BODY)
    write(BODY + 0x24, 'H', 640)
    write(BODY + 0x2a, 'BBBBBB', 10, 12, 12, 5, 0, 0)
    write(BODY + 0xc, 'I', 0x40020000)
    write(BODY + 0x35, 'H', 0x10)
    write(BODY + 0x3d, 'HHh', 8192, 8192, 1408)
    write(BODY + 0x68, 'I', 0)
    write(BODY + 0x74, 'BB', 7, 7)
    write(LAND + (16 * 128 + 16) * 16 + 6, 'H', 640)
    write(TRIBE + 0x911, 'HHh', 4096, 4096, 240)
    write(TRIBE + 0x91d, 'I', 1)  # Supplied surviving-population gate context.

    # Supplied loaded-table boundary, derived from the exact VSTART/VFRA inputs;
    # original file loading/rendering does not execute. Real object setters do.
    starts = list(struct.iter_unpack('<HH', loaded['vstart-0.ani']))
    frames = list(struct.iter_unpack('<HBBBBH', loaded['vfra-0.ani']))
    for index, (first, _) in enumerate(starts):
        frame, seen = first, set()
        while frame and frame not in seen:
            assert frame < len(frames)
            seen.add(frame)
            frame = frames[frame][-1]
        assert frame in (0, first)
        write(COUNTS + index * 6 + 1, 'B', len(seen) & 255)
    write(0x59df44, 'I', COUNTS)
    immutable.append((COUNTS, bytes(cpu.mem_read(COUNTS, len(starts) * 6)), 'derived frame counts'))
    guard('after fixture')

    events, allocation_stack, calls, accesses = [], [], [], set()
    mutable = [(SCRATCH, SCRATCH + SCRATCH_BYTES), (TRIBE, TRIBE + 4 * 0xc65),
               (LAND, LAND + 0x40000), (0x89031c, 0x89032c),
               (0x89243a, 0x89243b), (0x892443, 0x892447),
               (0x89c651, 0x89c655), (0x89c659, 0x89c65d),
               (GAME_RNG, GAME_RNG + 4), (COSMETIC_RNG, COSMETIC_RNG + 4),
               (0x89d180, 0x89d184), (0x89ce37, 0x89ce38), (0x96eac1, 0x96eacd)]

    def rngs():
        return {'gameplay': read(GAME_RNG, 'I'), 'cosmetic': read(COSMETIC_RNG, 'I')}

    def ownership():
        return {'highFree': read(0x89031c, 'I'), 'lowFree': read(0x890320, 'I'),
                'active': read(0x890324, 'I'), 'retiring': read(0x890328, 'I'),
                'total': read(0x89c651, 'I'), 'lowCount': read(0x89c659, 'I'),
                'allocatedEver': read(0x89d180, 'I'),
                'classSeeds': list(cpu.mem_read(0x96eac1, 12)), 'rngs': rngs(),
                'argumentStack': read(0x892443, 'I'), 'argumentFlag': read(0x89243a, 'B'),
                'tribe': bytes(cpu.mem_read(TRIBE, 0xc65)).hex()}

    initial = {'ownership': ownership(),
               'body': bytes(cpu.mem_read(BODY, 0xb3)).hex(),
               'pool': bytes(cpu.mem_read(POOL, 34 * 256)).hex()}

    def on_memory(_, access, address, size, value, user):
        eip = cpu.reg_read(UC_X86_REG_EIP)
        accesses.add((access, eip, address, size))
        if access != UC_MEM_WRITE:  # Read accesses are retained only.
            return
        for start, expected, name in immutable:
            assert address + size <= start or address >= start + len(expected), ('immutable write', name)
        assert any(start <= address and address + size <= end for start, end in mutable), (
            'unclassified native write', hex(eip), hex(address), size)
        if address in (GAME_RNG, COSMETIC_RNG):
            events.append({'rngWrite': [hex(eip), hex(address), size, value]})

    def on_code(_, address, size, user):
        sp = cpu.reg_read(UC_X86_REG_ESP)
        instruction = bytes(cpu.mem_read(address, size))
        if instruction[:1] == b'\xe8':
            target = address + 5 + struct.unpack('<i', instruction[1:5])[0]
            calls.append([hex(address), hex(target)])
            assert target in REAL_CALLS or target == SOUND, ('unclassified direct call', hex(address), hex(target))
        if address == SOUND:
            arguments = list(struct.unpack('<3I', cpu.mem_read(sp + 4, 12)))
            events.append({'suppliedSound': arguments})
            cpu.reg_write(UC_X86_REG_EAX, 0)
            cpu.reg_write(UC_X86_REG_EIP, read(sp, 'I'))
            cpu.reg_write(UC_X86_REG_ESP, sp + 4)
        elif address == 0x4ed8a0:
            cls, model, owner, point = struct.unpack('<4I', cpu.mem_read(sp + 4, 16))
            row = {'sp': sp, 'return': read(sp, 'I'), 'class': cls & 255,
                   'model': model & 255, 'owner': owner & 255,
                   'point': list(struct.unpack('<HHh', cpu.mem_read(point, 6))),
                   'argumentStack': read(0x892443, 'I'), 'argumentFlag': read(0x89243a, 'B'),
                   'rngs': rngs()}
            allocation_stack.append(row)
            events.append({'request': row.copy()})
        elif address == 0x4edad6:
            row = allocation_stack.pop()
            assert sp == row['sp'] and read(sp, 'I') == row['return']
            row = {**row, 'result': cpu.reg_read(UC_X86_REG_EAX), 'afterRngs': rngs(),
                   'afterArgumentStack': read(0x892443, 'I'),
                   'afterArgumentFlag': read(0x89243a, 'B')}
            events.append({'return': row})
        elif address in (0x4da0f0, 0x4da16d, 0x4d5920, 0x4d23d0, 0x50ccd0, 0x50bf60, 0x4edcf0):
            events.append({'boundary': hex(address), 'firstArgument': read(sp + 4, 'I'),
                           'rawEax': cpu.reg_read(UC_X86_REG_EAX),
                           'argumentStack': read(0x892443, 'I'), 'argumentFlag': read(0x89243a, 'B'),
                           'shaman': read(TRIBE + 0x89d, 'I'), 'rngs': rngs()})

    cpu.hook_add(UC_HOOK_CODE, on_code)
    cpu.hook_add(UC_HOOK_MEM_READ | UC_HOOK_MEM_WRITE, on_memory)
    before_rngs = rngs()
    write(STACK, 'II', STOP, BODY)
    cpu.reg_write(UC_X86_REG_ESP, STACK)
    # Exactly one call; no loop over cases, phases or scheduled object visits.
    try:
        cpu.emu_start(0x5029d0, STOP, timeout=1_000_000, count=200_000)
    except Exception:
        # A future single-run host receipt can retain this exact failure trace.
        # Failure does not retry, reclassify a leaf, or advance another visit.
        print(json.dumps({'status': 'failed-native-call', 'initial': initial,
                          'instruction': hex(cpu.reg_read(UC_X86_REG_EIP)),
                          'ownership': ownership(), 'events': events, 'directCalls': calls,
                          'accesses': sorted(accesses)}), flush=True)
        raise
    print(json.dumps({'status': 'returned-pending-validation', 'initial': initial,
                      'rawEax': cpu.reg_read(UC_X86_REG_EAX), 'ownership': ownership(),
                      'events': events, 'directCalls': calls, 'accesses': sorted(accesses),
                      'body': bytes(cpu.mem_read(BODY, 0xb3)).hex(),
                      'pool': bytes(cpu.mem_read(POOL, 34 * 256)).hex()}), flush=True)
    assert cpu.reg_read(UC_X86_REG_EIP) == STOP
    guard('after the one phase5 success call')

    requests = [event['request'] for event in events if 'request' in event]
    returned = [event['return'] for event in events if 'return' in event]
    assert [(row['class'], row['model']) for row in requests] == [(1, 7), (7, 9)] + [(7, 3)] * 32
    assert (requests[0]['argumentStack'], requests[0]['argumentFlag']) == (ARGS + 20, 1)
    assert (requests[1]['argumentStack'], requests[1]['argumentFlag']) == (ARGS, 0)
    assert len(returned) == 34 and all(row['result'] for row in returned)
    person = next(row['result'] for row in returned if row['class'] == 1)
    root = next(row['result'] for row in returned if row['model'] == 9)
    sparks = [row['result'] for row in returned if row['model'] == 3]
    assert read(TRIBE + 0x89d, 'I') == person
    assert read(person + 0x5d, 'H') == 0
    assert next(event['rawEax'] for event in events if event.get('boundary') == '0x4da16d') == person
    assert read(TRIBE + 0x91d, 'I') == 2
    assert read(person + 0x41, 'h') == 128
    assert read(root + 0x41, 'h') == 330
    assert all(read(spark + 0x41, 'h') == 330 for spark in sparks)
    assert read(BODY + 0x2a, 'B') == 0 and read(0x890328, 'I') == BODY
    assert read(0x892443, 'I') == ARGS and read(0x89243a, 'B') == 0
    assert not allocation_stack
    assert [event['suppliedSound'] for event in events if 'suppliedSound' in event] == [[0, 107, 1]]
    return {
        'mode': 'one fixed phase5 creation, no scheduled visits/lifetime/capacity/browser claim',
        'executable': identity, 'inputs': INPUTS, 'beforeRngs': before_rngs, 'afterRngs': rngs(),
        'initial': initial, 'finalOwnership': ownership(),
        'savedSite': [4096, 4096, 240], 'currentGround': 128,
        'events': events, 'directCalls': calls, 'accesses': sorted(accesses),
        'records': {str(read(record + 0x24, 'H')): bytes(cpu.mem_read(record, 0xb3)).hex()
                    for record in [BODY, person, root, *sparks]},
        'remainingHighFree': read(0x89031c, 'I'), 'remainingLowFree': read(0x890320, 'I'),
        'activeHead': read(0x890324, 'I'), 'retirementHead': read(0x890328, 'I'),
        'classSeeds': list(cpu.mem_read(0x96eac1, 12)),
    }


if __name__ == '__main__':
    raise SystemExit('SOURCE DRAFT ONLY: native execution remains disabled')
