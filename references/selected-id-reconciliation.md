# Frame selection membership — issue #144

`GameScene.animate` calls `updateUnitsFrame` in `app/scene-entities.ts`.
Each person previously scanned `world.selected` in the selection-arrow helper;
the idle animation chooser in `selection-runtime.ts` scanned it again. The unit
frame now clears and rebuilds a reusable Scene-owned ID set on **every call** and
passes it explicitly to both consumers. The set contains disposable derived IDs,
with weak Scene ownership; it does not mutate or cache authoritative save state.

`GameScene.animatePerson` and the exported helper accept a trailing optional
`ReadonlySet<number>`. `unitAnimation` accepts the same optional terminal query.
All omitted direct, effect and live-simulation callers retain the current `includes`
fallback. Cached false is authoritative; an empty set does not fall through.
`Set.has` retains `includes`' SameValueZero semantics for NaN, duplicates and signed
zero, without the strict-equality guard used by mesh cleanup. Animation still queries
`u.id`; the arrow still queries `g.userData.unit`. Every other source branch and
consumer is unchanged, including animation early returns and selection ownership.

The shipped pointer path calls `selectUnit` from `scene-input-runtime.ts`; right
click and page Escape call `cancelInteraction`. Selection first owns targeting-mode
cancellation and then follower clearing. Checkpoint save/load retains `selected`
through `structuredClone` and the maintained migration. No producer, command order,
click/Ctrl/cancel, effect or persistence behavior is changed by this slice.

`tests/selected-id-reconciliation.test.mjs` uses the actual full unit caller and
maintained `GameScene` person/effect wrappers through the new selection-scene fixture.
Texture IO, projection and motion use existing Node boundaries. Quiet legacy people
come from `addUnit`; actual `selectUnit`, `setSelection` and `cancelInteraction`
drive the controlled selection cases. Seven cases **passed** on Node v24.19.0 at
`4ab408b75747b2fadc195a85db82ee6f18ec721f`, based on exact merged main
`e125813da6aa6a211f36d2248a877e10dc0efd45`.

Cases cover click/Ctrl and mode-first cancellation, same-array/replaced/empty
selection, migrated loads and cached identities, omitted direct/helper/effect live
fallback, SameValueZero, independent Scenes and world replacement, explicitly empty
set authority, existing animation branches and scaling. Normal unit-death factory
output has no selection arrow and retains its body/material/world state. A separate
diagnostic arrow from maintained unit resources observes the actual death effect's
omitted argument; it does not add production corpse arrows or establish corpse QA.
Full-world and both RNG owners remain equal after the stated controlled setup.
Raw focused receipt `work/orchestration/issue144-selection-focused-4ab408b.json`,
exit 0, stdout SHA256
`c0c34a9cd3bb8446ca171e0a72ab5c818490a713f66cef03c934ded1f441cc9c`,
binds 25 source, actual fixture, original-data and locked importer inputs before/after.

The deterministic diagnostic counts selected-array slot reads in a **quiet,
all-selected legacy idle population** that reaches both terminal idle-state and
arrow consumers. Old counts execute the frozen two `includes` queries; new counts
execute the actual full unit caller. This measures selected-slot reads only.

| People | Frozen two-query slot reads | New full-caller slot reads |
| -----: | --------------------------: | -------------------------: |
|     64 |                       4,160 |                         64 |
|    256 |                      65,792 |                        256 |
|  1,024 |                   1,049,600 |                      1,024 |

The same entire test/helper was overlaid on pristine base production in detached
`/workspace/pnd-baseline-144-selection`. Five unchanged lifecycle/default cases
passed; **two cases failed**, exit 1: the newly explicit empty-set forwarding contract
was absent, and actual full-caller scaling read 4,160 slots for 64 people against
the 128-read bound. Raw `issue144-selection-baseline-focused-e125813.json` stdout
SHA256 `7a9969b047ec021769d7535d1e6d6ddd8080220765586420e50894cdd63fa9e2`
is retained. No baseline skip, conditional assertion or source/config relaxation
was used to manufacture a single failure.

Scoped Oxfmt and ESLint **passed**. Strict Oxlint **failed** on both candidate and
base across the three maintained TypeScript files: 24 warnings and four errors.
The separate comparison **passed** for all 28 inherited diagnostics, normalizing
only numeric line/column prefixes. Raw artifact/input identities, pristine base and
the entire remaining three source files are also verified. Raw strict failures
remain distinct; the actual ignored comparator source is embedded in the proof.

At this author checkpoint, standard check/build and independent final integration
review are **not-run**. Browser QA and hardware measurements are **not-run**, with
supported browser access blocked. This establishes bounded selection lookup work,
not whole-frame complexity, native raster equivalence, browser interaction acceptance,
FPS, deployment behavior or completion of #144.
