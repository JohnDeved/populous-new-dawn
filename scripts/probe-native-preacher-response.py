#!/usr/bin/env python3
"""One reviewed response-only native/production pair; default is host-only preflight.

No emulation or application import occurs without --execute. A separate coordinator
grant is required. The launcher never retries and never records parity/fixtures.
"""
import argparse
import hashlib
import json
import os
import signal
import struct
import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
PACKET = ROOT / "decomp/research/preacher-response-trigger"


def digest(data):
    return hashlib.sha256(data).hexdigest()


def git(*args):
    return subprocess.run(["git", *args], cwd=ROOT, capture_output=True, check=True).stdout


def pe_bytes(executable, start, end):
    pe = struct.unpack_from("<I", executable, 60)[0]
    base = struct.unpack_from("<I", executable, pe + 24 + 28)[0]
    optional = struct.unpack_from("<H", executable, pe + 20)[0]
    for index in range(struct.unpack_from("<H", executable, pe + 6)[0]):
        _, _, rva, size, offset = struct.unpack_from(
            "<8sIIII", executable, pe + 24 + optional + index * 40
        )
        if rva <= start - base and end - base <= rva + size:
            return executable[offset + start - base - rva:offset + end - base - rva]
    raise AssertionError(f"Unmapped PE range {start:x}..{end:x}")


def preflight(args):
    if sys.flags.optimize:
        raise RuntimeError("Optimized Python would remove proof guards")
    raw_manifest = (PACKET / "launch-manifest.json").read_bytes()
    if args.expected_manifest_sha:
        assert digest(raw_manifest) == args.expected_manifest_sha, "Launch manifest drift"
    manifest = json.loads(raw_manifest)
    assert git("rev-parse", manifest["runtimeHead"] + ":app").decode().strip() == manifest["runtimeAppTree"]
    assert args.expected_source_head is None or git("rev-parse", "HEAD").decode().strip() == args.expected_source_head
    assert not git("status", "--porcelain", "--", "app"), "Runtime has local changes"
    assert not git("diff", manifest["runtimeHead"], "--", "app"), "Runtime differs from reviewed main"
    for row in manifest["files"]:
        assert digest((ROOT / row["path"]).read_bytes()) == row["sha256"], row["path"]
    for row in manifest["toolFiles"]:
        assert digest(Path(row["path"]).read_bytes()) == row["sha256"], row["path"]
    exe = Path(manifest["executable"]["path"])
    executable = exe.read_bytes()
    assert digest(executable) == manifest["executable"]["sha256"]
    constant = exe.parent / "levels/constant.dat"
    assert digest(constant.read_bytes()) == manifest["constantsSha256"]
    fixture = json.loads((PACKET / "fixture.json").read_text())
    assert fixture["limits"] == {
        "nativeInstructions": 100000, "nativeTimeoutMicroseconds": 1000000,
        "portSeconds": 5, "outerSeconds": 15,
        "nativeInvocations": 1, "portInvocations": 1, "retry": False,
    }
    assert fixture["allowlist"]["interceptions"] == []
    expected_people = bytearray()
    for row in fixture["people"]:
        raw = bytearray(256)
        for name, field in fixture["fields"].items():
            struct.pack_into("<" + field["format"], raw, field["offset"], row["native"][name])
        struct.pack_into("<8H", raw, 0x8b, *row["native"]["commands"])
        assert row["native"]["flags2"] == 0x20000
        assert row["unit"]["hp"] * 20 == row["native"]["life"]
        assert round((row["unit"]["x"] + 8) * 256) == row["native"]["x"]
        assert round((-row["unit"]["z"] - 8) * 256) == row["native"]["y"]
        expected_people.extend(raw)
    assert expected_people == (PACKET / "people-input.bin").read_bytes()
    expected_pool = bytearray(8000)
    struct.pack_into("<BB4H", expected_pool, 10, 3, 0, 1, 0, 0x2300, 0x2100)
    assert expected_pool == (PACKET / "orders-input.bin").read_bytes()
    for row in fixture["rawInputs"]:
        data = (PACKET / row["path"]).read_bytes()
        assert len(data) == row["bytes"] and digest(data) == row["sha256"]
    for row in fixture["abi"]["functions"]:
        assert digest(pe_bytes(executable, row["entry"], row["stopExclusive"])) == row["nativeBytesSha256"]
    return manifest, fixture, exe


def write_json(path, value):
    path.write_text(json.dumps(value, indent=2) + "\n")


def native_once(fixture, executable, output, tools, input_directory=PACKET):
    # Imports remain behind the explicit execution gate.
    import unicorn
    from unicorn import UC_HOOK_CODE, UC_HOOK_MEM_READ, UC_HOOK_MEM_WRITE
    from unicorn import UC_HOOK_MEM_INVALID, UC_MEM_WRITE
    from unicorn import x86_const as x86
    from decomp import native_cpu, configure_native_constants
    from unicorn.unicorn_py3.unicorn import uclib

    assert Path(unicorn.__file__).resolve() == Path(tools["unicornModule"]).resolve()
    assert Path(uclib._name).resolve() == Path(tools["unicornLibrary"]).resolve()
    assert unicorn.__version__ == tools["unicornVersion"]

    cpu, identity = native_cpu(executable)
    configure_native_constants(cpu, executable)
    abi = fixture["abi"]
    cpu.mem_map(abi["scratchMapAddress"], abi["scratchMapBytes"])
    raw_people = (input_directory / "people-input.bin").read_bytes()
    pool = fixture["pool"]
    stack, stop = abi["stack"], abi["stop"]
    for index, row in enumerate(fixture["people"]):
        cpu.mem_write(row["address"], raw_people[index * 256:(index + 1) * 256])
    cpu.mem_write(pool["address"], (input_directory / "orders-input.bin").read_bytes())
    pointer_count = len(fixture["people"]) + 1
    cpu.mem_write(0x890390, struct.pack(f"<{pointer_count}I", 0, *[p["address"] for p in fixture["people"]]))
    cpu.mem_write(0x8a03e4, bytes(16384 * 16))
    cpu.mem_write(0x8a03e4 + fixture["world"]["cell"] * 16 + 6, struct.pack("<H", 1))
    cpu.mem_write(pool["cursorAddress"], struct.pack("<HH", pool["cursor"], pool["active"]))
    cpu.mem_write(0x9608b6, bytes(fixture["world"]["alliances"]))
    cpu.mem_write(0x895da4, struct.pack("<I", fixture["world"]["levelFlags2"]))
    cpu.mem_write(0x89d178, struct.pack("<II", fixture["world"]["simulationRandom"], fixture["world"]["gameFlags"]))
    cpu.mem_write(0x89bc72, struct.pack("<I", fixture["world"]["cosmeticRandom"]))
    cpu.mem_write(stack, struct.pack("<II", stop, fixture["people"][0]["address"]))
    for name, value in abi["initialRegisters"].items():
        cpu.reg_write(getattr(x86, "UC_X86_REG_" + name), value)
    cpu.reg_write(x86.UC_X86_REG_ESP, stack)

    def read(address, fmt):
        return struct.unpack("<" + fmt, cpu.mem_read(address, struct.calcsize("<" + fmt)))[0]

    def snapshot():
        return {
            "peopleHex": [bytes(cpu.mem_read(row["address"], 256)).hex() for row in fixture["people"]],
            "poolHex": bytes(cpu.mem_read(pool["address"], 8000)).hex(),
            "cursor": read(pool["cursorAddress"], "H"), "active": read(pool["activeAddress"], "H"),
            "simulationRandom": read(0x89d178, "I"), "cosmeticRandom": read(0x89bc72, "I"),
            "unitPointersHex": bytes(cpu.mem_read(0x890390, pointer_count * 4)).hex(),
            "terrainCells": [{"address": row["address"], "hex": bytes(cpu.mem_read(row["address"], row["size"])).hex()}
                             for row in fixture["allowlist"]["read"] if row["name"].startswith("terrain cell")],
            "stackHex": bytes(cpu.mem_read(stack - 4096, 4104)).hex(),
        }

    result = {"identity": identity, "unicorn": unicorn.__version__,
              "unicornModule": unicorn.__file__, "unicornLibrary": uclib._name, "before": snapshot(),
              "calls": [], "memory": [], "instructionCount": 0, "interceptedLeaves": []}
    frames = []
    entries = {row["entry"]: row for row in abi["functions"]}

    def returned(address):
        frame = frames.pop()
        assert cpu.reg_read(x86.UC_X86_REG_ESP) == frame["sp"] + 4, "cdecl stack drift"
        bits = frame["function"]["returnBits"]
        event = {"phase": "return", "entry": frame["function"]["entry"], "pc": address,
                 "rawEax": cpu.reg_read(x86.UC_X86_REG_EAX),
                 "value": cpu.reg_read(x86.UC_X86_REG_EAX) & ((1 << bits) - 1) if bits else None}
        if frame["function"]["entry"] == 0x51f030:
            event["friendlyPointer"] = read(frame["args"][6], "I") if frame["args"][6] else None
            event["threatPointer"] = read(frame["args"][8], "I") if frame["args"][8] else None
        result["calls"].append(event)

    def code_hook(machine, address, size, _):
        result["instructionCount"] += 1
        assert any(row["entry"] <= address and address + size <= row["stopExclusive"] for row in entries.values()), f"Unexpected code {address:08x}"
        if frames and frames[-1]["return"] == address:
            returned(address)
        if address in entries:
            function = entries[address]
            sp = machine.reg_read(x86.UC_X86_REG_ESP)
            args = [read(sp + 4 + index * 4, "I") for index in range(function["argumentSlots"])]
            frames.append({"function": function, "sp": sp, "args": args, "return": read(sp, "I")})
            event = {"phase": "enter", "entry": address, "sp": sp, "args": args}
            if address == 0x438730:
                event["payloadHex"] = bytes(machine.mem_read(args[2], 4)).hex()
            result["calls"].append(event)

    def memory_hook(machine, access, address, size, value, _):
        kind = "write" if access == UC_MEM_WRITE else "read"
        permitted = any(row["address"] <= address and address + size <= row["address"] + row["size"]
                        for row in fixture["allowlist"][kind])
        event = {"kind": kind, "pc": machine.reg_read(x86.UC_X86_REG_EIP),
                 "address": address, "size": size, "allowed": permitted,
                 "beforeHex": bytes(machine.mem_read(address, size)).hex()}
        if kind == "write":
            event["valueHex"] = (value & ((1 << (size * 8)) - 1)).to_bytes(size, "little").hex()
        result["memory"].append(event)
        assert permitted, f"Unexpected {kind} at {address:08x}+{size}"

    def invalid_hook(machine, access, address, size, value, _):
        result["invalidMemory"] = {"access": access, "address": address, "size": size}
        return False

    cpu.hook_add(UC_HOOK_CODE, code_hook)
    cpu.hook_add(UC_HOOK_MEM_READ | UC_HOOK_MEM_WRITE, memory_hook)
    cpu.hook_add(UC_HOOK_MEM_INVALID, invalid_hook)
    write_json(output / "native-before.json", result["before"])
    try:
        cpu.emu_start(abi["entry"], stop, count=fixture["limits"]["nativeInstructions"],
                      timeout=fixture["limits"]["nativeTimeoutMicroseconds"])
        assert cpu.reg_read(x86.UC_X86_REG_EIP) == stop, "Native timeout/instruction limit or incomplete return"
        assert len(frames) == 1 and frames[0]["return"] == stop
        returned(stop)
        for name in ("EBX", "ESI", "EDI", "EBP"):
            assert cpu.reg_read(getattr(x86, "UC_X86_REG_" + name)) == abi["initialRegisters"][name]
        result["status"] = "returned"
    except BaseException as error:
        result["status"] = "failed"
        result["error"] = f"{type(error).__name__}: {error}"
        raise
    finally:
        result["after"] = snapshot()
        write_json(output / "native.json", result)
    return result


def compare(fixture, native, port):
    entered = [row for row in native["calls"] if row["phase"] == "enter"]
    for function in fixture["abi"]["functions"]:
        assert sum(row["entry"] == function["entry"] for row in entered) == function["expectedCalls"]
    expected_sequence = [0x4d4690, 0x51ff60, 0x4d44e0, 0x51e7b0, 0x51ff60, 0x4df140,
                         0x51f030, 0x51f030, 0x4de7b0, 0x4de7b0, 0x436c20, 0x438730, 0x436d00]
    assert [row["entry"] for row in entered] == expected_sequence
    returned = [row for row in native["calls"] if row["phase"] == "return"]
    scans = [row for row in entered if row["entry"] == 0x51f030]
    for index, row in enumerate(scans):
        args = row["args"]
        assert args[0] == fixture["people"][0]["address"] and args[1] & 0xffff == 0x2020
        assert args[2:5] == [index * 2, index * 2, 0]
        assert args[5] & 255 == 0 and args[7] & 255 == index
    scan_returns = [row for row in returned if row["entry"] == 0x51f030]
    assert [row["value"] for row in scan_returns] == [0, 2]
    assert [row["friendlyPointer"] for row in scan_returns] == [0, 0]
    assert [row["threatPointer"] for row in scan_returns] == [None, fixture["people"][1]["address"]]
    assert [row["value"] for row in returned if row["entry"] == 0x51e7b0] == [0]
    assert [row["value"] for row in returned if row["entry"] == 0x51ff60] == [1, 1]
    assert [row["value"] for row in returned if row["entry"] == 0x4d44e0] == [1]
    assert [row["value"] for row in returned if row["entry"] == 0x4df140] == [0]
    assert [row["value"] for row in returned if row["entry"] == 0x436c20] == [2]
    prepare = next(row for row in entered if row["entry"] == 0x438730)
    assert [prepare["args"][0] & 65535, prepare["args"][1] & 255, prepare["args"][3] & 255] == [2, 32, 32]
    assert prepare["payloadHex"] == "00210021"
    attach = next(row for row in entered if row["entry"] == 0x436d00)
    assert attach["args"] == [fixture["people"][0]["address"], 2, 0xffffffff]
    before, after = native["before"], native["after"]
    raw = bytearray.fromhex(before["peopleHex"][0])
    struct.pack_into("<I", raw, 0x0c, 0x20010)
    struct.pack_into("<H", raw, 0x83, 0x2021)
    struct.pack_into("<H", raw, 0x9b, 2)
    assert after["peopleHex"] == [raw.hex(), before["peopleHex"][1]]
    pool = bytearray.fromhex(before["poolHex"])
    struct.pack_into("<BB4H", pool, 20, 32, 32, 1, 0, 0x2100, 0x2100)
    assert after["poolHex"] == pool.hex()
    assert (after["cursor"], after["active"]) == (3, 2)
    for key in ("simulationRandom", "cosmeticRandom", "unitPointersHex", "terrainCells"):
        assert after[key] == before[key]
    assert port["result"] is False and port["after"] == port["before"]
    assert port["before"]["poolHex"] == before["poolHex"]
    for row, person in zip(fixture["people"], port["before"]["people"]):
        assert all(person[key] == value for key, value in row["native"].items())
    for key in ("simulationRandom", "cosmeticRandom"):
        assert port["before"][key] == before[key]
    changes = []
    for index, (old, new) in enumerate(zip(bytes.fromhex(before["peopleHex"][0]), raw)):
        if old != new:
            changes.append({"offset": index, "before": old, "after": new})
    assert changes == fixture["expected"]["sourceRawByteChanges"]
    return {"status": "expected-mismatch-confirmed", "nativeProducerReturnAL": 0,
            "nativeImmediate": 2, "portImmediate": port["after"]["people"][0]["immediateCommand"],
            "sourceRawByteChanges": changes, "claim": "One supplied response-producer path; no ordinary campaign or sermon execution."}


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--execute", action="store_true")
    parser.add_argument("--expected-source-head")
    parser.add_argument("--expected-manifest-sha")
    args = parser.parse_args()
    manifest, fixture, executable = preflight(args)
    if not args.execute:
        print("PASS: host-only source/input/ABI fixture guards; native and application not run")
        return
    assert args.expected_source_head and args.expected_manifest_sha, "Execution requires externally pinned source and manifest"
    assert os.environ.get("PND_PREACHER_RESPONSE_SUPERVISED") == "1", "Use the reviewed external supervisor"
    assert sys.flags.ignore_environment and not sys.flags.optimize and sys.flags.no_user_site
    assert Path(sys.executable).resolve() == Path(manifest["python"]).resolve()
    assert os.sched_getaffinity(0) == {4}, "The one comparison requires CPU4"
    assert not os.environ.get("NODE_OPTIONS") and not os.environ.get("NODE_PATH")
    output = ROOT / manifest["output"]
    output.mkdir(parents=True, exist_ok=False)
    receipt = {"status": "running", "sourceHead": args.expected_source_head,
               "manifestSha256": args.expected_manifest_sha, "retry": False,
               "pid": os.getpid(), "processGroup": os.getpgrp(), "cpuAffinity": sorted(os.sched_getaffinity(0)),
               "python": {"executable": sys.executable, "version": sys.version, "flags": str(sys.flags)}}
    write_json(output / "launch.json", manifest)
    write_json(output / "receipt.json", receipt)
    def timeout(_signal, _frame):
        raise TimeoutError("Outer 15-second proof limit")
    signal.signal(signal.SIGALRM, timeout)
    signal.alarm(fixture["limits"]["outerSeconds"])
    try:
        native = native_once(fixture, executable, output, manifest["toolIdentity"])
        command = [manifest["node"], str(ROOT / "scripts/preacher-response-pair.mjs"), str(PACKET / "fixture.json")]
        try:
            run = subprocess.run(command, cwd=ROOT, capture_output=True, text=True,
                                 timeout=fixture["limits"]["portSeconds"])
        except subprocess.TimeoutExpired as error:
            (output / "port.stdout").write_bytes(error.stdout or b"")
            (output / "port.stderr").write_bytes(error.stderr or b"")
            raise
        (output / "port.stdout").write_text(run.stdout)
        (output / "port.stderr").write_text(run.stderr)
        assert run.returncode == 0, f"Production runner exited {run.returncode}; raw output retained"
        port = json.loads(run.stdout)
        write_json(output / "port.json", port)
        comparison = compare(fixture, native, port)
        write_json(output / "comparison.json", comparison)
        preflight(args)  # Reject source/input drift across the sole observation.
        receipt["status"] = "expected-mismatch-confirmed"
        print(json.dumps(comparison))
    except BaseException as error:
        receipt["status"] = "failed"
        receipt["error"] = f"{type(error).__name__}: {error}"
        raise
    finally:
        signal.alarm(0)
        write_json(output / "receipt.json", receipt)


if __name__ == "__main__":
    main()
