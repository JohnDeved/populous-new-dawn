from pathlib import Path
import datetime,gzip,hashlib,json,os,signal,stat,subprocess,time
ROOT=Path.cwd(); OUT=ROOT/'work/orchestration/hut-smoke-state-exit/standard-01'; DONOR=ROOT.parent/'preacher-automatic-response-qa-20261006/node_modules'; LOCAL=ROOT/'node_modules'
HEAD='2f75201af64fb304c1b87c94b6324e746ec14a13'; NODE='/opt/codex/runtimes/codex-primary-runtime/dependencies/node/bin/node'; NPM=str(Path(NODE).parent.parent/'lib/node_modules/npm/bin/npm-cli.js')
LOCK='65e45d0a87d1ecd4fbf56508b9821eb3bfb3867c8477db4aaa1452eb2bed13d8'; ROOTLOCK='c1599d8d7e3f028e290a13561c653cf926e739e98eb9ec1b476dbe1c2a4558ba'
sha=lambda p:hashlib.sha256(Path(p).read_bytes()).hexdigest(); ident=lambda p:[p.stat().st_dev,p.stat().st_ino]; now=lambda:datetime.datetime.now(datetime.timezone.utc).isoformat(); git=lambda *a:subprocess.check_output(['git',*a],cwd=ROOT).decode().strip()
assert git('rev-parse','HEAD')==HEAD and not git('status','--porcelain'); assert sorted(os.sched_getaffinity(0))==[0,1,2,3]
assert not LOCAL.exists() and not LOCAL.is_symlink(); assert ident(DONOR)==[27,1978923] and not DONOR.is_symlink(); assert sha(DONOR/'.package-lock.json')==LOCK and sha(ROOT/'package-lock.json')==ROOTLOCK
for name,expected in json.loads((ROOT/'decomp/research/hut-smoke-state-exit/correspondence.json').read_text())['integrationSources'].items(): assert sha(ROOT/name)==expected,name
OUT.mkdir(exist_ok=False); record={'status':'prepared','startedAt':now(),'head':HEAD,'hostSha256':sha(__file__),'tools':{p:sha(p) for p in [NODE,NPM,'/usr/bin/timeout','/usr/bin/taskset']},'runs':[],'moves':[],'cacheMoves':[],'returned':False}; source_paths=git('ls-files').splitlines()
def save():
 p=OUT/'receipt.tmp'; p.write_text(json.dumps(record,indent=2)+'\n'); p.replace(OUT/'receipt.json')
def snapshot(): return {'head':git('rev-parse','HEAD'),'tree':git('rev-parse','HEAD^{tree}'),'status':git('status','--porcelain'),'files':{p:sha(ROOT/p) for p in source_paths}}
def inventory(directory):
 rows={}
 for parent,dirs,files in os.walk(directory,followlinks=False):
  for name in dirs+files:
   p=Path(parent)/name; info=p.lstat(); key=str(p.relative_to(directory))
   if stat.S_ISLNK(info.st_mode): rows[key]={'link':os.readlink(p),'mode':info.st_mode}
   elif stat.S_ISREG(info.st_mode): rows[key]={'sha256':sha(p),'size':info.st_size,'mode':info.st_mode}
   elif not stat.S_ISDIR(info.st_mode): raise RuntimeError(key)
 return rows
def dump(name,value):
 p=OUT/name;p.write_bytes(gzip.compress((json.dumps(value,sort_keys=True)+'\n').encode(),mtime=0));return sha(p)
source_before=snapshot();record['sourceBeforeSha256']=dump('source-before.json.gz',source_before); deps_before=inventory(DONOR);record['dependenciesBeforeSha256']=dump('dependencies-before.json.gz',deps_before);save()
owned={};known_session=None;process_read_errors=set();child=None;released=True;moved=False;isolated=[];lock_bytes=(DONOR/'.package-lock.json').read_bytes()
def processes():
 result={}
 for p in Path('/proc').glob('[0-9]*/stat'):
  try:
   raw=p.read_text(); f=raw[raw.rfind(')')+2:].split();result[int(p.parent.name)]={'state':f[0],'parent':int(f[1]),'group':int(f[2]),'session':int(f[3]),'start':int(f[19])}
  except (FileNotFoundError,ProcessLookupError):pass
  except PermissionError:process_read_errors.add(int(p.parent.name))
 return result
def observe():
 current=processes();live={pid:r for pid,r in current.items() if owned.get(pid)==r['start']}
 for pid,r in current.items():
  if known_session is not None and r['session']==known_session:
   if pid in owned and owned[pid]!=r['start']:process_read_errors.add(pid);continue
   live[pid]=r;owned[pid]=r['start']
 while True:
  added={pid:r for pid,r in current.items() if pid not in live and r['parent'] in live}
  if not added:break
  live.update(added)
  for pid,r in added.items():owned[pid]=r['start']
 return {pid:r for pid,r in live.items() if r['state']!='Z'}
def cleanup():
 for sig in (signal.SIGTERM,signal.SIGKILL):
  remaining=observe()
  if not remaining:break
  for pid,row in remaining.items():
   try:os.kill(pid,sig)
   except ProcessLookupError:pass
  time.sleep(.5 if sig==signal.SIGTERM else .1)
 return observe()
try:
 os.rename(DONOR,LOCAL);moved=True;DONOR.mkdir();(DONOR/'.package-lock.json').write_bytes(lock_bytes);stub=ident(DONOR);record['moves'].append({'at':now(),'from':str(DONOR),'to':str(LOCAL),'identity':ident(LOCAL),'temporaryStub':stub});save()
 for name in ['.vite','.vite-temp']:
  cache=LOCAL/name
  if cache.exists():
   assert cache.is_dir() and not cache.is_symlink();target=OUT/('donor-cache-'+name[1:]);cache.rename(target);isolated.append((cache,target));record['cacheMoves'].append({'at':now(),'from':str(cache),'to':str(target)})
 for name in ['tmp','cache','config','npm']: (OUT/name).mkdir()
 env={'PATH':str(Path(NODE).parent)+':/usr/bin:/bin','LANG':'C.UTF-8','LC_ALL':'C.UTF-8','NODE_OPTIONS':'--max-old-space-size=1024','TMPDIR':str(OUT/'tmp'),'XDG_CACHE_HOME':str(OUT/'cache'),'XDG_CONFIG_HOME':str(OUT/'config'),'npm_config_cache':str(OUT/'npm'),'npm_config_update_notifier':'false','npm_config_fund':'false','npm_config_audit':'false','WRANGLER_SEND_METRICS':'false','CI':'1'}
 for mode,cap in [('check',900),('build',300)]:
  assert snapshot()==source_before
  relative=f'work/orchestration/hut-smoke-state-exit/standard-01/{mode}-command.json';argv=[NODE,'scripts/orchestration/command-receipt.mjs','--output',relative]
  for p in ['package.json','package-lock.json','node_modules/.package-lock.json','scripts/orchestration/command-receipt.mjs','decomp/research/hut-smoke-state-exit/correspondence.json',str(OUT/'source-before.json.gz'),str(Path(__file__).resolve())]:argv+=['--input',p]
  argv+=['--','/usr/bin/timeout','--signal=TERM','--kill-after=5s',str(cap)+'s',NODE,NPM,'run',mode]
  start=datetime.datetime.now(datetime.timezone.utc); run={'mode':mode,'argv':argv,'environment':env,'startedAt':start.isoformat(),'termDeadline':(start+datetime.timedelta(seconds=cap)).isoformat(),'killDeadline':(start+datetime.timedelta(seconds=cap+5)).isoformat(),'status':'running'};record['runs'].append(run);record['status']='running';save();owned={};process_read_errors=set();released=False
  with (OUT/f'{mode}-wrapper-stdout.txt').open('xb') as stdout,(OUT/f'{mode}-wrapper-stderr.txt').open('xb') as stderr:
   child=subprocess.Popen(argv,cwd=ROOT,env=env,stdin=subprocess.DEVNULL,stdout=stdout,stderr=stderr,start_new_session=True);known_session=child.pid;first=processes().get(child.pid);verified=bool(first and first['session']==known_session and first['group']==child.pid)
   if verified:owned[child.pid]=first['start']
   run.update(session=known_session,initialIdentity=first);save();print(json.dumps({k:run[k] for k in ['mode','startedAt','termDeadline','killDeadline','session']}),flush=True);start_clock=time.monotonic()
   while child.poll() is None:
    observe()
    if time.monotonic()-start_clock>cap+8:run['outerTimeout']=True;cleanup();break
    time.sleep(.2)
   try:code=child.wait(timeout=2)
   except subprocess.TimeoutExpired:child.kill();code=child.wait(timeout=2)
  remaining=cleanup();released=verified and not process_read_errors and not remaining;raw=json.loads((ROOT/relative).read_text());run.update(endedAt=now(),exitCode=code,status=raw['status'],remainingOwnedProcesses=list(remaining),ownershipVerified=verified,processReadErrors=sorted(process_read_errors),resourcesReleased=released,sourceReceiptUnchanged=raw['source']==raw['sourceAfter']);save();print(json.dumps({k:run[k] for k in ['mode','endedAt','exitCode','status','resourcesReleased']}),flush=True)
  assert released and run['sourceReceiptUnchanged']
  if code!=0 or raw['status']!='passed':break
except BaseException as e:record['failure']=repr(e)
finally:
 if child and not released:
  remaining=cleanup();record['remainingOwnedProcesses']=list(remaining);record['cleanupStatus']='unknown-or-remaining'
 if moved and released:
  for name in ['.vite','.vite-temp']:
   cache=LOCAL/name
   if cache.exists():
    assert cache.is_dir() and not cache.is_symlink();cache.rename(OUT/('generated-cache-'+name[1:]))
  for cache,target in isolated:target.rename(cache)
  deps_after=inventory(LOCAL);record['dependenciesAfterSha256']=dump('dependencies-after.json.gz',deps_after);record['dependenciesUnchanged']=deps_before==deps_after
  assert ident(LOCAL)==[27,1978923] and (LOCAL/'.package-lock.json').read_bytes()==lock_bytes;assert ident(DONOR)==stub and sorted(p.name for p in DONOR.iterdir())==['.package-lock.json'] and (DONOR/'.package-lock.json').read_bytes()==lock_bytes
  DONOR.rename(OUT/'lease-lock-only-stub');LOCAL.rename(DONOR);record.update(returned=True,returnedAt=now(),returnedIdentity=ident(DONOR));save()
 source_after=snapshot();record['sourceAfterSha256']=dump('source-after.json.gz',source_after);record['sourceUnchanged']=source_before==source_after;record['toolsAfter']={p:sha(p) for p in record['tools']};record['toolsUnchanged']=record['tools']==record['toolsAfter'];record.update(status='terminal',endedAt=now(),resourcesReleased=released);save()
print(json.dumps({k:record.get(k) for k in ['status','failure','endedAt','returned','returnedAt','sourceUnchanged','dependenciesUnchanged','toolsUnchanged','resourcesReleased']},indent=2),flush=True)
raise SystemExit(0 if record.get('returned') and record.get('sourceUnchanged') and record.get('dependenciesUnchanged') and record.get('toolsUnchanged') and released and len(record['runs'])==2 and all(r['status']=='passed' for r in record['runs']) else 1)
