"""Execute original default constructor and ordered pointer lookup in Unicorn.

Only operator_new is intercepted, supplying owned 15-byte node storage. Keyboard
character conversion executes natively against a supplied empty translation table;
its native return domain 0..0xdc cannot alias pointer scans 0xf0/0xf1. No lookup
predicate or gate is intercepted. This is a supplied-state CPU probe, not live UI.
"""
import argparse
import hashlib
import itertools
import json
from pathlib import Path
import struct

import unicorn
from unicorn import UC_HOOK_CODE
from unicorn.x86_const import UC_X86_REG_EAX, UC_X86_REG_ECX, UC_X86_REG_EIP, UC_X86_REG_ESI, UC_X86_REG_ESP

from decomp import native_cpu

parser = argparse.ArgumentParser(description=__doc__)
parser.add_argument('executable', type=Path)
parser.add_argument('output', type=Path, help='Fresh directory for raw table and JSON evidence')
args = parser.parse_args()
args.output.mkdir(parents=True, exist_ok=False)
cpu, identity = native_cpu(args.executable)
cpu.mem_map(0x2000000, 0x20000)
owner, translation, heap = 0x2000000, 0x2001000, 0x2002000
stack, stop = 0x201e000, 0x201f000

def write(a, fmt, *values):
    cpu.mem_write(a, struct.pack('<' + fmt, *values))

def read(a, fmt):
    return struct.unpack('<' + fmt, cpu.mem_read(a, struct.calcsize('<' + fmt)))[0]

allocations = []
def allocate(c, address, size, _):
    sp = c.reg_read(UC_X86_REG_ESP)
    assert read(sp + 4, 'I') == 15
    pointer = heap + len(allocations) * 16
    assert pointer < 0x2004000
    allocations.append(pointer)
    c.reg_write(UC_X86_REG_EAX, pointer)
    c.reg_write(UC_X86_REG_EIP, read(sp, 'I'))
    c.reg_write(UC_X86_REG_ESP, sp + 4)

def call(address, *args):
    write(stack, 'I' * (len(args) + 1), stop, *args)
    cpu.reg_write(UC_X86_REG_ESP, stack)
    cpu.reg_write(UC_X86_REG_ECX, owner)
    cpu.emu_start(address, stop, count=1000000)
    assert cpu.reg_read(UC_X86_REG_EIP) == stop, hex(cpu.reg_read(UC_X86_REG_EIP))
    assert cpu.reg_read(UC_X86_REG_ESP) == stack + (len(args) + 1) * 4
    return cpu.reg_read(UC_X86_REG_EAX)

write(0x5f0550, 'I', translation)
allocation_hook = cpu.hook_add(UC_HOOK_CODE, allocate, begin=0x55aca0, end=0x55aca0)
assert call(0x489300, 0x5d5de8) == owner
cpu.hook_del(allocation_hook)
assert len(allocations) == 188

records = []
for i in range(189):
    a = 0x5d5de8 + i * 12
    raw = bytes(cpu.mem_read(a, 12))
    if raw[0] == 0:
        assert i == 188
        break
    scan, action, event, modifiers, gate, predicate = struct.unpack('<BIBBBI', raw)
    records.append(dict(address=f'{a:08x}', scan=scan, action=action, event=event, modifiers=modifiers, gate=gate, predicate=predicate, raw=raw.hex()))

chains = {}
for scan in [1, 0xf0, 0xf1]:
    ptr, chain = read(owner + scan * 4, 'I'), []
    while ptr:
        assert ptr in allocations and len(chain) < 188
        raw = bytes(cpu.mem_read(ptr, 15))
        action, event, modifiers, predicate, gate, ptr = struct.unpack('<IBBIBI', raw)
        chain.append(dict(action=action, event=event, modifiers=modifiers, gate=gate, predicate=predicate))
    expected = [{k:r[k] for k in ['action','event','modifiers','gate','predicate']} for r in records if r['scan'] == scan and r['event'] & 0x18 == 8 and not r['event'] & 2]
    assert chain == expected, (hex(scan), chain, expected)
    chains[hex(scan)] = chain

trace = []
def observe(c, address, size, _):
    if address == 0x4894f1:
        node = c.reg_read(UC_X86_REG_ESI)
        trace.append(dict(action=read(node,'I'), predicate=read(node+6,'I')))
    elif address == 0x4894f3:
        trace[-1]['result'] = c.reg_read(UC_X86_REG_EAX)

trace_hook = cpu.hook_add(UC_HOOK_CODE, observe, begin=0x4894f1, end=0x4894f3)
cases = []
def lookup(scan, modifiers, phase, *, mode=7, land=0, overlay=0, latch=0, cursor=0, modal=0):
    for a,fmt,v in [(0x89c6e7,'B',mode),(0x89c661,'I',land),(0x894cf5,'I',0),(0x894cff,'I',overlay),(0x98e908,'H',latch),(0x89d17c,'B',cursor),(0x87cabc,'B',0),(0x87cac0,'B',0),(0x87cace,'H',0),(0x89ce36,'B',0),(0x89c6c1,'H',0),(0x5a219c+4*30,'H',modal)]:
        write(a,fmt,v)
    trace.clear()
    result = call(0x489470, scan, modifiers, phase)
    cases.append(dict(scan=scan, modifiers=modifiers, phase=phase, mode=mode, land=land, overlay=overlay, latch=latch, cursor=cursor, modal=modal, action=result, predicates=list(trace)))
    return result

# Complete low-three-bit modifier set, both pointer slots/phases, both gate states,
# gate-2 flag, and the later camera-release latch. Real predicates execute unchanged.
for scan,mod,phase,land,overlay,latch,cursor in itertools.product([0xf0,0xf1],range(8),[1,4],[0,8,0x8000,0x8008],[0,4],[0,0x40],[0,0x20]):
    blocked = bool(land & 8 and overlay & 4)
    expected = 0
    if phase == 4:
        if not blocked:
            expected = {0:0x77,2:0x78,4:0x78}.get(mod,0) if scan == 0xf0 else 0x7c
        elif scan == 0xf1 and mod == 0 and latch & 0x40:
            expected = 0x73
    actual = lookup(scan,mod,phase,land=land,overlay=overlay,latch=latch,cursor=cursor)
    assert actual == expected, cases[-1]

# Placement requires mode 7; adjacent modes do not dispatch placement/cancel here.
for mode,scan,mod in itertools.product([6,8],[0xf0,0xf1],range(8)):
    assert lookup(scan,mod,4,mode=mode) == 0, cases[-1]

# Escape's earlier modal / complementary flag predicates shadow action 0x7c.
# The empty supplied character map adds no scan-1 aliases; this is not a keyboard
# layout or saved-key loading witness.
for land,overlay,modal,mod in itertools.product([0,8,0x80000000,0x80000008],[0,4],[0,0x100],range(8)):
    expected = (0x46 if modal else 0x9d if land & 0x80000000 else 0x9b) if mod == 0 else 0
    assert lookup(1,mod,1,land=land,overlay=overlay,modal=modal) == expected, cases[-1]

cpu.hook_del(trace_hook)
assert len(cases) == 1184
table = bytes(cpu.mem_read(0x5d5de8,189*12))
(args.output / 'default-binding-records.bin').write_bytes(table)
result = dict(executable=identity, unicorn=unicorn.__version__, allocation_count=len(allocations), intercepted=['operator_new at 0055aca0 only, during construction'], supplied=['zero-initialized keyboard character map at 02001000','explicit mode, input flags, modal and gate globals per case'], pointer_chain_identity='native constructor output equals every applicable original record in original order', table_sha256=hashlib.sha256(table).hexdigest(), chains=chains, case_count=len(cases), cases=cases,
              limits='Default-table supplied-state CPU execution. No predicate/lookup interception. Does not execute saved-key loader, upstream pointer UI gates/producer, command consumer, original game, browser, or application code. Character translation runs native code against an empty supplied map; its return domain cannot alias pointer slots. Escape result is for this non-aliasing map. No parity claim.')
(args.output / 'ordered-lookup-result.json').write_text(json.dumps(result,indent=2)+'\n')
print(json.dumps({k:v for k,v in result.items() if k not in ['cases','chains']},indent=2))
