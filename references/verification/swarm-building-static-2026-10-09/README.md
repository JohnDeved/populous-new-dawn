# Swarm building pursuit: retained static proof

The original building pursuit/ejection controller is now retained as canonical-byte disassembly with an independently accepted interpretation. The missing native-body input is resolved. No game implementation or ordinary occupied-building cast is claimed.

## Read first

- [Accepted controller findings](findings.md), SHA-256 `6b5a4811593aca3b9c1090f427c94a604c0cd236dc316f6b2c33a05a388eb87c`.
- [Independent static review](static-review.md), SHA-256 `a1ea0e85b8efe10c858cadc687b08d42edc95d9128e329679cdb61951c2faca1`.
- [Current-port correspondence](integration-followup.md): the native class-2 cell producer is absent from the live port; exact occupancy removal and explicit queue-preserving panic ownership can reuse existing helpers. The [independent correspondence review](integration-review.md) accepts these source conclusions, with runtime implementation still gated on class-2 lifecycle ownership and actual verification.
- [Portable inventory](packet-manifest.json) records every copied artifact's size and hash. [Decoder manifest](manifest.json), [table/source supplement](supplement.json) and [final source addendum](review-addendum.json) preserve exact tool commands, source/input bindings and original statuses.

The recovered controller searches 167 spiral cells around the original cast position on its lifetime cadence, remembers ten building IDs, follows a ten-stage insect entry/ejection/exit sequence, and preserves the 200-visit lifespan. Ejection uses six physical occupant slots and differs materially from ground-target eligibility and response ordering. Every claim is tied to instruction addresses in the findings.

## Scope and reproducibility

Input identity: original `d3dpoptb.exe`, 2,275,840 bytes, SHA-256 `3a5065c7420b3fcde208bf220bc86dfbac95e025ab2492caf9c7ea5308dfbe4f`. GNU objdump 2.44 decoded the seven bounded windows and one switch-table byte window. The input hash was unchanged before and after; the reviewer independently matched all 4,960 retained bytes to the canonical PE. No original instructions were executed.

The packet contains exact, byte-identical nonempty decoder outputs and reports, except one documented symbol correction in `integration-followup.md`: `stepBuildingPreparation` is corrected to the actual `prepareBuildingSite`. The [inventory](packet-manifest.json) records the accepted and corrected report hashes and prior review; the behavioral interpretation is unchanged. Absolute command paths in the retained manifests identify the originating workspace; matching output files are provided here by basename. All eight original stderr outputs were empty and are omitted, with their empty-content hashes retained in the manifests. The input executable, ZIP/installer, raw archives, profiles and game assets are excluded.

Original report statuses that say review is pending remain unchanged. The two subsequently accepted review artifacts record their terminal verdicts separately.

The [provenance clarification](exe-provenance-clarification.json) distinguishes the game archive from the extractor source archive without changing the original verification receipt. Some decoded windows contain padding, jump-table data or the beginning of a neighboring routine; the findings identify those boundaries and do not treat them as controller instructions.

Interpretation base is main `d6cf109474379172728a3ccebf46ef72a15f3a58`. Runtime implementation, model feasibility, browser/native equivalence and ordinary occupied-building acceptance remain unproved. PR281's delivered ground-person Swarm witness is separate evidence and is not invalidated. Issues #61/#85 are not closed by this packet; no parity or deployment state changes.
