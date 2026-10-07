# Two phase-ready ordinary gifts: native request order

Issue #30; proof-only prerequisite for the ordinary acquisition adapter, based on
`89c9629991489fd1ce6dc52e938d1cec346bfead`. The accepted
[handoff](worship-grant-handoff.md), [presentation](worship-grant-presentation.md)
and [replacement](worship-grant-replacement.md) probes and receipts are unchanged.

## Result and exact boundary

Two original `004ed8a0(6,2,255,position)` allocations prepend their records to
`allocated_units` at `00890324`. Allocation executes the original
`004ed580 → 004fa530 → 004faaf0` initialization, including state 4 selection,
cell insertion, height and spell-body setup. The supplied 20-byte settings record
is consumed by native code and specifies class 11, the model, grant mode 3 and
ordinary variant 0. Free storage, flat cells and the later phase-ready state
are supplied; no list links or dispatch results are supplied after allocation.

The probe executes the exact primary-list block `004ec898..004ec8cb` (end
exclusive) from `004ec6f0`. It loads the native head, follows `+4` links, increments
class counters, and executes `004ed700 → 004fa8f0 → 004facf0`. Both records start
at phase 1/timer 77 and end at phase 0/timer 76, with stock still zero.
The original callbacks run newest allocated gift first, then the older gift.
Each invokes its own `00481550 → 004841b0/00481490`, cue `0x71`, panel opener
`0044bb30`, and model-specific rectangle lookup `0044be00`. Therefore the older
of the two ready gifts is the final singleton winner. Neither model numbers nor
numeric handles determine priority.

Both spell and companion origins, the spell target and saved handle/model are
checked after **each** handoff. Both controllers still have zero UI visits.
The independent Tornado pulse, created by 26 actual `00480ea0(0)` visits before
the pair, retains all 25 bytes at `00988a68` through both callbacks. Entry observers
confirm no UI scheduler, spell processor or companion processor runs in the
object block; memory-write observers record zero cosmetic/gameplay RNG writes.

This executes a source block, not the whole world scheduler. The unrelated
world/AI/save prologue and tail of `004ec6f0` are excluded. It proves ordering
once two ordinary records are ready in this list, not natural simultaneous
worship completion or the correspondence between browser gift-creation order
and original authored-object allocation order. The adapter must preserve that
distinction when choosing its ordering key. Payout remains owned by the earlier
proofs; this extension adds no stock timing, wall-clock, GPU or parity claim.

## Frozen reproduction

[probe-native-worship-grant-request-order.py](../../scripts/probe-native-worship-grant-request-order.py)
SHA-256 `bd793ebd2d837321f246ab531924f26a88ceca4aa17a7981e28e86fd9e4d7547`.
The finite matrix crosses allocation model orders `(12,3)/(3,12)`, allocation
handle orders `(900,902)/(902,900)`, and absent/active pulse: eight cases.
The final run passed in 2.674 seconds wall / 2.888 CPU with exit 0; its owned
process group was confirmed absent after exit. The wrapper imposed a 19-second
hard kill, within the authorized 20-second bound. Raw result SHA-256:
`771883b2eff7bd15284374bdb37cb7e84a15ffe0a3b005ae71174eb22800b5c4`.

```sh
timeout --signal=KILL 19s python -B \
  scripts/probe-native-worship-grant-request-order.py "$POPULOUS_EXE" \
  --output work/orchestration/worship-request-order/native-check
```

All five read-only PE regions, the full search table, 244 configured constant
targets, and loaded AL/palette/HFX metadata are checked before/after every call.
Executable/search/assets retain the accepted input hashes. Native initialization,
allocation, traversal, dispatch and handoffs are never intercepted. The nine
supplied leaves are the existing presentation boundaries: `0048a050/0048a810`
(device), `0044b770` (viewport), `0044b130` (panel refresh), `00479f00` (display),
`005162e0/0047e070` (sprite/body queue), `004ffae0` (clip), and `004811a0` (arrival
UI). Every invoked intercept and observed setup/dispatch call is retained.

Local receipts are in `work/orchestration/worship-request-order/native-attempt-2/`:
`probe-result.json`, `command.json`, exact `probe-source.py`, stdout and stderr.
`command.json` includes before/after input and accepted-evidence hashes, the
owned PID/process group, terminal exit and release evidence. Attempt 1 also
passed; attempt 2 adds complete setup/intercept/call retention and removes an
unused inherited snapshot helper. No failed native attempts occurred.
Static GNU objdump ranges and the owned-process wrapper remain in the same
ignored task directory. No original EXE, existing probe, asset, runtime, fixture
or parity file changed. No Ghidra, browser, package installation or full suite ran.
Focused Python syntax/native checks suffice for these two research-only files;
the adapter's independent runtime gates remain required.
