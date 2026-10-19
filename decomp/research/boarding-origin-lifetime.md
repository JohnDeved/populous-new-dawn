# Boarding command origin lifetime

## Native contract

The command-22 body at `00435160` rejects a craft that has left the original
clicked region before admission or route replanning. Static inspection used
D3DPopTB.exe SHA-256
`3a5065c7420b3fcde208bf220bc86dfbac95e025ab2492caf9c7ea5308dfbe4f`
and GNU objdump 2.44. The original executable was read as data, not executed or
emulated.

At `00435197–004351b3`, the current craft's x/y high bytes are independently
masked with `0xfe`. At `004351b7`, the body reads the original ten-byte command
record's word at offset 8 (`b`), without masking that clicked point. The call at
`004351c1` uses [00450590](../generated/00450590.c): shortest wrapped byte-axis
differences, squared and added **without halving**. `004351c9–004351cc` compares
the result against 100 and branches on greater-or-equal to `0043552b`.
That exit sets the completion result and clears person speed at `00435531`.
The normal command consumer then owns reference removal and state initialization;
the latter can assign a fresh idle speed, so terminal speed need not remain zero.

This is not `native-math.ts`'s `cellDistanceSquared`, which implements the
different `0049c720` halved metric. The bounded port reuses its existing
`cellDelta` primitive separately for the two unhalved axes.

Reproduction: `objdump -d -Mintel --start-address=0x435160
--stop-address=0x435550 d3dpoptb.exe`. The 59 executable bytes in
`[0x435197,0x4351d2)` have SHA-256
`38222528f0d05af572546e334a435269517dbdf3a9736c46a8e0e67e7820de78`;
the 22 bytes in `[0x43552b,0x435541)` have SHA-256
`1fc8b4438b92ffe468bb8d239c19f9602fa2ffa61a6c56cb10a961ec56c1749d`.
The checked-in 00450590 export has SHA-256
`4fb818c75935bb1d48527222cdc8b05984e22039b1191e46d18d656eb62554c4`.
Raw local disassembly and failed/passing receipts remain outside Git.

## Live integration

Both command-22 producers in `live-command.ts` capture the actual packed point:
the alternate live boarding path and the shared player queue. Both are required
for current live states; neither is an old-save compatibility path. Shared
preparation preserves the native payload. No current computer/worship/guard
producer emits command 22.

Every command-22 record uses its packed `b` origin directly, including the valid
origin zero. No browser provenance flag, zero sentinel, or inferred click is
needed. Current full-world Save/Load preserves the command and its native payload;
historical browser-checkpoint compatibility is not supported by this change.
Allocation still clears native command identity while retaining payload bytes.

## Verification and limits

Focused controls cover reachable distance 98 and exact cancellation at 100,
odd clicked coordinates versus current even-cell masking, byte and signed-short
seams, zero and nonzero origins without metadata, and pooled reuse. Distance 99
cannot be a sum of two integer squares, so no fictitious coordinate case is used.
The live control issues a real public M10 boarding command, supplies only a
craft displacement to another untouched ready shoreline, and checks completion,
owner identity, empty seats, unchanged health and exact public Save/Load replay.
A separate full-world control verifies equivalence to the existing missing-target
completion path, including physics, idle initialization and RNG.

The grounded queue test retains its ordinary boarding, current Save/Load replay,
lethal contrast, ownership, and reference-retirement assertions. Its obsolete
historical-checkpoint clone is removed rather than supported by a fallback.
No acquisition, ordinary sailed moving-target trajectory, rendered-input,
native steering/collision, full campaign or real-browser persistence claim is
made by these supplied-state tests. Mission 5's previously repaired boarding
route and the broader remaining transport acceptance remain separate.
