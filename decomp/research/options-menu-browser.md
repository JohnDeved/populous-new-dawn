# Original Options composition: bounded browser restoration

Refs #457 and #16. This does not close either UI gate or award gameplay parity.

## Original evidence

The [static packet](options-menu-static/findings.md) binds menu13's shared category
state, geometry, text renderer selection, and original slider dimensions to the
hash-pinned supplied executable. It includes raw finite disassembly and data, not
native execution or screenshots. [Palette proof](options-menu-static/palette/findings.md)
binds the in-game slider to the current landscape palette. Occupied slider indices
have identical RGB in all six compared supplied landscape banks; importer assertions
retain this narrow invariance. Native final filtering, gamma and dynamic palette
effects remain unverified.

## Shipped entry points

- Startup → Options and battlefield Menu → Options use `OriginalOptions` inside
  their existing owning dialogs. Both initially select Game. Categories are at
  (170,420), (320,420), (470,420), Back at (320,454). Direct3D at (320,390) appears
  only for Graphics/Direct3D. Selected category is noninteractive, with an explicit
  accessible heading name and low-bank frontend artwork.
- Sound has text/slider/text/slider/quality at139/169/199/229/259, centered on320.
  Track308×19 and normal/selected thumbs23×22 come from separate frontend/in-game
  PSFB banks. The22-pixel interaction control leaves the thumb unclipped. Native
  art stays uniformly scaled within the existing640×480 reference frame.
- Frontend indexed shadows now use actual visible Options text at the same anchor
  positions, not main-menu labels. This reuses the existing original fade masks,
  pointer-dependent shadow offsets, title shadow and glow compositor. In-game
  keeps F00T9 and has no frontend title, background or shadow composition.

## Honest compatibility boundaries

Native Game, Graphics, Direct3D and sound-quality adapters are not implemented.
Their categories show an explicit unavailable message, not fake working toggles.
The quality row is explicitly unavailable and uses normal text, avoiding an
interactive-looking highlighted state.

Master volume and Music volume remain browser settings with0–1 values, .05 steps,
existing defaults and storage. Master also changes music. Labels show percentages
as a browser adaptation. Neither native0–127 semantics nor separate native
Sound/Music enabled flags are asserted. Preferences apply when audio is enabled
in-game. The existing enable/mute control stays in Browser compatibility and help.

Browser compatibility and help is a distinct destination for retained mission
help, level selection, speed, deferred camera controls, HUD size and references.
Escape returns from this destination to the same category; another Escape returns
to the owner menu and restores its Options focus. Audio startup failure is visible
in that destination and supports retry. Unavailable storage keeps session values
and an honest notice. Missing slider/font assets retain ordinary HTML controls and
readable labels.

Pause/world/camera/audio ownership stays in the existing page and scene code.
Options never unpauses the world or resumes audio. Camera changes remain deferred
until Continue. Existing prior-paused state is preserved by the owner. Underlying
browser message presentation is hidden while the owning pause modal is open,
then restored without dismissing messages, changing their flags or advancing timers.

## Generation and checks

`scripts/import-options.py` owns only `app/original-options-art.json` and six PNGs
under `public/original/options/`; ownership is recorded before the scoped import.
It reuses the existing static decoder and hashes supplied inputs. No generated
asset was manually edited and no broad importer was run.

`tests/original-options.test.mjs` verifies source identities, separate art/selected
frames, dimensions and actual-label indexed shadows. `scripts/local-render/original-options.mjs`
uses shipped entry points for category repetition, range controls, persistence,
keyboard/focus, supported viewport bounds, actual DPR2, shared entry, world/camera
freeze, audio suspension and prior-pause ownership. The failure scenario separately
exercises explicit storage, artwork and AudioContext failure boundaries. These are
browser consistency checks, not native runtime or hardware performance evidence.

Exact final receipts and screenshot identities are listed in the PR handoff.

## Retained display limit

Actual frontend 640×480, 1280×960, 1920×1080, 3440×1440, short-height and DPR2
checks passed. Actual Mission 1 Options at 640×480 and 1280×960 passed, including
settled font-state alpha, live shared volumes and pause/audio/message ownership.
Battlefield ultrawide and DPR2 remain **unverified**: aggregate resize attempts
crashed Chrome, and separate fresh attempts crashed during initial Mission 1
canvas creation before Options or the requested display override. A final bounded
attempt through the previously working startup Options route failed at the same
initial canvas step; no further unchanged browser retries were performed. These
failures are retained and are not counted as successful display evidence. Frontend
DPR2 is not substituted for battlefield DPR2. No unsafe browser flags were used.

Audio rejection/retry testing additionally exposed body focus after a disabled
async control. Options now captures Escape only while its nested compatibility
panel and owning dialog are open, with listener cleanup on back/unmount. The page
keyboard handler also explicitly excludes an open game menu. A focused real browser
regression verifies body-focused h/Space leave the entire paused world unchanged,
and three distinct Escapes return one level each without duplicate cancellation.

[Comparable before/after screenshots](../../references/ui-options/README.md) retain
exact capture commits and limitations. Native defaults, Game/Graphics/Direct3D
adapters, sound-quality behavior and full original settings persistence remain open.


## October 19, 2026: quiet Options presentation

The original Game/Sound/Graphics/Direct3D composition no longer carries permanent
browser explanatory paragraphs. Essential unavailable-setting, keyboard-rotation,
and audio guidance uses the shared selector-style tooltip with its existing dwell,
placement, settled typography and readable fallback. Unsupported rows remain inert
notes with explicit Unavailable labels; they now receive keyboard focus so their
same explanation is available without a pointer. Accessible descriptions retain
that explanation independently of the visual tooltip. Category changes remount the
tooltip, and entering browser help unmounts it, preventing stale row guidance.

Browser compatibility and help remains a separate, explicitly browser-only
accessible destination, but its entry uses transparent gold serif text instead of
the generic dark button. The destination, all supported controls, persisted values,
storage-failure notices, Escape/Back navigation and audio retry are unchanged.
This is presentation cleanup, not a native option implementation or new parity claim.
Source/fixture tests cover both skins and all categories; current rendered evidence
must come from the parent's hosted checks because local browser execution is blocked.


## October 19, 2026: browser help belongs in Game

The user's later direction supersedes the separate browser-help link described
above. Browser compatibility and help is now a normal selectable sixth Game row,
at (320,289), following the existing 30-pixel row interval. The explicit Browser
label remains a compatibility adaptation, not a newly claimed original option.
Sound, Graphics and Direct3D have no duplicate help link. The row uses the same
native text, highlight, focus and indexed-shadow inventory as the supported Game
choices; its 448-pixel glyph string fits the existing 540-pixel choice hit target.
The row clears the storage notice at338 and category navigation at420. Both skins
retain the exact accessible label and separate destination. Back/Escape returns
focus to that Game row. Existing public browser helpers now select Game before
opening help where they previously entered from Sound.

Focused source/interaction fixtures check row inventory, highlight/activation,
Back focus, native glyph bounds and uniform standard/wide/high-DPI scaling. The
hosted helper adds actual Enter/Escape and row-geometry witnesses but is not local
rendered evidence until executed. Gameplay, settings values and storage semantics
are unchanged. The independent tooltip startup-readiness patch is composed by the
parent, not duplicated in this change.

## October 21, 2026: retained browser controls use the original Options artwork

The remaining Browser compatibility destination no longer draws a generic dark
panel, browser-font heading, styled buttons or HUD-size picker. Its title, actions,
HUD-size cycle, notices and Back reuse the existing Options glyph atlases and
transparent choice treatment. The browser-only destination remains explicitly named;
these control meanings and positions are compatibility adaptations, not recovered
native settings. No imported artwork or source manifests were changed.

All seven existing HUD-size values cycle in the same order, using the existing
session-first/storage-second callback. The ordinary button retains Tab and
Enter/Space activation, a stable identity and a current-value accessible name.
Game speed still toggles 1x/2x, including exit from an already-fast session. Audio
still calls the original activation handler directly from a trusted click; pending
activation disables and dims its row, and existing failure/retry and storage
notices remain complete. Actual screen-reader text accompanies the native glyphs.
The two longest supported notices fit above Back without a scrollbox. Select Level,
F8 and cheats, fullscreen and modal keyboard owners are not removed or redefined.

The frontend fallback header starts below the retained original logo and publishes
its actual glyph rows to indexed shadows. Back/Escape return focus to the same
Game entry; entry focus stays at the header. Asset-failure fallback remains usable.

Browser fixtures now use public row clicks instead of selectOption. A shared helper
waits for each displayed HUD-size transition, and the six stale direct-menu consumers
enter and leave every native Options level. Existing geometry, storage and world-state
assertions remain. Other Menu/Space and nested audio-route repairs belong to the
separate duplicate-controls branch; compose that dependency before rendered QA.

Source/interaction coverage passes 67 focused tests, including all 49 HUD preference
transitions, disabled/retry and session-only paths, 30-pixel row/glyph bounds,
frontend logo clearance, nested Escape cleanup, and retained slider/art ownership.
This is not rendered evidence. Full check/build, real browser keyboard/audio/display
coverage and final combined integration remain required; they were not run under
the coordinated resource restriction. The sparse planner cannot resolve its omitted
app/neutral-cursor.ts input. This work remains a draft, not a native-parity or
merge-readiness claim.
