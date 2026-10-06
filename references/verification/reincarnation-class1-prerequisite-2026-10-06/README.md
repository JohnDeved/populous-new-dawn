# Class1 allocation seed: returning-Shaman prerequisite

Source-only follow-up to the live proposal at`5732cc327cadde206d00f92a58291ef5f5040208`.
That proposal is unchanged pending review. No native/app/browser/package
execution, implementation or shared-pool design was performed.

**Recommendation:** constructor-return and burst-birth field comparisons can
exclude the unrelated class1 counter explicitly. Exact **live multi-turn**
semantic/RNG/animation acceptance across the spark lifetime cannot. The shared
class1 seed and preservation of its per-person phase are prerequisites for that
claim. The accepted eleven-call native packet supplies the later Shaman
processor`004d32b0`; it does not establish full post-birth world equality.

## The two counters are different owners

The per-person byte`+2e` is copied from class1 seed`0096eac2` by successful primary
allocation, then incremented by each actual primary traversal. The animation
stamp`+18` is a separate dword tied to original`00897981`.

`app/animation.ts:83` chooses the flags3`40000` logical gate; line101 checks
`stamp === world counter`. It does not read the allocation byte. The existing
native animation proof maps `stamp` to`+18` and tests both flags3 settings
(`scripts/check-native-animation.py:42,99`). The live elapsed clock calls logical
animation after a completed turn (`app/game-clock.ts:89`), and
`app/live-people.ts:1229` stamps the source with`world.turn` before advancing.
Therefore class1 seed omission alone does not change eligibility at that gate.
An actual processor/animation-sequence handoff still matters; gating is not proof
that a newly attached person has the correct native state or frame history.

## Actual post-birth consumers

The original primary pass increments`+2e` before`004ed700`. Its real class1
call at`004ed71c` enters`004d32b0`. That processor's selected common prefix is
preparation, reaction, eligibility, physics, then Shaman follower-facing, before
its state switch. The accepted timeline explicitly supplies that class1 call.

| Consumer | Counter use and actual relevance |
| --- | --- |
| `004d32d6 → 004e6d00` (`decomp/generated/004e6d00.c:86`) | Every fourth grounded visit sets steering-refresh flag1000. Later angle/motion updates consume it. Counter differences can alter refresh timing; already-set flags can mask a particular visit's difference. |
| `004d333e → 004e0270` (`004e0270.c:44,92`) | Model7 runs on `counter&7 ==0`. With argument1, it can change one nearby same-tribe resting follower from state19/substate5,7 or8 to substate9, set entry/turn flags and point it toward the Shaman. This runs before the Shaman's own state body, including while it is still state10. |
| Empty state10 orders (`004d32b0.c:132`; `app/person-order-update.ts:245`) | No-order completion chooses idle17. State initialization can immediately enter19 in the same cell. These transitions are not counter-gated. State17 and19 descriptor flags180a each allow a real speed RNG draw before Shaman idle setup stops movement (`person-state.ts:271,292`; `person-idle.ts:134,215`). Thus a complete live post-birth RNG trace cannot simply reuse the creation-only98/32 total. |
| State17 (`004d32b0.c:194`; `person-idle.ts:96`) | `counter&15` gates a collision recheck when flags2 has800. The accepted birth flags lack800; do not claim this branch runs in the clean birth fixture. |
| Own resting state19 (`person-idle.ts:224,306,354,396`) | Model7 flag400 enters substate8, so its ordinary clean rest does not immediately take substate5's two counter&31 RNG tests. Other substates retain counter&3/31 gates. Do not attribute those generic follower gates to a guaranteed first Shaman visit. |
| Follower pose reached through `004e0270` (`person-idle.ts:344`; `animation.ts:37`) | Entry9 changes animation/turn behavior; subsequent pose completion can consume the shared cosmetic RNG. Immediate state/animation impact is source-supported; a cosmetic draw within a particular five-visit window depends on the follower's actual frame/phase and is not claimed as observed. |
| Combat scan (`004d4690.c:15`; `melee-engagement.ts:89`) | Descriptor scanMask3 gates pending scan. A clean Shaman commandStatus0 returns no response; orders28/19/4 can make the scan consequential. Current live adapters substitute world phase (`live-combat.ts:208`; `live-building-combat.ts:217`). |
| Preparation/reaction/status tails | Counter&3 preparation applies only to models with flag40; model7's1d1f lacks it. Reaction and invisibility/shield/bloodlust counter gates require flags/timers absent from the accepted clean newborn. They remain conditional consumers, not evidence they fire at birth. |

For the retained seed250 and birth on call6, actual subsequent counter bytes are
251–255 on calls7–11. The analogous current resting handoff assigns world.turn7,
then increments8–11. The counter&7 opportunity therefore differs inside that
window: the world-phase adapter reaches8 while the native sequence reaches252.
A nearby eligible follower can observe the difference. This is a source-derived
counterexample, not a claim that the supplied-body native fixture contained a
living follower or executed that consumer. At a different real birth turn the
phase relation is different; no turn-number offset is a valid replacement seed.

## Concrete live caller and counter writes

The late spawn remains`world-turn.ts:1792 → world-state.ts:364 addUnit`, returning
`native:null`. `createLivePerson` later initializes`counter=(world.turn-1)&255`
at`live-people.ts:170`. Even attaching an accurately initialized state10 person
would not preserve an allocation seed through the current idle route:

- `world-turn.ts:1473` may invoke the world-phase combat response adapter first.
- An otherwise idle returning Shaman reaches`world-turn.ts:1553..1570 → stepLiveResting`.
- `live-resting.ts:115..123` treats state10/previousState0 as a legacy handoff,
  unconditionally sets`p.counter=world.turn&255`, then initializes state17.
- Later resting visits increment the retained byte at`live-resting.ts:130`.
  Other actual owners increment at`live-people.ts:900,1119` and
  `live-movement.ts:547`; these are visits, not allocation seed advances.

The current app contains no equivalent invocation of native`004e0270` in that
Shaman path. A correct seed alone would not implement the missing follower-facing
consumer or repair mixed-class traversal. The bounded recommendation is to keep
these declared limits and stop exact post-birth-world acceptance, not to introduce
those broader changes while fixing a visual burst.

## Existing seed owners can be recovered; no live owner can yet be reused

The original reset/allocator owner is already indexed and need not be rediscovered
through a native sweep:

- `0042bfe7..0042bffe` clears12 bytes at`0096eac1`; class1's byte`0096eac2` becomes0.
  The accepted reset witness is`check-native-hut-smoke-initial-phase.py:56..61`.
  Its original instruction evidence is reusable for the whole cleared span;
  its class7 authored-contribution result is not a class1 initialization proof.
- Successful`004ed8a0` copies`[0096eac1+class]` at`004eda23/29`, then increments
  it at`004eda35` when descriptor byte1 lacks bit10. Class1 descriptor`080800`
  satisfies that condition. Owner/model do not select a different class1 seed.
- Failure reaches the allocator's failure/argument-cleanup path without copying
  or advancing the seed. Retirement/free does not rewind it. This is consistent
  with the already accepted success and three-control records.
- Secondary`004edbd0` copies the same indexed seed at`004edc55/61` without
  incrementing it. Do not convert a secondary allocation into a primary seed
  advance merely because it creates a browser effect.
- `004ec6f0` increments each visited record's byte separately; `004ed700` stamps
  the separate animation dword. Neither establishes the next allocation seed.

A recoverable shared **class1 successful-allocation ledger** is therefore the
concrete seed prerequisite. It must include authored people, later true class1
allocations and restored checkpoint history, then preserve the assigned byte
through controller handoffs. It cannot be reconstructed from surviving population,
world turn, a returning-Shaman-only counter or the mixed-class`nextId`.
This identifies ownership only; no ledger/pool implementation is proposed here.

The existing application funnel is`world-state.ts:addUnit`. Source inventory:

| Call site | Browser creation/replacement owner |
| --- | --- |
| `world-initialization.ts:149` | Authored people, including wild people |
| `world-turn.ts:1202` | Hut newborn |
| `world-turn.ts:1792` | Returning Shaman |
| `live-building-entry.ts:642` | Training conversion's trainee |
| `level-start-runtime.ts:180` | Startup wild-person conversion |
| `live-movement.ts:534` | Preacher conversion replacement |
| `spell-effects-runtime.ts:116` | Hypnotise/reversion replacement |
| `spell-effects-runtime.ts:892` | Convert Wild replacement |
| `spell-effects-runtime.ts:993` | Ghost Army person |
| `armageddon.ts:73,76` | Rebuilt Shaman/follower participants |

These are actual current app call sites, not proof that every browser replacement
has one matching native primary allocation. Each replacement's original lifetime
must be mapped before treating every`addUnit` call as a seed increment. Likewise,
`createLivePerson` is used widely for lazy adoption and must never count as a new
allocation by itself. `World` and its checkpoint path currently have no class1
seed field. Existing exports/rules supply the original algorithm, but there is
no already-correct application owner to plug into the phase5 helper.

## Decision boundary

A source/portable constructor-return comparison and corrected burst producer
remain useful and can state their supplied allocation context precisely. A
burst-only isolated timeline can retain an explicitly supplied later-person
consumer, matching the accepted native boundary. Neither is exact ordinary live
post-birth world acceptance. Keep the original proposal frozen for a decision
on that narrower deliverable versus the shared seed/handoff prerequisite.
