# Fresh campaign continuity: accepted source checkpoint

The newer [accepted main adoption at 7fa2db1](adoption-7fa2db1/README.md)
includes the reviewed component carry, fresh 81-test/build receipts and returned
dependency record. Launch remains disabled. The db6e486 packet below is preserved
as its historical source-review predecessor.

The QA-only Mission 1 → 2 → 3 scenario at
[`db6e4867ba76d68a93d7b422053f3e04de15bfa1`](https://github.com/JohnDeved/populous-new-dawn/tree/db6e4867ba76d68a93d7b422053f3e04de15bfa1/qa/campaign-continuity)
has independent **source-only ACCEPT**. Launch is disabled. Standard check,
production build, final source/runtime binding and the entire fresh rendered
campaign remain pending. This packet establishes no new gameplay completion.

The source starts through the campaign selector, uses ordinary Continue controls
with current store/World/scene checks, and requires actual committed Save/Load.
It retains bounded objective progress, authenticated preserving stops and
cumulative time/failures through verified mission boundaries. The standard
owned-profile harness and all production files are unchanged.

## Evidence

- [Independent acceptance](review-db6e486/review.json), SHA256
  `2a7fc64a306422d7fda342cd11bfbd327660b04e289f95bc857ae25fc6e8969a`
- [81 focused tests](db6e486-focused.json) and [raw output](db6e486-focused.json.artifacts/stdout.log)
- [Independent 33 affected tests](review-db6e486/focused.json) and [raw output](review-db6e486/focused.stdout.log)
- [Structural validation](db6e486-structure.json) and [diff validation](db6e486-diff.json)
- [Exact source handoff](db6e486-handoff.json) and [file/hash inventory](manifest.json)
- [Initial rejection](review-c35f2bd/review.json) and [frozen-source reproductions](review-c35f2bd/reproduce.log)

The repair covers the actual Continue accessible name, named-effect progress
routing, and rejection of later terminal cleanup/runtime failures when resuming a
recorded mission boundary. Earlier helper failures remain retained as failures.
Published receipts are byte-identical; original local paths inside them map to the
relative public paths in the inventory.

## Tracking and limits

[PND-02 #2](https://github.com/JohnDeved/populous-new-dawn/issues/2) was closed for
its original September acceptance. Its closure is preserved. The broader
[campaign issue #8](https://github.com/JohnDeved/populous-new-dawn/issues/8) remains
open; this is a fresh current-source regression effort within that scope, without
new release gates or campaign acceptance credit.

The separately accepted [historical M3 saved-state victory](https://github.com/JohnDeved/populous-new-dawn/blob/c9b975eb9c7413a519dca4b637235baecd99274e/qa/mission-three-controls/victory-evidence-a02e7d02-20261005/README.md)
used application `b381851` and retained five failures/three stops. It satisfies
none of this fresh scenario's milestones. Historical QA branches and private
profile/IndexedDB bytes are not merged or included here.

PR215 candidate `ef62e48` remains a separately reviewed production proposal.
Any later adoption must use the actual accepted main commit and refresh exact
source/runtime correspondence before launch. Whole original parity, calibrated
animation timing (#214), native pixels and hardware/GPU performance remain
separate, unproved claims.
