# Held-drag source admission for owned body submission

Reviewed composition: `9447ed725692bdefb43e0244648db83c5b4353d2`, combining
body runtime `0d9ae8b299b613fc729e3c7d05c5e9a06fd4c36f` and main
`670b0d716bf563f3f9e3151ed5b7a3315dcb2398`.

The exact owned-numeric route matched 15 of its 16 source slices. The remaining
`frame-order` slice (`GameScene.animate` through the next method boundary) changed
from SHA256 `a108152922381c53f20693f2ac62c1ecdc601f3f05e1bad0f383519df8328aa3`
to `59a5a9dd0364ec6e6c21bd966f90687cec7ea1f7dc9dc85c429081c8b2c64770`.
The full scene diff against reviewed main adds `this.unitMeshes` to both
`Painter.render` calls in the `modalSuspended` early-return branch and reformats
the diagnostic wrapper. No other part of the frame-order slice changed.

This is a legitimate additional owner route, not a reason to ignore scene drift:

- The modal branch retains the same guard, diagnostic wrapper, scheduling,
  recorder publication and return. It still performs no pointer query.
- The ordinary held-drag callback retains terrain/decorations, camera/view, unit
  updates, tooltip work, pointer queries, rendering and recorder order unchanged.
- Body submission passes the owned unit map into a render-only lease. Its
  suppression restores material visibility on normal, nested and exceptional
  completion; it does not alter logical visibility, Painter command/depth slots,
  hierarchy, or pick geometry. The existing body regression suite covers these
  ownership/cleanup/fallback boundaries; those boundaries are not inferred from
  source-hash admission or from an unrelated browser pixel comparison.
- The other 15 exact owned-route slices are unchanged, including constructor,
  helper lifetime, native/ordinary query dispatch, and numeric lease gates.

The repair adds `owned-numeric-terrain-body-v1` as a third complete atomic profile.
Both historical profiles and their hashes remain unchanged, so baseline source
admission is preserved. Exactly one full profile must match. No normalizing,
ignoring, narrowing of boundaries, per-slice alternatives, or guard bypass is
introduced. Read caching and failure treatment remain unchanged.

Regression coverage admits the actual body route and reconstructs the exact
prior modal calls to admit the historical owned route. Changed map ownership,
a partially updated modal branch, inverted modal guard, altered query timing,
and an inserted early pointer query remain unsupported. Existing mutation
coverage still checks every slice, and owned-helper lifecycle negatives now
explicitly apply to both owned profiles.

Adding the profile changes the snapshot protocol hash, as intended. Prior timing
receipts remain evidence only for their original source/protocol pair; this
repair does not relabel them, prove performance, or substitute for browser tests.
