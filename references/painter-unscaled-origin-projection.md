# Unscaled painter origin projection

This partial #145 slice avoids the unused camera-relative origin record for
non-sprite objects whose `nativeScale` is falsy. The conditional stays after the
existing anchor-visibility guard and uses exactly the same truthiness as the two
origin consumers: sprite depth and scaled `modelPoint`. Per-face anchor checks,
shared vertex projection, ground clipping and sound sampling remain unchanged.
Commands, sorting, depth storage, ranges, deferred alpha and picking are retained.

The shipped unscaled path is `initializeTerrain`/`rebuildTerrain`: the nine-copy
capacity InstancedMesh carries `painterGround`, `terrainGrid` and `nativeRelative`,
and current RenderView visibility selects its actual indices and active copies.
All available original native-model resources have truthy scales. Supplied generic
meshes are diagnostic inputs; they are not original model4 metadata (model4 is
absent). Authentic model13 and sprite controls still require origin projection.

Prepared checks exercise actual terrain creation, camera/land owners, visible
index preparation, Painter and picking at an ordinary view and torus seam, with
repeated full command/depth/range/ambience outputs, reusable ground projection
records and full World/land/both-RNG preservation after legitimate camera setup.
IO uses existing texture-loader hooks and reads the maintained landscape/wave
assets locally; browser/GPU submission is supplied. Scaled model13 and sprite
controls retain their calls and alpha/material/group restoration.

The previous anchor fixture keeps every behavior assertion. Its two operation
assertions are deferred until after picking and ground-record reuse, then expect
three and six accepted vertex calls/records instead of four and eight including
the unused origins. Historical #361 receipts retain their original observations.

Supplied quiet unique/shared/instanced workloads use populations 64/256/1024.
All nine rows are emitted before cost assertions. Predictions: one unscaled mesh
with N unique triangles projects 3N vertices rather than 3N+1; N repeated shared
triangles project three vertices rather than four; N one-triangle instances project
3N vertices rather than 4N. Real terrain savings depend on the actual current
visible-instance count. Fresh paired measurements, focused/scoped quality and
standard check/build are NOT RUN at this checkpoint.

This establishes no whole-frame allocation-byte, GC, hardware CPU/FPS, browser
pixel, native-raster or full #145 acceptance. Origin vectors, transform clones,
per-vertex projections, command allocations, sorting and alpha work remain.
