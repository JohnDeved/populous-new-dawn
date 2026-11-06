# Inactive Help building-knowledge reader

Refs #741 / draft #744. This adds a read-only adapter, not live Help activation.
The accepted article/scrollbar checkpoint `4ef9f187` remains separate evidence.

## Native distinction

The verified `d3dpoptb.exe` SHA256 is
`3a5065c7420b3fcde208bf220bc86dfbac95e025ab2492caf9c7ea5308dfbe4f`.

- `00425110..00425132`: the Help building predicate reads the signed current
  player byte at `0089c6f0`, then tests `1 << model` against that player's DWORD
  at `0096070e + player * 56`. No count, affordability, placement, temporary
  enable/disable mask or campaign-completion test participates.
- `00486160..004861b3`: initialization zeroes the runtime records and copies
  fourteen DWORDs from the first level-header record at `0089b741` into
  `0096070a`. The initial building mask is header bytes 4..7, little-endian.
- `00408e30..00408e4f` ORs the supplied model bit into the selected player's
  current mask. `00408e50..00408e83` clears it (and the corresponding two
  secondary masks). Thus an initial header is not a current-knowledge snapshot.
- The already retained [follower knowledge trace](follower-class-button-visibility.md)
  and Vault payout proof also establish the reward write at `004e4fff`.

Four new bounded static spans preserve 203 original bytes. The external
`native-help-building-discovery-evidence-20261022/evidence.json` SHA256 is
`6f830a5d477ba4c7782472dced17794afca4871bdc724127ff5ecea2e0646a70`.
It binds the EXE, disassembler, relevant browser sources and all 24 existing
imported 56-byte profiles. This slice did not execute the EXE or freshly verify
the original complete 616-byte header files. It reuses the generated level
imports and their existing provenance rather than regenerating them.

## Actual browser owners

`world-state.ts` initializes seven player-0 fields through
`missionAllowsBuilding(missionNumber, model)`. `world-turn.ts` gift payout changes
those same fields; the current gameplay buttons and placement dispatcher read
them. The current checkpoint stores/clones World rather than recomputing these
answers from a profile.

| Native knowledge model | Current World owner |
| --- | --- |
| 4 | unlockedTower |
| 5 | unlockedTemple |
| 6 | unlockedSpyHut |
| 7 | unlockedCamp |
| 8 | unlockedFirewarriorHut |
| 13 | unlockedBoatHouse |
| 15 | unlockedBalloonHut |

`readHelpBuildingKnowledge` reads these exact booleans on every call, without
caching, mutation or a new save field. Its `known` answer is explicitly labeled
`browser-current-unlock`, not an assertion of complete native producer parity.
It rejects malformed input and does not use player-0 fields for another player.

The native Help table has 18 building-gated topics, using nine distinct model
arguments. These seven owners cover 16 topics, including the training-building
gates on specialist follower articles. Follower population is irrelevant.

## Explicit current-state gaps

There is no owned Hut1 or GuardPost17 knowledge field. GuardPost is also absent
from the current BuildingKind/BUILDINGS representation. The live reader returns
`unsupported`, never unavailable/available guesses, for both bits. A missing
knowledge owner is not the native failed-link result that redirects to topic1057.

The separate `readHelpInitialBuildingProfile` reads the bound World's actual
`outcome.level` through the existing mission API. Its result is labeled authored
INITIAL player-0 profile and cannot be passed as a complete HelpDiscovery mask.
It is not a fallback for those two missing live owners:

- Hut1 is initially absent in Mission22 (mask `fffc0001`). It is initially
  present in the other 23 imported profiles. The current Hut button's lack of
  an unlock check does not establish native knowledge.
- GuardPost17 is initially absent in Missions1,3,4,12,15,22 and Tutorial79;
  it is present in the other imported profiles.
- Earlier mission completion does not override the current mission's authored
  initial profile, and a current gift change does not rewrite that profile.

Spell discovery remains outside this bounded adapter. Native `0089d17c` maps
to the existing `manaWorld.gameFlags` owner, not its similarly named levelFlags;
spell stock/definition/player ownership still needs its separate exact mapping.
Nothing here changes the existing pure predicate, World, saves, HUD or input.
Actual Help activation, complete discovery collection and rendered validation
remain pending. The new focused tests and strict type gate must be reviewed and
run on the exact successor before claiming terminal acceptance.
