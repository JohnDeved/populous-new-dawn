"""Compare the Swamp initializer and controller with the original executable."""
import json, random, struct, subprocess, sys
from pathlib import Path
from unicorn import UC_HOOK_CODE
from unicorn.x86_const import UC_X86_REG_EIP, UC_X86_REG_ESP
from decomp import ROOT, native_cpu

cpu, identity = native_cpu(Path(sys.argv[1]))
cpu.mem_map(0x2000000, 0x50000)
swamp, objects, flags, stack, stop = 0x2000000, 0x2010000, 0x2040000, 0x204e000, 0x204f000
write = lambda a, f, *v: cpu.mem_write(a, struct.pack('<' + f, *v))
read = lambda a, f: struct.unpack('<' + f, cpu.mem_read(a, struct.calcsize('<' + f)))[0]
rules = json.loads((ROOT / 'app/original-rules.json').read_text())
cpu.mem_write(flags, bytes(rules['terrainCategoryFlags']))
write(0x59df0c, 'I', flags)
events = []

def hook(c, address, size, user):
    sp = c.reg_read(UC_X86_REG_ESP)
    target = read(sp + 4, 'I')
    id_ = read(target + 0x24, 'H')
    if address == 0x48a050:
        events.append(['sound', read(sp + 8, 'I'), read(sp + 12, 'I')])
    elif address == 0x4ef180:
        events.append(['remove', id_])
    elif address == 0x4da0d0:
        events.append(['kill', id_, read(sp + 8, 'b')])
    elif address == 0x4ed640 and read(target + 0x2a, 'B') == 1 and read(target + 0x2c, 'B') == 27:
        write(target + 0xc, 'I', read(target + 0xc, 'I') | 0x100000)
    c.reg_write(UC_X86_REG_EIP, read(sp, 'I'))
    c.reg_write(UC_X86_REG_ESP, sp + 4)

for address in [0x48a050, 0x4ef180, 0x4ed6f0, 0x4ed640, 0x4da0d0]:
    cpu.hook_add(UC_HOOK_CODE, hook, begin=address, end=address)

def call(address):
    write(stack, 'II', stop, swamp)
    cpu.reg_write(UC_X86_REG_ESP, stack)
    cpu.emu_start(address, stop, count=1000000)
    assert cpu.reg_read(UC_X86_REG_EIP) == stop, hex(cpu.reg_read(UC_X86_REG_EIP))

def cell_index(cell):
    return ((cell >> 9) & 127) * 128 + ((cell & 254) >> 1)

def scan_cells(center):
    packed = ((center['x'] >> 8) & 254) | (center['y'] & 0xfe00)
    return [(((packed & 255) + x) & 255) | ((((packed >> 8) + y) & 255) << 8)
            for y in [-2, 0, 2] for x in [-2, 0, 2]]

rng = random.Random(0x511400)
cases, expected = [], []
for trial in range(256):
    center = {'x': rng.randrange(65536), 'y': rng.randrange(65536), 'h': rng.randrange(1025)}
    remaining, kills = rng.choice([1, 2, 31, 32000]), rng.choice([0, 8, 9])
    cells = scan_cells(center)
    terrain = [{'cell': cell, 'cliff': rng.choice([0, 0, 127, 128, 255]), 'category': rng.randrange(16)} for cell in cells]
    records = []
    rows = {cell: [] for cell in cells}
    for id_ in range(1, 25):
        cell = rng.choice(cells + [0x4242])
        record = {
            'id': id_, 'cell': cell, 'class': rng.choice([1, 1, 1, 2, 5]),
            'flags2': rng.choice([0, 0, 2, 0x100000]),
            'flags4': rng.choice([0, 0, 0x400, 0x800]),
            'attached': rng.choice([0, 0, 0, 7]), 'immune': bool(rng.randrange(5) == 0),
            'state': rng.choice([1, 10, 14, 26]), 'previousState': 3,
        }
        if trial % 16 == 15:
            record.update({'cell': cells[0], 'class': 1, 'flags2': 0, 'flags4': 0, 'attached': 0, 'immune': False})
        records.append(record)
        if record['cell'] in rows:
            rows[record['cell']].append(id_)

    cpu.mem_write(swamp, bytes(256))
    cpu.mem_write(objects, bytes(256 * 25))
    cpu.mem_write(0x890390, bytes(4096))
    cpu.mem_write(0x8a03e4, bytes(16384 * 16))
    write(swamp + 0x24, 'H', 0)
    write(swamp + 0x3d, 'HHh', center['x'], center['y'], center['h'])
    write(swamp + 0x2e, 'B', trial & 255)
    write(swamp + 0x2f, 'b', trial % 4)
    write(swamp + 0x6c, 'h', remaining)
    write(swamp + 0x70, 'h', kills)
    write(0x89d17c, 'I', 2 if trial % 19 == 0 else 0)
    for item in terrain:
        a = 0x8a03e4 + cell_index(item['cell']) * 16
        write(a + 10, 'B', item['cliff'])
        write(a + 12, 'B', item['category'])
        row = rows[item['cell']]
        write(a + 6, 'H', row[0] if row else 0)
        for id_, next_ in zip(row, row[1:] + [0]):
            write(objects + id_ * 256 + 0x20, 'H', next_)
    for record in records:
        p = objects + record['id'] * 256
        write(0x890390 + record['id'] * 4, 'I', p)
        write(p + 0x24, 'H', record['id'])
        write(p + 0x2a, 'B', record['class'])
        write(p + 0x2c, 'B', record['state'])
        write(p + 0x7d, 'B', record['previousState'])
        write(p + 0x30, 'B', 19 if record['immune'] else 3)
        write(p + 0xc, 'I', record['flags2'])
        write(p + 0x10, 'I', record['flags4'])
        write(p + 0x9f, 'H', record['attached'])
    events.clear()
    call(0x511400)
    cases.append({
        'swamp': {'center': center, 'tribe': trial % 4, 'counter': trial & 255,
                  'remaining': remaining, 'kills': kills, 'variant': 0},
        'special': trial % 19 == 0, 'terrain': terrain, 'records': records, 'rows': rows,
    })
    expected.append({
        'remaining': read(swamp + 0x6c, 'h'), 'kills': read(swamp + 0x70, 'h'),
        'records': [{'id': r['id'], 'state': read(objects + r['id'] * 256 + 0x2c, 'B'),
                     'previousState': read(objects + r['id'] * 256 + 0x7d, 'B'),
                     'flags2': read(objects + r['id'] * 256 + 0xc, 'I')} for r in records],
        'events': list(events),
    })

init_cases, init_expected = [], []
for trial in range(96):
    tribe, seed = trial % 4, rng.randrange(0x100000000)
    existing = [{'id': i + 1, 'tribe': tribe if i % 5 else (tribe + 1) % 4,
                 'remaining': rng.randrange(1, 32001)} for i in range(trial % 36)]
    cpu.mem_write(swamp, bytes(256))
    cpu.mem_write(objects, bytes(256 * 40))
    write(swamp + 0xc, 'I', 0x100000)
    write(swamp + 0x24, 'H', 0)
    write(swamp + 0x2c, 'B', 19)
    write(swamp + 0x2f, 'b', tribe)
    write(swamp + 0x3d, 'HHh', trial * 431 & 65535, trial * 977 & 65535, trial)
    newest = list(reversed(existing))
    chain = [swamp] + [objects + item['id'] * 256 for item in newest]
    write(0x890374, 'I', chain[0])
    for i, p in enumerate(chain):
        write(p + 8, 'I', chain[i + 1] if i + 1 < len(chain) else 0)
    for item in existing:
        p = objects + item['id'] * 256
        write(p + 0x24, 'H', item['id'])
        write(p + 0x2f, 'b', item['tribe'])
        write(p + 0x6c, 'h', item['remaining'])
    write(0x89d178, 'I', seed)
    events.clear()
    call(0x511340)
    assert read(swamp + 0x2c, 'B') == 19 and read(swamp + 0x3a, 'B') == 52
    init_cases.append({'center': {'x': trial * 431 & 65535, 'y': trial * 977 & 65535, 'h': trial},
                       'tribe': tribe, 'counter': 0, 'seed': seed, 'existing': existing})
    init_expected.append({'remaining': read(swamp + 0x6c, 'h'), 'variant': read(swamp + 0x72, 'B'),
                          'randomState': read(0x89d178, 'I'),
                          'removed': next((event[1] for event in events if event[0] == 'remove'), None)})

js = r"""
import {createSwamp,excessSwamp,stepSwamp} from './app/swamp.ts';
let s='';for await(const c of process.stdin)s+=c;const d=JSON.parse(s);
const scans=d.cases.map(c=>{const land={cliffs:new Uint8Array(16384),categories:new Uint8Array(16384)},map=new Map(c.records.map(r=>[r.id,{...r}]));for(const t of c.terrain){const i=((t.cell>>>9)&127)*128+((t.cell&254)>>>1);land.cliffs[i]=t.cliff;land.categories[i]=t.category}const swamp={...c.swamp},events=[];const alive=stepSwamp(land,swamp,c.special,{cell:cell=>(c.rows[cell]??[]).map(id=>map.get(id)),kill:p=>{p.previousState=p.state;p.state=27;p.flags2=(p.flags2|0x100000)>>>0;events.push(['kill',p.id,swamp.tribe])},remove:p=>events.push(['remove',p.id]),sound:()=>events.push(['sound',170,64])});if(!alive)events.push(['remove',0]);return{remaining:swamp.remaining,kills:swamp.kills,records:c.records.map(r=>{const p=map.get(r.id);return{id:p.id,state:p.state,previousState:p.previousState,flags2:p.flags2}}),events}});
const init=d.initCases.map(c=>{const game={randomState:c.seed},current=createSwamp(c.center,c.tribe,c.counter,game),all=[...c.existing.map(x=>({...current,...x})),current],removed=excessSwamp(all.filter(x=>x.tribe===c.tribe));return{remaining:current.remaining,variant:current.variant,randomState:game.randomState,removed:removed?.id??null}});
console.log(JSON.stringify({process:scans,init}));
"""
result = subprocess.run(['node', '--experimental-strip-types', '--input-type=module', '-e', js],
                        input=json.dumps({'cases': cases, 'initCases': init_cases}).encode(),
                        cwd=ROOT, capture_output=True)
assert result.returncode == 0, result.stderr.decode()
actual = json.loads(result.stdout)
for label, want in [('process', expected), ('init', init_expected)]:
    if actual[label] != want:
        i = next(i for i, (a, b) in enumerate(zip(actual[label], want)) if a != b)
        Path('/private/tmp/populous-swamp-mismatch.json').write_text(json.dumps({
            'label': label, 'case': (cases if label == 'process' else init_cases)[i],
            'browser': actual[label][i], 'native': want[i]}, indent=2))
        raise AssertionError((label, i, '/private/tmp/populous-swamp-mismatch.json'))
print(f'PASS: {len(cases)} native Swamp scans plus {len(init_cases)} initializer/RNG/cap cases ({identity["sha256"]})')
