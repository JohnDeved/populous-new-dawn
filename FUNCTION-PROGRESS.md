# Original function progress

**1,352 known original functions** in the checked-in export inventory. The total number of functions in the executable is not established.

| Status | Known functions |
| --- | ---: |
| implemented | 3 |
| partial | 2 |
| missing | 1 |
| unassessed | 1,346 |

Each row below is an explicit assessment of one original entry address. Unassessed functions are counted but not listed here.

| Original address | Status | Scope | Remake source | Evidence | Limits |
| --- | --- | --- | --- | --- | --- |
| [`00402e30`](decomp/generated/00402e30.c) | implemented | Default next state for a person model | [`app/person-state.ts`](app/person-state.ts) | [`decomp/generated/00402e30.c`](decomp/generated/00402e30.c), [`scripts/check-native-person-state.py`](scripts/check-native-person-state.py) | Model-table lookup and the level-flag/model-7 override only; other initialization is separate. |
| [`0040cc60`](decomp/generated/0040cc60.c) | partial | Morph point interpolation | [`app/morph.ts`](app/morph.ts), [`app/scene-entities.ts`](app/scene-entities.ts), [`app/stone-head-animation.ts`](app/stone-head-animation.ts) | [`decomp/README.md`](decomp/README.md), [`scripts/check-native-models.py`](scripts/check-native-models.py) | Native coordinate arithmetic is compared; does not establish the complete original model and scheduler behavior. |
| [`0044d7f0`](decomp/generated/0044d7f0.c) | partial | Object tooltip presentation | [`app/tooltips.ts`](app/tooltips.ts) | [`decomp/README.md`](decomp/README.md), [`scripts/check-native-tooltips.py`](scripts/check-native-tooltips.py) | Forced object modes 1 and 2 are covered; first-mission lookup is approximate and modes 3–10 are unported. |
| [`00450d50`](decomp/generated/00450d50.c) | implemented | Native per-cell building shade | [`app/building-shapes.ts`](app/building-shapes.ts), [`app/world-terrain-runtime.ts`](app/world-terrain-runtime.ts) | [`decomp/generated/00450d50.c`](decomp/generated/00450d50.c), [`scripts/check-native-building-footprints.py`](scripts/check-native-building-footprints.py) | Original shade routine compared in 4,096 direct calls; supported imported rule data, not a building lifecycle claim. |
| [`004d5c70`](decomp/generated/004d5c70.c) | missing | Original state-3 death initializer | [`app/person-state.ts`](app/person-state.ts) | [`decomp/generated/004d5c70.c`](decomp/generated/004d5c70.c), [`decomp/generated/004d5cf0.c`](decomp/generated/004d5cf0.c) | Live initializer does not dispatch state 3; the later death visit and other death logic are separate. |
| [`004eeff0`](decomp/generated/004eeff0.c) | implemented | Original drowning predicate | [`app/person-update.ts`](app/person-update.ts) | [`decomp/research/shaman-death-support.md`](decomp/research/shaman-death-support.md), [`scripts/check-native-person-update.py`](scripts/check-native-person-update.py) | The predicate is implemented; this does not cover the drowning controller, death entry, or corpse update. |

## What the numbers mean

- **Implemented**: a live remake equivalent covers the stated original routine scope and has linked evidence.
- **Partial**: a live equivalent covers part of the scope; the ledger names a remaining gap.
- **Missing**: research confirms the stated original routine scope has no live equivalent.
- **Unassessed**: an export exists but no explicit assessment is recorded. This is not the same as missing.

Addresses come from [the export manifest](decomp/exports.json), not a complete binary scan. An export, source comment, or reference alone earns no implementation credit. Function counts are separate from [gameplay parity](PARITY.md); they do not weight difficulty, player impact, or work remaining. Some remake routines replace or combine multiple original functions.

Original executable SHA-256: `3a5065c7420b3fcde208bf220bc86dfbac95e025ab2492caf9c7ea5308dfbe4f`

## Update and compare

Edit [the evidence ledger](decomp/function-progress.json) as assessments are reviewed; link the current remake source and evidence and describe the limits. From the repository root, regenerate the report and check it:

```sh
node scripts/function-progress.mjs > FUNCTION-PROGRESS.md
node scripts/function-progress.mjs --check
```

For a machine-readable count at a Git revision, run `node scripts/function-progress.mjs --json --revision HEAD`. After the tracker lands, compare two Git revisions that contain it with `node scripts/function-progress.mjs --compare OLDER NEWER`. The comparison records both exact commit IDs, counts, common-address transitions, and inventory entries added/removed. Status changes can come from auditing older code, not just from new implementation. Additions and removals to the inventory are tracked separately. The first snapshot sets a baseline; it cannot establish a rate.
