# Revision 6: complete copied-input / dedicated-observer contract audit

Sources: accepted campaign commit `ddef3caa522d45168b16f290cc5b5a4d1541fce2`;
command-probes SHA-256 `86384f34412b3edc5f6ff624d8c06c71747606149c1941ca7862af836518fbaa`,
scenario `2bae55543e33738c689f3fa34409744307d489bc9fb032f6f2e110cb2c353f55`,
observation `6b8502473443891217ce4dd3c10dbbe59674f9eaca5628a936a4509aef5f815a`.
Current campaign worktree edits are excluded: provenance now reads this exact Git
commit. Runtime stays c20a297; baseline stays 3b899125. No profile was read.

## Findings

1. `acceptedOrderEvidence` consumes fresh dispatch/ack, selected recipients, current
   owner order/work/target, and either an actual live marker or the campaign epoch's
   marker history. `createEpoch`/`recordTurn` retain real secondary-owned markers
   by cursor. Revision 5 supplied current effects only and no such history.
2. Runtime `world-effects.ts` gives an order marker four processor visits. Failed
   attempt03 captured down/up at turn428 and current state at433, with no marker.
   The input records and model3 queue are real, but an unrecorded marker cannot be
   reconstructed or inferred. The failed attempt remains failed.
3. A delayed recipient snapshot can also miss a short Move queue already removed
   by `stepMovementOrder`/`stepPersonOrders`. Input assignment, native adoption,
   later ordinary eligibility and physical movement are different observations.
4. Revision 5's generic `order` selected its owner via `unitAnimationSource`, a
   renderer contract. Accepted campaign input reads instead use builder.person,
   flight, fight.motion, native, entry.person in that order. These must remain
   separate even when the ordinary actors happen to use the same native object.

## Selected mechanism and listener-order proof

No afterTurn hook or marker journal is added. The audited alternative
`attachObserver` preserves original receiver/args/result and catches diagnostics,
but is unnecessary for this narrower synchronous boundary.

`scene-input-runtime.ts:registerInput` registers the shipped pointerup handler on
its canvas before any test input observer. `pointerUp` synchronously executes
`command`, then creates the real orderMarker, acknowledges the pointer and returns.
The existing accepted `observeEntityPointer` registers capture-phase begin and a
later bubble-phase end on that same canvas. Hence begin copies pre-handler state;
end copies actual post-handler state. Neither callback dispatches an event or
invokes a picker, renderer, model processor or clock. Existing picker wrappers
still call each original once with its original receiver/arguments and return or
rethrow the original result/error. Safe diagnostic formatting is copied from the
accepted observation source so a malformed diagnostic error cannot escape.

The added reader is synchronous and bound to the actual scene/world/epoch. It
copies only input-relevant data: turn/time/status/selection, lastOrderTurn, pointer
acknowledgement, effect identities and real secondary owners, Unit/native identities,
command-owner slot identities, current-cursor records and work/target. All pre-handler
effect IDs are retained, including non-markers. It invokes no model command, mutating
selection query, pathfinder, geometry update, renderer or clock.

## Complete field/caller correspondence

- map/rotate/target helpers: mode, target collections/IDs and camera position remain
  the dedicated read's actual values. Minimap and right-drag bodies are unchanged.
- entity preparation: cloned-world command classification, scalar target descriptor,
  fresh turn/selected group and exact revalidated 5×5 integer hit remain unchanged.
- ground preparation: the identical six-point policy, one map/three probes, actual
  contexts and diagnostics remain. The final current enabled3 and integer point
  are still revalidated before dispatch; no new picker call is added for logging.
- delivery: begin/end capture flags, trusted pointer pair, actual coordinates and
  original picker calls remain. `finishEntityClick` now returns its real envelope
  after its existing assertions; failures never become an alternate-point retry.
- acceptance: unchanged `acceptedOrderEvidence` consumes the actual pointerup
  PRE/POST-handler snapshots. Both have exact scene/world/epoch correspondence,
  one synchronous turn, current selected actors and owner/current-cursor records.
  A ground marker must be absent from the pre-handler effect IDs and have its
  actual secondary kind/effect/serial. No first-noticed cursor is invented.
- same-target repeats: the helper's `fresh-input-existing-order` behavior remains.
  An old record alone fails; actual fresh dispatch, fresh ack and a genuinely new
  owned marker to that current target can pass. A later queue slot or wrong owner
  cannot substitute for the actual current-cursor record.
- training: entity work/target ownership is evaluated at that same actual handler
  boundary. Real subsequent occupancy, 4000-mana cost, original Brave removal,
  new model6 identity, training count and exit remain separate unchanged gates.
- initial Move: model3 is required in the captured handler's current-cursor record.
  This is attached/queued input, not adoption (`commandStatus` may still be zero).
  Later reads must preserve the same Unit/native identity and the source-defined
  ordinary on-foot state/work/route/queue eligibility. An empty ordinary idle
  queue is labelled exactly that, never inferred completed movement.
- Guard: existing state10/status30/current-command30/target/renderer-owner checks
  and per-epoch identity pins remain. Actual Shaman and follower displacement and
  goal reaction remain the later physical evidence. No queued record earns them.
- Load: actual checkpoint replacement correspondence precedes the new observer
  epoch and pin rebind. Every newly armed pointer observes that actual epoch;
  old envelopes cannot cross worlds. No pointer observer persists across Load.
- cleanup/errors: real pointer observers are finished on all dispatch outcomes.
  Unexpected picker replacement fails without overwriting the new owner. Diagnostic
  failures stay in the envelope and invalidate evidence. Original application
  exceptions remain original errors and are fatal through harness error collection.

Campaign-only conversion/sermon/erosion/budget fields are intentionally excluded.
`attackBuildingId` supports model19 in the generic helper but is outside this
training/model3-only driver's acceptance; no building attack is claimed. Renderer
phase/mesh/UV observations stay in the independent RAF reader, never in an afterTurn
or synchronous-input cadence claim. Hardware/pixel/native full-lifecycle claims
remain excluded.

## Executed focused checks

The new suite executes the prepared input reader, accepted pointer wrapper,
actual preparation/finish closures and dispatch adapter against synthetic DOM/data,
including a five-turn delayed read after marker expiry. It tests entity training,
short queues, valid same-target input, absent/stale/wrong-cell/dispatch/epoch/owner
marker conditions, later queue slots, Load reset, command versus renderer priority,
detach ownership, diagnostic failure and original handler receiver/args/result/error.
Data-module assembly is checked for both tested roots and origins; no new relative
browser import exists. These are source/adapter tests, not another gameplay run.

Revision 5's 25 files and actual failed03 receipts remain immutable. This repair
cannot upgrade its missing marker into evidence. All pointsets, ordinary actions,
resource caps, Guard and Save/Load gates remain unchanged.
