# Campaign notification tab presentation

## Original descriptor and state ownership

Verified base-game executable SHA-256:
`3a5065c7420b3fcde208bf220bc86dfbac95e025ab2492caf9c7ea5308dfbe4f`.
The bounded importer also pins the HFX and palette identities. It reads these
inputs as data, never starts the original executable or broad asset importers.

- `004314c0` sets message flag4 for the first hit notification under the pointer.
- `0049f9c0` maps flag4 to control+0c. It maps transient flag2, or the matching
  pressed-pointer states2/3, to control+18/+1c, then clears flag2 after painting.
- The decompiled call omits two arguments. Original instructions at
  `0049faef..0049fb08` push `005cabd8`, `005cabc0`, `005caba8`, `00684172`, then
  call `004a1dd0`. Its parameter order is control, normal, active, selected.
- `004a1dd0` chooses active first, then selected when control+0c is set, otherwise
  normal. For this notification caller, selected means ordinary pointer hover.

The actual row-major nine-piece tables are:

| State | Table | IDs |
| --- | --- | --- |
| Normal | `005caba8` | 1005,1009,1006,1011,1013,1012,1007,1010,1008 |
| Hover | `005cabd8` | 996,1000,997,1002,1004,1003,998,1001,999 |
| Active | `005cabc0` | 1014,1018,1015,1020,1022,1021,1016,1019,1017 |

Every tile is 4×4. These are the same families previously proved for follower
frames, not the unrelated HFX740/758 tab banks. `004a1f50` draws center, top,
bottom, left, right, then full TL/TR/BL/BR corners. Repeat origins are each piece's
top-left, and corners stay source-sized as the outer notification changes size.
See [the retained frame proof](follower-frame-alpha.md) for its shared painter
and enabled white-diffuse branch. The current work does not rerun that native CPU
proof or claim a full original framebuffer comparison.

## Normal and active icon pairs

`0049fe10..0049fe60` selects record+17 normally or record+19 when active, not
when merely hovered, then integer-centers the original image in the tab.
The actual 28-byte records at `0059caf8 + kind*28` give:

- Type1: HFX171 in both states, 25×18.
- Type3: HFX174 in both states, 15×22.

Identical pairs are intentional source data, not a missing highlighted asset.
No alternate icon or tint is invented. The importer retains both descriptor
fields even though their values match.

## Browser integration and boundaries

`OriginalMessageTab` changes only the presentation inside the existing summary.
It uses 9 repeated native tiles, 4px corners, and original-sized icon pixels.
CSS `round(to-zero, ...)` preserves native integer centering for odd dimensions;
ordinary 50%/translate centering would shift the 15px icon half a pixel in an even
tab. Pointer hover and held feedback use their distinct original banks. Keyboard
focus reuses hover as an explicit browser accessibility accommodation. A popup
remaining open does not itself keep the notification pressed.

Queue, position, screen-derived width/height, motion, acknowledgment, Delete,
focus restoration, and keyboard handling remain under their existing owners.
The existing transient activation flag is observed, never consumed here.
Other notification kinds, icons, badge/tribe-color branches, Spy and HUD controls
are outside this change. No new visible text or generic CSS frame is introduced.

Verification entry points:

- `python3 -B scripts/import-message-tabs.py GAME_ROOT --check` checks all three
  tables, both icon pairs and all 29 exact source sprite outputs without writing.
- `pnpm run test:focus tests/message-tab-art.test.mjs tests/campaign-popup.test.mjs
  tests/campaign-popup-keyboard.test.mjs` covers retained artwork and the existing
  source-bound summary/body/keyboard flow.
- Rendered acceptance must compare normal/hover/held/focus at compact, ordinary
  and high-DPI sizes, plus repeated open/close, OK/Delete and queue continuation.
  Source checks do not substitute for actual rendered acceptance.
