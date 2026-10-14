# Original Balloon Hut model family87–90

Base7da254e1. The genuine M16 campaign checkpoint40406 contains defeated Yellow
Balloon Hut299, native building model15/object89. Its next structural damage
transition at40417 calls emitBuildingDebris. The statically imported model table
omits89 and fallback rules.buildingObjects[15]=87, so collapseBuildingFaces reads
undefined.faces. No browser/fixture initialization can supply these missing
static entries. Original failed receipt and a separate no-action11-frame baseline
reproduction are preserved. The partly advanced failure terminal is not reused.

## Authentic data import

The native building table selects base87 plus tribe0..3 (87/88/89/90). The original
import selection omitted this whole family while including neighboring83–86 and
91–106. The narrow `--balloon-huts-only` path reuses the reviewed original decoder,
checks provenance bank2 hashes and record lengths, rejects differing existing
entries, appends only87–90/modelIds and preserves all prior models/atlas bytes.
The full import selection also includes87–90 to prevent reintroducing the gap.
No runtime damage, RNG, victory, actor or resource workaround is added.

Pinned bank2 OBJS/FACS/PNTS and independently decoded bank6 hashes are in
`balloon-hut-model-evidence/banks.json`. Reproduce read-only with:
`python3 decomp/research/balloon-hut-model-evidence/verify-banks.py GAME_ROOT`.
Both native banks decode identical meshes for all four owners. Each has117 faces,
scale160, original modes6/7, original stage/cap bits, normals, UVs and depth bias.
Tribe tiles24–27/112–115/226–229 differ; the shared tiles already occupy the full
256-tile8×32 atlas. No texture expansion or recoloring is required. Original data
were read only; no original executable/installer was executed or emulated.

## Live consumers and qualification

The building renderer already selects exact buildingObject where present. Before
this import it used fallback model13; after import it uses each authentic owner
mesh. Debris iterates real faces, preserving the existing sequential allocation,
RNG and first-motion semantics rather than silently skipping missing geometry.

Tests pin decoded assets and the prior78-model/atlas hashes, cover all four owner
mappings and stages, enumerate finite structural/terrain-collapse fragments, and
advance exact40406 through40586 with full Save/Load twins. The history fixture is
not supplied-position gameplay. Independent public continuation and rendered
before/after qualification are recorded separately; renderer/hardware/native
combat parity is not inferred from CPU tests.
