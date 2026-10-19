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

## Live integration and compatibility

Both command-22 producers in `live-command.ts` capture the actual packed point:
the fallback boarding path and the shared player queue. Their new optional
`boardingOriginKnown` flag is browser provenance, not an original native field.
Shared preparation copies it, and allocation clears it before record reuse.
No current computer/worship/guard producer emits command 22.

Zero is a legitimate captured point. Old checkpoints are therefore not classified
by `b == 0`, nor is an original click reconstructed from the craft's current
position. Unmarked records keep their previous adapter behavior; newly marked
records, including origin zero, take the native limit. The existing full-world
structured-clone Save/Load and IndexedDB serialization preserve this optional
field. Migration does not add it. This is a deliberate compatibility boundary,
not native-equivalence credit for unknown historical origins.

## Verification and limits

Focused controls cover reachable distance 98 and exact cancellation at 100,
odd clicked coordinates versus current even-cell masking, byte and signed-short
seams, real origin zero, unknown legacy records, and pooled reuse. Distance 99
cannot be a sum of two integer squares, so no fictitious coordinate case is used.
The live control issues a real public M10 boarding command, supplies only a
craft displacement to another untouched ready shoreline, and checks completion,
owner identity, empty seats, unchanged health and exact public Save/Load replay.
A separate full-world control verifies equivalence to the existing missing-target
completion path, including physics, idle initialization and RNG.

The old grounded queue test's legacy checkpoint removes the new flag as well as
restoring its historical zero payload; all existing outcomes remain asserted.
No acquisition, ordinary sailed moving-target trajectory, rendered-input,
native steering/collision, full campaign or real-browser persistence claim is
made by these supplied-state tests. Mission 5's previously repaired boarding
route and the broader remaining transport acceptance remain separate.
