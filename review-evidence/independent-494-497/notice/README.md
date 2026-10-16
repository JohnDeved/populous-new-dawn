# Independent PR #497 source review

Reviewed corrected head: `a0bcf7dfa3dbf2491cfb9fb3c01d138cca005cd9`.

## Findings and resolution

1. The original guard checked world plus serial. The actual producer reuses serial 1 after clearing; an obsolete callback could therefore clear a different notice in the same world. The original published head `1d80214ea3a164bc29597875c5a682aa35ea82dc` and intermediate `4f39e7f12e76317431de1023f30dc6385b9b2fa9` each fail this case, with three other cases passing. Corrected head checks world plus notice object identity and passes all four cases. Current callback completion still clears its own notice. This directly invokes a captured callback; it does not establish that a browser naturally delivers a duplicate animation event.
2. The earlier browser scenario's five-second expiry wait could accept a restarted three-second timer. Corrected source captures animation identity, waits for at least 1200 ms consumption, checks identity after hidden/menu/selector/reopen transitions, and compares finish elapsed with remaining duration within 250 ms. Source review supports the assertion design. Corrected browser execution evidence remains pending; this bundle makes no browser acceptance claim.

## Independent checks

- `node verify-notice-instance.mjs CHECKOUT FRESH_REPORT_OUTSIDE_CHECKOUT.json`: 4/4 passed on corrected head. Imports actual world-effects requestTutorial and extracts Home callback through the existing TypeScript harness. Receipts bind source and dependencies before/after and report unchanged source.
- `node --test --test-concurrency=1 tests/route-notice-modal.test.mjs tests/pause-menu-ownership.test.mjs tests/route-recovery.test.mjs`: exit 0, 15/15 passed. Raw stdout/stderr and SHA256 receipt retained.
- No browser, full suite, build, production edit or merge performed by this review.

## Cancellation/reopen review boundary

The existing actual-Home focused tests cover both original pause states, menu/selector/reopen, same-world close, ordinary non-menu pause, active notice replacement and replacement world. The browser source exercises Quit Level -> No, options -> selector -> Escape, Continue, reopen, then Escape, retaining notice/animation ownership and remaining lifetime. Scene/world/canvas identity and frozen simulation counters are observed across the first hidden interval. These are source assertions until the author's corrected browser receipt is checked.

## Publication and reproduction

Failed assertion stack prefixes are replaced by `<review-evidence>`; publication.json records original and public hashes. Exact source/dependency/probe hashes are preserved. Successful receipts and raw focused streams are byte-identical. The probe is portable; use the exact source revision and its installed dependencies, and a fresh output path outside that checkout. No private filesystem layout or credentials are published.
