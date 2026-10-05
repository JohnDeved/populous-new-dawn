# Independent review: bounded worship handoff proof

Decision: ACCEPT for native/source research only. No blocker to this bounded proof. This does not accept a live repair or complete issue 30.

Reviewed base dcfb0dc2afe3e2501f964b109933e43d8bdbd451 through frozen proof a64758610e4d7732ff935df3543fb5745e3eff37 (all five changed files, 528 additions), plus the note-only bit-2 qualification at 543fbecfbba7871f8c9b5c7c8362363f915c087b. Working HEAD initially 543fbec; tracked tree clean. The owner subsequently published portable receipts at 7724d4669b4bfab119c9ac92174d85b9689918f2; that publication is outside this frozen source verdict.

## Evidence checked

- Read repository AGENTS, GOAL, engineering protocol/native research/worker handoff, and populous-engineering guidance. Read full frozen diff and relevant live callers.
- Frozen probe SHA256 23eea61d2b1060260083d54557108d13f737e9cc807e7313ba18cefa6667f50e matches retained attempt-3 source and current probe. Passed worker result SHA256 c88d8b83d7ed08c9f6aceda1cad9cda18f431ed49db8c3cd261ba55f854a9802 matches handoff. Original PE identity is pinned by native_cpu before mapping; shipped constants, search table and HFX metadata are validated. Complete mapped search bytes, 244 configured targets and five read-only PE regions are guarded around every original call and after setup.
- Independent one-shot probe: exit 0, 17 cases, 0.751 seconds wall, exact frozen probe at then-HEAD 543fbec. Raw command/output and results are in independent-command.json and native/probe-result.json here. All case rows match retained attempt 3. No browser, Ghidra, build, package install, shared port, or shared artifact was used.
- Checked native instructions for dispatcher, constructors, origin selection, pause ordering, arrival gate, counter increment, raster descriptor, limiter setter/clearer/priority and both render-loop call arguments. Cdecl leaf interception preserves caller stack ownership; intercepts are disclosed. Companion processor/raster, allocator/removal bookkeeping and device/display leaves remain supplied boundaries.
- Retained failures are correctly attributed: attempt 1 omitted actual palette/pulse raster leaves (fault at 00516298); attempt 2 expected pause before pending-phase consumption. Source diffs preserve and explain both fixes; final assertions add phase/timer, recipient, origin and award checks rather than weakening native behavior.

## Supported result and boundaries

Native reward phase reaches zero on visit 6, hides the body, dispatches local class-11 payload through 00481550 to 004841b0 and 00481490, then removes glow and decrements timer 77 to 76. The UI never awards stock. Eligible arrival clamps the live class6/model2 timer to 1; the next reward visit gives exactly one low-nibble stock and one high-nibble gift count (0 to 0x11), then requests deletion with no further world allocation. Invalid handle/type, bit-8 suppression, nonlocal/255 recipient, allocation failure, pause and already-one cases support only their stated bounds. Removal bookkeeping is intercepted, so global object-list retirement is not independently exercised here.

The live world-turn loop still ignores the phase-zero UI event, waits 82 visits and emits birth using draw41/HFX1441; the scene only hides body/glow. Raw original level bytes independently confirm M1 Lightning/Bridge and M2 ordinary Tornado. M2 mode-4 Vault/model5/grant1 and M3 building knowledge remain excluded. See authored-boundary-corrected-links.json; initial exploratory authored-boundary.json incorrectly indexed one-based links and is explicitly superseded.

Limiter bit4 requests 20 FPS; bit2 overrides it to 14. Direct setter call sites and reviewed RDDATA exports support the note-only recorded-playback qualification. No elapsed-time input enters controller movement, and no exact native wall-clock/RAF/world-turn equivalence follows. Maintained TypeScript quality checks, build, browser rendering and hardware performance are not applicable to this research-only diff; both reviewed diff ranges pass git diff --check.

## Minimum next boundary

Recover and compose companion 00482290, spell raster 00484870 and pulse lifetime/cleanup contract; preserve actual renderer/HUD coordinate ownership, pause ordering, limiter overlap and initial deadline sampling before choosing a modern elapsed-time cadence. Then implement only the ordinary local spell handoff, leaving reward turns as sole award/deletion owner, and verify checkpoints, interruptions/repetition, cap/gift preservation and 30/60/120/144 Hz plus irregular elapsed schedules through authored M1/M2 play.

Nonblocking wording correction for the follow-up: say “six-frame pulse cycle starting at HFX1288,” not six total renders. The receipt contains 1288 through 1293 and another 1288 before spell retirement; pulse lifetime is distinct, and the companion remains intercepted. Full presentation cleanup is still an open boundary.
