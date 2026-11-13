# Quick camera producer trace (#1006)

Source-only review, 2026-11-13. No gameplay change or tests.

Source baseline: `532cd9efb13acf0a36f2b9774c8892b18f918be6`.

- [process_cmd](https://github.com/JohnDeved/populous-new-dawn/blob/532cd9efb13acf0a36f2b9774c8892b18f918be6/decomp/generated/004aab80.c) sets `iVar23 = player_tribe_num`. Action `0x5d` reads that tribe's Shaman pointer, and only when non-null queues recorded chunk type `0x16` using high-byte Shaman X/Y masked with `0xfefe` and the tribe angle. This branch does not show a home fallback or selection replacement. It does not by itself prove default period binding, dead/vehicle handling or downstream camera motion.
- Action `0x96` queues the same chunk type using high bytes from tribe fields `0x911`/`0x913`, again with low bits cleared and tribe angle. The field identity is not established here: do not label this reincarnation focus yet.
- [set_data_to_rddata_chunk](https://github.com/JohnDeved/populous-new-dawn/blob/532cd9efb13acf0a36f2b9774c8892b18f918be6/decomp/generated/00479dd0.c), blob `473538db51b8ec7bf7b344e8141a93836b4aca6b`, treats `0x16` as a default type: if the existing chunk type is nonzero, it does not overwrite the payload. Admission therefore matters; do not substitute an unconditional camera mutation.

Next evidence: map default key records to actions `0x5d`/`0x96`; establish tribe field writers and chunk `0x16` consumer; recover overview instant-entry/exit semantics. Coordinate with camera lifecycle PR #708. Generated pseudocode types are inferred, not a native execution witness.
