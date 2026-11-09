# Rejected-anchor origin projection

This bounded #145 change moves `RenderView.relative(origin, ...)` after the
existing sprite/native-model anchor visibility guard in `Painter.update`. A
rejected anchor no longer computes the projection record that was immediately
discarded. The visibility predicate, matrix and origin construction, vertex
reset, sound sampling, face processing and all later sorting remain unchanged.

The shipped path is `GameScene.animate` → `renderSceneFrame` → Three render →
`RenderView.prepare`'s `onBeforeRender` → `Painter.update`. The maintained
`RenderView.relative` and `visible` methods only read ordinary projection/bounds
state and perform arithmetic. No shipped override or callback intervenes between
the original call and guard. Custom side-effecting replacements are outside this
source contract.

The guard still uses `metadata.cellPosition ?? origin` and the original wrapped
or unwrapped mode. Accepted anchors retain origin-based projection. Unscaled
meshes retain the per-face visibility and per-vertex projection paths, including
ground clipping and projected-record reuse. Initial object traversal, slot ranges,
texture capacity, transparent-group edits/restoration and picking are unchanged.

Prepared portable checks use the actual `Painter`, `RenderView.update`,
`relative`, `visible`, `screen` and picking methods with controlled Three objects
and a supplied transparent-sort receiver. They compare accepted commands/depths
with a scene containing the same accepted objects, retain rejected-object ranges,
and exercise wrapped/unwrapped anchors, metadata-cell overrides, completed-model
face clipping, unscaled origins outside visible face bounds and ground fallback.
Full Mission1 World, terrain and RNG state must remain unchanged.

The paired six-file focus ran on authored `7aa70bd3` and pristine-main test-only
baseline `807c2c01`, both based on main `179bef23`. The candidate passed **19/19**;
the pristine source passed **18/19** and failed only the unused-projection count
assertion. All three new behavior cases and the retained painter, viewport and
picking tests passed in both roles. Existing consumers were not edited.

The operation diagnostic warms each workload, then delegates the real `relative`
method while counting calls and distinct returned records inside one real
`Painter.update`. It retains one accepted sprite sentinel plus the stated
rejected population. All six rows were emitted before the cost assertion:

| Rejected objects       | Population | Pristine calls / records | Candidate calls / records |
| ---------------------- | ---------: | -----------------------: | ------------------------: |
| Sprites                |         64 |                  65 / 65 |                     1 / 1 |
| Sprites                |        256 |                257 / 257 |                     1 / 1 |
| Sprites                |       1024 |              1025 / 1025 |                     1 / 1 |
| Native-model instances |         64 |                  65 / 65 |                     1 / 1 |
| Native-model instances |        256 |                257 / 257 |                     1 / 1 |
| Native-model instances |       1024 |              1025 / 1025 |                     1 / 1 |

Fresh Oxfmt and paired scoped ESLint passed. Initial Oxfmt failed only the new
test; the reviewed repair applied formatting without changing assertions.
Strict Oxlint remained **FAILED** in both roles with 12 inherited warnings.
Complete stdout and stderr were byte-identical; the diagnostic comparison
passed separately, without normalization or configuration changes. The focused
receipts bind 371 inputs, with 370 identical across the pair. Raw passed and
failed receipts remain distinct.

Standard check/build, browser and hardware checks are **NOT RUN** at this
authored checkpoint. Integration is owned separately by the coordinator.

This removes one unused projection-record boundary for each already-rejected
anchor. It does not establish total allocation bytes, allocation-free frames,
hardware CPU/FPS improvement, browser pixels, whole-group pre-culling (#142),
native physics parity or complete #145 acceptance.
