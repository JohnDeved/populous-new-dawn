#!/usr/bin/env python3
"""Read-only inventory of the original's constant animation-object assignments.

Never executes the EXE. Scans .text for direct `call 004ee700` (unit_set_object,
mirrored by app/animation.ts setAnimationObject: cdecl `(record, draw, object)`)
and recovers the draw descriptor and starting sprite object when the caller pushes
immediates (directly, or through a `mov reg, imm` in the same short window).
Table-driven callers (e.g. the person map at 005a6858) are reported as `dynamic`;
they are already imported into app/original-rules.json.

The result maps each original sprite source to the draw descriptor(s) the original
assigns to it, which `scripts/animation-cadence-audit.mjs` combines with the
imported descriptor table to state native frame-advance rules per family.

Usage:
  .tools/decomp/oracle/bin/python -I scripts/native-animation-setters.py EXE \
      --output decomp/research/animation-cadence/native-setters.json

Requires Capstone (5.0.7 verified). Indirect calls, register-only arguments and
other setters that write the record fields directly are outside this inventory.
"""
import argparse
import hashlib
import json
import platform
import struct
import sys

import capstone
from capstone import x86

EXPECTED = '3a5065c7420b3fcde208bf220bc86dfbac95e025ab2492caf9c7ea5308dfbe4f'
SETTER = 0x4EE700
WINDOW = 40  # bytes searched before each call for its three pushes


def text_section(exe):
    pe = struct.unpack_from('<I', exe, 0x3C)[0]
    count = struct.unpack_from('<H', exe, pe + 6)[0]
    optional = struct.unpack_from('<H', exe, pe + 20)[0]
    base = struct.unpack_from('<I', exe, pe + 52)[0]
    for i in range(count):
        o = pe + 24 + optional + 40 * i
        if exe[o:o + 8].rstrip(b'\0') == b'.text':
            size, va, raw_size, raw = struct.unpack_from('<IIII', exe, o + 8)
            return base + va, exe[raw:raw + raw_size]
    raise SystemExit('no .text section')


def decode_windows(md, code, va, call):
    # Every back-window whose linear decode ends exactly at the call. x86 linear
    # sweep resynchronizes quickly, so the windows are voted on below.
    for back in range(WINDOW, 4, -1):
        start = call - back
        if start < va:
            continue
        ins = list(md.disasm(code[start - va:call - va + 5], start))
        if ins and ins[-1].address == call and ins[-1].mnemonic == 'call':
            yield ins[:-1]


def resolve(ins, index, operand):
    if operand.type == x86.X86_OP_IMM:
        return operand.imm & 0xFFFFFFFF
    if operand.type != x86.X86_OP_REG:
        return None
    reg = operand.reg
    for prior in reversed(ins[:index]):
        ops = prior.operands
        if prior.mnemonic == 'mov' and len(ops) == 2 and ops[0].type == x86.X86_OP_REG \
                and ops[0].reg == reg:
            return ops[1].imm & 0xFFFFFFFF if ops[1].type == x86.X86_OP_IMM else None
        if prior.mnemonic == 'call':
            return None
        if any(o.type == x86.X86_OP_REG and o.reg == reg for o in ops[:1]) \
                and prior.mnemonic not in ('push', 'cmp', 'test'):
            return None
    return None


def function_span(code, va, call):
    # Bounded body: after the nearest preceding int3 padding (<= 0x1000 bytes back)
    # up to the first `ret` after the call (<= 0x200 bytes). Not a CFG recovery.
    start = None
    for a in range(call - 1, max(va, call - 0x1000), -1):
        if code[a - va] == 0xCC and code[a - va - 1] == 0xCC:
            start = a + 1
            while code[start - va] == 0xCC:
                start += 1
            break
    return start


def gate_writes(md, code, va, call):
    """OR of bit 0x40000 into flags3 (+0x14), directly or via a register stored there."""
    start = function_span(code, va, call)
    if start is None:
        return None
    ins = []
    for x in md.disasm(code[start - va:call - va + 0x200], start):
        ins.append(x)
        if x.address > call and x.mnemonic == 'ret':
            break
    if not any(x.address == call for x in ins):
        return None  # body did not decode through the call
    hits, pending = [], {}
    for x in ins:
        ops = x.operands
        if x.mnemonic == 'or' and len(ops) == 2 and ops[1].type == x86.X86_OP_IMM \
                and ops[1].imm & 0x40000:
            if ops[0].type == x86.X86_OP_MEM and ops[0].mem.disp == 0x14:
                hits.append(f'{x.address:08x}')
            elif ops[0].type == x86.X86_OP_REG:
                pending[ops[0].reg] = x.address
        elif x.mnemonic == 'mov' and len(ops) == 2 and ops[0].type == x86.X86_OP_MEM \
                and ops[0].mem.disp == 0x14 and ops[1].type == x86.X86_OP_REG \
                and ops[1].reg in pending:
            hits.append(f'{pending.pop(ops[1].reg):08x}')
    return {'function': f'{start:08x}', 'gateWrites': hits}


def main():
    parser = argparse.ArgumentParser(description=__doc__.splitlines()[0])
    parser.add_argument('exe')
    parser.add_argument('--output')
    args = parser.parse_args()
    exe = open(args.exe, 'rb').read()
    digest = hashlib.sha256(exe).hexdigest()
    if digest != EXPECTED:
        raise SystemExit(f'unexpected EXE sha256 {digest}')
    va, code = text_section(exe)
    md = capstone.Cs(capstone.CS_ARCH_X86, capstone.CS_MODE_32)
    md.detail = True
    calls = []
    for i in range(len(code) - 5):
        if code[i] == 0xE8 and va + i + 5 + struct.unpack_from('<i', code, i + 1)[0] == SETTER:
            calls.append(va + i)
    records = []
    for call in calls:
        votes = {}
        for ins in decode_windows(md, code, va, call):
            pushes = [(n, x) for n, x in enumerate(ins) if x.mnemonic == 'push'][-3:]
            if len(pushes) != 3:
                continue
            # cdecl: object pushed first, then draw, then the record pointer.
            (oi, obj), (di, draw) = pushes[0], pushes[1]
            o = resolve(ins, oi, obj.operands[0])
            d = resolve(ins, di, draw.operands[0])
            key = (d & 0xFF if d is not None else None, o & 0xFFFF if o is not None else None,
                   f'{obj.address:08x}', f'{draw.address:08x}')
            votes[key] = votes.get(key, 0) + 1
        record = {'call': f'{call:08x}', 'draw': None, 'object': None}
        if votes:
            (d, o, oa, da), count = max(votes.items(), key=lambda item: item[1])
            record.update(draw=d, object=o, objectPush=oa, drawPush=da,
                          agreement=f'{count}/{sum(votes.values())}')
        record['kind'] = 'constant' if record['draw'] is not None and record['object'] is not None \
            else 'dynamic'
        body = gate_writes(md, code, va, call)
        if body:
            record.update(body)
        records.append(record)
    by_object = {}
    for r in records:
        if r['kind'] == 'constant':
            by_object.setdefault(str(r['object']), set()).add(r['draw'])
    result = {
        'tool': 'scripts/native-animation-setters.py',
        'exeSha256': digest,
        'capstone': capstone.__version__,
        'python': platform.python_version(),
        'setter': f'{SETTER:08x}',
        'calls': len(records),
        'constant': sum(r['kind'] == 'constant' for r in records),
        'records': records,
        'drawsByObject': {k: sorted(v) for k, v in sorted(by_object.items(), key=lambda i: int(i[0]))},
    }
    text = json.dumps(result, indent=1) + '\n'
    if args.output:
        with open(args.output, 'w') as f:
            f.write(text)
    else:
        sys.stdout.write(text)


if __name__ == '__main__':
    main()
