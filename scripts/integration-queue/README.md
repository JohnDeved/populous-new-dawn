# Reviewed integration queue (guarded pilot)

This driver inspects one explicit reviewed PR at a time and reports the next safe
step. It can inspect an ordinary PR or a separately reviewed integration PR with
preserved merge ancestry. It does not declare the integration PR's constituent PRs
tested. GitHub remains the task/status surface; the local checkpoint only records
observation continuity and uncertain effects.

**Dry-run is the default.** The writer can submit one draft conversion, source or base-metadata refresh, ready transition or
exact-head merge only with an explicit parent-approved, independently reviewed
plan and short-lived pilot. It has no background polling, workflow rerun, new
credential, protection change, deploy, squash, rebase or automatic approval.
No live mutation pilot has been run during implementation. Root must authorize
that separately after independent review.

## Read-only invocation

Run the reviewed tool from a trusted checkout. Prepare a separate, clean candidate
checkout at the exact synthetic merge, with existing installed dependencies. The
driver never installs dependencies, runs candidate code/hooks, fetches, checks out,
or changes a ref. Missing Git objects or dependencies produce an actionable stop.
Actions job logs use `--allow-escape-sequences` only on fixed-repository numeric
job-log GETs captured through pipes. Raw captured logs are hashed before terminal
controls are stripped for parsing; they are never rendered directly. Other GETs
retain the default escape protection, and failed-child diagnostics are sanitized.
Git commands disable hooks/fsmonitor/external diff/textconv. Custom merge/filter
drivers are rejected by reading configuration before status, preflight or other
Git operations can inspect working files; `merge-tree` may write unreachable Git
objects but cannot update refs or the working tree.

```sh
node /trusted/tool/scripts/integration-queue/cli.mjs \
  --allowlist /trusted/queue.json --allowlist-sha256 <sha256-of-queue.json> \
  --candidate /isolated/candidate --state /trusted/queue-state.json
```

Each call is one bounded observation and at most one explicitly armed effect. Reinvoke after the reported
wait. It uses existing `gh` authentication, with fixed `github.com` and
`JohnDeved/populous-new-dawn`, GET requests for observation and fixed argument arrays for guarded mutations. Do not create
an automation around it until the pilot is approved. `--snapshot /fixture.json`
reads a map keyed by PR number and labels its output `fixture-dry-run`; fixture
results are never live evidence. Version-2 checkpoints bind fixture/live mode, a
random journal ID and the canonical journal path. Fixture history cannot seed a
live quiet window or pilot. Older checkpoint versions stop rather than migrate
implicitly. Exit 2 means stop/error; a wait or proposal exits
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
   needs renewed review. An exact reviewed ready head may propose conversion to draft
   before this refresh, with its own exact reviewed plan/pilot. Existing validation
   must be genuine and successful, or absent; failed, canceled, ambiguous or
   unverified validation stops. The adapter never adopts an unreviewed head.
   If GitHub still advertises the reviewed old base and synthetic, only the original
   allowlisted draft head/tree can enter a refresh-only observation. Both advertised
   and live base identities must stay unchanged across the observation; live main
   must descend from the reviewed base and pass the same disjoint merge-tree proof.
   Retain the old commit as `staleSynthetic`, never as the current `synthetic` or as
   current-main test evidence. Its run inventory still participates in draining.
   This exception cannot propose ready or merge. After refresh, require advertised
   base to equal live main, exact current synthetic parents and fresh preflight/gates.
4. Surface the exported `planTestRun(candidate, 'all')` preflight before ready.
   It reads inputs without running tests. The exact synthetic candidate is required;
   serial fallback is valid and visible, never silently reclassified. Propose ready
   only after the stale runs drain. The writer persists `recordIntent()` durably
   before every effect and re-reads identities immediately before applying it.
   With the pinned ready-only Full workflow, an already-ready candidate lacking
   initial Full admission may propose one reviewed draft conversion then one ready
   transition. An existing genuine matching pass on the identical head/base/merge
   is reused, including after reopen; BLOCKED still stops. A reconciled ready
   transition waits at most five minutes for missing Full admission, then stops
   without another toggle. The checkpoint permits only one draft/ready cycle and
   one mechanical refresh per entry. Each effect still requires its own pilot.
   Before ready, even a preexisting draft with a fresh checkpoint must have no
   failed, canceled, ambiguous or unverified real Full validation. Truly missing
   admission and verified cheap Full draft guards remain eligible. When Tutorial
   applies, its real failed, canceled, ambiguous or unverified validation also
   blocks ready. Only a positively verified Tutorial guard-only failure is excluded
   here: exact Actions check and pinned workflow, logged `IS_DRAFT: true`, failed
   readiness stage and skipped validation stages. Earlier real failures remain
   visible; the genuine Tutorial merge gate still excludes nothing.
5. Wait for terminal Full check and required Tutorial browser on the exact head,
   base and synthetic commit. Bind workflow/run/attempt/check suite/Actions app and
   actual checkout log plus logged `PR_HEAD_SHA`/`PR_BASE_SHA`. Require mandatory
   stages and job success. Never fall back to an older green run after a newer red
   or canceled run. Rank actual attempt/job start times, not numeric run IDs;
   require agreement with the current named Actions check on that head. Missing
   timestamps, ties or conflicting selection stop. A later failed rerun of an
   older run blocks the earlier green higher-ID run. Exclude only positively
   identified `Draft PR (not validated)` admissions: pinned workflow, Actions app,
   exact run/attempt/check, `IS_DRAFT: true`, failed readiness stage and skipped
   validation stages. This exclusion applies only to the Full check workflow
   lane introduced by #502. Tutorial browser retains its original required job
   name and must pass genuinely; its failed draft jobs are not ignored. Failed
   ready validations are never excluded.
   Never retry/rerun obsolete events.
6. Propose merge only with clean protected mergeability and explicit expected head,
   base, synthetic tree and run URLs/attempts. The writer uses `gh api` against
   fixed github.com, PUT `/pulls/N/merge`, `sha=<expected head>` and
   `merge_method=merge`. Refresh uses PUT `/pulls/N/update-branch` with
   `expected_head_sha=<expected head>`. Ready uses `gh pr ready N` with the fixed
   repository; draft conversion uses the same command with `--undo`. There is no
   admin/auto-merge/squash/rebase path. GitHub draft/ready has no
   head CAS, so fresh checks and subsequent reconciliation guard that transition.
   Head CAS cannot atomically guard base movement; root must serialize the
   integration lane, and strict protection plus final identity recheck remain
   required. Any unexpected post-effect parents/tree stop for reconciliation.
7. After an uncertain effect, reconcile before considering another effect. Same-head
   refresh, still-ready draft conversion, still-draft ready or apparently-unmerged
   merge stops instead of retrying. Draft/ready reconciliation also checks the
   exact submitted head/base; base movement stops for review.
   A confirmed merge must have `[testedBase, testedHead]` parents, the tested tree,
   and be main's current tip. Deployment observation follows the explicitly
   approved mode below. No deployment is triggered and no serving-production claim
   is inferred from a build check.

### Stale base metadata before Ready

An optional `allowBaseMetadataRefresh: true` entry admits one separately reviewed
`refresh-base` pilot, never an implicit addition to Ready. This is only for an
unchanged reviewed Draft head whose current main equals `reviewBase`, already lies
in the head's ancestry, and has synthetic parents `[main, head]` and the reviewed
tree, before Ready admission for the current explicitly reviewed candidate/journal.
This does not assert that the PR has never been Ready in its lifetime. The old
advertised base must be an ancestor of main. Review, workflow,
resource, drained-run and existing validation guards still apply; absent hosted
gates do not block the Ready event that starts them. Genuine failed gates remain
failures, not metadata exceptions. Admission-only mode has no refresh authority.
An already-failed Ready, including a stale-event parent-identity preflight that
ran no tests, needs separate explicit recovery review. This prevention path does
not retroactively accept, exempt or replay failed attempts.

The fixed PATCH updates only the same PR's already-intended `base=main`. It cannot
retarget another branch and has no head/base CAS, so serialize the integration
lane. Persist intent before submission; an independent subsequent GET observation
must prove the same head/ref, main, Draft state, synthetic commit/parents/tree and
refreshed advertised base. A response body alone is not confirmation. Stale or
changed readback stops without another PATCH. Ready still needs its own pilot and
new quiet observation window. Do not reset the journal to replenish the allowance.
This refresh repaired observed stale metadata, not a guaranteed GitHub behavior;
CI's exact parent checks remain unchanged.

Checkpoints are atomically replaced and fsynced under an exclusive `.lock` file.
An interrupted process leaves the lock: inspect the process and checkpoint before
removing it manually. Do not delete a checkpoint to retry an uncertain mutation.
Changed authorization hashes, stale observations, clock rollback, incomplete/capped
pagination (including short pages whose total_count promises more), missing logs, authentication failures and changing PR views stop.
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
The actual writer is covered through fake transports; no live mutation or
hands-off production integration is claimed before the approved pilot. The normal ready-PR full check/build remains
required for this tool PR.

Relevant GitHub contracts: [workflow runs](https://docs.github.com/en/rest/actions/workflow-runs),
[pull-request merge/update APIs](https://docs.github.com/en/rest/pulls/pulls), and
[GH CLI exact-head merge](https://cli.github.com/manual/gh_pr_merge).


## Arming one reviewed effect

A dry-run `propose` result includes a `plan` object. Save that exact object outside
the candidate checkout, hash its bytes, and have the independent reviewer inspect
the plan and exact clean driver commit. The parent may then create a pilot JSON
outside the candidate checkout. The driver does not create approvals or broaden
one action into a PR-wide authorization. Normal read-only calls continue polling
and reconciling between effects; the parent can coordinate the bounded sequence
without involving the user again.

```json
{
  "version": 1,
  "repo": "JohnDeved/populous-new-dawn",
  "pr": 123,
  "approvedBy": "<same parent as allowlist>",
  "planSha256": "<SHA-256 of exact plan file>",
  "createdAt": "<ISO UTC creation time>",
  "expiresAt": "<ISO UTC expiry, at most one hour later>",
  "review": {
    "decision": "ACCEPT",
    "reviewer": "<independent reviewer>",
    "planSha256": "<same plan file digest>",
    "driverHead": "<exact reviewed clean driver commit>",
    "file": "/trusted/pilot-review.md",
    "sha256": "<SHA-256 of independent review>"
  }
}
```

After root's explicit pilot authorization:

```sh
node /trusted/tool/scripts/integration-queue/cli.mjs \
  --allowlist /trusted/queue.json --allowlist-sha256 <hash> \
  --candidate /isolated/candidate --state /trusted/queue-state.json \
  --apply --plan /trusted/plan.json --plan-sha256 <hash> \
  --pilot /trusted/pilot.json --pilot-sha256 <hash>
```

The plan binds the allowlist and entry digests, driver commit, journal ID/path,
and exact action including head/base/tree/check attempts. The writer re-observes
live GitHub state and recomputes policy before submission. It fsyncs intent and
consumes the pilot before calling GH. A transport timeout, denied response,
non-confirming merge response, or interrupted process never authorizes replay.
`submitted` means the request returned, not that its remote effect is verified.
The next read-only call reconciles the pending intent. Reusing a consumed pilot
performs reconciliation only; it never submits a second action. Do not restore an
old journal, erase intent, or switch journal files to retry an uncertain request.
Fixture mode cannot arm the writer. Neither environment variables nor PR text arm
it, and no real pilot/approval file is shipped in this repository.

## Deployment observation modes

The current repository exposes Cloudflare Workers build checks on exact main
commits. To select that observer, replace `deployment` in the allowlist with:

```json
{
  "kind": "cloudflare-check",
  "appId": 85455,
  "appSlug": "cloudflare-workers-and-pages",
  "name": "Workers Builds: populous-new-dawn",
  "project": "populous-new-dawn",
  "productionBuildPrefix": "https://dash.cloudflare.com/19321bcee0ed17a93b709cb602dd070c/workers/services/view/populous-new-dawn/production/builds/"
}
```

The observer requires the exact merge SHA, pinned app/name/project and a production
build URL with a build UUID. A newer failed check cannot borrow an older success;
a preview, wrong project, wrong commit or wrong app cannot pass. Success reports
`merge: confirmed`, `deployment: provider-production-build-check-passed`, and
`servingDeployment: unverified`. It does not probe the site or prove which version
is serving traffic. A missing/pending check waits after confirming the merge;
a failed or unverified check stops with that distinction visible.

The original GitHub deployment observer remains available as
`kind: "github-deployment"` (or the original omitted-kind form), with an explicit
environment and URL. An explicit `{ "kind": "unverified", "reason": "..." }`
policy instead finishes with `merge: confirmed, deployment: unverified`; it must
never be described as production verification.

## Staged sharded-gate rollout

The default `fullCheckPolicy` remains `legacy-v1` (also used when omitted).
`sharded-v1` is an explicit, independently reviewed entry policy, never inferred
from a green check name or workflow content. It requires the real `Full check`
aggregate, `Quality and build`, and each `Test shard 1/4` through `Test shard 4/4`.
Every job must belong to the exact run attempt, have a GitHub Actions app 15368
check in its run's suite, and have all required stages genuinely succeed. Logs
must bind the same checkout/head/base. The aggregate receipt is independently
checked against immutable Git test bytes, the tracked lockfile, complete unique
four-way coverage, subprocess success, stable inputs, and exact provenance.
Skipped, canceled, missing, duplicate and stale receipts are not passes.
No candidate JavaScript is imported by this trusted reader.

Bootstrap requires two separately reviewed PRs:

1. Land the dual-policy driver and runner support while leaving both workflow
   files unchanged. Use the existing trusted legacy driver and real legacy full
   gate to validate this first PR. A driver in the candidate is not trusted merely
   because that candidate includes it.
2. From the landed, reviewed driver checkout, validate the separately reviewed
   workflow activation PR with `fullCheckPolicy: "sharded-v1"`, the new workflow
   digest in `workflowHashes`, and this narrow transition object:

```json
{
  "version": 1,
  "workflow": ".github/workflows/ready-pr-check.yml",
  "sourceHead": "<same exact reviewed sourceHead as entry>",
  "base": "<same exact reviewBase as entry>",
  "baseSha256": "<old workflow digest at that main commit>",
  "candidateSha256": "<new workflow digest at head AND synthetic>"
}
```

Place that object in `workflowTransition`; set `allowMechanicalRefresh: false`.
The authorization is bound into the existing allowlist/checkpoint digest and
independent source review. It permits only the named workflow difference for one
exact PR/head/base integration, not workflow adoption, a wildcard, a bypass, or
renamed legacy stages. Main advancement, source changes, a different workflow,
or a changed policy requires a fresh independent review and authorization.
After the exact merge, the existing one-effect journal reconciles only that merge
and the unchanged exact-commit deployment observer. Remove the transition field
from subsequent entries: normal sharded PRs require matching reviewed workflow
hashes at main, head and synthetic again. Strict `Full check` branch protection
and all writer permissions remain unchanged.

### Activation-only diagnostic baseline

When the reviewed workflow includes `Legacy test baseline (diagnostic)`, each
entry must explicitly set `fullCheckDiagnostic: { "activationPr": <literal PR> }`.
Exactly that seventh job is recognized; arbitrary extras or duplicates still stop.
For the activation PR it must genuinely succeed with the fixed setup/identity,
`Legacy full test suite`, and mutation-guard stages, the same run/attempt/app/check
identity, and logs proving the independent legacy full test inventory and successful
subprocesses. It is never counted as shard coverage or an alternative gate.
The reviewed workflow schedules this diagnostic after successful `Full check`.
The observer still drains the entire workflow and requires successful terminal
completion; a failed/canceled baseline stops instead of certifying a benchmark.
For every later PR, that job must be skipped with no executed steps. Keep the
same reviewed activation pin in those entries while the diagnostic remains in the
workflow. Omit the field only after a separately reviewed workflow cleanup removes
the diagnostic. There is no implicit extra-job exemption.

## Pause-recovery browser evidence policy

Historical entries keep the original Tutorial-only gate. The reviewed two-episode
workflow requires an explicit trusted allowlist `browserPolicy: "pause-recovery-v1"`;
never infer or import this policy from candidate code. It keeps the original
Tutorial job and mandatory step labels, then independently requires the named
`Pause checkpoint recovery browser` job from the same current run/attempt, check
suite, app, head/base/synthetic source and successful stages. Missing, skipped,
canceled, duplicate or extra jobs fail closed. The current recovery check must
also match the validated attempt, not merely an older green result.

The runner emits a bounded checksummed recovery envelope after cleanup and source
verification. The trusted reader checks its exact run/source identity, independently
hashed Git inputs, all five scenario assertions, ten named viewport/DPR captures,
official Chrome sandbox configuration, build/deadline result, unchanged dependencies
and clean source/runtime state. Screenshot and full-receipt hashes remain available
for artifact review; this structural gate does not itself interpret image pixels or
claim native/hardware equivalence. Initial rendered acceptance still includes image
inspection. The full-check/shard receipt parser is unchanged.

For the first workflow transition, explicitly approve a separate
`browserWorkflowTransition` with version 1, the Tutorial workflow path, exact
`sourceHead` and `base`, old `baseSha256` and new `candidateSha256`; its candidate
hash must equal `workflowHashes` and mechanical refresh must be false. A different
head/base or missing workflow observation invalidates that transition. After merge,
all workflow observations must match the new pinned hash. This field does not
relax an existing Full-workflow transition.

Before activation, the parent must independently review and pin the trusted reader
changes (`policy.mjs`, `github.mjs`, new `pause-recovery.mjs`) outside the candidate
checkout, update its trusted code manifest, and approve the new workflow hash and
source-bound review/allowlist. Candidate receipt producer changes alone cannot
activate or satisfy a trusted policy. Reuse no old authorization checkpoint after
changing the allowlist. No branch protection, deployment, credentials or automatic
candidate-policy installation is changed by this implementation.

## Profile companion raw-artifact admission

The Mission 10 companion keeps the 12,000-byte profile log limit. Its phase
`selection: 0` references the complete `resultName`/`resultSha256` raw report,
not an empty selection or a hash-only pass. The trusted reader requires the
current successful job's unique upload ID, name, size and SHA-256, and matching
repository/run/head artifact metadata. The raw host receipt must bind the same
head/base/merge/run/attempt as the compact envelope; reuploading an older receipt
into a newer artifact does not establish a new attempt.

The numeric repository-only GET is bounded to 16 MiB compressed. The in-memory
ZIP reader admits at most 128 regular entries, 32 MiB per file and 128 MiB total,
and the Profile resolver restricts names to its known host outputs and twelve
required flattened Mission 10 files. It rejects duplicate names, missing files,
symlinks, traversal, encryption, ZIP64, overlapping entries, inconsistent headers
or streamed descriptors, and CRC/length/hash drift. It never extracts, executes,
or loads code from the archive. The manifest binds each retained file's source
path, exact bytes and hash; both phase receipts and results, screenshots,
checkpoint continuity and runtime are cross-checked.

Trusted selection validation then reconstructs each query from every paused raw
observation, retaining the original fourteen actors as an ordered identity/class
subsequence while including all additional living Blue actors in observation
order. It independently recomputes all eighteen exact selected sets and validates
clearing, crew propagation, ownership, health, commands, RNG and paused state.
A missing raw observation or eligible extra actor cannot pass as a subset.

Before activation, independently review and pin the complete trusted import
closure, including `profile-artifact.mjs`, `../artifact-zip.mjs`,
`../local-render/mission10-selection-evidence.mjs` and its selection oracle.
Their candidate input hashes are also retained in `PROFILE_INPUTS`; this does
not authorize loading candidate code as the trusted validator. Existing workflow,
job-inventory, browser-deadline and permissions policies remain unchanged.

## Passive nine-job spell visuals reader support

`browserPolicy: "spell-visuals-nine-v2"` is a separately explicit opt-in and also
requires `browserCheckpointVersion: 4`. Neither observed jobs nor candidate
receipts select this contract. All older policies retain their exact inventories
and literal v3 Mission 10 checkpoints; a global v3→v4 reader replacement is not
supported. A nine-job contract requires all eight split jobs plus the successful
`Spell visuals browser` job. Its verified flag and current Actions check must
reconcile with the exact authenticated attempt, alongside Pause, Profile and
Mission 10. Current-check enumeration includes each selected recovery subgate;
previously it retained only the two aggregate gate names.

The ninth path authenticates job/check/app/suite/run/attempt/head, head/base/merge
log identity and pinned workflow bytes, then binds the upload log's unique numeric
artifact ID, exact `spell-visuals-browser-MERGESHA` name, byte count and SHA-256 to
both current-run enumeration and direct artifact metadata (including run/head and
unexpired state). Only a numeric repository-local ZIP endpoint is downloaded.
No receipt URL is followed. The separate 48 MiB compressed transport does not
change the Profile/Mission 10 16 MiB transport. ZIP limits remain 50 entries,
32 MiB per file and 96 MiB expanded total; each PNG is at most 16 MiB and 128
chunks with its existing dimensions. The decoded log envelope is at most 24,000
bytes. Artifact resolution alone is not authenticated admission.

Source hashes use a bounded byte-exact immutable Git blob read, including binary
PNGs, with hooks/fsmonitor/global attributes disabled, unsafe filter/merge-driver
configuration rejected, replacement objects and lazy fetch disabled, and no
candidate application imports. The reader is synchronous throughout; static
built-in zlib and ZIP decoding replace the candidate's async wrappers. Unresolved
Promises cannot set a verified flag. Required episodes remain exactly Angel and
Shield, with 50s/60s and 45s/55s execution/admission bounds, one common outer
deadline, terminal cleanup, and actual sandboxed hosted Chrome at
`/opt/google/chrome/chrome`. Local headless-shell results are not relabeled.

This is support staging only. Both active workflows, the main v3 checkpoint
writer, the pure round-robin Full planner, protection, credentials and external
trusted pins remain unchanged. No ninth live job is authorized or installed by
this code. The parent must independently review the entire diff and trusted
import closure before selecting task-local read-only pins; support landing does
not activate the feature. The previous eleven-file reader approval does not
extend itself, and PR655/658 are staging precedents only. PR687 approved no v4
reader transition. A future workflow transition requires its own source-bound
approval, exact workflow hashes and bounded ninth-job authorization.

The additional data-only closure is `spell-visuals-policy.mjs`,
`spell-visuals-artifact.mjs`, `spell-visuals-render-evidence.mjs`,
`shield-visuals-receipt.mjs`, `../tutorial-browser/shield-visuals-inputs.mjs`,
`../tutorial-browser/shield-evidence.mjs`, plus the unchanged
`../tutorial-browser/checkpoint-codec.mjs`, `browser-jobs.mjs`, and
`../artifact-zip.mjs`. Existing Profile/Mission 10 selection dependencies remain
part of the prior closure. Independent synthetic tests exercise the actual
synchronous GitHubReader pipeline and byte transports; they are not hosted browser,
visual review, native parity, or activation evidence.

## Passive composed eight-job artifact support

The separately caller-selected `profileArtifactPolicy: "composed-spells-eight-v1"`
requires `browserPolicy: "profile-split-v1"` and literal
`browserCheckpointVersion: 3`. It requires **both** Tornado evidence in Profile
and Spy evidence in Mission 10. The legacy default still rejects these additional
paths. Jobs, archives and receipt versions never select or upgrade the contract;
this route cannot select ninth-job/v4 support. It stages the PR691 producer at
`403c2bbc0387a16704098f31c1dc7ed2690fe13e` on the PR707 support dependency
`29bcefe4e7510c0fbd5a4db1dfb9d7a32a340b50`, without changing either producer.

All existing eight-job, official Chrome, Actions app/check/suite/run/attempt,
head/base/synthetic merge, workflow, upload-log and current-check reconciliation
remain required. The Profile and Mission 10 downloads each retain their 16 MiB
compressed cap, numeric repository-only endpoint and direct/current-run metadata
binding. ZIP limits remain 128 entries, 32 MiB per file and 128 MiB expanded total.
The explicit composed additions are:

- Profile: `tornado-appearance.json`; land `spawn`, `active`, `first-tail`,
  `last-tail`, `restart` normal PNGs; water `spawn`, `active`, `restart` normal PNGs;
  and land/water diagnostic black/white PNGs. Names are exactly
  `tornado-KIND-STAGE-normal.png` or `tornado-KIND-diagnostic-COLOR.png`.
- Mission 10: `spy-source.json`, `spy-source-context.png`, and exactly two
  `spy-source-frame-N.png` crops. Evidence version 3 requires genuine frame 0
  and frame 1. Later second frames 2–11 are negative fixtures, not substitutes.
  Historical ordinary-RAF receipts keep their original source and interpretation;
  they are not silently upgraded to version 3. Historical controlled-capture v2 receipts likewise retain their original interpretation. Version 3 additionally requires delivery.version1 and unchanged capture.version2: exact source-bound, test-routed native ESM preflight before capture ownership, with explicit HTTP-cache disabling and owned-route cleanup. Extra, missing, duplicate,
  cross-episode and failure-only paths fail closed.

Filenames alone do not admit evidence. Raw child reports must deeply match the
source-bound authenticated host. Only Tornado's documented raw-only `elapsedMs`
field is removed for that comparison; it must independently be finite,
nonnegative and within the retained budget, at most 90 seconds. Tornado checks
both genuine cast/stock transitions, readiness, frame/UV/depth/scale evidence,
original PSFB/palette pixels, paired black/white histograms with zero mismatches,
tail deletion and restart cleanup. Diagnostic dimensions must match retained
canvas/graphics and all diagnostic alpha must be opaque. Normal images are
structurally decoded; retained data has no normal-frame framebuffer hash or
absolute episode timestamps, so neither framebuffer equality nor direct outer
host-deadline equality is claimed.

Spy evidence version 3 checks literal v3 fixture/load digests, public action order, phase/entry/source
136 and original frame ownership, both same-frame crop hashes and decoded color
counts, paused actor/clock equality, resumed advance, cleanup and the original
45-second budget. The controlled-elapsed full-Scene protocol also requires its
transparent consecutive-turn ledger, exact next-visit entry, actual frame0/1
crops, paused non-evidence timestamp handback and final owned-hook/RAF cleanup.
It is not natural wall-clock timing or performance evidence; see
[the versioned capture contract](../../engineering/spy-capture-v2.md). Ordering uses `endedAt` from both retained Mission 10 phase
receipts. Crop bytes stay below 256 KiB and dimensions at most 256×256. Transfer
bytes are not retained; the claim is source-bound producer/load digest agreement,
not an independently reconstructed checkpoint. The context image is 1440×1000.
Composed images retain the 16 MiB bound and permit at most 512 total chunks,
including IHDR, IEND and metadata. This covers measured hosted Chrome output with
346–365 IDAT chunks in normal screenshots and 445 in the Spy context image.
The separate Angel/Shield 128-chunk limit is unchanged. The composed RGB8/RGBA8 parser checks
CRC, chunk order, dimensions, DEFLATE length and filters; rejects APNG and tRNS;
and permits only singleton pre-IDAT sRGB, standard sRGB gAMA and valid pHYs
metadata. No arbitrary pixel-interpretation chunks are ignored.

The complete candidate byte-input set is the explicit finite
[`composed-source-inputs.json`](composed-source-inputs.json), derived by static
inspection of that producer. It includes the Tornado adapter/fixture, native
fixture data, transitive rendering and clock inputs, and both `tornado.png` and
`unit-layers.png` atlases. The fixture's dynamic application loader conservatively
binds every `app/` file. Package inputs are bound through `package-lock.json`;
selected Profile/Mission 10 scenario roots and their local-render helpers are
included. Other dispatch branches do not run in these selected scenarios. The
reader hashes immutable Git blob bytes, never importing or executing candidate
application code. Source reads are bounded at 32 MiB each and 128 MiB total.

The trusted runtime closure rooted at `github.mjs` grows from 18 to **23 files**:
four new modules (`composed-profile-artifact.mjs`, `composed-spy-evidence.mjs`,
`composed-tornado-evidence.mjs`, `composed-png.mjs`) and the JSON inventory. Existing
`github.mjs`, `policy.mjs` and `profile-artifact.mjs` change; their other dependencies
remain part of the closure. Built-in assert/crypto/zlib and existing ZIP decoding
stay synchronous. Resolvers, verifier methods and the actual caller require
explicit non-thenable success before setting composed verification flags.

This dependent support branch leaves PR707's head, both active workflows, the v3
writer, round-robin Full planner and external trusted pins unchanged. The parent
must review the complete diff/import closure before separately selecting any
read-only trusted pins. Passing synthetic fixtures establish reader behavior,
not hosted browser acceptance, native parity, activation, Ready or merge approval.
