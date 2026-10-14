# Browser occupant and cell-head identity domain

## Observed ordinary Mission7 failure

The fresh PR429 route at runtime d20c5e81 (equivalent to player's dcc4d6f6)
failed at turn30528 with `Unsupported computer training selection`. The verified
30417 checkpoint plus the recorded public30467 Warrior attack reproduces it.
That checkpoint SHA256 is
`f221289f30f2887925a59cbc7dd15ee34cb8920a9a50fbe07875fea67c3669c6`.
It is already corrupted and must not be repaired by editing gameplay fields.

Replaying the unchanged ordinary battle from the preserved19667 input traces
Brave33332: born27830, housed in hut156 at27890, outside again28848, then
incorrectly marked inside by a later occupancy-indicator update at30050 while
its native person remains outside resting. The stale admission slot survives
because `short(33332)` is negative and cannot match the full browser handle.
The later training selection legitimately finds the idle person, then the
browser's contradictory inside field triggers the explicit guard.

Source-bound diagnostic receipts are retained under
`work/orchestration/m7-settlement/repro-training-failure.json` and
`trace-occupancy.json`. Their failures are expected observations of the original
bug, not successful acceptance. Ordinary replay resumes from clean19667 or a
fresh world, never from the corrupted30417 or partially failed30528 state.

## Native source and live representation boundary

The retained executable reference SHA256 is
`3a5065c7420b3fcde208bf220bc86dfbac95e025ab2492caf9c7ea5308dfbe4f`.
Static exports00407490 and00409ed0 really compare a signed occupant-slot word
with the person's unsigned native pool index. The native bounded pool is not the
browser's monotonically increasing object handle domain. Native training
004c8490 phase4 uses selector flags6 and then the selected person's existing
state owner; it does not justify filtering out a valid selected Brave.

`OccupancyWorld.occupantId` is a narrow representation adapter at the two slot
comparisons. Without it, the retained native signed-word behavior is unchanged.
The live building-entry context supplies identity decoding because its stored
slots and person Map already hold full browser handles. No modulo aliasing,
ID recycling, selection filtering, forced ejection or catch-and-continue is used.

A boundary fixture then exposed the next truncation at65536: live object-cell
heads were Uint16Array even though object Maps and next/previous links used full
handles. The pure object-cell interface accepts native Uint16 fixtures or live
Float64 heads. Live allocation uses Float64 so every safe-integer browser handle
remains exact, including values beyond32 bits. Coordinate/displacement arithmetic
and cell traversal order are unchanged.

Legacy checkpoint migration copies intact Uint16 heads to Float64 without
rebuilding or reordering cell chains. Structured cloning and IndexedDB retain
the typed array and shared object references. This cannot recover a legacy chain
that an old runtime had already truncated, and does not claim to repair such
saves. Native fixture storage remains Uint16; this is a browser representation
repair, not a claim that the original executable used wide cell heads.

## Regression scope

`tests/occupant-handle-domain.test.mjs` supplies allocation-boundary IDs, then
uses actual public hut entry, exit, school entry and checkpoint continuation.
It covers32767/32768/65535/65536, exact distinct33332/98868 occupant slots,
native default signed comparison, same-cell/cross-cell linked order, full cell
handles through2^32, and intact legacy migration without reordered identity.
These controlled boundaries supplement, rather than replace, the ordinary M7
battle requalification. Full runtime gates and new-source route receipts must
be recorded after this repair; earlier d20c5e81 acceptance is historical only.

## Sustained turn-116740 queue and reference audit

The next ordinary Mission 7 continuation exposed a separate boundary: camp 672
was empty, but person 287375 remained at command-8 substate 3 with zero speed,
zero entry delay and available capacity. Its full ID could never equal the
signed-word queue head in `training.ts`. Queue traversal also masked head and
successor handles to unsigned words. The preserved checkpoint is
`priest-pursuit-terminal.v8` at turn 116740, SHA-256
`b4bbfd12fc95de4745cf3c0aeb38b7d0ef133016175cfae3e1479bc2f6cd17d8`.
It already contains orphaned legacy queue links: this repair does not invent
lost queue order or migrate those links. The legitimate head can advance;
ordinary cancel/reorder is required to recreate remaining player orders.

The bounded owner audit below distinguishes native storage arithmetic from
live monotonically allocated handles. Optional decoders are transient call
arguments, never functions stored in checkpoints. Native callers retain their
original signed/unsigned coercions. Live IDs use exact nonnegative safe-integer
identity where validated; this is not a claim that all engine fields support
an unlimited numeric domain.

| Boundary | Retained native default | Live producer and consumer | Live adaptation |
| --- | --- | --- | --- |
| Training head/links | `00409c50` unsigned lookup; `00434610` signed head comparison | `live-building-entry` context passes actual person IDs to queue traversal/admission | `personId` decoder only for people; building target/workTarget remain bounded words |
| Attack/guard order reference | `00435780` unsigned object word, `00432df0` signed target | player `live-command`, AI `computer-runtime`, campaign attack, and `shaman-guard` produce commands 28/30; movement resolves exact people | explicit live writer and order-start decoder for those command models |
| Vehicle order reference | same command word/target rules | workshop and reward allocations use `nextId++`; command 22 and `selectLiveBalloonDrivers` resolve exact craft | preserve command-22 ID and compare full live vehicle/target handles |
| Worship reference | same command word/target rules | legacy Mission 5 migration allocates missing Angel shrine with `nextId++`; `worshipOrder`/`stepLiveWorship` resolve it | preserve command-27 ID |
| AI preacher task | `004f4520`/`004627f0` unsigned selected-person word | `requestComputerPreacher` selects exact person; task dispatcher resolves `entity` | optional person decoder supplied by live caller |
| AI defense task | `004c5cf0`/`004627f0` unsigned entity word | live response scan supplies hostile person/building; task liveness resolves exact entity | optional entity decoder supplied by live caller |
| Timber refresh owner | `004935c0` unsigned owner word | `live-construction-runtime` refreshes builder owner; next world search pass resolves exact `search.person` | optional person decoder at live refresh |
| Fight membership | `00519a70` signed workFlags comparison | `processEncounter` and split groups allocate `nextId++`, store full group ID; `cleanBattles` supplies roster | optional group decoder supplied by live cleanup |
| Attack-release validation | browser adapter previously rejected IDs above 65535 | composed live cleanup compares person ID with actual Unit owner | widen only identity validation, retaining ownership and on-foot eligibility |
| Preacher fallback validation | browser adapter previously bounded links, fight owner and vehicle to 65535 | live object-cell chains and exact owner projections | safe-integer identity limits, preserving coordinate/flag/state/chain checks |

Excluded domains: construction allocation explicitly bounds buildings/plans to
1..1023. Order pool indices and reference counts, flags, timers, packed cell
coordinates, terrain masks and model fields keep their existing arithmetic.
Commands 4/14/29 have no supported live producer/order-start path; command 33
Vault targets remain startup-allocated. `prepareCellOrder` handles bounded
building/cell/area payloads. Growing timber/tree handles already travel through
exact assignments and lookups. Checkpoints use structured records and preserve
numeric handles; no new serialization migration is needed for these adapters.
A separate signed-32 `requestAttack` entity coercion remains outside this tested
16-bit cohort and must not be described as repaired.

New controlled regressions exercise public queue overflow/cancellation/admission
at 32768, 65536 and actual 287375, against a low-ID pipeline, including public
store Save/Load with synthetic IndexedDB and per-tick replay; exact low-word
aliases; command encoding and public attack/guard execution; real encounter
cleanup; AI/timber default-vs-live owner decoding; high vehicle boarding; and
legacy high-ID Angel shrine production. These supplied allocation-boundary
fixtures are not ordinary campaign victory evidence. Existing retained native
fixtures remain unchanged.
