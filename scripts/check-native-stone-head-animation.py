#!/usr/bin/env python3
"""Compare model45 setters, clock and raw-point morphing with the original EXE.

python -B scripts/check-native-stone-head-animation.py GAME_ROOT --output NEW_JSON
Optional --live-models consumes the focused headless browser's captured submissions.
Run through the shared queue. No callee is intercepted; supplied memory replaces
resource loading, visibility context and object allocation, not the compared bodies.
"""
import argparse
from datetime import datetime, timezone
import hashlib
import importlib.util
import json
from pathlib import Path
import struct
import subprocess

import capstone
from unicorn.x86_const import UC_X86_REG_ESP, UC_X86_REG_EIP, UC_X86_REG_FPCW
from decomp import native_cpu

ROOT = Path(__file__).resolve().parents[1]
sha = lambda b: hashlib.sha256(b).hexdigest()


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('data_root', type=Path)
    parser.add_argument('--output', type=Path, required=True)
    parser.add_argument('--live-models', type=Path)
    args = parser.parse_args()
    if args.output.exists():
        raise ValueError('Preserve prior evidence; use a new report path')
    spec = importlib.util.spec_from_file_location('stone_importer', ROOT / 'scripts/import-stone-heads.py')
    importer = importlib.util.module_from_spec(spec); spec.loader.exec_module(importer)
    data, base_model = importer.decode(args.data_root)
    assert data == json.loads((ROOT / 'app/original-stone-heads.json').read_text())
    assert base_model == json.loads((ROOT / 'app/original-models.json').read_text())['45']
    cpu, identity = native_cpu(args.data_root / 'd3dpoptb.exe')
    cpu.mem_map(0x2000000, 0x1000000)
    trigger, stone, draw_unit = 0x2000000, 0x2000200, 0x2000400
    objects, faces, vertices = 0x2010000, 0x2020000, 0x2200000
    camera, ui, pool, stack, stop = 0x2300000, 0x2310000, 0x2400000, 0x2ffd000, 0x2ffe000
    cpu.reg_write(UC_X86_REG_FPCW, 0x27f)

    def write(address, fmt, *values):
        cpu.mem_write(address, struct.pack('<' + fmt, *values))

    def read(address, fmt):
        return struct.unpack('<' + fmt, cpu.mem_read(address, struct.calcsize('<' + fmt)))[0]

    def call(address, *values):
        write(stack, 'I' * (len(values) + 1), stop, *values)
        cpu.reg_write(UC_X86_REG_ESP, stack)
        cpu.emu_start(address, stop, count=2000000)
        assert cpu.reg_read(UC_X86_REG_EIP) == stop, hex(address)

    for name, address in [('objs', objects), ('facs', faces), ('pnts', vertices)]:
        raw = (args.data_root / f'objects/{name}0-2.dat').read_bytes()
        cpu.mem_write(address, raw)
        if name == 'objs':
            for i in range(len(raw) // 54):
                for offset, stride, pointer in [(16,60,faces),(20,60,faces),(24,6,vertices),(28,6,vertices)]:
                    index = read(objects + i * 54 + offset, 'I')
                    write(objects + i * 54 + offset, 'I', pointer + (index - 1) * stride if index else 0)
    write(0x895ec1, 'I', objects)
    write(0x895ec5, 'I', faces)
    morphs = (args.data_root / 'objects/morph0-2.dat').read_bytes()
    # The original process_morph0 body names this table; do not substitute a
    # synthesized endpoint record for its actual normalization.
    morph_base = 0x87cc08
    assert struct.pack('<I', morph_base) in bytes(cpu.mem_read(0x40ce30, 0x180))
    cpu.mem_write(morph_base, morphs)
    call(0x40ce30)
    assert read(objects + 45 * 54 + 7, 'b') == 1
    assert read(objects + 45 * 54, 'H') & 0x80
    base_points = read(objects + 45 * 54 + 24, 'I')
    cpu.mem_write(trigger, bytes(0x100)); cpu.mem_write(stone, bytes(0x100))
    write(trigger + 0x2a, 'BB', 6, 6)
    write(trigger + 0x68, 'B', 0)
    write(trigger + 0x6d, 'B', 1)
    write(stone + 0x2a, 'BB', 5, 9)
    # Three supplied objects reproduce the authored automatic-gift linkage.
    # Execute the actual post-load walker: it sets0x20 and initializes the stone.
    gift = 0x2000600
    cpu.mem_write(gift, bytes(0x100))
    write(trigger + 4, 'I', gift); write(gift + 4, 'I', stone)
    write(trigger + 0x72, 'H', 30)
    write(gift + 8, 'I', 30); write(gift + 0x24, 'H', 30)
    write(gift + 0x2a, 'BB', 6, 2); write(gift + 0x80, 'B', 3)
    write(0x890324, 'I', trigger)
    call(0x4851e0)
    assert read(trigger + 0x6d, 'B') & 0x20
    write(0x890324, 'I', 0)
    assert read(stone + 0x33, 'H') == 45 and read(stone + 0x3b, 'b') == 1
    assert read(stone + 0x97, 'B') == 2
    original_faces = bytes(cpu.mem_read(faces, len((args.data_root / 'objects/facs0-2.dat').read_bytes())))

    def sample():
        counter = read(stone + 0x37, 'H')
        flags = read(stone + 0x35, 'H')
        frame = read(stone + 0x70, 'B') if flags & 0x400 and not flags & 0x800 else (counter >> 2) % 18
        call(0x40c9f0, stone)
        return dict(f1=counter, renderMode=flags & 0xc00, frame=frame,
                    points=list(struct.unpack('<156h', cpu.mem_read(base_points, 312))))

    rows = [dict(enabled=True, action='initial', **sample())]
    enabled = True
    # Genuine setter transitions, not a different timing model: hold/refill,
    # repeated loops and saved-counter state are observed through the same body.
    for next_enabled, count in [(True,40),(False,13),(True,31),(False,2),(True,20)]:
        for _ in range(count):
            if next_enabled != enabled:
                write(trigger + 0x6d, 'B', 0x20 | int(next_enabled))
                call(0x4fbd20, trigger, stone, 0, int(next_enabled))
                enabled = next_enabled
            call(0x4ee7b0, stone)
            rows.append(dict(enabled=enabled, action='step', **sample()))
    phases = []
    write(stone + 0x35, 'H', read(stone + 0x35, 'H') & ~0xc00)
    for frame in range(18):
        write(stone + 0x37, 'H', frame * 4)
        phases.append(sample())
    assert bytes(cpu.mem_read(faces, len(original_faces))) == original_faces, 'Morph must not overwrite base faces/UVs/normals'
    node = """
import assert from 'node:assert/strict';
import {createStoneHeadAnimation,stepStoneHeadAnimation,stoneHeadFrame,stoneHeadRawPoints,stoneHeadPositions} from './app/stone-head-animation.ts';
import data from './app/original-stone-heads.json' with {type:'json'};
let text='';for await(const chunk of process.stdin)text+=chunk;const input=JSON.parse(text);
const s=createStoneHeadAnimation(true,{triggerIndex:28,sceneryIndex:33});
for(const row of input.rows){if(row.action==='step')stepStoneHeadAnimation(s,row.enabled);
 assert.equal(s.f1&65535,row.f1);assert.equal(s.renderFlags&0xc00,row.renderMode);assert.equal(stoneHeadFrame(s),row.frame);
 assert.deepEqual(stoneHeadRawPoints(row.frame),row.points);}
for(const row of input.phases){assert.deepEqual(stoneHeadRawPoints(row.frame),row.points);
 const p=stoneHeadPositions(row.frame);for(let i=0;i<data.visiblePointIndices.length;i++)for(let a=0;a<3;a++)
 assert.equal(Math.round(p[i*3+a]*450*(a===2?-1:1))||0,row.points[data.visiblePointIndices[i]*3+a]);}
"""
    paired = subprocess.run(['node','--input-type=module','-e',node], cwd=ROOT,
                            input=json.dumps(dict(rows=rows,phases=phases)), capture_output=True, text=True, timeout=15)
    assert paired.returncode == 0, paired.stderr

    # Bind the reward-mode linkage to actual original instruction operands, not
    # the misleading name of an inferred C struct member. settings[2] maps +0x80.
    disassembler = capstone.Cs(capstone.CS_ARCH_X86, capstone.CS_MODE_32)
    link = list(disassembler.disasm(bytes(cpu.mem_read(0x4851e0,0x190)),0x4851e0))
    by_address = {i.address: i for i in link}
    expected_link = {
        0x48525c: ('mov', 'al, byte ptr [edi + 0x80]'),
        0x485262: ('cmp', 'al, 3'),
        0x485266: ('or', 'byte ptr [esi + 0x6d], 0x20'),
    }
    linked_evidence = []
    for address, expected in expected_link.items():
        instruction = by_address[address]
        assert (instruction.mnemonic, instruction.op_str) == expected
        linked_evidence.append(dict(va=f'{address:08x}', bytes=instruction.bytes.hex(), text=instruction.mnemonic+' '+instruction.op_str))

    model_calls, triangles = 0, 0
    if args.live_models:
        frames = json.loads(args.live_models.read_text())
        assert frames
        write(0x74a350, 'I', camera); write(0xafc2f4, 'I', ui)
        write(0x75d504, 'I', pool + 0x100000); call(0x401040)
        for frame in frames:
            v = frame['projection']
            write(camera + 0x24, 'HH', frame['center']['x'], frame['center']['y'])
            write(camera + 0x2a, 'i', v['scale']); write(0x74a354, '9i', *v['matrix'])
            for address, key in [(0x87ca5c,'curvature'),(0x87ca64,'depth'),(0x87ca68,'perspective')]: write(address,'i',v[key])
            write(0x87ca90,'hh',v['width'],v['height']); write(0x87caa4,'hh',v['centerX'],v['centerY'])
            write(ui+0xcf8,'ii',v['fractionX'],v['fractionY']); write(ui+0xd00,'ff',v['pixelScaleX'],v['pixelScaleY'])
            for model in frame['models']:
                assert model['id'] == 45 and 0 <= model['stoneFrame'] < 18
                write(stone+0x37,'H',model['stoneFrame']*4); call(0x40c9f0,stone)
                cpu.mem_write(draw_unit,bytes(256))
                write(draw_unit+0x24,'HH',1,model['heading']); write(draw_unit+0x2a,'B',2)
                write(draw_unit+0x33,'HH',45,0x280)
                write(draw_unit+0x3d,'HHh',*model['position']); write(draw_unit+0x68,'ihh',model['size'],model['tilt'],model['roll'])
                write(0x75d508,'I',pool); cpu.mem_write(0x75d50c,bytes(3585*4)); call(0x4708d0,draw_unit)
                buckets = {}
                for bucket in range(3585):
                    address = read(0x75d50c+bucket*4,'I')
                    while address: buckets[address]=bucket; address=read(address+2,'I')
                actual, picking, address = [], [], pool
                while address < read(0x75d508,'I'):
                    kind = read(address,'B')
                    if kind == 21:
                        x,y,right,bottom=struct.unpack('<hhhh',cpu.mem_read(address+10,8))
                        picking.append(dict(kind='bounds',bounds=dict(x=x,y=y,width=right-x,height=bottom-y),bucket=buckets[address])); address+=18; continue
                    screen=[n for offset in [6,26,46] for n in struct.unpack('<ff',cpu.mem_read(address+offset,8))]
                    if kind == 6: picking.append(dict(kind='model',points=[dict(x=screen[i],y=screen[i+1]) for i in (0,2,4)],bucket=buckets[address]))
                    if read(address+0x45,'B'):
                        assert read(address+22,'I') == read(address+42,'I') == read(address+62,'I')
                        actual.append(dict(screen=screen,shade=read(address+22,'I'),bucket=buckets[address]))
                    address+=70
                assert picking == model['picking'], ('picking', model['stoneFrame'])
                assert actual == model['triangles'], ('triangles',model['stoneFrame'],actual[:2],model['triangles'][:2])
                model_calls+=1; triangles+=len(actual)
    result = dict(at=datetime.now(timezone.utc).isoformat(), status='PASS_ORIGINAL_STONE_HEAD_45',
                  executableSHA=identity['sha256'], sourceSHA=sha(Path(__file__).read_bytes()),
                  helperSHA=sha((ROOT/'app/stone-head-animation.ts').read_bytes()),
                  assetSHA=sha((ROOT/'app/original-stone-heads.json').read_bytes()),
                  transitions=len(rows), phases=len(phases), coordinates=len(phases)*156,
                  fullBaseFaces=len(base_model['faces'])//2, unchangedBaseFacesUVNormals=True,
                  linkFlagEvidence=linked_evidence, rows=rows, phasesResult=phases,
                  liveModelCalls=model_calls, liveTriangles=triangles,
                  executed=['004851e0','0040ce30','004fbd20','004a66c0','004ee700','0040cb90','0040cbf0','004ee7b0','0040cc10','0040c9f0','0040cc60'] + (['004708d0'] if args.live_models else []),
                  supplied=['Verified original bank2resources relocated into test memory','Three-object automatic-gift allocation list, enable transitions and visible-object context','Optional actual browser camera/object poses'],
                  intercepted=[], limits='Original model45 presentation only. No full scene traversal, native wallclock rate, audio193 synchronization, other families or native GPU raster certification.')
    args.output.parent.mkdir(parents=True,exist_ok=True)
    with args.output.open('x') as stream: json.dump(result,stream,indent=2); stream.write('\n')
    print(json.dumps({k:v for k,v in result.items() if k not in ('rows','phasesResult')},indent=2))


if __name__ == '__main__':
    main()
