"""Synthetic fixtures only: no process launch, signal, browser, prctl or /proc reads."""
import ctypes, json, os, tempfile, time, unittest
from pathlib import Path
from types import SimpleNamespace
from unittest.mock import patch
import supervisor
from supervisor import Owners,RuntimeTemp,bounded_chunk,cleanup_proven,socket_path_bytes,stop_reason,WORK,RSS,PROFILE

def row(ppid,start,rss=1,state='S'):return {'ppid':ppid,'start':start,'rss':rss,'state':state}
class OwnershipTests(unittest.TestCase):
    def test_detached_descendants_follow_parentage_not_process_group(self):
        o=Owners(10);live=o.update({11:row(10,100),12:row(11,101),13:row(12,102),99:row(1,999)})
        self.assertEqual(set(live),{11,12,13});self.assertNotIn(99,o.known)
    def test_reparented_detached_browser_is_adopted_by_subreaper(self):
        o=Owners(10);live=o.update({12:row(10,101),13:row(12,102)})
        self.assertEqual(set(live),{12,13})
    def test_pid_reuse_never_authorizes_signal(self):
        o=Owners(10);o.update({11:row(10,100)})
        self.assertFalse(o.signalable(11,row(1,200)));self.assertEqual(o.update({11:row(1,200)}),{})
    def test_cleanup_requires_no_known_survivor(self):
        o=Owners(10);o.update({11:row(10,100),12:row(11,101)})
        self.assertTrue(o.update({12:row(10,101)}));self.assertEqual(o.update({}),{})
    def test_orphan_with_unknown_parent_is_not_signaled(self):
        o=Owners(10);self.assertEqual(o.update({99:row(1,1)}),{});self.assertFalse(o.signalable(99,row(1,1)))
    def test_deadline_and_sampled_limits_fail_without_a_retry_budget(self):
        self.assertIsNone(stop_reason(WORK-1,RSS,PROFILE))
        self.assertEqual(stop_reason(WORK,1,1),'work deadline')
        self.assertEqual(stop_reason(0,RSS+1,1),'sampled owned RSS limit')
        self.assertEqual(stop_reason(0,1,PROFILE+1),'sampled profile size limit')
    def test_unknown_cleanup_never_releases_lane(self):
        self.assertTrue(cleanup_proven({},[]))
        self.assertFalse(cleanup_proven({12:row(1,1)},[]))
        self.assertFalse(cleanup_proven({},[12]))
    def test_stream_cap_preserves_prefix_and_flags_overflow(self):
        self.assertEqual(bounded_chunk(2,b'abcdef',5),(b'abc',True))
        self.assertEqual(bounded_chunk(5,b'x',5),(b'',True))
        self.assertEqual(bounded_chunk(2,b'abc',5),(b'abc',False))

class RuntimeTempTests(unittest.TestCase):
    def setUp(self):
        self.fixture=tempfile.TemporaryDirectory(prefix='hud-t-',dir='/tmp')
        self.addCleanup(self.fixture.cleanup)
        self.parent=Path(self.fixture.name);self.root=self.parent/'output';self.root.mkdir()
        self.parent_patch=patch.object(supervisor,'TEMP_PARENT',self.parent)
        self.parent_patch.start();self.addCleanup(self.parent_patch.stop)

    def allocate(self):
        owner=RuntimeTemp(self.root);owner.create(time.monotonic()+5);return owner

    def test_actual_failed_path_exceeds_linux_socket_limit_and_short_root_fits(self):
        observed='/home/runner/work/populous-new-dawn/populous-new-dawn/outputs/hud-preference-ssr/runtime-tmp/com.google.Chrome.qkz69E/SingletonSocket'
        self.assertEqual(len(observed.encode()),133)
        self.assertGreater(socket_path_bytes(Path(observed).parent.parent),107)
        self.assertEqual(socket_path_bytes(Path('/tmp/pnd-hud-abcdefgh')),62)
        owner=self.allocate();self.assertLessEqual(owner.record()['socketPathBytes'],107)
        self.assertEqual(owner.identity['mode'],0o700);self.assertEqual(owner.identity['uid'],os.geteuid())

    def test_overlong_generated_root_is_rejected_but_still_owned_for_retirement(self):
        parent=self.parent/('long-'*20);parent.mkdir();owner=RuntimeTemp(self.root)
        with patch.object(supervisor,'TEMP_PARENT',parent):
            try:
                with self.assertRaisesRegex(AssertionError,'socket path too long'):owner.create(time.monotonic()+5)
                self.assertTrue(owner.path.is_dir())
            finally:self.assertTrue(owner.retire(True,time.monotonic()+5))

    def test_unique_root_retains_only_its_own_files_and_identity(self):
        first=self.allocate();second=self.allocate();self.assertNotEqual(first.path,second.path)
        with self.assertRaises(AssertionError):first.create(time.monotonic()+5)
        (first.path/'profile').write_text('owned');(second.path/'foreign').write_text('untouched')
        self.assertEqual(supervisor.profile_size(first.path),len('owned'))
        self.assertTrue(first.retire(True,time.monotonic()+5))
        self.assertFalse(os.path.lexists(first.path));self.assertEqual(first.identity,first.retired_identity)
        self.assertEqual((self.root/'runtime-tmp/profile').read_text(),'owned')
        self.assertEqual(supervisor.profile_size(self.root/'runtime-tmp'),len('owned'))
        self.assertEqual((second.path/'foreign').read_text(),'untouched')
        with self.assertRaises(AssertionError):second.retire(True,time.monotonic()+5)

    def test_destination_alias_and_foreign_or_changed_owner_are_rejected(self):
        owner=self.allocate()
        for variant in ['destination','symlink','mode','identity','foreign-uid']:
            with self.subTest(variant=variant):
                original=owner.identity.copy()
                if variant=='destination':owner.destination.mkdir()
                elif variant=='symlink':owner.destination.symlink_to(owner.path,target_is_directory=True)
                elif variant=='mode':owner.path.chmod(0o755)
                elif variant=='identity':owner.identity['inode']+=1
                else:owner.identity['uid']+=1
                try:
                    with self.assertRaises(AssertionError):owner.retire(True,time.monotonic()+5)
                    self.assertTrue(owner.path.is_dir());self.assertFalse(owner.retired)
                finally:
                    owner.identity=original
                    if variant=='destination':owner.destination.rmdir()
                    elif variant=='symlink':owner.destination.unlink()
                    elif variant=='mode':owner.path.chmod(0o700)
        self.assertTrue(owner.retire(True,time.monotonic()+5))

    def test_replaced_root_symlink_is_not_followed_or_retired(self):
        owner=self.allocate();saved=owner.path.with_name(owner.path.name+'-saved')
        owner.path.rename(saved);owner.path.symlink_to(saved,target_is_directory=True)
        with self.assertRaises(AssertionError):owner.retire(True,time.monotonic()+5)
        self.assertTrue(owner.path.is_symlink());self.assertTrue(saved.is_dir());self.assertFalse(owner.destination.exists())

    def test_same_filesystem_is_required_before_allocation(self):
        original=supervisor.directory_identity
        def different_device(path):
            result=original(path)
            if path==self.root:result['device']+=1
            return result
        with patch.object(supervisor,'directory_identity',different_device),patch.object(supervisor.tempfile,'mkdtemp') as allocate:
            with self.assertRaises(AssertionError):RuntimeTemp(self.root).create(time.monotonic()+5)
            allocate.assert_not_called()

    def test_preexisting_destination_prevents_allocation(self):
        (self.root/'runtime-tmp').mkdir()
        with patch.object(supervisor.tempfile,'mkdtemp') as allocate:
            with self.assertRaises(AssertionError):RuntimeTemp(self.root).create(time.monotonic()+5)
            allocate.assert_not_called()

    def test_survivors_deadline_and_failed_rename_do_not_certify_retirement(self):
        owner=self.allocate()
        with self.assertRaises(AssertionError):owner.retire(False,time.monotonic()+5)
        with self.assertRaises(TimeoutError):owner.retire(True,time.monotonic()-1)
        real_libc=owner.libc
        owner.libc=SimpleNamespace(renameat2=lambda *args:-1)
        with self.assertRaises(OSError):owner.retire(True,time.monotonic()+5)
        self.assertFalse(owner.retired);self.assertFalse(owner.outside_absent);self.assertTrue(owner.path.is_dir())
        owner.libc=real_libc;self.assertTrue(owner.retire(True,time.monotonic()+5))

    def test_late_destination_is_never_overwritten(self):
        owner=self.allocate();real_rename=owner.libc.renameat2
        def raced_destination(*args):
            owner.destination.mkdir();(owner.destination/'foreign').write_text('untouched')
            return real_rename(*args)
        owner.libc=SimpleNamespace(renameat2=raced_destination)
        with self.assertRaises(OSError):owner.retire(True,time.monotonic()+5)
        self.assertEqual((owner.destination/'foreign').read_text(),'untouched')
        self.assertTrue(owner.path.is_dir());self.assertFalse(owner.retired)

    def test_parent_alias_is_rejected_before_allocation(self):
        alias=self.parent/'alias';alias.symlink_to(self.root,target_is_directory=True)
        with patch.object(supervisor.tempfile,'mkdtemp') as allocate:
            with self.assertRaises(AssertionError):RuntimeTemp(alias).create(time.monotonic()+5)
            allocate.assert_not_called()

    def test_setup_write_launch_and_finalization_failures_retire_owned_root(self):
        real_read=Path.read_text;real_write=Path.write_text;real_libc=ctypes.CDLL(None,use_errno=True)
        def prctl(operation,*args):
            if operation==37:args[0]._obj.value=1
            return 0
        fake_libc=SimpleNamespace(prctl=prctl,renameat2=real_libc.renameat2)
        for failure in ['attempt-write','home-setup','launch','finalization']:
            with self.subTest(failure=failure),tempfile.TemporaryDirectory(prefix='case-',dir=self.parent) as directory:
                root=Path(directory)
                (root/'binding.json').write_text(json.dumps({'node':'/never-launched'}))
                (root/'runtime-admission.json').write_text(json.dumps({'approved':True,'bindingSha256':'fixture'}))
                if failure=='home-setup':(root/'runtime-home').mkdir()
                def read(path,*args,**kwargs):
                    return 'MemAvailable: 8388608 kB\n' if str(path)=='/proc/meminfo' else real_read(path,*args,**kwargs)
                def write(path,text,*args,**kwargs):
                    if failure=='attempt-write' and path.name=='runtime-attempt.json' and 'runtimeTemporary' in text:raise OSError('Synthetic attempt write failure')
                    return real_write(path,text,*args,**kwargs)
                with patch.object(supervisor.sys,'argv',['supervisor',str(root)]),patch.object(supervisor,'bounded_hash',return_value='fixture'), \
                     patch.object(supervisor,'verify_binding'),patch.object(supervisor,'snapshot',return_value=({},[])), \
                     patch.object(supervisor.ctypes,'CDLL',return_value=fake_libc),patch.object(Path,'read_text',read),patch.object(Path,'write_text',write), \
                     patch.object(supervisor.os,'statvfs',return_value=SimpleNamespace(f_bavail=4*1024**3,f_frsize=1)), \
                     patch.object(supervisor.subprocess,'Popen',side_effect=OSError('Synthetic launch failure')) as spawn:
                    if failure=='finalization':
                        with patch.object(supervisor,'finalize_payload',side_effect=OSError('Synthetic finalization failure')):
                            with self.assertRaises(OSError):supervisor.main()
                        receipt=json.loads((root/'supervisor-receipt.json').read_text())
                        self.assertTrue(receipt['runtimeTemporary']['retired'])
                    else:
                        self.assertEqual(supervisor.main(),1)
                        receipt=json.loads((root/'supervisor-receipt.json').read_text())
                        self.assertTrue(receipt['processCleanupComplete']);self.assertTrue(receipt['cleanupComplete'])
                        self.assertTrue(receipt['runtimeTemporary']['retired']);self.assertEqual(receipt['status'],'failed')
                    if failure in ['attempt-write','home-setup']:spawn.assert_not_called()
                    else:spawn.assert_called_once()
                self.assertTrue((root/'runtime-tmp').is_dir())
                self.assertEqual(list(self.parent.glob('pnd-hud-*')),[])
if __name__=='__main__':unittest.main()
