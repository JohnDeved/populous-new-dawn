# Goal: fast, playable Populous New Dawn parity

Status: unfinished.

Recreate the user-supplied Populous: The Beginning for modern desktop browsers.
Move quickly toward a complete, enjoyable game while preserving observable gameplay,
campaign, controls, simulation, graphics, audio, saves, and multiplayer behavior.
Match original outcomes and timing, not obsolete implementation details or hardware
limitations.

The workflow is not fixed. Simplify, reorder, or replace its agents, contracts,
manifests, retrieval, and checks whenever evidence shows that doing so improves
delivery speed or reliability without weakening parity evidence, safety, or the
canonical sources of truth.

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

## Choose the work that matters most

Explicit user direction wins. Otherwise, compare at most five bounded candidates
and choose from the top three. Rank them by:

1. player-visible playability impact;
2. ability to unblock other important gameplay;
3. size of the live integration gap;
4. confidence from native evidence and runnable checks;
5. effort, risk, and external prerequisites.

Do not prioritize by parity percentage, document order, filename, native address,
or ease of testing alone. Deliver one player-visible slice at a time with a clear
stopping condition.

## Use subagents for real leverage

The parent is the only source writer and owns priority, integration, and acceptance.
For each non-trivial gameplay/parity checkpoint:

- Use `pnd-scout` when priority, live ownership, callers, parity IDs, or the smallest
  patch/check surface is uncertain.
- Use `pnd-native` when acceptance depends on original-executable behavior or an
  unresolved native/browser boundary.
- Use `pnd-performance` only for timing, rendering, hot-path, allocation/resource,
  or measured performance questions.
- Require a fresh `pnd-reviewer` after the final source diff and before commit or
  parity/evidence claims.

Use at most one pre-edit specialist unless questions are genuinely independent and
parallel. Every assignment must be bounded and return exact paths/symbols or native
routines, provenance, limitations, unresolved questions, applicable check results
with the tested fingerprint, and a stop decision. Skip a role only when its trigger
is absent, current cited evidence already answers it, or the role is unavailable;
record the reason in one sentence. Never spawn agents to fill a quota, delegate
source implementation, or allow recursive delegation.

Subagents receive a compact task contract and a targeted context packet, not project
history. For performance work, begin with the packet's cited sections of
`references/modern-performance.md`; expand only to resolve a relevant correction or
for an explicitly requested historical audit. Do not read that entire log for a
feature-scoped task.

## Execution loop

1. Preserve the current checkout and capture HEAD plus all working-tree changes.
2. Choose the highest-impact bounded slice unless the user already chose it.
3. Retrieve targeted context with `npm run orchestration:context` and write the
   compact contract for substantial work.
4. Run the applicable read-only specialist work and integrate its evidence.
5. Implement the smallest live change that reaches the real player/system path.
6. Select and inspect checks with `npm run orchestration:plan`, then run the smallest
   sufficient portable, native, browser, and performance evidence.
7. Run a fresh final review and audit the contract. Report evidence gaps honestly.
8. Stop at the slice boundary; choose the next highest-impact slice on continuation.

Keep tests and implementation simple and reuse existing ownership and helpers.

`parity.json` is the completion ledger. Detailed architecture, native evidence,
performance history, and current implementation state remain in their existing
canonical files and bounded context packets; do not duplicate them here.

There is no standing stop, commit, publish, deploy, parity-recording, or evidence-
regeneration instruction in this file. The latest explicit user direction and the
current task contract control those actions.
