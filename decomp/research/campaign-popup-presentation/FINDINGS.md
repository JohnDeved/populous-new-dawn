# Original campaign popup and mission flyby presentation contract

Recovered 2026-10-21 by static inspection only. No original executable, installer, emulator or native game was executed. The PNG is a source-pixel contact sheet, NOT an original-game screenshot. No runtime/GPU-perfect equivalence is claimed.

## Source identity

- Original executable: `populous-original-inputs-20261020/game/d3dpoptb.exe`, SHA-256 `3a5065c7420b3fcde208bf220bc86dfbac95e025ab2492caf9c7ea5308dfbe4f`.
- HFX: `data/hfx0-0.dat`, `681eb1734fd73f86a6a52a8540415ec69a241a378161b60e9c9da1263d4ee0bf`.
- Palette: `data/pal0-c.dat`, `6c61cd586fc96ef5f777c71966a9ac1875491a4a521342ba06d108df5e92bf53`.
- F00T3: `data/f00t3-0.dat`, `148658bb22b8a42f892719d0f0b814ccb9cfcb260f8e6f1ea60475bec90b9af0`.
- English text: `language/lang00.dat`, `e826c478746d666a3ea9ea36cb7804d1d226d5f83084230987b1de293066cf7d`.
- Existing archive: `populous-original-inputs-20261020/PopulousTB-Setup.zip`, `6aa6c366809ea1d9575ec1d31a24527a95c7332f0a1d2ab692f7a602e7e10702`.
- Inner installer: `c5d3ad2a1b369e636df85a6061b832c18f2dc33526a03383f61abd7b5518c52d`.
- Current UI was audited separately at commit `be44bc76f21429c472978c3dcb8893e565b6a4fb`. Retained Ghidra exports and importer definitions were read in `populous-recovery-20261019` (observed HEAD `5282c4c57bdfd128741373be25f1b1faa8a66865`).

Missing language/font inputs can be read from the existing archive with the existing `scripts/extract-reference.py --component Component0`; no download is needed. This package contains only bounded evidence, not the full archive or game.

## Native ownership

`004314c0` selects and consumes an ordinary pending notification, calls `004af440(mode,stringId)`, passes its strip anchor rectangle to `004afac0`, binds the slot with `004af630`, and sets transient notification bit 0x2. The anchor is NOT the body bounds.

`004af440` sets popup state 2, string ID, mode and button types, and calls `004afb00` for final bounds. It owns input-mask bit 0x10. `004afac0` stores the anchor and changes state to 3 (opening). `004afa70` advances states 3 and 4 into settled 2 and closed 0. The source duration derives from `005ca850 / 5`, clamped to 4..16; native absolute presentation cadence is not established here.

Main drawing owner `00522570` calls body renderer `00525650` at `005229d4`. The renderer uses final panel rect `0089bb8f..0089bb9b`, text rect `0089bb9f..0089bbab`, and button rectangles `0089bbbf` (16-byte stride). Opening/closing states interpolate the anchor/body rectangle; settled state draws content/buttons. No browser-style heading or × is in this body renderer.

## Artwork and font

Body helper `00523d40` uses 16x16 HFX tiles:
- corners TL/TR/BL/BR: 1450,1451,1452,1453;
- alternating top:1454/1455, bottom:1456/1457;
- constant left/right rail pair selected by final horizontal-loop parity: left1458/1459, right1460/1461;
- center:1462.

Parity audit: `cmp parity,1; adc value,-1` retains the high ID for even0 (carry1), subtracts1 for odd1 (carry0). Top =1454+(column even), bottom =1456+(column even). At00523e9f the horizontal loop leaves EBX=columns−1; left/right are selected ONCE as1458/1460+((columns−1) even) and repeated unchanged through00523efa. Rails do not alternate by row. The original result importer and popup painter already use this mapping.

The inspected pixels are a mottled golden panel with rounded beveled outer corners. It is the same panel helper used by result statistics, NOT the separate tooltip border. Do not scale the existing fixed-size `result-panel.png` into arbitrary dimensions; compose native tiles.

Button helper `004a2560`, backed by 8x8 HFX tiles and helper `004a1f50`, selects these nine-slice tables (TL,T,TR,L,C,R,BL,B,BR):
- normal `005cacc8`: [821,825,822,827,829,828,823,826,824];
- pressed `005cace0`: [839,843,840,845,847,846,841,844,842];
- hover `005cacf8`: [830,834,831,836,838,837,832,835,833].

The renderer pushes held-down as the third argument and hover as second. Third=true takes pressed. Hover additionally requires global `00897981 & 4`. Existing importer names for 830/839 do not override these call/data bytes.

`0042bde0` chooses font selector byte `008928de`: TOTAL screen width*height below 0x4b000 (307200) selects F00T4; otherwise F00T3. This is not battlefield viewport area. `0042ac70` establishes Western F00T file loading. Asian font types have separate font paths and are outside these Western metrics.

Popup renderer uses font vtable `00591688`; CPU path `00527a00` draws raw glyph sprites through `0052a7e0`. GPU mapping `00516c80` uses white modulation by default; the body helper clears vertex flag8 before text. This differs from result-statistics recolor vtable `00591698`. Existing `result-font.png` is raw alpha=False source decoding and may supply F00T3 glyph pixels WITHOUT CSS tint. Runtime palette/filtering/GPU equivalence remains unproved.

F00T3 source glyph dimensions: A=10x19, space=8x19, O width14, K width10; width/advance is glyph width, OK=24px. Text lines advance by A height19. View `hfx-source-contact-sheet.png` for source-pixel inspection.

## Final layout at ordinary positive dimensions

All integer divisions below truncate toward zero. `00417310` establishes viewport X,Y,W,H from total screen and side panel: X=sideWidth+8u, Y=8u, W=screenWidth-sideWidth-16u, H=screenHeight-16u. `u` is byte `0089c6c3`. Side width comes from `0044bb80`, omitted when `land_flags_1 & 4` or `load_level_flags & 0x200`. The layout uses signed shorts `0088f026/28/2a/2c`, so W is battlefield width, not screen width.

Let Aw,Ah be the active A glyph width/height, Tw,Th the 1462 tile size (16 each), and n the button count.

1. `wrapWidth = W - trunc(12*W/32)` (`004afee0`).
2. Count lines using `0045ec10` with wrapWidth and output capacity512; textHeight=lines*Ah.
3. `padding = trunc(24*Aw/16)`; `buttonHeight = trunc(22*Ah/16)`.
4. Each `buttonWidth = measuredLabelWidth + 4*Aw`; initial gap=3*Aw.
5. `buttonTotal = sum(buttonWidths)+(n-1)*gap`.
6. `panelWidth = ceil((max(wrapWidth,buttonTotal)+4*padding)/Tw)*Tw`.
7. `panelHeight = ceil((textHeight+buttonHeight+5*padding)/Th)*Th`.
8. `panelLeft = X+trunc((W-panelWidth)/2)`; `panelTop=Y+trunc(H/32)`.
9. `textLeft=panelLeft+trunc((panelWidth-wrapWidth)/2)`; `textTop=panelTop+buttonHeight`; text rect width=wrapWidth and height=textHeight.
10. `buttonTop=panelBottom-trunc(12*Ah/16)-buttonHeight`.
11. One button starts at textLeft, NOT centered in the panel. For n>1, gap becomes `trunc((wrapWidth-sum(buttonWidths))/(n-1))`; first starts textLeft and the final right edge is textRight. Center each bitmap label in its button using measured width and Ah.

There is a native line-count clipping guard comparing the accumulated Y to `Y+W-4*Ah` (W, not H) in `004afee0`. It is preserved as evidence, not a recommendation to blindly reproduce a possible native defect on modern extreme aspect ratios. Any modern fitting policy must be marked as an adaptation.

Example derived from source, NOT a native capture: at640x480 with sideWidth100,u0, F00T3 and English611, viewport=(100,0,540,480), wrapWidth338. Lines are “I have created my Reincarnation Site”, “and the settlement is nearly”, “complete. ”. Panel=(170,15,400,160), text=(201,41,338,57), ordinary single OK=(201,135,64,26).

## Exact Western wrapping

Retained `0045ec10` initializes an empty output and appends while current measured width <wrapWidth, source remains, and appended count<511. It marks a potential break AFTER a char for which `00493230` and the next-char predicate `004932e0` both return true. Western break characters are space, hyphen, comma, period, colon, semicolon; Western next-char predicate always returns true.

If source remains after the loop, use the last break when available, remove one trailing space via `004933a0`, and skip leading spaces in the next segment. The loop may append a glyph that causes width overflow before noticing it. If no break exists, that glyph remains. At end-of-string, no trailing-space trim occurs. No extra Markdown, newline interpretation or browser whitespace policy is established by this routine.

## Buttons, labels and input semantics

Caller mode, in priority order:
- flags&0x100000 -> mode1 -> [OK,Save,Exit];
- otherwise flags&1 and NOT flags&0x200 -> mode2 -> [OK,Delete];
- otherwise mode0 -> [OK].

`004afeb0` labels: type0->English227 OK; type1->278 Save; type2->279 Exit; type3->323 Delete. Do not substitute an invented close glyph or label. Save/Exit behavior must not be silently replaced by OK.

Keyboard `004a9d90`: popup states2/3 consume keys first; only Enter/keypad Enter DOWN (0x1c/0x9c) dispatch command0xb0 (ACK). Escape and Space are not popup ACK in this path. Mouse `004aa1c0`: state2/3 accepts button0xf0 RELEASE, but clicks are dispatched only in settled state2, command0x66 -> `004af780`. Hit tests use inclusive bounds. Clicking a notification region can be treated as type0 ACK.

OK calls `00431bb0(slot)` without setting0x200. That helper sets deletion/transition flags0x8|0x2 ONLY when record already has BOTH0x1 and0x200. Thus OK retains a normal deletable record whose0x200 is clear. Delete first ORs0x200, then uses the same helper; a record with0x1 is then removed. The helper additionally repositions the camera when flags0x400 and0x20 are both set. The popup caller clears pending0x20000 before opening, then sets transient0x2, but does not itself set0x200. Some producers may already supply0x200. Do not globally map every OK to message removal.

## Mission flyby versus movies

Mission flyby is NOT startup BLOGO or intro FMV. In `004a9d90`, under the input-mask path, DOWN Space code0x39 calls `00449080` only when `load_level_flags & 0x04000000` is clear and flyby flag1 active. The skip routine itself requires flyby flags0x11. Popup Enter handling precedes it. Native Escape follows a different command branch; a native mouse flyby-skip binding has not been established.

No English string contains “skip” or “intro” (1318 nonterminal strings; the split has one terminal empty item). The exact 'Press Space Bar' string250 is drawn by results/statistics `00523fa0`, guarded by `level_flags_1 & 0x20` and the result condition. It is also drawn indirectly by end-level overlay `005239f0`, under `land_flags_1 & 0x06000000`, paired with English248 Level Complete or249 Level Failed. Flyby start `00448ee0` explicitly clears level flag0x20. Neither result path is evidence for a flyby instruction.

A whole-binary direct reference scan for flyby flags address00969bd7 finds controller/input accesses, no render consumer. Main drawing owner `00522570` likewise has no direct flyby prompt. This supports removing the invented floating 'Skip introduction ESC' pill without inventing another visible prompt; it is NOT absolute proof against every indirect/script/image-based string.

Normal skip branch `004491c2` loads English1181 “Flyby Cancelled” and calls timed-text owner `0047aa20` with duration0x20. This is a post-cancellation status, not an always-visible skip control. Warmup cancellation takes a different path and does not reach this status call. The status renderer was subsequently bound below.

Startup logo/movie behavior remains covered by retained `decomp/research/original-startup-movies.md`, `original-startup-boundaries.md`, `original-movie-input-player.md`: BLOGO wrapper00523170; new-game004c3340 chooses one language-specific intro; movie wrapper0049cc80 installs callback0049cc50, key/button DOWN handlers0049cc10/30 set a stop flag. Any delivered supported key/button can stop the current movie. This does not authorize porting that behavior to mission flyby or prove a visible movie skip prompt.

## Evidence limits and file notes

Bounded objdump listings are original bytes disassembled as data. The large contiguous controller-layout listing crosses a jump table near004afa60; use separate `anchor-animation.asm` for aligned004afa70. Do not interpret linear jump-table bytes as instructions.

Actual pixels inspected: source HFX contact sheet; existing source-derived result panel/font; current browser message screenshot `pr698-publication/02-messages-auto-640x480-dpr1.png`. The current dark translucent Arial/ridge/× body is not supported by the recovered golden tiled bitmap contract. Existing screenshot is browser output, not native reference. Exact native GPU filtering, palette changes, text animation cadence, Asian font paths, modern aspect-ratio adaptation and complete Save/Exit flow remain separate gates.

## Additional native pause and timed-feedback contract

This follow-on is source recovery, not an implementation requirement to retain arbitrary browser prose. `0047aa20` copies bounded UTF-16 text into `008922f2`, sets timed flag `008922ee & 1`, stores lifetime at `008922ec`, and stores message flags/prefix metadata. `00523200`, called from main draw at `005229ca`, decrements that lifetime once per renderer visit and clears the timed record on expiration. Nominal duration32 is NOT proved equal to any fixed wall-clock seconds.

Native pause is not the invented centered WORLD PAUSED / Click to resume card. English231 is exactly **Paused**. Command owner `00479f00`, at `0047a1e6`, toggles or explicitly sets `land_flags_1 & 2`. The paused branch at `0047a23e` copies English231 into persistent buffer `00892397`, sets status flag2 and message flags0; the resume branch at `0047a2fd` clears that status.

Renderer00523200 prioritizes a live timed flag1 record, otherwise persistent flag2. It chooses font selector `008928d4` (array index1): F00T3 at screen area>=307200, otherwise F00T4. This is the raw direct glyph vtable00591688, not a CSS tint, browser font or boxed toast. For ordinary flags, horizontal origin is `screenWidth - measuredTextWidth - prefixWidth - 2`; vertical origin is `screenHeight - Aheight`. Global status flag4 instead uses horizontal origin0. A nonlocal tribe prefix can be drawn immediately before the text; the local-player case uses no prefix. The native function makes no panel/background/border draw. Flags and native global gates can suppress a record; do not infer unrestricted rendering from a matching English phrase alone.

Evidence files `status-renderer.asm`, `status-buffer.asm`, `pause-state-message.asm`, and `status-language-selected.json` bind these facts. The same main render also draws end-level Complete/Failed plus Press Space Bar in `005239f0`; see `end-level-prompt.asm`. That overlay is not pause or flyby instruction.

## HUD font reuse correction and direct pixel verification

An earlier verbal warning that the existing HUD font atlas used alpha=True was incorrect. `scripts/import-hud.py` calls `sprites` without overriding its default alpha=False for F00T3/F00T4. All224 F00T3 glyph crops in hud.png are RGBA-identical to the raw result-font.png crops. All224 F00T4 glyph crops are RGBA-identical to alpha=False decoding of existing extracted original F00T4 bytes with the hash-matching initial pal0-c palette. See `hud-font-pixel-verification.json`. The HUD atlas can be reused directly for these source-pixel fonts; no duplicate font import or CSS tint is required. Native runtime palette/filtering limitations still apply.

## Small-font button corner overlap

Retained `decomp/generated/004a1f50.c` and `button-nine-slice.asm` confirm a minimum rectangle dimension of ONE top-left corner sprite width/height, not twice that size. Native8x8 button corners are never compressed. They are submitted last, in TL,TR,BL,BR order, at(left,top),(right-8,top),(left,bottom-8),(right-8,bottom-8). With F00T4 Ah10, buttonHeight13 therefore overlaps top/bottom corners by3px. Top and bottom horizontal8px strips likewise overlap3px, with bottom submitted later. Vertical edge strips are omitted because top+8 is not less than bottom-8. The center call is submitted first with computed height-3; the downstream handling of this negative quad is not bound here, although subsequent strips/corners cover its geometric region. A browser border-image that expands the minimum height to16 or shrinks corner artwork is not the native layout.
