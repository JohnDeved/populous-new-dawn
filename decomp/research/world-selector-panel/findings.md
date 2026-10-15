# Original world-selector static panel slice (#17 / #457)

2026-10-15. Read-only repository audit, no original execution/emulation. Repo HEAD 6b1a7867209bc921fdfa33cda18b11a652c91c82, clean status. Reviewed existing world-selector component/data, research note, importer and provenance. No repository mutations. All generated material is in /tmp/selector-static.

## Implementation-ready result

Use original plspanel.spr frame0 as a 638×61 bottom-centred strip. At original640×480 its top-left is (1,419). Evidence:0047e3e0 computes floor(screenWidth/2)-floor(frame0.width/2), screenHeight-frame0.height. 0047e660 starts with0047f2c0, which submits the frame0 texture split into64-pixel tiles at that origin. Native state indicators are overlays, not text buttons or CSS spheres. The source artwork is gold stone with sockets and hand-shaped launch control.

The decoded static reference is panel-initial-c.png (638×61; source-palette RGBA, NOT an original-game screenshot). It supplies an explicit initial state: Mission1 available, no mission completed, no pointer hover/press. panel-frame0-c.png is bare source art. decode_panel.py uses only the existing import-original.py sprites/png function definitions (no importer main execution). PNGs were visually inspected.

Status table at0059dff8 contains25×28-byte entries followed by INT_MIN. Exact source entries and all29 sprite dimensions/hashes are in panel-data.json. Tuple fields0..2 are kind,x,y. Initialization adds panelX-1 and panelY-1 to x,y; kind2 subtracts another1 from both. Frame selection at0047e6c0: kind0→5, kind1→3, kind2→1; increment frame index when completion query00485e40 returns nonzero. Draw only when profile flags&5 OR completion is nonzero. Thus unavailable sockets remain the bare background. First three base coordinates are (34,445),(54,445),(74,445); available frame5 and completed frame6 are10×12. This does not authorize altering the browser's bounded first-three progression rules. Keep existing all23 direct-access and tutorial/load/back separately accessible.

A click-feedback flag at entry+24 adds(1,1) for that draw and resets. Hit rectangles use drawn position/dimensions: left<x<=right, top<y<=bottom. For Mission1 ordinary state this is34<x<=44 and445<y<=457. 0047e530 consumes entry+20 hover plus click flag0x20, sets selected-body index via00412930(mission), and sets one-frame press feedback. A separate global transition bit4 guards launch.

Launch: ordinary hit origin(577,430), dimensions from frame11=37×37, same exclusive-left/top inclusive-right/bottom test. Bare hand is baked into frame0; frame10 overlays it when hovered or pressed, at(577,430), or(578,431) for one-frame click feedback. Routine0047e500 and0047e530 set transition bit4. Selected mission name comes from004c3c40(mission,1), measures glyph widths, then draws centred at screenWidth/2, y400 (0047e8e5–0047e9c1). Exact font pixels/phrase sourcing were not reconstructed. Hover tooltip IDs are978 launch,979 available,980 completed, delayed500ms by0047ea90. Do not label those strings without decoding language resources.

## Palette and active call chain

Initial setup00410fd0 calls0041fb20 (load background),00411790 (bodies/space sprites),0047e3e0 (panel), then00412780(selected mission). 00412780 uses004852f0 header bank, formats data/plspl0-%c.dat, loads1024 palette bytes at pointer0x87eff8, and flags palette refresh. Missions1–3 banks c/s/p as existing provenance establishes.

The caller at00410f02 performs setup then004288b0 at00410f1b. 004288b0→00428e70→0047ed50 initializes the panel sprites and frame0 textures. 0047ed50 passes panel descriptor0x985a80 to00429490 and calls0047f190. 0047f190 explicitly reads palette0x87eff8 and frame0 at panel pointer0x985a8c, then calls0047ee90. This binds panel colour to selected-mission palette, not main-menu fepal1. Mission1 palette SHA2569e6dc9767ea11135c001c69acc090cfdaa7b55131725bc0bce204015050c39c2.

Frame loop00410e20 calls004110e0, then (when frontend-hidden flag0x59dee0 is clear)0041fb80, then00428570. 004110e0 handles input,0047e530 panel update,00412230 orbital positions,004284d0 render setup,00455410 scene work. 0041fb80 invokes00429070,0047e660 unless modal flag0x100, then flush00429160/00429170. Raw disassembly files retain all cited addresses.

## Transparency and accuracy limits

PSFB source uses signed run-length spans: negative skips, positive literal indices, zero end-of-row. Existing decoder preserves skipped pixels as RGBA0 and literal palette colours as opaque. Static panel images reproduce these decoded source pixels. Native panel build0047ee90 zeros its target, invokes sprite dispatcher0052a7e0, converts/tiles for D3D. Its backend is an indirect vtable call; exact device colour quantization and hardware edge/filter behaviour are not claimed. This is a source-art reconstruction suitable for modern proportional scaling, not a pixel-identical GPU capture. Do not replace skips with a guessed palette-index key.

## Background and orbital rendering remain unproved

0041fb20 definitely loads307200 bytes from data/plsbackg.dat into00604470. However, whole-text objdump lookup and complete-file little-endian literal scan find00604470 only at that loader's immediate. This does NOT prove no indirect/offset consumers, but no active background draw/palette binding was established. Do not place this gold resource behind the entire orbit view merely because it is loaded. It may be legacy software-path data; that remains a hypothesis.

00412780 is an asset loader, not proof that the current circular CSS texture preview or any sphere UV/shading is original. It loads plstx%03d.dat to009bcfe0, plspl0 palette, plsft0 to0096eae0 and plscv0 to005fe468. Active scene chain00455410→00455610/004572f0/00455810 and renderer00428570 still need geometry, texture, camera, depth, and raster bindings before orbital bodies/full-frame composition can be reconstructed. Existing25-body layout/radii/angles remain valid authored geometry evidence but cannot close this rendering boundary.

## Recommended smallest visual change

Replace only the invented campaign status/launch presentation with the proportional original stone strip and source-bound overlays, anchoring bottom-centre in an adapted viewport; retain readable accessible labels and modern enlarged hit targets if necessary. Centre mission title above it using original y400 vs419 panel offset. Preserve all existing campaign ownership and compatibility controls. Do not claim the orbit map, globe or whole-screen background is restored. A later source pass should trace00455810 and00428570 for original sphere/orbit composition.

## Reproduction

GNU objdump (GNU Binutils for Debian)2.44: objdump -d -Mintel --start-address=0xSTART --stop-address=0xEND ORIGINAL_EXE > selected.asm. Ranges are explicit in each file's first address; entry410fd0–4112c0, setup411790–412230, render412230–412780, preview412780–412960, panel47e3e0–47ed20, panelinit47ed50–47f480, background41fb20–41fc40, loop410d80–410fd0, graphics-entry4288b0–428ac0, graphics-init428c80–429070, renderer4284d0–428750, blits429070–429670, scene455410–455650. Some files intentionally include adjacent functions; no pseudocode exporter was used. python /tmp/selector-static/decode_panel.py returned0. No full tests/build/browser/probes were run (research only).
