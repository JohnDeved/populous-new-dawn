#!/usr/bin/env python3
"""Import exact Angel strike model 62, morph keys 63–68 and transition keys 76–78.

No shared atlas or model catalog is regenerated. The existing initial importer
owns the eight raw-file hash pins; both original object banks must agree here.
This data does not provide the missing pursuit preparation/movement-mode owner.
"""
import argparse
import hashlib
import importlib.util
import json
from pathlib import Path
import struct

ROOT = Path(__file__).resolve().parents[1]


def module(name, path):
    spec = importlib.util.spec_from_file_location(name, path)
    result = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(result)
    return result


def decode(source):
    hashes = module('initial_angel', ROOT / 'scripts/import-angel-presentation.py').HASHES
    decoder = module('original_decoder', ROOT / 'scripts/import-original.py')
    raw = {}
    for name, digest in hashes.items():
        raw[name] = (source / name).read_bytes()
        if hashlib.sha256(raw[name]).hexdigest() != digest:
            raise ValueError('Original Angel input SHA mismatch: ' + name)
    banks = []
    for bank in (2, 6):
        objects, faces, points, morphs = [raw[f'objects/{name}0-{bank}.dat'] for name in ('objs', 'facs', 'pnts', 'morph')]
        geometry, (scale, indices) = decoder.decode_original_model(objects, faces, points, 62)
        if scale != 160 or len(geometry['faces']) != 222 or objects[62 * 54 + 7] != 4:
            raise ValueError('Unexpected original Angel model 62')
        if struct.unpack_from('<8i', morphs, 4 * 368) != (62, 6, 63, 64, 65, 66, 67, 68):
            raise ValueError('Unexpected model 62 morph keys')
        if struct.unpack_from('<6i', morphs, 4 * 368 + 0x58) != (1,) * 6:
            raise ValueError('Unexpected model 62 segment durations')
        keys = {}
        for model in [*range(63, 70), 76, 77, 78]:
            count = struct.unpack_from('<h', objects, model * 54 + 4)[0]
            first = struct.unpack_from('<I', objects, model * 54 + 24)[0]
            if count != 87 or first < 1 or (first + count - 1) * 6 > len(points):
                raise ValueError('Invalid original Angel keypoint range')
            keys[str(model)] = list(struct.unpack_from('<261h', points, (first - 1) * 6))
        if any(index < 0 or index >= 87 for index in indices):
            raise ValueError('Invalid strike topology point reference')
        visible, cursor = [], 0
        for face, mode in enumerate(geometry['modes']):
            count = 3 if geometry['faces'][2 * face] == 3 else 6
            if mode:
                visible.extend(indices[cursor:cursor + count])
            cursor += count
        if cursor != len(indices):
            raise ValueError('Incomplete strike topology')
        banks.append({'baseGeometry': geometry, 'basePointIndices': indices,
                      'visiblePointIndices': visible, 'keypoints': keys})
    if banks[0] != banks[1]:
        raise ValueError('Original strike geometry differs between banks')
    return {'version': 1, 'base': 62, 'scale': 160, 'pointCount': 87, 'morphIndex': 4,
            'frames': 12, **banks[0],
            'segments': [{'from': 63 + i, 'to': 63 + (i + 1) % 6, 'first': 2 * i,
                          'last': 2 * i + 1, 'duration': 2} for i in range(6)],
            'sha256': hashes}


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('source', type=Path)
    parser.add_argument('--check', action='store_true')
    args = parser.parse_args()
    text = json.dumps(decode(args.source), separators=(',', ':')) + '\n'
    output = ROOT / 'app/original-angel-strike.json'
    if args.check:
        if output.read_text() != text:
            raise ValueError('Imported strike data differs from original')
    else:
        if output.exists() and output.read_text() != text:
            raise ValueError('Refusing to overwrite differing strike data')
        output.write_text(text)
    print('Verified original model 62 and strike/transition keys in both object banks.')


if __name__ == '__main__':
    main()
