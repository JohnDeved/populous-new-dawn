# M1 runtime owner map

Selected scope: [M1 camp screen acquisition](m1-product-scope.md), based on app
tree`ba6df35a5a9fcd06b7c9004cd5a833d24f8d359c` and accepted CPU reference
`5fedc5f6ae08c6b8223d6b989717cfff334f649c`. Only Mission1 class2/model7 is
eligible. Mission3 class2 handoff remains disabled. No app code changes here.

The accepted CPU and [submission contracts](submission-contract.md) suffice to
begin this bounded implementation. Original GPU pixel identity remains an
explicit limitation, not a prerequisite for another renderer research project.

## Exact owners to extend

| Owner | Bounded change |
| --- | --- |
|`world-effects.ts:createGift`, `world-types.ts:Gift`, source resolver|At creation only, verify Mission1's actual record1→record2 link, mode4/class2/model7 and local recipient; retain distinct building provenance/head/reward/slot/order. Appearance and camp-valued reward alone are insufficient. Never tag a legacy gift.|
|`world-turn.ts` phase-zero branch|Queue this tagged gift once at its existing six-visit hide. Preserve the independent visit82 grant and legacy payout effect. No building arrival clamp.|
|`worship-acquisition-runtime.ts`|Drain the existing ordered queue by source/target family; retain authored ordering and shared cosmetic RNG. Include building activity in limiter bit4 and prior commands. Route Building-panel events separately from spell arrivals.|
|`worship-acquisition.ts` and small `building-acquisition.ts`|Add building singleton and geometry103 G/F state/CPU commands. Keep spell independent, companion/pulse shared, with pulse→companion→building→spell ordering and replacement.|
|`page.tsx`|Add model7 button ref and discriminated spell/building HUD target. Existing flushSync bridge selects Buildings and measures the disabled Warrior card without selecting build mode.|
|`scene-worship-acquisition.ts`, `worship-acquisition-layout.ts`|Extend anchor cache to tagged M1 gifts; map reference/current geometry and draw building commands within the existing overlay owner. Map face/target-flight explicitly, not the spell body's point heuristic.|
|`game-store.ts`, `world-state.ts`|Default missing building state to null, restore without replay and clear through normal Restart/new-world creation.|

Do not set `Gift.ordinaryWorship` on class2: that tag owns the spell arrival clamp
and legacy payout-effect suppression. Existing `vaultKnowledgeSource/Appearance`
checks mission/kind/mode/reward/coordinates/artwork, not the authored link/slot.
Resolve the explicit M1 link once at gift creation and retain it. Keep the two
families independently testable. `model.ts`/`scene.ts` stay facades; no picker,
construction, global atlas or general reward refactor belongs to this change.

## Clock, pure drawing and saved state

Keep existing UI periods and `game-clock.ts`. Each logical UI visit computes
geometry and admission feedback once, including the proved paused path, then
stores ordered commands. RAF only maps/interpolates them. Repeated draws cannot
admit faces, decrement fields or consume RNG. Pending transitions precede pause.
Interpolation/cache identity includes acquisition family and gift/controller
identity plus face/particle index. Replacement must not blend from an older
acquisition's geometry. Existing clock/deadline source stays byte-identical.

Save active/phase/visits/pending, G/F records/completion latch, source/gift ID,
frozen geometry, shared particles/trails/pulse/RNG, queue, UI clock and previous/
current commands. DOM refs/canvases/textures remain transient. Restore display
bindings without initializer, cue, RNG, handoff or award replay. Public Load
selects Spells; use the saved HUD-local target while Buildings is unmounted, and
let source-owned selection events change the tab. Old phase-zero gifts never
acquire new eligibility. Reach active persistence boundaries naturally, never
through an injected earlier state.

## Rendering and limits

Reuse model103 topology/UVs, bank-c atlas and companion artwork:36 mode6 and71
mode7 faces, no mode32 or bank-p input. Implement affine UVs/RHW1, screen-specific
diffuse, mode-dependent cutout, full-shell clipping, descending-bucket/LIFO order,
whole-model winding rejection and per-face vertex/UV reversal. Do not copy world
distance fading/highlight. The small detached triangle surface/shared overlay
composition is bounded in `m1-product-scope.md`; no new clock or world renderer.

Compare CPU commands/material fields with the source contract. New ordinary M1
pixels verify display mapping and visible HUD/geometry behavior, not original
GPU identity. Keep standard check/build, quality and bounded screen workload gates.

## Deliberately deferred M3

No Temple handoff is enabled. The app lacks the shared ANIBL bank2[92] phase;
SceneryFire.frame, gameClock.animationFrame or an effect-local timer cannot
substitute. Independent bank-p data work found12 different sparkle RGB crops and
a different selector0 tint; four trails match. These are later scoped prerequisites,
not reasons to block M1 or recolor global effects. M3 CPU/data results remain useful
research without a shipped behavior claim.
