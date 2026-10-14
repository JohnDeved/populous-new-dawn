# Packed command cells at live rest completion

## Native contract and actual failure

On source `f689e0c8d4bcf807627630f90211d4e1b206621c`, the actual Mission 18
Firewarrior campaign produced automatic command 21 with `a=55850`, `b=3084`.
The command completed through `stepLiveBuildingAttack` → `stepLiveOrderQueue` →
`stepPersonOrders` → `anchorPersonOrder` at turns 23325 and 23336. The live queue
adapter interpreted those payload words as raw coordinates, setting the rest
anchor to `(56064,3328)` and sending followers far from the rally point.

Independent static inspection of the retained original PE (SHA-256
`3a5065c7420b3fcde208bf220bc86dfbac95e025ab2492caf9c7ea5308dfbe4f`) confirmed:

- `00433490` skips anchor updates for descriptor bit `0x100`. Otherwise, bit
  `0x20` resolves the command position through `004389c0`; commands without it
  use the person's current position. The point passes through the existing
  building-outside handling and cell-centering operation.
- `004389c0` uses descriptor bit 4 to decode packed `b`, otherwise bit `0x800`
  to decode packed `a`, otherwise bits `0x242` to resolve the target object,
  otherwise raw `a,b`. The retained export is `decomp/generated/004389c0.c`;
  [the earlier startup research](balloon-command-position.md) records the same
  precedence and explains why `personOrderFocus` is not interchangeable.
- The verified descriptor table has bit `0x800` on commands 11, 19 and 21.
  Each has anchor bit `0x20`, and none has bit 4. Their packed `a=55850` decodes
  to `(11008,56064)`; `b` is a search extent, not an anchor coordinate.

No original executable was run or emulated for this change. Static inspection
and retained exports establish the bounded contract, not full native execution.

## Narrow repair

The live queue-completion adapter decodes packed `a` for descriptor bit `0x800`.
The existing command-30 Shaman lookup and raw-coordinate fallback remain intact.
Other packed-`b` and object command-position branches retain their existing
boundaries; this is not a general resolver or a startup/transport expansion.
A future descriptor combining bit 4 and `0x800` would require bit-4 precedence.
The descriptor table is unchanged.

`tests/command-rest-anchor.test.mjs` covers all three affected commands, the
observed M18 payload, independent search extents, wrapped cells, immediate and
cancelled orders, unchanged incomplete orders, raw command 3, skip-anchor command
28 and command 30's saved target. Real queue attachment/removal runs throughout.
A separate supplied-target-loss case enters the actual ranged attack body and
local rest initializer. Those fixtures do not establish natural campaign play.

The original failure-first focused receipt and subsequent source-bound checks
are retained under `work/orchestration/m18-rest-anchor/`. Independent exact-turn
and public-input witness results belong to `work/m18-rest-anchor-review/` and
its source-bound receipts when completed. These are diagnostic branches of
actual campaign snapshots, never replacement campaign progress. The canonical
turn-24915 continuation retains all actual Shaman/Preacher losses.

No parity ledger, mission outcome, renderer behavior, hardware performance or
historical casualty correction is claimed by this narrow repair.
