"""Compare default deselection bindings and complete tribe command 0x1e.
Usage: python scripts/check-native-deselection.py EXE [--record]
Only UI-mode refresh is intercepted during the actual tribe command. No person
state, motion, orders, flag changes or command preparation is intercepted.
"""
import json, random, struct, subprocess, sys
from pathlib import Path
from unicorn import UC_HOOK_CODE
from unicorn.x86_const import UC_X86_REG_EAX, UC_X86_REG_ECX, UC_X86_REG_EIP, UC_X86_REG_ESP
from decomp import native_cpu, ROOT

cpu, identity = native_cpu(Path(sys.argv[1]))
cpu.mem_map(0x2000000, 0x100000)
people, tribe, command, table, entries, stack, stop = (
    0x2000000, 0x2001000, 0x2003000, 0x2004000, 0x2005000, 0x20fd000, 0x20fe000)
write = lambda a, f, *v: cpu.mem_write(a, struct.pack('<' + f, *v))
read = lambda a, f: struct.unpack('<' + f, cpu.mem_read(a, struct.calcsize('<' + f)))[0]
def call(address, *args):
    write(stack, 'I' * (len(args) + 1), stop, *args)
    cpu.reg_write(UC_X86_REG_ESP, stack)
    cpu.emu_start(address, stop, count=1000000)
    assert cpu.reg_read(UC_X86_REG_EIP) == stop, hex(cpu.reg_read(UC_X86_REG_EIP))
    return cpu.reg_read(UC_X86_REG_EAX)

def ui(c, address, size, user):
    sp = c.reg_read(UC_X86_REG_ESP)
    c.reg_write(UC_X86_REG_EIP, read(sp, 'I'))
    c.reg_write(UC_X86_REG_ESP, sp + 4)
cpu.hook_add(UC_HOOK_CODE, ui, begin=0x47a550, end=0x47a550)

# Actual default right-button release and Escape press, with the original
# context predicate and key lookup. Other overlapping modal bindings are separate.
for index, address in enumerate((0x5d6574, 0x5d6580)):
    scan, action, event, modifiers, gates, predicate = struct.unpack('<BIBBBI', cpu.mem_read(address, 12))
    assert (scan, action, event, modifiers, gates, predicate) == (
        (241, 131, 12, 64, 0, 0x4ff460) if index == 0 else (1, 131, 9, 40, 0, 0x4ff460))
    entry = entries + index * 15
    write(entry, 'IBBIBI', action, event, modifiers, predicate, gates, 0)
    write(table + scan * 4, 'I', entry)
bindings = 0
for mode in range(18):
    write(0x89c6e7, 'B', mode)
    for scan in (241, 1):
        for event in (1, 4):
            for modifiers in range(8):
                cpu.reg_write(UC_X86_REG_ECX, table)
                actual = call(0x489470, scan, modifiers, event)
                eligible = mode in (12, 16) and (
                    (scan == 241 and event == 4) or (scan == 1 and event == 1 and not modifiers & 2))
                assert actual == (131 if eligible else 0), (mode, scan, event, modifiers, actual)
                bindings += 1

# Full input dispatcher must emit the deselection command, not movement.
emitted = []
def capture(c, address, size, user):
    sp = c.reg_read(UC_X86_REG_ESP)
    emitted.append(list(struct.unpack('<4I', c.mem_read(sp + 4, 16))))
    ui(c, address, size, user)
hook = cpu.hook_add(UC_HOOK_CODE, capture, begin=0x479cf0, end=0x479cf0)
cleanup = cpu.hook_add(UC_HOOK_CODE, ui, begin=0x4199b0, end=0x4199b0)
write(0x89c6f0, 'B', 0)
call(0x4aab80, 131, 0, 0)
assert emitted == [[0, 30, 0, 0]], emitted
cpu.hook_del(hook); cpu.hook_del(cleanup)

rng = random.Random(0x444f60)
cases = []
for trial in range(512):
    before = []
    for i in range(4):
        p = people + i * 256
        raw = bytearray(rng.randbytes(256))
        # Ordinary on-foot people; vehicle passenger recursion remains separate.
        raw[0x9f:0xa1] = bytes(2)
        struct.pack_into('<I', raw, 8, people + (i + 1) * 256 if i < 3 else 0)
        raw[0x7a] = trial & 255
        cpu.mem_write(p, bytes(raw))
        before.append(bytes(raw))
    cpu.mem_write(tribe, bytes(0xc65))
    write(tribe + 0x881, 'I', people)
    cpu.mem_write(tribe + 0x8bf, bytes([0xff]) * 82)
    write(command + 12, 'B', 0x1e)
    call(0x444f60, tribe, command)
    assert bytes(cpu.mem_read(tribe + 0x8bf, 82)) == bytes(82)
    for i, raw in enumerate(before):
        after = bytes(cpu.mem_read(people + i * 256, 256))
        # Assert all 251 other bytes, including state, orders and route identity.
        untouched = bytearray(after)
        untouched[0x14:0x18] = raw[0x14:0x18]
        untouched[0x7a] = raw[0x7a]
        assert untouched == raw, (trial, i)
        cases.append(dict(
            person=dict(selectionFlags=raw[0x7a], flags3=struct.unpack_from('<I', raw, 0x14)[0]),
            expected=dict(selectionFlags=after[0x7a], flags3=struct.unpack_from('<I', after, 0x14)[0])))
js = """import {deselectPerson} from './app/person-orders.ts';
let s='';for await(const c of process.stdin)s+=c;
console.log(JSON.stringify(JSON.parse(s).map(c=>{deselectPerson(c.person);return c.person})));"""
actual = json.loads(subprocess.check_output(['node', '--input-type=module', '-e', js],
    input=json.dumps(cases).encode(), cwd=ROOT))
assert actual == [c['expected'] for c in cases]
# Clicking an ordinary follower only changes flags. State 14 is not a player
# selection transition; even existing work/combat states remain owned as before.
voice = cpu.hook_add(UC_HOOK_CODE, ui, begin=0x489c40, end=0x489c40)
for state in range(46):
    cpu.mem_write(people, rng.randbytes(256))
    write(people + 8, 'IIII', 0, 0, 0, 0)
    write(people + 0x24, 'H', 1)
    write(people + 0x2a, '6B', 1, 2, state, 0, 0, 0)
    write(people + 0x9f, 'H', 0); write(people + 0x7a, 'B', 0)
    write(0x890394, 'I', people)
    write(command + 4, 'IIB', 1, 1, 0x2a)
    before = bytes(cpu.mem_read(people, 256))
    call(0x43e8e0, tribe, command)
    after = bytearray(cpu.mem_read(people, 256))
    assert after[0x7a] == 128
    after[0x14:0x18] = before[0x14:0x18]; after[0x7a] = before[0x7a]
    assert after == before, state
cpu.hook_del(voice)
if '--record' in sys.argv:
    (ROOT / 'tests/fixtures/deselection.json').write_text(json.dumps(dict(
        executableSha256=identity['sha256'], cases=cases[::4]), separators=(',', ':')) + '\n')
print(f'PASS: {bindings} native binding cases, input dispatch, 512 complete deselection commands / '
      f'{len(cases)} people, and clicks in 46 person states; other person bytes and real orders remain unchanged')
