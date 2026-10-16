# Checkpoint recovery check receipts

PR #500. Production/API-reviewed source: `2a6ce1e26658c0503354fe4de6db05e2d8aa1fbd`. Test-only correction: `9b959fa09fd86ac4cc2d72bbb95b92caefe09c93`. Base: `7e4806f25a7d202e67491186f1e62c648e379dab`.

- [review-focused.json](review-focused.json): 30/30 pass on 9b959fa0. Actual extracted Home beginLoad/startMission/loadCheckpoint now drive deliberate navigation; forbidden navigation spies guard lookup-only actions, and delayed completion happens while Home remains mounted.
- [focused.json](focused.json): earlier 30/30 pass on 2a6ce1e2; the initial fixture had narrower navigation coverage, corrected above.
- [typecheck.json](typecheck.json): pass on 2a6ce1e2. Production TypeScript files are unchanged by 9b959fa0.
- [targeted-eslint.json](targeted-eslint.json) and [format.json](format.json): pass on 2a6ce1e2. Changed test file also passed targeted ESLint before its correction commit.
- [ui-eslint-known-failures.json](ui-eslint-known-failures.json): failed, three errors and one warning. [ui-eslint-baseline.json](ui-eslint-baseline.json) reproduces the same diagnostic categories on unchanged 7e4806f2: two menu react-hooks/refs errors, Home setState-in-effect error, and image-element warning. These are retained, not waived or reported as clean. Broader preset lint is also not claimed clean.

Every receipt includes its native command, exit, source before/after, and original stdout/stderr hashes. The adjacent logs contain the portable redacted text. **Internal receipt hashes remain original hashes**; use artifact-index.json for the separate original and published file hashes. Original raw bytes remain locally retained. No credentials, profiles, browser storage records, dependency tree, or build assets are included.

These are focused source-level checks. The IndexedDB boundary and React hooks are synthetic in the Node fixture. Actual-Home browser acceptance, screenshots, fresh review, and parent-owned hosted full gates remain separate. No full local suite was run.
