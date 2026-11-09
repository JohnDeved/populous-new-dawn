# Builder animation building lookup

Refs #144. The ordinary Scene unit frame queries a stationary construction worker's
current building through `unitAnimation`. Previously each Work worker called
`world.buildings.find`, including misses. This slice replaces those frame lookups
with one Scene-owned Map rebuilt from all current buildings on every unit frame.

The first duplicate ID wins, matching `find`. The Map holds actual Building
records so preparation edits stay current; it does not filter by eligibility or
model. Explicit maps are authoritative, including empty maps and missing keys.
NaN work queries remain strict misses, while null, signed zero and infinity retain
the original comparison behavior. Omitted fourth arguments preserve the live
`find` path for direct and simulation callers. All earlier animation returns,
selected-ID behavior, unit cleanup and subsequent draw/animation code are unchanged.
The Map is disposable derived Scene state and never mutates the World.

## Focused caller evidence

Tested source: `f344ccd47e6273dc5dc7c3169c2ce92a709b5566`, based on actual main
`2180841a5b6b446f900d74911d3e272f4c73569a`. The Node fixture uses the maintained
Scene unit-frame and animation wrappers, real UnitMotion and the existing texture
IO/projection boundary. A real construction command advances through the shipped
clock until its assigned worker reaches Work; that case covers animation, pause,
cancellation and completed crew release. Other controlled transitions and cloned
worker populations are explicitly render diagnostics.

The unchanged six-case file passed all six cases on the candidate. On pristine
main production it passed four and failed two separately: the new optional-map
contract returned `idle` rather than `work` for an explicit empty map, and the
full caller read 2,080 building IDs at population 64 against a 128-read bound.
The exact-base invocation retains both assertions without conditional skips.

Cases also cover survivor sprite identity/output, live preparation edits, first
duplicate/reordering, same-array changes, replacement/missing/empty/refill,
current/legacy checkpoint migration, accepted null/NaN/zero/infinity IDs,
independent Scenes and every earlier animation owner. Rendering compares the full
World and both RNG owners before and after; omitted direct calls continue to
observe live building edits after a cached frame.

For cloned real Work snapshots with 64/256/1024 workers and buildings, the actual
full unit caller reads 64/256/1024 building IDs for both matched and missing targets.
The unchanged direct default lookup reference reads 2080/32896/524800 for matched
targets and 4096/65536/1048576 for misses. That reference is distinct from the
separate actual pristine-base failure. The natural Work snapshot has no tower
picking flag and reconciled terrain; tests assert those conditions rather than
mutating them. Counts establish this lookup boundary, excluding other rendering,
occupancy, sprite, clock and whole-frame hardware costs. Rebuilding costs one
building pass even when no worker needs a lookup.

## Quality and retained evidence

Scoped Oxfmt and ESLint passed. Strict Oxlint failed on candidate and pristine
base with the same 18 inherited diagnostics: 15 warnings and three errors. The
separate comparison passed, preserving severity, rule, message, help text and
duplicate multiplicity while normalizing only numeric line/column prefixes.
No test, rule or config was relaxed. The first candidate added one destructuring
warning; its failed comparison and helper are retained. The one-line declaration
repair removed that warning, followed by fresh candidate focused/quality checks.

Raw source/input-bound receipts remain under ignored `work/orchestration`.
The final comparison is `issue144-builders-comparison-f344ccd-02.json`. It verifies
all 348 focused inputs before/after, 346 unchanged paired inputs, all 336 pristine
app files against exact Git bytes, raw artifacts and baseline negatives. The
sparse baseline's full tracked index equals exact main; only the unchanged new
test/helper are overlaid. The completed vehicle baseline's private dependencies
were moved by rename with installed-lock snapshot, internal-link/inode proof and
its original source, owned test overlays and raw evidence preserved. The initial
empty-index sparse preparation failure happened before tests and is retained
separately; sparse initialization then verified the complete declared inputs.

Standard exact-published-head check/build await coordinator execution. Browser QA
and representative hardware measurements are not-run; supported browser access
remains blocked. This supplies no native timing, FPS, deployed behavior or whole
issue completion claim. #144 remains open.
