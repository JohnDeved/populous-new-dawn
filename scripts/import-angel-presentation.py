#!/usr/bin/env python3
"""Import only the evidenced initial Angel attachment (model 69) and its morph keys.

No textures, shared model catalog or gameplay state are regenerated. Banks 2 and 6
are independently decoded and must agree. This does not supply the unported
native movement-state owner needed to select model 62 during later motion.
"""
import argparse
import hashlib
import importlib.util
import json
from pathlib import Path
import struct

ROOT = Path(__file__).resolve().parents[1]
HASHES = {
    'objects/objs0-2.dat': 'e1af6bdf050608d7c1832700826bece72ca592abdff3ee9c2138c50ed8a8607d',
    'objects/facs0-2.dat': '01a9a6d02efa0d35f7026cd97f8e01f72cbfb72e94217efe8256e8fe43597e9a',
    'objects/pnts0-2.dat': '09ebbdc9496d2ebd3a932be96af3fd27e6701a41105a5154aec4abe39e50b911',
    'objects/morph0-2.dat': '1939b4d30839f2ab49ea110abb29d40eb001d6cc6fa4932be72ce44c3aebf066',
    'objects/objs0-6.dat': '1507aea3853e8e2ed5fffa262d092f36d64442ebe7aa11c87c0c700016320666',
    'objects/facs0-6.dat': 'b14ddf5828a413c1959135b9974209ad1571155cffd61a721d0cda0e22c0b8e6',
    'objects/pnts0-6.dat': '27f657863d1da9f7d3cdd39fa559d2057cd7198e9f287caea8175b5765c9a8ce',
    'objects/morph0-6.dat': '1939b4d30839f2ab49ea110abb29d40eb001d6cc6fa4932be72ce44c3aebf066',
}


def decode(source):
    raw = {}
    for name, sha in HASHES.items():
        blob = (source / name).read_bytes()
        if hashlib.sha256(blob).hexdigest() != sha:
            raise ValueError('Original Angel input SHA mismatch: ' + name)
        raw[name] = blob
    spec = importlib.util.spec_from_file_location('angel_model_decoder', ROOT / 'scripts/import-original.py')
    decoder = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(decoder)
    banks = []
    for bank in (2, 6):
        objects, faces, points, morphs = [raw[f'objects/{name}0-{bank}.dat'] for name in ('objs', 'facs', 'pnts', 'morph')]
        base, (scale, indices) = decoder.decode_original_model(objects, faces, points, 69)
        if scale != 160 or len(base['faces']) != 222 or objects[69 * 54 + 7] != 5:
            raise ValueError('Unexpected initial Angel model 69')
        keys = {}
        for model in range(70, 76):
            count = struct.unpack_from('<h', objects, model * 54 + 4)[0]
            start = struct.unpack_from('<I', objects, model * 54 + 24)[0]
            if count != 87 or start < 1 or (start + count - 1) * 6 > len(points):
                raise ValueError('Invalid Angel keypoint range')
            keys[str(model)] = list(struct.unpack_from('<261h', points, (start - 1) * 6))
        record = 5 * 0x170
        if struct.unpack_from('<8i', morphs, record) != (69, 6, 70, 71, 72, 73, 74, 75):
            raise ValueError('Unexpected model 69 morph key sequence')
        if struct.unpack_from('<6i', morphs, record + 0x58) != (1,) * 6:
            raise ValueError('Unexpected model 69 segment durations')
        if any(index < 0 or index >= 87 for index in indices):
            raise ValueError('Angel base references invalid keypoint')
        visible, cursor = [], 0
        for face, mode in enumerate(base['modes']):
            count = 3 if base['faces'][face * 2] == 3 else 6
            if mode:
                visible.extend(indices[cursor:cursor + count])
            cursor += count
        if cursor != len(indices):
            raise ValueError('Incomplete Angel topology coverage')
        banks.append({'baseGeometry': base, 'basePointIndices': indices, 'visiblePointIndices': visible, 'keypoints': keys})
    if banks[0] != banks[1]:
        raise ValueError('Angel geometry differs between original object banks')
    return {'version': 1, 'base': 69, 'scale': 160, 'pointCount': 87,
            'morphIndex': 5, 'frames': 12, **banks[0],
            'segments': [{'from': 70 + i, 'to': 70 + (i + 1) % 6, 'first': 2 * i,
                          'last': 2 * i + 1, 'duration': 2} for i in range(6)],
            'sha256': HASHES}


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('source', type=Path)
    parser.add_argument('--check', action='store_true')
    args = parser.parse_args()
    data = decode(args.source)
    output = ROOT / 'app/original-angel-presentation.json'
    text = json.dumps(data, separators=(',', ':')) + '\n'
    if args.check:
        if output.read_text() != text:
            raise ValueError('Imported Angel presentation differs from original bytes')
    else:
        if output.exists() and output.read_text() != text:
            raise ValueError('Refusing to overwrite differing Angel presentation')
        output.write_text(text)
    print('Verified original model 69, six morph keys, twelve frames, both object banks.')


if __name__ == '__main__':
    main()
