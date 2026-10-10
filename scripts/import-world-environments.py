"""Import only s/p terrain/full atlases and six bank6 tree records.

Read hash-pinned Component0 DATA with the existing Binary Refinery runtime.
Never execute the installer, original instructions or broad importer main.
--check regenerates in memory/temporary files and compares owned outputs.
"""
import argparse
import hashlib
import importlib.metadata
import importlib.util
import json
from pathlib import Path
import struct
import tempfile
import zipfile

from refinery.lib.inno.archive import InnoArchive

ROOT = Path(__file__).resolve().parents[1]
PINS = json.loads((ROOT / 'scripts/authored-environment-inputs.json').read_text())


def sha(data):
    return hashlib.sha256(data).hexdigest()


def canonical(data):
    return json.dumps(data, sort_keys=True, separators=(',', ':')).encode()


def generate(archive_path, project):
    assert importlib.metadata.version('binary-refinery') == '0.10.11'
    with archive_path.open('rb') as stream:
        assert hashlib.file_digest(stream, 'sha256').hexdigest() == PINS['archiveSha256']
    for name, expected in PINS['sourceFilesSha256'].items():
        assert sha((project / name).read_bytes()) == expected, 'Changed preserved source: ' + name
    script = project / 'scripts/import-original.py'
    assert sha(script.read_bytes()) == PINS['decoderSha256']
    spec = importlib.util.spec_from_file_location('world_environment_decoder', script)
    decoder = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(decoder)
    with zipfile.ZipFile(archive_path) as archive:
        names = [n for n in archive.namelist()
                 if Path(n).name.lower() == 'setup_populous_the_beginning.exe']
        assert len(names) == 1, 'Ambiguous canonical installer member'
        installer = InnoArchive(bytearray(archive.read(names[0])))
    raw, members = {}, []
    for entry in installer.files:
        if entry.setup.Condition.Components not in ('', 'Component0'):
            continue
        if not entry.path.lower().startswith('data/{app}/'):
            continue
        name = entry.path.lower().removeprefix('data/{app}/')
        if name not in PINS['inputHashes']:
            continue
        content = installer.read_file_and_check(entry)
        expected = PINS['inputHashes'][name]
        assert len(content) == expected['bytes'] and sha(content) == expected['sha256'], name
        assert name not in raw or raw[name] == content, 'Ambiguous DATA member: ' + name
        raw[name] = content
        members.append(dict(path=entry.path, component=entry.setup.Condition.Components))
    assert raw.keys() == PINS['inputHashes'].keys(), 'Missing scoped DATA'
    rules = json.loads((project / 'app/original-rules.json').read_text())
    current = json.loads((project / 'app/original-models.json').read_text())
    shapes = json.loads((project / 'app/original-shapes.json').read_text())
    source_shapes = decoder.building_shapes(raw['objects/shapes.dat'], raw['objects/objs0-2.dat'])
    # socketOffsets also depend on smoke.txt, outside this DATA-only import.
    # The complete preserved file is hash-pinned above; compare only fields
    # actually decoded from the admitted SHAPES/OBJS inputs.
    for field in ['objects', 'origins', 'shapes', 'cells']:
        assert source_shapes[field] == shapes[field], 'Changed shape field: ' + field
    _, _, base_atlas = decoder.read_owned_rgba_png(project / 'public/original/atlas.png')
    files, decoded_hashes = {}, {}
    with tempfile.TemporaryDirectory(prefix='world-environment-') as temporary:
        for bank in 'csp':
            terrain = b''.join(raw[f'data/{kind}-{bank}.dat'] for kind in
                               ['pal0', 'bigf0', 'cliff0', 'disp0', 'fade0'])
            assert len(terrain) == 386048 and sha(terrain) == PINS['terrain'][bank]['sha256']
            pixels = decoder.object_texture(decoder.object_atlas(
                raw[f'data/bl320-{bank}.dat'], raw[f'data/pal0-{bank}.dat'],
                raw[f'data/al0-{bank}.dat'], rules['objectTextureAlpha']))
            assert sha(pixels) == PINS['decodedAtlasRgbaSha256'][bank]
            assert pixels[3::4] == base_atlas[3::4], 'Alpha changed: ' + bank
            decoded_hashes[bank] = sha(pixels)
            if bank == 'c':
                assert terrain == (project / 'public/original/landscape.bin').read_bytes()
                assert pixels == base_atlas
                continue
            files[f'public/original/landscape-{bank}.bin'] = terrain
            target = Path(temporary) / f'atlas-{bank}.png'
            decoder.png(target, 256, 1024, pixels)
            files[f'public/original/atlas-{bank}.png'] = target.read_bytes()
    models, indices = {}, {}
    for key, preserved in current.items():
        number = int(key)
        decoded = {bank: decoder.decode_original_model(
            *(raw[f'objects/{kind}0-{bank}.dat'] for kind in ['objs', 'facs', 'pnts']),
            number)[0] for bank in [2, 6]}
        assert decoded[2] == preserved, 'Preserved bank2 model changed: ' + key
        if 13 <= number <= 18:
            expected = next(row['banks']['6'] for row in PINS['treeModels'] if row['model'] == number)
            assert sha(canonical(decoded[6])) == expected['decodedSha256']
            shape = list(struct.unpack_from('<4b', raw['objects/objs0-6.dat'], number * 54 + 44))
            assert shape == expected['shapeIndices']
            models[key], indices[key] = decoded[6], shape
        else:
            assert decoded[6] == preserved, 'Unexpected bank6 model difference: ' + key
    files['app/original-models-bank6.json'] = (json.dumps(dict(models=models, shapes=indices), separators=(',', ':')) + '\n').encode()
    provenance = dict(sourceInventoryCommit=PINS['sourceInventoryCommit'],
                      archiveSha256=PINS['archiveSha256'], decoderSha256=PINS['decoderSha256'],
                      binaryRefineryVersion='0.10.11', inputHashes=PINS['inputHashes'], members=members,
                      preservedSourceFilesSha256=PINS['sourceFilesSha256'],
                      decodedAtlasRgbaSha256=decoded_hashes,
                      outputs={p: dict(bytes=len(b), sha256=sha(b)) for p, b in files.items()})
    files['public/original/world-environments.json'] = (json.dumps(provenance, indent=2) + '\n').encode()
    return files


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('archive', type=Path)
    parser.add_argument('--project', type=Path, default=ROOT)
    parser.add_argument('--check', action='store_true')
    args = parser.parse_args()
    files = generate(args.archive, args.project)
    for name, content in files.items():
        target = args.project / name
        if args.check:
            assert target.read_bytes() == content, 'Generated output mismatch: ' + name
        else:
            target.write_bytes(content)
    print(json.dumps(dict(status='checked' if args.check else 'generated',
                         outputs={p: dict(bytes=len(b), sha256=sha(b)) for p, b in files.items()}), indent=2))


if __name__ == '__main__':
    main()
