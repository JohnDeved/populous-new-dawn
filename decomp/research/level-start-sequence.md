# Original level-start sequence (issue #20)

Work in progress, October 3 2026. No overall parity or browser-completion claim.

## Original producer and trigger

`0042b230` calls `00419790`, then `00419810` and `00419880` for loaded tribes
unless load flag `0x200` is set (restoring a save). `00419810` snaps each Shaman's
reincarnation center to a 512-unit cell center. `00419880` queues command18 with
flags32. `00432590` dispatches that command to `00433a10`. `00432df0` sets the
person's flags4 bit128; ordinary state initialization clears it (`00432260`).
This is independent of the campaign's flyby camera/input commands. Bit128 is
selection-only: `004c2d80` and player target entry `004c24f0` both permit casting
while command18 is running. `004c1b80` enters state22 while retaining the order
queue, so a generic casting ban is unsupported and was removed during research.

`00433a10` skips site construction when tribe flag `0x10000` disables
reincarnation. The imported turn-zero campaign scripts therefore exclude Dakini
in Mission1 and Matak in Mission2; Mission3 includes both Blue and Chumara.
The live binding is restricted to these three researched missions.

## Command, terrain, conversion and stones

- State0 waits within120 native units of the requested center (the authored early
  mission shamans already occupy it). Mission1's optional player delay constant
  at `005aa5dc` is zero in the verified executable/balance inputs.
- State1 selects upper action `0x5d`, source520/draw14, clears its frame counters,
  and waits12 person visits. The actual four-tribe directional frames are appended
  through the original sprite importer; no placeholder pose.
- State2 samples `0044fcb0`/`0044eb40`'s wrapped10x10 height rectangle, adds10 and
  rounds via `004ba600` to the nearest64 (ties down, clamp64..1024). It allocates
  effect8 and sets its conversion flag with `0050c820`. Minimum wait is10 visits;
  state3 cannot start while that effect is alive.
- `0050c780` initializes effect8, assigns tribe busy flag1, rounds the height and
  starts sound158. `0050c840` visits `0049c7a0`'s original type2 search cells,
  preserving repeated endpoints. Radius starts160 and grows160/visit to2560;
  visual radius caps2048. Each included terrain vertex moves toward target by at
  most128 using `0044fde0`. Wildmen in those cells convert through `004d7fd0`,
  which allocates a new brave then deletes the Wildman, plus two model58 flashes
  and sound5. This replaces Mission2's previous instant ownership shortcut.
- The ring owns32 model60 orbits, one light on every fifth, moving by91 angle
  units per visit and emitting model61 sparkles. It ends after21 visits unless
  uncleared scenery keeps it alive. It is not the separate Flatten spell31.
- State3 emits eight class8/model1 carriers on alternate person-counter visits,
  in reverse order of the original `005a9f10` stone offsets. `004baf00` runs20
  substeps of70 units with two gameplay RNG draws per jitter trail. Arrival
  dispatches effect7 (`004bb290`/`0050c690`) which creates scenery12.
- `004a7d80` initializes each stone, immediately visiting `004a7eb0`: height is
  ground-256 plus16/visit for16 visits. Alternating stones play sound159. Model51
  dust uses source1160/draw37/palette4 for20 visits, beginning at f1=76. Effect9
  (`0050ccd0`) emits32 model3 sparks with original gameplay RNG and motion.
- Command completion releases the Shaman while the final stones finish rising.
  Camera and mission input remain with their separate authored script owners.

## Evidence and current boundaries

All exports target SHA256
`3a5065c7420b3fcde208bf220bc86dfbac95e025ab2492caf9c7ea5308dfbe4f` and were generated
with Ghidra12.1.3 from verified original sections. Names/types remain hypotheses.
No installer, Wine or full original game execution was used.

`scripts/check-native-level-start.py EXE` currently compares32 complete native
wave lifetimes (all terrain hashes, ordered orbit/trail geometry, notifications,
expiry),69 native height rectangle/rounding cases,40 complete carrier lifetimes
including RNG/trail positions, all eight stone rise/dust/sound timelines, all four replacement-conversion
allocation paths, permitted player/direct cast readiness, and all command18
phase/timer transitions for the
six authored Mission1–3 shamans. Allocation, registration, lighting, notifications
and lifecycle/animation leaves are explicitly supplied; this is not a full native
game simulation or browser proof. The phase probe supplies effect8's independently
compared21-visit lifetime; it does not independently prove cross-class scheduling.

Portable fresh/restart/skip/checkpoint, original-byte append preservation and
the listed native checks pass. Permitted casts at opening turns0/15/40 now enter the existing native state22,
retain command18 and return through its ordinary initializer, including checkpoint
continuation. Original orbit displacement is also compared and used for rendering.
Pending final acceptance: revised legacy fixture checks, real Mac before/during/after
frames on the exact integrated commit and fresh review. Existing world allocation,
terrain-notification batching, camera adapter and original-palette browser blend
limits are not upgraded to native whole-game equivalence by these helper checks.
