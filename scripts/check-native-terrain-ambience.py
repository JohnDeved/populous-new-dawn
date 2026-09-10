"""Compare ordinary-world ambience counts from native ground queue and draw dispatch.
Runs 0046e930 and 004673b0; supplies texture-cache data and replaces GPU submission.
Use --record to retain portable captures. No whole original scene/GPU is emulated.
"""
import json, random, struct, subprocess, sys
from pathlib import Path
from unicorn import UC_HOOK_CODE
from unicorn.x86_const import UC_X86_REG_ESP, UC_X86_REG_EIP
from decomp import native_cpu, ROOT

cpu, identity = native_cpu(Path(sys.argv[1]))
cpu.mem_map(0x2000000, 0x1000000)
points, pool, ui, cache, records, stack, stop = 0x2000000, 0x2100000, 0x2300000, 0x2310000, 0x2320000, 0x2ffd000, 0x2ffe000

def write(a, f, *v): cpu.mem_write(a, struct.pack('<' + f, *v))
def read(a, f): return struct.unpack('<' + f, cpu.mem_read(a, struct.calcsize('<' + f)))[0]
def call(a, *args):
    write(stack, 'I' * (1 + len(args)), stop, *args)
    cpu.reg_write(UC_X86_REG_ESP, stack)
    try: cpu.emu_start(a, stop, count=20000000)
    except Exception:
        print('case', case, 'entry', hex(a), 'eip', hex(cpu.reg_read(UC_X86_REG_EIP)))
        raise
    assert cpu.reg_read(UC_X86_REG_EIP) == stop

def skip(c, a, size, user):
    sp = c.reg_read(UC_X86_REG_ESP)
    c.reg_write(UC_X86_REG_EIP, read(sp, 'I'))
    c.reg_write(UC_X86_REG_ESP, sp + {0x47d8a0: 28, 0x47e210: 24}.get(a, 4))

for a in [0x47d8a0, 0x47e210, 0x460970]: cpu.hook_add(UC_HOOK_CODE, skip, begin=a, end=a)
write(0x75d504, 'I', pool + 0x10000)
write(0xafc2f4, 'I', ui)
write(0x9bcfc8, 'I', cache)
write(0x9bcfd8, 'I', records)
write(0xa30720, 'I', records + 0x100)
write(records + 2, 'B', 4)
write(0x895da8, 'I', 0)
write(0x895da4, 'I', 0x80000000)
rng = random.Random(0x4673b0)
cases = []
for case in range(256):
    cpu.mem_write(0x75d50c, bytes(0xe01 * 4))
    write(0x75d508, 'I', pool)
    write(0x87cbb8, 'I', 0xffffffff)
    write(0x87cbc4, 'I', 0)
    for a in [0x87cb74, 0x74a2f4, 0x87cbc0, 0x87cb48]: write(a, 'I', 0)
    triangles = []
    for tag in range(case % 65):
        height = rng.choice([-32768, -1, 0, 512, 513, 32767])
        category = rng.randrange(256)
        depths = [rng.randrange(-32000, 32000) for _ in range(3)] if case > 16 else [case * 100] * 3
        for j, depth in enumerate(depths):
            write(points + j * 32 + 8, 'iffII', depth, 100 + j * 10, 100, 32, 0x40 if tag & 1 else 0)
        polygon = read(0x75d508, 'I')
        call(0x46e930, points, points + 32, points + 64, 0)
        write(polygon + 0x42, 'H', tag)
        write(0x76108c + tag * 8, 'BB', tag * 2, 0)
        write(0x8a03e4 + tag * 16 + 4, 'h', height)
        write(0x8a03e4 + tag * 16 + 12, 'B', category)
        bucket = next(b for b in range(3585) if read(0x75d50c + b * 4, 'I') == polygon)
        triangles.append(dict(bucket=bucket, height=height, category=category))
    call(0x4673b0)
    expected = dict(zip(['total', 'low', 'water', 'high'], [read(a, 'H') for a in [0x87cb74, 0x74a2f4, 0x87cbc0, 0x87cb48]]))
    cases.append(dict(triangles=triangles, expected=expected))
if '--browser' in sys.argv:
    browser = json.loads(Path(sys.argv[sys.argv.index('--browser') + 1]).read_text())
    for frame in browser['cases']:
        triangles = frame['triangles']
        assert len(triangles) < 16384
        cpu.mem_write(0x75d50c, bytes(0xe01 * 4))
        write(0x87cbb8, 'I', min((t['bucket'] for t in triangles), default=0xffffffff))
        write(0x87cbc4, 'I', max((t['bucket'] for t in triangles), default=0))
        for a in [0x87cb74, 0x74a2f4, 0x87cbc0, 0x87cb48]: write(a, 'I', 0)
        for tag, t in enumerate(triangles):
            polygon = pool + tag * 70
            cpu.mem_write(polygon, bytes(70))
            write(polygon + 2, 'I', read(0x75d50c + t['bucket'] * 4, 'I'))
            write(0x75d50c + t['bucket'] * 4, 'I', polygon)
            for off, x, y in [(6,100,100),(26,200,100),(46,100,200)]: write(polygon+off,'ffIII',x,y,0,0,32)
            write(polygon + 0x42, 'H', tag)
            write(0x76108c + tag * 8, 'BB', (tag % 128) * 2, (tag // 128) * 2)
            write(0x8a03e4 + tag * 16 + 4, 'h', t['height'])
            write(0x8a03e4 + tag * 16 + 12, 'B', t['category'])
        call(0x4673b0)
        actual = dict(zip(['total','low','water','high'],[read(a,'H') for a in [0x87cb74,0x74a2f4,0x87cbc0,0x87cb48]]))
        assert frame['expected'] == actual, (frame['view'], frame['expected'], actual)
    print(f"PASS: {len(browser['cases'])} browser terrain queues replayed through native draw dispatch")
js = """import {TerrainAmbience} from './app/terrain-ambience.ts';let s='';for await(const c of process.stdin)s+=c;const a=new TerrainAmbience();console.log(JSON.stringify(JSON.parse(s).map(c=>{a.clear();for(const t of c.triangles)a.add(t.bucket,t.height,t.category);return a.result()})));"""
r = subprocess.run(['node', '--input-type=module', '-e', js], input=json.dumps(cases), text=True, capture_output=True, cwd=ROOT)
assert r.returncode == 0, r.stderr
for i, (c, result) in enumerate(zip(cases, json.loads(r.stdout))): assert c['expected'] == result, (i, c, result)
if '--record' in sys.argv:
    (ROOT / 'tests/fixtures/terrain-ambience.json').write_text(json.dumps(dict(identity=identity, cases=cases), separators=(',', ':')) + '\n')
print(f'PASS: {len(cases)} complete native ordinary terrain queue/draw lists, {sum(len(c["triangles"]) for c in cases)} triangles; GPU consumer supplied')
