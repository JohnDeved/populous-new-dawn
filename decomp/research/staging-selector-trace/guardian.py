import datetime,hashlib,json,os,signal,subprocess,sys,time
from pathlib import Path
source=Path(__file__).parent
repository=source.parents[2]
root=repository/'work/orchestration/staging-selector-trace-01-20261007'
manifest_bytes=(root/'preflight.json').read_bytes()
assert hashlib.sha256(manifest_bytes).hexdigest()==sys.argv[2]
manifest=json.loads(manifest_bytes)
assert sys.flags.ignore_environment and sys.flags.no_user_site and not sys.flags.optimize
assert subprocess.check_output(['git','rev-parse','HEAD'],cwd=repository,text=True).strip()==manifest['sourceHead']
assert not subprocess.check_output(['git','status','--porcelain'],cwd=repository,text=True)
assert subprocess.check_output(['git','rev-parse','HEAD:app'],cwd=repository,text=True).strip()==manifest['appTree']
for item in manifest['files']:
 assert hashlib.sha256((repository/item['path']).read_bytes()).hexdigest()==item['sha256'],item['path']
for item in manifest['tools']:
 assert hashlib.sha256(Path(item['path']).read_bytes()).hexdigest()==item['sha256'],item['path']
assert sys.argv[1]==manifest['node']
for name in ['trace.jsonl','result.json','started.json','cleanup.json']:assert not (root/name).exists(),name
started=datetime.datetime.now(datetime.timezone.utc);start=time.monotonic();child=None
clean={'startedAt':started.isoformat(),'termDeadline':(started+datetime.timedelta(seconds=120)).isoformat(),'killDeadline':(started+datetime.timedelta(seconds=130)).isoformat(),'timeoutSeconds':120,'killGraceSeconds':10,'cpu':[4],'cleanupSignals':[]}
def members(group):
 found=[]
 for path in Path('/proc').iterdir():
  if not path.name.isdigit():continue
  try:
   raw=(path/'stat').read_text();fields=raw[raw.rfind(')')+2:].split()
   if int(fields[2])==group:found.append({'pid':int(path.name),'state':fields[0]})
  except (OSError,ValueError,IndexError):pass
 return found
def cleanup():
 if child and members(child.pid):
  try:os.killpg(child.pid,signal.SIGTERM);clean['cleanupSignals'].append('TERM owned group')
  except ProcessLookupError:pass
  end=min(start+130,time.monotonic()+10)
  while members(child.pid) and time.monotonic()<end:time.sleep(.05)
  if members(child.pid):
   try:os.killpg(child.pid,signal.SIGKILL);clean['cleanupSignals'].append('KILL owned group')
   except ProcessLookupError:pass
  child.wait(timeout=1)
def stop(signum,frame):
 cleanup();raise SystemExit(128+signum)
for sig in (signal.SIGTERM,signal.SIGINT):signal.signal(sig,stop)
try:
 command=['/usr/bin/timeout','--signal=TERM','--kill-after=10s','120s','/usr/bin/taskset','--cpu-list','4',sys.argv[1],str(source/'runner.mjs')]
 environment=dict(os.environ)
 for name in ['NODE_OPTIONS','NODE_PATH','PYTHONPATH','PYTHONOPTIMIZE','LD_PRELOAD','LD_LIBRARY_PATH']:environment.pop(name,None)
 environment['PND_STAGING_TRACE']='1'
 child=subprocess.Popen(command,start_new_session=True,env=environment)
 clean.update(command=command,pid=child.pid,processGroup=child.pid)
 clean['processIdentity']=Path(f'/proc/{child.pid}/stat').read_text()
 (root/'started.json').write_text(json.dumps(clean,indent=2)+'\n')
 try:rc=child.wait(timeout=130)
 except subprocess.TimeoutExpired:clean['timedOut']=True;cleanup();rc=124
finally:
 cleanup()
 remaining=members(child.pid) if child else None
 clean.update(elapsedSeconds=time.monotonic()-start,exitCode=locals().get('rc'),remainingProcessGroupMembers=remaining,resourcesReleased=remaining==[],finishedAt=datetime.datetime.now(datetime.timezone.utc).isoformat())
 (root/'cleanup.json').write_text(json.dumps(clean,indent=2)+'\n')
sys.exit(rc if clean['resourcesReleased'] else 125)
