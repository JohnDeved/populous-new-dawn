# Browser fullscreen adaptation

The explicit Fullscreen / Exit fullscreen button is a narrow desktop-browser
compatibility addition, not recovered original UI or a gameplay-parity claim. It
uses the original UI's muted brown/gold palette without changing its artwork,
menu geometry, timing, or simulation. The same control uses contextual placement: a labelled lower-right button in
frontend, loading and pause dialogs; the vacant upper-left strip in the world
selector; and a fourth fullscreen icon beside sound/pause/settings in the native
gameplay HUD action row. Its accessible Fullscreen / Exit fullscreen label and
title remain available in icon mode. The gameplay icon follows HUD scaling and
explicitly uses the existing 17×14 native action dimensions, not the 32px menu
button minimum. This avoids covering the selector Start button or compact F 8
Resume/status controls; their original layout is unchanged. It is moved
into the active native dialog's top layer, preserving its DOM identity and focus
when already focused, rather than duplicating controls or placing an inert button
behind the modal. On entry, the existing modal is closed and immediately shown
modally again to re-promote it above the newly fullscreen documentElement. Its
panel DOM and focused control are retained; the application has no dialog close
handlers, so this cannot invoke its Back/Quit actions. Exit does not reopen dialogs.

Click the button, or Tab to it and press Enter/Space. There is deliberately no new
global key binding: existing F/gameplay keys and browser shortcuts remain owned by
their current handlers. Fullscreen is requested on documentElement only during
that activation. There is no automatic entry, saved fullscreen preference, new
permission, keyboard lock, pointer lock, or F 11 assumption. Browser denial and
unsupported API environments show a status suggesting the browser's View menu.
The label follows fullscreenchange, including browser-native exit.

Escape is still the browser's native exit action (not preventDefault). During
fullscreen and its 250ms exit-event handoff, application Escape and dialog cancel
handlers are isolated so the same key cannot also cancel a spell, skip a flyby,
resume a paused game, or activate a quit flow. Held Escape remains isolated until
keyup/blur; after the handoff, ordinary application Escape is unchanged. Other
keys are untouched. Enter/Space on the control do not propagate to gameplay.

Sizing remains with the existing owners: page window-resize measurement handles
HUD size, frontend/selector use their existing viewport sizing, and the scene's
ResizeObserver updates the renderer/camera when its container changes. No extra
render loop, synthetic resize, or drawing-buffer owner is added.

## Verification boundary

`node --test tests/fullscreen-control.test.mjs` tests activation, pending/repeated
requests, fullscreenchange/error, rejection/unsupported availability, Escape
handoff/repeats, disposal/late promises, portal target/focus transfer, and shipped
entry/resize ownership. These are source and DOM-contract tests, not rendered
browser evidence. Hosted real-browser verification must cover frontend and
playing entry/exit, native Escape with a pause/options dialog, repeated activation,
resize/picking, modal switches, and keyboard activation on desktop Chrome
(including Mac Chrome when available). Local browser launch is blocked in this
execution lane; no rendered or hardware performance claim is made here.


## Contextual placement regression

The first lower-right overlay overlapped Start at 800×600 and the compact F 8
WORLD PAUSED/Click to resume control at 640×480 in hosted evidence. This is a
runtime layout defect, not a test exception. The replacement docks in the actual
HUD action row when no modal/loading screen owns input. The selector's portal is
positioned by its current modal ancestor, so transitions cannot retain stale
corner coordinates. Only modal/loading/action-dock changes trigger host traversal.

`tests/fullscreen-placement.test.mjs` binds source geometry at 640×480,800×600,
1024×768,1920×1080,3440×1440,3840×2160 and DPR 2, plus 900×360 and HUD preferences
1/2/4. It checks the four actions fit within the 100px native HUD and remain below
the 481px native dock, and selector controls remain outside the Start band and
Browser controls/direct-content areas. `tests/fullscreen-control.test.mjs` covers
same-node focus-preserving gameplay/selector/loading/pause transitions. These are
source/layout contracts, not browser hit-test proof. Hosted Start, compact Resume
and fullscreen hit-test/click gates remain required and unchanged in intent.
