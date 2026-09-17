#!/usr/bin/env python3
"""Static original-byte proof for Mission 18 sky filename and image-load consumers.

Requires Python 3.9+ and Capstone 5 (validated with 5.0.7, already used by the
repository's native research checks). EXE is the only required external input.
No game code, emulator, OS API from the EXE, Ghidra, Git or repository data is run.
Use --output for inspectable decoded windows/conditions; existing files are never
replaced. Optional --data-root rechecks the historical Mission 18 header/palette.
"""
from __future__ import annotations

import argparse
from datetime import datetime, timezone
import hashlib
import json
from pathlib import Path
import struct
import sys

EXE_SHA256 = '3a5065c7420b3fcde208bf220bc86dfbac95e025ab2492caf9c7ea5308dfbe4f'
# File-backed windows, not inferred function-size assertions. Cleanup/padding may
# be included; every byte must decode. No generated C or external export is used.
RANGES = {
    0x0042a140: 0x340, 0x0042a500: 0x61, 0x004b5f40: 0x185, 0x004309b0: 0x12d,
    0x005001b0: 0x12c, 0x00526280: 0x18, 0x00526300: 0x61, 0x00526370: 0x11,
    0x00526480: 0x36, 0x00525e00: 0x180, 0x00525d00: 0x14, 0x005261b0: 0xc2,
    0x00525ca0: 0x5a, 0x00528d00: 0xc0, 0x00528dc0: 0x8b, 0x00528e50: 0xc0,
    0x0052e250: 0x313, 0x0054e540: 0xb0, 0x00556320: 0x70, 0x00556730: 0x77,
    0x0054e430: 0x2b, 0x00556640: 0xed, 0x005598a0: 0x22, 0x004b60d0: 0x250,
    0x0054e030: 0x140, 0x0052b690: 0xa0,
}


class ProofError(ValueError):
    """Unexpected input or static evidence; never downgrade to a passing report."""


def sha256(data: bytes) -> str:
    return hashlib.sha256(data).hexdigest()


class PE32:
    """Read a known x86 PE as bytes, including its import address table."""

    def __init__(self, path: Path):
        self.path = path.resolve(strict=True)
        if not self.path.is_file() or self.path.stat().st_size > 64 * 1024 * 1024:
            raise ProofError('EXE must be a regular file no larger than 64 MiB')
        self.data = self.path.read_bytes()
        actual = sha256(self.data)
        if actual != EXE_SHA256:
            raise ProofError(f'EXE SHA-256 mismatch: expected {EXE_SHA256}, got {actual}')
        if self.data[:2] != b'MZ':
            raise ProofError('Missing MZ signature')
        header = struct.unpack_from('<I', self.data, 60)[0]
        if self.data[header:header + 4] != b'PE\0\0':
            raise ProofError('Missing PE signature')
        machine, count, _, _, _, opt_size, _ = struct.unpack_from('<HHIIIHH', self.data, header + 4)
        if machine != 0x14c or struct.unpack_from('<H', self.data, header + 24)[0] != 0x10b:
            raise ProofError('Expected x86 PE32')
        if not 1 <= count <= 96:
            raise ProofError('Invalid section count')
        self.base = struct.unpack_from('<I', self.data, header + 52)[0]
        self.sections = []
        for i in range(count):
            pos = header + 24 + opt_size + 40 * i
            virtual_size, rva, raw_size, offset = struct.unpack_from('<4I', self.data, pos + 8)
            self.sections.append({
                'name': self.data[pos:pos + 8].rstrip(b'\0').decode('ascii'),
                'va': self.base + rva, 'virtualSize': virtual_size,
                'rawSize': raw_size, 'fileOffset': offset,
            })
        self.imports = {}
        rva, size = struct.unpack_from('<II', self.data, header + 24 + 96 + 8)
        if not rva:
            raise ProofError('Expected import directory')
        for i in range(min(size // 20 + 1, 512)):
            entry = struct.unpack('<5I', self.read(self.base + rva + i * 20, 20))
            if not any(entry):
                break
            original, _, _, name, iat = entry
            dll = self.cstr(self.base + name)
            for j in range(2048):
                thunk = self.u32(self.base + (original or iat) + j * 4)
                if not thunk:
                    break
                symbol = f'#{thunk & 0xffff}' if thunk & 0x80000000 else self.cstr(self.base + thunk + 2)
                self.imports[self.base + iat + j * 4] = f'{dll}!{symbol}'
            else:
                raise ProofError('Unterminated import thunk array')
        else:
            raise ProofError('Unterminated import directory')

    def offset(self, va: int, size: int = 1) -> int:
        if size < 0:
            raise ProofError('Negative byte range')
        for section in self.sections:
            delta = va - section['va']
            if 0 <= delta and delta + size <= section['rawSize']:
                offset = section['fileOffset'] + delta
                if offset + size <= len(self.data):
                    return offset
        raise ProofError(f'VA is not file-backed: {va:08x}+{size:x}')

    def read(self, va: int, size: int) -> bytes:
        offset = self.offset(va, size)
        return self.data[offset:offset + size]

    def u32(self, va: int) -> int:
        return struct.unpack('<I', self.read(va, 4))[0]

    def cstr(self, va: int) -> str:
        result = bytearray()
        for i in range(512):
            value = self.read(va + i, 1)[0]
            if value == 0:
                return result.decode('ascii')
            result.append(value)
        raise ProofError(f'Unterminated string at {va:08x}')


def check_executable(pe: PE32) -> dict:
    # Import only a decoder, never native_cpu/Unicorn or the supplied executable.
    try:
        import capstone
        from capstone.x86 import X86_OP_IMM, X86_OP_MEM
    except ImportError as error:
        raise ProofError('Capstone 5 is required; use the existing Python research environment (validated with 5.0.7)') from error
    if capstone.__version__.split('.')[0] != '5':
        raise ProofError(f'Expected existing Capstone 5; found {capstone.__version__}')
    decoder = capstone.Cs(capstone.CS_ARCH_X86, capstone.CS_MODE_32)
    decoder.detail = True
    checks, listing, rows = [], {}, {}

    def eq(actual, expected, name):
        if actual != expected:
            raise ProofError(f'{name}: expected {expected!r}, got {actual!r}')
        checks.append(name)

    def truth(value, name):
        eq(bool(value), True, name)

    for va, size in RANGES.items():
        data = pe.read(va, size)
        decoded = []
        for instruction in decoder.disasm(data, va):
            references, immediates = [], []
            for operand in instruction.operands:
                value = None
                if operand.type == X86_OP_IMM:
                    value = operand.imm & 0xffffffff
                    immediates.append(value)
                elif operand.type == X86_OP_MEM and operand.mem.base == 0 and operand.mem.index == 0:
                    value = operand.mem.disp & 0xffffffff
                if value in pe.imports:
                    references.append({'va': f'{value:08x}', 'import': pe.imports[value]})
            row = {'va': f'{instruction.address:08x}', 'bytes': instruction.bytes.hex(),
                   'size': instruction.size, 'mnemonic': instruction.mnemonic,
                   'op': instruction.op_str, 'references': references}
            if (instruction.group(capstone.CS_GRP_CALL) or instruction.group(capstone.CS_GRP_JUMP)) and immediates:
                row['target'] = f'{immediates[0]:08x}'
            decoded.append(row)
            rows[instruction.address] = row
        eq(sum(row['size'] for row in decoded), size, f'complete static window {va:08x}')
        listing[f'{va:08x}'] = {'start': f'{va:08x}', 'endExclusive': f'{va + size:08x}',
                               'fileOffset': pe.offset(va, size), 'sha256': sha256(data), 'rows': decoded}

    def ins(va, mnemonic, operand=None):
        if va not in rows:
            raise ProofError(f'Missing instruction boundary {va:08x}')
        row = rows[va]
        eq(row['mnemonic'], mnemonic, f'mnemonic {va:08x}')
        if operand is not None:
            eq(row['op'], operand, f'operand {va:08x}')
        return row

    def call(va, target):
        ins(va, 'call', f'0x{target:x}')

    def branch(va, mnemonic, target):
        ins(va, mnemonic, f'0x{target:x}')

    # Existing handoff byte addresses and the bank selector/open-only condition.
    call(0x42a51c,0x42a140)
    ins(0x42a38f,'cmp','byte ptr [esp + 0x34], 0')
    branch(0x42a394,'je',0x42a478)
    ins(0x42a39a,'cmp','byte ptr [esp + 0x34], 0xa')
    branch(0x42a3a3,'jge',0x42a3aa)
    ins(0x42a3a5,'add','bl, 0x30')
    ins(0x42a3aa,'add','bl, 0x57')
    eq(chr(16+0x57),'g','static bank16 character arithmetic')
    ins(0x42a3d3,'mov','byte ptr [esp + 0x1a], bl')
    ins(0x42a3f7,'push','0x80000001')
    call(0x42a402,0x526280)
    ins(0x42a40a,'test','eax, eax')
    branch(0x42a40c,'jne',0x42a46f)
    call(0x42a413,0x526370)
    writes=[(0x42a41b,0x5a5e1a),(0x42a421,0x991517),(0x42a427,0x9915af),(0x42a42d,0x9915ef),(0x42a433,0x89271d)]
    for pc,dest in writes:ins(pc,'mov','byte ptr [0x%x], bl'%dest)
    ins(0x42a473,'mov','byte ptr [0x895dcd], al')
    call(0x52628f,0x526300)
    ins(0x52631b,'test','cl, 0x10')
    ins(0x52631e,'mov','eax, 3')
    ins(0x52633e,'and','ecx, 0xc0000000')
    ins(0x526344,'and','eax, 3')
    ins(0x52634e,'call','dword ptr [0xd0c760]')
    eq(pe.imports[0xd0c760],'KERNEL32.dll!CreateFileA','CreateFileA IAT identity')
    ins(0x526358,'mov','dword ptr [ecx], eax')
    ins(0x52635a,'inc','eax')
    ins(0x52635b,'cmp','eax, 1')
    ins(0x52635e,'sbb','eax, eax')
    ins(0x526375,'call','dword ptr [0xd0c7a4]')
    eq(pe.imports[0xd0c7a4],'KERNEL32.dll!CloseHandle','close IAT identity')
    truth(all(not any('ReadFile' in ref.get('import','') for ref in row['references']) for s in ['0042a140','00526280','00526300'] for row in listing[s]['rows']),'filename gate has no palette-read call in direct path')
    # Resolver: drive-qualified unchanged; otherwise existing configured-root candidate or original relative filename.
    ins(0x5001bf,'cmp','byte ptr [edi + 1], 0x3a')
    branch(0x5001c3,'je',0x5002af)
    ins(0x5001c9,'mov','eax, 1')
    ins(0x5001d2,'cmp','eax, eax')
    branch(0x5001d4,'je',0x500200)
    eq(pe.cstr(0x5d6ad4),'%c:\\%s','configured root format')
    eq(pe.cstr(0x599b34),'%s\\%s','candidate join format')
    call(0x500242,0x526480)
    branch(0x50024c,'je',0x500282)
    ins(0x500267,'mov','esi, edi')
    ins(0x500294,'mov','esi, edi')
    ins(0x5002c1,'mov','esi, edi')
    ins(0x5264a2,'call','dword ptr [0xd0c7a8]')
    eq(pe.imports[0xd0c7a8],'KERNEL32.dll!GetFileAttributesA','existence-check IAT identity')
    ins(0x5264a8,'inc','eax')
    ins(0x5264ac,'sbb','eax, eax')
    ins(0x5264b4,'inc','eax')
    call(0x525d09,0x5261b0)
    ins(0x5261ba,'call','dword ptr [0xd0c788]')
    eq(pe.imports[0xd0c788],'KERNEL32.dll!GetCommandLineA','base path lazy-init source')
    call(0x526266,0x525ca0)
    eq(pe.cstr(0x5e06ec),'%s\\','cached base trailing separator')
    # Image leaf: same resolved filename in both stages; no container argument for sky.
    call(0x430a0f,0x4a3d20)
    call(0x430a1d,0x5001b0)
    ins(0x430a2f,'push','0')
    ins(0x430a31,'push','0x89cd23')
    call(0x430a36,0x528d00)
    ins(0x430a3b,'cmp','eax, -1')
    branch(0x430a3e,'jne',0x430a61)
    ins(0x430a4c,'mov','eax, 0xffffffff')
    ins(0x430a68,'push','0')
    ins(0x430a70,'push','0')
    ins(0x430a72,'push','0x89cd23')
    call(0x430a78,0x528e50)
    ins(0x430a7d,'cmp','eax, -1')
    branch(0x430a80,'jne',0x430a8b)
    branch(0x430a89,'jmp',0x430a40)
    ins(0x430ab1,'xor','eax, eax')
    call(0x528d6a,0x52e250)
    branch(0x528d71,'je',0x528d81)
    branch(0x528d7f,'jmp',0x528d2b)
    ins(0x528d2b,'mov','eax, 0xffffffff')
    call(0x528e96,0x52e250)
    branch(0x528e9d,'je',0x528ec1)
    ins(0x528eab,'mov','eax, 0xffffffff')
    ins(0x52e2ce,'mov','edi, dword ptr [ebp + 0xc]')
    ins(0x52e2d1,'test','edi, edi')
    branch(0x52e2d3,'je',0x52e3b4)
    call(0x52e3c4,0x525e00)
    call(0x52e47a,0x54e540)
    call(0x52e4ea,0x54e430)
    call(0x54e585,0x556320)
    call(0x54e599,0x556730)
    ins(0x556352,'mov','dword ptr [esi], 0x592d78')
    eq(pe.u32(0x592d78+4),0x556640,'ordinary-directory vtable open slot')
    ins(0x54e455,'call','dword ptr [eax + 4]')
    call(0x5566d2,0x5598a0)
    branch(0x5566d9,'je',0x5566f3)
    branch(0x5566ee,'jmp',0x556667)
    ins(0x556667,'mov','eax, 0xffffffff')
    call(0x5598b6,0x526300)
    # The ordinary path splitter locates the last separator and forms substring views.
    ins(0x54e057,'cmp','byte ptr [eax], dl')
    ins(0x54e05b,'dec','eax')
    ins(0x54e069,'sub','eax, ecx')
    ins(0x54e12a,'mov','dword ptr [eax + 8], ecx')
    ins(0x54e12d,'mov','dword ptr [eax + 4], edx')
    ins(0x54e150,'sub','esi, edx')
    call(0x52b6ea,0x54ded0)
    # Failure propagates to wrapper false, then type1; successful wrapper path is not pixel-success certification.
    call(0x4b5f60,0x4309b0)
    ins(0x4b5f68,'test','eax, eax')
    branch(0x4b5f6a,'jne',0x4b60ba)
    ins(0x4b60ba,'xor','eax, eax')
    ins(0x4b60ac,'mov','eax, 1')
    call(0x4b610e,0x4b5f40)
    branch(0x4b6123,'je',0x4b6191)
    branch(0x4b6127,'je',0x4b6191)
    ins(0x4b6191,'mov','dword ptr [0x5d54d0], 1')
    ins(0x4b62f1,'mov','dword ptr [0x5ce0e4], 1')

    # Literal identities and character offsets are proof data, not game-root assumptions.
    templates = [
        (0x59c898, 0x5a5e10, 10, 'data/sky0-0.dat'),
        (0x59c880, 0x991508, 15, 'data/d3d/DSky0-01.png'),
        (0x59c868, 0x9915a0, 15, 'data/d3d/Dsky0-02.png'),
        (0x59c850, 0x9915e0, 15, 'data/d3d/Dsky0-0b.png'),
        (0x59c840, 0x892713, 10, 'data/pal0-0.dat'),
    ]
    names = []
    for source, destination, index, default in templates:
        eq(pe.cstr(source), default, f'filename literal {source:08x}')
        eq(default[index], '0', f'bank slot in {default}')
        names.append({'literalVA': f'{source:08x}', 'globalBase': f'{destination:08x}',
                      'bankIndex': index, 'default': default,
                      'ifBank16PaletteOpenSucceeds': default[:index] + 'g' + default[index + 1:]})
    return {
        'proofKind': 'original-byte static disassembly; never executed or emulated',
        'status': 'PASS_STATIC_DISASSEMBLY_ONLY', 'exeSha256': sha256(pe.data),
        'exeBytes': len(pe.data), 'imageBase': f'{pe.base:08x}',
        'capstone': capstone.__version__, 'checks': checks, 'assertions': len(checks),
        'templateSubstitutions': names, 'windows': listing,
        'imports': {f'{va:08x}': symbol for va, symbol in pe.imports.items()},
        'conditions': {
            'palette': 'Names reset to bank 0. Nonzero bank 16 maps to g only after palette handle open returns 0; error leaves defaults. No palette-content read is part of this gate.',
            'path': 'Drive-qualified unchanged; otherwise an existing configured-root candidate is selected, or the original relative resource path. Engine base may be lazily derived from the executable command line. Existence is not successful open.',
            'image': 'The same resolved filename and null container reach both image stages. The ordinary directory/file backend propagates open failure as -1, leaf -1, wrapper 0. No replacement basename/bank/extension retry on that failure path.',
            'sky': 'On fresh initialization, wrapper 0 or zero UI+d14 selects type 1. Already-initialized state bypasses loading; g1/g2 are on the success branch, not missing-backdrop retries.',
        },
        'limits': [
            'No Windows APIs, target instructions, image decoder or renderer were executed.',
            'An EXE-only run does not recheck historical header/palette/package availability; use explicit --data-root for header/palette identity only.',
            'Actual runtime paths, permissions, open outcomes, initialized/UI/palette/lens state and pixels remain unobserved.',
            'Successful decoder and graphics-allocation behavior are not certified by this failed-open path proof.',
        ],
    }


def check_data(root: Path) -> dict:
    """Optional identity checks, not palette interpretation or original-process opens."""
    expected = [
        ('levels/levl2018.hdr', 616, '6ede1c60604d8f0e4f8c959ece873506e8a5882b93c93df12a000061483232c4'),
        ('data/pal0-g.dat', 1024, '63abc7be002f6ebe763a39f921e8b7442fe2839150e8ca7a05c0084440e982ac'),
    ]
    files = []
    for relative, size, digest in expected:
        path = root / relative
        data = path.read_bytes()
        if len(data) != size or sha256(data) != digest:
            raise ProofError(f'Optional input identity mismatch: {relative}')
        if relative.endswith('.hdr') and data[96] != 16:
            raise ProofError('Mission 18 header does not select landscape bank 16')
        files.append({'path': relative, 'bytes': size, 'sha256': digest})
    return {'status': 'PASS_HOST_INPUT_IDENTITY_ONLY', 'files': files, 'landscapeBank': 16,
            'limits': 'No package enumeration, palette decode, Windows file open or runtime-state check.'}


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('exe', type=Path, help='user-supplied d3dpoptb.exe (exact SHA-256 required)')
    parser.add_argument('--output', type=Path, help='new JSON report, including decoded bytes/branches; parent must exist')
    parser.add_argument('--data-root', type=Path, help='optional supplied game directory; check historical Mission 18 HDR and palette hashes')
    args = parser.parse_args()
    try:
        if args.output and (args.output.exists() or args.output.is_symlink()):
            raise ProofError(f'Refusing to replace existing output: {args.output}')
        pe = PE32(args.exe)
        result = check_executable(pe)
        result['inputIdentity'] = check_data(args.data_root) if args.data_root else {'status': 'NOT_REQUESTED_EXE_ONLY'}
        result['createdAt'] = datetime.now(timezone.utc).isoformat()
        result['scriptSha256'] = sha256(Path(__file__).read_bytes())
        result['python'] = sys.version.split()[0]
        if args.output:
            # Exclusive creation prevents overwriting the EXE, tracked sources or an earlier receipt.
            with args.output.open('x', encoding='utf-8') as target:
                json.dump(result, target, indent=2)
                target.write('\n')
        print(json.dumps({
            'status': result['status'], 'exeSha256': result['exeSha256'],
            'scriptSha256': result['scriptSha256'], 'assertions': result['assertions'],
            'windows': len(result['windows']), 'capstone': result['capstone'],
            'inputIdentity': result['inputIdentity']['status'],
            'report': str(args.output) if args.output else None,
            'limits': 'Static byte/condition proof only; no native execution, runtime-state or pixel acceptance.',
        }, indent=2))
        return 0
    except (OSError, ProofError, struct.error, UnicodeError) as error:
        print(f'FAIL: {error}', file=sys.stderr)
        return 1


if __name__ == '__main__':
    sys.exit(main())
