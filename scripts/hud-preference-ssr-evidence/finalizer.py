"""Mode-local pure validation plus bounded file finalization; no browser or subprocess."""
from pathlib import Path
import hashlib, json, os, time

CAP=48*1024**2
CASES=['server','default','manual','invalid','blocked']
HTML=[name+'.html' for name in ['server','default','manual','manual-reload','invalid','blocked']]
PNG=['manual-pending.png','default-settled.png','manual-settled.png','manual-clamped-remount.png',
     'manual-reloaded.png','invalid-settled.png','blocked-settled.png','blocked-write-session.png']
META=['candidate-source.json','infrastructure-source.json','dependencies.json','dependency-profile.json',
      'deployment.json','binding.json','runtime-admission.json','runtime-attempt.json',
      'supervisor-receipt.json','runtime.stdout','runtime.stderr','setup-blocker.json','supervisor-blocker.json']

def check_time(deadline):
    if time.monotonic()>=deadline:raise TimeoutError('Hosted absolute finalization deadline')

def bounded_hash(path,deadline):
    check_time(deadline);path=Path(path)
    assert path.is_file() and not path.is_symlink(),str(path)
    h=hashlib.sha256()
    with path.open('rb') as stream:
        while chunk:=stream.read(1024*1024):check_time(deadline);h.update(chunk)
    check_time(deadline);return h.hexdigest()

def membership_delta(expected,actual):
    # Names only, never changed-file contents. The mismatch always remains fatal.
    before=set(expected);after=set(actual)
    def bounded(names):
        selected=sorted(names)[:32]
        return {'count':len(names),'names':[name[:256] for name in selected],
                'truncated':len(names)>32 or any(len(name)>256 for name in selected)}
    return {'added':bounded(after-before),'removed':bounded(before-after)}

def verify_binding(binding,deadline):
    for item in binding['files']:
        p=Path(item['path']);assert bounded_hash(p,deadline)==item['sha256'] and p.stat().st_mode&0o7777==item['mode'],str(p)
    for link in binding['links']:
        check_time(deadline);assert os.readlink(link['path'])==link['target'],link['path']
    for directory,expected in binding['directories'].items():
        check_time(deadline)
        actual=sorted(p.name for p in Path(directory).iterdir() if p.name not in expected['excluded'])
        assert actual==expected['names'], 'Runtime directory membership changed: '+directory+' '+json.dumps(membership_delta(expected['names'],actual),ensure_ascii=True,separators=(',',':'))

def validate_result(report,owner,binding):
    assert owner['status']=='passed-awaiting-evidence-review'
    assert owner['exitCode']==0 and owner['stopReason'] is None and owner['failures']==[]
    assert owner['cleanupComplete'] is True and owner['laneReleasePermitted'] is True and owner['inputStability'] is True
    assert owner['processCleanupComplete'] is True
    temporary=owner['runtimeTemporary']
    assert temporary['retired'] is True and temporary['outsidePathAbsent'] is True
    assert temporary['identity']==temporary['retiredIdentity'] and temporary['identity']['mode']==0o700
    assert 0<temporary['socketPathBytes']<=107
    home=owner['runtimeHome'];identity=home['identity']
    assert home['allocated'] is True and home['verifiedAfterProcessAbsence'] is True and home['retainedInOutput'] is True
    assert identity['mode']==0o700 and identity['uid']==temporary['identity']['uid']
    assert all(type(identity[key]) is int and identity[key]>=0 for key in ['device','inode','uid','mode'])
    profile=owner['sampledProfilePeak']
    assert all(type(profile[key]) is int and profile[key]>=0 for key in ['temporaryBytes','homeBytes','totalBytes'])
    assert profile['temporaryBytes']+profile['homeBytes']==profile['totalBytes']<=512*1024**2
    peak=owner['sampledOwnedPeakRss'];sample=owner['sampledOwnedPeakProcesses']
    assert type(peak) is int and 0<=peak<=1536*1024**2 and sample['truncated'] is False
    processes=sample['processes'];assert len(processes)<=256
    assert all(type(row[key]) is int and row[key]>=0 for row in processes for key in ['pid','start','rss'])
    assert all(row['pid']>0 for row in processes)
    assert len({row['pid'] for row in processes})==len(processes)
    assert sum(row['rss'] for row in processes)==peak
    assert owner['remainingOwned']=={} and owner['unreadableProcessIdentities']==[]
    assert all(not stream['overflow'] for stream in owner['streams'].values())
    assert report['status']=='passed-awaiting-pixel-review'
    assert report['application']==binding['application'] and report['url']==binding['url']
    assert [case['name'] for case in report['cases']]==CASES
    assert all(case['status']=='passed' for case in report['cases'])
    assert report['cases'][0]['serverDom']=={'shell':True,'hud':True,'restore':True,'effectsNotClaimed':True}
    assert [(c['seed'],c['javaScriptEnabled'],c['blockedHudRead']) for c in report['cases']]==[
        (None,False,False),(None,True,False),('1.5',True,False),('invalid',True,False),('2.5',True,True)]
    assert [len(c['measurements']) for c in report['cases']]==[0,1,4,1,2]
    assert [item['name'] for item in report['documents']]==HTML
    assert sorted(item['name'] for item in report['images'])==sorted(PNG)
    assert report['counts']['contexts']==5 and report['counts']['navigations']==6
    assert report['counts']['html']==6 and report['counts']['images']==8
    assert all(d['url']==binding['url'] and d['status']==200 and 'text/html' in d['contentType'].lower() for d in report['documents'])
    assert len(report['diagnostics'])<=256
    assert all(d['level']=='warning' for d in report['diagnostics'])
    assert [c for c in report['cleanup'] if 'context' in c]==[{'context':name,'closed':True} for name in CASES]
    assert {'owner':'browser','closed':True} in report['cleanup']
    assert all(c.get('closed') is True and 'error' not in c for c in report['cleanup'])
    pending=report['cases'][2]['pendingEvents']
    assert pending['reason']=='observed' and pending['observation']<=pending['release']
    assert 0<=pending['observation']-pending['intercept']<=3000
    assert 0<=pending['release']-pending['intercept']<=4000 and pending['status']==200
    assert report['cases'][2]['compositionResponse']['sha256']==binding['composition']['sha256']
    assert report['cases'][2]['compositionResponse']['bytes']==binding['composition']['bytes']
    assert report.get('browserVersion') and report['elapsedMs']<240000

def inventory(directory,deadline):
    directory=Path(directory);assert directory.is_dir() and not directory.is_symlink()
    result={};total=0
    for path in sorted(directory.rglob('*')):
        check_time(deadline);assert not path.is_symlink(),str(path)
        if path.is_dir():continue
        name=path.relative_to(directory).as_posix()
        assert name in META or name in ['evidence/receipt.json','artifact-inventory.json'] or name in ['evidence/'+n for n in HTML+PNG],name
        assert path.is_file();size=path.stat().st_size;total+=size
        assert total<=CAP,'Combined artifact payload exceeds 48 MiB'
        if path.suffix=='.png':assert size<=4*1024**2
        elif path.suffix=='.html':assert size<=2*1024**2
        elif path.name.startswith('runtime.') and path.suffix in ('.stdout','.stderr'):assert size<=2*1024**2
        else:assert size<=16*1024**2
        if name!='artifact-inventory.json':result[name]={'bytes':size,'sha256':bounded_hash(path,deadline)}
    return {'files':result,'totalBytesIncludingInventory':total,'capBytes':CAP}

def finalize_payload(root,binding,owner,deadline):
    root=Path(root);payload=root/'payload';assert not payload.exists()
    report=None
    try:
        check_time(deadline)
        if (root/'evidence/receipt.json').exists():
            report=json.loads((root/'evidence/receipt.json').read_text())
        assert report is not None,'Missing adapter receipt'
        validate_result(report,owner,binding)
        assert report['sourceBindingSha256']==bounded_hash(root/'binding.json',deadline)
        assert owner['bindingSha256']==report['sourceBindingSha256']
        for item in report['documents']+report['images']:
            path=root/'evidence'/item['name']
            assert path.stat().st_size==item['bytes'] and bounded_hash(path,deadline)==item['sha256']
    except Exception as error:
        owner['status']='failed';owner['finalAcceptanceError']=repr(error)
    owner['finalizedAtElapsedSeconds']=240-(deadline-time.monotonic())
    check_time(deadline)
    (root/'supervisor-receipt.json').write_text(json.dumps(owner,indent=2)+'\n')
    payload.mkdir()
    paths=[root/name for name in META if (root/name).exists()]
    if (root/'evidence').exists():
        assert not (root/'evidence').is_symlink()
        for path in (root/'evidence').iterdir():
            assert path.name in HTML+PNG+['receipt.json'], 'Unexpected evidence filename'
            paths.append(path)
    # Preflight the entire retained payload before copying bytes. Overflow remains a failure.
    total=0
    for path in paths:
        check_time(deadline);assert path.is_file() and not path.is_symlink();total+=path.stat().st_size
    if total>CAP-1024*1024:
        owner['status']='failed';owner['artifactOverflowBytes']=total
        (root/'supervisor-receipt.json').write_text(json.dumps(owner,indent=2)+'\n')
        paths=[root/'supervisor-receipt.json']
    for path in paths:
        check_time(deadline);target=payload/path.relative_to(root);target.parent.mkdir(exist_ok=True)
        with path.open('rb') as source,target.open('xb') as destination:
            while chunk:=source.read(1024*1024):check_time(deadline);destination.write(chunk)
    data=inventory(payload,deadline)
    inventory_path=payload/'artifact-inventory.json'
    # Fixed point includes inventory bytes but never recursively hashes itself.
    for _ in range(5):
        encoded=(json.dumps(data,indent=2)+'\n').encode()
        total=sum(item['bytes'] for item in data['files'].values())+len(encoded)
        if data['totalBytesIncludingInventory']==total:break
        data['totalBytesIncludingInventory']=total
    assert total<=CAP
    check_time(deadline);inventory_path.write_bytes(encoded)
    assert inventory(payload,deadline)==data
    check_time(deadline)

def verify_payload(root,deadline):
    root=Path(root);payload=root/'payload'
    stored=json.loads((payload/'artifact-inventory.json').read_text())
    assert inventory(payload,deadline)==stored
    # Late owner/deadline failures must never upload an earlier passing snapshot.
    for name,item in stored['files'].items():
        assert bounded_hash(root/name,deadline)==item['sha256'],'Post-finalization drift: '+name
    return stored

def compact_failure_facts(root):
    """Retain recorded identity/cleanup facts; missing or malformed means unknown."""
    root=Path(root);facts={'identity':None,'cleanup':{'known':False}}
    for name in ['runtime-admission.json','setup-blocker.json']:
        path=root/name
        if not path.exists():continue
        try:
            assert path.is_file() and not path.is_symlink() and path.stat().st_size<=65536
            value=json.loads(path.read_text());identity=value.get('identity')
            assert isinstance(identity,dict)
            keys=['candidateSha','workflowSha','eventSha','runId','runAttempt','workflowRef','event']
            facts['identity']={key:identity[key] for key in keys if key in identity}
            assert len(json.dumps(facts['identity']).encode())<=4096
            facts['identityRecordedIn']=name;break
        except Exception:
            facts['identity']=None
    path=root/'supervisor-receipt.json'
    if path.exists():
        try:
            assert path.is_file() and not path.is_symlink() and path.stat().st_size<=1024**2
            owner=json.loads(path.read_text())
            keys=['cleanupComplete','laneReleasePermitted','processCleanupComplete','runtimeTemporary','inputStability','exitCode','stopReason',
                  'remainingOwned','unreadableProcessIdentities','bindingSha256','elapsedSeconds']
            recorded={key:owner[key] for key in keys if key in owner}
            assert len(json.dumps(recorded).encode())<=16384
            facts['cleanup']={'known':isinstance(owner.get('cleanupComplete'),bool),
                'recordedIn':'supervisor-receipt.json','recorded':recorded}
        except Exception:
            facts['cleanup']={'known':False,'reason':'Supervisor receipt unavailable or malformed'}
    return facts

def failure_payload(root,error):
    """Bounded nonpassing fallback, retaining compact recorded identity/cleanup."""
    root=Path(root);payload=root/'payload'
    facts=compact_failure_facts(root)
    if payload.exists():
        assert not payload.is_symlink()
        destination=next((root/f'incomplete-payload-{i}' for i in range(10)
                          if not (root/f'incomplete-payload-{i}').exists()),None)
        assert destination is not None,'Failure preservation slots exhausted'
        payload.rename(destination)
    payload.mkdir()
    message=repr(error)
    blocker={'status':'blocked','action':'hosted supervision/finalization','error':message[:2048],
        'errorTruncated':len(message)>2048,'acceptance':False,'facts':facts,
        'rawEvidenceLocation':'Partial raw files preserved in runner workspace; this is a nonpassing compact failure artifact'}
    encoded=(json.dumps(blocker,indent=2)+'\n').encode();assert len(encoded)<=32768
    (root/'supervisor-blocker.json').write_bytes(encoded)
    (payload/'supervisor-blocker.json').write_bytes(encoded)
    data=inventory(payload,time.monotonic()+2)
    for _ in range(5):
        encoded=(json.dumps(data,indent=2)+'\n').encode()
        total=sum(item['bytes'] for item in data['files'].values())+len(encoded)
        if data['totalBytesIncludingInventory']==total:break
        data['totalBytesIncludingInventory']=total
    (payload/'artifact-inventory.json').write_bytes(encoded)

def bounds_for_upload(root,deadline):
    """A failed step can expose only a separately verified upload-safe failure artifact."""
    try:
        verify_payload(root,deadline)
        return {'exitCode':0,'uploadSafe':True}
    except Exception as error:
        failure_payload(root,error)
        verify_payload(root,time.monotonic()+5)
        return {'exitCode':1,'uploadSafe':True}

def authoritative_return(root,receipt,deadline):
    """Actual final supervisor decision, callable without process-control side effects."""
    if time.monotonic()>=deadline:
        receipt['status']='failed';receipt['finalDeadlineExceeded']=True
        (Path(root)/'supervisor-receipt.json').write_text(json.dumps(receipt,indent=2)+'\n')
        failure_payload(root,TimeoutError('Authoritative return exceeded 240 seconds; no pass'))
        return 1
    return 0 if receipt['status']=='passed-awaiting-evidence-review' else 1
