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
import struct
import selectors
import time
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
import host_metadata
import prepare_inputs
import qualification_review

REPOSITORY = 'JohnDeved/populous-new-dawn'
WORKFLOW = '.github/workflows/native-ui-evidence.yml'
ARCHIVE_BYTES = 120477194
EXPANDED_BYTES = 273953147
ARCHIVE_MEMBERS = 287
RAW_BYTES = 16*1024**2
ADAPTER_SHA = 'cebd47955968d9fb0ff907e6073c001f46434ccb6c7fc3acebcf0b2bb3716334'
HELPER_COMMIT = 'a2e1cd1b2dbda79a75a79573ff6ff504ce46845d'
HELPERS = ('shared_execution.py','shared_runtime.py','shared_setup.py','shared_workspace.py','state_serialization.py')
HELPER_SHA256 = {'state_serialization.py': 'e363a34595ae6d9e159e2c0d43e10d801c6f97a48d079e66a0daa925e59b97ba', 'shared_workspace.py': '69436e7fa46b0e8307ff01fc52ffe57132eb76b748632c6d9d3444c466c3cf53', 'shared_execution.py': 'cebd47955968d9fb0ff907e6073c001f46434ccb6c7fc3acebcf0b2bb3716334', 'shared_setup.py': 'ac28e0052dd9922a0f393e7ceb1b225025409fa9aa5d1ad24ea388211631fd43', 'shared_runtime.py': 'bfc20d91544167d9491f3246c0b651eba3345468e910bd8ed6eec7a55a421d65'}


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


def elf_dependency_kind(path):
    """Conservative ELF64/x86-64 proof; no ldd-error-based static inference."""
    with Path(path).open('rb') as stream:
        size=os.fstat(stream.fileno()).st_size
        header=stream.read(64)
        policy.require(len(header)==64 and header[:7]==b'\x7fELF\x02\x01\x01','Unsupported or malformed ELF identity')
        fields=struct.unpack('<16sHHIQQQIHHHHHH',header)
        _,kind,machine,version,entry,offset,_,_,ehsize,entsize,count,_,_,_=fields
        policy.require(kind in (2,3) and machine==62 and version==1 and ehsize==64 and
                       entsize==56 and 0<count<65535 and offset>=64 and offset+count*56<=size,
                       'Malformed ELF program-header table')
        stream.seek(offset);headers=stream.read(count*56)
        interpreter=dynamic=False;executable=False;loads=0
        for index in range(count):
            typ,flags,off,address,_,filesz,memsz,align=struct.unpack_from('<IIQQQQQQ',headers,index*56)
            policy.require(off<=size and filesz<=size-off and filesz<=memsz and
                           (align in (0,1) or align & (align-1)==0),'Malformed ELF segment')
            if typ==1:
                loads+=1
                policy.require(align in (0,1) or off%align==address%align,'Malformed ELF load alignment')
                if flags & 1 and address<=entry<address+filesz:executable=True
            if typ==3:
                policy.require(filesz>=2 and filesz<=4096,'Malformed ELF interpreter')
                stream.seek(off);value=stream.read(filesz)
                policy.require(value.startswith(b'/') and value.endswith(b'\0') and b'\0' not in value[:-1],
                               'Malformed ELF interpreter path')
                interpreter=True
            if typ==2:
                policy.require(filesz>=16 and filesz%16==0 and filesz<=1024**2,'Malformed ELF dynamic table')
                stream.seek(off);value=stream.read(filesz)
                policy.require(any(struct.unpack_from('<qQ',value,n)[0]==0 for n in range(0,len(value),16)),
                               'Unterminated ELF dynamic table')
                dynamic=True
        policy.require(loads>0,'ELF has no load segments')
        # Deliberately narrow: dynamic-table-free ET_EXEC only. Static PIE or
        # unusual metadata remains on the strict dynamic inspection path.
        if kind==2 and not interpreter and not dynamic:
            policy.require(executable,'Static ELF entry lacks executable file bytes')
            return 'static-no-interpreter-no-dynamic-table'
        policy.require(interpreter or dynamic,'Unsupported ELF dependency classification')
        return 'dynamic-inspection-required'


def bounded_inspection(command, directory):
    """Five-second inspection, one-MiB combined raw cap, direct wait recorded."""
    receipt={'command':command,'exitCode':None,'waitCompleted':False,'error':None}
    process=None;started=time.monotonic();raw={};observed=0
    try:
        for name in ('stdout','stderr'):raw[name]=(directory/(name+'.raw')).open('xb')
        process=subprocess.Popen(command,stdin=subprocess.DEVNULL,stdout=subprocess.PIPE,stderr=subprocess.PIPE,
            env={'PATH':'/usr/bin:/bin','LANG':'C','LC_ALL':'C'},close_fds=True)
        with selectors.DefaultSelector() as selector:
            for name in raw:
                pipe=getattr(process,name);os.set_blocking(pipe.fileno(),False)
                selector.register(pipe,selectors.EVENT_READ,name)
            while selector.get_map() or process.poll() is None:
                policy.require(time.monotonic()-started<5,'Dependency inspection timeout')
                for key,_ in selector.select(.03):
                    data=os.read(key.fd,65536)
                    if not data:selector.unregister(key.fileobj);continue
                    remaining=max(0,1024**2-observed);raw[key.data].write(data[:remaining]);observed+=len(data)
                    policy.require(observed<=1024**2,'Dependency inspection raw cap exceeded')
    except BaseException as failure:
        receipt['error']=type(failure).__name__+': '+str(failure)
    finally:
        if process is not None:
            try:
                if process.poll() is None:process.kill()
                receipt['exitCode']=process.wait(timeout=5);receipt['waitCompleted']=True
            except BaseException as failure:receipt['waitError']=type(failure).__name__+': '+str(failure)
            for pipe in (process.stdout,process.stderr):pipe.close()
        for stream in raw.values():stream.close()
        receipt.update(wallSeconds=time.monotonic()-started,observedRawBytes=observed)
        save(directory/'command.json',receipt)
    policy.require(receipt['error'] is None and receipt['waitCompleted'] and receipt['exitCode']==0,
                   'Dependency inspection failed; retained '+str(directory/'command.json'))
    return (directory/'stdout.raw').read_text()


def dependency_paths(binary,evidence):
    directory=evidence/('dependency-'+str(len(list(evidence.glob('dependency-*')))))
    directory.mkdir(mode=0o700)
    receipt={'requestedPath':str(binary),'identity':None,'classification':None,'error':None}
    try:
        path=Path(binary).resolve(strict=True)
        before=path.stat()
        policy.require(stat.S_ISREG(before.st_mode),'Dependency target must be regular ELF')
        identity={'path':str(path),'device':before.st_dev,'inode':before.st_ino,'size':before.st_size,
                  'mtimeNs':before.st_mtime_ns,'sha256':policy.sha256_file(path)}
        receipt['identity']=identity
        receipt['classification']=elf_dependency_kind(path)
        if receipt['classification']=='static-no-interpreter-no-dynamic-table':result=set()
        else:
            tool=Path('/usr/bin/ldd').resolve(strict=True)
            receipt['inspectionTool']={'path':str(tool),'sha256':policy.sha256_file(tool)}
            output=bounded_inspection([str(tool),str(path)],directory)
            policy.require('statically linked' not in output and 'not a dynamic executable' not in output,
                           'Dynamic ELF cannot use a static ldd shortcut')
            result=library_paths(output)
            policy.require(bool(result),'Dynamic dependency closure is empty')
        after=path.stat()
        policy.require((before.st_dev,before.st_ino,before.st_size,before.st_mtime_ns)==
                       (after.st_dev,after.st_ino,after.st_size,after.st_mtime_ns) and
                       policy.sha256_file(path)==identity['sha256'],'Dependency target changed')
        receipt['libraries']=sorted(map(str,result));return result
    except BaseException as failure:
        receipt['error']=type(failure).__name__+': '+str(failure);raise
    finally:save(directory/'inspection.json',receipt)


def host_binaries():
    node=shutil.which('node')
    policy.require(node is not None,'Required hosted node unavailable')
    return [Path(sys.executable).resolve(strict=True),Path(node).resolve(strict=True),
        *map(Path,('/usr/bin/bwrap','/usr/bin/git','/usr/bin/dash','/usr/bin/env',
        '/usr/bin/dirname','/usr/bin/sed','/usr/bin/readlink','/usr/bin/uname'))]


def tool_manifest(shared, tools_root, browser, evidence):
    python=Path(sys.executable).resolve(strict=True)
    node=Path(shutil.which('node')).resolve(strict=True)
    pnpm=Path(shutil.which('pnpm')).resolve(strict=True)
    policy.require(trusted_output([str(node),'--version']).strip()=='v24.19.0', 'Pinned Node differs')
    policy.require(trusted_output([str(node),str(pnpm),'--version']).strip()=='11.25.0', 'Pinned pnpm differs')
    package=pnpm.parent.parent
    policy.require(json.loads((package/'package.json').read_bytes())['name']=='pnpm' and
                   json.loads((package/'package.json').read_bytes())['version']=='11.25.0','Wrong actual pnpm package')
    binaries=host_binaries()
    stdlib=Path(sysconfig.get_path('stdlib')).resolve(strict=True)
    roots={*binaries,stdlib,package,tools_root/'orchestration',tools_root/'material',browser.parent,
           Path('/usr/share/fonts/truetype/dejavu')}
    # ldd is used only on trusted host binaries / exact verified CfT / Python
    # extensions, never downloaded application native addons or candidate ELFs.
    scanned=[*binaries,browser,*sorted(browser.parent.glob('*.so*')),*sorted(stdlib.glob('lib-dynload/*.so'))]
    for binary in scanned:
        roots.update(dependency_paths(binary,evidence))
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


def private_npm_configs(root):
    """Distinct exclusive empty files: npm rejects loading one path twice."""
    paths = [root/'npm-user.conf', root/'npm-global.conf']
    for path in paths:
        fd=os.open(path,os.O_WRONLY|os.O_CREAT|os.O_EXCL,0o600)
        os.close(fd)
    return {'NPM_CONFIG_USERCONFIG':str(paths[0]),'NPM_CONFIG_GLOBALCONFIG':str(paths[1])}


def install(env):
    workspace,tools_root,evidence,shared=checked_setup(env)
    for name in ('setup-home','setup-tmp','npm-cache','pnpm-prefix'):(tools_root/name).mkdir(mode=0o700)
    environment={'PATH':str(tools_root/'pnpm-prefix/bin')+':'+env['PATH'],'HOME':str(tools_root/'setup-home'),
        'TMPDIR':str(tools_root/'setup-tmp'),'CI':'1','LANG':'C.UTF-8','LC_ALL':'C.UTF-8',
        'NODE_OPTIONS':'--max-old-space-size=768',**private_npm_configs(tools_root),
        'npm_config_cache':str(tools_root/'npm-cache'),'npm_config_prefix':str(tools_root/'pnpm-prefix'),
        'PND_MATERIAL_TOOLS':str(tools_root),'PND_MATERIAL_EVIDENCE':str(evidence)}
    with hosted_resources.guard(shared,[workspace/'candidate',tools_root,evidence],evidence/'setup-install') as (watch,details):
        details['hostMetadata']=host_metadata.collect(env)
        save(evidence/'setup-install/host-metadata.json',details['hostMetadata'])
        for binary in host_binaries():
            policy.require(os.access(binary,os.X_OK),'Required hosted executable unavailable: '+str(binary))
            dependency_paths(binary,evidence/'setup-install')
        policy.require(os.access('/usr/bin/curl',os.X_OK),'Required hosted curl unavailable')
        details['producer']={}
        hosted_resources.install(shared,watch,evidence/'setup-install',
            ['/usr/bin/bash',str(HERE/'hosted-install.sh')],workspace/'candidate',environment,receipt=details['producer'])
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
        tools=tool_manifest(shared,tools_root,browser,evidence/'setup-prepare')
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
        details['producer']={}
        hosted_resources.install(shared,watch,evidence/'setup-browser',command,workspace,
            {'PATH':'/usr/bin:/bin','HOME':str(root/'setup-home'),'LANG':'C.UTF-8','LC_ALL':'C.UTF-8'},receipt=details['producer'])
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
