# Airborne resting dispatch and ordinary Blast handoff

## Scope and evidence

Base `ca7e4922cc5187c40add23dd2e1447f4f0bae736`. Original
D3DPopTB.exe SHA-256
`3a5065c7420b3fcde208bf220bc86dfbac95e025ab2492caf9c7ea5308dfbe4f`.
GNU objdump 2.44, static disassembly only. No original code executed or emulated.
Commands: `objdump -d -Mintel --start-address=0x4d32b0 --stop-address=0x4d3780 EXE`
and `objdump -d -Mintel --start-address=0x50b740 --stop-address=0x50bd00 EXE`.
The dispatcher tail/table is retained with
`objdump -d -Mintel --start-address=0x4d3ce7 --stop-address=0x4d3d68 EXE`.
Raw output is under `airborne-rest-evidence/`; existing indexed pseudocode is
`decomp/generated/004d32b0.c`, `004d73e0.c`, and `0050b740.c`.

This is independent of the Mission 19 signed-life anomaly. The earlier isolated
rest-dispatch diagnostic still reproduced the wrap. It does not justify an
anti-overflow policy, actor repair, or advancing canonical turn 32099. The
[qualified campaign report](https://github.com/JohnDeved/populous-new-dawn/issues/8#issuecomment-6181376149)
remains in force. Existing signed-word damage expectations are unchanged.

## Ordinary Blast prerequisite

The public path is cast → projectile impact → stepLiveBlastWave → native force
and damage → live flight publication. Native `0050b740` ordinarily sets impulse
and airborne flags, velocity and animation and applies damage without releasing
the current rest state or ring assignment. Its conditional panic path does change
to state 26 (`0050b8ff`..`0050b91d`).

The browser's post-wave `release` previously called `cancelLiveResting`, changing
an ordinary resting person from 19 to 10 before publishing that same person as
flight owner. Consequently a normal move → rest → public Blast could not reach
the missing airborne rest controller.

Preserve resting only when the wave's current owner is exactly `u.native` and its
current state is 1, 17 or 19. Skip only resting cancellation. Incompatible browser
task/path/order cleanup remains in place, as do nonrest and panic cleanup.
This is not a general Blast queue-preservation or owner-reconstruction change.

## Dispatcher repair

Native `004d32b0` calls physics `004e6d00` at `004d32d6`, then reads the current
state once at `004d336e`. Jump-table entries dispatch state 1's timer, state 17's
approach, and state 19 through `004d36f1` to `004d73e0`. Interruption bits 0x2004
remain available to the selected controller until the dispatcher tail.

The browser `stepLivePhysics` previously omitted these controllers. Extract the
existing grounded controller body without its preparation, reaction, or motion
wrapper; invoke it once on the actual flight person after physics and before
clearing interruptions. Grounded execution still invokes the same body exactly
once. State transitions pass the explicit person rather than assuming `u.native`.
Resting can drop timber, so flight publication also updates browser cargo.

Capture resting eligibility immediately after physics. A controller changing state
must not cause a second controller to run in the same visit. Publish the physics
context's RNG before the resting controller, with no later stale-context write.
With today's model default-state table, no supported branch was found that both
creates a physics initializer context and then selects a resting state in that
same visit. This ordering is source-reviewed protection, not claimed executed
branch coverage. Likewise, an existing fight/recovery/panic controller→rest path
was not demonstrated. Tests cover actual 17→19 and 19→1 no-second-visit boundaries
and resting RNG consumption without fabricating model-table mutations.

## Acceptance boundaries

Supplied state/terrain controls are labeled as such. Public movement and Blast
controls use supplied actors/flat terrain, real command completion, real spell
launch and natural physics. Save/Load tests use the synthetic IndexedDB helper;
they are not rendered-browser or original-executable traces. The existing landing
adapter's unqueued owner policy is observed rather than broadened here. No whole
mission, health-wrap resolution, mixed-object scheduler parity, or hardware/render
performance claim follows from these tests.
