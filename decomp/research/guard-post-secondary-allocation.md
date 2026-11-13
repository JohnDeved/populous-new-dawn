# Guard Post secondary allocation contract (2026-11-13 08h continuity)

Continuation of 4bb01a7f6094651e26d2f945822d7b7a7ab75cc5. Source read against main 532cd9efb13acf0a36f2b9774c8892b18f918be6; inferred Ghidra names/types are not an executable contract.

## Verified trace

The command 0x62 consumer in decomp/generated/0043e8e0.c (blob 84736619371ad4ffe2ad1934177d84565bbb8f92) allocates class10/model16 with alloc_unit_2 after its player-tribe and specialized-predicate/capacity checks. The preview path also uses this allocator.

decomp/generated/004edbd0.c (blob c45dd95f8913c548e934b2827179d8ceab13645c) is alloc_unit_2. It consumes free_units_2, links allocated_units_2, retains the unit index and pool links across clearing, increments DAT_0089c655, sets class counter/class/type/tribe/position, and normally invokes init_unit_class. unit_allocation_flag can mark flags_2 bit0x400; unit_allocation_flag_2 suppresses initialization for that allocation and is reset. Exhaustion returns null and adjusts ptr_unit_related_20B only under its separate allocation flag.

decomp/generated/004ed640.c (blob 8a840a9242432834fb716e563f14251102a3b85a) selects class10 initializer. decomp/generated/00500e20.c (blob 8f4e55fb5c24f96990dd3f52b3420315c4834718) switches on byte offset0x2c, which the retained unit structure/callers identify as state, NOT the model/type byte. Do not read its case numbers as model IDs or infer that case0x10 should initialize a Guard Post.

## Consequence and remaining gate

Guard Post creation is not adequately modeled by adding an ordinary building to the main building pool. Secondary-pool identity/allocation flags and later specialized lifecycle must be retained or deliberately mapped with evidence. This trace does not settle missing specialized predicate/removal/save bodies or prove how initial state transitions later occur. No gameplay code, tests, browser run or resource claim.
