# Proposed product slice: M1 camp screen acquisition

Decision requested: implement **only Mission1's authored Warrior Training Hut
screen acquisition**, after review of this proposal. No app code is changed here.
Base app tree`ba6df35a5a9fcd06b7c9004cd5a833d24f8d359c`; accepted CPU reference
`5fedc5f6ae08c6b8223d6b989717cfff334f649c`.

## Bounded change

- Admit only Mission1 mode4 source record1→reward2, class2/model7. Preserve the
  existing world body/glow, six-subsequent-visit hide and independent visit82
  knowledge grant. Use a distinct building acquisition tag; never set
  `ordinaryWorship` on a building gift or inherit its timer/payout-effect gates.
- At that hide, use the existing handoff queue/source ordering and rendered body
  anchor to start geometry103 (107faces), synchronously open Buildings and measure
  the disabled Warrior Training Hut card. Preserve the current selected spell or
  build mode; panel selection is not a build command.
- Add a building singleton beside the existing spell state. Reuse the shared
  companion, pulse and cosmetic RNG with pulse→companion→building→spell visits.
  Building replaces building+companion only; spell replaces spell+companion only.
  The accepted reference supplies state/CPU-vertex comparisons and interruption
  boundaries, not original wall-clock constants or complete pixels.
- Run all face transformations and renderer-produced eligibility feedback once
  per existing logical UI visit, including the proved paused path. Produce saved
  draw commands. Uncapped RAF drawing only maps/interpolates them and consumes no
  RNG or state. Do not change `game-clock.ts` periods or global animation ownership.

## Limited files and rendering

Extend `world-types.ts`, `world-effects.ts:createGift`, `world-turn.ts`'s phase-zero
branch, `worship-acquisition-runtime.ts` and `worship-acquisition.ts`; put the
building-only state/matrix/face logic in a small `building-acquisition.ts`.
Use existing `vault-appearance.ts` source recognition with an explicit Mission1
gate. Keep existing spell request/arrival behavior independently tested.

Extend `page.tsx`'s current synchronous HUD bridge with a building target and a
model7 button ref. Extend `scene-worship-acquisition.ts` anchor/draw ownership and
its existing layout mapping; no world picker, constructor or construction change.
Save the complete building state/reference geometry/previous-current commands.
`game-store.ts` defaults only a missing slot to null, without tagging or replaying
old gifts. Restart uses normal new-world state and disposes transient draw resources.

Rendering uses verified model103 corners/UVs and the existing bank-c texture and
companion assets. No model or atlas reimport. The
[screen submission contract](submission-contract.md) supplies only modes6/7:
uniform per-face diffuse, affine UVs/RHW1, proper alpha-test mode, full-shell clip,
descending bucket/LIFO order, whole-model winding rejection and per-face winding/
UV reversal. The world material's distance fade/highlight cannot be copied.

Preferred bounded backend: one pooled screen-space triangle mesh/material on a
detached drawing surface, owned by the existing acquisition presentation, composed
at the building position in its current pulse/companion/building/spell order.
This may use the already installed Three renderer for the small affine/cutout
pass and immediately composite its canvas into the existing overlay. Reuse the
same atlas image, draw clock and disposal owner; add no autonomous render loop,
world renderer pass or framework. A plain Canvas2D textured triangle is sufficient
only if it preserves the proven cutout/filter/color behavior; do not silently
replace alpha test with partially transparent edges. Check final material and
clip/order submissions against the static contract before claiming visible parity.

## Acceptance and excluded M3 path

Portable checks compare M1 state/vertices/selection order to the accepted reference,
cover shared replacement and repeated draw purity, and retain independent6/82
world assertions. Checkpoint tests cover current and legacy states without replay;
shipped ordinary verification uses a fresh profile and the reviewed M1 public
Bridge/guard/Vault route. Observe the actual current Blast target/handler, automatic
locked Buildings destination, whole/per-face screen pixels, enabled-card selection
and reachable pause/Save-Load/restart/resize boundaries. Carry unchanged PR269 world
art with exact consumer correspondence. Standard check/build, TypeScript quality
and a bounded screen workload/performance check are still required.

**Mission3 class2 screen handoff stays disabled.** Its CPU/data proof is retained,
but16 Temple mode32 faces require the real shared ANIBL bank2[92] phase, which the
app does not expose. Do not start a per-acquisition fire timer or borrow
`SceneryFire.frame`/`gameClock.animationFrame`. Separate bank-p audit also found
that its12 sparkle frames differ inRGB and palette selector0 differs; only its
four trail crops are byte-identical. A later M3 slice needs that exact shared-phase
and minimal palette/pixel contract. No global effects recolor, static92 workaround,
silent M3 parity claim or broad world-renderer/cadence change is part of M1.
