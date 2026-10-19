"""Fixed public synthetic-fixture artifact only. Never print credentials or redirects."""
import hashlib, json, os, pathlib, stat, subprocess, sys, zipfile, time, select
ARTIFACT=12155627507
SIZE=239932434
FLOOR=512*1024**2
START=2*1024**3
def require_space(path, reserve=0):
    v=os.statvfs(path)
    if v.f_bavail*v.f_frsize < FLOOR+reserve: raise OSError('Artifact disk safety floor')

SHA='e365a7cd78c8129761f7ac9d4f3f80029b374454a2a22135273486cfa413a200'

def selected(name):
    return name in ['run/status.json','run/comparison-camera.json'] or name in [f'run/{c}-{s}/report.json' for c in ['camera','animation'] for s in ['baseline','candidate']] or name.startswith('run/observation-cas/')

def extract(archive, destination):
    total=0; seen=set(); written=[]
    with zipfile.ZipFile(archive) as z:
        if len(z.infolist())>600: raise ValueError('Archive entry count exceeded')
        for item in z.infolist():
            name=item.filename;p=pathlib.PurePosixPath(name)
            if not name or name.startswith('/') or '\\' in name or any(x in ['.','..'] for x in name.split('/')) or name in seen or stat.S_ISLNK(item.external_attr>>16): raise ValueError('Unsafe archive entry')
            seen.add(name)
            if item.is_dir(): continue
            total+=item.file_size
            if total>805306368 or item.file_size>67108864: raise ValueError('Archive expansion budget exceeded')
            if not selected(name): continue
            relative=pathlib.PurePosixPath(name).relative_to('run');target=destination.joinpath(*relative.parts)
            target.parent.mkdir(parents=True,exist_ok=True)
            with z.open(item) as src, target.open('xb') as out:
                while chunk:=src.read(1024*1024):
                    require_space(destination,len(chunk));out.write(chunk)
            written.append(str(relative))
    return written

def main():
    root=pathlib.Path(sys.argv[1]);root.mkdir(parents=True,exist_ok=False)
    require_space(root,START-FLOOR)
    archive=root/'source-artifact.zip'
    try:
        proc=subprocess.Popen(['gh','api',f'repos/JohnDeved/populous-new-dawn/actions/artifacts/{ARTIFACT}/zip'],stdout=subprocess.PIPE,stderr=subprocess.DEVNULL)
        deadline=time.monotonic()+60;size=0
        try:
            with archive.open('xb') as out:
                while True:
                    remaining=deadline-time.monotonic()
                    if remaining<=0: raise TimeoutError('Artifact retrieval deadline exceeded')
                    if not select.select([proc.stdout],[],[],remaining)[0]: raise TimeoutError('Artifact retrieval deadline exceeded')
                    chunk=os.read(proc.stdout.fileno(),1024*1024)
                    if not chunk: break
                    size+=len(chunk)
                    if size>SIZE: raise ValueError('Artifact download size limit exceeded')
                    require_space(root,len(chunk));out.write(chunk)
            code=proc.wait(timeout=max(.01,deadline-time.monotonic()))
            if code: raise RuntimeError(f'Artifact retrieval failed with exit {code}; stderr withheld to avoid redirect disclosure')
        finally:
            if proc.poll() is None:proc.kill();proc.wait()
        if archive.stat().st_size!=SIZE: raise ValueError('Artifact size mismatch')
        digest=hashlib.sha256()
        with archive.open('rb') as src:
            while chunk:=src.read(1024*1024):digest.update(chunk)
        if digest.hexdigest()!=SHA:raise ValueError('Artifact digest mismatch')
        paths=extract(archive,root)
        print(json.dumps({'artifactId':ARTIFACT,'run':39179366443,'sha256':SHA,'bytes':SIZE,'extractedPaths':paths}))
    except Exception as e:
        print(json.dumps({'status':'failed','errorType':type(e).__name__,'message':str(e)}));raise
if __name__=='__main__':main()
