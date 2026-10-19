# Original Game options: bounded validation

> Historical run artifacts referenced below are [retained at the pre-cleanup commit](https://github.com/JohnDeved/populous-new-dawn/tree/bc9cabf404240ad99b2aab8c26e9b0137cdd7702/evidence/game-options-20261016), not in the current checkout. Source probes, fixtures, and findings remain tracked where applicable.

Issue [#457](https://github.com/JohnDeved/populous-new-dawn/issues/457),
PR [#467](https://github.com/JohnDeved/populous-new-dawn/pull/467).
Base: `04a84dab17c809d1888e5a734e99d34addfc5a1d`.
Final application/test candidate: `774af5cd968935603f61bfed3ab5ec750e25eac6`.
`tested-source.json` pins changed files and application/public/test trees.
The evidence publication itself changes no application, test, dependency or harness.

## Delivered slice

- All five original Game rows occupy reference x=320 and y=139/169/199/229/259
  in frontend and in-game Options. Rotation and Flip Rotation work through the
  existing keyboard camera command. The other three rows are explicitly unavailable.
- Browser-local versioned preferences keep Cursor/No compatibility defaults,
  retain stable focused buttons and update an existing scene without replacing it.
  They stay outside checkpoints and campaign/world state. Current values are read
  after asynchronous construction of a new scene; this ownership is source-reviewed.
- Help follows the actual keyboard remapping. No new selection, spell or AI rules.
  Static native findings, uncertainties and provenance are in
  [the retained research](../../decomp/research/game-options-static/findings.md).
  Native installed defaults, persistence and full native settings parity are not claimed.

## Executed checks

- At `d81ccc6f`, all **432 tracked test files** ran exactly once in 44 durable serial
  batches: **2,784/2,785 tests passed**, one failed, no skipped/cancelled/todo tests.
  Original batch 28 failed the unchanged performance-queue test "failed and timed-out
  jobs release before automatic next job" while waiting for a following job.
  Its failed receipt is preserved. One separately named, identical whole-batch
  diagnostic passed **49/49** on the same head, without timeout/assertion changes.
  This does not turn the original full inventory into a pass or prove its cause.
- `774af5cd` changes only eight application lines from that tested head: nested
  category rendering becomes three mutually exclusive JSX guards. Inner subtrees,
  props, handlers, IDs and all preference/camera/scene code are unchanged. It also
  adds two research-index links. The reviewer inspected this carry-forward boundary.
- Fresh `774af5cd` affected tests: **66/66 passed**, covering preferences, actual
  navigation caller, original rows/shadows, audio, modal ownership and orchestration.
  Typecheck, parity, orchestration, focused formatting and new-module ESLint passed.
  The complete 432-file inventory was not repeated for this mechanical local repair.
- Global format, ESLint, Oxlint and unused checks remain **failed**. Format retains
  the sole `viewport-bounds.ts` finding. All 400 ESLint and 1,434 Oxlint diagnostic
  identities match the baseline; the two earlier added ternary warnings are repaired.
  Fallow health/dupes exit 0 but have new advisory deltas: +7 threshold findings,
  +1 medium target, +1 clone group/family, and 8 fewer duplicated lines. Hidden
  findings in truncated reports are not asserted identical. See
  [the independent quality comparison](quality-attribution.md).

These are source-bound constituent checks, not a claim that a single monolithic
`npm run check` or all quality gates passed. The 249-file validation archive retains
all command receipts, stdout/stderr, manifests, independent audits, baseline quality
receipts, runner versions, source patches and source hashes.

## Rendered application evidence

The fixture imports actual `app/page.tsx` and production global CSS through a plain
React/Vite entry. Production preference ownership, store, GameScene, async creation
and DOM keyboard listeners are exercised unchanged. It avoids the unavailable full
framework bootstrap; it does not substitute a fake scene or copied callback owner.
Browser: Chrome Headless Shell 154.0.8037.92, sandboxed SwiftShader software renderer.

At `580df36b`, recorded passing groups prove frontend button focus/reload, ordinary
Mission 1 creation with restored preferences, in-game Options changes preserving
exact world/scene identities and modal freeze, dynamic help, and **20 real DOM key
camera cases** across Rotation/Flip/Ctrl. Actual caller tests cover the wider alias,
Shift, overview and gate matrix. All 1,105 runtime/assets were hash-checked.
The long episode nevertheless ends **failed** on Restart Level; its completed
passing groups are not presented as a successful whole episode.

A separate startup episode passed native 640 layout and storage-write denial.
At final `774af5cd`, a fresh short startup episode passed all four mutually exclusive
categories, Game roundtrip/value/reload, repeated Enter/Space same-node focus, exact
640 row positions and the readable session-only storage notice. Only
`original-options.tsx` differs among the 1,105 prior runtime inputs. The
[source relationship](https://github.com/JohnDeved/populous-new-dawn/blob/bc9cabf404240ad99b2aab8c26e9b0137cdd7702/evidence/game-options-20261016/browser-source-relationship.json) records the explicit
rendering-only carry-forward for earlier in-game evidence.

Screenshots are **after** captures, not invented before/after comparisons:

- [Frontend, 640×480](https://github.com/JohnDeved/populous-new-dawn/blob/bc9cabf404240ad99b2aab8c26e9b0137cdd7702/evidence/game-options-20261016/frontend-game-640x480.png): final repaired candidate.
- [Storage-write failure, 640×480](https://github.com/JohnDeved/populous-new-dawn/blob/bc9cabf404240ad99b2aab8c26e9b0137cdd7702/evidence/game-options-20261016/frontend-game-storage-failure-640x480.png): final candidate.
- [Frontend, 1280×960](https://github.com/JohnDeved/populous-new-dawn/blob/bc9cabf404240ad99b2aab8c26e9b0137cdd7702/evidence/game-options-20261016/frontend-game-1280x960.png): prior runtime, carried across reviewed guards.
- [In-game, 1280×960](https://github.com/JohnDeved/populous-new-dawn/blob/bc9cabf404240ad99b2aab8c26e9b0137cdd7702/evidence/game-options-20261016/ingame-game-1280x960.png): prior runtime, carried across reviewed guards.

## Production build and explicit limits

The exact `774af5cd` canonical Workers build completed **SUCCESS** at
2026-10-16 01:12:47 UTC; [build details](https://dash.cloudflare.com/19321bcee0ed17a93b709cb602dd070c/workers/services/view/populous-new-dawn/production/builds/8cd4151c-79c7-407a-98c4-f429f50edf8d).
[The fresh PR commit/check record](https://github.com/JohnDeved/populous-new-dawn/blob/bc9cabf404240ad99b2aab8c26e9b0137cdd7702/evidence/game-options-20261016/canonical-build-774af5cd.json) is retained.
The documented production command is `npm run build:cloudflare`, chaining full
`vinext build`. The remote phase log/live dashboard configuration was not captured.
No local ordinary build pass or deployed-browser validation follows from this check.

**Restart/replacement continuity remains blocked and unverified.** The long actual
Home run and one fresh short restart-only episode both crashed Chrome after ordinary
Restart Level confirmation, before a replacement canvas appeared. Cause is unknown;
no further restart retry was made. Checkpoint-load/next-mission preference continuity
is not browser-verified. Source/ref reasoning is not a replacement runtime witness.

Earlier local integrated startup SIGKILLs and remote browser certificate failure
remain limitations; that route was not repeated or bypassed. This packet makes no
full Vinext/RSC hydration, deployed TLS, hardware performance, native execution,
original full-frame raster parity, battlefield DPR2/ultrawide, new fallback-art or
matching base-Game before-screenshot claim. No campaign/AI rule change or full #457
closure is implied.

## Plan review and evidence transport

The actual-base orchestration plan is retained in the validation archive. Its
cross-cutting `scene.ts`/Page ownership routes conservatively into many unrelated
subsystems; those commands are not silently marked passed. Native probes were not
run (static-only scope; no original executable execution authorized here). Unchanged
campaign/construction/transport/native rendering probes are outside this bounded
input/UI slice. Browser helper coverage is the explicit actual-Home route above.
Portable tests selected by that broad routing are included in the complete test
inventory where they are tracked test files; no unrelated CLI/native probe pass is
inferred from that fact.

The plan's unknown preference/UI/test/research/docs paths were explicitly inspected:
they are the new preference module, OriginalOptions UI/style, their focused tests,
static getter/setter evidence and the preference document. They are covered by the
focused source/unit/rendered review above, not an empty unknown-path check set.
The evidence-only final paths are receipts, images, archives and explanatory text.

`actual-home-580df36b.tar.gz` preserves the full earlier browser packet, including
initial readiness failure and both restart crashes. `startup-repair-774af5cd.tar.gz`
preserves the final source-bound startup scenario, entry, manifest and images.
`validation-774af5cd.tar.gz` preserves checks and independent audits. `SHA256SUMS`
checks transport integrity; manifests inside each packet identify raw inputs/files.
Absolute receipt paths describe the original executor, not portable current paths.
No credentials, browser profiles, dependency caches or original executable are included.
Root owns final review and merge.
