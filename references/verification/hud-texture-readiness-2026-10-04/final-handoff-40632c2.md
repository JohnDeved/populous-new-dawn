# HUD readiness final review

PR https://github.com/JohnDeved/populous-new-dawn/pull/201
Issue https://github.com/JohnDeved/populous-new-dawn/issues/200

Accepted base `139ec7dec8fc77462a9bbf8a5fc09ad7b9bb9d31`.
Frozen/tested head `40632c29305d928ee17d48b6e25f6127c71702c7`.
Tree `1b0070d730d9ec73e6fef0f2d59d20f9b39686f5`.
Clean worktree; all six changed HUD files remain byte-identical to checker
preflight `15cac813bb40c58ef9dfa70ac9635f082ccfd6d3`.
`full-40632c2.diff` is the complete six-file change from accepted main.

## Outcome

The three historical building/worship gates now await each current-document HUD
module/image observation sequentially. They preserve the exact image conditions
and accept only literal true. Existing caller budgets remain 30 seconds, except
Mission 1 worship's 20 seconds. A late settled result fails, but an in-flight
page.evaluate cannot be interrupted by this helper; it needs settlement or owning
browser closure. No persistent page-function aliases or runtime/gameplay changes.

## Final gates and actual browser result

- `check-final-40632c2.json`: full `npm run check`, passed, exit 0. All 1,017 tests,
  typecheck, parity check, and orchestration structure pass on exact frozen head.
- `build-correspondence-40632c2.json`: carries passed `npm run build` from
  `6b6eb684f4f010420a758cfe4fd481b6dfca9545`; not rerun. All 13 tracked production
  input objects, root package-lock, private installed lock, and raw stdout/stderr
  hashes match. The original passed receipt and streams are retained in the
  adjacent balloon-command-position worktree and cited with hashes.
- `browser-command-40632c2-run01.json` plus
  `rendered-40632c2-run01/receipt.json`: passed, exit 0, stable source fingerprint
  `ddaf693778e41956ac6b32646e68b85c94e5463b08f9fc16b44aa241c59080bd`.
  Actual sandboxed Chrome Headless Shell 154.0.8037.92, WebGL2, ANGLE/SwiftShader.
- `rendered-40632c2-run01/hud-texture-readiness.json`: both ordinary Mission 1
  documents are playing, have attached WebGL2 canvases, and no context loss.
  Distinct timeOrigins `1791142926423.1` and `1791142942415.3` verify reload.
  Both startup and repeated gates completed on each document with literal true.
  Every gate observed true on its first read: 278/212 ms initially, 305/266 ms
  after reload. **No real-browser false-to-true transition was observed.**
- Report equals the harness's detached terminal result. Scenario SHA256
  `e8579afda3debaeeaaaab5beac2dbf420c6d7bdccba7e68b1726063234dacd3a`
  and helper SHA256
  `72e92a34a7b282edea371af92fdcf657a43dc80dbc5bb7fb44293a9b329b24a1`
  match the reviewed source bytes. No browser console errors.
- `terminal-release-40632c2.json`: foreground session 48237 exited 0. Harness
  awaited owned browser close and server cleanup before terminal receipt at
  19:42:34 UTC; the parent was immediately notified that lane/4368 were released.
  No independent machine-wide process or port census is claimed. No retry.

## Focused failure-first and source checks

`failure-first.json` retains the original baseline gates: 17 tests, 8 expected
failures, 9 passes. Delayed false was read only once and exhausted false did not
reject. `focused-40632c2.json` is the final expanded 20-test pass, exercising all
five maintained caller invocation paths, actual helper and image predicate with
only fake module/document/clock boundaries. It proves delayed false→true,
sequential reads, exact image conditions, exhaustion/error, repeated documents,
literal readiness, and the in-flight deadline limit. `handoff.md` explains the
17-to-20 test expansion and earlier source-bound receipts.

`structural-40632c2.json` passes. Earlier six-file syntax results carry through
verified byte equality. `git diff --check` passes. Scoped lint is explicitly
mixed: `lint-other-five-40632c2.json` passes; `lint-40632c2.json` fails solely on
three existing empty catch blocks in building hover. `lint-baseline-hover.json`
reproduces those same catches on accepted main (baseline lines 30/40/46; candidate
31/41/47). No unrelated cleanup. TypeScript quality: not applicable to this
six-MJS-file change; current runtime source comes from accepted main.

## Limits

The real smoke covers actual helper/module/HTMLImageElement use, repeated reads,
and a fresh document through ordinary startup. Focused tests cover the three
full historical callers' wiring/predicates. The full historical building-menu,
building-hover, and live-worship gameplay routes were **not rerun**. This does not
claim screenshots, full visual correctness, native pixel/gameplay parity,
campaign completion, or hardware-GPU performance. No thresholds, fixtures,
Mission 3/transport/guard sources, browser-game, Actions, or auth were changed.

Source and checker preflights accepted the prior identical HUD bytes. Final
acceptance now requires reviewing these real execution receipts and source
correspondence. Parent owns final merge and issue closure.

Failure-first source preservation: `failure-first-source-manifest.json` points to
all five exact input files under `failure-first-inputs/`. The initial 17-test
source was reconstructed by reversing the three documented test additions and
verified byte-for-byte against the original receipt SHA256
`25f8d09230c77415c5939c973f80028a2bb49ace94dcfe262c82c222fc6f04a4`
before retention. Helper bytes match the original receipt; the three original
caller files come from the recorded immutable accepted base. No failure-first
rerun or outcome was invented.
