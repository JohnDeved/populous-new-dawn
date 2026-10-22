#!/usr/bin/env python3
"""Export only lossless Help-preview fields. Original programs are data, never code.

No full importer, asset writes, shared-bank writes or overwrite mode. All pinned
inputs are verified before decoding or opening the explicitly new destination.
"""
import argparse
import hashlib
import json
from pathlib import Path
import stat
import struct

PINS = {
    'd3dpoptb.exe': '3a5065c7420b3fcde208bf220bc86dfbac95e025ab2492caf9c7ea5308dfbe4f',
    'objects/objs0-2.dat': 'e1af6bdf050608d7c1832700826bece72ca592abdff3ee9c2138c50ed8a8607d',
    'objects/facs0-2.dat': '01a9a6d02efa0d35f7026cd97f8e01f72cbfb72e94217efe8256e8fe43597e9a',
    'objects/pnts0-2.dat': '09ebbdc9496d2ebd3a932be96af3fd27e6701a41105a5154aec4abe39e50b911',
    'objects/objs0-6.dat': '1507aea3853e8e2ed5fffa262d092f36d64442ebe7aa11c87c0c700016320666',
    'objects/facs0-6.dat': 'b14ddf5828a413c1959135b9974209ad1571155cffd61a721d0cda0e22c0b8e6',
    'objects/pnts0-6.dat': '27f657863d1da9f7d3cdd39fa559d2057cd7198e9f287caea8175b5765c9a8ce',
}
sha = lambda value: hashlib.sha256(value).hexdigest()


def verified_inputs(root):
    data = {}
    for name, expected in PINS.items():
        path = root / name
        info = path.lstat()
        if not stat.S_ISREG(info.st_mode) or info.st_size > 16 * 1024 * 1024:
            raise ValueError(f'Not a bounded regular source file: {name}')
        value = path.read_bytes()
        if sha(value) != expected:
            raise ValueError(f'Source hash mismatch: {name}')
        data[name] = value
    return data


def pe_reader(exe):
    pe = struct.unpack_from('<I', exe, 0x3c)[0]
    count = struct.unpack_from('<H', exe, pe + 6)[0]
    optional = pe + 24
    size = struct.unpack_from('<H', exe, pe + 20)[0]
    base = struct.unpack_from('<I', exe, optional + 28)[0]
    sections = [struct.unpack_from('<4I', exe, optional + size + i * 40 + 8) for i in range(count)]

    def read(address, length):
        for _, rva, raw_size, offset in sections:
            if rva <= address - base and address - base + length <= rva + raw_size:
                return exe[offset + address - base - rva:offset + address - base - rva + length]
        raise ValueError(f'Unmapped original address: {address:08x}')
    return read


def preview_models(read):
    models = set()
    word = lambda address: struct.unpack('<h', read(address, 2))[0]
    for topic in range(983, 1071):
        kind, arg0, _, arg2 = struct.unpack('<BIII', read(0x59a195 + topic * 13, 13))
        if kind == 1:
            models.add(word(0x5a7228 + arg0 * 76))
        elif kind == 2:
            models.add(word(0x5a793c + arg0 * 23))
        elif kind == 5:
            if arg0 == 9:
                models.add(arg2 & 65535)
            else:
                for index in (range(1, 7) if arg0 == 1 else [arg0]):
                    models.add(word(0x5a79ba + index * 24))
        elif kind == 6:
            models.add(30)
    return sorted(models)


def model_fields(data, bank, model):
    objects, faces, points = [data[f'objects/{name}0-{bank}.dat'] for name in ['objs', 'facs', 'pnts']]
    offset = model * 54
    _, nf, np, object_bias, _, _, _, sf, _, sp, *_ = struct.unpack_from('<Hhhbbii4I6h4b3h', objects, offset)
    if not (0 < nf <= 512 and 0 < np <= 512 and sf > 0 and sp > 0):
        raise ValueError('Invalid selected model bounds')
    face_bytes = faces[(sf - 1) * 60:(sf - 1 + nf) * 60]
    point_bytes = points[(sp - 1) * 6:(sp - 1 + np) * 6]
    if len(face_bytes) != nf * 60 or len(point_bytes) != np * 6:
        raise ValueError('Truncated selected model')
    normals, uv, positions, counts, tiles, modes, biases = [], [], [], [], [], [], []
    for index in range(nf):
        row = face_bytes[index * 60:(index + 1) * 60]
        count, mode = row[6], row[7]
        tile = struct.unpack_from('<h', row, 2)[0]
        normal = struct.unpack_from('<H', row, 48)[0]
        indices = struct.unpack_from('<4h', row, 40)
        if count not in (3, 4) or not 0 <= tile < 256 or not 0 <= normal < 1024:
            raise ValueError('Unsupported selected face')
        if any(not 0 <= indices[k] < np for k in range(count)):
            raise ValueError('Invalid selected point index')
        normals.append(normal)
        uv.append(list(struct.unpack_from('<8i', row, 8)))
        counts.append(count)
        tiles.append(tile)
        modes.append(mode)
        biases.append(-object_bias - struct.unpack_from('<b', row, 58)[0])
        for corner in ([0, 1, 2] if count == 3 else [0, 1, 2, 0, 2, 3]):
            positions.extend(struct.unpack_from('<3h', point_bytes, indices[corner] * 6))
    geometry = dict(positions=positions, counts=counts, tiles=tiles, modes=modes, biases=biases)
    supplemental = dict(normals=normals, uv=uv)
    if model == 7:
        supplemental['geometry'] = geometry
    identity = dict(objectOffset=offset, faceStart=sf - 1, faceCount=nf, pointStart=sp - 1,
                    pointCount=np, objectSha256=sha(objects[offset:offset + 54]),
                    facesSha256=sha(face_bytes), pointsSha256=sha(point_bytes))
    return supplemental, geometry, identity


def export(data):
    read = pe_reader(data['d3dpoptb.exe'])
    selected = preview_models(read)
    banks, identities, full = {}, {}, {}
    for bank in [2, 6]:
        banks[str(bank)], identities[str(bank)] = {}, {}
        for model in selected:
            extra, geometry, identity = model_fields(data, bank, model)
            identities[str(bank)][str(model)] = identity
            if bank == 2 or (extra, geometry) != full[model]:
                banks[str(bank)][str(model)] = extra
            if bank == 2:
                full[model] = (extra, geometry)
    spans = [dict(start=f'{start:08x}', endExclusive=f'{end:08x}', sha256=sha(read(start, end - start)))
             for start, end in [(0x472da0, 0x473205), (0x47f930, 0x47f9ae), (0x46c3f0, 0x46c6d5)]]
    return dict(version=1, sources=PINS, code=spans, models=selected, identities=identities, banks=banks)


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('source', type=Path)
    mode = parser.add_mutually_exclusive_group(required=True)
    mode.add_argument('--output', type=Path, help='Create one new preview-only JSON, never overwrite')
    mode.add_argument('--check', type=Path, help='Read-only exact byte comparison')
    args = parser.parse_args()
    encoded = (json.dumps(export(verified_inputs(args.source)), separators=(',', ':')) + '\n').encode()
    target = args.output or args.check
    if target.is_symlink():
        raise ValueError('Destination symlinks are not accepted')
    if args.check:
        if not target.is_file() or target.read_bytes() != encoded:
            raise ValueError('Preview output differs')
    else:
        # The supplemental bank is the only supported generated filename. This
        # prevents accidental use against existing shared model/asset banks.
        if target.name != 'original-help-previews.json':
            raise ValueError('Destination must be named original-help-previews.json')
        with target.open('xb') as destination:
            destination.write(encoded)
    print(f'{"Checked" if args.check else "Created"} {target}: {len(encoded)} bytes, SHA256 {sha(encoded)}')


if __name__ == '__main__':
    main()
