# Frontend static proof, 2026-10-15

Original D3DPopTB.exe SHA256 3a5065c7420b3fcde208bf220bc86dfbac95e025ab2492caf9c7ea5308dfbe4f. All inspection is data reading and GNU objdump; no original execution/emulation. Repository files were not edited.

## Corrections to initial audit
Descriptor font style2 is NOT glyph bank2. Style table005d5da8 is [6,7,8,9,10,0], selecting FEFT33WE (normal), Fehi33we (highlight), Felo33we, Feti33we, FEsd33WE. 004fe4b0 resolves normal/highlight from flags0x11/0x31. Main normal button y values are top anchored; signed fixed point truncation gives139,169,...379 at480height, not rounded140.

## Logo
00459bf3–00459c34 places foreground first sprite at (screenWidth>>1)-(width>>1),60-(height>>1). English first frame279x101 =>181,10 at640width. Second frame11x6 (TM) draws immediately adjacent at460,10 (0045932b–34d), except language mode11. Loader language mapping at00459b70 picks default table row0, whose filenames are felgspen.spr/FELGsdEN.spr.
Shadow294x111 base173,5. 0045917b–1d5 uses pointer-relative parallax x=baseX-((pointerX-(width>>1)-baseX)>>5), likewise y.

## Indexed fade composition
00459d60 uses source mask value as row of fefade1.dat: outputIndex=fade[(mask<<8)|destinationIndex]. Transparent sprite runs leave destination unchanged. This applies to logo shadow, glyph shadows and fecursor glow; ordinary RGB sprite decoding is incorrect for these masks.
Font banks6–9 have field+0x18=0 and +0x1c=10. Shadow bank10 has +0x18=1. Thus004fe070 renders shadow fallback through004fe270->00459d00->00459d60 (glyph-level pointer parallax), while004fdbc0 renders foreground glyphs via00527960 in the regular English sprite branch.

## Pointer
Fepointe.spr is a single26x27 direct palette pointer.0045929d–2a7 installs first sprite via004fca00 with0,0.004fd3e6–4d9 positions cursor surface at actual pointer without half-size subtraction: hotspot0,0.
fecursor.spr is eight128x128 fade masks.004591ea–222 advances one frame when current clock exceeds previous+100ms, wraps at frame count.00459223–24f positions at pointer-64 on both axes. This is gated by frontend flags0x20. Ordinary pointer is separate from this glow.

## Main draw order
00459100–140 copies640 indexed pixels per background row. Then queued text shadows00459176; logo fade shadow004591d5; pointer glow0045924f; foreground text00459301; foreground logo0045931a/34d. Pointer surface compositing is separate.

## Limits
Native disabled-row appearance and all input-mode producers were not fully traced. Browser widescreen uniform scaling is an explicit adaptation. No native startup screenshot or boot sequence is claimed. No game build/test/browser executed by this audit. Raw disassembly excerpts are adjacent.

## Supplemental pointer-mode proof, 10:18 UTC
Frontend init00458790 unconditionally writes flags00749dfc=0x20 at004587a0 before the resource-init guard. Therefore pointer glow is enabled on ordinary main-menu startup. Pointer movement00458d6d–00458dc1 compares both current coordinates00749df4/8 against saved00749c90/4. Any coordinate change sets0x10, and0x10 restores0x20. Unchanged coordinates clear0x10 but do not re-enable0x20.
Keyboard/menu navigation0045a500 clears0x20 at0045aa00 (selected-index decrement) and0045ab43 (selected-index increment), among other key actions. Thus glow belongs in main-menu pointer mode; hide on keyboard navigation and restore on actual coordinate change. Full platform scancode mapping remains outside this slice.

## Exact shadow arithmetic
Both logo axes use SAR5 (004591ac/004591c2), not signed division/truncation. Logo shadow x=173-((pointerX-320)>>5); y=5-((pointerY-60)>>5), at640x480.
Text00459d00 applies per-glyph xDraw=x-((pointerX-(shadowGlyphWidth>>1)-x)>>5), analogous y.004fe270 returns current shadow-bank sprite width as the advance; do not assume foreground advance universally. Independent reviewer checked widths for the main-menu labels match across currently used banks.

## Added raw excerpts
00458790 initialization and bank1-loader caller;00459940 bank loader;00459100 background and composition;00458d6d pointer-mode restoration;0045a935 keyboard/menu-mode clearing;00459d00 glyph shadow;004fe270 glyph advance. Background selector caller00458835 pushes1 then0045883d calls00459940. Loader picks table005d71f0+index*16 and reads0x4b000 background bytes,0x400 palette bytes,0x4000 fade bytes,0x10000 ghost bytes.
