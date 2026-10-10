# Independent static review: issue248 member lifetime

**ACCEPT** frozen findings SHA-256 `01d618aebc971d04688e60c560f4e0f91535ab338e1f445e1825146a18f60cbe`, provenance `831f6d51770c996487a38a6a4ecbabb7e1022aee6a8a792022ddc9252b4b91c2`, inventory `de63abf4b5a7a5ab5e721ce3176bb5ce34bf46323b653cdc66b0a40accb9ca1f`, inspected source `4754e12d3590bde18656416514871b033de164be`.

## Accepted source facts

- Native phase3 finishes quota/fallback selection, requires cursor7 and nonzero task WORD+0x0c, then visits every tribe-chain person currently in state14. It calls004f2440(person,index+1) regardless of returned-ID membership, previous owner, model or special/deletion flags. A zero selected counter takes phase23 without admission. A returned candidate whose transition is blocked is not admitted unless it is actually state14.
- Helper004f2440 clears only+0x7f bit0 and writes the low assignment byte. A zero owner additionally clears+0x14 mask0x2000. For admission the caller ORs0x2000 only when task+0x31 bit0 is set, preserving any previously set bit otherwise. Task+0x31 bit1 can select phase7 instead of4.
- Selection-lock release does not clear person assignment. Initial ordinary phase15 dispatch consumes the assignment; phase16 uses it before separate flag/model maintenance. Explicit mid-task release sites remain meaningful; phase23 calls004f2520 before task cleanup/freeing. That leaf clears only matching owners and the two documented masks, retaining reassigned people.
- Current phase3 runtime establishes state14 through action processing but lacks the subsequent full-chain admission operation. Its phase23 and direct retirement paths clear arrays/flags without corresponding matched-owner field release. Registered owner identity is distinct from stale native/presentation precedence.
- Existing phase6 fixtures deliberately retain raw assignment0 and use task.members as supplied admission. Their source/fixture bytes and controls must remain unchanged; the new native producer finding does not rewrite their evidence boundary.

## Regression is justified; runtime readiness remains held

The proof is sufficient for a small actual-caller failing regression at phase3 completion and matched-owner retirement. Exercise withCampaignTribe/stepComputerTasks and real registered person records, including final fallback action ordering, an additional same-tribe state14 person absent from returned IDs, non-state14/other-tribe controls, and stale-versus-registered owners. Retain explicit supplied-input status; this is not an ordinary campaign or native execution witness.

For a minimal red, assert only proved deltas independent of missing native fields. Known7f bytes can demonstrate bit0-only clearing. An already-set person0x2000 bit is preserved for either possible task OR-mask value, avoiding invention of task+0x31=0. Do not manufacture missing provenance or substitute the historical fixtures.

**This acceptance does not approve a runtime byte-write patch.** Before runtime integration, resolve or explicitly bound:

1. The unrepresented task+0x31 producer/phase behavior.
2. Absent7f upper-bit knowledge; cleared bit0 is not proof of an all-zero byte.
3. Agreement between person ownership, task.members, reassignment and every retirement exit.
4. Fresh-owner replacement versus retained registered-owner transfer.
5. Legacy checkpoints with zero-valued owners versus new checkpoint continuity.

The report's proposed minimum repair is a design boundary, not evidence that these requirements are solved. No additional recursive native leaf is required to establish the proposed failing regression. Transitive cleanup/order/state leaves, native save serialization and full phase16 composition remain outside this acceptance. Mission1–3 impact remains unknown.

## Verification

Independently reproduced all46 artifact reads, compared26 exports with current-source registry hashes, verified10 reused inputs and all48 inventory entries, and read the relevant caller/helper instructions and source. Both historical phase6 fixture hashes, member IDs386/415/445/398 and four assignment zeros matched. Canonical input/tool identity agrees with prior reviews. No reviewed runtime code, native instructions, simulation, tests or browser was executed; no repository/publication mutation occurred.
