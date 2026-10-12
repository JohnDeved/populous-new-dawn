# Unused unscaled painter origin vectors

This bounded #145 slice avoids creating an instance-origin Vector3 when both
`sprite` and the captured `nativeScale` are falsy. After #363, every consumer of
that origin is already guarded by the same truthiness: anchor visibility,
camera-relative origin projection, scaled tree ambience and anchor copying.
Per-face unscaled projection uses the existing separate vectors and transform.

Truthy instances still create their own fresh Vector3 at the original position,
before visibility and projection callbacks. A shared scratch origin would change
observable aliasing: public delegating view methods may retain those inputs.
The cache-free conditional preserves distinct identities and their positions
through later instances and frames. No transform or callback order is changed.

The existing actual terrain construction, camera/land owner, visible indices and
current copies, commands/depth/ranges, ambience, picking, projected-record reuse,
seam/repeated frames and complete World/land/both-RNG assertions are retained.
Authentic scaled model13 and sprite controls retain their projection records and
now also verify separate origin Vectors. A delegating observer keeps actual
visibility/projection inputs across two frames to verify their identity/lifetime.

The diagnostic delegates `Vector3.setFromMatrixPosition` unchanged and counts its
actual receiver identities only inside maintained `Painter.update`. Prototype and
Painter wrappers are restored in `finally`; setup, preparation and picking are
outside this count. Ordinary/seam terrain rows and supplied unique/shared/instanced
64/256/1024 rows are all emitted before their operation assertions. Supplied
geometry is not labeled native terrain. Prior relative-call/result assertions and
all semantic assertions remain intact.

Predicted candidate origin construction is zero for unscaled terrain/diagnostics,
versus one per reached instance on pristine source. Truthy controls keep one fresh
origin each. These remain predictions: paired focused/scoped checks and full
standard check/build are NOT RUN at this source checkpoint.

This measures one avoided Vector construction boundary, not total allocation
bytes, GC, leak freedom, hardware CPU/FPS, browser pixels, native raster or full
#145 acceptance. Transform clones, other Vector3 work, per-vertex records, commands,
sorting and alpha work remain.
