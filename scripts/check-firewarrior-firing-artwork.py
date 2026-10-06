"""Read-only original-frame/layer/pixel and append-preservation check.

Uses the importer only for its PNG/RLE decoders; traverses native animation tables
and verifies all old metadata/pixels independently. Does not execute original code.
"""
import argparse
import hashlib
import importlib.util
import json
from pathlib import Path
import struct
import subprocess
import tempfile

ROOT = Path(__file__).resolve().parents[1]
BASE = 'b0208188b8de345a6ad5e86cb7c49769624dda86'


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('game', type=Path)
    parser.add_argument('--write-witness', type=Path, help='Create the explicitly requested immutable CI pixel witness once')
    args = parser.parse_args()
    read_base = lambda name: subprocess.check_output(['git', 'show', BASE + ':' + name], cwd=ROOT)
    sha = lambda value: hashlib.sha256(value).hexdigest()
    old = json.loads(read_base('app/original-units.json'))
    new = json.loads((ROOT / 'app/original-units.json').read_text())
    previous = json.loads(read_base('public/original/provenance.json'))
    provenance = json.loads((ROOT / 'public/original/provenance.json').read_text())
    assert new['frames'][:len(old['frames'])] == old['frames']
    assert new['pieces'][:len(old['pieces'])] == old['pieces']
    assert len(new['frames']) - len(old['frames']) == 25
    assert len(new['pieces']) - len(old['pieces']) == 80
    for key in old.keys() - {'frames', 'pieces', 'animations'}:
        assert new[key] == old[key], key
    assert new.keys() == old.keys()
    stripped = json.loads(json.dumps(new['animations']))
    for team in ('blue', 'red'):
        del stripped[team + '-firewarrior']['firing']
    assert stripped == old['animations']
    for key in previous.keys() - {'animationFrames', 'spritePieces', 'unitAtlasSha256'}:
        assert provenance[key] == previous[key], key
    assert provenance.keys() == previous.keys()
    assert provenance['animationFrames'] == len(new['frames'])
    assert provenance['spritePieces'] == len(new['pieces'])
    assert provenance['unitAtlasSha256'] == sha((ROOT / 'public/original/unit-layers.png').read_bytes())

    spec = importlib.util.spec_from_file_location('asset_decoder', ROOT / 'scripts/import-original.py')
    decoder = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(decoder)
    with tempfile.TemporaryDirectory(prefix='firing-artwork-') as temporary:
        base_png = Path(temporary) / 'base.png'
        base_png.write_bytes(read_base('public/original/unit-layers.png'))
        ow, oh, before = decoder.read_owned_rgba_png(base_png)
    nw, nh, after = decoder.read_owned_rgba_png(ROOT / 'public/original/unit-layers.png')
    assert ow == nw == old['width'] == new['width']
    assert (ow, oh, nw, nh) == (2048, 8128, 2048, 8128)
    assert (oh, nh) == (old['height'], new['height'])
    # Newly appended pieces may fill only unused cells at the tail of the old
    # final row. Every older full cell, including its padding, remains exact.
    cell, columns = old['cell'], old['columns']
    for index in range(len(old['pieces'])):
        x, y = (index % columns) * cell, (index // columns) * cell
        for row in range(cell):
            at = ((y + row) * ow + x) * 4
            assert before[at:at + cell * 4] == after[at:at + cell * 4], index

    inputs = {}
    for name in ('vstart-0.ani', 'vfra-0.ani', 'vele-0.ani', 'hspr0-0.dat', 'pal0-c.dat'):
        data = (args.game / 'data' / name).read_bytes()
        assert sha(data) == previous['sha256']['data/' + name], name
        inputs[name] = data
    starts = list(struct.iter_unpack('<HH', inputs['vstart-0.ani']))
    frames = list(struct.iter_unpack('<HBBBBH', inputs['vfra-0.ani']))
    elements = list(struct.iter_unpack('<HhhHH', inputs['vele-0.ani']))
    bank = decoder.sprites(inputs['hspr0-0.dat'], inputs['pal0-c.dat'])
    source_frames = set()
    source_pieces = set()
    for team in ('blue', 'red'):
        directions = new['animations'][team + '-firewarrior']['firing']
        assert len(directions) == 8
        for direction, animation in enumerate(directions):
            first, mirror = starts[56 + direction]
            frame, sequence = first, []
            while frame and frame not in sequence:
                sequence.append(frame)
                frame = frames[frame][-1]
            assert frame == first and len(sequence) == 5
            assert animation['source'] == 56 + direction
            assert animation['flip'] is bool(mirror)
            assert [new['frames'][i]['source'] for i in animation['frames']] == sequence
            for index in animation['frames']:
                record = new['frames'][index]
                source_frames.add(record['source'])
                raw = frames[record['source']]
                assert (record['nativeWidth'], record['nativeHeight']) == raw[1:3]
                element, expected, seen = raw[0], [], set()
                while element:
                    assert element not in seen
                    seen.add(element)
                    ref, x, y, flags, element = elements[element]
                    assert ref % 6 == 0
                    expected.append((ref // 6 - 1, x, y, flags))
                actual = [(new['pieces'][layer['piece']]['source'], layer['x'], layer['y'], layer['flags'])
                          for layer in record['layers']]
                assert actual == expected
                source_pieces.update(piece for piece, *_ in expected)
    assert source_frames == set(range(90, 115))
    assert source_frames == {frame['source'] for frame in new['frames'][len(old['frames']):]}
    old_sources = {piece['source'] for piece in old['pieces']}
    assert source_pieces & old_sources == {22}, 'Only the existing shared shadow is reused'
    assert source_pieces - old_sources == {piece['source'] for piece in new['pieces'][len(old['pieces']):]}
    expected_pixels = bytearray(before)
    destinations = set()
    for offset, piece in enumerate(new['pieces'][len(old['pieces']):]):
        assert max(piece['w'], piece['h']) <= 32
        x, y = piece['atlasX'], piece['atlasY']
        container = 4042 + offset // 4
        assert (x, y) == ((container % 32) * 64 + (offset % 2) * 32,
                          (container // 32) * 64 + ((offset // 2) % 2) * 32)
        assert 0 <= x <= nw - 32 and 0 <= y <= nh - 32
        assert (y // 64) * 32 + x // 64 >= len(old['pieces'])
        for row in range(32):
            at = ((y + row) * nw + x) * 4
            assert not any(before[at:at + 32 * 4]), 'Only prior empty cells can be filled'
            for column in range(32):
                pixel = (y + row) * nw + x + column
                assert pixel not in destinations, 'Appended subslots must not overlap'
                destinations.add(pixel)
        width, height, rgba = bank[piece['source']]
        for row in range(height):
            at = ((y + row) * nw + x) * 4
            expected_pixels[at:at + width * 4] = rgba[row * width * 4:(row + 1) * width * 4]
    assert after == expected_pixels, 'Every other atlas byte, including padding, must stay unchanged'
    for index, piece in enumerate(new['pieces']):
        width, height, rgba = bank[piece['source']]
        assert (piece['w'], piece['h']) == (width, height)
        x = piece.get('atlasX', (index % columns) * cell)
        y = piece.get('atlasY', (index // columns) * cell)
        for row in range(height):
            at = ((y + row) * nw + x) * 4
            assert after[at:at + width * 4] == rgba[row * width * 4:(row + 1) * width * 4]
    if args.write_witness:
        # Preparation only: pin original input-derived pixels, never consume or
        # update this witness during ordinary verification or CI tests.
        witness = {
            'historical': {'commit': BASE, 'pngSha256': sha(read_base('public/original/unit-layers.png')),
                           'rgbaSha256': sha(before)},
            'atlas': {'width': ow, 'height': oh, 'columns': columns, 'cell': cell,
                      'oldFrames': len(old['frames']), 'oldPieces': len(old['pieces'])},
            'nativeInputs': {'data/' + name: sha(data) for name, data in inputs.items()},
            'pieces': [{**piece, 'rgbaSha256': sha(bank[piece['source']][2])}
                       for piece in new['pieces'][len(old['pieces']):]],
        }
        with args.write_witness.open('x') as output:
            json.dump(witness, output, indent=2)
            output.write('\n')
    print(json.dumps({'status': 'passed', 'base': BASE, 'oldFrames': len(old['frames']),
                      'oldPieces': len(old['pieces']), 'addedFrames': 25, 'addedPieces': 80,
                      'sharedShadowSource': 22, 'atlasDimensions': [nw, nh],
                      'disjointPriorEmptySubslots': len(destinations) // (32 * 32),
                      'allOldCellsAndOccupiedBytesPreserved': True,
                      'originalFrameLayerPiecePixels': 'passed', 'atlasSha256': provenance['unitAtlasSha256']}))


if __name__ == '__main__':
    main()
