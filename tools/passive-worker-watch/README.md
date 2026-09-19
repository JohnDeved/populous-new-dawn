# Local worker lifecycle watcher

This is a **local lifecycle/final-error observer** for the current Worker 1c–4c
roster. It does not infer idle. It does not call ChatGPT/model/network APIs and
does not use browser/UI navigation, Accessibility, screenshots, focus/input
automation, or assignment/restart controls.

The only installed output path is the local `codex queue` CLI, pinned to the
configured coordinator thread.

## Managed roster

`managed.json` binds exactly these cached conversation identities/titles:

- Worker 1c — `6aaebd2a-9698-83ed-a9ca-732b8651f074`
- Worker 2c — `6aaebd46-b95c-83ed-80ac-207d2c6c5c43`
- Worker 3c — `6aaebd51-30ac-83eb-a58a-1cfdb96b9100`
- Worker 4c — `6aaebd5d-d418-83eb-a0b7-6000fe1dbf24`

Duplicate/missing/wrong-title metadata makes the observation incomplete. Cache
`updatedAt`, file mtimes, silence and elapsed time are metadata only and never
establish active/idle/stopped state.

## Positive evidence

Three local evidence classes are accepted.

1. **Coordinator final handoff.** A fresh first-line
   `WorkerNc | [chat_id=ID |] ticket | FINAL_STATE` in the configured
   coordinator queue/history is explicit self-reported completion/error evidence.
   Accepted states are DONE, BLOCKED, NEEDS_REVIEW, ERROR, SYSTEMERROR and STOPPED.
   These messages already address the coordinator, so the watcher journals them
   and never sends a duplicate notification.
2. **Typed local failed turn.** A fresh `thread_turns.status=failed` row with a
   nonempty error for an exact managed ID may create a local error notice. This
   is error evidence, not idle evidence.
3. **Local Dev interrupted run.** `~/.local-dev/activity/*.jsonl` is read
   directly and read-only. The Local Dev producer fsyncs `run.*` events. A
   managed run becomes attributable only when its own lifecycle title/goal begins
   with an unambiguous `WorkerNc` or `Worker Nc` self-label. A `ReviewerNc`/
   `Reviewer Nc`
   self-label is always unknown and non-actionable, even if other text mentions a
   worker. Only the exact producer record `run.interrupted` with
   “Runtime disconnected; no assistant completion was reported.” is positive
   stalled/incomplete-run evidence. `run.started`, a long-running run, silence,
   missing events, and journal mtimes never mean idle. A conflicting self-label
   makes identity unknown and suppresses the notice.

A later same-worker coordinator final at or after a local error/interruption covers
that event and suppresses a redundant watcher notice. The watcher never restarts a
task and never claims that an interrupted worker remains idle or unavailable; a
later task may already have started.

## Bounded local reads and output

Codex SQLite reads use URI `mode=ro` plus `PRAGMA query_only`, exact tables and
bounded rows/payloads. The task-cache reader retains only the configured roster
fields. Local Dev activity reads inspect at most 24 recently modified journals,
at most 8 MiB from each tail, and at most 2,048 sanitized lifecycle events. Raw
goals, tool arguments/results and other journal content are not retained in watcher
state or notices.

Schema/bound failures are watcher-health errors, never worker errors. Cold start
baselines pre-existing evidence. State persists dedupe, final identity, lifecycle
run identity and crash-safe output intent. Corrupt/incompatible state is preserved
and output-blocked rather than replayed. Installation archives the prior watcher
state before a verified roster/runtime upgrade, so old pending output cannot cross
into the new roster.

Only uncovered typed errors or explicit Local Dev interruptions may call
`codex queue`, always to coordinator
`01a09e5b-1361-7c12-acbe-a9377e0af8a0`. Durable consumed intent is written before
the call. Timeout/nonzero/unconfirmed delivery is not retried for that batch.
Independent new events obey bounded backoff. Notices explicitly say they do not
assert idle/current availability.

## Verification

From the repository root:

```sh
python3 -B tools/passive-worker-watch/verify.py \
  --receipt work/orchestration/watcher-current-roster/tests.json
python3 -B tools/passive-worker-watch/watcher.py dry \
  --receipt work/orchestration/watcher-current-roster/live-dry.json
```

Dry mode performs one bounded local snapshot, emits no coordinator output and
records exact source hashes plus capability claims. The focused suite covers the
current roster, final/error semantics, explicit Local Dev interruption handling,
conflicting identity, silence/running non-idle behavior, dedupe/backoff/crash
recovery, read-only inputs, output destination, install gating and PID/hash
ownership.

This is a Python/JSON-only local tool. Gameplay/browser/native/build evidence is
not a substitute for these checks and is not claimed by this watcher.

## Installation and lifecycle

The sole LaunchAgent label is `com.populous.worker-watcher`. The default local
roots are `~/.codex` and `~/.local-dev/activity`; both are pinned into the
verified installation manifest and launchd arguments.

```sh
python3 -B tools/passive-worker-watch/service.py status
python3 -B tools/passive-worker-watch/service.py install \
  --dry-receipt work/orchestration/watcher-current-roster/live-dry.json \
  --tests-receipt work/orchestration/watcher-current-roster/tests.json
python3 -B tools/passive-worker-watch/service.py disable
python3 -B tools/passive-worker-watch/service.py uninstall
```

Install requires fresh passing dry/test receipts with matching source/test hashes.
A current owned agent must be identity-checked and disabled before replacement.
The prior state is archived, never replayed into the new roster. Runtime copies
live under `~/Library/Application Support/PopulousPassiveWatcher`.

`service.py status` reports the launchd PID, process identity, configured roots,
observation count/health, installed hashes and recomputed runtime hashes. A valid
installation has `processVerified=true`, `plistOwned=true`,
`hashesVerified=true` and `rootsVerified=true`. Disable/cleanup never blindly
signals a reused or unverified PID.

Acceptance should observe at least two healthy daemon cycles with the same verified
PID/config/hashes. A controlled verification notice may be sent once through the
installed watcher's `enqueue` function; its text must clearly identify itself as
a controlled install check and make no worker-idle/stall claim. That exercises the
same coordinator-only output path without fabricating lifecycle evidence.
