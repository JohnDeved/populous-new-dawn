# Pointer visibility counters on current main

This is a selective port of the visibility diagnostics introduced by public
PR561 (head d66a3791296e2aadc5b2c48884c78a5e67242748; counter source commit
ac6973e6f39bfea55b2740ac71b11a47526c9f7e), based solely on current main
a2cdba7f35361c4ce9ba89f22b5167b2126fba41. No PR561 ancestry, packed native
projection, projection cache or other held experiment is included.

The optional ordinaryTerrain.visibility object contains three nonnegative safe
integer counters: indexEntriesWritten counts entries actually rewritten,
indexReuseCalls counts both validated-prefix reuse and the existing owned-index
certificate early return, and selectionRebuilds counts actual selection rebuilding.
They observe only ordinary pointer queries with an explicit metrics sink. Renderer
preparation and native occlusion queries do not populate them, even when renderer
work primes a later pointer reuse. They do not count scan visits, elapsed time,
GPU work, or imply an optimization benefit.

GameScene constructs its fixed pointer metrics object, including visibility detail,
once even when F8 is off. Disabled callbacks pass no metrics sink and add no
diagnostic clock reads or per-callback visibility-object allocation. Enabled reset
reuses that existing metrics object. The
frame ring adds four Float64 slots per retained frame (presence plus three values),
38,400 bytes for the fixed 1200-frame ring. Existing interaction slots remain intact.
Missing old visibility detail stays absent, not fabricated as zero; supplied
malformed counters reject the sample/export. Offline evidence copies only known
fields. No IDs or coordinates are added.

Main already contains the compact actual Blob serializer and interaction context.
Neither is replaced by the older PR561 version. The actual download regression
populates all current fields, including MAX_SAFE_INTEGER visibility counters and
interaction context, for 1200 frames. The unchanged 2 MiB parser/download bound is
checked against the production Blob, not a separately serialized test object.
The test fixture's observed Blob is 1,946,213 bytes; arbitrary unbounded external
metadata is not a universal size guarantee.

Tests cover owner early returns, validated custom-prefix reuse, actual rewrites,
selection rebuilds, native/renderer exclusion, real pointer caller propagation,
F8-off clock/sink behavior, old captures, ring wrap/reset and combined interaction
snapshots. Resource review changes only the production fingerprint; helper hashes
and existing parallel classifications are not broadened. Changed test files with
old hashes conservatively fall back to serial execution pending review.
