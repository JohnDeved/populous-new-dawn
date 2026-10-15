# Main-menu surround prototype (issue #460)

Status: **visually rejected work in progress; not merge ready**. Related to #457
and draft PR #461. This experiment does not complete modern background adaptation.

## Preserved source and selected experiment

Base is `7ae169bded39e826fd3122fe72dfc92fb5e6b7b8`, tree
`56e8d3bb72b279fc6c0d90d3e742396c391f9742`.
`public/original/frontend/background.png` is the importer-owned original 640×480
background, SHA-256
`509cc6129cbb0574bf873d91e8b6cd2f49cbb2711f6f2cd8ea6d394723725fb4`.
Its Bullfrog and QSound marks are baked in. The title and menu glyphs are separate.
No imported bytes or original composition code were changed.

The complete central frame stays uniformly fitted and centered. An aria-hidden,
pointer-transparent decorative div behind it repeats a runtime sample from the
original upper-left stone. The current source rectangle is x40, y8, width8,
height8, inspected within the native image and free of feathers, faces or marks.
Four reflections form a 16×16 tile with matching repeat edges. CSS keeps its
texture density tied to the existing uniform frontend scale; subdued shading
applies only behind the native frame. Sampling happens once after image decode,
not on the 101ms glow timer. CSS responds to resize without rebuilding the tile.
The existing solid background remains when loading/decoding fails.

This is deliberately modern decoration, not recovered native widescreen art.
Full-image cover would crop identity-bearing content; nonuniform stretching
would distort it. Full-image repetition or mirroring would duplicate faces and
logos. A blurred duplicate would introduce an unrequested style. Those approaches
were not implemented.

## Visual experiment outcome

- First, a 96×96 upper-left repeat produced obvious vertical tile boundaries.
- Second, a reflected 32×32 sample removed straight seams but repeated stone
  markings became conspicuous oval motifs.
- Third, the 8×8 grain-only sample removed those motifs, but the bright native
  rectangle still joins abruptly to darker textured wings. At ultrawide these
  still read as bars. **The third candidate also fails the visual gate.**

Do not merge merely because center preservation or code checks pass. Stop tile
parameter tuning and select a different art/layout strategy before full acceptance.
The central pixels were intentionally not faded or masked to hide the join.

## Retained evidence and limits

Raw evidence is under `/tmp/ui460/` in the assigned executor:

- `before/receipt.json`: clean exact-main captures at 640×480, 1280×960,
  1920×1080 and 3440×1440, DPR1.
- `prototype1/`, `prototype2/`, `prototype3-retry/`: actual captures at the same
  sizes with dirty-diff fingerprints in each receipt. The first two are rejected
  alternatives, not final candidates. The third receipt binds the patch on
  `62a632ab90660751d612a16f42eedd6aac26e2b9` before its preservation commit.
- `prototype3/receipt.json`: failed bring-up (`ERR_CONNECTION_REFUSED` after
  readiness); retry used a fresh port and output, unchanged source and security.
- `capture.mjs`: shared screenshot scenario, reduced motion and keyboard Home,
  without entering gameplay. Chrome Headless Shell ran with Chromium sandbox
  enabled and remote-debugging-pipe only; no WebGL/hardware performance claim.
- `plan.json`: orchestration selection; the two source paths are explicitly
  unknown to subsystem routing, so ordinary check/build remain required.
- `typecheck.log`: `tsc --noEmit` exit0 for the third source candidate.

The complete 640×480 and 1280×960 captures are byte-identical between clean main
and the second prototype. Native `tests/frontend-composition.test.mjs` remained
unchanged and its four tests passed. This establishes preservation for that
captured state, not complete display/input acceptance.

Not run: final full check/build, complete quality gates, DPR2/fractional/16:10/32:9
matrix, extended resize/navigation/checkpoint/fallback acceptance, and independent
code review. These are deferred because the visual gate failed, not waived.
