# Verified HUD texture readiness repair

[PR #201](https://github.com/JohnDeved/populous-new-dawn/pull/201) repairs three
async HUD image gates and was merged after independent final ACCEPT. This packet
preserves the bounded raw evidence; it introduces no game or checker changes.

- Tested head: `40632c29305d928ee17d48b6e25f6127c71702c7`
- Accepted comparison base: `139ec7dec8fc77462a9bbf8a5fc09ad7b9bb9d31`
- Merged main: `f78e5c17757ce061b8b159da150536ee690e6b6f`
- Tested and merged tree: `1b0070d730d9ec73e6fef0f2d59d20f9b39686f5`
- Narrow acceptance: [issue #200](https://github.com/JohnDeved/populous-new-dawn/issues/200)

The building-menu, building-hover, and live-worship checkers now await actual
current-document HUD texture observations sequentially and require literal true.
Image type, completion, positive width, and nominal 30/20-second budgets are
preserved. The helper cannot interrupt a pending page.evaluate: a late settled
result fails, but a stalled import needs settlement or the owning browser to close.
No persistent page-function aliases or runtime changes were introduced.

## Acceptance and claims

[Final review](final-review.md) accepts the exact frozen source and evidence.
The [full patch](full-40632c2.diff) and [final source snapshots](final-source/)
make the six-file change portable; all six files are unchanged from the accepted
checker preflight. The historical [handoff](final-handoff-40632c2.md) describes
receipts and limits before final acceptance; the final review supersedes its
pending-review wording.

- [Full check receipt](receipts/check-final-40632c2.json): 1,017/1,017 tests,
  typecheck, parity, and structure pass on the tested head. Raw streams accompany
  each receipt in its `.json.artifacts/` directory.
- [Browser command](receipts/browser-command-40632c2-run01.json),
  [terminal harness receipt](browser/receipt.json), and
  [actual samples](browser/hud-texture-readiness.json): four literal-true gates
  across two ordinary Mission 1 documents with distinct timeOrigins, playing
  worlds, attached intact WebGL2 canvases, and stable source/scenario/helper hashes.
  Chrome Headless Shell 154.0.8037.92 used sandboxed ANGLE/SwiftShader. There were
  no browser errors. Software-WebGL fallback, ReadPixels stalls, and missing-image
  warnings are retained verbatim. All four first observations were true; no
  real-browser false-to-true transition is claimed.
- [Focused tests](receipts/focused-40632c2.json): all 20 pass. Maintained caller
  gates, real helper and predicate execute with fake module/document/clock
  boundaries for delay, exhaustion, error, literal readiness, repeated document
  acquisition, non-overlap, and deadline-limit coverage.
- [Failure-first receipt](receipts/failure-first.json): original gates fail eight
  expected cases (9 pass) because the first false observation can continue and
  exhausted false does not reject. The initial 17-test file was reconstructed by
  reversing the three documented later additions, then its exact bytes were
  checked against the original recorded SHA256 before retention. The helper
  matches its original receipt; all three baseline callers come from the recorded
  immutable base. [Input manifest](failure-first-source-manifest.json) and
  [exact recovered inputs](failure-first-inputs/) retain the evidence. No rerun or
  invented result is substituted for the original receipt.
- [Build correspondence](build-correspondence-40632c2.json): the passed production
  build at `6b6eb684f4f010420a758cfe4fd481b6dfca9545` is carried through equality of
  all 13 production input objects, root/private installed locks, and original raw
  stream hashes. [Original build receipt](carried-build/build-final-6b6eb68.json)
  and streams are included. No new build is claimed.
- [Scoped lint](receipts/lint-40632c2.json) retains three existing empty-catch
  findings in building hover. [Accepted-main baseline](receipts/lint-baseline-hover.json)
  reproduces them; the [other five files](receipts/lint-other-five-40632c2.json)
  pass. TypeScript-specific quality checks do not apply to this MJS-only change.
- [Terminal release](terminal-release-40632c2.json) records the successful outer
  command and the maintained harness cleanup path. It does not claim an
  independent machine-wide process/port census.

This proves the bounded readiness repair and actual helper use after reload.
The three full historical building/worship gameplay routes were not rerun. This
is not screenshot, full visual-parity, gameplay-completion, native-equivalence,
or hardware-GPU performance evidence. Broader release/campaign issues remain open.

## Packet integrity

`manifest.json` hashes every packet file except itself and records original-file
correspondence, tested/merged identity, and exclusion boundaries. `receipts/`,
`browser/`, `carried-build/`, and `dependency-transfer/` preserve source files
without rewriting their original local paths or raw streams. The manifest maps
those original paths to their portable copies. No dependencies, binaries, browser
profiles, compile caches, credentials, screenshots, or unrelated artifacts are
included. This evidence-only branch is not a new source or validation run.
