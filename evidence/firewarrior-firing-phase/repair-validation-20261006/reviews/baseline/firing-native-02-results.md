# Native-02 actual-output review

**ACCEPT the bounded producer/phase evidence; the comparison remains failed.**
Reviewed source `4656907be4bc2d97bff4cbf161963be1fe89ada4`, application/artwork
base `b0208188b8de345a6ad5e86cb7c49769624dda86`. No runtime, native or browser
execution occurred during this review. Ordinary acquired firing/pixels remain
unproved and are still required before the runtime/artwork correction.

## Provenance and comparable state

The raw native-02 receipt reports exit 1, 2026-10-06 07:37:01.892Z through
07:37:04.014Z. Its exact source/input identities match before/after and its retained
stdout digest matches the raw log. The direct Node child completed exit 0 and was
reaped by wait4; its recorded RSS is 145,788 KiB. Python RSS is 50,020 KiB.
There was no setup/write/instruction/resource guard failure.

All 16 normalized initial field records match native versus port. Native +0x72
maps explicitly to the port's p.stateObject tracked-projectile role; raw +0x87 and
port p.target remain available. There are 60 native calls / 18,104 instructions
and 54 actual-port visits. Each native per-visit file matches its aggregate record,
and every case stops at actual completion or its predeclared cap. Independent
before/after byte comparison found no source-record mutation outside the captured
FIELDS mapping, no target-record mutation, and no shared RNG/alert mismatch.

Native/frame-count/coordinate/allocation inputs and the four intercepted leaves
remain the predeclared synthetic boundary. Actual command21, row/object setters,
readiness, paired projectile initialization and cleanup executed. No acquisition,
world-animation update, cooldown progression, projectile lifetime or real building
geometry was supplied between visits. The building cases use command flags32
after a supplied substate11 target; they do not prove the ordinary flags0x22
selection/acquisition route.

Native and fixture bytes exactly equal native-01; port bytes equal the accepted
startup smoke. Their hashes are respectively:

- native.json: `977f01bd263bc7c49de959e8738c5538d7e14c637146b324a32dbfbf1fd0ba1a`
- supplied-fixtures.json: `9ad6cabf2ddd1dbc7305816b6b795a9c62ca606a83218c3857f90d2d3a39561d`
- port.stdout.json: `2f9242c59c4936f378aca17ad966ca19198cdae7c7fbf3165d8f28335397c021`

## Decisive controller findings

Both person/substate10 and building/substate11 give the same relevant results:

1. Entry from prior frames3 and4 executes real row15 → object94 → source56/draw13.
   After the setter, native explicitly writes f2=0/f1=1 and derives timer5, then
   decrements to4 on that same visit. Assignment is0x200. The actual port passes
   object15 → source48/draw14, keeps prior f2, leaves f1=0/assignment0, and ends
   entry at timer6. Descriptor13/14 data is identical; descriptor contents alone
   do not explain the distinct source and entry behavior.
2. Phase44 timer1 becomes40/timer0 with assignment0x210. On the next call native
   consumes pending0x10, reselects row15, resets f1/f2, sets hold flag2, initializes6
   and decrements to5. The port immediately installs timer6 at44→40, without the
   pending initialization, reset or hold. Both recovery-boundary fixtures complete
   in seven calls, so equal call counts there do not mean equal frame behavior.
3. Native phase45 entry initializes32 and immediately decrements to31; the actual
   port retains32 until its next call. Neither side launches in this cooldown case.
4. The full entry fixture with a permanently present projectile completes after
   11 native versus13 port controller calls. This is an isolated controller-visit
   difference, not elapsed game time or an FPS/animation-clock result.
5. The changed-target flag0x40000000 is consumed in the native ranged entry;
   the actual extracted port leaves it set. This matters to a phase repair because
   `prepareCombatOrderVisit` clears assignment0x200 while that entry flag remains.
   Restore this owned entry lifecycle alongside assignment, not just the object ID.

## Differences that must not become unsupported fixes

The 394 field/visit differences include repetitions, shifted phases and absent
visits. They are not 394 independent defects.

Orientation differs at the extracted body boundary, but the port records a real
Unit heading of pi/2 while p.angle/heading/turnAngle remain0 in the synthetic
fixture. Its preceding `beginCombatPursuit → faceTarget` ordinarily owns native
facing, and `stepLiveBuildingAttack` projects p.angle back to Unit.heading after
the body. This probe omits those surrounding calls. Do not infer that ordinary
Firewarriors visibly fire in the wrong direction from this record alone; inspect
the same live owner's ordinary entry before changing that ownership.

On completion the native body runs00518390/004d4da0, selects48/18, clears substate
and raises the changed flag. The port body returns to `stepLiveOrderQueue →
stepPersonOrders`, which anchors/removes/advances orders and may initialize the next
state; the wrapper subsequently adopts ownership and projects heading. These
outer consumers did not run in the port packet. Residual substate, phase, timer,
tracked-projectile, flags and standing-pose differences at return are therefore
not independently accepted as final live-state defects. Preserve their raw data
and prove the correct outer boundary before copying native residual fields.

The wait-entry-present fixture starts at native-owned phase40/assignment0x210/
timer0. Its six-versus-one-call result proves the missing pending-entry handler;
it is not an ordinary current-port state, whose own44 transition installs timer6.

## Exact next scope

First freeze and execute the separately reviewed ordinary Mission10 acquisition,
ground Move/rest, automatic command21/substate11 baseline route. Retain same-owner
flags, source/draw/f1/f2, real launch, mesh/VFRA/layers/pixels and recovery. Its
browser checker/closure remains a separate preparation gate; this native evidence
does not supply it.

Then make one bounded correction in the existing ranged controller plus an
append-only source56–63 import: use the existing row-aware setter, preserve the
proved changed-target/assignment entry lifecycle, reset f2/f1 only on native entry,
derive duration from the selected source/descriptor and decrement on entry,
restore phase40 pending reselection/reset/hold, and phase45 first decrement.
Trace completion through the actual queue/state owner and retain compatible
caller behavior rather than copying residual fields to make the synthetic report
green. Resolve facing only where that same owner trace shows a real gap.

Verify decoded original pixels/layer normalization, all eight directions/five
frames/tribe overlays and prior atlas-index/pixel preservation, then paired native
and ordinary before/after acceptance with relevant standard code/quality gates.
Do not weaken comparisons, replace expected outputs, broaden to vehicles/Preacher/
death branches or change a global animation clock. Source720 resting remains closed.
