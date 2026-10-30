# Browser checkpoint scrollbar artwork

The pause menu's checkpoint copy is explicitly a browser-only adaptation, not
Populous's original multi-slot save screen. It keeps native-size pause text,
current storage/save warnings, fixed actions and Back, and a browser-owned scroll
position. The 432px copy area remains centered at x320 inside the native HUD
clearance; equal 32px gutters leave 368px centered text and room for a 24px control.
No text or original sprite is scaled down to fit.

The five PNGs are byte-for-byte imports from Help candidate
`fd34c4a60b643c294c167ab9bcd83b5871a82fd3`. Their producer at that commit is
`scripts/import-help-ui.py`, using the original HFX bank and PAL0-C palette.
`checkpoint-scrollbar-art.json` records all five SHA-256 hashes, dimensions,
original input identities and decoder identities. They can be recovered using
`git restore --source=fd34c4a60b643c294c167ab9bcd83b5871a82fd3 -- public/original/help/hfx-451.png public/original/help/hfx-452.png public/original/help/hfx-453.png public/original/help/hfx-454.png public/original/help/hfx-455.png`.
No Help runtime, clocks, native mouse coordinate assumptions or additional assets
are imported. The art is source-palette sprite reconstruction, not an original
GPU capture.

The original Help scrollbar's arrow images are moving thumb caps, not fixed
track-end decorations. This browser control preserves that arrangement: both caps
are real, labeled up/down buttons moving with the thumb; its repeating center is
draggable. A browser adaptation maps one cap activation to one 30px text line,
DOM scroll geometry to thumb travel, and viewport scale to pointer movement.
Wheel, touch and focused-region keyboard scrolling remain browser-owned. Wheel
over the sibling art is forwarded to the same viewport. No timer is introduced.
The custom scrollbar is only enabled after all five images decode at their
expected dimensions. If loading fails, the system scrollbar remains visible.
Forced-colors mode also retains the system scrollbar. Pointer capture is released
on cancellation, lost capture, blur, visibility change, layout change and unmount.

`tests/checkpoint-scroll-area.test.mjs` exercises shipped handlers/effects with
measured DOM stand-ins and verifies hashes; existing pause tests preserve all
warning and single-flight behavior. These are not browser/rendered acceptance.
Required rendered checks include start/middle/end scrolling at 640x480 and a
scaled viewport, real keyboard focus, caps/drag/wheel, content-changing storage
states, missing-art and forced-colors fallback, cancellation and reopening.
