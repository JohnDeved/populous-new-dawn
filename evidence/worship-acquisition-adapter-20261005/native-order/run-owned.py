import hashlib,json,os,platform,resource,signal,subprocess,sys,time
from pathlib import Path
root=Path.cwd()
out=root/'work/orchestration/worship-request-order'/sys.argv[1]
out.mkdir()
probe=root/'scripts/probe-native-worship-grant-request-order.py'
exe=root.parent/'prerequisites/game/d3dpoptb.exe'
python=root.parent/'prerequisites/venv/bin/python'
inputs=[exe,exe.parent/'data/mwsearch.dat',exe.parent/'levels/constant.dat',exe.parent/'data/hfx0-0.dat',exe.parent/'data/pal0-c.dat',exe.parent/'data/al0-c.dat',root/'app/original-constants.json',root/'app/original-hud.json',root/'app/original-effects.json',root/'scripts/decomp.py',root/'decomp/tools.json',probe]
preserved=[root/'scripts'/f'probe-native-worship-grant-{name}.py' for name in ('handoff','presentation','replacement')]
for sibling,attempt in [('worship-grant-handoff','native-attempt-3'),('worship-grant-presentation','native-attempt-3'),('worship-grant-replacement','native-attempt-1')]:
    preserved+=list((root.parent/sibling/'work/orchestration'/sibling/attempt).rglob('*'))
def digest(paths):
    return {str(p):hashlib.sha256(p.read_bytes()).hexdigest() for p in paths if p.is_file()}
before=digest(inputs+preserved)
(out/'probe-source.py').write_bytes(probe.read_bytes())
command=[str(python),'-B',str(probe),str(exe),'--output',str(out)]
usage_before=resource.getrusage(resource.RUSAGE_CHILDREN)
started=time.monotonic()
with (out/'stdout.log').open('w') as stdout,(out/'stderr.log').open('w') as stderr:
    child=subprocess.Popen(command,stdout=stdout,stderr=stderr,start_new_session=True)
    timed_out=False
    try:code=child.wait(timeout=19)
    except subprocess.TimeoutExpired:
        timed_out=True
        os.killpg(child.pid,signal.SIGKILL)
        code=child.wait()
elapsed=time.monotonic()-started
usage_after=resource.getrusage(resource.RUSAGE_CHILDREN)
try:
    os.killpg(child.pid,0)
    released=False
except ProcessLookupError:
    released=True
after=digest(inputs+preserved)
result=dict(command=command,exitCode=code,timedOut=timed_out,wallSeconds=elapsed,cpuSeconds=usage_after.ru_utime+usage_after.ru_stime-usage_before.ru_utime-usage_before.ru_stime,pid=child.pid,processGroup=child.pid,ownedProcessReleased=released,hardKillAfterSeconds=19,sourceHead=subprocess.check_output(['git','rev-parse','HEAD'],text=True).strip(),inputBefore=before,inputAfter=after,allInputAndAcceptedEvidenceUnchanged=before==after,platform=platform.platform())
(out/'command.json').write_text(json.dumps(result,indent=2)+'\n')
print(json.dumps({k:v for k,v in result.items() if k not in ('inputBefore','inputAfter')}))
print((out/'stdout.log').read_text())
print((out/'stderr.log').read_text())
assert released and before==after
raise SystemExit(code)
