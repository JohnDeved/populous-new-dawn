# Conditional constructor progression and retained harness failures

Issue #29, research only. Four subsequent attempts use explicit selected-state
conditions at source HEAD `044028f2e2fe75055c3ffd2f01e44783abe037fd`.
None completes an allocation or authored record. Class1 remains untouched; the
first class2 allocation's counter copy 0/increment 1 remains a partial mutation.
There is no recovered actual Mission 3 startup seed or accepted training fix.

## Results and review depth

- Run03 executes genuine job/queue setup and terrain brightness, then one narrowly
  guarded texture/cache projection. It stops before CALL `00404c15→0041b3f0`,
  which was missing from admitted code despite appearing in retained static FLOW
  evidence. All 2,549,938 observer events independently reconcile with timed
  supplies and known masks. This includes 49 brightness writes and 49 statistic
  increments at `0044de5b`; the other statistic increment has synthetic coverage
  only. Seven calls remain open. The rejected CALL makes no stack write.
- Run04 stops at the 240-second animation setup limit, 4,494 committed instructions
  before the prior animation endpoint. No constructor begins. Review verifies
  identities, terminal state and checkpoint consistency, not full event replay.
- Run05 stops before the texture projection because a strengthened guard omitted
  the already observed first-hut caller `00404be6→00403a00`. The corresponding
  run03 calls are 2080 and 2090. Its registers match the old projection entry;
  review confirms zero projection invalidations or omitted-range memory events.
- Run06 passes both legitimate hut texture contexts, each with its declared
  invalidations, then stops before `00404153: IDIV DWORD [ESP+0x3c]`, an unsupported
  operand form in the harness. The rejected instruction has an empty write journal
  and no memory events. This is not evidence of division by zero or unknown input.
  Review verifies the exact failure transaction and identities, not full CPU or
  mask replay.

All processes are terminal exit 2 and preserve their frozen driver hashes. Engine
instruction counts and observer ordinals are different kinds of evidence; no
independent CPU arithmetic replay or performance equivalence is claimed.

## Corrections to historical review claims

The retained correction addendum identifies exact old artifacts and claim locations.
They remain unchanged so the original record is inspectable.

1. The proposed animation budget change from 240 to 300 seconds was wired into
   `Ledger.cut`, but setup called `e.run` directly with 240 seconds. Thus runs05
   and06 actually passed animation under the original 240-second limit. The
   declared extra headroom was ineffective. Progress cannot be attributed to it.
   A regression through the actual setup dispatcher reproduces the wiring defect.
2. Earlier positive context tests derived their expectations from the production
   allowlist. Removing a valid context therefore also removed its coverage.
   Independently specified immutable fixtures now bind the full historical call
   frames to exact run03 result hashes and canonical call bytes. The same fixture
   reproduces the old failure and passes the exact-tuple repair; new contexts and
   rejection-without-side-effects cases are independently enumerated too.

The missed call admission, guard regression and unused budget wiring were harness
engineering errors. They are not new game-behavior discoveries. No permissive
fallback or guessed executable return was introduced to bypass them.

## Conditions and next bounded step

The diagnostic remains conditioned on selected RNG/class-counter state, named
mode/reset/level inputs and their lifetimes, successful canonical transport,
concrete live mappings, and hashed model-derived terrain. It is not a captured
native Mission 3 initialization. Earlier unknown history is not proved neutral.

The exact cache projection preserves genuine terrain brightness and the final
landscape-dirty operation, while declaring its skipped direct outputs, scratch
stack, registers and flags unknown. Opaque resource writes require a valid live
domain disjoint from retained state and normal completion. Those are conditions,
not an assertion that arbitrary resource code is irrelevant. Unknown consequential
consumers and unadmitted calls still stop.

A finite source inventory distinguishes direct-model exclusions from unresolved
nested/terrain/job/state paths. The admitted-set operand audit covers 9,332
canonical instructions across 91 windows and identifies the observed memory IDIV
and an unexecuted SETLE byte form as concrete capability gaps. Next is a separately
reviewed minimal semantics repair and actual timeout-dispatch test, followed by
one bounded retry if admitted. This does not claim complete reachable-call closure.

## Evidence

Per-run archives and the manifest retain compressed original observer/result
receipts, frozen drivers, source contracts, tests, approvals, process identities,
independent reviews and the correction addendum. No whole original executable or
original assets are redistributed. Earlier base evidence is in the linked
[first allocator stop](../mission3-constructor-stop-2026-10-11/README.md).

Historical verifiers retain absolute paths and require explicit path adaptation,
separately supplied canonical executable/level assets and their pinned Python
packages. Review scripts are read-only and do not execute original code. Gzip
results are lossless; no expanded disk duplicates are needed. Exact review depth
is recorded per attempt, rather than upgrading limited failure checks to full
semantic acceptance.

Publication uses independent artifact review, structural checks and diff checking.
Full product gates are not applicable. Product/main/deployment are unchanged;
rejected candidates and unchanged Mission 2 acceptance remain blocking.
