# Native vehicle passenger panels

Issue #184 is the independently reviewable prerequisite for the occupied-transport
focus controls in #60. Base inspected: `fc0f29b2f5c752ecc9738772446749f7edd953bd`.
This note distinguishes native command proof from live integration acceptance.

## Native layout and actions

The class-4 controller `00504060` allocates kind9, with 3/20/3 presentation phases.
`00504590` immediately holds phase1. Same-class replacement retires earlier vehicle
panels; person panels can coexist. `00509000` uses original mesh143/144 anchor
heights373/678. `00504bc0` draws five Boat seats (models1/2) or two Balloon seats
(models3/4), with the existing original occupant silhouettes, selected overlay53
and tail52. It has no person-order row or health gauge.

The logical canvas is120×62 for Boats and72×62 for Balloons. Boat seat frame is
(2,0,89,28), unload frame(91,0,27,28); Balloon frames are(3,0,38,28) and(41,0,27,28).
Slots are17px apart. HFX60/61 are the23×23 unload normal/hover art. Disabled unload
uses the untinted source sprite at alpha85; tail52 uses alpha170. Scoped
`import-vehicle-panel-icons.py` appends only60/61 plus source-alpha palette130 passenger pressed masks using the existing checked atlas
append routine and verifies that every prior rectangle and pixel is preserved.
The complete HUD importer is not rerun.

`0047b460` passenger primary click emits0x2a(arg1=6, personID); Shift emits0x61 with
the inverse of the clicked selection and vehicleID. Right-click opens only the
passenger panel, without camera movement or sound. Unload primary recomputes the
native readiness predicate and emits0x60(vehicleID,1) plus sound106 only if ready.
Unload right-click does nothing. Passenger primary and Shift emit sound106.

Complete native selection commands establish an important asymmetry: unselected
single selects only that eligible person and preserves work; selected single
clears the entire craft. Shift selection expands to all passengers, including
blocked mates, if any visited occupant is eligible. Shift deselection clears all.
These are separate rules from both building controls and the occupied-vehicle HUD
rows. Current packed passenger lists match the verified path; pathological sparse
all-blocked-prefix command cases remain outside the packet.

## Readiness and voluntary unloading

`00466f30` requires `00465650` readiness, `00466190` successful exit and signed
speed<12. The original non-forced renderer can cache its bit on raw scheduler-byte
phases; browser controls intentionally recompute from current state instead. This
removes stale enabled artwork and remains separate from native forced-click parity.
The success-bearing `vehicleExit` preserves the existing point-only API while
retaining the original failure result, which cannot be inferred from coordinates.

Complete0x60 execution traverses `00436ca0`, `00466c80` and `004659d0`. It repeatedly
uses the first passenger, clears savedVehicle and all orders, then tries the exit.
Success clears the vehicle link and physics-freeze bit0x4000, sets
flags4=(old&~0x02000000)|0x01000400, chooses native randomized speed and launches
horizontal velocity160/vertical60 toward the exit. State, position, anchors and
workTarget remain unchanged. Craft navigationFlags gains2 and its real owner is the
departing person's tribe. Failed stale exits retry the same driver, whose orders
are cleared; others are untouched. Native vehicle byte+a0 starts its separate
short passenger-bobbing/splash controller; that existing presentation gap is not
claimed by this panel integration.

Do not reuse the ordinary browser landing teleport or destruction's additional
flags2|0x80010. `unloadVehiclePeople` isolates the complete command's mutations.
`unloadLiveVehicle` binds ordinary order cleanup, existing animation data and the
live impulse owner. The failure-first live test identified a missing physical prerequisite:
`syncLiveVehiclePassengers` put people at craft height rather than native seat
height; thus a Boat unload entered grounded physics and lost its impulse. The repair preserves exact settled seat offsets, headings and physics freeze,
using native movePosition twice and the existing registered-cell relocation owner.
A final per-vehicle publication after person/route visits and an immediate boarding
command publication prevent legacy route setup from flattening the seat. Generic
browser cell reconciliation no longer overwrites a vehicle-owned height. Native
seat→unload→physics compositions prove that both craft retain upward velocity with
no fabricated airborne bit; authored-Mission22 supporting tests now land both
passenger kinds alive, including restored occupied and airborne checkpoints.

Current browser boarding attaches immediately. It intentionally does not replay
original slowTurn interpolation on each of the existing passenger/driver sync
calls.84 complete settled native cases match positions, heading and flags across
slots, orientations and seams.504 total full native captures (84 settled and420 nonzero-countdown cases) preserve the
countdown branch for later controller work, without claiming it is implemented.

## Executable comparisons

With the verified source environment selected:

```
python scripts/check-native-vehicle-panel.py "$POPULOUS_EXE"
python scripts/check-native-vehicle-panel-selection.py "$POPULOUS_EXE"
python scripts/check-native-vehicle-exit.py "$POPULOUS_EXE"
python scripts/check-native-vehicle-unload.py "$POPULOUS_EXE"
python scripts/check-native-vehicle-seats.py "$POPULOUS_EXE"
python scripts/import-vehicle-panel-icons.py "$POPULOUS_GAME_ROOT" --check
node --test tests/vehicle-panel.test.mjs tests/vehicle-panel-runtime.test.mjs
```

Native EXE SHA256:
`3a5065c7420b3fcde208bf220bc86dfbac95e025ab2492caf9c7ea5308dfbe4f`.
Existing decompilation exports suffice; no Ghidra project or generated export was
modified. The native renderer intercepts palette and final raster consumers; its
24 draw traces match the maintained layout. It separately captures16 hover,
48 input,384 cached/forced-readiness combinations and two anchor heights.
16 additional own/foreign, selected/unselected, hovered/pressed native traces match the maintained layout; hover fills palette154 behind the icon, while only the real selected bit draws53.256 full selection commands compare with the maintained selection adapter.
320 exit/forced-readiness cases execute the complete native terrain/collision
composition with supplied category/flag/mask inputs.96 unload comparisons execute
complete command/order cleanup/ejection with supplied exit and animation leaves,
including initially physics-frozen passengers. Their exact person fields and RNG
match the maintained helper. 16 native seating→ejection→first-physics compositions also retain live elevation/impulse. Native helper equivalence is not rendered-game proof.

Current rendered acceptance remains in progress: authored craft inputs, living landing,
passenger inspection, repeated/stale actions, occupied/airborne checkpoints,
destruction, modern viewport/DPR and exact source-pixel rendering. Full gates and
fresh independent review are required before merge. No parity ledger is changed;
#5, #25 and #60 remain broader open acceptance.
