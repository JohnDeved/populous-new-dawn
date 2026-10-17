# Pre-ready Full history repair

> Historical run artifacts referenced below are [retained at the pre-cleanup commit](https://github.com/JohnDeved/populous-new-dawn/tree/bc9cabf404240ad99b2aab8c26e9b0137cdd7702/evidence/integration-queue-preready-20261016), not in the current checkout. Source probes, fixtures, and findings remain tracked where applicable.

Tested source: `71407a68b65cd11b9d420675729add5652aa2cea`.
Review delta base: `14a8d83a99ebcc97dee5b4f7d884142c9fa558c9`.

The independent review identified that a manually/preexisting draft could propose
ready on a fresh checkpoint despite a real failed Full validation. One additional
policy call now applies the existing validation-history guard to Full before ready.
No new state or transport behavior is introduced. Truly absent initial admission
and positively identified cheap Full draft guards remain eligible. Tutorial draft
failures do not participate in this pre-ready guard; its genuine merge gate remains.

All six source-bound receipts passed with exit 0 on the tested source:

- Focused Node suite: **56 tests passed**, zero failures/skips (44 queue, 12 runner).
- Targeted ESLint and Oxfmt checks on all six maintained JavaScript files.
- Structural orchestration check and `git diff --check`.
- Resource preflight: 450 files, concurrency 1, `production-config-runtime-drift`.

Four added tests cover real Full failure, cancellation, ambiguous/orphaned history,
and acceptance of missing admission/verified cheap Full guards alongside ordinary
Tutorial draft-guard failures. Existing fake transport/restart coverage still passes.

No live queue action, full local suite, build, browser, workflow/protection change,
or credential operation ran. Independent repair review and hosted Full validation
remain pending. Original receipts are in ignored
`work/orchestration/integration-queue-preready/`.

[Source manifest](https://github.com/JohnDeved/populous-new-dawn/blob/bc9cabf404240ad99b2aab8c26e9b0137cdd7702/evidence/integration-queue-preready-20261016/source-manifest.json) binds nine source files.
[Artifact index](https://github.com/JohnDeved/populous-new-dawn/blob/bc9cabf404240ad99b2aab8c26e9b0137cdd7702/evidence/integration-queue-preready-20261016/artifact-index.json) binds 18 published receipts/logs and retains
original hashes; repository and temporary paths are redacted.

- Artifact index SHA-256: `a06c5b07f47aadcd1f7a1986f216f4114d8bea96c938629a152dd49221a15986`
- Source manifest SHA-256: `5167c900006dbb2c880eee137f79d2777b807b2caecadd14effdf5a59c5147cf`
