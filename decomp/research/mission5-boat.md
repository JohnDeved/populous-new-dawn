# Mission 5 granted Boat

The hash-verified Mission 5 level contains one class-4/model-1 Boat template at
native `(0x54e4, 0xa52f)`. Its descriptor maps model 1 to object 838 (Boat),
capacity 5, and non-airborne behavior; UI model 143 is not its render object.
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
movement, landing, and checkpoint state. Its four-part hull is provisional because
the source artwork for object 838 is not imported. Native bobbing, cooldown,
lifetime/death, exact pre-reward visibility, and motion leaves `00465c50`,
`00465ea0`, and `00466fc0` remain open. Ghidra pseudocode is evidence, not source.
