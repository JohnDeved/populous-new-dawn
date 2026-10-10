# Eight-Brave Temple entry composition

## Result and limits

Issue [29](https://github.com/JohnDeved/populous-new-dawn/issues/29) remains open.
This bounded comparison finds concrete movement composition differences; it does
not establish a universal one-person doorway rule or resolve the ordinary visual
report. No production change, fixture recording or parity promotion accompanies
this research.

At source `50aefe1d49f70057380bf9a5fa8f0b319c8ad441`, a native-initialized
Temple and eight Braves share one command-8 order. The real original movement,
formation, admission, building, list, route-budget and queued-terrain consumers
run for 48 turns without supplied function returns. Actual admission turns are
33, 40, 43, 46 and 48. Capacity remains five, with three waiting. The entering counter reaches five
including admitted residents; at most four followers are outside in substate 5.

The browser-model replay validates the initial mapped records and all 48
before/after terrain projections. It admits the same five IDs on turns
34, 40, 42, 44 and 48. Both versions happen to admit one person per admitting
turn in this fixture. This is not a rendered doorway witness.

## First divergences

1. Main's actual route adapter overwrites the retained person counter on turn 2:
   person 1832 has native counter 9; browser changes it to world turn 2.
   The first position difference is turn 4, person 1833, one position unit.
2. Replaying the unchanged rejected guard candidate
   `bd420fd252182e8e28fdeb03a6577f844a04a746` eliminates captured counter drift.
   Its admissions remain different: 33, 40, 43, 44 and 48.
3. In the guarded replay comparison, on turn 25, native `00500a30` formation initialization consumes two RNG draws
   and produces timers 49 and 33. Browser `live-movement.ts::join` constructs
   timer zero and omits those draws. Applying exactly the two native RNG steps
   to the captured browser state reproduces the native state and both timers.
4. Native `004ecac0` rebuilds tribe formation lists after object traversal.
   Same-turn allocation prepends for recruitment; the next turn's rebuilt
   traversal has the opposite allocation order in this fixture. Browser keeps
   its prepended array. A blind reverse or timer-only change is insufficient:
   recruitment, removal, end-turn rebuilding and checkpoint order need owners.

These source-local findings do not make draft PR 320 safe. Its unchanged full
suite previously failed the Mission 2 population acceptance (1928/1929 passed),
and ordinary rendered multi-follower admission persisted. Do not tune that test
or reduce capacity to obtain a pass. A next candidate needs actual-caller RED
coverage, source-backed lifecycle composition, unchanged full gates, ordinary
rendered gameplay and fresh independent review.

## Evidence and reproduction

See the [portable evidence](../../references/verification/training-native-2026-10-10/README.md)
for full source/tool/input hashes, frozen drivers, failed setup attempts,
per-person visits, actual admission calls, browser observers and raw results.
The canonical original EXE SHA-256 is
`3a5065c7420b3fcde208bf220bc86dfbac95e025ab2492caf9c7ea5308dfbe4f`.
Original game assets are required separately; none are distributed here.

The native driver uses original 179-byte pool initialization, model allocation,
tribe-list publication, shared-order production and the selected-person restart
block. Its 49 pending Temple terrain edits are consumed by real `0044df40`;
the entire person/admission trajectory matches the observation-only control.
No installer, PE startup, operating-system/import bridge or guest network is used.

This remains an explicitly initialized flat-world fixture. Logical animation
stepping (the driver explicitly supplies sprite-animation clock `0x897981 = turn`,
which original `004ed700` copies to record `+0x18`), partially inspected `004f0e00`, outer UI/full-frame scheduling and
rendering are excluded. Training is disabled, limiting inference to approach
and admission before conversion; completion and exit scheduling are unproved.
Existing ordinary browser evidence is separate from this model comparison.

## Ordinary owner provenance follow-up

The [reviewed main-source observation](../../references/verification/training-owner-2026-10-10/README.md) establishes synchronized counters before training input and exact retained owner identity through the click. All observed resting/builder assignments equal ordinary increments; route assignments preserve values. This does not independently prove those writes erroneous. The next proof boundary is original startup conversion allocation phase and first scheduled visit. No product repair is accepted.

## Conditional startup conversion proof

A [single original eight-Wildman fixture](../../references/verification/training-startup-phase-2026-10-10/README.md) confirms a replacement inherits the next class-allocation counter and waits until the next primary pass for its first person visit. It does not recover Mission 3's prior allocation ledger, justify a seed of 52, or establish a safe product repair.
