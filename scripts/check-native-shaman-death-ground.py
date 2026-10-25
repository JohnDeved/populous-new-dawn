"""Compare original Shaman phase1 grounding with the live world-turn caller.

Usage: python scripts/check-native-shaman-death-ground.py EXE
Real death producer, allocator, initializer, phase controller, object setter and
terrain-height reader execute. No fixture writes or original game/OS launch.
Support predicates, registration, audio, source bookkeeping and spawning are
supplied. Current-game death uses ordinary Mission2 combat; changed terrain is a
supplied fixture. Shipped terrain-spell rendering requires its separate check.
"""
import hashlib
import json
import struct
import sys
import subprocess
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
from decomp import native_cpu, configure_native_constants
from unicorn import UC_HOOK_CODE
from unicorn.x86_const import UC_X86_REG_EAX, UC_X86_REG_EIP, UC_X86_REG_ESP

exe = Path(sys.argv[1])
cpu, identity = native_cpu(exe)
configure_native_constants(cpu, exe)
cpu.mem_map(0x2000000, 0x200000)
source, link, pool, counts = 0x2001000, 0x2002000, 0x2010000, 0x2100000
stack, stop = 0x21ed000, 0x21ef000
tribes = 0x89d1c8
events, bodies, height_reads = [], [], []
unsupported = False

def read(a, f):
    return struct.unpack('<' + f, cpu.mem_read(a, struct.calcsize('<' + f)))[0]

def write(a, f, *v):
    cpu.mem_write(a, struct.pack('<' + f, *v))

def ret(value=0):
    sp = cpu.reg_read(UC_X86_REG_ESP)
    cpu.reg_write(UC_X86_REG_EAX, value)
    cpu.reg_write(UC_X86_REG_EIP, read(sp, 'I'))
    cpu.reg_write(UC_X86_REG_ESP, sp + 4)

search_path = exe.parent / 'data/mwsearch.dat'
search = search_path.read_bytes()
assert hashlib.sha256(search).hexdigest() == '0c39b12d160658863c2df89aa34484dff459e48ea0b5634658b7473ca940fae0'
cpu.mem_write(0x8929cd, search)
constants = json.loads((ROOT / 'app/original-constants.json').read_text())
constant_bytes = []
for index in range(512):
    descriptor = bytes(cpu.mem_read(0x5aa5f0 + index * 31, 31))
    name = descriptor[:25].split(b'\0')[0].decode('ascii')
    if not name:
        break
    if name in constants:
        size, address = descriptor[25], struct.unpack('<I', descriptor[27:])[0]
        constant_bytes.append((address, bytes(cpu.mem_read(address, size))))

def guard(label):
    assert bytes(cpu.mem_read(0x8929cd, len(search))) == search, (label, 'search changed')
    for address, expected in constant_bytes:
        assert bytes(cpu.mem_read(address, len(expected))) == expected, (label, hex(address))

def call(address, *args):
    guard('before call')
    write(stack, 'I' * (len(args) + 1), stop, *args)
    cpu.reg_write(UC_X86_REG_ESP, stack)
    try:
        cpu.emu_start(address, stop, timeout=1000000, count=200000)
    except Exception:
        print(json.dumps({'errorAt': hex(cpu.reg_read(UC_X86_REG_EIP)), 'events': events[-12:]}))
        raise
    assert cpu.reg_read(UC_X86_REG_EIP) == stop, hex(cpu.reg_read(UC_X86_REG_EIP))
    guard('after call')

def hook(c, address, size, user):
    sp = c.reg_read(UC_X86_REG_ESP)
    p = read(sp + 4, 'I')
    if address == 0x4ed8a0:
        cls, model, owner, point = struct.unpack('<4I', c.mem_read(sp + 4, 16))
        events.append(['allocate', cls, model, owner & 255, *struct.unpack('<HHh', c.mem_read(point, 6))])
        if cls == 10 and model == 12:
            return  # Real original allocation and complete model12 initializer.
        if read(0x89243a, 'B'):
            write(0x892443, 'I', read(0x892443, 'I') - 20)
            write(0x89243a, 'B', 0)
        ret(0)  # Unrelated sky/site/splash allocations are explicit failed leaves.
        return
    if address == 0x502910:
        bodies.append(p)
        return
    if address == 0x44e940:
        height_reads.append([read(sp + 4, 'H'), read(sp + 8, 'H')])
        return  # Real terrain interpolation, using supplied flat terrain cells.
    if address in (0x4ef180, 0x4edcf0):
        events.append(['remove', hex(address), p])
        return  # Real class10 deletion/list unlink.
    if address == 0x4eeff0:
        ret(int(unsupported))
        return
    if address == 0x44f980:
        ret(0 if unsupported else 1)
        return
    events.append(['leaf', hex(address)])
    ret()

leaves = [0x4ee470, 0x4eeff0, 0x44f980, 0x48a050, 0x4d5fe0,
          0x41b550, 0x4a3960, 0x499d90, 0x4d4b50, 0x4da0f0,
          0x4ee190, 0x44ff80]
for address in leaves + [0x4ed8a0, 0x502910, 0x44e940, 0x4ef180, 0x4edcf0]:
    cpu.hook_add(UC_HOOK_CODE, hook, begin=address, end=address)

starts_path, frames_path = [exe.parent / 'data' / x for x in ('vstart-0.ani', 'vfra-0.ani')]
starts = list(struct.iter_unpack('<HH', starts_path.read_bytes()))
frames = list(struct.iter_unpack('<HBBBBH', frames_path.read_bytes()))
frame_counts = []
for start, _ in starts:
    frame, seen = start, set()
    while frame and frame not in seen:
        seen.add(frame)
        frame = frames[frame][-1]
    assert frame in (0, start)
    frame_counts.append(len(seen) & 255)

def set_ground(height):
    cpu.mem_write(0x8a03e4, b''.join(struct.pack('<IhH8x', 0, height, 0) for _ in range(16384)))
    guard('after terrain fixture')

def setup(owner=1, population=1, drowning=False, disabled=False):
    global unsupported
    unsupported = drowning
    events.clear()
    bodies.clear()
    height_reads.clear()
    cpu.mem_write(0x2000000, bytes(0x1c0000))
    cpu.mem_write(tribes, bytes(4 * 0xc65))
    # Preserve the mapped search table and mapped-constant address regions.
    cpu.mem_write(0x890390, bytes(0x2000))
    for a in [0x890324, 0x890328, 0x890330, 0x890358, 0x89035c,
              0x890360, 0x895dbb, 0x89c651, 0x89c659, 0x89c661]:
        write(a, 'I', 0)
    write(0x892443, 'I', link)
    write(0x89243a, 'B', 0)
    write(0x89243b, 'B', 0)
    write(0x89c6f0, 'B', 0)
    write(0x89d17c, 'I', 33)
    for i in range(8):
        p = pool + i * 256
        write(p, 'II', p - 256 if i else 0, p + 256 if i < 7 else 0)
        write(p + 0x24, 'H', 640 + i)
        write(0x890390 + (640 + i) * 4, 'I', p)
    write(0x89031c, 'I', pool)
    write(0x890320, 'I', 0)
    write(source + 0x24, 'H', 1)
    write(source + 0x26, 'H', 731)
    write(source + 0x2a, 'BBBBBB', 1, 7, 3, 0, 0, owner)
    write(source + 0xb0, 'B', 255)
    write(source + 0x3d, 'HHh', 4352, 55040, 240)
    write(tribes + owner * 0xc65 + 0x91d, 'I', population)
    write(tribes + owner * 0xc65 + 0x93f, 'B', int(disabled))
    write(0x59df44, 'I', counts)
    for i, count in enumerate(frame_counts):
        write(counts + i * 6 + 1, 'B', count)
    set_ground(240)
    guard('setup complete')

def state(p):
    return {name: read(p + offset, fmt) for name, offset, fmt in [
        ('class', 0x2a, 'B'), ('model', 0x2b, 'B'), ('state', 0x2c, 'B'),
        ('phase', 0x2d, 'B'), ('owner', 0x2f, 'B'), ('heading', 0x26, 'H'),
        ('object', 0x33, 'H'), ('renderFlags', 0x35, 'H'), ('frame', 0x39, 'B'),
        ('x', 0x3d, 'H'), ('y', 0x3f, 'H'), ('height', 0x41, 'h'),
        ('timer', 0x6e, 'h'), ('sourceModel', 0x74, 'B'), ('classifier', 0x75, 'B'),
        ('sharedSpirit', 0x78, 'B')
    ]}

native_cases = []
for owner in range(4):
    setup(owner=owner)
    call(0x4d5cf0, source)
    assert len(bodies) == 1
    p = bodies[0]
    assert state(p)['object'] == 680
    # Allocation already supplies the first phase0 visit. Changing terrain
    # must not move the body during the remaining three phase0 visits.
    set_ground(480)
    for _ in range(3):
        call(0x4ed700, p)
        assert state(p)['height'] == 240
    assert state(p)['phase'] == 1
    rows = []
    for height in (480, 80, 640):
        set_ground(height)
        before_reads = len(height_reads)
        call(0x4ed700, p)
        assert state(p)['height'] == height
        assert len(height_reads) == before_reads + 1
        rows.append(dict(phase=1, ground=height, height=state(p)['height']))
    while state(p)['phase'] == 1:
        call(0x4ed700, p)
    set_ground(960)
    for _ in range(3):
        before_reads = len(height_reads)
        call(0x4ed700, p)
        assert state(p)['height'] == 640
        assert len(height_reads) == before_reads
        rows.append(dict(phase=2, ground=960, height=state(p)['height']))
    call(0x4ed700, p)
    assert state(p)['height'] == 680
    rows.append(dict(phase=3, ground=960, height=state(p)['height']))
    native_cases.append(dict(owner=owner, rows=rows))
    # Direct unsupported entry skips phase1 entirely and retains its starting
    # rise anchor even when terrain changes. The support predicate is supplied.
    setup(owner=owner, drowning=True)
    call(0x4d5cf0, source)
    p = bodies[0]
    assert state(p)['phase'] == 3 and state(p)['height'] == 280
    set_ground(960)
    call(0x4ed700, p)
    assert state(p)['height'] == 320

script = """
import assert from 'node:assert/strict';
import {createWorld, select, command, tick} from './app/model.ts';
import {nativePosition} from './app/world-terrain-runtime.ts';
import {finishLevelStart} from './tests/level-start-fixture.mjs';
const w=finishLevelStart(createWorld(2)), shaman=w.units.find(u=>u.team==='blue'&&u.kind==='shaman');
const body=()=>w.effects.find(f=>f.reincarnation?.team==='blue');
select(w,'shaman'); assert.equal(command(w,w.units.find(u=>u.id===13)),true);
for(let turns=0;turns<2000&&!body();turns++) tick(w,1/12);
assert.equal(shaman.hp,0); assert.equal(w.units.includes(shaman),false);
assert.equal(body()?.reincarnation.phase,0);
while(body().reincarnation.phase<1) tick(w,1/12);
const f=body(), rows=[];
function ground(height){
  const p=nativePosition(w,f), x=(p.x&65535)>>9, y=(p.y&65535)>>9;
  for(const [dx,dy] of [[0,0],[1,0],[0,1],[1,1]])
    w.land.heights[((y+dy)&127)*128+((x+dx)&127)]=height;
  assert.equal(nativePosition(w,f).h,height);
}
function capture(expectedPhase,height){
  tick(w,1/12);
  assert.equal(f.reincarnation.phase,expectedPhase);
  rows.push({phase:f.reincarnation.phase,ground:height,height:Math.round(f.height*45)});
}
for(const height of [480,80,640]){ground(height);capture(1,height);}
while(Math.round(w.respawns[0]*12)>336) tick(w,1/12);
ground(960);
for(let visit=0;visit<3;visit++) capture(2,960);
capture(3,960);
assert.equal(w.status,'playing');
console.log(JSON.stringify(rows));
"""
actual = json.loads(subprocess.check_output(
    ['node', '--input-type=module', '-e', script], cwd=ROOT, text=True))
for case in native_cases:
    assert actual == case['rows'], dict(owner=case['owner'], native=case['rows'], actual=actual)
guard('complete')
print(json.dumps(dict(status='PASS', nativeOwners=4, comparedRows=len(actual) * 4,
                      phase0AndDirectUnsupportedControls=8, guardedConstants=len(constant_bytes),
                      executable=identity, native=native_cases,
                      hashes={str(path): hashlib.sha256(path.read_bytes()).hexdigest() for path in
                              (exe, search_path, starts_path, frames_path, Path(__file__))},
                      limits='Real model12 allocation/initialization, phase controller and terrain interpolation. '
                             'Supplied support/registration/audio/bookkeeping/spawn leaves; non-model12 allocations fail. '
                             'Current world-turn uses ordinary combat death with supplied post-death terrain. '
                             'No native raster, full drowning gameplay, or shipped terrain-spell rendering claim.'), indent=2))
