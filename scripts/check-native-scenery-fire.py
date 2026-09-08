"""Compare original fire initialization, lifetime, burning turns and tree shrink.
Usage: python scripts/check-native-scenery-fire.py EXE
World allocation, sound, sunlight and class cleanup are intercepted; native
terrain, model setup, frame stepping, growth/shrink and RNG execute. Camera
ownership, audio voice lifetime and delayed replanting are browser adapters.
"""
import json
import importlib.util
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
cpu.mem_map(0x2000000, 0x40000)
unit, objects, context, spark, stack, stop = 0x2000000, 0x2010000, 0x2020000, 0x2021000, 0x203d000, 0x203e000

def write(address, fmt, *values):
    cpu.mem_write(address, struct.pack('<' + fmt, *values))

def read(address, fmt):
    return struct.unpack('<' + fmt, cpu.mem_read(address, struct.calcsize('<' + fmt)))[0]

cpu.mem_write(objects, (exe.parent / 'objects/objs0-2.dat').read_bytes())
write(0x895ec1, 'I', objects)
cpu.mem_write(0x5a9f20, (exe.parent / 'data/anibl0-0.dat').read_bytes())
rng = random.Random(0x4a7170)
land = dict(heights=[], flags=[], categories=[])
for index in range(16384):
    h, flags, category = rng.randrange(1024), rng.randrange(2), rng.randrange(16)
    land['heights'].append(h)
    land['flags'].append(flags)
    land['categories'].append(category)
    write(0x8a03e4 + index * 16, 'Ih', flags, h)
    write(0x8a03e4 + index * 16 + 12, 'B', category)

fields = {'x': (0x3d, 'H'), 'y': (0x3f, 'H'), 'h': (0x41, 'h'),
          'scale': (0x68, 'i'), 'maxScale': (0x7e, 'i'), 'growth': (0x82, 'h'),
          'remaining': (0x7c, 'h'), 'frame': (0x39, 'B'), 'heading': (0x26, 'H'),
          'flags2': (0xc, 'I'), 'flags4': (0x10, 'I'), 'renderFlags': (0x35, 'H'),
          'sceneryFlags': (0x90, 'B')}
alive, events = True, []
check_facing = False

def hook(c, address, size, user):
    global alive
    if address == 0x4eebc0 and check_facing:
        return
    sp = c.reg_read(UC_X86_REG_ESP)
    if address == 0x4ed640:
        c.reg_write(UC_X86_REG_EIP, 0x4a6210)
        return
    result = 0
    if address == 0x48a050:
        events.append(['sound', read(sp + 8, 'I')])
    elif address in [0x4a6e20, 0x4ef180]:
        alive = False
    elif address == 0x4eebc0:
        result = read(unit + 0x26, 'H') # Camera-facing input is supplied separately.
    elif address == 0x4ed8a0:
        kind, model, tribe, position = struct.unpack('<4I', c.mem_read(sp + 4, 16))
        if kind == 7:
            xyz = list(struct.unpack('<HHh', c.mem_read(position, 6)))
            events.append(['ember' if model == 3 else 'smoke', xyz])
            result = spark if model == 3 else spark + 256
            c.mem_write(result, bytes(256))
        else:
            assert kind == 5 and model in [10, 17]
            events.append(['fire' if model == 10 else 'replant'])
    c.reg_write(UC_X86_REG_EAX, result)
    c.reg_write(UC_X86_REG_EIP, read(sp, 'I'))
    c.reg_write(UC_X86_REG_ESP, sp + 4)

for address in [0x4ed640, 0x4ed6f0, 0x4ee470, 0x44fad0, 0x4010b0, 0x48a050,
                0x4a6e20, 0x4ef180, 0x4ed8a0, 0x4eebc0]:
    cpu.hook_add(UC_HOOK_CODE, hook, begin=address, end=address)

def call(address, *args):
    write(stack, 'I' * (len(args) + 1), stop, *[v & 0xffffffff for v in args])
    cpu.reg_write(UC_X86_REG_ESP, stack)
    cpu.emu_start(address, stop, count=100000)
    assert cpu.reg_read(UC_X86_REG_EIP) == stop, hex(cpu.reg_read(UC_X86_REG_EIP))

def fire_state():
    out = {key: read(unit + offset, fmt) for key, (offset, fmt) in fields.items()}
    flags2, flags4 = out.pop('flags2'), out.pop('flags4')
    render, scenery = out.pop('renderFlags'), out.pop('sceneryFlags')
    out.update(groundDirty=bool(flags2 & 4), soundPlaying=bool(flags4 & 16), hidden=bool(render & 16),
               smokeOnExpiry=bool(scenery & 16), suppressEmbers=bool(scenery & 1), expiring=bool(scenery & 4))
    return out

def snapshot():
    out = fire_state()
    details = [*events]
    for event in details:
        if event[0] == 'ember':
            event.extend([read(spark + 0x5f, 'h'), read(spark + 0x10, 'I')])
    return dict(p=out, alive=alive, events=details, randomState=read(0x89d178, 'I'))

cases, expected = [], []
for index in range(128):
    cpu.mem_write(unit, bytes(256))
    position = dict(x=rng.randrange(65536), y=rng.randrange(65536))
    options = dict(size=rng.choice([8, 16, 32, 48]), snap=bool(index & 1), smoke=bool(index & 2))
    seed, cosmetic = rng.randrange(2**32), rng.randrange(2**32)
    write(unit + 0x2a, 'BB', 5, 10)
    write(unit + 0x3d, 'HHh', position['x'], position['y'], 0)
    write(unit + 0xc, 'I', 0x400)
    write(context, '5i', 1, int(options['snap']), options['size'], int(options['smoke']), 0)
    write(0x892443, 'I', context + 20)
    write(0x89bc72, 'I', cosmetic)
    write(0x89d178, 'I', seed)
    alive, events = True, []
    call(0x4a6b20, unit)
    initial = fire_state()
    initial_cosmetic = read(0x89bc72, 'I')
    turns = rng.choice([-1, 0, 1, 4, 10, 22, 24, 27, 28, 29, 30, 38, 39, 76])
    call(0x4a8c60, unit, turns)
    override = dict(flags2=4 if index % 5 == 0 else 0, flags4=16 if index % 7 == 0 else 0,
                    sceneryFlags=read(unit + 0x90, 'B') | (1 if index % 3 == 0 else 0))
    for key, value in override.items():
        offset, fmt = fields[key]
        write(unit + offset, fmt, value)
    timeline = []
    for turn in range(80):
        events = []
        if alive:
            call(0x4a7170, unit)
        timeline.append(snapshot())
    cases.append(dict(position=position, options=options, seed=seed, cosmetic=cosmetic, turns=turns, override=override))
    expected.append(dict(initial=initial, cosmetic=initial_cosmetic, timeline=timeline))

tree_cases, tree_expected = [], []
for model in range(1, 7):
    for wood in [100, 104, 200, 396, 400]:
        cpu.mem_write(unit, bytes(256))
        write(unit + 0x2a, 'BBB', 5, model, 5)
        write(unit + 0x33, 'H', model + 12)
        write(unit + 0x7c, 'h', 76)
        write(unit + 0x84, 'h', wood)
        scale = read(objects + (model + 12) * 54 + 12, 'i')
        write(unit + 0x68, 'i', scale)
        write(0x892443, 'I', context)
        alive, timeline = True, []
        for turn in range(80):
            events = []
            if alive:
                call(0x4a7bd0, unit)
            timeline.append(dict(remaining=read(unit + 0x7c, 'h'), started=bool(read(unit + 0x2d, 'B')),
                                 wood=read(unit + 0x84, 'h'), scale=read(unit + 0x68, 'i'), alive=alive,
                                 fire=any(e[0] == 'fire' for e in events)))
        tree_cases.append(dict(model=model, wood=wood, scale=scale))
        tree_expected.append(timeline)

facing_cases, facing_expected = [], []
check_facing = True
for index in range(512):
    p = dict(x=rng.randrange(65536), y=rng.randrange(65536))
    camera = dict(x=rng.randrange(65536), y=rng.randrange(65536), angle=rng.randrange(2048))
    write(unit + 0x3d, 'HH', p['x'], p['y'])
    write(0x89d1c8 + 0x24, 'HH', camera['x'], camera['y'])
    write(0x89d1c8 + 0x32, 'H', camera['angle'])
    call(0x4eebc0, 0, unit + 0x3d)
    facing_cases.append(dict(p=p, camera=camera))
    facing_expected.append(cpu.reg_read(UC_X86_REG_EAX))

# Execute both native pixel converters for every texel in the imported object bank.
cpu.mem_map(0x2100000, 0x20000)
palette_ptr, alpha_ptr, pixels_ptr, output_ptr, format_ptr = 0x2100000, 0x2101000, 0x2111000, 0x2112000, 0x2113000
palette = (exe.parent / 'data/pal0-c.dat').read_bytes()
alpha = (exe.parent / 'data/al0-c.dat').read_bytes()
atlas = (exe.parent / 'data/bl320-c.dat').read_bytes()
cpu.mem_write(palette_ptr, palette)
cpu.mem_write(alpha_ptr, alpha)
for offset, value in [(8,32),(12,8),(16,8),(20,8),(24,4),(28,0),(32,8),(36,16),(40,24),(56,0xff000000)]:
    write(format_ptr + offset, 'I', value)
spec = importlib.util.spec_from_file_location('assets', ROOT / 'scripts/import-original.py')
assets = importlib.util.module_from_spec(spec)
spec.loader.exec_module(assets)
alpha_tiles = [bool(read(0x5d2910 + i * 4, 'I')) for i in range(256)]
imported = assets.object_atlas(atlas, palette, alpha, alpha_tiles)
for tile in range(256):
    indices = [(tile // 8 * 32 + y) * 256 + tile % 8 * 32 + x for y in range(32) for x in range(32)]
    cpu.mem_write(pixels_ptr, bytes(atlas[i] for i in indices))
    args = [pixels_ptr, output_ptr, format_ptr, palette_ptr, 1024]
    if alpha_tiles[tile]: args.append(alpha_ptr)
    call(0x42fb30 if alpha_tiles[tile] else 0x42f980, *args, 0)
    converted = bytearray(cpu.mem_read(output_ptr, 4096))
    if alpha_tiles[tile]:
        for i in range(3, 4096, 4): converted[i] *= 17 # Normalize native four-bit opacity for PNG.
    expected_pixels = b''.join(imported[i*4:i*4+4] for i in indices)
    assert converted == expected_pixels, f'Object atlas tile {tile}'
print('PASS: all 262,144 object-atlas texels against native palette/AL-alpha converters')

js = """
import {createSceneryFire,setFireLifetime,stepSceneryFire,stepBurningTree,fireHeading} from './app/scenery-fire.ts';
import {terrainSupportsPerson} from './app/person-collision.ts';
import rules from './app/original-rules.json' with {type:'json'};
let s='';for await(const b of process.stdin)s+=b;const {land,cases,trees,facings}=JSON.parse(s);
const fire=cases.map(c=>{const rng={randomState:c.seed},cosmetic={randomState:c.cosmetic};
 const p=createSceneryFire(land,c.position,c.options,cosmetic),initial=structuredClone(p);
 setFireLifetime(p,c.turns);
 Object.assign(p,{groundDirty:!!(c.override.flags2&4),soundPlaying:!!(c.override.flags4&16),
  smokeOnExpiry:!!(c.override.sceneryFlags&16),suppressEmbers:!!(c.override.sceneryFlags&1),expiring:!!(c.override.sceneryFlags&4)});let alive=true;const timeline=[];
 for(let i=0;i<80;i++){const events=[];if(alive)alive=stepSceneryFire(land,p,rng,{
  isLand:()=>!!terrainSupportsPerson(land.categories[(p.y>>9)*128+(p.x>>9)],p),
  sound:()=>events.push(['sound',6]),smoke:()=>events.push(['smoke',[p.x,p.y,p.h]]),
  ember:(q,speed,flags)=>events.push(['ember',[q.x,q.y,q.h],speed,flags]),
 });timeline.push({p:structuredClone(p),alive,events,randomState:rng.randomState});}
 return {initial,cosmetic:cosmetic.randomState,timeline};});
const tree=trees.map(c=>{const p={remaining:76,started:false,wood:c.wood,scale:c.scale};let alive=true;const timeline=[];
 for(let i=0;i<80;i++){let fire=false;if(alive)alive=stepBurningTree(p,rules.sceneryWood[c.model],c.scale,()=>{fire=true});
 timeline.push({...p,alive,fire});}return timeline;});
console.log(JSON.stringify({fire,tree,facing:facings.map(c=>fireHeading(c.p,c.camera))}));
"""
result = json.loads(subprocess.check_output(['node', '--input-type=module', '-e', js],
    input=json.dumps(dict(land=land, cases=cases, trees=tree_cases, facings=facing_cases)).encode(), cwd=ROOT))
for kind, inputs, wanted in [('fire', cases, expected), ('tree', tree_cases, tree_expected), ('facing', facing_cases, facing_expected)]:
    assert len(result[kind]) == len(wanted)
    for index, (a, e) in enumerate(zip(result[kind], wanted)):
        if a != e:
            path = Path('/private/tmp/populous-fire-failure.json')
            path.write_text(json.dumps(dict(kind=kind, case=inputs[index], native=e, browser=a), indent=2))
            raise AssertionError(f'{kind} case {index}: {path}')
print('PASS: 128 native fire initializations/lifetime settings, 10,240 fire snapshots, 2,400 burning-tree snapshots and 512 camera-facing angles; ground, growth/shrink, animation, embers, smoke, sound requests and RNG')
