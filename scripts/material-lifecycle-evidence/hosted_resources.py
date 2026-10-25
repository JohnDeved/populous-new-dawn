"""Trusted setup glue using maintained ownership/resource/sealing primitives.

This is not namespace qualification and never executes candidate scripts. The
only command is the reviewed standard-install shell under the existing outer
ownership gate. Later browser ownership/namespace execution stays unchanged.
"""
from contextlib import contextmanager
import os
from pathlib import Path
import selectors
import subprocess
import time
import controller as policy

SETUP_LIMITS=dict(owner_rss_bytes=2*1024**3,v8_mib=768,producer_seconds=610,envelope_seconds=660,
    raw_bytes=64*1024**2,outer_raw_bytes=1024**2,evidence_bytes=128*1024**2,allocation_bytes=4*1024**3,
    reserve_bytes=2*1024**3,available_memory_bytes=2*1024**3,free_inodes=32768,cleanup_seconds=5,sample_seconds=.1)


def watch_type(shared):
    class SetupWatch(shared.OwnerWatch):
        def __init__(self,evidence,limits,started,roots):
            self.setup_roots=roots;self.setup_peak=0;self.minimum_available=None
            super().__init__(evidence,limits,started)
        def observe(self):
            rows=super().observe()
            allocated=shared.union_allocation(self.setup_roots,sampled=True)
            available=min(shared.host_snapshot(root)['availableBytes'] for root in self.setup_roots)
            with self.lock:
                self.setup_peak=max(self.setup_peak,allocated)
                self.minimum_available=available if self.minimum_available is None else min(available,self.minimum_available)
            policy.require(allocated<=self.limits.allocation_bytes,'Aggregate hosted setup allocation exceeded')
            policy.require(available>=self.limits.reserve_bytes,'Hosted setup disk reserve breached')
            return rows
    return SetupWatch


@contextmanager
def guard(shared,roots,evidence,*,prepare=False,acquire=False):
    policy.require(not (prepare and acquire),'One setup stage required')
    stage = {'producer_seconds':110,'envelope_seconds':120} if prepare else ({'producer_seconds':150,'envelope_seconds':180} if acquire else {})
    limits=shared.Limits(**{**SETUP_LIMITS,**stage})
    started=time.monotonic()
    policy.require(not os.path.lexists(evidence),'Fresh setup evidence required')
    for root in roots:
        policy.physical(root)
        shared.assert_capacity(shared.host_snapshot(root),limits,admission=True)
    evidence.mkdir(mode=0o700)
    details={};error=None
    with shared.envelope(limits.envelope_seconds) as deadline:
        watch=watch_type(shared)(evidence,limits,started,roots)
        try:
            watch.observe();watch.check()
            yield watch,details
            policy.require(not watch.survivors(),'Setup left owned descendants')
            watch.check()
        except BaseException as failure:
            error=type(failure).__name__+': '+str(failure)
            raise
        finally:
            cleanup=time.monotonic()
            cleanup_observation={'survivors':None,'survivorsObserved':False,'observerFinished':False,'withinDeadline':False}
            try:
                watch.cleanup()
                cleanup_observation['survivors']=watch.survivors()
                cleanup_observation['survivorsObserved']=True
                policy.require(not cleanup_observation['survivors'],'Setup cleanup survivors')
            except BaseException as failure:
                cleanup_observation['error']=type(failure).__name__+': '+str(failure)
                error=(error or '')+'; cleanup: '+str(failure)
            try:
                shared.finish_observer(watch)
                cleanup_observation['observerFinished']=True
                cleanup_observation['withinDeadline']=time.monotonic()-cleanup<=limits.cleanup_seconds
                policy.require(time.monotonic()-cleanup<=limits.cleanup_seconds,'Setup cleanup deadline exceeded')
                policy.require(watch.report()['sampleCount']>0,'No setup resource observations')
            except BaseException as failure:
                cleanup_observation['observerError']=type(failure).__name__+': '+str(failure)
                error=(error or '')+'; joined observer: '+str(failure)
            terminal={'kind':'material-hosted-setup','cleanupObservation':cleanup_observation,'error':error,'details':details,'resources':watch.report(),
                'rootPaths':list(map(str,roots)),'peakUnionAllocatedBytes':watch.setup_peak,
                'minimumAvailableBytes':watch.minimum_available,'cleanupSeconds':time.monotonic()-cleanup,
                'scope':'Trusted host setup only; not namespace qualification or browser proof'}
            try:shared.seal_receipt(evidence,terminal,limits,deadline)
            except BaseException as failure:
                error=(error or '')+'; seal: '+str(failure)
                try:shared.save_new(evidence/'seal-failed.json',{'status':'failed-or-unknown','error':error})
                except BaseException:pass
            policy.require(error is None,error or 'Setup failed')


def install(shared,watch,evidence,command,cwd,env,*,receipt=None):
    """Existing outer gate + pidfds; tiny bounded pipe transport, no new ownership model."""
    receipt={} if receipt is None else receipt
    receipt.update(command=command,exitCode=None,waitCompleted=False,waitExitCode=None)
    outer=[str(Path(os.sys.executable).resolve()),'-I','-B',str(shared.__file__),'_outer','610',*command]
    process=subprocess.Popen(outer,cwd=cwd,env=env,stdin=subprocess.PIPE,stdout=subprocess.PIPE,
                             stderr=subprocess.PIPE,bufsize=0,start_new_session=True,close_fds=True)
    stored=observed=0;started=time.monotonic();exit_at=None
    streams={}
    try:
        watch.pin_direct(process)
        watch.observe();watch.check()
        process.stdin.write(b'G');process.stdin.close()
        with selectors.DefaultSelector() as selector:
            for name in ('stdout','stderr'):
                streams[name]=(evidence/('transport.'+name)).open('xb')
                pipe=getattr(process,name);os.set_blocking(pipe.fileno(),False)
                selector.register(pipe,selectors.EVENT_READ,name)
            while selector.get_map() or process.poll() is None:
                watch.check()
                now=time.monotonic()
                policy.require(now-started<610,'Standard setup command deadline exceeded')
                if process.poll() is not None:
                    if exit_at is None:exit_at=now
                    policy.require(not selector.get_map() or now-exit_at<1,'Setup pipes outlived direct child')
                for key,_ in selector.select(.03):
                    data=os.read(key.fd,65536)
                    if not data:selector.unregister(key.fileobj);key.fileobj.close();continue
                    observed+=len(data)
                    stored,complete=shared.write_bounded_raw(streams[key.data],data,stored,1024**2)
                    policy.require(complete,'Setup outer raw cap exceeded')
        policy.require(process.returncode==0,'Standard setup command failed')
        return receipt
    finally:
        # The shared pidfd owner retains and cleans descendants even if this
        # direct process exits. No process-name scanning or process-group substitute.
        try:
            if process.poll() is None:watch.cleanup()
            receipt['waitExitCode']=process.wait(timeout=5)
            receipt['waitCompleted']=True
        except BaseException as failure:
            receipt['waitError']=type(failure).__name__+': '+str(failure)
            raise
        finally:
            receipt.update(exitCode=process.returncode,wallSeconds=time.monotonic()-started,
                observedRawBytes=observed,storedRawBytes=stored,directPid=process.pid)
            for stream in streams.values():stream.close()
            for pipe in (process.stdin,process.stdout,process.stderr):
                if not pipe.closed:pipe.close()
