#!/usr/bin/env python3
"""Fixed prerequisite-only build and generated qualifier; never application/browser.

No package installation, policy modification, capabilities or setuid restoration.
The producer is only called under the existing owned setup gate.
"""
import hashlib
import io
import json
import os
from pathlib import Path, PurePosixPath
import re
import resource
import shutil
import stat
import subprocess
import sys
import sysconfig
import tarfile
import time
import urllib.parse
import urllib.request
import zipfile
sys.dont_write_bytecode = True
HERE = Path(__file__).resolve().parent
sys.path.insert(0, str(HERE))
import controller as policy
import execution
import host_metadata
import hosted_entry
import hosted_resources
import hosted_setup as setup
import qualification_review

WORKFLOW = '.github/workflows/bwrap-prerequisites.yml'
MAX_EXPANDED = 64 * 1024**2
MAX_ARCHIVE_BYTES = 64 * 1024**2
MAX_ENTRIES = 8192
BUILD_SECONDS = 180
HOSTS = {'github.com', 'release-assets.githubusercontent.com', 'objects.githubusercontent.com',
         'files.pythonhosted.org', 'launchpad.net', 'launchpadlibrarian.net'}
REQUIRED = ['/usr/bin/cc', '/usr/bin/gcc', '/usr/bin/pkg-config', '/usr/local/bin/ninja',
            '/usr/bin/dpkg-deb', '/usr/bin/timeout', '/usr/bin/env', '/usr/bin/as', '/usr/bin/ld', '/usr/bin/readelf']


def require(value, message):
    policy.require(value, message)


def identity(env):
    require(env['GITHUB_REPOSITORY'] == setup.REPOSITORY and env['GITHUB_EVENT_NAME'] == 'workflow_dispatch'
            and env['GITHUB_REF'] == 'refs/heads/main', 'Trusted main-only dispatch required')
    require(env['GITHUB_WORKFLOW_REF'] == setup.REPOSITORY+'/'+WORKFLOW+'@refs/heads/main'
            and re.fullmatch('[a-f0-9]{40}', env['GITHUB_WORKFLOW_SHA'])
            and env['GITHUB_SHA'] == env['GITHUB_WORKFLOW_SHA'], 'Exact workflow source required')
    require(re.fullmatch('[0-9]+', env['GITHUB_RUN_ID']) and env['GITHUB_RUN_ATTEMPT'] == '1',
            'Fresh first attempt only; never rerun')
    require(sys.platform == 'linux' and os.geteuid() != 0, 'Unprivileged Linux required')
    return {key: env[key] for key in ('GITHUB_REPOSITORY','GITHUB_WORKFLOW_SHA','GITHUB_RUN_ID','GITHUB_RUN_ATTEMPT')}


def clean_env(root):
    return {'PATH':'/usr/bin:/bin:/usr/local/bin', 'LANG':'C', 'LC_ALL':'C',
            'HOME':str(root/'home'), 'TMPDIR':str(root/'tmp'), 'PYTHONDONTWRITEBYTECODE':'1'}


def safe_url(url):
    parsed = urllib.parse.urlsplit(url)
    require(parsed.scheme == 'https' and parsed.hostname in HOSTS and parsed.port in (None,443)
            and parsed.username is None and parsed.password is None and not parsed.fragment,
            'Unapproved artifact URL')
    return url


class Redirects(urllib.request.HTTPRedirectHandler):
    max_redirections = 5
    def redirect_request(self, request, fp, code, msg, headers, newurl):
        return super().redirect_request(request, fp, code, msg, headers, safe_url(newurl))


def acquire(asset, destination):
    started = time.monotonic(); total = 0; digest = hashlib.sha256()
    opener = urllib.request.build_opener(urllib.request.ProxyHandler({}), Redirects())
    with opener.open(safe_url(asset['url']), timeout=30) as response, destination.open('xb') as output:
        final_url = safe_url(response.url)
        while True:
            require(time.monotonic()-started <= 30, 'Artifact acquisition deadline')
            data = response.read(65536)
            if not data: break
            total += len(data)
            require(total <= asset['bytes'], 'Artifact compressed size exceeded')
            digest.update(data); output.write(data)
    require(time.monotonic()-started <= 30, 'Artifact acquisition deadline')
    require(total == asset['bytes'] and digest.hexdigest() == asset['sha256'], 'Artifact identity mismatch')
    return {'url':asset['url'],'finalUrl':final_url,'bytes':total,'sha256':digest.hexdigest()}


SOURCE_ARCHIVE_BYTES = 129472
SOURCE_ARCHIVE_SHA = '0e85c8702248b8dd64144f594147553650cdd0e4c951690345faace79c217c4d'
LICENSE_SHA = 'dc626520dcd53a22f727af3ee42c770e56c97a64fe3adb063799d8ab032fe551'
LICENSE_BYTES = 26530
LICENSE_ALIASES = {'bubblewrap-0.13.1/COPYING.LIB', 'bubblewrap-0.13.1/LICENSE'}


def diagnostic_text(value, limit=4096):
    data=str(value).encode('utf-8',errors='replace')
    return {'text':data[:limit].decode('utf-8',errors='replace'), 'bytes':len(data),
            'truncated':len(data)>limit, 'sha256':hashlib.sha256(data).hexdigest()}



class Extractor:
    def __init__(self):
        self.bytes = 0; self.entries = 0; self.links = []; self.license_copies = []; self.current_member = None

    def target(self, root, name):
        path = PurePosixPath(name)
        require(name and not path.is_absolute() and '..' not in path.parts and '\\' not in name
                and '\0' not in name, 'Unsafe archive path')
        target = root.joinpath(*path.parts)
        require(target == root or root in target.parents, 'Archive escapes root')
        for parent in (target, *target.parents):
            if parent == root.parent: break
            require(not parent.is_symlink(), 'Archive traverses symlink')
        return target

    def member(self, root, name, size, mode, kind, source=None, link=None):
        self.entries += 1
        require(self.entries <= MAX_ENTRIES and size >= 0, 'Archive entry cap')
        require(not mode & (stat.S_ISUID | stat.S_ISGID), 'Privileged archive mode')
        target = self.target(root, name)
        if kind == 'directory':
            require(not target.exists() or target.is_dir(), 'Archive directory collision')
            target.mkdir(parents=True, exist_ok=True, mode=0o700); return
        require(not os.path.lexists(target), 'Duplicate archive destination')
        target.parent.mkdir(parents=True, exist_ok=True, mode=0o700)
        require(kind == 'file', 'Archive link/special file not admitted')
        self.bytes += size
        require(self.bytes <= MAX_EXPANDED, 'Archive expanded-size cap')
        remaining = size
        with target.open('xb') as output:
            while remaining:
                data = source.read(min(65536, remaining))
                require(data, 'Truncated archive member')
                output.write(data); remaining -= len(data)
        os.chmod(target, 0o755 if mode & 0o111 else 0o644)
        # Never chown, restore xattrs/ACLs or execute archive metadata.

    def tar(self, archive, root, *, libcap=False, source_licenses=False):
        self.current_member = None
        identity = None; archive_bytes = None
        try:
            require(not (libcap and source_licenses), 'Ambiguous archive policy')
            archive_bytes=archive.stat().st_size
            require(archive_bytes <= MAX_ARCHIVE_BYTES, 'Archive input cap')
            identity = policy.sha256_file(archive)
            if source_licenses:
                require(archive.stat().st_size == SOURCE_ARCHIVE_BYTES and identity == SOURCE_ARCHIVE_SHA,
                        'Source license-copy archive identity differs')
            self._tar(archive,root,libcap=libcap,source_licenses=source_licenses)
        except Exception as error:
            # JSON escaping prevents archive-controlled terminal control sequences.
            # Never mask the original policy error if diagnostics fail.
            try:
                record={'kind':'archive-member-rejection','archiveSha256':identity,
                    'archiveName':diagnostic_text(archive.name,128),'archiveBytes':archive_bytes,
                    'expectedSourceSha256':SOURCE_ARCHIVE_SHA if source_licenses else None,
                    'reason':diagnostic_text(str(error),256),'member':self.current_member}
                encoded=json.dumps(record,ensure_ascii=True,separators=(',',':'))
                require(len(encoded.encode()) <= 16384,'Rejection diagnostic cap')
                print(encoded,file=sys.stderr,flush=True)
            except Exception:
                try: print('archive rejection diagnostic unavailable',file=sys.stderr,flush=True)
                except Exception: pass
            raise

    def _tar(self, archive, root, *, libcap=False, source_licenses=False):
        links=[]; names=set()
        with tarfile.open(archive, mode='r|*') as bundle:
            for index,member in enumerate(bundle):
                self.current_member={'index':index,'name':diagnostic_text(member.name,512),
                    'linkTarget':diagnostic_text(member.linkname,512),'typeHex':member.type.hex(),
                    'size':member.size,'mode':oct(member.mode),'uid':member.uid,'gid':member.gid,
                    'paxKeys':[diagnostic_text(key,32) for key in sorted(member.pax_headers)[:16]],
                    'paxKeyCount':len(member.pax_headers)}
                require(member.name not in names, 'Duplicate archive member'); names.add(member.name)
                require(not any('xattr' in key.lower() or 'acl' in key.lower() for key in member.pax_headers),
                        'Archive privilege metadata')
                if libcap:
                    self.target(root,member.name)
                    require(not member.mode & 0o6000 and (member.isfile() or member.isdir() or member.issym()),
                            'Unsafe package entry')
                    name=PurePosixPath(member.name).as_posix()
                    selected=(name in ('usr/include/sys/capability.h','usr/lib/x86_64-linux-gnu/pkgconfig/libcap.pc')
                              or re.fullmatch(r'(?:usr/)?lib/x86_64-linux-gnu/libcap\.so(?:\.2(?:\.66)?)?',name))
                    if not selected:
                        # Documentation and unrelated package payload is never
                        # materialized; in particular no package man-page links.
                        self.entries+=1;self.bytes+=member.size
                        require(self.entries<=MAX_ENTRIES and self.bytes<=MAX_EXPANDED,'Skipped package payload cap')
                        continue
                if member.issym() and source_licenses:
                    require(member.name in LICENSE_ALIASES and member.linkname == 'COPYING'
                            and member.size == 0 and member.mode == 0o777,
                            'Unexpected source license alias')
                    original=root/'bubblewrap-0.13.1/COPYING'
                    require('bubblewrap-0.13.1/COPYING' in names and not original.is_symlink()
                            and original.is_file() and original.stat().st_size == LICENSE_BYTES,
                            'Source license canonical member missing or changed')
                    before=policy.sha256_file(original)
                    require(before == LICENSE_SHA,'Source license canonical identity differs')
                    data=original.read_bytes()
                    require(len(data)==LICENSE_BYTES and hashlib.sha256(data).hexdigest()==before
                            and policy.sha256_file(original)==before,'Source license changed during copy')
                    self.member(root,member.name,len(data),0o644,'file',io.BytesIO(data))
                    self.license_copies.append({'archiveMember':self.current_member,
                        'materializedKind':'regular-file','canonicalMember':'bubblewrap-0.13.1/COPYING',
                        'bytes':len(data),'sha256':before})
                    continue
                if member.issym() and libcap:
                    self.entries += 1
                    require(self.entries <= MAX_ENTRIES and not member.mode & 0o6000, 'Archive link cap/mode')
                    target=self.target(root,member.name)
                    require(re.fullmatch(r'libcap\.so(?:\.2)?',target.name) and
                            target.parent.relative_to(root).as_posix() in
                            ('lib/x86_64-linux-gnu','usr/lib/x86_64-linux-gnu'), 'Unexpected package link')
                    require('/' not in member.linkname and re.fullmatch(r'libcap\.so\.2(?:\.66)?',member.linkname),
                            'Escaping/unexpected libcap target')
                    links.append((target,member.linkname)); continue
                self.member(root,member.name,member.size,member.mode,
                            'directory' if member.isdir() else 'file' if member.isfile() else 'special',
                            bundle.extractfile(member) if member.isfile() else None)
        for target, link in links:
            require(not os.path.lexists(target), 'Package link collision')
            target.parent.mkdir(parents=True,exist_ok=True,mode=0o700)
            target.symlink_to(link)
        self.links.extend((root,target) for target,_ in links)

    def finish(self):
        for root,target in self.links:
            resolved=target.resolve(strict=True)
            require(resolved.is_file() and root in resolved.parents, 'Unresolved/private link target')

    def wheel(self, archive, root):
        names=set()
        with zipfile.ZipFile(archive) as bundle:
            for member in bundle.infolist():
                require(member.filename not in names, 'Duplicate wheel member'); names.add(member.filename)
                mode=member.external_attr >> 16
                require(not stat.S_IFMT(mode) or stat.S_ISREG(mode) or stat.S_ISDIR(mode), 'Wheel special member')
                with bundle.open(member) as source:
                    self.member(root,member.filename,member.file_size,mode,
                                'directory' if member.is_dir() else 'file',source)


PINNED_PC_SHA = 'eedaf8a34d3b43cfae95bbbda77b455b784e95bb282c33f0676e41af1e074ebf'
PINNED_LIBCAP_FILES = {
    'usr/include/sys/capability.h': (8681,'2b9e8c8a6b50c2cf1458afa5f302d8236122016dfbf4940d7e55406aa5a29307'),
    'usr/lib/x86_64-linux-gnu/libcap.so.2.66': (51536,'6ac6abc86ac891c6e13486470e26f1d939f47fda9e6b5d5508a7f5ec881adc84'),
}


def pinned_pc_libdir(original, private_root):
    raw=original.encode()
    require(len(raw)==211 and hashlib.sha256(raw).hexdigest()==PINNED_PC_SHA,
            'Unknown /usr/lib64 pkg-config metadata')
    for name,(size,digest) in PINNED_LIBCAP_FILES.items():
        path=policy.physical(private_root/name)
        require(path.is_file() and path.stat().st_size==size and policy.sha256_file(path)==digest,
                'Pinned private libcap header/runtime differs')
    directory=policy.physical(private_root/'usr/lib/x86_64-linux-gnu')
    for name,target in [('libcap.so','libcap.so.2'),('libcap.so.2','libcap.so.2.66')]:
        link=directory/name
        require(link.is_symlink() and os.readlink(link)==target
                and link.resolve(strict=True)==directory/'libcap.so.2.66','Pinned private libcap alias differs')
    return str(directory)


def rebase_pc(original, private_root):
    lines=original.splitlines(); output=[]; changed=set()
    for line in lines:
        if re.match(r'^(prefix|exec_prefix|libdir|includedir)=',line):
            key,value=line.split('=',1)
            require(key not in changed, 'Duplicate pkg-config path key'); changed.add(key)
            if key=='libdir' and value=='/usr/lib64':
                value=pinned_pc_libdir(original,private_root)
            elif value.startswith('/'):
                require(value == '/usr' or value in ('/usr/include','/usr/lib/x86_64-linux-gnu',
                        '/lib/x86_64-linux-gnu'), 'Unknown libcap pkg-config absolute path')
                value=str(private_root/value.lstrip('/'))
            else:
                require(re.fullmatch(r'\$\{(?:prefix|exec_prefix)\}(?:/include|/lib/x86_64-linux-gnu)?',value),
                        'Unknown libcap pkg-config substitution')
            output.append(key+'='+value)
        else:
            require(not line.startswith(('Requires:', 'Requires.private:')) or not line.split(':',1)[1].strip(),
                    'Unexpected libcap package dependency')
            output.append(line)
    require({'prefix','libdir','includedir'} <= changed, 'Incomplete libcap pkg-config paths')
    return '\n'.join(output)+'\n'


def command_record(path, value):
    data=json.dumps(value,sort_keys=True,ensure_ascii=True).encode()+b'\n'
    require(len(data)<=16384,'Trusted command record cap')
    with path.open('xb') as stream:stream.write(data)


def command_start(argv, directory, phase):
    # Fixed reviewed callers only. No environment, output or arbitrary exception text.
    require(re.fullmatch(r'[a-z][a-z0-9-]{0,63}',phase) is not None,'Invalid command phase')
    require(isinstance(argv,list) and 0<len(argv)<=64 and
            all(isinstance(arg,str) and len(arg.encode())<=2048 for arg in argv),
            'Trusted command argv cap')
    require(Path(argv[0]).is_absolute(),'Trusted command requires absolute executable')
    tool=Path(argv[0]).resolve(strict=True)
    record={'phase':phase,'argv':argv,'startedMonotonic':time.monotonic(),
            'executable':{'requestedPath':argv[0],'resolvedPath':str(tool),
                          'sha256':policy.sha256_file(tool)},
            'scope':'command provenance only; not dependency or execution acceptance'}
    command_record(directory/(phase+'-start.json'),record)


def command(argv, cwd, env, *, phase):
    directory=cwd/'records'
    command_start(argv,directory,phase)
    result=None;error=None;primary=None
    try:
        result=subprocess.run(argv,cwd=cwd,env=env,stdin=subprocess.DEVNULL,check=True,timeout=BUILD_SECONDS)
    except BaseException as failure:
        primary=failure
        error={'type':type(failure).__name__,'errno':getattr(failure,'errno',None),
               'returncode':getattr(failure,'returncode',None)}
        raise
    finally:
        try:
            command_record(directory/(phase+'-finish.json'),
                {'phase':phase,'finishedMonotonic':time.monotonic(),
                 'returncode':None if result is None else result.returncode,'error':error,
                 'scope':'subprocess.run outcome; owned cleanup remains separate'})
        except BaseException as record_failure:
            if primary is None:raise  # A missing completion receipt never passes.
            primary.add_note('Command finish record failed: '+type(record_failure).__name__[:128]+
                             '; errno='+str(getattr(record_failure,'errno',None))[:32])
            # Preserve the original producer failure; bounded secondary detail is
            # emitted by Python's exception traceback, never converted to success.


def configure(root, env, libdir, launcher):
    env=dict(env,CC='/usr/bin/gcc',PKG_CONFIG='/usr/bin/pkg-config',NINJA='/usr/local/bin/ninja')
    command([str(Path(sys.executable).resolve()),'-I','-B',str(launcher),'setup',str(root/'build'),
             str(root/'source/bubblewrap-0.13.1'),'--wrap-mode=nodownload','--buildtype=release',
             '-Dman=disabled','-Dbash_completion=disabled','-Dzsh_completion=disabled',
             '-Dpython='+str(Path(sys.executable).resolve()),'-Dtests=false','-Dselinux=auto','-Dc_args=-MD -v','-Dc_link_args=-v','-Dbuild_rpath='+str(libdir)],root,env,phase='meson-configure')
    metadata=json.loads((root/'build/meson-info/intro-compilers.json').read_bytes())
    for machine in ('host','build'):
        compiler=metadata[machine]['c']
        require(compiler['id']=='gcc' and compiler['exelist']==['/usr/bin/gcc']
                and compiler['linker_exelist']==['/usr/bin/gcc'],'Meson selected unpinned compiler/linker')
    setup.save(root/'records/meson-compilers.json',metadata)
    return env


def producer(root):
    # This child and all subprocesses are owned by the maintained outer gate.
    resource.setrlimit(resource.RLIMIT_CORE,(0,0))
    resource.setrlimit(resource.RLIMIT_FSIZE,(MAX_EXPANDED,MAX_EXPANDED))
    env=clean_env(root)
    for name in ('home','tmp','downloads','source','meson','sysroot','pc','bin','records'):
        (root/name).mkdir(mode=0o700)
    assets=json.loads((HERE/'bwrap-assets.json').read_bytes())['assets']
    extraction=Extractor(); receipts={}
    for index,asset in enumerate(assets):
        archive=root/'downloads'/asset['name']
        record=root/'records'/('acquired-'+asset['name']+'.json')
        subprocess.run(['/usr/bin/timeout','--signal=TERM','--kill-after=2s','30s',sys.executable,'-I','-B',
                        str(Path(__file__).resolve()),'_acquire',str(index),str(archive),str(record)],
                       stdin=subprocess.DEVNULL,env=env,timeout=33,check=True)
        receipts[asset['name']]=json.loads(record.read_bytes())
        if asset['name']=='bubblewrap':
            extraction.tar(archive,root/'source',source_licenses=True)
            setup.save(root/'records/source-license-copies.json',extraction.license_copies)
        elif asset['name']=='meson': extraction.wheel(archive,root/'meson')
        else:
            unpacked=root/'downloads'/(asset['name']+'.tar')
            with unpacked.open('xb') as output:
                subprocess.run(['/usr/bin/dpkg-deb','--fsys-tarfile',str(archive)],stdout=output,
                               stdin=subprocess.DEVNULL,env=env,timeout=30,check=True)
            require(unpacked.stat().st_size<=MAX_EXPANDED, 'Package tar cap')
            extraction.tar(unpacked,root/'sysroot',libcap=True)
    extraction.finish()
    setup.save(root/'records/acquisition.json',receipts)
    pc=root/'sysroot/usr/lib/x86_64-linux-gnu/pkgconfig/libcap.pc'
    original=pc.read_text(); derived=rebase_pc(original,root/'sysroot')
    (root/'pc/libcap.pc').write_text(derived)
    setup.save(root/'records/pkg-config.json',{'original':original,'derived':derived,
               'originalSha256':hashlib.sha256(original.encode()).hexdigest(),
               'derivedSha256':hashlib.sha256(derived.encode()).hexdigest()})
    env['PKG_CONFIG_PATH']=str(root/'pc')
    flags=inspected(['/usr/bin/env','PKG_CONFIG_PATH='+str(root/'pc'),'/usr/bin/pkg-config',
                     '--cflags','--libs','libcap'],root/'records','pkg-config-flags').split()
    require(flags and '-lcap' in flags and all(arg=='-lcap' or
            arg.startswith(('-I'+str(root/'sysroot')+'/', '-L'+str(root/'sysroot')+'/')) for arg in flags),
            'pkg-config selected host/unexpected libcap')
    libdirs=[path for path in (root/'sysroot/lib/x86_64-linux-gnu',root/'sysroot/usr/lib/x86_64-linux-gnu')
             if (path/'libcap.so.2').exists()]
    require(len(libdirs)==1,'Exact private libcap runtime required'); libdir=libdirs[0]
    entry=root/'meson/meson-1.12.1.dist-info/entry_points.txt'
    require('meson = mesonbuild.mesonmain:main' in entry.read_text(), 'Meson wheel entry differs')
    launcher=root/'meson-entry.py'
    launcher.write_text('import sys\nsys.dont_write_bytecode=True\nsys.path.insert(0,'+repr(str(root/'meson'))+
                        ')\nfrom mesonbuild.mesonmain import main\nraise SystemExit(main())\n')
    libcap_pin=policy.sha256_file((libdir/'libcap.so.2').resolve())
    env=configure(root,env,libdir,launcher)
    inspected(['/usr/local/bin/ninja','-C',str(root/'build'),'-t','commands','bwrap'],
              root/'records','compiler-link-commands')
    command(['/usr/local/bin/ninja','-C',str(root/'build'),'-j1','-v','bwrap'],root,env,phase='ninja-build')
    dependency_text=inspected(['/usr/local/bin/ninja','-C',str(root/'build'),'-t','deps'],
                              root/'records','build-header-dependencies')
    headers={}
    for line in dependency_text.splitlines():
        if not line.startswith('    '):continue
        path=Path(line.strip())
        if not path.is_absolute():path=root/'build'/path
        path=path.resolve(strict=True)
        require(path.is_file(),'Build dependency not a file')
        headers[str(path)]=policy.sha256_file(path)
    require(str((root/'sysroot/usr/include/sys/capability.h').resolve()) in headers,
            'Compiler private libcap header not recorded')
    setup.save(root/'records/build-inputs.json',headers)
    shutil.copyfile(root/'build/bwrap',root/'bin/bwrap'); os.chmod(root/'bin/bwrap',0o755)
    setup.save(root/'records/build.json',{'libcap':str((libdir/'libcap.so.2').resolve()),'libdir':str(libdir),
               'pkgConfigFlags':flags,'expandedBytes':extraction.bytes,'entries':extraction.entries,
               'libcapSha256BeforeBuild':libcap_pin,'bwrapSha256':policy.sha256_file(root/'bin/bwrap')})


def inspected(command, evidence, name):
    directory=evidence/name; directory.mkdir(mode=0o700)
    command_start(command,directory,'inspection')
    return setup.bounded_inspection(command,directory)


def ordinary_binary(path):
    path=Path(path); info=path.stat()
    require(stat.S_ISREG(info.st_mode) and not info.st_mode & 0o6000 and os.access(path,os.X_OK),
            'Missing or privileged executable: '+str(path))
    require('security.capability' not in os.listxattr(path), 'File capabilities not permitted')
    return path.resolve(strict=True)


def private_runtime_check(binary, libcap, libdir, dependencies, dynamic):
    actual={Path(path).resolve(strict=True) for path in dependencies}
    require(libcap.resolve(strict=True) in actual, 'Private pinned libcap absent from closure')
    require(all(path==libcap.resolve(strict=True) for path in actual if path.name.startswith('libcap.so')),
            'Host/extra libcap selected')
    paths=re.findall(r'\((?:RUNPATH|RPATH)\).*?\[(.*?)\]',dynamic)
    require(paths==[str(libdir)], 'Unexpected dynamic library search path')
    require(re.search(r'\(NEEDED\).*?\[libcap\.so\.2\]',dynamic), 'Expected libcap dependency missing')


def dependency_identity(shared, path, declared):
    """Read-only alias chain plus canonical bytes; never relax physical writes."""
    path=Path(path); declared=set(map(str,declared))
    hosted_entry.tool_root(shared,str(path),declared)

    def trace():
        pending=list(path.parts[1:]);current=Path('/');chain=[];links=0;steps=0
        chain.append({'path':'/','kind':'directory','key':shared.inode_key(current.lstat())})
        while pending:
            steps+=1;require(steps<=128,'Dependency alias path complexity exceeded')
            part=pending.pop(0)
            if part in ('','.'):continue
            if part=='..':current=current.parent;continue
            current=current/part
            require(not any(current==base or current.is_relative_to(base) for base in
                    map(Path,('/proc','/sys','/dev','/run','/home','/root','/etc'))),
                    'Dependency alias traverses unsafe root')
            info=current.lstat();row={'path':str(current),'key':shared.inode_key(info)}
            if stat.S_ISLNK(info.st_mode):
                links+=1;require(links<=32,'Dependency alias cycle/depth exceeded')
                target=os.readlink(current)
                require(target and len(target)<=4096 and '\0' not in target,'Invalid dependency link target')
                row.update(kind='link',target=target);chain.append(row)
                require(shared.inode_key(current.lstat())==row['key'],'Dependency alias changed during read')
                link=Path(target);pending=list(link.parts[1:] if link.is_absolute() else link.parts)+pending
                current=Path('/') if link.is_absolute() else current.parent
            else:
                require(stat.S_ISDIR(info.st_mode) if pending else stat.S_ISREG(info.st_mode),
                        'Dependency chain is not directories then a regular file')
                row['kind']='directory' if pending else 'file';chain.append(row)
        require(str(current) in declared and shared.safe_tool_root(current),
                'Canonical dependency target not declared and safe')
        policy.physical(current)
        return current,chain

    before,chain=trace()
    target=shared.file_identity(before)
    after,after_chain=trace()
    require(before==after and chain==after_chain and chain[-1]['key']==target['key'],
            'Dependency alias or canonical target changed during hashing')
    return {'requestedPath':str(path),'canonicalPath':str(before),'chain':chain,'targetIdentity':target}


def dependency_identities(shared, paths):
    paths=sorted(map(Path,paths)); names=list(map(str,paths))
    return {str(path):dependency_identity(shared,path,names) for path in paths}


def readonly_host_smoke(shared, evidence):
    """One trusted local ldd/read-only regression; no build or namespace route."""
    require(sys.platform=='linux','UNSUPPORTED: actual loader regression requires Linux')
    evidence=policy.physical(evidence)
    require(evidence.is_dir() and evidence.stat().st_uid==os.getuid() and not any(evidence.iterdir()),
            'Fresh owned smoke evidence required')
    gcc=Path('/usr/bin/gcc').resolve(strict=True)
    loader=Path('/usr/lib64/ld-linux-x86-64.so.2')
    require(loader.is_symlink() and gcc.is_file(),'Required trusted Linux GCC/loader paths unavailable')
    paths=setup.dependency_paths(gcc,evidence)
    paths.update((gcc,Path('/usr/bin/gcc'),loader,loader.resolve(strict=True)))
    before=dependency_identities(shared,paths)
    require(before==dependency_identities(shared,paths),'Actual host alias identity changed')
    require(any(row['kind']=='link' for row in before[str(loader)]['chain']),'Actual loader alias not exercised')
    return {'kind':'readonly-local-host-dependency-alias-smoke','status':'passed','gcc':str(gcc),
            'loader':str(loader),'identities':before,'applicationExecuted':False,'compilerExecuted':False,
            'acquisitionExecuted':False,'namespaceExecuted':False,'browserExecuted':False,
            'scope':'Local trusted ldd/read-only actual alias behavior only; not hosted build or containment'}


def qualify_inputs(shared, root, evidence):
    binary=ordinary_binary(root/'bin/bwrap')
    build=json.loads((root/'records/build.json').read_bytes())
    require(policy.sha256_file(binary)==build['bwrapSha256'], 'Built binary changed')
    libcap=Path(build['libcap']);libdir=Path(build['libdir'])
    require(policy.sha256_file(libcap)==build['libcapSha256BeforeBuild'],'Private libcap changed during build')
    require(root/'sysroot' in libcap.parents and libcap.parent==libdir, 'Private libcap identity path differs')
    dynamic=inspected(['/usr/bin/readelf','-dW',str(binary)],evidence,'bwrap-dynamic')
    dependencies=setup.dependency_paths(binary,evidence)
    private_runtime_check(binary,libcap,libdir,dependencies,dynamic)
    # Independently inspect the private runtime's transitive closure. RUNPATH of
    # bwrap is not assumed to apply to its libraries' own DT_NEEDED edges.
    dependencies.update(setup.dependency_paths(libcap,evidence))
    private_runtime_check(binary,libcap,libdir,dependencies,dynamic)
    python=Path(sys.executable).resolve(strict=True)
    stdlib=Path(sysconfig.get_path('stdlib')).resolve(strict=True)
    roots={binary,python,root/'orchestration',libcap,libdir/'libcap.so.2',stdlib,*dependencies}
    for executable in [python,*sorted(stdlib.glob('lib-dynload/*.so'))]:
        roots.update(setup.dependency_paths(executable,evidence))
    roots={path for path in roots if not any(path!=other and path.is_relative_to(other) for other in roots)}
    names=sorted(map(str,roots))
    for name in names: hosted_entry.tool_root(shared,name,names)
    tools={'python':str(python),'bwrap':str(binary),'node':str(python),'pnpm':str(python),
           'pnpmVersion':'not-executed-sentinel-only','readonly':names}
    inventories={name:shared.inventory_hash(Path(name)) for name in names}
    setup.save(evidence/'private-runtime.json',{'binary':str(binary),'sha256':policy.sha256_file(binary),
               'libcap':str(libcap),'libcapSha256':policy.sha256_file(libcap),
               'dependencies':dependency_identities(shared,dependencies)})
    return tools,inventories


def qualify(shared,evidence,tools,outcome):
    outcome['namespaceAttempted']=True
    reference=qualification_review.reference(shared,evidence/'qualification-spec.json')
    result=shared.qualify_backend(reference,evidence/'qualification',setup.ADAPTER_SHA)
    outcome['qualification']=result
    require(result['status']=='passed' and result['error'] is None,'Namespace qualification failed; stop')
    records=evidence/'qualification/evidence'
    qualification_review.review(shared,{name:qualification_review.reference(shared,records/file)
         for name,file in (('terminal','terminal.json'),('finalBudget','final-budget.json'))},
         tools,evidence/'backend.json')
    outcome['status']='passed-prerequisites-only'


def run(env):
    who=identity(env)
    workspace=policy.physical(env['GITHUB_WORKSPACE'])
    cache=policy.physical(env['RUNNER_TOOL_CACHE'])
    require(cache==Path('/opt/hostedtoolcache') and os.access(cache,os.W_OK),'Existing writable tool cache required')
    root=cache/('pnd-bwrap-prerequisites-'+env['GITHUB_RUN_ID']+'-1')
    evidence=workspace/'outputs/bwrap-prerequisites'
    require(not os.path.lexists(root) and not os.path.lexists(evidence),'Fresh paths required')
    root.mkdir(mode=0o700); evidence.mkdir(parents=True,mode=0o700)
    setup.save(evidence/'workflow-identity.json',who)
    setup.save(evidence/'host-metadata.json',host_metadata.collect(env))
    source=workspace/'material-helper-source'
    require(setup.trusted_output(['/usr/bin/git','-C',str(source),'rev-parse','HEAD']).strip()==setup.HELPER_COMMIT,
            'Immutable helper source mismatch')
    (root/'orchestration').mkdir(mode=0o700)
    for name,pin in setup.HELPER_SHA256.items():
        original=source/'scripts/orchestration'/name
        require(policy.sha256_file(original)==pin,'Helper bytes differ')
        shutil.copy2(original,root/'orchestration'/name)
    shared=execution.load_shared({'path':str(root/'orchestration/shared_execution.py'),'sha256':setup.ADAPTER_SHA})
    outcome={'status':'failed-or-unknown','namespaceAttempted':False,'applicationExecuted':False,
             'browserExecuted':False,'error':None}
    try:
        with hosted_resources.guard(shared,[root,evidence],evidence/'build',prerequisite=True) as (watch,details):
            details['producer']={}; details['hostTools']={}
            for item in [*REQUIRED,str(Path(sys.executable).resolve())]:
                path=ordinary_binary(item)
                details['hostTools'][item]={'path':str(path),'sha256':policy.sha256_file(path),
                    'dependencies':dependency_identities(shared,setup.dependency_paths(path,evidence/'build')),
                    'version':inspected([str(path),'--version'],evidence/'build','version-'+str(len(details['hostTools'])))}
            # Hash compiler-selected program paths before any compiler feature test.
            for name in ('cc1','as','ld','collect2'):
                selected=inspected(['/usr/bin/gcc','-print-prog-name='+name],evidence/'build','compiler-'+name).strip()
                if not selected.startswith('/'):
                    selected=shutil.which(selected,path=clean_env(root)['PATH'])
                require(selected is not None,'Missing selected compiler program')
                selected=ordinary_binary(selected)
                details['hostTools'][name]={'path':str(selected),'sha256':policy.sha256_file(selected),
                    'dependencies':dependency_identities(shared,setup.dependency_paths(selected,evidence/'build'))}
            try:
                hosted_resources.install(shared,watch,evidence/'build',
                    [sys.executable,'-I','-B',str(Path(__file__).resolve()),'_producer',str(root)],
                    root,clean_env(root),receipt=details['producer'],seconds=BUILD_SECONDS)
            finally:
                if (root/'records').exists(): shutil.copytree(root/'records',evidence/'build/producer-records')
            for value in details['hostTools'].values():
                require(policy.sha256_file(value['path'])==value['sha256'],'Build tool changed')
                require(dependency_identities(shared,value['dependencies'])==value['dependencies'],
                        'Build tool dependency alias/target changed')
            details['sourceInventory']=shared.tree_inventory(root/'source')
            details['privateDependencyInventory']=shared.tree_inventory(root/'sysroot')
            tools,inventories=qualify_inputs(shared,root,evidence/'build')
            setup.save(evidence/'qualification-spec.json',{'version':1,'kind':'shared-execution-qualification-spec',
                        'tools':tools,'toolRoots':inventories,'limits':qualification_review.LIMITS})
        qualify(shared,evidence,tools,outcome)
    except BaseException as failure:
        outcome['error']=type(failure).__name__+': '+str(failure)
        raise
    finally:
        setup.save(evidence/'outcome.json',outcome)


if __name__=='__main__':
    if len(sys.argv)==5 and sys.argv[1]=='_acquire':
        assets=json.loads((HERE/'bwrap-assets.json').read_bytes())['assets']
        index=int(sys.argv[2]);require(0<=index<len(assets),'Unknown asset')
        setup.save(Path(sys.argv[4]),acquire(assets[index],Path(sys.argv[3])))
    elif len(sys.argv)==3 and sys.argv[1]=='_producer': producer(policy.physical(sys.argv[2]))
    else:
        require(len(sys.argv)==1,'Unexpected prerequisite arguments')
        run(os.environ)
