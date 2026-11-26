"""Validation controls only; no Node package install or Vite execution."""
import copy
import importlib.util
from pathlib import Path
import tempfile
import unittest

spec = importlib.util.spec_from_file_location('diagnostic', Path(__file__).with_name('diagnose-capture1174.py'))
x = importlib.util.module_from_spec(spec)
spec.loader.exec_module(x)

class Verify(unittest.TestCase):
    def test_proc_parser_space_and_parentheses(self):
        values=['S', '101','120','120']+['0']*18
        values[19],values[21]='910','16'
        self.assertEqual(x.proc_fields("120 (node (owned)) "+' '.join(values)),(120,120,910,16*x.PAGE))
    def setUp(self):
        self.r={'before':dict(pid=120, boot='fixture', startTicks='910', namespace='pid:[1]', monotonicNs='40', captureParentVmHwmKiB=50),
                'after':dict(pid=120, boot='fixture', startTicks='910', namespace='pid:[1]', monotonicNs='50', captureParentVmHwmKiB=55),
                'result':dict(code=0, signal=None, cappedLog=False, timedOut=False)}
    def test_parent_identity_bound_to_external_process(self):
        self.assertEqual(x.validate_receipt(self.r,120,910,'fixture','pid:[1]'),55)
        for pid,ticks,boot,ns in ((121,910,'fixture','pid:[1]'),(120,911,'fixture','pid:[1]'),(120,910,'other','pid:[1]'),(120,910,'fixture','pid:[2]')):
            with self.assertRaisesRegex(ValueError,'identity'):
                x.validate_receipt(self.r,pid,ticks,boot,ns)
    def test_timing_and_memory_nonmonotonic(self):
        for k in ['monotonicNs', 'captureParentVmHwmKiB']:
            r=copy.deepcopy(self.r)
            r['after'][k] = '39' if k=='monotonicNs' else 49
            with self.assertRaisesRegex(ValueError,'VmHWM'):
                x.validate_receipt(r,120,910,'fixture','pid:[1]')
    def test_build_diagnostics_are_rejected(self):
        for k,value in {'code':1,'signal':'SIGKILL','cappedLog':True,'timedOut':True,'incompleteLog':True}.items():
            r=copy.deepcopy(self.r)
            r['result'][k]=value
            with self.assertRaisesRegex(ValueError,'cleanly'):
                x.validate_receipt(r,120,910,'fixture','pid:[1]')
    def test_manifest_fails_missing_and_symlink(self):
        with tempfile.TemporaryDirectory() as tmp:
            p=Path(tmp)
            (p/'index.html').write_text('unit control')
            with self.assertRaisesRegex(ValueError,'Missing actual'):
                x.manifest(p)
            (p/'fixture.js').write_text('unit control')
            self.assertEqual(set(x.manifest(p)),{'index.html','fixture.js'})
            (p/'extra.js').symlink_to(p/'fixture.js')
            with self.assertRaisesRegex(ValueError,'Unexpected link'):
                x.manifest(p)

if __name__=='__main__':
    unittest.main()
