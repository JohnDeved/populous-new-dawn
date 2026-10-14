# M17 registered route owner cell-chain repair

## Genuine failure

A fresh public M17 retry on merged `5fad3dbc52b52cd93516a3114d527ceac63f95ec` earned and cast Armageddon. Starting from actual turn5355, the strict observer stopped at6055: cell13031 named missing registered owner4088. Red Brave4088 was still alive23.5HP; Yellow Brave8384 occupied the damaged chain. The original failed campaign receipt remains under `history/`.

The observation-only setter trace proves that the retired encounter's route record still aliases its registered physical person. `stepLiveRoute` copied newXY directly, crossing13031→13032 without relinking. Later retirement unlinked using those new coordinates and deleted the registry entry, leaving the old cell dangling and changing the wrong head. A separate plain replay without observation hooks reproduces this exact6055 corruption and deep-equals the derived6052 fixture state. Independent serializations have different byte hashes; no byte identity is claimed.

The genuine5355 and derived6052 inputs are preserved in `references/fixtures/m17-route-cells/`, with hashes in tests/receipts. No actor, resource, order or canonical checkpoint was patched.

## Repair and native source

Tested candidate: `3de90382ebfaccad0628b5be0198a1a082763b58`.

Only an actual linked registry alias uses the existing physical cell mover during the existing route-coordinate copy. Unlinked, route-only, nonmatching registered aliases and native-owned cases preserve prior behavior. Route advancement/completion, counter assignment, record identity and allocation/RNG semantics are unchanged. No global cell rebuild or tolerance relaxation was introduced.

Static original004ee580 confirms old-coordinate unlink, new-cell insertion, then coordinate copy; same-cell ordering is retained. EXE/assembly/tool provenance is retained beside `decomp/research/registered-route-cells.md`. Original binaries were never executed or emulated. The original native contract supports the existing cell mover; this repair does not claim complete native actor lifetime or scheduler parity.

## Independent actual-clock replay

`public-replay/arena-cells-corrected.*` starts again at exact5355 on candidate3de90382, not from corrupted6055. It advances1100 complete actual-clock frames through6455 with no new inputs. Every occupied cell head/member must be registered, have the matching coordinate cell and previous link, carry linked20000, occur only once, and every linked registered person must be reachable. Every live person's exact native/browser pose checks and complete Save/Load twins also pass each frame.

At6455 counts are Blue39, Red16, Yellow0, Green0, with phase2/mask32 and status playing. This is bounded lifecycle integration, not a mission victory or complete AI claim.

## Gates and limits

Final source-bound gates: full `npm run check` **2624/2624 pass**, including typecheck/parity/orchestration; focused22/22, build, changed-file ESLint, format and Fallow advisory pass. All407 root test-file hashes match tested3de90382. Raw full-app Oxlint exits1 with1408 inherited diagnostics; normalized baseline comparison has zero additions/removals. That raw failed lint receipt and consequent outer-script exit1 are retained, separate from the passing test aggregate. The initial supplied-control test failure expected signed rather than native word-masked coordinates; that observer correction and both raw outputs are retained. Existing test expectations were not changed.

No rendered capture was requested for this cell-chain ownership boundary. CPU actual-clock campaign lineage, exact registry/list invariants and independent replay are the integration evidence. No rendered-pixel, hardware performance, complete original AI or arena outcome claim follows.
