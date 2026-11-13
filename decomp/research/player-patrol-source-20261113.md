# Player patrol source trace (#1003), 13 November 2026

Source-only review at main `532cd9efb13acf0a36f2b9774c8892b18f918be6`. No implementation, test, browser or original-game execution.

## Verified source route

- `decomp/generated/004aab80.c`, process_cmd cases 0x7e and 0x7f, call 004aa8b0 with first parameter 0 and 1 respectively. Both use 004999d0 and input flags to construct the other arguments. Decompiler argument types are inferred.
- `decomp/generated/004aa8b0.c` (blob `8f0276ee6d884e6da94f37d4612ad6ca82cca178`) takes the current context model from DAT_00895ea0[DAT_00895e9d]. It selects the staged/final slot command family 0x37/0x57, limits staging at the eighth slot, and encodes other input flags as 0x20000 and 0x40000.
- `decomp/generated/00444f60.c` (blob `9752a9715b5e854fe6cb627b6cdc84a81cd4b700`) consumes those families, extracts the model separately, and calls 00435780, 00435c40/00435cb0. The staged flag and final/deselect behavior do not alone establish a repeating player patrol.
- `decomp/generated/00437750.c` (blob `acf2a0b5eb82000079c7529506059f202662ac73`) selects context models through target flags and person eligibility. Guard-post context bit0x1000 chooses model0x0b when higher-priority choices do not win. This is distinct from a proven Ctrl+Alt terrain-click patrol producer.
- Existing `app/person-orders.ts` and `scripts/check-native-orders.py` already cover ordinary player staging; do not duplicate it as a patrol implementation.

## Missing before implementation

Identify the exact Ctrl+Alt terrain-input path that chooses the patrol model, then trace route construction, repetition, finalization, order capacity and exit. Establish N's binding/action and affected selection/tribe scope from retained native code or a bounded original-game witness. Existing AI patrol and Guard Post prose do not settle those specific player-input semantics.

The open issue's community guide remains feature-level evidence, not a complete native algorithm. This trace does not justify changing queue cycling or mapping N by mnemonic. Preserve current Ctrl queue, G guarding, save ownership and reference accounting.

## Runtime limitation

The environment listing during this pass reports the cloud computer offline. No setup or restoration was attempted. No runtime or resource-resolution claim follows.
