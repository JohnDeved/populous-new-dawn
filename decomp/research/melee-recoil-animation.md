# Native recoil entry and push handoff

Related to #214. This extends the bounded [attack animation owner](melee-attack-animation.md),
not the shared presentation frequency or an absolute original-game FPS claim.

## Ordinary live defect

On base `5282c4c57bdfd128741373be25f1b1faa8a66865`, the maintained Mission 2
startup adapter, ordinary Shaman selection and attack command on authored Warrior
13 reach Shaman 54's processed recoil at turn 323. No unit, HP, position, RNG or
AI mutation is needed to acquire it. The fight person's sprite still has source
424/draw 14/f1 0/f2 4, while the render source is null: recoil uses elapsed-time
fallback art rather than initializing its original row. Warrior 19 exhibits the
same missing entry later, retaining source 48 rather than recoil source 112.

The live route is `command` -> fixed `advanceGame` turn -> `processBattles` recoil
entry -> `animateLiveObjects('logical')` -> `unitRenderAnimationSource` -> the
actual Scene unit-render caller. This observation and the Scene fixture execute
TypeScript on the CPU. They are not original executable or browser/GPU evidence.

## Retained source contract

The existing hash-indexed Ghidra exports are reused, not regenerated. Their
provenance is `decomp/exports.json`: executable SHA-256
`3a5065c7420b3fcde208bf220bc86dfbac95e025ab2492caf9c7ea5308dfbe4f`, Ghidra 12.1.3.
Relevant export bytes were checked against that index:

- `00518fb0.c`, cases 5/6: on the entry flag only, call the upper-body setter with
  `unit_type_to_obj_indexes_map[model + 0x51]` (row 9), then f2=0 and f1=1. Unlike
  attacks through `004d3ff0`, this direct setter does not substitute airborne rows.
  Case 5 keeps its four-turn countdown; case 6 keeps seven turns for Shaman, or
  `(descriptor.step + 1) * frameCount` otherwise. The countdown decrements on the
  entry visit, independently of the following animation update.
- `004ee700.c`/`004d4040.c`: the existing sprite setter resolves the original object
  and descriptor. `004ee7b0.c` mode 2 decrements a nonzero f1; otherwise it reloads
  the descriptor step, increments f2 and wraps at frame count. Thus entry f1=1
  holds frame zero, and Firewarrior descriptor 18/step 1 holds each frame for two
  eligible visits. These are descriptor values, not a guessed fallback FPS.
- `004ed700.c` and the already accepted ordinary-person logical gate stamp the
  controller visit. The live clock runs that controller before its one logical
  animation visit, not on every presentation refresh.
- `00518fb0.c`, case 7: push entry changes flags, countdown and velocity, but does
  not reselect the sprite or reset either frame counter. When its countdown
  reaches zero, it selects the existing movement row 1/5. Reconstructing a recoil
  frame from elapsed browser time at this handoff discards the retained phase.
  Subsequent shared physics may legitimately replace the art: `004e9160.c` clears
  airborne flags and calls `004d3ea0.c` for flag4 `0x2000` settlement. Grounded
  state 25 selects row 0 without resetting the retained counters. Those exports
  also match the existing hash index; a full-turn test must preserve this writer.

## Bounded implementation and evidence

Only a processed recoil entry initializes row 9 and sets
`Fight.nativeRecoilAnimation`. The visual source then retains that person through
recoil and the push/approach boundary. The existing gameplay source function is
unchanged; flight still wins. Push preserves both initialized counters, while its
pre-existing adapter for an unowned pose is unchanged. Current checkpoints retain
the marker and phase. No historical-save inference or migration is added.

`tests/melee-recoil-animation.test.mjs` covers ordinary acquisition and entry order,
all six classes with both countdown branches, direct-row airborne flags, no entry
replay, push alias de-duplication, interruption/death, current checkpoint twins,
pause and 30/60/120/144 Hz plus irregular schedules. Its actual Scene caller checks
read-only state and Shaman frames `0,1,2,3,4,0`, rather than clamping the five-frame
source during the seven-turn recoil. Controlled class fixtures and the existing
TypeScript animation helper are explicitly not native-execution evidence.

The corrected initial six-test set failed five assertions on the unchanged base
and passed on the repair; three further boundary tests were then added. Source-bound
raw checks and the baseline failure are retained with the implementation handoff.
Attack choice, damage, duration, RNG and push physics are not edited. Broader
gameplay parity still requires the standard gates and independent review.

No original executable was run, no local browser was launched, and no fixture,
golden, imported art, native export or existing melee browser witness was changed.
Full check/build and actual rendered browser acceptance remain separate gates.
Other fallback animation families and absolute original wall-clock calibration
remain open under #214.
