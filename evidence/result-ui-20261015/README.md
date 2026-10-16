# Result UI restoration evidence

Refs #457. Native source proof and bounded presentation verification are complete;
bounded presentation acceptance is retained below. Actual full-game lifecycle
remains blocked and is not claimed.

## Source and captures

- Baseline commit: `aaa3202a4c8fa2f309886ae38e5ab9b349f3047e`.
- Captured implementation: `73f3b74271850344b15fe996a456bd6153108b60`.
- `native/`: bounded disassembly, exact layout/label metadata, static source-art
  reference and independent import/reference reviews. The reference PNG is a
  reconstruction, not an original-game screenshot. See its README/manifests.
- `before/`: six source-bound baseline presentation screenshots, Mission 1,
  won/lost, time 125 seconds, at 640×480, 1280×960 and 1920×1080.
- `after/`: 24 passing checks, 19 screenshots and zero page errors. The six
  comparable views have the same explicit inputs, neutral source-styled empty
  battlefield and production HUD scaling. Additional captures cover short/wide
  windows, real DPR 2, Tutorial and independent missing/corrupt art/font cases.
- Exact executed source files are in `executed-baseline/` and `executed-fixture/`.
  `.tsx` and `.mjs` snapshots have a `.txt` suffix solely to keep stubbed historical
  fixtures out of repository-wide TypeScript/lint execution; their bytes are intact.
  Receipt hashes refer to their original names.
- The maintained portable runner is `scripts/result-ui-fixture/`. Its portability
  adaptation was syntax-checked and reviewed, not separately browser-executed.

## Verification and limits

- Native importer verification covers all 224 glyphs, 13 frames, 552 tile positions,
  deterministic regeneration and rejection of each mutated input before writes.
- Focused component/layout tests passed 5/5 at the implementation checkpoint.
- Canonical Cloudflare production-target build succeeded for exact `73f3b742`;
  raw check response, version and immutable preview are in `checks/`.
- The fixture imports the actual component/current globals/HUD helper and exact
  Home gate/input-mask/key fragments. All unrelated world/store/engine owners are
  explicit stubs. It proves presentation and dispatch, not world replacement,
  continued simulation, actual camera completion, profile or checkpoint ownership.
- Two clean-main integrated-harness baseline attempts failed during Vite route
  readiness with SIGKILL, including a warmed-cache 768 MB attempt. Neither reached
  browser launch. See `integrated-baseline-failures/`.
- `fixture-failures/` preserves the first static startup SIGKILL and the first
  bounded run's incorrect harness label expectations. The final run corrected
  expectations to source metadata without changing application behavior.
- `checks/initial-attempts.json` records the capped typecheck heap failure and
  intentionally interrupted monolithic check. Default-heap typecheck passed, but
  no complete `npm run check` pass is claimed by those attempts. The complete durable
  inventory and split gates are retained separately below.
- Full standard split coverage passed on clean `17f9d776`: all 430 test files,
  2,765 passing tests in 43 complete batches, TypeScript, parity and orchestration.
  Independent accounting verified every file exactly once, final top-level counts,
  source/input/installed-lock/raw-log hashes, with no skips or substitutions.
- Focused maintained-file lint/format, health and duplication commands passed.
  Global ESLint/Oxlint/format/unused remain failed with independent attribution:
  392 existing ESLint errors, one additional nonfatal source-PNG warning, unchanged
  1,434 Oxlint diagnostics, unchanged viewport-bounds formatting failure, and one
  retained historical CSS file added to unused/duplication evidence findings.
- Independent final bounded-presentation ACCEPT and exact input/tree fingerprints:
  `validation/`. Full raw receipts/logs, complete inventory, runners and audits are
  in `validation/validation-17f9d776.tar.gz`; archive checksum is alongside it.
- One integrated remote attempt on the successful immutable preview stopped at
  `ERR_CERT_AUTHORITY_INVALID` before loading the game. No warning bypass, retry,
  injected setup or live assertion ran. `integrated-remote-blocked/` preserves it.
  Real result-camera, continued simulation, Continue/Restart world replacement,
  selector-return and durable profile/checkpoint behavior remain unverified.
- Source explanation and adaptations: `decomp/research/original-result-ui.md`.
  No gameplay parity credit, native runtime/pixel equivalence or hardware
  performance claim follows from these presentation fixtures.
