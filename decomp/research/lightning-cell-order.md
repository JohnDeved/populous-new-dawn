# Lightning's registered-person death ordering

This bounded correction belongs to spell/interaction release gate #6. Retained
`generated/00511f70.c` traverses the target cell's head/next chain while the kill
counter is less than or equal to `LIGHTNING_NUM_KILLS` (6). Class1 victims consume
that counter only after the model8, own-Shaman and flags3 `0x28000` immunity gates.
A flags2 `0x100000` protected transition still loses life and consumes a slot;
it merely skips state44 initialization. `004da0d0` preserves attacker provenance
for owned victims/casters. Existing captured Lightning tests retain those gates.

An ordinary Mission3 producer reveals the lost ordering: twelve authored Braves
receive individual public movement orders to browser(35,85). After nine ordinary
turns, a public Lightning cast (one explicitly supplied spell shot) arrives while
ten followers occupy that cell. Retained chain order selects seven victims:
`306,303,312,516,309,519,589`. The previous reversed-roster adapter selected
`589,306,507,303,510,513,516`, changing three deaths. No actors, positions, terrain,
flags, controller phases or RNG are injected into that witness.

The adapter now projects exact registered person objects into their existing
slots before its existing snapshot-driven strike dispatch. It does not relink,
allocate, or remove cell objects. Unregistered people and same-ID aliases retain
the fallback; the special captive Shaman path retains its existing placement.
This does not establish complete native mutation-during-traversal equivalence,
removed-object pool history or broader mixed-class allocation.

Regressions cover ordinary death identities and eventual cleanup/survivors,
actual in-memory Save/Load, fully/partly unregistered and same-ID alias controls,
immunity/transition-protection cap accounting, and callback-time ownership
removal after the snapshot. Normal state44 initialization consumes seven speed
RNG samples for seven initialized victims; projection itself adds no draw.
Existing Mission15 captive controls and native Lightning/phase vectors are reused.
The spell stock setup, persistent-browser storage and rendered/native execution
limits remain separate; neither this note nor these tests close the broad gate.

Independent compatibility stress supplied duplicated roster owners, which have no
established ordinary producer. The previous Lightning adapter tolerated both a
repeated Unit reference and two Unit wrappers sharing one native person. Blast's
Unit-ID map already collapses identical roster IDs, but distinct Unit IDs sharing
one person exposed the same projection overrun. In both cases a non-bijective
owned-slot mapping must retain the old fallback rather than insert an undefined
object. The correction therefore requires owned slot count to equal linked count
before projection. It does not deduplicate or repair malformed save data. Valid
linked chains retain the ordinary capped-recipient fixes above and in
`blast-cell-order.md`.
