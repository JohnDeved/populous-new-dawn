# Builder ground motion and canonical ownership

Issue #456, prerequisite to draft #455. This is a bounded movement/lifecycle
repair, not completion of Mission 7 or proof of original-game settlement timing.

## Evidence and old failure

The baseline is `d91c735e6262310b2afdc0ca2e0db166a14543d4`, tree
`46687e18ffcbd1f432203e2fa8af494e206bb354`.
Ordinary `createWorld(7)` plus `advanceGame(..., 1 / 12)` reached turn 5819
without supplied people, resources, orders, or terrain edits. Builder 1127's
Fetch Approach phase 24 retained target tree 146 and timer 1005. Its browser pose
was (-125.13671875, -118.47265625), stored native goal (34560, 30976), speed 82,
flags2 1109397508, flags4 536871168, heading/angle 1934, recoveryCounter 2.
The detached builder person lagged the browser pose by one compatibility step;
it was not the native, route-map, cell-map, or flight owner. The next compatibility
step cleared the path instead of visiting native obstacle recovery.

`references/fixtures/builder-ground/pre5820.v8.gz` is the complete browser world
and clock serialized with Node 24.19.0 `v8.serialize`, then gzip-compressed.
The capture ran on the clean baseline runtime. It is supplied diagnostic input
when replayed by the new tests, not an original-game execution or a new natural
acquisition under the candidate.

- Uncompressed SHA256: `806f745e4f08f85625a56bb41351a57f9ca255467d8cd77962f7c320ebf2cade`
- Compressed SHA256: `6dda1fb3bf673dc223bd60da3e76700be2cad0121ba830d09808257da664c985`
- Uncompressed/compressed bytes: 2,218,695 / 395,466
- Capture receipt and script: `work/orchestration/builder-ground/capture-world-d91.json`
  and `capture-world.mjs`, retained with the portable evidence archive.

## Native-source contract

Reviewed exports `004d32b0`, `004d42a0`, `004e6d00`, `004e9720`, `004e9950`,
`00432590`, `00495520`, and `00496750` establish preparation → reaction →
airborne marking → physics/path advancement → current-state controller.
The construction controller still runs once when physics enters flight.
Current-state transitions do not receive a second physics visit.

The existing native-derived routines retain limited turning, signed byte recovery
counters, timed steering, eleven alternating headings at speed and twice speed,
and unsupported-ground flight only after failed recovery. High-bit retry uses
the stored goal on the following preparation; explicit-facing bit 0x80 suppresses
that retry. Collision alone is not an unconditional replan.

The adapter now gives builder, route, and cell membership one physical person.
Legacy detached snapshots adopt browser position once. Registered owners retain
native position, counters, goal/destination/turn fields and route state. World
queries observe the moved position before construction runs; epilogue flag
clearing remains afterward. Compatibility movement cannot run again that turn.
An active builder flight uses this path only when builder.person equals flight.

`retainPhysicalOwner` is optional adapter-lifetime metadata, not a native flag.
Only canonical builder adoption sets it. It preserves that person after
cancellation and no-order landing; absent metadata preserves legacy flight
cleanup. Maps, aliases and this field use the existing structuredClone/IndexedDB
checkpoint format. No save-version change or native flags/RNG change is implied.

## Verification and limits

`tests/builder-ground-ownership.test.mjs` first failed on the unchanged baseline's
missing registered builder. `tests/builder-ground-physics.test.mjs` independently
composes the existing preparation/physics driver against the retained coast and
compares physical fields, rather than selecting a desired recovery position.
Controls cover turning, counters 64/65/128/255, explicit-facing retry, timed
completion, 22-probe failure, flight visits, actual public movement replacement,
construction-reference retirement, separate flight owners, public Save/Load
through collision/retry/cancel/landing, legacy cleanup, and controller RNG and
flag-clear order. Existing airborne/seated/registered-route controls are retained.
Synthetic IndexedDB tests do not replace rendered-browser Save/Load evidence.

Paired first-800-turn traces show the first gameplay RNG divergence at turn 417:
the old compatibility builder has entered Work and draws a speed, while the
native-order builder remains in Approach until 418. Shaman speed first differs
at 421. The first paid Convert cast moved from 719 to 714; task retirement moved
from 724 to 719. The paid-cast, newborn, and checkpoint lifecycle assertions pass,
but this is not unchanged timing or proven full native scheduler equivalence.

The historical unchanged 8000-turn settlement check failed and its receipt is retained. In the retained working
candidate diagnostic, the Camp completes at 6348, the Temple starts at 6473,
finishes ground preparation at 7160, and has four of eight logs at 8000. The
Temple completes at 8973 and the first natural Preacher appears at 9216; the
bounded diagnostic stops immediately. Its full resource/path/controller trace
is `first-preacher-wip5.json` and its raw stdout artifact. This later outcome is
not acceptance of the historical 8000-turn gate. Independent review found no sampled
cell/path alias violations or 1024-turn approach loop; the longest completed Fetch
Approach episode was 208 turns, and the Temple maximum was 118.

After that review, the parent approved a named **current-port 9216-turn observation**
in `scripts/check-mission7-settlement.mjs`. It is a fixed checkpoint, not a 12000-turn
poll or a claimed native deadline. Every original outcome assertion remains:
population above 30, newly trained Warrior and Preacher, completed Tower/Hut/Camp/
Temple, an upgraded Hut, and 64-turn complete-world checkpoint equality. Both
simulation-only `tick` and shipped `advanceGame` independently passed these
assertions at 9216 and the checkpoint twins through 9280 on commit b05f62a1.
The clocks are not interchangeable: advanceGame adds logical/display animation
visits. Their observed settlement outcomes match here; no general clock equality
is claimed.

No original executable was executed/emulated. No controller timeout, semantic settlement assertion,
parity claim, or Mission 19 acceptance was changed. The reviewed fixed timing
observation is the only settlement-gate revision. Full checks, build, rendered
browser and performance evidence remain separate required gates; their exact
status belongs in the source-bound receipts and PR review.
