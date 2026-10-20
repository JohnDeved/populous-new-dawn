# Result statistic producers

Refs #457. Research/test-only branch based on `96becd8826afc5a4256a12ccebf3caa61729e24b`.
The live issue and comments were read on 2026-10-20. No app code, UI placeholders,
parity completion, original execution, emulator, or denied checker/log access is
part of this work.

## Evidence and reproducibility

Original D3DPopTB.exe SHA256:
`3a5065c7420b3fcde208bf220bc86dfbac95e025ab2492caf9c7ea5308dfbe4f`.
The documented local paths were absent. Following `engineering/native-setup.md`,
downloaded the documented 307 MiB archive, verified
`6aa6c366809ea1d9575ec1d31a24527a95c7332f0a1d2ab692f7a602e7e10702`,
and extracted **only** Component0 `d3dpoptb.exe` with `scripts/extract-reference.py`
and binary-refinery 0.10.11. The installer and original code were never executed.

`native.json` contains exact PE spans, their hashes, and 17 direct E8 call
candidates. Reproduce without optional packages:

```sh
python3 scripts/research-result-statistics.py /path/to/d3dpoptb.exe > /tmp/result-statistics.json
cmp /tmp/result-statistics.json decomp/research/result-statistics/native.json
```

`native.asm` is GNU objdump 2.44 Intel disassembly of those same half-open spans:
`objdump -d -Mintel --start-address=0xSTART --stop-address=0xEND EXE`.
Existing exports below are Ghidra 12.1.3 pseudocode indexed in `decomp/exports.json`.
Use bytes/assembly where the decompiler drops arguments. No new Ghidra project was
needed. Direct-call discovery is not an exhaustive indirect-call or write analysis.

## Storage, reset, and display boundary

`00524653–00524670` reads **live** word
`0x969dc6 + tribe*0x30 + counter*4`; it does not copy a final result structure.
`005245e3–005245ed` computes tribe*12 words. Descriptor `005add30` maps labels
741–750 to indices0–9. Its last two allocated words are not displayed counters:
word10 is spell knowledge, word11 building knowledge.

`0041b550` adds a delta to this storage using signed-byte tribe attribution. Its
only owner check is `tribe != 0xff`; it has **no** enemy/alliance check, no clamp,
and no duplicate-event guard. The machine add wraps at 32 bits. Valid gameplay
tribes are0–3; absence of helper validation does not authorize indexing arbitrary
browser tribes.

**Reset for each of the ten rows:** `0041b520` zeros all12 words for the supplied
tribe, then updates the separate time baseline `0x969dc2`. The original setup loop
at `0042cb7d–0042cb90` calls it and advances through `num_tribes`. The nearby
`clear_level_global_vars` export's 13-word clear at `field_0xccc16` is a different
region; it must not be cited as the statistics reset.

**Final snapshot for each row:** no separate final-copy producer is established.
The renderer loads the same words that the increment helper changes. Outcome
flags alone do not prove that all later simulation writers stop. Original timer
conversion (`0041b5c0`, renderer calls `005243f4/00524404`) is separate and does not
freeze counters. This corrects the earlier ambiguous “display storage” wording
in `original-result-ui.md`; it does not establish complete automatic outcome/input
lifecycle or native Save/Load restoration.

## Ten independent producer traces

Addresses in the second column are **tribe0** words; other tribes add `0x30`.
All rows share the reset/display boundary above. A located producer does not
establish complete admission/caller coverage.

| Index / label | Word | Original increment and attribution | Browser owner / remaining gap |
|---|---|---|---|
| 0 Fights Won | `969dc6` | `00518fb0.c:435–466`: terminal `00519a70` cleanup credits group byte`+6b`, then removes the group. Separate release `00519c90`, call`00519cec`, does the same; removal dispatch calls it at`004ef6f7`. | `combat-runtime.ts:355–441`, `cleanBattleState`, already updates `stats.battlesWon[winner]` once on ordinary cleanup. Existing captured terminal fixture and separation/interruption tests support this bounded mapping. Full forced-release dispatch equivalence is still unproved. |
| 1 Fights Lost | `969dca` | `004a39c0.c:31–40`: after melee damage, each person with life<1 credits **that victim's tribe**, including both victims of a mutual exchange. `param3` suppresses damage to the second person. Calls`004a3a80/004a3aa1`. | `combat-runtime.ts:115–127` applies the exchange and campaign attack credit but has no loss counter. It is not total follower deaths, nor the inverse of row0. |
| 2 Enemy Tribes Destroyed | `969dce` | `00418e30.c:171–200`: single-player branch scans tribes1..num_tribes-1; newly zero `num_persons` sets `f_949` first, calls`0041b8b0`, then increments **player_tribe_num**. Direct inc`00418f57`. It does not credit the final attacker. | `tribe-turns.ts:185–247`, `stepOutcome`, `manaTribes` defeat state and `cleanupDefeatedTribe` own elimination; no corresponding statistic. Need match branch/once-only latch, authored outcomes and revival before instrumenting. |
| 3 Enemy Followers Killed | `969dd2` | `004d5cf0.c:104–108`: finalized non-Shaman death with victim tribe !=ff credits stored attacker byte`+b0`. | `world-turn.ts:1774–1784` ordinary-death scan and `damageAttacker` are candidates. Existing `killCredits[attacker][victim]` is 16-bit wrapping, includes Shamans and omits uncredited losses; it cannot supply this row. |
| 4 Enemy Buildings Destroyed | `969dd6` | Stored attacker byte`+af`, guarded by absence of flags3 bit`0x40` and attacker!=ff: removal`00403820`, replacement`004050c0.c:77–85`, terrain collapse`00406f40.c:38–44`, sinking`00407060.c:21–27`. | `building-runtime.ts` / `building-damage.ts` retain attacker and plan attacker. Terrain destruction explicitly leaves attacker statistics open. Need trace replacement, staged damage, dismantling and all remove callers; not `stats.built`. |
| 5 Enemy Shaman Kills | `969dda` | `004d5cf0.c:98–100`: finalized model7 death credits attacker`+b0`, separately from ordinary followers. | Same death owner; preserve Shaman split, attribution and deferred completion. Do not derive from the unsplit kill matrix. |
| 6 Own Followers Lost | `969dde` | `004d5cf0.c:104–107`: finalized non-Shaman with victim tribe !=ff credits **victim**. It does not require a valid attacker. | Same death owner; environmental death must not be lost simply because attacker is255. No existing total is equivalent. |
| 7 Own Buildings Destroyed | `969de2` | `00408ab0.c:73–83`, `004092a0.c:76–85`, and pair-removal`0040b130` at`0040b15b`: owner byte`+2f` of the building, then remove it. | Building damage/removal owner, not construction completion. Must distinguish plan/building and replacement from a single `hp<=0` filter; rows4/7 occur at different native stages. |
| 8 Own Shaman Deaths | `969de6` | `004d5cf0.c:98–100`: finalized model7 death credits victim`+2f`, before ordinary removal. Respawn eligibility is decided earlier in this function. | `world-turn.ts:1785–1807` schedules reincarnation separately; count death finalization once, never resurrection or every effect tick. Need native allocation-failure/ghost admission proof. |
| 9 Vaults of Knowledge Raided | `969dea` | `004facf0.c:149–190` reward completion →`0041b580`: mode byte`+80 ==1`, recipient`+7e`, model`+74`; building category2 selects bitmap word11, spell category11 selects word10. Mana category6 bypasses. Only a previously clear bit increments row9 (`0041b5b6`). | `world-turn.ts:529–591` delayed gift delivery, `Gift`, `world-effects.ts:143–184`; not `vault.ts` prayer/visit completion or spell cast. Need preserve native mode and per-tribe category/model deduplication independently of unlocked/stock state. |

## Attribution, duplicates, interruptions, and ghosts

- **Own/enemy:** the helper and death completion have no owner!=attacker test.
  “Enemy” labels therefore do not justify filtering self-damage at this layer.
  `004da080.c:21–23` updates person`+b0` only when both victim and incoming
  attacker are non-neutral. An environmental hit does not clear a previous
  attacker. Browser `person-update.ts:172–187` matches that local policy; direct
  HP writers and role changes still need attribution auditing.
- **Neutral:** helper ff performs no write; non-Shaman neutral victims skip both
  rows3/6. A valid owner with unknown attacker still gets own-loss row6/8.
  Wildman population deltas cannot stand in for these statistics.
- **Duplicates:** native add itself always adds. Fight and building removal,
  person retirement, and tribe `f_949` own event uniqueness. Reward row9 is
  different: per-tribe bitmaps deduplicate by category/model, even across separate
  gift objects; spell modelX and building modelX are distinct keys.
- **Interrupted fights:** `00519a70.c:47–74,87–170` / `melee-groups.ts:108–169`
  permit a survivor after separation or invalid membership to become winner.
  A win is not proof somebody died. `tests/fight-cleanup.test.mjs` already covers
  repeated turns, separation, protected-state recovery and frame schedules.
  The separate native forced-release route is not covered by those tests.
- **Death delay/respawn:** `004d32b0.c:77–79` dispatches state3 to`004d5cf0`.
  Its substate countdown and model7 allocation retry can return before increments
  (`004d5cf0.c:24–80`); `004d5fe0` and `004d4b50` govern continuation.
  Counting on first hp<=0 is not proved equivalent. Subsequent genuine Shaman
  death after resurrection is a new event.
- **Ghosts:** browser death scan excludes `u.ghost`; it also defers airborne and
  state44 people. No ghost check exists inside the inspected native finalizer.
  Native ghost removal/admission to state3 and hypnosis owner restoration are
  unresolved upstream leaves; do not claim the browser exclusion is proved here.
- **Interrupted Vaults:** count on delayed reward delivery, not approach, prayer,
  door opening or UI animation. Save before delivery must retain the reward's
  recipient, mode, category/model and remaining timer; save after it must retain
  the knowledge bits. Replayed delivery of the same bit must add zero.

## Current-format browser persistence and minimal follow-up

`game-store.ts:332–371` uses `structuredClone` on Save and Load; restart/startMission
create a new World. `world-state.ts:328` initializes the five existing metrics.
Current format is v3 (`checkpoint-format.ts:3`). The new regression tests verify
these **existing metric data** survive repeated in-session Load, are detached
from later mutations, reset on restart/new mission, and remain in the saved
checkpoint. They inject diagnostic values: no naturally earned gameplay or fresh
IndexedDB session claim. Existing fight tests separately exercise earned wins.

Proposed runtime work, **not implemented**:

1. Add a per-tribe statistics owner with ten signed counters and two unsigned
   knowledge masks to World; persist it with current-format required validation.
   If the schema changes, bump the development format and reject incompatible
   saves without rewriting stored data; no old-save backfill using casts/builds.
2. Reuse the proven ordinary row0 event boundary (avoid a second increment).
   Add row1 at the lethal melee exchange only. Add rows3/5/6/8 at one proved
   finalized death boundary with victim/model/stored-attacker captured before
   removal or hypnosis restoration; resolve ghost, retry and all damage writers
   first. Rows4/7 require a separate staged-building lifecycle patch.
3. Add row2 at the matched once-only tribe elimination latch. Add row9 at mode1
   delivery with both masks, after proving how native mode reaches each browser
   Gift. Keep unsupported rows unavailable until their lifecycle is accepted.
4. New-game/restart zero the owner; Save/Load retain counters, pending events,
   deduplication masks and retirement/latch state together. Tests must save just
   before/after each event, Load repeatedly, replay duplicate deliveries, include
   all four tribes, ff, self damage, prior-attributed environmental damage,
   mutual melee death, separation, ghosts, respawn and interrupted construction.
5. Resolve whether simulation writers stop at native outcome before deciding
   on a frozen result snapshot. Browser `stepOutcome` runs before object work,
   and the existing Page waits for the result camera; freezing on the first
   status change could miss same-turn deaths. Presentation should eventually
   receive an immutable read view whose capture point is explicit, not award
   counters from React effects. No snapshot timing parity is claimed now.

## Exact remaining leaves

- Native ghost/state3 admission, hypnosis attribution and finalizer retirement/
  allocation-failure retries (`004d5fe0`, `004d4b50` and callers).
- Forced fight release through `004ef180 →00519c90`, including stale/ff winner
  and interruption ordering, versus browser cancellation.
- Building`+af` initialization/overwrite and flags3`0x40` meaning across
  construction replacement, burning, sinking, dismantling and ordinary removal;
  pair-removal versus final attacker-credit timing.
- Complete campaign/multiplayer branch scope of row2; browser authored elimination
  routes must not credit arbitrary final attackers or repeated notifications.
- Reward mode1 producer chain into `004facf0` and equivalent Gift metadata for
  both building and spell knowledge; unsupported reward categories remain open.
- Native save restoration and end-state write gating/final snapshot: no proof of
  a counter copy or final freeze from the inspected ranges. Direct E8 discovery
  cannot prove no indirect writers exist.

These are engineering/evidence gaps, not access-denied operations. No denied
operation was retried. Parent review/integration owns any runtime task and merge.

## Verification scope

Run `npm run test:focus -- tests/result-statistics-source.test.mjs
tests/fight-cleanup.test.mjs tests/original-result-screen.test.mjs` (one command).
The new seven tests check exact retained bytes, all ten row bindings, helper
arithmetic/gates, the reviewed direct producer sites, reward masks, existing
metric distinctions and current checkpoint data cloning. They do not execute
native instructions or independently prove the complete producer lifecycles.
The existing suites add five fight regressions and six presentation regressions.

`orchestration:plan -- --base 96becd8826afc5a4256a12ccebf3caa61729e24b`
routes the general decomp index to broad campaign gates and leaves six new/topic
paths unmapped. These were explicitly reviewed as research, exact static evidence,
a stdout-only original-byte reader and a read/data-only Node test. Focused tests,
`orchestration:check`, deterministic PE re-extraction/byte comparison and
`git diff --check` are the bounded acceptance here. Full app check/build,
rendered-browser, native execution and performance gates are not run for this
documentation/test-only delivery; no runtime, UI, rendering or timing behavior
changes. Parent integration can select its final combined-tree gates separately.
