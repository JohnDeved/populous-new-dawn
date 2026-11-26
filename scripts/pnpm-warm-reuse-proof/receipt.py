"""Validate and write exactly one scoped, bounded GitHub Actions receipt."""
import hashlib
import json
import os
from pathlib import Path
import re
import stat
import tempfile

from offline_report import KNOWN_PNPM_ERRORS, SCAN_STATES

REPOSITORY = 'JohnDeved/populous-new-dawn'
REF = 'refs/heads/diagnostics/pnpm-warm-reuse-20261126'
WORKFLOW_REF = f'{REPOSITORY}/.github/workflows/pnpm-warm-reuse-proof.yml@{REF}'
RUNNER = {'environment':'github-hosted','os':'Linux','arch':'X64'}
EXPECTED_TOOLS = {'node':'v24.19.0','pnpm':'11.25.0','platform':'linux/x64/true'}
FAIL_REASONS = {'reserve','timeout','log-cap','installer-exit','surviving-process','validation'}
DOZEN = re.compile(r'[1-9][0-9]{0,11}')
SHA1 = re.compile(r'[0-9a-f]{40}')
HASH = re.compile(r'([0-9a-f]{64})  ([a-z_.]+)')
PAYLOADS = {'proof.py','receipt.py','measure.py','offline_report.py','smoke.cjs'}
CAP = 32768
PHASES = {'admission','bootstrap','toolchain','seed-install','warm-install',
          'seed-native-smoke','warm-native-smoke','physical-proof'}


def require(ok, text):
    if not ok:
        raise ValueError(text)


def github_identity(env, trusted_head):
    s={k:env.get('GITHUB_'+name,'') for k,name in [
        ('repository','REPOSITORY'),('ref','REF'),('head','SHA'),('run','RUN_ID'),
        ('attempt','RUN_ATTEMPT'),('event','EVENT_NAME'),
        ('workflowRef','WORKFLOW_REF'),('workflowSha','WORKFLOW_SHA')]}
    require((s['repository'],s['ref'],s['event'])==(REPOSITORY,REF,'push'),'wrong GitHub scope')
    require(SHA1.fullmatch(s['head']) and s['head']==trusted_head and
            all(DOZEN.fullmatch(s[k]) for k in ('run','attempt')),'wrong GitHub run/checkout identity')
    s['repositoryVisibility']=env.get('RECEIPT_REPOSITORY_VISIBILITY','')
    require(s['repositoryVisibility']=='public','wrong GitHub repository visibility')
    require(s['workflowRef']==WORKFLOW_REF and s['workflowSha']==s['head'],
            'wrong GitHub workflow identity')
    s['runner']={key:env.get('RUNNER_'+suffix,'') for key,suffix in [
        ('environment','ENVIRONMENT'),('os','OS'),('arch','ARCH')]}
    require(s['runner']==RUNNER,'wrong GitHub-hosted Linux X64 runner identity')
    return s


def payloads(root,pins):
    require(stat.S_ISREG(pins.lstat().st_mode),'not a regular payload pin file')
    with pins.open('rb') as stream: b=stream.read(1025)
    require(len(b)<=1024,'oversized pin input')
    result={}
    for line in b.decode('ascii').splitlines():
        m=HASH.fullmatch(line)
        require(m is not None,'invalid payload pin')
        expect,name=m.groups()
        require(name in PAYLOADS and name not in result,'unexpected payload pin')
        item=root/name
        require(stat.S_ISREG(item.lstat().st_mode) and item.resolve(strict=True)==item,
                'nonphysical payload')
        with item.open('rb') as stream:
            require(hashlib.file_digest(stream,'sha256').hexdigest()==expect,'payload digest mismatch')
        result[name]=expect
    require(result.keys()==PAYLOADS,'payload pin set incomplete')
    return result


def document(github,payload_sha,head,tree,metadata,result):
    require(SHA1.fullmatch(head) and SHA1.fullmatch(tree),'invalid source identifiers')
    status=result.get('status')
    if status=='passed':
        require(all((k in result for k in ('admission','head','tree','metadataSha256','node','pnpm',
                                          'platform','arms','nativeBindingMatchesInStore','physical'))),
                'incomplete passing result')
        require((result['head'],result['tree'],result['metadataSha256'])==(head,tree,metadata),
                'passing source provenance mismatch')
        require({key:result.get(key) for key in EXPECTED_TOOLS}==EXPECTED_TOOLS,
                'passing Node/pnpm/platform identity mismatch')
        require(set(result['arms'])=={'seed','warm'} and
                result['arms']['seed']['offline'] is False and result['arms']['warm']['offline'] is True,
                'passing roles missing')
        p=result['arms']['warm'].get('pnpmReportedProgress',{})
        shared=result['physical'].get('sharedAcrossStoreAndBothConsumers',{})
        require(p.get('reused',0)>0 and p.get('downloaded')==0 and shared.get('inodes',0)>0 and
                shared.get('allocatedBytes',0)>0 and bool(result['nativeBindingMatchesInStore']),
                'passing proof missing reuse or physical link')
    else:
        require(status=='failed' and result.get('stage') in PHASES and
                re.fullmatch(r'[A-Za-z][A-Za-z0-9]{0,80}',result.get('errorClass','')) and
                result.get('failureReason') in FAIL_REASONS and 'diagnostic' not in result,
                'invalid failed result')
    if status=='failed' and result.get('failureReason')=='installer-exit':
        x=result.get('installerExit')
        require(isinstance(x,dict) and set(x)=={'exitStatus','pnpmCodes','pnpmCodeObservation'},
                'invalid installer exit shape')
        code=x['exitStatus']
        require(code is None or (type(code) is int and 1<=code<=255),'invalid installer exit status')
        codes=x['pnpmCodes']; scan=x['pnpmCodeObservation']
        require(type(codes) is list and len(codes)<=len(KNOWN_PNPM_ERRORS) and
                all(type(c) is str and c in KNOWN_PNPM_ERRORS for c in codes) and codes==sorted(set(codes)),
                'invalid installer codes')
        require(type(scan) is str and scan in SCAN_STATES and
                (scan=='matched')==bool(codes) and
                (scan!='not-pnpm-stage')==(result['stage'] in {'seed-install','warm-install'}),
                'invalid pnpm code observation')
    else:
        require('installerExit' not in result,'unexpected installer exit')
    d={'schema':1,'github':github,'verifiedHarnessSha256':payload_sha,
       'expectedSource':{'head':head,'tree':tree,'metadataSha256':metadata},
       'result':result,
       'offlineScope':'pnpm --offline and pnpm reporter only; no OS-level network observation',
       'allocationScope':'regular-file st_blocks and inode union only; not whole-disk or RAM savings'}
    b=(json.dumps(d,sort_keys=True,indent=2,allow_nan=False)+'\n').encode()
    require(len(b)<=CAP,'receipt exceeds byte cap')
    return b


def seal(dir,runner_temp,data):
    require(dir.is_absolute() and runner_temp.is_absolute() and dir==dir.resolve(strict=True) and
            runner_temp==runner_temp.resolve(strict=True) and dir.parent==runner_temp and
            re.fullmatch(r'pnpm-warm-receipt\.[A-Za-z0-9]{8}',dir.name),'destination not a unique direct RUNNER_TEMP child')
    s=dir.stat()
    require(stat.S_ISDIR(s.st_mode) and stat.S_IMODE(s.st_mode)==0o700 and s.st_uid==os.geteuid(),
            'destination not eligible private directory')
    require(len(data)<=CAP,'receipt exceeds byte cap')
    temp=None
    try:
        with tempfile.NamedTemporaryFile(mode='wb',prefix='.receipt-',dir=dir,delete=False) as stream:
            temp=Path(stream.name)
            stream.write(data);stream.flush();os.fsync(stream.fileno())
        os.link(temp,dir/'receipt.json')
    finally:
        if temp is not None:
            temp.unlink(missing_ok=True)
