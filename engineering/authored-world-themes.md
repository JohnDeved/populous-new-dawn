# Shared authored world resources

Refs #14. Base `219384134d21200f80df0496a4866fb02fb200db`; accepted DATA inventory
PR #312, `d13825915c557cb24b0fc5341b5280c69ac88c94`. This product branch first
freezes actual-caller failing tests and a bounded importer for independent review.
The admitted importer has generated the six owned outputs, and the runtime now binds
shared callers to the selected resources. Focused RED receipts retain the baseline
failures; final GREEN, standard gates and ordinary rendered evidence are separate.

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
scenario is owned by the independent QA branch; actual Page save/load/restart for
M1/M2/M3, selected texture failure/retry, and legacy M3 shape retirement are covered
by the composed caller regressions. Existing shape synchronization retires each
stored old pose before registering the selected shape during checkpoint migration,
preserving high bits and unrelated cells before the first restored render.

`scripts/import-world-environments.py` is the only producer for the new s/p
landscape bundles, full atlases, bank6 tree13–18 records/shapes and provenance.
It admits only 28 hash-pinned Component0 DATA members of the canonical archive,
using existing Binary Refinery 0.10.11 and pinned pure decoder helpers. It checks
all 78 current model records and unchanged c pixels/bytes before writing its six
outputs. No installer/native instructions, broad import or unrelated regeneration.
The input manifest records accepted raw/decoded/source hashes. `--check` compares
all outputs and the provenance record without overwriting them.

The independently accepted PR #313 Temple contract also applies: completed95–98
consume the selected full atlas and shared resource-owned phase across tribes and
landscapes. Initial World selection activates the phase; fresh start and Load reset,
normal same-resource Restart retains, and stale Scene bindings lose authority.
M3 acquisition keeps its scoped model/sparkle atlas and explicit M3+p eligibility;
M1 and other p-mission companion sprites keep their previous palette ownership.
No authored reward admission, clock scheduler, or acquisition timing is broadened.
Terrain, water, minimap and globe must consume the same scene texture data.
Tree geometry, lighting/waves, picking/bounds/hover and shape repair must consume
the selected object record. Equal source scale160 retains timber growth/burn scale.

Focused checks use verified stationary dependencies by read-only symlink, CPU4,
private temporary paths and a 60-second bound. Full check/build/browser admission
is serialized by the coordinator. No parity completion claim is made here.
