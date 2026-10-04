#!/usr/bin/env python3
"""Execute the original type9-created Mission3 type8 defense lifecycle.

Lifecycle cases intercept only animation presentation. Separate phase2 Blast
decision cases also intercept final spell allocation and record its request. A
flat, standable synthetic world, lists, order pool, and authored Mission3 attributes
are supplied inputs; selection, RNG, assignment, standability, commands, monitoring
and cleanup execute original instructions. This is controller evidence, not a
complete native world simulation.
"""
import argparse
import hashlib
import json
import struct
import subprocess
import unicorn
from pathlib import Path
from unicorn import UC_HOOK_CODE
from unicorn.x86_const import UC_X86_REG_EAX, UC_X86_REG_EIP, UC_X86_REG_ESP
from decomp import native_cpu, configure_native_constants

ROOT = Path(__file__).resolve().parents[1]
BASE, TRIBE = 0x89D1C8, 2
AI, MEM = BASE + TRIBE * 0xC65, 0x2000000
TASK, DEFENSE = AI + 0x36, AI + 0x36 + 0x52
STACK, STOP, BITMAP = MEM + 0x1D000, MEM + 0x1E000, MEM + 0x18000
SEED = 0x12345678


class Probe:
    def __init__(self, executable):
        self.cpu, self.identity = native_cpu(executable)
        self.cpu.mem_map(MEM, 0x20000)
        self.cpu.mem_write(BASE, bytes(4 * 0xC65))
        configure_native_constants(self.cpu, executable)
        self.write(AI + 0xC22, 'B', TRIBE)
        self.call(0x461D70, AI)
        self.write(0x96EAC0, 'B', 4)
        self.write(0x9608B6, '4B', 1, 2, 4, 8)
        self.write(0x89D178, 'I', SEED)
        self.write(0x9607F9 + TRIBE * 48, 'B', 1)  # attribute15
        self.write(0x960809 + TRIBE * 48, 'B', 0)  # attribute31
        self.write(0x96080A + TRIBE * 48, 'B', 128)  # attribute32
        self.write(0x960818 + TRIBE * 48, 'B', 1)  # attribute46
        self.write(0x96AA74, 'I', BITMAP)
        self.cpu.mem_write(BITMAP, bytes([255]) * 8192)
        self.cpu.mem_write(0x96AABA, bytes([255]) * 8192)
        self.cpu.mem_write(0x96CABA, bytes([255]) * 8192)
        self.write(AI + 0xC1F, 'B', 1)
        self.write(AI + 0x5B4, 'B', 1)
        self.write(AI + 0x36A, 'H', 0x1234)
        self.write(0x89CE5C, 'B', 100)
        self.write(0x89CE5E, 'B', 100)
        self.write(0x96AA78, 'HH', 1, 0)
        self.entities, self.events, self.visited = [], [], {}
        self.actions, self.row_count = [], 0
        self.visit = -1
        self.cpu.hook_add(UC_HOOK_CODE, self.animation, begin=0x4D4040, end=0x4D4040)
        for address, count in [(0x4C5F70, 2), (0x4F8490, 9), (0x435730, 4),
                               (0x43B540, 2), (0x43B2A0, 2), (0x4F5950, 6),
                               (0x49C890, 3), (0x518200, 2), (0x4F2520, 2)]:
            self.cpu.hook_add(UC_HOOK_CODE, self.trace, count, begin=address, end=address)

    def write(self, address, fmt, *values):
        self.cpu.mem_write(address, struct.pack('<' + fmt, *values))

    def read(self, address, fmt='I'):
        return struct.unpack('<' + fmt, self.cpu.mem_read(address, struct.calcsize('<' + fmt)))[0]

    def args(self, n):
        return list(struct.unpack('<' + 'I' * n, self.cpu.mem_read(self.cpu.reg_read(UC_X86_REG_ESP) + 4, 4 * n)))

    def trace(self, cpu, address, size, count):
        key = f'{address:08x}'
        self.visited[key] = self.visited.get(key, 0) + 1
        if address != 0x49C890:
            self.events.append(dict(visit=self.visit, routine=key, args=self.args(count)))

    def animation(self, cpu, address, size, data):
        self.events.append(dict(visit=self.visit, routine='004d4040', args=self.args(2), intercepted=True))
        sp = cpu.reg_read(UC_X86_REG_ESP)
        cpu.reg_write(UC_X86_REG_EIP, self.read(sp))
        cpu.reg_write(UC_X86_REG_ESP, sp + 4)

    def call(self, address, *values):
        self.write(STACK, 'I' * (len(values) + 1), STOP, *values)
        self.cpu.reg_write(UC_X86_REG_ESP, STACK)
        try:
            self.cpu.emu_start(address, STOP, count=2000000)
        except Exception as error:
            raise RuntimeError(f'{error}; pc={self.cpu.reg_read(UC_X86_REG_EIP):08x}') from error
        assert self.cpu.reg_read(UC_X86_REG_EIP) == STOP, hex(self.cpu.reg_read(UC_X86_REG_EIP))
        return self.cpu.reg_read(UC_X86_REG_EAX)

    @staticmethod
    def land(cell):
        return 0x8A03E4 + ((cell & 0xFE) * 2 | cell & 0xFE00) * 4

    def entity(self, tribe=0, cls=1, model=3, cell=0x6464, state=17, flags=0):
        id_ = len(self.entities) + 1
        address = MEM + 0x1000 + id_ * 256
        self.write(address + 0x24, 'H', id_)
        self.write(address + 0x2A, 'BBB', cls, model, state)
        self.write(address + 0x2F, 'B', tribe)
        self.write(address + 0x3D, 'HH', (cell & 255) << 8, cell & 0xFF00)
        self.write(address + 0x14, 'I', 1)
        self.write(address + 0xC, 'I', flags)
        head = BASE + tribe * 0xC65 + (0x881 if cls == 1 else 0x885)
        tail = self.read(head)
        if tail:
            while self.read(tail + 8):
                tail = self.read(tail + 8)
            self.write(tail + 8, 'I', address)
        else:
            self.write(head, 'I', address)
        self.write(0x890390 + 4 * id_, 'I', address)
        land = self.land(cell)
        self.write(address + 0x20, 'H', self.read(land + 6, 'H'))
        self.write(land + 15, 'B', 0x40)
        self.write(land + 6, 'H', id_)
        if cls == 1:
            count = BASE + tribe * 0xC65 + 0xA27 + 2 * model
            self.write(count, 'H', self.read(count, 'H') + 1)
        self.entities.append(address)
        return address

    def action(self, kind, **values):
        self.actions.append(dict(row=self.row_count, kind=kind, **values))

    def allocate(self):
        if self.row_count:
            self.action('allocate')
        self.write(AI + 0x59A, 'I', 0x300)
        self.write(AI + 0x5A2, 'H', 0x1234)
        assert self.call(0x4E5B60, AI, 0) == 1
        for _ in range(3):
            self.call(0x4C5CF0, AI, 0)
        assert self.read(DEFENSE + 0x4F, 'B') == 8
        assert self.read(DEFENSE + 0x3E) & 1
        assert self.read(DEFENSE + 0x42, 'H') == 0
        assert not self.read(TASK + 0x3E) & 1

    def snapshot(self):
        self.row_count += 1
        people = []
        for address in self.entities:
            ids = [self.read(address + 0x8B + 2 * i, 'H') for i in range(8)]
            orders = [dict(id=id_, model=self.read(0x938830 + 10 * id_, 'B'),
                           flags=self.read(0x938831 + 10 * id_, 'B'),
                           payload=bytes(self.cpu.mem_read(0x938836 + 10 * id_, 4)).hex())
                      for id_ in ids if id_]
            people.append(dict(id=self.read(address + 0x24, 'H'), model=self.read(address + 0x2B, 'B'),
                               tribe=self.read(address + 0x2F, 'B'), state=self.read(address + 0x2C, 'B'),
                               assignment=self.read(address + 0xAF, 'B'), flags=self.read(address + 0xC),
                               flags3=self.read(address + 0x14), orders=orders,
                               raw=bytes(self.cpu.mem_read(address, 256)).hex()))
        return dict(rawTask=bytes(self.cpu.mem_read(DEFENSE, 0x52)).hex(),
                    orderPoolSha256=hashlib.sha256(self.cpu.mem_read(0x938830, 8000)).hexdigest(),
                    phase=self.read(DEFENSE + 0x42, 'H'), active=self.read(DEFENSE + 0x3E) & 3,
                    aiFlags=self.read(AI + 0x596), selectionOwner=self.read(AI + 0x5B3, 'B'),
                    center=self.read(DEFENSE + 0x10, 'H'), selected=self.read(DEFENSE),
                    quotas=[self.read(DEFENSE + 0x1A + i * 2, 'H') for i in range(4)],
                    cursor=self.read(DEFENSE + 0x24, 'B'), fallback=self.read(DEFENSE + 0x25, 'B'),
                    monitor=self.read(DEFENSE + 0xC), rng=self.read(0x89D178), people=people,
                    orderCursor=self.read(0x96AA78, 'H'), orderCount=self.read(0x96AA7A, 'H'))

    def cell_objects(self):
        cells = {}
        for address in reversed(self.entities):
            x, y = self.read(address + 0x3D, 'H'), self.read(address + 0x3F, 'H')
            cell = ((x >> 8) & 254) | (y & 0xFE00)
            cells.setdefault(cell, []).append(dict(id=self.read(address + 0x24, 'H'),
                **{'class': self.read(address + 0x2A, 'B')}, model=self.read(address + 0x2B, 'B'),
                state=self.read(address + 0x2C, 'B'), tribe=self.read(address + 0x2F, 'B'),
                x=x, y=y, flags2=self.read(address + 0xC), flags4=self.read(address + 0x10),
                assignment=self.read(address + 0x76, 'H'), disguise=self.read(address + 0xB2, 'B')))
        return list(cells.items())

    def step(self):
        self.visit += 1
        self.call(0x4623E0, AI)  # Real round-robin dispatch selects active type8.
        return self.snapshot()



def rng_after(count, seed=SEED):
    for _ in range(count):
        seed = (seed * 0x24A1 + 0x24DF) & 0xFFFFFFFF
        seed = ((seed >> 13) | (seed << 19)) & 0xFFFFFFFF
    return seed


def finish(p, rows, target=6, limit=40):
    for _ in range(limit):
        if rows[-1]['phase'] == target or not rows[-1]['active']:
            return
        rows.append(p.step())
    raise AssertionError(('controller did not converge', rows))


def setup(executable, enemies=(3,), defenders=(3,)):
    p = Probe(executable)
    for i, model in enumerate(enemies):
        p.entity(model=model, cell=0x6464 + 2 * i)
    for i, model in enumerate(defenders):
        p.entity(tribe=TRIBE, model=model, cell=0x6868 + 2 * i)
    p.allocate()
    return p, [p.snapshot()]


def set_state(p, person, state, secondary=0):
    p.action('state', id=p.read(person + 0x24, 'H'), state=state, secondary=secondary)
    p.write(person + 0x2C, 'BB', state, secondary)


def remove_enemy(p, person):
    p.action('remove', id=p.read(person + 0x24, 'H'))
    # Supply a completed external world deletion, not a controller side effect.
    p.write(person + 0xC, 'I', p.read(person + 0xC) | 1)
    p.write(person + 0x2A, 'B', 0)


def move_person(p, person, cell):
    p.action('move', id=p.read(person + 0x24, 'H'), cell=cell)
    old = (p.read(person + 0x3D, 'H') >> 8) | (p.read(person + 0x3F, 'H') & 0xFF00)
    assert p.read(p.land(old) + 6, 'H') == p.read(person + 0x24, 'H')
    p.write(p.land(old) + 6, 'H', p.read(person + 0x20, 'H'))
    p.write(person + 0x20, 'H', p.read(p.land(cell) + 6, 'H'))
    p.write(p.land(cell) + 6, 'H', p.read(person + 0x24, 'H'))
    p.write(person + 0x3D, 'HH', (cell & 255) << 8, cell & 0xFF00)


def result(name, p, rows, supplied=()):
    return dict(name=name, rows=rows, suppliedWorldChanges=list(supplied),
                events=p.events, visited=p.visited, actions=p.actions)


def controller_cases(executable):
    cases = []
    for name, enemies, defenders, phases, draws in [
        ('warrior', (3,), (3,), [0, 3, 3, 4, 5, 6], 2),
        ('preacher', (4,), (4,), [0, 3, 3, 4, 5, 6], 2),
        ('firewarrior exact added quota', (6,), (6,), [0, 3, 3, 3, 3, 3, 4, 5, 6], 2),
        ('partial mixed availability', (3, 3, 6, 4), (3, 4), [0, 3, 3, 3, 3, 4, 5, 6], 4),
        ('fallback warrior for firewarrior', (6,), (3,), [0, 3, 3, 3, 3, 3, 3, 3, 3, 4, 5, 6], 2),
        ('no troops', (3,), (), [0, 3, 3, 3, 3, 3, 7], 0),
    ]:
        p, rows = setup(executable, enemies, defenders)
        finish(p, rows, target=7 if not defenders else 6)
        assert [r['phase'] for r in rows] == phases, (name, rows)
        assert rows[-1]['rng'] == rng_after(draws), (name, rows[-1])
        if name == 'firewarrior exact added quota':
            assert rows[2]['quotas'] == [0, 0, 2, 0]
            assert rows[-1]['quotas'] == [0, 2, 2, 0]
        if name == 'partial mixed availability':
            assert rows[-1]['selected'] == 2 and rows[-1]['quotas'] == [0, 1, 1, 0]
        for person in rows[-1]['people']:
            if person['tribe'] != TRIBE:
                continue
            if person['model'] == 4:
                assert person['state'] == 10
                assert [(o['model'], o['payload']) for o in person['orders']] == [(3, '80648064')]
            else:
                assert person['state'] == 10 and person['assignment'] == 2
                assert [(o['model'], o['payload']) for o in person['orders']] == [(19, '64640808')]
        if not defenders:
            rows.append(p.step())
            assert not rows[-1]['active'] and not rows[-1]['aiFlags'] & 2
        cases.append(result(name, p, rows))

    for phase in (0, 2, 3, 4, 5, 6):
        p, rows = setup(executable)
        if phase == 2:
            p.action('lock', owner=0)
            p.write(AI + 0x596, 'I', p.read(AI + 0x596) | 2)
            p.write(AI + 0x5B3, 'B', 0)
            rows.append(p.step())
            assert rows[-1]['phase'] == 2
        elif phase:
            finish(p, rows, phase)
        p.action('cancel')
        p.write(DEFENSE + 0x3E, 'I', p.read(DEFENSE + 0x3E) | 2)
        rows.append(p.step())
        if phase < 3:
            assert rows[-1]['active'] == 3 and rows[-1]['phase'] in (2, 3)
            if phase == 2:
                p.action('release', owner=0)
                p.call(0x4F6440, AI, TASK)
                rows.append(p.step())
                assert rows[-1]['phase'] == 3 and rows[-1]['active'] == 3
            rows.append(p.step())
        assert rows[-1]['phase'] == 7 and not rows[-1]['active']
        assert all(person['assignment'] == 0 for person in rows[-1]['people'])
        assert rows[-1]['selectionOwner'] == 10
        cases.append(result(f'cancellation phase{phase}', p, rows, ['set task cancel bit; phase2 releases other owner through native 004f6440']))

    for phase in (0, 2, 3, 6):
        p, rows = setup(executable)
        if phase == 2:
            p.action('lock', owner=0)
            p.write(AI + 0x596, 'I', p.read(AI + 0x596) | 2)
            p.write(AI + 0x5B3, 'B', 0)
            rows.append(p.step())
        elif phase:
            finish(p, rows, phase)
        remove_enemy(p, p.entities[0])
        p.action('invalidate')
        p.call(0x461F90, AI)
        assert (p.read(DEFENSE + 0x3E) & 2 != 0) == (phase < 3)
        rows.append(p.step())
        if phase < 3:
            assert not rows[-1]['active'] and rows[-1]['phase'] == 7
            if phase == 2:
                assert rows[-1]['selectionOwner'] == 0 and rows[-1]['aiFlags'] & 2
        else:
            finish(p, rows)
            rows.append(p.step())
            assert rows[-1]['phase'] == 7
            assert rows[-1]['people'][1]['orders'][0]['model'] == 3
            assert rows[-1]['people'][1]['orders'][0]['payload'] == '00340012'
            rows.append(p.step())
            assert not rows[-1]['active']
        cases.append(result(f'lost target phase{phase}', p, rows, ['delete enemy externally; run native target invalidation']))

    p, rows = setup(executable)
    p.action('lock', owner=0)
    p.write(AI + 0x596, 'I', p.read(AI + 0x596) | 2)
    p.write(AI + 0x5B3, 'B', 0)
    rows.extend(p.step() for _ in range(3))
    assert [r['phase'] for r in rows] == [0, 2, 2, 2]
    assert all(r['rng'] == SEED and r['selectionOwner'] == 0 for r in rows[1:])
    p.action('release', owner=0)
    p.call(0x4F6440, AI, TASK)
    finish(p, rows)
    assert rows[-1]['people'][1]['orders'][0]['payload'] == '64640808'
    cases.append(result('selection lock release', p, rows, ['another task owns selection; native release after three blocked visits']))

    p, rows = setup(executable)
    finish(p, rows)
    move_person(p, p.entities[0], 0x6666)
    set_state(p, p.entities[1], 17)
    rows.append(p.step())
    assert rows[-1]['phase'] == 6 and rows[-1]['rng'] == rng_after(2)
    assert rows[-1]['people'][1]['orders'][0]['payload'] == '66660404'
    remove_enemy(p, p.entities[0])
    rows.append(p.step())
    assert rows[-1]['phase'] == 7
    assert rows[-1]['people'][1]['orders'][0]['payload'] == '00340012'
    rows.append(p.step())
    assert not rows[-1]['active'] and rows[-1]['people'][1]['assignment'] == 0
    cases.append(result('moving enemy retarget then return', p, rows,
                        ['move enemy to0x6666 and set defender idle17', 'delete enemy externally']))

    p, rows = setup(executable)
    finish(p, rows)
    move_person(p, p.entities[1], 0x6666)
    set_state(p, p.entities[1], 25)
    rows.append(p.step())
    assert rows[-1]['center'] == 0x6666 and rows[-1]['monitor'] == 0
    assert rows[-1]['people'][1]['orders'][0]['payload'] == '66660404'
    cases.append(result('first fighting defender recenters group', p, rows,
                        ['move defender to0x6666 and supply fighting state25']))

    for secondary, count, detached in [(3, 0, True), (2, 4, False), (2, 5, True)]:
        p, rows = setup(executable)
        finish(p, rows)
        set_state(p, p.entities[1], 33, secondary)
        p.action('progress', id=2, count=count)
        p.write(p.entities[1] + 0xA8, 'B', count)
        rows.append(p.step())
        assert (rows[-1]['people'][1]['assignment'] == 0) == detached
        if detached:
            assert rows[-1]['phase'] == 6  # Counted this visit before next scan observes no assignees.
            rows.append(p.step())
            assert rows[-1]['phase'] == 7
            rows.append(p.step())
            assert not rows[-1]['active']
        cases.append(result(f'state33 release secondary{secondary} count{count}', p, rows,
                            ['supply external state33 and its secondary progress']))

    p, rows = setup(executable)
    finish(p, rows)
    p.action('cancel')
    p.write(DEFENSE + 0x3E, 'I', 3)
    rows.append(p.step())
    assert not rows[-1]['active']
    # Restore naturally selectable idle input following the external order consumer.
    set_state(p, p.entities[1], 17)
    p.allocate()
    rows.append(p.snapshot())
    assert rows[-1]['phase'] == 0 and rows[-1]['active'] == 1
    assert rows[-1]['selected'] == 1 and rows[-1]['center'] == 0x6464  # Allocator preserves old scratch.
    finish(p, rows)
    assert rows[-1]['selected'] == 1 and rows[-1]['people'][1]['assignment'] == 2
    assert rows[-1]['rng'] == rng_after(4)
    cases.append(result('recurrence after cleanup reuses slot', p, rows,
                        ['cancel first response', 'supply defender idle17 after external command consumer']))
    for when in ('before dispatch', 'before retarget'):
        p, rows = setup(executable)
        finish(p, rows, 5 if when == 'before dispatch' else 6)
        p.action('exhaustOrders')
        for i in range(1, 800):
            p.write(0x938830 + i * 10 + 2, 'H', 1)
        p.write(0x96AA7A, 'H', 799)
        if when == 'before retarget':
            set_state(p, p.entities[1], 17)
            move_person(p, p.entities[0], 0x6666)
        rows.append(p.step())
        assert rows[-1]['phase'] == 6
        expected = [] if when == 'before dispatch' else [dict(id=2, model=19, flags=0, payload='64640808')]
        assert rows[-1]['people'][1]['orders'] == expected
        assert rows[-1]['rng'] == rng_after(1 if when == 'before dispatch' else 2)
        remove_enemy(p, p.entities[0])
        rows.append(p.step())
        assert rows[-1]['phase'] == 7 and rows[-1]['people'][1]['orders'] == expected
        rows.append(p.step())
        assert not rows[-1]['active'] and rows[-1]['people'][1]['assignment'] == 0
        cases.append(result(f'order pool exhausted {when}', p, rows,
                            ['all799 shared order slots referenced by external users', 'delete enemy after failed order allocation']))

    p, rows = setup(executable, (4,), (4,))
    finish(p, rows, 5)
    p.action('failedRouteCache')
    p.write(0x955BD9, 'HBBBBBBBB', 16, 0x68, 0x68, 0, 0, 0x64, 0x64, 0, 0)
    rows.append(p.step())
    assert rows[-1]['phase'] == 6 and rows[-1]['people'][1]['state'] == 33
    assert rows[-1]['rng'] == rng_after(3)
    assert p.read(p.entities[1] + 0x10) & 0x10000000
    cases.append(result('preacher route failure recovery', p, rows,
                        ['supply a previous failed-route cache record with TTL16 for0x6868 to0x6464; native cache recovery initializes state33']))
    return cases


def collector_cases(executable):
    results = []
    for center in (0x6464, 0xFEFE):
        p = Probe(executable)
        cells = [p.call(0x49C890, center, i, 0) & 0xFFFF for i in range(224)]
        assert len(set(cells)) == 224 and center not in cells
        p.entity(cell=center)
        p.entity(cell=cells[222])
        p.entity(cell=cells[223])
        buildings, people = MEM + 0x14000, MEM + 0x14100
        start = p.visited['0049c890']
        p.call(0x4F5950, AI, center, buildings, people, 10, 7)
        actual = [p.read(people + 4 * i) for i in range(10)]
        assert actual == [1, 2] + [0] * 8, (cells[-2:], actual)
        assert p.visited['0049c890'] - start == 223
        results.append(dict(center=center, spiralCells=cells, included=actual,
                            excludedFinalCell=cells[223], spiralCalls=223, cells=p.cell_objects(),
                            buildings=[0] * 10, people=actual))
    p = Probe(executable)
    for i in range(12):
        p.entity(cell=0x6464)
        p.entity(cls=2, model=1, cell=0x6464)
    p.call(0x4F5950, AI, 0x6464, MEM + 0x14000, MEM + 0x14100, 10, 7)
    buildings = [p.read(MEM + 0x14000 + i * 4) for i in range(10)]
    people = [p.read(MEM + 0x14100 + i * 4) for i in range(10)]
    assert buildings == list(range(24, 4, -2)) and people == list(range(23, 3, -2))
    results.append(dict(name='independent people and building capacity10', center=0x6464,
                        cells=p.cell_objects(), buildings=buildings, people=people))
    p = Probe(executable)
    p.write(0x9608B6 + TRIBE, 'B', 6)
    p.entity(tribe=2)
    p.entity(tribe=1)
    p.entity(model=1)
    p.entity(model=8)
    p.entity(state=23)
    p.entity(flags=0x10000)
    hidden = p.entity()
    p.write(hidden + 0x10, 'I', 0x1000)
    p.entity()
    p.entity(cls=2, model=1)
    p.call(0x4F5950, AI, 0x6464, MEM + 0x14000, MEM + 0x14100, 10, 7)
    buildings = [p.read(MEM + 0x14000 + i * 4) for i in range(10)]
    people = [p.read(MEM + 0x14100 + i * 4) for i in range(10)]
    assert people == [8] + [0] * 9 and buildings == [9] + [0] * 9
    results.append(dict(name='native collector eligibility filters', center=0x6464,
                        alliances=6, cells=p.cell_objects(), buildings=buildings, people=people))
    return results


def blast_cases(executable):
    rows = []
    definitions = [
        dict(name='enabled mana above reserve', expected=True),
        dict(name='attribute32 off', attribute=0, expected=False),
        dict(name='mana below reserve', mana=59999, expected=False),
        dict(name='mana exactly reserve', mana=60000, expected=False),
        dict(name='missing Shaman', exists=False, expected=False),
        dict(name='Shaman casting state22', state=22, expected=False),
        dict(name='Shaman dying state3', state=3, expected=False),
        dict(name='tribe cast cooldown', cooldown=1, expected=False),
        dict(name='AI cast cooldown', aiCooldown=1, expected=False),
        dict(name='Shaman deleted flag', flags2=1, expected=False),
        dict(name='Shaman suspended flag', flags2=2, expected=False),
        dict(name='Shaman active spell flag', flags4=0x400, expected=False),
        dict(name='Shaman outside Blast range', cell=0xC0C0, expected=False),
        dict(name='usage limit reached', limited=True, used=255, expected=False),
        dict(name='usage limit available', limited=True, used=0, expected=True),
        dict(name='elevated Shaman uses live signed height', height=896, cell=0x6470, expected=True),
        dict(name='negative live height reduces Blast range', height=-256, cell=0x646C, expected=False),
    ]
    for definition in definitions:
        case = dict(attribute=128, mana=60001, exists=True, state=17, flags2=0,
                    flags4=0, cooldown=0, aiCooldown=0, limited=False, used=0, cell=0x6666, height=0)
        case.update(definition)
        p = Probe(executable)
        p.entity()
        if case['exists']:
            shaman = p.entity(tribe=TRIBE, model=7, cell=case['cell'], state=case['state'], flags=case['flags2'])
            p.write(shaman + 0x10, 'I', case['flags4'])
            p.write(shaman + 0x41, 'h', case['height'])
            p.write(AI + 0x89D, 'I', shaman)
        p.write(0x96080A + TRIBE * 48, 'B', case['attribute'])
        p.write(AI + 0x94D, 'I', case['mana'])
        p.write(AI + 0xC5E, 'B', case['cooldown'])
        p.write(AI + 0x5BD, 'B', case['aiCooldown'])
        p.write(AI + 0x53E + 2 * 4, 'B', case['used'])
        assert p.read(0x5A8150) == 10000
        p.allocate()
        if case['limited']:
            p.write(AI + 0x596, 'I', p.read(AI + 0x596) | 0x40000)
        casts = []
        def cast(cpu, address, size, data):
            casts.append(p.args(3)[1:])
            sp = cpu.reg_read(UC_X86_REG_ESP)
            cpu.reg_write(UC_X86_REG_EIP, p.read(sp))
            cpu.reg_write(UC_X86_REG_ESP, sp + 4)
        p.cpu.hook_add(UC_HOOK_CODE, cast, begin=0x4F4DE0, end=0x4F4DE0)
        result_ = p.step()
        assert casts == ([[2, 0x6464]] if case['expected'] else []), (case, casts)
        assert result_['phase'] == 3 and result_['selected'] == 0 and result_['rng'] == SEED
        rows.append(dict(input=case, phase=result_['phase'], selected=result_['selected'],
                         rng=result_['rng'], casts=casts, raw=result_))
    return dict(interceptedLeaves={'004f4de0': 'final spell allocation is recorded, not executed; decision leaves execute'}, rows=rows)


def script_invariants(executable):
    script = json.loads((ROOT / 'app/original-script-three.json').read_text())
    assert hashlib.sha256((executable.parent / 'levels' / script['source']).read_bytes()).hexdigest() == script['sha256']
    fields, codes = script['fields'], script['codes']
    attrs = {}
    for attribute, expected in [(15, 1), (31, 0), (46, 1), (32, 128)]:
        refs = [i for i, (kind, value) in enumerate(fields) if kind == 2 and value == 1000 + attribute]
        assert len(refs) == 1
        writes = []
        for i in range(len(codes) - 2):
            if codes[i:i + 2] == [1007, refs[0]]:
                writes.append(fields[codes[i + 2]][1])
        assert writes == [expected], (attribute, writes)
        assert sum(code == refs[0] for code in codes) == 1
        attrs[str(attribute)] = dict(fieldIndex=refs[0], expected=expected, writes=writes)
    toggles = [codes[i + 2] for i in range(len(codes) - 2) if codes[i:i + 2] == [1006, 1036]]
    assert toggles == [1022]
    return dict(source=script['source'], sha256=script['sha256'], attributes=attrs, state8Toggles=toggles)


RUNTIME_COMPARISON = r'''
import assert from 'node:assert/strict'
import { createWorld } from './app/model.ts'
import { createComputerQueue, requestEarlyResponseTask, releaseSelection } from './app/computer.ts'
import { stepComputerTasks } from './app/computer-runtime.ts'
import { collectDefenseTargets } from './app/computer-defense.ts'
import { createLivePerson, registerLivePerson } from './app/live-people.ts'
import { moveObjectInCells } from './app/object-cells.ts'
import { emptyPersonOrder } from './app/person-orders.ts'

let input = ''
for await (const chunk of process.stdin) input += chunk
const native = JSON.parse(input)

function fixture(people) {
  const w = createWorld(3), example = structuredClone(w.units[0])
  w.units = []; w.buildings = []; w.trees = []; w.selected = []; w.tribeCount = 4; w.turn = 1
  w.objectCells = { heads: new Uint16Array(16384), objects: new Map() }
  Object.assign(w.ai, createComputerQueue())
  w.ai.states = 0x300
  w.ai.constructionBase = 0x1234
  w.ai.attributes.fill(0)
  for (const [index, value] of [[15, 1], [31, 0], [32, 128], [46, 1]]) w.ai.attributes[index] = value
  w.manaTribes[2].mana = 0; w.manaTribes[2].playerType = 1
  w.pathfinding.computerLimit = 100; w.pathfinding.humanLimit = 100
  w.outcome.alliances = [1, 2, 4, 8]
  w.land.flags.fill(0); w.land.categories.fill(0); w.land.heights.fill(0); w.land.regions.fill(64)
  w.land.walkMasks.forEach(mask => mask.fill(255))
  w.buildingOrders = { records: Array.from({ length: 800 }, emptyPersonOrder), cursor: 1, active: 0 }
  let enemy = 0, own = 0
  for (const row of people) {
    const cell = row.cell ?? (row.tribe === 2 ? 0x6868 + 2 * own++ : 0x6464 + 2 * enemy++)
    const u = { ...structuredClone(example), id: row.id, team: ['blue', 'red', 'yellow', 'green'][row.tribe],
      kind: ({ 2: 'brave', 3: 'warrior', 4: 'preacher', 6: 'firewarrior', 7: 'shaman' })[row.model],
      x: (cell & 255) - 8, z: -(cell >> 8) - 8 }
    const p = createLivePerson(w, u)
    Object.assign(p, { state: row.state ?? 17, flags2: row.flags2 ?? 0, flags3: 1,
      flags4: row.flags4 ?? 0, h: row.height ?? 0, life: 1000, angle: 0, heading: 0 })
    u.native = p; w.units.push(u); registerLivePerson(w, p)
  }
  w.randomState = 0x12345678
  return w
}

function allocate(w) {
  assert(requestEarlyResponseTask(w.ai, w.ai.states))
  for (let i = 0; i < 3; i++) { w.ai.cursor = 0; stepComputerTasks(w, 2) }
}

function snapshot(w) {
  const t = w.ai.tasks[1], d = t.defense
  return { phase: t.phase, active: t.flags & 3, aiFlags: w.ai.flags, selectionOwner: w.ai.selectionOwner,
    center: d.center, selected: t.selected, quotas: [...t.quotas], cursor: d.cursor,
    fallback: Number(d.fallback), monitor: Number(d.recenter), rng: w.randomState,
    people: w.units.map(u => {
      const p = u.native
      return { id: u.id, model: p.model, tribe: p.tribe, state: p.state, assignment: p.computerAssignment,
        orders: p.commands.filter(Boolean).map(id => {
          const o = w.buildingOrders.records[id], bytes = Buffer.alloc(4)
          bytes.writeUInt16LE(o.a); bytes.writeUInt16LE(o.b, 2)
          return { id, model: o.model, flags: o.flags, payload: bytes.toString('hex') }
        }) }
    }), orderCursor: w.buildingOrders.cursor, orderCount: w.buildingOrders.active }
}

function apply(w, a) {
  const u = w.units.find(u => u.id === a.id), p = u?.native
  if (a.kind === 'cancel') w.ai.tasks[1].flags |= 2
  else if (a.kind === 'lock') { w.ai.flags |= 2; w.ai.selectionOwner = a.owner }
  else if (a.kind === 'release') releaseSelection(w.ai, a.owner)
  else if (a.kind === 'remove') { u.hp = 0; p.flags2 |= 1 }
  else if (a.kind === 'state') { p.state = a.state; p.substate = a.secondary }
  else if (a.kind === 'progress') p.animationMode = a.count
  else if (a.kind === 'move') {
    const x = (a.cell & 255) << 8, y = a.cell & 0xff00
    moveObjectInCells(w.objectCells, p, { x, y, h: 0 }); u.x = (x >> 8) - 8; u.z = -(y >> 8) - 8
  } else if (a.kind === 'invalidate') {
    // Native 00461f90 is separately asserted. Runtime's targetAlive owns its exit.
  } else if (a.kind === 'exhaustOrders') {
    w.buildingOrders.active = 799
    for (let id = 1; id < 800; id++) w.buildingOrders.records[id].references = 1
  } else if (a.kind === 'failedRouteCache') {
    w.motionRoutes.failedSearches.set([16, 0, 0x68, 0x68, 0, 0, 0x64, 0x64, 0, 0])
  } else if (a.kind === 'allocate') { allocate(w); return true }
  else throw new Error(`Unknown supplied action: ${a.kind}`)
  return false
}

const controller = []
for (const c of native.controller) {
  const w = fixture(c.rows[0].people)
  allocate(w)
  const actual = [snapshot(w)]
  for (let index = 1; index < c.rows.length; index++) {
    let allocated = false
    for (const action of c.actions.filter(a => a.row === index)) allocated = apply(w, action) || allocated
    if (!allocated) { w.ai.cursor = 1; stepComputerTasks(w, 2) }
    actual.push(snapshot(w))
  }
  // Ignore native byte layout, sprite-owned flag bits and pool fingerprints.
  // Compare all task fields, real state/assignment/commands and shared RNG.
  const expected = c.rows.map(({ rawTask, orderPoolSha256, ...row }) => ({ ...row,
    people: row.people.map(({ flags, flags3, raw, ...p }) => p) }))
  assert.deepEqual(actual, expected, c.name)
  controller.push({ name: c.name, rows: actual })
}

const collector = native.collector.map(c => {
  const cells = new Map(c.cells)
  const targets = collectDefenseTargets(2, c.alliances ?? 4, c.center, cell => cells.get(cell) ?? [])
  const actual = { people: targets.people.map(p => p.id), buildings: targets.buildings.map(p => p.id) }
  assert.deepEqual(actual, { people: c.people.filter(Boolean), buildings: c.buildings.filter(Boolean) })
  return actual
})

const blast = native.blast.rows.map(({ input: c, casts, phase, selected }) => {
  const people = [{ id: 1, model: 3, tribe: 0 }]
  if (c.exists) people.push({ id: 2, model: 7, tribe: 2, ...c })
  const w = fixture(people), t = w.castingTribes[2]
  w.ai.attributes[32] = c.attribute; w.manaTribes[2].mana = c.mana
  t.flags = 32; t.cooldown = c.cooldown; t.aiCooldown = c.aiCooldown; t.spells[2].used = c.used
  allocate(w)
  if (c.limited) w.ai.flags |= 0x40000
  w.ai.cursor = 1; stepComputerTasks(w, 2)
  const actual = w.units.find(u => u.id === 2)?.casting
  assert.equal(!!actual, !!casts.length, c.name)
  if (actual) {
    assert.equal(actual.spell, 'blast', c.name)
    assert.deepEqual(actual.point, { x: 93, z: -109 }, c.name)
  }
  assert.equal(w.ai.tasks[1].phase, phase, c.name)
  assert.equal(w.ai.tasks[1].selected, selected, c.name)
  return { name: c.name, cast: !!actual, phase, selected }
})
console.log(JSON.stringify({ controller, collector, blast }))
'''


def runtime_fingerprint():
    paths = sorted(path for path in (ROOT / 'app').rglob('*') if path.suffix in ('.ts', '.json'))
    rows = [(str(path.relative_to(ROOT)), hashlib.sha256(path.read_bytes()).hexdigest()) for path in paths]
    return dict(files=len(rows), sha256=hashlib.sha256(json.dumps(rows).encode()).hexdigest(),
                changedPaths={name: sha for name, sha in rows if name in
                              ('app/computer-defense.ts', 'app/computer-runtime.ts', 'app/computer.ts')})


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('executable', type=Path)
    parser.add_argument('--compare', action='store_true', help='pair with actual stepComputerTasks runtime')
    args = parser.parse_args()
    executable = args.executable.resolve()
    cases = controller_cases(executable)
    data = dict(executable=Probe(executable).identity,
                sourceSha256=hashlib.sha256(Path(__file__).read_bytes()).hexdigest(),
                unicornVersion=unicorn.__version__,
                constantsSha256=hashlib.sha256((executable.parent / 'levels/constant.dat').read_bytes()).hexdigest(),
                interceptedLeaves={'004d4040': 'animation presentation only; no supplied RNG or state transitions'},
                suppliedInputs=['synthetic person/land lists and tribe counts',
                                'all corners standable bitmaps0x96aaba/0x96caba and initial0x96aa74; flat zero-height world',
                                'native pathsearch playerType1, computer/human limits100 and empty route pool',
                                'construction-base flag and0x1234 home cell in both native/live inputs',
                                'original constant.dat applied through native descriptor table',
                                'Mission3 attrs15=1,31=0,32=128,46=1; mana below spell threshold',
                                'external movement/death/state changes individually recorded per case'],
                boundaries=['native path following/combat and animation assets are not simulated',
                            'real original task dispatch, selection, state initialization, RNG, orders and cleanup execute'],
                script=script_invariants(executable), controller=cases, collector=collector_cases(executable),
                blast=blast_cases(executable))
    if args.compare:
        source = runtime_fingerprint()
        comparison = subprocess.run(['node', '--input-type=module', '-e', RUNTIME_COMPARISON],
                                    input=json.dumps(data), capture_output=True, text=True, cwd=ROOT)
        assert comparison.returncode == 0, comparison.stderr
        assert runtime_fingerprint() == source, 'Runtime source changed during comparison; rerun on a stable candidate'
        data['runtimeSource'] = source
        data['nodeVersion'] = subprocess.check_output(['node', '--version'], text=True).strip()
        data['runtimeComparison'] = json.loads(comparison.stdout)
    print(json.dumps(data, indent=2))
    print(f'PASS: {len(cases)} original type9-created type8 lifecycle cases; native commands/RNG/cleanup; '
          f'{len(data["collector"])} collector cases; {len(data["blast"]["rows"])} phase2 Blast decisions' +
          ('; all paired with actual runtime/collector' if args.compare else ''))


if __name__ == '__main__':
    main()
