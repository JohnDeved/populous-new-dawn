import hashlib
import io
import json
import os
from pathlib import Path
import re
import stat
import subprocess
import sys
import tempfile
import types
import unittest
from unittest.mock import patch
import zipfile
sys.dont_write_bytecode=True
ROOT=Path(__file__).resolve().parents[1]
HERE=ROOT/'scripts/material-lifecycle-evidence'
sys.path.insert(0,str(HERE))
import hosted_setup as setup
import hosted_entry as entry
import projection
import host_metadata

class HostMetadataTests(unittest.TestCase):
    def collect(self, payload=b'enforce\n', denied=False, release='fixture'):
        import errno
        import stat
        opened=[]
        def opening(path,flags):
            opened.append((path,flags))
            if denied:raise PermissionError(errno.EACCES,'denied')
            return 123
        info=types.SimpleNamespace(st_mode=stat.S_IFREG|0o644,st_uid=0,st_gid=0,
                                   st_size=7,st_dev=1,st_ino=2)
        with patch.object(host_metadata.os,'uname',return_value=types.SimpleNamespace(sysname='Linux',release=release,version='fixture',machine='x86_64')),\
             patch.object(host_metadata.os,'stat',return_value=info),\
             patch.object(host_metadata.os,'access',return_value=False),\
             patch.object(host_metadata.os,'open',side_effect=opening),\
             patch.object(host_metadata.os,'fstat',return_value=info),\
             patch.object(host_metadata.os,'read',return_value=payload) as read,\
             patch.object(host_metadata.os,'close') as close:
            result=host_metadata.collect({'GITHUB_RUN_ID':'123','GITHUB_RUN_ATTEMPT':'1'})
        self.assertEqual(result['admission'],'not-established')
        for path,flags in opened:
            self.assertFalse(flags & (os.O_WRONLY|os.O_RDWR|os.O_CREAT))
            self.assertTrue(flags & os.O_NOFOLLOW);self.assertTrue(flags & os.O_NONBLOCK)
        return result,read,close
    def test_quality_hook_is_once_and_before_install_and_setup_persists_first(self):
        workflow=(ROOT/'.github/workflows/ready-pr-check.yml').read_text()
        command='timeout --signal=TERM --kill-after=2s 5s python -I -B scripts/material-lifecycle-evidence/host_metadata.py'
        self.assertEqual(workflow.count(command),1)
        self.assertLess(workflow.index(command),workflow.index('      - name: Install locked dependencies'))
        source=(HERE/'hosted_setup.py').read_text()
        self.assertLess(source.index("save(evidence/'setup-install/host-metadata.json'"),
                        source.index('        for binary in host_binaries():'))

    def test_bounded_success_is_not_namespace_admission(self):
        result,read,close=self.collect()
        self.assertEqual(read.call_count,12);self.assertEqual(close.call_count,12)
        self.assertEqual(result['kernel']['release'],{'value':'fixture','truncated':False})
        self.assertNotIn('nodename',result['kernel'])
        self.assertEqual(read.call_args.args,(123,1025))
        self.assertIn('/opt/hostedtoolcache/pnd-material-tools-123-1/bwrap/bin/bwrap',result['paths'])
        self.assertFalse(result['paths']['/usr/bin/bwrap']['executableAccess']['value'])
        row=result['policyFiles']['/proc/self/attr/current']
        self.assertEqual(row['observedBytesSha256'],hashlib.sha256(b'enforce\n').hexdigest())
    def test_kernel_release_bounded_without_hostname_or_semantics_claim(self):
        result,_,_=self.collect(release='x'*300)
        self.assertEqual(result['kernel']['release'],{'value':'x'*256,'truncated':True})
        self.assertEqual(set(result['kernel']),{'sysname','release','version','machine'})
        self.assertEqual(result['admission'],'not-established')
    def test_cgroup_fixed_scope_filters_mounts_without_delegation_claim(self):
        payload=(b'1 0 0:1 / / rw - ext4 /dev/fixture rw\n'
                 b'2 1 0:2 / /sys/fs/cgroup ro,nosuid - cgroup2 cgroup ro\n')
        result,read,close=self.collect(payload=payload)
        group=result['cgroups'];self.assertEqual(group['delegation'],'not-established')
        self.assertEqual(len(group['mounts']['rows']),1)
        self.assertEqual(group['mounts']['rows'][0]['filesystem'],'cgroup2')
        self.assertEqual(group['mounts']['rows'][0]['mountOptions'],'ro,nosuid')
        self.assertNotIn('/dev/fixture',json.dumps(group['mounts']))
        self.assertEqual(len(group['fixedPaths']),6)
        self.assertFalse(group['fixedPaths']['/sys/fs/cgroup']['writableAccess']['value'])
        self.assertIn(unittest.mock.call(123,16385),read.call_args_list)

    def test_cgroup_malformed_truncated_denied_stay_unknown(self):
        result,_,_=self.collect(payload=b'x'*16385)
        self.assertTrue(result['cgroups']['mounts']['truncated'])
        self.assertGreater(result['cgroups']['mounts']['malformedRows'],0)
        result,_,_=self.collect(denied=True)
        self.assertEqual(result['cgroups']['mounts']['error']['errno'],13)
        self.assertEqual(result['cgroups']['selfMembership']['error']['errno'],13)
        self.assertEqual(result['cgroups']['delegation'],'not-established')

    def test_denied_policy_is_explicit_unknown_and_not_ci_failure(self):
        result,read,close=self.collect(denied=True)
        self.assertEqual(result['policyFiles']['/proc/self/attr/current']['error']['errno'],13)
        read.assert_not_called();close.assert_not_called()
    def test_truncated_invalid_text_remains_bounded_unknown(self):
        result,_,_=self.collect(payload=b'\xff'*1025)
        row=result['policyFiles']['/proc/self/attr/current']
        self.assertTrue(row['truncated'])
        self.assertEqual(row['observedBytesSha256'],hashlib.sha256(b'\xff'*1024).hexdigest())
        self.assertIn('EOF and full-file digest not established',row['readSemantics'])
        self.assertLess(len(json.dumps(result).encode()),131072)
    def test_missing_path_and_invalid_run_id_do_not_expand_read_scope(self):
        with patch.object(host_metadata.os,'uname',side_effect=PermissionError(13,'fixture denied')),\
             patch.object(host_metadata.os,'stat',side_effect=FileNotFoundError(2,'missing')),\
             patch.object(host_metadata.os,'access',return_value=False),\
             patch.object(host_metadata.os,'open',side_effect=FileNotFoundError(2,'missing')):
            result=host_metadata.collect({'GITHUB_RUN_ID':'../../outside','GITHUB_RUN_ATTEMPT':'1'})
        self.assertEqual(result['paths']['/usr/bin/bwrap']['lstat']['error']['errno'],2)
        self.assertEqual(result['paths']['/usr/bin/bwrap']['stat']['error']['errno'],2)
        self.assertEqual(len(result['paths']),11)
        self.assertEqual(result['kernel']['error'],{'type':'PermissionError','errno':13})

class CgroupServiceSelectorTests(unittest.TestCase):
    membership='0::/system.slice/hosted-compute-agent.service\n'
    mount='36 30 0:30 / /sys/fs/cgroup rw - cgroup2 cgroup rw,nsdelegate\n'
    def fixture(self, *, membership=None, mount=None, changed=False, symlink=False, denied=False, replaced=False):
        membership=self.membership if membership is None else membership
        mount=self.mount if mount is None else mount
        paths=[];reads=[];mapping_reads=0
        directory=types.SimpleNamespace(st_mode=stat.S_IFDIR|0o755,st_uid=0,st_gid=0,st_dev=30,st_ino=1)
        regular=types.SimpleNamespace(st_mode=(stat.S_IFLNK if symlink else stat.S_IFREG)|0o644,
                                      st_uid=0,st_gid=0,st_dev=30,st_ino=2)
        def reading(path,cap,*,dir_fd=None):
            nonlocal mapping_reads
            reads.append((path,dir_fd))
            if path=='/proc/self/cgroup':
                mapping_reads+=1
                value=membership if not changed or mapping_reads==1 else '0::/different\n'
            elif path=='/proc/self/mountinfo':value=mount
            else:value='domain\n'
            return {'text':value,'complete':True,'truncated':False,
                    'observedBytesSha256':hashlib.sha256(value.encode()).hexdigest()}
        def opening(path,flags,*,dir_fd=None):
            paths.append((path,flags,dir_fd))
            if denied:raise PermissionError(13,'fixture denied')
            return len(paths)+100
        def stated(name,**kwargs):
            if name in ('/sys/fs/cgroup','system.slice','hosted-compute-agent.service'):
                return types.SimpleNamespace(**{**vars(directory),'st_ino':999}) if replaced else directory
            return regular
        with patch.object(host_metadata,'complete_read',side_effect=reading), \
             patch.object(host_metadata.os,'open',side_effect=opening), \
             patch.object(host_metadata.os,'fstat',return_value=directory), \
             patch.object(host_metadata.os,'stat',side_effect=stated), \
             patch.object(host_metadata.os,'access',return_value=False), \
             patch.object(host_metadata.os,'close') as close:
            result=host_metadata.selected_cgroup_service({'text':self.membership,'truncated':False})
        return result,paths,reads,close

    def test_exact_mapping_fixed_nofollow_walk_never_claims_delegation(self):
        result,paths,reads,close=self.fixture()
        self.assertEqual(result['availability'],'stable-fixed-path-observation')
        self.assertEqual(result['delegation'],'not-established')
        self.assertEqual([x[0] for x in paths],['/sys/fs/cgroup','system.slice','hosted-compute-agent.service'])
        self.assertEqual([x[2] for x in paths],[None,101,102])
        for _,flags,_ in paths:
            self.assertTrue(flags & os.O_DIRECTORY);self.assertTrue(flags & os.O_NOFOLLOW)
            self.assertFalse(flags & (os.O_WRONLY|os.O_RDWR|os.O_CREAT))
        self.assertFalse(any(name in ('cgroup.procs','cgroup.kill','cgroup.threads') for name,_ in reads))
        self.assertEqual(close.call_args_list,[unittest.mock.call(103),unittest.mock.call(102),unittest.mock.call(101)])

    def test_unsupported_and_ambiguous_mapping_never_opens_directory(self):
        for membership,mount in (('0::/../outside\n',self.mount),
                                 (self.membership,self.mount.replace(' / /sys',' /other /sys')),
                                 (self.membership,self.mount*2),
                                 (self.membership,'malformed\n')):
            result,paths,_,_=self.fixture(membership=membership,mount=mount)
            self.assertEqual(result['availability'],'unknown');self.assertEqual(paths,[])

    def test_changed_mapping_denied_components_and_symlink_controls_are_unknown(self):
        result,_,_,_=self.fixture(changed=True)
        self.assertEqual(result['availability'],'unknown')
        result,_,_,_=self.fixture(denied=True)
        self.assertEqual(result['error']['errno'],13)
        result,_,reads,_=self.fixture(symlink=True)
        self.assertTrue(all(row['error']['type']=='SymlinkNotInspected'
                            for controls in result['controls'].values() for row in controls.values()))
        self.assertFalse(any(fd is not None for _,fd in reads))
        self.assertEqual(result['delegation'],'not-established')

    def test_complete_read_requires_positive_eof_and_has_byte_and_call_caps(self):
        regular=types.SimpleNamespace(st_mode=stat.S_IFREG|0o444)
        for chunks,complete,truncated in (([b'x',b''],True,False),([b'x']*8,False,False),([b'x'*1025],False,True)):
            with patch.object(host_metadata.os,'open',return_value=123), \
                 patch.object(host_metadata.os,'fstat',return_value=regular), \
                 patch.object(host_metadata.os,'read',side_effect=chunks) as read, \
                 patch.object(host_metadata.os,'close') as close:
                result=host_metadata.complete_read('/fixed',1024)
            self.assertEqual(result['complete'],complete);self.assertEqual(result['truncated'],truncated)
            self.assertLessEqual(read.call_count,8);self.assertLessEqual(len(result['text']),1024)
            close.assert_called_once_with(123)

    def test_incomplete_mapping_or_changed_directory_fails_closed(self):
        incomplete={'text':self.membership,'complete':False,'truncated':False}
        with patch.object(host_metadata,'complete_read',return_value=incomplete), \
             patch.object(host_metadata.os,'open') as opening:
            result=host_metadata.selected_cgroup_service({'text':self.membership})
        self.assertEqual(result['availability'],'unknown');opening.assert_not_called()
        result,_,_,_=self.fixture(replaced=True)
        self.assertEqual(result['availability'],'unknown')
        self.assertEqual(result['reason'],'Mapped path replaced during read')


class NpmConfigTests(unittest.TestCase):
    def test_distinct_exclusive_private_empty_configs(self):
        with tempfile.TemporaryDirectory() as tmp:
            root=Path(tmp);env=setup.private_npm_configs(root)
            files=list(map(Path,env.values()))
            self.assertNotEqual(files[0].stat().st_ino,files[1].stat().st_ino)
            for file in files:
                self.assertEqual(file.read_bytes(),b'');self.assertEqual(file.stat().st_mode & 0o777,0o600)
            with self.assertRaises(FileExistsError):setup.private_npm_configs(root)
    def test_real_npm_loader_without_network_or_install(self):
        import shutil
        import resource
        npm=shutil.which('npm');self.assertIsNotNone(npm)
        with tempfile.TemporaryDirectory() as tmp:
            root=Path(tmp)
            for name in ('home','cwd','cache','tmp'):(root/name).mkdir()
            env={'PATH':str(Path(shutil.which('node')).parent)+':/usr/bin:/bin',
                 'HOME':str(root/'home'),'TMPDIR':str(root/'tmp'),'CI':'1',
                 'NPM_CONFIG_CACHE':str(root/'cache'),'NPM_CONFIG_OFFLINE':'true',
                 'NPM_CONFIG_UPDATE_NOTIFIER':'false','NODE_OPTIONS':'--max-old-space-size=128',
                 **setup.private_npm_configs(root)}
            def bounds():
                resource.setrlimit(resource.RLIMIT_FSIZE,(65536,65536))
                resource.setrlimit(resource.RLIMIT_CPU,(5,5))
            for name in ('userconfig','globalconfig'):
                with (root/(name+'.raw')).open('wb+') as raw:
                    result=subprocess.run([npm,'config','get',name],cwd=root/'cwd',env=env,
                        stdin=subprocess.DEVNULL,stdout=raw,stderr=raw,timeout=8,check=False,preexec_fn=bounds)
                    raw.seek(0);output=raw.read(65537)
                self.assertLessEqual(len(output),65536)
                self.assertEqual(result.returncode,0,output)
                self.assertEqual(output.decode().strip(),env['NPM_CONFIG_'+name.upper()])

class ProducerCallerTests(unittest.TestCase):
    def test_install_and_acquire_share_terminal_owned_receipt_on_failure(self):
        from contextlib import nullcontext
        class ProducerFailed(Exception):pass
        for caller in (setup.install,setup.acquire):
            with self.subTest(caller=caller.__name__),tempfile.TemporaryDirectory() as tmp:
                root=Path(tmp);details={};shared=object();watch=object()
                def producer(*args,receipt=None):
                    self.assertIs(receipt,details['producer'])
                    self.assertIs(args[0],shared);self.assertIs(args[1],watch)
                    receipt.update(exitCode=7,waitCompleted=True,waitExitCode=7)
                    raise ProducerFailed('actual command failure')
                with patch.object(setup,'checked_setup',return_value=(root,root,root,shared)),\
                     patch.object(setup.hosted_resources,'guard',return_value=nullcontext((watch,details))),\
                     patch.object(setup.hosted_resources,'install',side_effect=producer),\
                     patch.object(setup,'host_binaries',return_value=[root/'fixture-host-tool']),\
                     patch.object(setup.os,'access',side_effect=lambda path,mode: mode==os.X_OK and
                         str(path) in (str(root/'fixture-host-tool'),'/usr/bin/curl')),\
                     patch.object(setup.host_metadata,'collect',return_value={'admission':'not-established'}),\
                     patch.object(setup,'save'),\
                     patch.object(setup,'dependency_paths',return_value=set()),\
                     patch.object(setup,'extract') as extract:
                    with self.assertRaises(ProducerFailed):caller({'PATH':'/usr/bin:/bin'})
                    extract.assert_not_called()
                self.assertEqual(details['producer'],{'exitCode':7,'waitCompleted':True,'waitExitCode':7})

class DependencyTests(unittest.TestCase):
    def setUp(self):
        self.temp=tempfile.TemporaryDirectory();self.addCleanup(self.temp.cleanup);self.root=Path(self.temp.name)
    def elf(self,dynamic=False,interp=False):
        import struct
        count=1+dynamic+interp;offset=64+56*count;size=offset+64
        head=struct.pack('<16sHHIQQQIHHHHHH',b'\x7fELF\x02\x01\x01'+b'\0'*9,2,62,1,0x400000,64,0,0,64,56,count,0,0,0)
        rows=[struct.pack('<IIQQQQQQ',1,5,0,0x400000,0,size,size,4096)]
        if dynamic:rows.append(struct.pack('<IIQQQQQQ',2,4,offset,0,0,16,16,8))
        if interp:rows.append(struct.pack('<IIQQQQQQ',3,4,offset+16,0,0,4,4,1))
        data=bytearray(head+b''.join(rows)+b'\0'*64)
        if interp:data[offset+16:offset+20]=b'/ld\0'
        path=self.root/'binary';path.write_bytes(data);return path
    def test_static_requires_positive_headers_and_never_calls_ldd(self):
        with patch.object(setup,'bounded_inspection') as command:
            self.assertEqual(setup.dependency_paths(self.elf(),self.root),set());command.assert_not_called()
        self.assertEqual(json.loads((self.root/'dependency-0/inspection.json').read_text())['classification'],
                         'static-no-interpreter-no-dynamic-table')
    def test_dynamic_and_interpreter_require_inspection_and_reject_static_shortcut(self):
        for dynamic,interp in ((True,False),(False,True),(True,True)):
            with self.subTest(dynamic=dynamic,interp=interp),patch.object(setup,'bounded_inspection',return_value='statically linked\n') as command:
                with self.assertRaisesRegex(ValueError,'shortcut'):setup.dependency_paths(self.elf(dynamic,interp),self.root)
                command.assert_called_once()
    def test_script_malformed_and_missing_retain_error_identity(self):
        for data in (b'#!/bin/sh\n',b'\x7fELF'+b'\0'*70):
            path=self.root/'binary';path.write_bytes(data)
            with self.assertRaises(ValueError):setup.dependency_paths(path,self.root)
        with self.assertRaises(FileNotFoundError):setup.dependency_paths(self.root/'missing',self.root)
        receipts=[json.loads(p.read_text()) for p in self.root.glob('dependency-*/inspection.json')]
        self.assertTrue(all(x['error'] for x in receipts));self.assertIsNone(next(x for x in receipts if x['requestedPath'].endswith('/missing'))['identity'])
    def test_dynamic_missing_library_remains_fatal(self):
        with patch.object(setup,'bounded_inspection',return_value='libmissing.so => not found\n'):
            with self.assertRaisesRegex(ValueError,'Missing'):setup.dependency_paths(self.elf(True),self.root)
    def test_unterminated_dynamic_table_rejected(self):
        import struct
        path=self.elf(True);data=bytearray(path.read_bytes());struct.pack_into('<qQ',data,64+56*2,1,123);path.write_bytes(data)
        with self.assertRaisesRegex(ValueError,'Unterminated'):setup.dependency_paths(path,self.root)
    def test_preflight_before_install_producer(self):
        import ast
        tree=ast.parse((HERE/'hosted_setup.py').read_text())
        install=next(x for x in tree.body if isinstance(x,ast.FunctionDef) and x.name=='install')
        calls=[x for x in ast.walk(install) if isinstance(x,ast.Call)]
        preflight=next(x.lineno for x in calls if isinstance(x.func,ast.Name) and x.func.id=='dependency_paths')
        producer=next(x.lineno for x in calls if isinstance(x.func,ast.Attribute) and x.func.attr=='install')
        self.assertLess(preflight,producer)
    def test_command_timeout_retains_error_and_direct_wait(self):
        process=types.SimpleNamespace(stdout=io.BytesIO(),stderr=io.BytesIO(),poll=lambda:None,
            kill=lambda:None,wait=lambda **kw:-9)
        class Selector:
            def __enter__(self):return self
            def __exit__(self,*args):pass
            def register(self,*args):pass
            def get_map(self):return {'pending':True}
        with patch.object(setup.subprocess,'Popen',return_value=process),patch.object(setup.selectors,'DefaultSelector',Selector),\
             patch.object(setup.os,'set_blocking'),patch.object(setup.time,'monotonic',side_effect=[0,6,6]):
            # Pipes with synthetic file descriptors avoid any real process.
            process.stdout=types.SimpleNamespace(fileno=lambda:100,close=lambda:None)
            process.stderr=types.SimpleNamespace(fileno=lambda:101,close=lambda:None)
            with self.assertRaisesRegex(ValueError,'inspection failed'):setup.bounded_inspection(['/ldd'],self.root)
        result=json.loads((self.root/'command.json').read_text())
        self.assertIn('timeout',result['error']);self.assertEqual(result['exitCode'],-9);self.assertTrue(result['waitCompleted'])

    def test_dynamic_empty_or_vdso_only_closure_rejected(self):
        for output in ('','linux-vdso.so.1 (0x1234)\n'):
            with self.subTest(output=output),patch.object(setup,'bounded_inspection',return_value=output):
                with self.assertRaisesRegex(ValueError,'closure is empty'):setup.dependency_paths(self.elf(True),self.root)
    def test_static_load_alignment_and_fileless_entry_rejected(self):
        import struct
        for offset,value,message in ((64+16,0x400001,'alignment'),(24,0x400000+256,'file bytes')):
            path=self.elf();data=bytearray(path.read_bytes())
            if message=='file bytes':struct.pack_into('<Q',data,64+40,4096)
            struct.pack_into('<Q',data,offset,value);path.write_bytes(data)
            with self.subTest(message=message),self.assertRaisesRegex(ValueError,message):setup.dependency_paths(path,self.root)
    def test_missing_node_clear_diagnostic(self):
        with patch.object(setup.shutil,'which',return_value=None):
            with self.assertRaisesRegex(ValueError,'hosted node unavailable'):setup.host_binaries()
    def test_known_host_requires_executable_access_before_dependency_scan(self):
        from contextlib import nullcontext
        binary=self.elf();binary.chmod(0o600)
        with patch.object(setup,'checked_setup',return_value=(self.root,self.root,self.root,object())),\
             patch.object(setup.hosted_resources,'guard',return_value=nullcontext((None,{}))),\
             patch.object(setup.host_metadata,'collect',return_value={'admission':'not-established'}),\
             patch.object(setup,'save'),\
             patch.object(setup,'host_binaries',return_value=[binary]),patch.object(setup,'dependency_paths') as scan:
            with self.assertRaisesRegex(ValueError,'executable unavailable'):setup.install({'PATH':'/usr/bin:/bin'})
            scan.assert_not_called()
    def test_command_combined_overflow_retains_exact_cap_and_wait(self):
        process=types.SimpleNamespace(stdout=types.SimpleNamespace(fileno=lambda:100,close=lambda:None),
            stderr=types.SimpleNamespace(fileno=lambda:101,close=lambda:None),poll=lambda:None,kill=lambda:None,wait=lambda **kw:-9)
        class Selector:
            def __enter__(self):return self
            def __exit__(self,*args):pass
            def register(self,*args):pass
            def get_map(self):return {'pending':True}
            def select(self,wait):return [(types.SimpleNamespace(fd=100,data='stdout'),None),(types.SimpleNamespace(fd=101,data='stderr'),None)]
        with patch.object(setup.subprocess,'Popen',return_value=process),patch.object(setup.selectors,'DefaultSelector',Selector),\
             patch.object(setup.os,'set_blocking'),patch.object(setup.os,'read',return_value=b'x'*65536):
            with self.assertRaisesRegex(ValueError,'inspection failed'):setup.bounded_inspection(['/ldd'],self.root)
        self.assertEqual(sum((self.root/(name+'.raw')).stat().st_size for name in ('stdout','stderr')),1024**2)
        receipt=json.loads((self.root/'command.json').read_text());self.assertIn('raw cap',receipt['error'])
        self.assertEqual(receipt['exitCode'],-9);self.assertTrue(receipt['waitCompleted'])
    def test_dynamic_parse_failure_keeps_inspection_error(self):
        with patch.object(setup,'bounded_inspection',return_value='unrecognized-loader-output\n'):
            with self.assertRaisesRegex(ValueError,'Unknown dynamic'):setup.dependency_paths(self.elf(True),self.root)
        self.assertIn('Unknown dynamic',json.loads((self.root/'dependency-0/inspection.json').read_text())['error'])

    def test_command_nonzero_retains_bounded_raw_and_exit(self):
        class Pipe(io.BytesIO):
            def fileno(self):return 100 if self is process.stdout else 101
        process=types.SimpleNamespace(stdout=Pipe(),stderr=Pipe(),poll=lambda:1,wait=lambda **kw:1)
        pending=[100,101]
        class Selector:
            def __enter__(self):return self
            def __exit__(self,*args):pass
            def register(self,*args):pass
            def get_map(self):return pending
            def select(self,wait):
                return [(types.SimpleNamespace(fd=fd,data='stdout' if fd==100 else 'stderr',fileobj=fd),None) for fd in pending[:]]
            def unregister(self,fd):pending.remove(fd)
        chunks={100:[b'not a dynamic executable\n',b''],101:[b'loader error\n',b'']}
        with patch.object(setup.subprocess,'Popen',return_value=process),patch.object(setup.selectors,'DefaultSelector',Selector),\
             patch.object(setup.os,'set_blocking'),patch.object(setup.os,'read',side_effect=lambda fd,n:chunks[fd].pop(0)):
            with self.assertRaisesRegex(ValueError,'inspection failed'):setup.bounded_inspection(['/usr/bin/ldd','/target'],self.root)
        self.assertEqual((self.root/'stderr.raw').read_bytes(),b'loader error\n')
        self.assertEqual((self.root/'stdout.raw').read_bytes(),b'not a dynamic executable\n')
        result=json.loads((self.root/'command.json').read_text());self.assertEqual(result['exitCode'],1);self.assertTrue(result['waitCompleted'])

class IdentityTests(unittest.TestCase):
    def setUp(self):
        self.env={'GITHUB_REPOSITORY':setup.REPOSITORY,'GITHUB_EVENT_NAME':'workflow_dispatch',
            'GITHUB_REF':'refs/heads/main','GITHUB_WORKFLOW_REF':setup.REPOSITORY+'/'+setup.WORKFLOW+'@refs/heads/main',
            'GITHUB_WORKFLOW_SHA':'a'*40,'GITHUB_SHA':'a'*40,'PND_UI_CANDIDATE_SHA':setup.policy.REVISION,
            'PND_EVIDENCE_KIND':'material-lifecycle','GITHUB_RUN_ID':'12345','GITHUB_RUN_ATTEMPT':'1'}
    def test_exact_main_first_attempt(self):
        with patch.object(setup.os,'geteuid',return_value=1001):self.assertEqual(setup.identity(self.env)['GITHUB_RUN_ID'],'12345')
    def test_reject_wrong_identity_fields(self):
        for key in self.env:
            with self.subTest(key=key),patch.object(setup.os,'geteuid',return_value=1001):
                value={**self.env,key:'wrong'}
                with self.assertRaises(ValueError):setup.identity(value)
    def test_rerun_rejected(self):
        self.env['GITHUB_RUN_ATTEMPT']='2'
        with self.assertRaises(ValueError):setup.identity(self.env)
    def test_privileged_execution_rejected(self):
        with patch.object(setup.os,'geteuid',return_value=0):
            with self.assertRaises(ValueError):setup.identity(self.env)

class DataTests(unittest.TestCase):
    def setUp(self):
        self.temp=tempfile.TemporaryDirectory();self.addCleanup(self.temp.cleanup);self.root=Path(self.temp.name)
    def test_log_capture_bounded_and_exclusive(self):
        stream=types.SimpleNamespace(buffer=io.BytesIO(b'abcdef'))
        with patch.object(setup.sys,'stdin',stream),patch.object(setup,'RAW_BYTES',4):
            with self.assertRaises(ValueError):setup.capture(self.root/'raw')
        self.assertEqual((self.root/'raw').read_bytes(),b'abcd')
        with self.assertRaises(FileExistsError):setup.capture(self.root/'raw')
    def test_log_capture_complete(self):
        with patch.object(setup.sys,'stdin',types.SimpleNamespace(buffer=io.BytesIO(b'abc'))):
            self.assertEqual(setup.capture(self.root/'raw'),3)
    def archive(self,names):
        path=self.root/'test.zip'
        with zipfile.ZipFile(path,'w') as bundle:
            for name in names:bundle.writestr(name,b'browser')
        return path
    def extract(self,path):
        with patch.object(setup,'ARCHIVE_BYTES',path.stat().st_size),patch.object(setup,'ARCHIVE_MEMBERS',1),\
             patch.object(setup,'EXPANDED_BYTES',7),patch.object(setup.policy,'ARCHIVE_SHA256',hashlib.sha256(path.read_bytes()).hexdigest()),\
             patch.object(setup.policy,'BROWSER_SHA256',hashlib.sha256(b'browser').hexdigest()):
            return setup.extract(path,self.root/'out')
    def test_verified_data_extract_no_execution(self):
        path=self.archive(['chrome-headless-shell-linux64/chrome-headless-shell'])
        self.assertEqual(self.extract(path).read_bytes(),b'browser')
    def test_traversal_rejected_before_allocation(self):
        path=self.archive(['chrome-headless-shell-linux64/../../escape'])
        with self.assertRaises(ValueError):self.extract(path)
        self.assertFalse((self.root/'out').exists())
    def test_symlink_archive_rejected(self):
        path=self.root/'test.zip'
        with zipfile.ZipFile(path,'w') as bundle:
            row=zipfile.ZipInfo('chrome-headless-shell-linux64/link');row.external_attr=0o120777<<16
            bundle.writestr(row,b'browser')
        with self.assertRaises(ValueError):self.extract(path)
    def test_archive_digest_required(self):
        path=self.archive(['chrome-headless-shell-linux64/chrome-headless-shell'])
        with self.assertRaises(ValueError):setup.extract(path,self.root/'out')
    def test_narrow_leaf_alias_and_actual_target_required(self):
        target=self.root/'lib.so.1.2';target.write_text('data');alias=self.root/'lib.so.1';alias.symlink_to(target.name)
        shared=types.SimpleNamespace(safe_tool_root=lambda p:p.is_relative_to(self.root))
        self.assertEqual(entry.tool_root(shared,str(alias),[str(alias),str(target)]),alias)
        with self.assertRaises(ValueError):entry.tool_root(shared,str(alias),[str(alias)])
        alias.unlink();alias.symlink_to('/etc/passwd')
        with self.assertRaises(ValueError):entry.tool_root(shared,str(alias),[str(alias),'/etc/passwd'])
    def test_directory_alias_rejected(self):
        target=self.root/'directory';target.mkdir();alias=self.root/'alias';alias.symlink_to(target)
        shared=types.SimpleNamespace(safe_tool_root=lambda p:True)
        with self.assertRaises(ValueError):entry.tool_root(shared,str(alias),[str(alias),str(target)])
    def test_ldd_resolves_only_actual_exact_aliases(self):
        target=self.root/'lib.so.1.2';target.write_text('lib');alias=self.root/'lib.so.1';alias.symlink_to(target.name)
        result=setup.library_paths('linux-vdso.so.1 (0xabc)\nlibx => '+str(alias)+' (0x1234)\n')
        self.assertEqual(result,{alias,target})
    def test_missing_or_unknown_libraries_fail(self):
        for value in ['libx => not found','unexpected arbitrary output']:
            with self.assertRaises(ValueError):setup.library_paths(value)
    def test_checker_directory_not_mounted_twice(self):
        rows=[]
        shared=types.SimpleNamespace(PRIVATE_LEAVES=('control','tmp','shm'),CACHES=(),
            validate_mounts=lambda mounts,*a,**k:rows.extend(mounts))
        spec={'tools':{'readonly':[str(HERE)]}}
        projection.mounts(shared,spec,{'namespaceRuntime':'/candidate','applicationMounts':[]},self.root/'evidence')
        self.assertEqual(sum(row[2]==str(HERE) for row in rows),1)
        self.assertEqual(len(rows),len(set(row[2] for row in rows)))

class FinalizeTests(unittest.TestCase):
    def attempt(self,exit_code='0\n'):
        from contextlib import nullcontext
        temp=tempfile.TemporaryDirectory();self.addCleanup(temp.cleanup)
        workspace=Path(temp.name);tools=workspace/'tools';evidence=workspace/'evidence'
        tools.mkdir();evidence.mkdir();(tools/'material').mkdir();(tools/'orchestration').mkdir()
        candidate=workspace/'candidate';candidate.mkdir();(candidate/'node_modules').mkdir()
        (candidate/'package.json').write_text('{"packageManager":"pnpm@11.25.0"}')
        (candidate/'pnpm-lock.yaml').write_text('lock')
        (evidence/'setup-install').mkdir();(evidence/'setup-install/terminal.json').write_text('{}')
        setup.save(evidence/'infrastructure-copy.json',{})
        setup.save(evidence/'workflow-identity.json',{'actual':'workflow'})
        for name,value in {'install.exit':exit_code,'pnpm-version.txt':'11.25.0\n','install.log':'observed install output',
                           'manager-install.log':'observed manager output'}.items():(evidence/name).write_text(value)
        shared=types.SimpleNamespace(CACHES=('.vite','.vite-temp','.cache'),envelope=lambda n:nullcontext(),
            file_identity=lambda p,**k:{'sha256':'actual'},
            verify_sealed_receipt=lambda ref:{'kind':'material-hosted-setup','details':{'producer':{'exitCode':0}}},pinned_json=lambda ref:{'actual':'prepared'})
        with patch.object(setup.hosted_resources,'guard',return_value=nullcontext((None,{}))),\
             patch.object(setup,'paths',return_value=(workspace,tools,evidence)),patch.object(setup,'HERE',tools/'material'),\
             patch.object(setup.execution,'load_shared',return_value=shared),patch.object(setup,'tool_manifest',return_value={'actual':'tools'}),\
             patch.object(setup.prepare_inputs,'prepare',return_value={'path':'prepared','sha256':'actual'}) as prepare,\
             patch.object(setup.hosted_entry,'run',return_value={'status':'passed-pending-rendered-review'}) as run,\
             patch('builtins.print'):
            if exit_code!='0\n':
                with self.assertRaises(ValueError):setup.finalize({})
                self.assertFalse((evidence/'installation.json').exists());prepare.assert_not_called();run.assert_not_called()
                return
            self.assertEqual(setup.finalize({}),0)
            prepare.assert_called_once();run.assert_called_once_with({'actual':'prepared'},evidence/'material-run-01')
            receipt=json.loads((evidence/'installation.json').read_bytes())
            self.assertEqual(receipt['exitCode'],0);self.assertEqual(receipt['raw']['install.log'],setup.policy.sha256_file(evidence/'install.log'))
    def test_actual_success_record_advances_once(self):self.attempt()
    def test_failed_install_never_emits_pass_or_dispatches(self):self.attempt('1\n')

class WorkflowTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.text=(ROOT/'.github/workflows/native-ui-evidence.yml').read_text()
        parsed=subprocess.run(['node','--input-type=module','-e',
            "import fs from 'node:fs'; import yaml from 'js-yaml'; process.stdout.write(JSON.stringify(yaml.load(fs.readFileSync(0,'utf8'), {schema: yaml.FAILSAFE_SCHEMA})));"],
            input=cls.text,text=True,capture_output=True,cwd=ROOT,timeout=5,check=True)
        cls.workflow=json.loads(parsed.stdout)
        cls.steps=cls.workflow['jobs']['evidence']['steps']
    def test_existing_workflow_manual_readonly_default_unchanged(self):
        self.assertEqual(set(self.workflow['on']),{'workflow_dispatch'})
        mode=self.workflow['on']['workflow_dispatch']['inputs']['evidence_kind']
        self.assertEqual(mode['default'],'native-ui');self.assertEqual(mode['options'],['native-ui','material-lifecycle'])
        self.assertEqual(self.workflow['permissions'],{'contents':'read'})
        self.assertEqual(self.workflow['concurrency']['cancel-in-progress'],'false')
    def test_same_exact_action_pins_and_source_checkout(self):
        for row in self.steps:
            if 'uses' in row:self.assertRegex(row['uses'],r'^[\w/-]+@[a-f0-9]{40}$')
        candidate=next(row for row in self.steps if row.get('id')=='candidate')
        self.assertEqual(candidate['with']['ref'],'${{ inputs.candidate_sha }}')
        self.assertEqual(candidate['with']['persist-credentials'],'false')
    def test_helper_checkout_is_exact_reviewed_revision_not_moving_main(self):
        row=next(row for row in self.steps if row['name'].startswith('Check out pinned reviewed'))
        self.assertEqual(row['with']['ref'],setup.HELPER_COMMIT)
        self.assertEqual(row['with']['path'],'material-helper-source')
        self.assertEqual(row['with']['persist-credentials'],'false')
        self.assertEqual(row['if'],"${{ inputs.evidence_kind == 'material-lifecycle' }}")
        self.assertEqual(set(row['with']['sparse-checkout'].splitlines()),{'/scripts/orchestration/'+name for name in setup.HELPERS})
    def test_one_optin_entry_and_no_security_bypass(self):
        row=next(row for row in self.steps if row['name'].startswith('Qualify actual'))
        self.assertEqual(row['if'],"${{ inputs.evidence_kind == 'material-lifecycle' }}")
        self.assertEqual(self.text.count('hosted_setup.py" finalize'),1)
        for denied in ['--no-sandbox','sysctl','apparmor','sudo','apt-get','pull_request_target']:
            self.assertNotIn(denied,self.text)
    def test_install_receipt_after_successful_pipefail_standard_install(self):
        row=next(row for row in self.steps if row['name'].startswith('Install candidate'))
        self.assertIn('hosted_setup.py" install',row['run'])
        code=(HERE/'hosted-install.sh').read_text();self.assertIn('set -euo pipefail',code)
        self.assertLess(code.index('480s pnpm install --frozen-lockfile --ignore-scripts'),code.index('install.exit'))
        self.assertIn('pnpm@11.25.0',code);self.assertIn('npm install --global --ignore-scripts --no-audit --no-fund',code)
    def test_original_ui_episode_command_still_present_and_conditional(self):
        row=next(row for row in self.steps if row['name'].startswith('Build candidate Home'))
        self.assertEqual(row['if'],"${{ inputs.evidence_kind != 'material-lifecycle' }}")
        self.assertIn('scripts/native-ui-evidence/run.mjs',row['run'])
    def test_all_shell_blocks_parse_without_execution(self):
        for row in [*self.steps,{'name':'trusted install','run':(HERE/'hosted-install.sh').read_text()}]:
            if 'run' in row:
                process=subprocess.run(['/bin/bash','-n'],input=row['run'],text=True,capture_output=True,timeout=2)
                self.assertEqual(process.returncode,0,row['name']+process.stderr)
    def test_all_material_evidence_retained_on_failure(self):
        row=self.steps[-1]
        self.assertIn('always()',row['if']);self.assertEqual(row['with']['path'],'outputs/material-lifecycle')
        self.assertEqual(row['with']['include-hidden-files'],'true')

if __name__=='__main__':unittest.main()
