# Private picking model transform experiment

Base: main 9cd97887. Unpublished correctness experiment; no performance claim.

## Ownership boundary

ScenePicking.model constructs a fresh modelMatrix on each existing model-cache
miss. Its basis is local and used only to transform that pass's model points.
preparePickingModelTransform copies nine numeric coefficients into a closure
whose lifetime is that synchronous pass. It does not retain model resources,
mutable coordinates, origins, candidates or output points. The existing model
command cache remains unchanged; there is no additional cross-query cache.

This is a newly internal plain-numeric contract, not a replacement public math
API. Public modelPoint and painter/render-view/model-lighting/debris consumers
are unchanged. Arbitrary global Array.prototype.slice instrumentation of this
private basis is not an API guarantee. Basis inputs must come from the local
modelMatrix producer, not an external mutable matrix or accessor-backed object.

Raw coordinate gathering, rounding, deduplication and nativeSize reads remain at
the original call sites. The kernel retains raw.map scaling and reads origin.x,
origin.y and origin.z after the respective integer dot product, as before.
Every result is freshly allocated. It does not require immutable model resources:
resource wrappers are frozen, but their underlying data is not deeply frozen.

## Mutation and ordering

The existing key includes view state, position version and identity, matrixWorld,
resource bank/model, stage, size and heading/tilt/roll. Animated key changes create
another basis and private transform. No new invalidation rules are introduced;
unversioned-geometry limitations of the existing cache are not addressed here.

Face traversal, construction rear-face reversal, triangle order, buckets,
face numbering, bounds commands, ground occlusion and final winner sorting are
unchanged. Public modelPoint supplies the arithmetic oracle; a frozen main model
caller supplies complete ordered-command and picked-ID parity coverage.

## Work and limits

Intended mechanism: remove three three-element matrix row slices per distinct
projected model vertex on a command-cache miss. Cost: one closure with nine scalar
bindings per miss. Raw scaled-coordinate arrays and result objects still exist.
There are no per-row descriptor guards, counters, timers, retained buffers, or
renderer changes. Static model cache hits already skip this work.

Actual speed and allocation elimination by the runtime remain unmeasured. This
source-level reduction does not establish a frame-time improvement.

## Correctness admission

The focused model, tree-hover, world-environment-caller and world-picking tests
pass (19 tests), as do TypeScript and scoped ESLint/format checks. The corpus
includes integer overflow/nonfinite arithmetic, raw-map and origin getter order,
animated basis/size/position changes, replacement attributes, both resource banks,
construction stages, exact ordered commands and non-null actual model winners.
The frozen caller string was verified byte-for-byte against main 9cd97887.
The new test remains serial; only the production resource fingerprint changes.
