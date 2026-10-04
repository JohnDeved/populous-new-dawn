# Mission 4 profile readback repair review

Source: `dc71b3b8285d9d02bbc73b2e6bda478f41c8f429` against accepted base `f78e5c17757ce061b8b159da150536ee690e6b6f`.
PR: https://github.com/JohnDeved/populous-new-dawn/pull/202 (Refs #88).

## Independent review: ACCEPT

The fresh reviewer inspected the full two-file diff, reproduced the 13 focused tests, checked original failure-first evidence, verified installed Playwright 1.63.0's Promise-truthiness loop, and independently validated every final source/receipt/raw-log hash, the exact full aggregate, build correspondence and inherited lint comparison. No findings remain on this source.

- Failure-first: 7/8 new tests fail on original maintained source; the rejected-open test already passed.
- Exact candidate focused regression: 13/13 passed.
- Exact candidate `npm run check`: passed; typecheck, 1,025/1,025 tests, parity and orchestration validation.
- Syntax and diff checks passed.
- Planner retains both explicitly unmapped paths and conservative repository-check, satisfied by the exact aggregate above.
- Build: carried passed result from `6b6eb684f4f010420a758cfe4fd481b6dfca9545`, not rerun. All 13 production input objects and root/installed locks match; original stable receipt and full raw streams were checked.
- Scoped ESLint: failed on exactly three existing `no-empty` catches at checker 39/68/72. Original base source reproduces the same three errors at 38/67/71; the single new import explains the offset. No new or test-file findings; failed receipts are preserved. No maintained TypeScript changed, so its separate formatter/Oxlint/Fallow workflow is not applicable.
- Browser rerun: not run. Reviewer accepts this bounded host-polling fix without another complete natural Mission 4 route. A future claim that the corrected checker passed end-to-end requires an exact-source run.

The existing helper now awaits at most 300 sequential profile reads with 299 pauses of 100ms. That is 29.9s deliberate pauses plus awaited read latency, not a hard wall-clock limit. Every opened database closes in `finally`, including missing-store/read-error/transaction-throw paths. Only literal `true` releases the guard. The unchanged contract is profile version 1 with numeric Mission 4 in `completed`.

The actual helper invocation and later RAF release, Mission 5 continuation, reload, and exact “Mission 4, completed” UI assertion are unchanged. The old local guard was unsound, but its later independent reload already proved persistence; prior Mission 4 success is not invalidated. No gameplay, route, timing, generated, parity or hosting files changed.

## Evidence and publication

`raw-proof/manifest.json` binds the source diff, both changed files and all 12 copied receipts. Command receipts embed the actual stdout/stderr and their original hashes; source-path redaction of copies is explicit in the manifest. Original raw receipts remain in the isolated source worktree.

The first bundle export was rejected because the dependency-transfer metadata used a scanner-reserved permission-text key. A bounded publication derivative omits that field, records the original receipt hash and explains the omission. The original transfer receipt remains intact. The regenerated bundle passed the normal secret scanner; no credential or dependency content is published.

All commands are terminal and the heavy lane was released before packaging. The exclusively moved dependency tree is idle and reserved for coordinated onward transfer. Source head remains frozen; this evidence branch does not imply a main merge.
