# Ready-only admission compatibility evidence

> Historical run artifacts referenced below are [retained at the pre-cleanup commit](https://github.com/JohnDeved/populous-new-dawn/tree/bc9cabf404240ad99b2aab8c26e9b0137cdd7702/evidence/integration-queue-ready-only-20261016), not in the current checkout. Source probes, fixtures, and findings remain tracked where applicable.

Tested source: `b8cfda914ea72fd5f831f8e50bc988ca26aa4f31`.
Delta base: `8df0acfd7513bf760a562305432ef5c939f0395a`.
The independent parent reviewer must assess this substantive delta before a pilot.

The exact allowlisted ready head can propose one explicit draft conversion only
for a proven mechanical base refresh or genuinely absent initial Full admission.
Existing failed, canceled, ambiguous, orphaned or unverified validation stops.
An existing genuine matching pass on the same head/base/synthetic commit is reused,
including reopened PRs. BLOCKED protected mergeability still stops.

Draft conversion uses fixed-repository `gh pr ready N --undo` only after the same
external exact-plan/pilot guard, fresh state recheck and durable intent used by the
other mutations. Each effect needs its own reviewed pilot. Reconciliation verifies
head/base/draft state and never repeats an uncertain submission. The single ready
transition records its admission state; missing Full admission waits up to five
minutes from first confirmed-ready observation, then stops without retoggling.
Base movement after that admission needs renewed review.

Earlier genuine same-head validation can be verified independently of the current
base/synthetic commit only to decide whether draft conversion is safe. Merge still
requires the original exact current-candidate verification and every required gate.
Tutorial browser behavior and required genuine validation are unchanged.

## Verification

All six source-bound receipts passed with exit 0 on the tested commit:

- `node --test tests/integration-queue.test.mjs tests/test-runner.test.mjs`: 52 tests
  (40 integration queue and 12 unchanged test-runner tests), zero failures/skips.
- Targeted ESLint and Oxfmt checks on the six maintained JavaScript files.
- `node scripts/orchestration/cli.mjs check` and `git diff --check`.
- Exported `planTestRun(..., 'all')`: 450 files, serial concurrency 1;
  `production-config-runtime-drift` on this Mac. No policy fallback was bypassed.

The new tests exercise initial missing admission, existing-pass reuse, failure and
ambiguity rejection, stale ready conversion with provenance/merge proof, exact
reconciliation, timeout/no duplicate transition, dry-run and exact-plan guards,
and fake transport sequencing draft → refresh → drain → ready → checks → merge
across checkpoint serialization. Reader tests distinguish genuine earlier
validation from current-candidate identity and reject incomplete log identities.

Full local suite, production build, browser and live queue mutations: **not run**,
per delegated scope. Hosted Full validation remains required on the ready candidate.
No workflow, credential, protection or deployment change is part of this delta.
The proposed ready-only workflow must be independently reviewed and hash-pinned.

## Artifacts

[Source manifest](https://github.com/JohnDeved/populous-new-dawn/blob/bc9cabf404240ad99b2aab8c26e9b0137cdd7702/evidence/integration-queue-ready-only-20261016/source-manifest.json) binds nine source files to the tested commit.
[Artifact index](https://github.com/JohnDeved/populous-new-dawn/blob/bc9cabf404240ad99b2aab8c26e9b0137cdd7702/evidence/integration-queue-ready-only-20261016/artifact-index.json) binds 18 exported receipts/logs; repository and
temporary paths are redacted and original/published hashes are retained. Original
receipts remain under ignored `work/orchestration/integration-queue-ready-only/`.

- Artifact index SHA-256: `1278e646a46bd9af16c399a3c8ce477b71bca3979c4a47876da9de961e369fd4`
- Source manifest SHA-256: `6d6ee3a00a41fd4ad2081bc17835bcfb5c7cbb78243023f325b3ca2b536364e0`
