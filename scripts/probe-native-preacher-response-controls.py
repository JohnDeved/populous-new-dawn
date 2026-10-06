#!/usr/bin/env python3
"""Four prospective controls only; default validates host data without execution."""
import argparse
import importlib.util
import json
import os
from pathlib import Path
import struct
import subprocess
import sys

ROOT = Path(__file__).resolve().parents[1]
PACKET = ROOT / "decomp/research/preacher-response-controls"
spec = importlib.util.spec_from_file_location("positive_response_probe", ROOT / "scripts/probe-native-preacher-response.py")
positive = importlib.util.module_from_spec(spec)
spec.loader.exec_module(positive)
digest, git, write_json = positive.digest, positive.git, positive.write_json
NAMES = ["stationary-sermon", "reverse-alliance", "allocation-exhaustion", "primary21-sharing"]


def preflight(args):
    if sys.flags.optimize:
        raise RuntimeError("Optimized Python removes proof guards")
    raw = (PACKET / "launch-manifest.json").read_bytes()
    if args.expected_manifest_sha:
        assert digest(raw) == args.expected_manifest_sha
    manifest = json.loads(raw)
    if args.expected_source_head:
        assert git("rev-parse", "HEAD").decode().strip() == args.expected_source_head
    assert not git("status", "--porcelain", "--", "app")
    assert not git("diff", manifest["runtimeHead"], "--", "app")
    assert git("rev-parse", manifest["runtimeHead"] + ":app").decode().strip() == manifest["runtimeAppTree"]
    for row in manifest["files"]:
        assert digest((ROOT / row["path"]).read_bytes()) == row["sha256"], row["path"]
    for row in manifest["toolFiles"]:
        assert digest(Path(row["path"]).read_bytes()) == row["sha256"], row["path"]
    retained = manifest.get("retainedNative")
    if retained:
        original_bytes = git("show", retained["head"] + ":decomp/research/preacher-response-controls/launch-manifest.json")
        assert digest(original_bytes) == retained["manifestSha256"]
        original_manifest = json.loads(original_bytes)
        for item in original_manifest["files"]:
            if ((item["path"].startswith("decomp/research/preacher-response-controls/") and not item["path"].endswith("README.md"))
                    or item["path"] == "scripts/probe-native-preacher-response.py"):
                assert digest((ROOT / item["path"]).read_bytes()) == item["sha256"], "Retained-native correspondence: " + item["path"]
        launch = json.loads((ROOT / retained["launchReceipt"]).read_text())
        assert launch["head"] == retained["head"] and launch["manifestSha256"] == retained["manifestSha256"]
        assert launch["status"] == "failed" and launch["exitCode"] == 1
        assert launch["sourceInputToolBefore"] == launch["sourceInputToolAfter"]
        assert launch["remainingProcessGroupMembers"] == []
    executable = Path(manifest["executable"]["path"])
    blob = executable.read_bytes()
    assert digest(blob) == manifest["executable"]["sha256"]
    assert digest((executable.parent / "levels/constant.dat").read_bytes()) == manifest["constantsSha256"]
    controls = json.loads((PACKET / "controls.json").read_text())
    assert controls["caseCount"] == 4 and [row["case"] for row in controls["cases"]] == NAMES
    for row in controls["cases"]:
        path = PACKET / row["fixture"]
        assert digest(path.read_bytes()) == row["sha256"]
        f = json.loads(path.read_text())
        assert f["case"] == row["case"] and f["allowlist"]["interceptions"] == []
        assert len(f["people"]) == (3 if f["case"] == "primary21-sharing" else 2)
        assert f["limits"]["nativeInstructions"] == 100000 and f["limits"]["nativeTimeoutMicroseconds"] == 1000000
        people = bytearray()
        for person in f["people"]:
            record = bytearray(256)
            for name, field in f["fields"].items():
                struct.pack_into("<" + field["format"], record, field["offset"], person["native"][name])
            struct.pack_into("<8H", record, 0x8b, *person["native"]["commands"])
            assert person["native"]["flags2"] == 0x20000
            assert person["unit"]["hp"] * 20 == person["native"]["life"]
            people.extend(record)
        assert people == (path.parent / "people-input.bin").read_bytes()
        for item in f["rawInputs"]:
            data = (path.parent / item["path"]).read_bytes()
            assert len(data) == item["bytes"] and digest(data) == item["sha256"]
        for fn in f["abi"]["functions"]:
            assert digest(positive.pe_bytes(blob, fn["entry"], fn["stopExclusive"])) == fn["nativeBytesSha256"]
            assert f["expected"]["entrySequence"].count(fn["entry"]) == fn["expectedCalls"]
        if retained:
            native = json.loads((ROOT / retained["root"] / f["case"] / "native.json").read_text())
            verify_native(f, native, path.parent)
    return manifest, controls, executable


def verify_native(f, native, directory):
    entries = [row for row in native["calls"] if row["phase"] == "enter"]
    returns = [row for row in native["calls"] if row["phase"] == "return"]
    assert [row["entry"] for row in entries] == f["expected"]["entrySequence"]
    assert len(entries) == len(returns)
    assert all("rawEax" in row for row in returns)
    assert [row["value"] for row in returns if row["entry"] == 0x51e7b0] == [f["expected"]["producerAL"]]
    scans = [row for row in returns if row["entry"] == 0x51f030]
    assert [row["value"] for row in scans] == f["expected"]["scanReturns"]
    assert [row["threatPointer"] for row in scans] == f["expected"]["scanThreatOutputs"]
    assert all(row["friendlyPointer"] == 0 for row in scans)
    before, after = native["before"], native["after"]
    assert bytes.fromhex("".join(before["peopleHex"])) == (directory / "people-input.bin").read_bytes()
    assert bytes.fromhex(before["poolHex"]) == (directory / "orders-input.bin").read_bytes()
    assert bytes.fromhex("".join(after["peopleHex"])) == (directory / "people-expected.bin").read_bytes()
    assert bytes.fromhex(after["poolHex"]) == (directory / "orders-expected.bin").read_bytes()
    assert (after["cursor"], after["active"]) == (f["expected"]["nativeCursor"], f["expected"]["nativeActive"])
    for key in ("simulationRandom", "cosmeticRandom", "terrainCells", "unitPointersHex"):
        assert before[key] == after[key]


def verify_port(f, native, port):
    assert port["case"] == f["case"] and port["result"] is f["expected"]["portReturn"]
    assert all(row["actual"] == row["expected"] for row in port["calls"])
    for phase in ("before", "after"):
        n, p = native[phase], port[phase]
        assert p["poolHex"] == n["poolHex"]
        for key in ("cursor", "active", "simulationRandom", "cosmeticRandom"):
            assert p[key] == n[key]
        for record, raw_hex in zip(p["people"], n["peopleHex"]):
            raw = bytes.fromhex(raw_hex)
            for name, field in f["fields"].items():
                assert record[name] == struct.unpack_from("<" + field["format"], raw, field["offset"])[0], (f["case"], phase, name)
            assert record["commands"] == list(struct.unpack_from("<8H", raw, 0x8b))
        assert all(retained and registered for retained, registered in p["identities"])
    for key in ("heads", "registryIds", "pathOwners", "turn", "identities"):
        assert port["before"][key] == port["after"][key]
    if f["case"] != "primary21-sharing":
        assert port["before"] == port["after"]
    else:
        for before, after in zip(port["before"]["units"], port["after"]["units"]):
            assert {k: v for k, v in before.items() if k != "native"} == {k: v for k, v in after.items() if k != "native"}


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--execute", action="store_true")
    parser.add_argument("--expected-source-head")
    parser.add_argument("--expected-manifest-sha")
    args = parser.parse_args()
    manifest, controls, executable = preflight(args)
    if not args.execute:
        print("PASS: four-control host guards; no native or application execution")
        return
    assert args.expected_source_head and args.expected_manifest_sha
    assert os.environ.get("PND_PREACHER_RESPONSE_SUPERVISED") == "1"
    assert sys.flags.ignore_environment and sys.flags.no_user_site and not sys.flags.optimize
    assert Path(sys.executable).resolve() == Path(manifest["python"]).resolve()
    assert os.sched_getaffinity(0) == {4}
    assert not os.environ.get("NODE_OPTIONS") and not os.environ.get("NODE_PATH")
    output = ROOT / manifest["output"]
    output.mkdir(parents=True, exist_ok=False)
    receipt = {"status": "running", "sourceHead": args.expected_source_head, "manifestSha256": args.expected_manifest_sha,
               "pid": os.getpid(), "processGroup": os.getpgrp(), "cpuAffinity": [4], "retry": False, "nativeCases": []}
    write_json(output / "launch.json", manifest)
    write_json(output / "receipt.json", receipt)
    native_rows = []
    try:
        for row in controls["cases"]:
            path = PACKET / row["fixture"]
            f = json.loads(path.read_text())
            case_output = output / f["case"]
            case_output.mkdir()
            receipt["nativeCases"].append({"case": f["case"], "status": "started"})
            write_json(output / "receipt.json", receipt)
            if manifest.get("retainedNative"):
                retained_path = ROOT / manifest["retainedNative"]["root"] / f["case"] / "native.json"
                native = json.loads(retained_path.read_text())
                receipt["nativeCases"][-1]["retainedPath"] = str(retained_path)
                receipt["nativeCases"][-1]["retainedSha256"] = digest(retained_path.read_bytes())
            else:
                native = positive.native_once(f, executable, case_output, manifest["toolIdentity"], path.parent)
            verify_native(f, native, path.parent)
            native_rows.append((f, native))
            receipt["nativeCases"][-1]["status"] = "reused-verified" if manifest.get("retainedNative") else "verified"
            write_json(output / "receipt.json", receipt)
        command = [manifest["node"], str(ROOT / "scripts/preacher-response-controls.mjs"), str(PACKET / "controls.json")]
        try:
            run = subprocess.run(command, cwd=ROOT, capture_output=True, text=True, timeout=5)
        except subprocess.TimeoutExpired as error:
            (output / "port.stdout").write_bytes(error.stdout or b"")
            (output / "port.stderr").write_bytes(error.stderr or b"")
            raise
        (output / "port.stdout").write_text(run.stdout)
        (output / "port.stderr").write_text(run.stderr)
        assert run.returncode == 0, f"Port control runner exited {run.returncode}"
        port = json.loads(run.stdout)
        write_json(output / "port.json", port)
        assert len(port["rows"]) == 4
        for (f, native), actual in zip(native_rows, port["rows"]):
            verify_port(f, native, actual)
        preflight(args)
        receipt["status"] = "four-controls-matched"
    except BaseException as error:
        receipt["status"] = "failed"
        receipt["error"] = f"{type(error).__name__}: {error}"
        raise
    finally:
        write_json(output / "receipt.json", receipt)
    print(json.dumps({"status": receipt["status"], "cases": NAMES,
                      "nativeInvocations": 0 if manifest.get("retainedNative") else 4, "portInvocations": 4}))


if __name__ == "__main__":
    main()
