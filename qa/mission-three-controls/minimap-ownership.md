# Minimap ownership and ordinary camera settlement

Run02 at `c1518942c51a4ddac2ddb937d9e98744e232d87c` remains **failed**. After
ordinary Vault acquisition (milestone turn1287), the helper tried to focus home
at `(35,81)` with a minimap click at screen `(66,172)`. It then found no eligible
ground projection and issued no ground order. The retained screenshot shows the
Buildings tab selected and the camera still near the Vault; the paused snapshot
at1395 has camera point `(-26.4140625,-113.8125)`.

`app/globals.css:21–24` gives the minimap a96px logical height and overlays dock
tabs starting at85px. At the observed HUD scale2, the canvas extends to192px but
the tab begins at170px. The chosen `(66,172)` lies in the Buildings tab.
`app/page.tsx:821–849` defines those controls; only a canvas-owned pointerdown
reaches the minimap handler in `app/scene-input-runtime.ts:487–505`. The old
inverse search considered the entire geometric canvas without checking ownership.
Its fixed900ms delay also did not establish that ordinary camera focus finished.

The repaired finite pixel search uses the same minimap inverse but admits only
points whose `document.elementFromPoint` is the actual minimap canvas. It rejects
an empty search or a best mapped point more than8 world units from the requested
camera position. A synchronous polling predicate waits for input release and
camera/result/view-transition completion before solving and after clicking.
Evidence includes requested point, chosen canvas pixel and its mapped native
coordinate, pre-click camera, and observed post-click camera. The latter must
reach that mapped destination within one native coordinate unit. It never calls
focus or writes camera/world state.

The other projection helpers were audited: entity picks and ground picks already
require the actual renderer canvas to own the pixel; right-drag rotation checks
its canvas corridor; labelled HUD controls use normal Playwright actionability.
The home-return caller additionally permits a radius2 clear-ground search, with
actual picked displacement less than3.5 and the existing arrival distance≤4.
This is a secondary robustness measure, not the demonstrated cause of Run02.
The Preacher approach `(-39,-110)`, cancellation `(-33,-113)`, and tactical moves
keep exact-point probes. Spell and building target semantics are unchanged.

The extracted old inverse failed a focused covered-nearest-pixel fixture before
the ownership filter (17 passed,1 failed). The repaired fixture also rejects no
owned pixel and overly distant alternatives. This is plain-JS source evidence;
successful real camera mapping and ground dispatch still need a fresh replay.

Run02 preserved normal checkpoints at1395 and1409 before intentional closure.
Session72841 ended1; both receipts failed with unchanged source and browser
errors`[]`. At18:33:34 UTC port4366 refused connections and no owned runtime
remained. Run01's marker failure and all earlier evidence remain separate.
