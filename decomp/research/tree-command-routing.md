# Ordinary tree pointer-command routing

Issue #826 is an input-routing correction, not a new timber controller or a claim
that automatic construction wood collection was broken.

## Existing source contract

The retained `decomp/generated/00437010.c` context producer reads the winning
model identity (`unit_index_2`), resolves its class, and adds context bit 8 for
class-5 scenery whose descriptor `flags_1 & 4` is nonzero. The same descriptor
condition appears in its person/sprite identity and cell-chain routes.
`00437750.c` supplies contextual command priority; the existing browser
`chooseContextCommand` maps an eligible Brave's Tree context to command 7.
These are retained Ghidra pseudocode, not new original-game execution.

The imported `sceneryResourceFlags` values come from descriptor address
`0x5a79b0 + model * 24 + 20` (`scripts/inspect-executable.py`). Bit 4 is set for
tree models 1–6 and loose-log model 11; stump models 7/8 do not have it.
Do not confuse this word with `sceneryFlags`, the adjacent byte used by tree
hover presentation. Existing `timber-search.ts` uses the same resource bit.

## Browser caller gap

`makeDecorations` binds the authored tree as `parent.userData.point`.
`ScenePicking` carries its ID through model bounds/faces and the shared painter
and terrain ordering. `pickPerson` intentionally rejects a winning model hit.
Before this correction, `pointerUp` used that person-only result for its tree
lookup, while the shared `pickWorldObject` resolved vehicles/buildings/shrines
only. Thus a genuine tree model hit did not reach the existing exact-ID context.

The correction reads the same cached picker result only for ordinary selected
commands outside overview. It preserves existing person and world-object
precedence, including the nearby-vehicle fallback. The final tree lookup requires
remaining wood and the native resource bit. It does not invent a proximity hit,
change the picker, expand overview, or alter right-click inspection, spells,
placement or direct-Blast targeting. Hidden/occluded geometry remains the actual
picker's responsibility; stale woodless targets cannot become tree commands.

Loose logs use sprites and currently do not enter the ordinary model picker;
this change does not claim to repair their public targeting. The existing
`liveCommandContext` and command-7/tree-work consumers remain unchanged. Plain
harvest uses the existing legacy tree owner; this is not native mixed-queue or
complete controller equivalence.

## Evidence boundaries

`tests/tree-command-pointer.test.mjs` exercises actual pointer-down/up, selection
and command callers using the authored Mission 10 Brave120/tree108. Its first cases supply DOM and the final painter hit; the composed case runs
authored decoration geometry through actual `ScenePicking` with supplied painter
submission and empty terrain. Neither is a rendered/GPU witness. Browser
acceptance must independently use shipped controls and actual scene hits, retain
the pre-fix consequence and corrected result, and bind exact source/artwork.
No parity percentage or full original-game timing claim follows from this repair.
