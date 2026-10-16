# Ready-PR full verification

The authorized `.github/workflows/ready-pr-check.yml` runs the standard
`npm run check` and `npm run build` gates on a standard GitHub-hosted Ubuntu VM.
It does not deploy, record new parity, run original-game binaries, or replace
native, rendered-browser or hardware-performance acceptance.

## Working sequence

1. While editing, run affected focused checks and complete substantive review and
   any native/browser/performance evidence. Push a coherent candidate as a draft.
2. Mark the PR ready when its candidate is ready for the full gate. `Full check`
   runs typecheck, every discovered top-level test, parity and orchestration checks,
   then a production build. Do not launch a duplicate local full gate while this
   one is pending; continue independent work in another branch or review/research.
3. Repair failures with focused feedback and push. A synchronize event starts the
   updated gate. Never weaken assertions, omit test files or regenerate reference
   evidence to obtain a pass.
4. Before merging, verify the current reviewed PR head, current main base and exact
   tested merge match the successful check. Keep the run URL/attempt, source SHAs,
   command results and raw job logs with the PR's evidence. Source changes invalidate
   earlier coverage. A canceled, missing or failed check is not a full pass.

## Events and draft behavior

PRs targeting main trigger on `opened`, `reopened`, `synchronize`,
`ready_for_review` and `converted_to_draft`. There is no push trigger or path filter.
This avoids a second full run for the same push and a redundant post-merge run.

Drafts fail the first, inexpensive readiness step. Checkout, installs and full
checks do not run. The red draft check is intentional: GitHub independently blocks
merging drafts, but a conditionally skipped required job can count as successful.
Marking ready launches the real gate instead of preserving an untested green check.

The concurrency group is specific to this workflow and PR. A newly admitted run
cancels its predecessor. Admission is not a chronological comparison of commit
SHAs: a manual rerun of an old event can cancel a newer run. Do not rerun obsolete
attempts; verify the current head/base rather than simply trusting the latest run
in a list. Converting back to draft cancels unnecessary work.

Retargeting a ready PR to main emits `edited`, which this workflow does not handle.
After retargeting, start a fresh supported event by returning it to draft and
marking ready, reopening it, or updating its head. Main moving independently also
does not start a run: update/rebase the PR before accepting the new combined tree.
A future merge queue needs a separately reviewed `merge_group` trigger.

## Reproducible inputs

Checkout pins the PR event's synthetic merge SHA (`github.sha`), with full history
and credentials persistence disabled. It does not test only the unmerged head.
Full history is needed because `tests/erosion-observation.test.mjs` reads the
accepted `app/erosion.ts` from commit `3b899125cc8cedef938823718ad5d44f49957b66`.
The workflow verifies that blob exists and records the head, base, merge and
runtime identities. An unexpected tracked-file mutation fails the final step.

Node 24.19.0, npm 11.9.0 and Python 3.12.14 are explicit. `npm ci` installs the
tracked lockfile. Portable Python fixture tests require Pillow; the CI requirement
pins the CPython 3.12 Linux x64 Pillow 12.3.0 wheel and its PyPI SHA-256. This is
separate from optional native-research dependencies in `decomp/requirements.txt`.
The aggregate uses tracked imported assets and synthetic/historical fixtures;
original installation files, Ghidra, Wine and private credentials are not inputs.
A new missing prerequisite must fail visibly rather than silently skip a test.

The existing resource policy still decides C2 versus C1. A fresh CI install can
produce a different installed lockfile; all tests then safely run serially.
Inspect `pnd-test-plan.parallelEligibility` and the logged counts. Never refresh
resource hashes automatically simply to recover concurrency. The 120-minute job
timeout is a safety bound; a timeout is a failure, not partial acceptance.

## Permissions and cost

The workflow uses only official SHA-pinned actions and `contents: read`.
It has no secrets, token write scopes, persisted checkout credentials, deployments,
self-hosted/larger runners, Actions caches, artifact uploads or custom images.
Do not introduce private data into its public logs.

Standard hosted runner use is free for this public repository. Larger runners are
paid even for public repositories. Workflow logs and job summaries do not count
against artifact storage. The current design creates no expected Actions charge;
changing the repository visibility, runner or storage choices requires revisiting
that conclusion. [GitHub billing](https://docs.github.com/en/billing/concepts/product-billing/github-actions)

## Enforcing the merge gate

A workflow file alone does not require a passing check. Branch protection/ruleset
configuration is a separate owner-authorized administration action, not performed
by this workflow. Do not claim enforcement until the actual settings are verified.
Until then, the parent must explicitly wait for the matching successful gate.

After a successful pilot, the owner can use repository Settings → Branches to
add/edit a main branch protection rule: require pull requests; require the observed
`Full check` status from GitHub Actions; require branches to be up to date; and
apply the rule to administrators without an owner bypass. An equivalent active
main ruleset is also suitable. Preserve unrelated existing settings. The required
job name must stay stable; no other workflow should reuse it.

Verify the settings against the PR's mergeability before claiming enforcement.
A denied administration endpoint is not permission to retry with another identity.
Keep existing fork-run approvals; a first-time contributor may need approval before
CI can execute. Workflow results do not substitute for substantive code review.

## GitHub semantics

- [PR events and merge SHA](https://docs.github.com/en/actions/reference/workflows-and-actions/events-that-trigger-workflows#pull_request)
- [Required checks and skipped jobs](https://docs.github.com/en/pull-requests/how-tos/merge-and-close-pull-requests/troubleshooting-required-status-checks)
- [Workflow concurrency](https://docs.github.com/en/actions/how-tos/write-workflows/choose-when-workflows-run/control-workflow-concurrency)

## Initial rollout evidence

On 2026-10-16, the [first draft run](https://github.com/JohnDeved/populous-new-dawn/actions/runs/38869175179)
for PR #475 at head `737b84399c62a25cc2d3f809aef38f719ddd3045` failed only the
readiness guard. Checkout, runtime setup, dependency installs, full checks and
build were all skipped. This verifies the cheap draft boundary, not a full pass.
Current ready/synchronize runs and the final reviewed candidate's full results are
recorded on [PR #475](https://github.com/JohnDeved/populous-new-dawn/pull/475).
