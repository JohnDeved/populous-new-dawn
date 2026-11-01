#!/usr/bin/env python3
"""Read-only bounded host diagnostics. Does not establish sandbox admission."""
import hashlib
import json
import os
import re
import stat

def complete_read(path, cap, *, dir_fd=None):
    """Fixed small files only: explicit EOF, finite read count, no writes/following links."""
    fd=None;data=b'';complete=False
    try:
        fd=os.open(path,os.O_RDONLY|os.O_NONBLOCK|os.O_NOFOLLOW|os.O_CLOEXEC,dir_fd=dir_fd)
        if not stat.S_ISREG(os.fstat(fd).st_mode):return {'error':{'type':'NotRegularFile'}}
        for _ in range(8):
            chunk=os.read(fd,min(4096,cap+1-len(data)))
            if not chunk:complete=True;break
            data+=chunk
            if len(data)>cap:break
        return {'text':data[:cap].decode('utf-8',errors='replace'),'complete':complete,
                'truncated':len(data)>cap,'observedBytesSha256':hashlib.sha256(data[:cap]).hexdigest()}
    except OSError as exc:return {'error':{'type':type(exc).__name__,'errno':exc.errno}}
    finally:
        if fd is not None:os.close(fd)


def selected_cgroup_service(observed_membership):
    """Inspect only the already observed exact runner-service path; never establish delegation."""
    expected='0::/system.slice/hosted-compute-agent.service\n'
    result={'availability':'unknown','delegation':'not-established','directories':{},'directoryWriteAccess':{},'controls':{}}
    handles=[]
    def require(value,reason):
        if not value:raise ValueError(reason)
    def identity(value):
        return {key:getattr(value,field) for key,field in
                (('device','st_dev'),('inode','st_ino'),('mode','st_mode'),('uid','st_uid'),('gid','st_gid'))}
    def mapping():
        membership=complete_read('/proc/self/cgroup',1024)
        require(membership.get('complete') and membership.get('text')==expected,'Unsupported membership')
        mount=complete_read('/proc/self/mountinfo',16384)
        require(mount.get('complete') and not mount.get('truncated'),'Incomplete mount inventory')
        matches=[]
        for line in mount['text'].splitlines():
            fields=line.split();require('-' in fields,'Malformed mount inventory')
            split=fields.index('-');require(split>=6 and len(fields)>=split+4,'Malformed mount inventory')
            if fields[split+1]=='cgroup2':
                require(fields[3]=='/' and fields[4]=='/sys/fs/cgroup','Unsupported cgroup mount mapping')
                require(all(len(fields[i])<=512 for i in (0,1,3,4,5,split+3)),'Mount field cap')
                matches.append({'mountId':fields[0],'parentId':fields[1],'mountRoot':fields[3],
                                'mountPoint':fields[4],'mountOptions':fields[5],
                                'superOptions':fields[split+3]})
        require(len(matches)==1,'Ambiguous or missing cgroup2 mount')
        return {'membership':membership,'mount':matches[0],
                'mountInventorySha256':mount['observedBytesSha256']}
    try:
        require(observed_membership.get('text')==expected and not observed_membership.get('truncated'),
                'Observed membership not supported')
        before=mapping();result['mappingBefore']=before
        parent=None
        for name in ('/sys/fs/cgroup','system.slice','hosted-compute-agent.service'):
            fd=os.open(name,os.O_RDONLY|os.O_DIRECTORY|os.O_NOFOLLOW|os.O_CLOEXEC,dir_fd=parent)
            handles.append((name,fd));info=os.fstat(fd)
            require(stat.S_ISDIR(info.st_mode),'Mapped component not directory')
            result['directories'][name]=identity(info)
            result['directoryWriteAccess'][name]={'value':os.access('.',os.W_OK,dir_fd=fd,follow_symlinks=False)}
            parent=fd
        for label,fd in handles[1:]:
            controls={};result['controls'][label]=controls
            for name in ('cgroup.type','cgroup.controllers','cgroup.subtree_control',
                         'cgroup.procs','cgroup.events','cgroup.kill'):
                row={};controls[name]=row
                try:
                    info=os.stat(name,dir_fd=fd,follow_symlinks=False);row['lstat']=identity(info)
                    if stat.S_ISLNK(info.st_mode):
                        row['error']={'type':'SymlinkNotInspected'};continue
                    row['writableAccess']={'value':os.access(name,os.W_OK,dir_fd=fd,follow_symlinks=False)}
                    if name in ('cgroup.type','cgroup.controllers','cgroup.subtree_control','cgroup.events'):
                        row['content']=complete_read(name,1024,dir_fd=fd)
                except OSError as exc:row['error']={'type':type(exc).__name__,'errno':exc.errno}
        after=mapping();result['mappingAfter']=after
        require(after==before,'Cgroup mapping changed during read')
        parent=None
        for name,fd in handles:
            require(identity(os.fstat(fd))==result['directories'][name],'Mapped directory changed during read')
            require(identity(os.stat(name,dir_fd=parent,follow_symlinks=False))==result['directories'][name],
                    'Mapped path replaced during read')
            parent=fd
        result['availability']='stable-fixed-path-observation'
    except (OSError,ValueError) as exc:
        result['error']={'type':type(exc).__name__,'errno':getattr(exc,'errno',None)}
        if isinstance(exc,ValueError):result['reason']=str(exc)[:128]
    finally:
        for _,fd in reversed(handles):os.close(fd)
    return result


def collect(env):
    """Fixed, bounded read-only diagnostics; never a namespace admission result."""
    def error(exc):
        return {'type':type(exc).__name__,'errno':getattr(exc,'errno',None)}
    def metadata(path):
        row={}
        for name,follow in (('lstat',False),('stat',True)):
            try:
                value=os.stat(path,follow_symlinks=follow)
                row[name]={'mode':value.st_mode,'uid':value.st_uid,'gid':value.st_gid,
                           'size':value.st_size,'device':value.st_dev,'inode':value.st_ino}
            except OSError as exc:row[name]={'error':error(exc)}
        try:row['executableAccess']={'value':os.access(path,os.X_OK)}
        except OSError as exc:row['executableAccess']={'error':error(exc)}
        return row
    def bounded_read(path):
        fd=None
        try:
            fd=os.open(path,os.O_RDONLY|os.O_NONBLOCK|os.O_NOFOLLOW|os.O_CLOEXEC)
            if not stat.S_ISREG(os.fstat(fd).st_mode):return {'error':{'type':'NotRegularFile'}}
            data=os.read(fd,1025)
            return {'text':data[:1024].decode('utf-8',errors='replace'),'truncated':len(data)>1024,
                    'observedBytesSha256':hashlib.sha256(data[:1024]).hexdigest(),
                    'readSemantics':'single bounded read; EOF and full-file digest not established'}
        except OSError as exc:return {'error':error(exc)}
        finally:
            if fd is not None:os.close(fd)
    # Kernel identity is diagnostic, not a proof of loaded policy or syscall semantics.
    try:
        value=os.uname()
        kernel={name:{'value':getattr(value,name)[:256],
                      'truncated':len(getattr(value,name))>256}
                for name in ('sysname','release','version','machine')}
    except OSError as exc:kernel={'error':error(exc)}
    def cgroup_mounts():
        fd=None
        try:
            fd=os.open('/proc/self/mountinfo',os.O_RDONLY|os.O_NONBLOCK|os.O_NOFOLLOW|os.O_CLOEXEC)
            if not stat.S_ISREG(os.fstat(fd).st_mode):return {'error':{'type':'NotRegularFile'}}
            data=os.read(fd,16385);rows=[];malformed=0;field_truncated=False
            for line in data[:16384].decode('utf-8',errors='replace').splitlines():
                fields=line.split()
                if '-' not in fields:malformed+=1;continue
                split=fields.index('-')
                if split<6 or len(fields)<split+4:malformed+=1;continue
                if fields[split+1] not in ('cgroup','cgroup2'):continue
                if len(rows)>=16:return {'error':{'type':'MountRowCap'},'truncated':True}
                field_truncated |= any(len(fields[i])>512 for i in (0,1,3,4,5,split+1,split+3))
                rows.append({key:value[:512] for key,value in
                    (('mountId',fields[0]),('parentId',fields[1]),('mountRoot',fields[3]),('mountPoint',fields[4]),
                     ('mountOptions',fields[5]),('filesystem',fields[split+1]),
                     ('superOptions',fields[split+3]))})
            return {'rows':rows,'malformedRows':malformed,'truncated':len(data)>16384 or field_truncated,
                    'readSemantics':'single bounded read; absence and complete mount inventory not established'}
        except OSError as exc:return {'error':error(exc)}
        finally:
            if fd is not None:os.close(fd)
    cgroup_paths={}
    for path in ('/sys/fs/cgroup','/sys/fs/cgroup/cgroup.controllers',
                 '/sys/fs/cgroup/cgroup.subtree_control','/sys/fs/cgroup/cgroup.procs',
                 '/sys/fs/cgroup/cgroup.events','/sys/fs/cgroup/cgroup.kill'):
        row=metadata(path)
        try:row['writableAccess']={'value':os.access(path,os.W_OK)}
        except OSError as exc:row['writableAccess']={'error':error(exc)}
        cgroup_paths[path]=row
    cgroups={'selfMembership':bounded_read('/proc/self/cgroup'),'mounts':cgroup_mounts(),
             'fixedPaths':cgroup_paths,'delegation':'not-established',
             'limitations':'Access bits and mount options do not prove usable delegation; fixed observed service only, no PID list read, write or creation.'}
    cgroups['selectedService']=selected_cgroup_service(cgroups['selfMembership'])
    files=('/proc/sys/kernel/apparmor_restrict_unprivileged_userns',
           '/proc/sys/kernel/apparmor_restrict_unprivileged_unconfined',
           '/proc/sys/kernel/unprivileged_userns_clone','/proc/sys/user/max_user_namespaces',
           '/sys/module/apparmor/parameters/enabled','/proc/self/attr/current',
           '/sys/kernel/security/apparmor/profiles',
           '/etc/apparmor.d/bwrap','/etc/apparmor.d/bwrap-userns-restrict',
           '/usr/share/apparmor/extra-profiles/bwrap-userns-restrict')
    tools=('/usr/bin/bwrap','/usr/bin/cc','/usr/bin/gcc','/usr/bin/pkg-config',
           '/usr/bin/meson','/usr/local/bin/meson','/usr/bin/ninja','/usr/local/bin/ninja',
           '/usr/include/sys/capability.h','/usr/lib/x86_64-linux-gnu/pkgconfig/libcap.pc',
           '/usr/include/selinux/selinux.h')
    run=env.get('GITHUB_RUN_ID','');attempt=env.get('GITHUB_RUN_ATTEMPT','')
    if re.fullmatch('[0-9]{1,20}',run) and re.fullmatch('[0-9]{1,4}',attempt):
        tools+=('/opt/hostedtoolcache/pnd-material-tools-'+run+'-'+attempt+'/bwrap/bin/bwrap',)
    return {'kind':'material-host-readonly-metadata','admission':'not-established',
            'image':{key:env.get(key,'')[:256] for key in ('ImageOS','ImageVersion','RUNNER_OS','RUNNER_ARCH')},
            'uid':os.getuid(),'euid':os.geteuid(),'kernel':kernel,'cgroups':cgroups,
            'paths':{path:metadata(path) for path in tools},
            'policyFiles':{path:bounded_read(path) for path in files},
            'limitations':['Profile files do not prove loaded policy or attachment.',
                            'Missing, denied or truncated observations remain unknown.',
                            'No executable, namespace or privilege operation performed.']}


if __name__ == "__main__":
    output=json.dumps(collect(os.environ),sort_keys=True,ensure_ascii=True)
    if len(output.encode())>131072:raise ValueError("Host metadata output exceeded128KiB")
    print(output)
