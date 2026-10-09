# Final bounded Hut tooltip review

**ACCEPT PR286 candidate `9e55aa8107f781ee32021ea103ac5796b8fd119d` against base `699ac11af6d40a48b2f122ffd47a0daa9d2027f7` for the scoped browser implementation. No remaining review blocker is identified for that bounded change.** This does not close every native tooltip/inspection requirement or award whole-engine parity.

## Implementation and source review

The independent review inspected the complete implementation/caller/test diff and substantive repairs. The accepted source packets supply ordinary category/key/dwell behavior, shared threshold history, handled forced expiry, retained object/cell ownership, inspection allocation/renewal, and the separately scoped admission and Blast-control source. The new controller composes these at the existing flyby tick opportunity; its 24 Hz compatibility scheduling is explicit. Existing forced numeric lifetimes and unrelated panel clocks remain preserved.

Hut records reserve once independently of DOM visibility and preserve reuse, retirement-before-failure, bounded inspection/secondary count gates, queued input order, guard cancellation, and transient restore. Same-Hut DOM hover/focus retention preserves control usability. Live sampled identities/cell flags are rechecked without fresh controller geometry picking. Named non-Hut winners cannot allocate a different Hut beneath their retained cell. Explicit positional feedback uses the existing browser marker/sound adapter.

The sole change from product-tested `9ab2195ddb8815790e0bbbff337162e9ba99c183` to final `9e55aa8` is a coherent World roster in `tests/secondary-hut-smoke.test.mjs`, SHA256 `350bbafa70ec5c6e76a1176441351b06edcee3490818a8382a909a5d7d41e2e3`. It supplies the two existing non-Hut panel owners; all assertions and visibility transitions are unchanged. All application, public asset, and script bytes remain identical. The maintained application fingerprint includes tests and therefore correctly changes; product correspondence is established by the exact one-file Git delta.

## Standard validation accepted

Aggregate `populous-recovery-20261009/work/orchestration/issue19-hut-tooltip-final-02/aggregate.json`, SHA256 `d8edb768f29058638d10e1790a68e04889142f28cb633381fe53a3eb08943be4`, is independently ACCEPTED:

- 1,621 tests passed, zero failed/cancelled/skipped/todo; all 274 current test files covered exactly once.
- 168 unchanged files and typecheck explicitly carry their original `9ab2195` receipts. All 106 files in stages 06–08 execute fresh on `9e55aa8`, followed by fresh parity check, orchestration check, and build, all passed.
- All 16 stage rows, receipt hashes, raw streams, source/sourceAfter identities, input pins, and exact manifest coverage were independently verified. Test totals were independently reconstructed from each stream's final eight lines, avoiding an embedded 39-test child footer in stage06.
- The original stage06 failure remains FAILED and retained, SHA256 `a11a7afc62aceed36af00c457036348255b7601b8534aeeaf06a89c12cf713a3`. The original aggregate-parser failure is also preserved; its corrected data-only parser does not alter or rerun application/test commands.

This is reviewed changed-only standard validation, not an all-fresh new-head claim. Scoped format, structural and context checks passed. Strict Oxlint/ESLint remain failed with independently matched inherited findings only: 97 Oxlint diagnostics and three ESLint diagnostics, zero introduced, zero removed, no new suppressions. Attribution SHA256 `0b54c242a4bc579f976c49774cb7547eb7f0f74a50af44a21a9fb7ec006263df` remains accepted. The changed fixture's separate cheap check does not alter that product attribution.

## Ordinary browser evidence accepted as separate review input

Independent ordinary02 result verdict `hut-tooltip-ordinary02-result-review-20261009.md`, SHA256 `ec751b51ad08d1835174e053e46469f44218a36f32f2673cd94d7708d3d8acb2`, was read and accepted as the separate browser review input. It binds product `9ab2195` and QA `964d3385458a2aa6d784c9863dcf5a00e47b269d`; correspondence to final `9e55aa8` follows the fixture-only delta above. This reviewer did not duplicate browser execution or the other reviewer's pixel analysis.

That verdict accepts actual authored M1 Hut naming/inspection, sampled shared history, handled forced expiry, trusted stationary explicit input and one positional marker, 31 controller visits of physical panel-control hover retention followed by natural expiry, named Tree-to-Hut transition, typed Save/committed storage/Load correspondence, transient record reset, and cached page-session continuity. Ordinary01 remains FAILED.

Its exclusions remain binding: the early blank-cell and menu-hidden PNGs were captured before those named states and cannot prove their apparent pixel claims. Actual controller/input rows provide the separate stated facts. Native panel/status ownership, positive textless/unnamed-object M1 coverage, guaranteed forced/HUD overlap, native wall-time/allocator/marker-coordinate/raster equivalence, audible feedback, fresh-page checkpoint recovery, and hardware performance remain outside acceptance.

Panel event propagation can leave navigation coordinates stale. Therefore absence of an `unsupportedHistory` entry is not proof of no panel handoff or a native no-handler interval. Positive `unmapped-panel` and actual control usability observations remain valid; this is a documented diagnostic limit, not a blocker requiring a further product change.

The detailed checkpoint reviews remain in `hut-tooltip-runtime-review-20261009.md` and `hut-tooltip-test-freeze-review-20261009.md`. This reviewer performed source/data/hash checks and wrote local review/aggregation artifacts only; no application, test, dependency, native, emulation, or browser execution was performed by this reviewer.
