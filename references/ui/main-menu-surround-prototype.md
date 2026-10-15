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

## Subsequent source-derived outpainting experiment

The earlier stone-repeat implementation above is preserved in `98c3c2ff`.
A read-only design audit then recommended a deliberate lateral art extension,
with an unchanged 4:3 baseline, original focal art/logo identity, asymmetric
original lighting, and at most a narrow stone-only feathering margin if required.
The initial every-pixel-unchanged constraint for widescreen was our experiment's
constraint, not a user prohibition on modernization.

Two built-in image-generation edits were attempted, with the actual original
background inspected and supplied as reference. Prompts are retained in
`prototypes/image-prompts.txt`. Neither output is accepted artwork:

1. `public/adapted/frontend/stone-surround-v1.png`, 1983×793, 2,915,100 bytes,
   SHA-256 `75d826562cb38d47a8dac4a4778e7ba8dec2f512d67a17d13121e6368ba74223`.
   The tool returned 2.5:1 rather than requested4:1 and repainted/removed central
   content. A static runtime layer uses this behind the exact original frame,
   preserving original logos/title/menu. Actual captures show the sharper,
   higher-contrast generated stone joins conspicuously to the original. It also
   cannot fill32:9 at uniform height scale. Rejected after rendered inspection.
2. `prototypes/stone-surround-v2-rejected.png`, 2172×724, 2,678,840 bytes,
   SHA-256 `d09bdc1922b805fa97683e89867aa0c3608626d970779878452f9ff4a6d53dfb`.
   Targeted revision requested original low-resolution grain/lighting, plain
   peripheral stone and wider extent. The output remains visibly remastered,
   adds large stone formations, relocates/repaints the central art/logos, and
   returns3:1 instead of4:1. Rejected at direct image inspection; not integrated.

No feathering was added to conceal the mismatched art, and no further serial
art attempts or full suites were run. The working runtime source retains the
first outpainting overlay solely as explicitly rejected WIP, not a deliverable.
Missing generated-art loading falls back to the solid surround and original
frame; full network-failure acceptance was not performed.

Portable comparable before/after screenshots (1920×1080 and3440×1440 DPR1) are
under `prototypes/screenshots/`, with clean-main and runtime-overlay receipts in
`prototypes/before-receipt.json` and `prototypes/extension1-receipt.json`.
The latter's dirty-diff/input fingerprint is
`9ca788e08ce5201512ebc3546ec44ffea2d1261193449bdbd1225410b4348435`, based on
`98c3c2fff52f3259edc3d9ce1f35518f46d9db70`; the preservation commit retains
that same two-file runtime diff and hash-pinned v1 asset. Captures are real 2D
browser renders, not generated screenshots. The generated image alone is never
presented as browser evidence. Raw earlier experiments remain under `/tmp/ui460`.

All final acceptance gates remain open. The previous typecheck and native tests
predate this outpainting source revision, so do not represent final candidate
validation. No gameplay parity, accepted adaptation, merge or deployment claim.
