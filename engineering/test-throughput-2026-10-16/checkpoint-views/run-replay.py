from pathlib import Path
import subprocess,json,hashlib,time,resource,datetime,os
p=Path(__file__).parent;s=p/'snapshot'
def hashes():return {str(f.relative_to(s)):hashlib.sha256(f.read_bytes()).hexdigest() for f in s.rglob('*') if f.is_file() and not f.is_symlink()}
before=hashes();start=time.monotonic();r={'startedAt':datetime.datetime.now(datetime.timezone.utc).isoformat(),'command':['node','--test','--test-reporter=tap','tests/balloon-attack.test.mjs'],'capSeconds':180,'sourceHashes':before,'node':subprocess.check_output(['node','--version'],text=True).strip(),'freeBytesBefore':os.statvfs(p).f_bavail*os.statvfs(p).f_frsize}
with open(p/'replay.tap','w') as out,open(p/'replay.stderr','w') as err:
 try:
  result=subprocess.run(r['command'],cwd=s,stdout=out,stderr=err,timeout=180);r['exitCode']=result.returncode;r['timedOut']=False
 except subprocess.TimeoutExpired:r['exitCode']=None;r['timedOut']=True
r['elapsedSeconds']=time.monotonic()-start;r['sourceStable']=hashes()==before;r['endedAt']=datetime.datetime.now(datetime.timezone.utc).isoformat();u=resource.getrusage(resource.RUSAGE_CHILDREN);r['childUsage']={'userSeconds':u.ru_utime,'systemSeconds':u.ru_stime,'maxRssKiB':u.ru_maxrss};(p/'replay-receipt.json').write_text(json.dumps(r,indent=2)+'\n');print(json.dumps({k:v for k,v in r.items() if k!='sourceHashes'}))
