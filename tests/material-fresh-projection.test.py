"""Generated source/metadata fixtures only. Never invokes Git, pnpm or browser."""
import hashlib
import json
import os
from pathlib import Path
import sys
import tempfile
import types
import unittest
from unittest.mock import patch
sys.dont_write_bytecode = True
HERE = Path(__file__).resolve().parents[1]/'scripts/material-lifecycle-evidence'
sys.path.insert(0, str(HERE))
import fresh_projection as f
import target_admission as a
import projection as p
import controller as policy


def oid(data):
    return hashlib.sha1(f'blob {len(data)}\0'.encode()+data).hexdigest()


def inventory(root, ignore_caches=False):
    rows = []
    paths = [root] + sorted(root.rglob('*')) if root.is_dir() else [root]
    for path in paths:
        if ignore_caches and any(part in f.CACHES for part in path.relative_to(root).parts):
            continue
        rows.append([str(path.relative_to(root)), f.key(path),
                     os.readlink(path) if path.is_symlink() else
                     hashlib.sha256(path.read_bytes()).hexdigest() if path.is_file() else None])
    return hashlib.sha256(f.encoded(rows)).hexdigest()


class FreshProjection(unittest.TestCase):
    def setUp(self):
        self.tmp = tempfile.TemporaryDirectory()
        self.addCleanup(self.tmp.cleanup)
        self.base = Path(self.tmp.name)
        self.root = self.base/'checkout'
        self.root.mkdir()
        (self.root/'.git').mkdir()
        (self.root/'app').mkdir()
        self.data = b'fixture-source\n'
        (self.root/'app/a.ts').write_bytes(self.data)
        (self.root/'pnpm-lock.yaml').write_bytes(b'lockfixture\n')
        modules = self.root/'node_modules'
        modules.mkdir()
        (modules/'.pnpm').mkdir()
        for name in f.CACHES:
            (modules/name).mkdir()
        for name in ('.modules.yaml', '.pnpm/lock.yaml', '.pnpm-workspace-state-v1.json'):
            (modules/name).write_bytes(b'fixture metadata\n')
        self.rows = [{'path': name, 'mode':'100644', 'oid':oid((self.root/name).read_bytes())}
                     for name in ('app/a.ts','pnpm-lock.yaml')]
        self.served = [{**row, 'bytes':(self.root/row['path']).stat().st_size,
                        'sha256':hashlib.sha256((self.root/row['path']).read_bytes()).hexdigest()}
                       for row in self.rows]
        self.manifest = {'completeIndexedEntries':2, 'entries':self.served, 'servedEntries':2, 'assetEntries':0}
        self.git = self.base/'git'; self.git.write_bytes(b'not executable')
        self.parent = self.base/'evidence'; self.parent.mkdir()
        self.install = {'kind':'material-hosted-installation','exitCode':0,
                        'sourceCommit':policy.REVISION,'sourceTree':policy.TREE,
                        'checkout':str(self.root),'pnpmVersion':f.PNPM_VERSION,
                        'frozenLockfile':True,'ignoreScripts':True,
                        'lockSha256':policy.sha256_file(self.root/'pnpm-lock.yaml')}
        self.install_path = self.base/'installation.json'
        self.install_path.write_text(json.dumps(self.install))
        self.ref = {'path':str(self.install_path),'sha256':policy.sha256_file(self.install_path)}
        def pinned(ref):
            self.assertEqual(policy.sha256_file(ref['path']),ref['sha256'])
            return json.loads(Path(ref['path']).read_bytes())
        self.shared = types.SimpleNamespace(inventory_hash=inventory,pinned_json=pinned)
        self.addCleanup(patch.stopall)
        patch.object(f,'manifest',return_value=self.manifest).start()
        patch.object(f,'git_read',side_effect=self.git_read).start()

    def git_read(self, git, root, args):
        if args == ['rev-parse','--show-toplevel']:
            return (str(root)+'\n').encode()
        if args == ['rev-parse','--absolute-git-dir']:
            return (str(root/'.git')+'\n').encode()
        if args == ['rev-parse','HEAD']:
            return (policy.REVISION+'\n').encode()
        if args == ['rev-parse','HEAD^{tree}']:
            return (policy.TREE+'\n').encode()
        if args[0] == 'ls-tree':
            return b''.join(f"{r['mode']} blob {r['oid']}\t{r['path']}\0".encode() for r in self.rows)
        return b''

    def build(self):
        return f.build_profile(self.shared,self.root,self.git,self.parent,self.ref)

    def test_fresh_profile_uses_checkout_children_not_old_inode_receipts(self):
        value = self.build()
        self.assertEqual(value['version'],2)
        self.assertNotIn('originalMountPlan',value)
        self.assertNotIn('sourceReview',value)
        self.assertEqual(value['namespaceRuntime'],str(self.root))
        self.assertFalse(value['executionAccepted'])
        self.assertEqual({Path(a).name for a,b in value['applicationMounts']},
                         {'.git','app','pnpm-lock.yaml','node_modules'})
        self.assertTrue(all(a == b for a,b in value['applicationMounts']))

    def test_inputs_recheck_real_bytes(self):
        value = self.build()
        f.inputs(self.shared,{},value)
        (self.root/'app/a.ts').write_bytes(b'changed source\n')
        with self.assertRaisesRegex(ValueError,'Tracked bytes'):
            f.inputs(self.shared,{},value)

    def test_nonserved_tracked_payload_also_verified(self):
        self.manifest['entries'] = self.served[:1]
        self.manifest['servedEntries'] = 1
        (self.root/'pnpm-lock.yaml').write_bytes(b'changed nonserved\n')
        with self.assertRaisesRegex(ValueError,'Tracked bytes'):
            f.inspect(self.shared,self.root,self.git)

    def test_same_byte_replacement_rejected_after_profile(self):
        value = self.build()
        file = self.root/'app/a.ts'
        replacement = self.root/'app/new'
        replacement.write_bytes(file.read_bytes())
        replacement.replace(file)
        with self.assertRaisesRegex(ValueError,'changed'):
            f.inputs(self.shared,{},value)

    def test_dirty_checkout_rejected(self):
        original = self.git_read
        def dirty(git,root,args):
            return b' M app/a.ts\0' if args[0] == 'status' else original(git,root,args)
        with patch.object(f,'git_read',side_effect=dirty):
            with self.assertRaisesRegex(ValueError,'dirty'):
                self.build()

    def test_wrong_head_rejected(self):
        with patch.object(f,'git_read',return_value=b'wrong\n'):
            with self.assertRaisesRegex(ValueError,'redirects|Exact candidate'):
                self.build()

    def test_incomplete_checkout_rejected(self):
        (self.root/'app/a.ts').unlink()
        with self.assertRaises(FileNotFoundError):
            self.build()

    def test_extra_ignored_root_rejected(self):
        (self.root/'unexpected').mkdir()
        with self.assertRaisesRegex(ValueError,'Unexpected checkout'):
            self.build()

    def test_dependency_escape_rejected(self):
        (self.root/'node_modules/escape').symlink_to('../../git')
        with self.assertRaisesRegex(ValueError,'escapes'):
            self.build()

    def test_internal_dependency_symlink_supported(self):
        (self.root/'node_modules/inner').symlink_to('.pnpm')
        self.build()

    def test_missing_cache_mountpoint_is_not_created(self):
        missing = self.root/'node_modules/.vite'
        missing.rmdir()
        with self.assertRaisesRegex(ValueError,'mountpoint'):
            self.build()
        self.assertFalse(missing.exists())

    def test_dependency_change_rejected(self):
        value = self.build()
        (self.root/'node_modules/.modules.yaml').write_bytes(b'changed installed metadata')
        with self.assertRaisesRegex(ValueError,'changed'):
            f.inputs(self.shared,{},value)

    def test_external_git_provider_rejected(self):
        path = self.root/'.git/objects/info'
        path.mkdir(parents=True)
        (path/'alternates').write_text('/outside\n')
        with self.assertRaisesRegex(ValueError,'External Git'):
            self.build()

    def test_wrong_install_binding_rejected(self):
        self.install['ignoreScripts'] = False
        self.install_path.write_text(json.dumps(self.install))
        self.ref['sha256'] = policy.sha256_file(self.install_path)
        with self.assertRaisesRegex(ValueError,'provenance'):
            self.build()

    def test_evidence_inside_checkout_rejected(self):
        inside = self.root/'evidence'; inside.mkdir()
        with self.assertRaisesRegex(ValueError,'Separate owned'):
            f.build_profile(self.shared,self.root,self.git,inside,self.ref)

    def test_changed_mounts_rejected(self):
        value = self.build()
        value['applicationMounts'].pop()
        with self.assertRaisesRegex(ValueError,'mounts differ'):
            f.inputs(self.shared,{},value)

    def test_frozen_manifest_real_pin(self):
        # Independent bytes check, without invoking the patched seam.
        value = json.loads((HERE/'portable-served-manifest.json').read_bytes())
        self.assertEqual(hashlib.sha256(f.encoded(value)).hexdigest(),f.MANIFEST_SHA)
        self.assertEqual(value['servedEntries'],2111)
        policy.verify_frozen_files(HERE,policy.FROZEN_PINS)

    def test_fresh_mounts_have_no_writable_source(self):
        profile = self.build()
        captured = []
        fake = types.SimpleNamespace(PRIVATE_LEAVES=('receipt','tmp','shm'),CACHES=f.CACHES,
                                     validate_mounts=lambda rows,*a,**kw:captured.extend(rows))
        spec = {'tools':{'readonly':['/tools']},'projection':{'path':str(self.base/'profile.json')}}
        p.mounts(fake,spec,profile,self.parent/'attempt')
        for host,target in profile['applicationMounts']:
            self.assertIn(['ro',host,target],captured)
            self.assertFalse(any(mode == 'rw' and source == host for mode,source,_ in captured))
        self.assertIn(['ro',str(self.install_path),str(self.install_path)],captured)

    def test_comparison_rejects_late_source_change(self):
        value = {'kind':'fresh-host-material-snapshot','source':{},'rootKeyExceptOutputTimestamps':[1],
                 'ancestorKeys':{},'privateOutputs':{name:[1,2,3,4,5,6,7] for name in f.PRIVATE_OUTPUTS}}
        changed = {**value,'source':{'changed':True}}
        with self.assertRaisesRegex(ValueError,'source changed'):
            a.compare_browser_sources(value,changed)
        self.assertTrue(a.compare_browser_sources(value,value)['allSourceLeavesAndReadonlyAncestorsExact'])

    def test_comparison_rejects_output_replacement(self):
        value = {'kind':'fresh-host-material-snapshot','source':{},'rootKeyExceptOutputTimestamps':[1],
                 'ancestorKeys':{},'privateOutputs':{name:[1,2,3,4,5,6,7] for name in f.PRIVATE_OUTPUTS}}
        changed = {**value,'privateOutputs':{**value['privateOutputs'],'work':[1,99,3,4,5,6,7]}}
        with self.assertRaisesRegex(ValueError,'identity'):
            a.compare_browser_sources(value,changed)

if __name__ == '__main__':
    unittest.main()
