# Original POINT14 in the neutral browser canvas

Issue #457. This is a bounded browser adaptation, not complete native cursor-state
parity. It does not replace menu, HUD, minimap, spell or selected-group cursors.

## Source and recovered mapping

Original EXE SHA-256:
`3a5065c7420b3fcde208bf220bc86dfbac95e025ab2492caf9c7ea5308dfbe4f`.
Read-only GNU objdump 2.44 static analysis; no game execution or emulation. Reviewed
ranges were exactly 0047a550–0047a820, 004fca00–004fcb00,
004fcafc–004fcc7b and 0047a8b0–0047a930; table bytes0047a840–0047a88c
were read as data. No unvalidated byte-scan hit is treated as executed code.
The retained `0047a550.c`, `00418d70.c`, `004a4960.c`, and `004aab80.c`
pseudocode supplies corroborating ownership/caller context.

The per-frame getter0047a8b0 has the same priority as the transition setter0047a550:

- Nonzero byte0089ce6c returns POINT1.
- Otherwise [0089d17c]&32 together with [0098e909]&8 returns POINT27.
- Otherwise modes10/12 read dynamic frame byte00895e98; mode13 returns
  `(animationCounter & 3) + 30`; mode17 returns13. Other modes return14.

The getter's direct return for default14 is0047a8ec–0047a8ee.
Its table0047a908–0047a924 contains targets
0047a8ef,0047a8ef,0047a8f5,0047a8ff,0047a8ec and indices
0,4,1,2,4,4,4,3 for modes10–17. Those bytes are data, not instructions.
`draw_main`004a4960 calls the getter and installs changed frames, so this mapping
is not inferred only from a mode transition.

Transition0047a78c writes frame byte0089ce33;0047a791–0047a79f selects
[0059df10]+frame*8;0047a7b8 passes it to004fca00. Setter004fcb5b–004fcb63
rasterizes the sprite at surface origin0,0. The two additional zero arguments
are not themselves hotspot proof: the setter does not read them. Retained
`frontend-menu-static/0x4fd3d9.txt` positions the surface at the coordinate pair
returned by00526dd0 without half-size subtraction (004fd40d–410 and004fd4d6–4d9).
This supports top-left hotspot0,0, under that established pointer-coordinate owner.

## Exact asset

`import-neutral-cursor.py` reads only verified POINT/palette files as data and
reuses the existing PSFB/PNG decoder function bodies without importer entrypoints.
Frame14 is17×17. It retains source palette RGB and transparent sprite runs.
The imported JSON records source, decoder, importer and PNG hashes. Do not
regenerate the shared HUD atlas. Browser/device scaling of17 CSS pixels is an
explicit compatibility adaptation, not original framebuffer pixel identity.

## Live scope and limits

`NeutralCanvasCursor` owns only the actual gameplay canvas's inline cursor.
`neutralCanvasState` first requires a started/current scene, then excludes
non-playing/paused/masked states, every active mode,
selected IDs, selected roster flags, gameFlags32, overview/transition, flyby,
camera animation, result camera, gestures, buttons, drag and held keys. DOM checks
exclude hidden/unfocused documents, open dialogs and any overlay hit instead of
the canvas. Touch and pen keep browser behavior. `GameScene.ready` waits for the
optional image decode; failure, wrong dimensions or a10-second timeout produces
a stable browser fallback. Late decode cannot flip a failed scene to custom art.

00418d70 counts tribe-linked selection bit128. The port explicitly reconstructs
that bit from world.selected in selectionPeople/hudPeople; the browser gate also
rejects live roster sources retaining bit128. This does not claim native linked
list identity. Original input actions99/9a set/clear0089ce6c, but their physical
binding and the exceptional frame27 flags are not completely mapped. The gate
is therefore deliberately stricter than the original state predicate, not a claim
that all excluded native contexts lack a pointer or use browser artwork.

The roster selection exclusion is accumulated in the existing unit-ID loop in
updateUnitsFrame, after simulation; no second traversal or pointer-event roster
scan is introduced. The predicate reads that aggregate in O(1). Its initial value
and the reused frame-blocked flag are fail-closed. Events can invalidate/restore,
not install; only the active/current scene frame installs after refreshing the
aggregate. The existing short-circuited frame/dialog check is reused unchanged.
One DOM hit test remains only for otherwise eligible frames, to reject stationary
overlay insertion. No performance claim is made without hosted measurement.
Per-frame updates catch mode/selection/pause/overlay changes without pointer motion.
Leave/cancel/lost capture, keyboard input, blur/visibility and disposal clear the
pointer eligibility. The previously installed inline cursor and priority are
restored; no input event is consumed and existing picking/capture is unchanged.
No global CSS override or software cursor overlay is introduced.

## Acceptance boundaries

Focused tests exercise the controller, decode failure/timeout/disposal, every
predicate exclusion, actual source-bound constructor/readiness/lifecycle calls,
and stationary state changes. Parent-owned hosted verification must cover actual
computed cursor URL/hotspot, ordinary picking, source natural size and standard/
wide/high-DPI/failure behavior. OS cursors usually do not appear in browser
screenshots, so screenshots alone cannot prove the cursor pixels. No native
runtime, full cursor-state, performance or parity-percentage claim is made.
