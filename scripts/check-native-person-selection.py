"""Compare ordinary on-foot click selection with complete native tribe command 0x7b.
Usage: python scripts/check-native-person-selection.py EXE
Only UI refresh and sound playback are intercepted; native eligibility, person
writes, focus bookkeeping and single-selection voice choice execute unchanged.
"""
import json, random, struct, subprocess, sys
from pathlib import Path
from unicorn import UC_HOOK_CODE
from unicorn.x86_const import UC_X86_REG_EAX, UC_X86_REG_ECX, UC_X86_REG_EIP, UC_X86_REG_ESP
from decomp import native_cpu, ROOT

cpu, identity = native_cpu(Path(sys.argv[1]))
cpu.mem_map(0x2000000, 0x100000)
people, tribe, command, stack, stop = 0x2000000, 0x2001000, 0x2003000, 0x20fd000, 0x20fe000
write = lambda a, f, *v: cpu.mem_write(a, struct.pack('<' + f, *v))
read = lambda a, f: struct.unpack('<' + f, cpu.mem_read(a, struct.calcsize('<' + f)))[0]
voices = []
def consumer(c, address, size, user):
    sp = c.reg_read(UC_X86_REG_ESP)
    if address == 0x48a050:
        voices.append(read(sp + 8, 'I'))
    c.reg_write(UC_X86_REG_EIP, read(sp, 'I'))
    c.reg_write(UC_X86_REG_ESP, sp + 4)
consumers = {a: cpu.hook_add(UC_HOOK_CODE, consumer, begin=a, end=a)
             for a in (0x47a550, 0x48a050)}

def view(raw, id):
    return dict(id=id, flags4=struct.unpack_from('<I', raw, 0x10)[0],
                flags3=struct.unpack_from('<I', raw, 0x14)[0], selectionFlags=raw[0x7a])

rng = random.Random(0x7b)
cases = []
for trial in range(1024):
    before = []
    for i in range(4):
        raw = bytearray(rng.randbytes(256))
        struct.pack_into('<II', raw, 8, people + (i + 1) * 256 if i < 3 else 0, 0)
        struct.pack_into('<H', raw, 0x24, i + 1)
        raw[0x2a:0x30] = bytes((1, 2 + trial % 6, trial % 46, 0, 0, 0))
        raw[0x9f:0xa1] = bytes(2)
        raw[0x7a] = (raw[0x7a] & 127) | (128 if (trial >> 1) & (1 << i) else 0)
        cpu.mem_write(people + i * 256, bytes(raw))
        write(0x890394 + i * 4, 'I', people + i * 256)
        before.append(bytes(raw))
    cpu.mem_write(tribe, bytes(0xc65))
    write(tribe + 0x881, 'I', people)
    write(0x89c6f0, 'B', 0)
    target, extend = 1 + (trial >> 5) % 4, bool(trial & 1)
    write(command + 4, 'IIB', int(extend), target, 0x7b)
    voices.clear()
    write(stack, 'III', stop, tribe, command)
    cpu.reg_write(UC_X86_REG_ESP, stack)
    cpu.emu_start(0x43e8e0, stop, count=1000000)
    assert cpu.reg_read(UC_X86_REG_EIP) == stop
    expected = []
    for i, raw in enumerate(before):
        after = bytes(cpu.mem_read(people + i * 256, 256))
        untouched = bytearray(after)
        untouched[0x14:0x18] = raw[0x14:0x18]
        untouched[0x7a] = raw[0x7a]
        assert untouched == raw, (trial, i, 'selection changed simulation state')
        expected.append(view(after, i + 1))
    cases.append(dict(people=[view(raw, i + 1) for i, raw in enumerate(before)],
                      id=target, extend=extend, model=before[target - 1][0x2b],
                      expected=dict(people=expected, voices=list(voices))))
js = """import {clickPersonSelection,selectedPersonVoice} from './app/person-selection.ts';
let s='';for await(const c of process.stdin)s+=c;
console.log(JSON.stringify(JSON.parse(s).map(c=>({
 voices:clickPersonSelection(c.people,c.id,c.extend)?[selectedPersonVoice(c.model)]:[],people:c.people
}))));"""
actual = json.loads(subprocess.check_output(['node', '--input-type=module', '-e', js],
    input=json.dumps(cases).encode(), cwd=ROOT))
for i, (result, case) in enumerate(zip(actual, cases)):
    assert result == case['expected'], (i, result, case)
print(f'PASS: {len(cases)} complete native click commands / 4096 people; Ctrl toggle, '
      'replacement, eligibility, flags and single voices match; all other person bytes unchanged')

def call(address, *args):
    write(stack, 'I' * (len(args) + 1), stop, *args)
    cpu.reg_write(UC_X86_REG_ESP, stack)
    cpu.emu_start(address, stop, count=1000000)
    assert cpu.reg_read(UC_X86_REG_EIP) == stop, hex(cpu.reg_read(UC_X86_REG_EIP))
    return cpu.reg_read(UC_X86_REG_EAX)

# A bare PE starts with zero flags; runtime initialization enables replacement
# selection. Palette, globe and auxiliary reset consumers are outside this check.
hooks = [cpu.hook_add(UC_HOOK_CODE, consumer, begin=a, end=a)
         for a in (0x4a32d0, 0x41ce00, 0x475530)]
write(0x895da8, 'I', 0)
call(0x42bfa0)
assert read(0x895da8, 'I') & 0x10040 == 0x10040
assert call(0x4999d0) == 1, 'Native default ground orders keep selection'
for hook in hooks:
    cpu.hook_del(hook)

# Resolve the shipped bindings through the native lookup and context predicates.
table, entries = 0x2004000, 0x2005000
for i, (address, expected) in enumerate((
        (0x5d6478, (240, 110, 9, 40, 0, 0x4fef20)),
        (0x5d6484, (240, 111, 9, 42, 0, 0x4fef20)),
        (0x5d6490, (240, 113, 12, 64, 0, 0x4fefa0)))):
    record = struct.unpack('<BIBBBI', cpu.mem_read(address, 12))
    assert record == expected, record
    scan, action, event, modifiers, gates, predicate = record
    write(entries + i * 15, 'IBBIBI', action, event, modifiers, predicate, gates,
          entries + (i + 1) * 15 if i < 2 else 0)
write(table + 240 * 4, 'I', entries)
write(0x89d17c, 'I', 0); write(0x87cace, 'H', 0)
bindings = 0
for mode in range(18):
    write(0x89c6e7, 'B', mode)
    for event in (1, 4):
        for modifiers in range(8):
            cpu.reg_write(UC_X86_REG_ECX, table)
            result = call(0x489470, 240, modifiers, event)
            expected = (111 if modifiers & 2 else 110) if mode in (0, 12) and event == 1 else (
                113 if mode in (9, 15) and event == 4 else 0)
            assert result == expected, (mode, event, modifiers, result)
            bindings += 1

# Execute press/release dispatch. Ctrl is latched on press; Shift or Alt+Ctrl
# orders through a friendly person when a group is already selected.
emitted = []
def dispatch(c, address, size, user):
    sp = c.reg_read(UC_X86_REG_ESP)
    if address == 0x479cf0:
        args = list(struct.unpack('<4I', c.mem_read(sp + 4, 16)))
        args[0] &= 255 # The callee reads a byte tribe argument; upper register bits are unspecified.
        emitted.append(args)
    elif address == 0x47a550:
        write(0x89c6e7, 'B', read(sp + 4, 'I'))
    consumer(c, address, size, user)
cpu.hook_del(consumers[0x47a550])
for address in (0x479cf0, 0x47a550):
    cpu.hook_add(UC_HOOK_CODE, dispatch, begin=address, end=address)
cpu.mem_write(people, bytes(256))
write(people + 0x24, 'H', 1); write(people + 0x2a, 'BB', 1, 2)
write(0x890394, 'I', people); write(0x87cac2, 'H', 1)
write(0x87cabe, 'I', 0x10000); write(0x87cade, 'I', 0x10002000)
dispatches = 0
for selected in (False, True):
    for ctrl in (False, True):
        for shift in (False, True):
            for alt in (False, True):
                emitted.clear(); voices.clear()
                write(0x89c6e7, 'B', 12 if selected else 0)
                write(0x89c6cb, 'H', 0); write(0x98e908, 'I', 0)
                write(0x9845ae, 'B', int(ctrl)); write(0x9846ae, 'B', 0)
                write(0x98462e, 'B', 0); write(0x98472e, 'B', 0)
                if shift: call(0x4aab80, 0xbb, 0, 0)
                if alt: call(0x4aab80, 0xbd, 0, 0)
                call(0x4aab80, 0x6f if ctrl else 0x6e, 0, 0)
                force_order = selected and (shift or (alt and ctrl))
                assert read(0x89c6e7, 'B') == (16 if force_order else 15)
                assert read(0x89c6cb, 'H') == (0 if force_order else 1)
                assert voices == ([] if force_order else [0x6a])
                # Move the hover and release physical modifiers before the button.
                write(0x87cac2, 'H', 2); write(0x9845ae, 'B', 0)
                call(0x4aab80, 0xbc, 0, 0); call(0x4aab80, 0xbe, 0, 0)
                if not force_order:
                    call(0x4aab80, 0x71, 0, 0)
                    assert emitted == [[0, 0x7b, int(ctrl), 1]], emitted
                write(0x87cac2, 'H', 1)
                dispatches += 1
print(f'PASS: runtime replacement-selection default, {bindings} native modifier bindings '
      f'and {dispatches} real press/release dispatches; pressed target and Ctrl remain latched')
