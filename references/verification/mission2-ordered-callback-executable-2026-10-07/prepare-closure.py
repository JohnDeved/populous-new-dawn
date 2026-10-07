"""Static PE instruction/call closure preparation. Never constructs a CPU.

The output is fail-closed until all pending switches/calls are classified.
Usage: pinned-python prepare-closure.py /path/to/d3dpoptb.exe
"""
import hashlib
import json
import struct
import sys
from pathlib import Path

from capstone import Cs, CS_ARCH_X86, CS_MODE_32, CS_GRP_JUMP
from capstone.x86 import X86_OP_IMM, X86_OP_MEM

HERE = Path(__file__).resolve().parent
EXPECTED_EXE = '3a5065c7420b3fcde208bf220bc86dfbac95e025ab2492caf9c7ea5308dfbe4f'
REAL = {
    0x4ed820, 0x4ed880, 0x4ee300, 0x42b7f0, 0x42b660, 0x461d70,
    0x4f52c0, 0x4d1420, 0x436ff0, 0x41a4f0, 0x401040, 0x401090, 0x401790,
    0x586000, 0x44ddf0, 0x44df40, 0x422a60, 0x422bd0,
    0x4ed8a0, 0x4ed580, 0x4ed640, 0x4ed6f0,
    0x4d23d0, 0x4d5920, 0x4ee470, 0x4ea460, 0x4e9b40, 0x4d2740,
    0x4a3940, 0x4d47d0, 0x432260, 0x4d3ea0, 0x4d4040, 0x4ee700, 0x44e940,
    0x402ec0, 0x403610, 0x4030c0, 0x4049d0, 0x40b170, 0x493770,
    0x4b9ef0, 0x40afd0, 0x403d50, 0x403a00, 0x403f00, 0x41b3f0,
    0x4044b0, 0x404540, 0x4ee580, 0x4ee4f0, 0x450d50, 0x403c10,
    0x4a5ef0, 0x4a67d0, 0x4a6210, 0x4a66c0, 0x4a79f0, 0x4a80b0,
    0x4a9030, 0x409200, 0x494f50, 0x44fad0, 0x4e90e0, 0x44f980,
    0x4fa530, 0x4fa7f0, 0x4faaf0, 0x4fb1d0, 0x4fc330, 0x4fc790,
    0x509c10, 0x50bcd0, 0x50a740, 0x401b10,
    0x485b00, 0x4851e0, 0x4fbd20, 0x40cb90, 0x40cbb0, 0x40cbf0,
    0x4866a0, 0x4edf50, 0x4ecac0, 0x503230, 0x4513e0, 0x41af80,
    0x419790, 0x419810, 0x419880, 0x44ff80, 0x49c7a0,
    0x436c20, 0x436ca0, 0x436d00, 0x438730, 0x40a3f0,
    0x432df0, 0x43d510, 0x501be0, 0x5016f0,
    0x4be230, 0x4047b0, 0x43b010, 0x4ec630, 0x4655f0,
    0x4e9d80, 0x4ec3f0, 0x4e9e80, 0x49a2f0, 0x49a3f0, 0x49a5d0,
    0x4ea550, 0x4ea970, 0x4ea4c0, 0x4ea300, 0x4eadc0, 0x450450,
    0x450590, 0x420840, 0x4665c0,
}
SUPPLIED = {0x48a050: 3, 0x4bdff0: 1, 0x4bdd40: 2}
SLICES = {0x42bfe7: 0x42bffe, 0x484edc: 0x485038,
          0x485050: 0x485153, 0x42b403: 0x42b48a}
# Keys are actual indirect JMP instruction addresses, values are selected table
# indexes. Filled from the accepted numeric class/model/state inventory.
SELECTED_SWITCHES = {
    0x402ed0: [2,3,6,17],  # Building models3,4,7,18 minus1.
    0x4030e5: [1],  # Building state2 minus1.
    0x403d97: [0,1,2,3], 0x403e63: [0,1,2,3],
    0x4042de: [0,1,2,3],  # Shape orientations; model gate still runs.
    0x4047cd: [0,1,2,3],
    0x41af98: [0,1,5],  # Non-wild person models2,3,7 minus2.
    0x432f7b: [4],  # Command18 -> byte remap433470[12] ==4.
    0x43d53f: [4],  # Command18 -> byte remap43d670[10] ==4 (default).
    0x485b18: [0,1,4,5,6],  # Authored classes1,2,5,6,7 minus1.
    0x485c06: [0],  # Scenery model9 post-processing.
    0x49a454: [],  # Only type2 indexed searches are entered; type1 table is excluded.
    0x4a5fc9: [0,1,2,3,8],  # Scenery models1,2,3,4,9 minus1.
    0x4a6239: [0,1,4,6,9],  # Scenery states1,2,5,7,10 minus1.
    0x4a66ed: [0],  # Model9 -> remap4a67bc[0]; other selected models default.
    0x4d2410: [0,1,2,6],  # Person models1,2,3,7 minus1.
    0x4d290b: [7,9],  # Person states8,10 minus1.
    0x4d3ed0: [16],  # States8/10 -> animation remap default.
    0x4ecd24: [0,1,4,5,6],
    0x4ed590: [0,1,4,5,6], 0x4ed64f: [0,1,4,5,6],
    0x4ee08d: [5,6],  # Only linked classes6/7 deactivate.
    0x4fa548: [1,5,8,9],  # Resource models2,6,9,10 minus1.
    0x4fa804: [3,4,6,7],  # Resource states4,5,7,8; state0 takes default.
    0x509c2e: [23],  # Authored effect model24 minus1.
}
# Reachable conditional prefixes can contain calls excluded by the fixed input.
# Each exclusion needs an explicit source/input rationale; no target is stubbed.
EXCLUDED_CALLS = {
    0x403216: 'Fresh building has no attached record+84 to delete.',
    0x40324f: 'Fresh building has no attached record+92 to delete.',
    0x404b5e: 'Boat models13/14 are absent.',
    0x404baa: 'Boat models13/14 are absent.',
    **{pc: 'Fresh people have no vehicle handle+9f; constructor/start orders do not board a vehicle.'
       for pc in (0x432371,0x4323ae,0x4323d4,0x4323e3,0x4323f5,0x43243f,0x432455,0x432463,
                  0x432edc,0x432f2e,0x432f3d)},
    0x436cbd: 'Opening Shaman immediate order slot is empty before command18.',
    0x436cd8: 'Opening Shaman ordinary order slots are empty before command18.',
    0x436d6a: 'Command18 attaches ordinary slot0, never replaces an immediate order.',
    0x43d64a: 'Fresh people are not building occupants; flags2 bit800000 is clear.',
    **{pc: 'Fresh ordinary level flags bit4 is clear; no fog-reveal tail.'
       for pc in (0x4502ba,0x45030a,0x450339,0x45034c,0x450359)},
    0x4514a5: 'No model4 person is authored in Mission2.',
    0x48510c: 'No class7/model89 is authored or produced.',
    0x486810: 'Head modes are0/4, never upgrade mode3.',
    0x495021: 'Fresh resource-search record count93a770 is zero.',
    0x4a6afb: 'Selected scenery descriptor byte22 lacks bit2.',
    0x4a7b45: 'Fresh tree life400 is not below100; stone9 lacks the health branch.',
    0x4a92cc: 'No class9 plan is authored/produced; occupied footprint cells are buildings.',
    0x4d27e3: 'Fresh person flags3 bit20 is clear (no building assignment).',
    0x4d279a: 'Previous person state is0,8 or10, never14.',
    0x4d482f: 'No fresh person has an attached combat group.',
    0x4e913b: 'Selected scenery descriptor lacks floating flag; helper is not reached.',
    0x4ee0f8: 'Head links target classes6/7, never a building.',
    0x4ee070: 'Linked reward/effect records have no auxiliary sunlight record.',
    0x4fac23: 'No class9 plan is authored or produced.',
    0x4fc829: 'No class9 plan is authored or produced.',
    0x501bf7: 'No fresh person has combat assignment bit20.',
    0x4ec56e: 'No person has a vehicle handle+9f; vehicle-destination branch is excluded.',
    0x4ecdcc: 'This Mission2 case has at most27 people, below the200-person warning.',
    0x4ea34e: 'No person has a vehicle handle+9f.',
    **{pc: 'The fixed command18 origin/destination cell is identical, checked at420840 entry; no path search is admitted.'
       for pc in (0x420adf,0x420b06,0x420b6a,0x420c5d,0x420c6a,0x420c77,
                  0x420cef,0x420cf7,0x420d8d,0x420d9a,0x420da7)},
    **{pc: 'Same-cell route setup has distance0 and return0; no transport fallback.'
       for pc in (0x4eab74,0x4eaba0,0x4eac85,0x4eacb1)},
    **{pc: 'At4eadc0 entry, the fixed route has no subsegments/transport and the Shaman is already at its cell-center destination.'
       for pc in (0x4eb18c,0x4eb1af,0x4eb4b9,0x4eb4ce,0x4eb4c0,
                  0x4eb6ce,0x4eb6e0,0x4eb7d3,0x4eb90b,0x4eb929,0x4eb8d1)},
    0x4ea036: 'The same-point Shaman destination is not an authored building cell; entry guard checks this.',
}


def collect(executable):
    raw = executable.read_bytes()
    assert hashlib.sha256(raw).hexdigest() == EXPECTED_EXE
    pe = struct.unpack_from('<I', raw, 60)[0]
    base = struct.unpack_from('<I', raw, pe + 52)[0]
    count = struct.unpack_from('<H', raw, pe + 6)[0]
    optional = struct.unpack_from('<H', raw, pe + 20)[0]
    sections = [struct.unpack_from('<8sIIII', raw, pe + 24 + optional + i * 40)
                for i in range(count)]
    def read(address, length):
        for _, _, rva, size, offset in sections:
            if base + rva <= address and address + length <= base + rva + size:
                start = offset + address - base - rva
                return raw[start:start + length]
        raise ValueError(hex(address))
    decoder = Cs(CS_ARCH_X86, CS_MODE_32)
    decoder.detail = True
    instructions, calls, jumps, pending = {}, {}, {}, []
    roots = sorted(REAL | set(SLICES))
    for root in roots:
        work, seen = [root], set()
        while work:
            pc = work.pop()
            while pc not in seen and pc != SLICES.get(root):
                seen.add(pc)
                assert len(seen) < 20000, ('static function extent', hex(root))
                insn = next(decoder.disasm(read(pc, 16), pc, count=1), None)
                assert insn is not None and insn.mnemonic not in ('int3', 'hlt'), (hex(root), hex(pc))
                row = {'bytes': insn.bytes.hex(), 'size': insn.size,
                       'mnemonic': insn.mnemonic, 'operands': insn.op_str}
                instructions[f'{pc:08x}'] = row
                after = pc + insn.size
                if insn.mnemonic.startswith('ret'):
                    break
                if insn.mnemonic == 'call':
                    target = insn.operands[0]
                    if target.type != X86_OP_IMM:
                        pending.append({'kind': 'indirect call', 'root': f'{root:08x}', 'pc': f'{pc:08x}', **row})
                    else:
                        destination = target.imm
                        classification = ('excluded' if pc in EXCLUDED_CALLS else
                                          'supplied' if destination in SUPPLIED else
                                          'real' if destination in REAL else
                                          'pending')
                        calls[f'{pc:08x}'] = {'target': f'{destination:08x}', 'classification': classification,
                                            'return': f'{after:08x}', 'root': f'{root:08x}'}
                        if classification == 'pending':
                            pending.append({'kind': 'direct call', 'root': f'{root:08x}', 'pc': f'{pc:08x}', 'target': f'{destination:08x}'})
                if insn.group(CS_GRP_JUMP):
                    operand = insn.operands[0]
                    if operand.type == X86_OP_IMM:
                        destination = operand.imm
                        if destination in REAL and destination != root:
                            jumps[f'{pc:08x}'] = [f'{destination:08x}']
                        else:
                            work.append(destination)
                        if insn.mnemonic == 'jmp':
                            break
                    else:
                        indexes = SELECTED_SWITCHES.get(pc)
                        if indexes is None or operand.type != X86_OP_MEM or operand.mem.base:
                            pending.append({'kind': 'indirect jump', 'root': f'{root:08x}', 'pc': f'{pc:08x}', **row})
                        else:
                            table = operand.mem.disp
                            targets = [struct.unpack('<I', read(table + index * 4, 4))[0] for index in indexes]
                            jumps[f'{pc:08x}'] = [f'{target:08x}' for target in targets]
                            work.extend(targets)
                        break
                pc = after
    result = {'executableSha256': EXPECTED_EXE, 'ready': not pending,
              'mode': 'static source preparation; no emulator constructed',
              'realEntries': [f'{a:08x}' for a in sorted(REAL)],
              'slices': {f'{a:08x}': f'{b:08x}' for a,b in SLICES.items()},
              'suppliedEntries': {f'{a:08x}': count for a,count in SUPPLIED.items()},
              'selectedSwitches': {f'{a:08x}': indexes for a,indexes in SELECTED_SWITCHES.items()},
              'excludedCalls': {f'{a:08x}': reason for a,reason in EXCLUDED_CALLS.items()},
              'instructions': dict(sorted(instructions.items())),
              'calls': dict(sorted(calls.items())), 'jumps': dict(sorted(jumps.items())),
              'pending': pending}
    (HERE / 'closure.json').write_text(json.dumps(result, indent=2) + '\n')
    print(json.dumps({'ready': result['ready'], 'instructions': len(instructions),
                      'calls': len(calls), 'pending': pending}, indent=2))


if __name__ == '__main__':
    collect(Path(sys.argv[1]))
