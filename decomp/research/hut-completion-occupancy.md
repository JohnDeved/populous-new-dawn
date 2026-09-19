# Hut completion, residents and occupancy-smoke events

Read-only #73 research on main `5a0c8152e421b5082b97c0e235fb878f76fd0726`.
PR114 was inspected at `727d42e6da9d98bd13cb7561df74a09a55cf6c7a` and remains
unchanged. No browser run, runtime/checker/wrapper edit, capacity change, cache
operation or asset import was performed.

## Conclusions

**Completing a Hut does not atomically turn its builders into residents.** The
building becomes admission-ready, while the construction plan and its workers
finish a separate departure/command lifecycle. Successful building-entry
admission, not build progress, writes the resident IDs and count. Former builders
can subsequently enter through normal orders; this is not a guarantee that they
remain outside or that the first rendered completed Hut will be empty.

**A completed Hut with zero occupants is a valid state.** It can stay zero across
controller visits while no one is admitted. The controller does not force a
minimum occupancy. This does not establish a permanently quiescent fixture:
orders can bring people back, and eligible birth work advances even with zero
residents. A natural completion with three occupants is not evidence that the
completion initializer itself inserted those people.

**The 32-count visit is not the only smoke producer event.** Original admission
`00407150` and removal `00407490` call `0040c4e0` immediately after changing
occupancy. The completed-building dispatcher also calls it on counter phases
whose low five bits are zero. PR114's retained presentation binding implements the
periodic path but has no corresponding immediate admission/removal reconciliation.
That is a concrete source-level timing-parity gap, separate from checker setup.
This research records it without changing production or weakening acceptance.

## Identity and bounded proof

The canonical D3D executable was read at the supplied retained game root and
verified against `decomp/tools.json` and `decomp/exports.json`:

`3a5065c7420b3fcde208bf220bc86dfbac95e025ab2492caf9c7ea5308dfbe4f`.

Eighteen primary retained Ghidra exports were hash-checked before the narrow
inspection; additional cited exports are listed in the final proof receipt.
Seven fixed windows at existing routine entries were decoded with Capstone 5.0.7,
plus the three existing building descriptors. No target instructions were
executed, no Ghidra project was acquired, and no global binary sweep was needed.
Pseudocode types/names remain inferred. Padding or bytes after a return are not
claimed as reached control flow.

| Exact instruction | Evidence |
| --- | --- |
| `004ba39a` | Writes completed building state 2; `004ba39f` invokes its state initializer. |
| `004049fc` | Sets admission-ready bit 8 at building `+0x9c`. |
| `00404c1a`, `00404c21` | Completion birth timer is cost minus 54, stored at `+0xa4`. |
| `00407463` | Admission's direct `call 0040c4e0`. |
| `0040765f` | Removal's direct `call 0040c4e0`. |
| `00403593`, `0040359a` | Completed-building periodic test `counter & 31`, then the same call. |
| `0040c521` | Reads actual occupant count as a signed byte from building `+0xa6`. |
| `0040c556`, `0040c55b` | Recognizes retained root effect models 74 and 75. |
| `0040c582` | Clears the obsolete root ID at building `+0x92`. |
| `0040c599`–`0040c5aa` | Zero has no allocation; positive subcapacity selects 75, capacity-or-more selects 74. |

Local receipts reside in `work/orchestration/worker2-73-completion-evidence/`:
`input-fingerprints.json`, `static-proof.json`, `task-contract.json` and
`outcome.json`. The frozen PR114 source hashes are retained
there. The committed note contains the decisive addresses so its conclusion is
not dependent solely on local files.

## Completion and builder release are different owners

[004ba2c0](../generated/004ba2c0.c) adds signed-short construction work at plan
`+0x96`. At the linked building's descriptor work threshold, it sets stage 4 and,
unless state changes are locked, releases the old building state, selects state 2
and initializes it. This routine does not copy plan worker slots into residence
slots or increment building `+0xa6`.

[004030c0](../generated/004030c0.c) dispatches that state-2 initialization to
[004049d0](../generated/004049d0.c). The latter establishes the completed object,
admission-ready bit, terrain/shape presentation, resets maturity `+0xa0`, and
initializes the birth timer. Its terrain repair consumer
[0040afd0](../generated/0040afd0.c) refreshes short-lived building smoke/debris
and terrain; it does not admit builders. None of these routines fills the resident
array from the construction crew.

The plan's worker slots at `+0x6a`, count `+0x9a` and linked building `+0x92` are
not the building's resident slots/count. [004b8bb0](../generated/004b8bb0.c) handles
completed-plan departure separately: it assigns task 9 where needed, waits for
applicable departure workers to reach phase 6 (task-1 workers follow the routine's
explicit exemption), clears the linked plan reference and removes the plan.
[00497690](../generated/00497690.c) performs task-9 movement/rest/turn stages and
can resume departure if its phase-6 worker is still on a building cell. It does
not call occupant admission.

[00495520](../generated/00495520.c), the command-6 body, finishes when the registered
plan no longer resolves. [00432590](../generated/00432590.c) then performs ordinary
order completion and [004366b0](../generated/004366b0.c) advances the queue. Thus a
builder may have another player order, a saved assignment, or a normal idle
continuation; 'construction completed' is not synonymous with 'resident admitted'.

A retained saved-building route is explicit: [0043d0e0](../generated/0043d0e0.c)
resolves the friendly building in the person's saved coarse cell and chooses
**command 8** for an intact completed building, otherwise **command 6**. It checks
person eligibility and allocation success. [00436d00](../generated/00436d00.c)
shows how that saved location is associated with an immediate order; ordinary
queued attachment clears it. This is conditional resumption, not proof that every
builder receives an automatic home order. The full original independent idle-home
selection scheduler is not newly reconstructed here; the acceptance route below
uses explicit entry orders instead of relying on it.

## What changes occupancy

Normal command 8 runs [00434610](../generated/00434610.c): resolve an admission-ready
building, approach/queue as appropriate, move toward the inside point, and perform
the arrival test. Its actual entry call is on an even person-counter visit when
the separately signed X/Y goal differences are each below 112. The entering and
waiting-list counters are distinct from actual resident occupancy.

[00407150](../generated/00407150.c) accepts a same-tribe person into an open building
(subject to explicit special-building exceptions), checks nominal capacity, finds
the first empty one of six physical slots at `+0x86 + 2*i`, writes the person ID,
and increments `+0xa6`. Housing uses occupancy mode 0 in
[004d80e0](../generated/004d80e0.c); the already-reviewed indoor visibility/order
handling belongs there. A full ordinary Brave admission is rejected. A Shaman has
an explicit eviction exception, so the smallest controlled smoke fixture should
use Braves rather than accidentally testing replacement admission.

Admission calls the smoke reconciler **after** those mutations in the same call.
A queued/incoming person, a builder standing in the footprint, or a reservation
alone cannot change the smoke count.

[00407490](../generated/00407490.c) finds the actual requested resident slot (or the
first real occupant when no person is specified), decrements the count once,
clears that slot and restores outside occupancy mode 1. It calls `0040c4e0` before
returning, then establishes an outside anchor/facing and a 12-building-visit entry
delay. It does not teleport the person to the door. A normal ground/work order
can release a resident through this owner; a selection click alone need not do so.
The last successful departure therefore produces zero without demolishing,
disabling, stealing or replacing the Hut.

### Birth and maturation do not supply a stable empty fixture

[00404c80](../generated/00404c80.c) advances permitted Hut birth work on every
fourth building-counter phase by `2 * (signedOccupants + 1)`. Zero residents still
contribute two. Completion seeds the timer at cost minus 54. Population eligibility,
changing costs, allocation and pending flags still apply; do not replace them with
a fixed wall-clock birth deadline.

That routine allocates a Brave and an entrance flash, then sets an outward,
cell-snapped destination. It does **not** insert that Brave into `+0x86` or increase
`+0xa6`; birth and later residence are different events. Existing birth comparisons
supply allocation/population leaves, so they do not prove all surrounding newborn
scheduling. In the current browser, newly appearing Braves can later receive
normal automatic housing; a fixed set of people guarded at the start is therefore
insufficient even when it successfully emptied the Hut initially.

## Level 1–3 thresholds and smoke timing

Canonical 76-byte building descriptors at `005a7228 + model*76` give the following
byte-`+0x20` capacities. These match the current imported rules; population support
and the six-slot storage layout must not be substituted for nominal capacity.

| Hut level / native model | Descriptor | Occupants 0 | Partial model75 | Full model74 | Retained attachment socket |
| --- | --- | --- | --- | --- | --- |
| 1 / 1 | `005a7274` | No root | 1–2 | 3 | 3 |
| 2 / 2 | `005a72c0` | No root | 1–3 | 4 | 4 |
| 3 / 3 | `005a730c` | No root | 1–4 | 5 | 5 |

Flags are `0x34be`, `0x35be`, `0x35be`; all have the occupancy-smoke flag `0x1000`.
The socket, HFX atlas, root74/root75 initialization and cosmetic RNG evidence from
PR114's retained `hut-occupancy-smoke.md` are reused unchanged. The optional
`0050c150.c` initializer export is not present in this main checkout; no fresh
initializer or socket proof is claimed by this task.

[0040c4e0](../generated/0040c4e0.c) checks local-player ownership and the descriptor
flag, then reconciles the one retained effect ID at `+0x92` against actual count
`+0xa6`. It has **no internal 32-count gate**. Existing full model74 is valid at
nominal capacity; existing partial model75 is valid only for `0 < N < capacity`.
A mismatch deletes the old effect and clears the handle. If the new count is
positive and allocation succeeds, it creates the corresponding root. Allocation
failure remains a legitimate native result, not permission to invent a sprite.

The periodic caller is [00403280](../generated/00403280.c), in the normal completed
state-2 branch, after activity, maturation and birth work, when the low five bits
of the building's own counter are zero. Admissions/removals between those visits
still reconcile immediately through the direct calls above. The periodic visit
can retry missing allocation and maintain consistency; it is not a required delay
before reacting to a resident event.

Partial smoke's existing root can temporarily be visually hidden by its effect
controller while occupancy remains partial. Root identity and visible-puff timing
must be asserted separately. A blank partial-puff frame is not evidence of zero
residents. Full smoke stays in the retained full-root mode; secondary child puffs
remain outside the original PR114 root-only scope.

### Natural upgrades are not resident-array migration

[004050c0](../generated/004050c0.c) matures an occupied eligible Hut on its 16-count
phase, adding `occupants * 8`. Zero occupants do not advance maturity. At the
native threshold it also requires the required timber; at the 128-count fetch
phase it can dispatch a resident through fetch/return/construction orders.
Successful upgrade allocates the next-level building, preserves old resident IDs
for **command-6 reconstruction assignment**, removes/updates the old building,
and starts new construction at 100 work. It does not establish a fully resident
next-level Hut by copying occupancy.

Natural level2/3 smoke checks must observe the new completed level, actual resident
IDs and current capacity after those transitions. Do not preserve a stale building
handle through native replacement, set `level` manually, or claim the old residents
are already inside. The retained browser upgrade checker explicitly seeds residents,
maturity/counters/timer and speed; it is supporting integration evidence, **not a
normal-input level2/3 fixture witness**.

## Frozen PR114 comparison: a distinct production boundary

The readable occupancy owner already emits `updateIndicator` from both
[enterBuilding and removeBuildingOccupant](../../app/building-occupants.ts).
The [live entry adapter](../../app/live-building-entry.ts) currently consumes it
by synchronizing `u.inside`/the person's building reference only.

At frozen PR114, `scene-entities.ts::updateHutOccupancySmoke` creates a state once and then
calls `stepHutOccupancySmoke`; that helper reconciles an existing state only when
crossing a 32-count boundary. It does not compare/reconcile occupancy events on
other visits. For example, an already-created empty smoke state at count 33 can
remain empty after a normal resident admission at count 34, whereas native
`00407150` invokes `0040c4e0` in that admission call. The reverse stale-root interval
exists after removals. This is a source-level observation, not a new browser run.

A checker that waits until the next 32-count boundary may prove eventual root
selection but cannot prove the native admission/removal response. The original
occupant comparator intercepts `0040c4e0` as an indicator leaf, and the prior smoke
helper comparison focused on periodic reconciliation; neither closes this live
event connection. This finding warrants CEO review of a separate event-to-smoke
presentation reservation. **No production repair is made by this research.**

## Smallest source-supported normal-input route

Use the retained successfully exercised fresh Mission1 rendered construction path
rather than guessing another map cell, a preexisting empty Hut, or a fixed resident
ID. The route below is a bound future acceptance procedure, **not a passing browser
receipt**. No browser was run for this task.

1. Through shipped controls select the existing builder cohort, place the Hut at a
   genuinely pickable/legal rendered location, and allow normal construction.
   Record its completed state, actual occupancy and builder departure/queued work.
   Do not assert that completion starts at zero.
2. Use the shipped Brave selection/Guard controls to release and hold non-cohort
   people outside. Guard only currently unguarded people: the current command
   toggles. Continuously handle newly appearing non-cohort Blue Braves through
   ordinary rendered selection or existing occupant controls; never rewrite their
   flags, paths, positions or roster. The current `guardShaman` calls the shared
   release owner and current idle housing excludes guarded people. These are
   browser fixture controls, not a new proof of original Guard behavior.
3. Observe zero actual IDs/count, no incoming orders for the target, and an absent
   root. Include a normal periodic producer visit to prove maintained absence,
   but retain the earlier removal event evidence rather than hiding its timing.
4. Send one protected, rendered Brave to the completed Hut by the normal building
   click. Require successful entry/ID insertion, not just a work target. This is
   level1 partial occupancy. Then send two more distinct Braves and require count3
   and full-root mode. Preserve the controlled IDs from newcomer guarding even
   before those people finish entering.
5. Release one actual panel-selected resident with a normal ground order and hold
   that person outside through Guard: count3→2 must produce partial. Release the
   remaining residents the same way: the final removal produces zero/absent.
   Do not use the Shaman eviction exception, destruction or a changed capacity.

For the native timing obligation, at least one real admission and one removal
must occur **off the 32-count boundary**. Inspect the next observable state without
waiting for an unrelated periodic boundary, allowing only normal render delivery
latency. A stale root on this path exposes the event hookup gap; do not weaken the
assertion to make the periodic-only binding pass. PR114 may retain its later
periodic-mode/pixel checks as separate coverage once that owner gap is addressed.

The already retained browser receipts support construction and ordinary release:
job `49a66586-c9aa-429a-b703-b18d49e7f33e` observed three people in a freshly built
Hut; job `15842be7-aa4f-48c5-9060-14fe78be14a4` guarded the initial cohort but later
saw unguarded incoming Brave89. The latter receipt does not prove Brave89's
allocation cause. Both reject fixed-fixture assumptions; neither certifies the
complete continuous-Guard route. The latest PR114 setup/checker acceptance remains
unrun or failing as recorded in its own receipts.

For levels2/3, the smallest source-supported extension is normal maturation,
timber hauling and reconstruction followed by the same actual-ID admission/release
sequence using capacity4/5. Exact successful authored higher-level fixture timing
is not established here, and no alternate mission is guessed. Do not label the
level1 route or helper sockets3/4/5 as live three-level acceptance.

## Evidence reuse, limits and next reservation

Retained construction-crew comparisons test plan departure decisions; state-change
comparisons supply old-state release/new-state initialization; occupancy comparisons
observe the indicator call; birth comparisons supply allocation/population leaves.
Their stated domains are preserved. No full original autonomous housing scheduler,
mixed-class frame order or all surrounding allocation effects are newly proved.

The useful new result is the separation of completed-building/crew/resident owners,
canonical level capacities, and direct admission/removal smoke events alongside the
32-count maintenance path. Original semantics support a completed zero-occupant
Hut, but not an assumed stable empty scene after construction.

CEO should first review the immediate event-to-smoke gap before resuming a
checker-only acceptance loop. A future reservation should connect the existing
occupancy event to the existing smoke reconciler without changing gameplay counts,
capacity, sockets, assets or RNG, then run the named normal-input route. The exact
implementation owner and integration remain CEO decisions. This note changes no
PR114 file and claims no new smoke/browser acceptance.
