#!/usr/bin/env python3
"""Inspect pinned original bytes as data; never execute the original program.

This verifies instruction-window identities and literal-reference observations.
It does not evaluate a gameplay checksum or prove replay equivalence.
"""
import argparse
import hashlib
import json
from pathlib import Path
import struct

EXE_SHA256 = '3a5065c7420b3fcde208bf220bc86dfbac95e025ab2492caf9c7ea5308dfbe4f'
EXE_BYTES = 2275840
ERROR_STORES = [0x4b2c8a, 0x4b2eff, 0x4b3655, 0x4b3688,
                0x4b3af1, 0x4b3e37, 0x4b4219]


def inspect(exe):
    with exe.open('rb') as stream:
        data = stream.read(EXE_BYTES + 1)
    if len(data) != EXE_BYTES or hashlib.sha256(data).hexdigest() != EXE_SHA256:
        raise ValueError('Unexpected original executable identity')
    pe = struct.unpack_from('<I', data, 0x3c)[0]
    assert data[pe:pe + 4] == b'PE\0\0'
    count = struct.unpack_from('<H', data, pe + 6)[0]
    optional_size = struct.unpack_from('<H', data, pe + 20)[0]
    assert struct.unpack_from('<H', data, pe + 24)[0] == 0x10b
    image_base = struct.unpack_from('<I', data, pe + 52)[0]
    assert image_base == 0x400000
    sections = []
    for index in range(count):
        header = pe + 24 + optional_size + index * 40
        _, rva, size, offset = struct.unpack_from('<IIII', data, header + 8)
        sections.append((data[header:header + 8].rstrip(b'\0'),
                         image_base + rva, size, offset))

    def read(address, size):
        for _, start, length, offset in sections:
            if start <= address and address + size <= start + length:
                first = offset + address - start
                return data[first:first + size]
        raise ValueError('Window outside raw sections')

    # The complete routine and adjacent branches are retained in reviewed listings.
    windows = []
    for start, end in [(0x4439d0, 0x443b39), (0x4b3a35, 0x4b3b43),
                       (0x4b26c0, 0x4b26f2)]:
        blob = read(start, end - start)
        windows.append({'start': f'{start:08x}', 'end_exclusive': f'{end:08x}',
                        'bytes': len(blob), 'sha256': hashlib.sha256(blob).hexdigest()})

    # These are whole instructions, not inferred symbols or pseudocode types.
    anchors = {
        0x4439e3: 'a178d18900',       # live dword, not a payload pointer
        0x4439e8: 'b9c8d18900',       # four tribe records
        0x443a10: '81c1650c0000',     # tribe stride
        0x443a19: '8b1520038900',     # first live linked-list root
        0x443a77: '8b5204',           # first next link
        0x443a7e: '8b151c038900',     # second live linked-list root
        0x443ae8: '8b5204',           # second next link
        0x443b38: 'c3',
        0x4b3aad: 'e81efff8ff',       # checksum call before command dispatch
        0x4b3ab2: '3b442418',         # full 32-bit stored value comparison
        0x4b3ab8: 'b301',            # mismatch marks local error
        0x4b3aba: '8d44241c',        # command begins four bytes after checksum
        0x4b3add: 'e8feadf8ff',       # command still dispatched on mismatch
        0x4b3ae7: '893d58f69800',     # separate payload-read failure path
        0x4b26c3: 'bf50f69800',       # bulk initialization includes error byte
        0x4b26c8: 'b940000000',
        0x4b26cd: 'f3ab',
        0x4b26cf: 'aa',
    }
    for address, expected in anchors.items():
        expected_bytes = bytes.fromhex(expected)
        assert read(address, len(expected_bytes)) == expected_bytes, hex(address)

    # A literal scan is not an exhaustive indirect or overlapping-access proof.
    text_section = next(section for section in sections if section[0] == b'.text')
    _, start, length, offset = text_section
    text = data[offset:offset + length]
    needle = struct.pack('<I', 0x98f74f)
    references = []
    cursor = 0
    while True:
        position = text.find(needle, cursor)
        if position < 0:
            break
        references.append(start + position)
        cursor = position + 1
    assert references == [address + 2 for address in ERROR_STORES]
    for address in ERROR_STORES:
        assert read(address, 7) == bytes.fromhex('c6054ff7980008')
    return {'executable_sha256': EXE_SHA256, 'executable_bytes': len(data),
            'windows': windows, 'instruction_anchors': len(anchors),
            'error_literal_operand_addresses': [f'{a:08x}' for a in references],
            'error_literal_store_addresses': [f'{a:08x}' for a in ERROR_STORES],
            'original_execution': False, 'live_checksum_evaluated': False,
            'consumer_absence_proved': False}


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--exe', type=Path, required=True)
    args = parser.parse_args()
    print(json.dumps(inspect(args.exe), indent=2, sort_keys=True))
