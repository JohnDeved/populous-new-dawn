#!/usr/bin/env python3
"""Verify only original training-hut variants and their shipped model records.

python -B scripts/check-native-training-hut-assets.py --data-root GAME --output NEW_JSON
--diagnosis-only allows the five records to be absent; it does not generate assets.
--live-models adds original native selection and complete model-call comparisons
using a focused browser capture; run that mode through the canonical shared queue.
No tracked fixture recording or full asset import is performed.
"""
import argparse
import hashlib
import importlib.util
import json
from pathlib import Path
import runpy
import struct
import sys

from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
VARIANTS = {98: (5, 3, 95), 100: (8, 1, 99), 101: (8, 2, 99),
            102: (8, 3, 99), 105: (7, 2, 103)}
BANK6 = {
    'objs': '1507aea3853e8e2ed5fffa262d092f36d64442ebe7aa11c87c0c700016320666',
    'facs': 'b14ddf5828a413c1959135b9974209ad1571155cffd61a721d0cda0e22c0b8e6',
    'pnts': '27f657863d1da9f7d3cdd39fa559d2057cd7198e9f287caea8175b5765c9a8ce',
}


def sha(data):
    return hashlib.sha256(data).hexdigest()


def module(name, path):
    spec = importlib.util.spec_from_file_location(name, path)
    result = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(result)
    return result


def blocks(raw, model):
    objects, faces, points = raw
    record = struct.unpack_from('<Hhhbbii4I6h4b3h', objects, model * 54)
    nf, np, sf, sp = record[1], record[2], record[7], record[9]
    assert nf > 0 and np > 0 and sf > 0 and sp > 0 and record[6] > 0
    return record, faces[(sf - 1) * 60:(sf + nf - 1) * 60], points[(sp - 1) * 6:(sp + np - 1) * 6]


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--data-root', type=Path, required=True)
    parser.add_argument('--output', type=Path, required=True)
    parser.add_argument('--diagnosis-only', action='store_true')
    parser.add_argument('--live-models', type=Path)
    args = parser.parse_args()
    if args.output.exists():
        raise ValueError('Preserve previous evidence; choose a new output')
    provenance = json.loads((ROOT / 'public/original/provenance.json').read_text())
    models = json.loads((ROOT / 'app/original-models.json').read_text())
    raw, inputs = {}, {}
    for bank in [2, 6]:
        data = []
        for kind in ['objs', 'facs', 'pnts']:
            name = f'objects/{kind}0-{bank}.dat'
            value = (args.data_root / name).read_bytes()
            expected = provenance['sha256'][name] if bank == 2 else BANK6[kind]
            assert sha(value) == expected, name
            inputs[name] = expected
            data.append(value)
        raw[bank] = data
    records, tiles, vertices = [], set(), 0
    for model, (building_type, owner, fallback) in VARIANTS.items():
        record, faces, points = blocks(raw[2], model)
        other, other_faces, other_points = blocks(raw[6], model)
        assert (record[:7], faces, points) == (other[:7], other_faces, other_points), model
        _, _, blue_points = blocks(raw[2], fallback)
        assert points != blue_points, 'A generic Blue-mesh recolor must not replace distinct source geometry'
        nf, np, scale = record[1], record[2], record[6]
        data = models.get(str(model))
        if not args.diagnosis_only:
            assert data is not None, f'Missing original training mesh {model}'
            assert data['scale'] == scale and len(data['faces']) == nf * 2
            assert data['panelHeight'] == int(record[15] / 2)
        cursor = 0
        for face in range(nf):
            offset = face * 60
            _, tile, flags, count, mode = struct.unpack_from('<hhHBb', faces, offset)
            assert count in (3, 4)
            tiles.add(tile)
            indices = struct.unpack_from('<4h', faces, offset + 40)
            uv = struct.unpack_from('<8i', faces, offset + 8)
            if not args.diagnosis_only:
                assert data['faces'][face * 2:face * 2 + 2] == [count, faces[offset + 59]]
                assert data['tiles'][face] == tile and data['modes'][face] == mode
                assert data['normals'][face] == ([-1] * 4 if flags & 1 else list(struct.unpack_from('<4h', faces, offset + 48)))
                assert data['biases'][face] == -record[3] - struct.unpack_from('<b', faces, offset + 58)[0]
            for corner in ([0, 1, 2] if count == 3 else [0, 1, 2, 0, 2, 3]):
                assert 0 <= indices[corner] < np
                point = struct.unpack_from('<3h', points, indices[corner] * 6)
                if not args.diagnosis_only:
                    restored = [round(data['p'][cursor * 3 + a] * scale * 3 * (-1 if a == 2 else 1)) for a in range(3)]
                    assert restored == list(point), (model, face, corner)
                    u, v = data['uv'][cursor * 2:cursor * 2 + 2]
                    fixed = [(u * 8 - tile % 8) * 0x200000, ((1 - v) * 32 - tile // 8) * 0x200000]
                    assert all(abs(fixed[a] - uv[corner * 2 + a]) <= 4 for a in range(2))
                cursor += 1
        if not args.diagnosis_only:
            assert len(data['p']) == cursor * 3 and len(data['uv']) == cursor * 2
        vertices += cursor
        records.append(dict(model=model, buildingType=building_type, owner=owner, blueFallback=fallback,
                            missingAtDiagnosis=data is None, sourceFaces=nf, sourcePoints=np, scale=scale,
                            sourceFlags=record[0], faceSHA=sha(faces), pointSHA=sha(points),
                            differsFromBlue=True, equivalentBank6=True))
    # The complete atlas was already imported. Compare only the tiles consumed by
    # these five original models, using the existing reviewed palette decoder.
    importer = module('training_original_decoder', ROOT / 'scripts/import-original.py')
    names = ['data/bl320-c.dat', 'data/pal0-c.dat', 'data/al0-c.dat']
    values = [(args.data_root / name).read_bytes() for name in names]
    for name, value in zip(names, values):
        assert sha(value) == provenance['sha256'][name]
        inputs[name] = sha(value)
    rules = json.loads((ROOT / 'app/original-rules.json').read_text())
    decoded = importer.object_texture(importer.object_atlas(*values, rules['objectTextureAlpha']))
    image = Image.frombytes('RGBA', (256, 1024), bytes(decoded))
    stored = Image.open(ROOT / 'public/original/atlas.png').convert('RGBA')
    for tile in tiles:
        rectangle = (tile % 8 * 32, tile // 8 * 32, tile % 8 * 32 + 32, tile // 8 * 32 + 32)
        assert image.crop(rectangle).tobytes() == stored.crop(rectangle).tobytes(), tile
    native = None
    if args.live_models:
        if args.diagnosis_only:
            raise ValueError('Live native verification requires imported final records')
        old_argv = sys.argv
        sys.argv = ['check-native-live-models.py', str(args.data_root / 'd3dpoptb.exe'), str(args.live_models)]
        try:
            state = runpy.run_path(str(ROOT / 'scripts/check-native-live-models.py'))
        finally:
            sys.argv = old_argv
        cpu, call, read, write, unit = [state[key] for key in ['cpu', 'call', 'read', 'write', 'unit']]
        selections = []
        for building_type in [5, 6, 7, 8]:
            for owner in [-1, 0, 1, 2, 3]:
                cpu.mem_write(unit, bytes(256))
                write(unit + 0x2b, 'B', building_type)
                write(unit + 0x2f, 'b', owner)
                call(0x40b170, unit)
                actual = read(unit + 0x63, 'h')
                assert actual == rules['buildingObjects'][building_type] + owner
                selections.append(dict(buildingType=building_type, owner=owner, actualObject=actual))
        native = dict(originalSelector='0040b170', selectorCalls=len(selections), selections=selections,
                      completeModelCalls=sum(len(frame['models']) for frame in state['frames']),
                      triangles=state['count'], exeSHA=state['identity']['sha256'])
    result = dict(status='DIAGNOSED_MISSING_ORIGINAL_TRAINING_VARIANTS' if args.diagnosis_only else 'PASS_ORIGINAL_TRAINING_ASSETS',
                  sourceSHA=sha(Path(__file__).read_bytes()), inputSHA=inputs, records=records,
                  restoredVertices=vertices if not args.diagnosis_only else 0,
                  verifiedAtlasTiles=sorted(tiles), atlasUnchangedSHA=sha((ROOT / 'public/original/atlas.png').read_bytes()),
                  native=native, limits='Static source geometry/material and, when requested, original selection/model submissions. No final native GPU raster or simulation changes.')
    with args.output.open('x') as output:
        json.dump(result, output, indent=2)
        output.write('\n')
    print(json.dumps(result, indent=2))


if __name__ == '__main__':
    main()
