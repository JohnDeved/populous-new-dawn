from contextlib import nullcontext
from pathlib import Path
import sys
import tempfile
import threading
import time
import types
import unittest
from unittest.mock import patch
sys.dont_write_bytecode=True
sys.path.insert(0,str(Path(__file__).resolve().parents[1]/'scripts/material-lifecycle-evidence'))
import hosted_resources as r

class MeasurementTests(unittest.TestCase):
    def make(self,allocated=10,available=100):
        class Base:
            def __init__(self,evidence,limits,started):self.lock=threading.RLock();self.limits=limits
            def observe(self):return [{'pid':1}]
        calls=[]
        shared=types.SimpleNamespace(OwnerWatch=Base,
            union_allocation=lambda roots,**kw:(calls.append((roots,kw)) or allocated),
            host_snapshot=lambda path:{'availableBytes':available})
        limits=types.SimpleNamespace(allocation_bytes=50,reserve_bytes=20)
        watch=r.watch_type(shared)(Path('/evidence'),limits,0,[Path('/candidate'),Path('/tools'),Path('/evidence')])
        return watch,calls
    def test_union_allocation_covers_all_roots_and_reports_peak(self):
        watch,calls=self.make();self.assertEqual(watch.observe(),[{'pid':1}])
        self.assertEqual(calls[0][0],[Path('/candidate'),Path('/tools'),Path('/evidence')])
        self.assertTrue(calls[0][1]['sampled']);self.assertEqual(watch.setup_peak,10);self.assertEqual(watch.minimum_available,100)
    def test_aggregate_allocation_excess_rejected(self):
        watch,_=self.make(allocated=51)
        with self.assertRaisesRegex(ValueError,'allocation'):watch.observe()
    def test_disk_reserve_breach_rejected(self):
        watch,_=self.make(available=19)
        with self.assertRaisesRegex(ValueError,'reserve'):watch.observe()

class GuardTests(unittest.TestCase):
    def setUp(self):
        self.tmp=tempfile.TemporaryDirectory();self.addCleanup(self.tmp.cleanup);self.root=Path(self.tmp.name)
        self.events=[];self.terminals=[];self.cleanup_error=False;self.join_error=False;self.seal_error=False;self.samples=1;self.live=[]
        parent=self
        class Watch:
            setup_peak=123;minimum_available=999
            def __init__(self,*a):parent.events.append('watch')
            def observe(self):parent.events.append('observe')
            def check(self):parent.events.append('check')
            def cleanup(self):
                parent.events.append('cleanup')
                if parent.cleanup_error:raise ValueError('cleanup unknown')
            def survivors(self):return parent.live
            def report(self):return {'sampleCount':parent.samples,'history':[]}
        self.Watch=Watch
        def finish(watch):
            self.events.append('joined')
            if self.join_error:raise ValueError('late unexpected observer failure')
        def seal(path,value,*args):
            self.terminals.append(value)
            if self.seal_error:raise ValueError('seal failure')
        self.shared=types.SimpleNamespace(Limits=lambda **k:types.SimpleNamespace(**k),
            assert_capacity=lambda *a,**k:self.events.append('capacity'),host_snapshot=lambda p:{},
            envelope=lambda seconds:nullcontext(time.monotonic()+seconds),finish_observer=finish,
            seal_receipt=seal,save_new=lambda *a:self.events.append('seal-failed'))
    def run_guard(self,**kwargs):
        with patch.object(r,'watch_type',return_value=self.Watch):
            with r.guard(self.shared,[self.root],self.root/'evidence',**kwargs) as (_,details):details['actual']='result'
    def test_success_measured_and_sealed_after_join(self):
        self.run_guard();self.assertIn('joined',self.events);self.assertIsNone(self.terminals[0]['error'])
        self.assertEqual(self.terminals[0]['details'],{'actual':'result'});self.assertEqual(self.terminals[0]['peakUnionAllocatedBytes'],123)
    def test_cleanup_fault_still_joins_and_rejects(self):
        self.cleanup_error=True
        with self.assertRaises(ValueError):self.run_guard()
        self.assertIn('joined',self.events);self.assertIn('cleanup unknown',self.terminals[0]['error'])
    def test_late_observer_failure_rejects(self):
        self.join_error=True
        with self.assertRaises(ValueError):self.run_guard()
        self.assertIn('late unexpected',self.terminals[0]['error'])
    def test_survivors_reject(self):
        self.live=[123]
        with self.assertRaises(ValueError):self.run_guard()
        self.assertIn('joined',self.events);self.assertIsNotNone(self.terminals[0]['error'])
    def test_no_observation_rejects(self):
        self.samples=0
        with self.assertRaises(ValueError):self.run_guard()
    def test_seal_failure_no_success(self):
        self.seal_error=True
        with self.assertRaises(ValueError):self.run_guard()
        self.assertIn('seal-failed',self.events)
    def test_fresh_destination_only(self):
        (self.root/'evidence').mkdir()
        with self.assertRaises(ValueError):self.run_guard()
        self.assertNotIn('watch',self.events)
    def test_prepare_keeps_original_120_second_envelope(self):
        calls=[]
        self.shared.Limits=lambda **k:(calls.append(k) or types.SimpleNamespace(**k))
        self.run_guard(prepare=True);self.assertEqual(calls[0]['envelope_seconds'],120)
        self.assertEqual(calls[0]['owner_rss_bytes'],2*1024**3);self.assertEqual(calls[0]['allocation_bytes'],4*1024**3)
    def test_acquire_bounded_180_seconds(self):
        calls=[]
        self.shared.Limits=lambda **k:(calls.append(k) or types.SimpleNamespace(**k))
        self.run_guard(acquire=True);self.assertEqual(calls[0]['envelope_seconds'],180)

if __name__=='__main__':unittest.main()
