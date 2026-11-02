# Owner-selected trusted-main calibration

This adds an explicit selection route to the existing bounded calibration procedure, not a new measurement protocol or automatic benchmark. Manual workflow_dispatch remains supported. No thresholds, session order, resource bounds or default Tutorial jobs change.

After the trigger and #895 are independently reviewed, tested and merged, one authorized owner comment on PR895 may select the current exact main SHA:

```
/ordinary-pointer-calibration <40 lowercase hexadecimal main SHA>
```

Use the entire single-line body, with no trailing newline or additional text. The existing authenticated GitHub connector can post this command without a browser login or new credentials. Do not post it until current-main/source/runtime admission and normal gates are satisfied. This document is not evidence that any calibration ran.

Admission reads the original GitHub issue_comment.created event, repository/name/ID, owner user ID/login/type, sender, actor, triggering actor, workflow ref, first attempt, fixed PR895 channel and exact SHA. It then verifies the current original comment and merged PR895 using fixed read-only API paths. The workflow checks before dependency installation; the runner checks again after preparation immediately before qualification, reading main last. No PR head, comment-specified ref or comment text is executed. The token has contents/ issues/ pull-requests read only, and is removed from the runner environment before build/Chrome children; the owning process retains it only for admission. API errors, malformed evidence or stale main stop the procedure, without retry.

The checked-out code/build stays pinned to event SHA throughout. If main advances before the final check, qualification refuses. If main advances after that check, the run continues on its immutable selected SHA; there is no atomic lock on main and no claim it remains latest. Record the pinned SHA and admission receipt, not a moving-main interpretation.

Scope is ONE authorized comment with no automatic selection retries. Reconcile a timeout/uncertain comment mutation by reading its comment ID and workflow runs before doing anything else. A second new owner comment can select another run; run_attempt=1 and serialized concurrency are NOT distributed deduplication. A comment-triggered workflow rerun is refused; existing manual-dispatch rerun semantics are unchanged. Do not repost merely because a run failed or was inconclusive, and do not claim exactly-once execution from these controls.

Existing 20-minute aggregate, 25-minute process plus5s kill, 30-minute hosted job, 8MiB/file,32MiB/session,8MiB aggregate and296MiB total caps remain. All original failures and raw artifacts stay retained. Timing-inconclusive remains distinct in the nested receipt and fails the outer job. A/A feasibility never means candidate speedup, benchmark admission or allocation reduction.

Supported GitHub semantics: https://docs.github.com/en/actions/reference/workflows-and-actions/events-that-trigger-workflows#issue_comment . Issue comments use the default-branch workflow/SHA, not PR source. Authentication remains the existing authorized connector; no token extraction, additional credential or actions-write permission is introduced.
