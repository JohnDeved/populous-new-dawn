#!/usr/bin/env python3
"""Original-byte evidence for spell Ctrl casting and modified charging (issue #1008).

Reads the SHA-locked original d3dpoptb.exe as data with Capstone 5.0.7. Nothing is
executed or emulated. Verifies the default input records, reviewed instructions and
switch-table entries listed in decomp/research/spell-modifier-controls.md.
"""
from pathlib import Path
import argparse, hashlib, struct, sys

try:
    import capstone
except ImportError as error:
    raise SystemExit('Use a Python environment with Capstone 5.0.7; nothing is installed automatically.') from error

EXE_SHA = '3a5065c7420b3fcde208bf220bc86dfbac95e025ab2492caf9c7ea5308dfbe4f'
# 12-byte default records: key f0 (left), action, flags 0x0c (scancode|release),
# modifier byte (0 none, 2 Ctrl, 0x40 any), gate 0, predicate.
RECORDS = {
    0x5d628c: (0xf0, 0x6a, 0x0c, 0x00, 0, 0x4fefe0),
    0x5d6298: (0xf0, 0x6b, 0x0c, 0x02, 0, 0x4fefe0),
    0x5d62a4: (0xf0, 0x6d, 0x0c, 0x40, 0, 0x4ff090),
    0x5d649c: (0xf0, 0x77, 0x0c, 0x00, 0, 0x4ff3c0),
    0x5d64a8: (0xf0, 0x78, 0x0c, 0x02, 0, 0x4ff3c0),
    0x5d64b4: (0xf0, 0x78, 0x0c, 0x04, 0, 0x4ff3c0),
}
WINDOWS = [
    (0x4fefe0, 0x4ff028), (0x4ff090, 0x4ff0d9), (0x4ff3c0, 0x4ff3ce),
    (0x4ac172, 0x4ac406), (0x4acc75, 0x4acc91),
    (0x49e650, 0x49e7c9), (0x479cf0, 0x479d66),
    (0x43e320, 0x43e3b7), (0x43e563, 0x43e5a0), (0x43e890, 0x43e8d6),
    (0x440496, 0x4404e2), (0x4411bf, 0x44135f),
    (0x4c2ba0, 0x4c2bd2), (0x4c2be0, 0x4c2c04), (0x4c2c10, 0x4c2c32),
]
EXPECTED = [
    # Spell-target predicates: mode 0xd and 0x4c24f0 > 0 (0x6a/0x6b) or == -2 (0x6d).
    (0x4feff2, 'cmp', 'byte ptr [0x89c6e7], 0xd'), (0x4ff013, 'call', '0x4c24f0'),
    (0x4ff01d, 'jle', '0x4ff025'), (0x4ff0cb, 'cmp', 'eax, -2'),
    # Placement predicate: mode 7 (#1007/#1024), distinct from spell mode 0xd.
    (0x4ff3c5, 'sub', 'al, 7'),
    # Shared 0x6a/0x6b case: emit the cast, then only 0x6a requests mode 0.
    (0x4ac1b0, 'cmp', 'eax, 3'), (0x4ac1c8, 'call', '0x499d90'), (0x4ac313, 'call', '0x499ac0'),
    (0x4ac31d, 'je', '0x4ad5b9'), (0x4ac331, 'call', '0x479cf0'), (0x4ac3c2, 'call', '0x48a050'),
    (0x4ac3ca, 'cmp', 'ebx, 0x6b'), (0x4ac3cd, 'je', '0x4ad5b9'), (0x4ac3f3, 'call', '0x47a550'),
    # Placement 0x77/0x78 keeps mode for 0x78 or descriptor 0x0a.
    (0x4acc7d, 'cmp', 'ebx, 0x78'), (0x4acc82, 'cmp', 'byte ptr [esp + 0x12], 0xa'),
    # Right-click producer: gates, Ctrl arrays first, then Shift, then permanent bit.
    (0x49e66a, 'test', 'byte ptr [0x89d17c], 0x20'), (0x49e684, 'call', '0x4c2ca0'),
    (0x49e6e7, 'cmp', 'byte ptr [0x9845ae], 0'), (0x49e6f0, 'cmp', 'byte ptr [0x9846ae], 0'),
    (0x49e6f9, 'cmp', 'byte ptr [0x98462e], 0'), (0x49e702, 'cmp', 'byte ptr [0x98472e], 0'),
    (0x49e70b, 'push', '0'), (0x49e713, 'push', '0x75'), (0x49e716, 'call', '0x479cf0'),
    (0x49e725, 'cmp', 'byte ptr [0x9845bb], 0'), (0x49e737, 'cmp', 'byte ptr [0x9845c7], 0'),
    (0x49e752, 'call', '0x4c2ba0'), (0x49e760, 'cmp', 'eax, 1'), (0x49e763, 'sbb', 'eax, eax'),
    (0x49e765, 'neg', 'eax'), (0x49e769, 'push', '0x74'), (0x49e76c, 'call', '0x479cf0'),
    (0x49e796, 'test', 'dword ptr [edx*8 + 0x96070a], esi'), (0x49e7b8, 'push', '0x56'),
    # Emitter: local packet slot 0x897997 + player*15, +4/+8 args, +0xc command.
    # Commands above 0x52 (0x56/0x74/0x75) skip its table: write only into an empty slot.
    (0x479d15, 'sub', 'eax, 0xc'), (0x479d18, 'cmp', 'eax, 0x46'), (0x479d1b, 'ja', '0x479d2c'),
    (0x479cfd, 'test', 'byte ptr [0x89c662], 8'), (0x479d04, 'lea', 'esi, [ecx + ecx*4 + 0x897997]'),
    (0x479d2c, 'cmp', 'byte ptr [esi + 0xc], 0'), (0x479d56, 'mov', 'byte ptr [esi + 0xc], cl'),
    (0x479d5d, 'mov', 'dword ptr [esi + 4], eax'), (0x479d60, 'mov', 'dword ptr [esi + 8], ecx'),
    # Local slot -> per-player ring 0x8979d3 -> per-player dispatch record 0x89d18c.
    (0x43e372, 'add', 'esi, 0x897997'), (0x43e388, 'mov', 'eax, dword ptr [esi + 4]'),
    (0x43e394, 'mov', 'ax, word ptr [esi + 0xc]'), (0x43e563, 'mov', 'esi, 0x8979d3'),
    (0x43e570, 'mov', 'ecx, 0x89d18c'), (0x43e58e, 'mov', 'dword ptr [ecx + 4], ebp'),
    (0x43e594, 'mov', 'dword ptr [ecx + 8], edx'), (0x43e59b, 'mov', 'word ptr [ecx + 0xc], bp'),
    # Wrapper: per tribe, nonzero command byte -> process_tribe_cmd(tribe, record).
    (0x43e89d, 'mov', 'esi, 0x89d18c'), (0x43e8b6, 'cmp', 'byte ptr [esi + 0xc], bl'),
    (0x43e8bd, 'call', '0x43e8e0'),
    # 0x56: +8 nonzero clears (charges), zero sets (pauses); clear marker bit 0.
    (0x44049d, 'cmp', 'dword ptr [eax + 8], 0'), (0x4404ae, 'call', '0x4c2be0'),
    (0x4404c7, 'call', '0x4c2c10'), (0x4404d6, 'and', 'dword ptr [eax + 0x9e9], 0xfffffffe'),
    # 0x74: every available index, same argument polarity, clear marker.
    (0x4411d4, 'lea', 'edi, [eax*8 + 0x96070a]'), (0x4411f0, 'cmp', 'dword ptr [eax + 8], esi'),
    (0x4411fa, 'call', '0x4c2be0'), (0x441201, 'call', '0x4c2c10'), (0x44120a, 'cmp', 'ebx, 0x20'),
    (0x441216, 'and', 'dword ptr [eax + 0x9e9], 0xfffffffe'),
    # 0x75: same model + marker restores the saved mask; otherwise save, pause, focus.
    (0x441232, 'mov', 'cl, byte ptr [eax + 0xc25]'), (0x44123d, 'test', 'byte ptr [eax + 0x9e9], 1'),
    (0x44127d, 'test', 'dword ptr [eax + 0x9e9], edx'), (0x44128a, 'call', '0x4c2be0'),
    (0x441291, 'call', '0x4c2c10'), (0x4412ad, 'mov', 'byte ptr [eax + 0xc25], 0'),
    (0x4412c2, 'mov', 'dword ptr [eax + 0x9e9], 0'), (0x4412f7, 'call', '0x4c2ba0'),
    (0x44130f, 'or', 'dword ptr [eax + 0x9e9], edi'), (0x441316, 'call', '0x4c2c10'),
    (0x441334, 'call', '0x4c2be0'), (0x44134d, 'mov', 'byte ptr [eax + 0xc25], cl'),
    (0x441353, 'or', 'dword ptr [eax + 0x9e9], 1'),
    # Paused-mask helpers on field10 (0x96071a + owner*56), bit(model - 1).
    (0x4c2bc1, 'test', 'dword ptr [esi*8 + 0x96071a], eax'), (0x4c2bc8, 'jne', '0x4c2bcc'),
    (0x4c2bfc, 'and', 'dword ptr [edx*8 + 0x96071a], eax'), (0x4c2c2a, 'or', 'dword ptr [edx*8 + 0x96071a], eax'),
]
# (index table, jump table, bias, value, target)
TABLES = [
    (0x4ad8dc, 0x4ad814, 0x0f, 0x6a, 0x4ac172), (0x4ad8dc, 0x4ad814, 0x0f, 0x6b, 0x4ac172),
    (0x4ad8dc, 0x4ad814, 0x0f, 0x6d, 0x4ac45b), (0x4ad8dc, 0x4ad814, 0x0f, 0x77, 0x4acbad),
    (0x4ad8dc, 0x4ad814, 0x0f, 0x78, 0x4acbad),
    (0x4423f0, 0x4422c0, 0x0c, 0x56, 0x440496), (0x4423f0, 0x4422c0, 0x0c, 0x74, 0x4411bf),
    (0x4423f0, 0x4422c0, 0x0c, 0x75, 0x441222),
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


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('exe', type=Path)
    args = parser.parse_args()
    read = image(args.exe)
    md = capstone.Cs(capstone.CS_ARCH_X86, capstone.CS_MODE_32)
    decoded = {}
    for start, end in WINDOWS:
        for i in md.disasm(read(start, end - start), start):
            decoded[i.address] = (i.mnemonic, i.op_str)
    failures = [f'{a:08x}: expected {m} {o}, found {decoded.get(a)}' for a, m, o in EXPECTED
                if decoded.get(a) != (m, o)]
    for address, expected in RECORDS.items():
        raw = read(address, 12)
        found = (raw[0], struct.unpack_from('<I', raw, 1)[0], raw[5], raw[6], raw[7],
                 struct.unpack_from('<I', raw, 8)[0])
        if found != expected:
            failures.append(f'record {address:08x}: {found} != {expected}')
    for index_table, jump_table, bias, value, target in TABLES:
        entry = read(index_table + value - bias, 1)[0]
        found = struct.unpack('<I', read(jump_table + entry * 4, 4))[0]
        if found != target:
            failures.append(f'table {jump_table:08x}[{value:#x}] = {found:08x}, expected {target:08x}')
    if failures:
        print('\n'.join(failures), file=sys.stderr)
        return 1
    print(f'spell-modifier static evidence: {len(RECORDS)} records, {len(EXPECTED)} instructions, '
          f'{len(TABLES)} table entries verified')
    return 0


if __name__ == '__main__':
    sys.exit(main())
