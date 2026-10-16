# Read-only integration queue evidence — 2026-10-16

Historical foundation evidence. Current guarded-writer checks and review repairs
are in [the later report](../integration-queue-writer-20261016/README.md).

Tested code: `8a9520d22c9ff0476022d51d1862b46394e5ce62`.
Source base: `cf38a755a3a00255184c63c175a00076cff6b025`.
Later evidence-only commits do not change these inputs; `source-manifest.json`
binds each maintained file by SHA-256. The work used an isolated branch and kept
accepted feature checkouts untouched.

| Check | Result | Receipt |
| --- | --- | --- |
| Queue + existing test-runner tests | Passed, 32 tests, 0 failed/skipped | [focused.json](focused.json) |
| Targeted ESLint | Passed, exit 0 | [lint.json](lint.json) |
| Targeted Oxfmt check | Passed, exit 0 | [format.json](format.json) |
| Repository structural validation | Passed, exit 0 | [structural.json](structural.json) |
| Diff whitespace | Passed, exit 0 | [diff.json](diff.json) |
| Full test-plan preflight, without executing it | Observed 450 files, all serial; `production-config-runtime-drift` | [resource-preflight.json](resource-preflight.json) |

The focused log includes an intentionally failing child test from the existing
runner's failure-propagation test. The outer aggregate is the terminal 32/32 pass;
that child failure is expected fixture behavior, not a skipped or hidden failure.

Twenty new queue tests cover the proposed fake-GitHub sequence, durable restart,
delayed/reordered events, failed/canceled/skipped gates, current head/base/synthetic
identity, Actions app/workflow/run/attempt/check mapping, missing browser coverage,
source/content/approval/protection drift, real Git merge-tree contents and modes,
uncertain outcomes, exact merged tree/deployment, pagination caps, canonical trust
paths, resource fallback and the full fixture CLI path. Existing runner tests add
12 cases. No real PR is marked ready, refreshed, rerun, merged or deployed by these
tests. The fake deployment is not live deployment evidence.

The read-only GitHub schema probes inspected two existing workflow records and one
job record using existing GH CLI authentication. They confirmed the workflow PR
head/base and job-to-check-run fields; they did not test live mutation, deployment
or certify any feature PR. No credential or Actions permission changed.

Runtime: Node 24.18.0 on macOS arm64. The Mac dependency install is not a CI-matched
Linux install; no resource policy, helper hash, per-test hash or serial exclusion
was refreshed. The optional production-only resource proposal remains unverified
on a real CI-matched install. It is disabled by missing approval/runtime/receipt
bindings on this machine, as intended.

`orchestration:plan -- --base cf38a755a3a00255184c63c175a00076cff6b025`
reported the new driver/test paths as unmapped and conservatively selected the full
repository gate. These paths were explicitly inspected for this bounded tooling
change; focused tests and structure checks provide local feedback. Full check/build
are **not run locally** and remain required on the ready PR after independent
review. Browser/native/performance execution is not applicable to this read-only
CLI change; no browser/build lane was used.

Live mutation support is intentionally absent (`--apply` fails before GitHub
access), pending independent review and a parent-approved bounded pilot. The
workflow event-race fix is separate. A 60-second quiet window cannot guarantee
future events; protection and final identity checks remain necessary. Deployment
verification currently requires existing GitHub deployment records; no provider
adapter or deployment has been added. Therefore this evidence does not claim a
hands-off production merge or completed deployment.

Original source-bound receipts and raw logs remain under
`work/orchestration/integration-queue-final/`. The published copies replace only
the local checkout and temporary-directory prefixes with `[REPO]` / `[TMP]`.
`artifact-index.json` records original and published SHA-256 digests separately;
embedded original log hashes are retained unchanged. Earlier receipts at
`eb4900a9ea00a89e2d648ed022f34114aa3a9fbc` remain in the ignored local
`work/orchestration/integration-queue/` directory and are superseded by the final
refresh-proof checks here. Development bring-up corrected test-only canonical-path
and executable-mode fixture setup errors plus targeted lint/format findings.
