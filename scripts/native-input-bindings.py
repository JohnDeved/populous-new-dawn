#!/usr/bin/env python3
"""Read-only atlas of the original default input bindings; never executes the EXE.

Decodes the complete default binding table that the original key-map loader
(004f1820) passes to the binding constructor (00489300), and resolves each bound
action through process_cmd's (004aab80) two-level switch. Optional Ghidra
pseudocode (decomp/generated/004aab80.c) adds a short, clearly labelled excerpt
of each case body; that excerpt is inferred pseudocode, not recovered source.

Usage:
  python3 -B scripts/native-input-bindings.py EXE > /tmp/bindings.json
  python3 -B scripts/native-input-bindings.py EXE --markdown > /tmp/bindings.md
  python3 -B scripts/native-input-bindings.py EXE --key h --key period

Only Python's standard library is needed. Saved user key_def.dat overrides,
predicate semantics and downstream command behavior are outside this tool.
"""
import argparse
import hashlib
import json
import re
import struct
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
EXPECTED = '3a5065c7420b3fcde208bf220bc86dfbac95e025ab2492caf9c7ea5308dfbe4f'
PSEUDOCODE = ROOT / 'decomp/generated/004aab80.c'

CONSTRUCTOR = 0x489300
# 004f1820: push <defaults>; mov ecx,esi; call 00489300 (verified byte-for-byte).
LOADER_CALL = 0x4f1868
LOADER_BYTES = bytes.fromhex('68e85d5d008bce')
DEFAULTS = 0x5d5de8
RECORD = 12
MAX_RECORDS = 512
# process_cmd uses two byte-indexed switches. Stage 1 runs first; its default
# (004aabd1) clears edi and jumps to stage 2, which only runs while byte
# 0089c661 bit 2 is clear. Both stages share exit 004ad5b9. Bytes are verified.
STAGES = (
    {   # lea edx,[ebx-0d]; cmp edx,0c1; ...; ja +0f; xor ecx,ecx;
        # mov cl,[edx+004ad740]; jmp [ecx*4+004ad5c4]
        'stage': 1, 'bias': 0x0d, 'span': 0xc1, 'index': 0x4ad740, 'jump': 0x4ad5c4,
        'fallthrough': 0x4aabd1, 'break': 0x4abbe2, 'gate': None,
        'patterns': ((0x4aabac, '8d53f381fac1000000'),
                     (0x4aabc0, '770f33c98a8a40d74a00ff248dc4d54a00'),
                     (0x4aabd1, '33ffe90a100000')),
    },
    {   # test edi,edi; jnz exit; test byte [0089c661],2; jnz exit; lea ecx,[ebx-0f];
        # cmp ecx,0b7; ja exit; xor eax,eax; mov al,[ecx+004ad8dc]; jmp [eax*4+004ad814]
        'stage': 2, 'bias': 0x0f, 'span': 0xb7, 'index': 0x4ad8dc, 'jump': 0x4ad814,
        'fallthrough': 0x4ad5b9, 'break': 0x4ad5b9, 'gate': '0089c661 & 2 clear',
        'patterns': ((0x4abbe2, '85ff0f85cf190000f60561c6890002'
                                '0f85c21900008d4bf181f9b70000000f87b3190000'
                                '33c08a81dcd84a00ff248514d84a00'),),
    },
)

# 004a9d90 collapses Shift (2a/36) to 1, Ctrl (1d/9d) to 2, Alt (38/b8) to 4.
MODIFIERS = ((1, 'Shift'), (2, 'Ctrl'), (4, 'Alt'))
# 004a9d90 passes event 1 for press and 4 for release to matcher 00489470.
EVENTS = {1: 'press', 4: 'release'}
# DirectInput mouse producer (original-startup-movies/input-player/mouse-producer.asm).
MOUSE = {0xf0: 'Mouse left', 0xf1: 'Mouse right', 0xf2: 'Mouse button 2/3'}
DIK = {
    0x01: 'Escape', 0x0e: 'Backspace', 0x0f: 'Tab', 0x1c: 'Enter', 0x1d: 'Left Ctrl',
    0x0c: 'Minus', 0x0d: 'Equals', 0x1a: 'Left bracket', 0x1b: 'Right bracket',
    0x27: 'Semicolon', 0x28: 'Apostrophe', 0x29: 'Grave', 0x2a: 'Left Shift', 0x2b: 'Backslash',
    0x35: 'Slash', 0x3a: 'Caps Lock', 0x45: 'Num Lock', 0x46: 'Scroll Lock', 0x33: 'Comma', 0x34: 'Period',
    0x36: 'Right Shift', 0x37: 'Numpad *', 0x38: 'Left Alt', 0x39: 'Space',
    0x47: 'Numpad 7', 0x48: 'Numpad 8', 0x49: 'Numpad 9', 0x4a: 'Numpad -',
    0x4b: 'Numpad 4', 0x4c: 'Numpad 5', 0x4d: 'Numpad 6', 0x4e: 'Numpad +',
    0x4f: 'Numpad 1', 0x50: 'Numpad 2', 0x51: 'Numpad 3', 0x52: 'Numpad 0',
    0x53: 'Numpad .', 0x57: 'F11', 0x58: 'F12', 0x9c: 'Numpad Enter',
    0x9d: 'Right Ctrl', 0xb5: 'Numpad /', 0xb7: 'Print Screen', 0xb8: 'Right Alt',
    0xc5: 'Pause', 0xc7: 'Home', 0xc8: 'Up', 0xc9: 'Page Up', 0xcb: 'Left',
    0xcd: 'Right', 0xcf: 'End', 0xd0: 'Down', 0xd1: 'Page Down', 0xd2: 'Insert',
    0xd3: 'Delete',
}
DIK.update({0x3b + i: f'F{i + 1}' for i in range(10)})
DIK.update({0x02 + i: str((i + 1) % 10) for i in range(10)})
for start, letters in ((0x10, 'QWERTYUIOP'), (0x1e, 'ASDFGHJKL'), (0x2c, 'ZXCVBNM')):
    DIK.update({start + i: c for i, c in enumerate(letters)})
DIK.update(MOUSE)


class PE32:
    def __init__(self, data):
        pe = struct.unpack_from('<I', data, 0x3C)[0]
        if data[pe:pe + 4] != b'PE\0\0' or struct.unpack_from('<H', data, pe + 24)[0] != 0x10b:
            raise ValueError('Expected a PE32 image')
        count, optional_size = struct.unpack_from('<H12xH', data, pe + 6)
        self.base = struct.unpack_from('<I', data, pe + 24 + 28)[0]
        table = pe + 24 + optional_size
        self.data = data
        self.sections = []
        for i in range(count):
            vsize, rva, raw_size, raw = struct.unpack_from('<IIII', data, table + 40 * i + 8)
            self.sections.append((self.base + rva, max(vsize, raw_size), raw, raw_size))

    def read(self, va, size):
        for start, span, raw, raw_size in self.sections:
            if start <= va and va + size <= start + span:
                if va + size > start + raw_size:
                    raise ValueError(f'{va:08x}+{size:x} extends past raw section data')
                offset = raw + va - start
                return self.data[offset:offset + size]
        raise ValueError(f'{va:08x}+{size:x} is not mapped by one section')


def key_label(code, kind):
    if kind == 'char':
        return {0x20: 'Space'}.get(code, chr(code).upper() if 0x20 < code < 0x7f else f'char {code:#04x}')
    return DIK.get(code, f'DIK {code:#04x}')


def modifiers(mask):
    required = mask & 7
    ignored = (mask >> 3) & 7
    if mask & 0x40:
        return {'required': [], 'ignored': 'any', 'raw': mask}
    if mask & ~0x3f:
        raise ValueError(f'Unknown modifier mask bits {mask:#04x}')
    return {
        'required': [name for bit, name in MODIFIERS if required & bit],
        'ignored': [name for bit, name in MODIFIERS if ignored & bit],
        'raw': mask,
    }


def decode_record(address, raw):
    """Field layout follows constructor 00489300 and matcher 00489470."""
    code, action, flags, mods, gate, predicate = struct.unpack('<BIBBBI', raw)
    source = flags & 0x18
    if source not in (0x08, 0x10):
        raise ValueError(f'{address:08x}: unknown key source flags {flags:#04x}')
    if flags & ~0x1f:
        raise ValueError(f'{address:08x}: unknown record flags {flags:#04x}')
    kind = 'scancode' if source == 0x08 else 'char'
    continuous = bool(flags & 0x02)
    event = flags & 0x05
    if not continuous and event not in EVENTS:
        raise ValueError(f'{address:08x}: unknown event flags {flags:#04x}')
    if action > 0xff:
        raise ValueError(f'{address:08x}: action {action:#x} exceeds one byte')
    if gate & ~0x03:
        raise ValueError(f'{address:08x}: unknown gate flags {gate:#04x}')
    return {
        'address': f'{address:08x}',
        'key': {'code': code, 'kind': kind, 'label': key_label(code, kind)},
        'event': 'continuous' if continuous else EVENTS[event],
        'modifiers': modifiers(mods),
        'action': action,
        'gateFlags': gate,
        'predicate': f'{predicate:08x}' if predicate else None,
        'flags': flags,
    }


def decode_records(read, start):
    records = []
    for index in range(MAX_RECORDS):
        address = start + RECORD * index
        raw = read(address, RECORD)
        if raw[0] == 0:
            return records
        records.append(decode_record(address, raw))
    raise ValueError(f'No terminator within {MAX_RECORDS} records')


def decode_stage(read, stage):
    for address, expected in stage['patterns']:
        if read(address, len(expected) // 2) != bytes.fromhex(expected):
            raise ValueError(f'process_cmd dispatch bytes changed at {address:08x}')
    index = read(stage['index'], stage['span'] + 1)
    targets = struct.unpack(f'<{max(index) + 1}I', read(stage['jump'], 4 * (max(index) + 1)))
    return {stage['bias'] + i: targets[slot] for i, slot in enumerate(index)}


def decode_dispatch(read):
    """Return action -> (stage, case address).

    A stage-1 case that jumps straight to the shared break (004abbe2, edi still
    1) exits without work; it is reported as a no-op rather than a stage-2 case.
    """
    first, second = (decode_stage(read, stage) for stage in STAGES)
    resolved = {}
    for action in range(0x100):
        case = first.get(action, STAGES[0]['fallthrough'])
        if case != STAGES[0]['fallthrough']:
            resolved[action] = (1, case)
            continue
        case = second.get(action, STAGES[1]['fallthrough'])
        if case != STAGES[1]['fallthrough']:
            resolved[action] = (2, case)
    return resolved


def pseudocode_cases(path):
    """Map case labels in the Ghidra export to a short body excerpt."""
    if path is None or not path.is_file():
        return {}
    lines = path.read_text().split('\n')
    label = re.compile(r'^\s*case (0x[0-9a-f]+|\d+):\s*$')
    excerpts = {}
    for i, line in enumerate(lines):
        m = label.match(line)
        if not m:
            continue
        body = []
        depth = 0
        for following in lines[i + 1:]:
            if label.match(following):
                if body:
                    break
                continue
            text = following.strip()
            if text in ('break;', 'return;') or text.startswith('default:'):
                break
            depth += text.count('{') - text.count('}')
            if depth < 0:
                break
            if text:
                body.append(text)
            if len(body) == 3:
                break
        excerpts.setdefault(int(m.group(1), 0), ' '.join(body))
    return excerpts


def build(exe, pseudocode=PSEUDOCODE):
    data = Path(exe).read_bytes()
    identity = hashlib.sha256(data).hexdigest()
    if identity != EXPECTED:
        raise ValueError('Original executable identity mismatch')
    pe = PE32(data)
    call = pe.read(LOADER_CALL - len(LOADER_BYTES), len(LOADER_BYTES) + 5)
    if call[:len(LOADER_BYTES)] != LOADER_BYTES or call[len(LOADER_BYTES)] != 0xe8:
        raise ValueError('Default key-map loader bytes changed')
    target = (LOADER_CALL + 5 + struct.unpack_from('<i', call, len(LOADER_BYTES) + 1)[0]) & 0xffffffff
    if target != CONSTRUCTOR:
        raise ValueError(f'Loader calls {target:08x}, not the binding constructor')
    records = decode_records(pe.read, DEFAULTS)
    actions = decode_dispatch(pe.read)
    excerpts = pseudocode_cases(pseudocode)
    shared = {}
    for action, handler in actions.items():
        shared.setdefault(handler, []).append(action)
    for record in records:
        handler = actions.get(record['action'])
        record['handler'] = None if handler is None else {
            'stage': handler[0],
            'case': f'{handler[1]:08x}',
            'noop': handler[1] == STAGES[handler[0] - 1]['break'],
            'gate': STAGES[handler[0] - 1]['gate'],
            'sharedWith': [a for a in shared[handler] if a != record['action']],
            'pseudocode': excerpts.get(record['action']),
        }
    mark_shadowed(records)
    return {
        'source': {
            'executableSha256': identity,
            'loader': f'004f1820 call {LOADER_CALL:08x}',
            'constructor': f'{CONSTRUCTOR:08x}',
            'defaults': f'{DEFAULTS:08x}',
            'dispatch': [
                {k: (f'{v:08x}' if isinstance(v, int) and k not in ('stage', 'bias', 'span') else v)
                 for k, v in stage.items() if k != 'patterns'}
                for stage in STAGES
            ],
            'pseudocode': str(pseudocode.relative_to(ROOT)) if pseudocode and pseudocode.is_file() and pseudocode.is_relative_to(ROOT) else None,
            'pseudocodeSha256': hashlib.sha256(pseudocode.read_bytes()).hexdigest() if pseudocode and pseudocode.is_file() else None,
        },
        'records': records,
    }


def mark_shadowed(records):
    """Matcher 00489470 walks each bucket in table order and returns the first
    record whose event, modifiers, gate and predicate pass. A later record with
    identical key, event, modifier mask and gate flags behind an earlier record
    without a predicate can never match. Other overlaps are left unmarked."""
    first = {}
    for record in records:
        key = (record['key']['kind'], record['key']['code'], record['flags'],
               record['modifiers']['raw'], record['gateFlags'])
        earlier = first.get(key)
        record['shadowedBy'] = earlier
        if earlier is None and record['predicate'] is None:
            first[key] = record['address']


def chord(record):
    mods = record['modifiers']
    keys = list(mods['required']) + [record['key']['label']]
    text = '+'.join(keys)
    if mods['ignored'] == 'any':
        text += ' (any modifiers)'
    elif mods['ignored']:
        text += f" (ignores {'/'.join(mods['ignored'])})"
    return text


def markdown(atlas):
    rows = [
        '| Record | Input | Event | Action | Predicate | Gate | Handler case | Pseudocode excerpt (inferred) |',
        '| --- | --- | --- | --- | --- | --- | --- | --- |',
    ]
    for r in atlas['records']:
        handler = r['handler'] or {}
        excerpt = (handler.get('pseudocode') or '').replace('|', '\\|')
        if len(excerpt) > 110:
            excerpt = excerpt[:107] + '...'
        shared = handler.get('sharedWith')
        case = handler.get('case', 'not dispatched')
        if handler.get('noop'):
            case += ' (no-op)'
        elif shared:
            case += ' (shared)'
        if r['shadowedBy']:
            case += f" (shadowed by {r['shadowedBy']})"
        rows.append(
            f"| {r['address']} | {chord(r)} | {r['event']} | {r['action']:#04x} | "
            f"{r['predicate'] or '-'} | {r['gateFlags']} | {case} | {excerpt or '-'} |"
        )
    return '\n'.join(rows) + '\n'


def matches(record, wanted):
    label = record['key']['label'].lower()
    return any(w == label or w == f"{record['key']['code']:#04x}" or w == f"{record['action']:#04x}" for w in wanted)


def main(argv=None):
    p = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    p.add_argument('exe', type=Path, help='hash-verified original d3dpoptb.exe (read as data only)')
    p.add_argument('--markdown', action='store_true', help='emit a Markdown table instead of JSON')
    p.add_argument('--key', action='append', default=[],
                   help='filter by key label (e.g. h, period, f1), key code or action (e.g. 0x5d)')
    p.add_argument('--no-pseudocode', action='store_true', help='omit Ghidra pseudocode excerpts')
    a = p.parse_args(argv)
    atlas = build(a.exe, None if a.no_pseudocode else PSEUDOCODE)
    if a.key:
        wanted = [k.lower() for k in a.key]
        atlas['records'] = [r for r in atlas['records'] if matches(r, wanted)]
    sys.stdout.write(markdown(atlas) if a.markdown else json.dumps(atlas, indent=1) + '\n')


if __name__ == '__main__':
    main()
