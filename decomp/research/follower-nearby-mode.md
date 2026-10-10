# Followers global/nearby control

Issue #60. Source assessment at `92907866646e418747dd2bda44236d9949835bc5`;
publication based on `721c3b08950fee0e19e4117bc7c516fe73d773c8`.
This note retains static evidence and a reviewed implementation contract. It does
not implement the control or claim new native/browser execution or issue closure.

## Proven behavior and remaining live gap

The original HFX875 descriptor `005cb1b8` binds release callback `004a1680`,
refresh `004a16f0` and renderer `004a1a30`. Release reads committed tribe bit 0x80,
requests directional cue 0x6e/0x6f, then submits desired value 1/0 through command 0x5f.
The actual writer `004404e2` sets/clears only that bit. Adjacent Shaman, tab, tribe
and population descriptors establish the control identity independently of old UI
labels. Frames 875/876 are global normal/pressed; 877/878 are nearby normal/pressed.

The producer admits the first request into an empty native tribe slot. Two releases
before consumption request the same cue and desired value twice; the second request
is discarded. Immediate XOR on each release would contradict that behavior. The
ordinary consumer runs before the simulation pause guard, so an accepted command
can commit during an active-HUD simulation pause. Cue requests can be inaudible.

At the assessed port head, HFX875 invokes Planet overview; no ordinary producer
sets bit 0x80. Existing task/transport counts and selection/focus consume that bit,
while persistent class/Total counts remain global. The lower 36 controls already
exist. This finite slice restores reachable mode activation and persistent count
feedback without reimplementing those consumers. Source count ownership excludes
ghosts, retains global class enablement, sums models 2..6 for Total and keeps the
housing capacity meter global. Counts use raw camera center; selection/focus uses
the containing 512-unit cell center under the already retained native contracts.

## Retained source and review

Read these in order; later addenda control earlier unresolved/immediate-action
wording. Statements about no publication in original packets describe their frozen
assessment time, not the later act of publishing them here.

1. [Producer, controls, guards, art and finite gap mapping](follower-nearby-source/findings.md).
2. [Repeated release and first-wins command admission](follower-nearby-source/repeated-release-addendum.md).
3. [Ordinary consumer and paused dispatch](follower-nearby-source/ordinary-consumer-addendum.md).
4. [Concrete implementation contract, revision2](follower-nearby-source/implementation-contract-v2.md).

The source packet includes bounded disassembly/data windows, original provenance
and correspondence manifests. [Independent producer review](follower-nearby-source/follower-nearby-static-producer-review-20261010.json)
and [ordinary-consumer review](follower-nearby-source/follower-nearby-ordinary-consumer-review-20261010.json)
accept the static deductions and state their limits. [Contract review](follower-nearby-source/follower-nearby-implementation-contract-review-v2-20261010.json)
accepts revision2 as a port implementation scope. [Byte readback](follower-nearby-source/follower-nearby-independent-byte-readback-20261010.json)
records independent canonical PE comparisons. Publication preserves these original
bytes; retained absolute task paths are provenance labels, with matching basenames
now available in this directory. [Publication manifest](follower-nearby-source/publication-manifest.json)
binds the portable copies. Existing Ghidra exports stay in `decomp/generated` with
their existing `decomp/exports.json` hashes; no new Ghidra export is claimed.

## Explicit port compatibility policy

The proposed mode-specific pending desired value belongs to a current Scene/World,
with an elapsed 12 Hz opportunity before `advanceGame`, independent of simulation
pause/speed, worship and tooltip clocks. It preserves first-wins admission, cue
request order and unrelated flags. Store binding invalidation rejects stale Scenes
before React cleanup. Modal/canceled/stale ownership cancels transient input.

Pending input is excluded from checkpoints. Save reads committed mode without
flushing the request; a still-eligible Scene may commit afterward, while the snapshot
remains unchanged. The ordinary menu cancels pending input on entry. Load/Restart/
new World discard transient ownership. Committed nearby survives typed Save/Load;
fresh missions use existing flags 0. This is a deliberate port policy, not proof of
original shared command contention or original save semantics. Full details and
failure-first actual-caller cases are in the implementation contract.

## Method and limits

Canonical input is 2,275,840-byte `d3dpoptb.exe`, SHA256
`3a5065c7420b3fcde208bf220bc86dfbac95e025ab2492caf9c7ea5308dfbe4f`.
GNU objdump 2.44 and Python standard-library PE data reads produced bounded static
windows. The source review independently compared retained bytes. No original
execution/emulation, browser, dependency installation, importer or app test ran.
This publication changes research/evidence metadata only.

Native timed visits derive from `1000 / DAT_0089d161`; this pass does not bind its
ordinary default producer or exact input latency. The 12 Hz choice uses the current
port cadence. Shared cross-command contention, complete ring/pipeline timing,
exceptional buffering, all menu/window states, physical key 0x97, localized tooltip 758,
original user-save codec and physical allocator parity remain unclaimed. Canonical
HFX 876–878 import, runtime wiring, executed checks and genuine ordinary Mission1
counts/selection/checkpoint evidence remain implementation acceptance work.
