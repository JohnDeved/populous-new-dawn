# Exact-source preflight review

**ACCEPT** `cff436a3b1f3e19470fd533b658d607829caad70` for the documented
two-pair experiment, pending the coordinator's separate CPU4 lane grant.
No blocking code, ABI, fixture, boundary or resource defect was found. This
accepts preparation for one bounded run, not execution results or runtime parity.

Manifest SHA256:
`2eeaea9a1831986d312366c23cd388d68f2d2be7bef380b0b463d9ccc0be97f3`.
Tracked checkout was clean before and after review. Only this ignored report was
written. Native/portable execution, phase-A tests, package jobs, browser, runtime
edits, authentication and publication were not performed.

## What was verified

- Inspected both complete drivers, the two-case/seven-person fixture, full
  preflight manifest, documentation and source diff from accepted proposal
  `3fdced28`. All 221 source fingerprints and 31 tool/input fingerprints match.
  All five byte-range hashes and the canonical EXE hash match. Static Python AST
  parsing and `git diff --check 3fdced28..HEAD` pass (exit0).
- Independently walked the portable static import graph: exactly217 files,
  including the adapter, with no external npm dependency and no unbound file.
  This is a conservative static source identity check, not a runtime import
  claim. The loader bytes exactly equal the accepted issue227 worktree's loader;
  its optional change alone is reused.
- All seven person records match raw Mission3 records46–52, with controlled
  IDs301–307. Browser X/Z match signed fixed-point conversion. The full roster,
  ordering, flags, assignment, busy, vehicles, empty orders and presentation
  mapping are checked through the actual adapter before native execution.
- Actual `stepComputerTasks(world,2)` dispatches slot0 on turn2047. Its actual
  staging/selection-world expressions execute. Prior imports preserve the
  original controller and selector functions; later adapter imports see the
  delegating module mocks. The observed callback returns through actual flags3
  copyback before the controller wrapper throws its identity sentinel. Exact
  world equality allows only selected flags3 bit0 and remaining0→1; selected
  count, members, people, orders, paths, RNG and queue cursor cannot change.
  The mocking mechanism matches the documented [Node24 module-mock contract](https://nodejs.org/docs/latest-v24.x/api/test.html#mockmodulespecifier-options).
  Runtime availability/interception still must succeed in the bounded run.
- Native task initialization agrees with cdecl `004cb400(ai,0)` and native task
  stride0x52. The real origin, selector and eligibility leaves are not replaced.
  Nine actual selector arguments are asserted and retained. The boundary hook
  stops before004cb6da, then independently asserts the still-unpopped arguments,
  EIP and returned EAX count. No later count/person preparation is permitted.
- Native write guards cover only stack, 400-byte scratch, visit counter, cursor
  and person flags3. Full person/task/order comparisons narrow permitted changes
  further. RNG is fixed; queue cursor remains0. Abort addresses cover the named
  deferred paths. The report correctly does not claim a function-entry allowlist.
  The verified PE mapping is0x400000–0xd4c000; every fixed native data address
  fits, and supplied people/stack fit the separate256KiB mapping.
- The explicit comparison is selector/count/IDs/ranks/all flags3/task/RNG.
  Native and portable tribe inputs, including the intentional radius0/11
  inequality, remain visible outside that comparison. Passing pair0 cannot
  claim whole-world or radius equivalence. No predictions are substituted for
  actual results or asserted as observed IDs.
- Node reads one JSON-line request and emits one result. Python compares pair0
  before requesting pair1; a mismatch breaks immediately. No unrequested case
  executes. Both sides cap cases at2. The stdout protocol rejects extra lines
  and shutdown rejects unsolicited output. A portable record is retained before
  native setup, including when native setup subsequently fails.
- Python/native and Node share one bounded run, with sequential requested work.
  Native uses the accepted16MiB TCG setter/readback, 1GiB address-space cap,
  30-second CPU cap, 60-second alarm and per-call time/instruction caps. Node
  starts before the parent address-space restriction, uses256MiB old space,
  and has a parent20-second response deadline plus watchdog. Output/trace caps
  and a two-second parked-peer shutdown with kill are explicit. The documented
  outer65-second timeout with five-second kill grace remains part of the exact
  coordinator payload, not something this script silently replaces.

## Run interpretation

Execute only the frozen payload under a fresh source/input-bound receipt after
the separate grant. A successful control followed by the predicted mismatch is
exit1 with status `mismatch`; retain the failed receipt and both pairs. A mock,
import, assertion, shutdown, memory, CPU or time failure is a probe failure, not
an origin observation. Hard OS resource termination may leave no final JSON;
the outer receipt's termination still cannot be interpreted as parity evidence.

No automatic retry, runtime repair or third/fourth case follows this acceptance.
Natural raid identities, established-base output comparisons, radius-specific
output comparisons, later phases and whole-world list construction remain open.
No CPU/browser/Ghidra lane or running process is held by this reviewer.
