# #214 candidate source preflight

Decision: **ACCEPT** source preflight. No blocking source findings.
Final merge/gameplay acceptance remains pending the gates listed below.

Base: `a53fa05587c4c1d363e3596162b41fcb9f26e3e8`.
Runtime candidate reviewed: `a76d1c75335b4a857d1ece5bd1d6f7cdefb6552a`.
Current head also reviewed: `ed95f0313e367367a32c232eb4b6d1e118068b58`.
The latter adds only the topic-note link in decomp/README.md; all four app files,
the focused test, and the native note are byte-identical to a76d1c7. Both observed
source states were clean. Full base-to-candidate diff and the later documentation
delta were inspected. Prior accepted research/design scope remains unchanged.

## Source findings

- `animationUsesLogicalVisits` reproduces the relevant native branch distinction:
  flagged modes 1/2 and ordinary mode 4 have logical ownership. Mode 3 and mode-4
  transition work remain presentation-owned. Suppression and morph holds remain
  in the original updater. The updater itself changes only the misleading local
  variable/comment names; its native frame arithmetic is unchanged.
- Live routing separates ownership from eligibility. A gated ordinary model with
  class 0 or state 0 skips both phases; it cannot fall through to a presentation
  advance. The adapter uses the existing single selected source, so native,
  flight, encounter, entry and builder aliases do not create extra visits.
  Post-turn replacement animates the surviving active source. The existing
  world-turn cleanup removes retired units/effects before this boundary.
- Constructor/migration add only bit 0x40000 for ordinary class-1 models 2–7.
  Migration visits all retained aliases idempotently and preserves f1/f2/stamp.
  The existing Shield/Bloodlust migration remains intact. No interpolation-bit,
  broad asset, simulation-lifetime or fallback artwork changes are introduced.
- `advanceGame` splits at every next simulation turn independent of worship hooks.
  Its pre/post World.turn comparison correctly recognizes uint32 wrap and avoids
  treating land-paused accumulator drains as visits. The new phase runs after
  tick's afterTurn/queued callbacks, before the next controller or coincident
  presentation boundary. The 24-Hz interval, presentation serial, messages,
  Stone Head call and UI deadline ordering remain in place. Shipped app source
  calls tick only through advanceGame; direct test/probe tick calls remain
  intentionally simulation-only.
- Command 27's actual controller reads the previous frame before this new logical
  advance. Its substate-2 last-frame condition can enter substate 3, whose next
  controller visit establishes the existing render hold. Removing the old
  two-animation-visits-per-poll compensation only for the logical path is
  consistent; the presentation-owned legacy path retains it. No replacement
  timing constant or synthetic hold was added.
- Splash uses its existing gate and current selected animation record. A new
  surviving effect at the completed turn can animate once without decrementing
  lifetime again; existing world processing and expiry remain unchanged. Other
  effects, smoke, knowledge-glow latching, fallback footprints and shrine/UI work
  are excluded from logical advancement. Ordinary fallback sprites and Stone
  Heads are not claimed repaired by this patch.

The changes are small, readable and reuse existing controllers and frame updater.
There is no new queue, generic clock subsystem, duplicated controller or
decompiler-style runtime machinery. Maintained TypeScript quality tools are still
pending, not asserted passed by this source review.

## Evidence independently checked

1. Verified the a76d1c7 focused receipt, clean source/diff identity, before/after
   equality and exact raw stdout/stderr hashes. The command passed 25 tests in
   20.47 seconds on CPU4: 12 new boundary tests, four existing clock tests, seven
   live-worship tests and two Shield/checkpoint tests. Existing game-clock tests
   cover multiple speeds, regular and irregular schedules, optional hooks,
   movement/construction/combat and unchanged presentation serial/UI behavior.
   Existing worship tests prove real command-27 pause/completion, rewards,
   training replacement and refresh-independent histories. Earlier before logs
   retain the intended failing assertions; they are not substituted for the exact
   committed passing receipt.
2. Inspected the new adapter-comparison driver and verified its exact a76d1c7
   receipt, driver hash and raw logs. All 168 animation-field snapshots match
   retained native timelines: 12 ordinary idle/walk cases, Splash, and three
   supplied clear-bit smoke records. It uses actual current person/Splash
   constructors and phase routing, but supplies animation poses and smoke
   records. Processor bodies and elapsed wall time are not executed. Adapter
   logical stamps deliberately differ from original outer serials and are not
   compared as if equivalent counters.
3. Verified all 18 local native-logical-gate packet files against the published
   evidence manifest. The original prefix/supplied-body and wall-clock limitations
   remain explicit. No additional original probe, browser or full gate was run
   by this reviewer. `git diff --check` passed for the runtime candidate.

Focused receipt SHA256:
`63b9549079a1f2fc6c0fea08286c3435cb8cc82370499ee52ffae2761f2dee7d`.
Adapter-comparison receipt SHA256:
`0509a4dd0d6e4c99361ef08242c96ed9f30c9ef04c4907ec8d3b6c7fa9672e21`.
Both are under the feature tree's
`work/orchestration/sprite-logical-visit-fix/` directory. The companion review
receipt records exact paths and hashes. Source-bound results can transfer across
the verified README-only delta; final standard gates must identify their actual
tested final head.

## Required final gates

- Run `npm run check` and `npm run build` on the final candidate, with source-bound
  receipts. The full test gate must retain affected construction/movement,
  flight/combat, checkpoint, footprint, smoke, effect and existing callback
  regressions. The focused and native-adapter runs need not be repeated for the
  verified documentation-only change.
- Run `npm run format:check`, `npm run lint`, and `npm run lint:standard`; report
  existing Oxlint debt honestly and distinguish introduced findings. Retain the
  repository-required Fallow advisory results rather than treating advisory
  findings as a passing clean bill or deleting indirect native-probe consumers.
- Complete the already-planned ordinary rendered candidate comparison against
  the current a53 baseline. Capture source/model/class/state, flags3/stamp,
  World.turn/presentation serial and displayed frame/UV using passive reads;
  distinguish state/source/setter changes from excess animation advancement.
  Establish the corrected logical cadence with the ordinary native-backed path,
  pause/resume and supported speed controls. The verified portable legacy/current
  checkpoint restoration and new-Scene-clock tests satisfy this patch's restore
  boundary; no additional ordinary browser Save/reload/Load row is required.
  Persistence format and storage operations are unchanged.
  Preserve comparable screenshots and renderer/source fingerprints. Where
  Splash/ungated controls are supplied fixtures, label them accordingly rather
  than upgrading them to ordinary gameplay evidence.
- Review the terminal candidate receipts and rendered comparison before merge.
  Re-review substantive repairs. No new full original renderer or historical
  wall-clock proof is required by this bounded preflight. Broad #214 completion,
  fallback Firewarrior timing, other sprite families and hardware performance
  claims remain outside this acceptance.

The author subsequently identified older test adapters that explicitly call tick
and then two presentation visits. A forthcoming test-only migration to the real
elapsed-time owner must preserve meaningful frame/completion assertions and be
reviewed as a separate frozen delta. This does not change acceptance of the
runtime bytes reviewed here; the final full-check gate remains required. Do not
edit those test inputs concurrently with final gates in the same source tree.

No runtime source fixes are requested. No resources are held.
