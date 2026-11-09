# Mission 4 raid staging origin

Refs #256. This extends only the existing Missions 1–3/6 type-20 loaded-origin
projection to Mission 4. It does not close the issue or claim an ordinary Mission 4
raid witness. Base: `3869eb6d161f7e218fe3695b7ab801ce351e41d3`.

## Source and ownership

The accepted loaded-origin contract linked from
[issue 256](https://github.com/JohnDeved/populous-new-dawn/issues/256#issuecomment-6081199433)
and summarized in [Mission 6](mission6-raid-origin.md) supplies the bounded reset/load
interpretation. Retained `00461d70.c` clears the AI range starting at `+0x36`
through `+0x5c8`, including `+0x5a2`, and clears established-base byte `+0x5b4`.
`00484a10.c` calls `00485b00.c` after successful authored object allocation;
class 1/model 7 stores its packed even position in the tribe loaded-origin word.
If multiple Shamans were accepted, the last writer would win.
`004f6020.c` returns that word at `+0x5a2` when `+0x5b4` is zero, otherwise
established base `+0x36a`. No defence flag or live-person lookup is present.

The maintained source-binding test verifies the reset, writer and reader hashes
against retained exports and checks Mission 4 source SHA256
`82a3511c1b5669ba5b44d8ca9eceeefef51c9c6fa7151f650d96d8870f61abad`.
There is exactly one authored computer tribe (Matak, 3) and exactly one Matak
Shaman: object 14 at `(-81,-63)`. The existing `missionPosition` first-match
lookup therefore equals the unique/last authored writer. Actual native coordinate
conversion produces cell `0x36b6`. No first/last ambiguity or invented zero
fallback is introduced. Exports bind EXE SHA256
`3a5065c7420b3fcde208bf220bc86dfbac95e025ab2492caf9c7ea5308dfbe4f`.

## Port and checkpoints

The ordinary dispatcher is `world-turn.ts` → `withCampaignTribe` →
`stepComputerTasks` → type-20 adapter → `stepAttackTask`. Only its mission
allowlist gains 4. The origin is recomputed from immutable authored level data
and saved mission/tribe identity, not live Shaman position, defence, or
reincarnation state. Existing saved `constructionBase`, including zero, wins.
Modern and supported legacy-single-AI migration preserve those identities;
no new field/schema or startup replay is needed. This intentionally corrects
future staging after loading old port checkpoints; it does not reconstruct
native binary saves or past orders.

The controlled actual-caller suite adds 26 cases: moved/dead/missing Shaman,
defence on/off, direct/modern/legacy ownership, quota/fallback recruitment,
retreat/completion/target-loss returns, saved base zero, outbound and regroup.
It forwards the real controller and recruitment callback, then stops before
order attachment. Existing Mission 3 recruitment override, M5 fallback controls,
member ownership, timers/phases, RNG and complete order pool checks remain.

Failure-first focused run: 25 intended M4 staging mismatches, 52 passing child
cases; source-binding test passed. One-entry runtime correction: all 77 child
cases and source binding passed. TypeScript check passed. Raw receipts are retained
in ignored `work/orchestration/raid-base/`; these are focused results, not full
check/build, rendered QA, or native instruction execution. The new source-binding
test and existing caller test are explicitly reviewed focused selections despite
being unknown paths in the orchestration route map.

## Remaining boundary

No new ordinary M4 simulation, browser capture, original instruction execution,
universal bulk-memory/reset/save/alias writer audit, malformed-world recovery,
or full original raid history is claimed. The older finite writer-audit file
linked by prior reports is not present in this checkout; this change reuses the
accepted bounded contract and the retained exports, not a newly complete audit.
The existing M6 natural witness remains prior evidence, not proof of M4 behaviour.
Other missions and guard, Convert, construction, defence and selection-radius
consumers are unchanged. Full gates and independent review remain integration
requirements.
