# Command32 expiry: accepted supplied consumer correction

Refs #243 and #214. Runtime357ed88bb5af7cf10179cd20293561ced6f12011 moves
expiry into the existing scan-admitted even-counter acquisition block. It changes
no timer increment, gesture/turning RNG or phase5 arrival rule.

Focused phase4 tests fail before the correction (20pass/1fail), then pass21/21.
The strict accepted-native replay fails before on native0/port1 for odd32, then
passes all27 cases/63 visits/73 semantic requests with0 state/return residual
rows and43 retained raw adapter-event rows. Source/input fingerprints are bound
before/after. No new native execution occurred.

All command receipts and raw replay output are losslessly archived. The first
replay-before attempt stopped on a checker IndentationError before app execution;
its stderr is retained. The corrected replay-before-02 is the meaningful
failure-first run. Expected native rows and all other adapter boundaries remain
unchanged. Independent review artifacts are copied unchanged.

The source still has broader phase5 site-admission behavior. Empty-listener
release, immediate-order removal/resumed movement and ordinary lifecycle are
separate acceptance boundaries. This evidence does not certify whole-sermon
equality, browser behavior or ordinary gameplay.
