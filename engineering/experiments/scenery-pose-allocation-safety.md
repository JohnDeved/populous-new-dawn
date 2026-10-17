# Scenery pose allocation safety experiment

Baseline: `6cfb658d5cfaf42db86b70bbf82ef8af57735a5c`.
Frozen `world-terrain-runtime.ts` SHA-256:
`62e13be40575ac7239e5611837bbab4ee15fe654626dc612cd43e97c0244bc2e`.

## Retained-reference proposal: rejected

The test-only candidate preserves nativePosition, worldEnvironment, resource
lookup and scalar evaluation order, but places an unchanged retained pose in the
query-local temporary Map instead of an independent pose record.

Ordinary unchanged, moved/depleted, duplicate-ID, terrain, bank-change, removal /
addition ordering and dirty-recipient tests agree with baseline. That is not enough:

- A later tree coordinate getter can mutate an earlier publicly retained pose.
  Baseline independently captured anchorX=0 and repairs/replaces the now-mutated
  retained entry; the candidate aliases it, suppresses that repair and leaves512.
- A later coordinate getter can reenter sync after moving an earlier tree.
  Both outer calls finish with the same scalar pose, but the candidate resurrects
  the old captured object. Baseline installs its independent fresh snapshot.

These are extra adversarial identity/reentrancy witnesses, not claims that an
ordinary shipped caller currently installs such getters. The world/retained Map
is publicly mutable; checkpoint migration already edits retained shapeIndex.
No contract narrowing, freezing retained records or callback omission is justified.

The test fixture named `scenery-retained-pose-candidate.ts` is a rejected experiment,
not imported by production. The test asserts its divergence intentionally.

No speedup claim follows from inclusive/self profile shares. No benchmark, full
check/build, native oracle or browser test was run for this rejected proposal.
