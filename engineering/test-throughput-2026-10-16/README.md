# Faster test feedback: observed result

On 2026-10-16, the complete `npm run check` fell from **38m 55.044s to
22m 51.563s**, an observed saving of **16m 03.481s (41.26%)**. Both conditions
passed all **435 files / 2,809 tests**, with identical cases and no failures,
skips, cancellations or TODOs. The test phase alone saved **15m 58.852s (41.30%)**.

This is one predeclared serial-then-bounded comparison on measured source
[`d5fd9b88`](https://github.com/JohnDeved/populous-new-dawn/commit/d5fd9b889dd6aa301d5e2b2d84362b843085259a),
using the same final runner and actual installed dependency bytes. It is an
observed delta, not a repeatability guarantee or a comparison against the old
manual batching workflow. Source, dependencies, case hierarchy/order and runtime
inputs remained unchanged. This directory was added afterward as **read-only
evidence only**; the implementation, tests and configuration are unchanged from
the measured commit.

## Tradeoffs and use

- Two isolated file workers run the 357 reviewed files; 78 resource-sensitive
  files remain serial. Changed/unreviewed inputs and customized runtimes fall
  back to serial execution. `PND_TEST_CONCURRENCY=1 npm run check` is available
  for lower-memory execution.
- Whole-check sampled aggregate peak RSS rose from **1,136.49 to 1,485.32 MiB**;
  reaped-child CPU rose from **3,240.743 to 3,367.940 seconds**. RSS sampling can
  miss peaks and double-count shared pages. Host quotas/contention are unknown.
- Both profiles were dependency-page hash-warmed, with one typecheck warmup.
  Serial-first order and cache/host variability remain limitations.
- `npm run test:focus -- tests/audio-enable.test.mjs` provides explicit early feedback;
  orchestration suggests conservative advisory selections. Focused checks do not
  replace the complete final check/build gate, and their time saving was not
  separately measured.
- In this executor the inherited `NODE_PATH` triggers serial fallback. After
  confirming project dependencies resolve without custom loaders, the documented
  per-command clean environment is `NODE_PATH= NODE_OPTIONS= NODE_COMPILE_CACHE=
  NODE_V8_COVERAGE= npm run check` (on one shell line). Do not clear intended
  customizations globally.

See the [full measurement report](measurement-report.md) for the exact commands,
conditions, pilot, attempt history and measurement cost. The recorded benchmark
commands cost 64m 43.389s; at this observed saving that cost alone is amortized
by five comparable future full runs. This excludes implementation/review and
is not a claim of net time already saved.

## Verification and retained attempts

The original 2,795 tests remain intact; 14 runner/policy regressions bring the
candidate to 2,809. Full serial and bounded `npm run check` both passed. Final
source-bound focused receipts each passed 26 cases under both profile overrides.
The measured source also passed its canonical Cloudflare build (build
`8674644d-5841-4588-98f8-c03a9068e33b`). The evidence-only successor requires a
fresh canonical build before merge.

The archive retains preliminary/superseded preparations and implementation
failures, without rewriting their outcomes:

- The eight-file pilot passed but lacked complete installed-package fingerprints,
  so it is diagnostic only and does not establish the accepted saving.
- The `f2a8a220` warmup was superseded; `0ed19f09` preparation was never launched.
- `development/focused-runtime-binding.log` has three failed synthetic-fixture
  assertions caused by inherited `NODE_PATH`; fixture environment handling was
  repaired and passing follow-up/final receipts are retained.
- `development/lint-new-files.log` has four introduced quote-escaping lint errors,
  repaired before the final source; the passing rerun is retained.
- `development/lint-first.log` records three pre-existing unused-variable lint
  errors in `scripts/orchestration/cli.mjs`. They are unchanged by this PR. No
  claim of a clean repository-wide lint run is made.

## Portable raw evidence

[raw-evidence.tar.gz](raw-evidence.tar.gz) contains 80 original artifacts plus its
manifest: raw logs, immutable receipts, frozen parsers/configuration, dependency
manifests, attempt records, and focused regression evidence. Archived Python is
inert historical evidence, not new project tooling. This directory is outside
runtime receipt discovery and is not used to regenerate fixtures or ledgers.
Private temporary directories and Python caches are excluded. A credential and
email-pattern scan found no matches; technical absolute paths are retained.

Verify the download using `sha256sum -c SHA256SUMS` from this directory. The
[artifact manifest](artifact-manifest.json) maps each historical source path to
its portable archive path, byte length and SHA-256. Receipt/config/log bytes are
unchanged, including their original paths; use the manifest to resolve them
instead of rewriting them. The archive's `benchmark-artifacts.json` separately
records the benchmarker's original 49-file inventory and deduplicated origins.
