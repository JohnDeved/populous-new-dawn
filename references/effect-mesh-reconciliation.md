# Primary effect mesh membership

Refs #144. This slice replaces the primary effect cleanup membership scan in
`updateEffectsFrame`. The browser Scene's ordinary animation calls its maintained
wrapper, which reconciles `fxMeshes` against the current `world.effects` before
creation, ground attachment, placement, projectile interpolation and animation.

A Scene-owned weak Set is cleared and rebuilt from every current effect ID on each
call. Cleanup preserves strict equality's NaN behavior: a NaN map key is removed
even when the current effects contain NaN. Zero, infinity and duplicate IDs retain
the previous semantics. The Set is disposable renderer state; it does not mutate
the World or cache authoritative simulation state.

Removal remains `removeFromParent` → `releaseGroup` → `fxMeshes.delete`, in map
iteration order. The full earlier source and later creation/draw body are unchanged.
Existing survivors retain their original factory group and sequence even after an
in-place kind change. Effect lifetime, allocation/capacity, type invalidation,
simulation clocks and native ownership are unchanged.

## Focused caller evidence

Tested source: `7a063046df26213ff343ba6e7efe12ed197d39b7`, based on actual merged
main `084c7ba4dfb116c4d1304bf54d3a7c9802bc14ba`. Rebase preserved the reviewed
three source/helper/test files and complete binary patch. The Node fixture calls
the actual Scene frame wrapper, `makeFx`, `animateFx`, `locate`, `y`, real
`ProjectileMotion` and `releaseGroup`; only texture IO/projection are supplied.

The unchanged six-case file passed all cases on the candidate. Against pristine
main production it passed the same five lifecycle cases and failed the full-caller
scaling assertion at 2,144 ID reads for 64 effects, against a 192-read bound. The
baseline adds only the same untracked test/helper; all tracked production is intact.

Caller cases cover ordered owned Sprite material/private-map disposal and shared
atlas retention; survivors, spawning, pose reset and HFX UV/visibility/opacity;
in-place sequence reuse; same-array edits, replacement, current/legacy checkpoint
migration, empty/restored worlds and independent Scenes; accepted migrated NaN,
signed zero, infinity and duplicate IDs. Lifecycle cases compare the full World,
including both RNG owners, before and after rendering. The attached-shot snapshots
are a labeled diagnostic of maintained projectile interpolation/explicit placement,
not an ordinary cast/impact or browser acceptance claim.

Quiet populations are made through the maintained `effect(world, 'hit', point)`
producer. With 64/256/1024 effects, the actual full caller reads 128/512/2048 IDs,
including when the mesh map also contains equally many stale groups. The frozen
previous cleanup expression reads 2080/32896/524800 for surviving groups and
6176/98432/1573376 with stale groups. Those frozen expressions are diagnostic
references; the separate unchanged-base invocation establishes the regression.
This scope excludes Shaman/reincarnation searches, fire-heading updates and
secondary-effect costs; it measures ID reads, not complete frame time or hardware.

## Quality and retained records

Scoped Oxfmt passed. ESLint failed on both candidate and pristine base with the
same existing `@typescript-eslint/no-unused-vars` error at `scene-effects.ts:94:16`
for `_` in the Tornado factory. Strict Oxlint failed on both with the same nine
warnings. Neither failed lint check is described as passed. The separate comparison
passed: complete ESLint stdout matches after normalizing only the exact known
candidate/base filename heading; all severity/message/rule/location/summary text
is retained. Oxlint's complete diagnostic multiset matches after normalizing only
numeric line/column prefixes. No rule, config, source or assertion was relaxed.

Original source/input-bound receipts are retained under ignored
`work/orchestration/issue144-effects-*`; the final comparison is
`issue144-effects-comparison-7a06304-02.json`. Its actual helper source SHA-256 is
`9fd2ea9f8c66d048c93e5e8eed1dee8454a32b8f66726834b7216ac2d286db85`.
It verifies raw artifacts, 34 paired inputs, pristine base production and full-file
restoration outside the explicit membership change. The earlier comparison and
failed receipt-launch setup attempt are preserved separately; that failed launch
occurred before any test ran and caused no source changes.

Standard exact-published-head check/build remain pending coordinator execution.
Browser QA and representative hardware measurements remain not-run with supported
browser access blocked. This supplies no native allocator/pool, native raster,
FPS, deployed behavior or whole-issue completion claim; #144 remains open.
