# Issue58 ordinary Land Bridge feedback witness

Preparation only; browser execution is **not run**. Product source is
`501fcc1ac218d859551e286fd26219c98951f39b`, based on exact main
`86c0dd37b1a7879a84d5a55ab9bca4b14beed029`. The sole application change is the
reviewed acknowledgment literal. Source assessment: retained
`issue58-land-bridge-copy-source-review.md`, SHA256
`08c01bee45ac6149558f524327ed3ea1ef47d679a513a01e1adfe7bc05e19f58`.
`source-correspondence.json` pins current application/caller/consumer inputs,
the unchanged original messages, maintained harness, and this QA preparation.

## Ordinary source and input

Use the current owned local-render harness and a new game-only profile with no
checkpoint. The scenario is `scripts/local-render/land-bridge-feedback.mjs`.
The input and movement-arrival helpers are unchanged Git objects from accepted
`a409893cdab222e140f1acc02b69c25d6e6e05b6`; all their other imported helpers and
the harness are byte-identical between that source and product501.

The retained prefix is normal Mission1 startup/readiness, original living Shaman
selection, actual command27 to the authored Bridge head `(-5,25)`, earned stock1,
ordinary command3 to shore `(0.5,19)` and its native arrival, public Pause/view at
`(0,12)`, key2, Resume and one real Bridge release toward `(0,4)`. Current public
labels are `Select and focus shaman`, `Pause game` and `Resume game`. The current
`inputMask` gate blocks both keyboard spell selection and pointer commands;
readiness, camera settle and a retained mask immediately before key2 must pass.
The existing sole pointer observer retains trusted down/up events, exact actual
picker arguments, original caster ID, native destination, six-turn projectile,
stock1→0 and mode clearing. The new observer never owns a pointer listener.

No crossing, terrain-completion wait, guard, Vault, acquisition, Save, Load or
Restart is selected. No injected World, stock, clock, RAF, render or storage is
used by the browser scenario. The finite original shore and target searches are
reused; there is no new target chase or timing system.

## Observer, visible status and cleanup

After the movement observer has restored, install the passive feedback observer
before Resume/cast. Existing clock beforeTurn/afterTurn callbacks retain the real
projectile identity before consumption and the effect allocation afterward.
`world-turn` visits its effects before `processProjectiles`, so the fresh Bridge
controller must be turn0. Retain its ID, same-object ownership, source/target
coordinates, message, unchanged `time+9` deadline and stock/gift identity. This
does not claim terrain completion or a traversable crossing.

The actual `scene.animateFx(group,effect)` call subsequently proves that the scene
consumes that exact effect/controller in the current registered mesh and ground
parent. Wrappers invoke every original exactly once with the same receiver and
arguments and preserve original return values and primitive throws. They neither
advance the simulation nor call a renderer themselves.

The current HUD publishes through its natural `uiTimer>0.2` callback. The actual
`page.tsx` consumer requires ready, no routeNotice and an unexpired deadline,
and emits `.world-message[role=status]`. A MutationObserver freezes the first
matching visible DOM snapshot inside the page, before host polling or full report
serialization. It retains exact text, connectedness, computed visibility/opacity
including ancestors, viewport rectangle, live deadline, scene/store/canvas and
controller identity; open dialogs, loading overlays and a hidden document fail
visibility. The first retained DOM observation is immutable.

After that observation, the host captures one real screenshot immediately, before
serializing the full observation. Live visible text and deadline are checked
before and after capture. The screenshot shows the same first acknowledgment
interval; it is not claimed to be the compositor's very first painted frame.
No screenshot is labeled successful from producer text alone.

Every exit disconnects the MutationObserver and restores owned callback
descriptors. A foreign replacement is preserved and reported as failed cleanup.
Failed evidence is retained; cleanup/report failures do not replace an earlier
primitive action failure. The harness remains the only browser/server/profile
owner and retains its existing owned-process cleanup and offline loopback rules.

## Review, budgets and acceptance boundary

Proposed inner timeout:420000ms; readiness60000ms, worship180000ms,
shore180000ms and acknowledgment30000ms remain finite stage ceilings inside it.
Proposed outer bound:480s. These are diagnostic ceilings, not game timing. Use
the established1440×1000/DPR1 profile. Coordinator supplies the fixed port,
fresh profile/output paths, browser154 sandboxtrue, dependency binding and
CPU/memory scheduling. This worktree has no dependency link and has launched no
browser/server. Held68956, f032/6944 archives, PR180/native bootstrap and auth
tasks are untouched. No generic receipt discovery is performed in stationary.

Cheap contracts compose the maintained input observer and current extracted
Bridge targeting fragment with real production `createWorld→cast→tick`. Their
stock/position are supplied and their events/DOM are synthetic, explicitly not
ordinary/browser evidence. They cover projectile→turn0 effect→+9 acknowledgment,
actual consumer identity, first-visible preservation, hidden/clipped/unrelated
text, route-notice/expiry, controller replacement, original primitive throws,
save-error cleanup and exact current source/harness contracts. The initial direct
bring-up failed because the fixture rejected the helper's diagnostic preflight
person pick; it was corrected to allow that read while asserting the actual
release uses only the production terrain pick. No production acceptance changed.

Final exact source/input-bound contract receipt is prepared after source freeze.
Product standard gates remain coordinator-owned on501. These QA-only additions
require source review and their focused composed contracts; browser acceptance
remains pending exact-source/runtime/profile admission and a retained screenshot.
Original82/string615, simulation/effects/costs/RNG/timing and parity credit remain
outside this QA change. No original-GPU or hardware-performance claim is made.
