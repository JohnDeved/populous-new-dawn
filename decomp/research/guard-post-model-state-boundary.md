# Guard Post model initialization versus class state dispatch

Continuation of c8d65eefd8c52d94e0cbf025c79c84309316223e. Source pinned to main 532cd9efb13acf0a36f2b9774c8892b18f918be6. Ghidra pseudocode has inferred types; no native execution was performed.

## Verified distinction

- `decomp/generated/00500a30.c`, blob `d5b8a93c09ed58335f91898d3c86143b3182ff16`, is `init_unit_type_10`. It switches on `unit_type`, NOT state. Case 0x10 explicitly sets state 0xf after empty/init handling unless flags_2 bit0x100000 suppresses it; aligns x/y to tile center ((coordinate & 0xfe00)+0x100); inserts the object into the land tile; sets object (2,7), applies sunlight update (3,4,0), sets object flag0x80, zeros coord_scale_1/3, increments DAT_0089c65d, and calls 005030c0.
- `decomp/generated/00500ec0.c`, blob `8b87f7f31dc11bbeeabf3ca616b50c8dee88233e`, is the separate class10 update dispatcher and switches on byte offset0x2c (state). State0xf calls00502eb0. State0x12 calls00503550, the function that globally recounts class10/model16 in the previous note.
- Thus the previous recount is NOT established as the ordinary Guard Post state update. Model0x10 initialization and state0x12 dispatch must not be conflated. Earlier state-switch warnings apply to the state dispatcher, not to the explicit model/type initializer.

## Remaining evidence

Generated bodies 00502eb0 and005030c0 returned404 at the pinned main. Recovery of these bodies is now a precise next step. Placement predicates, specialized removal00503080, queue semantics and save lifecycle remain unproven. The source also shows other writers of DAT_0089ce61 (00407060 and model0x13 initialization), further preventing its thresholds from being called a Guard Post placement cap without consumers.

No gameplay edit, test, browser validation, installation or resource-resolution claim. This note narrows the implementation contract and corrects terminology; it does not authorize guessed lifecycle code.
