"""Finite saved-row proof for existing ordinary model45 bodies; no game execution."""
import argparse
from collections import Counter
import hashlib
import json
from pathlib import Path
import struct
import subprocess

parser = argparse.ArgumentParser()
parser.add_argument('--observations', type=Path, required=True)
parser.add_argument('--source-root', type=Path, required=True)
parser.add_argument('--expected-source', required=True)
parser.add_argument('--expected-driver', required=True)
parser.add_argument('--output', type=Path, required=True)
args = parser.parse_args()
data = json.loads(args.observations.read_text())
assert data['schema'] == 'stone-head-logical-visits-214/v1'
assert data['scenarioSha256'] == args.expected_driver
assert data['source']['commit'] == args.expected_source
assert not data['source']['status'] and not data['source']['untracked']
sha = lambda value: hashlib.sha256(value).hexdigest()
source = {name: subprocess.check_output(['git', 'show', f'{args.expected_source}:app/{name}'], cwd=args.source_root)
          for name in ['original-stone-heads.json', 'original-rules.json', 'original-models.json']}
stone, rules, models = [json.loads(value) for value in source.values()]
model = models['45']; frames = stone['frames']; f32 = lambda value: struct.unpack('<f', struct.pack('<f', value))[0]

def positions(phase):
    segment = next(s for s in stone['segments'] if s['first'] <= phase <= s['last'])
    old, new = stone['keypoints'][str(segment['from'])], stone['keypoints'][str(segment['to'])]
    output = []
    for vertex in stone['visiblePointIndices'][:6]:
        for axis in range(3):
            index = vertex * 3 + axis
            value = old[index] + int((new[index] - old[index]) * (phase - segment['first']) / segment['duration'])
            signed = (value + 32768) % 65536 - 32768
            output.append(f32(signed / (stone['scale'] * 3) * (-1 if axis == 2 else 1)))
    return output

uv, modes, offset = [], [], 0
for face in range(len(model['faces']) // 2):
    count = 3 if model['faces'][face * 2] == 3 else 6
    if model['modes'][face]:
        for corner in range(count):
            u, v = model['uv'][(offset + corner) * 2:(offset + corner) * 2 + 2]
            tile = model['tiles'][face]; x, y = tile & 7, tile >> 3
            uv.extend([f32((x + (0.5 + (u * 8 - x) * 31) / 32) / 8),
                       f32(1 - (y + (0.5 + ((1 - v) * 32 - y) * 31) / 32) / 32)])
            modes.append(model['modes'][face])
    offset += count

failures, examples, segments = Counter(), {}, []
def fail(kind, detail):
    failures[kind] += 1
    if len(examples.setdefault(kind, [])) < 3:
        examples[kind].append(detail)

def ordinary(body):
    return body and body['family'] == 45 and rules['animationDescriptors'][body['draw']]['mode'] == 4 and not body['renderFlags'] & 0x1000

def held(body):
    return bool(body['renderFlags'] & 0x400 and not body['renderFlags'] & 0x800)

def queued(head):
    r = head['rendered']
    return bool(r and r['nativeModel'] == 45 and r['groupVisible'] and r['meshVisible'] and
                r['objectsVisible'] and r['sceneVisible'] and r['parentIsObjects'] and r['submittedFaceCount'] > 0)

expected = [('normal-speed natural opening', 1, False), ('public pause', 1, True), ('public resume', 1, False),
            ('settings pause at 1×', 1, True), ('settings selected 2× while paused', 2, True),
            ('shipped 2× speed natural play', 2, False), ('public pause at 2×', 2, True),
            ('settings pause at 2×', 2, True), ('settings selected 1× while paused', 1, True),
            ('restored shipped 1× speed', 1, False)]
assert [s['label'] for s in data['segments']] == [s[0] for s in expected]
identity = ['ownerIdentity', 'family', 'triggerIndex', 'sceneryIndex', 'object', 'draw', 'morph']
eligibility = ['enabled', 'holdFrame', 'renderFlags', 'flags3', 'descriptorMode']
for segment, (label, speed, paused) in zip(data['segments'], expected):
    rows = segment['rows']; assert len(rows) >= 2 and not segment.get('error')
    counts = Counter(); phases = set(); witnesses = set(); geometry_variants = {}
    for row in rows:
        if (row['speed'], row['paused']) != (speed, paused):
            fail('controls', {'label': label, 'turn': row['turn']})
        for h in row['stoneHeads']:
            b, r = h['body'], h['rendered']; counts[h['availability'] + 'Samples'] += 1
            if not b or b['family'] != 45:
                continue
            counts['bodySamples'] += 1
            if not b['flags3'] & 0x40000:
                fail('missingGate', {'label': label, 'head': h['id'], 'flags3': b['flags3']})
            if b['descriptorMode'] != rules['animationDescriptors'][b['draw']]['mode']:
                fail('descriptorMode', {'label': label, 'head': h['id']})
            if not r:
                counts['missingMeshSamples'] += 1
                continue
            phase = b['holdFrame'] if held(b) else ((b['f1'] & 65535) >> 2) % frames
            if r['nativeModel'] != 45 or r['phase'] != phase:
                fail('renderedPhase', {'label': label, 'head': h['id'], 'body': b, 'rendered': r})
            if r['positionItemSize'] != 3 or r['positionCount'] != len(stone['visiblePointIndices']) or r['positionSample'] != positions(phase):
                fail('positionSample', {'label': label, 'head': h['id'], 'phase': phase, 'sample': r['positionSample']})
            if r['uvCount'] != len(modes) or r['uvSample'] != uv[:12] or r['textureModeSample'] != modes[:6]:
                fail('uvOrMaterialModeSample', {'label': label, 'head': h['id'], 'phase': phase})
            counts['renderedGeometrySamples'] += 1
            if h['enabled'] and b['enabled'] and ordinary(b) and not held(b) and queued(h):
                counts['enabledQueuedSamples'] += 1; phases.add(phase)
                witnesses.add((h['id'], b['triggerIndex'], b['sceneryIndex']))
                geometry_variants.setdefault(f"{h['id']}:{b['ownerIdentity']}", set()).add(tuple(r['positionSample']))
    for before, after in zip(rows, rows[1:]):
        turns = (after['turn'] - before['turn']) & 0xffffffff
        presentation = after['animationFrame'] - before['animationFrame']
        if after['smokeAnimationFrame'] - before['smokeAnimationFrame'] != presentation:
            fail('smokeClock', {'label': label})
        if paused:
            if turns or presentation or before['animationTime'] != after['animationTime']:
                fail('pausedClock', {'label': label})
        elif abs((after['sceneNow'] - before['sceneNow']) / 1000 - (presentation / 24 + after['animationTime'] - before['animationTime'])) > 2e-6:
            fail('presentationClock', {'label': label})
        old = {h['id']: h for h in before['stoneHeads']}
        for h in after['stoneHeads']:
            first = old.get(h['id']); p, q = first and first['body'], h['body']
            if not p or not q or any(p[k] != q[k] for k in identity):
                counts['ownerOrSourceBoundaries'] += 1; continue
            if not ordinary(p) or not ordinary(q) or any(p[k] != q[k] for k in eligibility) or first['enabled'] != h['enabled']:
                counts['eligibilityOrTransitionBoundaries'] += 1; continue
            detail = {'label': label, 'head': h['id'], 'turnBefore': before['turn'], 'turnAfter': after['turn'],
                      'presentationDelta': presentation, 'before': p, 'after': q}
            if not turns and (p['f1'], p['f2'], p['stamp']) != (q['f1'], q['f2'], q['stamp']):
                fail('sameTurnAdvance', detail)
            if paused and first['rendered'] and h['rendered'] and first['rendered'] != h['rendered']:
                # Global painter slots/order can change; the body's own render state must freeze.
                keys = ['nativeModel', 'phase', 'geometryId', 'positionVersion', 'positionSample', 'uvSample', 'textureModeSample', 'groupPosition', 'meshPosition']
                if any(first['rendered'][k] != h['rendered'][k] for k in keys):
                    fail('pausedBodyGeometry', detail)
            if turns and not paused and not after['landFlags'] & 2:
                counts['logicalStampPairs'] += 1
                if q['stamp'] != after['turn']:
                    fail('logicalStamp', detail)
                if held(q):
                    counts['heldLogicalPairs'] += 1
                    if (p['f1'], p['f2']) != (q['f1'], q['f2']):
                        fail('heldCounterAdvance', detail)
                elif turns < frames:
                    counts['unaliasedLogicalPairs'] += 1
                    step = rules['animationDescriptors'][q['draw']]['step']
                    if (q['f1'] - p['f1']) % (frames * 4) != (turns * step) % (frames * 4):
                        fail('logicalCadence', detail)
                else:
                    counts['cycleAliasedPairs'] += 1
            if queued(first) and queued(h) and h['enabled'] and q['enabled'] and not held(q):
                if not turns and presentation:
                    counts['queuedExtraPresentationHolds'] += 1
                elif 0 < turns < frames:
                    counts['queuedLogicalPairs'] += 1
    segments.append({'label': label, 'speed': speed, 'paused': paused, 'counts': dict(counts),
                     'queuedEnabledPhases': sorted(phases), 'witnesses': sorted(witnesses),
                     'queuedGeometryVariantsByBody': {key: len(value) for key, value in geometry_variants.items()}})

inconclusive = []
for speed in (1, 2):
    live = [s for s in segments if s['speed'] == speed and not s['paused']]
    if not sum(s['counts'].get('queuedLogicalPairs', 0) for s in live):
        inconclusive.append(f'No ordinary enabled queued model45 logical interval at {speed}×')
    if not any(count > 1 for s in live for count in s['queuedGeometryVariantsByBody'].values()):
        inconclusive.append(f'No changing sampled geometry on the same enabled queued model45 body at {speed}×')
if not sum(s['counts'].get('queuedExtraPresentationHolds', 0) for s in segments if s['speed'] == 1):
    inconclusive.append('No queued enabled same-turn extra-presentation model45 interval at 1×')
for speed in (1, 2):
    if not any(s['speed'] == speed and s['paused'] and s['counts'].get('enabledQueuedSamples', 0) for s in segments):
        inconclusive.append(f'No queued model45 pause witness at {speed}×')
result = {'status': 'failed' if failures else 'inconclusive' if inconclusive else 'passed', 'source': data['source'],
          'driverSha256': args.expected_driver, 'checkerSha256': sha(Path(__file__).read_bytes()),
          'rawSha256': sha(args.observations.read_bytes()), 'sourceDataSha256': {k: sha(v) for k, v in source.items()},
          'requiredVisualReview': 'Confirm the actual enabled model45 body in normal-speed-opening.png and shipped-2x-speed.png; queued faces alone do not prove pixel visibility.',
          'failureCounts': dict(failures), 'failureExamples': examples, 'inconclusive': inconclusive, 'segments': segments,
          'limits': 'Existing authored model45 bodies only; Painter-submitted faces are a liveness aid, not pixel visibility proof; ordinary screenshots require separate visual review. Geometry comparison samples six rendered vertices, not all18 controlled phases. Sparse RAF may skip visits; source/eligibility transitions and full-cycle gaps are excluded and counted. Vault/HFX, other scenery, complete native allocator, original wall clock and hardware performance are not claimed.'}
args.output.write_text(json.dumps(result, indent=2) + '\n')
print(json.dumps({k: result[k] for k in ['status', 'failureCounts', 'inconclusive']}, indent=2))
raise SystemExit(0 if result['status'] == 'passed' else 1)
