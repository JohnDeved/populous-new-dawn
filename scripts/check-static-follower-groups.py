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
    # Overlay layout/drawing, held-digit refresh, Comma, snapshot and mode-0xc entry.
    '0046960a-004697a5.asm': (0x46960a, 0x4697a5),
    '004ae0fc-004ae1c8.asm': (0x4ae0fc, 0x4ae1c8),
    '004aba5a-004aba98.asm': (0x4aba5a, 0x4aba98),
    '00435c10-00435c39.asm': (0x435c10, 0x435c39),
    '004450cb-004450e5.asm': (0x4450cb, 0x4450e5),
    '0047a691-0047a6b0.asm': (0x47a691, 0x47a6b0),
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
    # 0041c120 skips signed <= 0, so Comma's 0xff hold never counts down.
    (0x41c12a, 'jle', '0x41c134'),
    # Layout: font slot 0087cbf0 (F00T8); y = y - h(A) - (selected ? frame : frame*24/32);
    # x = x - w(A)/2; each later digit 24/32 of h(A) higher; tribe colour 005a89c8 + owner*5.
    (0x469610, 'mov', 'eax, dword ptr [0x87cbf0]'), (0x46962a, 'call', '0x46c310'),
    (0x469634, 'test', 'byte ptr [esp + 0x6c], 0x80'), (0x46964d, 'lea', 'eax, [esi + esi*2]'),
    (0x469668, 'call', '0x46c2f0'), (0x469684, 'lea', 'ecx, [eax + eax*4 + 0x5a89c8]'),
    (0x4696a0, 'push', '0x59da18'), (0x469782, 'call', '0x46c310'), (0x46978a, 'lea', 'eax, [eax + eax*2]'),
    # 004adbb0 tail: a held number-row key (scancodes 2..7) refreshes its timer unless 0xff.
    (0x4ae0fc, 'cmp', 'byte ptr [0x984593], 0'), (0x4ae117, 'mov', 'byte ptr [0x89d168], 6'),
    (0x4ae1c1, 'mov', 'byte ptr [0x89d16d], 6'),
    # Comma 0xb7 holds all six at 0xff; 0xb8 clears them.
    (0x4aba5f, 'mov', 'byte ptr [0x89d168], al'), (0x4aba87, 'mov', 'dword ptr [eax], 0'),
    # 00435c10 copies selection bit 7 into bit 0 for every tribe person; 00444f60 calls it.
    (0x435c21, 'test', 'cl, 0x80'), (0x435c26, 'or', 'cl, 1'), (0x435c2b, 'and', 'cl, 0xfe'),
    (0x4450dd, 'call', '0x435c10'),
    # 0047a550 entering mode 0xc with a selection: 0048a050(0, 0x62, 1).
    (0x47a6a7, 'push', '0x62'), (0x47a6ab, 'call', '0x48a050'),
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
    # Order finalization 00444f60 is the process_tribe_cmd case for every player order
    # type below; F00T8's 0x120-byte resource record ends with slot 0087cbf0; cue 0x62
    # (table 005acf60) names first sample 0, which the one-based SDT banks do not hold.
    for command in [0x1e, 0x26, 0x27, *range(0x37, 0x3f), *range(0x57, 0x5f)]:
        entry = read(0x4423f0 + command - 0xc, 1)[0]
        found = struct.unpack('<I', read(0x4422c0 + entry * 4, 4))[0]
        if found != 0x43edea:
            failures.append(f'command {command:#x} -> {found:08x}, expected 0043edea')
    if (read(0x5a4670, 17) != b'data\\f00t8-0.dat\0'
            or struct.unpack('<II', read(0x5a477e, 8)) != (0x9848c0, 0x87cbf0)):
        failures.append('F00T8 resource record does not own font slot 0087cbf0')
    # 0047a550's mode switch: entering mode 0xc dispatches 0047a860[0xc] -> 0047a691.
    entry = read(0x47a860 + 0xc, 1)[0]
    found = struct.unpack('<I', read(0x47a840 + entry * 4, 4))[0]
    if found != 0x47a691:
        failures.append(f'mode 0xc -> {found:08x}, expected 0047a691')
    if read(0x5acf60 + 0x62 * 12, 12) != bytes.fromhex('00000000ff0101ff00007f00'):
        failures.append('cue 0x62 record changed')
    if failures:
        print('\n'.join(failures), file=sys.stderr)
        return 1
    print(f'follower-groups static evidence: {len(EXPECTED)} instructions, '
          '24 table entries and 2 data records verified')
    return 0


if __name__ == '__main__':
    sys.exit(main())
