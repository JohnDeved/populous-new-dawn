#!/usr/bin/env python3
"""Glue for existing trusted manual hosted workflow. Not a package installer.

The workflow still executes standard pinned npm/pnpm setup with scripts disabled.
This file records observed success, verifies CfT data, inventories narrow actual
system tools and calls the reviewed one-shot entry. Never run from candidate code.
"""
import hashlib
import json
import os
from pathlib import Path, PurePosixPath
import re
import shutil
import stat
import subprocess
import sys
import sysconfig
import zipfile
sys.dont_write_bytecode = True
HERE = Path(__file__).resolve().parent
sys.path.insert(0, str(HERE))
import controller as policy
import execution
import hosted_entry
import hosted_resources
import prepare_inputs
import qualification_review

REPOSITORY = 'JohnDeved/populous-new-dawn'
WORKFLOW = '.github/workflows/native-ui-evidence.yml'
ARCHIVE_BYTES = 120477194
EXPANDED_BYTES = 273953147
ARCHIVE_MEMBERS = 287
RAW_BYTES = 16*1024**2
ADAPTER_SHA = '78ff6594ce980eaad5ef024b16c49e8ad00cd71a15b14110968282d586f36447'
HELPER_COMMIT = 'aa929130115be16ccccc028d07199c5f7d4d73a2'
HELPERS = ('shared_execution.py','shared_runtime.py','shared_setup.py','shared_workspace.py','state_serialization.py')
HELPER_SHA256 = {'state_serialization.py': 'e363a34595ae6d9e159e2c0d43e10d801c6f97a48d079e66a0daa925e59b97ba', 'shared_workspace.py': '69436e7fa46b0e8307ff01fc52ffe57132eb76b748632c6d9d3444c466c3cf53', 'shared_execution.py': '78ff6594ce980eaad5ef024b16c49e8ad00cd71a15b14110968282d586f36447', 'shared_setup.py': 'ac28e0052dd9922a0f393e7ceb1b225025409fa9aa5d1ad24ea388211631fd43', 'shared_runtime.py': 'bfc20d91544167d9491f3246c0b651eba3345468e910bd8ed6eec7a55a421d65'}


def save(path, value):
    with Path(path).open('x') as stream:
        json.dump(value, stream, indent=2, sort_keys=True);stream.write('\n')


def identity(env):
    policy.require(env['GITHUB_REPOSITORY'] == REPOSITORY and env['GITHUB_EVENT_NAME'] == 'workflow_dispatch' and
                   env['GITHUB_REF'] == 'refs/heads/main' and
                   env['GITHUB_WORKFLOW_REF'] == REPOSITORY+'/'+WORKFLOW+'@refs/heads/main', 'Trusted main dispatch required')
    policy.require(re.fullmatch('[a-f0-9]{40}', env['GITHUB_WORKFLOW_SHA']) and
                   env['GITHUB_SHA'] == env['GITHUB_WORKFLOW_SHA'], 'Exact workflow identity required')
    policy.require(env['PND_UI_CANDIDATE_SHA'] == policy.REVISION and env['PND_EVIDENCE_KIND'] == 'material-lifecycle',
                   'Exact PR722 material mode required')
    policy.require(re.fullmatch('[0-9]+', env['GITHUB_RUN_ID']) and env['GITHUB_RUN_ATTEMPT'] == '1',
                   'One first-attempt dispatch only; no reruns')
    policy.require(sys.platform == 'linux' and os.geteuid() != 0, 'Unprivileged Linux hosted runner required')
    return {key:env[key] for key in ('GITHUB_REPOSITORY','GITHUB_WORKFLOW_REF','GITHUB_WORKFLOW_SHA',
            'GITHUB_RUN_ID','GITHUB_RUN_ATTEMPT','PND_UI_CANDIDATE_SHA','PND_EVIDENCE_KIND')}


def paths(env):
    identity(env)
    workspace = policy.physical(env['GITHUB_WORKSPACE'])
    cache = policy.physical(env['RUNNER_TOOL_CACHE'])
    policy.require(cache == Path('/opt/hostedtoolcache') and cache.is_dir() and os.access(cache,os.W_OK),
                   'Existing writable hosted tool cache required; no privilege or private-/tmp workaround')
    tools = cache/('pnd-material-tools-'+env['GITHUB_RUN_ID']+'-'+env['GITHUB_RUN_ATTEMPT'])
    return workspace, tools, workspace/'outputs/material-lifecycle'


def initialize(env):
    workspace, tools, evidence = paths(env)
    policy.require(not os.path.lexists(tools) and not os.path.lexists(evidence), 'Fresh job paths required')
    tools.mkdir(mode=0o700)
    evidence.mkdir(parents=True, mode=0o700)
    save(evidence/'workflow-identity.json', identity(env))
    infrastructure = workspace/'evidence-infrastructure'
    shutil.copytree(infrastructure/'scripts/material-lifecycle-evidence', tools/'material')
    (tools/'orchestration').mkdir(mode=0o700)
    helper_source=workspace/'material-helper-source'
    policy.require(trusted_output(['/usr/bin/git','-C',str(helper_source),'rev-parse','HEAD']).strip()==HELPER_COMMIT,
                   'Exact reviewed helper checkout required')
    for name in HELPERS:
        shutil.copy2(helper_source/'scripts/orchestration'/name, tools/'orchestration'/name)
        policy.require(policy.sha256_file(tools/'orchestration'/name) == HELPER_SHA256[name], 'Reviewed helper differs: '+name)
    policy.require(policy.sha256_file(tools/'orchestration/shared_execution.py') == ADAPTER_SHA, 'Reviewed adapter differs')
    policy.verify_frozen_files(tools/'material', policy.FROZEN_PINS)
    save(evidence/'infrastructure-copy.json', {str(path.relative_to(tools)):policy.sha256_file(path)
         for path in sorted(tools.rglob('*')) if path.is_file()})
    with Path(env['GITHUB_ENV']).open('a') as stream:
        stream.write('PND_MATERIAL_TOOLS='+str(tools)+'\nPND_MATERIAL_EVIDENCE='+str(evidence)+'\n')


def capture(path):
    """Bound one standard-workflow producer's raw output; pipefail rejects overflow."""
    total=0
    with policy.physical(path).open('xb') as stream:
        while data := sys.stdin.buffer.read(65536):
            keep=data[:max(0,RAW_BYTES-total)];stream.write(keep);total+=len(keep)
            policy.require(len(keep)==len(data), 'Setup raw output exceeded16MiB')
    return total


def extract(archive, destination):
    archive, destination = map(policy.physical,(archive,destination))
    policy.require(archive.stat().st_size == ARCHIVE_BYTES and policy.sha256_file(archive) == policy.ARCHIVE_SHA256,
                   'CfT archive identity differs')
    policy.require(not os.path.lexists(destination), 'Browser destination already exists')
    with zipfile.ZipFile(archive) as bundle:
        rows=bundle.infolist()
        policy.require(len(rows)==ARCHIVE_MEMBERS and sum(row.file_size for row in rows)==EXPANDED_BYTES,
                       'CfT archive shape differs')
        seen=set()
        for row in rows:
            path=PurePosixPath(row.filename);mode=row.external_attr>>16
            policy.require(not path.is_absolute() and '..' not in path.parts and '\\' not in row.filename and
                           path.parts[0]=='chrome-headless-shell-linux64' and row.filename not in seen and
                           not stat.S_ISLNK(mode) and (not stat.S_IFMT(mode) or stat.S_ISDIR(mode) or stat.S_ISREG(mode)),
                           'Unsafe or duplicate CfT member')
            seen.add(row.filename)
        destination.mkdir(mode=0o700)
        for row in rows:
            path=destination/row.filename
            if row.is_dir():path.mkdir(parents=True,exist_ok=True);continue
            path.parent.mkdir(parents=True,exist_ok=True)
            with bundle.open(row) as source, path.open('xb') as output:
                shutil.copyfileobj(source,output,65536)
            os.chmod(path,0o755 if (row.external_attr>>16)&0o111 else 0o644)
    browser=destination/'chrome-headless-shell-linux64/chrome-headless-shell'
    policy.require(policy.sha256_file(browser)==policy.BROWSER_SHA256, 'Extracted browser differs')
    return browser


def trusted_output(command):
    # Only host-owned version/ldd commands, never a candidate script or ELF.
    result=subprocess.run(command,stdin=subprocess.DEVNULL,stdout=subprocess.PIPE,stderr=subprocess.PIPE,
                          timeout=5,check=True,env={'PATH':'/usr/bin:/bin','LANG':'C','LC_ALL':'C'})
    policy.require(len(result.stdout)+len(result.stderr)<=1024**2, 'Trusted tool output unexpectedly large')
    return result.stdout.decode()


def library_paths(output):
    policy.require('not found' not in output, 'Missing hosted dynamic library')
    result=set()
    for line in output.splitlines():
        line=line.strip()
        if not line or line.startswith(('linux-vdso.','statically linked')):continue
        match=re.fullmatch(r'(?:\S+ => )?(/\S+) \(0x[0-9a-f]+\)',line)
        policy.require(match is not None, 'Unknown dynamic library resolution: '+line)
        path=Path(match[1])
        # Backend creates /lib and /lib64 as standard usr aliases.
        if path.parts[1] in ('lib','lib64'):path=Path('/usr')/str(path).lstrip('/')
        policy.physical(path.parent)
        result.add(path);result.add(path.resolve(strict=True))
    return result


def tool_manifest(shared, tools_root, browser):
    python=Path(sys.executable).resolve(strict=True)
    node=Path(shutil.which('node')).resolve(strict=True)
    pnpm=Path(shutil.which('pnpm')).resolve(strict=True)
    policy.require(trusted_output([str(node),'--version']).strip()=='v24.19.0', 'Pinned Node differs')
    policy.require(trusted_output([str(node),str(pnpm),'--version']).strip()=='11.25.0', 'Pinned pnpm differs')
    package=pnpm.parent.parent
    policy.require(json.loads((package/'package.json').read_bytes())['name']=='pnpm' and
                   json.loads((package/'package.json').read_bytes())['version']=='11.25.0','Wrong actual pnpm package')
    binaries=[python,node,*map(Path,('/usr/bin/bwrap','/usr/bin/git','/usr/bin/dash','/usr/bin/env',
        '/usr/bin/dirname','/usr/bin/sed','/usr/bin/readlink','/usr/bin/uname'))]
    stdlib=Path(sysconfig.get_path('stdlib')).resolve(strict=True)
    roots={*binaries,stdlib,package,tools_root/'orchestration',tools_root/'material',browser.parent,
           Path('/usr/share/fonts/truetype/dejavu')}
    # ldd is used only on trusted host binaries / exact verified CfT / Python
    # extensions, never downloaded application native addons or candidate ELFs.
    scanned=[*binaries,browser,*sorted(browser.parent.glob('*.so*')),*sorted(stdlib.glob('lib-dynload/*.so'))]
    for binary in scanned:
        roots.update(library_paths(trusted_output(['/usr/bin/ldd',str(binary)])))
    roots={path for path in roots if not any(path!=other and path.is_relative_to(other) for other in roots)}
    names=sorted(map(str,roots))
    for path in names:hosted_entry.tool_root(shared,path,names)
    return {'python':str(python),'node':str(node),'pnpm':str(pnpm),'bwrap':'/usr/bin/bwrap',
            'readonly':names,'pnpmVersion':'11.25.0'}


def checked_setup(env):
    workspace, tools_root, evidence = paths(env)
    policy.require(HERE==tools_root/'material', 'Execute reviewed copied infrastructure, not checkout code')
    copied=json.loads((evidence/'infrastructure-copy.json').read_bytes())
    actual={str(path.relative_to(tools_root)):policy.sha256_file(path)
            for directory in ('material','orchestration') for path in sorted((tools_root/directory).rglob('*')) if path.is_file()}
    policy.require(actual==copied, 'Reviewed copied infrastructure changed during setup')
    adapter=tools_root/'orchestration/shared_execution.py'
    shared=execution.load_shared({'path':str(adapter),'sha256':ADAPTER_SHA})
    return workspace,tools_root,evidence,shared


def install(env):
    workspace,tools_root,evidence,shared=checked_setup(env)
    for name in ('setup-home','setup-tmp','npm-cache','pnpm-prefix'):(tools_root/name).mkdir(mode=0o700)
    environment={'PATH':str(tools_root/'pnpm-prefix/bin')+':'+env['PATH'],'HOME':str(tools_root/'setup-home'),
        'TMPDIR':str(tools_root/'setup-tmp'),'CI':'1','LANG':'C.UTF-8','LC_ALL':'C.UTF-8',
        'NODE_OPTIONS':'--max-old-space-size=768','NPM_CONFIG_USERCONFIG':'/dev/null','NPM_CONFIG_GLOBALCONFIG':'/dev/null',
        'npm_config_cache':str(tools_root/'npm-cache'),'npm_config_prefix':str(tools_root/'pnpm-prefix'),
        'PND_MATERIAL_TOOLS':str(tools_root),'PND_MATERIAL_EVIDENCE':str(evidence)}
    with hosted_resources.guard(shared,[workspace/'candidate',tools_root,evidence],evidence/'setup-install') as (watch,details):
        details['producer']=hosted_resources.install(shared,watch,evidence/'setup-install',
            ['/usr/bin/bash',str(HERE/'hosted-install.sh')],workspace/'candidate',environment)
    with Path(env['GITHUB_PATH']).open('a') as stream:stream.write(str(tools_root/'pnpm-prefix/bin')+'\n')
    return 0


def finalize(env):
    workspace,tools_root,evidence,shared=checked_setup(env)
    installation=shared.verify_sealed_receipt({name:qualification_review.reference(shared,evidence/'setup-install'/file)
        for name,file in [('terminal','terminal.json'),('finalBudget','final-budget.json')]})
    policy.require(installation['kind']=='material-hosted-setup' and installation['details']['producer']['exitCode']==0,
                   'Actual successful bounded installation receipt required')
    candidate=workspace/'candidate'
    policy.require((evidence/'install.exit').read_text()=='0\n' and
                   (evidence/'pnpm-version.txt').read_text().strip()=='11.25.0', 'Observed pinned install did not succeed')
    policy.require(json.loads((candidate/'package.json').read_bytes())['packageManager']=='pnpm@11.25.0', 'Candidate manager differs')
    for name in shared.CACHES:
        (candidate/'node_modules'/name).mkdir(exist_ok=True)
    receipt={'kind':'material-hosted-installation','exitCode':0,'sourceCommit':policy.REVISION,'sourceTree':policy.TREE,
             'checkout':str(candidate),'pnpmVersion':'11.25.0','frozenLockfile':True,'ignoreScripts':True,
             'lockSha256':policy.sha256_file(candidate/'pnpm-lock.yaml'),
             'command':['pnpm','install','--frozen-lockfile','--ignore-scripts','--store-dir',str(tools_root/'pnpm-store')],
             'setupTerminalSha256':policy.sha256_file(evidence/'setup-install/terminal.json'),
             'workflowIdentity':json.loads((evidence/'workflow-identity.json').read_bytes()),
             'raw':{name:policy.sha256_file(evidence/name) for name in ('manager-install.log','install.log','pnpm-version.txt','install.exit')}}
    save(evidence/'installation.json',receipt)
    browser=tools_root/'browser/chrome-headless-shell-linux64/chrome-headless-shell'
    with hosted_resources.guard(shared,[candidate,tools_root,evidence],evidence/'setup-prepare',prepare=True) as (_,details):
        tools=tool_manifest(shared,tools_root,browser)
        save(evidence/'tools.json',tools)
        reference=prepare_inputs.prepare(shared,str(candidate),qualification_review.reference(shared,evidence/'installation.json'),
                                         tools,str(browser),str(evidence/'prepared-inputs.json'))
        details['preparedInputs']=reference
    # Same process/job, no human pause, no second browser or retry.
    value=shared.pinned_json(reference)
    result=hosted_entry.run(value,evidence/'material-run-01')
    print(json.dumps(result))
    return 0 if result['status']=='passed-pending-rendered-review' else 2


def acquire(env):
    workspace,root,evidence,shared=checked_setup(env)
    policy.require(not os.path.lexists(root/'browser.zip'),'Fresh browser archive required')
    url='https://storage.googleapis.com/chrome-for-testing-public/154.0.8037.92/linux64/chrome-headless-shell-linux64.zip'
    command=['/usr/bin/curl','--fail','--silent','--show-error','--proto','=https','--tlsv1.2',
             '--max-time','120','--max-filesize',str(ARCHIVE_BYTES),url,'--output',str(root/'browser.zip')]
    with hosted_resources.guard(shared,[workspace/'candidate',root,evidence],evidence/'setup-browser',acquire=True) as (watch,details):
        details['producer']=hosted_resources.install(shared,watch,evidence/'setup-browser',command,workspace,
            {'PATH':'/usr/bin:/bin','HOME':str(root/'setup-home'),'LANG':'C.UTF-8','LC_ALL':'C.UTF-8'})
        browser=extract(root/'browser.zip',root/'browser')
        details['browser']={'version':policy.BROWSER_VERSION,'url':url,
             'archiveBytes':(root/'browser.zip').stat().st_size,'archiveSha256':policy.sha256_file(root/'browser.zip'),
             'executableBytes':browser.stat().st_size,'executableSha256':policy.sha256_file(browser),
             'archiveMembers':ARCHIVE_MEMBERS,'expandedBytes':EXPANDED_BYTES,'browserExecuted':False}
        save(evidence/'browser-acquisition.json',details['browser'])
    return 0


def main():
    command=sys.argv[1]
    if command=='capture':capture(sys.argv[2]);return 0
    if command=='initialize':initialize(os.environ);return 0
    if command=='install':return install(os.environ)
    if command=='acquire':return acquire(os.environ)
    policy.require(command=='finalize','Unknown hosted setup command')
    return finalize(os.environ)


if __name__=='__main__':raise SystemExit(main())
