import json,os,resource,sys,tempfile,time,unittest
from pathlib import Path
from unittest.mock import patch
import subprocess

def no_process(*args,**kwargs):raise AssertionError('Helper tests must not launch child processes')
for name in ('Popen','run','call','check_call','check_output'):
    setattr(subprocess,name,no_process)
for name in ('system','fork','forkpty','posix_spawn','posix_spawnp','spawnl','spawnle','spawnlp','spawnlpe','spawnv','spawnve','spawnvp','spawnvpe','execl','execle','execlp','execlpe','execv','execve','execvp','execvpe'):
    if hasattr(os,name):setattr(os,name,no_process)
BASE=Path(__file__).resolve().parent.parent;sys.path.insert(0,str(BASE/'scripts/orchestration'));import shared_allocation as m
class AllocationTraversalTests(unittest.TestCase):
 def setUp(self):
  self.tmp=tempfile.TemporaryDirectory(prefix='fd-walk-fixture-');self.base=Path(self.tmp.name);self.root=self.base/'owned';self.root.mkdir();self.b=m.IncrementalBudget(str(self.root),16*1024**2,1024**2)
  self.b.admit(65536);(self.root/'d').mkdir();self.b.account([str(self.root/'d'),str(self.root)])
  self.b.admit(65536);(self.root/'d/file').write_bytes(b'x'*4096);self.b.account([str(self.root/'d/file'),str(self.root/'d')])
 def tearDown(self):self.tmp.cleanup()
 def test_inventory_equivalence(self):
  expected={}
  for parent,dirs,files in os.walk(self.root,followlinks=False):
   for p in [Path(parent),*[Path(parent)/n for n in dirs+files]]:expected[str(p)]=m.key(p.lstat())
  self.assertEqual(self.b._walk_rows(),expected);self.assertEqual(self.b.reconcile(),self.b.total)
 def test_hardlink_unique_inode_dedup(self):
  self.b.admit(65536);os.link(self.root/'d/file',self.root/'d/alias');self.b.account([str(self.root/'d/alias'),str(self.root/'d')]);rows=self.b._walk_rows();self.assertEqual(len(rows),4);unique={(r['device'],r['inode']):r['blocks']for r in rows.values()};self.assertEqual(self.b.reconcile(),sum(unique.values()))
 def test_symlink_never_traversed(self):
  outside=self.base/'outside';outside.mkdir();(outside/'secret').write_bytes(b'not in inventory');self.b.admit(65536);os.symlink(outside,self.root/'link');self.b.account([str(self.root/'link'),str(self.root)]);rows=self.b._walk_rows();self.assertIn(str(self.root/'link'),rows);self.assertNotIn(str(self.root/'link/secret'),rows);self.b.reconcile()
 def test_replaced_directory_before_open(self):
  real=os.open;fired=[False]
  def opening(path,*args,**kw):
   if path=='d'and kw.get('dir_fd')is not None and not fired[0]:
    fired[0]=True;(self.root/'d').rename(self.base/'retained');(self.root/'d').mkdir()
   return real(path,*args,**kw)
  with patch.object(m.os,'open',opening),self.assertRaises(Exception):self.b.reconcile()
  self.assertTrue(fired[0])
 def test_symlink_inserted_before_open(self):
  real=os.open;fired=[False]
  def opening(path,*args,**kw):
   if path=='d'and kw.get('dir_fd')is not None and not fired[0]:
    fired[0]=True;(self.root/'d').rename(self.base/'retained');(self.root/'d').symlink_to(self.base/'retained',target_is_directory=True)
   return real(path,*args,**kw)
  with patch.object(m.os,'open',opening),self.assertRaises(Exception):self.b.reconcile()
  self.assertTrue(fired[0])
 def test_held_child_parent_name_replaced(self):
  real=os.listdir;inode=(self.root/'d').stat().st_ino;fired=[False]
  def listing(fd):
   if isinstance(fd,int)and os.fstat(fd).st_ino==inode and not fired[0]:
    fired[0]=True;(self.root/'d').rename(self.base/'retained');(self.root/'d').mkdir()
   return real(fd)
  with patch.object(m.os,'listdir',listing),self.assertRaises(Exception):self.b.reconcile()
  self.assertTrue(fired[0])
 def test_root_parent_rename_rejected(self):
  real=os.listdir;inode=self.root.stat().st_ino;fired=[False]
  def listing(fd):
   if isinstance(fd,int)and os.fstat(fd).st_ino==inode and not fired[0]:
    fired[0]=True;self.root.rename(self.base/'retained-root');self.root.mkdir()
   return real(fd)
  with patch.object(m.os,'listdir',listing),self.assertRaises(Exception):self.b.reconcile()
 def test_unreported_changed_blocks(self):
  with (self.root/'d/file').open('ab')as f:f.write(b'y'*65536)
  with self.assertRaisesRegex(ValueError,'allocation growth'):self.b.reconcile()
 def test_directory_visited_once(self):
  real=os.listdir;calls=[]
  def listing(fd):calls.append(os.fstat(fd).st_ino);return real(fd)
  with patch.object(m.os,'listdir',listing):self.b.reconcile()
  self.assertEqual(len(calls),2);self.assertEqual(len(set(calls)),2)
 def test_unknown_inserted_entry(self):
  real=os.listdir;fired=[False]
  def listing(fd):
   values=real(fd)
   if not fired[0]:fired[0]=True;(self.root/'unknown').touch()
   return values
  with patch.object(m.os,'listdir',listing),self.assertRaises(Exception):self.b.reconcile()

import base64,hashlib
import shared_payloads as payloads
from shared_shim import rebase_shim

def sha(body):return hashlib.sha256(body).hexdigest()
def row(body):return dict(bytes=len(body),sha256=sha(body),mode=0o600,blobSha=hashlib.sha1(f'blob {len(body)}\0'.encode()+body).hexdigest())
class PayloadTests(unittest.TestCase):
 def setUp(self):
  self.tmp=tempfile.TemporaryDirectory(prefix='payload-fixture-');self.path=Path(self.tmp.name)/'payload';self.body=b'held bytes'*10000;self.path.write_bytes(self.body);self.path.chmod(0o600);self.row=row(self.body)
 def tearDown(self):self.tmp.cleanup()
 def test_streaming_identity_and_hash(self):
  before=self.path.stat();anchor=dict(key=payloads.key(before),sha256=sha(self.body));sizes=[];real=os.read
  def read(fd,n):sizes.append(n);return real(fd,n)
  with patch.object(payloads.os,'read',read):ident=payloads.verify_file(str(self.path),self.row,lambda:None,anchor,target=True)
  self.assertTrue(sizes);self.assertLessEqual(max(sizes),65536);self.assertEqual(ident,payloads.identity(before));self.assertEqual(payloads.key(self.path.stat()),payloads.key(before))
 def test_wrong_sha(self):
  with self.assertRaises(ValueError):payloads.verify_file(str(self.path),{**self.row,'sha256':'0'*64},lambda:None)
 def test_wrong_git_oid(self):
  with self.assertRaises(ValueError):payloads.verify_file(str(self.path),{**self.row,'blobSha':'0'*40},lambda:None)
 def test_wrong_mode(self):
  with self.assertRaises(ValueError):payloads.verify_file(str(self.path),{**self.row,'mode':0o755},lambda:None,target=True)
 def test_partial_file(self):
  self.path.write_bytes(self.body[:-1])
  with self.assertRaises(ValueError):payloads.verify_file(str(self.path),self.row,lambda:None)
 def test_source_identity_replaced(self):
  anchor=dict(key=payloads.key(self.path.stat()),sha256=sha(self.body));self.path.rename(self.path.with_name('retained'));self.path.write_bytes(self.body)
  with self.assertRaises(ValueError):payloads.verify_file(str(self.path),self.row,lambda:None,anchor)
 def test_symlink_source(self):
  link=self.path.with_name('link');link.symlink_to(self.path)
  with self.assertRaises(OSError):payloads.verify_file(str(link),self.row,lambda:None)
 def test_parent_symlink(self):
  link=Path(self.tmp.name)/'redirect';link.symlink_to(self.path.parent,target_is_directory=True)
  with self.assertRaises(OSError):payloads.verify_file(str(link/'payload'),self.row,lambda:None)
 def test_callback_interruption(self):
  def stop():raise ValueError('interrupted')
  with self.assertRaisesRegex(ValueError,'interrupted'):payloads.verify_file(str(self.path),self.row,stop)
 def test_inline_parity(self):
  self.assertEqual(payloads.verify_inline({**self.row,'inlineBase64':base64.b64encode(self.body).decode()}),self.body)
 def test_inline_ambiguity(self):
  with self.assertRaises(ValueError):payloads.verify_inline({**self.row,'inlineBase64':base64.b64encode(self.body).decode(),'source':str(self.path)})
 def test_exact_shim_proof(self):
  body=b'#!/bin/sh\n/old/node /old/tool\n';result=body.replace(b'/old',b'/new');spec=dict(relative_path='.bin/tool',old_prefix=b'/old',new_prefix=b'/new',expected_offsets=[10,20],source_sha256=sha(body),result_sha256=sha(result))
  inline={**row(result),'inlineBase64':base64.b64encode(result).decode()};self.assertEqual(payloads.verify_inline(inline,shim_source=body,shim_spec=spec),result)
  with self.assertRaises(ValueError):payloads.verify_inline(inline,shim_source=body,shim_spec={**spec,'expected_offsets':[10]})
class AllocationBoundaryTests(unittest.TestCase):
 def test_reserve_exact_boundary(self):
  with tempfile.TemporaryDirectory()as d:
   initial=Path(d).stat().st_blocks*512;b=m.IncrementalBudget(d,initial+8192+4096,4096);b.admit(8192)
   with self.assertRaises(ValueError):b.admit(8193)
 def test_first_write_capacity_refusal(self):
  with tempfile.TemporaryDirectory()as d:
   fail=[False]
   def capacity():
    if fail[0]:raise ValueError('memory floor')
   b=m.IncrementalBudget(d,1024**2,4096,capacity_check=capacity);fail[0]=True
   with self.assertRaises(ValueError):b.admit(8192)
   self.assertEqual(os.listdir(d),[])
 def test_exact_borrowed_path_binding(self):
  with tempfile.TemporaryDirectory()as d:
   base=Path(d);source=base/'source';source.write_bytes(b'held');root=base/'owned';root.mkdir();st=source.stat();inode=(st.st_dev,st.st_ino);b=m.IncrementalBudget(str(root),1024**2,4096,borrowed_inodes={inode:m.key(st)},borrowed_paths={str(root/'declared'):inode});b.admit(65536);os.link(source,root/'extra')
   with self.assertRaises(ValueError):b.account([str(root/'extra'),str(root)])
 def test_parent_reserve_is_admission_not_cap(self):
  self.assertEqual(m.PARENT_GROWTH_RESERVE_BYTES,65536)
  with tempfile.TemporaryDirectory()as d:
   b=m.IncrementalBudget(d,32768,4096)
   with self.assertRaises(ValueError):b.admit(m.PARENT_GROWTH_RESERVE_BYTES)

if __name__=='__main__':unittest.main(verbosity=2)
