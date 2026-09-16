# Mission 11 first Matak housing expansion

## Native contract

Matak tribe 3's ordinary construction producer runs when
`(turn + signed tribe + 1) & 63 == 0`, at turns 60, 124, 188, and 252. After
the turn-60 Guard-Tower task has an accepted model-4 owner, the turn-124 call to
native `004e5580` requests one model-1 Hut when at least two Braves are available,
active construction tasks remain below attribute 9 (`4`), housing capacity remains
below attribute 10 (`20`), and Mission 11 enables model 1.

The allocation uses the current base cell as its origin and writes
`flags=1, type=0, requested=1, exact=0, phase=0` into the first free task slot.
The intercepted base cell was `0xda7a`; terrain selection must be proved through
the live browser path. The allocation consumes no RNG.

## Live integration and boundary

Mission 11 now keeps Matak's ordinary producer active for one post-tower Hut request.
The request occurs on turn 124 and waits at phase 0 while the browser's slower first
Guard Tower finishes, preventing the later Hut site leveling from invalidating that
tower plan. It then reuses ordinary site selection, builders, timber, completion,
housing entry, and both Hut upgrades. Checkpoint continuation is compared with an
untouched control through level 3, and the shipped Mission 10-to-11 browser path
renders both Guard Towers and the level-3 Matak Hut.

Chumara housing and further ordinary housing remain deferred. Native opcode 1082
dispatches to reviewed export `004e5530`, which requests a model-4 task from its
packed coordinate with field `extra=1`. Mission 11 first reaches `BUILD_AT(120,166)` in the Matak block
scheduled for turn 253, but it also requires an existing model-3 Hut. Native Hut
maturity through reviewed routine `004050c0` needs at least 1,584 turns for model 1
to reach model 2 and another 1,184 turns for model 2 to reach model 3. Binding that
first BUILD_AT tower is documented in [mission11-exact-tower.md](mission11-exact-tower.md);
`extra=1` preserves the script origin but still uses ordinary spiral site selection.
Production profiles, attacks, objectives, victory, and natural completion remain
deferred. No parity ledger status changed.
