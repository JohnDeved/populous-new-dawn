"""Build-stage diagnostic contract; no build admission, publish, or gate decisions."""
import argparse
import json
import os
import signal
import sys
import time
from pathlib import Path

from launcher import PreLaunchFailure, restore_exec_signals, run_owned

SCOPE = {
    "root": "exact package-manager process spawned by launcher",
    "descendants": "identity-checked observed live descendants only",
    "memory": "sampled process-tree sums, not cgroup or whole-job peak",
    "filesystem": "working-directory filesystem available bytes at stage boundaries; not attributable",
}
SECONDS, INTERVAL_MS, MAX_LOG_BYTES = 15, 250, 4096

def filesystem_available():
    try:
        s = os.statvfs(".")
        return s.f_bavail * s.f_frsize
    except OSError:
        return None

def measure(executable, *, spawn=run_owned, free=filesystem_available, clock=time.monotonic_ns):
    if not Path(executable).is_absolute() or Path(executable).name not in {"npm", "pnpm"}:
        raise ValueError("only a fixed npm/pnpm executable and run build are admitted")
    start = clock()
    available_before = free()
    raw, samples = spawn([executable, "run", "build"], duration=SECONDS, interval=INTERVAL_MS)
    available_after = free()
    elapsed = (clock() - start) // 1_000_000
    code = os.waitstatus_to_exitcode(raw)
    rows = samples.get("rows", [])
    issues = {}
    for row in rows:
        if row.get("status") == "missing":
            k = row.get("topology", "unknown")
            issues[k] = issues.get(k, 0) + 1
    maxima = samples.get("maximaKiB", {})
    observations = {
        "status": samples.get("status", "sampled" if rows else "no-observations"),
        "samplesTotal": len(rows),
        "samplesObserved": sum(row.get("status") == "observed" for row in rows),
        "maxObservedMembers": max((row.get("members", 0) for row in rows), default=0),
        "observedWindowMs": rows[-1]["elapsedMs"] if rows else None,
        "maximaKiB": {k: maxima.get(k) for k in ("pssKiB", "rssSummedKiB", "vmRssApproxSummedKiB")},
        "missingTopologyCounts": issues,
    }
    return raw, {
        "schema": "pnd-quality-build-telemetry-v1",
        "scope": SCOPE,
        "windowSeconds": SECONDS,
        "intervalMs": INTERVAL_MS,
        "stageObservedElapsedMsIncludingMonitor": elapsed,
        "buildExitCode": code if code >= 0 else None,
        "buildSignal": -code if code < 0 else None,
        "availableBytesBefore": available_before,
        "availableBytesAfter": available_after,
        "observation": observations,
    }

def emit(report):
    raw = json.dumps(report, allow_nan=False, separators=(",", ":"))
    if not 0 < len(raw.encode()) <= MAX_LOG_BYTES:
        raise ValueError("bounded telemetry exceeds log contract")
    print("\nPND_QUALITY_BUILD_TELEMETRY_V1 " + raw, flush=True)

def main(argv=None):
    p = argparse.ArgumentParser()
    p.add_argument("--executable", required=True)
    o = p.parse_args(argv)
    try:
        raw, report = measure(o.executable)
    except PreLaunchFailure:
        print("::warning::Optional build telemetry unavailable before launch; running the build once without it.", file=sys.stderr)
        restore_exec_signals()
        os.execv(o.executable, [o.executable, "run", "build"])
        raise AssertionError("execv unexpectedly returned")
    try:
        emit(report)
    except (TypeError, ValueError, OSError, OverflowError):
        print("::warning::Optional build telemetry could not be emitted; build result unchanged.", file=sys.stderr)
    if os.WIFSIGNALED(raw):
        n = os.WTERMSIG(raw)
        if n not in (signal.SIGKILL, signal.SIGSTOP):
            signal.signal(n, signal.SIG_DFL)
        os.kill(os.getpid(), n)
        return 128 + n
    return os.waitstatus_to_exitcode(raw)

if __name__ == "__main__":
    raise SystemExit(main())
