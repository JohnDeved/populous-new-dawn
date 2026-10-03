"""Read-only Temple mesh/socket and ANIBL material-owner proof.

python -B scripts/check-native-temple-top-vfx.py --exe EXE --data-root GAME --output NEW_JSON

Reuses import-original.py's pure decoder and existing native building-socket and
model-material probe boundaries. Executes original object selection, socket
placement, ANIBL initialization/update, and material lookup through triangle
submission. Terrain height and texture-cache/GPU leaves are supplied. No fixture,
importer output, original input, production file or atlas is written.
"""
import argparse
import hashlib
import importlib.util
import json
import struct
import subprocess
from pathlib import Path

from PIL import Image
from unicorn import UC_HOOK_CODE
from unicorn.x86_const import UC_X86_REG_EAX, UC_X86_REG_EIP, UC_X86_REG_ESP
from decomp import ROOT, native_cpu


def sha(data):
    return hashlib.sha256(data).hexdigest()


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--exe', type=Path, required=True)
    parser.add_argument('--data-root', type=Path, required=True)
    parser.add_argument('--output', type=Path, required=True)
    args = parser.parse_args()
    if args.output.exists():
        raise ValueError('Preserve earlier evidence; output must be new')
    provenance = json.loads((ROOT / 'public/original/provenance.json').read_text())
    names = ['objects/objs0-2.dat', 'objects/facs0-2.dat', 'objects/pnts0-2.dat',
             'objects/shapes.dat', 'data/smoke.txt', 'data/anibl0-0.dat',
             'data/bl320-c.dat', 'data/pal0-c.dat', 'data/al0-c.dat']
    raw = {}
    for name in names:
        raw[name] = (args.data_root / name).read_bytes()
        assert sha(raw[name]) == provenance['sha256'][name], name
    spec = importlib.util.spec_from_file_location('temple_original_decoder', ROOT / 'scripts/import-original.py')
    decoder = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(decoder)
    models = json.loads((ROOT / 'app/original-models.json').read_text())
    shapes = json.loads((ROOT / 'app/original-shapes.json').read_text())
    rules = json.loads((ROOT / 'app/original-rules.json').read_text())
    anibl = raw['data/anibl0-0.dat']
    fire = json.loads((ROOT / 'app/original-fire.json').read_text())
    assert list(anibl[24:33]) == fire['frames'] == [92, 93, 94, 95, 100, 101, 102, 103, 108]
    assert anibl[36] == fire['tile'] == 92 and anibl[37] == 9
    original_shapes = decoder.building_shapes(raw['objects/shapes.dat'], raw['objects/objs0-2.dat'], raw['data/smoke.txt'])
    assert original_shapes == shapes
    model_rows = []
    for model in range(95, 99):
        decoded, _ = decoder.decode_original_model(raw['objects/objs0-2.dat'],
            raw['objects/facs0-2.dat'], raw['objects/pnts0-2.dat'], model)
        assert decoded == models[str(model)], model
        faces = [i for i, mode in enumerate(decoded['modes']) if mode == 32]
        assert faces == list(range(127, 143))
        assert all(decoded['tiles'][i] == 92 and decoded['faces'][i * 2:i * 2 + 2] == [4, 0] for i in faces)
        vertex = 0
        anchors = []
        top = []
        for i, count in enumerate(decoded['faces'][::2]):
            n = 3 if count == 3 else 6
            # Recover original PNTS units; normalized imported coordinates are
            # not yet a scene transform or a socket.
            points = [[round(decoded['p'][(vertex + v) * 3 + axis] * decoded['scale'] * 3
                       * (-1 if axis == 2 else 1)) for axis in range(3)] for v in range(n)]
            vertex += n
            if i in faces:
                anchors.append(dict(face=i, nativePoints=points))
            top.append(dict(face=i, nativeMaxHeight=max(v[1] for v in points),
                            tile=decoded['tiles'][i], mode=decoded['modes'][i]))
        top_height = max(x['nativeMaxHeight'] for x in top)
        model_rows.append(dict(model=model, scale=decoded['scale'], sourceFaces=len(decoded['faces']) // 2,
            expandedVertices=len(decoded['p']) // 3, panelHeight=decoded['panelHeight'],
            shapes=shapes['objects'][model], fullbrightFaces=faces, faceAnchors=anchors,
            roofFaces=[x for x in top if x['nativeMaxHeight'] == top_height],
            importedSHA=sha(json.dumps(decoded, separators=(',', ':')).encode())))
    atlas = Image.open(ROOT / 'public/original/atlas.png').convert('RGBA')
    rebuilt = Image.frombytes('RGBA', (256, 1024), bytes(decoder.object_texture(decoder.object_atlas(
        raw['data/bl320-c.dat'], raw['data/pal0-c.dat'], raw['data/al0-c.dat'], rules['objectTextureAlpha']))))
    atlas_tiles = sorted(set(fire['frames'] + [226, 227, 228, 229]))
    tile_hashes = {}
    for tile in atlas_tiles:
        box = (tile % 8 * 32, tile // 8 * 32, tile % 8 * 32 + 32, tile // 8 * 32 + 32)
        a, b = atlas.crop(box).tobytes(), rebuilt.crop(box).tobytes()
        assert a == b, tile
        tile_hashes[str(tile)] = sha(a)
    assert len({tile_hashes[str(tile)] for tile in fire['frames']}) == 9

    cpu, identity = native_cpu(args.exe)
    cpu.mem_map(0x2000000, 0x100000)
    objects, shape_mem = 0x2000000, 0x2030000
    building, point, polygon, ui, stack, stop = 0x2040000, 0x2041000, 0x2042000, 0x2050000, 0x20fd000, 0x20fe000

    def write(address, fmt, *values):
        cpu.mem_write(address, struct.pack('<' + fmt, *values))

    def read(address, fmt):
        return struct.unpack('<' + fmt, cpu.mem_read(address, struct.calcsize('<' + fmt)))[0]

    def call(address, *values):
        write(stack, 'I' * (len(values) + 1), stop, *values)
        cpu.reg_write(UC_X86_REG_ESP, stack)
        cpu.emu_start(address, stop, timeout=1000000, count=250000)
        assert cpu.reg_read(UC_X86_REG_EIP) == stop, hex(cpu.reg_read(UC_X86_REG_EIP))

    # Existing original object/shape relocation, limited to read-only data copies.
    cpu.mem_write(objects, raw['objects/objs0-2.dat'])
    cpu.mem_write(shape_mem, raw['objects/shapes.dat'])
    write(0x895ec1, 'I', objects)
    write(0x59df3c, 'I', shape_mem)
    for i in range(64):
        relative = struct.unpack_from('<I', raw['objects/shapes.dat'], i * 48 + 44)[0]
        write(shape_mem + i * 48 + 44, 'I', shape_mem + 3072 + relative)
    for line in raw['data/smoke.txt'].decode('ascii').splitlines():
        fields = line.split('#', 1)[0].split()
        if fields:
            assert fields[0] == 'SMOKE' and len(fields) == 6
            model, angle, x, h, y = map(int, fields[1:])
            write(0x5f0558 + (model * 4 + angle) * 6, 'hhh', x, h, y)

    def supplied_height(c, address, size, user):
        sp = c.reg_read(UC_X86_REG_ESP)
        c.reg_write(UC_X86_REG_EAX, 240)
        c.reg_write(UC_X86_REG_EIP, read(sp, 'I'))
        c.reg_write(UC_X86_REG_ESP, sp + 4)

    cpu.hook_add(UC_HOOK_CODE, supplied_height, begin=0x44e940, end=0x44e940)
    descriptor = bytes(cpu.mem_read(0x5a7228 + 5 * 76, 76))
    assert struct.unpack_from('<H', descriptor, 0)[0] == rules['buildingObjects'][5] == 95
    assert struct.unpack_from('<I', descriptor, 72)[0] == rules['buildingFlags'][5] == 0x489f
    selection, sockets = [], []
    for tribe in range(4):
        cpu.mem_write(building, bytes(256))
        write(building + 0x2b, 'B', 5)
        write(building + 0x2f, 'B', tribe)
        call(0x40b170, building)
        model = read(building + 99, 'H')
        assert model == 95 + tribe
        selection.append(dict(tribe=tribe, model=model))
        for quadrant in range(4):
            for slot in range(6):
                write(building + 0x33, 'H', model)
                write(building + 0x26, 'H', quadrant * 512)
                write(building + 0x7a, 'HH', 65024, 512)
                call(0x404540, building, slot, point)
                offset = cpu.reg_read(UC_X86_REG_EAX)
                offset = (offset ^ 0x80000000) - 0x80000000
                x, y, h = struct.unpack('<HHh', cpu.mem_read(point, 6))
                assert h == 240 + offset
                sockets.append(dict(model=model, quadrant=quadrant, slot=slot, x=x, y=y, heightOffset=offset))

    # Pointers are distinguishable opaque handles, not real GPU resources.
    # 0044fbd0 writes dynamic bank 0x5d2510, exactly 256 entries after bank1.
    for tile in range(256):
        write(0x974160 + tile * 4, 'I', 0x3100000 + tile * 16)
        write(0x5d2110 + tile * 4, 'I', 0x3200000 + tile * 16)
        write(0x5d2510 + tile * 4, 'I', 0x3200000 + tile * 16)
    cpu.mem_write(0x5a9f20, anibl)
    call(0x44fc40)
    assert read(0x5a9f20 + 20 + 18, 'B') == 0
    assert read(0x5d2510 + 92 * 4, 'I') == 0x3200000 + 92 * 16
    textures, triangles = [], []

    def supplied_gpu(c, address, size, user):
        sp = c.reg_read(UC_X86_REG_ESP)
        if address == 0x487e30:
            textures.append(read(sp + 4, 'I'))
            write(read(sp + 8, 'I'), 'I6f', 0, 0, 0, 1, 1, 1 / 32, 0)
            c.reg_write(UC_X86_REG_EAX, 0)
            c.reg_write(UC_X86_REG_EIP, read(sp, 'I'))
            c.reg_write(UC_X86_REG_ESP, sp + 20)
        else:
            triangles.append([read(read(sp + 4 + v * 4, 'I') + 16, 'I') for v in range(3)])
            c.reg_write(UC_X86_REG_EIP, stop)

    for address in (0x487e30, 0x47d8a0):
        cpu.hook_add(UC_HOOK_CODE, supplied_gpu, begin=address, end=address)
    write(0xafc2f4, 'I', ui)
    cpu.mem_write(0x75d50c, bytes(3585 * 4))
    write(0x75d50c + 3584 * 4, 'I', polygon)
    cpu.mem_write(polygon, bytes(70))
    write(polygon, 'B', 6)
    # Face emits tile+1 as a byte. Renderer adds0xff and indexes bank1,
    # resolving to bank2[tile], NOT bank1[tile]. This is the divergent owner.
    write(polygon + 0x44, 'BB', 93, 32)
    for offset, x, y in [(6, 100, 100), (26, 200, 100), (46, 100, 200)]:
        write(polygon + offset, 'ffIII', x, y, 0, 0, 16)
    sequence = []
    for visit in range(19):
        if visit:
            call(0x44fbd0)
        before = len(textures)
        call(0x4673b0)
        assert len(textures) == before + 1 and len(triangles) == visit + 1
        selected = (textures[-1] - 0x3200000) // 16
        assert selected == fire['frames'][visit % 9], (visit, selected)
        assert all(color == 0xffffffff for color in triangles[-1])
        sequence.append(dict(visit=visit, counter=read(0x5a9f20 + 20 + 18, 'B'), selectedTile=selected))
    # No lifetime/occupancy/RNG input is supplied to the global ANIBL updater.
    # Flags are recorded as a discriminant; global pause policy is not changed.
    for land_flags in (0, 2):
        write(0x89c661, 'I', land_flags)
        before = read(0x5a9f20 + 20 + 18, 'B')
        call(0x44fbd0)
        assert read(0x5a9f20 + 20 + 18, 'B') == (before + 1) % 9

    js = """import {missionData,missionNumbers,tutorialLevel} from './app/mission-data.ts';
import {createWorld} from './app/world-initialization.ts';
import {buildingSocketPoint} from './app/building-shapes.ts';
import {modelStage} from './app/model-faces.ts';
import models from './app/original-models.json' with {type:'json'};
let s='';for await(const c of process.stdin)s+=c;const cases=JSON.parse(s);
const authored=[];for(const mission of [...missionNumbers,tutorialLevel]){const level=missionData(mission).level;
const source=level.objects.flatMap((o,index)=>o.type===2&&o.model===5?[{index,...o}]:[]);
if(source.length)authored.push({mission,source,current:createWorld(mission).buildings.filter(b=>b.kind==='temple').map(b=>({id:b.id,team:b.team,object:b.object,x:b.x,z:b.z,progress:b.progress}))});}
console.log(JSON.stringify({authored,sockets:cases.map(c=>buildingSocketPoint({object:c.model,angle:c.quadrant*512,anchorX:65024,anchorY:512},c.slot)),geometry:Object.fromEntries([95,96,97,98].map(id=>[id,[0,1,2,3,4].map(stage=>({stage,vertices:modelStage(models[id],stage).p.length/3}))]))}));"""
    current = json.loads(subprocess.check_output(['node', '--input-type=module', '-e', js], cwd=ROOT,
        input=json.dumps(sockets).encode()))
    assert current['sockets'] == [{k: row[k] for k in ('x', 'y', 'heightOffset')} for row in sockets]
    report = dict(status='PASS', executable=identity, inputHashes={name: sha(data) for name, data in raw.items()},
        models=model_rows, descriptor={'buildingModel': 5, 'baseObject': 95, 'flags': 0x489f,
            'rawHex': descriptor.hex(), 'panelSocketIndex': descriptor[51]}, selection=selection,
        sockets=sockets, atlasTiles=tile_hashes, nativeMaterialVisits=sequence,
        updaterPauseFlagCases=2, triangleMode32Diffuse='0xffffffff', current=current,
        ownerBoundary='scene-assets.nativeModel/modelStage sample static atlas tile92; native material lookup consumes global ANIBL dynamic bank.',
        limits=['No original Windows or GPU/cache/blend execution; supplied terrain height240 and texture handles/cache placement/triangle sink.',
                'Per-updater-visit cadence only; no universal native wall-clock/FPS claim.',
                'Embedded four flame patches are not a separately allocated class7 effect, person or socket sprite.',
                'A distinct user-reported apex sprite is not identified by this probe; a reproducible original scene/frame is still needed.'])
    args.output.parent.mkdir(parents=True, exist_ok=True)
    args.output.write_text(json.dumps(report, indent=2) + '\n')
    print(json.dumps({'status':report['status'],'models':len(model_rows),'socketCases':len(sockets),
        'materialVisits':len(sequence),'animationTiles':fire['frames'],'authoredMissions':len(current['authored']),
        'output':str(args.output),'limits':report['limits']}, indent=2))


if __name__ == '__main__':
    main()
