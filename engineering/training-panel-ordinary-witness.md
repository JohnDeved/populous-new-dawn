# Mission 2 automatic training panel witness

Refs #25 and the accepted PR #290 contract. This is prepared QA source, not a
passing ordinary episode. Product base is `cf5fc834` (tree `f345dc40`); the product
author must supply the reviewed automatic consumer before this can run.

## Reuse and finite outcome

`training-panel-auto.mjs` calls the existing `camp-inspection.mjs` driver. Its
startup, actual nine-Brave camp placement near (-99,-105), construction, crew
departure, deadlines and cleanup are reused from QA
`191c37ae497b0cb2093d1bee99469303cd8deba2`. The optional continuation branches only
after `campCompletion`; default manual-inspection behavior remains the original.
The unchanged legacy Hut scenario is included because the carried input contracts
import it. No application source or dependencies are copied from that QA tree.

The existing 300-second overall, 60-second startup and 180-second construction
bounds remain. Construction leaves a 60-second minimum reserve; the training
tail has up to 12 seconds for ordinary entry/first four held visits and up to
35 seconds after Load for conversion/exit/release, all clipped to the original
overall deadline. Preparation, camera, public menus and screenshots consume that
same remaining budget. These bounds are admission limits, not a promise about
software-renderer wall time. Preserve a failed receipt; do not retry automatically.

After construction, clear selection, expose Blast, inspect the public Save control
once while training is inactive, resume and prepare the actual camp point. Move to
Blast and await empty record/latch/DOM/reservation ownership. Ordinary unmodified
`Select brave` chooses one person (`chooseFollowers` uses single mode). One trusted
camp click gives that Brave shared order model8; immediately move to Blast.
Require the actual pointer-up snapshot's registered `entry.person` identity,
eight command slots, shared pool identity, model8 target and reference count1.

Capture the actual automatic callback synchronously before conversion. Require
new record -1/0/16, latch, exactly one reservation and no DOM yet. Observe four
real phase1 visits at remaining15 with pointer/control focus away. Save active
pre-conversion state using the public paused menu, await the exact typed committed
IDB hash, then Load immediately. Check same-Scene record survival on Save; old
Scene disposal; new empty record/latch/reservation ownership and retained Page T.
Require a new genuine callback, natural conversion, activity clearing, phase2,
record removal and reservation/DOM release. Retain active and released composites.

## Why one trainee is feasible

The construction cohort remains nine Braves. Training all nine adds several
batches without improving the ownership claim. At zero existing Warriors,
`nativeTrainingCost(0,3,2,1)` is3500. Eight idle Braves, one working Brave and the
Shaman generate floor((8×4+15+30)×320/256)=96 mana every four turns. The first
distribution pass gives the only training building48; retaining a costly spell
charging prevents reliance on the more favorable second pass. Actual composed
`generateFollowerMana` and `distributeMana` bodies reach3500 on turn292, or
24.333 seconds at12 turns/second, starting with zero available/stored mana.
This source test is not an ordinary game run. It does not bound walking, startup,
renderer throughput, interruptions or scene setup.

The live pre-order read records the actual roster, generated mana, tribe, cost,
storage and trained count. It requires at least nine living Braves, one Shaman,
zero Warriors, single cost3500 and idle generation at least82. Input requires one
actual selected Brave. Travel, changed roster or active-Save timing failure is an
unmet prerequisite, not permission to manufacture mana/activity or widen the run.

## Observer interface and evidence

The opt-in extension of `installHutTooltipLifecycle` requires:

- `scene.objectPanels.requestAutomaticTraining(id)`, invoked dynamically by the
  current World binding, and `automaticTrainingLatches: Set<number>`.
- Existing `buildingRecords` with automatic/phase/remaining/hold; existing
  building DOM map; `secondaryEffects.reservations` exact building-panel strings.
- Actual source building admission, training stats, mana state, `entry.person`,
  shared `buildingOrders` and registered `objectCells` person identity.

The callback wrapper forwards receiver, arguments, result and exception once and
copies pre/post state in its synchronous `finally`. It does not invoke callbacks,
ticks, rendering, clocks or commands. Existing scoped cleanup restores descriptors
and foreign-wrapper protection, including partial installation and original throws.
The construction snapshot deliberately continues to use builder.person/native;
the separate training snapshot reads entry.person/native.

`checkpointObservation` adds an opt-in typed training digest covering the target
camp, complete units, shared orders, mana tribes and stats. It does not normalize
these values. Reservation migration is excluded from that focused digest and is
checked separately; the complete typed checkpoint hash still verifies the exact
committed Save. Contracts reject changed activity, mana, queues and trained count.

Reports continue to use the existing `camp-inspection.json` filename and cleanup
artifact conventions. The scenario is passed to the existing local-render harness;
there is no new browser runner or observer framework.

## Verification and limits

Cheap CPU4 Node contracts cover existing construction/manual helpers, real
adoptLiveOrders transfer composed with the passive pointer observer, synchronous
callback detachment before later mutation, wrapper return/throw/restoration,
source-derived funding and typed checkpoint comparison. First combined run:
26 passed,1 import failure because carried Hut input tests required the unchanged
Hut scenario; the missing source was then carried from191c37ae. Second run:
39 passed,0 failed. This preserves the failed preparation attempt.

No browser, build, full tests, npm install, dependency transfer or native probe has
run in this QA worktree. Browser execution requires the coordinator's lane and
exact reviewed product source. Native timing, global physical pool allocation,
frontend sampling/input precedence, audio and hardware performance remain explicit
adaptations or unproved claims. This witness does not close all of #25.
