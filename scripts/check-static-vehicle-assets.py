#!/usr/bin/env python3
"""Verify the original Boat/Balloon mesh mapping, geometry and existing atlas.

python3 -B scripts/check-static-vehicle-assets.py --data-root GAME_ROOT --output NEW_JSON
Uses the existing SHA-pinned PE32 reader, Capstone5 and Pillow. Reads original bytes
only: no native execution, Ghidra, fixture recording, or asset generation.
"""
import argparse
import hashlib
import importlib.util
import json
from pathlib import Path
import struct

import capstone
from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
HASHES = {
    'objects/objs0-2.dat': 'e1af6bdf050608d7c1832700826bece72ca592abdff3ee9c2138c50ed8a8607d',
    'objects/facs0-2.dat': '01a9a6d02efa0d35f7026cd97f8e01f72cbfb72e94217efe8256e8fe43597e9a',
    'objects/pnts0-2.dat': '09ebbdc9496d2ebd3a932be96af3fd27e6701a41105a5154aec4abe39e50b911',
    'objects/objs0-6.dat': '1507aea3853e8e2ed5fffa262d092f36d64442ebe7aa11c87c0c700016320666',
    'objects/facs0-6.dat': 'b14ddf5828a413c1959135b9974209ad1571155cffd61a721d0cda0e22c0b8e6',
    'objects/pnts0-6.dat': '27f657863d1da9f7d3cdd39fa559d2057cd7198e9f287caea8175b5765c9a8ce',
    'objects/aniob0-2.dat': '7c73a84af411fb0ac60a9e37240bdfe8e6ff94c1b9691b7ff9616f4d5d9c1c56',
    'objects/aniob0-6.dat': '7c73a84af411fb0ac60a9e37240bdfe8e6ff94c1b9691b7ff9616f4d5d9c1c56',
    'language/lang00.dat': 'e826c478746d666a3ea9ea36cb7804d1d226d5f83084230987b1de293066cf7d',
    'data/pal0-c.dat': '6c61cd586fc96ef5f777c71966a9ac1875491a4a521342ba06d108df5e92bf53',
    'data/bl320-c.dat': '26fbee4d3cb590462e1ef3c9afe1964283f1b662e8c58057ed8f2cbf324b2a05',
    'data/al0-c.dat': 'afc46e78b56f901f1331ceb0b02052eeaba2b6446b8747a03d0f12639ae17310',
}


def sha(data):
    return hashlib.sha256(data).hexdigest()


def load(name, path):
    spec = importlib.util.spec_from_file_location(name, path)
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--data-root', type=Path, required=True)
    parser.add_argument('--exe', type=Path)
    parser.add_argument('--output', type=Path)
    args = parser.parse_args()
    if args.output and args.output.exists():
        raise ValueError('Preserve old evidence; use a new output file')
    raw, inputs = {}, []
    for name, expected in HASHES.items():
        data = (args.data_root / name).read_bytes()
        if sha(data) != expected:
            raise ValueError('Original asset SHA mismatch: ' + name)
        raw[name] = data
        inputs.append(dict(path=name, bytes=len(data), sha256=expected))
    pe_module = load('vehicle_pe_reader', ROOT / 'scripts/check-static-mission18-sky.py')
    exe = pe_module.PE32(args.exe or args.data_root / 'd3dpoptb.exe')
    decoder = capstone.Cs(capstone.CS_ARCH_X86, capstone.CS_MODE_32)
    windows = []
    instructions = {}
    for address, length in [(0x463c51, 0x25), (0x4ee700, 0x55), (0x4f106b, 0x1a),
                            (0x44d8b6, 0x36), (0x40c670, 0x20)]:
        data = exe.read(address, length)
        rows = [dict(address=f'{i.address:08x}', bytes=i.bytes.hex(), mnemonic=i.mnemonic,
                     operands=i.op_str) for i in decoder.disasm(data, address)]
        instructions.update({int(row['address'], 16): row for row in rows})
        windows.append(dict(address=f'{address:08x}', bytes=length, sha256=sha(data), instructions=rows))
    expected = {
        0x463c63: ('mov', 'ax, word ptr [ecx + 0x5a793c]'),
        0x463c6b: ('push', '2'),
        0x463c6e: ('call', '0x4ee700'),
        0x4ee721: ('mov', 'word ptr [edx], ax'),
        0x4ee724: ('mov', 'byte ptr [edx + 7], cl'),
        0x4f107c: ('movsx', 'eax, word ptr [ecx + 0x5a793e]'),
        0x44d8c4: ('call', '0x4f0f90'),
        0x44d8d4: ('mov', 'eax, dword ptr [eax*4 + 0x972ba8]'),
    }
    for address, want in expected.items():
        actual = instructions[address]
        assert (actual['mnemonic'], actual['operands']) == want, hex(address)
    names = raw['language/lang00.dat'].decode('utf-16-le').split('\0')
    models = json.loads((ROOT / 'app/original-models.json').read_text())
    descriptors = []
    for model in range(1, 5):
        data = exe.read(0x5a7938 + 23 * model, 23)
        mesh, label = struct.unpack_from('<hh', data, 4)
        assert mesh == (143 if model < 3 else 144)
        assert label == (838 if model < 3 else 839)
        assert names[label].startswith('Boat:' if model < 3 else 'Balloon:')
        descriptors.append(dict(vehicleType=model, address=f'{0x5a7938+23*model:08x}',
                                bytes=data.hex(), mesh=mesh, label=label, labelText=names[label]))
    assertions, records, all_tiles = 0, [], set()
    for model in [143, 144]:
        data = models[str(model)]
        bank_blocks = []
        for bank in [2, 6]:
            objects, faces, points = [raw[f'objects/{name}0-{bank}.dat'] for name in ['objs', 'facs', 'pnts']]
            record = struct.unpack_from('<Hhhbbii4I6h4b3h', objects, model * 54)
            nf, np, scale, sf, sp = record[1], record[2], record[6], record[7], record[9]
            assert record[0] == 0 and scale == 160
            ani = raw[f'objects/aniob0-{bank}.dat']
            assert all(ani[at] != model for at in range(0, len(ani), 10)), 'Unexpected vehicle morph'
            block_faces = faces[(sf - 1) * 60:(sf + nf - 1) * 60]
            block_points = points[(sp - 1) * 6:(sp + np - 1) * 6]
            bank_blocks.append((scale, block_faces, block_points))
            if bank == 6:
                continue
            assert len(data['faces']) == nf * 2 and data['scale'] == scale
            vertex = 0
            for face in range(nf):
                offset = face * 60
                _, tile, flags, count, mode = struct.unpack_from('<hhHBb', block_faces, offset)
                corners = [0, 1, 2] if count == 3 else [0, 1, 2, 0, 2, 3]
                assert data['faces'][face * 2:face * 2 + 2] == [count, block_faces[offset + 59]]
                assert data['tiles'][face] == tile and data['modes'][face] == mode
                assert data['normals'][face] == list(struct.unpack_from('<4h', block_faces, offset + 48))
                assert data['biases'][face] == -record[3] - struct.unpack_from('<b', block_faces, offset + 58)[0]
                all_tiles.add(tile)
                indices = struct.unpack_from('<4h', block_faces, offset + 40)
                fixed_uv = struct.unpack_from('<8i', block_faces, offset + 8)
                for corner in corners:
                    raw_point = struct.unpack_from('<3h', block_points, indices[corner] * 6)
                    restored = [round(data['p'][vertex * 3 + axis] * scale * 3 * (-1 if axis == 2 else 1)) for axis in range(3)]
                    assert restored == list(raw_point)
                    atlas_u, atlas_v = data['uv'][vertex * 2:vertex * 2 + 2]
                    restored_uv = [(atlas_u * 8 - tile % 8) * 0x200000,
                                   ((1 - atlas_v) * 32 - tile // 8) * 0x200000]
                    assert all(abs(restored_uv[k] - fixed_uv[corner * 2 + k]) <= 4 for k in range(2))
                    vertex += 1
                    assertions += 1
            assert vertex * 3 == len(data['p']) and vertex * 2 == len(data['uv'])
            records.append(dict(model=model, sourceFaces=nf, sourcePoints=np, triangles=vertex // 3,
                                scale=scale, faceSHA=sha(block_faces), pointSHA=sha(block_points),
                                importedSHA=sha(json.dumps(data, separators=(',', ':')).encode())))
        assert bank_blocks[0] == bank_blocks[1], 'Campaign bank6 vehicle differs from bank2'
    # Independent atlas-region check: the importer exposes the reviewed palette/
    # DXT decoder, but the stored PNG is compared as raw occupied tile pixels.
    importer = load('vehicle_original_decoder', ROOT / 'scripts/import-original.py')
    atlas = Image.open(ROOT / 'public/original/atlas.png').convert('RGBA')
    assert atlas.size == (256, 1024)
    rules = json.loads((ROOT / 'app/original-rules.json').read_text())
    canonical = importer.object_texture(importer.object_atlas(
        raw['data/bl320-c.dat'], raw['data/pal0-c.dat'], raw['data/al0-c.dat'],
        rules['objectTextureAlpha']))
    expected_image = Image.frombytes('RGBA', (256, 1024), bytes(canonical))
    # Post-load00418de0 enables tribe textures for143/144. The static bitmap
    # identifies base tiles; the focused native checker executes the owner path.
    flagged_tiles = sorted(tile for tile in all_tiles if exe.read(0x5aa218 + tile, 1)[0] & 1)
    assert flagged_tiles == [186, 202, 210]
    checked_tiles = all_tiles | {tile + owner for tile in flagged_tiles for owner in [-1, 0, 1, 2, 3]}
    for tile in checked_tiles:
        rectangle = (tile % 8 * 32, tile // 8 * 32, tile % 8 * 32 + 32, tile // 8 * 32 + 32)
        assert atlas.crop(rectangle).tobytes() == expected_image.crop(rectangle).tobytes(), tile
    result = dict(status='PASS_STATIC_ORIGINAL_VEHICLE_ASSETS', exeSHA256=sha(exe.data),
                  sourceSHA256=sha(Path(__file__).read_bytes()), inputs=inputs, windows=windows,
                  descriptors=descriptors, models=records, restoredVertices=assertions,
                  textureTiles=sorted(all_tiles), originalTribeTextureBases=flagged_tiles,
                  allOwnerAtlasTiles=sorted(checked_tiles), equivalentCampaignBanks=[2, 6], noMorphRows=True,
                  limits='Original bytes/decoded assets only; no native execution, live gameplay, GPU pixels or performance acceptance.')
    if args.output:
        with args.output.open('x') as output:
            json.dump(result, output, indent=2)
            output.write('\n')
    print(json.dumps({k: v for k, v in result.items() if k not in ['inputs', 'windows']}, indent=2))


if __name__ == '__main__':
    main()
