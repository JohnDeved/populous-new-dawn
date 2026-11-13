# Patrol binding constructor constraints (#1003)

Source-only continuation of 2474f352, 2026-11-13. No implementation or tests.

Retained original disassembly `decomp/research/native-tribe-controls/00489300-00489470.asm`, blob `4db3acbd716ab5c3b3d48fe5e0972fdf1c217071`, establishes:

- Constructor00489300 receives the default-record pointer as an argument, advances by12 bytes and terminates when the next record's byte0 is zero (004893f8–004893fe). This proves traversal shape, not the actual caller-supplied table base or BD/BE record values.
- Event flags at record+5 masked with0x18 select interpretation of byte0: value0x08 copies it directly; value0x10 passes it through00401a90 using object005f0550. Therefore raw byte0 is not universally a physical scan.
- The runtime record is15 bytes. Action+1 copies to+0, modifiers+6 to+5, gates+7 to+10, predicate+8 to+6, event flags+5 to+4.
- Event bit0x2 diverts the runtime node to the list at owner+0x400, replacing node+4 with the resolved key. Otherwise it is appended to the resolved-key linked list. Recovery must reproduce this distinction rather than treat every default record as an ordinary key-down binding.
- The ordinary matcher00489470 (blob464b000e50442988836e0c61333b199140dbac82) only traverses the per-key list, compares event bits&5 and modifier/eligibility/predicate gates.

Next: identify constructor callsite/table base, recover identity-matched default BD/BE records through the terminator, and resolve any translated key. The physical Ctrl+Alt mapping, N scope and full patrol lifecycle remain unproven. No game parity claim.
