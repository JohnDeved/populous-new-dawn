# Raid phase16 target persistence

Refs #248. Static evidence checkpoint; no gameplay/parity credit.

## Result

The current **all-members command19 with matching payload** condition is disproved as the native phase-16 target-persistence contract. Native phase16 collects nearby enemy people/buildings independently of raid orders, performs per-person maintenance, and uses the returned ordinary-member visit tally plus the two collected list heads. It does not reduce persistence to a universal command-model predicate. A union17/19 replacement is also unsupported.

This is static source evidence only. It does not establish a full native/browser phase16 equivalence, an ordinary Mission1–3 witness, or a runtime fix. The distinguishing mixed raid is already known in Mission6; Mission1–3 reachability remains unestablished. The existing Mission6 raid continuation retains its original target world; target removal belongs to a separate conversion clone. Its missing assertion is the nonempty-list/retry invariant, not a raid-world target-removal case.

## Fixed inputs and method

- Inspected browser source: `721c3b08950fee0e19e4117bc7c516fe73d773c8`, obtained with `git show`.
- Actual checkout HEAD: `99f8a8907380fd2f3c8a3fe0e3f31fb13335a840`; clean before and after artifact preparation. The original static pass made no repository writes.
- Executable, verified before disassembly: `d3dpoptb.exe`; 2,275,840 bytes; SHA-256 `3a5065c7420b3fcde208bf220bc86dfbac95e025ab2492caf9c7ea5308dfbe4f`.
- Existing tool: `/usr/bin/objdump`, GNU Binutils for Debian 2.44. Only data-only `-d -M intel` and `-s` reads.
- Registered `004f5950.c` SHA-256: `9b8fa2dd911c1724077c688ffa7fac5dc0f5783374ba37ca99bbc1559c8e9585`, matching the file at inspected main. Existing `004df0e0.c`, `004f62c0.c`, and `004f2460.c` also match registered hashes.
- The [compact evidence manifest](../../references/verification/raid-phase16-static-2026-10-10/provenance.json) records input/source/tool hashes and the selected byte-preserving excerpts. The full 29-file local packet remains unchanged and is identified by its frozen hashes; it is not published here.
- [Independent review](../../references/verification/raid-phase16-static-2026-10-10/independent-review.md) accepted the static disproof with the precision corrections incorporated below.
- Read repository AGENTS, engineering skill, GOAL, engineering protocol, native-research protocol, and prior raid/defense evidence.

The original static pass performed no native/emulated execution, original-game launch, browser, package/dependency operations, tests, game-state injection, implementation, GitHub mutation, PR308 work, or QA-worktree changes.

## Caller graph and exact arguments

This is the ordinary task+0x26 == 0 path. Nonzero task+0x26 routes to `004cceb0` before phase dispatch. On the ordinary path, `004cb473–004cb546` can perform an assigned-state23 Preacher/Shaman assist before phase16. Both are actual-caller binding prerequisites; entry directly at `004cc112` does not prove those prerequisites.

```text
004cb400(tribe, taskIndex)
  task = tribe + 0x36 + taskIndex*0x52
  entity = valid lookup(task+0x32), or null
  phase jump table 004ccac4; phase16 entry at 004ccb04 -> 004cc112
    004f5950(tribe, task.target, buildings[10], people[10], 10, 7)
    visitTally = 004ce2c0(tribe, task, taskIndex+1,
                     buildings, people, entity)
      walk person = tribe+0x881; next = person+0x08
      004f2460(person, taskIndex+1): person+0xaf equality
      004f3b00(person): person+0x7f bit0 (special branch)
      004f2e40(task, buildings): possible task.target update
      person-model-specific maintenance
        model4: 004df0e0(person), possibly 004f62c0(person, 19)
        default/model6: state-gated per-person retargeting
        model5/model7/special-bit branch: separate engine leaves
    visitTally == 0 -> phase23
    buildings[0] == 0 && people[0] == 0 -> random search/retry update
    damage/retry/retreat/additional native task condition -> phase6/fallback23
```

At `004cb448–004cb46f`, the entity word at task+0x32 resolves through the object table `00890390`; flag+0x0c bit0 or class+0x2a == 0 invalidates it. Phase dispatch increments task+0x08 at `004cb54b` before jumping.

At `004cc112–004cc12e`, both stack arrays are zeroed to ten DWORDs. Call `004cc14a` passes radius7, independent cap10, person output at base-stack+0xa8 and building output at +0x80. Call `004cc172` passes those same arrays and the resolved entity to `004ce2c0`. Its EAX is saved as the ordinary-member per-visit tally (`004cc17a`), not a post-maintenance roster size or a boolean that all orders match.

## Result consumption: list emptiness and visit tally are separate

1. Count zero (`004cc17c–004cc192`) emits event0x33 through `0048c650` and sets phase23. Lists need not be empty for this exit.
2. With nonzero count, `004cc1a3–004cc1b9` tests **only** `buildings[0]` and `people[0]`. If either is nonzero, search/retry advancement is skipped, regardless of members' current order models or order payloads.
3. If both list heads are zero, `004cc1bb–004cc236` chooses a coordinate around task+0x1a, writes task+0x10 and increments the byte retry counter at task+0x2e. This occurs before the later damage/retreat checks.
4. `004cc239–004cc26c` retains phase16 unless one of these native conditions requires return: signed task+0x3a <= task+0; unsigned retry byte >32; signed truncated `(unsigned task+0x2b * task+0x36)/100 > count`; or task+0x2c is nonzero and tribe+0x596 bit0x04 is set. The last condition is retained by raw field identity here, without assigning an unverified gameplay name.
5. Return setup at `004cc272–004cc2f7` obtains staging through `004f6020`, issues per-assignment movement through `0043b2a0`, resets task+0x04, sets phase6/fallback23 and emits event0x34.

These ordering details differ from the current browser controller's early retreat test and entity/moved-target blanket reissue. No inference that merely deleting one predicate completes phase16 is warranted.

## 004ce2c0: count and Preacher commands

`004ce324–004ce352` filters the linked-list person by exact assignment, flag+0x0c bit0, and the special flag+0x7f bit0. The ordinary model branches increment a per-visit tally independently of successful order predicates. Model5 performs preliminary state/cadence work at `004ce5f7–004ce642` before its increment at `004ce645`. Models5 and7 can later clear assignment without decrementing the tally. The special-bit path at `004ceac2` does not increment it. Thus the return is neither a post-maintenance roster size, browser task.members length, nor the number of successful order matches.

The model table at `004cebf4` maps model4 to `004ce43d`, model5 to `004ce5f7`, model6 to `004ce7fd`, model7 to `004ce8c0`; other models use `004ce392`.

Preacher/model4 increments count at `004ce43d`. It has its own placement/latch maintenance, then calls `004df0e0` at `004ce4ca`. A recognized sermon command proceeds through the existing latch and 64-turn/id cadence before choosing a collected person, otherwise a building, and calling placement/sermon helpers. If the sermon predicate is false, `004ce571–004ce59f` calls `004f62c0(person,19)` and only then considers its separate flags/person-target fallback. A failed command predicate skips that person's optional maintenance; it does **not** invalidate the collected world targets or remove the already-counted Preacher.

Exact predicate contracts, confirmed by existing exports and instruction bytes:

- `004df0e0(person)`: requires native state10 or33; chooses nonzero immediate order+0x9b before queue+0x8b indexed by unsigned cursor+0xa6; requires an order record with cancellation bit0 clear; accepts command17,31,32. Returns boolean in AL.
- `004f62c0(person,model)`: identical state/current-order/cancellation gates, then exact model equality. Returns integer0/1. The phase16 Preacher fallback passes19.
- Neither predicate compares the order's target/payload fields. Neither is an all-members predicate.

The native phase15→16 mixed dispatch evidence in the existing `scripts/check-native-computer-attack.py:297–325` already establishes three command19 members and one command17 Preacher for its supplied mixed roster. That probe then clears membership, and it intercepts `004f5950`/`004f2e40` as controlled world leaves (`:203–204`); it did not establish phase16 target persistence. No such probe was run here.

## 004f2e40 is a coordinate selector, not a command predicate

Called at `004ce36e` on the first ordinary admitted member when task elapsed+0x08 is divisible by4. The local once-per-call latch is cleared after the call. Arguments are `(task, buildings)`; its EAX is unused.

`004f2e40–004f2f45` scans at most ten building IDs, resolves valid objects through `00890390`, and writes an even packed coordinate into task+0x10 using existing `00404420` building coordinates. A non-model4 candidate must match task+0x23. Model4 follows a special +0xa6/+0x86 related-object-model4-or6 condition. With no accepted candidate, the target is unchanged. Raw offsets describe that special case because its broader building semantics were not part of this assignment.

It neither inspects any raider's order nor returns the lists' presence. The caller later checks the original list heads even if this helper has changed task.target.

## Owner identity is a distinct browser mismatch

Native `004ce2c0` walks the tribe's actual person chain and passes the same person pointer to membership, flags, state, command predicates and order mutations. There is no alternate stale-person-first lookup. Immediate-over-queued order priority applies **within that person**.

At inspected main, `app/computer-runtime.ts:725` chooses `u.native ?? u.fight?.motion`, omits other retained owners, then reads a raw current order without the native state/cancellation gates and compares `order.a` to target. In contrast, `app/live-movement.ts:112` selects flight, fight.motion, native, entry, builder for ordinary appends; `issueLiveOrders` registers the selected person (`:272` onward). The accepted raid settlement code at runtime`:655` checks the registered object owner and explicitly allows fight motion to shadow stale native state. This is a concrete source-level owner-selection mismatch; its naturally reached symptom has not been measured in this pass.

Changing the precedence alone cannot repair the independent aggregate-predicate error. Changing to `unitAnimationSource` alone is also not justified: that presentation helper can intentionally return null for an active fight owner.

## Reusable collection and uncomposed boundary

`app/computer-defense.ts:68` already exposes `collectDefenseTargets(tribe, alliances, center, objects, maximum=10, radius=7)`. For supplied ordered cell contents it implements the existing registered `004f5950` contract: center first, then spiral indices0–222 for radius7; independent person/building caps; alliance handling; person-only model/state/flags/disguise exclusions; category traversal order. Existing `tests/mission3-defense-task.test.mjs:219` and `scripts/check-native-mission3-defense-task.py` contain the relevant supplied-input comparisons. They were read, not rerun.

The defense adapter currently calls it from runtime`:1378` through `computerResponseWorld` (`:1190`). That world adapter has its own source selection, filtering and native-cell/browser-list ordering boundary; the prior Mission3 defense note explicitly retains whole-world composition as a limit. Reusing the pure collector does not by itself prove that adapter suitable for every raid or that live raid membership/current owner matches native traversal.

Phase16 does not currently compose that collector with its native per-person maintenance. Its existing `computerAttackTargetsRemain` uses a distance-squared<=100 world scan and combines it with the all19 check at runtime`:1814`. Remaining work before a complete phase16 implementation includes the admitted-owner count (+0xaf, +0x7f), per-model maintenance and cadence, task-coordinate selector side effect, exact list-empty retry ordering, and appropriately bound current-world inputs. The existing defense retarget helper is native `0043b540` with0x0404 payload, separate from initial0x0808 group dispatch.

## Deliberate stop and unresolved dependencies

This pass resolves the phase16 caller/return/list contract, actual command predicates, and direct person identity. It stops before recursively recovering `004f5770` and `0043b790` (Preacher placement/sermon mutation), the model5/model7 and special-bit maintenance engine leaves, RNG equivalence, transport, spell behavior, or all world adapter producers. `004ce2c0`, `004f2e40`, and `004f3b00` were absent as registered exports and are retained here as exact bounded instruction bytes, not invented compilable pseudocode.

The independent static review accepts this bounded disproof. The next justified investigation is an observation of the existing scheduled Mission6 mixed-raid phase16 visit with production source unchanged: bind the pre-dispatch path, owner/admission fields, ordered hostile lists, return conditions and coordinate-selector side effect. Assert only that nonzero visit tally plus either nonempty hostile list does not advance empty-target search/retry merely because a member has17 or another payload. Distinguish the no-entity retry branch from the entity blanket-reissue branch. If the required owned fields or native-equivalent list are missing, retain that witness limit. No union17/19 patch or general raid-parity claim is supported.

## Routing and pre-dispatch admission supplement

A finite follow-on static pass against source `4754e12d3590bde18656416514871b033de164be` resolves the two named caller prerequisites. Its [compact findings and evidence](../../references/verification/raid-phase16-admission-2026-10-10/README.md) and [provenance](../../references/verification/raid-phase16-admission-2026-10-10/provenance.json) retain exact producer/consumer addresses and hashes. This does not turn the earlier disproof into a runtime repair or an actual native phase16 witness.

The actual ATTACK chain is opcode1059 → `0048fc50` → `004e5fd0`. Routing tokens1078/1079/1080 become0/1/2; allocator write `004e6291` stores that value at task `+0x26`. The allocator overrides it to1 only for target mode2 with a resolved class1/model7 target whose attached-vehicle word `+0x9f` is nonzero. Routing zero selects the ordinary controller; nonzero delegates to `004cceb0`, whose distinct phase table is outside this ordinary phase16 contract.

For phase16, `004cb473–004cb546` finds the first assigned state23 person in the tribe chain, then the last assigned Preacher (otherwise last assigned Shaman). With a helper it calls `0043b540` toward the state23 person's even-packed cell and unconditionally sets helper mask0x2 at `+0x14`, including on allocation failure. Both scans use exact assignment `+0xaf == slot+1`; they do not add deletion/special-flag, distance, current-order or cadence checks. Proving this prelude inactive requires a native-equivalent complete chain with either no assigned state23 person or no assigned model4/model7 helper.

The successful assist reaches shared payload preparation `00438730`, order release `004364d0` and attachment `00436d00`. Their world/cleanup effects remain uncomposed. The cursor is reset before release but reread afterward: `00436d00` takes its queued-order/`0043b010` branch only for a nonnegative signed cursor; a negative cursor installs an immediate order. Cursor preservation is unproved. Do not simulate this prelude by changing command17 to19 or assume its initial coordinate survives shared preparation unchanged.

Task `+0x08` increments after the prelude, before dispatch; phase0 resets it. The coordinate-selector cadence uses this incremented native visit counter. Current port `elapsed` is not evidence of that counter. The phase16 collector/tally snapshot must therefore be after the prelude and increment, while the resolved entity pointer comes from before the prelude.

The existing first Mission6 Chumara script has routing token1078 and target token1071. Its decoded native constructor consequently writes routing0 without the Shaman override. This is a source-derived constructor fact, not a retained route byte or complete-history observation. Current port `task.mode` corresponds to marker byte `+0x23`, and the task retains no direct `+0x26` or native visit-counter projection. Keep those missing captured fields unknown; do not substitute zero. Assigned-person/special-flag ownership, exact lists, native cadence and prelude exclusion/composition remain admission gaps. Mission1–3 mixed-phase16 reachability remains unestablished.
