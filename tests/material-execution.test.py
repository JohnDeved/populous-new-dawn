from pathlib import Path
import sys
import tempfile
import types
import unittest
from unittest.mock import patch
sys.dont_write_bytecode=True
HERE=Path(__file__).resolve().parents[1]/'scripts/material-lifecycle-evidence'
sys.path.insert(0,str(HERE))
import execution as e
import projection as p

class WiringTests(unittest.TestCase):
    def test_exact_original_projection_mounts_reused(self):
        captured=[]
        fake=types.SimpleNamespace(PRIVATE_LEAVES=('control','receipt','tmp','shm','module-vite'),
            CACHES=('.vite',),validate_mounts=lambda rows,*a,**kw:captured.extend(rows))
        profile={'namespaceRuntime':'/runtime','applicationMounts':[['/original/private-git','/runtime/.git'],
            ['/original/public-scaffold','/runtime/public'],['/assets','/runtime/public/original']]}
        result=p.mounts(fake,{'tools':{'readonly':['/tools']}},profile,Path('/attempt'))
        self.assertEqual(result['namespaceRuntime'],'/runtime')
        for a,b in profile['applicationMounts']:self.assertIn(['ro',a,b],captured)
        self.assertIn(['rw','/attempt/launch-root','/runtime'],captured)
        self.assertNotIn(['rw','/assets','/runtime/public/original'],captured)
    def test_raw_includes_every_known_destination(self):
        with tempfile.TemporaryDirectory() as tmp:
            root=Path(tmp);(root/'receipt').mkdir()
            names=['transport.stdout','transport.stderr','server.log','wrangler.log','harness.stdout','harness.stderr','contract.stdout','contract.stderr']
            names += [label+'.'+stream for label in ('head','tree','status','diff') for stream in ('stdout','stderr')]
            for name in names:(root/'receipt'/name).write_bytes(b'abc')
            self.assertEqual(len(e.raw_lengths(root)),len(names))
    def test_raw_symlink_rejected(self):
        with tempfile.TemporaryDirectory() as tmp:
            root=Path(tmp);(root/'original').write_bytes(b'a');(root/'server.log').symlink_to(root/'original')
            with self.assertRaises(ValueError):e.raw_lengths(root)
    def test_late_shared_failure_is_not_masked(self):
        class Base:
            def check(self):raise RuntimeError('late failure')
        with self.assertRaisesRegex(RuntimeError,'late failure'):e.watch_type(types.SimpleNamespace(OwnerWatch=Base))().check()
    def test_additional_file_raw_cap(self):
        class Base:
            def check(self):pass
        watch=e.watch_type(types.SimpleNamespace(OwnerWatch=Base))();watch.evidence=Path('/fixture')
        with patch.object(e,'raw_lengths',return_value={'server.log':16777217}):
            with self.assertRaises(ValueError):watch.check()
    def test_cleanup_clock_never_resets(self):
        class Base:
            def cleanup(self):pass
            def finish(self):pass
        watch=e.watch_type(types.SimpleNamespace(OwnerWatch=Base))()
        with patch.object(e.time,'monotonic',side_effect=[10,16]):
            watch.cleanup();watch.cleanup()
            with self.assertRaisesRegex(ValueError,'Aggregate cleanup'):watch.finish()
        self.assertEqual(watch.cleanup_started,10);self.assertEqual(watch.cleanup_elapsed,6)
    def test_cleanup_keeps_killing_after_expiry(self):
        calls=[]
        class Base:
            def cleanup(self):calls.append('kill')
            def finish(self):pass
        watch=e.watch_type(types.SimpleNamespace(OwnerWatch=Base))()
        with patch.object(e.time,'monotonic',side_effect=[10,16]):
            watch.cleanup();watch.cleanup();watch.cleanup()
            with self.assertRaises(ValueError):watch.finish()
        self.assertEqual(calls,['kill']*3)
    def test_manifest_hash_required(self):
        with tempfile.TemporaryDirectory() as tmp:
            path=Path(tmp)/'spec';path.write_text('{}')
            with self.assertRaises(ValueError):e.load_spec(path,'0'*64)
    def test_wrong_material_spec_kind(self):
        with tempfile.TemporaryDirectory() as tmp:
            path=Path(tmp)/'spec';path.write_text('{}')
            with self.assertRaises(ValueError):e.load_spec(path,e.policy.sha256_file(path))
    def test_frozen_pins_cannot_self_substitute(self):
        altered=dict(e.policy.FROZEN_PINS);altered['contract.mjs']='0'*64
        with self.assertRaises(ValueError):e.policy.verify_frozen_files(HERE,altered)

if __name__=='__main__':unittest.main()
