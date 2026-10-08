# Small M1/M3 runtime proposal

Proposal only; no app edits. Base app tree`ba6df35a5a9fcd06b7c9004cd5a833d24f8d359c`.
The accepted source reference is`5fedc5f6ae08c6b8223d6b989717cfff334f649c`.
It establishes CPU controller/geometry feedback composition within its finite
inputs. It does not establish final screen materials, mission-palette colors,
clipping/painter submission, pixels or actual Save/Load behavior.

## Product outcome and existing owners

Ordinary M1 camp and M3 Temple gifts keep their existing body/glow and six-visit
hide. That hide starts the building assembling/turning/per-face acquisition
sequence and shared companion. Buildings opens synchronously and the still-locked
correct card supplies the destination. Existing visit82 knowledge payout remains
separate. No other Vault models or generic reward families enter this slice.

| Owner | Small extension |
| --- | --- |
|`vault-appearance.ts`, `world-effects.ts:createGift`, `world-types.ts:Gift`|Use the already bounded M1/M3 authored-source resolver at creation to retain acquisition provenance (head/reward/link/model/recipient/completion order). Never add eligibility to already-existing legacy gifts. Do not alter body/glow assets, socket placement or timers.|
|`world-turn.ts` phase-zero branch|Queue these tagged local building gifts once, beside ordinary spell requests. Keep hide and grant in this existing object owner. No UI arrival clamp for class2.|
|`worship-acquisition-runtime.ts`|Drain the single request queue with the existing authored ordering, dispatch by target family, use the existing shared cosmetic RNG, include building activity in limiter bit4 and retain previous draw commands. Route source-owned Building-panel events separately from spell arrivals.|
|`worship-acquisition.ts` plus a small `building-acquisition.ts`|Add the building singleton and G/F state/CPU-vertex commands from the accepted reference. Keep spell singleton independent, companion/pulse shared. Visit order remains pulse→companion→building→spell. A building replaces only building+companion; a spell replaces only spell+companion.|
|`page.tsx` existing HUD bridge|Add model-keyed camp/Temple button refs and a discriminated spell/building target. Use existing `flushSync` bridge to select Buildings without selecting a build mode, then measure the disabled card. No guessed CSS/native pixel target.|
|`scene-worship-acquisition.ts`|Extend the existing anchor cache to tagged building gifts and route cue/panel callbacks by family. Add a screen-triangle draw consumer to the existing overlay owner after its material/submission contract below is proved. Keep sprite/pulse support and resource cleanup.|
|`worship-acquisition-layout.ts`|Reuse frozen handoff reference space/current HUD mapping, but map projected face vertices and their target-flight contribution explicitly. Do not apply the spell body's point-only final-leg heuristic blindly to every triangle.|
|`game-store.ts`, `world-state.ts`|Default a missing building controller to null, retain new saved state without replay, and let normal new-world initialization clear it on Restart.|

`app/model.ts`/`scene.ts` remain facades; no composition refactor is required.
Use a distinct class2 provenance/target discriminator. Do not admit buildings by
pretending they have `Gift.ordinaryWorship`: that spell tag also owns arrival
timer clamping and suppression of the legacy payout effect in `world-turn.ts`.
Share only the proved renderer/companion/pulse mechanics while retaining which
family owns each request, draw binding and timer. Payout-effect changes, if later
proposed, need their own evidence and must not follow accidentally from tagging.
`game-clock.ts` already interleaves world work, current animation work and nominal
UI visits, including UI visits while user-paused. Keep that clock and renderer
cadence unchanged. This is not another global-animation-clock change.

## Logical visits, drawing and persistence

Run matrix/centroid/radial/projection work and geometry-produced admission flags
exactly once per logical UI visit, including its proved paused-draw path. Store
the resulting ordered CPU face commands. Actual RAF drawing only maps/interpolates
those commands; it must not pick another four faces, consume RNG, change flags or
decrement countdowns. Repeated draw calls must be state-free. Preserve the pending
transition before pause; the initial-pause139-visit Temple result shows why this
cannot be replaced by subtracting paused elapsed time.

Checkpoint state must include building active/phase/visits/pending, G fields,
every F record and completion latch, saved gift/provenance, immutable geometry,
shared companion particles/trails/RNG, pulse, request queue, logical UI clock and
previous/current draw commands needed for interpolation. DOM refs, canvases,
textures and anchor caches stay transient. Legacy checkpoints get an empty slot;
an old phase-zero gift must not acquire a new screen animation on Load.

Restore only display bindings; no initializer, cue, RNG, handoff or award replay.
Public Load currently selects Spells. Like the existing spell adapter, measurement
must work from the saved HUD-local target when the target tab is unmounted; only
the next source-owned panel-selection event should change the tab. A saved face
sequence must not be reset merely because React or its card has been remounted.
Restart disposes transient resources and clears saved controller state through
the normal new-world path. The eventual real active duration determines the
reachable public pause/Save/Load/resize witness points; no injected earlier state.

## Exact remaining render contract before visible implementation

The narrowed [submission contract](submission-contract.md) resolves important
parts below: per-face double-sided reversal, finite modes/tiles, affine RHW1 and
the separate absent Temple ANIBL owner. Its current scope choice is M1-only
delivery versus the explicit shared-phase prerequisite before adding M3.

The existing overlay is Canvas2D. Existing model geometry/UVs and `atlas` texture
can be reused, but `scene-assets.ts:nativeModel` has a **world** projection/depth
lighting shader and cannot establish screen rendering merely by being reused.
The narrow candidate is an ordered, screen-space triangle drawer in the existing
overlay, not a world renderer rewrite. Confirm the following bounded contracts
first; choose the small affine Canvas2D draw only if original screen UV/blend
submission supports it, otherwise use the existing renderer's material sampling
in a bounded screen pass without changing world projection or painter ownership.

1. **Lighting:** whole-model `00472fab..00472fce` selects original stored normal
   table shade plus signed G+17, clamped1..63. Per-face `00473881..004738f2`
   recomputes the first-three-corner normal (`0040cd00`), applies first-depth
   adjustments at±400 and clamps0..63. Bind those values through `0046c3f0` to
   actual diffuse/specular behavior. `model-lighting.ts:faceNormal` and
   `sunlightShades` are reusable primitives; world-distance fading is not the
   screen contract. Keep this separate from CPU eligibility feedback.
2. **Submission:** retain the proved023-then012 producer order and subsequent
   descending-bucket/LIFO painter order, whole-model winding rejection versus
   per-face winding/UV reversal,
   full-shell clip, depth bucket/bias and stable equal-depth order from
   from`00472fdf..004731f8` /`00473907..00473c8f` into `0046c3f0`. Face feedback occurs
   before culling and must never depend on whether a triangle reaches the drawer.
   Bind UV interpolation and transparency/material modes at the final queue,
   rather than inventing Canvas filtering or relying on a default Three material.
3. **Texture identity:** bind the actual polygon texture bank and per-tribe tile
   remap (descriptor flags table at`005aa218`) for the model95/103 tile subset.
   Existing geometry, topology and UVs already match; do not reimport all models.
   Verify that the current atlas supplies those pixels for each mission before
   assuming its shared bank-c import is correct for M3 screen geometry.
4. **Companion/pulse colors:** current `worship-acquisition.ts:sprite` resolves RGB
   through bank-c `original-hud.json`; the new composed reference compares palette
   selectors/positions, not M3 bank-p RGB. Four old companion-native matches do
   not close this gap. `original-vault-knowledge.json` pins PAL-p
   `f246c0c22c835208167ae4ad8a4c1f1303691c610a1ff8560edeaf1f7d095f74` and AL-p
   `d6bb76a8ba8c2613376132fa7b0eec58277254fee4b786129746ed0c96890357`, but exposes
   only the world-glow tint/frames. That single tint cannot supply every companion
   palette selector or trail. Already recovered bank-p raw files were not found
   in the scoped workspace inventory; recover only those DATA members from the
   existing approved archive if needed, with explicit extraction scope. Compare
   HFX1288..1299 and trails318..321 against existing crops. If pixels match, add
   only mission palette selection; if they differ, append only the proven frames.

These are specific source/data checks, not a demand to run the original game or
claim original GPU pixels. Final browser image comparison, source-reference
state/vertex equality, resize/HUD-scale behavior, pause/restoration, aggregate
check/build and scoped performance remain distinct acceptance gates.

## Ordinary scope

Use the reviewed fresh-profile plan SHA
`1e7064df5751a23eb9c41ebd0fbc8d39825a7090f1c9ef0b6c34f04c4e87ac2b`.
M3 can start from the public All missions selector and directly acquire the Temple
with the original Shaman. M1 retains the historical Bridge/guard approach, with
current actual Blast handler/target observations rather than a ground-only
assumption. Carry unchanged PR269 world-art evidence; new screenshots focus on
automatic locked Buildings destination and assembling/turning/per-face screen
phases. Keep independent6/82 lifecycle, enabled-card selection and possible
active persistence/display boundaries. Full construction/battle/victory are not
part of this screen-only product scope. Saved946 remains historical and untouched.
