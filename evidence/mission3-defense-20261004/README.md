# Mission 3 defense browser evidence

Evidence for [PR #178](https://github.com/JohnDeved/populous-new-dawn/pull/178), captured 2026-10-04 with the checked-in `scripts/check-browser-mission3-defense-task.mjs` through the existing sandboxed local-render harness.

## Source and exact bytes
- Before source: `01bdd90ffa65c7d8ff0600824ab480e8a88c0b94`.
- After tested source: `8812d394e224faef1fa423b8bd089661c76a1556`.
- Published source mirror: `d9354143a613eb0ee9d1ad1dffdea2ac9f6c77e9`.
- After tested/published tree: `d0d1dc8e565da0c0084a484c049205be678ef58e`.
- `before.png`: 1,816,119 bytes; SHA-256 `a7aee24a4882b05637827a281eeb391ee2cfbdbebb7019e1c52315ab8a167ac2`; Git blob `70f541f157a6df43a7c2339bccc2dba34d2e41f6`.
- `after.png`: 1,816,386 bytes; SHA-256 `539b6e9be7988c17fdf4b3550c65009bc72782bc4c7c6553297f8cb7d151c23f`; Git blob `f90415e32c94c75b08965123906f8a3c3788d832`.

## Method and result
Both runs use public Mission 3 entry, ordinary fixed-turn model ticks and the same semantic player commands starting at turn 256: worship at the Vault, return the Shaman home, construct the rewarded Temple, train a Preacher and send it to the Chumara settlement. No entities, AI tasks, defender assignments, orders or success values are inserted by the scenario. Both images show turn 2560 with the same camera focus at x=-17, z=-108.

Before: no active type 8 defense at turn 2560. After: the original type 9 scanner creates type 8; it selects the real Chumara Preacher 3180 at turn 2440, state 14, for Blue Preacher 3164. The actual original move order 3 is observed and the defender has moved by turn 2560 to x=-18.59375, z=-108.03515625.

The otherwise matching command recipe reaches the intrusion step at different turns (before 2004, after 2036) because earlier natural construction/AI timing differs. This is a paired scenario/camera checkpoint, not an assertion that every entity or event is identical before turn 2560.

## Limits
Chrome Headless Shell reports ANGLE / Vulkan 1.3 SwiftShader Device (Subzero), so these are software-rendered diagnostic screenshots. Defender pixel contribution is small in this view; the assertions establish ownership, original order and movement. These images do not establish original-frame parity, hardware FPS or whole-Mission-3 AI parity.

A diagnostic checkpoint clone/migration continues with equal AI/order/RNG state; this is not a fresh-page save-storage test. The separate original-EXE function comparison uses supplied worlds and explicitly documents its animation/cast hook boundaries in [the native research](https://github.com/JohnDeved/populous-new-dawn/blob/d9354143a613eb0ee9d1ad1dffdea2ac9f6c77e9/decomp/research/mission3-defense-task.md). No parity ledger credit is claimed.

This evidence lives only on its evidence branch, not in the gameplay tree.
