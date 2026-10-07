"""One supplied carrier arrival, real stone/root/child initialization; source only.

Reuse the accepted native_cpu and fixed-pool observer conventions. No native
execution is permitted without independent exact-source review and a resource grant.
"""
import hashlib
import json
import struct
import sys
from collections import Counter
from pathlib import Path
from time import perf_counter_ns

ROOT = Path(__file__).resolve().parents[3]
EXE_SHA = '3a5065c7420b3fcde208bf220bc86dfbac95e025ab2492caf9c7ea5308dfbe4f'
LEVEL_PATH = 'app/level-one.ts'
LEVEL_SOURCE_SHA = '97cdb6e170f68b462b5b36c42c99a598b0466e0131a105f30612f50d7f16e40c'
TRANSLATION_BUFFER_BYTES = 64 * 1024 * 1024
SCRATCH, SCRATCH_BYTES = 0x2000000, 0x200000
CARRIER, POOL, ARGS, STACK, STOP = 0x2000100, 0x2010000, 0x2180000, 0x21ed000, 0x21ef000
TABLE, TRIBE, LAND = 0x890390, 0x89d1c8, 0x8a03e4
GAME_RNG, COSMETIC_RNG = 0x89d178, 0x89bc72
SITE_XY, DESTINATION_XY, STONE_INDEX = (4352, 55040), (3328, 56064), 7
# Authored vertex inputs [82,62,92,102], explicitly supplied diagonal bit0=0.
# This is a declared raw-terrain fixture, not a recovered post-wave mission state.
GROUND = 87
FREE_RECORDS = 36
MAX_EVENTS, MAX_ACCESSES, MAX_DIRECT_CALLS = 4096, 50_000, 2048
INSTRUCTION_LIMIT, TIMEOUT_US = 200_000, 1_000_000
REAL_CALLS = {
    0x4bb290, 0x4ed8a0, 0x4ed580, 0x4ed640, 0x4ed6f0, 0x4ee470,
    0x4ee700, 0x44e940, 0x4a5ef0, 0x4a7d80, 0x4a6210, 0x4a66c0,
    0x4a7eb0, 0x586074, 0x509c10, 0x50bcd0, 0x50a740, 0x50c690,
    0x5137c0, 0x50ccd0, 0x50bf60, 0x4edcf0, 0x50a750,
}
# Original call site -> (callee, stack argument dwords, EAX result, boundary).
# Each callee returns by EIP=[ESP], ESP+=4; native caller cleans all arguments.
SUPPLIES = {
    0x4a7e82: (0x403c10, 3, 0, 'stone-shadow-presentation'),
    0x4a7f1f: (0x48a050, 3, 0, 'stone-sound-device'),
}


def sha(data):
    return hashlib.sha256(data).hexdigest()


def signed16(value):
    return (value & 0xffff) - (0x10000 if value & 0x8000 else 0)


def next_rng(value):
    value = (value * 0x24a1 + 0x24df) & 0xffffffff
    return ((value >> 13) | (value << 19)) & 0xffffffff


def capture_one_arrival(exe, *, execute_reviewed=False):
    if not execute_reviewed:
        raise RuntimeError('Separate exact-source review and resource grant required')
    # Imports/constructor below have not been invoked during source preparation.
    sys.path.insert(0, str(ROOT / 'scripts'))
    from decomp import native_cpu, configure_native_constants
    from unicorn import UC_HOOK_CODE, UC_HOOK_MEM_READ, UC_HOOK_MEM_WRITE, UC_MEM_WRITE, UC_QUERY_TIMEOUT
    from unicorn.x86_const import UC_X86_REG_EAX, UC_X86_REG_EBX, UC_X86_REG_EBP, UC_X86_REG_ESI, UC_X86_REG_EIP, UC_X86_REG_ESP

    raw = exe.read_bytes()
    assert sha(raw) == EXE_SHA
    level_raw = (ROOT / LEVEL_PATH).read_bytes()
    level = json.loads(level_raw.decode().split('export default ', 1)[1].strip().removesuffix(';'))
    assert level['sourceSha256'] == LEVEL_SOURCE_SHA
    shaman = next(o for o in level['objects'] if o['index'] == 34)
    assert (shaman['type'], shaman['model'], shaman['owner'], shaman['x'], shaman['z']) == (1, 7, 0, 9, 33)
    heights = [0] * 16384
    for x, y, height in level['heights']:
        heights[y * 128 + x] = height
    index = (DESTINATION_XY[1] >> 9) * 128 + (DESTINATION_XY[0] >> 9)
    assert [heights[index], heights[index + 128], heights[index + 129], heights[index + 1]] == [82, 62, 92, 102]

    cpu, identity = native_cpu(exe, tcg_buffer_size=TRANSLATION_BUFFER_BYTES)
    assert cpu.ctl_get_tcg_buffer_size() == TRANSLATION_BUFFER_BYTES
    configure_native_constants(cpu, exe)
    cpu.mem_map(SCRATCH, SCRATCH_BYTES)
    read = lambda address, fmt: struct.unpack('<' + fmt, cpu.mem_read(address, struct.calcsize('<' + fmt)))[0]
    write = lambda address, fmt, *values: cpu.mem_write(address, struct.pack('<' + fmt, *values))
    immutable = []
    pe = struct.unpack_from('<I', raw, 60)[0]
    section_count = struct.unpack_from('<H', raw, pe + 6)[0]
    optional_size = struct.unpack_from('<H', raw, pe + 20)[0]
    image_base = struct.unpack_from('<I', raw, pe + 52)[0]
    for offset in range(section_count):
        record = pe + 24 + optional_size + offset * 40
        name, virtual_size, address, file_size, _ = struct.unpack_from('<8sIIII', raw, record)
        characteristics = struct.unpack_from('<I', raw, record + 36)[0]
        if not characteristics & 0x80000000:
            address += image_base
            immutable.append((address, bytes(cpu.mem_read(address, max(virtual_size, file_size))), name.rstrip(b'\0').decode()))
    constants = json.loads((ROOT / 'app/original-constants.json').read_text())
    count = 0
    for offset in range(512):
        descriptor = bytes(cpu.mem_read(0x5aa5f0 + offset * 31, 31))
        name = descriptor[:25].split(b'\0')[0].decode()
        if not name:
            break
        if name in constants:
            size, address = descriptor[25], struct.unpack('<I', descriptor[27:])[0]
            immutable.append((address, bytes(cpu.mem_read(address, size)), name))
            count += 1
    assert count == 244

    def guard(label):
        for address, expected, name in immutable:
            assert bytes(cpu.mem_read(address, len(expected))) == expected, (label, name, hex(address))

    guard('before fixture')
    cpu.mem_write(TABLE, bytes(0x2000))  # Stops before the preserved search-table gap.
    cpu.mem_write(TRIBE, bytes(4 * 0xc65))
    land_bytes = b''.join(struct.pack('<IhH8x', 0, height, 0) for height in heights)
    cpu.mem_write(LAND, land_bytes)
    for address in (0x89031c, 0x890320, 0x890324, 0x890328, 0x89c651,
                    0x89c659, 0x89c661, 0x895da4, 0x895da8, 0x897981, 0x96aa70,
                    0x98e7e4):
        write(address, 'I', 0)
    write(0x892443, 'I', ARGS)
    write(0x89243a, 'B', 0)
    write(0x89ce37, 'B', 0)
    write(0x89c6f0, 'B', 0)
    write(0xafc2f4, 'I', 0)  # Declared no-UI/audio context: original004b2670 returns0.
    immutable.append((0xafc2f4, bytes(4), 'disabled audio UI pointer'))
    write(0x89c6dd, 'H', 2)
    write(0x89d17c, 'I', 32)
    write(0x89d180, 'I', 1)
    write(GAME_RNG, 'I', 0x12345678)
    write(COSMETIC_RNG, 'I', 0x11223344)
    cpu.mem_write(0x96eac1, bytes(12))
    write(0x96eac1 + 8, 'B', 1)  # One supplied, previously allocated carrier.
    assert bytes(cpu.mem_read(0x5a6830 + 5 * 3, 3)) == bytes.fromhex('130842')
    assert bytes(cpu.mem_read(0x5a6830 + 7 * 3, 3)) == bytes.fromhex('5e2802')
    assert bytes(cpu.mem_read(0x5a6830 + 8 * 3, 3)) == bytes.fromhex('082002')
    stone_descriptor = 0x5a79b0 + 12 * 24
    assert bytes(cpu.mem_read(stone_descriptor, 24)).hex() == '240000000000000000001e0000000000a8060a0400076800'
    assert read(stone_descriptor + 20, 'B') & 4 == 0  # 00494f50 is unreachable.
    assert read(stone_descriptor + 21, 'B') & 4  # No nearby-tribe notification scan.
    assert read(stone_descriptor + 20, 'I') & 0x03000000 == 0  # Normal high-pool path.

    known_records = {CARRIER, *(POOL + i * 256 for i in range(FREE_RECORDS))}
    for offset in range(FREE_RECORDS):
        record, handle = POOL + offset * 256, 641 + offset
        write(record, 'II', record - 256 if offset else 0,
              record + 256 if offset + 1 < FREE_RECORDS else 0)
        write(record + 0x24, 'H', handle)
        write(TABLE + handle * 4, 'I', record)
    write(0x89031c, 'I', POOL)
    write(0x890324, 'I', CARRIER)
    write(0x89c651, 'I', 1)
    write(TABLE + 640 * 4, 'I', CARRIER)
    write(CARRIER + 0x24, 'H', 640)
    write(CARRIER + 0x2a, 'BBBBBB', 8, 1, 1, 0, 0, 0)
    write(CARRIER + 0xc, 'I', 0x20000)
    write(CARRIER + 0x3d, 'HHh', *DESTINATION_XY, GROUND)
    write(CARRIER + 0x57, 'HHH', 0, 0, 0)
    write(CARRIER + 0x76, 'HHh', *DESTINATION_XY, GROUND)
    write(CARRIER + 0x7c, 'BBBB', 7, 7, 3, 0)
    write(CARRIER + 0x80, 'hHHh', STONE_INDEX, *DESTINATION_XY, 0)
    write(LAND + index * 16 + 6, 'H', 640)
    write(TRIBE + 0x911, 'HHh', *SITE_XY, 64)
    write(TRIBE + 0xc20, 'B', 1)
    assert read(TRIBE + 0xa0d + STONE_INDEX * 2, 'H') == 0
    immutable.append((TABLE, bytes(cpu.mem_read(TABLE, 0x2000)), 'handle table'))
    guard('after fixture')

    mutable = [(SCRATCH, SCRATCH + SCRATCH_BYTES), (TRIBE, TRIBE + 4 * 0xc65),
               (LAND, LAND + 0x40000), (0x89031c, 0x89032c),
               (0x89243a, 0x89243b), (0x892443, 0x892447),
               (0x89c651, 0x89c655), (0x89c659, 0x89c65d),
               (GAME_RNG, GAME_RNG + 4), (COSMETIC_RNG, COSMETIC_RNG + 4),
               (0x89d180, 0x89d184), (0x89ce37, 0x89ce38),
               (0x96eac1, 0x96eacd), (0x98e7e4, 0x98e7e8)]
    events, allocations, allocation_stack, grounds, pending_ground, direct_calls, births = [], [], [], [], [], [], []
    accesses = Counter()
    instruction_callbacks, supplied_skips = 0, 0
    post_arrival_visits = []
    supplied_targets = {spec[0] for spec in SUPPLIES.values()}

    def event(row):
        assert len(events) < MAX_EVENTS, 'event cap reached'
        events.append(row)

    def rngs():
        return {'gameplay': read(GAME_RNG, 'I'), 'cosmetic': read(COSMETIC_RNG, 'I')}

    def xyz(pointer):
        assert pointer in known_records
        raw_position = bytes(cpu.mem_read(pointer + 0x3d, 6))
        return {'rawXYZ': raw_position.hex(), 'xyz': list(struct.unpack('<HHh', raw_position))}

    def record(pointer):
        assert pointer in known_records
        return {'pointer': pointer, 'handle': read(pointer + 0x24, 'H'),
                'class': read(pointer + 0x2a, 'B'), 'model': read(pointer + 0x2b, 'B'),
                'state': read(pointer + 0x2c, 'B'), 'flags2': read(pointer + 0xc, 'I'),
                **xyz(pointer), 'recordHex': bytes(cpu.mem_read(pointer, 0xb3)).hex()}

    def raw_ownership():
        return {'active': read(0x890324, 'I'), 'retiring': read(0x890328, 'I'),
                'highFree': read(0x89031c, 'I'), 'lowFree': read(0x890320, 'I'),
                'allocated': read(0x89c651, 'I'), 'lowCount': read(0x89c659, 'I'),
                'allocatedEver': read(0x89d180, 'I'),
                'argumentStack': read(0x892443, 'I'), 'argumentFlag': read(0x89243a, 'B'),
                'stoneHandle': read(TRIBE + 0xa0d + STONE_INDEX * 2, 'H'),
                'soundCounter': read(0x98e7e4, 'I'), 'classSeeds': list(cpu.mem_read(0x96eac1, 12))}

    initial = {'carrier': record(CARRIER), 'poolHex': bytes(cpu.mem_read(POOL, FREE_RECORDS * 256)).hex(),
               'ownership': raw_ownership(), 'rngs': rngs(),
               'terrainSha256': sha(land_bytes), 'terrainWithCarrierSha256': sha(bytes(cpu.mem_read(LAND, 0x40000))),
               'importedLevelSha256': sha(level_raw), 'originalLevelSha256': LEVEL_SOURCE_SHA,
               'audioUiPointer': 0, 'audioMeaning': '004b2670 early return; no active-audio RNG claim',
               'terrainDiagonalFlags': 0, 'terrainMeaning': 'authored raw vertices; supplied diagonal0, not post-wave state',
               'siteXYZ': list(struct.unpack('<HHh', cpu.mem_read(TRIBE + 0x911, 6))),
               'tribesHex': bytes(cpu.mem_read(TRIBE, 4 * 0xc65)).hex()}

    def on_memory(_, access, address, size, value, user):
        eip = cpu.reg_read(UC_X86_REG_EIP)
        key = (access, eip, address, size)
        assert key in accesses or len(accesses) < MAX_ACCESSES, 'access cap reached'
        accesses[key] += 1
        if access != UC_MEM_WRITE:
            return
        assert any(start <= address and address + size <= end for start, end in mutable), ('unclassified write', hex(eip), hex(address), size)
        for start, expected, name in immutable:
            assert address + size <= start or address >= start + len(expected), ('immutable write', name)
        if LAND <= address < LAND + 0x40000:
            assert (address - LAND) % 16 == 6 and size == 2, ('non-cell-link terrain write', hex(eip), hex(address), size)
        if address in (GAME_RNG, COSMETIC_RNG):
            event({'rngWrite': [hex(eip), hex(address), size, value]})
        for pointer in known_records:
            if address < pointer + 0x43 and address + size > pointer + 0x3d:
                event({'positionWrite': {'instruction': hex(eip), 'pointer': pointer,
                       'address': address, 'size': size, 'value': value,
                       'beforeXYZ': xyz(pointer)}})
                break

    def on_code(_, address, size, user):
        nonlocal instruction_callbacks, supplied_skips
        instruction_callbacks += 1
        assert instruction_callbacks <= INSTRUCTION_LIMIT, 'instruction callback cap reached'
        sp = cpu.reg_read(UC_X86_REG_ESP)
        instruction = bytes(cpu.mem_read(address, size))
        if instruction[:1] == b'\xe8':
            target = address + 5 + struct.unpack('<i', instruction[1:5])[0]
            assert len(direct_calls) < MAX_DIRECT_CALLS, 'direct-call cap reached'
            direct_calls.append([hex(address), hex(target)])
            if address in SUPPLIES:
                assert target == SUPPLIES[address][0]
            else:
                assert target in REAL_CALLS, ('unclassified direct call', hex(address), hex(target))
        if instruction[:1] == b'\xff' and len(instruction) > 1:
            assert ((instruction[1] >> 3) & 7) not in (2, 3), ('unexpected indirect call', hex(address))
        if pending_ground and address == pending_ground[-1]['return'] and sp == pending_ground[-1]['sp'] + 4:
            sample = pending_ground.pop()
            sample['rawEax'] = cpu.reg_read(UC_X86_REG_EAX)
            sample['height'] = signed16(sample['rawEax'])
            grounds.append(sample)
            event({'groundReturn': sample.copy()})
        if address in supplied_targets:
            site = read(sp, 'I') - 5
            assert site in SUPPLIES and SUPPLIES[site][0] == address, ('unqualified supply', hex(address), hex(site))
            target, argc, result, label = SUPPLIES[site]
            arguments = list(struct.unpack('<' + 'I' * argc, cpu.mem_read(sp + 4, 4 * argc)))
            stone = arguments[0]
            assert stone in known_records and (read(stone + 0x2a, 'B'), read(stone + 0x2b, 'B')) == (5, 12)
            assert arguments[1:] == ([4, 1] if label == 'stone-shadow-presentation' else [159, 0])
            if label == 'stone-sound-device':
                assert read(0xafc2f4, 'I') == 0, 'sound supply requires original no-UI early-return condition'
            supplied_skips += 1
            event({'supplied': label, 'callSite': hex(site), 'callee': hex(target),
                   'arguments': arguments, 'resultEax': result, 'stone': record(stone), 'rngs': rngs()})
            cpu.reg_write(UC_X86_REG_EAX, result)
            cpu.reg_write(UC_X86_REG_EIP, read(sp, 'I'))
            cpu.reg_write(UC_X86_REG_ESP, sp + 4)
            return
        if address == 0x44e940:
            pending_ground.append({'sp': sp, 'return': read(sp, 'I'),
                'xy': [read(sp + 4, 'I') & 65535, read(sp + 8, 'I') & 65535],
                'allocatorDepth': len(allocation_stack)})
        elif address == 0x4ed8a0:
            assert len(allocations) < FREE_RECORDS, 'extra allocation attempt'
            cls, model, owner, point = struct.unpack('<4I', cpu.mem_read(sp + 4, 16))
            row = {'attempt': len(allocations), 'sp': sp, 'return': read(sp, 'I'),
                   'class': cls & 255, 'model': model & 255, 'owner': owner & 255,
                   'pointPointer': point, 'pointXYZHex': bytes(cpu.mem_read(point, 6)).hex(),
                   'pointXYZ': list(struct.unpack('<HHh', cpu.mem_read(point, 6))),
                   'argumentStack': read(0x892443, 'I'), 'argumentFlag': read(0x89243a, 'B'),
                   'argumentWords': list(struct.unpack('<5I', cpu.mem_read(ARGS, 20))), 'rngs': rngs()}
            allocations.append(row)
            allocation_stack.append(row)
            event({'allocationEntry': row.copy()})
        elif address == 0x4edad6:
            assert allocation_stack
            row = allocation_stack.pop()
            assert sp == row['sp'] and read(sp, 'I') == row['return']
            pointer = cpu.reg_read(UC_X86_REG_EAX)
            row['result'] = pointer
            row['afterRngs'] = rngs()
            row['afterArgumentStack'] = read(0x892443, 'I')
            row['afterArgumentFlag'] = read(0x89243a, 'B')
            row['returnedRecord'] = record(pointer) if pointer else None
            event({'allocationReturn': row.copy()})
        elif address == 0x50bcd0:
            pointer = read(sp + 4, 'I')
            if read(pointer + 0x2b, 'B') == 9:
                event({'rootBeforeCommon': record(pointer), 'rngs': rngs()})
        elif address == 0x50ccd0:
            pointer = read(sp + 4, 'I')
            assert read(pointer + 0x2b, 'B') == 9
            assert read(pointer + 0xc, 'I') & 0x400 == 0
            event({'rootAfterCommon': record(pointer), 'rngs': rngs()})
        elif address == 0x50cd45:
            event({'rootAfterOffset': record(cpu.reg_read(UC_X86_REG_EBX)), 'rngs': rngs()})
        elif address == 0x50ce6f:
            pointer = cpu.reg_read(UC_X86_REG_EBP)
            assert pointer in known_records
            birth = {'record': record(pointer), 'rngs': rngs()}
            births.append(birth)
            event({'childBirth': birth})
        elif address == 0x4edcf0:
            pointer = read(sp + 4, 'I')
            assert pointer in known_records and (read(pointer + 0x2a, 'B'), read(pointer + 0x2b, 'B')) == (7, 7)
            assert read(pointer + 0xc, 'I') & 0x04000000 == 0
            event({'effect7RetirementEntry': record(pointer)})
        elif address == 0x50a750:
            pointer = read(sp + 4, 'I')
            assert read(sp, 'I') == 0x4bb344
            assert (read(pointer + 0x2a, 'B'), read(pointer + 0x2b, 'B'), read(pointer + 0x2c, 'B')) == (0, 7, 0)
            assert bytes(cpu.mem_read(pointer + 0x57, 6)) == bytes(cpu.mem_read(CARRIER + 0x57, 6))
            post_arrival_visits.append(record(pointer))
            event({'retiredEffect7ImmediateVisit': record(pointer)})

    cpu.hook_add(UC_HOOK_CODE, on_code)
    cpu.hook_add(UC_HOOK_MEM_READ | UC_HOOK_MEM_WRITE, on_memory)
    write(STACK, 'II', STOP, CARRIER)
    cpu.reg_write(UC_X86_REG_ESP, STACK)
    started = perf_counter_ns()

    def output(status, error=None):
        return {'status': status, 'error': error, 'executable': identity, 'initial': initial,
                'instruction': hex(cpu.reg_read(UC_X86_REG_EIP)),
                'stackPointer': cpu.reg_read(UC_X86_REG_ESP), 'rawEax': cpu.reg_read(UC_X86_REG_EAX),
                'metrics': {'elapsedNs': perf_counter_ns() - started, 'instructionCallbacks': instruction_callbacks,
                            'suppliedEntrySkips': supplied_skips, 'unicornTimeout': bool(cpu.query(UC_QUERY_TIMEOUT))},
                'ownership': raw_ownership(), 'rngs': rngs(), 'events': events, 'allocations': allocations,
                'grounds': grounds, 'births': births, 'directCalls': direct_calls,
                'accesses': [[*key, count] for key, count in sorted(accesses.items())],
                'records': {str(read(p + 0x24, 'H')): bytes(cpu.mem_read(p, 0xb3)).hex() for p in sorted(known_records)}}

    try:
        # Exactly one original entry and one return; no case/turn/retry loop.
        cpu.emu_start(0x4bb290, STOP, timeout=TIMEOUT_US, count=INSTRUCTION_LIMIT)
        assert not cpu.query(UC_QUERY_TIMEOUT), 'native timeout'
        assert cpu.reg_read(UC_X86_REG_EIP) == STOP
        assert cpu.reg_read(UC_X86_REG_ESP) == STACK + 4
        guard('after one arrival')
        assert not pending_ground and not allocation_stack
        assert [(r['class'], r['model']) for r in allocations] == [(7, 7), (5, 12), (7, 51), (7, 9)] + [(7, 3)] * 32
        assert all(r['result'] for r in allocations) and len({r['result'] for r in allocations}) == FREE_RECORDS
        assert [r['result'] for r in allocations] == [POOL + i * 256 for i in range(FREE_RECORDS)]
        assert (allocations[0]['argumentStack'], allocations[0]['argumentFlag']) == (ARGS + 20, 1)
        assert allocations[0]['argumentWords'] == [7, 3328, (-9472) & 0xffffffff, 0, 0]
        assert all((r['argumentStack'], r['argumentFlag']) == (ARGS, 0) for r in allocations[1:])
        effect7, stone, dust, root = [r['result'] for r in allocations[:4]]
        assert allocations[1]['returnedRecord']['xyz'] == [*DESTINATION_XY, GROUND - 240]
        assert allocations[3]['pointXYZ'] == [*DESTINATION_XY, GROUND - 240]
        assert allocations[2]['returnedRecord']['xyz'] == [*DESTINATION_XY, GROUND - 112]
        assert [e['rootBeforeCommon']['xyz'] for e in events if 'rootBeforeCommon' in e] == [[*DESTINATION_XY, GROUND - 240]]
        assert [e['rootAfterCommon']['xyz'] for e in events if 'rootAfterCommon' in e] == [[*DESTINATION_XY, GROUND]]
        assert [e['rootAfterOffset']['xyz'] for e in events if 'rootAfterOffset' in e] == [[*DESTINATION_XY, GROUND + 90]]
        assert len(grounds) == 70 and all(r['xy'] == list(DESTINATION_XY) and r['height'] == GROUND for r in grounds)
        assert len(births) == 32 and len(post_arrival_visits) == 1
        expected_game, expected_cosmetic = 0x12345678, 0x11223344
        for birth, allocation in zip(births, allocations[4:]):
            assert birth['record']['pointer'] == allocation['result']
            assert birth['record']['xyz'] == [*DESTINATION_XY, GROUND + 90]
            assert allocation['rngs'] == {'gameplay': expected_game, 'cosmetic': expected_cosmetic}
            expected_cosmetic = next_rng(expected_cosmetic)
            expected_game = next_rng(expected_game)
            remaining = expected_game % 2 + 1
            expected_game = next_rng(expected_game)
            pitch = expected_game & 2047
            expected_game = next_rng(expected_game)
            yaw = expected_game & 2047
            p = allocation['result']
            assert (read(p + 0x6c, 'h'), read(p + 0x5f, 'h'), read(p + 0x59, 'H'), read(p + 0x57, 'H')) == (remaining, 60, pitch, yaw)
            assert birth['rngs'] == {'gameplay': expected_game, 'cosmetic': expected_cosmetic}
        assert rngs() == {'gameplay': expected_game, 'cosmetic': expected_cosmetic}
        rng_writes = [e['rngWrite'] for e in events if 'rngWrite' in e]
        assert len(rng_writes) == 192
        assert Counter((int(eip, 16), int(address, 16), size) for eip, address, size, _ in rng_writes) == Counter({
            (0x50bfdd, COSMETIC_RNG, 4): 32, (0x50bff6, COSMETIC_RNG, 4): 32,
            (0x50cda4, GAME_RNG, 4): 32, (0x50cdb8, GAME_RNG, 4): 32,
            (0x50ce0e, GAME_RNG, 4): 32, (0x50ce43, GAME_RNG, 4): 32})
        assert [e['supplied'] for e in events if 'supplied' in e] == ['stone-shadow-presentation', 'stone-sound-device']
        assert read(TRIBE + 0xa0d + STONE_INDEX * 2, 'H') == read(stone + 0x24, 'H')
        assert cpu.reg_read(UC_X86_REG_EAX) == effect7 and read(effect7 + 0x2a, 'B') == 0
        assert read(effect7 + 0xc, 'I') & 1 and read(effect7 + 0x2e, 'B') == 3
        assert read(0x890328, 'I') == effect7 and read(0x89031c, 'I') == read(0x890320, 'I') == 0
        assert read(0x89c651, 'I') == read(0x89d180, 'I') == 37 and read(0x89c659, 'I') == 0
        assert read(0x892443, 'I') == ARGS and read(0x89243a, 'B') == 0
        assert read(0x98e7e4, 'I') == 1
        assert [read(0x96eac1 + cls, 'B') for cls in (5, 7, 8)] == [1, 35, 1]
        current_land = bytearray(cpu.mem_read(LAND, 0x40000))
        for cell in range(16384):
            current_land[cell * 16 + 6:cell * 16 + 8] = b'\0\0'
        assert bytes(current_land) == land_bytes
        # Both real global and cell lists must retain exactly their allocated owners.
        chain, previous, p = [], 0, read(0x890324, 'I')
        while p:
            assert p in known_records and p not in chain and read(p, 'I') == previous
            chain.append(p)
            previous, p = p, read(p + 4, 'I')
        assert set(chain) == known_records - {effect7} and len(chain) == 36
        members, previous, handle = [], 0, read(LAND + index * 16 + 6, 'H')
        while handle:
            p = read(TABLE + handle * 4, 'I')
            assert p in known_records and p not in members and read(p + 0x22, 'H') == previous
            assert read(p + 0xc, 'I') & 0x20000
            members.append(p)
            previous, handle = handle, read(p + 0x20, 'H')
        assert set(members) == set(chain)
        assert not read(effect7 + 0xc, 'I') & 0x20000
    except Exception as error:
        print(json.dumps(output('failed', repr(error))), flush=True)
        raise
    result = output('passed')
    result['limits'] = 'One supplied carrier/terrain/pool arrival component; no command18, carrier movement, scheduled lifetime, old-stone, exhaustion, active-audio RNG, full mission or rendering claim.'
    return result


if __name__ == '__main__':
    if len(sys.argv) != 3 or sys.argv[1] != '--execute-reviewed':
        raise SystemExit('Use the separately authorized one-shot launcher; no direct preparation run')
    print(json.dumps(capture_one_arrival(Path(sys.argv[2]), execute_reviewed=True)), flush=True)
