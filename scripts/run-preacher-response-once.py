#!/usr/bin/env python3
"""External CPU4/15s supervisor for the single reviewed response comparison.

Adapted from the prior /tmp/run_restart_once.py pattern; never launches that case.
Default is host-only validation. --execute still requires the coordinator grant.
"""
import argparse
import datetime
import importlib.util
import json
import os
from pathlib import Path
import signal
import subprocess
import sys
import time

ROOT = Path(__file__).resolve().parents[1]
spec = importlib.util.spec_from_file_location("response_probe", ROOT / "scripts/probe-native-preacher-response.py")
probe = importlib.util.module_from_spec(spec)
spec.loader.exec_module(probe)  # Definitions and standard-library imports only.


def members(group):
    found = []
    for path in Path("/proc").iterdir():
        if not path.name.isdecimal():
            continue
        try:
            raw = (path / "stat").read_text()
            fields = raw[raw.rfind(")") + 2:].split()
            if int(fields[2]) == group:
                found.append({"pid": int(path.name), "state": fields[0]})
        except (OSError, ValueError, IndexError):
            pass
    return found


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--execute", action="store_true")
    parser.add_argument("--expected-source-head")
    parser.add_argument("--expected-manifest-sha")
    args = parser.parse_args()
    manifest, fixture, executable = probe.preflight(args)
    if not args.execute:
        print("PASS: external-envelope host guards; no child process launched")
        return
    assert args.expected_source_head and args.expected_manifest_sha
    assert sys.flags.ignore_environment and sys.flags.no_user_site and not sys.flags.optimize
    assert Path(sys.executable).resolve() == Path(manifest["python"]).resolve()
    assert not probe.git("status", "--porcelain"), "Launch requires the reviewed clean worktree"
    assert 4 in os.sched_getaffinity(0), "CPU4 is unavailable in this executor"
    assert not (ROOT / manifest["output"]).exists(), "Comparison output already exists; no retry"
    output = ROOT / manifest["supervisorOutput"]
    output.mkdir(parents=True, exist_ok=False)
    paths = [ROOT / row["path"] for row in manifest["files"]]
    paths += [Path(row["path"]) for row in manifest["toolFiles"]]
    paths += [executable, executable.parent / "levels/constant.dat", probe.PACKET / "launch-manifest.json"]
    def fingerprint():
        values = {}
        for path in paths:
            try:
                values[str(path)] = probe.digest(path.read_bytes())
            except OSError as error:
                values[str(path)] = {"error": str(error)}
        return values
    before = fingerprint()
    environment = dict(os.environ)
    cleared = ["NODE_OPTIONS", "NODE_PATH", "PYTHONOPTIMIZE", "PYTHONPATH", "PYTHONHOME",
               "LIBUNICORN_PATH", "UNICORN_LIB_PATH", "LD_PRELOAD", "LD_LIBRARY_PATH"]
    for name in cleared:
        environment.pop(name, None)
    environment["PND_PREACHER_RESPONSE_SUPERVISED"] = "1"
    command = [manifest["toolIdentity"]["timeout"], "--signal=TERM", "--kill-after=3s", "15s",
               manifest["toolIdentity"]["taskset"], "--cpu-list", "4",
               manifest["python"], "-E", "-s", "-B", str(ROOT / "scripts/probe-native-preacher-response.py"),
               "--execute", "--expected-source-head", args.expected_source_head,
               "--expected-manifest-sha", args.expected_manifest_sha]
    started = datetime.datetime.now(datetime.timezone.utc)
    start = time.monotonic()
    receipt = {"status": "running", "head": args.expected_source_head, "command": command,
               "manifestSha256": args.expected_manifest_sha, "cwd": str(ROOT), "attempt": 1, "retry": False,
               "startedAt": started.isoformat(), "termDeadline": (started + datetime.timedelta(seconds=15)).isoformat(),
               "killDeadline": (started + datetime.timedelta(seconds=18)).isoformat(),
               "cpu": 4, "clearedEnvironmentNames": cleared, "sourceInputToolBefore": before,
               "cleanupSignals": []}
    process = None
    try:
        with (output / "stdout.txt").open("wb") as stdout, (output / "stderr.txt").open("wb") as stderr:
            process = subprocess.Popen(command, cwd=ROOT, env=environment, stdout=stdout, stderr=stderr,
                                       start_new_session=True)
            receipt.update(pid=process.pid, processGroup=process.pid)
            probe.write_json(output / "receipt.json", receipt)
            try:
                receipt["exitCode"] = process.wait(timeout=18.25)
            except subprocess.TimeoutExpired:
                os.killpg(process.pid, signal.SIGKILL)
                receipt["cleanupSignals"].append("KILL exact owned group: external watchdog exceeded")
                receipt["exitCode"] = process.wait(timeout=1)
                receipt["watchdogExceeded"] = True
            if receipt["exitCode"] == 0:
                worker = json.loads((ROOT / manifest["output"] / "receipt.json").read_text())
                assert worker["processGroup"] == process.pid and worker["cpuAffinity"] == [4]
                assert worker["status"] == "expected-mismatch-confirmed"
                receipt["workerRuntime"] = worker
    except BaseException as error:
        receipt["error"] = f"{type(error).__name__}: {error}"
        raise
    finally:
        if process is not None:
            remaining = members(process.pid)
            if remaining:
                try:
                    os.killpg(process.pid, signal.SIGTERM)
                    receipt["cleanupSignals"].append("TERM exact owned process group")
                except ProcessLookupError:
                    pass
                deadline = time.monotonic() + 3
                while remaining and time.monotonic() < deadline - 0.5:
                    time.sleep(0.05)
                    remaining = members(process.pid)
                if remaining:
                    try:
                        os.killpg(process.pid, signal.SIGKILL)
                        receipt["cleanupSignals"].append("KILL exact owned group after TERM grace")
                    except ProcessLookupError:
                        pass
                    try:
                        process.wait(timeout=max(0.01, deadline - time.monotonic()))
                    except subprocess.TimeoutExpired:
                        pass
                    remaining = members(process.pid)
                receipt["remainingProcessGroupMembers"] = remaining
            else:
                receipt["remainingProcessGroupMembers"] = []
        receipt.update(finishedAt=datetime.datetime.now(datetime.timezone.utc).isoformat(), seconds=time.monotonic() - start)
        code = receipt.get("exitCode")
        receipt["exitSignal"] = -code if isinstance(code, int) and code < 0 else None
        receipt["timeoutWrapperReportedTimeout"] = code == 124
        after = fingerprint()
        receipt["sourceInputToolAfter"] = after
        receipt["postflightIdentity"] = "passed" if before == after else "drift"
        for name in ("stdout.txt", "stderr.txt"):
            if (output / name).exists():
                receipt[name + "Sha256"] = probe.digest((output / name).read_bytes())
        receipt["status"] = "passed" if receipt.get("exitCode") == 0 and before == after and not receipt.get("remainingProcessGroupMembers") and not receipt.get("error") else "failed"
        probe.write_json(output / "receipt.json", receipt)
    print(json.dumps({key: receipt.get(key) for key in ("status", "exitCode", "seconds", "remainingProcessGroupMembers", "postflightIdentity")}))
    if receipt["status"] != "passed":
        raise SystemExit(1)


if __name__ == "__main__":
    main()
