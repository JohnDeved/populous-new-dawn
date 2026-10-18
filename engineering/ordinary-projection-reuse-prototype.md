# Exact ordinary projection reuse prototype

This isolated alternative retains numeric projected corners across ordinary picks.
It does not change triangle scanning, visibility, ordering, water updates, or the
native-edge cache. It has not been performance-qualified.

Each view lazily owns at most four FIFO mesh/instance slots. Each slot holds
16,641 validity bytes and seven Float64 values per corner: actual transformed
x/y/z and projected x/y/z/w (948,537 bytes per slot, excluding small JS metadata).
The upper numeric-buffer bound is 3,794,148 bytes per view. Each of the four
slots holds only a WeakRef to its mesh, not a strong mesh/geometry/material/scene
reference. Remaining retained state is bounded slot metadata and numeric projection
certificates. Mesh removal does not immediately clear numeric buffers; FIFO eviction
or view disposal releases them. Garbage-collection timing is not promised. Disposal releases
ownership; active queries retain their local lease but cannot reacquire it.
Reentrant queries use the uncached path.

Reuse requires the shipped grid's canonical typed attributes, canonical relative
and screen helpers, ordinary finite matrix data, and an exact numeric certificate
of all projection inputs and raw center. Custom helpers/accessors fall back.
Actual transformed xyz values are compared as each distinct submitted corner is
visited, using Object.is, so unversioned edits, animated water, transforms and
signed zero cannot silently reuse stale values. No position-array hashing or
second position traversal is introduced. Cached results are copied into fresh
vectors; caller-owned candidates and vectors are never retained by this cache.

The optional F8 projectedVertices counter remains actual screen-helper calls:
a warm hit reduces this count, not visitedTriangles. No extra timers or diagnostic
work run with F8 disabled. Projection-phase time still includes traversal,
validation, world/vector preparation, cache lookup and projection on misses.

Limits: changing camera/projection state invalidates a slot; changing water height
invalidates that corner; more than four hot mesh/instance pairs may thrash. This
still reads/transforms current vertices and allocates current vectors. Typed-array
writes from other agents are not synchronized (shared buffers are ineligible).
Reduced helper calls do not establish faster frame time or justify deployment.
The scalar-arithmetic and partial-horizontal alternatives are not included.

## Key and mutable-consumer audit

The eligible branch is unwrapped, non-overview canonical screen/relative. Its
inputs are transformed xyz, rawCenter x/y, all nine projection matrix numbers,
curvature/depth/perspective/scale, width/height/centerX/centerY, both fraction and
pixel-scale pairs, and config.depth. The canonical branch does not read camera
matrices, globe state, or wrapped center. All inputs are either compared during
vertex visitation or included in the numeric certificate. Math and Vector3
projection helpers must remain canonical; accessors fall back.

Downstream addScaledVector receives freshly prepared world vectors, never cached
numeric storage. Retaining or mutating those arguments after a query cannot poison
later projections. The cache copies output components before candidate resolution;
no custom consumer receives a cache array or retained mutable projection object.

## Accessor certification repair

Canonical helper identity is certified from own data descriptors, not property
reads. Accessors that return the canonical function are rejected for screen,
relative, Vector3.fromBufferAttribute/applyMatrix4 and all four projection Math
helpers. Attribute getX/getY/getZ, normalized/itemSize/array, and projection/matrix
input certification already used own descriptors; those remain unchanged.
Downstream custom vector consumers still receive only fresh vectors, not retained
cache state. Eight failure-first regressions cover every repaired helper guard.
