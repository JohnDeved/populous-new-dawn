# Mission 3 Convert Wild search origin

Refs #256 and #8. This is the separate type-2 phase-0 consumer, not a change
to the type-20 staging scope already delivered in PR285.

At base `f9675f56c597ec83adf02f28e9801bfc6bbd0490`, the actual dispatcher calls
`stepComputerConvert` only when the mission is 3 and the task is type 2.
The ordinary caller is `world-turn.ts` through `withCampaignTribe` and
`stepComputerTasks`; Mission 3's authored computer tribe is Chumara (2).
Its generic phase-0 search previously used the current Shaman cell when no
construction base existed. A moving Shaman could therefore change the search
center independently of the source-owned stored origin.

## Retained source and ownership

`decomp/generated/004c7370.c`, phase 0, selects tribe word `+0x5a2` when the
established-base byte `+0x5b4` is zero, otherwise word `+0x36a`. The generic
branch passes that center to `004f87f0` with minimum 0 and the byte search radius.
Flag `0x40` instead supplies marker99 from `+0x5a6`, clears the flag and bypasses
the search. The selected target enters phase 2 with remaining 360, elapsed 0
and extra 20. Missing or assigned live Shamans are rejected before phase 0.

The [accepted loaded-origin contract](https://github.com/JohnDeved/populous-new-dawn/blob/ef5d26329ac0f6b011746d556afdf655d6563013/decomp/research/issue256-stored-fallback-20261009/findings.md)
binds the original reset/load writer and the same stored owner used by PR285.
Mission 3 has one authored Chumara Shaman, object 46 at `(-45,-105)`, giving
packed even cell `0x60da`. Existing `campaignPosition`/`missionPosition` retrieve
that immutable object from the saved mission and tribe identity. Existing modern
and legacy-single-AI migration retain those identities; no saved field is added.

The inspected exports match `decomp/exports.json`:

| Export | SHA256 |
| --- | --- |
| `004c7370.c` | `db77666fa5730e24dd0d0c0af9e0311c73b0d7fc3aaf08efa067caa21fa43fdb` |
| `004f87f0.c` | `19f01f74290bc0bb5d2c7fe50e0bd0a08abf5251b55eac7b418c9da8b3bd8acc` |
| `004f6020.c` | `21ada6683311b6a0b0a5f6030306ccee1262a8b7a6be0e630d5698a9c34fa8eb` |

These are retained Ghidra pseudocode and accepted static ownership findings for
EXE SHA256 `3a5065c7420b3fcde208bf220bc86dfbac95e025ab2492caf9c7ea5308dfbe4f`.
No original instructions were executed for this correction.

## Bounded port and regression

Only Chumara's Mission 3 phase-0 absent-base origin uses the loaded position.
An established base, including zero, retains priority. The one-use marker,
actual target algorithm, density/list order, inclusive range, arithmetic, RNG,
pool ownership and live-Shaman cancellation remain unchanged. The existing
fallback for other tribe arguments is retained without extending the native claim.

`tests/mission3-convert-origin.test.mjs` invokes the actual dispatcher and forwards
the real `findConvertTarget`. Two supplied Wildmen regions have equal density:
the stored center admits target `0x70d0`, whereas the moved Shaman admits `0x1010`.
The test-only baseline `cbdfcbb87900a1f7d6890746f6c8c736dd313d56` produced four
intended target failures and eight passing preservation controls. Independent
review accepted that red result before the runtime correction.

Controls cover direct, modern and supported legacy migration; established base
and base zero; authored marker99 precedence and one-use consumption; and missing,
dead or assigned Shaman cancellation. Observations include actual query arguments,
target, phase and timers, with unchanged units, RNG and complete order pool.

## Limits

These are controlled caller states. The existing natural Convert test remains
unchanged and does not record an absent-base, distinct-origin generic visit.
Tower planning establishes the construction base before the building completes,
so a later generic task alone cannot prove that the fallback changes ordinary
play. No new ordinary episode, browser result, native binary-save compatibility,
universal alias/reset history or full campaign parity is claimed. Guard/defense
returns, construction origins, selection-world bases and other missions are
outside this correction.
