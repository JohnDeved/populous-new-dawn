# Animation cadence audit (#214)

Issue: [#214](https://github.com/JohnDeved/populous-new-dawn/issues/214).
Original EXE SHA256:
`3a5065c7420b3fcde208bf220bc86dfbac95e025ab2492caf9c7ea5308dfbe4f` (read only, never run).

Use this before you investigate a "too fast" or "too slow" sprite report. It lists
each animated family the browser draws, side by side with the original rule. It
covers:

- people, both through native counters and through the legacy elapsed-time tables;
- effect sprite sequences;
- spells, buildings, scenery, terrain and UI blinks.

```sh
node scripts/animation-cadence-audit.mjs                     # markdown, all rows
node scripts/animation-cadence-audit.mjs --status mismatched  # what is still off
node scripts/animation-cadence-audit.mjs --visibility         # + sampled exposure
node scripts/animation-cadence-audit.mjs --json --output /tmp/cadence.json
node scripts/animation-cadence-audit.mjs --check              # exit 1 on stale anchors
```

The audit is read only. Its synthetic test is `tests/animation-cadence-audit.test.mjs`.

## How rows are formed

- **Visit rates are measured, not assumed.** The audit steps the actual
  `advanceGame` clock in Node. It currently reports 24 presentation visits per wall
  second at both 1× and 2×, plus 12 logical turns per wall second at 1× (24 at 2×).
- **Native rules use the original's units.** A rule is a number of frames per
  visit, and the visit is either a *presentation* visit or a *logical* visit:
  - A *presentation* visit is one native draw-loop iteration. The browser stands it
    in with its 24 Hz adapter.
  - A *logical* visit is a stamped processor visit (flags3 `0x40000`).
  - Descriptor semantics come from `app/animation.ts` (`0x4ee7b0`). Mode 2 holds
    each frame for `step + 1` visits. Mode 1/3/4 advance `step / 4` frames per visit.
- **The original's absolute draw rate is still not established.** Every
  presentation-visit comparison is therefore relative to the 24 Hz adapter, as
  #214 records. A `matched` row means the browser and the original agree on the
  rule. It does not prove wall-clock parity.
- **Native tables.** `app/original-rules.json` supplies the descriptors and the
  person/object maps, as imported from the EXE by `scripts/import-original.py`.
- **Static setter read.** `decomp/research/animation-cadence/native-setters.json`
  comes from `scripts/native-animation-setters.py`, a Capstone 5.0.7 static read.
  It lists all 94 direct `call 004ee700` sites. For the 64 that pass constant
  arguments it records the immediate draw/object pair, chosen by vote across
  aligned decode windows. It also records whether the bounded function body ORs
  flags3 `0x40000`.
  - Calibration: it finds the Splash gate at `005138a2` and the person gate at
    `004d23ed`, the two cases #217 proved.
  - Limits: callees and allocator flags are not followed.
- **Browser rules.**
  - The legacy unit rate is read live from `fallbackFramesPerSecond`, the function
    `Scene.animatePerson` calls.
  - Every other browser rule is curated in `scripts/animation-cadence-families.json`.
    Each curated rule carries a regex anchor into its owner. If an owner moves or
    is rewritten, the row is reported as `STALE`.
- **Unknown is a valid answer.** A missing native trace gives `unknown`, never a
  guessed rate.

Regenerate the static read only from the verified executable:

```sh
.tools/decomp/oracle/bin/python -I scripts/native-animation-setters.py "$POPULOUS_EXE" \
  --output decomp/research/animation-cadence/native-setters.json
```

## Findings at introduction

**Before the fix:** 24 legacy Firewarrior rows were `mismatched (too-fast)` at ratio 2.
These cover blue/red walk, idle, selected, work, attack, strike, special, recoil,
pray, carry, airborne and dance.

- **Cause.** `Scene.animatePerson` advanced every legacy table at a fixed 12 frames
  per game second (`original-units.json` `fps`). The original gives model 6
  descriptor 18, which is mode 2 with step 1, and gates it on logical visits. That
  is one frame per two logical turns, or 6 fps at 1×.
- **Where players see it.** The Firewarrior uses the fallback whenever no native
  owner is active. Examples:
  - walking authored or computer routes (Missions 10, 18 and 22 at start);
  - legacy `u.fighting` shooting. This path shows the `attack` table (source 120,
    the punch artwork). The original fires with source 56 under draw 13, step 0,
    about 12 fps. Here the fix only halves the rate of artwork that is already
    wrong. The audit row `legacy-unit/firewarrior-shooting` records this artwork gap;
    it does not claim parity for this path;
  - selected idle in mixed handoffs, the case the #214 G witness reported.
- **Pre-existing rounding jitter.** The same code computed
  `floor((turn - since) / 12 × 12)`. Floating-point rounding put that one frame
  short for a large share of turn pairs (19% of 160,000 pairs with
  `since` in 0–399 and gaps 0–399), so every kind's fallback could show doubled
  frames followed by a skip. This affected Brave, Warrior, wild and route walkers.
- **Fix.** `fallbackFramesPerSecond(draw, 12)` in `app/animation.ts` now applies
  the descriptor hold, and the step adds a `1e-6` epsilon.
  - Covered by `tests/unit-fallback-cadence.test.mjs`. That test runs actual
    Mission 10 people through the real `advanceGame` and the Scene unit loop, at
    1×/60 Hz, 2×/144 Hz and 1×/30 Hz.
  - It failed first on base `3c44131c` with "Firewarrior 1 turns/step".

**After the fix**, the full audit reports 7 mismatched, 11 unknown, 178 matched and
172 not-applicable rows. The remaining mismatches, by likely visibility:

1. **Lightning branch jitter** (`too-fast`, refresh dependent).
   - `animateLightning` re-rolls `lightningLines` on every RAF frame. The original
     (`0x475350`) re-rolls once per draw iteration, so a 60 Hz display shows 2.5×
     the adapter rate and a 144 Hz display 6×.
   - It also makes cosmetic RNG consumption depend on the refresh rate.
   - A repair has to decide how this behaves while paused: the native draw loop
     keeps running, but the browser's presentation visits stop.
2. <a id="wild-people-gate"></a>**Native wild-person counters** (`too-fast`, 2×).
   - `004d23d0` ORs `0x40100` at `004d23ed` before its model switch. The model-1
     branch (`004d2417`) and the tail (`004d26d1`) do not clear it. The first
     block of callee `004d5920` does not write +0x14.
   - `createLivePerson` gates only models 2–7. That leaves wild flight, fight and
     conversion records on presentation visits.
   - Sampled ordinary AI play (ten missions × 1,200 turns) created no such record.
     A player-conversion witness and the complete creation path are needed before
     a repair.
3. **Effects without counters** (`too-slow` under the adapter):
   - combat `hit`, spell `sparkle` (Shield, Invisibility, Bloodlust, Teleport,
     Convert, Flatten) and non-unit death `smoke`;
   - these use `floor(age × 12)`, while their original draws (46, 44 and 44) are
     ungated mode 1;
   - their summed `1/12` ages also floor short at some turns.
4. **Armageddon arrival sparkle** (`setAnimationObject(44, 1401)`). 1401 lies
   outside the `sparkle` sequence, so the browser freezes on frame 15. This is an
   artwork/sequence gap, not a rate defect.
5. **Firewarrior legacy shooting** (`too-slow`, plus an artwork gap).
   - `u.fighting` shows the punch `attack` table (source 120) at the draw-18 rate,
     which is now 6 fps. The original fires with source 56 under draw 13, which is
     12 fps.
   - Before this fix, wrong artwork ran at a rate that happened to match.
   - The real repair is to adopt the native command-28 firing owner, not to tune
     this fallback.

Unknown rows have no traced native rule. They include the spell halo (wall 12 fps,
runs while paused), spy disguise flicker, bloodlust blink, shake, water, pointer
brackets, HUD blinks, scenery fire, the temple ANIBL compatibility policy, the menu
glow and the legacy knockback phase sample.

The knockback sample needs a note:

- Without `nativeRecoilAnimation`, `startMeleeKnockback` (`live-people.ts`) still
  sets `f2 = floor(elapsed × 12)` once.
- The descriptor-aware fallback now shows a Firewarrior's preceding legacy recoil
  pose at 6 fps. As a result, the pose can jump from frame k to about 2k when
  knockback starts.
- This field belongs to the person record, so it was left unchanged here. It needs
  its own owner review.

## Effect repairs

This follow-up moves five rows from mismatched to matched and adds a Flatten
sparkle row. The audit now reports **2 mismatched, 11 unknown, 184 matched and
172 not-applicable** rows. The two left are the wild-person counter gate and the
Firewarrior shooting artwork. Behavior is covered by
`tests/animation-cadence-effects.test.mjs`. It drives the real `advanceGame` and
the `scene-effects` renderer at 30/60/144 Hz, 1× and 2×, and while paused. Every
case in it failed first on base `94881ba0`.

### <a id="lightning-draw-visits"></a>Lightning draw visits

Native chain (static read of the verified EXE: direct-call scan plus the Ghidra
exports in `decomp/generated/`, never executed):

- `main_3` (`004a4450`) runs one iteration per frame. It increments
  `sprite_animation_counter`, then calls `draw_main` (`004a4755`).
- `draw_main` calls `draw_1` (`004a4c07`), which calls `draw_land` (`005226ce`),
  which calls draw-polygons `004673b0` (`0046733d`).
- Draw-polygons case 19 (`0046b16a`) calls `00475350` once for each queued bolt
  segment. `00475350` re-rolls the branches from the cosmetic RNG `0089bc72`.
- No function on this consumer chain tests pause (`land_flags_1 & 2`).
  `draw_land` only freezes its tick count. Only `004ee770`, the sprite animation
  pass after `draw_1`, skips paused frames. **So the original keeps re-rolling
  branches while paused**, provided segments stay queued.
- Not inspected: the routine that queues the bolt segments for case 19 during
  `draw_land`. Its pause behavior is inferred, not read.

Browser implementation:

- `GameClock.drawVisit` stands in for one draw-loop iteration.
  - While running, `advanceGame` calls it on each 24 Hz presentation visit, after
    the sprite animation pass.
  - While paused (ordinary Space pause), it keeps calling it at the same 24 Hz rate
    of elapsed time. The paused phase restarts at each pause, and no turns or
    sprite visits run.
- `lightningDrawVisit` (`scene-effects.ts`) rolls one shape per visible segment
  with `rollLightningBranches`. It keeps the existing culling test.
- `animateLightning` only places the stored shapes at the current projection, so
  rendering no longer consumes RNG. A segment that has not had a draw visit yet
  shows only its parent line, for at most one 24 Hz interval.
- `lightningLines` remains the exact composition of roll and place.
  `check-native-lightning.py` (256 branch streams) and
  `check-native-hut-smoke-render-rng.py` still pass.
- Effect: display refresh no longer changes branch cadence or cosmetic RNG use.
  That RNG is shared with hut smoke, worship poses and other world consumers, so
  their outcomes stopped depending on the refresh rate too.

Browser adaptations:

- The modal pause menu suspends presentation entirely (existing scene policy), so
  bolts freeze there.
- Native rolls follow the native painter order and viewport. The browser rolls in
  `world.effects` order and uses its own culling.
- Shapes are keyed by the segment array that `stepLightning` rebuilds each turn.
  When a turn falls between draw visits, new geometry shows only its parent lines
  until the next visit.
- Culling at the visit uses the previous frame's camera. While the camera moves, a
  segment entering view can show only its parent line for up to 1/24 s.
- A hidden tab pauses rendering. When the tab returns, a paused, visible bolt
  catches up its missed draw visits, so cosmetic RNG use grows with the hidden
  time. This mirrors the existing catch-up of worship visits on return.

Static lead, not a claim: the frame limiter in `main_3` waits for
`1000 / FUN_0049cfe0()` ms in game when the `game_state` byte at `+858460` is
nonzero. That is 24, 20 or 14 fps for bits 1, 4 and 2, and 60 fps otherwise. When
the byte is zero it waits for `1000 / DAT_0089ce62` ms instead. The absolute
original draw rate therefore still depends on runtime configuration. It is not
established here, and the 24 Hz adapter is unchanged.

### Effects without counters

`0x509c10` (`init_unit_type_7`, switch on model − 1) sets these sprite objects
with no `0x40000` gate write. The second number is the effect's processor
lifetime.

| model | lifetime | draw | object |
| --- | --- | --- | --- |
| 60 | 16 | 44 | HFX1288 |
| 61 | 6 | 46 | HFX1294 |
| 66 | 16 | 44 | HFX1224 |
| 71 | 4 | 47 | HFX1288 |

Producers that showed these artworks at `floor(age × 12)` now carry the same native
counters through `animateEffectSprite` (`world-effects.ts`). `animateLiveObjects`
advances those counters on presentation visits, so each frame loops over the
descriptor hold and freezes during pause. The producers:

- every `hit` effect: effect 61;
- non-unit `death` smoke from buildings and an expired Angel: effect 66;
- the Shield, Invisibility, Bloodlust, Teleport and Convert sparkle visuals:
  effect 60's artwork and rule;
- Flatten's sparkle, which `0x512700` allocates as effect 61. It previously showed
  sparkle frames 6–11, the same HFX1294–1299 pixels.

These sprites now render opaque, as the existing counter-owned order marker and
level-start sparkles already do. The browser lifetimes are unchanged.

Known limits of this repair:

- **First frame.** `advanceGame` runs a turn before a coincident presentation
  visit. An effect created in that turn therefore first renders with `f1 = 4`
  (frame 1). The original draws before it animates (`draw_1`, then `004ee770`), so
  it shows frame 0 first. The order is shared by every counter-owned effect
  (Splash, site sparkles) and is not changed here.
- **Lifetimes.** Native effects 60 and 66 live 16 processor visits. The browser
  keeps its own lifetimes: 1.7 s for death smoke and the Shield, Invisibility and
  Bloodlust visuals. That is 40.8 visits, so these sprites now end mid-cycle with
  no fade. The native lifetimes remain to be adopted.

### Armageddon arrival sparkle

`0x4dfac0` (`004dfb94`) sets draw 44 / HFX1401 on the arrival visual. Descriptor
44 holds 16 frames, so the cycle is HFX1401–1416. The bank shows that range as 16
frames of 12×34, followed by an 81×68 sprite.

- The new append-only `scripts/import-armageddon-sparkle.py` (hash-pinned inputs,
  read-only `--check`) adds them as the `armageddonSparkle` sequence.
- The live special-battle allocation now uses that sequence.
- `import-hypnotise.py --check` now ignores rows appended after it, which keeps the
  check valid.
- Limit: the tribe effect palette that `special-battle.ts` writes is still not
  rendered.

## Boundaries

- No global clock or presentation-rate change. Native-counter owners, simulation,
  RNG and checkpoints are untouched; the fallback cadence is presentation-only.
- The fallback is keyed by the Scene's draw (`nativeUnitDraw(kind)`, or the native
  source's draw), not by the per-state native object. Every reachable legacy state
  maps to the kind's draw or to a draw with the same step. For example, the Shaman's
  walk uses draw 13 against the kind's 14, and both are step 0. The exception is
  `firing` (draw 13), which only the native catalog reaches.
- The static read is not a CFG recovery. Effect gates set by allocators or callees
  would be missed. Treat `presentation` gates from it as body-scan evidence.
