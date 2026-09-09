"""Compare collapse face emission and detached-face flight with the supplied EXE.
Usage: python scripts/check-native-building-debris.py EXE
Native geometry, initializer RNG, terrain, physics and impact dispatch execute.
Allocation storage, class callbacks, cell lists and impact consumers are supplied.
Lighting, projection, allocation exhaustion and mixed-class scheduling are outside
this check; the browser check covers integration and visible textured fragments.
"""
import hashlib
import json
import random
import struct
import subprocess
import sys
from pathlib import Path
from unicorn import UC_HOOK_CODE
from unicorn.x86_const import UC_X86_REG_EAX, UC_X86_REG_EIP, UC_X86_REG_ESP
from decomp import ROOT, native_cpu, configure_native_constants

exe = Path(sys.argv[1])
cpu, _ = native_cpu(exe)
configure_native_constants(cpu, exe)
cpu.mem_map(0x2000000, 0x1000000)
unit, objects, faces, points = 0x2000000, 0x2010000, 0x2020000, 0x2200000
fragment, trampoline, stack, stop = 0x2400000, 0x2ffc000, 0x2ffd000, 0x2ffe000
provenance = json.loads((ROOT / 'public/original/provenance.json').read_text())['sha256']

def write(address, fmt, *values):
    cpu.mem_write(address, struct.pack('<' + fmt, *values))

def read(address, fmt):
    return struct.unpack('<' + fmt, cpu.mem_read(address, struct.calcsize('<' + fmt)))[0]

for name, address in [('objs', objects), ('facs', faces), ('pnts', points)]:
    key = f'objects/{name}0-2.dat'
    data = (exe.parent / key).read_bytes()
    assert hashlib.sha256(data).hexdigest() == provenance[key]
    cpu.mem_write(address, data)
    if name == 'objs':
        object_count = len(data) // 54
for index in range(object_count):
    for offset, stride, base in [(16, 60, faces), (20, 60, faces), (24, 6, points), (28, 6, points)]:
        address = objects + index * 54 + offset
        value = read(address, 'I')
        write(address, 'I', base + (value - 1) * stride if value else 0)
write(0x895ec1, 'I', objects)
write(0x895ec5, 'I', faces)

rng = random.Random(0x407860)
land = dict(heights=[], flags=[], categories=[])
for index in range(16384):
    height, flags, category = rng.randrange(513), rng.choice([0, 1, 0x20000, 0x20001]), rng.randrange(16)
    land['heights'].append(height)
    land['flags'].append(flags)
    land['categories'].append(category)
    write(0x8a03e4 + index * 16, 'Ih', flags, height)
    write(0x8a03e4 + index * 16 + 12, 'B', category)

fields = {'x': (0x3d, 'H'), 'y': (0x3f, 'H'), 'h': (0x41, 'h'),
          'flags2': (0xc, 'I'), 'flags4': (0x10, 'I'), 'speed': (0x5f, 'h'),
          'yaw': (0x57, 'H'), 'pitch': (0x59, 'H'), 'heading': (0x26, 'H'),
          'tilt': (0x6c, 'H'), 'roll': (0x6e, 'H'), 'bounce': (0x96, 'h')}

def snapshot():
    result = {key: read(fragment + offset, fmt) for key, (offset, fmt) in fields.items()}
    result['velocity'] = {key: read(fragment + 0x49 + index * 2, 'h') for index, key in enumerate(['x', 'y', 'z'])}
    result['spin'] = [read(fragment + 0x98 + index * 2, 'h') for index in range(3)]
    return result

mode = 'emission'
emitted, impacts = [], []
alive = True
sounds = []

def hook(c, address, size, user):
    global alive
    sp = c.reg_read(UC_X86_REG_ESP)
    if address == 0x4ed8a0:
        kind, model, tribe, position = struct.unpack('<4I', c.mem_read(sp + 4, 16))
        if mode == 'emission':
            assert (kind, model) == (10, 7)
            c.mem_write(fragment, bytes(256))
            write(fragment + 0x2a, 'BB', kind, model)
            write(fragment + 0x2f, 'B', tribe & 255)
            c.mem_write(fragment + 0x3d, bytes(c.mem_read(position, 6)))
            # Execute the actual initializer, then return the supplied allocation.
            c.mem_write(trampoline, b'\x83\xc4\x04\xb8' + struct.pack('<I', fragment) + b'\xc3')
            write(sp - 8, 'II', trampoline, fragment)
            c.reg_write(UC_X86_REG_ESP, sp - 8)
            c.reg_write(UC_X86_REG_EIP, 0x502460)
            return
        assert kind == 7 and model in [3, 65]
        impacts.append(model == 65)
        c.reg_write(UC_X86_REG_EAX, fragment + 256)
    elif address == 0x502660:
        if mode != 'emission':
            return
        value = snapshot()
        face_index = read(fragment + 0x94, 'h')
        face_address = faces + face_index * 60
        count = read(face_address + 6, 'B')
        value.update(face=face_index - first_face, cap=bool(read(fragment + 0x9e, 'B')),
                     vertices=[list(struct.unpack('<3h', c.mem_read(fragment + 0x7a + i * 6, 6))) for i in range(count)])
        value['visible'] = value['cap'] or read(face_address + 7, 'B') != 0
        # 0x470160's cap and tribe texture selection, using the original face data.
        tile = read(face_address + 2, 'h')
        uv = list(struct.unpack('<8i', c.mem_read(face_address + 8, 32)))
        if value['cap']:
            tile, uv = 250, [0, 0, 2097150, 0, 2097150, 2097150, 0, 2097150]
        elif read(0x5aa218 + tile, 'B') & 1:
            tile = (tile + read(fragment + 0x2f, 'B')) & 255
        corners = [0, 1, 2] if count == 3 else [0, 1, 2, 0, 2, 3]
        value['uv'] = [v for i in corners for v in
                       [(tile % 8 + uv[i * 2] / 0x200000) / 8,
                        1 - (tile // 8 + uv[i * 2 + 1] / 0x200000) / 32]]
        emitted.append(value)
    elif address == 0x4ee580:
        position = read(sp + 8, 'I')
        c.mem_write(fragment + 0x3d, bytes(c.mem_read(position, 6)))
    elif address == 0x4edcf0:
        alive = False
    elif address == 0x48a050:
        sounds.append(read(sp + 8, 'I'))
    c.reg_write(UC_X86_REG_EIP, read(sp, 'I'))
    c.reg_write(UC_X86_REG_ESP, sp + 4)

for address in [0x4ed8a0, 0x4ed6f0, 0x4ed640, 0x4ee470, 0x4ee580, 0x4edcf0, 0x48a050, 0x502660]:
    cpu.hook_add(UC_HOOK_CODE, hook, begin=address, end=address)

def call(address, *args):
    write(stack, 'I' * (len(args) + 1), stop, *[arg & 0xffffffff for arg in args])
    cpu.reg_write(UC_X86_REG_ESP, stack)
    cpu.emu_start(address, stop, count=2000000)
    assert cpu.reg_read(UC_X86_REG_EIP) == stop, hex(cpu.reg_read(UC_X86_REG_EIP))

cases, expected = [], []
for model in [79, 80, 95, 96, 103, 104, *range(107,143)]:
    for stage in range(-1,5):
        for angle in [0, 256, 777, 1536, 2047]:
            source = dict(x=rng.choice([0, 65535, rng.randrange(65536)]),
                          y=rng.choice([0, 65535, rng.randrange(65536)]),
                          h=rng.randrange(513), angle=angle,
                          flags3=rng.choice([0, 0x100000]), tribe=rng.randrange(4), stage=rng.randrange(5))
            seed = rng.randrange(2**32)
            cpu.mem_write(unit, bytes(256))
            write(unit + 0x33, 'H', model)
            write(unit + 0x78, 'B', source['stage'])
            write(unit + 0x26, 'H', angle)
            write(unit + 0x14, 'I', source['flags3'])
            write(unit + 0x2f, 'B', source['tribe'])
            write(unit + 0x3d, 'HHh', source['x'], source['y'], source['h'])
            write(0x89d178, 'I', seed)
            first_face = (read(objects + model * 54 + 16, 'I') - faces) // 60
            emitted = []
            call(0x407860, unit, 0, 1, stage, 0, int(stage>=0), -1, -1, 0)
            cases.append(dict(model=model, stage=stage, source=source, seed=seed))
            expected.append(dict(fragments=emitted, randomState=read(0x89d178, 'I')))

mode = 'motion'
motion_cases, motion_expected = [], []
for index in range(256):
    cpu.mem_write(fragment, bytes(256))
    initial = dict(x=rng.randrange(65536), y=rng.randrange(65536), h=rng.randrange(2049),
                   flags2=0x80 | rng.choice([0, 2, 0x4000]), flags4=0, speed=32,
                   yaw=rng.randrange(2048), pitch=512, heading=rng.randrange(2048),
                   tilt=rng.randrange(2048), roll=rng.randrange(2048), bounce=rng.choice([24, 64, 128]))
    for key, value in initial.items():
        offset, fmt = fields[key]
        write(fragment + offset, fmt, value)
    write(fragment + 0x4b, 'h', rng.randrange(64, 96))
    write(fragment + 0x98, '3h', *[rng.randrange(170) for _ in range(3)])
    seed = rng.randrange(2**32)
    write(0x89d178, 'I', seed)
    motion_cases.append(dict(p=snapshot(), seed=seed))
    alive, impacts = True, []
    timeline = []
    for turn in range(32):
        if alive:
            call(0x502660, fragment)
        timeline.append(dict(p=snapshot(), alive=alive, impacts=impacts.copy(), randomState=read(0x89d178, 'I')))
    motion_expected.append(timeline)

# The shared browser splash adapter also serves debris water impacts.
splash_cases, splash_expected = [], []
animation_fields = {'object': (0x33, 'H'), 'renderFlags': (0x35, 'H'),
                    'f1': (0x37, 'h'), 'f2': (0x39, 'B'), 'draw': (0x3a, 'B'),
                    'morph': (0x3b, 'B'), 'palette': (0x3c, 'B'), 'flags3': (0x14, 'I')}
for index in range(128):
    position = dict(x=rng.randrange(65536), y=rng.randrange(65536), h=rng.randrange(1024))
    cpu.mem_write(fragment, bytes(256))
    write(fragment + 0x3d, 'HHh', *position.values())
    sounds = []
    call(0x513830, fragment)
    splash_cases.append(position)
    splash_expected.append(dict(h=read(fragment + 0x41, 'h'), duration=read(fragment + 0x6c, 'h'),
        animation={key: read(fragment + offset, fmt) for key, (offset, fmt) in animation_fields.items()}, sounds=sounds))

js = """
import models from './app/original-models.json' with {type:'json'};
import {collapseBuildingFaces,stepBuildingDebris} from './app/building-debris.ts';
import {createWorld,effect,browserPosition} from './app/model.ts';
let s='';for await(const b of process.stdin)s+=b;
const {land,cases,motionCases,splashCases,animationKeys,keys}=JSON.parse(s);
const pick=p=>Object.fromEntries(keys.map(k=>[k,structuredClone(p[k])]));
const emission=cases.map(c=>{const rng={randomState:c.seed};
 const fragments=[...collapseBuildingFaces(land,models[c.model],c.source,c.stage,rng)].map(p=>({...pick(p),face:p.face,cap:p.cap,visible:p.visible,vertices:p.vertices,uv:p.uv}));
 return {fragments,randomState:rng.randomState};});
const motion=motionCases.map(c=>{const p=c.p,rng={randomState:c.seed},impacts=[],timeline=[];let alive=true;
 for(let i=0;i<32;i++){if(alive)alive=stepBuildingDebris(land,p,rng,water=>impacts.push(water));
 timeline.push({p:pick(p),alive,impacts:[...impacts],randomState:rng.randomState});}return timeline;});
const world=createWorld();Object.assign(world.land,land);
const splash=splashCases.map(p=>{world.effects=[];world.sounds=[];const f=effect(world,'splash',browserPosition(p));
 return {h:Math.round(f.height*45),duration:f.duration*12,
 animation:Object.fromEntries(animationKeys.map(k=>[k,f.animation[k]])),sounds:world.sounds.map(s=>s.cue)};});
console.log(JSON.stringify({emission,motion,splash}));
"""
actual = json.loads(subprocess.check_output(['node', '--input-type=module', '-e', js],
    input=json.dumps(dict(land=land, cases=cases, motionCases=motion_cases, splashCases=splash_cases,
                         animationKeys=list(animation_fields), keys=[*fields, 'velocity', 'spin'])).encode(), cwd=ROOT))
for name, inputs, wanted in [('emission', cases, expected), ('motion', motion_cases, motion_expected),
                             ('splash', splash_cases, splash_expected)]:
    assert len(actual[name]) == len(wanted)
    for index, (a, e) in enumerate(zip(actual[name], wanted)):
        if name == 'emission':
            assert len(a['fragments']) == len(e['fragments']), (index, inputs[index], len(a['fragments']), len(e['fragments']))
            for browser_face, native_face in zip(a['fragments'], e['fragments']):
                browser_uv, native_uv = browser_face.pop('uv'), native_face.pop('uv')
                assert len(browser_uv) == len(native_uv)
                assert all(abs(u - v) < 1e-7 for u, v in zip(browser_uv, native_uv)), (index, browser_uv, native_uv)
        if a != e:
            path = Path('/private/tmp/populous-debris-failure.json')
            path.write_text(json.dumps(dict(kind=name, case=inputs[index], native=e, browser=a), indent=2))
            raise AssertionError(f'{name} case {index}: {path}')
print(f'PASS: {len(cases)} native collapse calls, {sum(len(e["fragments"]) for e in expected)} faces; '
      f'{len(motion_cases) * 32} flight snapshots including gravity, spin, land/water impacts, bounce, removal and RNG; '
      f'{len(splash_cases)} native splash initializations including animation, grounding and sound')
