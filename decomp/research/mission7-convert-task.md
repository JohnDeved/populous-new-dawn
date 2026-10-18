# Mission 7 Chumara first automatic Convert task

Refs #103. Base4711317e, first producer integration0fc9dfc8. This is a bounded
first-Convert integration with its authored usage-limit enablement, not full M7 AI,
all-spell interval policy, or player victory.

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

## Authored usage-limit dependency

A separately tested minimal projection retains CPSCR021 slices298:310,
374:380 and444:447: EVERY255 offset132, IF own population<73, both1172 ON
commands and original closures. For tribe2 the first visits are122 and378.
Four real-caller tests fail without the projection and pass with it, covering
both branches/boundary, surrounding nondue turns, unchanged interval arrays,
four-use refusal and reopening after64 recovery calls. All1173 model2..16
interval commands remain excluded; Convert17 retains original default interval1.

The natural first cast now records used17=1/remaining17=64; first-cast timing,
newborn identities and complete checkpoint twins are unchanged. Five casts by
8000 do not prove excess usage: the counters recover between sufficiently spaced
casts. The corrected enablement restores accounting/permission rather than
arbitrarily limiting total mission casts to four.

## Settlement consequence

The former exact8000 snapshot assertion fails with no Preacher yet. A paired
shipped-clock diagnostic bypasses ONLY the M7 producer id0 (leaving dispatcher,
legacy suppression, Tower base and1172 unchanged). Combined: Temple plan5188,
first log/stage0.125 at5779, stages0.25..1 at8692,8950,9204,9478,9740,9994,10280;
first Preacher10524. Producer-bypassed control: plan5455, completion6764,
first Preacher7224, five Preachers8000. Combined builder196 is the first converted
Brave, with newborn877 and original8 in the builder slots. They are alive and
carry actual model6 building orders; timber progresses1→8 to completion.
This establishes changed roster/task/RNG consequences and ongoing construction,
not a permanent inability to produce a Temple or Preachers. Raw old8000 failure
and paired diagnostic source fingerprints remain retained.

## Explicit limits

Other spell intervals (1173models2..16), later raids and native Wildman wandering
remain unbound. The bounded1172 projection is not full M7 spell/AI parity.
Rendered first AI conversion, player HUD/pointer Convert/recruitment, and public
checkpoint checks are separate from ordinary full-mission victory. No current
full victory claim is made. M19 canonical turn32099 remains unchanged.

## Integration blocker: coastal builder recovery (#456)

The additional first-log trace invalidates a timing-only interpretation. Builder1127
selects healthy four-log tree146 at5800. At5819 its remaining path is(127,127),
with native goal34560/30976 and speed82. The next step at5820 is unsupported
coastal category10/height0, so the compatibility movement branch clears the path.
The retained builder then waits at its unchanged position until phase24's native
1024 countdown expires at6824, retries the same tree, and is reassigned by training
at7185. This is an exposed movement/recovery gap, not grounds to weaken8000.

`00496750`'s approach timer and `004392a0` unchanged-goal checks are retained.
The missing boundary is shared person motion/recovery before state dispatch:
`004d32b0` calls `004d42a0`, whose high flags2 replan invokes `004e9d80` unless
turning. The builder adapter instead detaches its person and uses compatibility
path following. Unconditional replanning is not a proven replacement for the
native recovery/flags/RNG/alias lifecycle.

[Issue456](https://github.com/JohnDeved/populous-new-dawn/issues/456) tracks the
separate prerequisite. PR455 remains draft and blocked; the original8000 settlement
assertion is unchanged. No full-suite/component/build gates were started for this
blocked candidate, and no merge or full-Mission7 completion is claimed.
