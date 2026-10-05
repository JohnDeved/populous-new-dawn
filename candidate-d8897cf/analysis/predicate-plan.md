# #214 candidate offline predicate

Prepared from candidate `a76d1c7` phase ownership. No candidate browser capture has
run. The browser input remains the exact accepted `cb57bd7` observer. This checker
reads only its saved JSON and exact-commit imported data through `git show`.
Execution is normally below one second; it launches no game/runtime/dependencies.

Invoke after the permitted candidate capture, using its full final commit:

```sh
python3 analyze-candidate.py \
  --observations /absolute/candidate/sprite-observations.json \
  --source-root /absolute/game-git-checkout \
  --expected-source FULL_FINAL_COMMIT \
  --output /absolute/fresh/candidate-cadence-attribution.json
```

The input must name the exact source, clean tracked/untracked state and original
driver hash. The report records its own hash, raw hash and all imported data hashes.
The checker never edits raw observations or the frozen driver. The separate outer
and inner browser receipts must already verify success, source/input stability,
original execution session and cleanup; this offline report does not replace them.

## Finite predicates

1. Require the exact ten1×/2×/pause/settings segment labels and actual speed/pause
   state in every row. Paused rows must retain turn/time/clocks and all saved native,
   effect, smoke and frame/UV data.
2. Every sampled class1 ordinary model2–7 record must retain bit0x40000. Intended
   logical modes are1/2 or mode4 without renderFlags0x1000, and require nonzero state.
   No logical claim is made for mode3, mode4 transitions or out-of-scope owners.
3. Match adjacent rows by Unit.id, actual owner identity, object and draw. Count
   source/object/draw boundaries separately. Count changed state/substate/command,
   flags, speed or morph separately instead of attributing a reset to timing.
   Within stable logical windows, unchanged World.turn must preserve f1/f2/stamp,
   including when presentation advanced. A completed nonpaused/non-land-paused
   turn must leave the same eligible owner's stamp equal to the observed World.turn.
   This is the modern logical-animation stamp, not a historical draw serial.
4. For the additional stable Shaman mode2/hold0/step0 case, compare f2 delta with
   completed logical turns modulo the imported frame count. Report gaps of a full
   cycle or more as ambiguous; do not convert them into exact visit counts. Require
   positive unaliased matches at both1× and2×, and at least one extra-presentation,
   unchanged-turn logical pair at1×. Missing coverage is `inconclusive`, not a pass.
5. Link existing mesh draw to raw draw, frame to the imported source direction
   cycle at f2 and each existing visible layer's UV to its recorded atlas piece.
   Report missing meshes/unmapped native frames explicitly. No projection, renderer
   update, model getter or live-world helper is executed.
6. Preserve the presentation control: actual elapsed scene time must equal
   presentation delta/24 plus the saved fractional animation-time delta, with2µs
   floating-point tolerance. The smoke presentation serial must advance exactly
   with that clock. Existing visible full/partial hut-root UVs are checked against
   the imported effect frame selected by smoke serial minus actual frameStart.
   Require an observed changing ordinary smoke UV control. Unobserved full smoke,
   Splash and damage smoke remain absent coverage, never invented passing controls.
7. Require genuine native walk observations. Sparse RAF windows, excluded state
   transitions and raw source changes remain visible in counters; this evidence
   does not reconstruct every intermediate processor visit.

## Failure-first check

The unmodified historical a53 raw baseline was passed to the candidate predicate,
with `--expected-source a53fa05587c4c1d363e3596162b41fcb9f26e3e8`. It intentionally
returns exit1 / `failed`:2,079 missing-gate samples,95 same-turn advances,
164 stable-Shaman logical-cadence mismatches and1,430 stamp mismatches. No control,
frame/draw/UV, presentation clock, pause or smoke-UV mismatch was reported. The
exact failed report is `candidate-predicate-negative-control.json`; it remains
a negative control, not a candidate test or rewritten baseline result.

Existing portable restoration/new-scene-clock tests own the restore boundary.
No Save/reload row, driver alteration, new telemetry or additional browser journey
is required by this preparation. Candidate runtime acceptance and final review
remain pending the separately coordinated terminal check/build/browser chain.
