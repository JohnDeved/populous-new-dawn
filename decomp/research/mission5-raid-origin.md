# Mission 5 raid staging origin

Refs #256 and #8. Source-prepared correction only. No ordinary Mission 5 raid,
current-checkpoint integration or rendered acceptance has been run for this change.

## Native source and authored owner

Reuse the bounded loaded-origin contract already accepted for Missions 1–4 and 6.
Retained exports bind original EXE SHA256
`3a5065c7420b3fcde208bf220bc86dfbac95e025ab2492caf9c7ea5308dfbe4f`:

- `00461d70.c`, SHA256
  `b3615d5df13470b64957be7de66ec21d444d9f093f78172cb9ac5ba65c4a8c46`:
  reset clears the AI range including loaded-origin word +0x5a2, and clears
  established-base byte +0x5b4.
- `00485b00.c`, SHA256
  `346a7d08813529a5f716e7641c6580c30b8853070e6c3759b64e8e1ecd899099`:
  each accepted class-1/model-7 object writes its packed even native cell into
  the owning tribe's loaded-origin word. Multiple accepted Shamans would make
  the last writer authoritative.
- `004f6020.c`, SHA256
  `21ada6683311b6a0b0a5f6030306ccee1262a8b7a6be0e630d5698a9c34fa8eb`:
  choose established base +0x36a when +0x5b4 is set, otherwise loaded origin
  +0x5a2. It does not inspect a defence flag or the current living Shaman.

These are retained decompiled source bindings, not a new original execution or
complete bulk-memory/reset/native-save writer audit. Preserve the limits in
[Mission 4](mission4-raid-origin.md) and [Mission 6](mission6-raid-origin.md).

Mission 5 level source SHA256 is
`fce3c6555933d9e6d04490739a90f0cd188bc561a977c0c28e04aa265955f90b`.
Dakini is its only authored computer tribe. Its sole Shaman is object124 at
(-117,67), giving packed loaded cell **0xb492**. Thus the existing first-match
missionPosition lookup equals the unique authored writer; no live actor,
defence position, reincarnation point or invented zero is needed.

## Bounded correction

The type-20 adapter in computer-runtime.ts adds only Mission 5 to the existing
loaded-origin allowlist. Explicit constructionBase, including zero, still wins.
The ordinary caller remains world-turn.ts → withCampaignTribe →
stepComputerTasks → stepAttackTask. Recruitment, staging and return phases
receive that origin. Outbound phase9 and regroup phase12 keep their own targets.

Before the correction, supplied Mission 5 cases with no established base choose
defence0x8232 or a moved Shaman cell0x2020 instead of0xb492; a missing/dead Shaman
with defence disabled falls back to zero. This is an executed source-composition
counterexample, not an observed naturally timed raid. No controller, orders,
task scheduling, selection algorithm, RNG, save schema or other mission changes.

## Tests and remaining acceptance

The maintained raid-staging suite retains every earlier-mission case and assertion.
It changes two old Mission 5 compatibility expectations to the proved loaded
origin and adds21 cases, for98 total child cases. New coverage includes current
checkpoint ownership, moved/dead/missing Shamans, defence on/off, quota/fallback
recruitment, returns, explicit base zero and independent outbound/regroup targets.
Mission5 has no authored Braves, so its quota case requests existing Warriors;
the original quota default remains unchanged for all earlier cases.
The separate source-binding test checks the retained exports, unique authored
Shaman and actual World coordinate conversion.

A lightweight evidence-only check imports the actual Computer controller module
and executes the extracted type-20 adapter up to its returned actions. It passes
original authored data through actual mission-position/native-coordinate source.
Terrain synchronization/height, selection candidate lists and entity/readiness
leaves are supplied; public dispatch and order attachment do not run.
Baseline:5/13 pass,8 expected failure groups across48 differing staging cases.
Candidate:13/13 pass, including explicit-base and outside-allowlist controls.
This does not certify the maintained full-module cases or checkpoint loading.

Before adoption, run the maintained98-case caller suite and new binding test,
unchanged Mission5 opening/raid regressions, ordinary distinct-origin raid and
current-save continuation, affected rendered acceptance, standard check/build,
TypeScript quality and fresh exact-composition review. No legacy-save expansion,
native full-route history, performance improvement, parity credit or issue closure.

