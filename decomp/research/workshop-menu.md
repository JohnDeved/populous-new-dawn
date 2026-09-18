# Completed workshop building menu

This note records the already-established native evidence used by issue #25 for the
completed Boat House menu. It does not add a new executable probe or recording.

## Native dispatch

`decomp/generated/00504060.c` dispatches completed class-2 buildings by descriptor
flags. Training descriptors (`flags & 1`) select panel kind 5; descriptors with
`flags & 0x40` select panel kind 6; remaining ordinary completed buildings select
kind 7. Models 13 (Boat House) and 15 (Balloon Hut) carry `0x40`, so both use the workshop
branch. Model 19 (Prison) is intercepted earlier and uses its own special panel kind.

## Boat House kind-6 layout

`decomp/generated/00504bc0.c` implements the kind-6 dispatch in its workshop case.
For model 13 it reads the building descriptor capacity (4), building work accumulator
`timer / 100`, and the produced vehicle work requirement `600 / 100`. The resulting
panel has:

- one owner occupant row with four physical slots;
- the existing owner dismantle/cancel control beside that row;
- one production row with six discrete 100-work cells, filled for each complete 100
  units of the current Boat work accumulator; and
- the standard panel tail.

The original HUD rectangles already present in `app/original-hud.json` are slot 75
(16x23), work cell 40 (16x15), control 46 (23x23; existing hover/pressed variants
47-51), and tail 52 (16x34). Native sizing therefore gives:

- occupant content: `(16 + 1) * 4 + 4 = 72`;
- work content: `(16 + 1) * 6 + 4 = 106`;
- main row width: `max(72, 106) = 106`;
- owner control frame: `23 + 4 = 27`;
- unaligned width: `133`, aligned to 8 pixels => **136**;
- occupant/control row height: `23 + 5 = 28`;
- work row height: `15 + 5 = 20`;
- tail height: `34`; total => **82**.

With the 136-pixel canvas, native centering places the 133-pixel content at x=1.
The occupant frame is x=1..107 with four slot hitboxes centered at x=19,36,53,70;
the 27-pixel dismantle hitbox begins at x=107. The work frame starts at y=28 and
spans the 133-pixel content; six work sprites start at x=3,20,37,54,71,88. The tail
is centered at x=59, y=48.


## Balloon Hut kind-6 extension

Issue #25 reuses the same retained kind-6 formulas for completed model 15; no new
executable run is required. `decomp/research/mission13-balloon.md` and the retained
`scripts/check-native-balloon.py` descriptor check bind model 15 to vehicle model 3.
The imported building descriptor exposes workshop capacity **6** and the vehicle
descriptor exposes production work **1000**. With the same original HUD rectangles and
100-work cells used above, kind-6 sizing derives:

- occupant content: `(16 + 1) * 6 + 4 = 106`;
- work content: `(16 + 1) * (1000 / 100) + 4 = 174`;
- main row width: `max(106, 174) = 174`;
- owner control frame: `23 + 4 = 27`;
- unaligned content width: `201`, aligned to 8 pixels => **208**;
- row/tail heights remain `28 + 20 + 34` => **82**.

Centering the 201-pixel content within the 208-pixel canvas starts at x=3. The six
occupant hitboxes are x=38,55,72,89,106,123; the dismantle hitbox begins at x=177.
Ten work sprites start at x=5,22,39,56,73,90,107,124,141,158 at y=30, and the
standard tail is centered at x=95,y=48. These values are consequences of the retained
formula, not an independent hard-coded Balloon layout.

The existing Mission 13 producer remains gameplay owner: work increments through the
normal completed Balloon Hut path and launches vehicle model 3 at 1000 work. The chosen
driver always leaves the Hut and boards the Balloon. Native playerType 1 ejects the
remaining occupants; this runtime maps type 1 to computer tribes. PlayerType 2 (the
Blue human tribe) retains valid non-driver occupants in their physical Hut slots. The
presentation must therefore remove only the launched driver for the authored human
route and must not manufacture an empty Hut after launch.

## Retained production evidence

`decomp/research/mission9-boat-house.md` and the registered
`mission9-boat-house-native` check (`scripts/check-native-boat-house.py`) are the
canonical producer evidence. The native model-13 producer requires a live eligible
occupant and work >= 600, launches class-4/model-1 for the same tribe, boards the
chosen worker, resets work to zero, and leaves the completed Boat House intact. The
retained canonical run exercised no occupant, ineligible occupant, 599, 600, and 601
work boundaries with launch results false, false, false, true, true.

Current browser gameplay already owns ordinary Mission 9 unlock, placement,
construction, admission, work accumulation, Boat launch and boarding. Issue #25 only
restores the missing completed-building presentation and reuses existing occupant
selection/focus plus dismantle/cancel behavior.

## Limits

This slice does not claim the Prison panel, full native panel allocation/lifetime,
exact hover tint, dynamic palette behavior, or new gameplay ownership. No assets are
added: both workshop profiles use the existing original HUD rectangles.
