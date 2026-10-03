# Issue 30 — ordinary worship spell-acquisition VFX

Scope: the completion-time acquisition presentation for ordinary worship spell rewards.
Shaman death/reincarnation VFX, worship panels, Stone Head model families, and later spell
cast effects are separate producers and are not changed here.

## Original producer and event ordering

Retained original execution already binds the general path:

1. `FUN_004fb270` (`0x004fb270`) completes a worship trigger, clones its linked
   class-6/model-2 reward through the normal allocator/template-copy path, and requests
   the clone's immediate first processing before retiring the source/head.
2. Retained Mission 14 completion receipts record ordinary class-11 spell clones after
   that first processing with recipient Blue, timer **82**, presentation phase **6**,
   and grant mode 3. Trigger 48 produces Angel/model13; trigger 55 produces
   Earthquake/model14 and Bridge/model12. Stock is unchanged at completion.
3. `FUN_004facf0` (`0x004facf0`) owns the acquisition presentation and delayed grant.
   On its visual initialization it selects the body object from the linked reward
   class/model, grounds the reward at the source position, then lifts it **800 native
   height units**.
4. The same routine allocates one neutral class-6/model-8 glow at the reward x/y. The
   glow uses object/frame **1417**, draw 43, morph 1, and sits **80 native units below**
   the reward body.
5. The ordinary phase-6 presentation decrements once per reward-object visit:
   `6 -> 5 -> 4 -> 3 -> 2 -> 1 -> 0`. On the sixth visit the body is hidden and
   the glow is removed. The independent timer continues.
6. Only when the 82-visit timer expires does `004facf0` grant the building/mana/spell
   payload and delete the reward object. The visual phase therefore precedes stock
   acquisition; it is not the later spell-cast VFX.

The retained `scripts/check-native-worship.py` executes the native body and proves
representative original body frames: Lightning/model3 -> **1059**, Bridge/model12 ->
**1068**, and the building/vault-family fixture -> **1077**, all with glow 1417 and
the +800/-80 anchors. No gameplay RNG call exists in `004facf0`.

## Variants and limits

This slice is deliberately not universalized across every worship family.

- Ordinary class-11 spell rewards use the six-visit phase-6 acquisition presentation.
- Mission 22 class-6 mana rewards are a proven different consumer: retained
  `mission22-rewards` evidence records timer 82 with presentation phase **1**.
- Building-knowledge rewards use the same processor but a building-descriptor-selected
  body object rather than the spell table.
- Vault behavior must not be assumed for ordinary Stone Heads; its marker and admission
  have separate ownership.
- Mission 5 Angel-head activation and Shaman death/reincarnation have distinct producers.
- The browser's later reward-payout `birth` bookkeeping effect is not identified by
  this evidence as the progress-full acquisition VFX and is outside this slice.

## Current shipped normal path

Fresh current main `4897ea93833b5062aabc357a9aa54787f150c44e` already contains the source-shaped
presentation:

- `app/world-turn.ts` calls `createGift` when an ordinary worship reward fires.
- `app/world-effects.ts:createGift` initializes timer 82, phase 6, the original reward
  frame, and terrain+800 height.
- `app/scene-effects.ts` renders the body and glow 1417 at -80 and hides the group when
  phase reaches zero.
- the normal gift loop grants stock only when timer 82 expires.

A fresh Mission 1 Bridge worship run through the real command/worship path produced the
reward at head `(-5,25)` with frame 1068, phase 6, timer 82, stock/gift counters still
zero, then followed the six-visit hide sequence and granted one Bridge shot/counter only
on visit 82.

Therefore no new event-effect helper, caller, sprite import, atlas output, model output,
or gameplay change is justified. Adding a second completion effect would duplicate the
original processor rather than repair it. This issue slice instead adds a focused
normal-path regression/checker tying the already-shipped path to the retained native
contract.

## Evidence reused

- `decomp/generated/004facf0.c`
- `scripts/check-native-worship.py`
- `decomp/research/mission14-linked-angel.md`
- `/Users/johann/populous-browser/work/orchestration/mission14-linked-angel/native/probe-result.json`
- `decomp/research/mission22-rewards.md`
- `/Users/johann/populous-browser/work/orchestration/user-reports-20260918/worship-completion-vfx.md`

No new native execution is required for this bounded decision.
