from pathlib import Path
import hashlib,json,math,collections,statistics
r=Path(__file__).resolve().parents[3]
b=r/'work/orchestration/sprite-animation-timing-214'
o=b/'browser-readonly'
sha=lambda p:hashlib.sha256(p.read_bytes()).hexdigest()
terminal=json.loads((b/'browser-readonly-terminal.json').read_text())
outer=json.loads((b/'browser-readonly-command.json').read_text())
inner=json.loads((o/'receipt.json').read_text())
data=json.loads((o/'sprite-observations.json').read_text())
units=json.loads((r/'app/original-units.json').read_text())
fx=json.loads((r/'app/original-effects.json').read_text())
assert terminal['outerReceiptSha256']==sha(b/'browser-readonly-command.json')
assert terminal['innerReceiptSha256']==sha(o/'receipt.json')
assert terminal['observationsSha256']==sha(o/'sprite-observations.json')
assert outer['source']==outer['sourceAfter'] and inner['source']==inner['sourceAfter']
assert inner['source']['commit']==outer['source']['headOid']=='596475b6839c948604897f8b68ff89c6290cf39d'
assert inner['source']['status']=='' and not inner['source']['untracked']
assert outer['status']==inner['status']=='passed' and outer['exitCode']==terminal['originalSessionExit']==0
assert not inner['errors'] and inner['launch']['chromiumSandbox'] is True and inner['launch']['args']==['--remote-debugging-pipe']
assert inner['browserVersion']=='154.0.8037.92'
for path,expected in outer['source']['inputs'].items():
 p=Path(path) if path.startswith('/') else r/path
 if p.exists(): assert sha(p)==expected, path
assert data['scenarioSha256']==outer['source']['inputs']['work/orchestration/sprite-animation-timing-214/observe-sprites-readonly.mjs']
checks=[]
for segment in data['segments']:
 rows=segment['rows']; s=segment['summary']; first,last=rows[0],rows[-1]
 dt=(last['sceneNow']-first['sceneNow'])/1000
 visits=last['animationFrame']-first['animationFrame']; turns=last['turn']-first['turn']
 assert s['samples']==len(rows) and s['elapsedSeconds']==dt
 assert s['animationVisits']==visits and s['simulationTurns']==turns
 assert s['gameTime']==last['time']-first['time']
 assert s['animationVisitsPerSecond']==visits/dt and s['turnsPerSecond']==turns/dt
 assert s['frameTimesMs']==[q['now']-p['now'] for p,q in zip(rows,rows[1:])]
 assert s['nativeUnitSamples']==sum(u['native'] is not None for row in rows for u in row['units'])
 assert s['effectSamples']==sum(len(row['effects']) for row in rows)
 assert s['smokeSamples']==sum(len(row['smoke']) for row in rows)
 assert all(row['now']==row['sceneNow'] for row in rows)
 assert all(row['speed']==1 for row in rows)
 assert all(row['animationFrame']==row['smokeAnimationFrame'] for row in rows)
 paused=segment['label']=='public pause'
 assert all(row['paused']==paused for row in rows)
 if paused:
  frozen=lambda row:{k:v for k,v in row.items() if k not in ['now','sceneNow']}
  assert all(frozen(row)==frozen(first) for row in rows)
 else:
  assert math.isclose(dt+first['animationTime']-last['animationTime'],visits/24,abs_tol=1e-10)
 matches=drawmatches=visiblematches=missing=smoke_matches=0
 kinds=collections.Counter(); states=collections.Counter(); sources=collections.Counter(); smokeKinds=collections.Counter()
 smoke_uvs=collections.defaultdict(set)
 for row in rows:
  for u in row['units']:
   kinds[u['kind']]+=1;states[u['state']]+=1
   n=u['native']; mesh=u['mesh']
   if not n or not mesh: missing+=1;continue
   directions=next((a for a in units['animations']['blue-'+u['kind']].values() if a[0].get('source')==n['object']),None)
   assert directions, (u['kind'],n['object'])
   assert mesh['frame'] in {d['frames'][n['f2']%len(d['frames'])] for d in directions}
   assert mesh['draw']==n['draw']
   sources[(u['kind'],n['object'],n['draw'])]+=1
   matches+=1;drawmatches+=1;visiblematches+=bool(mesh['visible'])
  for e in row['displayedSmoke']:
   smokeKinds[e['kind']]+=1
   if not e['visible']:continue
   smoke_uvs[(e['kind'],e['id'])].add(tuple(e['uv']))
   if e['kind']=='root':
    state=e['root'];assert state and state['visible']
    frame=(row['smokeAnimationFrame']-state['frameStart'])%16
    f=fx['animations']['hutSmokeFull' if state['mode']=='full' else 'hutSmokePartial'][frame]
    expected=[f['w']/fx['width'],f['h']/fx['height'],((f['index']%8)*256)/fx['width'],1-((f['index']//8)*256+f['h'])/fx['height']]
    assert expected==e['uv'],(frame,expected,e['uv'])
    smoke_matches+=1
 shaman_deltas=[]
 for p,q in zip(rows,rows[1:]):
  pn=next(u for u in p['units'] if u['kind']=='shaman')['native'];qn=next(u for u in q['units'] if u['kind']=='shaman')['native']
  assert pn['object']==qn['object']
  count=units['frameCounts'][pn['object']];delta=q['animationFrame']-p['animationFrame']
  assert 0<=delta<count
  assert (qn['f2']-pn['f2'])%count==delta
  shaman_deltas.append(delta)
 checks.append(dict(label=segment['label'],samples=len(rows),firstSceneMs=first['sceneNow'],lastSceneMs=last['sceneNow'],elapsedSeconds=dt,animationVisits=visits,simulationTurns=turns,visitsPerSecond=visits/dt,turnsPerSecond=turns/dt,pausedAllRowsExactlyFrozen=paused,nativeDirectionSetFrameMatches=matches,nativeDrawMatches=drawmatches,visibleNativeFrameMatches=visiblematches,missingNativeOrMesh=missing,shamanUnambiguousPairs=len(shaman_deltas),shamanDeltaTotal=sum(shaman_deltas),actualRootUvMatches=smoke_matches,distinctVisibleSmokeUVs={str(k):len(v) for k,v in smoke_uvs.items()},sampledKinds=dict(kinds),sampledStates=dict(states),nativeSources={str(k):v for k,v in sources.items()},sampledSmokeKinds=dict(smokeKinds),worldEffectSamples=s['effectSamples'],frameGapP50Ms=statistics.median(s['frameTimesMs']),frameGapMaxMs=max(s['frameTimesMs'])))
result={'verdict':'ACCEPT bounded corrected pure current-main observation','source':inner['source']['commit'],'observerSha256':data['scenarioSha256'],'outerSha256':sha(b/'browser-readonly-command.json'),'innerSha256':sha(o/'receipt.json'),'observationsSha256':sha(o/'sprite-observations.json'),'checks':checks,'warningsRetained':len(inner['warnings']),'cleanupEvidence':'Original77431 exit0; terminal receipt reports port4374 refused; normal harness completion','limits':['Native direction-set membership only; observer lacks heading/camera data for exact directional-choice proof','Actual mesh/UV metadata and contextual PNGs, not independent pixel-to-atlas raster comparison','Opening only Brave/Shaman idle/selected and20 walking native samples; no world-effect samples','No native absolute cadence, hardware performance, universal sprite-rate or bug-cause acceptance','First run retains its rejected strict read-only claim due to screen/nativePosition terrain synchronization'],'reviewerResources':[]}
Path(__file__).with_name('audit.json').write_text(json.dumps(result,indent=2)+'\n')
print(json.dumps(result,indent=2))
