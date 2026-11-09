"""Derive the scoped M4 Tower model atlas from verified original DATA.

Only tile 127 differs in the model-79 subset. Preserve every other bank-c
pixel and the existing UV layout. This does not enable Tower acquisition.
--check derives outputs in memory/temporary storage without replacing them.
"""
import argparse
import hashlib
import importlib.util
import json
from pathlib import Path
import tempfile

ROOT = Path(__file__).resolve().parents[1]
TILES = [12, 24, 26, 109, 127, 143, 154, 183, 186, 214, 226]
HASHES = {
    'bl320-d.dat': '26fbee4d3cb590462e1ef3c9afe1964283f1b662e8c58057ed8f2cbf324b2a05',
    'pal0-d.dat': 'baadb5c8fb8a31d64835db3ddccf85857d11f3cdc8f67e3ae233b4d919967a4f',
    'al0-d.dat': '853e30988ccffe1d5961888d05f05e7b4c215dba91075fe92f3a4305eaa62489',
}
SOURCES = {
    'scripts/import-original.py': 'bdad3fc18e32ef02ad8ba1c8edba6b2cb6f0a458b2160d1477bf32ead4954867',
    'app/original-rules.json': '876ec0fad0fd380b6ae305624a3707f50ec5fa0d7b6a4c75702e50c2499ed4c6',
    'app/original-models.json': 'f01102fe065921d53353047016c3c18fbeb030a5334060aeeaebe85390187aa3',
    'public/original/atlas.png': 'fdb5c2af7ca43debb5d943036969df29949773b6b94c0b7ce99ffc5d946b27b0',
}


def sha(data):
    return hashlib.sha256(data).hexdigest()


def require(condition, message):
    if not condition:
        raise ValueError(message)


def verified(path, expected):
    data = path.read_bytes()
    require(sha(data) == expected, 'Input hash mismatch: ' + str(path))
    return data


def crop(pixels, tile):
    x, y = tile % 8 * 32, tile // 8 * 32
    return b''.join(pixels[((y + row) * 256 + x) * 4:((y + row) * 256 + x + 32) * 4]
                    for row in range(32))


def generate(project, source):
    # Authenticate all executable decoder bytes and data before importing or writing.
    files = {name: verified(project / name, expected) for name, expected in SOURCES.items()}
    inputs = {name: verified(source / name, expected) for name, expected in HASHES.items()}
    spec = importlib.util.spec_from_file_location('tower_original_decoder', project / 'scripts/import-original.py')
    decoder = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(decoder)
    rules = json.loads(files['app/original-rules.json'])
    model = json.loads(files['app/original-models.json'])['79']
    require(rules['buildingObjects'][4] == 79 and sorted(set(model['tiles'])) == TILES,
            'Tower model selection changed')
    width, height, base = decoder.read_owned_rgba_png(project / 'public/original/atlas.png')
    require((width, height) == (256, 1024), 'Base atlas dimensions changed')
    decoded = decoder.object_texture(decoder.object_atlas(
        inputs['bl320-d.dat'], inputs['pal0-d.dat'], inputs['al0-d.dat'], rules['objectTextureAlpha']))
    atlas = bytearray(base)
    tiles = []
    for tile in TILES:
        original, replacement = crop(base, tile), crop(decoded, tile)
        require(original[3::4] == replacement[3::4], 'Tower alpha changed')
        require((original != replacement) == (tile == 127), 'Tower changed-tile set changed')
        if tile == 127:
            x, y = tile % 8 * 32, tile // 8 * 32
            for row in range(32):
                start = ((y + row) * width + x) * 4
                atlas[start:start + 128] = replacement[row * 128:(row + 1) * 128]
        tiles.append(dict(tile=tile, cRgbaSha256=sha(original), dRgbaSha256=sha(replacement)))
    require(atlas[3::4] == base[3::4], 'Atlas alpha changed')
    require(all(crop(atlas, tile) == crop(base, tile) for tile in range(256) if tile != 127),
            'Unselected atlas pixels changed')
    metadata = dict(mission=4, landscapeBank=13, buildingModel=4, model=79,
                    sha256=HASHES, sourceFilesSha256=SOURCES,
                    modelAtlas='tower-model-d', width=width, height=height,
                    changedTiles=[127], tiles=tiles, modelRgbaSha256=sha(atlas))
    outputs = {'app/original-tower-acquisition.json': (json.dumps(metadata, indent=2) + '\n').encode()}
    with tempfile.TemporaryDirectory() as temporary:
        path = Path(temporary) / 'tower-model-d.png'
        decoder.png(path, width, height, atlas)
        outputs['public/original/tower-model-d.png'] = path.read_bytes()
    return outputs


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--source', type=Path, required=True, help='Verified BL320-d/PAL-d/AL-d DATA directory')
    parser.add_argument('--project', type=Path, default=ROOT)
    parser.add_argument('--check', action='store_true')
    args = parser.parse_args()
    outputs = generate(args.project, args.source)
    for name, data in outputs.items():
        path = args.project / name
        if args.check:
            require(path.read_bytes() == data, 'Generated output mismatch: ' + name)
        else:
            path.write_bytes(data)
    print(json.dumps({'status': 'checked' if args.check else 'generated',
                      'outputs': {name: {'bytes': len(data), 'sha256': sha(data)}
                                  for name, data in outputs.items()}}, indent=2))


if __name__ == '__main__':
    main()
