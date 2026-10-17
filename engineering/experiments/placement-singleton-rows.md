# Placement scenery singleton rows

Baseline: `6cfb658d5cfaf42db86b70bbf82ef8af57735a5c`.

Candidate retains the independent flags/buildingIds slices, all synchronization,
building setup, native-position calls, tree/shrine/stone reads, and ordered validity
checks. No live sparse overlay, inter-query view reuse or resource cache is introduced.

Only the private scenery lookup representation changes. A cell's first object is held
as an independent captured descriptor. The second promotes it to an ordered array;
subsequent collisions append distinct descriptors. Singletons are wrapped in arrays
only when validity asks for that cell. Missing cells still yield empty iterables.

The map, rows and descriptors do not escape checkBuildingSite. Its current
buildingCellValid consumer iterates rows and reads class/model without comparing row
identity, mutating rows or exposing them to callbacks. Reentrant queries have separate
storage. This audit covers shipped ordinary built-in behavior, not deliberate replacement
of Array/Map intrinsics or allocation-failure equivalence.

The intended reduction is row arrays for singleton cells outside the queried footprint.
Collision-heavy layouts or frequently queried cells may save little; extra branches may
cost time. No allocation or speed improvement has been measured. Profile percentages
are not an achievable-speedup claim.

The regression file pins the accepted git object's SHA-256 and extracts just its exact
checkBuildingSite function. Explicit dependency boundaries observe snapshots, descriptor
order/independence and exceptions. Cases cover collisions, depleted trees, shrines,
vault occupancy, stone filtering, late getter mutation, throws and validity short-circuit.
This is not a native oracle, full-world equality gate or rendered placement test. No full
copied runtime module is added. Baseline updates require review, never automatic refresh.

Initial authoring validation: syntax check and git diff --check only. Tests, standard
check/build, native/full-world and performance remain not run pending the exclusive lane.
Existing PR 527 is untouched.
