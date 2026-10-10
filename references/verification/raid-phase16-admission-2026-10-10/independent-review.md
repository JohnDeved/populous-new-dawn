# Independent review: issue248 route and prelude extension

Reviewed original findings SHA-256 `29caecbbc07b90f6f102778ebbd7528379c16d497bcc04105318d1ea4c10aaea` against source `4754e12d3590bde18656416514871b033de164be`, canonical EXE SHA-256 `3a5065c7420b3fcde208bf220bc86dfbac95e025ab2492caf9c7ea5308dfbe4f`, and the earlier accepted packet.

**Final verdict: ACCEPT revised findings SHA-256 `94d4c38ea671048b1d5e48e6ee3a91e1383b028eced1208d4952bfc089a64de8` for the bounded route/prelude/counter and shared-owner boundary contract.** The author incorporated the single precision correction below. I independently inspected the one-paragraph diff; original findings remain retained as `findings.before-review.md` with the originally supplied hash. All28 revised inventory entries verify. The source/disassembly artifacts are unchanged.

Independent verification reproduced all24 artifact-generating reads (five bounded data-only objdump calls and19 git-show reads), verified all26 inventory entries, matched all12 registered exports and seven reused accepted inputs, checked the exact EXE/tool identities, and confirmed the ordinary-entry bytes agree with the earlier accepted packet. Historical checkout remains clean at `99f8a8907380fd2f3c8a3fe0e3f31fb13335a840`. No native execution, emulation, simulation, tests, runtime changes or publication occurred.

Accepted findings:

- Recognized ATTACK routing tokens1078/1079/1080 decode to0/1/2 and reach allocator argument10. The allocator explicitly writes its low byte into base+0x5c, which is task+0x26. The mode2/class1/model7/nonzero resolved-target+0x9f condition can overwrite it with1. Routing1/2 sets task+0x29 to1/3. This is distinct from task+0x23 and the port's mode field.
- Nonzero routing delegates and returns before the ordinary path. Ordinary routing resolves the entity first; phase>5 then finds the first assigned state23 person, the last assigned model4 and last assigned model7, and prefers model4. It adds no deletion/special-flag/order/distance filter to either scan. The selected helper receives the state23 person's packed even cell through0043b540; mask0x2 at helper+0x14 is set regardless of helper return.
- Counter+0x08 increments after the assist and before dispatch, with phase0 resetting it. Native phase16 cadence consumes this incremented controller-visit count. The port's phase6 elapsed field does not prove it.
- Known Mission6 constructor routing zero is valid only conditional on that decoded1078/1071 invocation and successful allocation. It is not a captured byte or full-history invariant. Prelude exclusion requires the assignment/state/model chain, not a task-members array or command mix.

Resolved precision correction:

`decomp/generated/00436d00.c` branches on signed `param_3`. Nonnegative values attach a queued order and call0043b010. Negative values instead replace/install an immediate order and do not call0043b010 on that branch. Although0043b540 writes cursor+0xa6=0 before releasing orders, it rereads the cursor at0043b640 after the uncomposed004364d0 calls; those in turn call00501be0. This finite proof does not establish cursor preservation across that boundary. State the direct call as00436d00(person,newOrder,currentCursor) and retain both callee branches conditionally. Do not state unconditional queued attachment or order-start composition.

The revised findings now state those conditional branches and explicitly retain the cursor-preservation gap. No further trace or execution was needed.

The remainder correctly stops at shared preparation/release/attachment owners. Final payload, cleanup, RNG and state-transition effects remain unproved. The earlier per-visit tally and world-list limits remain in force; no ordinary Mission1–3 impact or runtime repair is accepted.
