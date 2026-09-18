# Swarm insect plague effect

Issue #61 is Swarm (insects), not Swamp. This note separates the retained Mission 2 AI ownership/debit proof from newly recovered effect/controller/render behavior.

## Concrete browser gap

At main `147bbc8`, the shipped Swarm effect uses `remaining: 65`, one enemy-person scan guarded by `applied`, and a generic smoke sprite. `app/scene-effects.ts` has no Swarm-specific renderer. The 65-turn comment was explicitly a placeholder pending the native controller.

The verified executable instead creates one class-7/model-21 plague controller for Swarm, with a 200-visit lifetime, 60 class-7/model-27 insect children, repeated person scans, movement/wander, optional building pursuit/ejection, and a dedicated insect renderer/texture.

## Native contract

Spell model 5's verified descriptor effect list is `[21,0,0,0,0]`, so Swarm arrival creates class-7/model-21. `00510020` initializes only that controller with child count 60, lifetime 200, height terrain+200, speed 80 native units/visit, random heading and 0..31 wander countdown. Those heading/wander fields consume exactly two gameplay RNG draws; target slots start clear and no model-27 child is allocated yet.

On the controller's first `00510120` processing visit, state 0 calls `00510d40`, allocates 60 class-7/model-27 children, changes the controller to state 1, and then skips the state-1 wander countdown/heading block until the second visit while still continuing through the common movement/tail logic. Per child, gameplay RNG order is x offset, y offset, signed height offset, motion fields +0x49/+0x4b/+0x4d, then ten signed jitter shorts. Initial x/y are controller position plus random [-256,+255], height is controller height plus random [-64,+63], +0x49 and +0x4d are the two horizontal motion components used by `00511020`, and +0x4b is retained as the middle motion field. `00511020` makes children converge toward the moving parent; horizontal velocity clamps to ±128 and height falls by 35/visit toward terrain plus the stored signed vertical offset. `00511180` moves children toward a target with velocity clamped to ±64 and treats Manhattan distance <200 as arrival. `005112d0` subtracts 2 from each jitter short and clamps negative results to zero; negative initial jitter therefore clears on its first visit while positive values decay by 2/visit.

`00510120` (`process_insect_plague`) performs the ground-person scan whenever `(remaining & 7) == 0`, so response repeats every 8 processing visits. It scans the controller cell plus seven neighboring doubled cells. Eligible people are class 1, enemy tribe, not state 23, without flags2 0x800000, and without person-descriptor flag 0x100. Native performs vehicle-exit handling first. `flags4 & 0x800` removes the person. Otherwise, unless flags2 0x100000 is set, native stores the previous state and enters state 26. Every eligible non-removal Spy (person model 5) then calls `004de7f0`, which resets disguise to the real tribe; this still happens on the flags2 0x100000 protected path where panic is skipped. Damage comes through `004da080(..., DAT_005aa514, 0)`, with imported `SWARM_PERSON_DAMAGE = 100`, equal to 5 browser HP per qualifying scan.

The controller decrements from 200. During the final 15 processing visits, `00510120` progressively removes children whose stable child-index low nibble equals the current remaining counter; when the counter reaches zero it removes the survivors with the parent. The browser particles do not occupy the native unit pool, so the repair preserves this progressive visual lifetime with stable particle allocation ordinals rather than claiming native unit-index identity. This tail consumes no gameplay RNG. State 1 also checks for enemy class-2 buildings on a 64-turn window; state 2 pursues a remembered building, redirects insects, ejects up to six occupants, panics/damages them, then returns to wandering. This remains the explicit building pursuit/ejection boundary and is not implemented by the ground-target repair.

## Original insect presentation

The native general renderer (`004673b0`, primitive case 0x11) calls `draw_insect(..., 7.0f)`. Executable strings identify `data\\d3d\\insect.png`. The supplied original is a standalone 32x32 RGBA PNG, SHA-256 `84433882241475ba1ab76f14e7703b78a7ed02eb3cdfd7cc7c89f525b35a0f35`. It is not part of the shared atlas. The declared production output is a byte-identical `public/original/insect.png`; no atlas/model/provenance output is needed.

## Reproducible workflow

Targeted export `7d241c3c-f762-4b72-b7ec-efd078792cf9` failed before decompilation because the isolated worktree had no local `.tools/decomp` and GHIDRA_HOME was omitted; the failure is preserved. Corrected job `74134958-1f18-4f52-a873-0ecd5fef6e2f` passed and exported `00510020`, `00510120`, `00510d40`, `00510cb0` only to ignored scratch. Child job `f6fc0e6e-7e87-422b-b560-37e9564bb29b` passed for `00511020`, `00511180`, `005112d0`. No tracked generated decomp was changed.

## Smallest repair forecast

Restore a 200-visit controller, repeated 8-visit eligible-person scans, deterministic 60-insect particle state using gameplay RNG, and Swarm-specific rendering with the supplied original texture. Preserve stock/cost ownership, cue 0xa4, AI casting, panic/damage/immunity, pause/fixed-turn timing and checkpoint state. Remove exactly the Angel and generic invented `The world bends to your will` success strings. Keep `app/world-turn.ts` read-only. Building pursuit/ejection remains named open behavior unless required by acceptance.
