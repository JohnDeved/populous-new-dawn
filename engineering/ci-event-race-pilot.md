# Draft/ready event race: bounded hosted pilot proposal

Source review and parent coordination must precede the pilot. This plan does not
authorize execution, a merge, protection changes, extra token scopes, status
writes or a new workflow. Root coordinates the normal reviewed-PR queue and the
reviewed primary PR #502 with its one draft companion. Local policy tests are not
hosted lifecycle evidence.

## Candidate and evidence

Base reviewed for this change: `cf38a755a3a00255184c63c175a00076cff6b025`.
[Issue #473 diagnosis](https://github.com/JohnDeved/populous-new-dawn/issues/473#issuecomment-6221240164)
records a newer draft suite cancelling a real ready run, then blocking its genuine
successful rerun under the same required `Full check` name.

The proposed change keeps every full validation step and pinned dependency/runtime
unchanged. Only ready boolean events use the required name. Drafts fail under a
different name; concurrency includes workflow/PR/head/base/merge/readiness. Missing
or malformed draft values fail closed. The event snapshot is not a live-state API
or a freshness oracle: the merge coordinator still verifies current head/base/merge.

Use normal pull-request transitions, updates and explicit reruns of recorded pilot
events. Do not fabricate payloads, checks or statuses. Record every event action,
run/attempt/suite/job/check ID, creation/start/end time, event draft value, head,
base, merge SHA, step outcomes and raw logs. At each checkpoint capture
`gh pr checks --required`, the PR's current identity/draft/mergeability state, and
the required check's Actions app identity. Retain failed/cancelled attempts.

## Preconditions and bounded budget

Use #502 itself as the genuine reviewed primary candidate. Wait for #500 to merge,
refresh #502 against current main, and complete final source review. Before the
full gate, the native Linux resource worker supplies a separately reviewed
`productionSha256`-only refresh for the new main application tree. Preserve current
main's policy classifications and all other resource metadata. A Mac-derived
fingerprint is not acceptable. This document does not authorize that refresh or
any transition; root coordinates them.

Budget one genuine current-candidate Full gate, at most two recorded draft-event
reruns, and one same-head companion draft PR. Do not clone another full-validation
PR, introduce failing test/build commits, repeatedly toggle draft/ready, or run
additional full suites to retest unchanged machinery. Verify unchanged validation
steps against the reviewed source; use the retained focused regression tests for
failure propagation. Their npm/git failures are stubs, not hosted failure evidence.

## Ordered pilot, after final review and root authorization

1. Freeze #502's reviewed head/base/merge identities and protection snapshot. Retain
   its cheap draft admission. Root marks #502 ready exactly once and starts the
   genuine complete Full gate. Every required step must actually pass.
2. Replay one recorded current-candidate draft event during that validation and,
   if available, one owned old-head/base draft event after it. Each must fail
   before checkout under the non-required name and must not cancel current work.
   Record the actual group identities. An old draft replay proves the combined
   candidate/lane partition, not old-ready isolation independently; focused source
   contracts cover old-ready head/base/merge separation without another full run.
3. After the genuine current-candidate pass, root may create a separate branch
   pointing to #502's identical head commit and open exactly one companion PR as
   draft against unchanged main. Do not mark the companion ready. Its newly created
   suite must contain only cheap `Draft PR (not validated)` admission, later than
   the primary's passing suite, while #502 stays ready. No event is suppressed and
   no success is manufactured. Record both PRs' head/base/merge identities and all
   suite/run/check associations rather than assuming shared commits imply shared
   required-check selection.
4. Inspect #502's actual required-check resolution and current mergeability,
   including the Actions app identity and unchanged strict protection. Establish
   whether GitHub includes the companion's newer suite in #502's selection context.
   A shared head SHA, a REST `filter=latest` response, or a still-green primary
   alone does not prove that association. If the newer suite participates and the
   genuine Full pass remains selected, record that bounded selection result.

## Stop conditions and limits

Stop on cross-group cancellation, any draft job named `Full check`, a hidden or
poisoned required result, candidate/protection drift, or missing evidence. Do not
repeat the experiment to chase delivery ordering. If the companion suite is scoped
only to its own PR, or its participation cannot be established, leave the decisive
selection claim pending. The companion probe is not a same-PR delayed-event
reproduction; keep that distinction explicit even if the shared-head probe passes.

With the current triggers, returning the same PR from draft to ready necessarily
creates another ready event. No deterministic same-PR newer-draft-suite reproduction
is established here without delivery timing or additional machinery. Moving the
probe post-merge alone does not remove that limit. A separately reviewed, carefully
staged post-merge probe may be proposed if necessary, but this plan does not
promise it can establish the missing case. Keep “fully proven” pending and retain
the drained-draft → ready workaround for unproven cases.

No pilot merges or settings/protection/permission changes are authorized. Separate
candidate groups can leave obsolete runs consuming minutes. Any cleanup must name
only owned obsolete runs, recheck their identity and never cancel current work.
Root coordinates companion cleanup after retaining terminal evidence.

## Setup/build duplication: separate recommendation

Both Full and Tutorial currently check out the same proposed merge, set up Node
24.19.0/npm 11.9.0 and run `npm ci`. That installation is duplicated. Their builds
are **not equivalent**: Full runs the Vinext production build; Tutorial builds a
plain Vite Home fixture and runs browser interactions. Reusing one build output
for the other would remove coverage. Full additionally installs pinned Python/Pillow.

After this race is proven, separately review using one runner's checkout/locked
installation for both existing build paths, with Tutorial's current path selection,
its complete scenarios, unchanged deadlines/receipts, and immutability checks after
each phase. Measure setup savings and added serial critical-path time before
adoption; two jobs cannot share an install merely by calling a reusable workflow.
Do not add dependency caches/artifact transfers or replace `npm ci` in this fix.
Tutorial's own PR-wide admission/cancellation policy is unchanged and needs its
own reviewed treatment if the workflows remain separate. This PR fixes the
required Full-check race only, not all Actions scheduling or setup cost.

Primary semantics: [concurrency and pending replacement](https://docs.github.com/en/actions/how-tos/write-workflows/choose-when-workflows-run/control-workflow-concurrency),
[expression context availability](https://docs.github.com/en/actions/reference/workflows-and-actions/contexts#context-availability),
[required-check selection and skipped/neutral outcomes](https://docs.github.com/en/pull-requests/how-tos/merge-and-close-pull-requests/troubleshooting-required-status-checks).
