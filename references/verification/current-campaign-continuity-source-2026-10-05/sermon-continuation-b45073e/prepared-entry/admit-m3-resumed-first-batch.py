# Host-only, one prepared batch. Run only alongside the exactly granted launcher.
from pathlib import Path
import os,json,hashlib,time,datetime
root=Path(__file__).resolve().parents[3];base=root/'work/orchestration/campaign-continuity'
sha=lambda b:hashlib.sha256(b).hexdigest()
planBytes=(base/'b45073e-m3-launch-plan.json').read_bytes();assert sha(planBytes)=='020d754ca7f0237d4474274407dd59c2facd9e24b0fe51d7e43c7945b4417e98';plan=json.loads(planBytes);output=Path(plan['output']);profile=Path(plan['profilePath']);payload=Path(plan['firstBatch']['path']).read_bytes();assert sha(payload)==plan['firstBatch']['sha256']
started=datetime.datetime.now(datetime.timezone.utc).isoformat();deadline=time.monotonic()+120
receipt=base/'mission-three-segment-02-admission.json';assert not receipt.exists()
try:
 while time.monotonic()<deadline:
  if (output/'receipt.json').exists():raise RuntimeError('Scenario terminated before the prepared first batch')
  journal=output/'actions.jsonl';opening=output/'m3-segment-opening.json';owner=profile/'owner.lock'
  if journal.exists() and opening.exists() and owner.exists():
   raw=journal.read_bytes();lines=raw.splitlines(keepends=True);rows=[json.loads(line)for line in lines if line.endswith(b'\n')]
   gate=next((r for r in rows if r.get('action')=='awaiting-input' and r.get('next')=='0001.json'),None)
   if gate:
    load=next(r for r in rows if r.get('action')=='checkpoint-loaded');entry=next(r for r in rows if r.get('action')=='saved-sermon-segment-loaded')
    assert load['saved']==plan['expectedCheckpoint'] and load['stored']==plan['expectedCheckpoint']
    for key in ['level','turn','time','actorsSha256','terrainSha256','stockSha256']:assert load['boundary'][key]==plan['expectedCheckpoint'][key]
    assert all(load['identity'][k]for k in ['sameStore','newWorld','newScene','currentCorrespondence']) and load['identity']['error'] is None
    assert entry['previousRunId']==plan['previousRunId'] and entry['currentReplacement'] is None
    state=json.loads(opening.read_text());assert state['level']==3 and state['paused'] is True and state['status']=='playing'
    victim=next(u for u in state['units'] if u['id']==2631);preacher=next(u for u in state['units'] if u['id']==3181)
    assert victim['nativeState']==23 and victim['owner']==3181 and victim['team']=='yellow' and victim['kind']=='brave'
    assert preacher['team']=='blue' and preacher['kind']=='preacher' and preacher['hp']>0
    for actorId in plan['savedSermon']['blueIds']:assert any(u['id']==actorId and u['team']=='blue' for u in state['units'])
    lease=json.loads(owner.read_text());assert lease['profileId']==plan['profileId'] and lease['output']==str(output) and lease['runId']!=plan['previousRunId']
    destination=output/'commands/0001.json';assert not destination.exists() and not (output/'consumed-0001.json').exists()
    temp=destination.with_suffix('.admission.tmp');fd=os.open(temp,os.O_WRONLY|os.O_CREAT|os.O_EXCL,0o600)
    with os.fdopen(fd,'wb') as f:f.write(payload);f.flush();os.fsync(f.fileno())
    assert json.loads(owner.read_text())==lease
    os.rename(temp,destination)
    record={'status':'queued','startedAt':started,'queuedAt':datetime.datetime.now(datetime.timezone.utc).isoformat(),'runId':lease['runId'],'profileId':lease['profileId'],'firstBatchSha256':sha(payload),'journalPrefixSha256':sha(raw),'openingSha256':sha(opening.read_bytes()),'pausedTurn':state['turn'],'checkpoint':load['saved'],'gateAt':gate['at'],'helperSha256':sha(Path(__file__).read_bytes()),'scope':'One prepared ordinary first batch after actual Load/current identities; no browser/model/storage mutation'}
    receipt.write_text(json.dumps(record,indent=2)+'\n');print(json.dumps(record),flush=True);break
  time.sleep(.25)
 else:raise TimeoutError('No proven opening within the finite120s host admission wait; no input queued')
except Exception as e:
 receipt.write_text(json.dumps({'status':'failed','startedAt':started,'finishedAt':datetime.datetime.now(datetime.timezone.utc).isoformat(),'error':repr(e),'helperSha256':sha(Path(__file__).read_bytes()),'scope':'Host admission failed; inspect actual command file before any follow-up. No signal or fallback Save.'},indent=2)+'\n');raise
