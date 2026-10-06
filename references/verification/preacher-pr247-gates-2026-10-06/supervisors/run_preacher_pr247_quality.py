import datetime,hashlib,json,os,signal,subprocess,sys,time
from pathlib import Path
root=Path.cwd();expected='0d278277145a83fccdc691874121c84ae71cec19';base='d35835caba6f6d89d9ca97a4f87a4b68744a6bbf';mode=sys.argv[1];work=root/'work/orchestration/preacher-pr247-gates'
sha=lambda data:hashlib.sha256(data).hexdigest()
def git(*args):return subprocess.check_output(['git',*args],cwd=root,text=True).strip()
def identity():
 nm=root/'node_modules';return {'head':git('rev-parse','HEAD'),'tree':git('rev-parse','HEAD^{tree}'),'status':git('status','--porcelain'),'trackedDiffSha256':sha(subprocess.check_output(['git','diff','--binary','HEAD'],cwd=root)),'rootLock':sha((root/'package-lock.json').read_bytes()),'installedLock':sha((nm/'.package-lock.json').read_bytes()),'nodeModulesDevice':nm.stat().st_dev,'nodeModulesInode':nm.stat().st_ino}
def members(group):
 result=[]
 for p in Path('/proc').iterdir():
  if not p.name.isdecimal():continue
  try:
   s=(p/'stat').read_text();v=s[s.rfind(')')+2:].split()
   if int(v[2])==group:result.append({'pid':int(p.name),'state':v[0]})
  except (OSError,ValueError,IndexError):pass
 return result

def run(name,command,cap,stdin=None,expected_source=None):
 out=work/name;out.mkdir(exist_ok=False);before=identity();assert before['head']==expected and before['status']=='';assert (before['nodeModulesDevice'],before['nodeModulesInode'])==(27,1978923)
 start=datetime.datetime.now(datetime.timezone.utc);clock=time.monotonic();actual=['/usr/bin/timeout','--signal=TERM','--kill-after=3s',str(cap)+'s','/usr/bin/taskset','-c','0-3',*command]
 r={'status':'running','command':actual,'cwd':str(root),'startedAt':start.isoformat(),'termDeadline':(start+datetime.timedelta(seconds=cap)).isoformat(),'killDeadline':(start+datetime.timedelta(seconds=cap+3)).isoformat(),'sourceBefore':before,'stdinSource':expected_source}
 if stdin is not None:(out/'stdin-source.ts').write_bytes(stdin);r['stdinSha256']=sha(stdin)
 with (out/'stdout.txt').open('wb') as stdout,(out/'stderr.txt').open('wb') as stderr:
  p=subprocess.Popen(actual,cwd=root,stdout=stdout,stderr=stderr,stdin=subprocess.PIPE if stdin is not None else None,start_new_session=True)
  r['pid']=p.pid;r['processGroup']=p.pid;(out/'receipt.json').write_text(json.dumps(r,indent=2)+'\n')
  print(json.dumps({'name':name,'status':'started','pid':p.pid,'startedAt':r['startedAt'],'termDeadline':r['termDeadline'],'killDeadline':r['killDeadline'],'receipt':str(out/'receipt.json')}),flush=True)
  if stdin is not None:p.communicate(stdin)
  else:
   try:p.wait(timeout=cap+4)
   except subprocess.TimeoutExpired:os.killpg(p.pid,signal.SIGKILL);p.wait(timeout=1)
 left=members(p.pid)
 if left:
  try:os.killpg(p.pid,signal.SIGTERM)
  except ProcessLookupError:pass
  until=time.monotonic()+3
  while left and time.monotonic()<until:time.sleep(.05);left=members(p.pid)
  if left:
   try:os.killpg(p.pid,signal.SIGKILL)
   except ProcessLookupError:pass
   time.sleep(.1);left=members(p.pid)
 after=identity();r.update(exitCode=p.returncode,seconds=time.monotonic()-clock,finishedAt=datetime.datetime.now(datetime.timezone.utc).isoformat(),sourceAfter=after,identityUnchanged=before==after,remainingProcessGroupMembers=left,cleanup='No remaining task-owned process-group members' if not left else 'BLOCKED: task-owned group remains',stdoutSha256=sha((out/'stdout.txt').read_bytes()),stderrSha256=sha((out/'stderr.txt').read_bytes()))
 r['status']='passed' if p.returncode==0 and before==after and not left else 'failed';(out/'receipt.json').write_text(json.dumps(r,indent=2)+'\n')
 print(json.dumps({'name':name,'status':r['status'],'exitCode':p.returncode,'seconds':r['seconds'],'identityUnchanged':r['identityUnchanged'],'remainingProcessGroupMembers':left,'stdout':(out/'stdout.txt').read_text()[-12000:],'stderr':(out/'stderr.txt').read_text()[-12000:],'receipt':str(out/'receipt.json')}),flush=True)
 if before!=after or left:raise RuntimeError('Gate identity/cleanup failure')
 return r

node='/opt/codex/runtimes/codex-primary-runtime/dependencies/node/bin/node'
npm='/opt/codex/runtimes/codex-primary-runtime/dependencies/node/lib/node_modules/npm/bin/npm-cli.js'
private=root.parent/'preacher-pr247-private-20261006'
for key,folder in [('TMPDIR','tmp'),('XDG_CACHE_HOME','cache'),('npm_config_cache','npm')]:
 path=private/folder;path.mkdir(parents=True,exist_ok=True);os.environ[key]=str(path)
for key in ['NODE_OPTIONS','NODE_PATH','PYTHONOPTIMIZE','PYTHONPATH','LD_PRELOAD','LD_LIBRARY_PATH']:os.environ.pop(key,None)
os.environ['PATH']=str(Path(node).parent)+':'+os.environ['PATH']
files=['app/combat-targets.ts','app/live-building-combat.ts','app/live-combat.ts','app/person-orders.ts','app/preacher-conversion.ts']
rows=[]
for name,binary,extra in [('scoped-format-01','oxfmt',['--check']),('scoped-eslint-01','eslint',[]),('scoped-oxlint-01','oxlint',[])]:
 rows.append(run(name,[str(root/'node_modules/.bin'/binary),*extra,*files],60))
raise SystemExit(0 if all(r['status']=='passed' for r in rows) else 1)
