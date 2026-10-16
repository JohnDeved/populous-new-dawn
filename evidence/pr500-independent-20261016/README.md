# Independent PR #500 focused and fixture review

Reviewed source: `9b959fa09fd86ac4cc2d72bbb95b92caefe09c93` against `7e4806f25a7d202e67491186f1e62c648e379dab`, in a clean detached checkout. No author branch changes, browser use or full-suite run.

## Focused correction: ACCEPT

All30 tests pass across checkpoint-restore-ui, checkpoint-database-open-retry, campaign-profile-recovery and campaign-profile-union. The correction replaces silent navigation stubs with throwing spies, routes deliberate navigation and Load through extracted actual Home handlers, and settles delayed retry while the Home effect remains mounted. A newer memory checkpoint and active world remain authoritative.

The synthetic hooks/IndexedDB and extracted Home JSX are explicitly bounded; they do not establish rendered focus, actual browser transaction behavior or full Home mounting. Browser evidence remains a separate gate.

Focused stdout SHA256: `dc48821077145200b1f60fd7e0bb4e6ac4e7be4945ec45fcd1fdca0fbf0f7907`. Exact test source SHA256: `3f459d8a845f3921704c9b74fc1ffd3b9fb4b0dc5c5bc8b43dddacb5afda525d`.

## Lint remains failed, unchanged baseline

Candidate original-main-menu ESLint exits1 with two react-hooks/refs diagnostics on rows.map at334:14. Running the exact baseline menu bytes through the same unchanged ESLint/config reproduces both at318:14. No findings were suppressed. Baseline source SHA256: `03648f12524e694c33a56437c52991d854e4d0e664adb79afaafefc238b32917`. This is targeted baseline attribution, not a clean global lint claim.

## Prepared browser fixture: findings before acceptance

Reviewed the author's ignored `work/orchestration/checkpoint-recovery/browser-scenario.mjs`, SHA256 `537f812724919c3086fb5fce15445911f8273b858908c3e08aba3747a8cc61bd`, read-only. It uses public Save to seed real IndexedDB and public Retry keyboard/pointer controls. Fault injection is restricted to the named database's open or readonly checkpoint transaction; snapshot uses saved original methods; retry writes are counted and persisted storage hashes compared. Empty storage is a separate fresh context. Unsupported storage is covered only by the focused test, not this browser scenario.

1. Lines225-229 and267-270: deliberate Load acceptance checks a different world, same level and turn >= saved turn. A fresh restart in the same level can eventually satisfy those checks; the late case also lacks a loaded-level assertion. Capture the exact checkpoint at the synchronous Load/replacement boundary with a read-only observer, or compare stable distinctive saved state before simulation advances. Do not infer saved-state fidelity solely from an advancing clock threshold.
2. Lines273-285: errors are asserted empty before finally closes remaining contexts. Error listeners remain active during close, but no post-cleanup error assertion changes status. A runtime/console error delivered during final closure can be retained alongside status passed. Check errors again after all closes, and ensure the outer receipt incorporates scenario-context errors rather than only its separate initial page.

The first browser attempt was already recorded failed on its Skip introduction locator with cleanup verified. It is not passing evidence. Final rendered evidence is pending author correction/publication; no browser acceptance yet.

## Portable receipts

Private path prefixes are replaced by `<review-root>`/`<home>`. manifest.json preserves original/public hashes separately; embedded hashes still identify original raw streams. Source hashes are unchanged. Baseline raw streams and command metadata are retained alongside the candidate source-bound receipts.
