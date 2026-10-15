# Mission 7 Chumara first automatic Convert task

Refs #103. Base4711317e, first producer integration0fc9dfc8. This is a bounded
first-Convert integration, not full M7 AI, recurring spell policy, or player victory.

## Static ownership

Retained original EXE SHA256
`3a5065c7420b3fcde208bf220bc86dfbac95e025ab2492caf9c7ea5308dfbe4f`.
No original instructions were executed or emulated for this work.

- `00461d70`/`004625e0` visit generic producer `004e5900`, which allocates type2
  with Wildmen, state2 ON, no duplicate and a free slot. No affordability gate.
- CPSCR021 words47–49 set1030 ON. Retained EVERY255 words549–571 switch OFF
  above population29, ON below20, retaining20–29. Active tasks do not recheck ON.
- `00485b00` stores the loaded Shaman origin. M7 tribe2 has unique Shaman object13
  at browser(25,-35), native(0x2100,0x1b00), packed even0x1a20. `campaignPosition`
  preserves that origin when the live Shaman moves. Explicit base0 takes priority.
- `004c7370` phase0 reads the established base when present, otherwise loaded
  origin. Exact disassembly004c7400..004c741c reads byte009607ea+48*tribe, attr0.
  `004f87f0` uses raw wrapped coarse-coordinate distance, with no radius scaling.
- `004c6da0` phase2 routes a successful model4 plan to phase3. Phase3, for an
  ordinary rather than exact task and an absent base, resolves the live building
  and uses `004b9fc0` exterior coordinates to establish base and radius0. There
  is no native mission discriminator. The existing browser writer was gated
  to missions2/3; the prerequisite extends only M7 tribe2, preserving conditions.
- Phase8 requires readiness, mana >=10000, range and permission. `004f4de0`
  charges mana unless payment type3, including empty Convert stock. M7 available
  mask4 and stock17=0 are preserved; no resources are granted by this patch.

Retained export hashes:
- 004c6da0.c:491545b5e77c46412ec44e1178720eca14aa6b1b38b992f57176a948d64d2afd
- 004c7370.c:db77666fa5730e24dd0d0c0af9e0311c73b0d7fc3aaf08efa067caa21fa43fdb

## Causal red/green and natural observation

Three coordinated gates share the predicate preserving M3 and adding only
M7/tribe2: producer0, type2 dispatcher, and legacy-spell suppression. Controlled
caller tests cover allocation with zero mana, OFF/no-Wild/duplicate/full-pool,
authored threshold recurrence, active-task OFF continuation, moved Shaman,
explicit base/base0, checkpoint restore, unavailable Shaman, and suppression.
Original M3 controls remain unchanged.

The first three-gate candidate FAILED the ordinary first-conversion assertion:
only phases0→3 through2500, with no movement/cast. The loaded origin's nearest
populated Wild macroregion is distance72, outside the authored20..40 radius.
An8000-turn simulation diagnosis likewise observed zero casts and population
cutoff before any target. These failures are retained, not redefined as success.

The original-roster Tower plan has exterior native(31616,21248), base0x527a;
its nearest Wild macroregion is distance10. The separately tested phase3 writer
prerequisite supplies the actual source-owned target origin. Its failure-first
test observed phase4 instead of3; controls preserve explicit base0, existing
base, exact-task and missing-building non-writing cases and RNG.

With that prerequisite, `scripts/check-mission7-convert-task.mjs` uses shipped
`advanceGame` with no injected actors, resources, positions or tasks. It observes
phases0,2,4,5,6,7,8,3, command3 movement by turn347, a paid cast719
(mana42304→32304, stock0), task retirement724, and conversions at727/735/743.
Wild IDs95/94/96 are replaced with new Brave IDs196/230/264. The probe pairs
removed Wildmen with same-position native-flagged Chumara newborns. An earlier
probe incorrectly required unchanged IDs and failed; that raw failure is kept.
Complete world and RNG checkpoint twins match from phase8 through turn788.

Raw source-bound receipts and all failures are retained under the task evidence
bundle. Final standard gates and rendered/settlement/player QA are separate
requirements, not established by these focused tests.

## Explicit limits

CPSCR021 words298..446 remain excluded. Their EVERY255 offset132 executes1172
ON (flag0x40000 usage limits), with1173 operands models2..16, not Convert17.
The first Convert with used17=0 is unaffected. Do not claim complete authored
ongoing cadence or permission from this first-task integration. No raids or
Wildman wandering are added. M19 canonical turn32099 remains unchanged.
