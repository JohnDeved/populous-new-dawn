from pathlib import Path
import datetime,hashlib,json,os,signal,subprocess,time
root=Path.cwd(); output=root/'work/orchestration/hut-smoke-state-exit/observer-contracts-01'; output.mkdir(exist_ok=False)
node='/opt/codex/runtimes/codex-primary-runtime/dependencies/node/bin/node'
paths=['scripts/local-render/hut-smoke-ignition.mjs','scripts/local-render/hut-smoke-ignition-observer.mjs','tests/hut-smoke-ignition-observer.test.mjs','app/original-effects.json','scripts/orchestration/command-receipt.mjs','decomp/research/hut-smoke-state-exit/ordinary-checker-manifest.json','package.json','package-lock.json','work/orchestration/hut-smoke-state-exit/host-observer-contracts-01.py']
sha=lambda p:hashlib.sha256(Path(p).read_bytes()).hexdigest()
before={p:sha(root/p) for p in paths}
head=subprocess.check_output(['git','rev-parse','HEAD'],text=True).strip()
assert head.startswith('a688f484')
assert subprocess.check_output(['git','status','--porcelain'],text=True)==''
command=[node,'--max-old-space-size=1024','scripts/orchestration/command-receipt.mjs','--output',str(output/'command-receipt.json')]
for p in paths: command+=['--input',p]
script=' && '.join([node+' --max-old-space-size=1024 --test --test-concurrency=1 --test-reporter=tap tests/hut-smoke-ignition-observer.test.mjs']+[node+' --max-old-space-size=1024 --check '+p for p in paths[:3]])
command+=['--','/usr/bin/timeout','--signal=TERM','--kill-after=5s','15s','/bin/sh','-c',script]
receipt={'status':'running','head':head,'startedAt':datetime.datetime.now(datetime.timezone.utc).isoformat(),'sourceBefore':before,'command':command,'cpu':[4],'retry':False,'tools':{p:sha(p) for p in (node,'/usr/bin/timeout','/bin/sh')}}
env={'PATH':str(Path(node).parent)+':/usr/bin:/bin','LANG':'C.UTF-8','LC_ALL':'C.UTF-8','TZ':'UTC','CI':'1','NODE_ENV':'test'}
receipt['environment']=env
(output/'host-receipt.json').write_text(json.dumps(receipt,indent=2)+'\n')
with (output/'wrapper-stdout.txt').open('wb') as stdout,(output/'wrapper-stderr.txt').open('wb') as stderr:
    child=subprocess.Popen(command,cwd=root,env=env,stdout=stdout,stderr=stderr,start_new_session=True)
    receipt['group']=child.pid
    try: receipt['exitCode']=child.wait(timeout=23)
    except subprocess.TimeoutExpired:
        os.killpg(child.pid,signal.SIGTERM)
        try: receipt['exitCode']=child.wait(timeout=2)
        except subprocess.TimeoutExpired:
            os.killpg(child.pid,signal.SIGKILL); receipt['exitCode']=child.wait(timeout=2)
        receipt['hostDeadlineExceeded']=True
    def members():
        found=[]
        for path in Path('/proc').iterdir():
            if not path.name.isdigit(): continue
            try:
                stat=(path/'stat').read_text(); fields=stat[stat.rfind(')')+2:].split()
                if int(fields[2])==child.pid and fields[0]!='Z': found.append(int(path.name))
            except (FileNotFoundError,ProcessLookupError,PermissionError): pass
        return found
    left=members()
    if left:
        os.killpg(child.pid,signal.SIGTERM); time.sleep(.1)
        if members(): os.killpg(child.pid,signal.SIGKILL)
    receipt['remainingOwnedProcesses']=members()
receipt.update(status='terminal',endedAt=datetime.datetime.now(datetime.timezone.utc).isoformat(),sourceAfter={p:sha(root/p) for p in paths})
receipt['sourceUnchanged']=receipt['sourceBefore']==receipt['sourceAfter']; receipt['resourcesReleased']=not receipt['remainingOwnedProcesses']
(output/'host-receipt.json').write_text(json.dumps(receipt,indent=2)+'\n')
print(json.dumps({k:receipt[k] for k in ['status','head','exitCode','startedAt','endedAt','resourcesReleased','sourceUnchanged']}))
