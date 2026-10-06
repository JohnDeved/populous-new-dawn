# PR 226 accepted-main adoption review

2026-10-06. **ACCEPT source adoption; combined-head gates remain pending.**
Reviewed clean head `d9aa20570e4a3d6c1dcc308a6bb9aaab97606798`, with exact parents
previously reviewed Bridge `55c684cd2c4cc80a7e06786e24f0d87f4a0a5cd5` and accepted
main `e931f8903d2f1a91b14fdc1fdb011b72f4cf4718`. No corrective change requested.

## Independent checks

- Read both the main-relative full diff and the adoption changes in world-turn.
  The main-relative diff contains exactly the four previously reviewed files:
  `app/world-turn.ts`, `tests/authored-bridges.test.mjs`,
  `scripts/check-native-authored-bridges.py` and
  `decomp/research/authored-bridge-origins.md`.
- Removed the exact three inserted Bridge initialization/comment lines from the
  new world-turn bytes in memory and compared the result with accepted main:
  byte-identical. This verifies preservation of main's adjacent Erosion processing
  and queue-drain changes, not merely a clean textual merge.
- Compared the full authored Bridge branch and the scheduled Bridge-processing
  block against 55c684c: both byte-identical. Creation remains after the effect
  loop, and its existing first visit still returns before any terrain/trail work.
  Accepted main's Erosion queue does not receive a Bridge initialization callback.
- The generic controller/constructor and spell-cast runtime are byte-identical
  across 55c684c, accepted main and d9aa205. Bridge test, native harness and topic
  note bytes are unchanged from 55c684c.
- Compared all 3,604 tracked file entries in both main and the adopted tree.
  Only the four declared files differ. All other tracked blob identities,
  including Erosion evidence and pins, exactly match accepted main.
- Recomputed the source/tree/app-tree, four file hashes and main-relative binary
  diff fingerprint in `adoption-correspondence.json`; all match. Clean Git status.
  Correspondence SHA-256:
  `d0454d54b8b6f584766d63daf842d3444b030e5636bd2f59fc2483509f069bb7`.
  Main-relative diff SHA-256:
  `29c5a4eced68ab579705504e3d3d25dbabe568d64c53f890c6ca0695257df3ed`.
- Recomputed the prepared browser driver SHA-256:
  `3e8ad3a90e505fc4ea439f959aaf8d9e845c1c12eec70b271f3c130f55562aa5`.
  It is the exact source accepted in `driver-native-review.md`; no additional
  observer, route adjustment, state mutation or exact-birth assertion was added.

## Acceptance boundary

The implementation, checkpoint compatibility and driver-source approvals extend
to this exact merge head. Historical receipts retain their actual source heads;
they are not relabeled as combined-head executions. The coordinator's finite
full/native/browser and applicable TypeScript-quality gates must be assessed on
the combined source before merge. No gate was executed for this read-only review.
Prior native/full-world RNG, mixed-class scheduling, absolute-clock, pixel/audio
and spell-cast limitations remain in force. No parity or performance expansion.

Reviewer activity: Git object/diff reads, source/hash correspondence checks and
this ignored review artifact only. No app edit, native replay, package, browser,
dependency, shared harness or historical evidence mutation.
