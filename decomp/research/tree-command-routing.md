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

## Queued gathering startup and carried timber (17 November 2026)

The original `00432df0` command initializer dispatch table at `00433470`
selects entry 1 for command 7, resolving through `00433440` to `00432fda`.
That branch checks assignment bit `0x8000`, then calls `004d58c0(person, 0)`
only when the bit is clear. Command 6 resolves to a different building-payload
branch and is not changed here. Original executable SHA256:
`3a5065c7420b3fcde208bf220bc86dfbac95e025ab2492caf9c7ea5308dfbe4f`.
This byte interpretation is independently reviewed; retained bounded native
restart probes use supplied route, allocation, sound and animation leaves,
not a complete original gameplay encounter.

The live adapter previously treated both 6 and 7 as no-op initializers.
An authored Mission 10 model witness has brave 120 harvest one log from tree
108 through ordinary commands and fixed turns, then Ctrl-queue reachable tree
109. Command 7 flags 132 do not have cancellation bit 1; incoming assignment
`0x119` does not protect cargo. Baseline retains 100 native cargo at startup,
so the next queued-tree visit completes the order immediately on old cargo.
The later idle drop does not satisfy the synchronous initializer contract.

The correction only supplies command 7's missing conditional drop. It uses
`dropCarriedTimber`, the existing unbounded live loose-log pool, provenance
fields and cue 11, then synchronizes the owning Unit cargo projection. The
assignment check occurs before common configuration clears `0x8000`. Queue,
route and other command initialization remain with their existing owners.
Native allocator capacity/identity and explicit native cell registration are
not claimed by this browser pool adapter; command 6 and scatter admission
remain untouched.

Failure-first regression covers the authored earned-cargo continuation;
supplied-state controls cover zero/fractional/multiple cargo, protected and
cancelled command 7, and unchanged command 6/3. In-memory current-format
checkpoint continuation checks queue, route, actor, trees and RNG through 16
ordinary turns. This is model/source evidence, not trusted browser input,
serialized UI Save/Load, audible playback, or full gathering/scatter parity.
