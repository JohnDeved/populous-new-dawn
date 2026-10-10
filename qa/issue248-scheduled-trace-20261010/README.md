# Scheduled Mission 6 phase16 diagnostic

The unchanged port naturally reached a mixed raid and repeatedly replaced its
live-target orders. **The overall run FAILED** on the fourth phase16 observation;
independent review accepts only dispatch7637 and the three complete guarded visits
7640/7643/7646 as bounded port evidence. No production fix or parity credit follows.

The [compact observations](result.json) separate actual controller callbacks,
returned actions, dispatched orders and RNG. The [receipt projection](receipt.json)
binds hashes, limits, terminal status and earlier failures. Raw worlds and full cell
histories stay local. The [independent result verdict](result-review.md) states the
accepted prefix and failed-run boundary.

## Actual scheduled path

Tested source was [485ed5c3](https://github.com/JohnDeved/populous-new-dawn/tree/485ed5c3aeae59ae2756685786555c2bbfc75d13),
with production unchanged from main4754e12d. One default-seed `createWorld(6)` kept
both authored opponents active and advanced only through `tick(1/12)`, campaign
rules, task scheduling and the actual attack controller. There were no checkpoints,
injected people/tasks, AI setting changes, browser or native execution.

Chumara allocated task slot2 at turn6475. Dispatch7637 produced shared command19
for Warriors377/378/540 and command17 for Preacher455.

| Turn | Actual controller result | Target | Dispatcher orders | Retry |
| --- | --- | --- | --- | --- |
| 7640 | Entity291 resolved to a new task target; targetsRemain was short-circuited | 12858→13372 | New shared219 and Preacher220 | 0→0 |
| 7643 | Four living members; targetsRemain(13372)=false | 13372 unchanged | Replacement221/222 | 0→0 |
| 7646 | Four living members; targetsRemain(13372)=false | 13372 unchanged | Replacement223/224 | 0→0 |

At7643/7646, registered-cell and defense-adapter candidate collectors both returned
ordered people `[281,291,292,95]`, buildings `[]`, cap10/radius7. The member commands
were19/19/19/17. All old predicate owner reads matched the registered owner in this
prefix; no stale-native owner mismatch was observed here.

The controller returned replacement attacks, retained phase16/retries0, made no
random callback, and left RNG unchanged. The actual dispatcher allocated new order
IDs and changed RNG afterward; the later remainder of the turn changed RNG again.
Those effects are separate in the projection. This is live-entity blanket reissue,
not a measured no-entity search/retry failure. Warrior payloads remained
`a=13372,b=0x0808`; the observed Preacher payload was `a=32896,b=13440`.

## Failed fourth observation

At7649, before the fourth controller call, the live-world equality guard passed but
the detached-input V8 byte guard failed. Execution stopped, exit1 after25.01s. The
preserved1,458,021/1,459,082-byte captures decode to deep-strict-equal values. Further
read-only review found no ordinary object-reference/key/order/value differences,
but22 typed-view layout differences across26 views and backing-association
differences involving footprints.positions/totals. Deserialization can use the
capture buffer or aligned pooled storage; original backing identity and semantic
mutation remain unresolved. This is not a proved serialization-only false positive.
The strict rejection and failed-run classification remain intact; no further run
was made.

The earlier mission attempt stopped at7637 without an accepted phase16 visit. Its
extra query could call `nativePosition → syncNativeTerrain`; that hazard was removed,
but the earlier exact mismatch remains unproved. A controlled test then initially
failed imports before its cases ran; after path correction all four observer-purity
cases passed. None of these failed attempts was erased or relabeled successful.

## Native boundary

The [accepted static contract and route/prelude supplement](https://github.com/JohnDeved/populous-new-dawn/blob/48e026922b62a75d1b964a8292cccc3aa833bde1/decomp/research/raid-phase16-target-persistence.md)
separates target lists, per-visit tally, model-specific maintenance and coordinate
selection. Routing0 is established only for the script's native constructor, not
captured task history. Route+0x26 and visit-counter+0x08 are not retained here;
port mode/elapsed cannot substitute for them.

Every raider retained computerAssignment0 and unknown nativeFlags7f. Consequently
the native admitted tally, full tribe-chain/prelude exclusion, exact native list
ownership and selector cadence remain unproved. Candidate buildings were empty;
the observed target change followed the entity callback, not a composed native
coordinate selector. Mission1–3 mixed-raid reachability/impact remains unknown.
An order-model union or owner-precedence edit is not justified by this diagnostic.
