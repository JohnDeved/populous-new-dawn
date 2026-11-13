# Guard Post command consumer and removal dispatch (2026-11-13)

Continuation of guard-post-placement-producer.md, source main 532cd9efb13acf0a36f2b9774c8892b18f918be6. Retained Ghidra pseudocode only, not native execution.

## Command consumer
decomp/generated/0043e8e0.c case 0x62 reads command payload at +8 (inferred pointer type is not a trusted semantic type), calls 004b98f0(payload, tribe, 1), then on nonzero calls 004ba9b0(tribe-state, 1, 0, payload). It walks the corresponding terrain-cell unit chain and changes eligible class1, same-tribe persons to state0x2b after storing prior state. Eligibility also requires loc_1_x high bit clear, state-table bit8 set and flags_2 bit0x100000 clear. This loop is outside the first predicate's conditional; do not collapse it into that conditional.

A separate branch requires tribe == player_tribe_num and 004b98f0(payload, tribe, 0) nonzero. It clears coordinate low bits with 0xfffffefe, calculates terrain height, checks 004edae0(10,0x10), then calls alloc_unit_2(10,0x10,player_tribe_num,...). This proves a player-local class10/model16 allocation path, not complete multiplayer ownership or save behavior.

## Capacity and removal
decomp/generated/004edae0.c sets reserve4 for class10/model16 and returns the low-byte predicate DAT_0089c655 <= 0xa0-4 (156). The counter's global semantics are not established here: this is NOT proof of a maximum of four Guard Posts.

decomp/generated/004ef180.c case class10/model0x10 dispatches 00503080 and returns. It does not use the generic class-clear/list-removal path for this model. Removing the marker as an ordinary generic object would therefore skip an unexamined specialized lifecycle.

## Remaining recovery targets
Generated files 004b98f0.c,004ba640.c,004ba9b0.c,00503080.c were absent at this check; absence of those generated files does not prove their binary bytes absent. Code search found their callers but not definitions. Recover those predicate/lifecycle implementations and the exact packed payload/coordinates before porting. Queue-loop/N release, capacity-counter identity, owner visibility and save semantics remain open.

No gameplay patch, tests, browser run or performance claim. Source-only research narrows the required native recovery targets.
