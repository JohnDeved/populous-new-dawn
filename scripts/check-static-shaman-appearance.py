"""Verify imported Shaman chains and original pixels without executing native code.

Usage: python3 -B scripts/check-static-shaman-appearance.py --data-root GAME_ROOT
Optional --baseline-dir DIR accepts original-units.json and unit-layers.png from
an earlier reviewed revision, for independent append-only occupied-pixel checks.
Requires the existing Pillow dependency used by native asset checks.
"""
import argparse
import hashlib
import importlib.util
import json
import struct
from pathlib import Path
from PIL import Image

ROOT = Path(__file__).resolve().parents[1]


def digest(data):
    return hashlib.sha256(data).hexdigest()


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--data-root', type=Path, required=True)
    parser.add_argument('--baseline-dir', type=Path)
    parser.add_argument('--output', type=Path)
    args = parser.parse_args()
    if args.output and args.output.exists():
        raise ValueError('Keep previous receipts; choose a new output file')
    units = json.loads((ROOT / 'app/original-units.json').read_text())
    provenance = json.loads((ROOT / 'public/original/provenance.json').read_text())
    raw = {}
    identities = []
    for name in ['vstart-0.ani', 'vfra-0.ani', 'vele-0.ani', 'hspr0-0.dat', 'pal0-c.dat']:
        data = (args.data_root / 'data' / name).read_bytes()
        assert digest(data) == provenance['sha256']['data/' + name], name
        raw[name] = data
        identities.append({'path': 'data/' + name, 'bytes': len(data), 'sha256': digest(data)})
    spec = importlib.util.spec_from_file_location('original_assets', ROOT / 'scripts/import-original.py')
    importer = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(importer)
    bank = importer.sprites(raw['hspr0-0.dat'], raw['pal0-c.dat'])
    starts = list(struct.iter_unpack('<HH', raw['vstart-0.ani']))
    frames = list(struct.iter_unpack('<HBBBBH', raw['vfra-0.ani']))
    elements = list(struct.iter_unpack('<HhhHH', raw['vele-0.ani']))
    atlas_path = ROOT / 'public/original/unit-layers.png'
    atlas = Image.open(atlas_path).convert('RGBA')
    assert atlas.size == (units['width'], units['height'])
    assert digest(atlas_path.read_bytes()) == provenance['unitAtlasSha256']
    piece_hashes = []
    for index, piece in enumerate(units['pieces']):
        w, h, rgba = bank[piece['source']]
        assert (w, h) == (piece['w'], piece['h'])
        x, y = index % units['columns'] * units['cell'], index // units['columns'] * units['cell']
        assert atlas.crop((x, y, x + w, y + h)).tobytes() == rgba, ('original pixel', index)
        piece_hashes.append(digest(rgba))
    for packed, frame in enumerate(units['frames']):
        source = frames[frame['source']]
        assert (frame['nativeWidth'], frame['nativeHeight']) == source[1:3]
        element, seen, layers = source[0], set(), []
        while element:
            assert element not in seen
            seen.add(element)
            reference, x, y, flags, element = elements[element]
            assert reference % 6 == 0
            layers.append((reference // 6 - 1, x, y, flags))
        actual = [(units['pieces'][layer['piece']]['source'], layer['x'], layer['y'], layer['flags'])
                  for layer in frame['layers']]
        assert actual == layers, ('original layers', packed)
    cases = 0
    for source, directions in units['shamanSources'].items():
        assert len(directions) == 8
        for direction, cycle in enumerate(directions):
            first, flip = starts[int(source) + direction]
            frame, sequence = first, []
            while frame and frame not in sequence:
                sequence.append(frame)
                frame = frames[frame][-1]
            assert frame in (0, first)
            assert cycle['source'] == int(source) + direction
            assert cycle['flip'] == bool(flip)
            assert [units['frames'][index]['source'] for index in cycle['frames']] == sequence
            assert len(sequence) == units['frameCounts'][int(source) + direction]
            cases += 1
    for tribe, team in enumerate(['blue', 'red', 'yellow', 'green']):
        for name, baseline in units['animations']['blue-shaman'].items():
            source = baseline[0]['source'] + tribe * 8
            for existing, canonical in zip(units['animations'][team + '-shaman'][name], units['shamanSources'][str(source)]):
                assert existing['source'] == canonical['source'] and existing['flip'] == canonical['flip']
                assert [units['frames'][i]['source'] for i in existing['frames']] == [units['frames'][i]['source'] for i in canonical['frames']]
    fixture = json.loads((ROOT / 'tests/fixtures/unit-sprites.json').read_text())
    assert len(fixture['pieceHashes']) == 3216 and len(fixture['cases']) == 576
    assert piece_hashes[:3216] == fixture['pieceHashes']
    preservation = None
    if args.baseline_dir:
        old = json.loads((args.baseline_dir / 'original-units.json').read_text())
        previous = Image.open(args.baseline_dir / 'unit-layers.png').convert('RGBA')
        assert units['frames'][:len(old['frames'])] == old['frames']
        assert units['pieces'][:len(old['pieces'])] == old['pieces']
        assert units['frameCounts'] == old['frameCounts']
        assert all(units['animations'][name] == value for name, value in old['animations'].items())
        for index, piece in enumerate(old['pieces']):
            x, y = index % old['columns'] * old['cell'], index // old['columns'] * old['cell']
            rectangle = (x, y, x + piece['w'], y + piece['h'])
            assert previous.crop(rectangle).tobytes() == atlas.crop(rectangle).tobytes(), index
        preservation = {
            'oldFrames': len(old['frames']), 'oldPieces': len(old['pieces']),
            'oldFramesSha256': digest(json.dumps(old['frames'], separators=(',', ':')).encode()),
            'oldPiecesSha256': digest(json.dumps(old['pieces'], separators=(',', ':')).encode()),
            'oldAnimationsSha256': digest(json.dumps(old['animations'], separators=(',', ':')).encode()),
            'oldPieceHashesSha256': digest(json.dumps(piece_hashes[:len(old['pieces'])], separators=(',', ':')).encode()),
            'addedFrames': len(units['frames']) - len(old['frames']),
            'addedPieces': len(units['pieces']) - len(old['pieces']),
        }
    # Byte-derived unscaled submissions for the bounded GPU check. This is not
    # a new native execution claim; the no-owner/shadow/mirror rules are the
    # retained0045efd0 contract used by existing native sprite/HUD fixtures.
    packed = {piece['source']: i for i, piece in enumerate(units['pieces'])}
    pixel_cases = []
    for tribe, team in enumerate(['blue', 'red', 'yellow', 'green']):
        for action, base in [('idle',424),('walk',616),('attack',456),('cast',648),('launch',584),('bodyDeath',680)]:
            for direction in range(8):
                first, mirror = starts[base + tribe * 8 + direction]
                frame, sequence = first, []
                while frame and frame not in sequence:
                    sequence.append(frame); frame = frames[frame][-1]
                for step in sorted({0, len(sequence) - 1}):
                    draws = []; element = frames[sequence[step]][0]
                    while element:
                        ref, x, y, flags, element = elements[element]
                        if ((flags >> 4) & 31) == 0 and flags >> 9 == 1:
                            continue
                        piece = ref // 6 - 1; w, h, _ = bank[piece]
                        draws.append({'piece':packed[piece], 'x':-(x+w) if mirror else x, 'y':y, 'w':w, 'h':h, 'flags':(flags & 15) ^ int(bool(mirror))})
                    pixel_cases.append({'team':team,'action':action,'base':base,'direction':direction,'step':step,'draws':draws})
    result = {
        'status': 'PASS_STATIC_SHAMAN_ASSETS', 'scriptSha256': digest(Path(__file__).read_bytes()),
        'inputIdentities': identities, 'originalFrames': len(units['frames']),
        'originalPieces': len(units['pieces']), 'directionalSources': cases,
        'atlasSha256': digest(atlas_path.read_bytes()), 'atlasSize': list(atlas.size),
        'reviewedLayerFixtures': 576, 'reviewedPieceHashes': 3216,
        'preservation': preservation, 'pixelCases': pixel_cases,
        'referenceKind': 'static original layer bytes with retained no-owner/mirror/shadow contract; no new native execution',
        'limits': 'Original byte/asset comparison, not native execution, browser rendering or gameplay/performance acceptance.',
    }
    if args.output:
        with args.output.open('x') as output:
            json.dump(result, output, indent=2)
            output.write('\n')
    print(json.dumps({key: value for key, value in result.items() if key != 'pixelCases'}, indent=2))


if __name__ == '__main__':
    main()
