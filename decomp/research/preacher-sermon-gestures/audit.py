"""Static Preacher sermon audit; never executes original code or the application.

Usage: python -B audit.py GAME_ROOT
Reads the three named Git heads, verified PE/ANI/HSPR inputs and indexed exports.
Writes JSON only to stdout. Includes static x86 disassembly, not emulation.
"""
import hashlib
import json
from pathlib import Path
import struct
import subprocess
import sys

from capstone import Cs, CS_ARCH_X86, CS_MODE_32, __version__ as capstone_version

ROOT = Path(__file__).resolve().parents[3]
GAME = Path(sys.argv[1])
HEADS = {
    'main': '89e68606a406f93715b930550317519818ddc081',
    'restingArtwork': 'b0208188b8de345a6ad5e86cb7c49769624dda86',
    'acceptedFiring': '604506b19d79fdcaefa771f8e027ad206dfc2cc7',
}
EXE_SHA = '3a5065c7420b3fcde208bf220bc86dfbac95e025ab2492caf9c7ea5308dfbe4f'
sha = lambda b: hashlib.sha256(b).hexdigest()
report = {
    'status': 'passed', 'scope': __doc__, 'python': sys.version,
    'capstone': capstone_version, 'heads': HEADS, 'inputs': {},
    'sourceComparison': {}, 'indexedExports': {}, 'objects': [],
    'originalInstructions': {}, 'nativeExecution': 'not-run',
    'browserExecution': 'not-run', 'actualGestureWitness': 'not-established',
}


def git_bytes(head, path):
    return subprocess.check_output(['git', 'show', head + ':' + path], cwd=ROOT)


def source(path):
    data = (ROOT / path).read_bytes()
    assert data == git_bytes(HEADS['main'], path), 'Application drift: ' + path
    return data


paths = [
    'app/preacher-conversion.ts', 'app/animation.ts', 'app/live-people.ts',
    'app/live-movement.ts', 'app/person-idle.ts', 'app/person-update.ts',
    'app/selection-runtime.ts', 'app/scene-entities.ts', 'app/original-rules.json',
    'app/original-units.json', 'app/sprite-layers.ts', 'app/game-clock.ts',
    'app/world-turn.ts', 'app/person-order-update.ts', 'app/person-order-start.ts',
    'app/native-math.ts', 'app/person-state.ts', 'app/person-worship.ts',
    'scripts/mission3-natural-preacher-scenario.mjs',
    'tests/preacher-conversion.test.mjs', 'public/original/provenance.json',
]
for path in paths:
    source(path)
    hashes = {label: sha(git_bytes(head, path)) for label, head in HEADS.items()}
    report['sourceComparison'][path] = {'sha256': hashes, 'identical': len(set(hashes.values())) == 1}

rules = json.loads(source('app/original-rules.json'))
units = {label: json.loads(git_bytes(head, 'app/original-units.json'))
         for label, head in HEADS.items()}
provenance = json.loads(source('public/original/provenance.json'))
exports = json.loads((ROOT / 'decomp/exports.json').read_text())
export_hashes = next(v for v in exports.values() if isinstance(v, dict) and '0043a4d0.c' in v)
for name in ['0043a4d0.c', '00432590.c', '004d32b0.c', '004d6f90.c',
             '004d4040.c', '004ee700.c', '004ee7b0.c', '004ed700.c',
             '004673b0.c', '0045f9d0.c', '0048a050.c', '0042c320.c',
             '0043bcc0.c', '004d83b0.c', '004d42a0.c', '0046ec80.c',
             '004ec6f0.c', '005178d0.c', '00518070.c']:
    digest = sha(source('decomp/generated/' + name))
    assert digest == export_hashes[name], 'Unindexed export: ' + name
    report['indexedExports'][name] = digest


def original(path):
    data = (GAME / path).read_bytes()
    digest = sha(data)
    expected = EXE_SHA if path == 'd3dpoptb.exe' else provenance['sha256'][path]
    assert digest == expected, 'Original input mismatch: ' + path
    report['inputs'][path] = {'sha256': digest, 'bytes': len(data)}
    return data


exe = original('d3dpoptb.exe')
pe = struct.unpack_from('<I', exe, 60)[0]
assert exe[pe:pe+4] == b'PE\0\0'
assert struct.unpack_from('<H', exe, pe+24)[0] == 0x10b
sections = struct.unpack_from('<H', exe, pe+6)[0]
optional = struct.unpack_from('<H', exe, pe+20)[0]
imagebase = struct.unpack_from('<I', exe, pe+52)[0]


def read_va(address, size):
    for i in range(sections):
        _, _, rva, length, offset = struct.unpack_from('<8sIIII', exe, pe+24+optional+i*40)
        start = imagebase+rva
        if start <= address and address+size <= start+length:
            return exe[offset+address-start:offset+address-start+size]
    raise ValueError(hex(address))


assert rules['personModels'][4]['nextState'] == 10
assert rules['personModels'][4]['idleState'] == 17
# The generic preparation status-byte decrement is a different model flag.
assert not rules['personModels'][4]['flags'] & 64
report['preacherModel'] = rules['personModels'][4]
report['nativeSermonJumpTable'] = [f'{x:08x}' for x in struct.unpack('<5I', read_va(0x43abd8, 20))]

starts = list(struct.iter_unpack('<HH', original('data/vstart-0.ani')))
frames = list(struct.iter_unpack('<HBBBBH', original('data/vfra-0.ani')))
elements = list(struct.iter_unpack('<HhhHH', original('data/vele-0.ani')))
hspr = original('data/hspr0-0.dat')
original('data/pal0-c.dat')


def chain(start):
    first, mirror = starts[start]
    frame, out = first, []
    while frame and frame not in out:
        assert frame < len(frames)
        out.append(frame)
        frame = frames[frame][-1]
    assert frame in (0, first)
    return out, mirror


def layers(frame):
    element, seen, out = frames[frame][0], set(), []
    while element:
        assert element < len(elements) and element not in seen
        seen.add(element)
        pos, x, y, flags, element = elements[element]
        assert pos > 0 and pos % 6 == 0
        piece = pos // 6 - 1
        width, height = struct.unpack_from('<HH', hspr, 8+piece*8)
        out.append({'piece': piece, 'x': x, 'y': y, 'flags': flags, 'w': width, 'h': height})
    return out


def selected(raw, tribe, descriptor):
    out = []
    for layer in raw:
        type_ = (layer['flags'] >> 4) & 31
        choice = layer['flags'] >> 9
        if type_ and not (choice == tribe if type_ == 1 else
                          type_ == descriptor['person'] and choice == descriptor['variant']):
            continue
        out.append(layer)
    return out


all_gesture_frames, all_gesture_pieces = set(), set()
for obj, expected_source, expected_draw in [(95,160,19), (97,168,14), (98,176,14), (99,184,14)]:
    address = 0x5a6858+obj*4
    raw = read_va(address, 4)
    start, draw = struct.unpack('<hh', raw)
    assert (start,draw) == (expected_source,expected_draw)
    assert rules['animationObjects'][obj] == [start,draw]
    descriptor_address = 0x5a6af8+draw*11
    descriptor_raw = read_va(descriptor_address,11)
    descriptor = {'hold':struct.unpack_from('<b',descriptor_raw,1)[0],
                  'step':struct.unpack_from('<b',descriptor_raw,3)[0], 'mode':descriptor_raw[4],
                  'person':descriptor_raw[5], 'variant':descriptor_raw[6],
                  'palette':descriptor_raw[7], 'reset':descriptor_raw[8],
                  'flags':struct.unpack_from('<H',descriptor_raw,9)[0]}
    assert rules['animationDescriptors'][draw] == descriptor
    selector=read_va(0x46f068+descriptor_raw[0]-1,1)[0]
    target=struct.unpack('<I',read_va(0x46f03c+selector*4,4))[0]
    assert target==0x46ef12 and read_va(target,7).hex()=='c605e6ca87000d'
    directions=[{'source':start+d, 'mirrorReference':chain(start+d)[1], 'frames':chain(start+d)[0]}
                for d in range(8)]
    frame_ids={f for d in directions for f in d['frames']}
    piece_ids={p['piece'] for f in frame_ids for p in layers(f)}
    coverage={}
    for label,u in units.items():
        assert u['frameCounts'][start] == len(chain(start)[0])
        matches={team:[name for name,seq in u['animations'][team+'-preacher'].items()
                       if seq[0]['source']==start] for team in ['blue','red']}
        fs={f['source'] for f in u['frames']};ps={p['source'] for p in u['pieces']}
        coverage[label]={'names':matches,'missingFrames':sorted(frame_ids-fs),
                         'missingPieces':sorted(piece_ids-ps)}
        if obj in (98,99):
            assert not any(matches.values()) and frame_ids.isdisjoint(fs)
        else:
            assert all(matches.values()) and not frame_ids-fs
            for team,names in matches.items():
                seq=u['animations'][team+'-preacher'][names[0]]
                for d, expected in zip(seq,directions):
                    assert d['source']==expected['source'] and d['flip']==bool(expected['mirrorReference'])
                    assert [u['frames'][f]['source'] for f in d['frames']]==expected['frames']
    visibility=[]
    for tribe in range(4):
        visible=[len([p for p in selected(layers(f),tribe,descriptor) if p['w']>0 and p['h']>0])
                 for f in sorted(frame_ids)]
        assert min(visible)>0
        visibility.append({'tribe':tribe,'minNonzeroDimensionLayers':min(visible),
                           'maxNonzeroDimensionLayers':max(visible)})
    report['objects'].append({'id':obj,'address':f'{address:08x}','bytes':raw.hex(),
        'source':start,'draw':draw,'descriptor':descriptor,'descriptorBytes':descriptor_raw.hex(),
        'descriptorAddress':f'{descriptor_address:08x}','descriptorType':descriptor_raw[0],
        'renderPrimitive':13,'directions':directions,'distinctFrames':len(frame_ids),
        'distinctPieces':len(piece_ids),'coverage':coverage,
        'ordinaryVisibleLayerDimensions':visibility,
        'visibilityLimit':'Static nonempty selected layers/dimensions; no pixels decoded or scene rendered.'})
    if obj in (98,99):
        all_gesture_frames.update(frame_ids);all_gesture_pieces.update(piece_ids)
report['combinedGestureGap']={label:{'frames':len(all_gesture_frames),
    'missingFrames':len(all_gesture_frames-{f['source'] for f in u['frames']}),
    'pieces':len(all_gesture_pieces),
    'missingPieces':sorted(all_gesture_pieces-{p['source'] for p in u['pieces']})}
    for label,u in units.items()}
# Preacher metadata remains byte-for-byte semantically unchanged through the asset appends.
preacher_meta = lambda u: {team:u['animations'][team+'-preacher'] for team in ['blue','red']}
assert preacher_meta(units['main']) == preacher_meta(units['restingArtwork']) == preacher_meta(units['acceptedFiring'])
report['preacherMetadataIdenticalAcrossHeads']=True

cs=Cs(CS_ARCH_X86,CS_MODE_32)
for label,start,end in [
    ('site-eligibility',0x43a310,0x43a4cf),
    ('sermon',0x43a4d0,0x43abd7), ('acquisition',0x43abf0,0x43aeb8),
    ('idle-order-producer',0x4deff0,0x4df0e0),
    ('person-frame-lookup',0x468c37,0x468d86),
]:
    raw=read_va(start,end-start);decoded=list(cs.disasm(raw,start))
    assert decoded[-1].address+decoded[-1].size==end
    report['originalInstructions'][label]={'start':f'{start:08x}','endExclusive':f'{end:08x}',
        'sha256':sha(raw),'rows':[{'address':f'{i.address:08x}','bytes':i.bytes.hex(),
                                 'mnemonic':i.mnemonic,'operands':i.op_str} for i in decoded]}
for address,expected in [
    (0x43a81a,'a172bc8900'),(0x43a91d,'8b0d78d18900'),
    (0x43a86f,'e8cc970900'),(0x43a8df,'e85c970900'),
    (0x43a7f7,'663d4803'),(0x43a8e7,'f686b200000002'),
]:
    assert read_va(address,len(bytes.fromhex(expected))).hex()==expected
report['seedExamples'] = []
for seed in range(8):
    n=(seed*0x24a1+0x24df)&0xffffffff
    after=((n>>13)|(n<<19))&0xffffffff
    residue=after&3
    report['seedExamples'].append({'before':seed,'after':after,'residue':residue,
        'gestureObject':(99 if residue==0 else 98) if residue<2 else None,
        'claim':'Arithmetic illustration only, not native execution or live RNG state.'})
print(json.dumps(report,indent=2))
