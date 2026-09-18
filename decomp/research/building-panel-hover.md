# Building panel pointer transit

Issue #25 browser delta, 2026-09-18.

Accepted PR #65 (Boat House) and PR #79 (Balloon Hut) already establish the completed workshop panel profiles, occupant controls, dismantle/cancel behavior, and real ScenePicking opening. They do not establish pointer ownership while crossing non-button panel artwork or viewport-edge placement at different HUD scales. No native inventory was repeated for this browser-overlay-only correction.

Baseline `/private/tmp/building-panel-hover-browser.json` reproduces the remaining defect through shipped UI paths: an occupied Mission 1 Hut and a rendered Mission 2 Warrior Training Hut both anchor their panel tail to the projected building, but `.training-panel { pointer-events: none }` makes artwork/gaps hit the battlefield instead of the panel. The resulting battlefield pointer movement can clear building hover before the pointer reaches a child control.

The correction gives the shared training/building panel box pointer ownership while retaining child controls, and clamps the scaled panel rectangle to the renderer viewport using renderer-relative coordinates. Centered panels retain the projected building anchor; clamping only shifts the tail when an edge would otherwise make the panel unreachable. No building-specific offsets, picking changes, hover delay, forced `hoveredObject`, gameplay, admission, training, world-turn, store, or scene changes are involved.

Dedicated browser acceptance: `scripts/check-browser-building-panel-hover.mjs`. It covers real building→panel transit through blank artwork, no accidental world command, occupant select/right-focus, dismantle/cancel, centered anchor math, and HUD Automatic/100% viewport-edge containment. Boat/Balloon profile geometry remains covered by the existing workshop-panel regression.

Canonical browser acceptance passed in shared FIFO job `f1241826-6549-453c-8b3a-ac7dda35f1a6`. The focus check first moves the camera through shipped controls, then requires the real occupant right-click to schedule the camera consumer from that displaced source to the exact occupant target and settle on that target; zero-distance focus is not accepted as proof. The queue cleanup receipt records `resourcesReleased: true`.
