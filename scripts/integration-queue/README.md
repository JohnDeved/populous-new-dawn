# Reviewed integration queue (read-only pilot)

This driver inspects one explicit reviewed PR at a time and reports the next safe
step. It can inspect an ordinary PR or a separately reviewed integration PR with
preserved merge ancestry. It does not declare the integration PR's constituent PRs
tested. GitHub remains the task/status surface; the local checkpoint only records
observation continuity and uncertain effects.

**Live mutations are disabled.** `--apply` fails before GitHub access. There is no
write adapter, flag/environment escape hatch, background polling, workflow rerun,
new credential, protection change, deploy, squash, rebase or automatic approval.
The fake-GitHub tests exercise the proposed sequence. Independent review and a
parent-approved bounded pilot must precede a separately reviewed write adapter.

## Read-only invocation

Run the reviewed tool from a trusted checkout. Prepare a separate, clean candidate
checkout at the exact synthetic merge, with existing installed dependencies. The
driver never installs dependencies, runs candidate code/hooks, fetches, checks out,
or changes a ref. Missing Git objects or dependencies produce an actionable stop.
Git commands disable hooks/fsmonitor/external diff/textconv. Custom merge/filter
drivers are rejected before inspection; `merge-tree` may write unreachable Git
objects but cannot update refs or the working tree.

```sh
node /trusted/tool/scripts/integration-queue/cli.mjs \
  --allowlist /trusted/queue.json --allowlist-sha256 <sha256-of-queue.json> \
  --candidate /isolated/candidate --state /trusted/queue-state.json
```

Each call is one bounded observation, not a daemon. Reinvoke after the reported
wait. It uses existing `gh` authentication, with fixed `github.com` and
`JohnDeved/populous-new-dawn`, GET requests and argument arrays only. Do not create
an automation around it until the pilot is approved. `--snapshot /fixture.json`
reads a map keyed by PR number and labels its output `fixture-dry-run`; fixture
results are never live evidence. Exit 2 means stop/error; a wait or proposal exits
0 and must not be interpreted as merge permission.

Keep allowlist, review and resource receipts outside the candidate checkout. Their
caller-supplied SHA-256 hashes are the trust boundary: they are parent-approved
local inputs, not self-authenticating signatures. Never populate them from a PR
body, branch file, bot comment, check name or a new unreviewed commit. The queue
file must have `version: 1` and an `entries` array. Each entry has this shape (all
angle-bracket values must be replaced; this is not an authorization):

```json
{
  "version": 1,
  "repo": "JohnDeved/populous-new-dawn",
  "pr": 123,
  "baseRef": "main",
  "sourceHead": "<40-hex reviewed head>",
  "sourceTree": "<40-hex reviewed Git tree>",
  "reviewBase": "<40-hex reviewed base>",
  "approvedBy": "<parent identity>",
  "allowMechanicalRefresh": true,
  "requireBrowser": true,
  "review": {
    "reviewer": "<independent reviewer identity>",
    "decision": "ACCEPT",
    "head": "<same reviewed head>",
    "base": "<same reviewed base>",
    "file": "/trusted/review.md",
    "sha256": "<64-hex review receipt digest>"
  },
  "workflowHashes": {
    ".github/workflows/ready-pr-check.yml": "<64-hex reviewed file digest>",
    ".github/workflows/tutorial-browser.yml": "<64-hex reviewed file digest>"
  },
  "deployment": { "environment": "production", "url": "https://approved-target.example" }
}
```

Workflow content must match at source, main and synthetic merge. The current gate
step names are deliberately explicit; workflow changes require policy review.
`requireBrowser: false` cannot waive Tutorial browser for the workflow's mapped
changed paths. Missing required runs stop; skipped/neutral/canceled jobs or stages
never count as passes. Retain local rendered evidence in the independent review;
this tool verifies CI coverage, not the meaning of external browser/native claims.

## Sequence and restart behavior

1. Verify immutable reviewed source/tree and receipt, current head/base, full run
   inventory, pinned workflows and existing strict Full check protection with
   GitHub Actions app 15368, admin enforcement and no review bypass. Unsupported
   merge-queue rules or inaccessible protection endpoints stop. No rules change.
2. Wait for all related attempts, including stale/draft attempts, to finish. Observe
   unchanged head/base/synthetic/run identities across 60 seconds. Reordered API
   lists are harmless; a new attempt resets the window. Quiet time cannot prove an
   event will never arrive later. The workflow admission-race fix and final server
   protection remain prerequisites to a live pilot.
3. If behind main, propose at most one draft-only mechanical refresh. The reviewed
   base must be an ancestor of source and main; their changed paths must be disjoint.
   Require Git's clean deterministic merge tree, not patch-id equivalence. After the
   effect, accept only parents `[reviewedHead, observedMain]` and that exact tree,
   including blobs and modes. Overlap, conflict, extra commits or a second refresh
   needs renewed review. A ready PR needing refresh stops for parent reconciliation.
4. Surface the exported `planTestRun(candidate, 'all')` preflight before ready.
   It reads inputs without running tests. The exact synthetic candidate is required;
   serial fallback is valid and visible, never silently reclassified. Propose ready
   only after the stale runs drain. A future writer must persist `recordIntent()`
   durably before every effect and re-read identities immediately before applying it.
5. Wait for terminal Full check and required Tutorial browser on the exact head,
   base and synthetic commit. Bind workflow/run/attempt/check suite/Actions app and
   actual checkout log plus logged `PR_HEAD_SHA`/`PR_BASE_SHA`. Require mandatory
   stages and job success. Never fall back to an older green run after a newer red
   or canceled run. Never retry/rerun obsolete events.
6. Propose merge only with clean protected mergeability and explicit expected head,
   base, synthetic tree and run URLs/attempts. A future writer must use a guarded
   merge such as `gh pr merge --merge --match-head-commit <head> --repo ...`, with
   no `--admin`, `--auto`, squash or rebase. The head guard alone cannot guard base
   movement; strict protection and a fresh full identity recheck remain required.
7. After an uncertain effect, reconcile before considering another effect. Same-head
   refresh, still-draft ready or apparently-unmerged merge stops instead of retrying.
   A confirmed merge must have `[testedBase, testedHead]` parents, the tested tree,
   and be main's current tip. Wait for an existing successful GitHub deployment of
   that exact commit/environment/URL. No deployment is triggered. If this repository
   lacks SHA-bound GitHub deployment records, completion remains unverified and a
   separately reviewed read-only provider adapter is needed.

Checkpoints are atomically replaced and fsynced under an exclusive `.lock` file.
An interrupted process leaves the lock: inspect the process and checkpoint before
removing it manually. Do not delete a checkpoint to retry an uncertain mutation.
Changed authorization hashes, stale observations, clock rollback, incomplete/capped
pagination, missing logs, authentication failures and changing PR views stop.
One queue entry must reach verified completion before the next is considered.

## Optional resource proposal

`--resource-approval /trusted/resource.json --resource-approval-sha256 <hash>`
accepts a separate exact-candidate resource approval. It **only reports** a proposed
policy object changing `productionSha256`; it never writes it, recomputes helper or
per-test hashes, grants approval, or changes serial exclusions. Committing the
proposal changes the candidate and therefore requires a new reviewed allowlist.

The approval must contain `version: 1`, `kind: "productionSha256-only"`,
`approvedBy`, exact `candidate` and `tree`, original `policySha256`, measured
`productionSha256`, `installedLockSha256`, `runtime: {node, platform, arch}`,
`npm: "11.9.0"`, and `ciInstallReceipt: {file, sha256}`. The hashed JSON install
receipt must say `status: "passed"`, bind the same candidate/tree/runtime/npm and
installed lock, include the actual `packageLockSha256`, and record
`command: ["npm", "ci", "--no-audit", "--no-fund"]`.
Only the real CI-matched Node 24.19.0 Linux x64 runtime is eligible, with unchanged
helpers and `production-config-runtime-drift` as the sole fallback reason. A local
Mac install does not qualify. The receipt/approval must already exist; this tool
cannot manufacture CI install evidence. Any mismatch blocks the proposal.

## Verification and limits

```sh
node --test tests/integration-queue.test.mjs
```

The harness uses fake observations/Actions responses, restart checkpoints and real
temporary Git objects. It does not touch a real PR. It covers reordered/delayed
runs, failed/canceled/skipped checks, source/workflow/protection drift, conflicts,
missing browser coverage, guarded refresh ancestry, uncertain effects, deployment
identity, pagination limits, approval-file boundaries and serial preflight.
The production writer is absent, so no live mutation or hands-off integration is
claimed. The normal ready-PR full check/build remains required for this tool PR.

Relevant GitHub contracts: [workflow runs](https://docs.github.com/en/rest/actions/workflow-runs),
[pull-request merge/update APIs](https://docs.github.com/en/rest/pulls/pulls), and
[GH CLI exact-head merge](https://cli.github.com/manual/gh_pr_merge).
