# Rejected adapter candidates

These findings prevent intercepted native callbacks from being mistaken for missing
live gameplay. They are negative results, not parity claims.

## Terrain changes do not invalidate active person routes

Hash-verified static inspection of `0x44f2f0` shows that terrain height
notification dirties objects in changed cells, rebuilds walk masks, and calls
`0x4951b0` to invalidate construction-resource/timber-search records at
`0x93a7a0`. It does not touch the motion-route pool at `0x955c29`, the failed-route
cache at `0x955bd9`, or person state.

Terrain-dirty bit 4 resets motion fields during later person preparation; it does
not release a route or enter state 33. Rerouting remains owned by the separately
raised blocked-motion bit `0x80000000`, and state 33 belongs to other order/recovery
routines. Therefore adding global active-route invalidation to the terrain callback
would invent browser policy. The live browser already mirrors the proved cell
dirtying and timber invalidation.

This conclusion used the hash-verified executable SHA-256
`3a5065c7420b3fcde208bf220bc86dfbac95e025ab2492caf9c7ea5308dfbe4f`
and existing reviewed exports. No new Ghidra export or native execution was needed.

## Building damage does not dispatch repairers

Static disassembly of `0x4092a0` shows a scan of computer-tribe people already
attacking the damaged building. `0x4f2430(person)` returns byte `person+0xaf`;
`0x40ba20(person, building)` checks a specific attack order/state/work-target
combination; and `0x4f2560(person, 1)` increments the matching per-tribe activity
counter. None of these routines selects an idle brave, allocates command 6, mutates
the person order, or dispatches building repair.

`scripts/check-native-building-damage.py` intercepts all three leaves. Its recorded
"reserve" event proves traversal and call order only; arbitrary callback booleans
supply eligibility. Repair delay and attacker routines execute, while allocation,
graphics, removal, UI, and audio consumers remain supplied. Automatic enemy repair
from this callback would therefore be an unsupported adapter policy.

The downstream consumer of the incremented activity counter remains the relevant
open research boundary. Do not reopen a repair feature until that consumer and an
actual native repair-order side effect are established.
