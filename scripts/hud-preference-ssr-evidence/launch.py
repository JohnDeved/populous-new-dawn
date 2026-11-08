"""Isolated-mode bootstrap; only imports this trusted infrastructure directory."""
from pathlib import Path
import importlib.util, json, os, sys, time

def load(name):
    path=Path(__file__).resolve().parent/(name+'.py')
    spec=importlib.util.spec_from_file_location(name,path)
    module=importlib.util.module_from_spec(spec);sys.modules[name]=module;spec.loader.exec_module(module)
    return module

def write_upload_safety(result,path):
    assert result['uploadSafe'] is True and result['exitCode'] in (0,1)
    with open(path,'a',encoding='utf8') as output:output.write('upload_safe=true\n')
    return result['exitCode']

def main():
    root=Path(sys.argv[1])
    assert root.is_absolute() and root==root.resolve()
    assert root==Path(os.environ['GITHUB_WORKSPACE'])/'outputs/hud-preference-ssr'
    finalizer=load('finalizer')
    if len(sys.argv)==3 and sys.argv[2]=='--inventory-only':
        result=finalizer.bounds_for_upload(root,time.monotonic()+20)
        # Set only after validating the actual payload. Nonzero result still fails this step/job.
        return write_upload_safety(result,os.environ['GITHUB_OUTPUT'])
    assert len(sys.argv)==2
    admission=json.loads((root/'runtime-admission.json').read_text())
    identity=admission['identity']
    for key,env in [('candidateSha','PND_UI_CANDIDATE_SHA'),('workflowSha','GITHUB_WORKFLOW_SHA'),
                    ('eventSha','GITHUB_SHA'),('runId','GITHUB_RUN_ID'),('runAttempt','GITHUB_RUN_ATTEMPT')]:
        assert identity[key]==os.environ[env]
    assert identity['workflowSha']==os.environ['PND_HUD_INFRASTRUCTURE_SHA']
    assert os.environ['GITHUB_REF']=='refs/heads/main' and os.environ['GITHUB_EVENT_NAME']=='workflow_dispatch'
    assert identity['runAttempt']=='1'
    return load('supervisor').main()
if __name__=='__main__':
    try:result=main()
    except Exception as error:
        root=Path(sys.argv[1]);blocker={'status':'blocked','error':repr(error),'cleanupCertified':False}
        if root.is_dir() and root.is_absolute() and root==root.resolve() and root==Path(os.environ.get('GITHUB_WORKSPACE',''))/'outputs/hud-preference-ssr':
            try:load('finalizer').failure_payload(root,error)
            except Exception as failure:
                blocker['failureArtifactError']=repr(failure)
                (root/'supervisor-blocker.json').write_text(json.dumps(blocker)+'\n')
        print(json.dumps(blocker));result=1
    raise SystemExit(result)
