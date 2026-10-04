# Authored scripted Land Bridge origins

## Confirmed mismatch

Mission 2 DAT trigger record 59 at `(-113,113)` links record 60, a class-7/model-24
Land Bridge effect at `(-77,-105)`, targeting `(-61,-105)`. Before this correction,
`world-initialization.ts` retained only the target and `world-turn.ts` used the
trigger's position for the bridge origin. This changed the wrong terrain corridor.

The original producer allocates at the linked effect's own position. Worship
location is not the Land Bridge source.

## Executable composition proof

The original executable has SHA-256
`3a5065c7420b3fcde208bf220bc86dfbac95e025ab2492caf9c7ea5308dfbe4f`.
Mission 2 DAT has SHA-256
`83f5c446975398b163ef00526567f7a86b2666d26f9f026231ec0b36bf5a289f`.

- `00485b00` decodes trigger links and copies the class-7 target from DAT words to
  object `+0x57/+0x59`.
- `00509c10` initializes model 24 to processing state 25 and controller turn zero.
- `004fb270` resolves the head's linked object, allocates its class/model at the
  linked object's `+0x3d` position, copies the source template, then first-processes it.
- Newly retained `004ede10` copies the template while preserving the destination's
  allocation position, identity and registration-owned fields.
- `004ed700 → 0050a750 → 0050ee00` dispatches the real Land Bridge controller. It
  takes the start from `+0x3d` and target from `+0x57`, without consulting the head.

`scripts/check-native-authored-bridges.py` executes this chain and all 63 controller
visits on authored terrain. Mission 2 produces native endpoints `(47872,24832)` →
`(51968,24832)` and modifies 36 unique terrain vertices with the supplied zero flags.
The probe compares the original endpoints against `createWorld`'s live shrine data.
It also audits the other four currently live campaign bridge sources:

| Mission | Trigger record | Effect record | Browser source | Browser target |
| --- | --- | --- | --- | --- |
| 2 | 59 | 60 | -77, -105 | -61, -105 |
| 5 | 96 | 126 | -89, 15 | -89, 31 |
| 5 | 113 | 115 | -51, -5 | -67, -5 |
| 6 | 355 | 356 | -93, 63 | -77, 63 |
| 9 | 215 | 228 | 103, 95 | 103, 79 |

Missions 1 and 3 have no linked class-7/model-24 heads. Tutorial 79 also authors
head 70 → effect 72, but its later lesson is not bound by the current initializer;
it is outside this five-live-head repair. Mission 5 trigger 96
happens to share the effect's origin, so its previous output already matched.

## Reproduction and boundaries

```sh
python scripts/check-native-authored-bridges.py "$POPULOUS_EXE" --output work/orchestration/authored-bridges/native.json
python scripts/check-native-authored-bridges.py "$POPULOUS_EXE" --browser path/to/native-terrain.json
python scripts/check-native-land-bridge.py "$POPULOUS_EXE"
node --test tests/authored-bridges.test.mjs tests/land-bridge.test.mjs
```

The new probe supplies the forced-completion bit, storage returned by allocation,
world registration/class callbacks, shared-link scan, sound/presentation, deletion,
trail allocation and terrain notifications. The actual decode, model-state setup,
head clone producer, copier, dispatch and terrain arithmetic execute. Later heads
with mixed links retain the authored bridge slot while other links are zeroed;
the report marks these as `bridgeOnlyLinkSlice`. No endpoints are supplied or
rewritten. Raw authored heights with zero flags are a controller test, not native
rendered-game evidence. Ordinary browser worship owns the input/renderer claim.
The optional `--browser` path takes initial terrain, actual observed endpoints and
final heights from an ordinary Mission 2 capture; it executes the native terrain
queue and compares all 16,384 final heights. It does not claim per-turn browser
observations or native GPU equivalence.

`004ede10` was exported with Ghidra 12.1.3, Temurin JDK 21.0.12.1 and the existing
`populous-restored` project on 2026-10-04 using the scoped, byte-checked exporter:

```sh
python scripts/decomp.py export 004ede10 --project-dir "$POPULOUS_PREREQUISITES/ghidra-projects" --project-name populous-restored --output work/orchestration/authored-bridge-origin/native
```

The wrapper completed successfully with one exported function and no reanalysis.
The export hash is indexed in `decomp/exports.json`. It is pseudocode, not original
source. The executable probe uses Unicorn 2.1.4.

## Live adapter and checkpoint boundary

Fresh worlds preserve `bridgeStart` from the linked record and place the live
bridge effect there. The controller remains unchanged. Legacy checkpoint migration
matches the immutable head position, range, heading and existing target, accepting
only an unambiguous authored source. It does not reconstruct the world, advance
worship, reset random state, replay a consumed head, or change terrain/in-flight
effects. Existing saved origins stay authoritative; unrecognized custom records
retain the old shrine-origin fallback. Already-deformed legacy terrain cannot be
safely repaired and is preserved.

Portable tests cover all five source bindings, ordinary Mission 2 command/worship,
every live bridge terrain turn, one-use consumption, a pre-activation old save,
mid-effect checkpoint continuation, existing-source preservation and an unmatched
target. These tests do not claim complete Mission 5/6/9 playability or native GPU
rendering equivalence. Rendered Mission 2 acceptance is retained separately.
