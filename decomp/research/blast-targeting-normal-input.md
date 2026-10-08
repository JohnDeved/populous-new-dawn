# Blast bit-clear input identity chain

Issue [#74](https://github.com/JohnDeved/populous-new-dawn/issues/74), research base
`e649af3c51be5e1f6131809c900789b607ef7fb2`, 2026-10-07. This corrects the input
classification in [the earlier Blast note](blast-targeting.md). It does not change
runtime behavior or claim original execution, browser acceptance or parity credit.

## Result and proof boundary

The shipped binding for spell-mode **left release with game flags bit 0x20 clear**
selects `004aab80` cases `0x6a/0x6b`. These are spell commands, not the contextual
order branch. They explicitly pack the picked object identity, and the matching
`0x4f/0x50/0x51` consumer passes it into spell `+0x6a`. The retained Blast
consumer then follows that identity. The static identity chain is established
for this branch independently of the unresolved special `0xc4/0x84` path.

Fresh Mission1–3 header loading now supplies the mode setup, independently of
browser defaults. `00485660` reads the selected `LEVL2nnn.HDR` into `0089b741`.
The three Component0 headers were recovered as data; each is 616 bytes and its
hash matches the retained `app/level-one/two/three.ts` header hash. Their byte98
is **zero**. This is `level_hdr_mem.level_flags` at `0089b7a3`, read by upper
loader `0042c790`. `0042b230` clears game flag `0x20` at instruction `0042b2de`.
Its later setter gate at `0042b501..0042b518` requires both `land_flags_1 & 8`
and header byte98 `& 8`; these headers exclude that setter regardless of land
flags. Retained `00486160` copies spell/start data without changing byte98.
This supports the bit-clear branch on this fresh header-load path. It is not
an original boot/menu run, a savegame restore proof, or proof that no later
explicit command changes modes (`0043e8e0` command0x83 calls setter0041c140).
The browser fresh-state producer independently agrees:
`app/world-state.ts:172` initializes `manaWorld.gameFlags` to zero.

The earlier note's `0xc4` expression still only preserves pre-existing payload
bits. Nothing here claims that branch assigns the clicked ID. Its missing
`004c2100/004c3230` routines were not inspected and the held preflight was not
retried. Its unresolved transport does not erase the distinct bit-clear branch.

## Bounded source-bound evidence

[The byte report](blast-targeting-normal-input.json) preserves canonical EXE
SHA-256 `3a5065c7420b3fcde208bf220bc86dfbac95e025ab2492caf9c7ea5308dfbe4f`,
size 2,275,840, Component0/source-manifest identity, exact virtual/file offsets,
byte-window hashes and hex, GNU objdump 2.44 disassembly, and reused export hashes.
The executable and archive themselves are not included. Mapping is
`section.fileOffset + VA - section.virtualAddress`. Decode each reported window
with the recorded objdump command; it reads the PE as data and never runs it.

Only file reads, standard-library PE parsing, static objdump and the bounded
data-only header extraction were used. All 22 reused exports matched
`decomp/exports.json`; header recovery used the existing maintained extractor
and parser environment. No installer, native execution/emulation/probe, Ghidra,
browser, build, dependency installation, fixture or asset recording ran.

## Binding, producer, packet and initializer

1. `004aa1c0` receives mouse events, builds modifier bits (Shift1/Ctrl2/Alt4),
   maps press/release to lookup events 1/4, calls `00489470`, then `process_cmd`.
   `004891d0` loads 12-byte records at `005d5de8`. Lookup `00489470` matches
   `record.event & 5`, modifiers, predicates and existing interface gates.
2. At `005d628c`, bytes `f06a0000000c0000e0ef4f00` are scan240 (left),
   action `0x6a`, event12 (release), modifiers0, gates0, predicate `004fefe0`.
   `005d6298`, `f06b0000000c0200e0ef4f00`, is action `0x6b` with Ctrl2.
   `004fefe0..004ff027` requires `0089d17c & 0x20 == 0`, valid map-point bit
   `0087cabc & 1`, mode `0089c6e7 == 13`, and positive `004c24f0` validation
   using selected spell `0089ce81`.
3. In contrast, `005d6268`, `f0c400000009180030f04f00`, binds action `0xc4`
   to press/event9 and predicate `004ff030`, whose first branch requires
   `0089d17c & 0x20 != 0`. It cannot match the bit-clear release above.
4. `004aab80:883–945` handles `0x6a/0x6b`, checks readiness and chooses a spell
   command (`0x51` on its readiness3 path). It picks `unit_index_1` first, then
   `unit_index_2`, excluding class10/model16 on the fallback. At lines919–921,
   the high word contains **picked ID & 0x7ff**, plus selected model shifted11.
   The point is the object's current X/Y or the ground point for ID0. After
   point validation it calls `set_tribe_command` with that payload and point.
5. Static packet writer `00479cf0..00479d65` retains the full payload at packet
   `+4`, point at `+8`, command at `+0xc`. Its tables route `0x4f/0x50/0x51`
   to the ordinary empty-slot gate. Disabled/occupied slots can reject a write;
   acknowledgement alone does not establish allocation success. Later queue
   scheduling/network ownership is not reconstructed or executed here.
6. `0043e8e0:690–729` consumes those three commands. It reads the same `+4/+8`
   fields, obtains the model via highWord `>>11`, stores `highWord & 0x7ff` in
   allocation record `field1_0x4`, advances that record and allocates class11.
   In the unsuppressed successful-allocation branch, original instructions
   `004eda87..004edaaa` transfer the pending flag to unit `flags2 & 0x400` and
   call **`004ed580` at `004edaa5`**. Its class11 table entry at `004ed630`
   points to `004ed5e7`, which calls `004c14c0`. The allocator pseudocode name
   `init_unit_class` is misleading here: do not resolve it as the separate
   `004ed640` state dispatcher, whose class11 leaf `004c1930` is simply RET.
   `004c14c0:32–45` consumes the record under flag `0x400`, writing its `+4`
   low16 to spell `+0x6a`; without a supplied record it writes zero. Allocation
   failure/suppressed initialization is not a successful identity-transfer case.

This distinguishes identity from position and ground aim from direct aim.
It does not imply nearest-person aim assistance or an enemy-only filter.
The original mouse/panel event-to-mode producer and complete queue/allocator
composition have not been executed. Existing contextual target checks cover
another packet family and are not substituted for this static chain.

## Target lifetime, impact and HUD consumers

- `004c1d10:39–59` validates spell `+0x6a` every visit. Deleted (`flags_2 & 1`)
  or class-zero targets clear the ID. Valid targets refresh the spell X/Y/height
  destination when descriptor high byte `005a80eb + model*0x3e` has bit `0x40`.
  This is full-word flag `0x4000`. Blast/model2's verified flags are `0x44bf`.
- At firing, `004c21e0:21–44` copies identity to shot `+0x98`, sets following
  bit `+0x6e & 4`, and retains the parent spell destination/identity. Before
  subtype4 Blast motion, `004bae30:11–25` refreshes shot `+0x76/+0x7a` from a
  valid target or clears its ID while retaining its last destination. Motion
  `004bb440` uses that destination. No replacement search appears here.
- The **parent spell** also keeps refreshing its destination while waiting for
  its shot. `004c1d10` phase2 creates impact effects from the parent fields only
  after the shot is invalid. Do not assume first arrival freezes the damage
  point. The exact moving-target arrival/deletion/impact scheduling still needs
  a composed witness, separate from this static field trace.
- Loss/deletion clears each owner's identity at that owner's next visit and
  preserves its own last destination. Screen visibility, allegiance change or
  distance from the mouse are not native invalidation tests. Container behavior,
  object-slot reuse and complete mixed-class ordering remain unproved. Do not
  truncate browser IDs to eleven bits; retain actual browser identity semantics.
- `004aab80:933–945` records the clicked ID in acknowledgement `0089bc20` for
  five frontend visits; only ID0 allocates ground marker class7/model`0x3d`.
  Normal action `0x6a` exits spell mode; Ctrl `0x6b` retains it.
- `0046e030:60–79` permits enemy highlighting in modes12 **and13** under the
  existing interface gates. `00467130:74–89` queues eligible hovered-person
  brackets, `00475730` emits polygon type`0x17`, and `004673b0:2123` dispatches
  `00475860`, which alternates thicker acknowledgement brackets for the same ID.
  Existing `check-native-pointer-brackets.py` independently proves geometry and
  five-visit expiry; it was not rerun and does not prove the composed spell click.

## Current public path and smallest port reservation

The source below is the exact stated main base:

- `app/page.tsx:1079` real spell button sets `world.mode`; key1 also selects Blast.
- `app/scene-input-runtime.ts:353–369` disables person/mixed-object picking in
  all spell modes, passing terrain to `cast`. The contextual path at379–382
  owns marker/ack feedback, absent from the spell branch. `updatePointerFrame`
  (727–733) and `drawPointer` (671–678) also suppress spell-mode brackets.
- `app/live-command.ts:376–441` validates the point, stock/readiness and range,
  then passes only `Point` to `beginCast`. `app/spell-casting.ts:408–447` snaps
  it through the existing AI-style cell-center adapter and creates a point-only
  `Projectile` (`app/world-types.ts:131–146`).
- `app/spell-effects-runtime.ts:456–545` uses fixed `shot.destination`. Arrival
  at495 later calls `finishCast(..., shot.target)`; line1109 creates the Blast
  wave at that separate point. Changing visual destination alone would leave
  damage at the old point. `app/game-store.ts:migrateCheckpoint` must preserve
  legacy point-only projectiles when target identity/state is added.

Reserve Blast-only direct **person** picking/ack/brackets, optional cast identity,
windup/shot/parent-impact target state and checkpoint defaults together. Use the
actual native person/flight pose and height. Explicitly leave mixed-object
direct targeting open if that broader roster is not implemented. Do not add an
enemy-only rule, new aim assistance, blanket spell homing or a picking/HUD rewrite.
Keep stock, mana, range, ownership and RNG rules. Ground casts stay identity-free
and keep the current point adapter; its cell-center difference from the native
normal producer is pre-existing and is not awarded exact-equivalence credit.

## Proposed failure-first checks and ordinary moving-person witness

These are proposed acceptance, not checks run by this report.

1. Fail on the baseline through a real Blast button/key and actual person
   pointer hit: no hovered identity/brackets and a point-only projectile. A
   helper-only target assignment is not this failure-first witness.
2. Reuse the natural Mission2 route in `tests/mission2-raid.test.mjs`: public
   Mission2 entry via `scripts/local-render/harness.mjs:openMission`, ordinary
   camp construction at `(-99,-105)`, training eight Blue Warriors, combat
   earning Blue-on-Matak kill credit, then withdrawal to `(-80,-108)`. Observe
   the authored two-person raid's original IDs through approach/shared attack.
   Supporting original scope is `mission2-matak-raid.md`; the existing route is
   a natural gameplay/model test, not an already completed pointer Blast test.
3. Use real selection/ground commands to bring the surviving Blue Shaman within
   range of a living, moving outdoor raid member, with naturally available
   Blast stock. Record ID, member/task/order, turn, pose, mana/stock/RNG and
   pointer-hit result. If this setup fails, report it; never teleport, inject
   stock/people/tasks, change flags, or edit the target's movement to force it.
4. Click that actual person with Blast. Capture bracket/ack pixels and the same
   identity moving during both windup and flight; track destinations, arrival,
   parent impact point, force/damage/flight and comparable baseline/candidate
   frames. Impact must consume the documented parent lifecycle, not the old
   cell center. Baseline absence and candidate target motion must be observable.
5. Restore the same pre-cast checkpoint and click empty ground beside the route.
   Require no identity, no person acknowledgement, ground feedback, and fixed
   aim even if a person later crosses it. Cover rejection/out-of-range, no stock,
   cancellation, repeated cast, pause and an active save/reload continuation.
6. Supporting portable contract cases: ID0 versus exact identity; motion in
   windup/flight; independent parent/shot last destinations; loss before firing,
   in flight and across arrival; no reacquisition; friendly/changed-owner validity;
   wrapped coordinates/height; unchanged other spells, payment/range/RNG; current
   and legacy saves. Helper fixtures must be labeled separately from the ordinary
   witness. Resolve any browser death/ID mismatch before mapping native validity.

`check-browser-blast-impact.mjs` relocates the Shaman, injects stock/people and
sets gameFlags32; it is controlled visual evidence, not this bit-clear ordinary
episode. The retained native Blast-impact checker also supplies people/allocation
and fixed destinations. No new original instruction execution is authorized by
this proposal. Any needed moving-target native comparison remains not run while
held. Runtime work starts only after independent static-chain/scope review;
later product enrollment is at the first qualifying runtime freeze, not after QA.

Report-only checks: byte/hash/export consistency, JSON/link integrity,
`git diff --check`, and repository structural validation. Build/browser/performance
are not applicable to the documentation-only change. Issue74 remains open.
