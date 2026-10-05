# Vault acquisition driver: absent-recipient repair

**ACCEPT for one fresh candidate-acquisition-2 row.** Coordinator lane, frozen
inputs, closure ownership and prior-browser/server cleanup remain prerequisites.
This does not accept an ordinary browser acquisition result before execution.

Application source remains clean `ef62e48f07834cddcb543969a7afab5c77a84f4a`.
The reviewed diagnostic-only delta is:

- scenario `a6b302d59a996cdf45bd7007971508472c03e63feaf3a502b77c2ce3b0566321`;
- witness `a0792c14ff9ecd8b6806884579c43af22e1c3af868c09f9fad0ac30db497072b`;
- unchanged checkpoint helper `67bca92dc66241223b5ef72aafcf86d45737e0cdf3449435cf0b63f2923646ea`;
- launch plan `2227aae9f0d2512e8f3b30852a09cc5912b1195d52f6fa1d4d1fa15dde5f49c9`.

All files are under `work/orchestration/vault-hfx/driver/`. Full source/input/log
hash verification is retained in `verification.json` beside this review.

## Findings and repair

The previous accepted driver had a genuine observer defect: it required
`gift.recipient === playerTribe`. Existing `createGift` sets recipient only for
ordinaryWorship gifts. Mission 3's authored mode-4 Temple gift has neither that
ordinaryWorship field nor an own recipient property. The initial stub-only test
did not expose this production variation.

The retained failure-first regression now runs `createWorld(3)` → normal Vault
command → actual fixed-turn processing → real `createGift`, with the old observer
installed. It fails on observer giftId null versus actual gift 3141. With the new
observer, the same real path is detected at remaining 82/phase 6. The old failure
and new five-test pass receipts are source-bound to the unchanged app head and
explicit witness/test inputs; their before/after and raw log hashes were verified.

New eligibility positively requires Temple reward, HFX body 1079 and the introduced
`vault-knowledge-glow` sequence. Within the existing fresh Mission 3 row and its
authored Vault predicate, this identifies the intended presentation without
requiring the unrelated ordinary-spell recipient tag. It is not a generic gift
fallback. Subsequent birth/HFX/render/retirement/payout assertions remain unchanged.

The failed browser-acquisition-1 receipt remains failed with its original 300s
wait timeout. Frozen copies of its old scenario/witness retain the previously
reviewed hashes. No old snapshot or PNG is relabeled as newly observed acquisition.
The new host regression proves the observer defect; it does not retrospectively
prove that the old browser row completed acquisition.

## Input and route diagnostics

Before the long wait, the revised scenario observes a living Blue Shaman and an
unpaused world. It waits past the last order turn, performs the same public Vault
pointer click, and then requires a fresh lastOrderTurn, matching/increased Scene
pointerAck, Shaman work equal to the Vault ID and a matching VaultTask with phase
at least 1. These are additional ownership observations beside the queued native
PersonOrder. Correction after inspecting the complete live path: mode33 enters the
earlier queued branch at `live-command.ts:515–560`, and `appendLiveOrders` does
allocate its PersonOrder. The final live row records model33/target92 throughout
the route. My earlier explanation read the later fallback branch too narrowly.
The driver never required PersonOrder absence, so its assertions and observed
result remain valid. Its frozen diagnostic label is retained unchanged as raw
evidence; that label's claim of no allocation is incorrect. Scene pointer
acknowledgment is sourced from the ordinary input consumer.

`readVaultProgress` only reads existing World/Scene fields and copies small
diagnostic objects. It invokes no command, terrain sync, renderer or clock helper.
The host polls every 100ms, writes bounded progress samples at 10-second intervals
and on birth/deadline, and fails promptly if the observer reports an error, the
world is paused or the Shaman route ceases to be viable. This improves failure
diagnosis without controlling the route or altering gameplay.

The prospective birth→retirement→payout observer, exact turn snapshots, real-render
pixel capture, callback once/receiver/argument/error behavior, ownership-aware
restoration and public Save→reload→Load Game path are unchanged from the previous
accepted driver. A missed transient birth render still fails its visibility
assertion; turn samples cannot substitute for missing body pixels.

## Bounded launch and verification

The updated plan contains exactly one new ephemeral acquisition-2 row, with fresh
output/TMP paths and the three explicit input hashes. It retains the 300s acquisition
deadline, 420000ms harness cap, 440s outer timeout with five-second kill grace,
CPU 0–3 affinity, maintained harness, same prerequisite browser and port 4363.
There is no persistent profile flag, dependency/profile guard modification or
application mutation. Port reuse remains contingent on prior owned descendants
and listener termination.

I reviewed the full delta against the frozen old driver, current source consumers,
the real-mode regression and both failed/passed source-bound receipts. Five tests
pass, including the actual mode-4 path and progress-read purity. Those receipts
were reused rather than rerunning expensive/native/browser work. No browser was
launched and no dependency/resource move was performed by this reviewer.

The narrow driver repair has no blocking finding. Actual retry reachability,
rendered body/glow availability, exact lifecycle samples, checkpoint continuation,
browser errors and cleanup must still be reviewed after the single finite run.
