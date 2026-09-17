# Vault of Knowledge side-fire research

Scope: bounded follow-on for issue 23 after the overhead reward/VFX repair merged. This note asks only whether the remembered visible flames at the sides of a Vault of Knowledge are an original Vault presentation feature or an existing generic fire/damage effect. Gameplay, renderer and assets were intentionally left unchanged.

## Result

The retained original evidence does **not** support adding persistent side flames to a normal Vault of Knowledge. The actual attached-building flame producer is generic burn state 4, and model-18 Vaults are excluded from it in two independent ways: their building descriptor is ignition-protected, and every Vault orientation has six zero fire-attachment triples. Normal Vault worship/completion instead enters Vault-specific building state 5, whose close/sink/removal path allocates no fire.

This is stronger than a missing-name/search result: it traces the actual class-5/model-10 fire allocation sites, the model-18 descriptor bit, the original Vault shape bytes, and the normal Vault state transition.

## Actual attached-building flame producer

`00408cb0` is the generic building ignition entry used by sabotage/spell damage. It refuses a building when `unit_type_array_building[model].field_0x4a & 1` is set, and otherwise changes the building to state 4 and reinitializes its class. `004030c0` dispatches class-2 state 4 to `00408840`.

`00408840` is the concrete side-flame producer. It selects the current rotated building shape, walks all six triples at shape-record offsets 26..43, and for each triple whose third byte is nonzero allocates `alloc_unit(5, 10, owner, point)`. Those class-5/model-10 objects are the ordinary fire effect. The existing `scripts/check-native-building-fire.py` already executes `00408cb0 -> 00408840` against the original executable and compares the placement/lifetime behavior. `references/reverse-engineering.md` records the same six-triple contract.

## Model-18 Vault excludes generic attached fire

The imported building descriptor for model 18 has `buildingFlags[18] = 0x78000`. `scripts/inspect-executable.py` extracts that dword from `0x5a7228 + model*76 + 72`; for model 18 the dword begins at `0x5a77c8`. Therefore native descriptor byte `field_0x4a` at `0x5a77ca` is `0x07`, so its low bit is set. That is exactly the protection bit tested by `00408cb0` and by the pending-ignition branch in `00403280`. Normal generic building ignition therefore does not enter state 4 for a Vault.

There is a second, independent exclusion in the original geometry. Vault object 154 (the Mission 7 displayed Vault) selects shape 61 at angle 1024. All four Vault object frames 152..155 use the same orientation map `[59,60,61,62]`. `scripts/import-original.py` decodes each shape fire triple directly from bytes 26..43 of the hash-verified `objects/shapes.dat`. All six fire triples are `[0,0,0]` for **all four** Vault shapes. Thus even a manually forced state-4 initialization would give `00408840` no attached flame point to allocate. The same shapes do contain the previously proved socket 1 `[40,67,40]`, showing that reward/socket data and fire attachments are distinct fields.

Relevant retained asset hashes are `objects/shapes.dat` SHA-256 `ae1188129d84c266d91a1e9e75d960e99e80cdfd573f85d524742e970a0b2849` and bank-2 `objects/objs0-2.dat` SHA-256 `e1af6bdf050608d7c1832700826bece72ca592abdff3ee9c2138c50ed8a8607d`.

## Normal Vault lifecycle is a different state

The worship task itself also points away from building fire. In `0043c7a0`, task phase 8 closes the Vault and explicitly changes the target model-18 building to state 5 before class initialization. The state-5 class-2 handler is `00407060`: it switches the Vault object through `0x99/0x9b`, runs its timed close/sink sequence, lowers the building height by six native units per pass, and eventually removes it. It contains no fire allocation.

This state transition is part of the already retained Vault task evidence in `scripts/check-native-vault.py`; the reward/trigger path remains the separate `004fb270` / `004faaf0` / `004facf0` chain documented for Mission 7. Those reward routines create the overhead reward and class-6/model-8 glow, not class-5/model-10 fire.

## Other fire producers are generic external effects

The retained decompilation contains four direct `alloc_unit(5, 10, ...)` producers:

- `00408840`: attached building burn points described above;
- `004a7bd0`: burning scenery/tree fire at the scenery position;
- `00511800`: a class-7 effect path that creates a short-lived fire at its effect point and separately calls `00408cb0` for a building in that cell;
- `00511ae0`: the Lightning/effect path that can create a short-lived fire at the impact point and separately calls `00408cb0` for a building in the target cell.

These can explain transient flames caused by an external spell or burning nearby scenery, but they are not Vault-owned presentation. Their building-ignition call still reaches the model-18 protection check.

Mission 7 authors only the model-18 Vault at `(96,-62)`, the class-6/model-2 Invisibility reward and class-6/model-6 trigger at `(97,-63)` in its immediate reward cluster. Two ordinary scenery objects are nearby, but no class-5/model-10 fire is authored there. This is only an authoring fact; the producer/state evidence above is what excludes normal attached Vault flames.

## Known / unknown boundary

**Known:** normal Vault presentation has no proved Vault-specific flame producer, generic attached-building fire cannot be produced for model 18 through the normal ignition path, the original Vault shapes have no fire attachment points, and the normal worship-completion state is the non-fire state-5 sink/removal path.

**Still not proved absolutely:** this bounded static slice did not run the original game through a live Mission 7 approach/open/close sequence and enumerate every allocated object. A transient class-5/model-10 fire could still appear if some external spell/scenery event independently creates one near the Vault; that would be a generic world effect, not an intrinsic Vault side flame. The retained direct allocation inventory and Mission 7 authoring do not identify such a normal campaign event.

## Implementation recommendation

Do **not** add decorative/persistent Vault side flames from memory. Doing so would require inventing attachment coordinates and a lifecycle contradicted by the model-18 descriptor and original shape fire fields. Keep the merged overhead reward/socket and existing reward handoff unchanged.

If issue 23 needs the remembered flame detail resolved beyond this static boundary, the smallest useful next proof is a dedicated native Mission 7 runtime capture that enumerates class-5/model-10 objects in the Vault cell and immediate neighbors during approach, opening, pre-trigger, trigger, closing and state-5 sinking. That should be evidence-only; implementation should remain blocked unless such a normal-path producer is observed.
