# Numbered follower groups: source gap for #1005

Read-only source review, 2026-11-13. Baseline main: 532cd9efb13acf0a36f2b9774c8892b18f918be6. No implementation or tests.

## Known source

`decomp/generated/0047c350.c` (blob d0a956bfa1d5e3ff01f93021b08313d24de42398) has unrecovered assignment/recall jump tables at 0047c465 and 0047c38b, plus eight removed-block warnings. Its inferred three-argument signature differs from the four-argument calls in `004aab80.c`. Do not treat that inferred signature as a complete native contract.

The dispatcher maps actions 0x84–0x89 to groups 1–6 with mode arguments (0,0); 0x8a–0x8f use (1,0); 0x90–0x95 use (1,1). Exact behavior must be recovered from the missing branches before porting.

The visible focus branch scans the current tribe's person_units chain, tests the group bit in loc_1_x, and sends its first match to 00417ca0 with angle -1 and immediate 0, followed by 00504590. This is only the shown land_flags_1 branch, not proof of behavior through the missing jump tables.

## Required next evidence

- Original executable SHA256: 3a5065c7420b3fcde208bf220bc86dfbac95e025ab2492caf9c7ea5308dfbe4f, recorded by `decomp/exports.json`.
- Original instruction and table bytes covering 0047c350–0047c590.
- Exact default key records for actions 0x84–0x95.
- Membership, replacement, empty-group, mixed-class, camera-target and persistence behavior from those native paths.

The retained material inspected for this pass contained no executable or matching instruction-byte artifact. No binary download, native execution, installation or speculative gameplay change was performed.
