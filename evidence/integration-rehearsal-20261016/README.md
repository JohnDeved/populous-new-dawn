# Local integration rehearsal — 2026-10-16

**66/66 focused tests and typecheck passed. This is rehearsal evidence, not final current-main merge acceptance.** No source conflicts or product fixes were needed.

Sampled main base: `7e4806f25a7d202e67491186f1e62c648e379dab`. Frozen inputs, combined in this order:

| PR | Exact head |
| --- | --- |
| [#496](https://github.com/JohnDeved/populous-new-dawn/pull/496) | `efef96b45bc62907a3eaa3d62c14001e6cff1afa` |
| [#497](https://github.com/JohnDeved/populous-new-dawn/pull/497) | `a0bcf7dfa3dbf2491cfb9fb3c01d138cca005cd9` |
| [#500](https://github.com/JohnDeved/populous-new-dawn/pull/500) | `9b959fa09fd86ac4cc2d72bbb95b92caefe09c93` |
| [#495](https://github.com/JohnDeved/populous-new-dawn/pull/495) | `ae52fe209d9624aa4b2717953dcb24cc96bad1f1` |

Local combined commit: `73dc033746f1311785229296f00918ddad834b76`. Combined tree: `49b0d197073988444a57e42d4d4aa283b54a088d`. The rehearsal branch remains local; this publication contains evidence only.

The FPS merge automatically changed resource metadata. The rehearsal retained the entire sampled-main `engineering/test-resources.json` unchanged (blob `95a2f8d572a764c2358408f746d6fbe5e3fc36b4`). No Mac final-CI fingerprint or classification policy was generated or changed.

[Focused receipt](focused.json) covers 11 result, notice, checkpoint, campaign-profile, pause-ownership/save and FPS files together: 66 passes, zero failures/skips. [Typecheck receipt](typecheck.json) passed. Both receipts bind the clean combined commit before and after; commands and raw stdout/stderr are included. Dependencies were reused locally without installation or edits.

[Exact identity report](rehearsal.json), [original/published hash mapping](manifest.json), and [combined patch](combined.patch) make the local result reviewable. Only private checkout paths were redacted in receipts. To reconstruct the tested source in a disposable checkout of the base, apply combined.patch with `git apply --index`; `git write-tree` must equal the tree above. SHA256SUMS covers the portable files.

No browser, build or full suite was run. No PR branch was modified. Sequential hosted gates must validate each exact proposed merge; this result does not authorize bypassing them. Existing archived FPS evidence has patch-context trailing whitespace; the application/test diff check passes. Weekly Codex usage was 7%.
