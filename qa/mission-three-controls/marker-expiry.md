# Ordinary Mission 3 ground-marker observation

Run01 at `6284a5133d741deca7ac278b95747c0ad20affbe` remains **failed**. It reached
ordinary Vault knowledge at turn1280 (milestone screenshot1292). The return-home
input at18:17:39.015 UTC targeted `(35.0094554,81.0270468)`. At18:17:39.881 the
checker rejected a missing current ground marker after passing its fresh
dispatch/ack and selected-recipient correlation checks. The paused diagnostic at
turn1430 retained selected Shaman46, `lastOrderTurn=1407`, pointer acknowledgement
`{target:0,until:126882.33333333333}`, native order3 with `a=11010,b=42745`, and
`effects=[]`. The exact pre-assertion snapshots were not retained in this first
version; the repaired driver logs both before asserting.

The866ms host interval exceeds the actual marker lifetime. This is consistent
with ordinary expiry; Run01 did not itself observe the transient marker and is
not upgraded into proof. `scene-input-runtime.ts:378–381` allocates the marker
after command success. `command-context.ts:84–85` places it at the native coarse
cell center. `world-effects.ts:112–134` assigns four turns and a secondary owner.
`hut-smoke-runtime.ts:92–98,122` expires and removes it in the secondary pass;
`world-turn.ts:563` excludes it from primary effect aging.

The repair copies real secondary-owned markers during the existing nonthrowing
afterTurn observation. It retains allocation identity/serial, observed turn,
dispatch turn and position in a bounded512-entry per-epoch window with a monotonic
cursor. The driver also verifies that the observer still belongs to the current
scene and World. A historical witness must be newer than the pre-click cursor,
belong to the same epoch and fresh command turn, and match the requested coarse
cell. Fresh dispatch, pointer acknowledgement and matching selected native order
remain mandatory. A never-observed marker, stale same-position allocation, or
different reload epoch cannot satisfy acceptance. No effect lifetime, clock,
World, command or pointer state is changed.

The focused temporal regression first failed against the previous observer with
the same missing-marker assertion (15 passed,1 failed); repaired checks also cover
absent ownership, bounded history and non-mutation. This plain-JS fixture supplies
observed temporal states; it does not simulate the game or establish replay
success. A fresh reviewed ordinary browser run remains required.

Run01 closed through an ordinary UI checkpoint at turn1440 and an explicitly
requested finish of the already-failed run. Its expected missing-milestone finish
assertion and original marker failure are both retained. Session86421 ended1;
inner/outer receipts failed with unchanged source and browser errors`[]`.
Port4366 refused connections and no owned runtime remained at18:19:50 UTC.
