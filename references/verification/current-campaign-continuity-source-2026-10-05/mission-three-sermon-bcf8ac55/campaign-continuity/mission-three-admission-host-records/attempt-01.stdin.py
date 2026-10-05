from pathlib import Path
import json,time,os,hashlib,datetime
root=Path.cwd();b=root/'work/orchestration/campaign-continuity';out=b/'mission-three-segment-01';p=root/'work/local-render-profiles/current-campaign-3b89912-m1-03';lease=json.loads((p/'owner.lock').read_text());print(json.dumps({'lease':lease,'observedAt':datetime.datetime.now(datetime.timezone.utc).isoformat()}),flush=True);raw=(b/'mission-three-first-batch-ddef3ca.json').read_bytes();assert hashlib.sha256(raw).hexdigest()=='4936c5e9e4d42f3d728f236f57598f68ce82c56eb2fbeaf32c7e54bb09d2dfb5'
for _ in range(300):
 if (out/'receipt.json').exists():raise RuntimeError('Terminal before admission; preserve result')
 if (out/'actions.jsonl').exists():
  rows=[json.loads(x) for x in (out/'actions.jsonl').read_text().splitlines()];loaded=next((r for r in rows if r.get('action')=='clean-segment-loaded'),None);awaiting=next((r for r in rows if r.get('action')=='awaiting-input'),None)
  if awaiting:
   assert loaded and loaded['previousRunId']=='1a4080a7-e027-4de2-8ff1-4b6f5ff26368';proof=next(r for r in rows if r.get('action')=='checkpoint-loaded');assert proof['saved']['checkpointSha256']==proof['stored']['checkpointSha256']=='5cb9a33a119f9c70dbf22455766e5c7add5ffa99a45b704d90ba5c434ac3b713';assert proof['identity']['newWorld'] and proof['identity']['newScene'] and proof['identity']['currentCorrespondence'];opening=json.loads((out/'m3-segment-opening.json').read_text());assert opening['level']==3 and opening['paused'] and opening['completedMissions']==[1,2];journey=json.loads((out/'journey.json').read_text());assert len(journey['failures'])==3 and journey['failures'][-1]['kind']=='prior-harness-failure'
   dst=out/'commands/0001.json';assert not dst.exists();temp=dst.with_suffix('.tmp')
   with temp.open('xb') as f:f.write(raw);f.flush();os.fsync(f.fileno())
   os.rename(temp,dst);r={'queuedAt':datetime.datetime.now(datetime.timezone.utc).isoformat(),'runId':lease['runId'],'profileId':lease['profileId'],'awaitingAt':awaiting['at'],'batchSha256':hashlib.sha256(raw).hexdigest(),'checkpointLoaded':proof,'openingTurn':opening['turn'],'sourceHead':'ddef3caa522d45168b16f290cc5b5a4d1541fce2','inheritedFailures':journey['failures']};(b/'mission-three-first-batch-admission.json').write_text(json.dumps(r,indent=2)+'\n');print(json.dumps({'admitted':True,'runId':lease['runId'],'openingTurn':opening['turn'],'queuedAt':r['queuedAt'],'awaitingAt':awaiting['at'],'inheritedFailures':len(journey['failures'])}),flush=True);break
 time.sleep(.1)
else:print('Startup still pending; no command queued.',flush=True)
