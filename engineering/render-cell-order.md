# Owned render cell ranks

`createObjectCells` opts a fresh live world's cell registry into a private render
rank cache. The ownership record is a WeakMap entry, not simulation/checkpoint
state. `Painter.update` consumes its read-only rank map; public `cellObjectOrder`
continues to produce a fresh, independently mutable Map.

The rank dependencies are every head value, registry lookup membership/value, and
each reachable record's `cellNext`. Coordinates, health, visibility and the world
turn are not rank dependencies. `cellPrevious` affects subsequent mutations and
is maintained by the same topology helpers.

Owned registries must use `setCellObject`/`deleteCellObject` for membership and
`insertObjectIntoCell`/`removeObjectFromCell`/`moveObjectInCells` for topology.
Arbitrary raw writes are not detected by identity checks and are not part of this
ownership contract. Mutating through a shallow alias that shares the original
head array or Map is also outside this contract: ownership belongs to the factory
wrapper, and helpers must receive that wrapper. All production registry writers
use these helpers; native
fixtures may continue constructing unowned registries directly. Future writers
must preserve this boundary.

Mutation invalidates before any write, including operations that throw. Nested
reads during a mutator use the fresh scanner without retaining intermediate
ranks. A mutation during rank construction prevents retention of that result.
Same-cell movement changes coordinates without invalidating ranks; crossing a
cell invokes removal/insertion. Cached maps are replaced, never mutated in place.

Unowned registries, structured clones and checkpoints use the original scanner.
Replacing an owned registry's head array or Map also falls back. Checkpoint
migration from Uint16 to Float64 heads therefore cannot reuse old ranks. New
world/reset creation starts with an independent owner. No cache is serialized or
implicitly adopted from preexisting data.

The unchanged render path removes one complete 16,384-head scan, linked-record
walk and rank Map construction. Mutation bookkeeping has a cost, and authored
workloads can invalidate frequently. This is a structural work claim, not a
measured frame-time improvement. No Painter sorting, command order, projection,
visibility, material ownership or native submission behavior is changed.
