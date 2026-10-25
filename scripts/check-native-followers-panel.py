"""Recover original Followers-panel descriptors, counts and callback contracts.

Usage: python scripts/check-native-followers-panel.py EXE [--output DIRECTORY]
This evidence-only probe executes the verified PE in Unicorn. No browser source,
imported atlas, fixture or parity ledger is changed. Output is an optional research
receipt. UI refresh, sound, camera and panel display are intercepted; classification,
selection, focus search, command dispatch and tribe rebuild execute natively.
"""
import argparse
import hashlib
import json
import struct
from pathlib import Path

from unicorn import UC_HOOK_CODE
from unicorn.x86_const import UC_X86_REG_EAX, UC_X86_REG_EIP, UC_X86_REG_ESP
from decomp import configure_native_constants, native_cpu

parser = argparse.ArgumentParser(description=__doc__)
parser.add_argument('executable', type=Path)
parser.add_argument('--output', type=Path)
args = parser.parse_args()
cpu, identity = native_cpu(args.executable)
configure_native_constants(cpu, args.executable)
cpu.mem_map(0x2000000, 0x100000)
people, button, command, stack, stop = 0x2000000, 0x2008000, 0x2009000, 0x20fd000, 0x20fe000
tribe = 0x89d1c8


def write(address, fmt, *values):
    cpu.mem_write(address, struct.pack('<' + fmt, *values))


def read(address, fmt):
    return struct.unpack('<' + fmt, cpu.mem_read(address, struct.calcsize('<' + fmt)))[0]


def call(address, *values):
    write(stack, 'I' * (len(values) + 1), stop, *values)
    cpu.reg_write(UC_X86_REG_ESP, stack)
    cpu.emu_start(address, stop, count=1000000)
    assert cpu.reg_read(UC_X86_REG_EIP) == stop, hex(cpu.reg_read(UC_X86_REG_EIP))
    return cpu.reg_read(UC_X86_REG_EAX)


observed = {}


def intercept(c, address, size, user):
    sp = c.reg_read(UC_X86_REG_ESP)
    counts = {0x479cf0: 4, 0x4de810: 3, 0x417ca0: 3, 0x504590: 2,
              0x451080: 4, 0x4deb40: 2}
    if address in counts:
        observed.setdefault(address, []).append(list(struct.unpack(
            '<' + 'I' * counts[address], c.mem_read(sp + 4, counts[address] * 4))))
    c.reg_write(UC_X86_REG_EAX, 0)
    c.reg_write(UC_X86_REG_EIP, read(sp, 'I'))
    c.reg_write(UC_X86_REG_ESP, sp + 4)


for address in (0x47a550, 0x48a050, 0x417ca0, 0x504590, 0x479cf0):
    cpu.hook_add(UC_HOOK_CODE, intercept, begin=address, end=address)
lang_raw = (args.executable.parent / 'language/lang00.dat').read_bytes()
strings = lang_raw.decode('utf-16le').split('\0')
models = [0, 2, 3, 6, 4, 5]
descriptors = []
for index in range(36):
    address = 0x5cc6f0 + index * 66
    raw = bytes(cpu.mem_read(address, 66))
    u32 = lambda offset: struct.unpack_from('<I', raw, offset)[0]
    x, y, x2, y2, width, height = struct.unpack_from('<6h', raw, 25)
    model = models[index // 4] if index < 24 else models[(index - 24) % 6]
    row = index % 4 if index < 24 else 4 + (index - 24) // 6
    tooltip = struct.unpack_from('<H', raw, 45)[0]
    assert (x, y, x2, y2, width, height) == (
        models.index(model) * 16, [6, 47, 88, 129, 190, 231][row],
        models.index(model) * 16, [6, 47, 88, 129, 190, 231][row], 15, 34)
    assert u32(13) == (0x4a1240 if row < 4 else 0x4a13c0)
    assert u32(17) == (0x4a1340 if row < 4 else 0x4a14b0)
    assert tooltip == 777 + row * 6 + models.index(model)
    expected_key = model * 5 + row if row < 4 else model + (8 if row == 5 else 0)
    assert u32(55) == expected_key
    assert raw[65] == 0
    descriptors.append(dict(address=f'{address:08x}', model=model, row=row,
        rectangle=[x, y, width, height], sprite=u32(37), renderer=f'{u32(41):08x}',
        left=f'{u32(13):08x}', right=f'{u32(17):08x}', refresh=f'{u32(59):08x}',
        key=expected_key, tooltipId=tooltip, tooltip=strings[tooltip]))
assert read(0x5cd178, 'I') == 4
assert read(0x5cd17e, 'I') == read(0x5cd182, 'I') == 0x5cc6f0
assert struct.unpack('<4i', cpu.mem_read(0x5cd186, 16)) == (0, 204, 100, 277)
assert read(0x5cd196, 'I') == 0x4a1720
print('PASS: 36 original descriptors; six columns, six rows, exact labels/art/callbacks; root (0,204,100,277)')

# Callback/producer contract: no selection consumer is intercepted here.
callback_cases = 0
for descriptor in descriptors[:24]:
    model, category = descriptor['model'], descriptor['row'] + 1
    write(button + 99, 'I', descriptor['key'])
    for shift in (False, True):
        for ctrl in (False, True):
            for right_keys in (False, True):
                for gate in ('none', 'overview', 'level', 'input', 'drag', 'press'):
                    cpu.mem_write(0x984591, bytes(512))
                    write(0x9845c7 if right_keys else 0x9845bb, 'B', shift)
                    write(0x98462e if right_keys else 0x9845ae, 'B', ctrl)
                    write(0x89c6c1, 'H', 2 if gate == 'overview' else 0)
                    write(0x89d17c, 'I', 32 if gate == 'level' else 0)
                    write(0x89ce36, 'B', gate == 'input')
                    write(0x89c6e7, 'B', 9 if gate == 'drag' else 15 if gate == 'press' else 0)
                    write(tribe + 0x24, 'HH', 65535, 511)
                    observed.clear()
                    call(0x4a1240, button)
                    tag = (0x55 if model else 0x54) if shift else 0x72 if ctrl else 0x7d
                    expected = [[0, tag, (model << 16) | category, 0xfe]] if gate == 'none' else []
                    assert observed.get(0x479cf0, []) == expected
                    callback_cases += 1
focus_hook = cpu.hook_add(UC_HOOK_CODE, intercept, begin=0x4de810, end=0x4de810)
for descriptor in descriptors[:24]:
    for shift in (False, True):
        cpu.mem_write(0x984591, bytes(512))
        write(0x9845bb, 'B', shift)
        write(button + 99, 'I', descriptor['key'])
        observed.clear()
        call(0x4a1340, button)
        assert observed[0x4de810] == [[descriptor['model'], descriptor['row'] + 1, int(shift)]]
cpu.hook_del(focus_hook)
print(f'PASS: {callback_cases} task left callback/producer cases and 48 right-focus dispatches')

# A class cell stays visible and its enabled state depends on GLOBAL model total,
# independently of this category's count or the nearby-mode count table.
refresh_cases = 0
for descriptor in descriptors[4:24]:
    for count in (-1, 0, 1, 200):
        cpu.mem_write(tribe, bytes(0xc65))
        cpu.mem_write(button, bytes(128))
        write(button + 99, 'I', descriptor['key'])
        write(button + 0x5f, 'I', descriptor['tooltipId'])
        write(0x89dbef + descriptor['model'] * 2, 'h', count)
        call(0x4a11e0, button)
        assert read(button + 0x10, 'I') == 1
        assert read(button + 8, 'I') == int(count > 0)
        assert read(button + 0x57, 'H') == (descriptor['tooltipId'] if count > 0 else 0)
        refresh_cases += 1
print(f'PASS: {refresh_cases} class-cell visibility/enable/tooltip refresh cases')

# Classifier: state table plus exact order-status, building and preacher exceptions.
state_categories = [read(0x5a6f78 + state * 5, 'B') for state in range(46)]
command_categories = [read(0x5a7db8 + status * 22, 'b') for status in range(35)]
classification_cases = 0
cpu.mem_write(people, bytes(256))
write(people + 0x2b, 'B', 2)
for state in range(46):
    write(people + 0x2c, 'B', state)
    for attached in (False, True):
        write(people + 0x9f, 'H', int(attached))
        expected = (1 if state_categories[state] == 1 else 5) if attached else (
            command_categories[0] if state == 10 else state_categories[state])
        assert call(0x4513e0, people) == expected, (state, attached, call(0x4513e0, people), expected)
        classification_cases += 1
write(people + 0x9f, 'H', 0)
write(people + 0x2c, 'B', 10)
for status, expected in enumerate(command_categories):
    write(people + 0xa7, 'B', status)
    assert call(0x4513e0, people) == expected & 0xffffffff, (status, call(0x4513e0, people), expected)
    classification_cases += 1
# State 21 + inside reads the referenced building's category rather than the state.
write(people + 0x2c, 'B', 21)
write(people + 0xc, 'I', 0x800000)
write(0x8a03ec, 'H', 1)
write(0x890390 + 4, 'I', people + 0x100)
write(people + 0x100 + 0x2a, 'B', 2)
for model in range(1, 20):
    write(people + 0x100 + 0x2b, 'B', model)
    assert call(0x4513e0, people) == read(0x5a725a + model * 76, 'b')
    classification_cases += 1
# Native current-command recognition executes, rather than replacing the predicate.
write(people + 0xc, 'I', 0)
write(people + 0x2b, 'B', 4)
write(people + 0x9b, 'H', 1)
for state in (10, 19, 33):
    write(people + 0x2c, 'B', state)
    write(people + 0xa7, 'B', 0)
    for model in (17, 31, 32, 8):
        for cancelled in (False, True):
            for assigned in (False, True):
                write(0x938830 + 10, 'BB4H', model, cancelled, 0, 0, 0, 0)
                write(people + 0x76, 'H', 64 if assigned else 0)
                expected = 2 if state in (10, 33) and model in (17, 31, 32) and not cancelled and not assigned else (
                    command_categories[0] if state == 10 else state_categories[state])
                assert call(0x4513e0, people) == expected
                classification_cases += 1
print(f'PASS: {classification_cases} native category classifications including attached, housed and preacher-order cases')


def install(roster, nearby=False):
    cpu.mem_write(tribe, bytes(4 * 0xc65))
    cpu.mem_write(people, bytes(0x4000))
    cpu.mem_write(0x984591, bytes(512))
    write(0x89c6f0, 'B', 0)
    write(0x89c6c1, 'H', 0)
    write(0x89d17c, 'I', 0)
    write(0x89ce36, 'B', 0)
    write(0x89c6e7, 'B', 0)
    write(tribe + 0x881, 'I', people if roster else 0)
    write(tribe + 0x24, 'HH', 0, 0)
    write(tribe + 0x93d, 'I', 128 if nearby else 0)
    for i, person in enumerate(roster):
        p = people + i * 256
        nxt = p + 256 if i + 1 < len(roster) else 0
        write(p + 4, 'II', nxt, nxt)
        write(p + 0x24, 'H', i + 1)
        write(p + 0x2a, 'BBB', 1, person.get('model', 2), person.get('state', 19))
        write(p + 0x2f, 'B', person.get('tribe', 0))
        write(p + 0x10, 'II', person.get('flags4', 0x20000000), person.get('flags3', 0))
        write(p + 0x3d, 'HH', person.get('x', 256 + i * 20), person.get('y', 256))
        write(p + 0x76, 'H', person.get('assignment', 0))
        write(p + 0x7a, 'B', person.get('selected', 0))
        write(0x890390 + (i + 1) * 4, 'I', p)
    return [bytes(cpu.mem_read(people + i * 256, 256)) for i in range(len(roster))]


# Real command handler: selected row deselects one/all; Ctrl's five command is a
# selection-bit no-op on selected people, but still clears flags3 bit 0x10000000.
selection_cases = []
for model in (0, 2, 3):
    for category, state in ((1, 19), (2, 19), (3, 21), (4, 20)):
        for mode, tag in (('single', 0x7d), ('five', 0x72), ('all', 0x55 if model else 0x54)):
            roster = [dict(model=2 + i // 6, state=state, selected=128 if category == 1 else 0,
                           flags3=0x123456f8)
                      for i in range(12)]
            before = install(roster)
            write(command + 4, 'IIB', (model << 16) | category, 0, tag)
            call(0x43e8e0, tribe, command)
            selected = [i for i in range(12) if read(people + i * 256 + 0x7a, 'B') & 128]
            matches = [i for i in range(12) if not model or roster[i]['model'] == model]
            if category == 1:
                removed = matches[:1] if mode == 'single' else matches if mode == 'all' else []
                expected = [i for i in range(12) if i not in removed]
            else:
                expected = matches[:1] if mode == 'single' else matches[:5] if mode == 'five' else matches
            assert selected == expected, (model, category, mode, selected, expected)
            for i in range(12):
                raw = bytearray(cpu.mem_read(people + i * 256, 256))
                changed = (i in removed if mode != 'five' else i == matches[0]) if category == 1 else i in expected
                mask = 0x80 if category == 1 and mode != 'five' else 0x10000000
                expected_flags3 = 0x123456f8 & ~mask if changed else 0x123456f8
                assert struct.unpack_from('<I', raw, 0x14)[0] == expected_flags3
                raw[0x14:0x18] = before[i][0x14:0x18]
                raw[0x7a] = before[i][0x7a]
                assert bytes(raw) == before[i], 'command changed unrelated person state'
            selection_cases.append(dict(model=model, category=category, mode=mode, selected=selected))
print(f'PASS: {len(selection_cases)} complete task selection commands, including selected-row deselection and Ctrl behavior')

# Full rebuild counts. Category 1 is both the classifier bucket and the separately
# incremented selected bit; do not flatten this into a guessed browser action label.
rebuild_cases = 0
for nearby in (False, True):
    for selected in (0, 128):
        for state, category in enumerate(state_categories):
            if state == 10:
                category = command_categories[0]
            roster = [dict(model=2 + i % 5, state=state, selected=selected,
                           x=256 if i < 5 else 6400, flags4=0x20000000 | (0x800 if i == 10 else 0))
                      for i in range(11)]
            install(roster, nearby)
            write(0x890324, 'I', people)
            write(0x890330, 'I', 0)
            write(0x89d17c, 'I', 32)  # suppress mana side effects; counter owner still executes
            write(0x89d188, 'I', 1)
            call(0x4ecac0)
            for model in range(2, 7):
                assert read(0x89dbef + model * 2, 'h') == 2
                for task in range(6):
                    per_person = int(task == category) + int(task == 1 and bool(selected))
                    assert read(0x89dc6d + (model * 6 + task) * 2, 'h') == 2 * per_person
                    assert read(0x89dcd9 + (model * 6 + task) * 2, 'h') == (per_person if nearby else 0)
            rebuild_cases += 1
print(f'PASS: {rebuild_cases} full native counter rebuilds; selected overlay, state buckets, ghosts and nearby tables')

# Per-category right-click memory and cycling use actual native search/classifier.
focus_cases = 0
for category, state in ((1, 19), (2, 19), (3, 21), (4, 20)):
    roster = [dict(model=2, state=state, selected=128 if category == 1 else 0) for _ in range(3)]
    before = install(roster)
    memory = 0x899ed3 + (2 * 6 + category) * 2
    write(memory, 'H', 0)
    for expected in (1, 2, 3, 1):
        observed.clear()
        call(0x4de810, 2, category, 0)
        assert read(memory, 'H') == expected
        assert observed[0x417ca0][0][0] == people + (expected - 1) * 256 + 0x3d
        assert observed[0x504590] == [[people + (expected - 1) * 256, 0]]
        assert before == [bytes(cpu.mem_read(people + i * 256, 256)) for i in range(3)]
        focus_cases += 1
print(f'PASS: {focus_cases} native task-category focus cycles; exact camera/panel targets and unchanged people')

# Total display excludes Shaman, but nearest task acquisition/focus includes it.
edge_cases = 0
for category, state in ((1, 19), (2, 19), (3, 21), (4, 20)):
    roster = [dict(model=model, state=state, selected=128 if category == 1 else 0,
                   flags3=0x123456f8) for model in (7, 2)]
    for mode, tag in (('single', 0x7d), ('five', 0x72), ('all', 0x54)):
        install(roster)
        write(command + 4, 'IIB', category, 0, tag)
        call(0x43e8e0, tribe, command)
        selected = [bool(read(people + i * 256 + 0x7a, 'B') & 128) for i in range(2)]
        expected = ([False, True] if mode == 'single' else [True, False] if mode == 'all' else [True, True]) if category == 1 else (
            [True, False] if mode == 'single' else [False, True] if mode == 'all' else [True, True])
        assert selected == expected, (category, mode, selected)
        edge_cases += 1
    before = install(roster)
    write(0x899ed3 + category * 2, 'H', 0)
    observed.clear()
    call(0x4de810, 0, category, 0)
    assert read(0x899ed3 + category * 2, 'H') == 1
    assert observed[0x504590] == [[people, 0]]
    assert before == [bytes(cpu.mem_read(people + i * 256, 256)) for i in range(2)]
    edge_cases += 1
# Initial focus uses nearest radius, but later cycle predicate exempts Shaman.
install([dict(model=7, state=19, x=7000), dict(model=2, state=19, x=356)], nearby=True)
write(0x899ed3 + 2 * 2, 'H', 0)
for expected in (2, 1, 2):
    call(0x4de810, 0, 2, 0)
    assert read(0x899ed3 + 2 * 2, 'H') == expected
    edge_cases += 1
# A closer wrong-category person is skipped; no homogeneous-roster shortcut.
for category, state, other in ((1, 19, 19), (2, 19, 20), (3, 21, 19), (4, 20, 19)):
    for model in (0, 2, 3):
        roster = [dict(model=2, state=other, selected=0),
                  dict(model=2, state=state, selected=128 if category == 1 else 0),
                  dict(model=3, state=state, selected=128 if category == 1 else 0)]
        install(roster)
        write(command + 4, 'IIB', (model << 16) | category, 0, 0x7d)
        call(0x43e8e0, tribe, command)
        selected = [bool(read(people + i * 256 + 0x7a, 'B') & 128) for i in range(3)]
        target = 2 if model == 3 else 1
        expected = [False, category == 1, category == 1]
        expected[target] = category != 1
        assert selected == expected
        edge_cases += 1
print(f'PASS: {edge_cases} Total/Shaman, nearby-cycle and mixed-category edge cases; exact flags3 masks in 36 commands')

# Vehicle refresh uses presence of a vehicle kind, not training knowledge.
refresh_count=0
for d in descriptors[24:]:
 for flags in (0,0x100,0x200,0x300):
  for count in (0,1,9):
   cpu.mem_write(tribe,bytes(4*0xc65));cpu.mem_write(button,bytes(128))
   write(button+99,'I',d['key']);write(button+0x5f,'I',d['tooltipId'])
   write(tribe+0x941,'I',flags);write(0x89dbef+d['model']*2,'h',count)
   call(0x4a14e0,button)
   assert read(button+0x10,'I')==int(bool(flags & (0x100 if d['row']==4 else 0x200)))
   assert read(button+8,'I')==int(d['model']==0 or count!=0)
   assert read(button+0x57,'H')==(d['tooltipId'] if d['model']==0 or count>0 else 0)
   refresh_count+=1
print('PASS:',refresh_count,'vehicle refresh cases')
# Complete vehicle left callback and producer, preserving all inherited gates.
for d in descriptors[24:]:
 for shift in (False,True):
  for ctrl in (False,True):
   cpu.mem_write(tribe,bytes(4*0xc65));cpu.mem_write(0x984591,bytes(512))
   write(button+99,'I',d['key']);write(0x9845bb,'B',shift);write(0x9845ae,'B',ctrl)
   write(0x89d17c,'I',0);write(0x89c6c1,'H',0);write(0x89ce36,'B',0);write(0x89c6e7,'B',0)
   write(tribe+0x24,'HH',65535,511);observed.clear();call(0x4a13c0,button)
   kind=1 if d['row']==4 else 3;tag=0x7f if shift else 0x80 if ctrl else 0x81
   assert observed[0x479cf0]==[[0,tag,(kind<<16)|d['model'],0xfe]]
print('PASS: 48 complete vehicle left callback/producer cases')

# Native full count owner, with duplicate same-class passengers in a vehicle.
def install_transport(vehicles,nearby=False):
 roster=[]
 for v in vehicles:
  roster.extend(dict(model=m) for m in v['passengers'])
 install(roster,nearby)
 all_count=len(roster)+len(vehicles)
 for i in range(all_count):
  p=people+i*256;write(p+4,'I',p+256 if i+1<all_count else 0)
  write(p+0x24,'H',i+1);write(0x890390+(i+1)*4,'I',p)
 passenger=1
 for i,v in enumerate(vehicles):
  p=people+(len(roster)+i)*256
  write(p+0x2a,'BB',4,v['model']);write(p+0x10,'I',0x20000000)
  write(p+0x2f,'B',v.get('owner',0));write(p+0xa1,'B',v.get('owner',0))
  write(p+0x3d,'HH',v.get('x',256+100*i),256)
  write(p+0x9e,'B',len(v['passengers']))
  for n,m in enumerate(v['passengers']):
   write(p+0x7a+n*2,'H',passenger);write(people+(passenger-1)*256+0x9f,'H',len(roster)+i+1);passenger+=1
 write(0x890324,'I',people if all_count else 0);write(0x890330,'I',0)
 write(0x89d17c,'I',32);write(0x89d188,'I',1);call(0x4ecac0);write(0x89d17c,'I',0)
 return len(roster),all_count
vehicles=[dict(model=1,passengers=[2,2,3]),dict(model=2,passengers=[6,4],x=6400),
 dict(model=1,passengers=[]),dict(model=3,passengers=[5,5]),dict(model=4,passengers=[2,3],x=6400),
 dict(model=3,passengers=[]),dict(model=1,passengers=[2],owner=1),dict(model=3,passengers=[2],owner=1)]
for nearby in (False,True):
 install_transport(vehicles,nearby)
 for kind,base,near in ((1,0x89dd9f,0x89ddb1),(3,0x89ddc3,0x89ddd5)):
  matching=[v for v in vehicles if v['model'] in (kind,kind+1) and v.get('owner',0)==0 and v['passengers']]
  for model in (0,2,3,4,5,6,7):
   assert read(base+model*2,'h')==sum(not model or model in v['passengers'] for v in matching)
   assert read(near+model*2,'h')==(sum((not model or model in v['passengers']) and v.get('x',256)<6400 for v in matching) if nearby else 0)
print('PASS: mixed occupied/empty/friendly/enemy transport count rebuilds; duplicate passenger classes count once')

# Full focus owner can target vehicles with selected occupants and cycles per kind/class.
for kind in (1,3):
 v=[dict(model=kind,passengers=[2]),dict(model=kind+1,passengers=[2]),dict(model=kind,passengers=[2])]
 people_count,all_count=install_transport(v)
 memory=0x899f67 if kind==1 else 0x899f79
 write(memory+2*2,'H',0)
 before=bytes(cpu.mem_read(people,all_count*256))
 ids=[]
 for _ in range(4):
  observed.clear();call(0x4deb40,kind,2);ids.append(read(memory+4,'H'))
  if ids[-1]:
   assert observed[0x504590]==[[people+(ids[-1]-1)*256,0]]
   assert observed[0x417ca0][0][0]==people+(ids[-1]-1)*256+0x3d
  assert bytes(cpu.mem_read(people,all_count*256))==before
 assert ids==[4,6,5,4],ids # rebuild prepends vehicles to list; nearest first, then wrap
print('PASS: 8 complete occupied-vehicle focus cycles; no person/vehicle changes')
# Search accepts kind variants, but remembered focus validates exact model1/3.
# If nearest is model2/4, each new click invalidates memory and reacquires it.
vehicle_focus_edges = 0
for kind in (1, 3):
    vehicle_people, vehicle_count = install_transport([
        dict(model=kind + 1, passengers=[2]) for _ in range(3)])
    memory = 0x899f67 if kind == 1 else 0x899f79
    write(memory + 4, 'H', 0)
    before = bytes(cpu.mem_read(people, vehicle_count * 256))
    for _ in range(4):
        observed.clear()
        call(0x4deb40, kind, 2)
        assert read(memory + 4, 'H') == 4
        assert observed[0x504590] == [[people + 3 * 256, 0]]
        assert bytes(cpu.mem_read(people, vehicle_count * 256)) == before
        vehicle_focus_edges += 1
    # Focus inclusion mode accepts already-selected matching passengers.
    install_transport([dict(model=kind, passengers=[2])])
    write(people + 0x7a, 'B', 128)
    write(memory + 4, 'H', 0)
    call(0x4deb40, kind, 2)
    assert read(memory + 4, 'H') == 2
    assert read(people + 0x7a, 'B') == 128
    vehicle_focus_edges += 1
print(f'PASS: {vehicle_focus_edges} alternate-model memory/selected-passenger focus edge cases')

# Native selection marks all passengers of the matching vehicle, including other models.
for kind in (1,3):
 for tag in (0x81,0x80,0x7f):
  v=[dict(model=kind,passengers=[2,3]),dict(model=kind,passengers=[2]),dict(model=kind,passengers=[3])]
  people_count,all_count=install_transport(v)
  write(command+4,'IIB',(kind<<16)|2,0,tag)
  call(0x43e8e0,tribe,command)
  selected=[i+1 for i in range(people_count) if read(people+i*256+0x7a,'B')&128]
  assert selected==([1,2] if tag==0x81 else [1,2,3]),(kind,tag,selected)
print('PASS: 6 complete vehicle selection commands and passenger-class propagation')


# Vehicle nearest search first prefers an idle first passenger, then falls back.
# The final nearest metric uses the matching passenger's position, not vehicle pos.
vehicle_search_cases = 0
for kind in (1, 3):
    vehicles = [dict(model=kind, passengers=[2]), dict(model=kind, passengers=[2])]
    install_transport(vehicles)
    write(people + 0xa7, 'B', 1)
    assert call(0x4514f0, 0, kind, 2, tribe + 0x24, 0) == people + 3 * 256
    write(people + 256 + 0xa7, 'B', 1)
    assert call(0x4514f0, 0, kind, 2, tribe + 0x24, 0) == people + 2 * 256
    install_transport(vehicles)
    write(people + 0x3d, 'H', 3000)
    write(people + 256 + 0x3d, 'H', 256)
    write(people + 2 * 256 + 0x3d, 'H', 256)
    write(people + 3 * 256 + 0x3d, 'H', 3000)
    assert call(0x4514f0, 0, kind, 2, tribe + 0x24, 0) == people + 3 * 256
    vehicle_search_cases += 3
    # Nearby acceptance uses the vehicle; distance ranking uses the passenger.
    install_transport([dict(model=kind, passengers=[2], x=7000),
                       dict(model=kind, passengers=[2], x=256)], nearby=True)
    write(people + 0x3d, 'H', 256)
    write(people + 256 + 0x3d, 'H', 7000)
    assert call(0x4514f0, 0, kind, 2, tribe + 0x24, 0) == people + 3 * 256
    write(people + 2 * 256 + 0x3d, 'H', 256)
    write(people + 3 * 256 + 0x3d, 'H', 7000)
    assert call(0x4514f0, 0, kind, 2, tribe + 0x24, 0) == people + 2 * 256
    vehicle_search_cases += 2
print(f'PASS: {vehicle_search_cases} native vehicle search priority/nearby/passenger-distance cases')

# Execute the original constructor and refresh chain, including child allocation.
# Both native display modes use the same Followers child descriptor array.
constructor_cases = []
for display_mode in (0, 8):
    cpu.mem_write(0x684210, bytes(0x9000))
    cpu.mem_write(tribe, bytes(4 * 0xc65))
    write(0x684210, 'I', 1)
    write(0x89c661, 'I', display_mode)
    write(0x89c6cf, 'HH', 640, 480)
    write(0x68450c, 'ii', 300, 300)
    write(0x89dbef + 2 * 2, 'h', 3)
    write(tribe + 0x941, 'I', 0x300)
    root_slot = call(0x44c650, 4) & 0xffff
    assert root_slot == 1
    root_control = 0x68425e + root_slot * 0x3e
    assert struct.unpack('<4i', cpu.mem_read(root_control + 0xe, 16)) == (
        0, 204 * 65536 // 480, 100 * 65536 // 640, 277 * 65536 // 480)
    indices = []
    child = read(root_control + 0x3c, 'H')
    realized = []
    while child:
        indices.append(child)
        control = 0x68452c + child * 0x71
        descriptor = descriptors[child - 1]
        x, y, width, height = descriptor['rectangle']
        x_fixed = x * 65536 // 640
        y_fixed = 204 * 65536 // 480 + y * 65536 // 480
        assert read(control + 0x37, 'I') == x_fixed
        assert read(control + 0x3b, 'I') == y_fixed
        assert read(control + 0x47, 'I') == width * 65536 // 640
        assert read(control + 0x4b, 'I') == height * 65536 // 480
        assert read(control + 99, 'I') == descriptor['key']
        assert read(control + 0x53, 'I') == int(descriptor['renderer'], 16)
        assert read(control + 0x10, 'I') == 1
        assert read(control + 8, 'I') == int(descriptor['model'] in (0, 2))
        realized.append(dict(descriptor=descriptor['address'], x=call(0x44a1f0, x_fixed),
                             y=call(0x44a210, y_fixed)))
        child = read(control + 0x6d, 'H')
    assert indices == list(range(36, 0, -1))
    # Reopen/refresh reuses the existing controls, disabling empty Brave task cells
    # and hiding transport rows when the native vehicle-presence flags disappear.
    write(0x89dbef + 2 * 2, 'h', 0)
    write(tribe + 0x941, 'I', 0)
    assert call(0x44c650, 4) & 0xffff == root_slot
    assert read(root_control + 0x3c, 'H') == 36
    for child in indices:
        control = 0x68452c + child * 0x71
        descriptor = descriptors[child - 1]
        assert read(control + 0x10, 'I') == int(descriptor['row'] < 4)
        assert read(control + 8, 'I') == int(descriptor['model'] == 0)
    constructor_cases.append(dict(displayMode=display_mode, realized640x480=realized))
print('PASS: two unhooked 36-child constructions and two reuse/refresh transitions; real fixed-point converters')

receipt = dict(executable=identity, probeSha256=hashlib.sha256(Path(__file__).read_bytes()).hexdigest(),
    languageSha256=hashlib.sha256(lang_raw).hexdigest(), descriptors=descriptors,
    stateCategories=state_categories, commandCategories=command_categories,
    checks=dict(callbacks=callback_cases, refresh=refresh_cases, classifications=classification_cases,
                commands=len(selection_cases), rebuilds=rebuild_cases, focus=focus_cases, edges=edge_cases, vehicleRefresh=refresh_count,
                vehicleCallbacks=48, vehicleRebuilds=2, vehicleFocus=8, vehicleCommands=6,
                vehicleSearch=vehicle_search_cases, vehicleFocusEdges=vehicle_focus_edges, constructor=4),
    constructorCases=constructor_cases,
    selectedRowCommands=[case for case in selection_cases if case['category'] == 1],
    limits=['No production implementation or parity claim.',
            'Crafted native states establish arithmetic and predicates, not reachability of every state combination.',
            'Transport probes cover bounded native count/focus/selection cases, not all vehicle gameplay.',
            'Rendered pixels are handled by the separate bounded raster probe.'])
if args.output:
    args.output.mkdir(parents=True, exist_ok=True)
    (args.output / 'native-panel-contract.json').write_text(json.dumps(receipt, indent=2) + '\n')
