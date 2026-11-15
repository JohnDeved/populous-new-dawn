#!/usr/bin/env python3
"""Observation-only subprocess RSS sampler. No signals, caps, env or sandbox edits."""
import json, os, pathlib, subprocess, sys, time

def process_row(path):
    tail = (path/'stat').read_text().rsplit(')',1)[1].split()
    return {'pid':int(path.name), 'ppid':int(tail[1]),
            'startTicks':int(tail[19]), 'rssBytes':int(tail[21])*os.sysconf('SC_PAGE_SIZE')}

def select_owned(table, root_pid, root_ticks):
    root = table.get(root_pid)
    if root_ticks is None or root is None or root['startTicks'] != root_ticks:
        return []
    selected = {root_pid}
    while True:
        more = {pid for pid,row in table.items() if row['ppid'] in selected} - selected
        if not more: break
        selected.update(more)
    return [table[pid] for pid in sorted(selected)]

def main():
    if len(sys.argv) < 4 or sys.argv[2] != '--':
        raise SystemExit('Usage: observe.py NEW.jsonl -- COMMAND [ARGS...]')
    output = pathlib.Path(sys.argv[1])
    # Exclusive evidence creation happens before launch; never overwrite held results.
    with output.open('x', encoding='utf-8') as evidence:
        def record(value):
            evidence.write(json.dumps(value) + '\n')
            evidence.flush()
        record({'kind':'scope', 'command':sys.argv[3:], 'cwd':os.getcwd(),
                'intervalSeconds':0.5, 'maxSamples':1200,
                'limits':['RSS sums may double-count shared pages; sampling can miss peaks',
                          'Only descendants observable under this launched root at each sample',
                          'Reparented children and short-lived processes may be missed',
                          'Not host memory, cgroup use, leak proof or precise elapsed activity',
                          'No timeout, signals, environment, sandbox or resource-cap changes']})
        child = subprocess.Popen(sys.argv[3:])
        # Bind before poll/wait can reap the launched process; never adopt a later PID.
        try:
            initial = process_row(pathlib.Path('/proc') / str(child.pid))
            root_ticks = initial['startTicks'] if initial['ppid'] == os.getpid() else None
        except (OSError, ValueError, IndexError):
            root_ticks = None
        record({'kind':'root-identity','pid':child.pid,'startTicks':root_ticks})
        peak = 0; samples = 0; errors = []; started = time.monotonic()
        while child.poll() is None:
            if samples < 1200:
                try:
                    table = {}
                    for path in pathlib.Path('/proc').iterdir():
                        if not path.name.isdigit(): continue
                        try:
                            table[int(path.name)] = process_row(path)
                        except (OSError, ValueError, IndexError): pass
                    rows = select_owned(table, child.pid, root_ticks)
                    rss = sum(row['rssBytes'] for row in rows)
                    peak = max(peak, rss)
                    record({'kind':'sample','elapsedSeconds':time.monotonic()-started,
                            'rootPid':child.pid,'rootStartTicks':root_ticks,
                            'identityAvailable':bool(rows),'processes':rows,'summedRssBytes':rss})
                    samples += 1
                except Exception as error:
                    errors.append(str(error)); break
            time.sleep(0.5)
        code = child.wait()
        record({'kind':'terminal','exitCode':code,'samples':samples,
                'sampledPeakSummedRssBytes':peak,'samplingErrors':errors,
                'samplingLimitReached':samples >= 1200})
    # Retain command failure; negative return codes use conventional shell mapping.
    raise SystemExit(code if code >= 0 else 128-code)

if __name__ == '__main__':
    main()
