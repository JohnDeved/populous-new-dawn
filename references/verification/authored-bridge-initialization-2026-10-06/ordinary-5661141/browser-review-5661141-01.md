# PR 226 ordinary browser acceptance review

2026-10-06. **ACCEPT the bounded browser evidence** at clean
`56611410b260fa4a7abc38d83ad3aec6678841f3`. No source or driver correction requested.
Captured-input native terrain equality remains pending its separate replay.

## Provenance

- Outer command receipt `browser-command-5661141-01.json` is terminal passed,
  exit 0, no signal; SHA-256
  `b64b0f48c7584d561c6152fa986403f93879e87efa237e4e40a20f5754a68a99`.
- Harness `browser-final-5661141-01/receipt.json` is terminal passed at
  `2026-10-06T02:57:11.895Z`; SHA-256
  `b76085582d0980d0f228ad22beb55acad3b809e86dbedf09a4cbb0476e1e6706`.
- Independently verified every outer input hash (plan, driver, both lock files,
  browser binary), terminal raw stdout/stderr hashes, exact command/plan agreement,
  and both unchanged source/sourceAfter records. The copied driver and scenario
  input entry match frozen SHA-256 `3e8ad3a90e505fc4ea439f959aaf8d9e845c1c12eec70b271f3c130f55562aa5`.
- Actual invocation uses fresh port 4376, the approved private TMP, ephemeral
  context, 240-second harness and 300+20-second outer bounds. Browser launch retains
  `chromiumSandbox=true` and only `--remote-debugging-pipe`; no unsafe flags or old
  profile. Terminal harness receipt follows its reviewed cleanup path.

## Supported observations

The ordinary action log records Shaman 54's worship order accepted for shrine 55
at world turn 158. The reviewed route subsequently captures the authored effect
at `(-77,-105)`, with native endpoints `(47872,24832) → (51968,24832)` and one use.

At world turn 520, the observed controller is at turn 17 with cached cells
24762→24778, alongY=false, direction=2, crossStep=0, heightStep=2 and raiseWater=true.
The driver verified those caches against its copied pre-activation terrain and
read back the exact active controller from the committed IndexedDB save. Ordinary
fresh-page Load resumes play, then Pause observes turn 39 with every non-turn
controller field preserved and one use. This is not an exact birth observation.

The bridge completes naturally. Independently recomputed all differing indices
between captured initial and final height arrays: exactly the reported 36 vertices.
Completed Save/Load observes Mission 2 at world turn 610, one statistical/shrine use
and no active bridge. The browser driver does not capture an additional complete
post-restoration height array, so this review does not add that stronger claim.

`native-terrain.json` retains 16,384 initial/final heights, matching original
captured terrain fields and observed endpoints; SHA-256
`f4f7eeb2faa278f6934275bfa4f8d4a95bb4617022e53259121f4cdbea665418`.
It is a verified replay input, not yet a native-equivalence result.

## Pixels and limits

Independently viewed the before, active, complete and completed-restored PNGs.
They show the water gap, rows of active trail sprites across the developing
crossing, the formed causeway, and the restored Shaman scene. All retained PNGs
are 1440×1000. Flyby/reload camera differences prevent an aligned pixel comparison;
the restored Shaman view does not itself display the completed causeway.

Chrome Headless Shell 154.0.8037.92 uses ANGLE Vulkan SwiftShader. Zero page errors;
13 software-fallback, ReadPixels and texture warnings remain recorded. This is
functional software-rendered evidence, not native GPU or hardware performance
parity. It adds no absolute-clock, native mixed-class order, full-world RNG or audio
claim. The original producer/component proof continues to own immediate
initialization timing. Reviewer performed only receipt/source/hash reads and image
inspection; no browser, native replay, package job or source edit.
