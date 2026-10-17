"""Read only selected Component0 DATA; print a bounded M1-3 theme inventory.

Uses the already installed archive reader and established pure decoder helpers.
Never runs the installer, original instructions, importer main, or game/tests.
No input bytes or imported assets are written; stdout contains metadata only.
"""
import argparse
import collections
import hashlib
import importlib.metadata
import importlib.util
import json
from pathlib import Path
import re
import struct
import zipfile

from refinery.lib.inno.archive import InnoArchive

ARCHIVE_SHA = '6aa6c366809ea1d9575ec1d31a24527a95c7332f0a1d2ab692f7a602e7e10702'
DECODER_SHA = '02127ee637d42c033119a16045c26b01adaa7d8c2833a82c3bedd03d247039e0'
PATTERN = re.compile(
    r'data/(?:pal0|al0|bl320|bigf0|cliff0|disp0|fade0)-[csp]\.dat'
    r'|levels/levl200[123]\.hdr|objects/(?:objs|facs|pnts)0-[26]\.dat'
    r'|data/watdisp\.dat|objects/shapes\.dat'
)


def sha(data):
    return hashlib.sha256(data).hexdigest()


def tile(pixels, number):
    return b''.join(
        pixels[((number // 8 * 32 + y) * 256 + number % 8 * 32) * 4:
               ((number // 8 * 32 + y) * 256 + number % 8 * 32 + 32) * 4]
        for y in range(32)
    )


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('archive', type=Path)
    parser.add_argument('--repo', type=Path, required=True)
    parser.add_argument('--source-commit', required=True)
    args = parser.parse_args()
    root = args.repo.resolve()
    with args.archive.open('rb') as stream:
        archive_sha = hashlib.file_digest(stream, 'sha256').hexdigest()
    assert archive_sha == ARCHIVE_SHA, 'Unrecognized canonical archive'
    with zipfile.ZipFile(args.archive) as archive:
        names = [n for n in archive.namelist()
                 if Path(n).name.lower() == 'setup_populous_the_beginning.exe']
        assert len(names) == 1
        installer = InnoArchive(bytearray(archive.read(names[0])))
    raw, members = {}, []
    for entry in installer.files:
        if entry.setup.Condition.Components not in ('', 'Component0'):
            continue
        if not entry.path.lower().startswith('data/{app}/'):
            continue
        name = entry.path.lower().removeprefix('data/{app}/')
        if not PATTERN.fullmatch(name):
            continue
        content = installer.read_file_and_check(entry)
        assert name not in raw or raw[name] == content, 'Ambiguous member: ' + name
        raw[name] = content
        members.append(dict(path=entry.path, component=entry.setup.Condition.Components))
    assert len(raw) == 32, 'Missing scoped member'
    script = root / 'scripts/import-original.py'
    assert sha(script.read_bytes()) == DECODER_SHA
    spec = importlib.util.spec_from_file_location('readonly_original_decoder', script)
    decoder = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(decoder)
    rules = json.loads((root / 'app/original-rules.json').read_text())
    models = json.loads((root / 'app/original-models.json').read_text())
    shapes = json.loads((root / 'app/original-shapes.json').read_text())
    source_shapes = decoder.building_shapes(raw['objects/shapes.dat'], raw['objects/objs0-2.dat'])
    assert source_shapes['shapes'] == shapes['shapes']
    assert source_shapes['cells'] == shapes['cells']
    terrain, atlases = {}, {}
    for bank in 'csp':
        terrain[bank] = b''.join(raw[f'data/{kind}-{bank}.dat'] for kind in
                                ['pal0', 'bigf0', 'cliff0', 'disp0', 'fade0'])
        assert len(terrain[bank]) == 386048
        atlases[bank] = decoder.object_texture(decoder.object_atlas(
            raw[f'data/bl320-{bank}.dat'], raw[f'data/pal0-{bank}.dat'],
            raw[f'data/al0-{bank}.dat'], rules['objectTextureAlpha']))
    _, _, current_atlas = decoder.read_owned_rgba_png(root / 'public/original/atlas.png')
    model_differences, shape_differences, tree_models, temples = [], [], [], []
    for key in sorted(models, key=int):
        number = int(key)
        decoded = {bank: decoder.decode_original_model(
            *(raw[f'objects/{kind}0-{bank}.dat'] for kind in ['objs', 'facs', 'pnts']),
            number)[0] for bank in [2, 6]}
        assert decoded[2] == models[key], 'Tracked model differs from bank2: ' + key
        if decoded[2] != decoded[6]:
            model_differences.append(dict(model=number, fields=[
                field for field in decoded[2] if decoded[2][field] != decoded[6][field]]))
        indices = {bank: list(struct.unpack_from(
            '<4b', raw[f'objects/objs0-{bank}.dat'], number * 54 + 44)) for bank in [2, 6]}
        assert indices[2] == shapes['objects'][number]
        if indices[2] != indices[6]:
            shape_differences.append(dict(model=number, bank2=indices[2], bank6=indices[6]))
        if 13 <= number <= 18:
            tree_models.append(dict(model=number, banks={bank: dict(
                decodedSha256=sha(json.dumps(decoded[bank], sort_keys=True,
                                            separators=(',', ':')).encode()),
                triangles=len(decoded[bank]['p']) // 9,
                scale=decoded[bank]['scale'], panelHeight=decoded[bank]['panelHeight'],
                tiles=sorted(set(decoded[bank]['tiles'])), shapeIndices=indices[bank])
                for bank in [2, 6]}))
        if 95 <= number <= 98:
            temples.append(dict(model=number, geometryEqual=decoded[2] == decoded[6],
                                tiles=sorted(set(decoded[2]['tiles']))))
    levels = []
    for name, number in [('one', 1), ('two', 2), ('three', 3)]:
        level = json.loads((root / f'app/level-{name}.ts').read_text()
                           .split('export default ', 1)[1].rstrip(';\n'))
        header = raw[f'levels/levl200{number}.hdr']
        assert sha(header) == level['headerSha256']
        assert [header[96], header[97]] == [level['landscapeBank'], level['objectBank']]
        levels.append(dict(mission=number, landscapeBank=header[96],
                           objectBank=header[97], resolvedObjectBank=2 if header[97] == 0 else header[97],
                           headerMatchesImported=True, treeModels=dict(collections.Counter(
                               obj['model'] for obj in level['objects']
                               if obj['type'] == 5 and obj['model'] <= 6))))
    source_files = ['scripts/import-original.py', 'scripts/extract-reference.py',
                    'app/original-rules.json', 'app/original-models.json', 'app/original-shapes.json',
                    'app/level-one.ts', 'app/level-two.ts', 'app/level-three.ts',
                    'public/original/atlas.png', 'public/original/landscape.bin']
    report = dict(
        scope='Missions 1-3; source/data only, no original or browser runtime execution',
        sourceCommit=args.source_commit, archiveSha256=archive_sha,
        decoderSha256=DECODER_SHA, binaryRefineryVersion=importlib.metadata.version('binary-refinery'),
        sourceFilesSha256={name: sha((root / name).read_bytes()) for name in source_files},
        members=members, inputHashes={name: dict(bytes=len(data), sha256=sha(data))
                                     for name, data in sorted(raw.items())}, levels=levels,
        terrain={bank: dict(bytes=len(data), sha256=sha(data),
                            equalsTracked=data == (root / 'public/original/landscape.bin').read_bytes())
                 for bank, data in terrain.items()},
        bankDifferences={kind: {bank: raw[f'data/{kind}-c.dat'] == raw[f'data/{kind}-{bank}.dat']
                               for bank in 'sp'}
                         for kind in ['pal0', 'al0', 'bl320', 'bigf0', 'cliff0', 'disp0', 'fade0']},
        currentAtlasEqualsFullC=current_atlas == atlases['c'],
        decodedAtlasRgbaSha256={bank: sha(data) for bank, data in atlases.items()},
        alphaEqualsC={bank: atlases[bank][3::4] == atlases['c'][3::4] for bank in 'sp'},
        tilesChangedFromC={bank: [n for n in range(256) if tile(atlases[bank], n) != tile(atlases['c'], n)]
                           for bank in 'sp'},
        treeTiles={n: {bank: sha(tile(data, n)) for bank, data in atlases.items()}
                   for n in [129, 136, 222, 231]},
        trackedModelCount=len(models), allTrackedModelsEqualBank2=True,
        modelDifferences=model_differences, shapeIndexDifferences=shape_differences,
        treeModels=tree_models, temples=temples,
        trackedShapeTableMatchesOriginal=True,
        shadowShapeDimensions={n: {key: shapes['shapes'][n][key]
                                  for key in ['width', 'height', 'x', 'y', 'offset']}
                               for n in [1, 5]},
    )
    formatted = json.dumps(report, indent=2, sort_keys=True)
    print(re.sub(r'\[\s+([0-9,\s]+)\s+\]',
                 lambda match: '[' + ', '.join(re.findall(r'\d+', match[1])) + ']', formatted))


if __name__ == '__main__':
    main()
