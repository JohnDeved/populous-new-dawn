# Accepted campaign source and policy after PR215

Independent review accepted frozen QA head
[`7fa2db1a4676cc16e47955ae2cc9608b58c71849`](https://github.com/JohnDeved/populous-new-dawn/tree/7fa2db1a4676cc16e47955ae2cc9608b58c71849/qa/campaign-continuity)
on accepted main `a53fa05587c4c1d363e3596162b41fcb9f26e3e8`.
The source, finite policy and prepared first Mission 1 batch are accepted.
**Launch remains disabled. The batch is unqueued, the fresh profile does not
exist, and no fresh campaign outcome is claimed.**

[Final independent ACCEPT](review-7fa2db1/review.json), SHA256
`3b971035ede34f9cf398882b128a92f645ff1d076c2395f4a9626d60e10d1b0f`,
verifies all 19 QA files and the source/policy/import guards. All 3,565 existing
tracked objects match the tested PR215 `ef62e48` tree. Its exact application tree
is `58797f069a89069d57a4ae801f645e476f99137e`.

## Accepted checks and explicit carry

- Fresh [81 campaign QA tests](adopt-a53-focused.json),
  [structural validation](adopt-a53-structure.json) and
  [diff validation](adopt-a53-diff.json) passed on this exact head.
- A fresh [combined production build](adopt-a53-build.json) passed in 18.938 seconds,
  under a bound of 120 seconds, with original execution session 34527 terminal exit 0.
  Tailwind scans added QA text, so the old build was not carried.
- Review explicitly accepted the unchanged application typecheck, 1,114 standard
  tests and parity check from the actual
  [ef62e48 standard receipt](https://github.com/JohnDeved/populous-new-dawn/blob/846b5fa23855ea1fe763be05516c9cd94f6e7239/references/verification/mission3-vault-hfx-2026-10-05/checks/ef62e48-check.json).
  Its SHA256 is `387525ff5739ae6e4445760a90dda7d181ffcc4fcc3bea42e86d4518a683627f`.

The combined `npm run check` command was **not** run. Acceptance is the named
carry plus fresh checks above. It does not imply clean repository-wide ESLint,
new parity credit or a rendered campaign pass. The raw correspondence proposal
and review's embedded proposal pointer retain their original pending wording;
the final review's `gateDecisions` and `aggregateStatus` are authoritative.

Raw streams are next to each command receipt. The [manifest](manifest.json)
maps their original local paths to byte-identical published files. See the
[verification inventory](review-7fa2db1/verification.json),
[source handoff](7fa2db1-handoff.json), [gate correspondence](7fa2db1-gate-correspondence.json)
and [prepared segment plan](7fa2db1-segment-plan.json).

## Resources and launch boundary

The exact dependency tree inode 925605 was
[returned normally to mission3-vault-hfx](dependency-transfers/campaign-to-vault-20261005T1308.json)
after the build. Original absence of node_modules in the QA worktree was restored.
The installed-lock SHA256 remained
`65e45d0a87d1ecd4fbf56508b9821eb3bfb3867c8477db4aaa1452eb2bed13d8`.
No browser/profile was launched and no dependency resource is reserved here.

The reviewed active caps remain M1 900s, M2 1500s, M3 2400s, campaign 4800s;
objective progress 120s; owned wall caps 30/90/90 minutes, total 210 minutes and
95 minutes per execution segment. The
[first batch](https://github.com/JohnDeved/populous-new-dawn/blob/7fa2db1a4676cc16e47955ae2cc9608b58c71849/qa/campaign-continuity/mission-one-first-batch.json)
uses the actual ready Shaman and observed Bridge shrine, awaits shrine use and
four delivered shots, then pauses and records the observation.

A reviewed launch-enable change, exact final source/runtime binding and explicit
rendered-lane release remain necessary. The separate #214 timing-gate review
does not authorize this scenario to run. No animation rate is selected here.

[Campaign #8](https://github.com/JohnDeved/populous-new-dawn/issues/8) remains open;
[PND-02 #2](https://github.com/JohnDeved/populous-new-dawn/issues/2) retains its
original closed acceptance. The prior saved-state M3 victory on `b381851` remains
historical evidence with five failures/three stops and supplies no fresh milestone.
Whole native parity, calibrated timing, native pixels and hardware performance
remain separate. Private profile and IndexedDB bytes are never included.
