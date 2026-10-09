# Automatic camp panel ownership and caller evidence

Refs #25. The accepted source contract is frozen in
[PR290](https://github.com/JohnDeved/populous-new-dawn/pull/290), research head
`7c83191052253866311fb86b74d106ce37719fec`. This separate branch starts at main
`8563f81eb4f95c3f9f9d09475f479151e013ece8`. The later PR289 merge
`a7a500dcc835ea26e9c39d4e8bc96d1940510613` changes tooling, not the application.

## Frozen failure-first boundary

`tests/camp-automatic-panel.test.mjs` shares the existing manual camp fixture.
It executes the Mission2 authored opening, actual placement/construction and
crew departure, then the real GameScene start/input/animate methods, live entry
routing and fixed turns. The fixture supplies DOM, projection, texture IO,
frame deltas, graphics setup/listener installation and unrelated frame stages.
It does not execute the full WebGL Scene constructor or an ordinary browser.

- A negative renderer test supplies only activity0x80 to an otherwise ownerless
  completed camp. With no simulation turn, paint must create neither record,
  DOM panel nor secondary reservation. Main incorrectly creates DOM/capacity.
- The positive case selects the surviving ordinary Braves and sends real left
  pointer down/up to actual camp geometry. Every selected recipient must own
  `entry.person` and the same model8 order targeting that camp. Actual approach
  and admission earn activity; no people, occupants, mana or activity are injected.
  A synchronous fixed-turn observer copies primitives before later frontend
  stepping or host serialization. The first fresh automatic record must already
  have phase -1 and one reservation, with no painted DOM. Main's live callback
  is a no-op, so the record and reservation are missing.

The preserved red source sequence is `bf429f3e` (initial callers), `d26ac24b`
(distinct latch sample), then independently accepted `f4b4e502` (actual paint
before and after the controller step). Exact raw receipts remain under
`work/orchestration/camp-auto-baseline/`. Seven manual tests passed unchanged at
that historical baseline. These are intentionally red implementation prerequisites.

## Runtime candidate

The live conversion callback now dispatches synchronously through a transient
World-to-ObjectPanels binding installed by actual Scene.start. Scene.dispose
releases only its own binding. A replaced Scene cannot clear its successor's
reservations, and a stale store presentation binding cannot request new UI.
Headless Worlds have no consumer. Gameplay checkpoints acquire no new fields.

`requestAutomaticTraining(id)` admits only the local completed class2/model7
camp through the existing shared allocator. `automaticTrainingLatches` is a
separate Set and is set only after successful admission. Existing records retain
phase/hold/remaining and D; a new record uses -1/0/16 and the established T/D
side effect. Capacity failure leaves the latch clear for a later actual request.

Automatic phase1 renews to16 before decrementing to15 while eligible. Lost
activity/ownership clears its latch and enters phase2; the record remains
automatic. A new request can reuse/relatch phase2 without restarting its exit.
Retirement clears the latch again. DOM hover/focus can retain controls independently
but cannot freeze the automatic record. One shared reservation counts these owners.

Three manual test scenarios deliberately replace their earlier supplied 0x80
independent-paint expectations with the existing 0x8000 dismantling adapter.
They are **not unchanged assertions after implementation**. The original
seven-pass baseline is preserved, and the new tests cover manual-to-automatic
reuse through actual `stepLiveTraining`. Bare 0x80 no longer authorizes DOM;
a fresh automatic record reserves immediately and waits for a controller step
before painting. Dismantling and independently held controls retain their adapter.

Focused regressions additionally exercise ordered same-turn requests, secondary
capacity failure/retry, pre-conversion creation even when conversion clears
activity, entry-stop ordering, phase2 reuse, held DOM retirement, invalid/local/
modal/overview guards, stale Scene disposal, the existing previous-sample T-cache
boundary, and controlled in-session Save/Load/Restart with stale saved bit23.
The original training/panel fixture comparisons run from retained data; no original
executable is run. Full standard gates, final independent review and the ordinary
browser episode below remain separate acceptance evidence.

## Ordinary Mission2 episode contract

Reuse the independently reviewed construction prefix at QA commit
`191c37ae`: authored M2 opening, converted Blue Shaman and eligible Braves;
Shift-select Braves, Buildings, Warrior Training Hut (8 wood), one valid
placement near (-99,-105), then real-clock construction and all crew departure.
Require progress1, no builders/work/inside, empty admission occupants/queue,
and no activity0x80/dismantling0x8000. Let any manual camp record expire.

Select ordinary Blue Braves, left-click the camp once and move away. Copy each
recipient's actual `entry.person` identity, commands and cursor synchronously in
the pointer-up observation. The construction prefix's `builder.person ?? native`
snapshot is insufficient for training ownership. Observe natural admission,
automatic request before conversion, renewal, conversion, activity clearing,
exit and reservation release, without direct ticks or clock replacement.

The passive consumer wrapper must clone pre/post record fields, the separate
Scene latch, reservation multiplicity, DOM state, activity/occupants/mana and
turn/T-cache state inside the original call, before returning or serializing to
the host. Stable consumer names are `requestAutomaticTraining(id)` and
`automaticTrainingLatches`.

Save while active through the actual UI and prove the typed IndexedDB `latest`
write commits. Save keeps the current Scene owner. Then use actual Load, observe
old Scene disposal and fresh empty record/latch state, preserved gameplay and
page-owned threshold, and a new request only on a genuine active training visit.
A paused paint alone must not replay a request. Keep the source contract's
existing frontend ordering, stale sample at first T initialization, DOM hold and
secondary-count adapter limits explicit. This episode is planned, not yet run.
