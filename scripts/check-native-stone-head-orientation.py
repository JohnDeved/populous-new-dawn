#!/usr/bin/env python3
"""Check original Stone Head record headings, selector preservation and live draws.

python -B scripts/check-native-stone-head-orientation.py GAME_ROOT --output NEW_JSON
Add --live-models CAPTURE_JSON for the focused headless orientation capture.
Use the canonical queue. Original post-processing/render bodies are not intercepted.
"""
import argparse
from datetime import datetime, timezone
import hashlib
import json
from pathlib import Path
import struct
import subprocess

from unicorn.x86_const import UC_X86_REG_ESP, UC_X86_REG_EIP, UC_X86_REG_FPCW
from decomp import native_cpu

ROOT = Path(__file__).resolve().parents[1]
LEVEL_HASHES = {
    1: '97cdb6e170f68b462b5b36c42c99a598b0466e0131a105f30612f50d7f16e40c',
    3: 'eb239eabebbcde37c1e1633b149d48977cedf432348a12fc5ee6b4be74c049bf',
    5: 'fce3c6555933d9e6d04490739a90f0cd188bc561a977c0c28e04aa265955f90b',
    22: '97fcbf41e1f13d53491fdbfbe8b5950fd94f3301c51c6f61b4725eb0aab30321',
}
# Mission, trigger index, decorative index, proved heading and selected model.
CASES = [(1,30,32,0,45),(1,28,33,0,45),(3,101,102,1536,149),
         (5,116,117,1024,45),(5,113,114,1536,149),(22,141,142,0,8)]
sha = lambda data: hashlib.sha256(data).hexdigest()


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('data_root', type=Path)
    parser.add_argument('--output', type=Path, required=True)
    parser.add_argument('--live-models', type=Path)
    args = parser.parse_args()
    if args.output.exists():
        raise ValueError('Preserve prior evidence; output exists')
    levels, inputs = {}, {}
    for mission, expected in LEVEL_HASHES.items():
        name = f'levels/levl{2000+mission}.dat'
        raw = (args.data_root/name).read_bytes()
        assert sha(raw) == expected, name
        levels[mission] = raw
        inputs[name] = dict(sha256=expected, size=len(raw))
    def record(mission, index):
        start = 0x14043 + index * 55
        return levels[mission][start:start+55]

    cpu, identity = native_cpu(args.data_root/'d3dpoptb.exe')
    cpu.mem_map(0x2000000, 0x1000000)
    stone, trigger, source = 0x2000000, 0x2000200, 0x2000400
    objects, faces, points = 0x2010000, 0x2020000, 0x2200000
    camera, ui, pool, stack, stop = 0x2300000, 0x2310000, 0x2400000, 0x2ffd000, 0x2ffe000
    cpu.reg_write(UC_X86_REG_FPCW, 0x27f)
    def write(address, fmt, *values):
        cpu.mem_write(address, struct.pack('<'+fmt, *values))
    def read(address, fmt='I'):
        return struct.unpack('<'+fmt, cpu.mem_read(address, struct.calcsize('<'+fmt)))[0]
    def call(address, *values):
        write(stack, 'I'*(len(values)+1), stop, *values)
        cpu.reg_write(UC_X86_REG_ESP, stack)
        cpu.emu_start(address, stop, count=2000000)
        assert cpu.reg_read(UC_X86_REG_EIP) == stop, hex(address)

    provenance = json.loads((ROOT/'public/original/provenance.json').read_text())['sha256']
    for name, address in [('objs',objects),('facs',faces),('pnts',points)]:
        path = f'objects/{name}0-2.dat'; raw = (args.data_root/path).read_bytes()
        assert sha(raw) == provenance[path], path
        inputs[path] = dict(sha256=sha(raw), size=len(raw)); cpu.mem_write(address,raw)
        if name == 'objs':
            for index in range(len(raw)//54):
                for offset,stride,base in [(16,60,faces),(20,60,faces),(24,6,points),(28,6,points)]:
                    n = read(objects+index*54+offset)
                    write(objects+index*54+offset,'I',base+(n-1)*stride if n else 0)
    write(0x895ec1,'I',objects); write(0x895ec5,'I',faces)
    morph = (args.data_root/'objects/morph0-2.dat').read_bytes()
    assert sha(morph) == '1939b4d30839f2ab49ea110abb29d40eb001d6cc6fa4932be72ce44c3aebf066'
    cpu.mem_write(0x87cc08,morph); call(0x40ce30)

    def load_stone(raw):
        assert raw[:2] == bytes([9,5])
        cpu.mem_write(stone,bytes(256)); cpu.mem_write(source,raw)
        write(stone+0x2a,'BB',5,9); write(stone+0x26,'H',0xdead)
        write(stone+0x3d,'HH',*struct.unpack_from('<HH',raw,3))
        call(0x485b00,stone,source)
        return read(stone+0x26,'H')

    rows = []
    for mission, trigger_index, scenery_index, expected, model in CASES:
        raw = record(mission,scenery_index); controller = record(mission,trigger_index)
        actual = load_stone(raw)
        assert actual == expected == struct.unpack_from('<H',raw,10)[0]
        cpu.mem_write(trigger,bytes(256)); cpu.mem_write(source,controller)
        write(trigger+0x2a,'BB',6,6)
        call(0x485b00,trigger,source)
        # Family flags are isolated selected inputs; PR63 already executes the
        # full reward-link flag producer. This test verifies heading preservation.
        if model == 45: write(trigger+0x6d,'B',read(trigger+0x6d,'B')|0x20)
        call(0x4fbd20,trigger,stone,0,1)
        assert read(stone+0x33,'H') == model
        assert read(stone+0x26,'H') == actual
        rows.append(dict(mission=mission,triggerIndex=trigger_index,sceneryIndex=scenery_index,
                         sourceBytes=raw[:16].hex(),nativeHeading=actual,selectedModel=model,
                         currentTriggerHeading=struct.unpack_from('<i',controller,7)[0]&2047,
                         incorrectlyImportedSceneryAngle=struct.unpack_from('<i',raw,7)[0],
                         selectorPreservesHeading=True))
    synthetic = []
    for heading in [0,1,255,256,257,512,1024,1536,2047,65535]:
        raw = bytearray(record(1,32)); struct.pack_into('<H',raw,10,heading)
        assert load_stone(bytes(raw)) == heading
        synthetic.append(dict(sourceHeading=heading,loadedWord=read(stone+0x26,'H'),angleTableIndex=heading&2047))

    count = triangles = 0
    if args.live_models:
        frames = json.loads(args.live_models.read_text()); assert frames
        write(0x74a350,'I',camera); write(0xafc2f4,'I',ui)
        write(0x75d504,'I',pool+0x100000); call(0x401040)
        for frame in frames:
            v=frame['projection']
            write(camera+0x24,'HH',frame['center']['x'],frame['center']['y'])
            write(camera+0x2a,'i',v['scale']);write(0x74a354,'9i',*v['matrix'])
            for address,key in [(0x87ca5c,'curvature'),(0x87ca64,'depth'),(0x87ca68,'perspective')]:write(address,'i',v[key])
            write(0x87ca90,'hh',v['width'],v['height']);write(0x87caa4,'hh',v['centerX'],v['centerY'])
            write(ui+0xcf8,'ii',v['fractionX'],v['fractionY']);write(ui+0xd00,'ff',v['pixelScaleX'],v['pixelScaleY'])
            for model in frame['models']:
                raw=record(frame['mission'],model['sceneryIndex'])
                heading=load_stone(raw)
                assert model['heading'] == heading & 2047, 'Browser must use actual original scenery, not its own arbitrary heading'
                assert model['id']==45, 'Live slice is original45; mode3 preserved by selector proof only'
                write(stone+0x24,'H',1)
                write(stone+0x33,'HH',45,0x280);write(stone+0x3a,'BB',4,1)
                write(stone+0x37,'H',model['stoneFrame']*4)
                call(0x40c9f0,stone)
                write(stone+0x3d,'HHh',*model['position'])
                write(stone+0x68,'ihh',model['size'],model['tilt'],model['roll'])
                write(0x75d508,'I',pool);cpu.mem_write(0x75d50c,bytes(3585*4));call(0x4708d0,stone)
                buckets={}
                for bucket in range(3585):
                    p=read(0x75d50c+bucket*4)
                    while p:buckets[p]=bucket;p=read(p+2)
                actual,picking,p=[],[],pool
                while p<read(0x75d508):
                    kind=read(p,'B')
                    if kind==21:
                        x,y,right,bottom=struct.unpack('<hhhh',cpu.mem_read(p+10,8))
                        picking.append(dict(kind='bounds',bounds=dict(x=x,y=y,width=right-x,height=bottom-y),bucket=buckets[p]));p+=18;continue
                    screen=[n for off in [6,26,46]for n in struct.unpack('<ff',cpu.mem_read(p+off,8))]
                    if kind==6:picking.append(dict(kind='model',points=[dict(x=screen[i],y=screen[i+1])for i in (0,2,4)],bucket=buckets[p]))
                    if read(p+0x45,'B'):actual.append(dict(screen=screen,shade=read(p+22),bucket=buckets[p]))
                    p+=70
                assert picking==model['picking'],('picking',frame['mission'],model['sceneryIndex'],frame['bearing'])
                assert actual==model['triangles'],('model',frame['mission'],model['sceneryIndex'],frame['bearing'],actual[:2],model['triangles'][:2])
                count+=1;triangles+=len(actual)
    report=dict(at=datetime.now(timezone.utc).isoformat(),status='PASS_ORIGINAL_STONE_HEAD_ORIENTATION',
                sourceSHA=sha(Path(__file__).read_bytes()),exeSHA=identity['sha256'],inputs=inputs,
                authoredCases=rows,syntheticRecordCases=synthetic,liveModelCalls=count,liveTriangles=triangles,
                executed=['00485b00','004fbd20','004a66c0','004ee700','0040ce30']+(['0040c9f0','004708d0','00471490']if args.live_models else []),
                intercepted=[],supplied=['Canonical object buffers relocated into test memory','Explicit selected trigger flags for45cases; mode3 comes from actual trigger record','Ten labelled source-word boundary fixtures','Optional actual browser camera/poses'],
                limits='No complete loading lifecycle, user input/focus changes, model8rendering acceptance, global angle offset or GPU/native wallclock claim. The source heading is checked before any paired render comparison.')
    args.output.parent.mkdir(parents=True,exist_ok=True)
    with args.output.open('x')as stream:json.dump(report,stream,indent=2);stream.write('\n')
    print(json.dumps({k:v for k,v in report.items()if k not in ('inputs','syntheticRecordCases')},indent=2))


if __name__=='__main__':main()
