# One trusted-main ordinary-pointer trace diagnostic

This is an opt-in functional diagnostic, not a benchmark, calibration, A/A or A/B
qualification. Importing the modules and normal CI do not start this route. The
existing smoke, Tutorial matrix and calibration selector remain separate.

## Selection and authority

After this route lands on reviewed, tested main, the repository owner may post
exactly `/ordinary-pointer-trace <40-character current main SHA>` on merged PR
#898. The dedicated `issue_comment.created` workflow checks the original comment,
fixed repository/owner/PR IDs, owner login and association, sender, actor,
triggering actor, default-branch workflow SHA and first run attempt. The workflow
uses only contents/issues/pull-requests read permissions and checks out the exact
trusted event SHA without retained credentials. It fetches the merged PR, original
comment and current main from fixed API URLs before dependency installation, and
rechecks immediately before the route launches Chrome. The owner token is removed
from descendant environments. Comment text is never interpolated into a shell.

Only one authorized comment is to be posted. There are no automatic retries.
Concurrency serializes runs; it does not deduplicate distinct comments or duplicate
deliveries. `run_attempt == 1` refuses reruns but is not distributed replay
protection. If comment creation or run selection has an uncertain outcome, inspect
the existing comment and workflow run before taking any further action. A new run
requires a separately justified decision, not a blind retry of an unchanged failure.

Main advancing before either admission check causes refusal. Main can still advance
after the last check: there is no atomic branch lock. The checkout, recorded source,
workflow and browser work remain pinned to the selected SHA. Never describe a result
as current-main evidence if main has since moved.

## Owner, deadline and resource boundaries

The maintained runner builds once and serves only that source. It does not launch
its ordinary initial browser for this scenario. The diagnostic owner launches one
fresh supported Chrome, verifies its binary hash before and after, and uses the
existing smoke's source/runtime-reader admission and snapshot/F8/geometry preparation.
The existing 90-second smoke/capture bound is unchanged.

The diagnostic has a fixed monotonic 180-second inclusive route budget: 178 seconds
active and a two-second final owner-cleanup allowance. It refuses to begin the trace
owner without at least 92 seconds left in its active budget. Nested bounds do not
renew the route budget. The workflow is six minutes; its runner command has a
300-second TERM deadline plus five-second KILL grace, covering the existing bounded
build and route. These are wall-clock controls, not RSS or process-tree containment.
A blocked driver/event loop cannot be interrupted by its own timer. Once control
returns, elapsed-time validation refuses a false successful result.

The caller closes its owned browser and the runner closes its server with bounded
cleanup. Late launch/capture/transport is explicitly uncertain until observed to
settle; abort or observer cleanup alone is not proof of process termination. A late
operation cannot overwrite finalized route evidence. If final evidence writing or
cleanup also fails, it does not mask an earlier falsey primary exception.

Uploaded artifacts are capped separately: 8 MiB trace, 32 MiB session evidence and
1 MiB metadata, **41 MiB total**. Metadata includes the outer runner receipt and build
log, the route/binding files and collector receipt. No individual file exceeds
8 MiB. Symlinks, nonregular files and unexpected artifact directories are refused.
Bounds are checked before upload even after failure. These checks are not a general
hard disk quota; an oversized or incomplete artifact is not uploaded as qualified
evidence. The build output is not an uploaded artifact.

## Evidence and strict interpretation limits

`ordinary-pointer-trace/route.json` records owner/deadline/cleanup status.
`binding.json` retains before and after target observations even when qualification
fails. `session/` retains unchanged smoke/raw numeric evidence and
`session/ordinary-pointer-diagnostic/` retains the collector receipt and
`trace.json.partial`. The `.partial` filename is intentional: do not parse it as a
complete trace unless the collector reports EOF, no data loss, settled operation,
confirmed transport cleanup and supported syntax/schema.

Tracing and stream ownership use the explicit page CDP session. A browser CDP
session supplies only browser/process metadata. The fixed categories include
`disabled-by-default-devtools.timeline`; there is no wildcard or heuristic fallback.
Before/after target, root-frame, loader, URL and isolate observations must agree.
The supported observed trace schema must bind the root frame to one renderer PID,
one `CrRendererMain` TID and the two explicit whole-capture user-timing markers.
The frame ID is not assumed to be the target ID. The recorded Chromium frame URL
may omit its fragment; actual before/after URLs must still match exactly.

The resulting status is **target-envelope-bound-unqualified**. It does not establish
isolate-to-thread identity, sampling completeness, GC coverage, source/stack binding,
projection spans, or alignment of trace timestamps with F8 frame timestamps. The
process CPU snapshots bracket a wider interval including trace setup, not exactly
the marker interval: do not divide that CPU delta by marker duration or label it
projection CPU. `interpretationEligible` and `comparisonEligible` remain false.

An unsupported observed Chrome schema is a retained diagnostic failure, not a reason
to relax admission or rerun unchanged. Source-level Chromium documentation is not
proof of the exact hosted binary's behavior. A green workflow means this narrowly
specified procedure and envelope checks passed; it is not performance acceptance,
a causal GC/scheduler diagnosis, a speedup, or authorization to activate a benchmark.

## Metadata-only service initialization experiment

The explicitly selected trace route first invokes the reviewed initializer once on the same exclusively owned browser/page, before target observation and ordinary collection. Its excluded-all trace still retains Chromium metadata; it is not event-free. Empty or partial post-initialization categories fail closed. The ordinary collector independently repeats its existing strict six-category admission; initialization is never a replacement for that guard.

The initializer's inclusive ten-second limit consumes the existing smoke watchdog and 178-second active / 180-second total route budget. It does not grant an extra ten seconds or guarantee a fresh 90-second capture. Conservative 102-second route headroom is checked before initialization, with the existing 92-second collector headroom checked afterward. Every failure remains subject to the existing owned-browser cleanup; pending operations retain uncertainty.

Both raw streams share the existing eight-MiB write allowance, enforced before writes. Initialization additionally retains its one-MiB individual stream cap. Both receipts and the outer logs share the existing one-MiB metadata limit; the 32-MiB session and 41-MiB aggregate limits are unchanged. Only the exact initialization artifact subdirectory is added to retention. No files from a prior attempt are overwritten or reused.

This remains a source-backed experiment, not proof that cold registration caused the earlier empty inventory or that initialization repairs actual Chrome. Supplied controls do not admit a live run. Source review, ordinary hosted gates, trusted-main admission and separate authorization/reconciliation still precede any diagnostic selection. No automatic retry, performance comparison, schema/GC/stack qualification or causal interpretation is introduced.
