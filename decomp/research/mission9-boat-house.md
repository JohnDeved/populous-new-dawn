# Mission 9 Boat House production

Evidence targets `d3dpoptb.exe` SHA-256
`3a5065c7420b3fcde208bf220bc86dfbac95e025ab2492caf9c7ea5308dfbe4f`.
Ghidra 12.1.3 pseudocode is evidence, not recovered source.

Completed Boat House construction does not itself create a Boat. The completed
building dispatcher sends class 2, model 13, state 2 to `0x00406600`. A launch
requires a live eligible occupant, work accumulator `building+0xa4 >= 600`, and
a `0x10` cell in the current rotated building shape.

The first such cell supplies the Boat's centered native X/Y coordinates and
terrain height. The producer allocates class 4, model 1 for the building's
tribe. For ordinary shore data its final heading is `shoreDirection << 8`; it
sets navigation flags `0x8004`, removes the chosen worker from the house, and
boards that worker. Human tribes eject the remaining occupants. The work
accumulator resets to zero and the Boat House remains intact.

The non-recording isolated probe ran native `0x00406600` and descriptor reads,
while supplying shape enumeration, allocation, height, routing, boarding, and
other bounded leaves. Cases with no occupant, an ineligible occupant, timer
599, 600, and 601 launched `false, false, false, true, true`. The positive cases
allocated class 4/model 1/same tribe at the supplied dock cell and preserved the
completed Boat House with timer zero.

Reviewed exports: `00406600.c` (producer), `0040b6d0.c` (dock-mask setup), and
`00465580.c` (shore-heading helper). Existing Mission 5 evidence covers the
separate live boarding, sailing, landing, and checkpoint path.

Limits: the probe does not prove native allocation pools, motion/routing, the
selected cell of a particular player placement, or the external work increment
scheduler. The browser's one-Boat slice increments persistent building work
once per simulation turn while occupied; recurring production remains open.
