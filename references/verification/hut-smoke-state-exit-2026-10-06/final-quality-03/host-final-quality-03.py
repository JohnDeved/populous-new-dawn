import datetime, gzip, hashlib, json, os, signal, subprocess
from pathlib import Path
ROOT=Path.cwd(); BASELINE=ROOT.parent/'hut-smoke-quality-base-20261007'; DONOR=ROOT.parent/'preacher-automatic-response-qa-20261006'; DEPS=DONOR/'node_modules'; LOCAL=ROOT/'node_modules'
OUT=ROOT/'work/orchestration/hut-smoke-state-exit/final-quality-03'; OUT.mkdir(exist_ok=False)
NODE='/opt/codex/runtimes/codex-primary-runtime/dependencies/node/bin/node'; NPM=str(Path(NODE).parent/'npm')
HEAD='1eee0458be159a829e3c993c448358f15169d03b'; BASE='1c7e6b05687aca14d9350e17c7ae14dc6c68bb97'
LOCK='65e45d0a87d1ecd4fbf56508b9821eb3bfb3867c8477db4aaa1452eb2bed13d8'; ROOTLOCK='c1599d8d7e3f028e290a13561c653cf926e739e98eb9ec1b476dbe1c2a4558ba'
sha=lambda p:hashlib.sha256(Path(p).read_bytes()).hexdigest(); ident=lambda p:[p.stat().st_dev,p.stat().st_ino]; now=lambda:datetime.datetime.now(datetime.timezone.utc).isoformat()
git=lambda *a:subprocess.check_output(['git',*a],cwd=ROOT).decode().strip()
assert git('rev-parse','HEAD')==HEAD and not git('status','--porcelain')
assert ident(DEPS)==[27,1978923] and not DEPS.is_symlink(); assert not LOCAL.exists()
for p in [DEPS/'.package-lock.json']: assert sha(p)==LOCK
for p in [ROOT/'package-lock.json',DONOR/'package-lock.json']: assert sha(p)==ROOTLOCK
record={'startedAt':now(),'head':HEAD,'base':BASE,'status':'prepared','runs':[],'moves':[],'returned':False,'hostSha256':sha(__file__),'tools':{str(p):sha(p) for p in [NODE,Path(NPM).resolve(),'/usr/bin/timeout','/usr/bin/taskset']}}
def save():
 p=OUT/'receipt.tmp'; p.write_text(json.dumps(record,indent=2)+'\n'); p.replace(OUT/'receipt.json')
def inventory(root):
 rows={}
 for p in sorted(root.rglob('*')):
  if p.is_symlink(): rows[str(p.relative_to(root))]={'symlink':os.readlink(p)}
  elif p.is_file(): rows[str(p.relative_to(root))]={'bytes':p.stat().st_size,'sha256':sha(p)}
 return rows
def dump(name, data):
 p=OUT/name; p.write_bytes(gzip.compress(json.dumps(data,sort_keys=True).encode(),mtime=0)); return sha(p)
def sessions(sid):
 rows=[]
 for p in Path('/proc').glob('[0-9]*/stat'):
  try:
   s=p.read_text(); f=s[s.rfind(')')+2:].split()
   if int(f[3])==sid: rows.append({'pid':int(p.parent.name),'state':f[0],'pgrp':int(f[2]),'session':int(f[3]),'start':f[19]})
  except (FileNotFoundError,ProcessLookupError,PermissionError): pass
 return rows
source_paths=git('ls-files','app','tests','scripts','decomp/research/firewarrior-firing-phase','package.json','package-lock.json','tsconfig.json').splitlines(); before={p:sha(ROOT/p) for p in source_paths}
record['sourceInventorySha256']=dump('source-before.json.gz',before); deps_before=inventory(DEPS); record['dependencyInventorySha256']=dump('dependencies-before.json.gz',deps_before); save()
lock_bytes=(DEPS/'.package-lock.json').read_bytes(); moved=False; child=None; location=LOCAL
assert not (BASELINE/'node_modules').exists()
assert subprocess.check_output(['git','rev-parse','HEAD'],cwd=BASELINE).decode().strip()==BASE
baseline_paths=subprocess.check_output(['git','ls-files','app','package.json','package-lock.json','.oxlintrc.json','.oxfmtrc.json','eslint.config.mjs'],cwd=BASELINE).decode().splitlines()
baseline_before={p:sha(BASELINE/p) for p in baseline_paths}
record['baselineSourceInventorySha256']=dump('baseline-source-before.json.gz',baseline_before)
try:
 os.rename(DEPS,LOCAL); moved=True
 DEPS.mkdir(); (DEPS/'.package-lock.json').write_bytes(lock_bytes)
 record['moves'].append({'at':now(),'actualSource':str(DEPS),'actualTarget':str(LOCAL),'actualIdentity':ident(LOCAL),'donorTemporaryStub':ident(DEPS)}); save()
 env={'PATH':str(Path(NODE).parent)+':/usr/bin:/bin','LANG':'C.UTF-8','LC_ALL':'C.UTF-8','NODE_OPTIONS':'--max-old-space-size=1024','npm_config_cache':str(OUT/'npm-cache'),'npm_config_update_notifier':'false','npm_config_fund':'false','npm_config_audit':'false'}
 files=['app/hut-smoke-runtime.ts','app/live-building-combat.ts','app/spell-effects-runtime.ts']
 for label,jobroot,cmd in [('preview',ROOT,[NODE,'work/orchestration/hut-smoke-state-exit/preview-and-token-proof.mjs']),('candidate-oxlint',ROOT,[NODE,'node_modules/oxlint/bin/oxlint','--format','json',*files]),('candidate-eslint',ROOT,[NODE,'node_modules/eslint/bin/eslint.js','--format','json',*files]),('baseline-oxlint',BASELINE,[NODE,'node_modules/oxlint/bin/oxlint','--format','json',*files]),('baseline-eslint',BASELINE,[NODE,'node_modules/eslint/bin/eslint.js','--format','json',*files])]:
  if location != jobroot/'node_modules':
   target=jobroot/'node_modules'; assert not target.exists(); os.rename(location,target); record['moves'].append({'at':now(),'from':str(location),'to':str(target),'identity':ident(target)}); location=target; save()
  output=f'work/orchestration/hut-smoke-state-exit/final-quality-03/{label}-command.json'
  argv=[NODE,'--max-old-space-size=1024',str(jobroot/'scripts/orchestration/command-receipt.mjs'),'--output',output]
  for p in ['package.json','package-lock.json','node_modules/.package-lock.json','scripts/orchestration/command-receipt.mjs',str(OUT/'source-before.json.gz'),str(Path(__file__).resolve())]: argv+=['--input',p]
  argv+=['--','/usr/bin/timeout','--signal=TERM','--kill-after=5s','60s',*cmd]
  run={'label':label,'argv':argv,'environment':env,'startedAt':now()}; record['runs'].append(run); save()
  with (OUT/f'{label}-wrapper-stdout.txt').open('xb') as stdout,(OUT/f'{label}-wrapper-stderr.txt').open('xb') as stderr:
   child=subprocess.Popen(argv,cwd=jobroot,env=env,stdin=subprocess.DEVNULL,stdout=stdout,stderr=stderr,start_new_session=True,preexec_fn=lambda:os.sched_setaffinity(0,{0,1,2,3})); run['session']=child.pid; save()
   try: code=child.wait(timeout=70)
   except subprocess.TimeoutExpired:
    run['outerTimeout']=True
    for group in {r['pgrp'] for r in sessions(child.pid)}: os.killpg(group,signal.SIGKILL)
    code=child.wait(timeout=5)
  remaining=sessions(child.pid)
  if remaining:
   for group in {r['pgrp'] for r in remaining}: os.killpg(group,signal.SIGKILL)
   remaining=sessions(child.pid)
  raw=json.loads((jobroot/output).read_text()); run.update(endedAt=now(),exitCode=code,status=raw['status'],sourceReceiptUnchanged=raw['source']==raw['sourceAfter'],remainingOwnedProcesses=remaining,resourcesReleased=not remaining); save()
  print(json.dumps({k:run[k] for k in ['label','endedAt','exitCode','status','resourcesReleased']}),flush=True)
  assert not remaining and run['sourceReceiptUnchanged']
 record['status']='terminal'
finally:
 if moved:
  assert child is None or (child.poll() is not None and not sessions(child.pid)), 'Cleanup unverified; dependencies retained'
  after={p:sha(ROOT/p) for p in source_paths}; record['sourceAfterInventorySha256']=dump('source-after.json.gz',after); record['sourceUnchanged']=before==after and git('rev-parse','HEAD')==HEAD and not git('status','--porcelain')
  baseline_after={p:sha(BASELINE/p) for p in baseline_paths}; record['baselineSourceAfterInventorySha256']=dump('baseline-source-after.json.gz',baseline_after); record['baselineSourceUnchanged']=baseline_before==baseline_after
  deps_after=inventory(location); record['dependenciesAfterInventorySha256']=dump('dependencies-after.json.gz',deps_after); record['dependenciesUnchanged']=deps_before==deps_after
  assert ident(location)==[27,1978923] and sha(location/'.package-lock.json')==LOCK
  assert [p.name for p in DEPS.iterdir()]==['.package-lock.json'] and sha(DEPS/'.package-lock.json')==LOCK
  os.rename(DEPS,OUT/'temporary-donor-lock-stub'); os.rename(location,DEPS)
  record.update(returned=True,returnedAt=now(),returnedIdentity=ident(DEPS),localPathAbsent=not LOCAL.exists()); save()
record['endedAt']=now(); save(); print(json.dumps(record,indent=2))
