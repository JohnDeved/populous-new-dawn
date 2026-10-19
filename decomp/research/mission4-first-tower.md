# Mission 4 first ordinary Matak Tower

Refs #256 and campaign #8. This is the first playable construction prerequisite,
not an implementation of the omitted Mission 4 raid script. It builds on the
separate stored-origin adapter support in PR626.

## Retained source contract

Imported cpscr013 SHA256
`d0f72bd1d35fcc24f0529edce9d7d87df9ad96ae22607dbd64e11cad818f76fe`
has a turn-zero body ending at word299. Opcode1069 at words13–16 sets `(216,56)`
through `0048cc60` case0x29 → `004f5280`: AI flag0x20 and coordinate latch0x38d8.
It is not a construction-base setter. Attribute writes belong to `0048ef00`;
startup sets construction state0, attribute9=1, housing target10=0, school
target3=1 and rotation attribute30=0. Later opcode1173 writes spell intervals,
not construction attributes. No additional recurring script ranges are enabled.

The imported Matak roster is six Braves plus unique Shaman object14 at(-81,-63),
loaded cell0x36b6, with no Matak buildings. `004e5580` obtains the stored/established
origin via `004f6020`, checks construction count against attribute9, and attempts
the Tower prefix. `004f5e80` → `004627f0` requires state0 and the `004f67b0` count
of at least two idle, nonbusy non-Shamans (`004f5d20` returns2). Housing-order
availability is a separate training count and must not satisfy construction.

The two Tower branches retain their order: request when no counted Tower exists;
otherwise, if no base exists, request only without an active type0/model4 task
at any phase. `004f6480` counts building-list owners, qualifying class9 plans and
active phase<3 tasks. The second branch's any-phase pending exclusion does not
block the first branch if its plan/building has gone. No synthetic one-shot flag
or permanent ban on rebuilding is introduced. Flag0x400 disablement reuses the
accepted Mission2 native probe/finding; the `004f2e00` body is not retained here.

`004c6da0` phase0 applies the coordinate latch to a non-exact Tower search, keeps
mode1 with attribute30=0 and draws one orientation RNG value. Accepted Tower
plans enter phase3; `004b9fc0` provides their exterior point. The masked-even
point establishes the base and clears radius before worker recruitment or
completion. Exact placement never establishes it, existing base0 is authoritative,
and later cancellation/destruction never clears or relocates it.

## Bounded implementation and evidence

Only Mission4 Matak gains that Tower producer prefix. Existing site search,
selection, orders, movement, timber and building controllers execute unchanged.
Construction takes the immutable loaded cell or existing saved base, including0.
Schools, housing, training profiles, ATTACK statements, selection-radius history
and producer scheduling remain outside the change. The native pre-table type9
producer is still omitted in this mission, so exact native queue slots, whole
RNG trajectory and original Tower timing are not claimed.

The controlled caller tests retain separate supplied states for gates, pending
plans, replacement and phase3 ownership. Initial failure-first run had8 intended
failures and10 passing controls; the implementation passed all18. Added boundary
controls and the maintained ordinary regression require their own final receipt.

The ordinary diagnostic used unmodified createWorld(4) and actual advanceGame
at1/12 second, including its logical and visual animation calls. Hooks invoke
production startPendingWorshipAcquisitions after each turn and
visitWorshipAcquisition on the actual UI schedule. No player commands, entities,
resources, orders or turns were injected. An assertion-only bridge rejects any
unexpected active reward geometry/cue; none occurred. Renderer, DOM and motion
interpolation are absent, so this is a bounded construction simulation witness,
not full-game/rendered equivalence.

The first observer failed at turn67 after construction correctly moved person
ownership from unit.native to builder.person. Its receipt is retained. Independent
review accepted the observer-only repair using production unitAnimationSource;
runtime and the10,000-turn/120-second cap were unchanged. The one authorized rerun
passed: request at observed turn61 (host60), accepted plan/checkpoint62, base0x34da
at63, actual builders13/12 with order6 at67, progress0.2 at365 and Tower110 complete
at862. The diagnostic compared units, buildings, AI, orders, RNG and worship at
initial/every64/final checkpoint boundaries. That diagnostic subset does not
certify all World fields; the maintained regression separately requires full
World equality at those boundaries, including terrain, scenery and resources.

Ignored source-bound receipts and the original failed observer remain under
work/orchestration/mission4-tower. Independent source-plan, implementation and
observer reviews accepted the bounded contracts. Full check/build, browser gates,
original runtime execution, cached native list/count timing and every class9
alias state remain separate. Ordinary Mission4 raids are still blocked by the
omitted original producers/ATTACK script, as documented on PR626 and issue256.
