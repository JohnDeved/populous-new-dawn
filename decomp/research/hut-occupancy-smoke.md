# Residential hut occupancy smoke

Issue 73 is a bounded PND10 presentation slice. It reuses the existing building,
occupancy, effect and HFX evidence and does not change admission, breeding,
building work, gameplay RNG, clocks, checkpoint state or panel behavior.

## Native producer

The completed-building controller `00403280` calls `0040c4e0` on the
building's 32-count phase. The relevant branch is player-tribe only and reads the
building's real `hut_people_inside` byte.

For residential hut models 1/2/3, the imported native capacities are respectively
3, 4 and 5.

At each `building.class_counter & 31 == 0` producer visit:

- zero occupants removes the retained occupancy visual;
- nonzero occupancy below the building's native capacity selects class-7 model 75;
- occupancy at native capacity selects class-7 model 74;
- there is one retained root visual, not one particle per occupant.

This is therefore a partial/full state, not a linear smoke-count mapping.

## Placement and frames

`0040c4e0` first allocates at the building inside point, but model 74/75
initialization in `0050c150` immediately finds the owning building and calls
`00404540` using the building descriptor's dedicated attachment byte at `+0x33`.
Residential hut models 1/2/3 select sockets 0/1/2. Capacity is the separate byte
at `+0x20` (3/4/5). The earlier version of this note conflated these fields and
the browser consequently selected the wrong sockets; see the correction below.
The browser now reuses `buildingSocketPoint`, including `smoke.txt` corrections
on sockets 0–2 and the socket height offset.

Both models use animation descriptor 40: a 16-frame mode-1 loop with step 4.

- model 74 sets object/HFX start `0x531 == 1329`, giving HFX1329-1344;
- model 75 sets object/HFX start `0x569 == 1385`, giving HFX1385-1400;
- every recovered frame is 32×64.

Model 74's root lifetime is -1, so the full-hut root persists until the building
producer replaces/removes it. Model 75's root starts visible with lifetime 16;
on expiry it hides rather than deallocating. While hidden, each later effect visit
uses the separate presentation RNG and becomes visible again when
`random & 15 < 3`, resetting the same 16-visit lifetime and animation frame.

## Secondary full-hut puffs: deliberately not claimed here

Model 74 also has a secondary child-puff producer: on
`effect.class_counter & 7 == 0`, `random & 31 < 2` allocates a child model 75
with the child flag set, and that child deallocates after 16 visits.

The phase is not safely reconstructible from the current browser presentation
state. Class-7 `class_counter` is initialized from global `start_24[14]`;
regular class-7 allocation increments that global because the class-7 descriptor
byte is `0x28` and does not contain the no-increment `0x10` flag. The browser
does not currently model the complete native class-7 allocation stream. Guessing
zero, tying it to render count, or deriving it from gameplay RNG would fabricate
timing.

This slice therefore restores the occupancy-driven **root** visual and its fully
proved partial/full lifecycle, but does not synthesize model-74 child puffs. That
remaining secondary phase is a separate allocator/presentation dependency, not a
reason to invent particle timing.

## Browser binding

The normal browser hut path already owns the required inputs:

- `b.counter` advances with the ordinary building turn;
- real admission sets living followers' `u.inside === b.id`;
- `world.cosmeticRandom` is the existing separate presentation RNG.

The presentation helper advances only by the delta in `b.counter`; render calls
with no building turn consume no RNG and change no root lifetime. The scene
binding samples real living occupants, uses the native capacity and separate attachment socket, and
renders only the recovered HFX root sequence. A scene reconstruction initializes
the root from the current persisted occupancy because the browser checkpoint does
not serialize native class-7 presentation units.

## Append-only generated assets

The dedicated `scripts/import-original.py ... --hut-smoke-only` mode verifies
the existing provenance hashes for `pal0-c.dat`, `al0-c.dat` and
`hfx0-0.dat`. It decodes the existing owned RGBA atlas, starts new frames on the
next **row** boundary, and writes only:

- `public/original/effects.png`
- `app/original-effects.json`

The prior 2048×4608 decoded pixel rectangle is preserved exactly. Every existing
animation metadata entry/index is unchanged; only the overall height becomes
5632 and the new sequences occupy indices 144-175. The intentionally unused old
row cells 142-143 remain untouched.

This is not collapse/damage smoke model 76. The existing
`buildingSmoke` HFX1345-1360 path and its damage smoke lifecycle remain
unchanged.


## Worker 2 acceptance fixture correction (2026-09-18)

Production remains `3cee6b7d0b329c3000715cfbcaf4a0b8a833709d`; the retained
checker base is `5a0476f573c3133c75f7b0dfd829a7931c38df90`. Canonical job
`49a66586-c9aa-429a-b703-b18d49e7f33e` successfully placed hut 64 with six
rendered Braves, then failed the assumed zero-occupancy assertion with **three**
residents. Its resource cleanup receipt passed. This is not evidence of a smoke,
socket, RNG, atlas, or admission-owner fault.

### Construction, admission, and release are separate owners

Native plan controller `004b8bb0` assigns departure task 9 when construction work
is complete, waits for departure phase 6, and retires the plan. The command-6
wrapper `00495520` finishes when its registered plan disappears; it does not
establish a persistent zero-occupancy state. The current equivalent is
`stepConstructionCrew` → `dispatchConstructionCrew` →
`finishQueuedConstruction`/`release`. `completeBuildingConstruction` records the
completion and initializes the birth timer; it does not force people inside.

Normal habitation is separately owned by command 8 (`00434610`), admission
`00407150`, and removal `00407490`. Admission takes an empty physical slot and
increments the count. Removal clears the actual person's slot, decrements the
count, restores visibility/cell membership at unchanged XY, and supplies the
outside anchor/facing and 12-turn entry delay. It does **not** teleport the person
to the door. `buildingAdmission`, `leaveBuildingEntry`, and the shared task release
adapter connect these existing owners to live units.

The current `world-turn.ts` idle adapter can order an unassigned, unguarded Brave
to a nearby completed hut after more than 16 idle turns, checking every 16 world
turns, within distance 8, with room for actual/reserved inhabitants. Therefore
neither builder release nor a successful resident ground order promises a stable
empty hut. These exact idle thresholds describe the current adapter, not a newly
proved reconstruction of the original whole-game scheduler. Birth work also
continues at zero occupancy (`stepHutBirth` adds the native occupancy-plus-one
term); empty huts must not be treated as permanently quiescent.

### Normal-input fixture

The checker keeps the proven rendered construction path and records whichever
occupancy it naturally produces. It uses the shipped Shift-click Brave roster
control and **G / Guard shaman** command to release the live cohort and hold it
out of automatic housing. `guardShaman` calls the existing `release` owner;
there are no direct calls to gameplay mutators from browser evaluation and no
writes to positions, occupants, slots, orders, clocks, or RNG. The receipt retains
selected identities, before/after resident counts, admission counts, and guard
state. Actual simulation turns must cross the next smoke producer visit before
the zero sample is accepted.

Pickable guarded Braves are then selected through their rendered pixels and sent
to the hut with normal command-8 clicks: one for partial, then two more for full.
For the reverse transition, each visible occupant-panel selection receives a
revalidated ground click. The checker first verifies that person's immediate
release and both count decrements, then issues Guard to prevent that same person
from idling back inside before the smoke sample. Unexpected occupants are not
silently removed to make an assertion pass. Failure records include the last
observed residents/incoming identities and the exact stage.

The existing HFX, atlas UV, socket, pixel-contribution, pause, and
checkpoint assertions remain. That historical browser fixture exercised level 1 /
capacity 3 and asserted socket 3, which the 2026-10-03 native initializer comparison
disproved. It established agreement with the browser helper, not correct native
attachment. The corrected fixture expects socket 0; native evidence covers
models 1/2/3 with sockets 0/1/2 independently of capacities 3/4/5.
Neither the checker nor this note claims live level-2/3 coverage, full original
idle/birth scheduling equivalence, or secondary full-hut child puffs.


### Continuous newcomer guarding (2026-09-18 continuation)

Retained checker job `15842be7-aa4f-48c5-9060-14fe78be14a4` proved that initial
Guard staging works but is not sufficient: eight live Blue Braves were guarded
at turn 1060, while new unguarded Brave 89 was incoming at turn 1139. The hut
still had zero residents and an absent root. The next checker therefore does
not cache a fixed cohort of people presumed to stay outside.

Every live smoke-stage wait now observes both stage readiness and all live Blue
Braves not in the explicitly controlled resident cohort. A newcomer wakes that
wait; the checker pauses through the HUD, selects the actual person through a
rendered sprite or occupant panel (HUD focus is the bounded offscreen fallback),
and issues G only to that unguarded person. Existing guarded people and controlled
residents are excluded by identity even while a controlled resident is still
approaching the hut. Guard dispatch receipts retain the protected IDs and exact
selection. No parallel input watcher races the admission/departure controls.

The checker resumes normal ticks and rechecks after every real Pause click,
including input-latency races. The same observer is used after checkpoint load,
so a previously seen ID is never assumed to remain guarded. Each stage is bounded
to 60 seconds and each input batch to 32 people; unexpected production failures
are recorded rather than repaired. No world, unit, order, occupancy, position,
clock, or RNG state is injected. Reverse partial smoke also retains visible-pixel
and atlas assertions. Production and the canonical wrapper remain frozen.

## Attachment selector correction (2026-10-03)

The user reported smoke rising from the wrong part of a house. The source path
`updateHutOccupancySmoke` selected `buildingSocketPoint(pose, capacity)`.
The existing browser assertion computed its expected XYZ with that same wrong
selector. This was a semantic error in the earlier research, not evidence that
`buildingSocketPoint` itself needed an arbitrary offset.

The hash-verified base executable
`3a5065c7420b3fcde208bf220bc86dfbac95e025ab2492caf9c7ea5308dfbe4f`
contains the decisive load at `0050c232`: building model ×76 plus `005a725b`
(`005a7228 + 0x33`), followed by the `00404540` call at `0050c23b`.
Those descriptor bytes are **0, 1, 2** for residential models 1, 2, 3. Occupancy
capacity comes from offset `0x20` and remains **3, 4, 5**. The corrected scene
uses `hutOccupancySmokeSocket(model)` only for attachment selection.

Reproduce the composed original-byte comparison:

```sh
python scripts/check-native-hut-smoke-placement.py /path/to/d3dpoptb.exe
```

The checker executes the complete `0050c150` initializer and real `00404540`
socket arithmetic, with original shape/object data and SHA-pinned `smoke.txt`
corrections. It observes the selector without intercepting that call. It compares
288 cases across both smoke models, all three residential levels and Blue hut
families, all four headings, normal anchors and wrapped boundaries. All 288
corrected helper placements agree. The initial 72-case normal-anchor audit found
all 72 old capacity-selected placements differed.

For example, object107 / model1 / heading0 / anchor(8192,12288) selects
socket0 = (8320,12928) with height offset400. The old capacity3 selected
(7936,12544) with height offset16. Under the checker's deterministic terrain,
the final native heights are -24 versus -480. This numerical example is native
coordinate evidence, not a measured screen displacement.

Supplied/intercepted consumers are explicit: the checker supplies a building in
the effect's cell; cell-list unlink/relink (`004ed6f0`, `004ed640`), animation
setup (`004ee700`) and final position assignment (`004ee580`) are intercepted.
It captures the complete position passed to that final consumer. Terrain height
(`0044e940`) is deterministic, so this proves selection, coordinate arithmetic,
smoke corrections and height composition, not the live terrain algorithm.
No Windows executable, installer or Wine process is started.

No changes are needed to model origin/heading, world-coordinate conversion,
terrain sampling, billboard bottom-center anchor or HFX assets for this defect.
Those paths are preserved; their complete native visual equivalence is not
claimed. Real-browser before/after evidence must keep hut family/level/heading,
occupancy and camera fixed, then cover a second camera bearing. The root must
originate at the corrected house socket. Full/partial/empty transitions, pause,
checkpoint restore and destruction must remain intact. The revised browser
checker is not, by itself, a matched original-frame comparison. Secondary
full-hut puffs and complete frame parity remain open.
