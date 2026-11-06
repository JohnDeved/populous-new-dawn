"""Fixed adapter supervisor; import is side-effect free for dry tests.
Tracks detached descendants via subreaper ancestry and PID/start-time identity.
Never reads process environment/command lines or signals unrelated processes.
"""
from pathlib import Path
import ctypes, hashlib, json, os, resource, selectors, signal, stat, subprocess, tempfile, time, sys
from finalizer import bounded_hash, check_time, finalize_payload, verify_binding, failure_payload, authoritative_return

WALL=240; WORK=230; RSS=1536*1024**2; PROFILE=512*1024**2; STREAM=2*1024**2
TEMP_PARENT=Path('/tmp')
# Chrome 156's observed branded singleton suffix; Linux sun_path has 108 bytes,
# including its terminating NUL. Do not use the long evidence-output path here.
SOCKET_SUFFIX='/com.google.Chrome.XXXXXX/SingletonSocket'

def socket_path_bytes(path):return len(os.fsencode(str(path)+SOCKET_SUFFIX))

def directory_identity(path):
    info=path.lstat()
    assert stat.S_ISDIR(info.st_mode) and path.is_absolute() and path==path.resolve(),'Aliased runtime directory'
    return {'device':info.st_dev,'inode':info.st_ino,'uid':info.st_uid,'mode':stat.S_IMODE(info.st_mode)}

class RuntimeTemp:
    """Own one short root, then retain it under output without recursive copying.

    Allocation and retirement belong to the supervisor's existing try/finally.
    A failed/unknown retirement never releases the lane or accepts evidence.
    """
    def __init__(self,root):
        self.root=root;self.path=None;self.identity=None;self.retired_identity=None
        self.destination=root/'runtime-tmp';self.retired=False;self.outside_absent=False

    def create(self,deadline):
        check_time(deadline)
        assert self.path is None,'Runtime temp already allocated'
        self.parent_identity=directory_identity(TEMP_PARENT);self.output_identity=directory_identity(self.root)
        assert self.output_identity['uid']==os.geteuid(),'Foreign output owner'
        assert self.parent_identity['device']==self.output_identity['device'],'Short temp retirement requires the same filesystem'
        assert not os.path.lexists(self.destination),'Runtime temp destination already exists'
        # Linux no-replace rename cannot silently overwrite a late destination.
        self.libc=ctypes.CDLL(None,use_errno=True)
        assert hasattr(self.libc,'renameat2'),'No-replace temp retirement unavailable'
        self.path=Path(tempfile.mkdtemp(prefix='pnd-hud-',dir=TEMP_PARENT))
        self.identity=directory_identity(self.path)
        self.verify()
        assert socket_path_bytes(self.path)<=107,'Chrome singleton socket path too long'
        check_time(deadline)
        return self.path

    def verify(self):
        assert directory_identity(TEMP_PARENT)==self.parent_identity,'Temp parent changed'
        assert directory_identity(self.root)==self.output_identity,'Output parent changed'
        assert directory_identity(self.path)==self.identity,'Owned temp identity changed'
        assert self.identity['uid']==os.geteuid() and self.identity['mode']==0o700,'Unsafe owned temp permissions'

    def retire(self,processes_absent,deadline):
        if self.path is None:return True
        assert processes_absent,'Owned processes must be absent before temp retirement'
        check_time(deadline);self.verify()
        assert not os.path.lexists(self.destination),'Runtime temp destination already exists'
        if self.libc.renameat2(-100,os.fsencode(self.path),-100,os.fsencode(self.destination),1)!=0:
            code=ctypes.get_errno();raise OSError(code,os.strerror(code))
        self.retired_identity=directory_identity(self.destination)
        self.outside_absent=not os.path.lexists(self.path)
        assert self.retired_identity==self.identity and self.outside_absent,'Temp retirement identity/absence not proved'
        self.retired=True
        check_time(deadline)
        return True

    def record(self):
        return {'path':None if self.path is None else str(self.path),'retainedPath':str(self.destination),
                'identity':self.identity,'retiredIdentity':self.retired_identity,
                'socketPathBytes':None if self.path is None else socket_path_bytes(self.path),
                'retired':self.retired,'outsidePathAbsent':self.outside_absent}

def parse_stat(text):
    fields=text[text.rfind(')')+2:].split()
    return {'ppid':int(fields[1]),'start':int(fields[19]),'rss':int(fields[21])*os.sysconf('SC_PAGE_SIZE'),'state':fields[0]}

def snapshot():
    rows={}; unreadable=[]
    for path in Path('/proc').iterdir():
        if not path.name.isdigit(): continue
        try: rows[int(path.name)]=parse_stat((path/'stat').read_text())
        except FileNotFoundError: pass
        except (PermissionError,ValueError,IndexError): unreadable.append(int(path.name))
    return rows,unreadable

class Owners:
    def __init__(self,supervisor_pid): self.supervisor_pid=supervisor_pid; self.known={}
    def update(self,rows):
        parents={self.supervisor_pid}; found=set()
        while True:
            added={pid for pid,row in rows.items() if row['ppid'] in parents and pid!=self.supervisor_pid}-found
            if not added: break
            found.update(added);parents.update(added)
        for pid in found:self.known[pid]=rows[pid]['start']
        return {pid:rows[pid] for pid,start in self.known.items() if pid in rows and rows[pid]['start']==start}
    def signalable(self,pid,row):return self.known.get(pid)==row['start']

def signal_owned(owners,rows,signum):
    sent=[]
    for pid,row in rows.items():
        if not owners.signalable(pid,row) or row['state']=='Z':continue
        fd=None
        try:
            fd=os.pidfd_open(pid,0)
            current=parse_stat(Path(f'/proc/{pid}/stat').read_text())
            if not owners.signalable(pid,current):continue
            # pidfd prevents signaling a reused numeric PID after the identity check.
            signal.pidfd_send_signal(fd,signum)
            sent.append({'pid':pid,'start':row['start'],'signal':signum,'pidfd':True})
        except (FileNotFoundError,ProcessLookupError):pass
        finally:
            if fd is not None:os.close(fd)
    return sent

def bounded_chunk(kept,chunk,cap=STREAM):
    room=max(0,cap-kept);return chunk[:room],len(chunk)>room

def cleanup_proven(remaining,unreadable):return not remaining and not unreadable

def stop_reason(elapsed,rss_bytes,profile_bytes):
    if elapsed>=WORK:return 'work deadline'
    if rss_bytes>RSS:return 'sampled owned RSS limit'
    if profile_bytes>PROFILE:return 'sampled profile size limit'
    return None

def profile_size(root):
    total=0
    for base,dirs,files in os.walk(root,followlinks=False):
        dirs[:]=[name for name in dirs if not (Path(base)/name).is_symlink()]
        for name in files:
            try:total+=(Path(base)/name).lstat().st_size
            except FileNotFoundError:pass
    return total

def main():
    start=time.monotonic()
    root=Path(sys.argv[1]).resolve(); deadline=start+WALL
    sha=lambda p:bounded_hash(p,deadline)
    assert root.is_dir() and not root.is_symlink()
    binding_path=root/'binding.json';binding=json.loads(binding_path.read_text());admission=json.loads((root/'runtime-admission.json').read_text())
    assert admission['approved'] is True and admission['bindingSha256']==sha(binding_path)
    verify_binding(binding,deadline)
    assert not (root/'runtime-attempt.json').exists() and not (root/'evidence').exists()
    # Local subreaper adoption includes detached Chromium if its Node parent exits.
    assert hasattr(os,'pidfd_open') and hasattr(signal,'pidfd_send_signal'),'PID-safe signaling unavailable'
    libc=ctypes.CDLL(None,use_errno=True)
    assert libc.prctl(36,1,0,0,0)==0,('PR_SET_CHILD_SUBREAPER failed',ctypes.get_errno())
    observed=ctypes.c_int();assert libc.prctl(37,ctypes.byref(observed),0,0,0)==0 and observed.value==1
    attempt={'scope':'one fixed-preview adapter','bindingSha256':sha(binding_path),'reservedAt':time.time(),'retry':False}
    (root/'runtime-attempt.json').write_text(json.dumps(attempt)+'\n')
    home=root/'runtime-home'
    mem=int(next(l.split()[1] for l in Path('/proc/meminfo').read_text().splitlines() if l.startswith('MemAvailable:')))*1024;fs=os.statvfs(root)
    assert mem>=4*1024**3 and fs.f_bavail*fs.f_frsize>=2*1024**3,'Fresh resource guard failed'
    command=[binding['node'],'--max-old-space-size=256',str(Path(__file__).resolve().parent/'adapter.mjs'),str(root)]
    def limits():
        os.setsid();resource.setrlimit(resource.RLIMIT_CORE,(0,0));resource.setrlimit(resource.RLIMIT_FSIZE,(64*1024**2,64*1024**2));resource.setrlimit(resource.RLIMIT_CPU,(230,230))
    owners=Owners(os.getpid());stop=None;term_at=None;peak=0;signals=[];failures=[];streams={};selector=selectors.DefaultSelector()
    receipt={'command':command,'bindingSha256':sha(binding_path),'subreaper':True,'hostMemAvailable':mem,'diskFree':fs.f_bavail*fs.f_frsize,'cgroup':'unknown','limits':{'wallSeconds':WALL,'workSeconds':WORK,'sampledOwnedRssBytes':RSS,'sampledProfileBytes':PROFILE,'retainedBytesPerStream':STREAM,'perFileRlimitBytes':64*1024**2,'nodeHeapMiB':256,'coreBytes':0},'ownership':'Only numeric PID/PPID/start-time/RSS; detached descendants adopted by local subreaper.'}
    proc=None;temporary=RuntimeTemp(root)
    try:
        temp=temporary.create(deadline)
        attempt['runtimeTemporary']=temporary.record()
        (root/'runtime-attempt.json').write_text(json.dumps(attempt)+'\n')
        home.mkdir()
        env={'PATH':'/usr/local/bin:/usr/bin:/bin','HOME':str(home),'TMPDIR':str(temp),'LC_ALL':'C','PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD':'1','PYTHONDONTWRITEBYTECODE':'1'}
        assert time.monotonic()-start<WORK,'Prelaunch admission exceeded work budget'
        proc=subprocess.Popen(command,cwd=root,env=env,stdout=subprocess.PIPE,stderr=subprocess.PIPE,stdin=subprocess.DEVNULL,preexec_fn=limits)
        for label,pipe in [('stdout',proc.stdout),('stderr',proc.stderr)]:
            os.set_blocking(pipe.fileno(),False);selector.register(pipe,selectors.EVENT_READ,label);streams[label]={'file':(root/f'runtime.{label}').open('xb'),'kept':0,'overflow':False}
        while True:
            elapsed=time.monotonic()-start;rows,unreadable=snapshot();live=owners.update(rows);current=sum(row['rss'] for row in live.values());peak=max(peak,current)
            unreadable_owned=[pid for pid in unreadable if pid in owners.known]
            if unreadable:failures.append({'unreadableProcessIdentities':unreadable,'knownOwned':unreadable_owned});stop=stop or 'process ownership coverage unknown'
            code=proc.poll()
            if not stop:
                temporary.verify()
                stop=stop_reason(elapsed,current,profile_size(temp))
                if not stop and (root/'evidence').exists() and profile_size(root/'evidence')>48*1024**2:stop='evidence size limit'
                elif not stop and code is not None and any(pid!=proc.pid and row['state']!='Z' for pid,row in live.items()):stop='adapter exited with owned descendants still live'
            if stop and term_at is None:
                term_at=elapsed;signals+=signal_owned(owners,live,signal.SIGTERM)
            if stop and (elapsed-term_at>=3 or elapsed>=WALL-1):signals+=signal_owned(owners,live,signal.SIGKILL)
            for key,_ in selector.select(.05):
                try:chunk=os.read(key.fileobj.fileno(),65536)
                except BlockingIOError:continue
                if not chunk:selector.unregister(key.fileobj);key.fileobj.close();continue
                state=streams[key.data];part,overflow=bounded_chunk(state['kept'],chunk);state['file'].write(part);state['kept']+=len(part)
                if overflow:state['overflow']=True;stop=stop or f'{key.data} overflow'
            # Reap only our adopted children, preserving Popen's direct-child status.
            if code is not None:
                for pid,row in list(live.items()):
                    if pid==proc.pid:continue
                    try:os.waitpid(pid,os.WNOHANG)
                    except ChildProcessError:pass
            if code is not None and not selector.get_map() and not any(row['state']!='Z' for pid,row in live.items() if pid!=proc.pid):break
            if elapsed>=WALL:
                stop=stop or 'wall deadline';signals+=signal_owned(owners,live,signal.SIGKILL);break
    except BaseException as error:
        failures.append({'supervisorError':repr(error)});stop=stop or 'supervisor failure'
    finally:
        # Final failure cleanup stays bounded; absence is rechecked, never inferred from signal success.
        tail=min(start+WALL,time.monotonic()+2)
        while time.monotonic()<tail:
            rows,unreadable=snapshot();live=owners.update(rows)
            remaining={pid:row for pid,row in live.items() if row['state']!='Z'}
            if not remaining:break
            if proc is not None and proc.poll() is None or remaining:
                try:signals+=signal_owned(owners,remaining,signal.SIGKILL)
                except (PermissionError,ProcessLookupError) as error:failures.append({'cleanupSignalError':repr(error)})
            for pid in live:
                if proc is not None and pid==proc.pid:continue
                try:os.waitpid(pid,os.WNOHANG)
                except ChildProcessError:pass
            time.sleep(.05)
        if proc is not None:proc.poll()
        for state in streams.values():state['file'].close()
        selector.close()
        rows,unreadable=snapshot();remaining=owners.update(rows)
        # Reap known zombies once more; any survivor/unreadable owned identity blocks lane release.
        for pid in remaining:
            if proc is not None and pid==proc.pid:continue
            try:os.waitpid(pid,os.WNOHANG)
            except ChildProcessError:pass
        rows,unreadable=snapshot();remaining=owners.update(rows)
        process_cleanup=cleanup_proven(remaining,unreadable)
        if not process_cleanup:failures.append({'cleanupIncomplete':list(remaining),'unreadableOwned':[pid for pid in unreadable if pid in owners.known]})
        temp_cleanup=False
        try:temp_cleanup=temporary.retire(process_cleanup,deadline)
        except Exception as error:failures.append({'tempRetirementError':repr(error)})
        cleanup_complete=process_cleanup and temp_cleanup
        stability=True
        try: verify_binding(binding,deadline)
        except Exception as error:
            stability=False;failures.append({'inputVerificationError':repr(error)})
        receipt.update(remainingOwned=remaining,unreadableProcessIdentities=unreadable,exitCode=None if proc is None else proc.returncode,stopReason=stop,failures=failures,elapsedSeconds=time.monotonic()-start,sampledOwnedPeakRss=peak,ownedProcesses=owners.known,signals=signals,processCleanupComplete=process_cleanup,runtimeTemporary=temporary.record(),cleanupComplete=cleanup_complete,laneReleasePermitted=cleanup_complete,inputStability=stability,streams={name:{'bytes':state['kept'],'overflow':state['overflow']} for name,state in streams.items()})
        receipt['status']='passed-awaiting-evidence-review' if proc is not None and proc.returncode==0 and stop is None and not failures and cleanup_complete and stability else 'failed'
        # Retain process and temp disposition even if later finalization fails.
        (root/'supervisor-receipt.json').write_text(json.dumps(receipt,indent=2)+'\n')
        finalize_payload(root,binding,receipt,deadline)
        print(json.dumps({'status':receipt['status'],'cleanupComplete':cleanup_complete,'laneReleasePermitted':cleanup_complete}))
    return authoritative_return(root,receipt,deadline)
if __name__=='__main__':
    try: result=main()
    except Exception as error:
        blocker={'status':'blocked','action':'supervisor admission/setup','error':repr(error),'cleanupCertified':False,'laneReleasePermitted':False}
        (Path(sys.argv[1]).resolve()/'supervisor-blocker.json').write_text(json.dumps(blocker,indent=2)+'\n')
        print(json.dumps(blocker));result=1
    raise SystemExit(result)
