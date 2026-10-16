# Checkpoint replay assertion preparation

## Existing measured cost

Accepted Full check log `/tmp/pr484-full-passed.log` recorded:
- `balloon-attack.test.mjs` fresh case: 51,239.033272 ms.
- Historical c44 case: 55,175.819265 ms.
- `balloon-staged-movement.test.mjs` fresh/historical cases: 48,746.553361 / 29,739.253071 ms. This second file is unchanged and has a different indexed defaulting policy.

These are whole-case observations on that hosted run, not a profile of cloning or a comparison against the local candidate. They do not justify a numeric speedup prediction.

## First bounded change

The attack helper originally cloned both complete worlds on every replay turn solely to normalize `reward` to `mana` for mana shrines. Fresh replay runs from turn 3531 to 6429 and historical replay from 3233 to 6429: 2,898 + 3,196 comparisons, hence 12,188 full-world clones.

The candidate constructs transient shallow root/shrine views and retains full deep equality on every replay tick. It copies only shrines receiving the existing default. All actual checkpoint/branch clones, fresh acquisition, historical provenance checks, simulation ticks and identity/event assertions remain unchanged. No shared mutable world or cached expected result is introduced.

Four one-time full clones remain: the previous normalization is used to validate each live/restored world at replay start. Net structural reduction is 12,184 whole-world clones for these pinned paths, not measured bytes or time.

## Scope and safeguards

This helper is scoped to these plain-data replay worlds. It is not an arbitrary structuredClone replacement. A normalized shrine referenced elsewhere can differ between shallow normalization and graph cloning. Setup-time equality against the previous oracle rejects incompatible initial graphs. Independent source review found no later persistent alias introduction on this path: linkedShrine promotion deletes its link before tick returns; persistent work/vault/order fields use IDs and other effects copy coordinates. Renderer caches are outside the headless World.

Five pure helper tests check no mutation, exact missing/present reward behavior, retained person/Map aliasing, unrelated nested Map/Set/typed-array/order/person differences with identical assertion messages, current values after updates, and domain rejection for aliased shrines/symbol/custom-class data.

The initial helper run passed four tests but exposed an overstrong test assumption that an Object.create prototype necessarily changes Node's assertion result. That failed receipt is retained. The synthetic case was corrected to a class instance; product implementation was unchanged. All five then passed in 170.997 ms.

## Execution boundary

Snapshot source is Git b91ea778a36c5a566dc5283038f74e2cf7fa13d7 plus only the candidate attack test and new helper. One candidate file execution is authorized, capped at 180 seconds. Raw TAP/stderr and source/resource receipt are retained beside this document. No full local suite or baseline rerun is authorized here. Broad validation belongs to hosted Full after source review.

## Terminal result

The single candidate replay finished at 2026-10-16T13:09:42.963467Z: exit 0, all four tests passed, no stderr, no timeout, and all snapshot source hashes unchanged. Wall time was 92.326 seconds; TAP reported fresh/historical cases at 53.051 / 37.097 seconds. Child max RSS was 635,608 KiB. These local numbers are not directly comparable to the earlier hosted Full run; no precise saving is established. The successful replay verifies the actual starting-world domain guards and unchanged per-tick assertion coverage.
