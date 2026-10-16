# Draft/ready event race: bounded hosted pilot proposal

Source review and parent coordination must precede the pilot. This plan does not
authorize execution, a merge, protection changes, extra token scopes, status
writes or a new workflow. Keep the normal reviewed-PR queue separate from this
disposable pilot PR. Local policy tests are not hosted lifecycle evidence.

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

## Ordered pilot, after approval

1. Open the disposable candidate as draft. Verify its only admission job is
   `Draft PR (not validated)`, failing the first guard with checkout/install/full
   checks/build unexecuted. No job named `Full check` may appear for that event.
2. Freeze its reviewed head/base/merge, mark ready and start the genuine full gate.
   Rerun the recorded draft event while ready validation is active, then after
   it succeeds. Confirm draft admission cannot cancel running or pending ready
   work. Every accepted `Full check` must have all required steps passed.
3. Exercise ready → draft → ready with the same frozen source. Record three
   overlapping admissions, including a duplicate ready event: duplicates for the
   exact same candidate may supersede each other, but a draft event may not replace
   their pending/running lane. Do not infer chronological ordering from run IDs.
4. Preserve one old-head run, update only pilot fixture source, and replay the old
   event after the new candidate starts. For old-base isolation, use a retained
   pilot event across a naturally occurring authorized main advance; update the
   pilot branch to that main and replay the old event. Do not advance main solely
   for this test. Neither old candidate may cancel the current one.
5. On disposable pilot commits, introduce one ordinary failing test assertion and
   one deliberate production-build input error separately. Observe genuine gate
   failures (tests must stop the build; build must fail after a passing full check).
   Cancel one active pilot validation explicitly and verify cancellation is not
   accepted as a pass. Revert the fault commits, review the final source, and run
   its complete gate again. No injected failure belongs in the fix PR.
6. Required selection is the decisive check: obtain a real passing current-candidate
   gate, then a *newer suite* containing only draft admission while the PR is ready.
   A rerun of an older draft suite is insufficient to establish this ordering.
   Normal rapid transitions may expose delayed delivery; record actual timing.
   Do not add delay hooks or claim this case passed if ordinary events do not
   produce it. Verify the real pass remains selected by required-only checks and
   current PR mergeability, with strict protection unchanged. REST `filter=latest`
   alone is not a mergeability oracle.

Stop on cancellation across distinct groups, an unexpected `Full check` on a
draft event, hidden/poisoned required checks, source drift, unexpected permissions
or missing terminal evidence. If the newer-suite case cannot be reproduced, leave
that claim pending; if it fails, reject this design and retain the queue workaround.
No merges are part of the pilot. Bound execution to these cases. Separate candidate
groups can leave obsolete runs consuming minutes. After recording their behavior,
the parent may cancel only explicitly identified, owned obsolete pilot runs, after
rechecking that none belongs to the current candidate; never cancel current work.

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
