# Authored tree-hover evidence draft

Local packaging draft for [PR #283](https://github.com/JohnDeved/populous-new-dawn/pull/283),
referencing [issue #19](https://github.com/JohnDeved/populous-new-dawn/issues/19).
**Ordinary rendered acceptance and the before/after screenshots are pending. Do
not publish this draft as a completed result.**

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
| Independent review | Source and standard results accepted; no blocking source finding. Final product acceptance awaits ordinary rendered evidence. |

The composed regression supplies texture IO, painter submissions, GPU and
unrelated frame boundaries. It is not an ordinary rendered gameplay witness.

## Ordinary witness status

Baseline attempt 01 used application `2107ccf` and QA head
`9dcee20c48e4ecf5c08823fdd16724572c79afc4`. It failed the declared-target prerequisite
with `Declared authored Mission1 targets unavailable`. The exact authored
object-42 anchor predicate is under correction. This failure supplies no completed
baseline hover, visual comparison or product acceptance.

Actual before/after screenshots, naturally occurring shade phases, leave/re-entry,
stationary-pointer pan/zoom and the building control remain pending. No screenshot
placeholder is presented as evidence. The reviewed pair must bind application/QA
commits, target identity, normal input and clock conditions, selected IDs/orders,
viewport/renderer details and captured pixels before this report is finalized.

The original release deadline and the broader issue acceptance remain open. This
slice does not establish full original controller/modal behavior, tooltip parity,
native whole-frame pixels/timing, hardware performance or additional parity credit.
