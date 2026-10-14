# Authored shrine command requirements

## Change and source

PR435, base `9c2cf2ef41163c7f73bc986ce0003dd667d2fcdd`.
Final runtime `bc6230b98fe623548c42d84b6401c2a6a5cb2400`.
Only the successful shrine command's feedback string changes in
`app/live-command.ts`. Multi-follower heads use authored `required`; singular
heads retain singular copy; mode3 identifies the Shaman requirement, matching
`app/live-worship.ts`. Vault's separately queued command behavior remains intact.
Admission, movement, worship counts, rewards and simulation are unchanged.

## Reproduction

The genuine M14 public browser route on `3cb8647df588a177f12428e8806ab48770cb1e6e`
(runtime identical to base) selected original followers and clicked Earthquake
Head47 at(-61,-53). Authored requirement6 appeared with the incorrect toast
“One follower is enough.” The before image and public dispatch are committed in
PR434 at `references/verification/m14-linked-head-browser-2026-10-14/run/`.
Before image SHA256 `abf76ad1671fbc85d55edaf41e8054be0069320c5514408d8619de744e2ca85f`.

## Tests and qualifications

- Four focused presentation tests cover authored M14 six/five, M16 six, M5
  effect-head six, M1 singular, M15 Shaman-only and unchanged M1 Vault queued
  feedback. Supplied approach positions isolate feedback; they are not earned
  acquisition evidence. Person-worship and worship-panel tests also pass.
- Full `npm run check` on initial runtime `0b0eddde` failed honestly:2607/2609
  passed. Both failures are unchanged foreground timeout fixtures: expected
  exit0 observed null; expected SIGKILL observed SIGTERM. One isolated complete
  foreground file passed9/9. These results are consistent with child scheduling
  before signal handlers initialize; they are not a green aggregate claim.
  Exact fixture, queue and package hashes match base/final. No retry loop or
  assertion changes were used.
- Aggregate typecheck passed. Parity and orchestration checks, skipped by the
  failing `&&` aggregate, subsequently passed in separate receipts.
- Initial nested ternary introduced three Oxlint warnings. Replaced by identical
  ordered if/else at `bc6230b9`; independent review accepted source correspondence
  and no second full suite for this expression-only repair.
- On final runtime, focused worship tests, typecheck, changed-file ESLint,
  formatting and production build all pass. Full-app Oxlint1408 baseline versus
  final1408: exact normalized diagnostic multiset unchanged. Its raw nonzero
  baseline status remains advisory, not called clean. Fallow health completed
  successfully as an advisory on initial runtime.
- Broad path-based plan suggested unrelated vehicle native/emulator checks;
  not applicable to a message-only branch. No original executable executed or
  emulated. No hardware performance or new native gameplay parity claim.

## Preserved unsuccessful evidence

Baseline feedback regressions, intermediate supplied-fixture mistakes, initial
full aggregate, initial introduced Oxlint findings, ignored-path lint-comparison
setup failure, and first rendered-prefix locator timeout are retained. The first
browser locator did not account for the decorative toast span; corrected QA
uses actual world-message equality plus the visible `.world-message` container.

## Review

Final-source ordinary browser prefix passed on `bc6230b9`, public M14 startup,
original follower selection and actual Head47 command. World-message equality
and rendered `.world-message` both show “6 followers are required.” Screenshot
bracket774–797, no browser errors, source unchanged through terminal receipt.
The browser used an official sandboxed headless executable and software WebGL;
this is rendered feedback evidence, not hardware performance. Browser warnings
and the failed first selector attempt remain in raw receipts. Owned browser and
server terminated before evidence was packaged.

Independent reviewer `review_browser_checkpoint` accepted the runtime shape and
flat-expression correspondence. Exact evidence-only head acceptance is required
before merge. Receipts retain their original absolute artifact paths; their
stdout/stderr files are copied alongside each receipt under `gates/` and browser
files under `browser/`. File hashes in the manifest bind these portable copies.
