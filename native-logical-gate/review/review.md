# Independent review: #214 logical-visit animation gate

Decision: **ACCEPT** the bounded research packet as sufficient to start a candidate
repair for existing native-backed person records and Splash. This is not acceptance
of an implementation, a complete native person lifecycle, a wall-clock rate, or
closure of every sprite family reported in #214. No runtime implementation was
present or reviewed.

Reviewed source: `a53fa05587c4c1d363e3596162b41fcb9f26e3e8`, initially and finally
clean. Packet `work/orchestration/sprite-stamp-gate-214/findings.md` SHA256
`f52bb1fb1ff94f30010565555ff8878e60b3e3607ae4b79e3dfa583fb82c77f6`.
Original executable SHA256
`3a5065c7420b3fcde208bf220bc86dfbac95e025ab2492caf9c7ea5308dfbe4f`.
Exact fingerprints, commands, source reads, retained byte excerpts, and check
statuses are in `receipt.json` beside this review.

## Evidence accepted

- Verified all eight packet byte-excerpt hashes, probe hash, result hash and the
  current source hashes. One independent CPU4 replay, capped at 60 seconds, exited
  0 in 1.927609877 seconds. It reproduced all 18 person-prefix cases, 12 native
  setter/dispatcher/animation timelines, and four effect cases. Its JSON is exactly
  equal to the original result after excluding only the elapsed-seconds field.
- `004d23ed` genuinely ORs `0x40100` into person flags3 before the model switch.
  The 18 runs prove that prefix for models 2–7 and the supplied Shield/Bloodlust
  initial flags, without intercepting a callee within the executed prefix.
- The original `004d4040` setters and `004ee7b0` animation bodies execute. The
  comparisons establish that matching-stamp eligibility, or absence of bit
  `0x40000`, controls modes 1/2 and the ordinary mode-4 branch. The port agrees
  when supplied those inputs. Mode 3 and the mode-4 transition branch have their
  own behavior; the gate must not be placed around the entire updater.
- `004ed700` calls the supplied class processor first and writes the current
  outer counter at +0x18 afterward. Static `004ec6f0` corroborates the real caller:
  primary-list records with nonzero state and all secondary-list records receive
  their logical visits; the pause branch does not dispatch them. The native
  processor stamp is not a visibility decision.
- Static `004a4450` increments the outer counter before `draw_main`; `004a4960`
  runs `main_loop_outer` before drawing and `004ee770`. The latter visits both
  animation allocation lists and honors land pause. These establish ordering,
  not an original OS frequency measurement.
- The real browser constructor has neither person gate bit nor a logical stamp
  owner, and `animateLiveObjects` supplies counter 0. Adding only the bit leaves
  zero equal to zero and does not fix extra visits. This is a concrete integration
  defect, independent of the earlier visual recording's missing flag fields.
- Splash's original initializer supplies `0x40400`; the browser already supplies
  that flag, so its missing stamp ownership is particularly direct. Sampled full
  hut smoke, partial hut smoke, and damage smoke start with the gate absent and
  advance on extra draws. They were initialized from zero flags: this is evidence
  of absence in these samples, **not evidence that the routines clear the bit**.

## Lifecycle limits and additional inspection

The person prefix stops at `004d23f4`; it does not execute model-specific creation.
The timelines then manually choose idle/walk objects and replace the entire
`004d32b0` processor. They prove neither that real idle/walk controllers choose
those rows under every scenario nor that all later states preserve the bit.
The effect initializers supply state/audio/height leaves, and their timelines
replace the class-7 processor. They likewise do not prove complete lifetime or
removal ordering.

I inspected and retained the remainder of `004d23d0` and common `004d5920` as
original byte disassembly. The ordinary-model branches call the common initializer;
there is no direct flags3 reset in those bodies. The common initializer still
calls positioning, physics and state initialization, so this is corroboration,
not exhaustive proof of all indirect writes. Existing `004d2740` state-init and
`004d32b0` processor exports have local flags3 masks that preserve `0x40000`.
The apparent `0xfffbffff` mask in `004d2740` targets +0x10 (flags4), not +0x14.
The analogous browser health, state, physics, Shield/Bloodlust and tribe masks
inspected preserve the gate if supplied. Indirect/alias writes remain outside
an exhaustive audit.

`004ed8a0` clears reused allocation records, including flags3, and seeds +0x18
from the outer counter before initialization. `004ed580` applies type initialization,
then adds flags and stamps again. Thus allocation and logical processing both
produce eligibility; merely noticing that a World turn changed is incomplete.
The browser effect loop explicitly delays a newly inserted effect's first processor
visit until the following turn, making allocation-versus-processing ordering a
required regression case.

The real browser animation source is selected from flight, encounter/fight motion,
native, entry, and builder records. The main person loop has multiple owners and
early returns; `stepLivePerson` alone does not own them all. Record creation,
replacement, borrowing and shared references can occur during combat, spells,
building entry/training, transport, and start/respawn paths. Checkpoints clone
existing records; changing only `createLivePerson` does not repair restored records.

## Authorized implementation boundary and merge prerequisites

1. Implement logical-visit eligibility for the existing native-backed person and
   Splash paths, retaining original flags and per-mode animation behavior. Do not
   replace the global 24-Hz presentation interval, add the gate to all effects,
   or imply every ordinary sprite now has a native owner.
2. Bind eligibility to actual allocation/processor ownership with explicit ordering
   relative to animation, including skipped/dead/removed records and transitions
   between source owners. Preserve object identity and avoid double advances for
   aliases. Do not add only `stamp = world.turn` and pass that same turn unchanged
   to every animation visit: it permits repeated extra draws during that turn.
3. Define and test initialization and restoration: records created before, within,
   and after an object pass; the first rendered sample; new Splash effects whose
   logical lifetime starts next turn; checkpoint restart at an animation boundary;
   migration of old person flags/stamps without replaying gameplay or inventing
   an unknown historical phase. Keep Shield and Bloodlust bits intact.
4. Maintain chronological controller/frame reads. In `advanceGame`, simulation
   runs before animation on a coincident boundary, and speed scales simulation
   while the existing presentation interval is fixed. At fast speed, several
   logical visits can occur within that interval. A lone latest-stamp boolean
   loses those visits; batch replay of final state can also miss intermediate
   controller transitions. Choose and document a bounded elapsed-game-time policy
   that preserves modern refresh independence and exposes expected frames to the
   controller, instead of claiming original low-render-rate coalescing as an
   authored target.
5. Revisit the command-27 final-frame hold together with its live controller. It is
   an explicit workaround for the present 12-Hz polling/24-Hz animation mismatch.
   Neither automatic retention nor blind removal is justified. Test an actual
   controller action through completion and ensure no stall, skipped action, or
   repeated final-frame effect.
6. Before acceptance, require source-bound native comparison covering the changed
   ownership and relevant real initialization/controller branch; ordinary shipped
   gameplay capture with raw flags/stamps and frame sequence; pause/land-pause,
   speed 0 and supported slow/fast speeds, 30/60/120/144-Hz and irregular/catch-up
   schedules; allocation/removal/restore boundaries; command-27 completion;
   ungated smoke/UI and unaffected effect controls. Preserve native wall-clock
   and headless-versus-hardware limitations. Run standard check/build and affected
   TypeScript quality checks on the implementation candidate, then fresh review.

Additional families need their own producer/lifecycle proof before inclusion:
ordinary fallback sprites in `scene-entities.ts` use elapsed world time and are
not the native-frame source tested here; Stone Head class5/model9 is a concrete
`004a5ef0` lead but is not dynamically proved by this packet; other effects,
Wildmen/Angel models, and unexecuted state/morph branches are not covered by the
sampled timelines. A complete original creation-and-processing run remains useful
to strengthen the person lifecycle claim; absence of that run does not negate the
bounded producer and dispatcher defect established here.

## Review checks and resources

Read AGENTS.md, GOAL.md, engineering/README.md, native-research.md and the repository
engineering skill. Native replay, packet/source hashes and clean-tree checks passed.
No maintained TypeScript changed, so formatting/lint/quality change review is
not applicable. Full check/build, browser and hardware performance were not run
and are not asserted. No dependency installs/copies, Ghidra export, OS launch of
the original, tracked-source edits or shared heavy jobs occurred. Only ignored
review artifacts were written. No resources remain held.
