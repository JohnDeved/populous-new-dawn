"""Deterministic fixtures only; no acquisition/build/live host policy reads."""
import hashlib
import importlib.util
import io
import json
import os
from pathlib import Path
import stat
import sys
import tarfile
import tempfile
import types
from unittest.mock import Mock
import unittest
from unittest.mock import patch
HERE=Path(__file__).resolve().parents[1]
sys.path.insert(0,str(HERE/'scripts/material-lifecycle-evidence'))
import bwrap_prerequisites as p


class ArchiveTests(unittest.TestCase):
    def archive(self, rows, **kwargs):
        with tempfile.TemporaryDirectory() as temporary:
            root=Path(temporary);target=root/'out';target.mkdir();archive=root/'archive.tar'
            with tarfile.open(archive,'w') as bundle:
                for name,kind,value in rows:
                    member=tarfile.TarInfo(name);member.mode=0o755;member.uid=0;member.gid=0
                    if kind=='file':
                        member.size=len(value);bundle.addfile(member,io.BytesIO(value))
                    else:
                        member.type=tarfile.SYMTYPE if kind=='symlink' else tarfile.CHRTYPE
                        member.linkname=value;bundle.addfile(member)
            extractor=p.Extractor();extractor.tar(archive,target,**kwargs);extractor.finish()
            return {str(x.relative_to(target)):x.read_bytes() for x in target.rglob('*') if x.is_file()}

    def test_root_owned_regular_data_not_chowned(self):
        with patch.object(p.os,'chown',side_effect=AssertionError('must not restore ownership')):
            self.assertEqual(self.archive([('file','file',b'data')]),{'file':b'data'})

    def test_traversal_and_absolute_rejected(self):
        for name in ('../escape','/absolute','a/../../escape','a\\b'):
            with self.subTest(name=name),self.assertRaises(Exception):self.archive([(name,'file',b'x')])

    def test_special_and_unknown_symlink_rejected(self):
        for kind in ('symlink','device'):
            with self.subTest(kind=kind),self.assertRaises(Exception):self.archive([('bad',kind,'target')])

    def test_duplicate_rejected(self):
        with self.assertRaises(Exception):self.archive([('a','file',b'1'),('a','file',b'2')])

    def test_private_runtime_link_admitted(self):
        prefix='usr/lib/x86_64-linux-gnu/'
        result=self.archive([(prefix+'libcap.so.2.66','file',b'ELF'),
                             (prefix+'libcap.so.2','symlink','libcap.so.2.66')],libcap=True)
        self.assertEqual(result[prefix+'libcap.so.2'],b'ELF')

    def test_private_runtime_escape_rejected(self):
        with self.assertRaises(Exception):self.archive([
            ('usr/lib/x86_64-linux-gnu/libcap.so.2','symlink','../../outside')],libcap=True)

    def test_size_and_entry_limits(self):
        with patch.object(p,'MAX_EXPANDED',2),self.assertRaises(Exception):self.archive([('a','file',b'123')])
        with patch.object(p,'MAX_ENTRIES',1),self.assertRaises(Exception):
            self.archive([('a','file',b'1'),('b','file',b'2')])

    def test_privileged_mode_and_capability_metadata_rejected(self):
        with tempfile.TemporaryDirectory() as temp:
            with self.assertRaises(Exception):p.Extractor().member(Path(temp),'bad',1,0o4755,'file',io.BytesIO(b'x'))
            archive=Path(temp)/'bad.tar';out=Path(temp)/'out';out.mkdir()
            with tarfile.open(archive,'w') as bundle:
                member=tarfile.TarInfo('bad');member.pax_headers={'SCHILY.xattr.security.capability':'x'}
                bundle.addfile(member,io.BytesIO())
            with self.assertRaises(Exception):p.Extractor().tar(archive,out)


class PolicyTests(unittest.TestCase):
    def test_official_asset_hashes_and_total(self):
        assets=json.loads((p.HERE/'bwrap-assets.json').read_bytes())
        self.assertEqual(sum(a['bytes'] for a in assets['assets']),1864274)
        self.assertEqual(len(assets['assets']),4)
        for asset in assets['assets']:
            self.assertRegex(asset['sha256'],r'^[a-f0-9]{64}$');p.safe_url(asset['url'])
        self.assertEqual([a['version'] for a in assets['assets'][-2:]],['1:2.66-5ubuntu2.4']*2)

    def test_url_rejects_redirect_to_untrusted_or_plaintext(self):
        for url in ('http://github.com/a','https://evil.example/a','https://user@github.com/a','https://github.com:444/a'):
            with self.subTest(url=url),self.assertRaises(Exception):p.safe_url(url)

    def test_environment_does_not_inherit_loader_or_python_override(self):
        with patch.dict(os.environ,{'LD_PRELOAD':'evil','LD_LIBRARY_PATH':'evil','PYTHONPATH':'evil','CFLAGS':'evil'}):
            env=p.clean_env(Path('/owned'))
        self.assertEqual(set(env),{'PATH','LANG','LC_ALL','HOME','TMPDIR','PYTHONDONTWRITEBYTECODE'})

    def test_pc_rebase_preserves_original_and_private_paths(self):
        original='prefix=/usr\nlibdir=${prefix}/lib/x86_64-linux-gnu\nincludedir=${prefix}/include\nLibs: -L${libdir} -lcap\n'
        derived=p.rebase_pc(original,Path('/private'))
        self.assertIn('prefix=/private/usr',derived);self.assertIn('prefix=/usr\n',original)
        for bad in ('prefix=/tmp/host\n','prefix=/usr\nprefix=/usr\n','Requires: other\n'):
            with self.subTest(bad=bad),self.assertRaises(Exception):p.rebase_pc(bad,Path('/private'))

    def test_runtime_rejects_host_libcap_and_wrong_runpath(self):
        with tempfile.TemporaryDirectory() as temporary:
            root=Path(temporary);private=root/'private';private.mkdir();host=root/'host';host.mkdir()
            lib=private/'libcap.so.2.66';lib.write_bytes(b'private');old=host/'libcap.so.2.66';old.write_bytes(b'old')
            dynamic='(RUNPATH) Library runpath: ['+str(private)+']\n(NEEDED) Shared library: [libcap.so.2]'
            p.private_runtime_check(root/'bwrap',lib,private,{lib},dynamic)
            for deps,text in (({old},dynamic),({lib,old},dynamic),({lib},dynamic.replace(str(private),'/usr/lib'))):
                with self.assertRaises(Exception):p.private_runtime_check(root/'bwrap',lib,private,deps,text)

    def test_privileged_or_nonexecutable_binary_rejected(self):
        with tempfile.TemporaryDirectory() as temporary:
            path=Path(temporary)/'tool';path.write_bytes(b'data');path.chmod(0o644)
            with self.assertRaises(Exception):p.ordinary_binary(path)
            path.chmod(0o4755)
            with self.assertRaises(Exception):p.ordinary_binary(path)
            path.chmod(0o755)
            with patch.object(p.os,'listxattr',return_value=['security.capability']),self.assertRaises(Exception):p.ordinary_binary(path)

    def test_main_only_first_attempt_identity(self):
        env={'GITHUB_REPOSITORY':p.setup.REPOSITORY,'GITHUB_EVENT_NAME':'workflow_dispatch',
             'GITHUB_REF':'refs/heads/main','GITHUB_WORKFLOW_REF':p.setup.REPOSITORY+'/'+p.WORKFLOW+'@refs/heads/main',
             'GITHUB_WORKFLOW_SHA':'a'*40,'GITHUB_SHA':'a'*40,'GITHUB_RUN_ID':'123','GITHUB_RUN_ATTEMPT':'1'}
        with patch.object(p.os,'geteuid',return_value=1001):
            p.identity(env)
            for key,value in [('GITHUB_RUN_ATTEMPT','2'),('GITHUB_REF','refs/heads/other'),('GITHUB_EVENT_NAME','push')]:
                with self.subTest(key=key),self.assertRaises(Exception):p.identity({**env,key:value})

    def test_dedicated_workflow_has_no_application_or_security_changes(self):
        source=(HERE/p.WORKFLOW).read_text()
        self.assertIn("github.event_name == 'workflow_dispatch' && github.ref == 'refs/heads/main' && github.run_attempt == 1",source)
        self.assertIn('contents: read',source);self.assertIn('ref: '+p.setup.HELPER_COMMIT,source)
        self.assertNotIn('candidate_sha',source);self.assertNotIn('setup-node',source)
        self.assertNotIn('pnpm install',source);self.assertNotIn('sudo ',source)
        self.assertIn('350s python -I -B',source);self.assertIn('path: outputs/bwrap-prerequisites',source)


class CallerTests(unittest.TestCase):
    def test_failed_qualification_never_reviewed_or_continued(self):
        shared=types.SimpleNamespace(qualify_backend=Mock(return_value={'status':'failed-or-unknown','error':'denied'}))
        outcome={}
        with patch.object(p.qualification_review,'reference',return_value={'path':'fixture','sha256':'x'}), \
             patch.object(p.qualification_review,'review') as review:
            with self.assertRaisesRegex(ValueError,'Namespace qualification failed'):
                p.qualify(shared,Path('/evidence'),{},outcome)
        self.assertEqual(shared.qualify_backend.call_count,1);review.assert_not_called()
        self.assertTrue(outcome['namespaceAttempted']);self.assertEqual(outcome['qualification']['error'],'denied')

    def test_configure_pins_actual_compiler_python_and_link_commands(self):
        with tempfile.TemporaryDirectory() as temporary:
            root=Path(temporary);(root/'build/meson-info').mkdir(parents=True);(root/'records').mkdir()
            compiler={'id':'gcc','exelist':['/usr/bin/gcc'],'linker_exelist':['/usr/bin/gcc']}
            (root/'build/meson-info/intro-compilers.json').write_text(json.dumps({m:{'c':compiler} for m in ('host','build')}))
            with patch.object(p,'command') as command:
                env=p.configure(root,p.clean_env(root),root/'lib',root/'launcher.py')
            argv,cwd,actual_env=command.call_args.args
            self.assertEqual(actual_env['CC'],'/usr/bin/gcc')
            self.assertEqual(actual_env['PKG_CONFIG'],'/usr/bin/pkg-config')
            self.assertEqual(actual_env['NINJA'],'/usr/local/bin/ninja')
            self.assertIn('-Dpython='+str(Path(sys.executable).resolve()),argv)
            self.assertIn('-Dc_link_args=-v',argv);self.assertIn('-Dc_args=-MD -v',argv)
            self.assertEqual(env,actual_env);self.assertTrue((root/'records/meson-compilers.json').exists())

    def test_configure_rejects_meson_compiler_or_linker_substitution(self):
        for field in ('exelist','linker_exelist'):
            with self.subTest(field=field),tempfile.TemporaryDirectory() as temporary:
                root=Path(temporary);(root/'build/meson-info').mkdir(parents=True);(root/'records').mkdir()
                compiler={'id':'gcc','exelist':['/usr/bin/gcc'],'linker_exelist':['/usr/bin/gcc']}
                compiler[field]=['/usr/local/bin/cc']
                (root/'build/meson-info/intro-compilers.json').write_text(json.dumps({m:{'c':compiler} for m in ('host','build')}))
                with patch.object(p,'command'),self.assertRaisesRegex(ValueError,'unpinned compiler'):
                    p.configure(root,p.clean_env(root),root/'lib',root/'launcher.py')

    def test_acquisition_wrong_size_and_hash_rejected_no_network(self):
        class Response(io.BytesIO):url='https://files.pythonhosted.org/test'
        for body,pin,size in ((b'x','0'*64,1),(b'xx',hashlib.sha256(b'xx').hexdigest(),1)):
            with tempfile.TemporaryDirectory() as temporary:
                opener=types.SimpleNamespace(open=lambda *a,**k:Response(body))
                with patch.object(p.urllib.request,'build_opener',return_value=opener),self.assertRaises(Exception):
                    p.acquire({'url':Response.url,'bytes':size,'sha256':pin},Path(temporary)/'archive')

    def test_acquisition_late_final_read_cannot_succeed(self):
        class Response(io.BytesIO):url='https://files.pythonhosted.org/test'
        with tempfile.TemporaryDirectory() as temporary:
            opener=types.SimpleNamespace(open=lambda *a,**k:Response(b'x'))
            with patch.object(p.urllib.request,'build_opener',return_value=opener), \
                 patch.object(p.time,'monotonic',side_effect=[0,1,2,31]),self.assertRaises(Exception):
                p.acquire({'url':Response.url,'bytes':1,'sha256':hashlib.sha256(b'x').hexdigest()},Path(temporary)/'archive')

    def test_owned_thread_count_and_pid_reuse(self):
        fields=['0']*22;fields[17]='3';fields[19]='99'
        watch=types.SimpleNamespace(pidfds={});rows=[{'pid':7,'startTicks':99}]
        with patch.object(Path,'open',return_value=io.StringIO('7 (fixture) '+' '.join(fields))):
            self.assertEqual(p.hosted_resources.owned_tasks(watch,rows),3)
        fields[19]='100'
        with patch.object(Path,'open',return_value=io.StringIO('7 (fixture) '+' '.join(fields))),self.assertRaises(Exception):
            p.hosted_resources.owned_tasks(watch,rows)

    def test_owned_missing_requires_retained_positive_exit(self):
        rows=[{'pid':7,'startTicks':99}];watch=types.SimpleNamespace(pidfds={(7,99):123})
        with patch.object(Path,'open',side_effect=FileNotFoundError), \
             patch.object(p.hosted_resources.select,'select',return_value=([123],[],[])):
            self.assertEqual(p.hosted_resources.owned_tasks(watch,rows),0)
        with patch.object(Path,'open',side_effect=PermissionError),self.assertRaises(PermissionError):
            p.hosted_resources.owned_tasks(watch,rows)
        with patch.object(Path,'open',side_effect=FileNotFoundError), \
             patch.object(p.hosted_resources.select,'select',return_value=([],[],[])),self.assertRaises(Exception):
            p.hosted_resources.owned_tasks(watch,rows)


if __name__=='__main__':unittest.main()
