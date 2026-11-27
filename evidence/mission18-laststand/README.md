# Mission 18 last stands

Base e5b258422caecd6d050fe508b05259b8cbbd1757. Original imported
app/original-script-eighteen.json is unchanged. Binds exact Red cpscr019
313:349, Yellow cpscr020 343:379 and Green cpscr032 332:368.
Each retains EVERY63 per-tribe cadence, population<8, Blue kills>10,
and no completed hut models1–3. Existing opcode1221 host supplies forced
attack mode and ordinary command28 dispatch. Red's prior patrol projection
remains after the new block in original order.

Nine failure-first focused tests pass (baseline all nine fail); three existing
Mission18 tests pass. Tests explicitly supply attrition and kill counters:
not evidence of naturally earned late-campaign progress. Ordinary tick dispatch,
command28 targeting, checkpoint continuation, hut models, incomplete hut,
reverse credit direction, threshold and cadence controls, recurrence and mode
preservation covered. Raw receipts retained outside checkout.

Full/build/typecheck/format/lint/native/rendered gates remain not run.
No dependencies installed. This is a bounded Draft, not Ready/merge acceptance.

Existing recurring-preacher suite also passes 9/9, including ordinary patrol
and public Save/Load continuation (25.99s terminal receipt). Planner blocked
by sparse checkout's missing public/original/atlas.png.

Independent p3_review: ACCEPT bounded source review on final.sha256.
