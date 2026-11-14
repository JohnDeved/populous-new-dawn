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
  second at both 1× and 2×, plus 12 logical turns per game second (24 at 2×).
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
  - legacy `u.fighting` shooting (`attack`, command 28 is not adopted);
  - selected idle in mixed handoffs, the case the #214 G witness reported.
- **Pre-existing rounding jitter.** The same code computed
  `floor((turn - since) / 12 × 12)`. Floating-point rounding put that one frame
  short for about 19% of turn pairs, so every kind's fallback could show doubled
  frames followed by a skip. This affected Brave, Warrior, wild and route walkers.
- **Fix.** `fallbackFramesPerSecond(draw, 12)` in `app/animation.ts` now applies
  the descriptor hold, and the step adds a `1e-6` epsilon.
  - Covered by `tests/unit-fallback-cadence.test.mjs`. That test runs actual
    Mission 10 people through the real `advanceGame` and the Scene unit loop, at
    1×/60 Hz, 2×/144 Hz and 1×/30 Hz.
  - It failed first on base `3c44131c` with "Firewarrior 1 turns/step".

**After the fix**, the full audit reports 6 mismatched, 11 unknown, 178 matched and
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

Unknown rows have no traced native rule. They include the spell halo (wall 12 fps,
runs while paused), spy disguise flicker, bloodlust blink, shake, water, pointer
brackets, HUD blinks, scenery fire, the temple ANIBL compatibility policy, the menu
glow and the legacy knockback phase sample.

## Boundaries

- No global clock or presentation-rate change. Native-counter owners, simulation,
  RNG and checkpoints are untouched; the fallback cadence is presentation-only.
- The fallback is keyed by the Scene's draw (`nativeUnitDraw(kind)`, or the native
  source's draw), not by the per-state native object. Every reachable legacy state
  maps to the kind's draw, except `firing` (draw 13), which only the native
  catalog reaches.
- The static read is not a CFG recovery. Effect gates set by allocators or callees
  would be missed. Treat `presentation` gates from it as body-scan evidence.
