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

## Independent scalar-buffer alternative: candidate for review

Production `syncLandscapeObjects` now captures four scalar values per eligible
tree in an ordinary, query-local JavaScript array and maps each ID to its latest
offset. ID evaluation still precedes object/resource evaluation; nativePosition,
worldEnvironment and nativeModelResource remain in their original order and count.
The existing removal pass compares scalars. Only the existing addition pass
constructs a replacement pose immediately before refresh/set.

Unlike retained-reference reuse, this does not alias publicly mutable old records.
Unlike a typed numeric buffer, the ordinary array preserves undefined, NaN,
infinities and negative zero. Duplicate IDs retain first-insertion iteration order
with last-write values. Scratch buffers are per-call, including reentrant calls.
There is no cross-turn cache, lookup omission, geometry substitution or active
staffing/runtime change.

Focused tests include the original rejection witnesses plus actual terrain dirty
recipients, removal/addition map ordering, bank/depletion/move/duplicate cases,
read/exception ordering and an exact-function boundary-injection test of optional
and non-finite shape indices. Those injected scalar cases test storage semantics,
not native asset validity. Existing world and pose records remain mutable.

Cost remains unmeasured: this replaces per-tree temporary pose records with a
flat scalar array and numeric Map values, but adds scalar indexing/array growth.
Fewer temporary pose records is not a measured runtime or GC improvement.
`npm run check`, `npm run build`, native/browser coverage and controlled paired
performance checks remain not-run pending the parent-coordinated resource lane.
New test/support paths in orchestration planning need explicit reviewer inspection.
