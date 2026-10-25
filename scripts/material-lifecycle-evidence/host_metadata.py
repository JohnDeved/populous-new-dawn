#!/usr/bin/env python3
"""Read-only bounded host diagnostics. Does not establish sandbox admission."""
import hashlib
import json
import os
import re
import stat

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
                field_truncated |= any(len(fields[i])>512 for i in (0,1,4,5,split+1,split+3))
                rows.append({key:value[:512] for key,value in
                    (('mountId',fields[0]),('parentId',fields[1]),('mountPoint',fields[4]),
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
             'limitations':'Access bits and mount options do not prove usable delegation; no subtree derived, PID list read, write or creation.'}
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
