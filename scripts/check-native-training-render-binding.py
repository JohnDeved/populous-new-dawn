#!/usr/bin/env python3
"""Validate a bounded native training painter descriptor/selector receipt."""
import argparse, hashlib, json
from pathlib import Path
p=argparse.ArgumentParser()
p.add_argument("receipt",type=Path)
p.add_argument("--sha256")
a=p.parse_args()
raw=a.receipt.read_bytes()
if a.sha256:
 assert hashlib.sha256(raw).hexdigest()==a.sha256
r=json.loads(raw)
assert r["head"]=="19b31d3572548cdc933ed533efeed78f2555b48a"
assert r["status"]=="BLOCKED"
assert r["pixelDiagnostics"]=="not-run"
assert r["arenaBound"] is True and r["triangles"]==47
assert r["turnAtStop"]==49 and r["frameAtStop"]==193
assert r["eipAtStop"]=="0x52a7fc"
assert len(r["selectorBindings"])==1
b=r["selectorBindings"][0]
assert b=={"turn":49,"frame":193,"producer":"0x4b2650","owner":"0x3200000","descriptor":"0x320000c","descriptorKind":"0x0","selectorFunction":"0x5281c0","selector":"0xd05b10"}
print("PASS: authentic original descriptor/selector binding preserved 47 triangles and stopped before unsupported virtual dispatch; pixels not run")
