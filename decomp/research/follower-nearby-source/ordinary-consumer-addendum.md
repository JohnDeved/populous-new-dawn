# Ordinary command consumer and paused dispatch

This final source addendum closes the **paused-consumption leaf** left open by
`repeated-release-addendum.md`. The frozen main findings and first addendum are
unchanged. The canonical EXE and clean assessed head are unchanged. No target
execution/emulation, tests, browser, dependencies or app edits occurred.

## Finding

The original active single-player game has a timed command-dispatch phase before
the simulation phase. A simulation pause does not itself block this command
phase. Therefore an accepted nearby/global command can commit while the game is
paused, provided the ordinary HUD/game interface remains active and its command
record is ready. A port implementation that waits exclusively for an unpaused
simulation turn would miss this behavior.

This is a bounded static control-flow finding. It does not prove every menu,
inactive-window or alternate-interface schedule, nor the precise browser/native
wall-clock equivalence. Those outer boundaries remain unclaimed.

## Direct caller and buffer mapping

`consumer-call-candidates.json` scans only direct E8 call targets in the canonical
`.text`. Exactly two candidates target `0043e8e0`:

- `004b3add`: retained `004b3920.c`, recorded-command playback; this was not used
  as proof of ordinary scheduling.
- `0043e8bd`: decoded inside routine `0043e890`, the ordinary tribe dispatcher.

`ordinary-command-call-0043e840-0043e8e0.asm` contains the complete aligned routine
from0043e890. Ignore the partial unrelated instruction at the listing start.
`0043e890` exits when recorded-input flag `0098f746 & 0x10` is set. Otherwise it
iterates four tribes, requiring tribe+0xc20 nonzero and corresponding game-state
command+0x0c nonzero, then calls0043e8e0. The command array starts at0089d18c,
stride15. It does not read simulation pause bit2.

Three owners are distinct:

1. Temporary pending input records at00897997, four records of15 bytes; this is
   the empty-slot admission owner written by00479cf0.
2. Per-tribe command rings at008979d3, stride0x5e2, 100 records each. Static
   writers0043e320/0043e3c0 copy all15 bytes, including desired value and opcode,
   from the pending records and manage ring indices/write flags.
3. Current game-state command records at0089d18c, consumed by0043e890.

`command-availability-0043e480-0043e890.asm` establishes the ordinary non-network
branch (`land_flags_1 & 8 == 0`). It checks command-ring readiness/current command
sequence, copies15 bytes per tribe into0089d18c, advances read indices and clears
ring write flags. It has no simulation-pause-bit2 gate. Network and recording
branches exist in this bounded listing but are outside this UI slice.

Temporary pending clear is `0047ac30`. It normally zeroes60 bytes at00897997.
If global bit0x100 is set, it clears that flag and preserves the temporary buffer
for that visit instead. This is an explicit exception; do not claim every dispatch
always clears every temporary record.

## Ordinary caller order and pause

`ordinary-dispatch-caller-candidates.json` identifies four direct0043e890 callers
inside already-retained `004a5590.c` (`main_loop_outer`). Only the ordinary
single-player branch is needed:

1. `draw_main`, retained004a4960.c, normal game-interface branch calls
   `copy_tribe_commands_from_buffer()` then `main_loop_outer()` (lines85–86).
   That branch does not test simulation pause bit2. It has its own interface
   transition/shutdown guards; this finding assumes the normal game branch.
2. `main_loop_outer`, retained004a5590.c, computes timed command visit quantum
   from `1000 / DAT_0089d161`. In the non-network branch it waits for the next
   timer visit and calls0043e480 for readiness.
3. At004a595d it calls ordinary dispatcher0043e890, then0047aac0,
   ring producer0043e320, and temporary clear0047ac30.
4. Only afterward does the ordinary path call tribe/simulation work and
   `main_loop_inner`004ec6f0 (004a599b..004a59ad).
5. Retained004ec6f0.c:22 wraps simulation advancement in
   `(land_flags_1 & 2) == 0`. Retained00479f00.c:99–111 identifies that same bit's
   pause set/clear/toggle owner. The earlier command phase is outside this guard.

The availability helper checks readiness, not pause. This closes the earlier
uncertainty without a full engine-timing audit. Ordinary command dispatch can
continue while the simulation turn counter does not advance.

The complete original call requests cues0x6e/0x6f, but retained0048a050.c:35
suppresses ordinary audio when pause bit2 is set (outside its interface exception),
because these requests use flags1 rather than the overriding0x800. Thus paused
acceptance should not require audible toggle cues merely because the callback
requests them.

## Consequence for the port proposal

Preserve the first-request-wins pending desired-value behavior from the first
addendum. Do not implement an immediate XOR per release. A second release before
temporary-slot admission/commit cannot cancel the requested transition.

The existing `GameScene.animate` call runs before `advanceGame` and has current
scene/disposed-world guards. It offers a narrow place for a mode-specific input
dispatch visit that also runs while the simulation is paused. A bounded modern
implementation can choose a documented dispatch clock at that owner, separate
from simulation advancement, while keeping the existing original count/selection
flag and port checkpoint contracts. This is a concrete opportunity, not a claim
that an arbitrary render frame equals the native timed command visit.

Name and review the chosen port scheduling contract. It must make these outcomes
explicit: repeated releases before dispatch produce one transition; a release
after dispatch reverses it; paused simulation does not strand an accepted mode
request; modal/replaced/disposed Worlds do not receive stale work; pending request
save/restart behavior is defined. The port has no generic human tribe-command
queue, so cross-command contention with all other actions and the original100-slot
ring pipeline remain outside this UI slice. No general framework is justified.

The ordinary Mission1 count/selection episode remains the playable acceptance.
Add focused repeated-release and paused-dispatch observations without substituting
an injected mode flag for real control activation. Canonical HFX876–878 import,
persistent nearby count/font wiring and committed mode checkpoint checks remain
the finite implementation prerequisites already enumerated.

## Source limits

The callback/bit-writer, direct ordinary consumer, local ring transfer/clear and
the placement of command dispatch before the pause guard are source-proved. No
new Ghidra export or executed original code is claimed. Precise end-to-end input
latency, exceptional global0x100 buffering, full ring behavior, all interface/menu
states, ordinary original save codec, and physical allocator/list parity remain
unclaimed. Stop at this boundary; further general scheduling research is unnecessary
for the bounded implementation proposal.
