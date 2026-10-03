"""Bounded original AI producer scheduling and type9 allocation evidence.

The table cases intercept producer outcomes, not the scheduler. The type9/type2
allocation cases execute their real leaves. Neither proves complete mission timing.
"""
import json
import struct
import subprocess
import sys
from pathlib import Path

from unicorn import UC_HOOK_CODE
from unicorn.x86_const import UC_X86_REG_EAX, UC_X86_REG_EIP, UC_X86_REG_ESP

from decomp import native_cpu

EXE = Path(sys.argv[1]).resolve()
AI, STACK, STOP = 0x2000000, 0x201D000, 0x201E000
TABLE = [
    (1, 0x4E5580, 100, 1), (0, 0x4E5900, 90, 10),
    (3, 0x4E59A0, 90, 10), (4, 0x4E5CA0, 90, 10),
    (5, 0x4E5950, 90, 10), (6, 0x4E5EE0, 90, 10),
    (7, 0x4E5F30, 90, 10), (8, 0x4E5F80, 90, 10),
    (9, 0x4E5C40, 90, 10), (2, 0x4E5BF0, 90, 10),
    (11, 0x4E5810, 90, 10), (10, 0x4E58B0, 50, 1),
]


class Probe:
    def __init__(self):
        self.cpu, self.identity = native_cpu(EXE)
        self.cpu.mem_map(AI, 0x20000)
        self.write(AI + 0xC22, 'B', 2)
        self.write(0x89D178, 'I', 0x12345678)
        self.call(0x461D70, AI)

    def write(self, address, fmt, *values):
        self.cpu.mem_write(address, struct.pack('<' + fmt, *values))

    def read(self, address, fmt='I'):
        return struct.unpack('<' + fmt, self.cpu.mem_read(address, struct.calcsize('<' + fmt)))[0]

    def call(self, address, *args):
        self.write(STACK, 'I' * (len(args) + 1), STOP, *args)
        self.cpu.reg_write(UC_X86_REG_ESP, STACK)
        self.cpu.emu_start(address, STOP, count=2000000)
        assert self.cpu.reg_read(UC_X86_REG_EIP) == STOP

    def ret(self, value):
        sp = self.cpu.reg_read(UC_X86_REG_ESP)
        self.cpu.reg_write(UC_X86_REG_EAX, value & 0xFFFFFFFF)
        self.cpu.reg_write(UC_X86_REG_EIP, self.read(sp))
        self.cpu.reg_write(UC_X86_REG_ESP, sp + 4)

    def table(self):
        return [dict(id=self.read(AI + 0x36E + 20 * i, 'B'),
                     address=self.read(AI + 0x372 + 20 * i),
                     attempts=self.read(AI + 0x376 + 20 * i, 'i'),
                     priority=self.read(AI + 0x37A + 20 * i),
                     group=self.read(AI + 0x37E + 20 * i)) for i in range(12)]

    def tasks(self):
        return [dict(slot=i, type=self.read(AI + 0x85 + 82 * i, 'B'),
                     phase=self.read(AI + 0x78 + 82 * i, 'H'),
                     target=self.read(AI + 0x68 + 82 * i, 'i'),
                     requested=self.read(AI + 0x6C + 82 * i, 'i'))
                for i in range(10) if self.read(AI + 0x74 + 82 * i) & 1]


p = Probe()
assert [(t['id'], t['address'], t['priority'], t['group']) for t in p.table()] == TABLE
assert all(t['attempts'] == 0 for t in p.table())
results = {'executable': p.identity, 'initialTable': p.table(), 'controlledTableCases': []}


def scheduler_case(name, success, active=(), special=False, attempts=None, rounds=1):
    p = Probe()
    for slot in active:
        p.write(AI + 0x74 + 82 * slot, 'I', 1)
    if attempts:
        for i, count in enumerate(attempts):
            p.write(AI + 0x376 + 20 * i, 'i', count)
    initial = p.table()
    calls, special_calls, snapshots = [], [], []
    by_address = {address: id_ for id_, address, _, _ in TABLE}

    def leaf(_cpu, address, _size, _user):
        slot = p.read(p.cpu.reg_read(UC_X86_REG_ESP) + 8)
        if address == 0x4E5B60:
            special_calls.append(slot)
            if special:
                p.write(AI + 0x74 + 82 * slot, 'I', 1)
            p.ret(int(special))
        else:
            id_ = by_address[address]
            calls.append([id_, slot])
            p.ret(int(id_ in success))

    for address in [0x4E5B60, *by_address]:
        p.cpu.hook_add(UC_HOOK_CODE, leaf, begin=address, end=address)
    for _ in range(rounds):
        before = len(calls)
        p.call(0x4625E0, AI)
        snapshots.append(dict(calls=calls[before:], table=p.table()))
    assert p.read(0x89D178) == 0x12345678
    row = dict(name=name, initial=initial, success=list(success), active=list(active), special=special,
               specialCalls=special_calls, snapshots=snapshots)
    results['controlledTableCases'].append(row)
    return row


r = scheduler_case('convert then training rotate by attempts', {0, 3}, rounds=2)
assert [s['calls'][-1][0] for s in r['snapshots']] == [0, 3]
assert [t['id'] for t in r['snapshots'][0]['table']] == [1, 3, 4, 5, 6, 7, 8, 9, 2, 11, 0, 10]
r = scheduler_case('construction singleton retains priority', {1, 0}, rounds=3)
assert all(s['calls'] == [[1, 0]] for s in r['snapshots'])
r = scheduler_case('all failing calls count and retain stable ties', set())
assert [t['id'] for t in r['snapshots'][0]['table']] == [row[0] for row in TABLE]
assert all(t['attempts'] == 1 for t in r['snapshots'][0]['table'])
r = scheduler_case('full pool skips special table and sorting', {0}, active=range(10))
assert not r['specialCalls'] and not r['snapshots'][0]['calls']
assert all(t['attempts'] == 0 for t in r['snapshots'][0]['table'])
r = scheduler_case('special consumes last slot and skips table', {0}, active=range(9), special=True)
assert r['specialCalls'] == [9] and not r['snapshots'][0]['calls']
r = scheduler_case('special then table receives new first free slot', {0}, active=(0, 2), special=True)
assert r['specialCalls'] == [1] and r['snapshots'][0]['calls'] == [[1, 3], [0, 3]]
r = scheduler_case('single adjacent pass is not complete sort', {1}, attempts=[0, 9, 8, 7, 6, 5, 4, 3, 2, 1, 0, 0])
assert [t['attempts'] for t in r['snapshots'][0]['table']][1:11] == [8, 7, 6, 5, 4, 3, 2, 1, 0, 9]
r = scheduler_case('signed increment wraps and sorts as signed', {0}, attempts=[0, 2147483647, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0])
assert r['snapshots'][0]['table'][1]['attempts'] == -2147483648

# Real initializer, pre-table producer, state/duplicate gates, free-slot search,
# type2 producer and task writers. No hooks in these cases.
results['unhookedAllocationCases'] = []
for name, states, active in [('both', 0x204, ()), ('type9 only', 0x200, ()),
                              ('disabled type9', 4, ()), ('last slot', 0x204, tuple(range(9))),
                              ('full pool', 0x204, tuple(range(10)))]:
    p = Probe()
    p.write(AI + 0x59A, 'I', states)
    p.write(AI + 0x5A2, 'H', 0x52DC)
    p.write(0x89BC76, 'I', 1)
    for slot in active:
        p.write(AI + 0x74 + 82 * slot, 'I', 1)
        p.write(AI + 0x85 + 82 * slot, 'B', 24)
    p.call(0x4625E0, AI)
    added = [t for t in p.tasks() if t['slot'] not in active]
    expected = {'both': [9, 2], 'type9 only': [9], 'disabled type9': [2],
                'last slot': [9], 'full pool': []}[name]
    assert [t['type'] for t in added] == expected, (name, added)
    if added and added[0]['type'] == 9:
        assert added[0]['target'] == 7 and added[0]['requested'] == 0x52DC
    assert p.read(0x89D178) == 0x12345678
    results['unhookedAllocationCases'].append(dict(name=name, added=added, table=p.table()))

if '--compare' in sys.argv:
    js = """
import {createComputerQueue,produceComputerTasks} from './app/computer.ts';
let input='';for await(const chunk of process.stdin)input+=chunk;
const results=JSON.parse(input).map(c=>{
  const ai=createComputerQueue(),specialCalls=[],snapshots=[];
  ai.producers=c.initial.map(({id,attempts,group})=>({id,attempts,group}));
  for(const slot of c.active)ai.tasks[slot].flags=1;
  for(const _ of c.snapshots){
    const calls=[];
    produceComputerTasks(ai,(id,slot)=>{calls.push([id,slot]);return c.success.includes(id)},slot=>{
      specialCalls.push(slot);if(c.special)ai.tasks[slot].flags=1;return c.special;
    });
    snapshots.push({calls,table:structuredClone(ai.producers)});
  }
  return {specialCalls,snapshots};
});
console.log(JSON.stringify(results));
"""
    comparison = subprocess.run(['node', '--input-type=module', '-e', js],
        input=json.dumps(results['controlledTableCases']), text=True, capture_output=True,
        cwd=Path(__file__).resolve().parents[1])
    assert comparison.returncode == 0, comparison.stderr
    for case, actual in zip(results['controlledTableCases'], json.loads(comparison.stdout), strict=True):
        expected = dict(specialCalls=case['specialCalls'], snapshots=[dict(calls=s['calls'],
            table=[{k: t[k] for k in ('id', 'attempts', 'group')} for t in s['table']])
            for s in case['snapshots']])
        assert actual == expected, (case['name'], actual, expected)

print(json.dumps(results, indent=2))
print('PASS: 8 controlled scheduler cases; 5 unhooked type9/type2 allocation cases. '
      'Producer outcomes are supplied only in controlled scheduler cases; no full mission timing claim.')
