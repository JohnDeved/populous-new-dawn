# Modern checkpoint reference ownership

Independent read-only audit at clean `b2213c22`, equivalent to main `3b13a7ff`.
No model/browser test or native save audit was run for this finding.

The shipped controls call `saveCheckpoint` and `loadCheckpoint`
(`app/page.tsx:556/523`, startup restore at 283). Save (`game-store.ts:431`)
structured-clones the complete World once and writes it as one IndexedDB value
(`:328`). Restore (`:414`) and Load (`:444`) clone the complete graph; world
replacement (`:371`) installs it directly. No JSON or per-field reconstruction
intervenes. `migrateCheckpoint` (`:139`) mutates the existing graph and Building
objects in place. Stored-state validation (`:300`) does not discard new fields.

Structured cloning preserves repeated references within each cloned graph;
IndexedDB uses the same structured serialization semantics. See the
[HTML serialization algorithm](https://html.spec.whatwg.org/multipage/structured-data.html#structuredserializeinternal)
and [IndexedDB cloning algorithm](https://w3c.github.io/IndexedDB/#clone-a-value).
Thus shallow per-tribe arrays of the original Building objects retain aliases
with surviving `world.buildings` members. Filtering that array at
`world-turn.ts:1763` does not invalidate objects held in another saved array.
No ID-based rehydration is required for newly saved reference snapshots.

The separate typed checkpoint evidence encoder retains reference tokens
(`scripts/local-render/checkpoint-observer.mjs:16–18`); existing alias-breaking
tests in `tests/temple-training-checkpoint.test.mjs:503/510` cover that encoder.
It is a read-only hashing representation, not the Save/Load decoder.

This proves the modern storage mechanism, not native membership or original
binary-save parity. Old checkpoints lack the proposed membership field and
cannot recover already removed members. Missing or malformed membership needs
an explicit compatibility rule; a reconstructed current array is not historical
membership. Independently deep-cloning snapshot members would break the required
live-coordinate aliases.
