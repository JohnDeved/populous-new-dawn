"""Private read-only sampler prototype. Never launches or signals a process."""
from collections import Counter, deque
from pathlib import Path
import re, time

LATE_PROFILE = (30, 500)
MAX_SLOTS = 60
MAX_READ_NS = 250_000_000

class Unavailable(Exception):
    pass

def stat_id(s):
    pid,sep=s.partition(' ')[::2]
    close=sep.rfind(')')
    if close < 1: raise Unavailable('stat-malformed')
    tail=sep[close+1:].split()
    # Zero-indexed tail: state=kernel field 3, PPid=4, starttime=22.
    if len(tail)<20 or not (pid.isdecimal() and tail[1].isdecimal() and tail[19].isdecimal()):
        raise Unavailable('stat-malformed')
    return (int(pid),int(tail[19]),int(tail[1]))

def memory(s, fields):
    matches={k:re.findall(r'^'+k+r':[ \t]+([0-9]+) kB[ \t]*$',s,re.M) for k in fields}
    if any(len(v)!=1 for v in matches.values()): raise Unavailable('metric-missing')
    return tuple(int(matches[k][0]) for k in fields)

def read(path,limit,gate):
    gate()
    try:
        with path.open('r',encoding='ascii',errors='replace') as f:
            text=f.read(limit+1)
    except PermissionError: raise Unavailable('permission') from None
    except ProcessLookupError: raise Unavailable('gone') from None
    except FileNotFoundError: raise Unavailable('absent-or-gone') from None
    except OSError: raise Unavailable('read-unavailable') from None
    if len(text)>limit: raise Unavailable('read-bound')
    return text

def listed(path,limit,gate):
    gate()
    try:
        found=[]
        for entry in path.iterdir():
            if len(found)>=limit: raise Unavailable('thread-bound')
            if not entry.name.isdecimal(): raise Unavailable('thread-entry')
            found.append(entry)
        return sorted(found)
    except PermissionError: raise Unavailable('permission') from None
    except (ProcessLookupError,FileNotFoundError): raise Unavailable('gone') from None
    except OSError: raise Unavailable('read-unavailable') from None

def census(proc,pid,started,gate,process_max=32,thread_max=256):
    found={}; queue=deque([(pid,None)]); threads=0
    while queue:
        n,parent=queue.popleft()
        if n in found: raise Unavailable('double-membership')
        if len(found)>=process_max: raise Unavailable('process-bound')
        r=proc/str(n); identity=stat_id(read(r/'stat',8192,gate))
        if identity[0]!=n or (n==pid and identity[1]!=started) or (parent is not None and identity[2]!=parent):
            raise Unavailable('identity-or-parent-changed')
        found[n]=identity
        tasks=listed(r/'task',thread_max-threads,gate);threads+=len(tasks)
        if not tasks: raise Unavailable('threads-missing')
        children=set()
        for task in tasks:
            for raw in read(task/'children',4096,gate).split():
                if not raw.isdecimal() or int(raw)<1: raise Unavailable('child-entry')
                children.add(int(raw))
        if len(queue)+len(found)+len(children)>process_max: raise Unavailable('process-bound')
        queue.extend((child,n) for child in sorted(children))
    return found

def sample(proc,pid,started,deadline,minimum=2,stopped=lambda:False):
    began=time.monotonic_ns()
    def gate():
        if stopped(): raise Unavailable('workload-ended')
        if time.monotonic_ns()>=deadline: raise Unavailable('sampling-deadline')
    try:
        before=census(proc,pid,started,gate)
    except Unavailable as e:
        return {'status':'missing','topology':str(e)}
    issues=Counter(); pss=[]; rss=[]; approx=[]
    for n in before:
        r=proc/str(n)
        try:
            resident,proportional=memory(read(r/'smaps_rollup',16384,gate),('Rss','Pss'))
            pss.append(proportional);rss.append(resident)
        except Unavailable as e:
            issues['rollup-'+str(e)]+=1
        try:
            # A separate approximate series, never merged into rollup RSS.
            approx.extend(memory(read(r/'status',16384,gate),('VmRSS',)))
        except Unavailable as e:
            issues['status-'+str(e)]+=1
    try:
        after=census(proc,pid,started,gate)
        if after!=before: raise Unavailable('topology-changed')
        gate()
    except Unavailable as e:
        return {'status':'missing','topology':str(e),'metricIssues':dict(issues)}
    n=len(before)
    if n<minimum: return {'status':'missing','topology':'below-required-observed-members','members':n,'metricIssues':dict(issues)}
    ended=time.monotonic_ns()
    return {'status':'observed','members':n,'workersObserved':n-1,'readSpanNs':ended-began,
            'sampleStartMonoNs':began,'sampleEndMonoNs':ended,
            'pssKiB':sum(pss) if len(pss)==n else None,
            'rssSummedKiB':sum(rss) if len(rss)==n else None,
            'vmRssApproxSummedKiB':sum(approx) if len(approx)==n else None,
            'metricIssues':dict(issues)}

def observe(pid,started,*,interval_ms=250,duration_seconds=15,minimum=2,proc=Path('/proc'),stopped=lambda:False):
    """Caller already owns these live root identity coordinates in this PID namespace.
    Enforce an independent wall timeout on this observer, not on any workload."""
    if (type(pid) is not int or pid<1 or type(started) is not int or started<1
        or type(interval_ms) is not int or not 250<=interval_ms<=5000
        or type(duration_seconds) is not int
        or not (1<=duration_seconds<=15 or (duration_seconds,interval_ms)==LATE_PROFILE)
        or type(minimum) is not int or not 2<=minimum<=32):
        raise ValueError('unsupported scope')
    # Bracket the monotonic origin in realtime without using realtime for cadence.
    utc_before=time.time_ns()
    t0=time.monotonic_ns()
    utc_after=time.time_ns()
    finish=t0+duration_seconds*1_000_000_000
    rows=[]
    step=interval_ms*1_000_000
    # Fixed monotonic targets. Do not slide or replay a missed sampling window.
    for target in range(t0,finish,step):
        if len(rows)>=MAX_SLOTS or stopped(): break
        remaining=target-time.monotonic_ns()
        while remaining>0:
            time.sleep(min(remaining,25_000_000)/1_000_000_000)
            if stopped(): break
            remaining=target-time.monotonic_ns()
        if remaining>0: break
        deadline=min(finish,target+min(step,MAX_READ_NS))
        if time.monotonic_ns()>=deadline:
            rows.append({'elapsedMs':(target-t0)//1_000_000,
                         'status':'missing','topology':'missed-sampling-window'})
            continue
        row=sample(proc,pid,started,deadline,minimum,stopped)
        if 'sampleStartMonoNs' in row and 'sampleEndMonoNs' in row:
            began=row.pop('sampleStartMonoNs')
            ended=row.pop('sampleEndMonoNs')
            row.update(sampleStartOffsetNs=began-t0,sampleEndOffsetNs=ended-t0)
        rows.append({'elapsedMs':(target-t0)//1_000_000,**row})
    end_utc_before=time.time_ns()
    observed_delta=time.monotonic_ns()-t0
    end_utc_after=time.time_ns()
    names=('pssKiB','rssSummedKiB','vmRssApproxSummedKiB')
    maxima={m:max((r[m] for r in rows if r.get(m) is not None),default=None) for m in names}
    return {'scope':'observed live descendants; non-atomic lower-confidence sampled maxima, not workload peak',
            'rows':rows,'maximaKiB':maxima,'anchorUtcNs':[utc_before,utc_after], 'endAnchorUtcNs':[end_utc_before,end_utc_after],
            'anchorElapsedNs':observed_delta}
