"""Unexecuted phase5 composition draft. Not registered as a repository check.

The constructor deliberately refuses execution until the research-plan review
and a separately authorized native phase. Static parsing is the only check run.
No expected row in this file is an observed native result.
"""
from dataclasses import dataclass
import struct

EXECUTABLE_FREEZE = False
INSPECTED_MAIN = '1c7e6b05687aca14d9350e17c7ae14dc6c68bb97'
PLAN_HEAD = 'c849415e32a231aceb71bf74a43a541a74e3397e'

# Native class descriptors have stride THREE, not four. Both classes normally
# use the high list. Class7 flags2 permits the threshold-controlled low fallback.
CLASS_DESCRIPTORS = {1: bytes.fromhex('080800'), 7: bytes.fromhex('5e2802')}
GLOBALS = {
    'high_free': 0x89031c, 'low_free': 0x890320, 'active': 0x890324,
    'retiring': 0x890328, 'table': 0x890390, 'argument_flag': 0x89243a,
    'argument_stack': 0x892443, 'total': 0x89c651, 'low_count': 0x89c659,
    'player': 0x89c6f0, 'gameplay_rng': 0x89d178, 'game_flags': 0x89d17c,
    'cosmetic_rng': 0x89bc72, 'skip_initializer': 0x89ce37,
    'tribes': 0x89d1c8, 'terrain': 0x8a03e4, 'class_seeds': 0x96eac1,
}
SCRATCH, SCRATCH_SIZE = 0x2000000, 0x200000
POOL, ARGUMENTS, STACK, STOP = 0x2000000, 0x2190000, 0x21ed000, 0x21ef000
BODY_ID, BODY = 640, POOL + 640 * 256


@dataclass(frozen=True)
class Case:
    name: str
    high_free: int
    high_occupied: int = 1  # Includes the supplied model12 body.
    low_free: int = 0
    low_occupied: int = 0
    owner: int = 0
    player: int = 0
    population: int = 1
    existing_shaman: bool = False
    saved_height: int = 240
    ground: int = 128
    expected_person: bool = False
    expected_root: bool = False
    expected_children: int = 0


# Static expectations, subject to plan review and original execution. Allocation
# failure is obtained from actual free-list/count inputs, never an allocator hook.
CASES = [
    *(Case(f'full-owner-{owner}', 34, owner=owner,
           expected_person=True, expected_root=True, expected_children=32)
      for owner in range(4)),
    Case('local-owner-three', 34, owner=3, player=3,
         expected_person=True, expected_root=True, expected_children=32),
    Case('person-success-root-failure', 1, expected_person=True),
    Case('root-success-no-children', 2, expected_person=True, expected_root=True),
    Case('root-success-one-child', 3, expected_person=True,
         expected_root=True, expected_children=1),
    Case('root-success-sixteen-children', 18, expected_person=True,
         expected_root=True, expected_children=16),
    Case('all-capacity-exhausted', 0),
    Case('person-fails-effect-low-fallback', 0, high_occupied=1101, low_free=33,
         expected_root=True, expected_children=32),
    Case('threshold-no-low-fallback', 0, high_occupied=1100, low_free=33),
    Case('low-count-boundary-root-only', 0, high_occupied=1101,
         low_occupied=592, low_free=2, expected_root=True),
    Case('existing-shaman-no-request', 34, existing_shaman=True),
    Case('phase5-population-zero', 34, population=0,
         expected_person=True, expected_root=True, expected_children=32),
    Case('ground-above-saved-site', 34, saved_height=128, ground=641,
         expected_person=True, expected_root=True, expected_children=32),
]


class Phase5Draft:
    """Fixture/instrumentation draft; executable setup and proof runner are pending."""

    def __init__(self, cpu, registers):
        if not EXECUTABLE_FREEZE:
            raise RuntimeError('Unexecuted source draft: plan review and native authorization pending')
        self.cpu, self.reg = cpu, registers
        self.events, self.allocations = [], []
        self.immutable_guard = None

    def read(self, address, fmt):
        return struct.unpack('<' + fmt, self.cpu.mem_read(address, struct.calcsize('<' + fmt)))[0]

    def write(self, address, fmt, *values):
        self.cpu.mem_write(address, struct.pack('<' + fmt, *values))

    def pointer(self, index):
        assert 0 < index < 2048
        return POOL + index * 256

    def chain(self, indices):
        for offset, index in enumerate(indices):
            record = self.pointer(index)
            previous = self.pointer(indices[offset - 1]) if offset else 0
            following = self.pointer(indices[offset + 1]) if offset + 1 < len(indices) else 0
            self.write(record, 'II', previous, following)
            self.write(record + 0x24, 'H', index)
            self.write(GLOBALS['table'] + index * 4, 'I', record)
        return self.pointer(indices[0]) if indices else 0

    def prepare(self, case):
        # Fresh native_cpu image per case, immutable inputs loaded beforehand.
        # All writes are named and bounded; no reset spans the mapped search data.
        assert self.immutable_guard is not None
        self.cpu.mem_write(SCRATCH, bytes(SCRATCH_SIZE))
        self.cpu.mem_write(GLOBALS['tribes'], bytes(4 * 0xc65))
        self.cpu.mem_write(GLOBALS['table'], bytes(0x2000))
        self.cpu.mem_write(GLOBALS['terrain'], b''.join(
            struct.pack('<IhH8x', 0, case.ground, 0) for _ in range(16384)))
        for name in ('high_free', 'low_free', 'active', 'retiring', 'total', 'low_count'):
            self.write(GLOBALS[name], 'I', 0)
        self.write(GLOBALS['argument_stack'], 'I', ARGUMENTS)
        self.write(GLOBALS['argument_flag'], 'B', 0)
        self.write(GLOBALS['skip_initializer'], 'B', 0)
        self.write(GLOBALS['player'], 'B', case.player)
        self.write(GLOBALS['game_flags'], 'I', 32)
        self.write(GLOBALS['gameplay_rng'], 'I', 0x12345678)
        self.write(GLOBALS['cosmetic_rng'], 'I', 0x11223344)
        self.cpu.mem_write(GLOBALS['class_seeds'], bytes([250]) * 12)
        for cls, expected in CLASS_DESCRIPTORS.items():
            assert bytes(self.cpu.mem_read(0x5a6830 + cls * 3, 3)) == expected

        high_active = list(range(640, 640 + case.high_occupied))
        low_active = list(range(1, 1 + case.low_occupied))
        high_free = list(range(640 + case.high_occupied,
                               640 + case.high_occupied + case.high_free))
        low_free = list(range(1 + case.low_occupied,
                              1 + case.low_occupied + case.low_free))
        assert not low_free or max(low_free) < 640
        self.write(GLOBALS['active'], 'I', self.chain(high_active + low_active))
        self.write(GLOBALS['high_free'], 'I', self.chain(high_free))
        self.write(GLOBALS['low_free'], 'I', self.chain(low_free))
        # Occupied non-body records are supplied inert capacity reservations,
        # with linked records and matching counts; no whole-game load is implied.
        for index in high_active[1:] + low_active:
            self.write(self.pointer(index) + 0x2a, 'BBB', 7, 9, 0)
        self.write(GLOBALS['total'], 'I', case.high_occupied + case.low_occupied)
        self.write(GLOBALS['low_count'], 'I', case.low_occupied)

        tribe = GLOBALS['tribes'] + case.owner * 0xc65
        self.write(tribe + 0x911, 'HHh', 4096, 4096, case.saved_height)
        self.write(tribe + 0x91d, 'I', case.population)
        # Existing-Shaman gate only dereferences presence here. The handle is a
        # supplied separate active person in the final reviewed fixture, not BODY.
        if case.existing_shaman:
            raise NotImplementedError('Add a real separate registered Shaman and reconcile counts')
        self.write(BODY + 0x2a, 'BBBBBB', 10, 12, 12, 5, 0, case.owner)
        self.write(BODY + 0xc, 'I', 0x40020000)
        self.write(BODY + 0x35, 'H', 0x10)
        self.write(BODY + 0x3d, 'HHh', 8192, 8192, case.ground + 1280)
        self.write(BODY + 0x68, 'I', case.owner)
        self.write(BODY + 0x74, 'BB', 7, 7)
        self.write(GLOBALS['terrain'] + (16 * 128 + 16) * 16 + 6, 'H', BODY_ID)
        self.immutable_guard('after fixture setup')

    def rngs(self):
        return {name: self.read(GLOBALS[name], 'I')
                for name in ('gameplay_rng', 'cosmetic_rng')}

    def allocation_entry(self):
        sp = self.cpu.reg_read(self.reg['ESP'])
        cls, model, owner, point = struct.unpack('<4I', self.cpu.mem_read(sp + 4, 16))
        context = {'sp': sp, 'caller': self.read(sp, 'I'), 'class': cls & 255,
                   'model': model & 255, 'owner': owner & 255,
                   'point': list(struct.unpack('<HHh', self.cpu.mem_read(point, 6))),
                   'argumentStack': self.read(GLOBALS['argument_stack'], 'I'),
                   'argumentFlag': self.read(GLOBALS['argument_flag'], 'B'),
                   'classSeed': self.read(GLOBALS['class_seeds'] + (cls & 255), 'B'),
                   'beforeRng': self.rngs()}
        self.allocations.append(context)
        self.events.append({'allocateRequest': context.copy()})
        # Observe only: do not redirect EIP, replace EAX or mutate pool state.

    def allocation_return(self):
        # Exact RET instruction 004edad6 after the real allocator has completed.
        context = self.allocations.pop()
        assert self.cpu.reg_read(self.reg['ESP']) == context['sp']
        assert self.read(context['sp'], 'I') == context['caller']
        result = self.cpu.reg_read(self.reg['EAX'])
        self.events.append({'allocateReturn': {**context, 'result': result,
                            'afterRng': self.rngs(),
                            'record': bytes(self.cpu.mem_read(result, 0xb3)).hex() if result else None}})

    def validate_creation(self, case):
        completed = [event['allocateReturn'] for event in self.events if 'allocateReturn' in event]
        people = [row for row in completed if (row['class'], row['model']) == (1, 7)]
        roots = [row for row in completed if (row['class'], row['model']) == (7, 9)]
        sparks = [row for row in completed if (row['class'], row['model']) == (7, 3)]
        assert len(people) == len(roots) == (0 if case.existing_shaman else 1)
        assert sum(bool(row['result']) for row in people) == int(case.expected_person)
        assert sum(bool(row['result']) for row in roots) == int(case.expected_root)
        assert len(sparks) == (32 if case.expected_root else 0)
        assert sum(bool(row['result']) for row in sparks) == case.expected_children
        assert self.read(GLOBALS['argument_stack'], 'I') == ARGUMENTS
        assert self.read(GLOBALS['argument_flag'], 'B') == 0
        assert (self.read(BODY + 0x2a, 'B') == 0) == case.expected_person
        assert not self.allocations
        self.immutable_guard('after creation validation')


if __name__ == '__main__':
    raise SystemExit('SOURCE DRAFT ONLY: no native setup/runner has been frozen or executed')
