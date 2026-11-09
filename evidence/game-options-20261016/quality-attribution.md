# Independent quality attribution at 774af5cd

> Historical run artifacts referenced below are [retained at the pre-cleanup commit](https://github.com/JohnDeved/populous-new-dawn/tree/bc9cabf404240ad99b2aab8c26e9b0137cdd7702/evidence/game-options-20261016), not in the current checkout. Source probes, fixtures, and findings remain tracked where applicable.

Read-only comparison of retained finished command receipts and matching raw stdout/stderr hashes. No quality command or build was run by the auditor. Baseline 17f9d776 differs from accepted canonical base 04a84dab only in research/evidence; app, package/config and installed dependency lock inputs agree. Current source remained clean 774af5cd. Detailed machine report: `quality-attribution-final-774af5cd.json`; parser: `compare-quality-774af5cd.py`.

- Format: failed on the same sole `app/viewport-bounds.ts` file; no added file.
- ESLint: failed with the same 400 diagnostic identities (392 errors, 8 warnings). File/severity/rule/message and duplicate counts match after ignoring locations; no added/removed diagnostic.
- Oxlint: failed with exactly the same 1,434 diagnostic identities as baseline (673 errors, 761 warnings), with no added/removed diagnostic. The prior two category-branch warnings were repaired with disjoint JSX guards; they are absent from this fresh receipt.
- Health: command exited 0 while reporting 2,702 threshold findings across 28,976 analyzed items, versus 2,695 / 28,931. Refactoring targets rose from 393 to 394, with one additional medium-severity target. Aggregate average cyclomatic 2.4, p90 4, maintainability 83.9, dead-file/export percentages, 20 circular dependencies and 3 unused dependencies remained the same. The additional target identity is beyond the displayed top 10 and cannot be attributed exactly from retained human output.
- Duplication: command exited 0 while reporting 807 clone groups and 127 families, versus 806 and 126. Duplicated lines fell from 19,164 to 19,156, with 382 files and 11.3% unchanged. The displayed families add `app/page.tsx`, two 10-line groups, consistent with the added parallel preference-owner handler pattern. That is an inference from the visible report and source, not a full hidden clone-list comparison.
- Unused: command failed with the same displayed output and category totals: 99 files, 1 export, 3 dev/optional dependencies, 294 unresolved imports, 1 unlisted dependency and 20 circular dependencies.

Fallow human output is truncated. Equal totals/displayed output do not prove equality of undisplayed findings. Metrics, clone counts and dynamic churn changes were retained, not normalized away. These quality gates must not be reported as globally green or wholly unchanged baseline.
