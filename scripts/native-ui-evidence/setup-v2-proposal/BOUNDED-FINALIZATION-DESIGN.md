# Bounded finalization and diagnosis design (not implemented)

## Preserved failure and what it establishes

Failed attempt: evidence/supervisor-kernel-failed-01.json at fcd661a3d67f92e4f2ff0000a6b39e0e73092c30, independently verified as failure. Both child-case receipts were verified, but the harness remained running without final hashes. The controller timed out its parent wait, terminated/reaped its direct parent and failed. Whole wrapper elapsed26.238s versus controller-recorded11.877s: setup/final metadata work also occurred outside that parent wait.

Source position makes final hashing or receipt I/O plausible, not diagnosed. No stack sample identifies the blocked operation. Do not rewrite the failed attempt, call it passed, merely raise its timeout, or rerun the kernel cases to investigate metadata.

## Design goal

Separate kernel-case timing from metadata/receipt timing while retaining exact executable and source binding. Overall success requires all stages and durable final receipt; completed child assertions alone never suffice. This document changes no executed code, deadline or workflow.

## New ownership and phase boundaries

1. A minimal infrastructure-owned coordinator owns the parent, metadata worker and receipt writer as direct child handles. No negative-PGID destructive signals. Retire every handle's destructive actions at exit. Keep existing read-only group observation and failure-on-unverified behavior.
2. A pinned metadata worker performs all file hashing, with bounded memory/chunk size, per-file monotonic timings, explicit start/end messages and byte counts. No synchronous whole-executable hashing in the kernel parent or coordinator.
3. A pinned receipt writer acknowledges each durable stage-start record before that stage starts. It writes a candidate-complete artifact only after the predicates are satisfied; no artifact alone is authoritative success. Failure/timeout retains the latest acknowledged journal and partial files; inability to persist is itself failure. Writer work, including fsync and writer exit/reap, remains within the global deadline.
4. Kernel parent begins at an admission barrier with no case children. Bind its PID/PPID/PGRP/SID/starttime and actual executable through /proc/PID/exe while that owned parent is alive. The same live metadata worker opens the executable read-only, retains that exact descriptor across both hashes and records inode/device plus the parent identity. No reopen or worker replacement is permitted in this version; worker death or descriptor loss fails the run. It hashes the actual executable bytes against the existing expected SHA256 before release. A path-only hash is not a substitute for the executable actually launched.
5. Source closure hashes are also verified before release. Record exact metadata-worker/writer/coordinator/harness/supervisor/observer identities; metadata and writer code are part of the admitted closure.
6. Release the kernel parent and start the unchanged10s kernel-case budget. Child cases remain exactly normal and direct-child deadline cases. Parent checkpoints each verified case. On completion it persists/emits cases-verified and waits at a finalization barrier. It must not set passed.
7. End the kernel-case clock at the authenticated cases-verified event, not at parent process exit. Begin finalization-start, then per-file hash-start/hash-end, comparison-start/end, and receipt-commit-start/end. Fully rehash the retained executable descriptor and source closure. Parent remains alive/owned during this stage; never resolve a reused numeric PID to obtain the after executable.
8. Compare complete before/after bytes and identities. Release the parent to exit and require zero exit/reap; close the retained descriptor and require metadata-worker zero exit/reap. Verify exact case results, no interventions and fresh read-only child-group absence. Then writer commits a candidate-complete artifact, sends its digest acknowledgment and exits. Require writer zero exit/reap with no late errors. Only then may the coordinator emit its terminal manifest and exit zero. The outer owner must observe coordinator zero exit/reap and no watchdog failure. Failed, pending, rejected, missing or late stages cannot become passed. See the authoritative acceptance contract below.

## Proposed budgets, requiring qualification before implementation acceptance

These are explicit fail-closed ceilings to review, not measurements or approved increases:
- IPC frames and retained stage records: bounded schema, at most64KiB each; reject malformed/extra/late responses.
- Hash reads: at most1MiB per chunk, no full126.9MB executable allocation. One complete actual-executable hash before cases and one after, not duplicate hashes in both parent and controller.
- Small source-closure validation:2s per before/after stage.
- Executable hashing:5s each before/after stage; stop and report the exact incomplete file/stage if not complete. Do not run kernel cases when the before stage misses its allowance.
- Kernel cases: original10s, not increased.
- Receipt commit:2s, with timed writer acknowledgment rather than an unbounded synchronous coordinator write.
- Coordinator work budget:26s across all stages, never the sum of resettable per-call clocks. Reserve4s TOTAL for cleanup of all simultaneously owned parent/metadata/writer handles. Retire admission first; send TERM concurrently to eligible live direct handles, wait under one shared2s deadline, then send KILL concurrently only to still-owned eligible handles and wait under the remaining shared2s deadline. Never spend2+2s serially per handle or reset a deadline for a late handle. Retire signalling individually on each exit; missing close/reap or failed signalling at reserve exhaustion remains unverified. No work stage may consume that reserve.
- A separately owned external execution watchdog must cover the coordinator as well. One trusted outer monotonic owner starts global accounting BEFORE watchdog/coordinator bootstrap, source pinning, hashing, output creation or the first await. Bootstrap time is subtracted, not hidden before the timer. Every spawn, IPC, journal acknowledgment, exit/reap and state transition is constrained by the same remaining allowance. No assumption that per-stage maxima alone leave overhead slack is permitted. If the environment cannot account for bootstrap or supply that outer owner, the whole-operation bound is unqualified and kernel execution stays blocked.

The proposed26+4s whole-operation accounting is not permission to retry or a blind larger kernel deadline. The26s equals the nominal stage maxima and therefore has no guaranteed spare allowance: actual transitions must use the shared remaining budget and can fail earlier. It is not a promise that all maximum-duration stages plus overhead can complete. Per-stage diagnosis must first show whether metadata can meet its ceiling. Budget changes require a new reasoned review, not automatic retries. OS scheduling/uninterruptible I/O can defeat a timely cleanup guarantee; such outcomes remain unverified/failure, never claimed contained.

## Diagnosis before any kernel retry

First implement/review supplied-boundary controls, then independently admit a metadata-only diagnostic. It must use the same executable/source bindings and chunked worker/writer implementation, report per-file start/end/bytes/duration, and never spawn kernel-case children. This determines whether hashing, receipt commit or another metadata boundary fails. Preserve a failure as failure; no automatic rerun or deadline expansion.

Only after that result is independently reviewed may a new separately admitted kernel attempt use the revised pipeline. Use a fresh output directory and new source identity. Preserve failed-01 unchanged.


## Authoritative terminal outcome (not a file-only passed flag)

The writer's durable artifact is marked candidate-complete, never independently passed. It may exist even if writer/coordinator/watchdog later fails. Acceptance is a conjunction: candidate digest and contents validated; all parent/metadata/writer handles zero-exited and reaped; bounded terminal manifest from the expected coordinator; coordinator zero-exit/reap observed by its outer owner; no late errors/interventions/watchdog failure; and the outer execution service's completed successful outcome. A missing component, nonzero exit or unresolved handle overrides a previously written candidate.

The terminal manifest binds the candidate digest, run identity, expected source/executable identities, phase sequence, all handle lifecycle outcomes and final group observations. It is emitted only after writer exit/reap, not merely after writer ACK. The outer owner retains raw terminal streams plus its observed coordinator outcome. Consumers MUST NOT infer whole-run success by scanning for a candidate-complete or historical passed JSON file. If the outer owner cannot finish recording its outcome, completion is unverified; a durable candidate cannot rescue it. No recursive claim that a writer can certify its own future exit is made.

## Phase authentication and retained descriptor lifetime

Use unique run nonce and per-phase nonce/sequence on private inherited IPC channels, bound at spawn to the exact actor role, source digest and direct-handle PID/starttime. Only the currently expected actor/phase/nonce/sequence can acknowledge work. Reject duplicate, out-of-order, late, wrong-role or old-before-hash responses. Retiring a phase or actor permanently revokes its acceptance; no response can be relabeled for an after-hash or replacement actor.

The metadata worker remains the SAME live actor holding the SAME executable descriptor from before-hash through after-hash. Descriptor identity and the still-owned parent identity accompany both digest results. This design does not transfer the descriptor. A future FD-transfer design would require a separately reviewed explicit ownership handoff; serializing a pathname or reopening /proc/PID/exe is not transfer. Worker death, descriptor loss or parent exit before the after hash is complete fails finalization without reacquisition. Hashing and writer workers cannot create kernel-case children.

The metadata-only qualification must include these IPC and lifecycle rules, cleanup concurrency/global-budget exhaustion, and candidate-artifact/late-writer-failure cases before any kernel retry.

## Required supplied controls

- Hung/late/throwing hash and writer operations; stalled chunk read; short/zero IPC or file writes.
- Actual executable binding mismatch, changed inode/starttime, source closure mismatch, before/after digest mismatch.
- Kernel success followed by failed/hung finalization stays failed; parent never emits passed at cases-verified.
- Final hash completion after deadline cannot release parent or commit success.
- Per-stage clocks cannot reset the global budget; bootstrap and transition costs consume it; shared cleanup reserve covers all handles concurrently and is never renewed.
- Candidate file committed but writer/coordinator fails or remains unreaped: no authoritative success.
- Wrong/duplicate/late nonce or sequence, actor replacement, executable descriptor loss: fail without reacquisition.
- Spawn/exit/close races, falsy/frozen primary errors, writer failure cannot replace the original failure.
- Parent/worker exit retires signals; late messages cannot be reassigned to new identities or replay work.
- No remaining-group destructive signalling; unresolved groups/parent cleanup remain unverified.
- Raw evidence and acknowledged journal survive the controlled failure paths; no false complete receipt from partially written JSON.

## Nonclaims

This is a design, not implemented or tested. No new process was launched for it. It does not provide descendant containment, escaped-process cleanup, PID-reuse immunity beyond binding the directly owned live parent for this probe, browser cleanup, or production activation. Active supervisor and workflow remain unchanged and fail-closed.
