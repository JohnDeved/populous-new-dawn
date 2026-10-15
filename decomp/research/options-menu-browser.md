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
