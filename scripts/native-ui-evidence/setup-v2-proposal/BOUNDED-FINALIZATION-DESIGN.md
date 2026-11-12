# Bounded finalization and diagnosis design (not implemented)

## Preserved failure and what it establishes

Failed attempt: evidence/supervisor-kernel-failed-01.json at fcd661a3d67f92e4f2ff0000a6b39e0e73092c30, independently verified as failure. Both child-case receipts were verified, but the harness remained running without final hashes. The controller timed out its parent wait, terminated/reaped its direct parent and failed. Whole wrapper elapsed26.238s versus controller-recorded11.877s: setup/final metadata work also occurred outside that parent wait.

Source position makes final hashing or receipt I/O plausible, not diagnosed. No stack sample identifies the blocked operation. Do not rewrite the failed attempt, call it passed, merely raise its timeout, or rerun the kernel cases to investigate metadata.

## Design goal

Separate kernel-case timing from metadata/receipt timing while retaining exact executable and source binding. Overall success requires all stages and durable final receipt; completed child assertions alone never suffice. This document changes no executed code, deadline or workflow.

## New ownership and phase boundaries

1. A minimal infrastructure-owned coordinator owns the parent, metadata worker and receipt writer as direct child handles. No negative-PGID destructive signals. Retire every handle's destructive actions at exit. Keep existing read-only group observation and failure-on-unverified behavior.
2. A pinned metadata worker performs all file hashing, with bounded memory/chunk size, per-file monotonic timings, explicit start/end messages and byte counts. No synchronous whole-executable hashing in the kernel parent or coordinator.
3. A pinned receipt writer acknowledges each durable stage-start record before that stage starts. It commits final JSON only after success predicates pass. Failure/timeout retains the latest acknowledged journal and partial files; inability to persist is itself failure. Writer work, including fsync, has its own deadline.
4. Kernel parent begins at an admission barrier with no case children. Bind its PID/PPID/PGRP/SID/starttime and actual executable through /proc/PID/exe while that owned parent is alive. The metadata worker opens the executable read-only, retains that file descriptor and records inode/device plus the parent identity. It hashes the actual executable bytes against the existing expected SHA256 before release. A path-only hash is not a substitute for the executable actually launched.
5. Source closure hashes are also verified before release. Record exact metadata-worker/writer/coordinator/harness/supervisor/observer identities; metadata and writer code are part of the admitted closure.
6. Release the kernel parent and start the unchanged10s kernel-case budget. Child cases remain exactly normal and direct-child deadline cases. Parent checkpoints each verified case. On completion it persists/emits cases-verified and waits at a finalization barrier. It must not set passed.
7. End the kernel-case clock at the authenticated cases-verified event, not at parent process exit. Begin finalization-start, then per-file hash-start/hash-end, comparison-start/end, and receipt-commit-start/end. Fully rehash the retained executable descriptor and source closure. Parent remains alive/owned during this stage; never resolve a reused numeric PID to obtain the after executable.
8. Compare complete before/after bytes and identities. Only after finalization succeeds release parent to exit. Verify zero exit, no intervention, exact case results and fresh read-only child-group absence. Writer commits the final passed receipt last, then coordinator reports success. Failed, pending, rejected, missing or late stages cannot become passed.

## Proposed budgets, requiring qualification before implementation acceptance

These are explicit fail-closed ceilings to review, not measurements or approved increases:
- IPC frames and retained stage records: bounded schema, at most64KiB each; reject malformed/extra/late responses.
- Hash reads: at most1MiB per chunk, no full126.9MB executable allocation. One complete actual-executable hash before cases and one after, not duplicate hashes in both parent and controller.
- Small source-closure validation:2s per before/after stage.
- Executable hashing:5s each before/after stage; stop and report the exact incomplete file/stage if not complete. Do not run kernel cases when the before stage misses its allowance.
- Kernel cases: original10s, not increased.
- Receipt commit:2s, with timed writer acknowledgment rather than an unbounded synchronous coordinator write.
- Coordinator work budget:26s across all stages, never the sum of resettable per-call clocks; reserve4s for one direct-handle TERM2s/KILL2s cleanup attempt. No stage may consume the reserved cleanup allowance.
- A separately owned external execution watchdog must cover the coordinator as well. Its reviewed bound includes setup/metadata and cleanup, not merely the Node parent wait.

The proposed26+4s whole-operation accounting is not permission to retry or a blind larger kernel deadline. Per-stage diagnosis must first show whether metadata can meet its ceiling. Budget changes require a new reasoned review, not automatic retries. OS scheduling/uninterruptible I/O can defeat a timely cleanup guarantee; such outcomes remain unverified/failure, never claimed contained.

## Diagnosis before any kernel retry

First implement/review supplied-boundary controls, then independently admit a metadata-only diagnostic. It must use the same executable/source bindings and chunked worker/writer implementation, report per-file start/end/bytes/duration, and never spawn kernel-case children. This determines whether hashing, receipt commit or another metadata boundary fails. Preserve a failure as failure; no automatic rerun or deadline expansion.

Only after that result is independently reviewed may a new separately admitted kernel attempt use the revised pipeline. Use a fresh output directory and new source identity. Preserve failed-01 unchanged.

## Required supplied controls

- Hung/late/throwing hash and writer operations; stalled chunk read; short/zero IPC or file writes.
- Actual executable binding mismatch, changed inode/starttime, source closure mismatch, before/after digest mismatch.
- Kernel success followed by failed/hung finalization stays failed; parent never emits passed at cases-verified.
- Final hash completion after deadline cannot release parent or commit success.
- Per-stage clocks cannot reset the global budget; cleanup reserve is retained.
- Spawn/exit/close races, falsy/frozen primary errors, writer failure cannot replace the original failure.
- Parent/worker exit retires signals; late messages cannot be reassigned to new identities or replay work.
- No remaining-group destructive signalling; unresolved groups/parent cleanup remain unverified.
- Raw evidence and acknowledged journal survive the controlled failure paths; no false complete receipt from partially written JSON.

## Nonclaims

This is a design, not implemented or tested. No new process was launched for it. It does not provide descendant containment, escaped-process cleanup, PID-reuse immunity beyond binding the directly owned live parent for this probe, browser cleanup, or production activation. Active supervisor and workflow remain unchanged and fail-closed.
