"""Pure replay of observer-ordered memory masks; never executes original code.

Call replay_receipt with receipt bytes and a separately reviewed contract, each
bound to an independently supplied SHA-256. This is not a native acceptance gate.
"""
import hashlib
import heapq
import json
import re

STREAMS = ('memoryReads', 'memoryWrites', 'invalidationEvents')
REGISTERS = frozenset(('eax', 'ebx', 'ecx', 'edx', 'esi', 'edi', 'ebp', 'esp', 'eip', 'eflags'))


def require(condition, message):
    if not condition:
        raise ValueError(message)


def number(value, label):
    """Accept the producer's integers/hex strings, never bools or coercible floats."""
    if type(value) is int:
        return value
    if isinstance(value, str) and re.fullmatch(r'0x[0-9a-f]+', value):
        return int(value, 16)
    raise ValueError(f'{label}: expected integer or lowercase hexadecimal')


def integer(value, label):
    require(type(value) is int and value >= 0, f'{label}: expected nonnegative integer')
    return value


def mask(value, size):
    result = number(value, 'knownMask')
    require(0 <= result < (1 << (8 * size)), 'knownMask exceeds byte width')
    return result


def digest(raw):
    return hashlib.sha256(raw).hexdigest()


def contract_digest(contract):
    return digest(json.dumps(contract, sort_keys=True, separators=(',', ':'), allow_nan=False).encode())


def check_hash(actual, expected, label):
    require(isinstance(expected, str) and re.fullmatch(r'[0-9a-f]{64}', expected), f'{label}: invalid expected hash')
    require(actual == expected, f'{label}: hash mismatch')


def strict_object(pairs):
    result = {}
    for key, value in pairs:
        require(key not in result, f'duplicate JSON key: {key}')
        result[key] = value
    return result


def reject_constant(value):
    raise ValueError(f'nonfinite JSON value: {value}')


def bounds(value, label):
    require(isinstance(value, list) and len(value) == 2, f'{label}: expected [start,endExclusive]')
    lo, hi = (number(v, label) for v in value)
    require(0 <= lo < hi <= 1 << 32, f'{label}: invalid 32-bit range')
    return lo, hi


class Replay:
    """Final memory masks and last event provenance, not memory values/register state."""
    def __init__(self, memory_ranges):
        self.ranges = memory_ranges
        self.known = {}
        self.sources = {}
        self.writers = {}
        self.reads = []
        self.counts = {name: 0 for name in STREAMS}

    def span(self, address, size):
        address = number(address, 'address')
        integer(size, 'size')
        require(size > 0, 'size must be positive')
        require(any(lo <= address and address + size <= hi for lo, hi in self.ranges), 'address outside admitted memory')
        return address

    def known_mask(self, address, size):
        address = self.span(address, size)
        return sum(self.known.get(address + i, 0) << (8 * i) for i in range(size))

    def byte_sources(self, address, size):
        address = self.span(address, size)
        return [self.sources.get(address + i, ('unknown',)) for i in range(size)]

    def byte_writers(self, address, size):
        """Last recorded native write even if later invalidation made bits unknown."""
        address = self.span(address, size)
        return [self.writers.get(address + i) for i in range(size)]

    def put(self, address, size, known, source):
        for i in range(size):
            self.known[address + i] = (known >> (8 * i)) & 255
            self.sources[address + i] = source
            if source[0] == 'write':
                self.writers[address + i] = source


def ordered_rows(rows, stream):
    require(isinstance(rows, list), f'{stream}: expected array')
    previous = -1
    for row in rows:
        require(isinstance(row, dict), f'{stream}: expected event object')
        ordinal = integer(row.get('eventOrdinal'), 'eventOrdinal')
        require(ordinal > previous, f'{stream}: duplicate/reordered ordinal')
        previous = ordinal
        yield ordinal, stream, row


def invalidation(row, state):
    """Extract only the shared memory/register contract; extra producer fields remain."""
    common = ('eventOrdinal', 'pc', 'target', 'knownMask', 'reason')
    require(all(key in row for key in common), 'incomplete invalidation')
    require(0 <= number(row['pc'], 'invalidation pc') < 1 << 32, 'invalid invalidation PC')
    require(isinstance(row['reason'], str) and row['reason'].strip(), 'invalidation reason missing')
    require(row['target'] in ('memory', 'register'), 'unknown invalidation target')
    result = {key: row[key] for key in common}
    if row['target'] == 'memory':
        require('register' not in row, 'mixed invalidation target')
        result.update(address=row.get('address'), size=row.get('size'))
        state.span(result['address'], result['size'])
        mask(result['knownMask'], result['size'])
    else:
        require('address' not in row, 'mixed invalidation target')
        result.update(register=row.get('register'), size=row.get('size'))
        require(isinstance(result['register'], str) and result['register'] in REGISTERS, 'unknown register')
        require(type(result['size']) is int and result['size'] == 4, 'register width must be four bytes')
        mask(result['knownMask'], 4)
    return result


def replay_receipt(raw, expected_sha256, contract, expected_contract_sha256):
    """Return Replay or raise ValueError. Expected identities must not come from raw.

    Contract: case label, exact eventStream metadata, memoryRanges,
    forbiddenPcRanges (memory accesses only), pcRules per read/write PC with sizes
    and optional knownMasks, initialMemory (verified by caller), and exact ordered
    invalidation descriptors including eventOrdinal. See engineering documentation.
    """
    require(isinstance(raw, bytes), 'receipt must be bytes')
    check_hash(digest(raw), expected_sha256, 'receipt')
    require(isinstance(contract, dict), 'contract must be an object')
    check_hash(contract_digest(contract), expected_contract_sha256, 'contract')
    required = {'case', 'eventStream', 'memoryRanges', 'forbiddenPcRanges', 'pcRules', 'initialMemory', 'invalidationEvents'}
    require(set(contract) == required, 'incomplete/unknown contract fields')
    require(isinstance(contract['case'], str) and contract['case'].strip(), 'case label missing')
    receipt = json.loads(raw, object_pairs_hook=strict_object, parse_constant=reject_constant)
    require(isinstance(receipt, dict), 'receipt must be an object')
    require(receipt.get('abortedInstructions') == [], 'aborted instructions are outside successful replay scope')
    metadata = receipt.get('eventStream')
    require(metadata == contract['eventStream'], 'eventStream differs from independent contract')
    require(isinstance(metadata, dict) and set(metadata) == {'schemaVersion', 'ordering', 'eventCount', 'firstOrdinal', 'lastOrdinal', 'counts'}, 'invalid eventStream shape')
    require(type(metadata['schemaVersion']) is int and metadata['schemaVersion'] == 1 and metadata['ordering'] == 'observer', 'unsupported event ordering')
    total = integer(metadata['eventCount'], 'eventCount')
    counts = metadata['counts']
    require(isinstance(counts, dict) and set(counts) == set(STREAMS), 'invalid stream counts')
    require(sum(integer(counts[name], name) for name in STREAMS) == total, 'stream counts do not sum to total')
    if total:
        require(type(metadata['firstOrdinal']) is int and metadata['firstOrdinal'] == 0, 'firstOrdinal must be zero')
        require(type(metadata['lastOrdinal']) is int and metadata['lastOrdinal'] == total - 1, 'lastOrdinal mismatch')
    else:
        require(metadata['firstOrdinal'] is None and metadata['lastOrdinal'] is None, 'empty ordinal extent must be null')
    require(isinstance(contract['memoryRanges'], list) and contract['memoryRanges'], 'memoryRanges missing')
    ranges = sorted(bounds(v, 'memoryRanges') for v in contract['memoryRanges'])
    require(all(a[1] <= b[0] for a, b in zip(ranges, ranges[1:])), 'overlapping memoryRanges')
    require(isinstance(contract['forbiddenPcRanges'], list), 'forbiddenPcRanges must be an array')
    forbidden = [bounds(v, 'forbiddenPcRanges') for v in contract['forbiddenPcRanges']]
    state = Replay(ranges)
    require(isinstance(contract['initialMemory'], list), 'initialMemory must be an array')
    for item in contract['initialMemory']:
        require(isinstance(item, dict) and set(item) == {'address', 'size', 'knownMask', 'source'}, 'invalid initialMemory shape')
        address, size = state.span(item['address'], item['size']), item['size']
        require(isinstance(item['source'], str) and item['source'].strip(), 'initial memory source missing')
        require(not any(address + i in state.known for i in range(size)), 'overlapping initial memory')
        state.put(address, size, mask(item['knownMask'], size), ('initial', item['source']))
    rules = contract['pcRules']
    require(isinstance(rules, dict) and set(rules) == set(STREAMS[:2]), 'invalid pcRules')
    normalized_rules = {}
    for stream in STREAMS[:2]:
        require(isinstance(rules[stream], dict), 'PC rules must be an object')
        normalized_rules[stream] = {}
        for pc, rule in rules[stream].items():
            address = number(pc, 'pc')
            require(0 <= address < 1 << 32 and address not in normalized_rules[stream], 'invalid/duplicate PC rule')
            require(isinstance(rule, dict) and 'sizes' in rule and set(rule) <= {'sizes', 'knownMasks'}, 'invalid PC rule shape')
            require(isinstance(rule['sizes'], list) and rule['sizes'] and all(type(n) is int and 0 < n <= 16 for n in rule['sizes']), 'invalid access widths')
            if 'knownMasks' in rule:
                require(isinstance(rule['knownMasks'], list) and rule['knownMasks'], 'empty knownMasks')
                require(all(number(k, 'knownMasks') >= 0 for k in rule['knownMasks']), 'negative knownMasks')
            normalized_rules[stream][address] = rule
    require(isinstance(contract['invalidationEvents'], list), 'invalidations must be an array')
    expected_invalidations = contract['invalidationEvents']
    require(len(expected_invalidations) == counts['invalidationEvents'], 'invalidation count differs from contract')
    for item in expected_invalidations:
        require(isinstance(item, dict) and invalidation(item, state) == item, 'invalid expected invalidation shape')
        integer(item['eventOrdinal'], 'invalidation ordinal')
    streams = []
    for stream in STREAMS:
        rows = receipt.get(stream)
        require(isinstance(rows, list) and len(rows) == counts[stream], f'{stream}: count mismatch')
        streams.append(ordered_rows(rows, stream))
    for expected_ordinal, (ordinal, stream, row) in enumerate(heapq.merge(*streams)):
        require(ordinal == expected_ordinal, 'missing/duplicate shared ordinal')
        index = state.counts[stream]
        state.counts[stream] += 1
        if stream == 'invalidationEvents':
            observed = invalidation(row, state)
            require(observed == expected_invalidations[index], 'invalidation differs from independent boundary contract')
            if row['target'] == 'memory':
                address, size = state.span(row['address'], row['size']), row['size']
                known = mask(row['knownMask'], size)
                require(known & ~state.known_mask(address, size) == 0, 'invalidation promotes unknown memory')
                state.put(address, size, known, ('invalidation', ordinal, row['pc'], row['reason']))
            continue
        pc = number(row.get('pc'), 'pc')
        require(pc in normalized_rules[stream], 'unknown/unapproved memory PC')
        require(not any(lo <= pc < hi for lo, hi in forbidden), 'memory PC inside forbidden window')
        rule = normalized_rules[stream][pc]
        size = row.get('size')
        require(type(size) is int and size in rule['sizes'], 'unapproved access width')
        address = state.span(row.get('address'), size)
        known = mask(row.get('knownMask'), size)
        if 'knownMasks' in rule:
            require(known in [number(k, 'knownMasks') for k in rule['knownMasks']], 'knownMask violates PC contract')
        if stream == 'memoryReads':
            require(known == state.known_mask(address, size), f'read provenance mismatch at ordinal {ordinal}')
            state.reads.append({'eventOrdinal': ordinal, 'pc': row['pc'], 'address': row['address'], 'size': size,
                                'knownMask': row['knownMask'], 'byteSources': state.byte_sources(address, size),
                                'byteWriters': state.byte_writers(address, size)})
        else:
            require(row.get('committed') is True, 'uncommitted write in committed stream')
            state.put(address, size, known, ('write', ordinal, row['pc']))
    require(state.counts == counts, 'replayed counts differ')
    return state
