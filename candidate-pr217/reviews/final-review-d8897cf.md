# Final independent review: PR217 / bounded #214 repair

Decision: **ACCEPT** exact head
`d8897cf8eeac1886d2f653af2cad0674c6bfa91a`, based on
`a53fa05587c4c1d363e3596162b41fcb9f26e3e8`.

The bounded native-backed ordinary-person/Splash logical-animation correction is
ready for the coordinator's authorized integration. No blocking findings remain.
This acceptance does not close all of #214 or claim every sprite family now has
native timing. The full source, test-only correction and final style delta were
reviewed in the preceding source-review, test-delta-review and style-review
artifacts. Final tracked source remains clean and unchanged.

## Gates and source binding

Verified the final terminal index SHA256
`79aaeb91188c64627e38524c81c953b7390d9ef3c7fff7d9ddc4ddd302a251bf`, its
indexed receipt hashes, before/after source equality, recorded lock hashes and
raw stdout/stderr streams. Fresh d8897cf build, typecheck, 12 focused lifecycle
tests, formatting of all four changed app files and ESLint of the six changed
tests passed. The subsequently supplied `style-eslint-app.json` also passes with
zero diagnostics on all four changed TypeScript app files; its SHA256 is
`f369944f5a9b4eb33bb85da7387d960e63a9a07d751a7cc90eb09e7c0f0499b3`.

The 1,126 tests plus parity/orchestration results from 3123edf are carried under
the explicit style-equivalence decision, not presented as a fresh full d8897cf
run. The 168-snapshot actual-adapter/native comparison is likewise carried under
that reviewed boundary. Its supplied poses, supplied smoke records, intercepted
original processor bodies and differing adapter/native stamp identities remain
explicit. No extra original full-game or wall-clock proof was inferred.

Oxlint still exits 1. I independently compared normalized file/rule/message/
severity multisets against the actual a53 source: the same 37 errors and 21
warnings remain, with no introduced or removed diagnostics. This is accepted
existing debt, not a clean-lint claim. Fallow health exits 0 but reports 1,893
above-threshold findings; it remains advisory, not a health acceptance result.
Existing build/browser warnings are retained in raw receipts; no warnings were
suppressed to manufacture a clean result.

## Planner selection

The exact frozen planner selects **97**, not 74, checks: 21 portable/repository,
41 native, 32 browser, two static and one build. Verified all IDs, commands and
kinds against `planner-dispositions.json`, SHA256
`be122eecc725a55b79a184baf64f26e3df0be07740c6a599c0bda09d5d18dc42`.
The one build is fresh; the 21 portable/repository checks are included in the
reviewed full-check carry; the 75 separate native/browser/static commands are
explicitly not run for this bounded change. Their broad shared-file mappings do
not require rerunning unrelated campaign, assets, camera and controller probes.
The affected animation branch is covered by retained native comparison, full
portable regressions and the ordinary candidate capture below. Planning-time
missing-environment labels are not reported as attempted failures or unavailable
inputs. All six unknown changed paths have explicit reviewed dispositions.

The existing portable legacy/current restore and new-Scene-clock checks satisfy
this patch's restoration boundary. Storage operations and formats are unchanged;
no extra browser Save/reload/Load row is required.

## Ordinary candidate and negative control

Inspected the frozen passive observer `cb57bd7076cedb08b042b6f8ad843b088fc613ae6863f3fed3742944eb88a060`
and offline analyzer `3aaf2a16871eccbb381dd849bac1ce9a020e95be8c5865f0c1cdc4394106c93d`.
The observer enters ordinary Mission 1 and uses public pause/resume/settings
controls; it does not mutate world state, clocks, owners, rendering or controller
callbacks. Owner identities are local to each segment. The analyzer distinguishes
stable per-owner animation from source/object/draw/state/flag boundaries and
requires real natural walking, positive logical cadence at both speeds, extra
presentation visits at 1x, and an ordinary changing smoke control.

The identical analyzer fails the a53 negative control for the intended defects:
2,079 missing-gate samples, 95 same-turn advances, 164 Shaman-cadence mismatches
and 1,430 stamp mismatches. It reports no frame/draw/UV, pause, presentation-clock
or smoke mismatch in that control. Thus acceptance is not based on a predicate
that also passes the known defect.

The clean d8897cf candidate passes with zero failures and no inconclusive clauses:

- 284 stable logical-owner pairs with extra presentation visits in the same turn
  retain their frames/stamps; 1,544 completed-turn stamp pairs match World.turn.
- 227 positive-turn, unaliased Shaman cadence pairs cover both 1x and 2x. The
  presentation clock retains 24 visits per elapsed second, including fractional
  remainders; it is not halved globally.
- 2,480 native frame/draw samples and 4,960 visible piece-UV samples match the
  unchanged source sprite data. Twenty-two natural native-backed walking samples
  were observed.
- Public/settings pauses freeze poses, rendered frames, UVs and clocks; shipped
  1x/2x changes and resume behave as expected.
- Ordinary partial hut smoke retains its separate clock and 447 checked UV
  samples match. Sixteen distinct smoke UVs occur in active segments.

Raw observations SHA256:
`cd988093a996f8e03a7e44b0127b0f41319418f447cebb029259982ba40bc906`.
Offline attribution SHA256:
`b91910c036ab6cb135e4fd6d54cf53c2160457b06752503260e60f39c801a13f`.
I checked their identities and totals against the raw artifact, inspected the
candidate opening and 2x screenshots and the baseline opening screenshot, and
found no new visible sprite/layout corruption. Static images corroborate rendered
appearance; the raw frame sequence establishes cadence. The observer's exclusion
counter also includes absent native-source endpoints, so it is not a count of
actual ownership swaps.

The run uses sandboxed Chrome Headless Shell 154.0.8037.92, SwiftShader, 1440x1000
viewport, DPR 1 and a 1240x1000 game canvas. These are functional rendered checks,
not achieved hardware-FPS measurements. Sparse RAF samples can miss intermediate
visits or whole cycles. No ordinary Splash, full hut smoke or damage-smoke sample
occurred; those absent families are not claimed as browser-verified here. Splash
remains supported by the accepted producer/adapter comparison and portable
allocation/lifetime tests. Ordinary fallback artwork and Stone Head timing remain
outside the repair.

## Cleanup and final boundary

Verified the outer, inner and launcher receipt hashes, stable source/input
fingerprints, terminal session 81430 exit 0, browser close/disconnect path in the
unchanged harness, and recorded IPv4/IPv6 listener closure on the owned port.
The launcher confirms dependencies were not moved and owned resources were
released. The reviewer launched no duplicate heavy, browser or native work.

Accept this bounded correction with its before/after artifacts and retained
limitations. Keep the broader sprite report, fallback Firewarrior lead, unproved
families and historical/hardware timing claims open. No source edits or further
gate reruns are requested for this exact accepted head. No resources are held.
