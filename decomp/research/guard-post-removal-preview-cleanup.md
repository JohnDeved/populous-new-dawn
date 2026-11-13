# Guard Post removal versus preview cleanup (2026-11-13)

Continuation of guard-post-preview-lifecycle.md at a2c8b01e66e48b0a3afba22b86c6b79314f3f49c. Source is Ghidra pseudocode at main 532cd9efb13acf0a36f2b9774c8892b18f918be6, not native execution.

## New bounded observations
- decomp/generated/004aab80.c (blob 62d2658fafa320562ce66d65ec3ca6c9deb807e0), actions 0x77/0x78: when the menu-model17 predicate enters the removal branch, terrain-cell traversal explicitly excludes PTR_008922d8 before selecting class10/model16 and invoking004ef180. This is direct evidence that the preview must survive that bulk removal branch.
- The same dispatcher action0x7a resolves unit_index_2, rejects null/flags_2 bit1/class0, and calls004ef180 only for class10/model16, followed by0044b100. It has no explicit preview-pointer exclusion in this pseudocode. Do not equate the two removal paths or infer key modifiers from action number alone.
- decomp/generated/0047a550.c (blob58dc7057c7e6436b9f43496890eaecfd81a8c940) calls004b9150 then004ba5d0 and clears DAT_00895dd4 when leaving previous mode7. An unchanged mode returns early.
- decomp/generated/004b9150.c (blob4c8d108f9a633e5cba6d1a5106c817b187954c18) only conditionally invokes004b9190 when DAT_00895dd4 bit0x10000 is set. Therefore its name alone does not prove preview deletion.

## Exact remaining gate
Generated004ba5d0.c and00503080.c return404. Code search finds callsites, not the former body. Recover these bodies/bytes before asserting exit cleanup or specialized post removal/save effects. Existing renderer, input and save lifecycle cannot safely be replaced from this partial trace. No gameplay changes, tests, browser or performance claim.

## Ordinary footprint interaction (daily continuity follow-up)

Verified against main 532cd9efb13acf0a36f2b9774c8892b18f918be6. In decomp/generated/004b9190.c (blob a2cecfad1c1038b74f63bec519a2b525253b9e78), mode0 visits shape-footprint cells whose shape byte has bit1. After earlier validity checks, it traverses the terrain-cell unit chain; class10/model16 marks land_flags_1 bit0x200000, cell flags bit0x100 and tribe field0x93d bit0x20000000, then stops scanning that cell. There is no preview-pointer exclusion in this specific loop. This is bounded source evidence that ordinary footprint validity treats such objects as obstruction, not proof of the missing Guard Post placement predicate or lifecycle.

004b8f50.c (blob ec73ee3892590b03cfbe10e0dccacccb8f6645f2) routes menu model17 away from the ordinary 004b9190 preview path and into 004b98f0 plus its separate preview object. Therefore reusing the ordinary building-footprint validator for Guard Posts would contradict this branch distinction. The specialized validator, preview exit cleanup, committed removal and save semantics remain unresolved. No implementation or tests performed.
