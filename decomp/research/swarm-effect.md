# Swarm insect plague effect

Issue #61 is Swarm (insects), not Swamp. This note separates the retained Mission 2 AI ownership/debit proof from newly recovered effect/controller/render behavior.

## Concrete browser gap

At main `147bbc8`, the shipped Swarm effect uses `remaining: 65`, one enemy-person scan guarded by `applied`, and a generic smoke sprite. `app/scene-effects.ts` has no Swarm-specific renderer. The 65-turn comment was explicitly a placeholder pending the native controller.

The verified executable instead creates one class-7/model-21 plague controller for Swarm, with a 200-visit lifetime, 60 class-7/model-27 insect children, repeated person scans, movement/wander, optional building pursuit/ejection, and a dedicated insect renderer/texture.

## Native contract

Spell model 5's verified descriptor effect list is `[21,0,0,0,0]`, so Swarm arrival creates class-7/model-21. `00510020` initializes that controller with child count 60, lifetime 200, height terrain+200, speed 80 native units/visit, random heading and 0..31 wander countdown. Target slots start clear.

`00510d40` allocates 60 class-7/model-27 children. Initial x/y are center plus random [-256,+255], height is controller height plus random [-64,+63], and each child receives native random motion/jitter fields. `00511020` makes children converge toward the moving parent; horizontal velocity clamps to ±128 and height falls by 35/visit toward terrain plus its stored vertical offset. `00511180` moves children toward a target with velocity clamped to ±64 and treats Manhattan distance <200 as arrival. `005112d0` subtracts 2 from each jitter short and clamps negative results to zero; negative initial jitter therefore clears on its first visit while positive values decay by 2/visit.

`00510120` (`process_insect_plague`) performs the ground-person scan whenever `(remaining & 7) == 0`, so response repeats every 8 processing visits. It scans the controller cell plus seven neighboring doubled cells. Eligible people are class 1, enemy tribe, not state 23, without flags2 0x800000, and without person-descriptor flag 0x100. Native performs vehicle-exit handling first. `flags4 & 0x800` removes the person. Otherwise, unless flags2 0x100000 is set, native stores the previous state and enters state 26; spy model 5 has its special reveal call. Damage comes through `004da080(..., DAT_005aa514, 0)`, with imported `SWARM_PERSON_DAMAGE = 100`, equal to 5 browser HP per qualifying scan.

The controller decrements from 200 and removes all children at expiry. State 1 also checks for enemy class-2 buildings on a 64-turn window; state 2 pursues a remembered building, redirects insects, ejects up to six occupants, panics/damages them, then returns to wandering. This is positively established but may remain an explicit follow-up boundary for the first smallest ground-target repair.

## Original insect presentation

The native general renderer (`004673b0`, primitive case 0x11) calls `draw_insect(..., 7.0f)`. Executable strings identify `data\\d3d\\insect.png`. The supplied original is a standalone 32x32 RGBA PNG, SHA-256 `84433882241475ba1ab76f14e7703b78a7ed02eb3cdfd7cc7c89f525b35a0f35`. It is not part of the shared atlas. The declared production output is a byte-identical `public/original/insect.png`; no atlas/model/provenance output is needed.

## Reproducible workflow

Targeted export `7d241c3c-f762-4b72-b7ec-efd078792cf9` failed before decompilation because the isolated worktree had no local `.tools/decomp` and GHIDRA_HOME was omitted; the failure is preserved. Corrected job `74134958-1f18-4f52-a873-0ecd5fef6e2f` passed and exported `00510020`, `00510120`, `00510d40`, `00510cb0` only to ignored scratch. Child job `f6fc0e6e-7e87-422b-b560-37e9564bb29b` passed for `00511020`, `00511180`, `005112d0`. No tracked generated decomp was changed.

## Smallest repair forecast

Restore a 200-visit controller, repeated 8-visit eligible-person scans, deterministic 60-insect particle state using gameplay RNG, and Swarm-specific rendering with the supplied original texture. Preserve stock/cost ownership, cue 0xa4, AI casting, panic/damage/immunity, pause/fixed-turn timing and checkpoint state. Remove exactly the Angel and generic invented `The world bends to your will` success strings. Keep `app/world-turn.ts` read-only. Building pursuit/ejection remains named open behavior unless required by acceptance.
