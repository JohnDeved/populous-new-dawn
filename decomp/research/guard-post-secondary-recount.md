# Guard Post secondary-list reconstruction and recount boundary

Continuation of 5fd0290fd3ed91a7eecf5acc04d6e1635a343d7d; inspected main 532cd9efb13acf0a36f2b9774c8892b18f918be6. Ghidra pseudocode is inferred, not executable original source.

## Verified source

- `decomp/generated/004ee300.c` (`c5f990fb697b14d4800e52e43e474d744fb4936e`) rebuilds primary and secondary pools independently. Secondary reconstruction walks `unit_array_ptr_4` through `unit_array_ptr_end_2`, links class-zero records into `free_units_2`, other records into `allocated_units_2`, and increments `DAT_0089c655`. It resets `DAT_0089c65d` but does not recount Guard Posts here. This is a list reconstruction contract, not proof of serialization layout or reload behavior.
- `decomp/generated/00503550.c` (`b6304ca96c2495139d000afdeea53d02f07ae065`) has an early branch after decrementing byte offset0xa7 below1. That branch scans all `allocated_units_2`, counting class10/model16 into `DAT_0089c65d`; the visible scan has no tribe filter or explicit preview-pointer exclusion. It assigns `DAT_0089ce61` to0 initially,8 below33,4 below22,2 below13, then calls `update_after_unit_alloc`.

## Boundaries

The recount is a global model-count observation in this function, NOT a proven per-tribe capacity rule or placement cap. Its callers, the meaning of the threshold output, and timing relative to preview lifetime remain unproven. Do not implement a 12/21/32-post cap from these comparisons. Existing research established preview shares class10/model16, so the absence of an explicit exclusion must not be silently treated as committed-post-only counting.

No gameplay change, execution, tests, browser check, or storage-resolution claim. Next useful recovery is the caller/state dispatch of00503550 and consumers ofDAT_0089ce61, along with missing specialized placement/removal bodies.
