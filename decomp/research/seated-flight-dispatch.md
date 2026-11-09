# Seated departure-wrapper dispatch

## Native evidence

This is static evidence, not execution or emulation of the original game.
`decomp/generated/004d32b0.c` is the indexed person dispatcher. Its first calls
prepare (`004d42a0`), reaction (`0051fed0`), airborne marking (`004e9050`) and
physics (`004e6d00`). Instructions `004d32de..004d32f8` then clear person flags2
bits `0x2000 | 0x80000` when vehicle field `+0x9f` is nonzero. The ordinary
state switch at `004d337f` still runs; state 10 calls `00432590`.

Physics returns immediately on flags2 `0x4000` (`004e6d00`), which live settled
seats publish in `vehicle-seats.ts`. Neither the dispatcher cleanup nor this
physics return clears flags4 `0x400`. Retaining that animation bit is intentional.
The cleanup does not cancel routes, commands, or vehicle membership.

The adjacent evidence folder records disassembly, hashes and tool version.
Command: `objdump -d -Mintel --start-address=0x4d32b0
--stop-address=0x4d33c0 <verified D3DPopTB.exe>`. Original EXE SHA-256 is
`3a5065c7420b3fcde208bf220bc86dfbac95e025ab2492caf9c7ea5308dfbe4f`.

## Actual browser failure

`references/fixtures/m10-seated-flight/` preserves an ordinary Mission 10 run
on clean main `97f65ac0374fdf2cdd013794d666363a6019c113`: public startup,
authored Boat boarding, first Totem earned at turn 550, second-island travel,
and shipped vehicle-panel handler unload. The last stage honestly failed its
all-ashore assertion. Natural retained-route reboarding is lawful, not itself a
bug. At turn 1066, Shaman 63 has `flight === native`, Boat 62, state 10,
flags2 `0x42025200`, flags4 `0x2d000500`, lift 1, and no active order.
Four further unmodified baseline ticks retain that wrapper indefinitely. The
world's flight early return starves subsequent vehicle/order dispatch. The
other party members and deadline are not reset or repaired.

The compressed checkpoint's uncompressed SHA-256 is
`eaeb004ddea177dbec826dfbde0527832f8509e317d1997970f56fc56c88d0a1`.
Included producer scripts and raw command receipts bind their source, inputs,
stdout/stderr and failure. They retain their historical paths and assertions;
they are archival evidence, not newly runnable acceptance scripts. This is a
historical browser checkpoint, not a native oracle or a freshly won mission.

## Runtime change

For an aliased native state-10 settled passenger only, retire the browser flight
wrapper and lift before dispatch; preserve the actual person, seat, flags4,
commands and route. Other states, nonseated transitions, separate owners and
unseated voluntary impulses keep the existing flight path. Run the existing
person physics/preparation once for ordered and no-order seated visits too.
This preserves clock/reaction updates even though seat physics itself is frozen.
Clear `0x82000` after physics, matching native ordering; preparation must first
see `0x2000` so interrupted motion resets are not lost. The previous boarding
preparation tail is removed because the full visit already includes it.

## Verification boundaries

`tests/seated-flight-dispatch.test.mjs` verifies the historical failure and public
new movement input, alias/route/order preservation, preparation-before-cleanup,
nonseated/separate-owner/state-30 exclusions, and synthetic store Save/Load twins.
Supplied Boat/Balloon controls are explicitly not ordinary acquisition evidence.
Existing panel, destruction, ground-recovery, cross-craft and command regressions
cover adjacent ownership paths. Final gate receipts and independent review are
required before merge. No native executable was run; no rendered UI or complete
Mission 10 victory is claimed by these tests.
