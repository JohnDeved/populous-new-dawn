# Route-failure tooltip: bounded static contract

## Result and scope

English string 603 is **“One or more of your people can't get to this point.”** It belongs to the world-anchored tutorial tooltip owner `0044a2f0`, not bottom-right timed status `00523200` and not campaign popup `00525650`. The original route-specific background palette is red, with the existing four-pixel native tooltip border and raw F00T glyphs. There is no decorative star, title, close button, or fade animation in this owner.

Only original file data, retained pseudocode and GNU objdump were read. The original executable was not run or emulated. No repository files were edited. This folder is a small, separately saved evidence deliverable. Repository reference: `populous-recovery-20261019`, observed HEAD `5282c4c57bdfd128741373be25f1b1faa8a66865`. The executable and asset hashes are in `source-data.json` and the manifest. Existing pixel artwork is not a native game screenshot.

## Dispatch, lifetime and dismissal

- `00499d90` applies its native tutorial gates: land_flags1 bit8; opened_files_flags bit0x10; game_state.level_flags bit2; land_flags1 high-byte mask6; and already-seen requested flags at the savegame header offset5008.
- `00499f40`, branch `0049a02e`, maps request flag `0x200000` to mode9, returns1, and does not mark the flag as seen. The caller takes the tooltip branch and calls `0044d7f0(9,0,(short)maybe_framerate*3)`. The generic message argument603 is not used by this branch.
- `0044d7f0`, mode9 at `0044dac6`, resets previous shared tooltip state, writes string pointer `00973514` to buffer `0068b6a1`, sets anchor `0068c6bb` from `0089bc26`, flags `0068c6c0=8`, style `0068c6bf=1`, and signed-short remaining visits `0068c6bd=3*maybe_framerate`. It also submits sound `0048a050(0,0xe1,1)`.
- `0044db60` decrements remaining visits once per call, clears the shared state when it reaches below1, otherwise sets draw latch1, scroll0 and hold2*maybe_framerate. Flags8 bypass the unit-existence test. `004aa4e0` calls this in both ordinary and modal-input branches when the native frontend/input owner is active. This is a frame-count lifecycle, nominally three seconds at its supplied cadence, not a CSS fade or a simulation-turn expiry.
- While its countdown returns1, ordinary hover acquisition is not run by the ordinary branch of `004aa4e0`. Another `0044d7f0` request replaces it. Generic reset `0044b100` also clears it; calls include command IDs0x79,0x7a,0x7c in `004aab80`, contextual check `00499d4a`, and level-loading paths. Those are not a dedicated route-notice click-to-dismiss button. Exact physical bindings of those command IDs were not re-derived in this pass.

## Font, line layout and frame

- Renderer `0044a2f0` is called by main draw owner `00522570` at `0052275f`. It requires nonzero `00684218`, draw latch `0068b69d`, no `00451370(2)` gate, level_flags1 bit0x20 clear, and nonempty text. It consumes the draw latch even when gated.
- Raw instructions `0044a36e–0044a3b2` select font pointer4 when full screen height <=600 and pointer3 when >600, through `0087cbd0[]` and direct bitmap vtable `00591688`. These bind to F00T4 and F00T3, not FONT banks. Do not use the campaign/status area threshold here.
- Text is original colored bitmap glyph artwork, not CSS tint palette80. Existing `hud.png` F00T3/F00T4 raw glyphs were independently verified in the preceding popup evidence; all224 glyphs in each bank match native source pixels. Direct GPU modulation is white. Special inherited blend states are discussed below.
- With global `00895da8 & 0x40000` clear, the renderer searches13 widths, base+0,10,...,120. For full screen width S and full text pixel width L, base=max(S>>3, min(trunc(2*S/5)-10,trunc(L/2))-60). For each width, sum unused line widths, replacing negative unused width with100; select the first strictly smallest penalty. `0045ec10` wrapping has127-character capacity and breaks after Western space, hyphen, period, comma, colon or semicolon; the trailing breaking space is removed and following spaces skipped. Lines center with `(width-lineWidth)>>1` and use glyph A's stored height,10 for F00T4 or19 for F00T3. Existing `app/tooltip-layout.ts` already reconstructs this normal path.
- Source-derived examples in `source-data.json`: at640x480, F00T4, text rectangle102x30, lines “One or more of” / “your people can't” / “get to this point.” At800x600 the same lines use100x30. At1024x768 or1280x720, F00T3,276x38, lines “One or more of your people” / “can't get to this point.” These are static reconstructions, not native captures.
- Global0x40000 selects a different colon-heading/scrolling path; mode9 itself does not set or clear this global. That special state is outside the normal wrapping examples.
- Frame helper `004a24c0` forms rectangle `[x-4,y-4,x+textWidth+3,y+textHeight+3]`, fills it, then calls `004a1f50` with table `005caae8` = `[591,595,592,597,0,598,593,596,594]`. All eight HFX tiles are4x4 and there is no center texture tile. Do not silently convert this into a guessed CSS width/height or inset convention: the exact raster endpoint semantics still need acceptance.
- Existing `public/original/tooltip-border.png` is12x12 and was compared pixel-for-pixel against those original HFX tiles with pal0-c. Zero mismatches. Actual pixel inspection shows a thin golden/brown outline and rounded pixel corners; not the large mottled campaign frame. The receipt has its hash.
- At `0044a9e1`, route style1 substitutes byte `0089c6f6` for ordinary tooltip palette index0x98. `0042adc0` fills this slot using nearest palette color to RGB(255,0,0), through `00526660` squared RGB distance. Shipped pal0-c has unique nearest index139, RGB(255,37,0), #ff2500. Route does not use ordinary tooltip ochre.

## Exact anchor data and projection

- The source anchor is the **last issued player command destination**, not necessarily the unit currently reporting its failed route. `004aa8b0` calls `set_tribe_command` with packed destination `0087caba`, then at `004aa97e` stores its low16 bits in `0089bc26`. It records the corresponding game offset counter in `0089bc22`. Mode9 copies that packed destination when requested.
- Route flags8 take the map-cell path rather than the flags4 unit path. Let packed cell C: X=(((C&0xfe)+1)<<8)&0xffff and Y=((((C>>8)&0xfe)+1)<<8)&0xffff. This centers the 2x2 native cell. Initial height comes from `0044e940`.
- At `0044a834–0044a850`, call `004e6a70(position, (tribe_ptr[+0x32]+0x200)&0x7ff, 0x80)`. Thus a camera-angle-relative world-space offset is applied before projection, not a guessed screen margin.
- The shifted position is converted to wrapped signed differences from tribe_ptr X/Y, arithmetic-shifted right1. Height is sampled again. Route uses zero vertical extra; unit tooltip branches separately add0x80 or0x200.
- `0046dbe0` projects this coordinate. Clip flags0x1e suppress the tooltip. Screen x is trunc(projectedX + signed-short0087ca8c) and y is trunc(projectedY + signed-short0087ca8e). Flags2 would subtract half text width, but route flags8 do not set it.
- Clamp x/y into [0,fullScreenDimension], then if x+textWidth>=screenWidth setx=screenWidth-textWidth, and similarly for y. This clamps **text**, not its expanded4/3 frame. A generic “4px safe margin” is not the literal source rule.

## Blend-state evidence and acceptance boundaries

`004a24c0` calls indexed palette conversion `00415f70`, then background quad helper `00516a00`. The quad helper uses alpha255 when vertices_flags lacks0x18; bit8 selects `005da07c` (or special ghost-palette mapping), bit0x10 selects256-`005da07c`. It sets blend flag0x40 in those alternate cases. The route renderer does not set or restore these global bits. Main owner calls `0044ac00` immediately before it, and that dispatcher sets/clears bit8 depending on the last active control. Therefore this pass does not establish one unconditional route alpha for every native state. No new opacity should be invented or described as proven.

Minimal separate implementation prerequisites:
1. Preserve last issued command destination in presentation state, and copy it into the route request, matching the source owner. Current routeNotice contains only flags/message/serial and is insufficient.
2. Route through the shared timed tooltip owner, with native mode9 flags/style/text and visit lifecycle; do not reuse bottom-right world-message or campaign modal.
3. Reuse verified raw HUD F00T3/4, existing native tooltip border, source-derived red palette, and existing normal wrapping algorithm. Remove decorative star and CSS fading for this path.
4. Supply the source-compatible world anchor offset/projection and text-bound clamp, including shared-tooltip arbitration and renderer gates. Current object-tooltip browser projection is already documented as an adapter, not exact source parity.

Remaining acceptance gates: full inherited blend/ghost state, runtime palette variation, exact original world-to-screen adapter and inclusive raster endpoints, physical bindings for generic reset commands, and the optional global0x40000 scrolling path. No original screenshot or original runtime execution was obtained. This is enough to scope the separate replacement patch, not a claim that current tooltip projection or all rendering is already exact.
