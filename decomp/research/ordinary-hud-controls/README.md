# Ordinary HUD controls: original art and unresolved actions

Assessment base: `6d828c58d061e8c4a1a09a4723850b870208dc0e`.
The bounded runtime change removes the spell/building command dock's CSS ridge
and reuses the **existing original root panel** already used by Followers.
Help/Menu and tribe controls still have invented presentation and action mappings;
this finding does not remove their existing functionality or certify the HUD.

## Command-root correction

The three root descriptors at `005cd0fc`, `005cd13a`, `005cd178` are IDs2/3/4,
all with `(x,y,width,height) = (0,204,100,277)` and renderer `004a1720`.
The [retained raw records](native.json) independently confirm the earlier
[nearby-control root inspection](https://github.com/JohnDeved/populous-new-dawn/blob/28d97dd17d959df59aeddab26007351ef3773db3/decomp/research/follower-nearby-source/callback-candidates-roots.json).

[`004a1720`](../../generated/004a1720.c) tiles HFX712 over the complete root,
then draws frame `005caa40` via
[`004a1f50`](../../generated/004a1f50.c). That frame contains
`[707,709,708,710,0,711,559,562,560]` in native row-major order. Its native draw
geometry and pixels were already recovered for the
[Followers panel](../follower-task-panel.md). The existing
[`import-follower-tasks.py`](../../../scripts/import-follower-tasks.py) produces
the complete 100×277 root using the following ordered draws:

| HFX | x | y | width | height |
| ---: | ---: | ---: | ---: | ---: |
| 712 | 0 | 0 | 100 | 277 |
| 709 | 8 | 0 | 84 | 4 |
| 562 | 8 | 269 | 84 | 8 |
| 710 | 0 | 8 | 4 | 261 |
| 711 | 96 | 8 | 4 | 261 |
| 707 | 0 | 0 | 8 | 8 |
| 708 | 92 | 0 | 8 | 8 |
| 559 | 0 | 269 | 8 | 8 |
| 560 | 92 | 269 | 8 | 8 |

`public/original/follower-task-panel.png` remains byte-identical, SHA-256
`1ef9497deeeff80e86b7782c82695b4efd960254626ebd6455e7dab07c700978`.
No importer or asset regeneration is needed for reuse. The existing native
[art comparison](../../../scripts/check-native-follower-task-art.py) documents
its supplied coordinate/raster leaves; it is not a native GPU screenshot and was
not rerun during this static research.

The CSS sets the common root to its original 100×277 logical size. Removing the
painted 2px border is compensated by padding `(top,right,bottom,left)=(9,4,7,4)`:
the existing spell/building inner origin stays `(4,9)`. Followers retains zero
padding. There is no new clipping rule, hit target, changed handler, text, atlas,
accessibility name, `aria-description`, or F8/cheat change. Uniform modern HUD
scaling is retained rather than reproducing the original independent-axis stretch.
The internal spell/building layouts are **not newly certified as original**.

## Help versus Menu

Descriptor `005cb386` is type1 at `(64,114,13,12)`, base icon HFX105, tooltip965,
with both left and right callbacks `0049d150`, renderer `0049d1d0`, and no refresh.
[Raw instructions](help.asm) establish:

- Renderer `0049d21b..0049d22b` passes frame descriptors normal `005caba8`, held
  `005cabc0`, hover `005cabd8` to `004a1dd0`, not a CSS outset border.
  These are HFX1005–1013,1014–1022,996–1004 respectively.
- `0049d233..0049d245` selects base105 at widths≤800 and106 above800.
  Source HFX dimensions are4×6 and8×12; the icon is centered by integer halves.
  The literal `?` rendered in Arial and current12×12 at `(64,113)` are not these
  original pixels/geometry. The selected high-resolution sprite is not a hover
  frame; do not infer icon state changes from its adjacent index.
- Callback `0049d150` enters input mode`0x11`, remembers the previous mode, or exits
  back to that previous mode. [`0047a550`](../../generated/0047a550.c) resolves
  mode`0x11` to POINT13. This is not the browser's `openMenu` callback.

The browser's accessible Menu button, `.help-button` selector and `openMenu`
behavior remain intact. Replacing its semantics with contextual Help would need
the original help-mode hit/dispatch lifecycle and a separate reachable menu route.
This pass does not mislabel original Help as evidence for native Menu behavior.
Exact tooltip965 English wording is not claimed: the full language bank was not
present beside the inspected EXE and no download or extraction was attempted.

## Tribe controls

The six retained descriptors supply two display variants for three controls at
`(78,114/126/138,20,11)`. Their one-based keys1/2/3 enumerate other tribes while
skipping the player. The browser instead paints19×10 solid colors with CSS ridge
borders, with its first control one logical pixel too high. Its widths, colors,
frames and action must not be described as recovered native controls.

Renderer`0049d2a0` uses ordinary/alternate frame pointers in `005cd270 + tribe*12`;
`0049d3e0` additionally chooses the third pointer for the relation-mask state.
[Raw tables](native.json) and [instructions](tribes.asm) bind these families:

| Native tribe index | ordinary | alternate | relation state |
| ---: | ---: | ---: | ---: |
| 0 | HFX879–887 | HFX888–896 | HFX897–905 |
| 1 | HFX906–914 | HFX915–923 | HFX924–932 |
| 2 | HFX933–941 | HFX942–950 | HFX951–959 |
| 3 | HFX960–968 | HFX969–977 | HFX978–986 |

The ordinary renderer's alternate state also depends on flags at`0089c665` and
`00897981` and tribe data, not only CSS hover. Both renderers have a visibility
guard via`004194b0`; refresh`0049d630` uses`00419480`. These routines' complete
semantics and current-world mapping remain unbound in this slice.

Left callback`0049d540` has **no camera-focus call** in its complete bounded body.
If`[0089c661]&8` is clear it returns. Its accepted branch queues tribe command
`0x49` through`00479cf0`. The retained
[`0043e8e0` case0x49](../../generated/0043e8e0.c) sets/resets a tribe relation bit.
Hover callback`0049d5f0` writes a tribe ID to`005cae80`; no right callback exists.
Thus the browser's unconditional “Focus [tribe]” action is an adaptation, not the
recovered original gesture. Do not replace it with relation changes on the strength
of visual art alone, and do not remove gameplay access in this artwork correction.
The unresolved spy-disguise gesture is not established by this callback.

## Source and reproduction

All three input hashes are retained in`native.json`:

- EXE:`3a5065c7420b3fcde208bf220bc86dfbac95e025ab2492caf9c7ea5308dfbe4f`
- HFX:`681eb1734fd73f86a6a52a8540415ec69a241a378161b60e9c9da1263d4ee0bf`
- PAL0-C:`6c61cd586fc96ef5f777c71966a9ac1875491a4a521342ba06d108df5e92bf53`

The retained original-input root was read in place, without copying large inputs,
redownloading, running Windows code, emulation, or Ghidra. GNU objdump2.44 decoded
only the indicated instruction ranges. Reproduce the data with:

```sh
python3 -B scripts/research-hud-controls.py /verified/game/d3dpoptb.exe > /tmp/hud-controls-native.json
cmp /tmp/hud-controls-native.json decomp/research/ordinary-hud-controls/native.json
objdump -d -Mintel --start-address=0x49d150 --stop-address=0x49d2a0 /verified/game/d3dpoptb.exe
objdump -d -Mintel --start-address=0x49d2a0 --stop-address=0x49d690 /verified/game/d3dpoptb.exe
```

`tests/command-dock-art.test.mjs` binds the shipped CSS root, reused PNG identity,
preserved content origin and existing menu-access contract to this static evidence.
It is not a browser rendering test. Required acceptance still includes standard
check/build, inspected exact-head screenshots of Spells/Buildings/Followers at
compact and ordinary desktop scales, tab switching, keyboard focus and unchanged
menu/tribe interactions. No gameplay/parity completeness or hardware-performance
claim follows from this artwork slice.
