# Browser fullscreen adaptation

The explicit Fullscreen / Exit fullscreen button is a narrow desktop-browser
compatibility addition, not recovered original UI or a gameplay-parity claim. It
uses the original UI's muted brown/gold palette without changing its artwork,
menu geometry, timing, or simulation. The same small control sits at the lower
right in frontend, selector, loading, gameplay, and pause dialogs. It is moved
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
permission, keyboard lock, pointer lock, or F11 assumption. Browser denial and
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
