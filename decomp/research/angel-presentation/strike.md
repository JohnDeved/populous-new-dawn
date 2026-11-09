# Bounded strike-triggered Angel presentation

This private follow-on extends the initial-model adapter, not full Angel parity.
It does not change targeting, damage, RNG, movement, or existing strike timers.

## Proved live branch

`004db980` selects `byte[parent + 0x2d] - 1`: switch case 5 is raw controller
state 6. Its substate 2 initializes a 28-visit strike and impacts at timer 8,
already represented by `stepAngel`'s `striking` phase. `004ddb30` requests object
62 when raw state is not 7/8 and either movement mode `+0x67` equals 3 **or** raw
state is 6/substate 2. This slice binds only that latter, evidenced strike branch.
The logical effect visitor requests presentation after the existing gameplay step;
the presentation visitor and renderer do not advance gameplay or select targets.

Seeking retains model 69 as a bounded adapter, not correct native pursuit parity.
`004dada0`'s preparation gate initializes ordinary targets with mode 0 and timer 32,
then additionally checks altitude/position/path predicates. Actual chase entry is
raw state 6/substate 1: mode 2 and timer 2, decremented in that same visit, switching
to mode 3 on the next eligible visit. Those fields/gates are not guessed from the
browser's broad `seeking` phase or target presence. Tilt/roll remain unported.

## Exact transition and assets

Retained `004de440.asm` proves current object `+0x33`, pending object `+0x7a`, and
signed counter `+0x7c`. A request equal to the current object does not cancel an
opposite pending transition. Starting from initial 69/counter 0, requests toward
62 produce key targets 76, 77, 77, 78, 78, then change base to 62. The ordinary
return from completed 62/counter 5 targets 78, 77, 77, 76, 76, then changes to 69.
These are **request counts**, not a claim of unconditional rendered-frame timing.
A direct native initial-62 call instead sets counter 3; this slice always starts from 69.

`set_unit_anim` retains source key `+0x74` (fallback 69 if zero), sets target `+0x76`,
resets timer `+0x72`, sets duration `+0x71` to 2 and adds render bit 0x1000. It does
not clear other render bits. `0040c9f0` uses the completed override bit 0x400 or
`timer >> 2` for interpolation. Both logical requests and display visits retain
separate serialized fields. Current-format pause/checkpoint continuation must
preserve both, rather than deriving state from effect age or GPU frame count.
The store rejects malformed/old initial-only presentation records clearly; it
does not fabricate transition fields or change a prior stored checkpoint.

Original model 62/morph 4 has keys 63–68 with six duration fields 1 (12 frames after
native preprocessing). All have 87 points; base 62 has 111 faces. Original banks 2/6
are independently hash-pinned/decoded and must match. Model 62 and 69 share face
indices and scale, but UVs, tiles, normals and depth biases differ. The live
renderer replaces the owned mesh/material at the latched base change, releases
its old owned resources, and leaves the shared atlas cache intact. Transition
keys do not replace either base topology/material set.

## Acceptance boundaries

The importer --check and focused state tests are not rendered acceptance. Required
next gates include real strike-phase model/material switching and return, current
save/load, resource cleanup, normal game invariance, affected quality and final
combined-source review. No new screenshot, native execution, full gate or merge
acceptance is claimed by this research note.
