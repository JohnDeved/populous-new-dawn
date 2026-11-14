#!/usr/bin/env python3
"""Read-only byte probe for decomp/research/player-patrol.md (#1003).

Opens the original d3dpoptb.exe as data, verifies its SHA-256, and compares the
selected VA ranges cited by the note with retained SHA-256 digests. It never
executes or emulates the input. With --dump it prints hex (and, when Capstone is
importable, disassembly) for each range so a reviewer can re-derive the note.

    python3 -I decomp/research/player-patrol/verify.py "$POPULOUS_EXE" [--dump] [--record]
"""
import hashlib
import json
import struct
import sys

EXE_SHA256 = '3a5065c7420b3fcde208bf220bc86dfbac95e025ab2492caf9c7ea5308dfbe4f'

# (label, start VA, end VA exclusive, kind, sha256 of bytes)
RANGES = [
    ('binding N(modal) 005d60f4', 0x5D60F4, 0x5D6100, 'data', 'aca8d08962a1dc681e66a76be0f377f287ee40906a157e5481b48ec1d7bab1e1'),
    ('binding N 005d6208', 0x5D6208, 0x5D6214, 'data', '1c3ad5c8e3df9180b57378205f9ab4cc023bf6b987dd17a7c18881b138179784'),
    ('bindings left press 0x6e/0x6f', 0x5D6478, 0x5D6490, 'data', '97332419b4e06cee35c31c1449b7b79f100cafab9fb3c1a505493e0a62133c35'),
    ('bindings left release 0x77/0x78', 0x5D649C, 0x5D64C0, 'data', '6ef2d28e1341900ba3ca4e0abe0c9368e1f5d7a6419c2bfa7ce2f0f887c78baf'),
    ('bindings Alt 0xbd/0xbe', 0x5D652C, 0x5D655C, 'data', 'fdd977a96651811c088f1c91bee1f43565e6591ab78d2fb233e6694a00ea17fd'),
    ('bindings left release 0x7e/0x7f', 0x5D655C, 0x5D6574, 'data', '6b0ae5f6bee1628af24a46149a5b7510c509e013558e57e0ffebce3e6c77422c'),
    ('descriptor model 11', 0x5A7EB2, 0x5A7EC8, 'data', 'f8746897c41160cdc3c2312c385672efb51a3aa5ea9603f45cb1e865b57fed10'),
    ('descriptor model 25', 0x5A7FE6, 0x5A7FFC, 'data', '6f4d0a7a6a440723cca0fab8b4f29021f82012a707a717c326573b3d870ad90d'),
    ('predicate 004ff450 (N modal)', 0x4FF450, 0x4FF45B, 'code', 'fb767b35a3a5a4b897ae8114f465938ee929c348311df5b921d0e82277fa85bf'),
    ('predicate 004ff480 (0x7e/0x7f)', 0x4FF480, 0x4FF4A4, 'code', '21e49ac0ef607b9e33ecb6c4eaa27a3e013c5c937cb4937fea6f1c3b3b0e7a74'),
    ('process_cmd 0x7f', 0x4ACF85, 0x4ACFCE, 'code', '1c8263b3e7bc0031fb0927e0cb555db85ed6aa4507f7c9a79fe6b3f43c1ed53a'),
    ('process_cmd 0x62 -> tribe cmd 0x68', 0x4ABF0F, 0x4ABF1B, 'code', 'a3bb84a7b6cf35f222790ea0654eb79969a32af555dd561cf1e0307af6220bd2'),
    ('Ctrl+Alt context 00437078', 0x437078, 0x4370FD, 'code', '2094de4c3c7ec6f0e5ab5b787313652eed1f40385da4efbd321b2c835a983a3b'),
    ('model11 extents payload 004382c8', 0x4382C8, 0x4382EA, 'code', '4d89cd5fe10fb82523a16cf8f26dae772740c859223e88d9ffb7019e214ff8c6'),
    ('slot table clear 0047a6a2', 0x47A6A2, 0x47A6BC, 'code', '7b2eb8ff7c19f3236796a058345e74498da442dee13a41775b15a45fb963178f'),
    ('patrol point predicate 004b98f0', 0x4B98F0, 0x4B9A12, 'code', 'b02bf84733182cb000616bfb034dd42f697604472ce40c250ed95d3deb19e8e1'),
    ('N consumer 0043d6e0', 0x43D6E0, 0x43D7CD, 'code', '378f9d9c87bc5f47f1aaf3c04323caabf1aedf6e78f130a6f39ac181c26e71e1'),
    ('tribe cmd 0x68 case 00440c11', 0x440C11, 0x440C1B, 'code', 'c22393e2b1f5743aed982d2011eae7fdf4e2d1ee19869914443ac4fb33175594'),
]


def sections(data):
    pe = struct.unpack_from('<I', data, 0x3C)[0]
    count = struct.unpack_from('<H', data, pe + 6)[0]
    optional = struct.unpack_from('<H', data, pe + 20)[0]
    base = struct.unpack_from('<I', data, pe + 24 + 28)[0]
    out, o = [], pe + 24 + optional
    for _ in range(count):
        vsize, va, rsize, raw = struct.unpack_from('<IIII', data, o + 8)
        out.append((base + va, max(vsize, rsize), raw))
        o += 40
    return out


def read(data, secs, start, end):
    for va, size, raw in secs:
        if va <= start and end <= va + size:
            return data[raw + start - va:raw + end - va]
    raise ValueError(f'unmapped range {start:08x}-{end:08x}')


def main(argv):
    if len(argv) < 2:
        print(__doc__)
        return 2
    with open(argv[1], 'rb') as f:
        data = f.read()
    digest = hashlib.sha256(data).hexdigest()
    if digest != EXE_SHA256:
        print(json.dumps({'status': 'blocked', 'reason': 'executable identity mismatch', 'sha256': digest}))
        return 3
    secs = sections(data)
    dump, record = '--dump' in argv, '--record' in argv
    md = None
    if dump:
        try:
            import capstone
            md = capstone.Cs(capstone.CS_ARCH_X86, capstone.CS_MODE_32)
        except ImportError:
            pass
    results, failed = [], 0
    for label, start, end, kind, expected in RANGES:
        chunk = read(data, secs, start, end)
        actual = hashlib.sha256(chunk).hexdigest()
        ok = record or actual == expected
        failed += not ok
        results.append({'label': label, 'va': f'{start:08x}-{end:08x}', 'sha256': actual, 'match': actual == expected})
        if dump:
            print(f'== {label} {start:08x}-{end:08x} sha256 {actual}')
            if kind == 'code' and md:
                for ins in md.disasm(chunk, start):
                    print(f'  {ins.address:08x}  {ins.bytes.hex():<20} {ins.mnemonic} {ins.op_str}')
            else:
                for i in range(0, len(chunk), 12):
                    print(f'  {start + i:08x}  {chunk[i:i + 12].hex(" ")}')
    print(json.dumps({'status': 'failed' if failed else 'passed', 'exe_sha256': digest, 'ranges': results}, indent=1))
    return 1 if failed else 0


if __name__ == '__main__':
    sys.exit(main(sys.argv))
