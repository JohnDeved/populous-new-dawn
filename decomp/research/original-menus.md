# Original main menu, in-game menu and options inventory

**Research baseline: 18 September 2026, main `506289f9a9621f67cd4255fe23430343b55eb70d`.**
This is the issue16 implementation prerequisite, not a restored menu, observed
native startup or completed frontend acceptance. The inventory combines original
executable tables and selected consumers with the shipped browser source. No
native execution, window capture, Ghidra export, browser or build was run.

Reuse the accepted [Tutorial entry](tutorial-entry.md), [demo entry](demo131-entry.md)
and [loading-art](loading-art.md) evidence. Those notes deliberately distinguish
conditional native selectors from boot-to-click proof. That distinction also
applies here. In particular, the loading-mask asset is not a menu background.

## 1. Native menu graph and entry boundaries

Menu records are32bytes at `005d9c98`, with an item-list pointer at+8. Lists contain
8-byte `(type, descriptor)` entries ending in `0x80000000`; `0045a151` initializes
their counts. `0045a3c0` selects the current menu at `00749cd8`.

For **type4**, action1 reads descriptor+`0x28` as a menu number and calls the menu
setter (`0045b479`–`0045b495`). For **type5**, action1 invokes the callback at the
same offset (`0045b496`–`0045b4b7`). Their shared renderer `0045b9bb` consumes the
language index at+`0x24` through `00972ba8`. These fields are not inferred from
filenames or plausible labels. Other descriptor types have different schemas;
for example, a paragraph's label is at+`0x1c`, while its following640value is a
width, not language entry640.

| Entry or transition | Proved native boundary | Current browser counterpart |
|---|---|---|
| Main menu0 | Record `005d9c98`, list `005d9660`. `004c3800` selects0 when its external-state, in-game and alternate-context guards are clear. | `page.tsx` restores a checkpoint, then displays a custom mission chooser. No original main-menu root. |
| New Game | Label309, descriptor `005d7c70`, callback `004c3520`. When `[00895daa]&0x40` is clear, selects menu2; otherwise calls `004c3340`. | Direct mission buttons bypass this original root/first-time flow. |
| First-time Tutorial recommendation | Menu2 has paragraph519 and Yes→`004c5a40`, No→`004c3340`, Back→`004c3970`. | Tutorial is directly available, but this original first-time branch is absent. |
| Tutorial | Main label299/callback `004c5a40`; accepted evidence binds level79 and its loader. | Tutorial button calls the existing mission-load request. Preserve that request/readiness boundary. |
| In-game menu16 | Record `005d9e98`, list `005d9b30`. `004c3800` selects16 when `[0089c66c]&0x80` is set. | Menu/settings buttons open one combined help/settings dialog. |
| Options | Both main0 and in-game16 use descriptor `005d7ab8`, label326, target menu13. | One help dialog with HUD-size, audio and convenience controls, not the original shared options tree. |
| Continue Game | Menu16 label303, callback `004584f0`; guarded native cleanup/resume-related calls are present. | Closing the dialog unconditionally sets `world.paused=false`; Return closes it. |
| Return/back context | `004c3800` may select16,21 or0 according to mode globals. | Tutorial has an explicit return-to-main action; ordinary missions do not expose the same menu action. |

**Reachability limit:** this establishes selectors and conditional control routes,
not the complete executable-start→intro videos→menu sequence or OS key/mouse→action
producer. The exact pause-opening event and simulation-stop/resume contract still
need their upstream native call path checked. Menu21 is a separate restricted
context selected by another flag; it must not be casually equated with normal
single-player pause. Neither a table row nor a resume-named callback alone proves
all pause, sound and animation clocks stop correctly.

## 2. Exact main and in-game controls

The main initializer `004c3290` clears disabled/hidden flags for its list and sets
the rows' layout. The original main-menu order is:

| Original control | Language ID | Destination/action | Browser gap or compatibility boundary |
|---|---:|---|---|
| New Game | 309 | `004c3520` | Replace the startup root, not simply rename every mission button. |
| Tutorial | 299 | `004c5a40` | Existing functional action can be retained behind the original control. |
| Load Game | 310 | Menu3 | Existing browser checkpoint is not proof of the native multi-slot/profile browser. |
| Multiplayer | 307 | `004c3600`→menu4 | Record original presence; multiplayer implementation remains excluded. |
| Options | 326 | Menu13 | Original shared navigation/controls missing. |
| Rolling Demo | 334 | `004c5a80` | Original recording path is known; browser playback is not supplied by this menu work. |
| Credits | 445 | `004c5af0` | No equivalent original action/content established in current startup. |
| Coming Soon | 447 | `004c3540` | Original row exists; content/backend behavior remains untraced. |
| Quit | 308 | Confirmation menu1 | Browser cannot be assumed to close an arbitrary tab like a native executable. |

The full single-player in-game list is **Continue Game303; Load Game310;
Save Game311; Options326; Restart Level434; Quit Level1191; Quit Game251; Back328**.
Their submenu targets are respectively menu3,14,13,17,18,19 for Load through Quit
Game. Confirmation17/18/19 contain original Yes/No callbacks; this trace records
those identities rather than inventing confirmation sentences or assuming Quit
Level and Quit Game have the same return behavior.

**Availability is conditional.** `004581f0` starts with all items disabled/hidden,
then exposes Continue, Options, Quit Game and Back. Load, Save and Restart require
a selected-level whitelist and single-player guards; Tutorial79 is explicitly
excluded from that expanded branch. Quit Level has an additional mode guard.
Thus the presence of Save/Restart descriptors does not authorize displaying them
as enabled in every context. The current browser, by contrast, gives ordinary
missions Save/Load checkpoint and Restart, while Tutorial has Quit to Main Menu
and Restart. This is a concrete tree/policy mismatch, not just styling.

## 3. Options: visible controls versus dormant descriptors

Options record `005d9e38` uses list `005d9970`. Group descriptor `005d7368` has
initializer `004c47f0` and update callback `004c4840`. Four original tab callbacks
`004c4c10/20/30/40` write group+`0x0c` to0/1/2/3. The updater first hides/disables
all rows, then activates the selected subset. The following names are exact
canonical language labels, not suggested replacement copy.

| Original tab | Controls selected by the inspected updater | Current browser counterpart / boundary |
|---|---|---|
| **Game393** | Tooltips417; Rotation425; Flip Rotation428; Stay Selected429; Autocast Spell430. | No corresponding preferences panel. Existing camera/selection/spell mechanics must not be silently changed or presented as already wired. |
| **Sound394** | Sound245 plus its adjacent slider; Music246 plus its adjacent slider; Sound quality1237. | Global Enable sound/Mute, Master volume and Music volume exist. Exact native Sound-versus-Music enable semantics, slider scale and quality mapping are not yet paired with those APIs. |
| **Graphics395** | Screen Resolution454; Sky397; Footsteps256; Landscape Detail333; Quick Defaults398. Gamma Correction491 and its slider are additionally conditional on UI-device fields. | HUD size is a browser adaptation, not native Screen Resolution. There are no equivalent controls for the other original effects/detail policies. |
| **Direct3D Options402** | Device Selection403 and Filtering412 in the inspected branch. | Native driver selection is not a browser API. Any replacement must be explicitly identified as compatibility behavior, not a functioning original device selector. |

**Defined but not exposed by this updater:** Turns Per Second56, Reduce Screen396,
Colour Palette407, Sky Detail411 and Anti-Aliasing410. Do not populate an apparently
complete settings screen from every descriptor in the binary. Other code may
modify behavior, but that is not demonstrated by this bounded path.

Type10/type11 entries and their visibility are recorded above. Their choice/
toggle behavior and callback/setter dispatch are not established by the retained
175-condition receipt or cited sources. Complete value labels and application
semantics remain unvalidated.
No guessed numeric range, default, persistence policy, texture-filter backend or
sound-quality implementation follows from this inventory. The two Sound sliders
reference getters/setters `004c4c90/004c4cb0` and `004c4d20/004c4d40`; these are
specific next adapter targets, not already-proved Web Audio gain mappings.

## 4. Original layout and artwork boundary

The shared text helper `004fe730` scales signed16.16 coordinates by the current
screen width/height, applies edge/centre anchors, then accounts for measured text
size. Main/pause button descriptors use horizontal centring and font-style index2.
Do not mistake initialized layout for their on-disk defaults: `004c3290` rewrites
main row y-values to `0x4aaa,0x5aaa,...,0xcaaa`, producing roughly30pixel spacing
at480height. Pause initialization sets a different row count/spacing according to
which actions are permitted.

Options layout `004c4a61` starts ordinary visible rows at140 and advances30 on a
480high reference canvas, storing normalized coordinates. Game/Sound/Graphics tab
labels use x offsets `-0x3c00,0,+0x3c00` around centre and y`0xe000`; Direct3D uses
y`0xd000`, Back uses`0xf2aa`. Exact font metrics, highlight colours, glyph raster,
background composition and final pixels remain necessary before visual fidelity
can be accepted. Responsive browser scaling should preserve the proved reference
composition while keeping every control pointer/keyboard reachable, not repeat
the current long unwrapped mission-row overflow.

The retained code iterates the resource table at **`005d71f0`** until a `#`
sentinel. The selected resource and referenced string/file identities remain
unresolved. The selector, load/decode format, palette, dimensions and final
composition are also unproved here. No generated/menu assets are installed and
no guessed background is offered as a substitute.

Retained [render_menu_text](../generated/004fe070.c) and
[render_char_outer](../generated/004fe270.c) establish a font-type-dependent glyph
path. The normal font branch indexes a sprite table at8-byte strides, adjusts the
character index from0x20, draws through`00459d00` and reads glyph width. Actual
font resource selection/palette mapping and full menu text rendering remain open.
The [original loading mask](loading-art.md) is a separate resource/consumer; it is
**not evidence for using that mask as main-menu artwork**. Worker2 owns that loading
integration independently.

## 5. Current browser baseline and genuine compatibility work

At the publication base, [page.tsx](../../app/page.tsx) has:

- Startup state `loading→choice→playing`, a direct Tutorial button, optional single
  checkpoint Load Game, and a list of campaign mission buttons. Original menu0's
  hierarchy, first-time question and options entry are absent.
- A shared `menu` boolean for Help/Menu and Game settings. Opening pauses and opens
  a modal; its close handler resumes unconditionally. Escape opens it in Tutorial,
  while ordinary Escape cancels targeting/selection. Space also has a building-plan
  rotation role before its pause fallback. Preserve these contextual distinctions
  when specifying the real menu entry contract.
- One combined dialog containing mission help/objectives, Return, checkpoint
  save/load, Restart, speed, zoom/focus conveniences, HUD-size and audio controls.
  It is not the native in-game list plus separately navigable Options tabs.

`beginLoad`, retained request/retry state and [game-store APIs](../../app/game-store.ts)
already own mission/restart/checkpoint transitions. The menu restoration should
call those actions without bypassing loading readiness, cancellation or save
preservation. Audio enablement requires browser user activation; arbitrary window
closing, Direct3D device selection and OS resolution changes are not equivalent
browser operations. Local checkpoint storage is not original save-format/profile
compatibility. These must be explicit adaptations, never fake original controls.
HUD-size persistence and accessible native HTML focus semantics are modern
compatibility features, not evidence of original menu options or artwork.

## 6. Smallest coherent implementation reservation

**Reserve one shared original menu-navigation layer, not an engine-wide rewrite.**
Suggested new paths: `app/original-menu-state.ts` for typed menu/action transitions,
`app/original-menus.tsx` for the native main/in-game/options composition, and focused
menu/control tests. Reserve only the relevant startup-choice/in-game-dialog/menu-
entry fragments in`app/page.tsx`, plus namespaced menu styling in`app/globals.css`,
after Worker2 explicitly hands off those fragments. Leave `beginLoad`, request/
readiness/error overlays, asset completion and scene creation untouched.

The first end-to-end slice should open the native single-player root and in-game
menu, navigate the shared Options/Sound view, return without corrupting prior pause
state, and use existing real Tutorial/load/save/restart actions where applicable.
Original labels, ordering and action availability come from the tables above.
Do not ship inert imitation controls: other Game/Graphics/driver settings need
explicit owned adapters and proofs; multiplayer/demo/credits/Coming Soon/exit
policies need truthful availability rather than invented behavior. This initial
slice is not full issue16 acceptance.

Before calling that slice **original artwork**, reserve a separate, finite asset
proof: resolve the selected `005d71f0` background record and the actual font-style2
resource through their existing loaders; verify supplied identities and decode
only the required frames/palette/glyphs. Only then declare exact outputs for a
scoped menu importer. **No generated output filename is authorized by this note.**
The current hard boundary is asset selection/decoder and option adapters, not a
need for another broad package inventory or native-window capture.

Required focused acceptance after ownership: cold start and return from a mission;
actual pointer and keyboard open/back/confirm/cancel; prior pause state preserved;
no gameplay/RNG/animation advancement while the menu contract requires pause;
save/load/restart/quit semantics without data loss; real sound/music adapters with
browser permission/storage failures; constrained/narrow/ultrawide/high-DPR layout;
and verified original art/layout. Native input producer and complete startup
video/sound/skip order are still explicit research gaps. They must not be replaced
by arbitrary animation delays or guessed screens.

## Evidence identity and reproducibility

The original D3D EXE SHA-256 is
`3a5065c7420b3fcde208bf220bc86dfbac95e025ab2492caf9c7ea5308dfbe4f`;
`language/lang00.dat` SHA-256 is
`e826c478746d666a3ea9ea36cb7804d1d226d5f83084230987b1de293066cf7d`.
The existing [PE32 reader](../../scripts/check-static-mission18-sky.py) enforces the
EXE identity. The accepted Tutorial proof documents the shared menu schema and
input dispatch; this note adds selected menu/visibility/layout bytes, not fabricated
Ghidra C. Its bounded research receipt verifies175table/label/instruction conditions
without executing the target. Its exact argv/source/result fingerprints are in the
review handoff; the reproduction uses only repository reader and supplied files,
not a running game or a prior engine capture.

For a fresh manual inspection using that reader, the essential addresses are
`005d9c98 + menu*32` and list pointer+8; enumerate8-byte entries until`0x80000000`.
For types4/5, read the verified label index at descriptor+36 and menu/callback at+40.
Read the selected availability callbacks before declaring a control enabled.
The normal metadata reader also exposed unrelated network tables; those are not
part of this single-player implementation recommendation.

All writes in this research were either the unique note or ignored issue16 receipts.
Three optional tool requests were safety-status blocked; their unexecuted entry/
asset/audio work is not credited. No fullcheck/build, native/Ghidra/browser runtime,
source implementation, capture, asset generation or issue closure occurred.
