# Person allocation and primary-visit clocks

Issue 29 candidate. This changes a person-clock producer and its live ownership,
not formation geometry, RNG algorithms, training capacity or entry rules.

## Native law and limits

`decomp/generated/004ed8a0.c` copies the per-class allocation byte into a newly
acquired record and increments it before model initialization. Class 1 shares
that byte across models and tribes. It is independent of IDs and other classes.
`004ec6f0.c` caches the next primary-list link, increments an active record, and
dispatches its state. Allocations prepended during traversal are not subsequent
members of that traversal. Its secondary traversal is separate.

Fresh browser worlds model the reset class-1 byte as zero, then consume it in
their existing authored/live creation order. This is not proof of full original
startup order or an exact Mission 3 conversion-wave seed. The independently
reviewed conditional Mission 3 constructor ledger's 52 person allocations are
evidence of the local law, not a product constant or a save-migration seed.

Successful person births are authored `addUnit`, startup/Convert Wild,
preaching, training, Hut birth, Shaman respawn, both Hypnotise directions and
Ghost Army. Relevant retained native callers include `004d7fd0`, `004d83b0`,
`00405b80`, `00404c80`, `00514240`, `004d92b0`, `0050eb00` and `0050d1a0`.
Ghost Army's spark is a different class. Adapter construction, route probes,
registration, selection and orders consume no person allocation byte.

Armageddon is an explicit exception. Native `00477890` retains an existing
Shaman while the browser reconstructs the whole census; `00477060` also has
earlier birth effects. Before that operation the entire world permanently
switches to the legacy clock policy. It does not reset or resume an invented
allocation history. Restart/new mission creates the new policy afresh.

## Ownership and scheduling

`World.personClock` owns the allocation byte; `Unit.personCounter` owns each
person's retained byte. Native, flight, entry, builder, fight, resident and route
records project it. Detaching all those adapters does not erase the clock.
No rendering/input/query/registration operation advances it.

A synchronous primary epoch snapshots actual Unit identities before status,
effect, building and startup births. Existing browser dispatch order is retained.
Removed/replaced identities and new births cannot receive a stale scheduled visit.
The epoch-local visited set coalesces physics/state/route substeps, not all work
at the same world turn. Standalone controller steps remain explicit visits.
No class-1 secondary dispatcher currently exists in the browser: the secondary
effect allocator/clock is unchanged and is not subjected to this set.

The policy counts living active native states including casting, reserved,
training and vehicle states, plus living legacy/Wildman controllers. State zero
and cleanup-only dead actors do not dispatch; dead flight, Tornado state24 and
electrocution state44 do. A valid housed resident retains its active lifetime
clock without gaining a movement, animation or cell-list owner. Unrepresented
or invalid inside ownership is not used to invent an active record.

The resident source chain is `432590 -> 4e32a0 -> 4d2740 -> 4d6f90`: an inside
person enters state21. Hiding through `4d80e0`/`4ee4f0` and freeing a route do
not remove it from the primary list. Admission `407150` and removal `407490`
keep the same person pointer, so neither operation allocates or reseeds it.

Startup's Shaman mirror projects the same visit, including suspended casting.
Hypnotise expiry is a person epilogue, after formations and the person's state
body, not an early extra visit. Its duplicate status byte projects the person
byte; duration retains its modulo-eight source gate. Defeated-original-tribe
clearing precedes that gate. Deferred contacts and burning snapshots validate
current Unit identity after an expiry replacement.

Native housed expiry calls `4d9403 -> 4ef180`, whose class-1 cleanup dispatches
`4ef1ce -> 4d4b50`; the inside-flag branch calls `4d4bb1 -> 407490` with the
same person. New-policy replacement therefore releases its actual slot before
discarding task/resident storage. Legacy-mode behavior remains separate.

## Checkpoints

New saves retain the complete clock metadata and graph aliases. Unit bytes are
authoritative over parked adapters, including the Hypnotise phase mirror.
Incomplete new-policy metadata is rejected. Old saves without the metadata stay
entirely legacy through subsequent births and further save/load operations.
There is no per-Unit migration and no inference from IDs, surviving population,
current adapter counters, or mission size. The existing checkpoint version stays
readable. Restart is the explicit transition back to a fresh allocation policy.

## Evidence and acceptance

The actual-caller RED starts ordinary Mission 3 and uses normal ticks: its first
five same-turn replacement owners all have counter17 on the original app. The
same test passes with distinct allocation phases and retained reconstruction on
the candidate. It assigns no entities, phases, seeds or turns.

Supporting tests cover wrap, other-class interleaving, adapters, removed/new
membership, separate passes, active/dead/resident branches, Hypnotise marching
ordering and deferred cleanup, old/new saves, restart and Armageddon boundaries.
Training fixtures assert both birth (flag16, shared order/refcounts, no visit or
route initialization) and exactly the next eligible visit (one increment and
real initialization), retaining their original eventual movement/cleanup checks.
Timber fixtures observe reservation64 at its actual creation, followed by exact
scenery decrements, retaining the same-tree race and reserved-tree exclusion.

At the current source snapshot, the focused 16-file run passes 152 tests,
including the unchanged complete Mission 2 replacement scenario. Earlier failed
receipts are retained. Full checks/build, fresh code review and the ordinary
trusted-input rendered Mission 3 witness remain required. This candidate is not
yet accepted for integration and does not establish original pixel parity,
complete startup parity, or resolution of issue 29.
