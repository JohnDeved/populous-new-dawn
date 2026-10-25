import hashlib
import io
import json
import os
from pathlib import Path
import re
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
                     patch.object(setup,'extract') as extract:
                    with self.assertRaises(ProducerFailed):caller({'PATH':'/usr/bin:/bin'})
                    extract.assert_not_called()
                self.assertEqual(details['producer'],{'exitCode':7,'waitCompleted':True,'waitExitCode':7})

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
