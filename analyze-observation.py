"""Read-only postprocessing of the issue214 browser observer; no expected native Hz."""
import hashlib, json, statistics, sys
from pathlib import Path

output=Path(sys.argv[1])
root=Path(__file__).resolve().parents[3]
observations=output/'sprite-observations.json'
sprites=root/'app/original-units.json'
data=json.loads(observations.read_text())
units=json.loads(sprites.read_text())
checks=[]
for segment in data['segments']:
    matches=0
    mismatches=[]
    for row in segment['rows']:
        for unit in row['units']:
            if not unit['native'] or not unit['mesh']:
                continue
            native=unit['native']
            animations=units['animations']['blue-'+unit['kind']]
            directions=next((a for a in animations.values() if a[0].get('source')==native['object']),None)
            if not directions:
                continue
            valid={cycle['frames'][native['f2']%len(cycle['frames'])] for cycle in directions}
            if unit['mesh']['frame'] in valid:
                matches+=1
            else:
                mismatches.append(dict(now=row['now'],unit=unit['id'],native=native,renderedFrame=unit['mesh']['frame'],valid=sorted(valid)))
    pairs=[]
    for first,last in zip(segment['rows'],segment['rows'][1:]):
        before=next(u for u in first['units'] if u['kind']=='shaman')['native']
        after=next(u for u in last['units'] if u['kind']=='shaman')['native']
        if before['object']!=after['object']:
            continue
        count=units['frameCounts'][before['object']]
        delta=last['animationFrame']-first['animationFrame']
        actual=(after['f2']-before['f2'])%count
        pairs.append(dict(animationDelta=delta,observedF2DeltaModuloCount=actual,match=actual==delta%count,undercountAmbiguous=delta>=count))
    deltas=sorted(segment['summary']['frameTimesMs'])
    smoke={}
    for row in segment['rows']:
        for effect in row['displayedSmoke']:
            if effect['visible']:
                smoke.setdefault(str((effect['kind'],effect['id'])),set()).add(tuple(effect['uv'] or []))
    checks.append(dict(label=segment['label'],elapsedSeconds=segment['summary']['elapsedSeconds'],animationVisits=segment['summary']['animationVisits'],simulationTurns=segment['summary']['simulationTurns'],renderedNativeFrameMatches=matches,mismatches=mismatches,shamanPairs=len(pairs),shamanMismatchCount=sum(not p['match'] for p in pairs),shamanUnambiguousDeltaTotal=sum(p['observedF2DeltaModuloCount'] for p in pairs),shamanAliasedPairs=sum(p['undercountAmbiguous'] for p in pairs),frameGapMs=dict(p50=statistics.median(deltas),p95=deltas[int((len(deltas)-1)*.95)],maximum=max(deltas)),distinctSmokeUVs={key:len(value) for key,value in smoke.items()},walkingNativeSamples=sum(u['state']=='walk' and u['native'] is not None for row in segment['rows'] for u in row['units']),effectSamples=segment['summary']['effectSamples']))
assert all(not check['mismatches'] and check['shamanMismatchCount']==0 and check['shamanAliasedPairs']==0 for check in checks),checks
sha=lambda path:hashlib.sha256(path.read_bytes()).hexdigest()
result=dict(status='passed',method='Each native-backed rendered frame belongs to the imported direction cycle at current f2. Every stable-source Shaman f2 increment equals adapter visits modulo its frame count, with all sampled gaps shorter than a full cycle. This does not assert a native Hz.',inputSha256=sha(observations),spritesSha256=sha(sprites),checkerSha256=sha(Path(__file__)),checks=checks)
(output/'rendered-frame-verification.json').write_text(json.dumps(result,indent=2)+'\n')
print(json.dumps(result,indent=2))
