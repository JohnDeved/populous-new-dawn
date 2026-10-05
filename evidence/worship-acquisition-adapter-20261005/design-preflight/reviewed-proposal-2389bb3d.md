# Proposed ordinary worship acquisition adapter

Implementation base: accepted main `0cb7e7ec4f53a403fcbc3c19b5f5f1fd876e4ee4`.
This is the second design proposal, with no runtime implementation or new parity
claim. The first proposal and its rejection remain alongside it. The accepted
17-case handoff, 10-case presentation and 3-case replacement proofs remain frozen.

Scope: the ordinary local class-11 grants from Mission 1 heads 28/30
(Lightning/Bridge) and Mission 2 head 63 (Tornado). Mission 2 head 25 is a mode-4
Vault spell grant and is excluded; Mission 3 has no linked class-11 worship head.
Mana, knowledge, other shrine variants and later spell casts retain their owners.

## 1. Producer eligibility, request order and payout

- `app/world-initialization.ts` already has the authored head mode, head index,
  linked reward records and settings. Preserve ordinary eligibility there, then
  pass it explicitly from the ordinary `world-turn.ts` shrine-completion branch
  into `createGift`. The discriminator must identify a mode-0 head linked to the
  class-6/model-2, settings-class-11 reward in this bounded M1/M2 scope. Do not
  infer eligibility from `Gift.reward` being a spell: the Vault shares that field
  and the current `createGift` caller at `world-turn.ts:1000`.
- Persist the eligibility/source discriminator, recipient, spell model and stable
  allocation serial with `Gift` in `world-types.ts`. `createGift` does not invent
  eligibility by default. Legacy/unknown gifts conservatively lack it; newly
  completed ordinary authored heads may derive it from their unchanged source
  identity. Already phase-zero legacy gifts do not replay a missed handoff.
- In the existing gift traversal, snapshot the eligible gifts present at entry.
  At `phase: 1 -> 0`, enqueue exactly one ordinary handoff carrying its gift id,
  model, recipient, allocation serial and cached last-render anchor. Continue the
  phase hiding and countdown. Do not reverse the payout loop. Drain only this
  turn's ordinary handoff requests in descending allocation order at the existing
  `GameClock.afterTurn` boundary, before another object turn or UI visit. Native
  `004ed8a0` prepends allocations and `004ec6f0` caches the next traversal record.
  A focused composed two-ready-gift proof/regression remains required before
  claiming the native same-turn order; it does not authorize a payout-loop rewrite.
- Every drained request gets its own original cue/panel operation and replaces
  the one spell controller and one companion. There is no UI visit or companion
  RNG between requests at that boundary. Preserve the independent pulse. The
  final replacement owns the next UI visit, as in the accepted replacement proof.
- Recipient `+0x7e` is compared with player `0089c6f0`; use the explicit recipient
  and `w.manaWorld.playerTribe`. Native land byte `0089c661` maps to
  `w.land.landFlags`: bit 2 pauses and bit 8 suppresses the arrival clamp. It is
  independent of `manaWorld.gameFlags` at `0089d17c`. Presentation limiter byte
  `0096ead4` is a third owner: bit 4 acquisition, bit 2 recorded-playback pacing.
- The small pure `app/worship-acquisition.ts` port holds the proved ordinary
  controller steps and draw commands. Arrival checks the saved gift id, its
  pending eligible state, bit 8 and `remaining > 1`, then clamps only that timer
  to 1. The next ordinary gift turn alone owns stock, caps, gift counts, message
  and removal. Replacement cannot alter an older gift's timer. Remove the
  unsupported payout `birth` only when the persisted ordinary eligibility tag is
  present; mana, building, Vault and unknown legacy gifts retain existing output.

## 2. Synchronous tab and geometry transaction

- Choose a narrow synchronous React commit, not a deferred effect/RAF rendezvous.
  `page.tsx` supplies `selectSpellsAndGetGeometry(model)` to `GameScene` before
  `scene.start()`. The scene's existing `afterTurn` callback drains handoffs while
  `advanceGame` is running from its RAF task, outside React render/commit. The
  bridge uses `flushSync` from installed `react-dom` around `setTab('spells')` and
  the required store publication, then reads model-keyed spell-button refs plus
  shell/viewport/HUD rectangles with `getBoundingClientRect` before it returns.
  It returns a value, never a Promise. It does not call `advanceGame`, wait for a
  paint, discard elapsed time, change `w.paused` or return early from the clock.
- This explicitly bypasses `scene-hud-runtime.ts`'s normal 0.2-second React/store
  publication. The spell buttons are ordinary synchronous JSX, with CSS-owned
  31x43 dimensions; artwork decoding does not gate their rectangles. The authored
  M1/M2 undiscovered spells already belong to `spellHudRoster`, before payout.
  A layout read after the commit must validate connected nodes, finite nonzero
  dimensions, current world identity and a common shell CSS coordinate system.
  Keep this one rare flush outside React lifecycle callbacks. Installed React
  19.2.6's flushSync finally flushes roots; it explicitly refuses render/commit
  context (`react-dom.development.js:131`, client implementation:16896).
- Native `0044bb30` requests Spells id 38; descriptor `005caf66` is type 5,
  submenu 2. `0044b130 -> 0044bf50 -> 0044c650(2)` selects that panel. Reviewer's
  bounded source inspection found callback `0049d140 -> 0044b890` tears down GUI
  lists, root init `0049d060` returns, and the 17 `0049e800` child refreshes update
  controls without writing command mode `0089c6e7` or calling `0047a550`.
  Therefore preserve ordinary selected-spell/build-placement/null `w.mode` in
  this automatic bridge. Do not reuse the generic click handler's mode clear.
  Native special mode 0x11 bypasses selection; this is not universal tab parity.
  Preserve the generic user-click behavior. Hover clearing is only stale DOM
  feedback cleanup; it must not clear gameplay selection or placement.
- Invoke the same automatic panel operation at the native arrival callback
  (`004846c2`), including when the user selected another tab during the flight.
  The arrival bridge may update display bindings only; it cannot replace the
  already frozen target or delay/clamp the gift on a different logical visit.
- Live missing/invalid geometry is an explicit adapter fault, not a wait state.
  Record one QA-visible diagnostic with the failed model/owner, available to
  the browser acceptance observer rather than technical text in normal player UI.
  Do not throw out of the game clock. Consume that
  request once, preserve its one cue, leave the existing singleton controllers
  unchanged and continue the gift's ordinary countdown. Do not fabricate a card
  rectangle, stop world time, retry initialization on a later render, or replay
  the cue. A failed request gets zero new controller initializations. This is a
  graceful failure policy, not claimed native behavior, and must never occur in
  accepted normal M1/M2 browser paths. Headless controller tests supply explicit
  geometry; they do not invoke React. Existing restored controllers keep advancing
  without DOM attachment and are merely not drawn until their bindings are valid.

## 3. Raised-body origin and immutable flight geometry

- `createGift` stores raised height `(ground + 800)/45`; `scene-effects.ts` calls
  `scene.locate(g, gift, gift.height)`, whose actual Three y is native height/128.
  Cache each eligible body's last completed render at `renderSceneFrame`, after
  `RenderView.prepare` and successful `renderer.render`. Record its actual
  submission/visibility, projected CSS anchor, viewport rectangle and layout
  epoch while phase is positive. Refresh invalid/offscreen results too, so an
  old visible point cannot survive a later invisible render.
- Use `RenderView.screen(g.position, camera)` and the actual render viewport;
  its normal path converts Three y back with y*128/45, and its overview path is
  explicit. Do not pass Three y directly to `project` or use ground `scene.y`.
  Snapshot the last completed anchor when the phase-zero request is produced,
  before a later `animateFx` hides it. If no valid rendered body exists, or its
  anchor is on/outside the strict viewport edges, use the viewport center, as
  native `00481900` does. A changed layout maps that cached normalized viewport
  anchor into the current viewport before the one-time geometry snapshot.
- At successful handoff, freeze the reference viewport/landscape, origin, center,
  spell-card rectangle/target, HUD scale and all integer controller kinematics.
  Express reference positions in handoff HUD-logical pixels, using the measured
  CSS coordinates divided by its actual scale, so the original 640x480 scale-1
  fixture is the identity case. Keep the source integer/truncation rules. Every
  subsequent distance, speed, angle, phase test, arrival clamp and retirement
  reads this reference geometry only. Resize/DPR/camera motion cannot write it.
- A separate draw-only map owns layout adaptation. Let V map the frozen viewport
  rectangle to the current viewport rectangle. Before the final center-to-HUD
  leg, map command centers through V. On that final leg, with frozen center C,
  target T and native command center p, use
  `V(p) + u * (currentTarget - V(T))`, where
  `u = clamp(dot(p-C,T-C)/dot(T-C,T-C), 0, 1)`; the degenerate C=T case uses the
  target translation. This maps the leg's center and destination to the current
  layout without feeding transformed coordinates back into the controller.
  Use the controller's actual leg, not a new elapsed-time motion curve. Companion
  coordinates use V; independent pulse coordinates use currentTarget plus their
  frozen target-relative offsets at current uniform HUD scale. Draw sprite sizes
  uniformly at HUD scale and apply DPR only to the backing canvas. No artwork
  stretching, extra RNG, new phase or arrival test belongs to this map.
- This mapping is a deliberate modern resize correction, not an original resize
  claim. At unchanged layout it adds no warp beyond the baseline HUD-logical-to-CSS
  scale; the 640x480 scale-1 native fixture is exactly identity. The target binding
  includes spell model plus the actually measured card's unscaled HUD-local
  center. Mounted cards update display geometry from their real refs. If Spells
  is temporarily unmounted, the stable M1/M2 roster permits mapping that measured
  HUD-local point through the current HUD transform until the native arrival
  selection mounts it again. Do not force extra tab changes on resize or RAF.
  A replacement's pulse retains its own prior target binding.

## 4. Exact nominal clock and shared RNG boundary

- Persist visible presentation elapsed time, the next UI deadline and limiter
  bits with the acquisition state in `World`. New scenes start the nominal idle
  epoch at visible elapsed 0 with a UI visit at 0; checkpoints retain their epoch
  and residual deadline. Idle visits have no controller work but preserve phase.
  The default normal rate is 40, with source-backed configured range 12..60.
  `0049cfe0` chooses helper rate: 60 initially, bit 1 -> 24, bit 4 -> 20,
  bit 2 -> 14, in that override order. These are nominal source-derived clocks,
  not measured original FPS. This slice does not enable recorded mode/bit 2.
- At each UI deadline t, snapshot limiter bits before the UI consumer and compute
  two candidates from that same t: limited = t + floor(1000/helperRate(preBits))
  ms; normal = t + floor(1000/normalRate) ms. Process the UI visit in native order:
  independent pulse, ordinary companion, ordinary spell. After it, set/clear bit
  4 according to surviving controllers. Interface-2/nonzero post-visit limiter
  bits select the precomputed limited deadline; otherwise select normal. The
  spell initializer does not set bit 4 itself. Hence activation from idle can
  select the precomputed 16 ms helper interval, the following active visits use
  50 ms, and controller retirement selects the 25 ms normal pulse tail. Other
  limiter inputs retain source priority; no blanket 34/20-second duration.
- Extend `game-clock.ts`'s existing chronological loop to the minimum of the next
  12-Hz world turn (adjusted for speed), existing 24-Hz animation and this UI
  deadline. Never batch world turns past a pending UI arrival. At exact ties:
  world turn and its synchronous handoff drain, existing animation, then UI
  consumer. Pre/post limiter selection concerns the UI consumer; a handoff may
  have initialized controllers without yet changing bit 4. The one RAF then
  renders the resulting state normally. Preserve the existing after-turn motion
  callbacks; do not advance a controller from React or draw code.
- Presentation pause is `w.paused || !!(w.land.landFlags & 2)`. UI deadlines still
  occur while visibly paused: pending native phase advancement and the companion
  first-step cosmetic draw happen before its pause test. Later motion/counters
  and that controller's RNG freeze; the sprite-frame consumer still runs. The
  independent pulse follows its native ungated decrement/draw order. Existing
  world and 24-Hz animation remain paused. Say "acquisition RNG freezes," not
  "the shared RNG freezes": existing rendered Lightning can still consume it.
- Explicitly skip presentation visits while document.hidden and preserve remaining
  deadline time. The existing visibility handler resets `scene.previous` and
  pauses World; do not accidentally process hidden throttled RAFs via a new
  branch outside advanceGame's early return. Resume contributes only new visible
  elapsed time, with no hidden backlog. This is the documented modern suspension
  rule. No fixed cap is imposed on rendering.
- Reuse `w.cosmeticRandom`. `scene-effects.ts:414/472` invokes `lightningLines`
  from each rendered frame; `lightning.ts:94` intentionally consumes the shared
  state. Existing accepted `hut-smoke-secondary-owner.md` already proves native
  `004673b0 -> 00475350` and smoke `0050c260` share `0089bc72` and preserves
  browser elapsed-turns-before-frame-draw ordering. Acquisition deadline work
  therefore precedes that RAF's existing Lightning draw. This is the declared
  browser adapter order, not proof of the original full frame's world-raster/UI
  composition. There is no new private seed,
  cached-Lightning rewrite or whole-game cosmetic clock is introduced here.
- Exact companion particles and cosmetic final state are conditional on the same
  initial seed and the same ordered intervening cosmetic consumers. Equal elapsed
  time at different refresh rates with concurrent Lightning need not yield equal
  particle identities. The spell body controller has no cosmetic RNG reads in
  the retained `004841b0/00484320` disassembly: given identical frozen geometry,
  eligible gifts and pause/flag/input sequence, its trajectory, arrival visit,
  grant-driving deadline and controller lifecycle are independent of those draws.
  Companion phase/count retirement is independently visit-owned. Do not broaden
  this to whole-world outcome or whole-cosmetic-state invariance: existing shared
  consumers can affect other effects, and changing rendering changes their input.

## 5. Persistence, rendering and acceptance

- `World` persists singleton spell/companion, independent pulse, eligibility and
  stable gift handles, full controller/particle state, frozen geometry, clock
  remainders and measured logical target bindings. `game-store.ts`'s structured
  clone captures these alongside existing cosmetic state. No DOM/GPU handle is
  saved. Legacy defaults create no presentation and replay no old initializer.
- Fresh-page restore/resize binds current DOM and draw-only transforms without
  changing reference geometry, clocks, RNG, cues or awards. Attachment cannot
  gate world progress. `GameScene` owns transient last-render caches, overlay
  canvas/textures and listeners. Dispose those on scene/mission exit; normal
  visual cleanup leaves gift payout state alone. Missing saved gifts cannot be
  clamped; their independent remaining presentation may finish.
- Use one noninteractive overlay in `scene-hud-runtime.ts`, above HUD and below
  modal controls, using existing canvas/atlas patterns. Cache palette-colored
  original frames and preserve native body, particles, trail and six-frame pulse
  cycle. Drawing/interpolation reads state without consuming RNG or advancing it.
  Retained final raster arguments have ECX=0 and opaque bank: compare the proved
  command stream and decoded original artwork; do not call it native GPU pixels.
- Required focused comparisons: accepted native controller/command/palette/RNG
  matrices; two-ready ordinary gifts and per-request side effects; eligibility
  negatives for Vault-spell/mana/knowledge/unknown legacy; arrival gates, stock
  caps, independent gift counters, replacement/pulse overlap and invalid handles.
- Browser acceptance uses shipped M1 Lightning/Bridge and M2 Tornado paths, starts
  on Buildings/Followers, and checks selected spell/build placement/null modes,
  raised-body/offscreen/edge origins, synchronous real-card mounting, arrival
  reselection, decoded-artwork/command-driven expected pixels, stock and cleanup.
  A missing/delayed bridge negative must preserve world progress and produce no
  deferred replay. Valid live paths must never take that diagnostic fallback.
- Compare resize/HUD-scale/DPR/no-resize twins for equal logical controller state,
  clamp/payout timestamps and RNG inputs; only draw output may remap. Save/load
  before handoff, during each controller, before/after replacement, after clamp
  and during pulse tail must preserve the same ownership without replay.
- At 30/60/120/144 Hz and irregular elapsed schedules, compare grant/body/lifecycle
  invariants with a controlled shared-input sequence. With concurrent Lightning,
  record actual RNG submissions and verify acquisition against that sequence;
  expect possible particle/seed differences across refresh rates while retaining
  acquisition timing and direct gameplay-RNG nonconsumption. Include pause and
  hidden/resume cases. This acceptance does not promise refresh-invariant whole
  particle identities or whole-world RNG state.
- Once implementation exists, run applicable standard check/build, TypeScript
  quality, native/portable/browser and focused performance gates on its candidate.
  No application gates are claimed by this source-only proposal. Keep issue 30
  open for remaining variants and whole-renderer composition.
