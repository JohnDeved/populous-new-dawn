# Original frontend Quit menu (menu1)

Refs #457. Restore the proven original fullscreen prompt, three rows and shadows.
Native exit behavior has no matching browser operation. Yes is visibly disabled;
always-visible browser guidance explains how to leave and qualifies checkpoint
persistence. No, Back and Escape use the existing main-menu back handler. Back
retains initial focus and returning to main restores Quit focus.

This note establishes static source-backed presentation, not native execution,
full-frame native screenshot equivalence, or exit-behavior parity. In-game menu19,
save/store ownership, campaign rules, assets and widescreen composition are unchanged.
The plain-text guidance and unavailable state are browser adaptations.

## Provenance and source identity

- Implementation base: `0d2ad770ed03f6d049b01bd71176f954a6e4e044` (post-PR468).
- Original input `/workspace/scratch/69fd8163d94e/populous-research-inputs/game/app/D3DPopTB.exe`, SHA-256 `3a5065c7420b3fcde208bf220bc86dfbac95e025ab2492caf9c7ea5308dfbe4f`.
- Adjacent `language/lang00.dat`, SHA-256 `e826c478746d666a3ea9ea36cb7804d1d226d5f83084230987b1de293066cf7d`.
- Existing SHA-locked PE reader, Python3, GNU objdump2.44. Original bytes were read/disassembled only. No original code execution, emulation, Ghidra, browser, asset import, full checks or build.
- No inspection or retry of denied notification controllers 004af440, 004afac0, 004af630. Neither native callback leaves nor notification systems are needed to establish this presentation.

## Exact menu1 evidence

Record `005d9cb8` (`005d9c98+1*32`) points at list `005d9ae0`. The sentinel is `005d9b00`: exactly four entries, no type1 updater or graphical/frame descriptor. Menu entry `0045a3c0` maps types2/4/5 to no-op initialization at `0045a4b2`; thus no per-menu layout initializer replaces these descriptor coordinates. The type2 paragraph's optional post-render callback at +0x28 is zero.

| Row | Type / descriptor | Text | x anchor | y fixed → top | Typeface and action |
| --- | --- | --- | --- | --- | --- |
| Question | 2 / 005d7648 | 1212: Quit? | center320 | 0x5555 →159 | style2, noninteractive low bank Felo33we |
| Yes | 5 / 005d81c4 | 235: Yes | center320 | 0x6555 →189 | style2, callback004c3610 |
| No | 4 / 005d7c18 | 236: No | center320 | 0x7555 →219 | style2, target menu0 |
| Back | 5 / 005d7d78 | 328: Back | center320 | 0xf2aa →454 | style2, callback004c3970 |

Each xFixed is0; screen anchors and text alignment are (1,0), center/top. y is arithmetic shift16 of fixed×480, not rounded. The question width is640, line spacing30, state0; its short single-line text does not wrap. Original centered left positions are281,299,303,288 respectively, from native widths78,42,35,64. Foreground normal/highlight/low and shadow glyph advances match for these strings.

Critical font distinction: type2 state0 begins with flags1 at0045b741 and ORs8 at0045b779, giving9. Rendering passes those flags at0045b8fb–0045b920. `004fe5d9–004fe5e3` selects style variant2 for bit8, and `004fe657–004fe661` selects style2 bank8 from `005d5da8=[6,7,8,9,10,0]`. Therefore the question uses Felo33we, not FEFT33WE or the highlighted font. Type4/5 renderer0045b9bb uses flags0x11 normal /0x31 keyboard-selected; the shared resolver supports pointer highlight. Their banks are FEFT33WE/Fehi33we. All three atlases already ship.

This is distinct from in-game menu19's question1185 `Quit Game?`, which uses the separate in-game font path. Do not copy its wording or F00T9 font into frontend menu1. The existing pause font/effects remain unchanged.

## Frame, backdrop and shadows

The retained frontend draw path00459100 copies the existing bank1 background, queues the currently selected menu at00459151–00459157, draws text shadows at00459176, then title shadow, pointer glow, text foreground and title. It is not conditioned on menu0. Combined with the four menu1 text descriptors, this supports the bare original submenu over the existing 640×480 frontend art. No popup border, rounded rectangle, loading mask, overlay dimming or invented frame asset is evidenced for this surface.

Reuse the existing Febackg1/fepal1 composition, title/logo, Fepointe cursor, FEsd33WE indexed fade shadows, pointer parallax, glow timing and input-mode ownership. Add menu1's rows to the background compositor when Quit is selected; the previous component supplied no textRows for Quit, so its text shadows were absent. Do not leave menu0 row shadows visible behind the new submenu. Keep uniform fit/pillarboxing as it currently exists; #460 widescreen rejected WIP remains a separate issue. No tiling, repeated scene elements, outpainting or new background attempt belongs here.

## Actions and truthfulness

- Main `Quit` descriptor005d7ae4 is type4, language308, target1. Its dispatch0045b479–0045b495 calls menu setter with descriptor+0x28.
- `No` uses that same dispatch with target0.
- `Back`004c3970 reads the current menu record+0x0c and tail-jumps to it. Menu1 has004c3800 there. In ordinary frontend context, when external/ingame/alternate guards are clear,004c3836–004c3838 selects0. Other contexts remain explicitly conditional.
- `Yes` type5 invokes004c3610 through0045b496–0045b4b7. Static callback bytes show cleanup/state effects, including a DLL session-destruction import, flag updates and audio calls. Those downstream effects were not executed or recursively traced; no complete original process-termination or persistence claim follows. The browser has no matching current Yes handler.
- Before this restoration, `OriginalMainMenu` Quit is a generic bordered `.panel`, heading “Quit Game”, prose and Back. Current `back()` only sets panel main, Escape delegates to it, returnFocus remembers Quit. Preserve these state/handler boundaries.
- Previous prose “Your saved checkpoint will remain available in this browser” is too strong: game-store.ts stores the in-memory checkpoint before attempting persistence, and hasCheckpoint only checks the in-memory value. A save failure may still leave Load available for this session. Use conditional copy above; avoid broad new persistence state/API changes in this slice.


## Reproduce the static packet

Run from the repository root with the already-authorized original game data:

    python3 decomp/research/frontend-quit-menu/read-menu-data.py --repo . --game /path/to/game/app --output /tmp/new-quit-menu-data.json

The reader verifies the executable and language hashes before reading PE descriptors;
it never executes the original. Compare the output's menu records with static-data.json
(the local input path may differ). The retained disassembly windows were read with
GNU objdump 2.44. Each finite window names its address; surrounding native font and
frontend draw evidence remains in ../frontend-menu-static/. No new asset import or
parity credit is involved. Tests validate descriptors, exported production row data,
existing atlas metrics and shadow inputs. Browser receipts separately establish live
UI behavior, fallback, focus and display fit.
