# Preacher sermon gestures: static reachability and artwork audit

## Finding and limits

**An ordinary on-foot Preacher's existing sermon controller has a reachable,
missing gesture producer and missing artwork.** Original `0043a4d0` can select
objects **98/99 → sources 176/184 → descriptor 14** during command 17's stationary
sermon loop. The port omits this branch entirely. Both source families are absent
from its Preacher metadata, including all **140 distinct VFRA frames** and
**48 of 75 distinct source pieces** used by the combined families.

This is a source/table/disassembly finding. It does **not** establish an actual
original-game gesture observation, a new browser gesture observation, frequency
in ordinary play, exact original wall-clock timing, or pixel equivalence. No
original instructions, Node, browser, server, dependency manager, importer or
Ghidra job ran. No gameplay, assets, parity, clock, issue or PR changed.

The [static reader](preacher-sermon-gestures/audit.py) and its
[retained result](preacher-sermon-gestures/result.json) bind all assertions to
canonical executable SHA-256
`3a5065c7420b3fcde208bf220bc86dfbac95e025ab2492caf9c7ea5308dfbe4f`, original ANI/HSPR
and palette hashes, indexed exports, and these exact source heads:

- Current main: `89e68606a406f93715b930550317519818ddc081`.
- Resting artwork: `b0208188b8de345a6ad5e86cb7c49769624dda86`.
- Accepted local firing compact source: `604506b19d79fdcaefa771f8e027ad206dfc2cc7`.

The sermon, live dispatcher, person setters/updater, logical clock, idle producer,
order adapter, selection owner and worship source files are byte-identical across
these heads. Preacher animation metadata is identical. Whole unit metadata is
not: the three heads contain 5,021/5,091/5,116 frames and 4,004/4,042/4,122 pieces.
The firing source also changes atlas placement in `scene-entities.ts` and
`sprite-layers.ts`; its native source/pose lookup and owner selection remain
unchanged. That difference is recorded, not erased by carrying a main result
across heads. All three independently have the stated gesture gap.

## Existing evidence reconciled

- Prior early-person audit at `efd5d172`,
  `decomp/research/early-people-artwork.md`, correctly recorded objects 98/99 as
  untraced and made no actual gesture-owner claim. Its b020 source comparison is
  reused; this audit adds the caller, branch, frame and visibility conditions.
- [Natural Blue Mission 3 preaching](mission3-natural-blue-preaching.md) already
  proves Vault → Temple → trained Preacher → ordinary ground command → authored
  enemy Brave listening → conversion/cancellation and checkpoint continuity.
  It expressly excludes whole-sermon timing and gestures. Its acquisition uses
  diagnostic fixed turns; only the resumed conversion uses real RAF. Its observed
  pixels belong to the converted Brave, not a captured Preacher gesture.
- [Mission 3 preaching message](mission3-preaching-message.md) and
  [person task](mission3-person-task.md) prove other natural listener/task entries,
  not this artwork. [Spell retaliation](preacher-spell-retaliation.md) proves
  assignment bit 64's downstream meaning and preserves the same limits.
- The `sermon poses preserve native multi-turn RNG timing` test covers the
  simulation-RNG turning branch (`animationMode` 0/1/2), not objects 98/99 and not
  the separate cosmetic RNG. Its title cannot establish gesture parity.
- [Logical-person visits](sprite-logical-visits.md) supersede the old assumption
  that every person gets two animation advances per simulation turn. The earlier
  animation/celebration oracle's two-step schedule is an explicit supplied test
  schedule. The [Stone Head note](stone-head-logical-visits.md) is a separate
  family. Worship command 27 (`0043bcc0`) has a related final-frame predicate,
  but owns sources/hold/delay separately; its compensation must not be copied
  into a sermon fix.
- Superseding movement orders and combat ownership are already represented by
  the natural cancellation checks and `tests/combat-orders.test.mjs`. Retaining
  a sermon queue during a fight does not make that detached sermon record the
  rendered owner. The Shaman Guard supersession change has no Preacher producer.

## Producer and caller chain

Native class-1/model-4 metadata has default state **10**, idle state **17**.
`004d6f90`'s model-4 idle-approach branch creates an order through `004deff0`:
allocate, choose **17** (or **31** with an adjacent occupied building), prepare,
clear/attach, reset motion and initialize the ordinary state. Allocation failure
returns without manufacturing a sermon. `004d32b0` state 10 calls `00432590`;
its command cases **17/31/32** call `0043a4d0`. Cancelled/current-override order
handling precedes that dispatch. State-33 query recognition is not proof that
state 33 runs the sermon body.

The current browser path is `initializeIdleApproach` → `initializePreacherOrder`
→ normal attached order → `world-turn.ts`'s 17/31/32 branch →
`stepLivePreaching` → `stepLiveOrderQueue` → `stepPreachingOrder`.
The order adapter aliases commands 31/32 to handler 17. Physics and route updates
run first; `stepLivePreaching` returns unless the resulting state is 10. The
ordinary Mission 3 route above supplies this live prerequisite without adding an
actor, forcing a timer or setting a gesture flag.

Within the original controller:

1. Substate 0 selects approach 1, or 5 for command 32; clears status bit 2 and sets
   range 3. Adjacent-building ownership changes the range to 5 and flags4 low bits
   to 2. This does not set render-hide bit 16.
2. Substate 1 checks arrival on even person-counter visits, checks the site and
   either sets substate 2/entry flag or searches/repaths. Substate 5 tests the
   current site. These feasibility/path leaves were not executed here.
3. Substate 2 entry stops movement, selects object **95**, sets **f1=1/f2=0** and
   timer `(descriptor.step+1) × frameCount(source160) = 2 × 4 = 8`; the same call
   decrements it. Expiry selects substate 3 and sets the entry flag.
4. Substate 3 requires `flags2 & 0x2004 == 0` and speed 0. Its entry selects **97**,
   clears status bit 1, sets **f1=1/f2=0**, timer 0, animationMode 0 and assignment
   bit 16. It then increments the signed-short timer.
5. Only a resulting timer **less than 840** enters either gesture or turning
   work. At 840 it changes to substate 4/entry flag. Substate 4 releases on a
   following active order, otherwise restarts substate 2.

Site eligibility `0043a310` does not demand an enemy listener. It first calls
`005178d0` (terrain/building/walkability collision). Return0 is acceptable; return1
has a building-model4 exception subject to `00518070`; other values reject. For
normal command17 approach (third argument0), it also rejects another active
class1/model4 sermon whose goal shares that coarse cell. Command32's current-site
check skips this duplicate scan. This supports a lone Preacher on valid clear
ground; it does not assert that an arbitrary clicked point is valid. The retained
disassembly covers this whole predicate, with indexed collision exports as context.

Substates 2/3 and the successful substate-5 site check scan listeners at their
common tail on even person-counter visits. `0043abf0` counts acquired/owned state-23
listeners and sets status bit 2 at counts **0–4**, clearing it above 4. The tail
sets assignment bit 64 if any listener remains, then faces the first listener
when status bit 2 is set. Command 32 additionally finishes on an even scan when
timer >32 and no listener remains. This can shorten its gesture opportunity;
ordinary idle command 17 has no no-listener early exit.

## Gesture, RNG and logical visit ownership

The byte-level gesture branch is `0043a801..0043a8e7`:

- When status bit 1 is clear and `(person.counter & 15) == 0`, advance cosmetic
  RNG **0089bc72** exactly once in the controller. The update is unsigned
  `ROR32(old * 0x24a1 + 0x24df, 13)`.
- Low bits 0 select **object99/source184**; low bits 1 select
  **object98/source176**; 2 or 3 select nothing. A success sets status bit 1 and
  explicitly **f1=1/f2=0** after the upper-body setter.
- A successful gesture requests sound **51** for the player tribe or **189** for
  another tribe only if assignment bit 64 was already set. That test precedes
  the current call's acquisition scan. It does not gate the gesture itself.
- While status bit 1 is set, there is no gesture decision draw. Completion polls
  `f1 == 0 && f2 >= frameCount(current source)-1`, clears bit 1 and selects
  **97/source168**. It does not re-run the random decision on that call.

Status bit 2 gates the following **turning** branch, not the gesture branch.
Thus an on-foot idle Preacher with zero listeners is sufficient for the visual
producer; five listeners, a conversion outcome or a forced enemy are unnecessary.
The generic preparation status-byte countdown is gated by model flag 64, which
model 4 lacks; it does not erase this Preacher's gesture bits.

The separate simulation RNG **0089d178** is advanced when turning mode 0 sees
counter modulo16 zero, or when mode 2 chooses a new angle on the following visit.
Mode 1 initializes a 40-visit counter and rotates at modulo8. These draws are
not substitutes for the omitted cosmetic draw. Victim acquisition/conversion
can independently consume simulation RNG through its own consumers.
`0048a050` may consume additional cosmetic RNG after sound/environment/allocation
checks, for sample choice and pitch. A probe that intercepts audio must explicitly
limit its RNG claim to the controller boundary; the sound request is not a
promise of one universal additional draw or of an audible result.

Original `004ec6f0` advances the live person byte counter before class processing;
`004ed700` stamps the record afterward. Original ordinary person flags3
`0x40000` gates descriptor-mode-2 animation visits in `004ee7b0`. The accepted
browser adapter advances the currently owned source once after each logical turn,
with separate presentation visits ignored for this gated source. Direct `tick`
is simulation-only and therefore unsuitable for proving gesture completion.

Descriptor14 is mode2/step0/hold0. Given uninterrupted normal setter ownership
and one eligible updater after each controller, entry f1=1 first decrements to0;
subsequent visits advance f2. The 10-frame/18-frame gestures reach their final
frame after 10/18 animation visits including the birth visit, and return at the
next controller poll. This is a derived visit sequence, not measured original
wall time. The return setter retains f2 unless it exceeds source168's base count6;
both final gesture frames exceed it and clamp to0. It does not explicitly stamp
f1=1 on return. Do not add worship's legacy hold or infer a global FPS change.

Two other pre-existing controller differences prevent a whole-sermon equivalence
claim: the port falls from close substate1 into substate2 in the same call, while
the original switch changes state for the next visit; and the port performs its
turning branch before its timer>=840 check, while the original gates both branches
first. A supplied terminal state with timer839, counter divisible by16, mode0,
status bit2 clear and no interruption can therefore draw simulation RNG only in
the port. Command32's port no-listener completion is also outside its even-scan
conditional. These are boundaries to retain in a future comparison, not repairs
made by this audit.

## Artwork and renderer route

| Controller object | Source family | Draw | Base frames | Distinct VFRA | Imported |
| --- | --- | --- | --- | --- | --- |
| 95 entry | 160–167 | 19, step1 | 4 | 20 | yes |
| 97 loop | 168–175 | 14, step0 | 6 | 26 | yes |
| 98 gesture | 176–183 | 14, step0 | 10 | 50 | no |
| 99 gesture | 184–191 | 14, step0 | 18 | 90 | no |

Objects 98/99 are direct IDs, not row indices. The object table entries at
`005a69e0/005a69e4` are `b0 00 0e 00` / `b8 00 0e 00`. Descriptor14 at `005a6b92`
is `0a 00 00 00 02 00 00 f0 00 00 00`: type10/person0/variant0/palette240.
Original `0046ec80` dispatches type10 to render primitive13. `004673b0` then uses
the actual person record's source/f2 plus direction
`((cameraHeading-personAngle-0x380)&0x700)>>8`. Only Shaman owners receive a tribe
source offset. Preacher tribe selection is in the layers, not a new source family.

Directions5/6/7 mirror 3/2/1. Both gesture families have equal frame counts across
all directions. Existing loop sources169/175 have two frames while the base168
has six; the static loaded-table/chain and source-counter distinction is retained
without extending this task into a source168 renderer-parity claim.

The retained JSON lists every direction's exact VFRA sequence and missing piece
IDs. All gesture frames have nonempty selected layers with nonzero dimensions
for each of the four tribes under descriptor14's ordinary settings. This proves
a plausible renderable source, not nontransparent pixel coverage: the audit did
not decode pixels, import a texture or execute the scene.

Native and browser conditions that can hide, replace or interrupt this owner:

- `004d4040` can substitute vehicle row24, or state33's special row7 hold. Ordinary
  on-foot/state10/vehicle0 avoids both. Invisibility/selection/session flags can
  set render-hide or blending bits; native `0046ec80` skips renderFlags bit16.
- The native world renderer's flags4 `0x400000` override selects source96/frame0.
  `004d42a0` clears it at preparation, but a witness must record the actual flag
  after downstream work. Disguise can change apparent tribe/descriptor handling.
- Browser `unitAnimationSource` gives flight and qualifying fight records priority.
  Its ordinary native command17/31/32 owner then beats entry/builder/fallback
  artwork. Combat can supersede an otherwise retained sermon queue. New orders
  release listeners; state changes, terrain, movement and death can stop the loop.
- Browser mesh visibility rejects native vehicle ownership and hidden interior or
  enemy-invisibility states. Frustum, terrain occlusion and screen clipping can
  prevent visible pixels even when the right source exists.
- `updateUnitsFrame` finds directions by the owned native source; otherwise it
  chooses the named pose/idle fallback. Current code never produces176/184, so it
  normally stays on168. Adding only the producer would fall back to generic
  selected/idle/etc. artwork and wall-age frames. Adding only assets would never
  select them. Both boundaries need a future narrowly scoped change.

## Smallest next comparison and ordinary witness

No execution grant is consumed or implied by this proposal.

1. A bounded native composition should run actual `0043a4d0`, `004d4040`,
   `004ee700`, and stamped `004ee7b0`, with original loaded frame counts. Start
   from an explicitly supplied on-foot class1/model4/state10 command17 record.
   Compare one entry→loop sequence and two decision→gesture→return sequences
   (at most20 controller/updater visits each). Cosmetic seeds0/3 exercise
   objects98/99; seeds1/2 exercise no-gesture residues2/3. Those are supplied
   arithmetic cases, not natural gameplay state.
2. Add single-call boundary cells: counter15 versus16; status bit1 active with
   last/nonlast frame and f1=0/1; status bit2 clear/set; speed and flags2 0x2004;
   timer838/839; listener-bit sound request player/opponent; command32 no-listener
   expiry even/odd. Record both RNGs before/after, all phase/flags/owner fields,
   setter/audio/acquisition requests, and pre/post animation. Acquisition/site/
   movement/audio may be named supplied consumers for the first comparison;
   claim no actual-play reachability from these snapshots. Preserve the native
   timer-first behavior and publish any unrelated port divergence explicitly.
3. For the ordinary visible owner, start fresh Mission3 through the public
   selector, complete the opening and acquire the Temple/Blue Preacher using
   shipped controls. Keep the trained Preacher at a safe on-foot Blue-base ground
   point so its normal idle command17 sermons without listeners. Focus its real
   mesh and observe a full loop (840 active-loop visits, plus approach/entry),
   never setting RNG, poses, actors, timers or owner flags. Record counter16
   opportunities and both RNG streams even when no gesture occurs. No-listener
   ownership isolates the main gesture from conversion, fight and audio traffic.
4. The current-source baseline must show its actual missing producer/owned168;
   a future candidate should capture98/99 births, all native f1/f2 transitions,
   176/184 direction/VFRA/layer/atlas selections, return168, owner continuity and
   positive isolated mesh pixels. If a finite ordinary observation does not
   obtain both kinds, report that limit; supplied seeds cannot replace it.
   Save/reload one naturally occurring active gesture to check persisted phase
   and cosmetic RNG, and give a normal movement command to prove supersession.
   Separately retain the established listener route to exercise sound requests
   and conversion continuity. Use the accepted logical adapter; do not widen to
   an FPS/clock rewrite or claim a hardware measurement.

## Reproduction and validation

```sh
PYTHONDONTWRITEBYTECODE=1 ../prerequisites/venv/bin/python \
  decomp/research/preacher-sermon-gestures/audit.py ../prerequisites/game \
  > decomp/research/preacher-sermon-gestures/result.json
```

The audit fails on source/input/export drift, table mismatch, lost covered entry/
loop chains, changed gesture omissions or empty ordinary selected layer dimensions.
Its disassembly ends at instruction boundaries and records the sermon jump table
as data. Focused Python-AST, JSON/path and diff-whitespace checks apply to these
research-only additions. Full check/build, native/browser execution, pixel decode,
performance, fixture recording and gameplay parity are **not run/not claimed**.
The Node-based check planner is not run under this read-only/static grant; the
changed paths are explicitly classified as research-only.
Local commits/bundles are **unpushed and not reset-durable** until an authorized
Git publication route is restored; they are preservation artifacts, not GitHub
acceptance or completion evidence.
