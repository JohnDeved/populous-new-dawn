# Airborne resting dispatch and ordinary Blast handoff

## Scope and evidence

Base `ca7e4922cc5187c40add23dd2e1447f4f0bae736`. Original
D3DPopTB.exe SHA-256
`3a5065c7420b3fcde208bf220bc86dfbac95e025ab2492caf9c7ea5308dfbe4f`.
GNU objdump 2.44, static disassembly only. No original code executed or emulated.
Commands: `objdump -d -Mintel --start-address=0x4d32b0 --stop-address=0x4d3780 EXE`
and `objdump -d -Mintel --start-address=0x50b740 --stop-address=0x50bd00 EXE`.
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

## Validation boundary

The launch-only regression covers ordinary movement → rest → public Blast and
explicitly supplied states 1/17/19, ordinary state 10, and panic state 26. It
asserts same-owner retention, unchanged rest slot, and browser task cleanup.
The post-physics airborne resting controller is a separate prerequisite consumer
repair; this handoff change alone does not claim that controller is visited.
