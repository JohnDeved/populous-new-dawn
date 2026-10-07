# PR254 final gates attempt01: stopped at required Oxlint failure

One authorized sequence on8f50dda2 used independent copy27/1209759/CPU5–7.
Scoped format and ESLint passed. Scoped Oxlint exited1 with34 warnings and six
import(no-cycle) errors. Required failure stopped the runner: all three Fallow
analyses, npm run check and npm run build were not run. Actual failed receipts
remain failed. No assertion/config/source change or automatic retry occurred.

The six errors point to existing imports at lines8/9/10/18/21/46 of
app/level-start-runtime.ts. Source correspondence confirms its entire import prefix
and every other app file are byte-identical to accepted main; only stoneBurst's
body changed. This is not a claimed baseline linter run. Two new test-only lines
also receive prefer-destructuring warnings and await reviewed disposition.

Tool session28073; host start04:35:30.431447UTC, command04:35:35.176858–04:35:38.832860,
terminal04:35:41.102222 on2026-10-07. Owned PID/session37 start9169822 is cleaned;
remaining owned processes are empty. New copy/source/tools/packet/copy-receipt
hashes are unchanged. Fallow never ran, so no marker was created; initial absence
is preserved. The old interrupted loan remains untouched and unknown.

[Actual stage results](results.json), raw receipts/logs, [source correspondence](source-correspondence.json),
[preflight review](preflight-review.json) and [copy hashes](manifest.json) preserve
the stop. Independent failure classification and any continuation/repair require
review and a separate grant.

Independent [failed-result review](failed-result-review.json) confirms the exact
required stop, inherited-cycle attribution and successful cleanup. This does not
relabel Oxlint passed or authorize a source/policy change or retry.
