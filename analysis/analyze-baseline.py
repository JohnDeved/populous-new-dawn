"""Offline attribution of the old a53 adapter; never use as candidate expectations."""
import hashlib
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[3]
OUT = Path(__file__).resolve().parent / 'baseline-a53-raw-owners'
observations = OUT / 'sprite-observations.json'
sprites_path = ROOT / 'app/original-units.json'
rules_path = ROOT / 'app/original-rules.json'
data = json.loads(observations.read_text())
sprites = json.loads(sprites_path.read_text())
rules = json.loads(rules_path.read_text())
checks = []
for segment in data['segments']:
    mismatches, unrecognized, pairs, all_unit_changes = [], [], [], []
    draw_mismatches, uv_mismatches = [], []
    matches = native_count = draw_matches = uv_matches = 0
    flags_stamps, smoke_uvs = set(), {}
    for row in segment['rows']:
        for unit in row['units']:
            native = unit['native']
            if not native:
                continue
            native_count += 1
            flags_stamps.add((native['flags3'], native['stamp']))
            if not unit['mesh']:
                continue
            if native['draw'] == unit['mesh']['draw']:
                draw_matches += 1
            else:
                draw_mismatches.append({'unit': unit['id'], 'nativeDraw': native['draw'], 'meshDraw': unit['mesh']['draw']})
            for layer in unit['mesh']['layers']:
                if not layer['visible']:
                    continue
                piece = sprites['pieces'][layer['piece']]
                uv = layer['uv']
                flip = uv[0] < 0
                expected = [(-1 if flip else 1) * piece['w'] / sprites['width'],
                            piece['h'] / sprites['height'],
                            ((layer['piece'] % sprites['columns']) * sprites['cell'] + (piece['w'] if flip else 0)) / sprites['width'],
                            1 - ((layer['piece'] // sprites['columns']) * sprites['cell'] + piece['h']) / sprites['height']]
                if all(abs(a - b) < 1e-12 for a, b in zip(uv, expected)):
                    uv_matches += 1
                else:
                    uv_mismatches.append({'unit': unit['id'], 'piece': layer['piece'], 'uv': uv, 'expected': expected})
            animations = sprites['animations']['blue-' + unit['kind']]
            directions = next((a for a in animations.values() if a[0].get('source') == native['object']), None)
            if directions is None:
                unrecognized.append({'unit': unit['id'], 'object': native['object']})
                continue
            valid = {cycle['frames'][native['f2'] % len(cycle['frames'])] for cycle in directions}
            if unit['mesh']['frame'] in valid:
                matches += 1
            else:
                mismatches.append({'turn': row['turn'], 'unit': unit['id'], 'native': native,
                                   'renderedFrame': unit['mesh']['frame'], 'expected': sorted(valid)})
        for smoke in row['displayedSmoke']:
            if smoke['visible'] and smoke.get('uv'):
                key = f"{smoke['kind']}:{smoke['id']}:{smoke.get('root', {}).get('mode')}"
                smoke_uvs.setdefault(key, set()).add(tuple(smoke['uv']))
    for before, after in zip(segment['rows'], segment['rows'][1:]):
        if before['turn'] == after['turn']:
            previous_units = {unit['id']: unit for unit in before['units']}
            for current in after['units']:
                previous = previous_units.get(current['id'])
                p, q = previous and previous['native'], current['native']
                if not p or not q or any(p[key] != q[key] for key in ['ownerIdentity', 'object', 'draw']):
                    continue
                if (p['f1'], p['f2']) == (q['f1'], q['f2']):
                    continue
                all_unit_changes.append({'unit': current['id'], 'kind': current['kind'],
                    'turn': after['turn'], 'presentationBefore': before['animationFrame'], 'presentationAfter': after['animationFrame'],
                    'sourceBefore': p, 'sourceAfter': q,
                    'meshBefore': previous['mesh'], 'meshAfter': current['mesh'],
                    'meshFrameChanged': previous['mesh']['frame'] != current['mesh']['frame'],
                    'meshLayersChanged': previous['mesh']['layers'] != current['mesh']['layers']})
        old = next(u for u in before['units'] if u['kind'] == 'shaman')
        new = next(u for u in after['units'] if u['id'] == old['id'])
        p, q = old['native'], new['native']
        stable = ['ownerIdentity', 'class', 'model', 'object', 'draw', 'renderFlags',
                  'state', 'substate', 'commandStatus', 'speed', 'flags3', 'stamp']
        if not p or not q or any(p[key] != q[key] for key in stable):
            continue
        descriptor = rules['animationDescriptors'][p['draw']]
        assert descriptor['mode'] == 2 and descriptor['step'] == descriptor['hold'] == 0
        count = sprites['frameCounts'][p['object']]
        presentation = after['animationFrame'] - before['animationFrame']
        actual = (q['f2'] - p['f2']) % count
        pairs.append({'turnBefore': before['turn'], 'turnAfter': after['turn'],
                      'presentationDelta': presentation, 'f2DeltaModuloCount': actual,
                      'frameCount': count, 'matchesPresentation': actual == presentation % count,
                      'cycleAliased': presentation >= count, 'sourceBefore': p, 'sourceAfter': q})
    zero_turn = [p for p in pairs if p['turnBefore'] == p['turnAfter'] and p['presentationDelta'] > 0 and p['f2DeltaModuloCount'] > 0]
    checks.append({'label': segment['label'], 'summary': segment['summary'],
                   'nativeSamples': native_count, 'flags3StampPairs': sorted(flags_stamps),
                   'renderedFrameMatches': matches, 'frameMismatches': mismatches,
                   'renderedDrawMatches': draw_matches, 'drawMismatches': draw_mismatches,
                   'visibleLayerPieceUvMatches': uv_matches, 'pieceUvMismatches': uv_mismatches,
                   'unrecognizedNativeSources': unrecognized,
                   'allUnitSameTurnFrameAdvancePairs': len(all_unit_changes),
                   'allUnitSameTurnMeshFrameChanges': sum(p['meshFrameChanged'] for p in all_unit_changes),
                   'allUnitSameTurnMeshLayerChanges': sum(p['meshLayersChanged'] for p in all_unit_changes),
                   'allUnitSameTurnExamples': all_unit_changes[:2] + next(([p] for p in all_unit_changes[2:] if p['meshLayersChanged']), []),
                   'stableShamanPairs': len(pairs),
                   'presentationMismatchCount': sum(not p['matchesPresentation'] for p in pairs),
                   'cycleAliasedPairs': sum(p['cycleAliased'] for p in pairs),
                   'zeroTurnFrameAdvancePairs': len(zero_turn), 'zeroTurnExamples': zero_turn[:3],
                   'visibleSmokeDistinctUvs': {key: len(value) for key, value in smoke_uvs.items()}})

def sha(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()

valid = all(not c['frameMismatches'] and not c['drawMismatches'] and not c['pieceUvMismatches'] and not c['unrecognizedNativeSources']
            and not c['presentationMismatchCount'] and not c['cycleAliasedPairs']
            and c['flags3StampPairs'] == [(0, 0)] for c in checks)
result = {'status': 'passed' if valid else 'failed', 'source': data['source'],
          'inputSha256': sha(observations), 'spritesSha256': sha(sprites_path),
          'rulesSha256': sha(rules_path), 'checkerSha256': sha(Path(__file__)),
          'totalNativeSamples': sum(c['nativeSamples'] for c in checks),
          'totalZeroTurnFrameAdvancePairs': sum(c['zeroTurnFrameAdvancePairs'] for c in checks),
          'totalAllUnitSameTurnFrameAdvancePairs': sum(c['allUnitSameTurnFrameAdvancePairs'] for c in checks),
          'predicates': {'allUnits': 'Adjacent sampled rows have equal World.turn; same Unit.id and raw native ownerIdentity/object/draw; f1 or f2 differs. Counts are observed pairs, not every intermediate visit.',
                         'stableShaman': 'Same raw source identity/class/model/object/draw/renderFlags/state/substate/commandStatus/speed/flags3/stamp; descriptor mode2 hold0 step0. Compare modulo frame count; reject whole-cycle ambiguity.',
                         'renderedLink': 'Mesh draw equals raw native draw; mesh frame belongs to a matching imported source direction cycle at f2; existing visible layer UV matches its recorded atlas piece. Repeated artwork can share pieces/UV despite a changed frame number.'},
          'coverage': data['coverage'], 'checks': checks,
          'limits': 'Baseline old adapter only. Observed Shaman mode2 f2 advances with presentation even without a logical turn; RAF may omit intermediate visits. Flags/stamps are raw zero values. Partial hut smoke observed; full smoke, Splash and damage smoke not observed. No candidate, native wall-clock or hardware claim.'}
(OUT / 'baseline-cadence-attribution.json').write_text(json.dumps(result, indent=2) + '\n')
print(json.dumps({k: result[k] for k in ['status', 'totalNativeSamples', 'totalZeroTurnFrameAdvancePairs', 'coverage']}, indent=2))
assert valid and result['totalZeroTurnFrameAdvancePairs'] > 0
