# Ordinary movement to encounter pose ownership

## Observed M17 failure

Fresh ordinary M17 on `8b842e87382cf5c772db82bcd27a0904bfe0e2dc` earned and cast Armageddon. Its genuine phase-2 turn6619 checkpoint is retained, uncompressed SHA256 `908e458d89e5bfcff568b7b36254e4da3e688d9928b4f980ec05933e3948fe5f`. This is CPU actual-clock campaign evidence, not a native fixture.

At6673 Red Brave1586's browser and native positions agree at(-56.12109375,41.8828125). At6674 the ordinary browser path branch advances to(-56.3203125,41.69921875), but its native record remains at53217/52766. Later contact processing creates an encounter using this existing record. The final synchronization correctly excludes combat-owned people, leaving a0.2709147 mismatch. At6675 physics publishes the older native pose back to the browser, undoing one walk step.

The retained observation-only setter trace proves the ordering and call sites. It does not inject actor coordinates, timers, stock or orders. A first syntax-invalid producer attempt and the original failed arena guard are preserved.

## Native contract and minimal repair

Pinned original EXE SHA256 `3a5065c7420b3fcde208bf220bc86dfbac95e025ab2492caf9c7ea5308dfbe4f`; only static inspection was used. Independent export/objdump hashes and assembly for0051e150 are adjacent. Encounter admission allocates the model9 group at the defender's current position, enters the existing people into state29, preserves flags4&0x10007, establishes phases5/4, stops the defender and immediately visits the encounter. There is no restoration of a previous turn's position.

The browser has two pose representations. Reuse its existing ordinary browser-to-native epilogue conversion only when combat admission adopts the ordinary native record. Preserve normal route advancement ordering. Relink through the existing object-cell movement operation. No replacement person, clock/preparation visit, order cancellation or RNG draw is introduced. Same-coordinate native height remains authoritative, as in the existing epilogue.

Existing flight, fight and vehicle owners are excluded. Protected-state, builder-person and entry ownership are explicitly excluded from the new admission call; their separate movement adapters are unchanged. `createMeleePerson` already creates from the current browser pose; `enterLiveCombat` reuses the existing physical record, which is reconciled to the completed ordinary path step at this narrow ownership handoff. Existing combat, attack-vehicle mode1 and native airborne movement are untouched.

## Qualification

Tests cover same-cell ordering, cross-cell relinking, same-object admission, unchanged clock/RNG/allocation/route identity and existing flight/combat/vehicle negative controls. The actual6619 checkpoint advances80 actual-clock visits with Save/Load twins and exact browser/native/registered-cell agreement for every retained person. Independent ordinary replay and full gates are required before merge.

This repairs a stale adapter handoff. It does not claim complete native scheduling, original AI, Armageddon Shaman automatic spell parity, rendered frame parity or mission victory.

## Rejected broad approach

The first candidate3fd73a2d (test-cleanup ed590e09) published before stepLiveRoute. Its actual M17 replay passed, but the full aggregate2601/2620 exposed19 failures, largely altered unrelated route/arrival chronology plus CLI scheduling failures. Because stepLiveRoute intentionally handles native aliases differently, that placement changed route completion timing. It was rejected rather than rebasing existing expectations. The revised runtime leaves world-turn and route code byte-identical to base and reconciles only ordinary native reuse at combat admission. Both aggregate and intermediate diagnostic failures remain retained.
