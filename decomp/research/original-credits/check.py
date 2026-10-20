#!/usr/bin/env python3
"""Verify bounded Credits evidence as data. Never execute/emulate the original.

Usage: python check.py --game GAME_ROOT [--output NEW_DIRECTORY]
The optional output is a source packet, not imported browser assets.
"""
import argparse
import hashlib
import importlib.util
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[3]
INPUTS = {
    'd3dpoptb.exe': '3a5065c7420b3fcde208bf220bc86dfbac95e025ab2492caf9c7ea5308dfbe4f',
    'language/lang00.dat': 'e826c478746d666a3ea9ea36cb7804d1d226d5f83084230987b1de293066cf7d',
    'data/credits.txt': '7c821672c19e46bdf19b01f2fe94434f6de5ad18dbb36ea577c8188b96463ef6',
}
RANGES = {
    'entry': (0x4c5af0, 0x4c5b20),
    'state-request': (0x442a60, 0x442aa6),
    'dispatch': (0x4a4737, 0x4a4776),
    'controller': (0x4a9380, 0x4a96ec),
    'draw': (0x4a96f0, 0x4a99c7),
    'loader': (0x4a99d0, 0x4a9be6),
}
# Finite, manually inspected instructions. These are not runtime observations.
INSTRUCTIONS = {
    0x4c5b15: ('push', '0xc'),
    0x4c5b17: ('call', '0x442a60'),
    0x442a91: ('mov', 'byte ptr [0x88f001], cl'),
    0x4a4771: ('call', '0x4a9380'),
    0x4a9450: ('mov', 'edi, 0x10'),
    0x4a946d: ('cmp', 'eax, 1'),
    0x4a9476: ('cmp', 'eax, 0x39'),
    0x4a959a: ('mov', 'edi, 4'),
    0x4a95ad: ('cmp', 'byte ptr [0x984681], 0'),
    0x4a95bf: ('cmp', 'byte ptr [0x984683], 0'),
    0x4a95d1: ('cmp', 'byte ptr [0x984682], 0'),
    0x4a95eb: ('push', '7'),
    0x4a95ed: ('call', '0x442a60'),
    0x4a969e: ('cmp', 'eax, dword ptr [0x98e900]'),
    0x4a96a4: ('jbe', '0x4a96bc'),
    0x4a96a6: ('dec', 'dword ptr [0x98e7ec]'),
    0x4a96ac: ('add', 'dword ptr [0x98e900], edi'),
    0x4a96ba: ('ja', '0x4a96a6'),
    0x4a96bc: ('call', '0x4a96f0'),
    0x4a972f: ('add', 'edi, 0x1e'),
    0x4a977e: ('mov', 'ecx, dword ptr [eax*4 + 0x972ba8]'),
    0x4a97b9: ('call', '0x45ec10'),
    0x4a97c6: ('cmp', 'edi, -0x14'),
    0x4a97e1: ('sar', 'esi, 1'),
    0x4a98f1: ('call', '0x45ec10'),
    0x4a9919: ('sar', 'esi, 1'),
    0x4a999c: ('mov', 'ebx, dword ptr [0x98e7f4]'),
    0x4a99a4: ('lea', 'edi, [eax + edi + 0x14]'),
    0x4a99aa: ('inc', 'eax'),
    0x4a99ab: ('mov', 'dword ptr [0x98e7ec], eax'),
    0x4a99d0: ('movsx', 'eax, word ptr [0x89c6d1]'),
    0x4a99dd: ('inc', 'eax'),
    0x4a99de: ('mov', 'dword ptr [0x98e7ec], eax'),
    0x4a9ada: ('call', '0x55d4e0'),
    0x4a9adf: ('mov', 'word ptr [esi - 2], ax'),
    0x4a9b64: ('add', 'ax, 0x42f'),
    0x4a9b68: ('mov', 'word ptr [ebp], ax'),
    0x4a9b6e: ('cmp', 'ax, 0xd'),
    0x4a9ba3: ('cmp', 'ax, 0x20'),
}


def verify(game, output=None):
    # Authenticate every required input before loading any decoder or writing output.
    data = {}
    for name, expected in INPUTS.items():
        data[name] = (game / name).read_bytes()
        if hashlib.sha256(data[name]).hexdigest() != expected:
            raise ValueError(f'Input SHA-256 mismatch: {name}')
    import capstone
    spec = importlib.util.spec_from_file_location('credits_pe_reader', ROOT / 'scripts/check-static-mission18-sky.py')
    reader = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(reader)
    pe = reader.PE32(game / 'd3dpoptb.exe')
    decoder = capstone.Cs(capstone.CS_ARCH_X86, capstone.CS_MODE_32)
    instructions, windows, listings = {}, {}, {}
    for name, (start, end) in RANGES.items():
        raw = pe.read(start, end - start)
        decoded = list(decoder.disasm(raw, start))
        if sum(i.size for i in decoded) != len(raw):
            raise ValueError(f'Incomplete decode: {name}')
        instructions.update({i.address: (i.mnemonic, i.op_str) for i in decoded})
        listings[name] = ''.join(f'{i.address:08x} {i.bytes.hex():24s} {i.mnemonic:8s} {i.op_str}'.rstrip() + '\n' for i in decoded)
        windows[name] = {'start': f'{start:08x}', 'endExclusive': f'{end:08x}', 'sha256': hashlib.sha256(raw).hexdigest()}
    for address, expected in INSTRUCTIONS.items():
        if instructions.get(address) != expected:
            raise ValueError(f'Instruction mismatch: {address:08x}')
    lang = data['language/lang00.dat'].decode('utf-16le').split('\0')
    lines = data['data/credits.txt'].decode('latin1').split('\r\n')
    headings = [{'sourceLine': i + 1, 'id': int(line), 'languageId': 1071 + int(line), 'text': lang[1071 + int(line)]}
                for i, line in enumerate(lines) if line.isascii() and line.isdecimal()]
    conditions = {
        'main menu Credits descriptor': pe.u32(0x5d7d20 + 0x24) == 445 and pe.u32(0x5d7d20 + 0x28) == 0x4c5af0 and lang[445] == 'Credits',
        'state12 dispatch': pe.read(0x4a4954 + 10, 1) == b'\x05' and pe.u32(0x4a4938 + 5 * 4) == 0x4a4771,
        'clock import': pe.imports[0xd0c784] == 'KERNEL32.dll!GetTickCount',
        'file paths': pe.cstr(0x5cdb60) == '%s\\credits.txt' and pe.cstr(0x5cdb4c) == 'data\\credits.txt',
        'binary open mode': pe.cstr(0x5984ac) == 'rb',
        'complete source size': len(data['data/credits.txt']) == 5308 and len(lines) == 570,
        'authored heading order': len(headings) == 101 and [h['id'] for h in headings[:10]] == [0, 1, 2, 3, 4, 5, 6, 7, 13, 8],
        'repeated producer heading': [h['id'] for h in headings].count(2) == 2 and headings[88]['id'] == 2 and headings[87]['id'] == 94,
        'last heading': headings[-1]['languageId'] == 1178 and headings[-1]['text'] == 'Thanks To',
        'spacing preserved': '  ' in lines and 'Michael Willis ' in lines,
        'extended characters preserved': all(value in lines for value in ['James Lenoël, Oli Ladenburg', 'Julio Valladares, Ricardo Martínez', 'Frank Gördes']),
    }
    for name, passed in conditions.items():
        if not passed:
            raise ValueError(f'Failed condition: {name}')
    report = {'method': 'static data/disassembly only; no original execution/emulation',
              'inputs': INPUTS, 'capstone': capstone.__version__, 'windows': windows,
              'instructionAssertions': len(INSTRUCTIONS), 'conditions': list(conditions),
              'headings': headings, 'byteLinesLatin1': lines,
              'limits': 'Not a native parser/runtime oracle; artwork/font/palette, full event producer and focus-return acceptance remain unresolved.'}
    if output is not None:
        output.mkdir(parents=True, exist_ok=False)
        for name, text in listings.items():
            (output / f'{name}.asm').write_text(text)
        (output / 'source-packet.json').write_text(json.dumps(report, indent=2, ensure_ascii=False) + '\n')
    return report


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--game', type=Path, required=True)
    parser.add_argument('--output', type=Path)
    args = parser.parse_args()
    result = verify(args.game, args.output)
    print(f"PASS: {result['instructionAssertions']} instruction assertions, {len(result['conditions'])} data conditions, {len(RANGES)} fully decoded source windows; no original execution.")
