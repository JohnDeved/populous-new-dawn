# Mission3 ATTACK allocation gate acceptance

Issue: https://github.com/JohnDeved/populous-new-dawn/issues/227

The Mission3 adapter now checks native state20, the authored attribute25 raid cap
and a free task slot before selecting a target. Rejected requests preserve RNG;
one active raid at the authored cap1 blocks a second. The fix remains after existing
argument validation and retains `requestAttack`'s defensive checks. Other missions,
target geometry, recruitment and combat are unchanged.

## Source correspondence

- Runtime baseline: `89e68606a406f93715b930550317519818ddc081`.
- Repair/native/portable tested source: `6335ef3bddcae93c008f8d3b62a39eea73ab2176`.
- Standard/quality tested source: `989edde0a327242671584d5fe9e2e5d89a48591a`.
- The6335→989 change only indexed the evidence, reconciled older research notes
  and retained receipts; application, probe and test bytes were unchanged.
- Later evidence-only commits preserve these tested-source labels. They do not
  claim a lost pre-reset Git object was recovered or that unpublished commits are
  available from GitHub.

## Raw evidence

Each receipt contains exact command, source/input hashes before and after,
status/exit code/timestamps, complete raw stdout/stderr and stream hashes. Separate
logs are also retained for native and focused portable cases. Standard/quality
receipts embed their raw streams; their original working logs remain at the paths
recorded in those receipts.

- `attempt1/`: setup failure before paired output. A default1GiB Unicorn translation
  reservation conflicted with the process1GiB address-space ceiling. Preserved failed.
- `attempt2/`: accepted nominal task, then the original state20-disabled rejection
  versus a port RNG draw. Preserved failed/exit1, first-mismatch stop.
- `attempt3/`: original cap/full-pool rejection versus port extra allocation/RNG;
  matching last-free-slot behavior. Preserved failed/exit1 with all three cases.
- `portable-before/`: failure-first actual adapter regression on unchanged runtime;
  the three native-proved failures and two accepted cases are retained exactly.
- `portable-after/`: all five actual-adapter cases and unchanged natural raid/
  checkpoint tests passed on6335ef3. No original script, ordinary command route,
  population, building, actor or natural outcome assertion was changed.
- `native-after/`: all five unchanged paired cases passed on exact clean6335ef3;
  original gate/allocator/target/geometry/RNG execute, with only three population
  reads supplied. Recruitment/controller execution is explicitly excluded.

All five native-after cases reported a16,777,216-byte translation buffer. CPU4,
per-call1-second/2-million-instruction,1GiB address-space,30-second CPU and65-second
outer limits were retained. The optional loader setting preserves default behavior
for other callers. These are controlled composition results, not full original
world simulation or an original OS game launch.

## Standard and TypeScript quality

All receipts below are source-bound to989edde0 with unchanged before/after inputs.
See `standard/receipt-index.json` for exact receipt hashes.

| Check | Result | Relevant limit |
| --- | --- | --- |
| `npm run check` | PASS | TypeScript, full portable suite, parity check, orchestration check; no parity recording. |
| `npm run build` | PASS | Build retains plugin-timing/chunk-size warnings; no deployment. |
| Oxfmt check of changed TypeScript | PASS | Read-only scoped formatting. |
| ESLint of changed TypeScript and new JS/test | PASS | Existing Ponytail/project config applied. |
| Oxlint of changed TypeScript | FAILED, baseline-identical | Ten cycle errors and26 warnings also occur on exact89e6860 source. |
| Fallow health/hotspots/targets | PASS with advisory output | Existing large-function/coupling recommendations are not a cleanup mandate. |
| Fallow duplication | PASS with advisory output | Repository clone findings remain outside this repair. |
| Fallow dead code | FAILED, advisory findings | Eight files, four exports, three dev/optional dependencies,38 unresolved imports, one unlisted dependency and20 cycles; no repository-wide clean claim. |

`standard/quality-attribution.json` records the exact Oxlint comparison. Candidate
and original file hashes are pinned, and all36diagnostics match after accounting
for the ten inserted lines. No diagnostic is added or removed. The first baseline
invocation rejected a relative `..` path before analysis; the retained absolute-path
run is the actual comparison. No source or linter configuration was weakened.

Fallow reports two existing import cycles for the modified module; this patch
introduces no import or exported API. Advisory recommendations were inspected;
no broad refactor, suppression or unsupported deletion was added. Fallow-wide
findings were not represented as having passed or exhaustively baseline-compared.

Maintained source passes `git diff --check`. Whole-artifact checking flags six
whitespace-only lines in the original failed Node TAP output; these raw evidence
bytes are intentionally preserved rather than normalized.

## Rendering and publication boundaries

Independent source preflight accepted no new rendered capture for this nonvisual
admission/RNG correction. The existing Mission1 computer-attack browser checker
stages a downstream retreat; unchanged public-entry rendering does not exercise
these gates. The unchanged natural full-world Mission3 test and actual native/
adapter pairs are the relevant live-caller evidence. Natural rendered recurrence,
hardware performance and whole-mission parity remain outside this claim.

Normal Git push authentication remains unavailable. The branch and incremental
local Git bundle preserve all source and evidence; no API blob or Library upload
substitutes for publication. Independent code/evidence review accepted the bounded
repair and gates; see `final-review.md` and `source-manifest.json`. Publication and
integration remain separate pending actions.
