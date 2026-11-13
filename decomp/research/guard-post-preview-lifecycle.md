# Guard Post preview lifecycle distinction (2026-11-13)

Continuation of guard-post-command-consumer.md at f9a87c4114e5401801f8f91ef9e7f0b62c665662. Source read: main 532cd9efb13acf0a36f2b9774c8892b18f918be6, decomp/generated/004b8f50.c blob ec73ee3892590b03cfbe10e0dccacccb8f6645f2. Ghidra pseudocode, not native execution.

## Preview path
Within mode DAT_0089c6e7==7, menu value 0x11 has a separate path from ordinary building preview 004b9190. For a minimap state with bit0x10000, it tests 004b98f0(packed low16 coordinate,0,0). Failure sets land_flags_1 bit0x200000 and, if PTR_008922d8 exists, removes it through004ef180 and clears the pointer.

Success quantizes each coordinate byte to an even cell then adds1 before multiplying by0x100; height comes from calc_point_height. If PTR_008922d8 is null, it allocates class10/model16 owned by player_tribe_num, clears object.flags bit0x80, and sets coord_scale_1 and coord_scale_3 to0. It repeats the predicate check and moves the retained unit through add_unit_to_cell.

## Consequence and limits
The preview uses the same class/model identity as the command0x62 allocation, but its own retained pointer and flags/scale preparation. Do not classify all class10/model16 objects as committed Guard Posts or assume the marker is a render-only sprite. The predicate uses literal tribe0 here; this is not evidence that all player tribes follow identical preview semantics. The exact flags/scales meaning, preview cleanup when exiting mode, specialized removal00503080, ownership visibility, placement predicate and save lifecycle remain unresolved.

No gameplay code, tests, browser or performance claim. This source distinction prevents a port from conflating preview and committed objects.
