# Render-owned painter centers

`Painter.update` may reuse one Float64 center array per live geometry with a
canonical Float32 position attribute. Every position version change still runs
the original three-vertex sum and multiplication in the original order. This is
storage reuse, not a projection, geometry, world-turn, or painter-order cache.

The render cache is separate from public `triangleCenters` snapshots. Existing
callers can retain a snapshot without later water updates mutating it. Therefore
one geometry may retain both its render buffer and a public snapshot. Initial
painter texture growth uses the snapshot fallback, so this duplication can occur
without an external caller. A full 98,304-vertex terrain uses 786,432 bytes for
each such center array. Warm water updates avoid replacing the render buffer;
this is an allocation-count result, not a measured frame-time improvement.

Ownership and release:

- Entries are weakly keyed by geometry, with one current position/array/size
  record per key. Replacing an eligible position or its backing array replaces
  that record and releases the previous render buffer after active readers end.
- Geometry disposal deletes its entry. Painter texture disposal clears all
  render entries and disables reuse for the remainder of that update. Subsequent
  updates may reacquire storage, matching existing reusable view behavior.
- The disposal callback and watched-key set hold no strong list of geometries.
  A geometry that is otherwise unreachable is not kept alive by the cache. A
  still-live geometry releases its last eligible buffer on the next outer update
  that uses a fallback (including custom attribute replacement). Geometry and
  texture disposal also release entries; garbage collection timing is not promised.
- Nested updates use the public snapshot path, so they cannot overwrite an outer
  update's leased render buffer or remove its cache entry. Failed fills invalidate their version before
  writing, so a partial result cannot be certified as complete.
- Custom center helpers, changed attribute getter methods, noncanonical layouts,
  normalized/interleaved attributes, and incompatible backing arrays use the
  original public snapshot helper. The position version contract is unchanged:
  arbitrary unversioned position writes are not newly certified as current.

Resource-policy admission retains every existing helper and parallel-test hash.
The production change adds only in-memory arrays, weak maps/sets and local dispose
listeners; no IO, processes, sockets, timers, or shared writes. Existing painter
fixtures remain bounded and dispose their views/geometries. The new regression
file remains serial because it optionally imports an explicit baseline and
instruments global constructors/prototypes inside its isolated test process.
