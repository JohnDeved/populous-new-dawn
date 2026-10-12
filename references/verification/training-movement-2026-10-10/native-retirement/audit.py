from pathlib import Path
import json,hashlib,sys,platform
ROOT=Path(__file__).resolve().parents[4]
OUT=Path(__file__).parent
base=OUT.parent/'native/attempt08'
a=json.loads((base/'result.json').read_text());b=json.loads((OUT/'trace01/result.json').read_text());life=json.loads((OUT/'trace01/lifecycle.json').read_text())
keys=['timeline','turnVisits','admissions','events','terrainTrace','final']
assert a['status']==b['status']=='completed'
equal={k:a[k]==b[k] for k in keys};assert all(equal.values())
initial_equal={n:(base/n).read_bytes()==(OUT/'trace01'/n).read_bytes() for n in ['initial.json','initial-runtime-globals.bin','allocated.json']};assert all(initial_equal.values())
def row(turn,boundary):return next(e for e in life if e['turn']==turn and e['boundary']==boundary)
def ids(rows):return [g['id'] for g in rows]
alloc=[e for e in life if e['boundary']=='allocateReturn'];assert [(e['turn'],e['record']['id']) for e in alloc]==[(25,1831),(25,1830)]
assert ids(row(25,'afterObjects')['tribe'])==[1830,1831]
assert ids(row(25,'afterDeferredFree')['tribe'])==[1831,1830]
assert row(25,'afterObjects')['primary'][:2]==[1830,1831]
retired=[]
for rid,t,freet in [(1831,26,28),(1830,31,33)]:
 entry=row(t,'retireEntry');r=row(t,'retireReturn');assert r['record']['id']==rid and r['record']['class_']==0 and r['record']['flags2']==1 and r['record']['counter']==3
 assert rid not in r['primary'] and rid in ids(r['tribe']) and ids(r['deferred'])==[rid]
 assert entry['record']['tribeNext']==r['record']['tribeNext']
 for t2,count in [(t,2),(t+1,1)]:
  e=row(t2,'afterDeferredFree');assert ids(e['deferred'])==[rid] and e['deferred'][0]['counter']==count and rid not in ids(e['tribe'])
 e=row(freet,'releaseDeferredEntry');assert e['record']['id']==rid and e['record']['counter']==0 and e['record']['flags2']==0
 e=row(freet,'afterDeferredFree');assert e['deferred']==[] and e['freeHighHead']==rid
 retired.append(dict(id=rid,retiredTurn=t,returnedToFreePoolTurn=freet,caller=entry['caller'],primaryRemovedImmediately=True,tribeLinkRetainedUntilRebuild=True,deferredCounters=[3,2,1,0]))
recruit_dead=[e for e in life if e['turn']==26 and e['boundary']=='recruitEntry' and any(g['id']==1831 and g['class_']==0 for g in e['tribe'])];assert len(recruit_dead)==6
sha=lambda p:hashlib.sha256(p.read_bytes()).hexdigest()
sources=[ROOT/'scripts/decomp.py',ROOT/'decomp/tools.json',base/'driver.py',OUT/'driver.py',ROOT/'app/live-movement.ts',ROOT/'app/marching-formations.ts']+[ROOT/'decomp/generated'/f for f in ['004ed8a0.c','004ee300.c','004ecac0.c','00500a30.c','00501000.c','00501ab0.c','005018c0.c']]
exe=Path('/workspace/scratch/69fd8163d94e/original-game-restoration-20261010/game/d3dpoptb.exe');assert sha(exe)=='3a5065c7420b3fcde208bf220bc86dfbac95e025ab2492caf9c7ea5308dfbe4f'
report=dict(status='passed',sourceHead='96a465d1b3dfb7ff7aae34865088308dc26d4783',executableSha256=sha(exe),tools=b['tools'],comparisonKeysEqual=equal,initialArtifactsByteEqual=initial_equal,allocations=[dict(turn=e['turn'],record=e['record']) for e in alloc],retirements=retired,deadGroupRecruitmentVisitors=[e['record']['id'] for e in recruit_dead],observedSlotReuse=False,sourceProvesFreeHeadReuse=True,sources=[dict(path=str(p),sha256=sha(p)) for p in sources],scope='Same eight-Brave/Temple fixture and 48-turn window; observation-only hooks, no new guest writes or supplied returns.',limits=['Native slot reuse source-derived, never dynamically exercised','No full-world/startup/render/animation/saving execution added','Browser monotonic unbounded allocator does not yet expose native pool cap/reuse; deferred storage not required absent a dependent browser consumer'])
(OUT/'audit.json').write_text(json.dumps(report,indent=2)+'\n')
print(json.dumps({k:report[k] for k in ['status','comparisonKeysEqual','initialArtifactsByteEqual','retirements','deadGroupRecruitmentVisitors','observedSlotReuse']},indent=2))
