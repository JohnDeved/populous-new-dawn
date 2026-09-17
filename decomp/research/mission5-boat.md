# Mission 5 granted Boat

The hash-verified Mission 5 level contains one class-4/model-1 Boat template at
native `(0x54e4, 0xa52f)`. Its descriptor maps model 1 to original mesh 143,
capacity 5, and non-airborne behavior. The adjacent value 838 is the Boat tooltip
string ID, not a render object. The initializer at `00463c63` reads descriptor +4
and calls `004ee700` with draw type 2; `004f107c` instead reads +6, whose result
`0044d8d4` uses to index localized strings. The original-byte and decoded-mesh proof
is reproducible with `scripts/check-static-vehicle-assets.py --data-root GAME_ROOT`.
Class-6 head index 101 links one-based to template index 100. The reward path in
`004fb270` allocates a new class-4 Boat at the template position, passes through
unresolved `004ede10`, enters `004ed700`, and retires the one-use head/template.

`004657d0` fills the first free passenger slot, with slot 0 as driver.
`004659d0` removes a passenger and promotes the next driver. The class-4 owner is
`00463780`; initialization and driver gating are in `00463370` and `00463e80`.
The existing native routing probe passes all 8,192 cases, while route advancement
passes 2,048 availability and 2,048 advancement cases.

The shipped adapter imports the exact mission record, grants a visible model-1
Boat through normal worship, and reuses the recovered routing path for boarding,
movement, landing, and checkpoint state. The earlier four-part hull was a provisional
substitute; the vehicle-only import now supplies original mesh 143 without changing
the shared texture atlas or unrelated models. Native bobbing, cooldown,
lifetime/death, exact pre-reward visibility, and motion leaves `00465c50`,
`00465ea0`, and `00466fc0` remain open. Ghidra pseudocode is evidence, not source.

## Automatic command-3 crossing

The ordinary native move command is one reference-counted order shared in tribe-list
order. Vehicle routes reuse only an exact start and destination; the nearby-start
reuse used by land routes is deliberately excluded. `00466920` chooses the nearest
active, ready model-1 Boat below its five-person capacity when it is empty or driven
by the same tribe. Only computer player type 1 respects the reservation byte; a
human may use an otherwise eligible reserved Boat.

`004657d0` fills the first free slot and makes the first arrival the driver. A later
passenger whose goal is within 440 native units on each axis adopts the driver's
route and motion index. `00465c50` keeps that driver waiting while capacity remains
and a nearby allied routed person still has the matching Boat leg. Missing, full,
busy, or wrong-driver Boats retain command 3 and its final goal for `004d42a0` /
`004e9d80` recovery rather than deleting the order.

The native route build/advance probes execute automatic boarding, removal, and
landing leaves. Inspected exports establish readiness, capacity, reservation,
same-driver, cell-order, boarding, and driver-wait behavior.
The complete simultaneous multi-person schedule is not byte-executed end to end;
the shipped Mission 10 browser check covers its live composition, including ordinary
ground input, multi-person boarding, checkpoint resume, sailing, disembark, and the
retained objective.
