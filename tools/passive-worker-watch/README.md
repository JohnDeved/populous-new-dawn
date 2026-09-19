# Passive four-worker watcher

A monitor, not a dispatcher. `managed.json` is deliberately limited to Worker 1b,
2b, 3b and 5b and their exact current IDs/titles. Parked workers are not discovered.
The sampler reads only already-rendered sidebar rows of the existing Codex desktop
app hosting these ChatGPT tasks. It never opens a task, activates/focuses a window,
requests accessibility permission, takes a screenshot, reads conversation web areas
or profiles, posts input, or changes reasoning. There is no task/API/browser/model
monitoring transport and no import of the retired watcher or sender.

## Evidence and transition rules

The old `worker-watch-cli/sidebar-spinner-receipt.json` demonstrated passive exact
row/Working reads; its later `sidebar-observation.json` reported `trusted:false`.
The retained tooling audit and coordinator rollback demonstrated why navigation,
auto-dispatch and retry machinery must not return. This replacement reuses only
the passive observation and conservative two-clear rule, not those runtime paths.
Historical files under `work/orchestration/worker-watch-cli`, `app-chat-send`, and
the prior audit directories are never edited or consumed as assignments.

A visible unique row with the `Working` accessibility status arms an episode.
Two complete observations without that status, separated by at least 20 seconds
and no more than the 90-second observation gap, confirm one idle transition. Two
explicit error statuses confirm a systemError transition. The exact error label
must be exposed beneath the row; cached task status is not consulted. A missing,
duplicate, hidden, incomplete, unknown or untrusted row never means idle. An app
incarnation change or observation gap disarms all episodes. A watcher restart
also requires fresh Working; it does not reconstruct a missed stop from stale
state. Consequently very short work entirely between samples is not detected.

Only local SQLite `mode=ro` / `query_only` queries of the coordinator's queue and
user-message history are used to suppress already reported stops. Reads are
bounded by time, payload size and row count; a saturated/unavailable source blocks
notification rather than falling back to a task API. Only managed-worker headers
and timestamps are retained. Explicit retired chat IDs and parked worker numbers
are ignored. A header without a chat ID can suppress a duplicate but cannot arm
or generate a transition. No queue items or delivered records are changed.

New transitions are batched into at most one `codex queue` call per 60 seconds,
addressed only to the configured coordinator. No reminders are sent. Pending
observations expire or are cancelled by fresh Working. Durable uncertain intent
is written **before** invoking the CLI. Nonzero, timeout or unconfirmed output
sets a persistent output fuse: no automatic retry, even after restart. Monitoring
continues to record local transitions unless child cleanup itself is unverified,
in which case the daemon stops. Exactly-once external delivery is not claimed:
a crash after intent can lose an alert, but cannot silently replay it.

## Build, tests, and one passive dry check

Use Python 3.9+ and the installed macOS Swift compiler. From the repository root:

```sh
mkdir -p work/orchestration/passive-four-watcher
swiftc tools/passive-worker-watch/sidebar.swift -o work/orchestration/passive-four-watcher/sidebar
work/orchestration/passive-four-watcher/sidebar --self-test
work/orchestration/passive-four-watcher/sidebar --root-fixture tools/passive-worker-watch/fixtures/application-root-cycle.json
python3 -B -m unittest discover -s tools/passive-worker-watch -p test_watcher.py
python3 -B tools/passive-worker-watch/watcher.py dry \
  --sampler work/orchestration/passive-four-watcher/sidebar \
  --receipt work/orchestration/passive-four-watcher/live-dry.json
```

The last command is the **only live observation**, not a send. It performs at most
two passive reads, separated by the ordinary 20-second confirmation minimum, uses
isolated in-memory state, and never calls the output function. It stops immediately
on an untrusted/incomplete four-row sample. The receipt names missing IDs and the
actual blocker. Do not navigate, focus, scroll, grant permission automatically or
retry a failing observation just to make it pass. Source and compiled-binary hashes
are recorded and rechecked. A green read establishes passive visibility in that
execution context, not indefinite accessibility availability under launchd.

The focused tests cover stale idle, fresh Working/two-clear, explicit errors,
parked/retired IDs, duplicates, visibility gaps, restart/corruption, output intent,
failure fuse, rate limiting, read-only records, singleton/process ownership,
installation gates, bounded logs and forbidden command/input surfaces. The tests
never monitor live tasks or enqueue real notifications.

This tooling changes no app TypeScript or build inputs. Root README TypeScript
format/Oxlint/ESLint/Fallow and gameplay/native/browser/build runs are therefore
not substitutes for the Python/Swift checks and are marked not applicable to this
diff. The engineering plan reports these new tool paths as unmapped. The contract
preparer currently requires a gameplay subsystem, so its rejection is recorded
instead of modifying the mapping or inventing gameplay coverage. Scope is audited
against `tools/passive-worker-watch/**`; no parity/hosting files change.

## Observed root-provider failure

The follow-up passive structural trace found a more precise boundary than missing
labels: `AXWindows`, `AXMainWindow` and `AXFocusedWindow` returned the application
itself (`AXApplication`, identical by `CFEqual`). Its children were itself and two
menu bars, not a rendered worker sidebar. The sampler now validates window role,
identity and geometry before walking, emits the redacted `windowRoots` shape, and
reports `accessibility-window-is-application-self-reference` instead of pretending
that a successful AX call supplied a usable window. The observed shape is retained
in `fixtures/application-root-cycle.json` and used by pure Swift/Python regressions.
It never arms an idle event and never satisfies the installation gate.

Read-only navigation-order/visible-child roots, focused-element ancestry, passive
app hit-testing and a bounded AX notification subscription exposed no valid window.
System-wide hit-testing resolved a different application and was discarded without
reading that application's contents. A permission-only check found no already-
running/authorized System Events helper, so no AppleScript request or prompt ran.
Those are ignored diagnosis receipts, not additional runtime polling fallbacks.
No accessibility flag, task, window or permission was changed. There is no observed
worker-row shape to map safely until the app exposes a real AX window; do not
broaden labels, infer idle from the cycle, enable app accessibility via a setter,
or resurrect navigation/task APIs to manufacture a green result.

## Single-agent lifecycle

`service.py` owns only `com.populous.worker-watcher`, reusing the retired label so
there can be no second watcher LaunchAgent. Installation requires both a fresh
(within 15 minutes) green dry receipt and a tests receipt with `status: passed` and
`fingerprints` exactly equal to the dry receipt. Generate that receipt from the
actual test run, not manually. Installation copies these sources and the binary
into `~/Library/Application Support/PopulousPassiveWatcher/runtime`, pins hashes,
preserves any prior unloaded retired plist/runtime and never overwrites history.
It refuses an already loaded agent or an unrecognized existing plist; it does not
terminate the retired watcher on an assumed PID. Explicit ownership/retirement
must be resolved before replacement.

```sh
python3 -B tools/passive-worker-watch/service.py status
python3 -B tools/passive-worker-watch/service.py install \
  --sampler work/orchestration/passive-four-watcher/sidebar \
  --dry-receipt work/orchestration/passive-four-watcher/live-dry.json \
  --tests-receipt work/orchestration/passive-four-watcher/tests.json
python3 -B tools/passive-worker-watch/service.py disable
python3 -B tools/passive-worker-watch/service.py uninstall
```

One daemon holds a nonblocking flock. Its persisted PID plus creation/command
identity is checked against the live process and the owned plist before unloading.
A reused PID is never signalled. `disable` persists launchd's disabled state and
unloads the exact verified job. `uninstall` also archives the owned plist; state,
notification outcomes, corrupt-state backups, previous runtime copies and receipts
remain. No raw process-group cleanup is performed against an old watcher record.
Transient sampler/queue children are bounded and only a still-identical owned
process group may be stopped on timeout. Identity uncertainty is a blocker.

The agent starts at login and restarts only on crashes, throttled to five minutes;
a normal fail-closed exit does not trigger a restart loop. State corruption is
preserved and recovered into an unarmed/output-fused state. The runtime maintains
three log segments capped at 256 KiB each and the last 64 notification receipts.
Only state/logs created by this replacement are bounded; historic audit receipts
are not deleted. Deliberate output-fuse recovery requires an owner to inspect the
uncertain queue result; no automatic acknowledgement/reset command exists.

## Review status

A live failure must be published as a **draft tooling PR**, with the exact dry
receipt and installation withheld. Do not label an uninstalled or accessibility-
blocked watcher hands-off operational. CEO owns review/integration routing; this
monitor never sends assignments or messages reviewers. A separate terminal worker
handoff to the coordinator is outside monitoring and does not count as a watcher
notification.
