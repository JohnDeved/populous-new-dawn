# Swarm class-2 lifecycle: finite static decision

**HOLD runtime implementation.** Authored allocation/relocation and replacement/removal ordering now have concrete source closure. Exact remembered identity still depends on the absent shared primary-slot owner. A class-2-only chain cannot supply native cross-class slot reuse. No generation, never-reused-ID, logical-building-ID, legacy reconstruction or new compatibility policy is accepted. No application changes were made.

Base: `d6cf109474379172728a3ccebf46ef72a15f3a58`. This supplement leaves research commit `74b74346f2d67e94aed013fc9e1960e20ef36ceb` and all earlier immutable findings unchanged. It follows the accepted design assessment and review `class2-projection-review-20261009.md` (SHA256 `f8bd52ed81ffeac4d84f9837486cbbc513d9a7c03eb55eb5413bc74c26f9a495`), whose implementation hold remains in force.

## What is closed

### Authored versus deferred relocation

`00484a10.c:174–249` reads 20 blocks of 100 authored records, advancing by 0x37 bytes in file order. The class-2 branch creates allocation metadata containing rotation, state 2 and object override -1. Assembly `00484f70–00484fd5` records that branch; `00485011` calls allocator `004ed8a0`; `00485038–0048504a` advances the record/block loops.

`004ed8a0.c:116–125` transfers the metadata flag to flags2 0x400 and initializes the new object before returning. `00403610` first inserts its input position (`0040364b`), consumes that metadata (`0040366c–00403683`), initializes the supplied state, clears the deferred-relocation flag (`004036ce`) and calls `00403d50` immediately (`004036d6`). Thus each authored building completes input-position insertion and model-origin relocation before the next authored primary allocation. A blanket second pass that relocates all authored buildings is incorrect. Filtering these sequential list operations to class 2 is valid; assigning arbitrary numeric IDs is a separate question.

Ordinary construction also supplies metadata: `004b8470.c:302–339` postpones initialization only across its allocation call, attaches the plan/building relationship, then explicitly initializes the building before this producer returns. The port hook is `prepareBuildingSite`'s `action === 'allocate'`, not class-9 plan append. Upgrade `004050c0` similarly supplies metadata. All three researched producers therefore perform immediate model-origin relocation.

The no-metadata branch `004036fd–00403716` leaves flags2 0x8000000 set. Its next eligible class-2 visit clears the flag and relocates (`00403280.c:16–25`). `004ec6f0.c:91–100` visits the allocated list; `004ed8a0.c:70–78` prepends allocations. This deferred branch is real, but should not be invented for the three metadata-bearing producers above. Other producers are outside this finite pass.

Later loader passes matter: `0048506a` calls `004866a0`, which can replace an old class-5/model-9 Vault representation with class 2; `0048506f` calls retained `004edf50`, which can detach linked templates while leaving their class nonzero. These are membership transitions, not an HP/completion filter. Static Mission 3 data contains class-2 indices 0 and 104; its two trigger link sets point to class 6/model 2 and class 7/model 23, not either building. Its Vault is already authored as class 2. This does not establish generalized later-mission membership.

### Vault correction

Withdraw the earlier different-cell implication. M3 trigger 91 at (-37,-133) and Vault 104 at (-38,-132) both have coarse cell (113,62) and anchor (57856,31744). `app/vault-geometry.ts:10–20` deliberately recovers that common anchor. The remaining requirement is separate class-2 identity and model-origin geometry, not an observed cell mismatch or rendering defect.

### Replacement and reuse

Upgrade allocates the replacement first (`004051fe`), branches away on failure (`00405208–0040520a`), then retires the old object (`0040523e`). A successful replacement must receive a distinct allocation identity while existing browser commands may retain their logical building ID. Failed allocation must leave the old identity/membership alive. Mutating one query identity with the browser `b.id` would alias the new building to the old Swarm target/history.

The previously absent retirement body is now decoded. `004edcf0` splices the cell links when present (`004edcf7–004edd73`), sets class 0 and deleted bit (`004edd7f–004edd83`), moves the record from the allocated list to the retired list, and sets its byte counter to **3** (`004eddbe`). `004ec6f0.c:130–144` decrements that counter each main-loop visit and returns the record to the free list at zero. The record's 16-bit index is preserved by subsequent allocation (`004ed8a0.c:79–94`); allocation clears the old data and assigns the new class/model/tribe. This is a three-counter-decrement quarantine, not a guarantee of three full elapsed turns or protection for Swarm's normal 200-turn lifetime.

Generic deletion's class-2 table word at `004ef71c` is `004ef1dc`, which calls `00403820` at `004ef1dd`. Building deletion reaches the same retirement routine at `0040384c` after building cleanup. No whole allocator reconstruction or original execution was performed.

## Exact original-backed subset and why it is insufficient to ship

With lifecycle events and allocation identity supplied, a separate class-2 linked chain can exactly preserve acquisition order. Its valid operations are prepend on insertion, splice on removal, no reordering for same-cell movement, and remove/prepend for a cell crossing (`004ee470/004ee4f0/004ee580`; existing `app/object-cells.ts`). The supported original controller then uses the accepted spiral, origin, history and pursuit/ejection order. Person-owned cells can remain separate.

That proof does not make arbitrary query tokens native identities. Concrete observable mismatches are:

1. A remembered building is retired, its slot is reused, and phase 2 visits after reuse. Original lookup checks only nonzero class and no deleted bit. A generation token would reject a replacement that original lookup accepts, including another class. This note makes no claim that dereferencing that other class is safe or sensible; it is the observed validation rule.
2. A building ID in ten-entry history is retired and reused by a new building. Native raw-ID comparison can suppress the new candidate. Generation-aware history would allow it.
3. Upgrade success with unchanged logical `b.id` would redirect pursuit to the new object instead of invalidating the old allocation; generation replacement fixes this case but changes cases 1 and 2.
4. Building-only slot allocation changes which IDs are reused because persons, effects and other primary classes compete for the original pool. Matching a local three-count delay alone does not fix the allocation stream.
5. `ObjectCells.heads` is `Uint16Array`. Unbounded monotonic IDs cannot be passed through it without truncation; widening the data type would still not establish native reuse semantics.

The exact prerequisite is a source-reviewed mapping from live primary allocation/retirement events to the shared original-style 16-bit slot registry, including free/retired ordering and lookup after reuse. This need not reproduce native memory addresses, but it must preserve the observable identity decisions above. The current port's `buildingId` explicitly uses a separate ten-bit terrain-handle adapter; the person map and secondary-effect pool are not that shared owner. This pass stops at the prerequisite instead of reconstructing the full allocator.

## Actual live retirement and membership hooks

- `app/world-turn.ts:1232–1247`: successful hut upgrade replaces the native allocation while retaining one logical browser building. New query allocation must precede old retirement; the failure branch requires a corresponding real outcome.
- `app/building-runtime.ts:120–153`: terrain-collapse destruction callback retires the building; its class-10 sinking visual must not keep class-2 membership alive. Native `00406f40.c:22–44` creates the blast/sinking object before retiring the building.
- `app/building-runtime.ts:282–286`: damage/collapse `removeBuilding` callback.
- `app/live-building-entry.ts:561–564`: dismantle `removeBuilding` callback.
- `app/live-building-combat.ts:746–748`: direct plan/building destruction callback; class-9 plans have no class-2 membership to remove.
- `app/world-turn.ts:1732–1762`: final dead-building cleanup catches existing paths that end the browser record. This port cleanup is not proof of native death timing; do not convert the acquisition predicate into `hp > 0` to hide that distinction.
- `app/construction-runtime.ts:337–343` and `app/computer-runtime.ts:883–887`: remove unallocated plans. They must not remove an unrelated or reused class-2 allocation.
- `app/armageddon.ts:112–121`: direct building/shrine clears must clear owned class-2 membership together; the spell also replaces the active effects list.
- `app/game-store.ts:367–376, 443–451`: world replacement/restart/mission start transfer ownership to the new world. Old query state must not remain globally attached.

Neutral Vault lifetime is a second concrete producer gap. Native task `0043c7a0.c:266–279` changes the building to state 5 on close, installs the 40-count close sequence, and retains class 2. `00407060.c:13–27` lowers height by six per eligible visit only after its gate, then retires below -799. The port `app/vault.ts:209–219` only records the close morph, and `app/scene-entities.ts:776–805` renders it without a simulation retirement event. `shrine.active`, reward consumption or morph completion cannot stand in for the original class-2 lifetime. A complete membership producer needs a small explicit state-5 owner and its real retirement event, with source-bound timing, before this neutral candidate can be treated as exact.

## Save and person-owner boundaries

For new state, `structuredClone`/IndexedDB can preserve the complete chain, slot-owner mappings, free/retired lists, pending movement/lifetime state and Swarm target/history together (`app/game-store.ts:425–440`). Valid saved links must be loaded without sorting or replaying insertion. Validate owner identity and chain consistency together. A fresh restart can regenerate authored events in native source order.

Existing saves contain no class-2 allocation/relocation/replacement history. There is no source-backed exact recovery from current building arrays. No bootstrap policy is chosen here. A future legacy migration needs an explicitly accepted compatibility limit; it cannot be counted as restored native ordering, and it must not replay campaign startup. The currently accepted save behavior remains unchanged while implementation is held.

The parent reports a model-only M3 Temple window with living Brave 2631 owned by `u.entry.person` in slot 0 at turns 2121–2240. This is a feasibility lead, not cast/selector proof and not independently rerun here. The exact-person panic contract applies to that retained owner. Later occupied Hut slots may have no retained person owner; `context` can reconstruct `person(w,u)`, and `cancelBuildingEntry` can drop the entry adapter. Never present a newly constructed empty queue as preserved native queue state. Future ordinary coverage must distinguish an existing owned person from a reconstructed resident explicitly.

## Required future checks, not executed here

Authored immediate relocation and any genuine deferred case; reverse plan-creation/allocation order; same/cross-cell order; neutral Vault close/retirement; upgrade success/failure and old-target invalidation; three-count retirement and same/cross-class reuse; raw history suppression after reuse; save/load before and after retirement; the explicitly chosen legacy policy; physical occupant slot order and retained person/command ownership. The ordinary M3 Temple episode must then show a genuine earned cast, actual production selection and ejection while preserving the existing person-cell consumers and RNG stream.

Only static source reads, JSON/data comparisons and bounded objdump decoding were used. Raw excerpts, decoder identity and before/after canonical-EXE hashes are retained beside this note. The first loader window begins mid-instruction and the terminal bytes of some windows are partial; no claims use those fragments. No original game binary, decompiler, emulator, model, browser or game tests were executed.
