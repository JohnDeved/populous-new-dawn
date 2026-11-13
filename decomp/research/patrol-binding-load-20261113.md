# Patrol configured-binding load (#1003)

Source-only continuation of 71723eb1, 2026-11-13. No implementation or tests.

## Retained evidence

- `decomp/generated/00488fb0.c`, blob `d8116d39c39e90242913d92e52cb079faf48b0eb` on main `532cd9efb13acf0a36f2b9774c8892b18f918be6`.
- `decomp/generated/00488ad0.c`, blob `7893cfa5a09fed3fd685cd830906f264877ec6e7` on the same main.
- These are Ghidra pseudocode, not compilable original source. Argument layouts, inferred types and names require machine-code verification.

## What the loader establishes

The optional loader identified at the initializer callsite is not merely a file existence check. `00488fb0` reads a four-byte record count, then repeatedly requests 0x0f-byte records. For records whose action classification in `DAT_005d66c8` is not 0x4c, the first pass calls `00488cb0`. It closes and reopens the file, rereads the count and records, then calls `00488ad0` for eligible records. The distinct first/second passes are consistent with removal followed by installation; the exact removal helper body is not retained as generated source here.

`00488ad0` searches the 12-byte default action table at 0x5d5de8 for action metadata. It constructs a 15-byte runtime entry and inserts it either into a scan-indexed list or the separate owner+0x400 list, according to the default record's flag0x2. It carries default metadata into the runtime entry, including forcing flag0x40 when present. Thus a configured binding record is not a complete substitute for the default action metadata.

The loader can return0 after a short read during either pass, and there is no rollback visible in this pseudocode. A failed load therefore must not be assumed to leave the constructor's defaults unchanged. This is a source-level control-flow observation, not an executed failure test.

## Remaining boundary

Recover the exact default records for BD/BE from canonical executable bytes, establish key translation and file-record argument layout, and inspect actual configuration where applicable before asserting a physical Alt mapping. Do not use this loader trace to infer N scope, patrol finalization or loop lifecycle. No original executable was downloaded, rehashed or executed in this step.
