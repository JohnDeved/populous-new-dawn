# Authored tree-hover evidence draft

Local packaging draft for [PR #283](https://github.com/JohnDeved/populous-new-dawn/pull/283),
referencing [issue #19](https://github.com/JohnDeved/populous-new-dawn/issues/19).
**Candidate pixels and final ordinary acceptance are pending. The reviewed before
evidence is bounded below; do not publish this draft as a completed result.**

The accepted source change is limited to live scenery models 1–6 with logs >= 1:
the scene's hover descriptor fallback and the render caller's `point.id` match.
It reuses the existing neutral-owner 200/255 shading. Base application:
`2107ccfabc1737aed55aca3c5579a920dd63a667`; candidate application:
`1ec5bae0e1ed91b4ff30cd36556c9adde6a15252`.

The [retained original chain](../../../decomp/research/tree-hover.md) documents
scope, source provenance and limits. [summary.json](summary.json) records exact
receipt identities and hashes; raw logs, archives and runtime profiles are not
copied into this compact report.

## Accepted source and standard evidence

| Check | Result and claim |
| --- | --- |
| Red 01, `c27c46c` | Failed the opening input-mask prerequisite. Retained; no product-regression credit. |
| Red 02, `c0d4f8b` | After actual campaign/flyby input unlock, the production picker found the authored tree and its highlight failed `0 !== 200`. Intended pre-fix failure. |
| Focused candidate | 8/8 passed across tree-hover, scene lifecycle and world-picking tests on exact `1ec5bae`. |
| Standard candidate | 1,595/1,595 passed across all 272 files, plus fresh typecheck, parity, orchestration and production build. All 16 stages finished with stable source. |
| Scoped quality | Oxfmt, ESLint, structural and context checks passed. Strict Oxlint **failed** with 19 findings: 17 warnings and two errors, byte-identical to main's baseline diagnostics. |
| Independent review | Source and standard results accepted; no blocking source finding. Bounded before evidence accepted below; final product acceptance awaits the candidate witness. |

The composed regression supplies texture IO, painter submissions, GPU and
unrelated frame boundaries. It is not an ordinary rendered gameplay witness.

## Ordinary witness status

Baseline attempt 01 used application `2107ccf` and QA head
`9dcee20c48e4ecf5c08823fdd16724572c79afc4`. It failed the declared-target prerequisite
with `Declared authored Mission1 targets unavailable`. QA compared DAT object 42's
anchor coordinates (-12,34) to the Hut's normalized runtime x/z. Actual
`addBuilding` produces runtime object 37 at (-11.0703125,33.0546875), with native
anchor (64512,54784). The same-object anchor correction was independently accepted
with 13 actual-world/405-turn feasibility contracts. Baseline 01 remains invalid
for product reproduction and supplies no completed hover or comparison credit.

Baseline 02 remains **FAILED overall** at its later Hut-control phase timeout.
Its application was `2107ccf`, QA head
`691c7d5e71961f157a34d4f73fcd0d8d61ef748b`. Independent review accepted eight natural
game-canvas PNGs, 96 original-render records and 14 trusted input events as bounded
before evidence:

- Authored tree 20, scenery model 1/render model 13, remained at uniform 0 through
  all four natural turn residues on initial hover and re-entry. Expected 200/255
  phase classes appeared in screenshot filenames; **measured baseline uniforms
  were 0**, not those suffix values.
- Trusted stationary-pointer pan, zoom/return and HUD leave worked. Each retained
  input's synchronous before/after selection, orders/ownership and RNG matched.
- The actual Blue Hut 37 was picked and naturally rendered once at uniform 255,
  followed by trusted same-coordinate canvas leave and zero-uniform renders.
  Only residue 3 was observed for this secondary control. Sustained four-residue
  canvas hover was unsupported by the existing occupancy-popup interaction;
  the exact intercepting DOM node was not recorded. The original scenario did
  not pass, and its failed status must remain visible.

These screenshots are 1240×1000 natural game-canvas frames from sandboxed browser
154 with software rendering. No candidate pixels or reviewed before/after pair
exist yet. Source screenshot/receipt hashes are retained in the summary; the files
have not been copied into this draft. The corrected candidate control must require
one real Hut pick/render followed by actual canvas leave/zero while preserving the
tree's four-residue requirement. Candidate pixels and final visual review remain
pending; no final ordinary acceptance is implied by the bounded baseline review.

The original release deadline and the broader issue acceptance remain open. This
slice does not establish full original controller/modal behavior, tooltip parity,
native whole-frame pixels/timing, hardware performance or additional parity credit.
