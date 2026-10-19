import importlib.util,pathlib,tempfile,unittest,zipfile
from unittest.mock import patch
from types import SimpleNamespace
spec=importlib.util.spec_from_file_location('acquire',pathlib.Path(__file__).with_name('acquire-reference.py'));m=importlib.util.module_from_spec(spec);spec.loader.exec_module(m)
class Safety(unittest.TestCase):
 def check(self, entries, failure):
  with tempfile.TemporaryDirectory() as t:
   p=pathlib.Path(t);z=p/'a.zip'
   with zipfile.ZipFile(z,'w') as a:
    for name,data in entries:a.writestr(name,data)
   with patch.object(m.os,'statvfs',return_value=SimpleNamespace(f_bavail=m.START,f_frsize=1)):
    if failure:
     with self.assertRaises(ValueError):m.extract(z,p/'out')
    else:self.assertEqual(m.extract(z,p/'out'),['status.json']);self.assertEqual((p/'out/status.json').read_bytes(),b'{}')
 def test_disk_floor_reserves_pending_write(self):
  with patch.object(m.os,'statvfs',return_value=SimpleNamespace(f_bavail=m.FLOOR,f_frsize=1)):
   m.require_space('/unused')
   with self.assertRaises(OSError):m.require_space('/unused',1)
 def test_exact_allowlist(self):self.check([('run/status.json',b'{}'),('ignored/file',b'not extracted')],False)
 def test_traversal(self):self.check([('run/../bad',b'x')],True)
 def test_absolute(self):self.check([('/run/status.json',b'x')],True)
 def test_duplicate(self):self.check([('run/status.json',b'x'),('run/status.json',b'y')],True)
 def test_symlink(self):
  i=zipfile.ZipInfo('run/status.json');i.external_attr=0o120777<<16;self.check([(i,b'target')],True)
if __name__=='__main__':unittest.main()
