"""Inner source checks and original harness, run only inside owned namespace."""
import importlib.util
import json
import os
from pathlib import Path
import selectors
import subprocess
import sys
import time
sys.dont_write_bytecode = True
HERE = Path(__file__).resolve().parent
sys.path.insert(0, str(HERE))
import controller as policy


def load_shared(path):
    spec = importlib.util.spec_from_file_location('material_shared', path)
    module = importlib.util.module_from_spec(spec)
    sys.modules[spec.name] = module
    spec.loader.exec_module(module)
    return module


def capture(command, output, prefix, seconds, allowance):
    """Bounded pipe transport. Whole descendant cleanup belongs to outer pidfds."""
    started = time.monotonic()
    process = subprocess.Popen(command, stdin=subprocess.DEVNULL, stdout=subprocess.PIPE,
                               stderr=subprocess.PIPE, close_fds=True)
    used = 0
    files = {name: (output / (prefix+'.'+name)).open('xb') for name in ('stdout','stderr')}
    error = None
    try:
        with selectors.DefaultSelector() as selector:
            for name in files:
                pipe = getattr(process,name); os.set_blocking(pipe.fileno(),False)
                selector.register(pipe, selectors.EVENT_READ, name)
            while selector.get_map() or process.poll() is None:
                policy.require(time.monotonic()-started < seconds, 'Inner command timeout')
                for key,_ in selector.select(.03):
                    data=os.read(key.fd,65536)
                    if not data:
                        selector.unregister(key.fileobj); key.fileobj.close(); continue
                    keep=data[:max(0,allowance-used)]
                    files[key.data].write(keep); files[key.data].flush(); used+=len(keep)
                    policy.require(len(keep)==len(data), 'Inner raw cap')
        policy.require(process.returncode==0, 'Inner command failed')
    except BaseException as failure:
        error=type(failure).__name__+': '+str(failure)
        raise
    finally:
        if process.poll() is None: process.kill()
        process.wait(timeout=1)
        for name,stream in files.items():
            stream.close()
            pipe=getattr(process,name)
            if not pipe.closed: pipe.close()
        with (output/(prefix+'-command.json')).open('x') as stream:
            json.dump(dict(command=command, exitCode=process.returncode, rawBytes=used,
                           wallSeconds=time.monotonic()-started, error=error),stream)
    return used


def main():
    args = sys.argv[1:]
    policy.require(len(args) in (5, 9), 'Unexpected material payload arguments')
    admission_path, target, node, browser, evidence = args[:5]
    target,evidence=map(Path,(target,evidence))
    sys.path.insert(0,str(Path(admission_path).parent))
    spec=importlib.util.spec_from_file_location('original_material_admission',admission_path)
    admission=importlib.util.module_from_spec(spec);spec.loader.exec_module(admission)
    if len(args) == 9:
        policy.require(Path(admission_path) == HERE/'target_admission.py', 'Wrong fresh-host admission')
        admission.configure(*args[5:])
    output=evidence/'receipt/browser';output.mkdir(mode=0o700)
    before=admission.snapshot(target,evidence,'before')
    command=policy.harness_command(node,target,HERE/'probe.mjs',output,browser)
    try:
        used=capture(command,evidence/'receipt','harness',180,policy.LIMITS['raw_bytes']-policy.LIMITS['outer_raw_bytes'])
        capture([node,str(HERE/'validate.mjs'),str(output)],evidence/'receipt','contract',
                5,max(0,policy.LIMITS['raw_bytes']-policy.LIMITS['outer_raw_bytes']-used))
    finally:
        after=admission.snapshot(target,evidence,'after')
        comparison=admission.compare_browser_sources(before,after)
        admission.save(evidence/'receipt/source-comparison.json',comparison)
    return 0

if __name__=='__main__':raise SystemExit(main())
