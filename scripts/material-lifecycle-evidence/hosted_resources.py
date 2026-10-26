"""Trusted setup glue using maintained ownership/resource/sealing primitives.

This is not namespace qualification and never executes candidate scripts. The
only command is the reviewed standard-install shell under the existing outer
ownership gate. Later browser ownership/namespace execution stays unchanged.
"""
from contextlib import contextmanager
import os
from pathlib import Path
import selectors
import select
import subprocess
import time
import controller as policy

SETUP_LIMITS=dict(owner_rss_bytes=2*1024**3,v8_mib=768,producer_seconds=610,envelope_seconds=660,
    raw_bytes=64*1024**2,outer_raw_bytes=1024**2,evidence_bytes=128*1024**2,allocation_bytes=4*1024**3,
    reserve_bytes=2*1024**3,available_memory_bytes=2*1024**3,free_inodes=32768,cleanup_seconds=5,sample_seconds=.1)


def owned_tasks(watch, rows):
    total=0
    for row in rows:
        try:
            with (Path('/proc')/str(row['pid'])/'stat').open() as stream: value=stream.read(8193)
            policy.require(len(value)<=8192,'Owned task observation cap')
            fields=value.rsplit(')',1)[1].split()
            policy.require(int(fields[19])==row['startTicks'],'Owned task PID reused')
            count=int(fields[17]);policy.require(count>0,'Invalid owned thread count')
            total+=count
        except (FileNotFoundError,ProcessLookupError):
            fd=watch.pidfds.get((row['pid'],row['startTicks']))
            policy.require(fd is not None and select.select([fd],[],[],0)[0],
                           'Owned task vanished without retained exit proof')
    return total


def cleanup_context(watch):
    with watch.lock:
        context=getattr(watch,'setup_cleanup_context',None)
        if context is None:
            started=time.monotonic()
            context=watch.setup_cleanup_context={'started':started,'deadline':started+watch.limits.cleanup_seconds}
        return context


def watch_type(shared, *, max_tasks=None):
    class SetupWatch(shared.OwnerWatch):
        def __init__(self,evidence,limits,started,roots):
            self.setup_roots=roots;self.setup_peak=0;self.minimum_available=None;self.peak_tasks=0
            self.setup_cleanup_context=None
            super().__init__(evidence,limits,started)
        def cleanup(self):
            cleanup_context(self)  # Earliest cleanup request starts the one shared cleanup budget.
            return super().cleanup()
        def observe(self):
            rows=super().observe()
            if max_tasks is not None:
                tasks=owned_tasks(self,rows)
                self.peak_tasks=max(self.peak_tasks,tasks)
                policy.require(tasks<=max_tasks,'Prerequisite owned-task cap exceeded')
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
def guard(shared,roots,evidence,*,prepare=False,acquire=False,prerequisite=False):
    policy.require(sum(map(bool,(prepare,acquire,prerequisite)))<=1,'One setup stage required')
    stage = {'producer_seconds':110,'envelope_seconds':120} if prepare else ({'producer_seconds':150,'envelope_seconds':180} if acquire else {})
    if prerequisite: stage=dict(owner_rss_bytes=512*1024**2,producer_seconds=180,envelope_seconds=210,
        raw_bytes=2*1024**2,evidence_bytes=16*1024**2,allocation_bytes=256*1024**2)
    limits=shared.Limits(**{**SETUP_LIMITS,**stage})
    started=time.monotonic()
    policy.require(not os.path.lexists(evidence),'Fresh setup evidence required')
    for root in roots:
        policy.physical(root)
        shared.assert_capacity(shared.host_snapshot(root),limits,admission=True)
    evidence.mkdir(mode=0o700)
    details={};error=None
    with shared.envelope(limits.envelope_seconds) as deadline:
        watch=watch_type(shared,max_tasks=16 if prerequisite else None)(evidence,limits,started,roots)
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
            context=cleanup_context(watch)
            cleanup_observation={'survivors':None,'survivorsObserved':False,'observerFinished':False,
                                 'observerJoined':None,'observerHealthy':None,'withinDeadline':None}
            try:
                # Stored observer health failure does not cancel owned termination attempts.
                # Reuse the maintained finite loop, never a new cleanup deadline.
                shared.await_owned_cleanup(watch,limits,evidence,context,phase='setup-final')
            except BaseException as failure:
                cleanup_observation['error']=type(failure).__name__+': '+str(failure)
                error=(error or '')+'; cleanup: '+str(failure)
            last=context.get('lastObservation')
            if last is not None:
                cleanup_observation['survivors']=last['after']
                cleanup_observation['survivorsObserved']=last['after'] is not None
                cleanup_observation['lastObservationError']=last['afterError']
            joined={}
            try:
                shared.finish_observer(watch,cleanup_deadline=context['deadline'],receipt=joined)
                cleanup_observation['observerFinished']=True
                policy.require(watch.report()['sampleCount']>0,'No setup resource observations')
            except BaseException as failure:
                cleanup_observation['observerError']=type(failure).__name__+': '+str(failure)
                error=(error or '')+'; joined observer: '+str(failure)
            finally:
                cleanup_observation['observerJoined']=joined.get('joined')
                cleanup_observation['observerHealthy']=joined.get('healthy')
                cleanup_observation['withinDeadline']=time.monotonic()<=context['deadline']
                cleanup_observation['finishObservation']=joined
                cleanup_observation['budgetStartedMonotonic']=context['started']
                cleanup_observation['budgetDeadlineMonotonic']=context['deadline']
                cleanup_observation['elapsedSinceCleanupStart']=time.monotonic()-context['started']
                if not cleanup_observation['withinDeadline']:
                    error=(error or '')+'; cleanup deadline exceeded'
            terminal={'kind':'material-hosted-setup','cleanupObservation':cleanup_observation,'error':error,'details':details,'resources':watch.report(),
                'peakOwnedTasks':getattr(watch,'peak_tasks',None),'rootPaths':list(map(str,roots)),'peakUnionAllocatedBytes':watch.setup_peak,
                'minimumAvailableBytes':watch.minimum_available,'cleanupSeconds':time.monotonic()-cleanup,
                'scope':'Trusted host setup only; not namespace qualification or browser proof'}
            try:shared.seal_receipt(evidence,terminal,limits,deadline)
            except BaseException as failure:
                error=(error or '')+'; seal: '+str(failure)
                try:shared.save_new(evidence/'seal-failed.json',{'status':'failed-or-unknown','error':error})
                except BaseException:pass
            policy.require(error is None,error or 'Setup failed')


def install(shared,watch,evidence,command,cwd,env,*,receipt=None,seconds=610):
    """Existing outer gate + pidfds; tiny bounded pipe transport, no new ownership model."""
    receipt={} if receipt is None else receipt
    receipt.update(command=command,exitCode=None,waitCompleted=False,waitExitCode=None)
    outer=[str(Path(os.sys.executable).resolve()),'-I','-B',str(shared.__file__),'_outer',str(seconds),*command]
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
                policy.require(now-started<seconds,'Standard setup command deadline exceeded')
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
            context=getattr(watch,'setup_cleanup_context',None)
            timeout=5 if context is None else max(0,context['deadline']-time.monotonic())
            receipt['waitExitCode']=process.wait(timeout=timeout)
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
