#!/usr/bin/env python3
"""Original-byte evidence for computer single-marker guards (issue #1059).

Read-only static check of the SHA-locked original executable. It covers reviewed
instruction tuples in 0x4cedd0 phase 5 (the type-24 marker task commit), the
0x4359b0 group commit selection/model filter, the 0x41b180 state-14 restore by
model, and the 0x4d2740 -> 0x445750 deselection on leaving state 14. Requires
Capstone 5.0.7. The executable is read as data; nothing is executed or emulated,
nothing is written. See decomp/research/computer-marker-guards.md.

Usage: python3 -I scripts/check-static-computer-marker-guards.py "$POPULOUS_EXE" [--json]
"""
import argparse, hashlib, json, os, struct, sys

try:
    import capstone
except ImportError as error:
    raise SystemExit('Use a Python environment with Capstone 5.0.7; nothing is installed.') from error

EXE_SHA256 = '3a5065c7420b3fcde208bf220bc86dfbac95e025ab2492caf9c7ea5308dfbe4f'

# Linear windows that begin on reviewed instruction boundaries.
WINDOWS = [
    (0x4cf0c5, 0x4cf13f), (0x4cf150, 0x4cf1cc), (0x435a99, 0x435ade),
    (0x41b180, 0x41b224), (0x4d2740, 0x4d27a4), (0x445750, 0x4457c2), (0x4e9b40, 0x4e9b6b),
]

EXPECTED = [
    # 004cedd0 phase 5 without the special flag (+0x2a == 0): a secondary marker queues
    # two command-11 records and commits them to every selected person (0x43b010 -> 25)
    (0x4cf0c5, 'cmp', 'byte ptr [edi + 0x2a], 0'), (0x4cf0d7, 'cmp', 'word ptr [eax + 0x10], -1'),
    (0x4cf0dc, 'je', '0x4cf150'), (0x4cf0eb, 'push', '0x606'), (0x4cf0f0, 'push', '0xb'),
    (0x4cf0f3, 'call', '0x435730'), (0x4cf10e, 'push', '0x606'), (0x4cf113, 'push', '0xb'),
    (0x4cf116, 'call', '0x435730'), (0x4cf11e, 'push', '-1'), (0x4cf120, 'push', '-1'),
    (0x4cf122, 'push', '-1'), (0x4cf125, 'call', '0x4359b0'), (0x4cf130, 'call', '0x418ce0'),
    # single marker (secondary == -1): point = task dword, else marker word
    (0x4cf150, 'mov', 'esi, dword ptr [edi]'), (0x4cf152, 'cmp', 'esi, -1'),
    (0x4cf15b, 'mov', 'si, word ptr [eax*2 + 0x89b7a5]'),
    # queue command 3 (move), payload 0, point
    (0x4cf164, 'push', '0'), (0x4cf166, 'push', '3'), (0x4cf169, 'call', '0x435730'),
    # commit only to model 4 (Preachers): 0x4359b0(ai, 4, -1, -1)
    (0x4cf171, 'push', '-1'), (0x4cf173, 'push', '-1'), (0x4cf175, 'push', '4'),
    (0x4cf178, 'call', '0x4359b0'),
    # 0x41b180(ai, state 14, models 4/-1/-1): restore those Preachers now
    (0x4cf180, 'push', '-1'), (0x4cf182, 'push', '-1'), (0x4cf184, 'push', '4'),
    (0x4cf186, 'push', '0xe'), (0x4cf189, 'call', '0x41b180'),
    # queue command 11 (guard), payload 0x606, same point; commit to every selected person
    (0x4cf192, 'push', '0x606'), (0x4cf197, 'push', '0xb'), (0x4cf19a, 'call', '0x435730'),
    (0x4cf1a2, 'push', '-1'), (0x4cf1a4, 'push', '-1'), (0x4cf1a6, 'push', '-1'),
    (0x4cf1a9, 'call', '0x4359b0'),
    # 0x418ce0(ai, 14) restores everyone else; 0x4f6440 releases the selection
    (0x4cf1b1, 'push', '0xe'), (0x4cf1b4, 'call', '0x418ce0'), (0x4cf1be, 'call', '0x4f6440'),
    # 004359b0: only selected people (+0x7a & 0x80) whose model matches a filter (-1 = all)
    (0x435aa7, 'test', 'byte ptr [ebp + 0x7a], 0x80'), (0x435ab1, 'cmp', 'dword ptr [esp + 0x4c], -1'),
    (0x435aba, 'mov', 'al, byte ptr [ebp + 0x2b]'), (0x435abd, 'cmp', 'dword ptr [esp + 0x4c], eax'),
    (0x435ac3, 'cmp', 'dword ptr [esp + 0x50], eax'), (0x435ac9, 'cmp', 'dword ptr [esp + 0x54], eax'),
    # 0041b180: state match, model match, 0x4e9b40 reset, flags2 0x100000 skip, default state
    (0x41b1a1, 'mov', 'al, byte ptr [esi + 0x2c]'), (0x41b1a4, 'cmp', 'eax, edi'),
    (0x41b1aa, 'mov', 'al, byte ptr [esi + 0x2b]'), (0x41b1be, 'call', '0x4e9b40'),
    (0x41b1c6, 'test', 'byte ptr [esi + 0xe], 0x10'), (0x41b1cf, 'mov', 'byte ptr [esi + 0x7d], al'),
    (0x41b1fd, 'mov', 'bl, byte ptr [edx*2 + 0x5a7064]'), (0x41b205, 'call', '0x4ed6f0'),
    (0x41b20d, 'mov', 'byte ptr [esi + 0x2c], bl'),
    # 004d2740: leaving state 14 calls 0x445750(person, 0, 0)
    (0x4d2756, 'mov', 'al, byte ptr [esi + 0x7d]'), (0x4d2759, 'cmp', 'eax, 0xe'),
    (0x4d2795, 'push', '0'), (0x4d2797, 'push', '0'), (0x4d279a, 'call', '0x445750'),
    # 00445750 with select == 0 clears the selection bit
    (0x44575b, 'test', 'dl, dl'), (0x44575e, 'je', '0x4457b3'),
    (0x4457ba, 'and', 'byte ptr [ecx + 0x7a], 0x7f'),
    # 004e9b40 motion reset used by 0x41b180 and 0x418ce0
    (0x4e9b47, 'and', 'ecx, 0xfffff7ff'), (0x4e9b50, 'and', 'ecx, 0xdfffffff'),
    (0x4e9b59, 'or', 'ecx, 0x1000'),
]


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('executable', nargs='?', default=os.environ.get('POPULOUS_EXE'))
    parser.add_argument('--json', action='store_true')
    args = parser.parse_args()
    if not args.executable:
        raise SystemExit('Supply the original d3dpoptb.exe path or set POPULOUS_EXE.')
    if capstone.__version__ != '5.0.7':
        raise SystemExit(f'Capstone 5.0.7 required, found {capstone.__version__}')
    data = open(args.executable, 'rb').read()
    digest = hashlib.sha256(data).hexdigest()
    if digest != EXE_SHA256:
        raise SystemExit(f'Unexpected executable SHA-256 {digest}')
    pe = struct.unpack_from('<I', data, 60)[0]
    count = struct.unpack_from('<H', data, pe + 6)[0]
    optional = struct.unpack_from('<H', data, pe + 20)[0]
    base = struct.unpack_from('<I', data, pe + 24 + 28)[0]
    sections = [struct.unpack_from('<8sIIII', data, pe + 24 + optional + i * 40) for i in range(count)]

    def read(va, size):
        for _, vsize, rva, rsize, raw in sections:
            start = base + rva
            if start <= va and va + size <= start + max(vsize, rsize):
                return data[raw + va - start: raw + va - start + size]
        raise ValueError(hex(va))

    failures = []
    md = capstone.Cs(capstone.CS_ARCH_X86, capstone.CS_MODE_32)
    decoded = {}
    for start, end in WINDOWS:
        for ins in md.disasm(read(start, end - start), start):
            decoded[ins.address] = (ins.mnemonic, ins.op_str)
    for address, mnemonic, operands in EXPECTED:
        got = decoded.get(address)
        if got != (mnemonic, operands):
            failures.append(f'{address:#x}: {got} != {(mnemonic, operands)}')
    result = {
        'executableSha256': digest,
        'capstone': capstone.__version__,
        'instructions': len(EXPECTED),
        'failures': failures,
        'status': 'failed' if failures else 'passed',
    }
    if args.json:
        print(json.dumps(result, indent=2))
    else:
        for failure in failures:
            print('FAIL', failure)
        print(f"{result['status']}: {len(EXPECTED)} instructions")
    sys.exit(1 if failures else 0)


if __name__ == '__main__':
    main()
