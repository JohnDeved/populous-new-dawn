# Admission-only transaction core: unactivated source increment

This core is separate from integration/merge policy. Existing Full workflow
ready_for_review-only events and all merge protection checks are unchanged.
The explicit admission-cli.mjs uses an ordinary-PR observer and defaults to dry-run.
There is no poller or fixture-apply mode. Do not substitute raw PR assertions for
the reviewed observer or invoke live effects before independent source review. The known
protection-reader 403 remains an integration blocker, never a verified policy.

The trusted parent can register one reviewed exact head/tree/base/synthetic tuple
with pinned workflow hashes, independent review receipt, canonical journal path,
owner and a one-hour-or-shorter two-effect grant. No separate user prompts are
needed when the parent has authorized this bounded cycle. The core never adopts
new heads on its own or derives authorization from PR content. Superseding a
terminal registration requires its exact predecessor digest and a new reviewed
tuple; pending intents and previously registered tuples cannot reset their budget.

Production integration must hold the same canonical per-PR journal through each
bounded tick, via withAdmissionJournal. It reuses the existing fsync/atomicWrite
primitive and existing fixed gh mutation argument builder, but can reach only
draft/ready. Supply a freshly observing, reviewed trusted adapter and explicit
transport; no candidate code is executed. Persist intent and spend the effect
before calling transport. Returned submission is not confirmation. Timeout or
other transport uncertainty can only reconcile the same remote effect, not replay.
Head/base/synthetic/workflow drift stops; uncertain pending records cannot be
superseded. Existing matching source-bound required Full success is reused but
never certifies current merge eligibility. Missing ready admission stops after
five minutes. Failed/unknown required validation stops; active runs drain first.

The admission observer independently normalizes complete paginated
run inventory, strict draft state, main/head/merge/tree identities, ready-only
workflow bytes, source-bound Full provenance/required selection and any applicable
Tutorial validation. It must never fabricate complete/sourceBound flags or infer
success from a green name. It must exclude only already reviewed guard-only
history, not failed real validation. The adapter invokes the existing source-bound gate validation and additionally
pins the ready-only event block and ordinary GraphQL required-check selection.
This is usable source with offline coverage, not an activated live controller.

No server-side expected-head CAS exists for gh pr ready/--undo. Canonical local
ownership coordinates cooperating processes only, not remote humans or other
writers. Parent freezes branch pushes during the pair; pre-effect reobservation
and post-effect reconciliation fail closed on drift but cannot guarantee that an
unexpected remote head never receives CI. Existing merge authority is untouched.

Tests are offline injected-observation/transport fixtures, covering bounded
cycle/quiet windows, exact-pass reuse, missing admission deadline, failure and
unknown outcomes, fresh-state drift, persistence failure, registration history
and journal lock/restart. They are not hosted proof, approval or production keys.

## Explicit bounded CLI contract

Run from an independently reviewed clean driver commit, with an existing clean
candidate checkout containing the exact synthetic objects. The tool never fetches,
installs dependencies or changes source refs. Keep the standard reviewed queue
entry, independent review receipt, parent grant and canonical journal outside the
candidate. Existing entry schema remains required, but allowMechanicalRefresh
must be false and workflowTransition is forbidden.

The grant is version 1, repo JohnDeved/populous-new-dawn, positive pr, owner matching
entry.approvedBy, canonical journalPath, authority one-draft-ready-cycle, numeric
createdAt/expiresAt (milliseconds, at most one hour), entryDigest=digest(entry),
exact driverHead, tuple {head,tree,base,merge,mergeTree}, matching workflowHashes,
and review {decision:ACCEPT,reviewer,tupleDigest,receiptSha256}. Digests use the
existing queue digest function; receiptSha256 binds the actual independent review
file. Parent-supplied file hashes are the local trust boundary, not signatures.
No credential or example live grant is shipped.

First explicit registration (or successor with previous registration digest):

    node scripts/integration-queue/admission-cli.mjs --entry /trusted/entry.json --entry-sha256 HASH --grant /trusted/grant.json --grant-sha256 HASH --candidate /isolated/candidate --journal /trusted/admission.json --register --previous none

Subsequent bounded observation uses the same arguments without --register/--previous.
It is dry-run unless --apply is explicitly supplied. One apply call can submit at
most one effect. Reinvoke only to observe/reconcile and, after a confirmed draft
and quiet window, submit the remaining already-authorized ready effect. No effect
is automatically retried after uncertainty. Expired grants permit reconciliation
but no new mutation. A missing admission deadline or stopped registration requires
inspection, not a new journal or grant for the same candidate. A stale lock after
host failure requires explicit owner reconciliation; it is not automatically erased.

No protection endpoint is read by this distinct observer. Its output explicitly
says protectionConfiguration=unverified-admission-only and mergeAuthority=false.
The default integration reader still reads protection and its unchanged policy
still requires strict protected Full checks. Passing CI here cannot waive that.

## Entry policy preflight

Trusted entry preparation can call deriveFullCheckDiagnostic on the reviewed
Full workflow bytes and pin its result in entry.fullCheckDiagnostic before hashing
entry/grant. CLI preflight independently checks those immutable bytes at head,
base and synthetic merge, the ready-only event contract and exact diagnostic
policy before any journal creation/write. It never repairs or rewrites pinned
inputs. Missing, extra or mismatched policy fails even before a draft run exists.
The diagnostic parser accepts only the reviewed literal benchmark-baseline job
with its fixed name, full-check dependency and literal activation PR condition;
changed/ambiguous forms require source review. Terminal source-bound receipt
validation remains unchanged. This prevents the PR531 omitted-policy failure
without reviving its stopped journal or replenishing any effect budget.
