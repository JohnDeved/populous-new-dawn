"""Read-only DATA/source audit for issue 23. Never loads or executes native code.

Prints derived JSON to stdout; caller owns redirecting it to a research receipt.
Uses only Python's standard library. Does not import game/extractor/native helpers.
"""
import argparse
import hashlib
import json
from pathlib import Path
import struct
import zipfile

BASE = '9751eee28bd6f43cac3a84eda350eac71f5a4e8a'
EXPECTED = {
    'd3dpoptb.exe': '3a5065c7420b3fcde208bf220bc86dfbac95e025ab2492caf9c7ea5308dfbe4f',
    'objects/objs0-2.dat': 'e1af6bdf050608d7c1832700826bece72ca592abdff3ee9c2138c50ed8a8607d',
    'objects/facs0-2.dat': '01a9a6d02efa0d35f7026cd97f8e01f72cbfb72e94217efe8256e8fe43597e9a',
    'objects/pnts0-2.dat': '09ebbdc9496d2ebd3a932be96af3fd27e6701a41105a5154aec4abe39e50b911',
}


def digest(data):
    return hashlib.sha256(data).hexdigest()


def truncdiv(a, b):
    return abs(a) // abs(b) * (1 if a * b >= 0 else -1)


parser = argparse.ArgumentParser(description=__doc__)
parser.add_argument('--canonical-root', type=Path, required=True)
parser.add_argument('--data-root', type=Path, required=True)
parser.add_argument('--archive', type=Path, required=True)
parser.add_argument('--repo', type=Path, default=Path(__file__).resolve().parents[3])
args = parser.parse_args()
raw, inputs = {}, {}
for name, expected in EXPECTED.items():
    root = args.data_root if name in ('objects/facs0-2.dat', 'objects/pnts0-2.dat') else args.canonical_root
    data = (root / name).read_bytes()
    assert digest(data) == expected, name
    raw[name] = data
    inputs[name] = {'bytes': len(data), 'sha256': digest(data)}

archive = args.archive.read_bytes()
assert len(archive) == 322676040
assert digest(archive) == '6aa6c366809ea1d9575ec1d31a24527a95c7332f0a1d2ab692f7a602e7e10702'
with zipfile.ZipFile(args.archive) as zipped:
    member = 'Populous The Beginning [Setup]/Setup_Populous_The_Beginning.exe'
    installer = zipped.read(member)
archive_identity = {
    'sha256': digest(archive), 'bytes': len(archive), 'installerMember': member,
    'installerBytes': len(installer), 'installerSha256': digest(installer),
    'dataMembers': ['data/{app}/objects/facs0-2.dat', 'data/{app}/objects/pnts0-2.dat'],
    'component': 'Component0',
}

exe = raw['d3dpoptb.exe']
pe = struct.unpack_from('<I', exe, 60)[0]
section_start = pe + 24 + struct.unpack_from('<H', exe, pe + 20)[0]
sections = [struct.unpack_from('<8sIIII', exe, section_start + i * 40)
            for i in range(struct.unpack_from('<H', exe, pe + 6)[0])]


def source_bytes(address, size):
    rva = address - 0x400000
    for _, _, va, length, offset in sections:
        if va <= rva and rva + size <= va + length:
            return exe[offset + rva - va:offset + rva - va + size]
    raise ValueError(f'Unmapped source address {address:#x}')


def read(address, fmt):
    return struct.unpack(fmt, source_bytes(address, struct.calcsize(fmt)))


models = json.loads((args.repo / 'app/original-models.json').read_text())
rules = json.loads((args.repo / 'app/original-rules.json').read_text())
assert rules['sine'] == list(read(0x5ddde8, '<2048i'))
assert rules['atan'] == list(read(0x5861b4, '<257h'))
objects, faces, points = (raw['objects/' + name + '0-2.dat'] for name in ('objs', 'facs', 'pnts'))
geometry = []
for building, model in ((7, 103), (5, 95)):
    descriptor = 0x5a7228 + building * 76
    assert read(descriptor, '<H')[0] == model
    _, count, point_count, _, _, _, scale, first_face, _, first_point, _, *_ = struct.unpack_from(
        '<Hhhbbii4I6h4b3h', objects, model * 54)
    decoded = {key: [] for key in ('p', 'uv', 'faces', 'tiles', 'modes')}
    for index in range(first_face - 1, first_face + count - 1):
        record = index * 60
        corners = faces[record + 6]
        assert corners in (3, 4)
        tile = struct.unpack_from('<h', faces, record + 2)[0]
        indices = struct.unpack_from('<4h', faces, record + 40)
        texcoords = struct.unpack_from('<8i', faces, record + 8)
        decoded['faces'].extend((corners, faces[record + 59]))
        decoded['tiles'].append(tile)
        decoded['modes'].append(faces[record + 7])
        for corner in ((0, 1, 2) if corners == 3 else (0, 1, 2, 0, 2, 3)):
            x, y, z = struct.unpack_from('<3h', points, (first_point + indices[corner] - 1) * 6)
            decoded['p'].extend(round(value / (scale * 3), 6) for value in (x, y, -z))
            decoded['uv'].extend((
                round((tile % 8 + texcoords[corner * 2] / 0x200000) / 8, 7),
                round(1 - (tile // 8 + texcoords[corner * 2 + 1] / 0x200000) / 32, 7)))
    checks = {key: models[str(model)][key] == value for key, value in decoded.items()}
    assert all(checks.values()), (model, checks)
    geometry.append({
        'buildingModel': building, 'descriptor': f'{descriptor:08x}', 'geometry': model,
        'faces': count, 'points': point_count, 'firstFaceOneBased': first_face,
        'firstPointOneBased': first_point, 'scale': scale,
        'hfx': read(descriptor + 10, '<H')[0], 'hudControl': read(descriptor + 14, '<h')[0],
        'browserMatches': checks, 'cosmeticInitializerDraws': count * 4,
    })

# Data fields and arithmetic of 0044c650 / 0044ca80 / 0044bc10 / 004819c0.
# These are conditional static references for a normally constructed panel;
# this does not execute panel allocation, activation or its update callbacks.
panel = 0x5cd13a
assert read(panel, '<I')[0] == 3
origin_x, origin_y = read(panel + 14, '<2i')
hud = []
for building, child in ((7, 0x5cc4dc), (5, 0x5cc51e)):
    control, kind = read(child, '<2i')
    assert kind == 1 and read(child + 55, '<I')[0] == building
    x, y, _, _, width, height = read(child + 25, '<6h')
    fixed = (truncdiv(origin_x << 16, 640) + truncdiv(x << 16, 640),
             truncdiv(origin_y << 16, 480) + truncdiv(y << 16, 480),
             truncdiv(width << 16, 640), truncdiv(height << 16, 480))
    cases = []
    for viewport_width, viewport_height in ((640, 480), (1280, 960)):
        fx, fy, fw, fh = fixed
        rect = (truncdiv(fx * viewport_width, 65536),
                truncdiv(fy * viewport_height + truncdiv(viewport_height, 2), 65536),
                truncdiv((fx + fw) * viewport_width, 65536),
                truncdiv((fy + fh) * viewport_height + truncdiv(viewport_height, 2), 65536))
        target = (rect[0] + truncdiv(rect[2] - rect[0], 2),
                  rect[1] + truncdiv(rect[3] - rect[1], 2))
        cases.append({'viewport': [viewport_width, viewport_height], 'rect': rect, 'target': target})
    hud.append({'buildingModel': building, 'control': control, 'definition': f'{child:08x}',
                'fixedFields': fixed, 'cases': cases})

ranges = {
    'buildingInitializer': (0x4819c0, 0x481d99),
    'buildingController': (0x4839f0, 0x48418d),
    'wholeGeometry': (0x472da0, 0x473205),
    'perFaceGeometry': (0x473210, 0x473c8f),
    'hudRectangle': (0x44bc10, 0x44bd74),
    'hudChildConstructor': (0x44ca80, 0x44cc3e),
    'companionInitializer': (0x481490, 0x481541),
    'matrixProduct': (0x47f7b0, 0x47f927),
    'matrixRotations': (0x47f930, 0x47fe83),
    'floatToInteger': (0x55bc54, 0x55bc7b),
}
sources = {name: {'start': f'{start:08x}', 'endExclusive': f'{end:08x}',
                  'sha256': digest(source_bytes(start, end - start))}
           for name, (start, end) in ranges.items()}
source_paths = ['app/original-models.json', 'app/original-rules.json', 'app/world-turn.ts', 'app/world-effects.ts',
                'app/page.tsx', 'app/model-faces.ts', 'app/scene-worship-acquisition.ts',
                'app/worship-acquisition.ts', 'scripts/import-original.py',
                'scripts/extract-reference.py', 'scripts/probe-native-vault-knowledge.py',
                'decomp/generated/00480ea0.c']
print(json.dumps({
    'status': 'passed', 'kind': 'static-data-and-source-reference', 'applicationBase': BASE,
    'nativeExecution': False, 'completeControllerComparison': False,
    'scriptSha256': digest(Path(__file__).read_bytes()), 'archive': archive_identity,
    'inputs': inputs, 'sourceRanges': sources,
    'repoSources': {name: digest((args.repo / name).read_bytes()) for name in source_paths},
    'geometry': geometry, 'hudReferences': hud,
    'mathData': {'sineMatches': True, 'atanMatches': True,
                 'projectionX': read(0x58f48c, '<f')[0],
                 'projectionY': read(0x58f490, '<f')[0],
                 'flightFraction': read(0x58f498, '<f')[0]},
}, indent=2))
