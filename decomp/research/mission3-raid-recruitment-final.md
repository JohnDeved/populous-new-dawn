# Mission3 recruitment origin: final source and evidence

Issue [228](https://github.com/JohnDeved/populous-new-dawn/issues/228) changes only
Mission3's type 20 recruitment callback. An explicitly present construction base,
including cell 0, supplies the origin. Otherwise the immutable authored Shaman
record supplies the native even-packed cell, independent of the live Shaman's
movement or absence. The retained loaded-cell owner and no-new-save-state boundary
are documented in the [lifecycle witness](mission3-raid-loaded-cell-witness.md).
Shared movement staging, selection-world base/radius mapping, other missions and
the real selector/flags3 copyback remain unchanged. Issue 227's admission fix is
separate and is not part of this branch.

All results below have raw receipts and complete streams under
[`final-gates/`](../../references/verification/mission3-raid-recruitment-origin-2026-10-06/final-gates/).
The [receipt index](../../references/verification/mission3-raid-recruitment-origin-2026-10-06/final-gates/receipt-index.json)
binds original source IDs, times, status and copied artifact hashes. Failed before
comparisons, the superseded live-Shaman candidate, its held full-check pass and
the first introduced style warning remain under their actual source labels.

## Exact source correspondence

The five native pairs, natural/checkpoint regression, full check, production build
and advisory scans executed at **118a5eeeb83a3cc29a49e3bdb8407f32bb5b61fe**.
All receipt input/source fingerprints were equal before and after execution.

Final runtime **0e94469658cf1ab3ad6e3cf795072182b77012b2** differs only by the
reviewed condition inversion: `constructionBase !== undefined` becomes
`constructionBase === undefined` and the same branches exchange positions.
No branch computation is lifted or altered. This removes the newly introduced
Oxlint style warning while preserving valid cell 0 and authored fallback behavior.
The [exact patch](../../references/verification/mission3-raid-recruitment-origin-2026-10-06/final-gates/style-only.patch)
and [equivalence record](../../references/verification/mission3-raid-recruitment-origin-2026-10-06/final-gates/style-equivalence.json)
verify the single replacement. Of the 265 replay inputs, all 264 other files retain
their bytes; [source correspondence](../../references/verification/mission3-raid-recruitment-origin-2026-10-06/final-gates/source-correspondence.json)
records both runtime hashes. The coordinator/reviewer explicitly accepted this
equivalent delta with focused/scoped repetition. Native, natural, full check and
build were not rerun or relabelled as executions of the final style commit.

## Controlled native/actual-adapter result

One granted CPU 4 run executed exactly five incremental pairs and matched every
declared comparison field: selector inputs, count, ordered IDs/ranks, all flags3,
task projection and RNG. The real native origin/selection leaves were retained.
No new case or retry occurred.

| Existing case | Matched origin | Matched selected IDs |
| --- | --- | --- |
| Common-origin control | `64fc` | 306,302,303 |
| No established base | `60da` | 301,302,303 |
| Distinct established base | `62d8` | 305,301,304 |
| Live Shaman moved | `60da` | 301,302,303 |
| Live Shaman absent | `60da` | 301,302,303 |

The run lasted 07:09:59.786–07:10:02.401 UTC and exited 0. Each native call stopped
before 004cb6da, before count/membership/person preparation; the portable sentinel
stopped after flags3 copyback and before those later consumers. Complete supplied
records remain in raw output. Native TCG was 16 MiB in each case; recorded peak
native RSS was 145,684 KiB, and trace lengths were 64/64/64/64/63. No trace entered
distance helper 0049c720. All reviewed instruction/time/write/peer bounds remained
active; the [cleanup record](../../references/verification/mission3-raid-recruitment-origin-2026-10-06/final-gates/cleanup.json)
records terminal sessions and no remaining scoped processes.

Native/portable base, radius and live-versus-retained-Shaman input differences
remain explicitly visible. This is a bounded recruitment-origin projection,
not radius, movement, whole-world, whole-mission or original save-system parity.

## Portable, standard and quality checks

| Check | Exact result |
| --- | --- |
| Unchanged natural Mission3 raid/checkpoint regression on 118a5eee | PASS, 2/2 tests |
| One 900-second `npm run check` on 118a5eee | PASS, 1,305/1,305 tests plus typecheck, parity and orchestration checks |
| One 180-second production build on 118a5eee | PASS; plugin-timing/chunk-size warnings retained |
| Final direct/checkpoint regressions on 0e944696 | PASS, 8/8, including base 0 and moved/absent Shaman checkpoints |
| Final scoped Oxfmt and ESLint on 0e944696 | PASS |
| Final scoped Oxlint on 0e944696 | FAILED with baseline-identical 16 errors/57 warnings; no introduced/removed diagnostic |
| Fallow health/hotspots/targets on 118a5eee | Exit 0 with advisory complexity/coupling output |
| Fallow duplication on 118a5eee | Exit 0 with advisory clone output |
| Fallow dead code on 118a5eee | Exit 1 advisory findings; no execution/configuration error |

The [final Oxlint attribution](../../references/verification/mission3-raid-recruitment-origin-2026-10-06/final-gates/authored-style-quality-attribution.json)
compares full diagnostic JSON against exact main 89e68606, normalizing absolute
paths/byte offsets and mapping unchanged source lines. The first candidate's
extra negated-condition warning and its failed receipt are retained separately.
No linter suppression or configuration change was made.

Fallow reports 8 files, 4 exports, 3 dev/optional dependencies, 38 unresolved imports,
1 unlisted dependency and 20 cycles. These broad advisory findings are preserved,
not represented as an exhaustive baseline comparison or a clean repository.
Ponytail inspection confirms reuse of existing authored-position and coordinate
helpers, no new persistent state/API and a single local source-owner decision.

No rendered browser run or hardware-performance measurement was added for this
nonvisual mapping correction. The unchanged natural full-world caller/checkpoint
test complements the controlled native/actual-adapter proof without expanding it.

All source and evidence are committed locally. Normal Git authentication remains
unavailable: the branch/bundle are **unpushed and not reset-durable**. Publication,
integration and final independent evidence acceptance remain separate steps.
