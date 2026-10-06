# Actual-input Erosion controller replay

The [2026-10-06 actual capture and native component replay](https://github.com/JohnDeved/populous-new-dawn/blob/d4b877ad56ca62f78fc6c49ee07cb4b5837c1f85/report.md)
passed independent review. Original Blue Shaman46 used the authored Mission3
head101 through one ordinary worship order. Effect3155 activated at turn688 and
retired at751; every one of the16,384 heights, simulation RNG, countdown/liveness
and terrain-notification cells matched on all64 calls under both explicitly
selected sound-bit settings. No original OS binary was launched.

Earlier effect3322's lifecycle record lacks per-step RNG/full heights; it was not
reconstructed or reused. Each new native call restores its own actual captured
browser input. This is not an uninterrupted original-game simulation.
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

`declareNextErosionCapture` prospectively copies one expected unsigned native x/y
target. A private `createErosion` notification binds its exact new return object
before the caller's first step and retains a detached constructor snapshot at64.
The constructor returns the same object with the same fields. Wrong-target or second
creation, or duplicate declaration, permanently invalidates the capture; it never
searches for a replacement or automatically rearms. The declaration stays active
until explicit close. Its handle can compare identity without exposing the live
reference. Unarmed construction has no diagnostic allocation or timing query.

`qa/erosion-native-replay/capture.mjs` declares before head101 is used, then chains
an already-installed version2 lifecycle observer on the real `gameClock.afterTurn`.
It verifies the actual shrine transition and exact constructor/effect identity,
then attributes captured calls to actual turn numbers. The first afterTurn must
already have one completed call and remaining63. Expected coordinates use only the
pure x/y formula; `nativePosition` is deliberately not called because it also
synchronizes terrain. Height is observed rather than predicted. This adapter
neither creates a World nor issues game inputs.

The source-only [ordinary driver](../../qa/erosion-ordinary/README.md) now combines
the accepted issue223 immediate-activation producer and this recorder. The
published run uses one original Blue Shaman and one authored-head worship dispatch.
Future executions still require exact frozen source/runtime/plan review and the
coordinated lane. The replay proof is separate from the earlier supplied-state
producer/scheduler proof in [issue223](https://github.com/JohnDeved/populous-new-dawn/issues/223);
neither establishes a full original-game run.

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

## Sound and activation boundaries

`0050ff48` suppresses sound when flags4 bit0x10 is set. Allocation004ed8a0 clears
flags4, but head004fb270 clones the authored reward with004ede10 before immediately
dispatching004ed700. The separately reviewed [issue223 producer trace](https://github.com/JohnDeved/populous-new-dawn/issues/223)
establishes the bounded creation/first-dispatch distinction under its stated inputs.
Moreover, actual0048a050 sets bit0x10 on successful audio allocation;0048ad50 clears
it after release of the last owned sound. Hooking sound does not compose that
lifecycle. The replayer therefore checks heights/RNG/countdown and terrain cells
under **both selected sound-bit values**, labels them selected test inputs, and
makes no actual M3 sound-policy/cadence claim. A potential browser discrepancy is
unproved until creation/audio consumers are composed.

The old browser shrine path created64 after its effect loop; the native head's
immediate dispatch ends63. Version2 capture requires the corrected immediate first
step, followed by one existing-effect visit on each next turn. The issue223 fix
owns production timing and its terrain-batch ordering. This recorder change does
not implement that fix or establish complete engine scheduling.

## Capture admission and execution

Run `python3 scripts/check-native-erosion-capture.py --help` for required paths.
`--validate-only` performs no native imports or execution. Full replay additionally
requires `--executable "$POPULOUS_EXE"` with the canonical emulator Python.

Six files are required: the reviewed external launch plan plus the adapter's JSON capture, terminal local-render harness
receipt, prospective lifecycle JSON, captured module bundle, and archived ordinary
inputs. The caller also pins the actual terminal receipt SHA256, source commit,
source fingerprint and run ID independently of this bundle. The terminal receipt's `result.erosionReplay` must bind the raw SHA256 of
capture/lifecycle/modules/inputs under `files`, plus `runId` and
`sourceFingerprint`. It must be passed, clean, unchanged, error-free, and carry
matching runtime/scenario and verified profile cleanup/continuity. The lifecycle
wrapper carries `runId`, `sourceFingerprint`, `errors`, `speedViolations`, and the
version2 `erosion` observation. Required module paths are enumerated in the tool;
each entry has sourceSha256, servedSha256 and exact servedBody. Source bytes are
checked against the pinned git commit; served bytes are checked against their
captured hash. The ordinary driver retains actual CDP script observations under a
pinned compiler/server/harness identity and launch plan. Admission checks their
correspondence; the coordinator reviews the actual observations and independently
pins the terminal run. This schema does not manufacture execution provenance.

Version2 capture JSON distinguishes constructor64 from actual first-afterTurn63.
It contains64 `{turn, visit}` rows with detached before/after states,
ordinal, boolean alive/completed, ordered completed notifications and finite copy
timing. Call1 is on activation; call64 includes remaining0 and actual removal on
activation+63. The lifecycle retains all64 post-call counters63..0 and separately
records final absence. Old version1 and64/+64 timelines are rejected, with no dual
policy or reconstruction of a missing first call. No RNG or height input is
reconstructed from neighboring visits. Partial, replaced, late,
reordered, overflowing, corrupt or unbound evidence is rejected before emulation.

## Verification and remaining gates

Focused tests load accepted-main `3b899125cc8cedef938823718ad5d44f49957b66`'s actual
controller source from git and compare uninstrumented/disabled/enabled visits.
They also compare every World field after each turn in a labelled source fixture,
check call order/receiver/exception identity, detached ownership and copy/append
faults. Constructor tests compare original normalization/output and prove binding
before an immediate source-fixture step, without altering constructor exceptions
or World. Wrong/ambiguous creation, failed binding, late declarations, stale
afterTurn-only arming and terrain-touching observation are covered. The combined ordinary-driver fixture additionally compares every World field
after each of64 corrected-producer visits with capture disabled/enabled. Python admission tests use synthetic documents and never invoke native
code. These tests require that pinned git object to remain available.

The published capture and native replay retain their actual tested source head,
plans, terminal receipts and all input hashes. Setup failures remain failed
evidence. The alternating-order original/disabled/captured Node measurement is a
bounded controller microbenchmark; browser copy timers have limited resolution.
Neither provides a general FPS or native-render claim. Future runs need fresh
source/runtime/plan correspondence and their coordinated execution gates. Actual
audio cadence, downstream terrain/walk-mask/object/render consumers and UI restore
remain outside this result. No parity ledger is changed.
