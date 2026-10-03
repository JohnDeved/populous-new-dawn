# Mission 8 natural campaign acceptance: bounded partial route

## Status and ownership

**Natural Mission 8 victory and Mission 9 continuation are not proved.** This is a
new, fail-closed acceptance path, not a production feature, full Mission 8/PND08
completion claim or permission to patch a shared subsystem.

The branch starts from main `6f1d27ca144a0ffcb4de546af08af3b937eeb02d`.
Only the new mission-specific browser checker, two portable source/land-order tests
and this note are owned. Production, assets, original data, all existing checkers,
parity ledgers and excluded/open-PR scopes remain unchanged. No training, worship,
vehicle, audio, follower-HUD or Mission 6 implementation is included.

Five campaign candidates were compared against GOAL and current PR/handoff/dirty
worktree ownership. Mission 8 was selected over the larger Mission 11 natural
battle, Mission 13 transport dependencies, unproved Mission 19 warning producers
and the excluded Mission 10 Totem/Boat route. The local selection receipt retains
the exact exclusions; no parked worker's source is reused as an unowned task.

## Authored input and retained engine evidence

The original `levels/levl2008.dat` was read from the supplied base-game root and
matched the imported source SHA-256:

`d0137f2a58736912598e62130e547051313f41cda1467a2c1d6affbae24622e1`.

`app/level-eight.ts`, `app/mission-data.ts` and `createWorld(8)` supply:

| State | Authored/live starting value |
|---|---|
| Blue party | Shaman 241 at (-59,79), six Braves 129-134 at (-59,77/81) |
| Dakini | Shaman 242 at (-17,-33), Braves 123-128, Warriors 2/3/331/332 |
| Counts | 7 Blue, 11 Red, 112 Wildmen |
| Transport/buildings | Zero vehicles and zero class-2 buildings |
| Spell stock | Four Blast shots; other stocks initially zero |
| Worship | Three existing sites, ids 1/57/119, all uses zero |

The portable preflight verifies the original source identity and an ordinary land
path from Blue toward the Dakini settlement. The two committed tests bind the
source roster and a normal group land order without assigning positions, health,
stock, terrain or outcome fields. `findPath` returning a path is supporting
controller evidence only; it does not prove rendered targeting, traversal or battle.

The generic outcome contract is retained in
[Defeat and victory decisions](../README.md#defeat-and-victory-decisions): the
`00418e30`/`app/tribe-turns.ts` comparison covers the original decision routine,
including the normal population/phase conditions and supplied outcome consumers.
[Campaign progression](campaign-progression.md) distinguishes the in-memory
completion snapshot from browser Continue and original disk saves. Those proofs
are reused, not newly executed. The previous `check-browser-mission8.mjs` uses
injected preceding victories and later actor/health fixtures, so it is not evidence
of this natural path. Firewarrior acquisition/graphics remain in their existing
[bounded note](firewarrior.md); this new route does not train or worship.

## Checker contract and actual observations

`scripts/check-browser-mission8-natural.mjs` starts Mission 8 with the shipped
selector, clears selection with Escape and selects the original party using the
portrait and class control. It obtains camera movement through the shipped Dakini
focus button and actual minimap clicks, then requires a real empty terrain hit
and accepted land routes. Player combat intent is issued through actual person
clicks and the existing Blast card, never direct command/cast calls in the browser.

QA holds presentation RAF and advances ordinary `tick(world,1/12)` calls only
after intended dispatch is proved. Each planned batch is compared with a cloned
control. Camera settling uses the existing presentation update method; that is a
disclosed test shortcut, not native GPU or hardware-performance evidence.

The remaining fail-closed assertions require staging, pre-battle checkpoint load,
ordinary combat, actual Red extinction and victory, the result camera/Level Won,
real Continue to Mission 9 and a fresh-page checkpoint. The checker additionally
requires zero worship uses and no constructed buildings. None of the unexecuted
assertions below is claimed to have passed.

| Attempt | Exact head / job | Observed stopping point |
|---|---|---|
| First authored browser | `85cecb64bbc1fd144b94018a9ac506f8baa2a1d2`; `bfdee5ec-813d-428a-83ef-c62a3d58b885` | Authored turn-zero roster and exact seven-person selection passed. A single minimap click could not expose the distant staging point. No move or accelerated tick occurred. |
| Faction-focus checker | `5323b04e8d8b798ab117524c18fb0f758310ca36`; `d14b7af1-6dfd-4dd3-932d-31eaa8d481df` | Real Dakini focus/minimap navigation passed, preserving the party and turn. No genuine empty-ground hit was found within the narrow search around (-41,-33). No move or tick occurred. |
| Bounded exposed-ground checker | `6d318096a435eb4e747a0c931b771b00d73569d1`; `71a2a203-1df8-44dc-b57e-663c28e87c32` | **Checker did not launch.** The supervisor parsed an empty `PND_QUEUE_PORTS`, although the queued spec declared port 4343, and stopped before server/checker creation. |

The current checker now searches nearby exposed terrain within 12 world units of
the player-chosen staging area and retains the actual picked destination for the
unchanged dispatch/arrival checks. This follows the existing Mission 4 ground-hit
approach rather than inventing an entity or bypassing picking. Entity picking,
party, full paired-state, checkpoint, stock and victory requirements are preserved.
**That last ground-target correction has syntax/lint checks but no executed browser
result.** Its failure path records projection, actual ground pick, obstruction and
viewpoint so the next observation has a specific boundary.

## Startup failure, cleanup and denied operations

The third raw command receipt records the exact supervisor assertion:
`Queue job must declare the POPULOUS_URL port only`, actual `[]`, expected `[4343]`.
The source guard runs before ownership-map construction and any server/checker
spawn. No server log or checker output directory existed. The recorded command
PID/group 36160 was absent, both IPv4/IPv6 port bind checks passed, and the owning
worker wrote the supported no-detached-resource cleanup receipt. The existing
queue `recover` command then exited 0. No process-name kill, stale-lock deletion,
manual port override or shared tooling change was used.

The controller/source-version reason for the missing environment value was **not
fully reconstructed**; it must not be presented as an established defect in a
particular worker's PR. The preserved failure is a startup environment boundary,
not a gameplay assertion failure or native terrain/pathfinding diagnosis.

Two separate operations were safety-denied: creation/submission of a scratch
controller-battle probe, and preparation of a post-recovery browser submission.
Neither was retried or rerouted. The scratch battle program remains unexecuted and
is not evidence. Previously denied #21/PR120/PR128 reads were not attempted.
Independent portable checks, evidence publication and final closeout remain valid
work under the repository's scoped-denial policy.

## Minimum continuation and acceptance

Keep one checker owner. First verify that the standard queue controller supplies
the job's declared port to the unchanged supervisor. Do not bypass its guard.
Then execute the current checker at its exact published head. Stop at the first
observed ground/dispatch/traversal/combat fault and bind its owner before any
production reservation. A missing rendered hit alone does not authorize changing
projection, terrain, units or selection.

Only after the unchanged natural victory/Continue/checkpoint assertions run may
this branch be marked gameplay-green. No production repair is currently justified,
and no full Mission 8 AI, specialist/training, failure branch, worship or release
gate acceptance is credited by this partial route.

## Verification and portable review evidence

The local packet is `work/orchestration/worker1-mission8-natural/`. It retains
selection/contract/freeze records, original-source preflight, both browser failures,
the third raw startup failure, explicit cleanup observations/recovery and denial
notes. Final focused/format/ESLint/aggregate results and exact publication OIDs
are attached separately rather than predicted here.

README TypeScript workflow is applied proportionally: no maintained TypeScript is
changed, so application-wide formatting and Oxlint repair are not part of this
slice. New JavaScript files receive syntax, formatter and ESLint checks; the
repository aggregate is a separate gate, not proof of a natural victory. No native
CPU run, original-save capture, asset generation, parity recording or performance
measurement was performed.
