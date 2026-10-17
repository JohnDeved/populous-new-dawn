# Historical world-theme and ordinary Temple verification, 2026-10-10

This is a navigation record for the accepted, source-bound QA accompanying
[product PR #314](https://github.com/JohnDeved/populous-new-dawn/pull/314), not a
new test run or a claim about current main. The tested product was
`e989fbb71849f2530692f896ea3d045afd6432bf`; its comparison application/assets were
`219384134d21200f80df0496a4866fb02fb200db`.

The [immutable report and independent acceptance](https://github.com/JohnDeved/populous-new-dawn/blob/e9ec89d9ea4bf6289f36a9b50ada46d974f321a8/qa/pr314-rendered-20261010/README.md)
retain the before/after images, exact helper provenance, failures, validation
results and claim limits. The [published manifest](https://github.com/JohnDeved/populous-new-dawn/blob/e9ec89d9ea4bf6289f36a9b50ada46d974f321a8/qa/pr314-rendered-20261010/manifest.json)
binds exported records and image hashes. These historical outputs remain at that
commit rather than being copied into the development tree.

## Observed results and limits

- Both world-theme routes passed: M1 → M3 → Save → M1 → M2 → Load M3 → Restart
  → page reload → startup Load. Candidate assertions checked selected c/s/p
  terrain bytes, full atlas responses, selected tree geometry and warm-cache
  replacement. Comparable views share camera sequences and viewport settings,
  not identical natural turns or actor poses.
- Ordinary M10/M17 views established visible Temple models 95–98 across c/p,
  including multiple tribes. M17 Green submissions were behind terrain and are
  explicitly excluded from unobstructed visual coverage.
- Ordinary M3 reached construction stages 0–3, completion and genuine Save.
  Its original episode remains **failed** because of a QA shader-key assertion.
  Separate reviewed validation accepted the unchanged retained frames; it does
  not retroactively pass that episode or its unexecuted lifecycle tail.
- A separately reviewed continuation passed startup Load, Restart and checkpoint
  Load with the original normally closed game-only profile and unchanged Save
  checksum. No World, clock or storage reconstruction was used. Live Load
  comparisons covered level/turn/time and typed actor/terrain/stock digests, not
  byte-for-byte restoration of every live World field.

The report records 17 passed standard stages on the exact historical product,
including 1,910 tests in 304 files and a production build. Baseline-matching lint
findings remain disclosed; this is not a clean-lint claim. Sandboxed Chrome
Headless Shell with ANGLE/SwiftShader establishes software-rendered functional
behavior, not original raster/cadence equality, hardware performance, campaign
victories, completion of issues #14/#23 or new parity credit.

## Source retention

[QA PR #317](https://github.com/JohnDeved/populous-new-dawn/pull/317) preserves the
historical helpers and their tests at the same immutable head. They are not
installed as maintained current-main regressions by this note: the continuation
explicitly admits a particular failed predecessor and its retained records, and
current-source browser compatibility has not been revalidated. Future regression
work should deliberately adapt and rerun the useful checks, keep generated
output outside tracked source, and retain these original findings unchanged.
