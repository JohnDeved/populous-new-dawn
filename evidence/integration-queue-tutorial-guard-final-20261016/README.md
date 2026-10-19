# Tutorial pre-ready admission qualification

> Historical run artifacts referenced below are [retained at the pre-cleanup commit](https://github.com/JohnDeved/populous-new-dawn/tree/bc9cabf404240ad99b2aab8c26e9b0137cdd7702/evidence/integration-queue-tutorial-guard-final-20261016), not in the current checkout. Source probes, fixtures, and findings remain tracked where applicable.

Tested source: `696ca675fa558ade7f071d3dcb097b184c40c1c5`.
Review delta base: `0b57d833aa89da4f4ffd9fceccafbf7cfc50621f`.

Pre-ready inspection now includes Tutorial whenever changed paths or the explicit
allowlist require it. Genuine failed, canceled, ambiguous or unverified Tutorial
validation stops. Only positively proven guard-only history is excluded from this
admission decision, along with its exact matching failed current check.

The reader establishes that proof from the existing pinned workflow, Actions
run/job/check identity, logged `IS_DRAFT: true`, failed readiness stage and skipped
mandatory validation stages. Missing proof, changed workflow or an executed
validation stage does not qualify. Filtering the cheap guard leaves an earlier
real failure visible. Full admission behavior and the genuine Tutorial merge gate
are unchanged; this exception cannot satisfy a merge gate. The quiet-window
fingerprint includes the new guard proof so changed evidence restarts observation.

All six source-bound receipts passed with exit 0 on the tested source:

- Focused Node suite: **61 tests passed**, zero failures/skips (49 queue, 12 runner).
- Targeted ESLint and Oxfmt on six maintained JavaScript files.
- Structural orchestration check and `git diff --check`.
- Resource preflight: 450 files, concurrency 1, `production-config-runtime-drift`.

Five added tests cover real Tutorial failure/cancellation for path-required and
explicitly required candidates, ambiguous/unproven guard history, non-required
Tutorial scope, genuine merge rejection of guard failures, an earlier real failure
followed by a cheap guard, and the stable-window reset. Existing reader coverage
now verifies guard-only proof and rejects false draft flags, changed workflows and
executed validation stages. The normal initial draft remains eligible with absent
admission or verified cheap guard history.

No live queue action, full local suite, build, browser, workflow/protection change,
or credential operation ran. Independent repair review and hosted Full validation
remain pending. Original receipts are in ignored
`work/orchestration/integration-queue-tutorial-guard-final/`.

[Source manifest](https://github.com/JohnDeved/populous-new-dawn/blob/bc9cabf404240ad99b2aab8c26e9b0137cdd7702/evidence/integration-queue-tutorial-guard-final-20261016/source-manifest.json) binds nine source files.
[Artifact index](https://github.com/JohnDeved/populous-new-dawn/blob/bc9cabf404240ad99b2aab8c26e9b0137cdd7702/evidence/integration-queue-tutorial-guard-final-20261016/artifact-index.json) binds 18 published receipts/logs and retains
original hashes; repository and temporary paths are redacted.

- Artifact index SHA-256: `a33c0fc3c821958bf3968dc07966a93b8a843bb7415adb038544e5e7b636e472`
- Source manifest SHA-256: `f2a335335cbb46af05a8fa98244a40524eb6c2d38323856d832055a030340cbc`
