# Independent authored Land Bridge initialization review

2026-10-06. Reviewed source: clean `b28b031f6917f6d814536ba10a7d46e7be71de05`.
Decision: **ACCEPT the bounded authored-adapter initialization gap.** This is an
evidence classification, not approval of an implementation or a broader timing claim.

The authored native producer calls `004ed700` at `004fbb82`, reaches
`0050a750 → 0050ee00`, and returns an initialized turn-1 controller. The live
`bridgeEffect` reward branch at `app/world-turn.ts:918-927` creates a raw turn-0
controller after the effect loop (`:807-850`) and performs no corresponding visit.
That missing producer-owned initialization is a source-supported composition gap,
not merely two samples taken at differently named observation points. The existing
controller arithmetic is not defective: its first two visits match the original.

## Exact supported result

- Mission 2 head record 59 links only record 60 through token 61. Original decoding
  supplies endpoints `(47872,24832) → (51968,24832)`; the probe does not inject them.
- Native reward return has processing state 25 and controller state
  `turn=1, alongY=false, startCell=24762, endCell=24778, direction=2,
  crossStep=0, heightStep=0, raiseWater=true`. Port creation instead leaves turn,
  cells, direction and increments at zero. The port's default `raiseWater=true`
  versus the native template's false value is a pre-initialization representation
  difference, not a separately established gameplay defect.
- Native initialization has no terrain-height changes, trail requests, terrain
  queue calls or height notifications. The next explicit dispatch reaches turn 2:
  36 ordered trail requests, 36 ordered queue/notification pairs, and 28 actual
  height changes, each 0→1. Eight notified vertices have no numerical height change.
- Corresponding port visits agree on all compared controller fields, all 16,384
  heights, ordered trail positions, changed-cell callbacks and height deltas.
- Both supplied RNG seeds remain unchanged only within the intercepted component.
  Real model-3 trail initialization is excluded and independently consumes a
  cosmetic draw. Reward allocation also requests sounds 171 and 41 at intercepted
  leaves; absence of controller terrain work does not mean silent activation.

## Provenance and prior acceptance

Read-only integrity checks verified all 18 receipt inputs and all 17 observation
inputs against present bytes, source/sourceAfter agreement, terminal stdout/stderr
hashes, the reported state/event comparisons, and **all 6,872 instruction records
against the canonical EXE's PE-section bytes**, with zero mismatches. Detailed
checks and artifact hashes are in `independent-review.json`. No native execution,
browser, package job, Ghidra export, or application edit was performed for review.

The retained instruction array begins with the producer invocation and ends after
the next explicit dispatch. Setup executes record decoding before the array is
cleared; the array therefore does not retain decoder/setup instruction history.
The hash-bound bootstrap and the prior authored proof support that setup. Scratch
allocation-thunk instructions and intercepted entry bodies are explicitly excluded.

PR 191 evidence was read from immutable evidence commit
`cfdf764631ab42173b0b4191abdbdd3c34d0d1e5`, under
`references/verification/authored-bridge-origin-2026-10-04/`. It binds runtime
`4170e24f91026b9b3fce69ff3a49c0242f9896ef`, rendered source `30e671e8...`, and the
same EXE/DAT identities. Its authored harness already asserts immediate native
turn 1; its portable ordinary-worship test explicitly expects port turn 0.
The controller, authored harness/test, topic note and reward branch are unchanged
at the reviewed main. Prior native/browser acceptance compares endpoints and all
final heights, with separate checkpoint evidence, and explicitly excludes per-turn
browser/native timing. It remains valid within that scope.

PR 191's captured ordinary terrain gives `heightStep=2` at observed controller turn
12, whereas this raw-DAT/zero-flags input gives 0. Its captured initial terrain hash
is `01f4ad1948cc30123d8ed0bf2bb28bb2294f272a8faaa2ca1a286559c7067b7c`.
Do not present this new raw-input first terrain pass as the ordinary rendered pass.

## Smallest justified next scope

If assigned for implementation, limit runtime work to initialization at the
authored `bridgeEffect` reward boundary, using the already-matching controller's
first visit. Cover complete creation-return state with no terrain/trail/RNG work,
the next visit's first terrain pass, one-use behavior and checkpoint continuation
in the authored integration test. Preserve the raw constructor and spell-cast
producer behavior unless separately proved. Retain/promote the two-visit native
evidence in the authored harness/topic note; no broad effect-loop refactor is
justified by this finding.

This review establishes neither an absolute one-world-turn visual delay nor native
mixed-class scheduling, ordinary native worship progression, full-world RNG,
terrain-notification consumers, pixels, audio execution, or spell-cast behavior.
Any such claim needs its own synchronized ordinary/native evidence. Erosion
findings are not evidence for this bridge boundary. TypeScript quality, check/build,
browser and performance gates are not applicable to this source-only review; they
remain required as appropriate for a later code change. No new parity claim.
