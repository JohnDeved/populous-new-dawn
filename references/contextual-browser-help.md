# Browser compatibility boundary

## October 21, 2026: remove invented gameplay help

The user's original-UI requirement supersedes the historical correction below.
The normal Menu → Options browser compatibility content no longer supplies mission
strategy synopses, objective checklists, a controls guide, general gameplay tips,
reference links, an elapsed-time duplicate, or queued zoom/focus conveniences.
The retired `BrowserHelpTips` component and the page-only objective computation
are removed. Original campaign messages, native gameplay input, simulation and
mission outcomes are unchanged.

Speed, audio activation and recovery notices, HUD accessibility sizing, mission
access, fullscreen, and the explicitly exempt F8 and cheat controls remain
available. Their retained browser presentation is not claimed to be native parity;
this slice removes invented content rather than disguising it with new prose.

`tests/browser-help-tips.test.mjs` now renders the actual retained Home fragment
and exercises its speed, HUD storage, audio, level-access and F8 handlers.
Pause/result/recovery tests retain modal ownership assertions without the removed
camera queue. Browser fixtures use existing native HUD focus rather than the
retired compatibility shortcut and assert that objective/camera duplicates are
absent. Rendered checks and standard gates remain separate evidence.

## Historical contextual-help correction (#457)

The HUD Menu button opens `OriginalPauseMenu`; Options renders `OriginalOptions`,
whose Browser compatibility and help button reveals the supplied page content.
This is an explicit browser adaptation, not recovered original message-body layout.
The existing Options styles, navigation, focus handling, controls and error notices
are unchanged. Original campaign paragraphs and ambiguous transient feedback remain
outside this correction. Issue #58 is closed; this does not reopen its copy audit.

The universal tip previously sent every mission to Mission 1's southern Land Bridge
and central Lightning heads. `BrowserHelpTips` now receives current
`world.outcome.level` on every render and labels those directions as Mission 1 only.
`app/level-one.ts` supplies trigger 30/gift 31 (Land Bridge at -5,25) and trigger
28/gift 29 (Lightning at 11,1; four uses). `world-initialization.ts` exposes these as
live shrines; `original-rules.json` spellCharging model 12 has normalLimit 4.
General casting, vault, training, construction and water guidance is retained.

The synopsis's Armageddon fallback was also displayed for Mission 19. Its recovered
reward chain is Firestorm/Volcano/Teleport, not Armageddon (see
`decomp/research/mission19.md` and the authored Mission 19 live shrines).
The existing explicit mission summaries are preserved, including Armageddon for
18 and 23; 19 and unknown levels no longer receive this unsupported fallback.
No substitute strategy or new native text is invented. The historical About
paragraph now says “Mission 1 reference” so it does not imply the current world is
Level 1. The controls heading is neutral rather than “Your powers, at a glance”.

`tests/browser-help-tips.test.mjs` renders the actual component, covers every
supported mission/tutorial and mission changes, binds Mission 1 facts to live world
and original rules, and evaluates the actual page synopsis expression. These are
content/ownership checks, not browser screenshots or a native popup parity claim.
Parent integration owns rendered navigation/standard-wide-high-DPI evidence and the
full check/build gate.
