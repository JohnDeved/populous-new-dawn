# Tower acquisition model material

This is the asset-only prerequisite for Mission 4 screen acquisition, not runtime
admission or completion of issue #23. It reuses the accepted model-79 geometry and
the existing shared effects. No world marker/glow, controller, HUD, source row,
atlas loader, persistence policy or existing asset changes here.

## Original evidence

The [independently reviewed original-data comparison](https://github.com/JohnDeved/populous-new-dawn/issues/23#issuecomment-6727533160)
resolves the earlier [source prerequisite](https://github.com/JohnDeved/populous-new-dawn/issues/23#issuecomment-6724482351).
Archive SHA256 is `6aa6c366809ea1d9575ec1d31a24527a95c7332f0a1d2ab692f7a602e7e10702`;
EXE SHA256 is `3a5065c7420b3fcde208bf220bc86dfbac95e025ab2492caf9c7ea5308dfbe4f`.
Original instructions were not executed. The installer was parsed as data only.

Building initializer 004819c0 reads the model-indexed descriptor. Tower descriptor
005a7358 selects geometry79, HFX1076 and HUD control3. The independently decoded
OBJS/FACS/PNTS geometry matches the current imported model in all retained fields:
76 faces, 61 points, 125 triangles, scale160, 20 mode6 and 56 mode7 faces.

The eleven selected tiles are 12,24,26,109,127,143,154,183,186,214,226. Only tile127
differs in full RGBA between bank c and d, at five pixels; every alpha byte agrees.
Its source faces are zero-based 15,17,18,19,20,21,44,45. The decoded crop SHA256s are:

- c: `4a88ac1aba3125bdab7461c18e5a0ca95aef1549721ac9b3f603fd931087804e`
- d: `01879cff1ef259d99275fc6154efa4d1bdd83a0880c0cac38bbefc67fe01892f`

Actual ordinary-PAL trail frames318–321, AL-decoded sparkle/pulse frames1288–1299,
and all five palette tint selectors match completely between c and d. Every
selected c crop first matched the committed atlas/effects pixels. This justifies
reusing those exact effects, not assuming that the complete banks are equal.

## Scoped importer

`scripts/import-tower-acquisition.py` authenticates current decoder, model, rules,
base-atlas bytes and the three restored bank-d inputs before decoding. It copies
the existing atlas layout and replaces only tile127, keeping all255 other tiles
and all alpha bytes unchanged. Unselected tiles remain bank-c pixels deliberately;
this is a model-79 subset atlas, not a complete bank-d world atlas.

Generate from the already verified DATA directory:

```sh
python3 -B scripts/import-tower-acquisition.py --source /path/to/verified/game/data
python3 -B scripts/import-tower-acquisition.py --source /path/to/verified/game/data --check
```

Only `app/original-tower-acquisition.json` and `public/original/tower-model-d.png`
are generated. The metadata retains input/source and per-crop hashes. Derivation
finishes before either output is opened. Invalid input therefore preserves both
existing outputs; the two later file writes are not a transaction against disk
or process failure. `--check` never replaces generated outputs. No other importer
or asset is regenerated, and no extra sparkle/trail atlas is created.

`tests/tower-acquisition-assets.test.mjs` checks provenance, original crop hashes,
all unselected pixels, exactly five changed pixels, alpha, ownership and failed
import preservation with normal/optimized Python. The raw original inputs are not
committed or required for these portable controls. Actual regeneration requires
the hash-bound original data and remains a separate check.

## Remaining acceptance

The atlas is intentionally not loaded or consumed by runtime yet. Compose the
existing family-aware HUD bridge, explicitly select geometry79 and the Tower
source/controller, handle tribe-remap tiles186/226, and compare the Tower-specific
controller rather than inheriting Camp's126-visit lifetime. Preserve six-visit hide
versus82-visit grant. Static HUD coordinates are not modern locked-button placement.

Native composition, ordinary M4 acquisition/locked target/resize/pause/replacement,
current-format Save/Load, rendered pixels, full check/build and integration gates
remain open. Asset derivation and Node pixel tests do not provide those results or
earn parity credit. Earlier failed attempts and the disclosed128GiB geometry-audit
supplement ceiling remain in the original review record; they are not rewritten by
this follow-up.
