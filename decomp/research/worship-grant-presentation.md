# Ordinary spell acquisition companion and draw commands

Issue #30 proof-only extension of [the frozen handoff research](worship-grant-handoff.md).
The original 17-case probe and its receipts are unchanged. This note describes
four companion lifecycles and six composed spell lifecycles, without runtime
implementation, imported-asset writes, GPU screenshots or parity credit.

## Three findings

1. `00481490` initializes the singleton companion at `00988a88` with steps
   `(type 7, parameter 1)` then `(type 8, parameter 20)`, total step count 3.
   Real `00482290` follows only these two branches. Its zero particle-count field
   `+0x5d` selects 200 records at `+0x67`, stride 18. For each of two tested seeds,
   200 particles are initialized on visits 1 and 2; subsequent visits retire 10
   per visit, and the controller retires on visit 24. Actual sprite submissions
   include HFX1288–1293 and HFX1294–1299 six-frame cycles, plus the four retained
   trail frames 318–321. The cosmetic RNG at `0089bc72` advances; gameplay RNG
   `0089d178` stays unchanged. Mid-sequence pause freezes motion/time/RNG while
   sprite frame bytes still advance in the later draw branch. Three paused
   visits produce 27 total visits with the same final cosmetic RNG as 24 normal
   visits. Initial pause consumes the pending phase transition before freezing,
   as already established by the first handoff proof.

2. The real palette consumer `00516270` selects original AL/palette colors before
   each captured `005162e0` sprite submission. Signed selectors `-2,-1,0,1,2`
   occur in the tested ordinary branch; a negative AL base pointer is legitimate
   because the actual byte at `pointer+0x2f82` remains inside the loaded AL input.
   Every such consumed byte and indexed palette word is checked against the
   immutable source files. Real `00484870` emits the spell body to `0047e070`:
   thiscall `ECX` plus seven stack arguments `(float x, float y, bank pointer,
   frame, flags, float radians, float scale)`, with native `ret 0x1c`. The frame
   comes from the original spell descriptor, rotation multiplies the native
   double at `0058f580`, and scale multiplies the native float at `0058f578`,
   **1/32**. Scale state 52 therefore submits 1.625, and 256 submits 8.0.
   The source screen position and real constructed HUD destination are unchanged
   from the first proof. All six composed cases submit 30 spell-body draws,
   retire the spell controller on visit 31, and finish the separate destination
   pulse on visit 34. Each produces 11,500 sprite submissions. Limiter bit 4 is
   cleared at visit 31 while the pulse remains alive; final pulse cleanup is
   therefore not covered by an unconditional 20-FPS assumption.

3. **A second local handoff replaces the two singleton controllers.** This is
   source/byte evidence, not a new dynamic case. `004841b0` unconditionally clears
   129 bytes at `0098c5a8`, then stores the new reward handle/model/origin/target.
   `00481490` unconditionally clears and reinitializes its separate companion
   block. Neither queues, rejects a busy request nor allocates another flight.
   The older gift retains its timer unless its arrival already clamped it to 1;
   losing the global handle does not delete or award that gift. The pulse at
   `00988a68` lies outside both clear ranges and can survive/reinitialize
   separately. The last local callback wins. Actual simultaneous worship-head
   callback ordering remains a world-scheduler boundary; this does not justify
   independent browser flights or choosing an arbitrary queue order.

## Frozen executable evidence

New probe: [probe-native-worship-grant-presentation.py](../../scripts/probe-native-worship-grant-presentation.py),
SHA-256 `a9caf4219317b76a4a13009101b0f353e27f179de34a145de198c9ee19dd98b7`.
The final run passed all ten cases under an owned 20-second timeout; its native
probe reports 4.672 seconds before receipt serialization. The process terminated
successfully and retained no resource ownership. Finite matrix:

- Companion seeds 1 and `12345678`, normal through retirement.
- Seed 1 with three initial-pause visits and three mid-sequence-pause visits.
- Models 3, 4 and 12, each with visible and offscreen source, composed through
  companion, spell controller, real spell raster caller and destination pulse.

```sh
timeout --signal=TERM --kill-after=2s 20s python -B \
  scripts/probe-native-worship-grant-presentation.py "$POPULOUS_EXE" \
  --output work/orchestration/worship-grant-presentation/native-check
```

The raw JSON records every frame's sprite/palette/final spell-raster arguments,
controller state, gameplay and cosmetic RNG, particles and retirement. Final
result SHA-256: `5b74c5df88dcdc81b71b343b3eb7a06c6637454be48482ef4fec5e9ca9d0b97d`.
The original executable and search inputs retain the hashes in the handoff note.
HFX, palette and AL files are verified against `original-hud.json`; all five
read-only PE regions, the full search input, 244 configured constant targets,
palette/AL bytes and loaded HFX metadata are guarded before/after each call.
Tools remain Python 3.12.14, Unicorn 2.1.4 and GNU objdump 2.44. No Ghidra ran.

Supplied boundaries: visible source `(420,180)`; landscape rectangle
`[100,0,640,480]`; existing occupied main-panel root; sound/device calls;
post-construction panel refresh; display requests; arrival UI callback; clip
context setter `004ffae0`; final sprite queue `005162e0`; and final spell-raster
queue `0047e070`. Original code constructs the spell controls and selects their
rectangle; executes all companion/spell movement, RNG and lifetime work; selects
palette/RGB; and emits full-screen clip requests `[0,0,640,480]` then restore.
The raster hooks record arguments only. They do not execute texture upload,
blend/clip queue processing, GPU drawing or original-game wall-clock scheduling.
The limiter setters execute as ordinary bit writes in this extension, but the
outer GetTickCount pacing remains source-only evidence.

Two failed extension attempts are retained locally with exact source and logs.
The first required the unused AL base pointer itself to be in range instead of
checking the actual consumed byte; the second assumed a 1/256 scale conversion
instead of the original 1/32 constant. Final guards/assertions follow the source
instructions. Neither repair changed native bytes, gameplay state or scope.

## Minimal remaining boundary

The native producer, ordinary companion steps, spell-controller arrival, final
draw-command arguments and retirement are now bounded evidence. Before runtime
work, independently review this extension and define the modern elapsed-time,
pause/checkpoint and HUD-coordinate ownership explicitly. Preserve singleton
replacement and its effect on an older gift's deadline. Original final blend,
texture sampling and actual screen pixels are still not proved by captured
submissions; browser rendered acceptance and hardware performance remain separate.
Do not turn 34 native UI visits into browser RAF count, 12-Hz game turns, or an
unqualified 20-Hz period. The earlier handoff note retains the ordinary Mission
1–2 scope and acceptance; Mission 3 has no corresponding class-11 worship source.
