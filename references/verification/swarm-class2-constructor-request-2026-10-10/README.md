# Class-2 constructor request boundary

**Result:** the named nested allocation is restricted to building models 2 and
3 under the canonical file defaults and pinned imported constants. The other
models 0–19 have a zero descriptor word at `+0x3e`. This closes that particular
tail for a newly planned model-1 Hut, Camp or Temple. The zero word separately
excludes it for native Vault model 18; it does not establish a player-placeable
Vault route. Neither conclusion proves complete initialization or prior shared
request history.
For models 2/3, admitted class-6/model-9 initialization reaches the exact
unresolved `004fc330` leaf. The class-9 request sites themselves are retained;
their constructor `004b8070` is the separate missing plan-owner body.

This source-only successor refines the [current event table][events] and the
independently reviewed connected caller design. It uses retained decompilation,
the already reviewed delayed-plan activation bytes, and a bounded data read.
No game instructions, native probes, browser or tests were run. Current port
comparisons remain pinned to main `3b13a7ff534ab95797b0b06330055cead956160d`.

## Exact descriptor gate

The established descriptor layout is base `005a7228`, stride 76. The read covers
only the signed 16-bit word at `base + model*76 + 0x3e` for models 0–19: 40
selected bytes. `descriptor-words.json` records each address, file offset and
original bytes. Canonical EXE SHA-256 before and after the read was
`3a5065c7420b3fcde208bf220bc86dfbac95e025ab2492caf9c7ea5308dfbe4f`.

| Models | Signed word | Consequence in the selected `00403610` tail |
| --- | --- | --- |
| 2, 3 | 1 | With no supplied associated record, perform the RNG test below. |
| 0, 1, 4–19 | 0 | With no supplied associated record, skip this RNG draw and this class-6 request. |

The existing constants import recipe was checked for writes overlapping those
40 bytes. Its bounded 512-record table terminated at empty-name entry 341, so
342 records including the terminator were read. **No descriptor overlaps the
selected words.** Applying the pinned `original-constants.json` therefore does
not alter them. This is a file-default/imported-config conclusion, not proof
that no uninspected runtime writer could ever change the table.

Current `buildingModel` maps Hut levels to models 1/2/3, Temple to 5 and Camp to
7; Vault's retained native model is 18. The data therefore removes this nested
tail as a prerequisite for the ordinary newly planned model-1 Hut/Camp/Temple
case. Upgraded Hut models remain conditionally relevant. No mission-specific
allocation or RNG replay, and no claim about an actual first physical ID, is
made here.

## Ordered request and field contract

The following is the direct retained path, conditional on reaching the selected
constructor. Unknown nested effects of the named unresolved initializer are
not flattened into a single completed allocation.

1. `004ed8a0` selects the appropriate primary free head using its existing
   descriptor/count/pool gates. On success it removes that record, preserves
   physical ID `+0x24`, prepends the allocated list and increments shared counts
   **before** class initialization. It assigns class/model/tribe/position and
   clears the record state. A null free head returns null without this admission;
   a pending context is popped and its flag cleared on that failure path.
2. Normal class-2 initialization dispatches through `004ed580 → 00402ec0 →
   00403610`. `00403610` chooses the object family, inserts the supplied position,
   and processes its context and geometry before reaching the selected tail.
   Its context's `field4_0x10` supplies the local associated-record value. This
   preceding work must not be described as absent merely because the tail gate
   is zero.
3. When that supplied associated value is nonzero, the tail stores it in the
   building's `facs0_index` field and returns. It neither draws the selected RNG
   nor requests a replacement child. The field name is retained source naming;
   no extra semantic role is invented here.
4. When the supplied value is zero and descriptor `+0x3e` is nonzero, compute
   `t = seed*0x24a1 + 0x24df` with 32-bit wrapping, `r = t >> 13`, and new seed
   `r | (t << 19)`. Request a child only if `(r & 15) > 9`. A failed random gate
   still consumes the draw. A zero descriptor consumes neither this draw nor
   this request. This draw is separate from the earlier `0040b170` hut-family
   choice implemented by current `chooseBuildingObject`.
5. The passing gate pushes a context with fields `-1, -1, building pointer, 0,
   0`, sets the allocation-context flag, and requests
   `alloc_unit(6, 9, building tribe, current building position)`. The outer
   building is already admitted at this point. The child request uses the same
   primary allocator, so its admitted record/counts precede the next authored
   request and the outer constructor's return. The exact child's physical ID
   depends on the supplied shared state, not the building's browser handle.
6. If the child allocation returns null, the allocator's failed-request context
   cleanup occurs. The draw remains consumed. This tail does not retire the
   outer building or perform the success-only alias writes. If it returns
   nonnull, the tail writes the building's physical ID to child `+0x94`, then
   writes child physical ID `+0x24` to building `facs0_index`.
7. For ordinary immediate initialization, `004ed580` dispatches class 6 to
   retained `004fa530`; its exact model-9 case calls **`004fc330`** and returns.
   Only after that class initializer returns does `004ed580` apply its active
   flag, flag3 and timestamp writes. `004fc330` is absent from this selected
   export set. Its nested requests, membership, own fields or possible
   retirement effects are unproved. A nonnull return from `alloc_unit` must not
   be strengthened into an unsupported claim that this child is still live.

`00484a10`'s authored loop invokes its next record only after the current
allocation and postprocessing return. This proves the relative nesting of a
request that occurs here; it does not enumerate all other constructor or
postprocessing requests. Upgrade `004050c0` supplies the old associated value
to the successor constructor, so the nonzero-supplied path also matters. The
successor is allocated before old retirement; this packet does not change that
accepted contract.

## Delayed plan activation is already proved

The radius lane's [accepted static tail][activation] closes a previously open
numeric distinction without another decode:

- `004b8a47 → 004ed8a0` obtains the delayed class-2 record. Null skips the body
  initialization block.
- On success, plan `+0x92` receives body ID `+0x24`; conditional plan state
  initialization at `004b8a74` calls **`004ed640`**.
- The new body is then passed at `004b8a94` to **`004ed580`**, the type initializer
  and active-bit writer. This is not the preceding plan state initializer.
- After the attempt, the worker loop applies substate 2, restart flag,
  timer `0x15` and assignment byte `+0x76` bit `0x10`, including failed attempts.

The reused activation manifest SHA is
`2969a767229a42404849de1c8701136abc2e74f54b0dbd8347cf26c272d3935f`;
its independent membership review SHA is
`d19267857bd09da6767238ddb068f578ce3046c057db733da540b0e1a06624e0`.
The worker loop is also retained directly in `004b8470`; the activation review's
own interpreted-range limit remains unchanged.

## Class-9 availability and the real caller-test limit

An exact retained-source lookup finds concrete class-9 request sites:

- `004b9190` case 2 prepares shape/origin/model/rotation context and calls
  `alloc_unit(9,1,tribe,position)`. Null sets its failure guard; nonnull performs
  its plan registration calls, and later case-2 terrain writes use the plan's
  physical ID. The preceding `004ba7a0` and later registration callees are not
  audited here. This packet does not bind the entire UI route into case 2.
- `00498140` can request `alloc_unit(9,1,...)` for a body lacking a valid
  associated plan. On success it links body `+0x82` to plan ID, plan `+0x92` to
  body ID, and copies the model life word to plan `+0x96`. It is a separate
  body-associated plan path, not proof of the public placement route. Some
  position locals in this decompilation remain ambiguous and are not repaired
  by inference.
- `004ed580`'s class-9 target is **`004b8070`**, absent from the selected generated
  files and manifest. Its constructor/context/field ownership remains the exact
  missing class-9 body. The named request sites above must not be described as
  unavailable merely because their initializer is absent.

The actual port `placeBuilding → tick → prepareBuildingSite` route is therefore
a useful future transaction-consumer test. For a model-1 Hut, this packet
excludes the specific class-6 tail and reuses proved delayed activation. A
controlled supplied-state test could distinguish body rejection from success
and preserve post-attempt worker effects. It still cannot certify a complete
supported ordinary World: no proved shared slot owner feeds current plan,
person, scenery and effect requests, no class-9 constructor state is bound here,
and the existing opening fixture has no native slot history. Existing Save graph
preservation remains sufficient to carry a future owner and insufficient to
invent an older checkpoint's history.

**Stop:** for models 2/3 the next unavailable selected-export leaf is
`004fc330`; for the smallest ordinary plan-to-body consumer it is the class-9
constructor `004b8070` plus the supported incoming request state. Neither body
is decoded here. No detached allocator implementation or Swarm candidacy is
admitted, and native binary-save compatibility is not added as a prerequisite.

[events]: https://github.com/JohnDeved/populous-new-dawn/blob/e5aaa360427cc74b402c2280a71c5f52dc2e3d98/references/verification/swarm-class2-live-contract-2026-10-10/README.md
[activation]: https://github.com/JohnDeved/populous-new-dawn/blob/9694f1f2156c4c06a6128278f16c6eac1dd35ba2/decomp/research/selection-radius-source-20261010/membership/plan-activation/findings.json
