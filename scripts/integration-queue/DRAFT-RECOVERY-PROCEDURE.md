# Owner-operated recovery procedure (not autonomous activation)

No command below mutates GitHub itself. The owner separately approves each exact
connector descriptor after source review/tests and exact grant inspection.
Never use the old admission CLI after a recovery sidecar exists.

## 1. Reconcile abandoned lock without changing history

Preserve the original journal bytes/SHA256, pending registration/intent and rejection
receipt. Record the original action's authoritative session outcome and current
process identities. Inspect both the wrapper and descendants; if any may still
operate, stop. Fetch ordinary current exact PR tuple, full timeline and active run
inventory. A disappeared local process does not establish an unsent remote request.
Keep original outcome UNKNOWN. Root must explicitly approve removal of only the
abandoned canonical journal lock after these checks. The recovery CLI does not
remove stale locks and must never be invoked through a copied journal or new path.
Do not delete/rewrite the journal or reset any effect budget. Preserve the lock
metadata and owner reconciliation receipt before removing the abandoned lock.

## 2. Pin reviewed inputs

Use a clean independently reviewed driver commit and supported task-local gh with
existing authentication. No login, credential copying or scope change is needed.
Prepare a version1 recovery grant with repo/pr/owner matching original, authority
`one-draft-convergence-only`, exact originalJournalSha256, registrationDigest,
originalIntentDigest, tuple, workflowHashes, numeric authorized GitHub actorId,
createdAt/expiresAt (maximum ten minutes), terminatedAt, denialReceiptSha256,
authorizationReceiptSha256, terminationReceiptSha256, originalTransportOutcome
`unknown`, readyAuthority false. Termination evidence concerns local actors only.
The owner accepts that a delayed old draft may later stop progress.

A trusted manifest contains canonical absolute originalJournalPath/hash,
grantPath/hash, driverHead, candidate, original entryPath/hash, and denialReceiptPath,
authorizationReceiptPath, terminationReceiptPath. Never copy the journal to evade
its lock. Every JSON input is passed with its exact byte SHA256. Small evidence
files remain outside source control and outside candidate checkout.

Invocation (all paths canonical absolute; symbolic metavariables below):

    node scripts/integration-queue/draft-recovery-cli.mjs MANIFEST MANIFEST_SHA MODE INPUT INPUT_SHA

The optional mode-specific INPUT must still be an explicit hashed JSON file.

## 3. Observe and prepare, without dispatch

Run mode `observe` twice with at least sixty seconds between the first completed
observation and second start, retaining each raw result. Each observation enumerates
the entire ordinary timeline and all head-associated workflow runs twice, checks
pagination/coherence and immutable source/workflow identity, and reuses the existing
source-bound admission observer. Supply both in INPUT.observations to mode `prepare`.
The canonical sidecar stores the separate allowance before any action can be exposed.
If draft is already observed with exactly one attributable transition, preparation
records state-based convergence without a connector call or original-success claim.
Otherwise it reports prepared-not-dispatched. Never substitute an editable success
boolean for these observations.

## 4. One explicit draft connector boundary

Mode `dispatch-draft` freshly observes again and durably records descriptor digest,
local invocation ID and spend before returning the descriptor. Root may invoke only
that exact github.convert_pull_request_to_draft target once. A local invocation ID
is coordinator correlation, not a GitHub request ID. If the descriptor/result is
lost or ambiguous, do not repeat the call or reset history.

Save the actual raw structured connector result/error. Mode `record-draft` INPUT:
rawReceiptPath and receipt containing exact tool, arguments, recoveryDigest,
localInvocationId, descriptorDigest, actual available toolCallId (or null), rawReceiptSha256,
startedAt/finishedAt and outcome returned/denied/unknown. Returned is not proof of
state. Mode `observe-draft` independently verifies exact tuple and attributable
conversion history and records convergence basis while original UNKNOWN remains.

## 5. Separately authorize original ready once

Only after observed convergence and unchanged sixty-second quiet interval may root
issue INPUT.authorization for mode `prepare-ready`: authority
`original-ready-once-after-draft-convergence`, owner, original registrationDigest,
recoveryDigest, recoveryEvidenceDigest, exact tuple, createdAt/expiresAt (max ten
minutes), acceptDelayedDraftLivenessRisk true, onUnexpectedRedraft
`permanent-stop-no-retry`. The original ready allowance must never have been spent.
The driver reuses original source-bound admission gates and consumes that original
allowance in the fixed sidecar before returning one mark-ready connector descriptor.
It does not create a second ready budget. Root invokes that exact connector once.
Record its actual receipt with `record-ready`, then `observe-ready`. Unknown/denied
ready, redraft, conflicting actor/history or drift stops with no second ready.

## 6. Validate, never infer merge permission

Use `verify-final` while hosted work proceeds. It waits read-only for active genuine
validation; absent admission beyond five minutes, invalid source proof or failed
gates stop. Terminal validation requires exact required Full and applicable Tutorial
provenance plus fresh current tuple/timeline/not-draft state. Retain receipt artifacts.
Even validated state grants no merge authority: final merge decisions still require
fresh protected-check/server mergeability checks. A delayed original draft is an
explicit fail-closed liveness risk, never evidence that source or server guards can
be skipped. This procedure never claims the old network request was unsent.
