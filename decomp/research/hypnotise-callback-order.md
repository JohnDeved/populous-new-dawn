# Hypnotise registered callback order

## Ordinary failure

On Mission22, the existing mana-focus adapter enables Hypnotise charging; actual
turns earn one shot at5948. Public movement through(0,-45),(20,-45) and toward
(20,-41) admits a public cast at6178 toward(15,-31). No actor, position, mana or
spell stock is supplied. Immediately before application at6191, the effect's
native center is(5888,5888). Actual cell discovery is[98,97], both exact registered
enemy owners at distance80. The source callback order is therefore[97,98].

The old adapter instead allocates its first replacement at98's position and its
second at97's. The regression checks allocation ordinal-to-original-position,
HP and cargo binding, not numeric original-game allocation IDs. The recipient set
and observed aggregate RNG are unchanged in this particular witness.

## Static contract

The executable pinned in `decomp/tools.json` dispatches Hypnotise through
`0050ea60` at counter5 to `00515e30`, width3, cap6, predicate`0050eab0` and
callback`0050eb00`. The retained selector prepends eligible objects encountered
in wrapped3x3 linked-cell order, marks nearest recipients with strict comparisons,
then calls all marked objects along that reverse-discovery chain. Callback
`0050eb81` synchronously allocates an enemy replacement; success records status,
original tribe, life and cargo before marking the old object for later deletion.
The selector's separate cleanup pass runs after all callbacks. No original code
was executed for this work.

## Bounded composition

Existing browser eligibility and positions still produce the complete candidate
snapshot. Before the cap, a native-order projection is used only when that whole
set has a bijection with exact current registered animation owners in actual cell
chains, matching IDs, class, tribe, model and coordinates, without duplicates.
The reverse-discovery snapshot is stably ranked by distance to mark the nearest
six. Callback application filters the original snapshot by those marks; mutations
to roster and cells cannot reorder or extend the current visit.

Unregistered, aliased, duplicate or mismatched candidates retain the entire old
fallback. This preserves compatibility, not correctness of arbitrary malformed
worlds. Existing eligibility differences (including housed followers and
same-tribe expired Hypnotise), native allocation limits, initialization/RNG,
deferred deletion and replacement physics remain adapter boundaries. The current
release/delete/create callback is unchanged; numeric native allocation parity is
not claimed. A default uninitialized state10 person without an animation owner
also retains the fallback.

Controls cover unequal-distance application order, seven tied recipients,
roster permutation, complete-set fallback and mutation-safe old-object cleanup.
The earned-cast regression verifies current replacement ownership and public
checkpoint continuation; comparison copies normalize only the two previously
established absent shrine reward defaults. No rendered or IndexedDB UI claim.
