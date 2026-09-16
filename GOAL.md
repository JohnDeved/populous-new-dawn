# Goal: fast, playable Populous New Dawn parity

Status: unfinished.

Delivery target: complete the single-player release by 2026-09-30 end of day
Europe/Berlin. Multiplayer, lobby, network, and lockstep work are outside this
release and must not consume deadline work or block it. Reconsider them only after
the release through explicit future direction. Keep the remaining scope and
acceptance quality intact; use the date to favor coherent runs of high-impact
gameplay over recurring cleanup and re-triage.

Current task lock: deliver Mission 11 Matak's first script-requested `BUILD_AT` Guard Tower
through the existing Mission 10 continuation. Bind only the first eligible native
`BUILD_AT(120,166)` branch after the model-3 Hut prerequisite, reuse ordinary AI
spiral site selection and construction, preserve the request across checkpoints, and
render the completed tower. Keep later `BUILD_AT` towers, staffing, Chumara housing,
production profiles, attacks, natural Mission 10 victory, Mission 11 objectives, and
mission completion outside this bounded slice.

Direct startup selection for Missions 1-4 finished in `c5116e7`; durable campaign
completion and next-mission recommendation finished in `dfc35b5`; Mission 4's
original opening flyby finished in `8ad89d0`; Mission 4's contextual training and
attack tutorials finished in `20254b5`; the first playable Mission 6 slice finished
in `0ac9764`; its original low-population counterattacks finished in `cefc928`; both
opponents' first autonomous Guard Towers finished in `244ffc8`; their first settlement
expansion finished in `750f4ba`; Mission 5's ordinary Dakini raid finished in
`7b94971`; Mission 6 Matak Warrior production finished in `d5ef216`; sustained Matak
housing and population growth finished in `7217eef`; Matak's first ordinary raid
finished in `e026556`; Chumara Temple and Preacher production finished in `b413819`.
Chumara's first mixed Mission 6 raid finished in `5dbbec8`; complete base-game input
recovery finished in `c77a2f7`.
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
- Fresh `pnd-reviewer`: finished non-trivial changes and acceptance evidence,
  before commit or parity/evidence claims.

Give specialists compact assignments, relevant sources, response budgets, and
completion conditions. Require actionable findings with provenance and limitations.
Parallelize independent questions; keep small tasks with the parent.

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
