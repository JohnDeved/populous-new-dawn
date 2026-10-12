# Invisibility linked-cell selection order

## Failure and scope

For seven healthy, registered, same-tribe Braves at equal distance, the native cell
chain is newest-first: IDs 45 through 39. The shared selector reverses discovery,
so IDs 39 through 44 own the six-person cap. The previous browser helper instead
selected 45 through 40. Reversing only `world.units` changed the recipients while
leaving the native cell chain unchanged. This is a selection-owner defect, not a
new spell-eligibility finding.

`0050a750` case `0x0d` demonstrably dispatches Invisibility through retained
`00515e30` with width 3 and the Invisibility cap. That shared selector scans wrapped
even cells and each actual linked chain, prepends candidates, then marks nearest
candidates using strict distance comparisons. Equal distances therefore prefer
reverse discovery order. See `shield-selection.md` and `mission16-bloodlust.md`
for the same shared selector's retained evidence and limits.

The separate predicate `0050d890` and application callback `0050d8c0` are not
retained exports here. This repair does not infer or expand their contract. The
existing browser team, class-kind, HP, inside and invisibility conditions remain
unchanged, including their treatment of ghosts and hypnotised people. Those are
explicit existing browser behaviors, not newly proved native eligibility.

## Repair boundary

Invisibility now discovers candidates through registered native cell chains rather
than the browser unit-array index, and reads those native positions for distance.
This changes both scan membership and ordering: an unregistered browser placeholder
is absent from the native scan. It is not assigned an invented mixed-list fallback.
The ordinary cast regression begins with unregistered live people and proves normal
ticks register them before the admitted effect selects its recipients.

The maintained helper-only Invisibility fixture now explicitly registers supplied
people and expects the oldest six at a same-cell distance tie. Its non-refresh,
expiry, reveal-on-combat, player/computer cast and migration assertions remain.
Unique-distance recipients stay nearest-first; every candidate is considered before
the cap. Shield and Bloodlust selection are unchanged. No costs, timers, rendering,
RNG rules, spell callbacks or general targeting framework change.

The port applies its selected set in distance order. The original shared selector
marks that set before applying callbacks in reversed discovery order. Existing
Invisibility application writes each recipient independently without RNG; final
state equivalence is the bounded claim, not exact callback-order parity.

## Evidence and acceptance

Failure-first source and candidate probes retain the unchanged native chain alongside
changed browser-array order and selected IDs. Regressions cover array permutation,
actual native departure/return ordering, unique distances and late closer candidates,
wrapped cross-cell ties and cap, unregistered placeholders, unchanged browser
eligibility, ordinary cast registration, and exact checkpoint selection/continuation.
The ordinary cast's expected set uses its admitted cell-centered projectile target,
not the raw click point. An initial test accidentally used the latter; the failed
fixture and diagnostic were retained, and no production timing was changed.

Retained `0050a750` and `00515e30` export hashes are verified against
`decomp/exports.json`, bound to executable SHA256
`3a5065c7420b3fcde208bf220bc86dfbac95e025ab2492caf9c7ea5308dfbe4f` and
Ghidra 12.1.3. These are decompiler outputs, not original source code. Fresh native
execution and normal-input rendered acquisition/cast remain unrun. CPU fixtures
supply populations/positions and some list transitions. This does not establish
complete Invisibility eligibility, native save equivalence or full spell parity.
