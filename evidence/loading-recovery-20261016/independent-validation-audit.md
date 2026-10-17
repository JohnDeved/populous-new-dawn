# Independent loading/recovery validation audit

> Historical run artifacts referenced below are [retained at the pre-cleanup commit](https://github.com/JohnDeved/populous-new-dawn/tree/bc9cabf404240ad99b2aab8c26e9b0137cdd7702/evidence/loading-recovery-20261016), not in the current checkout. Source probes, fixtures, and findings remain tracked where applicable.

Repair candidate: `adb0f10a1142cb9135192da63af756b43dbc035e`.
Full inventory execution source: `42e9e2bc6b3300685fb3133aebe0e932bb5a9b7a`.
Canonical base: `4687490198313ccf0f55d85c1cbcbd680d720cea`.

## Result

Evidence integrity checks pass, with the qualifications below. No tests, builds,
browsers, original executables, installs or repository edits were performed by this auditor.
Native/code/visual assertions and merge acceptance remain the reviewer/parent's responsibility.

- Exact canonical inventory: 433 tracked top-level test files, 44 selected batches,
  2,789 passed; zero failed, cancelled, skipped or todo. Totals use the LAST
  unindented top-level summary in every raw output, not intermediate nested totals.
- Original batch 24 remains unknown/prepared after executor transport loss. Its
  receipt and partial stdout/stderr hashes are unchanged. Explicit separately
  recorded recovery passed its exact ten files. No original result was overwritten.
- Repaired head: four focused tests passed, changed-file formatting passed, and
  fresh typecheck, parity and orchestration checks passed. Full inventory remains
  old-head execution; the sole +2/−1 `app/page.tsx` scalar extraction is covered by
  the reviewer's exact-delta/18-case equivalence and a new browser episode.
- All 57 original-head and 11 repaired-head command receipts retain their true
  statuses. Original: 49 passed, seven failed, one retained unknown. Repaired:
  seven passed, four failed. Completed receipt/source/input identities and raw
  stdout/stderr hashes pass; no unexplained drift or active pending receipt remains.

## Quality attribution

Baseline `774af5cd` is independently source/config-equivalent to canonical `46874901`.

- Global formatting still fails only on unchanged `app/viewport-bounds.ts`.
- ESLint: 392 errors unchanged; eight to nine warnings. Two intentional intrinsic
  image warnings in the new loading component replace one former page warning.
- Oxlint: both introduced nested-ternary warnings were repaired. Final 1,434
  diagnostics exactly match baseline file/severity/rule/message/duplicate counts:
  673 errors and 761 warnings. Location-only shifts are excluded from identity.
- Fallow health/dupes commands exit zero; unused exits one. Clone groups remain
  807; 19,156 duplicated lines across 382 files. Dead-code summary counts remain
  99 files, one export, three dependencies, 294 unresolved imports, one unlisted
  dependency and 20 cycles. Health LOC rises 250,419→250,611, threshold findings
  2,702→2,704, churn hotspots 0→1. These changes are preserved. Human output is
  truncated, so undisplayed diagnostics are not claimed identical.

## Browser/build boundaries

- Original packet: 55 files plus manifest independently rehashed; all screenshot
  dimensions agree with viewport/DPR labels; exact baseline 1,105 and candidate
  1,108 source-file inventories verified. Its failed cumulative-activation attempt
  remains failed. The baseline's three dirty helper scripts are accurately recorded.
- Separate repair supplement: 17 files plus manifest, 1,108 production hashes,
  four reported browser groups and 18 equivalence case labels verified. It ends in
  a second intentional failure and makes no new ready-activation claim.
- All three broad wrapper failures remain failed. Unreached restart, Continue,
  checkpoint and stale-atlas branches remain not-run. Narrow passes do not erase
  broader failures or establish their causes.
- Exact repaired-head canonical Workers check is recorded as SUCCESS. There is
  no local build receipt or deployed UI/TLS proof. Plain React/Vite fixture,
  headless/software-rendering and native full-frame limitations remain explicit.

See `qualified-final-aggregate-adb0f10a.json` and the final audit manifest for exact
receipt paths, commands, hashes, failures, source relationships and raw totals.
Clean pre-repair and pre-evidence snapshots establish the audited sources before
later changes. Later documentation/evidence commits still require source-equivalence
and exact-head remote-check verification.
