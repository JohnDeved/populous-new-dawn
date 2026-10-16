# Ready-only admission: retained evidence and bounded pilot

The original split-name pilot proved cancellation isolation but failed newer-suite
eligibility. Preserve its results; do not relabel its passing Full run as coverage
for the follow-up trigger change. Root coordinates any further live transitions
after final source review. This document does not authorize execution or a merge.

## Retained split-name pilot

Primary #502 used head `870d3012f6d7800414b3a06efa106e9518bd38ff`, main base
`be840400c5c86da43ac49bcbcba38f292cbc02e8`, and synthetic merge
`5836a7f56aafef80e7f8b052b3ebd90406314007`.

- [Full run 38953672368](https://github.com/JohnDeved/populous-new-dawn/actions/runs/38953672368)
  passed 2,959 tests and the build in 17m8s. Its suite was `105570534959`, check
  `117151050552`. A recorded draft replay did not cancel it.
- Same-head companion [#504](https://github.com/JohnDeved/populous-new-dawn/pull/504)
  created [draft run 38956103241](https://github.com/JohnDeved/populous-new-dawn/actions/runs/38956103241),
  suite `105577381949`, check `117159244756`, which failed before checkout. Its own
  association named #504, but #502's rollup included it. Both draft checks were
  non-required; the original successful Full check remained required.
- #502 changed from CLEAN to BLOCKED with unchanged head/base/merge. Cloudflare
  subsequently succeeded. At 19:39:06 UTC on 2026-10-16, after closing #504, #502
  was still BLOCKED/MERGEABLE with original Full and Workers success and the
  companion draft failure in its rollup. No new runs/events followed closure.

These observations establish the eligibility failure, not GitHub's precise
internal blocking rule. The original raw pilot evidence is retained by the gate
reviewer; existing local receipts under `evidence/ci-event-race-20261016` remain
historical and are not rewritten. [Issue #473's earlier diagnosis](https://github.com/JohnDeved/populous-new-dawn/issues/473#issuecomment-6221240164)
records the preceding cancellation/same-name failure.

## Correction and queue contract

Admit the Full workflow only on `pull_request: ready_for_review` targeting main.
Keep every validation step, strict boolean guard, pinned dependency/runtime,
resource-policy classification, permission and concurrency field unchanged.
Opening/reopening, synchronize, draft conversion and edits no longer admit it.
Draft activity must create no run or suite attributable to this Full workflow;
other integrations are outside that claim.

For a reviewed new/changed candidate missing a valid full pass, including repairs
and main refreshes, the coordinator makes one draft-to-ready transition. If that
PR is already ready, return it to draft first. Reuse a genuine pass exactly matching
the reviewed head/base/merge; opening or reopening alone does not require a rerun.
A new head without a genuine matching Full pass remains
blocked; never treat absent checks, a skipped job or an older-head pass as success.
#503 owns the queue-driver adaptation. Main protection remains strict and unchanged.

The approved Linux production hash and all other resource-policy fields stay
intact. Verify the hosted installed-lock hash and actual parallel eligibility on
the next genuine run; do not regenerate the policy from a Mac installation.

## Revised pilot, after final source review and root authorization

Budget one genuine full validation and one root-coordinated same-head draft
companion observation. Do not rerun the old Full, inject test/build failures,
replay legacy draft workflows, repeatedly toggle readiness or chase delivery timing.
No extra pilot PR or transition is authorized by this proposal alone.

1. Freeze the reviewed corrected #502 head/base/merge, strict protection and source
   hashes. Root coordinates draft state and the same-head draft companion. Observe
   the companion's ordinary draft event and verify that it admits no Full-workflow
   run or suite. Capture PR events, run listings and suite associations, including
   creation times; a single immediate empty response is not sufficient evidence of
   absence. Use a bounded observation window and leave delayed/ambiguous evidence
   pending rather than repeatedly provoking events.
2. Root marks the primary ready once. Verify one genuine unconditional Full job on
   the exact reviewed merge, with all validation/build/immutability steps passing.
   Record installed lock, resource eligibility/counts, run/attempt/suite/check IDs,
   timestamps and raw logs. A failed gate remains a failure.
3. Confirm required-only checks, each check's `isRequired` flag, actual PR
   mergeability and unchanged head/base/merge/protection. The Full pass must remain
   selected while the companion stays draft, with no draft admission suite from
   this workflow. Missing associations or an unexplained BLOCKED result prevent
   acceptance; REST `filter=latest` or a green Full result alone is insufficient.

Stop on an unexpected draft admission, candidate drift, cancelled current work,
missing terminal evidence or blocked eligibility. Do not fabricate statuses, alter
protection/permissions or merge either pilot PR. Root handles bounded companion
cleanup after retaining evidence. The previous passing Full remains intact; the
corrected trigger is not hosted-proven until this revised pilot passes.

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
own reviewed treatment if the workflows remain separate. This PR addresses the
required Full-check race; hosted acceptance remains pending for the trigger correction.

Primary semantics: [concurrency and pending replacement](https://docs.github.com/en/actions/how-tos/write-workflows/choose-when-workflows-run/control-workflow-concurrency),
[expression context availability](https://docs.github.com/en/actions/reference/workflows-and-actions/contexts#context-availability),
[required-check selection and skipped/neutral outcomes](https://docs.github.com/en/pull-requests/how-tos/merge-and-close-pull-requests/troubleshooting-required-status-checks).
