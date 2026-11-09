# Shield selection: recovered eligibility and cell ordering

## Failure and live owner

The live Shield spell dispatch in `spell-effects-runtime.ts` calls
`shieldFollowers` when its projectile resolves. Before this repair, the helper
used a radius of 1536 native units and sorted the browser unit array. Its comment
said the original selector was unavailable, although the exports had since been
retained for Bloodlust research.

A supplied ordinary-cast fixture starts six Braves with Shield counters of 1000
and an eligible unshielded seventh. At turn 8 the actual cast consumes its stock,
refreshes all six old counters to 1440 and leaves the seventh unprotected. Separate
failure-first probes also selected ghosts, hypnotised followers and a point outside
the original footprint. The population, positions and prior statuses are supplied;
cast admission, stock, projectile processing and effect application are real.

## Retained original contract

`0050a750` dispatches Shield through `00515e30`, passing maximum
`SHIELD_NUM_PEOPLE`, width 3, predicate `005156b0` and callback `005156f0`.
The selector scans exactly a 3-by-3 square of even native cells, starting one cell
before the cast cell. Byte-coordinate wrapping applies at both seams. Width 3 is
not a Euclidean radius.

Each cell uses its linked object chain. Every accepted candidate is prepended to a
temporary chain, reversing discovery order. The selector then chooses at most six
by toroidal distance with a strict less-than comparison. Equal distances therefore
favor reversed discovery order; a closer candidate found after six earlier candidates
must still be considered. Application does not depend on browser unit array order. The original applies
its marked set in reverse discovery-chain order; this port applies the same set
in distance order. Shield writes independent person flags/timers and consumes no
RNG, so the final state agrees. Exact callback-order parity is not claimed.

`005156b0` requires class 1 and exact tribe ownership, excludes models 1, 7 and 8,
excludes ghost and Hypnotise flags `0x800`/`0x4000`, and excludes existing Shield
flag `0x8000`. `005156f0` sets that flag and its own timer. Thus recasting cannot
refresh an existing Shield, while Bloodlust can coexist. These exports are bound
by `decomp/exports.json` to executable SHA256
`3a5065c7420b3fcde208bf220bc86dfbac95e025ab2492caf9c7ea5308dfbe4f` and
Ghidra 12.1.3. Pseudocode is retained decompiler evidence, not original source code.
The existing `mission16-bloodlust.md` research independently records the shared
selector contract and a historical native probe; no new execution is claimed here.

## Bounded repair and tests

Only Shield candidate discovery, eligibility and ordering change. Registered live
person cells own membership, and their native class/model/tribe/status fields own
eligibility. Existing cell and toroidal-distance primitives are reused. All eligible
candidates are ordered before the six-person cap. Bloodlust selection is unchanged;
no generic targeting refactor is introduced. Costs, projectile timing, status lifetime,
Shield damage behavior, other spell consumers and RNG ownership are unchanged.

The ordinary-cast regression now requires old counters to remain at 992 and the
seventh to receive 1440 at the same turn 8. Focused cases cover each exclusion,
Bloodlust coexistence, even-cell edges and wrapping, reversed linked-list ties,
late closer candidates, expiry/reapplication, and exact checkpoint continuation.
The older helper-only Shield fixture now registers its people in live cell chains;
it retains its original six nearest followers and duration/damage checks.

An initial new checkpoint fixture removed buildings/trees without synchronizing
derived landscape footprints. Migration correctly reconciled those stale inputs.
The fixture now calls the existing landscape synchronizer before capture and keeps
the full-world equality assertion. No checkpoint assertion or production migration
was relaxed.

Fresh native execution and normal-input rendered acquisition/cast remain unrun.
These CPU tests and retained source establish the bounded correction, not complete
Shield, spell-selection or original-game parity, nor release-gate completion.
