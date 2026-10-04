"""Bounded original type9 scanner/controller execution, without intercepted leaves.

The compared lifecycle is the authored Mission1/2 branch: state8 disabled,
attribute31 zero, no Spy acquisition. General scanner/defense cases are evidence
for the explicit Mission3 boundary, not an implemented live behavior claim.
"""
import argparse
import hashlib
import json
import struct
import subprocess
from pathlib import Path

from unicorn.x86_const import UC_X86_REG_EAX, UC_X86_REG_EIP, UC_X86_REG_ESP
from decomp import native_cpu

ROOT = Path(__file__).resolve().parents[1]
BASE, TRIBE = 0x89D1C8, 2
AI, MEM = BASE + TRIBE * 0xC65, 0x2000000
TASK, STACK, STOP = AI + 0x36, MEM + 0x1D000, MEM + 0x1E000
SEED = 0x12345678
parser = argparse.ArgumentParser(description=__doc__)
parser.add_argument('executable', type=Path)
parser.add_argument('--compare', action='store_true')
args = parser.parse_args()
EXE = args.executable.resolve()


class Probe:
    def __init__(self):
        self.cpu, self.identity = native_cpu(EXE)
        self.cpu.mem_map(MEM, 0x20000)
        self.cpu.mem_write(BASE, bytes(4 * 0xC65))
        self.write(AI + 0xC22, 'B', TRIBE)
        self.call(0x461D70, AI)
        self.write(0x96EAC0, 'B', 4)
        self.write(0x9608B6, '4B', 1, 2, 4, 8)
        self.write(0x89D178, 'I', SEED)
        self.entities = []

    def write(self, address, fmt, *values):
        self.cpu.mem_write(address, struct.pack('<' + fmt, *values))

    def read(self, address, fmt='I'):
        return struct.unpack('<' + fmt, self.cpu.mem_read(address, struct.calcsize('<' + fmt)))[0]

    def call(self, address, *values):
        self.write(STACK, 'I' * (len(values) + 1), STOP, *values)
        self.cpu.reg_write(UC_X86_REG_ESP, STACK)
        self.cpu.emu_start(address, STOP, count=2000000)
        assert self.cpu.reg_read(UC_X86_REG_EIP) == STOP
        return self.cpu.reg_read(UC_X86_REG_EAX)

    def entity(self, tribe=0, cls=1, model=2, cell=0x6464, territory=True,
               disguise=0, progress=0, flags3=0):
        id_ = len(self.entities) + 1
        address = MEM + 0x1000 + id_ * 256
        self.write(address + 0x24, 'H', id_)
        self.write(address + 0x2A, 'BBB', cls, model, 17)
        self.write(address + 0x2F, 'B', tribe)
        self.write(address + 0x3D, 'HH', (cell & 255) << 8, cell & 0xFF00)
        self.write(address + 0xB2, 'B', disguise)
        self.write(address + 0x87, 'H', progress)
        self.write(address + 0x10, 'I', flags3)
        head = BASE + tribe * 0xC65 + (0x881 if cls == 1 else 0x885)
        tail = self.read(head)
        if tail:
            while self.read(tail + 8):
                tail = self.read(tail + 8)
            self.write(tail + 8, 'I', address)
        else:
            self.write(head, 'I', address)
        self.write(0x890390 + 4 * id_, 'I', address)
        land = 0x8A03E4 + ((cell & 0xFE) * 2 | cell & 0xFE00) * 4
        self.write(land + 15, 'B', 0x40 if territory else 0)
        # These fixtures place one entity in each cell, as the native cell head.
        self.write(land + 6, 'H', id_)
        self.entities.append(address)
        return id_

    def scan(self):
        result = self.call(0x4F8E10, AI, TASK)
        return dict(result=result, category=self.read(TASK + 16, 'B'),
                    tribe=self.read(TASK + 17, 'B'), entity=self.read(TASK + 6, 'H'),
                    cell=self.read(TASK + 8, 'H'), rng=self.read(0x89D178),
                    disguises=[self.read(address + 0xB2, 'B') for address in self.entities])

    def response(self):
        self.call(0x4C5CF0, AI, 0)
        return dict(phase=self.read(TASK + 0x42, 'H'), active=self.read(TASK + 0x3E) & 3,
                    aiFlags=self.read(AI + 0x596), category=self.read(TASK + 16, 'B'),
                    tribe=self.read(TASK + 17, 'B'), entity=self.read(TASK + 10, 'H'),
                    cell=self.read(TASK + 12, 'H'), rng=self.read(0x89D178))

    def allocate(self, states=0x200, origin=0x1234, radius=7):
        self.write(AI + 0x59A, 'I', states)
        self.write(AI + 0x5A2, 'H', origin)
        assert self.call(0x4E5B60, AI, 0) == 1
        # Vary the allocator's radius payload to prove the complete consumer's
        # observable independence, not to claim the native allocator chose it.
        self.write(TASK + 0x32, 'I', radius)


results = {'executable': Probe().identity, 'interceptedLeaves': [], 'scanner': [], 'controller': []}
next_rng = ((SEED * 0x24A1 + 0x24DF) & 0xFFFFFFFF)
next_rng = ((next_rng >> 13) | (next_rng << 19)) & 0xFFFFFFFF
scanner_cases = [
    ('enemy person', {}, 13, SEED, 0),
    ('no territory', {'territory': False}, 15, SEED, 0),
    ('own tribe', {'tribe': 2}, 15, SEED, 0),
    ('allied tribe', {'tribe': 1}, 15, SEED, 0),
    ('person list order', {}, 13, SEED, 0),
    ('disguised to scanner', {'model': 5, 'disguise': 128}, 15, next_rng, 128),
    ('disguised other tribe', {'model': 5, 'disguise': 64}, 13, SEED, 64),
    ('unfinished disguise', {'model': 5, 'disguise': 129}, 13, SEED, 129),
    ('disguise progress reveal', {'model': 5, 'disguise': 128, 'progress': 1}, 15, next_rng, 0),
    ('disguise chance reveal', {'model': 5, 'disguise': 128}, 15, next_rng, 0),
    ('disguise protected reveal', {'model': 5, 'disguise': 128, 'flags3': 0x1000}, 15, next_rng, 128),
    ('duplicate distance25', {}, 15, SEED, 0),
    ('duplicate distance26', {}, 13, SEED, 0),
    ('duplicate wrapping', {'cell': 0x02FE}, 15, SEED, 0),
]
for name, inputs, expected_result, expected_rng, expected_disguise in scanner_cases:
    p = Probe()
    p.entity(**inputs)
    if name == 'own tribe':
        p.write(TASK + 17, 'B', TRIBE)
    if name == 'allied tribe':
        p.write(0x9608B6 + TRIBE, 'B', 6)
        p.write(TASK + 17, 'B', 1)  # Actually visit the allied list.
    if name == 'person list order':
        p.entity(cell=0x6466)
    if name in ('disguise chance reveal', 'disguise protected reveal'):
        p.write(0x960812 + TRIBE * 48, 'B', 100)
    if name.startswith('duplicate'):
        p.write(AI + 0x74 + 82, 'I', 1)
        p.write(AI + 0x85 + 82, 'B', 8)
        center = {'duplicate distance25': 0x646E, 'duplicate distance26': 0x666E,
                  'duplicate wrapping': 0x0202}[name]
        p.write(AI + 0x46 + 82, 'H', center)
    actual = p.scan()
    assert actual['result'] == expected_result, (name, actual)
    assert actual['rng'] == expected_rng and actual['disguises'][0] == expected_disguise
    assert actual['entity'] == int(expected_result == 13)
    results['scanner'].append(dict(name=name, **actual))
p = Probe()
p.entity(cls=2)
p.write(TASK + 16, 'B', 1)
actual = p.scan()
assert actual['result'] == 12 and actual['entity'] == 1 and actual['rng'] == SEED
results['scanner'].append(dict(name='building list', **actual))

controller_cases = [
    dict(name='no enemy', entities=[]),
    dict(name='enemy person', entities=[{}]),
    dict(name='enemy building', entities=[dict(cls=2)]),
    dict(name='people precede buildings', entities=[dict(cls=2, cell=0x6666), {}]),
    dict(name='first enemy list wins', entities=[dict(tribe=1, cell=0x6666), {}]),
    dict(name='outside territory', entities=[dict(territory=False)]),
    dict(name='allied enemy skipped', entities=[{}], alliances=5),
    dict(name='no response flag4', entities=[{}], responseFlag=False),
    dict(name='cancel bit is not early exit', entities=[], cancel=True),
    dict(name='lost candidate before response', entities=[{}], lose=True),
    dict(name='cleanup preserves another selection owner', entities=[], busy=True),
]
for case in controller_cases:
    variants = []
    for origin, radius in [(0x1234, 7), (0xFEFE, 255), (0, 0)]:
        p = Probe()
        for entity in case['entities']:
            p.entity(**entity)
        p.write(0x9608B6 + TRIBE, 'B', case.get('alliances', 4))
        p.write(0x9607F9 + TRIBE * 48, 'B', int(case.get('responseFlag', True)))
        p.allocate(origin=origin, radius=radius)
        if case.get('cancel'):
            p.write(TASK + 0x3E, 'I', 3)
        if case.get('busy'):
            p.write(AI + 0x596, 'I', 2)
            p.write(AI + 0x5B3, 'B', 1)
        steps = []
        for _ in range(12):
            if steps and case.get('lose'):
                p.write(p.entities[0] + 0xC, 'I', 1)
                p.call(0x461F90, AI)
            steps.append(p.response())
            if not steps[-1]['active']:
                break
        assert not steps[-1]['active'] and all(row['rng'] == SEED for row in steps)
        assert steps[-2]['phase'] == 5 and steps[-1]['phase'] == 5
        variants.append(steps)
    assert variants[0] == variants[1] == variants[2], case['name']
    results['controller'].append(dict(**case, steps=variants[0], originRadiusVariants=3))
assert [row['phase'] for row in results['controller'][0]['steps']] == [2] * 6 + [3, 5, 5]
assert [row['phase'] for row in results['controller'][1]['steps']] == [3, 5, 5]
assert results['controller'][1]['steps'][-1]['aiFlags'] & 12 == 12
assert results['controller'][3]['steps'][0]['entity'] == 2
assert results['controller'][4]['steps'][0]['entity'] == 2
assert results['controller'][9]['steps'][-1]['aiFlags'] & 12 == 0
assert results['controller'][10]['steps'][-1]['aiFlags'] == 2

# This enabled state8 case documents the live Mission3 boundary. The real area
# summary and defense allocator execute; its phase0 consumer is not dispatched.
p = Probe()
p.entity()
p.write(0x9607F9 + TRIBE * 48, 'B', 1)  # State8 queue maximum and response flag, attribute15.
p.allocate(states=0x300)
steps = [p.response(), p.response(), p.response()]
assert p.read(AI + 0x85 + 82, 'B') == 8 and p.read(AI + 0x74 + 82) & 1
results['unboundDefense'] = dict(steps=steps, allocatedType=8, dispatched=False)

# The original script bytes are also inputs to the complete-program boundary.
results['scripts'] = []
for name in ['original-script', 'original-script-two']:
    script = json.loads((ROOT / 'app' / (name + '.json')).read_text())
    raw = EXE.parent / 'levels' / script['source']
    assert hashlib.sha256(raw.read_bytes()).hexdigest() == script['sha256']
    assert not any(kind == 2 and value == 1031 for kind, value in script['fields'])
    toggles = [script['codes'][i + 2] for i in range(len(script['codes']) - 2)
               if script['codes'][i:i + 2] == [1006, 1036]]
    assert toggles == [1023]
    results['scripts'].append(dict(source=script['source'], sha256=script['sha256'],
                                   state8Toggles=toggles, attribute31Referenced=False))

if args.compare:
    js = """
import {createComputerQueue,requestEarlyResponseTask,stepEarlyResponseTask,acquireSelection,releaseSelection} from './app/computer.ts';
let input='';for await(const chunk of process.stdin)input+=chunk;
const rows=JSON.parse(input).map(c=>{
 const ai=createComputerQueue();requestEarlyResponseTask(ai,512);const task=ai.tasks[0],steps=[];
 if(c.cancel)task.flags=3;if(c.busy){ai.flags=2;ai.selectionOwner=1;}
 const entities=c.entities.map((p,i)=>({id:i+1,cell:0x6464,cls:1,tribe:0,territory:true,...p}));
 for(let i=0;i<c.steps.length;i++){
  if(i&&c.lose)task.responseScan.entity=0;
  const done=stepEarlyResponseTask(ai,0,{tribe:2,tribeCount:4,alliances:c.alliances??4,responseFlag:c.responseFlag??true,
   entities:(category,tribe)=>entities.filter(e=>e.cls===category+1&&e.tribe===tribe),
   territory:cell=>entities.some(e=>e.cell===cell&&e.territory)});
  if(done){if(acquireSelection(ai,0))releaseSelection(ai,0);task.flags&=~3;}
  steps.push({phase:task.phase,active:task.flags&3,aiFlags:ai.flags,...task.responseScan,rng:0x12345678});
 }
 return steps;
});console.log(JSON.stringify(rows));
"""
    comparison = subprocess.run(['node', '--input-type=module', '-e', js],
        input=json.dumps(results['controller']), text=True, capture_output=True, cwd=ROOT)
    assert comparison.returncode == 0, comparison.stderr
    for case, actual in zip(results['controller'], json.loads(comparison.stdout), strict=True):
        assert actual == case['steps'], (case['name'], actual, case['steps'])
print(json.dumps(results, indent=2))
print('PASS: 15 unhooked native scanner cases; 11 controller cases each at 3 origin/radius variants; '
      'real state8 allocation boundary; 2 complete authored-program invariants' +
      ('; all 11 bounded lifecycles paired with live helper' if args.compare else ''))
