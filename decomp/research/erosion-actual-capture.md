# Actual-input Erosion controller replay

This tooling records a new ordinary browser Erosion and compares each observed
controller call against `0050ff30 -> 004983a0`. No ordinary capture or native
execution was performed while preparing it. Earlier effect3322's lifecycle record
does not contain the missing per-step RNG/full heights and cannot supply inputs.
Same-input controller equivalence does not prove native reward activation
scheduling, engine timing, terrain consumers, walk masks, rendering, or audio.

## Passive browser seam

`app/erosion.ts` retains one controller body. `app/erosion-observation.ts` keeps an
opt-in WeakMap keyed by the actual controller, outside World/checkpoints. Unarmed
calls do one lookup and call the same body; they do not copy, allocate diagnostic
records, read a timer, or wrap callbacks. Armed calls copy both signed native
height planes, RNG and controller state immediately around that single call.
Sound/terrain callbacks preserve their original receiver, arguments, return and
exception identity. Diagnostic copy/append failures invalidate capture and stop
collection while gameplay proceeds normally. An interrupted game call is retained
as incomplete and cannot be admitted to replay.

The cap is64 visits:4MiB of raw height arrays, plus small metadata. Overflow fails
closed. Exports are detached copies; JSON conversion is deferred until export.
The adapter reads only capture counts during turns, avoiding cumulative copying.
Early detach, missing visits or source/lifecycle errors reject evidence.

`qa/erosion-native-replay/capture.mjs` chains an already-installed prospective
lifecycle observer on the real `gameClock.afterTurn`. At the actual head101 use,
it binds the uniquely observed new controller, then records each actual afterTurn
number and checks zero-counter removal. It neither creates a World nor issues
game inputs. Browser/profile/scenario composition is **deferred**, including the
coordinator's exact source/runtime review, ordinary activation route and lane grant.
There is no launch or profile-adoption command in this change.

## Exact native boundary

Canonical executable SHA256:
`3a5065c7420b3fcde208bf220bc86dfbac95e025ab2492caf9c7ea5308dfbe4f`.
Use the current executor's `prerequisites/env.sh`, never launch the OS binary.
Inputs are effect countdown+0x6c, center x/y+0x3d/+0x3f, sound flag+0x10 bit0x10,
simulation RNG0x89d178, all16,384 signed landscape heights at0x8a03e4+4 with16-byte
stride, writable64×16 scratch addressed through0x59df0c, and a valid stack.
Center h is retained for attribution but not read by the compared bodies. Radius4
is immediate;0050ff30 overwrites0xa69130;004983a0 initializes its used scratch.

The existing synthetic checker intercepts sound0048a050, queue0044ddf0,
notification0044f2f0 and deletion004edcf0. This tool preserves those explicit
boundaries and retains their ordered arguments. Browser sound() has no arguments;
world-turn maps it to cue169, while terrain(cell) maps to radius6/mode1. Those
static adapter literals are not represented as independently observed callback
arguments. Every native call restores its actual browser pre-step inputs, because
other game work owns between-call RNG/terrain changes. All16,384 outputs are
compared directly, not only a sampled area or the separate `World.terrain` array.

## Open sound and activation inputs

`0050ff48` suppresses sound when flags4 bit0x10 is set. Allocation004ed8a0 clears
flags4, but head004fb270 clones the authored reward with004ede10 before immediately
dispatching004ed700. The copied template state must be established independently.
Moreover, actual0048a050 sets bit0x10 on successful audio allocation;0048ad50 clears
it after release of the last owned sound. Hooking sound does not compose that
lifecycle. The replayer therefore checks heights/RNG/countdown and terrain cells
under **both selected sound-bit values**, labels them selected test inputs, and
makes no actual M3 sound-policy/cadence claim. A potential browser discrepancy is
unproved until creation/audio consumers are composed.

Browser shrine creation follows its current effect loop; native head dispatches
the clone immediately. Controller replay cannot settle that scheduling boundary.
The separately owned authored load/clone/activation trace must determine it.

## Capture admission and execution

Run `python3 scripts/check-native-erosion-capture.py --help` for required paths.
`--validate-only` performs no native imports or execution. Full replay additionally
requires `--executable "$POPULOUS_EXE"` with the canonical emulator Python.

Five files are required: the adapter's JSON capture, terminal local-render harness
receipt, prospective lifecycle JSON, captured module bundle, and archived ordinary
inputs. The terminal receipt's `result.erosionReplay` must bind the raw SHA256 of
capture/lifecycle/modules/inputs under `files`, plus `runId` and
`sourceFingerprint`. It must be passed, clean, unchanged, error-free, and carry
matching runtime/scenario and verified profile cleanup/continuity. The lifecycle
wrapper carries `runId`, `sourceFingerprint`, `errors`, `speedViolations`, and the
existing `erosion` observation. Required module paths are enumerated in the tool;
each entry has sourceSha256, servedSha256 and exact servedBody. Source bytes are
checked against the pinned git commit; served bytes are checked against their
captured hash. Capturing and reviewing that actual runtime correspondence is a
future driver obligation; this schema does not manufacture execution provenance.

Capture JSON contains64 `{turn, visit}` rows with detached before/after states,
ordinal, boolean alive/completed, ordered completed notifications and finite copy
timing. No RNG or height input is reconstructed from neighboring visits. Terminal
retirement requires remaining0 and actual absence. Partial, replaced, late,
reordered, overflowing, corrupt or unbound evidence is rejected before emulation.

## Verification and remaining gates

Focused tests load accepted-main `3b899125cc8cedef938823718ad5d44f49957b66`'s actual
controller source from git and compare uninstrumented/disabled/enabled visits.
They also compare every World field after each turn in a labelled source fixture,
check call order/receiver/exception identity, detached ownership and copy/append
faults. Python admission tests use synthetic documents and never invoke native
code. These tests require that pinned git object to remain available.

Before ordinary capture, obtain fresh source review, coordinated aggregate/build
and quality gates, an alternating-order uninstrumented/disabled/enabled overhead
measurement, and the exact reviewed browser composition. Native execution and
ordinary observed copy/RAF timings remain not-run. No parity ledger is changed.
