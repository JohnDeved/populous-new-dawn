# Numbered follower groups

Issue [#1005](https://github.com/JohnDeved/populous-new-dawn/issues/1005), base main
`532cd9efb13acf0a36f2b9774c8892b18f918be6`. Closes the source gap recorded at checkpoint
[e22f488](https://github.com/JohnDeved/populous-new-dawn/commit/e22f488ac0d090cbbcd72947c382181ece176f80):
`decomp/generated/0047c350.c` lost two jump tables and has a wrong three-argument signature.

## Provenance

Static reads of the original `d3dpoptb.exe`, SHA-256
`3a5065c7420b3fcde208bf220bc86dfbac95e025ab2492caf9c7ea5308dfbe4f`, with Capstone 5.0.7.
Nothing was executed or emulated. `scripts/check-static-follower-groups.py EXE` re-verifies
the reviewed instructions, table entries and data records below (exit 0: 56 instructions,
24 table entries, 2 data records); `--listing DIR` regenerates the `.asm` windows retained in
[follower-groups-evidence/](follower-groups-evidence/). The jump-table `.hex` dump and
`process_tribe_cmd-cases.txt` were retained by hand from the same reads; the probe
verifies their table entries but does not rewrite them. Default key records come from the
input-binding atlas (PR #1030, `scripts/native-input-bindings.py`).

## Keys and dispatcher (`004ad035`–`004ad15f`)

| Default record | Action | Call |
| --- | --- | --- |
| Shift+1…6 (no predicate, Ctrl not ignored) | `0x84`–`0x89` | `0047c350(action-0x83, 0, 0, 0)` |
| 1…6 (Ctrl ignored, predicate `004fee90`) | `0x8a`–`0x8f` | `0047c350(action-0x89, 1, 0, replace)` |
| Alt+1…6 (Ctrl ignored, predicate `004fee90`) | `0x90`–`0x95` | `0047c350(action-0x8f, 1, 1, replace)` |
| Shift+Backspace (predicate `004fee90`) | `0x98` | `0047c350(0, 1, 0, 0)` |

Slots are 1–6 (`add bl,0x7d/0x77/0x71` on the action byte). `replace` is 1 unless a
Ctrl key is down (key arrays `009845ae`/`009846ae` and `0098462e`/`0098472e`, scancodes
`1d`/`9d`). The predicate `004fee90` rejects game flag `0089d17c & 0x20` (browser
`manaWorld.gameFlags & 32`), `0089c6c1 == 2`, nonzero `0089ce36`, and interaction modes
9 and 15 (`0089c6e7`). Character records are layout-translated (`'1'`…`'6'`).

## `0047c350(slot, select, camera, replace)`

It is a command emitter, not the group logic. The two "unrecovered jump tables" are an
inlined packet gate with a constant index (`0x3b` select, `0x3a` assign) that always
reaches entry 6: write only if the local player's packet slot (`00897997 + player*15`)
is empty. Neither path writes when `0089c662 & 8` is set.

- Assign writes command `0x46` with `+4 = slot`, `+8 = 0`.
- Select writes command `0x47` with `+4 = slot`, `+8 = replace`.
- **Camera (Alt) runs locally first**, even when the packet is suppressed. It scans the
  player tribe's person list (`tribe+0x881`) for the first person with `+0x7a & (1<<slot)`,
  **without** the availability test, then calls `00417ca0(&person+0x3d, -1, 0)` (smooth
  camera move, heading kept) and `00504590(person, 0)` (object panel).
- Finally, for `slot > 0`, a nonzero-guarded display timer `0089d167[slot] = 6` starts.

## Tribe commands in `process_tribe_cmd` (`0043e8e0`)

Switch index `type-0xc` → table `004423f0` → `004422c0`; `0x46` → `0043f525`,
`0x47` → `0043f572` (the Ghidra case bodies agree with the bytes).

**Membership storage.** Person byte `+0x7a`: bit 7 is selection (`004458d0`), bits 1–6 are
groups 1–6, bit 0 is the previous-order selection snapshot (`00435c10` copies bit 7 into
bit 0 when an order is finalized by `00444f60`). There is no separate group table.

**Assign `0x46`.** For every person in the tribe list: selected → `+0x7a |= (1<<slot) | 1`;
unselected → `+0x7a &= ~(1<<slot)`. Membership is therefore **replaced** from the current
selection; assigning with nothing selected empties the group. Selection is unchanged.
All person classes participate, including the Shaman.

**Select `0x47`.** Visit the tribe list in order. A member with the bit is eligible if
`004e3430(person, 1)`: flags `+0x10 & 0x80` excludes it; the `0x800` reservation does not.
On the first eligible member, if `replace`, deselect every tribe person and its occupied
craft's passengers. Then select each eligible member (`004458d0(p,1,0)`) and every other
passenger of its occupied craft (vehicle `+0x9e` nonzero, capacity from the vehicle type
table, no further filtering). If at least one member was selected and the tribe is the
local player, `0047a550(0xc)` enters group-selection mode (leaving any spell/build mode;
the transition calls `0048a050(0, 0x62, 1)`). An empty or wholly unavailable group changes
nothing. No selection voice is emitted.

**Slot 0 (Shift+Backspace)** adds (never replaces) people whose bit 0 is set: the people
selected at the last order or deselection, plus anyone assigned to a group since then
(assign sets bit 0, unassign never clears it; the next full snapshot does). It is a
previous-selection recall, not a seventh group.

## Previous-order snapshot (bit 0)

The only writers of `+0x7a` bit 0 are (full scan of byte writes to `[reg+0x7a]`):

- `00435c10(tribe)`: for **every** person of the tribe list, bit 0 = bit 7 (`or cl,1` /
  `and cl,0xfe`). It is a full snapshot, so unselected people lose bit 0.
- Its only caller is `004450dd`, the common tail of order finalization `00444f60`. Every
  path through `00444f60` reaches it, including out-of-range types (`ja 004450d8`).
  `process_tribe_cmd` sends tribe command types `0x1e`, `0x26`, `0x27`, `0x37`–`0x3e` and
  `0x57`–`0x5e` to `00444f60` (case `0043edea`, which calls it at `0043edfa`; all 19
  entries and the call are probe-verified). `0x37`–`0x3e`/`0x57`–`0x5e` are the player
  order packets (route families, see [player-patrol.md](player-patrol.md)) and `0x1e` is
  the right-click/Escape deselect. The producers of `0x26` and `0x27` were not identified
  (`0x27` comes from `process_cmd` action `0x80`, which has no default key record). The
  snapshot is taken whether or not any person accepted the order.
- Assign `0x46` (`0043f552`) sets bit 0 for selected people.
- `004d2b59`, the person state-14 initializer (the computer-player selection lock;
  browser `person-state.ts` sets the same `0x81`), sets bits 0 and 7 together. Computer
  tasks use it, so it does not feed the local player's snapshot.
- `00434d50` clears bit 0 in one per-person order-processing branch of `00434610`. Its
  trigger was not decoded.

## Group-number display

**Timers.** Bytes `0089d168`–`0089d16d` belong to groups 1–6.

- `0047c350` sets timer `slot` to 6 for slots 1–6 after any assign/recall key (also when
  the packet is suppressed), unless it is `0xff`.
- The input-service tail `004adbb0` (`004ae0fc`–`004ae1c1`, reached each `draw_main`
  iteration through `004aa4e0` → `004aa6de`) sets the timer to 6 while number-row key
  1–6 is held (key-state arrays `00984591`/`00984691`, scancodes 2–7, any modifiers), again
  unless `0xff`.
- Comma press `0xb7` (record `005d6250`, exact empty modifiers) writes `0xff` to all six;
  release `0xb8` (record `005d625c`, any modifiers) zeroes all six, including timers a key
  started.
- `0041c120`, called once per `draw_main` (`004a4bba`, after the input service at
  `004a4b25`), decrements each timer that is signed-positive (`jle`). `0xff` is -1, so a
  Comma hold never counts down.

Net effect: a group's numbers show while its key is held and for about 6 frames after an
assign/recall or a release; Comma shows every group until it is released.

**Renderer (`00469515`–`0046979f`).** Only for people (`+0x2a == 1`) owned by the local
player (`0089c6f0`, the person's own owner, not a spy disguise). The person must carry a
group bit (`+0x7a & 0x7e`) and some timer must be nonzero. Into a local list it writes, from
6 down to 1, every group whose timer is nonzero and whose bit is set. Nothing is drawn if
the list is empty.

- Font: `00469610` selects font slot pointer `0087cbf0`. Resource record `005a4670`
  (`data\f00t8-0.dat`, 0x120-byte record ending with header `009848c0`, slot `0087cbf0`)
  owns that slot, so the font is **F00T8**. Its `A` is 9×15, digit `1` is 6×15 and
  `2`–`6` are 7×15.
- Position: with origin `(x, y)` and frame height `f` (the selection-arrow height), the
  first digit is at `y − h(A) − (selected ? f : trunc(f·24/32))`. `x − trunc(w(A)/2)`
  applies to every digit. Each later digit is `trunc(h(A)·24/32) = 11` px higher. The
  highest group therefore sits lowest and the column reads 1…6 top-down.
- Text: `sprintf("%d")` (`0059da18`), widened by `0049a670`. For Western languages
  (`00493210` is zero unless language `0089bc6a` is 9–11) it is drawn by `00527960`, twice
  at the same position: first in colour `0089c6f5`, then in the tribe colour byte
  `005a89c8 + owner*5` (`0xdb` blue, `0xf4` red, `0xed` yellow, `0xe3` green). The visible
  result is the tribe colour. F00T8 digits are single-colour coverage. That the colour is
  a fill is an inference from the `00546190` RLE text path
  ([loading-art.md](loading-art.md)); `00527960`'s glyph callback (vtable `005e0900+0xc`)
  was not decoded.

## Selection-mode sound

`0047a550(tribe, mode)` only acts for the local tribe and a changed mode. A requested mode
0 becomes `0xc` when people are selected. Entering mode `0xc` (table `0047a860[0xc]` →
`0047a691`, probe-verified) with a nonzero selection count calls `0048a050(0, 0x62, 1)`.
Cue `0x62` is record `005acf60 + 0x62*12` = `00 00 00 00 ff 01 01 ff 00 00 7f 00`: first
sample 0, one variant, priority 255, volume 127. `0048a050` picks `first + rand % count`
= 0. SDT sample IDs are one-based (`005753d0` indexes `bank + id*4`), so ID 0 addresses
the bank's count word, not a sample. The imported cue table (`app/original-sound.json`)
has no sample for this cue. The original's runtime result for ID 0 was not established,
but the shipped data holds no audible selection-mode sound to reproduce. The browser
therefore emits nothing for it.

## Lifetime and persistence

Death removes the person from the tribe list, so membership disappears with it.
Conversion and hypnotise allocate replacement people; the browser mirrors this
(`replaceConvertedVictim`, `replaceHypnotisedUnit`), so replacements start ungrouped.
Because membership lives in the simulation's person record and travels through the
synchronized tribe-command path, it is simulation state. The native save writer
(`SAVGAM`, `00426b60`…) was not decoded, so native save inclusion is an inference.

## Browser implementation

`app/follower-groups.ts` owns parsing (`followerGroupShortcut`), assign, recall, the Alt
focus target and the scene gate. Membership is `Unit.groups` (bit `1<<slot`) rather than
the replaceable native person records, so representation handoffs cannot drop it. It is
part of the current checkpoint (`structuredClone(world)`); absent means no groups, which is
also the correct state for any checkpoint written before groups existed. Recall reuses the
HUD selection crew traversal and clears `world.mode`; Alt reuses `scene.focus` and
`objectPanels.open`. Plain recall waits for the browser globe overview to end, like the
HUD follower controls; Alt may leave it because focusing cancels the overview.

Spell aliases moved off 1–6. The original has no numeric spell bindings: its only other
digit records are gate-3 actions `0x57` (7, `sunlight_init_2`) and `0x58` (0), and 8/9 are
unbound. The browser keeps 7/8/9/0 for Firestorm/Earthquake/Tornado/Shield as labelled
browser additions.

The browser matches physical number-row codes (`Digit1`…`Digit6`), so Shift/Option
characters cannot change the slot. The original matches layout-translated characters
`'1'`…`'6'` (`00401a90`), so on non-US layouts (for example AZERTY, where the digits
need Shift) the native keys and the browser keys differ. This is a deliberate browser
compatibility choice, not recovered behavior.

### Slot 0, overlay and Comma

- **Snapshot.** Bit 0 is `Unit.groups & 1`, beside groups 1–6.
  `recordPreviousSelection` (selection runtime) is the browser `00435c10`. It runs once per
  player order in `command()`, the browser's pointer order entry (the `0x37`/`0x57`
  producer), before any branch issues orders, and in `cancelInteraction` when a selection
  is cleared (`0x1e`). Assignment sets bit 0. Other producers (Guard Post placement `0x62`,
  spy disguise, HUD task buttons) do not snapshot; only Guard Posts were checked against
  the case table (`0x62` is not an `00444f60` type). The existing `selectionFlags` bit-0 writes on native person records stay
  unchanged for the native witnesses. Recall reads only `Unit.groups`, which survives
  representation handoffs.
- **Shift+Backspace.** Exact Shift, no repeat, physical `Backspace`. It goes through the
  same scene owner and recall predicate as 1–6, with slot 0 and additive selection. It has
  no camera and no display timer.
- **Display.** `app/follower-group-display.ts` owns the six timers, the key handling and
  the layout. Group keys start a timer through `followerGroup`. The scene key-down/key-up
  listeners track held Digit1–6 and Comma (physical codes, ignored in editable fields and
  while a modal suspends the scene). The frame loop steps the timers at the existing 24 Hz
  `draw_main` presentation convention. Losing window focus or hiding the tab releases held
  keys and a Comma hold. A modal does not: key-up still reaches the scene listener, and
  modal frames do not step the timers.
- **Rendering.** `updateUnitsFrame` adds digit sprites to a person's group on first use.
  They sit in the existing painter order next to the selection arrow and health gauge.
- **Art.** `scripts/import-group-digits.py` imports the F00T8 digits 1–6 into
  `public/original/group-digits.png` with `app/original-group-digits.json`. It bakes the
  tribe-0 colour `0xdb` from `pal0-c` (stable across the shipped `pal0-*`). The browser's
  local player is always tribe 0.

## Not implemented / open

- Tribe commands `0x26`/`0x27` also snapshot natively; their producers are not mirrored.
- The overlay is not gated on input masks, the globe overview or open dialogs (unlike the
  browser health gauge); native behaviour there was not established.

- `00434d50`'s bit-0 clear in one order-processing branch is not mirrored. Its trigger
  was not decoded.
- Display timing uses the browser's 24 Hz presentation tick. The native draw_main rate is
  not throttled to a fixed rate here, so "6 iterations" is a frame count, not a duration.
- The DBCS/Asian-language text path (`00451ba0`) and other tribes' colours are not
  imported, because only the local player's people show numbers.
- Packet-slot contention and `0089c662 & 8` suppression; predicate `0089c6c1`, `0089ce36`
  and interaction modes 9/15 have no established browser equivalents.
- Browsers reserve some chords: Ctrl+1–6 switches tabs in Chrome/Edge on Windows/Linux
  and Alt+1–6 on Linux Chrome; pages cannot always intercept them.
- Group keys act while the browser game is paused or after the mission result. Native
  input queues a tribe command that is processed per turn, so pausing semantics were not
  matched. They also act during a rubber-band drag, unlike the HUD category controls.
- Native save-file inclusion and the native person-list order versus `world.units` order
  were not independently verified.
