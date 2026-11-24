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

The initial slice kept Matak's ordinary producer active for one post-tower Hut request.
The request occurs on turn 124 and waits at phase 0 while the browser's slower first
Guard Tower finishes, preventing the later Hut site leveling from invalidating that
tower plan. It then reuses ordinary site selection, builders, timber, completion,
housing entry, and both Hut upgrades. Checkpoint continuation is compared with an
untouched control through level 3, and the shipped Mission 10-to-11 browser path
renders both Guard Towers and the level-3 Matak Hut.

Chumara housing remains deferred. Further Matak housing is bound by the continuation below. Native opcode 1082
dispatches to reviewed export `004e5530`, which requests a model-4 task from its
packed coordinate with field `extra=1`. Mission 11 first reaches `BUILD_AT(120,166)` in the Matak block
scheduled for turn 253, but it also requires an existing model-3 Hut. Native Hut
maturity through reviewed routine `004050c0` needs at least 1,584 turns for model 1
to reach model 2 and another 1,184 turns for model 2 to reach model 3. Binding that
first BUILD_AT tower is documented in [mission11-exact-tower.md](mission11-exact-tower.md);
`extra=1` preserves the script origin but still uses ordinary spiral site selection.
Production profiles, attacks, objectives, victory, and natural completion remain
deferred. No parity ledger status changed.


## Continued ordinary Matak housing

The port-only `mission11HousingRequested` latch stopped Matak forever after one
Hut even though the original target is20. The continuation removes this latch
from production admission and allocation. It does not enable Chumara housing,
additional schools, Tower replacements, training, later raids or victory.
The existing wait for the first pending Tower to complete remains unchanged.

Native `004e5580` repeatedly reaches `004f5ed0` whenever capacity is below its
housing target and concurrent construction tasks are below attribute9. Original
`004f6520` counts completed building owners and class9 plans but not unfinished
class2/state1 Huts; that distinction is now used for M11 too. Original
`004f67b0` counts people with state flags8, zero assignment byte `+af`, and a
non-Shaman model. The M11 Matak binding requests the raw native source from
`computerSelectionWorld`, so moving state10 records cannot become synthetic idle
state17 merely because they lack a selected animation source. Existing browser
busy exclusions remain; housing-order/training availability does not substitute
for idle builders. Controlled tests distinguish native states10/17 and assignment
bytes. The worker-count native probe does not prove the full live selection mapping.
The established construction base, including zero, supplies subsequent requests
rather than recalculating origin from the current Tower pose. No new save fields
are introduced. A historical port-only latch bit in a current-format checkpoint
no longer blocks later housing.

`scripts/check-native-mission11-growth.py` verifies the pinned original executable,
original M11 header and cpscr022. Native post-load header setup, knowledge masks,
complete startup script, availability leaf, owner-capacity traversal, producer,
admission and task writer execute. **Only `004f67b0`'s available-worker result is
supplied**; linked Tower/Hut owners are controlled fixtures, not a natural original
settlement. Ten cases prove repeated requests, one/six/seven completed Huts,
capacity equality, unfinished exclusion, four-request concurrency limit and
zero/one/two worker boundaries. RNG remains unchanged in the capacity cases.
This is not whole native queue/order/timing equivalence.

Ordinary browser-model evidence uses unmodified `createWorld(11)` and
`advanceGame` at1/12 second, with no injected actors, resources, orders, turns or
player actions. The previous bounded runtime had one completed Matak Hut and
population9 at3000. The changed run has five completed Huts, two underway and
population15 at3000, with both original Guard Towers intact. These are observed
port results, not original timing or performance claims. A checkpoint at256
matches the complete uninterrupted World through3000, including clock animation.

The earlier opening test hardcoded the one-Hut slice's first large-Hut/BUILD_AT
turn4605 and exactly four final building owners. Continued growth legitimately
changes those conditions. It now discovers the first successful actual BUILD_AT
request, asserts its original EVERY255 cadence, requires an actual model3 Hut,
retains its native coordinates/placement/phase assertions, tests failed-plan
no-retry behavior, and compares full checkpoint continuation after the request.
The qualifying Hut's identity is captured from the actual owner, not a mutable
old task slot that can now be reused for later housing. Tower-loss assertions
still prohibit the unrelated replacement path.

`tests/mission11-growth.test.mjs` separately checks native capacity/worker gates,
old latch independence, base-zero ownership and the ordinary expansion episode.
No parity status, imported asset, generated export or expected pixel is changed.
Full check/build, original complete gameplay, local rendered visuals/persistent
browser Save/Load, and hardware performance remain not-run for this draft.
