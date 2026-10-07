# Startup burst angle ownership correction

Base: `1c7e6b05687aca14d9350e17c7ae14dc6c68bb97`. Source-only checkpoint
`7f54a508` received independent ACCEPT before the retained failure-first run and
application edit. The correction changes the two angle variable owners in
`levelStartBurstParticle`; the three RNG calls stay in the same order. No original
code execution, browser run, package install or parity change has occurred yet.

## Original startup producer, not just a shared function name

The existing canonical exports show the actual path:

1. `00433a10` command18/state3 allocates class8/model1, writes its source position,
   and stores class7/model7 plus three argument words at `+7c..+84`.
2. `004baf00` performs the carrier's existing RNG/movement; arrival calls
   `004bb290`. That routine pushes the effect7 argument tuple and sets the
   one-shot allocation flag, then calls `004ed8a0(7,7,owner,destination)`.
3. `004ed8a0` consumes and clears that flag before model initialization. Class7
   goes through `004ed580` → `00509c10`; model7 calls `0050c690`. That routine
   consumes the effect7 arguments. Its ordinary new-stone path allocates
   class5/model12, then allocates class7/model9 at the returned stone. Its optional
   previous-stone path also allocates class7/model9 before retiring that stone.
4. Neither model9 allocation supplies a new argument tuple/flag. Thus model9
   enters `00509c10` → `0050bcd0` → `0050ccd0` with the default settings:
   32 child attempts, root height +90, speed60, lifetime1–2. The canonical static
   `0050c690` bytes are retained in `source-evidence.json`.
5. On successful child allocation, `0050bf60` supplies model3 initialization and
   one cosmetic RNG advancement. `0050ccd0` consumes three gameplay draws:
   lifetime, then the word stored at `+0x59`, then the word stored at `+0x57`.
   The final two stores are respectively `0050ce58` and `0050ce4c`; instruction
   order of the stores does not reverse the RNG draw order.
6. Real model3 state3 visits go through `0050bd70` → `004e7a80`. Its directed
   branch loads `+0x59` into the vertical/pitch calculation and `+0x57` into
   planar/yaw. The two small producer/consumer byte ranges are also retained.

The live route is `createWorld` → `initializeLevelStart` → ordinary `tick` →
`stepLevelStarts` → carrier arrival → `stoneBurst` → `createSpellTrail` plus
`levelStartBurstParticle`. The next ordinary effect visit invokes `stepSpellTrail`
→ `moveDirectedEffect`, which likewise reads `pitch` for vertical and `yaw` for
planar motion. The current helper assigns those draws oppositely. The old
`check-native-level-start.py` mislabeled both offsets and therefore masked the
composition defect. `check-native-spell-trails.py` already uses the correct names.

This trace establishes the startup producer's angle contract. A separate height
boundary remains: native model9 common initialization clamps the root to ground
before adding90; current `stoneBurst` adds90 before `createSpellTrail` clamps its
child. This change deliberately preserves that existing behavior. Native trajectory
comparisons below use the declared retained birth origins and flat ground256, not
the actual startup caller's birth height. No complete startup position/trajectory,
scheduler, allocator, terrain or rendering equality is claimed, and PR245's
returning-person prerequisite is not certified.

## Accepted raw records reused without a new invocation

The [accepted 11-call native component](https://github.com/JohnDeved/populous-new-dawn/tree/566723189bb2177596fce44bf6fc7598f2344601/references/verification/reincarnation-scheduled-burst-observer-2026-10-06/attempt-02)
retains all original birth bytes, direct-call records and later trajectories.
Its [independent result review](https://github.com/JohnDeved/populous-new-dawn/blob/5732cc32/references/verification/reincarnation-scheduled-burst-observer-2026-10-06/attempt-02/result-review.json)
accepts only the bounded supplied-context component.

`extract-retained-records.py` verifies the complete stdout SHA-256, then copies
only the 32 model3 birth records and their 139 actual scheduled visit records to
`tests/fixtures/startup-burst-native.json`. It never runs native code, computes
expected trajectories or changes prior evidence. The fixture records its immutable
source commit/path/hash. Re-running extraction verifies equality without replacing
an existing fixture. Its first record is handle836: yaw815/pitch326 at birth,
point4096/4096/346; first actual visit4123/4057/362, velocity27/16/-39. The current
helper instead emits yaw326/pitch815. All32 records differ in angle ownership.

The original seed at the first child is1389729278 and the final gameplay word
is1172462824. Birth initialization consumes96 gameplay and32 cosmetic advancements;
no phase5/person draw is introduced into the startup helper by this evidence reuse.

## Failure-first regression and acceptance plan

- Correct only the existing native probe's two offset labels before the app fix.
  Its five default-burst cases must fail against the unchanged helper, then pass
  after the reviewed correction. Native execution needs the coordinator's grant.
- The new portable regression compares all32 raw births and all139 directed
  motion/lifetime/retirement records. Expected fields are decoded from original
  bytes, never produced by the browser helper.
- The actual-caller regression starts Missions1–3 through `createWorld` and normal
  `tick`, observing RNG assignments while preserving their values. No entities,
  seeds, effects or startup phases are supplied. It requires three gameplay draws
  per actual stone particle, correct pitch/yaw ownership and the normal8/8/16
  stones. Existing startup tests retain phase/counter/checkpoint coverage.
- After independent source review and a retained failing run, apply the minimal
  helper correction. Run focused checks, ordinary public Mission/Skip startup
  frames before/after on the exact source, and standard code/quality gates through
  the shared lane. The old browser checker drives RAF/speed and is only a fixed
  step diagnostic, so it cannot serve as this ordinary-play proof.

Independent source review is retained in `source-review-review.md` with its
manifest and verification. On exact `7f54a508`, the CPU4 baseline ran
00:25:53.576–00:26:06.472 UTC and exited1: all14 existing startup tests passed;
all3 new regressions failed on the angle swap. The actual caller failed at Mission1
turn37/effect766 (pitch999/yaw1683 instead of pitch1683/yaw999). The unchanged
source/input fingerprints and raw output are retained in `failure-first-portable.json`.
The code correction follows that accepted proof and red result. Candidate portable,
browser, check/build and TypeScript quality validation remain pending.
