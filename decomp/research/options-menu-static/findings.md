# Options layout proof (static-only, 2026-10-15)

## Result and next bounded slice
Restore one shared original Options composition with explicit frontend/in-game skins, original tab positions and five-row Sound composition. Preserve a clearly identified Master/Music browser adaptation; native audio semantic parity is NOT established. Native Options initially selects Game, not Sound: a first Sound-only slice must explicitly disclose its alternative initial tab or provide truthful Game-unavailable content. Do not ship original Game/Graphics selectors as working controls without adapters. Direct3D tab is visible only in Graphics and Direct3D states, not Game or Sound.

## Provenance / limits
Repository /tmp/populous-raid447-fallback-0229; HEAD52f83f2f4c7bcaad2193db177ad61aaf8256e368; initial unscoped git status failed because its object was missing; scoped GIT_OBJECT_DIRECTORY=/tmp/ui460/git-objects GIT_ALTERNATE_OBJECT_DIRECTORIES=/workspace/scratch/69fd8163d94e/populous-near-transfer/.git/objects git status --short was empty. No repository edits. Browser source read explicitly from main7ae169bded39e826fd3122fe72dfc92fb5e6b7b8: app/original-main-menu.tsx and app/original-pause-menu.tsx accept options ReactNode; pause calls it Browser options and help.
Read AGENTS.md, local skill, GOAL.md, engineering/README.md, native-research.md, original-menus.md, frontend-menu-composition.md and frontend-menu-static retained exports first. New evidence uses Python3 static PE32 reader from scripts/check-static-mission18-sky.py and GNU objdump2.44. No original execution, emulation, build, browser, full tests, Ghidra or asset mutation. No unrelated denied operation retried.
EXE /workspace/scratch/69fd8163d94e/populous-research-inputs/game/app/D3DPopTB.exe SHA2563a5065c7420b3fcde208bf220bc86dfbac95e025ab2492caf9c7ea5308dfbe4f, enforced by PE reader and independently sha256sum. Adjacent language/lang00.dat SHA256e826c478746d666a3ea9ea36cb7804d1d226d5f83084230987b1de293066cf7d.
read.py -> static-data.txt preserves all34 menu entries with first64 descriptor bytes and selector/renderer tables. Adjacent layout.txt, render.txt, coordinates.txt, slider.txt, audio.txt, dispatch.txt, init.txt, schema-init.txt, slider-input.txt preserve finite disassembly. Command pattern: objdump -d -Mintel --start-address=0xADDRESS --stop-address=0xEND EXE. read.py run from repository root. No called original routine was executed; no intercepted leaves.

## Geometry / exact schema
Menu13 record005d9e38 list005d9970,34 entries. Group005d7368 type1, init004c47f0/update004c4840. Init sets state descriptor+0xc=0 every entry. Update sets all rows' flags bits0/1 (hidden/disabled), then clears them only for exposed subsets.
Layout004c4a61 loops visible rows in list order. For recognized types, yFixed=trunc((140+30*n)*65536/480); n advances once per recognized visible row. Type2 writes+8; types5,8,10,11,12 write+0x14; type13 writes+0x20. It then overrides tab and Back positions. At640x480 the ordinary tops are139,169,199,229,259,289,319,349,... due to SAR16 of fixed-point product, not rounded140. Those are tops, not text baselines.
Type5/8/10/11 text: xFixed+0x10; yFixed+0x14; packed screen anchor pair+0x18=(1,0) (screen horizontal center, vertical top); packed text alignment+0x1c=(1,0) (text horizontal center, vertical top); font style+0x20=2; language+0x24. This was checked per listed descriptor, not inferred from main menu. All ordinary text xFixed=0, giving x center320. Type2 label schema: x+4,y+8, packed anchors+0xc=(1,0), text alignment+0x10=(1,0), style+0x14=2, state+0x18=2, language+0x1c,width+0x20=640,line-spacing+0x24=30.
Type13 slider: xFixed+0x1c=0,yFixed+0x20, screen anchor+0x24=(1,0), sprite alignment+0x28=(1,0), getter+0x2c,setter+0x30,value+0x34. No font field. Center horizontally, top-anchor vertically.
Tab pairs (interactive type5 / selected noninteractive type2): Game005d8064/005d7540 label393 xFixed=-0x3c00 ->170; Sound005d8090/005d756c label394 x0 ->320; Graphics005d80bc/005d7598 label395 x+0x3c00 ->470. yFixed0xe000 ->420 exact. Type5 callbacks004c4c10/20/30 set states0/1/2. Direct3D005d80e8/005d75c4 label402, x320,yFixed0xd000 ->390,callback004c4c40 state3. Back005d7d78 type5 label328 x320,yFixed0xf2aa ->454,callback004c3970.
Selected type2 tab state2 produces renderer flags9 (0045b749–779); style resolver maps this to low-bank variant, not hovered/highlighted bank. Active tab is a different noninteractive descriptor, not a highlighted button. Keep this distinction.

## Visible state sets
State0/Game: Tooltips417, Rotation425, Flip Rotation428, Stay Selected429, Autocast Spell430 at ordinary rows0–4; selected Game type2 plus Sound/Graphics buttons; Back.
State1/Sound: Sound245, slider, Music246, slider, Sound quality1237 at rows0–4; Game/Graphics buttons, selected Sound type2; Back.
State2/Graphics: Screen Resolution454, Sky397, Footsteps256, Landscape Detail333; then optional Gamma Correction491 plus slider; then Quick Defaults398. With gamma enabled these occupy rows0–6, otherwise rows0–4. Selected Graphics type2, Game/Sound buttons, Direct3D button, Back. Gamma guard: [afc2f4]+0x6f4 !=0 AND +0xd10 ==0 (004c49ce–4a02).
State3/Direct3D: Device Selection403 and Filtering412 rows0–1; Game/Sound/Graphics buttons, selected Direct3D type2, Back.
Dormant Turns Per Second, Reduce Screen, Colour Palette, Sky Detail, Anti-Aliasing are NOT exposed by this updater.

## Sound descriptors and render semantics
Sound005d9318 type11/style2,label245,format-kind2,get004c4c50,set004c4c70; slider005d9580 type13 get004c4c90,set004c4cb0.
Music005d9350 type11/style2,label246,format-kind2,get004c4cd0,set004c4cf0; slider005d95b8 type13 get004c4d20,set004c4d40.
Quality005d9388 type11/style2,label1237,format-kind3,get004c4d70,set004c4d90.
Type11 render dispatcher0045d26c: format-kind at+0x2c, Boolean at+0x28. kind1 gives state0 No236/state1 Yes235; kind2 state0 Off234/state1 On233; kind3 state0 Low266/state1 High265. Exact combined UTF16 format at0059d328 is "%s : <%s>". Thus Sound : <On>, Music : <Off>, Sound quality : <High>, etc., as a single centered text run. Not separate label and checkbox columns. Flags normal0x11/keyboard-selected0x31/descriptor0x10=>9 route through004fe730 and004fe4b0. Type11 action0045b56a toggles0/1 then calls+0x34.
Type10 renderer0045d15f uses choice array+0x2c/current-index+0x30; flag0x20 selects numeric formatting, otherwise language IDs. Same "%s : <%s>" at0059d33c. Action0045b50d wraps index within count+0x28 and calls setter+0x38. Getter+0x34.
Game descriptors: Tooltips005d8f74/type10 array005d8db0=[432 Expanded,433 Scrolling],get004c4e00/set004c4e20; Rotation005d90a0/type10 array005d8e18=[426 Cursor,427 Control Cursor],get004c4e40/set004c4e60; Flip Rotation005d9190/type11 kind1 get004c4e80/set004c4ea0; Stay Selected005d91c8/type11 kind2 get004c4ec0/set004c4ee0; Autocast Spell005d9200/type11 kind2 get004c4f00/set004c4f20. All verified style2 and same centered text anchors.
Other type10 arrays: Quick Defaults005d9064 array005d8e08=[399 Low,400 Medium,401 High],get004c5390/set004c54e0; Filtering005d90dc array005d8e28=[413 Off,414 Bilinear],get004c5a00/set004c5a10.

## Slider art, dimensions, arithmetic
Loader004589d5–00458a23 resolves ASCII data\\fenew\\feslider.spr via0059d2b4 into object00749dc4, frame-table pointer00749dd0; data\\fenew\\igmslidr.spr via0059d29c into00749ddc/frame-pointer00749de8. Raw PSFB headers confirm each bank has3 frames: track308x19, normal thumb23x22, selected thumb23x22. feslider SHA25699dd18f3d07b7e8b36977b60f1543fe089972523c5f364db7fe19d85dc5667c8; igmslidr SHA256ab91567305e23bdbe9923cd8b9ea49956a562fd06dcf549513f27db1220d63da. No decoded outputs created.
0045d498 uses track width for horizontal centering, so track left166 at640width, Sound slider top169, Music slider top229. Normal thumb left=166+((285*clamp(value,0,65536))>>16), same top; selected thumb draws+1,+1 with frame2 (004598f1–f7). Track body height19 but thumb22: don't clip thumb to19. Hit rectangle for entire track uses308x19, separate thumb rectangle23x22. Geometry uses frontend bank's dimensions even on ingame path, matching actual supplied bank dimensions.
00459810 picks frontend track from00749dd0 and draw00459e70; in-game [0089c66c]&0x80 picks00749de8 and005162e0. Thumb picks corresponding bank and normal/selected frame1/2, draw005162e0. Preserve original frontend palette vs ingame palette and rendering semantics; merely decoding ingame art using frontend palette is not proved.
Pointer mapping0045af01–4a: value=clamp(trunc(((pointerX-trackLeft-floor(23/2))*65536)/285),0,65536). Slider native drawing domain0..65536. Sound/music getters shift stored byte left9; setters SAR9 then clamp0..127. Thus full stored native value127 renders65024/65536 (thumb left448), not the exact track-right endpoint451. Do not flatten this into an asserted native percentage scale.
Sound enable byte00895db0; Music separate byte00895db1. Sound off calls0048b480; music on/off0048b500/0048b8d0; music volume setter0048b350. These downstream audio effects NOT traced here. Quality getter004998b0, high/low setters004998c0/004998e0; backend/persistence NOT established.

## Fonts and implementation boundaries
Text descriptors above genuinely store style2. This does not authorize using frontend FEFT33WE in-game: retain frontend style2 bank mapping [6,7,8,9,10,0], FEFT33WE/Fehi33we/Felo33we/Feti33we/FEsd33WE and existing indexed fade shadows/glow; retain existing verified in-game style2 F00T9 path. Slider has no text font. Selected tabs use low state rather than interactive highlighted state.
Canonical language strings are recorded in static-data.txt, including exact lowercase q in Sound quality. New scoped import can extend existing frontend importer with exactly feslider.spr and separately prove ingame palette consumer before claiming matching ingame slider pixels. Importer must not run until output ownership established.
Suggested acceptance for implementation: shared Game/Sound tab/back state machine and prior pause preservation; original row coordinates and native text/value formatting tests; explicit Master/Music adaptation labels; slider thumb sizes/normal-selected frames and nonclipping; frontend vs ingame font/palette distinction; keyboard/pointer usable with accessible controls. Unsupported Game/Graphics/quality options need honest reasons, not inert functioning-looking toggles. Do not claim full original settings semantics, startup default preference values, persistence, OS input mapping or pixel fidelity from this static proof.

## Selected in-game tab alpha (review correction)
Static style2 table005d5da8=(6,7,8,9,10,0); selected flags9 contain bit8,
which004fe4b0 maps to index2 and bank8. The in-game004fdbc0 bank selector
uses full local alpha for bank8, two-thirds for normal bank6, and one-third
for dim bank9. Low-bank selection therefore does NOT mean reduced opacity
in-game. Retained ingame-style-alpha.txt is GNU objdump2.44 output from the
same hash-pinned supplied EXE, command: objdump -d -Mintel
--start-address=0x4fddab --stop-address=0x4fde14 D3DPopTB.exe. Existing
decomp/generated/004fdbc0.c and frontend-menu-static/0x4fe4b0.txt retain
the encompassing selectors. Browser tests check selected1, normal2/3 and
focused1; entrance fade remains outside this settled-state rendering slice.
