# Numbered follower groups

Issue [#1005](https://github.com/JohnDeved/populous-new-dawn/issues/1005), base main
`532cd9efb13acf0a36f2b9774c8892b18f918be6`. Closes the source gap recorded at checkpoint
[e22f488](https://github.com/JohnDeved/populous-new-dawn/commit/e22f488ac0d090cbbcd72947c382181ece176f80):
`decomp/generated/0047c350.c` lost two jump tables and has a wrong three-argument signature.

## Provenance

Static reads of the original `d3dpoptb.exe`, SHA-256
`3a5065c7420b3fcde208bf220bc86dfbac95e025ab2492caf9c7ea5308dfbe4f`, with Capstone 5.0.7.
Nothing was executed or emulated. `scripts/check-static-follower-groups.py EXE` re-verifies
the reviewed instructions and table entries below (exit 0: 34 instructions, 4 table
entries); `--listing DIR` regenerates the `.asm` windows retained in
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
last ordered, plus anyone ever assigned to a group (assign sets bit 0, unassign never
clears it; `00434610` clears it in one order path). It is a previous-selection recall,
not a seventh group.

**Display.** Person rendering (`00469515`) draws the digits of every group whose timer
`0089d168+n` is nonzero above members (`+0x7a & 0x7e`); `0041c120` decrements the six
timers. Comma (`0xb7`/`0xb8`) holds all six at `0xff` while pressed.

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

## Not implemented / open

- Shift+Backspace slot-0 recall: depends on the previous-order snapshot bit, which the
  browser maintains only on some order paths.
- Group-number overlay and Comma display, and the mode-`0xc` transition call `0048a050(0, 0x62, 1)`
  (no browser path emits it for other selection inputs either).
- Packet-slot contention and `0089c662 & 8` suppression; predicate `0089c6c1`, `0089ce36`
  and interaction modes 9/15 have no established browser equivalents.
- Browsers reserve some chords: Ctrl+1–6 switches tabs in Chrome/Edge on Windows/Linux
  and Alt+1–6 on Linux Chrome; pages cannot always intercept them.
- Group keys act while the browser game is paused or after the mission result. Native
  input queues a tribe command that is processed per turn, so pausing semantics were not
  matched. They also act during a rubber-band drag, unlike the HUD category controls.
- Native save-file inclusion and the native person-list order versus `world.units` order
  were not independently verified.
