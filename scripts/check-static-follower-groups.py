#!/usr/bin/env python3
"""Original-byte evidence for numbered follower groups (issue #1005).

Reads the SHA-locked original d3dpoptb.exe as data with Capstone 5.0.7. Nothing is
executed or emulated. Verifies the reviewed instructions and jump-table bytes listed
in decomp/research/follower-groups.md; --listing DIR rewrites the retained windows
for comparison with decomp/research/follower-groups-evidence/.
"""
from pathlib import Path
import argparse, hashlib, struct, sys

try:
    import capstone
except ImportError as error:
    raise SystemExit('Use a Python environment with Capstone 5.0.7; nothing is installed automatically.') from error

EXE_SHA = '3a5065c7420b3fcde208bf220bc86dfbac95e025ab2492caf9c7ea5308dfbe4f'
WINDOWS = {
    '0047c350-0047c4c1.asm': (0x47c350, 0x47c4c1),
    '0043f525-0043f7c3.asm': (0x43f525, 0x43f7c3),
    '004ad035-004ad15f.asm': (0x4ad035, 0x4ad15f),
    '004fee90-004feec7.asm': (0x4fee90, 0x4feec7),
    '00469515-0046960a.asm': (0x469515, 0x46960a),
    '0041c120-0041c13b.asm': (0x41c120, 0x41c13b),
}
# Independently reviewed instructions; see the research note for their meaning.
EXPECTED = [
    # 0047c350(slot, select, camera, replace): packet slot of the local player.
    (0x47c350, 'cmp', 'byte ptr [esp + 8], 0'), (0x47c357, 'je', '0x47c437'),
    (0x47c379, 'mov', 'eax, 0x3b'), (0x47c453, 'mov', 'eax, 0x3a'),
    (0x47c3b8, 'mov', 'byte ptr [ecx + 0xc], 0x47'), (0x47c3c6, 'mov', 'al, byte ptr [esp + 0x18]'),
    (0x47c492, 'mov', 'byte ptr [ecx + 0xc], 0x46'), (0x47c49e, 'mov', 'dword ptr [ecx + 8], 0'),
    (0x47c3cd, 'cmp', 'byte ptr [esp + 0x14], 0'), (0x47c402, 'test', 'byte ptr [esi + 0x7a], dl'),
    (0x47c422, 'call', '0x417ca0'), (0x47c42d, 'call', '0x504590'),
    (0x47c4bb, 'mov', 'byte ptr [eax], 6'),
    # process_tribe_cmd case 0x46: selected gains bit|1, unselected loses bit.
    (0x43f54e, 'test', 'al, 0x80'), (0x43f552, 'or', 'al, 1'), (0x43f55f, 'not', 'cl'),
    # case 0x47: availability, first-member clear unless Ctrl, select + crew, mode 0xc.
    (0x43f5cf, 'call', '0x4e3430'), (0x43f5f6, 'cmp', 'dword ptr [eax + 8], 0'),
    (0x43f61f, 'call', '0x4458d0'), (0x43f6c5, 'call', '0x4458d0'), (0x43f7b6, 'call', '0x47a550'),
    # Dispatcher: slot = action - 0x83 / - 0x89 / - 0x8f; Ctrl clears the replace flag.
    (0x4ad037, 'add', 'bl, 0x7d'), (0x4ad07e, 'add', 'bl, 0x77'), (0x4ad0c5, 'add', 'bl, 0x71'),
    (0x4ad052, 'cmp', 'byte ptr [0x9845ae], 0'), (0x4ad069, 'cmp', 'byte ptr [0x98462e], 0'),
    (0x4ad148, 'push', '1'), (0x4ad14c, 'call', '0x47c350'),
    # Recall predicate rejects game flag 0x20 and interaction modes 9/15.
    (0x4fee90, 'test', 'byte ptr [0x89d17c], 0x20'), (0x4feeac, 'cmp', 'byte ptr [0x89c6e7], 9'),
    (0x4feeb5, 'cmp', 'byte ptr [0x89c6e7], 0xf'),
    # Group-number overlay above members while a group timer is nonzero.
    (0x469518, 'test', 'al, 0x7e'), (0x4695ff, 'mov', 'byte ptr [esp + ebx + 0x2c0], 1'),
    (0x41c12c, 'dec', 'cl'),
]


def image(path):
    data = path.read_bytes()
    if hashlib.sha256(data).hexdigest() != EXE_SHA:
        raise SystemExit(f'{path}: not the pinned original executable')
    pe = struct.unpack_from('<I', data, 0x3c)[0]
    count = struct.unpack_from('<H', data, pe + 6)[0]
    optional = struct.unpack_from('<H', data, pe + 20)[0]
    base = struct.unpack_from('<I', data, pe + 52)[0]
    sections = []
    for i in range(count):
        offset = pe + 24 + optional + 40 * i
        size, address, raw_size, raw = struct.unpack_from('<IIII', data, offset + 8)
        sections.append((base + address, max(size, raw_size), raw))

    def read(address, length):
        for start, size, raw in sections:
            if start <= address < start + size:
                return data[raw + address - start:raw + address - start + length]
        raise KeyError(hex(address))
    return read


def listing(read, start, end):
    md = capstone.Cs(capstone.CS_ARCH_X86, capstone.CS_MODE_32)
    return [(i.address, i.bytes.hex(), i.mnemonic, i.op_str) for i in md.disasm(read(start, end - start), start)]


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('exe', type=Path)
    parser.add_argument('--listing', type=Path, help='existing directory for regenerated windows')
    args = parser.parse_args()
    read = image(args.exe)
    decoded = {}
    for name, (start, end) in WINDOWS.items():
        rows = listing(read, start, end)
        decoded.update({row[0]: row for row in rows})
        if args.listing:
            text = ''.join(f'{a:08x}: {b:20s} {m} {o}\n' for a, b, m, o in rows)
            (args.listing / name).write_text(text)
    failures = [f'{a:08x}: expected {m} {o}, found {decoded.get(a)}' for a, m, o in EXPECTED
                if decoded.get(a, (0, '', '', ''))[2:] != (m, o)]
    # Inline packet gates: constant 0x3b/0x3a indexes byte tables to entry 6,
    # the "write only when the player's packet slot is empty" target.
    for index_table, jump_table, constant, target in [
        (0x47c4e0, 0x47c4c4, 0x3b, 0x47c392), (0x47c544, 0x47c528, 0x3a, 0x47c46c),
    ]:
        entry = read(index_table + constant, 1)[0]
        found = struct.unpack('<I', read(jump_table + entry * 4, 4))[0]
        if found != target:
            failures.append(f'table {jump_table:08x}[{entry}] = {found:08x}, expected {target:08x}')
    # process_tribe_cmd switch: (type - 0xc) indexes 004423f0, jumps through 004422c0.
    for command, target in [(0x46, 0x43f525), (0x47, 0x43f572)]:
        entry = read(0x4423f0 + command - 0xc, 1)[0]
        found = struct.unpack('<I', read(0x4422c0 + entry * 4, 4))[0]
        if found != target:
            failures.append(f'command {command:#x} -> {found:08x}, expected {target:08x}')
    if failures:
        print('\n'.join(failures), file=sys.stderr)
        return 1
    print(f'follower-groups static evidence: {len(EXPECTED)} instructions, 4 table entries verified')
    return 0


if __name__ == '__main__':
    sys.exit(main())
