# Five-product-PR delivery trial

Approved 2026-10-07 at 09:16 UTC. This is a prospective experiment, not a claim
that scripts improve gameplay delivery. GitHub PRs remain the status/measurement
source. Use existing source-bound command receipts in ignored
`work/orchestration/`; do not build a second task board or delivery timer.

## Cohort and decision

Enroll the next five **product** PRs whose first frozen candidate (focused proof
and independent source review available) occurs after approval. Order by that
UTC event, with PR number as tie-breaker. Publish enrollment immediately in the
PR; do not select by result, size, or eventual merge. Already-in-flight PR255 and
PR259 are transitional observations, never trial successes. Draft PR257 enters
only if its first qualifying freeze is after approval. Tooling, evidence-only,
research, and docs PRs are excluded and explain their classification. An enrolled
PR remains in the five even if blocked, superseded, or abandoned; report that
outcome and its uncompleted time rather than replacing it with a convenient pass.

The integration owner maintains the five PR links in the implementing tooling
PR's trial comment, with the count of observed closures. Product PR comments own
raw transition records. Every open branch has an owner and next permitted action
in its PR/issue; research and superseded refs keep an explicit disposition.

Targets, judged only after five outcomes:

- At least 4/5 first-pass final sequences, including every required gate. Repairs,
  rebookings after a real failure, and observer/fixture changes are not first passes.
- Zero late failures from known format, context, inherited-diagnostic-policy, or
  invalid-fixture mistakes. Keep genuine product failures separate; reviewer
  validates the reason classification.
- 30% lower median frozen-to-merge time only with comparable complete baseline
  timestamps. Publish all five durations and range. Pending/censored cases must
  be visible, not dropped from the denominator. If the baseline is insufficient,
  compare the first two versus next three directionally without a percentage claim.
- All required ordinary evidence, independent review, exact tested/merged tree,
  and provider verification retained. Report regressions/reopened defects and
  missing evidence explicitly; never loosen budgets, assertions, or witnesses.

Historical anchors from the approved evidence review: PR253 final check
02:14:25.693–02:19:03.983 UTC on 2026-10-07 (278.290s), merged 02:26:55;
PR254 final check 04:52:04–04:58:37 (393s), merged 05:07:09. Builds were about
26s. PR253/254 required later attempts. These are command durations and merge
milestones, **not** complete ready-to-merge baselines. Frozen/review/resource
intervals are unknown until backed by receipts. Sources:
[PR253](https://github.com/JohnDeved/populous-new-dawn/pull/253),
[PR254](https://github.com/JohnDeved/populous-new-dawn/pull/254).

## Cheap preflight, then existing final gates

Run `npm run orchestration:preflight -- --base <accepted-base>` before booking the
final lane. It uses existing changed-path discovery (branch, index, worktree,
untracked files), changed app Oxfmt/Oxlint, changed JS/TS ESLint, manifest/reference
validation, and the unchanged context tests. The 24,000-byte default budget and
required evidence/check assertions remain intact. Deleted files are not linted.
No installation, automatic fix, build, browser or native run happens here.

Retain raw output with the existing wrapper, using a fresh attempt path:

```
npm run orchestration:receipt -- --output work/orchestration/TRIAL/preflight-01.json --input scripts/orchestration/preflight.mjs -- npm run orchestration:preflight -- --base BASE
```

A failed command stops this cheap screen; later commands are not run. A missing
tool/timeout is blocked, never clean. Preflight does not select or replace full
acceptance. Continue to inspect `orchestration:plan -- --base BASE`, unknown paths,
callers and state owners, and retain `npm run check`, `npm run build`, and affected
native/rendered/performance proof. Run on the coordinator-approved resource only.

Inherited diagnostics: preserve the tool's failed/advisory status and raw output.
Before booking, compare exact baseline and candidate inputs using the same
lockfile, tool/version, configuration and invocation. Review every added/changed
diagnostic; new findings fail. An independent reviewer may accept an unchanged
inherited finding with its baseline/candidate receipts and attribution linked in
the PR. That acceptance is separate from the tool exit status; no ignore list,
quiet flag, budget increase or global "clean" claim. Execution/configuration errors
are blockers, not inherited findings. Record diagnostic-policy delays separately.
Accepting an inherited diagnostic does not clear skipped commands: retain the failed
preflight, execute every remaining cheap check on the same candidate and tool
identity, and resolve their results before booking the final lane.

Before a long supplied scenario, QA and implementation review the affected
fixture's terrain connectivity, coherent base, roster ownership, idle engagement
range and observer installation timing, retaining original behavioral assertions.
Ordinary witnesses declare predicate, episode bounds, first qualifying event and
before/after capture before execution. Synthetic/component proof stays labelled.
Reusable fixture extraction is pending accepted PR255 source; this first patch
does not claim an executable invariant screen or changed gameplay coverage.

## Roles, lanes and terminal reporting

Limit work in progress to two implementation owners and one final candidate.
Integration owns exact source/merge; an independent reviewer takes oldest ready
work; QA owns the ordinary witness; tooling removes one demonstrated setup cost.
Implementers cannot review their own changes. Move relevant effort to a final
candidate blocker before opening unrelated work. Independent work must not
compete for its reviewer/runtime/installation.

Book one heavy run per verified resource lane. Keep lane-owned dependencies keyed
to lockfile/tool identity, normal security checks, exact source/profile version,
ports, process ownership, start/deadline and cleanup in existing receipts. Never
move/copy/reuse a reserved or unknown installation. The reviewed independent
installation is still reserved to Preacher QA; its existence does not authorize
this tool to use it. Interrupted ownership remains unknown/quarantined until
verified. Do not terminate another task's process or republish blocked archives.

Report a terminal result immediately to integration with source, receipt, pass/
fail/blocked status, remaining acceptance, owner and next action. Do not wait for
archive packaging. Carry unchanged proof only with exact input correspondence and
independent acceptance; rerun affected proof. Two consecutive future candidates
must demonstrate the same profile and zero dependency moves before stable-lane
reuse is counted as achieved.

## Compact PR event record

Copy this shape into a PR comment and append actual events with receipt/review
links. Unknown is null, not an estimated timestamp. Keep previous failed attempts.
This is evidence attached to the existing PR, not an autonomous scheduler.

```json
{
  "trial": "delivery-2026-10-07",
  "cohort": "eligible | transitional | tooling | research",
  "slot": null,
  "base": "exact SHA", "head": "exact SHA", "tree": "exact SHA",
  "branch": "branch", "owner": "owner", "nextAction": "specific action",
  "profile": "runner path + source SHA", "dependencyIdentity": "receipt link",
  "events": [
    {"at": null, "event": "candidate-frozen", "source": "receipt/review link"}
  ]
}
```

Event names: candidate-frozen, review-requested, review-accepted,
resource-requested, resource-acquired, gate-started, gate-ended,
ordinary-witness-accepted, merged, provider-verified. Each gate-ended adds attempt,
status and reason (format/context/diagnostic-policy/fixture/product/environment/
interruption/other), evidence and next owner. Each source revision names affected
proof; never overwrite the first frozen time. Optional terminal: abandoned or
superseded, with reason and successor link.

Calculate disjoint waiting intervals by reason (reviewer/dependency/lane), not
by summing overlapping clocks. Flag ready work waiting over 15 minutes during
active work. For utilization use useful execution / reserved duration for the
same lane; report unknown if boundaries are missing. Record dependency moves and
reviewed evidence carries in the same PR. A provider success alone is not closure.
At five outcomes, the reviewer checks classifications and quality protections;
keep/simplify the change based on measured results and name one next intervention
only if a demonstrated bottleneck warrants it.
