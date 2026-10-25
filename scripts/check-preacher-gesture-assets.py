#!/usr/bin/env python3
"""Verify the bounded Preacher append; read files and emit JSON, never import assets.

Usage: python3 -B scripts/check-preacher-gesture-assets.py GAME_ROOT [--repo-root ROOT]
Requires Python's standard library, git, the exact accepted baseline Git objects,
and the six original files pinned below. Does not execute original instructions.
"""

import argparse
import ast
import hashlib
import json
from pathlib import Path
import struct
import subprocess
import sys
from types import SimpleNamespace
import zlib


BASE = '169b5f38e8cc9f7aacbae222ba804ac519ec1f27'
MEASUREMENT_SHA256 = 'f9a471e8472bd54f460d8cfc900d6fe970dea8c1d16614b604e2300b6fe81953'
UNITS = 'app/original-units.json'
ATLAS = 'public/original/unit-layers.png'
PROVENANCE = 'public/original/provenance.json'
IMPORTER = 'scripts/import-original.py'
RULES = 'app/original-rules.json'
BASE_SHA256 = {'scripts/import-original.py': '958c6bf4ca1ee9515e6bd184d07f6b9927041332012f4b1fa4db1fe52abd1751',
 'app/original-units.json': '9937b9949047824db757960884eaa7941db014073b47c4b671046cfddf6f6909',
 'public/original/provenance.json': '535095682081ef7842fff65a169126448ef19bf93fede6fcad73279240c2923c',
 'public/original/unit-layers.png': '5b43e27e9ab1baf156fd092d0b50a0bb9f9a58bd162532e779441d583da71d7a'}
INPUTS = {'d3dpoptb.exe': {'sha256': '3a5065c7420b3fcde208bf220bc86dfbac95e025ab2492caf9c7ea5308dfbe4f',
                  'bytes': 2275840},
 'data/vstart-0.ani': {'sha256': '64a8975f234aa67eafc4d4d9edd7cc4aeba9f5743d028d8203e0c67ca199a1aa',
                       'bytes': 3168},
 'data/vfra-0.ani': {'sha256': 'c91720da3c636fb74cb749c5f8747ae884c1d76dbeed4b845f5a199ef1a55258',
                     'bytes': 31688},
 'data/vele-0.ani': {'sha256': 'e6158220383ae2f17db8d12844c16e4fb931030780fb3d02416fde303257a7c9',
                     'bytes': 160760},
 'data/hspr0-0.dat': {'sha256': '62e5cc915a16302670027bac9535f6b90f00e38694575294418dcefb04394655',
                      'bytes': 1471487},
 'data/pal0-c.dat': {'sha256': '6c61cd586fc96ef5f777c71966a9ac1875491a4a521342ba06d108df5e92bf53',
                     'bytes': 1024}}
# (source, width, height, SHA-256 of complete uncropped decoded RGBA rectangle).
# Transcribed from the accepted piece-measurement.json pinned above.
NEW_PIECES = [(6531, 24, 27, '471e1fca34158f0fa8aefec5ce17012f620e14e337df578d2ed760faee88ebb9'),
 (6532, 21, 27, 'b3702e36e246754f6f0242738bb80cf7a71fef2765c77615908c3f77a08357e6'),
 (6533, 21, 27, 'c7bd71170824253d31f6cd000320f091ab4da29d1543c24e346821f417034bf9'),
 (6534, 26, 27, '066bf43d2b5147f9d2185a9858edab0da956fdbb5425e3018396fe69a347e249'),
 (6535, 32, 30, '7eb1781dc39b268a83b77de1958126640d34cbf47045eec9892212ee36d200a6'),
 (6536, 32, 30, 'f3389e8fbadeff219dd041b98cb9ef053d32b7dd08c48f2e2b8f647e0600b032'),
 (6542, 24, 30, 'e49ccd438b163303ffee4ed0364ccbb3b93a0d9836fe5a62de9a92d9dfb389e7'),
 (6543, 19, 30, '811b84a8e908c1ab249131de6a7f8080b891b42ad1bac13961241b1fbfd718ae'),
 (6544, 19, 30, '9c84f25f10af09fdfcab90ef1f6d7a2185c28d6cfdf662b3d62fae7983a533c2'),
 (6545, 25, 30, '55390bddc9d0c4fc9633e4e23689a7a6fb417cee7f28bdfdf3f4e7014d0cef9a'),
 (6546, 29, 32, '34c54b157e0f51fde03b82d786d2ebf8b2ec20a0fe86f5fd3ff069f65ac41ec3'),
 (6547, 29, 32, '14e3506df448adf07e2fbe7dc949ef039636b614682dd6e365688c118eb8547c'),
 (6553, 19, 29, 'bcab4b27dcf4c839bf4193428aeb13ca526fc20859908e0fb7220f0f9bde990f'),
 (6554, 20, 29, '8f2ae4412fb82386dc755de98f963d148741b6ca1455df7682f8f0cc950074db'),
 (6555, 20, 29, '10b0938df98a83633cc1a9ea4c6ec6986815cbf8c92334ac56a4a38731a3f67f'),
 (6556, 23, 29, 'a0e7446993a1f7883a5d0b6e508d7c07cb87fa27d969b43c3dc32d532ffbfd34'),
 (6557, 25, 30, 'af6dcc4567b05a5f00f035e297b72f4b20743e6035dfdd8a7c9e74e1680b2b0a'),
 (6558, 25, 30, '94827200df86fa9136e26e9bb2a986740fca4ab472337bc10aaf5943e653ccbe'),
 (6563, 17, 28, '5c47ec6f7a133e82f6f9bb968440fae9cf7a7557cae85cda11349ef772d14dc5'),
 (6564, 17, 28, 'f34b85a0fe2e165c2db2e0f696925373d151cbffd8c08d5862a0884789bb7678'),
 (6565, 19, 28, 'f81f74c3a11e64fbb641482f90af132d199ba8b65f6961e896c346f9fb3e0e43'),
 (6566, 25, 31, '7268c70b3fb274cde8ac6509d142fb133649ee2d46f0ff1185f5734859aff3f4'),
 (6571, 20, 26, '3f3451c2edd6025ab6545f1b0d46c2e1eb29c665f2f90719a373ea82b15727d3'),
 (6572, 20, 28, '6318a490619676b3e0b329bd4bc234019462526d87d7d50a4d3a8d1e2aa7fc9e'),
 (6573, 24, 28, 'ba0f394ed04cddd188cc8cafb38d33f880efd19b4118615b6c9a1711c07a43b6'),
 (6574, 30, 31, '4500f9403ef0866f07e2f370dca37e3a8f7a77d8c0b3cfba2d5a37ab57b3b7ce'),
 (6585, 3, 6, 'd7cdd9ab2f6221596488e1932ba7f36c196fc4b9c162adc8132882e6fd4419f0'),
 (6586, 3, 6, 'd7cdd9ab2f6221596488e1932ba7f36c196fc4b9c162adc8132882e6fd4419f0'),
 (6594, 3, 6, 'd7cdd9ab2f6221596488e1932ba7f36c196fc4b9c162adc8132882e6fd4419f0'),
 (6601, 2, 6, '8e78bd9d40eb022cbbbcd1488e1a7447fbb6d8064534b7066dda84e835f98196'),
 (6611, 3, 6, 'd7cdd9ab2f6221596488e1932ba7f36c196fc4b9c162adc8132882e6fd4419f0'),
 (6619, 3, 6, '7c9ee51ec0537a0000bba122ef922d240bb4639d2e30e568cc50ad9838b6135c'),
 (6622, 3, 6, '7c9ee51ec0537a0000bba122ef922d240bb4639d2e30e568cc50ad9838b6135c'),
 (6625, 3, 6, '22b1e4bf7ffa174614818db8898783e94e69eb9780f29897b4e633e8f1bb2c22'),
 (6635, 3, 6, '22b1e4bf7ffa174614818db8898783e94e69eb9780f29897b4e633e8f1bb2c22'),
 (6645, 3, 6, '22b1e4bf7ffa174614818db8898783e94e69eb9780f29897b4e633e8f1bb2c22'),
 (6650, 2, 6, '548f3369b8abe660c49b33d10f32e56917f039a88c312aedc384e8d46f33af7f'),
 (6652, 2, 6, '548f3369b8abe660c49b33d10f32e56917f039a88c312aedc384e8d46f33af7f'),
 (6660, 3, 6, '22b1e4bf7ffa174614818db8898783e94e69eb9780f29897b4e633e8f1bb2c22'),
 (6668, 3, 6, '9030ef507607bce14e40b633a0bb20f9f80bb351c915d405a2418e763fa9b578'),
 (6671, 3, 6, '9030ef507607bce14e40b633a0bb20f9f80bb351c915d405a2418e763fa9b578'),
 (6674, 3, 6, '4fe7a8ae2de2098f02faae96e8ccb97302f9c9e68138a1905d2b5bf6fbbfc35d'),
 (6684, 3, 6, '4fe7a8ae2de2098f02faae96e8ccb97302f9c9e68138a1905d2b5bf6fbbfc35d'),
 (6688, 3, 5, '3360818f0045b0113fd417f0cce334ffb5332ab641de0ddc867dbfa4008825df'),
 (6694, 3, 6, '4fe7a8ae2de2098f02faae96e8ccb97302f9c9e68138a1905d2b5bf6fbbfc35d'),
 (6710, 3, 6, '4fe7a8ae2de2098f02faae96e8ccb97302f9c9e68138a1905d2b5bf6fbbfc35d'),
 (6711, 3, 6, '4fe7a8ae2de2098f02faae96e8ccb97302f9c9e68138a1905d2b5bf6fbbfc35d'),
 (6720, 3, 6, 'f4671d286fc134a271a04d962cbcb5683621c1e028cadd222f38360402bfe66c')]


def require(condition, message):
    if not condition:
        raise ValueError(message)


def sha(data):
    return hashlib.sha256(data).hexdigest()


def same(actual, expected, label):
    # JSON identity also distinguishes false from 0 and integers from floats.
    require(json.dumps(actual, sort_keys=True) == json.dumps(expected, sort_keys=True), label)


def git(repo, *args):
    return subprocess.check_output(
        ['git', '--no-optional-locks', '-C', str(repo), *args], stderr=subprocess.PIPE,
    )


def load_decoders(source):
    # Never import the module or execute its top-level body, main, or append paths.
    # The immutable baseline's complete source hash was verified before this call.
    names = {'sprites', 'read_owned_rgba_png'}
    nodes = [node for node in ast.parse(source).body
             if isinstance(node, ast.FunctionDef) and node.name in names]
    require(len(nodes) == 2 and {node.name for node in nodes} == names,
            'Expected exactly the two accepted decoder functions')
    namespace = {'struct': struct, 'zlib': zlib}
    exec(compile(ast.Module(body=nodes, type_ignores=[]),
                 'accepted-importer-decoders', 'exec', optimize=0), namespace)
    return namespace['sprites'], namespace['read_owned_rgba_png']


def png(decoder, data):
    return decoder(SimpleNamespace(read_bytes=lambda: data))


def coordinates(index, piece):
    return piece.get('atlasX', index % 32 * 64), piece.get('atlasY', index // 32 * 64)


def subslot(first_cell, offset):
    cell = first_cell + offset // 4
    return cell % 32 * 64 + offset % 2 * 32, cell // 32 * 64 + offset // 2 % 2 * 32


def rectangle(pixels, width, x, y, w, h):
    return b''.join(pixels[((y + row) * width + x) * 4:
                           ((y + row) * width + x + w) * 4] for row in range(h))


def check(game, repo):
    baseline = {path: git(repo, 'show', BASE + ':' + path) for path in BASE_SHA256}
    for path, expected in BASE_SHA256.items():
        require(sha(baseline[path]) == expected, 'Accepted baseline hash changed: ' + path)
    candidate = {path: (repo / path).read_bytes()
                 for path in (UNITS, ATLAS, PROVENANCE, IMPORTER, RULES)}
    before_hashes = {path: sha(data) for path, data in candidate.items()}
    old = json.loads(baseline[UNITS])
    units = json.loads(candidate[UNITS])
    old_provenance = json.loads(baseline[PROVENANCE])
    provenance = json.loads(candidate[PROVENANCE])
    same([len(old['frames']), len(old['pieces']), old['width'], old['height']],
         [5116, 4122, 2048, 8128], 'Wrong accepted baseline geometry/counts')
    same([len(units['frames']), len(units['pieces']), units['width'], units['height']],
         [5256, 4170, 2048, 8192], 'Require exactly +140 frames/+48 pieces and 2048x8192')
    same(sorted(units), sorted(old), 'Unexpected unit metadata fields')
    for key, value in old.items():
        if key not in {'height', 'frames', 'pieces', 'animations'}:
            same(units[key], value, 'Existing unit metadata changed: ' + key)
    same(units['frames'][:5116], old['frames'], 'Existing frame identity/order changed')
    same(units['pieces'][:4122], old['pieces'], 'Existing piece identity/coordinates changed')
    same(sorted(units['animations']), sorted(old['animations']), 'Animation signatures changed')
    for signature, states in old['animations'].items():
        for state, value in states.items():
            same(units['animations'][signature].get(state), value,
                 'Existing animation changed: ' + signature + '/' + state)
        if signature not in {'blue-preacher', 'red-preacher'}:
            same(units['animations'][signature], states, 'Unrelated animation additions: ' + signature)

    raw = {}
    for path, expected in INPUTS.items():
        raw[path] = (game / path).read_bytes()
        same({'sha256': sha(raw[path]), 'bytes': len(raw[path])}, expected,
             'Original input identity differs: ' + path)
        if path != 'd3dpoptb.exe':
            same(old_provenance['sha256'][path], expected['sha256'],
                 'Baseline provenance input identity differs: ' + path)
    sprites, read_png = load_decoders(baseline[IMPORTER])
    starts = list(struct.iter_unpack('<HH', raw['data/vstart-0.ani']))
    frames = list(struct.iter_unpack('<HBBBBH', raw['data/vfra-0.ani']))
    elements = list(struct.iter_unpack('<HhhHH', raw['data/vele-0.ani']))
    bank = sprites(raw['data/hspr0-0.dat'], raw['data/pal0-c.dat'])
    same([len(starts), len(bank)], [792, 7953], 'Unexpected original bank counts')

    def cycle(source):
        require(0 <= source < len(starts), 'VSTART index out of range')
        first, mirror = starts[source]
        frame, sequence, seen = first, [], set()
        while frame and frame not in seen:
            require(0 <= frame < len(frames), 'VFRA chain index out of range')
            seen.add(frame)
            sequence.append(frame)
            frame = frames[frame][-1]
        require(frame in (0, first), 'VFRA chain returns to a different frame')
        return sequence, bool(mirror)

    def layers(source):
        require(type(source) is int and 0 <= source < len(frames), 'Invalid frame source')
        element, result, seen = frames[source][0], [], set()
        while element:
            require(0 <= element < len(elements) and element not in seen,
                    'Invalid or cyclic VELE chain')
            seen.add(element)
            reference, x, y, flags, element = elements[element]
            require(reference > 0 and reference % 6 == 0 and reference // 6 <= len(bank),
                    'Invalid VELE sprite reference')
            result.append((reference // 6 - 1, x, y, flags))
        return result

    same(units['frameCounts'], [len(cycle(i)[0]) & 255 for i in range(len(starts))],
         'Frame-count table differs from original VFRA chains')
    needed_frames = {frame for source in range(176, 192) for frame in cycle(source)[0]}
    needed_pieces = {piece for frame in needed_frames for piece, *_ in layers(frame)}
    new_frames = sorted(needed_frames - {frame['source'] for frame in old['frames']})
    new_sources = sorted(needed_pieces - {piece['source'] for piece in old['pieces']})
    same([len(new_frames), len(new_sources)], [140, 48], 'Original gesture append counts differ')
    same(new_sources, [piece[0] for piece in NEW_PIECES], 'Accepted missing-piece set differs')
    same([frame['source'] for frame in units['frames'][5116:]], new_frames,
         'New frames must append exact missing source IDs in sorted order')
    same([piece['source'] for piece in units['pieces'][4122:]], new_sources,
         'New pieces must append exact missing source IDs in sorted order')
    piece_index = {piece['source']: index for index, piece in enumerate(units['pieces'])}
    require(len(piece_index) == 4170, 'Duplicate piece sources')
    frame_index = {}
    for index, frame in enumerate(units['frames']):
        source = frame['source']
        frame_index.setdefault(source, index)
        expected = {
            'source': source, 'nativeWidth': frames[source][1], 'nativeHeight': frames[source][2],
            'layers': [{'piece': piece_index[piece], 'x': x, 'y': y, 'flags': flags}
                       for piece, x, y, flags in layers(source)],
        }
        same(frame, expected, 'VFRA/VELE mapping differs at frame index ' + str(index))

    rules = json.loads(candidate[RULES])
    for obj, expected in ((95, [160, 19]), (97, [168, 14]), (98, [176, 14]), (99, [184, 14])):
        same(rules['animationObjects'][obj], expected, 'Wrong Preacher animation object ' + str(obj))
    gesture_states = {}
    for team in ('blue', 'red'):
        signature = team + '-preacher'
        states = units['animations'][signature]
        added = sorted(states.keys() - old['animations'][signature].keys())
        require(len(added) == 2, 'Require exactly two new states for ' + signature)
        by_source = {}
        for state in added:
            directions = states[state]
            require(isinstance(directions, list) and len(directions) == 8,
                    'Require eight directions for ' + signature + '/' + state)
            source = directions[0]['source']
            require(source in (176, 184) and source not in by_source,
                    'Require one state each for sources 176 and 184: ' + signature)
            expected = []
            for direction in range(8):
                sequence, mirror = cycle(source + direction)
                require(bool(sequence), 'Empty gesture direction')
                expected.append({'frames': [frame_index[frame] for frame in sequence],
                                 'flip': mirror, 'source': source + direction})
            same(directions, expected, 'Direction/mirror/VFRA mapping differs: ' + signature + '/' + state)
            by_source[source] = state
        gesture_states[signature] = by_source
    same(gesture_states['blue-preacher'], gesture_states['red-preacher'],
         'Blue/red Preacher gesture state names differ')

    old_width, old_height, old_pixels = png(read_png, baseline[ATLAS])
    width, height, pixels = png(read_png, candidate[ATLAS])
    same([old_width, old_height, width, height], [2048, 8128, 2048, 8192], 'Wrong decoded atlas dimensions')
    same(old_provenance['unitAtlasSha256'], sha(baseline[ATLAS]), 'Baseline atlas provenance differs')
    same(provenance, dict(old_provenance, animationFrames=5256, spritePieces=4170,
                          unitAtlasSha256=sha(candidate[ATLAS])),
         'Provenance changed outside the exact counts and atlas hash')
    require(all('atlasX' not in piece and 'atlasY' not in piece for piece in old['pieces'][:4042]),
            'Accepted full-cell layout differs')
    for offset, piece in enumerate(units['pieces'][4042:4122]):
        same([piece.get('atlasX'), piece.get('atlasY')], list(subslot(4042, offset)),
             'Existing firing subslot moved: ' + str(offset))
        require(0 < piece['w'] <= 32 and 0 < piece['h'] <= 32, 'Firing piece exceeds subslot')
    for cell in (4062, 4063):
        x, y = cell % 32 * 64, cell // 32 * 64
        require(not any(rectangle(old_pixels, old_width, x, y, 64, 64)),
                'Declared old tail cell is not completely zero: ' + str(cell))

    added_rows = {}
    piece_report = []
    for offset, (source, w, h, expected_hash) in enumerate(NEW_PIECES):
        x, y = subslot(4062, offset)
        same(units['pieces'][4122 + offset],
             {'source': source, 'w': w, 'h': h, 'atlasX': x, 'atlasY': y},
             'New piece differs from exact accepted rectangle: ' + str(source))
        same([*bank[source][:2], sha(bank[source][2])], [w, h, expected_hash],
             'Original decoded RGBA differs from retained measurement: ' + str(source))
        require(0 < w <= 32 and 0 < h <= 32, 'Uncropped piece exceeds 32px subslot')
        require((y < 8128) == (offset < 8), 'Wrong old-tail versus new-row piece split')
        actual_hash = sha(rectangle(pixels, width, x, y, w, h))
        same(actual_hash, expected_hash, 'New atlas RGBA hash differs: ' + str(source))
        piece_report.append({'index': 4122 + offset, 'source': source, 'x': x, 'y': y,
                             'width': w, 'height': h, 'rgbaSha256': actual_hash})
        for row in range(y, y + h):
            added_rows.setdefault(row, []).append((x, x + w))

    occupied_rows = {}
    for index, piece in enumerate(units['pieces']):
        source = piece['source']
        require(type(source) is int and 0 <= source < len(bank), 'Invalid piece source')
        w, h, rgba = bank[source]
        same([piece['w'], piece['h']], [w, h], 'Piece dimensions differ: ' + str(index))
        x, y = coordinates(index, piece)
        require(type(x) is int and type(y) is int and 0 <= x and 0 <= y and
                w > 0 and h > 0 and x + w <= width and y + h <= height,
                'Piece rectangle out of bounds: ' + str(index))
        require(rectangle(pixels, width, x, y, w, h) == rgba,
                'Candidate piece RGBA differs from original: ' + str(index))
        if index < 4122:
            require(y + h <= old_height and rectangle(old_pixels, old_width, x, y, w, h) == rgba,
                    'Accepted old piece RGBA differs from original: ' + str(index))
        for row in range(y, y + h):
            occupied_rows.setdefault(row, []).append((x, x + w, index))
    for row, intervals in occupied_rows.items():
        intervals.sort()
        for previous, current in zip(intervals, intervals[1:]):
            require(previous[1] <= current[0],
                    f'Piece rectangles overlap on row {row}: {previous[2]} and {current[2]}')

    # Compare every RGBA byte, including transparent RGB and unused cell padding.
    # Only the 48 exact width-by-height new rectangles are excluded here; their
    # complete bytes were independently compared against the original bank above.
    preserved_old_pixels = verified_new_zero_pixels = 0
    for row in range(height):
        left = 0
        for start, end in sorted(added_rows.get(row, [])) + [(width, width)]:
            require(left <= start, 'New piece rectangles overlap')
            at, until = (row * width + left) * 4, (row * width + start) * 4
            if row < old_height:
                require(pixels[at:until] == old_pixels[at:until],
                        f'Old-area pixels changed outside exact new rectangles: row {row}, x {left}:{start}')
                preserved_old_pixels += start - left
            else:
                require(not any(pixels[at:until]),
                        f'New-row pixels outside exact new rectangles must be zero: row {row}, x {left}:{start}')
                verified_new_zero_pixels += start - left
            left = end

    # Reject source drift during the read-only check, without writing a receipt.
    for path, expected in before_hashes.items():
        same(sha((repo / path).read_bytes()), expected, 'Candidate changed during check: ' + path)
    for path, expected in INPUTS.items():
        same(sha((game / path).read_bytes()), expected['sha256'], 'Original input changed during check: ' + path)
    return {
        'status': 'passed', 'acceptedHead': BASE, 'candidateHead': git(repo, 'rev-parse', 'HEAD').decode().strip(),
        'scope': 'Exact append and decoded asset preservation; no importer, native instructions, or renderer executed.',
        'measurementSha256': MEASUREMENT_SHA256, 'checkerSha256': sha(Path(__file__).read_bytes()),
        'baselineSha256': BASE_SHA256, 'candidateSha256': before_hashes, 'originalInputs': INPUTS,
        'frames': {'before': 5116, 'added': 140, 'after': 5256},
        'pieces': {'before': 4122, 'added': 48, 'after': 4170}, 'gestureStates': gesture_states,
        'atlas': {'width': width, 'height': height, 'baselineRgbaSha256': sha(old_pixels),
                  'candidateRgbaSha256': sha(pixels), 'oldCoordinatesPreserved': 4122,
                  'firingSubslotsPreserved': 80, 'oldTailNewSubslots': 8, 'newRowSubslots': 40,
                  'oldPixelsOutsideExactAddedRectanglesPreserved': preserved_old_pixels,
                  'newPixelsOutsideExactAddedRectanglesVerifiedZero': verified_new_zero_pixels,
                  'pieceRectanglesNonoverlapping': True}, 'newPieceRectangles': piece_report,
        'limits': ['No runtime, WebGL upload, hardware texture-limit, audio, save/load, or gameplay claim.',
                   'Does not execute the importer or establish its repeat-run/full-import behavior.'],
    }


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('game_root', type=Path)
    parser.add_argument('--repo-root', type=Path, default=Path(__file__).resolve().parents[1])
    args = parser.parse_args()
    try:
        report = check(args.game_root.resolve(), args.repo_root.resolve())
    except (AssertionError, ValueError, KeyError, IndexError, TypeError, OSError,
            struct.error, zlib.error, subprocess.CalledProcessError) as error:
        print(json.dumps({'status': 'failed', 'acceptedHead': BASE,
                          'error': f'{type(error).__name__}: {error}'}, indent=2))
        return 1
    print(json.dumps(report, indent=2))
    return 0


if __name__ == '__main__':
    sys.exit(main())
