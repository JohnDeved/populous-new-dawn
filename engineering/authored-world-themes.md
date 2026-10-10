# Shared authored world resources

Refs #14. Base `219384134d21200f80df0496a4866fb02fb200db`; accepted DATA inventory
PR #312, `d13825915c557cb24b0fc5341b5280c69ac88c94`. This product branch first
freezes actual-caller failing tests and a bounded importer for independent review.
Runtime correction and asset generation have not started at this checkpoint.

The generic resource descriptor derives from the world's authored mission header.
Landscape 12/28/25 independently resolves c/s/p terrain and full model atlas;
objects 0/2/6 resolve 2/2/6. Unsupported identities retain explicitly marked c/2
compatibility, preserving requested and effective identity. A supported load
failure rejects readiness. There is no mission-number allowlist or mutable save
field. Each scene freezes its descriptor; model meshes bind an immutable resource
record with id, bank, data, and shapeIndices. Geometry keys include bank/id/stage.

`tests/world-environment-callers.test.mjs` uses actual mission worlds, constructor
resource/preload statements, terrain initialization, authored decoration creation,
lighting/waves, picking/bounds, landscape shadow synchronization and repair. Only
IO/GPU and unrelated drawing are supplied. It includes warm-cache M3→M1→M2,
the authored M10 p/2 pair, and an explicitly controlled unsupported-landscape/6
header. It does not claim ordinary browser behavior. The ordinary shipped-controls
scenario is owned by the independent QA branch; Page save/load/restart and texture
failure/retry coverage will accompany implementation before final acceptance.

`scripts/import-world-environments.py` is the only producer for the new s/p
landscape bundles, full atlases, bank6 tree13–18 records/shapes and provenance.
It admits only 28 hash-pinned Component0 DATA members of the canonical archive,
using existing Binary Refinery 0.10.11 and pinned pure decoder helpers. It checks
all 78 current model records and unchanged c pixels/bytes before writing its six
outputs. No installer/native instructions, broad import or unrelated regeneration.
The input manifest records accepted raw/decoded/source hashes. `--check` compares
all outputs and the provenance record without overwriting them.

The existing Mission3 Blue Temple animation/acquisition/sparkle owner and atlas
remain unchanged; ordinary model atlas selection cannot broaden that admission.
Terrain, water, minimap and globe must consume the same scene texture data.
Tree geometry, lighting/waves, picking/bounds/hover and shape repair must consume
the selected object record. Equal source scale160 retains timber growth/burn scale.

Focused checks use verified stationary dependencies by read-only symlink, CPU4,
private temporary paths and a 60-second bound. Full check/build/browser admission
is serialized by the coordinator. No parity completion claim is made here.
