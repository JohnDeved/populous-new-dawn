# Guard Post placement producer trace (2026-11-13)

Source: main 532cd9efb13acf0a36f2b9774c8892b18f918be6, decomp/generated/004aab80.c. Retained Ghidra pseudocode only; no native execution or browser validation.

Actions 0x77/0x78 use current menu entry at DAT_005a8858 + selectedIndex*0x12. Menu model0x11 has a special branch: calls 004b98f0(minimap_state_and_cache, tribe, 0); on zero calls004ba640(cell). Zero from both reaches rejection; nonzero from second chooses removal. The removal branch iterates the terrain-cell chain, skips PTR_008922d8, and calls004ef180 on class10/model16 objects. No extra owner filter appears in this local fragment; do not infer authorization from it.

Successful non-special-land placement calls set_tribe_command with (-(model==0x11)&0x54)+0x0e: model17 therefore dispatches0x62, not ordinary building command0x0e. The payload includes combined menu bytes and minimap_state_and_cache. This links Help/menu17 to picked class10/model16 without treating them as identical enum values.

Next exact targets: recover004b98f0 and004ba640 contracts, trace tribe-command0x62 consumer and004ef180 lifecycle, establish default bindings for actions77/78. Context validation004380f0 command11 requires BOTH bits0x1000 and0x800000; a selection bit alone is not admission. Placement capacity/terrain, owner visibility, queue-loop/N release and save semantics remain unresolved. No gameplay implementation, test or performance claim.
