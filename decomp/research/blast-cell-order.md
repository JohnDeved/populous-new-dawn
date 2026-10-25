# Blast's registered-person visit order

This is a bounded correction under spell/interaction gates #6 and #74. It does
not establish complete native mixed-class allocation or rendered Blast acceptance.

Retained `generated/0050b740.c` traverses each indexed cell's head/next chain.
The last wave visit admits at most `blastAlliedLimit` (5) allied person visits.
It increments that count before later push/protection decisions, not once per
unique follower. Native type-2 indexed search repeats the starting cell; the
existing captured Blast/indexed-search fixtures preserve those repeated visits.

The live adapter instead reconstructed every cell from reversed `World.units`.
That loses persistent person order after ordinary cell departure/return. In an
authored Mission3 opening, public movement of Brave312 away and back followed by
a public Blast at browser(36,83) exposes the difference. At the final wave visit,
the retained person chains admit `[507,507,312,309,513]`; the reconstructed roster
admits `[507,507,309,312,510]`. The original port therefore launches Brave510
instead of Brave513. The fixture uses ordinary commands/casting and opening turns,
without supplying actors, terrain, spell stock, RNG, person flags or controller
phases. The five-count limit yields four launched followers because507 occurs twice.

The correction projects only exact registered person objects into their existing
adapter slots. It snapshots the retained linked order before any Blast callback,
requires object identity plus existing-cell membership, and never inserts,
removes, or relinks persistent objects. Unregistered people, same-ID aliases and
other classes keep their previous slots and fallback behavior. This deliberately
does not assert the native relative position of an unregistered object among the
owned people, or complete native mutation-during-traversal equivalence.

Regression controls cover the ordinary changed recipient, public in-memory
Save/Load continuation, wholly/partly unregistered people, a same-ID alias,
callback-time ownership removal after the snapshot, and unchanged allied RNG.
A separately staged active Boat in the affected cell checks that its existing
mixed-class damage slot still precedes those people and does not consume the
allied person cap. Existing native Blast vectors, impact timing, landing and
vehicle-damage controls remain part of focused validation. No fresh original
execution, persistent-browser storage or visual evidence is implied.
