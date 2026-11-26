"""Owned hosted ABBA Vite diagnostics; not a browser or acceptance gate."""
import hashlib
import json
import os
from pathlib import Path
import re
import shutil
import signal
import stat
import subprocess as sp
import sys
import time

BASE = "20cc16fdf2e9fa9f597def02c551d941af1d9d3c"
HEAD = "53d392a15b37b9e0b8dd99230c11d3b7720d478a"
RUNTIME = "scripts/browser-performance/browser-runtime.mjs"
RUN = "scripts/browser-performance/run.mjs"
BUILD = "scripts/browser-performance/build.mjs"
READER = "scripts/browser-performance/reader-build.mjs"
PINS = {
    "workload": (BASE, "6054b587fedc3db150a9268941f611c8fa383c0c", {
        RUN: "5891833b8c598ad9dd3f0f2d77c72ad28c42a7f3",
        BUILD: "a9e8c08e6649db66f063dc5d825a8efaf57f835c",
        READER: "0f11bf93836fcbe80b1e3861f9c222a95b832398",
        "package.json": "0398b1b1642a9b514f0ac59f1c74ee276979965b",
        "pnpm-lock.yaml": "711c03c7f6b7f28d9e492410dca2a046dfe3033d",
        "pnpm-workspace.yaml": "b5115e50d06299b5848d84d222141f533a2998b8",
    }),
    "candidate": (HEAD, "9a4f27accd4c6dd3bccb8a8bc81be8816e32524c", {
        RUNTIME: "ac16f7581f6aa835f8fde691a79a16ce3bc42e0b",
        "scripts/tutorial-browser/browser-config.mjs": "0a16227a85b8869f0dcd285ed01ee0a7e6b087c5",
    }),
}
ORDER = ("baseline", "candidate", "candidate", "baseline")
MIB = 1024**2
RESERVE = 1024*MIB
RSS_BUDGET = 3072*MIB
MIN_INODES = 100000
SAMPLE_SECONDS = 0.05
PROC = Path("/proc")
PRESSURE_BLOCK = b"PND1174-OUTPUT!\n" * 4096
PRESSURE_BLOCKS = 96
PRESSURE_BYTES = PRESSURE_BLOCKS * 64 * 1024
PRESSURE_STOCK_MAX = 64 * 1024
PAGE = os.sysconf("SC_PAGE_SIZE")


def require(ok, message):
    if not ok:
        raise ValueError(message)


def git(root, *args):
    return sp.check_output(["git", "-C", str(root), *args], text=True, timeout=25).strip()


def verify_source(root):
    result = {}
    for name, (commit, tree, targets) in PINS.items():
        p = root/name
        require(git(p, "rev-parse", "HEAD") == commit, f"{name}: unreviewed commit")
        require(git(p, "rev-parse", "HEAD^{tree}") == tree, f"{name}: unreviewed tree")
        require(not git(p, "status", "--porcelain", "--untracked-files=no"), f"{name}: tracked inputs changed")
        for file, expected in targets.items():
            require(git(p, "rev-parse", f"HEAD:{file}") == expected, f"Git tree mismatch: {file}")
            require(git(p, "hash-object", "--no-filters", file) == expected, f"Physical blob mismatch: {file}")
        result[name] = {"commit": commit, "tree": tree, "blobs": targets}
    return result


def resources(paths, before_install=False):
    mounts = [p.stat() for p in paths]
    require(len({st.st_dev for st in mounts}) == 1, "Runner temp, checkout and output must share a sampled device")
    fs = [os.statvfs(p) for p in paths]
    free = min(x.f_bavail*x.f_frsize for x in fs)
    free_inodes = min(x.f_favail for x in fs)
    values = {}
    for line in (PROC/"meminfo").read_text().splitlines():
        key, _, val = line.partition(":")
        if key in ("MemAvailable", "MemTotal"):
            values[key] = int(val.split()[0])*1024
    total, avail = values["MemTotal"], values["MemAvailable"]
    # MemAvailable is whole-host, not a cgroup allowance; this job is only
    # for the dedicated hosted VM. Also fail if cgroup cannot be interpreted.
    cg = [line[3:] for line in (PROC/"self/cgroup").read_text().splitlines() if line.startswith("0::/")]
    require(len(cg)==1 and ".." not in Path(cg[0]).parts, "Expected readable Linux cgroup v2")
    limit_dir = Path("/sys/fs/cgroup")
    current = limit_dir/cg[0].lstrip("/")
    effective = []
    while current.is_relative_to(limit_dir):
        if (current/"memory.max").is_file():
            max_text = (current/"memory.max").read_text().strip()
            if max_text != "max":
                effective.append(int(max_text) - int((current/"memory.current").read_text()))
        if current == limit_dir:
            break
        current = current.parent
    require((limit_dir/"cgroup.controllers").is_file() and (limit_dir/cg[0].lstrip("/")).is_dir(),
            "Runner cgroup v2 observation unavailable")
    memory = min([total, avail] + effective)
    require(memory >= RSS_BUDGET + RESERVE, "Insufficient measured memory headroom")
    require(free >= (5 if before_install else 2)*1024*MIB, "Insufficient disk headroom")
    require(free_inodes >= MIN_INODES, "Insufficient inode headroom")
    return {"memTotalBytes":total, "memAvailableBytes":avail, "effectiveHeadroomBytes":memory,
            "finiteCgroupHeadroomBytes":effective, "freeBytes":free, "freeInodes":free_inodes}


def proc_fields(text):
    pre, sep, post = text.rpartition(")")
    values = post.split()
    require(sep and len(values)>=22, "Malformed /proc stat")
    return int(pre.split()[0]), int(values[3]), int(values[19]), int(values[21])*PAGE


def members(session):
    rows = {}
    for p in PROC.iterdir():
        if not p.name.isdigit():
            continue
        try:
            pid, sid, ticks, rss = proc_fields((p/"stat").read_text())
            if sid == session:
                rows[pid] = (ticks,rss)
        except (FileNotFoundError, ProcessLookupError, PermissionError):
            continue
    return rows


def stop_owned(proc):
    if proc.poll() is None:
        # A process started by this supervisor in a fresh session only.
        require(os.getsid(proc.pid)==proc.pid and os.getpgid(proc.pid)==proc.pid,
                "Owned process identity changed")
        os.killpg(proc.pid, signal.SIGKILL)
        proc.wait(timeout=5)


def manifest(root):
    result, count = {},0
    for f in sorted(root.rglob("*")):
        s = f.lstat()
        require(not f.is_symlink(), f"Unexpected link in Vite dist: {f.name}")
        if f.is_dir():
            continue
        require(stat.S_ISREG(s.st_mode), f"Unexpected entry in Vite dist: {f.name}")
        count += s.st_size
        require(len(result)<2000 and count<=200*MIB, "Build output above evidence budget")
        with f.open("rb") as h:
            result[f.relative_to(root).as_posix()] = {"bytes": s.st_size, "sha256": hashlib.file_digest(h,"sha256").hexdigest()}
    require(result.get("index.html",{}).get("bytes",0)>0 and any(p.endswith(".js") for p in result), "Missing actual Vite entry output")
    return result


def validate_receipt(data, pid, start, boot, namespace):
    pre, post = data["before"],data["after"]
    require(pid == pre["pid"] == post["pid"] and str(start) == pre["startTicks"] == post["startTicks"]
            and boot == pre["boot"] == post["boot"] and namespace == pre["namespace"] == post["namespace"],
            "Capture parent identity mismatch")
    require(int(post["monotonicNs"])>int(pre["monotonicNs"]) and
            0 < pre["captureParentVmHwmKiB"] <= post["captureParentVmHwmKiB"], "Invalid capture parent's VmHWM timing")
    result = data["result"]
    require(type(result["code"]) is int and result["code"]==0 and result["signal"] is None
            and not any(result.get(k) for k in ("timedOut","cappedLog","incompleteLog")),
            "Capture did not finish cleanly")
    return post["captureParentVmHwmKiB"]


def json_write(path, data):
    with path.open("x",encoding="utf-8") as h:
        json.dump(data,h,indent=2)
        h.write("\n")


def dependencies(node, work):
    code = """
import {readerDependencyManifest as get} from './scripts/browser-performance/reader-build.mjs'
const {version} = await import('vite')
if (version !== '8.0.13') throw Error('Wrong installed Vite')
const {sha256, files, bytes, sourcePolicy} = get(process.cwd())
if (sourcePolicy?.packageManager !== 'pnpm@11.25.0') throw Error('Wrong installed manager')
console.log(JSON.stringify({sha256, files, bytes, sourcePolicy, version}))
"""
    return json.loads(sp.check_output([node,"--input-type=module","-e",code],cwd=work,text=True,timeout=45))


def verify_pressure(path):
    size = path.stat().st_size
    require(PRESSURE_BYTES < size <= PRESSURE_BYTES + PRESSURE_STOCK_MAX,
            "Missing pressure suffix or unexpected stock log size")
    prefix = size - PRESSURE_BYTES
    h = hashlib.sha256()
    with path.open("rb") as logs:
        stock = logs.read(prefix)
        require(b"vite v8.0.13" in stock.lower(), "Missing genuine Vite version banner")
        for _ in range(PRESSURE_BLOCKS):
            block = logs.read(len(PRESSURE_BLOCK))
            require(block == PRESSURE_BLOCK, "Wrong pressure bytes or interleaved output")
            h.update(block)
        require(not logs.read(1), "Trailing pressure bytes")
    return {"stockLogBytes":prefix, "suffixBytes":PRESSURE_BYTES, "suffixSha256":h.hexdigest()}


def launch(root, node, prod, evidence, arm, number, temp):
    out = prod/f"out-{number}"
    out.mkdir()
    log, receipt = evidence/f"build-{number}.log", evidence/f"arm-{number}.json"
    runtime = root/("workload" if arm=="baseline" else "candidate")/(RUN if arm=="baseline" else RUNTIME)
    harmless = {k:os.environ[k] for k in ("PATH","HOME","LANG") if k in os.environ}
    harmless.update(CI="true", TMPDIR=str(temp), TZ="UTC", WRANGLER_SEND_METRICS="false")
    boot = (PROC/"sys/kernel/random/boot_id").read_text().strip()
    proc = sp.Popen([node,str(root/"diagnostic/scripts/diagnose-capture1174-arm.mjs"),arm,str(runtime),
                     str(out),str(log),str(receipt),BASE], cwd=root/"workload", env=harmless,
                    stdin=sp.DEVNULL, start_new_session=True)
    deadline = time.monotonic()+130
    samples, peak_child, peak_joint, seen = [],0,0,set()
    try:
        pid, session, start, _ = proc_fields((PROC/str(proc.pid)/"stat").read_text())
        require(pid==session==proc.pid,"Invalid owned capture parent")
        namespace = os.readlink(PROC/str(pid)/"ns/pid")
        while proc.poll() is None:
            require(time.monotonic()<deadline, "Outer deadline exhausted")
            rows = members(pid)
            if pid in rows and rows[pid][0] == start:
                child = sum(rss for p,(_,rss) in rows.items() if p!=pid)
                joint = child+rows[pid][1]
                seen.update(p for p in rows if p!=pid)
                samples.append([time.monotonic_ns(), rows[pid][1], child, len(rows)-1])
                peak_child, peak_joint = max(peak_child,child),max(peak_joint,joint)
                fs = os.statvfs(prod)
                require(joint<=RSS_BUDGET and fs.f_bavail*fs.f_frsize>=RESERVE and fs.f_favail>=MIN_INODES,
                        "Owned run exceeded sampled resource budget")
            time.sleep(SAMPLE_SECONDS)
    except BaseException:
        stop_owned(proc)
        raise
    json_write(evidence/f"rss-samples-{number}.json", {"columns": ["monotonicNs","parentRssBytes","childSessionRssBytes","childCount"], "rows":samples})
    require(proc.returncode==0 and len(samples)>=5 and bool(seen) and peak_child>0,
            "Capture parent failed or child RSS was not observed")
    require(not members(pid), "Owned session still has descendants; benchmark is invalid")
    hwm = validate_receipt(json.loads(receipt.read_text()),pid,start,boot,namespace)
    require(0 < log.stat().st_size<=8*MIB, "Missing/oversize capture log")
    with log.open("rb") as f:
        log_hash = hashlib.file_digest(f,"sha256").hexdigest()
    return {"arm":arm,"captureParentVmHwmKiB":hwm,"sampleCount":len(samples),
            "sampledChildSessionRssBytes":peak_child,"sampledCombinedRssBytes":peak_joint,
            "logBytes":log.stat().st_size,"logSha256":log_hash,"controlledPressure":verify_pressure(log),"dist":manifest(out/"dist")}


def main(phase, root):
    require(os.environ.get("GITHUB_REPOSITORY")=="JohnDeved/populous-new-dawn"
            and os.environ.get("GITHUB_REF")=="refs/heads/diagnostics/capture1174-paired-20261126"
            and os.environ.get("GITHUB_EVENT_NAME")=="push" and os.environ.get("RUNNER_OS")=="Linux",
            "Diagnostic is restricted to the reviewed hosted branch")
    source = verify_source(root)
    temp = Path(os.environ["RUNNER_TEMP"]).resolve(strict=True)
    evidence=root/"evidence"
    evidence.mkdir(exist_ok=True)
    paths = (root/"workload", temp, evidence)
    headroom = resources(paths, before_install=phase=="preflight")
    if phase=="preflight":
        json_write(evidence/"preflight.json",{"source":source,"headroom":headroom,"workflowCommit":os.environ["GITHUB_SHA"]})
        return
    require(phase=="measure","Invalid phase")
    require((evidence/"preflight.json").is_file(),"Missing pre-install evidence")
    node=shutil.which("node")
    require(node is not None and sp.check_output([node,"-p","process.version + '/' + process.arch"],text=True,timeout=10).strip()=="v24.19.0/x64",
            "Wrong required Node runtime")
    w = root/"workload"
    require((w/"node_modules/.pnpm").is_dir(),"Missing frozen pnpm dependency closure")
    closure = dependencies(node,w)
    prod=w/"diagnostic-output"
    prod.mkdir()
    results=[]
    for n,arm in enumerate(ORDER,1):
        before_run = resources(paths)
        row=launch(root,node,prod,evidence,arm,n,temp)
        require(not results or row["dist"]==results[0]["dist"],
                "Exact relative Vite dist manifests differ; no comparison admitted")
        row["headroomBeforeRun"]=before_run
        json_write(evidence/f"observation-{n}.json",row)
        results.append(row)
    require(verify_source(root)==source,"Source changed during benchmark")
    require(dependencies(node,w)==closure,"Installed dependency bytes changed")
    json_write(evidence/"comparison.json", {"workflowCommit":os.environ["GITHUB_SHA"],
               "run":os.environ["GITHUB_RUN_ID"],"attempt":os.environ["GITHUB_RUN_ATTEMPT"],
               "runner":{"image":os.environ.get("ImageOS"),"imageVersion":os.environ.get("ImageVersion"),
                         "arch":os.uname().machine,"kernel":os.uname().release,"logicalCpuCount":os.cpu_count()},
               "versions":{"node":"24.19.0","pnpm":"11.25.0","vite":closure["version"]},
               "source":source,"dependencies":closure,"order":ORDER,"mountAndMemoryAtStart":headroom,"observations":results,
               "scope":"exact paired stock fixture Vite builds with deliberate 6 MiB stdout-only suffix after successful child exit; not naturally verbose Vite, concurrent pressure, Chrome, PSS, or whole-host attributable memory"})


if __name__=="__main__":
    require(len(sys.argv)==2,"Use preflight or measure")
    main(sys.argv[1],Path.cwd().resolve())
