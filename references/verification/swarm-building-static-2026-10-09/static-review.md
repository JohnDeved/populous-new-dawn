# Independent Swarm building static-contract review

Decision: ACCEPT the bounded static interpretation in `findings.md` SHA256 `6b5a4811593aca3b9c1090f427c94a604c0cd236dc316f6b2c33a05a388eb87c`. The unavailable-controller-body blocker from the earlier d6cf1094 review is resolved by canonical static bytes. Runtime implementation is not yet ready: the two explicitly identified live adapter mappings below still require source closure. No original gameplay equivalence or ordinary building episode is claimed.

Evidence directory: `/workspace/scratch/69fd8163d94e/populous-recovery-20261009/work/orchestration/swarm-building-static-20261009-01`.
Interpretation source: main `d6cf109474379172728a3ccebf46ef72a15f3a58`; stationary checkout remains e18.

## Independent byte and provenance checks

- Canonical PE is 2,275,840 bytes, SHA256 `3a5065c7420b3fcde208bf220bc86dfbac95e025ab2492caf9c7ea5308dfbe4f`.
- Manifest `a09a9ac4b78af79dfdd84f839ba036786bbb1ff957e9c518cc3aa44a30226b99`; supplement `b1344581412af3aece1f09073b2437afbd2c217b12d6b1e2436fb4f8b37d1204`; final addendum `e07ff37400f62bb4982e028c6e85db33cf9c05ff44cffc22797b0443dcab244d`.
- Rehashed the executable, recorded objdump binary, all seven stdout/stderr pairs and table output. Parsed the PE section mapping as data and matched every recorded address/byte in all seven windows (4,960 bytes total), without invoking disassembly or executing original instructions. These windows include padding, switch data and neighboring code; their inclusion is not a claim that all bytes are controller instructions.
- Independently decoded the three jump tables from canonical bytes: parent states 0/1/2/3, ten building substages, and four child states agree with the report. The controller returns at 00510c0c; tables and neighboring 00510c60 are distinct.
- Verified all 16 supplemental main/stationary source bindings; retained helper hashes agree with decomp/exports.json. The two additional model27 callback source hashes were also read and confirmed. Existing pseudocode names/types retain their documented interpretation limits.
- Read the provenance clarification `c96b217ecabc8fcd14aa43509049386aa98455d8dab10d61af67671ed9726b3e`: game archive6aa6c366… and extractor distribution2c2d850e… are distinct. The earlier sourceArchiveSha256 field remains unchanged and does not identify the game archive. This review directly reverified the EXE, not a repeat extraction.

## Material recovered contract

Acquisition is after state1 wandering, gated by remaining&63, at the saved origin rather than current cloud position. It scans spiral indices0..166, without a separate origin-cell visit, and walks cell-linked objects in their native order. The first class2 object of another tribe absent from ten history slots is selected. There is no occupancy, completion, HP, model or alliance gate in that acquisition loop. History uses the first zero slot without RNG; a full history uses one unsigned draw%10. Phase2 validity subsequently checks stored ID, deleted bit and nonzero class, without repeating tribe/class2/history eligibility.

The ten substages are real separate controller visits: initial delay, outside destination, strict per-axis signed-word difference<112 arrival, child redirection/freeze, all-child-inside wait, physical-slot ejection, four-count dwell, child exit+jitter refill, all-child-outside wait, then three motion draws per remaining child and return to wandering. Successful child allocation builds the linked list in allocation order. Target invalidation writes phase1 without clearing frozen0x4000, unlike normal completion; no speculative corrective reset is justified.

Ejection is not the ground scan. Six physical slots are read in order; each nonzero slot needs only the native live-record checks. The exact sequence is 00407490 removal, clear flags2 bit0x10, optional state26 initialization unless0x100000, flags4/0x800 removal call, damage, then Spy disguise reset. No ground tribe/state23/descriptor-immunity predicate should be added. A following common ground scan can separately touch an ejected person during the same visit. The requested occupant and actual returned/removal person identity matter; neither direct u.inside assignment nor arbitrary living-unit ordering is an equivalent adapter.

Child phase1 decays jitter and repeatedly resets target velocity before the strict Manhattan<200 test; child phase2 enters, sets render bit0x10, and phase3 exits then clears it. Target differences are separately signed-word coordinates, distinct from the wrapped convergence arithmetic. Parent freeze skips parent XY/terrain update but not the common person scan, child processing or lifetime tail. Exit jitter consumes ten draws per remaining child, followed later by three motion draws per child. Lifetime is not replenished; normal200 expires at0. The raw tail also handles zero before decrement and skips decrement/expiry for negative signed values, as now disclosed. Model27→state0x43→00510cb0 linkage is retained, but that separate callback returns for child phases0..3 and is neither a call from00510120 nor its destructor.

## Concrete implementation boundary

The controller/source input is sufficient to prepare a bounded implementation proposal. Two current-port ownership mappings remain unproved and must be settled before selecting the actual adapter:

1. Acquisition cell membership/order: current World.objectCells is maintained primarily for people; building footprints alone do not establish native object-cell membership or relative building order. The adapter must use the actual building registration/position/retirement owner and preserve first-match linked order across construction, removal, Load and Restart. Nearest-target, arbitrary array order or occupied-only scans are unsupported substitutions.
2. Occupant/panic order ownership: reuse the existing physical admission/removal consumer and exact person returned by it. Map the retained state26 initializer's order/route behavior before choosing initializeLivePanic's default cancellation versus preservation. Its cancelBuildingEntry default is not evidence that generic ground handling is correct here. Preserve slot, visibility, training/tower/indicator state, removal/damage/disguise order and resulting checkpoint state.

A minimal useful slice is the complete pursuit/entry/ejection/exit lifecycle, with source-bound state/RNG/order/invalid-target/checkpoint cases and an eventual ordinary occupied-building cast. An acquisition-only or ejection-only patch would not finish this behavior. This review authorizes no implementation, tests, browser/native/emulation, additional disassembly or extraction action.

M3 remains source-feasible through ordinary recurring settlement/training, not an initially occupied authored Yellow building or a demonstrated cast window. Delivered PR281 ground-person/input/insect evidence remains valid in its separate scope; broader issue61 remains open.
