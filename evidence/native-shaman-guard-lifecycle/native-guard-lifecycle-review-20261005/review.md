# Independent review: bounded original Guard-command30 composition

**ACCEPT the bounded native evidence. REJECT whole Guard gameplay, physically
stopped Guard, continuous idle-phase, or browser parity claims from this packet.**
This is a research review, with no runtime implementation or publication.

Reviewed on clean main `3b899125cc8cedef938823718ad5d44f49957b66`, tree
`5228a79f26b90d3daeffe65498c01ada077ba132`, on 2026-10-05 UTC. The
[frozen probe](../native-guard-lifecycle-20261005/probe-guard-lifecycle.py) is
SHA256 `7f6ad6a478db9138af4b5ff3d69b612969c5dcc8365ec324309d18771ec77064`.
Independent [replay](replay.json) passes all 11 cases/64 steps and is byte-identical
to author attempt-04: SHA256
`7c7d6eff380665b6240822b29e38e9eff47de1c1a4c8855b58b4b5c71bde3711`.
[stderr](replay.stderr) is empty, SHA256
`e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855`.

Final [findings](../native-guard-lifecycle-20261005/findings.md), SHA256
`32e27423b6accdc8571e90dae2433b7da0fc237b82f3a1b1d0a89a5cc0ceaaec`, are consistent
with this bounded acceptance. The [lifecycle receipt](../native-guard-lifecycle-20261005/receipt.json)
is `a1cbf6007b407c503da6c7181f92fe00d2b318e516d0dee352ceac604132f21e`;
[distance receipt](../native-guard-lifecycle-20261005/distance-receipt.json) is
`a9baca62764e0e69da7208c25284e1e0a78e917c7e25b31be303d1b93cfcc91a`.
All receipt source hashes match, relevant paths are unchanged from research-start
main `3cc9e830d2e7d2aa9844e8104fa51017d65dd171`, and local artifact links resolve.

## Verified behavior and ownership

- G's actual `00443b40` producer allocates/prepares command30 targeted at the
  tribe Shaman, clears previous orders, and attaches the new order. Repeating G
  with a selected follower replaces it; it does not toggle it off. G itself
  leaves this person's source48/f1/f2 unchanged. With no selected non-Shaman,
  cancellation traverses the tribe roster **only for state10/status30 people**;
  a still-state19 queued command30 survives. Shaman-only selection qualifies for
  cancellation. The native retain-selection argument is honored. The accepted
  [input probe](../../../scripts/check-native-follower-task-adapters.py) supplies
  the separately established G→action0xc1→tribe0x82 link; this new replay calls the
  producer directly, rather than replaying an OS/key transport loop.
- The real `004d42a0` preparation enters state10, runs command setup, assigns
  target73/status30, and increments the guard count. Its state animation setter
  already selects source40/draw18 and resets f1 to0. f2=3 survives the four-frame
  walk source, while f2=5 clamps to0. First guard dispatch calls the genuine
  recovery/setter chain again. These are existing-person mutations, not an
  animation-person replacement or an unconditional f2 reset.
- The actual tribe-command0x7b Ctrl-click deselect changes only selection/flags3
  bytes in the full 256-byte person record; counters, queue and source remain
  unchanged. It does not select source64 or idle source48. The near-target guard
  visit retains command30 and clears pursuit, without a setter or source change.
  Supplied eligible stamps produce the real descriptor18 two-visit frame hold.
- Death flag, class0, and target vehicle occupancy each remove command30, release
  the pool reference and guard count, and return next-state17. A separate actual
  state10 switch body at `004d3519` runs through the common native transition to
  `004d3b1c`, including genuine state17/state19 initializers and source setters.
  Under this fixture, both target loss and G cancellation reach state19/source48,
  resetting arbitrary f1=1 to0 while preserving f2=3. Final speed is **65**, and
  no `004d4ee0` stop event occurs: this is idle-artwork re-entry, not proof of a
  physically stopped follower.

## Genuine functions versus supplied conditions

The only intercepted callable leaves are destination planning `004e9d80` (copies
coordinates into goal/destination fields), selection UI `0047a550`, and voice
`0048a050`. Allocation, queue preparation/clear/attach/remove/advance, guard,
selection writes, resting collision, initializers and animation setters execute
original instructions. The case9/common-transition entry's ESI/stack contract and
its native bytes were independently inspected; the next state is not applied by
Python.

Nevertheless, the person/tribe/object pool, terrain/index data, phase seeds and
animation stamps are supplied. Formation/footprint effects are disabled by fixture
flags. Frame counts are decoded from original animation files and installed by
the harness. The final segment skips the class processor preamble, including
physics, and stops before its ordinary tail. Destination planning is consequential
to when state17 reaches19. The packet proves conditional controller/setter
composition, not natural arrival, stop timing, scheduling, combat interruption,
complete world-edge movement, OS rendering or wall-clock cadence.

All five retained `.asm` files match the pinned EXE instruction bytes. Fifteen
relevant generated exports, including `004d32b0`, `004d2740`, `00432590`,
`004d6f90`, `004d7330`, `004d4040` and `004ee700`, match `decomp/exports.json`.
Executable SHA256 is
`3a5065c7420b3fcde208bf220bc86dfbac95e025ab2492caf9c7ea5308dfbe4f`.
Exact constant/animation/imported-table/helper input hashes are in the replay.
Python3.12.14, Unicorn2.1.4, Capstone5.0.7 were used. No Ghidra write occurred.

## Port mismatch and implementation boundary

[guardShaman](../../../app/live-command.ts#L202) toggles selected legacy guard
and does nothing with no selected follower. Its empty-order state10/status0 can
lose [native animation ownership](../../../app/selection-runtime.ts#L40), while
the [legacy guard loop](../../../app/world-turn.ts#L1503) prevents ordinary
resting adoption near the Shaman. This differs materially from the proved original
command30 ownership. A renderer-only phase policy cannot establish original Guard
parity from that legacy interval.

The proof is sufficient to choose a bounded future on-foot G→existing native30
queue/controller correction, preserving the same person, native setters,
selection behavior, replacement and active-guard cancellation rules. Before
enabling that producer, close shared-order ownership, allocation exhaustion,
selected-roster exclusions and current-controller handoff. Native allocation0
does not preserve existing orders by an early return; generic `appendLiveOrders`
is not automatically equivalent. Keep a separate policy for old `Unit.guard`
saves, whose target and original phase history are absent. Two existing adapter
boundaries also need explicit handling before claiming the proved cases:

1. [shamanGuardTarget](../../../app/live-movement.ts#L679) omits `person.vehicle`.
   [Boarding](../../../app/live-vehicles.ts#L82) sets that field without setting
   `unit.inside`; the original vehicle-exit case therefore is not covered by the
   current target predicate.
2. [stepShamanGuard](../../../app/live-movement.ts#L645) wraps coordinate
   differences through signed16, whereas `0043daa0` subtracts separately sign-
   extended coordinates. The separately reviewed
   [distance companion](../native-guard-lifecycle-20261005/probe-guard-distance.py)
   executes 28 original-native cases: strict near distance <824, destination
   replanning >=440 on either axis, and signed-boundary controls. All agree with
   subtraction of separately sign-extended coordinates; five disagree with the
   current wrapped port expression. At person32767/target32768, for example, the
   original considers the target far while the current port expression considers
   it near. This is a proved adapter difference, not full-world pathfinding proof.
   The companion evaluates that exact port expression in Python, not TypeScript.

Companion SHA256 is
`5a7578947b47e7a2e795e881893028250278f8845a2c9f45bdae74372f62cc70`.
Independent [distance replay](distance-replay.json) is byte-identical to the author
result, SHA256
`fa07a6393231153208152ba789b80d9954ae01baefdd87729c3257bedcd52b76`.
Its destination/recovery leaves are supplied, recovery is not reached, and adjacent
empty-land lookup executes. This accepts those comparisons, not movement or recovery.

Ordinary Mission10 Firewarrior training/exit/move/G/deselect/cancel observation
remains required to bind the actual browser owner and phase handoff, with raw
identity/state/status/queue/source/draw/f1/f2/stamp and displayed frame. A migrated
path also needs ordinary persistent following, repeat-G, no-follower cancellation,
target loss/vehicle behavior, and save/reload checks at its chosen scope. Deeper
native physics/destination/scheduling proof is still required for any claim about
natural near-Shaman stop/idle timing or continuous original guard phase. This
review does not approve a fallback seed policy or whole Guard parity.

## Independent command and checks

From `integration-publish-recovered`, after `source ../prerequisites/env.sh`:

```sh
timeout 60s taskset -c 4 env PYTHONDONTWRITEBYTECODE=1 "$POPULOUS_PYTHON" \
  work/orchestration/native-guard-lifecycle-20261005/probe-guard-lifecycle.py \
  "$POPULOUS_EXE" "$PWD" \
  > work/orchestration/native-guard-lifecycle-review-20261005/replay.json \
  2> work/orchestration/native-guard-lifecycle-review-20261005/replay.stderr
```

Exit0, 0.16 seconds. Tracked source remained clean. Browser, full check/build,
dependency and profile work: not run, outside this research-only review. Maintained
TypeScript diff/quality gates: not applicable; no TypeScript changed. No parity
credit, performance claim, runtime change or publication is accepted here.

The same command with `probe-guard-distance.py`, `distance-replay.json` and
`distance-replay.stderr` also exited0 on CPU4 within the same 60-second bound;
stderr is empty with the same empty-file hash above. No broader rerun was needed.
