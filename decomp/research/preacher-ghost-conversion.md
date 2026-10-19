# Successful preaching removes ghosts without creating real followers

## Failure and ordinary owner

A Ghost Army cast creates six Blue Ghost Braves. An idle enemy Preacher acquires
these through normal sermon visits. Before this correction, successful conversion
replaced a ghost with a full-health, permanent real Brave of the Preacher's tribe.
The population supplied for this CPU witness is controlled; it uses actual spell
casting, spawning, sermon acquisition and world ticks rather than calling the
terminal conversion helper directly.

## Retained allocation contract

`004d83b0` runs the success trial first. Its success path tests byte `person+0x11`
bit 8 before entering replacement allocation. This is bit `0x800` of the word at
`person+0x10`, the ghost flag mapped to `flags4` by live person creation. The same
routine writes replacement `+0x10 |= 0x40000`, anchoring that word mapping.

Only non-ghost victims enter the population gate and `alloc_unit` branch, random
placement draw, replacement speed draw and birth/sound work. Both branches then
set `local_20 = 1` and call `004d4b50` for the old person. The ghost therefore must
not become a real replacement. A full receiving tribe does not protect a ghost
from this successful terminal path.

`004d4b50` is **not retained**. Its exact native removal timing, release operations
and possible additional RNG use are unknown. This correction does not invent its
body or claim recovered native cleanup equivalence.

## Bounded port lifecycle correction

On successful conversion only, a ghost skips the replacement helper, releases
its existing port task owners, and sets both native life and browser HP to zero.
The existing world-turn ghost-removal epilogue releases routes, orders and entry
owners, removes the unit/selection and synchronizes native cell ownership. Ghosts
are already excluded from ordinary death credit and corpse creation there.
Cancellation and missing/dead Preacher paths are unchanged. Non-ghost replacement
continues through its existing capacity and allocation code.

The current port terminal call consumes one success-trial draw for a ghost rather
than four (trial plus three replacement-related draws). This is a port allocation
bypass assertion, not proof that the unavailable native cleanup consumes no RNG.

## Tests and limits

Failure-first tests preserve the old unexpected allocation and ordinary-cast real
follower. Regressions cover the allocation/RNG bypass, existing removal ownership,
no corpse/credit, ordinary replacement, source loss/cancellation, full population,
actual Ghost Army-to-sermon outcome and exact checkpoint continuation. A checkpoint
fixture retains the original world topology, avoiding migration-only differences.

No eligibility expansion, Ghost Army production change, capacity relaxation or
native cleanup parity closure is included. Fresh executable execution and rendered
normal-input validation remain unrun; controlled CPU fixtures do not establish
those claims.
