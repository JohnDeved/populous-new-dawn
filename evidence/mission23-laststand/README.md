# Mission 23 last stands

Base e5b258422caecd6d050fe508b05259b8cbbd1757. Binds only Red cpscr023
321:357, Yellow cpscr024 296:332, Green cpscr018 325:361 to existing real
campaignInternal and opcode1221 hosts. All retain EVERY63 per-tribe cadence,
population<8, Blue kills>10, no completed huts of models1–3, no invented latch.
Original source identities remain imported unchanged.

`node --test tests/mission23-laststand.test.mjs`: 9 passed. First six tests
failed before implementation (baseline.txt). Cases use supplied reduced populations
and kill counters; this is not proof of naturally earned campaign progress.
Actual tick dispatch, attack order28 and exact checkpoint continuation tested for
all three tribes. Additional controls: each hut model, incomplete huts, reverse kill
ownership, threshold boundaries, cadence, recurrence and unrelated mode bits.

`node --test tests/mission23.test.mjs`: see mission23.txt.
`git diff --check`: passed.
Orchestration plan blocked: sparse checkout omits public/original/atlas.png.
Full/build/typecheck/format/lint/rendered/native execution: not run.
No full suite, browser job, parity credit, Ready or merge claimed.

Independent review_m23: ACCEPT bounded source review on final.sha256.
No Ready/merge acceptance. Raw logs retained locally, not published in development tree.
