# Final verification and source carry

This is **combined full-run coverage and scoped recovery**, not a clean `npm run check` aggregate pass. The failed attempt is retained verbatim.

## Full attempt: 4a1ff735

Frozen source: `4a1ff7356d4bec81e33170e5f86dddf3482c8410`.

The single receipt-wrapped `npm run check` ran for **25m 01.759s**. Typecheck passed. All **436 discovered test files / 2,817 tests** ran: the reviewed C2 group passed 2,174 tests; the 78-file serial group passed 642 of 643. There were no skips, cancellations or TODOs. Exactly one case failed with `ENOSPC`, while creating synthetic compile-cache files in `tests/parity-discovery.test.mjs`. No product assertion failed. The failed test phase prevented the downstream parity/orchestration checks from running in that aggregate.

The fixture writes 15 × 714 = 10,710 tiny files. At 4 KiB allocation, file blocks alone need 43,868,160 bytes (41.84 MiB), plus directories. The preflight incorrectly budgeted from historical retained temporary size, which did not represent this transient peak. The private workspace had insufficient free capacity. Fixture count, thresholds, assertions and timeout settings were not reduced.

The failed receipt SHA-256 is `0ce49e92fd8ebf127f3259b48a78d5dd63a6203b565037cb5d60671e1782ffee`. Its source and declared inputs were unchanged after execution.

## Scoped recovery: unchanged 4a1ff735

A sandbox-reviewed, task-owned `/dev/shm` directory had about 4.9 GiB free, with a declared 128 MiB reserve. Runtime stayed Node v24.19.0 linux/x64 with empty `NODE_PATH`, `NODE_OPTIONS`, `NODE_COMPILE_CACHE` and `NODE_V8_COVERAGE`; no host or security settings changed.

- The entire unchanged `tests/parity-discovery.test.mjs` passed **8/8** through `npm run test:focus`.
- `npm run parity:check` passed.
- `npm run orchestration:check` passed.

All three receipts bind unchanged source and input hashes. The initial empty-directory cleanup found a runtime-generated Node compile cache. A separate reviewed cleanup inventoried and removed only its 444 files / 1,229,192 bytes, then verified the task directory absent in the same execution scope. Raw receipts remain retained.

## Equivalent-copy repair: b7be6c6b

Changed-file format and ESLint/accessibility passed on 4a1ff735. Additional Oxc standard lint found two `unicorn/prefer-spread` errors on the new `Uint8Array.slice()` copies. Its generic array-spread suggestion would change the return type, so `b7be6c6b76a24afd41c161f68f5f4435feb4c154` instead uses `new Uint8Array(existing)` at exactly those two returns. The only other change refreshes the independently reviewed production fingerprint.

The copy buffers are plain internally created `Uint8Array`s. Independent review accepted the same element type, copy isolation, pixel output and bounded memory behavior. On the frozen repaired source:

- Format, Oxc standard lint and ESLint/accessibility passed. Oxc warnings remain visible in the raw log; there are no errors.
- Typecheck passed.
- All **18 focused frontend tests** passed.
- All **45 complete RGBA comparisons** against the visually accepted `69d450d7` passed; explicit typed-array and mutation-isolation checks also passed.

The 436-file aggregate coverage and scoped recovery are carried through this reviewed nonfunctional repair. The aggregate was not repeated or relabeled. These are the exact verification boundaries, rather than a claim that a clean full aggregate ran on b7be6c6b.

## Canonical build and publication

The canonical Cloudflare build for frozen 4a1ff735 completed successfully:

- [GitHub check 116851493295](https://github.com/JohnDeved/populous-new-dawn/runs/116851493295)
- Build `c63142bb-7d00-4a63-84f6-fb741071b2f4`
- Version `e2ff0a92-52cb-43cd-b232-82c50d3316fe`
- Raw build-receipt SHA-256 `aafb9b05436aad5fad96bcdbc5db922d529d34cdb0b86ca016981caecf4d1fdc`

This publication changes evidence only after b7be6c6b. Final integration checks the exact published head and its canonical remote build before merge; the earlier build receipt does not pretend to attest a later commit. No duplicate local build or second full aggregate was run.

`gate-artifact-manifest.json` binds every retained receipt, raw log, runtime declaration and supplemental proof in `gate-evidence.tar.gz`. The source/head and command are in each receipt. The previous lint failure and the aggregate disk failure are preserved alongside successful recovery. No parity credit changed.
