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
performance proof. Browser source credit requires the verifier to launch and own the
server with a matching immutable startup fingerprint. Externally supplied
`POPULOUS_URL` and raw command-wrapper browser outcomes remain diagnostic-only and
unknown for source credit; local file hashes cannot authenticate those servers. Native checks
with environment-substituted commands are not automatically bound by this v1 exact
command adapter. They stay unknown rather than manufacturing an original result.

Discovery scans repository-local JSON under ignored `work/orchestration`, skipping
symlinks, raw-log directories and generated reports. Oversized/invalid JSON makes
measurement incomplete rather than hiding a possibly newer failed receipt. Refresh
errors replace the current report with an unavailable notice while preserving history. Old
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

## Ordinary Mission 2 checkpoint observation

The additional evidence-only row reads the existing `early-missions.mjs` owned
harness outer receipt, its `receipt.json` and matching `journey.json`. It is a
second evidence method for the existing checkpoint capability, so it adds no
requirement, browser-case or paired-parity percentage credit. Seeded diagnostic
rows and the dated historical ledger remain unchanged.

The adapter checks raw stream hashes, exact ordinary scenario and reviewed checker
bytes, matching clean source before/after, commit/tree identity, owned sandboxed
browser launch, matching result/sidecar, and the actual saved/loaded turn, roster,
stats and resumed simulation observations. Missing, malformed, interrupted or
substituted evidence is unknown. A historical pass remains visible with its tested
commit/date and becomes stale when the current full source tree differs or is
dirty. This deliberately does not infer source correspondence after a merge.

The retained PR257 observation is on `e76687a`, at 2026-10-07T20:29:54.135Z:
saved and loaded turn 217, subsequently resumed turn 251. It is stale against the
newer product tree. It proves that browser checkpoint witness only; it does not
prove original save serialization, native execution, complete state equality,
mission victory, graphical parity or hardware performance. Raw receipts stay local.

Newer failed/incomplete recognized attempts take precedence over older passes. The
adapter never runs the harness and introduces no new browser/native permission.
`tests/parity-owned-checkpoint.test.mjs` exercises substitution/drift/failure
boundaries and verifies that this observation cannot inflate the denominator.

## Ordinary Blast observations

Two additional evidence-only rows read the existing owned person and controls
harness receipts and their `episode.json` / `controls.json` sidecars. They add no
requirements, browser cases, or paired-parity credit. Discovery requires the actual
selected Blast scenario; an unrelated scenario hashing that file as a helper is
excluded. Person runs explicitly marked `POPULOUS_BLAST_EXPECTATION=baseline` are
excluded from candidate selection. Newer recognized failed, malformed, interrupted,
or unsupported-checker attempts suppress older passes.

The adapter shares the Mission 2 raw outer/inner source, stream and terminal-result
checks. It additionally binds the selected scenario, runtime, fresh owned profile,
sidecar source/run/result and bounded observations. The reviewed QA checker bytes
are pinned to `c40026937f39dadf86143ef13f73dba22d2e4a9c` for person observations and
`2e51cf0a024369221c534d0a72c1fcef7e0065ff` for controls. These QA scripts are not on
product main: their Git objects are read and compared, never executed or imported.
Unavailable or changed checker objects produce unknown evidence. Recognizing those
historical checkers does not establish source equivalence: only an identical full
clean tested tree can be current, including tooling changes.

The retained person observation finished at `2026-10-08T08:46:36.687Z`: real release
340, public movement 343 during windup, arrival 349 and impact 350, for a friendly
Blue Brave. The controls observation finished at `2026-10-08T09:03:54.841Z`: six
stages passed, active shot 1266 saved and loaded at turn 397, resumed at 421. Both
are historical/stale on current main. Save/Load equality is the bounded recorded
projection; the recorded full digest is not an independent full-World recomputation.
No original-game execution, native paired parity, enemy-target coverage, matched
full-frame comparison or hardware performance is inferred. Published scope reports:
[person](https://github.com/JohnDeved/populous-new-dawn/blob/2a33f94cd0661947bb1348b1e1efd48400c8ae91/qa/blast-ordinary/evidence/stage1/README.md),
[controls](https://github.com/JohnDeved/populous-new-dawn/blob/b126625489a4e2a402afe2c6a699607b421b7af2/qa/blast-ordinary/evidence/controls02-result.md).

`tests/parity-owned-blast.test.mjs` covers these binding and accounting boundaries
using synthetic receipts. Projection reads local evidence only; it does not launch
browser/native work, copy dependencies, manipulate profiles, or change parity flags.
