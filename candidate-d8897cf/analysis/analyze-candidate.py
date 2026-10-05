"""Finite offline checks for cb57bd7 ordinary Mission1 raw rows; no game execution."""
import argparse
from collections import Counter
import hashlib
import json
from pathlib import Path
import subprocess

parser = argparse.ArgumentParser()
parser.add_argument('--observations', type=Path, required=True)
parser.add_argument('--source-root', type=Path, required=True)
parser.add_argument('--expected-source', required=True)
parser.add_argument('--output', type=Path, required=True)
args = parser.parse_args()
DRIVER = 'cb57bd7076cedb08b042b6f8ad843b088fc613ae6863f3fed3742944eb88a060'
sha = lambda value: hashlib.sha256(value).hexdigest()
data = json.loads(args.observations.read_text())
assert data['scenarioSha256'] == DRIVER
assert data['source']['commit'] == args.expected_source
assert not data['source']['status'] and not data['source']['untracked']
source_bytes = {name: subprocess.check_output(['git', 'show', f'{args.expected_source}:app/{name}'], cwd=args.source_root)
                for name in ['original-units.json', 'original-rules.json', 'original-effects.json']}
sprites, rules, effects = [json.loads(source_bytes[name]) for name in source_bytes]
failures, examples, segments = Counter(), {}, []

def fail(kind, detail):
    failures[kind] += 1
    if len(examples.setdefault(kind, [])) < 4:
        examples[kind].append(detail)

def logical(p):
    if not p or p['class'] != 1 or not 2 <= p['model'] <= 7 or not p['state']:
        return False
    mode = rules['animationDescriptors'][p['draw']]['mode']
    # Test intended repaired ownership even if the required gate bit is missing.
    return mode in (1, 2) or (mode == 4 and not (p['renderFlags'] & 0x1000))

def same_fields(p, q, keys):
    return p and q and all(p[key] == q[key] for key in keys)

identity = ['ownerIdentity', 'object', 'draw']
state_keys = ['class', 'model', 'state', 'substate', 'commandStatus', 'renderFlags', 'flags2', 'flags3', 'flags4', 'speed', 'morph']
expected_controls = [('normal-speed natural opening', 1, False), ('public pause', 1, True),
    ('public resume', 1, False), ('settings pause at 1×', 1, True),
    ('settings selected 2× while paused', 2, True), ('shipped 2× speed natural play', 2, False),
    ('public pause at 2×', 2, True), ('settings pause at 2×', 2, True),
    ('settings selected 1× while paused', 1, True), ('restored shipped 1× speed', 1, False)]
assert [s['label'] for s in data['segments']] == [c[0] for c in expected_controls]
for segment, (label, speed, paused) in zip(data['segments'], expected_controls):
    rows = segment['rows']; counts = Counter(); modes = set(); smoke_uvs = set()
    assert len(rows) >= 2 and not segment.get('error')
    for row in rows:
        if row['speed'] != speed or row['paused'] != paused:
            fail('controls', {'label': label, 'turn': row['turn'], 'speed': row['speed'], 'paused': row['paused']})
        for unit in row['units']:
            p, mesh = unit['native'], unit['mesh']
            if not p:
                continue
            counts['nativeSamples'] += 1
            counts['walkSamples'] += unit['state'] == 'walk'
            if p['class'] == 1 and 2 <= p['model'] <= 7 and not p['flags3'] & 0x40000:
                fail('missingPersonGate', {'label': label, 'unit': unit['id'], 'native': p})
            if not mesh:
                counts['missingMeshSamples'] += 1
                continue
            if mesh['draw'] != p['draw']:
                fail('drawMismatch', {'unit': unit['id'], 'nativeDraw': p['draw'], 'meshDraw': mesh['draw']})
            directions = next((d for d in sprites['animations']['blue-' + unit['kind']].values() if d[0].get('source') == p['object']), None)
            if not directions:
                counts['unmappedNativeFrameSamples'] += 1
            elif mesh['frame'] not in {d['frames'][p['f2'] % len(d['frames'])] for d in directions}:
                fail('frameMismatch', {'unit': unit['id'], 'native': p, 'frame': mesh['frame']})
            else:
                counts['frameMatches'] += 1
            for layer in mesh['layers']:
                if not layer['visible']:
                    continue
                piece, uv = sprites['pieces'][layer['piece']], layer['uv']
                expected = [(-1 if uv[0] < 0 else 1) * piece['w'] / sprites['width'], piece['h'] / sprites['height'],
                    ((layer['piece'] % sprites['columns']) * sprites['cell'] + (piece['w'] if uv[0] < 0 else 0)) / sprites['width'],
                    1 - ((layer['piece'] // sprites['columns']) * sprites['cell'] + piece['h']) / sprites['height']]
                if any(abs(a - b) > 1e-12 for a, b in zip(uv, expected)):
                    fail('pieceUvMismatch', {'unit': unit['id'], 'layer': layer, 'expected': expected})
                else:
                    counts['pieceUvMatches'] += 1
        for smoke in row['displayedSmoke']:
            root = smoke.get('root')
            if smoke['kind'] != 'root' or not smoke['visible'] or not root or not root['visible']:
                continue
            modes.add(root['mode']); smoke_uvs.add(tuple(smoke['uv']))
            index = (row['smokeAnimationFrame'] - root['frameStart']) % 16
            frame = effects['animations']['hutSmoke' + root['mode'].title()][index]
            expected = [frame['w'] / effects['width'], frame['h'] / effects['height'],
                (frame['index'] % 8) * 256 / effects['width'],
                1 - ((frame['index'] // 8) * 256 + frame['h']) / effects['height']]
            if any(abs(a - b) > 1e-12 for a, b in zip(smoke['uv'], expected)):
                fail('smokeUvMismatch', {'turn': row['turn'], 'smoke': smoke, 'expected': expected})
            else:
                counts['smokeUvMatches'] += 1
    for before, after in zip(rows, rows[1:]):
        turns = (after['turn'] - before['turn']) & 0xffffffff
        presentation = after['animationFrame'] - before['animationFrame']
        if after['smokeAnimationFrame'] - before['smokeAnimationFrame'] != presentation:
            fail('smokeClockMismatch', {'label': label, 'turn': after['turn']})
        if paused:
            fields = ['turn', 'time', 'animationFrame', 'animationTime', 'smokeAnimationFrame', 'units', 'effects', 'smoke', 'displayedSmoke']
            if any(before[key] != after[key] for key in fields):
                fail('pauseMismatch', {'label': label, 'turn': after['turn']})
        else:
            elapsed = (after['sceneNow'] - before['sceneNow']) / 1000
            clock_elapsed = presentation / 24 + after['animationTime'] - before['animationTime']
            if abs(elapsed - clock_elapsed) > 2e-6:
                fail('presentationClockMismatch', {'label': label, 'elapsed': elapsed, 'clockElapsed': clock_elapsed})
        previous = {u['id']: u for u in before['units']}
        for unit in after['units']:
            old = previous.get(unit['id']); p, q = old and old['native'], unit['native']
            if not same_fields(p, q, identity):
                counts['sourceObjectDrawBoundaries'] += 1
                continue
            if not logical(p) or not logical(q):
                counts['outsideLogicalScopePairs'] += 1
                continue
            stable = same_fields(p, q, state_keys)
            if not stable:
                counts['stateOrFlagBoundaries'] += 1
                continue
            detail = {'label': label, 'unit': unit['id'], 'turnBefore': before['turn'], 'turnAfter': after['turn'], 'presentationDelta': presentation, 'before': p, 'after': q}
            if not turns:
                counts['sameTurnLogicalPairs'] += 1
                counts['sameTurnExtraPresentationPairs'] += presentation > 0
                if (p['f1'], p['f2'], p['stamp']) != (q['f1'], q['f2'], q['stamp']):
                    fail('sameTurnLogicalAdvance', detail)
            elif not paused and not after['landFlags'] & 2:
                counts['completedTurnStampPairs'] += 1
                if q['stamp'] != after['turn']:
                    fail('logicalStampMismatch', detail)
            descriptor = rules['animationDescriptors'][p['draw']]
            if unit['kind'] == 'shaman' and stable and descriptor['mode'] == 2 and descriptor['step'] == descriptor['hold'] == 0 and not p['renderFlags'] & 2:
                count = sprites['frameCounts'][p['object']]
                if turns >= count:
                    counts['cycleAliasedShamanPairs'] += 1
                else:
                    counts['unaliasedShamanPairs'] += 1
                    counts['positiveTurnShamanPairs'] += turns > 0
                    if (q['f2'] - p['f2']) % count != turns or p['f1'] != q['f1']:
                        fail('logicalShamanCadenceMismatch', detail)
    segments.append({'label': label, 'speed': speed, 'paused': paused, 'counts': dict(counts),
                     'smokeModes': sorted(modes), 'distinctSmokeUvs': len(smoke_uvs),
                     'observedPresentationVisits': rows[-1]['animationFrame'] - rows[0]['animationFrame'],
                     'observedTurns': (rows[-1]['turn'] - rows[0]['turn']) & 0xffffffff})

inconclusive = []
for speed in (1, 2):
    live = [s for s in segments if s['speed'] == speed and not s['paused']]
    if not sum(s['counts'].get('positiveTurnShamanPairs', 0) for s in live):
        inconclusive.append(f'No unaliased stable Shaman logical advance at {speed}×')
if not sum(s['counts'].get('sameTurnExtraPresentationPairs', 0) for s in segments if s['speed'] == 1):
    inconclusive.append('No same-turn extra-presentation logical owner pair at 1×')
if not sum(s['counts'].get('walkSamples', 0) for s in segments):
    inconclusive.append('No genuine native walk sample')
if not any(s['distinctSmokeUvs'] > 1 and not s['paused'] for s in segments):
    inconclusive.append('No changing ordinary hut smoke UV control')
result = {'status': 'failed' if failures else 'inconclusive' if inconclusive else 'passed',
    'source': data['source'], 'driverSha256': DRIVER, 'checkerSha256': sha(Path(__file__).read_bytes()),
    'observationsSha256': sha(args.observations.read_bytes()),
    'sourceDataSha256': {name: sha(value) for name, value in source_bytes.items()},
    'failureCounts': dict(failures), 'failureExamples': examples, 'inconclusive': inconclusive,
    'segments': segments, 'coverage': data['coverage'],
    'limits': 'Finite sampled ordinary proof only. Source/object/draw/state/flag boundaries are counted and excluded from per-owner cadence attribution. Unmapped frames and absent effects are not claimed. Stamp equals completed logical animation turn by the modern adapter; it is not historical native draw serial. Sparse RAF does not reveal every visit. No original wall-clock, hardware performance, full lifecycle or unsampled Splash/smoke claim.'}
args.output.write_text(json.dumps(result, indent=2) + '\n')
print(json.dumps({key: result[key] for key in ['status', 'failureCounts', 'inconclusive']}, indent=2))
raise SystemExit(0 if result['status'] == 'passed' else 1)
