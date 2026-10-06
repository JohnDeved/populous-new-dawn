"""One fixed eleven-call scheduled reincarnation burst; unexecuted source freeze.

No sweep, app caller, draw loop or original OS-game route.
Real primary traversal, cell ownership, retirement and free-list return remain native.
"""
import hashlib
import json
import struct
import sys
from collections import Counter
from bisect import bisect_left
from copy import deepcopy
from pathlib import Path

ROOT = Path(__file__).resolve().parents[3]
TRANSLATION_BUFFER_BYTES = 64 * 1024 * 1024
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
    0x4edcf0, 0x4ed700, 0x500ec0, 0x50a750, 0x50c780, 0x50c830,
    0x50c840, 0x4ba600, 0x401b10, 0x49c7a0, 0x49a2f0, 0x49a3f0,
    0x450450, 0x44fde0, 0x4e6a70, 0x4ee580, 0x4077e0,
    0x50bd70, 0x50beb0, 0x4e7a80, 0x4e78f0, 0x4ef180,
    0x4ee4f0, 0x401ba0, 0x4ee190, 0x401b40,
}
AUDIO_RECORD = 0x21a0000
# call instruction -> (callee, argument dwords, result, supplied boundary).
# Matching is by the original return address at callee entry, never by callee alone.
SUPPLIES = {
    0x4ec7ac: (0x41b230, 0, 0, 'outside-world'),
    0x4ec7b6: (0x436db0, 0, 0, 'outside-world'),
    0x4ec7bb: (0x493af0, 0, 0, 'outside-world'),
    0x4ec7c0: (0x4ec3b0, 0, 0, 'outside-world'),
    0x4ec80e: (0x489e50, 1, 0, 'motion-before'),
    0x4ec890: (0x489e50, 1, 0, 'motion-after'),
    0x4ec91a: (0x4ef7f0, 0, 0, 'outside-world'),
    0x4ec91f: (0x4f0460, 0, 0, 'outside-world'),
    0x4ec942: (0x4ecac0, 0, 0, 'tribe-rescan'),
    0x4ec947: (0x401350, 0, 0, 'landscape-presentation'),
    0x4ec98d: (0x504660, 0, 0, 'outside-world'),
    0x4ec9b0: (0x4fc020, 0, 0, 'outside-world'),
    0x4ec9f0: (0x41cb40, 0, 0, 'outside-world'),
    0x4ec9f5: (0x44df40, 0, 0, 'outer-terrain-notification'),
    0x4ec9fa: (0x4f0bd0, 0, 0, 'save-excluded'),
    0x4ec9ff: (0x4f0e00, 0, 0, 'outside-world'),
    0x4eca04: (0x4ec390, 0, 0, 'outside-world'),
    0x4eca09: (0x450a70, 0, 0, 'outside-world'),
    0x4eca0e: (0x41a550, 0, 0, 'outside-world'),
    0x4eca13: (0x41c6d0, 0, 0, 'outside-world'),
    0x4eca18: (0x4f42c0, 0, 0, 'outside-world'),
    0x4ed71c: (0x4d32b0, 1, 0, 'new-shaman-ordinary-processor'),
    0x50c7ef: (0x48a050, 3, AUDIO_RECORD, 'wave-sound'),
    0x50c7fe: (0x48a810, 2, 0, 'sound-mode'),
    0x50c8f7: (0x4010b0, 4, 0, 'wave-light-registration'),
    0x44fe58: (0x44ddf0, 3, 0, 'terrain-notification'),
    0x44fe60: (0x44df40, 0, 0, 'terrain-notification'),
    0x44fe6c: (0x44f2f0, 4, 0, 'terrain-notification'),
    0x502e4c: (0x48a050, 3, 0, 'spawn-sound'),
}
# Empty-list/flag branches must not be supplied if unexpectedly reached.
UNREACHABLE_CALL_SITES = {
    0x4ec79d, 0x4ec7a2, 0x4ec7da, 0x4ec7fe, 0x4ec84c, 0x4ec877,
    0x4ec880, 0x4ec8f4, 0x4ec8fc, 0x4ec904, 0x4ec90c, 0x4ec934, 0x4ec9a1,
}



def sha(data):
    return hashlib.sha256(data).hexdigest()


def run_fixed_timeline(exe, *, execute_reviewed=False):
    if not execute_reviewed:
        raise RuntimeError('Use only the reviewed, separately authorized single-run launcher')
    # These imports and the CPU constructor have NOT been invoked in preparation.
    sys.path.insert(0, str(ROOT / 'scripts'))
    from decomp import native_cpu, configure_native_constants
    from unicorn import UC_HOOK_CODE, UC_HOOK_MEM_READ, UC_HOOK_MEM_WRITE, UC_MEM_WRITE
    from unicorn.x86_const import UC_X86_REG_EAX, UC_X86_REG_EIP, UC_X86_REG_ESP

    raw = exe.read_bytes()
    assert sha(raw) == EXE_SHA
    cpu, identity = native_cpu(exe, tcg_buffer_size=TRANSLATION_BUFFER_BYTES)
    assert cpu.ctl_get_tcg_buffer_size() == TRANSLATION_BUFFER_BYTES
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

    # One supplied body640 and800 high free records641..1440. Low pool empty.
    for offset in range(800):
        record, index = POOL + offset * 256, 641 + offset
        write(record, 'II', record - 256 if offset else 0,
              record + 256 if offset < 799 else 0)
        write(record + 0x24, 'H', index)
        write(TABLE + index * 4, 'I', record)
    write(0x89031c, 'I', POOL)
    write(0x890324, 'I', BODY)
    write(0x89c651, 'I', 1)
    write(TABLE + 640 * 4, 'I', BODY)
    write(BODY + 0x24, 'H', 640)
    write(BODY + 0x2a, 'BBBBBB', 10, 12, 12, 4, 0, 0)
    write(BODY + 0xc, 'I', 0x20000)  # Phase4 entry bit clear: do not reset timer300.
    write(BODY + 0x6e, 'h', 5)
    write(BODY + 0x35, 'H', 0x10)
    write(BODY + 0x3d, 'HHh', 8192, 8192, 1408)
    write(BODY + 0x68, 'I', 0)
    write(BODY + 0x74, 'BB', 7, 7)
    write(LAND + (16 * 128 + 16) * 16 + 6, 'H', 640)
    write(TRIBE + 0x911, 'HHh', 4096, 4096, 240)
    write(TRIBE + 0x91d, 'I', 1)  # Supplied surviving-population gate context.

    # Empty external lists and explicitly excluded secondary-pool address range.
    for address in (0x890330, 0x890358, 0x89035c, 0x890360, 0x890380, 0x89038c,
                    0x895dbb, 0x89c669, 0x89d188):
        write(address, 'I', 0)
    for address in range(0x64f480, 0x64f4a0, 4):
        write(address, 'I', 0)
    write(0x969e8a, 'H', 0)
    write(0x96eace, 'B', 0)
    write(0x96eabf, 'B', 0)
    cpu.mem_write(0x89290d, bytes(16 * 12))
    cpu.mem_write(0x9557b6, bytes(8))

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
    immutable.append((TABLE, bytes(cpu.mem_read(TABLE, 0x2000)), 'handle table'))
    guard('after fixture')
    immutable_ranges = sorted((address, address + len(value), name)
                              for address, value, name in immutable)
    assert all(left[1] <= right[0] for left, right in zip(immutable_ranges, immutable_ranges[1:]))
    immutable_starts = [row[0] for row in immutable_ranges]

    known_records = {BODY, *(POOL + i * 256 for i in range(800))}
    events, allocation_stack, direct_calls = [], [], []
    accesses = Counter()
    turn, attempt, wrapper_active = 0, 0, False
    generations = {0: {'pointer': BODY, 'handle': 640, 'class': 10, 'model': 12,
                       'born': 0, 'initialCounter': 0, 'birth': False,
                       'visits': [], 'retired': None, 'freed': None}}
    current = {BODY: 0}
    retiring_pending, freeing_pending = {}, {}
    supplied_targets = {spec[0] for spec in SUPPLIES.values()}
    mutable = [(SCRATCH, SCRATCH + SCRATCH_BYTES), (TRIBE, TRIBE + 4 * 0xc65),
               (LAND, LAND + 0x40000), (0x89031c, 0x89032c),
               (0x89243a, 0x89243b), (0x892443, 0x892447),
               (0x89290d, 0x8929cd), (0x89c651, 0x89c655), (0x89c659, 0x89c65d),
               (GAME_RNG, GAME_RNG + 4), (COSMETIC_RNG, COSMETIC_RNG + 4),
               (0x89d180, 0x89d184), (0x89ce37, 0x89ce38), (0x96eac1, 0x96eacd),
               (0x64f480, 0x64f4a0), (0x89c669, 0x89c66d), (0x89c6e5, 0x89c6e7),
               (0x89ce60, 0x89ce61), (0x89d167, 0x89d168), (0x89d188, 0x89d18c),
               (0x969e8a, 0x969e8c), (0x96eace, 0x96eacf),
               (0x9557b6, 0x9557be)]  # Original outer-loop accumulator clear via EAX.
    fields = [('handle', 0x24, 'H'), ('class', 0x2a, 'B'), ('model', 0x2b, 'B'),
              ('state', 0x2c, 'B'), ('phase', 0x2d, 'B'), ('counter', 0x2e, 'B'),
              ('owner', 0x2f, 'B'), ('flags2', 0xc, 'I'), ('flags4', 0x10, 'I'),
              ('object', 0x33, 'H'), ('renderFlags', 0x35, 'H'),
              ('x', 0x3d, 'H'), ('y', 0x3f, 'H'), ('h', 0x41, 'h'),
              ('remaining', 0x6c, 'h'), ('timerOrLink', 0x6e, 'H')]

    def state(pointer):
        assert pointer in known_records
        return {name: read(pointer + offset, fmt) for name, offset, fmt in fields}

    def rngs():
        return {'gameplay': read(GAME_RNG, 'I'), 'cosmetic': read(COSMETIC_RNG, 'I')}

    def chain(head):
        result, previous = [], 0
        pointer = read(head, 'I')
        while pointer:
            assert pointer in known_records and pointer not in result
            assert read(pointer, 'I') == previous
            assert read(TABLE + read(pointer + 0x24, 'H') * 4, 'I') == pointer
            result.append(pointer)
            previous, pointer = pointer, read(pointer + 4, 'I')
        return result

    def ownership():
        lists = {name: chain(address) for name, address in
                 [('active', 0x890324), ('retiring', 0x890328),
                  ('highFree', 0x89031c), ('lowFree', 0x890320)]}
        flat = [p for values in lists.values() for p in values]
        assert len(flat) == len(set(flat)) == len(known_records)
        assert set(flat) == known_records
        assert read(0x89c651, 'I') == len(lists['active']) + len(lists['retiring'])
        assert read(0x89c659, 'I') == 0 and not lists['lowFree']
        # Real movement/unlink must keep both cell-link directions coherent.
        registered = {p for p in lists['active'] if read(p + 0xc, 'I') & 0x20000}
        cell_members = set()
        terrain = bytes(cpu.mem_read(LAND, 0x40000))
        for cell, (head,) in enumerate(struct.iter_unpack('<6xH8x', terrain)):
            handle, previous, seen = head, 0, set()
            while handle:
                assert 640 <= handle <= 1440
                record = read(TABLE + handle * 4, 'I')
                assert record in registered and handle not in seen and record not in cell_members
                assert read(record + 0x22, 'H') == previous
                actual = (read(record + 0x3d, 'H') >> 9) + (read(record + 0x3f, 'H') >> 9) * 128
                assert actual == cell
                seen.add(handle)
                cell_members.add(record)
                previous, handle = handle, read(record + 0x20, 'H')
        assert cell_members == registered
        assert all(not read(p + 0xc, 'I') & 0x20000 for p in lists['retiring'] + lists['highFree'])
        return {'lists': lists, 'total': read(0x89c651, 'I'),
                'allocatedEver': read(0x89d180, 'I'), 'clock': read(0x89d188, 'I'),
                'classSeeds': list(cpu.mem_read(0x96eac1, 12)), 'rngs': rngs(),
                'argumentStack': read(0x892443, 'I'), 'argumentFlag': read(0x89243a, 'B'),
                'shaman': read(TRIBE + 0x89d, 'I'), 'population': read(TRIBE + 0x91d, 'I'),
                'savedSite': list(struct.unpack('<HHh', cpu.mem_read(TRIBE + 0x911, 6)))}

    def identify(pointer):
        assert pointer in current, ('unknown allocated identity', hex(pointer))
        return current[pointer], generations[current[pointer]]

    def raw_records():
        return {str(read(p + 0x24, 'H')): bytes(cpu.mem_read(p, 0xb3)).hex()
                for p in sorted(known_records)}

    def record_retirement(pointer):
        serial = retiring_pending.pop(pointer)
        generation = generations[serial]
        assert current[pointer] == serial and generation['retired'] is None
        assert read(pointer + 0x2a, 'B') == 0 and read(pointer + 0xc, 'I') & 1
        assert read(pointer + 0x2e, 'B') == 3
        assert pointer in chain(0x890328) and pointer not in chain(0x890324)
        generation['retired'] = turn
        events.append({'retired': serial, 'turn': turn, 'state': state(pointer)})

    def supplied(address, sp):
        site = read(sp, 'I') - 5
        assert site in SUPPLIES and SUPPLIES[site][0] == address, ('unqualified supply', hex(address), hex(site))
        target, argc, result, label = SUPPLIES[site]
        arguments = list(struct.unpack('<' + 'I' * argc, cpu.mem_read(sp + 4, 4 * argc))) if argc else []
        if label == 'new-shaman-ordinary-processor':
            assert arguments == [read(TRIBE + 0x89d, 'I')] and turn >= 7
            serial, generation = identify(arguments[0])
            assert generation['birth'] and (generation['class'], generation['model']) == (1, 7)
            assert generation['visits'][-1] == turn
        elif label == 'wave-sound':
            assert state(arguments[0])['model'] == 8 and arguments[1:] == [158, 0]
        elif label == 'spawn-sound':
            assert arguments == [0, 107, 1] and turn == 6
        elif label == 'sound-mode':
            assert arguments == [AUDIO_RECORD, 0]
        elif label == 'wave-light-registration':
            assert state(arguments[0])['model'] == 60 and arguments[1:] == [1, 1, 0]
        elif label == 'terrain-notification':
            if site == 0x44fe58:
                assert arguments[1:] == [2, 1] and arguments[0] & 0xffff == arguments[0]
                assert arguments[0] & 1 == 0
            elif site == 0x44fe6c:
                assert arguments[0] == 1 and arguments[2:] == [1, 0xffffffff]
                assert arguments[1] & 0xffff == arguments[1] and arguments[1] & 1 == 0
        elif label == 'motion-before':
            assert arguments == [0]
        elif label == 'motion-after':
            assert arguments == [1]
        events.append({'supplied': label, 'turn': turn, 'callSite': hex(site),
                       'callee': hex(target), 'arguments': arguments, 'result': result})
        cpu.reg_write(UC_X86_REG_EAX, result)
        cpu.reg_write(UC_X86_REG_EIP, read(sp, 'I'))
        cpu.reg_write(UC_X86_REG_ESP, sp + 4)

    def on_memory(_, access, address, size, value, user):
        eip = cpu.reg_read(UC_X86_REG_EIP)
        accesses[(access, eip, address, size)] += 1
        if access != UC_MEM_WRITE:
            return
        index = bisect_left(immutable_starts, address + size)
        if index:
            start, end, name = immutable_ranges[index - 1]
            assert address >= end, ('immutable write', name)
        assert any(start <= address and address + size <= end for start, end in mutable), (
            'unclassified native write', turn, hex(eip), hex(address), size)
        if address in (GAME_RNG, COSMETIC_RNG):
            events.append({'rngWrite': [hex(eip), hex(address), size, value], 'turn': turn})

    def on_code(_, address, size, user):
        nonlocal attempt, wrapper_active
        sp = cpu.reg_read(UC_X86_REG_ESP)
        instruction = bytes(cpu.mem_read(address, size))
        if instruction[:1] == b'\xe8':
            target = address + 5 + struct.unpack('<i', instruction[1:5])[0]
            direct_calls.append([turn, hex(address), hex(target)])
            assert address not in UNREACHABLE_CALL_SITES, ('declared empty branch reached', hex(address))
            if address in SUPPLIES:
                assert target == SUPPLIES[address][0]
            else:
                assert target in REAL_CALLS, ('unclassified direct call', turn, hex(address), hex(target))
        if instruction[:1] == b'\xff' and len(instruction) > 1:
            assert ((instruction[1] >> 3) & 7) not in (2, 3), ('unexpected indirect call', hex(address))
        if address in supplied_targets:
            supplied(address, sp)
            return
        if address == 0x4da0f0:
            assert turn == 6 and not wrapper_active
            wrapper_active = True
            events.append({'wrapperEntry': turn, 'argumentStack': read(0x892443, 'I'), 'rngs': rngs()})
        elif address == 0x4da16d:
            assert wrapper_active
            wrapper_active = False
            assert read(0x892443, 'I') == ARGS and read(0x89243a, 'B') == 0
            events.append({'wrapperReturn': turn, 'person': cpu.reg_read(UC_X86_REG_EAX), 'rngs': rngs()})
        elif address == 0x4ed8a0:
            cls, model, owner, point = struct.unpack('<4I', cpu.mem_read(sp + 4, 16))
            cls, model, owner = cls & 255, model & 255, owner & 255
            assert owner == 0 and (cls, model) in {(10, 12), (7, 8), (7, 60), (7, 61), (1, 7), (7, 9), (7, 3)}
            assert cls != 10  # The sole body is supplied, never recreated.
            attempt += 1
            row = {'serial': attempt, 'sp': sp, 'return': read(sp, 'I'), 'turn': turn,
                   'class': cls, 'model': model, 'owner': owner, 'birth': wrapper_active,
                   'point': list(struct.unpack('<HHh', cpu.mem_read(point, 6))),
                   'argumentStack': read(0x892443, 'I'), 'argumentFlag': read(0x89243a, 'B'), 'rngs': rngs()}
            allocation_stack.append(row)
            events.append({'request': row.copy()})
        elif address == 0x4ed580:
            pointer = read(sp + 4, 'I')
            assert pointer in known_records and allocation_stack
            row = allocation_stack[-1]
            if pointer in current:
                assert generations[current[pointer]]['freed'] is not None
                events.append({'reuse': [current[pointer], row['serial']], 'pointer': pointer, 'turn': turn})
            current[pointer] = row['serial']
            generations[row['serial']] = {
                'pointer': pointer, 'handle': read(pointer + 0x24, 'H'),
                'class': row['class'], 'model': row['model'], 'born': turn,
                'initialCounter': read(pointer + 0x2e, 'B'), 'birth': row['birth'],
                'visits': [], 'retired': None, 'freed': None}
            assert (read(pointer + 0x2a, 'B'), read(pointer + 0x2b, 'B')) == (row['class'], row['model'])
        elif address == 0x4edad6:
            row = allocation_stack.pop()
            assert sp == row['sp'] and read(sp, 'I') == row['return']
            result = cpu.reg_read(UC_X86_REG_EAX)
            assert result in known_records and current[result] == row['serial'], 'unexpected allocation failure'
            events.append({'return': {**row, 'result': result, 'afterRngs': rngs(),
                                     'afterArgumentStack': read(0x892443, 'I'),
                                     'afterArgumentFlag': read(0x89243a, 'B')}})
        elif address == 0x4ed700:
            pointer = read(sp + 4, 'I')
            serial, generation = identify(pointer)
            assert generation['retired'] is None and generation['born'] < turn
            assert not generation['visits'] or generation['visits'][-1] < turn
            assert (generation['class'], generation['model']) in {(10, 12), (1, 7), (7, 8), (7, 9), (7, 3), (7, 60), (7, 61)}
            generation['visits'].append(turn)
            assert read(pointer + 0x2e, 'B') == (generation['initialCounter'] + len(generation['visits'])) & 255
            events.append({'scheduled': serial, 'turn': turn, 'state': state(pointer), 'next': read(pointer + 4, 'I')})
        elif address == 0x4e7a80:
            pointer = read(sp + 4, 'I')
            _, generation = identify(pointer)
            flags = read(pointer + 0xc, 'I')
            assert generation['birth'] and generation['model'] == 3
            assert flags & 0x80 and not flags & 0x82000  # Declared directed path; no other motion owner.
        elif address in (0x4edcf0, 0x4ef180):
            pointer = read(sp + 4, 'I')
            serial, generation = identify(pointer)
            assert generation['retired'] is None and pointer not in retiring_pending
            assert not read(pointer + 0xc, 'I') & 0x04000000
            if address == 0x4edcf0:
                assert serial == 0 and turn == 6  # Wave/orbit teardown is outside the fixed stop.
            else:
                assert generation['class'] == 7 and generation['model'] in (3, 9, 61)
            retiring_pending[pointer] = serial
            events.append({'retirementEntry': serial, 'turn': turn, 'callee': hex(address), 'state': state(pointer)})
        elif address == 0x4ede07:
            record_retirement(read(sp + 4, 'I'))
        elif address == 0x4ee190:
            pointer = read(sp + 4, 'I')
            assert pointer in retiring_pending and not read(pointer + 0xc, 'I') & 0x04000000
            record_retirement(pointer)  # Native global/cell unlink and counter3 have completed.
        elif address == 0x401b40:
            pointer = read(sp + 4, 'I')
            serial, generation = identify(pointer)
            assert generation['retired'] is not None and generation['freed'] is None
            assert read(pointer + 0x2a, 'B') == 0 and read(pointer + 0x2e, 'B') == 0
            freeing_pending[pointer] = serial
        elif address == 0x401b99:
            pointer = read(sp + 4, 'I')
            serial = freeing_pending.pop(pointer)
            assert pointer in chain(0x89031c) and pointer not in chain(0x890328)
            generations[serial]['freed'] = turn
            events.append({'freed': serial, 'turn': turn, 'pointer': pointer})

    cpu.hook_add(UC_HOOK_CODE, on_code)
    cpu.hook_add(UC_HOOK_MEM_READ | UC_HOOK_MEM_WRITE, on_memory)
    print(json.dumps({'kind': 'fixed-fixture', 'executable': identity, 'inputs': INPUTS,
                      'ownership': ownership(), 'body': bytes(cpu.mem_read(BODY, 0xb3)).hex(),
                      'pool': bytes(cpu.mem_read(POOL, 800 * 256)).hex(),
                      'translationBufferBytes': cpu.ctl_get_tcg_buffer_size()}), flush=True)
    snapshots = []
    for turn in range(1, 12):
        event_start, call_start = len(events), len(direct_calls)
        guard(f'before outer call {turn}')
        for address in (0x890330, 0x890358, 0x89035c, 0x890360, 0x890380, 0x89038c):
            assert read(address, 'I') == 0
        assert all(read(TRIBE + owner * 0xc65 + 0x88d, 'I') == 0 for owner in range(4))
        write(STACK, 'I', STOP)
        cpu.reg_write(UC_X86_REG_ESP, STACK)
        try:
            cpu.emu_start(0x4ec6f0, STOP, timeout=1_000_000, count=200_000)
        except Exception:
            print(json.dumps({'kind': 'failed-call', 'turn': turn,
                              'instruction': hex(cpu.reg_read(UC_X86_REG_EIP)),
                              'events': events[event_start:], 'calls': direct_calls[call_start:],
                              'generations': generations, 'rawRecords': raw_records()}), flush=True)
            raise
        # Raw partial result is durable before any outcome assertion.
        print(json.dumps({'kind': 'returned-pending-validation', 'turn': turn,
                          'eip': cpu.reg_read(UC_X86_REG_EIP), 'esp': cpu.reg_read(UC_X86_REG_ESP),
                          'events': events[event_start:], 'calls': direct_calls[call_start:],
                          'rawRecords': raw_records()}), flush=True)
        assert cpu.reg_read(UC_X86_REG_EIP) == STOP and cpu.reg_read(UC_X86_REG_ESP) == STACK + 4
        guard(f'after outer call {turn}')
        assert not allocation_stack and not wrapper_active and not retiring_pending and not freeing_pending
        assert read(0x892443, 'I') == ARGS and read(0x89243a, 'B') == 0
        for generation in generations.values():
            if generation['born'] == turn:
                assert not generation['visits']
                generation['producedState'] = state(generation['pointer'])
        wave_rows = [(serial, g) for serial, g in generations.items() if g['model'] == 8 and g['class'] == 7]
        assert len(wave_rows) == 1
        wave_serial, wave = wave_rows[0]
        assert state(wave['pointer'])['phase'] == turn - 1 and wave['retired'] is None
        assert read(wave['pointer'] + 0x76, 'I') & 2 and read(TRIBE + 0x93d, 'I') & 1
        counts = Counter((g['class'], g['model']) for serial, g in generations.items() if serial)
        assert counts[(7, 8)] == 1 and counts[(7, 60)] == (32 if turn >= 2 else 0)
        assert counts[(7, 61)] == 32 * max(0, turn - 1)
        assert counts[(1, 7)] == counts[(7, 9)] == int(turn >= 6)
        assert counts[(7, 3)] == (32 if turn >= 6 else 0)
        if turn < 6:
            assert read(BODY + 0x6e, 'h') == 5 - turn
            assert read(BODY + 0x2d, 'B') == (5 if turn == 5 else 4)
        else:
            assert generations[0]['retired'] == 6
        if turn == 6:
            scheduled = [e['scheduled'] for e in events[event_start:] if 'scheduled' in e]
            assert scheduled.index(wave_serial) < scheduled.index(0)
            assert read(TRIBE + 0x915, 'h') == 256
            birth = [g for g in generations.values() if g['birth']]
            assert len(birth) == 34
            for g in birth:
                assert g['producedState']['h'] == (256 if g['class'] == 1 else 346)
        if turn == 7:
            sparks = sorted((serial for serial, g in generations.items() if g['birth'] and g['model'] == 3), reverse=True)
            root = next(serial for serial, g in generations.items() if g['birth'] and g['model'] == 9)
            person = next(serial for serial, g in generations.items() if g['birth'] and g['class'] == 1)
            scheduled = [e['scheduled'] for e in events[event_start:] if 'scheduled' in e]
            assert scheduled[:34] == sparks + [root, person]
        snapshots.append({'turn': turn, 'ownership': ownership(), 'wave': state(wave['pointer']),
                          'birth': {serial: deepcopy(g) for serial, g in generations.items() if g['birth']}})
        print(json.dumps({'kind': 'turn-validated', **snapshots[-1]}), flush=True)
    births = [g for g in generations.values() if g['birth']]
    root = next(g for g in births if g['model'] == 9)
    assert root['visits'] == [7, 8] and root['retired'] == 8
    for spark in (g for g in births if g['model'] == 3):
        initial_timer = spark['producedState']['remaining']
        assert initial_timer in (1, 2)
        expected_retirement = 6 + initial_timer + 3
        assert spark['retired'] == expected_retirement
        assert spark['visits'] == list(range(7, expected_retirement + 1))
    assert generations[0]['freed'] == 8 and root['freed'] == 10
    assert read(TRIBE + 0x89d, 'I') == next(g['pointer'] for g in births if g['class'] == 1)
    return {'kind': 'timeline-result', 'calls': 11, 'executable': identity, 'inputs': INPUTS,
            'translationBufferBytes': cpu.ctl_get_tcg_buffer_size(), 'snapshots': snapshots,
            'generations': generations, 'events': events, 'directCalls': direct_calls,
            'accessCounts': [[*key, count] for key, count in sorted(accesses.items())],
            'finalOwnership': ownership(),
            'finalRecords': {str(read(p + 0x24, 'H')): bytes(cpu.mem_read(p, 0xb3)).hex()
                             for p in sorted(known_records)},
            'limits': 'supplied world/ordinary-person/audio/presentation owners; no mission/app/render/full-wave claim'}


if __name__ == '__main__':
    if len(sys.argv) != 3 or sys.argv[1] != '--execute-reviewed':
        raise SystemExit('Usage only after separate approval: probe-timeline.py --execute-reviewed EXE')
    print(json.dumps(run_fixed_timeline(Path(sys.argv[2]), execute_reviewed=True)), flush=True)
