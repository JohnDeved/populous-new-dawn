# Fixed command17 terminal restart proof

Status: implemented source only. Native, application and browser execution are
not run. Exact code review and a separate parent execution grant are required.
This is a fork of the accepted small sermon comparison, not an orchestration change.
PR240, the old 27-case/63-pair history, run-01 and replay-02 remain untouched.

## Identity and supplied domain

Application base: `b2b04cf4915dafc7165e961f9b45ddb3efd4d103`.
Proposal manifest: `89618e3925f71449a53213d0a2cfec113ef9b0e57f62c807b341d13298ae47dd`.
Independent proposal review: `bd5176c9020838f6b641c7e712121a42c3c42bad2082b12f75292d0c29dcce8e`.
Canonical executable: `3a5065c7420b3fcde208bf220bc86dfbac95e025ab2492caf9c7ea5308dfbe4f`.
The preflight binds all three proposal files and their manifest, review artifacts,
input files, original instructions/tables, Python/Capstone/Unicorn/Node tool files,
the local import closure and source. Final raw256 hash is
`2500416fce721fbd6ea1a73979c125f0f72ca3059d584c82997099c024ca7290`.

Exactly one case: actor3164, sole command26/model17, no listeners, counter149,
timer839/substate3, source168/draw14, f1=0/f2=5. Run exactly three controller/updater
pairs at counters150/151/152 and supplied serials4246/4247/4248. Order26 lives at
00938934 with ten bytes110001000000002b009f and payload11008/40704. Both RNG words
are explicit and invariant. MaxLife1100 is unobserved; a native read hook rejects
any selected-instruction read of its two supplied bytes. Unknown record bytes are
zero-filled supplies, not a captured original allocation.

Actual cdecl controller0043a4d0, stop004d4ee0, upper004d4040, lower004ee700 and
updater004ee7b0 execute within the same CPU instance and retained person state.
Only acquisition0043abf0 is intercepted, returning zero and preserving status bit2;
its stack-out is untouched. The caller supplies the original argument stack, with
ECX zero, bounded stack and a sentinel plain-ret check. Every other leaf/call or
unlisted memory write fails. Full raw256, all45 fields, both RNGs, order raw bytes,
commands/owner, serial/stamp, controller AL and exact ordered event states are kept
at all four phases. Raw differences and the port lower-setter-intent boundary are
never normalized or masked. Unexpected person bytes are retained then rejected.

Pair2 native48/16 versus port168/14 is a static prediction until this source runs.
A missing source/frame distinction rejects the hypothesis. The transient entry-bit
difference alone establishes no lasting or visible gameplay impact. Expected
pair1/3 outcomes and event ordering are assessed separately and all mismatches stay
in the raw evidence. No runtime repair, whole-sermon equality or rendered impact is
claimed by this component proof.

## Host checks and proposed launch

Host-only check (no Unicorn/application/Node execution):

```
/workspace/scratch/69fd8163d94e/cloud-dev-20261004/prerequisites/venv/bin/python \
  decomp/research/preacher-terminal-restart/test_host.py
```

The source-only `compare.py --validate` hashes inputs and disassembles canonical
bytes as data. It does not import Unicorn or application modules or start Node.
The Node runner's complete local import closure contains eight repository files
and Node built-ins only. No node_modules move, copy, link, installation or package
command is needed. App/public/package files and shared harness remain unchanged.

After exact code acceptance and a separate execution grant, reserve CPU4 and run
once from this isolated checkout, with stdout/stderr captured by the existing
parent receipt mechanism:

```
timeout --signal=TERM --kill-after=3s 27s taskset -c 4 \
  /workspace/scratch/69fd8163d94e/cloud-dev-20261004/prerequisites/venv/bin/python \
  decomp/research/preacher-terminal-restart/compare.py --execute
```

Hard limits: one case; three controller calls; three updater calls;100000
instructions and1s per call;10s total native;15s port;27s outer TERM with3s cleanup.
The script validates exact CPU affinity. It refuses an existing output directory:
`work/orchestration/preacher-terminal-restart/run-01`. No retries or expanded case
search are included. Preserve failed outputs. Port timeout handling captures both
streams and terminal status, and Python always checks input/source/tool identity
on ordinary success/failure. An outer kill can interrupt Python cleanup; in that
case the parent must retain the exit/signal and run the same source-only preflight
as the postflight identity check, without rerunning the proof.

## Limits and next decision

The original scheduler/callers, routes, physics, queue completion and renderer are
excluded. No turning, positive listeners,31/32, arrival, active-at840 gesture,
following-order completion, Save/Load, asset work, clocks, mixer RNG or OS-game
execution is allowed. Npm/full check/build/browser jobs are not applicable to this
source-only research proof and are expressly excluded by the assignment.

If the reviewed proof supports the predicted distinction, the parent decides on
one separately granted ordinary observation: same stable command17 owner, no
listeners or interruptions, at most900 logical visits/120s after loop entry.
Capture any presented intermediate restart family; a skipped interval remains a
missing rendered witness. Gameplay changes remain a later decision.
