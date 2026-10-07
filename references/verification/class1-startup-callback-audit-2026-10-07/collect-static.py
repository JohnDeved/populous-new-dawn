"""Read canonical data and PE bytes; never import app code or emulate instructions.

Usage: pinned-venv/python collect-static.py /path/to/game
Outputs adjacent JSON/assembly evidence. Capstone is only a disassembler here.
"""
import collections
import hashlib
import json
import re
import struct
import sys
from pathlib import Path

from capstone import Cs, CS_ARCH_X86, CS_MODE_32

HERE = Path(__file__).resolve().parent
ROOT = HERE.parents[2]
GAME = Path(sys.argv[1])
EXE_SHA = '3a5065c7420b3fcde208bf220bc86dfbac95e025ab2492caf9c7ea5308dfbe4f'
sha = lambda data: hashlib.sha256(data).hexdigest()
raw = (GAME / 'd3dpoptb.exe').read_bytes()
assert sha(raw) == EXE_SHA
pe = struct.unpack_from('<I', raw, 60)[0]
base = struct.unpack_from('<I', raw, pe + 52)[0]
count = struct.unpack_from('<H', raw, pe + 6)[0]
optional = struct.unpack_from('<H', raw, pe + 20)[0]
sections = [struct.unpack_from('<8sIIII', raw, pe + 24 + optional + i * 40)
            for i in range(count)]


def read(address, length):
    for _, _, rva, size, offset in sections:
        if base + rva <= address and address + length <= base + rva + size:
            start = offset + address - base - rva
            return raw[start:start + length]
    raise ValueError(hex(address))


# Reproduce only the existing constant loader's byte overlays, in a Python dict.
# This does not map an emulator or call native/app initialization.
balance = (GAME / 'levels/constant.dat').read_bytes()
decoded = balance
if decoded[:2] == b'@~':
    decoded = b'  ' + bytes((~(v ^ (1 << ((i - 3) & 7)))) & 255
                           for i,v in enumerate(decoded))[2:]
constants = {}
for name,value in re.findall(r'^\s*P3CONST_(\S+)\s*=\s*(-?\d+)', decoded.decode('ascii'), re.M):
    constants.setdefault(name, int(value))
assert constants == json.loads((ROOT / 'app/original-constants.json').read_text())
overlays = {}
for index in range(512):
    descriptor = read(0x5aa5f0 + index * 31, 31)
    name = descriptor[:25].split(b'\0')[0].decode('ascii')
    if not name:
        break
    if name not in constants:
        continue
    size, flags = descriptor[25:27]
    address = int.from_bytes(descriptor[27:], 'little')
    assert size in (1,2,4)
    value = constants[name] * 256 // 100 if flags & 1 else constants[name]
    for i,v in enumerate((value & ((1 << (size*8))-1)).to_bytes(size, 'little')):
        overlays[address+i] = v
scenery = []
for model in (1,2,3,4,5,6,9):
    address = 0x5a79b0 + model * 24
    descriptor = bytes(overlays.get(address+i,v) for i,v in enumerate(read(address,24)))
    scenery.append(dict(model=model, address=f'{address:08x}', bytes=descriptor.hex(),
                        life=int.from_bytes(descriptor[4:6], 'little'), state=descriptor[17],
                        flags1=descriptor[20], flags2=descriptor[21], flags3=descriptor[22]))
assert all(d['life'] == 400 and d['state'] == 1 for d in scenery[:6])
assert scenery[6]['state'] == 10
assert all(not d['flags3'] & 2 for d in scenery)
(HERE / 'selected-descriptors.json').write_text(json.dumps(dict(
    executableSha256=EXE_SHA, constantDatSha256=sha(balance), scenery=scenery), indent=2) + '\n')


levels = []
for mission, word in enumerate(('one', 'two', 'three'), 1):
    data = (GAME / f'levels/levl2{mission:03}.dat').read_bytes()
    header = (GAME / f'levels/levl2{mission:03}.hdr').read_bytes()
    source = ROOT / f'app/level-{word}.ts'
    text = source.read_text().split('export default ', 1)[1].strip().rstrip(';')
    text = re.sub(r'([,{]\s*)([A-Za-z_$][\w$]*)(\s*:)', r'\1"\2"\3', text)
    text = re.sub(r',\s*([}\]])', r'\1', text)
    app = json.loads(text)
    assert app['sourceSha256'] == sha(data) and app['headerSha256'] == sha(header)
    records = [data[0x14043 + i * 55:0x14043 + (i + 1) * 55] for i in range(2000)]
    authored = [(i, r[1], r[0], r[2]) for i, r in enumerate(records) if r[1]]
    assert authored == [(o['index'], o['type'], o['model'], o['owner']) for o in app['objects']]
    def identity(i):
        r = records[i]
        return dict(recordIndex0=i, recordId1=i + 1, classId=r[1], model=r[0], owner=r[2])
    def cell(i):
        x,y = struct.unpack_from('<HH', records[i], 3)
        return x & 0xfe00, y & 0xfe00
    people = []
    for i, r in enumerate(records):
        if r[1] == 1:
            signed_owner = r[2] if r[2] < 128 else r[2] - 256
            assert signed_owner < header[88]
            people.append({**identity(i), 'successfulDirectOrdinal0': len(people)})
    heads = []
    for i, r in enumerate(records):
        if r[1] == 6 and r[0] == 6:
            links = [n for n in struct.unpack_from('<10H', r, 13) if n]
            heads.append({**identity(i), 'mode': r[7],
                          'links': [identity(n - 1) for n in links],
                          'coLocatedScenery9': [identity(j) for j,s in enumerate(records)
                                               if s[1] == 5 and s[0] == 9 and cell(j) == cell(i)]})
    rewards = [{**identity(i), 'rewardClass': r[7], 'rewardModel': r[8],
                'settingByte2': r[9], 'nestedClass6Model10Attempt': r[9] == 1}
               for i, r in enumerate(records) if r[1] == 6 and r[0] == 2]
    groups = collections.Counter((r[1], r[0]) for r in records if r[1])
    levels.append(dict(
        mission=mission, sourceFile=str(source.relative_to(ROOT)), sourceSha256=sha(source.read_bytes()),
        datSha256=sha(data), headerSha256=sha(header), headerTribeCount=header[88],
        landscapeBank=header[96], objectBank=header[97], headerFlags=header[98],
        recordsInFile=2000, nonzeroAuthoredRecords=len(authored),
        ownerFilter='signed int8 owner < uint8 tribeCount; owner255 is -1',
        authoredIdentityOrderMatchesApp=True, people=people, heads=heads, rewards=rewards,
        classModelCounts=[dict(classId=c, model=m, count=n) for (c,m),n in sorted(groups.items())],
        authoredBuildings=[identity(i) for i,r in enumerate(records) if r[1] == 2],
        headPostprocessingOrder=[h['recordId1'] for h in reversed(heads)],
        loaderSkipped=[identity(i) for i,r in enumerate(records) if r[1] == 6 and r[0] == 9],
        explicitClass7Records=[identity(i) for i,r in enumerate(records) if r[1] == 7],
        limits='Static input/branch inventory; successfulDirectOrdinal0 is conditional, not a native return observation.'))
assert [len(x['people']) for x in levels] == [12, 27, 52]
assert all(x['headerFlags'] == 0 for x in levels)
assert all(h['mode'] in (0,4) for x in levels for h in x['heads'])
assert all(l['classId'] in (6,7) for x in levels for h in x['heads'] for l in h['links'])
(HERE / 'authored-callback-inputs.json').write_text(json.dumps(levels, indent=2) + '\n')

# These bounded slices resolve missing/misleading export names and retain actual
# call sites. Ranges end before the following function or are labelled call-site slices.
ranges = [
    ('fresh-header-wrapper',0x42c790,0x42c8e7),
    ('class-seed-reset',0x42bfe7,0x42bffe),
    ('record-and-link-call-sites',0x484edc,0x485122),
    ('class-state-dispatch-call-sites',0x4ed640,0x4ed6c4),
    ('person-model-initializer',0x4d23d0,0x4d2717),
    ('common-person-initializer',0x4d5920,0x4d5b5c),
    ('effect-state-initializer',0x50a740,0x50a741),
    ('nested-building-facade-initializer',0x4fc330,0x4fc56b),
    ('head-appearance-initializer',0x4fbd20,0x4fbf40),
    ('head-animation-leaves',0x40cb90,0x40cc07),
    ('nested-reward-height-helper',0x4fc790,0x4fc849),
    ('script-storage-reset',0x48c620,0x48c64a),
]
assembly = []
range_manifest = []
for label, start, end in ranges:
    data = read(start, end-start)
    range_manifest.append(dict(label=label, start=f'{start:08x}', endExclusive=f'{end:08x}', sha256=sha(data)))
    assembly.append(f'; {label}: [{start:08x},{end:08x}), SHA256 {sha(data)}')
    assembly.extend(f'{i.address:08x} {i.bytes.hex():<24} {i.mnemonic} {i.op_str}'.rstrip()
                    for i in Cs(CS_ARCH_X86, CS_MODE_32).disasm(data, start))
(HERE / 'selected-original.asm').write_text('\n'.join(assembly) + '\n')
(HERE / 'selected-original-ranges.json').write_text(json.dumps(dict(executableSha256=EXE_SHA, ranges=range_manifest), indent=2) + '\n')
print(json.dumps({'mode':'static data and disassembly only',
                  'people':[len(x['people']) for x in levels],
                  'records':[x['nonzeroAuthoredRecords'] for x in levels],
                  'rangeCount':len(ranges)}))
