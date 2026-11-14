#!/usr/bin/env python3
"""Original-byte evidence for player Guard Posts (issue #1010).

Read-only static check of the SHA-locked original executable: default binding
records, tribe-command jump-table targets and reviewed instruction tuples in the
placement, assignment, N-release, post update, cap, removal and patrol-refresh
routines. Requires Capstone 5.0.7. The executable is read as data; nothing is
executed or emulated, nothing is written. See decomp/research/guard-posts.md.

Usage: python3 -I scripts/check-static-guard-posts.py "$POPULOUS_EXE" [--json]
"""
import argparse, hashlib, json, os, struct, sys

try:
    import capstone
except ImportError as error:
    raise SystemExit('Use a Python environment with Capstone 5.0.7; nothing is installed.') from error

EXE_SHA256 = '3a5065c7420b3fcde208bf220bc86dfbac95e025ab2492caf9c7ea5308dfbe4f'

# Default binding records at 005d5de8+ (12 bytes: key, action dword, flags, mods, gate, predicate).
BINDINGS = {
    0x5d6208: (0x6e, 0x62, 0x11, 0, 0, 0),           # N press -> action 0x62
    0x5d6220: (0x67, 0xc1, 0x11, 0, 0, 0),           # G press -> action 0xc1
    0x5d649c: (0xf0, 0x77, 0x0c, 0, 0, 0x4ff3c0),    # left release -> place
    0x5d64a8: (0xf0, 0x78, 0x0c, 2, 0, 0x4ff3c0),    # Ctrl+left release -> place, keep mode
    0x5d64b4: (0xf0, 0x78, 0x0c, 4, 0, 0x4ff3c0),    # Alt+left release -> place, keep mode
    0x5d64c0: (0xf1, 0x7c, 0x0c, 0x40, 0, 0x4ff3c0), # right release, any modifiers, mode 7 -> cancel
    0x5d64e4: (0xf1, 0x7a, 0x0c, 1, 0, 0x4ff360),    # Shift+right release -> remove post
}

# process_tribe_cmd (0043e8e0): index = cmd - 0x0c, byte table 004423f0, dword table 004422c0.
TRIBE_CASES = {0x62: 0x440822, 0x68: 0x440c11, 0x7a: 0x441600, 0x7e: 0x441c62, 0x82: 0x441fa3}

# Linear windows that begin on reviewed instruction boundaries.
WINDOWS = [
    (0x43e90b, 0x43e929), (0x440822, 0x44095a), (0x441600, 0x44160e), (0x441fa3, 0x441fc0),
    (0x440c11, 0x440c1e), (0x4ba9b0, 0x4baaab), (0x4b98f0, 0x4b9a12), (0x4ba640, 0x4ba69e),
    (0x4ba5d0, 0x4ba5ee), (0x502eb0, 0x50307f), (0x503080, 0x5030bc), (0x5030c0, 0x50313c),
    (0x43d6e0, 0x43d7cd), (0x49d9b0, 0x49d9f7), (0x4ff360, 0x4ff3ce), (0x4acbad, 0x4acdea),
    (0x4328fe, 0x43293f), (0x40af51, 0x40af91),
]

EXPECTED = [
    # tribe-command dispatch
    (0x43e90e, 'sub', 'ecx, 0xc'), (0x43e91c, 'mov', 'al, byte ptr [ecx + 0x4423f0]'),
    (0x43e922, 'jmp', 'dword ptr [eax*4 + 0x4422c0]'),
    # cmd 0x62: assign (predicate allows existing post), scatter unselected, player-local alloc
    (0x440829, 'push', '1'), (0x44083a, 'call', '0x4b98f0'), (0x440854, 'push', '1'),
    (0x440857, 'call', '0x4ba9b0'), (0x4408ad, 'test', 'byte ptr [edi + 0x7a], 0x80'),
    (0x4408b1, 'jne', '0x4408e1'), (0x4408d4, 'mov', 'byte ptr [edi + 0x2c], 0x2b'),
    (0x4408f2, 'movsx', 'eax, byte ptr [0x89c6f0]'), (0x44090b, 'push', '0'),
    (0x44090f, 'call', '0x4b98f0'),
    # cmd 0x7a resets the per-tribe assignment chain index; 0x82 = Shaman guard; 0x68 = N
    (0x441607, 'mov', 'byte ptr [eax + 0xc5c], 0'), (0x441fb3, 'call', '0x443b40'),
    (0x440c16, 'call', '0x43d6e0'),
    # 004ba9b0 selected-person assignment (no model/state filter), max chain 8, model 11, b=0x606
    (0x4ba9bb, 'cmp', 'dword ptr [esi + 0x931], 0'), (0x4ba9c8, 'cmp', 'byte ptr [esi + 0xc5c], 8'),
    (0x4baa1c, 'mov', 'ebp, 0xb'), (0x4baa26, 'mov', 'eax, 6'),
    (0x4baa3d, 'test', 'byte ptr [edi + 0x7a], 0x80'), (0x4baa43, 'cmp', 'byte ptr [esi + 0xc5c], 0'),
    (0x4baa4d, 'call', '0x436ca0'), (0x4baa52, 'or', 'dword ptr [edi + 0xc], 0x10'),
    (0x4baa56, 'mov', 'byte ptr [edi + 0xa6], 0'), (0x4baa64, 'call', '0x436c20'),
    (0x4baa79, 'call', '0x438730'), (0x4baa8e, 'call', '0x436d00'),
    (0x4baa9d, 'inc', 'byte ptr [esi + 0xc5c]'),
    # 004b98f0 placement predicate: 518200 land test, no building, scenery/post blockers, preview skipped
    (0x4b994b, 'call', '0x518200'), (0x4b997b, 'test', 'word ptr [ecx*4 + 0x8a03ec], 0x3ff'),
    (0x4b99cb, 'cmp', 'dword ptr [0x8922d8], esi'), (0x4b99e9, 'cmp', 'ecx, 0x11'),
    (0x4b99f0, 'test', 'dl, dl'), (0x4b99f4, 'cmp', 'byte ptr [esi + 0x2b], bl'),
    (0x4b99f9, 'xor', 'al, al'),
    # 004ba640 existing non-preview post on cell
    (0x4ba684, 'cmp', 'dword ptr [0x8922d8], ecx'), (0x4ba696, 'mov', 'al, 1'),
    (0x4ba5df, 'call', '0x4ef180'),
    # 00502eb0 state-15 update: cosmetic RNG smoke 7/3, loop sound 0xc0, age +0x70 expiry, terrain expiry
    (0x502ed5, 'mov', 'eax, dword ptr [0x89bc72]'), (0x502f5d, 'cmp', 'byte ptr [0x89ce61], 0'),
    (0x502f81, 'push', '3'), (0x502f83, 'push', '7'), (0x502fa1, 'call', '0x4edbd0'),
    (0x502fe7, 'add', 'cx, 4'), (0x502ff0, 'call', '0x4f0f60'),
    (0x503000, 'push', '0xc0'), (0x50300e, 'mov', 'ax, word ptr [esi + 0x70]'),
    (0x503012, 'cmp', 'ax, 0xbb8'), (0x503060, 'test', 'byte ptr [ecx*2 + 0x5aa328], 0x3e'),
    (0x50306a, 'cmp', 'esi, dword ptr [0x8922d8]'), (0x503073, 'call', '0x4ef180'),
    # 00503080 specialized removal; 005030c0 recount and 64-post eviction
    (0x503095, 'call', '0x4ee1e0'), (0x50309e, 'call', '0x5030c0'), (0x5030b2, 'call', '0x48a770'),
    (0x5030ff, 'cmp', 'dword ptr [0x89c65d], 0x20'), (0x50310f, 'cmp', 'dword ptr [0x89c65d], 0x15'),
    (0x50311f, 'cmp', 'dword ptr [0x89c65d], 0xc'),
    # 0043d6e0 N: tribe-wide state10 people on command 11/25 advance to next other order
    (0x43d70f, 'cmp', 'byte ptr [esi + 0x2c], 0xa'), (0x43d71d, 'mov', 'cl, byte ptr [esi + 0xa6]'),
    (0x43d742, 'cmp', 'al, 0xb'), (0x43d746, 'cmp', 'al, 0x19'), (0x43d764, 'test', 'byte ptr [eax + 1], 1'),
    (0x43d793, 'call', '0x4364d0'), (0x43d7a0, 'mov', 'byte ptr [esi + 0xa6], bl'),
    (0x43d7a7, 'call', '0x432df0'), (0x43d7b0, 'call', '0x4d4f40'),
    # 0049d9b0 building-panel button: unless Shift latch, emit tribe cmd 0x7a
    (0x49d9b0, 'test', 'byte ptr [0x98e909], 4'), (0x49d9eb, 'push', '0x7a'), (0x49d9ee, 'call', '0x479cf0'),
    # 004ff360 Shift+right predicate: hovered object must be class10/model16
    (0x4ff3a3, 'cmp', 'byte ptr [ecx + 0x2b], 0x10'),
    (0x4ff3c0, 'mov', 'al, byte ptr [0x89c6e7]'), (0x4ff3c5, 'sub', 'al, 7'),
    # process_cmd 0x77/0x78 menu-model17 branch
    (0x4acbe2, 'cmp', 'dl, 0x11'), (0x4acbfd, 'call', '0x4b98f0'), (0x4acc10, 'call', '0x4ba640'),
    (0x4acc7d, 'cmp', 'ebx, 0x78'), (0x4acca6, 'and', 'esi, 0x54'), (0x4acd44, 'call', '0x4ef180'),
    # 00432590 command 25 arrival zeroes the post age at its cell
    (0x43290d, 'cmp', 'byte ptr [edx + 0x2b], cl'), (0x43292e, 'mov', 'word ptr [edx + 0x70], 0'),
    # 0040abe0 post camera cycle: nearest post with nonzero age
    (0x40af5e, 'cmp', 'byte ptr [edi + 0x2b], 0x10'), (0x40af64, 'cmp', 'word ptr [edi + 0x70], bp'),
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
    for address, expected in BINDINGS.items():
        r = read(address, 12)
        got = (r[0], struct.unpack_from('<I', r, 1)[0], r[5], r[6], r[7], struct.unpack_from('<I', r, 8)[0])
        if got != expected:
            failures.append(f'binding {address:#x}: {got} != {expected}')
    for cmd, target in TRIBE_CASES.items():
        slot = read(0x4423f0 + cmd - 0x0c, 1)[0]
        got = struct.unpack('<I', read(0x4422c0 + 4 * slot, 4))[0]
        if got != target:
            failures.append(f'tribe cmd {cmd:#x}: {got:#x} != {target:#x}')
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
        'bindings': len(BINDINGS),
        'tribeCases': {hex(k): hex(v) for k, v in TRIBE_CASES.items()},
        'instructions': len(EXPECTED),
        'failures': failures,
        'status': 'failed' if failures else 'passed',
    }
    if args.json:
        print(json.dumps(result, indent=2))
    else:
        for failure in failures:
            print('FAIL', failure)
        print(f"{result['status']}: {len(BINDINGS)} bindings, {len(TRIBE_CASES)} tribe cases, "
              f"{len(EXPECTED)} instructions")
    sys.exit(1 if failures else 0)


if __name__ == '__main__':
    main()
