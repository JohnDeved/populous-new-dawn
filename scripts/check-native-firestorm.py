"""Compare Firestorm emission, projectile arrival and impact composition with the executable."""
import json, random, struct, subprocess, sys
from pathlib import Path
from unicorn import UC_HOOK_CODE
from unicorn.x86_const import UC_X86_REG_EAX, UC_X86_REG_EIP, UC_X86_REG_ESP
from decomp import ROOT, native_cpu

cpu, identity = native_cpu(Path(sys.argv[1]))
cpu.mem_map(0x2000000, 0x50000)
controller, child, impact, fire, wave, building = [0x2000000 + i * 0x1000 for i in range(6)]
stack, stop = 0x204e000, 0x204f000
write = lambda a, f, *v: cpu.mem_write(a, struct.pack('<' + f, *v))
read = lambda a, f: struct.unpack('<' + f, cpu.mem_read(a, struct.calcsize('<' + f)))[0]
rules = json.loads((ROOT / 'app/original-rules.json').read_text())
flags = 0x2030000
cpu.mem_write(flags, bytes(rules['terrainCategoryFlags']))
write(0x59df0c, 'I', flags)
write(0x892443, 'I', 0x2031000)
events, current = [], {}

def ret(value=0):
    sp = cpu.reg_read(UC_X86_REG_ESP)
    cpu.reg_write(UC_X86_REG_EAX, value)
    cpu.reg_write(UC_X86_REG_EIP, read(sp, 'I'))
    cpu.reg_write(UC_X86_REG_ESP, sp + 4)

def point_at(p):
    return {'x': read(p, 'H'), 'y': read(p + 2, 'H'), 'h': read(p + 4, 'h')}

def hook(c, address, size, user):
    sp = c.reg_read(UC_X86_REG_ESP)
    if address == 0x44e940:
        events.append('height')
        ret(current.get('height', 100))
        return
    if address == 0x450520:
        events.append('distance')
        ret(100)
        return
    if address == 0x4ed8a0:
        cls, model, tribe = [read(sp + i * 4, 'I') & 255 for i in (1, 2, 3)]
        position = point_at(read(sp + 16, 'I'))
        events.append(['allocate', cls, model, tribe, position])
        if current.get('fail'):
            ret()
            return
        p = child if current.get('mode') == 'controller' else fire if cls == 5 else wave
        cpu.mem_write(p, bytes(256))
        write(p + 0x2a, 'BBB', cls, model, 1)
        write(p + 0x2f, 'B', tribe)
        write(p + 0x3d, 'HHh', position['x'], position['y'], position['h'])
        if cls == 8:
            write(p + 0x6e, 'B', 1)
        elif model == 1:
            write(p + 0x68, 'i', 3)
            write(p + 0x6c, 'i', 1280)
            write(p + 0x70, '4h', 2, 5, 140, 2)
            write(p + 0x78, 'h', 98)
            write(p + 0x7b, 'B', 1)
        ret(p)
        return
    if address == 0x48a050:
        events.append(['sound', read(sp + 8, 'I')])
        ret()
        return
    if address == 0x4edcf0:
        events.append('terminal')
        ret()
        return
    if address == 0x4ee580:
        events.append('move')
        ret()
        return
    if address == 0x4bb290:
        events.append('payload')
        ret()
        return
    if address == 0x50ccd0:
        events.append('impact-init')
        ret()
        return
    if address == 0x408cb0:
        events.append(['ignite', read(sp + 4, 'I'), read(sp + 8, 'b')])
        ret()
        return

for address in [0x44e940, 0x450520, 0x4ed8a0, 0x48a050, 0x4edcf0, 0x4ee580,
                0x4bb290, 0x50ccd0, 0x408cb0]:
    cpu.hook_add(UC_HOOK_CODE, hook, begin=address, end=address)

def call(address, p):
    write(stack, 'II', stop, p)
    cpu.reg_write(UC_X86_REG_ESP, stack)
    try:
        cpu.emu_start(address, stop, count=1000000)
    except Exception:
        print('FAILED', hex(cpu.reg_read(UC_X86_REG_EIP)))
        raise
    assert cpu.reg_read(UC_X86_REG_EIP) == stop, hex(cpu.reg_read(UC_X86_REG_EIP))

rng = random.Random(0x511640)
cases, expected = [], []
for trial in range(192):
    center = {'x': rng.randrange(65536), 'y': rng.randrange(65536), 'h': rng.randrange(-100, 1001)}
    case = {
        'center': center,
        'tribe': trial % 4,
        'remaining': rng.choice([1, 2, 4, 5, 216, 217, 219, 220]),
        'armed': bool(trial & 1),
        'seed': rng.randrange(0x100000000),
        'height': rng.randrange(-100, 1001),
        'fail': trial % 11 == 0,
    }
    cpu.mem_write(controller, bytes(256))
    cpu.mem_write(child, bytes(256))
    write(controller + 0x2d, 'B', int(case['armed']))
    write(controller + 0x2f, 'B', case['tribe'])
    write(controller + 0x6c, 'h', case['remaining'])
    write(controller + 0x3d, 'HHh', center['x'], center['y'], center['h'])
    write(controller + 0x72, 'HHh', center['x'], center['y'], center['h'])
    write(0x89d178, 'I', case['seed'])
    events.clear()
    current.clear()
    current.update(mode='controller', height=case['height'], fail=case['fail'])
    call(0x511640, controller)
    allocation = next((event for event in events if isinstance(event, list) and event[0] == 'allocate'), None)
    child_state = None
    if allocation and not case['fail']:
        child_state = {
            'speed': read(child + 0x5f, 'h'),
            'origin': point_at(child + 0x70),
            'target': point_at(child + 0x76),
            'payload': [read(child + 0x7c, 'B'), read(child + 0x7d, 'B'), read(child + 0x7e, 'B')],
            'wave': [read(child + offset, 'h') for offset in (0x80, 0x82, 0x84, 0x86)],
            'links': read(child + 0x6e, 'B'),
        }
    cases.append(case)
    expected.append({
        'remaining': read(controller + 0x6c, 'h'),
        'armed': bool(read(controller + 0x2d, 'B')),
        'randomState': read(0x89d178, 'I'),
        'events': [event for event in events if event != 'height'],
        'child': child_state,
    })

js = r"""
import {createFirestorm,stepFirestorm} from './app/firestorm.ts';
let s='';for await(const c of process.stdin)s+=c;const cases=JSON.parse(s);
const out=cases.map(c=>{const land={heights:new Int16Array(16384).fill(c.height),flags:new Uint32Array(16384)},game={randomState:c.seed},f={...createFirestorm(c.center,c.tribe),remaining:c.remaining,armed:c.armed},events=[];let child=null;const alive=stepFirestorm(land,f,game,shot=>{events.push(['allocate',8,4,c.tribe,shot.origin]);if(c.fail)return;events.push(['sound',179]);child={speed:250,origin:shot.origin,target:shot.target,payload:[7,28,4],wave:[80,8,32,0],links:2}});if(!alive)events.push('terminal');return{remaining:f.remaining,armed:f.armed,randomState:game.randomState,events,child}});
console.log(JSON.stringify(out));
"""
result = subprocess.run(['node', '--experimental-strip-types', '--input-type=module', '-e', js],
                        input=json.dumps(cases).encode(), cwd=ROOT, capture_output=True)
assert result.returncode == 0, result.stderr.decode()
actual = json.loads(result.stdout)
if actual != expected:
    index = next(i for i, (a, b) in enumerate(zip(actual, expected)) if a != b)
    Path('/private/tmp/populous-firestorm-mismatch.json').write_text(json.dumps({
        'case': cases[index], 'browser': actual[index], 'native': expected[index]}, indent=2))
    raise AssertionError((index, '/private/tmp/populous-firestorm-mismatch.json'))

# A model-4 projectile reaches its target, moves once and invokes only its payload allocator.
cpu.mem_write(child, bytes(256))
write(child + 0x2d, 'B', 1)
write(child + 0x5f, 'h', 250)
write(child + 0x3d, 'HHh', 0x2200, 0x2400, 100)
write(child + 0x76, 'HHh', 0x2200, 0x2400, 100)
events.clear()
current.clear()
current.update(mode='projectile', height=100)
call(0x4bb440, child)
assert events == ['distance', 'height', 'move', 'payload'], events
assert read(child + 0x2d, 'B') == 2

# Effect model 28 chooses fire/water, creates its configured Blast and ignites the cell building.
for water in [False, True]:
    cpu.mem_write(impact, bytes(256))
    cpu.mem_write(fire, bytes(256))
    cpu.mem_write(wave, bytes(256))
    cpu.mem_write(building, bytes(256))
    cpu.mem_write(0x890390, bytes(4096))
    cpu.mem_write(0x8a03e4, bytes(16384 * 16))
    cpu.mem_write(0x2031000, bytes(1024))
    write(0x892443, 'I', 0x2031000)
    write(impact + 0x2f, 'B', 3)
    write(impact + 0x3d, 'HHh', 0x2444, 0x2888, 100)
    index = (0x2888 >> 9) * 128 + (0x2444 >> 9)
    write(0x8a03e4 + index * 16, 'IhHH', 512, 100, 0, 7)
    write(0x8a03e4 + index * 16 + 12, 'B', 1 if water else 0)
    write(0x890390 + 7 * 4, 'I', building)
    write(building + 0x24, 'H', 7)
    write(building + 0x2a, 'B', 2)
    events.clear()
    current.clear()
    current.update(mode='impact', height=100)
    call(0x511800, impact)
    allocations = [event for event in events if isinstance(event, list) and event[0] == 'allocate']
    assert [(event[1], event[2], event[3]) for event in allocations] == ([(7, 43, 3), (7, 1, 3)] if water else [(5, 10, 3), (7, 1, 3)])
    assert [event for event in events if isinstance(event, list) and event[0] == 'sound'] == [['sound', 85 if water else 182]]
    assert [event[:2] for event in events if isinstance(event, list) and event[0] == 'ignite'] == [['ignite', building]]
    assert [read(wave + offset, 'i' if offset in (0x68, 0x6c) else 'h') for offset in (0x68, 0x6c, 0x70, 0x72, 0x74, 0x78)] == [3, 1280, 2, 5, 140, 98]
    assert read(wave + 0x7a, 'B') & 1 and read(wave + 0x7d, 'B') & 1
    if not water:
        assert read(fire + 0x7c, 'h') == 22 and read(fire + 0x90, 'B') & 1

print(f'PASS: {len(cases)} native Firestorm controller cases, model-4 terminal and land/water impact composition ({identity["sha256"]})')
