# Mission 3 population gate and native Convert Wild task

## Scope and provenance

Research follows the accepted marker-Preacher slice at
`d58f79531ff5391a86cdb34f242e3a716118c981`. It does not change runtime behavior or
claim full Mission 3 parity. The remaining obligation is related to the broader
optional-command boundary in [campaign issue 2](https://github.com/JohnDeved/populous-new-dawn/issues/2),
not evidence that its accepted natural-victory journey was invalid.

Original executable SHA256:
`3a5065c7420b3fcde208bf220bc86dfbac95e025ab2492caf9c7ea5308dfbe4f`.
CPSCR012 SHA256:
`d5dfcd826f77909a64cca03ca9d9e3d351d2a7cb3f63eb8ba811b59916e83601`.
The six exports, `004c7370.c`, `004e5900.c`, `004f87f0.c`, `004f5d30.c`,
`004f3a70.c` and `004f6af0.c`, were generated with official
Ghidra 12.1.3 from the existing fresh-analysis project without community metadata.
The wrapper verified original file-backed section bytes and successful export/save.
Their hashes are registered in `decomp/exports.json`; that registry's historical
metadata description is not provenance for these exports.

## Excluded script block

CPSCR012 words `768..<796` run EVERY31, so tribe 2 opportunities are turns
30,62,94,..., with no offset operand.

- Own model-5 building count (internal1070) >0 and attribute1002 ==1 sets that
  byte attribute to0.
- Own population >14 executes opcode1030 OFF.

`0048cc60` clears AI `+0x59a` bit2 (`0x4`); it does not deactivate an existing
queue record. The reusable probe executes the original interpreter and command
host, supplying only population and model-5 building count reads. Six threshold,
attribute and recurrence cases pass; an existing active type2/phase6 record stays
active and unchanged. RNG is unchanged in these controlled cases.

The model-5 count itself is a supplied world read in this probe. Do not upgrade
that into proof of building completion/filter semantics.

## Actual producer and controller

Native `00461d70` installs `004e5900` in the second initial producer-table entry;
`004625e0` actually reaches it and allocates type2. Both are executed unhooked in
the probe with only state2 enabled.

`004e5900` requires `004f65d0` to return1, then the real type2 gate `004627f0`,
then writes type2/phase0 through `00462790` using the supplied free slot. The tiny
`004f65d0` machine-code leaf reads global `0x89bc76` and returns1 for a nonzero
unsigned value. Existing `004ecac0` increments that counter for active class1,
model1 people (Wildmen). Type2's gate requires state bit2 and no active type2
record. Five unhooked producer cases cover no Wildmen, disabled state, duplicate
active task and successful allocation. Allocation does not require a spell-payment
check; that is a later controller concern.

`004623e0` dispatches type2 to the newly exported `004c7370`. Its subject is the
Shaman at AI `+0x89d`; the early blocker reads person byte `+0xaf`. Its marker99
startup override is AI flag `0x40`, coordinate `+0x5a6` (`0x52dc` in Mission 3).
An unhooked phase0 case consumes that override and enters phase2 with target
`0x52dc`, a 360 counter and byte 20, without a cast or RNG draw.

The controller then validates/searches a standable target, checks native vehicle-family counts
and Shaman reachability, acquires selection, requires an available Shaman,
enters state14, advances the scheduled phases, issues real movement order3, and
only reaches Convert Wild checks in phase8. Phase8 includes the already-known
7×7/cardinal density choice, elapsed-work limit, Shaman readiness, mana/range/
spell permission checks, cast request and return-order cleanup.

Crucial negative finding: **the controller does not recheck state bit2**. Two
unhooked dispatch cases prove an existing phase6 task advances to7 with either
state2 ON or OFF. Disabling1030 therefore prevents new allocation; it is not a
per-cast cancellation switch.

## Target and reachability leaves

The following observations come from the newly exported callees. The additional
`check-native-mission3-convert-target.py` comparison now covers 11 unhooked macroregion
search cases and 18 unhooked signed vehicle-count cases. Nine route-wrapper cases
supply only the route-builder result; eight standability cases supply only terrain
height/resting collision while executing the real spiral traversal. Six controller
phase2 cases execute real vehicle sums with supplied standability/reachability.
Those supplied-leaf cases do not prove full terrain/pathfinding or transport. The
earlier population/state probe and receipt remain unchanged.

- `004f87f0` scans 64 macroregion count bytes, selecting the greatest nonzero
  Wildmen density within inclusive minimum/maximum wrapped distance. Equal counts
  prefer strictly shorter distance; exact ties retain the earlier region. It then
  averages the even coarse coordinates of the actual Wildmen list in that region.
  A nonzero count with no matching list member still fails. No RNG call appears.
- `004f5d30` checks the target's centered 2×2 cell through `00518200`; if blocked,
  it tests spiral indices 0 through 23 using `0049c890`. The first valid candidate
  replaces the packed target; success at the initial center leaves it unchanged.
  Existing resting-cell collision and spiral primitives cover these dependencies.
- `004f3a70` calls the actual route builder `004ea920`, with the Shaman's raw
  coarse start and an odd, centered destination. On a zero route result it clears
  person flags4 bit `0x10000000`. A cost-only or even-masked endpoint query would
  not preserve this wrapper's side effects.
- `004f6af0` sums signed shorts `AI+0xba7/+0xba9` for arguments1/2 and
  `AI+0xbab/+0xbad` for3/4, returning999 otherwise. The existing `004ecac0`
  class4 writer identifies these as vehicle-model pairs (boats and balloons).
  This corrects the earlier note's unsupported **sibling-task count** description.
  The controller uses either nonzero vehicle sum to bypass its route test; this
  observation does not establish the later transport behavior.

The direct caller `004c7370` justifies all four scoped exports. Its byte `person+0xaf`
blocker maps to the existing `computerAssignment` field (including marker99's
assignment99), not a generic casting-state test. Selection/phase scheduling,
cast timing, transport and full route integration still require live comparisons.

## Browser gap and next acceptance

`computer-spells.ts` currently documents a marker-only approximation: it creates
`scan.wildTarget` at a 64-turn opportunity and performs conversion from the spell
service, without the intervening type2 queue/selection/movement phases. Its
`convertReady` condition rechecks state bit2 on every cast opportunity. Merely
including `768..<796` in that adapter would conflate an allocation gate with an
active-task gate and would not reproduce the original controller.

Do not change production preferences based on this finding. The earlier
[Convert Wild note](mission3-convert-wild.md) already bounds the existing one-shot
path; it is not complete type2 proof.

Before implementation, integrate the traced target search/standability and Shaman
reachability consumers with existing native terrain/movement primitives, then
compare their live effects; the supplied-leaf probes do not close that boundary. Preserve the marker override, task scheduling,
selection reservations, command3 payload, cast/readiness/payment order and
cleanup; do not substitute a new spell entry or a fake conversion. Natural
Mission 3 startup must reach the real task, movement and conversion, then the
population cutoff, with checkpoint/RNG and rendered validation. Generic search,
full movement/cast timing and full live-game parity remain unresolved here.

## Reproduction

`python scripts/check-native-mission3-population-state.py /path/to/d3dpoptb.exe`
requires the existing Unicorn environment and adjacent original CPSCR012. It
hash-checks both inputs. Assertions cover six bounded interpreter cases, five
unhooked allocation cases, two unhooked active-task state boundaries, the unhooked
marker-override phase0 case, and actual initialization/producer-dispatch wiring.
It does not execute the installer or launch the original game.

The additional target probe uses the same executable argument and environment. It
runs the original population/state proof first, then its 52 bounded target/wrapper
cases. Unhooked search includes empty/count-list mismatch, even-coordinate means,
density priority, strict distance ties, wrap and inclusive radius boundaries.
Controller cases include cancellation of opposite signed vehicle sums and prove
that a failed standability check precedes the vehicle bypass. No RNG change occurs
in the target/standability/controller cases. No rendered or whole-task acceptance
is claimed by this research-only change.
