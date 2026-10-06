# First phase5 success source freeze candidate

This packet incorporates the staged-plan review and clarified PR245 head
`ba308395ed3889058a30974440f8a0c9a6b8106f`. It is source only. No native
instruction, app/browser/package code or Ghidra was executed. The source rejects
execution, has no registered check entry, and has no accepted native result.

## One input, one controller return

The proposed first executable step has exactly one supplied phase5 model12 body,
owner/local-player0, game flags32, flat terrain128, saved site `(4096,4096,240)`,
death point `(8192,8192,1408)`, gameplay RNG `12345678` and cosmetic RNG `11223344`
(hex). The body owns high handle640; high free records641–674 give34 slots; the
low free list is empty. Total/low occupancy is1/0. The surviving-population
field is a supplied gate context, not a simulated living-follower roster.

Call original `005029d0(body)` exactly once and stop on its return. Execute the
real wrapper `004da0f0`, allocator, person/class initializers, cell registration,
object setters, ground interpolation, both RNGs and body retirement. Record
allocation requests separately from nested returns, argument-stack top/flag
before/after, new tribe Shaman handle, population writes, both RNG streams,
source/child records, cell links and primary/retirement list heads.

Successful static expectations are one person, one model9 and32 successful
model3 allocations. These are still unexecuted expectations. The person's
initializer samples ground128, while root height is `max(240,128)+90 = 330` and
new children retain330. Keep saved-site, terrain, root and child heights as
distinct values. This does not re-prove phase1 spirit grounding. The complete
caller RNG cost is an output; do not label96 burst producer draws as that cost.

## Explicit supplied and unproved boundaries

- The phase5 body, terrain, free-list records, count/tribe state and RNG seeds
  are supplied fixtures. No death producer, ordinary battle or mission load runs.
- Sound-device `0048a050` is the only supplied native consumer. Record its three
  arguments and return0; the phase5 caller ignores the handle. Do not add generic
  rendering, initializer, registration, RNG or allocator stubs to make it pass.
- The loaded frame-count table is supplied from the pinned VSTART/VFRA chains,
  reusing the existing native-animation/ground probe's loaded-table boundary.
  Actual object setters execute; native file loading and rasterization do not.
- Original constants, full mapped search and PE read-only sections are guarded
  before/after fixture setup and the call. Native memory writes are checked
  against named ownership regions; unexpected direct calls or writes abort and
  require classification before the next source freeze. All accesses are retained.
- No actor gets a first scheduled visit. There is no phase4 wave, outer loop,
  lifetime, allocator reuse, owner sweep, exhaustion, failure/retry execution,
  application comparison, rendered result or parity claim in this first result.

The old16-case preparation remains unchanged and unexecuted at
`b6e73e3e7e43afa2dfa50749f3329346a26f99e5`. It is later material, not imported
by this draft. Later separately reviewed stages must cover allocation-argument
cleanup on failure, owner/failure/capacity variants, and phase4→phase5→first
scheduled visits/lifetimes. Startup Wildman conversion and the earlier mode2
wave's one-shot opportunity remain distinct from phase5 person retry.

## Live caller and eventual witness

Current `world-state.ts:addUnit` creates `native: null`. Keep that difference
visible in any later comparison; never inject a native person to hide the
initialization gap while comparing pixels. Current-main play has not been run.

The old reincarnation-wave browser script is a fixed-step rendered diagnostic:
it calls `command`/`tick`, sets speed0 and supplies `scene.animate` times. Its
injected target/Swamp section is excluded. Ordinary Mission2 acceptance needs a
separate later shipped mission/Skip/H/public-pointer attack route, normal elapsed
game-clock advance and real combat death with surviving followers, then visible
reincarnation, public Save/Load and pause without replay. The older diagnostic
supports route feasibility only. It cannot be relabeled as ordinary elapsed play.

Host-only AST/source/hash checks are recorded in `source-validation.json`.
The first executable source is still pending review; no execution is requested
by this packet and no shared resource has been reserved.
