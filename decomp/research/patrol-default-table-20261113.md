# Patrol default-table owner (#1003)

Source-only continuation of 77f3aff6, 2026-11-13. No implementation or tests.

Retained original `decomp/research/native-tribe-controls/004f1820-004f18e7.asm` (blob 77a9a22b257a4fccbe35b8548fb1a8060391bc02) resolves the previously missing constructor callsite:

- 004f183f allocates 0x404 bytes; on successful allocation, 004f1861 pushes table address 0x5d5de8 and 004f1868 calls 00489300 with the allocated owner in ECX.
- 004f1874 stores the constructor return in global 0x98ce6c. The callsite therefore identifies an actual default-table base, not just nearby known mouse records.
- If the caller's argument is nonzero and the later file probe succeeds, 004f18cd reloads this owner and 004f18d4 calls 00488fb0 with the constructed path. This is an optional later load path; its exact override semantics need its body before equating defaults with configured input.
- Original range identity is recorded in native-tribe-controls/manifest.json: VA 0x4f1820..0x4f18e7, SHA256 ecaa4208da389f5505c51fe236eb6b50d67d870689241cd128469e93b091e1ca. That manifest refers to canonical executable SHA256 3a5065c7420b3fcde208bf220bc86dfbac95e025ab2492caf9c7ea5308dfbe4f; no original rehash/read was performed here.

Next recovery is the identity-matched 12-byte record sequence starting 0x5d5de8 through its zero sentinel, including BD/BE actions, plus any constructor key translation. Previously retained data only selects a later subrange 0x5d6514..0x5d6580; its manifest's discovery scan metadata is not itself recovered bytes. Do not infer Alt mapping, N scope or patrol lifecycle from this callsite alone.
