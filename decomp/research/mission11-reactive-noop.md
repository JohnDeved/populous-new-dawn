# Mission 11 requested-zero reactive branch

Mission 11 Matak words `899..<944` do not produce a playable attack. They are
an `EVERY 2047 OFFSET 63` block gated by variable 5 equal to zero. For tribe 3,
the first eligible turn is 1982 and the block repeats every 2048 turns. Opcode
1068 counts Blue people within radius 1 of marker 17; the body requires more
than two.

The passing body grants Matak one Swamp stock with `1115(1194,1121)`, executes
opcode 1059 as
`[1118,0,1070,17,2,11,-1,-1,1078,0,18,17,-1]`, and unconditionally sets
variable 5 to 1. Native allocation creates a type-20 task with requested count
zero, damage goal 2, marker 17, and route/origin `0x765c` (cell 92,118). It
snapshots spell model 11, retreat 20, and away quotas `[0,34,34,0,34,0]`.

Requested zero means exactly zero attackers, not all available people or a
Shaman-only force. Even with abundant eligible Warriors, Preachers, and
Firewarriors, native type-20 dispatch follows `phase 0 -> 3 -> 23 -> inactive`,
selects nobody, and never reaches staging, routing, combat, or spell casting.
Allocation and retirement leave RNG unchanged.

If all ten task slots are occupied, allocation fails, but the preceding Swamp
grant and following variable-5 latch still occur. The branch therefore remains
one-shot. A failed census leaves variable 5 at zero and permits the next
recurrence.

The executable, `levl2011.hdr`, and `cpscr022.dat` are hash-verified by
`scripts/check-native-mission11-reactive-noop.py`. The probe executes the native
interpreter, allocator, and type-20 controller while supplying the marker table
and synthetic eligible people. No Ghidra export was required.

This evidence closes the candidate as a non-feature: implementing a real raid
from this branch would diverge from the original. Later Mission 11 attack blocks
remain unexamined and may still contain playable raids. No parity status changed.
