#!/usr/bin/env python3
"""Validate/append only the static bank-2 Totem base mesh, never its morph keys.

python3 scripts/import-stone-head-149.py GAME_ROOT [--write]

Without --write, require the checked-in mesh/provenance to match the source.
The only generated outputs are app/original-models.json (key149) and
public/original/provenance.json (modelIds149 and staticStoneHead149). Existing
entries and atlas pixels are retained. No executable or full importer is run.
"""
import argparse
import hashlib
import importlib.util
import json
from pathlib import Path
import struct

MODEL = 149
DECODED_SHA = '4500fc0e919cc8362f22900a100918f7aceb4c779212a09f2fb9c6724ee19a53'
ATLAS_SHA = 'fdb5c2af7ca43debb5d943036969df29949773b6b94c0b7ce99ffc5d946b27b0'
EXPECTED = {
    'objects/objs0-2.dat': 'e1af6bdf050608d7c1832700826bece72ca592abdff3ee9c2138c50ed8a8607d',
    'objects/facs0-2.dat': '01a9a6d02efa0d35f7026cd97f8e01f72cbfb72e94217efe8256e8fe43597e9a',
    'objects/pnts0-2.dat': '09ebbdc9496d2ebd3a932be96af3fd27e6701a41105a5154aec4abe39e50b911',
}


def sha(data):
    return hashlib.sha256(data).hexdigest()


def canonical_sha(value):
    return sha(json.dumps(value, sort_keys=True, separators=(',', ':')).encode())


def decode_base(source, project):
    raw = []
    for name, expected in EXPECTED.items():
        data = (source / name).read_bytes()
        if sha(data) != expected:
            raise ValueError(f'Original model149 input hash mismatch: {name}')
        raw.append(data)
    objects, faces, points = raw
    face_count, point_count = struct.unpack_from('<hh', objects, MODEL * 54 + 2)
    scale = struct.unpack_from('<i', objects, MODEL * 54 + 12)[0]
    face_start = struct.unpack_from('<I', objects, MODEL * 54 + 16)[0]
    point_start = struct.unpack_from('<I', objects, MODEL * 54 + 24)[0]
    if (face_count, point_count, scale, face_start, point_start) != (51, 51, 160, 10675, 9217):
        raise ValueError('Unexpected base149 object record')
    for face in range(face_start - 1, face_start + face_count - 1):
        count = faces[face * 60 + 6]
        indices = struct.unpack_from('<4h', faces, face * 60 + 40)[:count]
        if count not in (3, 4) or any(index < 0 or index >= point_count for index in indices):
            raise ValueError('Base149 face escapes its corresponding raw point block')

    spec = importlib.util.spec_from_file_location('import_original', project / 'scripts/import-original.py')
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    decoded, (_, order) = module.decode_original_model(objects, faces, points, MODEL)
    if canonical_sha(decoded) != DECODED_SHA:
        raise ValueError('Unexpected decoded base149 geometry/material data')
    if len(order) != 258 or set(decoded['tiles']) != {159, 167}:
        raise ValueError('Unexpected base149 expanded vertices or atlas tiles')
    if any(not 0 <= value <= 1 for value in decoded['uv']):
        raise ValueError('Base149 UV outside the existing atlas')
    atlas = (project / 'public/original/atlas.png').read_bytes()
    if sha(atlas) != ATLAS_SHA or struct.unpack_from('>II', atlas, 16) != (256, 1024):
        raise ValueError('Base149 requires the reviewed 256x1024 object atlas')
    # Each tile occupies one existing 32x32 cell; neither tile needs new pixels.
    if any((tile % 8 + 1) * 32 > 256 or (tile // 8 + 1) * 32 > 1024 for tile in decoded['tiles']):
        raise ValueError('Base149 tile is not covered by the shipped atlas')
    return decoded


def import_base(source, project, write=False):
    decoded = decode_base(source, project)
    models_path = project / 'app/original-models.json'
    provenance_path = project / 'public/original/provenance.json'
    models_text = models_path.read_text()
    models = json.loads(models_text)
    provenance = json.loads(provenance_path.read_text())
    if provenance['objectBank'] != 2 or any(provenance['sha256'].get(name) != value for name, value in EXPECTED.items()):
        raise ValueError('Model149 source disagrees with the existing bank-2 provenance')
    entry = {
        'baseModel': MODEL,
        'asset': 'app/original-models.json',
        'importer': 'scripts/import-stone-head-149.py',
        'decodedSha256': DECODED_SHA,
        'sha256': EXPECTED,
        'atlas': {'asset': 'public/original/atlas.png', 'sha256': ATLAS_SHA, 'tiles': [159, 167]},
        'scope': 'Static base only; original animation cadence and key150/151 runtime integration unresolved.',
    }
    if str(MODEL) in models and models[str(MODEL)] != decoded:
        raise ValueError('Refusing to overwrite differing existing model149')
    if 'staticStoneHead149' in provenance and provenance['staticStoneHead149'] != entry:
        raise ValueError('Refusing to overwrite differing model149 provenance')
    if not write:
        if models.get(str(MODEL)) != decoded or provenance.get('staticStoneHead149') != entry or MODEL not in provenance['modelIds']:
            raise ValueError('Static model149 is not imported; review then use --write')
    else:
        # Append one JSON member without reserializing any existing model bytes.
        if str(MODEL) not in models:
            end = models_text.rfind('}')
            addition = ',"149":' + json.dumps(decoded, separators=(',', ':'))
            models_path.write_text(models_text[:end] + addition + models_text[end:])
        if MODEL not in provenance['modelIds']:
            provenance['modelIds'].append(MODEL)
        provenance['staticStoneHead149'] = entry
        provenance_path.write_text(json.dumps(provenance, indent=2) + '\n')
    return {'model': MODEL, 'faces': 51, 'rawPoints': 51, 'vertices': 258, 'triangles': 86,
            'scale': 160, 'tiles': [159, 167], 'decodedSha256': DECODED_SHA,
            'atlasSha256': ATLAS_SHA, 'animationAdded': False, 'write': write}


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('game_root', type=Path)
    parser.add_argument('--write', action='store_true')
    args = parser.parse_args()
    print(json.dumps(import_base(args.game_root, Path(__file__).resolve().parents[1], args.write), indent=2))


if __name__ == '__main__':
    main()
