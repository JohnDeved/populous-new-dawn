# Goal: fast, playable Populous New Dawn parity

Status: unfinished.

Delivery target: complete the single-player release by 2026-09-30 end of day
Europe/Berlin. Multiplayer, lobby, network, and lockstep work are outside this
release and must not consume deadline work or block it. Reconsider them only after
the release through explicit future direction. Keep the remaining scope and
acceptance quality intact; use the date to favor coherent runs of high-impact
gameplay over recurring cleanup and re-triage.

Mission 15's authored Prison rescue and timed-failure objective finished in the
current feature commit: ordinary follower attacks release the captive Shaman, rescue
cancels the native timer, and expiry locks input before enemy Lightning causes the
loss. Later Mission 15 AI remains separate work.

Mission 16's authored Bloodlust acquisition and first complete live status loop
finished in the current feature commit: both rewards grant model-20 stock, the HUD
casts on the native follower set, and status duration, combat/Firewarrior modifiers,
movement, feedback, Shield coexistence, expiry, and checkpoints are integrated.
Later Mission 16 AI remains separate work.

Mission 17's authored Armageddon loop finished in the current feature commit:
worship grants model-18 stock, the HUD cast rebuilds and stages every active tribe
in the native arena, existing combat reaches victory or defeat, control is restored,
and in-progress phases survive checkpoints. Later Mission 17 AI and exact Shaman
auto-spell, camera, and audio presentation remain separate work.

Mission 18's authored tribes and opening, exact bank-g sky, Armageddon and both
Volcano rewards, first authored Red marker patrol, both Armageddon result directions,
and in-arena checkpoint continuity finished in the current feature commit. Recurring
command 1074 and later Mission 18 AI remain separate work.

Mission 19's Mission 18→19 continuation, authored bank-d sky and
Firestorm/Volcano/Teleport rewards, delayed Shaman Teleport with checkpoint
continuity, last-chance Chumara warning, Chumara-loss defeat, and Dakini-loss
victory finished in the current feature commit. Native evidence requires self-only
combat masks, not a generic Blue-Chumara alliance. Warning messages 127/128 and
later Mission 19 AI remain separate until their producers are recovered.

Mission 20's Mission 19→20 continuation, authored create-land-for-war opening,
and four-stage linked worship chain finished in this feature commit. Ordinary
worship now activates the ordered Land Bridge, Flatten, Firestorm, and Volcano
gifts plus the linked Earthquake, Lightning, Firestorm, Volcano, and scenery
effects; one-use consumption and checkpoint continuation are integrated. Later
Mission 20 AI, objectives/victory, and exact effect presentation remain separate
work.

Mission 21's Mission 20→21 continuation, authored opening, and first fault pair
finished in this feature commit. Focusing mana on Convert Wild, recruiting the
nearby Wildmen, and sending three followers to the authored Flatten totem seals the
fault before its native deadline; leaving it unsealed produces the warning and one
Volcano. Both outcomes survive checkpoints without replay. Later fault pairs, AI,
victory, and exact class-7/model-39 presentation remain separate work.

Mission 22's authored solo-Shaman opening and both gift/transport routes finished in
this feature commit. The Shaman claims the empty Red Boat, reaches the delayed
600,000-mana gift, builds to and claims the empty Yellow Balloon, then flies to the
delayed 1,000,000-mana head and returns safely; first-passenger ownership, worship,
travel, landings, and occupied checkpoints use shipped controls. The separate
presentation-only head grants no resources. Exact stone presentation, AI, objective,
and natural outcome remain separate work.

Mission 14's linked Earthquake/Land Bridge rewards and generic Angel acquisition,
cast, combat, and checkpoint path finished in `99bf314` after the bounded opcode 1173
prerequisite. Later Mission 14 AI remains separate until its command/read cycles are
proved.

Direct startup selection for Missions 1-4 finished in `c5116e7`; durable campaign
completion and next-mission recommendation finished in `dfc35b5`; Mission 4's
original opening flyby finished in `8ad89d0`; Mission 4's contextual training and
attack tutorials finished in `20254b5`; the first playable Mission 6 slice finished
in `0ac9764`; its original low-population counterattacks finished in `cefc928`; both
opponents' first autonomous Guard Towers finished in `244ffc8`; their first settlement
expansion finished in `750f4ba`; Mission 5's ordinary Dakini raid finished in
`7b94971`; Chumara Temple and Preacher production finished in `b413819`.
Chumara's first mixed Mission 6 raid finished in `5dbbec8`; complete base-game input
recovery finished in `c77a2f7`.
Opcode 1173 evidence invalidated the former Matak Warrior-production (`d5ef216`),
sustained-growth (`7217eef`), and naturally gated raid (`e026556`) claims; reclaim
them only after finding their real producer-attribute owner.
Mission 3's autonomous Tower, Temple, and first Preacher finished in `cc1e8b4`.
Ordinary Mission 2 victory, shipped continuation, and ordinary Mission 3 victory
finished in `744ad67`; the later scene terrain initialization extraction finished
in `3de1a8c`.
Mission 7's Convert Wild to Invisibility vertical slice finished in `2912b43`.
Mission 8's Firewarrior vertical slice finished in `88f4a97`.
Mission 9's Boat House-to-Boat vertical slice finished in the current feature commit.
Mission 5's Angel-head reward and live Angel strike finished in `4d4f041`.
Mission 8's Firewarrior Guard-Tower combat finished in `57db8ce`.
Mission 11's playable opening finished in `bbd93b3`.
Mission 11's first autonomous Guard Towers finished in `51d777a`.
Mission 11's first Matak Hut finished in `723358a`.
Mission 11's first script-requested `BUILD_AT` Guard Tower finished in `3217651`.
Mission 12's playable opening finished in `bacde84`.
Mission 12's first player-acquired Spy finished in `6eb55b2`.
Mission 13's playable opening finished in `f261e60`.
Mission 12's first playable Spy disguise and sabotage finished in `68d0f24`.
Mission 13's first ordinary Balloon transport finished in `2f83643`.
Original Boat/Balloon damage, destruction, and passenger ejection finished in `795a60d`.
Mission 10's normal automatic Boat crossing finished in `5bfd8c1`.
Mission 10's authored first-Totem deadline defeat finished in `47ec487`.
The PND02 Mission 2 checkpoint acceptance repair finished in `7330e9c`.
PND02's ordinary Mission 2-3 victories, shipped Mission 2→3 continuation, Mission 4
offer, fresh-page checkpoint, restart, legacy migration, and required-reachability
acceptance are complete; later Mission 3 AI/tutorial branches remain separate parity
work.

The user-queued composition refactor finished in independently revertible commits
through `e3124a4`. Keep `app/model.ts` and `app/scene.ts` as stable facades; do not
resume splitting when the next boundary would require cycles or new scaffolding.

Meet the target through meaningful capability completion across campaign/content,
game mechanics, saves/profiles, and modern compatibility—not recurring
cleanup, optimistic forecasts, scope cuts, or weaker acceptance. Report concrete
deadline blockers as soon as they are proved, apply the smallest recovery, and keep
useful independent gameplay moving while a true external dependency remains.

Recreate the user-supplied Populous: The Beginning single-player game for modern
desktop browsers.
Make steady, fast progress toward a complete, enjoyable game while preserving
observable single-player gameplay, campaign, controls, simulation, graphics, audio,
and saves.
Match original outcomes and timing, not obsolete implementation details or hardware
limitations.

Measure project progress by the verified percentage of gameplay and game-mechanics
parity with the original game recorded in `parity.json`. Credit only behavior that
is integrated into the game and supported by appropriate evidence; isolated helpers
and passing checks do not earn parity credit by themselves.

Game parity, modern desktop performance, and clean, readable, maintainable code
are permanent acceptance constraints. Workflow efficiency must serve all three;
never trade them away for fewer tokens, fewer checks, less code, or faster delivery.

The workflow is adjustable. Simplify or replace agents, contracts, retrieval, and
checks when observed results justify it. Prefer the smallest improvement that
helps deliver the next gameplay change while preserving these acceptance constraints,
safety, and the canonical sources of truth.
The AI owns routine prioritization, implementation, verification, commits, recovery,
and workflow improvement within the authorized remake scope. Choose and execute these
decisions without requiring human guidance. Procedural limits are revisable defaults:
change them when observed delivery results justify it, retaining the game objective
and its acceptance constraints. Judge workflow changes by subsequent gameplay delivery.
Detect stalled delivery during active work and correct its workflow or implementation
approach autonomously under `engineering/efficiency-review.md`; do not wait for the
user to notice or for an unfinished slice to complete.
Measure delivery speed using real elapsed time and comparable verified parity gain
per hour. Use the workflow delivery clock to detect stalls and retain approaches that
produce more accepted gameplay in less time without weakening acceptance.

## Main priority: modern desktop compatibility

Parity must coexist with a smooth, performant game that looks good on modern
hardware, web technology, and displays. Preserve original gameplay rules, timing,
and visual identity while correcting legacy resolution, aspect-ratio, buffer-size,
and frame-rate defects. Reproducing those defects is not required.

- **HUD and displays:** Keep text, controls, markers, and hit targets readable and
  aligned on ordinary desktop, widescreen, ultrawide, 1440p/4K, and high-DPI
  displays. Test resizing and display-scale changes. Prevent clipping, stretching,
  overlap, and unreachable controls. Use uniform artwork proportions, bounded
  automatic sizing, and a saved user size preference; wider screens should gain
  battlefield space.
- **Graphics:** Correct aspect-ratio, projection, culling, picking, texture/buffer,
  and precision problems exposed by larger viewports. Native fixed-size allocations
  are evidence of the old implementation, not browser-renderer limits.
- **Timing:** Preserve original game speed with elapsed time and the intended
  simulation clock. Rendering, input, animation, effects, camera, and audio must
  remain correct across low, ordinary, high, and irregular frame rates, including
  frame spikes, tab suspension, and resume. Machine or display speed must not alter
  simulation outcomes or intended durations.
- **Uncapped rendering:** Do not impose a fixed 30/60 fps presentation cap. Render
  at the browser/display's available refresh rate. Higher refresh rates must produce
  smoother movement, camera motion, and effects, using interpolation around discrete
  simulation turns. Animation and audio clocks must use elapsed game time, never
  rendered-frame counts, while retaining authored cadence.
- **Performance:** Target smooth presentation at the display refresh rate with a
  practical 60 fps baseline on representative modern desktop hardware. Profile
  frame time, spikes, stutter, memory, and allocation pressure in populated play and
  heavy effects. Do not hide timing faults by changing game rules. Headless or
  software-renderer results alone do not establish hardware performance.
- **Verification:** Maintain geometry/rendering regressions and elapsed-time checks
  at representative 30/60/120/144 Hz schedules plus irregular timing. For real
  performance results, record browser, renderer, hardware, resolution, workload,
  and limitations.

Document deliberate compatibility corrections with their native evidence, reason,
and regression check. Keep them distinct from verified original behavior and from
accidental parity differences.

Performance takes precedence over copying implementation details. Target observable
gameplay, timing, and visual parity rather than the original renderer's architecture,
allocations, or scheduling accidents. Prefer simpler modern web/GPU techniques and
better algorithms when paired evidence shows that they preserve behavior and perform
better. Record the native behavior, implementation choice, runnable regression, and
before/after measurement under the same workload. Distinguish microbenchmarks from
complete game frame times and never claim improvement from intuition alone.

Keep TypeScript clean, readable, maintainable, concise, and idiomatic. Refactor when
it reduces the cost or risk of current parity work; do not pause delivery for broad
cleanup. Use Fallow, ox-standard, and Ponytail in the regular workflow. Keep raw
decompiler output and address bookkeeping in decompilation evidence, not live game
code.

## Current execution order: highest-impact playable parity

User priority (September 18): workers directly own PND release-gate work, with
overdue prerequisites first. PND-01 remains overdue; PND-02 is accepted. Finish a
running check or reviewable delivery before switching, then prefer work that closes
the gate's remaining acceptance over another convenient cosmetic or research slice.
Worker1 owns PND-01's remaining original-save fixture prerequisite leading to PND-07;
Worker2 owns PND-10's message regression repair; Worker3 owns PND-04 training/task
behavior; Worker4 owns PND-08 natural campaign completion; Worker5 owns PND-06
worship/spell acceptance blockers. User reports are child tasks, not replacements
for complete gate acceptance. Reuse the accepted inventory; do not repeat it or
close a gate from documentation alone. CEO coordinates shared ownership, integration
and final acceptance. Preserve original deadlines and the September 30 target.

Use GitHub labels on issues and PRs: `release-gate` for PND gates, `overdue` for
missed original dates, and `status:blocked`, `status:in-progress` or
`status:needs-review` for the current state. Blocked work must name its concrete
dependency in the body or latest status comment. Reuse an existing blocker ticket
or create one with an owner, next action and acceptance; label prerequisite work
`unblocks` and prioritize it by downstream release impact. Use `priority:critical`
for overdue prerequisites and the release critical path, plus existing type labels.
Do not label merely unfinished work blocked. Remove stale status labels when the
state changes; a closed blocker does not automatically satisfy its dependent gate.

Mandatory near-term order: choose from reviewed release-critical gaps and the PND01
campaign/system inventory, not another convenient mission opening or expansion.

Explicit user direction wins. Continue a valid feature lock. Only when none exists,
compare at most five candidates using current implementation and evidence, identify
the top three, and select one by:

1. player-visible playability impact;
2. ability to unblock other important gameplay;
3. size of the live integration gap;
4. confidence from native evidence and runnable checks;
5. expected benefit relative to effort, risk, and external prerequisites.

Use the parity percentage to measure delivered progress, not as the sole priority
signal. Do not select work by checkpoint weight, document order, native address, or
ease of testing alone. When new features are preferred, exclude candidates that only
refine already-live behavior. Investigate consequential evidence gaps before
implementation.

Lock one absent player-visible behavior through the shipped UI, campaign, or normal
system path; tests, isolated helpers, and staged plumbing do not complete it. Keep the
lock until delivery or a concrete blocker. Bounded means a clear outcome, not an
artificially tiny change. Allow at most one prerequisite refactor commit for a named
blocker, then return to the feature; old extraction plans are not a backlog or fallback
unless explicitly queued by the user as above.
Reuse current triage while its gameplay and evidence assumptions remain valid.

## Use subagents where they improve delivery

The parent owns priority, source edits, integration, and acceptance. Use a specialist
for a concrete question that reduces uncertainty or allows useful independent work:

- `pnd-scout`: uncertain priorities, live ownership, integration gaps, or check scope.
- `pnd-native`: original behavior and unresolved native/browser boundaries.
- `pnd-performance`: timing, rendering, hot paths, resources, or measurements.
- Dedicated ChatGPT reviewers through Local Dev: finished non-trivial changes
  and acceptance evidence, before integration or parity/evidence claims. Use
  [Reviewer 1](https://chatgpt.com/c/6aac64d7-e0a8-83eb-8591-642392067b5e) or
  [Reviewer 2](https://chatgpt.com/c/6aac6528-e4e0-83eb-937f-58e788b30e26).
  Reviewer 1 uses Pro thinking; Reviewer 2 uses xhigh/Extra High. This user-directed route replaces Codex review subagents:
  assign each PR to one available reviewer and do not duplicate its full review
  in Codex. Provide the exact head/base, full diff, acceptance criteria and retained
  receipts. Reviewers inspect read-only, report concrete findings and ACCEPT/REJECT,
  and notify the CEO on a verdict, actionable blocker or unexpected stop,
  using the compact reporting rule below. Follow-up reviews cover repairs and unresolved findings.
  The CEO retains final acceptance, necessary integration checks and main merges.
  Every review applies [README's TypeScript quality workflow](README.md#typescript-quality-workflow)
  to maintained TypeScript changes: inspect readability, helper reuse, unnecessary
  machinery and decompiler-style code; verify source-bound `format:check`, `lint`
  and `lint:standard` results. Reuse valid receipts; obtain missing read-only checks
  through normal check coordination. Report legacy Oxlint findings honestly and
  distinguish them from introduced defects. Consult Fallow health/duplication/unused
  results as advisory evidence (exit 1 findings, exit 2 tool failure); verify callers
  before proposing deletion. Reviewers never run modifying `format` or regenerate
  importer-owned data. Record quality findings or explicit non-applicability in the
  durable review, without repeating logs in the compact handoff.

Give specialists compact assignments, relevant sources, response budgets, and
completion conditions. Require actionable findings with provenance and limitations.
Parallelize independent questions; keep small tasks with the parent.

### Keep coordination short

Send one delta-only handoff, normally at most 120 words:
`Worker/Reviewer | issue/PR | state | head`; what changed; decision or next action;
one durable evidence link/path with exact receipts and limits; resources held.
Keep full hashes, attempts, logs and preservation inventories in that artifact.
Expand only when needed to explain a concrete defect. Do not resend prior evidence.

Report review-ready delivery, a blocker requiring another owner, an unexpected
stop, or a material scope/deadline change. Keep corrected command errors, routine
test bring-up and acknowledgements in local evidence. Retain assigned checkpoints,
but send only a changed finding or missed forecast. A delivery timeout is uncertain:
check delivery before retrying; never send repeated full handoffs.

The CEO routes first: use the latest report, collapse superseded reports, and read
deep evidence only for review, integration or an unresolved decision. Do not echo
every handoff or refresh every ledger per message. Give each assignment one bounded
fallback task with a separate reservation when available; after delivery or a hard
block, continue that preauthorized task while review proceeds. Otherwise request
routing once. The watcher remains a deduplicated failsafe, not routine reporting.

Reduce chat coordination traffic: reuse the watcher's fresh local snapshot and
worker handoff before requesting another chat read. Routine snapshots are batched
every three minutes; local queued-report deduplication stays fast. Keep the
15-minute long-idle threshold and 30-minute reminder cooldown. Recognize both
compact worker headers and explicit chat IDs. One CEO routes assignments/reviews;
workers report once to the CEO rather than also messaging reviewers. After a
successful send, allow at least one snapshot interval before verifying execution;
delivery alone is not execution. On `Too many requests`, honor any supplied retry
delay and pause repeated calls to that tool. The user-authorized Chrome fallback
can wake an idle worker through the ordinary ChatGPT UI: use the single-call helper
documented in `work/orchestration/worker-watch-cli/README.md`. It reuses tabs,
checks active responses/drafts, records send attempts before clicking, and returns
a compact result. Never replay uncertain delivery, interrupt an active response,
or work around a rate limit shown by ChatGPT itself. A stalled page returns once;
do not enter a refresh loop. Busy destinations await their next state change.

Follow `AGENTS.md` and the engineering skill for workflow mechanics. Supply applicable
constraints and cited sections instead of whole goals, histories, or the performance
log; expand only when the evidence requires it.

## Continue through verified progress

Choose the next useful change, trace its live path, implement it, verify it, and
review the result. Keep checks proportional to the change while preserving required
native, browser, and performance proof. Distinguish demonstrated behavior from
assumptions and incomplete integration. Commit completed work when authorized.

A completed change is a checkpoint. When continued work is authorized, proceed to
the next highest-impact change within that scope. If one candidate is blocked,
resolve it, choose an alternative approach, or proceed to another useful authorized
candidate. Record unresolved external dependencies in the existing handoff and keep
working elsewhere. Do not end useful work waiting for routine steering or approval
of an internal engineering decision. A checkpoint does not complete the remake goal.

Keep this file focused on outcomes and priorities. `parity.json` remains the gameplay
and game-mechanics parity percentage and progress ledger; procedures, evidence,
history, and receipts stay in their canonical locations.
Preserve existing work and the user's authority over publishing, deployment, and recording.
