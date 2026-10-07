# Automatic parity evidence

`npm run parity:measure` generates a local report at
`work/orchestration/parity-measure/index.html`, alongside `report.json` and
`history.json`. It reads evidence; it never launches browser/native checks, changes
reference expectations, records fixtures, or edits the historical parity ledger.
Exit 0 means all selected gates passed, 1 means a failed check or reporting error,
and 2 means incomplete evidence. Incomplete is expected for the initial inventory.

The normal `orchestration:receipt` command and `orchestration:verify` workflow
capture measurement metadata for exact registered bound commands and regenerate
these reports after a completed run, including failures. A source change is reflected
on the next workflow run or `parity:measure`; there is no background watcher.
Interrupted receipts retain unknown/blocked evidence. Old receipts without this
metadata remain unmeasured; their old `passed` text is never promoted automatically.
Existing automation eligibility, native holds and shared-resource leases still apply.

## Definitions, not editable scores

`engineering/parity-capabilities.json` binds bounded observable capabilities to
existing `engineering/checks.json` IDs. There are no completion/status fields.
Initial cases cover Mission 1's injected-outcome result continuation, Mission 2's
checkpoint diagnostic and Mission 3's opening diagnostic. The source scripts,
not optimistic registry prose, determine their limitations. Mission 1's check
removes enemy units before ticking; Mission 2 uses internal commands and ticks;
Mission 3 seeds the preceding victory. None is a natural original-game comparison.

A `scenario` binding is a separate drill-down and cannot complete its broad
`parityId` parent. A future `requirement` binding must use the exact existing leaf
requirement ID and specify the complete acceptance scope. Test/reference authoring
and scope review remain engineering work; results and percentages are generated.
Full native-game comparison still needs a real original oracle. Native component
checks only prove their explicitly documented supplied/intercepted scope.

All leaf requirements in `parity.json` remain in the known-scope denominator,
ignoring manually recorded completion flags. Unbound requirements are unknown.
The initial result is zero *automatically evidenced* requirements, not zero game
implementation. Browser-only mission case coverage is separate from paired evidence
and known-scope coverage. Overlapping mission cases are never added to the whole-game
score. Historical checkpoint-share percentages retain their date/formula and are
not mixed with these new unweighted requirement counts. No full-frame visual or
full original-game execution percentage is claimed.

## Evidence and invalidation

Exact command matching prevents aggregate test success from implying constituent
passes. Measurements include the registry definition hash, declared inputs, broad
application, script and original-asset inputs, package/lock files, capability definitions,
and Node/OS/architecture identity. The conservative broad input set catches current
transitive gameplay changes; unrelated documentation does not invalidate checks.
Input/definition/runtime changes produce stale evidence. A changed check during
execution is invalidated. Failed, blocked, not-run and unknown remain distinct.
The latest attempt wins; equal timestamps prefer failure. Later fresh passes can
recover a failure; original failed receipts are retained.

Browser engine/renderer/device provenance is not fully captured by this v1 metadata.
Treat browser results as the declared diagnostic run, not cross-hardware visual or
performance proof. Remote `POPULOUS_URL` servers must represent the same tested
source; v1 cannot independently authenticate a remote server's build. Native checks
with environment-substituted commands are not automatically bound by this v1 exact
command adapter. They stay unknown rather than manufacturing an original result.

Discovery scans repository-local JSON under ignored `work/orchestration`, skipping
symlinks, raw-log directories and generated reports. Oversized/invalid JSON makes
measurement incomplete rather than hiding a possibly newer failed receipt. Old
arbitrary logs and summaries are not accepted as results. Receipts are trusted local
engineering evidence, not cryptographically signed attestations.

JSON/HTML output is deterministic for unchanged input/evidence. History appends only
when report content changes, marks scope revisions, and preserves past measurements.
Scope changes may reduce coverage; scores across revisions are not direct gains.
The generated report escapes source text and requires no network/CDN/database.
Reports and raw receipts remain ignored local artifacts, not a new project board.

## Tests

`node --test tests/parity-measure.test.mjs` uses temporary fixture repositories and
real local command receipts to test missing evidence, failure precedence, staleness,
source drift, duplicate receipts, unknown scope, deterministic history and escaping.
These tests establish the measurement mechanism, not gameplay parity.
