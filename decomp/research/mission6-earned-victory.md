# Mission 6 earned CPU victory and store continuation

## Established result and boundary

A fresh Mission 6 simulation naturally defeats Chumara and Matak at turn **29504**.
The public store publishes completion 6, commits the won checkpoint and profile
through the existing **synthetic IndexedDB** fixture, and a fresh store reloads
both exactly before starting Mission 7 in `playing` state with completion retained.
This is CPU/controller and store-contract evidence. It is **not** rendered input
dispatch, real-browser IndexedDB persistence, a clicked Continue button, native
executable equivalence, or production deployment evidence. Issues #101, #8 and #11
retain those wider requirements; no parity ledger or runtime code changes here.

The independently reviewed research run used source
`4703fe29686eefaf3dad4bb4142d91c3365af1b8`. Its tree
`63fbf954ae65d1f9c6f5dcb2dc688e35bbaea7f4` exactly equals merged main
`62641038a25aa01da7c26d6e6d8bd12e4efd7bc2`.
[The compact historical manifest](https://github.com/JohnDeved/populous-new-dawn/blob/bc9cabf404240ad99b2aab8c26e9b0137cdd7702/evidence/mission6-earned-victory.json)
records all 19 successful receipts, scripts, consumed saves and produced artifacts
by SHA-256. Ignored local raw receipts/checkpoints are not bundled as portable
input fixtures; the maintained command below regenerates them from a fresh start.

## Reproduce without supplied victory state

From the repository with its installed lockfile dependencies and Node >=22.13:

```sh
npm run test:mission6-earned
```

Optionally pass a new run directory after `--`, for example
`work/orchestration/m6-earned-victory/my-run`. Existing directories are rejected,
including interrupted attempts. Run serially with other full simulation, browser
or build jobs. This is a dedicated acceptance command, deliberately outside the
default unit-test glob; do not add its roughly 29,500-turn route to every unit run.

The runner follows [the ordered stage graph](../../scripts/acceptance/m6/plan.json).
Only the first stage starts fresh. Every later save is produced earlier in the
same invocation; no external baseline is accepted. It preserves ordinary selection,
command, spell, construction, tick and checkpoint calls. Reloading an earned
checkpoint restores the whole world, without retrofitting AI tasks or modifying
positions, teams, classes, population, spell stock, health or outcome. Each resumed
stage advances original/restored twins and compares the complete worlds after each
tick. The final pre-win save is still playing, with no completed level; its last
16 ordinary ticks generate the victory and completion naturally.

Each stage gets an immutable source/input-bound command receipt with stdout/stderr,
and the run manifest retains output SHA-256 values. The runner checks a single
head/diff/shared-input fingerprint across stages and compares every consumed
checkpoint digest with its producer. Failed or interrupted stages
cannot yield a passed run. A source change requires a new full invocation. No
original executable is run and no cloud hosting or credentials are changed.

## Successful route and lessons

- Earn Convert at the authored vault and recruit real wild followers.
- Build the Warrior Training Hut and train an army; attack the Chumara Shaman and
  followers. Chumara's genuine defeat is observed at turn 12224.
- Recover the economy through constructed, occupied huts and real births. Stage
  Warriors along the authored bridge route. An initial undersized Matak attack
  fails; the checkpoint chain preserves that loss and natural reincarnations.
- Earn three Hypnotise shots, train six permanent Warriors, remove eastern guards,
  and bring the reincarnated Shaman across the cleared route. Earn and cast
  Firestorm, with ordinary Lightning/Blast and Warrior building attacks.
- Prioritize occupied huts and released Braves. AI construction needs actual Brave
  builders, while occupied huts replenish them; destroying vacant replacement
  plans first prolongs the rebuild cycle. The accepted route removes the village
  population and buildings, then pursues remaining dispersed Warriors and Shaman.
- Reissue public pursuit orders against moving survivors rather than teleporting
  units or removing opponents. Both opponent populations reach zero and the normal
  tribe/outcome loop awards victory at turn 29504.

## Store ownership and continuation

`loadCheckpoint()` replaces the store-owned world. Updating an older detached twin
would not publish completion. The final stage ticks the current owned replay,
calls `store.update()`, drains synthetic storage transactions, checks profile `[6]`,
saves the won owner, and creates an independent store to restore checkpoint/profile.
The shipped page's Continue handler chooses `world.outcome.level + 1` and ultimately
calls `store.startMission`; the acceptance exercises that store path to Mission 7.
It does not render or click the page, and does not substitute synthetic storage
results for browser persistence acceptance.

The default contract tests verify producer ordering, missing-input and overwrite
rejection, exclusive run directories, and the owned-replay/storage-boundary contract.
These cheap checks supplement, rather than replace, the dedicated gameplay replay.
