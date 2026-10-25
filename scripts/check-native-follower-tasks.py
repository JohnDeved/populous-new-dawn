"""Compare task classification, counts, selection flags and focus to the original EXE.
Usage: python scripts/check-native-follower-tasks.py EXE
Runs accepted research first, then compares the maintained TypeScript helpers.
No fixtures or assets are written. Native UI/sound leaves retain the research boundaries.
"""
import json
import random
import runpy
import subprocess
import sys
from pathlib import Path

root = Path(__file__).resolve().parents[1]
sys.argv = [str(root / 'scripts/check-native-followers-panel.py'), sys.argv[1]]
n = runpy.run_path(sys.argv[0])
cpu, call, write, read, install = [n[k] for k in ['cpu', 'call', 'write', 'read', 'install']]
people, tribe, command, observed = [n[k] for k in ['people', 'tribe', 'command', 'observed']]
cases = []

def install_case(roster, nearby=False, point=None):
    install(roster, nearby)
    point = point or dict(x=0, y=0)
    write(tribe + 0x24, 'HH', point['x'], point['y'])
    for i, row in enumerate(roster):
        p = people + i * 256
        write(p + 0xa7, 'B', row.get('commandStatus', 0))
    return [dict(id=i + 1, model=r.get('model', 2), category=call(0x4513e0, people + i * 256),
                 x=r.get('x', 256 + i * 20), y=r.get('y', 256), assignment=r.get('assignment', 0),
                 flags3=r.get('flags3', 0), flags4=r.get('flags4', 0x20000000), selectionFlags=r.get('selected', 0))
            for i, r in enumerate(roster)]

# Classification consumes live state/order/building inputs, not a browser busy flag.
for state in range(46):
    for vehicle in [0,1]:
        install([dict(model=2,state=state)])
        write(people+0x9f,'H',vehicle)
        p=dict(model=2,state=state,commandStatus=0,flags2=0,assignment=0,vehicle=vehicle)
        cases.append(dict(kind='classification', source=p, expected=call(0x4513e0,people)))
for status in range(35):
    install([dict(model=2,state=10)]);write(people+0xa7,'B',status)
    p=dict(model=2,state=10,commandStatus=status,flags2=0,assignment=0,vehicle=0)
    cases.append(dict(kind='classification', source=p, expected=call(0x4513e0,people)))
for building in range(1,20):
    install([dict(model=2,state=21)]);write(people+0xc,'I',0x800000)
    write(0x8a03ec,'H',1);write(0x890390+4,'I',people+0x100)
    write(people+0x100+0x2a,'BB',2,building)
    p=dict(model=2,state=21,commandStatus=0,flags2=0x800000,assignment=0,vehicle=0)
    cases.append(dict(kind='classification', source=p, building=building, expected=call(0x4513e0,people)))
for state in [10,19,33]:
    for model in [17,31,32,8]:
        for flags in [0,1]:
            for assignment in [0,64]:
                install([dict(model=4,state=state,assignment=assignment)])
                write(people+0x9b,'H',1);write(0x938830+10,'BB4H',model,flags,0,0,0,0)
                p=dict(model=4,state=state,commandStatus=0,flags2=0,assignment=assignment,vehicle=0)
                cases.append(dict(kind='classification', source=p, order=dict(model=model,flags=flags),expected=call(0x4513e0,people)))

rng = random.Random(0x4513e0)
for trial in range(120):
    roster = [dict(model=rng.choice([2,3,4,5,6,7]), state=rng.choice([1,10,11,14,17,19,20,21,22,25,33]),
                  commandStatus=rng.randrange(35), selected=rng.choice([0,1,128,129]),
                  flags3=0x123456f8, flags4=0x20000000 | rng.choice([0,0,0,128,0x800]),
                  assignment=rng.randrange(8) << 12, x=rng.randrange(65536), y=rng.randrange(65536))
              for _ in range(12)]
    # Include near, far and exact-radius boundaries around a non-cell-aligned camera.
    point = dict(x=257, y=503)
    roster[0].update(x=point['x'], y=point['y'])
    roster[1].update(x=point['x'] + 6144, y=point['y'])
    roster[2].update(x=point['x'] + 6143, y=point['y'])
    category, model, mode, nearby = rng.randrange(1,5), rng.choice([0,2,3,4,5,6]), rng.choice(['single','five','all']), bool(trial & 1)
    browser = install_case(roster, nearby, point)
    # Native tribe commands encode the camera's cell, then search its center.
    packed = ((point['x'] >> 8) & 255) | ((point['y'] >> 8) << 8)
    write(command + 4, 'IIB', (model << 16) | category, packed, {'single':0x7d,'five':0x72,'all':0x55 if model else 0x54}[mode])
    call(0x43e8e0, tribe, command)
    expected = [dict(flags3=read(people+i*256+0x14,'I'), selectionFlags=read(people+i*256+0x7a,'B')) for i in range(len(roster))]
    cases.append(dict(kind='selection', people=browser, model=model, category=category, mode=mode, nearby=nearby, point=point, expected=expected))
    browser = install_case(roster, nearby, point)
    memory = 0x899ed3 + (model * 6 + category) * 2
    write(memory, 'H', 0)
    expected = []
    for _ in range(4):
        call(0x4de810, model, category, trial % 3 == 0)
        expected.append(read(memory, 'H'))
    cases.append(dict(kind='focus', people=browser, model=model, category=category, nearby=nearby, point=point,
                      includeReserved=trial % 3 == 0, expected=expected))
    browser = install_case(roster, nearby, point)
    write(0x890324, 'I', people); write(0x890330, 'I', 0)
    write(0x89d17c, 'I', 32); write(0x89d188, 'I', 1)
    call(0x4ecac0)
    totals = [0] * 9
    display_totals = [0] * 9
    tasks = [[0] * 6 for _ in range(9)]
    for model in range(2,8):
        totals[model] = read(0x89dbef + model * 2, 'h')
        display_totals[model] = read((0x89dc01 if nearby else 0x89dbef) + model * 2, 'h')
        for category in range(6):
            tasks[model][category] = read((0x89dcd9 if nearby else 0x89dc6d) + (model * 6 + category) * 2, 'h')
    totals[0] = sum(totals[2:7])
    display_totals[0] = sum(display_totals[2:7])
    tasks[0] = [sum(tasks[model][category] for model in range(2,7)) for category in range(6)]
    cases.append(dict(kind='counts', people=browser, nearby=nearby, point=point, expected=dict(totals=totals, displayTotals=display_totals, tasks=tasks)))

script = """import { classifyFollowerTask, followerTaskCounts, selectTaskFollowers, focusTaskFollower } from './app/hud-tasks.ts';
let input='';for await(const c of process.stdin) input+=c;
console.log(JSON.stringify(JSON.parse(input).map(c=>{
 if(c.kind==='classification')return classifyFollowerTask(c.source,c.building,c.order);
 if(c.kind==='counts')return followerTaskCounts(c.people,c.point,c.nearby);
 if(c.kind==='selection'){selectTaskFollowers(c.people,c.model,c.category,c.point,c.mode,c.nearby);return c.people.map(({flags3,selectionFlags})=>({flags3,selectionFlags}));}
 let previous=0;return c.expected.map(()=>previous=focusTaskFollower(c.people,c.model,c.category,c.point,previous,c.includeReserved,c.nearby));
})));"""
result = subprocess.run(['node','--input-type=module','-e',script], cwd=root, input=json.dumps(cases), text=True, capture_output=True)
assert result.returncode == 0, result.stderr
actual = json.loads(result.stdout)
for index, (case, value) in enumerate(zip(cases, actual, strict=True)):
    assert value == case['expected'], (index, case, value)
print(f'PASS: {len(cases)} native/TypeScript classifier, task selection, focus and full count-rebuild cases, including raw camera-radius boundaries')
