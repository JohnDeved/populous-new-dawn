# Issue 225 independent implementation checkpoint review

2026-10-06. Base `b28b031f6917f6d814536ba10a7d46e7be71de05`;
implementation checkpoint `047f76dd08e8360deab0772d295e0326f3c5f99b`;
final reviewed head `55c684cd2c4cc80a7e06786e24f0d87f4a0a5cd5`.

**ACCEPT source implementation. Not merge-ready.** No corrective source change
is required by this review. Acceptance is limited to the four-file diff and the
retained focused portable receipts; queued gates below are not claimed to pass.

## Findings

- The only runtime change is the authored `bridgeEffect` branch in
  `app/world-turn.ts:925-927`. Its new controller is still at turn 0, so the
  existing `stepLandBridge` executes only `app/land-bridge.ts:50-66`: increment,
  endpoint/axis/direction/slope caches and return. It cannot reach trail or terrain
  callbacks on this visit. Empty callbacks therefore respect the proved boundary;
  no wrapper or broad effect-loop refactor is needed.
- Initialization occurs at reward creation after the current effect loop, so the
  next ordinary effect pass starts at controller turn 2. The generic constructor,
  controller arithmetic and `app/spell-effects-runtime.ts:1140` cast producer are
  byte-unchanged. No save migration rewrites or replays existing controllers.
- The ordinary-command component test observes the reward turn without injecting
  completion. Its separate suppressed-reward control isolates terrain/queue,
  trails and RNG assertions from other world processing. It checks all birth
  fields against the unchanged, native-proved controller and checks the first
  next-pass terrain/trail behavior, complete lifetime and one-use outcome.
- The explicitly synthetic checkpoint test changes endpoint heights only after
  birth, verifies that deferred initialization would calculate a different slope,
  saves/restores the original caches and compares the subsequent terrain pass.
  This is meaningful coverage of sampling ownership and serialization, not a claim
  about ordinary rendered terrain changes. Separate tests retain creation,
  mid-effect, completed and legacy checkpoint behavior.
- Native instrumentation preserves the existing producer/dispatch/terrain path.
  It copies activation/next-visit snapshots, records ordered trail/notification
  requests and checks no activation terrain/RNG work. Snapshots precede optional
  queue draining. Its supplied allocation/trail/notification limits are retained;
  it has not yet been executed at this candidate. The topic note correctly links
  the earlier proof and distinguishes its raw heightStep 0 from PR 191's ordinary
  captured heightStep 2.

## Receipt correspondence checked without executing tests

Read-only Python hashing and Git object/diff reads verified:

- `failure-first.json`: terminal exit 1, four expected birth-count failures;
  source/sourceAfter identical; raw stdout/stderr hashes correct. Reconstructed
  base-to-head test-only binary diff hashes to
  `c54b3e543633f38874a80a6bf18dc417395ccc24c967d948ad727fc9a4131574`.
- `after-focused.json`: terminal exit 0, 5/5 pass; source/sourceAfter identical;
  raw stdout/stderr hashes correct. Reconstructed runtime-plus-test binary diff
  hashes to `0fbee7a4d9468c50ab3b18033e6503acc5238ae44fc81fa199bb6c8a527b89ac`.
- Both receipts, preserved failure-first test and committed test have SHA-256
  `e5bd0491d4947964ca782bc6affa66f69bf0a6c8224f2d4b6de5b4e576d6e26e`.
  The after-receipt runtime hash matches the committed runtime:
  `ba7635cff5ce0576aa698167590f57806fe3531b2962f745aed423ddc4356302`.
  The preserved failure-first patch matches its receipt diff hash.
- The published proof commit `fe86aeab4dae6662d9c17a32618fd9246366d991`
  retains the exact earlier independent review, SHA-256
  `17426160be6f605c00f54eb35b1a35af92c4c0d22ea8cde44e7951bb0f0bff23`.

These are correspondence checks on real prior results, not relabeled executions
at the final commit. Native instrumentation/documentation were added afterward.
Tracked source was clean before and after review.

The writer committed a requested documentation addendum during review, advancing
047f76d to 55c684c. Its full diff was reviewed; `git diff --quiet 047f76d 55c684c
-- app scripts tests` returned exit 0. The addendum accurately states that legacy
turn-0 checkpoints initialize on their next existing visit from saved terrain;
historical birth-time terrain cannot be reconstructed. No migration is added.
Source acceptance and the runtime/test receipt correspondence extend to 55c684c.

## Remaining acceptance and quality

The changed TypeScript is direct, readable and reuses the existing native-proved
helper, with no new dependencies, unused abstraction or decompiler-style code.
`format:check`, `lint`, `lint:standard` and Fallow advisory receipts remain pending,
along with standard check/build, the generic bridge regression, updated authored
native harness and candidate ordinary rendered acceptance. No such jobs were run
or authorized for this review. Review those source-bound results before merge;
legacy quality failures must remain distinguished from introduced findings.

PR 191's accepted endpoints/final heights and checkpoints remain useful historical
evidence; they are not a new rendered observation of the changed birth boundary.
Do not infer absolute native world ticks, native mixed-class scheduling, complete
RNG consumers, pixels/audio, spell-cast behavior or Erosion parity from this change.
