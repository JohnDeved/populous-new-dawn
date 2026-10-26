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
sys.path.insert(0,str(Path(__file__).resolve().parents[1]/'scripts/orchestration'))
import shared_execution as actual_shared

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
        self.events=[];self.terminals=[];self.cleanup_error=False;self.join_error=False;self.seal_error=False;self.samples=1;self.live=[];self.now=0;self.exit_after=None;self.cleanup_records=[]
        parent=self
        class Watch:
            setup_peak=123;minimum_available=999
            def __init__(self,*a):
                parent.events.append('watch');self.limits=a[1];self.lock=threading.RLock();self.setup_cleanup_context=None
            def observe(self):parent.events.append('observe')
            def check(self):parent.events.append('check')
            def cleanup(self):
                parent.events.append('cleanup');r.cleanup_context(self)
                if parent.cleanup_error:raise ValueError('cleanup unknown')
            def survivors(self):return [] if parent.exit_after is not None and parent.now>=parent.exit_after else parent.live
            def report(self):return {'sampleCount':parent.samples,'history':[]}
        self.Watch=Watch
        def finish(watch,*,cleanup_deadline=None,receipt=None):
            self.events.append('joined')
            receipt.update(joined=True,healthy=not self.join_error,withinDeadline=self.now<=cleanup_deadline)
            if self.join_error:raise ValueError('late unexpected observer failure')
        def seal(path,value,*args):
            self.terminals.append(value)
            if self.seal_error:raise ValueError('seal failure')
        self.shared=types.SimpleNamespace(Limits=lambda **k:types.SimpleNamespace(**k),
            assert_capacity=lambda *a,**k:self.events.append('capacity'),host_snapshot=lambda p:{},
            envelope=lambda seconds:nullcontext(time.monotonic()+seconds),finish_observer=finish,
            seal_receipt=seal,save_new=lambda *a:self.events.append('seal-failed'),
            await_owned_cleanup=actual_shared.await_owned_cleanup)
    def run_guard(self,**kwargs):
        with patch.object(r,'watch_type',return_value=self.Watch), \
             patch.object(r.time,'monotonic',side_effect=lambda:self.now), \
             patch.object(r.time,'sleep',side_effect=lambda seconds:setattr(self,'now',self.now+seconds)), \
             patch.object(actual_shared,'save_new',side_effect=lambda path,value:self.cleanup_records.append(value)):
            with r.guard(self.shared,[self.root],self.root/'evidence',**kwargs) as (_,details):details['actual']='result'
    def test_success_measured_and_sealed_after_join(self):
        self.run_guard();self.assertIn('joined',self.events);self.assertIsNone(self.terminals[0]['error'])
        self.assertEqual(self.terminals[0]['cleanupObservation'],{'survivors':[],'survivorsObserved':True,'observerFinished':True,'observerJoined':True,
             'observerHealthy':True,'withinDeadline':True,'lastObservationError':None,
             'finishObservation':{'joined':True,'healthy':True,'withinDeadline':True},
             'budgetStartedMonotonic':0,'budgetDeadlineMonotonic':5,'elapsedSinceCleanupStart':0});
        self.assertEqual(self.terminals[0]['details'],{'actual':'result'});self.assertEqual(self.terminals[0]['peakUnionAllocatedBytes'],123)
    def test_cleanup_fault_still_joins_and_rejects(self):
        self.cleanup_error=True
        with self.assertRaises(ValueError):self.run_guard()
        self.assertIn('joined',self.events);self.assertIn('cleanup unknown',str(self.terminals[0]['cleanupObservation']['lastObservationError']));self.assertFalse(self.terminals[0]['cleanupObservation']['survivorsObserved'])
    def test_late_observer_failure_rejects(self):
        self.join_error=True
        with self.assertRaises(ValueError):self.run_guard()
        self.assertIn('late unexpected',self.terminals[0]['error']);self.assertFalse(self.terminals[0]['cleanupObservation']['observerFinished'])
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

    def test_async_d_state_termination_uses_same_finite_cleanup_budget(self):
        self.live=[{'pid':91,'startTicks':123,'state':'D'}];self.exit_after=.09
        # Success body would reject its first live observation; retain that failure
        # while final cleanup still waits for observed asynchronous termination.
        with self.assertRaises(ValueError):self.run_guard()
        self.assertGreaterEqual(self.now,.09);self.assertLessEqual(self.now,5)
        self.assertGreater(self.events.count('cleanup'),1)
        self.assertEqual(self.cleanup_records[-1]['status'],'observed-zero-live-survivors')
        self.assertEqual(self.terminals[0]['cleanupObservation']['survivors'],[])
        self.assertIn('Setup left owned descendants',self.terminals[0]['error'])

    def test_health_failure_does_not_abort_cleanup_or_erase_failure(self):
        self.live=[{'pid':91,'state':'D'}];self.exit_after=.09;self.join_error=True
        with self.assertRaises(ValueError):self.run_guard()
        facts=self.terminals[0]['cleanupObservation']
        self.assertEqual(facts['survivors'],[]);self.assertTrue(facts['observerJoined'])
        self.assertFalse(facts['observerHealthy']);self.assertFalse(facts['observerFinished'])
        self.assertTrue(facts['withinDeadline']);self.assertIn('late unexpected observer failure',self.terminals[0]['error'])

    def test_persistent_survivor_preserves_failure_and_shared_deadline(self):
        self.live=[{'pid':91,'state':'D'}]
        with self.assertRaises(ValueError):self.run_guard()
        self.assertEqual(self.now,5)
        self.assertEqual(self.cleanup_records[-1]['deadlineMonotonic'],5)
        self.assertEqual(self.terminals[0]['cleanupObservation']['survivors'],self.live)
        self.assertIn('joined',self.events)

    def test_existing_cleanup_budget_is_never_renewed(self):
        watch=types.SimpleNamespace(lock=threading.RLock(),limits=types.SimpleNamespace(cleanup_seconds=5),setup_cleanup_context=None)
        with patch.object(r.time,'monotonic',return_value=10):first=r.cleanup_context(watch)
        with patch.object(r.time,'monotonic',return_value=14):second=r.cleanup_context(watch)
        self.assertIs(first,second);self.assertEqual(second,{'started':10,'deadline':15})

class ProducerReceiptTests(unittest.TestCase):
    def test_nonzero_producer_preserves_actual_wait_before_raise(self):
        import io
        class Pipe(io.BytesIO):
            def fileno(self):return 99
        class Selector:
            def __enter__(self):return self
            def __exit__(self,*args):pass
            def register(self,*args):pass
            def get_map(self):return {}
        for wait_error in (False,True):
            with self.subTest(wait_error=wait_error),tempfile.TemporaryDirectory() as tmp:
                receipt={}
                def wait(**kw):
                    if wait_error:raise TimeoutError('wait unknown')
                    return 7
                process=types.SimpleNamespace(pid=123,returncode=7,poll=lambda:7,wait=wait,
                    stdin=Pipe(),stdout=Pipe(),stderr=Pipe())
                watch=types.SimpleNamespace(pin_direct=lambda p:None,observe=lambda:None,check=lambda:None)
                shared=types.SimpleNamespace(__file__='/reviewed/helper.py')
                with patch.object(r.subprocess,'Popen',return_value=process),patch.object(r.selectors,'DefaultSelector',Selector),patch.object(r.os,'set_blocking'):
                    with self.assertRaises((ValueError,TimeoutError)):
                        r.install(shared,watch,Path(tmp),['/command'],tmp,{},receipt=receipt)
                self.assertEqual(receipt['exitCode'],7)
                self.assertEqual(receipt['waitCompleted'],not wait_error)
                self.assertEqual(receipt['waitExitCode'],None if wait_error else 7)
                self.assertEqual(receipt['directPid'],123)

if __name__=='__main__':unittest.main()
