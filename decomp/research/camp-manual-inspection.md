# Completed Warrior Training Hut manual inspection

Refs #25 and #19. Proposal and failure-first scope, based on delivered
`50657af8bc5b403f9306a3d9d1f866d74071e33c`. No runtime repair or new execution is
claimed by this document. [The manifest](camp-manual-inspection-source.json) pins
the unchanged retained exports, imported metadata and atlas inputs. No original
binary, asset regeneration or global allocator change is required.

The concrete gap is in the live composition: `renderBuildingPanels` still opens a
completed camp directly from `hoveredObject`; `ObjectPanels.inspectHut` and the
queued right-button route reject camps. Thus the already-delayed camp name does
not own its inspection record, and the panel can appear before that name matures.

## Source and admission

Reuse the [accepted ordinary controller and admission contract](https://github.com/JohnDeved/populous-new-dawn/blob/c1b16d5af571f4735f036f71b063827b3a7f6e17/decomp/research/ordinary-tooltip-controller/ordinary-admission.md)
and [accepted Hut implementation/evidence](https://github.com/JohnDeved/populous-new-dawn/blob/6aa6c58267fad359d85afbe34d5e52cab141b564/references/verification/hut-tooltip-2026-10-09/final-review.md).
This slice adds only the completed, local class-2/model-7 building family. A dead,
enemy, incomplete or other training-building target is outside this extension.
The browser mapping remains `kind === 'camp'`, blue, positive HP, progress >= 1.
Manual admission has no invented empty-occupant or inactive-training condition;
the positive ordinary Mission 2 episode starts with an empty completed camp.

`0047ae00` tries primary/secondary inspection before the owned-building cell path;
class 2 falls through `0047b1d0` to that cell path. Retain combined cell validity,
pick precedence, live identity revalidation and the existing ordinary/input guards.
Its allocation attempt reaches `00504060`; model 7 has imported flags 18591
(bit 1 set, bit 0x20 clear), capacity 5, and selects panel kind 5. Local title
type 2/model 7 uses string 912: "Warrior Training Hut: Select Followers and {}to
train. |}query." The enemy title 940 is not a manual-admission grant.

An admitted explicit press calls the existing marker/sound adapter once after the
allocation attempt, including capacity failure (`0047ae00 -> 004afff0`). Release,
stale input and blocked input produce no feedback. Existing `buildingInsidePoint`
placement remains a browser adapter; original `004ba130` placement and physical
secondary-slot parity are not established here.

## Smallest maintained ownership change

Generalize the existing data-only Hut map and inspection methods to building
names in `app/object-panels.ts`, with one eligibility helper for completed local
Huts and camps. Keep `GameScene.updateTooltipController(now)` and its order:
sample/count, reset draw, HUD, forced, ordinary, queued inspection, renewal,
record stepping. It still runs once per existing `updateFlyby` tick after real
acquisitions. No new clock, RAF lifetime, threshold reset or ordinary-text copy.

Affected callers are `scene-tooltip-runtime.ts` (pick/cell admission, first-display
and input consumption), `scene-input-runtime.ts::pointerDown` (queue camps),
`building-panels.ts::renderBuildingPanels` (record-owned manual visibility), and
`scene-secondary-effects.ts::syncSecondaryReservations`. Existing paint, occupant
selection/focus, dismantle/cancel and construction/training simulation stay owned
by their current modules. Existing Hut tests change only shared API names.

| Boundary | Required behavior |
| --- | --- |
| Fresh manual record | Same shared map, phase -1/remaining 0/hold 16, first 3/16/3 step on its creating tick; D=T+1 only after successful new allocation. |
| Reuse and replacement | Reuse identical record without reset/acceleration. Retire eligible same-class manual records before allocation failure; preserve activity-0x80 exclusions. |
| Expiry and controls | Same hold/release order and actual DOM hover/focus adapter. Expiry releases its record; it cannot delete a camp panel independently held by existing activity, dismantling or DOM control ownership. |
| Capacity and reservations | Count the union of ObjectPanels IDs, retained building IDs and visible legacy building IDs toward 32; derived secondary admission remains <=159. Transfer visible camp -> retained camp without double counting. Exactly one reservation per building ID even when both owners coexist. |
| Save/Load/Restart | Records, inspection/held pointer and queue remain Scene-owned. Save may include derived strings; migration clears transient reservations. New Scene starts empty with the same Page session threshold, with no replayed click/allocation/feedback. No World schema change. |

## Active-training preservation and excluded producer

`00403280` selects `00405b80` for model 7. Its activity-0x80 branch calls
`00509290`; `005092e0` checks local ownership/activity, and `00504920` renews
automatic records. The current port has the corresponding
`stepLiveTraining -> stepTrainingConversion -> updateTrainingPanel` boundary,
but the live callback is a no-op. `renderBuildingPanels` supplies current active
and dismantling visibility from activity bits 0x80/0x8000 instead.

Preserve that existing visibility separately from manual-record existence.
Starting training must not create an automatic record, accelerate D, or reset an
existing manual record. Manual inspection of an active camp can create/reuse a
manual record while the existing active panel remains usable. Expiring that
manual record cannot remove the independently held DOM panel. When activity ends,
the existing DOM interaction hold and any surviving manual record determine
visibility. Other training buildings, plans and workshops keep their current path.
Exact automatic request order/latch/lifetime is a separate prerequisite; polling
0x80 on the presentation loop is not claimed as its native producer.

## Failure-first and ordinary evidence

Freeze actual Scene/input/panel caller regressions before runtime edits. Assert
that a picked completed camp has no immediate panel on a zero-tick paint; first
display creates one record and paints the existing kind-5 controls; right down/up
before a due tick creates/reuses and releases with one feedback event. Preserve
forced-expiry ownership, Hut behavior, active-training appearance and simulation.
Cover visible-owner capacity transfer, failure ordering, active/manual coexistence,
expiry without deleting an active panel, guards/stale input and migrated cleanup.
Controlled test fixtures are distinct from ordinary campaign evidence.

The old `ordinaryMissionTwoTrainingHut` checker provides public construction
inputs near (-99,-105), but also injects camera/render work, direct ticks and
speed 0. Reuse only its select-Braves/Buildings/camp/placement input sequence.
The separate ordinary witness must use actual clocks and trusted inputs, retain
construction through completion, deselect, then observe hover/right inspection,
controls, departure and Save/Load. Do not inject training/activity to claim a
positive automatic producer. New issue/PR images must use verified GitHub image
URLs, inline embeddings and rendered readback; absent before images stay absent.
