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


class CommandDiagnosticTests(unittest.TestCase):
    def test_start_precedes_subprocess_and_failure_retains_bounded_outcome(self):
        for failure in (None,FileNotFoundError(2,'fixture'),p.subprocess.CalledProcessError(7,['fixture'])):
            with tempfile.TemporaryDirectory() as temporary:
                root=Path(temporary);(root/'records').mkdir();tool=root/'tool';tool.write_bytes(b'fixture only')
                argv=[str(tool),'--fixture']
                def run(*args,**kwargs):
                    record=json.loads((root/'records/fixture-start.json').read_bytes())
                    self.assertEqual(record['argv'],argv)
                    self.assertEqual(record['executable']['sha256'],hashlib.sha256(b'fixture only').hexdigest())
                    self.assertNotIn('env',record)
                    if failure:raise failure
                    return types.SimpleNamespace(returncode=0)
                with patch.object(p.subprocess,'run',side_effect=run) as mocked:
                    if failure:
                        with self.assertRaises(type(failure)):p.command(argv,root,{'SECRET':'never-record'},phase='fixture')
                    else:p.command(argv,root,{'SECRET':'never-record'},phase='fixture')
                mocked.assert_called_once()
                finish=json.loads((root/'records/fixture-finish.json').read_bytes())
                self.assertEqual(finish['error'] is None,failure is None)
                self.assertNotIn('never-record',''.join(x.read_text() for x in (root/'records').iterdir()))

    def test_exclusive_or_oversized_start_stops_before_launch(self):
        with tempfile.TemporaryDirectory() as temporary:
            root=Path(temporary);(root/'records').mkdir();tool=root/'tool';tool.write_bytes(b'fixture')
            (root/'records/fixture-start.json').write_text('preserve')
            with patch.object(p.subprocess,'run') as run:
                with self.assertRaises(FileExistsError):p.command([str(tool)],root,{},phase='fixture')
                with self.assertRaisesRegex(ValueError,'argv cap'):p.command([str(tool),'x'*2049],root,{},phase='oversized')
            run.assert_not_called()
            self.assertEqual((root/'records/fixture-start.json').read_text(),'preserve')

    def test_finish_write_failure_never_masks_primary_or_passes_success(self):
        for primary in (None,p.subprocess.CalledProcessError(7,['fixture'])):
            with tempfile.TemporaryDirectory() as temporary:
                root=Path(temporary);(root/'records').mkdir();tool=root/'tool';tool.write_bytes(b'fixture')
                write=p.command_record
                def record(path,value):
                    if path.name.endswith('-finish.json'):raise OSError(28,'fixture disk full')
                    return write(path,value)
                with patch.object(p,'command_record',side_effect=record), \
                     patch.object(p.subprocess,'run',return_value=types.SimpleNamespace(returncode=0),side_effect=primary):
                    with self.assertRaises(type(primary) if primary else OSError) as caught:
                        p.command([str(tool)],root,{},phase='fixture')
                if primary:
                    self.assertIs(caught.exception,primary)
                    self.assertEqual(primary.__notes__,['Command finish record failed: OSError; errno=28'])
                else:self.assertEqual(caught.exception.errno,28)
                self.assertTrue((root/'records/fixture-start.json').exists())

    def test_query_start_is_saved_before_bounded_inspection(self):
        with tempfile.TemporaryDirectory() as temporary:
            root=Path(temporary);tool=root/'tool';tool.write_bytes(b'fixture')
            def inspect(argv,directory):
                self.assertTrue((directory/'inspection-start.json').exists())
                raise ValueError('fixture inspection failure')
            with patch.object(p.setup,'bounded_inspection',side_effect=inspect):
                with self.assertRaisesRegex(ValueError,'fixture inspection failure'):
                    p.inspected([str(tool),'--version'],root,'query')


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


class SourceLicenseTests(unittest.TestCase):
    def setUp(self):
        self.temporary=tempfile.TemporaryDirectory();self.addCleanup(self.temporary.cleanup)
        self.root=Path(self.temporary.name);self.archive=self.root/'source.tar';self.out=self.root/'out';self.out.mkdir()
        self.license=b'fixture license\n';self.prefix='bubblewrap-0.13.1/'

    def make(self, aliases=None, license_data=None):
        aliases=aliases if aliases is not None else [('COPYING.LIB','COPYING'),('LICENSE','COPYING')]
        with tarfile.open(self.archive,'w') as bundle:
            data=self.license if license_data is None else license_data
            m=tarfile.TarInfo(self.prefix+'COPYING');m.size=len(data);m.mode=0o644;bundle.addfile(m,io.BytesIO(data))
            for name,target in aliases:
                m=tarfile.TarInfo(self.prefix+name);m.type=tarfile.SYMTYPE;m.linkname=target;m.mode=0o777;bundle.addfile(m)

    def extract(self, **limits):
        contract={'SOURCE_ARCHIVE_BYTES':self.archive.stat().st_size,
            'SOURCE_ARCHIVE_SHA':hashlib.sha256(self.archive.read_bytes()).hexdigest(),
            'LICENSE_BYTES':len(self.license),'LICENSE_SHA':hashlib.sha256(self.license).hexdigest(),**limits}
        extractor=p.Extractor()
        with patch.multiple(p,**contract):extractor.tar(self.archive,self.out,source_licenses=True)
        return extractor

    def test_only_exact_aliases_become_regular_accounted_license_copies(self):
        self.make();extractor=self.extract()
        for name in ['COPYING','COPYING.LIB','LICENSE']:
            target=self.out/self.prefix/name
            self.assertFalse(target.is_symlink());self.assertEqual(target.read_bytes(),self.license)
        self.assertEqual(extractor.bytes,3*len(self.license));self.assertEqual(extractor.entries,3)
        self.assertEqual(len(extractor.license_copies),2)
        self.assertEqual(extractor.license_copies[0]['archiveMember']['linkTarget']['text'],'COPYING')

    def test_unknown_alias_or_target_rejected(self):
        for name,target in [('OTHER','COPYING'),('LICENSE','../COPYING'),('LICENSE','/COPYING'),('LICENSE','missing')]:
            with self.subTest(name=name,target=target),tempfile.TemporaryDirectory() as newout:
                self.out=Path(newout);self.make([(name,target)])
                with self.assertRaisesRegex(ValueError,'Unexpected source license alias'):self.extract()

    def test_canonical_license_content_must_match(self):
        self.make(license_data=b'x'*len(self.license))
        with self.assertRaisesRegex(ValueError,'canonical identity differs'):self.extract()

    def test_copy_is_included_in_original_byte_and_entry_caps(self):
        self.make()
        with self.assertRaisesRegex(ValueError,'expanded-size cap'):self.extract(MAX_EXPANDED=2*len(self.license),SOURCE_ARCHIVE_BYTES=self.archive.stat().st_size)

    def test_source_archive_identity_gate_precedes_materialization(self):
        self.make()
        with self.assertRaisesRegex(ValueError,'archive identity differs'):
            p.Extractor().tar(self.archive,self.out,source_licenses=True)
        self.assertEqual(list(self.out.iterdir()),[])

    def test_rejection_reports_escaped_member_and_preserves_original(self):
        self.make([('BAD\x1b[31m','COPYING')]);output=io.StringIO()
        with patch.object(p.sys,'stderr',output),self.assertRaisesRegex(ValueError,'Unexpected source license alias'):
            self.extract()
        line=output.getvalue();self.assertNotIn('\x1b',line);self.assertLessEqual(len(line.encode()),16385)
        record=json.loads(line);self.assertEqual(record['member']['index'],1)
        self.assertEqual(record['member']['typeHex'],'32');self.assertIn('BAD',record['member']['name']['text'])

    def test_diagnostic_output_failure_does_not_mask_rejection(self):
        self.make([('BAD','COPYING')])
        with patch.object(p,'print',side_effect=OSError('diagnostic unavailable'),create=True),self.assertRaisesRegex(ValueError,'Unexpected source license alias'):
            self.extract()

    def test_diagnostic_text_bounds_are_explicit(self):
        row=p.diagnostic_text('\x1b'+'é'*5000,512)
        self.assertTrue(row['truncated']);self.assertEqual(row['bytes'],10001)
        self.assertEqual(row['sha256'],hashlib.sha256(('\x1b'+'é'*5000).encode()).hexdigest())


class PinnedPcTests(unittest.TestCase):
    ORIGINAL='prefix=/usr\nexec_prefix=/usr\nlibdir=/usr/lib64\nincludedir=/usr/include\n\nName: libcap\nDescription: libcap - linux capabilities library\nVersion: 2.66\nLibs: -L${libdir} -lcap\nLibs.private: \nCflags: -I${includedir}\n'
    def setUp(self):
        self.temporary=tempfile.TemporaryDirectory();self.addCleanup(self.temporary.cleanup)
        self.root=Path(self.temporary.name);self.directory=self.root/'usr/lib/x86_64-linux-gnu';self.directory.mkdir(parents=True)
        self.pins={}
        for name,data in [('usr/include/sys/capability.h',b'header'),('usr/lib/x86_64-linux-gnu/libcap.so.2.66',b'runtime')]:
            path=self.root/name;path.parent.mkdir(parents=True,exist_ok=True);path.write_bytes(data)
            self.pins[name]=(len(data),hashlib.sha256(data).hexdigest())
        (self.directory/'libcap.so').symlink_to('libcap.so.2');(self.directory/'libcap.so.2').symlink_to('libcap.so.2.66')

    def test_exact_original_metadata_maps_to_verified_private_payload(self):
        self.assertEqual(hashlib.sha256(self.ORIGINAL.encode()).hexdigest(),p.PINNED_PC_SHA)
        with patch.object(p,'PINNED_LIBCAP_FILES',self.pins):derived=p.rebase_pc(self.ORIGINAL,self.root)
        self.assertIn('libdir='+str(self.directory)+'\n',derived)
        self.assertNotIn('=/usr/lib64',derived)
        self.assertIn('includedir='+str(self.root/'usr/include'),derived)

    def test_unknown_lib64_metadata_remains_rejected(self):
        with patch.object(p,'PINNED_LIBCAP_FILES',self.pins),self.assertRaisesRegex(ValueError,'Unknown /usr/lib64'):
            p.rebase_pc(self.ORIGINAL+'# changed\n',self.root)

    def test_missing_or_changed_header_runtime_rejected(self):
        for name in self.pins:
            path=self.root/name;original=path.read_bytes();path.write_bytes(b'changed')
            with patch.object(p,'PINNED_LIBCAP_FILES',self.pins),self.assertRaisesRegex(ValueError,'header/runtime differs'):
                p.rebase_pc(self.ORIGINAL,self.root)
            path.write_bytes(original)

    def test_unexpected_alias_never_falls_back_to_host(self):
        link=self.directory/'libcap.so';link.unlink();link.symlink_to('/usr/lib/x86_64-linux-gnu/libcap.so.2')
        with patch.object(p,'PINNED_LIBCAP_FILES',self.pins),self.assertRaisesRegex(ValueError,'alias differs'):
            p.rebase_pc(self.ORIGINAL,self.root)


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
            self.assertEqual(command.call_args.kwargs,{'phase':'meson-configure'})
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


class DependencyAliasTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.shared=p.execution.load_shared({'path':str(HERE/'scripts/orchestration/shared_execution.py'),
                                           'sha256':p.setup.ADAPTER_SHA})

    def setUp(self):
        temporary=tempfile.TemporaryDirectory();self.addCleanup(temporary.cleanup);self.root=Path(temporary.name)
        self.target=self.root/'loader-real';self.target.write_bytes(b'fixed target')
        self.link=self.root/'loader';self.link.symlink_to('loader-mid')
        self.middle=self.root/'loader-mid';self.middle.symlink_to('loader-real')
        self.paths={self.link,self.target}

    def test_actual_alias_chain_retained_with_canonical_identity(self):
        result=p.dependency_identities(self.shared,self.paths)
        self.assertEqual(set(result),set(map(str,self.paths)))
        row=result[str(self.link)]
        self.assertEqual(row['canonicalPath'],str(self.target))
        self.assertEqual(row['targetIdentity']['sha256'],hashlib.sha256(b'fixed target').hexdigest())
        self.assertEqual([x['target'] for x in row['chain'] if x['kind']=='link'],['loader-mid','loader-real'])
        self.assertEqual(result,p.dependency_identities(self.shared,self.paths))
        # The write/physical-file hashing guard is deliberately not relaxed.
        with self.assertRaisesRegex(ValueError,'Symlink path component'):p.policy.sha256_file(self.link)

    def test_relative_parent_and_directory_alias_chain(self):
        real=self.root/'lib';real.mkdir();target=real/'loader';target.write_bytes(b'library')
        alias=self.root/'lib-alias';alias.symlink_to('lib',target_is_directory=True)
        bin_dir=self.root/'bin';bin_dir.mkdir();link=bin_dir/'loader';link.symlink_to('../lib-alias/loader')
        row=p.dependency_identity(self.shared,link,{str(link),str(target)})
        self.assertEqual(row['canonicalPath'],str(target))
        self.assertEqual(len([x for x in row['chain'] if x['kind']=='link']),2)

    def test_alias_retarget_during_hash_is_rejected(self):
        other=self.root/'other';other.write_bytes(b'other');real=self.shared.file_identity
        def change(path,**kwargs):
            value=real(path,**kwargs);self.middle.unlink();self.middle.symlink_to('other');return value
        with patch.object(self.shared,'file_identity',side_effect=change),self.assertRaises(Exception):
            p.dependency_identity(self.shared,self.link,{str(x) for x in [*self.paths,other]})

    def test_target_mutation_during_hash_is_rejected(self):
        real=self.shared.file_identity
        def change(path,**kwargs):
            value=real(path,**kwargs);self.target.write_bytes(b'changed');return value
        with patch.object(self.shared,'file_identity',side_effect=change),self.assertRaises(Exception):
            p.dependency_identity(self.shared,self.link,set(map(str,self.paths)))

    def test_missing_undeclared_and_cycle_remain_fail_closed(self):
        with self.assertRaises(Exception):p.dependency_identity(self.shared,self.link,{str(self.link)})
        self.middle.unlink();self.middle.symlink_to('missing')
        with self.assertRaises(Exception):p.dependency_identity(self.shared,self.link,set(map(str,self.paths)))
        self.middle.unlink();self.middle.symlink_to('loader')
        with self.assertRaises(Exception):p.dependency_identity(self.shared,self.link,set(map(str,self.paths)))

    @unittest.skipUnless(sys.platform=='linux','UNSUPPORTED: actual Linux loader identity regression not exercised')
    def test_actual_trusted_linux_loader_alias_without_build_or_namespace(self):
        output=self.root/'actual-host';output.mkdir(mode=0o700)
        with patch.multiple(p,acquire=Mock(side_effect=AssertionError('no acquisition')),
                            producer=Mock(side_effect=AssertionError('no producer')),
                            configure=Mock(side_effect=AssertionError('no configure')),
                            command=Mock(side_effect=AssertionError('no build')),
                            run=Mock(side_effect=AssertionError('no operation')),
                            qualify=Mock(side_effect=AssertionError('no namespace'))), \
             patch.object(self.shared,'qualify_backend',side_effect=AssertionError('no backend')):
            report=p.readonly_host_smoke(self.shared,output)
        self.assertEqual(report['status'],'passed')
        self.assertFalse(report['compilerExecuted']);self.assertFalse(report['namespaceExecuted'])
        self.assertFalse(report['acquisitionExecuted']);self.assertFalse(report['browserExecuted'])
        command=json.loads((output/'dependency-0/command.json').read_bytes())
        self.assertEqual(command['exitCode'],0);self.assertTrue(command['waitCompleted'])
        self.assertLessEqual(sum(path.stat().st_size for path in output.rglob('*') if path.is_file()),8*1024**2)
        print('ACTUAL_READONLY_LINUX_LOADER_IDENTITY: passed; no compiler/build/acquisition/namespace/browser')

    def test_all_dependency_dictionary_callers_use_alias_identity(self):
        import ast
        tree=ast.parse((p.HERE/'bwrap_prerequisites.py').read_text())
        calls=[n for n in ast.walk(tree) if isinstance(n,ast.Call) and isinstance(n.func,ast.Name)
               and n.func.id=='dependency_identities']
        self.assertEqual(len(calls),6) # private runtime, two compiler paths, post-build comparison


if __name__=='__main__':unittest.main()
