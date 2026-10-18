# Terrain index submission ownership

This optimization skips index-prefix validation only for terrain created by
`initializeTerrain`. A module-private WeakMap records ownership; matching
`userData` flags, clones and arbitrary custom geometry do not grant it. The
certificate is for index submission, not projected vertices, painter results,
water positions or complete frame performance.

## Audited production writers

- `scene-terrain-runtime.ts:initializeTerrain` creates a fresh geometry/mesh,
  initializes instance translations and registers ownership once.
- `scene-terrain-runtime.ts:rebuildTerrain` writes vertex attributes. Its controlled
  incompatible-layout replacement updates the owned geometry and clears the old
  certificate. It never regrants revoked ownership.
- `scene-terrain-runtime.ts:updateWater` changes position/light attributes, not
  index contents. Position values and versions are not visibility-selection inputs.
- `render-view.ts:updateTerrainVisibility` creates/writes the terrain index and
  marks writes with `needsUpdate`; it owns the draw range. Instance translations
  still receive their existing checks before any certificate early return.
- The other generic index writer, `painter.ts`, is gated on transparent materials
  and `selectionCommands`, neither set on initialized terrain. Its index writes
  are versioned anyway. `scene-camera-runtime.ts` indexes sky-cloud meshes, not
  terrain. Picking and the ordinary painter ground path only read terrain indices.

The source audit found no other production writer of the terrain index. Existing
terrain debug probes replace/remove indices or geometry, change draw range, or
edit position attributes. They do not silently modify a certified terrain index
in place. Changing geometry/index/backing-array identity or custom methods revokes
ownership when preparation next runs. Method guards compare against canonical
references captured at module initialization, not mutable live prototype properties;
prototype-level geometry and index getX/setX replacements also revoke ownership.
Versioned index edits and changed ranges
use exact validation before a new certificate can be established.

## Explicit unsupported case and debug escape hatch

An outside writer that changes an existing certified index array in place without
incrementing its BufferAttribute version is NOT supported by the certificate.
This includes edits through aliases or a clone sharing the same geometry. Such an
edit could leave GPU/picking submission stale if all certificate inputs still
match. The optimization deliberately cannot detect arbitrary raw writes for free.

Before those debug/custom edits, call `view.revokeTerrainSubmission(mesh)`.
That permanently restores the original exact validating fallback for that mesh,
including after rebuilds. Alternatively, writers adhering to the versioned
contract must set `index.needsUpdate = true` after edits and before preparation.
Native queries still consume the existing submission at their original point;
revocation does not introduce eager visibility preparation.

## Resource review and evidence limits

Added state is a weakly held owner record per initialized terrain mesh plus a
reference to its last exact selection. Reuse mutates no external resources and
adds no per-frame object allocation, traversal, timers, filesystem/network access,
processes, ports or shared execution resources. Geometry replacement and certificate
refresh mutate the existing owner record. Unowned meshes retain prefix validation.

The ownership tests use actual initialized/rebuilt terrain, stub only texture IO,
read shipped fixtures, and temporarily replace process-local fetch with restoration.
They remain unclassified/serial; no helper or existing parallel classification is
changed. Production fingerprint renewal binds the reviewed source and installed
runtime only. Correctness/work-count tests do not prove a browser or hardware
speedup; independent review, full gates and performance measurement remain separate.
