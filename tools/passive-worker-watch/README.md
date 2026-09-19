# Local worker event watcher

This is a **final-handoff/local-error record observer**, not a live activity or
silent-stop detector. The Accessibility path is retired: no Swift helper, app
observation, navigation, focus/input, screenshots, monitoring API, network client,
model call or assignment sender is installed. `managed.json` permits only Worker
1b, 2b, 3b and 5b and their exact configured conversation IDs/titles.

## What local evidence can and cannot establish

The scoped local cache at
`.codex-global-state.json → electron-persisted-atom-state → chatgpt-sidebar-state-v1
→ scoped pinnedConversations[].conversation` identifies the four managed IDs,
creation/update times and titles. Inspection found **no activity/completion/error
field**. A recent `updatedAt`, a file mtime, a completed Codex turn, silence, or a
missing worker is never interpreted as active, idle or stopped. Cache freshness
is displayed separately from identity; every worker's `liveStatus` remains
`unknown`. Duplicate/missing/wrong-title records make identity incomplete.

The local Codex `state_5.sqlite/threads` and `thread_history_1.sqlite/thread_turns`
currently have **no rows for these four ChatGPT IDs**. No link to a similarly
named Codex thread is guessed. Silent stops and unreported ChatGPT system errors
are therefore not detectable with the permitted evidence. This is a declared
limit, not an installation error or an excuse to restore Accessibility/API calls.

Only a first-line explicit `WorkerN[b] | [chat_id=ID |] ticket | FINAL_STATE`
is positive *self-reported* stop evidence. Accepted final states are DONE,
BLOCKED, NEEDS_REVIEW, ERROR, SYSTEMERROR and STOPPED. A report must be fresh,
after that exact configured worker's creation time, and match a currently bound
ID/title. An explicit wrong/retired chat ID, parked worker number, quoted header,
checkpoint/progress or arbitrary body text is rejected. Number-only headers are
attributed as current-number **self-reports**, not authenticated task execution.
Reported DONE does not prove present idleness or that a new task has not started.

Only the coordinator's queued items and delivered/realtime `userMessage` records
are queried. They already address the coordinator, so their final handoffs are
journaled as covered and **never generate a redundant notification**. Queue →
realtime → history copies and repeated content coalesce; a later delivery copy
cannot refresh a consumed report timestamp. Payload bodies are used only for a
digest and are not retained, executed or copied into notices.

If a fresh typed local `failed` turn with a nonempty error field later exists for
one of the exact managed IDs, it can create a **local error-record** notice, not
stop/idle evidence. The local protocol defines these statuses and Unix-second
turn timestamps. Completed, interrupted and inProgress records do not create a
notice. A later same-worker final already covering the coordinator suppresses a
redundant error wakeup. This conditional path is fixture-tested; no current live
coverage for these workers is claimed where their turn records are absent.

## Reliability and bounded output

Reads use SQLite URI `mode=ro` and `PRAGMA query_only`, fixed tables, exact thread
filters, bounded time/payload/row windows, and an explicitly bounded metadata-cache
subtree. Other app configuration/profile values are not inspected or output.
Schema errors, a saturated window or missing metadata are watcher-health problems,
not worker errors. Local reads back off to at most five minutes; no API fallback.

Cold start baselines existing records without alerts. Restarts preserve consumed
event and output intent. Legacy/corrupt/incompatible state is archived, then starts
unarmed with output blocked until an owner reviews the uncertainty. Pending
records must have consistent key, kind, managed worker/number, timestamp, source,
record identity and coordinator-addressed flag before consumption. A malformed
record quarantines the persisted state instead of recurring every poll. Reader
backoff resets only after the entire read/process/output cycle succeeds, never
just because `observe` completed before a later processing failure. Records older
than the configured event window cannot reappear as new work. State contains at
most 2,048 dedupe keys, 128 event receipts, 64 output receipts and one latest final
per managed worker. Error keys age out after 1,800 seconds; final semantic keys
retain their earliest observed event timestamp for this managed configuration
without that TTL. Delayed identical coordinator copies cannot refresh a final or
cover a newer error. Retained journal/latest-final timestamps backfill older v2
state on loading; missing history is never invented. Capacity exhaustion is a
visible fail-closed condition, not permission to evict final identities silently.
Logs rotate across three files capped at 256 KiB each.

Only a new uncovered local error may call the local Codex queue CLI, only to the
configured coordinator, at most once per minute. Durable consumed intent precedes
the invocation. Timeout/nonzero/unconfirmed output is never retried for that batch,
including after restart; new independent errors respect exponential backoff from
five minutes to one hour. There are no reminders. Exactly-once external delivery
is not claimed: an uncertain attempt can be lost rather than duplicated. An
unverified child-cleanup identity stops the daemon; it is never blindly signalled.

## Checks and one live dry observation

From the repository root, using Python 3.9+:

```sh
python3 -B tools/passive-worker-watch/verify.py \
  --receipt work/orchestration/passive-four-watcher/local-events/tests.json
python3 -B tools/passive-worker-watch/watcher.py dry \
  --receipt work/orchestration/passive-four-watcher/local-events/live-dry.json
```

Dry mode takes one local snapshot, baselines it in isolated memory, emits no queue
notice, and records source hashes, ID/freshness coverage and the reduced claims.
Green means those exact local-record claims pass, **not** that live worker activity
or silent stops are known. The fixtures use the observed cache/schema and explicit
final-header shapes. Tests block socket/subprocess use during monitoring and cover
filtering, freshness, duplicates, corrupt/restarted state, rate/backoff/no-retry,
read-only databases, ownership, gates and bounded logs. Retired AX fixtures and
failure receipts remain in Git history and ignored orchestration evidence.

Root README TypeScript formatter/Oxlint/ESLint/Fallow, gameplay, browser/native
and app-build checks do not exercise this Python/JSON-only tool. No app/package
inputs change; those are marked not applicable, never green substitutes. The
existing engineering planner calls the paths unmapped; no gameplay subsystem or
parity claim is invented. Use focused checks, metadata validation and exact scope
review, with fingerprints for the actual source tested.

## Installation, status, disable and uninstall

The sole label is `com.populous.worker-watcher`. Install requires fresh (within
15 minutes) passing dry and test receipts whose runtime hashes match. Generate
`tests.json` with `verify.py`, not a handwritten pass summary. The gate requires
fresh ordered start/finish times, exit code zero, positive equal discovered/run/
passed counts, no failures/errors/skips/exceptional outcomes, and matching runtime
plus verifier/test/fixture hashes. A stale, zero-test, failed or contradictory
receipt is rejected even when its status/fingerprints claim a pass. A failed
reduced-claim dry receipt also cannot be used to install.

```sh
python3 -B tools/passive-worker-watch/service.py status
python3 -B tools/passive-worker-watch/service.py install \
  --dry-receipt work/orchestration/passive-four-watcher/local-events/live-dry.json \
  --tests-receipt work/orchestration/passive-four-watcher/local-events/tests.json
python3 -B tools/passive-worker-watch/service.py disable
python3 -B tools/passive-worker-watch/service.py uninstall
```

The default records root is `~/.codex`; override with `--records-root` only for an
explicit local dataset. The installed root is pinned to the verified receipt.
Runtime copies live under `~/Library/Application Support/PopulousPassiveWatcher`;
no Accessibility binary is copied. One nonblocking flock and one LaunchAgent own
the daemon. Launchd starts it at login; crash restarts are throttled, normal failure
exits do not loop. Status/cleanup verifies PID plus creation/command identity and
the owned plist. Disable persists the disabled label and unloads only the verified
job; uninstall archives its plist and leaves all state/history/runtime receipts.
Never stop a reused or unverified PID, revive a retired sender or delete evidence.

After installation, verify a quiet observation cycle: same owned PID/command,
advancing observation count, healthy local reads, no new output attempts, and no
monitoring network sockets. The runtime's `capabilities` and `localTurnCoverage`
retain the limitations. A separate final worker handoff to the coordinator is
output, not a monitoring call; this watcher ignores Worker7 and cannot alert on
its own final publication message.
