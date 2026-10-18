# Building controls after handle reuse

Bounded issue #25 repair from main `15798e017fc05e6460ac7ab9b9f0eca373ce4fe4`.
The existing occupant menu, original artwork, pointer-transit adaptation and real
selection/dismantling mechanics are already delivered; this does not recreate them
or close #25/#457.

## Reused evidence and live defect

- [Workshop menu](workshop-menu.md), [pointer transit](building-panel-hover.md),
  [camp inspection](camp-manual-inspection.md) and
  [Temple inspection](temple-manual-inspection.md) own the existing presentation,
  input and retained lifetime contracts. Held/focused lifetime is intentional;
  this patch does not introduce an offscreen dismissal rule.
- Retained `00504b70` resolves the panel's current `unit_land_array` entry before
  calling `00504bc0`. The latter reads current building occupant slots and person
  ownership, rather than a previously captured browser object. These are static
  source anchors, not a new native execution or proof of browser allocation parity.
  Their SHA-256 values are respectively
  `d0af2374cc7d9d94510715dfd27b41b8ee6410d3aa99e0977e58b845f4c9ca36`
  and `073b8e8c7c9827136952d8721f90665199f8f3bb45951251a3a28e4b71ff168e`;
  the indexed original executable hash remains
  `3a5065c7420b3fcde208bf220bc86dfbac95e025ab2492caf9c7ea5308dfbe4f`.
- The live `construction-runtime.ts::buildingId` deliberately reuses available
  1..1023 handles after the monotonically allocated object counter reaches 1024.
  `world-turn.ts` removes dead building objects. Rendering can occur after several
  simulation/input transitions, so absence need not be painted before replacement.
- `renderBuildingPanels` keyed cached elements by numeric handle and updated their
  occupant data, while `createPanel` listeners permanently captured the first
  `Building` object. A same-capacity replacement therefore displayed its current
  occupant but sent selection and dismantle to the retired object. Its dead-HP
  guard made both actions silently ineffective.

## Bounded correction

A weak, Scene-independent DOM-to-rendered-building identity binding is refreshed
only by the actual renderer. Each action verifies that this is still the current
Scene's registered panel and a living, owned, supported building in its World.
Disposed/replaced presentation ownership and existing input locks reject actions.
An unpainted replacement cannot receive a stale button's command. The next valid
paint binds that same element to the new object.

Occupant actions additionally resolve the current living owned person and require
both the building's actual roster and the person's matching work/inside link.
Departed or foreign occupants cannot be focused or selected from stale DOM data.
The existing selection, camera-focus and real dismantle consumers remain unchanged;
there is no substitute deletion, simulated timber award or invented control.

The WeakMap is transient presentation state, not checkpoint data. Public Save
preserves the current controls; public Load's existing presentation invalidation
rejects the previous Scene immediately. Ordinary Load still owns disposal and
fresh Scene creation. No World schema or load migration changes are introduced.

## Regression and limits

`tests/building-panel-identity.test.mjs` supplies an allocation-boundary counter,
completed towers and a Brave, then uses actual building allocation, Tornado damage,
ordinary cleanup, public entry commands, actual DOM callbacks and real dismantle
completion. Both replacement selection and dismantling fail on the base and pass
with the correction. It also checks prepaint replacement, occupant departure,
right-focus identity, negative ownership/type/input boundaries, destruction, and
public in-session store Save/Load before repaint.

DOM, canvas, projection and initial boundary setup are supplied. This is composed
source/consumer evidence, not rendered-browser interaction, ordinary campaign
acquisition, committed IndexedDB, native raster equivalence or hardware-performance
acceptance. Original exports/assets and native fixture expectations are unchanged.
The local Chromium startup blocker remains; it is not bypassed or retried here.
Existing hosted scenarios can provide broader UI regression but do not currently
exercise recycled building handles. Full standard gates and independent review
remain separate from the focused source proof.
